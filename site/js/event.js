// ===== TheSeed limited-time event (server function 'event'): a server-wide task shown on the main menu =====
// The current event: before 2026-10-22 23:59 GMT+8 the whole server clears 突入探索 6000 times and 入侵抵抗 6000 times. Each cleared run
// adds 1 to its mode's counter when it is settled (endless 突入探索 runs count as clears). When both counters reach the goal every player
// can claim 20 embers and the new skill chip (Overclock!) once. The window refreshes every 60 s on the main menu; today's counts start
// again at 0:00 GMT+8.
'use strict';
const EVC = { id: 'ev2', goal: 6000, end: Date.UTC(2026, 9, 22, 15, 59, 59, 999), reward: 20, chip: 'ovc' }; // the same numbers as functions/event.js
const EV_MAT = { easy: 1, classic: 1, hard: 1, nightmare: 1, despair: 1 }; // each clear counts once, on any difficulty
const EV = { d: null, err: false, busy: false, next: 0, skew: 0, day: -1, claiming: false, hits: [], t: 0, flash: null };
const evOn = () => ONDZ() && PLAT.caps.fn !== false;
const evNow = () => Date.now() + EV.skew; // the server's clock once we have heard from it
const evDay = ms => Math.floor((ms + 8 * 3600e3) / 86400e3);
const evOpen = () => evNow() <= EVC.end;
const evX = () => EV.d ? EV.d.x | 0 : 0, evI = () => EV.d ? EV.d.i | 0 : 0, evTotal = () => evX() + evI();
const evDone = () => evX() >= EVC.goal && evI() >= EVC.goal;
const evClaimedHere = () => !!((gpLoad().ev || {})[EVC.id]);
// which counter a settled run adds to: 'x' a cleared (or endless) 突入探索 run, 'i' a cleared 入侵抵抗 run
function evKind(R) { if (!R || !EV_MAT[R.diff]) return ''; if (R.mode === 'invade') return R.win ? 'i' : ''; return R.win || R.endless ? 'x' : ''; }
// the countdown: "3天 04:12:09"
function evLeft() { let s = Math.max(0, Math.floor((EVC.end - evNow()) / 1000)); const d = Math.floor(s / 86400); s %= 86400; const z = n => ('0' + n).slice(-2);
  return (d ? L('ev_days', d) + ' ' : '') + z(Math.floor(s / 3600)) + ':' + z(Math.floor(s / 60) % 60) + ':' + z(s % 60); }
