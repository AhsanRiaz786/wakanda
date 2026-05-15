"""IngestIncidentFlow — LangGraph-ready ingest pipeline."""

import re
from datetime import datetime, timezone

from app.models.enums import IncidentStatus, IncidentType, Severity, SourceType, TraceStepType
from app.models.incident import Coordinates, Incident
from app.models.requests import IngestRequest
from app.services import ids
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


def validate_input(body: IngestRequest) -> dict | None:
    if len(body.rawDescription.strip()) < 10:
        return {
            "code": "DESCRIPTION_REQUIRED",
            "message": "Description must be at least 10 characters",
        }
    return None


def normalize_timestamp(raw: str | None) -> tuple[str, str]:
    now_iso = datetime.now(timezone.utc).isoformat()
    if not raw:
        return now_iso, now_iso

    try:
        # validate ISO
        datetime.fromisoformat(raw.replace("Z", "+00:00"))
        return raw, raw
    except Exception:
        return now_iso, raw


def normalize_location(
    store: WorkspaceStore, body: IngestRequest
) -> tuple[Coordinates | None, bool, str | None, float]:
    lat, lng, matched, confidence = None, None, None, 1.0
    if body.rawCoordinates:
        lat, lng = body.rawCoordinates.get("lat"), body.rawCoordinates.get("lng")
    elif body.rawAddress:
        lat, lng, matched, confidence = geo_normalize(store, body.rawAddress)

    requires_clarification = lat is None or confidence < 0.3
    coords = Coordinates(lat=lat, lng=lng) if lat is not None and lng is not None else None

    return coords, requires_clarification, matched, confidence


def sanitize_description(raw: str) -> str:
    desc = re.sub(r"<[^>]+>", "", raw)
    desc = re.sub(r"\s+", " ", desc).strip()[:2000]
    return desc


def assign_id(store: WorkspaceStore) -> str:
    return ids.next_incident_id(store.sequences)


def persist_incident(store: WorkspaceStore, incident: Incident) -> tuple[Incident | None, bool]:
    # Duplicate check: same desc + coords <= 10 min
    inc_t = datetime.fromisoformat(incident.createdAt.replace("Z", "+00:00"))

    for existing in store.incidents:
        if existing.description == incident.description:
            if existing.coordinates and incident.coordinates:
                dist = abs(existing.coordinates.lat - incident.coordinates.lat) + abs(
                    existing.coordinates.lng - incident.coordinates.lng
                )
                if dist < 0.0001:  # extremely close
                    ex_t = datetime.fromisoformat(existing.createdAt.replace("Z", "+00:00"))
                    diff_mins = abs((inc_t - ex_t).total_seconds()) / 60.0
                    if diff_mins <= 10.0:
                        return existing, True
            elif not existing.coordinates and not incident.coordinates:
                # no coords for both but same desc
                ex_t = datetime.fromisoformat(existing.createdAt.replace("Z", "+00:00"))
                diff_mins = abs((inc_t - ex_t).total_seconds()) / 60.0
                if diff_mins <= 10.0:
                    return existing, True

    store.upsert_incident(incident)
    return incident, False


def run_ingest(
    store: WorkspaceStore, body: IngestRequest
) -> tuple[Incident | None, list[dict], dict | None, bool]:
    trace: list[dict] = []

    err = validate_input(body)
    if err:
        return None, trace, err, False

    append_step(
        trace,
        step_id="I01",
        name="Validate input",
        step_type=TraceStepType.STATE_UPDATE,
        output_summary="Validation passed",
    )

    norm_ts, raw_ts = normalize_timestamp(
        body.rawTimestamp if hasattr(body, "rawTimestamp") else None
    )
    coords, req_clarification, _, conf = normalize_location(store, body)
    clean_desc = sanitize_description(body.rawDescription)
    inc_id = assign_id(store)

    incident = Incident(
        incidentId=inc_id,
        title=clean_desc[:80],
        description=clean_desc,
        rawDescription=body.rawDescription,
        sourceType=body.sourceType,
        sourceLabel=SOURCE_LABELS.get(body.sourceType, "Unknown"),
        sourceMetadata=body.sourceMetadata or {},
        coordinates=coords,
        requiresLocationClarification=req_clarification,
        imageUrl=body.imageUrl,
        incidentType=IncidentType.UNKNOWN,
        severity=Severity.UNKNOWN,
        status=IncidentStatus.REPORTED,
        createdAt=norm_ts,
        updatedAt=norm_ts,
        normalizedAt=norm_ts,
    )

    saved_inc, is_duplicate = persist_incident(store, incident)

    if is_duplicate:
        append_step(
            trace,
            step_id="I02",
            name="Persist incident",
            step_type=TraceStepType.STATE_UPDATE,
            output_summary=f"Duplicate detected. Returning {saved_inc.incidentId}",
        )
    else:
        append_step(
            trace,
            step_id="I02",
            name="Persist incident",
            step_type=TraceStepType.STATE_UPDATE,
            output_summary=f"Created {saved_inc.incidentId}",
        )

    return saved_inc, trace, None, is_duplicate
