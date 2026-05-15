# CityIRA

**City Incident-to-Response Routing Agent** — Google Antigravity Hackathon, Challenge 1.

Autonomous content-to-action system for synthetic city operations: ingest fragmented incident signals, plan coordinated responses with LangGraph agents, simulate outcomes, and show transparent reasoning traces in a mobile ops app.

## Documentation (single source of truth)

| Document | Purpose |
|----------|---------|
| [plan.md](./plan.md) | Full PRD + technical specification |
| [planmvp.md](./planmvp.md) | MVP build guide + Antigravity artifact manifest |
| [AGENTS.md](./AGENTS.md) | Instructions for AI coding agents |

## Repository structure

```
wakanda/
├── plan.md                 # Full spec
├── planmvp.md              # MVP + hackathon verification
├── backend/                # FastAPI + LangGraph (runtime)
├── mobile/                 # Expo React Native (UI)
└── docs/
    ├── antigravity/        # IDE proof for judges
    └── evidence/           # Exported runtime traces
```

## Quick start

### Backend

```bash
cd backend
uv sync
cp .env.example .env
uv run python scripts/seed_demo_incidents.py
uv run uvicorn app.main:app --reload --port 8000
```

API: http://localhost:8000/v1 · OpenAPI: http://localhost:8000/docs

### Mobile

```bash
cd mobile
cp .env.example .env   # set EXPO_PUBLIC_API_BASE_URL to your LAN IP
npm install
npm start
```

Use a physical device or emulator with `EXPO_PUBLIC_API_BASE_URL=http://<YOUR_LAN_IP>:8000/v1` (not `localhost` on device).

## Antigravity (hackathon)

- **Built with** Google Antigravity IDE — artifacts in `docs/antigravity/`
- **Runtime** LangGraph graphs behind FastAPI (FAQ Q4 compliant)
- Submit: product demo (3–5 min) + Antigravity usage video (2–3 min) + traces

## License

MIT — see [LICENSE](./LICENSE).
