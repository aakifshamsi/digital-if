# dBeaver (working name) — DigitalHands Site Platform

Generic AI-assisted website builder platform for multiple client verticals.
Current demo template is spa & massage (Jacqueline-inspired), but the platform
is not limited to spa businesses.

## Live Demo

Open `index.html` for the full navigation hub.

### Demo Credentials

| Portal | Email | Password |
|--------|-------|----------|
| Admin  | `admin@digitalhands.in` | `admin123` |
| Client (Serenity Spa) | `client@serenityspa.ca` | `spa2024` |
| Client (Bloom Salon)  | `client@bloombeauty.ca` | `bloom2024` |

---

## Project Structure

```
spa-builder/
├── index.html              ← Platform hub / entry point
├── .htaccess               ← Apache config (shared hosting)
├── demo/                   ← Spa template (massagedowntownvancouver.com style)
│   ├── index.html          ← Home page
│   ├── services.html       ← Services & pricing
│   ├── booking.html        ← Appointment booking form
│   ├── about.html          ← About & team
│   ├── contact.html        ← Contact page
│   └── assets/
│       ├── css/main.css    ← Full spa stylesheet
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
git subtree push --prefix=projects/spa-builder origin gh-pages
```

Then enable GitHub Pages → branch `gh-pages` → root `/`.

Visit: `https://yourusername.github.io/repo-name/`

### Option B — Linux Shared Hosting (cPanel / FTP)

Full PHP session auth available.

1. Upload the entire `spa-builder/` folder to `public_html/`
2. The `.htaccess` file handles routing and security headers
3. Ensure PHP 7.4+ is available (most shared hosts have it)
4. Change passwords: edit `api/users.json` — replace `password_hash` values:

```php
// Run in PHP to generate a new hash:
echo password_hash('yournewpassword', PASSWORD_BCRYPT);
```

5. For PHP auth, update the login forms to POST to `../api/auth.php`
   instead of using the built-in sessionStorage demo auth.

### Option C — Netlify / Vercel (static)

Same as GitHub Pages. Drag-and-drop the `spa-builder/` folder.

### Option D — GitHub Actions deploy wizard (recommended)

Use `.github/workflows/dbeaver-deploy.yml` with manual `workflow_dispatch`
inputs to deploy to:
- `dry-run` (preflight only)
- `github-pages`
- `cpanel-sftp`
- `cloudflare-pages`

The workflow runs prerequisite checks via
`projects/spa-builder/scripts/preflight.sh`, uploads a reusable artifact, and
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

## Roadmap (v2.0)

- [ ] Real AI provider integration for content (Cloudflare Workers AI / Ollama)
- [ ] More templates (hair salon, yoga, nutrition coach)
- [ ] Drag-and-drop block editor
- [ ] Custom domain mapping
- [ ] Stripe billing integration
- [ ] Email notifications (appointment confirmations)
- [ ] WhatsApp Business integration
