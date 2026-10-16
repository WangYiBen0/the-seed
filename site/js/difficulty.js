// ===== ACHROMA difficulty: four settings, their pixel emblems, and the selection screen =====
'use strict';
const DIFFS = [
  { id: 'easy', c: () => '#8fa77e', acc: () => '#d4e8b8', pips: 1,
    nm: N3('EASY', '簡單', 'イージー'), tag: N3('FOR THOSE WHO SIMPLY WANT TO SEE THE JOURNEY THROUGH.', '適合只想體驗遊戲流程的玩家。', 'ゲームの流れを体験したい人向け。'),
    mods: [['-', N3('BOSS BULLETS -20%', '頭目彈幕 -20%', 'ボスの弾幕 -20%')], ['-', N3('ENEMY HEALTH -20%', '怪物生命 -20%', '敵のHP -20%')], ['-', N3('START WITH +1 ARMOR', '初始護甲 +1', '初期アーマー +1')]],
    v: { barrage: .8, mhp: .8, bhp: 1, ink: 1, armor: 1, aggr: 1, wave: 1, wFloors: 1, wChest: 1, skillCd: 1 },
    art: ['...........', '...aa.aa...', '..aaa.aaa..', '....a.a....', '.....a.....', '.....a.....', '.....a.....', '.22..a..22.', '2112.2.2112', '11112.21111', '.111111111.'] },
  { id: 'classic', c: () => '#d08a3a', acc: () => '#ffd27a', pips: 2,
    nm: N3('CLASSIC', '經典', 'クラシック'), tag: N3('AN EXPERIENCE TUNED FOR BALANCE.', '專為平衡而設計的體驗。', 'バランスのために調整された体験。'),
    mods: [['=', N3('THE INTENDED BALANCE', '原汁原味的平衡', '本来のバランス')]],
    v: { barrage: 1, mhp: 1, bhp: 1, ink: 1, armor: 0, aggr: 1, wave: 1, wFloors: 1, wChest: 1, skillCd: 1 },
    art: ['....222....', '...2...2...', '..1111111..', '..1.....1..', '..1..a..1..', '..1.aaa.1..', '..1.aba.1..', '..1..b..1..', '..1111111..', '...2...2...', '....222....'] },
  { id: 'hard', c: () => '#c8602c', acc: () => '#ffb070', pips: 3,
    nm: N3('HARD', '困難', 'ハード'), tag: N3('A HARDER ROAD, A GREATER SENSE OF ACHIEVEMENT.', '更艱難的旅程，更強烈的成就感。', 'より険しい道、より大きな達成感。'),
    mods: [['+', N3('BOSS HEALTH +25%', '頭目生命 +25%', 'ボスのHP +25%')], ['+', N3('BOSS BULLETS +10%', '頭目彈幕 +10%', 'ボスの弾幕 +10%')], ['+', N3('ENEMY HEALTH +25%', '怪物生命 +25%', '敵のHP +25%')], ['+', N3('PARTS GAINED -40%', '零件獲取 -40%', 'パーツ獲得 -40%')]],
    v: { barrage: 1.1, mhp: 1.25, bhp: 1.25, ink: .6, armor: 0, aggr: 1, wave: 1, wFloors: 0, wChest: 1, skillCd: 1 },
    art: ['...22222...', '..2111112..', '.211111112.', '.2aa111aa2.', '.2ab111ba2.', '.211121112.', '..2113112..', '...13331...', '...13331...', '....222....', '...........'] },
  { id: 'nightmare', c: () => '#a8403a', acc: () => '#e06a50', pips: 4,
    nm: N3('NIGHTMARE', '噩夢', 'ナイトメア'), tag: N3('MADE FOR THOSE WHO CHALLENGE THE IMPOSSIBLE.', '專為挑戰不可能的人而生。', '不可能に挑む者のために。'),
    mods: [['+', N3('BOSS HEALTH +35%', '頭目生命 +35%', 'ボスのHP +35%')], ['+', N3('BOSS BULLETS +20%', '頭目彈幕 +20%', 'ボスの弾幕 +20%')], ['+', N3('ENEMY HEALTH +30%', '怪物生命 +30%', '敵のHP +30%')], ['+', N3('MORE AGGRESSIVE FOES', '怪物攻擊慾望更強', '敵の攻撃性が上昇')], ['+', N3('WAVE SIZE +20%', '每波怪物數量 +20%', '1ウェーブの敵数 +20%')], ['+', N3('PARTS GAINED -50%', '零件獲取 -50%', 'パーツ獲得 -50%')]],
    v: { barrage: 1.2, mhp: 1.3, bhp: 1.35, ink: .5, armor: 0, aggr: 1.3, wave: 1.2, wFloors: 0, wChest: 0, skillCd: 1 },
    art: ['....aaa....', '...a...a...', '...a.a.a...', '....aaa....', '.aa..a..aa.', 'a..aa.aa..a', 'a.a.aaa.a.a', '.aaa...aaa.', '.....b.....', '.....b.....', '...........'] },
  { id: 'despair', c: () => '#c41e2a', acc: () => '#ff5a50', pips: 5,
    nm: Object.assign(N3('DESPAIR', '絕境', '絶境'), { zhs: '绝境' }), tag: Object.assign(N3('PURE MALICE. NO ONE SURVIVES.', '純粹的惡意。無人生還。', '純粋な悪意。生還者はいない。'), { zhs: '纯粹的恶意。无人生还。' }),
    mods: [['+', N3('EVERYTHING', '一切', 'すべて')]],
    v: { barrage: 1.7, mhp: 2, bhp: 2.2, ink: .45, armor: 0, aggr: 2.3, wave: 1.5, wFloors: 0, wChest: 0, skillCd: 1.5 },
    art: ['...11111...', '..1111311..', '.111113111.', '.133113331.', '.133121a31.', '.111222111.', '..1112111..', '...2.2.2...', '...12121...', '...........', '...........'] },
];
const DIFF_BY = {}; for (const d of DIFFS) DIFF_BY[d.id] = d;
const curDiff = () => DIFF_BY[(G && G.diff) || 'classic'] || DIFF_BY.classic;
// endless mode: each endless floor adds this much (x depth) to the value; the explorer's resolve brings 20% more enemies
const ENDLESS_GROW = { mhp: .35, bhp: .35, barrage: .06, aggr: .08, wave: .07 };
// the pace of fire: the barrage value only ever slows patterns down (easy), it never speeds them up; harder difficulties add bullets instead
const bpace = () => Math.min(1, diffV('barrage'));
function diffV(k) { let v = curDiff().v[k]; const e = G && G.endless;
  if (e && ENDLESS_GROW[k]) v *= 1 + ENDLESS_GROW[k] * e; if (k === 'barrage') v = Math.min(v, 3);
  if (k === 'wave' && G && G.buffs && G.buffs.resolve) v *= 1.2;
  // Health keeps scaling, but simulation density/aggression has a finite budget.
  if (e && k === 'wave') v = Math.min(v, 3); if (e && k === 'aggr') v = Math.min(v, 4); return v; }

