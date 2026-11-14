// ===== ACHROMA enemies II: five new foes and fifteen floor champions (elites with health bars and their own attacks) =====
'use strict';
Object.assign(ESPR, {
  healer: ['...333...', '..35553..', '..344r3..', '...333...', '.355l553.', '.35lll53.', '.355l553.', '..3p553..', '..3...3..', '.33...33.'],
  spinner: ['5.......5', '.5.333.5.', '..5344r..', '..34443..', '.3p444p3.', '..34443..', '.5.3.3.5.', '5..3.3..5'],
  archer: ['..333.....', '.34443....', '.344r3..5.', '..333...5.', '.344433555', '.34p443.5.', '.34443..5.', '..343.....', '..3.3.....', '.33.33....'],
  bombard: ['...333...', '..35553..', '..3r5r3..', '...353...', '.o344433.', 'oo3444443', 'oo3p4443.', '.o34443..', '..3...3..', '.33...33.'],
  empower: ['v.......v', 'vv.333.vv', 'vvv444vvv', '.v34r43v.', '..3ppp3..', '...444...', '...3.3...'],
  // champions (drawn 1.6x)
  ashbrute: ['...33333...', '..3444443..', '..3o444o3..', '..34ppp43..', '33344444333', '34444p44443', '34343434343', '.344444443.', '..344.443..', '.3333.3333.'],
  cinder: ['..o...o....', '.oo.o.oo.o.', '..ooooooo..', '..3o444o3..', '..34o4o43..', '.344444443.', '.34o444o43.', '..3444443..', '.3.3...3.3.'],
  gravekeep: ['...3333....', '..344443...', '..34r443...', '..3555553..', '.33444443..', '3.3444443.o', '3.3p44443oo', '..3444443.o', '...3...3...', '..33...33..'],
  stormcoil: ['c....c....c', '.c.55555.c.', '...5c3c5...', '.c.53r35.c.', '...54345...', '.c.53435.c.', '...5c3c5...', '..3555553..', '.333...333.'],
  arcknight: ['...333.....', '..35553....', '..34r43....', '...333...c.', '.3444443.c.', '34444443cc.', '3.34p4433..', '..34443....', '..3...3....', '.33...33...'],
  herald: ['..c..c.....', '.555.c.....', '.5c5333....', '.5553443...', '.5c534r3...', '.55534433..', '..344444c..', '..3p4443...', '..3...3....', '.33...33...'],
  hollowmaw: ['..3333333..', '.344r4r443.', '34545454543', '34000000043', '340pp0pp043', '34000000043', '34545454543', '.344444443.', '..3.3.3.3..'],
  matron: ['...333.....', '..34r43....', '...333.....', '.334443v.v.', '3444444vvv.', '34v4v44vvvv', '3444444vvv.', '.3444443v..', '3.3...3.3..'],
  seer: ['...33333...', '..3r44r43..', '.34444r443.', '.3r44444r3.', '.344r44443.', '..3444r43..', '..3444443..', '.3.3.3.3.3.', '3..3...3..3'],
  veilknight: ['....333....', '...34443...', '...3g4g3...', '..3444443..', '..3434343..', '.344444443.', '.343444343.', '.344444443.', '..34...43..', '.33.....33.'],
  weaver: ['g..g...g..g', '.g.33333.g.', '..34g4g43..', '.3444r4443.', '.34g444g43.', '..3444443..', '.g.4.4.4.g.', 'g..4.4.4..g', '...4...4...'],
  thorn: ['3.3..3..3.3', '.3.3.3.3.3.', '..3444443..', '.34g4r4g43.', '3444444p443', '34g44444g43', '.344p44443.', '..3444443..', '.3.3.3.3.3.'],
  prismguard: ['.r.......r.', '..3355533..', '.355555553.', '35500r00553', '35555555553', '.355c5c553.', '..3333333..', '.3.3...3.3.', '3..3...3..3'],
  corehulk: ['..3333333..', '.34p444p43.', '34r44444r43', '34445554443', '3445rrr5443', '3445rrr5443', '34445554443', '.34p444p43.', '.33.....33.', '333.....333'],
  nullpriest: ['...3333....', '..344443...', '..355r553..', '...3443....', '..5555555..', '.555p55555.', '.5555p5555.', '.555555555.', '..3.....3..', '.33.....33.'],
});
Object.assign(ETYPES, {
  healer: { hp: 20, r: 5, spd: 34, cost: 3, ink: 4 },
  spinner: { hp: 34, r: 5, spd: 46, cost: 3, ink: 4, contact: 1, heavy: .7 },
  archer: { hp: 22, r: 5, spd: 32, cost: 3, ink: 4 },
  bombard: { hp: 24, r: 5, spd: 30, cost: 2, ink: 3 },
  empower: { hp: 20, r: 5, spd: 40, cost: 3, ink: 4, fly: true },
});
const CHAMP_BASE = { r: 9, spd: 24, cost: 0, ink: 18, contact: 1, heavy: .12, hp: 190 };
// three champions per floor; two random combat rooms on each floor hold one of them
const CHAMPS = [
  [{ id: 'ashbrute', n: N4('HULKING MUTANT', '巨型變異體', '巨大変異体', '巨型变异体'), hp: 230, spd: 20 }, { id: 'cinder', n: N4('BURNING INFECTED', '燃燒的感染者', '燃える感染者', '燃烧的感染者'), hp: 170, fly: true, contact: 0 }, { id: 'gravekeep', n: N4('MORGUE KEEPER', '停屍間看守', '霊安室の番人', '停尸间看守'), hp: 200 }],
  [{ id: 'stormcoil', n: N4('CHARGED SPECIMEN', '帶電樣本', '帯電サンプル', '带电样本'), hp: 210, spd: 10 }, { id: 'arcknight', n: N4('MUTATED GUARD', '變異警衛', '変異した警備員', '变异警卫'), hp: 200, spd: 30 }, { id: 'herald', n: N4('VOLT CARRIER', '電流攜帶者', '電流の保菌者', '电流携带者'), hp: 180, contact: 0 }],
  [{ id: 'hollowmaw', n: N4('GAPING MAW', '裂口巨噬體', '裂けた大口', '裂口巨噬体'), hp: 240, spd: 14 }, { id: 'matron', n: N4('BROOD MOTHER', '孵化母體', '孵化する母体', '孵化母体'), hp: 180, fly: true, contact: 0 }, { id: 'seer', n: N4('MANY-EYED SUBJECT', '複眼觀察體', '複眼の観察体', '复眼观察体'), hp: 170, contact: 0 }],
  [{ id: 'veilknight', n: N4('FOG STALKER', '霧中潛伏者', '霧の潜伏者', '雾中潜伏者'), hp: 220, shield: true }, { id: 'weaver', n: N4('SPORE WEAVER', '孢子編織者', '胞子を紡ぐもの', '孢子编织者'), hp: 180, fly: true, contact: 0 }, { id: 'thorn', n: N4('THORN GROWTH', '荊棘增生體', '茨の増殖体', '荆棘增生体'), hp: 200 }],
  [{ id: 'prismguard', n: N4('LAB SENTINEL', '實驗室哨衛', '研究所の歩哨', '实验室哨卫'), hp: 230, spd: 12 }, { id: 'corehulk', n: N4('CORE ABOMINATION', '核心畸變體', '中枢の異形', '核心畸变体'), hp: 260, spd: 22 }, { id: 'nullpriest', n: N4('THE LOST RESEARCHER', '迷失的研究員', '迷える研究員', '迷失的研究员'), hp: 200, contact: 0 }],
];
const CHAMP = {}; for (const f of CHAMPS) for (const c of f) { CHAMP[c.id] = c; ETYPES[c.id] = Object.assign({}, CHAMP_BASE, { hp: c.hp, spd: c.spd !== undefined ? c.spd : CHAMP_BASE.spd, contact: c.contact !== undefined ? c.contact : 1, fly: !!c.fly, shield: !!c.shield }); }
// new foes join the pools from the floor they first appear on
[['bombard'], ['healer', 'spinner', 'bombard'], ['archer', 'empower', 'healer', 'spinner'], ['archer', 'empower', 'healer', 'spinner', 'bombard'], ['archer', 'empower', 'healer', 'spinner', 'bombard', 'archer']].forEach((add, f) => POOLS[f].push(...add));

