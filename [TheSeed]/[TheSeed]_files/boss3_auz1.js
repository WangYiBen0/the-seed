// ===== ACHROMA bosses III: the final floor. THE ABSENCE is always the first form; its second phase takes one of three shapes =====
// RECOMPOSED (prismatic colour and lasers), INVERSION (dense, aggressive bullet patterns) and LATTICE (positional laws).
// Each second form has twice the old health, its own moveset preference and its own look for the whole arena.
'use strict';
Object.assign(ABSENCE_2, { press: .7,
  phases: [['spectrum', 'chroma', 'collapse', 'nova', 'rec_refract'], ['spectrum', 'mirror', 'prismnuke', 'chroma', 'collapse', 'nova', 'rec_prismwall', 'rec_mines'], ['combo', 'combo', 'combo', 'prismnuke', 'mirror', 'collapse', 'rec_refract', 'rec_mines']],
  combos: [['spectrum', 'chroma'], ['collapse', 'nova'], ['mirror', 'spectrum'], ['prismnuke', 'nova'], ['chroma', 'collapse'], ['rec_refract', 'chroma'], ['rec_mines', 'nova'], ['rec_prismwall', 'collapse']] });
const FORM_INV = { key: 'inverse', look: 10, song: 'b11', form: 2, r: 17, roam: { r: 130, spd: 100, w: .9 }, press: .55,
  name: N4('SPECIMEN ZERO', '零號樣本', '零号サンプル', '零号样本'),
  phases: [['inv_lattice', 'inv_freeze', 'inv_orbs', 'inv_needle', 'inv_wheel'], ['inv_tide', 'inv_freeze', 'inv_orbs', 'inv_starburst', 'inv_implode', 'inv_wheel', 'inv_lattice'], ['combo', 'combo', 'combo', 'inv_tide', 'inv_implode', 'inv_starburst', 'inv_needle']],
  combos: [['inv_lattice', 'inv_needle'], ['inv_orbs', 'inv_implode'], ['inv_wheel', 'inv_freeze'], ['inv_tide', 'inv_starburst'], ['inv_needle', 'inv_orbs']] };
const FORM_LAT = { key: 'lattice', look: 11, song: 'b12', form: 2, r: 17, roam: { r: 110, spd: 80, w: .6 }, press: 1,
  name: N4('SPECIMEN ZERO', '零號樣本', '零号サンプル', '零号样本'),
  phases: [['lat_rotate', 'lat_lines', 'lat_glyphs', 'lat_weft', 'lat_cube'], ['lat_shift', 'lat_order', 'lat_conveyor', 'lat_rotate', 'lat_glyphs', 'lat_weft', 'lat_lines'], ['combo', 'combo', 'combo', 'lat_shift', 'lat_order', 'lat_conveyor', 'lat_cube']],
  combos: [['lat_weft', 'lat_cube'], ['lat_lines', 'lat_conveyor'], ['lat_glyphs', 'lat_lines'], ['lat_order', 'lat_cube'], ['lat_rotate', 'lat_lines']] };
const FORMS = { recomposed: ABSENCE_2, inverse: FORM_INV, lattice: FORM_LAT };
// the first form is always the plain ABSENCE; the second form is drawn when it falls
const _pickBoss3 = pickBoss; pickBoss = function () { _pickBoss3(); if (G.floor === BOSSES.length - 1) G.bossPick = { alt: false, v: false }; };
reformDef = function () { return FORMS[G.formPick] || ABSENCE_2; };
const _absenceFall3 = absenceFall; absenceFall = function (b) { _absenceFall3(b); G.absenceHp = b.maxHp * 1.65; if (!(window.BOSS_TEST && BOSS_TEST.on && G.formPick)) G.formPick = choice(Object.keys(FORMS)); };

// ---------------- helpers ----------------
function tipM(b, tip, dur) { mech({ type: 'tipc', warn: dur, owner: b, tip, draw: () => { } }); }
function bouncePath(A, x, y, a, n) { const pts = [[x, y]]; let dx = Math.cos(a), dy = Math.sin(a);
  for (let k = 0; k <= n; k++) { const tx = dx > 0 ? (A.x1 - x) / dx : dx < 0 ? (A.x0 - x) / dx : 1e9, ty = dy > 0 ? (A.y1 - y) / dy : dy < 0 ? (A.y0 - y) / dy : 1e9, s = Math.min(tx, ty);
    x += dx * s; y += dy * s; pts.push([x, y]); if (tx < ty) dx = -dx; else dy = -dy; } return pts; }
const ringOut = (b, x, y, R, n, s, o, off = 0) => { for (let k = 0; k < n; k++) { const a = off + k / n * 6.283; eshot(x + Math.cos(a) * R, y + Math.sin(a) * R, a, s, o); } };

