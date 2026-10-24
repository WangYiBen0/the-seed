// ===== ACHROMA world: floor generation, tiles, collision, rendering =====
'use strict';
const TL = { VOID: 0, FLOOR: 1, WALL: 2, PIT: 3, SLUDGE: 4, SPIKE: 5, DOOR: 6, PILLAR: 7 };
const CW = 26, CH = 20, GRID = 6;
const FLOORS = [
  { name: { en: 'RUINS', zh: '廢墟', ja: '廃墟', zhs: '废墟' }, sub: { en: 'THE CITY THE OUTBREAK LEFT BEHIND', zh: '異變過後留下的城市', ja: '異変が残した街', zhs: '异变过后留下的城市' }, rooms: 11, specials: 3, root: 1, c: () => col(5) },
  { name: { en: 'BLACKOUT', zh: '斷電區', ja: '停電区画', zhs: '断电区' }, sub: { en: 'THE CURRENT STILL HUMS IN THE WALLS', zh: '電流仍在牆裡低鳴', ja: '壁の中でまだ電流が唸る', zhs: '电流仍在墙里低鸣' }, rooms: 12, specials: 3, root: 0.89, c: () => C.cyan },
  { name: { en: 'CULTURE LEVEL', zh: '培養層', ja: '培養層', zhs: '培养层' }, sub: { en: 'THE SPECIMENS KEEP GROWING IN THE DARK', zh: '樣本仍在黑暗中生長', ja: '標本は闇の中で育ち続ける', zhs: '样本仍在黑暗中生长' }, rooms: 13, specials: 4, root: 0.75, c: () => C.red },
  { name: { en: 'QUARANTINE FOG', zh: '隔離霧區', ja: '隔離霧域', zhs: '隔离雾区' }, sub: { en: 'WHAT YOU CANNOT SEE STILL SEES YOU', zh: '看不見的東西仍在注視著你', ja: '見えぬものが君を見ている', zhs: '看不见的东西仍在注视着你' }, rooms: 14, specials: 4, root: 0.67, c: () => C.violet, fog: 1 },
  { name: { en: 'CORE LAB', zh: '核心實驗室', ja: '中枢研究室', zhs: '核心实验室' }, sub: { en: 'WHERE IT ALL BEGAN', zh: '一切開始的地方', ja: '全てが始まった場所', zhs: '一切开始的地方' }, rooms: 15, specials: 4, root: 0.6, c: () => C.gold },
];
const SPECIALS = ['shop', 'forge', 'trial', 'shrine', 'idol', 'vault', 'barracks'];
const ROOM_MARK = { boss: () => C.red, treasure: () => C.gold, shop: () => C.green, forge: () => C.orange, trial: () => C.pink, shrine: () => C.red, idol: () => C.violet, vault: () => C.cyan, camp: () => C.frost, dialysis: () => '#a4cfe0', barracks: () => '#8fa77e' };
let WORLD = null;

