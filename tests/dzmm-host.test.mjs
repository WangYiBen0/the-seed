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

// ---- the kv contract: the SDK prefixes keys, the host must not double-prefix ----
// Measured on the live mirror 2026-11-08: the gamefy SDK (bundled in
// site/upstream/index.html) calls dzmm.withKvPrefix on every kv key before
// sending it, so a request key is already 'theseed.host.kv.<name>'.  The host's
// kvGet/kvSet/kvDel prepended the prefix AGAIN, so writes landed in
// 'theseed.host.kv.theseed.host.kv.achroma_set' while reads looked up
// 'theseed.host.kv.achroma_set' and came back null — the game loaded an empty
// save on every refresh even though the write had reported ok.  The bench's
// dzmm-shim does NOT prefix, so the headless suite never caught it.  Both paths
// are tested here.

function loadHost() {
  const store = new Map();
  const localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
    get length() { return store.size; },
    key: i => [...store.keys()][i],
  };
  globalThis.localStorage = localStorage;
  const sandbox = { window: globalThis, console, localStorage, addEventListener: () => {}, removeEventListener: () => {}, Document: function(){} };
  sandbox.window.localStorage = localStorage;
  sandbox.window.addEventListener = sandbox.addEventListener;
  sandbox.window.removeEventListener = sandbox.removeEventListener;
  const fn = new Function('window', 'console', 'localStorage', HOST + '\n; return window.DzmmHost;');
  const DzmmHost = fn(sandbox.window, console, localStorage);
  return { host: DzmmHost.create({}), store };
}

const KV_PREFIX = 'theseed.host.kv.';
const STORE_KEYS = ['achroma_set', 'achroma_run', 'achroma_codex', 'achroma_girls'];

function platformMem(r2, keys) {
  // platform.js: for (const k of STORE_KEYS) { const e = r[k]; const v = e && 'value' in e && 'updated_at' in e ? e.value : e; ... }
  const mem = {};
  for (const k of keys) {
    const e = r2[k];
    const v = e && typeof e === 'object' && 'value' in e && 'updated_at' in e ? e.value : e;
    if (v != null) mem[k] = typeof v === 'string' ? v : JSON.stringify(v);
  }
  return mem;
}

test('batchPut + batchGet round-trips when the SDK sends fully prefixed keys', async () => {
  const { host, store } = loadHost();
  const m = host.methods;
  const putP = { values: {} };
  for (const k of STORE_KEYS) putP.values[KV_PREFIX + k] = { name: k, n: 1 };
  const r1 = await m['kv.batchPut'](putP);
  assert.ok(r1 && r1.ok === true, 'batchPut must report ok');
  for (const k of Object.keys(store)) assert.ok(!k.startsWith(KV_PREFIX + KV_PREFIX), 'double-prefixed key written: ' + k);
  const r2 = await m['kv.batchGet']({ keys: STORE_KEYS.map(k => KV_PREFIX + k) });
  const mem = platformMem(r2, STORE_KEYS.map(k => KV_PREFIX + k));
  assert.equal(Object.keys(mem).length, STORE_KEYS.length, 'every saved key must round-trip, got ' + JSON.stringify(mem));
});

test('batchPut + batchGet round-trips when the shim sends bare keys', async () => {
  const { host, store } = loadHost();
  const m = host.methods;
  const putP = { values: {} };
  for (const k of STORE_KEYS) putP.values[k] = { name: k, n: 2 };
  const r1 = await m['kv.batchPut'](putP);
  assert.ok(r1 && r1.ok === true, 'batchPut must report ok');
  for (const k of Object.keys(store)) assert.ok(k.startsWith(KV_PREFIX), 'bare key must be stored prefixed: ' + k);
  const r2 = await m['kv.batchGet']({ keys: STORE_KEYS });
  const mem = platformMem(r2, STORE_KEYS);
  assert.equal(Object.keys(mem).length, STORE_KEYS.length, 'shim path must round-trip too');
});

test('single kv.put / kv.get round-trips with prefixed keys', async () => {
  const { host, store } = loadHost();
  const m = host.methods;
  const r = await m['kv.put']({ key: KV_PREFIX + 'achroma_test', value: { hello: 'world' } });
  assert.ok(r && r.ok === true, 'single put must report ok');
  for (const k of Object.keys(store)) assert.ok(!k.startsWith(KV_PREFIX + KV_PREFIX), 'single put must not double-prefix: ' + k);
  const g = await m['kv.get']({ key: KV_PREFIX + 'achroma_test' });
  assert.deepEqual(g.value, { hello: 'world' }, 'single get must return what was written');
});

test('kv.delete removes the value regardless of prefix shape', async () => {
  const { host, store } = loadHost();
  const m = host.methods;
  await m['kv.put']({ key: KV_PREFIX + 'achroma_del', value: { x: 1 } });
  assert.equal(store.size, 1);
  await m['kv.delete']({ key: KV_PREFIX + 'achroma_del' });
  assert.equal(store.size, 0, 'delete must clear the prefixed slot');
  await m['kv.delete']({ key: 'achroma_del' });
  assert.equal(store.size, 0, 'delete with a bare key must also clear it');
});

test('kv.list returns bare keys for prefixed entries', async () => {
  const { host, store } = loadHost();
  const m = host.methods;
  await m['kv.batchPut']({ values: { [KV_PREFIX + 'achroma_list_a']: { n: 1 }, [KV_PREFIX + 'achroma_list_b']: { n: 2 } } });
  const r = await m['kv.list']({ prefix: 'achroma_' });
  assert.ok(Array.isArray(r.keys), 'list must return keys');
  assert.ok(r.keys.includes('achroma_list_a') && r.keys.includes('achroma_list_b'), 'list must return bare keys: ' + JSON.stringify(r.keys));
});
