from pydantic import BaseModel
from typing import Optional


class ReportAnalysisRequest(BaseModel):
    report_text: str
    patient_context: Optional[str] = None


class ReportAnalysisResponse(BaseModel):
    summary: str
    key_findings: list[str]
    abnormal_values: list[dict]
    recommendations: list[str]


class ReportUploadResponse(BaseModel):
    filename: str
    extracted_text: str
    analysis: ReportAnalysisResponse


class ReportChatRequest(BaseModel):
    report_text: str
    question: str
    chat_history: Optional[list[dict]] = None


class ReportChatResponse(BaseModel):
    answer: str
    relevant_sections: list[str]
