// cloudhost.js must write through dzmm.kv, never through HTTP. Verify against a
// fake host that records what it received, and against the offline shim which
// must be REFUSED (writing through a shim would silently do nothing real).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = readFileSync(join(ROOT, 'site', 'tools', 'cloudhost.js'), 'utf8');

// minimal TSW + dzmm world; no DOM needed
function load(host) {
  const win = { __TSW: {}, dzmm: host, btoa: (s) => Buffer.from(s, 'utf8').toString('base64'), atob: (s) => Buffer.from(s, 'base64').toString('utf8'), unescape, escape, encodeURIComponent, decodeURIComponent, JSON, Object, console, Date, Math, btoa2: null };
  new Function('window', SRC)(win);
  return win.__TSW.cloudHost;
}

test('an offline shim is refused, because writing through it is not a real save', () => {
  const ch = load({ __shim: true, kv: {} });
  assert.equal(ch.detect().ok, false);
  assert.match(ch.detect().why, /offline shim/);
});

test('no dzmm.kv means no host', () => {
  const ch = load(undefined);
  assert.equal(ch.detect().ok, false);
});

test('save writes through dzmm.kv with flush and verifies by read-back', async () => {
  const store = {};
  const calls = [];
  const host = {
    kv: {
      async get(k) { return { value: store[k] === undefined ? null : store[k] }; },
      async put(k, v, opts) { calls.push([k, opts && opts.flush]); store[k] = v; },
    },
  };
  const ch = load(host);
  const res = await ch.save({ keys: { achroma_run: '{"a":1}' } });
  assert.deepEqual(res.written, ['achroma_run']);
  assert.deepEqual(res.verified, ['achroma_run']);
  assert.equal(res.ok, true);
  assert.deepEqual(calls, [['achroma_run', true]], 'must pass flush:true like the game does');
});

test('a write that does not stick is reported as failure', async () => {
  const host = { kv: {
    async get() { return { value: null }; },
    async put() { /* accept and drop, like a debounced host that fails */ },
  } };
  const ch = load(host);
  const res = await ch.save({ keys: { achroma_run: '{"a":1}' } });
  assert.equal(res.ok, false);
  assert.deepEqual(res.verified, []);
});

test('unknown keys are never written', async () => {
  const written = [];
  const host = { kv: { async get() { return { value: null }; }, async put(k) { written.push(k); } } };
  const ch = load(host);
  await ch.save({ keys: { bogus_key: 'x', achroma_run: 'y' } });
  assert.deepEqual(written.sort(), ['achroma_run']);
});

test('it never issues HTTP: no fetch anywhere', () => {
  assert.ok(!/fetch\(/.test(SRC), 'the whole point is that the Host writes, not us');
});
