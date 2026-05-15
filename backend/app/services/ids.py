from datetime import datetime, timezone


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d")


def next_incident_id(sequences: dict[str, int]) -> str:
    sequences["INC"] = sequences.get("INC", 0) + 1
    return f"INC-{_today()}-{sequences['INC']:04d}"


def next_plan_id(sequences: dict[str, int]) -> str:
    sequences["PLAN"] = sequences.get("PLAN", 0) + 1
    return f"PLAN-{_today()}-{sequences['PLAN']:04d}"


def next_sim_id(sequences: dict[str, int]) -> str:
    sequences["SIM"] = sequences.get("SIM", 0) + 1
    return f"SIM-{_today()}-{sequences['SIM']:04d}"


def next_trace_id(sequences: dict[str, int]) -> str:
    sequences["TRACE"] = sequences.get("TRACE", 0) + 1
    return f"TRACE-{_today()}-{sequences['TRACE']:04d}"
