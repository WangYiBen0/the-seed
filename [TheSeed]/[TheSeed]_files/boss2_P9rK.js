// ===== ACHROMA bosses II: a second boss for every floor, and a variant of every boss =====
// variants keep the name, change the title, lose 15% health, bend their bullets and gain one new mechanic
'use strict';
const BOSSES_ALT = [
  { key: 'kiln', look: 5, song: 'b6', name: N4('THE FURNACE BEAST', '熔爐獸', '溶炉獣', '熔炉兽'), hp: 1500, r: 14, roam: { r: 100, spd: 60, w: .6 }, press: 2,
    phases: [['kiln_rain', 'kiln_breath', 'kiln_bellows'], ['kiln_rain', 'kiln_breath', 'kiln_bellows', 'kiln_pools'], ['kiln_crystals', 'kiln_breath', 'kiln_pools', 'kiln_bellows', 'kiln_rain']] },
  { key: 'dynamo', look: 6, song: 'b7', name: N4('THE VOLT EEL', '雷鰻', '雷鰻', '雷鳗'), hp: 4200, r: 12, roam: { r: 100, spd: 110, w: .8 }, press: 1.1,
    phases: [['dyn_stripes', 'dyn_clock', 'dyn_trail', 'dyn_prey', 'dyn_pylons'], ['dyn_bait', 'dyn_stripes', 'dyn_belt', 'dyn_clock', 'dyn_prey', 'dyn_trail'], ['combo', 'combo', 'dyn_restless', 'dyn_bait', 'dyn_belt', 'dyn_pylons']],
    combos: [['dyn_trail', 'dyn_clock'], ['dyn_prey', 'dyn_stripes'], ['dyn_restless', 'dyn_pylons'], ['dyn_bait', 'dyn_prey']] },
  { key: 'chasm', look: 7, song: 'b8', name: N4('THE MAW', '深淵巨口', '深淵の大口', '深渊巨口'), hp: 8800, r: 15, roam: { r: 120, spd: 55, w: .5 }, press: 1.4,
    phases: [['chasm_tiles', 'chasm_snake', 'chasm_tide', 'chasm_seeds'], ['chasm_memory', 'chasm_clones', 'chasm_lantern', 'chasm_face', 'chasm_snake', 'chasm_tide'], ['chasm_memory', 'combo', 'combo', 'chasm_clones', 'chasm_lantern', 'chasm_tiles', 'chasm_seeds']],
    combos: [['chasm_snake', 'chasm_seeds'], ['chasm_face', 'chasm_tide'], ['chasm_clones', 'chasm_seeds'], ['chasm_lantern', 'chasm_snake']] },
  { key: 'codex', look: 8, song: 'b9', name: N4('THE ARCHIVIST', '檔案員', '記録係', '档案员'), hp: 15500, r: 13, roam: { r: 105, spd: 80, w: .7 }, press: 1.2,
    phases: [['codex_quad', 'codex_lines', 'codex_redact', 'codex_sentence'], ['codex_verdict', 'codex_ink', 'codex_pendulum', 'codex_eclipse', 'codex_quad', 'codex_lines'], ['combo', 'combo', 'combo', 'codex_margin', 'codex_verdict', 'codex_pendulum']],
    combos: [['codex_redact', 'codex_lines'], ['codex_sentence', 'codex_ink'], ['codex_verdict', 'codex_redact'], ['codex_pendulum', 'codex_sentence'], ['codex_margin', 'codex_ink']] },
  { key: 'pale', look: 9, song: 'b10', form: 1, name: N4('THE PALE HOST', '蒼白宿主', '蒼白の宿主', '苍白宿主'), hp: 9000, r: 16, roam: { r: 115, spd: 75, w: .6 }, press: 1.1,
    phases: [['pale_bleach', 'pale_orbit', 'pale_starfall', 'pale_hourglass', 'pale_moon'], ['pale_bleach', 'pale_unmake', 'pale_silence', 'pale_lighthouse', 'pale_orbit', 'pale_moon'], ['combo', 'combo', 'pale_unmake', 'pale_lighthouse', 'pale_silence', 'pale_starfall', 'pale_hourglass']],
    combos: [['pale_orbit', 'pale_starfall'], ['pale_bleach', 'pale_hourglass'], ['pale_silence', 'pale_orbit'], ['pale_moon', 'pale_unmake']] },
];
['monolith', 'crown', 'eraser', 'arbiter', 'absence'].forEach((k, i) => { BOSSES[i].key = k; }); ABSENCE_2.key = 'recomposed';
// variant: new title, one new mechanic woven into the later phases
const VARIANTS = {
  monolith: { name: N4('THE PETRIFIED', '石化巨體', '石化巨体', '石化巨体'), add: 'mono_quake' },
  crown: { name: N4('THE PARASITE QUEEN', '寄生女王', '寄生女王', '寄生女王'), add: 'crown_court' },
  eraser: { name: N4('THE INK EYE', '墨瞳', '墨瞳', '墨瞳'), add: 'eraser_smear' },
  arbiter: { name: N4('THE ARBITER', '裁決者', '裁定者', '裁决者'), add: 'arb_appeal' },
  absence: { name: N4('SPECIMEN ZERO', '零號樣本', '零号サンプル', '零号样本'), add: 'abs_eclipse' },
  recomposed: { name: N4('SPECIMEN ZERO', '零號樣本', '零号サンプル', '零号样本'), add: 'rec_prismwall' },
  kiln: { name: N4('THE FURNACE BEAST', '熔爐獸', '溶炉獣', '熔炉兽'), add: 'kiln_erupt' },
  dynamo: { name: N4('THE VOLT EEL', '雷鰻', '雷鰻', '雷鳗'), add: 'dyn_magnet' },
  chasm: { name: N4('THE MAW', '深淵巨口', '深淵の大口', '深渊巨口'), add: 'chasm_maw' },
  codex: { name: N4('THE ARCHIVIST', '檔案員', '記録係', '档案员'), add: 'codex_strike' },
  pale: { name: N4('THE PALE HOST', '蒼白宿主', '蒼白の宿主', '苍白宿主'), add: 'pale_fade' },
};
function variantOf(def) { const v = VARIANTS[def.key]; if (!v) return def;
  const phases = def.phases.map((ph, i) => i === 0 ? ph.slice() : ph.concat(v.add));
  const combos = def.combos ? def.combos.concat([[v.add, def.phases[0][0]]]) : undefined;
  return Object.assign({}, def, { name: v.name, hp: def.hp * .85, v: true, phases, combos, base: def }); }
// which boss waits on this floor (picked once per floor): the original or the alternate, plain or variant
function bossDefFor(fi) { const c = G.bossPick || { alt: false, v: false }; const def = c.alt ? BOSSES_ALT[fi] : BOSSES[fi]; return c.v ? variantOf(def) : def; }
function pickBoss() { G.bossPick = { alt: Math.random() < .5, v: Math.random() < .5 }; }
function reformDef() { return G.bossPick && G.bossPick.v ? variantOf(ABSENCE_2) : ABSENCE_2; }

// ---------------- helpers ----------------
const A0 = b => arenaOf(b);
function aimFan(b, n, sp, s, o = {}) { const a = ang(b.x, b.y, G.p.x, G.p.y); for (let i = 0; i < n; i++) bs(b, b.x, b.y, a + (i - (n - 1) / 2) * sp, s, o); }
function farPt(b, from, minD, m = 40) { for (let k = 0; k < 60; k++) { const q = rndArenaPt(b, m); if (dist(q[0], q[1], from[0], from[1]) > minD) return q; } return rndArenaPt(b, m); }
// Ink Eye dashes need clearance for the whole body, including cover along the route.
function smearPoint(b) {
  let best = [b.x, b.y], longest = 0;
  for (let k = 0; k < 12; k++) { const q = farPt(b, [b.x, b.y], 140, 40), d = dist(b.x, b.y, q[0], q[1]), n = Math.max(1, Math.ceil(d / 3)); let end = [b.x, b.y];
    for (let i = 1; i <= n; i++) { const x = lerp(b.x, q[0], i / n), y = lerp(b.y, q[1], i / n);
      if (collides(x, y, b.r + 1, b.fly) || WORLD.props.some(p => !p.dead && dist(x, y, p.x, p.y) < b.r + p.r + 1)) break;
      end = [x, y]; }
    const reach = dist(b.x, b.y, end[0], end[1]); if (reach > longest) { best = end; longest = reach; } if (reach >= 140) break;
  }
  return best;
}
function rectM(b, x0, y0, x1, y1, o) { return mech(Object.assign({ type: 'rect', x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0, owner: b }, o)); }