// ---- the small icons: 11x11, bone and shadow with one accent each (the large medallions are in js/look.js) ----
function drawDiffIcon(id, x, y, sc = 1, t = 0, dim, outC, mono) {
  const d = DIFF_BY[id] || DIFF_BY.classic, art = d.art, T = { '1': dim ? '#57534c' : '#cfc6b4', '2': dim ? '#3a3732' : '#7d766a', '3': '#0d0c0b', a: dim ? '#4a4741' : d.c(), b: dim ? '#5a5650' : d.acc() };
  const ox = id === 'easy' && !dim ? Math.round(Math.sin(t * 1.6) * .4) * sc : 0, drip = ((t * 2.5) | 0) % 3;
  for (let pass = 0; pass < 2; pass++) for (let j = 0; j < art.length; j++) for (let i = 0; i < art[j].length; i++) { let ch = art[j][i]; if (ch === '.') continue;
    if (id === 'nightmare' && ch === 'b' && !dim && j - 8 !== drip % 2) continue;
    const X = Math.round(x + (j < 7 ? ox : 0) + i * sc), Y = Math.round(y + j * sc);
    if (pass === 0) { ctx.fillStyle = outC || '#050505'; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) ctx.fillRect(X + dx * sc, Y + dy * sc, sc, sc); continue; }
    let c = T[ch]; if (!dim) { if (id === 'classic' && ch !== '1' && ch !== '2' && Math.sin(t * 13 + j * 2) > .5) c = ch === 'a' ? T.b : T.a; if ((id === 'hard' || id === 'despair') && ch === 'a' && Math.sin(t * 2.6) > .4) c = T.b; }
    ctx.fillStyle = mono || c; ctx.fillRect(X, Y, sc, sc); }
}
// small framed badge (in-game, left of the map; also on the settlement screen)
function drawDiffBadge(id, x, y, t) { const d = DIFF_BY[id] || DIFF_BY.classic;
  rect(x - 1, y - 1, 17, 17, '#050505'); box(x, y, 15, 15, '#0d0c0b', '#36322d'); rect(x, y, 15, 1, d.c()); drawDiffIcon(d.id, x + 2, y + 2, 1, t);
  const pw = d.pips * 3 - 1, px0 = x + Math.round((15 - pw) / 2); for (let i = 0; i < d.pips; i++) rect(px0 + i * 3, y + 16, 2, 1, d.c()); }

