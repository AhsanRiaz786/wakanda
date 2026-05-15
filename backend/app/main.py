from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.bootstrap import seed_if_empty
from app.config import settings
from app.state.workspace import init_store

DATA_PATH = Path(__file__).resolve().parent / "data" / "novacivitas.json"


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_store(DATA_PATH)
    seeded = seed_if_empty()
    if seeded:
        print(f"CityIRA: seeded {seeded} demo incidents (empty workspace)")
    yield


app = FastAPI(
    title="CityIRA API",
    description="City Incident-to-Response Routing Agent — LangGraph backend",
    version="0.1.0",
    lifespan=lifespan,
)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/v1")


@app.get("/")
def root():
    return {"name": "CityIRA", "docs": "/docs", "api": "/v1"}
