// ===== ACHROMA engine: two-pass canvas (pixel world + crisp UI), input, palette, fonts, sprites, particles, fx governor =====
'use strict';
// the logical height is fixed; the width follows the screen's shape (16:9 = 480, wider screens up to 640) so phones get no side bars
let H = 270; const T = 16; let US = 3; // H only changes while a docked window is laid out (withDock in js/ui.js)
// render quality (set from Settings): particle density, screen effects, UI sharpness, frame-rate cap
const QS = { part: 1, fx: true, fps: 60 };
const QP = { high: { part: 1, fx: 1, ui: 3, fps: 0 }, medium: { part: .6, fx: 1, ui: 3, fps: 0 }, low: { part: .35, fx: 0, ui: 2, fps: 0 }, lowest: { part: .15, fx: 0, ui: 2, fps: 30 } };
function idealW() { const a = innerWidth / Math.max(1, innerHeight); return a > 16 / 9 + .01 ? Math.min(640, Math.round(H * a / 2) * 2) : 480; }
let W = idealW();
const RELAYOUT = []; // things laid out once from W register a refresh here
// display canvas (UI pass renders at 3x so CJK text stays sharp); world renders at 480x270 then upscales
const view = document.getElementById('c'); view.width = W * US; view.height = H * US;
const vctx = view.getContext('2d'); vctx.imageSmoothingEnabled = false;
const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
const wctx = cv.getContext('2d'); wctx.imageSmoothingEnabled = false;
let ctx = wctx;
function beginWorld() { ctx = wctx; wctx.setTransform(1, 0, 0, 1, 0, 0); wctx.globalAlpha = 1; wctx.globalCompositeOperation = 'source-over'; if (wctx.filter !== 'none') wctx.filter = 'none'; }
function present() { vctx.setTransform(1, 0, 0, 1, 0, 0); vctx.imageSmoothingEnabled = false; vctx.drawImage(cv, 0, 0, W * US, H * US); }
function beginUI() { ctx = vctx; vctx.setTransform(US, 0, 0, US, 0, 0); vctx.imageSmoothingEnabled = false; vctx.globalAlpha = 1; vctx.globalCompositeOperation = 'source-over'; if (vctx.filter !== 'none') vctx.filter = 'none'; }

// ---- settings (persisted) ----
const SET = Object.assign({ master: .8, music: .6, sfx: .9, shake: 1, flash: 1, lang: 'en' }, (() => { try { return JSON.parse(STORE.getItem('achroma_set') || '{}'); } catch (e) { return {}; } })());
if ((SET.v || 0) < 2) { SET.lang = 'zhs'; SET.v = 2; }
function saveSettings() { try { STORE.setItem('achroma_set', JSON.stringify(SET)); } catch (e) { } }

// ---- math ----
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const choice = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (a, b, c, d) => Math.hypot(c - a, d - b);
const ang = (a, b, c, d) => Math.atan2(d - b, c - a);
// modulo instead of while-loops: an Infinity angle used to spin these loops forever and hang the tab
const angDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (!isFinite(d)) return 0; if (d > Math.PI) d -= Math.PI * 2; else if (d < -Math.PI) d += Math.PI * 2; return d; };
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeBack = t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function weighted(items, wf) { let s = 0; for (const it of items) s += wf(it); let r = Math.random() * s; for (const it of items) { r -= wf(it); if (r <= 0) return it; } return items[items.length - 1]; }

// ---- canvas scaling ----
function setUIScale(us) { if (us === US) return; US = us; view.width = W * US; view.height = H * US; vctx.imageSmoothingEnabled = false; }
function relayout() { const nw = idealW(); if (nw === W) return; W = nw; view.width = W * US; cv.width = W; vctx.imageSmoothingEnabled = false; wctx.imageSmoothingEnabled = false;
  vignette = null; for (const k in ditherCache) delete ditherCache[k]; for (const f of RELAYOUT) { try { f(); } catch (e) { console.error(e); } } }
