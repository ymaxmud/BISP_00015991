"""Medical report analysis endpoints."""
from __future__ import annotations

import re
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.schemas.reports import (
    ReportAnalysisRequest,
    ReportAnalysisResponse,
    ReportChatRequest,
    ReportChatResponse,
    ReportUploadResponse,
)
from app.services.document_extractor import extract_document_text
from app.services.llm import chat as llm_chat

router = APIRouter()


# `_Analyte` is just a neat way to keep the parsing rules readable.
# Each instance says:
# - what we are looking for
# - how to recognize it in text
# - what normal range to compare it against
class _Analyte:
    def __init__(
        self,
        key: str,
        name: str,
        patterns: list[str],
        low: float,
        high: float,
        unit: str,
        low_hint: str = "",
        high_hint: str = "",
    ):
        self.key = key
        self.name = name
        self.patterns = [re.compile(p, re.IGNORECASE) for p in patterns]
        self.low = low
        self.high = high
        self.unit = unit
        self.low_hint = low_hint
        self.high_hint = high_hint


# They try to catch the common ways a value appears in exported lab reports.
_ANALYTES: list[_Analyte] = [
    _Analyte(
        "hemoglobin", "Hemoglobin",
        [r"h[ae]moglobin[:\s]+(\d+\.?\d*)"],
        12.0, 17.5, "g/dL",
        low_hint="May indicate anemia — check ferritin, B12, folate.",
        high_hint="May indicate polycythemia or dehydration.",
    ),
    _Analyte(
        "wbc", "White Blood Cell count",
        [r"\bwbc[:\s]+(\d+\.?\d*)", r"white\s*blood\s*cell[s]?[:\s]+(\d+\.?\d*)"],
        4.0, 11.0, "x10³/µL",
        low_hint="Leukopenia — consider infection, bone marrow suppression, autoimmune disease.",
        high_hint="Leukocytosis — consider infection, inflammation, leukemia.",
    ),
    _Analyte(
        "platelets", "Platelets",
        [r"platelet[s]?[:\s]+(\d+\.?\d*)", r"\bplt[:\s]+(\d+\.?\d*)"],
        150, 400, "x10³/µL",
        low_hint="Thrombocytopenia — bleeding risk; assess for ITP, liver disease.",
        high_hint="Thrombocytosis — reactive vs. essential; assess clotting risk.",
    ),
    _Analyte(
        "glucose", "Glucose (fasting)",
        [r"glucose[:\s]+(\d+\.?\d*)", r"fasting\s+glucose[:\s]+(\d+\.?\d*)"],
        70, 100, "mg/dL",
        low_hint="Hypoglycemia — rule out insulin/meds, sepsis, adrenal insufficiency.",
        high_hint="Consider impaired glucose tolerance or diabetes — confirm with HbA1c.",
    ),
    _Analyte(
        "hba1c", "HbA1c",
        [r"hba1c[:\s]+(\d+\.?\d*)", r"a1c[:\s]+(\d+\.?\d*)"],
        4.0, 5.7, "%",
        high_hint="≥6.5% meets diabetes criteria; 5.7–6.4% is prediabetes.",
    ),
    _Analyte(
        "creatinine", "Creatinine",
        [r"creatinine[:\s]+(\d+\.?\d*)"],
        0.6, 1.2, "mg/dL",
        high_hint="Check eGFR; assess for AKI or CKD progression.",
    ),
    _Analyte(
        "bun", "BUN",
        [r"\bbun[:\s]+(\d+\.?\d*)", r"urea\s+nitrogen[:\s]+(\d+\.?\d*)"],
        7, 20, "mg/dL",
        high_hint="Elevated BUN — consider dehydration, GI bleed, renal dysfunction.",
    ),
    _Analyte(
        "cholesterol_total", "Total Cholesterol",
        [r"total\s*cholesterol[:\s]+(\d+\.?\d*)", r"cholesterol,\s*total[:\s]+(\d+\.?\d*)"],
        0, 200, "mg/dL",
        high_hint="Hypercholesterolemia — assess 10-year ASCVD risk.",
    ),
    _Analyte(
        "ldl", "LDL Cholesterol",
        [r"\bldl[:\s]+(\d+\.?\d*)"],
        0, 100, "mg/dL",
        high_hint="Consider statin therapy based on ASCVD risk.",
    ),
    _Analyte(
        "hdl", "HDL Cholesterol",
        [r"\bhdl[:\s]+(\d+\.?\d*)"],
        40, 1000, "mg/dL",
        low_hint="Low HDL is an independent cardiovascular risk factor.",
    ),
    _Analyte(
        "triglycerides", "Triglycerides",
        [r"triglycerid[es]+[:\s]+(\d+\.?\d*)"],
        0, 150, "mg/dL",
        high_hint="Hypertriglyceridemia — assess for metabolic syndrome.",
    ),
    _Analyte(
        "tsh", "TSH",
        [r"\btsh[:\s]+(\d+\.?\d*)"],
        0.4, 4.0, "mIU/L",
        low_hint="Suppressed TSH — consider hyperthyroidism.",
        high_hint="Elevated TSH — consider hypothyroidism.",
    ),
    _Analyte(
        "alt", "ALT",
        [r"\balt[:\s]+(\d+\.?\d*)", r"sgpt[:\s]+(\d+\.?\d*)"],
        7, 56, "U/L",
        high_hint="Hepatocellular injury — review meds, hepatitis, NAFLD.",
    ),
    _Analyte(
        "ast", "AST",
        [r"\bast[:\s]+(\d+\.?\d*)", r"sgot[:\s]+(\d+\.?\d*)"],
        10, 40, "U/L",
        high_hint="Hepatic or muscle injury — correlate with ALT, CK.",
    ),
    _Analyte(
        "alp", "Alkaline phosphatase",
        [r"\balkaline\s+phosphatase[:\s]+(\d+\.?\d*)", r"\balp[:\s]+(\d+\.?\d*)"],
        44, 147, "U/L",
        high_hint="Cholestatic pattern — confirm with GGT.",
    ),
    _Analyte(
        "bilirubin", "Total bilirubin",
        [r"bilirubin[:\s]+(\d+\.?\d*)"],
        0.1, 1.2, "mg/dL",
        high_hint="Hyperbilirubinemia — assess direct vs. indirect fraction.",
    ),
    _Analyte(
        "sodium", "Sodium",
        [r"\bsodium[:\s]+(\d+\.?\d*)", r"\bna\+?[:\s]+(\d+\.?\d*)"],
        136, 145, "mEq/L",
        low_hint="Hyponatremia — assess volume status and SIADH risk.",
        high_hint="Hypernatremia — correct fluid deficit cautiously.",
    ),
    _Analyte(
        "potassium", "Potassium",
        [r"potassium[:\s]+(\d+\.?\d*)", r"\bk\+?[:\s]+(\d+\.?\d*)"],
        3.5, 5.0, "mEq/L",
        low_hint="Hypokalemia — arrhythmia risk; repl.",
        high_hint="Hyperkalemia — ECG + urgent management if >6.0.",
    ),
    _Analyte(
        "chloride", "Chloride",
        [r"chloride[:\s]+(\d+\.?\d*)", r"\bcl-?[:\s]+(\d+\.?\d*)"],
        96, 106, "mEq/L",
    ),
    _Analyte(
        "crp", "C-Reactive Protein",
        [r"\bcrp[:\s]+(\d+\.?\d*)", r"c[-\s]*reactive[:\s]+(\d+\.?\d*)"],
        0, 10, "mg/L",
        high_hint="Elevated CRP — active inflammation/infection.",
    ),
    _Analyte(
        "bp_sys", "Systolic blood pressure",
        [r"bp[:\s]+(\d{2,3})\s*/\s*\d+"],
        90, 130, "mmHg",
        high_hint="Hypertension — lifestyle + consider pharmacologic therapy.",
        low_hint="Hypotension — symptomatic?",
    ),
]


