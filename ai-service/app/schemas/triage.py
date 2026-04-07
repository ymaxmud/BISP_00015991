from pydantic import BaseModel
from typing import Optional


class SymptomRoutingRequest(BaseModel):
    symptoms: str
    duration: str
    severity: str
    age: int
    gender: str


class SymptomRoutingResponse(BaseModel):
    suggested_specialty: str
    urgency_level: str
    red_flags: list[str]
    suggested_actions: list[str]


class IntakeSummaryRequest(BaseModel):
    symptoms: str
    duration: str
    severity: str
    history_text: str
    allergies_text: str
    medications_text: str
    patient_name: Optional[str] = None
    age: Optional[int] = None


class IntakeSummaryResponse(BaseModel):
    summary: str
    key_facts: list[str]
    missing_information: list[str]
    urgency_indicators: list[str]
