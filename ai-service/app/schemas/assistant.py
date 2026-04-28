"""
Schemas for the generic /assistant/ask endpoint.

Kept deliberately minimal — this is the "free-form Q&A" entrypoint
that the in-app AI playground panel uses. Anything more structured
(case analysis, medication safety, report analysis) has its own
dedicated router with stricter request/response models.
"""
from typing import Optional

from pydantic import BaseModel


class AssistantTurn(BaseModel):
    """One previous turn in a chat. Mirrors OpenAI's role/content shape."""

    role: str  # "user" or "assistant"
    content: str


class AssistantAskRequest(BaseModel):
    question: str
    # Optional rolling history so the playground can support back-and-forth.
    history: Optional[list[AssistantTurn]] = None


class AssistantAskResponse(BaseModel):
    answer: str
    used_llm: bool  # True when the OpenAI call succeeded; False on fallback.
