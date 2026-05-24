# Sprint 1.8 KiloCode Handoff Prompt

You are KiloCode, executing **Sprint 1.8: Magic Links & Client Self-Edit**.

## EXECUTION INSTRUCTIONS (Follow EXACTLY)

### PHASE 1: Read & Verify Current State

**Step 1.1: Read the sprint plan**
```bash
cd /opt/digitalhands/workspaces/dhBeaver/digital-if
cat docs/sprints/SPRINT-1.8.md
```
Report: "Read Sprint 1.8 plan. Starting implementation."

**Step 1.2: Create feature branch**
```bash
git checkout main
git pull origin main
git checkout -b claude/sprint-1.8
```

---

### PHASE 2: Create New Endpoint Files

**Step 2.1: Create magic-link.js**
File: `projects/dbeaver/functions/api/clients/[id]/magic-link.js`

```javascript
import { json, err, sessionCookie } from '../../_shared/http.js';
import { getJSON, putJSON } from '../../_shared/kv.js';

export default async (request, env) => {
  if (request.method !== 'POST') return err(405, 'Method not allowed');

  try {
    const { user } = request.session || {};
    if (!user || user.role !== 'admin') return err(403, 'Admin only');

    const clientId = request.params.id;
    if (!clientId) return err(400, 'Missing client ID');

    const { email, expiresIn = 604800 } = await request.json();
    if (!email) return err(400, 'Missing email');

    // Verify client exists
    const client = await getJSON(env, `client:${clientId}`);
    if (!client) return err(404, 'Client not found');

    // Generate random token
    const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = btoa(String.fromCharCode(...tokenBytes)).replace(/[^a-zA-Z0-9_-]/g, '');

    // Store magic link in KV
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    await putJSON(env, `magic-token:${token}`, {
      clientId,
      email,
      createdAt: new Date().toISOString(),
      expiresAt,
    }, expiresIn);

    // Build magic link URL
    const domain = env.CF_DOMAIN || 'digitalhands.in';
    const magicLink = `https://${domain}/auth/magic?token=${token}`;

    return json({ magicLink, expiresAt });
  } catch (error) {
    console.error('magic-link error:', error);
    return err(500, error.message);
  }
};
```

**Step 2.2: Create magic-validate.js**
File: `projects/dbeaver/functions/api/auth/magic-validate.js`

```javascript
import { json, err } from '../_shared/http.js';
import { getJSON } from '../_shared/kv.js';

export default async (request, env) => {
  if (request.method !== 'GET') return err(405, 'Method not allowed');

  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    if (!token) return err(400, 'Missing token parameter');

    const magicLink = await getJSON(env, `magic-token:${token}`);
    if (!magicLink) return json({ valid: false, reason: 'Token not found' });

    // Check expiry
    const expiresAt = new Date(magicLink.expiresAt);
    if (expiresAt < new Date()) {
      return json({ valid: false, reason: 'Token expired' });
    }

    return json({
      valid: true,
      clientId: magicLink.clientId,
      email: magicLink.email,
    });
  } catch (error) {
    console.error('magic-validate error:', error);
    return err(500, error.message);
  }
};
```

**Step 2.3: Create magic-login.js**
File: `projects/dbeaver/functions/api/auth/magic-login.js`

```javascript
import { json, err, sessionCookie } from '../_shared/http.js';
import { getJSON, putJSON } from '../_shared/kv.js';
import { writeSession } from '../_shared/auth.js';

