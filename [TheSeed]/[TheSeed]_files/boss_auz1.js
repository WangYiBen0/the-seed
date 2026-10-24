// ===== ACHROMA bosses: smooth-moving, aggressive fights where every mechanic carries its own bullets =====
'use strict';
const BOSSES = [
  { name: { en: 'THE PETRIFIED', zh: '石化巨體', ja: '石化巨体', zhs: '石化巨体' }, hp: 1500, r: 14, roam: { r: 0, spd: 0, w: 0 }, press: 2.2,
    phases: [['rings', 'slam', 'spiral'], ['rings', 'slam', 'spiral', 'tracking'], ['cross', 'slam', 'spiral', 'rings', 'tracking']] },
  { name: { en: 'THE PARASITE QUEEN', zh: '寄生女王', ja: '寄生女王', zhs: '寄生女王' }, hp: 4200, r: 11, roam: { r: 92, spd: 120, w: .9 }, press: 1.1,
    phases: [['dashes', 'decree', 'tether', 'fan', 'toss'], ['limitcut', 'jewels', 'decree', 'exaflare', 'toss', 'dashes'], ['limitcut', 'jewels', 'combo', 'combo', 'decree', 'toss']],
    combos: [['limitcut', 'jewels'], ['decree', 'fan'], ['toss', 'fan'], ['tether', 'exaflare'], ['dashes', 'decree']] },
  { name: { en: 'THE INK EYE', zh: '墨瞳', ja: '墨瞳', zhs: '墨瞳' }, hp: 8800, r: 15, roam: { r: 125, spd: 55, w: .5 }, press: 1.4,
    phases: [['sweep', 'flower', 'checker', 'cones'], ['erasure', 'celestial', 'blot', 'gaze', 'cones', 'checker'], ['erasure', 'combo', 'combo', 'blot', 'celestial', 'sweep', 'cones']],
    combos: [['erasure', 'flower'], ['cones', 'flower'], ['celestial', 'gaze'], ['blot', 'gaze'], ['checker', 'flower']] },
  { name: { en: 'THE ARBITER', zh: '裁決者', ja: '裁定者', zhs: '裁决者' }, hp: 15500, r: 13, roam: { r: 105, spd: 85, w: .7 }, press: 1.2,
    phases: [['inout', 'cleave', 'gavel', 'brand'], ['towers', 'scales', 'plus', 'doom', 'cleave', 'gavel'], ['cage', 'combo', 'combo', 'combo', 'scales', 'plus']],
    combos: [['inout', 'brand'], ['scales', 'gavel'], ['plus', 'cleave'], ['doom', 'brand'], ['doom', 'gavel'], ['cleave', 'brand']] },
  { name: { en: 'SPECIMEN ZERO', zh: '零號樣本', ja: '零号サンプル', zhs: '零号样本' }, hp: 9000, r: 16, form: 1, roam: { r: 115, spd: 75, w: .6 }, press: 1.1,
    phases: [['polarity', 'prismfall', 'gather', 'stars', 'reverse'], ['polarity', 'stillness', 'nullwind', 'singular', 'prismfall', 'gather'], ['combo', 'combo', 'stillness', 'polarity', 'nullwind', 'singular', 'reverse']],
    combos: [['polarity', 'stars'], ['gather', 'nullwind'], ['singular', 'prismfall'], ['reverse', 'prismfall']] },
];
const ABSENCE_2 = { name: { en: 'SPECIMEN ZERO', zh: '零號樣本', ja: '零号サンプル', zhs: '零号样本' }, r: 18, form: 2,
  roam: { r: 120, spd: 95, w: .8 }, press: .9,
  phases: [['spectrum', 'chroma', 'collapse', 'nova'], ['spectrum', 'mirror', 'prismnuke', 'chroma', 'collapse', 'nova'], ['combo', 'combo', 'combo', 'prismnuke', 'mirror', 'collapse']],
  combos: [['spectrum', 'chroma'], ['collapse', 'nova'], ['mirror', 'spectrum'], ['prismnuke', 'nova'], ['chroma', 'collapse']] };
function cue(b, p = 1) { AU.play('cast', p, .7); }
// health by floor: the first boss x1.3, then x1.5, x1.8, x2, x2.3
const BOSS_HPM = [1.3, 1.5, 1.8, 2, 2.3];
// every boss -15%, the fourth floor's boss a further -25% and then +30%
const bossTrim = fi => .85 * (fi === 3 ? .75 * 1.3 : 1);
function spawnBoss(room, def, at) {
  def = def || bossDefFor(G.floor);
  const b = spawnEnemy('crawler', at ? at.x : room.cx * T + 8, at ? at.y : (room.cy - 3) * T + 8, { instant: true, boss: true, def, ai: bossAI, contact: 1, heavy: .04, ink: 60, room });
  b.hp = b.maxHp = (def.form === 2 ? G.absenceHp : def.hp * powerScale('boss') * diffV('bhp') * BOSS_HPM[clamp(G.floor || 0, 0, 4)] * bossTrim(clamp(G.floor || 0, 0, 4)) * exploreHealthMul('boss')); b.r = def.r; b.fly = true; b.phase = 0; b.atk = null; b.at = 0; b.idle = 1.4; b.mem = {}; b.armorT = 0; b.bag = []; b.eye = 0; b.hover = 0;
  b.bvx = 0; b.bvy = 0; b.orbitA = rand(0, 6.28); b.orbitDir = 1; b.pressT = 2; b.mirrorT = 0;
  b.onDeath = bossDeath;
  if (!G.preview && typeof cxSeen === 'function') cxSeen('b:' + (def.key === 'recomposed' ? 'absence' : def.key)); G.boss = b; return b;
}
function bossAI(b, dt, d, a) {
  const p = G.p; b.face = a; b.eye += angDiff(b.eye, a) * Math.min(1, dt * 6); b.armorT -= dt; b.mirrorT -= dt;
  if (b.enrageT !== undefined) { b.enrageT -= dt; if (b.enrageT <= 0) { b.enrageTick = (b.enrageTick || 0) - dt; if (b.enrageTick <= 0) { b.enrageTick = 2.2; AU.play('resolve'); flash(col(5), .5, true); shake(.4, true); hurtPlayer(1, b.x, b.y, true); } } }
  // phase changes never cancel what is already in flight
  const ph = b.hp / b.maxHp < .34 ? 2 : b.hp / b.maxHp < .67 ? 1 : 0;
  if (ph > b.phase) { b.phase = ph; b.armorT = .6; b.bag = [];
    if (b.def.form === 2 && ph === 2) b.enrageT = 160;
    AU.play('phase'); flash(C.red, .2, true); shake(.25, true); chroma(.5, true); ringFx(b.x, b.y, 140, C.red, .7, 4); ringFx(b.x, b.y, 90, col(5), .5, 3);
    for (let k = 0; k < 2; k++) G.later.push({ t: .35 + k * .3, f: () => { if (!b.dead) bring(b, b.x, b.y, dn(22), spd(b, 80 + k * 20), {}, rand(0, 6.28)); } }); } // a new phase opens with two rings
  // movement: glide to an attack's goal, or circle the player aggressively
  if (b.goal) glide(b, b.goal.x, b.goal.y, b.goal.spd || 180, dt);
  else if (!b.anchored && b.def.roam.spd > 0) roam(b, dt);
  else { b.bvx *= Math.pow(.01, dt); b.bvy *= Math.pow(.01, dt); }
  // passive pressure between (and during light) mechanics
  b.pressT -= dt; if (b.pressT <= 0 && (!b.atk || b.atk === 'tether' || b.atk === 'jewels')) { b.pressT = b.def.press * .7 * (1 - b.phase * .15) / bpace(); press(b); }
  if (!b.atk) { b.idle -= dt * (1 + b.phase * .4) * diffV('aggr'); if (b.idle <= 0) pickAttack(b); return; }
  b.at += dt;
  if (BATK[b.atk](b, b.at, dt, a)) { b.atk = null; b.goal = null; b.anchored = false; b.idle = Math.max(.12, rand(.22, .4) - b.phase * .06); }
}
function glide(b, tx, ty, spd, dt) {
  const A = arenaOf(b); tx = clamp(tx, A.x0 + 26, A.x1 - 26); ty = clamp(ty, A.y0 + 26, A.y1 - 26);
  const dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy), s = spd * Math.min(1, d / 45);
  b.bvx = lerp(b.bvx, d > .5 ? dx / d * s : 0, Math.min(1, dt * 5)); b.bvy = lerp(b.bvy, d > .5 ? dy / d * s : 0, Math.min(1, dt * 5));
  moveBody(b, b.bvx * dt, b.bvy * dt); return d < 10;
}
function roam(b, dt) {
  const p = G.p, R = b.def.roam.r; b.orbitA += dt * b.def.roam.w * b.orbitDir * (1 + b.phase * .3);
  if (Math.random() < dt * .25) b.orbitDir *= -1;
  glide(b, p.x + Math.cos(b.orbitA) * R, p.y + Math.sin(b.orbitA) * R * .75, b.def.roam.spd * (1 + b.phase * .2), dt);
}
function arrive(b, x, y, spd = 200) { b.goal = { x, y, spd }; const A = arenaOf(b); return dist(b.x, b.y, clamp(x, A.x0 + 26, A.x1 - 26), clamp(y, A.y0 + 26, A.y1 - 26)) < 12; }
function pickAttack(b) { if (!b.bag.length) b.bag = shuffle(b.def.phases[b.phase].slice()); b.atk = b.bag.pop(); if (b.atk === b.last && b.bag.length) { b.bag.unshift(b.atk); b.atk = b.bag.pop(); } b.last = b.atk; b.at = 0; b.mem = {}; }
const spd = (b, s) => s * (1 + b.phase * .15 + G.floor * .05);
const every = (t, dt, per) => Math.floor(t / per) !== Math.floor((t - dt) / per);
function arenaOf(b) { const r = b.room; return { x0: (r.x0 + 1) * T, y0: (r.y0 + 1) * T, x1: (r.x0 + r.w - 1) * T, y1: (r.y0 + r.h - 1) * T, cx: r.cx * T + 8, cy: r.cy * T + 8 }; }
function rndArenaPt(b, m = 40) { const A = arenaOf(b); for (let i = 0; i < 30; i++) { const x = rand(A.x0 + m, A.x1 - m), y = rand(A.y0 + m, A.y1 - m); if (!shotBlocked(x, y)) return [x, y]; } return [A.cx, A.cy]; }
// boss bullets (optionally mirrored through the arena center during MIRROR)
function bs(b, x, y, a, s, o = {}) { o = Object.assign({ own: b }, o); if (b.def.v && !o.pol && !o.noVar) { b.vn = (b.vn || 0) + 1; o = Object.assign({}, o, { curve: (o.curve || 0) + (b.vn % 2 ? .3 : -.3) }); } eshot(x, y, a, s, o); if (b.mirrorT > 0) { const A = arenaOf(b); eshot(2 * A.cx - x, 2 * A.cy - y, a + Math.PI, s, Object.assign({}, o, { c: o.c || C.violet })); } }
function bring(b, x, y, n, s, o = {}, off = 0, gap = 0) { for (let i = 0; i < n; i++) { if (gap && i < gap) continue; bs(b, x, y, off + i / n * 6.283, s, o); } }
function press(b) {
  const p = G.p, a = ang(b.x, b.y, p.x, p.y), f = b.def.form === 2 ? 2 : G.floor;
  if (f === 0) { bring(b, b.x, b.y, dn(16), spd(b, 72), { c: C.orange }, rand(0, 6.28)); AU.play('ebullet', .8, .6); return; }
  if (G.floor === 1) { for (let i = -2; i <= 2; i++) bs(b, b.x, b.y, a + i * .15, spd(b, 125)); }
  else if (G.floor === 2) { for (let i = 0; i < 5; i++) bs(b, b.x, b.y, a + (i - 2) * .25, spd(b, 85), { c: C.violet, curve: (i - 2) * .4 }); }
  else if (G.floor === 3) { for (let i = 0; i < 7; i++) bs(b, b.x, b.y, a + (i - 3) * .11, spd(b, 110) - Math.abs(i - 3) * 10); }
  else { const pc = choice([C.red, C.cyan]); for (let i = 0; i < 6; i++) bs(b, b.x, b.y, a + (i - 2.5) * .18, spd(b, 105), { c: pc, pol: pc }); }
  AU.play('ebullet', 1.1, .7);
}
const PCOLS = () => [C.red, C.cyan, C.gold];
// bullets born from mechanics run at 60% of their original density
// ...and the chosen difficulty scales that density again (easy 0.8x, hard 1.1x, nightmare 1.2x)
const DEN = .82, dn = n => Math.max(1, Math.round(n * DEN * diffV('barrage'))), dp = per => per / (DEN * bpace());

