# Sprint 1.4 — Magic link, share demo link, profile edit, dh-platform deploy

> **Status:** Planned (not started). Handoff doc for the next agent/contributor
> to pick up implementation.
>
> **Author of plan:** Claude (Sprint 1.3 closeout session).
> **Pickup branch suggestion:** `claude/website-builder-ai-ecosystem-p0brP`
> (designated feature branch — must be hard-reset to `origin/main` first
> because its remote tip predates Sprint 1.2; old work is fully captured
> in main via PR #1's squash merge).

## Context

PR #5 (Sprint 1.3) is merged. The next sprint turns DH Beaver from
"I host the admin" into "I onboard a client": a passwordless flow to
invite clients, a one-click way to share a preview before payment,
self-service email/phone edits, and finally publishing the marketing
site on its own Cloudflare Pages project.

**Deferred to a later sprint (user's explicit call):**

- Host-based routing (`request.headers.host` → KV `domain:*` → client).
  Will be designed and tested when `aakif.sham.si` is the first real
  domain onboarded.
- Custom-domain provisioning end-to-end. CF dashboard attach + manual
  CNAME is the on-demand path until then.

## Branch hygiene (do this first)

The designated feature branch `claude/website-builder-ai-ecosystem-p0brP`
currently sits on pre-Sprint-1.2 history (PR #1 era). Its remote tip
predates everything in `functions/`. Rebase fails ("unrelated histories")
and a merge would carry 30+ duplicate commits.

```bash
git checkout claude/website-builder-ai-ecosystem-p0brP
git reset --hard origin/main
git push --force-with-lease origin claude/website-builder-ai-ecosystem-p0brP
```

The old branch tip is preserved in main via PR #1's squash merge —
nothing is lost.

## Scope (4 items + release note)

### 1. Magic link for client login

**Backend (Pages Functions)**

- **NEW:** `projects/dbeaver/functions/api/clients/[id]/magic-link.js`
  - `POST` — admin-only. Generates a 32-byte token (reuse
    `newSessionToken()` from `functions/_shared/auth.js`), writes
    `magiclink:<token>` → `{ clientId, exp }` with a 7-day KV TTL,
    returns `{ url, expiresAt }`. POST body may include `{ ttlDays }`
    (default 7, max 30).
  - Idempotent for admin UX — admin can press "Generate magic link"
    repeatedly; each call mints a fresh token (old ones still valid
    until used or expired).

- **NEW:** `projects/dbeaver/functions/api/auth/magic.js`
  - `GET ?token=<token>` — public. Looks up `magiclink:<token>` in KV.
    Validates not expired. Loads `client:<clientId>`. Writes a session
    via existing `writeSession(env, { sub: loginEmail, role: 'client',
    clientId, name })`. Deletes the magic-link key (single-use).
    Returns `302 Location: /client/dashboard.html` with `Set-Cookie:
    dh_session=...`. On invalid/expired token: `302
    /client/login.html?error=expired_link`.

**Frontend (admin)**

- **EDIT:** `projects/dbeaver/admin/clients.html`
  - Add a "🔗 Magic link" button per client card (between Edit and
    Open Editor at line 156-158). On click: `POST
    /api/clients/<id>/magic-link`, copy the returned URL to clipboard
    via `navigator.clipboard.writeText(url)`, show toast
    "Magic link copied — expires in 7 days."

**No changes needed to:** `functions/_shared/auth.js` (existing helpers
suffice), `functions/api/auth/login.js` (password flow still works).

### 2. Share demo link (admin → admin)

- **EDIT:** `projects/dbeaver/admin/clients.html`
  - Add a "👀 Copy demo link" button per client card alongside the
    magic-link one. On click: builds
    `${location.origin}/templates/${c.template || 'cv'}/?client=${c.id}`
    and copies to clipboard. No API call required.
  - Map the legacy template value `spa-massage` → `spa` (one-line
    lookup, since it's the only legacy value in seed data) so the URL
    points at a real folder.

### 3. Client self-edit (email + phone)

**Backend**

- **EDIT:** `projects/dbeaver/functions/api/clients/[id].js`
  - The current `onRequestPut` allows admin only. Expand it: when
    `sess.role === 'client' && sess.clientId === id`, narrow the
    whitelist to `['email', 'phone']` (not `name`, `domain`, `plan`, etc).
    Admins keep the full whitelist.
  - Update the comment block above ALLOWED to reflect the two roles.

**Frontend (client portal)**

- **EDIT:** `projects/dbeaver/client/dashboard.html`
  - Insert a new "Profile" card in the right-column grid (just before
    the "Your Plan" card at line 145). Two fields (email, phone), one
    Save button. On Save: `PUT /api/clients/<clientId>` with `{ email,
    phone }`. Show toast on success. Update `dh_client_data` in
    sessionStorage so the displayed email refreshes immediately.
  - Pull the current values from `dh_client_data` on render.

### 4. dh-platform as a second CF Pages project

**Static site config**

- **NEW:** `projects/dh-platform/wrangler.toml`

  ```toml
  name = "dh-platform"
  compatibility_date = "2025-01-01"
  pages_build_output_dir = "."
  ```

  No KV, no functions — pure static.

**Deploy script reuse**

- **EDIT:** `projects/dbeaver/scripts/cf-deploy.sh`
  - The KV-bootstrap block (the `has_dh_kv_binding` function call)
    errors if `functions/` doesn't exist. Guard it: skip the entire
    block when `[ ! -d "${SITE_DIR}/functions" ]`. One-line change.
    Keeps the script reusable for both projects.
  - Honor `CUSTOM_SITE_DIR` env override at line 16:
    `SITE_DIR="${CUSTOM_SITE_DIR:-$(cd "${SCRIPT_DIR}/.." && pwd)}"`.
  - The DNS block already gracefully skips when `CF_DOMAIN` is unset,
    so no change there. Apex domain support (`digitalhands.in`) is
    deferred — user will attach the prod domain manually via CF
    dashboard when ready.

**CI/CD**

- **NEW:** `.github/workflows/dh-platform-cicd.yml`
  - Triggers on `push` to `main` with `paths: ['projects/dh-platform/**']`.
  - Single job: checkout, install wrangler, run
    `bash projects/dbeaver/scripts/cf-deploy.sh` with
    `CLOUDFLARE_PAGES_PROJECT=dh-platform`,
    `CUSTOM_SITE_DIR=projects/dh-platform`,
    `CF_BRANCH=main`, no `CF_DOMAIN`.
  - Uses existing `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`
    secrets — no new secret required.

**Result:** `dh-platform.pages.dev` deploys on every push to main that
touches `projects/dh-platform/`. Prod domain (`digitalhands.in`) gets
attached later via CF dashboard.

### 5. v0.4.0 release note

- **EDIT:** `projects/dbeaver/data/whatsnew.json`
  - Prepend a new entry. Match the existing schema (`date`, `version`,
    `tag`, `title`, `items`):

  ```json
  {
    "date": "2026-05-18",
    "version": "0.4.0",
    "tag": "new",
    "title": "Invite clients with a magic link",
    "items": [
      "Magic link login — generate a one-time URL from the clients list and paste it into WhatsApp or email; your client signs in without a password.",
      "Copy a sharable demo URL from any client card — preview their site before they pay.",
      "Clients can now update their own contact email and phone from the portal.",
      "DH Platform marketing site is now on its own Cloudflare project — independent deploys, ready for digitalhands.in."
    ]
  }
  ```

## Critical files

| File | Action |
|---|---|
| `projects/dbeaver/functions/api/clients/[id]/magic-link.js` | NEW |
| `projects/dbeaver/functions/api/auth/magic.js` | NEW |
| `projects/dbeaver/functions/api/clients/[id].js` | Edit `onRequestPut` for client self-edit |
| `projects/dbeaver/admin/clients.html` | Add 2 buttons per card + handlers |
| `projects/dbeaver/client/dashboard.html` | Add Profile card + Save handler |
| `projects/dbeaver/scripts/cf-deploy.sh` | Guard KV bootstrap; honor `CUSTOM_SITE_DIR` |
| `projects/dbeaver/data/whatsnew.json` | Prepend v0.4.0 entry |
| `projects/dh-platform/wrangler.toml` | NEW (3 lines) |
| `.github/workflows/dh-platform-cicd.yml` | NEW |

## Reused utilities (no duplication)

- `functions/_shared/auth.js::newSessionToken()` — already a 32-byte
  base64url generator. Reuse for magic-link tokens.
- `functions/_shared/auth.js::writeSession()` — exact same call shape
  as `login.js` uses. Magic endpoint just calls it after the token check.
- `functions/_shared/auth.js::sessionCookie()` — same cookie helper.
- `functions/_shared/kv.js::getJSON / putJSON / requireKV` — used
  throughout, used here.
- `functions/_shared/http.js::json / err` — used throughout.

## Verification

After implementing and pushing to a PR:

| Check | URL / action | Expected |
|---|---|---|
| Health | `https://pr-N.dh-beaver.pages.dev/api/health` | `{ok:true, kv:"ok"}` |
| Magic-link generate | Admin clients page → "🔗 Magic link" on `cli_001` | toast + URL in clipboard |
| Magic-link consume | Open the copied URL in incognito | redirects to `/client/dashboard.html`, signed in as `cli_001` |
| Magic-link reuse | Click the same URL again | redirects to `/client/login.html?error=expired_link` |
| Demo link | Admin clients page → "👀 Copy demo link" on `cli_001` | clipboard has `<origin>/templates/spa/?client=cli_001` |
| Profile edit | Client portal → change phone → Save | toast; `/api/me` returns same session; reload preserves new phone |
| Profile escalation | Client tries to PUT `name` via DevTools | server returns 403 (`name` not in client whitelist) |
| dh-platform deploy | Push a CSS change to `projects/dh-platform/` | `dh-platform.pages.dev` reflects it within ~2min |
| Whatsnew | Admin dashboard → What's New card | top entry is v0.4.0 |

## Out of scope (named so they don't sneak in)

- Host-resolver middleware / `domain:*` KV pattern → next sprint, alongside
  `aakif.sham.si` onboarding test.
- Admin UI migration from localStorage to `/api/clients` → real refactor;
  current admin still uses localStorage for the clients list. The magic-link
  button works against the API for any client that exists in KV (e.g.
  `cli_001` from `seed-kv`). Clients added via the localStorage modal won't
  have KV records yet — known limitation, surface a clear error toast.
- Apex DNS automation in `cf-deploy.sh` → user attaches `digitalhands.in`
  manually via CF dashboard once Pages project exists.
- AI-assisted content suggestions (CF Workers AI) → planned later.
- CV Buddy product → planned later.

## Order of execution

1. Branch reset (one-time hygiene).
2. `cf-deploy.sh` tweak + `dh-platform/wrangler.toml` + workflow.
   Smallest blast radius, sets up #4 deploy infra.
3. Magic-link backend (2 new files + reuse helpers).
4. Admin buttons (`clients.html` — 2 buttons, ~30 lines).
5. Client profile edit (1 backend tweak + dashboard.html card).
6. `whatsnew.json` prepend.
7. Commit per logical group, push, open PR.
