# CityIRA — Agent instructions

**Single source of truth**

| File | Use |
|------|-----|
| [plan.md](./plan.md) | Full PRD: screens, APIs, datasets, demo script |
| [planmvp.md](./planmvp.md) | MVP scope, LangGraph flows, Antigravity artifact manifest |

**Repo layout**

- `backend/` — FastAPI + LangGraph (runtime orchestrator)
- `mobile/` — Expo React Native (presentation only)
- `docs/antigravity/` — IDE proof for hackathon judges
- `docs/evidence/` — exported runtime traces

**Rules**

1. No business logic in `mobile/`.
2. Implement flows per `planmvp.md` §3; details in `plan.md` §4–8.
3. Every LangGraph node must append trace steps.
4. Run `backend/scripts/smoke_test.sh` before marking backend complete.

**Quick start**

```bash
cd backend && uv sync && cp .env.example .env
uv run python scripts/seed_demo_incidents.py
uv run uvicorn app.main:app --reload --port 8000

cd mobile && cp .env.example .env && npm install && npm start
```
