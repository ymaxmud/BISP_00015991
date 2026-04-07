from fastapi import APIRouter
from app.schemas.case_analysis import (
    CaseAnalysisRequest, CaseAnalysisResponse,
    MedicationSafetyRequest, MedicationSafetyResponse,
)
from app.agents.orchestrator import CaseOrchestrator
from app.agents.medication_safety_agent import MedicationSafetyAgent

router = APIRouter()
_orchestrator = CaseOrchestrator()
_med_agent = MedicationSafetyAgent()


@router.post("/case-analysis", response_model=CaseAnalysisResponse)
def case_analysis(req: CaseAnalysisRequest):
    return _orchestrator.analyze_case(req)


@router.post("/medication-safety", response_model=MedicationSafetyResponse)
def medication_safety(req: MedicationSafetyRequest):
    return _med_agent.check(
        current_medications=req.current_medications,
        proposed_medications=req.proposed_medications,
        allergies=req.allergies,
    )
