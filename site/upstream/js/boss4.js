// ===== TheSeed bosses III: a third boss for every floor (chosen with the original and the alternate, a third each; the last floor is
// either the Absence or the Progenitor, and both fall into the same second forms). Each comes with its own body, moveset and arena.
'use strict';
const BOSSES_NEW = [
  { key: 'scrap', look: 12, name: N4('THE SCRAP COLOSSUS', '廢鐵巨像', '廃鉄の巨像', '废铁巨像'), hp: 1500, r: 14, roam: { r: 95, spd: 55, w: .6 }, press: 1.9,
    phases: [['scrap_charge', 'scrap_toss', 'scrap_spin'], ['scrap_charge', 'scrap_toss', 'scrap_spin', 'scrap_magnet'], ['combo', 'scrap_quake', 'scrap_charge', 'scrap_magnet', 'scrap_toss', 'scrap_spin']],
    combos: [['scrap_toss', 'scrap_spin'], ['scrap_quake', 'scrap_toss'], ['scrap_magnet', 'scrap_spin']] },
  { key: 'lamp', look: 13, name: N4('THE LAMPLIGHTER', '提燈人', 'ランプ持ち', '提灯人'), hp: 4200, r: 12, roam: { r: 110, spd: 90, w: .7 }, press: 1.2,
    phases: [['lamp_lanterns', 'lamp_beam', 'lamp_moths'], ['lamp_lanterns', 'lamp_beam', 'lamp_moths', 'lamp_flicker'], ['combo', 'combo', 'lamp_wick', 'lamp_flicker', 'lamp_lanterns', 'lamp_beam']],
    combos: [['lamp_moths', 'lamp_flicker'], ['lamp_beam', 'lamp_wick'], ['lamp_lanterns', 'lamp_moths']] },
  { key: 'culture', look: 14, name: N4('THE MOTHER CULTURE', '母體培養皿', '母体培養皿', '母体培养皿'), hp: 8800, r: 15, roam: { r: 120, spd: 50, w: .5 }, press: 1.4,
    phases: [['cul_bloom', 'cul_rows', 'cul_tendril'], ['cul_bloom', 'cul_brood', 'cul_rows', 'cul_tendril', 'cul_spore'], ['combo', 'combo', 'cul_brood', 'cul_spore', 'cul_tendril', 'cul_bloom']],
    combos: [['cul_tendril', 'cul_spore'], ['cul_bloom', 'cul_brood'], ['cul_rows', 'cul_spore']] },
  { key: 'warden', look: 15, name: N4('THE QUARANTINE WARDEN', '隔離監守者', '隔離監視者', '隔离监守者'), hp: 15500, r: 13, roam: { r: 105, spd: 80, w: .7 }, press: 1.2,
    phases: [['war_siren', 'war_grid', 'war_gas'], ['war_siren', 'war_grid', 'war_gas', 'war_volley'], ['combo', 'combo', 'war_sweep', 'war_volley', 'war_siren', 'war_grid']],
    combos: [['war_gas', 'war_volley'], ['war_grid', 'war_sweep'], ['war_siren', 'war_gas']] },
  { key: 'progen', look: 16, form: 1, name: N4('THE PROGENITOR', '始祖', '始祖', '始祖'), hp: 9000, r: 16, roam: { r: 115, spd: 75, w: .6 }, press: 1.1,
    phases: [['pro_helix', 'pro_genome', 'pro_lances'], ['pro_helix', 'pro_genome', 'pro_lances', 'pro_fission', 'pro_collapse'], ['combo', 'combo', 'pro_fission', 'pro_collapse', 'pro_lances', 'pro_genome']],
    combos: [['pro_helix', 'pro_genome'], ['pro_fission', 'pro_collapse'], ['pro_lances', 'pro_genome']] },
];
Object.assign(VARIANTS, {
  scrap: { name: N4('THE SCRAP COLOSSUS', '廢鐵巨像', '廃鉄の巨像', '废铁巨像'), add: 'scrap_quake' },
  lamp: { name: N4('THE LAMPLIGHTER', '提燈人', 'ランプ持ち', '提灯人'), add: 'lamp_wick' },
  culture: { name: N4('THE MOTHER CULTURE', '母體培養皿', '母体培養皿', '母体培养皿'), add: 'cul_spore' },
  warden: { name: N4('THE QUARANTINE WARDEN', '隔離監守者', '隔離監視者', '隔离监守者'), add: 'war_sweep' },
  progen: { name: N4('THE PROGENITOR', '始祖', '始祖', '始祖'), add: 'pro_collapse' },
});
Object.assign(BINFO, {
  scrap: N3('A HEAP OF CARS, CRANES AND RAILINGS THAT THE GROWTH HOLDS TOGETHER. IT STILL REMEMBERS HOW TO DRIVE.', '被增生物黏合在一起的汽車、吊臂與欄杆。它還記得怎麼開車。', '増殖体が繋ぎ止めた車とクレーンと手すりの山。運転の仕方をまだ覚えている。'),
  lamp: N3('THE NIGHT WATCHMAN OF THE POWER STATION. WHEN THE LIGHTS WENT OUT, HE BECAME ONE.', '發電站的夜班守衛。燈全熄滅的那一晚，他自己成了燈。', '発電所の夜警。明かりが消えた夜、彼自身が明かりになった。'),
  culture: N3('THE FIRST DISH THE STRAIN WAS GROWN IN. IT KEPT GROWING AFTER THE LID CAME OFF.', '病株最初被培養的那個培養皿。蓋子掀開之後，它就沒停止生長。', '最初に株が培養された皿。蓋が外れても、成長を止めなかった。'),
  warden: N3('THE SUIT WAS SEALED FROM THE INSIDE. WHOEVER IS IN IT STILL ENFORCES THE QUARANTINE.', '防護服是從裡面封死的。不管裡面是誰，它仍在執行隔離令。', '防護服は内側から封じられていた。中の誰かは、今も隔離を執行している。'),
  progen: N3('THE SAMPLE EVERY OTHER SPECIMEN CAME FROM. IT HAS BEEN WAITING TO MEET THEM ALL AGAIN.', '所有樣本的源頭。它一直在等著與它們全部重逢。', '全ての標本の源。全員と再会する日を待っていた。'),
});
Object.assign(STR, {
  mt_n_lane: ['STAY OFF THE CHARGE LANES', '請避開衝撞路線', '突進の進路から離れよ', '请避开冲撞路线'], mt_n_scrap: ['MOVE OUT OF WHERE THE SCRAP LANDS', '請離開碎片落點', '残骸の落下点から離れよ', '请离开碎片落点'],
  mt_n_quake: ['MOVE TO THE OTHER HALF', '請移動到另一半場地', '反対側へ移動せよ', '请移动到另一半场地'],
  mt_n_light: ['STAND INSIDE A LANTERN’S LIGHT', '請站進燈籠的光圈裡', 'ランプの光の中に入れ', '请站进灯笼的光圈里'], mt_n_flick: ['STAND ON THE DARK TILES, THEN SWAP', '請站在暗格上，隨後換位', '暗いマスに立ち、次に移れ', '请站在暗格上，随后换位'],
  mt_n_wick: ['LEAVE THE MARKED SPOTS', '請離開標記位置', '印の場所から離れよ', '请离开标记位置'],
  mt_n_bloom: ['STAY CLEAR OF THE BLOOMS', '請遠離菌斑', '菌の花から離れよ', '请远离菌斑'], mt_n_rows: ['MOVE INTO THE ROWS THAT ALREADY ERUPTED', '請移動到已經噴發過的行', '噴き終えた列へ移動せよ', '请移动到已经喷发过的行'],
  mt_n_tendril: ['STAY BETWEEN THE TENDRILS', '請站在觸鬚之間', '触手の間に立て', '请站在触须之间'],
  mt_n_inout: ['GET CLOSE FIRST, THEN GET AWAY', '先靠近，再遠離', 'まず近づき、次に離れよ', '先靠近，再远离'], mt_n_grid: ['STAY OUT OF THE SEARCH LANES', '請避開搜索通道', '捜索路から離れよ', '请避开搜索通道'],
  mt_n_sweep: ['STAY OUT OF THE SEARCHLIGHTS', '請避開探照燈', 'サーチライトから離れよ', '请避开探照灯'],
  mt_n_genome: ['STAND ON A TILE THAT IS NOT LIT', '請站在未亮起的格子上', '光っていないマスに立て', '请站在未亮起的格子上'], mt_n_collapse: ['STAY INSIDE THE SHRINKING CIRCLE', '請留在不斷縮小的圓內', '縮む円の中に留まれ', '请留在不断缩小的圆内'],
});
// which boss waits on a floor: a third each (the last floor: the Absence or the Progenitor, plain)
bossDefFor = (orig => function (fi) { const c = G.bossPick || {}; if (c.n && BOSSES_NEW[fi]) return c.v ? variantOf(BOSSES_NEW[fi]) : BOSSES_NEW[fi]; return orig(fi); })(bossDefFor);
pickBoss = function () { const r = Math.random(); G.bossPick = { alt: r >= 1 / 3 && r < 2 / 3, n: r < 1 / 3, v: Math.random() < .5 };
  if (G.floor === BOSSES.length - 1) G.bossPick = { alt: false, v: false, n: Math.random() < .5 }; };

