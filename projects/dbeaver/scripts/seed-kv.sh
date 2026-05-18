#!/usr/bin/env bash
# seed-kv.sh — populate KV with default admin user, client, content, theme.
#
# Idempotent for content/theme: re-running won't overwrite existing keys
# (it skips a key if already present). Use --force to overwrite all.
#
# Required env: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, DH_KV_NAMESPACE_ID
# Optional env: DH_ADMIN_EMAIL    (default: admin@digitalhands.in)
#               DH_ADMIN_PASSWORD (default: random — printed at end)
#               DH_CLIENT_NAME    (default: "Sabi's Wellness Spa" — business name)
#               DH_CLIENT_CONTACT (default: "Sabi" — contact person name)
#               DH_CLIENT_EMAIL   (default: sabi@example.com — used for login)
#               DH_CLIENT_PASS    (default: random — printed at end)
#               DH_CLIENT_PHONE   (default: "" — empty)
#               DH_CLIENT_DOMAIN  (default: "" — empty, set later via admin portal)
#               DH_CLIENT_TEMPLATE (default: "spa")

set -euo pipefail

CF_API="https://api.cloudflare.com/client/v4"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
FORCE=0
[[ "${1:-}" == "--force" ]] && FORCE=1

[ -z "${CLOUDFLARE_API_TOKEN:-}" ]  && { echo "ERROR: CLOUDFLARE_API_TOKEN not set"; exit 1; }
[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ] && { echo "ERROR: CLOUDFLARE_ACCOUNT_ID not set"; exit 1; }
[ -z "${DH_KV_NAMESPACE_ID:-}" ]    && { echo "ERROR: DH_KV_NAMESPACE_ID not set (run kv-bootstrap.sh first)"; exit 1; }

