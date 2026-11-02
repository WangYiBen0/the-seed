// The deterministic clock must not read real time, or benchmarks stop reproducing.
// Measured defect (docs/benchmark.md 190): the det branch accumulated from
// dt = realNow - lastReal, so ticks-per-frame followed the machine's frame rate.
// A 200 s run reproduced, a 300 s run did not (waves 5/5 then 6/5).
// A benchmark you cannot re-run is not a measurement, so this guards the shape.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CORE = readFileSync(join(ROOT, 'site', 'tools', 'core.js'), 'utf8');
const BENCH = readFileSync(join(ROOT, 'site', 'tools', 'bench.js'), 'utf8');

test('the det branch advances a fixed tick count and ignores real time', () => {
  const detBlock = CORE.slice(CORE.indexOf('if (det) {'), CORE.indexOf('if (speed === 1)'));
  assert.ok(detBlock.length > 0, 'det branch must exist');
  assert.doesNotMatch(detBlock, /acc\s*\+=/, 'det must not accumulate from real dt');
  assert.doesNotMatch(detBlock, /realNow\s*-\s*lastReal/, 'det must not read frame dt');
  assert.match(detBlock, /for \(let i = 0; i < steps; i\+\+\)/, 'det must advance a computed step count');
});

test('bench enables det for invade and records it in the row', () => {
  assert.match(BENCH, /if \(detMode\) TSW\.det\.enable\(\)/, 'invade must enable det');
  assert.match(BENCH, /det: detMode/, 'rows must carry the det flag');
  assert.match(BENCH, /if \(!detWas\) TSW\.det\.disable\(\)/, 'det state must be restored');
});
