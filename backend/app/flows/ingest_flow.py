"""IngestIncidentFlow — LangGraph-ready ingest pipeline."""

import re
from datetime import datetime, timezone

from app.models.enums import IncidentStatus, IncidentType, Severity, SourceType, TraceStepType
from app.models.incident import Coordinates, Incident
from app.models.requests import IngestRequest
from app.services import ids
from app.models.enums import TraceStepType
from app.services.trace_builder import append_step
from app.state.workspace import WorkspaceStore
from app.tools.geo import geo_normalize

SOURCE_LABELS = {
    SourceType.PDF_REPORT: "PDF Report",
    SourceType.WEB_ARTICLE: "Web Article",
    SourceType.CSV_JSON: "Data Feed",
    SourceType.TABLE_DASHBOARD: "Dashboard",
    SourceType.REALTIME_FEED: "Live Feed",
}


def run_ingest(store: WorkspaceStore, body: IngestRequest) -> tuple[Incident | None, list[dict], dict | None]:
    trace: list[dict] = []
    now = datetime.now(timezone.utc).isoformat()

    if len(body.rawDescription.strip()) < 10:
        return None, trace, {"code": "DESCRIPTION_REQUIRED", "message": "Description must be at least 10 characters"}

    append_step(
        trace,
        step_id="I01",
        name="Validate input",
        step_type=TraceStepType.STATE_UPDATE,
        output_summary="Validation passed",
    )

    lat, lng, matched, confidence = None, None, None, 1.0
    if body.rawCoordinates:
        lat, lng = body.rawCoordinates.get("lat"), body.rawCoordinates.get("lng")
    elif body.rawAddress:
        lat, lng, matched, confidence = geo_normalize(store, body.rawAddress)

    requires_clarification = lat is None or confidence < 0.3
    coords = Coordinates(lat=lat, lng=lng) if lat is not None and lng is not None else None

    desc = re.sub(r"<[^>]+>", "", body.rawDescription)
    desc = re.sub(r"\s+", " ", desc).strip()[:2000]

    incident_id = ids.next_incident_id(store.sequences)
    incident = Incident(
        incidentId=incident_id,
        title=desc[:80],
        description=desc,
        rawDescription=body.rawDescription,
        sourceType=body.sourceType,
        sourceLabel=SOURCE_LABELS[body.sourceType],
        sourceMetadata=body.sourceMetadata or {},
        coordinates=coords,
        requiresLocationClarification=requires_clarification,
        imageUrl=body.imageUrl,
        incidentType=IncidentType.UNKNOWN,
        severity=Severity.UNKNOWN,
        status=IncidentStatus.REPORTED,
        createdAt=now,
        updatedAt=now,
        normalizedAt=now,
    )
    store.upsert_incident(incident)

    append_step(
        trace,
        step_id="I02",
        name="Persist incident",
        step_type=TraceStepType.STATE_UPDATE,
        output_summary=f"Created {incident_id}",
    )
    return incident, trace, None
