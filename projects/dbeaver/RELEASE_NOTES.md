# Release Notes - v0.2.0 (Draft)

Date: 2026-04-24

## What this release delivers
- dBeaver branding alignment for platform-level copy and docs
- Multi-target deployment automation (GitHub Pages / cPanel / Cloudflare Pages)
- Preflight guardrails to reduce failed deployments
- cPanel rsync-based deploy helper script

## Intended use in this release
- Internal demo + staging usage
- Controlled pilot with manual oversight

## Known risks / merge gate recommendations
Before merging to `main`, strongly consider fixing these high-risk items first:

1. Hardcoded credentials in frontend demo/admin pages
2. Stored XSS risk in admin rendering paths using `innerHTML`
3. Auth API hardening: CSRF, rate limiting, session invalidation/logout cleanup
4. Client credential handling (avoid plaintext display/storage in UI)

If these are not fixed now, merge should be treated as **non-production**.

## Suggested next release targets (v0.2.1)
- Security hardening pass for admin + API
- Minimal audit logging and error monitoring hooks
- CI checks for secret/config prerequisites
