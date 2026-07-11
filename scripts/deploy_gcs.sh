#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUCKET_NAME="${GCS_BUCKET_NAME:-malariaframe-jisong-dev}"

"${ROOT_DIR}/scripts/build_static_site.sh"

gcloud storage cp \
  --cache-control="no-cache, max-age=0" \
  --content-type="text/html; charset=utf-8" \
  "${ROOT_DIR}/dist/index.html" \
  "gs://${BUCKET_NAME}/index.html"

gcloud storage cp \
  --cache-control="no-cache, max-age=0" \
  --content-type="text/html; charset=utf-8" \
  "${ROOT_DIR}/dist/404.html" \
  "gs://${BUCKET_NAME}/404.html"

gcloud storage cp \
  --cache-control="public, max-age=300, must-revalidate" \
  --content-type="text/javascript; charset=utf-8" \
  "${ROOT_DIR}/dist/malaria-app.js" \
  "${ROOT_DIR}/dist/malaria-engine.js" \
  "gs://${BUCKET_NAME}/"

gcloud storage cp \
  --cache-control="public, max-age=300, must-revalidate" \
  --content-type="text/css; charset=utf-8" \
  "${ROOT_DIR}/dist/malaria-styles.css" \
  "gs://${BUCKET_NAME}/malaria-styles.css"

echo "Uploaded MalariaFrame static assets to gs://${BUCKET_NAME}"
