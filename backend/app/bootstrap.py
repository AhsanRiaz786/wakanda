"""Load demo incidents when workspace is empty (dev/demo)."""

from app.flows.ingest_flow import run_ingest
from app.models.enums import SourceType
from app.models.requests import IngestRequest
from app.state.workspace import get_store

DEMO_SAMPLES = [
    {
        "sourceType": SourceType.PDF_REPORT,
        "rawDescription": (
            "FIELD INCIDENT REPORT — Industrial Zone (D-03). Electrical panel arcing. Urgency HIGH."
        ),
        "rawCoordinates": {"lat": 33.7145, "lng": 73.0432},
        "rawTimestamp": "2026-05-18T08:32:00Z",
    },
    {
        "sourceType": SourceType.WEB_ARTICLE,
        "rawDescription": "Market Quarter flash flooding along Market Street. Knee-high water reported.",
        "rawCoordinates": {"lat": 33.7185, "lng": 73.0512},
        "rawTimestamp": "2026-05-18T08:52:00Z",
    },
    {
        "sourceType": SourceType.CSV_JSON,
        "rawDescription": "PIPE-MQ-14 pressure anomaly — major pipe breach at Market Quarter.",
        "rawCoordinates": {"lat": 33.7185, "lng": 73.0512},
        "rawTimestamp": "2026-05-18T09:08:00Z",
    },
    {
        "sourceType": SourceType.TABLE_DASHBOARD,
        "rawDescription": "Main Boulevard congestion 74%. Five open incidents.",
        "rawCoordinates": {"lat": 33.7205, "lng": 73.0478},
        "rawTimestamp": "2026-05-18T09:15:00Z",
    },
    {
        "sourceType": SourceType.REALTIME_FEED,
        "rawDescription": "Truck accident Central Flyover. Driver injured. Ambulance requested.",
        "rawCoordinates": {"lat": 33.7215, "lng": 73.052},
        "rawTimestamp": "2026-05-18T09:12:00Z",
    },
]


def seed_if_empty() -> int:
    store = get_store()
    if store.incidents:
        return 0
    count = 0
    for sample in DEMO_SAMPLES:
        body = IngestRequest(**sample)
        incident, _, error, _ = run_ingest(store, body)
        if error:
            raise RuntimeError(error)
        count += 1
    return count
