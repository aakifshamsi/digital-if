// GET /api/health — proves Pages Functions are routing + KV is bound.
// Used by ops scripts and the editor's footer status indicator.
import { json } from '../_shared/http.js';

export async function onRequestGet({ env }) {
  let kv = 'unbound';
  if (env && env.DH_KV) {
    try {
      // Cheap probe — KV.list with limit 1 doesn't cost a read against quota.
      await env.DH_KV.list({ limit: 1 });
      kv = 'ok';
    } catch (e) {
      kv = 'error';
    }
  }
  return json({
    ok: true,
    runtime: 'cloudflare-pages-functions',
    kv,
    time: new Date().toISOString()
  });
}
