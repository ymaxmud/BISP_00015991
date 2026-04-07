"""
Case Orchestrator — runs all agents and merges their outputs into a single
unified CaseAnalysisResponse for the doctor.
"""

from app.agents.intake_summary_agent import IntakeSummaryAgent
from app.agents.risk_triage_agent import RiskTriageAgent
from app.agents.medication_safety_agent import MedicationSafetyAgent
from app.agents.guideline_support_agent import GuidelineSupportAgent
from app.schemas.case_analysis import CaseAnalysisRequest, CaseAnalysisResponse
from app.schemas.triage import IntakeSummaryRequest


class CaseOrchestrator:
    """Coordinates all AI agents and produces a merged analysis."""

    def __init__(self):
        self.intake_agent = IntakeSummaryAgent()
        self.triage_agent = RiskTriageAgent()
        self.medication_agent = MedicationSafetyAgent()
        self.guideline_agent = GuidelineSupportAgent()

    def analyze_case(self, request: CaseAnalysisRequest) -> CaseAnalysisResponse:
        # 1. Intake summary
        intake_req = IntakeSummaryRequest(
            symptoms=request.symptoms,
            duration=request.duration,
            severity=request.severity,
            history_text=request.history,
            allergies_text=request.allergies,
            medications_text=request.medications,
            patient_name=request.patient_name,
            age=request.age,
        )
        intake_result = self.intake_agent.analyze(intake_req)

        # 2. Risk triage (returns TriageResult dataclass)
        triage_result = self.triage_agent.assess(
            symptoms=request.symptoms,
            duration=request.duration,
            severity=request.severity,
            age=request.age,
            gender=request.gender,
            history=request.history,
        )

        # 3. Medication safety (returns MedicationSafetyResponse pydantic model)
        current_meds = [m.strip() for m in request.medications.split(",") if m.strip()] if request.medications else []
        med_result = self.medication_agent.check(
            current_medications=current_meds,
            proposed_medications=[],
            allergies=[a.strip() for a in request.allergies.split(",") if a.strip()] if request.allergies else [],
        )

        # 4. Guideline support (returns GuidelineResult dataclass)
        guideline_result = self.guideline_agent.suggest(
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

        # Merge safety alerts
        safety_alerts = []
        for alert in med_result.alerts:
            alert_type = alert.get("type", "Warning") if isinstance(alert, dict) else "Warning"
            alert_msg = alert.get("message", str(alert)) if isinstance(alert, dict) else str(alert)
            safety_alerts.append(f"[Medication] {alert_type}: {alert_msg}")
        for indicator in intake_result.urgency_indicators:
            safety_alerts.append(f"[Urgency] {indicator}")

        # Merge suggestions
        suggestions = []
        suggestions.extend(guideline_result.suggested_tests)
        suggestions.extend(guideline_result.referral_suggestions)
        suggestions.extend(guideline_result.follow_up_recommendations)
        for rec in med_result.recommendations:
            suggestions.append(f"[Medication Safety] {rec}")

        # Determine overall risk level (highest wins)
        risk_levels = ["low", "medium", "high", "critical"]
        overall_risk = triage_result.urgency_level

        if med_result.alerts:
            med_risk = "high" if len(med_result.alerts) > 1 else "medium"
            if risk_levels.index(med_risk) > risk_levels.index(overall_risk):
                overall_risk = med_risk

        if intake_result.urgency_indicators:
            urg_risk = "high" if len(intake_result.urgency_indicators) > 2 else "medium"
            if risk_levels.index(urg_risk) > risk_levels.index(overall_risk):
                overall_risk = urg_risk

        # Build extracted facts
        extracted_facts = {
            "patient_name": request.patient_name,
            "age": request.age,
            "gender": request.gender,
            "chief_complaint": request.symptoms,
            "duration": request.duration,
            "severity": request.severity,
            "key_facts": intake_result.key_facts,
            "missing_information": intake_result.missing_information,
            "triage_level": triage_result.urgency_level,
            "red_flags": triage_result.red_flags,
            "medication_safe": med_result.safe,
        }

        # Triage notes
        triage_notes = triage_result.triage_notes
        if guideline_result.next_questions:
            triage_notes += "\n\nSuggested questions: " + "; ".join(guideline_result.next_questions)

        return CaseAnalysisResponse(
            summary=intake_result.summary,
            extracted_facts=extracted_facts,
            risk_level=overall_risk,
            safety_alerts=safety_alerts,
            suggestions=suggestions,
            triage_notes=triage_notes,
        )