Object.assign(STR, {
  ev_name: ['SERVER TASK: CLEAR EACH MODE 6000 TIMES', '全服任務：突入探索與入侵抵抗各通關 6000 次', '全サーバー任務：両モードを各6000回クリア', '全服任务：突入探索与入侵抵抗各通关 6000 次'],
  ev_end: ['ENDS 2026.10.22 23:59 (GMT+8). REFRESHES DAILY AT 0:00 GMT+8', '結束時間：2026.10.22 23:59（GMT+8），每日 GMT+8 0 點刷新', '終了：2026.10.22 23:59（GMT+8）・毎日GMT+8の0時に更新', '结束时间：2026.10.22 23:59（GMT+8），每日 GMT+8 0 点刷新'],
  ev_rewardShort: ['REWARD: {0} EMBERS & A NEW SKILL CHIP EACH', '獎勵：每人 {0} 火種 & 新技能晶片', '報酬：全員に火種{0}＆新スキルチップ', '奖励：每人 {0} 火种 & 新技能芯片'],
  ev_reward: ['{0} EMBERS AND THE NEW SKILL CHIP OVERCLOCK! FOR EVERY PLAYER', '每位玩家 {0} 火種，並解鎖新技能晶片「Overclock!」', '全プレイヤーに火種{0}と新スキルチップ「Overclock!」', '每位玩家 {0} 火种，并解锁新技能芯片「Overclock!」'],
  ev_claim: ['CLAIM THE REWARD', '領取獎勵', '報酬を受け取る', '领取奖励'], ev_got: ['+{0} EMBERS · OVERCLOCK! UNLOCKED', '已領取 {0} 火種，「Overclock!」已解鎖', '火種+{0}・Overclock!解放', '已领取 {0} 火种，「Overclock!」已解锁'],
  ev_howHead: ['HOW IT COUNTS', '計入方式', '加算のしかた', '计入方式'], ev_tx: ['突入探索', '突入探索', '突入探索', '突入探索'], ev_ti: ['入侵抵抗', '入侵抵抗', '入侵抵抗', '入侵抵抗'],
  ev_hx: ['EVERY CLEAR (ENDLESS TOO) +1', '每次通關（含無盡）+1', 'クリアごと（無限含む）+1', '每次通关（含无尽）+1'], ev_hi: ['EVERY CLEAR +1', '每次通關 +1', 'クリアごと +1', '每次通关 +1'],
  ev_rule6: ['CLEARS ARE ADDED TO THE SERVER TOTAL WHEN THE RUN IS SETTLED (SIGNED-IN DZMM PLAYERS).', '在最終結算時累計到全服數量（需登入 DZMM）。', '最終精算時に全サーバー合計へ加算（DZMMログイン時）。', '在最终结算时累计到全服数量（需登录 DZMM）。'],
  ev_addUp: ['SERVER TASK: SENDING THIS CLEAR', '全服任務：正在提交本次通關', '全サーバー任務：クリアを送信中', '全服任务：正在提交本次通关'],
  ev_addOk: ['SERVER TASK: THIS CLEAR COUNTED', '全服任務：本次通關已計入全服', '全サーバー任務：クリアを加算', '全服任务：本次通关已计入全服'],
  ev_addLater: ['SERVER TASK: THIS CLEAR WILL BE SENT LATER', '全服任務：本次通關稍後自動補交', '全サーバー任務：後で送信', '全服任务：本次通关稍后自动补交'],
  ev_addLogin: ['SIGN IN TO DZMM TO COUNT THIS CLEAR', '登入 DZMM 後通關才會計入', 'DZMMにログインすると加算される', '登录 DZMM 后通关才会计入'],
  ev_mine: ['YOURS {0}', '我的貢獻 {0}', '自分の貢献 {0}', '我的贡献 {0}'],
});

// ---- the server ----
function evStatus() {
  if (!evOn() || EV.busy) return; EV.busy = true;
  fnCall('event', 'status').then(r => { if (r && r.ok) { EV.d = r; EV.err = false; EV.skew = r.now - Date.now(); } else EV.err = true; })
    .catch(() => { EV.err = true; }).finally(() => { EV.busy = false; EV.next = performance.now() + (MENU.page === 'event' ? 20e3 : 60e3); EV.day = evDay(evNow()); });
}
// called every frame on the main menu and the event page: asks again every 60 s (20 s on the event page) and right after 0:00 GMT+8
function evTick() { if (!evOn() || EV.busy) return; if (performance.now() >= EV.next || evDay(evNow()) !== EV.day) evStatus(); }

