import uuid
import datetime
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from app.config import settings
from app.models.enums import IncidentType, Severity
from app.state.workspace import get_store

router = APIRouter()


class IncidentPatch(BaseModel):
    title: str | None = None
    description: str | None = None
    severity: str | None = None
    status: str | None = None
    rawDescription: str | None = None


class VisionRequest(BaseModel):
    image_base64: str


class VisionExtractedIncident(BaseModel):
    title: str
    description: str
    severity: Severity
    incidentType: IncidentType


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


@router.post("/incidents/vision")
def process_vision_incident(request: VisionRequest):
    if not settings.google_api_key:
        raise HTTPException(status_code=500, detail="Google API Key not configured")

    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        api_key=settings.google_api_key,
        temperature=0.0
    ).with_structured_output(VisionExtractedIncident)

    prompt = "Analyze this image and extract incident details: title, detailed description, severity (LOW, MEDIUM, HIGH, CRITICAL), and incidentType (TRAFFIC, MEDICAL, FIRE, SECURITY, INFRASTRUCTURE, OTHER). If it looks like a traffic issue, classify as TRAFFIC. If fire, FIRE, etc."

    try:
        msg = HumanMessage(
            content=[
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{request.image_base64}"}}
            ]
        )
        extracted = llm.invoke([msg])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision API error: {str(e)}")

    incident_id = f"inc_{uuid.uuid4().hex[:8]}"
    return {
        "incidentId": incident_id,
        "title": extracted.title,
        "description": extracted.description,
        "severity": extracted.severity.value if hasattr(extracted.severity, "value") else extracted.severity,
        "incidentType": extracted.incidentType.value if hasattr(extracted.incidentType, "value") else extracted.incidentType,
        "status": "OPEN",
        "sourceType": "VISION",
        "createdAt": datetime.datetime.utcnow().isoformat() + "Z"
    }