def _analyze_text(report_text: str, patient_context: Optional[str] = None) -> ReportAnalysisResponse:
    # This is the core parser. It scans the report, extracts whatever known
    # analytes it can find, then builds both a machine-friendly structure and
    # a short summary the frontend can show immediately.
    text = report_text or ""
    key_findings: list[str] = []
    abnormal_values: list[dict] = []
    recommendations: list[str] = []
    seen_keys: set[str] = set()

    for analyte in _ANALYTES:
        if analyte.key in seen_keys:
            continue
        value: Optional[float] = None
        for pattern in analyte.patterns:
            match = pattern.search(text)
            if match:
                try:
                    value = float(match.group(1))
                    break
                except (ValueError, IndexError):
                    continue
        if value is None:
            continue
        seen_keys.add(analyte.key)

        ref_range = f"{analyte.low}-{analyte.high} {analyte.unit}"
        if value < analyte.low:
            key_findings.append(
                f"{analyte.name} is LOW: {value} {analyte.unit} (ref: {ref_range})"
            )
            abnormal_values.append({
                "parameter": analyte.name,
                "value": value,
                "unit": analyte.unit,
                "reference_range": ref_range,
                "status": "low",
                "hint": analyte.low_hint,
            })
            if analyte.low_hint:
                recommendations.append(f"{analyte.name} low → {analyte.low_hint}")
        elif value > analyte.high:
            key_findings.append(
                f"{analyte.name} is HIGH: {value} {analyte.unit} (ref: {ref_range})"
            )
            abnormal_values.append({
                "parameter": analyte.name,
                "value": value,
                "unit": analyte.unit,
                "reference_range": ref_range,
                "status": "high",
                "hint": analyte.high_hint,
            })
            if analyte.high_hint:
                recommendations.append(f"{analyte.name} high → {analyte.high_hint}")
        else:
            key_findings.append(f"{analyte.name}: {value} {analyte.unit} (normal)")

    if abnormal_values:
        summary = (
            f"Detected {len(abnormal_values)} abnormal value(s): "
            f"{', '.join(a['parameter'] for a in abnormal_values)}."
        )
        recommendations.insert(
            0,
            "Correlate abnormal values with clinical presentation and consider confirmatory testing.",
        )
    elif key_findings:
        summary = (
            f"Identified {len(key_findings)} labelled parameter(s); "
            f"all are within reference range."
        )
        recommendations.append("No immediate follow-up indicated on the reported analytes.")
    else:
        summary = (
            "Unable to extract structured lab values from the report. "
            "Manual review recommended."
        )
        recommendations.append("Review the report manually for relevant findings.")

    if patient_context:
        summary += f" Patient context: {patient_context}"

    return ReportAnalysisResponse(
        summary=summary,
        key_findings=key_findings,
        abnormal_values=abnormal_values,
        recommendations=recommendations,
    )