const BATK2 = {
  // ======================= THE KILN (floor 1) =======================
  kiln_rain(b, t, dt) { // burning columns march across the arena: step into the ones that already burned
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, .9); const cw = 40, n = Math.ceil((A.x1 - A.x0) / cw), rev = Math.random() < .5; m.end = 0;
      for (let i = 0; i < n; i++) { const k = rev ? n - 1 - i : i, x0 = A.x0 + k * cw, x1 = Math.min(A.x1, x0 + cw), wt = 1.7 + i * .42 - b.phase * .05 * i;
        rectM(b, x0, A.y0, x1, A.y1, { warn: wt, showAt: Math.max(0, wt - 1.1), small: true, tip: 'mt_k_rain' }); m.end = wt + .3; } }
    if (t > .6 && every(t, dt, dp(1.1))) aimFan(b, 3, .22, spd(b, 75), { c: C.orange });
    return t > m.end; },
  kiln_breath(b, t, dt) { // a cone of fire that slowly turns after you: stay outside it
    const m = b.mem, p = G.p; if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, .7); m.a = ang(b.x, b.y, p.x, p.y);
      m.c = mech({ type: 'cone', x: b.x, y: b.y, a: m.a, h: .42, len: 230, warn: 1.3, owner: b, follow: true, tip: 'mt_k_breath', draw: drawBreathTel }); }
    if (t > 1.3 && t < 4.2) { const ta = ang(b.x, b.y, p.x, p.y); m.a += clamp(angDiff(m.a, ta), -.42 * dt, .42 * dt);
      if (every(t, dt, dp(.05))) bs(b, b.x, b.y, m.a + rand(-.36, .36), spd(b, 120) * rand(.8, 1.2), { c: Math.random() < .5 ? C.orange : C.red, life: 1.9, r: 2.5, noVar: true });
      if (p.alive && dist(b.x, b.y, p.x, p.y) < 230 && Math.abs(angDiff(m.a, ang(b.x, b.y, p.x, p.y))) < .4 && !shotBlocked(p.x, p.y)) { m.burn = (m.burn || 0) + dt; if (m.burn > .25) { m.burn = 0; hurtPlayer(1, b.x, b.y); } } else m.burn = 0; }
    m.fa = m.a; return t > 4.4; },
  kiln_bellows(b, t, dt) { // rings of heat erupt outward one band at a time: step into each band right after it erupts
    const m = b.mem; if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, .8); const n = 4 + (b.phase >= 2 ? 1 : 0), bw = 42; m.end = 0;
      for (let i = 0; i < n; i++) { const wt = 1.5 + i * .78; mech({ type: 'annulus', x: b.x, y: b.y, r0: i * bw, r1: (i + 1) * bw, warn: wt, showAt: Math.max(0, wt - 1.2), owner: b, small: i > 0, tip: 'mt_k_ripple',
        onResolve: q => { const nb = dn(10 + i * 3), o = rand(0, 6); for (let j = 0; j < nb; j++) { const a = o + j / nb * 6.283; eshot(q.x + Math.cos(a) * (q.r1 + 6), q.y + Math.sin(a) * (q.r1 + 6), a, spd(b, 70), { c: C.orange, life: 2.4 }); } } }); m.end = wt + .3; } }
    return t > m.end; },
  kiln_pools(b, t, dt) { // magma pools land where you stand, then spread for a while
    const m = b.mem, p = G.p; m.n = m.n || 0; const N = 3 + (b.phase >= 2 ? 1 : 0); if (!m.n && !m.c) { m.c = 1; cue(b, 1.1); }
    if (m.n < N && t > .3 + m.n * .85) { mech({ type: 'pool', x: p.x, y: p.y, r: 22, r1: 38, warn: 1.15, life: 3.4, owner: b, tick: tickPool, draw: drawPool, tip: 'mt_k_pool' }); AU.play('lob'); m.n++; }
    if (every(t, dt, dp(1))) aimFan(b, 2, .3, spd(b, 80), { c: C.red });
    return m.n >= N && t > .3 + N * .85 + 3.6; },
  kiln_crystals(b, t, dt) { // three ember crystals harden the kiln: break them to break its armor
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, .6); AU.play('curse', .9, .5); m.cs = []; m.tip = mech({ type: 'tipc', warn: 9, owner: b, tip: 'mt_k_crystal', draw: () => { } });
      for (let i = 0; i < 3; i++) { const a = i / 3 * 6.283 + rand(0, 1), x = clamp(A.cx + Math.cos(a) * 110, A.x0 + 30, A.x1 - 30), y = clamp(A.cy + Math.sin(a) * 80, A.y0 + 30, A.y1 - 30);
        // Its HP is derived from the boss, but uses the normal-enemy reduction once.
        const c = spawnEnemy('kcrystal', x, y, { room: b.room, instant: true, ink: 2 }); c.hp = c.maxHp = b.maxHp * .035 * (1 + b.phase * .2) * exploreHealthMul('normal') / exploreHealthMul('boss'); c.boss2 = b; m.cs.push(c); burst(x, y, 16, C.orange, 120, .5); } }
    const alive = m.cs.filter(c => !c.dead); if (alive.length) { b.armorT = Math.max(b.armorT, .25); b.crysT = .25; }
    if (every(t, dt, dp(.9))) aimFan(b, 3, .25, spd(b, 70), { c: C.orange });
    if (!alive.length || t > 9) { G.mechs = G.mechs.filter(q => q !== m.tip); if (alive.length) for (const c of alive) { ringShot(c.x, c.y, dn(10), 70, { c: C.orange }); killEnemy(c, {}); } else { AU.play('crate'); shake(.3, true); } return true; } return false; },
  kiln_erupt(b, t, dt) { // VARIANT: geysers erupt twice in a fixed pattern, spitting columns of fire
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, .9); const pts = []; for (let i = 0; i < 5; i++) pts.push(farPt(b, pts.length ? pts[pts.length - 1] : [G.p.x, G.p.y], 70, 36));
      pts.forEach((q, i) => { for (const w of [1.4 + i * .12, 3.2 + i * .12]) mech({ type: 'circle', x: q[0], y: q[1], r: 26, warn: w, showAt: w - 1.1, owner: b, tip: 'mt_k_erupt', onResolve: z => { for (const s of [-1, 1]) eshot(z.x, z.y + s * 28, s * Math.PI / 2, spd(b, 90), { c: C.orange, life: 2.6 }); } }); }); m.end = 3.2 + .6 + .3; }
    return t > m.end; },

  // ======================= THE DYNAMO (floor 2) =======================
  dyn_stripes(b, t, dt) { // electrified stripes flip twice: stand in the dark stripes, then swap
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, 1.2); const sh = 32, ev = [], od = []; for (let y = A.y0, j = 0; y < A.y1; y += sh, j++) (j % 2 ? od : ev).push([A.x0, y, A.x1 - A.x0, Math.min(sh, A.y1 - y)]);
      const first = Math.random() < .5 ? ev : od, second = first === ev ? od : ev;
      const spark = cells => q => { for (const [x, y, w, h] of cells) if (Math.random() < .5) for (const s of [0, Math.PI]) eshot(s ? x + w - 4 : x + 4, y + h / 2, s, spd(b, 90), { c: C.cyan, life: 2 }); };
      mech({ type: 'cells', cells: first, warn: 1.9, owner: b, tip: 'mt_d_stripe', onResolve: spark(second) }); mech({ type: 'cells', cells: second, warn: 3.2, showAt: 1.9, owner: b, tip: 'mt_d_stripe' }); m.end = 3.4;
      if (b.phase >= 1) { mech({ type: 'cells', cells: first, warn: 4.4, showAt: 3.2, owner: b, tip: 'mt_d_stripe' }); m.end = 4.6; } }
    return t > m.end; },
  dyn_pylons(b, t, dt) { // four pylons in the corners: arcs jump between them, first across, then around
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, .8); const i2 = 34, P = [[A.x0 + i2, A.y0 + i2], [A.x1 - i2, A.y0 + i2], [A.x1 - i2, A.y1 - i2], [A.x0 + i2, A.y1 - i2]]; m.P = P;
      const sets = [[[0, 2], [1, 3]], [[0, 1], [2, 3]], [[1, 2], [3, 0]]]; m.end = 0;
      sets.slice(0, 2 + (b.phase >= 1 ? 1 : 0)).forEach((pairs, k) => { const wt = 1.6 + k * 1.25; for (const [a1, a2] of pairs) mech({ type: 'seg', x: P[a1][0], y: P[a1][1], x2: P[a2][0], y2: P[a2][1], w: 18, warn: wt, showAt: Math.max(0, wt - 1.15), owner: b, tip: 'mt_d_pylon',
        onResolve: q => { G.bolts.push({ pts: zig(q.x, q.y, q.x2, q.y2), life: .25, max: .25, c: C.cyan, big: true }); AU.play('zap'); } }); m.end = wt + .4; });
      G.emitters.push(...P.map(q => ({ owner: b, t: 0, life: m.end, c: C.cyan, x: q[0], y: q[1], per: dp(.9), fire(e) { const a = ang(e.x, e.y, G.p.x, G.p.y); eshot(e.x, e.y, a, spd(b, 70), { c: C.cyan }); } }))); }
    return t > m.end; },
  dyn_clock(b, t, dt) { // two hands sweep from the middle of the arena, one slow, one fast, turning opposite ways
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, 1.3); const piv = { x: A.cx, y: A.cy, dead: false }; m.piv = piv; const dir = Math.random() < .5 ? 1 : -1, a0 = rand(0, 6.28);
      mech({ type: 'tipc', warn: 6.3, owner: b, tip: 'mt_d_clock', draw: () => { } });
      G.lasers.push({ owner: piv, a: a0, va: dir * .42, len: 320, w: 7, warn: 1.3, life: 5, c: C.cyan }, { owner: piv, a: a0 + Math.PI, va: -dir * .78, len: 320, w: 5, warn: 1.3, life: 5, c: col(5) }); AU.play('telegraph', .5); }
    if (t > 1.3 && !m.snd) { m.snd = 1; AU.play('laser'); }
    if (t > 1.3 && every(t, dt, dp(.5))) bring(b, m.piv.x, m.piv.y, dn(6), spd(b, 45), { c: C.cyan }, t);
    if (b.dead) m.piv.dead = true; if (t > 6.4) { m.piv.dead = true; return true; } return false; },
  dyn_trail(b, t, dt) { // your own path is marked as you move: keep moving or it detonates under you
    const m = b.mem, p = G.p; if (!m.s) { m.s = 1; cue(b, 1.1); m.k = 0; }
    if (t < 3.2 && every(t, dt, .22)) { mech({ type: 'circle', x: p.x, y: p.y, r: 15, warn: 1.25, owner: b, small: true, tint: C.cyan, tip: 'mt_d_trail' }); }
    if (every(t, dt, dp(.7))) aimFan(b, 3, .28, spd(b, 85), { c: C.cyan });
    return t > 4.6; },
  dyn_bait(b, t, dt) { // a charge orb hunts you: lead it into the dynamo to overload it
    const m = b.mem, p = G.p; if (!m.s) { m.s = 1; cue(b, 1.4); const a = ang(b.x, b.y, p.x, p.y);
      m.m = mech({ type: 'bait', x: b.x + Math.cos(a) * 30, y: b.y + Math.sin(a) * 30, spd: 52 + G.floor * 4, life: 7, warn: 99, owner: b, tick: tickBait, draw: drawBait, tip: 'mt_d_bait' }); b.anchored = true; b.goal = null; }
    if (every(t, dt, dp(1.2))) aimFan(b, 2, .4, spd(b, 75), { c: C.cyan });
    return t > .5 && !G.mechs.includes(m.m); },
  dyn_belt(b, t, dt) { // the floor becomes a current that drags you toward a live strip: walk against it
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, .9); m.side = randi(0, 3); const sw = 30, s = m.side;
      const r = s === 0 ? [A.x0, A.y0, A.x0 + sw, A.y1] : s === 1 ? [A.x1 - sw, A.y0, A.x1, A.y1] : s === 2 ? [A.x0, A.y0, A.x1, A.y0 + sw] : [A.x0, A.y1 - sw, A.x1, A.y1];
      m.m = mech({ type: 'belt', x0: r[0], y0: r[1], x1: r[2], y1: r[3], dir: [Math.PI, 0, -Math.PI / 2, Math.PI / 2][s], force: 46, t0: 1.2, dur: 4, warn: 99, owner: b, tick: tickBelt, draw: drawBelt, tip: 'mt_d_belt' }); }
    if (t > 1.2 && t < 5.2 && every(t, dt, dp(.45))) { const A2 = A0(b), d = m.m.dir, horiz = Math.abs(Math.cos(d)) > .5, x = horiz ? (Math.cos(d) > 0 ? A2.x0 + 8 : A2.x1 - 8) : rand(A2.x0 + 10, A2.x1 - 10), y = horiz ? rand(A2.y0 + 10, A2.y1 - 10) : (Math.sin(d) > 0 ? A2.y0 + 8 : A2.y1 - 8); eshot(x, y, d, spd(b, 70), { c: C.cyan, life: 5 }); }
    return t > 1 && !G.mechs.includes(m.m); },
  dyn_prey(b, t, dt) { // bolts aim ahead of where you are running: change direction
    const m = b.mem, p = G.p, A = A0(b); m.n = m.n || 0; const N = 4 + b.phase; if (!m.n && !m.c) { m.c = 1; cue(b, 1.2); }
    if (m.n < N && t > .2 + m.n * .55) { const px = p.x + p.vx * .9, py = p.y + p.vy * .9, a = ang(b.x, b.y, px, py), pts = rayPath(b.x, b.y, a, 460, 0), e = pts[pts.length - 1];
      mech({ type: 'seg', x: b.x, y: b.y, x2: e[0], y2: e[1], w: 16, warn: .95, owner: b, small: true, tip: 'mt_d_prey', onResolve: q => { G.bolts.push({ pts: zig(q.x, q.y, q.x2, q.y2), life: .2, max: .2, c: C.cyan, big: true }); AU.play('zap', 1.2, .6); } }); m.n++; }
    return m.n >= N && t > .2 + N * .55 + 1.1; },
  dyn_restless(b, t, dt) { // the reverse of stillness: be MOVING when the charge releases
    const m = b.mem, p = G.p; if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, 1.5); AU.play('curse', 1.3, .4); m.m = mech({ type: 'restless', warn: 3.2, dmg: 2, owner: b, draw: drawRestless, tip: 'mt_d_move' }); }
    if (t < 3 && every(t, dt, .45)) { const x = p.x + rand(-60, 60), y = p.y + rand(-50, 50); if (!shotBlocked(x, y) && dist(x, y, p.x, p.y) > 26) mech({ type: 'circle', x, y, r: 16, warn: .9, owner: b, small: true, tint: C.cyan }); }
    return t > 3.6; },
  dyn_magnet(b, t, dt) { // VARIANT: two magnetic poles pull you toward their live cores in turn
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, .8); const horiz = Math.random() < .5; m.poles = horiz ? [[A.x0 + 40, A.cy], [A.x1 - 40, A.cy]] : [[A.cx, A.y0 + 40], [A.cx, A.y1 - 40]];
      m.m = mech({ type: 'magnet', poles: m.poles, r: 24, pull: 40, t0: 1, dur: 5, warn: 99, owner: b, tick: tickMagnet, draw: drawMagnet, tip: 'mt_d_mag' }); }
    if (t > 1 && every(t, dt, dp(.8))) aimFan(b, 3, .3, spd(b, 70), { c: C.cyan });
    return t > 1 && !G.mechs.includes(m.m); },

  // ======================= THE CHASM (floor 3) =======================
  chasm_tiles(b, t, dt) { // the floor collapses in bands from one corner; outrun it, then return to solid ground
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, .7); const sz = 48, cells = [], c0 = [choice([A.x0, A.x1]), choice([A.y0, A.y1])];
      for (let y = A.y0; y < A.y1; y += sz) for (let x = A.x0; x < A.x1; x += sz) cells.push([x, y, Math.min(sz, A.x1 - x), Math.min(sz, A.y1 - y)]);
      cells.sort((a, b2) => dist(a[0] + a[2] / 2, a[1] + a[3] / 2, c0[0], c0[1]) - dist(b2[0] + b2[2] / 2, b2[1] + b2[3] / 2, c0[0], c0[1]));
      const bands = 4, per = Math.ceil(cells.length / bands); m.end = 0;
      for (let k = 0; k < bands; k++) { const part2 = cells.slice(k * per, (k + 1) * per), wt = 1.8 + k * .9; if (!part2.length) continue;
        mech({ type: 'cells', cells: part2, warn: wt, showAt: Math.max(0, wt - 1.3), owner: b, tip: 'mt_c_tiles', onResolve: q => { for (const [x, y, w, h] of q.cells) G.zones.push({ x: x + w / 2, y: y + h / 2, r: Math.min(w, h) / 2 - 2, warn: 0, life: 1.6, kind: 'void' }); } }); m.end = wt + 1.7; } }
    if (every(t, dt, dp(1))) aimFan(b, 3, .3, spd(b, 70), { c: C.violet });
    return t > m.end; },
  chasm_memory(b, t, dt) { // three shapes flash in order, vanish, then strike in that same order
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, 1.4); const opts = shuffle(['in', 'out', 'left', 'right', 'up', 'down']).slice(0, 3); m.end = 0;
      opts.forEach((k, i) => { const show = .2 + i * .8, hide = show + .7, wt = 3.6 + i * 1.1, base = { warn: wt, showAt: show, hideAt: hide, owner: b, tip: 'mt_c_mem', num: i + 1, draw: drawMemNum };
        if (k === 'in') mech(Object.assign({ type: 'circle', x: b.x, y: b.y, r: 80 }, base));
        else if (k === 'out') mech(Object.assign({ type: 'donut', x: b.x, y: b.y, r0: 80 }, base));
        else mech(Object.assign({ type: 'half', x: A.cx, y: A.cy, a: { left: Math.PI, right: 0, up: -Math.PI / 2, down: Math.PI / 2 }[k], A }, base));
        m.end = wt + .3; }); }
    if (t > 3 && every(t, dt, dp(.4))) bs(b, b.x, b.y, t * 2, spd(b, 50), { c: C.violet });
    return t > m.end; },
  chasm_snake(b, t, dt) { // a serpent of bullets hunts you; it turns slowly, so circle it
    const m = b.mem; if (!m.s) { m.s = 1; cue(b, .9); m.m = mech({ type: 'snake', x: b.x, y: b.y, a: ang(b.x, b.y, G.p.x, G.p.y), spd: 82 + b.phase * 6, turn: 1.6, n: 12 + b.phase * 2, trail: [], life: 6, warn: 99, owner: b, tick: tickSnake, draw: drawSnake, tip: 'mt_c_snake' }); }
    return t > .5 && !G.mechs.includes(m.m); },
  chasm_clones(b, t, dt) { // two reflections of you appear across the arena and fire at you
    const m = b.mem; if (!m.s) { m.s = 1; cue(b, 1.2); AU.play('curse', 1.4, .4); m.m = mech({ type: 'clones', life: 5.4, warn: 99, owner: b, tick: tickClones, draw: drawClones, tip: 'mt_c_clone' }); }
    return t > .5 && !G.mechs.includes(m.m); },
  chasm_tide(b, t, dt) { // a river of bullets flows across the arena; ride the gap as it drifts
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, .8); m.vert = Math.random() < .5; m.from = Math.random() < .5 ? 1 : -1; m.c = m.vert ? G.p.x : G.p.y; m.ph = rand(0, 6); m.m = mech({ type: 'tidegap', owner: b, warn: 5.6, draw: drawTide, tip: 'mt_c_tide', mm: m, A }); }
    const lo = m.vert ? A.x0 : A.y0, hi = m.vert ? A.x1 : A.y1, gw = 54 - b.phase * 4; m.gc = clamp(m.c + Math.sin(t * .7 + m.ph) * 70, lo + gw / 2 + 4, hi - gw / 2 - 4);
    if (t > 1 && t < 5.4 && every(t, dt, dp(.16))) { for (let k = 0; k < 2; k++) { let v; do { v = rand(lo + 4, hi - 4); } while (Math.abs(v - m.gc) < gw / 2 + 4);
        const x = m.vert ? v : (m.from > 0 ? A.x0 + 6 : A.x1 - 6), y = m.vert ? (m.from > 0 ? A.y0 + 6 : A.y1 - 6) : v, a = m.vert ? (m.from > 0 ? Math.PI / 2 : -Math.PI / 2) : (m.from > 0 ? 0 : Math.PI); eshot(x, y, a, spd(b, 120), { c: C.violet, life: 4 }); } }
    return t > 5.8; },
  chasm_seeds(b, t, dt) { // seeds take root, then sprout into thorn rings that linger
    const m = b.mem, p = G.p; if (!m.s) { m.s = 1; cue(b, 1); const n = 5 + b.phase, pts = []; for (let i = 0; i < n; i++) { const q = i === 0 ? [p.x, p.y] : farPt(b, pts[i - 1] || [p.x, p.y], 50, 34); pts.push(q); }
      pts.forEach((q, i) => mech({ type: 'sprout', x: q[0], y: q[1], r: 28, warn: 2.2 + i * .18, life: 2.6, owner: b, tick: tickSprout, draw: drawSprout, tip: 'mt_c_seed' })); m.end = 2.2 + n * .18 + 2.8; }
    if (every(t, dt, dp(1.2))) aimFan(b, 2, .35, spd(b, 70), { c: C.violet });
    return t > m.end; },
  chasm_lantern(b, t, dt) { // the dark falls everywhere except under three lanterns
    const m = b.mem, A = A0(b), p = G.p; if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, .6); AU.play('curse', .7, .5); const pts = []; for (let i = 0; i < 3; i++) pts.push(farPt(b, pts[i - 1] || [b.x, b.y], 90, 40));
      m.m = mech({ type: 'holes', holes: pts.map(q => ({ x: q[0], y: q[1], r: 26 })), A, warn: 3.4, owner: b, tip: 'mt_c_lamp', draw: drawLanterns, onResolve: () => { const n = dn(16); bring(b, b.x, b.y, n, spd(b, 60), { c: C.violet }, rand(0, 6)); } }); }
    if (t < 3.2 && every(t, dt, dp(.6))) bs(b, b.x, b.y, t * 1.6, spd(b, 50), { c: col(4) });
    return t > 3.7; },
  chasm_face(b, t, dt) { // the eye opens: face it, or be judged unseeing
    const m = b.mem; if (!m.s) { m.s = 1; cue(b, .9); m.m = mech({ type: 'regard', owner: b, warn: 2.4, dmg: 1, draw: drawRegard, tip: 'mt_c_face' }); AU.play('gaze', 1.2); b.anchored = true; }
    if (t < 2.4 && every(t, dt, dp(.35))) { const a = ang(b.x, b.y, G.p.x, G.p.y) + Math.PI + rand(-1.2, 1.2); bs(b, b.x, b.y, a, spd(b, 60), { c: C.violet }); }
    return t > 2.8; },
  chasm_maw(b, t, dt) { // VARIANT: the maw inhales; a cone of suction drags you while bullets stream out of it
    const m = b.mem, p = G.p; if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, .6); m.a = ang(b.x, b.y, p.x, p.y); mech({ type: 'cone', x: b.x, y: b.y, a: m.a, h: .55, len: 260, warn: 1.2, owner: b, follow: true, tip: 'mt_c_maw', draw: drawBreathTel }); }
    if (t > 1.2 && t < 4.4) { const d = dist(b.x, b.y, p.x, p.y), inC = Math.abs(angDiff(m.a, ang(b.x, b.y, p.x, p.y))) < .55 && d < 260;
      if (inC && p.dashT <= 0 && d > 24) moveBody(p, (b.x - p.x) / d * 58 * dt, (b.y - p.y) / d * 58 * dt); if (inC && d < b.r + 10) hurtPlayer(1, b.x, b.y);
      if (every(t, dt, dp(.08))) bs(b, b.x, b.y, m.a + rand(-.5, .5), spd(b, 95), { c: C.violet, noVar: true }); }
    return t > 4.6; },

  // ======================= THE CODEX (floor 4) =======================
  codex_quad(b, t, dt) { // three quarters of the page are struck; the blank quarter is safe, twice
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, 1.1); const Q = [[A.x0, A.y0, A.cx, A.cy], [A.cx, A.y0, A.x1, A.cy], [A.cx, A.cy, A.x1, A.y1], [A.x0, A.cy, A.cx, A.y1]]; let safe = randi(0, 3); m.end = 0;
      for (let r = 0; r < 2 + (b.phase >= 1 ? 1 : 0); r++) { const wt = 2 + r * 1.6; for (let i = 0; i < 4; i++) if (i !== safe) { const q = Q[i]; rectM(b, q[0], q[1], q[2], q[3], { warn: wt, showAt: r ? wt - 1.5 : 0, tip: 'mt_x_quad' }); } m.end = wt + .3; safe = (safe + (Math.random() < .5 ? 1 : 3)) % 4; } }
    if (every(t, dt, dp(.75))) aimFan(b, 3, .3, spd(b, 80), { c: C.gold });
    return t > m.end; },
  codex_lines(b, t, dt) { // ruled lines are drawn down the page, then struck in the same order: stand between them
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, 1.2); const vert = Math.random() < .5, gap = 44, off = rand(0, gap); m.end = 0; let i = 0;
      for (let v = (vert ? A.x0 : A.y0) + off; v < (vert ? A.x1 : A.y1); v += gap, i++) { const wt = 1.6 + i * .28; mech({ type: 'seg', x: vert ? v : A.x0, y: vert ? A.y0 : v, x2: vert ? v : A.x1, y2: vert ? A.y1 : v, w: 16, warn: wt, showAt: i * .28, owner: b, small: true, tip: 'mt_x_lines' }); m.end = wt + .3; } }
    if (every(t, dt, dp(.9))) aimFan(b, 2, .3, spd(b, 80), { c: C.gold });
    return t > m.end; },
  codex_redact(b, t, dt) { // a black bar locks onto your column and slams down, again and again
    const m = b.mem, p = G.p, A = A0(b); m.n = m.n || 0; const N = 4 + (b.phase >= 2 ? 1 : 0); if (!m.n && !m.c) { m.c = 1; cue(b, 1.3); }
    if (m.n < N && t > .2 + m.n * .9) { const vert = m.n % 2 === 0; mech({ type: 'rect', x: vert ? p.x : A.cx, y: vert ? A.cy : p.y, w: vert ? 26 : A.x1 - A.x0, h: vert ? A.y1 - A.y0 : 26, warn: 1.1, owner: b, tip: 'mt_x_redact', small: true,
        onResolve: q => { shake(.12); for (let k = 0; k < dn(5); k++) { const off = (k - 2) * 30; eshot(q.x + (vert ? 0 : off), q.y + (vert ? off : 0), vert ? (Math.random() < .5 ? 0 : Math.PI) : (Math.random() < .5 ? Math.PI / 2 : -Math.PI / 2), spd(b, 60), { c: C.gold, life: 2.2 }); } } }); m.n++; }
    return m.n >= N && t > .2 + N * .9 + .6; },
  codex_sentence(b, t, dt) { // four numbered seals; they resolve in REVERSE order
    const m = b.mem, p = G.p; if (!m.s) { m.s = 1; cue(b, 1); const pts = [[p.x, p.y]]; for (let i = 1; i < 4; i++) pts.push(farPt(b, pts[i - 1], 60, 36)); m.end = 0;
      pts.forEach((q, i) => { const order = 3 - i, wt = 2.2 + order * .85; mech({ type: 'circle', x: q[0], y: q[1], r: 34, warn: wt, owner: b, num: i + 1, draw: drawMemNum, tip: 'mt_x_order', onResolve: z => bring(b, z.x, z.y, dn(8), spd(b, 70), { c: C.gold }, rand(0, 6)) }); m.end = Math.max(m.end, wt + .3); }); }
    return t > m.end; },
  codex_verdict(b, t, dt) { // a sentence is written on you: reach the codex before it ends
    const m = b.mem; if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, .7); AU.play('curse', 1.1, .5); m.m = mech({ type: 'verdict', warn: 4.2, dmg: 2, near: 46, owner: b, tick: tickVerdict, draw: drawVerdict, tip: 'mt_x_verdict' }); }
    if (every(t, dt, dp(.5))) { const a = t * 1.5; for (let i = 0; i < 3; i++) bs(b, b.x, b.y, a + i * 2.094, spd(b, 55), { c: C.gold }); }
    return t > .5 && !G.mechs.includes(m.m); },
  codex_ink(b, t, dt) { // ink spills along four lanes and stays wet; then four more on the diagonals
    const m = b.mem; if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, .8); const a0 = rand(0, 6.28); m.end = 0;
      for (let r = 0; r < 2; r++) { const wt = 1.3 + r * 1.9; for (let i = 0; i < 4; i++) { const a = a0 + i * 1.5708 + r * .785, pts = rayPath(b.x, b.y, a, 460, 0), e = pts[pts.length - 1];
          mech({ type: 'seg', x: b.x, y: b.y, x2: e[0], y2: e[1], w: 20, warn: wt, showAt: r ? wt - 1.2 : 0, linger: 1.6, owner: b, small: true, tip: 'mt_x_ink', onResolve: q => G.mechs.push({ type: 'wetink', x: q.x, y: q.y, x2: q.x2, y2: q.y2, w: q.w, t: 0, warn: 99, life: q.linger, owner: b, tick: tickWetInk, draw: drawWetInk, tip: 'mt_x_ink' }) }); } m.end = wt + 1.8; } }
    return t > m.end; },
  codex_pendulum(b, t, dt) { // a great blade swings from the top of the page: slip under it between swings
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, .7); m.m = mech({ type: 'pendulum', px: A.cx, py: A.y0 - 20, L: A.y1 - A.y0 - 6, amp: 1.05, per: 2.6 - b.phase * .2, t0: 1.2, dur: 5.4, warn: 99, owner: b, tick: tickPendulum, draw: drawPendulum, tip: 'mt_x_pend' }); }
    return t > 1 && !G.mechs.includes(m.m); },
  codex_eclipse(b, t, dt) { // three pillars rise; only their shadows (away from the codex) are safe
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, .6); AU.play('curse', .9, .5); const pts = []; for (let i = 0; i < 3; i++) { let q; for (let k = 0; k < 60; k++) { q = rndArenaPt(b, 50); if (dist(q[0], q[1], b.x, b.y) > 70 && pts.every(o => dist(o[0], o[1], q[0], q[1]) > 70)) break; } pts.push(q); }
      const holes = pts.map(q => { const a = ang(b.x, b.y, q[0], q[1]); return { x: q[0] + Math.cos(a) * 10, y: q[1] + Math.sin(a) * 10, x2: q[0] + Math.cos(a) * 80, y2: q[1] + Math.sin(a) * 80, w: 26 }; });
      m.m = mech({ type: 'holes', holes, pillars: pts, A, warn: 3.6, owner: b, tip: 'mt_x_eclipse', draw: drawEclipse, onResolve: () => { flash(col(5), .5, true); bring(b, b.x, b.y, dn(18), spd(b, 70), { c: C.gold }, rand(0, 6)); } }); }
    return t > 3.9; },
  codex_margin(b, t, dt) { // first the margins are struck, then the center of the page
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, 1); const mg = 46;
      for (const r of [[A.x0, A.y0, A.x1, A.y0 + mg], [A.x0, A.y1 - mg, A.x1, A.y1], [A.x0, A.y0 + mg, A.x0 + mg, A.y1 - mg], [A.x1 - mg, A.y0 + mg, A.x1, A.y1 - mg]]) rectM(b, r[0], r[1], r[2], r[3], { warn: 1.8, tip: 'mt_x_margin' });
      rectM(b, A.x0 + mg, A.y0 + mg, A.x1 - mg, A.y1 - mg, { warn: 3.4, showAt: 1.8, tip: 'mt_x_margin', onResolve: q => { for (let i = 0; i < dn(12); i++) eshot(q.x, q.y, i / dn(12) * 6.283, spd(b, 50), { c: C.gold }); } }); }
    return t > 3.7; },
  codex_strike(b, t, dt) { // VARIANT: strike-through: diagonal lines lock onto you and cross the page
    const m = b.mem, p = G.p, A = A0(b); m.n = m.n || 0; if (!m.n && !m.c) { m.c = 1; cue(b, 1.4); }
    if (m.n < 4 && t > .2 + m.n * .75) { const d = m.n % 2 ? 1 : -1, L4 = 400, x1 = p.x - L4, y1 = p.y - d * L4, x2 = p.x + L4, y2 = p.y + d * L4;
      mech({ type: 'seg', x: x1, y: y1, x2, y2, w: 20, warn: 1.2, owner: b, small: true, A, clipA: true, tip: 'mt_x_strike', onResolve: () => AU.play('slash', .6) }); m.n++; }
    return m.n >= 4 && t > .2 + 4 * .75 + .8; },

  // ======================= THE PALE (floor 5) =======================
  pale_bleach(b, t, dt) { // pale stains spread out from three points; be clear of them when they set
    const m = b.mem, p = G.p; if (!m.s) { m.s = 1; cue(b, .9); const pts = [[p.x, p.y]]; for (let i = 1; i < 3; i++) pts.push(farPt(b, pts[i - 1], 80, 40));
      pts.forEach((q, i) => mech({ type: 'circle', x: q[0], y: q[1], r: 60 + b.phase * 6, warn: 2.6 + i * .5, owner: b, tint: col(5), tip: 'mt_p_bleach', onResolve: z => { const n = dn(10); for (let k = 0; k < n; k++) { const a = k / n * 6.283; eshot(z.x + Math.cos(a) * (z.r + 6), z.y + Math.sin(a) * (z.r + 6), a, spd(b, 60), { c: col(4) }); } } })); m.end = 2.6 + 1 + .3; }
    if (every(t, dt, dp(.8))) aimFan(b, 3, .26, spd(b, 80), { c: col(4) });
    return t > m.end; },
  pale_orbit(b, t, dt) { // pale spheres orbit the herald on a widening path
    const m = b.mem; if (!m.s) { m.s = 1; cue(b, 1.1); m.m = mech({ type: 'orbit', n: 3 + (b.phase >= 1 ? 1 : 0), r0: 26, r1: 150, life: 6, va: (Math.random() < .5 ? 1 : -1) * 1.1, warn: 99, owner: b, tick: tickOrbit, draw: drawOrbit, tip: 'mt_p_orbit' }); }
    if (t > 1 && every(t, dt, dp(.9))) aimFan(b, 2, .3, spd(b, 70), { c: col(4) });
    return t > 1 && !G.mechs.includes(m.m); },
  pale_starfall(b, t, dt) { // vertical starlines fall one after another
    const m = b.mem, A = A0(b), p = G.p; if (!m.s) { m.s = 1; cue(b, 1.3); const n = 7 + b.phase; m.end = 0; let x = p.x;
      for (let i = 0; i < n; i++) { const wt = 1.3 + i * .32; x = i === 0 ? p.x : clamp(x + (Math.random() < .5 ? -1 : 1) * rand(40, 90), A.x0 + 10, A.x1 - 10);
        mech({ type: 'seg', x, y: A.y0, x2: x, y2: A.y1, w: 18, warn: wt, showAt: Math.max(0, wt - .9), owner: b, small: true, tip: 'mt_p_star', onResolve: q => { for (const s of [-1, 1]) eshot(q.x + s * 12, A.y0 + 6, Math.PI / 2 + s * .25, spd(b, 70), { c: col(5), life: 3 }); } }); m.end = wt + .3; } }
    return t > m.end; },
  pale_hourglass(b, t, dt) { // the sand pours into one half, then the other, faster each time
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, .9); const vert = Math.random() < .5; let side = Math.random() < .5 ? 0 : 1; m.end = 0; let wt = 0;
      [2, 1.45, 1.1].forEach((w, i) => { wt += w; const r = vert ? (side ? [A.cx, A.y0, A.x1, A.y1] : [A.x0, A.y0, A.cx, A.y1]) : (side ? [A.x0, A.cy, A.x1, A.y1] : [A.x0, A.y0, A.x1, A.cy]);
        rectM(b, r[0], r[1], r[2], r[3], { warn: wt, showAt: wt - w, tip: 'mt_p_sand' }); side = 1 - side; m.end = wt + .3; }); }
    if (every(t, dt, dp(.5))) bs(b, b.x, b.y, t * 2.2, spd(b, 55), { c: col(4) });
    return t > m.end; },
  pale_moon(b, t, dt) { // a pale moon falls: be as far from it as you can
    const m = b.mem, p = G.p; if (!m.s) { m.s = 1; cue(b, .5); AU.play('curse', .6, .5); const q = [clamp(p.x, A0(b).x0 + 40, A0(b).x1 - 40), clamp(p.y, A0(b).y0 + 40, A0(b).y1 - 40)];
      mech({ type: 'circle', x: q[0], y: q[1], r: 110, warn: 3, owner: b, tip: 'mt_p_moon', onResolve: z => { flash(col(5), .6, true); shake(.6, true); AU.play('explode'); const n = dn(20); for (let k = 0; k < n; k++) { const a = k / n * 6.283; eshot(z.x + Math.cos(a) * (z.r + 4), z.y + Math.sin(a) * (z.r + 4), a, spd(b, 55), { c: col(5) }); } } });
      mech({ type: 'annulus', x: q[0], y: q[1], r0: 110, r1: 150, warn: 3, owner: b, small: true }); }
    return t > 3.4; },
  pale_unmake(b, t, dt) { // squares of erasure bloom outward from the herald, first in a cross, then diagonally
    const m = b.mem; if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, .8); m.end = 0; const sz = 34;
      for (let r = 0; r < 2; r++) for (let k = 1; k <= 5; k++) { const wt = 1.3 + r * 1.6 + k * .2; for (let i = 0; i < 4; i++) { const a = i * 1.5708 + r * .785, d = k * sz * (r ? 1.1 : 1), x = b.x + Math.cos(a) * d, y = b.y + Math.sin(a) * d;
          mech({ type: 'rect', x, y, w: sz, h: sz, warn: wt, showAt: r ? wt - 1.2 : wt - 1.25, owner: b, small: true, tip: 'mt_p_unmake' }); } m.end = Math.max(m.end, wt + .3); } }
    if (every(t, dt, dp(.7))) aimFan(b, 2, .5, spd(b, 70), { c: col(4) });
    return t > m.end; },
  pale_silence(b, t, dt) { // the light goes out; only a small circle around you remains
    const m = b.mem; if (!m.s) { m.s = 1; cue(b, .5); AU.play('curse', .6, .6); m.m = mech({ type: 'dark', life: 5.4, warn: 99, owner: b, tick: tickDark, draw: drawDarkMark, tip: 'mt_p_dark' }); }
    if (t > .8 && t < 5 && every(t, dt, dp(.35))) { const a = ang(b.x, b.y, G.p.x, G.p.y) + rand(-.6, .6); bs(b, b.x, b.y, a, spd(b, 62), { c: col(5) }); }
    return t > .5 && !G.mechs.includes(m.m); },
  pale_lighthouse(b, t, dt) { // a wedge of light turns around the herald; be inside it each time it flares
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, 1); m.a = ang(b.x, b.y, G.p.x, G.p.y); m.va = (Math.random() < .5 ? 1 : -1) * .55; m.end = 0;
      for (let k = 0; k < 3; k++) { const wt = 2.2 + k * 1.3, hole = { sector: true, x: b.x, y: b.y, h: .6, len: 600, mm: m };
        mech({ type: 'holes', holes: [hole], A, warn: wt, showAt: k ? wt - 1.3 : 0, owner: b, tip: 'mt_p_wedge', onResolve: () => { AU.play('laser', 1.4, .5); } }); m.end = wt + .3; } }
    m.a += m.va * dt; return t > m.end; },
  pale_fade(b, t, dt) { // VARIANT: the herald fades from sight; only a faint ripple shows where it is
    const m = b.mem; if (!m.s) { m.s = 1; cue(b, .6); b.fadeT = 4.6; mech({ type: 'tipc', warn: 4.6, owner: b, tip: 'mt_p_fade', draw: () => { } }); }
    if (t > .5 && t < 4.5 && every(t, dt, dp(.45))) aimFan(b, 3, .22, spd(b, 85), { c: col(5) });
    return t > 4.8; },

  // ======================= variants of the original bosses =======================
  mono_quake(b, t, dt) { // the monolith's slam splits the floor along fault lines that rotate as they crack
    const m = b.mem; if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, .6); const a0 = rand(0, 6.28); m.end = 0;
      for (let r = 0; r < 3; r++) { const wt = 1.4 + r * 1.05; for (let i = 0; i < 3; i++) { const a = a0 + i * 2.094 + r * .52, pts = rayPath(b.x, b.y, a, 460, 0), e = pts[pts.length - 1];
          mech({ type: 'seg', x: b.x, y: b.y, x2: e[0], y2: e[1], w: 18, warn: wt, showAt: Math.max(0, wt - 1.05), owner: b, small: true, tip: 'mt_m_quake', onResolve: () => { AU.play('slam', 1.3, .4); shake(.15); } }); } m.end = wt + .3; } }
    return t > m.end; },
  crown_court(b, t, dt) { // two bullet walls close in from opposite sides; each has its own gap
    const m = b.mem, A = A0(b), p = G.p; if (!m.s) { m.s = 1; cue(b, 1.2); m.n = 0; m.vert = Math.random() < .5; }
    const N = 3 + (b.phase >= 2 ? 1 : 0);
    if (m.n < N && t > .4 + m.n * 1.5) { const lo = m.vert ? A.x0 : A.y0, hi = m.vert ? A.x1 : A.y1, g1 = clamp((m.vert ? p.x : p.y) + rand(-60, 60), lo + 40, hi - 40), g2 = clamp(g1 + (Math.random() < .5 ? -1 : 1) * rand(50, 90), lo + 40, hi - 40), gw = 44;
      for (const [side, g] of [[0, g1], [1, g2]]) mech({ type: 'mark', x: m.vert ? g : (side ? A.x1 - 6 : A.x0 + 6), y: m.vert ? (side ? A.y1 - 6 : A.y0 + 6) : g, w: gw, warn: .6, owner: b, tip: 'mt_mark', draw: drawCourtMark, vert: m.vert,
        onResolve: () => { for (let v = lo + 6; v < hi; v += 18) if (Math.abs(v - g) > gw / 2) { const x = m.vert ? v : (side ? A.x1 - 8 : A.x0 + 8), y = m.vert ? (side ? A.y1 - 8 : A.y0 + 8) : v; eshot(x, y, m.vert ? (side ? -Math.PI / 2 : Math.PI / 2) : (side ? Math.PI : 0), spd(b, 75), { life: 7, c: C.gold }); } AU.play('ebullet', .8); } });
      m.n++; }
    return m.n >= N && t > .4 + N * 1.5 + 2.5; },
  eraser_smear(b, t, dt) { // the eraser drags itself across the page, leaving a smear that stays wet
    const m = b.mem; if (!m.s) { m.s = 1; cue(b, .8); m.k = 0; m.legs = 2 + (b.phase >= 2 ? 1 : 0); m.next = 0; b.anchored = true; b.goal = null; }
    if (m.k < m.legs && t > m.next && !m.pending && !m.go) { const tgt = smearPoint(b); m.pending = true;
      mech({ type: 'seg', x: b.x, y: b.y, x2: tgt[0], y2: tgt[1], w: 22, warn: 1, owner: b, small: true, tip: 'mt_e_smear', onResolve: q => {
        m.pending = false; m.go = [q.x2, q.y2]; m.goT = 0; m.stall = 0; m.remaining = dist(b.x, b.y, q.x2, q.y2);
        G.mechs.push({ type: 'wetink', x: q.x, y: q.y, x2: q.x2, y2: q.y2, w: q.w, t: 0, warn: 99, life: 3.6, owner: b, tick: tickWetInk, draw: drawWetInk, tip: 'mt_e_smear' });
      } }); m.k++; m.next = t + 1.9; }
    if (m.go) { const remaining = dist(b.x, b.y, m.go[0], m.go[1]); m.goT += dt;
      m.stall = remaining < m.remaining - .25 ? 0 : m.stall + dt; m.remaining = remaining;
      // End a blocked leg instead of waiting forever for an unreachable destination.
      if (arrive(b, m.go[0], m.go[1], 300) || m.stall >= .45 || m.goT >= 2.5) {
        m.go = null; b.goal = null; b.bvx = b.bvy = 0; bring(b, b.x, b.y, dn(10), spd(b, 70), { c: col(4) }, rand(0, 6)); }
    }
    return m.k >= m.legs && t > m.next + .2 && !m.pending && !m.go; },
  arb_appeal(b, t, dt) { // an appeal: three towers, but only the gold one may be stood in
    const m = b.mem, p = G.p; if (!m.s) { m.s = 1; cue(b, 1.2); const pts = []; for (let i = 0; i < 3; i++) { let q; for (let k = 0; k < 60; k++) { q = rndArenaPt(b, 40); const d = dist(q[0], q[1], p.x, p.y); if (d > 40 && d < 150 && pts.every(o => dist(o[0], o[1], q[0], q[1]) > 70)) break; } pts.push(q); }
      const good = randi(0, 2); pts.forEach((q, i) => { if (i === good) mech({ type: 'tower', x: q[0], y: q[1], r: 16, warn: 2.8, owner: b, tip: 'mt_a_appeal' }); else mech({ type: 'circle', x: q[0], y: q[1], r: 22, warn: 2.8, owner: b, small: true, tip: 'mt_a_appeal' }); }); }
    if (every(t, dt, dp(.6))) aimFan(b, 3, .25, spd(b, 85), { c: C.gold });
    return t > 3.1; },
  abs_eclipse(b, t, dt) { // a half-plane of darkness turns around the arena center, striking three times
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, .9); let a = rand(0, 6.28); const dir = Math.random() < .5 ? 1 : -1; m.end = 0;
      for (let k = 0; k < 3; k++) { const wt = 1.8 + k * 1.15; mech({ type: 'half', x: A.cx, y: A.cy, a, warn: wt, showAt: k ? wt - 1.15 : 0, owner: b, A, tip: 'mt_b_eclipse' }); a += dir * 1.5708; m.end = wt + .3; } }
    if (every(t, dt, .5)) { for (let i = 0; i < 8; i++) { const pc = i % 2 ? C.red : C.cyan; bs(b, b.x, b.y, i / 8 * 6.283 + t * .5, spd(b, 55), { c: pc, pol: pc }); } }
    return t > m.end; },
  rec_prismwall(b, t, dt) { // three-colour walls sweep across: pass through the band that matches your colour
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, 1.3); G.p.pol = choice(PCOLS()); m.n = 0; mech({ type: 'tipc', warn: 8, owner: b, tip: 'mt_r_wall', draw: () => { } }); }
    if (m.n < 3 && t > .5 + m.n * 1.7) { const vert = m.n % 2 === 0, from = Math.random() < .5 ? 1 : -1, cs = shuffle(PCOLS().slice()), lo = vert ? A.y0 : A.x0, hi = vert ? A.y1 : A.x1, bw = (hi - lo) / 3;
      for (let v = lo + 6; v < hi; v += 13) { const c = cs[Math.min(2, Math.floor((v - lo) / bw))], x = vert ? (from > 0 ? A.x0 + 6 : A.x1 - 6) : v, y = vert ? v : (from > 0 ? A.y0 + 6 : A.y1 - 6);
        eshot(x, y, vert ? (from > 0 ? 0 : Math.PI) : (from > 0 ? Math.PI / 2 : -Math.PI / 2), spd(b, 85), { c, pol: c, life: 6 }); } AU.play('ebullet', .7); m.n++; }
    if (t > .5 + 3 * 1.7 + 2.5) { G.p.pol = null; return true; } return false; },
};
Object.assign(BATK, BATK2);

