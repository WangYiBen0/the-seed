// First ten unique accounts: the server's immutable slots own the reward; this client only submits completed runs and shows status.
'use strict';
const LTC = { end: Date.UTC(2026, 9, 21, 16), title: 't_traveler', pending: 'achroma_ltpend' };
const LT = { d: null, ownerUid: null, notice: null, busy: false, sending: false, err: false, next: 0, serverAt: 0, anchor: 0, press: null, hits: [], pointer: null };
Object.assign(STR, {
  lt_tag: ['LIMITED CHALLENGE', '限量任務', '限定任務', '限量任务'],
  lt_rules: ['CLEAR EXPLORE · DESPAIR · 5 MODIFIERS', '通關突入探索 · 絕境 · 5修飾符', '突入探索クリア・絶境・修飾子5つ', '通关突入探索 · 绝境 · 5修饰符'],
  lt_end: ['UNTIL 10.22 00:00 · GMT+8', '截止 10.22 00:00 · GMT+8', '期限 10.22 00:00・GMT+8', '截止 10.22 00:00 · GMT+8'],
  lt_left: ['LEFT {0}/10', '剩餘 {0}/10', '残り {0}/10', '剩余 {0}/10'],
  lt_names: ['TITLE HOLDERS', '已獲得', '獲得者', '已获得'], lt_empty: ['NO WINNERS YET', '暫無獲獎者', 'まだ獲得者なし', '暂无获奖者'],
  lt_loading: ['SYNCING', '同步中', '同期中', '同步中'], lt_off: ['CONNECT TO DZMM TO SYNC', '連線後同步名額', '接続後に同期', '联网后同步名额'],
  lt_stale: ['RECONNECTING', '正在重新同步', '再接続中', '正在重新同步'],
  lt_full: ['FULL · 48-HOUR SHOWCASE', '名額已滿 · 公示48小時', '満員・48時間掲示', '名额已满 · 公示48小时'],
  lt_closed: ['ENDED · 48-HOUR SHOWCASE', '已截止 · 公示48小時', '終了・48時間掲示', '已截止 · 公示48小时'],
  lt_hide: ['HIDES IN {0}', '{0} 後窗口自動消失', '{0}後に自動非表示', '{0} 后窗口自动消失'],
  lt_footer: ['48H SHOWCASE · HIDES IN {0}', '公示48h · {0}後消失', '48h掲示・{0}後に消去', '公示48h · {0}后消失'],
  lt_got: ['TITLE AWARDED: TERMINAL TRAVELER', '獲得稱號：終末旅行者', '称号獲得：終末旅行者', '获得称号：终末旅行者'],
  lt_wear: ['EQUIP IN SETTINGS → ACHIEVEMENTS', '前往設定 → 成就佩戴', '設定 → 実績から装備', '前往设置 → 成就佩戴'],
  lt_count: ['FIRST 10 ACCOUNTS · AUTO AWARD', '全服前10名 · 自動發放', '全サーバー先着10名・自動付与', '全服前10名 · 自动发放']
});
const ltOnline = () => ONDZ() && !NET.off && PLAT.caps.fn !== false;
const ltNow = () => LT.d ? LT.serverAt + Math.max(0, performance.now() - LT.anchor) : Date.now();
const ltHidden = () => !!(LT.d && ltNow() >= LT.d.hideAt);
const ltPhase = () => LT.d?.fullAt ? 'full' : ltNow() >= (LT.d?.end || LTC.end) ? 'ended' : 'open';
const ltOwnsTitle = () => !!(NET.user && LT.ownerUid === NET.user.uid && LT.d?.mine);
function ltApply(r) {
  if (!r || !Array.isArray(r.winners) || !Number.isFinite(r.now) || !Number.isFinite(r.hideAt)) return;
  // An earlier in-flight status response cannot roll back a newly confirmed award.
  if (LT.d && (r.winners.length < LT.d.winners.length || r.now < LT.d.now)) return;
  LT.d = r; LT.ownerUid = NET.user?.uid || null; LT.serverAt = r.now; LT.anchor = performance.now(); LT.err = false;
  if (ltOwnsTitle()) { NET.specialTitles = [...new Set([...(NET.specialTitles || []), LTC.title])];
    const gp = gpLoad(); if (!gp.ltWearHintShown && !LT.notice) LT.notice = { uid: LT.ownerUid, t: 0 }; }
}
// A grant can arrive on the victory screen or while continuing endless. Keep the personal notice separate from menu-only network toasts.
function ltDrawGrantNotice(dt) { const n = LT.notice; if (!n || document.hidden) return; if (!ltOwnsTitle() || n.uid !== NET.user?.uid) { LT.notice = null; return; }
  const gp = gpLoad(); if (!gp.ltWearHintShown) { gp.ltWearHintShown = true; gp.ltNotified = true; gpSave(); }
  n.t += dt; if (n.t >= 8) { LT.notice = null; return; }
  const w = Math.min(W - 24, Math.max(textW(L('lt_got')), textW(L('lt_wear'))) + 24), x = (W - w) / 2;
  ctx.save(); ctx.globalAlpha = Math.min(1, n.t / .2, (8 - n.t) / .4); box(x, 12, w, 34, 'rgba(8,8,8,.96)', '#bfa4b9');
  text(fitText(L('lt_got'), w - 16), W / 2, 19, '#f7d6e8', 1, 'center'); text(fitText(L('lt_wear'), w - 16), W / 2, 33, '#c9e8ff', 1, 'center'); ctx.restore();
}
const _stepLt = step; step = function (dt) { _stepLt(dt); ltDrawGrantNotice(dt); };
function ltStatus() { if (!ltOnline() || LT.busy) return; LT.busy = true;
  fnCall('board', 'limitedStatus').then(r => { if (r?.ok) ltApply(r); else LT.err = true; }).catch(() => { LT.err = true; })
    .finally(() => { LT.busy = false; LT.next = performance.now() + (LT.err ? 20000 : 10000); }); }
