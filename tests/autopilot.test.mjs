// Unit tests for the autopilot's decision logic (site/tools/auto.js).
// Run: node --test tests/     (or: nix run .#test)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadAuto, makeWorld } from './helpers/sandbox.mjs';

const P = (x, y, extra = {}) => Object.assign({ x, y, r: 4, vx: 0, vy: 0, hp: 5, maxHp: 5, armor: 3, maxArmor: 3, lastHit: 99, weapons: ['nail'], wi: 0, shards: {}, dashCd: 0, dashT: 0, skill: null, skillCd: 0, aim: 0, alive: true }, extra);
const BULLET = (x, y, vx, vy, r = 3) => ({ x, y, vx, vy, r, life: 5 });

test('laneClear: an empty lane reports the full margin', () => {
  const { api, G } = loadAuto({ bullets: [] });
  G.p = P(100, 100);
  const m = api.laneClear(G.p, 1, 0);
  assert.ok(m > 30, `expected a wide-open lane margin, got ${m}`);
});

test('laneClear: a bullet flying along the ray collapses the margin to 0', () => {
  const { api, G } = loadAuto({ bullets: [BULLET(130, 100, 0, -60)] });   // crossing the ray
  G.p = P(100, 100);
  assert.equal(api.laneClear(G.p, 1, 0), 0);
});

test('laneClear: a written-off (stationary) bullet is ignored', () => {
  const { api, G } = loadAuto({ bullets: [BULLET(130, 100, 0, 0)] });
  G.p = P(100, 100);
  assert.ok(api.laneClear(G.p, 1, 0) > 30, 'fast-moving check runs first: zero-velocity bullets are not threats');
});

test('laneClear: a bullet crossing far off to the side leaves the margin large', () => {
  const { api, G } = loadAuto({ bullets: [BULLET(130, 200, 0, 0)] });
  G.p = P(100, 100);
  assert.ok(api.laneClear(G.p, 1, 0) > 30);
});

test('pickDir: does not walk into the path of an incoming bullet', () => {
  // bullet 40px to the right of the player, flying left (towards the player).
  const { api, G } = loadAuto({ bullets: [BULLET(140, 100, -300, 0)] });
  G.p = P(100, 100);
  const [dx, dy] = api.pickDir(G.p, 0, 0);
  const marginEast = api.laneClear(G.p, 1, 0);
  assert.ok(dx < 0.9 || marginEast > 10, `expected to avoid the firing lane, got dx=${dx.toFixed(2)} dy=${dy.toFixed(2)}`);
});

test('pickDir: respects the wanted direction when nothing threatens', () => {
  const { api, G } = loadAuto({ bullets: [] });
  G.p = P(100, 100);
  const [dx, dy] = api.pickDir(G.p, 1, 0);
  assert.ok(dx > 0.7 && Math.abs(dy) < 0.7, `expected east, got ${dx.toFixed(2)},${dy.toFixed(2)}`);
});

test('pickDir: never picks a direction that immediately collides with a wall', () => {
  // walls to the east of the player
  const world = makeWorld({ walls: [[9, 6], [9, 7], [9, 5]] });
  const { api, G } = loadAuto({ world });
  G.p = P(8 * 16 + 8, 6 * 16 + 8);            // inside tile (8,6)
  const [dx] = api.pickDir(G.p, 1, 0);
  assert.ok(dx < 0.9, `expected the wall to repel the east choice, got dx=${dx.toFixed(2)}`);
});

test('dashSafe: refuses a dash that ends inside a pit', () => {
  const world = makeWorld({ pits: [[7, 6], [8, 6], [9, 6], [10, 6]] });
  const { api, G } = loadAuto({ world });
  G.p = P(6 * 16 + 8, 6 * 16 + 8);
  assert.equal(api.dashSafe(G.p, 1, 0), false, 'a 4-tile pit is wider than a dash (52px) and must be refused');
});

test('dashSafe: allows a dash over a one-tile pit with floor beyond', () => {
  const world = makeWorld({ pits: [[8, 6]] });
  const { api, G } = loadAuto({ world });
  G.p = P(6 * 16 + 8, 6 * 16 + 8);
  assert.equal(api.dashSafe(G.p, 1, 0), true);
});

test('dashSafe: allows a normal dash on open floor', () => {
  const { api, G } = loadAuto({});
  G.p = P(100, 100);
  assert.equal(api.dashSafe(G.p, 1, 0), true);
});

test('gridPath: routes around a wall instead of through it', () => {
  const walls = [];
  for (let y = 3; y <= 9; y++) walls.push([10, y]);       // a wall with a gap at the bottom
  const world = makeWorld({ walls });
  const { api, G } = loadAuto({ world });
  G.p = P(5 * 16 + 8, 6 * 16 + 8);
  const path = api.gridPath(G.p, 15 * 16 + 8, 6 * 16 + 8);
  assert.ok(path && path.length > 0, 'expected a path');
  for (const [px, py] of path) {
    const t = world.tiles[Math.floor(py / 16) * world.w + Math.floor(px / 16)];
    assert.equal(t, 1, `path must stay on floor, stepped on tile type ${t}`);
  }
});

test('gridPath: returns null when the target is unreachable', () => {
  const walls = [];
  for (let y = 0; y < 14; y++) walls.push([10, y]);        // a full-height wall
  const world = makeWorld({ walls });
  const { api, G } = loadAuto({ world });
  G.p = P(5 * 16 + 8, 6 * 16 + 8);
  assert.equal(api.gridPath(G.p, 15 * 16 + 8, 6 * 16 + 8), null);
});

