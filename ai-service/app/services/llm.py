"""
Thin wrapper around any OpenAI-compatible chat completions API.

Why this exists: the rest of the AI service should call `chat()`
without worrying about SDK setup, missing keys, or transient errors.
If anything goes wrong — no API key, network blip, model downtime —
we return None on purpose. The caller then falls back to its own
rule-based logic, so the user still gets *some* answer instead of a
500.

The OpenAI Python SDK speaks the same protocol that several free /
cheaper providers expose (Groq, OpenRouter, Google Gemini's compat
endpoint, Ollama, ...). To switch providers you only set
`OPENAI_BASE_URL` and `OPENAI_MODEL` to whatever the provider
documents — no code changes needed.

Quick presets:

  OpenAI (paid):
    OPENAI_API_KEY  = sk-...
    OPENAI_MODEL    = gpt-3.5-turbo
    OPENAI_BASE_URL = (leave empty)

  Groq (free, fast):
    OPENAI_API_KEY  = gsk_...
    OPENAI_MODEL    = llama-3.1-8b-instant       (or llama-3.3-70b-versatile)
    OPENAI_BASE_URL = https://api.groq.com/openai/v1

  Google Gemini (free tier):
    OPENAI_API_KEY  = your-gemini-key
    OPENAI_MODEL    = gemini-1.5-flash
    OPENAI_BASE_URL = https://generativelanguage.googleapis.com/v1beta/openai/

  OpenRouter (mixed free + paid):
    OPENAI_API_KEY  = sk-or-...
    OPENAI_MODEL    = meta-llama/llama-3.1-8b-instruct:free
    OPENAI_BASE_URL = https://openrouter.ai/api/v1
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
_BASE_URL = os.getenv("OPENAI_BASE_URL") or None  # None = use OpenAI default


def _get_client():
    """Lazy-init the OpenAI-compatible client. Returns None if no API key is set."""
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
        # `base_url=None` makes the SDK use the official OpenAI endpoint;
        # any other URL points at a compatible provider (Groq, Gemini, ...).
        _client = OpenAI(api_key=api_key, base_url=_BASE_URL)
        return _client
    except Exception as exc:
        logger.warning("LLM client init failed: %s", exc)
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
        logger.warning("LLM chat call failed: %s", exc)
        return None
