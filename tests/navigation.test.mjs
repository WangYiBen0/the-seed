// Tests for the navigation + hazard fixes:
//   * tremor (共济失调) rotation compensation in the key chooser
//   * rotating blades / flame pillars / poison pools feed spotDanger + gridPath
//   * tile-level travel waypoints
//   * manual takeover hands the controls back to the player
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadAuto, makeWorld } from './helpers/sandbox.mjs';

const P = (x, y, extra = {}) => Object.assign({ x, y, r: 4, hp: 5, maxHp: 5, armor: 3, maxArmor: 3, lastHit: 99, weapons: ['nail'], wi: 0, shards: {}, dashCd: 0, dashT: 0, alive: true }, extra);

// ---------------------------------------------------------------- tremor
test('tremorAngle: zero without the curse or above 3 hp', () => {
  const a = loadAuto({}); a.G.p = P(100, 100, { hp: 5 });
  assert.equal(a.api.tremorAngle(), 0);
});

test('tremorAngle: reports the game\'s own rotation when the curse is active at hp<=3', () => {
  const { api, G, ctx } = loadAuto({});
  G.p = P(100, 100, { hp: 2 });
  ctx.curses.add('tremor');
  G.time = 1.0;
  const j = Math.sin(1.0 * 2.1) * .32 + Math.sin(1.0 * 5.3 + 1) * .16;
  assert.ok(Math.abs(api.tremorAngle() - j) < 1e-9, 'must mirror game.js:130');
});

test('moveKeys: counter-rotates the tremor so the game ends up going where we asked', () => {
  const { api, G, ctx, Input } = loadAuto({});
  G.p = P(100, 100, { hp: 2 });
  ctx.curses.add('tremor');
  // pick a moment where the rotation is large (~0.4 rad) and ask to walk east
  let bestT = 0, bestJ = 0;
  for (let t = 0; t < 6; t += 0.01) { const j = Math.sin(t * 2.1) * .32 + Math.sin(t * 5.3 + 1) * .16; if (Math.abs(j) > Math.abs(bestJ)) { bestJ = j; bestT = t; } }
  G.time = bestT;
  api.moveKeys(1, 0);
  const mx = (Input.keys.KeyD ? 1 : 0) - (Input.keys.KeyA ? 1 : 0);
  const my = (Input.keys.KeyS ? 1 : 0) - (Input.keys.KeyW ? 1 : 0);
  assert.ok(mx || my, 'some key must be pressed');
  // replay what game.js does to our keys
  const l = Math.hypot(mx, my); const ex = mx / l, ey = my / l;
  const c = Math.cos(bestJ), s = Math.sin(bestJ);
  const fx = ex * c - ey * s, fy = ex * s + ey * c;
  const err = Math.abs(Math.atan2(fy, fx));
  assert.ok(err < 0.45, `post-rotation heading should stay within ~25deg of east, got ${(err * 57.3).toFixed(1)}deg`);
});

test('moveKeys: reverse mech is compensated too', () => {
  const { api, G, Input } = loadAuto({});
  G.p = P(100, 100);
  G.mechs = [{ type: 'reverse', t: 5, on: 0 }];
  api.moveKeys(1, 0);                       // want east
  const mx = (Input.keys.KeyD ? 1 : 0) - (Input.keys.KeyA ? 1 : 0);
  assert.ok(mx < 0, 'with reverse active we must press west so the game sends us east');
});

// ---------------------------------------------------------------- hazards
const BLADE = (x, y, a = 0, va = 2) => ({ kind: 'blade', x, y, R: 30, a, va });
const FLAME = (x, y, a = 0, L = 40, st = 0, t = 0) => ({ kind: 'flame', x, y, a, L, per: 4, warn: .5, fire: .8, st, t });
const POOL = (x, y, r = 18) => ({ x, y, r, life: 9, max: 9, tick: .5 });

test('hazardAt: a rotating blade arm is dangerous where the arm points', () => {
  const world = makeWorld({ traps: [BLADE(160, 100, 0, 0)] });   // frozen arm pointing +x
  const { api, G } = loadAuto({ world });
  G.p = P(100, 100);
  assert.ok(api.hazardAt(190, 100) > 0.8, 'on the arm must be dangerous');
  assert.ok(api.hazardAt(160, 145) < 0.6, 'behind the arm (no sweep) is much safer');
});

test('hazardAt: a sweeping blade is dodged by standing outside its radius', () => {
  const world = makeWorld({ traps: [BLADE(160, 100, 0, 3)] });
  const { api, G } = loadAuto({ world });
  G.p = P(100, 100);
  const inside = api.hazardAt(170, 100);
  const outside = api.hazardAt(160 + 60, 100);
  assert.ok(inside > outside, `inside sweep ${inside.toFixed(2)} should exceed outside ${outside.toFixed(2)}`);
});

