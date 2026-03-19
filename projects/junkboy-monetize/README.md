# Junkboy Monetize Companion

Standalone companion scaffold for a privacy-first Android SMS filter fork.

This project is intentionally isolated so it can live inside the repository without coupling itself to unrelated code.

## What this is

- A static admin panel that can be hosted on GitHub Pages
- A config schema and default config for app-level monetization and feature flags
- An optional Cloudflare Worker + KV persistence layer for remote config writes
- A practical integration note for wiring this into a future Junkboy-style Android fork

## What this is not

- Not a full fork of `ovehbe/junkboy`
- Not an Android build
- Not an ad-fraud setup

## Important guardrails

This scaffold does **not** support deceptive ad behavior.

That means:
- no invisible ad rendering intended to generate paid impressions or clicks
- no hidden overlays that collect revenue while pretending the user did not see ads
- no misleading placement that breaks provider policies or user trust

What is supported instead:
- admin/dev-only preview controls
- paid or donated ad-free mode
- house ads, sponsor cards, affiliate modules, and compliant web ad slots
- configurable monetization providers that can be turned on per environment

## Folder layout

- `admin/` — static web admin, no build step
- `config/` — default config and export/import source of truth
- `cloudflare/` — Worker example for remote config persistence
- `docs/` — Android integration notes and rollout guidance

## Fastest realistic path

### Option A — zero-friction local + GitHub Pages

Use the admin panel as a local config editor and publish exported JSON manually.

1. Open `admin/index.html`
2. Edit values
3. Export JSON
4. Commit the exported config to your chosen public config URL
5. Point the app to that URL

Best when you want fast setup and no secrets.

### Option B — GitHub Pages for admin + Cloudflare Worker for writes

1. Host `admin/` on GitHub Pages
2. Deploy the Worker in `cloudflare/`
3. Bind a KV namespace named `CONFIG`
4. Set `ADMIN_TOKEN`
5. In the admin panel, save to the Worker endpoint

Best when you want a browser admin with authenticated persistence.

## Suggested monetization model

### Mobile app

- Default: no ads in sensitive screens
- Safe placements: settings, dashboard, statistics, optional sponsor section
- Ad-free unlock: donation or subscription toggle stored in entitlement config
- Additional value for donors: extra remote AI quota, higher limits, or provider fallback routing

### Web / content layer

- Pages/Worker-hosted landing pages
- sponsor tiles
- affiliate content modules
- compliant ad slots only when visible and labeled
- scheduled content publishing with manual review preferred

## Recommended rollout

### Phase 1
- Launch config admin
- Add donation/ad-free logic
- Add sponsor cards / house ads only

### Phase 2
- Remote config via Cloudflare Worker
- App feature flags and entitlement toggles
- Static content publishing pipeline

### Phase 3
- Add compliant ad providers one by one
- Add analytics that stay privacy-respecting
- Add content automation with approval workflow

## Notes on provider mix

A multi-network setup can be done, but keep it simple first.

Start with:
- one sponsor or house ad slot
- one web ad provider if policy fit is acceptable
- one donation flow

Then expand only after policy review, RPM testing, and UX review.

## Next integration target

See `docs/junkboy-fork-integration.md` for how to wire this into a future Android fork.
