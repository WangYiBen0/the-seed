// Objective selection regressions, all reported by the player.
//
// 1. A reward room is born cleared (world.js:75), so a blanket `cleared -> 99`
//    rule made chests/forges/shops permanently unselectable: they were only ever
//    used when walked past.  `frozenS` and boss-entry both rose once fixed.
// 2. The fount was routed to with hp + 2 >= maxHp but used only when
//    hp < maxHp - 1; at hp = maxHp - 2 the bot walked there, refused the key and
//    walked back.  Both must share one predicate.
// 3. Distance as a tie-break only sent the bot past a nearby key to a distant
//    serum; it belongs in the score.
// 4. The four master switches never called TSW.settings.set, so they were the one
//    group that did not survive a reload.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AUTO = readFileSync(join(ROOT, 'site', 'tools', 'auto.js'), 'utf8');
const PANEL = readFileSync(join(ROOT, 'site', 'tools', 'panel.js'), 'utf8');

test('unvisited reward rooms are real objectives', () => {
  assert.match(AUTO, /r\.cleared && !r\.visited && REWARD_ROOMS\.includes\(r\.type\)\) return 1/,
    'reward rooms must outrank combat');
});

test('the key room outranks reward rooms', () => {
  const w = AUTO.slice(AUTO.indexOf('function roomWeight'), AUTO.indexOf('function floorNeedsClear'));
  const keyAt = w.indexOf('if (r.key) return 0;');
  const rewardAt = w.indexOf('REWARD_ROOMS.includes(r.type)) return 1');
  assert.ok(keyAt > 0 && rewardAt > 0, 'both branches must exist');
  assert.ok(keyAt < rewardAt, 'the key must be decided before the reward branch');
});

test('fount routing and fount interaction share one predicate', () => {
  // the interaction branch is the one that taps the key
  const lines = AUTO.split('\n');
  const at = lines.findIndex((l, i) => l.includes("it.kind === 'fount'") && lines.slice(i, i + 3).some((x) => x.includes("tap('KeyE')")));
  assert.ok(at > 0, 'the fount interaction branch must exist');
  const interact = lines.slice(at, at + 3).join(' ');
  assert.match(interact, /p\.hp \+ 2 >= p\.maxHp/, 'the interaction must use the same rule as routing');
  assert.match(interact, /p\.hp < p\.maxHp/, 'and must not fire at full hp');
});

test('distance is folded into the room score', () => {
  assert.match(AUTO, /const w = base \+ Math\.min\(1\.5, d \/ 420\)/,
    'distance must be a bounded cost on top of the weight');
});

test('every master switch persists to settings', () => {
  const block = PANEL.slice(PANEL.indexOf('const mainOpt'), PANEL.indexOf('const setOpt'));
  assert.match(block, /TSW\.settings\.set\(sk, v\)/, 'master switches must write through settings');
  for (const k of ['autoCards', 'autoRestart', 'preferEndless', 'shop']) {
    assert.ok(new RegExp("mainOpt\\([^)]*'" + k + "'").test(block) || new RegExp("'autoShop'").test(block),
      k + ' must be covered by mainOpt');
  }
});

test('master switches default off, side-effect-free items default on', () => {
  assert.match(AUTO, /autoCards: TSW\.settings\.get\('autoCards', false\)/);
  assert.match(AUTO, /autoRestart: TSW\.settings\.get\('autoRestart', false\)/);
  assert.match(AUTO, /dash: TSW\.settings\.get\('autoDash', false\)/);
  assert.match(AUTO, /labSerum: TSW\.settings\.get\('autoLabSerum', false\)/, 'alpha costs max hp');
  assert.match(AUTO, /chest: TSW\.settings\.get\('autoChest', true\)/, 'chests are free');
});