// a frame that is hidden while the host loads has no size: never shrink the canvas to nothing, and re-fit as soon as the size
// changes, whether or not a resize event arrives (fitCheck runs every frame; a ResizeObserver covers the rest)
const FIT = { w: -1, h: -1 };
function fit() { FIT.w = innerWidth; FIT.h = innerHeight; if (!(innerWidth > 0 && innerHeight > 0)) return;
  relayout(); const s = Math.min(innerWidth / W, innerHeight / H); view.style.width = Math.floor(W * s) + 'px'; view.style.height = Math.floor(H * s) + 'px'; }
function fitCheck() { if (innerWidth !== FIT.w || innerHeight !== FIT.h) fit(); }
addEventListener('resize', fit); fit();
try { new ResizeObserver(fitCheck).observe(document.documentElement); } catch (e) { }

// ---- input ----
const Input = { keys: {}, prev: {}, padKeys: {}, padPrev: {}, padX: 0, padY: 0, padFire: false, mx: W / 2, my: H / 2, down: false, rdown: false, clicked: false, rclicked: false, wheel: 0 };
// typing into a text field (the name box) never reaches the game's keys
const typing = e => !!(e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA'));
addEventListener('keydown', e => { if (typing(e)) return; Input.keys[e.code] = true; if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); });
addEventListener('keyup', e => { Input.keys[e.code] = false; });
addEventListener('mousemove', e => { const r = view.getBoundingClientRect(); Input.mx = clamp((e.clientX - r.left) / r.width * W, 0, W - 1); Input.my = clamp((e.clientY - r.top) / r.height * H, 0, H - 1); });
addEventListener('mousedown', e => { if (e.button === 0) { Input.down = true; Input.clicked = true; } if (e.button === 2) { Input.rdown = true; Input.rclicked = true; } });
addEventListener('mouseup', e => { if (e.button === 0) Input.down = false; if (e.button === 2) Input.rdown = false; });
addEventListener('contextmenu', e => e.preventDefault());
addEventListener('wheel', e => { Input.wheel += Math.sign(e.deltaY); });
addEventListener('blur', () => { Input.keys = {}; Input.down = Input.rdown = false; });
const key = c => !!(Input.keys[c] || Input.padKeys[c]);
const attackHeld = () => Input.down || Input.padFire;
let ESC_TAP = false; // set for one frame by a window's close button
// Some nested menus consume an action by marking Input.prev; honor that for controllers too.
const pressed = c => (!!Input.keys[c] && !Input.prev[c]) || (!!Input.padKeys[c] && !Input.padPrev[c] && !Input.prev[c]) || (c === 'Escape' && ESC_TAP);
function inputEndFrame() { ESC_TAP = false; Input.prev = Object.assign({}, Input.keys); Input.padPrev = Object.assign({}, Input.padKeys); Input.clicked = false; Input.rclicked = false; Input.wheel = 0; }

// ---- palette (grayscale world; color is earned) ----
const PAL = ['#0a0908', '#1d1a17', '#2d2925', '#4c463f', '#8e877b', '#e8e1d3'];
// every floor tints the gray a little: ash (ruins), cold steel (blackout), sick olive (culture), pale fog (quarantine), dried blood (core lab)
const FLOOR_PAL = [['#0a0908', '#1d1a17', '#2d2925', '#4c463f', '#8e877b', '#e8e1d3'], ['#08090b', '#191c20', '#282c31', '#454b52', '#868c93', '#e4e6e6'],
  ['#090a07', '#1a1d16', '#292d23', '#454b3c', '#868b74', '#e3e4d0'], ['#090a0a', '#1b1d1d', '#2a2d2d', '#484d4c', '#8a908d', '#e6e9e4'], ['#0b0807', '#211816', '#322521', '#56403a', '#978074', '#ede0d4']];