const BATK = {
  combo(b, t, dt, a) { const m = b.mem; if (!m.pair) { m.pair = choice(b.def.combos); m.mems = [{}, {}]; m.done = [false, false]; }
    const save = b.mem; for (let i = 0; i < 2; i++) { if (m.done[i]) continue; b.mem = m.mems[i]; if (BATK[m.pair[i]](b, t, dt, a)) m.done[i] = true; } b.mem = save;
    return m.done[0] && m.done[1]; },

  // ---------------- 1: THE MONOLITH ----------------
  rings(b, t, dt) { const m = b.mem; m.n = m.n || 0; const N = 3 + b.phase;
    if (t > .35 + m.n * (.55 - b.phase * .08)) { const k = dn(18 + b.phase * 4); bring(b, b.x, b.y, k, spd(b, 85), {}, rand(0, 6.28), 2); AU.play('ebullet', .6); ringFx(b.x, b.y, 22, C.red, .2); m.n++; }
    return m.n >= N; },
  spiral(b, t, dt) { const m = b.mem; m.f = (m.f || 0) - dt; const arms = 3 + b.phase;
    if (m.f <= 0) { m.f = dp(.085); for (let i = 0; i < arms; i++) bs(b, b.x, b.y, t * (1.9 + b.phase * .3) + i / arms * 6.28, spd(b, 95)); AU.play('ebullet', .9, .6); }
    return t > 2.6; },
  slam(b, t, dt) { const m = b.mem, p = G.p, reps = 1 + b.phase;
    if (!m.s) { m.s = 1; m.k = 0; m.t0 = 0; m.sx = b.x; m.sy = b.y; m.tx = p.x; m.ty = p.y; }
    const lt = t - m.t0;
    if (m.s === 1) { // airborne: track the player, then glide over them while rising
      if (lt < .5) { m.tx = p.x; m.ty = p.y; }
      const q = clamp(lt / .8, 0, 1), e = q * q * (3 - 2 * q); b.hover = Math.sin(q * Math.PI) * 44; b.x = lerp(m.sx, m.tx, e); b.y = lerp(m.sy, m.ty, e);
      if (q >= 1) { b.hover = 0; AU.play('slam'); shake(.45, true); hitstop(.05); ringFx(b.x, b.y, 50, col(5), .35, 4); burst(b.x, b.y, 30, col(4), 200, .5, 2); splat(b.x, b.y, col(0), 40, 26);
        const n = dn(22 + b.phase * 6); bring(b, b.x, b.y, n, spd(b, 120), { r: 3 });
        if (dist(b.x, b.y, p.x, p.y) < 34) hurtPlayer(1, b.x, b.y);
        const A = arenaOf(b); b.x = clamp(b.x, A.x0 + 20, A.x1 - 20); b.y = clamp(b.y, A.y0 + 20, A.y1 - 20); m.k++; m.s = 3; m.t0 = t; } }
    else if (m.s === 3) { if (lt > .45) { if (m.k >= reps) return true; m.s = 1; m.t0 = t; m.sx = b.x; m.sy = b.y; } }
    return false; },
  cross(b, t) { const m = b.mem; if (!m.done) { m.done = 1; b.anchored = true; const n = 4, a0 = rand(0, 6.28), dir = Math.random() < .5 ? 1 : -1;
      for (let i = 0; i < n; i++) G.lasers.push({ owner: b, a: a0 + i / n * 6.28, va: dir * (.55 + b.phase * .1), len: 420, w: 7, warn: 1, life: 3.4 }); AU.play('telegraph', .5); }
    if (t > 1 && !m.snd) { m.snd = 1; AU.play('laser'); shake(.3); }
    return t > 4.6; },
  tracking(b, t) { const m = b.mem; m.n = m.n || 0; const N = 3 + (G.floor >= 3 ? 1 : 0); if (!m.n) cue(b);
    if (m.n < N && t > m.n * 1.0) { mech({ type: 'track', x: b.x, y: b.y, r: 28, warn: 2.6, lockAt: 2.0, spd: 80 + G.floor * 10, owner: b, onResolve: q => bring(b, q.x, q.y, dn(10), 70, { c: C.red }, rand(0, 6)) }); m.n++; }
    return t > (N - 1) * 1 + 2.9; },

  // ---------------- 2: HOLLOW CROWN (duelist) ----------------
  dashes(b, t, dt) { const m = b.mem, p = G.p, N = 3 + b.phase;
    if (!m.s) { m.s = 'aim'; m.k = 0; m.t0 = 0; b.anchored = true; }
    const lt = t - m.t0;
    if (m.s === 'aim') { m.a = ang(b.x, b.y, p.x + p.vx * .25, p.y + p.vy * .25); if (lt > .45 - b.phase * .08) { m.s = 'go'; m.t0 = t; AU.play('dash'); } }
    else if (m.s === 'go') { const hit = moveBody(b, Math.cos(m.a) * 430 * dt, Math.sin(m.a) * 430 * dt); m.drop = (m.drop || 0) - dt;
      if (m.drop <= 0) { m.drop = dp(.045); addEnemyBullet({ own: b, x: b.x, y: b.y, vx: 0, vy: 0, r: 2.5, life: 4, delay: .5, c: C.red, burstA: m.a }); }
      part({ x: b.x, y: b.y, life: .3, max: .3, c: col(4), s: 3 }); if (dist(b.x, b.y, p.x, p.y) < b.r + 4) hurtPlayer(1, b.x, b.y);
      if (hit || lt > .42) { m.k++; m.s = 'rest'; m.t0 = t; shake(.15); if (b.phase >= 1) bring(b, b.x, b.y, dn(8), spd(b, 90), {}, m.a);
        for (const eb of G.ebullets) if (eb.burstA !== undefined && eb.vx === 0) { const sa = eb.burstA + (Math.random() < .5 ? 1.57 : -1.57); eb.vx = Math.cos(sa) * 60; eb.vy = Math.sin(sa) * 60; eb.acc = 60; eb.maxSpd = 150; } } }
    else if (lt > .22) { if (m.k >= N) return true; m.s = 'aim'; m.t0 = t; }
    return false; },
  fan(b, t) { const m = b.mem; m.n = m.n || 0; const N = 4 + b.phase;
    if (t > .3 + m.n * .4) { const a = ang(b.x, b.y, G.p.x, G.p.y), k = dn(7 + b.phase * 2), off = m.n % 2 ? .09 : 0; for (let i = 0; i < k; i++) bs(b, b.x, b.y, a + (i - (k - 1) / 2) * .18 + off, spd(b, 135)); AU.play('ebullet'); m.n++; }
    return m.n >= N; },
  tether(b, t, dt) { const m = b.mem; if (!m.s) { m.s = 1; cue(b); mech({ type: 'tether', owner: b, minD: 150, warn: 3.4, dmg: 2 }); }
    // the crown roots itself while the bond is live, so walking away always works; it still spits short aimed bursts
    b.goal = null; b.anchored = true;
    const p = G.p; if (every(t, dt, dp(.5))) { const a = ang(b.x, b.y, p.x, p.y); for (let i = -1; i <= 1; i++) bs(b, b.x, b.y, a + i * .2, spd(b, 120)); }
    return t > 3.6; },
  decree(b, t, dt) { // walls of bullets with a moving gap, sent from the side the crown flies to
    const m = b.mem, A = arenaOf(b), p = G.p;
    if (!m.s) { m.s = 'move'; m.side = p.x > A.cx ? 0 : 1; m.gap = (A.y0 + A.y1) / 2; m.n = 0; cue(b, 1.2); }
    const sx = m.side === 0 ? A.x0 + 28 : A.x1 - 28;
    if (m.s === 'move') { if (arrive(b, sx, (A.y0 + A.y1) / 2, 240)) { m.s = 'waves'; m.t0 = t; } return t > 4; }
    b.goal = { x: sx, y: m.gap, spd: 120 };
    const N = 4 + b.phase, lt = t - m.t0;
    if (m.n < N && lt > m.n * (1.05 - b.phase * .12)) { m.gap = clamp(m.gap + rand(-90, 90), A.y0 + 40, A.y1 - 40); const gw = 46 - b.phase * 4;
      mech({ type: 'mark', x: m.side === 0 ? A.x0 + 6 : A.x1 - 6, y: m.gap, w: gw, warn: .55, owner: b, onResolve: () => { const dir = m.side === 0 ? 0 : Math.PI;
        for (let y = A.y0 + 6; y < A.y1; y += 18) if (Math.abs(y - m.gap) > gw / 2) eshot(m.side === 0 ? A.x0 + 8 : A.x1 - 8, y, dir, spd(b, 92), { life: 6, c: C.gold }); AU.play('ebullet', .8); } });
      m.n++; }
    return m.n >= N && lt > N * .95 + .8; },
  jewels(b, t, dt) { // four jewels orbit the arena rim firing inward while the crown keeps hunting you
    const m = b.mem, A = arenaOf(b);
    if (!m.s) { m.s = 1; cue(b, .9); const rx = (A.x1 - A.x0) / 2 - 18, ry = (A.y1 - A.y0) / 2 - 18, dir = Math.random() < .5 ? 1 : -1;
      for (let i = 0; i < 4; i++) { const a0 = i * 1.5708; G.emitters.push({ owner: b, t: 0, life: 6.5, c: [C.red, C.gold, C.violet, C.cyan][i], x: b.x, y: b.y,
        move(e, dt2) { const a = a0 + dir * e.t * .55, q = Math.min(1, e.t / .8); e.x = lerp(b.x, A.cx + Math.cos(a) * rx, q); e.y = lerp(b.y, A.cy + Math.sin(a) * ry, q); },
        fire(e) { if (e.t < .8) return; const a = ang(e.x, e.y, A.cx, A.cy) + Math.sin(e.t * 2 + i) * .5; eshot(e.x, e.y, a, spd(b, 80), { c: e.c }); }, per: dp(.32 - b.phase * .04) }); } }
    return t > 6.5; },
  limitcut(b, t, dt) { // numbered path, then the boss itself dashes each leg fast and smoothly
    const m = b.mem, p = G.p;
    if (!m.s) { m.s = 'show'; b.anchored = true; const n = Math.min(7, 4 + b.phase + (G.floor >= 3 ? 1 : 0)); m.pts = []; let px = b.x, py = b.y;
      for (let i = 0; i < n; i++) { let q = null; for (let k = 0; k < 40; k++) { const c = rndArenaPt(b, 36); if (dist(c[0], c[1], px, py) > 100 && dist(c[0], c[1], px, py) < 260) { q = c; break; } } q = q || rndArenaPt(b, 36); m.pts.push(q);
        mech({ type: 'path', x: px, y: py, x2: q[0], y2: q[1], num: i + 1, warn: 1.4 + i * .5, owner: b }); px = q[0]; py = q[1]; }
      m.i = 0; m.t0 = t; cue(b, 1.3); }
    if (m.s === 'show') { if (t - m.t0 > 1.3) { m.s = 'dash'; m.t0 = t; AU.play('dash'); } return false; }
    if (m.s === 'dash') { const q = m.pts[m.i], d = dist(b.x, b.y, q[0], q[1]), a = ang(b.x, b.y, q[0], q[1]), step = Math.min(d, 520 * dt);
      b.x += Math.cos(a) * step; b.y += Math.sin(a) * step; m.drop = (m.drop || 0) - dt;
      if (m.drop <= 0) { m.drop = dp(.035); addEnemyBullet({ own: b, x: b.x, y: b.y, vx: 0, vy: 0, r: 2.5, life: 4, delay: .45, c: C.red, burstA: a, lc: 1 }); }
      for (let k = 0; k < 2; k++) part({ x: b.x + rand(-4, 4), y: b.y + rand(-4, 4), life: .3, max: .3, c: k ? col(5) : col(3), s: 2 });
      if (dist(b.x, b.y, p.x, p.y) < b.r + 5) hurtPlayer(1, b.x, b.y);
      if (d < 2) { shake(.12, true); AU.play('slam', 1.4, .4); bring(b, b.x, b.y, dn(6 + b.phase * 2), spd(b, 80), {}, a);
        for (const eb of G.ebullets) if (eb.lc && eb.vx === 0) { const sa = eb.burstA + (Math.random() < .5 ? 1.57 : -1.57); eb.vx = Math.cos(sa) * 55; eb.vy = Math.sin(sa) * 55; eb.acc = 50; eb.maxSpd = 130; eb.lc = 0; }
        m.i++; m.s = 'pause'; m.t0 = t; } return false; }
    if (m.s === 'pause') { if (t - m.t0 > .12) { if (m.i >= m.pts.length) return true; m.s = 'dash'; AU.play('dash', 1.2, .6); } }
    return false; },
  exaflare(b, t) { const m = b.mem; if (!m.s) { m.s = 1; cue(b); const A = arenaOf(b), heads = Math.min(5, 3 + b.phase); m.end = 0;
      for (let j = 0; j < heads; j++) { const side = randi(0, 3), dir = [[1, 0], [-1, 0], [0, 1], [0, -1]][side];
        const sx = side === 0 ? A.x0 + 20 : side === 1 ? A.x1 - 20 : rand(A.x0 + 30, A.x1 - 30), sy = side === 2 ? A.y0 + 20 : side === 3 ? A.y1 - 20 : rand(A.y0 + 30, A.y1 - 30);
        for (let k = 0; k < 14; k++) { const x = sx + dir[0] * k * 26, y = sy + dir[1] * k * 26; if (x < A.x0 || x > A.x1 || y < A.y0 || y > A.y1) break; const w = 1.6 + k * .5 + j * .22;
          mech({ type: 'circle', x, y, r: 22, warn: w, showAt: k ? w - .55 : 0, owner: b, small: k > 0, arrow: k === 0 ? Math.atan2(dir[1], dir[0]) : undefined,
            onResolve: q => { const pc = G.floor === 4 ? choice([C.red, C.cyan]) : null; bring(b, q.x, q.y, dn(5), 70, pc ? { c: pc, pol: pc } : {}, rand(0, 6)); } }); m.end = Math.max(m.end, w + .2); } } }
    return t > m.end; },
  toss(b, t, dt) { // the crown hurls its halo down a marked lane: it spins to the wall and comes back
    const m = b.mem, p = G.p, N = 2 + (b.phase >= 1 ? 1 : 0);
    if (!m.s) { m.s = 1; m.k = 0; m.next = .15; m.out = 0; b.anchored = true; b.goal = null; cue(b, 1.1); }
    if (m.k < N && t > m.next) { const a = ang(b.x, b.y, p.x, p.y) + (m.k ? rand(-.3, .3) : 0), pts = rayPath(b.x, b.y, a, 460, 0), e = pts[pts.length - 1], len = Math.max(60, dist(b.x, b.y, e[0], e[1]) - 8), x = b.x, y = b.y;
      m.out++; AU.play('telegraph', 1.3);
      mech({ type: 'lane', x, y, a, len, w: 24, warn: 1.05, owner: b, follow: true, draw: drawLane, onResolve: q => { AU.play('dash', .8); mech({ type: 'blade', x: q.x, y: q.y, a, len, w: 24, d: 0, v: 330, warn: 99, owner: b, tick: tickBlade, draw: drawBlade, fin: () => m.out-- }); } });
      m.k++; m.next = t + 1.2; }
    if (every(t, dt, dp(.7))) { const a = ang(b.x, b.y, p.x, p.y); for (const i of [-1, 1]) bs(b, b.x, b.y, a + i * .3, spd(b, 100)); }
    return m.k >= N && m.out <= 0 && t > m.next; },

  // ---------------- 3: THE ERASER (bullet painter) ----------------
  sweep(b, t, dt) { // the whole sweep is drawn first: stand outside the wedge, or step inside the eraser's blind ring
    const m = b.mem, p = G.p;
    if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; const a = ang(b.x, b.y, p.x, p.y), dir = Math.random() < .5 ? 1 : -1, arc = 1.9;
      m.a0 = a - dir * arc / 2; m.dir = dir; m.arc = arc; m.va = 1.15 + b.phase * .15;
      mech({ type: 'sector', x: b.x, y: b.y, a0: m.a0, a1: m.a0 + dir * arc, dir, arc, r0: 46, warn: 1.5 + arc / m.va, owner: b, follow: true, followT: 99, draw: drawSweepTel });
      AU.play('telegraph', .4); cue(b, .8); }
    if (t > 1.5 && !m.l) { m.l = { owner: b, a: m.a0, va: m.dir * m.va, len: 460, w: 12, warn: 0, life: m.arc / m.va, r0: 46 }; G.lasers.push(m.l); AU.play('laser'); shake(.35); }
    // residue drifts back into the area the beam already erased
    if (m.l && G.lasers.includes(m.l) && every(t, dt, dp(.09))) { const d = rand(60, 260), x = b.x + Math.cos(m.l.a) * d, y = b.y + Math.sin(m.l.a) * d; if (!shotBlocked(x, y)) eshot(x, y, m.l.a - m.dir * 1.571, 30, { c: col(4), life: 3 }); }
    return t > 1.8 + m.arc / m.va; },
  flower(b, t, dt) { const m = b.mem; m.f = (m.f || 0) - dt; const arms = 5 + b.phase;
    if (m.f <= 0) { m.f = dp(.11 - b.phase * .015); for (let i = 0; i < arms; i++) { bs(b, b.x, b.y, t * 1.3 + i / arms * 6.28, spd(b, 85)); bs(b, b.x, b.y, -t * 1.7 + i / arms * 6.28 + .3, spd(b, 65), { c: C.violet }); } AU.play('ebullet', .7, .6); }
    return t > 3.2; },
  checker(b, t) { const m = b.mem; if (!m.s) { m.s = 1; cue(b); const A = arenaOf(b), sz = 48, cA = [], cB = [];
      for (let y = A.y0, j = 0; y < A.y1; y += sz, j++) for (let x = A.x0, i = 0; x < A.x1; x += sz, i++) ((i + j) % 2 ? cA : cB).push([x, y, Math.min(sz, A.x1 - x), Math.min(sz, A.y1 - y)]);
      const first = Math.random() < .5 ? cA : cB, second = first === cA ? cB : cA;
      // each exploding square spits diagonal shards into the safe squares around it
      const shards = q => { for (const [x, y, w, h] of q.cells) if (Math.random() < .33) for (let k = 0; k < 4; k++) eshot(x + w / 2, y + h / 2, .785 + k * 1.5708, 60, { c: col(4), r: 2.5 }); AU.play('ebullet', .6); };
      mech({ type: 'cells', cells: first, warn: 2.2, owner: b, onResolve: shards }); mech({ type: 'cells', cells: second, warn: 3.6, showAt: 2.2, owner: b, onResolve: shards }); m.end = 3.9;
      if (b.phase >= 1) { mech({ type: 'cells', cells: first, warn: 4.9, showAt: 3.6, owner: b, onResolve: shards }); m.end = 5.2; } }
    return t > m.end; },
  cones(b, t, dt) { // numbered fan cleaves from the eraser's eye, resolving in order
    const m = b.mem, p = G.p;
    if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, .9); const a0 = ang(b.x, b.y, p.x, p.y), sd = Math.random() < .5 ? 1 : -1, x = b.x, y = b.y;
      const as = [a0, a0 + sd * 1.571, a0 - sd * 1.571]; if (b.phase >= 1) as.push(a0 + Math.PI);
      // only the next cone is painted; the later ones wait as numbered outlines
      as.forEach((a, i) => mech({ type: 'cone', x, y, a, h: .785, len: 420, num: i + 1, warn: 1.5 + i * 1.05, showAt: i ? .45 + i * 1.05 : undefined, owner: b, follow: true, draw: drawCone, ghost: drawConeGhost,
        onResolve: q => { for (const e of [q.a - q.h + .07, q.a + q.h - .07]) for (let k = 0; k < dn(3); k++) bs(b, q.x, q.y, e, spd(b, 70 + k * 30), { c: C.red }); } }));
      m.end = 1.5 + (as.length - 1) * 1.05 + .3; }
    if (t > .4 && every(t, dt, dp(.2))) bs(b, b.x, b.y, t * 2.4, spd(b, 55), { c: C.violet });
    return t > m.end; },
  erasure(b, t) { // wide erasing bands sweep across the arena; each one leaves an open gap (or dash through it)
    const m = b.mem, A = arenaOf(b); if (!m.s) { m.s = 1; cue(b, .7); const n = 3 + (b.phase >= 2 ? 1 : 0); m.end = 0;
      // each gap opens within walking reach of you (or of the previous gap on the same axis)
      const last = { v: G.p.y, h: G.p.x };
      for (let i = 0; i < n; i++) { const vert = Math.random() < .5, fwd = Math.random() < .5, w = 1.2 + i * 1.15, lo = vert ? A.y0 : A.x0, hi = vert ? A.y1 : A.x1;
        const c = clamp((vert ? last.v : last.h) + rand(-30, 30), lo + 30, hi - 30); if (vert) last.v = c; else last.h = c;
        mech({ type: 'band', vert, fwd, A, w: 30, gp: (c - lo) / (hi - lo), gw: 46, warn: w, speed: 150 + b.phase * 20, owner: b, pos: null }); m.end = w + 3; } }
    return t > m.end; },
  celestial(b, t, dt) { const m = b.mem; if (!m.s) { m.s = 1; cue(b); const A = arenaOf(b), N = 12, R = 88, dir = Math.random() < .5 ? 1 : -1, a0 = rand(0, 6.283), st = .17 - G.floor * .01; m.cx = A.cx; m.cy = A.cy; m.dir = dir;
      mech({ type: 'circle', x: A.cx, y: A.cy, r: 34, warn: 1.6, owner: b });
      for (let i = 0; i < N * 1.5; i++) { const aa = a0 + dir * i / N * 6.283, w = 1.8 + i * st; mech({ type: 'circle', x: A.cx + Math.cos(aa) * R, y: A.cy + Math.sin(aa) * R * .8, r: 30, warn: w, showAt: w - 1.1, owner: b, small: true }); m.end = w + .3; }
      if (b.phase >= 2 || G.floor >= 4) for (let i = 0; i < 8; i++) { const aa = a0 + Math.PI - dir * i / 8 * 6.283, w = 2.2 + i * .3; mech({ type: 'circle', x: A.cx + Math.cos(aa) * 150, y: A.cy + Math.sin(aa) * 105, r: 30, warn: w, showAt: w - 1, owner: b, small: true }); m.end = Math.max(m.end, w + .3); } }
    // slow rotating spokes from the boss that turn against the wheel
    if (t > 1 && every(t, dt, dp(.16))) { for (let i = 0; i < 3; i++) { const pc = G.floor === 4 ? [C.red, C.cyan, C.red][i] : null; bs(b, b.x, b.y, -m.dir * t * .9 + i * 2.094, spd(b, 60), pc ? { c: pc, pol: pc } : { c: C.violet }); } }
    return t > m.end; },
  blot(b, t, dt) { // ink blots land on one half of the page; then their mirror image lands on the other half
    const m = b.mem, A = arenaOf(b);
    if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, .8); const horiz = Math.random() < .5, side = Math.random() < .5 ? -1 : 1, n = 4 + (b.phase >= 1 ? 1 : 0), pts = [];
      for (let i = 0; i < n; i++) for (let k = 0; k < 60; k++) { const x = horiz ? rand(A.x0 + 30, A.x1 - 30) : (side > 0 ? rand(A.cx + 34, A.x1 - 30) : rand(A.x0 + 30, A.cx - 34)), y = horiz ? (side > 0 ? rand(A.cy + 30, A.y1 - 28) : rand(A.y0 + 28, A.cy - 30)) : rand(A.y0 + 28, A.y1 - 28);
        if (pts.every(o => dist(o[0], o[1], x, y) > 48)) { pts.push([x, y]); break; } }
      const mir = ([x, y]) => horiz ? [x, 2 * A.cy - y] : [2 * A.cx - x, y];
      const mk = (x, y, w, sa) => mech({ type: 'blot', x, y, r: 28, seed: rand(0, 6.28), warn: w, showAt: sa, owner: b, onResolve: q => { splat(q.x, q.y, col(0), 12, 20); const nb = dn(6);
        for (let j = 0; j < nb; j++) { const a = q.seed + j / nb * 6.283; eshot(q.x + Math.cos(a) * (q.r + 4), q.y + Math.sin(a) * (q.r + 4), a, spd(b, 50), { c: col(4), life: 2.2 }); } } });
      pts.forEach(q => mk(q[0], q[1], 1.9));
      pts.forEach(q => { const [x, y] = mir(q); mk(x, y, 3.3, 1.9); });
      m.end = 3.6;
      if (b.phase >= 2) { for (let i = 0; i < 3; i++) { const f = (i + .5) / 3, x = horiz ? lerp(A.x0 + 30, A.x1 - 30, f) : A.cx, y = horiz ? A.cy : lerp(A.y0 + 28, A.y1 - 28, f); mk(x, y, 4.6, 3.3); } m.end = 4.9; }
      mech({ type: 'fold', x: A.cx, y: A.cy, horiz, A, warn: m.end, owner: b }); }
    if (t > .5 && t < m.end - .4 && every(t, dt, dp(.8))) bs(b, b.x, b.y, ang(b.x, b.y, G.p.x, G.p.y), spd(b, 90), { c: col(4) });
    return t > m.end; },
  gaze(b, t, dt) { const m = b.mem; if (!m.s) { m.s = 1; cue(b, .9); mech({ type: 'gaze', owner: b, warn: 2.4, dmg: 1 }); AU.play('gaze'); b.anchored = true; }
    if (t < 2.4 && every(t, dt, dp(.1))) bs(b, b.x, b.y, t * 3.1, spd(b, 75), { c: C.violet });
    return t > 2.9; },
  void(b, t) { const m = b.mem, p = G.p; if (!m.done) { m.done = 1; for (let i = 0; i < 4 + b.phase; i++) { const tx = i === 0 ? p.x : p.x + rand(-120, 120), ty = i === 0 ? p.y : p.y + rand(-80, 80); if (!shotBlocked(tx, ty)) G.zones.push({ x: tx, y: ty, r: rand(22, 34), warn: 1.1, life: 3, kind: 'void' }); } AU.play('telegraph', .3); }
    return t > 1.8; },
  homing(b, t) { const m = b.mem; m.n = m.n || 0; const N = 5 + b.phase * 2;
    if (m.n < N && t > m.n * .18) { const a = rand(0, 6.28); addEnemyBullet({ own: b, x: b.x, y: b.y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, r: 4, life: 5, c: C.violet, homing: 1.4, homeT: 2.2 }); AU.play('ebullet', .5); m.n++; }
    return t > N * .18 + .8; },

  // ---------------- 4: THE ARBITER (methodical judge) ----------------
  inout(b, t) { const m = b.mem; if (!m.s) { m.s = 1; b.anchored = true; cue(b);
      mech({ type: 'circle', x: b.x, y: b.y, r: 74, warn: 1.7, owner: b, follow: true, tip: 'mt_steel', onResolve: q => bring(b, q.x, q.y, dn(22), spd(b, 100), {}, rand(0, 6), 2) }); }
    // moon: a wide safe core; the inward wave dissolves right at its edge so the core stays clean
    if (t > 1.7 && !m.d) { m.d = 1; const R0 = 60; mech({ type: 'donut', x: b.x, y: b.y, r0: R0, warn: 1.15, owner: b, follow: true, onResolve: q => { const n = dn(22), s0 = spd(b, 75), se = s0 * (1 + .1 * (G.curse || 0) + .07 * G.floor);
        for (let i = 0; i < n; i++) { const a = i / n * 6.283, rx = Math.cos(a) * 170, ry = Math.sin(a) * 140, pu = rx * Math.cos(a) + ry * Math.sin(a), pe = Math.abs(rx * Math.sin(a) - ry * Math.cos(a)), stop = pu - Math.sqrt(Math.max(0, (R0 + 8) ** 2 - pe * pe));
          eshot(q.x + rx, q.y + ry, a + Math.PI, s0, { life: Math.max(.2, stop / se) }); } } }); }
    return t > 3.2; },
  cleave(b, t, dt) { const m = b.mem, A = arenaOf(b);
    if (!m.s) { m.s = 1; b.anchored = true; const side = Math.random() < .5 ? 1 : -1; m.side = side; b.hand = side; cue(b); m.x = b.x;
      mech({ type: 'half', x: b.x, y: b.y, a: side > 0 ? 0 : Math.PI, warn: 1.6, owner: b, A }); }
    // the safe half is not free: a slow curtain closes in from its far wall
    if (t < 2.4 && every(t, dt, dp(.38))) { const fromX = m.side > 0 ? A.x0 + 6 : A.x1 - 6, gy = rand(A.y0 + 30, A.y1 - 30); for (let y = A.y0 + 8; y < A.y1; y += 14) if (Math.abs(y - gy) > 22) eshot(fromX, y, m.side > 0 ? 0 : Math.PI, 55, { life: 4, c: C.gold }); }
    if (t > 1.7) b.hand = 0; return t > 2.4; },
  gavel(b, t) { // three remote gavel strikes on your position, each faster
    const m = b.mem, p = G.p; m.n = m.n || 0; const ws = [1.3, 1.0, .75, .6]; const N = 3 + (b.phase >= 2 ? 1 : 0);
    if (!m.n) { cue(b, 1.1); b.hand = 1; }
    if (m.n < N && t > (m.next || 0)) { const w = ws[m.n]; mech({ type: 'circle', x: p.x, y: p.y, r: 34, warn: w, owner: b, tip: 'mt_gavel', onResolve: q => { bring(b, q.x, q.y, dn(12), spd(b, 85), {}, rand(0, 6)); shake(.18, true); } }); m.next = t + w * .85; m.n++; }
    if (t > (m.next || 0) + .6 && m.n >= N) { b.hand = 0; return true; } return false; },
  brand(b, t, dt) { const m = b.mem; m.n = m.n || 0; if (!m.n) cue(b);
    if (m.n < 3 && t > m.n * .9) { mech({ type: 'spread', r: 20, warn: 1.6, owner: b, linger: 7 }); m.n++; }
    if (every(t, dt, .25)) bring(b, b.x, b.y, dn(6), spd(b, 65), {}, t);
    return t > 3.8; },
  towers(b, t, dt) { const m = b.mem; if (!m.s) { m.s = 1; cue(b, 1.2); const n = 3 + (b.phase >= 2 ? 1 : 0); let px = G.p.x, py = G.p.y;
      // each tower is close enough to the previous one to reach in time
      for (let i = 0; i < n; i++) { let q = null; const lo = i ? 55 : 40, hi = i ? 92 : 150; for (let k = 0; k < 80; k++) { const c = rndArenaPt(b, 40), d = dist(c[0], c[1], px, py); if (d > lo && d < hi) { q = c; break; } } q = q || rndArenaPt(b, 40); px = q[0]; py = q[1];
        mech({ type: 'tower', x: q[0], y: q[1], r: 16, warn: 2.2 + i * 1.15, owner: b, onResolve: z => { const n = dn(8), o = rand(0, 6); for (let k = 0; k < n; k++) { const a = o + k / n * 6.283; bs(b, z.x + Math.cos(a) * (z.r + 10), z.y + Math.sin(a) * (z.r + 10), a, 70, { c: C.gold }); } } }); } m.end = 2.4 + n * 1.15; }
    if (every(t, dt, dp(.55))) { const a = ang(b.x, b.y, G.p.x, G.p.y); for (let i = -1; i <= 1; i++) bs(b, b.x, b.y, a + i * .25, spd(b, 95)); }
    return t > m.end; },
  scales(b, t, dt) { // the pans tip: the heavy side detonates, then judgment rains on the light side
    const m = b.mem, A = arenaOf(b);
    if (!m.s) { m.s = 1; b.anchored = true; cue(b, .8); m.heavy = Math.random() < .5 ? -1 : 1; const lx = (A.x0 + A.cx) / 2, rx = (A.x1 + A.cx) / 2;
      mech({ type: 'pans', x: A.cx, y: A.cy, heavy: m.heavy, warn: 2.2, owner: b, A });
      mech({ type: 'half', x: A.cx, y: A.cy, a: m.heavy > 0 ? 0 : Math.PI, warn: 2.2, owner: b, A, onResolve: () => { m.rain = true; m.t0 = t; } }); }
    if (m.rain && every(t, dt, dp(.3))) { const x0 = m.heavy > 0 ? A.x0 : A.cx, x1 = m.heavy > 0 ? A.cx : A.x1, gx = rand(x0 + 20, x1 - 20); for (let x = x0 + 6; x < x1; x += 13) if (Math.abs(x - gx) > 20) eshot(x, A.y0 + 6, Math.PI / 2, spd(b, 85), { life: 5, c: C.gold }); }
    return m.rain && t - m.t0 > 2.2; },
  doom(b, t, dt) { const m = b.mem; if (!m.s) { m.s = 1; cue(b, .7); let c = null; for (let k = 0; k < 40; k++) { const q = rndArenaPt(b, 30); if (dist(q[0], q[1], G.p.x, G.p.y) > 130) { c = q; break; } } c = c || rndArenaPt(b, 30);
      m.m = mech({ type: 'doom', owner: b, warn: 8 - G.floor * .3, cx: c[0], cy: c[1], cAt: 2.4, cEnd: 7.4 - G.floor * .3, r: 16, dmg: 2 }); AU.play('curse', 1, .5); }
    // a guard ring around the light keeps spinning bullets at it
    if (m.m && G.mechs.includes(m.m) && m.m.t > m.m.cAt && every(t, dt, dp(.22))) { const a = t * 2; for (let k = 0; k < 2; k++) eshot(m.m.cx + Math.cos(a + k * 3.14) * 46, m.m.cy + Math.sin(a + k * 3.14) * 46, a + k * 3.14 + 1.9, 55, { c: C.violet, life: 2 }); }
    return t > 2.6; },
  plus(b, t, dt) { // judgment crosses: each locks onto where you stand, then both of its lines strike
    const m = b.mem, A = arenaOf(b), N = 3 + (b.phase >= 2 ? 1 : 0); m.n = m.n || 0;
    if (!m.c) { m.c = 1; cue(b, 1.2); b.hand = -1; }
    if (m.n < N && t > m.n * 1.0) { mech({ type: 'plus', x: G.p.x, y: G.p.y, w: 22, warn: 1.7, lockAt: 1.05, A, owner: b, draw: drawPlus, onResolve: q => { for (let i = 0; i < 4; i++) bs(b, q.x, q.y, i * 1.571, spd(b, 70), { c: C.gold }); } }); AU.play('telegraph', 1.4); m.n++; }
    if (every(t, dt, dp(.6))) bs(b, b.x, b.y, ang(b.x, b.y, G.p.x, G.p.y), spd(b, 100));
    if (m.n >= N && t > N + .9) { b.hand = 0; return true; } return false; },
  cage(b, t, dt) { // a closing box of judgment around you: leave through its one opening, or dash through a wall
    const m = b.mem, p = G.p, A = arenaOf(b);
    if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, .8); AU.play('curse', 1.2, .5); const h = 64;
      const x = clamp(p.x, A.x0 + h + 4, A.x1 - h - 4), y = clamp(p.y, A.y0 + h + 4, A.y1 - h - 4);
      m.m = mech({ type: 'cage', x, y, h0: h, h, side: randi(0, 3), gp: rand(-.45, .45), gw: 30, t0: .9, dur: 3.2, warn: 99, owner: b, tick: tickCage, draw: drawCage }); }
    if (t > .9 && t < 4 && every(t, dt, dp(.8))) { const a = ang(b.x, b.y, p.x, p.y); for (let i = -1; i <= 1; i++) bs(b, b.x, b.y, a + i * .22, spd(b, 80), { c: C.gold }); }
    return t > 1 && !G.mechs.includes(m.m); },

  // ---------------- 5: THE ABSENCE (form 1) ----------------
  polarity(b, t, dt) { const m = b.mem, A = arenaOf(b);
    if (!m.s) { m.s = 1; cue(b); const pc = choice([C.red, C.cyan]); G.p.pol = pc;
      m.m = mech({ type: 'polarity', x: A.cx, y: A.cy, a: choice([0, Math.PI / 2, Math.PI, -Math.PI / 2]), c1: C.red, c2: C.cyan, pc, warn: 3.6, dmg: 2, owner: b, A }); }
    if (b.phase >= 1 && t > 1.9 && !m.sw) { m.sw = 1; m.m.pc = G.p.pol = m.m.pc === C.red ? C.cyan : C.red; AU.play('telegraph', 1.5); ringFx(G.p.x, G.p.y, 18, m.m.pc, .35, 2); burst(G.p.x, G.p.y, 16, m.m.pc, 100, .4); }
    // two-color rings: bullets of your color pass through you
    if (every(t, dt, .45)) { for (let i = 0; i < 10; i++) { const pc = i % 2 ? C.red : C.cyan; bs(b, b.x, b.y, i / 10 * 6.283 + t * .4, spd(b, 60), { c: pc, pol: pc }); } AU.play('ebullet', .8, .6); }
    return t > 4; },
  prismfall(b, t, dt) { const m = b.mem, p = G.p; m.n = m.n || 0; const N = 9 + b.phase * 3;
    if (!m.n) { cue(b, 1.2); G.p.pol = choice([C.red, C.cyan]); m.until = N * .2 + 1.6; }
    if (m.n < N && t > m.n * .2) { const tx = p.x + rand(-90, 90), ty = p.y + rand(-70, 70); if (!shotBlocked(tx, ty)) { const pc = choice([C.red, C.cyan]);
        mech({ type: 'circle', x: tx, y: ty, r: 18, warn: 1, owner: b, small: true, tint: pc, onResolve: q => bring(b, q.x, q.y, dn(8), 75, { c: pc, pol: pc }, rand(0, 6)) }); } m.n++; }
    if (t > m.until) { G.p.pol = null; return true; } return false; },
  stillness(b, t, dt) { // time stops around you: be perfectly still when the clock runs out
    const m = b.mem; if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, .6); AU.play('curse', .8, .5);
      m.m = mech({ type: 'still', warn: 3.4, dmg: 2, owner: b, draw: drawStill });
      for (let i = 0; i < 4; i++) { const q = rndArenaPt(b, 40); mech({ type: 'circle', x: q[0], y: q[1], r: 30, warn: 1.4 + i * .25, owner: b }); } }
    return t > 3.8; },
  gather(b, t) { // three prism orbs: touch the one in YOUR color before the light runs out
    const m = b.mem, p = G.p;
    if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, 1.2); const cs = shuffle(PCOLS().slice()), pts = [];
      for (let i = 0; i < 3; i++) { let q = null; for (let k = 0; k < 80; k++) { const c = rndArenaPt(b, 36); if (dist(c[0], c[1], p.x, p.y) > 70 && dist(c[0], c[1], b.x, b.y) > 50 && pts.every(o => dist(o[0], o[1], c[0], c[1]) > 80)) { q = c; break; } } pts.push(q || rndArenaPt(b, 36)); }
      const orbs = pts.map((q, i) => ({ x: q[0], y: q[1], c: cs[i] })), near = orbs.filter(o => dist(o.x, o.y, p.x, p.y) < 240);
      p.pol = (near.length ? choice(near) : orbs.reduce((a, o) => dist(o.x, o.y, p.x, p.y) < dist(a.x, a.y, p.x, p.y) ? o : a)).c;
      m.m = mech({ type: 'orbs', orbs, warn: 4.8, dmg: 2, owner: b, tick: tickOrbs, draw: drawOrbs }); AU.play('telegraph', 1.6); }
    if (t > .5 && !G.mechs.includes(m.m)) { G.p.pol = null; return true; } return false; },
  stars(b, t) { // hollow stars drift after you: outpace them until they collapse
    const m = b.mem; if (!m.s) { m.s = 1; cue(b, 1.1); const n = 3 + (b.phase >= 2 ? 1 : 0); m.ms = [];
      for (let i = 0; i < n; i++) { const a = i / n * 6.283 + rand(0, 1); m.ms.push(mech({ type: 'star', x: b.x + Math.cos(a) * 20, y: b.y + Math.sin(a) * 20, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, r: 9, spd: 40 + b.phase * 5, life: 5.6, warn: 99, owner: b, tick: tickStar, draw: drawStar })); } }
    return t > 1 && !m.ms.some(o => G.mechs.includes(o)); },
  reverse(b, t, dt) { // the absence turns your steps inside out: movement is mirrored for a while
    const m = b.mem, p = G.p; if (!m.s) { m.s = 1; cue(b, .7); AU.play('curse', 1.4, .5); mech({ type: 'reverse', warn: 4.6, on: 1, owner: b, draw: drawReverse }); }
    // aimed fans with an open middle: standing still is safe, the drops below are not
    if (t > 1 && t < 4.4 && every(t, dt, dp(.7))) { const a = ang(b.x, b.y, p.x, p.y); for (const i of [-2, -1, 1, 2]) bs(b, b.x, b.y, a + i * .2, spd(b, 70), { c: C.violet }); }
    if (t > 1.2 && t < 4 && every(t, dt, 1)) { const x = p.x + rand(-50, 50), y = p.y + rand(-40, 40); if (!shotBlocked(x, y)) mech({ type: 'circle', x, y, r: 20, warn: 1.1, owner: b, small: true, tint: C.violet }); }
    return t > 4.8; },
  singular(b, t, dt) { // a singularity drags you in: walk against the pull and keep clear of its core
    const m = b.mem, p = G.p; if (!m.s) { m.s = 1; cue(b); let q = null; for (let k = 0; k < 40; k++) { const c = rndArenaPt(b, 70); if (dist(c[0], c[1], p.x, p.y) > 90) { q = c; break; } } q = q || rndArenaPt(b, 70); m.x = q[0]; m.y = q[1];
      m.m = mech({ type: 'well', x: m.x, y: m.y, r: 20, pull: 48 + b.phase * 6, t0: .8, dur: 3.4, warn: 99, owner: b, tick: tickWell, draw: drawWell }); AU.play('curse', .6, .5); }
    // bullets spiral INTO the singular point, crossing your path
    if (t > .8 && t < 4 && every(t, dt, dp(.12))) { const a = t * 4; eshot(m.x + Math.cos(a) * 170, m.y + Math.sin(a) * 130, a + Math.PI + .35, 75, { c: C.violet, life: 2.6 }); }
    return t > 1 && !G.mechs.includes(m.m); },
  nullwind(b, t, dt) { const m = b.mem; if (!m.s) { m.s = 1; const A = arenaOf(b), side = randi(0, 3); m.src = [[A.x0 + 10, A.cy], [A.x1 - 10, A.cy], [A.cx, A.y0 + 10], [A.cx, A.y1 - 10]][side]; m.dir = [0, Math.PI, Math.PI / 2, -Math.PI / 2][side]; m.A = A;
      cue(b, .7); mech({ type: 'knock', x: m.src[0], y: m.src[1], force: 520, warn: 2.3, owner: b, A, wind: true }); }
    // after the gust, the wind keeps blowing bullets across the arena
    if (t > 2.4 && t < 4.4 && every(t, dt, dp(.2))) { const A = m.A, horiz = Math.abs(Math.cos(m.dir)) > .5; for (let k = 0; k < 3; k++) { const x = horiz ? m.src[0] : rand(A.x0 + 10, A.x1 - 10), y = horiz ? rand(A.y0 + 10, A.y1 - 10) : m.src[1]; eshot(x, y, m.dir + rand(-.1, .1), 110, { c: col(4), life: 4 }); } }
    return t > 4.5; },

  // ---------------- 5b: THE ABSENCE · RECOMPOSED (entirely new kit) ----------------
  spectrum(b, t, dt) { const m = b.mem; if (!m.s) { m.s = 1; b.anchored = true; cue(b, .6); const a0 = rand(0, 6.28), dir = Math.random() < .5 ? 1 : -1; G.p.pol = choice(PCOLS());
      for (let i = 0; i < 6; i++) { const c = PCOLS()[i % 3]; G.lasers.push({ owner: b, a: a0 + i * 1.047, va: dir * (.45 + b.phase * .08), len: 420, w: 7, warn: 1.1, life: 4, c, pol: c }); } AU.play('telegraph', .5); }
    if (t > 1.1 && !m.snd) { m.snd = 1; AU.play('laser'); }
    if (t > 1.1 && every(t, dt, .35)) { for (let i = 0; i < 6; i++) { const c = PCOLS()[i % 3]; bs(b, b.x, b.y, i / 6 * 6.283 - t, spd(b, 70), { c, pol: c }); } }
    if (t > 5.1) { G.p.pol = null; return true; } return false; },
  chroma(b, t, dt) { // your color cycles; a three-color storm where only your color is safe to touch
    const m = b.mem; if (!m.s) { m.s = 1; cue(b, 1.3); m.i = 0; }
    const cs = PCOLS(), per = 1.5 - b.phase * .15, idx = Math.floor(t / per) % 3;
    if (G.p.pol !== cs[idx]) { G.p.pol = cs[idx]; AU.play('telegraph', 1.6); burst(G.p.x, G.p.y, 10, cs[idx], 90, .3); }
    if (every(t, dt, .3)) { const a = ang(b.x, b.y, G.p.x, G.p.y); for (let i = 0; i < 4; i++) { const c = cs[(i + m.i) % 3]; bs(b, b.x, b.y, a + (i - 1.5) * .2, spd(b, 95), { c, pol: c }); } m.i++; }
    if (every(t, dt, .9)) { for (let i = 0; i < 11; i++) { const c = cs[i % 3]; bs(b, b.x, b.y, i / 11 * 6.283 + t, spd(b, 55), { c, pol: c }); } }
    if (t > 6) { G.p.pol = null; return true; } return false; },
  collapse(b, t, dt) { // the arena closes to a drifting circle; everything outside is erased
    const m = b.mem, A = arenaOf(b); if (!m.s) { m.s = 1; cue(b, .5); const [tx, ty] = rndArenaPt(b, 80);
      m.m = mech({ type: 'ring', x: A.cx, y: A.cy, tx, ty, r0: 200, r1: 70 - b.phase * 8, r: 200, warn: 1.4, dur: 5, owner: b }); }
    if (t > 1.4 && every(t, dt, dp(.1))) bs(b, b.x, b.y, t * 2.6, spd(b, 70), { c: col(5) });
    return t > 6.6; },
  nova(b, t, dt) { // prism shockwaves race outward: slip through the open arc, or dash across the wave
    const m = b.mem, p = G.p, N = 3 + (b.phase >= 1 ? 1 : 0); if (!m.s) { m.s = 1; m.n = 0; b.anchored = true; b.goal = null; cue(b, 1.1); }
    if (m.n < N && t > .2 + m.n * 1.3) { const ga = ang(b.x, b.y, p.x, p.y) + (Math.random() < .5 ? 1 : -1) * rand(.6, 1.4);
      mech({ type: 'nova', x: b.x, y: b.y, R: 8, gap: ga, gh: .5, c: PCOLS()[m.n % 3], t0: 1, followT: 1, follow: true, v: 100, warn: 99, owner: b, tick: tickNova, draw: drawNova }); AU.play('telegraph', .9 + m.n * .1); m.n++; }
    return m.n >= N && t > .2 + (N - 1) * 1.3 + 5; },
  mirror(b, t, dt) { const m = b.mem; if (!m.s) { m.s = 1; b.mirrorT = 6.5; cue(b, 1.4); AU.play('curse', 1.5, .4); }
    if (every(t, dt, dp(.1)) && t < 5.5) bs(b, b.x, b.y, t * 2.2, spd(b, 80), { c: C.violet });
    if (every(t, dt, 1.1)) { const a = ang(b.x, b.y, G.p.x, G.p.y); for (let i = -1.5; i <= 1.5; i++) bs(b, b.x, b.y, a + i * .17, spd(b, 120)); }
    return t > 6.5; },
  prismnuke(b, t, dt) { const m = b.mem, A = arenaOf(b); if (!m.s) { m.s = 1; b.anchored = true; cue(b, .5); G.p.pol = choice(PCOLS());
      mech({ type: 'slices', x: A.cx, y: A.cy, a0: rand(0, 6.28), va: (Math.random() < .5 ? 1 : -1) * .35, warn: 4.6, owner: b, dmg: 2, A }); AU.play('telegraph', .3); }
    if (t < 4.4 && every(t, dt, .4)) { const a = ang(b.x, b.y, G.p.x, G.p.y); for (let i = -1; i <= 1; i++) { const c = PCOLS()[(i + 3) % 3]; bs(b, b.x, b.y, a + i * .25, spd(b, 85), { c, pol: c }); } }
    if (t > 5) { G.p.pol = null; return true; } return false; },
};

