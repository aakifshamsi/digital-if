# Changelog
## v0.1.0 — 2026-05-18
## v0.2.0 — 2026-05-18
## v0.2.1 — 2026-05-18

### Maintenance
- ci: add manual workflow to seed KV namespace with admin + demo client (425602d)
---


### Features
- feat(backend): Sprint 1.2 — Pages Functions + KV real backend (7efe38e)
---


### Features
- feat: Sprint 1.1 — Jet Black theme, real CMS editor, CF Pages CI/CD (2f4c328)
- feat(dh-platform): add Digital Hands corporate landing page (c235b0a)

### Bug Fixes
- fix: address CodeRabbit review (Apr-25) — htaccess, auth comment, MD029, rel (4534d64)

### Documentation
- docs(dbeaver): add release notes, changelog, usage and operations runbook (e13379a)
- docs(dbeaver): add release notes, changelog, usage and operations runbook (dc577a6)
- docs(spa-builder): replace Claude-specific AI guidance with free stack options (5d23606)
- docs: Add handover information section to STATUS.md (b49edac)
- docs: Add immediate, next, and blocked task sections (cab2ea7)
- docs: Update STATUS.md with repository purpose and state (f250fc7)
- docs: Add STATUS.md (d741b49)

### Maintenance
- ci(spa-builder): add deploy wizard workflow for pages, cPanel, and Cloudflare (d76a1ea)

### Other
- rebrand: remove spa-first wording from platform-facing copy (1f19b23)
- rebrand(spa-builder): position as multi-client dBeaver platform (d569a2a)
- Add DigitalHands.in AI spa website builder platform (eeb1ba0)
- Implement GPS Phantom: AI-Powered Location Simulator (excluding root workflow) (7001c8b)
- Implement GPS Phantom: AI-Powered Location Simulator (703455c)
- Add Luke setup wizard based on current docs (1ad9d65)
- Add Luke provider routing example config (4d50fe5)
- Add Luke portable AI workspace project (03ba304)
- Add Cloudflare Worker sample code and setup steps (12bf560)
- Add Cloudflare deployment notes for remote config (af9ea03)
- Add static admin panel for monetization config (cef2117)
- Add default monetization and feature config (24017dc)
- Add standalone junkboy monetization companion scaffold (754feb5)
- Add gitignore (82a41d5)
- Initial static ad page (e19a6e4)
---


All notable changes to dBeaver (working name) are documented here.

## [0.2.0] - 2026-04-24

### Added
- GitHub Actions deployment workflow: `.github/workflows/dbeaver-deploy.yml`
- Deploy targets: `dry-run`, `github-pages`, `cpanel-sftp`, `cloudflare-pages`
- Preflight checks script: `projects/dbeaver/scripts/preflight.sh`
- cPanel deployment script: `projects/dbeaver/scripts/deploy-cpanel.sh`
- Deployment docs for required secrets and target behavior

### Changed
- Rebranded project path from `projects/spa-builder` to `projects/dbeaver`
- Updated platform messaging to personal project management + service offerings system
- Updated platform-facing copy to treat demo clients as placeholders

### Notes
- Demo data/content still includes sample wellness client pages.
- Security hardening items from review remain pending (see `RELEASE_NOTES.md`).
