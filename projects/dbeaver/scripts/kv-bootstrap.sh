#!/usr/bin/env bash
# kv-bootstrap.sh — provisions DH_KV namespace and binds it to the Pages project.
#
# Idempotent: re-running is safe. If the namespace exists, it's reused; if the
# Pages binding exists, it's left alone.
#
# Required env: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
# Optional env: CLOUDFLARE_PAGES_PROJECT (default: dh-beaver)
#               DH_KV_NAMESPACE_TITLE    (default: dh-beaver-kv)

set -euo pipefail

CF_API="https://api.cloudflare.com/client/v4"
PROJECT="${CLOUDFLARE_PAGES_PROJECT:-dh-beaver}"
KV_TITLE="${DH_KV_NAMESPACE_TITLE:-dh-beaver-kv}"

[ -z "${CLOUDFLARE_API_TOKEN:-}" ]  && { echo "ERROR: CLOUDFLARE_API_TOKEN not set"; exit 1; }
[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ] && { echo "ERROR: CLOUDFLARE_ACCOUNT_ID not set"; exit 1; }

cf() { curl -s -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" "$@"; }
ok() { printf '  \033[32m✓\033[0m %s\n' "$*"; }
info() { printf '\033[34m▸\033[0m %s\n' "$*"; }

echo ""
echo "  Account → ${CLOUDFLARE_ACCOUNT_ID}"
echo "  Project → ${PROJECT}"
echo "  KV title→ ${KV_TITLE}"
echo ""

# ── 1. find or create KV namespace ────────────────────────────────────────────
# Paginate through all namespaces so accounts with >100 don't silently miss
# an existing one and produce a duplicate.
info "Looking up KV namespace '${KV_TITLE}'..."
NAMESPACE_ID=""
PAGE=1
while :; do
  LIST_RESP=$(cf "${CF_API}/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces?per_page=100&page=${PAGE}")
  if ! echo "$LIST_RESP" | grep -q '"success":[[:space:]]*true'; then
    echo "ERROR: failed to list KV namespaces (page ${PAGE}): $LIST_RESP"; exit 1
  fi
  FOUND=$(echo "$LIST_RESP" \
    | tr ',' '\n' \
    | grep -B1 "\"title\":\"${KV_TITLE}\"" \
    | grep '"id":' \
    | head -1 \
    | sed -E 's/.*"id":"([^"]+)".*/\1/' || true)
  if [ -n "$FOUND" ]; then
    NAMESPACE_ID="$FOUND"
    break
  fi
  # Stop when this page returned no namespace entries (empty result array).
  if ! echo "$LIST_RESP" | grep -q '"id":'; then
    break
  fi
  PAGE=$((PAGE + 1))
  # Hard safety cap to prevent infinite loops on malformed responses.
  [ "$PAGE" -gt 50 ] && { echo "ERROR: namespace pagination exceeded 50 pages"; exit 1; }
done

if [ -n "${NAMESPACE_ID:-}" ]; then
  ok "Namespace exists: ${NAMESPACE_ID}"
else
  info "Creating namespace..."
  CREATE_RESP=$(cf -X POST "${CF_API}/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"${KV_TITLE}\"}")
  if ! echo "$CREATE_RESP" | grep -q '"success":[[:space:]]*true'; then
    echo "ERROR: failed to create KV namespace: $CREATE_RESP"; exit 1
  fi
  NAMESPACE_ID=$(echo "$CREATE_RESP" | sed -E 's/.*"id":"([^"]+)".*/\1/')
  ok "Created namespace: ${NAMESPACE_ID}"
fi

echo "DH_KV_NAMESPACE_ID=${NAMESPACE_ID}"

# ── 2. bind to Pages project (production + preview) ───────────────────────────
info "Binding KV to Pages project '${PROJECT}'..."
# PATCH the project deployment_configs.production.kv_namespaces.DH_KV
PATCH_BODY=$(cat <<EOF
{
  "deployment_configs": {
    "production": {
      "kv_namespaces": { "DH_KV": { "namespace_id": "${NAMESPACE_ID}" } }
    },
    "preview": {
      "kv_namespaces": { "DH_KV": { "namespace_id": "${NAMESPACE_ID}" } }
    }
  }
}
EOF
)
PATCH_RESP=$(cf -X PATCH "${CF_API}/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${PROJECT}" \
  -H "Content-Type: application/json" \
  -d "$PATCH_BODY")
if echo "$PATCH_RESP" | grep -q '"success":[[:space:]]*true'; then
  ok "Binding DH_KV → ${NAMESPACE_ID} attached to ${PROJECT}."
else
  echo "ERROR: failed to bind KV to Pages project: $PATCH_RESP"; exit 1
fi

echo ""
ok "KV bootstrap complete. Run scripts/seed-kv.sh next to load initial data."
echo "  (Save DH_KV_NAMESPACE_ID for the seed script: ${NAMESPACE_ID})"
