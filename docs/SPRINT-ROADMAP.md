# Digital Hands — Sprint Roadmap & Current Status

**Last Updated:** May 24, 2026  
**Current Status:** Sprint 1.6 complete, ready for 1.7  
**Project Phase:** v1.0 Foundation complete → v1.1/v1.2 Infrastructure Bridge (in progress)

---

## ✅ Completed Sprints

### Sprint 1.0–1.5 (Foundation Phase)
- ✅ Admin panel + client portal
- ✅ Demo site templates (SPA, CV, Yoga)
- ✅ GitHub Actions CI/CD workflows
- ✅ Cloudflare Pages + KV backend
- ✅ Magic link auth framework
- ✅ dh-platform landing page structure

### Sprint 1.6 — "Cloudflare OAuth Integration" (Just Completed)
**Status:** ✅ DONE (May 24, 2026)

**What was delivered:**
- OAuth callback handler (cf-callback.js)
- Credential manager with KV storage (credentials.js)
- Cloudflare API wrapper with token refresh (cf-api.js)
- CSRF protection via state parameter
- Session cookie security headers (HttpOnly, Secure, SameSite)

**Branch:** `claude/sprint-1.6` (commit: a15e180)  
**Ready for:** Merge to main + tag v1.6.0

---

## 🚀 UPCOMING SPRINTS (IN PRIORITY ORDER)

### Sprint 1.7 — "Deploy dh-platform to digitalhands.in" (NEXT)
**Scope:** Deploy + domain routing (30 min)  
**Model:** Ministral 3.3B (fast + good for YAML)  
**When:** Immediately after 1.6 merges  

**Deliverables:**
- [ ] dh-platform deployed to `digitalhands.in` (Cloudflare Pages)
- [ ] CI/CD workflow for dh-platform deployment
- [ ] Health check endpoint returns 200
- [ ] GitHub Actions runs on push to `main`

**Out of Scope:**
- SSL certificates (Cloudflare handles)
- Email setup
- Monitoring/logging
- Accessibility testing

**Blockers:** None

---

### Sprint 1.8 — "Magic Links + Client Self-Edit"
**Scope:** Passwordless client auth + profile edit (45 min)  
**Model:** Qwen2.5-Coder-7B (excellent at vanilla JS)  
**When:** After 1.7 merged  

**Deliverables:**
- [ ] Admin can generate magic links (7-day expiry)
- [ ] Client dashboard shows "Email" + "Phone" self-edit fields
- [ ] Client can update email/phone via PUT /api/clients/:id
- [ ] Magic link validates state (CSRF protection)

**Out of Scope:**
- Two-factor auth
- Password resets
- Bulk invite flows

**Blockers:** 1.7 must be merged

---

### Sprint 1.9 — "Multi-Tenant Infrastructure"
**Scope:** Per-client Cloudflare Pages projects + subdomain routing (2-3 hours)  
**Model:** Magistral Small 2509 (needs reasoning)  
**When:** After 1.8 merged  

**Deliverables:**
- [ ] Each client gets own `client-{id}.digitalhands.in` subdomain
- [ ] Each client's site runs in isolated CF Pages project
- [ ] Admin can provision new client + auto-create project
- [ ] Credential isolation (one client ≠ access to another's tokens)

**Out of Scope:**
- Custom domain mapping (manual for now)
- Multi-region replication
- Backup/restore workflows

**Blockers:** 1.8 must be merged, Cloudflare API token stored securely

---

## 📋 Git Workflow

### Current State
```
main                          (v0.3.1, stable, July 2024 baseline)
  ↑
origin/claude/sprint-1.5      (v1.5, Nov 2024 — latest public release)
  ↑
claude/sprint-1.6             (a15e180, just committed by KiloCode)
```

### Next Steps
```bash
# 1. Rename branch to proper name
git branch -m sprint-2.0 claude/sprint-1.6

# 2. Push to origin
git push origin claude/sprint-1.6

# 3. Create release tag
git tag -a v1.6.0 -m "Sprint 1.6: Cloudflare OAuth integration"
git push origin v1.6.0

# 4. Merge to main (via PR or direct merge)
git checkout main
git merge --squash claude/sprint-1.6
git commit -m "feat(v1.6): Cloudflare OAuth integration (#X)"
git push origin main
```

### Protection Rules
- `main` requires squash merge (keeps history clean)
- No direct pushes to `main` (all via PR)
- Squash commits with format: `feat(vX.Y): Description (#PR)`

---

## 📊 Progress Toward digitalhands.in Launch

### Phase 1: Infrastructure (Current)
- ✅ Admin panel + auth backend
- ✅ Client portal framework
- ✅ OAuth foundation (Sprint 1.6)
- 🔄 Domain deployment (Sprint 1.7 — THIS WEEK)
- 🔄 Magic links (Sprint 1.8 — THIS WEEK)
- ⏳ Multi-tenant setup (Sprint 1.9 — NEXT WEEK)

### Phase 2: Operations (After 1.9)
- ⏳ Production hardening (security audit)
- ⏳ Monitoring + alerting
- ⏳ Backup/restore procedures

### Phase 3: Scale (After 2.0)
- ⏳ Billing integration (Stripe/Razorpay)
- ⏳ Marketplace for templates
- ⏳ White-label options

**ETA for digitalhands.in public launch:** May 31, 2026 (after Sprint 1.9)

---

## 🚨 Known Issues & Deferred Work

### Security (Fix in hardening sprint)
- XSS risk in admin rendering (use textContent instead of innerHTML)
- CSRF tokens not enforced on all POST routes
- Rate limiting missing on auth endpoints
- Input validation incomplete

### Features (Not in scope for current sprints)
- Custom domain provisioning (manual CNAME for now)
- AI content generation (stub API exists)
- Email notifications (no SMTP configured)
- Analytics dashboard (placeholder only)

### Technical Debt
- Encryption layer for CF tokens (TODO comment in credentials.js)
- Session garbage collection (7-day TTL only)
- No audit logging

---

## 👤 Team Context

**Current:** Single developer (Aakif) + AI agents (Claude, Ministral, Magistral)  
**Load Balancing:**
- Complex async/crypto work → Claude (API, not local)
- YAML + Bash scripts → Ministral 3.3B (local, fast)
- Vanilla JS + DOM → Qwen2.5-Coder-7B (local, specialized)
- Architecture + reasoning → Magistral 2509 (local, powerful)

**Estimated effort remaining to launch:**
- Sprint 1.7: 30 min (Ministral)
- Sprint 1.8: 45 min (Qwen)
- Sprint 1.9: 2-3 hours (Magistral + Claude)
- **Total: ~4 hours of agent work + 2 hours manual review**

---

## 🎯 Key Success Criteria

By end of Sprint 1.9 (May 31):
- [ ] digitalhands.in domain points to dh-platform
- [ ] Can create a new client via admin
- [ ] Client receives magic link to login
- [ ] Client sees their site at client-{id}.digitalhands.in
- [ ] Client can edit email + phone
- [ ] All tests pass, no console errors
- [ ] CI/CD workflows run automatically on push
- [ ] Code ready for security audit

---

**Next action:** See SPRINT-1.7.md for detailed implementation plan
