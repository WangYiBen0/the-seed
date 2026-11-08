// Unit tests for scripts/sync-scripts.mjs — the parsing/planning that decides
// which upstream scripts get fetched and rewritten in CI.
//
// The real failure mode these guard: platform.js is the only file that knows the
// script list and the version. A regex that silently matches nothing would make
// CI fetch zero scripts and then happily report success.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MOD = pathToFileURL(join(ROOT, 'scripts', 'sync-scripts.mjs')).href;

const platformSrc = readFileSync(join(ROOT, 'site', 'js', 'platform.js'), 'utf8');

test('parseGameScripts reads the real GAME_SCRIPTS list', async () => {
  const { parseGameScripts } = await import(MOD);
  const names = parseGameScripts(platformSrc);
  // Do NOT pin the exact length or the last entry.  Upstream ADDS scripts (on
  // 2026-11-07 it went 76 -> 78 with weapons4.js and boss4.js, and boss4 took over
  // the tail from arsenal), and `assert.equal(names.length, 76)` then failed on a
  // perfectly good sync - the gate went red for upstream progress, not for a bug.
  assert.ok(names.length >= 60, 'the game declares at least 60 scripts, got ' + names.length);
  assert.equal(names[0], 'engine', 'engine must stay first; the list order is load order');
  assert.ok(names.includes('platform') === false, 'platform is the loader, not a game script');
  assert.ok(names.every((n) => /^[a-z0-9_-]+$/.test(n)), 'names are plain identifiers');
  assert.equal(new Set(names).size, names.length, 'script names must be unique');
  const missing = names.filter((n) => !existsSync(join(ROOT, 'site', 'js', n + '.js')));
  assert.deepEqual(missing, [], 'site/js/ is missing scripts that platform.js lists: ' + missing.join(', '));
});

test('parseGameScripts returns [] for source without the list instead of garbage', async () => {
  const { parseGameScripts } = await import(MOD);
  assert.deepEqual(parseGameScripts('const other = 1;'), []);
  assert.deepEqual(parseGameScripts(''), []);
});

test('parseGameV reads the real version', async () => {
  const { parseGameV } = await import(MOD);
  assert.match(parseGameV(platformSrc), /^[a-z0-9]{6,}/);
  assert.equal(parseGameV('nothing here'), null);
});

test('planFiles covers scripts, local-only files, and is stable across runs', async () => {
  const { planFiles } = await import(MOD);
  const a = planFiles({ scripts: ['b', 'a'], local: ['a.js', 'z.js', 'FILES.txt'] });
  const b = planFiles({ scripts: ['a', 'b'], local: ['z.js', 'a.js'] });
  assert.deepEqual(a, b, 'input order must not change the plan');
  assert.deepEqual(a, ['a.js', 'b.js', 'z.js']);
  assert.ok(!a.includes('FILES.txt'), 'non-js files are never fetched');
});

// ---- the verbatim frame page and the upstream/js mirror (SET-freeze fix) ---
//
// The verbatim upstream page must carry NO static game-script tags.  platform.js
// loads GAME_SCRIPTS itself, AFTER the save is in STORE.mem; a static tag runs
// engine.js at parse time with an empty STORE.mem, which froze `const SET` to
// defaults and forced the naming screen on every boot ("存档在，但名字要重新取",
// measured 2026-11-08 with a real-iframe probe).  The dynamic loads resolve to
// upstream/js/<name>.js, so that directory must exist and match site/js/ byte
// for byte, or the boot fails in the other direction.

test('upstream/index.html is verbatim: no static game-script tags, platform.js only', async () => {
  const html = readFileSync(join(ROOT, 'site', 'upstream', 'index.html'), 'utf8');
  const gameTags = [...html.matchAll(/<script src="\.\.\/js\/([a-z0-9_-]+)\.js"><\/script>/g)].map((m) => m[1]);
  assert.deepEqual(gameTags, ['platform'],
    'upstream/index.html must carry exactly the platform.js tag, got: ' + gameTags.join(', '));
  assert.ok(html.trimEnd().endsWith('</body></html>'), 'the page must end with the closing body/html tags');
  assert.ok(!/engine\.js/.test(html), 'no engine.js reference may remain anywhere in the page');
});

test('upstream/js mirrors site/js for every GAME_SCRIPTS entry, byte for byte', async () => {
  const { parseGameScripts } = await import(MOD);
  const names = parseGameScripts(platformSrc);
  assert.ok(names.length >= 60, 'sanity: the game script list is present');
  const missing = [];
  for (const n of names) {
    const p = join(ROOT, 'site', 'upstream', 'js', n + '.js');
    if (!existsSync(p)) { missing.push(n + ' (absent)'); continue; }
    const a = readFileSync(join(ROOT, 'site', 'js', n + '.js'));
    const b = readFileSync(p);
    if (!a.equals(b)) missing.push(n + ' (drift)');
  }
  assert.deepEqual(missing, [], 'upstream/js must mirror site/js: ' + missing.join(', '));
});

test('stripUpstreamScriptTags removes the tag block and keeps the rest', async () => {
  const { stripUpstreamScriptTags } = await import(MOD);
  const { mkdtemp, writeFile, readFile } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const dir = await mkdtemp(join(tmpdir(), 'strip-'));
  const p = join(dir, 'index.html');
  const before = '<body><script src="../js/platform.js"></script>\n' +
    '<script src="../js/engine.js"></script><script src="../js/i18n.js"></script></body></html>';
  await writeFile(p, before);
  const first = await stripUpstreamScriptTags(p);
  assert.deepEqual(first, { changed: true });
  const after = await readFile(p, 'utf8');
  assert.equal(after, '<body><script src="../js/platform.js"></script>\n</body></html>');
  const second = await stripUpstreamScriptTags(p);
  assert.deepEqual(second, { changed: false, reason: 'no-script-block' }, 'a second run is a no-op');
});