// ===== FF14-style telegraphed mechanics =====
function mech(o) { const m = Object.assign({ t: 0, warn: 1.2, dmg: 1 }, o); G.mechs.push(m); return m; }
function inMech(m, x, y) {
  switch (m.type) {
    case 'circle': case 'tower': case 'track': return dist(x, y, m.x, m.y) < m.r;
    case 'blot': return dist(x, y, m.x, m.y) < blotR(m, ang(m.x, m.y, x, y));
    case 'cells': return m.cells.some(([cx, cy, w, h]) => x >= cx && x < cx + w && y >= cy && y < cy + h);
    case 'donut': return dist(x, y, m.x, m.y) > m.r0;
    case 'half': return (x - m.x) * Math.cos(m.a) + (y - m.y) * Math.sin(m.a) > 0;
    case 'cone': return dist(x, y, m.x, m.y) < m.len && Math.abs(angDiff(m.a, ang(m.x, m.y, x, y))) < m.h;
    case 'plus': return Math.abs(x - m.x) < m.w / 2 || Math.abs(y - m.y) < m.w / 2;
    case 'rect': return Math.abs(x - m.x) < m.w / 2 && Math.abs(y - m.y) < m.h / 2;
    case 'seg': return segDist(x, y, m.x, m.y, m.x2, m.y2) < m.w / 2;
    case 'annulus': { const d = dist(x, y, m.x, m.y); return d >= m.r0 && d < m.r1; }
    case 'holes': { const A = m.A; if (x < A.x0 || x > A.x1 || y < A.y0 || y > A.y1) return false; return !m.holes.some(h => inHole(h, x, y)); }
  }
  return false;
}
function inHole(h, x, y) { if (h.sector) { const a = h.mm ? h.mm.a : h.a; return dist(x, y, h.x, h.y) < h.len && Math.abs(angDiff(a, ang(h.x, h.y, x, y))) < h.h; } if (h.x2 !== undefined) return segDist(x, y, h.x, h.y, h.x2, h.y2) < h.w / 2; return dist(x, y, h.x, h.y) < h.r; }
function polSide(m, x, y) { return (x - m.x) * Math.cos(m.a) + (y - m.y) * Math.sin(m.a) > 0 ? m.c1 : m.c2; }
function sliceColor(m, x, y) { const a = Math.atan2(y - m.y, x - m.x) - (m.a0 + m.va * m.t); const i = ((Math.floor(a / 1.0472) % 6) + 6) % 6; return PCOLS()[i % 3]; }
function mechFail(m, x, y) { hurtPlayer(m.dmg, x, y, true); flash(C.red, .25, true); }
function bandGap(m) { const c = m.vert ? lerp(m.A.y0, m.A.y1, m.gp) : lerp(m.A.x0, m.A.x1, m.gp); return [c - m.gw / 2, c + m.gw / 2]; }
function bandRect(m) { const A = m.A, span = m.vert ? A.x1 - A.x0 : A.y1 - A.y0, k = clamp((m.t - m.warn) * m.speed / span, 0, 1), pos = m.fwd ? k : 1 - k;
  return m.vert ? [A.x0 + pos * span - m.w / 2, A.y0, m.w, A.y1 - A.y0] : [A.x0, A.y0 + pos * span - m.w / 2, A.x1 - A.x0, m.w]; }