// ---------------- custom mechanic pieces ----------------
function drawBreathTel(m, x, y, k, blink) { if (m.t >= m.warn) return; for (let i = 0; i < 3; i++) { const q = (G.time * 1.5 + i / 3) % 1, r = 20 + q * 200; ctx.globalAlpha = 1 - q; pxLine(x + Math.cos(m.a - m.h) * r, y + Math.sin(m.a - m.h) * r, x + Math.cos(m.a + m.h) * r, y + Math.sin(m.a + m.h) * r, C.orange); } ctx.globalAlpha = 1; }
function tickPool(m, dt) { const p = G.p; if (m.t < m.warn) return false; const k = clamp((m.t - m.warn) / m.life, 0, 1); m.rr = lerp(m.r, m.r1, Math.min(1, k * 2));
  if (!m.hit0) { m.hit0 = 1; AU.play('explode', 1.4, .4); if (p.alive && dist(p.x, p.y, m.x, m.y) < m.r) hurtPlayer(1, m.x, m.y, true); }
  if (p.alive && dist(p.x, p.y, m.x, m.y) < m.rr + p.r - 3) hurtPlayer(1, m.x, m.y);
  m.bt = (m.bt || .4) - dt; if (m.bt <= 0) { m.bt = dp(.7); const a = rand(0, 6.28); eshot(m.x + Math.cos(a) * (m.rr + 4), m.y + Math.sin(a) * (m.rr + 4), a, 45, { c: C.orange, life: 1.6 }); }
  return m.t > m.warn + m.life; }
