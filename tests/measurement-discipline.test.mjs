// Guards for the measurement habits that this project kept violating.
// Each assertion below corresponds to a conclusion that had to be voided because
// one of these was missing (docs/pitfalls.md, "下结论前的自检"):
//
//   1. probes must record game state (a frozen probe may be a dead game)
//   2. paired A/B must be same seeds, same count, interleaved
//   3. runAB must start from wave 1, not a hidden default of 9
//   4. det mode must not read real time anywhere in the tick path
//   5. rows must carry enough fields to be re-checked
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BENCH = readFileSync(join(ROOT, 'site', 'tools', 'bench.js'), 'utf8');
const CORE = readFileSync(join(ROOT, 'site', 'tools', 'core.js'), 'utf8');
const AB = readFileSync(join(ROOT, 'scripts', 'ab-run.mjs'), 'utf8');

test('runAB starts invade from wave 1, not a hidden default', () => {
  // A default of 9 meant an A/B asking "can the build reach wave N" actually
  // measured "can it survive a wave or two from wave 9", and every reach
  // threshold under 10 passed trivially.
  assert.match(BENCH, /wave: \(base\.wave != null \? base\.wave : 1\)/,
    'runAB must default to wave 1');
  assert.doesNotMatch(BENCH, /wave: \(base\.wave != null \? base\.wave : 9\)/,
    'the wave-9 default must not come back');
});

test('runFullRun records state so a dead game cannot be read as a stall', () => {
  assert.match(BENCH, /end: res\.end/);
  assert.match(BENCH, /det: detMode/, 'rows must say whether the clock was deterministic');
  assert.match(BENCH, /ticks: ticksAtStop/, 'the tick count must be snapshotted at the cut');
});

test('the paired runner keeps arms balanced and drops incomplete pairs', () => {
  assert.match(AB, /dropping the pair \(never one arm alone\)/);
  assert.match(AB, /ONE ARM PRODUCED NOTHING/);
  assert.match(AB, /REQUESTED OPTIONS WERE OVERRIDDEN/);
});

test('det mode never accumulates the clock from real frame time', () => {
  const detBlock = CORE.slice(CORE.indexOf('if (det) {'), CORE.indexOf('if (speed === 1)'));
  assert.ok(detBlock.length > 0, 'det branch must exist');
  assert.doesNotMatch(detBlock, /acc \+= dt/, 'det must not accumulate from real dt');
  // virt is derived inside fireTick, not in the pump branch: the pump calls
  // fireTick a fixed number of times and fireTick owns the clock.
  const tickBody = CORE.slice(CORE.indexOf('function fireTick()'), CORE.indexOf('function ensurePump'));
  assert.match(tickBody, /virt = \(tickN - detBase\) \* VIRT_DT/,
    'virt must be the tick ordinal relative to the run start');
  assert.doesNotMatch(detBlock, /virt = \(tickN \+ 1\) \* VIRT_DT/,
    'the pump must not re-assign an absolute virt and undo the normalisation');
});

test('the endless entry is not disabled by its own guard', () => {
  // startEndless() returns immediately when G.endless is already set, so the
  // boost save must not preset it.
  const lines = BENCH.split('\n');
  const saveBlock = lines.slice(0, 200).join('\n');
  assert.doesNotMatch(saveBlock, /endless: \(b && b\.endless\) \|\| 0/,
    'presetting endless in the save makes startEndless a no-op');
  assert.match(BENCH, /gg\.state === 'play' && gg\.p/, 'must wait for play before entering endless');
});
