from fastapi import APIRouter
from app.schemas.triage import (
    SymptomRoutingRequest, SymptomRoutingResponse,
    IntakeSummaryRequest, IntakeSummaryResponse,
)
from app.agents.intake_summary_agent import IntakeSummaryAgent
from app.agents.risk_triage_agent import RiskTriageAgent
from app.services.medical_rules import get_specialty_from_symptoms, get_red_flags

router = APIRouter()
_intake_agent = IntakeSummaryAgent()
_triage_agent = RiskTriageAgent()


@router.post("/symptom-routing", response_model=SymptomRoutingResponse)
def symptom_routing(req: SymptomRoutingRequest):
    specialty = get_specialty_from_symptoms(req.symptoms)
    red_flags = get_red_flags(req.symptoms)

    triage = _triage_agent.assess(
        symptoms=req.symptoms,
        duration=req.duration,
        severity=req.severity,
        age=req.age,
        gender=req.gender,
    )

    actions = []
    if triage.urgency_level == "critical":
        actions.append("Seek immediate emergency care")
    elif triage.urgency_level == "high":
        actions.append("Schedule an urgent appointment today")
    else:
        actions.append(f"Book an appointment with a {specialty} specialist")

    if red_flags:
        actions.append("Inform the doctor about flagged symptoms immediately")

    return SymptomRoutingResponse(
        suggested_specialty=specialty,
        urgency_level=triage.urgency_level,
        red_flags=[f.split(":")[0] if ":" in f else f for f in red_flags],
        suggested_actions=actions,
    )


@router.post("/intake-summary", response_model=IntakeSummaryResponse)
def intake_summary(req: IntakeSummaryRequest):
    return _intake_agent.analyze(req)
