import json
from copy import deepcopy
from pathlib import Path

from app.models.incident import Incident
from app.models.plan import PlanSummary
from app.models.simulation import CityState, SimulationRun


class WorkspaceStore:
    def __init__(self) -> None:
        self.incidents: list[Incident] = []
        self.departments: list[dict] = []
        self.resources: list[dict] = []
        self.road_segments: list[dict] = []
        self.location_lookup: list[dict] = []
        self.plans: dict[str, PlanSummary] = {}
        self.simulation_runs: dict[str, SimulationRun] = {}
        self.trace_log: list[dict] = []
        self.sequences: dict[str, int] = {}
        self.last_plan_trace: list[dict] = []
        self.last_sim_trace: list[dict] = []
        self.city_name: str = "Islamabad"

    def load_city_data(self, path: Path) -> None:
        data = json.loads(path.read_text(encoding="utf-8"))
        self.city_name = data.get("cityName", "Islamabad")
        self.departments = data.get("departments", [])
        self.resources = deepcopy(data.get("resources", []))
        self.road_segments = deepcopy(data.get("roadSegments", []))
        self.location_lookup = data.get("locationLookup", [])

    def get_open_incidents(self, incident_ids: list[str] | None = None) -> list[Incident]:
        open_status = {"reported", "triaged"}
        items = [i for i in self.incidents if i.status.value in open_status]
        if incident_ids:
            ids = set(incident_ids)
            items = [i for i in items if i.incidentId in ids]
        return items

    def upsert_incident(self, incident: Incident) -> None:
        for idx, existing in enumerate(self.incidents):
            if existing.incidentId == incident.incidentId:
                self.incidents[idx] = incident
                return
        self.incidents.append(incident)

    def get_incident(self, incident_id: str) -> Incident | None:
        for inc in self.incidents:
            if inc.incidentId == incident_id:
                return inc
        return None

    def save_plan(self, plan: PlanSummary) -> None:
        self.plans[plan.planId] = plan

    def get_plan(self, plan_id: str) -> PlanSummary | None:
        return self.plans.get(plan_id)

    def save_simulation(self, run: SimulationRun) -> None:
        self.simulation_runs[run.runId] = run

    def append_trace(self, entry: dict) -> None:
        self.trace_log.append(entry)

    def snapshot_city_state(self) -> CityState:
        return CityState(
            incidents=deepcopy(self.incidents),
            resources=deepcopy(self.resources),
            roadSegments=deepcopy(self.road_segments),
            notifications=[],
        )


_store: WorkspaceStore | None = None


def get_store() -> WorkspaceStore:
    if _store is None:
        raise RuntimeError("WorkspaceStore not initialized")
    return _store


def init_store(data_path: Path) -> WorkspaceStore:
    global _store
    _store = WorkspaceStore()
    _store.load_city_data(data_path)
    return _store
