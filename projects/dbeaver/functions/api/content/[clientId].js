import { json, err, readJSON } from '../../_shared/http.js';
import { getJSON, putJSON } from '../../_shared/kv.js';
import { readSession } from '../../_shared/auth.js';
import { DEFAULT_CONTENT } from '../../_shared/defaults.js';

// GET /api/content/:clientId — public, returns saved content or defaults.
export async function onRequestGet({ params, env }) {
  const id = (params.clientId || '').trim();
  if (!id) return err(400, 'missing_client', 'clientId is required');
  const saved = await getJSON(env, `content:${id}`);
  return json({ clientId: id, content: saved || DEFAULT_CONTENT, source: saved ? 'kv' : 'default' });
}

// PUT /api/content/:clientId — admin (any) or self client.
export async function onRequestPut({ request, params, env }) {
  const id = (params.clientId || '').trim();
  if (!id) return err(400, 'missing_client', 'clientId is required');

  const sess = await readSession(request, env);
  if (!sess) return err(401, 'unauthenticated', 'Login required');
  const isAdmin = sess.role === 'admin';
  const isSelf  = sess.role === 'client' && sess.clientId === id;
  if (!isAdmin && !isSelf) return err(403, 'forbidden', 'Cannot edit this client');

  let body;
  try { body = await readJSON(request); }
  catch (resp) { return resp; }

  // Accept either { content: {...} } or the raw doc directly.
  const content = body && body.content && typeof body.content === 'object' ? body.content : body;
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return err(400, 'invalid_content', 'Body must be a content object');
  }

  await putJSON(env, `content:${id}`, content);
  return json({ ok: true, clientId: id });
}
