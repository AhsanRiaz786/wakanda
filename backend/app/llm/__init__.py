"""app.llm — swappable LLM provider package (SOLID: Dependency Inversion).

Usage:
    from app.llm import get_llm_provider
    provider = get_llm_provider()
    result = provider.classify(incident)
"""

from app.llm.factory import get_llm_provider

__all__ = ["get_llm_provider"]
