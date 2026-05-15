"""LLM provider factory — returns the correct LLMProvider based on settings.

Wave 0: returns MockLLMProvider only.
Wave 1 Agent A: extends this to return GeminiLLMProvider when conditions are met.

Rules:
  - MOCK_LLM=true  → MockLLMProvider (always)
  - GOOGLE_API_KEY missing → MockLLMProvider (safe fallback)
  - Else → GeminiLLMProvider(model, api_key)

Flows import: from app.llm import get_llm_provider
They do NOT import GeminiLLMProvider or MockLLMProvider directly.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.config import settings
from app.llm.mock_provider import MockLLMProvider

if TYPE_CHECKING:
    from app.llm.protocol import LLMProvider

# Singleton cache — one provider instance per process (thread-safe for our use case)
_provider_instance: "LLMProvider | None" = None


def get_llm_provider() -> "LLMProvider":
    """Return the active LLMProvider singleton.

    Agent A (Wave 1) will import GeminiLLMProvider here and replace the stub
    without touching any flow files.
    """
    global _provider_instance
    if _provider_instance is None:
        _provider_instance = _build_provider()
    return _provider_instance


def _build_provider() -> "LLMProvider":
    use_mock = settings.mock_llm or not settings.google_api_key

    if use_mock:
        return MockLLMProvider()

    try:
        from app.llm.groq_provider import GroqLLMProvider  # noqa: PLC0415

        if settings.groq_api_key:
            return GroqLLMProvider(
                model=settings.llm_model,
                api_key=settings.groq_api_key,
            )
            
        # Fallback to Gemini if groq_api_key not present
        from app.llm.gemini_provider import GeminiLLMProvider  # noqa: PLC0415
        return GeminiLLMProvider(
            model=settings.llm_model,
            api_key=settings.google_api_key,
        )
    except ImportError:
        # provider files not yet created or dependencies missing — fall back safely
        return MockLLMProvider()


def reset_provider() -> None:
    """Clear the singleton — used in tests to swap providers between cases."""
    global _provider_instance
    _provider_instance = None
