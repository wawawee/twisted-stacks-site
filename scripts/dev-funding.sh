#!/usr/bin/env bash
# Funding workbooks — http://localhost:3015/funding
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ Syncing funding workbooks…"
npm run sync:funding

API_PID=""
cleanup() {
  if [[ -n "$API_PID" ]] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

export FUNDING_DEV_SKIP_AUTH=1

echo "→ Starting Funding API on port 3014…"
npx tsx scripts/funding-api-dev.mts &
API_PID=$!
sleep 0.4

echo ""
echo "→ Starting Vite on http://localhost:3015"
echo "   Open: http://localhost:3015/funding"
echo "   Password: funding123 (or FUNDING_ROOM_PASSWORD in .env)"
echo "   Members: Per, Joachim, Tony"
echo ""

exec npx vite --port 3015 --host
