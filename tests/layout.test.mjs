// Structural guards. The reorganisation moved internal docs and sync state out
// of the served root, and replaced the hand-written game.html with the verbatim
// upstream page mounted in an iframe. Those are easy to undo by accident — a new
// file dropped in site/docs/, or an entry page that loads js/ directly — and the
// breakage is silent until something is published. These assertions make the
// intended shape explicit.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'site');

test('internal docs and sync state are outside the served root', () => {
  assert.equal(existsSync(join(SITE, 'docs')), false, 'site/docs must not exist: it would be published');
  assert.equal(existsSync(join(SITE, 'asset-manifest.json')), false, 'manifest is sync state, not a build artifact');
  assert.ok(existsSync(join(ROOT, 'docs', 'benchmark.md')), 'docs live at the repo root');
  assert.ok(existsSync(join(ROOT, 'state', 'manifest.json')), 'manifest lives in state/');
});

test('the entry page frames the verbatim upstream page', () => {
  const host = readFileSync(join(SITE, 'index.html'), 'utf8');
  // the frame is created through DzmmHost.mount (benchmark.md 282: the entry page
  // must ALSO answer the SDK's postMessage handshake, or the game never boots)
  assert.match(host, /upstream\/index\.html/, 'host must frame the upstream page');
  assert.match(host, /DzmmHost\.create/, 'the host page must answer the SDK as the dzmm host');
  assert.equal(existsSync(join(SITE, 'game.html')), false, 'game.html was replaced by the upstream page');
});

test('upstream page is verbatim: only platform.js, game scripts load dynamically', () => {
  const up = join(SITE, 'upstream', 'index.html');
  const html = readFileSync(up, 'utf8');
  const refs = [...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1]).filter((s) => s.startsWith('../js/'));
  // platform.js reads the save into STORE.mem BEFORE dynamically loading the game
  // scripts; a static ../js/<game>.js tag here runs engine.js at parse time with an
  // empty STORE.mem and freezes `const SET` — the naming screen on every boot
  // ("存档在，但名字要重新取", measured 2026-11-08).  The dynamic loads resolve to
  // upstream/js/, mirrored from site/js/ by scripts/sync-scripts.mjs (byte-for-byte
  // mirror asserted in sync-scripts.test.mjs).
  assert.deepEqual(refs, ['../js/platform.js'], 'the page must reference only platform.js via ../js/, got ' + refs.join(', '));
  assert.ok(existsSync(join(SITE, 'upstream', 'js', 'engine.js')), 'dynamic loads must resolve: upstream/js/ must exist');
});

test('tools are injected relative to the frame, not the host', () => {
  const host = readFileSync(join(SITE, 'index.html'), 'utf8');
  // injected scripts resolve against the IFRAME's document, so a bare 'tools/'
  // path would 404 under upstream/
  assert.match(host, /s\.src = '..\/tools\/'/, 'injection must use ../tools/');
});

test('the published root carries no internal markdown', () => {
  const entries = ['index.html', 'auto.html', 'inject.js', 'dzmm-shim.js'];
  for (const e of entries) assert.ok(existsSync(join(SITE, e)), 'missing served file ' + e);
  // a stray .md in site/ would be served as text/plain to anyone
  assert.equal(existsSync(join(SITE, 'README.md')), false);
  assert.ok(statSync(join(SITE, 'upstream')).isDirectory());
});