function ltPend() { try { const a = JSON.parse(STORE.getItem(LTC.pending) || '[]'); return Array.isArray(a) ? a.filter(r => r && typeof r.rid === 'string').slice(0, 10) : []; } catch { return []; } }
const ltSavePending = a => STORE.setItem(LTC.pending, JSON.stringify(a));
function ltQueueClear() {
  if (!achRunEligible() || G.mode === 'invade' || G.endless || G.floor !== 4 || cleanModifiers(G.modifiers, G.diff, G.mode).length !== 5) return;
  const r = Object.assign(buildResult(true), { mode: 'explore', modifiers: G.modifiers.slice(), test: false });
  const pending = ltPend(); if (!pending.some(p => p.rid === r.rid)) { pending.push(r); ltSavePending(pending); } ltFlush();
}
function ltFlush() { if (!ltOnline() || !NET.user || LT.sending) return; const run = ltPend()[0]; if (!run) return; LT.sending = true;
  fnCall('board', 'limitedSubmit', { run }).then(r => {
    ltApply(r); if (r?.ok || (r?.reject && r.reject !== 'login')) { ltSavePending(ltPend().filter(p => p.rid !== run.rid)); setTimeout(ltFlush, 400); }
    else ltRetry();
  }).catch(ltRetry).finally(() => { LT.sending = false; }); }
function ltRetry() { clearTimeout(LT.retry); LT.retry = setTimeout(ltFlush, 5000); }
const _girlsOnClearLt = girlsOnClear; girlsOnClear = function (...a) { try { ltQueueClear(); } catch (e) { console.error('[limited]', e); } return _girlsOnClearLt(...a); };
const _netInitLt = netInit; netInit = function () { _netInitLt(); ltStatus(); setTimeout(ltFlush, 500); };
addEventListener('focus', () => { LT.next = 0; if (NET.ready) ltFlush(); });