function setFloorPal(fi) { const q = FLOOR_PAL[fi] || FLOOR_PAL[0]; for (let i = 0; i < 6; i++) PAL[i] = q[i]; vignette = null; }
let PALV = 0;
const col = i => PAL[i];
const C = { red: '#e0483e', cyan: '#5ed0c8', gold: '#efb94a', violet: '#a07ad8', frost: '#a4cfe0', green: '#8ed872', orange: '#ee7a34', pink: '#d873b0', lime: '#bfdc4a', indigo: '#8086dc' };

// ---- fonts: 3x5 pixel font for latin, system font for CJK ----
const FONT = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110',
  '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111',
  '9': '111101111001110', '.': '000000000000010', ',': '000000000010100', '!': '010010010000010', '?': '110001010000010',
  ':': '000010000010000', '-': '000000111000000', '+': '000010111010000', '%': '101001010100101', '/': '001001010100100',
  "'": '010010000000000', '(': '010100100100010', ')': '010001001001010', '>': '100010001010100', '<': '001010100010001',
  '#': '101111101111101', '*': '000101010101000', '=': '000111000111000', '_': '000000000000111', ' ': '000000000000000',
  '[': '110100100100110', ']': '011001001001011', '|': '010010010010010', '^': '010101000000000'
};
const isCJK = s => /[^\x00-\x7F]/.test(s);
// ---- pixel CJK: rasterize system glyphs at small size, threshold alpha -> crisp bitmap glyphs ----
const CJK_FAM = { zh: '"Microsoft JhengHei","PingFang TC","Noto Sans TC","MingLiU",sans-serif', zhs: '"Microsoft YaHei","PingFang SC","Noto Sans SC","SimHei",sans-serif', ja: '"MS Gothic","Yu Gothic","Hiragino Sans","Meiryo","Noto Sans JP",sans-serif' };
const glyphCache = new Map();
const cjkGP = sc => sc >= 3 ? 2 : sc === 2 ? 1 : 2 / 3;      // logical size of one glyph pixel
const cjkR = sc => Math.round(8 * sc / cjkGP(sc));           // raster size in glyph pixels
function glyph(ch, R, color) {
  const k = (SET.lang === 'ja' ? 'j' : SET.lang === 'zhs' ? 's' : 't') + R + ch + color; let g = glyphCache.get(k); if (g) return g;
  const fam = CJK_FAM[SET.lang] || CJK_FAM.zh, c = document.createElement('canvas'), x = c.getContext('2d');
  x.font = `${R}px ${fam}`; const adv = Math.max(1, Math.round(x.measureText(ch).width));
  c.width = adv + 2; c.height = R + 2; x.font = `${R}px ${fam}`; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.fillText(ch, 1, c.height / 2 + .5);
  const d = x.getImageData(0, 0, c.width, c.height), px = d.data; const rgb = hexRgb(color);
  for (let i = 0; i < px.length; i += 4) { const on = px[i + 3] > 118; px[i] = rgb[0]; px[i + 1] = rgb[1]; px[i + 2] = rgb[2]; px[i + 3] = on ? 255 : 0; }
  x.putImageData(d, 0, 0); g = { c, adv }; if (glyphCache.size > 6000) glyphCache.clear(); glyphCache.set(k, g); return g;
}
const rgbCache = {};
function hexRgb(h) { if (rgbCache[h]) return rgbCache[h]; let s = h.replace('#', ''); if (s.length === 3) s = s.split('').map(c => c + c).join(''); return rgbCache[h] = [0, 2, 4].map(i => parseInt(s.substr(i, 2), 16)); }
function textW(s, sc = 1) { s = String(s); if (isCJK(s)) { const R = cjkR(sc), gp = cjkGP(sc); let w = 0; for (const ch of s) w += glyph(ch, R, '#fff').adv; return w * gp; } return s.length ? (s.length * 4 - 1) * sc : 0; }
function text(s, x, y, color, sc = 1, align = 'left') {
  s = String(s);
  if (isCJK(s)) { const R = cjkR(sc), gp = cjkGP(sc), w = textW(s, sc);
    if (align === 'center') x -= w / 2; else if (align === 'right') x -= w;
    x = Math.round(x); const y0 = Math.round(y - 1.5 * sc) - gp;
    for (const ch of s) { const g = glyph(ch, R, color); ctx.drawImage(g.c, x - gp, y0, g.c.width * gp, g.c.height * gp); x += g.adv * gp; }
    return; }
  s = s.toUpperCase();
  if (align === 'center') x -= textW(s, sc) / 2; else if (align === 'right') x -= textW(s, sc);
  x = Math.round(x); y = Math.round(y); ctx.fillStyle = color;
  for (let i = 0; i < s.length; i++) { const g = FONT[s[i]] || FONT['?'];
    for (let p = 0; p < 15; p++) if (g.charCodeAt(p) === 49) ctx.fillRect(x + (p % 3) * sc, y + ((p / 3) | 0) * sc, sc, sc);
    x += 4 * sc; }
}
function textWG(s, sc = 1) { const R = cjkR(sc), gp = cjkGP(sc); let w = 0; for (const ch of String(s)) w += glyph(ch, R, '#fff').adv; return w * gp; }
function textG(s, x, y, color, sc = 1, align = 'left') { s = String(s); const R = cjkR(sc), gp = cjkGP(sc), w = textWG(s, sc);
  if (align === 'center') x -= w / 2; else if (align === 'right') x -= w; x = Math.round(x); const y0 = Math.round(y - 1.5 * sc) - gp;
  for (const ch of s) { const g = glyph(ch, R, color); ctx.drawImage(g.c, x - gp, y0, g.c.width * gp, g.c.height * gp); x += g.adv * gp; } }