const BATK3 = {
  // ======================= RECOMPOSED: two new laws =======================
  rec_refract(b, t, dt) { // a beam that bounces off the arena walls: its whole path is drawn before it fires
    const m = b.mem, A = A0(b), N = 3 + (b.phase >= 2 ? 1 : 0), per = 1; if (!m.s) { m.s = 1; m.n = 0; cue(b, 1.2); tipM(b, 'mt_r_refract', N * per + 1.3); }
    if (m.n < N && t > .2 + m.n * per) { const pts = bouncePath(A, b.x, b.y, ang(b.x, b.y, G.p.x, G.p.y) + rand(-.2, .2), 2 + (b.phase >= 1 ? 1 : 0)), c = PCOLS()[m.n % 3];
      for (let i = 0; i < pts.length - 1; i++) mech({ type: 'seg', x: pts[i][0], y: pts[i][1], x2: pts[i + 1][0], y2: pts[i + 1][1], w: 12, warn: 1.05, owner: b, small: true, onResolve: z => { if (i === 0) AU.play('laser', 1.2, .6); burst(z.x2, z.y2, 8, c, 90, .3); for (let k = 0; k < 10; k++) { const f = k / 9; part({ x: lerp(z.x, z.x2, f), y: lerp(z.y, z.y2, f), vx: rand(-20, 20), vy: rand(-20, 20), life: .3, max: .3, c, s: 2 }); } } });
      m.n++; AU.play('telegraph', 1.5, .5); }
    if (t > .4 && every(t, dt, dp(.6))) { for (let i = 0; i < 6; i++) { const c = PCOLS()[i % 3]; bs(b, b.x, b.y, i / 6 * 6.283 + t, spd(b, 60), { c, pol: c }); } }
    return m.n >= N && t > .2 + (N - 1) * per + 1.25; },
  rec_mines(b, t, dt) { // dives through three points, seeding light mines along its path; they burst in the order they were laid
    const m = b.mem; if (!m.s) { m.s = 1; cue(b, .9); m.wp = []; let last = [b.x, b.y]; for (let i = 0; i < 3; i++) { const q = farPt(b, last, 120, 40); m.wp.push(q); last = q; } m.i = 0; m.lx = b.x; m.ly = b.y; b.anchored = true; tipM(b, 'mt_r_mines', 5.4); }
    if (m.i < m.wp.length) { const q = m.wp[m.i]; b.goal = { x: q[0], y: q[1], spd: 250 };
      if (dist(b.x, b.y, m.lx, m.ly) > 30) { m.lx = b.x; m.ly = b.y; const c = choice(PCOLS());
        mech({ type: 'circle', x: b.x, y: b.y, r: 20, warn: 1.7, owner: b, small: true, tint: c, onResolve: z => ringOut(b, z.x, z.y, 28, dn(7), spd(b, 60), { c }, rand(0, 6.28)) }); }
      if (dist(b.x, b.y, q[0], q[1]) < 16 || t > 6) m.i++; }
    else b.goal = null;
    return (m.i >= m.wp.length && t > 3.4) || t > 7; },

  // ======================= INVERSION: bullets, bullets, bullets =======================
  inv_lattice(b, t, dt) { // two counter-turning spirals weave a moving lattice: slip through its diamonds
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, .8); b.anchored = true; b.goal = { x: A.cx, y: A.cy, spd: 230 }; m.dir = Math.random() < .5 ? 1 : -1; tipM(b, 'mt_i_lattice', 6.6); }
    if (t > .6) b.goal = null;
    if (t > .7 && t < 6.2 && every(t, dt, dp(.16))) { const arms = 4 + b.phase; for (let i = 0; i < arms; i++) { bs(b, b.x, b.y, i / arms * 6.283 + t * .9 * m.dir, spd(b, 62), { c: col(5) }); bs(b, b.x, b.y, i / arms * 6.283 - t * .9 * m.dir + Math.PI / arms, spd(b, 62), { c: C.violet }); } }
    return t > 6.6; },
  inv_freeze(b, t, dt) { // a burst stops dead in the air; your spot is marked; then every frozen bullet converges on it
    const m = b.mem, N = 3 + (b.phase >= 2 ? 1 : 0), per = 2.2; if (!m.s) { m.s = 1; m.k = 0; m.sets = []; cue(b, 1.2); tipM(b, 'mt_i_freeze', N * per + 1.4); }
    if (m.k < N && t > .3 + m.k * per) { const n = dn(32), off = rand(0, 6.28), set = { t0: t, list: [] };
      for (let i = 0; i < n; i++) { const a = off + i / n * 6.283, sp = spd(b, rand(120, 180)), q = { x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 3, life: 9, c: col(5) }; G.ebullets.push(q); set.list.push(q); }
      m.sets.push(set); m.k++; AU.play('ebullet', .6); }
    for (const s of m.sets) { const lt = t - s.t0;
      if (lt > .55 && !s.stop) { s.stop = 1; for (const q of s.list) q.vx = q.vy = 0; AU.play('tick', .7); }
      if (lt > .85 && !s.mark) { s.mark = 1; s.px = G.p.x; s.py = G.p.y; mech({ type: 'circle', x: s.px, y: s.py, r: 16, warn: .65, owner: b, small: true, tint: col(5) }); }
      if (lt > 1.5 && !s.go) { s.go = 1; AU.play('laser', 1.4, .5); const sp = spd(b, 150); for (const q of s.list) { if (!G.ebullets.includes(q)) continue; const a = ang(q.x, q.y, s.px, s.py); q.vx = Math.cos(a) * sp; q.vy = Math.sin(a) * sp; q.life = 4; } } }
    return m.k >= N && t > .3 + (N - 1) * per + 2.8; },
  inv_orbs(b, t, dt) { // black eggs drift out and settle; keep away from them when they hatch into rings
    const m = b.mem, N = 4 + b.phase; if (!m.s) { m.s = 1; m.list = []; cue(b, .7); tipM(b, 'mt_i_orbs', 3.6); const a0 = ang(b.x, b.y, G.p.x, G.p.y);
      for (let i = 0; i < N; i++) { const a = a0 + (i - (N - 1) / 2) * .55 + rand(-.1, .1), sp = rand(75, 125), q = { x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 6, life: 9, c: col(5), egg: 1 }; G.ebullets.push(q); m.list.push(q); } AU.play('lob', .6); }
    if (t > 1 && !m.stop) { m.stop = 1; for (const q of m.list) { q.vx = q.vy = 0; if (G.ebullets.includes(q)) mech({ type: 'circle', x: q.x, y: q.y, r: 30, warn: 1.6, owner: b, small: true, tint: col(5) }); } }
    if (t > 2.6 && !m.pop) { m.pop = 1; AU.play('explode', 1.3, .5); for (const q of m.list) { const i = G.ebullets.indexOf(q); if (i < 0) continue; G.ebullets.splice(i, 1); const n = dn(16), o = rand(0, 6.28);
        ringOut(b, q.x, q.y, 38, n, spd(b, 70), { c: col(4) }, o); if (b.phase >= 2) ringOut(b, q.x, q.y, 38, n, spd(b, 46), { c: col(5) }, o + Math.PI / n); } }
    if (every(t, dt, dp(.9))) aimFan(b, 3, .25, spd(b, 85), { c: col(5) });
    return t > 3.4; },
  inv_tide(b, t, dt) { // a current drags every bullet of this attack sideways, and turns around every few seconds
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, .6); m.vert = Math.random() < .5; m.cur = mech({ type: 'tidecur', warn: 99, owner: b, dir: 1, vert: m.vert, A, tip: 'mt_i_tide', draw: drawCurrent }); }
    const per = 2.2, dir = Math.floor(t / per) % 2 ? -1 : 1; m.cur.dir = dir; m.cur.soon = per - (t % per) < .55;
    for (const q of G.ebullets) if (q.tide) { if (m.vert) q.vy += dir * 55 * dt; else q.vx += dir * 55 * dt; }
    if (t < 6.3 && every(t, dt, dp(.55))) { const n = dn(16), o = rand(0, 6.28); for (let k = 0; k < n; k++) bs(b, b.x, b.y, o + k / n * 6.283, spd(b, 42), { c: col(5), tide: 1, life: 7 }); }
    if (t > 6.8) { m.cur.warn = 0; for (const q of G.ebullets) q.tide = 0; return true; } return false; },
  inv_needle(b, t, dt) { // aimed needle lines that lead your movement: sidestep, then the line shoots out along itself
    const m = b.mem, N = 4 + (b.phase >= 1 ? 2 : 0), per = .8; if (!m.s) { m.s = 1; m.n = 0; cue(b, 1.3); tipM(b, 'mt_i_needle', N * per + 1.2); }
    if (m.n < N && t > .2 + m.n * per) { const p = G.p, tx = p.x + p.vx * .45, ty = p.y + p.vy * .45, a = ang(b.x, b.y, tx, ty), bx = b.x, by = b.y;
      mech({ type: 'seg', x: bx, y: by, x2: bx + Math.cos(a) * 460, y2: by + Math.sin(a) * 460, w: 12, warn: .75, owner: b, small: true, onResolve: () => { const n = dn(10); for (let k = 0; k < n; k++) { const d = 20 + k * 22; eshot(bx + Math.cos(a) * d, by + Math.sin(a) * d, a, spd(b, 160), { c: col(5), life: 2 }); } AU.play('laser', 1.6, .5); } });
      m.n++; AU.play('telegraph', 1.4, .6); }
    return m.n >= N && t > .2 + (N - 1) * per + 1.1; },
  inv_wheel(b, t, dt) { // rings of bullets roll around the arena and bounce off its walls
    const m = b.mem, A = A0(b), N = 2 + (b.phase >= 1 ? 1 : 0), R = 26, K = 10; if (!m.s) { m.s = 1; cue(b, .9); m.ws = []; tipM(b, 'mt_i_wheel', 7.2);
      for (let i = 0; i < N; i++) { const [x, y] = farPt(b, [G.p.x, G.p.y], 130, 50), a = rand(0, 6.28); m.ws.push({ x, y, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, rot: 0, list: [] }); mech({ type: 'circle', x, y, r: R + 4, warn: .9, owner: b, small: true, tint: col(5) }); } }
    if (t > .9 && !m.on) { m.on = 1; AU.play('chakram', .6); for (const w of m.ws) for (let k = 0; k < K; k++) { const q = { x: w.x, y: w.y, vx: 0, vy: 0, r: 3, life: 99, c: col(5), ghostWall: true }; G.ebullets.push(q); w.list.push(q); } }
    if (m.on && t < 6.6) for (const w of m.ws) { w.x += w.vx * dt; w.y += w.vy * dt; if (w.x < A.x0 + R + 4 || w.x > A.x1 - R - 4) { w.vx = -w.vx; w.x = clamp(w.x, A.x0 + R + 4, A.x1 - R - 4); } if (w.y < A.y0 + R + 4 || w.y > A.y1 - R - 4) { w.vy = -w.vy; w.y = clamp(w.y, A.y0 + R + 4, A.y1 - R - 4); }
      w.rot += dt * 2.4; w.list.forEach((q, k) => { const a = w.rot + k / K * 6.283; q.x = w.x + Math.cos(a) * R; q.y = w.y + Math.sin(a) * R; q.vx = q.vy = 0; }); }
    if (t >= 6.6 && !m.rel) { m.rel = 1; for (const w of m.ws) w.list.forEach((q, k) => { const a = w.rot + k / K * 6.283; q.vx = Math.cos(a) * spd(b, 70); q.vy = Math.sin(a) * spd(b, 70); q.life = 3; q.ghostWall = false; }); }
    if (m.on && t < 6.6 && every(t, dt, dp(.7))) aimFan(b, 2, .3, spd(b, 80), { c: col(4) });
    return t > 7; },
  inv_starburst(b, t, dt) { // flies to three points; at each a five-pointed star of lines strikes, then shoots out along its arms
    const m = b.mem, N = 3, per = 1.6; if (!m.s) { m.s = 1; m.k = 0; cue(b, 1); b.anchored = true; tipM(b, 'mt_i_star', N * per + .8); }
    if (m.k < N) { const t0 = m.k * per; if (!m.go) { m.go = 1; m.tgt = farPt(b, [G.p.x, G.p.y], 90, 50); } if (!m.tel) b.goal = { x: m.tgt[0], y: m.tgt[1], spd: 260 };
      if (t > t0 + .55 && !m.tel) { m.tel = 1; b.goal = null; const a0 = rand(0, 6.28), arms = 5 + (b.phase >= 2 ? 1 : 0), bx = b.x, by = b.y;
        for (let i = 0; i < arms; i++) { const a = a0 + i / arms * 6.283; mech({ type: 'seg', x: bx, y: by, x2: bx + Math.cos(a) * 420, y2: by + Math.sin(a) * 420, w: 14, warn: .85, owner: b, small: true,
          onResolve: () => { const n = dn(7); for (let k = 0; k < n; k++) eshot(bx + Math.cos(a) * (16 + k * 26), by + Math.sin(a) * (16 + k * 26), a, spd(b, 120), { c: col(5), life: 2.4 }); } }); }
        AU.play('telegraph', 1.2, .7); }
      if (t > t0 + 1.45) { m.k++; m.go = 0; m.tel = 0; } }
    return m.k >= N && t > N * per + .2; },
  inv_implode(b, t, dt) { // a ring of bullets forms around you and closes in: leave through its gap, or dash through
    const m = b.mem, N = 1 + (b.phase >= 1 ? 1 : 0), per = 2.6; if (!m.s) { m.s = 1; m.k = 0; cue(b, .8); tipM(b, 'mt_i_implode', N * per + 2.6); }
    if (m.k < N && t > m.k * per && !m.tel) { m.tel = 1; m.cx = G.p.x; m.cy = G.p.y; m.gap = rand(0, 6.28); mech({ type: 'implode', x: m.cx, y: m.cy, R: 150, gap: m.gap, gh: .5, warn: .9, owner: b, draw: drawImplodeTel }); AU.play('telegraph', .7); }
    if (m.tel && !m.fired && t > m.k * per + .9) { m.fired = 1; const n = dn(70), sp = spd(b, 60);
      for (let i = 0; i < n; i++) { const a = i / n * 6.283; if (Math.abs(angDiff(a, m.gap)) < .5) continue; G.ebullets.push({ x: m.cx + Math.cos(a) * 150, y: m.cy + Math.sin(a) * 150, vx: -Math.cos(a) * sp, vy: -Math.sin(a) * sp, r: 3, life: 5.4, c: col(5), ghostWall: true }); } AU.play('ebullet', .5); }
    if (m.fired && t > m.k * per + 1.5) { m.k++; m.tel = 0; m.fired = 0; }
    if (every(t, dt, dp(1.1))) aimFan(b, 3, .3, spd(b, 70), { c: col(4) });
    return m.k >= N && t > (N - 1) * per + 5; },

  // ======================= LATTICE: positional laws =======================
  lat_rotate(b, t, dt) { // the whole arena will be judged except two turning wedges: walk with them
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, .7); m.rot = { a: rand(0, 6.28) }; m.va = (Math.random() < .5 ? 1 : -1) * .55;
      const holes = [0, 1].map(i => ({ sector: true, x: A.cx, y: A.cy, len: 520, h: .42, mm: { get a() { return m.rot.a + i * Math.PI; } } }));
      mech({ type: 'holes', A, holes, warn: 3.8, owner: b, tip: 'mt_l_rotate' }); }
    m.rot.a += m.va * (b.phase >= 1 && t > 1.9 ? -1 : 1) * dt;
    if (t > .5 && t < 3.8 && every(t, dt, dp(.8))) aimFan(b, 2, .4, spd(b, 70), { c: C.cyan });
    return t > 4.2; },
  lat_lines(b, t, dt) { // three pylons: the edges of their triangle strike, then shoot along themselves
    const m = b.mem, A = A0(b), N = b.phase >= 1 ? 2 : 1, per = 2.6; if (!m.s) { m.s = 1; m.k = 0; cue(b, 1); tipM(b, 'mt_l_lines', N * per + .4); }
    if (m.k < N && t > m.k * per && !m.made) { m.made = 1; const p = G.p, pts = [[clamp(p.x + rand(-24, 24), A.x0 + 30, A.x1 - 30), clamp(p.y + rand(-24, 24), A.y0 + 30, A.y1 - 30)]];
      pts.push(farPt(b, pts[0], 120, 40)); let q = pts[1]; for (let k = 0; k < 50; k++) { q = farPt(b, pts[0], 110, 40); if (dist(q[0], q[1], pts[1][0], pts[1][1]) > 110) break; } pts.push(q);
      mech({ type: 'pylons', pts, warn: 2.3, owner: b, draw: drawPylons });
      for (let i = 0; i < 3; i++) { const [x, y] = pts[i], [x2, y2] = pts[(i + 1) % 3]; mech({ type: 'seg', x, y, x2, y2, w: 16, warn: 2.3, owner: b, onResolve: z => { const n = dn(8), a = Math.atan2(z.y2 - z.y, z.x2 - z.x); for (let k = 0; k <= n; k++) { const f = k / n; eshot(lerp(z.x, z.x2, f), lerp(z.y, z.y2, f), a + (k % 2 ? 0 : Math.PI), spd(b, 55), { c: C.cyan, life: 1.6 }); } } }); } }
    if (m.made && t > m.k * per + 2.4) { m.k++; m.made = 0; }
    return m.k >= N && t > (N - 1) * per + 2.8; },
  lat_shift(b, t, dt) { // you will be reflected through the arena's centre: pick a spot whose mirror image is safe
    const m = b.mem, A = A0(b), N = b.phase >= 2 ? 2 : 1, per = 3.6; if (!m.s) { m.s = 1; m.k = 0; cue(b, .6); tipM(b, 'mt_l_shift', N * per + .4); }
    if (m.k < N && t > m.k * per && !m.made) { m.made = 1; const p = G.p, zs = [[2 * A.cx - p.x, 2 * A.cy - p.y]]; for (let i = 0; i < 3 + b.phase; i++) zs.push(farPt(b, zs[i], 70, 40));
      for (const [x, y] of zs) mech({ type: 'circle', x, y, r: 46, warn: 3.15, owner: b });
      mech({ type: 'shiftghost', warn: 3, owner: b, A, draw: drawShiftGhost, onResolve: () => mirrorHero(A) }); }
    if (m.made && t > m.k * per + 3.3) { m.k++; m.made = 0; }
    if (t > .5 && every(t, dt, dp(1))) aimFan(b, 2, .35, spd(b, 70), { c: C.cyan });
    return m.k >= N && t > (N - 1) * per + 3.6; },
  lat_glyphs(b, t, dt) { // three glyphs on the floor; stand in the one that matches the sigil above the knight (it may change once)
    const m = b.mem; if (!m.s) { m.s = 1; cue(b, 1.2); const p = G.p, A = A0(b), pts = [farPt(b, [p.x, p.y], 40, 50)];
      for (let i = 1; i < 3; i++) { let q = pts[0]; for (let k = 0; k < 80; k++) { q = rndArenaPt(b, 50); if (pts.every(o => dist(o[0], o[1], q[0], q[1]) > 110 && dist(o[0], o[1], q[0], q[1]) < 210) && dist(q[0], q[1], p.x, p.y) < 220) break; } pts.push(q); }
      m.sym = shuffle([0, 1, 2]); m.want = randi(0, 2); m.fake = b.phase >= 1 ? (m.want + randi(1, 2)) % 3 : -1; b.glyph = m.sym[m.fake >= 0 ? m.fake : m.want]; m.w = b.phase >= 1 ? 4.3 : 3.8;
      mech({ type: 'holes', A, holes: [{ x: pts[m.want][0], y: pts[m.want][1], r: 34 }], warn: m.w, showAt: m.w - .45, owner: b, tip: 'mt_l_glyph' });
      mech({ type: 'glyphs', pts, sym: m.sym, warn: m.w, owner: b, draw: drawGlyphs }); }
    if (m.fake >= 0 && t > 1.6 && b.glyph !== m.sym[m.want]) { b.glyph = m.sym[m.want]; AU.play('telegraph', 1.6); b.glyphT = .5; }
    if (t > m.w + .1) b.glyph = undefined;
    if (t > .4 && t < m.w - .3 && every(t, dt, dp(.9))) aimFan(b, 2, .4, spd(b, 65), { c: C.cyan });
    return t > m.w + .4; },
  lat_conveyor(b, t, dt) { // the floor splits into strips that carry you; their far ends burn
    const m = b.mem, D = 6.4; if (!m.s) { m.s = 1; cue(b, .8); m.c = mech({ type: 'conveyor', warn: D, owner: b, A: A0(b), vert: Math.random() < .5, tip: 'mt_l_conv', tick: tickConveyor, draw: drawConveyor }); }
    if (t > .6 && t < D && every(t, dt, dp(.75))) { const n = dn(12), o = rand(0, 6.28); for (let k = 0; k < n; k++) bs(b, b.x, b.y, o + k / n * 6.283, spd(b, 50), { c: C.cyan }); }
    return t > D + .3; },
  lat_order(b, t, dt) { // touch the numbered nodes in order before each runs out; the path you walk behind you is struck
    const m = b.mem; if (!m.s) { m.s = 1; cue(b, 1.3); const p = G.p, n = 4 + (b.phase >= 2 ? 1 : 0), pts = []; let last = [p.x, p.y], prev = null;
      for (let i = 0; i < n; i++) { let q = rndArenaPt(b, 36); for (let k = 0; k < 120; k++) { q = rndArenaPt(b, 36); const d = dist(q[0], q[1], last[0], last[1]);
          const turn = prev ? Math.abs(angDiff(ang(last[0], last[1], q[0], q[1]), ang(last[0], last[1], prev[0], prev[1]))) : 9;
          if (d > 60 && d < 115 && (turn > 1 || k > 90) && pts.every(o => dist(o[0], o[1], q[0], q[1]) > 50)) break; } pts.push(q); prev = last; last = q; }
      m.o = mech({ type: 'order', pts, k: 0, warn: 99, owner: b, t0: 1.2, per: 1.75, tip: 'mt_l_order', tick: tickOrder, draw: drawOrder }); }
    if (t > .8 && every(t, dt, dp(1.2))) { const n = dn(10), o = rand(0, 6.28); for (let k = 0; k < n; k++) bs(b, b.x, b.y, o + k / n * 6.283, spd(b, 45), { c: C.cyan }); }
    return t > 1 && !G.mechs.includes(m.o); },
  lat_weft(b, t, dt) { // warp then weft: a grid of lines strikes in passes; stand inside a cell (and move when the grid shifts)
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, .9); const sp = b.phase >= 1 ? 58 : 64, ox = rand(4, sp - 4), oy = rand(4, sp - 4); m.end = 0;
      const passes = b.phase >= 1 ? [[0, 2, 0], [1, 2.8, 0], [0, 3.9, sp / 2]] : [[0, 2, 0], [1, 2.8, 0]];
      for (const [hor, wt, sh] of passes) { if (!hor) for (let x = A.x0 + (ox + sh) % sp; x < A.x1; x += sp) mech({ type: 'seg', x, y: A.y0, x2: x, y2: A.y1, w: 14, warn: wt, showAt: Math.max(0, wt - 1.6), owner: b, small: true, tip: 'mt_l_weft' });
        else for (let y = A.y0 + oy; y < A.y1; y += sp) mech({ type: 'seg', x: A.x0, y, x2: A.x1, y2: y, w: 14, warn: wt, showAt: Math.max(0, wt - 1.6), owner: b, small: true, tip: 'mt_l_weft' }); m.end = wt + .4; }
      m.ox = ox; m.oy = oy; m.sp = sp; }
    if (t > 2.8 && !m.burst) { m.burst = 1; AU.play('resolve', .8); for (let x = A.x0 + m.ox; x < A.x1; x += m.sp) for (let y = A.y0 + m.oy; y < A.y1; y += m.sp) if ((Math.round(x / m.sp) + Math.round(y / m.sp)) % 2 === 0) for (let k = 0; k < 4; k++) eshot(x, y, k * 1.5708, spd(b, 70), { c: C.cyan, life: 1.4 }); }
    return t > m.end; },
  lat_cube(b, t, dt) { // a great square hunts you, then four smaller ones fall on its corners: leave through the middle of a side
    const m = b.mem, N = b.phase >= 2 ? 2 : 1, per = 3.4; if (!m.s) { m.s = 1; m.k = 0; cue(b, .6); tipM(b, 'mt_l_cube', N * per + .3); }
    if (m.k < N) { const lt = t - m.k * per;
      if (!m.big) { m.big = mech({ type: 'rect', x: G.p.x, y: G.p.y, w: 104, h: 104, warn: 2.5, owner: b, onResolve: z => { shake(.3, true); burst(z.x, z.y, 30, C.cyan, 160, .5); } }); m.corn = 0; }
      if (lt < 1.6) { const q = m.big, d = dist(q.x, q.y, G.p.x, G.p.y); if (d > 1) { const s = Math.min(d, 110 * dt); q.x += (G.p.x - q.x) / d * s; q.y += (G.p.y - q.y) / d * s; } }
      else if (!m.corn) { m.corn = 1; const { x, y } = m.big; for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) mech({ type: 'rect', x: x + sx * 52, y: y + sy * 52, w: 52, h: 52, warn: 1.6, owner: b, small: true }); AU.play('telegraph', .8); }
      if (lt > per) { m.k++; m.big = null; } }
    if (t > .5 && every(t, dt, dp(1))) aimFan(b, 2, .5, spd(b, 70), { c: C.cyan });
    return m.k >= N; },
};
Object.assign(BATK, BATK3);

