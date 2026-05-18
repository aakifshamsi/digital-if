// Defensive wrappers around env.DH_KV — fails loud instead of returning
// undefined silently when the binding is missing or the value is corrupt.

export function requireKV(env) {
  if (!env || !env.DH_KV) {
    throw new Response(
      JSON.stringify({ error: 'kv_binding_missing', message: 'DH_KV namespace is not bound. Run scripts/kv-bootstrap.sh and redeploy.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return env.DH_KV;
}

export async function getJSON(env, key, fallback = null) {
  const kv = requireKV(env);
  const raw = await kv.get(key);
  if (raw == null) return fallback;
  try { return JSON.parse(raw); }
  catch (e) {
    console.warn(`[dh-kv] corrupt JSON at ${key}:`, e);
    return fallback;
  }
}

export async function putJSON(env, key, value, opts = {}) {
  const kv = requireKV(env);
  await kv.put(key, JSON.stringify(value), opts);
}

export async function listKeys(env, prefix) {
  const kv = requireKV(env);
  const out = [];
  let cursor;
  do {
    const res = await kv.list({ prefix, cursor });
    for (const k of res.keys) out.push(k.name);
    cursor = res.list_complete ? null : res.cursor;
  } while (cursor);
  return out;
}
