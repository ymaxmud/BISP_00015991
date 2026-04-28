"""
Generic clinical Q&A endpoint.

This is the LLM "playground" — a doctor (or test page) asks a free-form
clinical question and we return the model's answer. Used by the
AI test panel on the doctor dashboard.

If the LLM is unreachable (no key, rate limit, downtime) we fall back
to a polite "I can't answer that without the AI service" message so
the UI never crashes.
"""
from fastapi import APIRouter

from app.schemas.assistant import (
    AssistantAskRequest,
    AssistantAskResponse,
)
from app.services.llm import chat as llm_chat

router = APIRouter()


# Tone + safety guardrails for general clinical questions.
_SYSTEM_PROMPT = (
    "You are Avicenna, an AI clinical assistant helping a licensed doctor "
    "in Uzbekistan. Answer concisely (2-6 sentences) and in plain English. "
    "When relevant, mention typical reference ranges, common red flags, "
    "and standard next steps. Always remind the doctor that final clinical "
    "decisions are theirs. Never invent specific lab values."
)


@router.post("/ask", response_model=AssistantAskResponse)
def ask(req: AssistantAskRequest) -> AssistantAskResponse:
    history_dicts = (
        [{"role": t.role, "content": t.content} for t in (req.history or [])]
        if req.history
        else None
    )

    answer = llm_chat(
        system=_SYSTEM_PROMPT,
        user=req.question,
        history=history_dicts,
        temperature=0.3,
        max_tokens=500,
    )

    if answer:
        return AssistantAskResponse(answer=answer, used_llm=True)

    # Fallback: keep the response honest about why we can't answer fully.
    return AssistantAskResponse(
        answer=(
            "I can't answer that right now — the AI assistant is offline. "
            "Try again in a moment, or ask a colleague for clinical input."
        ),
        used_llm=False,
    )