// ---------------- mechanic pieces ----------------
function drawCurrent(m, x, y, k, blink, cx, cy) { const A = m.A, c = m.soon && ((G.time * 10) | 0) % 2 ? col(5) : C.violet, dir = m.dir;
  for (let i = 0; i < 14; i++) { const f = ((i / 14 + G.time * .25 * dir) % 1 + 1) % 1;
    for (const side of [0, 1]) { const px = m.vert ? lerp(A.x0 + 8, A.x1 - 8, side) : lerp(A.x0, A.x1, f), py = m.vert ? lerp(A.y0, A.y1, f) : lerp(A.y0 + 8, A.y1 - 8, side), a = m.vert ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? 0 : Math.PI);
      const ax = px - cx, ay = py - cy; pxLine(ax, ay, ax - Math.cos(a - .6) * 4, ay - Math.sin(a - .6) * 4, c); pxLine(ax, ay, ax - Math.cos(a + .6) * 4, ay - Math.sin(a + .6) * 4, c); } } }
function drawImplodeTel(m, x, y, k) { const c = ((G.time * 14) | 0) % 2 ? col(5) : C.violet;
  for (let i = 0; i < 72; i++) { const a = i / 72 * 6.283; if (Math.abs(angDiff(a, m.gap)) < .5) continue; if ((i + ((G.time * 20) | 0)) % 3 === 0) continue; rect(x + Math.cos(a) * m.R, y + Math.sin(a) * m.R, 2, 2, c); }
  for (const s of [-1, 1]) { const a = m.gap + s * .5; pxLine(x + Math.cos(a) * (m.R - 8), y + Math.sin(a) * (m.R - 8), x + Math.cos(a) * (m.R + 8), y + Math.sin(a) * (m.R + 8), col(5)); } }
