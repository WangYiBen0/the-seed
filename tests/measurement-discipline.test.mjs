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
const AUTO = readFileSync(join(ROOT, 'site', 'tools', 'auto.js'), 'utf8');

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

test('rows record whether the behaviour under test actually fired', () => {
  // An A/B of the forge switch compared two configurations that BOTH never
  // reached a forge: forgeRoomsSeen stayed 0 in every row (benchmark.md 262).
  // Without a field like this there is no way to tell "the feature is useless"
  // from "the feature never ran".
  assert.match(BENCH, /forgeRoomsSeen/, 'rows must record forge visits');
  assert.match(BENCH, /upgradesDone/, 'rows must record forge upgrades');
  assert.match(BENCH, /waveCount/, 'rows must record how many waves actually spawned');
  assert.match(BENCH, /tCombat/, 'rows must split combat from travel and idle');
});

test('the summoner and pickup switches stay declared so they can be A/B-ed', () => {
  // A patch that adds a branch but never declares the option in A.opts makes the
  // experiment silently identical on both arms.
  const decl = AUTO.slice(AUTO.indexOf('const opts'), AUTO.indexOf('const opts') + 4000) || AUTO;
  assert.match(AUTO, /summonerFirst:/);
  assert.match(AUTO, /pickupLeap:/);
  assert.match(AUTO, /focusFire:/);
});

test('combat options are declared, and the roomless guard is switchable', () => {
  // The whole combat/kite block was gated on `active || G.trial || near`, where
  // `active` is the current ROOM.  In a roomless arena all three are falsy, so none
  // of that logic ran and the bot stood in the barrage.  The widened guard must stay
  // declared so it can be A/B-ed, and its neutrality in explore mode was verified
  // (0/3 seeds differed) rather than assumed.
  assert.match(AUTO, /roomlessCombat: true/, 'the widened guard must be a declared option');
  assert.match(AUTO, /A\.opts\.roomlessCombat !== false && foes\.length/,
    'the guard must consult the option so it can be switched off');
  assert.match(AUTO, /overlapEscape: true/, 'overlap escape must be declared');
  assert.match(AUTO, /dodgeDashAt: 1\.8/, 'the dash threshold must be declared, not hardcoded');
  // The overlap escape has to live OUTSIDE the room guard, or it never runs in an
  // arena: it was written inside it first and reported overlapTicks 0 on both arms.
  const guardAt = AUTO.indexOf('roomlessCombat !== false && foes.length');
  const escapeAt = AUTO.indexOf('A._overlapDir = overlapPush');
  assert.ok(guardAt > 0 && escapeAt > guardAt,
    'the overlap escape must be defined after the combat guard so it always runs');
  assert.match(AUTO, /if \(A\._overlapDir\) \{ mx = A\._overlapDir\[0\]/,
    'the escape direction must actually be applied to the steering');
});

test('dodge rows prove the combat path and the overlap escape ran', () => {
  // The overlap A/B reported a 3/4 seed win while overlapTicks was 0 on BOTH arms:
  // the branch never executed, so the win was noise.  A guard needs a row field,
  // not just an option.
  assert.match(BENCH, /overlapTicks: A\.overlap/, 'rows must record overlap-escape ticks');
  assert.match(AUTO, /overlap: 0 \}/, 'the metric must be declared in A.metrics');
  assert.match(AUTO, /m\.overlap = 0/, 'the metric must be cleared by metrics.reset()');
  assert.match(BENCH, /fightState:/, 'rows must record which fight state the bot was in');
  // Death attribution: installHurtLog ran for fullrun and invade only, so the dodge
  // rig recorded no cause for any of its deaths.  Every hit must be attributable.
  const dodge = BENCH.slice(BENCH.indexOf('async function runDodgeOne'));
  assert.match(dodge, /installHurtLog\(\)/, 'the dodge path must install death attribution');
  assert.match(BENCH, /nearDistMin:/, 'rows must record how close the nearest enemy was');
  assert.match(BENCH, /hitsDashReady:/, 'rows must record whether a dash was available');
});

