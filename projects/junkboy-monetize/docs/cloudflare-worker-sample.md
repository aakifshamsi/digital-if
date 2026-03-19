# Cloudflare Worker sample

Paste this into a new Worker if you want authenticated remote config storage.

```js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== '/config') {
      return new Response('Not Found', { status: 404 });
    }

    if (request.method === 'GET') {
      const config = await env.CONFIG.get('junkboy-config');
      return new Response(config || '{}', {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store'
        }
      });
    }

    if (request.method === 'PUT') {
      const auth = request.headers.get('authorization') || '';
      if (auth !== `Bearer ${env.ADMIN_TOKEN}`) {
        return new Response('Unauthorized', { status: 401 });
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return new Response('Invalid JSON', { status: 400 });
      }

      if (!body || typeof body !== 'object') {
        return new Response('Invalid payload', { status: 400 });
      }

      await env.CONFIG.put('junkboy-config', JSON.stringify(body, null, 2));
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'content-type': 'application/json; charset=utf-8' }
      });
    }

    return new Response('Method Not Allowed', { status: 405 });
  }
};
```

## Setup

1. Create a Worker.
2. Add a KV namespace binding named `CONFIG`.
3. Add a secret named `ADMIN_TOKEN`.
4. Route `/config` to this Worker.
5. Put the Worker URL and token into the admin page.

## Notes

- Do not store SMS message bodies remotely.
- Use remote config only for feature flags, placements, and entitlement controls.
- Keep ad network IDs and provider switches reviewable.
