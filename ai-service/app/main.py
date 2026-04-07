"""
Avicenna AI Service — FastAPI entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import triage, case_analysis, reports

app = FastAPI(
    title="Avicenna AI Service",
    description="Clinical decision support — symptom routing, triage, medication safety, and report analysis",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(triage.router, prefix="/api", tags=["Triage"])
app.include_router(case_analysis.router, prefix="/api", tags=["Case Analysis"])
app.include_router(reports.router, prefix="/api", tags=["Reports"])


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "avicenna-ai"}