function drawPool(m, x, y, k, blink) { if (m.t < m.warn) { ringC(x, y, m.r, blink ? col(5) : C.orange, 1); ringC(x, y, Math.max(1, m.r * (1 - k)), C.red, 1); ctx.globalAlpha = .15; disc(x, y, m.r, C.orange); ctx.globalAlpha = 1; return; }
  const R = m.rr || m.r, fade = Math.min(1, (m.warn + m.life - m.t) * 2); ctx.globalAlpha = .55 * fade; disc(x, y, R, C.red); ctx.globalAlpha = .8 * fade; disc(x, y, R * .7, C.orange); ctx.globalAlpha = fade;
  for (let i = 0; i < 4; i++) { const a = G.time * 2 + i * 1.6 + m.x, r = R * .5 * Math.abs(Math.sin(G.time * 3 + i)); rect(x + Math.cos(a) * r, y + Math.sin(a) * r, 2, 2, C.gold); } ringC(x, y, R, C.gold, 1); ctx.globalAlpha = 1; }
function tickBait(m, dt) { const p = G.p, b = m.owner, a = ang(m.x, m.y, p.x, p.y); m.life -= dt; m.x += Math.cos(a) * m.spd * dt; m.y += Math.sin(a) * m.spd * dt;
  if (Math.random() < .4) part({ x: m.x + rand(-5, 5), y: m.y + rand(-5, 5), vx: 0, vy: -20, life: .3, max: .3, c: C.cyan, s: 1 });
  if (dist(m.x, m.y, b.x, b.y) < b.r + 8 && m.t > .8) { AU.play('explode'); AU.play('fusionHit', 1.3, .6); flash(C.cyan, .5, true); shake(.5, true); ringFx(b.x, b.y, 50, C.cyan, .5, 4); hitEnemy(b, b.maxHp * .04, { proc: 0, knock: 0, color: C.cyan }); b.atk = null; b.goal = null; b.anchored = false; b.idle = 2.2; return true; }
  if (p.alive && dist(m.x, m.y, p.x, p.y) < 8 + p.r) { AU.play('explode'); hurtPlayer(1, m.x, m.y, true); ringFx(m.x, m.y, 30, C.cyan, .4, 3); return true; }
  if (m.life <= 0) { AU.play('explode', 1, .6); ringFx(m.x, m.y, 40, C.cyan, .4, 3); if (p.alive && dist(m.x, m.y, p.x, p.y) < 40) hurtPlayer(1, m.x, m.y, true); bring(b, m.x, m.y, dn(12), 60, { c: C.cyan }, rand(0, 6)); return true; }
  return false; }