function textS(s, x, y, color, sc = 1, align = 'left', shadow) { const o = isCJK(String(s)) ? cjkGP(sc) : sc; text(s, x + o, y + o, shadow || col(0), sc, align); text(s, x, y, color, sc, align); }
// width-aware wrap: word wrap for latin, per-char (with kinsoku) for CJK
const NOSTART = '，。、．！？：；）」』…ー〜%';
function wrapW(s, maxW, sc = 1) {
  s = String(s); const out = [];
  if (!isCJK(s)) { const maxC = Math.floor((maxW + sc) / (4 * sc)); let line = ''; for (const w of s.split(' ')) { if ((line + ' ' + w).trim().length > maxC) { out.push(line.trim()); line = w; } else line += ' ' + w; } if (line.trim()) out.push(line.trim()); return out; }
  let line = '';
  for (const ch of s) { if (textW(line + ch, sc) > maxW && line && !NOSTART.includes(ch)) { out.push(line); line = ch === ' ' ? '' : ch; } else line += ch; }
  if (line) out.push(line); return out;
}
const lineH = (sc = 1) => SET.lang !== 'en' ? sc * 9 + 1 : sc * 5 + 3;

// ---- sprites from char maps (auto 1px dark outline so characters read against any floor) ----
const spriteCache = new Map();
function charColor(ch, tint) { if (ch >= '0' && ch <= '5') return col(+ch); return { r: C.red, c: C.cyan, g: C.gold, v: C.violet, f: C.frost, o: C.orange, l: C.lime, t: tint || C.red,
  // survivor palette: skin, dark brown, brown trim, mauve, cream, blue eyes, wine red, ash gray
  k: '#e8cdb8', n: '#3d2b24', b: '#8a5a3a', m: '#7a6878', w: '#e9e0cc', u: '#4f8fe0', p: '#8f2234', y: '#b9b9c2' }[ch]; }