function updateMechs(dt) {
  const p = G.p;
  // A lethal hit can trigger Lazarus, kill the boss and clear hazards mid-loop.
  for (let i = G.mechs.length - 1; i >= 0; i--) { const m = G.mechs[i]; if (!m) continue;
    const previousShooter = G.curShooter; G.curShooter = m.owner || null;
    try {
    if (m.owner && m.owner.dead && (m.cancelOnDeath || m.owner.boss)) { G.mechs.splice(i, 1); continue; }
    if (m.follow && m.owner && !m.owner.dead && m.t < (m.followT !== undefined ? m.followT : m.warn)) { m.x = m.owner.x; m.y = m.owner.y; }
    if (m.type === 'spread' && m.t < m.warn) { m.x = p.x; m.y = p.y; }
    if (m.type === 'plus' && m.t < m.lockAt) { m.x = p.x; m.y = p.y; }
    if (m.type === 'track' && m.t < m.lockAt) { const d = dist(m.x, m.y, p.x, p.y); if (d > 1) { const s2 = Math.min(d, m.spd * dt); m.x += (p.x - m.x) / d * s2; m.y += (p.y - m.y) / d * s2; } if (Math.random() < .3) part({ x: m.x + rand(-m.r, m.r), y: m.y + rand(-m.r, m.r), vx: 0, vy: -20, life: .3, max: .3, c: C.red }); }
    if (m.type === 'doom' && m.t > m.cAt && m.t < m.cEnd && p.alive && dist(p.x, p.y, m.cx, m.cy) < m.r + 4) { G.mechs.splice(i, 1); AU.play('heal'); burst(p.x, p.y, 24, col(5), 120, .5); ringFx(m.cx, m.cy, 30, col(5), .4, 3); continue; }
    m.t += dt;
    // moving / lasting mechanics
    if (m.type === 'band' && m.t >= m.warn) { const [x, y, w, h] = bandRect(m), done = (m.t - m.warn) * m.speed > (m.vert ? m.A.x1 - m.A.x0 : m.A.y1 - m.A.y0);
      const [g0, g1] = bandGap(m), along = m.vert ? p.y : p.x, inGap = along > g0 + 2 && along < g1 - 2;
      if (p.alive && !inGap && p.x > x && p.x < x + w && p.y > y && p.y < y + h) hurtPlayer(1, p.x, p.y);
      if (Math.random() < .3) { const rx = x + rand(0, w), ry = y + rand(0, h), al = m.vert ? ry : rx; if (al < g0 || al > g1) eshot(rx, ry, rand(0, 6.28), 25, { c: col(4), life: 3 }); }
      if (!m.snd) { m.snd = 1; AU.play('laser', 1.2, .6); shake(.2, true); }
      if (done) G.mechs.splice(i, 1); continue; }
    if (m.type === 'ring' && m.t >= m.warn) { const q = clamp((m.t - m.warn) / (m.dur * .6), 0, 1), back = clamp((m.t - m.warn - m.dur * .8) / (m.dur * .2), 0, 1);
      m.x = lerp(m.x, m.tx, dt * .5); m.y = lerp(m.y, m.ty, dt * .5); m.r = lerp(lerp(m.r0, m.r1, q * q * (3 - 2 * q)), m.r0, back);
      if (p.alive && dist(p.x, p.y, m.x, m.y) > m.r) hurtPlayer(1, p.x, p.y, true);
      if (m.t > m.warn + m.dur) G.mechs.splice(i, 1); continue; }
    if (m.tick) { if (m.tick(m, dt)) G.mechs.splice(i, 1); continue; }
    if (m.t < m.warn) continue;
    G.mechs.splice(i, 1);
    const big = !m.small;
    switch (m.type) {
      case 'track': case 'cells':
        AU.play('resolve', 1, m.type === 'track' ? .8 : .55); resolveFx(m);
        if (p.alive && inMech(m, p.x, p.y)) mechFail(m, m.x || p.x, m.y || p.y); break;
      case 'tether': { const b = m.owner, d = dist(b.x, b.y, p.x, p.y); AU.play('resolve', 1.3, .7); for (let k = 0; k < 12; k++) part({ x: lerp(b.x, p.x, k / 12), y: lerp(b.y, p.y, k / 12), vx: rand(-30, 30), vy: rand(-30, 30), life: .3, max: .3, c: d < m.minD ? C.red : C.cyan });
        if (d < m.minD) mechFail(m, b.x, b.y); else AU.play('soak'); break; }
      case 'doom': mechFail(m, p.x, p.y); flash(col(0), .5, true); break;
      case 'nuke': { const d = dist(p.x, p.y, m.x, m.y); AU.play('explode'); AU.play('slam'); flash(col(5), .9, true); chroma(1.5, true); shake(.8, true); hitstop(.12, true);
        for (let k = 0; k < 5; k++) ringFx(m.x, m.y, 60 + k * 45, k % 2 ? C.orange : col(5), .5 + k * .1, 4); burst(m.x, m.y, 60, col(5), 300, .8, 2); splat(m.x, m.y, col(0), 60, 60);
        if (p.alive) { if (d < m.rIn) hurtPlayer(3, m.x, m.y, true); else if (d < m.rMid) hurtPlayer(1, m.x, m.y, true); } break; }
      case 'still': { const moving = p.dashT > 0 || Math.hypot(p.vx, p.vy) > 14; flash(C.violet, .35, true); AU.play('resolve', .7);
        if (!p.alive) break; if (moving) mechFail(m, p.x, p.y);
        else { AU.play('soak'); ringFx(p.x, p.y, 26, col(5), .4, 2); const n = dn(12), o = rand(0, 6); for (let k = 0; k < n; k++) { const a = o + k / n * 6.283; eshot(p.x + Math.cos(a) * 26, p.y + Math.sin(a) * 26, a, 60, { c: C.violet }); } } break; }
      case 'regard': { const b = m.owner, facing = Math.abs(angDiff(p.aim, ang(p.x, p.y, b.x, b.y))) < 1.25; flash(C.gold, .3, true); AU.play('gaze', 1.2); if (!facing && p.alive) mechFail(m, b.x, b.y); else AU.play('soak'); break; }
      case 'restless': { const moving = p.dashT > 0 || Math.hypot(p.vx, p.vy) > 26; flash(C.cyan, .35, true); AU.play('resolve', 1.3); if (p.alive && !moving) mechFail(m, p.x, p.y); else if (p.alive) { AU.play('soak'); ringFx(p.x, p.y, 20, C.cyan, .35, 2); } break; }
      case 'rect': case 'seg': case 'annulus': case 'holes':
        AU.play('resolve', 1, big ? .9 : .45); if (big) shake(.22, true); resolveFx(m);
        if (p.alive && inMech(m, p.x, p.y)) mechFail(m, m.x || p.x, m.y || p.y); break;
      case 'circle': case 'blot': case 'donut': case 'half': case 'cone': case 'plus':
        AU.play('resolve', 1, big ? 1 : .45); if (big) shake(.25, true); resolveFx(m);
        if (p.alive && inMech(m, p.x, p.y)) mechFail(m, m.x, m.y); break;
      case 'tower':
        if (p.alive && dist(p.x, p.y, m.x, m.y) < m.r) { AU.play('soak'); ringFx(m.x, m.y, m.r + 8, C.gold, .4, 2); burst(m.x, m.y, 20, C.gold, 120, .5); }
        else { AU.play('resolve'); ringFx(m.x, m.y, 200, C.red, .5, 3); mechFail(m, m.x, m.y); } break;
      case 'spread': AU.play('resolve', 1.2, .6); G.zones.push({ x: m.x, y: m.y, r: m.r, warn: .35, life: m.linger || 6, kind: 'void' }); ringFx(m.x, m.y, m.r + 6, C.violet, .3, 2); break;
      case 'gaze': { const b = m.owner, facing = Math.abs(angDiff(p.aim, ang(p.x, p.y, b.x, b.y))) < 1.25; flash(C.violet, .3, true); AU.play('gaze');
        if (facing && p.alive) { mechFail(m, b.x, b.y); p.slowT = 2.5; } break; }
      case 'knock': AU.play('knock'); ringFx(m.x, m.y, 70, col(5), .5, 3); for (let k = 0; k < 20; k++) { const a = rand(0, 6.28); part({ x: m.x, y: m.y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, life: .4, max: .4, c: col(5), t: 'spark', drag: 2 }); }
        if (p.dashT <= 0) { const a = ang(m.x, m.y, p.x, p.y); p.kx = Math.cos(a) * m.force; p.ky = Math.sin(a) * m.force; }
        G.deathwall = { A: m.A, t: 2.4 }; break;
      case 'polarity': { const ok = polSide(m, p.x, p.y) === m.pc; flash(m.pc, .3, true); AU.play('resolve'); shake(.3, true); G.p.pol = null;
        if (!ok) mechFail(m, p.x, p.y); else { AU.play('soak'); burst(p.x, p.y, 20, m.pc, 120, .5); } break; }
      case 'slices': { const ok = sliceColor(m, p.x, p.y) === G.p.pol; flash(col(5), .7, true); chroma(1.2, true); shake(.6, true); AU.play('explode'); AU.play('slam');
        for (let k = 0; k < 4; k++) ringFx(m.x, m.y, 70 + k * 50, PCOLS()[k % 3], .5 + k * .1, 4);
        if (!ok) mechFail(m, p.x, p.y); else { AU.play('soak'); burst(p.x, p.y, 20, G.p.pol, 120, .5); } break; }
    }
    if (m.onResolve) m.onResolve(m);
    } finally { G.curShooter = previousShooter; }
  }
  if (G.deathwall) { G.deathwall.t -= dt; const A = G.deathwall.A, mg = 14;
    if (G.deathwall.t <= 0) G.deathwall = null; else if (p.alive && (p.x < A.x0 + mg || p.x > A.x1 - mg || p.y < A.y0 + mg || p.y > A.y1 - mg)) hurtPlayer(1, p.x, p.y, true); }
}
function resolveFx(m) {
  if (m.type === 'circle' || m.type === 'blot') { const c = m.tint || C.red; ringFx(m.x, m.y, m.r, col(5), .25, 3); burst(m.x, m.y, m.small ? 8 : 20, c, m.r * 5, .4); splat(m.x, m.y, col(0), m.small ? 8 : 20, m.r * .7); }
  else if (m.type === 'donut') { for (let k = 0; k < 24; k++) { const a = k / 24 * 6.28; burst(m.x + Math.cos(a) * (m.r0 + 30), m.y + Math.sin(a) * (m.r0 + 30), 1, C.red, 80, .4); } ringFx(m.x, m.y, m.r0 + 4, col(5), .3, 2); }
  else if (m.type === 'track') { ringFx(m.x, m.y, m.r, col(5), .25, 3); burst(m.x, m.y, 18, C.red, 140, .4); splat(m.x, m.y, col(0), 14, m.r * .6); }
  else if (m.type === 'cone') { for (let k = 0; k < 26; k++) { const a = m.a + rand(-m.h, m.h), r = rand(20, 220); part({ x: m.x + Math.cos(a) * r, y: m.y + Math.sin(a) * r, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, life: .3, max: .3, c: k % 2 ? C.red : col(5), t: 'spark' }); } }
  else if (m.type === 'plus') { const A = m.A; for (let k = 0; k < 14; k++) { burst(rand(A.x0, A.x1), m.y, 1, C.gold, 60, .3); burst(m.x, rand(A.y0, A.y1), 1, C.gold, 60, .3); } }
  else if (m.type === 'cells') { for (const [x, y, w, h] of m.cells) burst(x + w / 2, y + h / 2, 3, C.red, 60, .3); }
  else if (m.type === 'rect') { for (let k = 0; k < Math.min(30, (m.w * m.h) / 400); k++) burst(m.x + rand(-m.w / 2, m.w / 2), m.y + rand(-m.h / 2, m.h / 2), 1, C.red, 60, .3); }
  else if (m.type === 'seg') { for (let k = 0; k < 16; k++) { const q = k / 15; burst(lerp(m.x, m.x2, q), lerp(m.y, m.y2, q), 1, k % 2 ? C.red : col(5), 70, .3); } }
  else if (m.type === 'annulus') { for (let k = 0; k < 24; k++) { const a = k / 24 * 6.283, r = (m.r0 + m.r1) / 2; burst(m.x + Math.cos(a) * r, m.y + Math.sin(a) * r, 1, C.red, 70, .3); } }
  else if (m.type === 'holes') { flash(col(0), .3, true); }
  else if (m.type === 'half') { for (let k = 0; k < 30; k++) part({ x: m.x + Math.cos(m.a) * rand(10, 180) + rand(-100, 100) * Math.sin(m.a), y: m.y + Math.sin(m.a) * rand(10, 180) + rand(-100, 100) * Math.cos(m.a), vx: Math.cos(m.a) * 120, vy: Math.sin(m.a) * 120, life: .3, max: .3, c: k % 2 ? C.red : col(5), t: 'spark' }); }
}
// ===== telegraphs =====
// every danger area is painted into one mask first, so overlapping warnings merge into a single shape with one clean outline,
// a flat wash, a drifting hatch, and a second layer that fills up as the strike approaches
const TEL = {}, TEL_TYPES = new Set(['circle', 'track', 'blot', 'donut', 'half', 'cone', 'plus', 'lane', 'sector', 'cells', 'band', 'ring', 'rect', 'seg', 'annulus', 'holes']);
function telLayer(k) { if (!TEL[k]) { const c = document.createElement('canvas'); c.width = W; c.height = H; TEL[k] = { c, g: c.getContext('2d') }; } return TEL[k]; }
let telHatchC = null;
RELAYOUT.push(() => { for (const k in TEL) delete TEL[k]; });
function telHatch() { if (!telHatchC) { telHatchC = document.createElement('canvas'); telHatchC.width = telHatchC.height = 6; const x = telHatchC.getContext('2d'); x.fillStyle = C.red; for (let i = 0; i < 6; i++) x.fillRect(i, 5 - i, 1, 1); } return telHatchC; }
function blotR(m, a) { return m.r * (1 + .14 * Math.sin(m.seed + a * 5) + .07 * Math.sin(m.seed * 2 + a * 3)); }
function bandParts(m) { const [bx, by, bw, bh] = bandRect(m), [g0, g1] = bandGap(m); return m.vert ? [[bx, by, bw, g0 - by], [bx, g1, bw, by + bh - g1]] : [[bx, by, g0 - bx, bh], [g1, by, bx + bw - g1, bh]]; }
function telShape(m, g, cx, cy, prog) {
  const x = (m.x || 0) - cx, y = (m.y || 0) - cy, q = prog ? clamp(m.t / m.warn, 0, 1) : 1; g.beginPath();
  switch (m.type) {
    case 'circle': case 'track': g.arc(x, y, Math.max(.5, m.r * q), 0, 6.2832); g.fill(); break;
    case 'blot': for (let i = 0; i <= 28; i++) { const a = i / 28 * 6.2832, r = blotR(m, a) * q; if (i) g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill(); break;
    case 'donut': if (prog) break; g.rect(-W, -H, W * 3, H * 3); g.arc(x, y, m.r0, 0, 6.2832, true); g.fill('evenodd'); break;
    case 'half': g.save(); g.translate(x, y); g.rotate(m.a); g.fillRect(0, -700, 700 * q, 1400); g.restore(); break;
    case 'cone': g.moveTo(x, y); g.arc(x, y, m.len * q, m.a - m.h, m.a + m.h); g.closePath(); g.fill(); break;
    case 'plus': if (prog || m.t < m.lockAt) break; g.fillRect(m.A.x0 - cx, y - m.w / 2, m.A.x1 - m.A.x0, m.w); g.fillRect(x - m.w / 2, m.A.y0 - cy, m.w, m.A.y1 - m.A.y0); break;
    case 'lane': g.save(); g.translate(x, y); g.rotate(m.a); g.fillRect(0, -m.w / 2, m.len * q, m.w); g.restore(); break;
    case 'sector': { if (prog) break; const lo = Math.min(m.a0, m.a1), hi = Math.max(m.a0, m.a1); g.arc(x, y, 460, lo, hi); g.arc(x, y, m.r0, hi, lo, true); g.closePath(); g.fill(); break; }
    case 'cells': if (prog) break; for (const [x2, y2, w, h] of m.cells) g.rect(x2 - cx, y2 - cy, w, h); g.fill(); break;
    case 'band': if (prog) break; for (const r of bandParts(m)) g.rect(r[0] - cx, r[1] - cy, Math.max(0, r[2]), Math.max(0, r[3])); g.fill(); break;
    case 'ring': if (prog || m.t < m.warn) break; g.rect(-W, -H, W * 3, H * 3); g.arc(x, y, m.r, 0, 6.2832, true); g.fill('evenodd'); break;
    case 'rect': g.fillRect(x - m.w * q / 2, y - m.h * q / 2, m.w * q, m.h * q); break;
    case 'seg': { const a = Math.atan2(m.y2 - m.y, m.x2 - m.x), L4 = Math.hypot(m.x2 - m.x, m.y2 - m.y); g.save(); g.translate(x, y); g.rotate(a); g.fillRect(0, -m.w / 2, L4 * q, m.w); g.restore(); break; }
    case 'annulus': g.arc(x, y, Math.max(.5, m.r0 + (m.r1 - m.r0) * q), 0, 6.2832); if (m.r0 > 0) g.arc(x, y, m.r0, 0, 6.2832, true); g.fill('evenodd'); break;
    case 'holes': { if (prog) break; const A = m.A; g.fillRect(A.x0 - cx, A.y0 - cy, A.x1 - A.x0, A.y1 - A.y0); g.globalCompositeOperation = 'destination-out';
      for (const h of m.holes) { g.beginPath(); if (h.sector) { const a = h.mm ? h.mm.a : h.a; g.moveTo(h.x - cx, h.y - cy); g.arc(h.x - cx, h.y - cy, h.len, a - h.h, a + h.h); g.closePath(); g.fill(); }
        else if (h.x2 !== undefined) { const a = Math.atan2(h.y2 - h.y, h.x2 - h.x), L4 = Math.hypot(h.x2 - h.x, h.y2 - h.y); g.save(); g.translate(h.x - cx, h.y - cy); g.rotate(a); g.fillRect(0, -h.w / 2, L4, h.w); g.restore(); } else { g.arc(h.x - cx, h.y - cy, h.r, 0, 6.2832); g.fill(); } }
      g.globalCompositeOperation = 'source-over'; break; }
  }
}
// out = src minus src shrunk by one pixel (a one-pixel outline of the merged shape)
function telEdge(src, scratch, out) { const e = scratch.g, o = out.g;
  e.globalCompositeOperation = 'source-over'; e.clearRect(0, 0, W, H); e.drawImage(src.c, 0, 0); e.globalCompositeOperation = 'destination-in';
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) e.drawImage(src.c, dx, dy);
  e.globalCompositeOperation = 'source-over'; o.globalCompositeOperation = 'source-over'; o.clearRect(0, 0, W, H); o.drawImage(src.c, 0, 0);
  o.globalCompositeOperation = 'destination-out'; o.drawImage(scratch.c, 0, 0); o.globalCompositeOperation = 'source-over'; }