// ---------------- the movesets ----------------
const b4grid = (A, cols, rows) => { const out = [], cw = (A.x1 - A.x0) / cols, ch = (A.y1 - A.y0) / rows; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) out.push([A.x0 + i * cw, A.y0 + j * ch, cw, ch, i, j]); return out; };
const BATK4 = {
  // ======================= THE SCRAP COLOSSUS (floor 1) =======================
  scrap_charge(b, t, dt) { // three charges down marked lanes; scrap flies off both sides as it passes
    const m = b.mem, p = G.p, A = A0(b), N = 3; m.n = m.n || 0;
    if (!m.lane && m.n < N && t > (m.next || 0)) { cue(b, .8); b.anchored = true; const a = ang(b.x, b.y, p.x, p.y), L4 = 260, ex = clamp(b.x + Math.cos(a) * L4, A.x0 + 26, A.x1 - 26), ey = clamp(b.y + Math.sin(a) * L4, A.y0 + 26, A.y1 - 26);
      m.lane = mech({ type: 'seg', x: b.x, y: b.y, x2: ex, y2: ey, w: 26, warn: 1, owner: b, tip: 'mt_n_lane' }); m.ex = ex; m.ey = ey; m.at = t; }
    if (m.lane && t - m.at > 1) { if (!m.go) { m.go = 1; AU.play('dash', .7, .8); shake(.2, true); } b.goal = { x: m.ex, y: m.ey, spd: 520 };
      if (every(t, dt, dp(.07))) { const a = ang(m.lane.x, m.lane.y, m.ex, m.ey); for (const s of [-1, 1]) bs(b, b.x, b.y, a + s * 1.57, spd(b, 60), { c: C.orange, life: 2.2 }); }
      if (dist(b.x, b.y, m.ex, m.ey) < 14 || t - m.at > 2) { m.lane = null; m.go = 0; m.n++; m.next = t + .45; b.goal = null; ringShot(b.x, b.y, dn(10), spd(b, 70), { c: col(4) }); shake(.15, true); } }
    return m.n >= N && t > (m.next || 0); },
  scrap_toss(b, t, dt) { // scrap chunks land where you stand and around you; each bursts into shrapnel
    const m = b.mem, p = G.p; m.n = m.n || 0; const N = 4 + b.phase;
    if (m.n < N && t > .2 + m.n * .4) { const x = m.n === 0 ? p.x : p.x + rand(-60, 60), y = m.n === 0 ? p.y : p.y + rand(-45, 45); if (!m.n) cue(b, 1.1); AU.play('lob', .8, .6);
      mech({ type: 'circle', x, y, r: 20, warn: 1.1, owner: b, small: m.n > 0, tip: 'mt_n_scrap', onResolve: q => { burst(q.x, q.y, 12, col(4), 120, .4); ringShot(q.x, q.y, dn(6), spd(b, 75), { c: col(4), life: 2 }, rand(0, 6)); } }); m.n++; }
    return m.n >= N && t > .2 + N * .4 + 1.3; },
  scrap_spin(b, t, dt) { // it spins in place: three arms of scrap sweep the room
    const m = b.mem; if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, .9); m.dir = Math.random() < .5 ? 1 : -1; }
    if (t > .5 && t < 3.6 && every(t, dt, dp(.12))) { const arms = 3 + (b.phase >= 2 ? 1 : 0); for (let i = 0; i < arms; i++) bs(b, b.x, b.y, m.dir * t * 1.6 + i / arms * 6.283, spd(b, 80), { c: C.orange }); }
    return t > 3.9; },
  scrap_magnet(b, t, dt) { // its magnet drags you in while a ring of debris circles it
    const m = b.mem; if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, .7); AU.play('curse', .7, .5);
      m.m = mech({ type: 'well', x: b.x, y: b.y, r: 18, pull: 42 + b.phase * 6, t0: .8, dur: 3, warn: 99, owner: b, tick: tickWell, draw: drawWell, tip: 'mt_well' }); }
    if (t > .8 && t < 3.8 && every(t, dt, dp(.45))) bring(b, b.x, b.y, dn(10), spd(b, 55), { c: col(4) }, t * 1.3);
    if (t > 4) { G.mechs = G.mechs.filter(q => q !== m.m); return true; } return false; },
  scrap_quake(b, t, dt) { // the floor buckles: one half, then the other
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, .6); shake(.2, true); const s = Math.random() < .5 ? 0 : Math.PI;
      mech({ type: 'half', x: A.cx, y: A.cy, a: s, warn: 1.7, owner: b, A, tip: 'mt_n_quake', onResolve: () => { shake(.3, true); ringShot(A.cx, A.cy, dn(14), spd(b, 70), { c: col(4) }); } });
      mech({ type: 'half', x: A.cx, y: A.cy, a: s + Math.PI, warn: 3.2, showAt: 1.7, owner: b, A, tip: 'mt_n_quake', onResolve: () => shake(.3, true) }); }
    return t > 3.5; },
  // ======================= THE LAMPLIGHTER (floor 2) =======================
  lamp_lanterns(b, t, dt) { // the dark burns: only the lanterns' light is safe
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, 1); AU.play('curse', 1.2, .5); const holes = []; for (let i = 0; i < 3; i++) { const q = farPt(b, holes.length ? [holes[holes.length - 1].x, holes[holes.length - 1].y] : [b.x, b.y], 90, 40); holes.push({ x: q[0], y: q[1], r: 30 }); }
      m.holes = holes; mech({ type: 'holes', A, holes, warn: 2.6, owner: b, tip: 'mt_n_light', onResolve: () => { flash(C.gold, .15, true); for (const h of holes) ringFx(h.x, h.y, h.r, C.gold, .3, 2); } }); }
    if (m.holes && t < 2.6 && Math.random() < .3) { const h = choice(m.holes), a = rand(0, 6.28); part({ x: h.x + Math.cos(a) * h.r * .6, y: h.y + Math.sin(a) * h.r * .6, vx: 0, vy: -20, life: .5, max: .5, c: C.gold, s: 1 }); }
    if (t > .5 && every(t, dt, dp(.9))) aimFan(b, 2, .3, spd(b, 70), { c: C.gold });
    return t > 2.9; },
  lamp_beam(b, t, dt) { // two beams of the lamp sweep in opposite directions
    const m = b.mem; if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, .8); const a0 = rand(0, 6.28), dir = Math.random() < .5 ? 1 : -1;
      for (let i = 0; i < 2; i++) G.lasers.push({ owner: b, a: a0 + i * Math.PI, va: dir * (.5 + b.phase * .1), len: 420, w: 7, warn: 1.1, life: 3.4, c: C.gold }); AU.play('telegraph', .6); }
    if (t > 1.2 && every(t, dt, dp(.8))) aimFan(b, 3, .25, spd(b, 75), { c: C.gold });
    return t > 4.6; },
  lamp_moths(b, t, dt) { // moths leave the lamp and drift after you
    const m = b.mem; m.n = m.n || 0; const N = 6 + b.phase * 2; if (!m.n && !m.c) { m.c = 1; cue(b, 1.2); }
    if (m.n < N && t > m.n * .16) { const a = rand(0, 6.28); addEnemyBullet({ own: b, x: b.x, y: b.y, vx: Math.cos(a) * 100, vy: Math.sin(a) * 100, r: 3, life: 5, c: C.gold, homing: 1.2, homeT: 2.4 }); AU.play('ebullet', .6, .4); m.n++; }
    return t > N * .16 + .9; },
  lamp_flicker(b, t, dt) { // the floor flickers in a checkerboard: stand on the dark tiles, then swap
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, .9); const cells = b4grid(A, 6, 4), first = [], second = [];
      for (const [x, y, w, h, i, j] of cells) ((i + j) % 2 ? first : second).push([x, y, w, h]);
      mech({ type: 'cells', cells: first, warn: 1.9, owner: b, tip: 'mt_n_flick' }); mech({ type: 'cells', cells: second, warn: 3.3, showAt: 1.9, owner: b, tip: 'mt_n_flick' }); }
    return t > 3.5; },
  lamp_wick(b, t, dt) { // wicks catch at your feet one after another; each burns into a ring
    const m = b.mem, p = G.p; m.n = m.n || 0; const N = 4 + b.phase; if (!m.n && !m.c) { m.c = 1; cue(b, 1); }
    if (m.n < N && t > m.n * .55) { mech({ type: 'circle', x: p.x, y: p.y, r: 24, warn: 1.1, owner: b, tip: 'mt_n_wick', onResolve: q => { burst(q.x, q.y, 10, C.gold, 100, .35); ringShot(q.x, q.y, dn(8), spd(b, 65), { c: C.gold }, rand(0, 6)); } }); m.n++; }
    return m.n >= N && t > N * .55 + 1.3; },
  // ======================= THE MOTHER CULTURE (floor 3) =======================
  cul_bloom(b, t, dt) { // fungal blooms open across the dish and leave rot behind
    const m = b.mem; if (!m.s) { m.s = 1; cue(b, 1); const pts = []; for (let i = 0; i < 4 + b.phase; i++) pts.push(i === 0 ? [G.p.x, G.p.y] : farPt(b, pts[pts.length - 1], 60, 36));
      pts.forEach((q, i) => mech({ type: 'blot', x: q[0], y: q[1], r: 26, seed: rand(0, 6.28), warn: 1.5 + i * .25, owner: b, tip: 'mt_n_bloom', onResolve: z => { splat(z.x, z.y, '#3a4a10', 12, 18); G.zones.push({ x: z.x, y: z.y, r: 18, warn: .1, life: 3.5, kind: 'void' }); } }));
      m.end = 1.5 + pts.length * .25 + .3; }
    return t > m.end; },
  cul_rows(b, t, dt) { // rows of the dish erupt one after another from the top
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, .9); const rh = 34, n = Math.ceil((A.y1 - A.y0) / rh), rev = Math.random() < .5; m.end = 0;
      for (let i = 0; i < n; i++) { const k = rev ? n - 1 - i : i, y0 = A.y0 + k * rh, y1 = Math.min(A.y1, y0 + rh), wt = 1.6 + i * .45;
        rectM(b, A.x0, y0, A.x1, y1, { warn: wt, showAt: Math.max(0, wt - 1.1), small: true, tip: 'mt_n_rows' }); m.end = wt + .3; } }
    if (t > .6 && every(t, dt, dp(1.2))) aimFan(b, 2, .3, spd(b, 70), { c: C.lime });
    return t > m.end; },
  cul_tendril(b, t, dt) { // tendrils lash out from the body in a star, then again between the first ones
    const m = b.mem; if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, .8); const a0 = rand(0, 6.28), n = 6;
      for (const [off, wt] of [[0, 1.3], [Math.PI / n, 2.5]]) for (let i = 0; i < n; i++) { const a = a0 + off + i / n * 6.283; mech({ type: 'seg', x: b.x, y: b.y, x2: b.x + Math.cos(a) * 240, y2: b.y + Math.sin(a) * 240, w: 18, warn: wt, showAt: wt > 2 ? 1.3 : undefined, owner: b, small: true, tip: 'mt_n_tendril' }); } }
    return t > 2.8; },
  cul_brood(b, t, dt) { // the dish spits out a brood
    const m = b.mem; if (!m.s) { m.s = 1; cue(b, .6); AU.play('roar', 1.4, .5); const alive = G.enemies.filter(e => !e.dead && !e.boss && e.room === b.room).length, n = Math.max(0, Math.min(3 + b.phase, 10 - alive));
      for (let i = 0; i < n; i++) { const a = i / Math.max(1, n) * 6.283, x = b.x + Math.cos(a) * 26, y = b.y + Math.sin(a) * 26; const e = spawnEnemy('swarm', x, y, { room: b.room, ink: 1 }); if (e) e.minion = true; burst(x, y, 8, C.lime, 80, .3); }
      ringShot(b.x, b.y, dn(12), spd(b, 70), { c: C.lime }); }
    return t > 1.2; },
  cul_spore(b, t, dt) { // spore pods float out and burst into rings, three times each
    const m = b.mem; if (!m.s) { m.s = 1; cue(b, 1.1); const P = []; for (let i = 0; i < 3 + (b.phase >= 2 ? 1 : 0); i++) P.push(rndArenaPt(b, 44)); m.end = 3.4;
      G.emitters.push(...P.map(q => ({ owner: b, t: 0, life: m.end, c: C.lime, x: b.x, y: b.y, tx: q[0], ty: q[1], per: dp(1),
        move(e) { const k = Math.min(1, e.t / .7); e.x = lerp(b.x, e.tx, k); e.y = lerp(b.y, e.ty, k); },
        fire(e) { if (e.t < .7) return; ringShot(e.x, e.y, dn(8), spd(b, 60), { c: C.lime }, e.t); } }))); }
    return t > m.end; },
  // ======================= THE QUARANTINE WARDEN (floor 4) =======================
  war_siren(b, t, dt) { // the siren: come close while it winds up, then get away when it sounds
    const m = b.mem; if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, .7); AU.play('telegraph', .8);
      mech({ type: 'donut', x: b.x, y: b.y, r0: 64, warn: 1.9, owner: b, tip: 'mt_n_inout' });
      mech({ type: 'circle', x: b.x, y: b.y, r: 72, warn: 3.4, showAt: 1.9, owner: b, tip: 'mt_n_inout', onResolve: q => ringShot(q.x, q.y, dn(18), spd(b, 85), { c: C.red }) }); }
    return t > 3.6; },
  war_grid(b, t, dt) { // search lanes sweep the room: columns, then rows
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, .9); const cols = 6, cw = (A.x1 - A.x0) / cols, rows = 4, rh = (A.y1 - A.y0) / rows, ci = shuffle([...Array(cols).keys()]).slice(0, 3), ri = shuffle([...Array(rows).keys()]).slice(0, 2);
      ci.forEach(i => rectM(b, A.x0 + i * cw, A.y0, A.x0 + (i + 1) * cw, A.y1, { warn: 1.7, owner: b, small: true, tip: 'mt_n_grid' }));
      ri.forEach(j => rectM(b, A.x0, A.y0 + j * rh, A.x1, A.y0 + (j + 1) * rh, { warn: 3.1, showAt: 1.7, owner: b, small: true, tip: 'mt_n_grid' })); }
    return t > 3.4; },
  war_gas: function (b, t, dt) { // canisters vent around you and the gas lingers
    const m = b.mem, p = G.p; if (!m.done) { m.done = 1; cue(b, 1); for (let i = 0; i < 4 + b.phase; i++) { const tx = i === 0 ? p.x : p.x + rand(-110, 110), ty = i === 0 ? p.y : p.y + rand(-80, 80); if (!shotBlocked(tx, ty)) G.zones.push({ x: tx, y: ty, r: 22, warn: 1.1, life: 4.5, kind: 'void' }); } AU.play('venom', .7, .6); }
    if (every(t, dt, dp(.7))) aimFan(b, 3, .22, spd(b, 85), { c: C.red });
    return t > 2.4; },
  war_volley(b, t, dt) { // walls of rounds cross the room, each with a gap
    const m = b.mem, A = A0(b); m.n = m.n || 0; const N = 3; if (!m.n && !m.c) { m.c = 1; cue(b, .8); }
    if (m.n < N && t > .4 + m.n * 1.1) { const side = m.n % 2 ? -1 : 1, gy = rand(A.y0 + 30, A.y1 - 30), x0 = side > 0 ? A.x0 + 6 : A.x1 - 6; AU.play('ebullet', .9, .8);
      for (let y = A.y0 + 8; y < A.y1; y += 13) if (Math.abs(y - gy) > 22) eshot(x0, y, side > 0 ? 0 : Math.PI, spd(b, 70), { c: C.red, life: 6, own: b }); m.n++; }
    return m.n >= N && t > .4 + N * 1.1 + .4; },
  war_sweep(b, t, dt) { // two searchlights from its shoulders cut across the room
    const m = b.mem, p = G.p; if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, .7); const a = ang(b.x, b.y, p.x, p.y);
      for (const s of [-1, 1]) mech({ type: 'cone', x: b.x, y: b.y, a: a + s * .9, h: .36, len: 240, warn: 1.4, owner: b, tip: 'mt_n_sweep' });
      mech({ type: 'cone', x: b.x, y: b.y, a, h: .36, len: 240, warn: 2.6, showAt: 1.4, owner: b, tip: 'mt_n_sweep' }); }
    return t > 2.9; },
  // ======================= THE PROGENITOR (floor 5) =======================
  pro_helix(b, t, dt) { // a double helix unwinds from it
    const m = b.mem; if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, .9); }
    if (t > .4 && t < 3.8 && every(t, dt, dp(.1))) { for (const s of [1, -1]) bs(b, b.x, b.y, s * t * 2.1 + (s < 0 ? Math.PI : 0), spd(b, 75), { c: s > 0 ? C.red : C.cyan }); }
    return t > 4; },
  pro_genome: function (b, t, dt) { // its genome lights the floor in a pattern: stand where it is dark
    const m = b.mem, A = A0(b); if (!m.s) { m.s = 1; cue(b, .9); const cells = b4grid(A, 5, 3).map(c => c.slice(0, 4)), sh = shuffle(cells), half = Math.ceil(sh.length / 2);
      mech({ type: 'cells', cells: sh.slice(0, half), warn: 2, owner: b, tip: 'mt_n_genome', onResolve: () => ringShot(b.x, b.y, dn(10), spd(b, 70), { c: C.cyan }) });
      mech({ type: 'cells', cells: sh.slice(half), warn: 3.4, showAt: 2, owner: b, tip: 'mt_n_genome' }); }
    return t > 3.6; },
  pro_lances: function (b, t, dt) { // four lances of light turn around it
    const m = b.mem; if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, .8); const a0 = rand(0, 6.28), dir = Math.random() < .5 ? 1 : -1;
      for (let i = 0; i < 4; i++) G.lasers.push({ owner: b, a: a0 + i * 1.5708, va: dir * (.42 + b.phase * .08), len: 420, w: 7, warn: 1.1, life: 3.6, c: i % 2 ? C.red : C.cyan }); AU.play('telegraph', .5); }
    if (t > 1.2 && every(t, dt, dp(.9))) aimFan(b, 2, .4, spd(b, 70), { c: C.violet });
    return t > 4.8; },
  pro_fission: function (b, t, dt) { // it splits its image: every shot comes back from the other side of the room
    const m = b.mem; if (!m.s) { m.s = 1; cue(b, 1.1); b.mirrorT = 4.4; AU.play('phase', 1.3, .5); }
    if (t > .4 && t < 4.2 && every(t, dt, dp(.75))) aimFan(b, 3, .24, spd(b, 85), { c: C.violet });
    return t > 4.4; },
  pro_collapse: function (b, t, dt) { // the room collapses toward it: stay inside the shrinking circle
    const m = b.mem; if (!m.s) { m.s = 1; b.anchored = true; b.goal = null; cue(b, .7); AU.play('curse', .8, .5);
      [[150, 1.6], [110, 2.8], [72, 4]].forEach(([r0, w], i) => mech({ type: 'donut', x: b.x, y: b.y, r0, warn: w, showAt: i ? w - 1.2 : undefined, owner: b, tip: 'mt_n_collapse', onResolve: q => { if (i === 2) ringShot(q.x, q.y, dn(16), spd(b, 80), { c: C.violet }); } })); }
    return t > 4.3; },
};
Object.assign(BATK, BATK4);

