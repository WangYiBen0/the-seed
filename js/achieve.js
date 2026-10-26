// ===== TheSeed achievements and titles; the 入侵抵抗 result (same end screen and score shape as 突入探索) and its leaderboard =====
// Achievements live in the girls' progress (gp.ach, saved to DZMM KV with it): { done: { id: time }, seen: [ids], title, n: counters }.
// Some pay embers, some give a title. A title can be worn (设置 → 成就); it follows your name in the world channel.
'use strict';
Object.assign(STR, {
  ach_title: ['ACHIEVEMENTS', '成就', '実績', '成就'], ach_got: ['ACHIEVEMENT: {0}', '達成成就：{0}', '実績解除：{0}', '达成成就：{0}'], ach_wear: ['WEAR', '佩戴', '装備', '佩戴'], ach_worn: ['WORN', '佩戴中', '装備中', '佩戴中'],
  ach_off: ['TAKE OFF', '卸下', '外す', '卸下'], ach_lost: ['PLACE LOST', '排名已失去', '順位を失った', '排名已失去'], my_id: ['MY ID', '我的 ID', '自分のID', '我的 ID'],
  ach_event: ['LIMITED-TIME EVENT REWARD', '限時活動獲得', '期間限定イベントで獲得', '限时活动获得'], ach_locked: ['LOCKED', '未解鎖', '未解放', '未解锁'],
  my_idCopy: ['ID COPIED', 'ID 已複製', 'IDをコピーした', 'ID 已复制'], my_idFail: ['COPY FAILED: SELECT IT BY HAND', '複製失敗，請手動選取', 'コピーできなかった', '复制失败，请手动选取'], ach_titleR: ['TITLE', '稱號', '称号', '称号'], ach_none: ['NO TITLE WORN', '未佩戴稱號', '称号なし', '未佩戴称号'],
  bd_top: ['BREACH & EXPLORE', '突入探索', '突入探索', '突入探索'], bd_endless: ['BREACH · ENDLESS', '突入探索 - 無盡', '突入探索・無限', '突入探索 - 无尽'], bd_invade: ['INVASION RESISTANCE', '入侵抵抗', '侵攻抵抗', '入侵抵抗'], bd_invadeE: ['INVASION · ENDLESS', '入侵抵抗 - 無盡', '侵攻抵抗・無限', '入侵抵抗 - 无尽'],
  bd_wave: ['WAVE', '波次', '波', '波次'], iv_waveRow: ['WAVES HELD', '堅守波次', '耐えた波', '坚守波次'], iv_lvRow: ['LEVEL', '等級', 'レベル', '等级'],
});
// ---- titles: rarity 0 common (blue), 1 rare (orange), 2 legendary (red with a white glow) ----
const TITLES = {
  t_ex5: { r: 1, n: IZ('DESPAIR WALKER', '绝境行者') }, t_score: { r: 1, n: IZ('EMBER OF DAWN', '破晓余烬') },
  t_ex10: { r: 0, n: IZ('ASH VANGUARD', '灰烬先锋') }, t_ex3: { r: 1, n: IZ('KEEPER OF THE LAST FIRE', '余火守望') }, t_ex1: { r: 2, n: IZ('LORD OF THE FIRST FLAME', '初火之主') },
  t_en10: { r: 0, n: IZ('CORRIDOR WALKER', '回廊行者') }, t_en3: { r: 1, n: IZ('ABYSS GAZER', '深渊凝视') }, t_en1: { r: 2, n: IZ('UNDYING NIGHT', '永夜不灭') },
  t_iv5: { r: 1, n: IZ('THE LINE THAT HOLDS', '不落防线') }, t_iv10: { r: 0, n: IZ('OUTPOST VETERAN', '前哨老兵') }, t_iv3: { r: 1, n: IZ('IRON WILL', '钢铁意志') }, t_iv1: { r: 2, n: IZ('THE LAST BASTION', '最后的堡垒') },
  t_sterile: { r: 0, n: IZ('STEADY HAND', '冷静处置') }, t_bonds: { r: 0, n: IZ('TRUSTWORTHY', '值得托付') },
  t_variety: { r: 0, n: IZ('VERSATILE', '多面适应') }, t_mastery: { r: 2, n: IZ('ULTIMATE ADAPTER', '极限适应者') },
  t_specialist: { r: 0, n: IZ('SPECIALIST', '专精者') }, t_storm: { r: 1, n: IZ('THROUGH THE BULLET RAIN', '弹雨独行') },
  t_burden: { r: 1, n: IZ('AGAINST THE ODDS', '逆境行者') }, t_five: { r: 2, n: IZ('BEYOND DESPAIR', '绝境之外') },
};
// special titles (rarity 3): given to particular players by their DZMM user id; the server (functions/world.js) holds the list and
// tells each player which ones they own (NET.specialTitles: null until it has answered)
TITLES.t_dev = { r: 3, special: true, n: IZ('DEVELOPER', '开发者') };
// given to players whose bug reports were confirmed: a gold-to-white gradient
TITLES.t_tester = { r: 3, special: true, n: IZ('TEST PIONEER', '测试先锋'), grad: [[0, '#fff6d8'], [.25, '#efb94a'], [.5, '#ffffff'], [.75, '#efb94a'], [1, '#fff6d8']] };
TITLES.t_traveler = { r: 3, special: true, activity: true, n: IZ('TERMINAL TRAVELER', '终末旅行者'), d: IZ('First 10 players to clear Explore · Despair with all 5 modifiers before Oct 22, 00:00 GMT+8', '限量任务：10月22日0点前，全服前10名通关突入探索·绝境·全部5修饰符'), breathe: true,
  grad: [[0, '#ffb7dd'], [.3, '#ffffff'], [.65, '#9cddff'], [1, '#ffe6a1']] };
