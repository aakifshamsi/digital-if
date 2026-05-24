// Host-resolver middleware — on every request, check if the host is a custom domain
// mapped to a specific client. If so, inject ?client=<clientId> into the request URL
// before routing to handlers.
//
// Example: request to https://massagedowntownvancouver.com/admin/clients.html
// → middleware looks up KV key "domain:massagedowntownvancouver.com"
// → finds { clientId: "cli_abc123" }
// → rewrites URL to /admin/clients.html?client=cli_abc123
// → pages router routes to /admin/clients.html (client-side hydration reads ?client)
//
// Prerequisite: domain:<host> KV keys must be seeded (via seed-kv.sh or admin portal)

import { getJSON } from './_shared/kv.js';

export async function onRequest({ request, env, next }) {
  try {
    const url = new URL(request.url);
    const host = request.headers.get('host') || url.hostname;

    // Only attempt domain lookup if host is not localhost or Pages preview domain
    if (!host || host.includes('localhost') || host.includes('127.0.0.1') || host.includes('pages.dev')) {
      return next();
    }

    // Check KV for domain:<host> mapping
    const domainMapping = await getJSON(env, `domain:${host}`, null);

    if (!domainMapping || !domainMapping.clientId) {
      // Not a custom domain, or not yet configured — pass through
      return next();
    }

    // Custom domain found — inject ?client=<clientId> into the request URL
    const clientId = domainMapping.clientId;
    url.searchParams.set('client', clientId);

    // Create a new request with the modified URL
    const modifiedRequest = new Request(url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    return next(modifiedRequest);
  } catch (e) {
    // If anything breaks in middleware, log but don't block the request
    console.error('[dh-middleware] error in host resolver:', e);
    return next();
  }
}