function drawPylons(m, x, y, k, blink, cx, cy) { for (const [px, py] of m.pts) { const sx = px - cx, sy = py - cy; rect(sx - 3, sy - 12, 6, 14, col(0)); rect(sx - 2, sy - 11, 4, 12, blink ? col(5) : C.cyan); rect(sx - 1, sy - 15, 2, 3, col(5)); } }
function mirrorHero(A) { const p = G.p; if (!p.alive) return; const ox = p.x, oy = p.y; tpFx(ox, oy, false); p.x = 2 * A.cx - p.x; p.y = 2 * A.cy - p.y; p.dashT = 0; p.vx = p.vy = p.kx = p.ky = 0; unstick(p); p.safe = { x: p.x, y: p.y };
  tpFx(p.x, p.y, true); AU.play('tpGo', .8); flash(C.cyan, .25, true); chroma(.8, true); G.tpTrail = { x1: ox, y1: oy, x2: p.x, y2: p.y, t: 0 }; }
function drawShiftGhost(m, x, y, k, blink, cx, cy) { const p = G.p, A = m.A, gx = 2 * A.cx - p.x - cx, gy = 2 * A.cy - p.y - cy, c = blink ? col(5) : C.cyan;
  ctx.globalAlpha = .5 + .3 * Math.sin(G.time * 10); drawChar(sprite('pgS', ghostRows(PBODY.s.concat(PLEGS.s[0])), C.cyan), gx, gy + 4, Math.cos(p.aim) > 0, false, { noShadow: true }); ctx.globalAlpha = 1;
  ringC(gx, gy - 3, 9, c, 1); const mx = A.cx - cx, my = A.cy - cy; for (let i = 0; i <= 24; i++) { if (i % 2) continue; const f = i / 24; rect(lerp(p.x - cx, gx, f), lerp(p.y - cy - 3, gy - 3, f), 1, 1, C.cyan); } pxSquare(mx, my, 6, G.time, C.cyan); }
