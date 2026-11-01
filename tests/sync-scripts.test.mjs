// Unit tests for scripts/sync-scripts.mjs — the parsing/planning that decides
// which upstream scripts get fetched and rewritten in CI.
//
// The real failure mode these guard: platform.js is the only file that knows the
// script list and the version. A regex that silently matches nothing would make
// CI fetch zero scripts and then happily report success.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MOD = pathToFileURL(join(ROOT, 'scripts', 'sync-scripts.mjs')).href;

const platformSrc = readFileSync(join(ROOT, 'site', 'js', 'platform.js'), 'utf8');

test('parseGameScripts reads the real GAME_SCRIPTS list', async () => {
  const { parseGameScripts } = await import(MOD);
  const names = parseGameScripts(platformSrc);
  assert.equal(names.length, 76, 'the game declares 76 scripts');
  assert.equal(names[0], 'engine');
  assert.equal(names.at(-1), 'arsenal');
  assert.ok(names.every((n) => /^[a-z0-9_-]+$/.test(n)), 'names are plain identifiers');
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
