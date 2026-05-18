// Password hashing + session tokens using Web Crypto (PBKDF2 + SHA-256).
// No npm dependencies — these APIs are built into the Workers runtime.
import { requireKV } from './kv.js';

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;     // 7 days
const SESSION_COOKIE = 'dh_session';

const enc = new TextEncoder();

function bufToB64(buf) {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64ToBuf(s) {
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function randomBytes(n) {
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  return arr.buffer;
}

async function pbkdf2(password, salt, iterations) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    HASH_BYTES * 8
  );
}

// Format: pbkdf2$<iter>$<saltB64>$<hashB64>
export async function hashPassword(password) {
  const salt = randomBytes(SALT_BYTES);
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${bufToB64(salt)}$${bufToB64(hash)}`;
}

export async function verifyPassword(password, stored) {
  // Any malformed/corrupted persisted hash returns false instead of throwing,
  // so a bad record produces a clean 401 rather than a 500.
  if (typeof stored !== 'string' || !stored.startsWith('pbkdf2$')) return false;
  const parts = stored.split('$');
  if (parts.length !== 4) return false;
  const [, iterStr, saltB64, hashB64] = parts;
  const iterations = parseInt(iterStr, 10);
  if (!Number.isFinite(iterations) || iterations <= 0 || !saltB64 || !hashB64) return false;
  try {
    const salt = b64ToBuf(saltB64);
    const computed = bufToB64(await pbkdf2(password, salt, iterations));
    if (computed.length !== hashB64.length) return false;
    let mismatch = 0;
    for (let i = 0; i < computed.length; i++) {
      mismatch |= computed.charCodeAt(i) ^ hashB64.charCodeAt(i);
    }
    return mismatch === 0;
  } catch {
    return false;
  }
}

export function newSessionToken() {
  // 32 bytes → 43-char base64url
  return bufToB64(randomBytes(32)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return null;
}

export function sessionCookie(token, { clear = false } = {}) {
  const parts = [
    `${SESSION_COOKIE}=${clear ? '' : token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax'
  ];
  parts.push(clear ? 'Max-Age=0' : `Max-Age=${SESSION_TTL_SECONDS}`);
  return parts.join('; ');
}

// Returns session record { sub, role, clientId? } or null. KV TTL handles expiry.
export async function readSession(request, env) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const kv = requireKV(env);
  const raw = await kv.get(`session:${token}`);
  if (!raw) return null;
  try {
    const sess = JSON.parse(raw);
    sess._token = token;
    return sess;
  } catch {
    return null;
  }
}

export async function writeSession(env, session) {
  const kv = requireKV(env);
  const token = newSessionToken();
  await kv.put(`session:${token}`, JSON.stringify(session), {
    expirationTtl: SESSION_TTL_SECONDS
  });
  return token;
}

export async function destroySession(env, token) {
  if (!token) return;
  const kv = requireKV(env);
  await kv.delete(`session:${token}`);
}

export const SESSION_TTL = SESSION_TTL_SECONDS;
export const COOKIE_NAME = SESSION_COOKIE;
