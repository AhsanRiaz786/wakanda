"""POST /plan — triggers triage plan graph or baseline keyword plan."""

from fastapi import APIRouter, HTTPException, Query

from app.graphs.triage_plan import build_graph
from app.models.requests import PlanRequest
from app.services.baseline import run_baseline_plan
from app.state.workspace import get_store

router = APIRouter()


@router.post("/plan")
async def create_plan(body: PlanRequest, mode: str = Query("agent")):
    try:
        if mode == "baseline":
            summary = run_baseline_plan(get_store(), body.incidentIds)
            return summary.model_dump(mode="json")

        graph = build_graph()
        result = await graph.ainvoke({"request": body, "trace_steps": []})

        plan_summary = result.get("plan_summary")
        if not plan_summary:
            raise HTTPException(
                status_code=500,
                detail={"code": "FLOW_EXECUTION_ERROR", "message": "Failed to generate plan"},
            )

        trace_steps = result.get("trace_steps", [])
        trace_logs = [f"[{step.stepId}] {step.name}... {step.outputSummary}" for step in trace_steps]
        plan_summary.trace_logs = trace_logs

        return plan_summary.model_dump(mode="json")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"code": "FLOW_EXECUTION_ERROR", "message": str(e)},
        )
