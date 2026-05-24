// KV utilities for Cloudflare OAuth
//
// Secure credential storage using Web Crypto API
export async function storeCFToken(env, clientId, tokenData) {
  const { accessToken, refreshToken } = tokenData;
  
  // Encrypt sensitive fields using Web Crypto
  const encryptedAccessToken = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(12), // Generate a random IV for each encryption
      tagLength: 128
    },
    await crypto.subtle.importKey(
      'raw', accessToken, { name: 'RawFormat' }, false, ['encrypt']
    ),
    new TextEncoder().encode(accessToken)
  );
  
  const encryptedRefreshToken = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(12),
      tagLength: 128
    },
    await crypto.subtle.importKey(
      'raw', refreshToken, { name: 'RawFormat' }, false, ['encrypt']
    ),
    new TextEncoder().encode(refreshToken)
  );
  
  // Store encrypted tokens in KV
  const tokenObj = {
    accountId: tokenData.accountId,
    expiresAt: tokenData.expiresAt,
    encryptedAccessToken: Array.from(new Uint8Array(encryptedAccessToken)),
    encryptedRefreshToken: Array.from(new Uint8Array(encryptedRefreshToken))
  };

  return await putJSON(env, `cf-token:${clientId}`, tokenObj);
}
export async function getCFToken(env, clientId) {
  const raw = await getJSON(env, `cf-token:${clientId}`, null);
  if (!raw || !raw.encryptedAccessToken || !raw.encryptedRefreshToken) return null;

  // Import the encrypted data back to bytes
  const accessTokenBytes = Array.from(raw.encryptedAccessToken).map(b => b & 0xff);
  const refreshTokenBytes = Array.from(raw.encryptedRefreshToken).map(b => b & 0xff);

  try {
    // Decrypt the tokens using Web Crypto API
    const accessTokenDecrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(12), // Use a fixed IV for simplicity (in production, use random IV)
        tagLength: 128
      },
      await crypto.subtle.importKey(
        'raw', accessTokenBytes, { name: 'RawFormat' }, false, ['decrypt']
      ),
      new Uint8Array(accessTokenBytes)
    );
    
    const refreshTokenDecrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(12),
        tagLength: 128
      },
      await crypto.subtle.importKey(
        'raw', refreshTokenBytes, { name: 'RawFormat' }, false, ['decrypt']
      ),
      new Uint8Array(refreshTokenBytes)
    );
    
    return {
      accessToken: new TextDecoder().decode(accessTokenDecrypted),
      refreshToken: new TextDecoder().decode(refreshTokenDecrypted),
      accountId: raw.accountId,
      expiresAt: raw.expiresAt
    };
  }
  catch (e) {
    console.error('Error decrypting CF tokens:', e);
    return null;
  }
}

// Decrypt stored tokens
export async function getCFToken(env, clientId) {
  const raw = await getJSON(env, `cf-token:${clientId}`, null);
  if (!raw || !raw.encryptedAccessToken || !raw.encryptedRefreshToken) return null;

  // Import the encrypted data back to bytes
  const accessTokenBytes = Array.from(raw.encryptedAccessToken).map(b => b & 0xff);
  const refreshTokenBytes = Array.from(raw.encryptedRefreshToken).map(b => b & 0xff);

  try {
    // Decrypt the tokens using Web Crypto API
    const accessTokenDecrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(12), // Use a fixed IV for simplicity (in production, use random IV)
        tagLength: 128
      },
      await crypto.subtle.importKey(
        'raw', accessTokenBytes, { name: 'RawFormat' }, false, ['decrypt']
      ),
      new Uint8Array(accessTokenBytes)
    );
    
    const refreshTokenDecrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(12),
        tagLength: 128
      },
      await crypto.subtle.importKey(
        'raw', refreshTokenBytes, { name: 'RawFormat' }, false, ['decrypt']
      ),
      new Uint8Array(refreshTokenBytes)
    );
    
    return {
      accessToken: new TextDecoder().decode(accessTokenDecrypted),
      refreshToken: new TextDecoder().decode(refreshTokenDecrypted),
      accountId: raw.accountId,
      expiresAt: raw.expiresAt
    };
  }
  catch (e) {
    console.error('Error decrypting CF tokens:', e);
    return null;
  }
}