export default async (request, env) => {
  if (request.method !== 'POST') return err(405, 'Method not allowed');

  try {
    const { token } = await request.json();
    if (!token) return err(400, 'Missing token');

    const magicLink = await getJSON(env, `magic-token:${token}`);
    if (!magicLink) return err(404, 'Token not found');

    // Check expiry
    const expiresAt = new Date(magicLink.expiresAt);
    if (expiresAt < new Date()) {
      return err(401, 'Token expired');
    }

    const { clientId, email } = magicLink;

    // Create session
    const sessionData = {
      userId: clientId,
      clientId,
      email,
      role: 'client',
      loginMethod: 'magic-link',
      loginAt: new Date().toISOString(),
    };

    await writeSession(env, sessionData);

    // Delete magic token (single-use)
    await env.DH_KV.delete(`magic-token:${token}`);

    // Return redirect with session cookie
    const response = new Response(null, {
      status: 302,
      headers: {
        'Location': '/client/dashboard.html?magic=success',
        'Set-Cookie': sessionCookie(sessionData),
      },
    });

    return response;
  } catch (error) {
    console.error('magic-login error:', error);
    return err(500, error.message);
  }
};
```

---

### PHASE 3: Modify Existing Files

**Step 3.1: Modify projects/dbeaver/functions/api/clients/[id].js (add PUT handler)**

After the existing GET handler, add this PUT handler:

```javascript
// Add this after the GET handler
if (request.method === 'PUT') {
  try {
    const { user } = request.session || {};
    const clientId = request.params.id;

    // Ownership check
    if (!user || user.clientId !== clientId) {
      return err(403, 'Cannot modify other clients');
    }

    const { email, phone } = await request.json();
    if (!email || !phone) return err(400, 'Missing email or phone');

    // Get existing client
    const client = await getJSON(env, `client:${clientId}`);
    if (!client) return err(404, 'Client not found');

    // Update only safe fields
    const updated = {
      ...client,
      email,
      phone,
      updatedAt: new Date().toISOString(),
    };

    // Save back to KV
    await putJSON(env, `client:${clientId}`, updated);

    return json({ success: true, client: updated });
  } catch (error) {
    console.error('PUT /clients/[id] error:', error);
    return err(500, error.message);
  }
}
```

**Step 3.2: Modify projects/dbeaver/admin/clients.html (add magic link button)**

Find the section where client rows are displayed (in the table body). Add this button to each row:

```html
<button class="btn btn-sm btn-primary" onclick="generateMagicLink(this.dataset.clientId)" data-client-id="${client.id}">
  Generate Magic Link
</button>
```

Then add this JavaScript before the closing `</script>` tag:

```javascript
async function generateMagicLink(clientId) {
  try {
    const response = await fetch(`/api/clients/${clientId}/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'client@example.com' }),
    });
    
    if (!response.ok) throw new Error('Failed to generate magic link');
    
    const { magicLink, expiresAt } = await response.json();
    
    // Show modal or alert
    const message = `Magic Link:\n${magicLink}\n\nExpires: ${expiresAt}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(magicLink);
      alert('Magic link copied to clipboard!\n\n' + message);
    } else {
      alert(message);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}
```

**Step 3.3: Modify projects/dbeaver/client/dashboard.html (add self-edit form)**

Find the profile section. Add or modify to include:

```html
<div class="card">
  <div class="card-header">
    <h5>My Profile</h5>
  </div>
  <div class="card-body">
    <div class="form-group">
      <label>Email</label>
      <input type="email" id="clientEmail" class="form-control" />
    </div>
    <div class="form-group">
      <label>Phone</label>
      <input type="tel" id="clientPhone" class="form-control" />
    </div>
    <button class="btn btn-primary" onclick="saveProfile()">Save Changes</button>
    <div id="profileMessage" style="margin-top: 10px;"></div>
  </div>
</div>

<script>
  // Load current profile on page load
  window.addEventListener('load', () => {
    const session = window.sessionData || {}; // Set this from server if available
    if (session.email) document.getElementById('clientEmail').value = session.email;
    if (session.phone) document.getElementById('clientPhone').value = session.phone || '';
  });

  async function saveProfile() {
    const email = document.getElementById('clientEmail').value;
    const phone = document.getElementById('clientPhone').value;
    const messageDiv = document.getElementById('profileMessage');

    if (!email || !phone) {
      messageDiv.innerHTML = '<span style="color: red;">Email and phone are required</span>';
      return;
    }

    try {
      messageDiv.innerHTML = '<span style="color: blue;">Saving...</span>';
      
      const clientId = window.sessionData?.clientId || window.sessionData?.userId;
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone }),
      });

      if (!response.ok) throw new Error('Failed to save profile');

      messageDiv.innerHTML = '<span style="color: green;">Profile updated!</span>';
      setTimeout(() => { messageDiv.innerHTML = ''; }, 3000);
    } catch (error) {
      messageDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
    }
  }
</script>
```

---

### PHASE 4: Test Endpoints

**Step 4.1: Test magic-link generation**
```bash
curl -X POST http://localhost:8787/api/clients/test-client-id/magic-link \
  -H "Content-Type: application/json" \
  -b "session=test-session-cookie" \
  -d '{"email":"client@example.com"}'
```
Expected: Returns magicLink URL + expiresAt timestamp

**Step 4.2: Verify file syntax**
```bash
node -c projects/dbeaver/functions/api/clients/[id]/magic-link.js
node -c projects/dbeaver/functions/api/auth/magic-validate.js
node -c projects/dbeaver/functions/api/auth/magic-login.js
```
All should return "No syntax errors"

---

### PHASE 5: Commit & Push

**Step 5.1: Stage all changes**
```bash
git add -A
git status
```
Report: List of modified + new files

**Step 5.2: Commit**
```bash
git commit -m "feat(Sprint 1.8): Magic link endpoints + client self-edit