function genFloor(fi) {
  if (WORLD) { WORLD.level.width = 0; WORLD.decal.width = 0; } // free the previous floor's big canvases immediately
  const mw = GRID * CW, mh = GRID * CH;
  const tiles = new Uint8Array(mw * mh);
  const Wd = { w: mw, h: mh, tiles, rooms: [], fi, spikeT: 0, props: [], traps: [], pools: [] };
  // random walk room layout
  let cells = null;
  for (;;) {
    const set = new Map(); const key = (x, y) => x + ',' + y;
    const sx0 = randi(2, 3), sy0 = randi(2, 3); set.set(key(sx0, sy0), { gx: sx0, gy: sy0, links: [] });
    const target = FLOORS[fi].rooms;
    let guard = 0;
    while (set.size < target && guard++ < 3000) {
      const arr = [...set.values()]; const from = choice(arr);
      const d = choice([[1, 0], [-1, 0], [0, 1], [0, -1]]); const nx = from.gx + d[0], ny = from.gy + d[1];
      if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID || set.has(key(nx, ny))) continue;
      // keep branchy: avoid cells with >2 neighbours already
      let nb = 0; for (const e of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (set.has(key(nx + e[0], ny + e[1]))) nb++;
      if (nb > 1 && Math.random() < .8) continue;
      const c = { gx: nx, gy: ny, links: [] }; set.set(key(nx, ny), c); from.links.push(c); c.links.push(from);
    }
    if (set.size < target) continue;
    cells = [...set.values()];
    // BFS distance from start
    const start = cells[0]; start.d = 0; const q = [start]; for (const c of cells) if (c !== start) c.d = -1;
    while (q.length) { const c = q.shift(); for (const n of c.links) if (n.d < 0) { n.d = c.d + 1; q.push(n); } }
    const boss = cells.reduce((a, b) => b.d > a.d ? b : a);
    if (boss.d < 3 || boss.links.length !== 1) { cells = null; continue; }
    boss.type = 'boss'; start.type = 'start';
    const ends = cells.filter(c => !c.type && c.links.length === 1);
    const tre = ends.length ? choice(ends) : choice(cells.filter(c => !c.type));
    tre.type = 'treasure';
    // every floor has a survivor camp, preferably tucked away in a dead end
    { const free = cells.filter(c => !c.type && c.d > 0), dead = free.filter(c => c.links.length === 1); if (!free.length) { cells = null; continue; } (dead.length ? choice(dead) : choice(free)).type = 'camp'; }
    // special rooms prefer dead ends and deeper cells; keep at least 3 combat rooms
    // a dialysis machine on floors 5, 15, 45 and 75 (endless floors count on from the fifth)
    const depthNo = G && G.endless ? FLOORS.length + G.endless : fi + 1;
    if ([5, 15, 45, 75].includes(depthNo)) { const free = cells.filter(c => !c.type && c.d > 0), dead = free.filter(c => c.links.length === 1); if (free.length > 3) (dead.length ? choice(dead) : choice(free)).type = 'dialysis'; }
    const sp = shuffle(SPECIALS.slice()).slice(0, FLOORS[fi].specials);
    for (const kind of sp) { const free = cells.filter(c => !c.type && c.d > 0); if (free.length <= 3) break;
      const dead = free.filter(c => c.links.length === 1); const pick = dead.length ? choice(dead) : choice(free); pick.type = kind; }
    for (const c of cells) if (!c.type) c.type = 'combat';
    // the boss key drops from one of the deeper combat rooms (never next to the boss)
    const kc = cells.filter(c => c.type === 'combat' && c.d >= 2 && !c.links.includes(boss)).sort((a, b) => b.d - a.d);
    if (!kc.length) { cells = null; continue; }
    choice(kc.slice(0, Math.max(1, Math.ceil(kc.length / 2)))).key = true;
    // the two champion rooms are chosen here, so they can be carved at the largest size
    shuffle(cells.filter(c => c.type === 'combat')).slice(0, 2).forEach(c => { c.champ = true; });
    break;
  }
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < mw && y < mh) tiles[y * mw + x] = v; };
  const get = (x, y) => (x < 0 || y < 0 || x >= mw || y >= mh) ? 0 : tiles[y * mw + x];
  // carve rooms
  for (const c of cells) {
    let w, h;
    if (c.type === 'boss') { w = 25; h = 19; } else if (c.type === 'trial') { w = 19; h = 15; } else if (c.type === 'camp') { w = 15; h = 11; } else if (c.type !== 'combat') { w = 13; h = 11; }
    else if (c.champ) { w = 23; h = 17; }
    else { w = 15 + 2 * randi(0, 3); h = 11 + 2 * randi(0, 2); }
    const cx = c.gx * CW + 13, cy = c.gy * CH + 10, x0 = cx - (w >> 1), y0 = cy - (h >> 1);
    const room = { key: !!c.key, id: Wd.rooms.length, gx: c.gx, gy: c.gy, cx, cy, x0, y0, w, h, type: c.type, cleared: c.type !== 'combat' && c.type !== 'boss', active: false, doors: [], visited: c.type === 'start', cell: c, d: c.d, champRoom: !!c.champ };
    c.room = room; Wd.rooms.push(room);
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, (x === x0 || y === y0 || x === x0 + w - 1 || y === y0 + h - 1) ? TL.WALL : TL.FLOOR);
  }
  // carve corridors
  const done = new Set();
  for (const c of cells) for (const n of c.links) {
    const k = [c.room.id, n.room.id].sort().join('-'); if (done.has(k)) continue; done.add(k);
    const [a, b] = (c.gx < n.gx || c.gy < n.gy) ? [c.room, n.room] : [n.room, c.room];
    if (a.gy === b.gy) {
      const xa = a.x0 + a.w - 1, xb = b.x0, y = a.cy;
      for (let x = xa; x <= xb; x++) { for (let d = -1; d <= 1; d++) set(x, y + d, TL.FLOOR); for (const d of [-2, 2]) if (get(x, y + d) === TL.VOID) set(x, y + d, TL.WALL); }
      for (let d = -1; d <= 1; d++) { a.doors.push([xa, y + d]); b.doors.push([xb, y + d]); }
    } else {
      const ya = a.y0 + a.h - 1, yb = b.y0, x = a.cx;
      for (let y = ya; y <= yb; y++) { for (let d = -1; d <= 1; d++) set(x + d, y, TL.FLOOR); for (const d of [-2, 2]) if (get(x + d, y) === TL.VOID) set(x + d, y, TL.WALL); }
      for (let d = -1; d <= 1; d++) { a.doors.push([x + d, ya]); b.doors.push([x + d, yb]); }
    }
  }
  // decorate combat rooms with terrain
  for (const r of Wd.rooms) if (r.type === 'combat') decorateRoom(Wd, r, set, get);
  else if (r.type === 'boss') decorateBoss(Wd, r, set);
  else if (r.type === 'trial') { for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { set(r.cx + sx * 5, r.cy + sy * 3, TL.WALL); set(r.cx + sx * 6, r.cy + sy * 3, TL.WALL); } }
  WORLD = Wd;
  Wd.boss = Wd.rooms.find(r => r.type === 'boss'); Wd.bossLocked = true; setDoors(Wd.boss, true);
  Wd.level = renderLevel(Wd);
  Wd.decal = document.createElement('canvas'); Wd.decal.width = mw * T; Wd.decal.height = mh * T; Wd.dctx = Wd.decal.getContext('2d');
  return Wd;
}

