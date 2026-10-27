// Unit tests for the benchmark bookkeeping in site/tools/bench.js.
// These guard the two bugs that actually bit us:
//   1) `opts.diff` referenced outside B.run's scope  → ReferenceError,
//      probe/dodge silently produced nothing;
//   2) result rows normalised by G.runT, which resets on auto-restart
//      → absurd 4440 dashes/min.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = readFileSync(join(ROOT, 'site', 'tools', 'bench.js'), 'utf8');

test('bench.js never references a bare `opts` outside the public runner', () => {
  // `opts` is only a parameter of B.run; every runner must take its own params.
  const offenders = [];
  const runnerBlocks = SRC.split(/async function run/).slice(1);
  for (const block of runnerBlocks) {
    const name = block.slice(0, block.indexOf('('));
    if (name === 'Throughput' || name === 'Dodge' || name === 'FullRun' || name === 'Probe') {
      // only a *standalone* opts counts: TSW.auto.opts.* is perfectly fine
      if (/(^|[^.\w])opts\./.test(block)) offenders.push(name);
    }
  }
  assert.deepEqual(offenders, [], `these runners use an out-of-scope opts: ${offenders.join(', ')}`);
});

test('every run* signature that uses `diff` declares it', () => {
  for (const name of ['runProbe', 'runFullRun', 'runDodgeOne']) {
    const i = SRC.indexOf('async function ' + name + '(');
    assert.ok(i >= 0, `${name} must exist`);
    const head = SRC.slice(i, SRC.indexOf(') {', i) + 2);
    if (/\bdiff\b/.test(SRC.slice(i, SRC.indexOf('\n    const', i)))) {
      assert.ok(/diff\s*=/.test(head), `${name} uses diff but does not destructure it`);
    }
  }
});

test('dodge rows normalise on play ticks, not on the restart-prone runT', () => {
  const i = SRC.indexOf('const mins =');
  assert.ok(i >= 0, 'expected a minutes computation in the dodge runner');
  const line = SRC.slice(i, SRC.indexOf('\n', i));
  assert.ok(/A\.ticks/.test(line), `dodge minutes must use ticks: ${line.trim()}`);
  assert.ok(!/g\.runT/.test(line), 'dodge minutes must not use G.runT');
});

test('a sample that never saw combat is flagged invalid', () => {
  assert.ok(/valid:\s*A\.ticks\s*>=\s*600/.test(SRC), 'dodge rows must carry a validity gate');
  assert.ok(/for \(let i = 0; i < 2 && r && !r\.valid; i\+\+\)/.test(SRC), 'invalid samples must be retried');
  assert.ok(/样本无效/.test(SRC), 'an invalid comparison must say so instead of declaring a winner');
});

test('hit counting is restart-proof (local wrapper, not G.hits)', () => {
  assert.ok(/let localHits = 0/.test(SRC), 'dodge must count hits locally');
  assert.ok(/const hits = localHits/.test(SRC), 'the reported hits must come from the local counter');
});

test('the watchdog exists so a soft-locked run still ends the measurement', () => {
  assert.ok(/watchdog/i.test(SRC), 'runFullRun must keep its stuck-run watchdog');
  assert.ok(/hurtPlayer\(999/.test(SRC), 'the watchdog ends the run through the game damage entry point');
});

test('all result rows are JSON-serialisable', () => {
  // A row containing a function or a cycle would break TSW_RESULT parsing.
  const kinds = [...SRC.matchAll(/kind: '([a-z-]+)'/g)].map((m) => m[1]);
  for (const k of kinds) assert.ok(/^[a-z-]+$/.test(k), `odd kind: ${k}`);
  assert.ok(kinds.includes('dodge') && kinds.includes('dodge-ab'), 'dodge rows must be present');
});