const TITLE_C = ['#5ea8e0', '#ee8a34', '#e0483e', '#efb94a'];
// the server also says which leaderboard titles you hold right now (NET.rankTitles); they can be worn only while the place is held
const RANK_TITLES = new Set(['t_ex1', 't_ex3', 't_ex10', 't_en1', 't_en3', 't_en10', 't_iv1', 't_iv3', 't_iv10']);
function achRefreshTitles() { if (!NET.user || NET.off || NET.meBusy) return; NET.meBusy = true; NET.meAt = performance.now();
  worldFn('me').then(r => { NET.specialTitles = r && Array.isArray(r.titles) ? r.titles.filter(t => TITLES[t] && TITLES[t].special) : []; NET.rankTitles = r && Array.isArray(r.rank) ? r.rank.filter(t => RANK_TITLES.has(t)) : [];
    if (typeof ltOwnsTitle === 'function' && ltOwnsTitle()) NET.specialTitles = [...new Set([...NET.specialTitles, 't_traveler'])];
    const a = achData(); if (a.title && !achOwnsTitle(a, a.title)) { a.title = null; gpSave(); } }).catch(() => { }).finally(() => { NET.meBusy = false; }); }
const _netInitA = netInit; netInit = function () { _netInitA(); NET.specialTitles = null; NET.rankTitles = null; if (NET.user && !NET.off) achRefreshTitles(); else { NET.specialTitles = []; NET.rankTitles = []; } };
// ---- achievements: when each is checked is in the hooks below; c is a counter for progress, need its goal ----
const ACH_ROLES = IV_ROLES.map(r => r.id);
const ACH = [
  { id: 'ex_sterile', n: IZ('STERILE PROCEDURE', '无菌操作'), d: IZ('Explore · Classic+: defeat a boss without losing health or armor throughout the fight', '突入探索·经典及以上：整场 Boss 战未损失生命、护甲或临时护甲并获胜'), proof: 2, title: 't_sterile' },
  { id: 'all_bonds', n: IZ('THROUGH THICK AND THIN', '患难之交'), d: IZ('Reach maximum affection with every companion', '所有伙伴好感度达到上限'), proof: 2, title: 't_bonds', c: 'fullAff', need: SURV_IDS.length },
  { id: 'iv_variety', n: IZ('MANY STRENGTHS', '各有所长'), d: IZ('Resistance · Classic+: win with 6 different preferences', '入侵抵抗·经典及以上：使用 6 种不同偏好通关'), proof: 3, title: 't_variety', c: 'ivVariety', need: 6 },
  { id: 'iv_mastery', n: IZ('NO WEAK POINT', '没有短板'), d: IZ('Resistance · Despair: win with every preference', '入侵抵抗·绝境：使用全部偏好分别通关'), proof: 8, title: 't_mastery', c: 'ivMastery', need: ACH_ROLES.length },
  { id: 'iv_specialist', n: IZ('ONE TRUE CRAFT', '一技之长'), d: IZ('Resistance · Classic+: finish with 6 copies of one weapon; tiers may differ', '入侵抵抗·经典及以上：通关时携带 6 把同名武器，品质不限'), proof: 2, title: 't_specialist' },
  { id: 'iv_storm', n: IZ('EYE OF THE STORM', '风暴中心'), d: IZ('Resistance · Hard+: take no damage throughout wave 20 and win', '入侵抵抗·困难及以上：第 20 波全程未受到伤害并通关'), proof: 5, title: 't_storm' },
  { id: 'ex_pressure', n: IZ('RAISE THE STAKES', '主动加压'), d: IZ('Explore · Despair: clear with at least 1 modifier', '突入探索·绝境：携带至少 1 个修饰符通关'), proof: 2 },
  { id: 'ex_burden', n: IZ('CARRY THE WEIGHT', '负重前行'), d: IZ('Explore · Despair: clear with at least 3 modifiers', '突入探索·绝境：携带至少 3 个修饰符通关'), proof: 3, title: 't_burden' },
  { id: 'ex_five', n: IZ('FIVEFOLD DESPAIR', '五重绝境'), d: IZ('Explore · Despair: clear with all 5 modifiers', '突入探索·绝境：携带全部 5 个修饰符通关'), proof: 5, title: 't_five' },
  { id: 'ex_first', n: IZ('FIRST BREACH', '初次突破'), d: IZ('Clear 突入探索 on any difficulty', '突入探索首次通关任意难度'), proof: 1, c: 'exClr', need: 1 },
  { id: 'ex_despair1', n: IZ('THROUGH DESPAIR', '穿越绝境'), d: IZ('Clear 突入探索 on Despair', '突入探索首次通关绝境'), proof: 5, c: 'exDes', need: 1 },
  { id: 'ex_despair5', n: IZ('DESPAIR REGULAR', '绝境常客'), d: IZ('Clear 突入探索 on Despair 5 times', '突入探索通关绝境 5 次'), title: 't_ex5', c: 'exDes', need: 5 },
  { id: 'ex_score', n: IZ('TWO HUNDRED THOUSAND', '二十万分'), d: IZ('Score 200,000 in one non-endless 突入探索 run', '突入探索非无尽模式单局分数达到 200,000'), title: 't_score' },
  { id: 'ex_top10', n: IZ('ON THE BOARD', '榜上有名'), d: IZ('Top 10 of the 突入探索 board', '突入探索非无尽排行榜前 10 名'), title: 't_ex10' },
  { id: 'ex_top3', n: IZ('PODIUM', '三甲之列'), d: IZ('Top 3 of the 突入探索 board', '突入探索非无尽排行榜前 3 名'), title: 't_ex3' },
  { id: 'ex_top1', n: IZ('SUMMIT', '登顶'), d: IZ('First on the 突入探索 board', '突入探索非无尽排行榜第 1 名'), title: 't_ex1' },
  { id: 'en_top10', n: IZ('ENDLESS: ON THE BOARD', '无尽 · 榜上有名'), d: IZ('Top 10 of the endless board', '突入探索无尽排行榜前 10 名'), title: 't_en10' },
  { id: 'en_top3', n: IZ('ENDLESS: PODIUM', '无尽 · 三甲之列'), d: IZ('Top 3 of the endless board', '突入探索无尽排行榜前 3 名'), title: 't_en3' },
  { id: 'en_top1', n: IZ('ENDLESS: SUMMIT', '无尽 · 登顶'), d: IZ('First on the endless board', '突入探索无尽排行榜第 1 名'), title: 't_en1' },
  { id: 'iv_first', n: IZ('HELD THE LINE', '守住了'), d: IZ('Clear 入侵抵抗 on any difficulty', '入侵抵抗首次通关任意难度'), proof: 1, c: 'ivClr', need: 1 },
  { id: 'iv_despair1', n: IZ('DESPAIR DEFENCE', '绝境防线'), d: IZ('Clear 入侵抵抗 on Despair', '入侵抵抗首次通关绝境'), proof: 5, c: 'ivDes', need: 1 },
  { id: 'iv_despair5', n: IZ('IMPREGNABLE', '固若金汤'), d: IZ('Clear 入侵抵抗 on Despair 5 times', '入侵抵抗通关绝境 5 次'), title: 't_iv5', c: 'ivDes', need: 5 },
  { id: 'iv_top10', n: IZ('DEFENDERS: ON THE BOARD', '抵抗 · 榜上有名'), d: IZ('Top 10 of the 入侵抵抗 board', '入侵抵抗排行榜前 10 名'), title: 't_iv10' },
  { id: 'iv_top3', n: IZ('DEFENDERS: PODIUM', '抵抗 · 三甲之列'), d: IZ('Top 3 of the 入侵抵抗 board', '入侵抵抗排行榜前 3 名'), title: 't_iv3' },
  { id: 'iv_top1', n: IZ('DEFENDERS: SUMMIT', '抵抗 · 登顶'), d: IZ('First on the 入侵抵抗 board', '入侵抵抗排行榜第 1 名'), title: 't_iv1' },
];
const ACH_BY = {}; for (const a of ACH) ACH_BY[a.id] = a;
function achData() { const gp = gpLoad(), a = gp.ach && typeof gp.ach === 'object' ? gp.ach : (gp.ach = {}); if (!a.done || typeof a.done !== 'object') a.done = {}; if (!Array.isArray(a.seen)) a.seen = [];
  if (!a.n || typeof a.n !== 'object') a.n = {}; for (const k of ['exClr', 'exDes', 'ivClr', 'ivDes']) a.n[k] = Math.max(0, Math.floor(+a.n[k] || 0));
  if (!a.roles || typeof a.roles !== 'object' || Array.isArray(a.roles)) a.roles = {};
  // Store each preference's best cleared difficulty, never a repeatable run count.
  for (const id of Object.keys(a.roles)) if (!ACH_ROLES.includes(id) || !DIFF_BY[a.roles[id]]) delete a.roles[id];
  a.n.ivVariety = ACH_ROLES.filter(id => achDifficulty(a.roles[id]) >= 1).length;
  a.n.ivMastery = ACH_ROLES.filter(id => a.roles[id] === 'despair').length;
  a.n.fullAff = SURV_IDS.filter(id => gp.girls[id] && gp.girls[id].aff >= AFF_MAX).length;
  if (a.title && !(TITLES[a.title] && (achOwnsTitle(a, a.title) || (TITLES[a.title].special && NET.specialTitles == null) || (RANK_TITLES.has(a.title) && NET.rankTitles == null)))) a.title = null; return a; }
