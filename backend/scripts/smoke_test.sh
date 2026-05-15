#!/usr/bin/env bash
set -euo pipefail
BASE="${BASE_URL:-http://localhost:8000/v1}"

echo "==> Health"
curl -sf "$BASE/../health" || curl -sf "http://localhost:8000/v1/health"

echo "==> List incidents"
curl -sf "$BASE/incidents" | head -c 200
echo ""

echo "==> Plan"
PLAN=$(curl -sf -X POST "$BASE/plan" -H "Content-Type: application/json" -d '{"planMode":"full"}')
echo "$PLAN" | head -c 300
echo ""
PLAN_ID=$(echo "$PLAN" | python3 -c "import sys,json; print(json.load(sys.stdin)['planId'])")

echo "==> Simulate"
curl -sf -X POST "$BASE/simulate" -H "Content-Type: application/json" \
  -d "{\"planId\":\"$PLAN_ID\",\"overrides\":{\"forceApiFailure\":true}}" | head -c 200
echo ""

echo "==> Trace"
curl -sf "$BASE/trace?planId=$PLAN_ID" | head -c 200
echo ""
echo "Smoke test OK"
