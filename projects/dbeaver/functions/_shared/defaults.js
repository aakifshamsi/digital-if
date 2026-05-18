// Thin re-export layer. The actual seed content/theme for each template lives
// in templates.js — this file exists so older imports keep working and for
// pages that just want "a sensible default" without picking a template.

export { GENERIC_CONTENT as DEFAULT_CONTENT, GENERIC_THEME as DEFAULT_THEME } from './templates.js';
export { defaultsFor, TEMPLATES, TEMPLATE_IDS, DEFAULT_TEMPLATE, getTemplate } from './templates.js';
