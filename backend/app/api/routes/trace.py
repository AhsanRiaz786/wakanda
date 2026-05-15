from fastapi import APIRouter, Query

from app.flows.trace_flow import run_trace
from app.state.workspace import get_store

router = APIRouter()


@router.get("/trace")
def get_trace(
    planId: str | None = None,
    includeSimTrace: bool = Query(True),
    depth: str = Query("full"),
):
    _ = depth  # reserved for summary mode
    return run_trace(get_store(), planId, includeSimTrace)
