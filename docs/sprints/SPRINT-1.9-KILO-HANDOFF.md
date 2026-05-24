# Sprint 1.9 KiloCode Handoff Prompt

You are KiloCode, executing **Sprint 1.9: Multi-Tenant Infrastructure**.

**BLOCKER:** This sprint CANNOT start until Sprint 1.8 is merged to main.

---

## EXECUTION INSTRUCTIONS (Follow EXACTLY)

### PHASE 1: Pre-Flight Checks

**Step 1.1: Verify Sprint 1.8 is merged**
```bash
cd /opt/digitalhands/workspaces/dhBeaver/digital-if
git log --oneline main -1
```
Must show commit message containing "feat(Sprint 1.8)" or similar.
If NOT merged, STOP and report: "Sprint 1.8 not yet merged. Cannot proceed."

**Step 1.2: Read Sprint 1.9 plan**
```bash
cat docs/sprints/SPRINT-1.9.md
```
Report: "Read Sprint 1.9 plan. Multi-tenant infrastructure ready."

**Step 1.3: Create feature branch**
```bash
git checkout main
git pull origin main
git checkout -b claude/sprint-1.9
```

---

### PHASE 2: Create CF API Wrapper

**Step 2.1: Create cf-projects.js**
File: `projects/dbeaver/functions/_shared/cf-projects.js`

```javascript
import { cfApiFetch } from './cf-api.js';

/**
 * Create a Cloudflare Pages project for a client
 * @param {Object} env - Cloudflare env object
 * @param {string} clientId - Client ID (UUID)
 * @param {string} clientName - Client name (for project display)
 * @returns {Promise<{id: string, name: string, subdomain: string}>}
 */
export async function createClientProject(env, clientId, clientName) {
  const projectName = `client-${clientId}`;

  const payload = {
    name: projectName,
    production_branch: 'main',
    source: {
      type: 'github',
      config: {
        owner: 'aakifshamsi',
        repo: 'digital-if',
        production_branch: 'main',
        pr_comments_enabled: false,
      },
    },
  };

  try {
    // Call CF API to create project
    const response = await cfApiFetch(
      env,
      'admin', // Use admin client credentials
      `/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/pages/projects`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`CF API error: ${error.errors?.[0]?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const project = data.result;

    return {
      id: project.id,
      name: project.name,
      subdomain: project.subdomain,
      url: `https://${project.subdomain}`,
    };
  } catch (error) {
    console.error(`Failed to create project for client ${clientId}:`, error);
    throw error;
  }
}

/**
 * Get existing Cloudflare Pages project
 */
