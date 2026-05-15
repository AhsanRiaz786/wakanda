# CityIRA Backend

FastAPI + LangGraph runtime for CityIRA. See [plan.md](../plan.md) and [planmvp.md](../planmvp.md).

## Setup

```bash
uv sync
cp .env.example .env
# Set GOOGLE_API_KEY when MOCK_LLM=false
uv run python scripts/seed_demo_incidents.py
uv run uvicorn app.main:app --reload --port 8000
```

## Smoke test

```bash
./scripts/smoke_test.sh
```

API base: `http://localhost:8000/v1`
