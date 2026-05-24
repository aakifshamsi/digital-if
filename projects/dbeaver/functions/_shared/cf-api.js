// Cloudflare API wrapper with OAuth token management
// Features:
// - Automatic token refresh before expiration
// - Retry logic for failed requests
// - Secure credential storage via credentials.js
// - Comprehensive error handling

// Configuration constants
export const TOKEN_TTL_SECONDS = 3600; // Token validity period in seconds
export const REFRESH_THRESHOLD_SECONDS = 600; // Refresh threshold before expiration
export const MAX_RETRIES = 3; // Maximum retry attempts for failed requests
export let tokenRefreshCount = 0;

// Initialize retry counter
export async function resetTokenRetryCounter() {
  tokenRefreshCount = 0;
}

// Enhanced retry mechanism with exponential backoff and jitter
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

// Token management functions
export async function readCFToken(env, clientId) {
  try {
    const credentials = await import('./credentials.js');
    return await credentials.getCFToken(env, clientId);
  } catch (e) {
    console.error('Error reading Cloudflare token:', e);
    return null;
  }
}
export async function writeCFToken(env, clientId, tokenData) {
  try {
    const credentials = await import('./credentials.js');
    return await credentials.storeCFToken(env, clientId, tokenData);
  } catch (e) {
    console.error('Error storing Cloudflare token:', e);
    return false;
  }
}
export async function getCFAccountInfo(env, clientId) {
  try {
    const token = await readCFToken(env, clientId);
    if (!token || !token.accountId) return null;

    // Get account info from Cloudflare API with retry logic
    const resp = await withRetry(async () => {
      return fetch(`https://api.cloudflare.com/client/v4/zones`, {
        headers: { 'Authorization': `Bearer ${token.accessToken}` }
      });
    })

    if (!resp.ok) throw new Error('Failed to get account info');
    const data = await resp.json();
    return data.result[0]?.id; // Return zone ID as account identifier
  } catch (e) {
    console.error('Error getting Cloudflare account info:', e);
    throw new Error(`Account info error: ${e.message}`);
  }
}

// API request wrapper with automatic token refresh
export async function cfApiFetch(env, clientId, path, options = {}) {
  try {
    const token = await readCFToken(env, clientId);
    if (!token) throw new Error('No valid Cloudflare OAuth token found');

    // Check if token needs refresh
    const now = Date.now();
    if (now > token.expiresAt - REFRESH_THRESHOLD_SECONDS * 1000) {
      await refreshCFToken(env, clientId);
      token = await readCFToken(env, clientId);
      if (!token) throw new Error('Failed to refresh Cloudflare OAuth token');
    }

    // Make the API request with current token
    const headers = {
      'Authorization': `Bearer ${token.accessToken}`,
      ...options.headers
    };

    return await withRetry(async () => {
      const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
        method: options.method || 'GET',
        headers: headers,
        body: options.body ? JSON.stringify(options.body) : null
      });

      // Enhanced error handling for API responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Cloudflare API error ${response.status}: ${JSON.stringify(errorData)}`);
      }
      return response;
    })
  } catch (e) {
    console.error('Error making Cloudflare API request:', e);
    // Re-throw with more context
    throw new Error(`Cloudflare API error: ${e.message}`);
  }
}
export async function refreshCFToken(env, clientId) {
  try {
    tokenRefreshCount++;

    const token = await readCFToken(env, clientId);
    if (!token || !token.refreshToken) return false;

    // Exchange refresh token for new access token with retry logic
    const resp = await withRetry(async () => {
      return fetch('https://cloudflare.com/api/v4/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken
        })
      });
    })

    if (!resp.ok) return false;

    const data = await resp.json();
    if (!data.access_token || !data.expires_in) {
      throw new Error('Invalid token response from Cloudflare');
    }

    // Update the token in KV using credentials manager
    const credentials = await import('./credentials.js');
    return await credentials.storeCFToken(env, clientId, {
      accessToken: data.access_token,
      refreshToken: token.refreshToken,  // Keep same refresh token
      accountId: token.accountId || null,
      expiresAt: Date.now() + (data.expires_in * 1000)
    });
  } catch (e) {
    console.error('Error refreshing Cloudflare token:', e);
    throw new Error(`Token refresh failed: ${e.message}`);
  }
}
export async function getCFZoneInfo(env, clientId, zoneName) {
  try {
    const accountId = await getCFAccountInfo(env, clientId);
    if (!accountId) throw new Error('No valid Cloudflare account found');

    // Get zone info using the account ID
    return await withRetry(async () => {
      return fetch(`https://api.cloudflare.com/client/v4/zones/${accountId}/dns`, {
        headers: { 'Authorization': `Bearer ${await readCFToken(env, clientId).accessToken}` }
      });
    })
  } catch (e) {
    console.error('Error getting Cloudflare zone info:', e);
    throw new Error(`Zone info error: ${e.message}`);
  }
}

// Helper function to retry failed requests with exponential backoff and jitter
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

// Helper function to retry failed requests with exponential backoff
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

// Helper function to retry failed requests with exponential backoff and jitter - duplicate removed for brevity