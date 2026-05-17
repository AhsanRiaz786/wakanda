from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.state.workspace import get_store

router = APIRouter()


class IncidentPatch(BaseModel):
    title: str | None = None
    description: str | None = None
    severity: str | None = None
    status: str | None = None
    rawDescription: str | None = None


@router.get("/incidents")
def list_incidents(status: str | None = Query(None), page: int = 1, pageSize: int = 50):
    store = get_store()
    items = store.incidents
    if status:
        allowed = {s.strip() for s in status.split(",")}
        items = [i for i in items if i.status.value in allowed]
    start = (page - 1) * pageSize
    end = start + pageSize
    return {"incidents": items[start:end], "total": len(items), "page": page, "pageSize": pageSize}


@router.get("/incidents/{incident_id}")
def get_incident(incident_id: str):
    inc = get_store().get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc


@router.patch("/incidents/{incident_id}")
def update_incident(incident_id: str, patch: IncidentPatch):
    """Partially update an incident's title, description, severity or status."""
    updated = get_store().patch_incident(incident_id, patch.model_dump(exclude_none=True))
    if updated is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    return updated


@router.delete("/incidents/{incident_id}")
def delete_incident(incident_id: str):
    """Remove an incident from the workspace by ID."""
    deleted = get_store().delete_incident(incident_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"deleted": True, "incidentId": incident_id}
