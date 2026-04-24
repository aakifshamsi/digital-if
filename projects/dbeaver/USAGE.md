# Usage Guide

## 1) Local preview
Open `projects/dbeaver/index.html` in browser.

## 2) Admin and client demo access
Use credentials listed in `README.md` (demo-only).

## 3) Deploy using GitHub Actions wizard
1. Go to Actions → `dBeaver Deploy`
2. Click **Run workflow**
3. Choose target:
   - `dry-run` first (recommended)
   - then `github-pages`, `cpanel-sftp`, or `cloudflare-pages`

## 4) Required secrets (by target)
### cPanel
- `CPANEL_HOST`
- `CPANEL_USER`
- `CPANEL_SSH_KEY`
- `CPANEL_REMOTE_DIR`

### Cloudflare Pages
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT`

## 5) Domain behavior
- Cloudflare DNS/proxy routes traffic only.
- File deployment is done by selected workflow target.
