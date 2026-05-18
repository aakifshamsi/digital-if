import { json, err, readJSON } from '../../_shared/http.js';
import { getJSON, putJSON } from '../../_shared/kv.js';
import { readSession } from '../../_shared/auth.js';

function publicClient(c) {
  if (!c) return null;
  const { passwordHash, ...rest } = c;
  return rest;
}

export async function onRequestGet({ request, params, env }) {
  const id = (params.id || '').trim();
  const sess = await readSession(request, env);
  if (!sess) return err(401, 'unauthenticated', 'Login required');
  const isAdmin = sess.role === 'admin';
  const isSelf  = sess.role === 'client' && sess.clientId === id;
  if (!isAdmin && !isSelf) return err(403, 'forbidden', 'Cannot view this client');

  const c = await getJSON(env, `client:${id}`);
  if (!c) return err(404, 'not_found', `Client ${id} not found`);
  return json({ client: publicClient(c) });
}

export async function onRequestPut({ request, params, env }) {
  const id = (params.id || '').trim();
  const sess = await readSession(request, env);
  if (!sess) return err(401, 'unauthenticated', 'Login required');

  const isAdmin = sess.role === 'admin';
  const isSelf  = sess.role === 'client' && sess.clientId === id;
  if (!isAdmin && !isSelf) return err(403, 'forbidden', 'Cannot edit this client');

  const existing = await getJSON(env, `client:${id}`);
  if (!existing) return err(404, 'not_found', `Client ${id} not found`);

  let body;
  try { body = await readJSON(request); }
  catch (resp) { return resp; }

  // Whitelist mutable fields — auth fields (loginEmail, passwordHash) require
  // a separate flow so they can't be silently overwritten on a metadata save.
  // Admins get the full whitelist; clients editing their own record are
  // restricted to contact fields (email + phone) so they can't escalate
  // plan/domain/name/etc. via DevTools.
  const ADMIN_ALLOWED  = ['name','contact','email','phone','domain','template','status','plan'];
  const CLIENT_ALLOWED = ['email','phone'];
  const ALLOWED = isAdmin ? ADMIN_ALLOWED : CLIENT_ALLOWED;
  const next = { ...existing };
  for (const k of ALLOWED) if (k in body) next[k] = body[k];

  await putJSON(env, `client:${id}`, next);
  return json({ client: publicClient(next) });
}