@router.post("/report-analysis", response_model=ReportAnalysisResponse)
def report_analysis(req: ReportAnalysisRequest) -> ReportAnalysisResponse:
    return _analyze_text(req.report_text, req.patient_context)


@router.post("/report-upload", response_model=ReportUploadResponse)
async def report_upload(
    file: UploadFile = File(...),
    patient_context: Optional[str] = Form(None),
) -> ReportUploadResponse:
    # File uploads go through text extraction first. Once we have text, we run
    # exactly the same analysis logic as the raw-text endpoint.
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")
    try:
        extracted = extract_document_text(
            file_bytes,
            filename=file.filename,
            content_type=file.content_type,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not extracted.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract any text from the document. "
            "It may be a scanned PDF — OCR is not enabled.",
        )
    analysis = _analyze_text(extracted, patient_context)
    return ReportUploadResponse(
        filename=file.filename or "report",
        extracted_text=extracted,
        analysis=analysis,
    )


@router.post("/report-chat", response_model=ReportChatResponse)
def report_chat(req: ReportChatRequest) -> ReportChatResponse:
    report = req.report_text or ""
    question = (req.question or "").lower()

    analysis = _analyze_text(report)

    # For chat, we first try the LLM because natural follow-up questions are
    # hard to answer with plain keyword rules. We still ground it with the
    # structured findings so it stays tied to the actual report.
    abnormal_lines = "\n".join(
        f"- {av['parameter']}: {av['value']} {av['unit']} ({av['status']}, ref {av['reference_range']})"
        for av in analysis.abnormal_values
    ) or "(none flagged)"
    system_prompt = (
        "You are a clinical assistant helping a doctor interpret a lab report. "
        "Answer the doctor's question using ONLY the report text and the structured "
        "findings provided. Be concise (3-6 sentences). If the answer is not in "
        "the report, say so. Do not invent lab values."
    )
    user_prompt = (
        f"REPORT:\n{report[:6000]}\n\n"
        f"STRUCTURED FINDINGS:\nSummary: {analysis.summary}\n"
        f"Abnormal values:\n{abnormal_lines}\n\n"
        f"QUESTION: {req.question}"
    )
    llm_answer = llm_chat(
        system=system_prompt,
        user=user_prompt,
        history=req.chat_history if hasattr(req, "chat_history") else None,
    )

    relevant_sections: list[str] = []
    q_words = [w for w in question.split() if len(w) > 3]
    for line in report.split("\n"):
        line_str = line.strip()
        if not line_str:
            continue
        if any(w in line_str.lower() for w in q_words):
            relevant_sections.append(line_str)

    # If the LLM gives us something usable, prefer that answer and keep the
    # simpler fallback rules only as a backup path.
    if llm_answer:
        return ReportChatResponse(
            answer=llm_answer,
            relevant_sections=relevant_sections[:10],
        )

    # Everything below is the non-LLM fallback. It is more limited, but it
    # means the endpoint still answers basic questions even without OpenAI.
    if "abnormal" in question or "problem" in question or "issue" in question or "wrong" in question:
        if analysis.abnormal_values:
            detail = "; ".join(
                f"{av['parameter']} {av['value']} {av['unit']} ({av['status']})"
                for av in analysis.abnormal_values
            )
            answer = f"The following values are flagged: {detail}."
        else:
            answer = "No clearly abnormal lab values were identified."
    elif "recommend" in question or "next" in question or "do" in question:
        if analysis.recommendations:
            answer = "Suggested next steps: " + "; ".join(analysis.recommendations[:5])
        else:
            answer = "No specific recommendations beyond correlating with the clinical picture."
    elif "summary" in question or "overall" in question:
        answer = analysis.summary
    else:
        if relevant_sections:
            answer = (
                "Relevant excerpts from the report: "
                + " | ".join(relevant_sections[:5])
            )
        else:
            answer = (
                "I couldn't find a direct match for your question in the report. "
                "Try asking about a specific parameter (e.g. hemoglobin, glucose)."
            )

    return ReportChatResponse(
        answer=answer,
        relevant_sections=relevant_sections[:10],
    )
