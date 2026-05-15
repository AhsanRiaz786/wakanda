import math

from app.models.enums import IncidentType
from app.models.incident import Coordinates
from app.state.workspace import WorkspaceStore


def _distance(a: Coordinates, b_lat: float, b_lng: float) -> float:
    return math.sqrt((a.lat - b_lat) ** 2 + (a.lng - b_lng) ** 2)


def match_resources(
    store: WorkspaceStore,
    incident_coords: Coordinates | None,
    incident_type: IncidentType,
    departments: list[str],
    limit: int = 2,
) -> list[str]:
    if not incident_coords:
        return []
    candidates = []
    for res in store.resources:
        if res.get("status") != "available":
            continue
        if res.get("assignedDepartmentId") not in departments:
            continue
        skills = res.get("skills", [])
        if incident_type.value not in skills and incident_type != IncidentType.OTHER:
            continue
        hb = res["homeBase"]
        dist = _distance(incident_coords, hb["lat"], hb["lng"])
        candidates.append((dist, res["resourceId"]))
    candidates.sort(key=lambda x: x[0])
    return [c[1] for c in candidates[:limit]]
