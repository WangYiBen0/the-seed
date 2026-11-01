// The "unreachable straggler" deadlock, measured on seed 1 of the five-lock
// baseline: 1598 game-seconds spent in combat, 690 s with the trigger up,
// dryNotFiring 690, a single foe pinned at 77-82 px for the whole floor, and
// 1 room cleared out of 11.
//
// Cause chain:
//   neF = nearestEnemy(..., needLos=true)  -> null, because a wall blocks the line
//   active && !neF                         -> hunt branch
//   hunt branch                            -> sets mx/my (walk) and NOTHING else
//   every tick                            -> neF still null, hunt forever
// The room can only clear by damaging that foe, so walking without firing can
// never terminate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AUTO = readFileSync(join(ROOT, 'site', 'tools', 'auto.js'), 'utf8');

test('hunting a straggler also fires at it', () => {
  assert.match(AUTO, /A\._huntAim = anyFoe;/, 'the hunt must keep the target');
  assert.match(AUTO, /if \(!wantFire && A\._huntAim\)/, 'the hunt must override the no-fire decision');
  // and it must aim, or the shot goes wherever the last target was
  const blk = AUTO.slice(AUTO.indexOf('if (!wantFire && A._huntAim)'), AUTO.indexOf('if (!wantFire && A._huntAim)') + 320);
  assert.match(blk, /Input\.mx = clampM\(ax - G\.cam\.x/, 'the hunt shot must be aimed at the straggler');
  assert.match(blk, /wantFire = true/, 'the override must actually enable firing');
});

test('the hunt aim is dropped when the foe is gone or visible', () => {
  assert.match(AUTO, /A\._hunt = 0; A\._huntAim = null;/, 'a visible foe ends the hunt');
  assert.match(AUTO, /A\._huntAim\.dead \|\| A\._huntAim\.spawnT > 0/, 'a stale target is cleared');
});
