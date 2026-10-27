// ===== EMBER overlays: a scrollable picker and a text / number editor, drawn as the game's own windows =====
// the picker is all canvas; the editor is a canvas window with a transparent <input>/<textarea> laid over its field, so phone keyboards
// and Chinese / Japanese input methods work (the same trick as the name editor). The game is paused underneath while one is open.
'use strict';
const OVL = { open: false, kind: null, o: null, t: 0, sel: 0, top: 0, hits: [], err: '', el: null, f: null, drag: null, lmx: 0, lmy: 0 };
const OVL_RH = 16;
function ovlCss() {
  if (document.getElementById('ovlCss')) return; const st = document.createElement('style'); st.id = 'ovlCss';
  st.textContent = `#ovlEd{position:fixed;z-index:6;display:none}#ovlEd textarea,#ovlEd input{box-sizing:border-box;width:100%;height:100%;margin:0;border:0;outline:none;border-radius:0;background:transparent;color:#e6dfd1;caret-color:#d0702e;padding:.35em .5em;resize:none;line-height:1.45;font-family:"Microsoft YaHei","PingFang SC","Noto Sans SC","Hiragino Sans",sans-serif;-webkit-user-select:text;user-select:text;cursor:text}
#ovlEd textarea::-webkit-scrollbar{width:6px}#ovlEd textarea::-webkit-scrollbar-thumb{background:#3c3732}#ovlEd textarea::-webkit-scrollbar-track{background:transparent}#ovlEd textarea{scrollbar-width:thin;scrollbar-color:#3c3732 transparent}
#ovlEd input[type=number]::-webkit-inner-spin-button{opacity:.4}#ovlEd ::selection{background:rgba(208,112,46,.45)}`;
  document.head.appendChild(st);
}
function ovlOpen(kind, o) { Object.assign(OVL, { open: true, kind, o, t: 0, sel: 0, top: 0, hits: [], err: '', drag: null, press: null }); AU.play('menuOk'); }
function closeOvl() { if (!OVL.open) return; OVL.open = false; if (OVL.el) { if (OVL.f) OVL.f.blur(); OVL.el.style.display = 'none'; OVL.el.innerHTML = ''; OVL.f = null; } Input.keys = {}; Input.prev = {}; Input.clicked = false; Input.down = false; AU.play('menu', .8); }
// ---------------- the picker: items [{ v, label, sub }]; the current one is lit and scrolled into view ----------------
function openPicker({ title, hint, items, cur, acc, onPick }) {
  ovlOpen('pick', { title, hint, items, cur, acc: acc || TH.ember, onPick }); const i = items.findIndex(it => it.v === cur); OVL.sel = Math.max(0, i);
  const L2 = ovlLayout(); OVL.top = clamp(OVL.sel - Math.floor(L2.vis / 2), 0, Math.max(0, items.length - L2.vis));
}
// ---------------- the editor. number: { min, max }; reset: the value the default button restores; onOk(v) returns an error message or nothing ----------------
function openTextEd({ title, hint, value, multiline, number, maxLen, acc, reset, okLabel, onOk }) {
  ovlCss(); ovlOpen('text', { title, hint, multiline, number, reset, okLabel, onOk, acc: acc || TH.ember });
  if (!OVL.el) { const el = document.createElement('div'); el.id = 'ovlEd'; document.body.appendChild(el); OVL.el = el; }
  const f = document.createElement(multiline ? 'textarea' : 'input'); if (!multiline) f.type = number ? 'number' : 'text'; if (number) { f.min = number.min; f.max = number.max; f.inputMode = 'numeric'; }
  if (maxLen) f.maxLength = maxLen; f.value = value == null ? '' : String(value); f.spellcheck = false; f.autocomplete = 'off';
  f.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); closeOvl(); return; } if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229 && (!multiline || e.ctrlKey || e.metaKey)) { e.preventDefault(); ovlOk(); } });
  f.addEventListener('input', () => { OVL.err = ''; });
  OVL.el.innerHTML = ''; OVL.el.appendChild(f); OVL.f = f; OVL.el.style.display = 'block'; ovlPlace();
  if (!TOUCH.on) setTimeout(() => { try { f.focus(); if (!multiline) f.select(); } catch (e) { } }, 30);
}
function ovlOk() { const o = OVL.o, f = OVL.f; if (!f) return; let v = f.value;
  if (o.number) { const n = Math.round(+v); if (!isFinite(n) || n < o.number.min || n > o.number.max || String(v).trim() === '') { OVL.err = L('ovl_range', o.number.min, o.number.max); AU.play('locked'); return; } v = n; }
  const e = o.onOk(v); if (e) { OVL.err = e; AU.play('locked'); return; } closeOvl(); AU.play('select'); }
