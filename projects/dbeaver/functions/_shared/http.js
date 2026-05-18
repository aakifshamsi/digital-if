// JSON response helpers — every endpoint uses these so error shape is consistent.

export function json(body, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(body), { status: init.status || 200, headers });
}

export function err(status, code, message, extra = {}) {
  return json({ error: code, message, ...extra }, { status });
}

export async function readJSON(request) {
  const ct = request.headers.get('Content-Type') || '';
  if (!ct.includes('application/json')) {
    throw err(415, 'unsupported_media_type', 'Expected application/json');
  }
  try { return await request.json(); }
  catch { throw err(400, 'invalid_json', 'Request body is not valid JSON'); }
}
