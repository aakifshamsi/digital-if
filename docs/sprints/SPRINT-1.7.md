# Sprint 1.7 — Deploy dh-platform to digitalhands.in

**Status:** Ready to start  
**Duration:** 30 min (Ministral 3.3B)  
**Branch:** claude/sprint-1.7  
**Model:** Ministral 3 3B (fast + tool_use training)

---

## Goal

Deploy dh-platform (static HTML) to Cloudflare Pages at `digitalhands.in` domain with automated CI/CD.

---

## Current State

- dh-platform code exists at `projects/dh-platform/`
- Has `wrangler.toml` (created in Sprint 1.5)
- No CI/CD workflow yet
- Not deployed anywhere

---

## What to Build

### 1. GitHub Actions Workflow
**File:** `.github/workflows/dh-platform-deploy.yml`  
**Trigger:** Push to `main` with changes to `projects/dh-platform/**`  
**Jobs:**
- Checkout code
- Install wrangler
- Deploy via `wrangler pages deploy`

**Secrets needed:**
- CLOUDFLARE_API_TOKEN (already exists)
- CLOUDFLARE_ACCOUNT_ID (already exists)

### 2. wrangler.toml Configuration
**File:** `projects/dh-platform/wrangler.toml`  
**Already exists (created Sprint 1.5)**  
**Just verify:**
- Project name: `dh-platform`
- Build output dir: `.`
- No KV/Functions (static only)

### 3. Cloudflare DNS Configuration
**Manual step (not in scope):**
- Point `digitalhands.in` A record to Cloudflare Pages nameservers
- Or use CNAME: `dh-platform.pages.dev`

---

## Detailed Tasks

### Task 1.1: Create Workflow File
**Where:** `.github/workflows/dh-platform-deploy.yml`

**Content:**
```yaml
name: Deploy dh-platform

on:
  push:
    branches: [main]
    paths: ['projects/dh-platform/**', '.github/workflows/dh-platform-deploy.yml']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install wrangler
        run: npm install -g wrangler
      
      - name: Deploy to Cloudflare Pages
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          cd projects/dh-platform
          wrangler pages deploy . --project-name dh-platform
```

**Notes:**
- Runs only on changes to `projects/dh-platform/` (avoid redundant deploys)
- Uses existing GitHub secrets (no new ones needed)
- Deploys from root of `dh-platform` folder (`.`)

### Task 1.2: Verify wrangler.toml
**Where:** `projects/dh-platform/wrangler.toml`

**Should contain:**
```toml
name = "dh-platform"
compatibility_date = "2025-01-01"
pages_build_output_dir = "."
```

**Nothing else needed** (no KV, no functions for this project)

### Task 1.3: Health Check (Manual Test)
**After deploy completes:**
```bash
curl https://dh-platform.pages.dev/
# Should return HTML (status 200)
```

---

## Success Criteria

- [ ] Workflow file created in `.github/workflows/`
- [ ] Workflow triggers on push to main
- [ ] `wrangler pages deploy` runs successfully
- [ ] dh-platform appears at https://dh-platform.pages.dev (temporary URL)
- [ ] index.html loads without errors
- [ ] Console has no errors or security warnings

---

## What NOT to Do

❌ Don't modify dh-platform HTML/CSS (that's for later sprints)  
❌ Don't set up email/DNS (manual step, out of scope)  
❌ Don't configure monitoring yet (Sprint 2.0)  
❌ Don't add authentication (static site, no auth needed)  
❌ Don't touch dbeaver workflow (keep separate)

---

## After Sprint 1.7

Once deployed:
- [ ] Commit & push to main
- [ ] Tag as v1.7.0
- [ ] Move to Sprint 1.8 (Magic Links)
- [ ] Manual DNS: Point digitalhands.in to Cloudflare

---

## Expected Output

```
✅ .github/workflows/dh-platform-deploy.yml created
✅ wrangler.toml verified
✅ GitHub Actions workflow runs on next push to main
✅ Deployed to dh-platform.pages.dev

Next: Verify DNS works, then Sprint 1.8 begins
```

---

## Notes for Agent

- This is straightforward YAML + Bash
- No complex logic needed
- Ministral 3.3B is perfect for this
- Focus: correct YAML syntax, proper secret usage, file paths
- Don't over-engineer (keep it simple)

