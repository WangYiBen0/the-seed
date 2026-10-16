// ===== EMBER: the player's name (2-10 characters), asked once after the story and editable any time in Settings =====
// a real <input> sits over the canvas box, so phone keyboards and Chinese / Japanese input methods work
'use strict';
const NAMEED = { open: false, first: false, t: 0, err: '', el: null, inp: null, hov: -1, lmx: 0, lmy: 0 };
const NAME_MIN = 2, NAME_MAX = 10;
const cleanName = s => String(s || '').replace(/\s+/g, ' ').trim();
const nameLen = s => [...s].length;
function nameEdBuild() {
  if (NAMEED.el) return;
  const el = document.createElement('div'); el.id = 'nameEd'; el.style.cssText = 'position:fixed;display:none;z-index:5';
  const inp = document.createElement('input'); inp.type = 'text'; inp.maxLength = 24; inp.autocomplete = 'off'; inp.spellcheck = false; inp.setAttribute('enterkeyhint', 'done');
  inp.style.cssText = 'box-sizing:border-box;width:100%;height:100%;margin:0;padding:0 .4em;border:0;outline:none;border-radius:0;background:transparent;color:#e8e1d3;text-align:center;cursor:text;caret-color:#efb94a;font-family:"Microsoft YaHei","PingFang SC","Noto Sans SC","Hiragino Sans",sans-serif;-webkit-user-select:text;user-select:text';
  // Enter confirms (but not while an input method is still composing), Esc cancels
  inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); nameEdConfirm(); } else if (e.key === 'Escape') { e.preventDefault(); nameEdCancel(); } });
  inp.addEventListener('input', () => { NAMEED.err = ''; });
  el.appendChild(inp); document.body.appendChild(el); NAMEED.el = el; NAMEED.inp = inp;
}
function openNameEd(first) {
  nameEdBuild(); Object.assign(NAMEED, { open: true, first: !!first, t: 0, err: '', hov: -1 });
  // the first time, the platform nickname is offered as a starting point
  NAMEED.inp.value = SET.name || (NET.user && NET.user.name ? [...cleanName(NET.user.name)].slice(0, NAME_MAX).join('') : ''); NAMEED.el.style.display = 'block'; nameEdPlace(); AU.play('menuOk');
  // phones only raise the keyboard when the box itself is tapped
  if (!TOUCH.on) setTimeout(() => { try { NAMEED.inp.focus(); NAMEED.inp.select(); } catch (e) { } }, 30);
}
function closeNameEd() { NAMEED.open = false; if (NAMEED.el) { NAMEED.inp.blur(); NAMEED.el.style.display = 'none'; } Input.keys = {}; Input.prev = {}; Input.clicked = false; Input.down = false; }
function nameEdConfirm() {
  const v = cleanName(NAMEED.inp.value), n = nameLen(v);
  if (n < NAME_MIN) { NAMEED.err = L('nm_short'); AU.play('locked'); return; }
  if (n > NAME_MAX) { NAMEED.err = L('nm_long'); AU.play('locked'); return; }
  SET.name = v; saveSettings(); closeNameEd(); AU.play('select');
  if (G.state === 'menu' || G.state === 'pause') NET.toast = { txt: L('nm_done', v), c: C.gold, t: 0 };
}
function nameEdCancel() { if (NAMEED.first) return; closeNameEd(); AU.play('menu', .8); }
function nameEdLayout() {
  const pw = 270, ph = 122, px = Math.round(W / 2 - pw / 2), py = Math.round(H / 2 - ph / 2) - (TOUCH.on ? 40 : 0);
  const field = { x: px + 34, y: py + 36, w: pw - 68, h: 20 }, by = py + ph - 26, bw = 96;
  const btns = NAMEED.first ? [{ k: 'nm_ok', x: W / 2 - bw / 2, y: by, w: bw, h: 16 }] : [{ k: 'nm_cancel', x: W / 2 - bw - 5, y: by, w: bw, h: 16 }, { k: 'nm_ok', x: W / 2 + 5, y: by, w: bw, h: 16 }];
  return { px, py, pw, ph, field, btns };
}
// keep the real input glued to the drawn box (the canvas moves when the window or keyboard resizes it)
function nameEdPlace() {
  const r = view.getBoundingClientRect(), f = nameEdLayout().field, sx = r.width / W, sy = r.height / H, st = NAMEED.el.style;
  st.left = (r.left + f.x * sx) + 'px'; st.top = (r.top + f.y * sy) + 'px'; st.width = (f.w * sx) + 'px'; st.height = (f.h * sy) + 'px'; NAMEED.inp.style.fontSize = Math.max(12, Math.round(11 * sy)) + 'px';
}
function updateNameEd(rdt) {
  NAMEED.t += rdt; nameEdPlace(); const lay = nameEdLayout(), mx = Input.mx, my = Input.my;
  let hov = -1; lay.btns.forEach((b, i) => { if (inR(b, mx, my)) hov = i; });
  const mv = Math.abs(mx - NAMEED.lmx) + Math.abs(my - NAMEED.lmy) > .5; NAMEED.lmx = mx; NAMEED.lmy = my; if (mv || Input.clicked) NAMEED.hov = TOUCH.on ? -1 : hov;
  if (NAMEED.t < .2) return;
  if (Input.clicked && hov >= 0) { Input.clicked = false; if (lay.btns[hov].k === 'nm_ok') nameEdConfirm(); else nameEdCancel(); return; }
  if (Input.clicked && inR(lay.field, mx, my)) { try { NAMEED.inp.focus(); } catch (e) { } }
  if (pressed('Escape')) { nameEdCancel(); return; }
  if (pressed('Enter') && document.activeElement !== NAMEED.inp) nameEdConfirm();
}
function drawNameEd() {
  const lay = nameEdLayout(), { px, py, pw, ph, field: f } = lay, k = clamp(NAMEED.t / .2, 0, 1), focus = document.activeElement === NAMEED.inp;
  ctx.globalAlpha = (NAMEED.first ? .82 : .7) * k; rect(0, 0, W, H, '#000'); ctx.globalAlpha = k;
  rect(px, py, pw, ph, 'rgba(8,8,8,.97)'); box(px, py, pw, ph, null, WIN_EDGE);
  textS(L('nm_title'), W / 2, py + 12, '#e8e1d3', 1, 'center');
  // the input box itself (the typed text is drawn by the real input on top)
  rect(f.x, f.y, f.w, f.h, '#050506'); box(f.x, f.y, f.w, f.h, null, focus ? C.gold : '#4c463f');
  if (focus && ((G.time * 2) | 0) % 2) rect(f.x + 2, f.y + f.h - 3, f.w - 4, 1, '#3c3732');
  const n = nameLen(cleanName(NAMEED.inp.value)), cnt = n + '/' + NAME_MAX; text(cnt, f.x + f.w, f.y + f.h + 4, n > NAME_MAX || (n && n < NAME_MIN) ? C.red : '#57524a', 1, 'right');
  if (NAMEED.err) text(NAMEED.err, f.x, f.y + f.h + 4 - (isCJK(NAMEED.err) ? 1 : 0), C.red);
  wrapW(L('nm_hint'), pw - 24).slice(0, 2).forEach((l, i) => text(l, W / 2, py + 76 + i * lineH(), '#6e675c', 1, 'center'));
  lay.btns.forEach((b, i) => drawBtn(b.x, b.y, b.w, b.h, L(b.k), NAMEED.hov === i, b.k === 'nm_ok' ? C.gold : '#e8e1d3'));
  ctx.globalAlpha = 1;
}