function achDifficulty(id) { return DIFFS.findIndex(d => d.id === id); }
const achOwnsTitle = (a, t) => TITLES[t] && TITLES[t].special ? (NET.specialTitles || []).includes(t) : RANK_TITLES.has(t) ? (NET.rankTitles || []).includes(t) : ACH.some(q => q.title === t && a.done[q.id]);
const achDone = id => !!achData().done[id];
const achUnseen = () => { const a = achData(); return ACH.some(q => a.done[q.id] && !a.seen.includes(q.id)); };
function achUnlock(id) { const q = ACH_BY[id], a = achData(); if (!q || a.done[id]) return; a.done[id] = Date.now();
  if (q.proof) gpLoad().proofs += q.proof; gpSave(); const s = L('ach_got', tr(q.n));
  if (G && G.state !== 'menu' && G.notes) notify(s, C.gold); else NET.toast = { txt: s, c: C.gold, t: 0 }; AU.play('chipGet'); }
function achCheckCounts() { const a = achData(); for (const q of ACH) if (q.c && a.n[q.c] >= q.need) achUnlock(q.id); }
function achRank(mode, rank) { if (!(rank >= 1)) return; const p = mode === 'i' ? 'iv' : mode === 'e' ? 'en' : 'ex'; if (rank <= 10) achUnlock(p + '_top10'); if (rank <= 3) achUnlock(p + '_top3'); if (rank === 1) achUnlock(p + '_top1'); }
function achWear(t) { const a = achData(); a.title = t && achOwnsTitle(a, t) ? t : null; gpSave(); AU.play('menuOk'); }
const achTitle = () => { const a = achData(); return a.title || ''; };
// a title as a tag: its name in the rarity colour; a legendary one glows white and a glint runs across it
function drawTitleTag(id, x, y, sc = 1, align = 'left') { const T2 = TITLES[id]; if (!T2) return 0; const s = '「' + tr(T2.n) + '」', w = textW(s, sc), x0 = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x, c = TITLE_C[T2.r];
  if (T2.r === 3) { drawGradTitle(s, x0, y, w, sc, T2.grad, T2.breathe); return w; }
  if (T2.r === 2) { const t = G ? G.time || performance.now() / 1000 : 0, g = .35 + .25 * Math.sin(t * 3); ctx.save(); ctx.globalAlpha *= g; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) text(s, x0 + dx, y + dy, '#ffffff', sc); ctx.restore(); }
  text(s, x0, y, c, sc);
  if (T2.r === 2) { const t = (performance.now() / 1000) % 2.4, gx = x0 - 6 + (w + 12) * clamp(t / .8, 0, 1); if (t < .8) { ctx.save(); ctx.globalAlpha *= .8; rect(Math.round(gx), y - 1, 1, 9 * sc, '#ffffff'); rect(Math.round(gx) - 2, y + 1, 1, 6 * sc, 'rgba(255,255,255,.5)'); ctx.restore(); } }
  return w; }