function sprite(name, rows, tint, noOutline) {
  const k = name + PALV + (tint || '') + (noOutline ? 'n' : ''); let s = spriteCache.get(k); if (s) return s;
  const o = noOutline ? 0 : 1, h0 = rows.length, w0 = rows[0].length, w = w0 + o * 2, h = h0 + o * 2;
  const solid = (i, j) => i >= 0 && j >= 0 && i < w0 && j < h0 && rows[j][i] !== '.';
  const mk = flash => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    if (o) { x.fillStyle = col(0); for (let j = -1; j <= h0; j++) for (let i = -1; i <= w0; i++) if (!solid(i, j) && (solid(i - 1, j) || solid(i + 1, j) || solid(i, j - 1) || solid(i, j + 1))) x.fillRect(i + 1, j + 1, 1, 1); }
    for (let j = 0; j < h0; j++) for (let i = 0; i < w0; i++) { const ch = rows[j][i]; if (ch === '.') continue; x.fillStyle = flash ? col(5) : charColor(ch, tint); x.fillRect(i + o, j + o, 1, 1); } return c; };
  s = { n: mk(false), f: mk(true), w, h }; spriteCache.set(k, s); return s;
}
function drawSprite(s, x, y, flip, flash, sx = 1, sy = 1) {
  const img = flash ? s.f : s.n;
  if (flip || sx !== 1 || sy !== 1) { ctx.save(); ctx.translate(Math.round(x), Math.round(y + s.h / 2)); ctx.scale((flip ? -1 : 1) * sx, sy); ctx.drawImage(img, -Math.round(s.w / 2), -s.h); ctx.restore(); }
  else ctx.drawImage(img, Math.round(x - s.w / 2), Math.round(y - s.h / 2));
}
// ground contact shadow: a squashed ellipse right under the feet
function shadow(x, y, w, a = .55) { w = Math.max(4, Math.round(w)); x = Math.round(x); y = Math.round(y); ctx.globalAlpha = a; rect(x - w / 2 + 1, y - 1, w - 2, 1, col(0)); rect(x - w / 2, y, w, 1, col(0)); rect(x - w / 2 + 1, y + 1, w - 2, 1, col(0)); ctx.globalAlpha = 1; }
// draw a character anchored at its feet (footY); lift raises the body while the shadow stays on the floor
function drawChar(s, x, footY, flip, flash, o = {}) {
  const lift = o.lift || 0, sx = o.sx || 1, sy = o.sy || 1;
  if (!o.noShadow) shadow(x, footY, s.w * (o.shw || .8) * (1 - Math.min(.5, lift / 30)), lift > 2 ? .35 : .55);
  const img = flash ? s.f : s.n;
  ctx.save(); ctx.translate(Math.round(x), Math.round(footY - lift) + 1); if (o.rot) ctx.rotate(o.rot); ctx.scale((flip ? -1 : 1) * sx, sy); ctx.drawImage(img, -Math.round(s.w / 2), -s.h); ctx.restore();
}

// ---- primitive shapes (pixel-exact: no anti-aliasing) ----
function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function disc(x, y, r, c) { if (!(r < 2000)) return; ctx.fillStyle = c; x = Math.round(x); y = Math.round(y); if (r < 1) { ctx.fillRect(x, y, 1, 1); return; } const R = Math.round(r);
  for (let dy = -R; dy <= R; dy++) { const w = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy))); ctx.fillRect(x - w, y + dy, w * 2 + 1, 1); } }
function pxCircle(cx, cy, r, c) { cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r); ctx.fillStyle = c; if (r < 1) { ctx.fillRect(cx, cy, 1, 1); return; }
  let x = r, y = 0, err = 1 - r;
  while (x >= y) { ctx.fillRect(cx + x, cy + y, 1, 1); ctx.fillRect(cx + y, cy + x, 1, 1); ctx.fillRect(cx - y, cy + x, 1, 1); ctx.fillRect(cx - x, cy + y, 1, 1);
    ctx.fillRect(cx - x, cy - y, 1, 1); ctx.fillRect(cx - y, cy - x, 1, 1); ctx.fillRect(cx + y, cy - x, 1, 1); ctx.fillRect(cx + x, cy - y, 1, 1);
    y++; if (err < 0) err += 2 * y + 1; else { x--; err += 2 * (y - x) + 1; } } }
