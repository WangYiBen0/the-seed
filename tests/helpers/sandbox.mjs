// Shared test sandbox: loads site/tools/auto.js inside a stubbed game world so
// the pure decision functions (laneClear / pickDir / dashSafe / gridPath / …)
// can be unit-tested in Node without a browser.  auto.js is never modified:
// the harness injects a single `TSW.__test = {...}` export line at load time
// through a string patch applied to the source *in memory*.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const AUTO_SRC = readFileSync(join(ROOT, 'site', 'tools', 'auto.js'), 'utf8');

export function makeWorld({ walls = [], pits = [], w = 20, h = 14 } = {}) {
  const tiles = new Uint8Array(w * h).fill(1);            // 1 = FLOOR
  for (const [x, y] of walls) tiles[y * w + x] = 2;       // 2 = WALL
  for (const [x, y] of pits) tiles[y * w + x] = 3;        // 3 = PIT
  return { w, h, tiles };
}

export function loadAuto({ bullets = [], enemies = [], mechs = [], zones = [], world = makeWorld(), diff = 'classic' } = {}) {
  const TSW = {
    settings: { get: (k, d) => d, set: () => { } },
    hooks: { _before: [], beforeTick: (fn) => { TSW.hooks._before.push(fn); } },
    log: () => { }, err: () => { }, bus: { on: () => { }, emit: () => { } },
    whenGame: () => new Promise(() => { }),            // never resolves: no browser needed
    clock: { virtualNow: 0 },
  };
  const TL = { VOID: 0, FLOOR: 1, WALL: 2, PIT: 3, SLUDGE: 4, SPIKE: 5, DOOR: 6, PILLAR: 7 };
  const WORLD = world;
  const G = { time: 0, runT: 0, state: 'play', diff, ebullets: bullets, enemies, mechs, zones, inter: [], p: null, kills: 0, ink: 0, cam: { x: 0, y: 0 } };
  const ctx = {
    window: { __TSW: TSW, __achroma: { get G() { return G; } }, NAMEED: null },
    document: { addEventListener: () => { }, createElement: () => ({ style: {} }), getElementById: () => null },
    location: { search: '' },
    URLSearchParams,
    TSW, TL, WORLD, G,
    WEAPONS: { nail: { id: 'nail', kind: 'gun' }, edge: { id: 'edge', kind: 'melee' }, rail: { id: 'rail', kind: 'rail' } },
    SHARD: {}, WEAPON_IDS: ['nail', 'edge', 'rail'],
    dist: (a, b, c, d) => Math.hypot(c - a, d - b),
    ang: (a, b, c, d) => Math.atan2(d - b, c - a),
    clamp: (v, a, b) => v < a ? a : v > b ? b : v,
    lerp: (a, b, t) => a + (b - a) * t,
    rand: (a = 0, b = 1) => a + Math.random() * (b - a),
    tileAt: (x, y) => (x < 0 || y < 0 || x >= WORLD.w || y >= WORLD.h) ? TL.VOID : WORLD.tiles[y * WORLD.w + x],
    tileAtPx: (x, y) => ctx.tileAt(Math.floor(x / 16), Math.floor(y / 16)),
    blocksShot: (t) => t === TL.VOID || t === TL.WALL || t === TL.DOOR || t === TL.PILLAR,
    shotBlocked: (x, y) => ctx.blocksShot(ctx.tileAtPx(x, y)),
    los: (x1, y1, x2, y2) => { const d = ctx.dist(x1, y1, x2, y2), n = Math.ceil(d / 8); for (let i = 1; i < n; i++) { const t = i / n; if (ctx.shotBlocked(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) return false; } return true; },
    collides: (x, y) => { const t = ctx.tileAtPx(x, y); return t === TL.WALL || t === TL.VOID || t === TL.PILLAR; },
    spikeState: () => 0,
    roomAt: () => null,
    inMech: (m, x, y) => {
      if (m.type === 'circle') return ctx.dist(x, y, m.x, m.y) < m.r;
      if (m.type === 'seg') { const dx = m.x2 - m.x, dy = m.y2 - m.y; const l2 = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((x - m.x) * dx + (y - m.y) * dy) / l2)); return ctx.dist(x, y, m.x + dx * t, m.y + dy * t) < (m.w || 8) / 2; }
      return false;
    },
    diffV: (k) => (k === 'mhp' ? (G.diff === 'despair' ? 2 : 1) : 1),
    hasCurse: () => false, usesAmmo: () => false, magSize: () => 10, ammoOf: () => ({ n: 10, rl: 0 }),
    wCap: () => 2, wScore: () => 1, sname: (s) => s && s.id, synergyHint: () => null,
    Input: { keys: {}, prev: {}, mx: 0, my: 0, down: false, clicked: false, wheel: 0 },
    restartRun: () => { }, spawnEnemy: () => { }, killEnemy: () => { }, gainInk: () => 0, hurtPlayer: () => false,
    beginFloorTransition: () => { }, startEndless: () => { }, endlessFloor: () => 0, FLOORS: [{}, {}, {}, {}, {}],
    SKILLS: {}, installChip: () => { }, recomputeStats: () => { }, computeTints: () => { }, applyShard: () => { }, giveWeapon: () => { },
    svBtns: () => [{ x: 0, y: 0, w: 1, h: 1 }, { x: 0, y: 0, w: 1, h: 1 }], svData: () => ({ ban: 0, skip: 0 }), cardRect: () => ({ x: 0, y: 0 }),
    notify: () => { }, AU: { play: () => { } }, L: (k) => String(k),
  };
  // auto.js reads the game through bare identifiers (script-level bindings in the
  // real page), so the sandbox must expose them as top-level names too.
  const sandbox = {
    ...ctx, __achroma: ctx.window.__achroma, window: ctx.window,
    Math, JSON, console, Promise, Date, performance: { now: () => 0 },
    isFinite, Object, Array, Set, Map, Number, String, Boolean, Error,
  };
  const marker = "  TSW.log('auto module ready');";
  if (!AUTO_SRC.includes(marker)) throw new Error('auto.js export marker not found');
  const patched = AUTO_SRC.replace(marker,
    '  TSW.__test = { laneClear, pickDir, pickDirSimple, dashSafe, gridPath, mechDanger, spotDanger, nearestEnemy, clampM, GW, drivePicker, A };\n' + marker);
  const fn = new Function(...Object.keys(sandbox), patched + '\n//# sourceURL=auto.js');
  fn(...Object.values(sandbox));
  return { TSW, G, ctx, world, api: TSW.__test };
}
