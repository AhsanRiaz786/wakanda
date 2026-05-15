from fastapi import APIRouter, HTTPException

from app.graphs.simulate import build_graph
from app.models.requests import SimulateRequest

router = APIRouter()


@router.post("/simulate")
async def simulate(body: SimulateRequest):
    graph = build_graph()
    try:
        result = await graph.ainvoke({"request": body, "trace_steps": []})
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return result["simulation_run"]
