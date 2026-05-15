"""POST /simulate — runs simulation graph against a plan."""

from fastapi import APIRouter, HTTPException

from app.graphs.simulate import build_graph
from app.models.requests import SimulateRequest

router = APIRouter()


@router.post("/simulate")
async def simulate(body: SimulateRequest):
    try:
        graph = build_graph()
        result = await graph.ainvoke({"request": body, "trace_steps": []})

        # load_plan node sets error string if plan not found
        if result.get("error"):
            raise HTTPException(
                status_code=404,
                detail={"code": "PLAN_NOT_FOUND", "message": result["error"]},
            )

        sim_run = result.get("simulation_run")
        if not sim_run:
            raise HTTPException(
                status_code=500,
                detail={"code": "FLOW_EXECUTION_ERROR", "message": "Simulation produced no output"},
            )

        return sim_run.model_dump(mode="json")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"code": "FLOW_EXECUTION_ERROR", "message": str(e)},
        )
