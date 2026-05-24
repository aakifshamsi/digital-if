// Credential Manager for Cloudflare OAuth
// Handles secure token storage with KV integration

export async function getCFToken(env, clientId) {
  const { getJSON } = await import('./kv.js');
  return await getJSON(env, `cf-token:${clientId}`, null);
}

export async function storeCFToken(env, clientId, tokenData) {
  // For now, store plaintext in KV (assume CF Workers has HTTPS in flight)
  // TODO: Add encryption layer once crypto key is managed
  
  const { putJSON } = await import('./kv.js');

  const tokenObj = {
    accessToken: tokenData.accessToken,
    refreshToken: tokenData.refreshToken,
    accountId: tokenData.accountId || null,
    expiresAt: tokenData.expiresAt,
    storedAt: Date.now()
  };

  return await putJSON(env, `cf-token:${clientId}`, tokenObj, {
    expirationTtl: 604800  // 7 days
  });
}
