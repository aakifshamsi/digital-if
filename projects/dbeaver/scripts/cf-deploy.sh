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
BRANCH="${CF_BRANCH:-main}"

# ── helpers ───────────────────────────────────────────────────────────────────
cf()   { curl -sf -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" "$@"; }
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
echo "  CF Pages → ${CF_PROJECT}  (${CLOUDFLARE_ACCOUNT_ID})"
echo "  Branch   → ${BRANCH}"
echo "  Site dir → ${SITE_DIR}"
echo ""

# ── 1. ensure project exists ──────────────────────────────────────────────────
info "Checking project..."
if cf "${CF_API}/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${CF_PROJECT}" \
     2>/dev/null | grep -q '"success":true'; then
  ok "Project exists."
else
  info "Project not found — creating..."
  cf -X POST "${CF_API}/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${CF_PROJECT}\",\"production_branch\":\"${BRANCH}\"}" \
    > /dev/null
  ok "Project created."
fi

# ── 2. install wrangler if missing ────────────────────────────────────────────
if ! command -v wrangler &>/dev/null; then
  info "Installing wrangler..."
  npm install -g wrangler --prefer-offline --no-audit --no-fund --loglevel=error
  ok "Wrangler $(wrangler --version 2>/dev/null | head -1) ready."
fi

# ── 3. deploy ─────────────────────────────────────────────────────────────────
info "Deploying..."
wrangler pages deploy "${SITE_DIR}" \
  --project-name "${CF_PROJECT}" \
  --branch "${BRANCH}" \
  --commit-dirty=true
ok "Live → https://${CF_PROJECT}.pages.dev"

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
