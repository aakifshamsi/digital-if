import { json, err, readJSON } from '../../_shared/http.js';
import { verifyPassword, writeSession, sessionCookie } from '../../_shared/auth.js';
import { getJSON, requireKV } from '../../_shared/kv.js';

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await readJSON(request); }
  catch (resp) { return resp; }

  const email = (body.email || '').toString().trim().toLowerCase();
  const password = (body.password || '').toString();
  const role = body.role === 'admin' ? 'admin' : 'client';

  if (!email || !password) return err(400, 'missing_fields', 'email and password are required');

  // Admins are keyed by email; clients are looked up via email index → clientId.
  let user = null;
  let clientId = null;

  if (role === 'admin') {
    user = await getJSON(env, `admin:${email}`);
  } else {
    const kv = requireKV(env);
    clientId = await kv.get(`client-email:${email}`);
    if (clientId) user = await getJSON(env, `client:${clientId}`);
  }

  if (!user || !user.passwordHash) {
    return err(401, 'invalid_credentials', 'Email or password is incorrect');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return err(401, 'invalid_credentials', 'Email or password is incorrect');

  const session = {
    sub:  email,
    role,
    name: user.name || email,
    ...(clientId ? { clientId } : {})
  };
  const token = await writeSession(env, session);

  return json(
    { user: session },
    { headers: { 'Set-Cookie': sessionCookie(token) } }
  );
}