const GLYPH_DRAW = [(x, y, r, c) => ringC(x, y, r, c, 1), (x, y, r, c) => { for (let i = 0; i < 3; i++) { const a1 = -Math.PI / 2 + i * 2.094, a2 = a1 + 2.094; pxLine(x + Math.cos(a1) * r, y + Math.sin(a1) * r, x + Math.cos(a2) * r, y + Math.sin(a2) * r, c); } },
  (x, y, r, c) => { const s = r * .8; pxLine(x - s, y - s, x + s, y - s, c); pxLine(x + s, y - s, x + s, y + s, c); pxLine(x + s, y + s, x - s, y + s, c); pxLine(x - s, y + s, x - s, y - s, c); }];
function drawGlyphs(m, x, y, k, blink, cx, cy) { m.pts.forEach(([px, py], i) => { const sx = px - cx, sy = py - cy; ctx.globalAlpha = .35; ringC(sx, sy, 34, C.cyan, 1); ctx.globalAlpha = 1; GLYPH_DRAW[m.sym[i]](sx, sy, 10, blink ? col(5) : C.cyan); GLYPH_DRAW[m.sym[i]](sx, sy, 11, C.cyan); }); }
function tickConveyor(m, dt) { const p = G.p, A = m.A; if (m.t > m.warn) return true; const span = m.vert ? A.x1 - A.x0 : A.y1 - A.y0, per = 2.2, n = Math.floor(m.t / per); m.soon = per - m.t % per < .5 && m.t > .5; m.n = n;
  const along = m.vert ? p.x - A.x0 : p.y - A.y0, si = clamp(Math.floor(along / span * 3), 0, 2), dir = (si + n) % 2 ? -1 : 1;
  if (m.t > .8 && p.alive && p.dashT <= 0) { const v = 58 * dt * dir; if (m.vert) moveBody(p, 0, v); else moveBody(p, v, 0); }
  if (m.t > .8 && p.alive && (m.vert ? (p.y < A.y0 + 22 || p.y > A.y1 - 22) : (p.x < A.x0 + 22 || p.x > A.x1 - 22))) hurtPlayer(1, p.x, p.y, true);
  return false; }