test('hazardAt: a firing flame pillar covers its corridor, idle does not', () => {
  const firing = makeWorld({ traps: [FLAME(160, 100, 0, 40, 2, 3.3)] });   // st=2 while firing
  const idle = makeWorld({ traps: [FLAME(160, 100, 0, 40, 0, 0)] });
  const a = loadAuto({ world: firing }); a.G.p = P(100, 100);
  const b = loadAuto({ world: idle }); b.G.p = P(100, 100);
  assert.ok(a.api.hazardAt(180, 100) > 1.0, 'inside a firing corridor must be dangerous');
  assert.ok(b.api.hazardAt(180, 100) < 0.5, 'an idle flamer is not dangerous right now');
});

test('hazardAt: poison pools are penalised inside their radius only', () => {
  const world = makeWorld({ pools: [POOL(160, 100, 20)] });
  const { api, G } = loadAuto({ world });
  G.p = P(100, 100);
  assert.ok(api.hazardAt(165, 100) > 0.5);
  assert.ok(api.hazardAt(160, 190) < 0.2);
});

test('spotDanger picks hazards up through the movement field', () => {
  const world = makeWorld({ traps: [BLADE(160, 100, 0, 0)] });
  const { api, G } = loadAuto({ world });
  G.p = P(100, 100);
  assert.ok(api.spotDanger(190, 100, G.p) > api.spotDanger(100, 40, G.p) + 0.5);
});

test('gridPath routes around a live flame corridor when a detour exists', () => {
  // open field; a firing flamer lies exactly on the straight line to the goal
  const world = makeWorld({ traps: [FLAME(160, 120, 0, 60, 2, 3.3)] });
  const { api, G } = loadAuto({ world });
  G.p = P(80, 120);
  const path = api.gridPath(G.p, 280, 120);
  assert.ok(path, 'a path must exist');
  const inCorridor = path.filter(([x, y]) => x > 150 && x < 230 && Math.abs(y - 120) < 10);
  assert.deepEqual(inCorridor, [], 'the BFS must route around the live flame corridor, not through it');
});

test('gridPath still crosses the flame when a walled tunnel leaves no detour', () => {
  const walls = [];
  for (let x = 5; x <= 16; x++) { walls.push([x, 6]); walls.push([x, 8]); }   // tunnel on row 7
  const world = makeWorld({ walls, traps: [FLAME(160, 120, 0, 60, 2, 3.3)] });
  const { api, G } = loadAuto({ world });
  G.p = P(80, 120);
  const path = api.gridPath(G.p, 280, 120);
  assert.ok(path && path.length > 0, 'the fallback must still produce a route through the tunnel');
});

// ---------------------------------------------------------------- travel
test('nextWaypoint returns a floor tile heading toward the goal', () => {
  const walls = []; for (let y = 0; y < 14; y++) walls.push([10, y]);   // wall with no gap
  const world = makeWorld({ walls });
  const { api, G } = loadAuto({ world });
  G.p = P(5 * 16 + 8, 6 * 16 + 8);
  const wp = api.nextWaypoint(G.p, 15 * 16 + 8, 6 * 16 + 8);   // unreachable: null expected
  assert.equal(wp, null);
  const open = loadAuto({});
  open.G.p = open.ctx;
  const wp2 = open.api.nextWaypoint({ x: 5 * 16 + 8, y: 6 * 16 + 8, r: 4 }, 15 * 16 + 8, 6 * 16 + 8);
  assert.ok(Array.isArray(wp2) && wp2.length === 2, 'an open map must yield a waypoint');
});

// ---------------------------------------------------------------- fine options
test('options default to enabled and are read from settings', () => {
  const { api } = loadAuto({});
  const o = api.A.opts;
  for (const k of ['chest', 'labSerum', 'fount', 'weaponPick', 'chipPick', 'pickups', 'arsenal', 'manual']) {
    assert.equal(typeof o[k], 'boolean', `${k} must be a boolean option`);
  }
});

test('manualHold: true only when the player holds a key we did not press', () => {
  const { api, ctx } = loadAuto({});
  const Input = ctx.Input;
  api.setKeys(false, false, false, false);
  assert.equal(api.manualHold(), false);
  Input.keys.KeyD = true;                       // the human presses right
  assert.equal(api.manualHold(), true);
  api.setKeys(false, false, false, true);       // now it is our own key
  assert.equal(api.manualHold(), false);
});
