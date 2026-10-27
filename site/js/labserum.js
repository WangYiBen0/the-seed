// ===== TheSeed: the broken lab (突入探索 special room). On a cracked test bench stands one test tube of an experimental serum (one of
// three, random). Injecting it brings a drawback for the next 3 fights, then the drawback goes and a permanent gift stays for the run.
//   α: for 3 fights, health lost is taken from maximum health instead; then +25% damage for the run
//   β: for 3 fights, attack speed -50%; then +30% attack speed for the run
//   Ω: for 3 fights, no dash; then +1 maximum armor for the run
// A fight = clearing a room that had to be fought: a combat room, an alarm (trial) room, the boss room.
'use strict';
Object.assign(STR, {
  lab_room: ['BROKEN LAB', '破碎的實驗室', '壊れた実験室', '破碎的实验室'],
  lab_prompt: ['EXPERIMENTAL SERUM?', '實驗血清？', '実験血清？', '实验血清？'], lab_sub: ['A TEST TUBE ON THE CRACKED BENCH', '裂開的試驗台上有一支試管', 'ひび割れた実験台に試験管', '裂开的试验台上有一支试管'],
  lab_empty: ['THE TUBE IS EMPTY', '試管已經空了', '試験管は空だ', '试管已经空了'],
  lab_inject: ['INJECT', '注射', '注射する', '注射'], lab_leave: ['LEAVE IT', '放著不動', '置いておく', '放着不动'],
  lab_busy: ['ANOTHER EXPERIMENTAL SERUM IS STILL AT WORK', '體內還有一支實驗血清正在起效', '別の実験血清がまだ効いている', '体内还有一支实验血清正在起效'],
  lab_down: ['DRAWBACK · NEXT 3 FIGHTS', '副作用 · 接下來 3 次戰鬥', '副作用・次の3戦闘', '副作用 · 接下来 3 次战斗'], lab_up: ['THEN, FOR THE WHOLE RUN', '之後 · 本局永久', 'その後・この出撃中ずっと', '之后 · 本局永久'],
  lab_left: ['{0}: {1} FIGHTS LEFT', '{0}：還剩 {1} 次戰鬥', '{0}：残り{1}戦闘', '{0}：还剩 {1} 次战斗'],
  lab_done: ['{0} SETTLED: {1}', '{0} 已穩定：{1}', '{0}が安定：{1}', '{0} 已稳定：{1}'],
  lab_inj: ['INJECTED: {0}', '已注射：{0}', '注射：{0}', '已注射：{0}'], lab_noDash: ['CANNOT DASH (EXPERIMENTAL SERUM Ω)', '無法衝刺（實驗血清Ω）', 'ダッシュ不可（実験血清Ω）', '无法冲刺（实验血清Ω）'],
  lab_mhp: ['MAX HEALTH -{0}', '生命上限 -{0}', '最大HP -{0}', '生命上限 -{0}'],
});
const EXP = {
  a: { n: N4('EXPERIMENTAL SERUM α', '實驗血清α', '実験血清α', '实验血清α'), c: '#e0483e', glyph: 'α',
    down: N4('HEALTH YOU LOSE IS TAKEN FROM MAXIMUM HEALTH INSTEAD.', '損失血量時，改為損失血量上限。', '体力を失う代わりに最大体力を失う。', '损失血量时，改为损失血量上限。'),
    up: N4('DAMAGE +25%.', '傷害永久提升 25%。', 'ダメージ+25%。', '伤害永久提升 25%。') },
  b: { n: N4('EXPERIMENTAL SERUM β', '實驗血清β', '実験血清β', '实验血清β'), c: '#5ed0c8', glyph: 'β',
    down: N4('ATTACK SPEED -50%.', '攻擊速度降低 50%。', '攻撃速度-50%。', '攻击速度降低 50%。'),
    up: N4('ATTACK SPEED +30%.', '攻擊速度永久提升 30%。', '攻撃速度+30%。', '攻击速度永久提升 30%。') },
  o: { n: N4('EXPERIMENTAL SERUM Ω', '實驗血清Ω', '実験血清Ω', '实验血清Ω'), c: '#c89aff', glyph: 'Ω',
    down: N4('YOU CANNOT DASH.', '無法衝刺。', 'ダッシュできない。', '无法冲刺。'),
    up: N4('MAXIMUM ARMOR +1.', '護甲上限永久 +1。', '最大アーマー+1。', '护甲上限永久 +1。') },
};
const EXP_IDS = Object.keys(EXP), EXP_FIGHTS = 3;
const expOn = id => !!(G && G.exp && G.exp.id === id && G.exp.left > 0);
const expPerm = id => (G && G.expPerm && G.expPerm[id]) | 0;
// ---------------- the room ----------------
SPECIALS.push('lab'); ROOM_MARK.lab = () => '#9fd8c8';
function labSetup(r, cx, cy) { G.inter.push({ kind: 'labvial', x: cx, y: cy, exp: choice(EXP_IDS), used: (G.labUsed || []).includes(exploreDepth()), room: r }); }
const _roomDecorLab = roomDecor; roomDecor = function (r, cx, cy) { if (r.type !== 'lab') return _roomDecorLab(r, cx, cy);
  const d = WORLD.dctx; if (!d) return; const rng = campRng((r.id + 1) * 577 + (G.floor + 1) * 13), R = (a, b) => a + rng() * (b - a), px = (x, y, c, w = 1, h = 1) => { d.fillStyle = c; d.fillRect(Math.round(x), Math.round(y), w, h); };
  // floor tiles of a clean room, gone dirty; a pale chemical spill; glass everywhere; a fallen stool
  for (let i = -3; i <= 3; i++) for (let j = -2; j <= 2; j++) if ((i + j) & 1) px(cx + i * 12 - 6, cy + j * 12 - 6, 'rgba(200,230,226,.04)', 12, 12);
  for (let j = -4; j <= 4; j++) { const w = Math.round(16 * Math.sqrt(Math.max(0, 1 - (j / 4.5) ** 2))); px(cx + 18 - w, cy + 14 + j, 'rgba(120,200,180,.10)', w * 2, 1); }
  for (let i = 0; i < 40; i++) { const a = rng() * 6.283, q = 8 + rng() * 46; px(cx + Math.cos(a) * q, cy + 6 + Math.sin(a) * q * .6, rng() < .5 ? 'rgba(220,240,244,.45)' : 'rgba(150,180,190,.35)', 1 + (rng() * 2 | 0), 1); }
  for (let i = 0; i < 6; i++) { const x = cx + R(-50, 50), y = cy + R(-30, 34); px(x, y, 'rgba(90,110,100,.4)', 4, 1); px(x + 1, y + 1, 'rgba(60,70,64,.4)', 2, 1); }
  px(cx - 34, cy + 18, 'rgba(70,64,58,.7)', 7, 2); px(cx - 33, cy + 20, 'rgba(50,46,42,.7)', 1, 4); px(cx - 28, cy + 20, 'rgba(50,46,42,.7)', 1, 4); };
