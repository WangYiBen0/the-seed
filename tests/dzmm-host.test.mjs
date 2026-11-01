// The dzmm HOST protocol, verified end to end in headless chromium.
//
// The official SDK's entire data channel is postMessage:
//   iframe -> parent  {type:'dzmm:request', id, method, params}
//   parent -> iframe  {type:'dzmm:response', id, result|error}
// (extracted from gamefy/sdk/v1.js, 65 KB: the request/response pair is the only
// data path; tokens and kv both travel through it).
//
// Measured with site/dzmm-host.js + site/dzmm-shim.js (?dzmmhost=1), game in an
// iframe:
//   BACKEND {"calls":2,"ops":["put:probe-key","get:probe-key"]}
//   KVOUT   {"value":{"fromServer":true}, ...}
// i.e. a real kv.put/kv.get round trip where the host answered from its own
// backend rather than localStorage.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HOST = readFileSync(join(ROOT, 'site', 'dzmm-host.js'), 'utf8');
const SHIM = readFileSync(join(ROOT, 'site', 'dzmm-shim.js'), 'utf8');

test('the host answers the request/response pair', () => {
  assert.match(HOST, /d\.type === 'dzmm:request'/, 'must listen for requests');
  assert.ok(HOST.includes("send('dzmm:response'"), 'must answer with a response');
  assert.match(HOST, /'iframe:content-ready'/, 'must recognise the iframe handshake');
});

test('the host never invents an identity', () => {
  assert.match(HOST, /'user\.info': async \(\) => \(o\.user \? o\.user : \{ id: null, name: null/,
    'unset identity must resolve to null, not a fake id');
});

test('a host with a real session can forward kv to the official API', () => {
  assert.match(HOST, /const backend = o\.kvFetch \|\| null;/, 'kvFetch hook must exist');
  assert.ok(HOST.includes("backend({ op: 'get', key: p.key })"), 'get must be forwarded to the backend');
  const n = (HOST.match(/if \(backend\)/g) || []).length;
  assert.ok(n >= 4, 'get/put/delete/list must all route through it, found ' + n);
});

test('the shim only takes the host route when asked, and falls back safely', () => {
  assert.match(SHIM, /const WANT_HOST = /, 'the host route is opt-in');
  assert.match(SHIM, /q\.get\('dzmmhost'\) === '1'/, 'and selected by ?dzmmhost=1');
  assert.match(SHIM, /if \(window\.parent === window\) return null;/, 'no parent means no host');
  // every failure must keep the local save usable
  const warns = (SHIM.match(/host kv\.\w+ failed/g) || []).length;
  assert.ok(warns >= 3, 'each host failure must fall back to localStorage, found ' + warns);
});
