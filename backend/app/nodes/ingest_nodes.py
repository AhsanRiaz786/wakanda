"""Ingest graph nodes — Eagle Phase 2.

Each node wraps a discrete step from ingest_flow and appends a trace entry.
All intermediate state keys are declared in IngestState.
"""

from typing import Optional
from typing import TypedDict

from app.flows import ingest_flow
from app.flows.ingest_flow import SOURCE_LABELS
from app.models.enums import IncidentStatus, IncidentType, Severity, TraceStepType
from app.models.incident import Coordinates, Incident
from app.models.requests import IngestRequest
from app.services.trace_builder import append_step
from app.state.workspace import get_store


class IngestState(TypedDict, total=False):
    # Input
    request: IngestRequest
    # Intermediate values accumulated across nodes
    normalized_timestamp: Optional[str]
    coordinates: Optional[Coordinates]
    requires_clarification: bool
    clean_description: Optional[str]
    incident_id: Optional[str]
    # Final outputs
    incident: Optional[Incident]
    is_duplicate: bool
    error: Optional[dict]
    trace_steps: list


# ---------------------------------------------------------------------------
# Node: validate_input  →  I01
# ---------------------------------------------------------------------------

def validate_input(state: IngestState) -> IngestState:
    trace: list = list(state.get("trace_steps") or [])
    error = ingest_flow.validate_input(state["request"])

    if error:
        append_step(
            trace,
            step_id="I01",
            name="Validate input",
            step_type=TraceStepType.STATE_UPDATE,
            output_summary=f"Validation failed: {error['message']}",
        )
        return {"error": error, "trace_steps": trace}

    append_step(
        trace,
        step_id="I01",
        name="Validate input",
        step_type=TraceStepType.STATE_UPDATE,
        output_summary="Validation passed",
    )
    return {"trace_steps": trace}


# ---------------------------------------------------------------------------
# Node: normalize_timestamp  →  I02
# ---------------------------------------------------------------------------

def normalize_timestamp(state: IngestState) -> IngestState:
    trace: list = list(state.get("trace_steps") or [])
    raw_ts = state["request"].rawTimestamp  # rawTimestamp is always present (Optional[str])
    norm_ts, actual_raw = ingest_flow.normalize_timestamp(raw_ts)

    summary = "Timestamp normalized"
    if norm_ts != actual_raw:
        summary = f"Unparseable timestamp '{actual_raw}' — fallback to system time"

    append_step(
        trace,
        step_id="I02",
        name="Normalize timestamp",
        step_type=TraceStepType.STATE_UPDATE,
        output_summary=summary,
    )
    return {"trace_steps": trace, "normalized_timestamp": norm_ts}


# ---------------------------------------------------------------------------
# Node: normalize_location  →  I03
# ---------------------------------------------------------------------------

def normalize_location(state: IngestState) -> IngestState:
    store = get_store()
    trace: list = list(state.get("trace_steps") or [])
    coords, req_clarification, matched, conf = ingest_flow.normalize_location(store, state["request"])

    if req_clarification:
        summary = f"Location clarification required (confidence: {conf:.2f})"
    else:
        summary = f"Location resolved: {matched or 'raw coordinates used'}"

    append_step(
        trace,
        step_id="I03",
        name="Normalize location",
        step_type=TraceStepType.STATE_UPDATE,
        output_summary=summary,
    )
    return {
        "trace_steps": trace,
        "coordinates": coords,
        "requires_clarification": bool(req_clarification),
    }


# ---------------------------------------------------------------------------
# Node: sanitize_description  →  I04
# ---------------------------------------------------------------------------

def sanitize_description(state: IngestState) -> IngestState:
    trace: list = list(state.get("trace_steps") or [])
    clean_desc = ingest_flow.sanitize_description(state["request"].rawDescription)

    append_step(
        trace,
        step_id="I04",
        name="Sanitize description",
        step_type=TraceStepType.STATE_UPDATE,
        output_summary=f"Description sanitized ({len(clean_desc)} chars)",
    )
    return {"trace_steps": trace, "clean_description": clean_desc}


# ---------------------------------------------------------------------------
# Node: assign_id  →  I05
# ---------------------------------------------------------------------------

def assign_incident_id(state: IngestState) -> IngestState:
    """Named assign_incident_id to avoid shadowing Python builtins."""
    store = get_store()
    trace: list = list(state.get("trace_steps") or [])
    inc_id = ingest_flow.assign_id(store)

    append_step(
        trace,
        step_id="I05",
        name="Assign ID",
        step_type=TraceStepType.STATE_UPDATE,
        output_summary=f"Assigned incident ID: {inc_id}",
    )
    return {"trace_steps": trace, "incident_id": inc_id}


# ---------------------------------------------------------------------------
# Node: persist_incident  →  I06
# ---------------------------------------------------------------------------

def persist_incident(state: IngestState) -> IngestState:
    store = get_store()
    trace: list = list(state.get("trace_steps") or [])

    norm_ts = state.get("normalized_timestamp") or ""
    clean_desc = state.get("clean_description") or state["request"].rawDescription[:2000]
    inc_id = state.get("incident_id") or ""
    coords = state.get("coordinates")
    req_clarification = bool(state.get("requires_clarification", False))

    incident = Incident(
        incidentId=inc_id,
        title=clean_desc[:80],
        description=clean_desc,
        rawDescription=state["request"].rawDescription,
        sourceType=state["request"].sourceType,
        sourceLabel=SOURCE_LABELS.get(state["request"].sourceType, "Unknown"),
        sourceMetadata=state["request"].sourceMetadata or {},
        coordinates=coords,
        requiresLocationClarification=req_clarification,
        imageUrl=state["request"].imageUrl,
        incidentType=IncidentType.UNKNOWN,
        severity=Severity.UNKNOWN,
        status=IncidentStatus.REPORTED,
        createdAt=norm_ts,
        updatedAt=norm_ts,
        normalizedAt=norm_ts,
    )

    saved_inc, is_duplicate = ingest_flow.persist_incident(store, incident)

    summary = (
        f"Duplicate detected — returning existing {saved_inc.incidentId}"
        if is_duplicate
        else f"Created incident {saved_inc.incidentId}"
    )
    append_step(
        trace,
        step_id="I06",
        name="Persist incident",
        step_type=TraceStepType.STATE_UPDATE,
        output_summary=summary,
    )
    return {"trace_steps": trace, "incident": saved_inc, "is_duplicate": is_duplicate}
