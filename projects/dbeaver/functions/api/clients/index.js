import { json, err, readJSON } from '../../_shared/http.js';
import { getJSON, putJSON, listKeys } from '../../_shared/kv.js';
import { readSession, hashPassword } from '../../_shared/auth.js';

// Strip secrets before returning a client record to the wire.
function publicClient(c) {
  if (!c) return null;
  const { passwordHash, ...rest } = c;
  return rest;
}

// GET /api/clients — admin only
export async function onRequestGet({ request, env }) {
  const sess = await readSession(request, env);
  if (!sess) return err(401, 'unauthenticated', 'Login required');
  if (sess.role !== 'admin') return err(403, 'forbidden', 'Admin only');

  const ids = await getJSON(env, 'clients:index', []);
  const clients = [];
  for (const id of ids) {
    const c = await getJSON(env, `client:${id}`);
    if (c) clients.push(publicClient(c));
  }
  return json({ clients });
}

// POST /api/clients — admin only, creates a client + content + theme
export async function onRequestPost({ request, env }) {
  const sess = await readSession(request, env);
  if (!sess) return err(401, 'unauthenticated', 'Login required');
  if (sess.role !== 'admin') return err(403, 'forbidden', 'Admin only');

  let body;
  try { body = await readJSON(request); }
  catch (resp) { return resp; }

  const id     = (body.id || '').trim();
  const name   = (body.name || '').trim();
  const email  = (body.email || body.loginEmail || '').trim().toLowerCase();
  const password = (body.password || '').toString();
  if (!id || !name || !email || !password) {
    return err(400, 'missing_fields', 'id, name, email, password are required');
  }

  // Reject duplicate id or email
  const existing = await getJSON(env, `client:${id}`);
  if (existing) return err(409, 'conflict', `Client ${id} already exists`);
  const emailTaken = await env.DH_KV.get(`client-email:${email}`);
  if (emailTaken) return err(409, 'conflict', `Email ${email} already in use`);

  const record = {
    id, name,
    contact: body.contact || name,
    email:   body.publicEmail || email,
    phone:   body.phone || '',
    domain:  body.domain || '',
    template: body.template || 'spa-massage',
    status:  body.status || 'active',
    plan:    body.plan || 'Starter',
    created: new Date().toISOString().slice(0, 10),
    loginEmail: email,
    passwordHash: await hashPassword(password)
  };

  await putJSON(env, `client:${id}`, record);
  await env.DH_KV.put(`client-email:${email}`, id);

  // Append to clients:index
  const index = await getJSON(env, 'clients:index', []);
  if (!index.includes(id)) index.push(id);
  await putJSON(env, 'clients:index', index);

  return json({ client: publicClient(record) }, { status: 201 });
}
