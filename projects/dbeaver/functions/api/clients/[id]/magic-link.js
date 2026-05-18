import { json, err, readJSON } from '../../../_shared/http.js';
import { getJSON, putJSON } from '../../../_shared/kv.js';
import { readSession, newSessionToken } from '../../../_shared/auth.js';

const DEFAULT_TTL_DAYS = 7;
const MAX_TTL_DAYS = 30;

// POST /api/clients/:id/magic-link
// Admin-only. Mints a fresh single-use token, stored at magiclink:<token>
// with KV TTL. Each call generates a new token; old ones remain valid
// until consumed or expired.
export async function onRequestPost({ request, params, env }) {
  const id = (params.id || '').trim();
  const sess = await readSession(request, env);
  if (!sess) return err(401, 'unauthenticated', 'Login required');
  if (sess.role !== 'admin') return err(403, 'forbidden', 'Admin only');

  const existing = await getJSON(env, `client:${id}`);
  if (!existing) return err(404, 'not_found', `Client ${id} not found`);

  let body = {};
  if (request.headers.get('Content-Type')?.includes('application/json')) {
    try { body = await readJSON(request); }
    catch (resp) { return resp; }
  }

  let ttlDays = Number(body.ttlDays);
  if (!Number.isFinite(ttlDays) || ttlDays <= 0) ttlDays = DEFAULT_TTL_DAYS;
  if (ttlDays > MAX_TTL_DAYS) ttlDays = MAX_TTL_DAYS;

  const ttlSeconds = Math.floor(ttlDays * 24 * 60 * 60);
  const expiresAt = Date.now() + ttlSeconds * 1000;

  const token = newSessionToken();
  await putJSON(env, `magiclink:${token}`, { clientId: id, exp: expiresAt }, {
    expirationTtl: ttlSeconds
  });

  const origin = new URL(request.url).origin;
  const url = `${origin}/api/auth/magic?token=${encodeURIComponent(token)}`;

  return json({ url, expiresAt });
}