function drawConveyor(m, x, y, k, blink, cx, cy) { const A = m.A, n = m.n || 0, on = m.t > .8, span = m.vert ? A.x1 - A.x0 : A.y1 - A.y0;
  ctx.globalAlpha = on ? .22 : .1; if (m.vert) { rect(A.x0 - cx, A.y0 - cy, A.x1 - A.x0, 22, C.red); rect(A.x0 - cx, A.y1 - 22 - cy, A.x1 - A.x0, 22, C.red); } else { rect(A.x0 - cx, A.y0 - cy, 22, A.y1 - A.y0, C.red); rect(A.x1 - 22 - cx, A.y0 - cy, 22, A.y1 - A.y0, C.red); } ctx.globalAlpha = 1;
  for (let s = 0; s < 3; s++) { const dir = (s + n) % 2 ? -1 : 1, c = m.soon && ((G.time * 10) | 0) % 2 ? col(5) : C.cyan, lo = s * span / 3, hi = (s + 1) * span / 3;
    if (s) { if (m.vert) rect(A.x0 + lo - cx, A.y0 - cy, 1, A.y1 - A.y0, C.cyan); else rect(A.x0 - cx, A.y0 + lo - cy, A.x1 - A.x0, 1, C.cyan); }
    for (let i = 0; i < 9; i++) { const f = ((i / 9 + G.time * .18 * dir) % 1 + 1) % 1, mid = (lo + hi) / 2, px = m.vert ? A.x0 + mid : lerp(A.x0, A.x1, f), py = m.vert ? lerp(A.y0, A.y1, f) : A.y0 + mid, a = m.vert ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? 0 : Math.PI);
      const ax = px - cx, ay = py - cy; ctx.globalAlpha = on ? .8 : .35; pxLine(ax, ay, ax - Math.cos(a - .7) * 5, ay - Math.sin(a - .7) * 5, c); pxLine(ax, ay, ax - Math.cos(a + .7) * 5, ay - Math.sin(a + .7) * 5, c); ctx.globalAlpha = 1; } } }
