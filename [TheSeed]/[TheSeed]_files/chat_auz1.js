// ===== EMBER squad chat: talk freely with the survivors in your squad (DZMM platform AI, dzmm.completions) =====
// opened with C (out of combat), from the pause menu, or from the 少女们 page. Each girl keeps one conversation across runs (in the girls progress);
// the prompts themselves (global, personality, affection) are all in js/prompts.js.
'use strict';
const CHAT_KEEP = 48;            // messages kept per girl (enough for the longest history setting, 20 rounds)
const CHT = { id: null, t: 0, busy: false, req: 0, el: null, inp: null, scroll: 0, hov: -1, from: 'play', lmx: 0, lmy: 0 };
const chatOn = () => ONDZ() && PLAT.caps.completions !== false;
// in a run: whoever in the squad is still standing; on the 少女们 page: the girl you opened
const chatMates = () => CHT.from === 'menu' ? (CHT.id ? [{ id: CHT.id }] : []) : (G.squad || []).filter(m => !m.away);
function chatLog(id) { return girlData(id).log; }
// Keep complete finished messages; bound the number of messages, never cut off a reply.
function chatPersist() { for (const id of SURV_IDS) { const d = gpLoad().girls[id]; if (d) d.log = d.log.filter(q => !q.live && q.r !== 'sys' && q.t).slice(-CHAT_KEEP).map(q => ({ r: q.r, t: String(q.t) })); } gpSave(); }

// ---------------- opening and closing ----------------
function openChat(from) {
  if (!chatOn()) { notify(L('ch_off'), col(4)); AU.play('locked'); return false; }
  const ms = chatMates(); if (!ms.length) { notify(L((G.squad || []).length ? 'ch_away' : 'ch_none', (G.squad || []).length ? svName(G.squad[0].id) : ''), col(4)); AU.play('locked'); return false; }
  const r = roomAt(G.p.x, G.p.y); if (r && r.active) { notify(L('ch_fight'), C.red); AU.play('locked'); return false; }
  chatBuild(); CHT.from = from || 'play'; CHT.id = ms.some(m => m.id === CHT.id) ? CHT.id : ms[0].id; CHT.t = 0; CHT.scroll = 0;
  G.state = 'chat'; CHT.el.style.display = 'block'; CHT.inp.value = ''; chatPlace(); loadPortrait(CHT.id); AU.play('menuOk');
  if (!TOUCH.on) setTimeout(() => { try { CHT.inp.focus(); } catch (e) { } }, 30);
  return true;
}
// from the 少女们 page (the menu stays underneath)
function openChatMenu(id) { chatBuild(); CHT.from = 'menu'; CHT.id = id; CHT.t = 0; CHT.scroll = 0; GIRLS.chat = true; CHT.el.style.display = 'block'; CHT.inp.value = ''; chatPlace(); loadPortrait(id); AU.play('menuOk');
  if (!TOUCH.on) setTimeout(() => { try { CHT.inp.focus(); } catch (e) { } }, 30); }
function closeChat() { chatPersist(); if (CHT.el) { CHT.inp.blur(); CHT.el.style.display = 'none'; } CHT.req++; CHT.busy = false; if (CHT.from === 'menu') GIRLS.chat = false; else G.state = 'play'; CHT.from = 'play'; Input.keys = {}; Input.prev = {}; Input.clicked = false; Input.down = false; AU.play('menu', .8); }
function chatBuild() {
  if (CHT.el) return;
  const el = document.createElement('div'); el.id = 'chatEd'; el.style.cssText = 'position:fixed;display:none;z-index:5';
  const inp = document.createElement('input'); inp.type = 'text'; inp.maxLength = 120; inp.autocomplete = 'off'; inp.spellcheck = false; inp.setAttribute('enterkeyhint', 'send');
  inp.style.cssText = 'box-sizing:border-box;width:100%;height:100%;margin:0;padding:0 .5em;border:0;outline:none;border-radius:0;background:transparent;color:#e8e1d3;cursor:text;caret-color:#efb94a;font-family:"Microsoft YaHei","PingFang SC","Noto Sans SC","Hiragino Sans",sans-serif;-webkit-user-select:text;user-select:text';
  inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); chatSend(); } else if (e.key === 'Escape') { e.preventDefault(); closeChat(); } });
  el.appendChild(inp); document.body.appendChild(el); CHT.el = el; CHT.inp = inp;
}