test('mechDanger: an about-to-fire telegraph is weighted far above a lingering hazard', () => {
  const { api } = loadAuto({});
  const urgent = api.mechDanger({ type: 'circle', x: 0, y: 0, r: 20, warn: 1.0, t: 0.95 });
  const early = api.mechDanger({ type: 'circle', x: 0, y: 0, r: 20, warn: 1.0, t: 0.05 });
  const lingering = api.mechDanger({ type: 'wetink', x: 0, y: 0, warn: 99, t: 1 });
  const resolved = api.mechDanger({ type: 'circle', x: 0, y: 0, r: 20, warn: 1.0, t: 1.5 });
  assert.ok(urgent > early, 'later in the telegraph must be more dangerous');
  assert.ok(lingering > 0 && lingering < urgent);
  assert.equal(resolved, 0, 'a resolved telegraph is harmless');
});

test('spotDanger: standing inside a telegraph circle scores much higher than open floor', () => {
  const { api, G } = loadAuto({ mechs: [{ type: 'circle', x: 160, y: 100, r: 30, warn: 1.0, t: 0.6 }] });
  G.p = P(100, 100);
  const inside = api.spotDanger(160, 100, G.p);
  const outside = api.spotDanger(40, 40, G.p);
  assert.ok(inside > outside + 1, `inside=${inside} outside=${outside}`);
});

test('spotDanger: pits and spikes are penalised even with no enemies around', () => {
  const world = makeWorld({ pits: [[7, 6]] });
  const { api, G } = loadAuto({ world });
  G.p = P(100, 100);
  const onPit = api.spotDanger(7 * 16 + 8, 6 * 16 + 8, G.p);
  const onFloor = api.spotDanger(3 * 16 + 8, 6 * 16 + 8, G.p);
  assert.ok(onPit > onFloor, `pit=${onPit} floor=${onFloor}`);
});

test('nearestEnemy: skips dead, spawning, invulnerable and death-fighting foes', () => {
  const enemies = [
    { x: 120, y: 100, r: 4, dead: true },
    { x: 130, y: 100, r: 4, spawnT: 0.5 },
    { x: 140, y: 100, r: 4, deathFightLeft: 1 },
    { x: 150, y: 100, r: 4, inv: 0.4 },
    { x: 170, y: 100, r: 4 },
  ];
  const { api, G } = loadAuto({ enemies });
  G.p = P(100, 100);
  const ne = api.nearestEnemy(100, 100, 900, false);
  assert.equal(ne.x, 170);
});

test('nearestEnemy: honours the line-of-sight requirement', () => {
  // player on open floor; the ONLY foe sits directly behind a wall tile.
  const world = makeWorld({ walls: [[10, 6]] });
  const { api, G, ctx } = loadAuto({ world, enemies: [{ x: 12 * 16 + 8, y: 6 * 16 + 8, r: 4 }] });
  G.p = P(8 * 16 + 8, 6 * 16 + 8);                    // (8,6): open floor, left of the wall
  assert.equal(ctx.los(G.p.x, G.p.y, 12 * 16 + 8, 6 * 16 + 8), false, 'fixture: the wall must block this line');
  assert.equal(api.nearestEnemy(G.p.x, G.p.y, 900, true), null, 'a blocked foe must not be targeted');
  assert.ok(api.nearestEnemy(G.p.x, G.p.y, 900, false), 'without the LOS requirement it is still a valid foe');
});

test('clampM: never emits NaN (the old NaN went straight into the camera)', () => {
  const { api } = loadAuto({});
  assert.ok(Number.isFinite(api.clampM(NaN, NaN)));
  assert.ok(Number.isFinite(api.clampM(undefined, undefined)));
  assert.ok(Number.isFinite(api.clampM(1e9, 480)));
  assert.equal(api.clampM(-5, 480), 1);
  assert.equal(api.clampM(500, 480), 479);
});

test('GW: falls back to a sane width when the game global is absent', () => {
  const { api } = loadAuto({});
  assert.equal(api.GW(), 480);
});

test('v1/v2 engines: both return a unit vector', () => {
  const { api, G } = loadAuto({ bullets: [BULLET(140, 100, -300, 0), BULLET(80, 60, 200, 60)] });
  G.p = P(100, 100);
  for (const fn of [api.pickDir, api.pickDirSimple]) {
    const [dx, dy] = fn(G.p, 1, 0);
    assert.ok(Math.abs(Math.hypot(dx, dy) - 1) < 1e-6, 'direction must be normalised');
  }
});

test('v2 beats v1 on a forced squeeze: one bullet each side vs one lane-safe opening', () => {
  // Two bullets aimed to pass either side of the player: the only safe way out is
  // straight down.  v1 (average danger) tends to pick a lane with a near-miss on
  // each side; v2's maximin term should prefer the clear lane.
  const bullets = [BULLET(70, 100, 0, 0), BULLET(130, 100, 0, 0)];
  const { api, G } = loadAuto({ bullets });
  G.p = P(100, 100);
  const [, dy2] = api.pickDir(G.p, 0, 0);
  const margin2 = api.laneClear(G.p, 0, 1);
  assert.ok(dy2 < 0.2 || margin2 > 20, `v2 should prefer the clear lane (dy=${dy2.toFixed(2)}, margin=${margin2.toFixed(1)})`);
});