// the bench and the tube (world pass)
function drawLabVial(it, x, y, t) { const e = EXP[it.exp], c = e.c;
  shadow(x, y + 7, 26);
  rect(x - 16, y - 2, 32, 4, '#5c6266'); rect(x - 16, y - 2, 32, 1, '#9aa4a8'); rect(x - 14, y + 2, 2, 7, '#3c4246'); rect(x + 12, y + 2, 2, 7, '#3c4246');
  rect(x + 3, y - 2, 1, 4, '#22282a'); rect(x + 4, y + 1, 3, 1, '#22282a'); rect(x - 9, y - 1, 1, 3, '#22282a');                       // the crack
  rect(x - 13, y - 4, 4, 2, 'rgba(200,230,240,.5)'); rect(x + 8, y - 3, 3, 1, 'rgba(200,230,240,.5)');                                  // broken glass on top
  // the rack and the tube
  rect(x - 5, y - 4, 10, 2, '#7a6a5a'); const tx = x - 1, ty = y - 15;
  rect(tx - 1, ty, 4, 12, '#0b0e10'); rect(tx, ty + 1, 2, 10, 'rgba(210,235,240,.35)');
  if (!it.used) { const lv = 6 + Math.sin(t * 2) * .5; rect(tx, ty + 11 - lv, 2, lv, c); rect(tx, ty + 11 - lv, 1, 1, '#ffffff');
    ctx.globalAlpha = .25 + .15 * Math.sin(t * 3); disc(tx + 1, ty + 6, 7, c); ctx.globalAlpha = 1;
    if (((t * 2) | 0) % 2) rect(tx + 1, ty - 3 - ((t * 6) % 3), 1, 1, c); }
  rect(tx - 1, ty - 1, 4, 1, '#c9c1b2'); }
const _drawInterLab = drawInter; drawInter = function (cx, cy) { _drawInterLab(cx, cy); for (const it of G.inter) if (it.kind === 'labvial') drawLabVial(it, Math.round(it.x - cx), Math.round(it.y - cy), G.time); };
const _updateInterLab = updateInter; updateInter = function (dt) { _updateInterLab(dt); if (G.state !== 'play' || G.prompt) return; const p = G.p;
  for (const it of G.inter) { if (it.kind !== 'labvial' || dist(p.x, p.y, it.x, it.y) > 22) continue;
    if (it.used) { G.prompt = { x: it.x, y: it.y - 10, t: L('lab_room'), sub: L('lab_empty'), c: '#57524a' }; break; }
    G.prompt = { x: it.x, y: it.y - 10, t: L('lab_prompt'), sub: L('lab_sub'), c: EXP[it.exp].c }; if (pressed('KeyE')) openLab(it); break; } };
