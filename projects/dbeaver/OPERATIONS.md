# Operations Runbook

## What to monitor

### 1) GitHub Actions
- Workflow: `dBeaver Deploy`
- Monitor failed jobs, step logs, and reruns
- Check artifact upload success from preflight job

### 2) Hosting target health
- GitHub Pages: site availability + page load
- cPanel/Linux host: web server logs + upload success
- Cloudflare Pages: deployment status + production alias

### 3) App-level checks
- Admin login flow
- Client login flow
- Editor load and save actions
- API responses for auth/clients endpoints

## Rollback options

### Option A: git rollback
- Revert merge commit in `main`
- Re-run deployment workflow on stable ref

### Option B: hosting rollback
- cPanel: restore previous backup/snapshot
- Cloudflare Pages: roll back to previous deployment
- GitHub Pages: redeploy last known good commit

## Merge-to-main checklist
- [ ] Security blockers reviewed and accepted/fixed
- [ ] Deploy dry-run passes
- [ ] Target deployment passes
- [ ] Smoke test completed (admin/client/demo pages)
- [ ] Release notes + changelog updated
- [ ] Tag created after merge (example: `v0.2.0`)

## Tagging after merge
From local clone after merging PR into `main`:

```bash
git checkout main
git pull origin main
git tag -a v0.2.0 -m "dBeaver v0.2.0"
git push origin v0.2.0
```
