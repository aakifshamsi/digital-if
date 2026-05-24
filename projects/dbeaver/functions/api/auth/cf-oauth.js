// GET /api/auth/cf-oauth
// Redirects to Cloudflare OAuth2 authorization page
// State parameter used for CSRF protection

export async function onRequestGet({ request, env }) {
  if (!CF_OAUTH_CLIENT_ID) {
    return err(500, 'cf_oauth_not_configured', 'Cloudflare OAuth client_id not set in environment');
  }

  const sess = await readSession(request, env);
  if (!sess || sess.role !== 'client' || !sess.clientId) {
    return err(401, 'unauthenticated', 'Client login required for Cloudflare OAuth');
  }

  const state = generateCsrfState();

  // Store the state in KV using credentials manager
  import('./credentials.js').then(credentials => 
    credentials.storeCFToken(env, sess.clientId, { state }));

  const authUrl = `https://dash.cloudflare.com/oauth2/auth?client_id=${encodeURIComponent(CF_OAUTH_CLIENT_ID)}&redirect_uri=${encodeURIComponent(CF_REDIRECT_URI)}&scope=${encodeURIComponent(CF_SCOPES.join(' '))}&state=${encodeURIComponent(state)}`;

  return new Response(null, {
    status: 302,
    headers: { Location: authUrl }
  });
}
