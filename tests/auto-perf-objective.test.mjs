// Objective selection cost.  pickObjective walks every room and every
// interactable, and the reward-room/distance rules added a per-room distance term
// to that walk.  Calling it every tick dropped the simulation rate from 209 to
// 141 ticks per wall-second at speed 8 (same seed, same budget).
//
// Interleaved measurement, seed 7, --timeout 90:
//   ec6fdb3~1 (before)        218.7 tps
//   ec6fdb3    (after)        141.3 tps   (-35%)
//   + objective cache         242.3 tps   (above the old code, with the fixes)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AUTO = readFileSync(join(ROOT, 'site', 'tools', 'auto.js'), 'utf8');

test('the objective picker is throttled, not run every tick', () => {
  assert.match(AUTO, /A\._objCache && \(G\.time - A\._objCache\.t\) < 0\.25/,
    'pickObjective must be cached within the tick window');
  assert.match(AUTO, /A\._objCache = \{ t: G\.time, tgt \};/, 'the cache must be refreshed');
});

test('an invalidated objective is still re-picked immediately', () => {
  // the three re-pick sites (dead point, give-up, done) bypass the cache
  const n = (AUTO.match(/tgt = pickObjective\(G, p\)/g) || []).length;
  assert.ok(n >= 2, 'the dead-point and give-up re-picks must survive the cache, found ' + n);
});
