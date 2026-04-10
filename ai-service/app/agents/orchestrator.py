"""
This file is the "glue" for the case-analysis flow.

Instead of the frontend calling four different AI helpers and trying to merge
everything itself, the orchestrator runs each agent in one place and builds a
single response that is easier for the doctor UI to render.

One important design choice here: every agent runs behind a safety wrapper.
So if one piece fails, we still return the rest of the analysis instead of
crashing the whole page.
"""
from __future__ import annotations

import logging

from app.agents.guideline_support_agent import GuidelineSupportAgent
from app.agents.intake_summary_agent import IntakeSummaryAgent
from app.agents.medication_safety_agent import MedicationSafetyAgent
from app.agents.risk_triage_agent import RiskTriageAgent
from app.schemas.case_analysis import CaseAnalysisRequest, CaseAnalysisResponse
from app.schemas.triage import IntakeSummaryRequest

logger = logging.getLogger(__name__)


class CaseOrchestrator:
    """Coordinates all AI agents and produces a merged analysis."""

    RISK_LEVELS = ("low", "medium", "high", "critical")

    def __init__(self):
        self.intake_agent = IntakeSummaryAgent()
        self.triage_agent = RiskTriageAgent()
        self.medication_agent = MedicationSafetyAgent()
        self.guideline_agent = GuidelineSupportAgent()

    # These small helpers keep the main analyze flow easier to read.
    def _max_risk(self, *levels: str) -> str:
        seen = [lvl for lvl in levels if lvl in self.RISK_LEVELS]
        if not seen:
            return "low"
        return max(seen, key=self.RISK_LEVELS.index)

    def _safe_run(self, name: str, fn, *args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except Exception as exc:  # pragma: no cover - defensive guard
            logger.exception("Agent %s failed: %s", name, exc)
            return None

    @staticmethod
    def _split_csv(text: str | None) -> list[str]:
        if not text:
            return []
        return [item.strip() for item in text.split(",") if item.strip()]

    # This is the main workflow: collect each agent's result, merge it, then
    # return one combined case-analysis object to the frontend.
    def analyze_case(self, request: CaseAnalysisRequest) -> CaseAnalysisResponse:
        safety_alerts: list[str] = []
        suggestions: list[str] = []

        # First we turn the raw intake data into a cleaner summary. This gives
        # the rest of the pipeline a more structured starting point.
        intake_result = self._safe_run(
            "intake",
            self.intake_agent.analyze,
            IntakeSummaryRequest(
                symptoms=request.symptoms,
                duration=request.duration,
                severity=request.severity,
                history_text=request.history,
                allergies_text=request.allergies,
                medications_text=request.medications,
                patient_name=request.patient_name,
                age=request.age,
            ),
        )
        if intake_result is None:
            safety_alerts.append("[System] Intake summary agent unavailable.")
            summary = (
                f"Patient {request.patient_name}, age {request.age}, presenting with "
                f"{request.symptoms} ({request.severity}, {request.duration})."
            )
            key_facts: list[str] = []
            missing_info: list[str] = []
            urgency_indicators: list[str] = []
        else:
            summary = intake_result.summary
            key_facts = list(intake_result.key_facts)
            missing_info = list(intake_result.missing_information)
            urgency_indicators = list(intake_result.urgency_indicators)

        # Next we estimate urgency. This is the part that decides whether the
        # case looks low, medium, high, or critical.
        triage_result = self._safe_run(
            "triage",
            self.triage_agent.assess,
            symptoms=request.symptoms,
            duration=request.duration,
            severity=request.severity,
            age=request.age,
            gender=request.gender,
            history=request.history,
        )
        if triage_result is None:
            safety_alerts.append("[System] Risk triage agent unavailable.")
            triage_level = "medium"
            red_flags: list[str] = []
            triage_notes = "Triage unavailable — please evaluate manually."
        else:
            triage_level = triage_result.urgency_level
            red_flags = list(triage_result.red_flags)
            triage_notes = triage_result.triage_notes

        # Then we check meds and allergies. Even if the main complaint looks
        # mild, unsafe medication combinations still need to be surfaced.
        med_result = self._safe_run(
            "medication",
            self.medication_agent.check,
            current_medications=self._split_csv(request.medications),
            proposed_medications=[],
            allergies=self._split_csv(request.allergies),
        )
        med_alerts: list[dict] = []
        med_safe = True
        med_recs: list[str] = []
        if med_result is None:
            safety_alerts.append("[System] Medication safety agent unavailable.")
        else:
            med_alerts = list(med_result.alerts)
            med_safe = med_result.safe
            med_recs = list(med_result.recommendations)

        for alert in med_alerts:
            if isinstance(alert, dict):
                alert_type = alert.get("type", "Warning")
                alert_msg = alert.get("message", str(alert))
            else:
                alert_type, alert_msg = "Warning", str(alert)
            safety_alerts.append(f"[Medication] {alert_type}: {alert_msg}")
        for indicator in urgency_indicators:
            safety_alerts.append(f"[Urgency] {indicator}")

        # Last, we add more "what should the doctor think about next?" style
        # guidance like tests, referrals, and follow-up ideas.
        guideline_result = self._safe_run(
            "guideline",
            self.guideline_agent.suggest,
            complaint=request.symptoms,
            history=request.history,
            extracted_facts={
                "age": request.age,
                "gender": request.gender,
                "severity": request.severity,
                "allergies": request.allergies,
                "medications": request.medications,
            },
        )
        if guideline_result is None:
            safety_alerts.append("[System] Guideline support agent unavailable.")
        else:
            suggestions.extend(guideline_result.suggested_tests)
            suggestions.extend(guideline_result.referral_suggestions)
            suggestions.extend(guideline_result.follow_up_recommendations)
            if guideline_result.next_questions:
                triage_notes += (
                    "\n\nSuggested questions: "
                    + "; ".join(guideline_result.next_questions)
                )
        for rec in med_recs:
            suggestions.append(f"[Medication Safety] {rec}")

        # If there is uploaded report text, we still surface a short preview.
        # This matters because sometimes the doctor should see that the patient
        # attached something useful even when we could not parse it neatly.
        if request.uploaded_reports_text:
            snippet = request.uploaded_reports_text.strip().splitlines()
            preview = " ".join(snippet[:5])[:400]
            suggestions.append(
                f"[Uploaded report] Review patient-submitted report: {preview}…"
            )

        # The final risk should be the highest important signal we saw, not an
        # average. One serious warning is enough to pull the overall risk up.
        overall_risk = triage_level
        if med_alerts:
            med_risk = "high" if len(med_alerts) > 1 else "medium"
            overall_risk = self._max_risk(overall_risk, med_risk)
        if urgency_indicators:
            urg_risk = "high" if len(urgency_indicators) > 2 else "medium"
            overall_risk = self._max_risk(overall_risk, urg_risk)

        extracted_facts = {
            "patient_name": request.patient_name,
            "age": request.age,
            "gender": request.gender,
            "chief_complaint": request.symptoms,
            "duration": request.duration,
            "severity": request.severity,
            "key_facts": key_facts,
            "missing_information": missing_info,
            "triage_level": triage_level,
            "red_flags": red_flags,
            "medication_safe": med_safe,
        }

        return CaseAnalysisResponse(
            summary=summary,
            extracted_facts=extracted_facts,
            risk_level=overall_risk,
            safety_alerts=safety_alerts,
            suggestions=suggestions,
            triage_notes=triage_notes,
        )