// ---- contributing: when a cleared run is settled. Queued first and sent until the server has it, like score uploads ----
const EV_PEND = 'achroma_evpend';
function evPendGet() { try { const a = JSON.parse(STORE.getItem(EV_PEND) || '[]'); return Array.isArray(a) ? a.filter(r => r && typeof r === 'object' && typeof r.rid === 'string' && r.rid && (r.kind === 'x' || r.kind === 'i')) : []; } catch (e) { return []; } }
function evPendSet(a) { try { STORE.setItem(EV_PEND, JSON.stringify(a)); } catch (e) { } }
function evContribute(R) {
  if (!R || (window.BOSS_TEST && BOSS_TEST.on)) return; const kind = evKind(R); if (!kind) return;
  if (!evOpen()) { R.ev = { st: 'ended', amt: 1 }; return; }
  R.ev = { st: 'up', amt: 1 }; const a = evPendGet(); if (!a.some(x => x.rid === R.rid)) { a.push({ rid: R.rid, kind }); evPendSet(a); }
  if (!NET.user) { R.ev = { st: 'login', amt: 1 }; return; }
  evFlush(R);
}
function evFlush(R) {
  if (!evOn() || !NET.user || EV.flushing) return; const a = evPendGet(); if (!a.length) return; const it = a[0]; EV.flushing = true;
  const mine = R && R.rid === it.rid ? R : (G.result && G.result.rid === it.rid ? G.result : null);
  fnCall('event', 'add', it).then(r => {
    if (r && r.ok) { evPendSet(evPendGet().filter(x => x.rid !== it.rid)); if (EV.d) { Object.assign(EV.d, { x: r.x, i: r.i, todayX: r.todayX, todayI: r.todayI }); if (!r.dup) EV.d.mine = (EV.d.mine || 0) + 1; } if (mine) mine.ev = { st: 'ok', amt: 1 }; setTimeout(() => evFlush(), 400); }
    else if (r && r.reject) { evPendSet(evPendGet().filter(x => x.rid !== it.rid)); if (mine) mine.ev = { st: r.reject === 'ended' ? 'ended' : 'err', amt: 1 }; setTimeout(() => evFlush(), 400); }
    else { if (mine) mine.ev = { st: 'later', amt: 1 }; evLater(); } })
    .catch(() => { if (mine) mine.ev = { st: 'later', amt: 1 }; evLater(); }).finally(() => { EV.flushing = false; });
}
function evLater() { clearTimeout(EV.pendT); EV.pendT = setTimeout(() => evFlush(), 60e3); }
// queued contributions from an earlier session go out once the platform is ready
const _netInitEv = netInit; netInit = function () { _netInitEv(); if (NET.user && evOn()) setTimeout(() => evFlush(), 2500); };
// settling a 突入探索 run (game.js finishRun) counts it; 入侵抵抗 runs are counted from their own settling (js/achieve.js)
const _finishRunEv = finishRun; finishRun = function (win) { _finishRunEv(win); try { evContribute(G.result); } catch (e) { console.error('[event]', e); } };

