// Smoke test for functions/_shared/auth.js — runs under Node 20+ (Web Crypto + atob/btoa available).
// Run: node projects/dbeaver/tests/auth.test.mjs
import { hashPassword, verifyPassword, newSessionToken } from '../functions/_shared/auth.js';

let failures = 0;
function ok(label, cond) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`);
  if (!cond) failures++;
}

const pw = 'correct horse battery staple';
const hash = await hashPassword(pw);
ok('hash starts with pbkdf2$', hash.startsWith('pbkdf2$'));
ok('hash has 4 parts',         hash.split('$').length === 4);

ok('verify correct password', await verifyPassword(pw, hash));
ok('verify wrong password',   !(await verifyPassword('wrong', hash)));
ok('verify empty password',   !(await verifyPassword('', hash)));
ok('verify bad-format hash',  !(await verifyPassword(pw, 'not-a-hash')));

const t1 = newSessionToken();
const t2 = newSessionToken();
ok('token is base64url',      /^[A-Za-z0-9_-]+$/.test(t1));
ok('token length ~43',        t1.length >= 40 && t1.length <= 44);
ok('tokens are unique',       t1 !== t2);

process.exit(failures);
