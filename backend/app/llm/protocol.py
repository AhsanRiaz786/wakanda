"""LLMProvider structural subtyping protocol (PEP 544).

Flows and tools program against this interface only.
Neither GeminiLLMProvider nor MockLLMProvider is imported by flow modules.
"""

from typing import Protocol, runtime_checkable

from app.llm.schemas import ClassificationResult, NotificationDrafts, ResolvedConflict
from app.models.incident import Incident


@runtime_checkable
class LLMProvider(Protocol):
    """Stable public interface for all LLM backends.

    Adding a new provider (e.g. OpenAI) = new file + factory branch; zero flow edits.
    """

    def classify(self, incident: Incident) -> ClassificationResult:
        """Classify an incident into type, severity, urgency (plan.md §4.10.2)."""
        ...

    def resolve_contradiction(self, incidents: list[Incident]) -> ResolvedConflict:
        """Enrich a contradiction resolution with LLM rationale (plan.md §4.10.1).

        Winner selection is deterministic (contradiction.resolve_group).
        This method adds narrative rationale when provider is live.
        """
        ...

    def draft_notifications(
        self, incident_id: str, incident_type: str
    ) -> NotificationDrafts:
        """Draft operator / public / department notifications (plan.md §4.10.5)."""
        ...
