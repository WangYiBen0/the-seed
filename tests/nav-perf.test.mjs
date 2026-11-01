// Performance and correctness of the level-1 path search.
// gridPath used q.shift() (O(n) per dequeue) and called hazardAt (which walks
// G.foeFx and G.zones) once per visited cell.  Both are per-frame costs at speed
// 8, which is what "性能模式+画质最低 x8 倍速还是会卡顿" pointed at.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AUTO = readFileSync(join(ROOT, 'site', 'tools', 'auto.js'), 'utf8');

test('the tile BFS dequeues in O(1)', () => {
  assert.ok(!/while \(q\.length\) \{\s*const cur = q\.shift\(\)/.test(AUTO),
    'gridPath must not shift() a growing array');
  assert.match(AUTO, /let qh = 0;/, 'an index cursor replaces shift()');
});

test('the BFS kees the direct hazard probe: a per-search Map was measured SLOWER', () => {
  // A per-search hazard cache was tried and reverted.  Measured in the same
  // conditions (seed 7, speed 8, 120 s wall): direct probe 3.00x realtime, cached
  // 1.98x.  The search revisits too few cells for the Map to pay for itself, so
  // this asserts we did NOT reintroduce it.
  assert.ok(!/const hazardFreeCached/.test(AUTO), 'the cache was measured slower and must stay out');
  assert.match(AUTO, /const okT = \(gx, gy\) => walkable\(gx, gy\) && \(A\._plainPath === true \|\| hazardFree\(gx, gy\)\)/,
    'the direct probe must remain');
});