function ringC(x, y, r, c, w = 1) { if (r > 500) return; for (let i = 0; i < Math.max(1, Math.round(w)); i++) if (r - i >= 0) pxCircle(x, y, r - i, c); }
function pxLine(x0, y0, x1, y1, c, w = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); ctx.fillStyle = c; const o = Math.floor(w / 2);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy, n = 0;
  while (n++ < 1500) { ctx.fillRect(x0 - o, y0 - o, w, w); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
}
function line(x1, y1, x2, y2, c, w = 1) { if (w <= 3) { pxLine(x1, y1, x2, y2, c, Math.max(1, Math.round(w))); return; } ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
// rotated square outline drawn with pixel lines
function pxSquare(cx, cy, s, rot, c) { const p = [0, 1, 2, 3].map(i => [cx + Math.cos(rot + i * Math.PI / 2 + Math.PI / 4) * s * .7071, cy + Math.sin(rot + i * Math.PI / 2 + Math.PI / 4) * s * .7071]); for (let i = 0; i < 4; i++) pxLine(p[i][0], p[i][1], p[(i + 1) % 4][0], p[(i + 1) % 4][1], c); }
function star(x, y, r, c) { rect(x - r, y - .5, r * 2 + 1, 1, c); rect(x - .5, y - r, 1, r * 2 + 1, c); if (r > 2) { rect(x - 1, y - 1, 3, 3, c); } }

// ---- particles ----
const P = [];
function part(o) { if (QS.part < 1 && Math.random() > QS.part) return; if (P.length > Math.max(200, 1600 * QS.part)) P.shift(); P.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, life: .5, max: .5, c: '#fff', s: 1, drag: 4, grav: 0, t: 'px' }, o)); }
function burst(x, y, n, c, spd = 80, life = .45, s = 1, o = {}) {
  for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), v = rand(spd * .3, spd); const l = rand(life * .5, life);
    part(Object.assign({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: l, max: l, c, s: Math.random() < .3 ? s + 1 : s }, o)); }
}
function cone(x, y, a, spread, n, c, spd = 120, life = .3, s = 1, t = 'px') {
  for (let i = 0; i < n; i++) { const aa = a + rand(-spread, spread), v = rand(spd * .4, spd), l = rand(life * .5, life);
    part({ x, y, vx: Math.cos(aa) * v, vy: Math.sin(aa) * v, life: l, max: l, c, s, t }); }
}
function ringFx(x, y, r, c, life = .3, w = 2) { part({ x, y, t: 'ring', r0: r * .2, r, c, life, max: life, w }); }
function streak(x, y, a, len, c, life = .15) { part({ x, y, t: 'streak', a, len, c, life, max: life }); }
function starFx(x, y, r, c, life = .1) { part({ x, y, t: 'star', r, c, life, max: life }); }
function casing(x, y, a) { const pa = a + (Math.random() < .5 ? 1.57 : -1.57) * rand(.8, 1.2) + Math.PI * .15; part({ x, y, vx: Math.cos(pa) * rand(40, 70), vy: Math.sin(pa) * rand(40, 70) - 40, life: .7, max: .7, c: col(4), s: 1, drag: 3, grav: 260, t: 'casing', floor: y + rand(3, 7) }); }
function updateParticles(dt) {
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.life -= dt; if (p.life <= 0) { P.splice(i, 1); continue; }
    if (p.t === 'px' || p.t === 'casing' || p.t === 'spark') { p.vx *= 1 / (1 + p.drag * dt); p.vy *= 1 / (1 + p.drag * dt); p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.t === 'casing' && p.y > p.floor && p.vy > 0) { p.y = p.floor; p.vy *= -.35; p.vx *= .5; } }
    else if (p.t === 'conv') { if (p.tf) { const q = p.tf(); p.tx = q[0]; p.ty = q[1]; } const k = p.life / p.max; p.x = p.tx + Math.cos(p.a + (1 - k) * 4) * p.r * k; p.y = p.ty + Math.sin(p.a + (1 - k) * 4) * p.r * k; } }
}
function drawParticles(cx, cy) {
  for (const p of P) { const k = p.life / p.max;
    if (p.t === 'px' || p.t === 'conv') { const s = k < .4 && p.s > 1 ? p.s - 1 : p.s; rect(p.x - cx - s / 2, p.y - cy - s / 2, s, s, p.c); }
    else if (p.t === 'casing') rect(p.x - cx, p.y - cy, 2, 1, p.c);
    else if (p.t === 'spark') { line(p.x - cx, p.y - cy, p.x - cx - p.vx * .03, p.y - cy - p.vy * .03, p.c, 1); }
    else if (p.t === 'ring') { ctx.globalAlpha = Math.min(1, k * 1.6); ringC(p.x - cx, p.y - cy, lerp(p.r, p.r0, k * k), p.c, Math.max(1, Math.round(p.w * k))); ctx.globalAlpha = 1; }
    else if (p.t === 'streak') { const l = p.len * k; line(p.x - cx, p.y - cy, p.x - cx + Math.cos(p.a) * l, p.y - cy + Math.sin(p.a) * l, p.c, 1); }
    else if (p.t === 'star') star(Math.round(p.x - cx), Math.round(p.y - cy), Math.max(1, Math.round(p.r * k)), p.c);
    else if (p.t === 'react') { const rr = p.r * (1.3 - k * .8), x = p.x - cx, y = p.y - cy, sp = (1 - k) * 9;
      for (let i = 0; i < 10; i++) { const a1 = sp + i * .628, a2 = -sp + i * .628 + .3; rect(x + Math.cos(a1) * rr, y + Math.sin(a1) * rr, 2, 2, p.c); rect(x + Math.cos(a2) * rr * .7, y + Math.sin(a2) * rr * .7, 1, 1, p.c2); } }
  }
}

