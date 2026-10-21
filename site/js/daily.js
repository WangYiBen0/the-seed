// ===== TheSeed: the daily tasks. Two each day (the day turns at 0:00 GMT+8), taken from the main menu: clear 突入探索 once (+3 embers)
// and clear 入侵抵抗 once (+3 embers), any difficulty. A task counts only once taken; a 突入探索 clear or endless run, or a 入侵抵抗 win,
// completes it; claiming pays. Kept with the girls' progress (gp.daily).
'use strict';
Object.assign(STR, {
  dy_tag: ['DAILY TASKS', '每日任務', 'デイリー任務', '每日任务'],
  dy_x: ['CLEAR 突入探索 ONCE', '通關突入探索 1 次', '突入探索を1回クリア', '通关突入探索 1 次'], dy_i: ['CLEAR 入侵抵抗 ONCE', '通關入侵抵抗 1 次', '侵攻抵抗を1回クリア', '通关入侵抵抗 1 次'],
  dy_take: ['ACCEPT', '接取', '受注', '接取'], dy_on: ['0/1', '0/1', '0/1', '0/1'], dy_claim: ['CLAIM', '領取', '受取', '领取'], dy_gotOne: ['DONE', '已完成', '完了', '已完成'],
  dy_reset: ['RESETS IN {0}', '{0} 後刷新', '{0}後に更新', '{0} 后刷新'],
  dy_took: ['DAILY TASK ACCEPTED: {0}', '已接取每日任務：{0}', 'デイリー任務を受注：{0}', '已接取每日任务：{0}'],
  dy_done: ['DAILY TASK COMPLETE: CLAIM IT ON THE MAIN MENU', '每日任務完成，可在主界面領取獎勵', 'デイリー任務完了：メインメニューで受け取り', '每日任务完成，可在主界面领取奖励'],
  dy_paid: ['+{0} EMBERS · DAILY TASK', '+{0} 火種 · 每日任務', '+{0} 火種・デイリー任務', '+{0} 火种 · 每日任务'],
});
const DAILY = { reward: 3, tasks: ['x', 'i'] };
const dyToday = () => evDay(evNow());
function dyData() { const gp = gpLoad(), t = dyToday(); if (!gp.daily || gp.daily.day !== t || typeof gp.daily.x !== 'string') gp.daily = { day: t, x: '', i: '' }; return gp.daily; }
function dyTake(k) { const d = dyData(); if (d[k]) return; d[k] = 'acc'; gpSave(); AU.play('menuOk'); NET.toast = { txt: L('dy_took', L('dy_' + k)), c: TH.gold, t: 0 }; }
function dyClaim(k) { const d = dyData(); if (d[k] !== 'done') return; d[k] = 'got'; const gp = gpLoad(); gp.proofs = (gp.proofs || 0) + DAILY.reward; gpSave(); AU.play('chipGet'); NET.toast = { txt: L('dy_paid', DAILY.reward), c: TH.gold, t: 0 }; }
// a settled run: a cleared run completes the accepted task of its mode
const _evContributeDy = evContribute; evContribute = function (R) { const r = _evContributeDy(R);
  try { if (R && !(window.BOSS_TEST && BOSS_TEST.on)) { const k = R.mode === 'invade' ? (R.win ? 'i' : '') : (R.win || R.endless ? 'x' : ''), d = dyData();
      if (k && d[k] === 'acc') { d[k] = 'done'; gpSave(); notify(L('dy_done'), TH.gold); } } } catch (e) { console.error('[daily]', e); }
  return r; };
// ---------------- the card on the main menu, under the event window (or in its place) ----------------
function dyBox() { const b = evCardBox(), y = typeof evHidden === 'function' && evHidden() ? b.y : b.y + b.h + 4; return { x: b.x, y, w: b.w, h: 54 }; }
function dyLeft() { let s = Math.max(0, Math.floor(((dyToday() + 1) * 86400e3 - 8 * 3600e3 - evNow()) / 1000)); const z = n => ('0' + n).slice(-2); return z(Math.floor(s / 3600)) + ':' + z(Math.floor(s / 60) % 60) + ':' + z(s % 60); }
const dyRow = j => { const b = dyBox(); return { x: b.x + 7, y: b.y + 16 + j * 18, w: b.w - 14, h: 16 }; };
const dyBtn = j => { const r = dyRow(j); return { x: r.x + r.w - 44, y: r.y + 1, w: 44, h: 14 }; };
const _drawMainMenuDy = drawMainMenu; drawMainMenu = function (t) { _drawMainMenuDy(t); drawDailyCard(t); };
function drawDailyCard(t) { const fk = TBAR.fk, dep = CAMP.dep ? clamp(CAMP.dep.t / .5, 0, 1) : 0, a = (1 - fk) * (1 - dep); if (a <= .02) return;
  const b = dyBox(), k = easeOut(clamp((MENU.t - .3) / .5, 0, 1)); if (k <= 0) return; const d = dyData(), off = Math.round((1 - k) * 20), hov = !TOUCH.on && inR(b, Input.mx, Input.my); ctx.globalAlpha = a * k;
  const all = DAILY.tasks.every(q => d[q] === 'got'); mmCard(b.x + off, b.y, b.w, b.h, TH.gold, L('dy_tag'), hov, all ? L('dy_reset', dyLeft()) : '');
  DAILY.tasks.forEach((q, j) => { const r = dyRow(j), bt = dyBtn(j), x = r.x + off, st = d[q], lab = fitText(L('dy_' + q), r.w - 70);
    rect(x, r.y, r.w, r.h, 'rgba(20,18,16,.6)'); text(lab, x + 4, r.y + 4 - (isCJK(lab) ? 1 : 0), st === 'got' ? '#57524a' : '#d8d0c2');
    { const s = '+' + DAILY.reward, sx = bt.x + off - 6; text(s, sx, r.y + 4, st === 'got' ? '#57524a' : TH.gold, 1, 'right'); drawProof(sx - textW(s) - 9, r.y + 3); }
    const bx = bt.x + off;
    if (st === 'got') text(L('dy_gotOne'), bx + bt.w / 2, bt.y + 3 - (isCJK(L('dy_gotOne')) ? 1 : 0), '#6e675c', 1, 'center');
    else if (st === 'acc') { rect(bx, bt.y, bt.w, bt.h, 'rgba(20,18,16,.8)'); box(bx, bt.y, bt.w, bt.h, null, '#3a3631'); text(L('dy_on'), bx + bt.w / 2, bt.y + 3, '#8e877b', 1, 'center'); }
    else { const on = st === 'done', blink = on && ((t * 2) | 0) % 2 === 0; drawBtn(bx, bt.y, bt.w, bt.h, L(on ? 'dy_claim' : 'dy_take'), (!TOUCH.on && inR(bt, Input.mx, Input.my)) || blink, TH.gold); } });
  ctx.globalAlpha = 1; }
const _updateMenuDy = updateMenu; updateMenu = function (rdt) {
  if (G.state === 'menu' && MENU.page === 'main' && TBAR.area < 0 && !(typeof ANN !== 'undefined' && ANN.open) && Input.clicked) {
    for (let j = 0; j < DAILY.tasks.length; j++) if (inR(dyBtn(j), Input.mx, Input.my) && (typeof ltCardHit !== 'function' || ltCardHit(dyBtn(j)))) { const q = DAILY.tasks[j], d = dyData(); Input.clicked = false;
      if (!d[q]) dyTake(q); else if (d[q] === 'done') dyClaim(q); else AU.play('locked'); return; } }
  return _updateMenuDy(rdt); };
