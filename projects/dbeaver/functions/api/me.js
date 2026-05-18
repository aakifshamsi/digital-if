import { json, err } from '../_shared/http.js';
import { readSession } from '../_shared/auth.js';

export async function onRequestGet({ request, env }) {
  const sess = await readSession(request, env);
  if (!sess) return err(401, 'unauthenticated', 'No active session');
  // Don't leak the token back to the client.
  const { _token, ...safe } = sess;
  return json({ user: safe });
}