// ---------------- layout ----------------
function chatLayout() {
  const pw = Math.round(PORT_H * PORT_AR), lw = Math.max(240, W - pw - 30), x = 10, y = 8, h = H - 16;
  const ms = chatMates(), tabs = []; let tx = x + 6; for (const m of ms) { const w = textW(svName(m.id)) + 14; tabs.push({ id: m.id, x: tx, y: y + 6, w, h: 13 }); tx += w + 4; }
  return { x, y, w: lw, h, tabs, close: { x: x + lw - 20, y: y + 5, w: 15, h: 15 }, log: { x: x + 6, y: y + 26, w: lw - 12, h: h - 56 },
    field: { x: x + 6, y: y + h - 24, w: lw - 64, h: 18 }, send: { x: x + lw - 54, y: y + h - 24, w: 48, h: 18 } };
}
function chatPlace() { const r = view.getBoundingClientRect(), f = chatLayout().field, sx = r.width / W, sy = r.height / H, st = CHT.el.style;
  st.left = (r.left + f.x * sx) + 'px'; st.top = (r.top + f.y * sy) + 'px'; st.width = (f.w * sx) + 'px'; st.height = (f.h * sy) + 'px'; CHT.inp.style.fontSize = Math.max(12, Math.round(10 * sy)) + 'px'; }

