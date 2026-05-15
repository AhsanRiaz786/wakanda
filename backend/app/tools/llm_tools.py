"""LLM tools — stable public facade used by Eagle's nodes and Shaka's tests.

Flows and nodes import from here; they NEVER import GeminiLLMProvider directly.
Function signatures are frozen — do not rename or change return shapes.

Wave 0: classify_incident + draft_notifications delegate to factory.
        resolve_contradiction still uses legacy scoring (Agent A wires to provider).
Agent A: wires resolve_contradiction to provider.resolve_contradiction().
"""

from app.llm.factory import get_llm_provider
from app.models.incident import Incident

# SOURCE_WEIGHT kept here for backward-compat imports in plan_flow / simulate_flow
from app.models.enums import SourceType

SOURCE_WEIGHT: dict[SourceType, float] = {
    SourceType.CSV_JSON: 0.95,
    SourceType.PDF_REPORT: 0.90,
    SourceType.TABLE_DASHBOARD: 0.85,
    SourceType.REALTIME_FEED: 0.80,
    SourceType.WEB_ARTICLE: 0.70,
}


def classify_incident(incident: Incident) -> dict:
    """Classify an incident. Returns a dict compatible with Incident field names.

    Delegates to the active LLMProvider (mock or Gemini).
    Return shape:
        {
            "incidentType": IncidentType,
            "severity": Severity,
            "urgencyScore": int,
            "affectedRadius": int,
            "estimatedDuration": int,
            "classificationRationale": str,
        }
    """
    result = get_llm_provider().classify(incident)
    return result.to_incident_dict()


def resolve_contradiction(incidents: list[Incident]) -> dict:
    """Resolve a contradiction group. Returns a dict compatible with Incident.resolvedConflict.

    Agent A: delegates to provider.resolve_contradiction() which enriches rationale via LLM.
    Winner selection is deterministic.

    Return shape:
        {
            "conflictType": str,
            "resolution": dict,
            "confidence": float,
            "lowConfidenceResolution": bool,
            "rationale": str,
            "mergedIncidentIds": list[str],
        }
    """
    result = get_llm_provider().resolve_contradiction(incidents)
    return result.to_legacy_dict()


def draft_notifications(incident_id: str, incident_type: str) -> dict[str, str]:
    """Draft operator / public / department notifications.

    Delegates to the active LLMProvider.
    Return shape: {"operator_alert": str, "public_announcement": str, "department_ticket": str}
    """
    result = get_llm_provider().draft_notifications(incident_id, incident_type)
    return result.to_legacy_dict()
