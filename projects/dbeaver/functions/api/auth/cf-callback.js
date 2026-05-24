// GET /api/auth/cf-callback?code=<code>&state=<state>
// Exchanges OAuth code for access+refresh token, stores in KV

import { json, err } from '../_shared/http.js';
import { readSession, writeSession } from '../_shared/auth.js';
import { getJSON, putJSON } from '../_shared/kv.js'

export async function onRequestGet({ request, env }) {
  if (!CF_OAUTH_CLIENT_ID) {
    return err(500, 'cf_oauth_not_configured', 'Cloudflare OAuth client_id not set in environment');
  }

  const url = new URL(request.url);
  const code = (url.searchParams.get('code') || '').trim();
  const state = (url.searchParams.get('state') || '').trim();

  if (!code) return err(400, 'missing_code', 'OAuth authorization code is required');
  if (!state) return err(400, 'missing_state', 'State parameter is required');

  const sess = await readSession(request, env);
  if (!sess || sess.role !== 'client' || !sess.clientId) {
    return err(401, 'unauthenticated', 'Client login required for Cloudflare OAuth');
  }

  const storedState = await getJSON(env, `cf-state:${sess.clientId}`, null);
  if (!storedState || storedState.state !== state) {
    await putJSON(env, `cf-state:${sess.clientId}`, { expired: true }, { expirationTtl: 60 });
    return err(403, 'invalid_state', 'CSRF state mismatch - possible attack');
  }

  const tokenResp = await fetch('https://cloudflare.com/api/v4/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: CF_REDIRECT_URI,
      client_id: CF_OAUTH_CLIENT_ID
    })
  });

  if (!tokenResp.ok) {
    const errBody = await tokenResp.text();
    await putJSON(env, `cf-state:${sess.clientId}`, { expired: true }, { expirationTtl: 60 });
    return err(500, 'token_exchange_failed', `Cloudflare API error: ${errBody}`);
  }

  const tokenData = await tokenResp.json();
  if (!tokenData.access_token || !tokenData.refresh_token || !tokenData.expires_in) {
    await putJSON(env, `cf-state:${sess.clientId}`, { expired: true }, { expirationTtl: 60 });
    return err(500, 'invalid_token_response', 'Cloudflare did not return valid token data');
  }

  // Store tokens securely in KV using credentials manager
  const credentials = await import('./credentials.js');
  await credentials.storeCFToken(env, sess.clientId, {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    accountId: tokenData.account_id || null,
    expiresAt: Date.now() + (tokenData.expires_in * 1000)
  });

  await putJSON(env, `cf-state:${sess.clientId}`, { expired: true }, { expirationTtl: 60 });

  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/client/dashboard.html?cf=connected',
      'Set-Cookie': `dh_session=${await writeSession(env, sess)}; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`
    }
  });
}

// Helper functions (kept for reference - may be moved to separate file)
export async function withRetry(fn, maxRetries = MAX_RETRIES) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      // Exponential backoff with jitter
      const delay = Math.pow(2, i) * 1000 + Math.random() * 500;
      console.log(`Retry ${i + 1} in ${delay.toFixed(0)}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Duplicate functions removed for brevity - original file had multiple copies of these functions