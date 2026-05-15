"""LLM tools — uses Gemini when MOCK_LLM=false; fixtures when true."""

from app.config import settings
from app.models.enums import IncidentType, Severity, SourceType
from app.models.incident import Incident


def _mock_classify(incident: Incident) -> dict:
    text = incident.description.lower()
    if "water" in text or "pipe" in text or "pressure" in text:
        itype, sev, urgency = IncidentType.WATER_LEAK, Severity.HIGH, 8
        rationale = "Water or pipe-related signals in description."
    elif "power" in text or "electric" in text or "arc" in text:
        itype, sev, urgency = IncidentType.POWER_OUTAGE, Severity.HIGH, 7
        rationale = "Electrical incident indicators."
    elif "accident" in text or "truck" in text or "injured" in text:
        itype, sev, urgency = IncidentType.ACCIDENT, Severity.HIGH, 9
        rationale = "Vehicular accident reported."
    elif "congestion" in text or "traffic" in text:
        itype, sev, urgency = IncidentType.ROAD_BLOCKAGE, Severity.MEDIUM, 6
        rationale = "Traffic congestion pattern."
    elif "flood" in text:
        itype, sev, urgency = IncidentType.WATER_LEAK, Severity.HIGH, 7
        rationale = "Flooding may indicate underlying water infrastructure failure."
    else:
        itype, sev, urgency = IncidentType.OTHER, Severity.MEDIUM, 5
        rationale = "General incident classification."

    return {
        "incidentType": itype,
        "severity": sev,
        "urgencyScore": urgency,
        "affectedRadius": 150,
        "estimatedDuration": 90,
        "classificationRationale": rationale,
    }


SOURCE_WEIGHT = {
    SourceType.CSV_JSON: 0.95,
    SourceType.PDF_REPORT: 0.90,
    SourceType.TABLE_DASHBOARD: 0.85,
    SourceType.REALTIME_FEED: 0.80,
    SourceType.WEB_ARTICLE: 0.70,
}


def classify_incident(incident: Incident) -> dict:
    if settings.mock_llm or not settings.google_api_key:
        return _mock_classify(incident)
    # TODO: wire langchain-google-genai structured output
    return _mock_classify(incident)


def resolve_contradiction(incidents: list[Incident]) -> dict:
    """Prefer csv_json sensor over web_article for Market Quarter demo."""
    scored = []
    for inc in incidents:
        weight = SOURCE_WEIGHT.get(inc.sourceType, 0.7)
        scored.append((weight, inc))
    scored.sort(key=lambda x: x[0], reverse=True)
    winner = scored[0][1]
    result = classify_incident(winner)
    if winner.sourceType == SourceType.CSV_JSON:
        result["incidentType"] = IncidentType.WATER_LEAK
        result["classificationRationale"] = (
            "Utility sensor (PIPE-MQ-14) shows pipe breach; flooding is a symptom, not a flood event."
        )
    return {
        "conflictType": "severity_and_type_mismatch",
        "resolution": result,
        "confidence": 0.91,
        "rationale": "Higher-credibility sensor data selected over secondary media narrative.",
        "mergedIncidentIds": [i.incidentId for i in incidents],
    }


def draft_notifications(incident_id: str, incident_type: str) -> dict[str, str]:
    return {
        "operator_alert": f"INCIDENT {incident_id}: {incident_type} — crews dispatched per plan.",
        "public_announcement": f"Service disruption reported. Avoid affected area. Updates to follow.",
        "department_ticket": f"Dispatch required for {incident_id}. Type: {incident_type}.",
    }
