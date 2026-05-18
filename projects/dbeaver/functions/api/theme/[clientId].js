import { json, err, readJSON } from '../../_shared/http.js';
import { getJSON, putJSON } from '../../_shared/kv.js';
import { readSession } from '../../_shared/auth.js';
import { DEFAULT_THEME } from '../../_shared/defaults.js';

// GET /api/theme/:clientId — public.
export async function onRequestGet({ params, env }) {
  const id = (params.clientId || '').trim();
  if (!id) return err(400, 'missing_client', 'clientId is required');
  const saved = await getJSON(env, `theme:${id}`);
  return json({ clientId: id, theme: saved || DEFAULT_THEME, source: saved ? 'kv' : 'default' });
}

// PUT /api/theme/:clientId — admin only (clients keep their assigned design system).
export async function onRequestPut({ request, params, env }) {
  const id = (params.clientId || '').trim();
  if (!id) return err(400, 'missing_client', 'clientId is required');

  const sess = await readSession(request, env);
  if (!sess) return err(401, 'unauthenticated', 'Login required');
  if (sess.role !== 'admin') return err(403, 'forbidden', 'Only admins can change themes');

  let body;
  try { body = await readJSON(request); }
  catch (resp) { return resp; }
  const theme = body && body.theme && typeof body.theme === 'object' ? body.theme : body;
  if (!theme || typeof theme !== 'object' || Array.isArray(theme)) {
    return err(400, 'invalid_theme', 'Body must be a theme object');
  }

  await putJSON(env, `theme:${id}`, theme);
  return json({ ok: true, clientId: id });
}
