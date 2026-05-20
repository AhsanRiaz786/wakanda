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
import logging

from typing import TYPE_CHECKING

from app.config import settings
from app.llm.mock_provider import MockLLMProvider

if TYPE_CHECKING:
    from app.llm.protocol import LLMProvider
    from app.models.incident import Incident
    from app.llm.schemas import ClassificationResult, ResolvedConflict, NotificationDrafts

logger = logging.getLogger(__name__)

# Singleton cache — one provider instance per process (thread-safe for our use case)
_provider_instance: "LLMProvider | None" = None


class FailoverLLMProvider:
    """Routes requests through multiple providers, falling back sequentially."""

    def __init__(self, providers: list["LLMProvider"], fallback: "LLMProvider"):
        self.providers = providers
        self.fallback = fallback

    def classify(self, incident: "Incident") -> "ClassificationResult":
        for p in self.providers:
            try:
                return p.classify(incident)
            except Exception as e:
                logger.warning(f"Provider {p.__class__.__name__} failed to classify: {e}")
        logger.error("All active providers failed. Using dummy fallback.")
        return self.fallback.classify(incident)

    def resolve_contradiction(self, incidents: list["Incident"]) -> "ResolvedConflict":
        for p in self.providers:
            try:
                return p.resolve_contradiction(incidents)
            except Exception as e:
                logger.warning(f"Provider {p.__class__.__name__} failed to resolve: {e}")
        logger.error("All active providers failed. Using dummy fallback.")
        return self.fallback.resolve_contradiction(incidents)

    def draft_notifications(self, incident_id: str, incident_type: str) -> "NotificationDrafts":
        for p in self.providers:
            try:
                return p.draft_notifications(incident_id, incident_type)
            except Exception as e:
                logger.warning(f"Provider {p.__class__.__name__} failed to draft: {e}")
        logger.error("All active providers failed. Using dummy fallback.")
        return self.fallback.draft_notifications(incident_id, incident_type)


def get_llm_provider() -> "LLMProvider":
    """Return the active LLMProvider singleton."""
    global _provider_instance
    if _provider_instance is None:
        _provider_instance = _build_provider()
    return _provider_instance


def _build_provider() -> "LLMProvider":
    use_mock = settings.mock_llm

    if use_mock:
        return MockLLMProvider()

    providers: list["LLMProvider"] = []
    
    try:
        from app.llm.groq_provider import GroqLLMProvider
        if settings.groq_api_key:
            # Primary: Instant model
            providers.append(GroqLLMProvider(model=settings.llm_model, api_key=settings.groq_api_key))
            # Secondary: 70b model
            providers.append(GroqLLMProvider(model="llama-3.3-70b-versatile", api_key=settings.groq_api_key))
    except ImportError:
        pass

    try:
        from app.llm.gemini_provider import GeminiLLMProvider
        if settings.google_api_key:
            # Tertiary: Gemini model
            providers.append(GeminiLLMProvider(model="gemini-1.5-pro", api_key=settings.google_api_key))
    except ImportError:
        pass

    if not providers:
        return MockLLMProvider()
        
    return FailoverLLMProvider(providers=providers, fallback=MockLLMProvider())


def reset_provider() -> None:
    """Clear the singleton — used in tests to swap providers between cases."""
    global _provider_instance
    _provider_instance = None