// ---- the reward: embers and the new chip, which joins the run's chip pool from then on ----
const chipUnlocked = k => k !== EVC.chip || !!((gpLoad().chips || {})[k]);
async function evClaim() {
  if (!NET.user) { evFlash('wc_guest'); AU.play('locked'); return; } if (EV.claiming || evClaimedHere()) return; EV.claiming = true;
  const gp = gpLoad(); gp.evReceipts = gp.evReceipts || {};
  if (!gp.evReceipts[EVC.id]) { gp.evReceipts[EVC.id] = 'claim-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2); gpSave(); }
  // the recovery token is saved before the server awards it, so an uncertain answer can be recovered here and never paid twice
  if (!await STORE.flush()) { EV.claiming = false; evFlash('wc_fail'); return; }
  const receipt = gp.evReceipts[EVC.id];
  fnCall('event', 'claim', { receipt }).then(r => {
    if (r && r.ok) { const gp = gpLoad(); gp.ev = gp.ev || {}; if (!gp.ev[EVC.id]) { gp.ev[EVC.id] = true; gp.chips = gp.chips || {}; gp.chips[EVC.chip] = true;
        if (r.grant === true || (r.grant === undefined && r.first === true)) { gp.proofs += EVC.reward; evFlash('ev_got', TH.gold); AU.play('shop'); } gpSave(); } if (EV.d) EV.d.claimed = true; }
    else if (r && r.reject === 'notyet') evFlash('ev_notyet'); else evFlash('wc_fail'); })
    .catch(() => evFlash('wc_fail')).finally(() => { EV.claiming = false; });
}
function evFlash(k, c) { EV.flash = { txt: L(k, EVC.reward), c: c || TH.red, t: 0 }; }

// ---- the main-menu window ----
function evCardBox() { return { x: W - 186, y: 16, w: 158, h: 98 }; }
function evBar(x, y, w, h, n, c) { const p = clamp(n / EVC.goal, 0, 1); rect(x, y, w, h, '#1a1a1f'); rect(x, y, Math.round(w * p), h, n >= EVC.goal ? TH.green : c); if (p > 0 && p < 1) rect(x + Math.round(w * p) - 1, y - 1, 2, h + 2, '#fff6d8'); }
function drawEventCard(t) {
  const b = evCardBox(), k = easeOut(clamp((MENU.t - .2) / .5, 0, 1)); if (k <= 0) return;
  const hov = !TOUCH.on && inR(b, Input.mx, Input.my), cx = b.x + Math.round((1 - k) * 20), w = b.w, y = b.y, lh = lineH(), acc = TH.ember; ctx.globalAlpha = k;
  const open = evOpen(), left = open ? evLeft() : L('ev_over'); mmCard(cx, y, w, b.h, acc, L('ev_tag'), hov); text(left, cx + w - 6, y + 4 - (isCJK(left) ? 0 : -1), open ? TH.red : '#8e877b', 1, 'right');
  let yy = y + 18; text(fitText(L('ev_name'), w - 14), cx + 7, yy - 1, '#e8e1d3'); yy += lh + 1;
  // two counters, one bar each
  for (const [lab, n, c] of [[L('ev_tx'), evX(), acc], [L('ev_ti'), evI(), '#8ed872']]) { text(lab, cx + 7, yy - 1, '#8e877b'); const s = EV.d ? fmtNum(n) + '/' + fmtNum(EVC.goal) : '-'; text(s, cx + w - 7, yy - 1, EV.d ? '#c9c1b2' : '#6e675c', 1, 'right'); yy += lh; evBar(cx + 7, yy, w - 14, 4, n, c); yy += 7; }
  text(fitText(L('ev_rewardShort', EVC.reward), w - 14), cx + 7, yy, '#d8c890'); yy += lh + 1;
  const tip = evDone() && !evClaimedHere() ? L('ev_claimTip') : L('ev_tip'), blink = ((t * 2) | 0) % 2 === 0 || hov;
  text(tip + ' >', cx + w / 2, Math.min(yy, y + b.h - 11), blink ? TH.bone2 : TH.faint, 1, 'center');
  ctx.globalAlpha = 1;
}

// ---- the detail page ----
function openEvent() { EV.t = 0; EV.hits = []; EV.next = 0; goPage('event'); }
function updateEvent(rdt) {
  EV.t += rdt; if (EV.flash) { EV.flash.t += rdt; if (EV.flash.t > 2.4) EV.flash = null; } evTick();
  if (pressed('Escape')) { backPage(); return; }
  if (Input.clicked) { const h = EV.hits.find(q => inR(q, Input.mx, Input.my)); if (h) { Input.clicked = false; h.f(); } }
}
function evBox(x, y, w, h, acc) { rect(x, y, w, h, '#0f0f12'); box(x, y, w, h, null, '#26262c'); rect(x, y, 2, h, acc); }
// the page: the countdown, a progress block for each mode, how a clear counts, the reward with its button
function drawEvent(t) {
  panel(L('ev_tag'), TH.gold); EV.hits = []; const lh = lineH(), x = 34, w = W - 68, open = evOpen();
  { const s = L('g_proofs', gpLoad().proofs), sx = W - 64 - textW(s); drawProof(sx - 10, 21); text(s, sx, 22 - (isCJK(s) ? 1 : 0), TH.gold); }
  let y = 38; text(L('ev_name'), x + 2, y, '#e8e1d3'); text(L('ev_end'), x + 2, y + lh, '#5a5a62');
  { const left = open ? evLeft() : L('ev_over'); text(open ? L('ev_leftHead') : '', x + w - 2, y, '#6e675c', 1, 'right'); text(left, x + w - 2, y + lh, open ? TH.red : '#8e877b', 1.5, 'right'); }
  y += lh * 2 + 6;
  const half = Math.floor((w - 8) / 2);
  [[L('ev_tx'), evX(), EV.d ? EV.d.todayX : 0, TH.gold, L('ev_hx')], [L('ev_ti'), evI(), EV.d ? EV.d.todayI : 0, '#8ed872', L('ev_hi')]].forEach(([lab, n, td, c, how], k) => {
    const bx = x + k * (half + 8), done = n >= EVC.goal; evBox(bx, y, half, 58, done ? TH.green : c); text(lab, bx + 10, y + 6, '#e8e1d3'); if (done) text(L('ev_doneTag'), bx + half - 8, y + 6, TH.green, 1, 'right');
    const p = clamp(n / EVC.goal, 0, 1), bw = half - 20, by = y + 20; rect(bx + 10, by, bw, 8, '#08080a'); box(bx + 9, by - 1, bw + 2, 10, null, '#2a2a30'); rect(bx + 10, by, Math.round(bw * p), 8, done ? TH.green : c); rect(bx + 10, by, Math.round(bw * p), 1, '#fff2c0');
    const big = EV.d ? fmtNum(n) + ' / ' + fmtNum(EVC.goal) + '  ' + Math.floor(p * 100) + '%' : evOn() ? L('bd_loading') : L('g_dz'); text(big, bx + 10, by + 12, '#d8d4c8');
    if (EV.d) text(L('ev_today', fmtNum(td || 0)), bx + half - 10, by + 12, '#8e877b', 1, 'right'); text(fitText(how, half - 20), bx + 10, by + 25, '#6e675c'); });
  y += 64; text(fitText(L('ev_rule6') + (EV.d ? '   ' + L('ev_mine', fmtNum(EV.d.mine || 0)) : ''), w), x + 2, y, '#5a5a62'); y += lh + 4;
  // the reward
  const by = H - 34, rh = by - 6 - y; if (rh > 18) { evBox(x, y, w, rh, TH.gold); ctx.drawImage(mktIcon('armory'), x + 8, y + Math.round(rh / 2) - 10, 20, 20);
    text(L('ev_rewardHead'), x + 34, y + Math.round(rh / 2) - lh + 1, '#6e675c'); text(fitText(L('ev_reward', EVC.reward), w - 44), x + 34, y + Math.round(rh / 2) + 1, TH.gold); }
  const claimed = evClaimedHere(), bb = { x: W / 2 + 4, y: by, w: 92, h: 16, f: () => backPage() }; EV.hits.push(bb); drawBtn(bb.x, bb.y, bb.w, bb.h, L('back'), !TOUCH.on && inR(bb, Input.mx, Input.my), '#e8e1d3');
  const can = evDone() && !claimed && !EV.claiming, lbl = claimed ? L('ev_claimed') : EV.claiming ? L('ch_wait') : evDone() ? L('ev_claim') : L('ev_locked');
  const cb = { x: W / 2 - 132, y: by, w: 128, h: 16, f: () => { if (can) evClaim(); else AU.play('locked'); } }; EV.hits.push(cb); drawBtn(cb.x, cb.y, cb.w, cb.h, lbl, can, can ? TH.gold : '#3c3732');
  if (!NET.user && evOn()) text(L('ev_guest'), W - 38, by + 4, '#8e877b', 1, 'right');
  const f = EV.flash; if (f) { const a = clamp(Math.min(f.t / .1, (2.4 - f.t) / .3), 0, 1), s = f.txt, w2 = textW(s) + 16; ctx.globalAlpha = a; rect(W / 2 - w2 / 2, by - 20, w2, 13, '#0b0b0d'); box(W / 2 - w2 / 2, by - 20, w2, 13, null, f.c); text(s, W / 2, by - 17 - (isCJK(s) ? 1 : 0), f.c, 1, 'center'); ctx.globalAlpha = 1; }
}