// ================= the difficulty window: five cards over the camp; the chosen one sends the truck out =================
const DSEL = { sel: 1, onDone: null, t: 0, hits: [], hover: -1, pick: null };
const dMod = i => ((i % DIFFS.length) + DIFFS.length) % DIFFS.length;
function diffCur() { return dMod(DSEL.sel); }
// onDone: something else to start instead of a normal run (the boss test passes its own)
function openDiffSelect(onDone) { DSEL.sel = Math.max(0, DIFFS.findIndex(d => d.id === (SET.diff || 'classic'))); DSEL.onDone = onDone || null; DSEL.t = 0; DSEL.hover = -1; goPage('difficulty'); }
function stepDiff(d) { DSEL.sel = dMod(DSEL.sel + d); AU.play('menu', .85 + DSEL.sel * .14); }
function startRunFromCamp() { AU.init(); AU.startDrone(); newRun(); Input.down = false; LAUNCH.inT = 0; AU.play('select'); if (SET.hints === undefined) openHintQ(); }
function pickDiff() { SET.diff = DIFFS[diffCur()].id; saveSettings(); AU.play('menuOk');
  if (DSEL.onDone) { const f = DSEL.onDone; DSEL.onDone = null; AU.init(); AU.startDrone(); f(); Input.down = false; LAUNCH.inT = 0; return; }
  LAUNCH.fn = startRunFromCamp; launchRun(); }
