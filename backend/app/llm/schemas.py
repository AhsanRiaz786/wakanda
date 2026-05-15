"""LLM Pydantic schemas — plan.md §4.10.3.

All flow functions and LLM providers communicate via these models.
Flows NEVER import langchain or google-genai directly; they use these types.
"""

from typing import Any

from pydantic import BaseModel, Field

from app.models.enums import IncidentType, Severity


# ---------------------------------------------------------------------------
# Core LLM output models
# ---------------------------------------------------------------------------


class ClassificationResult(BaseModel):
    """Output of LLMProvider.classify()."""

    incident_type: IncidentType = IncidentType.OTHER
    severity: Severity = Severity.MEDIUM
    urgency_score: int = Field(default=5, ge=1, le=10)
    affected_radius: int = Field(default=150, description="metres")
    estimated_duration: int = Field(default=90, description="minutes")
    confidence: float = Field(default=0.7, ge=0.0, le=1.0)
    reasoning: str = "Classification based on available signals."

    # ---- helpers -----------------------------------------------------------

    def to_incident_dict(self) -> dict[str, Any]:
        """Convert to the dict shape plan_flow / ingest_flow expect on Incident fields."""
        return {
            "incidentType": self.incident_type,
            "severity": self.severity,
            "urgencyScore": self.urgency_score,
            "affectedRadius": self.affected_radius,
            "estimatedDuration": self.estimated_duration,
            "classificationRationale": self.reasoning,
        }


class ResolvedConflict(BaseModel):
    """Output of LLMProvider.resolve_contradiction() / contradiction.resolve_group()."""

    winning_incident_id: str
    conflict_type: str = "type_and_severity_mismatch"
    resolution: dict[str, Any] = Field(default_factory=dict)
    confidence: float = Field(default=0.7, ge=0.0, le=1.0)
    low_confidence_resolution: bool = False
    rationale: str = "Higher-credibility source selected."
    merged_incident_ids: list[str] = Field(default_factory=list)

    def to_legacy_dict(self) -> dict[str, Any]:
        """Convert to the shape stored on Incident.resolvedConflict (camelCase)."""
        return {
            "conflictType": self.conflict_type,
            "resolution": self.resolution,
            "confidence": self.confidence,
            "lowConfidenceResolution": self.low_confidence_resolution,
            "rationale": self.rationale,
            "mergedIncidentIds": self.merged_incident_ids,
        }


class NotificationDrafts(BaseModel):
    """Output of LLMProvider.draft_notifications()."""

    operator_alert: str = ""
    public_announcement: str = Field(default="", max_length=280)
    department_ticket: str = ""

    def to_legacy_dict(self) -> dict[str, str]:
        """Convert to the dict shape stored on Incident.notificationDrafts."""
        return {
            "operator_alert": self.operator_alert,
            "public_announcement": self.public_announcement,
            "department_ticket": self.department_ticket,
        }


class ContradictionGroup(BaseModel):
    """A cluster of incidents that contradict each other (plan.md §4.10.1)."""

    incident_ids: list[str]
    distance_m: float = Field(description="Haversine distance between the two closest incidents")
    age_diff_minutes: float = Field(description="Age difference between oldest and newest")
    conflict_reason: str = Field(
        description="Why these are contradictory: type_mismatch | severity_mismatch | both"
    )