// ---- floating text (drawn in the crisp UI pass) ----
const FT = [];
function floatText(x, y, s, c, sc = 1, life = .7) { if (FT.length > 80) FT.shift(); FT.push({ x: x + rand(-4, 4), y, s: String(s), c, sc, life, max: life, vy: -55 }); }
function updateFT(dt) { for (let i = FT.length - 1; i >= 0; i--) { const f = FT[i]; f.life -= dt; f.vy *= 1 / (1 + 5 * dt); f.y += f.vy * dt; if (f.life <= 0) FT.splice(i, 1); } }
function drawFT(cx, cy) { for (const f of FT) { const k = f.life / f.max; const pop = k > .85 ? 1 + (k - .85) * 4 : 1; const sc = Math.max(1, Math.round(f.sc * pop));
  if (k < .25 && ((f.life * 30) | 0) % 2) continue; textS(f.s, f.x - cx, f.y - cy, f.c === '#e8e1d3' || f.c === col(5) ? '#e6dfd1' : f.c, sc, 'center'); } }

// ---- screen fx with a load governor: rapid repeated events fade instead of stacking ----
const FX = { trauma: 0, sx: 0, sy: 0, hitstop: 0, hsCd: 0, flashC: null, flashA: 0, slow: 1, slowT: 0, chroma: 0, kickX: 0, kickY: 0, load: 0 };
const fxGain = () => 1 / (1 + FX.load * .9);
function shake(a, force) { const g = force ? 1 : fxGain(); FX.load += force ? 0 : a * 1.5; FX.trauma = Math.min(force ? 1 : .42, FX.trauma + a * g); }
function hitstop(s, force) { if (!force) { if (FX.hsCd > 0) return; FX.hsCd = .14; s = Math.min(s, .045) * fxGain(); } FX.hitstop = Math.max(FX.hitstop, s); }
const GRIM = {}; function grimC(c) { if (GRIM[c]) return GRIM[c]; if (typeof c !== 'string' || c[0] !== '#') return c; const a = hexRgb(c), b = [92, 28, 22], m = a.map((v, i) => Math.round(v * .5 + b[i] * .5)); return GRIM[c] = '#' + m.map(v => ('0' + v.toString(16)).slice(-2)).join(''); }
function flash(c, a = .6, force) { a *= SET.flash * (force ? 1 : fxGain() * .6); if (!force) a = Math.min(a, .22); if (a < .03) return; FX.flashC = grimC(c); FX.flashA = Math.max(FX.flashA, a); }
function slowmo(scale, t) { FX.slow = scale; FX.slowT = t; }
function chroma(a, force) { a *= force ? 1 : fxGain(); FX.chroma = Math.max(FX.chroma, Math.min(force ? 1.5 : .6, a)); }
function kick(a, f) { f *= fxGain() * .6 + .4; FX.kickX -= Math.cos(a) * f; FX.kickY -= Math.sin(a) * f; }
function updateFX(rdt) {
  FX.load = Math.max(0, FX.load * Math.pow(.25, rdt) - rdt * .2); FX.hsCd -= rdt;
  FX.trauma = Math.max(0, FX.trauma - rdt * 1.8);
  const s = Math.pow(FX.trauma, 1.5) * 10 * SET.shake, tt = performance.now() / 1000;
  // smooth noise instead of white noise: less nauseating at high frequency
  FX.sx = (Math.sin(tt * 47) + Math.sin(tt * 29.3) * .6) * s * .65; FX.sy = (Math.sin(tt * 41.7 + 1) + Math.sin(tt * 23.1) * .6) * s * .65;
  FX.flashA = Math.max(0, FX.flashA - rdt * 3.5);
  FX.chroma = Math.max(0, FX.chroma - rdt * 6);
  FX.kickX *= Math.pow(.0005, rdt); FX.kickY *= Math.pow(.0005, rdt);
  if (FX.slowT > 0) { FX.slowT -= rdt; if (FX.slowT <= 0) FX.slow = 1; }
}