export async function getClientProject(env, projectId) {
  try {
    const response = await cfApiFetch(
      env,
      'admin',
      `/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/pages/projects/${projectId}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 404) return null;
      throw new Error(error.errors?.[0]?.message || 'Unknown error');
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error(`Failed to get project ${projectId}:`, error);
    throw error;
  }
}

/**
 * List all client projects
 */
export async function listClientProjects(env) {
  try {
    const response = await cfApiFetch(
      env,
      'admin',
      `/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/pages/projects?limit=100`,
      { method: 'GET' }
    );

    if (!response.ok) throw new Error('Failed to list projects');

    const data = await response.json();
    return data.result.filter(p => p.name.startsWith('client-'));
  } catch (error) {
    console.error('Failed to list projects:', error);
    return [];
  }
}
```

---

### PHASE 3: Modify Client Creation Endpoint

**Step 3.1: Modify projects/dbeaver/functions/api/clients/index.js (POST handler)**

Find the existing POST handler. Modify it to call CF project creation:

**Before the final `return json(...)`, add:**

```javascript
// Create Cloudflare Pages project for client
let cfProjectId = null;
try {
  const { createClientProject } = await import('../../_shared/cf-projects.js');
  const project = await createClientProject(env, clientId, clientData.name);
  cfProjectId = project.id;
  console.log(`Created CF project for client ${clientId}: ${project.name}`);
} catch (cfError) {
  console.warn(`Failed to create CF project (non-blocking): ${cfError.message}`);
  // Don't fail the entire request if CF API fails
}

// Update clientData with CF project info
const clientWithCF = {
  ...clientData,
  cfProjectId,
  cfProjectStatus: cfProjectId ? 'ready' : 'pending',
};
```

**Then replace the final response:**
```javascript
// Before: return json({ success: true, client: clientData });
// After:
return json({ success: true, client: clientWithCF });
```

---

### PHASE 4: Modify Content Routing

**Step 4.1: Modify projects/dbeaver/functions/api/content/[clientId].js**

Replace/add the handler to route by template:

```javascript
import { getJSON } from '../../_shared/kv.js';

export default async (request, env) => {
  try {
    const clientId = request.params.clientId;
    if (!clientId) return new Response('Client ID required', { status: 400 });

    // Get client record
    const client = await getJSON(env, `client:${clientId}`);
    if (!client) return new Response('Client not found', { status: 404 });

    // Get template preference
    const template = client.template || 'default';

    // Fetch template HTML from KV
    const templateHtml = await env.DH_KV.get(`template:${template}:html`);
    if (!templateHtml) {
      return new Response(`Template ${template} not found`, { status: 404 });
    }

    return new Response(templateHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('content routing error:', error);
    return new Response(error.message, { status: 500 });
  }
};
```

---

### PHASE 5: Add Client Isolation

**Step 5.1: Modify projects/dbeaver/functions/api/clients/[id].js**

In the PUT handler (added in Sprint 1.8), enhance the ownership check:

```javascript
// In the PUT handler, replace the ownership check:
if (!user || user.role !== 'client' || user.clientId !== clientId) {
  return err(403, 'Cannot modify other clients');
}
```

Also add this to the GET handler (if it exists):

```javascript
if (request.method === 'GET') {
  try {
    const { user } = request.session || {};
    const clientId = request.params.id;

    // Allow admins to view any client, clients only their own
    if (user.role !== 'admin' && user.clientId !== clientId) {
      return err(403, 'Cannot view other clients');
    }

    const client = await getJSON(env, `client:${clientId}`);
    if (!client) return err(404, 'Client not found');

    // Don't expose CF tokens to client
    const safe = { ...client };
    delete safe.cfTokens;
    delete safe.cfProjectId;

    return json(safe);
  } catch (error) {
    return err(500, error.message);
  }
}
```

---

### PHASE 6: Update Admin UI

**Step 6.1: Modify projects/dbeaver/admin/clients.html**

Add a "Subdomain" column to the client table:

```html
<!-- In the table header -->
<th>Subdomain</th>

<!-- In the table body, for each client row -->
<td>
  <span id="subdomain-${client.id}">
    ${client.cfProjectId ? `client-${client.id}.digitalhands.in` : 'pending...'}
  </span>
</td>

<!-- Add "View Live" button -->
<td>
  <a href="https://client-${client.id}.digitalhands.in" target="_blank" class="btn btn-sm btn-secondary">
    View Live
  </a>
</td>
```

---

### PHASE 7: Test Endpoints

**Step 7.1: Test CF project creation logic**
```bash
# Verify cf-projects.js syntax
node -c projects/dbeaver/functions/_shared/cf-projects.js

# Verify client index.js syntax
node -c projects/dbeaver/functions/api/clients/index.js

# Verify content routing syntax
node -c projects/dbeaver/functions/api/content/[clientId].js
```
All should return "No syntax errors"

---

### PHASE 8: Commit & Push

**Step 8.1: Stage all changes**
```bash
git add -A
git status
```

**Step 8.2: Commit**
```bash
git commit -m "feat(Sprint 1.9): Multi-tenant infrastructure

- Add CF Pages project creation for each client
- Implement per-client subdomains (client-{id}.digitalhands.in)
- Add template-based content routing by clientId
- Enhance client isolation checks (ownership validation)
- Update admin UI with subdomain display + View Live button
- CF API errors handled gracefully (non-blocking)
- All clients have isolated KV records + CF projects"
```

**Step 8.3: Push to branch**
```bash
git push origin claude/sprint-1.9
```
Report: "Branch pushed successfully"

---

### PHASE 9: Create PR

**Step 9.1: Create PR via gh CLI**
```bash
gh pr create \
  --base main \
  --title "feat(Sprint 1.9): Multi-tenant infrastructure" \
  --body "## Sprint 1.9 Complete

- ✅ CF Pages project creation per client
- ✅ Per-client subdomains (client-{id}.digitalhands.in)
- ✅ Template-based content routing
- ✅ Client isolation + ownership validation
- ✅ Admin UI updated with subdomain management
- ✅ All endpoints tested

Closes: Sprint 1.9"
```

Report: "PR created at https://github.com/aakifshamsi/digital-if/pull/XXX"

---

### PHASE 10: Wait for Approval

**Step 10.1: Report and STOP**
Report: "PR created and ready for review. Awaiting user approval to merge."

**IMPORTANT:** Do NOT proceed until user replies "approved" or similar.

---

### PHASE 11: Merge (After Approval)

**Step 11.1: Merge PR**
```bash
gh pr merge --squash
```

**Step 11.2: Switch to main + pull**
```bash
git checkout main
git pull origin main
```

---

### PHASE 12: Tag Release

**Step 12.1: Create tag**
```bash
git tag -a v1.9.0 -m "Sprint 1.9: Multi-tenant infrastructure

- Per-client Cloudflare Pages projects
- Client-specific subdomains (client-{id}.digitalhands.in)
- Ownership-based data isolation
- Template-based content routing
- Admin management of client subdomains"

git push origin v1.9.0
```

---

### PHASE 13: Update Documentation

**Step 13.1: Update CHANGELOG.md**
Edit `projects/dbeaver/CHANGELOG.md` and add:

```markdown
## [1.9.0] — 2026-05-24

### Infrastructure
- Cloudflare Pages projects created per client
- Per-client subdomains (client-{id}.digitalhands.in)
- Multi-tenant data isolation via KV key scoping
- Template-based content routing by clientId

### Security
- Ownership-based access control on all endpoints
- Admin-only CF project creation
- Non-blocking CF API errors (graceful degradation)
```

**Step 13.2: Update SPRINT-1.9.md**
Edit `docs/sprints/SPRINT-1.9.md`, change header to:
```markdown
# Sprint 1.9 — Multi-Tenant Infrastructure ✅ COMPLETE
**Status:** ✅ COMPLETE (2026-05-24)
```

**Step 13.3: Commit documentation**
```bash
git add projects/dbeaver/CHANGELOG.md docs/sprints/SPRINT-1.9.md
git commit -m "docs(Sprint 1.9): Mark complete, update changelog"
git push origin main
```

---

### PHASE 14: Clean Up

**Step 14.1: Delete feature branch**
```bash
git branch -D claude/sprint-1.9
git push origin --delete claude/sprint-1.9
```

---

### PHASE 15: Final Report

Report completion:
```
✅ Sprint 1.9 Complete

- Created: cf-projects.js (CF API wrapper)
- Modified: clients/index.js (POST), api/content/[clientId].js, clients/[id].js, admin/clients.html
- Tested: All endpoints syntax-valid
- Merged: PR to main
- Tagged: v1.9.0
- Branch: claude/sprint-1.9 deleted

Repository ready for Release 2.0 planning.
Current state: v1.9.0 — Multi-tenant SaaS infrastructure complete.
```

---

## CONSTRAINTS

✅ DO:
- Test all syntax before committing
- Handle CF API errors gracefully
- Report each phase
- Clean up branches after merge
- Follow exact file paths

❌ DON'T:
- Skip syntax checks
- Fail if CF API has issues (use try-catch)
- Proceed without user approval on PR merge
- Create branches without explicit instructions
- Modify code outside Sprint 1.9 scope

---

## DEPENDENCIES

- ✅ Sprint 1.8 must be merged to main (BLOCKER)
- ✅ cf-api.js working (from Sprint 1.6)
- ✅ KV storage working (from Sprint 1.6)
- ✅ Session management working (from Sprint 1.4)

---

## DNS MANUAL STEPS (User responsibility)

Before Sprint 1.9 goes live, user must configure:

1. Add wildcard CNAME in digitalhands.in DNS:
   ```
   *.digitalhands.in CNAME digitalhands.pages.dev
   ```

2. Or update Cloudflare nameservers to point to digitalhands.in

3. Test: Visit `https://client-demo.digitalhands.in` and confirm it resolves
