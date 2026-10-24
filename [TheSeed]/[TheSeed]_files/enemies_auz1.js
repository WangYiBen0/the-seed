// ===== ACHROMA enemies =====
'use strict';
// the infected (they face right; the game flips them): grays of the floor, blood (p), eyes (r), pus (l)
const ESPR = {
  crawler: ['..3333.....', '.344443.33.', '34444443443', '3p44p4434r3', '.3433343p3.', '.3.3..3.3..', '3..3..3..3.'],
  mini: ['....33.', '.33444.', '34444r3', '3p4443.', '.3..3..'],
  gunner: ['...333....', '..34443...', '..344r3...', '...333....', '..3444355.', '.34p44333.', '.3444433..', '..3443....', '..3..3....', '.33..33...'],
  charger: ['....3.3.....', '..3343433...', '.344444443..', '34444444443.', '3p444p444433', '.344444434r5', '..3333.33335', '..3..3..3..3'],
  splitter: ['...33333...', '..3444l43..', '.344p44443.', '34l4444p443', '3444r44r443', '34p444444l3', '.344pp4443.', '..3444443..', '..3.3.3.3..'],
  turret: ['....333.....', '...34443....', '..3455543555', '..345r543333', '..3455543...', '...34443....', '....333.....', '...3.3.3....', '..3..3..3...', '.232323232..'],
  bomber: ['...333...', '..34r3...', '...33....', '.3444443.', '344p4p443', '34p4r4p43', '344p4p443', '.3444443.', '..3...3..', '.33...33.'],
  shielder: ['...333....', '..35553...', '..34r43...', '...333....', '..344433..', '.3444443..', '.34p4443..', '..34443...', '..3...3...', '.33...33..'],
  wisp: ['...333...', '..34443..', '.3l444l3.', '34444r443', '3444l4443', '.3444443.', '..3.3.3..', '..3.3..3.', '.3..3...3'],
  sniper: ['..333......', '.34443.....', '.344r3.....', '..333......', '.3444355555', '.3444333...', '.34443.....', '..343......', '..3.3......', '.33.33.....'],
  mortar: ['........33.', '..333..343.', '.34443343..', '.35r5343...', '.344433....', '3444443....', '34p4443....', '.34443.....', '.3...3.....', '33...33....'],
  warden: ['....3333......', '...344443.....', '...34r4r3.....', '...3pppp3.....', '.3334444333...', '34444444444333', '3444p44p444443', '34343434344443', '3443434344443.', '.34444444443..', '..3444.4443...', '..344...443...', '.3333..3333...'],
  echo: ['..55555..', '.5555555.', '550555055', '5555p5555', '.55p0p55.', '4.5p0p5.4', '4..p4p..4', '...4.4...'],
};
const ETYPES = {
  crawler: { hp: 14, r: 4, spd: 64, cost: 1, ink: 2, contact: 1 },
  mini: { hp: 6, r: 3, spd: 80, cost: 0, ink: 1, contact: 1, minion: true },
  gunner: { hp: 22, r: 5, spd: 42, cost: 2, ink: 3 },
  charger: { hp: 36, r: 6, spd: 34, cost: 3, ink: 4, contact: 1, heavy: .6 },
  splitter: { hp: 30, r: 6, spd: 36, cost: 2, ink: 3, contact: 1 },
  turret: { hp: 55, r: 6, spd: 0, cost: 3, ink: 4, heavy: .05 },
  bomber: { hp: 12, r: 4, spd: 88, cost: 1, ink: 2 },
  shielder: { hp: 44, r: 6, spd: 32, cost: 3, ink: 4, contact: 1, heavy: .5, shield: true },
  wisp: { hp: 22, r: 5, spd: 30, cost: 2, ink: 3, fly: true },
  sniper: { hp: 18, r: 5, spd: 30, cost: 3, ink: 4 },
  echo: { hp: 160, r: 6, spd: 70, cost: 0, ink: 6, fly: true },
  mortar: { hp: 30, r: 5, spd: 28, cost: 3, ink: 4 },
  warden: { hp: 80, r: 7, spd: 26, cost: 4, ink: 6, contact: 1, heavy: .4 },
};
const POOLS = [
  ['crawler', 'crawler', 'gunner', 'gunner', 'charger', 'splitter', 'bomber'],
  ['crawler', 'gunner', 'charger', 'splitter', 'bomber', 'turret', 'shielder', 'wisp', 'wisp'],
  ['crawler', 'gunner', 'charger', 'splitter', 'bomber', 'turret', 'shielder', 'wisp', 'sniper', 'sniper', 'mortar'],
  ['crawler', 'gunner', 'charger', 'splitter', 'bomber', 'turret', 'shielder', 'wisp', 'sniper', 'mortar', 'mortar', 'warden'],
  ['crawler', 'gunner', 'charger', 'bomber', 'turret', 'shielder', 'wisp', 'sniper', 'mortar', 'warden', 'warden', 'splitter'],
];
const AFFIXES = { haste: { c: () => C.orange }, warded: { c: () => C.cyan }, volatile: { c: () => C.red } };

