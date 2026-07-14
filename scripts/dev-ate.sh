#!/usr/bin/env bash
# ATE local dev — http://localhost:3010/ate
set -euo pipefail
cd "$(dirname "$0")/.."

npm run sync:ate

cleanup() {
  kill "$API_PID" 2>/dev/null || true
  kill "$VITE_PID" 2>/dev/null || true
}
trap cleanup EXIT

npx tsx scripts/ate-api-dev.mts &
API_PID=$!

VITE_PORT=3010 DISABLE_HMR=true npx vite --port=3010 --host=127.0.0.1 &
VITE_PID=$!

echo ""
echo "   Open in Chrome: http://localhost:3010/ate"
echo ""

wait