// ---- combat room layouts: mirrored templates, then traps, then symmetric props ----
// the 3-wide cross through the centre always stays open, so every door connects; tiles next to the walls stay open too
const DECOR = [
  ['pillars', 'corners', 'water', 'pits', 'rows', 'ring', 'crates'],
  ['water', 'spikes', 'pillars', 'corners', 'pits', 'rows', 'islands'],
  ['pits', 'spikes', 'ring', 'water', 'maze', 'islands', 'corners'],
  ['maze', 'spikes', 'pits', 'rows', 'ring', 'water', 'pillars', 'islands'],
  ['pits', 'spikes', 'maze', 'ring', 'corners', 'islands', 'rows', 'water'],
];
const COVER_KINDS = ['pillars', 'corners', 'rows', 'ring', 'maze'];
function decorateRoom(Wd, r, set, get) {
  const fi = Wd.fi, ix0 = r.x0 + 1, iy0 = r.y0 + 1, ix1 = r.x0 + r.w - 2, iy1 = r.y0 + r.h - 2;
  const inPlus = (x, y) => Math.abs(x - r.cx) <= 1 || Math.abs(y - r.cy) <= 1;
  const near = (x, y) => x <= ix0 || x >= ix1 || y <= iy0 || y >= iy1;
  const big = r.w >= 19 || r.h >= 15, champ = !!r.champRoom, reserved = new Set(), rk = (x, y) => x + ',' + y;
  const hw = (r.w >> 1) - 2, hh = (r.h >> 1) - 2;
  const quad = fn => { for (let dy = 0; dy <= hh; dy++) for (let dx = 0; dx <= hw; dx++) { const v = fn(dx, dy); if (!v) continue;
      for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { const x = r.cx + sx * dx, y = r.cy + sy * dy; if (!inPlus(x, y) && !near(x, y) && !reserved.has(rk(x, y)) && get(x, y) === TL.FLOOR) set(x, y, v); } } };
  // ---- traps first (bigger rooms only), so nothing else is laid on their sweep or their lane ----
  Wd.traps = Wd.traps || [];
  if (big && Math.random() < .45 + fi * .1) {
    const kind = fi === 0 ? 'blades' : Math.random() < .5 ? 'blades' : 'flames';
    if (kind === 'blades') { const bx = Math.min(hw - 2, Math.max(4, Math.round(r.w / 4))), by = Math.min(hh - 2, Math.max(3, Math.round(r.h / 4))), dir = Math.random() < .5 ? 1 : -1, diag = Math.random() < .5 ? 1 : -1;
      if (bx >= 4 && by >= 3) for (const s of [-1, 1]) { const px = r.cx + s * bx, py = r.cy + s * diag * by;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx * dx + dy * dy <= 6) reserved.add(rk(px + dx, py + dy));
        set(px, py, TL.WALL); Wd.traps.push({ kind: 'blade', x: px * T + 8, y: py * T + 8, R: 30, a: s > 0 ? 0 : Math.PI / 2, va: dir * (1.5 + fi * .15), room: r }); } }
    else { const oy = Math.min(3, hh); if (oy >= 2) for (const s of [-1, 1]) { const wx = s < 0 ? ix0 : ix1, y = r.cy + s * oy, L4 = Math.min(6, (r.w >> 1) - 2);
        set(wx, y, TL.WALL); for (let k = 1; k <= L4; k++) { reserved.add(rk(wx - s * k, y)); reserved.add(rk(wx - s * k, y - 1)); reserved.add(rk(wx - s * k, y + 1)); }
        Wd.traps.push({ kind: 'flame', x: wx * T + 8 - s * 9, y: y * T + 8, a: s < 0 ? 0 : Math.PI, L: L4 * T - 4, per: 3.4, warn: .9, fire: 1.2, t: s < 0 ? 0 : 1.7, st: 0, room: r }); } }
  }
  // ---- terrain templates ----
  const pool = DECOR[fi], picks = [];
  const n = champ ? 3 : 1 + (Math.random() < .55 + fi * .1 ? 1 : 0) + (big && Math.random() < .4 ? 1 : 0);
  if (champ) picks.push(...shuffle(COVER_KINDS.slice()).slice(0, 2));
  while (picks.length < n) { const k = choice(pool); if (!picks.includes(k)) picks.push(k); }
  // every combat room has something that stops bullets: with no wall template drawn, one is added (pillars or corners in small rooms)
  if (!picks.some(k => COVER_KINDS.includes(k))) picks.push(choice(big ? COVER_KINDS : ['pillars', 'corners', 'rows']));
  for (const k of picks) {
    if (k === 'pillars') { const px = randi(2, Math.max(2, hw - 3)), py = randi(2, Math.max(2, hh - 2)); quad((dx, dy) => (dx === px || dx === px + 1) && (dy === py || dy === py + 1) ? TL.WALL : 0); }
    if (k === 'corners') quad((dx, dy) => ((dx === hw - 1 && dy >= hh - 3 && dy <= hh - 1) || (dy === hh - 1 && dx >= hw - 3 && dx <= hw - 1)) ? TL.WALL : 0);
    if (k === 'rows') { const ry = Math.max(2, hh - 2), rx = Math.max(3, hw - 2); quad((dx, dy) => (dy === ry && dx >= 2 && dx <= 3) || (dx === rx && dy >= 2 && dy <= 2 + (hh > 4 ? 1 : 0)) ? TL.WALL : 0); }
    if (k === 'ring') quad((dx, dy) => (dx === hw - 1 && dy > 1 && dy < hh) || (dy === hh - 1 && dx > 2 && dx < hw - 1) ? TL.WALL : 0);
    if (k === 'maze') quad((dx, dy) => (dx % 4 === 3 && dy % 3 === 1) ? TL.WALL : 0);
    if (k === 'pits') { const px = randi(2, 4), py = randi(2, 3), pw = randi(1, 3), ph = randi(1, 2); quad((dx, dy) => dx >= px && dx < px + pw && dy >= py && dy < py + ph ? TL.PIT : 0); }
    if (k === 'islands') { const px = Math.max(2, (hw >> 1)), py = Math.max(2, (hh >> 1)); quad((dx, dy) => { const d = Math.hypot(dx - px, dy - py); return d < 1.2 ? TL.PIT : d < 2.3 ? TL.SLUDGE : 0; }); }
    if (k === 'water') { const px = randi(2, Math.max(2, hw - 1)), py = randi(2, Math.max(2, hh - 1)), rr = rand(1.4, 2.4); quad((dx, dy) => Math.hypot(dx - px, dy - py) < rr ? TL.SLUDGE : 0); }
    if (k === 'spikes') { const py = randi(2, Math.max(2, hh - 1)); quad((dx, dy) => dy === py && dx >= 2 && dx % 2 === 0 ? TL.SPIKE : 0); }
    if (k === 'crates') { /* a crate-heavy room: handled below with extra pairs */ }
  }
  // fallback: if pits, water or a trap's lane took every spot the template wanted, stand posts wherever floor is left
  const wallsIn = () => { let n = 0; for (let y = iy0; y <= iy1; y++) for (let x = ix0; x <= ix1; x++) if (get(x, y) === TL.WALL) n++; return n; };
  if (!wallsIn()) { const cand = []; for (let dy = 2; dy <= hh; dy++) for (let dx = 2; dx <= hw; dx++) cand.push([dx, dy]);
    const soft = t => t === TL.FLOOR || t === TL.SLUDGE || t === TL.SPIKE;
    for (const [dx, dy] of shuffle(cand)) { const pts = [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sy]) => [r.cx + sx * dx, r.cy + sy * dy]);
      if (!pts.every(([x, y]) => !inPlus(x, y) && !near(x, y) && !reserved.has(rk(x, y)) && soft(get(x, y)))) continue;
      for (const [x, y] of pts) set(x, y, TL.WALL); break; } }
  // ---- props: crates (break), barrels (explode), gas canisters (leave poison); always placed as mirrored pairs ----
  const mine = [], open = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const t = get(x + dx, y + dy); if (t !== TL.FLOOR && t !== TL.SLUDGE && t !== TL.SPIKE) return false; } return true; };
  const okAt = (x, y) => !inPlus(x, y) && !near(x, y) && get(x, y) === TL.FLOOR && open(x, y) && !reserved.has(rk(x, y)) && !mine.some(q => dist(q.x, q.y, x * T + 8, y * T + 8) < 24) && !Wd.traps.some(t => t.room === r && (t.kind === 'blade' ? dist(t.x, t.y, x * T + 8, y * T + 8) < t.R + 14 : false));
  const placePair = (kind, four) => { for (let k = 0; k < 16; k++) { const dx = randi(2, Math.max(2, hw - 1)), dy = randi(2, Math.max(2, hh - 1)), spots = four ? [[1, 1], [-1, 1], [1, -1], [-1, -1]] : [[1, 1], [-1, 1]], sy = Math.random() < .5 ? 1 : -1;
      const pts = spots.map(([sx, s2]) => [r.cx + sx * dx, r.cy + s2 * sy * dy]); if (!pts.every(([x, y]) => okAt(x, y))) continue;
      for (const [x, y] of pts) { const pr = makeProp(kind, x * T + 8, y * T + 8); mine.push(pr); Wd.props.push(pr); } return true; } return false; };
  const pairs = (champ ? 3 : 1) + (picks.includes('crates') ? 2 : 0) + (Math.random() < .5 ? 1 : 0);
  for (let i = 0; i < pairs; i++) placePair('crate', i === 0 && (champ || picks.includes('crates')));
  if (Math.random() < .55) placePair('barrel', false);
  if (fi >= 1 && Math.random() < .45) placePair('gas', false);
}
// boss arenas (25x19): one quarter of each layout, mirrored into all four; [floor][alt]: the 5 bosses and their alternates
const BOSS_COVER = [
  [[[6, 4], [7, 4], [7, 5]], [[5, 3], [6, 3], [8, 6], [9, 6]]],                                     // L corners / short bars
  [[[4, 5], [8, 3], [9, 6]], [[6, 4], [7, 4], [6, 5], [7, 5]]],                                     // scattered posts / 2x2 blocks
  [[[3, 3], [5, 6], [8, 2], [9, 5]], [[7, 2], [7, 3], [7, 4], [3, 6], [4, 6]]],                      // staggered posts / walls and a ledge
  [[[5, 4], [6, 4], [7, 4], [6, 3], [6, 5]], [[4, 3], [5, 3], [6, 3], [7, 6], [8, 6], [9, 6]]],     // plus-shaped piers / shelf rows
  [[[3, 5], [6, 6], [9, 4], [8, 2]], [[4, 4], [5, 4], [4, 5], [5, 5], [9, 2]]],                      // a wide ring of posts / blocks and posts
];
function decorateBoss(Wd, r, set) {
  const fi = clamp(Wd.fi | 0, 0, BOSS_COVER.length - 1), alt = !!(typeof G !== 'undefined' && G && G.bossPick && G.bossPick.alt), q = BOSS_COVER[fi][alt ? 1 : 0];
  const ok = (x, y) => Math.abs(x - r.cx) > 1 && Math.abs(y - r.cy) > 1 && x > r.x0 + 1 && x < r.x0 + r.w - 2 && y > r.y0 + 1 && y < r.y0 + r.h - 2 && Wd.tiles[y * Wd.w + x] === TL.FLOOR;
  for (const [dx, dy] of q) for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const x = r.cx + sx * dx, y = r.cy + sy * dy; if (ok(x, y)) set(x, y, TL.WALL); }
}
function makeProp(kind, x, y) { return { kind, x, y, r: 6, hp: kind === 'crate' ? 12 : kind === 'gas' ? 4 : 5, flash: 0, dead: false }; }