# --fail-with-body: non-2xx → non-zero exit AND keep the response body so callers
# can log it. -sS: silent progress, but show errors. Pairs with set -e so KV
# write failures bubble up immediately instead of being silently ignored.
cf() { curl -sS --fail-with-body -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" "$@"; }
ok() { printf '  \033[32m✓\033[0m %s\n' "$*"; }
info() { printf '\033[34m▸\033[0m %s\n' "$*"; }

kv_get() {
  local key="$1"
  cf "${CF_API}/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${DH_KV_NAMESPACE_ID}/values/${key}"
}

# Returns 0 if key exists, 1 if not.
kv_exists() {
  local key="$1"
  local resp
  resp=$(cf -o /dev/null -w "%{http_code}" \
    "${CF_API}/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${DH_KV_NAMESPACE_ID}/metadata/${key}" \
    2>/dev/null || echo "000")
  [[ "$resp" == "200" ]]
}

kv_put() {
  local key="$1" value="$2"
  cf -X PUT "${CF_API}/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${DH_KV_NAMESPACE_ID}/values/${key}" \
    --data-binary "$value" > /dev/null
}

# PBKDF2 hashing in node (matches functions/_shared/auth.js format).
# Wrapped in an async IIFE because `node -e` defaults to CommonJS and only
# supports top-level await with --input-type=module (Node 22+); the IIFE
# works under any modern Node version without that flag.
hash_pw() {
  node -e "
    (async () => {
      const { hashPassword } = await import('${SITE_DIR}/functions/_shared/auth.js');
      process.stdout.write(await hashPassword(process.argv[1]));
    })().catch(err => { console.error(err); process.exit(1); });
  " "$1"
}

random_pw() {
  head -c 12 /dev/urandom | base64 | tr -d '/+=' | head -c 12
}

# Build default-content/theme JSON from defaults.js (same source of truth as Functions).
read_defaults() {
  node -e "
    import('${SITE_DIR}/functions/_shared/defaults.js').then(m => {
      const out = {
        content: m.DEFAULT_CONTENT,
        theme:   m.DEFAULT_THEME
      };
      process.stdout.write(JSON.stringify(out));
    });
  "
}

DEFAULTS=$(read_defaults)
CONTENT_JSON=$(node -e "process.stdout.write(JSON.stringify(JSON.parse(process.argv[1]).content))" "$DEFAULTS")
THEME_JSON=$(node -e "process.stdout.write(JSON.stringify(JSON.parse(process.argv[1]).theme))" "$DEFAULTS")

ADMIN_EMAIL="${DH_ADMIN_EMAIL:-admin@digitalhands.in}"
ADMIN_PASS="${DH_ADMIN_PASSWORD:-$(random_pw)}"
ADMIN_PASS_PRINTED="${DH_ADMIN_PASSWORD:+(from env)}"

# ── client configuration (all fields can be overridden via env vars) ────────────
CLIENT_ID="cli_001"
CLIENT_NAME="${DH_CLIENT_NAME:-Sabi's Wellness Spa}"
CLIENT_CONTACT="${DH_CLIENT_CONTACT:-Sabi}"
CLIENT_EMAIL="${DH_CLIENT_EMAIL:-sabi@example.com}"
CLIENT_PHONE="${DH_CLIENT_PHONE:-}"
CLIENT_DOMAIN="${DH_CLIENT_DOMAIN:-}"
CLIENT_TEMPLATE="${DH_CLIENT_TEMPLATE:-spa}"
CLIENT_PASS="${DH_CLIENT_PASS:-$(random_pw)}"
CLIENT_PASS_PRINTED="${DH_CLIENT_PASS:+(from env)}"

echo ""
info "Seeding KV namespace ${DH_KV_NAMESPACE_ID} (force=${FORCE})..."

# ── admin user ────────────────────────────────────────────────────────────────
if [ "$FORCE" -eq 1 ] || ! kv_exists "admin:${ADMIN_EMAIL}"; then
  info "Hashing admin password..."
  ADMIN_HASH=$(hash_pw "$ADMIN_PASS")
  kv_put "admin:${ADMIN_EMAIL}" \
    "{\"email\":\"${ADMIN_EMAIL}\",\"name\":\"Admin\",\"role\":\"admin\",\"passwordHash\":\"${ADMIN_HASH}\"}"
  ok "admin:${ADMIN_EMAIL} written."
  ADMIN_SEEDED=1
else
  ok "admin:${ADMIN_EMAIL} already exists (skipped)."
  ADMIN_SEEDED=0
fi

# ── client record ─────────────────────────────────────────────────────────────
if [ "$FORCE" -eq 1 ] || ! kv_exists "client:${CLIENT_ID}"; then
  info "Hashing client password..."
  CLIENT_HASH=$(hash_pw "$CLIENT_PASS")
  CLIENT_RECORD=$(cat <<EOF
{
  "id": "${CLIENT_ID}",
  "name": "${CLIENT_NAME}",
  "contact": "${CLIENT_CONTACT}",
  "email": "${CLIENT_EMAIL}",
  "phone": "${CLIENT_PHONE}",
  "domain": "${CLIENT_DOMAIN}",
  "template": "${CLIENT_TEMPLATE}",
  "status": "active",
  "plan": "Professional",
  "created": "2024-01-15",
  "loginEmail": "${CLIENT_EMAIL}",
  "passwordHash": "${CLIENT_HASH}"
}
EOF
)
  kv_put "client:${CLIENT_ID}" "$CLIENT_RECORD"
  kv_put "client-email:${CLIENT_EMAIL}" "${CLIENT_ID}"
  ok "client:${CLIENT_ID} and email index written."
  CLIENT_SEEDED=1
else
  ok "client:${CLIENT_ID} already exists (skipped)."
  CLIENT_SEEDED=0
fi

# clients:index
if [ "$FORCE" -eq 1 ] || ! kv_exists "clients:index"; then
  kv_put "clients:index" "[\"${CLIENT_ID}\"]"
  ok "clients:index written."
fi

# content / theme (skip if exists to preserve user edits)
if [ "$FORCE" -eq 1 ] || ! kv_exists "content:${CLIENT_ID}"; then
  kv_put "content:${CLIENT_ID}" "$CONTENT_JSON"
  ok "content:${CLIENT_ID} written."
fi
if [ "$FORCE" -eq 1 ] || ! kv_exists "theme:${CLIENT_ID}"; then
  kv_put "theme:${CLIENT_ID}" "$THEME_JSON"
  ok "theme:${CLIENT_ID} written."
fi

echo ""
ok "Seed complete."
if [ "$ADMIN_SEEDED" -eq 1 ] && [ -z "$ADMIN_PASS_PRINTED" ]; then
  echo ""
  echo "  ⚠  Generated admin credentials (save these now):"
  echo "      email:    ${ADMIN_EMAIL}"
  echo "      password: ${ADMIN_PASS}"
fi
if [ "$CLIENT_SEEDED" -eq 1 ] && [ -z "$CLIENT_PASS_PRINTED" ]; then
  echo ""
  echo "  ⚠  Generated client credentials (save these now):"
  echo "      email:    ${CLIENT_EMAIL}"
  echo "      password: ${CLIENT_PASS}"
fi
