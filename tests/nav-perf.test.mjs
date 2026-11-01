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

test('hazard lookups inside the BFS are memoised', () => {
  assert.match(AUTO, /const hazardFreeCached = /, 'the per-cell hazard probe must be cached');
  assert.match(AUTO, /hazardFreeCached\(gx, gy\)/, 'okT must use the cached probe');
});
