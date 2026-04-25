#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SITE_DIR="$ROOT_DIR/dbeaver"
STATE_FILE="${RUNNER_TEMP:-/tmp}/deploy-state-cpanel"

: "${CPANEL_HOST:?CPANEL_HOST is required}"
: "${CPANEL_USER:?CPANEL_USER is required}"
: "${CPANEL_SSH_KEY:?CPANEL_SSH_KEY is required}"
: "${CPANEL_REMOTE_DIR:?CPANEL_REMOTE_DIR is required}"

mkdir -p "$(dirname "$STATE_FILE")"

echo "$CPANEL_SSH_KEY" > ~/.cpanel_deploy_key
chmod 600 ~/.cpanel_deploy_key

SSH_OPTS=(
  -i ~/.cpanel_deploy_key
  -o StrictHostKeyChecking=no
  -o UserKnownHostsFile=/dev/null
)

if [[ -f "$STATE_FILE" ]] && grep -q "sync_done=1" "$STATE_FILE"; then
  echo "[cpanel] Sync already marked complete. Skipping (resume-safe)."
  exit 0
fi

echo "[cpanel] Ensuring remote directory exists: $CPANEL_REMOTE_DIR"
ssh "${SSH_OPTS[@]}" "$CPANEL_USER@$CPANEL_HOST" "mkdir -p '$CPANEL_REMOTE_DIR'"

echo "[cpanel] Uploading site files via rsync..."
rsync -az --delete -e "ssh ${SSH_OPTS[*]}" \
  "$SITE_DIR/" "$CPANEL_USER@$CPANEL_HOST:$CPANEL_REMOTE_DIR/"

echo "sync_done=1" > "$STATE_FILE"
echo "[cpanel] Deploy completed."
