// The endgame objective needs its own numbers, otherwise only "how far did it
// get" is measured. Each term is recorded separately so the composite is auditable.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BENCH = readFileSync(join(ROOT, 'site', 'tools', 'bench.js'), 'utf8');
const AUTO = readFileSync(join(ROOT, 'site', 'tools', 'auto.js'), 'utf8');

test('the endless endgame is measured term by term', () => {
  assert.match(BENCH, /hpLostTotal:/, 'damage-free must be recorded (0 hp lost)');
  assert.match(BENCH, /pickups:/, 'serum count is the 满增益 half');
  assert.match(BENCH, /mods5:/, 'all-five-modifiers must be recorded');
  assert.match(BENCH, /depth: g\.endless \| 0/, 'endless depth must be recorded');
});

test('a run that never lost hp is distinguishable from one that did', () => {
  assert.match(BENCH, /Math\.max\(0, \(x\.hp \|\| 0\) - \(x\.php === undefined \? x\.hp : x\.php\)\)/);
});

test('camp-fire dialogue is driven, not left to freeze the run', () => {
  assert.ok(AUTO.includes("case 'talk': return driveTalk"), 'G.state=talk must have a handler');
  const i = AUTO.indexOf('function driveTalk');
  const blk = AUTO.slice(i, i + 700);
  assert.ok(blk.includes('Enter'), 'lines must be advanced');
  assert.ok(blk.includes('Escape'), 'recruiting is the Escape action');
});

test('the shop buys serums before weapons and demands a margin to replace', () => {
  const a = AUTO.indexOf("it.kind === 'shop'");
  const b = AUTO.indexOf("it.kind === 'portal'");
  const shop = AUTO.slice(a, b);
  const shardAt = shop.indexOf("it.what === 'shard'");
  const weaponAt = shop.indexOf("it.what === 'weapon'");
  assert.ok(shardAt > 0 && weaponAt > 0, 'both branches must exist');
  assert.ok(shardAt < weaponAt, 'serums must be considered before weapons');
  assert.match(shop, /const required = room \? 1 : 1\.6/, 'replacing a drawn weapon needs a clear margin');
});
