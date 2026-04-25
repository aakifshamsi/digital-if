# Changelog

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
