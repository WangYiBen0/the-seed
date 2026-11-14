// ===== TheSeed world channel: everyone playing can talk here (DZMM server function 'world') =====
// polling: every 5 s while the panel is open, every 15 s for the main-menu card; during a run with the panel closed, a cheap check
// every 60 s keeps the unread badge up to date (the whole game may only run 5 server calls at once, see fnCall in net.js). One message every 20 s, up to 100 characters; the server keeps 200.
'use strict';
const WC_POLL = 5, WC_CARD = 15, WC_HEAD = 60, WC_MAX = 100, WC_KEEP = 200;
const WC = { msgs: [], seq: -1, head: -1, open: false, from: 'menu', t: 0, busy: false, nextPoll: 0, nextHead: 0, cool: 0, err: '', errT: 0,
  el: null, inp: null, scroll: 0, drag: null, sending: false, more: true, older: false, cid: null, hov: -1 };
const wcOn = () => !ONDZ() || PLAT.caps.fn !== false;
// outside DZMM there is no server: the channel shows a few sample messages and what you send stays on this machine
const WC_SAMPLE = [['夜鸦', '第三层的透析机救了我一命，清掉了玻璃心'], ['Rook', 'ANYONE BEAT THE PALE HOST ON DESPAIR YET?'], ['灰烬', '武装直升机的援助太好用了'], ['ミズキ', '炮撃支援、ボス戦で最高'], ['老周', '钉枪永远的神'], ['Ash', 'SENTRY DROP TANKS THE CRAWLERS NICELY'], ['阿七', '有人知道千岛的隐藏结局怎么解锁吗']];
function wcLocalSeed() { if (WC.msgs.length) return; const now = Date.now(); WC_SAMPLE.forEach(([name, text], i) => WC.msgs.push({ seq: i, name, text, at: now - (WC_SAMPLE.length - i) * 7 * 60e3, mine: false })); WC.seq = WC.head = WC_SAMPLE.length - 1; }
const worldFn = (action, body) => fnCall('world', action, body);
const wcNow = () => performance.now() / 1000;
const wcSeen = () => Number.isInteger(SET.wcSeen) ? SET.wcSeen : -1;
// unread: newer than the last message you had on screen (your own do not count)
function wcUnread() { if (WC.open) return 0; const s = wcSeen(), mine = WC.msgs.filter(m => m.seq > s && m.mine).length; return Math.max(0, Math.max(WC.seq, WC.head) - s - mine); }
function wcMerge(list) { for (const m of list || []) if (!WC.msgs.some(q => q.seq === m.seq)) WC.msgs.push(m); WC.msgs.sort((a, b) => a.seq - b.seq); if (WC.msgs.length > WC_KEEP) WC.msgs.splice(0, WC.msgs.length - WC_KEEP);
  if (WC.msgs.length) WC.seq = Math.max(WC.seq, WC.msgs[WC.msgs.length - 1].seq); }
function wcPoll() {
  if (!ONDZ()) { wcLocalSeed(); WC.nextPoll = wcNow() + 3600; return; }
  WC.busy = true;
  // pages forward from the last message we have; while there are more it asks again right away
  let more = false;
  worldFn('list', { since: WC.seq }).then(r => { if (!r || r.ok === false) return; if (r.gap) WC.msgs.length = 0; wcMerge(r.msgs); WC.seq = Math.max(WC.seq, r.seq); WC.head = Math.max(WC.head, r.seq); more = !!r.more;
      // what is on screen counts as read: only the open panel (the bar shows the newest line and the unread count)
      if (WC.open) wcMarkSeen(); })
    .catch(() => { }).finally(() => { WC.busy = false; WC.nextPoll = more ? 0 : wcNow() + (WC.open ? WC_POLL : WC_CARD); });
}
function wcHead() {
  if (!ONDZ()) { wcLocalSeed(); WC.nextHead = wcNow() + 3600; return; }
  WC.busy = true;
  worldFn('head').then(r => { if (r && r.ok !== false && Number.isInteger(r.seq)) { WC.head = r.seq; if (wcSeen() < 0 && r.seq >= 0 && !WC.msgs.length) { SET.wcSeen = r.seq; saveSettings(); } } })
    .catch(() => { }).finally(() => { WC.busy = false; WC.nextHead = wcNow() + WC_HEAD; });
}
function wcMarkSeen() { const s = Math.max(WC.seq, WC.head); if (s > wcSeen()) { SET.wcSeen = s; saveSettings(); } }
// called every frame: decides whether it is time to ask the server
function wcTick() {
  if (!wcOn() || WC.busy) return; const now = wcNow(), onScreen = WC.open || (G.state === 'menu' && MENU.page === 'main');
  if (onScreen) { if (now >= WC.nextPoll) wcPoll(); }
  else if (G.p && G.state !== 'menu' && now >= WC.nextHead) wcHead();
}

