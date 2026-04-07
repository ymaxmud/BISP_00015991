from pydantic import BaseModel
from typing import Optional


class CaseAnalysisRequest(BaseModel):
    patient_name: str
    age: int
    gender: str
    symptoms: str
    duration: str
    severity: str
    history: str
    allergies: str
    medications: str
    uploaded_reports_text: Optional[str] = None


class CaseAnalysisResponse(BaseModel):
    summary: str
    extracted_facts: dict
    risk_level: str
    safety_alerts: list[str]
    suggestions: list[str]
    triage_notes: str


class MedicationSafetyRequest(BaseModel):
    current_medications: list[str]
    proposed_medications: list[str]
    allergies: list[str]


class MedicationSafetyResponse(BaseModel):
    alerts: list[dict]
    safe: bool
    recommendations: list[str]
