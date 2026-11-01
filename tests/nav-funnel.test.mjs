// The door-funnel limit cycle.  A constant 0.9 pull toward the nearest door
// fought the band's push away from the enemy to a standstill: 45 s, 27 direction
// reversals inside an 81 px span, the nearest enemy frozen at 149 px the whole
// time, and 149 noRoute failures in one run.  A give-up timer must exist and it
// must reset per room.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AUTO = readFileSync(join(ROOT, 'site', 'tools', 'auto.js'), 'utf8');

test('the door funnel gives up once it has stopped helping', () => {
  const stuck = AUTO.split('\n').find((l) => l.includes('funnelStuck')) || '';
  assert.match(stuck, /const funnelStuck =/, 'the give-up timer is missing');
  assert.match(stuck, /> 12/, 'the funnel must stop pulling after a bounded time');
  const gate = AUTO.split('\n').find((l) => l.includes("bdd > 26 && bdd < 220")) || '';
  assert.match(gate, /&& !funnelStuck/, 'the stuck check must gate the pull, not just a log line');
});

test('the funnel timer resets per room', () => {
  const reset = AUTO.split('\n').find((l) => l.includes('_funnelRoom !== aid')) || '';
  assert.match(reset, /_funnelRoom = aid/, 'the reset must key on the room');
  assert.match(reset, /_funnelT = 0/, 'the reset must clear the timer');
  assert.match(AUTO, /const aid = active \? active\.id : -1/, 'the room identity must exist');
});
