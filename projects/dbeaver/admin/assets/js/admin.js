/* =====================================================
   DigitalHands.in — Admin Panel JS
   ===================================================== */

(function() {
  'use strict';

  /* ── Auth guard ── */
  function requireAuth() {
    // DEMO MODE: sessionStorage gate — trivially bypassable via DevTools.
    // Production: replace with a fetch to api/auth.php?action=me and
    // redirect on 401 response from the PHP session layer.
    if (sessionStorage.getItem('dh_admin_auth') !== 'true') {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  /* ── Populate user info in sidebar ── */
  function populateUser() {
    const raw  = sessionStorage.getItem('dh_admin_user');
    if (!raw) return;
    const user = JSON.parse(raw);
    const nameEl = document.getElementById('sidebar-user-name');
    const roleEl = document.getElementById('sidebar-user-role');
    const avaEl  = document.getElementById('sidebar-avatar');
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role;
    if (avaEl)  avaEl.textContent  = user.name.charAt(0).toUpperCase();
  }

  /* ── Logout ── */
  // keepalive: true lets the POST complete after navigation starts, so the
  // server-side session is always invalidated even if the user clicks Sign Out
  // and immediately closes the tab. Falls back to await for older browsers.
  window.doLogout = async function() {
    sessionStorage.removeItem('dh_admin_auth');
    sessionStorage.removeItem('dh_admin_user');
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        keepalive: true
      });
    } catch (e) { /* network down — sessionStorage is already cleared */ }
    window.location.href = 'login.html';
  };

  /* ── Simple toast ── */
  window.showToast = function(msg, type) {
    type = type || 'info';
    const colors = { info: '#4a6cf7', success: '#22c55e', error: '#ef4444' };
    let t = document.getElementById('admin-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'admin-toast';
      Object.assign(t.style, {
        position: 'fixed', bottom: '24px', right: '24px',
        padding: '13px 22px', borderRadius: '8px',
        fontFamily: 'inherit', fontSize: '.87rem',
        color: '#fff', zIndex: '9999',
        boxShadow: '0 8px 32px rgba(0,0,0,.3)',
        transition: 'all .3s', opacity: '0',
        transform: 'translateY(8px)'
      });
      document.body.appendChild(t);
    }
    t.style.background = colors[type] || colors.info;
    t.textContent = msg;
    requestAnimationFrame(() => { t.style.opacity='1'; t.style.transform='translateY(0)'; });
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => { t.style.opacity='0'; t.style.transform='translateY(8px)'; }, 3500);
  };

  /* ── Client data store (localStorage) ── */
  const CLIENTS_KEY = 'dh_clients';

  window.getClients = function() {
    const raw = localStorage.getItem(CLIENTS_KEY);
    if (raw) return JSON.parse(raw);
    const defaults = [
      {
        id: 'cli_001', name: 'Serenity Spa & Massage', contact: 'Maya Chen',
        email: 'maya@serenityspa.ca', phone: '(604) 200-1234',
        domain: 'massagedowntownvancouver.com', template: 'spa-massage',
        status: 'active', plan: 'Professional', created: '2024-01-15',
        login: { email: 'client@serenityspa.ca', password: 'spa2024' }
      },
      {
        id: 'cli_002', name: 'Bloom Beauty Salon', contact: 'Sophie Laurent',
        email: 'sophie@bloombeauty.ca', phone: '(604) 333-5678',
        domain: 'bloombeautyvancouver.com', template: 'spa-massage',
        status: 'active', plan: 'Starter', created: '2024-02-20',
        login: { email: 'client@bloombeauty.ca', password: 'bloom2024' }
      },
      {
        id: 'cli_003', name: 'Pacific Wellness Centre', contact: 'James Tan',
        email: 'james@pacificwellness.ca', phone: '(604) 789-0123',
        domain: 'pacificwellness.ca', template: 'spa-massage',
        status: 'pending', plan: 'Professional', created: '2024-03-10',
        login: { email: 'client@pacificwellness.ca', password: 'pacific2024' }
      }
    ];
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(defaults));
    return defaults;
  };

  window.saveClients = function(clients) {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  };

  /* ── Per-client content + theme (CMS) ── */
  // Storage keys are namespaced by clientId so each client gets isolated data.
  const CONTENT_PREFIX = 'dh_content_';
  const THEME_PREFIX   = 'dh_theme_';

  const DEFAULT_THEME = {
    colors: {
      'black':       '#000000',
      'black-soft':  '#111111',
      'black-card':  '#1a1a1a',
      'gold':        '#c5a47e',
      'white':       '#ffffff',
      'gray':        '#aaaaaa'
    },
    fonts: {
      display: "'Playfair Display', Georgia, serif",
      body:    "'Montserrat', 'Helvetica Neue', Arial, sans-serif"
    }
  };

  const DEFAULT_CONTENT = {
    settings: {
      brandName: 'Serenity',
      tagline:   'Spa & Massage · Vancouver',
      siteName:  'Serenity Spa & Massage',
      phone:     '(604) 200-1234',
      email:     'hello@serenityspa.ca',
      address:   '789 Granville Street, Suite 200, Vancouver, BC V6Z 1K3',
      businessHours: 'Mon–Fri: 9am – 8pm · Sat–Sun: 10am – 6pm',
      social: { facebook: '', twitter: '', dribbble: '', instagram: '' }
    },
    heroSlides: [
      {
        title: 'Restore Your Body,',
        titleAccent: 'Renew Your Spirit',
        subtitle: "Downtown Vancouver's Premier Spa",
        description: 'Indulge in therapeutic massage and luxury spa treatments crafted to melt away stress and restore balance.',
        image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1800&q=85',
        ctaText: 'Book an Appointment',
        ctaLink: 'booking.html'
      }
    ],
    services: [
      { number: '01', title: 'Swedish Massage',  price: '$90 / 60 min',  image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600&q=85', description: 'The classic full-body massage using long flowing strokes to ease muscle tension.' },
      { number: '02', title: 'Deep Tissue',      price: '$110 / 60 min', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=85', description: 'Targets deeper layers of muscle and connective tissue.' },
      { number: '03', title: 'Hot Stone Therapy',price: '$130 / 75 min', image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&q=85', description: 'Warm basalt stones melt tension deep in the muscles.' },
      { number: '04', title: 'Prenatal Massage', price: '$100 / 60 min', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=85', description: 'Specially tailored for expecting mothers.' },
      { number: '05', title: 'Reflexology',      price: '$80 / 45 min',  image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&q=85', description: 'Precise pressure on the feet for whole-body healing.' },
      { number: '06', title: 'Aromatherapy',     price: '$115 / 60 min', image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=600&q=85', description: 'Therapeutic essential oils combined with massage.' }
    ],
    pricingPlans: [
      {
        name: 'Silver Pack', subtitle: 'Essential monthly care',
        price: 99, period: '/Mo', isActive: false,
        features: ['1 full-body massage / month', '10% off all add-ons', 'Priority booking window', 'Aromatherapy upgrade included'],
        ctaText: 'Get Now', ctaLink: 'booking.html'
      },
      {
        name: 'Gold Pack', subtitle: 'For our most loyal guests',
        price: 199, period: '/Mo', isActive: true,
        features: ['2 full-body massages / month', '20% off all add-ons', 'Free hot stone upgrade', 'Complimentary guest pass quarterly', 'Priority therapist selection'],
        ctaText: 'Get Now', ctaLink: 'booking.html'
      }
    ],
    team: [
      { name: 'Maya Chen',       role: 'Registered Massage Therapist', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&q=85', social: { facebook: '', twitter: '', instagram: '' } },
      { name: 'David Park',      role: 'Deep Tissue Specialist',       image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=500&q=85', social: { facebook: '', twitter: '', instagram: '' } },
      { name: 'Aisha Thompson',  role: 'Aromatherapy & Hot Stone',     image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=500&q=85', social: { facebook: '', twitter: '', instagram: '' } },
      { name: 'Lena Müller',     role: 'Prenatal & Reflexology',       image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=500&q=85', social: { facebook: '', twitter: '', instagram: '' } }
    ]
  };

  window.DEFAULT_CONTENT = DEFAULT_CONTENT;
  window.DEFAULT_THEME   = DEFAULT_THEME;

  /* ── Sync getters (used at page load; return cached/defaults instantly) ── */
  window.getContent = function(clientId) {
    const raw = localStorage.getItem(CONTENT_PREFIX + clientId);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_CONTENT));
    try { return JSON.parse(raw); }
    catch (e) { console.warn('[dh-admin] corrupt content for', clientId, e); return JSON.parse(JSON.stringify(DEFAULT_CONTENT)); }
  };

  window.getTheme = function(clientId) {
    const raw = localStorage.getItem(THEME_PREFIX + clientId);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_THEME));
    try { return JSON.parse(raw); }
    catch (e) { console.warn('[dh-admin] corrupt theme for', clientId, e); return JSON.parse(JSON.stringify(DEFAULT_THEME)); }
  };

  /* ── Async fetchers: API first, then localStorage cache, then defaults. ── */
  window.fetchContent = async function(clientId) {
    try {
      const res = await fetch('/api/content/' + encodeURIComponent(clientId), { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.content) {
          localStorage.setItem(CONTENT_PREFIX + clientId, JSON.stringify(data.content));
          return data.content;
        }
      }
    } catch (e) { /* fall through to cache */ }
    return window.getContent(clientId);
  };

  window.fetchTheme = async function(clientId) {
    try {
      const res = await fetch('/api/theme/' + encodeURIComponent(clientId), { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.theme) {
          localStorage.setItem(THEME_PREFIX + clientId, JSON.stringify(data.theme));
          return data.theme;
        }
      }
    } catch (e) { /* fall through */ }
    return window.getTheme(clientId);
  };

  /* ── Save: PUT to API, also mirror to localStorage so reloads are instant. ── */
  window.saveContent = async function(clientId, content) {
    localStorage.setItem(CONTENT_PREFIX + clientId, JSON.stringify(content));
    try {
      const res = await fetch('/api/content/' + encodeURIComponent(clientId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ content })
      });
      if (res.ok)            return { ok: true,  remote: true  };
      if (res.status === 401) return { ok: false, reason: 'unauthenticated' };
      if (res.status === 403) return { ok: false, reason: 'forbidden' };
      return { ok: true, remote: false, reason: 'server_' + res.status };
    } catch (e) {
      return { ok: true, remote: false, reason: 'network' };
    }
  };

  window.saveTheme = async function(clientId, theme) {
    localStorage.setItem(THEME_PREFIX + clientId, JSON.stringify(theme));
    try {
      const res = await fetch('/api/theme/' + encodeURIComponent(clientId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ theme })
      });
      if (res.ok)             return { ok: true,  remote: true };
      if (res.status === 401) return { ok: false, reason: 'unauthenticated' };
      if (res.status === 403) return { ok: false, reason: 'forbidden' };
      return { ok: true, remote: false, reason: 'server_' + res.status };
    } catch (e) {
      return { ok: true, remote: false, reason: 'network' };
    }
  };

  /* ── Init ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    if (!requireAuth()) return;
    populateUser();
    // Mark active sidebar link
    const path = window.location.pathname.split('/').pop();
    document.querySelectorAll('.sidebar-link').forEach(l => {
      const href = l.getAttribute('href') || '';
      if (href === path) l.classList.add('active');
    });
  }

})();
