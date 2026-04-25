"""
This file is a very small wrapper around OpenAI.

The main idea is simple: the rest of the AI service should call `chat()`
without worrying about SDK setup or crash handling. If OpenAI is not
configured, or the request fails, we quietly return `None` so the caller can
fall back to the normal rule-based logic instead of breaking the whole feature.
"""
from __future__ import annotations

import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

_client = None
_DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")


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
    """Try to get a text answer from the LLM.

    If anything goes wrong, we return `None` on purpose. That way the caller
    can keep going with a safer fallback instead of throwing a user-facing
    error just because the model call failed.
    """
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