// ---------------- the bodies ----------------
Object.assign(BOSS_ART, {
  // THE SCRAP COLOSSUS: a body of crushed cars on a tracked base, a crane arm, one headlight eye
  12(b, x, y, t, K) { const c = K.c, I = BA.iron, R = BA.rust, sh = Math.sin(t * 6) * .5;
    rect(x - 16, y + 6, 32, 8, BA.D); rect(x - 15, y + 7, 30, 6, c(I[2])); for (let i = 0; i < 6; i++) rect(x - 14 + i * 5 + ((t * 20) | 0) % 5, y + 8, 2, 4, c(I[1]));
    bPoly([[x - 15, y + 6], [x - 12, y - 14], [x + 13, y - 16], [x + 16, y + 6]], BA.D); bPoly([[x - 14, y + 5], [x - 11, y - 13], [x + 12, y - 15], [x + 15, y + 5]], c(R[2]));
    rect(x - 10, y - 10, 9, 6, c(I[3])); rect(x - 9, y - 9, 7, 2, c('#7aa0b0')); rect(x + 2, y - 6, 10, 7, c(R[3])); pxLine(x - 12, y - 2, x + 14, y - 4, c(R[1]));
    pxLine(x + 10, y - 14, x + 20, y - 26 + sh, BA.D, 3); pxLine(x + 10, y - 14, x + 20, y - 26 + sh, c(I[3])); pxLine(x + 20, y - 26 + sh, x + 24, y - 18, c(I[4])); rect(x + 23, y - 19, 3, 3, c(I[2]));
    const e = K.arm ? '#ffffff' : '#ffe08a'; disc(x - 3 + K.ex, y - 2, 3, BA.D); disc(x - 3 + K.ex, y - 2, 2, e); if (!K.fl) { ctx.globalAlpha = .2; disc(x - 3 + K.ex, y - 2, 6, e); ctx.globalAlpha = 1; }
    for (let i = 0; i < 3; i++) rect(x - 8 + i * 6, y + 2, 2, 1, '#3a4a2a'); },
  // THE LAMPLIGHTER: a long coat and a hood, a lantern on a crooked pole that never stops swinging
  13(b, x, y, t, K) { const c = K.c, sw = Math.sin(t * 2.2) * 3; y += Math.sin(t * 1.6) * 1.5;
    bPoly([[x - 9, y + 12], [x - 6, y - 10], [x + 6, y - 10], [x + 9, y + 12]], BA.D); bPoly([[x - 8, y + 11], [x - 5, y - 9], [x + 5, y - 9], [x + 8, y + 11]], c('#2a2a3a'));
    pxLine(x - 4, y - 6, x - 6, y + 10, c('#3a3a4e')); pxLine(x + 4, y - 6, x + 6, y + 10, c('#3a3a4e'));
    bMass(x, y - 14, 6, 6, ['#101018', '#1e1e2a', '#2e2e40', '#44445a'], K); bEll(x, y - 13, 4, 3, BA.D); rect(x - 2 + K.ex * .4, y - 13, 1, 1, '#ffe08a'); rect(x + 1 + K.ex * .4, y - 13, 1, 1, '#ffe08a');
    pxLine(x + 6, y - 2, x + 14, y - 24, BA.D, 3); pxLine(x + 6, y - 2, x + 14, y - 24, c('#6a5a40')); pxLine(x + 14, y - 24, x + 18 + sw, y - 22, c('#6a5a40'));
    const lx = x + 18 + sw, ly = y - 16, g = K.arm ? '#ffffff' : (((t * 8) | 0) % 5 ? '#ffd27a' : '#fff0c0'); pxLine(lx, y - 22, lx, ly - 4, c('#4a4030'));
    if (!K.fl) { ctx.globalAlpha = .22; disc(lx, ly, 12, '#efb94a'); ctx.globalAlpha = 1; } rect(lx - 3, ly - 4, 6, 8, BA.D); rect(lx - 2, ly - 3, 4, 6, g); rect(lx - 3, ly - 5, 6, 1, c('#8a7a5a')); },
  // THE MOTHER CULTURE: a cracked dish rim around a swelling colony, nodules that pulse, tendrils feeling the air
  14(b, x, y, t, K) { const c = K.c, F = BA.flesh, R = 15 + Math.sin(t * 1.8);
    bEll(x, y + 6, 19, 7, BA.D); bEll(x, y + 6, 18, 6, c('#3a4a4e')); bEll(x, y + 5, 16, 4, c('#9ab8c0')); bEll(x, y + 5, 15, 3, c('#2a3a2a'));
    for (let i = 0; i < 6; i++) { const a = i * 1.047 + t * .4, l = 10 + Math.sin(t * 3 + i) * 3; pxLine(x + Math.cos(a) * 8, y - 2 + Math.sin(a) * 4, x + Math.cos(a) * (8 + l), y - 2 + Math.sin(a) * 4 - l * .5, c(F[2]), 2); }
    bMass(x, y - 2, R * .7, R * .55, F, K); const nod = [[-6, -5], [5, -7], [-1, 1], [7, 0], [-8, 2]];
    nod.forEach(([dx, dy], i) => { const s = 2 + Math.sin(t * 4 + i) * .8; bEll(x + dx, y + dy - 2, s + 1, s + 1, BA.D); bEll(x + dx, y + dy - 2, s, s, c(i % 2 ? '#a8c060' : F[4])); });
    disc(x + K.ex * .6, y - 4 + K.ey * .5, 3, BA.D); disc(x + K.ex * .6, y - 4 + K.ey * .5, 2, K.arm ? '#ffffff' : '#d8f060'); },
  // THE QUARANTINE WARDEN: a sealed hazmat suit grown huge, a round gas-mask visor, a siren turning on its helmet
  15(b, x, y, t, K) { const c = K.c, Y = ['#3a3010', '#7a6a20', '#c8a830', '#e8d060', '#f8f0a0'];
    for (const s of [-1, 1]) { rect(x + s * 6 - 3, y + 6, 6, 9, BA.D); rect(x + s * 6 - 2, y + 7, 4, 7, c(Y[1])); rect(x + s * 6 - 3, y + 13, 6, 2, c('#2a2a2a')); }
    for (const s of [-1, 1]) { pxLine(x + s * 11, y - 8, x + s * 17, y + 4, BA.D, 5); pxLine(x + s * 11, y - 8, x + s * 17, y + 4, c(Y[2]), 3); bEll(x + s * 17, y + 5, 3, 3, c('#2a2a2a')); }
    bMass(x, y - 4, 12, 11, Y, K); rect(x - 8, y - 2, 16, 2, c('#2a2a2a')); for (let i = 0; i < 3; i++) rect(x - 5 + i * 4, y + 2, 2, 3, c(Y[0]));
    bEll(x, y - 10, 7, 6, BA.D); bEll(x, y - 10, 6, 5, c('#1a2a2e')); bEll(x - 2, y - 12, 2, 1, c('#5a8a9a')); disc(x - 3 + K.ex * .4, y - 9, 1.5, K.arm ? '#ffffff' : '#ff5a4a'); disc(x + 3 + K.ex * .4, y - 9, 1.5, K.arm ? '#ffffff' : '#ff5a4a');
    for (const s of [-1, 1]) { disc(x + s * 8, y - 5, 3, BA.D); disc(x + s * 8, y - 5, 2, c('#4a4a4a')); }
    const on = ((t * 4) | 0) % 2; rect(x - 2, y - 18, 4, 3, BA.D); rect(x - 1, y - 17, 2, 2, on ? C.red : '#5a1010'); if (on && !K.fl) { ctx.globalAlpha = .25; const a = t * 6; pxLine(x, y - 16, x + Math.cos(a) * 26, y - 16 + Math.sin(a) * 10, C.red, 3); ctx.globalAlpha = 1; } },
  // THE PROGENITOR: a pale core inside a turning double helix; everything else that grew came from this
  16(b, x, y, t, K) { const c = K.c; y += Math.sin(t * 1.4) * 2;
    for (let i = 0; i < 14; i++) { const k = i / 13, yy = y - 20 + k * 40, a = t * 2 + k * 6.283, w = 12 * Math.cos(a), z = Math.sin(a);
      if (z < 0) { rect(x + w - 1, yy - 1, 3, 3, BA.D); rect(x + w, yy, 2, 2, c(C.red)); rect(x - w - 1, yy - 1, 3, 3, BA.D); rect(x - w, yy, 2, 2, c(C.cyan)); }
      if (i % 2 === 0) { ctx.globalAlpha = .5; pxLine(x + w, yy + 1, x - w, yy + 1, c('#e8e0d0')); ctx.globalAlpha = 1; } }
    bEll(x, y, 9, 9, BA.D); bEll(x, y, 8, 8, c('#d8d0c4')); bEll(x - 2, y - 2, 5, 5, c('#f2ece4')); ringC(x, y, 10 + Math.sin(t * 5), c(K.arm ? '#ffffff' : '#c8b8a0'), 1);
    disc(x + K.ex * .5, y + K.ey * .5, 3, BA.D); disc(x + K.ex * .5, y + K.ey * .5, 2, K.arm ? '#ffffff' : C.violet);
    for (let i = 0; i < 14; i++) { const k = i / 13, yy = y - 20 + k * 40, a = t * 2 + k * 6.283, w = 12 * Math.cos(a), z = Math.sin(a);
      if (z >= 0) { rect(x + w - 1, yy - 1, 3, 3, BA.D); rect(x + w, yy, 2, 2, c(C.red)); rect(x - w - 1, yy - 1, 3, 3, BA.D); rect(x - w, yy, 2, 2, c(C.cyan)); } } },
});
