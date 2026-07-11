#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${ROOT_DIR}/dist"

mkdir -p "${DIST_DIR}"
cp "${ROOT_DIR}/frontend/malaria.html" "${DIST_DIR}/index.html"
cp "${ROOT_DIR}/frontend/malaria.html" "${DIST_DIR}/404.html"
cp "${ROOT_DIR}/frontend/malaria-app.js" "${DIST_DIR}/malaria-app.js"
cp "${ROOT_DIR}/frontend/malaria-engine.js" "${DIST_DIR}/malaria-engine.js"
cp "${ROOT_DIR}/frontend/malaria-styles.css" "${DIST_DIR}/malaria-styles.css"

echo "Static site built at ${DIST_DIR}"
