#!/usr/bin/env bash
# SUPARAYS local dev — normal Chrome at http://localhost:3010/suparays
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ Syncing wiki…"
npm run sync:wiki

API_PID=""
cleanup() {
  if [[ -n "$API_PID" ]] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

export SUPARAYS_DEV_SKIP_AUTH=1

echo "→ Starting SUPARAYS API on port 3011…"
npx tsx scripts/suparays-api-dev.mts &
API_PID=$!
sleep 0.4

echo ""
echo "→ Starting Vite on http://localhost:3010"
echo "   Open in Chrome: http://localhost:3010/suparays"
echo "   Password: baha123"
echo ""

exec npx vite --port 3010 --host
