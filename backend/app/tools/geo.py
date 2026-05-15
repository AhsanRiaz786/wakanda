from app.state.workspace import WorkspaceStore


def geo_normalize(store: WorkspaceStore, raw_address: str | None) -> tuple[float | None, float | None, str | None, float]:
    if not raw_address:
        return None, None, None, 0.0
    text = raw_address.lower()
    best = None
    for loc in store.location_lookup:
        if loc["name"].lower() in text or text in loc["name"].lower():
            best = loc
            break
    if not best:
        return None, None, None, 0.2
    return best["lat"], best["lng"], best["name"], 0.85
