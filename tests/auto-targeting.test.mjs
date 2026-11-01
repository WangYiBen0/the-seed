// Enemy targeting priority, per the user's read of the game: shoot the ones that
// shoot you (gunner/sniper/mortar/turret/bomber/wisp/echo) and the ones that keep
// the room alive (splitter/warden) BEFORE contact melee.
//
// The important constraint: priority must only reorder WITHIN reach. A crawler on
// top of the player still wins over a mortar across the room, because the cutoff
// stays real distance.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AUTO = readFileSync(join(ROOT, 'site', 'tools', 'auto.js'), 'utf8');

test('fire and support types outrank contact melee', () => {
  assert.match(AUTO, /const FIRE_TYPES = \[.*gunner/, 'fire types must be listed');
  assert.match(AUTO, /const SUPPORT_TYPES = \[.*splitter/, 'support types must be listed');
  assert.match(AUTO, /if \(SUPPORT_TYPES.includes\(t\)\) return 1\.35/, 'spawners rank highest');
  assert.match(AUTO, /if \(FIRE_TYPES.includes\(t\)\) return 1\.2/, 'shooters rank next');
});

test('priority never invents reach', () => {
  const blk = AUTO.slice(AUTO.indexOf('function nearestEnemy'), AUTO.indexOf('function nearestEnemy') + 700);
  assert.match(blk, /if \(d >= maxD\) continue;/, 'the real distance cutoff must stay');
  assert.match(blk, /const rank = d \/ foePriority\(e\);/, 'ranking must divide by priority');
});

test('the ordering is switchable, so it can be A/B compared', () => {
  assert.match(AUTO, /targetPriority: TSW\.settings\.get\('autoTargetPriority', true\)/,
    'the setting must be declared or --opt silently no-ops');
  assert.match(AUTO, /A\.opts && A\.opts\.targetPriority === false\) return 1/,
    'off must fall back to pure distance');
});