// ---------------- layout ----------------
function ovlLayout() {
  const o = OVL.o, w = Math.min(W - 40, OVL.kind === 'pick' ? 300 : 360), hint = o.hint ? wrapW(o.hint, w - 24).slice(0, OVL.kind === 'pick' ? 3 : 5) : [], hh = hint.length ? hint.length * lineH() + 6 : 0;
  if (OVL.kind === 'pick') { const vis = Math.max(3, Math.min(o.items.length, Math.floor((H - 90 - hh) / OVL_RH))), h = 30 + hh + vis * OVL_RH + 32, x = Math.round(W / 2 - w / 2), y = Math.round(H / 2 - h / 2);
    return { x, y, w, h, hint, hh, vis, list: { x: x + 10, y: y + 30 + hh, w: w - 20, h: vis * OVL_RH }, by: y + h - 22 }; }
  const fh = o.multiline ? Math.min(118, H - 120 - hh) : 18, h = 30 + hh + fh + 40, x = Math.round(W / 2 - w / 2), y = Math.round(H / 2 - h / 2) - (TOUCH.on ? 30 : 0);
  return { x, y, w, h, hint, hh, field: { x: x + 10, y: y + 30 + hh, w: w - 20, h: fh }, by: y + h - 22 };
}
function ovlPlace() { if (!OVL.el || OVL.kind !== 'text') return; const r = view.getBoundingClientRect(), f = ovlLayout().field, sx = r.width / W, sy = r.height / H, st = OVL.el.style;
  st.left = (r.left + f.x * sx) + 'px'; st.top = (r.top + f.y * sy) + 'px'; st.width = (f.w * sx) + 'px'; st.height = (f.h * sy) + 'px'; if (OVL.f) OVL.f.style.fontSize = Math.max(12, Math.round(9.5 * sy)) + 'px'; }
function ovlButtons(L2) { const o = OVL.o, out = [], bw = 72; let x = L2.x + L2.w - 10 - bw;
  if (OVL.kind === 'text') { out.push({ k: o.okLabel || L('nm_ok'), x, ok: true, f: () => ovlOk() }); x -= bw + 6; }
  out.push({ k: L('nm_cancel'), x, f: () => closeOvl() }); x -= bw + 6;
  if (OVL.kind === 'text' && o.reset !== undefined) out.push({ k: L('ovl_reset'), x, f: () => { if (OVL.f) { OVL.f.value = o.reset; OVL.err = ''; OVL.f.focus(); } AU.play('menu'); } });
  return out.map(b => Object.assign(b, { y: L2.by, w: bw, h: 16 })); }
