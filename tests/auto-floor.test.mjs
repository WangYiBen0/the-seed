// Floor-aware spacing.  enemies.js scales hp by 1 + fi*0.55 + fi^2*0.12 and
// attack rate by 12% per floor, but the autopilot's spacing band was identical on
// every floor — the only per-floor state was a hp-gate timer.  That is the
// mechanism behind "第一层基本稳定，第二层很吃力".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AUTO = readFileSync(join(ROOT, 'site', 'tools', 'auto.js'), 'utf8');
const ENEMIES = readFileSync(join(ROOT, 'site', 'js', 'enemies.js'), 'utf8');

test('the game really does scale enemies per floor', () => {
  assert.match(ENEMIES, /1 \+ fi \* \.55 \+ fi \* fi \* \.12/, 'hp scaling must still exist');
  assert.match(ENEMIES, /statFloor\(\) \* \.12/, 'attack-rate scaling must still exist');
});

test('floorScaling is a declared option, so --opt cannot silently no-op', () => {
  assert.match(AUTO, /floorScaling: TSW\.settings\.get\('autoFloorScaling', true\)/,
    'the setting must be declared in opts or A/B arms become identical');
});

test('the band actually widens with floor', () => {
  assert.match(AUTO, /const floorK = /, 'the multiplier must exist');
  assert.match(AUTO, /\* \.08/, 'deeper floors must widen the band');
  assert.match(AUTO, /const bs = \(hard\(\) \? 1\.2 : 1\) \* floorK/, 'floorK must feed the band');
  assert.match(AUTO, /A\.opts\.floorScaling !== false/, 'it must be switchable for A/B');
});
