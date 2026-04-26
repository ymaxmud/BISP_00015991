"""
Avicenna AI Service — FastAPI entry point.

This is its own service (default port 8001) deliberately separated
from Django. Two reasons:
  1. The LLM calls are slow and chatty; isolating them stops a stuck
     OpenAI request from wedging the main API workers.
  2. We can deploy / scale / restart it independently of Django.

Routers live in `app/routers/` — one per feature area:
  - triage         → symptom routing, intake summary
  - case_analysis  → case analysis, medication safety
  - reports        → lab/imaging report analysis + chat-with-report

Every endpoint reaches the LLM through `app/services/llm.py`, which
falls back to deterministic rules when OPENAI_API_KEY is missing so
the service always responds with something useful.
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import triage, case_analysis, reports

app = FastAPI(
    title="Avicenna AI Service",
    description="Clinical decision support — symptom routing, triage, medication safety, and report analysis",
    version="1.0.0",
)

# CORS_ALLOWED_ORIGINS is a comma-separated list set in Railway env.
# Locally we default to the Next.js dev server.
cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:3000",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All public endpoints sit under /api/* so the Next.js proxy at
# /api/ai/[...path] just forwards the path verbatim.
app.include_router(triage.router, prefix="/api", tags=["Triage"])
app.include_router(case_analysis.router, prefix="/api", tags=["Case Analysis"])
app.include_router(reports.router, prefix="/api", tags=["Reports"])


@app.get("/health")
def health_check():
    """Lightweight liveness probe used by Railway and the Next.js proxy."""
    return {"status": "ok", "service": "avicenna-ai"}