// ---------------- input ----------------
function updateOvl(rdt) {
  OVL.t += rdt; ovlPlace(); const L2 = ovlLayout(), mx = Input.mx, my = Input.my, cb = { x: L2.x + L2.w - 20, y: L2.y + 4, w: 14, h: 14 };
  if (pressed('Escape')) { closeOvl(); return; }
  if (Input.clicked && inR(cb, mx, my)) { Input.clicked = false; closeOvl(); return; }
  for (const b of ovlButtons(L2)) if (Input.clicked && inR(b, mx, my)) { Input.clicked = false; b.f(); return; }
  if (OVL.kind !== 'pick') { if (Input.clicked && !inR(L2, mx, my)) { Input.clicked = false; } return; }
  const o = OVL.o, n = o.items.length, l = L2.list, mv = Math.abs(mx - OVL.lmx) + Math.abs(my - OVL.lmy) > .5; OVL.lmx = mx; OVL.lmy = my;
  const keep = () => { if (OVL.sel < OVL.top) OVL.top = OVL.sel; if (OVL.sel >= OVL.top + L2.vis) OVL.top = OVL.sel - L2.vis + 1; };
  if (pressed('KeyW') || pressed('ArrowUp')) { OVL.sel = (OVL.sel - 1 + n) % n; keep(); AU.play('menu'); }
  if (pressed('KeyS') || pressed('ArrowDown')) { OVL.sel = (OVL.sel + 1) % n; keep(); AU.play('menu'); }
  if (Input.wheel) OVL.top = clamp(OVL.top + Input.wheel, 0, Math.max(0, n - L2.vis));
  // a finger drags the list; a tap (no drag) picks
  if (Input.down && inR(l, mx, my)) { if (!OVL.drag) OVL.drag = { y: my, top: OVL.top, moved: false }; else { const d = (OVL.drag.y - my) / OVL_RH; if (Math.abs(OVL.drag.y - my) > 4) OVL.drag.moved = true; OVL.top = clamp(Math.round(OVL.drag.top + d), 0, Math.max(0, n - L2.vis)); } }
  const hr = inR(l, mx, my) ? OVL.top + Math.floor((my - l.y) / OVL_RH) : -1;
  if (mv && hr >= 0 && hr < n && !TOUCH.on && hr !== OVL.sel) { OVL.sel = hr; AU.play('menu'); }
  // a press on a row only marks it; the pick happens when the finger (or button) comes up without having dragged the list
  if (Input.clicked && hr >= 0 && hr < n) { Input.clicked = false; OVL.press = { row: hr }; }
  let tapped = false, tapRow = -1; if (!Input.down) { if (OVL.press && !(OVL.drag && OVL.drag.moved)) { tapped = true; tapRow = OVL.press.row; } OVL.press = null; OVL.drag = null; }
  if (tapped || pressed('Enter') || pressed('Space')) { const it = o.items[tapped ? tapRow : OVL.sel]; Input.clicked = false; closeOvl(); o.onPick(it.v); return; }
  if (Input.clicked && !inR(L2, mx, my)) { Input.clicked = false; closeOvl(); }
}
// ---------------- drawing ----------------
function drawOvl() {
  if (!OVL.open) return; const L2 = ovlLayout(), o = OVL.o, k = easeOut(clamp(OVL.t / .2, 0, 1)), cb = { x: L2.x + L2.w - 20, y: L2.y + 4, w: 14, h: 14 };
  ctx.globalAlpha = k; winBackdrop(.62); ctx.save(); ctx.translate(0, Math.round((1 - k) * 8)); winFrame(L2.x, L2.y, L2.w, L2.h, o.acc, o.title, { closeBox: cb });
  L2.hint.forEach((ln, i) => text(ln, L2.x + 12, L2.y + 28 + i * lineH(), TH.dim));
  if (OVL.kind === 'pick') { const l = L2.list; rect(l.x, l.y, l.w, l.h, 'rgba(0,0,0,.3)'); box(l.x - 1, l.y - 1, l.w + 2, l.h + 2, null, TH.line);
    for (let j = 0; j < L2.vis; j++) { const i = OVL.top + j, it = o.items[i]; if (!it) break; const y = l.y + j * OVL_RH, on = i === OVL.sel, cur = it.v === o.cur;
      if (on) { const g = ctx.createLinearGradient(l.x, 0, l.x + l.w, 0); g.addColorStop(0, thA(o.acc, .22)); g.addColorStop(1, thA(o.acc, 0)); rect(l.x, y, l.w, OVL_RH, g); rect(l.x, y, 2, OVL_RH, o.acc); }
      if (cur) rect(l.x + 6, y + 7, 3, 3, o.acc);
      const s = fitText(String(it.label), l.w - (it.sub ? 110 : 24)); text(s, l.x + 13, y + 5 - (isCJK(s) ? 2 : 0), on || cur ? TH.bone : TH.bone2);
      if (it.sub) { const ss = fitText(String(it.sub), 92); text(ss, l.x + l.w - 6, y + 5 - (isCJK(ss) ? 2 : 0), TH.faint, 1, 'right'); } }
    if (o.items.length > L2.vis) { const sh = Math.max(8, l.h * L2.vis / o.items.length), sy = l.y + (l.h - sh) * OVL.top / Math.max(1, o.items.length - L2.vis); rect(l.x + l.w - 2, sy, 1, sh, TH.line2); } }
  else { const f = L2.field; rect(f.x, f.y, f.w, f.h, 'rgba(0,0,0,.45)'); box(f.x - 1, f.y - 1, f.w + 2, f.h + 2, null, document.activeElement === OVL.f ? thA(o.acc, .8) : TH.line2);
    if (OVL.err) text(fitText(OVL.err, L2.w - 260), L2.x + 12, L2.by + 4, C.red); else if (o.multiline && !TOUCH.on) text('CTRL+ENTER', L2.x + 12, L2.by + 5, TH.faint); }
  for (const b of ovlButtons(L2)) drawBtn(b.x, b.y, b.w, b.h, b.k, (!TOUCH.on && inR(b, Input.mx, Input.my)) || b.ok, b.ok ? o.acc : TH.bone);
  ctx.restore(); ctx.globalAlpha = 1;
}
