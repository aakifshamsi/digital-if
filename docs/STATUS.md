# Project Status

This document outlines the current purpose and state of the repository.

## Repository Purpose

**digitalhands** is a multi-tenant SaaS platform for digital service providers (salons, yoga studios, consultants, etc.). It provides:
- Client management and magic link authentication
- Admin dashboard for managing clients
- Cloudflare OAuth integration for account connection
- Per-client white-label templates (salon, spa, yoga, CV, etc.)
- Automated deployment to Cloudflare Pages via GitHub Actions

## Current State

**Beta** — Core infrastructure complete, moving toward production launch (May 31, 2026).

**Active Sprints:**
- Sprint 1.6: ✅ COMPLETE — Cloudflare OAuth integration
- Sprint 1.7: ✅ COMPLETE — dh-platform auto-deploy workflow
- Sprint 1.8: 🔄 PENDING — Magic link generation and client self-edit
- Sprint 1.9: 📋 PLANNED — Multi-tenant infrastructure (per-client subdomains)

## Key Features

* Admin dashboard for managing clients and generating magic links
* Client portal with self-edit capability (email, phone)
* Cloudflare OAuth for account connection
* Multiple white-label templates (salon, spa, yoga, CV)
* KV-based session management with automatic token refresh
* GitHub Actions auto-deployment to Cloudflare Pages
* Security: PBKDF2 hashing, HttpOnly cookies, CSRF protection, minimal IAM permissions

## Known Issues

* None currently blocking release

## Tasks

### Immediate Tasks (This Week)
* Complete Sprint 1.8: Magic link endpoint + client self-edit UI
* Complete Sprint 1.9: Multi-tenant subdomains (client-{id}.digitalhands.in)
* Launch digitalhands.in on May 31, 2026

### Next Tasks
* Email notifications for magic links
* Analytics dashboard (admin view)
* Stripe integration for subscriptions (2.0 release)

### Blocked Tasks
* Sprint 1.9 blocked until Sprint 1.8 merges to main

## Handover Information

### Key Commands
* `npm install`: Install dependencies
* `npm test`: Run test suite  
* `npm run build`: Build static assets
* `wrangler deploy`: Deploy to Cloudflare Pages (dbeaver project)
* `wrangler kv:key list`: View KV namespace contents
* `gh pr create`: Create pull request from feature branch
* `git tag -a v1.X.0`: Tag release version
* [Command 2]

### Project Structure
* [Provide a brief overview of the project's directory structure and the purpose of key directories. For example:
    * `src/`: Contains the main application source code.
    * `public/`: Static assets.
    * `tests/`: Unit and integration tests.
    * `docs/`: Documentation files.]
* [Directory 2]

### Current Setup
* [Describe the current environment setup, including any specific software versions, configurations, or dependencies required. For example:
    * Node.js version: v18.x
    * Database: PostgreSQL 14
    * Environment variables: `DATABASE_URL`, `API_KEY`
    * Key configurations: `config/default.json`]
* [Setup detail 2]

## Future Plans

* [Outline any planned features or improvements.]
* [Plan 2]