const eb = (n) => Math.max(1, Math.round(n * diffV('barrage'))); // champion / foe bullet counts scale with difficulty
function pickChampRooms(fi) {
  let rooms = WORLD.rooms.filter(r => r.type === 'combat' && r.champRoom); if (rooms.length < 2) rooms = rooms.concat(shuffle(WORLD.rooms.filter(r => r.type === 'combat' && !r.champRoom)).slice(0, 2 - rooms.length));
  rooms.forEach(r => { r.champ = choice(CHAMPS[fi]).id; });
}
function spawnChamp(r) {
  const tiles = roomFloorTiles(r).filter(([x, y]) => dist(x * T + 8, y * T + 8, G.p.x, G.p.y) > 90 && !trapDanger(x * T + 8, y * T + 8, 14) && x > r.x0 + 2 && x < r.x0 + r.w - 3 && y > r.y0 + 2 && y < r.y0 + r.h - 3), [tx, ty] = choice(tiles.length ? tiles : roomFloorTiles(r));
  const e = spawnEnemy(r.champ, tx * T + 8, ty * T + 8, { room: r }); e.champ = true; e.elite = true; e.scale = 1.6; e.cd = 1.6; AU.play('roar', 1.5, .5);
  return e;
}
function cMech(e, o) { return mech(Object.assign({ owner: e, cancelOnDeath: true, small: true }, o)); }
function roomBox(e) { const r = e.room || roomAt(e.x, e.y); return r ? { x0: (r.x0 + 1) * T, y0: (r.y0 + 1) * T, x1: (r.x0 + r.w - 1) * T, y1: (r.y0 + r.h - 1) * T, cx: r.cx * T + 8, cy: r.cy * T + 8 } : { x0: e.x - 160, y0: e.y - 120, x1: e.x + 160, y1: e.y + 120, cx: e.x, cy: e.y }; }
function keepAt(e, dt, d, a, sp, want) { const sa = a + (d < want - 20 ? Math.PI : d > want + 30 ? 0 : 1.57 * Math.sign(Math.sin(e.wob + e.t * .4))); steer(e, e.x + Math.cos(sa) * 20, e.y + Math.sin(sa) * 20, sp, dt); }
function ringShot(x, y, n, s, o = {}, off = 0, gap = 0) { for (let i = 0; i < n; i++) { if (gap && i < gap) continue; eshot(x, y, off + i / n * 6.283, s, o); } }

