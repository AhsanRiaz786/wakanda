"""Re-seed demo incidents (standalone; server also auto-seeds on startup)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.bootstrap import DEMO_SAMPLES, seed_if_empty
from app.flows.ingest_flow import run_ingest
from app.models.requests import IngestRequest
from app.state.workspace import init_store

DATA_PATH = Path(__file__).resolve().parents[1] / "app" / "data" / "novacivitas.json"


def main() -> None:
    store = init_store(DATA_PATH)
    store.incidents.clear()
    for sample in DEMO_SAMPLES:
        body = IngestRequest(**sample)
        incident, _, error, _ = run_ingest(store, body)
        if error:
            raise RuntimeError(error)
        print(f"Seeded {incident.incidentId} ({body.sourceType})")
    print(f"Done. {len(store.incidents)} incidents in workspace.")
    print("Note: restart uvicorn to pick up seeds in the running API process.")


if __name__ == "__main__":
    main()
