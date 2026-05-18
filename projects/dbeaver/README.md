# dBeaver (working name) — DigitalHands Site Platform

Generic AI-assisted website builder platform for multiple client verticals.
Current demos are sample client builds; the platform is vertical-agnostic and
intended for broad web/software service delivery.

## Live Demo

Open `index.html` for the full navigation hub.

## Docs index

- `CHANGELOG.md` → change history
- `RELEASE_NOTES.md` → release summary + known risks
- `USAGE.md` → quick start + common workflows
- `OPERATIONS.md` → deployment, monitoring, rollback

### Demo Credentials

| Portal | Email | Password |
|--------|-------|----------|
| Admin  | `admin@digitalhands.in` | `admin123` |
| Client (Demo A) | `client@serenityspa.ca` | `spa2024` |
| Client (Demo B) | `client@bloombeauty.ca` | `bloom2024` |

---

## Project Structure

```
dbeaver/
├── index.html              ← Platform hub / entry point
├── .htaccess               ← Apache config (shared hosting)
├── demo/                   ← Sample client template set
│   ├── index.html          ← Home page
│   ├── services.html       ← Services & pricing
│   ├── booking.html        ← Appointment booking form
│   ├── about.html          ← About & team
│   ├── contact.html        ← Contact page
│   └── assets/
│       ├── css/main.css    ← Demo stylesheet
│       └── js/main.js      ← Interactions, counters, forms
├── admin/                  ← DigitalHands.in admin panel
│   ├── login.html          ← Admin login
│   ├── dashboard.html      ← Overview & stats
│   ├── clients.html        ← Client management (CRUD)
│   ├── editor.html         ← Visual site editor
│   ├── templates.html      ← Template library
│   └── assets/
│       ├── css/admin.css
│       └── js/admin.js     ← Auth, data store, utils
├── client/                 ← Client portal
│   ├── login.html          ← Client login
│   ├── dashboard.html      ← Client view (site, stats, actions)
│   └── assets/css/client.css
└── api/                    ← PHP backend (for shared hosting)
    ├── config.php          ← Common helpers
    ├── auth.php            ← Login/logout/session
    ├── clients.php         ← Client CRUD
    └── users.json          ← User store (bcrypt passwords)
```

---

## Deployment

### Option A — GitHub Pages (static, no PHP)

Auth uses `sessionStorage` + `localStorage` (client-side only, demo-grade).

```bash
# From repo root
git subtree push --prefix=projects/dbeaver origin gh-pages
```

Then enable GitHub Pages → branch `gh-pages` → root `/`.

Visit: `https://yourusername.github.io/repo-name/`

### Option B — Linux Shared Hosting (cPanel / FTP)

Full PHP session auth available.

1. Upload the entire `dbeaver/` folder to `public_html/`
2. The `.htaccess` file handles routing and security headers
3. Ensure PHP 7.4+ is available (most shared hosts have it)
4. Change passwords: edit `api/users.json` — replace `password_hash` values:

```php
// Run in PHP to generate a new hash:
echo password_hash('yournewpassword', PASSWORD_BCRYPT);
```

<!-- -->
5. For PHP auth, update the login forms to POST to `../api/auth.php`
   instead of using the built-in sessionStorage demo auth.

### Option C — Netlify / Vercel (static)

Same as GitHub Pages. Drag-and-drop the `dbeaver/` folder.

### Option D — GitHub Actions deploy wizard (recommended)

Use `.github/workflows/dbeaver-deploy.yml` with manual `workflow_dispatch`
inputs to deploy to:
- `dry-run` (preflight only)
- `github-pages`
- `cpanel-sftp`
- `cloudflare-pages`

The workflow runs prerequisite checks via
`projects/dbeaver/scripts/preflight.sh`, uploads a reusable artifact, and
then runs target-specific deployment jobs.

#### Required GitHub Secrets