const GT = { c: null, x: null };
function drawGradTitle(s, x, y, w, sc, stops, breathe = false) { const pad = 3, cw = Math.ceil((w + pad * 2) * US), ch = Math.ceil((lineH(sc) + pad * 2) * US);
  if (!GT.c) { GT.c = document.createElement('canvas'); GT.x = GT.c.getContext('2d'); } if (GT.c.width < cw || GT.c.height < ch) { GT.c.width = Math.max(GT.c.width, cw); GT.c.height = Math.max(GT.c.height, ch); }
  const g = GT.x, keep = ctx, t = performance.now() / 1000; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, GT.c.width, GT.c.height); g.globalCompositeOperation = 'source-over'; g.imageSmoothingEnabled = false; g.setTransform(US, 0, 0, US, 0, 0);
  ctx = g; try { text(s, pad, pad + 1.5 * sc + cjkGP(sc), '#ffffff', sc); } finally { ctx = keep; }
  // the gradient drifts along the letters: gold, a bright gold, red, and back
  const shift = breathe ? 0 : (t * 30) % (w * 2), gr = g.createLinearGradient(pad - shift, 0, pad - shift + w * (breathe ? 1 : 2), 0);
  for (const [o, c] of stops || [[0, '#ffd27a'], [.25, '#efb94a'], [.5, '#e0483e'], [.75, '#efb94a'], [1, '#ffd27a']]) gr.addColorStop(o, c);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = gr; g.fillRect(0, 0, w + pad * 2, lineH(sc) + pad * 2);
  // a glint runs across every few seconds
  const gt = t % 3; if (!breathe && gt < .6) { const gx = pad - 6 + (w + 12) * gt / .6; g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,248,220,.85)'; g.fillRect(gx, 0, 1.5, lineH(sc) + pad * 2); }
  g.globalCompositeOperation = 'source-over';
  if (breathe) { const pulse = typeof ivReducedMotion === 'function' && ivReducedMotion() ? .5 : .5 + .5 * Math.sin(t * Math.PI / 2);
    ctx.save(); ctx.globalAlpha *= .35 + .4 * pulse; ctx.shadowColor = pulse > .5 ? '#ffb7dd' : '#9cddff'; ctx.shadowBlur = (2 + 4 * pulse) * US;
    ctx.drawImage(GT.c, 0, 0, cw, ch, x - pad, y - pad - 1.5 * sc - cjkGP(sc), cw / US, ch / US); ctx.restore(); }
  ctx.save(); ctx.globalAlpha *= .35; ctx.drawImage(GT.c, 0, 0, cw, ch, x - pad - .5, y - pad - 1.5 * sc - cjkGP(sc) + .5, cw / US, ch / US); ctx.restore();
  ctx.drawImage(GT.c, 0, 0, cw, ch, x - pad, y - pad - 1.5 * sc - cjkGP(sc), cw / US, ch / US); }
