/* =====================================================
   Digital Hands — public site interactions
   - Mobile burger menu (toggle + close on link / outside / Esc)
   - Scroll-triggered fade-up animations
   - Smooth in-page anchor scrolling with sticky-nav offset
   - Year auto-fill in footer
   ===================================================== */
(function () {
  'use strict';

  /* ─── Mobile nav ───────────────────────────────────── */
  const burger = document.getElementById('burger');
  const nav    = document.getElementById('main-nav');
  const links  = nav && nav.querySelector('.nav-links');

  function setMenuOpen(open) {
    if (!nav || !links) return;
    nav.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
    // Animate hamburger → X
    const spans = burger.querySelectorAll('span');
    if (spans.length >= 3) {
      spans[0].style.transform = open ? 'translateY(7px) rotate(45deg)'  : '';
      spans[1].style.opacity   = open ? '0' : '';
      spans[2].style.transform = open ? 'translateY(-7px) rotate(-45deg)' : '';
    }
  }

  if (burger && nav) {
    burger.addEventListener('click', () =>
      setMenuOpen(!nav.classList.contains('menu-open')));

    // Close menu when an in-menu link is clicked
    nav.querySelectorAll('.nav-links a').forEach(a =>
      a.addEventListener('click', () => setMenuOpen(false)));

    // Close on Esc and on outside tap
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') setMenuOpen(false);
    });
    document.addEventListener('click', e => {
      if (!nav.classList.contains('menu-open')) return;
      if (!nav.contains(e.target)) setMenuOpen(false);
    });
  }

  /* ─── Sticky nav background on scroll ──────────────── */
  if (nav) {
    const updateScrolled = () =>
      nav.classList.toggle('scrolled', window.scrollY > 12);
    updateScrolled();
    window.addEventListener('scroll', updateScrolled, { passive: true });
  }

  /* ─── Fade-up observer ─────────────────────────────── */
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
  } else {
    // Old browsers: just show everything
    document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
  }

  /* ─── Smooth anchor scroll with nav-height offset ──── */
  const navHeight = () => (nav ? nav.offsetHeight : 0);
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight() - 8;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ─── Footer year ──────────────────────────────────── */
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
})();
