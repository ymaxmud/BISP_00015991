import re
from fastapi import APIRouter
from app.schemas.reports import (
    ReportAnalysisRequest, ReportAnalysisResponse,
    ReportChatRequest, ReportChatResponse,
)

router = APIRouter()

# Common lab reference ranges for detection
_LAB_PATTERNS = {
    r"hemoglobin[:\s]+(\d+\.?\d*)\s*(g/dl|g/l)": {"name": "Hemoglobin", "low": 12.0, "high": 17.5, "unit": "g/dL"},
    r"wbc[:\s]+(\d+\.?\d*)\s*(x?\s*10[\^³]?[/\s]*[uμ]?l?)": {"name": "WBC", "low": 4.0, "high": 11.0, "unit": "x10³/μL"},
    r"platelet[s]?[:\s]+(\d+\.?\d*)": {"name": "Platelets", "low": 150, "high": 400, "unit": "x10³/μL"},
    r"glucose[:\s]+(\d+\.?\d*)\s*(mg/dl)?": {"name": "Glucose", "low": 70, "high": 100, "unit": "mg/dL"},
    r"creatinine[:\s]+(\d+\.?\d*)\s*(mg/dl)?": {"name": "Creatinine", "low": 0.6, "high": 1.2, "unit": "mg/dL"},
    r"cholesterol[:\s]+(\d+\.?\d*)": {"name": "Total Cholesterol", "low": 0, "high": 200, "unit": "mg/dL"},
    r"hba1c[:\s]+(\d+\.?\d*)\s*%?": {"name": "HbA1c", "low": 4.0, "high": 5.7, "unit": "%"},
    r"alt[:\s]+(\d+\.?\d*)\s*(u/l|iu/l)?": {"name": "ALT", "low": 7, "high": 56, "unit": "U/L"},
    r"ast[:\s]+(\d+\.?\d*)\s*(u/l|iu/l)?": {"name": "AST", "low": 10, "high": 40, "unit": "U/L"},
    r"tsh[:\s]+(\d+\.?\d*)\s*(miu/l|uiu/ml)?": {"name": "TSH", "low": 0.4, "high": 4.0, "unit": "mIU/L"},
    r"potassium[:\s]+(\d+\.?\d*)\s*(meq/l|mmol/l)?": {"name": "Potassium", "low": 3.5, "high": 5.0, "unit": "mEq/L"},
    r"sodium[:\s]+(\d+\.?\d*)\s*(meq/l|mmol/l)?": {"name": "Sodium", "low": 136, "high": 145, "unit": "mEq/L"},
}

_MEDICAL_KEYWORDS = [
    "abnormal", "elevated", "low", "high", "positive", "negative",
    "borderline", "critical", "flagged", "out of range", "reactive",
    "detected", "not detected", "normal", "within limits",
]


@router.post("/report-analysis", response_model=ReportAnalysisResponse)
def report_analysis(req: ReportAnalysisRequest):
    text = req.report_text.lower()
    key_findings = []
    abnormal_values = []
    recommendations = []

    # Scan for lab values
    for pattern, info in _LAB_PATTERNS.items():
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                value = float(match.group(1))
                status = "normal"
                if value < info["low"]:
                    status = "low"
                    key_findings.append(f"{info['name']} is LOW: {value} {info['unit']} (ref: {info['low']}-{info['high']})")
                    abnormal_values.append({
                        "parameter": info["name"],
                        "value": value,
                        "unit": info["unit"],
                        "reference_range": f"{info['low']}-{info['high']}",
                        "status": "low",
                    })
                elif value > info["high"]:
                    status = "high"
                    key_findings.append(f"{info['name']} is HIGH: {value} {info['unit']} (ref: {info['low']}-{info['high']})")
                    abnormal_values.append({
                        "parameter": info["name"],
                        "value": value,
                        "unit": info["unit"],
                        "reference_range": f"{info['low']}-{info['high']}",
                        "status": "high",
                    })
                else:
                    key_findings.append(f"{info['name']}: {value} {info['unit']} (normal)")
            except (ValueError, IndexError):
                pass

    # Detect medical keywords for summary
    found_keywords = [kw for kw in _MEDICAL_KEYWORDS if kw in text]

    # Generate summary
    if abnormal_values:
        abnormal_names = [a["parameter"] for a in abnormal_values]
        summary = f"Report analysis identified {len(abnormal_values)} abnormal value(s): {', '.join(abnormal_names)}. "
        summary += "Doctor review recommended for flagged parameters."
        recommendations.append("Review abnormal values and correlate with clinical presentation")
        recommendations.append("Consider repeat testing to confirm abnormal findings")
        for av in abnormal_values:
            if av["status"] == "high":
                recommendations.append(f"Investigate elevated {av['parameter']}")
            else:
                recommendations.append(f"Investigate low {av['parameter']}")
    elif key_findings:
        summary = f"Report analysis found {len(key_findings)} parameter(s), all within normal range."
        recommendations.append("No immediate action required based on lab values")
        recommendations.append("Continue routine monitoring as per clinical guidelines")
    else:
        summary = "Unable to extract structured lab values from the report text. Manual review recommended."
        key_findings.append("No structured lab values detected in report")
        recommendations.append("Manually review the report for relevant findings")
        recommendations.append("Consider requesting a clearer or more structured report format")

    if req.patient_context:
        summary += f" Patient context: {req.patient_context}"

    return ReportAnalysisResponse(
        summary=summary,
        key_findings=key_findings,
        abnormal_values=abnormal_values,
        recommendations=recommendations,
    )


@router.post("/report-chat", response_model=ReportChatResponse)
def report_chat(req: ReportChatRequest):
    text_lower = req.report_text.lower()
    question_lower = req.question.lower()

    relevant_sections = []
    lines = req.report_text.split("\n")

    # Find relevant lines based on question keywords
    q_words = [w for w in question_lower.split() if len(w) > 3]
    for line in lines:
        line_lower = line.lower().strip()
        if not line_lower:
            continue
        if any(w in line_lower for w in q_words):
            relevant_sections.append(line.strip())

    # Generate contextual answer
    if "abnormal" in question_lower or "problem" in question_lower or "issue" in question_lower:
        abnormals = []
        for pattern, info in _LAB_PATTERNS.items():
            match = re.search(pattern, text_lower, re.IGNORECASE)
            if match:
                try:
                    value = float(match.group(1))
                    if value < info["low"] or value > info["high"]:
                        status = "low" if value < info["low"] else "high"
                        abnormals.append(f"{info['name']}: {value} {info['unit']} ({status})")
                except (ValueError, IndexError):
                    pass
        if abnormals:
            answer = f"The following abnormal values were found: {'; '.join(abnormals)}. These should be reviewed in the clinical context."
        else:
            answer = "No clearly abnormal lab values were identified in the report text."
    elif "normal" in question_lower:
        answer = "Values within reference ranges are considered normal. However, 'normal' should always be interpreted in the patient's clinical context."
    elif "recommend" in question_lower or "suggest" in question_lower or "next" in question_lower:
        answer = "Based on the report, consider correlating findings with clinical symptoms, repeating any borderline values, and consulting relevant specialists for abnormal results."
    else:
        if relevant_sections:
            answer = f"Based on the report, the relevant information is: {' | '.join(relevant_sections[:5])}."
        else:
            answer = "I could not find specific information matching your question in the report. Please try rephrasing or asking about specific parameters."

    return ReportChatResponse(
        answer=answer,
        relevant_sections=relevant_sections[:10],
    )
