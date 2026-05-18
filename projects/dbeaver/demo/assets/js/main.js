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

  function hydrateContent(content) {
    if (!content) return;

    // 1. Single-value text bindings via data-edit="path.to.value"
    document.querySelectorAll('[data-edit]').forEach(el => {
      const val = getPath(content, el.dataset.edit);
      if (val == null) return;
      if (el.tagName === 'IMG') el.setAttribute('src', val);
      else if (el.tagName === 'A' && el.dataset.editAttr === 'href') el.setAttribute('href', val);
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
      // Remove existing rendered nodes (keep template)
      host.querySelectorAll('[data-rendered]').forEach(n => n.remove());
      items.forEach(item => {
        const node = tpl.content.firstElementChild.cloneNode(true);
        node.setAttribute('data-rendered', '1');
        renderItem(node, item);
        host.appendChild(node);
      });
    });
  }

  function renderItem(node, item) {
    node.querySelectorAll('[data-field]').forEach(el => {
      const key = el.dataset.field;
      const val = item[key];
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
      } else {
        el.textContent = val;
      }
    });
    // Toggle "active" class on price-card when item.isActive
    if (item.isActive && node.classList.contains('price-card')) node.classList.add('active');
  }

  /* ── Load saved content + theme on init ── */
  try {
    const theme   = JSON.parse(localStorage.getItem(THEME_KEY)   || 'null');
    const content = JSON.parse(localStorage.getItem(CONTENT_KEY) || 'null');
    applyTheme(theme);
    hydrateContent(content);
  } catch (err) {
    console.warn('[dh-beaver] failed to load saved state:', err);
  }

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
  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      const spans = burger.querySelectorAll('span');
      const open = mobileNav.classList.contains('open');
      spans[0].style.transform = open ? 'rotate(45deg) translate(5px,5px)' : '';
      spans[1].style.opacity   = open ? '0' : '';
      spans[2].style.transform = open ? 'rotate(-45deg) translate(5px,-5px)' : '';
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileNav.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      })
    );
  }

  /* ── Intersection Observer: fade-up ── */
  const fadeEls = document.querySelectorAll('.fade-up');
  if (fadeEls.length) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    fadeEls.forEach(el => obs.observe(el));
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
  document.querySelectorAll('[data-video-open]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const dialog = document.querySelector('#video-dialog');
      if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
    });
  });
  const videoDialog = document.querySelector('#video-dialog');
  if (videoDialog) {
    videoDialog.addEventListener('click', (e) => {
      if (e.target === videoDialog) videoDialog.close();
    });
    videoDialog.querySelectorAll('[data-video-close]').forEach(btn =>
      btn.addEventListener('click', () => videoDialog.close())
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