function drawBait(m, x, y) { const pu = 6 + Math.sin(G.time * 10) * 1.5, b = m.owner; disc(x, y, pu + 2, col(0)); disc(x, y, pu, C.cyan); disc(x, y, pu * .45, col(5)); if (m.life < 1.2 && ((G.time * 12) | 0) % 2) ringC(x, y, 40, C.red, 1);
  const bx = b.x - (m.x - x), by = b.y - (m.y - y); ctx.globalAlpha = .35; for (let i = 1; i < 10; i++) { const q = i / 10; rect(lerp(x, bx, q), lerp(y, by, q), 1, 1, C.cyan); } ctx.globalAlpha = 1; }
function tickBelt(m, dt) { const p = G.p; if (m.t < m.t0) return false;
  if (m.t < m.t0 + m.dur) { if (p.alive && p.dashT <= 0) moveBody(p, Math.cos(m.dir) * m.force * dt, Math.sin(m.dir) * m.force * dt);
    if (p.alive && p.x > m.x0 && p.x < m.x1 && p.y > m.y0 && p.y < m.y1) hurtPlayer(1, p.x, p.y, true); return false; } return true; }
function drawBelt(m, x, y, k, blink, cx, cy) { const on = m.t >= m.t0, c = on ? C.cyan : (blink ? col(5) : C.cyan);
  ctx.globalAlpha = on ? .45 : .15 + .15 * Math.min(1, m.t / m.t0); rect(m.x0 - cx, m.y0 - cy, m.x1 - m.x0, m.y1 - m.y0, c); ctx.globalAlpha = 1;
  const A = arenaOf(m.owner); for (let i = 0; i < 14; i++) { const ox = A.x0 + ((i * 53) % (A.x1 - A.x0)), oy = A.y0 + ((i * 37) % (A.y1 - A.y0)), s = ((G.time * (on ? 50 : 15)) % 40), px2 = ox + Math.cos(m.dir) * s - cx, py2 = oy + Math.sin(m.dir) * s - cy;
    pxLine(px2, py2, px2 - Math.cos(m.dir + .6) * 4, py2 - Math.sin(m.dir + .6) * 4, col(4)); pxLine(px2, py2, px2 - Math.cos(m.dir - .6) * 4, py2 - Math.sin(m.dir - .6) * 4, col(4)); } }