// ---- dithered layers (Bayer) ----
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
let vignette = null;
function getVignette() {
  if (vignette) return vignette;
  vignette = document.createElement('canvas'); vignette.width = W; vignette.height = H;
  const x = vignette.getContext('2d'); x.fillStyle = col(0);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const dx = (i - W / 2) / (W / 2), dy = (j - H / 2) / (H / 2); const d = Math.sqrt(dx * dx * .8 + dy * dy * 1.1);
    const v = clamp((d - .72) * 2.2, 0, 1) * 16; if (v > BAYER[(j & 3) * 4 + (i & 3)]) x.fillRect(i, j, 1, 1);
  }
  return vignette;
}
function ditherRect(x0, y0, w, h, c, level) { ctx.fillStyle = c; x0 = Math.round(x0); y0 = Math.round(y0); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (level * 16 > BAYER[((y0 + j) & 3) * 4 + ((x0 + i) & 3)]) ctx.fillRect(x0 + i, y0 + j, 1, 1); }
const ditherCache = {};
function ditherLayer(level, c) { level = Math.round(level * 16) / 16; const k = level + c; if (ditherCache[k]) return ditherCache[k];
  const cnv = document.createElement('canvas'); cnv.width = W; cnv.height = H; const x = cnv.getContext('2d'); x.fillStyle = c;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (level * 16 > BAYER[(j & 3) * 4 + (i & 3)]) x.fillRect(i, j, 1, 1);
  return ditherCache[k] = cnv; }