function drawTelegraphs(cx, cy) {
  const list = G.mechs.filter(m => TEL_TYPES.has(m.type) && !(m.showAt !== undefined && m.t < m.showAt) && !(m.hideAt !== undefined && m.t > m.hideAt && m.t < m.warn)); if (!list.length) return;
  const A = telLayer('a'), B = telLayer('b'), Hh = telLayer('h'), E = telLayer('e'), O = telLayer('o'); let hot = false;
  for (const L3 of [A, B, Hh]) { L3.g.clearRect(0, 0, W, H); L3.g.fillStyle = C.red; }
  for (const m of list) { const ar = m.owner && m.owner.room ? arenaOf(m.owner) : null, pre = m.t < m.warn, k = m.t / m.warn, layers = [[A, false]];
    if (pre) layers.push([B, true]); if (pre && k > .78) { layers.push([Hh, false]); hot = true; }
    for (const [L3, prog] of layers) { const g = L3.g; g.save(); if (ar) { g.beginPath(); g.rect(ar.x0 - cx, ar.y0 - cy, ar.x1 - ar.x0, ar.y1 - ar.y0); g.clip(); } telShape(m, g, cx, cy, prog); g.restore(); } }
  ctx.globalAlpha = .1; ctx.drawImage(A.c, 0, 0); ctx.globalAlpha = .13; ctx.drawImage(B.c, 0, 0);
  const e = E.g, o = (G.time * 10) % 6; e.globalCompositeOperation = 'source-over'; e.clearRect(0, 0, W, H); e.drawImage(A.c, 0, 0); e.globalCompositeOperation = 'source-in';
  e.save(); e.translate(-((((cx + o) % 6) + 6) % 6), -(((cy % 6) + 6) % 6)); e.fillStyle = e.createPattern(telHatch(), 'repeat'); e.fillRect(0, 0, W + 12, H + 12); e.restore(); e.globalCompositeOperation = 'source-over';
  if (QS.fx) { ctx.globalAlpha = .32; ctx.drawImage(E.c, 0, 0); }
  telEdge(A, E, O); ctx.globalAlpha = 1; ctx.drawImage(O.c, 0, 0);
  if (hot && ((G.time * 14) | 0) % 2) { ctx.globalAlpha = .08; ctx.drawImage(Hh.c, 0, 0); telEdge(Hh, E, O); const og = O.g; og.globalCompositeOperation = 'source-in'; og.fillStyle = col(5); og.fillRect(0, 0, W, H); og.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.drawImage(O.c, 0, 0); }
  ctx.globalAlpha = 1;
}
function drawMechs(cx, cy) {
  const p = G.p; drawTelegraphs(cx, cy);
  for (const m of G.mechs) { const k = Math.min(1, m.t / m.warn), x = (m.x || 0) - cx, y = (m.y || 0) - cy, blink = k > .78 && ((G.time * 14) | 0) % 2;
    if (m.showAt !== undefined && m.t < m.showAt) { if (m.ghost) m.ghost(m, x, y, cx, cy); continue; }
    if (m.hideAt !== undefined && m.t > m.hideAt && m.t < m.warn) continue;
    if (m.draw) { m.draw(m, x, y, k, blink, cx, cy); continue; }
    if (m.arrow !== undefined) { for (let i = 1; i <= 3; i++) { const ax = x + Math.cos(m.arrow) * (m.r + i * 6), ay = y + Math.sin(m.arrow) * (m.r + i * 6); pxLine(ax - Math.cos(m.arrow + .6) * 4, ay - Math.sin(m.arrow + .6) * 4, ax, ay, C.gold); pxLine(ax - Math.cos(m.arrow - .6) * 4, ay - Math.sin(m.arrow - .6) * 4, ax, ay, C.gold); } }
    if (m.tint && m.type === 'circle') ringC(x, y, m.r + 2, m.tint, 1);
    switch (m.type) {
      case 'path': { const ex = m.x2 - cx, ey = m.y2 - cy; for (let i = 0; i <= 24; i++) { const q = i / 24; if (i % 2) rect(lerp(x, ex, q) - .5, lerp(y, ey, q) - .5, 2, 2, C.red); } disc(ex, ey, 6, col(0)); ringC(ex, ey, 6, C.gold, 1); text(String(m.num), ex - 1, ey - 2, C.gold); break; }
      case 'mark': for (let i = 0; i < 3; i++) { const o = ((G.time * 30) % 6) + i * 6; rect(x - 2, y - m.w / 2 - o, 4, 2, C.gold); rect(x - 2, y + m.w / 2 + o, 4, 2, C.gold); } ctx.globalAlpha = .2; rect(x - 3, y - m.w / 2, 6, m.w, C.gold); ctx.globalAlpha = 1; break;
      case 'pans': { const A = m.A, tilt = m.heavy * Math.min(1, k * 1.5) * 10, bx = m.x - cx, by = A.y0 - cy + 22;
        pxLine(bx - 90, by - tilt, bx + 90, by + tilt, col(5)); pxLine(bx, by, bx, by - 14, col(5));
        for (const sd of [-1, 1]) { const px2 = bx + sd * 90, py2 = by + sd * tilt; pxLine(px2, py2, px2 - 10, py2 + 14, col(4)); pxLine(px2, py2, px2 + 10, py2 + 14, col(4)); rect(px2 - 12, py2 + 14, 24, 2, sd === m.heavy ? C.red : col(4)); } break; }
      case 'band': { const [bx, by, bw, bh] = bandRect(m), [g0, g1] = bandGap(m);
        for (const e of [g0, g1]) for (let i = 0; i < 3; i++) { const o = i * 4 + ((G.time * 12) | 0) % 4; if (m.vert) rect(bx - cx - 4 + o * (bw + 8) / 12, e - cy, 2, 1, col(5)); else rect(e - cx, by - cy - 4 + o * (bh + 8) / 12, 1, 2, col(5)); }
        if (m.t < m.warn) { const ar = m.vert ? (m.fwd ? 0 : Math.PI) : (m.fwd ? Math.PI / 2 : -Math.PI / 2), part0 = bandParts(m)[0], mx = part0[0] - cx + part0[2] / 2, my = part0[1] - cy + part0[3] / 2;
          for (let i = 0; i < 3; i++) { const ox = mx + Math.cos(ar) * (i * 8 - 8), oy = my + Math.sin(ar) * (i * 8 - 8); pxLine(ox - Math.cos(ar + .6) * 5, oy - Math.sin(ar + .6) * 5, ox, oy, col(5)); pxLine(ox - Math.cos(ar - .6) * 5, oy - Math.sin(ar - .6) * 5, ox, oy, col(5)); } }
        else for (const q of bandParts(m)) { rect(q[0] - cx, q[1] - cy, q[2], q[3], C.red); rect(q[0] - cx + (m.vert ? q[2] * .3 : 0), q[1] - cy + (m.vert ? 0 : q[3] * .3), m.vert ? q[2] * .4 : q[2], m.vert ? q[3] : q[3] * .4, col(5)); }
        break; }
      case 'ring': if (m.t < m.warn) { ringC(x, y, m.r0, blink ? col(5) : C.red, 1); ringC(m.tx - cx, m.ty - cy, 6, C.red, 1); } else { ringC(x, y, m.r + 2, col(5), 1); } break;
      case 'slices': { const A = m.A, a0 = m.a0 + m.va * m.t; ctx.save(); ctx.beginPath(); ctx.rect(A.x0 - cx, A.y0 - cy, A.x1 - A.x0, A.y1 - A.y0); ctx.clip();
        for (let i = 0; i < 6; i++) { ctx.globalAlpha = .13 + .1 * k; ctx.fillStyle = PCOLS()[i % 3]; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 600, a0 + i * 1.0472, a0 + (i + 1) * 1.0472); ctx.fill(); }
        ctx.restore(); ctx.globalAlpha = 1; for (let i = 0; i < 6; i++) { const a = a0 + i * 1.0472; pxLine(x, y, x + Math.cos(a) * 260, y + Math.sin(a) * 260, blink ? col(5) : col(3)); } disc(x, y, 6 + k * 10, col(5)); break; }
      case 'track': { const lk = m.t >= m.lockAt; for (let i = 0; i < 4; i++) { const aa = G.time * 3 + i * 1.57; rect(x + Math.cos(aa) * (m.r + 3) - 1, y + Math.sin(aa) * (m.r + 3) - 1, 2, 2, lk ? col(5) : C.red); } if (lk) { rect(x - 3, y, 7, 1, col(5)); rect(x, y - 3, 1, 7, col(5)); } break; }
      case 'donut': for (let i = 0; i < 8; i++) { const a = i * .785 + G.time * .6, r0 = m.r0 + 6 + (1 - k) * 14; pxLine(x + Math.cos(a) * (r0 + 6), y + Math.sin(a) * (r0 + 6), x + Math.cos(a) * r0, y + Math.sin(a) * r0, col(5)); } break;
      case 'fold': { const A = m.A; for (let i = 0; i < 60; i++) { const q = i / 60; if (((i + ((G.time * 8) | 0)) % 3) === 0) { if (m.horiz) rect(lerp(A.x0, A.x1, q) - cx, A.cy - cy, 2, 1, col(4)); else rect(A.cx - cx, lerp(A.y0, A.y1, q) - cy, 1, 2, col(4)); } } break; }
      case 'tether': { const b = m.owner, d = dist(b.x, b.y, p.x, p.y), ok = d >= m.minD, c2 = ok ? C.cyan : C.red; for (let i = 0; i <= 20; i++) { const q = i / 20, wob = Math.sin(G.time * 12 + i) * (ok ? 1 : 3); rect(lerp(b.x, p.x, q) - cx + wob, lerp(b.y, p.y, q) - cy - wob, 2, 2, i % 2 ? c2 : col(5)); }
        ctx.globalAlpha = .35; ringC(b.x - cx, b.y - cy, m.minD, ok ? C.cyan : C.red, 1); ctx.globalAlpha = 1; break; }
      case 'doom': { const left = Math.max(0, m.warn - m.t) / m.warn; ringC(p.x - cx, p.y - cy - 4, 10 + (blink ? 1 : 0), C.violet, 1); for (let i = 0; i < 12; i++) { const a = -Math.PI / 2 + i / 12 * 6.283; rect(p.x - cx + Math.cos(a) * 14 - .5, p.y - cy - 4 + Math.sin(a) * 14 - .5, 1, 1, i < Math.ceil(12 * left) ? C.violet : col(2)); }
        if (m.t > m.cAt && m.t < m.cEnd) { const cx2 = m.cx - cx, cy2 = m.cy - cy; ctx.globalAlpha = .3; rect(cx2 - 8, cy2 - 90, 16, 90, col(5)); ctx.globalAlpha = 1; disc(cx2, cy2, m.r * .6, col(5)); ringC(cx2, cy2, m.r + Math.sin(G.time * 8) * 2, col(5), 2); } break; }
      case 'tower': { const inside = dist(p.x, p.y, m.x, m.y) < m.r; ctx.globalAlpha = .16; disc(x, y, m.r, C.gold); ctx.globalAlpha = 1; ringC(x, y, m.r, inside ? col(5) : C.gold, 2); ringC(x, y, Math.max(1, m.r * (1 - k)), C.gold, 1);
        for (let i = 0; i < 3; i++) rect(x - 1, y - m.r - 10 + i * 3 + ((G.time * 8) | 0) % 3, 3, 1, C.gold); break; }
      case 'spread': { const r = m.r; ringC(x, y, r, blink ? col(5) : C.violet, 1); for (let i = 0; i < 4; i++) { const a = G.time * 4 + i * 1.57; rect(x + Math.cos(a) * (r + 3), y + Math.sin(a) * (r + 3), 2, 2, C.violet); } break; }
      case 'gaze': { const b = m.owner, bx = b.x - cx, by = b.y - cy - 30; ringC(bx, by, 6 + (blink ? 1 : 0), C.violet, 1); disc(bx, by, 2 + k * 2, C.violet); break; }
      case 'knock': for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28 + (m.wind ? 0 : G.time * .5), r0 = 14 + ((G.time * 60) % 30); pxLine(x + Math.cos(a) * r0, y + Math.sin(a) * r0, x + Math.cos(a) * (r0 + 8), y + Math.sin(a) * (r0 + 8), col(5)); } ringC(x, y, 10, blink ? C.red : col(5), 2); break;
      case 'polarity': { const A = m.A; ctx.save(); ctx.beginPath(); ctx.rect(A.x0 - cx, A.y0 - cy, A.x1 - A.x0, A.y1 - A.y0); ctx.clip(); ctx.translate(x, y); ctx.rotate(m.a);
        ctx.globalAlpha = .14 + .08 * k; ctx.fillStyle = m.c1; ctx.fillRect(0, -600, 600, 1200); ctx.fillStyle = m.c2; ctx.fillRect(-600, -600, 600, 1200); ctx.globalAlpha = 1; ctx.restore(); break; }
    }
  }
  if (G.deathwall) { const A = G.deathwall.A, mg = 14, c = ((G.time * 10) | 0) % 2 ? C.red : '#a01830';
    ctx.globalAlpha = .45; rect(A.x0 - cx, A.y0 - cy, A.x1 - A.x0, mg, c); rect(A.x0 - cx, A.y1 - cy - mg, A.x1 - A.x0, mg, c); rect(A.x0 - cx, A.y0 - cy, mg, A.y1 - A.y0, c); rect(A.x1 - cx - mg, A.y0 - cy, mg, A.y1 - A.y0, c); ctx.globalAlpha = 1; }
}
// ===== mechanic prompts =====
// a fixed panel under the top edge (never over the hero): one formally worded line per active boss mechanic
const MECH_TIP = { gaze: 'mt_gaze', tether: 'mt_tether', doom: 'mt_doom', polarity: 'mt_pol', slices: 'mt_slices', ring: 'mt_ring', knock: 'mt_knock', still: 'mt_still', orbs: 'mt_orbs',
  reverse: 'mt_reverse', star: 'mt_star', well: 'mt_well', cage: 'mt_cage', nova: 'mt_nova', sector: 'mt_sector', tower: 'mt_tower', cone: 'mt_cone', plus: 'mt_plus', blot: 'mt_blot', band: 'mt_band',
  donut: 'mt_donut', cells: 'mt_cells', half: 'mt_half', track: 'mt_track', lane: 'mt_lane', blade: 'mt_lane', spread: 'mt_spread', path: 'mt_path', mark: 'mt_mark' };
