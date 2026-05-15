"""Shared fixtures for all CityIRA backend tests.

Provides a fresh WorkspaceStore with NovaCivitas data loaded and 5 demo
incidents seeded before every test function. Also forces MOCK_LLM mode
so tests never hit a real API.
"""

import os
import pytest
from pathlib import Path

# Force mock mode BEFORE any app module is imported
os.environ["MOCK_LLM"] = "true"
os.environ["GOOGLE_API_KEY"] = ""

from app.bootstrap import DEMO_SAMPLES
from app.flows.ingest_flow import run_ingest
from app.llm.factory import reset_provider
from app.models.requests import IngestRequest
from app.state.workspace import init_store

DATA_PATH = Path(__file__).resolve().parents[1] / "app" / "data" / "novacivitas.json"


@pytest.fixture(autouse=True)
def fresh_store(monkeypatch):
    """Create a clean WorkspaceStore before every test.

    - Loads NovaCivitas city data (districts, roads, departments, resources)
    - Resets the LLM provider singleton so mock is always used
    - Patches `get_store()` globally so graph nodes pick up the test store
    """
    reset_provider()
    store = init_store(DATA_PATH)
    # Ensure a clean slate — no leftover incidents from prior tests
    store.incidents.clear()
    store.plans.clear()
    store.simulation_runs.clear()
    store.sequences.clear()
    store.last_plan_trace.clear()
    store.last_sim_trace.clear()
    store.trace_log.clear()
    yield store


@pytest.fixture
def seeded_store(fresh_store):
    """A WorkspaceStore pre-loaded with the 5 demo incidents."""
    store = fresh_store
    for sample in DEMO_SAMPLES:
        body = IngestRequest(**sample)
        incident, _, error, _ = run_ingest(store, body)
        assert error is None, f"Seeding failed: {error}"
    assert len(store.incidents) == 5
    return store
