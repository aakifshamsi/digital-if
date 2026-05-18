#!/usr/bin/env bash
# cf-deploy.sh — provision CF Pages project, deploy static site, wire DNS
#
# Required env : CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
# Optional env : CLOUDFLARE_PAGES_PROJECT  (falls back to wrangler.toml name)
#                CF_DOMAIN                  (e.g. "dh-beaver.digitalhands.in")
#                CF_BRANCH                  (default: main)
#
# CF dashboard deploy command: bash scripts/cf-deploy.sh
# GitHub Actions             : bash projects/dbeaver/scripts/cf-deploy.sh

set -euo pipefail

CF_API="https://api.cloudflare.com/client/v4"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
# BRANCH is the deploy target (may be a preview like pr-123).
# PRODUCTION_BRANCH is the authoritative production branch on the Pages
# project — it must NOT track preview branches or they'd overwrite the
# stable production config every time a PR is opened.
BRANCH="${CF_BRANCH:-main}"
PRODUCTION_BRANCH="${CF_PRODUCTION_BRANCH:-main}"

# ── helpers ───────────────────────────────────────────────────────────────────
# cf(): silent curl that NEVER fails the script on HTTP errors — callers
#       inspect the response body for {"success":true} themselves.
cf()   { curl -s -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" "$@"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
info() { printf '\033[34m▸\033[0m %s\n' "$*"; }
warn() { printf '  \033[33m⚠\033[0m %s\n' "$*"; }
die()  { printf '\033[31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

# ── resolve project name ──────────────────────────────────────────────────────
CF_PROJECT="${CLOUDFLARE_PAGES_PROJECT:-}"
if [ -z "$CF_PROJECT" ]; then
  TOML="${SITE_DIR}/wrangler.toml"
  [ -f "$TOML" ] && CF_PROJECT=$(grep '^name' "$TOML" | head -1 | cut -d'"' -f2)
fi
[ -z "$CF_PROJECT" ] && die "Set CLOUDFLARE_PAGES_PROJECT or add name=\"...\" to wrangler.toml"
[ -z "${CLOUDFLARE_API_TOKEN:-}" ]  && die "CLOUDFLARE_API_TOKEN is not set"
[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ] && die "CLOUDFLARE_ACCOUNT_ID is not set"

echo ""
echo "  CF Pages   → ${CF_PROJECT}  (${CLOUDFLARE_ACCOUNT_ID})"
echo "  Branch     → ${BRANCH}"
echo "  Production → ${PRODUCTION_BRANCH}"
echo "  Site dir   → ${SITE_DIR}"
echo ""

# ── 1. ensure project exists ──────────────────────────────────────────────────
info "Checking project..."
CHECK_RESP=$(cf "${CF_API}/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${CF_PROJECT}")
if echo "$CHECK_RESP" | grep -q '"success":[[:space:]]*true'; then
  ok "Project exists."
elif echo "$CHECK_RESP" | grep -qE '"code":[[:space:]]*(8000007|10007)'; then
  # 8000007 / 10007 = project not found → create it
  info "Project not found — creating..."
  CREATE_RESP=$(cf -X POST "${CF_API}/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${CF_PROJECT}\",\"production_branch\":\"${PRODUCTION_BRANCH}\"}")
  if echo "$CREATE_RESP" | grep -q '"success":[[:space:]]*true'; then
    ok "Project created."
  elif echo "$CREATE_RESP" | grep -qE '"code":[[:space:]]*8000009|already[[:space:]]exists'; then
    # Race-safe: project came into existence between check and create
    ok "Project already existed (race resolved)."
  else
    die "Project create failed: $CREATE_RESP"
  fi
else
  # Some other error (auth, network, rate limit) — surface the response for debugging
  die "Unexpected response checking project: $CHECK_RESP"
fi

# ── 2. install wrangler if missing ────────────────────────────────────────────
if ! command -v wrangler &>/dev/null; then
  info "Installing wrangler..."
  npm install -g wrangler --prefer-offline --no-audit --no-fund --loglevel=error
  ok "Wrangler $(wrangler --version 2>/dev/null | head -1) ready."
fi

# ── 2b. ensure KV binding is in wrangler.toml ─────────────────────────────────
# Dashboard-only bindings (set via kv-bootstrap.sh) don't always propagate to
# branch previews — wrangler can deploy with `kv: unbound` if wrangler.toml
# doesn't declare the binding explicitly. So: run kv-bootstrap first to find/
# create the namespace, then inject [[kv_namespaces]] into wrangler.toml for
# this deploy. Idempotent — skips injection if the block already exists.
TOML="${SITE_DIR}/wrangler.toml"
# Check specifically for DH_KV binding, not just any [[kv_namespaces]] block.
has_dh_kv_binding() {
  awk '
    /^\[\[kv_namespaces\]\]/ {in_block=1; next}
    /^\[\[/ {in_block=0}
    in_block && $0 ~ /^binding[[:space:]]*=[[:space:]]*"DH_KV"/ {found=1}
    END {exit found ? 0 : 1}
  ' "$1"
}
if ! has_dh_kv_binding "$TOML"; then
  info "KV binding not in wrangler.toml — bootstrapping..."
  KV_OUT=$(CLOUDFLARE_PAGES_PROJECT="${CF_PROJECT}" \
    bash "${SCRIPT_DIR}/kv-bootstrap.sh" 2>&1) || die "kv-bootstrap failed: $KV_OUT"
  echo "$KV_OUT"
  KV_ID=$(echo "$KV_OUT" | grep -oE 'DH_KV_NAMESPACE_ID=[a-f0-9]+' | tail -1 | cut -d'=' -f2)
  [ -z "$KV_ID" ] && die "Could not extract DH_KV namespace ID from kv-bootstrap output"
  printf '\n[[kv_namespaces]]\nbinding = "DH_KV"\nid = "%s"\n' "$KV_ID" >> "$TOML"
  ok "Injected KV binding (id=${KV_ID}) into wrangler.toml for this deploy."
fi

# ── 3. deploy ─────────────────────────────────────────────────────────────────
# IMPORTANT: wrangler looks for functions/ relative to its CWD, not relative to
# the directory path you pass it. cd into SITE_DIR first so wrangler picks up
# projects/dbeaver/functions/ instead of looking at the repo root /functions/.
info "Deploying (from ${SITE_DIR})..."
DEPLOY_OUT=$(cd "${SITE_DIR}" && wrangler pages deploy . \
  --project-name "${CF_PROJECT}" \
  --branch "${BRANCH}" \
  --commit-dirty=true 2>&1)
echo "$DEPLOY_OUT"

# Wrangler prints the deployment URL — capture it for the health probe.
DEPLOY_URL=$(echo "$DEPLOY_OUT" | grep -oE 'https://[a-z0-9-]+\.[a-z0-9-]+\.pages\.dev' | tail -1)
[ -z "$DEPLOY_URL" ] && DEPLOY_URL="https://${CF_PROJECT}.pages.dev"
ok "Live → ${DEPLOY_URL}"

# ── 3b. post-deploy health probe ──────────────────────────────────────────────
# Catches the class of failures we hit in Sprint 1.1: deploy "succeeds" but
# the Functions don't actually route, or KV is unbound. Non-fatal — the static
# site is already deployed — but surfaces the issue immediately.
info "Probing /api/health..."
HEALTH=$(curl -s --max-time 10 "${DEPLOY_URL}/api/health" 2>/dev/null || true)
if echo "$HEALTH" | grep -q '"runtime":"cloudflare-pages-functions"'; then
  if echo "$HEALTH" | grep -q '"kv":"ok"'; then
    ok "Functions routing + KV binding healthy."
  else
    warn "Functions live but KV not bound — run scripts/kv-bootstrap.sh."
    echo "  Response: $HEALTH"
  fi
else
  warn "/api/health did not respond — Functions may still be propagating."
  echo "  Re-run this probe in ~30s: curl ${DEPLOY_URL}/api/health"
fi

# ── 4. DNS + custom domain (skip if CF_DOMAIN not set) ───────────────────────
DOMAIN="${CF_DOMAIN:-}"
[ -z "$DOMAIN" ] && echo "" && ok "Done (no CF_DOMAIN set — skipping DNS)." && exit 0

echo ""
info "Wiring DNS for ${DOMAIN}..."

# zone lookup: strip leading label to get registrable domain
PARENT="${DOMAIN#*.}"
ZONE_ID=$(cf "${CF_API}/zones?name=${PARENT}&status=active" 2>/dev/null \
  | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || true)

if [ -z "${ZONE_ID:-}" ]; then
  warn "Zone '${PARENT}' not found in this account — skipping DNS config."
else
  # CNAME: domain → project.pages.dev
  REC_ID=$(cf "${CF_API}/zones/${ZONE_ID}/dns_records?type=CNAME&name=${DOMAIN}" \
    2>/dev/null | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || true)

  if [ -z "${REC_ID:-}" ]; then
    cf -X POST "${CF_API}/zones/${ZONE_ID}/dns_records" \
      -H "Content-Type: application/json" \
      -d "{\"type\":\"CNAME\",\"name\":\"${DOMAIN}\",\"content\":\"${CF_PROJECT}.pages.dev\",\"proxied\":true}" \
      > /dev/null
    ok "CNAME created: ${DOMAIN} → ${CF_PROJECT}.pages.dev (proxied)"
  else
    ok "CNAME already exists."
  fi

  # attach custom domain to Pages project
  if cf "${CF_API}/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${CF_PROJECT}/domains" \
       2>/dev/null | grep -q "\"name\":\"${DOMAIN}\""; then
    ok "Custom domain already attached to Pages project."
  else
    cf -X POST "${CF_API}/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${CF_PROJECT}/domains" \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"${DOMAIN}\"}" > /dev/null
    ok "Custom domain attached — SSL provisioning in progress."
  fi
fi

echo ""
ok "All done."
