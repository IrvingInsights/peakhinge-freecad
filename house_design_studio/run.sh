#!/usr/bin/env bash
# Start House Design Studio. Open http://localhost:8000 in your browser.
set -e
cd "$(dirname "$0")/.."

# Load .env if present.
if [ -f house_design_studio/.env ]; then
  set -a
  # shellcheck disable=SC1091
  . house_design_studio/.env
  set +a
fi

echo "Starting House Design Studio at http://localhost:8000 ..."
python3 -m uvicorn house_design_studio.backend.app:app --host 127.0.0.1 --port 8000
