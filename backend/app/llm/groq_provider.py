"""Groq provider using langchain-groq.

Implements LLMProvider with structured output.
"""

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq

from app.llm.base import invoke_with_retry
from app.llm.prompts import (
    CLASSIFIER_SYSTEM_PROMPT,
    CLASSIFIER_TEMPERATURE,
    NOTIFICATION_SYSTEM_PROMPT,
    NOTIFICATION_TEMPERATURE,
    RESOLVER_SYSTEM_PROMPT,
    RESOLVER_TEMPERATURE,
)
from app.llm.schemas import (
    ClassificationResult,
    NotificationDrafts,
    ResolvedConflict,
)
from app.models.enums import IncidentType, Severity
from app.models.incident import Incident


class GroqLLMProvider:
    """Groq LLM implementation for city agent APIs."""

    def __init__(self, model: str, api_key: str):
        self.classifier = ChatGroq(
            model=model,
            api_key=api_key,
            temperature=CLASSIFIER_TEMPERATURE,
            max_retries=0,
        ).with_structured_output(ClassificationResult)

        self.resolver = ChatGroq(
            model=model,
            api_key=api_key,
            temperature=RESOLVER_TEMPERATURE,
            max_retries=0,
        ).with_structured_output(ResolvedConflict)

        self.drafter = ChatGroq(
            model=model,
            api_key=api_key,
            temperature=NOTIFICATION_TEMPERATURE,
            max_retries=0,
        ).with_structured_output(NotificationDrafts)

    # ------------------------------------------------------------------
    # classify
    # ------------------------------------------------------------------

    def classify(self, incident: Incident) -> ClassificationResult:
        payload = (
            f"Incident ID: {incident.incidentId}\n"
            f"Description: {incident.description}\n"
            f"Source Type: {incident.sourceType}\n"
            f"Source Metadata: {incident.sourceMetadata}\n"
        )
        if incident.coordinates:
            payload += f"Coordinates: lat={incident.coordinates.lat}, lng={incident.coordinates.lng}\n"

        def _invoke() -> ClassificationResult:
            return self.classifier.invoke(
                [
                    SystemMessage(content=CLASSIFIER_SYSTEM_PROMPT),
                    HumanMessage(content=payload),
                ]
            )

        return invoke_with_retry(_invoke, fallback_fn=None)

    # ------------------------------------------------------------------
    # resolve_contradiction
    # ------------------------------------------------------------------

    def resolve_contradiction(self, incidents: list[Incident]) -> ResolvedConflict:
        # Pre-select winner using algorithm
        from app.tools.contradiction import resolve_group

        deterministic_resolution = resolve_group(incidents)

        payload = "Contradicting Incidents:\n"
        for inc in incidents:
            payload += (
                f"- ID: {inc.incidentId}, Source: {inc.sourceType}, "
                f"Type: {inc.incidentType}, Severity: {inc.severity}, "
                f"Age: {inc.createdAt}\n"
            )

        payload += f"\nAlgorithmic Winner ID: {deterministic_resolution.winning_incident_id}\n"

        def _invoke() -> ResolvedConflict:
            res = self.resolver.invoke(
                [
                    SystemMessage(content=RESOLVER_SYSTEM_PROMPT),
                    HumanMessage(content=payload),
                ]
            )
            # Ensure the LLM didn't invent a new winner
            if res.winning_incident_id != deterministic_resolution.winning_incident_id:
                res.winning_incident_id = deterministic_resolution.winning_incident_id
            
            deterministic_resolution.rationale = res.rationale
            deterministic_resolution.confidence = res.confidence
            deterministic_resolution.low_confidence_resolution = res.confidence < 0.6
            return deterministic_resolution

        return invoke_with_retry(_invoke, fallback_fn=None)

    # ------------------------------------------------------------------
    # draft_notifications
    # ------------------------------------------------------------------

    def draft_notifications(
        self, incident_id: str, incident_type: str
    ) -> NotificationDrafts:
        payload = f"Draft notifications for Incident {incident_id} of type {incident_type}."

        def _invoke() -> NotificationDrafts:
            return self.drafter.invoke(
                [
                    SystemMessage(content=NOTIFICATION_SYSTEM_PROMPT),
                    HumanMessage(content=payload),
                ]
            )

        return invoke_with_retry(_invoke, fallback_fn=None)
