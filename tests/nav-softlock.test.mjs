// Soft-lock detector: the row summary hides a run that parked in place while
// the clock ran.  Three real instances were found (40.0 s, 44.0 s and 39.7 s
// with an x-span of 0 px, no foes, and an empty status note), so this is a
// metric the bench should report rather than something to grep by hand.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = readFileSync(join(ROOT, 'site', 'tools', 'bench.js'), 'utf8');

test('the black box records what autopilot was walking at', () => {
  // without a target a frozen player cannot be attributed: the note is empty
  // whenever no special objective owns the tick, which is the soft-lock case
  assert.match(SRC, /tgt: \(window\.__TSW && TSW\.auto && TSW\.auto\.status && TSW\.auto\.status\.target\)/);
  assert.match(SRC, /ring\.slice\(-45\)/, 'the ring must keep enough samples to see a 40 s freeze');
});

test('a goal inside the 12 px dead zone still gets a movement command', () => {
  const auto = readFileSync(join(ROOT, 'site', 'tools', 'auto.js'), 'utf8');
  assert.match(auto, /dl <= 12 && !clear && wp/, 'the close-but-walled case must route to the waypoint');
  // and it must actually issue a movement command, not just set a note
  assert.match(auto, /wl > 8\) \{ \[mx, my\] = pickDir\(p, wp\[0\] - p\.x, wp\[1\] - p\.y\);/,
    'the dead zone must call pickDir toward the waypoint');
});

test('the row reports how long the player was frozen', () => {
  assert.match(SRC, /frozenS: \(function \(\) \{/, 'the freeze metric must be in the result row');
  assert.match(SRC, /ring\.slice\(-45\)/, 'the metric needs the ring long enough to see a 40 s freeze');
});

test('a benched room is not immediately re-picked', () => {
  const auto = readFileSync(join(ROOT, 'site', 'tools', 'auto.js'), 'utf8');
  assert.match(auto, /A\._skipRoom\[tgt\.room\.id\] && G\.time < A\._skipRoom\[tgt\.room\.id\]/,
    'the re-pick must respect _skipRoom, not only the pixel dead list');
});