function orderDeadline(m, k) { return m.t0 + (k + 1) * m.per + .6; }
function tickOrder(m, dt) { const p = G.p, k = m.k; if (k >= m.pts.length) return m.t > m.done + 1.2; const [x, y] = m.pts[k];
  if (p.alive && dist(p.x, p.y, x, y) < 16) { AU.play('soak', 1 + k * .1); ringFx(x, y, 18, C.cyan, .3, 2);
    if (k > 0) { const [x0, y0] = m.pts[k - 1]; mech({ type: 'seg', x: x0, y: y0, x2: x, y2: y, w: 12, warn: .9, owner: m.owner, small: true }); }
    m.k++; if (m.k >= m.pts.length) m.done = m.t; m.base = m.t; return false; }
  if (m.t > orderDeadline(m, k)) { mechFail(m, x, y); ringFx(x, y, 30, C.red, .4, 2); m.k++; if (m.k >= m.pts.length) m.done = m.t; }
  return false; }
function drawOrder(m, x, y, k, blink, cx, cy) { m.pts.forEach(([px, py], i) => { const sx = px - cx, sy = py - cy, cur = i === m.k, done = i < m.k;
    if (done) { ctx.globalAlpha = .3; ringC(sx, sy, 16, C.cyan, 1); ctx.globalAlpha = 1; return; }
    disc(sx, sy, 7, col(0)); ringC(sx, sy, 16, cur ? (((G.time * 8) | 0) % 2 ? col(5) : C.cyan) : '#3b5a66', 1); text(String(i + 1), sx, sy - 2, cur ? col(5) : '#6a8a96', 1, 'center');
    if (cur) { const left = clamp((orderDeadline(m, i) - m.t) / (orderDeadline(m, i) - (i ? orderDeadline(m, i - 1) : 0)), 0, 1); for (let j = 0; j < 24; j++) { if (j / 24 >= left) break; const a = -Math.PI / 2 + j / 24 * 6.283; rect(sx + Math.cos(a) * 20, sy + Math.sin(a) * 20, 1, 1, left < .3 ? C.red : col(5)); } }
    if (i > m.k) { const [qx, qy] = m.pts[i - 1]; ctx.globalAlpha = .25; for (let j = 0; j < 12; j++) { const f = j / 12; rect(lerp(qx, px, f) - cx, lerp(qy, py, f) - cy, 1, 1, C.cyan); } ctx.globalAlpha = 1; } }); }