- Add POST /api/clients/{id}/magic-link for admin magic link generation
- Add GET /api/auth/magic-validate for token validation
- Add POST /api/auth/magic-login for passwordless login
- Add PUT /api/clients/{id} for client email/phone self-edit
- Update admin UI with magic link button
- Update client dashboard with profile edit form
- All endpoints with proper auth checks (admin-only, ownership validation)
- Tokens stored in KV with 7-day TTL, single-use after login"
```

**Step 5.3: Push to branch**
```bash
git push origin claude/sprint-1.8
```
Report: "Branch pushed successfully"

---

### PHASE 6: Create PR

**Step 6.1: Create PR via gh CLI**
```bash
gh pr create \
  --base main \
  --title "feat(Sprint 1.8): Magic links & client self-edit" \
  --body "## Sprint 1.8 Complete

- ✅ Magic link generation (admin-only)
- ✅ Token validation endpoint
- ✅ Passwordless login via magic link
- ✅ Client self-edit (email, phone)
- ✅ All endpoints tested
- ✅ UI updated for admin + client

Closes: Sprint 1.8"
```

Report: "PR created at https://github.com/aakifshamsi/digital-if/pull/XXX"

---

### PHASE 7: Wait for Approval

**Step 7.1: Report and STOP**
Report: "PR created and ready for review. Awaiting user approval to merge."

**IMPORTANT:** Do NOT proceed until user replies "approved" or similar.

---

### PHASE 8: Merge (After Approval)

**Step 8.1: Merge PR**
```bash
gh pr merge --squash
```

**Step 8.2: Switch to main + pull**
```bash
git checkout main
git pull origin main
```

---

### PHASE 9: Tag Release

**Step 9.1: Create tag**
```bash
git tag -a v1.8.0 -m "Sprint 1.8: Magic links & client self-edit

- Passwordless login via email magic links (7-day TTL)
- Client self-edit for email and phone
- Admin dashboard magic link generation
- Ownership validation on all client endpoints"

git push origin v1.8.0
```

---

### PHASE 10: Update Documentation

**Step 10.1: Update CHANGELOG.md**
Edit `projects/dbeaver/CHANGELOG.md` and add after the [Unreleased] section:

```markdown
## [1.8.0] — 2026-05-24

### Features
- Magic link generation endpoint (admin-only)
- Passwordless client login via magic links
- Client self-edit for email and phone
- Token validation endpoint

### Security
- Ownership validation on PUT /clients/{id}
- Single-use magic tokens
- 7-day magic link expiration
```

**Step 10.2: Update SPRINT-1.8.md**
Edit `docs/sprints/SPRINT-1.8.md`, change header to:
```markdown
# Sprint 1.8 — Magic Links & Client Self-Edit ✅ COMPLETE
**Status:** ✅ COMPLETE (2026-05-24)
```

**Step 10.3: Commit documentation**
```bash
git add projects/dbeaver/CHANGELOG.md docs/sprints/SPRINT-1.8.md
git commit -m "docs(Sprint 1.8): Mark complete, update changelog"
git push origin main
```

---

### PHASE 11: Clean Up

**Step 11.1: Delete feature branch**
```bash
git branch -D claude/sprint-1.8
git push origin --delete claude/sprint-1.8
```

---

### PHASE 12: Final Report

Report completion:
```
✅ Sprint 1.8 Complete

- Created: magic-link.js, magic-validate.js, magic-login.js
- Modified: [id].js (PUT handler), admin/clients.html, client/dashboard.html
- Tested: All endpoints syntax-valid
- Merged: PR to main
- Tagged: v1.8.0
- Branch: claude/sprint-1.8 deleted

Repository ready for Sprint 1.9.
Next: Review Sprint 1.9 plan at docs/sprints/SPRINT-1.9.md
```

---

## CONSTRAINTS

✅ DO:
- Test each endpoint thoroughly
- Report each phase completion
- Follow exact file paths
- Use proper git commit messages
- Clean up branches after merge

❌ DON'T:
- Skip testing
- Hallucinate file paths or API responses
- Merge PR without user approval
- Proceed to Sprint 1.9 without completing all steps
- Create new branches unless told to
- Modify any code outside the sprint scope

---

## MODEL NOTES

- **Best for:** Qwen2.5-Coder-7B (vanilla JS specialization)
- **Fallback to:** Magistral Small 2509 (if async issues)
- **Avoid:** Ministral 3.3B (too fast, misses error handling)

---

## DEPENDENCIES

- ✅ Sprint 1.7 must be complete (it is — merged to main v1.7.0)
- ✅ All KV functions available (getJSON, putJSON from Sprint 1.6)
- ✅ Session management working (writeSession, readSession from Sprint 1.4)
