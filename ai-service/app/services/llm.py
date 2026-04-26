"""
Thin wrapper around OpenAI.

Why this exists: the rest of the AI service should call `chat()`
without worrying about SDK setup, missing keys, or transient errors.
If anything goes wrong — no API key, network blip, model downtime —
we return None on purpose. The caller then falls back to its own
rule-based logic, so the user still gets *some* answer instead of a
500.

Model defaults to gpt-3.5-turbo to keep latency and cost low. Override
with the OPENAI_MODEL env var if you want gpt-4o or anything else.
"""
from __future__ import annotations

import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

# Cached client instance — building one is cheap but not free, and the
# OpenAI SDK is happy to be reused across requests.
_client = None
_DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")


def _get_client():
    """Lazy-init the OpenAI client. Returns None if no API key is set."""
    global _client
    if _client is not None:
        return _client
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        # No key — caller will fall back to deterministic rules. This is
        # the expected dev-mode path when you don't want to burn quota.
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

    Args:
        system: System prompt — the role/tone instructions.
        user:   The current user message.
        history: Optional list of prior {role, content} turns to keep
                 a conversation context (used by report-chat).
        temperature: 0.2 keeps answers grounded; raise for creativity.
        max_tokens: Hard cap on output length.

    Returns the response string, or None on any failure. The None
    return is intentional — pages should treat it as "fall back" not
    as an error to surface.
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
        # Don't propagate — log and let the caller fall back. Common
        # causes: rate limit, model downtime, malformed prompt.
        logger.warning("OpenAI chat call failed: %s", exc)
        return None