Object.assign(AI, {
  // ---- normal foes ----
  healer(e, dt, d, a, sp) { e.face = a;
    if (e.st === 'cast') { if (e.t > .8) { const tg = e.tg; if (tg && !tg.dead) { tg.hp = Math.min(tg.maxHp, tg.hp + tg.maxHp * .3); burst(tg.x, tg.y, 14, C.lime, 90, .5); ringFx(tg.x, tg.y, tg.r + 8, C.lime, .4, 2); AU.play('heal', .8, .5); } e.st = 'idle'; e.cd = rand(3.5, 4.5); } return; }
    keepAt(e, dt, d, a, sp, 130);
    if (e.cd <= 0) { let best = null, bh = .85; for (const o of G.enemies) { if (o.dead || o === e || o.boss || o.spawnT > 0 || dist(o.x, o.y, e.x, e.y) > 140) continue; const f = o.hp / o.maxHp; if (f < bh) { bh = f; best = o; } }
      if (best) { e.tg = best; e.st = 'cast'; e.t = 0; AU.play('cast', 1.4, .5); } else e.cd = .8; } },
  spinner(e, dt, d, a, sp) {
    if (e.st === 'wind') { e.face += dt * 20 * e.t; if (e.t > .55) { e.st = 'spin'; e.t = 0; AU.play('whirl'); } return; }
    if (e.st === 'spin') { e.face += dt * 26; steer(e, G.p.x, G.p.y, sp * 1.45, dt);
      if (every(e.t, dt, .22 / bpace())) { for (const k of [0, Math.PI]) eshot(e.x, e.y, e.face + k, 70, { c: C.orange, life: 2.4 }); }
      if (G.p.alive && dist(e.x, e.y, G.p.x, G.p.y) < 14 + G.p.r) hurtPlayer(1, e.x, e.y);
      if (e.t > 2.2) { e.st = 'dizzy'; e.t = 0; } return; }
    if (e.st === 'dizzy') { if (e.t > 1) { e.st = 'idle'; e.cd = rand(2, 3); } return; }
    steer(e, G.p.x, G.p.y, sp, dt); e.face = a;
    if (e.cd <= 0 && d < 90) { e.st = 'wind'; e.t = 0; AU.play('telegraph', .7); } },
  archer(e, dt, d, a, sp) {
    if (e.st === 'draw') { if (e.t < .8) e.face += clamp(angDiff(e.face, a), -4 * dt, 4 * dt);
      if (e.t > 1.1) { eshot(e.x, e.y, e.face, 290, { r: 4, c: C.gold, life: 3 }); if (eb(2) >= 2) for (const s2 of [-.22, .22]) eshot(e.x, e.y, e.face + s2, 210, { c: C.gold }); AU.play('bow'); e.st = 'idle'; e.cd = rand(2.6, 3.4); } return; }
    keepAt(e, dt, d, a, sp, 160);
    if (e.cd <= 0 && d < 280 && los(e.x, e.y, G.p.x, G.p.y)) { e.st = 'draw'; e.t = 0; e.face = a; AU.play('telegraph', 1.6); } },
  bombard(e, dt, d, a, sp) { e.face = a;
    if (e.st === 'throw') { if (e.t > .45) { const sp2 = clamp(d * 1.3, 80, 200); G.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * sp2, vy: Math.sin(a) * sp2, r: 4, life: 3, c: C.orange, bomb: 1.25, ghostWall: false }); AU.play('lob'); e.st = 'idle'; e.cd = rand(2.6, 3.4); } return; }
    keepAt(e, dt, d, a, sp, 140);
    if (e.cd <= 0 && d < 240) { e.st = 'throw'; e.t = 0; } },
  empower(e, dt, d, a, sp) { e.face = a;
    if (!e.link || e.link.dead || dist(e.x, e.y, e.link.x, e.link.y) > 170) { e.link = null; let best = null, bh = 0; for (const o of G.enemies) { if (o.dead || o === e || o.boss || o.type === 'empower' || o.spawnT > 0) continue; const dd = dist(o.x, o.y, e.x, e.y); if (dd < 160 && o.maxHp > bh) { bh = o.maxHp; best = o; } } e.link = best; }
    if (e.link) { e.link.buffT = .25; const lx = e.link.x + Math.cos(a + Math.PI) * 40, ly = e.link.y + Math.sin(a + Math.PI) * 40; steer(e, lx, ly, sp, dt); }
    else keepAt(e, dt, d, a, sp, 150);
    if (e.cd <= 0) { eshot(e.x, e.y, a, 90, { c: C.violet }); e.cd = rand(2.2, 3); } },

  // ---- floor 1 champions ----
  ashbrute(e, dt, d, a, sp) { e.face = a;
    if (e.st === 'slam') { if (e.t > 1.15) { AU.play('slam'); shake(.35, true); ringFx(e.x, e.y, 46, col(5), .3, 3); ringShot(e.x, e.y, eb(18), 80, { c: C.orange }, rand(0, 6), 2); e.st = 'idle'; e.cd = rand(2.6, 3.2); } return; }
    steer(e, G.p.x, G.p.y, sp, dt);
    if (e.cd <= 0 && d < 120) { e.st = 'slam'; e.t = 0; cMech(e, { type: 'circle', x: e.x, y: e.y, r: 44, warn: 1.15, small: false, follow: true }); AU.play('telegraph', .6); } },
  cinder(e, dt, d, a, sp) { e.face = a;
    if (e.st === 'spiral') { if (every(e.t, dt, .12 / bpace())) for (let i = 0; i < 3; i++) eshot(e.x, e.y, e.t * 2.2 + i * 2.094, 70, { c: C.orange }); if (e.t > 2.4) { e.st = 'idle'; e.cd = 1.2; e.n = (e.n || 0) + 1; } return; }
    if (e.st === 'flare') { if (e.t > .5) { for (let i = -2; i <= 2; i++) eshot(e.x, e.y, a + i * .16, 120, { c: C.red }); AU.play('ebullet'); e.st = 'idle'; e.cd = 1.4; e.n = (e.n || 0) + 1; } return; }
    keepAt(e, dt, d, a, sp, 120);
    if (e.cd <= 0) { e.st = (e.n || 0) % 2 ? 'flare' : 'spiral'; e.t = 0; AU.play('cast', 1.1, .6); } },
  gravekeep(e, dt, d, a, sp) { e.face = a;
    if (e.st === 'raise') { if (e.t > .9) { const n = G.enemies.filter(o => !o.dead && o.type === 'mini' && o.room === e.room).length; for (let i = 0; i < Math.min(2, 6 - n); i++) { const m = spawnEnemy('mini', e.x + rand(-20, 20), e.y + rand(-20, 20), { room: e.room }); m.spawnT = .5; } e.st = 'idle'; e.cd = 3.85; } return; }
    steer(e, G.p.x, G.p.y, sp * (d < 90 ? -1 : 1), dt);
    e.fan = (e.fan || 1.5) - dt; if (e.fan <= 0) { e.fan = 1.8; for (let i = -1; i <= 1; i++) eshot(e.x, e.y, a + i * .25, 105, { c: C.orange }); AU.play('ebullet'); }
    if (e.cd <= 0) { e.st = 'raise'; e.t = 0; e.cd = 6; AU.play('cast', .7); ringFx(e.x, e.y, 30, C.orange, .6, 2); } },

  // ---- floor 2 champions ----
  stormcoil(e, dt, d, a, sp) { e.face = a;
    if (e.st === 'storm') { if (every(e.t, dt, .1 / bpace())) for (let i = 0; i < 4; i++) eshot(e.x, e.y, e.t * 1.1 * e.dir + i * 1.5708, 85, { c: C.cyan }); if (e.t > 3) { e.st = 'idle'; e.cd = rand(1.4, 2); } return; }
    steer(e, e.x + Math.cos(e.t) * 10, e.y + Math.sin(e.t) * 10, sp, dt);
    if (e.cd <= 0) { e.st = 'storm'; e.t = 0; e.dir = Math.random() < .5 ? 1 : -1; AU.play('zap', .7); } },
  arcknight(e, dt, d, a, sp) {
    if (e.st === 'aim') { if (e.t < .4) e.face = ang(e.x, e.y, G.p.x, G.p.y); if (e.t > .55) { e.st = 'dash'; e.t = 0; AU.play('dash'); } return; }
    if (e.st === 'dash') { const hit = moveBody(e, Math.cos(e.face) * 300 * dt, Math.sin(e.face) * 300 * dt); e.drop = (e.drop || 0) - dt;
      if (e.drop <= 0) { e.drop = .07 / bpace(); G.ebullets.push({ x: e.x, y: e.y, vx: 0, vy: 0, r: 2.5, life: 3, delay: .55, c: C.cyan, burstA: e.face, arcK: 1 }); }
      if (hit || e.t > .45) { e.n = (e.n || 0) + 1; for (const q of G.ebullets) if (q.arcK && q.vx === 0) { const s2 = q.burstA + (Math.random() < .5 ? 1.57 : -1.57); q.vx = Math.cos(s2) * 55; q.vy = Math.sin(s2) * 55; q.arcK = 0; }
        if (e.n < 3) { e.st = 'aim'; e.t = 0; } else { e.st = 'idle'; e.n = 0; e.cd = rand(2.2, 3); } } return; }
    steer(e, G.p.x, G.p.y, sp, dt); e.face = a;
    if (e.cd <= 0 && d < 220) { e.st = 'aim'; e.t = 0; AU.play('telegraph', .9); } },
  herald(e, dt, d, a, sp) { e.face = a;
    if (e.st === 'lanes') { if (e.t > 1.1) { for (const la of e.lanes) for (let k = 0; k < eb(4); k++) eshot(e.x, e.y, la, 150 + k * 30, { c: C.cyan }); AU.play('zap'); e.st = 'idle'; e.cd = rand(1.8, 2.4); } return; }
    keepAt(e, dt, d, a, sp, 130);
    if (e.cd <= 0 && los(e.x, e.y, G.p.x, G.p.y)) { e.st = 'lanes'; e.t = 0; e.lanes = [a - .45, a, a + .45]; for (const la of e.lanes) cMech(e, { type: 'lane', x: e.x, y: e.y, a: la, len: 260, w: 12, warn: 1.1, follow: true, draw: drawLane }); AU.play('telegraph', 1.2); } },

  // ---- floor 3 champions ----
  hollowmaw(e, dt, d, a, sp) { e.face = a;
    if (e.st === 'pull') { const p = G.p; if (p.alive && p.dashT <= 0 && d > 14) moveBody(p, (e.x - p.x) / d * 34 * dt, (e.y - p.y) / d * 34 * dt);
      if (Math.random() < .5) { const aa = rand(0, 6.28), r = rand(40, 80); part({ x: e.x + Math.cos(aa) * r, y: e.y + Math.sin(aa) * r, vx: -Math.cos(aa) * r * 1.5, vy: -Math.sin(aa) * r * 1.5, life: .5, max: .5, c: C.violet, s: 1 }); }
      if (every(e.t, dt, .6)) ringShot(e.x, e.y, eb(12), 60, { c: C.violet }, e.t, 0);
      if (e.t > 2.6) { e.st = 'idle'; e.cd = rand(2.4, 3); } return; }
    steer(e, G.p.x, G.p.y, sp, dt);
    if (e.cd <= 0 && d < 200) { e.st = 'pull'; e.t = 0; AU.play('vortex', .7); } },
  matron(e, dt, d, a, sp) { e.face = a;
    if (e.st === 'echo') { if (e.t > .7 && !e.f1) { e.f1 = 1; for (let i = -2; i <= 2; i++) eshot(e.x, e.y, a + i * .18, 100, { c: C.violet }); AU.play('ebullet'); }
      if (e.t > 1.4) { const p = G.p, mx = 2 * p.x - e.x, my = 2 * p.y - e.y, ma = ang(mx, my, p.x, p.y); for (let i = -2; i <= 2; i++) eshot(mx, my, ma + i * .18, 90, { c: col(5), ghostWall: true, life: 3 }); AU.play('ebullet', .7); e.st = 'idle'; e.cd = rand(2, 2.8); }
      return; }
    keepAt(e, dt, d, a, sp, 110);
    if (e.cd <= 0) { e.st = 'echo'; e.t = 0; e.f1 = 0; const p = G.p; cMech(e, { type: 'circle', x: 2 * p.x - e.x, y: 2 * p.y - e.y, r: 10, warn: 1.4 }); AU.play('cast', 1.3, .6); } },
  seer(e, dt, d, a, sp) {
    if (e.st === 'aim') { if (e.t < .9) e.face += clamp(angDiff(e.face, a), -3 * dt, 3 * dt); if (e.t > 1.3) { for (const s2 of [-.2, 0, .2]) eshot(e.x, e.y, e.face + s2, 330, { r: 3, c: C.violet }); AU.play('rail', 1.2, .35); e.st = 'idle'; e.cd = rand(1.8, 2.4); } return; }
    keepAt(e, dt, d, a, sp, 170); e.face = a;
    if (e.cd <= 0 && los(e.x, e.y, G.p.x, G.p.y)) { e.st = 'aim'; e.t = 0; AU.play('telegraph', 2); } },

  // ---- floor 4 champions ----
  veilknight(e, dt, d, a, sp) { e.face += clamp(angDiff(e.face, a), -1.4 * dt, 1.4 * dt);
    if (e.st === 'judge') { if (e.t > (e.next || 0) && e.n < 2) { const p = G.p; cMech(e, { type: 'circle', x: p.x, y: p.y, r: 30, warn: 1.1 - e.n * .2, small: false, onResolve: q => ringShot(q.x, q.y, eb(10), 75, { c: C.gold }, rand(0, 6)) }); e.n++; e.next = e.t + .9; AU.play('telegraph', 1.1); }
      if (e.t > 2.6) { e.st = 'idle'; e.cd = rand(1.8, 2.6); } return; }
    steer(e, G.p.x, G.p.y, sp, dt);
    if (every(e.t, dt, 1.6)) { for (let i = -2; i <= 2; i++) eshot(e.x, e.y, e.face + i * .2, 100, { c: C.gold }); AU.play('ebullet'); }
    if (e.cd <= 0) { e.st = 'judge'; e.t = 0; e.n = 0; e.next = 0; } },
  weaver(e, dt, d, a, sp) { e.face = a;
    if (e.st === 'weave') { if (e.t > 2) { e.st = 'idle'; e.cd = rand(2, 2.6); } return; }
    keepAt(e, dt, d, a, sp, 130);
    if (every(e.t, dt, 1.1)) { for (let i = 0; i < 3; i++) eshot(e.x, e.y, a + (i - 1) * .4, 55, { c: C.gold, life: 4 }); }
    if (e.cd <= 0) { e.st = 'weave'; e.t = 0; const p = G.p, gap = randi(0, 5); for (let i = 0; i < 6; i++) { if (i === gap) continue; const aa = i / 6 * 6.283; cMech(e, { type: 'circle', x: p.x + Math.cos(aa) * 34, y: p.y + Math.sin(aa) * 34, r: 20, warn: 1.4 + i * .08 }); } cMech(e, { type: 'circle', x: p.x, y: p.y, r: 16, warn: 2 }); AU.play('cast', .9); } },
  thorn(e, dt, d, a, sp) { e.face = a;
    steer(e, G.p.x, G.p.y, sp * (d < 80 ? -1 : .7), dt);
    if (e.cd <= 0) { e.dir = -(e.dir || 1); const n = eb(10); for (let i = 0; i < n; i++) eshot(e.x, e.y, i / n * 6.283 + e.t, 75, { c: C.gold, curve: e.dir * .9, life: 4 }); AU.play('ebullet', .8); e.cd = rand(1.3, 1.8); } },

  // ---- floor 5 champions ----
  prismguard(e, dt, d, a, sp) { e.face = a; steer(e, e.x + Math.cos(e.t * .7) * 10, e.y + Math.sin(e.t * .7) * 10, sp, dt);
    if (e.cd <= 0) { e.cd = rand(3.6, 4.4); const a0 = a + Math.PI / 4, dir = Math.random() < .5 ? 1 : -1; for (let i = 0; i < 2; i++) G.lasers.push({ owner: e, a: a0 + i * Math.PI, va: dir * .7, len: 150, w: 6, warn: 1, life: 2.6, c: [C.red, C.cyan][i] }); AU.play('telegraph', .6); }
    if (every(e.t, dt, .9)) { const cs = [C.red, C.cyan, C.gold]; for (let i = 0; i < eb(9); i++) eshot(e.x, e.y, i / eb(9) * 6.283 + e.t, 60, { c: cs[i % 3] }); } },
  corehulk(e, dt, d, a, sp) {
    if (e.st === 'wind') { if (e.t < .55) e.face = ang(e.x, e.y, G.p.x, G.p.y); if (e.t > .8) { e.st = 'dash'; e.t = 0; AU.play('dash'); } return; }
    if (e.st === 'dash') { const hit = moveBody(e, Math.cos(e.face) * 280 * dt, Math.sin(e.face) * 280 * dt); if (Math.random() < .7) part({ x: e.x, y: e.y, life: .3, max: .3, c: C.red, s: 2 });
      if (hit || e.t > .7) { shake(.3, true); AU.play('slam', .8); ringFx(e.x, e.y, 40, C.red, .3, 3); ringShot(e.x, e.y, eb(16), 90, { c: C.red }, rand(0, 6), 2); e.st = 'stun'; e.t = 0; } return; }
    if (e.st === 'stun') { if (e.t > .9) { e.st = 'idle'; e.cd = rand(1.6, 2.2); } return; }
    steer(e, G.p.x, G.p.y, sp, dt); e.face = ang(e.x, e.y, G.p.x, G.p.y);
    if (e.cd <= 0 && d < 220) { e.st = 'wind'; e.t = 0; AU.play('telegraph', .7); } },
  nullpriest(e, dt, d, a, sp) { e.face = a;
    keepAt(e, dt, d, a, sp, 140);
    if (e.cd <= 0) { e.cd = rand(3, 3.6); const A = roomBox(e); cMech(e, { type: 'plus', x: G.p.x, y: G.p.y, w: 18, warn: 1.6, lockAt: 1, A, draw: drawPlus, onResolve: q => { for (let i = 0; i < 4; i++) eshot(q.x, q.y, i * 1.571, 80, { c: C.red }); } }); AU.play('telegraph', 1.4); }
    if (every(e.t, dt, 2.2)) { for (let i = 0; i < 2; i++) { const aa = a + (i ? 1.2 : -1.2); G.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(aa) * 90, vy: Math.sin(aa) * 90, r: 3.5, life: 4.5, c: C.red, homing: 1.3, homeT: 2.2 }); } AU.play('ebullet', .6); } },
});
ETYPES.bombard.onDeath = null;
// bombs: slow, then burst into a ring (and a small blast)
function updateBomb(b, dt) { b.bomb -= dt; b.vx *= Math.pow(.15, dt); b.vy *= Math.pow(.15, dt);
  if (b.bomb > 0) return false; const p = G.p; explode(b.x, b.y, 22, 0, { color: C.orange, small: true }); if (p.alive && dist(b.x, b.y, p.x, p.y) < 22 + p.r) hurtPlayer(1, b.x, b.y);
  ringShot(b.x, b.y, eb(8), 75, { c: C.orange }, rand(0, 6)); return true; }