// ---------------- the choice ----------------
const LABQ = { it: null, t: 0, sel: 0, hits: [] };
function openLab(it) { Object.assign(LABQ, { it, t: 0, sel: 0, hits: [], lmx: Input.mx, lmy: Input.my }); G.state = 'labq'; Input.clicked = false; AU.play('menuOk'); }
function labClose() { G.state = 'play'; LABQ.it = null; Input.clicked = false; Input.down = false; }
function labInject() { const it = LABQ.it; if (G.state !== 'labq' || !it || it.used || !EXP[it.exp] || (G.labUsed || []).includes(exploreDepth())) { if (G.state === 'labq') labClose(); return; }
  const id = it.exp, p = G.p; if (G.exp && G.exp.left > 0) { notify(L('lab_busy'), C.red); AU.play('locked'); return; }
  it.used = true; (G.labUsed = G.labUsed || []).push(exploreDepth()); G.exp = { id, left: EXP_FIGHTS }; recomputeStats(); labClose();
  const c = EXP[id].c; AU.play('inject'); AU.play('dialysis', 1.2, .6); flash(c, .35, true); chroma(.8, true); ringFx(p.x, p.y, 30, c, .5, 2); burst(p.x, p.y, 20, c, 110, .5);
  notify(L('lab_inj', tr(EXP[id].n)), c); saveRun(); }
const _updateLab = update; update = function (rdt) { if (!G || G.state !== 'labq') return _updateLab(rdt); if (!LABQ.it || !EXP[LABQ.it.exp]) { labClose(); return; } LABQ.t += rdt; updateParticles(rdt);
  if (pressed('Escape')) { labClose(); AU.play('menu', .8); return; }
  if (pressed('KeyA') || pressed('ArrowLeft')) LABQ.sel = 0; if (pressed('KeyD') || pressed('ArrowRight')) LABQ.sel = 1;
  const moved = Input.mx !== LABQ.lmx || Input.my !== LABQ.lmy; LABQ.lmx = Input.mx; LABQ.lmy = Input.my;
  const hv = LABQ.hits.findIndex(b => inR(b, Input.mx, Input.my)); if (hv >= 0 && moved && !TOUCH.on) LABQ.sel = hv;
  if (LABQ.t < .3) { Input.clicked = false; return; }
  const pick = Input.clicked && hv >= 0 ? hv : pressed('Enter') || pressed('Space') || pressed('KeyE') ? LABQ.sel : -1; Input.clicked = false;
  if (pick === 0) labInject(); else if (pick === 1) { labClose(); AU.play('menu', .8); } };
const _renderLab = render; render = function () { _renderLab(); if (G && G.state === 'labq' && LABQ.it) drawLabQ(); else if (G && G.p && G.exp && G.exp.left > 0 && (G.state === 'play' || G.state === 'build')) drawExpTag(); };
function drawLabQ() { const e = EXP[LABQ.it.exp], c = e.c, k = easeOut(clamp(LABQ.t / .3, 0, 1)), w = 250, lh = lineH(), dl = wrapW(tr(e.down), w - 40), ul = wrapW(tr(e.up), w - 40);
  const h = 70 + (dl.length + ul.length) * lh + 50, x = Math.round(W / 2 - w / 2), y = Math.round(H / 2 - h / 2 + (1 - k) * 8); LABQ.hits = [];
  ctx.globalAlpha = .65 * k; rect(0, 0, W, H, '#000'); ctx.globalAlpha = k; frame2(x, y, w, h, c, L('lab_prompt'));
  // the tube, large, and its name
  { const tx = x + 22, ty = y + 26; rect(tx - 2, ty, 8, 30, '#0b0e10'); rect(tx, ty + 2, 4, 26, 'rgba(210,235,240,.3)'); rect(tx, ty + 10, 4, 18, c); rect(tx, ty + 10, 1, 18, 'rgba(255,255,255,.5)'); rect(tx - 2, ty - 2, 8, 2, '#c9c1b2'); }
  textS(tr(e.n), x + 40, y + 26, c, 1.5); text(L('lab_sub'), x + 40, y + 44 - (isCJK(L('lab_sub')) ? 1 : 0), '#6e675c');
  let yy = y + 62; text(L('lab_down'), x + 40, yy, C.red); yy += lh; dl.forEach(l => { text(l, x + 40, yy, '#c9c1b2'); yy += lh; }); yy += 4;
  text(L('lab_up'), x + 40, yy, TH.gold); yy += lh; ul.forEach(l => { text(l, x + 40, yy, '#e6dfd1'); yy += lh; });
  if (G.exp && G.exp.left > 0) text(fitText(L('lab_busy'), w - 20), x + w / 2, y + h - 40, C.red, 1, 'center');
  const bw = Math.floor((w - 34) / 2); [[0, 'lab_inject', c], [1, 'lab_leave', TH.bone2]].forEach(([j, kk, cc]) => { const b = { x: x + 12 + j * (bw + 10), y: y + h - 26, w: bw, h: 18 }; LABQ.hits.push(b); drawBtn(b.x, b.y, b.w, b.h, L(kk), LABQ.sel === j, cc); });
  ctx.globalAlpha = 1; }