function drawRestless(m, x, y, k, blink, cx, cy) { const p = G.p, px = p.x - cx, py = p.y - cy - 3, left = Math.max(0, m.warn - m.t), c = left < .7 && blink ? col(5) : C.cyan;
  ringC(px, py, 9 + left * 6, c, 1); for (let i = 0; i < 3; i++) { const a = G.time * 8 + i * 2.09; pxLine(px + Math.cos(a) * 12, py + Math.sin(a) * 12, px + Math.cos(a + .5) * 12, py + Math.sin(a + .5) * 12, c); } }
function tickMagnet(m, dt) { const p = G.p; if (m.t < m.t0) return false; if (m.t > m.t0 + m.dur) return true;
  const i = Math.floor((m.t - m.t0) / 1.25) % 2, q = m.poles[i]; m.act = i; const d = dist(p.x, p.y, q[0], q[1]);
  if (p.alive && p.dashT <= 0 && d > 2) moveBody(p, (q[0] - p.x) / d * m.pull * dt, (q[1] - p.y) / d * m.pull * dt);
  if (p.alive && d < m.r + p.r - 2) hurtPlayer(1, q[0], q[1], true); return false; }
function drawMagnet(m, x, y, k, blink, cx, cy) { m.poles.forEach((q, i) => { const on = m.t >= m.t0 && m.act === i, qx = q[0] - cx, qy = q[1] - cy; ctx.globalAlpha = on ? .35 : .12; disc(qx, qy, m.r, C.cyan); ctx.globalAlpha = 1; ringC(qx, qy, m.r, on ? col(5) : C.cyan, on ? 2 : 1);
  if (on) for (let j = 0; j < 8; j++) { const a = j * .785 + G.time, r = m.r + 10 + ((G.time * 40 + j * 7) % 40); rect(qx + Math.cos(a) * r, qy + Math.sin(a) * r, 1, 1, C.cyan); } }); }
function drawMemNum(m, x, y, k, blink) { if (m.type === 'half') { const A = m.A, d = 60; x = A.cx - (m.A.cx - x) + Math.cos(m.a) * d; y = A.cy - (m.A.cy - y) + Math.sin(m.a) * d; } else if (m.type === 'donut') { y -= m.r0 + 14; }
  disc(x, y, 6, col(0)); ringC(x, y, 6, blink ? col(5) : C.gold, 1); text(String(m.num), x - 1, y - 2, C.gold); }