function drawEnemyExtra(e, x, cyb) {
  if (e.type === 'healer' && e.st === 'cast' && e.tg && !e.tg.dead) { const tx = e.tg.x - (e.x - x), ty = e.tg.y - (e.y - cyb); for (let i = 0; i <= 10; i++) { const q = i / 10; if ((i + ((G.time * 20) | 0)) % 2) rect(lerp(x, tx, q), lerp(cyb, ty, q), 1, 1, C.lime); } ringC(x, cyb, 10 - e.t * 6, C.lime, 1); }
  if (e.type === 'spinner' && (e.st === 'wind' || e.st === 'spin')) { ctx.globalAlpha = e.st === 'wind' ? .5 + Math.sin(G.time * 30) * .3 : .5; ringC(x, cyb, 14, C.orange, 1); ctx.globalAlpha = 1; }
  if (e.type === 'spinner' && e.st === 'dizzy') for (let i = 0; i < 3; i++) rect(x + Math.cos(G.time * 6 + i * 2) * 6, cyb - 9, 1, 1, col(5));
  if ((e.type === 'archer' || e.type === 'seer') && (e.st === 'draw' || e.st === 'aim')) { const lock = e.t > (e.type === 'seer' ? .9 : .8); ctx.globalAlpha = lock ? (((e.t * 30) | 0) % 2 ? 1 : .3) : .4;
    for (const s2 of e.type === 'seer' ? [-.2, 0, .2] : [0]) line(x, cyb, x + Math.cos(e.face + s2) * 300, cyb + Math.sin(e.face + s2) * 300, e.type === 'seer' ? C.violet : C.gold, 1); ctx.globalAlpha = 1; }
  if (e.type === 'bombard' && e.st === 'throw') rect(x - 1, cyb - 7, 3, 3, ((G.time * 14) | 0) % 2 ? C.orange : col(5));
  if (e.type === 'empower' && e.link && !e.link.dead) { const lx = e.link.x - (e.x - x), ly = e.link.y - (e.y - cyb); for (let i = 0; i <= 14; i++) { const q = i / 14, w2 = Math.sin(G.time * 10 + i) * 2; rect(lerp(x, lx, q) + w2, lerp(cyb, ly, q), 1, 1, i % 2 ? C.violet : col(5)); } }
  if (e.buffT > 0) { ctx.globalAlpha = .45 + Math.sin(G.time * 12) * .2; ringC(x, cyb, e.r + 4 * (e.scale || 1), C.violet, 1); ctx.globalAlpha = 1; }
  if ((e.type === 'arcknight' && e.st === 'aim') || (e.type === 'corehulk' && e.st === 'wind')) { ctx.globalAlpha = ((e.t * 16) | 0) % 2 ? .9 : .4; line(x, cyb, x + Math.cos(e.face) * 160, cyb + Math.sin(e.face) * 160, C.red, 1); ctx.globalAlpha = 1; }
  if (e.type === 'hollowmaw' && e.st === 'pull') { for (let i = 0; i < 3; i++) ringC(x, cyb, 20 + ((G.time * 40 + i * 20) % 60), C.violet, 1); }
}
// champions: a name and a wide health bar in the crisp UI pass
function drawChampBars(cx, cy) {
  for (const e of G.enemies) { if (!e.champ || e.dead || e.spawnT > 0) continue; const x = Math.round(e.x - cx), y = Math.round(e.y - cy - e.r * (e.scale || 1) - 20), w = 40, f = Math.max(0, e.hp / e.maxHp);
    if (x < -40 || x > W + 40 || y < -20 || y > H + 20) continue;
    rect(x - w / 2 - 1, y - 1, w + 2, 5, col(0)); rect(x - w / 2, y, w, 3, '#2d2925'); rect(x - w / 2, y, w * f, 3, e.buffT > 0 ? C.violet : C.gold); rect(x - w / 2, y, w * f, 1, '#fff1b8');
    const nm = tr(CHAMP[e.type].n); textS(nm, x, y - (isCJK(nm) ? 10 : 8), C.gold, 1, 'center'); }
}
