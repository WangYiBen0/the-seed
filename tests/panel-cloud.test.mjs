// Panel-level check: the cloud buttons must exist, be disabled without a host,
// and the help text must not repeat the disproven CORS claim.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PANEL = readFileSync(join(ROOT, 'site', 'tools', 'panel.js'), 'utf8');
const HOST = readFileSync(join(ROOT, 'site', 'tools', 'cloudhost.js'), 'utf8');

test('the panel exposes real cloud sync, gated on a detected host', () => {
  assert.match(PANEL, /读取官方云存档/, 'pull button');
  assert.match(PANEL, /写回官方云存档/, 'push button');
  assert.match(PANEL, /bClPull\.disabled = !d\.ok/, 'disabled without a host');
  assert.match(PANEL, /bClPush\.disabled = !d\.ok/, 'disabled without a host');
});

test('the panel no longer claims the CORS story', () => {
  const code = PANEL.replace(/\/\/[^\n]*/g, '');
  assert.ok(!/无 CORS/.test(code), 'the disproven explanation must be gone');
  assert.match(code, /写入由 dzmm 宿主执行/, 'it must state the real mechanism');
});

test('the host module refuses the offline shim', () => {
  assert.match(HOST, /if \(d\.__shim\) return \{ ok: false/, 'a shim is not a host');
  assert.ok(!/fetch\(/.test(HOST), 'the host does the HTTP, not us');
  assert.match(HOST, /flush: true/, 'saves must use flush like the game does');
});
