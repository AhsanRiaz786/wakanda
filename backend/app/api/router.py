from fastapi import APIRouter

from app.api.routes import health, incidents, ingest, plan, simulate, trace, voice

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(ingest.router, tags=["ingest"])
api_router.include_router(plan.router, tags=["plan"])
api_router.include_router(simulate.router, tags=["simulate"])
api_router.include_router(trace.router, tags=["trace"])
api_router.include_router(incidents.router, tags=["incidents"])
api_router.include_router(voice.router, tags=["voice"])
