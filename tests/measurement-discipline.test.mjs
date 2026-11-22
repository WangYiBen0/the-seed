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
  assert.match(AUTO, /combatDashAt: 1\.8/, 'the combat dash threshold must be declared, not hardcoded');
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
  assert.match(AUTO, /overlap: 0[,\s}]/, 'the metric must be declared in A.metrics');
  assert.match(AUTO, /m\.overlap = 0/, 'the metric must be cleared by metrics.reset()');
  assert.match(BENCH, /fightState:/, 'rows must record which fight state the bot was in');
  // Death attribution: installHurtLog ran for fullrun and invade only, so the dodge
  // rig recorded no cause for any of its deaths.  Every hit must be attributable.
  const dodge = BENCH.slice(BENCH.indexOf('async function runDodgeOne'));
  assert.match(dodge, /installHurtLog\(\)/, 'the dodge path must install death attribution');
  assert.match(BENCH, /nearDistMin:/, 'rows must record how close the nearest enemy was');
  assert.match(BENCH, /hitsDashReady:/, 'rows must record whether a dash was available');
});

test('the reload swap is not vetoed by the main-hand rule', () => {
  // Regression the user reported: "换弹时不会自动换武器以持续输出".  The swap
  // condition had become `(!keepBest || othDps >= curDps)` with keepBest true by
  // default, so holding the BEST gun - exactly what mainHandBest is for -
  // disabled the swap and every reload was spent not firing.
  assert.match(AUTO, /if \(curBusy && othReady\) \{ tap\('KeyX'\)/,
    'a busy (reloading) gun must swap to any ready one, regardless of DPS');
  assert.doesNotMatch(AUTO, /curBusy && othReady && \(!keepBest/,
    'the DPS veto on reload swapping must not come back');
  // and it must be observable in the rows
  assert.match(AUTO, /reloadSwap = \(A\.metrics\.reloadSwap \| 0\) \+ 1|metrics\.reloadSwap/,
    'reload swaps must be counted');
});

test('blind fire is limited to weapons that can actually cross geometry', () => {
  // Reported: "墙挡住的时候仍然浪费弹药（投掷物和能穿墙的武器除外）".
  // The hunt path fired unconditionally at a wall-blocked foe.
  assert.match(AUTO, /const blindOK = wPierce >= 999/,
    'wall-crossing must be decided by the weapon, not assumed');
  assert.match(AUTO, /if \(A\._blindOK\) \{/,
    'blind fire at a blocked foe must be gated on blindOK');
  assert.match(AUTO, /'lob', 'mine', 'orb', 'nova', 'slam'/,
    'arcing / thrown kinds must be allowed to fire without sight');
  assert.match(AUTO, /blindBlocked/,
    'rounds saved must be countable so the fix is verifiable');
});

test('a disabled room option stops the bot pathing there', () => {
  // Reported: "把选项关掉了也会向这种房间寻路".  The interact handlers checked
  // the options but roomWeight never did, so the room still scored as a target.
  assert.match(AUTO, /function roomDisabled\(r\)/, 'room weight must consult the options');
  assert.match(AUTO, /case 'shop': return A\.opts\.shop === false/,
    'the shop must be excluded when switched off');
  assert.match(AUTO, /case 'forge': return A\.opts\.forge === false/,
    'the forge must be excluded when switched off');
  assert.match(AUTO, /if \(roomDisabled\(r\)\) return 99/,
    'a disabled room must be deprioritised in the weight');
  // the dedicated forge branches run before the weight sweep, so they need their own gate
  assert.match(AUTO, /A\.opts\.forgeFirst !== false && A\.opts\.forge !== false/,
    'the forge-first branch must respect opts.forge');
});

test('the stuck-wiggle cannot spin in place', () => {
  // Reported: "仍然会在某些地方打转".  The wiggle picked a fresh random angle on
  // every retry, which reads as spinning; it now sweeps a persistent direction.
  assert.match(AUTO, /const a0 = Math\.atan2\(wiggle\.dir\[1\], wiggle\.dir\[0\]\) \+ 0\.96/,
    'a retry must rotate from the previous direction, not re-roll it');
  assert.match(AUTO, /if \(!wiggle\.dir\) \{/, 'the first pick must be stored and reused');
});

test('the detail dropdown can always be closed', () => {
  // Reported: "细则选项菜单很难关掉".  The only exit was a document click
  // listener that stopPropagation could swallow, and there was no Escape.
  const PANEL = readFileSync(join(ROOT, 'site', 'tools', 'panel.js'), 'utf8');
  assert.match(PANEL, /\}, true\);\s*\n\s*try \{/, 'the outside-click listener must use capture');
  assert.match(PANEL, /ev\.key !== 'Escape'/, 'Escape must close the dropdown');
  assert.match(PANEL, /x\.textContent = '关闭'/, 'the dropdown needs a visible close button');
  assert.match(PANEL, /panelBox\.__header\) panelBox\.insertBefore/,
    'the close bar must be restored after every rebuild');
});

test('no option key is declared twice in A.opts', () => {
  // A duplicate key silently overrides the earlier one: this happened when a new
  // `dodgeDashAt: 1.8` was added while `dodgeDashAt: TSW.settings.get(..., 99)`
  // already existed further down, so the real default became 99 (off) and the
  // option under test did nothing.  Object literals do not warn.  Scan the opts
  // block and fail on any repeated key.
  const start = AUTO.indexOf('opts: {');
  const opts = AUTO.slice(start, AUTO.indexOf('metrics: {', start));
  const seen = new Map();
  for (const m of opts.matchAll(/^\s{6}([A-Za-z_$][\w$]*):/gm)) {
    const k = m[1];
    seen.set(k, (seen.get(k) || 0) + 1);
  }
  const dupes = [...seen.entries()].filter(([, n]) => n > 1).map(([k, n]) => k + ' x' + n);
  assert.deepEqual(dupes, [], 'duplicate A.opts keys silently override each other: ' + dupes.join(', '));
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

// ---------------------------------------------------------------------------
// Two reported regressions the suite did not cover at all:
//   1. "零号样本一阶段打完后仍然不会去触发二阶段"
//   2. "仍然可能出现冲刺掉下虚空的情况"
// Both were pure logic holes, so they are guarded structurally here.
// ---------------------------------------------------------------------------

test('a boss room holding only a wreck is not treated as an active fight', () => {
  // game.js:240 clears the boss room only when G.bossDead is set, but ABSENCE's
  // phase-1 death goes through absenceFall(), which never sets it. The room then
  // stayed r.active = true with just the wreck inside, and both the interaction
  // branch and the navigation branch are gated on !active - so the bot never
  // walked to the remains and never pressed E to reassemble.
  assert.match(AUTO, /const wreckWaiting = /, 'the wreck-waiting state must be detected');
  assert.match(AUTO, /r\.active && !\(wreckWaiting && r\.type === 'boss'\)/,
    'an active boss room whose wreck is waiting must not suppress navigation');
  assert.match(AUTO, /it\.kind === 'wreck' && A\.opts\.bossWreck !== false && G\.wreck/,
    'the wreck must be selectable as an objective');
  assert.match(AUTO, /label: 'wreck'/, 'the wreck objective must be labelled');
});

test('every dash sets its direction from the keys and re-validates the real vector', () => {
  // game.js:146 derives p.dx/p.dy from the KEY vector, so pressing Space without
  // setting the keys first dashes along whatever the walking code left there.
  // Two separate holes put the bot into the void:
  //   (a) moveKeys() ran after the dash block and overwrote the dash keys;
  //   (b) the dodge path poked p.dashT by hand, which re-used the PREVIOUS dash's
  //       p.dx/p.dy because nothing recomputed them.
  assert.match(AUTO, /function dashToward\(p, dx, dy\)/, 'a dash helper must exist');
  // The keys are 8-way, so an arbitrary angle gets quantised by up to 22.5 deg and
  // can land in a wall. The helper must therefore choose among the directions the
  // keys can ACTUALLY produce and require that one to be safe. Vetoing the exact
  // requested arc instead rejected every dash on a pillared floor (measured
  // dashVeto 10 / dash 0: the bot never dashed at all).
  assert.match(AUTO, /const ea = Math\.atan2\(c\[1\], c\[0]\) \+ rev \+ jit;/,
    'the helper must model the direction each key combo really produces');
  assert.match(AUTO, /if \(!dashSafe\(p, c\.ex, c\.ey\)\) \{ A\.metrics\.dashVeto/,
    'each candidate must be validated with dashSafe before it can be chosen');
  assert.match(AUTO, /if \(!best\) \{ A\.metrics\.dashUnsafe/,
    'an unavoidable unsafe dash must be counted, not silently taken');
  assert.match(AUTO, /A\._dashWant = \[best\.ex, best\.ey\]/,
    'the validated dash vector must survive the end-of-tick moveKeys');
  assert.match(AUTO, /if \(A\._dashWant\) \{ moveKeys\(A\._dashWant\[0\], A\._dashWant\[1\]\); A\._dashWant = null; \}/,
    'the dash vector must be restored after the walk vector is applied');
  assert.doesNotMatch(AUTO, /p\.dashT = 0\.12;/,
    'setting p.dashT by hand re-uses a stale dash vector and must not come back');
  // NO dash may press Space outside the helper. tap() is a const inside drive(),
  // so a module-scope call to it throws ReferenceError - swallowed by the
  // beforeTick try/catch, which is why dashCall/dashEscape counted while the dash
  // counter after the call stayed 0 forever (measured escape 29 / dash 0).
  const rawDashes = [...AUTO.matchAll(/tap\('Space'\)/g)].length;
  assert.equal(rawDashes, 0, 'Space must never be pressed outside dashToward, found ' + rawDashes);
  const helperDashes = [...AUTO.matchAll(/dashToward\(/g)].length;
  assert.ok(helperDashes >= 6, 'every dash site must route through the helper, got ' + helperDashes);
  assert.doesNotMatch(AUTO, /A\.metrics\.dash\+\+/, 'the raw dash counter must not bypass the helper');
  assert.match(AUTO, /Input\.keys\.Space = true; A\._taps\.Space = 1/, 'the helper must press Space itself');
  assert.match(AUTO, /dashVeto:/, 'vetoed dashes must be counted');
  assert.match(AUTO, /dashUnsafe:/, 'unavoidably-unsafe dashes must be counted');
  assert.match(AUTO, /dashEscape:/, 'relative-bar escape dashes must be counted');
});

test('the real-floor dodge bench forces explore, not just G.mode', () => {
  // Reported 2026-11-22: pressing 躲弹幕测评 straight from 突入探索 teleported the
  // player to a dead 入侵抵抗 room with no enemies.
  //
  // Two separate mode switches exist:
  //   RUN_MODE (invade.js:5) = 'the mode the next new run starts in'.  enterFloor is
  //     wrapped so RUN_MODE==='invade' returns ivBegin() and NEVER builds the explore
  //     floor (invade.js:192); sortie() sets it from the 突入探索 camp (invade.js:370).
  //   G.mode                = the CURRENT run's mode; ivBegin sets it, only enterFloor
  //     restores it.
  // Relaunching the run with RUN_MODE still 'invade' therefore rebuilds an empty
  // arena, ivBegin clears every enemy list, and nothing respawns.  Forcing only
  // G.mode is too late - the floor was already replaced.
  assert.match(BENCH, /const forceExplore = \(\) => \{/,
    'the bench must have one place that forces explore mode');
  assert.match(BENCH, /if \(typeof RUN_MODE !== 'undefined'\) RUN_MODE = 'explore';/,
    'RUN_MODE must be reset, not only G.mode');
  assert.match(BENCH, /__achroma\.G\.mode = 'explore';/,
    'G.mode must be reset as well');
  const at = BENCH.indexOf('const forceExplore = () => {');
  assert.ok(at > 0, 'forceExplore must exist');
  const launch = BENCH.indexOf('startRunWith({', at);
  assert.ok(launch > at, 'startRunWith must follow the helper');
  assert.ok(BENCH.slice(at, launch).includes('forceExplore();'),
    'forceExplore() must run before the relaunch');
  assert.ok(BENCH.slice(launch, launch + 400).includes('forceExplore();'),
    'forceExplore() must run again after the relaunch');
});