const TIP_C = { mt_gaze: 'violet', mt_doom: 'violet', mt_still: 'violet', mt_reverse: 'violet', mt_star: 'violet', mt_well: 'violet', mt_spread: 'violet', mt_blot: 'violet',
  mt_tower: 'gold', mt_cage: 'gold', mt_plus: 'gold', mt_lane: 'gold', mt_mark: 'gold', mt_exa: 'gold', mt_tether: 'cyan', mt_donut: 'cyan' };
function mechTipKey(m) { return m.tip || (m.arrow !== undefined ? 'mt_exa' : MECH_TIP[m.type]); }
function drawMechLabels() {
  if (!SET.hints || !G.p || !G.mechs || !(G.state === 'play' || G.state === 'build')) return;
  const keys = []; for (const m of G.mechs) { if (m.showAt !== undefined && m.t < m.showAt) continue; if (!m.owner || !m.owner.boss) continue; if (m.hideAt !== undefined && m.t > m.hideAt && m.t < m.warn && m.tip !== 'mt_c_mem') continue; const k = mechTipKey(m); if (k && !keys.includes(k)) keys.push(k); }
  if (G.p.pol && !keys.some(k => k === 'mt_pol' || k === 'mt_slices' || k === 'mt_orbs')) keys.push('mt_color');
  G.mtips = G.mtips || {}; for (const k of keys) if (!G.mtips[k]) G.mtips[k] = G.time; for (const k in G.mtips) if (!keys.includes(k)) delete G.mtips[k];
  let y = 17;
  for (const k of keys.slice(0, 3)) { const s = L(k), w = textW(s) + 28, x = Math.round(W / 2 - w / 2), age = G.time - G.mtips[k], a = Math.min(1, age / .15), yy = y - Math.round((1 - a) * 5);
    const c = (k === 'mt_color' || k === 'mt_pol' || k === 'mt_orbs' || k === 'mt_slices') && G.p.pol ? G.p.pol : C[TIP_C[k] || 'red'];
    ctx.globalAlpha = .88 * a; rect(x, yy, w, 12, '#0b0a09'); ctx.globalAlpha = a; box(x, yy, w, 12, null, '#2d2925');
    pxLine(x + 5, yy, x + w, yy, c); pxLine(x, yy + 12, x + w - 5, yy + 12, '#2d2925');
    ctx.save(); ctx.translate(x + 12, yy + 6); ctx.rotate(Math.PI / 4 + (age < .6 ? age * 8 : 0)); ctx.fillStyle = c; ctx.fillRect(-2, -2, 4, 4); ctx.restore();
    if (age < .5 && ((age * 12) | 0) % 2) rect(x + 5, yy + 1, w - 6, 11, c);
    text(s, x + 19, yy + 3, '#e8e1d3'); y += 15; }
  ctx.globalAlpha = 1;
}
function updateHazards(dt) {
  updateMechs(dt);
  const p = G.p;
  for (let i = G.emitters.length - 1; i >= 0; i--) { const e = G.emitters[i]; e.t += dt; e.ft = (e.ft || 0) - dt; if (e.move) e.move(e, dt);
    if (e.ft <= 0) { e.ft = e.per || .3; const previousShooter = G.curShooter; G.curShooter = e.owner || null; try { e.fire && e.fire(e); } finally { G.curShooter = previousShooter; } } if (e.t > e.life || (e.owner && e.owner.dead)) { G.emitters.splice(i, 1); burst(e.x, e.y, 8, e.c, 80, .3); } }
  for (let i = G.lasers.length - 1; i >= 0; i--) { const L2 = G.lasers[i]; if (!L2) continue;
    if (L2.owner.dead) { G.lasers.splice(i, 1); continue; }
    if (L2.warn > 0) { L2.warn -= dt; L2.a += L2.va * dt * .15; continue; }
    L2.life -= dt; L2.a += L2.va * dt; if (L2.life <= 0) { G.lasers.splice(i, 1); continue; }
    const pts = rayPath(L2.owner.x, L2.owner.y, L2.a, L2.len, 0); L2.pts = pts; const [ex, ey] = pts[pts.length - 1];
    if (Math.random() < .5) burst(ex, ey, 2, L2.c || C.red, 80, .2);
    const r0 = L2.r0 || 0; if (p.alive && !(L2.pol && L2.pol === p.pol) && segDist(p.x, p.y, L2.owner.x + Math.cos(L2.a) * r0, L2.owner.y + Math.sin(L2.a) * r0, ex, ey) < L2.w / 2 + p.r - 2) hurtPlayer(1, ex, ey);
  }
  for (let i = G.zones.length - 1; i >= 0; i--) { const z = G.zones[i]; if (!z) continue;
    if (z.warn > 0) { z.warn -= dt; if (z.warn <= 0) { if (z.kind === 'meteor') { AU.play('explode', 1, .35); shake(.1); burst(z.x, z.y, 12, C.red, 120, .35); splat(z.x, z.y, col(0), 10, 10); for (let k = 0; k < 6; k++) eshot(z.x, z.y, k / 6 * 6.28 + rand(0, 1), 75); }
        else { AU.play('slam', 1, .4); shake(.15); } } continue; }
    z.life -= dt; if (z.life <= 0) { G.zones.splice(i, 1); continue; }
    if (p.alive && dist(p.x, p.y, z.x, z.y) < z.r + p.r - 2 && (z.kind === 'void' || z.life > .15)) hurtPlayer(1, z.x, z.y);
  }
  for (const eb of G.ebullets) if (eb.homing && eb.homeT > 0) { eb.homeT -= dt; const a = Math.atan2(eb.vy, eb.vx), s = Math.hypot(eb.vx, eb.vy); const na = a + clamp(angDiff(a, ang(eb.x, eb.y, p.x, p.y)), -eb.homing * dt, eb.homing * dt); eb.vx = Math.cos(na) * s; eb.vy = Math.sin(na) * s; }
  if (G.wreck) updateWreck(dt);
}
function drawHazards(cx, cy) {
  for (const z of G.zones) { const x = z.x - cx, y = z.y - cy;
    if (z.warn > 0) { const k = z.warn; ringC(x, y, z.r, C.red, 1); ringC(x, y, z.r * (1 - (k % .3) / .3), C.red, 1); if (((k * 12) | 0) % 2) rect(x - 1, y - 1, 2, 2, C.red); }
    else if (z.kind === 'void') { disc(x, y, z.r, col(0)); ringC(x, y, z.r, C.red, 1); for (let i = 0; i < 3; i++) { const a = G.time * 3 + i * 2; rect(x + Math.cos(a) * z.r * .6, y + Math.sin(a) * z.r * .6, 2, 2, col(3)); } }
    else { disc(x, y, z.r * (z.life / .25), C.red); disc(x, y, z.r * .6 * (z.life / .25), col(5)); } }
  for (const e of G.emitters) { const x = e.x - cx, y = e.y - cy; ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(G.time * 3); ctx.fillStyle = col(0); ctx.fillRect(-4, -4, 8, 8); ctx.fillStyle = e.c; ctx.fillRect(-3, -3, 6, 6); ctx.fillStyle = col(5); ctx.fillRect(-1, -1, 2, 2); ctx.restore(); }
  for (const L2 of G.lasers) { const o = L2.owner, x = o.x - cx, y = o.y - cy, lc = L2.c || C.red, safe = L2.pol && L2.pol === G.p.pol;
    if (L2.warn > 0) { ctx.globalAlpha = ((L2.warn * 14) | 0) % 2 ? .8 : .35; line(x, y, x + Math.cos(L2.a) * L2.len, y + Math.sin(L2.a) * L2.len, lc, 1); ctx.globalAlpha = 1; continue; }
    const pts = L2.pts || [[o.x, o.y], [o.x + Math.cos(L2.a) * L2.len, o.y + Math.sin(L2.a) * L2.len]], [ex, ey] = pts[pts.length - 1];
    const wob = Math.sin(G.time * 50) * 1.5; if (safe) ctx.globalAlpha = .35;
    const r0 = L2.r0 || 0, sx = x + Math.cos(L2.a) * r0, sy = y + Math.sin(L2.a) * r0; line(sx, sy, ex - cx, ey - cy, lc, L2.w + wob + 2); line(sx, sy, ex - cx, ey - cy, col(5), L2.w * .45);
    if (r0) ringC(x, y, r0, ((G.time * 10) | 0) % 2 ? col(5) : col(3), 1); ctx.globalAlpha = 1; }
  if (G.wreck) drawWreck(cx, cy);
}
function drawBoss(b, x, y) {
  if (b.fadeT > 0) { b.fadeT -= FRAME_DT; for (let i = 0; i < 2; i++) { const q = (G.time * .8 + i * .5) % 1; ctx.globalAlpha = (1 - q) * .3; ringC(x, y, 6 + q * 22, col(4), 1); } ctx.globalAlpha = 1; return; }
  const fl = b.flash > 0, f = b.def.look !== undefined ? b.def.look : G.floor, hv = b.hover || 0, t = G.time;
  if (f >= 5) { drawBoss2(b, x, y, f); if (b.def.v) drawVariantMark(b, x, y - hv); return; }
  drawBossBase(b, x, y, f, fl, hv, t); if (b.def.v) drawVariantMark(b, x, y - hv);
}
function drawBossBase(b, x, y, f, fl, hv, t) {
  ctx.globalAlpha = .6; disc(x, y + b.r, b.r * (1 - hv / 80), col(0)); ctx.globalAlpha = 1;
  y -= hv;
  const c3 = fl ? col(5) : col(3), c4 = fl ? col(5) : col(4), c5 = col(5), c2 = fl ? col(5) : col(2);
  const ex = Math.cos(b.eye) * 3, ey = Math.sin(b.eye) * 2, lean = clamp((b.bvx || 0) / 400, -.25, .25);
  if (lean && f !== 0) { ctx.save(); ctx.translate(Math.round(x), Math.round(y + b.r)); ctx.rotate(lean); ctx.translate(-Math.round(x), -Math.round(y + b.r)); }
  if (f === 0) {
    rect(x - 14, y - 22, 28, 38, col(0)); rect(x - 13, y - 21, 26, 36, c3); rect(x - 13, y - 21, 26, 2, c4); rect(x - 13, y + 11, 26, 4, c2);
    for (let i = 0; i < 4; i++) rect(x - 10 + i * 6, y - 15 + ((i * 7) % 5), 1, 18, c2);
    rect(x - 9, y - 9, 18, 6, col(0)); rect(x - 6 + ex, y - 8, 7, 4, b.armorT > 0 ? c5 : C.red); rect(x - 4 + ex, y - 7, 2, 2, c5);
    if (b.phase >= 1) for (let i = 0; i < 3; i++) rect(x - 12 + i * 11, y + 2 + (i % 2) * 4, 3, 1, C.red);
  } else if (f === 1) {
    const bob = Math.sin(t * 3) * 2; y += bob;
    for (let i = 0; i < 5; i++) { const px = x - 12 + i * 6, h = i % 2 ? 6 : 11; rect(px, y - 8 - h, 4, h, c4); rect(px + 1, y - 9 - h, 2, 1, c5); }
    rect(x - 13, y - 9, 27, 7, c4); rect(x - 13, y - 9, 27, 1, c5); rect(x - 13, y - 3, 27, 1, c2);
    rect(x - 9, y - 1, 18, 12, col(0)); disc(x + ex, y + 4 + ey, 3, b.armorT > 0 ? c5 : C.red); rect(x + ex - 1, y + 3 + ey, 1, 1, c5);
    for (let i = 0; i < 3; i++) rect(x - 7 + i * 6, y - 6, 2, 2, b.phase > i ? C.violet : c2);
    for (let i = 0; i < 6; i++) { const a = t * 1.5 + i * 1.05; rect(x + Math.cos(a) * 18, y + Math.sin(a) * 9 + 2, 1, 1, c4); }
  } else if (f === 3) {
    const bob = Math.sin(t * 2) * 2; y += bob;
    rect(x - 9, y - 4, 18, 18, col(0)); rect(x - 8, y - 3, 16, 16, c3); rect(x - 6, y + 9, 12, 4, c2); rect(x - 8, y - 3, 16, 1, c4);
    for (let i = 0; i < 3; i++) rect(x - 5 + i * 4, y + 1, 1, 10, c2);
    ctx.save(); ctx.translate(Math.round(x), Math.round(y - 12)); ctx.rotate(Math.PI / 4); ctx.fillStyle = col(0); ctx.fillRect(-6, -6, 12, 12); ctx.fillStyle = c4; ctx.fillRect(-5, -5, 10, 10); ctx.restore();
    rect(x - 4 + ex * .5, y - 13, 8, 2, b.atk === 'gaze' ? C.violet : b.armorT > 0 ? c5 : C.red);
    for (const sd of [-1, 1]) { const raised = b.hand === sd, hx = x + sd * 22, hy = y - 2 + Math.sin(t * 3 + sd) * 2 - (raised ? 10 : 0);
      rect(hx - 4, hy - 4, 8, 8, col(0)); rect(hx - 3, hy - 3, 6, 6, raised ? C.red : c4); if (raised && ((t * 12) | 0) % 2) rect(hx - 1, hy - 1, 2, 2, c5); }
    for (let i = 0; i < 3; i++) rect(x - 7 + i * 6, y - 22 - (i === 1 ? 3 : 0), 2, 4, c4);
  } else if (f === 4 && b.def.form === 2) { // recomposed: a burning prismatic hexagon
    const R = 19 + Math.sin(t * 3) * 1.5, rot = t * .8, gl = b.hurtT > 0 ? rand(-1, 1) : 0;
    disc(x + gl, y, R + 4, col(0));
    for (let i = 0; i < 6; i++) { const a1 = rot + i * 1.0472, a2 = rot + (i + 1) * 1.0472; pxLine(x + Math.cos(a1) * R, y + Math.sin(a1) * R, x + Math.cos(a2) * R, y + Math.sin(a2) * R, PCOLS()[i % 3], 2); }
    for (let i = 0; i < 3; i++) { const a1 = -rot * 1.5 + i * 2.094, a2 = -rot * 1.5 + (i + 1) * 2.094; pxLine(x + Math.cos(a1) * R * .55, y + Math.sin(a1) * R * .55, x + Math.cos(a2) * R * .55, y + Math.sin(a2) * R * .55, c5); }
    disc(x + ex, y + ey, 3 + Math.sin(t * 8), b.armorT > 0 ? c4 : c5);
    for (let i = 0; i < 9; i++) { const a = t * (i % 2 ? -1 : 1) * 1.1 + i * .698, rr = R + 9 + Math.sin(t * 2 + i) * 3; rect(x + Math.cos(a) * rr - 1, y + Math.sin(a) * rr * .85 - 1, 3, 3, PCOLS()[i % 3]); }
    if (b.enrageT !== undefined) { const e2 = Math.max(0, b.enrageT); ringC(x, y, R + 16 + (e2 < 10 ? Math.sin(t * 20) * 2 : 0), e2 < 10 ? C.red : col(3), 1); }
  } else if (f === 4) {
    const R = 15 + Math.sin(t * 1.5), gl = b.hurtT > 0 ? rand(-1, 1) : 0;
    disc(x + gl, y, R + 3, col(0)); ringC(x + gl, y, R, c5, 2); disc(x, y, R - 5, col(0));
    for (let i = 0; i < 6; i++) { const a = t * (i % 2 ? -1.2 : .9) + i * 1.047, rr = R + 8 + Math.sin(t * 2 + i) * 2; const sx = x + Math.cos(a) * rr, sy = y + Math.sin(a) * rr * .8;
      ctx.save(); ctx.translate(Math.round(sx), Math.round(sy)); ctx.rotate(a); ctx.fillStyle = G.p.pol ? (i % 2 ? C.red : C.cyan) : c4; ctx.fillRect(-2, -2, 4, 4); ctx.restore(); }
    disc(x + ex, y + ey, 2 + Math.sin(t * 6), b.armorT > 0 ? c4 : c5);
  } else if (f === 2) {
    const R = 15 + Math.sin(t * 2) * 1;
    disc(x, y, R + 2, col(0)); disc(x, y, R, c4); disc(x, y, R - 2, col(5));
    disc(x + ex * 2, y + ey * 2, 8, col(0)); disc(x + ex * 2, y + ey * 2, 5, b.armorT > 0 ? col(3) : C.red); rect(x + ex * 2 - 2, y + ey * 2 - 2, 2, 2, col(5));
    if ((t % 4) < .12) rect(x - R, y - 2, R * 2, 4, col(0));
    for (let i = 0; i < 8; i++) { const a = t * .6 + i * .785, r1 = R + 4, r2 = R + 8 + Math.sin(t * 4 + i) * 2; line(x + Math.cos(a) * r1, y + Math.sin(a) * r1, x + Math.cos(a) * r2, y + Math.sin(a) * r2, i % 2 ? col(4) : C.red, 1); }
  }
  if (lean && f !== 0) ctx.restore();
  if (b.burn > 0) for (let i = 0; i < 2; i++) rect(x + rand(-12, 12), y - rand(0, 20), 1, 2, C.red);
  if (b.frozen > 0 || b.slowT > 0) ringC(x, y, b.r + 4, C.frost, 1);
  if (b.armorT > 0) ringC(x, y, b.r + 6 + Math.sin(t * 20) * 2, col(5), 1);
  if (b.atk === 'dashes' && b.mem.s === 'aim') { ctx.globalAlpha = .7; line(x, y, x + Math.cos(b.mem.a) * 300, y + Math.sin(b.mem.a) * 300, C.red, 1); ctx.globalAlpha = 1; }
}

