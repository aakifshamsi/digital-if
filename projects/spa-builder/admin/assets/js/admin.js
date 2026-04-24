/* =====================================================
   DigitalHands.in — Admin Panel JS
   ===================================================== */

(function() {
  'use strict';

  /* ── Auth guard ── */
  function requireAuth() {
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
  window.doLogout = function() {
    sessionStorage.removeItem('dh_admin_auth');
    sessionStorage.removeItem('dh_admin_user');
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
