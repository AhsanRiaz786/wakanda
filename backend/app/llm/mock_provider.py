"""MockLLMProvider — keyword-based fixture for MOCK_LLM=true / no API key.

Ports all _mock_* logic from the original llm_tools.py into a proper
LLMProvider implementation. Returns typed Pydantic models, not raw dicts.
"""

from app.llm.schemas import (
    ClassificationResult,
    NotificationDrafts,
    ResolvedConflict,
)
from app.models.enums import IncidentType, Severity, SourceType
from app.models.incident import Incident


# Credibility weights (mirrored from contradiction.py for mock coherence)
_SOURCE_WEIGHT: dict[SourceType, float] = {
    SourceType.CSV_JSON: 0.95,
    SourceType.PDF_REPORT: 0.90,
    SourceType.TABLE_DASHBOARD: 0.85,
    SourceType.REALTIME_FEED: 0.80,
    SourceType.WEB_ARTICLE: 0.70,
}


class MockLLMProvider:
    """Deterministic, offline LLM provider for development and testing."""

    # ------------------------------------------------------------------
    # classify
    # ------------------------------------------------------------------

    def classify(self, incident: Incident) -> ClassificationResult:
        text = incident.description.lower()

        if "water" in text or "pipe" in text or "pressure" in text:
            return ClassificationResult(
                incident_type=IncidentType.WATER_LEAK,
                severity=Severity.HIGH,
                urgency_score=8,
                reasoning="Water or pipe-related signals in description.",
            )
        if "power" in text or "electric" in text or "arc" in text:
            return ClassificationResult(
                incident_type=IncidentType.POWER_OUTAGE,
                severity=Severity.HIGH,
                urgency_score=7,
                reasoning="Electrical incident indicators.",
            )
        if "accident" in text or "truck" in text or "injured" in text:
            return ClassificationResult(
                incident_type=IncidentType.ACCIDENT,
                severity=Severity.HIGH,
                urgency_score=9,
                reasoning="Vehicular accident reported.",
            )
        if "congestion" in text or "traffic" in text:
            return ClassificationResult(
                incident_type=IncidentType.ROAD_BLOCKAGE,
                severity=Severity.MEDIUM,
                urgency_score=6,
                reasoning="Traffic congestion pattern.",
            )
        if "flood" in text:
            return ClassificationResult(
                incident_type=IncidentType.WATER_LEAK,
                severity=Severity.HIGH,
                urgency_score=7,
                reasoning="Flooding may indicate underlying water infrastructure failure.",
            )

        return ClassificationResult(
            incident_type=IncidentType.OTHER,
            severity=Severity.MEDIUM,
            urgency_score=5,
            reasoning="General incident — no strong keyword signal.",
        )

    # ------------------------------------------------------------------
    # resolve_contradiction
    # ------------------------------------------------------------------

    def resolve_contradiction(self, incidents: list[Incident]) -> ResolvedConflict:
        """Pick winner by source weight; enrich with mock rationale."""
        if not incidents:
            raise ValueError("resolve_contradiction requires at least one incident")

        scored = sorted(
            incidents,
            key=lambda inc: _SOURCE_WEIGHT.get(inc.sourceType, 0.7),
            reverse=True,
        )
        winner = scored[0]
        loser_weight = _SOURCE_WEIGHT.get(scored[-1].sourceType, 0.7) if len(scored) > 1 else 0.0
        winner_weight = _SOURCE_WEIGHT.get(winner.sourceType, 0.7)
        score_gap = winner_weight - loser_weight
        confidence = min(0.5 + score_gap * 2.0, 0.99)

        classification = self.classify(winner)

        return ResolvedConflict(
            winning_incident_id=winner.incidentId,
            resolution=classification.to_incident_dict(),
            confidence=round(confidence, 2),
            low_confidence_resolution=confidence < 0.6,
            rationale=(
                f"Source '{winner.sourceType}' (weight={winner_weight:.2f}) "
                f"selected over lower-credibility sources. "
                f"Mock provider — no LLM narrative."
            ),
            merged_incident_ids=[i.incidentId for i in incidents],
        )

    # ------------------------------------------------------------------
    # draft_notifications
    # ------------------------------------------------------------------

    def draft_notifications(self, incident_id: str, incident_type: str) -> NotificationDrafts:
        return NotificationDrafts(
            operator_alert=(
                f"INCIDENT {incident_id}: {incident_type.upper()} — "
                "crews dispatched per response plan. Monitor status dashboard."
            ),
            public_announcement=(
                f"Service disruption reported ({incident_type.replace('_', ' ')}). "
                "Avoid the affected area. Updates to follow."
            ),
            department_ticket=(
                f"Dispatch required for {incident_id}. "
                f"Type: {incident_type}. Confirm receipt and ETA."
            ),
        )