// Opening exploration floors only; endless themes and invasion keep their own balance.
function exploreHealthMul(kind) {
  if (G.mode === 'invade' || G.endless || (G.floor !== 0 && G.floor !== 1)) return 1;
  return (kind === 'boss' ? [.82, .75] : kind === 'elite' ? [.8, .75] : [.85, .8])[G.floor];
}
function spawnEnemy(type, x, y, o = {}) { if (!o.boss && G && !G.preview && typeof cxSeen === 'function') cxSeen('e:' + type);
  // HP scales with depth AND with the player's build, so a fully built run still has to work for it
  const d = ETYPES[type], fi = statFloor(), hpMul = (1 + fi * .55 + fi * fi * .12) * (1 + .2 * (G.curse || 0)) * powerScale() * (o.boss ? 1 : diffV('mhp'));
  const e = Object.assign({ type, x, y, vx: 0, vy: 0, kx: 0, ky: 0, face: 0, flash: 0, spawnT: o.instant ? 0 : SPAWN_T, dead: false, burn: 0, burnT: 0, bt: 0, venom: 0, venomT: 0, chill: 0, slowT: 0, slowMul: 1, frozen: 0,
    st: 'idle', t: rand(0, 1), cd: rand(.8, 2), hurtT: 0, inv: 0, sflash: 0, stuck: 0, wob: rand(0, 6), cc: {}, land: 0 }, d, o);
  const openingHp = o.boss ? 1 : exploreHealthMul(e.elite || e.champ || (typeof CHAMP !== 'undefined' && CHAMP[type]) ? 'elite' : 'normal');
  e.hp = e.maxHp = d.hp * hpMul * (e.elite ? 2.6 : 1) * openingHp; if (e.elite) { e.r += 1; e.ink *= 3; e.spd *= 1.1; if (fi >= 1 && !o.minion) e.affix = choice(Object.keys(AFFIXES)); }
  if (e.affix === 'haste') e.spd *= 1.35;
  e.fly = !!d.fly; e.heavy = d.heavy || 1;
  if (!o.boss && collides(e.x, e.y, e.r, e.fly)) { const q = freeSpot(e.x, e.y, e.r, e.fly) || (o.room ? (() => { const t = choice(roomFloorTiles(o.room)); return t ? [t[0] * T + 8, t[1] * T + 8] : null; })() : null); if (q) { e.x = q[0]; e.y = q[1]; } }
  G.enemies.push(e);
  if (!o.instant) AU.play('spawnIn');
  return e;
}
function los(x1, y1, x2, y2) { const d = dist(x1, y1, x2, y2), n = Math.ceil(d / 8); for (let i = 1; i < n; i++) { const t = i / n; if (shotBlocked(lerp(x1, x2, t), lerp(y1, y2, t))) return false; } return true; }
function addEnemyBullet(shot) {
  const owner = shot.own === undefined ? G.curShooter : shot.own;
  if (owner) shot.own = owner;
  if (owner && owner.boss && G.mode !== 'invade' && !G.endless && G.floor === 1) {
    // Remove one in four/five actual projectiles, once, including delayed volleys.
    // Keep attack timing, speed, telegraphs and the existing safe lanes intact.
    const everyN = G.diff === 'hard' || G.diff === 'despair' ? 4 : 5;
    owner.openingShotN = (owner.openingShotN || 0) + 1;
    if (owner.openingShotN % everyN === 0) return;
  }
  G.ebullets.push(shot);
}
function eshot(x, y, a, spd, o = {}) { spd *= 1 + .1 * (G.curse || 0) + .07 * statFloor(); addEnemyBullet(Object.assign({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, r: 3, life: 5 }, o)); }
const SPAWN_T = .9;
function steer(e, tx, ty, spd, dt) {
  const a = ang(e.x, e.y, tx, ty); let mx = Math.cos(a) * spd * dt, my = Math.sin(a) * spd * dt;
  if (e.stuck > 0) { e.stuck -= dt; mx = Math.cos(e.sa) * spd * dt; my = Math.sin(e.sa) * spd * dt; }
  const ox = e.x, oy = e.y; moveBody(e, mx, my);
  if (spd > 0 && dist(ox, oy, e.x, e.y) < spd * dt * .3 && e.stuck <= 0) { e.stuck = .5; e.sa = a + (Math.random() < .5 ? 1.6 : -1.6); }
}
function updateEnemies(dt) {
  const p = G.p, S = G.S;
  for (const e of G.enemies) {
    if (e.dead) continue;
    e.flash -= dt; e.hurtT -= dt; e.sflash -= dt; e.inv -= dt; e.land -= dt;
    if (e.spawnT > 0) { const before = e.spawnT; e.spawnT -= dt;
      // ink converges onto the sigil, then the body lands
      if (e.spawnT > .3 && Math.random() < .7) part({ t: 'conv', tf: () => [e.x, e.y], tx: e.x, ty: e.y, a: rand(0, 6.28), r: rand(18, 30), x: e.x, y: e.y, life: .45, max: .45, c: Math.random() < .3 ? (e.elite ? C.gold : C.red) : col(4), s: 1 });
      if (before > .3 && e.spawnT <= .3) AU.play('spawnHit');
      if (e.spawnT <= 0) { e.land = .25; burst(e.x, e.y, 14, col(5), 110, .35); ringFx(e.x, e.y, 18, col(5), .25, 2); ringFx(e.x, e.y, 10, e.elite ? C.gold : C.red, .3, 1); starFx(e.x, e.y, 6, col(5), .1); e.flash = .1; splat(e.x, e.y, col(2), 10, 9); }
      continue; }
    if(modifierEnemyTick(e,dt))continue;
    ccDecay(e, dt);
    if (dotTick(e, dt)) continue;
    if (e.slowT > 0) e.slowT -= dt; else { e.chill = 0; e.slowMul = 1; }
    if (e.frozen > 0) { e.frozen -= dt; e.kx *= .8; e.ky *= .8; continue; }
    if ((e.sleepT > G.time || e.stunT > G.time) && !e.boss) { e.kx *= .8; e.ky *= .8; continue; } // put to sleep (tranquilizer darts)
    const slow = (e.slowT > 0 ? e.slowMul : 1) * (tileAtPx(e.x, e.y) === TL.SLUDGE && !e.fly ? .6 : 1);
    // knockback
    if (Math.abs(e.kx) + Math.abs(e.ky) > 1) { const hit = moveBody(e, e.kx * dt, e.ky * dt); if (hit && Math.hypot(e.kx, e.ky) > 150) { hitEnemy(e, 4, { proc: 0, knock: 0 }); shake(.05); burst(e.x, e.y, 5, col(4), 60, .2); e.kx = e.ky = 0; } const k = Math.pow(.0008, dt); e.kx *= k; e.ky *= k; }
    // spikes hurt enemies too
    if (tileAtPx(e.x, e.y) === TL.SPIKE && !e.fly && spikeState() === 2 && (e.spk || 0) < G.time) { e.spk = G.time + 1; hitEnemy(e, 10, { proc: 0, knock: 0 }); }
    e.raged = hasCurse('time') && !e.boss && e.room && e.room.actT !== undefined && e.room.active && G.time - e.room.actT > 20;
    // rage (a despair modifier) doubles how fast foes act; on a boss only 20% of it applies
    const attackRate=e.boss?1+(enemyAttackRate()-1)*.2:enemyAttackRate();
    e.t += dt*attackRate; e.cd -= dt*attackRate * (1 + statFloor() * .12) * (e.affix === 'haste' ? 1.4 : 1) * diffV('aggr') * (e.raged ? 1.5 : 1);
    if (e.buffT > 0) { e.buffT -= dt; e.cd -= dt * .3 * attackRate; }
    const st = typeof sentryTarget === 'function' && !G.preview ? sentryTarget(e) : null, px0 = p.x, py0 = p.y; if (st) { p.x = st.x; p.y = st.y - 4; }
    const d = dist(e.x, e.y, p.x, p.y), a = ang(e.x, e.y, p.x, p.y), sp = e.spd * slow * (e.buffT > 0 ? 1.4 : 1);
    const rx = e.x, ry = e.y;
    try { G.curShooter = e; MOD_AI_BODY=e; MOD_AI_RATE=attackRate; if (e.ai) e.ai(e, dt*attackRate, d, a, slow); else AI[e.type](e, dt*attackRate, d, a, sp); } finally { MOD_AI_BODY=null; MOD_AI_RATE=1; G.curShooter = null; if (st) { p.x = px0; p.y = py0; } }
    if (e.rootT > 0) { e.rootT -= dt; e.x = rx; e.y = ry; }
    if (!st && e.contact && p.alive && d < e.r + p.r - 1 && !e.boss) hurtPlayer(1, e.x, e.y);
  }
  // separation
  const es = G.enemies;
  for (let i = 0; i < es.length; i++) for (let j = i + 1; j < es.length; j++) { const a = es[i], b = es[j]; if (a.dead || b.dead || a.boss || b.boss) continue;
    const dx = b.x - a.x, dy = b.y - a.y, m = a.r + b.r, d2 = dx * dx + dy * dy; if (d2 < m * m && d2 > .01) { const d = Math.sqrt(d2), push = (m - d) * .5, nx = dx / d * push, ny = dy / d * push;
      if (!collides(a.x - nx, a.y - ny, a.r, a.fly)) { a.x -= nx; a.y -= ny; } if (!collides(b.x + nx, b.y + ny, b.r, b.fly)) { b.x += nx; b.y += ny; } } }
  for (let i = es.length - 1; i >= 0; i--) if (es[i].dead) es.splice(i, 1);
}
const AI = {
  crawler(e, dt, d, a, sp) { const wob = Math.sin(e.t * 5 + e.wob) * .6; steer(e, G.p.x + Math.cos(a + 1.57) * wob * 20, G.p.y + Math.sin(a + 1.57) * wob * 20, sp, dt); e.face = a; },
  mini(e, dt, d, a, sp) { AI.crawler(e, dt, d, a, sp); },
  gunner(e, dt, d, a, sp) {
    e.face = a;
    if (e.st === 'aim') { if (e.t > .45) { const n = statFloor() >= 1 ? 3 : 1; for (let i = 0; i < n; i++) eshot(e.x, e.y, a + (i - (n - 1) / 2) * .22, 105 + statFloor() * 10); AU.play('ebullet'); e.st = 'idle'; e.cd = rand(1.4, 2.2); } return; }
    const want = d < 80 ? -1 : d > 140 ? 1 : 0; const sa = a + (want === 0 ? 1.57 * Math.sign(Math.sin(e.wob + e.t * .5)) : want < 0 ? Math.PI : 0);
    steer(e, e.x + Math.cos(sa) * 20, e.y + Math.sin(sa) * 20, sp, dt);
    if (e.cd <= 0 && d < 220 && los(e.x, e.y, G.p.x, G.p.y)) { e.st = 'aim'; e.t = 0; }
  },
  charger(e, dt, d, a, sp) {
    if (e.st === 'wind') { if (e.t < .45) e.face = a; if (e.t > .65) { e.st = 'dash'; e.t = 0; AU.play('dash'); } return; }
    if (e.st === 'dash') { const hit = moveBody(e, Math.cos(e.face) * 290 * dt, Math.sin(e.face) * 290 * dt); if (Math.random() < .7) part({ x: e.x, y: e.y, life: .3, max: .3, c: col(3), s: 2 });
      if (hit || e.t > .45) { if (hit) { shake(.12); burst(e.x, e.y, 8, col(4), 90, .3); e.st = 'stun'; e.t = 0; } else { e.st = 'idle'; e.cd = rand(1, 1.8); } } return; }
    if (e.st === 'stun') { if (e.t > .7) { e.st = 'idle'; e.cd = 1; } return; }
    steer(e, G.p.x, G.p.y, sp, dt); e.face = a;
    if (e.cd <= 0 && d < 160 && los(e.x, e.y, G.p.x, G.p.y)) { e.st = 'wind'; e.t = 0; AU.play('telegraph', .8); }
  },
  splitter(e, dt, d, a, sp) { steer(e, G.p.x, G.p.y, sp, dt); e.face = a; },
  turret(e, dt, d, a, sp) {
    e.face = a;
    if (e.st === 'fire') { if (e.t > .1) { e.t = 0; e.n++; const base = e.n * .26; for (let i = 0; i < 4; i++) eshot(e.x, e.y, base + i * Math.PI / 2, 80); AU.play('ebullet', .8); if (e.n > 10) { e.st = 'idle'; e.cd = 2.2; e.rest = 2; } } return; }
    if (e.rest > 0) { e.rest -= dt; return; }
    if (e.cd <= 0 && d < 260) { e.st = 'fire'; e.t = 0; e.n = 0; }
  },
  bomber(e, dt, d, a, sp) {
    if (e.st === 'fuse') { if (e.t > .55) { if(e.deathFightLeft>0){e.st='idle';e.t=0;}else e.dead=true; explode(e.x, e.y, 34, 20, { hurtsPlayer: true, color: C.red }); } return; }
    steer(e, G.p.x, G.p.y, sp, dt); e.face = a;
    if (d < 28) { e.st = 'fuse'; e.t = 0; AU.play('telegraph', 1.5); }
  },
  shielder(e, dt, d, a, sp) {
    e.face += clamp(angDiff(e.face, a), -1.6 * dt, 1.6 * dt);
    if (e.st === 'burst') { if (e.t > .12) { e.t = 0; e.n++; eshot(e.x + Math.cos(e.face) * 8, e.y + Math.sin(e.face) * 8, e.face + rand(-.1, .1), 120); AU.play('ebullet'); if (e.n >= 3) { e.st = 'idle'; e.cd = rand(2.5, 3.5); } } return; }
    if (d > 50) steer(e, G.p.x, G.p.y, sp, dt);
    if (e.cd <= 0 && d < 180) { e.st = 'burst'; e.t = 0; e.n = 0; }
  },
  wisp(e, dt, d, a, sp) {
    e.face = a;
    if (e.st === 'fade') { if (e.t > .35) { const r = roomAt(G.p.x, G.p.y); let tries = 0;
        while (tries++ < 20) { const nx = G.p.x + rand(-110, 110), ny = G.p.y + rand(-90, 90); if (!collides(nx, ny, e.r, true) && dist(nx, ny, G.p.x, G.p.y) > 60 && (!r || roomAt(nx, ny) === r)) { e.x = nx; e.y = ny; break; } }
        e.st = 'appear'; e.t = 0; burst(e.x, e.y, 10, C.violet, 70, .3); } return; }
    if (e.st === 'appear') { if (e.t > .45) { const n = 8 + statFloor() * 2; for (let i = 0; i < n; i++) eshot(e.x, e.y, i / n * Math.PI * 2 + e.t, 70, { c: C.violet }); AU.play('ebullet', .7); e.st = 'idle'; e.cd = rand(2.4, 3.2); } return; }
    steer(e, e.x + Math.cos(e.t) * 10, e.y + Math.sin(e.t * 1.3) * 10, sp, dt);
    if (e.cd <= 0) { e.st = 'fade'; e.t = 0; burst(e.x, e.y, 8, C.violet, 60, .3); }
  },
  sniper(e, dt, d, a, sp) {
    if (e.st === 'aim') { if (e.t < 1) e.face += clamp(angDiff(e.face, a), -3 * dt, 3 * dt); if (e.t > 1.25) { eshot(e.x, e.y, e.face, 360, { r: 3 }); AU.play('rail', 1, .3); e.st = 'idle'; e.cd = rand(2, 3); } return; }
    const want = d < 120 ? Math.PI : 1.57; steer(e, e.x + Math.cos(a + want) * 20, e.y + Math.sin(a + want) * 20, sp, dt);
    if (e.cd <= 0 && los(e.x, e.y, G.p.x, G.p.y)) { e.st = 'aim'; e.t = 0; e.face = a; AU.play('telegraph', 2); }
  },
  mortar(e, dt, d, a, sp) {
    e.face = a;
    if (e.st === 'load') { if (e.t > .5) { const n = 2 + Math.min(2, statFloor() - 1); for (let i = 0; i < n; i++) { const ox = i ? rand(-34, 34) : 0, oy = i ? rand(-28, 28) : 0; mech({ type: 'circle', x: G.p.x + ox + G.p.vx * .3, y: G.p.y + oy + G.p.vy * .3, r: 15, warn: 1 + i * .15, owner: e, small: true }); }
      AU.play('lob'); e.st = 'idle'; e.cd = rand(2.6, 3.4); } return; }
    const want = d < 100 ? Math.PI : 1.57; steer(e, e.x + Math.cos(a + want) * 20, e.y + Math.sin(a + want) * 20, sp, dt);
    if (e.cd <= 0 && d < 240) { e.st = 'load'; e.t = 0; }
  },
  warden(e, dt, d, a, sp) {
    e.face = a;
    if (e.st === 'cast') { if (e.t > 1.25) { e.st = 'idle'; e.cd = rand(2.5, 3.5); } return; }
    steer(e, G.p.x, G.p.y, sp, dt);
    if (e.cd <= 0 && d < 70) { e.st = 'cast'; e.t = 0; mech({ type: 'circle', x: e.x, y: e.y, r: 40, warn: 1.1, owner: e, cancelOnDeath: true }); AU.play('cast', .8); }
  },
  echo(e, dt, d, a, sp) {
    e.face = a; const orb = e.t * .8 + e.wob; steer(e, G.p.x + Math.cos(orb) * 90, G.p.y + Math.sin(orb) * 70, sp, dt);
    if (e.cd <= 0) { for (let i = -2; i <= 2; i++) eshot(e.x, e.y, a + i * .2, 110, { c: C.violet }); AU.play('ebullet'); e.cd = rand(1.6, 2.4); }
  },
};
ETYPES.splitter.onDeath = e => { for (let i = 0; i < 2 + statFloor(); i++) { const m = spawnEnemy('mini', e.x + rand(-4, 4), e.y + rand(-4, 4), { instant: true, room: e.room }); m.kx = rand(-150, 150); m.ky = rand(-150, 150); } };

