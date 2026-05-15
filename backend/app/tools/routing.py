from app.models.enums import IncidentType


def route_departments(incident_type: IncidentType) -> list[str]:
    mapping = {
        IncidentType.WATER_LEAK: ["DEPT-UTIL", "DEPT-TRAFFIC"],
        IncidentType.POWER_OUTAGE: ["DEPT-POWER"],
        IncidentType.ROAD_BLOCKAGE: ["DEPT-TRAFFIC", "DEPT-WORKS"],
        IncidentType.ACCIDENT: ["DEPT-EMER", "DEPT-TRAFFIC"],
        IncidentType.OTHER: ["DEPT-GEN"],
    }
    return mapping.get(incident_type, ["DEPT-GEN"])
