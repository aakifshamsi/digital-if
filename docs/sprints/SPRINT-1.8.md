# Sprint 1.8 — Magic Links & Client Self-Edit 🔄 IN PROGRESS

**Status:** Ready to start  
**Duration:** 45 min (Qwen2.5-Coder-7B)  
**Branch:** claude/sprint-1.8  
**Model:** Qwen2.5-Coder-7B (vanilla JS specialization)  

---

## Goal

Enable **admin-generated magic links** for passwordless client login + **client self-edit** for email/phone.

---

## Current State

- Admin dashboard exists (`projects/dbeaver/admin/clients.html`)
- Client dashboard exists (`projects/dbeaver/client/dashboard.html`)
- Backend KV storage working (from Sprint 1.6)
- OAuth tokens stored and auto-refreshed
- NO magic link generation yet
- NO client self-edit endpoint yet

---

## What to Build

### 1. Magic Link Generation Endpoint
**File:** `projects/dbeaver/functions/api/clients/[id]/magic-link.js` (NEW)  
**Method:** POST  
**Auth:** Admin only (check session `user.role === 'admin'`)

**Request:**
```json
{
  "email": "client@example.com",
  "expiresIn": 604800  // 7 days in seconds (default)
}
```

**Response:**
```json
{
  "magicLink": "https://digitalhands.in/auth/magic?token=ABC123XYZ",
  "expiresAt": "2026-05-31T12:00:00Z"
}
```

**Implementation:**
- Generate 32-byte random token (base64 encoded)
- Store in KV: `magic-token:{token}` = `{clientId, email, createdAt, expiresAt}`
- TTL: expiresIn parameter (default 7 days)
- Return magic link URL (prepend domain from env.CF_DOMAIN or 'digitalhands.in')

### 2. Magic Link Validation Endpoint
**File:** `projects/dbeaver/functions/api/auth/magic-validate.js` (NEW)  
**Method:** GET  
**Params:** `?token=ABC123XYZ`

**Response:**
```json
{
  "clientId": "client-uuid",
  "email": "client@example.com",
  "valid": true
}
```

**Or (if expired/invalid):**
```json
{
  "valid": false,
  "reason": "Token expired"
}
```

**Implementation:**
- Read KV: `magic-token:{token}`
- If not found or expired, return 404 + `valid: false`
- Otherwise return client info + `valid: true`

### 3. Magic Link Login Endpoint
**File:** `projects/dbeaver/functions/api/auth/magic-login.js` (NEW)  
**Method:** POST  
**Params:** Body contains `token`

**Request:**
```json
{
  "token": "ABC123XYZ"
}
```

**Response:**
- Create session cookie (same as normal login)
- Delete the magic token from KV (single-use)
- Return 302 redirect to `/client/dashboard.html`

**Implementation:**
- Validate token exists + not expired
- Call `writeSession(env, { userId: clientId, role: 'client', ... })`
- Delete KV key: `magic-token:{token}`
- Set session cookie
- Return 302 redirect

### 4. Client Self-Edit Endpoint
**File:** `projects/dbeaver/functions/api/clients/[id].js` (MODIFY)  
**Method:** PUT (add to existing file)  
**Auth:** Client only (check session user.id matches [id])

**Request:**
```json
{
  "email": "newemail@example.com",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "client": {
    "id": "client-uuid",
    "email": "newemail@example.com",
    "phone": "+1234567890",
    "updatedAt": "2026-05-24T12:00:00Z"
  }
}
```

**Implementation:**
- Get clientId from route params [id]
- Check session.user.id === clientId (ownership validation)
- Read current client from KV: `client:{clientId}`
- Update only allowed fields: email, phone (NOT role, NOT created_at)
- Write back to KV with same TTL
- Return updated client object
- Return 403 if user tries to modify someone else's record

### 5. Admin UI: Magic Link Button
**File:** `projects/dbeaver/admin/clients.html` (MODIFY)  
**Location:** Each client row

**UI:**
- Add button next to each client: "Generate Magic Link"
- On click: POST to `/api/clients/{id}/magic-link`
- Show modal with magic link URL
- "Copy to Clipboard" button
- "Send via Email" button (future: Sprint 2.0)

**Implementation:**
- Add button with `onclick="generateMagicLink(this.dataset.clientId)"`
- Fetch POST `/api/clients/{clientId}/magic-link`
- Show result in modal with link
- Add copy-to-clipboard handler

### 6. Client UI: Self-Edit Form
**File:** `projects/dbeaver/client/dashboard.html` (MODIFY)  
**Location:** Existing profile card

**UI:**
- Show current email + phone (read from session)
- Input fields for email + phone
- Save button
- Success/error message display

**Implementation:**
- On load: populate current email/phone from `<data-*>` attributes
- On Save click: PUT to `/api/clients/{clientId}`
- Show "Saving..." spinner
- On success: "Profile updated!" message + disable inputs for 2 seconds
- On error: Show error message in red

---

## Files to Create

1. `projects/dbeaver/functions/api/clients/[id]/magic-link.js` (NEW, 35 lines)
2. `projects/dbeaver/functions/api/auth/magic-validate.js` (NEW, 25 lines)
3. `projects/dbeaver/functions/api/auth/magic-login.js` (NEW, 40 lines)

## Files to Modify

1. `projects/dbeaver/functions/api/clients/[id].js` (add PUT handler, ~30 lines)
2. `projects/dbeaver/admin/clients.html` (add UI + JS, ~20 lines)
3. `projects/dbeaver/client/dashboard.html` (add form + JS, ~15 lines)

---

## Success Criteria

- ✅ POST `/api/clients/{id}/magic-link` returns URL + expiry
- ✅ GET `/api/auth/magic-validate?token=X` validates token
- ✅ POST `/api/auth/magic-login` creates session + deletes token
- ✅ PUT `/api/clients/{id}` updates email/phone (ownership validated)
- ✅ Admin can generate + copy magic links from UI
- ✅ Clients can self-edit email/phone from dashboard
- ✅ All endpoints return proper error codes (403, 404, 400)
- ✅ Committed to `origin/claude/sprint-1.8`
- ✅ PR created, merged to main, tagged v1.8.0

---

## What NOT to Do

❌ Do NOT add email sending (that's Sprint 2.0)  
❌ Do NOT modify pricing/tier logic  
❌ Do NOT create new database schema (use existing KV)  
❌ Do NOT add QR codes or 2FA  
❌ Do NOT write tests (that's later sprint)  
❌ Do NOT merge to main yourself — wait for user review  

---

## Dependencies

- Sprint 1.7 must be merged ✅ (DONE)
- KV storage working ✅ (from Sprint 1.6)
- Session management working ✅ (from Sprint 1.4)

---

## Model Recommendation

**Qwen2.5-Coder-7B** — Specialized for vanilla JavaScript + DOM manipulation. Strong at:
- Client-side fetch() + error handling
- DOM event listeners
- Form validation
- Modal/popup UI patterns
- Route parameter handling in CF functions

If stuck on async patterns, escalate to Magistral Small 2509.