// ---- tile queries ----
const tileAt = (tx, ty) => (!WORLD || tx < 0 || ty < 0 || tx >= WORLD.w || ty >= WORLD.h) ? 0 : WORLD.tiles[ty * WORLD.w + tx];
const tileAtPx = (x, y) => tileAt(Math.floor(x / T), Math.floor(y / T));
function blocksMove(t, fly) { return t === TL.VOID || t === TL.WALL || t === TL.DOOR || t === TL.PILLAR || (!fly && t === TL.PIT); }
function blocksShot(t) { return t === TL.VOID || t === TL.WALL || t === TL.DOOR || t === TL.PILLAR; }
const shotBlocked = (x, y) => blocksShot(tileAtPx(x, y));
function collides(x, y, r, fly) {
  if (![x, y, r].every(Number.isFinite) || r < 0) return true;
  const x0 = Math.floor((x - r) / T), x1 = Math.floor((x + r - .01) / T), y0 = Math.floor((y - r) / T), y1 = Math.floor((y + r - .01) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (blocksMove(tileAt(tx, ty), fly)) return true;
  return false;
}
function moveBody(e, dx, dy) {
  if (![e.x, e.y, e.r, dx, dy].every(Number.isFinite)) return false;
  // Bound bad/overflowed impulses without increasing the collision step size.
  const span = Math.max(Math.abs(dx), Math.abs(dy));
  if (span > 1024) { dx *= 1024 / span; dy *= 1024 / span; }
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 3)); let hx = false, hy = false;
  for (let i = 0; i < steps; i++) {
    if (!collides(e.x + dx / steps, e.y, e.r, e.fly)) e.x += dx / steps; else hx = true;
    if (!collides(e.x, e.y + dy / steps, e.r, e.fly)) e.y += dy / steps; else hy = true;
    if (e === G.p && !G.preview && G.state === 'play' && roomTrigger(e)) break;
  }
  // props push
  if (WORLD) for (const p of WORLD.props) { if (p.dead) continue; const d = dist(e.x, e.y, p.x, p.y), m = e.r + p.r; if (d < m && d > 0) { const a = ang(p.x, p.y, e.x, e.y), nx = p.x + Math.cos(a) * m, ny = p.y + Math.sin(a) * m; if (!collides(nx, e.y, e.r, e.fly)) e.x = nx; if (!collides(e.x, ny, e.r, e.fly)) e.y = ny; } }
  return hx || hy;
}
// raycast with optional reflections; returns polyline points
function rayPath(x, y, a, maxD, bounces) {
  const pts = [[x, y]]; let dx = Math.cos(a), dy = Math.sin(a), left = maxD, b = bounces || 0;
  while (left > 0) {
    let hit = false;
    while (left > 0) {
      const step = Math.min(2, left), nx = x + dx * step, ny = y + dy * step;
      if (shotBlocked(nx, ny)) {
        hit = true;
        if (b > 0) { const vx = shotBlocked(nx, y), vy = shotBlocked(x, ny); if (vx || !vy) dx = -dx; if (vy || !vx) dy = -dy; }
        break;
      }
      x = nx; y = ny; left -= step;
    }
    pts.push([x, y]);
    if (!hit || b-- <= 0) break;
  }
  return pts;
}
// nearest spot around (x, y) where a body of radius r can stand (searched in rings); null if none is close
function freeSpot(x, y, r, fly, maxR = 140, allowed = () => true) { if (allowed(x, y) && !collides(x, y, r, fly) && blocksMove(tileAtPx(x, y), fly) === false) return [x, y];
  for (let rad = 6; rad <= maxR; rad += 6) { const n = Math.max(8, Math.round(rad / 3)); for (let i = 0; i < n; i++) { const a = i / n * 6.2832, qx = x + Math.cos(a) * rad, qy = y + Math.sin(a) * rad; if (allowed(qx, qy) && !collides(qx, qy, r, fly)) return [qx, qy]; } } return null; }