function drawEnemies(cx, cy) {
  for (const e of G.enemies) {
    const x = e.x - cx, y = e.y - cy;
    if (e.spawnT > 0) { drawSpawn(e, x, y); continue; }
    if (e.boss) { drawBoss(e, x, y); drawMarks(e, x, y); continue; }
    if (e.type === 'wisp' && e.st === 'fade') { if (((e.t * 30) | 0) % 2) continue; }
    if (e.hide) { drawBurrow(e, x, y); continue; } // the burrower, under the floor (js/enemies3.js)
    const s = sprite(e.type, ESPR[e.type]); const flip = Math.cos(e.face) < 0, foot = y + e.r;
    // walkers hop on their feet (lift >= 0); fliers hover above a smaller shadow
    const mvx = (e.x - (e.lpx === undefined ? e.x : e.lpx)) * 60, mvy = (e.y - (e.lpy === undefined ? e.y : e.lpy)) * 60, mv = Math.hypot(mvx, mvy); e.lpx = e.x; e.lpy = e.y;
    e.lean = lerp(e.lean || 0, clamp(mvx / 260, -.28, .28), .2);
    const lift = (e.hop || 0) + (e.fly ? 5 + Math.sin(G.time * 4 + e.wob) * 1.5 : (e.frozen > 0 || mv < 5 ? 0 : (((e.t * 10 + e.wob) | 0) % 2)));
    const dashing = e.st === 'dash' || (e.boss && 0), sq = e.land > 0 ? e.land * 1.4 : 0, fl = e.flash > 0 || (e.type === 'bomber' && e.st === 'fuse' && ((e.t * 20) | 0) % 2);
    if (e.raged) { ctx.globalAlpha = .35 + Math.sin(G.time * 10 + e.wob) * .2; disc(x, foot - s.h / 2, s.w / 2 + 3, '#ff2a3a'); ctx.globalAlpha = 1; if (Math.random() < .2) part({ x: e.x + rand(-4, 4), y: e.y - rand(0, 6), vx: 0, vy: -30, life: .3, max: .3, c: '#ff2a3a', s: 1 }); }
    if (e.affix) { const ac = AFFIXES[e.affix].c(); ctx.globalAlpha = .6 + Math.sin(G.time * 8) * .2; ringC(x, foot - 1, s.w / 2 + 2, ac, 1); ctx.globalAlpha = 1; }
    if (e.elite) for (const [ox, oy] of [[1, 0], [-1, 0], [0, -1]]) drawChar(s, x + ox, foot + oy, flip, true, { lift, noShadow: true });
    const esc = e.scale || 1;
    drawChar(s, x, foot, flip, fl, { lift, sx: (1 + sq) * (dashing ? 1.3 : 1) * esc, sy: (1 - sq * .8) * (dashing ? .8 : 1) * esc, rot: e.frozen > 0 ? 0 : e.lean * (dashing ? 1.6 : 1), shw: .8 * esc });
    const cyb = foot - lift - s.h * esc / 2; // visual body center
    drawEnemyExtra(e, x, cyb);
    if (e.cc && (e.cc.freeze > 1.5 || e.cc.knock > 1.5)) { ctx.globalAlpha = .5; ringC(x, cyb, e.r + 4, col(4), 1); ctx.globalAlpha = 1; }
    if (e.type === 'bomber' && e.st === 'fuse') ringC(x, y, 34 * (e.t / .55), C.red, 1);
    if (e.type === 'charger' && e.st === 'wind') { const L2 = 120; ctx.globalAlpha = ((e.t * 16) | 0) % 2 ? .9 : .4; line(x, y, x + Math.cos(e.face) * L2, y + Math.sin(e.face) * L2, C.red, 1); ctx.globalAlpha = 1; }
    if (e.type === 'charger' && e.st === 'stun') for (let i = 0; i < 3; i++) rect(x + Math.cos(G.time * 6 + i * 2) * 6, cyb - 8 + Math.sin(G.time * 6 + i * 2) * 2, 1, 1, col(5));
    if (e.type === 'gunner' && e.st === 'aim') { rect(x - 1, cyb - 1, 3, 3, C.red); ringC(x, cyb, Math.max(1, 9 - e.t * 10), C.red, 1); }
    if (e.type === 'sniper' && e.st === 'aim') { const L2 = 400; ctx.globalAlpha = e.t > 1 ? (((e.t * 30) | 0) % 2 ? 1 : .3) : .45; line(x, cyb, x + Math.cos(e.face) * L2, cyb + Math.sin(e.face) * L2, C.red, 1); ctx.globalAlpha = 1; }
    if (e.type === 'wisp' && e.st === 'appear') ringC(x, cyb, Math.max(1, 12 - e.t * 20), C.violet, 1);
    if ((e.type === 'turret' && e.st === 'fire') || (e.type === 'mortar' && e.st === 'load') || (e.type === 'warden' && e.st === 'cast')) rect(x - 1, cyb - 1, 3, 3, ((G.time * 12) | 0) % 2 ? C.red : C.gold);
    if (e.shield) { ctx.strokeStyle = e.sflash > 0 ? C.gold : col(5); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, cyb, 9, e.face - .9, e.face + .9); ctx.stroke(); }
    if (e.frozen > 0) { const fw = s.w + 2, fh = s.h + 2; ctx.globalAlpha = .5; rect(x - fw / 2, foot - fh + 1, fw, fh, C.frost); ctx.globalAlpha = 1; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(Math.round(x - fw / 2) + .5, Math.round(foot - fh + 1) + .5, fw, fh); }
    else if (e.chill > 0) for (let i = 0; i < Math.min(5, e.chill); i++) rect(x - 4 + i * 3, foot - s.h - lift - 4, 2, 2, C.frost);
    drawMarks(e, x, cyb);
    if (!e.champ && e.hurtT > -1 && e.hp < e.maxHp) { const w = Math.max(10, s.w); const by = foot - s.h - lift - 2; rect(x - w / 2, by, w, 1, col(2)); rect(x - w / 2, by, w * Math.max(0, e.hp / e.maxHp), 1, e.burn ? C.red : e.venom ? C.lime : col(5)); }
  }
}
// spawn ritual: rotating sigil + converging ink -> pillar of light -> landing shockwave
function drawSpawn(e, x, y) {
  const k = 1 - e.spawnT / SPAWN_T, acc = e.elite ? C.gold : '#b8262e', ap = Math.min(1, k / .25);
  ctx.globalAlpha = .7; disc(x, y + 1, 9 * ap, col(0)); ctx.globalAlpha = .85; disc(x, y + 1, 7 * ap, '#3a0a0e'); disc(x - 1, y, 4 * ap, '#5a0e14'); ctx.globalAlpha = 1;
  if (k < .72) {
    const s = 11 * easeOut(ap);
    for (const [dir, c, sz] of [[1, '#5a0e14', s], [-1.6, acc, s * .7]]) pxSquare(x, y, sz, G.time * 2.4 * dir + e.wob, c);
    ringC(x, y, 13 * ap, col(3), 1);
    for (let i = 0; i < 6; i++) { const a = i * 1.047 + e.wob, r = 16 * (1 - k / .72); rect(x + Math.cos(a) * r, y + Math.sin(a) * r * .6, 2, 1, '#8a1820'); } // blood running in
    if (((G.time * 10) | 0) % 2) rect(x - 1, y - 1, 2, 2, acc);
  } else {
    const q = (k - .72) / .28, wdt = Math.max(1, 9 * (1 - q));
    ctx.globalAlpha = .35; rect(x - wdt, y - 40, wdt * 2, 40, '#8a1820'); ctx.globalAlpha = 1; rect(x - wdt / 3, y - 40, Math.max(1, wdt * .66), 40, '#b8262e');
    if (Math.random() < .5) part({ x: e.x + rand(-3, 3), y: e.y - rand(10, 30), vx: rand(-30, 30), vy: rand(-40, -10), life: .4, max: .4, c: choice(['#8a1820', '#b8262e', '#5a0e14']), grav: 260 });
    ringC(x, y, 13 * (1 - q) + 2, acc, 1);
    const s = sprite(e.type, ESPR[e.type] || ESPR.crawler); drawChar(s, x, y + e.r, false, true, { sx: 1 + (1 - q) * .6, sy: q, noShadow: true });
  }
}