// ---------------- hooks: clears, scores, ranks ----------------
// Aim assistance is a normal control option, so G.assisted does not disqualify a run.
function achRunEligible() { return G && G.p && G.p.alive && !G.preview && !(window.BOSS_TEST && BOSS_TEST.on) && !(typeof TST !== 'undefined' && TST.god); }
function achCheckClear() {
  if (!achRunEligible()) return;
  if (G.mode === 'invade') {
    const iv = G.iv, a = achData(); if (!iv || iv.wave !== 20) return;
    if (ACH_ROLES.includes(iv.role) && achDifficulty(G.diff) > achDifficulty(a.roles[iv.role])) { a.roles[iv.role] = G.diff; gpSave(); }
    if (achDifficulty(G.diff) >= 1 && iv.w.length === 6 && IV_W[iv.w[0].id] && iv.w.every(w => w.id === iv.w[0].id)) achUnlock('iv_specialist');
    if (achDifficulty(G.diff) >= 2 && iv.achWave20 && !iv.achWave20.invalid && iv.waveHits === 0) achUnlock('iv_storm');
  } else if (!G.endless && G.diff === 'despair') {
    const n = cleanModifiers(G.modifiers, G.diff, G.mode).length;
    if (n >= 1) achUnlock('ex_pressure'); if (n >= 3) achUnlock('ex_burden'); if (n === 5) achUnlock('ex_five');
  }
  achCheckCounts();
}
function achCheckAffection() { if (achData().n.fullAff === SURV_IDS.length) achUnlock('all_bonds'); }
const _addAffA = addAff; addAff = function (...args) { const n = _addAffA(...args); achCheckAffection(); return n; };
// A reforming boss keeps the same room and tracker, including damage between forms.
const _enterFloorA = enterFloor; enterFloor = function (...args) { G.achBoss = null; return _enterFloorA(...args); };
const _spawnBossA = spawnBoss; spawnBoss = function (...args) {
  const b = _spawnBossA(...args);
  if (G.mode !== 'invade' && b && (!G.achBoss || G.achBoss.room !== b.room)) G.achBoss = { room: b.room, hit: false, invalid: !achRunEligible() || b.def.form === 2 };
  return b;
};
const _hurtPlayerA = hurtPlayer; hurtPlayer = function (...args) {
  const p = G.p, fight = G.achBoss, hp = p && p.hp, armor = p && p.armor, temp = p && (p.tArm || []).length, hits = G.hits;
  const result = _hurtPlayerA(...args);
  if (fight && p && (G.hits > hits || p.hp < hp || p.armor < armor || (p.tArm || []).length < temp)) fight.hit = true;
  return result;
};
const _updateRoomsA = updateRooms; updateRooms = function (...args) {
  const r = _updateRoomsA(...args), fight = G.achBoss;
  if (fight && !fight.settled && fight.room.cleared) {
    fight.settled = true;
    if (G.mode !== 'invade' && achRunEligible() && achDifficulty(G.diff) >= 1 && !fight.hit && !fight.invalid) achUnlock('ex_sterile');
  }
  return r;
};
const _ivStartWaveA = ivStartWave; ivStartWave = function (...args) { const r = _ivStartWaveA(...args); G.iv.achWave20 = G.iv.wave === 20 ? { invalid: !achRunEligible() } : null; return r; };
const _girlsOnClearA = girlsOnClear; girlsOnClear = function () { const gp = gpLoad(), before = !!G.clearRewarded || (Array.isArray(gp.clearRuns) && gp.clearRuns.includes(G.rid)); _girlsOnClearA();
  if (!G.clearRewarded || (window.BOSS_TEST && BOSS_TEST.on)) return;
  if (!before) { const a = achData(), iv = G.mode === 'invade'; a.n[iv ? 'ivClr' : 'exClr']++; if (G.diff === 'despair') a.n[iv ? 'ivDes' : 'exDes']++; gpSave(); achCheckCounts(); }
  achCheckClear(); };
const _finishRunA = finishRun; finishRun = function (win) { const r = _finishRunA(win); const R = G.result; if (R && R.win && !R.endless && R.mode !== 'invade' && R.score >= 200000) achUnlock('ex_score'); return r; };
// the board answers with a rank when a run is recorded, and with your standing whenever a board is read
function achTick() { const R = G && G.result; if (R && R.up && R.up.st === 'ok' && !R.achRank) { R.achRank = true; const n = parseInt(R.up.rank, 10); achRank(R.mode === 'invade' ? 'i' : R.endless ? 'e' : '', n); }
  if (G && !achRunEligible()) { if (G.achBoss && !G.achBoss.settled) G.achBoss.invalid = true; if (G.iv && G.iv.achWave20) G.iv.achWave20.invalid = true; }
  if (NET.ready && performance.now() >= (achTick.affAt || 0)) { achTick.affAt = performance.now() + 1000; achCheckAffection(); }
  for (const [k, m] of [['board', ''], ['eboard', 'e'], ['iboard', 'i']]) { const B = NET[k]; if (B && !B.achSeen) { B.achSeen = true; if (B.me && !B.me.over) achRank(m, B.me.rank); achRefreshTitles(); } }
  if (G && G.state === 'menu' && NET.user && !NET.off && performance.now() - (NET.meAt || 0) > 180e3) achRefreshTitles(); }
const _stepA = step; step = function (rdt) { _stepA(rdt); try { achTick(); } catch (e) { } };
// ---------------- 入侵抵抗: the score (keep in sync with functions/board.js ivRunScore), the result and its upload ----------------
function ivRunScore(r) { const win = !!r.win, clearB = win ? 10000 : 0, waveB = (r.wave | 0) * 1500, killB = (r.kills | 0) * 10, hitB = win ? Math.round(20000 / (1 + .05 * (r.hits | 0))) : 0, lvB = (r.lv | 0) * 200;
  const mul = DIFF_MUL[r.diff] || 1; return { total: Math.round((clearB + waveB + killB + hitB + lvB) * mul), parts: { clear: clearB, wave: waveB, kills: killB, hits: hitB, lv: lvB }, mul }; }
const _runScoreA = runScore; runScore = function (r) { return r && r.mode === 'invade' ? ivRunScore(r) : _runScoreA(r); };
const IV_RES_KEYS = ['mode', 'rid', 'diff', 'win', 'wave', 'runT', 'kills', 'hits', 'lv', 'role', 'weapons', 'items', 'ver'];
const _stripResultA = stripResult; stripResult = function (r) { if (r.mode !== 'invade') return _stripResultA(r); const o = {}; for (const k of IV_RES_KEYS) o[k] = r[k]; return o; };
function ivBuildResult(win) { const iv = G.iv, items = {}; let n = 0; for (const id of IV_I_IDS) if (iv.items[id] && n++ < 120) items[id] = Math.min(99, iv.items[id] | 0);
  const r = { mode: 'invade', win: !!win, rid: G.rid || ('r' + Date.now().toString(36)), diff: G.diff || 'classic', wave: win ? 20 : Math.max(1, iv.wave | 0), runT: Math.round((G.runT || 0) * 10) / 10, kills: G.kills | 0, hits: G.hits | 0, lv: iv.lv | 0,
    role: iv.role || '', weapons: iv.w.slice(0, 6).map(s => ({ id: s.id, t: s.t | 0 })), items, ver: GAME_VER, at: Date.now() };
  const s = ivRunScore(r); r.score = s.total; r.parts = s.parts; r.mul = s.mul; return r; }