test('the in-run learner is declared, evidenced, and ablatable', () => {
  // The first smoke run of the learn A/B reported autoOptsUnknown: ["learn"] —
  // the learner controls live on TSW.auto.learn, not A.opts, so the generic
  // "is this key in TSW.auto.opts" check voided the experiment.  A real runAB
  // would have thrown REQUESTED OPTIONS WERE OVERRIDDEN, but the dodge bench on
  // its own just quietly measured the same arm twice.
  assert.match(BENCH, /LEARN_KEYS/, 'learner keys must be declared explicitly');
  for (const k of ['learn', 'noLearn', 'learnRate', 'keepLearn']) {
    assert.ok(BENCH.includes("'" + k + "'"), 'learner key ' + k + ' must be declared');
  }
  // Rows must prove the learner ran: an option being set is not evidence.
  assert.match(BENCH, /learnUpdates/, 'rows must record how many updates were applied');
  assert.match(BENCH, /learnGenes/, 'rows must record the genome it converged to');
  assert.match(BENCH, /learnFrozen/, 'rows must say whether the ablation arm was used');
  // The learner itself must be off by default and must be reachable from the panel.
  assert.match(AUTO, /A\.learn = \{/, 'the learner object must exist');
  assert.match(AUTO, /on: TSW\.settings\.get\('autoLearn', false\)/, 'learning must default OFF');
  assert.match(AUTO, /A\.learn\.reset = /, 'the learner must be resettable to a clean baseline');
  const PANEL = readFileSync(join(ROOT, 'site', 'tools', 'panel.js'), 'utf8');
  assert.match(PANEL, /TSW\.auto\.learn\.set\('on'/, 'the panel must expose the learner switch');
  assert.match(PANEL, /TSW\.auto\.learn\.reset\(true\)/, 'the panel must expose a reset control');
});

test('dodge rows carry a metric with resolution, not just a floor', () => {
  // 36 dodge rows showed that hpLeft is 0 for essentially every configuration: the
  // runs die at 19-37s, long before the 45s cut, so an A/B judged on hpLeft is an
  // A/B judged on a constant. The quantity that actually varies is survival time.
  assert.match(BENCH, /survivedTicks/, 'dodge rows must record ticks survived');
  assert.match(BENCH, /survivedS/, 'dodge rows must record seconds survived');
  assert.match(BENCH, /diedAtTick/, 'dodge rows must record when death happened');
  assert.match(BENCH, /deathTick = -1/, 'the survival clock must be tracked as it happens');
  // The clock must be updated in the tick hook, and must stop once the player is
  // dead — otherwise every run would read the full duration and look identical.
  assert.match(BENCH, /if \(deathTick < 0\) \{ if \(g\.state === 'dead'/,
    'the survival clock must freeze at the death tick');
});

test('hitsMetric is bound to a counter the dodge bench actually populates', () => {
  // hitsMetric read M.hitsTaken, the counter owned by hud.js:34. The dodge bench
  // never loads the HUD, so the field was 0 in all 131 recorded rows while the
  // bench's own wrapper counted correctly. Bind it to the bench's counter.
  assert.match(BENCH, /hitsMetric: localHits \| 0/,
    'hitsMetric must read the bench-local hit counter');
  assert.doesNotMatch(BENCH, /hitsMetric: M\.hitsTaken/,
    'hitsMetric must not read the HUD-owned counter again');
  assert.match(BENCH, /hitsMetricHud: M\.hitsTaken \| 0/,
    'the old value must stay visible in the row for the record');
});

test('the measurement log keeps every recorded section', () => {
  // The log grew past 13000 lines and a single whole-file rewrite silently cut it
  // to 1093 (benchmark.md), because the rewrite was based on a partial read. Every
  // recorded section number must still be present and the file must keep its size.
  const LOG = readFileSync(join(ROOT, 'docs', 'benchmark.md'), 'utf8');
  const lines = LOG.split('\n');
  assert.ok(lines.length > 10000, 'the log must not shrink below its recorded size, got ' + lines.length);
  const sections = [...LOG.matchAll(/^### (\d+)\./gm)].map((m) => +m[1]);
  // 119 numbered sections and ~1400 "###" headings at the time of writing; guard
  // against a rewrite that drops the numbered narrative.
  assert.ok(sections.length >= 119, 'numbered sections went missing, got ' + sections.length);
  const headings = LOG.split('\n').filter((l) => l.startsWith('### ')).length;
  assert.ok(headings >= 1388, '### headings went missing, got ' + headings);
  // section numbers must be non-decreasing: a rewrite that reorders or drops them is suspicious
  for (let i = 1; i < sections.length; i++) {
    assert.ok(sections[i] >= sections[i - 1], 'sections went backwards at ' + sections[i - 1] + ' -> ' + sections[i]);
  }
});
