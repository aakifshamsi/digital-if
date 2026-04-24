/* =====================================================
   SERENITY SPA — Main JavaScript
   ===================================================== */

(function () {
  'use strict';

  /* ── Sticky Nav ── */
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 40);
    });
  }

  /* ── Mobile Nav ── */
  const burger  = document.querySelector('.nav-burger');
  const mobileNav = document.querySelector('.nav-mobile');
  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      const spans = burger.querySelectorAll('span');
      mobileNav.classList.contains('open')
        ? (spans[0].style.transform = 'rotate(45deg) translate(5px,5px)',
           spans[1].style.opacity   = '0',
           spans[2].style.transform = 'rotate(-45deg) translate(5px,-5px)')
        : (spans[0].style.transform = '',
           spans[1].style.opacity   = '',
           spans[2].style.transform = '');
    });
    mobileNav.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => mobileNav.classList.remove('open'))
    );
  }

  /* ── Intersection Observer: fade-up ── */
  const fadeEls = document.querySelectorAll('.fade-up');
  if (fadeEls.length) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    fadeEls.forEach(el => obs.observe(el));
  }

  /* ── Active nav link ── */
  const navLinks = document.querySelectorAll('.nav-links a, .nav-mobile a');
  const current  = window.location.pathname.split('/').pop() || 'index.html';
  navLinks.forEach(a => {
    const href = a.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) {
      a.style.color = 'var(--gold)';
    }
  });

  /* ── Booking form ── */
  const bookForm = document.getElementById('booking-form');
  if (bookForm) {
    bookForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = bookForm.querySelector('[type=submit]');
      btn.textContent = 'Sending…';
      btn.disabled = true;
      setTimeout(() => {
        showToast('🌿 Thank you! Your appointment request has been received. We\'ll confirm within 2 hours.');
        bookForm.reset();
        btn.textContent = 'Book Appointment';
        btn.disabled = false;
      }, 1200);
    });
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
        background: 'var(--green-deep)',
        color: '#fff', padding: '16px 28px',
        borderRadius: '8px',
        fontFamily: 'Helvetica Neue, sans-serif',
        fontSize: '.9rem', zIndex: '9999',
        boxShadow: '0 8px 32px rgba(0,0,0,.25)',
        maxWidth: '90vw', textAlign: 'center',
        transition: 'opacity .4s'
      });
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    setTimeout(() => { t.style.opacity = '0'; }, 4500);
  }

  /* ── Testimonial auto-scroll (mobile) ── */
  const slider = document.querySelector('.testimonials-slider');
  if (slider) {
    let idx = 0;
    const cards = slider.querySelectorAll('.testimonial-card');
    setInterval(() => {
      idx = (idx + 1) % cards.length;
      slider.scrollTo({ left: cards[idx].offsetLeft - 20, behavior: 'smooth' });
    }, 4000);
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
      entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.5 });
    counters.forEach(c => co.observe(c));
  }

})();
