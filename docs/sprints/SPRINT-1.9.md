# Sprint 1.9 — Multi-Tenant Infrastructure 📋 PLANNED

**Status:** Blocked until Sprint 1.8 merges  
**Duration:** 2-3 hours (Magistral Small 2509)  
**Branch:** claude/sprint-1.9  
**Model:** Magistral Small 2509 (reasoning-heavy architecture)  

---

## Goal

Transform digitalhands into **true multi-tenant SaaS** with per-client Cloudflare Pages projects + branded subdomains (`client-{id}.digitalhands.in`).

---

## Current State

- All clients share **single dbeaver project** at `digitalhands.in`
- All clients share **single Cloudflare Pages** deployment
- Admin dashboard manages clients but all use same codebase
- No client-specific branding or isolation

---

## What to Build

### 1. Per-Client Cloudflare Pages Projects

**Goal:** Each client gets their own CF Pages project  
**Naming:** `client-{clientId}` (e.g., `client-abc123def456`)

**Implementation:**
- Admin flow: When creating client → auto-create CF Pages project via CF API
- Store project ID in KV: `client:{clientId}:cf-project-id` = `{projectId}`
- Endpoint: POST `/api/clients` (modify existing) to trigger CF project creation

**CF API Call:**
```
POST https://api.cloudflare.com/client/v4/accounts/{accountId}/pages/projects
Body: {
  "name": "client-{clientId}",
  "production_branch": "main",
  "source": {
    "type": "github",
    "config": {
      "owner": "aakifshamsi",
      "repo": "digital-if",
      "production_branch": "main",
      "pr_comments_enabled": true
    }
  }
}
```

**Response:** Returns `{id, subdomain, ...}`

### 2. Client-Specific Subdomains

**Domain Structure:**
- Main: `digitalhands.in` → admin dashboard
- Clients: `client-{id}.digitalhands.in` → client template

**DNS Setup (Manual):**
- Add wildcard CNAME: `*.digitalhands.in` → CF Pages nameservers
- Cloudflare auto-routes based on project names

**Implementation:**
- Store domain template in env: `CF_DOMAIN_TEMPLATE=client-{id}.digitalhands.in`
- When generating magic link: return full URL including subdomain
- Client receives link like: `https://client-abc123.digitalhands.in/auth/magic?token=XYZ`

### 3. Per-Client Credential Isolation

**Goal:** Each client's CF tokens stored separately + isolated

**Implementation:**
- Already done from Sprint 1.6 ✅
- Credentials manager uses `cf-token:{clientId}` KV key
- Each client's tokens isolated by default

### 4. Template Routing by Client

**Goal:** Serve correct template (salon, spa, yoga, cv) per client

**File:** `projects/dbeaver/functions/api/content/[clientId].js` (MODIFY)  
**Logic:**
- Get clientId from route params
- Lookup KV: `client:{clientId}:template` = template name
- Serve correct HTML from `/templates/{template}/index.html`
- Return 404 if client not found

**Implementation:**
```javascript
export default async (request, env) => {
  const clientId = request.params.clientId;
  const template = await env.DH_KV.get(`client:${clientId}:template`);
  if (!template) return new Response('Client not found', { status: 404 });
  
  const html = await env.DH_KV.get(`template:${template}:html`);
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
};
```

### 5. Admin Flow: Create Client

**File:** `projects/dbeaver/functions/api/clients/index.js` (MODIFY — existing POST handler)

**Current:** Creates client record in KV  
**Enhance to:**
1. Generate clientId (UUID)
2. Create CF Pages project → get projectId
3. Store in KV:
   - `client:{clientId}` = `{id, name, email, phone, template, cfProjectId, ...}`
   - `client:{clientId}:cf-project-id` = `{projectId}`
   - `client:{clientId}:template` = template name
4. Return client object with `subdomainUrl`

**Error Handling:**
- If CF API fails, still create client but mark as `cfProjectPending: true`
- Retry endpoint to create missing projects

### 6. Admin UI: Show Client Subdomains

**File:** `projects/dbeaver/admin/clients.html` (MODIFY)

**UI Changes:**
- Add column: "Subdomain"
- Show: `client-{id}.digitalhands.in`
- "View Live" button → link to https://client-{id}.digitalhands.in
- Show CF project status: (Creating... / Ready / Error)

### 7. Multi-Tenant Auth

**Goal:** Ensure clients can only access their own subdomain data

**Implementation:**
- Client magically logs in via token → stored in session with clientId
- PUT `/api/clients/{id}` checks `session.user.clientId === id`
- GET `/api/content/{clientId}` returns data for any clientId (for public browsing)
- All admin endpoints require `session.user.role === 'admin'`

---

## Files to Create

1. `projects/dbeaver/functions/cf/projects.js` (NEW, 50 lines) — CF API wrapper for project management
2. (No new route files, only modifications)

## Files to Modify

1. `projects/dbeaver/functions/api/clients/index.js` (enhance POST to create CF projects, ~25 lines added)
2. `projects/dbeaver/functions/api/clients/[id].js` (add client isolation checks, ~5 lines)
3. `projects/dbeaver/functions/api/content/[clientId].js` (add template lookup, ~10 lines)
4. `projects/dbeaver/admin/clients.html` (add subdomain UI, ~15 lines)
5. `wrangler.toml` (verify CF account binding)

---

## Success Criteria

- ✅ POST `/api/clients` creates per-client CF Pages project
- ✅ GET subdomain shows correct client template
- ✅ Client-specific URLs work: `https://client-{id}.digitalhands.in`
- ✅ Admin can see all subdomains in dashboard
- ✅ Each client's data isolated (one client can't read another's data)
- ✅ Magic links include correct subdomain
- ✅ All CF API errors handled gracefully
- ✅ Committed to `origin/claude/sprint-1.9`
- ✅ PR created, merged to main, tagged v1.9.0

---

## What NOT to Do

❌ Do NOT modify dbeaver template files (templates stay unchanged)  
❌ Do NOT implement custom domain mapping (client-specific.com — that's Sprint 2.1)  
❌ Do NOT add client-side app rebuilds per client (all use same code)  
❌ Do NOT change GitHub integration (remains single repo)  
❌ Do NOT implement customer billing/stripe (Sprint 2.0)  

---

## Architecture Diagram

```
User Request to client-abc123.digitalhands.in
              ↓
         Cloudflare DNS
              ↓
       CF Pages Project: client-abc123
              ↓
     GitHub: /projects/dbeaver/
              ↓
    Function: GET /api/content/abc123
              ↓
     KV Lookup: template = "salon"
              ↓
    Serve: /templates/salon/index.html
              ↓
   Clientalready authenticated via magic link token
```

---

## Dependencies

- Sprint 1.8 must be merged ✅ (wait for completion)
- Cloudflare API credentials configured ✅ (from Sprint 1.6)
- KV storage working ✅ (from Sprint 1.6)

---

## Model Recommendation

**Magistral Small 2509** — Specialized for reasoning-heavy architecture. Strong at:
- API orchestration (CF API calls)
- Error handling + retry logic
- Multi-step workflows
- Credential/isolation patterns
- Trade-off analysis (when partial failures happen)

---

## Release Blockers (Before v1.9 can release)

- [ ] Sprint 1.8 merged and live on main
- [ ] DNS wildcard CNAME configured (manual step)
- [ ] Cloudflare API token has sufficient permissions
- [ ] All CF API errors tested (network failure, rate limit, auth failure)
