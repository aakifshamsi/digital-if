import { json } from '../../_shared/http.js';
import { readSession, destroySession, sessionCookie } from '../../_shared/auth.js';

export async function onRequestPost({ request, env }) {
  const sess = await readSession(request, env);
  if (sess && sess._token) await destroySession(env, sess._token);
  return json({ ok: true }, { headers: { 'Set-Cookie': sessionCookie('', { clear: true }) } });
}
