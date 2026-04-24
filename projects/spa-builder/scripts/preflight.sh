#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SITE_DIR="$ROOT_DIR/spa-builder"

if [[ -z "$TARGET" ]]; then
  echo "Usage: $0 <target>"
  echo "Targets: dry-run | github-pages | cpanel-sftp | cloudflare-pages"
  exit 1
fi

fail() {
  echo "[preflight] ERROR: $1" >&2
  exit 1
}

require_file() {
  local f="$1"
  [[ -f "$f" ]] || fail "Missing required file: $f"
}

require_env() {
  local v="$1"
  [[ -n "${!v:-}" ]] || fail "Missing required env var: $v"
}

echo "[preflight] Running checks for target: $TARGET"
require_file "$SITE_DIR/index.html"

# Quick content sanity check
if ! grep -q "dBeaver" "$SITE_DIR/index.html"; then
  echo "[preflight] WARN: 'dBeaver' branding not found in index.html"
fi

case "$TARGET" in
  dry-run)
    echo "[preflight] Dry-run target selected. No provider credentials required."
    ;;
  github-pages)
    echo "[preflight] GitHub Pages selected. Repo permissions handled by workflow."
    ;;
  cpanel-sftp)
    require_env "CPANEL_HOST"
    require_env "CPANEL_USER"
    require_env "CPANEL_SSH_KEY"
    require_env "CPANEL_REMOTE_DIR"
    ;;
  cloudflare-pages)
    require_env "CLOUDFLARE_API_TOKEN"
    require_env "CLOUDFLARE_ACCOUNT_ID"
    require_env "CLOUDFLARE_PAGES_PROJECT"
    ;;
  *)
    fail "Unsupported target '$TARGET'"
    ;;
esac

echo "[preflight] All checks passed for target: $TARGET"