// ---------------- looks: the boss itself, and what each form does to the whole arena ----------------
const _drawBoss2B3 = drawBoss2; drawBoss2 = function (b, x, y, f) {
  if (f !== 10 && f !== 11) { _drawBoss2B3(b, x, y, f); return; }
  const t = G.time, fl = b.flash > 0, arm = b.armorT > 0, ex = Math.cos(b.eye) * 3, ey = Math.sin(b.eye) * 2;
  if (f === 10) { // INVERSION (drawn in negative; the arena filter turns it into a black sun with a white corona)
    const R = 17 + Math.sin(t * 4) * 1.5; disc(x, y, R + 3, col(5)); disc(x, y, R, fl ? col(2) : '#f4f4f0'); disc(x + ex, y + ey, 6, col(0)); disc(x + ex, y + ey, 3, arm ? col(3) : col(5));
    for (let i = 0; i < 10; i++) { const a = t * (i % 2 ? -1.3 : .9) + i * .628, r1 = R + 4, r2 = R + 12 + Math.sin(t * 3 + i) * 3; pxLine(x + Math.cos(a) * r1, y + Math.sin(a) * r1, x + Math.cos(a) * r2, y + Math.sin(a) * r2, col(0), 2); }
    for (let i = 0; i < 3; i++) { const q = (t * .6 + i / 3) % 1; ctx.globalAlpha = 1 - q; ringC(x, y, R + 6 + q * 26, col(0), 1); } ctx.globalAlpha = 1;
  } else { // LATTICE: a turning wireframe cube around a cold core
    const s = 13, rx = t * .7, ry = t * .9, V = []; for (const X of [-1, 1]) for (const Y of [-1, 1]) for (const Z of [-1, 1]) { let x1 = X, y1 = Y, z1 = Z; const cy1 = Math.cos(ry), sy1 = Math.sin(ry); [x1, z1] = [x1 * cy1 - z1 * sy1, x1 * sy1 + z1 * cy1]; const cx1 = Math.cos(rx), sx1 = Math.sin(rx); [y1, z1] = [y1 * cx1 - z1 * sx1, y1 * sx1 + z1 * cx1]; V.push([x + x1 * s * (1 + z1 * .15), y + y1 * s * (1 + z1 * .15)]); }
    disc(x, y, 8, col(0)); for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) { const d = (i ^ j); if (d === 1 || d === 2 || d === 4) pxLine(V[i][0], V[i][1], V[j][0], V[j][1], fl ? col(5) : (d === 4 ? col(5) : C.cyan)); }
    disc(x + ex * .5, y + ey * .5, 3, arm ? col(4) : C.cyan); rect(x + ex * .5 - 1, y + ey * .5 - 1, 2, 2, col(5));
    if (b.glyph !== undefined) { const gy = y - 34, c = b.glyphT > 0 && ((t * 16) | 0) % 2 ? col(5) : C.cyan; if (b.glyphT > 0) b.glyphT -= FRAME_DT; disc(x, gy, 10, col(0)); GLYPH_DRAW[b.glyph](x, gy, 7, c); GLYPH_DRAW[b.glyph](x, gy, 8, c); }
  }
  if (b.enrageT !== undefined) { const e2 = Math.max(0, b.enrageT); ringC(x, y, 34 + (e2 < 10 ? Math.sin(t * 20) * 2 : 0), e2 < 10 ? C.red : col(3), 1); }
};
// screen-wide looks (world pass): the inversion turns the world negative, the lattice draws a blueprint grid, recomposed shifts hue
const _drawDarkB3 = drawDark; drawDark = function (cx, cy) { _drawDarkB3(cx, cy); const b = G.boss; if (!b || b.dead || b.def.form !== 2 || !QS.fx && b.def.look === undefined) return;
  b.lookT = Math.min(1, (b.lookT || 0) + FRAME_DT / 1.5); const k = b.lookT;
  if (b.def.look === 10) { ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.globalAlpha = k; rect(0, 0, W, H, '#ffffff'); ctx.restore(); }
  else if (b.def.look === 11) { ctx.save(); ctx.globalCompositeOperation = 'color'; ctx.globalAlpha = .45 * k; rect(0, 0, W, H, '#2a6a8a'); ctx.restore(); ctx.globalAlpha = .1 * k;
    for (let x = -((cx % 16) + 16) % 16; x < W; x += 16) rect(x, 0, 1, H, C.cyan); for (let y = -((cy % 16) + 16) % 16; y < H; y += 16) rect(0, y, W, 1, C.cyan);
    ctx.globalAlpha = .18 * k; const sy = (G.time * 60) % (H + 40) - 20; rect(0, sy, W, 2, C.cyan); ctx.globalAlpha = 1; }
  else if (QS.fx) { const hue = PCOLS()[((G.time * .7) | 0) % 3]; ctx.save(); ctx.globalCompositeOperation = 'color'; ctx.globalAlpha = .16 * k; rect(0, 0, W, H, hue); ctx.restore(); }
};

// ---- music: INVERSION is a fast, hammering phrygian; LATTICE a cold, ticking harmonic minor ----
SONGS.b11 = { boss: 1, bpm: 168, root: 146.8, sc: SC.phr, prog: [0, 1, 0, 5], ad: .08, av: .024, hv: .018,
  bass: '0.0.00.00.0.0.1.', arp: '0347034703470357', lead: '7.8.7.4.3.4.7.a.8.7...4.......0.7.8.a.c.a.8.7.8.7.4.3.1.0.........',
  k: 'x..xx...x..xx...', h: 'x.xxx.xxx.xxx.xx', s: '....x.......x..x' };
SONGS.b12 = { boss: 1, bpm: 140, root: 174.6, sc: SC.hmin, prog: [0, 3, 4, 0], ad: .12, av: .02, hv: .014,
  bass: '0...0...0...4...', arp: '0.2.4.6.0.2.4.7.', lead: '4...6...7...6...4...2...0.......4...6...7...9...b...9...7.......',
  k: 'x.......x.......', h: '..x...x...x...x.', s: '....x.......x...' };
