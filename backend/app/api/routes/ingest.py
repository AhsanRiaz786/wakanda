"""POST /ingest — accepts incident data, runs ingest graph, returns created Incident."""

from fastapi import APIRouter, HTTPException

from app.graphs.ingest import build_graph
from app.models.requests import IngestRequest

router = APIRouter()


@router.post("/ingest")
async def ingest(body: IngestRequest):
    try:
        graph = build_graph()
        result = await graph.ainvoke({"request": body, "trace_steps": []})

        # Validation failure (e.g. DESCRIPTION_REQUIRED, INVALID_SOURCE_TYPE)
        if result.get("error"):
            error = result["error"]
            code = error.get("code", "")
            if code == "DUPLICATE_INCIDENT":
                raise HTTPException(status_code=409, detail=error)
            raise HTTPException(status_code=400, detail=error)

        # Graph succeeded but returned a duplicate (is_duplicate=True, no error dict)
        if result.get("is_duplicate"):
            inc = result.get("incident")
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "DUPLICATE_INCIDENT",
                    "message": "Incident already exists within the last 10 minutes",
                    "existingIncidentId": inc.incidentId if inc else None,
                },
            )

        incident = result.get("incident")
        if not incident:
            raise HTTPException(
                status_code=500,
                detail={
                    "code": "FLOW_EXECUTION_ERROR",
                    "message": "No incident returned from graph",
                },
            )

        return incident.model_dump(mode="json")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"code": "FLOW_EXECUTION_ERROR", "message": str(e)},
        )