const _ivFinishA = ivFinish; ivFinish = function (win) { const was = G.iv && G.iv.finished; _ivFinishA(win); if (was || !G.iv) return;
  try { if (typeof finishRunReset === 'function') finishRunReset(); G.result = ivBuildResult(win); if (win || G.result.wave >= 3) submitResult(G.result); else G.result.up = { st: 'none' }; } catch (e) { console.error(e); } };
// the end screen is the shared one now (the mode's own summary is retired); the run detail view is for 突入探索 runs only
const _drawEndA = drawEnd; drawEnd = function (win, t) { if (ivOn() && G.result && typeof _drawEndIv === 'function') return _drawEndIv(win, t); return _drawEndA(win, t); };
const _openRunDetA = openRunDet; openRunDet = function (R) { if (R && R.mode === 'invade') { AU.play('locked'); return; } return _openRunDetA(R); };
// the loadout panel of a 入侵抵抗 result: the weapons (two columns), the preference, and the items as a grid of icons
function ivResultLoadout(R, lx, py, lw, ph, t, kL) { ctx.save(); ctx.translate(Math.round(-(1 - kL) * 30), 0); ctx.globalAlpha = kL; frame2(lx, py, lw, ph, TH.cyan, L('en_load'));
  (R.weapons || []).filter(w => w && IV_W[w.id]).forEach((w, i) => { const k = clamp((t - .55 - i * .1) / .25, 0, 1); if (k <= 0) return; const bx = lx + 8 + (i % 2) * 101, by = py + 17 + Math.floor(i / 2) * 22, c = IV_TIER_C[w.t | 0];
    ctx.globalAlpha = kL * k; rect(bx, by, 97, 19, '#0a0908'); box(bx, by, 97, 19, null, '#2d2925'); rect(bx, by, 2, 19, c); const sp = ivWeaponSprite(w.id), sc = Math.min(22 / sp.w, 14 / sp.h);
    ctx.save(); ctx.imageSmoothingEnabled = !!sp.smooth; ctx.drawImage(sp.n, Math.round(bx + 15 - sp.w * sc / 2), Math.round(by + 10 - sp.h * sc / 2), sp.w * sc, sp.h * sc); ctx.restore();
    text(fitText(tr(IV_W[w.id].n), 62), bx + 30, by + 5, c, .9); }); ctx.globalAlpha = kL;
  const role = typeof IV_ROLES !== 'undefined' && IV_ROLES.find(q => q.id === R.role), iy = py + 85; if (role) text(role.n, lx + 10, iy, '#8e877b');
  const ids = Object.keys(R.items || {}).filter(id => IV_I[id]), per = Math.floor((lw - 20) / 15); text(L('iv_items') + '  ' + ids.reduce((a, id) => a + (R.items[id] | 0), 0), lx + lw - 10, iy, '#57524a', 1, 'right');
  ids.slice(0, per * 3).forEach((id, i) => { const k = clamp((t - .8 - i * .02) / .12, 0, 1); if (k <= 0) return; const x = lx + 10 + (i % per) * 15, y = iy + 11 + Math.floor(i / per) * 15; ctx.globalAlpha = kL * k;
    rect(x, y, 13, 13, '#0a0908'); box(x, y, 13, 13, null, thA(IV_TIER_C[IV_I[id].t], .6)); ivIcon({ k: 'i', id, t: IV_I[id].t }, x + 6, y + 6, .8); });
  ctx.restore(); ctx.globalAlpha = 1; }
// ---------------- 设置 → 成就: a docked window listing every achievement, its reward, and the titles you can wear ----------------
const ACHW = { scroll: 0, target: 0, drag: null, hits: [], t: 0 };
function openAchv() { achCheckAffection(); achRefreshTitles(); if (typeof ltStatus === 'function') ltStatus(); ACHW.scroll = ACHW.target = 0; ACHW.t = 0; ACHW.drag = null; MENU.page = 'achv'; MENU.t = 0; const a = achData(); a.seen = ACH.filter(q => a.done[q.id]).map(q => q.id); gpSave(); AU.play('menuOk'); }
const ACH_RH = 56;
function achList() { const a = achData(), ids = [...new Set([...Object.keys(TITLES).filter(t => TITLES[t].activity), ...(NET.specialTitles || [])])];
  const sp = ids.filter(t => TITLES[t]).map(t => ({ id: 'sp_' + t, sp: true, title: t, n: TITLES[t].activity ? TITLES[t].n : IZ('SPECIAL TITLE', '专属称号'), d: TITLES[t].activity ? L('ach_event') : TITLES[t].d || IZ('Given to you by the developers', '由开发组授予') }));
  return sp.concat(ACH.slice().sort((p, q) => (!!a.done[q.id]) - (!!a.done[p.id]) || ACH.indexOf(p) - ACH.indexOf(q))); }
