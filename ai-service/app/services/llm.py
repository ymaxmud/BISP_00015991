"""
Thin wrapper around the OpenAI Chat Completions API.

The rest of the service should call `chat()` and treat a `None` return as
"LLM unavailable, fall back to rule-based logic". That keeps every endpoint
working when the key is missing or the API call fails.
"""
from __future__ import annotations

import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

_client = None
_DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


def _get_client():
    global _client
    if _client is not None:
        return _client
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    try:
        from openai import OpenAI
        _client = OpenAI(api_key=api_key)
        return _client
    except Exception as exc:
        logger.warning("OpenAI client init failed: %s", exc)
        return None


def chat(
    system: str,
    user: str,
    history: Optional[list[dict]] = None,
    temperature: float = 0.2,
    max_tokens: int = 600,
) -> Optional[str]:
    """Return assistant text, or None if the LLM is unavailable."""
    client = _get_client()
    if client is None:
        return None
    messages: list[dict] = [{"role": "system", "content": system}]
    if history:
        for h in history:
            role = h.get("role")
            content = h.get("content")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": user})
    try:
        resp = client.chat.completions.create(
            model=_DEFAULT_MODEL,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return (resp.choices[0].message.content or "").strip() or None
    except Exception as exc:
        logger.warning("OpenAI chat call failed: %s", exc)
        return None
