// Fire rate beats per-shot damage, measured: nova has 5.4x nail's theoretical
// sustained dps (99.9 vs 27.7) yet produced HALF the real hits and damage and
// 0.5 rooms vs 1.5 (benchmark.md 172). A shot only converts while the enemy is
// visible and in range, so converted hits scale with rate.
//
// This locks the two halves of that finding:
//   1. wScore adds a rate term
//   2. the option is declared in the defaults table (or an A/B is voided)
//   3. rows report dmgReal, the hp actually removed
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AUTO = readFileSync(join(ROOT, 'site', 'tools', 'auto.js'), 'utf8');
const BENCH = readFileSync(join(ROOT, 'site', 'tools', 'bench.js'), 'utf8');

test('weapon scoring includes a fire-rate term', () => {
  assert.match(AUTO, /if \(A\.opts\.rateBias !== false\)/, 'the rate term must be switchable');
  assert.match(AUTO, /v \+= Math\.min\(2\.5, rt \/ 6\)/, 'rate must actually add to the score');
});

test('rateBias is declared before it is read', () => {
  const decl = AUTO.indexOf('rateBias:');
  const use = AUTO.indexOf('A.opts.rateBias !== false');
  assert.ok(decl > 0, 'rateBias must be declared in the defaults table');
  assert.ok(decl < use, 'declaration must precede use');
});

test('rateBias defaults OFF, because a balanced A/B found no benefit', () => {
  // benchmark.md 172¾: 5-vs-5 over the same seeds gave 1.60 (on) vs 1.80 (off).
  // The earlier "+33%" came from unbalanced arms (4 vs 3). Locking the default
  // keeps a future reader from re-enabling it on the strength of that artifact.
  assert.match(AUTO, /rateBias: false/, 'default must be off');
});

test('rows report damage actually removed, not damage claimed', () => {
  assert.match(BENCH, /dmgReal:/, 'dmgReal must be reported');
  assert.match(BENCH, /const lost = hpBefore - \(e\.hp \|\| 0\)/, 'it must be measured from hp deltas');
});