// ---------------- the panel ----------------
function openWorld(from) {
  if (!wcOn()) { if (G.state === 'menu') netToast('g_dz', '#8e877b'); else notify(L('g_dz'), col(4)); AU.play('locked'); return; }
  wcBuild(); WC.open = true; WC.from = from; WC.t = 0; WC.scroll = 0; WC.err = ''; WC.nextPoll = 0; WC.el.style.display = 'block'; WC.inp.value = ''; wcPlace();
  const canPost = !!NET.user || !ONDZ(); WC.inp.disabled = !canPost; WC.inp.placeholder = canPost ? '' : L('wc_guest');
  if (from === 'play') G.state = 'world'; AU.play('menuOk'); wcMarkSeen();
  if (!TOUCH.on && (NET.user || !ONDZ())) setTimeout(() => { try { WC.inp.focus(); } catch (e) { } }, 30);
}
function closeWorld() { WC.open = false; if (WC.el) { WC.inp.blur(); WC.el.style.display = 'none'; } wcMarkSeen(); if (WC.from === 'play') G.state = 'play'; Input.keys = {}; Input.prev = {}; Input.clicked = false; Input.down = false; AU.play('menu', .8); }
function wcBuild() {
  if (WC.el) return;
  const el = document.createElement('div'); el.id = 'wcEd'; el.style.cssText = 'position:fixed;display:none;z-index:5';
  const inp = document.createElement('input'); inp.type = 'text'; inp.maxLength = WC_MAX * 2; inp.autocomplete = 'off'; inp.spellcheck = false; inp.setAttribute('enterkeyhint', 'send');
  inp.style.cssText = 'box-sizing:border-box;width:100%;height:100%;margin:0;padding:0 .5em;border:0;outline:none;border-radius:0;background:transparent;color:#e8e1d3;cursor:text;caret-color:#efb94a;font-family:"Microsoft YaHei","PingFang SC","Noto Sans SC","Hiragino Sans",sans-serif;-webkit-user-select:text;user-select:text';
  inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); wcSend(); } else if (e.key === 'Escape') { e.preventDefault(); closeWorld(); } });
  inp.addEventListener('input', () => { WC.err = ''; WC.cid = null; });
  el.appendChild(inp); document.body.appendChild(el); WC.el = el; WC.inp = inp;
}
function wcLayout() { let x = 10, y = 8, w = W - 20, h = H - 16;
  if (WC.from === 'bar' && typeof wcChipBox === 'function') { const cb = wcChipBox(), k = easeOut(clamp(WC.t / .22, 0, 1)); w = Math.min(W - 12, Math.max(cb.w + 40, 300)); h = Math.min(H - TB_H - 14, 196); x = clamp(cb.x + cb.w - w, 6, W - w - 6); y = H - TB_H - 4 - h + Math.round((1 - k) * (h + 12)); }
  if (WC.from === 'bar') return { x, y, w, h, close: { x: -99, y: -99, w: 0, h: 0 }, pin: null, log: { x: x + 8, y: y + 8, w: w - 16, h: h - 38 }, field: { x: x + 8, y: y + h - 24, w: w - 78, h: 18 }, send: { x: x + w - 66, y: y + h - 24, w: 58, h: 18 } };
  return { x, y, w, h, close: { x: x + w - 20, y: y + 4, w: 14, h: 14 }, pin: { x: x + 8, y: y + 27, w: w - 16, h: 13 }, log: { x: x + 8, y: y + 43, w: w - 16, h: h - 73 }, field: { x: x + 8, y: y + h - 24, w: w - 78, h: 18 }, send: { x: x + w - 66, y: y + h - 24, w: 58, h: 18 } }; }