// All three cards, ten winners and the expiry footer fit above the dock without scrolling.
// Actions still happen on release, so a phone swipe never claims a daily reward.
const ltRail = () => ({ x: W - 200, y: 8, w: 188, h: H - 38 });
const ltMain = () => G.state === 'menu' && MENU.page === 'main' && TBAR.area < 0 && !CAMP.dep && !CAMP.pop && !ANN.open && !WC.open && !FSQ.open && !NAMEED.open && !OVL.open;
const ltRows = () => Math.ceil((LT.d?.winners.length || 0) / 2);
function ltBox() { const b = dyBox(); return { x: b.x, y: b.y + b.h + 4, w: b.w, h: 64 + Math.max(1, ltRows()) * 10 + (ltPhase() === 'open' ? 0 : 12) }; }
const ltCardHit = b => inR(b, Input.mx, Input.my) && inR(ltRail(), Input.mx, Input.my);
function ltClip(fn) { scrollClip(ltRail()); try { fn(); } finally { ctx.restore(); } }
const _drawEventCardLt = drawEventCard; drawEventCard = t => ltClip(() => _drawEventCardLt(t));
const _drawDailyCardLt = drawDailyCard; drawDailyCard = t => ltClip(() => _drawDailyCardLt(t));
function ltDraw(t) {
  LT.hits = []; if (ltHidden()) return; const a = (1 - TBAR.fk) * (1 - (CAMP.dep ? clamp(CAMP.dep.t / .5, 0, 1) : 0)); if (a <= .02) return;
  const b = ltBox(), k = easeOut(clamp((MENU.t - .4) / .5, 0, 1)), x = b.x + Math.round((1 - k) * 20), y = b.y, c = '#e8bfdc';
  ltClip(() => { ctx.globalAlpha = a * k;
    const left = LT.d ? L('lt_left', LT.d.remaining) : L(ltOnline() ? 'lt_loading' : 'lt_off');
    mmCard(x, y, b.w, b.h, c, fitText(L('lt_tag'), b.w - Math.min(80, textW(left)) - 20), false);
    text(fitText(left, 80), x + b.w - 7, y + 4, LT.d?.remaining === 0 ? '#ffe6a1' : '#c9e8ff', 1, 'right');
    const fit = (s, yy, col = '#c9c1b2') => text(fitText(s, b.w - 14), x + 7, yy, col);
    fit(L('lt_rules'), y + 16, '#e8e1d3'); fit(L('lt_end'), y + 26, '#9f9aa9');
    drawTitleTag(LTC.title, x + b.w / 2, y + 37, 1.1, 'center');
    fit(L('lt_names'), y + 49, c);
    text(fitText(LT.err ? L('lt_stale') : L('lt_count'), b.w - textW(L('lt_names')) - 24), x + b.w - 7, y + 49, LT.err ? '#d99888' : '#9f9aa9', 1, 'right');
    const winners = LT.d?.winners || [], col = (b.w - 14) / 2; if (!winners.length) fit(L(LT.d ? 'lt_empty' : 'lt_loading'), y + 60, '#6e6878');
    for (let i = 0; i < winners.length; i++) { const w = winners[i], bx = x + 7 + i % 2 * col, yy = y + 60 + Math.floor(i / 2) * 10;
      text(fitText(w.rank + '. ' + w.name, col - 4), bx, yy, w.mine ? '#ffe6a1' : '#aebbcf');
      LT.hits.push({ x: bx, y: yy - 1, w: col - 4, h: 10, name: w.name }); }
    if (ltPhase() !== 'open') {
      const seconds = Math.max(0, Math.ceil(((LT.d?.hideAt || LTC.end + 48 * 3600e3) - ltNow()) / 1000)); fit(L('lt_footer', fmtTime(seconds)), y + b.h - 12, '#ffe6a1'); }
    ctx.globalAlpha = 1;
  });
}
const _drawMainMenuLt = drawMainMenu; drawMainMenu = function (t) { _drawMainMenuLt(t); ltDraw(t); };
function ltTap() {
  if (!inR(ltRail(), Input.mx, Input.my)) return;
  for (let j = 0; j < DAILY.tasks.length; j++) if (inR(dyBtn(j), Input.mx, Input.my)) { const q = DAILY.tasks[j], d = dyData(); if (!d[q]) dyTake(q); else if (d[q] === 'done') dyClaim(q); return; }
  if (!evHidden() && inR(evCardBox(), Input.mx, Input.my)) { openEvent(); return; }
  const winner = LT.hits.find(b => inR(b, Input.mx, Input.my)); if (winner) NET.toast = { txt: winner.name, c: '#c9e8ff', t: 0 };
}
const _updateMenuLt = updateMenu; updateMenu = function (rdt) {
  if (ltMain()) {
    if (!document.hidden && performance.now() >= LT.next && !ltHidden()) ltStatus();
    const inside = inR(ltRail(), Input.mx, Input.my);
    if (Input.clicked && inside && !LT.press) LT.press = { x: Input.mx, y: Input.my, moved: false };
    if (LT.press) {
      const p = LT.press; if (Math.abs(Input.mx - p.x) > 4 || Math.abs(Input.my - p.y) > 4 || !inside || Input.wheel) p.moved = true;
      Input.clicked = false;
      if (!Input.down) { LT.press = null; LT.pointer = null; if (!p.moved && inside) ltTap(); }
    }
    if (inside) Input.clicked = false, Input.wheel = 0;
  } else { LT.press = null; LT.pointer = null; }
  return _updateMenuLt(rdt);
};
// Preserve a fast touch gesture even when press, move and release all arrive between two animation frames.
addEventListener('pointerdown', e => { if (!ltMain() || !e.isPrimary || e.button !== 0 || e.target !== view) return;
  const p = diaPointerPos(e); if (!inR(ltRail(), p.x, p.y)) return; LT.press = { x: p.x, y: p.y, moved: false }; LT.pointer = e.pointerId; });
for (const type of ['pointermove', 'pointerup', 'pointercancel']) addEventListener(type, e => { if (e.pointerId !== LT.pointer || !LT.press) return;
  const d = LT.press, p = diaPointerPos(e); if (type === 'pointercancel' || Math.abs(p.x - d.x) > 4 || Math.abs(p.y - d.y) > 4 || !inR(ltRail(), p.x, p.y)) d.moved = true;
  Input.mx = p.x; Input.my = p.y; if (type === 'pointercancel') Input.clicked = Input.down = false; if (type !== 'pointermove') LT.pointer = null;
});