- For `cpanel-sftp`:
  - `CPANEL_HOST`
  - `CPANEL_USER`
  - `CPANEL_SSH_KEY` (private key content)
  - `CPANEL_REMOTE_DIR` (for example: `/home/user/public_html`)
- For `cloudflare-pages`:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
  - `CLOUDFLARE_PAGES_PROJECT`

---

## Customization

### Change demo client branding (current example: massagedowntownvancouver.com)

Edit `demo/index.html`:
- Business name, address, phone, hours
- Hero headline and subtext

Edit `demo/assets/css/main.css`:
- `:root` CSS variables: `--green-deep`, `--gold`, `--cream`

### Add a new client via admin

1. Go to `admin/clients.html`
2. Click "+ Add Client"
3. Fill in business name, login email, password
4. Share credentials with client → they log in at `client/login.html`

### AI content

The editor (`admin/editor.html` → AI tab) has demo AI responses.
To wire up real AI on a zero-cost stack, add `api/ai.php` and route requests
to a free/local provider such as:
- Cloudflare Workers AI (free tier)
- Ollama running local open models (via LAN/VPS/Oracle Free Tier later)

---

## Roadmap

### v1.0 — Foundation ✅

- [x] dBeaver demo: multi-client website builder platform
- [x] Admin panel (login, dashboard, clients, editor, templates)
- [x] Client portal (login, dashboard)
- [x] Demo site (spa/massage template)
- [x] Apache `.htaccess` hardening + security headers
- [x] CI/CD: GitHub Actions → GitHub Pages + CF Pages + cPanel
- [x] Auto-versioning, CHANGELOG, GitHub Releases on merge to main
- [x] PR sanity checks (HTML lint, JS syntax, link checker, file size guard)
- [x] PR preview deployments (Cloudflare Pages branch previews)

### v1.1 — Digital Hands Platform (active)

- [ ] dh-platform: corporate landing page live at digitalhands.in
- [ ] Admin CRM — client list, add/edit, notes, status
- [ ] Invoicing manager — create, send, track, PDF export
- [ ] Freemium site builder — 1 page free, upgrade for more
- [ ] Marketplace — browse and purchase AI-generated website artifacts
- [ ] Pricing page with freemium / pro / agency tiers

### v1.2 — Infrastructure Bridge

- [ ] Centralized credential manager: CF Account ID + API Token → app derives all
  sub-credentials (Workers, R2, KV, Tunnel, DNS) — users provide two values, the rest is automatic
- [ ] Domain manager: provision short aliases (`yourbiz.dh.in`) via CF DNS API
- [ ] Cloudflared tunnel support: expose local/self-hosted services securely via CF Tunnel
- [ ] Backblaze B2 integration: cheap object storage for media, backups, artifacts
  (S3-compatible — proxied through CF Workers to eliminate egress fees)
- [ ] cPanel/WHM bridge: shared reseller hosting API for PHP site deployments
- [ ] Multi-cloud config sync: CF KV as the single source of truth across all environments

### v1.3 — AI & Automation

- [ ] Real AI content generation (Cloudflare Workers AI — free tier)
- [ ] AI-generated site sections, copy, images via marketplace artifacts
- [ ] Email automation: appointment confirmations, invoice delivery
- [ ] WhatsApp Business integration for client notifications
- [ ] Drag-and-drop block editor

### v2.0 — Scale & Monetisation

- [ ] Hybrid business model: freemium + affiliate + white-label + service-based
- [ ] Affiliate / reseller program with commission tracking dashboard
- [ ] Stripe / Razorpay billing integration
- [ ] More templates: hair salon, yoga, nutrition coach, portfolio, SaaS landing
- [ ] Offline-capable edge nodes: cluster across cloud + local Linux hardware
- [ ] Cloudflared mesh: bridge cloud ↔ on-premise ↔ mobile for zero-trust access
- [ ] Multi-tenant isolation: each client gets their own CF Pages project + subdomain