// ---------------- the conversation (prompt assembly: buildChatMessages in js/prompts.js) ----------------
async function chatSend() {
  const txt = cleanName(CHT.inp.value).slice(0, 120); if (!txt || CHT.busy || !CHT.id) return;
  const id = CHT.id, log = chatLog(id); CHT.inp.value = ''; log.push({ r: 'p', t: txt }); gpSave(); const msgs = buildChatMessages(id, log), reply = { r: 'h', t: '', live: true }; log.push(reply);
  CHT.busy = true; CHT.scroll = 0; const rq = ++CHT.req; AU.play('menu', 1.2);
  try {
    await dzmm.completions({ model: chatModel(), messages: msgs }, (content, done) => {
      if (rq !== CHT.req) return; reply.t = String(content || '').trim(); if (done) reply.live = false; });
    if (rq === CHT.req && !reply.t) reply.t = L('ch_fail');
  } catch (e) {
    // the platform already tells the player what went wrong (quota, rate limit, ...); here she just stays quiet
    if (rq === CHT.req && !reply.t) { reply.r = 'sys'; reply.t = L('ch_fail'); }
  } finally { reply.live = false; while (log.length > CHAT_KEEP) log.shift(); if (rq === CHT.req) { CHT.busy = false; chatPersist(); } }
}
function updateChat(rdt) {
  CHT.t += rdt; chatPlace(); const lay = chatLayout(), mx = Input.mx, my = Input.my;
  if (!chatMates().some(m => m.id === CHT.id)) { closeChat(); return; }
  const hit = r => inR(r, mx, my); CHT.hov = TOUCH.on ? -1 : hit(lay.send) ? 1 : hit(lay.close) ? 2 : -1;
  if (Input.wheel) CHT.scroll = Math.max(0, CHT.scroll - Input.wheel * 12);
  if (Input.clicked) {
    const tab = lay.tabs.find(hit);
    if (tab && tab.id !== CHT.id) { CHT.id = tab.id; CHT.scroll = 0; CHT.req++; CHT.busy = false; loadPortrait(tab.id); AU.play('menu'); }
    else if (hit(lay.close)) { closeChat(); return; }
    else if (hit(lay.send)) chatSend();
    else if (hit(lay.field)) { try { CHT.inp.focus(); } catch (e) { } }
    else if (hit(lay.log)) CHT.drag = { y: my, s: CHT.scroll };
    Input.clicked = false; }
  if (CHT.drag) { if (Input.down) CHT.scroll = Math.max(0, CHT.drag.s + (my - CHT.drag.y)); else CHT.drag = null; }
  if (pressed('Escape')) { closeChat(); return; }
  if (pressed('Enter') && document.activeElement !== CHT.inp) { try { CHT.inp.focus(); } catch (e) { } }
  updateParticles(rdt);
}
function drawChat() {
  const lay = chatLayout(), id = CHT.id, S = SURV[id], c = S.c, k = easeOut(clamp(CHT.t / .3, 0, 1)), pw = Math.round(PORT_H * PORT_AR);
  ctx.globalAlpha = .7 * k; rect(0, 0, W, H, '#000'); ctx.globalAlpha = 1;
  drawPortrait(id, W - pw - 6 + (1 - k) * 24, H - PORT_H, k, false);
  ctx.globalAlpha = k; const { x, y, w, h } = lay;
  rect(x, y, w, h, '#0b0b0d'); box(x, y, w, h, null, '#2d2925'); rect(x, y, w, 2, c);
  // who you are talking to
  for (const t of lay.tabs) { const on = t.id === CHT.id, tc = SURV[t.id].c; rect(t.x, t.y, t.w, t.h, on ? tc : '#151310'); if (!on) box(t.x, t.y, t.w, t.h, null, '#3c3732'); const nm = svName(t.id); text(nm, t.x + 7, t.y + (isCJK(nm) ? 2 : 4), on ? '#0a0908' : '#aaa293'); }
  { const b = lay.close, hv = CHT.hov === 2; box(b.x, b.y, b.w, b.h, hv ? '#1d1a17' : null, hv ? '#e8e1d3' : '#4c463f'); pxLine(b.x + 4, b.y + 4, b.x + b.w - 5, b.y + b.h - 5, '#c9c1b2'); pxLine(b.x + b.w - 5, b.y + 4, b.x + 4, b.y + b.h - 5, '#c9c1b2'); }
  // the log, newest at the bottom; drag or scroll to read back
  const L0 = lay.log, lh = lineH(), rows = [];
  const log = chatLog(id); if (!log.length) rows.push({ s: L('ch_hint', svName(id)), c: '#57524a', al: 'center' });
  for (const q of log) { const me = q.r === 'p', sys = q.r === 'sys', who = me ? (SET.name || '?') : sys ? '' : svName(id);
    const body = q.t || (q.live ? '.'.repeat(1 + ((G.time * 3) | 0) % 3) : ''); if (who) rows.push({ s: who, c: me ? '#8e877b' : c, al: me ? 'right' : 'left', head: true });
    for (const l of wrapW(body, L0.w - 30)) rows.push({ s: l, c: sys ? '#6e675c' : me ? '#c9c1b2' : '#e8e1d3', al: me ? 'right' : 'left' });
    rows.push({ gap: true }); }
  const rowH = r => r.gap ? 4 : r.head ? lh - 1 : lh, total = rows.reduce((a, r) => a + rowH(r), 0), maxS = Math.max(0, total - L0.h); CHT.scroll = Math.min(CHT.scroll, maxS);
  ctx.save(); ctx.beginPath(); ctx.rect(L0.x, L0.y, L0.w, L0.h); ctx.clip();
  let yy = L0.y + Math.max(0, L0.h - total) + (total > L0.h ? -(maxS - CHT.scroll) : 0);
  for (const r of rows) { const rh = rowH(r); if (!r.gap && yy > L0.y - rh && yy < L0.y + L0.h) { const tx = r.al === 'right' ? L0.x + L0.w - 4 : r.al === 'center' ? L0.x + L0.w / 2 : L0.x + 4; text(r.s, tx, yy + 1, r.c, 1, r.al); } yy += rh; }
  ctx.restore();
  if (maxS > 0) { const th = L0.h, kh = Math.max(10, th * L0.h / total), ky = L0.y + (th - kh) * (1 - CHT.scroll / maxS); rect(L0.x + L0.w + 2, L0.y, 1, th, '#1f1f24'); rect(L0.x + L0.w + 1, ky, 3, kh, '#4c463f'); }
  // input row (the typed text is the real input on top of this box)
  const f = lay.field, focus = document.activeElement === CHT.inp; rect(f.x, f.y, f.w, f.h, '#050506'); box(f.x, f.y, f.w, f.h, null, focus ? C.gold : '#4c463f');
  if (!CHT.inp.value && !focus) text(L('ch_hint', svName(id)), f.x + 6, f.y + 6 - (isCJK(L('ch_hint', '')) ? 1 : 0), '#3c3732');
  drawBtn(lay.send.x, lay.send.y, lay.send.w, lay.send.h, CHT.busy ? L('ch_wait') : L('ch_send'), CHT.hov === 1 && !CHT.busy, CHT.busy ? '#57524a' : c);
  ctx.globalAlpha = 1;
}
