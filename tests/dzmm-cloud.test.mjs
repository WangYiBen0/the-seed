// dzmm-cloud.js against a mocked endpoint whose shapes were measured for real:
//   GET /kv      -> {data:[], count:0}
//   GET /kv/<k>  -> {value:null, updated_at:null}
// (CI run 41294623260, signed-in session).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = readFileSync(join(ROOT, 'site', 'dzmm-cloud.js'), 'utf8');

// the module attaches to window; give it one, then read it back
function load() {
  const win = {};
  new Function('window', 'fetch', SRC)(win, globalThis.fetch);
  return win.DzmmCloud;
}

test('it declares itself read-only', () => {
  assert.equal(load().readOnly, true);
});

test('get returns exactly the shape storeLoad() validates', async () => {
  globalThis.fetch = async (url) => ({
    ok: true, status: 200,
    json: async () => (url.endsWith('/kv/achroma_set') ? { value: '{"a":1}', updated_at: '2026-01-01T00:00:00Z' } : { data: [], count: 0 }),
  });
  const C = load();
  const kv = C.make({ gameId: 'g1' });
  const r = await kv({ op: 'get', key: 'achroma_set' });
  assert.deepEqual(r, { value: '{"a":1}', updated_at: '2026-01-01T00:00:00Z' });
  assert.ok(Object.prototype.hasOwnProperty.call(r, 'value') && Object.prototype.hasOwnProperty.call(r, 'updated_at'),
    'platform.js storeLoad requires both fields');
});

test('list maps rows to key strings', async () => {
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ data: [{ key: 'achroma_run' }, { key: 'achroma_set' }], count: 2 }) });
  const kv = load().make({ gameId: 'g1' });
  const r = await kv({ op: 'list', prefix: '' });
  assert.deepEqual(r.keys, ['achroma_run', 'achroma_set']);
});

test('a write is verified by read-back and reports ok only when it landed', async () => {
  const store = { k: null };
  globalThis.fetch = async (url, init) => {
    if (init && init.method === 'PUT') {
      store.k = JSON.parse(init.body).value;
      return { ok: true, status: 200, json: async () => ({}) };
    }
    return { ok: true, status: 200, json: async () => ({ value: store.k, updated_at: null }) };
  };
  const kv = load().make({ gameId: 'g1' });
  const r = await kv({ op: 'put', key: 'k', value: { a: 1 } });
  assert.deepEqual(r, { ok: true, verified: true });
});

test('an unverified write is a failure, not a fake success', async () => {
  // the server accepts the PUT but the value never becomes readable
  globalThis.fetch = async (url, init) => {
    if (init && init.method === 'PUT') return { ok: true, status: 200, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => ({ value: null, updated_at: null }) };
  };
  const kv = load().make({ gameId: 'g1' });
  await assert.rejects(() => kv({ op: 'put', key: 'k', value: { a: 1 } }), /not visible on read-back/);
});

test('a rejected PUT raises instead of reporting success', async () => {
  globalThis.fetch = async (url, init) => {
    if (init && init.method === 'PUT') return { ok: false, status: 403, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => ({ value: null, updated_at: null }) };
  };
  const kv = load().make({ gameId: 'g1' });
  await assert.rejects(() => kv({ op: 'put', key: 'k', value: 1 }), /HTTP 403/);
});

test('a 403 explains that this REST path is not the player save route', async () => {
  // Measured on a real session (2026-11-01): PUT -> 403 FORBIDDEN {没有访问权限},
  // and /api/gamefy/mine -> developer.eligible=false, reason=VIP_REQUIRED.
  globalThis.fetch = async (url, init) => {
    if (init && init.method === 'PUT') {
      return { ok: false, status: 403, text: async () => '{"code":"FORBIDDEN","message":"没有访问权限"}' };
    }
    return { ok: true, status: 200, json: async () => ({ value: null, updated_at: null }) };
  };
  const kv = load().make({ gameId: 'g1' });
  await assert.rejects(() => kv({ op: 'put', key: 'k', value: 1 }), /not the player save route/);
});

test('the write body is configurable, because the real shape is unmeasured', () => {
  assert.match(SRC, /const writeBody = o\.writeBody \|\|/, 'the body must be injectable');
  assert.match(SRC, /const verifyWrites = o\.verifyWrites !== false/, 'verification must default on');
});

test('a non-ok status raises instead of returning empty data', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 401, json: async () => ({}) });
  const kv = load().make({ gameId: 'g1' });
  await assert.rejects(() => kv({ op: 'get', key: 'k' }), /HTTP 401/);
});