function wcPlace() { const r = view.getBoundingClientRect(), f = wcLayout().field, sx = r.width / W, sy = r.height / H, st = WC.el.style; st.visibility = WC.from === 'bar' && WC.t < .2 ? 'hidden' : 'visible';
  st.left = (r.left + f.x * sx) + 'px'; st.top = (r.top + f.y * sy) + 'px'; st.width = (f.w * sx) + 'px'; st.height = (f.h * sy) + 'px'; WC.inp.style.fontSize = Math.max(12, Math.round(10 * sy)) + 'px'; }
function wcFlash(k, a) { WC.err = L(k, a); WC.errT = wcNow(); }
function wcSend() {
  if (WC.sending) return; if (!NET.user && ONDZ()) { wcFlash('wc_guest'); return; }
  const text = String(WC.inp.value || '').replace(/\s+/g, ' ').trim(); if (!text) return;
  if ([...text].length > WC_MAX) { wcFlash('wc_long', WC_MAX); AU.play('locked'); return; }
  if (!ONDZ()) { wcLocalSeed(); const seq = WC.seq + 1; wcMerge([{ seq, name: SET.name || L('lg_guest'), title: achTitle(), text, at: Date.now(), mine: true }]); WC.seq = WC.head = seq; WC.inp.value = ''; WC.err = ''; AU.play('select'); return; }
  const left = Math.ceil(WC.cool - wcNow()); if (left > 0) { wcFlash('wc_wait', left); AU.play('locked'); return; }
  // the same id is reused if this exact message is sent again after a failure, so the server never posts it twice
  WC.cid = WC.cid || Date.now().toString(36) + Math.random().toString(36).slice(2, 7); WC.sending = true;
  worldFn('post', { text, cid: WC.cid, avatar: NET.user.avatar, title: achTitle() })
    .then(r => { if (r && r.ok) { WC.inp.value = ''; WC.cid = null; WC.err = ''; WC.cool = wcNow() + 20; WC.nextPoll = 0; AU.play('select'); return; }
      if (r && r.retry === 'wait') { WC.cool = wcNow() + (r.wait || 20000) / 1000; wcFlash('wc_wait', Math.ceil((r.wait || 20000) / 1000)); }
      else if (r && r.reject === 'long') wcFlash('wc_long', WC_MAX); else if (r && r.reject === 'login') wcFlash('wc_guest'); else wcFlash('wc_fail'); AU.play('locked'); })
    .catch(() => { wcFlash('wc_fail'); AU.play('locked'); }).finally(() => { WC.sending = false; });
}
function wcLoadOlder() {
  if (WC.older || !WC.more || !WC.msgs.length || WC.msgs.length >= WC_KEEP) return; WC.older = true;
  worldFn('older', { before: WC.msgs[0].seq }).then(r => { if (!r || r.ok === false) return; WC.more = !!r.more && r.msgs.length > 0; wcMerge(r.msgs); }).catch(() => { }).finally(() => { WC.older = false; });
}
function updateWorld(rdt) {
  WC.t += rdt; wcPlace(); const lay = wcLayout(), mx = Input.mx, my = Input.my, hit = r => inR(r, mx, my);
  WC.hov = TOUCH.on ? -1 : hit(lay.send) ? 1 : hit(lay.close) ? 2 : -1;
  if (Input.wheel) WC.scroll = Math.max(0, WC.scroll - Input.wheel * 12);
  if (Input.clicked && WC.from === 'bar' && !hit(lay)) { Input.clicked = false; closeWorld(); return; } // a click outside the unfolded panel (the chip included) folds it away
  if (Input.clicked) { if (hit(lay.close)) { closeWorld(); return; } if (hit(lay.send)) wcSend(); else if (hit(lay.field)) { try { WC.inp.focus(); } catch (e) { } } else if (hit(lay.log)) WC.drag = { y: my, s: WC.scroll }; Input.clicked = false; }
  if (WC.drag) { if (Input.down) WC.scroll = Math.max(0, WC.drag.s + (my - WC.drag.y)); else WC.drag = null; }
  if (pressed('Escape')) { closeWorld(); return; }
  if (pressed('Enter') && document.activeElement !== WC.inp && (NET.user || !ONDZ())) { try { WC.inp.focus(); } catch (e) { } }
}
const wcColor = name => { let h = 0; for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return MENU_ACC()[h % 6]; };
const wcTime = ms => { const d = new Date(ms), z = n => ('0' + n).slice(-2); return z(d.getHours()) + ':' + z(d.getMinutes()); };
function drawWorldPanel() {
  const lay = wcLayout(), bar = WC.from === 'bar', k = easeOut(clamp(WC.t / .25, 0, 1)), { x, y, w, h } = lay;
  ctx.globalAlpha = (bar ? .35 : .72) * k; rect(0, 0, W, bar ? H - TB_H : H, '#000'); ctx.globalAlpha = bar ? 1 : k;
  if (bar) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H - TB_H); ctx.clip(); }
  if (bar) winFrame(x, y, w, h, TH.ember, null, { close: false });
  else { winFrame(x, y, w, h, TH.ember, L('wc_title'), { closeBox: lay.close }); text(L('wc_rule', WC_MAX), x + 22 + textW(L('wc_title'), 1.5), y + 8 - (isCJK(L('wc_rule', 1)) ? 0 : -1), '#6e675c'); }
  // the pinned notice, always on top (not in the panel unfolded from the bar)
  if (lay.pin) { const P = lay.pin, tag = L('wc_pinTag'), tw = textW(tag) + 6; rect(P.x, P.y, P.w, P.h, '#16140c'); box(P.x, P.y, P.w, P.h, null, '#4a3f1c'); rect(P.x + 2, P.y + 2, tw, P.h - 4, C.gold);
    text(tag, P.x + 5, P.y + (isCJK(tag) ? 2 : 4), '#0a0908'); text(fitText(L('wc_pin'), P.w - tw - 12), P.x + tw + 7, P.y + (isCJK(L('wc_pin')) ? 2 : 4), '#f0e6c8'); }
  // messages: newest at the bottom; drag or scroll up to read back (reaching the top asks for older ones)
  const L0 = lay.log, lh = lineH(), rows = [];
  if (!WC.msgs.length) { const loading = WC.busy || WC.nextPoll === 0; rows.push({ s: loading ? L('bd_loading') : L('wc_empty'), c: '#57524a' }); if (loading) for (const l of wrapW(L('net_slow'), L0.w - 12)) rows.push({ s: l, c: '#6e675c' }); }
  for (const m of WC.msgs) { const head = m.name + '  ' + wcTime(m.at); rows.push({ s: head, c: m.mine ? C.gold : wcColor(m.name), head: true, ts: wcTime(m.at), nm: m.name, title: TITLES[m.title] ? m.title : '' });
    for (const l of wrapW(m.text, L0.w - 12)) rows.push({ s: l, c: m.mine ? '#f0e6c8' : '#e8e8ec' }); rows.push({ gap: true }); }
  const rowH = r => r.gap ? 3 : lh, total = rows.reduce((a, r) => a + rowH(r), 0), maxS = Math.max(0, total - L0.h); WC.scroll = Math.min(WC.scroll, maxS);
  if (maxS > 0 && WC.scroll >= maxS - 2) wcLoadOlder();
  ctx.save(); ctx.beginPath(); ctx.rect(L0.x, L0.y, L0.w, L0.h); ctx.clip();
  let yy = L0.y + Math.max(0, L0.h - total) - (total > L0.h ? maxS - WC.scroll : 0);
  for (const r of rows) { const rh = rowH(r); if (!r.gap && yy > L0.y - rh && yy < L0.y + L0.h) { if (r.head) { text(r.nm, L0.x + 2, yy + 1, r.c); const tw = r.title ? drawTitleTag(r.title, L0.x + 4 + textW(r.nm), yy + 1) + 2 : 0; text(r.ts, L0.x + 8 + textW(r.nm) + tw, yy + 1, '#3f3f46'); } else text(r.s, L0.x + 8, yy + 1, r.c); } yy += rh; }
  ctx.restore();
  if (maxS > 0) { const kh = Math.max(10, L0.h * L0.h / total), ky = L0.y + (L0.h - kh) * (1 - WC.scroll / maxS); rect(L0.x + L0.w + 2, L0.y, 1, L0.h, '#1f1f24'); rect(L0.x + L0.w + 1, ky, 3, kh, '#4c463f'); }
  // input row (the typed text is the real input on top of this box)
  const f = lay.field, focus = document.activeElement === WC.inp; rect(f.x, f.y, f.w, f.h, '#050506'); box(f.x, f.y, f.w, f.h, null, focus ? C.gold : '#4c463f');
  const n = [...String(WC.inp ? WC.inp.value : '').trim()].length; if (n) text(n + '/' + WC_MAX, f.x + f.w - 4, f.y - 8, n > WC_MAX ? C.red : '#57524a', 1, 'right');
  if (WC.err && wcNow() - WC.errT < 4) text(WC.err, f.x, f.y - 8 - (isCJK(WC.err) ? 1 : 0), C.red);
  if (!NET.user && ONDZ()) text(L('wc_guest'), f.x + 6, f.y + 6 - (isCJK(L('wc_guest')) ? 1 : 0), '#3c3732');
  const left = Math.ceil(WC.cool - wcNow()), lbl = WC.sending ? L('ch_wait') : left > 0 ? left + 's' : L('ch_send');
  drawBtn(lay.send.x, lay.send.y, lay.send.w, lay.send.h, lbl, WC.hov === 1 && left <= 0, left > 0 || (!NET.user && ONDZ()) ? '#57524a' : TH.ember);
  if (bar) ctx.restore();
  ctx.globalAlpha = 1;
}
function mmCard(x, y, w, h, acc, title, hov, right) { rect(x, y, w, h, 'rgba(8,8,8,.92)'); box(x, y, w, h, null, hov ? '#ffffff' : WIN_EDGE);
  text(title, x + 7, y + (isCJK(title) ? 4 : 6), hov ? TH.bone : TH.bone2); if (right) text(right, x + w - 6, y + (isCJK(right) ? 4 : 6), hov ? acc : TH.faint, 1, 'right'); }
// in a run: a speech-bubble button with the unread count; click (or T) to pause and open the channel
const WC_BTN = () => ({ x: W - 158, y: 3, w: 16, h: 13 });
function drawWorldBtn() {
  if (!wcOn()) return; const b = WC_BTN(), hov = !TOUCH.on && inR(b, Input.mx, Input.my), c = hov ? C.cyan : '#8e877b';
  rect(b.x, b.y, b.w, b.h - 3, col(0)); box(b.x, b.y, b.w, b.h - 3, null, c); rect(b.x + 3, b.y + b.h - 3, 3, 2, c); rect(b.x + 3, b.y + b.h - 4, 2, 1, col(0));
  for (let i = 0; i < 3; i++) rect(b.x + 4 + i * 3, b.y + 4, 2, 2, c);
  const n = wcUnread(); if (n > 0) { const s = n > 99 ? '99+' : String(n), w = Math.max(7, textW(s) + 4); rect(b.x + b.w - w / 2 - 1, b.y - 3, w, 8, C.red); text(s, b.x + b.w - 1, b.y - 1, '#ffffff', 1, 'center'); }
}
