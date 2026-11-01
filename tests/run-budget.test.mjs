// The budget formulas that killed three measurement batches by hand.
//
// scripts/headless-bench.mjs: hardTimeout = (max(--timeout, gameSec*0.66+180) + 150) s
// scripts/run-one.mjs:        outer       = hardTimeout + 120 s
//
// Three batches were launched as `timeout 900 node scripts/headless-bench.mjs
// --game-seconds 1600`; the CLI needs 1386 s, so the shell killed it (rc=124)
// before any TSW_RESULT was emitted, and the log looked exactly like a hang.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RUNNER = readFileSync(join(ROOT, 'scripts', 'run-one.mjs'), 'utf8');
const BENCH_CLI = readFileSync(join(ROOT, 'scripts', 'headless-bench.mjs'), 'utf8');

test('the CLI derives a wall budget from --game-seconds', () => {
  assert.match(BENCH_CLI, /gameSec \* 0\.66 \+ 180/, 'the CLI must convert game seconds to wall time');
  assert.match(BENCH_CLI, /Math\.max\(\+args\.timeout \|\| 900, wallFromGame\)/, 'it must take the larger of the two');
});

test('the runner computes an outer timeout that is always larger', () => {
  assert.match(RUNNER, /const wallFromGame = gameSec \? gameSec \* 0\.66 \+ 180 : 0;/, 'same formula');
  assert.match(RUNNER, /const hard = \(Math\.max\(benchTimeout, wallFromGame\) \+ 150\) \* 1000;/, 'add the CLI overhead');
  // outer is now capped: an attempt may be shorter than the CLI's own limit, so a
  // hang costs less. The retry path absorbs the abandoned attempt.
  assert.match(RUNNER, /const ATTEMPT_CAP_MS = 400 \* 1000;/, 'each attempt must be bounded');
  assert.match(RUNNER, /const outer = Math\.min\(hard \+ 120 \* 1000, ATTEMPT_CAP_MS\);/, 'so is the outer timer');
});

test('the runner records how a batch ended, so rc=124 is visible', () => {
  assert.match(RUNNER, /runner\.log/, 'there must be an observable log');
  assert.match(RUNNER, /killed by outer timeout/, 'an outer kill must be recorded, not silent');
});
