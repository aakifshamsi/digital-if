import { getJSON, requireKV } from '../../_shared/kv.js';
import { writeSession, sessionCookie } from '../../_shared/auth.js';

// GET /api/auth/magic?token=<token>
// Public. Consumes a single-use magic-link token, writes a client session
// cookie, and redirects to the client dashboard. On any failure
// (missing/invalid/expired/client-deleted) redirects to the login page
// with ?error=expired_link.
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const token = (url.searchParams.get('token') || '').trim();

  const fail = () => new Response(null, {
    status: 302,
    headers: { Location: '/client/login.html?error=expired_link' }
  });

  if (!token) return fail();

  const kv = requireKV(env);
  const link = await getJSON(env, `magiclink:${token}`);
  if (!link || !link.clientId) return fail();
  if (link.exp && Date.now() > link.exp) {
    await kv.delete(`magiclink:${token}`);
    return fail();
  }

  const client = await getJSON(env, `client:${link.clientId}`);
  if (!client) {
    await kv.delete(`magiclink:${token}`);
    return fail();
  }

  const loginEmail = client.loginEmail || client.email || link.clientId;
  const sessionToken = await writeSession(env, {
    sub: loginEmail,
    role: 'client',
    clientId: link.clientId,
    name: client.name || loginEmail
  });

  // Single-use: burn the token after a successful session is minted.
  await kv.delete(`magiclink:${token}`);

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/client/dashboard.html',
      'Set-Cookie': sessionCookie(sessionToken)
    }
  });
}