function updateAchv(rdt) { ACHW.t += rdt; const a = achData(), box2 = { x: 34, y: 54, w: W - 68, h: H - 70 }, total = achList().length * ACH_RH, maxS = Math.max(0, total - box2.h);
  if (pressed('Escape')) { dockClose(); return; }
  if (Input.wheel) ACHW.target = clamp(ACHW.target + Math.sign(Input.wheel) * 40, 0, maxS);
  // a press inside the list scrolls it; a button there fires only when released without dragging (fingers swipe across them)
  if (Input.clicked) { const h = ACHW.hits.find(b => inR(b, Input.mx, Input.my)); if (inR(box2, Input.mx, Input.my)) { Input.clicked = false; ACHW.drag = { y: Input.my, s: ACHW.target, h, moved: false }; } else if (h) { Input.clicked = false; h.f(); return; } }
  if (ACHW.drag) { const d = ACHW.drag; if (Math.abs(Input.my - d.y) > 4) d.moved = true; if (d.moved) ACHW.target = clamp(d.s - (Input.my - d.y), 0, maxS); if (!Input.down) { ACHW.drag = null; if (!d.moved && d.h) { d.h.f(); return; } } }
  ACHW.scroll = lerp(ACHW.scroll, ACHW.target, .3); }
function drawAchv(t) { panel(L('ach_title'), TH.gold, { stripes: false }); ACHW.hits = []; const a = achData();
  // the worn title at the top right
  { const cur = a.title; if (cur) { const w = drawTitleTag(cur, W - 52, 23, 1, 'right'); const b = { x: W - 52 - w - 52, y: 20, w: 44, h: 12, f: () => achWear(null) }; ACHW.hits.push(b); drawBtn(b.x, b.y, b.w, b.h, L('ach_off'), inR(b, Input.mx, Input.my), '#8e877b'); }
    else text(L('ach_none'), W - 52, 23, TH.faint, 1, 'right'); }
  text(Object.keys(a.done).filter(k => ACH_BY[k]).length + ' / ' + ACH.length, 38, 41, TH.dim);
  const bx = { x: 34, y: 54, w: W - 68, h: H - 70 }; ctx.save(); ctx.beginPath(); ctx.rect(bx.x - 2, bx.y, bx.w + 4, bx.h); ctx.clip();
  achList().forEach((q, i) => { const y = Math.round(bx.y + i * ACH_RH - ACHW.scroll), k = easeOut(clamp((ACHW.t - i * .03) / .25, 0, 1)); if (y < bx.y - ACH_RH || y > bx.y + bx.h) return; const done = q.sp ? achOwnsTitle(a, q.title) : !!a.done[q.id];
    ctx.save(); ctx.globalAlpha *= k; ctx.translate(Math.round((1 - k) * 12), 0);
    rect(bx.x, y, bx.w, ACH_RH - 3, done ? '#14110d' : '#0c0b0a'); box(bx.x, y, bx.w, ACH_RH - 3, null, done ? '#3a3226' : '#211e1a'); if (done) rect(bx.x, y, 2, ACH_RH - 3, TH.gold);
    // the seal: a check for done, a lock otherwise
    const sx = bx.x + 12, sy = y + 11; if (done) { disc(sx, sy, 6, '#2a2210'); ringC(sx, sy, 6, TH.gold, 1); for (const [dx, dy] of [[-3, 0], [-2, 1], [-1, 2], [0, 1], [1, 0], [2, -1], [3, -2]]) rect(sx + dx, sy + dy, 1, 1, TH.gold); } else { disc(sx, sy, 6, '#141210'); icon('lock', sx - 4, sy - 4, '#57524a'); }
    text(fitText(tr(q.n), bx.w - 130), bx.x + 24, y + 4, done ? TH.bone : '#8e877b');
    wrapW(tr(q.d), bx.w - 38, .9).slice(0, 2).forEach((line, j) => text(line, bx.x + 24, y + 17 + j * 10, done ? '#a49c8e' : '#7d766b', .9));
    if (q.c && q.need > 1) { const v = Math.min(q.need, a.n[q.c]); text(v + '/' + q.need, bx.x + bx.w - 62, y + 4, done ? TH.dim : '#6e675c', 1, 'right'); }
    // Both rewards stay visible; the title has its own line and wear action.
    const rx = bx.x + bx.w - 8;
    if (q.proof) { const s = '×' + q.proof; text(s, rx, y + 4, done ? TH.gold : '#8e877b', 1, 'right'); drawProof(rx - textW(s) - 11, y + 3); }
    if (q.title) { const worn = a.title === q.title, held = !done || achOwnsTitle(a, q.title), locked = q.sp && !done; if (locked) text(L('ach_locked'), rx, y + 40, '#6e675c', 1, 'right'); else if (done && !held) text(L('ach_lost'), rx, y + 40, '#6e675c', 1, 'right'); else if (done) { const b = { x: rx - 40, y: y + 37, w: 40, h: 13, title: q.title, f: () => achWear(worn ? null : q.title) }; if (b.y >= bx.y && b.y + b.h <= bx.y + bx.h) ACHW.hits.push(b); drawBtn(b.x, b.y, b.w, b.h, L(worn ? 'ach_worn' : 'ach_wear'), inR(b, Input.mx, Input.my) || worn, worn ? TH.gold : TH.bone2); }
      ctx.save(); if (!done || !held) ctx.globalAlpha *= .45; drawTitleTag(q.title, rx - (locked ? textW(L('ach_locked')) + 6 : done ? (held ? 46 : textW(L('ach_lost')) + 6) : 0), y + 40, 1, 'right'); ctx.restore(); }
    ctx.restore(); });
  ctx.restore();
  const total = achList().length * ACH_RH; if (total > bx.h) { const kh = Math.max(10, bx.h * bx.h / total), ky = bx.y + (bx.h - kh) * (ACHW.scroll / (total - bx.h)); rect(bx.x + bx.w + 4, bx.y, 1, bx.h, '#1f1f24'); rect(bx.x + bx.w + 3, ky, 3, kh, '#4c463f'); } }