// ===== THE ABSENCE: collapse into wreckage, then reassemble =====
function bossDeath(b) {
  if (b.def.form === 1) { absenceFall(b); return; }
  G.boss = null; G.lasers.length = 0; G.zones.length = 0; G.ebullets.length = 0; G.emitters.length = 0; G.p.pol = null;
  for (const e of G.enemies) if (!e.dead && e !== b) killEnemy(e, {});
  slowmo(.15, 1.6); flash(col(5), .8, true); chroma(1.5, true); shake(.8, true); AU.play('explode'); G.later.push({ t: .35, f: () => AU.play('floorClear') }); G.mechs.length = 0; G.deathwall = null;
  for (let i = 0; i < 6; i++) G.later.push({ t: .1 + i * .12, f: () => explode(b.x + rand(-30, 30), b.y + rand(-30, 30), 30, 0, { color: choice([C.red, C.gold, C.cyan, C.violet]), small: i % 2 === 1 }) });
  for (let i = 0; i < 40; i++) splat(b.x + rand(-60, 60), b.y + rand(-60, 60), choice([C.red, C.gold, C.cyan, C.violet, C.pink]), 8, 8);
  G.banner = { t: 3, big: G.floor === FLOORS.length - 1 && !G.endless ? L('restored') : L('defeated'), small: tr(b.def.name), c: C.gold };
  G.bossDead = true;
}
function absenceFall(b) {
  G.boss = null; G.lasers.length = 0; G.ebullets.length = 0; G.emitters.length = 0; G.mechs.length = 0; G.zones.length = 0; G.deathwall = null; G.p.pol = null;
  G.absenceHp = b.maxHp * 1.65;
  slowmo(.25, 1.2); flash(col(5), .6, true); shake(.6, true); AU.play('phase'); G.later.push({ t: .5, f: () => AU.play('slam', .7) });
  const pieces = [];
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; pieces.push({ x: b.x + Math.cos(a) * 15, y: b.y + Math.sin(a) * 12, vx: Math.cos(a) * rand(30, 80), vy: Math.sin(a) * rand(20, 50), z: 14, vz: rand(40, 110), rot: rand(0, 6), vr: rand(-8, 8), s: i % 3 ? 3 : 4, c: i % 4 === 0 ? col(5) : col(4) }); }
  G.wreck = { x: b.x, y: b.y, t: 0, pieces, state: 'fall', room: b.room };
  G.inter.push({ kind: 'wreck', x: b.x, y: b.y + 4, born: G.time + 1.6 });
}
function updateWreck(dt) {
  const w = G.wreck; w.t += dt;
  for (const pc of w.pieces) {
    if (w.state === 'fall') { pc.vz -= 300 * dt; pc.z += pc.vz * dt; pc.x += pc.vx * dt; pc.y += pc.vy * dt; pc.rot += pc.vr * dt;
      if (pc.z <= 0) { pc.z = 0; if (Math.abs(pc.vz) > 40) { pc.vz *= -.35; burst(pc.x, pc.y, 2, col(3), 40, .3); } else pc.vz = 0; pc.vx *= .6; pc.vy *= .6; pc.vr *= .5; } }
    else if (w.state === 'reform') { const k = clamp((w.t - .6) / 1.6, 0, 1), e = k * k, a = Math.atan2(pc.y - w.y, pc.x - w.x) + dt * (2 + k * 10);
      const r = dist(pc.x, pc.y, w.x, w.y) * (1 - e * .08); pc.x = w.x + Math.cos(a) * r; pc.y = w.y + Math.sin(a) * r; pc.z = lerp(pc.z, 22 + Math.sin(w.t * 6 + pc.rot) * 4, dt * 3); pc.rot += dt * 10;
      if (Math.random() < .3) part({ x: pc.x, y: pc.y - pc.z, vx: 0, vy: -20, life: .4, max: .4, c: choice(PCOLS()) }); }
  }
  // once settled, motes of light rise from the wreckage to draw the eye
  if (w.state === 'fall' && w.t > 1.6 && Math.random() < dt * 16) part({ x: w.x + rand(-16, 16), y: w.y + rand(-4, 8), vx: rand(-4, 4), vy: rand(-34, -16), life: rand(.6, 1.1), max: 1.1, c: Math.random() < .35 ? choice(PCOLS()) : col(5), s: Math.random() < .3 ? 2 : 1 });
}
function drawWreck(cx, cy) {
  const w = G.wreck, lit = w.state === 'reform';
  for (const pc of w.pieces) { const x = pc.x - cx, y = pc.y - cy; ctx.globalAlpha = .4; rect(x - pc.s / 2, y + 1, pc.s, 1, col(0)); ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(Math.round(x), Math.round(y - pc.z)); ctx.rotate(pc.rot); ctx.fillStyle = col(0); ctx.fillRect(-pc.s / 2 - 1, -pc.s / 2 - 1, pc.s + 2, pc.s + 2);
    ctx.fillStyle = lit ? PCOLS()[((G.time * 8 + pc.rot) | 0) % 3] : (w.t > 1.6 && ((G.time * 3 + pc.rot * 2) | 0) % 5 === 0 ? col(5) : pc.c); ctx.fillRect(-pc.s / 2, -pc.s / 2, pc.s, pc.s); ctx.restore(); }
  if (w.state === 'fall' && w.t > 1.6) { const x = w.x - cx, y = w.y - cy, g = clamp((w.t - 1.6) / 1.2, 0, 1), pu = .5 + Math.sin(G.time * 3) * .5;
    ctx.globalAlpha = (.07 + pu * .07) * g; rect(x - 7, y - 80, 14, 82, col(5)); rect(x - 2, y - 110, 4, 112, col(5)); ctx.globalAlpha = (.14 + pu * .14) * g; disc(x, y + 2, 16 + pu * 5, col(5)); ctx.globalAlpha = 1;
    for (let i = 0; i < 2; i++) { const q = ((G.time * .7 + i * .5) % 1); ctx.globalAlpha = (1 - q) * g; ringC(x, y + 2, 8 + q * 26, i ? col(4) : col(5), 1); } ctx.globalAlpha = 1;
    disc(x, y + 2, 3 + pu * 2, col(5)); if (((G.time * 4) | 0) % 2) rect(x - 1, y, 2, 2, choice(PCOLS())); }
  if (lit) { const k = clamp(w.t / 2.4, 0, 1), x = w.x - cx, y = w.y - cy - 20; ringC(x, y, 30 * (1 - k) + 4, col(5), 1); disc(x, y, 2 + k * 8, col(5)); }
}
function startReform() {
  const w = G.wreck; w.state = 'reform'; w.t = 0; G.state = 'reform'; AU.play('roar'); AU.play('revive'); flash(col(5), .3, true);
}
function updateReform(rdt) {
  const w = G.wreck; updateWreck(rdt); updateParticles(rdt); updateFT(rdt);
  if (w.t > 2.4) { flash(col(5), .9, true); chroma(1.5, true); shake(.7, true); AU.play('fusionHit', .8);
    for (let k = 0; k < 4; k++) ringFx(w.x, w.y, 40 + k * 40, PCOLS()[k % 3], .5 + k * .1, 3);
    const b = spawnBoss(w.room, reformDef(), { x: w.x, y: w.y }); b.armorT = 1.2; G.wreck = null; G.state = 'bossintro'; G.introT = 0; AU.setMode('boss'); }
}

// ===== new mechanic pieces (tick = per-frame logic, draw = world-pass visuals) =====
function arenaClip(m, cx, cy) { const A = arenaOf(m.owner); ctx.save(); ctx.beginPath(); ctx.rect(A.x0 - cx, A.y0 - cy, A.x1 - A.x0, A.y1 - A.y0); ctx.clip(); }
// Crown Toss
function tickBlade(m, dt) { const p = G.p, b = m.owner; m.d += (m.back ? -1 : 1) * m.v * dt;
  const bx = m.x + Math.cos(m.a) * m.d, by = m.y + Math.sin(m.a) * m.d; m.bx = bx; m.by = by;
  if (!m.back && m.d >= m.len) { m.back = true; shake(.12); AU.play('slam', 1.5, .4); bring(b, bx, by, dn(8), spd(b, 70), { c: C.gold }, m.a); }
  m.drop = (m.drop || 0) - dt; if (m.drop <= 0) { m.drop = dp(.11); eshot(bx, by, m.a + (Math.random() < .5 ? 1.571 : -1.571), 28, { c: C.gold, life: 2.2, r: 2.5 }); }
  if (Math.random() < .5) part({ x: bx + rand(-5, 5), y: by + rand(-5, 5), life: .25, max: .25, c: Math.random() < .5 ? C.gold : col(5), s: 2 });
  if (p.alive && dist(p.x, p.y, bx, by) < 10 + p.r) hurtPlayer(1, bx, by);
  if (m.back && m.d <= 0) { if (m.fin) m.fin(); return true; } return false; }