// what numbers scale with: an endless floor wears a random chapter's look and foes, but counts as the last chapter
const statFloor = () => G && G.endless ? FLOORS.length - 1 : G.floor;
function roomAt(x, y) {
  if (!WORLD) return null; const tx = Math.floor(x / T), ty = Math.floor(y / T);
  for (const r of WORLD.rooms) if (tx > r.x0 && ty > r.y0 && tx < r.x0 + r.w - 1 && ty < r.y0 + r.h - 1) return r;
  return null;
}
function roomFloorTiles(r) {
  // flood fill from center over walkable tiles inside the room
  const out = [], seen = new Set(), q = [[r.cx, r.cy]];
  while (q.length) { const [x, y] = q.pop(); const k = y * 9999 + x; if (seen.has(k)) continue; seen.add(k);
    if (x <= r.x0 || y <= r.y0 || x >= r.x0 + r.w - 1 || y >= r.y0 + r.h - 1) continue;
    const t = tileAt(x, y); if (t !== TL.FLOOR && t !== TL.SLUDGE && t !== TL.SPIKE) continue;
    out.push([x, y]); q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
  return out;
}
function setDoors(r, closed) { for (const [x, y] of r.doors) WORLD.tiles[y * WORLD.w + x] = closed ? TL.DOOR : TL.FLOOR; }

// ---- rendering ----
function renderLevel(Wd) {
  const c = document.createElement('canvas'); c.width = Wd.w * T; c.height = Wd.h * T; const x = c.getContext('2d');
  const fi = Wd.fi, get = (a, b) => tileAt(a, b);
  x.fillStyle = col(0); x.fillRect(0, 0, c.width, c.height);
  const R = (a, b, w, h, cc) => { x.fillStyle = cc; x.fillRect(a, b, w, h); };
  for (let ty = 0; ty < Wd.h; ty++) for (let tx = 0; tx < Wd.w; tx++) {
    const t = get(tx, ty), px = tx * T, py = ty * T;
    if (t === TL.FLOOR || t === TL.SLUDGE || t === TL.SPIKE) {
      R(px, py, T, T, col(1));
      if ((tx + ty) % 2 === 0) R(px, py, T, T, fi === 1 ? col(1) : col(1));
      R(px, py, 1, 1, col(2)); // grid seam dots
      if (fi === 1) for (let i = 0; i < 6; i++) R(px + randi(0, 15), py + randi(0, 15), 1, 1, col(2));
      else if (Math.random() < .25) { const sx = px + randi(2, 12), sy = py + randi(2, 12); R(sx, sy, 2, 1, col(2)); R(sx + 1, sy + 1, 1, 1, col(2)); }
      if (fi === 3) { for (let i = 0; i < T; i += 4) R(px + ((i + ty * 16) % T), py + i, 2, 1, col(2)); } // veil: diagonal hatching
      if (fi === 4) { const ccx = (tx % 4) - 1.5, ccy = (ty % 4) - 1.5; if (Math.abs(ccx) + Math.abs(ccy) < 1.1) { R(px + 6, py + 6, 4, 4, col(2)); R(px + 7, py + 7, 2, 2, col(3)); } R(px + T - 1, py, 1, T, col(2)); }
      if (fi === 2) { // hollow: etched lattice + hairline cracks
        if (tx % 3 === 0) R(px, py, 1, T, col(2)); if (ty % 3 === 0) R(px, py, T, 1, col(2));
        if (Math.random() < .07) { let cx = px + randi(2, 13), cy = py + randi(2, 13); for (let i = 0; i < 6; i++) { R(cx, cy, 1, 1, col(0)); cx += randi(-1, 1); cy += 1; } } }
      if (get(tx, ty - 1) === TL.WALL) { R(px, py, T, 3, col(0)); for (let i = 0; i < T; i += 2) R(px + i + (ty & 1), py + 3, 1, 1, col(0)); }
    } else if (t === TL.WALL) {
      const below = get(tx, ty + 1), open = below !== TL.WALL && below !== TL.VOID;
      R(px, py, T, T, col(3));
      for (let i = 0; i < 3; i++) R(px + randi(1, 14), py + randi(1, 9), 1, 1, col(4));
      if (get(tx, ty - 1) !== TL.WALL) R(px, py, T, 1, col(4));
      if (get(tx - 1, ty) !== TL.WALL) R(px, py, 1, T, col(4));
      if (get(tx + 1, ty) !== TL.WALL) R(px + T - 1, py, 1, T, col(2));
      if (open) { R(px, py + 10, T, 6, col(2)); R(px, py + 10, T, 1, col(4)); R(px, py + 15, T, 1, col(0)); for (let i = 3; i < T; i += 5) R(px + i, py + 11, 1, 4, col(1)); }
    } else if (t === TL.PIT) {
      R(px, py, T, T, col(0));
      if (get(tx, ty - 1) !== TL.PIT) { R(px, py, T, 4, col(2)); for (let i = 0; i < T; i++) if ((i + ty) % 2) R(px + i, py + 4, 1, 1, col(2)); R(px, py, T, 1, col(4)); }
    }
  }
  return c;
}
function drawWorld(cx, cy, time) {
  const Wd = WORLD; ctx.drawImage(Wd.level, Math.round(cx), Math.round(cy), W, H, 0, 0, W, H);
  ctx.drawImage(Wd.decal, Math.round(cx), Math.round(cy), W, H, 0, 0, W, H);
  const tx0 = Math.floor(cx / T), ty0 = Math.floor(cy / T), sp = spikeState();
  for (let ty = ty0; ty <= ty0 + 18; ty++) for (let tx = tx0; tx <= tx0 + Math.ceil(W / T) + 1; tx++) {
    const t = tileAt(tx, ty); if (t !== TL.SLUDGE && t !== TL.SPIKE && t !== TL.DOOR && t !== TL.PILLAR) continue;
    const px = Math.round(tx * T - cx), py = Math.round(ty * T - cy);
    if (t === TL.PILLAR) { rect(px, py - 6, T, T + 6, col(4)); rect(px, py - 6, T, 2, col(5)); rect(px, py + T - 4, T, 4, col(2)); rect(px + 3, py - 2, 2, T - 4, col(3)); continue; }
    if (t === TL.SLUDGE) { rect(px, py, T, T, col(2)); for (let i = 0; i < 3; i++) { const w = Math.sin(time * 2 + tx * 1.7 + ty * 2.3 + i * 2) * 4; rect(px + 4 + w + i * 3, py + 3 + i * 5, 4, 1, col(3)); } }
    else if (t === TL.SPIKE) {
      rect(px + 1, py + 1, T - 2, T - 2, col(2));
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const sx = px + 3 + i * 7, sy = py + 3 + j * 7;
        if (sp === 2) { rect(sx + 1, sy - 1, 2, 5, col(5)); rect(sx, sy + 3, 4, 1, col(4)); }
        else if (sp === 1) { rect(sx, sy + 1, 4, 2, ((time * 16) | 0) % 2 ? C.red : col(4)); }
        else rect(sx + 1, sy + 1, 2, 2, col(0)); }
    } else if (t === TL.DOOR) {
      rect(px, py, T, T, col(4)); for (let i = 0; i < T; i += 4) rect(px + i, py, 2, T, col(3));
      rect(px, py + T - 3, T, 3, col(2)); rect(px + 6, py + 6, 4, 4, C.red);
    }
  }
}
// spikes: 0 down, 1 warning, 2 up
function spikeState() { const t = WORLD.spikeT % 3; return t < 1.8 ? 0 : t < 2.2 ? 1 : 2; }

// ink splat on the persistent decal layer — the world slowly gets painted by your build
function splat(x, y, c, n = 10, rr = 10) {
  const d = WORLD.dctx; d.fillStyle = c;
  for (let i = 0; i < n; i++) { const a = rand(0, 6.28), r = rand(0, rr), s = randi(1, 3); const px = Math.round(x + Math.cos(a) * r), py = Math.round(y + Math.sin(a) * r);
    if (blocksShot(tileAtPx(px, py)) || tileAtPx(px, py) === TL.PIT) continue; d.fillRect(px, py, s, s); }
}
