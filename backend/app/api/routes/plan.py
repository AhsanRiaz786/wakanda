from fastapi import APIRouter, Query

from app.graphs.triage_plan import build_graph
from app.models.requests import PlanRequest
from app.services.baseline import run_baseline_plan
from app.state.workspace import get_store

router = APIRouter()


@router.post("/plan")
async def create_plan(body: PlanRequest, mode: str = Query("agent")):
    if mode == "baseline":
        summary = run_baseline_plan(get_store(), body.incidentIds)
        return summary
    graph = build_graph()
    result = await graph.ainvoke({"request": body, "trace_steps": []})
    return result["plan_summary"]
