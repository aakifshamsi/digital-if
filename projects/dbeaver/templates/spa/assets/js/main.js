/* =====================================================
   dh-beaver demo — main.js
   Reads per-client content + theme from localStorage,
   listens for live-preview postMessage from the editor.
   ===================================================== */

(function () {
  'use strict';

  /* ── Per-client storage keys ── */
  const clientId = new URLSearchParams(location.search).get('client') || 'cli_001';
  const CONTENT_KEY = 'dh_content_' + clientId;
  const THEME_KEY   = 'dh_theme_'   + clientId;

  /* ── Apply theme (CSS custom properties) ── */
  function applyTheme(theme) {
    if (!theme) return;
    const root = document.documentElement.style;
    const colors = theme.colors || {};
    for (const [k, v] of Object.entries(colors)) {
      if (v) root.setProperty('--' + k, v);
    }
    if (theme.fonts) {
      if (theme.fonts.display) root.setProperty('--font-display', theme.fonts.display);
      if (theme.fonts.body)    root.setProperty('--font-body',    theme.fonts.body);
    }
  }

  /* ── Hydrate content from saved document ── */
  function getPath(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }

  // Derive a usable href from a free-form value:
  //   foo@bar.com           → mailto:foo@bar.com
  //   (604) 200-1234        → tel:+16042001234 (strip formatting)
  //   anything else         → unchanged
  function deriveHref(raw) {
    if (raw == null) return raw;
    const s = String(raw).trim();
    if (!s) return s;
    if (s.includes('@')) return 'mailto:' + s;
    // Phone: at least 7 digits after stripping formatting
    const digits = s.replace(/[^0-9+]/g, '');
    if (/^\+?\d{7,}$/.test(digits)) return 'tel:' + digits;
    return s;
  }

  function applyValueToAnchor(el, val) {
    // Anchor: keep visible text, derive href from value when href looks like a phone/mailto.
    const currentHref = el.getAttribute('href') || '';
    if (currentHref.startsWith('mailto:') || currentHref.startsWith('tel:') ||
        (typeof val === 'string' && (val.includes('@') || /\d{7,}/.test(val.replace(/\D/g,''))))) {
      el.setAttribute('href', deriveHref(val));
    }
    el.textContent = val;
  }

  function hydrateContent(content) {
    if (!content) return;

    // 1. Single-value text bindings via data-edit="path.to.value"
    document.querySelectorAll('[data-edit]').forEach(el => {
      const val = getPath(content, el.dataset.edit);
      if (val == null) return;
      if (el.tagName === 'IMG') el.setAttribute('src', val);
      else if (el.tagName === 'A' && el.dataset.editAttr === 'href') el.setAttribute('href', val);
      else if (el.tagName === 'A') applyValueToAnchor(el, val);
      else el.textContent = val;
    });

    // 2. Image bindings via data-edit-src="path.to.image"
    document.querySelectorAll('[data-edit-src]').forEach(el => {
      const val = getPath(content, el.dataset.editSrc);
      if (val) el.setAttribute('src', val);
    });

    // 3. Link bindings via data-edit-href="path.to.link"
    document.querySelectorAll('[data-edit-href]').forEach(el => {
      const val = getPath(content, el.dataset.editHref);
      if (val) el.setAttribute('href', val);
    });

    // 4. Repeaters via data-repeat="services|pricingPlans|team|heroSlides"
    document.querySelectorAll('[data-repeat]').forEach(host => {
      const key = host.dataset.repeat;
      const items = content[key];
      if (!Array.isArray(items)) return;
      const tpl = host.querySelector('template');
      if (!tpl) return;
      // Remove existing rendered nodes (keep template + any static fallback)
      host.querySelectorAll('[data-rendered]').forEach(n => n.remove());
      items.forEach(item => {
        const node = tpl.content.firstElementChild.cloneNode(true);
        node.setAttribute('data-rendered', '1');
        renderItem(node, item);
        host.appendChild(node);
        observeFadeUp(node);
      });
    });
  }

  function renderItem(node, item) {
    node.querySelectorAll('[data-field]').forEach(el => {
      const key = el.dataset.field;
      // Resolve nested paths so data-field="social.facebook" works
      const val = getPath(item, key);
      if (val == null) return;
      if (el.tagName === 'IMG') el.setAttribute('src', val);
      else if (el.dataset.fieldType === 'href') el.setAttribute('href', val);
      else if (el.dataset.fieldType === 'features' && Array.isArray(val)) {
        el.innerHTML = '';
        val.forEach(f => {
          const li = document.createElement('li');
          li.textContent = f;
          el.appendChild(li);
        });
      } else if (el.tagName === 'A') {
        applyValueToAnchor(el, val);
      } else {
        el.textContent = val;
      }
    });
    // Companion href binding: data-field-href="path.to.link" sets the href
    // alongside whatever data-field set as text/src.
    node.querySelectorAll('[data-field-href]').forEach(el => {
      const v = getPath(item, el.dataset.fieldHref);
      if (v) el.setAttribute('href', v);
    });
    if (item.isActive && node.classList.contains('price-card')) node.classList.add('active');
  }

  /* ── Intersection Observer: fade-up (shared, reusable) ── */
  const fadeObserver = ('IntersectionObserver' in window)
    ? new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('visible'); fadeObserver.unobserve(e.target); }
        });
      }, { threshold: 0.12 })
    : null;
  function observeFadeUp(root) {
    if (!fadeObserver) return;
    const target = root || document;
    if (target.classList && target.classList.contains('fade-up')) fadeObserver.observe(target);
    if (target.querySelectorAll) {
      target.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));
    }
  }

  /* ── Load saved content + theme: localStorage cache → render → API refresh ── */
  // Sync path: paint from cache (or defaults) immediately, no FOUC.
  try {
    const cachedTheme   = JSON.parse(localStorage.getItem(THEME_KEY)   || 'null');
    const cachedContent = JSON.parse(localStorage.getItem(CONTENT_KEY) || 'null');
    if (cachedTheme)   applyTheme(cachedTheme);
    if (cachedContent) hydrateContent(cachedContent);
  } catch (err) {
    console.warn('[dh-beaver] failed to load cached state:', err);
  }
  observeFadeUp(document);

  // Async path: pull fresh content from /api — if KV is bound this swaps in
  // real data without a reload. Failure is silent (offline, no Functions yet).
  function refreshFromApi() {
    fetch('/api/content/' + encodeURIComponent(clientId), { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.content) {
          localStorage.setItem(CONTENT_KEY, JSON.stringify(data.content));
          hydrateContent(data.content);
        }
      })
      .catch(() => { /* ignore — cache is fine */ });

    fetch('/api/theme/' + encodeURIComponent(clientId), { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.theme) {
          localStorage.setItem(THEME_KEY, JSON.stringify(data.theme));
          applyTheme(data.theme);
        }
      })
      .catch(() => { /* ignore */ });
  }
  refreshFromApi();

  /* ── Live preview from editor (postMessage) ── */
  window.addEventListener('message', (e) => {
    const data = e.data || {};
    if (data.type === 'theme-update')   applyTheme(data.theme);
    if (data.type === 'content-update') hydrateContent(data.content);
  });

  /* ── Sticky Nav ── */
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 40);
    });
  }

  /* ── Mobile Nav ── */
  const burger    = document.querySelector('.nav-burger');
  const mobileNav = document.querySelector('.nav-mobile');
  function setMenuOpen(open) {
    if (!burger || !mobileNav) return;
    mobileNav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    const spans = burger.querySelectorAll('span');
    if (spans.length >= 3) {
      spans[0].style.transform = open ? 'rotate(45deg) translate(5px,5px)' : '';
      spans[1].style.opacity   = open ? '0' : '';
      spans[2].style.transform = open ? 'rotate(-45deg) translate(5px,-5px)' : '';
    }
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      setMenuOpen(!mobileNav.classList.contains('open'));
    });
    mobileNav.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => setMenuOpen(false))
    );
  }

  /* ── Active nav link ── */
  const navLinks = document.querySelectorAll('.nav-links a, .nav-mobile a');
  const current  = window.location.pathname.split('/').pop() || 'index.html';
  navLinks.forEach(a => {
    const href = a.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  /* ── Booking + Contact form ── */
  document.querySelectorAll('form[data-demo-submit]').forEach(form => {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = form.querySelector('[type=submit]');
      const orig = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled = true;
      setTimeout(() => {
        showToast(form.dataset.demoSubmit || 'Thank you! Your request has been received.');
        form.reset();
        btn.textContent = orig;
        btn.disabled = false;
      }, 1100);
    });
  });

  /* ── Newsletter form ── */
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      showToast('Subscribed. Look out for our updates.');
      form.reset();
    });
  });

  /* ── Video lightbox ── */
  const videoDialog = document.querySelector('#video-dialog');
  const videoFrame  = videoDialog && videoDialog.querySelector('iframe');
  document.querySelectorAll('[data-video-open]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      if (!videoDialog || typeof videoDialog.showModal !== 'function') return;
      if (videoFrame && videoFrame.dataset.src) videoFrame.src = videoFrame.dataset.src;
      videoDialog.showModal();
    });
  });
  if (videoDialog) {
    const closeVideo = () => {
      videoDialog.close();
      if (videoFrame) videoFrame.removeAttribute('src'); // stop video playback
    };
    videoDialog.addEventListener('click', (e) => { if (e.target === videoDialog) closeVideo(); });
    videoDialog.querySelectorAll('[data-video-close]').forEach(btn =>
      btn.addEventListener('click', closeVideo)
    );
  }

  /* ── Toast ── */
  function showToast(msg) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      Object.assign(t.style, {
        position: 'fixed', bottom: '28px', left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--gold)',
        color: 'var(--black)',
        padding: '14px 26px',
        fontFamily: 'var(--font-body)',
        fontSize: '.82rem',
        fontWeight: '600',
        letterSpacing: '.12em',
        textTransform: 'uppercase',
        zIndex: '9999',
        boxShadow: '0 12px 40px rgba(0,0,0,.6)',
        maxWidth: '90vw',
        textAlign: 'center',
        transition: 'opacity .4s, transform .4s'
      });
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    setTimeout(() => { t.style.opacity = '0'; }, 4200);
  }

  /* ── Dynamic year ── */
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  /* ── Counter animation ── */
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1600;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current) + (el.dataset.suffix || '');
      if (current >= target) clearInterval(timer);
    }, 16);
  }
  const counters = document.querySelectorAll('[data-target]');
  if (counters.length) {
    const co = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { animateCounter(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => co.observe(c));
  }

})();