function drawLane(m, x, y, k, blink) { ctx.save(); ctx.translate(x, y); ctx.rotate(m.a); ctx.fillStyle = col(5);
  for (let i = 0; i < 5; i++) { const o = (G.time * 90 + i * m.len / 5) % m.len; ctx.fillRect(o, -1, 3, 1); ctx.fillRect(o + 1, -2, 1, 3); } ctx.restore(); }
function drawBlade(m, x, y, k, blink, cx, cy) { ctx.save(); ctx.translate(x, y); ctx.rotate(m.a); ctx.fillStyle = C.gold; ctx.globalAlpha = .45; for (let o = ((G.time * 40) % 8); o < m.len; o += 8) ctx.fillRect(o, -1, 3, 1); ctx.restore(); ctx.globalAlpha = 1;
  const bx = Math.round((m.bx || m.x) - cx), by = Math.round((m.by || m.y) - cy);
  ctx.save(); ctx.translate(bx, by); ctx.rotate(G.time * 14); ctx.fillStyle = col(0); ctx.fillRect(-10, -3, 20, 6); ctx.fillRect(-3, -10, 6, 20); ctx.fillStyle = C.gold; ctx.fillRect(-9, -2, 18, 4); ctx.fillRect(-2, -9, 4, 18); ctx.fillStyle = col(5); ctx.fillRect(-2, -2, 4, 4); ctx.restore(); ringC(bx, by, 11, C.gold, 1); }
// Eraser sweep: blind ring + the direction the beam will travel
function drawSweepTel(m, x, y, k, blink, cx, cy) { const pre = m.t < 1.5;
  ringC(x, y, m.r0, pre && blink ? col(5) : col(4), 1);
  if (pre) for (let i = 0; i < 3; i++) { const q = (G.time * .8 + i / 3) % 1, a = m.a0 + m.dir * m.arc * q, ax = x + Math.cos(a) * 90, ay = y + Math.sin(a) * 90, ta = a + m.dir * 1.571;
    pxLine(ax, ay, ax - Math.cos(ta + .6) * 5, ay - Math.sin(ta + .6) * 5, col(5)); pxLine(ax, ay, ax - Math.cos(ta - .6) * 5, ay - Math.sin(ta - .6) * 5, col(5)); } }
// Eraser fan cones: number badge on the live cone, faint numbered outlines for the ones still waiting
function coneBadge(m, x, y, live) { const nx = x + Math.cos(m.a) * 36, ny = y + Math.sin(m.a) * 36; disc(nx, ny, 5, col(0)); ringC(nx, ny, 5, live ? col(5) : C.red, 1); text(String(m.num), nx - 1, ny - 2, live ? col(5) : C.red); }
function drawCone(m, x, y) { coneBadge(m, x, y, true); }
function drawConeGhost(m, x, y, cx, cy) { if (m.follow && m.owner && !m.owner.dead) { x = m.owner.x - cx; y = m.owner.y - cy; }
  ctx.globalAlpha = .4; for (const e of [m.a - m.h, m.a + m.h]) for (let r = 14; r < 200; r += 6) rect(x + Math.cos(e) * r, y + Math.sin(e) * r, 1, 1, C.red); ctx.globalAlpha = 1; coneBadge(m, x, y, false); }
// Arbiter cross judgment: before it locks it only follows you as a thin gold cross
function drawPlus(m, x, y, k, blink, cx, cy) { const A = m.A;
  if (m.t < m.lockAt) { ctx.save(); ctx.beginPath(); ctx.rect(A.x0 - cx, A.y0 - cy, A.x1 - A.x0, A.y1 - A.y0); ctx.clip(); ctx.globalAlpha = .55;
    for (let o = A.x0 - cx + ((G.time * 30) % 6); o < A.x1 - cx; o += 6) rect(o, y, 3, 1, C.gold); for (let o = A.y0 - cy + ((G.time * 30) % 6); o < A.y1 - cy; o += 6) rect(x, o, 1, 3, C.gold); ctx.restore(); ctx.globalAlpha = 1; ringC(x, y, 6, C.gold, 1); }
  else { rect(x - 3, y, 7, 1, col(5)); rect(x, y - 3, 1, 7, col(5)); } }
// Arbiter cage
function tickCage(m, dt) { const p = G.p; if (m.t < m.t0) return false;
  const q = clamp((m.t - m.t0) / m.dur, 0, 1); m.h = m.h0 * (1 - q);
  if (p.alive) { const dx = p.x - m.x, dy = p.y - m.y, ax = Math.abs(dx), ay = Math.abs(dy), side = ax > ay ? (dx > 0 ? 0 : 1) : (dy > 0 ? 2 : 3), along = side < 2 ? dy : dx;
    const gap = side === m.side && Math.abs(along - m.gp * m.h) < m.gw / 2 - 2;
    if (Math.abs(Math.max(ax, ay) - m.h) < p.r + 1.5 && !gap) hurtPlayer(1, m.x + (side === 0 ? m.h : side === 1 ? -m.h : 0), m.y + (side === 2 ? m.h : side === 3 ? -m.h : 0)); }
  if (q >= 1) { AU.play('slam', .8, .7); shake(.3, true); ringFx(m.x, m.y, 40, C.gold, .35, 3); burst(m.x, m.y, 20, C.gold, 160, .4); bring(m.owner, m.x, m.y, dn(16), spd(m.owner, 75), { c: C.gold }, rand(0, 6)); return true; }
  return false; }
function drawCage(m, x, y, k, blink) { const pre = m.t < m.t0, h = m.h, c = pre && blink ? col(5) : C.gold, gc = m.gp * h, gw = m.gw / 2;
  ctx.globalAlpha = pre ? .06 : .1; rect(x - h, y - h, h * 2, h * 2, C.gold); ctx.globalAlpha = 1;
  const seg = (sd, a0, a1) => { if (a1 <= a0) return; const off = sd === 0 || sd === 2 ? h : -h, th = pre ? 1 : 2;
    if (sd < 2) { rect(x + off - 1, y + a0, 3, a1 - a0, col(0)); rect(x + off - (th - 1), y + a0, th, a1 - a0, c); } else { rect(x + a0, y + off - 1, a1 - a0, 3, col(0)); rect(x + a0, y + off - (th - 1), a1 - a0, th, c); } };
  for (let sd = 0; sd < 4; sd++) { if (sd === m.side) { seg(sd, -h, Math.max(-h, gc - gw)); seg(sd, Math.min(h, gc + gw), h); } else seg(sd, -h, h); }
  const nx = m.side === 0 ? 1 : m.side === 1 ? -1 : 0, ny = m.side === 2 ? 1 : m.side === 3 ? -1 : 0, gx = x + (m.side < 2 ? nx * h : gc), gy = y + (m.side < 2 ? gc : ny * h);
  for (let i = 0; i < 3; i++) { const o = 4 + i * 5 + (G.time * 20) % 5, ax = gx + nx * o, ay = gy + ny * o; pxLine(ax - nx * 3 - ny * 3, ay - ny * 3 - nx * 3, ax, ay, col(5)); pxLine(ax - nx * 3 + ny * 3, ay - ny * 3 + nx * 3, ax, ay, col(5)); } }
// Absence stillness
function drawStill(m, x, y, k, blink, cx, cy) { const p = G.p, px = p.x - cx, py = p.y - cy - 3, left = Math.max(0, m.warn - m.t), c = left < .7 && blink ? col(5) : C.violet;
  ringC(px, py, 9 + left * 7, c, 1); rect(px - 4, py - 21, 3, 7, col(0)); rect(px + 1, py - 21, 3, 7, col(0)); rect(px - 3, py - 20, 1, 5, c); rect(px + 2, py - 20, 1, 5, c); }
// Absence prism gather
function tickOrbs(m, dt) { const p = G.p, b = m.owner;
  for (const o of m.orbs) { if (o.dead) continue; o.ft = (o.ft === undefined ? rand(0, .4) : o.ft) - dt; if (o.ft <= 0) { o.ft = dp(.55); for (let i = 0; i < 3; i++) bs(b, o.x, o.y, m.t * 1.3 + i * 2.094, 55, { c: o.c, pol: o.c }); } }
  if (p.alive) for (const o of m.orbs) { if (o.dead || dist(p.x, p.y, o.x, o.y) > 9 + p.r) continue;
    if (o.c === p.pol) { AU.play('soak'); AU.play('chipGet', 1.2, .5); burst(o.x, o.y, 24, o.c, 140, .5); ringFx(o.x, o.y, 30, o.c, .4, 3); for (const o2 of m.orbs) if (o2 !== o && !o2.dead) burst(o2.x, o2.y, 8, o2.c, 60, .3); return true; }
    o.dead = true; hurtPlayer(1, o.x, o.y, true); burst(o.x, o.y, 14, o.c, 120, .4); }
  if (m.t >= m.warn) { AU.play('resolve'); flash(p.pol || C.red, .3, true); if (p.alive) mechFail(m, p.x, p.y); return true; }
  return false; }
function drawOrbs(m, x, y, k, blink, cx, cy) { const p = G.p, left = Math.max(0, m.warn - m.t);
  for (const o of m.orbs) { if (o.dead) continue; const ox = o.x - cx, oy = o.y - cy + Math.sin(G.time * 4 + o.x) * 2, mine = o.c === p.pol;
    ctx.globalAlpha = .18; disc(ox, oy, 14, o.c); ctx.globalAlpha = 1; disc(ox, oy, 7, col(0)); disc(ox, oy, 6, o.c); disc(ox - 2, oy - 2, 2, col(5));
    if (mine) { ringC(ox, oy, 10 + Math.sin(G.time * 10) * 2, left < 1.2 && blink ? col(5) : o.c, 1); for (let i = 0; i <= 12; i++) { const a = -1.571 + i / 12 * 6.283 * (left / m.warn); rect(ox + Math.cos(a) * 15, oy + Math.sin(a) * 15, 1, 1, col(5)); } } }
  const own = m.orbs.find(o => o.c === p.pol && !o.dead); if (own) { const a = ang(p.x, p.y, own.x, own.y), ax = p.x - cx + Math.cos(a) * 14, ay = p.y - cy - 3 + Math.sin(a) * 14;
    pxLine(ax, ay, ax - Math.cos(a + .6) * 4, ay - Math.sin(a + .6) * 4, own.c); pxLine(ax, ay, ax - Math.cos(a - .6) * 4, ay - Math.sin(a - .6) * 4, own.c); } }
// Absence hollow stars
function tickStar(m, dt) { const p = G.p, b = m.owner, a = ang(m.x, m.y, p.x, p.y);
  m.vx = lerp(m.vx, Math.cos(a) * m.spd, Math.min(1, dt * 1.5)); m.vy = lerp(m.vy, Math.sin(a) * m.spd, Math.min(1, dt * 1.5));
  for (const o of G.mechs) if (o !== m && o.type === 'star') { const d = dist(m.x, m.y, o.x, o.y); if (d < 30 && d > 0) { m.vx += (m.x - o.x) / d * 60 * dt; m.vy += (m.y - o.y) / d * 60 * dt; } }
  const A = arenaOf(b); m.x = clamp(m.x + m.vx * dt, A.x0 + 10, A.x1 - 10); m.y = clamp(m.y + m.vy * dt, A.y0 + 10, A.y1 - 10);
  m.ft = (m.ft === undefined ? .4 : m.ft) - dt; if (m.ft <= 0) { m.ft = dp(.6); eshot(m.x, m.y, rand(0, 6.283), 32, { c: C.violet, life: 3 }); }
  if (Math.random() < .3) part({ x: m.x + rand(-m.r, m.r), y: m.y + rand(-m.r, m.r), vx: (m.x - p.x) * .2, vy: (m.y - p.y) * .2, life: .3, max: .3, c: C.violet, s: 1 });
  if (p.alive && dist(p.x, p.y, m.x, m.y) < m.r + p.r) hurtPlayer(1, m.x, m.y);
  if (m.t >= m.life) { AU.play('resolve', 1.3, .5); ringFx(m.x, m.y, 26, C.violet, .3, 2); burst(m.x, m.y, 14, C.violet, 120, .4); bring(b, m.x, m.y, dn(8), 55, { c: C.violet }, rand(0, 6)); return true; }
  return false; }
function drawStar(m, x, y, k, blink) { const end = m.life - m.t < .8, r = m.r + (end ? Math.sin(G.time * 30) * 1.5 : 0);
  disc(x, y, r + 2, C.violet); disc(x, y, r, col(0)); for (let i = 0; i < 4; i++) { const a = G.time * 3 + i * 1.571; rect(x + Math.cos(a) * (r + 4) - 1, y + Math.sin(a) * (r + 4) - 1, 2, 2, end && blink ? col(5) : C.violet); } disc(x, y, 2, col(5)); }
// Absence reversal
function drawReverse(m, x, y, k, blink, cx, cy) { const p = G.p, px = p.x - cx, py = p.y - cy - 3, on = m.t > m.on, c = on ? C.violet : (blink ? col(5) : col(4));
  for (let i = 0; i < 2; i++) { const a0 = -G.time * 3 + i * Math.PI; for (let j = 0; j < 6; j++) { const a = a0 + j * .22; rect(px + Math.cos(a) * 13 - 1, py + Math.sin(a) * 11 - 1, 2, 2, c); }
    const a = a0 - .22; rect(px + Math.cos(a) * 13 - 1.5, py + Math.sin(a) * 11 - 1.5, 3, 3, on ? col(5) : c); } }
// Absence event horizon
function tickWell(m, dt) { const p = G.p; if (m.t < m.t0) return false;
  if (m.t < m.t0 + m.dur) { if (p.alive && p.dashT <= 0) { const d = dist(p.x, p.y, m.x, m.y); if (d > 2) moveBody(p, (m.x - p.x) / d * m.pull * dt, (m.y - p.y) / d * m.pull * dt); if (d < m.r + p.r) hurtPlayer(1, m.x, m.y, true); }
    if (Math.random() < .6) { const a = rand(0, 6.283), r = rand(40, 90); part({ x: m.x + Math.cos(a) * r, y: m.y + Math.sin(a) * r, vx: -Math.cos(a) * r * 1.6, vy: -Math.sin(a) * r * 1.6, life: .5, max: .5, c: Math.random() < .5 ? C.violet : col(4), s: 1 }); }
    return false; }
  AU.play('slam', .7, .6); shake(.25, true); ringFx(m.x, m.y, 50, C.violet, .4, 3); burst(m.x, m.y, 24, C.violet, 160, .5); bring(m.owner, m.x, m.y, dn(14), 60, { c: C.violet }, rand(0, 6)); return true; }
function drawWell(m, x, y, k, blink) { const R = m.r;
  if (m.t < m.t0) { ringC(x, y, R, blink ? col(5) : C.violet, 1); ringC(x, y, R + (1 - m.t / m.t0) * 60, C.violet, 1); return; }
  for (let i = 0; i < 12; i++) { const rr = R + 6 + ((G.time * 40 + i * 11) % 60), a = G.time * 2 + i * .524 + 60 / rr; rect(x + Math.cos(a) * rr - 1, y + Math.sin(a) * rr - 1, 2, 2, i % 2 ? C.violet : col(4)); }
  disc(x, y, R + 2, C.violet); disc(x, y, R, col(0)); ringC(x, y, R - 5 + Math.sin(G.time * 10), col(3), 1); }
// Recomposed prism nova
function tickNova(m, dt) { const p = G.p; if (m.t < m.t0) return false;
  if (!m.rel) { m.rel = 1; AU.play('knock', 1.3, .6); shake(.15, true); bring(m.owner, m.x, m.y, dn(9), 50, { c: m.c }, m.gap + Math.PI); }
  m.R += m.v * dt;
  if (p.alive && Math.abs(dist(p.x, p.y, m.x, m.y) - m.R) < 3 + p.r && Math.abs(angDiff(m.gap, ang(m.x, m.y, p.x, p.y))) > m.gh) hurtPlayer(1, p.x, p.y);
  if (Math.random() < .5) { const a = rand(0, 6.283); if (Math.abs(angDiff(m.gap, a)) > m.gh) part({ x: m.x + Math.cos(a) * m.R, y: m.y + Math.sin(a) * m.R, vx: Math.cos(a) * 40, vy: Math.sin(a) * 40, life: .3, max: .3, c: m.c, s: 2 }); }
  return m.R > 430; }
function drawNova(m, x, y, k, blink, cx, cy) { const pre = m.t < m.t0, a0 = m.gap + m.gh, a1 = m.gap - m.gh + 6.2832;
  arenaClip(m, cx, cy); ctx.fillStyle = col(5); ctx.globalAlpha = pre ? .08 + .14 * (m.t / m.t0) : .08; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 430, m.gap - m.gh, m.gap + m.gh); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
  if (pre) { for (const sd of [-1, 1]) { const a = m.gap + sd * m.gh; pxLine(x, y, x + Math.cos(a) * 430, y + Math.sin(a) * 430, blink ? col(5) : m.c); }
    ctx.strokeStyle = m.c; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 10 + (m.t / m.t0) * 12, a0, a1); ctx.stroke(); }
  else { ctx.strokeStyle = m.c; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, m.R, a0, a1); ctx.stroke(); ctx.strokeStyle = col(5); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, m.R, a0, a1); ctx.stroke(); }
  ctx.restore(); }