function tickSnake(m, dt) { const p = G.p, ta = ang(m.x, m.y, p.x, p.y); m.a += clamp(angDiff(m.a, ta), -m.turn * dt, m.turn * dt); const A = arenaOf(m.owner);
  m.x = clamp(m.x + Math.cos(m.a) * m.spd * dt, A.x0 + 6, A.x1 - 6); m.y = clamp(m.y + Math.sin(m.a) * m.spd * dt, A.y0 + 6, A.y1 - 6); m.trail.unshift([m.x, m.y]); if (m.trail.length > m.n * 5) m.trail.length = m.n * 5;
  if (p.alive) for (let i = 0; i < m.trail.length; i += 5) { const q = m.trail[i]; if (dist(q[0], q[1], p.x, p.y) < (i ? 4 : 6) + p.r - 1) { hurtPlayer(1, q[0], q[1]); break; } }
  if (m.t > m.life) { for (let i = 0; i < m.trail.length; i += 10) { const q = m.trail[i]; eshot(q[0], q[1], rand(0, 6.28), 40, { c: C.violet, life: 1.5 }); } ringFx(m.x, m.y, 20, C.violet, .3, 2); return true; } return false; }
function drawSnake(m, x, y, k, blink, cx, cy) { for (let i = m.trail.length - 1; i >= 0; i -= 5) { const q = m.trail[i], qx = q[0] - cx, qy = q[1] - cy, r = i ? 4 : 6; disc(qx, qy, r + 1, col(0)); disc(qx, qy, r, i ? C.violet : col(5)); if (!i) { rect(qx - 2, qy - 2, 1, 1, C.red); rect(qx + 1, qy - 2, 1, 1, C.red); } } }
function tickClones(m, dt) { const p = G.p, A = arenaOf(m.owner); m.cl = [[2 * A.cx - p.x, p.y], [p.x, 2 * A.cy - p.y]].map(q => [clamp(q[0], A.x0 + 10, A.x1 - 10), clamp(q[1], A.y0 + 10, A.y1 - 10)]);
  if (m.t > .9) { m.ft = (m.ft || 0) - dt; if (m.ft <= 0) { m.ft = dp(.85); for (const q of m.cl) if (dist(q[0], q[1], p.x, p.y) > 40) { const a = ang(q[0], q[1], p.x, p.y); for (const s of [-.15, .15]) eshot(q[0], q[1], a + s, spd(m.owner, 85), { c: C.violet }); } AU.play('ebullet', .9); } }
  if (m.t > m.life) { for (const q of m.cl) burst(q[0], q[1], 12, C.violet, 80, .4); return true; } return false; }
function drawClones(m, x, y, k, blink, cx, cy) { if (!m.cl) return; const s = pSprite('f', 0); ctx.globalAlpha = Math.min(1, m.t * 2) * .7; for (const q of m.cl) { drawChar(sprite('pclone', ghostRows(PBODY.f.concat(PLEGS.f[0])), C.violet), q[0] - cx, q[1] + 4 - cy, false, false, { noShadow: true }); } ctx.globalAlpha = 1; }
function drawTide(m, x, y, k, blink, cx, cy) { const mm = m.mm, A = m.A, gw = 54 - m.owner.phase * 4; if (mm.gc === undefined) return; ctx.globalAlpha = .5;
  for (const e of [mm.gc - gw / 2, mm.gc + gw / 2]) for (let i = 0; i < 40; i++) { const q = i / 40; if ((i + ((G.time * 10) | 0)) % 3) continue; if (mm.vert) rect(e - cx, lerp(A.y0, A.y1, q) - cy, 1, 2, col(5)); else rect(lerp(A.x0, A.x1, q) - cx, e - cy, 2, 1, col(5)); } ctx.globalAlpha = 1; }
function tickSprout(m, dt) { const p = G.p; if (m.t < m.warn) return false;
  if (!m.pop) { m.pop = 1; AU.play('resolve', 1.3, .5); if (p.alive && dist(p.x, p.y, m.x, m.y) < m.r) mechFail(m, m.x, m.y); const n = dn(8), o = rand(0, 6); for (let k = 0; k < n; k++) { const a = o + k / n * 6.283; eshot(m.x + Math.cos(a) * (m.r + 6), m.y + Math.sin(a) * (m.r + 6), a, 55, { c: C.violet, life: 2 }); } }
  if (p.alive && dist(p.x, p.y, m.x, m.y) < m.r - 4 + p.r) hurtPlayer(1, m.x, m.y); return m.t > m.warn + m.life; }
function drawSprout(m, x, y, k, blink) { if (m.t < m.warn) { const q = k; ringC(x, y, m.r, blink ? col(5) : C.violet, 1); ctx.globalAlpha = .18; disc(x, y, m.r * q, C.violet); ctx.globalAlpha = 1; rect(x - 1, y - 2 - q * 4, 2, 2 + q * 4, C.lime); return; }
  for (let i = 0; i < 10; i++) { const a = i * .628 + m.x, r1 = m.r * .3, r2 = m.r - 2; pxLine(x + Math.cos(a) * r1, y + Math.sin(a) * r1, x + Math.cos(a) * r2, y + Math.sin(a) * r2, i % 2 ? C.violet : col(4)); } ringC(x, y, m.r - 2, C.violet, 1); }
function drawLanterns(m, x, y, k, blink, cx, cy) { for (const h of m.holes) { const hx = h.x - cx, hy = h.y - cy, fl = 1 + Math.sin(G.time * 9 + h.x) * .5; ringC(hx, hy, h.r, C.gold, 1); rect(hx - 2, hy - 6, 4, 6, C.gold); rect(hx - 1, hy - 5, 2, 3, col(5)); ctx.globalAlpha = .2; disc(hx, hy, h.r * (.6 + .1 * fl), C.gold); ctx.globalAlpha = 1; } }
function drawRegard(m, x, y, k, blink, cx, cy) { const b = m.owner, bx = b.x - cx, by = b.y - cy - 30, p = G.p, facing = Math.abs(angDiff(p.aim, ang(p.x, p.y, b.x, b.y))) < 1.25;
  ringC(bx, by, 7 + (blink ? 1 : 0), facing ? C.gold : C.red, 1); disc(bx, by, 2 + k * 3, facing ? C.gold : C.red); }
function tickVerdict(m, dt) { const p = G.p, b = m.owner; if (p.alive && dist(p.x, p.y, b.x, b.y) < m.near) { AU.play('soak'); ringFx(p.x, p.y, 20, C.gold, .4, 2); burst(p.x, p.y, 16, C.gold, 100, .4); return true; }
  if (m.t >= m.warn) { AU.play('resolve'); flash(C.gold, .3, true); if (p.alive) mechFail(m, p.x, p.y); return true; } return false; }
function drawVerdict(m, x, y, k, blink, cx, cy) { const p = G.p, b = m.owner, px = p.x - cx, py = p.y - cy - 4, left = Math.max(0, m.warn - m.t) / m.warn;
  for (let i = 0; i < 16; i++) { const a = -Math.PI / 2 + i / 16 * 6.283; rect(px + Math.cos(a) * 13 - .5, py + Math.sin(a) * 13 - .5, 1, 1, i < Math.ceil(16 * left) ? C.gold : col(2)); }
  ctx.globalAlpha = .45; ringC(b.x - cx, b.y - cy, m.near, blink ? col(5) : C.gold, 1); ctx.globalAlpha = 1; const a = ang(p.x, p.y, b.x, b.y), ax = px + Math.cos(a) * 18, ay = py + Math.sin(a) * 18; pxLine(ax, ay, ax - Math.cos(a + .6) * 4, ay - Math.sin(a + .6) * 4, C.gold); pxLine(ax, ay, ax - Math.cos(a - .6) * 4, ay - Math.sin(a - .6) * 4, C.gold); }
function tickWetInk(m, dt) { const p = G.p; m.life -= dt; if (p.alive && segDist(p.x, p.y, m.x, m.y, m.x2, m.y2) < m.w / 2 + p.r - 3) hurtPlayer(1, p.x, p.y); return m.life <= 0; }
function drawWetInk(m, x, y, k, blink, cx, cy) { const f = Math.min(1, m.life * 1.5), a = ang(m.x, m.y, m.x2, m.y2), L4 = dist(m.x, m.y, m.x2, m.y2); ctx.save(); arenaClipA(m.owner, cx, cy); ctx.translate(x, y); ctx.rotate(a); ctx.globalAlpha = .75 * f; ctx.fillStyle = '#050506'; ctx.fillRect(0, -m.w / 2, L4, m.w); ctx.globalAlpha = f; ctx.fillStyle = col(3); for (let o = ((G.time * 20) % 10); o < L4; o += 10) ctx.fillRect(o, -m.w / 2, 3, 1); ctx.restore(); ctx.globalAlpha = 1; }
function arenaClipA(b, cx, cy) { const A = arenaOf(b); ctx.beginPath(); ctx.rect(A.x0 - cx, A.y0 - cy, A.x1 - A.x0, A.y1 - A.y0); ctx.clip(); }
function tickPendulum(m, dt) { const p = G.p; if (m.t < m.t0) return false; const lt = m.t - m.t0, ang2 = Math.PI / 2 + Math.sin(lt * 6.283 / m.per) * m.amp; m.a = ang2;
  const ex = m.px + Math.cos(ang2) * m.L, ey = m.py + Math.sin(ang2) * m.L; m.ex = ex; m.ey = ey;
  if (p.alive && dist(p.x, p.y, ex, ey) < 16 + p.r) hurtPlayer(1, ex, ey); if (p.alive && segDist(p.x, p.y, m.px, m.py, ex, ey) < 3 + p.r && dist(p.x, p.y, ex, ey) < 70) hurtPlayer(1, p.x, p.y);
  if (Math.abs(Math.sin(lt * 6.283 / m.per)) > .985 && (m.lt || 0) < G.time) { m.lt = G.time + .4; for (const s of [-1, 1]) eshot(ex, ey, ang2 + Math.PI / 2 * s, spd(m.owner, 50), { c: C.gold, life: 2 }); }
  return lt > m.dur; }
function drawPendulum(m, x, y, k, blink, cx, cy) { const px = m.px - cx, py = m.py - cy; if (m.t < m.t0) { const q = m.t / m.t0; ctx.globalAlpha = .4; for (let s = -1; s <= 1; s += 2) { const a = Math.PI / 2 + s * m.amp; for (let i = 0; i < 30; i++) { const r = m.L - 16 + Math.sin(i) * 2, aa = Math.PI / 2 + (a - Math.PI / 2) * i / 29; rect(px + Math.cos(aa) * m.L, py + Math.sin(aa) * m.L, 1, 1, blink ? col(5) : C.gold); } } ctx.globalAlpha = 1; return; }
  const ex = m.ex - cx, ey = m.ey - cy; pxLine(px, py, ex, ey, col(4)); ctx.save(); ctx.translate(ex, ey); ctx.rotate(m.a + Math.PI / 2); ctx.fillStyle = col(0); ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI); ctx.fill(); ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI); ctx.fill(); ctx.fillStyle = col(5); ctx.fillRect(-16, 0, 32, 1); ctx.restore(); }