function diffWin() { const w = Math.min(W - 32, 430), h = 232; return { x: Math.round((W - w) / 2), y: Math.round((H - h) / 2) - 2, w, h }; }
function diffCard(i) { const r = diffWin(), n = DIFFS.length, gap = 6, cw = Math.floor((r.w - 20 - gap * (n - 1)) / n); return { x: r.x + 10 + i * (cw + gap), y: r.y + 32, w: cw, h: 96 }; }
function updateDiffSelect(rdt) {
  DSEL.t += rdt;
  if (pressed('KeyA') || pressed('ArrowLeft') || Input.wheel < 0) stepDiff(-1);
  if (pressed('KeyD') || pressed('ArrowRight') || Input.wheel > 0) stepDiff(1);
  DSEL.hover = -1; for (let i = 0; i < DIFFS.length; i++) if (inR(diffCard(i), Input.mx, Input.my)) DSEL.hover = i;
  if (Input.clicked) { const h = DSEL.hits.find(q => inR(q, Input.mx, Input.my)); if (h) { Input.clicked = false; h.f(); return; }
    if (DSEL.hover >= 0) { Input.clicked = false; if (DSEL.hover === DSEL.sel) pickDiff(); else { DSEL.sel = DSEL.hover; AU.play('menu', .85 + DSEL.sel * .14); } return; }
    if (!inR(diffWin(), Input.mx, Input.my)) { Input.clicked = false; backPage(); return; } }
  if (pressed('Enter') || pressed('Space') || pressed('KeyE')) { pickDiff(); return; }
  if (pressed('Escape')) backPage();
}
function pxEllipse(x, y, rx, ry, c, n = 48) { for (let i = 0; i < n; i++) { const a = i / n * 6.2832; rect(Math.round(x + Math.cos(a) * rx), Math.round(y + Math.sin(a) * ry), 1, 1, c); } }
function pxDiamond(x, y, r, c) { if (r <= 0) return; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.fill(); }
function drawDiffSelect(t) {
  const r = diffWin(), d = DIFFS[diffCur()], c = d.c(), k = easeOut(clamp(DSEL.t / .25, 0, 1)), yo = Math.round((1 - k) * 8); DSEL.hits = [];
  const invasion = typeof RUN_MODE !== 'undefined' && RUN_MODE === 'invade', ivd = invasion ? ivDifficulty(d.id) : null;
  ctx.globalAlpha = k; winBackdrop(.7);
  const cb = { x: r.x + r.w - 20, y: r.y + 4, w: 14, h: 14, f: () => backPage() }; DSEL.hits.push(cb);
  ctx.save(); ctx.translate(0, yo); winFrame(r.x, r.y, r.w, r.h, c, L('diffTitle'), { closeBox: cb, kicker: 'THREAT LEVEL' });
  DIFFS.forEach((dd, i) => { const q = diffCard(i), on = i === diffCur(), hv = i === DSEL.hover && !on && !TOUCH.on, cc = dd.c();
    rect(q.x, q.y, q.w, q.h, on ? thA(cc, .09) : hv ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.25)'); box(q.x, q.y, q.w, q.h, null, on ? thA(cc, .7) : hv ? TH.line2 : TH.line); if (on) rect(q.x, q.y, q.w, 1, cc);
    const sc = 2, ix = Math.round(q.x + q.w / 2 - 25), iy = q.y + 7; drawDiffEmblem(dd.id, ix, iy, sc, t, !on && !hv);
    const nm = (invasion ? 'D' + ivDifficulty(dd.id).danger + ' ' : '') + tr(dd.nm); text(fitText(nm, q.w - 6), q.x + q.w / 2, q.y + 62 - (isCJK(nm) ? 1 : 0), on ? TH.bone : hv ? TH.bone2 : TH.dim, 1, 'center');
    for (let p2 = 0; p2 < DIFFS.length; p2++) rect(Math.round(q.x + q.w / 2 - 12 + p2 * 5), q.y + 75, 4, 2, p2 < dd.pips ? (on ? cc : '#5a554d') : '#1f1d1a');
    { const s2 = '×' + (PROOF_BY_DIFF[dd.id] || 3), w2 = textW(s2) + 11, px = Math.round(q.x + q.w / 2 - w2 / 2); drawProof(px, q.y + 82); text(s2, px + 11, q.y + 83, on ? TH.bone : TH.faint); } });
  const dy = r.y + 140, split = r.x + Math.round(r.w * .6); rect(split, dy, 1, r.h - 140 - 30, TH.line);
  { let y = dy; text((invasion ? 'D' + ivd.danger + ' · ' : '') + tr(d.nm), r.x + 12, y, c, 1); y += lineH() + 2;
    const tag = invasion ? L('iv_diffTag', Math.round(ivd.hp * 100), ivd.events, ivd.bosses) : tr(d.tag);
    wrapW(tag, split - r.x - 22).slice(0, 4).forEach(l => { text(l, r.x + 12, y, TH.bone2); y += lineH(); }); }
  { let y = dy, x = split + 12; text(L('dw_reward'), x, y, TH.faint); y += lineH() + 3;
    const s1 = L('d_proof', PROOF_BY_DIFF[d.id] || 3); drawProof(x, y); text(fitText(s1, r.x + r.w - x - 22), x + 12, y + 1 - (isCJK(s1) ? 1 : 0), TH.bone); y += lineH() + 3;
    if (typeof evOpen === 'function' && evOpen()) { const s2 = L('dw_mat', EV_MAT[d.id] || 0); rect(x + 1, y + 2, 7, 5, '#3a2a14'); rect(x + 1, y + 2, 7, 1, '#8a6a30'); text(fitText(s2, r.x + r.w - x - 22), x + 12, y, TH.bone2); y += lineH() + 3; }
    }
  const by = r.y + r.h - 24, bk = { x: r.x + 12, y: by, w: 72, h: 16, f: () => backPage() }, go = { x: r.x + r.w - 12 - 128, y: by, w: 128, h: 16, f: () => pickDiff() }; DSEL.hits.push(bk, go);
  drawBtn(bk.x, bk.y, bk.w, bk.h, L('back'), !TOUCH.on && inR(bk, Input.mx, Input.my - yo), TH.bone2); drawBtn(go.x, go.y, go.w, go.h, L('dw_go', tr(d.nm)), true, c);
  if (!TOUCH.on) text(L('dw_hint'), r.x + r.w / 2 - 24, by + 4, TH.faint, 1, 'center');
  ctx.restore(); ctx.globalAlpha = 1;
}
