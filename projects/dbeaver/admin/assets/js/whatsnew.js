/* =====================================================
   "What's New" widget — surfaces user-facing release notes
   inside admin & client dashboards. Reads /data/whatsnew.json.
   Internal CI/refactor changes don't go here — keep this for
   things users actually see and care about.
   ===================================================== */
(function () {
  'use strict';

  const TAG_STYLES = {
    new:      { label: 'NEW',      bg: 'linear-gradient(135deg,#22d3ee,#4a6cf7)', color: '#fff' },
    improved: { label: 'IMPROVED', bg: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff' },
    fixed:    { label: 'FIXED',    bg: 'linear-gradient(135deg,#f59e0b,#ef4444)', color: '#fff' },
    launch:   { label: 'LAUNCH',   bg: 'linear-gradient(135deg,#8b5cf6,#ec4899)', color: '#fff' }
  };

  // Each consumer page picks where to mount via data-whatsnew-mount on a host element.
  // Limit defaults to 3 entries to keep the dashboard breathable.
  async function renderWhatsNew(host, limit = 3) {
    if (!host) return;
    host.innerHTML = '<div style="font-size:.8rem; color:var(--text-dim, #94a3b8); padding:8px 0;">Loading what\'s new…</div>';
    try {
      // whatsnew.json lives at /data/whatsnew.json — adjust if pages are nested deeper.
      const baseDepth = (host.dataset.whatsnewBase || '../');
      const res = await fetch(baseDepth + 'data/whatsnew.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('http ' + res.status);
      const data = await res.json();
      const entries = (data.entries || []).slice(0, limit);
      if (entries.length === 0) {
        host.innerHTML = '<div style="font-size:.85rem; color:var(--text-dim, #94a3b8);">No recent updates.</div>';
        return;
      }
      host.innerHTML = entries.map(entryHtml).join('');
    } catch (e) {
      host.innerHTML = '<div style="font-size:.8rem; color:var(--text-dim, #94a3b8);">Couldn\'t load updates.</div>';
      console.warn('[whatsnew] load failed:', e);
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function entryHtml(e) {
    const tag = TAG_STYLES[e.tag] || TAG_STYLES.improved;
    const items = (e.items || []).map(i =>
      `<li style="font-size:.84rem; color:var(--text-mid,#94a3b8); line-height:1.55; padding:3px 0;">${escapeHtml(i)}</li>`
    ).join('');
    return `
      <div style="padding:14px 0; border-bottom:1px solid var(--border, rgba(255,255,255,.07));">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px; flex-wrap:wrap;">
          <span style="background:${tag.bg}; color:${tag.color}; font-size:.62rem; font-weight:800; letter-spacing:.1em; padding:3px 9px; border-radius:20px;">${tag.label}</span>
          <span style="font-size:.92rem; font-weight:600; color:var(--text,#e2e8f0);">${escapeHtml(e.title)}</span>
          <span style="margin-left:auto; font-size:.72rem; color:var(--text-dim,#64748b);">${escapeHtml(e.date)}</span>
        </div>
        <ul style="margin:0; padding-left:18px; list-style:disc;">${items}</ul>
      </div>`;
  }

  // Auto-mount any element with data-whatsnew-mount on DOM ready.
  function init() {
    document.querySelectorAll('[data-whatsnew-mount]').forEach(host => {
      const limit = parseInt(host.dataset.whatsnewLimit || '3', 10);
      renderWhatsNew(host, limit);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for manual remount
  window.renderWhatsNew = renderWhatsNew;
})();