// the settings column: a row for the achievements (a red mark while something new is unseen); the taskbar's settings button carries the mark too
const _setRowsA = setRows; setRows = function () { const rows = _setRowsA(); if (TBAR.sub.length) return rows;
  return [...rows, { l: () => L('ach_title'), dot: achUnseen() ? C.red : null, cur: () => MENU.page === 'achv', act: () => dockGo('achv', 0) },
    { l: () => L('my_id'), v: () => NET.user ? NET.user.uid : '-', act: () => copyMyId() }]; };
function copyMyId() { const id = NET.user && NET.user.uid; if (!id) { netToast(ONDZ() ? 'lg_guest2' : 'g_dz', '#8e877b'); AU.play('locked'); return; }
  const ok = () => { NET.toast = { txt: L('my_idCopy') + '  ' + id, c: TH.gold, t: 0 }; AU.play('select'); }, fallback = () => { try { const t = document.createElement('textarea'); t.value = id; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); const r = document.execCommand('copy'); t.remove(); if (r) ok(); else throw 0; } catch (e) { NET.toast = { txt: L('my_idFail') + '  ' + id, c: TH.red, t: 0 }; } };
  try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(id).then(ok, fallback); else fallback(); } catch (e) { fallback(); } }
const _drawTaskbarA = drawTaskbar; drawTaskbar = function (t) { _drawTaskbarA(t); if (!achUnseen()) return; const lay = tbLayout(), p = lay.items[tbItems().findIndex(it => it.ic === 'settings')]; if (!p) return;
  rect(p.x + p.w - 6, p.y + 3, 4, 4, C.red); rect(p.x + p.w - 5, p.y + 2, 2, 1, C.red); rect(p.x + p.w - 5, p.y + 7, 2, 1, C.red); };
// the end screen's leaderboard button opens the board of the mode that was just played
const _openBoardA = openBoard; openBoard = function () { const iv = G && G.result && G.result.mode === 'invade'; _openBoardA(); if (iv) setTab(G.result.endless ? 3 : 2); };
// a settled 入侵抵抗 clear counts for the limited-time event too
const _ivFinishEvA = ivFinish; ivFinish = function (win) { const was = G.iv && G.iv.finished; _ivFinishEvA(win); if (!was && G.result && G.result.mode === 'invade') try { evContribute(G.result); } catch (e) { console.error('[event]', e); } };
// ---------------- the event's reward chip: Overclock! (unlocked by claiming the event; until then it never appears) ----------------
Object.assign(ICONS, { skOvc: ['..1..1..', '.111111.', '11.11.11', '.1....1.', '.1....1.', '11.11.11', '.111111.', '..1..1..'] });
SKILLS.ovc = { nm: 'Overclock!', c: () => C.gold, icon: 'skOvc', dur: 5, cd: 30, manual: false,
  d: N4('FOR 5S YOU TAKE DOUBLE DAMAGE, BUT EVERY HIT IS A CRIT, CRIT DAMAGE +100% AND ATTACK SPEED +50%. CANNOT BE ENDED EARLY. COOLDOWN 30S.', '開啟後 5 秒內：自身受到雙倍傷害，但攻擊必定暴擊，暴擊傷害提升 100%，攻擊速度提升 50%。不可手動關閉。冷卻 30 秒。', '5秒間：被ダメージ2倍、ただし攻撃は必ず会心、会心ダメージ+100%、攻撃速度+50%。途中で止められない。CT30秒。', '开启后 5 秒内：自身受到双倍伤害，但攻击必定暴击，暴击伤害提升 100%，攻击速度提升 50%。不可手动关闭。冷却 30 秒。') };
SKILL_IDS.push('ovc');
const _recomputeOvc = recomputeStats; recomputeStats = function () { _recomputeOvc(); const S = G && G.S; if (!S || !skillOn('ovc')) return; S.crit = Math.max(S.crit, 1); S.critMul += 1; S.rate *= 1.5; };
// double damage while it runs: twice the health, or a second armor point when armor takes the hit
const _hurtPlayerOvc = hurtPlayer; hurtPlayer = function (dmg, sx, sy, mechHit, pierce) { const p = G && G.p; if (!p || !skillOn('ovc') || (typeof ivOn === 'function' && ivOn())) return _hurtPlayerOvc(dmg, sx, sy, mechHit, pierce);
  const ar = p.armor, r = _hurtPlayerOvc(dmg * 2, sx, sy, mechHit, pierce); if (p.armor === ar - 1 && p.armor > 0) { p.armor--; if (p.armor === 0) onArmorBroken(p); } return r; };
const _activateOvc = activateSkill; activateSkill = function () { _activateOvc(); if (G.p.skill === 'ovc') { recomputeStats(); AU.play('limitOn', 1.4, .6); flash(C.gold, .2, true); } };
const _endOvc = endSkill; endSkill = function () { const on = skillOn('ovc'); _endOvc(); if (on) { recomputeStats(); AU.play('limitOff', 1.3, .5); } };
const _updateSkillOvc = updateSkill; updateSkill = function (rdt, wdt) { _updateSkillOvc(rdt, wdt); if (skillOn('ovc') && Math.random() < .5) { const p = G.p; part({ x: p.x + rand(-5, 5), y: p.y - rand(0, 8), vx: rand(-15, 15), vy: -rand(20, 50), life: .3, max: .3, c: Math.random() < .5 ? C.gold : C.orange, t: 'spark', drag: 2 }); } };
