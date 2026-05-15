from fastapi import APIRouter, HTTPException, Query

from app.state.workspace import get_store

router = APIRouter()


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
