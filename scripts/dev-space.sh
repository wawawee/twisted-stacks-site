#!/usr/bin/env bash
# SPACE local dev — normal Chrome at http://localhost:3010/space
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ Syncing wiki…"
npm run sync:space

API_PID=""
cleanup() {
  if [[ -n "$API_PID" ]] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

export SPACE_DEV_SKIP_AUTH=1

echo "→ Starting SPACE API on port 3013…"
npx tsx scripts/space-api-dev.mts &
API_PID=$!
sleep 0.4

echo ""
echo "→ Starting Vite on http://localhost:3010"
echo "   Open in Chrome: http://localhost:3010/space"
echo "   Password: space123 (or SPACE_ROOM_PASSWORD)"
echo ""

exec npx vite --port 3010 --host