function drawEclipse(m, x, y, k, blink, cx, cy) { for (const q of m.pillars) { const qx = q[0] - cx, qy = q[1] - cy; rect(qx - 6, qy - 18, 12, 22, col(0)); rect(qx - 5, qy - 17, 10, 20, col(4)); rect(qx - 5, qy - 17, 10, 2, col(5)); rect(qx - 7, qy + 2, 14, 2, col(3)); } }
function tickOrbit(m, dt) { const p = G.p, b = m.owner, k = clamp(m.t / m.life, 0, 1); m.R = lerp(m.r0, m.r1, Math.min(1, k * 1.4)); m.a = (m.a || 0) + m.va * dt;
  m.pts = []; for (let i = 0; i < m.n; i++) { const a = m.a + i / m.n * 6.283; m.pts.push([b.x + Math.cos(a) * m.R, b.y + Math.sin(a) * m.R * .8]); }
  if (p.alive) for (const q of m.pts) if (dist(q[0], q[1], p.x, p.y) < 8 + p.r - 1) { hurtPlayer(1, q[0], q[1]); break; }
  if (m.t > m.life) { for (const q of m.pts) bring(b, q[0], q[1], dn(6), 50, { c: col(5) }, rand(0, 6)); return true; } return false; }
function drawOrbit(m, x, y, k, blink, cx, cy) { if (!m.pts) return; const b = m.owner; ctx.globalAlpha = .25; for (let i = 0; i < 48; i++) { const a = i / 48 * 6.283; rect(b.x - cx + Math.cos(a) * m.R, b.y - cy + Math.sin(a) * m.R * .8, 1, 1, col(4)); } ctx.globalAlpha = 1;
  for (const q of m.pts) { const qx = q[0] - cx, qy = q[1] - cy; disc(qx, qy, 9, col(0)); disc(qx, qy, 8, col(4)); disc(qx - 2, qy - 2, 4, col(5)); } }
function tickDark(m, dt) { G.darkT = Math.min(1, (G.darkT || 0) + dt * 3); if (m.t > m.life) return true; return false; }
function drawDarkMark() { }
// the pale's silence: everything but a small circle around the hero goes black (drawn after the world)
function drawDark(cx, cy) { if (!(G.darkT > 0)) return; const k = G.darkT, p = G.p, x = p.x - cx, y = p.y - cy - 2, R = 52;
  ctx.save(); ctx.globalAlpha = k * .96; ctx.fillStyle = '#030304'; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(x, y, R, 0, 6.2832, true); ctx.fill('evenodd'); ctx.restore(); ctx.globalAlpha = k * .5; ringC(x, y, R, col(3), 1); ctx.globalAlpha = 1;
  if (!G.mechs.some(m => m.type === 'dark')) G.darkT = Math.max(0, G.darkT - FRAME_DT * 2); }
function drawCourtMark(m, x, y, k) { const v = m.vert; for (let i = 0; i < 3; i++) { const o = ((G.time * 30) % 6) + i * 6; if (v) { rect(x - m.w / 2 - o, y - 2, 2, 4, C.gold); rect(x + m.w / 2 + o, y - 2, 2, 4, C.gold); } else { rect(x - 2, y - m.w / 2 - o, 4, 2, C.gold); rect(x - 2, y + m.w / 2 + o, 4, 2, C.gold); } } ctx.globalAlpha = .2; if (v) rect(x - m.w / 2, y - 3, m.w, 6, C.gold); else rect(x - 3, y - m.w / 2, 6, m.w, C.gold); ctx.globalAlpha = 1; }

// ---------------- kiln crystal adds ----------------
ESPR.kcrystal = ['...o...', '..ooo..', '.oo5oo.', 'oo555oo', '.oo5oo.', '..ooo..', '...o...'];
ETYPES.kcrystal = { hp: 60, r: 6, spd: 0, cost: 0, ink: 2, heavy: .05, fly: true };
AI.kcrystal = (e, dt) => { e.face = 0; if (e.cd <= 0) { e.cd = 2.2; ringShot(e.x, e.y, Math.max(3, Math.round(6 * diffV('barrage'))), 45, { c: C.orange }, e.t); AU.play('ebullet', 1.2, .5); } };

// ---------------- looks ----------------
// variants carry a corrupted outline and three dark shards in orbit
function drawVariantMark(b, x, y) { const t = G.time, R = b.r + 10;
  for (let i = 0; i < 3; i++) { const a = t * 1.7 + i * 2.094, sx = x + Math.cos(a) * R, sy = y + Math.sin(a) * R * .7; ctx.save(); ctx.translate(Math.round(sx), Math.round(sy)); ctx.rotate(a * 2); ctx.fillStyle = col(0); ctx.fillRect(-3, -3, 6, 6); ctx.fillStyle = '#ff2a3a'; ctx.fillRect(-2, -2, 4, 4); ctx.restore(); }
  if (((t * 6) | 0) % 5 === 0) { ctx.globalAlpha = .5; ringC(x, y, b.r + 3, '#ff2a3a', 1); ctx.globalAlpha = 1; } }
function drawBoss2(b, x, y, f) {
  const t = G.time, fl = b.flash > 0, c3 = fl ? col(5) : col(3), c4 = fl ? col(5) : col(4), c5 = col(5), c2 = fl ? col(5) : col(2), ex = Math.cos(b.eye) * 3, ey = Math.sin(b.eye) * 2, arm = b.armorT > 0;
  ctx.globalAlpha = .6; disc(x, y + b.r, b.r, col(0)); ctx.globalAlpha = 1;
  if (f === 5) { // THE KILN: a squat brick furnace with a breathing mouth
    const glow = ((t * 8) | 0) % 2 ? C.orange : C.gold, bob = Math.sin(t * 2) * 1;
    rect(x - 15, y - 16 + bob, 30, 30, col(0)); rect(x - 14, y - 15 + bob, 28, 28, c3); for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) rect(x - 13 + i * 9 + (j % 2) * 4, y - 13 + j * 7 + bob, 8, 1, c2);
    rect(x - 9, y - 2 + bob, 18, 10, col(0)); rect(x - 8, y - 1 + bob, 16, 8, arm ? c4 : glow); rect(x - 6 + ex, y + 1 + bob, 12, 3, arm ? c5 : C.gold);
    for (const s of [-1, 1]) { rect(x + s * 9 - 2, y - 24 + bob, 5, 9, c4); if (Math.random() < .3) part({ x: b.x + s * 9, y: b.y - 26, vx: rand(-5, 5), vy: -30, life: .6, max: .6, c: Math.random() < .5 ? col(3) : C.orange, s: 2 }); }
    if (b.crysT > 0) { b.crysT -= FRAME_DT; ringC(x, y, b.r + 8, C.orange, 1); }
  } else if (f === 6) { // THE DYNAMO: a charged core inside two counter-spinning rings
    disc(x, y, 12, col(0)); disc(x, y, 10, c4); disc(x + ex, y + ey, 5, arm ? c5 : C.cyan); rect(x + ex - 1, y + ey - 1, 2, 2, c5);
    for (const [rx, ry, sp, c] of [[20, 7, 1.6, C.cyan], [8, 19, -1.1, c5]]) for (let i = 0; i < 24; i++) { const a = t * sp + i / 24 * 6.283; if (i % 3) rect(x + Math.cos(a) * rx, y + Math.sin(a) * ry, 1, 1, c); }
    if (Math.random() < .4) { const a = rand(0, 6.28); G.bolts.push({ pts: zig(b.x, b.y, b.x + Math.cos(a) * 22, b.y + Math.sin(a) * 22), life: .06, max: .06, c: C.cyan }); }
  } else if (f === 7) { // THE CHASM: a hole ringed with teeth and one violet eye
    disc(x, y, 17, col(0)); for (let i = 0; i < 12; i++) { const a = t * .4 + i / 12 * 6.283; ctx.save(); ctx.translate(Math.round(x + Math.cos(a) * 15), Math.round(y + Math.sin(a) * 15)); ctx.rotate(a + Math.PI / 2); ctx.fillStyle = c4; ctx.fillRect(-1, -3, 3, 4); ctx.restore(); }
    disc(x, y, 11, '#050506'); disc(x + ex * 1.5, y + ey * 1.5, 4, arm ? c4 : C.violet); rect(x + ex * 1.5 - 1, y + ey * 1.5 - 1, 1, 1, c5);
    for (let i = 0; i < 3; i++) { const q = (t * .6 + i / 3) % 1; ctx.globalAlpha = (1 - q) * .5; ringC(x, y, 18 + q * 12, C.violet, 1); } ctx.globalAlpha = 1;
  } else if (f === 8) { // THE CODEX: an open book whose pages turn on their own
    const bob = Math.sin(t * 2) * 2, flap = Math.sin(t * 5) * 3; y += bob;
    for (const s of [-1, 1]) { ctx.fillStyle = col(0); ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x + s * 18, y - 14 - (s > 0 ? flap : 0)); ctx.lineTo(x + s * 18, y + 9); ctx.lineTo(x, y + 11); ctx.fill();
      ctx.fillStyle = c4; ctx.beginPath(); ctx.moveTo(x, y - 11); ctx.lineTo(x + s * 17, y - 13 - (s > 0 ? flap : 0)); ctx.lineTo(x + s * 17, y + 8); ctx.lineTo(x, y + 10); ctx.fill();
      for (let i = 0; i < 4; i++) rect(x + s * 4 + (s < 0 ? -11 : 0), y - 7 + i * 4, 10, 1, c2); }
    disc(x + ex * .5, y - 1, 4, col(0)); disc(x + ex * .5, y - 1, 3, arm ? c5 : C.gold); rect(x - 1, y - 12, 1, 22, c5);
  } else if (f === 9) { // THE PALE: a featureless white mask trailing gray threads
    const bob = Math.sin(t * 1.4) * 2; y += bob;
    for (let i = 0; i < 6; i++) { const ox = x - 10 + i * 4; for (let j = 0; j < 7; j++) rect(ox + Math.sin(t * 2 + i + j * .6) * 2, y + 10 + j * 3, 1, 2, j > 4 ? col(2) : col(3)); }
    ctx.fillStyle = col(0); ctx.beginPath(); ctx.ellipse(x, y, 14, 17, 0, 0, 6.283); ctx.fill(); ctx.fillStyle = fl ? col(5) : '#e8e8ec'; ctx.beginPath(); ctx.ellipse(x, y, 12, 15, 0, 0, 6.283); ctx.fill();
    rect(x - 7 + ex * .5, y - 3, 5, 2, arm ? col(3) : col(0)); rect(x + 2 + ex * .5, y - 3, 5, 2, arm ? col(3) : col(0)); rect(x - 1, y + 6, 2, 1, col(3));
    if (b.enrageT !== undefined) ringC(x, y, 22, C.red, 1);
  }
  if (b.armorT > 0) ringC(x, y, b.r + 6 + Math.sin(t * 20) * 2, col(5), 1);
  if (b.burn > 0) for (let i = 0; i < 2; i++) rect(x + rand(-12, 12), y - rand(0, 20), 1, 2, C.red);
}
