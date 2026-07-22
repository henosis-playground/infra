#!/bin/sh
set -eu

credentials_file="${APP_CREDENTIALS_FILE:-/secrets/app-credentials.json}"
private_key_file="${PRIVATE_KEY_FILE:-/secrets/henosis-app.private-key.pem}"

export APP_ID="${APP_ID:-$(jq -r '.id' "$credentials_file")}"
export WEBHOOK_SECRET="${WEBHOOK_SECRET:-$(jq -r '.webhook_secret' "$credentials_file")}"
export PRIVATE_KEY="${PRIVATE_KEY:-$(cat "$private_key_file")}"

exec /bors "$@"