// the running serum, a small tag under the vitals
function drawExpTag() { const e = EXP[G.exp.id], s = L('lab_left', tr(e.n), G.exp.left), w = textW(s) + 14, x = 8, y = 62;
  rect(x, y, w, 12, 'rgba(10,9,8,.84)'); box(x, y, w, 12, null, thA(e.c, .7)); rect(x, y, 2, 12, e.c); text(s, x + 7, y + 3 - (isCJK(s) ? 1 : 0), e.c); }
// ---------------- the effects ----------------
// Include permanent armor before osteolysis/dialysis apply and clamp current armor.
const _baseStatsLab = baseStats; baseStats = function () { const S = _baseStatsLab(); if (G && G.mode !== 'invade') S.armor += expPerm('o'); return S; };
const _recomputeLab = recomputeStats; recomputeStats = function () { _recomputeLab(); const S = G && G.S, p = G && G.p; if (!S || !p) return;
  if (expPerm('a')) S.dmg *= Math.pow(1.25, expPerm('a'));
  if (expPerm('b')) S.rate *= Math.pow(1.3, expPerm('b'));
  if (expOn('b')) S.rate *= .5; };
// α: health lost goes from maximum health instead (while maximum health can still go down; below that it is ordinary damage)
const _hurtPlayerLab = hurtPlayer; hurtPlayer = function (dmg, sx, sy, mechHit, pierce) { const p = G.p; if (!expOn('a') || !p || !p.alive || (typeof ivOn === 'function' && ivOn())) return _hurtPlayerLab(dmg, sx, sy, mechHit, pierce);
  const hp0 = p.hp; p.hp += 1000; const r = _hurtPlayerLab(dmg, sx, sy, mechHit, pierce); const lost = Math.max(0, hp0 + 1000 - p.hp); p.hp = hp0; if (!lost) return r;
  const m0 = p.maxHp; G.mhpLoss = (G.mhpLoss || 0) + lost; recomputeStats(); const drop = m0 - p.maxHp; if (drop < lost) G.mhpLoss -= lost - drop; recomputeStats(); p.hp = Math.min(p.hp, p.maxHp);
  if (drop > 0) { notify(L('lab_mhp', drop), EXP.a.c); floatText(p.x, p.y - 18, '-' + drop + ' MAX', EXP.a.c, 1, .8); }
  if (drop < lost) { p.inv = 0; return _hurtPlayerLab(lost - drop, sx, sy, true, true); }
  return r; };
// Ω: no dash while it works
const _updatePlayerLab = updatePlayer; updatePlayer = function (dt) { const p = G && G.p; if (p && expOn('o')) { p.dashCd = Math.max(p.dashCd || 0, .05); if (pressed('Space') || pressed('ShiftLeft') || Input.rclicked) { if (!(G.expDenyT > G.time)) { G.expDenyT = G.time + 1.2; notify(L('lab_noDash'), EXP.o.c); } } }
  return _updatePlayerLab(dt); };
// a fight is over: one step closer
function expBattle() { const x = G.exp; if (!x || !(x.left > 0)) return; x.left--; const e = EXP[x.id];
  if (x.left > 0) { notify(L('lab_left', tr(e.n), x.left), e.c); return; }
  G.expPerm = G.expPerm || {}; G.expPerm[x.id] = (G.expPerm[x.id] | 0) + 1; G.exp = null; recomputeStats(); if (x.id === 'o') G.p.armor = Math.min(G.p.maxArmor, G.p.armor + 1);
  const p = G.p; AU.play('chipGet'); flash(e.c, .3, true); ringFx(p.x, p.y, 36, e.c, .6, 3); notify(L('lab_done', tr(e.n), tr(e.up)), TH.gold); saveRun(); }
const _unlockRoomLab = unlockRoom; unlockRoom = function (r) { const was = r && r.active; _unlockRoomLab(r); if (was) expBattle(); };
// ---------------- the run save ----------------
const _newRunLab = newRun; newRun = function (...a) { const r = _newRunLab(...a); if (G) { G.exp = null; G.expPerm = {}; } return r; };
// Experiment state is saved/restored with the core run before stats and floor generation.
