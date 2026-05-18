// GET /api/templates — public list of available templates for the admin picker.
// Returns metadata only (id, name, description, palette, tags) — the full
// content+theme defaults are seeded server-side when a client is created.
import { json } from '../_shared/http.js';
import { TEMPLATES, DEFAULT_TEMPLATE } from '../_shared/templates.js';

export async function onRequestGet() {
  const items = Object.values(TEMPLATES).map(t => ({
    id: t.id, name: t.name, description: t.description,
    palette: t.palette, tags: t.tags || []
  }));
  return json({ templates: items, default: DEFAULT_TEMPLATE });
}
