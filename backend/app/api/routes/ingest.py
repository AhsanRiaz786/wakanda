from fastapi import APIRouter, HTTPException

from app.graphs.ingest import build_graph
from app.models.requests import IngestRequest

router = APIRouter()


@router.post("/ingest")
async def ingest(body: IngestRequest):
    graph = build_graph()
    result = await graph.ainvoke({"request": body, "trace_steps": []})
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])
    return result["incident"]
