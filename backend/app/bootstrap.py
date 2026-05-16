"""Load demo incidents when workspace is empty (dev/demo)."""

from app.flows.ingest_flow import run_ingest
from app.models.enums import SourceType
from app.models.requests import IngestRequest
from app.state.workspace import get_store

DEMO_SAMPLES = [
    {
        "sourceType": SourceType.PDF_REPORT,
        "rawDescription": (
            "FIELD INCIDENT REPORT — I-8 Industrial Sector (D-03). Electrical panel arcing near I-8 Service Road. Urgency HIGH."
        ),
        "rawCoordinates": {"lat": 33.7145, "lng": 73.0432},
        "rawTimestamp": "2026-05-18T08:32:00Z",
    },
    {
        "sourceType": SourceType.WEB_ARTICLE,
        "rawDescription": "F-8 Markaz flash flooding along F-8 Markaz Road. Knee-high water reported.",
        "rawCoordinates": {"lat": 33.7185, "lng": 73.0512},
        "rawTimestamp": "2026-05-18T08:52:00Z",
    },
    {
        "sourceType": SourceType.CSV_JSON,
        "rawDescription": "PIPE-MQ-14 pressure anomaly — major CDA water pipe breach at F-8 Markaz.",
        "rawCoordinates": {"lat": 33.7185, "lng": 73.0512},
        "rawTimestamp": "2026-05-18T09:08:00Z",
    },
    {
        "sourceType": SourceType.TABLE_DASHBOARD,
        "rawDescription": "Jinnah Avenue congestion 74%. VIP movement expected. Five open incidents.",
        "rawCoordinates": {"lat": 33.7205, "lng": 73.0478},
        "rawTimestamp": "2026-05-18T09:15:00Z",
    },
    {
        "sourceType": SourceType.REALTIME_FEED,
        "rawDescription": "Truck accident at Zero Point Interchange. Driver injured. Rescue 1122 requested.",
        "rawCoordinates": {"lat": 33.7215, "lng": 73.052},
        "rawTimestamp": "2026-05-18T09:12:00Z",
    },
    {
        "sourceType": SourceType.REALTIME_FEED,
        "rawDescription": "Strong smell of natural gas reported near Blue Area residential blocks. Evacuation might be needed.",
        "rawCoordinates": {"lat": 33.7250, "lng": 73.0600},
        "rawTimestamp": "2026-05-18T09:45:00Z",
    },
    {
        "sourceType": SourceType.CSV_JSON,
        "rawDescription": "SENSOR S-99: Hydrocarbon concentration spike at Blue Area grid 4.",
        "rawCoordinates": {"lat": 33.7250, "lng": 73.0600},
        "rawTimestamp": "2026-05-18T09:47:00Z",
    },
    {
        "sourceType": SourceType.WEB_ARTICLE,
        "rawDescription": "Fallen Oak tree completely blocking the intersection at 7th Avenue. Traffic rerouting.",
        "rawCoordinates": {"lat": 33.7050, "lng": 73.0300},
        "rawTimestamp": "2026-05-18T10:05:00Z",
    },
    {
        "sourceType": SourceType.TABLE_DASHBOARD,
        "rawDescription": "Metro Line A power failure. 3 trains stalled. System-wide delays.",
        "rawCoordinates": {"lat": 33.7300, "lng": 73.0800},
        "rawTimestamp": "2026-05-18T10:22:00Z",
    },
    {
        "sourceType": SourceType.REALTIME_FEED,
        "rawDescription": "Large unpermitted protest forming at F-9 Park South Gate. Crowd size approx 500.",
        "rawCoordinates": {"lat": 33.7100, "lng": 73.0200},
        "rawTimestamp": "2026-05-18T10:30:00Z",
    }
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
