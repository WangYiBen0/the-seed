// ===== TheSeed main menu: a side-scrolling survivor camp in a dead city =====
// You walk the camp (A/D or arrows; on phones tap where to go) and use what is there (E / Enter, or click / tap it and you walk over):
//   the archive cabinet = codex, the notice board = leaderboard, the radio station = world channel (its newest messages play as
//   broadcasts), the girls you have met = 少女们, the hooded trader = black market, the supply container = limited-time event (its
//   progress fills the gauge), the armoured truck at the gate = start / continue a sortie. The gear (or Esc) opens the settings.
// Everything static (sky, three layers of ruins, the ground, every prop) is painted once, pixel by pixel, into cached images with
// shaded materials (rust, wood grain, corrugation, grime); only fire, light, smoke, ash and people move each frame. The girls are
// their own portraits scaled down to pixel figures, lit by the fire.
// Like the game itself the world has no colour: every painted pixel turns gray unless it is one of the CACC colours (fire, lamps,
// lights, a few meaningful marks). Colour is what is alive: the fire and its light, the lamps, the girls (half faded).
'use strict';
const CAMP_W = 1500, CAMP_SPD = 66, CAMP_FIRE = 660;
const CPOS = { codex: 110, board: 228, radio: 350, line: 438, tent: 478, dog: 513, tank: 868, gen: 898, market: 995, barrel: 1085, event: 1185, truck: 1318, wall: 1372 };
const CAMP = { x: 630, face: 1, walkT: 0, moving: false, go: null, near: null, hov: null, t: 0, pop: null, cam: 0, art: null, ash: [], sparks: [], smoke: [], boom: 0, nextBoom: 9, boomX: 0, vig: null };
const campGround = () => H - 42; // the ground line sits above the taskbar (24px) with room to spare
// the main menu is a normal list again; the camp is its living backdrop: the camera drifts along it, the player is not shown
const CAMP_BACKDROP = true;
function campBackdropTick(rdt) { CAMP.t += rdt; for (const id of SURV_IDS) if (girlMet(id)) loadPortrait(id);
  if (CAMP.dep) { updateCampDeparture(rdt); campAmbient(rdt, campGround()); return; }
  const it = typeof TBAR !== 'undefined' && TBAR.area >= 0 ? tbItems()[TBAR.area] : null, base = CAMP_FIRE - W * .6, drift = Math.sin(CAMP.t * Math.PI * 2 / 70) * 34 + (Input.mx - W / 2) * .03;
  const want = it ? areaCam(it) : clamp(Math.round(base + drift), 0, Math.max(0, CAMP_W - W)); camSpring(want, rdt, it ? 5.2 : 2.4);
  if (Math.abs(CAMP.cam - want) < .3 && Math.abs(CAMP.cv) < 1) { CAMP.cam = want; CAMP.cv = 0; } if (typeof tbFocusTick === 'function') tbFocusTick(rdt); campAmbient(rdt, campGround()); }
// the camera moves on a critically damped spring: it eases out of rest and settles without overshoot, short hops and long pans alike,
// and a new target picked mid-move keeps the speed it already has (no jolt)
function springTo(o, k, vk, want, w, rdt) { let n = Math.max(1, Math.ceil(rdt / .008)); const h = rdt / n; o[vk] = o[vk] || 0; for (; n > 0; n--) { o[vk] += (w * w * (want - o[k]) - 2 * w * o[vk]) * h; o[k] += o[vk] * h; } }
function camSpring(want, rdt, w) { springTo(CAMP, 'cam', 'cv', want, w, rdt); }

// ---------------- painting tools (an RGBA buffer with shading helpers) ----------------
const CRGB = {};
function cRGB(c) { let v = CRGB[c]; if (!v) { const n = parseInt(c.slice(1, 7), 16); v = CRGB[c] = [n >> 16 & 255, n >> 8 & 255, n & 255]; } return v; }
function chash(x, y, s) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((s | 0) + 1, 1442695041); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function cnoise(x, y, sc, s) { const fx = x / sc, fy = y / sc, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0, u = tx * tx * (3 - 2 * tx), v = ty * ty * (3 - 2 * ty);
  const a = chash(x0, y0, s), b = chash(x0 + 1, y0, s), c = chash(x0, y0 + 1, s), d = chash(x0 + 1, y0 + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
const cfbm = (x, y, sc, s) => cnoise(x, y, sc, s) * .6 + cnoise(x, y, sc / 2, s + 7) * .28 + cnoise(x, y, sc / 4, s + 13) * .12;
const cdith = (v, x, y, n) => { const q = clamp(v, 0, 1) * (n - 1), lo = Math.floor(q); return Math.min(n - 1, lo + ((q - lo) * 16 > BAYER[(y & 3) * 4 + (x & 3)] ? 1 : 0)); };
const cramp = (r, v, x, y) => r[cdith(v, x, y, r.length)];
function campRng(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
const CACC = new Set(['#ffd88a', '#d8c890', '#a0481c', '#e07a2a', '#ff7a2a', '#e8e0b0', '#ffd070', '#ffb040', '#d0902e', '#c83a2a', '#d8b03a', '#3a7ac8', '#4ab05a', '#8a2020', '#8a1c18', '#6a1410', '#9a2a20', '#8a2a20']);
const campGray = (r, g, b) => { const l = Math.min(255, (r * .3 + g * .59 + b * .11) * 1.12); return [l * .98, l * .98, l * 1.03]; };
class CPix {
  constructor(w, h) { this.w = Math.max(1, w | 0); this.h = Math.max(1, h | 0); this.d = new Uint8ClampedArray(this.w * this.h * 4); this.m = new Uint8Array(this.w * this.h); }
  set(x, y, c, a) { x = Math.round(x); y = Math.round(y); if (!c || x < 0 || y < 0 || x >= this.w || y >= this.h) return; const i = (y * this.w + x) * 4, v = cRGB(c), A = a === undefined ? 255 : a;
    this.m[i >> 2] = CACC.has(c) ? 1 : 0;
    if (A >= 255) { this.d[i] = v[0]; this.d[i + 1] = v[1]; this.d[i + 2] = v[2]; this.d[i + 3] = 255; return; }
    const k = A / 255, ob = this.d[i + 3] / 255, na = k + ob * (1 - k); if (na <= 0) return;
    for (let q = 0; q < 3; q++) this.d[i + q] = (v[q] * k + this.d[i + q] * ob * (1 - k)) / na; this.d[i + 3] = na * 255; }
  a(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.d[(y * this.w + x) * 4 + 3]; }
  clear(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.d[(y * this.w + x) * 4 + 3] = 0; }
  rect(x, y, w, h, c, a) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c, a); }
  fill(x, y, w, h, f) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const c = f(i, j, x + i, y + j); if (c) this.set(x + i, y + j, c); } }
  line(x0, y0, x1, y1, c, a) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
    for (let n = 0; n < 4000; n++) { this.set(x0, y0, c, a); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } }
  disc(cx, cy, r, c, a) { for (let j = Math.floor(-r); j <= Math.ceil(r); j++) for (let i = Math.floor(-r); i <= Math.ceil(r); i++) if (i * i + j * j <= r * r + r * .6) this.set(cx + i, cy + j, c, a); }
  thick(x0, y0, x1, y1, r, c) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)); for (let k = 0; k <= n; k++) this.disc(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, r, c); }
  poly(pts, c, f) { let y0 = 1e9, y1 = -1e9; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) { const xs = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= y + .5) !== (b[1] <= y + .5)) xs.push(a[0] + (y + .5 - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
      xs.sort((p, q) => p - q); for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, f ? f(x, y) : c); } }
  outline(c) { const m = []; for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.a(x, y) < 100 && (this.a(x - 1, y) > 160 || this.a(x + 1, y) > 160 || this.a(x, y - 1) > 160 || this.a(x, y + 1) > 160)) m.push(x, y); for (let i = 0; i < m.length; i += 2) this.set(m[i], m[i + 1], c); }
  canvas(keep) { if (!keep) for (let k = 0; k < this.m.length; k++) if (!this.m[k] && this.d[k * 4 + 3]) { const i = k * 4, q = campGray(this.d[i], this.d[i + 1], this.d[i + 2]); this.d[i] = q[0]; this.d[i + 1] = q[1]; this.d[i + 2] = q[2]; }
    const cv = document.createElement('canvas'); cv.width = this.w; cv.height = this.h; cv.getContext('2d').putImageData(new ImageData(this.d, this.w, this.h), 0, 0); return cv; }
}
const RAMP = {
  steel: ['#0e1013', '#161a1e', '#20252a', '#2c3238', '#3a4148', '#4d555d', '#646d76', '#808a93'],
  olive: ['#0f110d', '#171a13', '#20241a', '#2a3022', '#353d2b', '#424c36', '#535f44', '#687656'],
  rust: ['#1a0d08', '#2a140b', '#3d1d0f', '#532814', '#6b351a', '#844521', '#9d5a2c'],
  wood: ['#120c08', '#1c130d', '#281b12', '#352418', '#442f1f', '#553b27', '#6b4b31', '#82603e'],
  conc: ['#0f0d0f', '#171416', '#1f1b1d', '#282325', '#322c2e', '#3e3739', '#4b4345', '#5a5153'],
  tarp: ['#0c110f', '#121a16', '#18231d', '#202e26', '#293a30', '#33473b', '#3f5747'],
  paper: ['#3a3630', '#504b43', '#686157', '#837a6c', '#9d9382', '#b6ab97', '#cbbfa8'],
  cork: ['#1e130c', '#2b1c11', '#3a2616', '#4a321d', '#5a3e25', '#6b4a2d'],
  red: ['#1a0807', '#2c0d0b', '#42130f', '#5a1a14', '#73241a', '#8e3022'],
  cont: ['#1a0b07', '#2a120a', '#3e1a0d', '#542312', '#6a2d16', '#80391b', '#96461f'],
  rub: ['#08080a', '#101012', '#18181b', '#222226', '#2c2c31'],
  sand: ['#1c170f', '#2a2216', '#3a2f1f', '#4c3e29', '#5f4e34', '#73603f'],
  brick: ['#1c0e0c', '#2c1611', '#3e1f17', '#52291d', '#683626'],
};
// a lit, worn surface: light from the fire's side (lx -1 / 1) and from above, grain, grime streaks running down, rust patches
function camSurf(p, x, y, w, h, ramp, o = {}) { const lx = o.lx || 0, s = o.seed || 1, rust = o.rust || 0, grime = o.grime === undefined ? .5 : o.grime, base = o.base === undefined ? .55 : o.base;
  p.fill(x, y, w, h, (i, j, X, Y) => { if (o.mask && !o.mask(i, j)) return null;
    let v = base + lx * (i / Math.max(1, w - 1) - .5) * .34 - (j / Math.max(1, h - 1)) * .2 + (chash(X, Y, s) - .5) * .12 + (cfbm(X, Y, 6, s) - .5) * .22;
    if (j === 0) v += .24; if (i === 0) v += lx < 0 ? .16 : -.08; if (i === w - 1) v += lx > 0 ? .16 : -.08; if (j === h - 1) v -= .16;
    if (grime && cnoise(X, 0, 2.5, s + 3) > .6) v -= grime * (j / h) * .4;
    if (rust && cfbm(X, Y, 5, s + 9) > 1 - rust * .5) return cramp(RAMP.rust, v * .9 + .05, X, Y);
    return cramp(ramp, v, X, Y); }); }
function camPlanks(p, x, y, w, h, ramp, o = {}) { const pw = o.pw || 5, vert = !!o.vert, s = o.seed || 2, lx = o.lx || 0;
  p.fill(x, y, w, h, (i, j, X, Y) => { if (o.mask && !o.mask(i, j)) return null; const k = vert ? i : j, n = Math.floor(k / pw), e = k % pw, al = vert ? j : i;
    if (e === pw - 1) return ramp[0];
    let v = .5 + (chash(n, 0, s) - .5) * .32 + Math.sin(al * .33 + n * 2.1 + Math.sin(al * .07 + n) * 2.4) * .08 + (chash(X, Y, s) - .5) * .12 + lx * (i / w - .5) * .26 - (j / h) * .12;
    if (e === 0) v += .2; if (chash(n, Math.floor(al / 11), s + 1) > .9 && al % 11 < 2) v -= .32;
    return cramp(ramp, v, X, Y); });
  if (o.nails) for (let n = 0; n * pw < (vert ? w : h); n++) for (const tt of o.nails) { const px = vert ? x + n * pw + 1 : x + Math.round(tt * (w - 1)), py = vert ? y + Math.round(tt * (h - 1)) : y + n * pw + 1; p.set(px, py, '#7a7a80'); p.set(px + 1, py + 1, ramp[1]); } }
function camCorr(p, x, y, w, h, o = {}) { const s = o.seed || 3, lx = o.lx || 0, ramp = o.ramp || RAMP.steel, rust = o.rust === undefined ? .35 : o.rust;
  p.fill(x, y, w, h, (i, j, X, Y) => { if (o.mask && !o.mask(i, j)) return null; const r4 = i % 4, rid = r4 === 1 ? .2 : r4 === 2 ? .08 : r4 === 3 ? -.14 : -.04;
    let v = .46 + rid + lx * (i / w - .5) * .22 - j / h * .16 + (chash(X, Y, s) - .5) * .1; if (j === 0) v += .2;
    const rr = cfbm(X, Y * 1.6, 7, s + 5); if (rr > 1 - rust * .5) return cramp(RAMP.rust, v + (rr - .6) * .6, X, Y);
    if (cnoise(X, 0, 3, s + 1) > .66) v -= (j / h) * .3; return cramp(ramp, v, X, Y); }); }
const lxOf = x => x < CAMP_FIRE ? 1 : -1; // props are lit from the fire's side
function mkSprite(w, h, ax, ay, draw) { const p = new CPix(w, h); draw(p); p.outline('#060507'); const cv = p.canvas();
  // a pale outline copy, shown while it is in reach
  const q = new CPix(w + 2, h + 2), d = p.d; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 100) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h || d[(ny * w + nx) * 4 + 3] < 100) q.set(nx + 1, ny + 1, '#f0e6c8'); }
  return { cv, ol: q.canvas(), w, h, ax, ay }; }

// ---------------- the sky and the ruins (painted once per screen size) ----------------
function campSky(w, h, g) {
  const p = new CPix(w, h), sky = ['#070609', '#0b090c', '#100c0f', '#151013', '#1b1315', '#221716', '#2b1b17', '#352018', '#412519', '#4e2b1a', '#5c311b'];
  p.fill(0, 0, w, h, (i, j) => { const v = Math.pow(clamp(j / (g - 4), 0, 1), 1.7), cl = cfbm(i * .45, j * 2.4, 20, 41), cl2 = cfbm(i * .3 + 40, j * 3, 26, 52);
    return cramp(sky, v - clamp((cl - .44) * 1.2, 0, .38) * (1 - v * .3) + clamp((cl2 - .6) * .5, 0, .08), i, j); });
  const sx = Math.round(w * .68), sy = g - 84; // a dead sun, choked by smoke
  for (let j = -20; j <= 20; j++) for (let i = -20; i <= 20; i++) { const d = Math.hypot(i, j), veil = cfbm(sx + i, (sy + j) * 2.4, 20, 41);
    if (d < 10) { if (veil < .6 || d < 5) p.set(sx + i, sy + j, d < 7 ? '#94603c' : '#7a4c30'); } else if (d < 20 && cdith((20 - d) / 10 * .55 * (1.2 - veil), sx + i, sy + j, 2)) p.set(sx + i, sy + j, '#4a2a1e'); }
  for (let i = 0; i < w; i++) for (let j = g - 40; j < g; j++) { const k = (j - (g - 40)) / 40, f = cnoise(i, 0, 36, 9); if (cdith(k * k * (.35 + f * .65), i, j, 2)) p.set(i, j, k > .75 && f > .62 ? '#8c4422' : k > .5 ? '#6a3520' : '#4e2a1c'); } // the horizon burns
  return p.canvas();
}
// far: shattered towers in the haze; returns the canvas and where fires burn (smoke rises from them)
function campFar(fw, g) {
  const p = new CPix(fw, g), r = campRng(11), fires = [], B = ['#1d1517', '#221a1b', '#281e1f', '#2e2322', '#352825'];
  const tower = (x, bw, bh, lean) => { const top = g - 10 - bh, cut = [], kind = r(); for (let i = 0; i < bw; i++) cut[i] = kind < .4 ? Math.round(Math.max(0, (i / bw) * bh * .35 + (r() - .5) * 4)) : kind < .7 ? Math.round(Math.abs(i - bw * .5) < bw * .28 ? bh * .22 + r() * 5 : r() * 3) : Math.round(r() * 3);
    const holes = []; for (let k = 0; k < 1 + Math.floor(r() * 3); k++) holes.push([Math.floor(r() * bw), top + bh * (.2 + r() * .6), 3 + r() * 7]);
    for (let i = 0; i < bw; i++) { for (let y = top + cut[i]; y < g; y++) { const xx = x + i + Math.round(lean * (g - y) / 60); let hole = false; for (const [hx, hy, hr] of holes) if (Math.hypot(i - hx, (y - hy) * 1.3) < hr + (chash(i, y, 5) - .5) * 2) hole = true;
        if (hole) { if ((y - top) % 6 === 0) p.set(xx, y, '#1a1214'); continue; }
        const v = .45 + (cfbm(xx, y, 8, 3) - .5) * .3 + (i === bw - 1 ? .35 : i === 0 ? -.1 : 0) + (y - top) / (g - top) * .18, win = (i % 4 === 1 || i % 4 === 2) && (y - top) % 6 >= 2 && (y - top) % 6 <= 3 && i > 0 && i < bw - 1;
        if (win) { if (chash(xx, y, 19) > .985) { p.set(xx, y, chash(xx, y, 20) > .5 ? '#a0481c' : '#e07a2a'); if (chash(xx, y, 21) > .6) fires.push([xx, y]); } else p.set(xx, y, '#140e10'); } else p.set(xx, y, cramp(B, v, xx, y)); }
      if (r() < .25) for (let k = 1; k < 3 + r() * 5; k++) p.set(x + i + Math.round(lean * (g - top) / 60), top + cut[i] - k, '#2e2220'); } }; // rebar out of the break
  let x = -6; while (x < fw) { const bw = 12 + Math.floor(r() * 30), bh = 36 + Math.floor(r() * (r() < .2 ? 140 : 90)); tower(x, bw, bh, r() < .12 ? (r() - .5) * 14 : 0); x += bw - 2 + Math.floor(r() * 8); }
  { const cx = Math.round(fw * .3), top = g - 150; for (let y = top; y < g; y++) { p.set(cx, y, '#2a1f1f'); p.set(cx + 4, y, '#2a1f1f'); if ((y - top) % 5 === 0) p.line(cx, y, cx + 4, y + 5, '#241a1b'); } // a crane, still standing
    p.line(cx - 34, top, cx + 50, top, '#2a1f1f'); p.line(cx - 34, top + 3, cx + 50, top + 3, '#251b1c'); for (let i = -34; i < 50; i += 5) p.line(cx + i, top, cx + i + 5, top + 3, '#231a1b'); p.line(cx + 2, top - 14, cx + 50, top, '#2a1f1f'); p.line(cx + 2, top - 14, cx - 34, top, '#2a1f1f');
    p.line(cx + 38, top + 3, cx + 38, top + 40, '#201718'); p.rect(cx + 35, top + 40, 7, 4, '#2a1f1f'); }
  for (let y = g - 30; y < g; y++) for (let i = 0; i < fw; i++) if (p.a(i, y) && cdith((y - (g - 30)) / 30 * .55, i, y, 2)) p.set(i, y, '#3a2219'); // haze
  return { cv: p.canvas(), fires };
}
// mid-far: broken apartment blocks with their rooms open, a fallen overpass, a torn billboard, leaning poles and wires
function campMidFar(mw, g) {
  const p = new CPix(mw, g), r = campRng(23), B = ['#110c0e', '#151012', '#1a1416', '#201819', '#271d1d'], E = '#3c2620';
  const block = (x, bw, bh) => { const top = g - bh, fx = Math.floor(bw * (.3 + r() * .4)), fall = Math.floor(bh * (.3 + r() * .4)), jag = [];
    for (let i = 0; i < bw; i++) jag[i] = Math.round((r() - .5) * 3 + (i > fx ? fall * Math.min(1, (i - fx) / 8) : 0));
    for (let i = 0; i < bw; i++) for (let y = top + jag[i]; y < g; y++) { const fl = (y - top) % 9, xx = x + i;
      const open = i > fx + 2 && i < bw - 2 && y > top + jag[i] + 2 && fl > 0 && y < g - 10; // the front wall is gone: rooms
      if (open) { p.set(xx, y, fl === 1 ? '#1e1617' : cramp(['#090708', '#0d0a0b', '#120e0f'], .3 + (cfbm(xx, y, 5, 8) - .5) * .4, xx, y)); continue; }
      if (fl === 0) { p.set(xx, y, i === bw - 1 ? E : '#2a1f1f'); continue; }
      if (i % 7 >= 2 && i % 7 <= 4 && fl >= 3 && fl <= 6 && i < fx) { p.set(xx, y, fl === 6 ? '#2a2020' : '#0a0809'); continue; }
      p.set(xx, y, cramp(B, .42 + (cfbm(xx, y, 7, 2) - .5) * .35 + (i === bw - 1 || i === fx + 2 ? .4 : 0), xx, y)); }
    for (let k = 0; k < 3; k++) { const fy = top + 9 * (1 + Math.floor(r() * Math.max(1, bh / 9 - 2))), fx2 = x + fx + 4 + Math.floor(r() * Math.max(1, bw - fx - 10)); if (fy > g - 12) continue; // furniture hanging out
      if (r() < .5) { p.rect(fx2, fy - 3, 7, 2, '#1c1415'); p.rect(fx2, fy - 1, 1, 1, '#1c1415'); p.rect(fx2 + 6, fy - 1, 1, 1, '#1c1415'); } else { p.line(fx2, fy, fx2 + 3, fy + 6, '#1a1314'); p.rect(fx2 + 2, fy + 6, 4, 3, '#1c1415'); } }
    for (let k = 0; k < 2; k++) { const cx = x + fx + 2 + Math.floor(r() * Math.max(1, bw - fx - 2)), cy = top + jag[Math.min(bw - 1, cx - x)], L2 = 6 + r() * 16; for (let q = 0; q < L2; q++) p.set(cx + Math.round(Math.sin(q * .3) * 1.5), cy + q, '#0c0909'); } };
  let x = -10; while (x < mw) { const kind = r();
    if (kind < .55) { const bw = 34 + Math.floor(r() * 50), bh = 50 + Math.floor(r() * 60); block(x, bw, bh); x += bw + Math.floor(r() * 30); }
    else if (kind < .7) { // a fallen overpass with a car hanging off it
      const L2 = 120, dy = g - 58; for (let i = 0; i < L2; i++) { const brk = i > 70, yy = brk ? dy + Math.round((i - 70) * .55) : dy; for (let k = 0; k < 6; k++) p.set(x + i, yy + k, k === 0 ? '#3a2622' : cramp(B, .5 + (chash(i, k, 4) - .5) * .3, x + i, yy + k)); if (i % 3 === 0 && !brk) p.set(x + i, yy - 2, '#221a1a'); }
      p.line(x, dy - 3, x + 70, dy - 3, '#241a1a'); for (const px of [12, 52]) p.rect(x + px, dy + 6, 6, g - dy - 6, '#171113'); p.rect(x + 66, dy + 2, 10, 5, '#1d1517'); p.rect(x + 68, dy + 7, 3, 2, '#0e0b0c'); p.rect(x + 73, dy + 7, 3, 2, '#0e0b0c');
      x += L2 + 20; }
    else if (kind < .8) { // a torn billboard
      const bx = x, by = g - 64; p.rect(bx + 8, by + 22, 2, g - by - 22, '#1a1314'); p.rect(bx + 34, by + 22, 2, g - by - 22, '#1a1314');
      p.fill(bx, by, 44, 22, (i, j, X, Y) => { if (chash(Math.floor(i / 6), 0, 31) > .78 && j > 4) return null; const c = i < 20 ? (j < 12 ? '#3a1d1c' : '#22262a') : (j % 7 < 2 ? '#3a3226' : '#2a2422'); return chash(X, Y, 3) > .9 ? '#1a1314' : c; });
      x += 60; }
    else x += 20 + Math.floor(r() * 30); }
  let prev = null; for (let px = 30; px < mw; px += 70 + Math.floor(r() * 40)) { const lean = (r() - .5) * 8, top = g - 54 - Math.floor(r() * 10); p.line(px, g, px + lean, top, '#140f11'); p.line(px + lean - 5, top + 3, px + lean + 5, top + 3, '#140f11'); // poles and wires
    if (prev) for (let w2 = 0; w2 < 2; w2++) { const ax = prev[0] + (w2 ? 4 : -4), ay = prev[1] + 3, bx = px + lean + (w2 ? 4 : -4), by = top + 3; for (let i = 0; i <= bx - ax; i++) { const k = i / Math.max(1, bx - ax); p.set(ax + i, ay + (by - ay) * k + Math.sin(k * Math.PI) * (8 + w2 * 3), '#0d0a0b'); } }
    prev = [px + lean, top]; }
  for (let i = 0; i < mw; i++) { const hh = Math.round(4 + cfbm(i, 0, 14, 77) * 14); for (let y = g - hh; y < g; y++) p.set(i, y, cramp(B, .2 + (y - (g - hh)) / hh * .2 + (chash(i, y, 7) - .5) * .2, i, y)); } // rubble mounds
  return p.canvas();
}
// mid: the camp's own wall: wrecks stacked as a barricade, corrugated sheets, sandbags, wire, warning signs, a dead tree
function campMid(mw, g) {
  const p = new CPix(mw, g), r = campRng(37);
  const car = (x, y, w2, flip) => { camSurf(p, x, y + 4, w2, 7, RAMP.rust, { seed: x, rust: .6, base: .4, grime: .4 }); camSurf(p, x + (flip ? 4 : Math.round(w2 * .25)), y, Math.round(w2 * .55), 5, RAMP.steel, { seed: x + 1, rust: .5, base: .35 });
    p.rect(x + (flip ? 6 : Math.round(w2 * .25) + 2), y + 1, Math.round(w2 * .45), 3, '#08090b'); p.rect(x + Math.round(w2 * .5), y + 1, 1, 3, '#2a2420'); p.disc(x + 6, y + 10, 3, '#09090a'); p.disc(x + w2 - 7, y + 10, 3, '#09090a'); };
  let x = -4; while (x < mw) { const k = r();
    if (k < .3) { const w2 = 34 + Math.floor(r() * 8); car(x, g - 13, w2, r() < .5); car(x + 4, g - 25, w2 - 6, r() < .5); x += w2 + 2; }
    else if (k < .55) { const w2 = 24 + Math.floor(r() * 24), h2 = 28 + Math.floor(r() * 16); camCorr(p, x, g - h2, w2, h2, { seed: x, rust: .5, lx: 1, mask: (i, j) => !(j < 4 && chash(Math.floor(i / 4), 0, x) > .6) });
      if (r() < .5) { const gx = x + 4 + Math.floor(r() * Math.max(1, w2 - 14)), gy = g - h2 + 8, gc = choice(['#5a2a2a', '#2a4a4a', '#4a4a2a']); for (let q = 0; q < 12; q++) p.set(gx + q, gy + Math.round(Math.sin(q * 1.3) * 2), gc); p.line(gx + 2, gy + 4, gx + 10, gy + 4, gc); }
      x += w2; }
    else if (k < .75) { const n = 3 + Math.floor(r() * 3); for (let row = 0; row < 3; row++) for (let q = 0; q < n - (row ? 1 : 0); q++) { const bx = x + q * 9 + (row % 2) * 4, by = g - 5 - row * 5; p.fill(bx, by, 9, 5, (i, j, X, Y) => { const e = Math.hypot((i - 4) / 4.6, (j - 2) / 2.6); return e > 1 ? null : cramp(RAMP.sand, .62 - e * .3 - j * .05 + (chash(X, Y, 2) - .5) * .12, X, Y); }); }
      x += n * 9 + 6; }
    else if (k < .85) { const tx = x + 8, h2 = 46 + Math.floor(r() * 16); p.thick(tx, g, tx + 2, g - h2 * .6, 1.4, '#120d0d'); // a dead tree
      const br = (bx, by, a, L2, d) => { if (d > 4 || L2 < 3) return; const ex = bx + Math.cos(a) * L2, ey = by + Math.sin(a) * L2; p.line(bx, by, ex, ey, '#130e0e'); br(ex, ey, a - .45 - r() * .3, L2 * .7, d + 1); br(ex, ey, a + .35 + r() * .3, L2 * .65, d + 1); };
      br(tx + 2, g - h2 * .6, -Math.PI / 2 - .2, h2 * .35, 0); br(tx + 1, g - h2 * .4, -Math.PI / 2 + .7, h2 * .25, 1); x += 26; }
    else { const sx = x + 4; p.rect(sx + 5, g - 26, 1, 26, '#1e1a1a'); for (let j = 0; j < 10; j++) for (let i = -j; i <= j; i++) p.set(sx + 5 + Math.round(i / 2), g - 36 + j, j === 9 || Math.abs(i) >= j - 1 ? '#3a3020' : chash(i, j, 4) > .82 ? '#3a2a18' : '#6a5422'); // a hazard sign
      p.rect(sx + 5, g - 32, 1, 3, '#1a1410'); p.set(sx + 5, g - 28, '#1a1410'); x += 16; } }
  for (let i = 0; i < mw; i++) { const yy = g - 30 + Math.round(Math.sin(i * .45) * 3 + cfbm(i, 0, 30, 2) * 6); if (chash(i, 0, 3) > .15) p.set(i, yy, '#2a2224'); if (i % 9 === 0) { p.set(i, yy - 1, '#3a3034'); p.set(i, yy + 1, '#3a3034'); } } // wire coil
  return p.canvas();
}
// the ground: cracked asphalt, faded lane marks, puddles, rubble, litter, weeds; returns the puddles too
function campGroundArt(w, g, h) {
  const top = g - 6, p = new CPix(w, h - top), r = campRng(53), A = ['#0d0b0c', '#131012', '#191517', '#1f1a1b', '#26201f', '#2d2624'], pud = [];
  p.fill(0, 0, w, h - top, (i, j, X, Y) => { if (j < 6) { const hh = Math.round(cfbm(i, 0, 6, 4) * 6); if (j < 6 - hh) return null; return cramp(RAMP.conc, .35 + (chash(X, Y, 6) - .5) * .5 + (j === 6 - hh ? .2 : 0), X, Y); }
    return cramp(A, .45 + (cfbm(X, Y * 3, 10, 9) - .5) * .4 + (chash(X, Y, 3) - .5) * .18 - (j - 6) / (h - top) * .2, X, Y); });
  for (let k = 0; k < 40; k++) { let cx = Math.floor(r() * w), cy = 7 + Math.floor(r() * (h - top - 8)); for (let q = 0; q < 10 + r() * 30; q++) { p.set(cx, cy, '#070606'); if (chash(cx, cy, 4) > .5) p.set(cx, cy - 1, '#2e2725'); cx += r() < .7 ? 1 : 0; cy = clamp(cy + Math.floor(r() * 3) - 1, 7, h - top - 1); } }
  for (let i = 0; i < w; i += 22) for (let q = 0; q < 10; q++) if (chash(i, q, 8) > .3) p.set(i + q, 13, chash(i + q, 0, 9) > .5 ? '#4a3e22' : '#3a3220');
  for (let k = 0; k < 9; k++) { const cx = 40 + Math.floor(r() * (w - 80)), cy = 9 + Math.floor(r() * 6), rx = 6 + Math.floor(r() * 12); pud.push([cx, cy + top, rx]); for (let j = -2; j <= 2; j++) for (let i = -rx; i <= rx; i++) if ((i * i) / (rx * rx) + (j * j) / 4 <= 1) p.set(cx + i, cy + j, j <= -1 ? '#151a20' : chash(i, j, 7) > .85 ? '#2a2a33' : '#0c0e12'); }
  for (let k = 0; k < 160; k++) { const cx = Math.floor(r() * w), cy = 3 + Math.floor(r() * (h - top - 3)), t = r();
    if (t < .45) { const s = 1 + Math.floor(r() * 2); p.rect(cx, cy, s, s, cramp(RAMP.conc, .45 + r() * .4, cx, cy)); }
    else if (t < .6) { p.rect(cx, cy, 4, 2, cramp(RAMP.brick, .6, cx, cy)); p.set(cx, cy, '#7a4030'); }
    else if (t < .7) { p.rect(cx, cy, 2, 1, '#6a6458'); p.set(cx + 2, cy, '#4a4640'); }
    else if (t < .78) { p.set(cx, cy, '#b0a890'); p.set(cx + 1, cy, '#8a8270'); }
    else if (t < .86) p.set(cx, cy, '#8a6a24');
    else for (let q = 0; q < 3; q++) p.set(cx + q - 1, cy - Math.floor(r() * 3), chash(cx, q, 3) > .5 ? '#2c3020' : '#3a3e26'); }
  return { cv: p.canvas(), top, pud };
}

// foreground: dark rubble, rebar and weeds passing close to the camera
function campFore(w, h) { const p = new CPix(w, h), r = campRng(71), D = ['#030303', '#060506', '#0a0809', '#0f0c0d', '#141012'];
  for (let x = 0; x < w;) { const k = r();
    if (k < .45) { const bw = 14 + Math.floor(r() * 30), bh = 5 + Math.floor(r() * 9); p.fill(x, h - bh, bw, bh, (i, j, X, Y) => { const top = bh - Math.round((1 - Math.pow(Math.abs(i / bw * 2 - 1), 1.6)) * bh * (.7 + chash(i >> 2, 0, x) * .3)); if (j < top) return null; return cramp(D, .5 - (j - top) / bh * .4 + (chash(X, Y, 5) - .5) * .3 + (j === top ? .3 : 0), X, Y); }); x += bw + Math.floor(r() * 60); }
    else if (k < .65) { const n = 2 + Math.floor(r() * 3); for (let q = 0; q < n; q++) { const bx = x + q * 3, top = h - 10 - Math.floor(r() * 14), bend = (r() - .5) * 6; p.line(bx, h, bx + bend, top, '#0d0a0a'); p.set(bx + bend, top, '#2a1a14'); } x += 20 + Math.floor(r() * 80); }
    else if (k < .8) { for (let q = 0; q < 6; q++) { const bx = x + q * 2 + Math.floor(r() * 2), hh = 4 + Math.floor(r() * 7); for (let j = 0; j < hh; j++) p.set(bx + Math.round(Math.sin(j * .4 + q) * .8), h - 1 - j, j > hh - 3 ? '#1a1c12' : '#0c0d08'); } x += 16 + Math.floor(r() * 70); }
    else x += 30 + Math.floor(r() * 90); }
  return p.canvas(); }
// ---------------- the props ----------------
function campProps() {
  const P = {};
  // the archive: a dented cabinet with a drawer pulled out, files spilling, a desk lamp, a crate of documents
  P.codex = mkSprite(74, 72, 37, 71, p => { const lx = lxOf(CPOS.codex), Y = 8;
    camSurf(p, 6, Y, 30, 63, RAMP.olive, { lx, seed: 5, rust: .3, base: .5 });
    for (let d = 0; d < 4; d++) { const dy = Y + 3 + d * 15, open = d === 1, ox = open ? 2 : 0, oy = open ? 3 : 0;
      if (open) camSurf(p, 9, dy + 12, 26, 3, RAMP.olive, { seed: 8, base: .25 });
      camSurf(p, 8 + ox, dy + oy, 26, 13, RAMP.olive, { lx, seed: 11 + d, rust: .25, base: .58 }); p.rect(8 + ox, dy + oy + 12, 26, 1, RAMP.olive[0]);
      p.rect(18 + ox, dy + oy + 6, 6, 2, '#8a929a'); p.rect(18 + ox, dy + oy + 8, 6, 1, '#1a1c1e'); p.rect(14 + ox, dy + oy + 2, 8, 3, '#a89c84'); p.rect(15 + ox, dy + oy + 3, 5, 1, '#5a5448');
      if (open) for (let f = 0; f < 6; f++) { const fc = ['#8a7a52', '#6a2a24', '#2a3a4a', '#8a7a52', '#4a5a3a', '#a8a088'][f]; p.rect(11 + f * 4, dy - 3 - (f % 2), 3, 4 + (f % 2), fc); p.set(11 + f * 4, dy - 3 - (f % 2), '#d8d0b8'); } }
    for (let k = 0; k < 7; k++) { const sx = 8 + Math.floor(chash(k, 1, 5) * 24), sy = Y + 4 + Math.floor(chash(k, 2, 5) * 55); p.line(sx, sy, sx + 3, sy + 1, '#6a7460'); } // scratches
    p.rect(26, Y + 50, 6, 6, '#7a6a2a'); p.set(29, Y + 52, '#1a1408'); p.set(28, Y + 54, '#1a1408'); p.set(30, Y + 54, '#1a1408');               // a hazard sticker
    camSurf(p, 8, Y - 4, 12, 4, RAMP.paper, { seed: 3, base: .5 }); p.rect(8, Y - 2, 12, 1, '#6a2a24');
    p.line(24, Y - 1, 27, Y - 7, '#3a3e42'); p.line(27, Y - 7, 31, Y - 5, '#3a3e42'); p.rect(30, Y - 6, 4, 3, '#5a5f52'); p.rect(30, Y - 3, 4, 1, '#ffd88a'); p.rect(23, Y - 1, 4, 1, '#2a2e30');
    p.rect(12, Y - 10, 6, 6, '#3a2a1a'); p.rect(13, Y - 9, 4, 4, '#5a6470'); p.line(13, Y - 9, 16, Y - 6, '#a8b0b8');
    for (let k = 0; k < 4; k++) { const px = 36 + k * 5, py = 69 - (k % 2); p.rect(px, py, 5, 2, k % 2 ? '#a8a088' : '#8a8270'); p.set(px + 1, py, '#4a463e'); }
    camPlanks(p, 44, 50, 26, 21, RAMP.wood, { seed: 7, lx, pw: 5, nails: [.1, .9] }); p.rect(44, 50, 26, 1, '#6b4b31');
    for (let k = 0; k < 5; k++) p.rect(47 + k * 4, 45 - (k % 3), 3, 6, k % 2 ? '#9d9382' : '#837a6c'); p.rect(62, 44, 5, 6, '#3a4a5a'); p.rect(67, 46, 1, 2, '#3a4a5a'); p.rect(63, 44, 3, 1, '#1a1410'); });
  // the notice board: cork on scaffold pipes, papers, photos, a map with red string, a tally of days, a bare bulb
  P.board = mkSprite(84, 80, 42, 79, p => { const lx = lxOf(CPOS.board);
    for (const px of [8, 74]) camSurf(p, px, 6, 3, 74, RAMP.steel, { lx, seed: px, rust: .4, base: .5 }); camSurf(p, 4, 4, 76, 3, RAMP.steel, { lx, seed: 2, rust: .3 });
    p.line(42, 7, 42, 12, '#1a1a1c'); p.rect(41, 12, 3, 2, '#3a3a3e'); p.rect(41, 14, 3, 3, '#d8c890');
    camPlanks(p, 6, 18, 72, 48, RAMP.wood, { seed: 9, lx, pw: 3 }); p.fill(8, 20, 68, 44, (i, j, X, Y) => cramp(RAMP.cork, .5 + (chash(X, Y, 4) - .5) * .5 + (cfbm(X, Y, 4, 2) - .5) * .3 - j / 44 * .15, X, Y));
    const papers = [[10, 22, 14, 18, 'list'], [26, 21, 12, 15, 'photo'], [40, 23, 18, 13, 'map'], [60, 21, 13, 17, 'missing'], [11, 43, 12, 14, 'tally'], [25, 39, 15, 12, 'text'], [42, 39, 11, 14, 'photo'], [55, 41, 19, 12, 'list'], [27, 53, 10, 9, 'text']];
    const pins = []; papers.forEach(([x, y, w, h, kind], n) => { camSurf(p, x, y, w, h, RAMP.paper, { seed: 40 + n, base: n % 3 ? .62 : .78, grime: .2 }); p.rect(x + 1, y + h, w - 1, 1, '#140d08');
      if (kind === 'list') for (let k = 0; k < (h - 4) / 2; k++) { p.rect(x + 2, y + 3 + k * 2, 2, 1, '#2a2620'); p.rect(x + 5, y + 3 + k * 2, Math.round((w - 7) * (.5 + chash(n, k, 3) * .5)), 1, '#4a453c'); }
      if (kind === 'text') for (let k = 0; k < (h - 3) / 2; k++) p.rect(x + 2, y + 2 + k * 2, Math.round((w - 4) * (.6 + chash(n, k, 4) * .4)), 1, '#4a453c');
      if (kind === 'photo') { p.rect(x + 2, y + 2, w - 4, h - 6, '#2a2c30'); p.disc(x + w / 2, y + 6, 2, '#6a5a50'); p.rect(x + w / 2 - 3, y + 9, 6, h - 13, '#3a3a40'); p.rect(x + 2, y + h - 3, w - 4, 1, '#4a453c'); }
      if (kind === 'missing') { p.rect(x + 2, y + 2, w - 4, 3, '#5a1a14'); p.rect(x + 3, y + 6, w - 6, 6, '#3a3632'); p.disc(x + w / 2, y + 8, 2, '#7a6a5a'); p.rect(x + 2, y + 13, w - 4, 1, '#4a453c'); p.line(x + 2, y + 2, x + w - 3, y + h - 2, '#8a2a20'); }
      if (kind === 'map') { p.rect(x + 1, y + 1, w - 2, h - 2, '#7a7460'); for (let k = 0; k < 4; k++) p.line(x + 1, y + 2 + k * 3, x + w - 2, y + 3 + k * 3 + (k % 2), '#5a5446'); p.line(x + 6, y + 1, x + 8, y + h - 2, '#4a6a7a'); for (let a = 0; a < 6.28; a += .5) p.set(x + 12 + Math.round(Math.cos(a) * 3), y + 6 + Math.round(Math.sin(a) * 2), '#9a2a20'); }
      if (kind === 'tally') for (let k = 0; k < 4; k++) { for (let q = 0; q < 4; q++) p.rect(x + 2 + q * 2, y + 2 + k * 3, 1, 2, '#2a2620'); p.line(x + 1, y + 4 + k * 3, x + 9, y + 2 + k * 3, '#6a1a14'); }
      const px = x + Math.floor(w / 2), py = y + 1; pins.push([px, py]); p.set(px, py, ['#c83a2a', '#d8b03a', '#3a7ac8', '#4ab05a'][n % 4]); p.set(px, py + 1, '#140d08'); });
    for (const [a, b] of [[1, 2], [2, 3], [2, 6], [6, 7]]) p.line(pins[a][0], pins[a][1], pins[b][0], pins[b][1], '#8a2020');
    camPlanks(p, 30, 66, 22, 3, RAMP.wood, { seed: 12, lx }); p.rect(14, 70, 9, 10, '#2a2f2a'); p.rect(14, 70, 9, 1, '#4a524a'); p.line(17, 64, 20, 70, '#4a3020'); p.rect(19, 62, 2, 3, '#7a6a5a'); });
  // the radio station: a door laid on two crates, a military set with dials and a meter, a second unit, mic, headphones, battery,
  // cables to a mast with guy wires
  P.radio = mkSprite(100, 124, 46, 123, p => { const lx = lxOf(CPOS.radio), G0 = 123;
    for (const cx of [4, 54]) { camPlanks(p, cx, G0 - 26, 26, 26, RAMP.wood, { seed: cx, lx, pw: 6, nails: [.15, .85] }); p.rect(cx, G0 - 26, 26, 1, '#6b4b31'); p.rect(cx + 3, G0 - 18, 20, 4, '#2a1d14'); p.rect(cx + 5, G0 - 17, 3, 1, '#8a7a5a'); p.rect(cx + 10, G0 - 17, 8, 1, '#8a7a5a'); }
    camPlanks(p, 2, G0 - 30, 80, 4, RAMP.wood, { seed: 31, lx, pw: 4 }); p.rect(2, G0 - 30, 80, 1, '#82603e');
    const rx = 10, ry = G0 - 54; camSurf(p, rx, ry, 38, 24, RAMP.olive, { lx, seed: 33, rust: .15, base: .5 }); p.rect(rx + 1, ry + 1, 36, 1, '#687656');
    for (const [dx, rr] of [[7, 4], [29, 4]]) { p.disc(rx + dx, ry + 10, rr, '#16181a'); p.disc(rx + dx, ry + 10, rr - 1, '#2a2e30'); for (let a = 0; a < 6.28; a += .7) p.set(rx + dx + Math.round(Math.cos(a) * rr), ry + 10 + Math.round(Math.sin(a) * rr), '#8a9088'); p.set(rx + dx, ry + 10, '#a8aea6'); }
    p.rect(rx + 13, ry + 4, 11, 8, '#1c2018'); p.rect(rx + 14, ry + 5, 9, 6, '#8a8a62'); p.rect(rx + 14, ry + 10, 9, 1, '#6a6a4a'); for (let k = 0; k < 5; k++) p.set(rx + 15 + k * 2, ry + 5, '#3a3a2a');
    for (let k = 0; k < 6; k++) { p.rect(rx + 5 + k * 5, ry + 17, 2, 3, '#1a1c1a'); p.set(rx + 5 + k * 5, ry + 16 + (k % 2) * 2, '#c8c8c0'); }
    p.rect(rx + 13, ry + 13, 11, 3, '#121410'); for (let k = 0; k < 5; k++) p.set(rx + 14 + k * 2, ry + 14, '#3a3a2a');
    camSurf(p, rx + 2, ry - 10, 24, 10, RAMP.steel, { lx, seed: 35, rust: .2 }); p.rect(rx + 4, ry - 8, 10, 4, '#0a120c'); p.rect(rx + 16, ry - 8, 8, 6, '#1a1c1e'); for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) p.set(rx + 17 + i * 2, ry - 7 + j * 2, '#3a3e42');
    p.line(rx + 46, G0 - 31, rx + 46, G0 - 44, '#2a2a2e'); p.rect(rx + 44, G0 - 31, 5, 1, '#2a2a2e'); p.rect(rx + 45, G0 - 48, 3, 5, '#3a3a40'); p.set(rx + 46, G0 - 47, '#6a6a72');
    p.rect(rx - 4, ry + 4, 2, 7, '#1a1a1c'); for (let a = 0; a < 3.2; a += .4) p.set(rx - 3 + Math.round(Math.cos(a + 1.6) * 4), ry + 5 - Math.round(Math.sin(a + 1.6) * 3), '#2a2a2e'); p.rect(rx - 6, ry + 9, 3, 4, '#2a2a2e');
    p.rect(rx + 52, G0 - 33, 10, 3, '#9d9382'); p.rect(rx + 53, G0 - 32, 7, 1, '#5a5448'); p.line(rx + 58, G0 - 34, rx + 63, G0 - 33, '#8a6a24');
    p.rect(rx + 64, G0 - 37, 5, 7, '#3a4a5a'); p.line(rx + 65, G0 - 37, rx + 64, G0 - 41, '#8a6a24'); p.line(rx + 67, G0 - 37, rx + 68, G0 - 40, '#2a4a6a');
    camSurf(p, 30, G0 - 8, 14, 8, RAMP.rub, { lx, seed: 3, base: .5 }); p.rect(32, G0 - 10, 2, 2, '#8a2a20'); p.rect(40, G0 - 10, 2, 2, '#2a2a2e');
    for (let i = 0; i < 40; i++) p.set(33 + Math.round(Math.sin(i * .2) * 2) - i * .2, G0 - 10 - Math.round(i * .45), '#1a1210');
    const mx = 92; for (let y = 4; y < G0; y++) { p.set(mx, y, (y % 8) < 1 ? '#5a5f64' : '#3a3e42'); if (y % 12 === 0) { p.set(mx - 1, y, '#2a2e30'); p.set(mx + 1, y, '#2a2e30'); } }
    p.line(mx - 9, 8, mx + 7, 8, '#4a4e52'); p.line(mx - 6, 16, mx + 6, 16, '#4a4e52'); p.line(mx, 4, mx, 0, '#4a4e52'); p.line(mx, 22, 62, G0, '#1e2022'); p.line(mx, 22, 99, G0 - 2, '#1e2022');
    for (let i = 0; i < 46; i++) p.set(rx + 38 + i, G0 - 30 + Math.round(Math.sin(i / 46 * Math.PI) * 6), '#141010'); });
  // the campfire's stones, logs, tripod and pot; the benches
  P.fire = mkSprite(124, 34, 62, 33, p => { const G0 = 33;
    for (let k = 0; k < 11; k++) { const a = Math.PI + k / 10 * Math.PI, sx = 62 + Math.round(Math.cos(a) * 15), sy = G0 - 3 + Math.round(Math.sin(a) * -1.6); camSurf(p, sx - 2, sy - 2, 5, 4, RAMP.conc, { seed: k, base: .55, lx: sx < 62 ? 1 : -1 }); }
    p.fill(48, G0 - 4, 28, 3, (i, j, X, Y) => cramp(['#140f0e', '#221a18', '#3a2e2a', '#504540'], .3 + chash(X, Y, 2) * .5, X, Y));
    for (const [x0, y0, x1, y1] of [[52, G0 - 3, 64, G0 - 12], [72, G0 - 3, 61, G0 - 13], [56, G0 - 2, 70, G0 - 5]]) p.thick(x0, y0, x1, y1, 1.3, '#1a110c');
    p.line(46, G0, 62, G0 - 30, '#2a1e16'); p.line(78, G0, 62, G0 - 30, '#2a1e16'); p.line(62, G0, 62, G0 - 30, '#241a12'); p.line(62, G0 - 30, 62, G0 - 22, '#3a3a3e');
    p.fill(57, G0 - 22, 11, 7, (i, j, X, Y) => { if (j > 4 && Math.abs(i - 5) > 4) return null; return cramp(RAMP.steel, .55 - (Math.abs(i - 5) / 5.5 + j / 7 * .3) * .3 + (chash(X, Y, 3) - .5) * .15, X, Y); }); p.rect(56, G0 - 22, 13, 1, '#5a6068');
    const bench = bx => { p.fill(bx, G0 - 7, 26, 7, (i, j, X, Y) => { const e = Math.abs(j - 3) / 3.5; return e > 1 ? null : cramp(RAMP.wood, .65 - e * .45 + Math.sin(i * .5) * .05 + (chash(X, Y, 1) - .5) * .15, X, Y); });
      for (let j = -3; j <= 3; j++) for (let i = -2; i <= 2; i++) if (i * i / 4 + j * j / 9 <= 1) p.set(bx + 26 + i * .5, G0 - 4 + j, (i * i + j * j) % 3 ? '#6b4b31' : '#82603e'); };
    bench(4); bench(94); p.rect(36, G0 - 3, 3, 3, '#4a5458'); p.set(37, G0 - 3, '#8a929a'); p.rect(86, G0 - 2, 4, 2, '#5a3a2a'); });
  // the black market: a shanty under a corrugated roof, a counter on oil drums, shelves of jars, ammo, medkits, a gas mask and a
  // rifle on the wall, dried meat on a line, price slates, a painted sign
  P.market = mkSprite(144, 100, 72, 99, p => { const lx = lxOf(CPOS.market), G0 = 99;
    camCorr(p, 10, 20, 124, G0 - 32, { seed: 61, lx, rust: .45, mask: (i, j) => !(i > 92 && j < 30) });
    camPlanks(p, 102, 20, 32, 30, RAMP.wood, { seed: 62, lx, pw: 4, vert: true, nails: [.2, .8] });
    p.fill(4, 12, 136, 9, (i, j, X, Y) => { const y2 = j - Math.round(i * .04); if (y2 < 0 || y2 > 6) return null; const rr = i % 4, v = .45 + (rr === 1 ? .22 : rr === 3 ? -.14 : 0) + (y2 === 0 ? .2 : 0) + (chash(X, Y, 3) - .5) * .1; return cfbm(X, Y, 6, 7) > .6 ? cramp(RAMP.rust, v, X, Y) : cramp(RAMP.steel, v, X, Y); });
    for (const px of [8, 132]) camPlanks(p, px, 18, 4, G0 - 18, RAMP.wood, { seed: px, vert: true, pw: 4, lx });
    p.fill(126, 20, 10, 48, (i, j, X, Y) => { if (j > 40 + Math.round(chash(i, 0, 4) * 8)) return null; return chash(Math.floor(j / 6), i, 9) > .96 ? null : cramp(RAMP.tarp, .45 + Math.sin(i * 1.4 + j * .05) * .15 - j / 60 + (chash(X, Y, 2) - .5) * .1, X, Y); });
    for (let s = 0; s < 3; s++) { const sy = 34 + s * 14; camPlanks(p, 16, sy, 84, 2, RAMP.wood, { seed: 70 + s, lx }); p.rect(16, sy + 2, 84, 1, '#0c0807');
      for (let k = 0; k < 13; k++) { const gx = 18 + k * 6 + Math.floor(chash(k, s, 1) * 2), kind = Math.floor(chash(k, s, 2) * 5);
        if (kind === 0) { const c = ['#3a7a4a', '#7a2a2a', '#2a5a7a', '#8a7a2a'][(k + s) % 4]; p.rect(gx, sy - 6, 4, 6, '#1a1e1c'); p.rect(gx, sy - 4, 4, 4, c); p.set(gx, sy - 4, '#e0e8e0'); p.rect(gx, sy - 7, 4, 1, '#5a5a5e'); }
        else if (kind === 1) for (let q = 0; q < 2; q++) { p.rect(gx, sy - 3 - q * 3, 4, 3, '#5a5f64'); p.rect(gx, sy - 2 - q * 3, 4, 1, ['#8a2a20', '#2a5a2a', '#8a7a2a'][(k + q) % 3]); }
        else if (kind === 2) { p.rect(gx, sy - 5, 5, 5, '#3a4232'); p.rect(gx + 1, sy - 3, 3, 1, '#a89a3a'); p.rect(gx, sy - 5, 5, 1, '#4a5440'); }
        else if (kind === 3) { p.rect(gx, sy - 5, 5, 5, '#a8a49a'); p.rect(gx + 2, sy - 4, 1, 3, '#8a2020'); p.rect(gx + 1, sy - 3, 3, 1, '#8a2020'); }
        else { p.rect(gx + 1, sy - 4, 2, 4, '#4a3020'); p.rect(gx, sy - 5, 4, 1, '#6a5a4a'); } } }
    p.disc(22, 26, 3, '#2a2e2a'); p.disc(21, 26, 1, '#5a6a6a'); p.disc(24, 26, 1, '#5a6a6a'); p.rect(22, 29, 2, 2, '#1a1c1a');
    p.line(34, 27, 70, 24, '#1a1410'); p.line(34, 28, 70, 25, '#2a1e16'); p.rect(56, 25, 8, 3, '#3a2a1c'); p.rect(44, 27, 4, 3, '#1a1a1c'); p.set(70, 23, '#5a5f64');
    for (let i = 0; i < 26; i++) p.set(76 + i, 24 + Math.round(Math.sin(i / 26 * Math.PI) * 2), '#1a1410'); for (let k = 0; k < 4; k++) p.rect(78 + k * 6, 26, 2, 4 + (k % 2), '#5a2a1c');
    for (const dx of [20, 84]) p.fill(dx, G0 - 22, 16, 22, (i, j, X, Y) => { const e = Math.abs(i - 7.5) / 8, v = .65 - e * e * .55 + (j % 7 === 0 ? .15 : 0) + (chash(X, Y, 1) - .5) * .12; return cfbm(X, Y, 4, 3) > .58 ? cramp(RAMP.rust, v, X, Y) : cramp(RAMP.red, v, X, Y); });
    camPlanks(p, 14, G0 - 27, 92, 5, RAMP.wood, { seed: 81, lx, pw: 5 }); p.rect(14, G0 - 27, 92, 1, '#82603e');
    for (let k = 0; k < 3; k++) { const sx = 30 + k * 22; p.rect(sx, G0 - 34, 9, 7, '#16141a'); p.rect(sx, G0 - 34, 9, 1, '#3a3a40'); for (let q = 0; q < 3; q++) p.rect(sx + 2, G0 - 32 + q * 2, 2 + Math.floor(chash(k, q, 6) * 4), 1, '#c8c4b8'); }
    p.rect(66, G0 - 31, 10, 4, '#3a4232'); p.rect(67, G0 - 30, 8, 1, '#a89a3a'); p.rect(78, G0 - 32, 6, 5, '#5a5f64');
    camPlanks(p, 30, 2, 56, 10, RAMP.wood, { seed: 90, lx, pw: 5 }); for (let k = 0; k < 7; k++) { const sx = 36 + k * 7; p.rect(sx, 4, 4, 5, '#8a1c18'); if (chash(k, 0, 7) > .4) p.line(sx + 1, 9, sx + 1, 10 + Math.floor(chash(k, 1, 7) * 4), '#6a1410'); }
    p.line(40, 12, 40, 18, '#2a2a2e'); p.line(76, 12, 76, 18, '#2a2a2e'); });
  // the supply post: a shipping container with its doors open, an airdrop crate under a torn chute, a pallet of crates, a painted
  // gauge (the event's progress fills it), a flagpole (the flag is drawn moving)
  P.event = mkSprite(140, 104, 66, 103, p => { const lx = lxOf(CPOS.event), G0 = 103, cx = 12, cy = G0 - 46;
    p.fill(cx, cy, 104, 46, (i, j, X, Y) => { if (i > 82) return null; const r5 = i % 5, rid = r5 === 1 ? .22 : r5 === 2 ? .1 : r5 === 4 ? -.16 : 0; let v = .48 + rid + lx * (i / 104 - .5) * .2 - j / 46 * .15 + (chash(X, Y, 3) - .5) * .1;
      if (j < 2) v += .25; if (j > 43) v -= .2; if (cnoise(X, 0, 3, 5) > .62) v -= j / 46 * .3; return cfbm(X, Y, 7, 9) > .64 ? cramp(RAMP.rust, v - .05, X, Y) : cramp(RAMP.cont, v, X, Y); });
    p.rect(cx + 82, cy, 22, 46, '#060506'); p.fill(cx + 83, cy + 2, 20, 42, (i, j, X, Y) => cramp(['#08070a', '#0d0b0e', '#131013'], .3 + (cfbm(X, Y, 5, 2) - .5) * .5, X, Y));
    camPlanks(p, cx + 86, cy + 30, 14, 14, RAMP.wood, { seed: 5, pw: 4 }); camPlanks(p, cx + 88, cy + 20, 10, 10, RAMP.wood, { seed: 6, pw: 3 });
    camSurf(p, cx + 104, cy + 2, 12, 44, RAMP.cont, { lx: 1, seed: 8, base: .62, rust: .4 }); for (let k = 0; k < 4; k++) p.rect(cx + 106 + (k % 2) * 6, cy + 4, 1, 40, '#2a120a');
    p.rect(cx + 8, cy + 8, 36, 7, '#7a6a58'); for (let k = 0; k < 6; k++) p.rect(cx + 10 + k * 6, cy + 9, 4, 5, '#3a1a0e'); p.rect(cx + 8, cy + 18, 22, 2, '#7a6a58'); p.rect(cx + 8, cy + 22, 14, 2, '#7a6a58');
    camSurf(p, cx + 55, cy + 4, 18, 40, RAMP.steel, { lx, seed: 77, base: .6, rust: .25 }); for (const [bx2, by2] of [[1, 1], [16, 1], [1, 38], [16, 38]]) { p.set(cx + 55 + bx2, cy + 4 + by2, '#9aa2aa'); p.set(cx + 56 + bx2, cy + 5 + by2, '#1a1c1e'); }
    p.rect(cx + 58, cy + 7, 10, 35, '#050707'); p.fill(cx + 59, cy + 8, 8, 33, (i, j, X, Y) => i === 1 ? '#2a3a3a' : i === 2 && j % 9 < 5 ? '#1a2626' : '#0a1010'); // the glass, empty
    for (let k = 0; k <= 10; k++) p.rect(cx + 68, cy + 8 + Math.round(k * 3.3), k % 5 ? 2 : 4, 1, '#d8d0b8'); p.rect(cx + 55, cy + 45, 18, 5, '#c8c0a8'); for (let k = 0; k < 4; k++) p.rect(cx + 57 + k * 4, cy + 46, 3, 3, '#2a1a10');
    camPlanks(p, cx + 18, cy - 14, 30, 14, RAMP.olive, { seed: 7, pw: 5, lx }); p.rect(cx + 18, cy - 9, 30, 2, '#2a2a20'); p.rect(cx + 30, cy - 14, 2, 14, '#2a2a20'); p.rect(cx + 22, cy - 12, 6, 3, '#c8c0a8');
    p.fill(cx + 40, cy - 22, 46, 24, (i, j, X, Y) => { const edge = 4 + Math.sin(i * .35) * 3 + i * .3; if (j < edge - 6 || j > edge + 14 - i * .1 || (i > 30 && j > edge + 4)) return null; if (chash(Math.floor(i / 3), Math.floor(j / 3), 4) > .93) return null; return cramp(['#3a3632', '#55504a', '#706a60', '#8e8676', '#a8a090'], .55 + Math.sin(i * .6) * .25 - j / 30, X, Y); });
    for (let k = 0; k < 4; k++) p.line(cx + 42 + k * 9, cy - 16 + k * 2, cx + 34, cy - 12, '#5a5448');
    p.rect(0, G0 - 4, 30, 4, '#3a2a1a'); for (let k = 0; k < 4; k++) p.rect(1 + k * 8, G0 - 4, 4, 4, '#4c3826');
    camPlanks(p, 1, G0 - 22, 14, 18, RAMP.wood, { seed: 21, pw: 6, lx }); camPlanks(p, 15, G0 - 16, 14, 12, RAMP.olive, { seed: 22, pw: 4, lx }); camPlanks(p, 3, G0 - 32, 11, 10, RAMP.wood, { seed: 23, pw: 5, lx });
    p.rect(4, G0 - 16, 8, 1, '#c8c0a8'); p.line(5, G0 - 14, 8, G0 - 11, '#c8c0a8'); p.line(11, G0 - 14, 8, G0 - 11, '#c8c0a8'); p.rect(17, G0 - 12, 8, 2, '#8a2a20'); p.rect(2, G0 - 22, 12, 1, '#1a1a1c'); p.rect(15, G0 - 16, 14, 1, '#1a1a1c');
    p.rect(124, 4, 2, G0 - 4, '#4a4e52'); p.rect(124, 4, 1, G0 - 4, '#6a6e72'); p.rect(122, G0 - 3, 6, 3, '#2a2a2e'); p.rect(123, 2, 4, 2, '#6a6e72'); });
  // the way out: an armoured pickup with welded plates, mesh over the windows, a ram, cans and a spare on the bed, big wheels;
  // the gate: stacked containers, a chain-link slide, a boom, a watchtower
  // the way out: an armoured pickup with welded plates, mesh over the windows, a ram, cans and a spare on the bed, big wheels
  P.truck = mkSprite(124, 58, 62, 57, p => { const G0 = 57, lx = -1, OL = RAMP.olive, D = '#121410', RW = 27, FW = 84, WY = G0 - 9;
    // the whip antenna at the back corner, a red rag on the tip
    p.line(11, G0 - 29, 16, 1, '#3a3c38'); p.set(16, 1, '#c83a2a'); p.set(17, 2, '#8a2020');
    // the spare wheel hung on the tailgate (seen edge-on) and the rear bumperettes
    p.rect(4, G0 - 36, 5, 19, '#0a0a0c'); for (let q = 0; q < 6; q++) p.rect(3, G0 - 35 + q * 3, 1, 2, '#1c1c20'); p.rect(6, G0 - 30, 2, 7, '#2c302c'); p.set(7, G0 - 27, '#5a5e5a');
    p.rect(4, G0 - 16, 7, 3, '#24261f'); p.rect(4, G0 - 16, 7, 1, '#3a3e32');
    // the canvas top over its bows, a clear side curtain, the seat backs showing through
    camSurf(p, 12, G0 - 49, 45, 21, RAMP.tarp, { lx, seed: 71, base: .62, grime: .25, mask: (i, j) => !(j < 3 && i < 3 - j) });
    for (const bx of [24, 38]) p.rect(bx, G0 - 48, 1, 20, '#141a16'); p.rect(12, G0 - 30, 45, 1, '#141a16');
    p.rect(27, G0 - 45, 22, 9, '#0a0e0d'); p.rect(28, G0 - 44, 20, 1, '#2a3632'); p.set(46, G0 - 43, '#5a6a64'); p.rect(33, G0 - 40, 4, 4, '#1a1e1a'); p.rect(43, G0 - 40, 4, 4, '#1a1e1a');
    // the windscreen frame, folded up and raked back, a glint on the glass; a mirror on its arm
    p.thick(58, G0 - 30, 55, G0 - 49, .7, '#2a2e24'); p.line(57, G0 - 31, 54, G0 - 48, '#3e4636'); p.set(56, G0 - 44, '#9ab0b4'); p.set(56, G0 - 43, '#6a8088');
    p.rect(61, G0 - 38, 1, 8, '#2a2c28'); p.rect(60, G0 - 41, 3, 3, '#3a3e3a'); p.set(60, G0 - 41, '#8a9a9e');
    // the tub: a flat-sided body, the arch cut round the back wheel, the open step-in where a door would be, grab handle, tail light
    p.rect(45, G0 - 29, 13, 8, '#0b0c0a'); p.rect(47, G0 - 25, 9, 2, '#2a2c22'); p.rect(47, G0 - 27, 1, 2, '#2a2c22');
    camSurf(p, 9, G0 - 29, 50, 17, OL, { lx, seed: 72, rust: .18, base: .66, mask: (i, j) => Math.hypot(9 + i - RW, G0 - 29 + j - WY) > 12.5 && !(i > 35 && i < 49 && j < 8) });
    p.rect(9, G0 - 29, 37, 1, '#687656'); p.rect(10, G0 - 26, 2, 3, '#c83a2a'); p.rect(14, G0 - 23, 6, 1, '#2a2e24'); p.rect(14, G0 - 24, 1, 1, '#2a2e24'); p.rect(19, G0 - 24, 1, 1, '#2a2e24');
    // the shovel and the axe strapped along the flank
    p.line(24, G0 - 26, 42, G0 - 18, '#4a3020'); p.rect(41, G0 - 20, 4, 4, '#4a4e52'); p.rect(41, G0 - 20, 4, 1, '#6a6e72'); p.rect(30, G0 - 25, 1, 2, '#1a1c14'); p.rect(37, G0 - 22, 1, 2, '#1a1c14');
    // the cowl and the long flat hood, a white star on its side; the flat front fender shelf over the open wheel
    camSurf(p, 57, G0 - 30, 41, 12, OL, { lx, seed: 73, rust: .14, base: .7, mask: (i, j) => !(j < 2 && i > 38 + j) });
    p.rect(58, G0 - 30, 38, 1, '#687656'); p.rect(58, G0 - 26, 1, 8, D); p.rect(64, G0 - 29, 30, 1, '#4c5a3e');
    { const sx = 78.5, sy = G0 - 23.5, pts = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 2 : 4.6; pts.push([sx + Math.cos(a) * r, sy + Math.sin(a) * r]); } p.poly(pts, '#c8c8c0'); }
    camSurf(p, 66, G0 - 18, 33, 2, OL, { seed: 74, base: .6 }); p.rect(66, G0 - 18, 33, 1, '#5a6648');
    // the grille edge, a caged headlight, a blackout lamp, the front bumper with its shackle
    p.rect(97, G0 - 30, 3, 13, '#1a1c16'); for (let k = 0; k < 6; k++) p.rect(98, G0 - 29 + k * 2, 2, 1, '#050505');
    p.disc(99, G0 - 25, 2.2, '#2a2c28'); p.rect(99, G0 - 26, 2, 3, '#e8e0b0'); p.set(101, G0 - 25, '#1a1c1a'); p.rect(96, G0 - 20, 2, 2, '#d8b03a');
    p.rect(97, G0 - 16, 8, 3, '#24261f'); p.rect(97, G0 - 16, 8, 1, '#3a3e32'); p.rect(103, G0 - 14, 2, 2, '#4a4e52');
    // the frame rails and the axles under the body
    p.rect(9, G0 - 12, 89, 2, '#141610'); p.rect(9, G0 - 12, 89, 1, '#22261c'); p.rect(50, G0 - 10, 8, 3, '#18191a'); p.rect(4, G0 - 11, 6, 1, '#2a2a2e');
    // the wheels: tall knobbly tyres on split combat rims
    for (const wx of [RW, FW]) { p.disc(wx, WY, 9, '#0a0a0c'); for (let a2 = 0; a2 < 6.28; a2 += .45) p.rect(wx + Math.round(Math.cos(a2) * 8.6) - 1, WY + Math.round(Math.sin(a2) * 8.6) - 1, 2, 2, '#1c1c20');
      p.disc(wx, WY, 5.5, '#141416'); p.disc(wx, WY, 4.5, '#2e322c'); p.disc(wx, WY - 1, 2.5, '#3c403a'); p.disc(wx, WY, 1.5, '#50544e'); for (let a2 = 0; a2 < 6.28; a2 += 1.047) p.set(wx + Math.round(Math.cos(a2) * 3.4), WY + Math.round(Math.sin(a2) * 3.4), '#6a6e6a');
      p.fill(wx - 9, WY, 19, 9, (i, j, X, Y) => p.a(X, Y) > 0 && cfbm(X, Y, 3, 7) > .55 ? '#2a2018' : null); }
    // mud thrown up the sides, grime in the seams
    p.fill(4, G0 - 24, 100, 12, (i, j, X, Y) => p.a(X, Y) > 0 && Y > G0 - 21 + (cfbm(X, 0, 5, 4) * 6 | 0) && cfbm(X, Y * 1.5, 4, 3) > .5 ? (cfbm(X, Y, 2, 9) > .5 ? '#2a2018' : '#3a2c1e') : null);
    p.fill(9, G0 - 49, 90, 37, (i, j, X, Y) => p.a(X, Y) > 0 && cnoise(X, 0, 2.3, 5) > .76 && chash(X, Y, 11) > .45 ? '#1a1c14' : null); });
  // the gate behind it: stacked containers, a chain-link slide, a watchtower (the boom in front of the truck is drawn live)
  P.wall = mkSprite(120, 116, 0, 115, p => { const G0 = 115, lx = -1;
    const gx = 32; camCorr(p, gx, G0 - 30, 40, 30, { seed: 7, lx, rust: .5, ramp: RAMP.cont }); camCorr(p, gx + 4, G0 - 58, 34, 28, { seed: 8, lx, rust: .45 }); p.rect(gx, G0 - 30, 40, 1, '#060506'); p.rect(gx + 4, G0 - 58, 34, 1, '#80391b');
    for (let i = 0; i < 34; i++) for (let j = 0; j < 40; j++) if ((i + j) % 4 === 0 || (i - j + 100) % 4 === 0) p.set(gx + 40 + i, G0 - 40 + j, '#2a2e30'); p.rect(gx + 40, G0 - 40, 34, 1, '#4a4e52'); p.rect(gx + 40, G0 - 40, 1, 40, '#4a4e52');
    for (let i = 0; i < 34; i++) p.set(gx + 40 + i, G0 - 44 + Math.round(Math.sin(i * .9) * 2), '#3a3a3e');
    const tx = gx + 18; for (const o2 of [0, 16]) camPlanks(p, tx + o2, G0 - 104, 3, 46, RAMP.wood, { seed: o2, vert: true, pw: 3 }); p.line(tx, G0 - 60, tx + 18, G0 - 100, '#2a1d14'); p.line(tx + 18, G0 - 60, tx, G0 - 100, '#2a1d14');
    camPlanks(p, tx - 4, G0 - 108, 27, 4, RAMP.wood, { seed: 3, pw: 4 }); for (let k = 0; k < 4; k++) p.fill(tx - 4 + k * 7, G0 - 113, 7, 5, (i, j, X, Y) => { const e = Math.hypot((i - 3) / 3.6, (j - 2) / 2.6); return e > 1 ? null : cramp(RAMP.sand, .62 - e * .3, X, Y); });
    p.rect(tx + 6, G0 - 116, 7, 4, '#4a4e52'); p.rect(tx + 12, G0 - 115, 2, 2, '#e8e0b0'); });
  // set dressing (not usable): a tent, a generator, a water tank, a barrel fire
  P.tent = mkSprite(70, 40, 35, 39, p => { const G0 = 39;
    p.poly([[2, G0], [30, 4], [36, 4], [68, G0]], null, (x, y) => { const k = x < 33 ? (33 - x) / 31 : (x - 33) / 35; return cramp(RAMP.tarp, .55 - k * .2 + (x > 33 ? -.2 : .1) + (chash(x, y, 4) - .5) * .12 + (cfbm(x, y, 5, 3) > .64 ? -.25 : 0), x, y); });
    p.poly([[24, G0], [33, 16], [42, G0]], '#060807'); p.line(33, 16, 26, G0, '#3f5747'); p.rect(30, 3, 6, 2, '#2a2620');
    p.rect(40, 18, 8, 6, '#3a2a24'); p.rect(41, 19, 6, 4, '#5a4a3a'); p.line(20, 22, 26, 14, '#5a5448'); });
  P.line = mkSprite(64, 46, 32, 45, p => { const G0 = 45; p.rect(2, 4, 2, G0 - 4, '#2a2018'); p.rect(60, 8, 2, G0 - 8, '#2a2018'); p.rect(1, 4, 4, 1, '#3a2c20');
    for (let i = 0; i < 57; i++) p.set(3 + i, 6 + Math.round(Math.sin(i / 57 * Math.PI) * 5 + i * .05), '#4a4038');
    const cloth = [[8, 9, 10, '#3a3a46', 'shirt'], [21, 11, 8, '#5a3a2c', 'towel'], [32, 11, 9, '#2a3a2e', 'pants'], [44, 10, 9, '#6a6458', 'shirt']];
    for (const [cx2, w2, h2, c, kind] of cloth) { const top = 6 + Math.round(Math.sin((cx2 + w2 / 2 - 3) / 57 * Math.PI) * 5) + 1, base = cRGB(c);
      p.fill(cx2, top, w2, h2, (i, j, X, Y) => { if (kind === 'shirt' && j > 3 && (i < 2 || i > w2 - 3)) return null; if (kind === 'pants' && j > 4 && i > w2 / 2 - 1 && i < w2 / 2 + 1) return null; if (j === h2 - 1 && chash(X, 0, 3) > .6) return null;
        const v = .55 + Math.sin(i * 1.3) * .12 - j / h2 * .2 + (chash(X, Y, 5) - .5) * .1, k2 = clamp(v, .2, 1); return '#' + base.map(q => Math.min(255, Math.round(q * k2 * 1.2)).toString(16).padStart(2, '0')).join(''); });
      p.set(cx2 + 1, top - 1, '#8a8070'); p.set(cx2 + w2 - 2, top - 1, '#8a8070'); }
    for (let k = 0; k < 2; k++) p.fill(8 + k * 22, G0 - 5, 20, 5, (i, j, X, Y) => { const e = Math.abs(j - 2) / 2.6; return e > 1 ? null : cramp(k ? RAMP.tarp : RAMP.red, .55 - e * .3 + (i % 5 === 0 ? -.12 : 0) + (chash(X, Y, k) - .5) * .1, X, Y); }); });
  P.dog = mkSprite(22, 10, 11, 9, p => { const G0 = 9, F = ['#120d0a', '#1c1510', '#271d16', '#33271d', '#403124', '#4e3c2c'];
    p.fill(1, 2, 18, 7, (i, j, X, Y) => { const e = Math.hypot((i - 9) / 9, (j - 4) / 3.6); return e > 1 ? null : cramp(F, .62 - e * .35 - j * .04 + (chash(X, Y, 2) - .5) * .14, X, Y); });
    p.fill(14, 3, 7, 5, (i, j, X, Y) => { const e = Math.hypot((i - 3) / 3.5, (j - 2.5) / 2.6); return e > 1 ? null : cramp(F, .6 - e * .3, X, Y); }); p.set(19, 4, '#0a0706'); p.set(16, 2, '#33271d'); p.set(17, 2, '#271d16');
    p.line(2, 6, 7, 8, '#33271d'); p.set(18, 6, '#1a120e'); p.rect(4, 8, 12, 1, '#0c0907'); });
  P.gen = mkSprite(40, 26, 20, 25, p => { const G0 = 25; camSurf(p, 4, G0 - 16, 30, 14, RAMP.red, { lx: -1, seed: 4, rust: .4 }); p.rect(2, G0 - 2, 34, 2, '#1a1a1c'); for (let k = 0; k < 5; k++) p.rect(8 + k * 4, G0 - 13, 2, 8, '#1a0a08');
    p.rect(26, G0 - 20, 4, 4, '#3a3a3e'); p.rect(27, G0 - 22, 2, 2, '#5a5a5e'); });
  P.tank = mkSprite(30, 46, 15, 45, p => { const G0 = 45; p.fill(3, 4, 24, 30, (i, j, X, Y) => { const e = Math.abs(i - 11.5) / 12; return cramp(RAMP.steel, .65 - e * e * .55 + (j % 8 === 0 ? .15 : 0) + (chash(X, Y, 2) - .5) * .1, X, Y); }); p.rect(3, 4, 24, 2, '#6a727a');
    for (const o2 of [5, 22]) p.rect(o2, 34, 2, G0 - 34, '#2a2e32'); p.line(5, 40, 23, 34, '#2a2e32'); p.rect(14, 30, 3, 6, '#3a3e42'); p.rect(15, 36, 1, 3, '#2a3a4a'); });
  P.barrel = mkSprite(18, 22, 9, 21, p => { p.fill(1, 3, 16, 19, (i, j, X, Y) => { const e = Math.abs(i - 7.5) / 8, v = .6 - e * e * .55 + (j % 6 === 0 ? .14 : 0); return cfbm(X, Y, 4, 9) > .5 ? cramp(RAMP.rust, v, X, Y) : cramp(RAMP.steel, v - .1, X, Y); }); for (let k = 0; k < 4; k++) p.rect(3 + k * 3, 7, 2, 3, '#ff7a2a'); p.rect(1, 3, 16, 1, '#3a2014'); });
  return P;
}
// what you can use, where it stands, how wide its reach is
const CAMP_PROPS = [
  { id: 'codex', x: CPOS.codex, rw: 40, k: () => L('codex'), act: () => goPage('codex') },
  { id: 'board', x: CPOS.board, rw: 60, k: () => L('board'), act: () => openBoard() },
  { id: 'radio', x: CPOS.radio, rw: 70, k: () => L('wc_title'), act: () => openWorld('menu') },
  { id: 'market', x: CPOS.market, rw: 100, k: () => L('market'), act: () => openMarket() },
  { id: 'event', x: CPOS.event, rw: 100, k: () => L('ev_tag'), act: () => openEvent() },
  { id: 'gate', spr: 'truck', x: CPOS.truck, rw: 120, k: () => L('camp_go'), act: () => campDepart() },
];
const CAMP_DECOR = [['wall', CPOS.wall], ['line', CPOS.line], ['tent', CPOS.tent], ['dog', CPOS.dog], ['tank', CPOS.tank], ['gen', CPOS.gen], ['barrel', CPOS.barrel], ['fire', CAMP_FIRE]];
const GIRL_SPOTS = [620, 700, 582, 738, 544, 776, 814];
function campGirls() { return SURV_IDS.filter(girlMet).map((id, i) => ({ id: 'g:' + id, gid: id, x: GIRL_SPOTS[i % GIRL_SPOTS.length], rw: 16, k: () => svName(id), act: () => { GIRLS.sel = id; openGirls(); } })); }
const campObjs = () => CAMP_PROPS.concat(campGirls());

// ---------------- people ----------------
// the girls: their portraits shrunk to pixel figures, darkened for the night, an orange rim where the fire catches them
const CGIRL = {};
function campGirlArt(id, fromRight) {
  const key = id + (fromRight ? 'R' : 'L'); if (CGIRL[key]) return CGIRL[key]; const P = loadPortrait(id); if (!P || !P.ok) return null;
  const h = 64, w = Math.round(h * P.img.naturalWidth / P.img.naturalHeight), c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  if (fromRight) { x.translate(w, 0); x.scale(-1, 1); } x.drawImage(P.img, 0, 0, w, h); x.setTransform(1, 0, 0, 1, 0, 0);
  // DZMM's opaque-origin sandbox and file:// may display this image but forbid
  // reading its pixels. Cache a composited version in that case; retrying a
  // failing read every frame would freeze the whole menu after meeting a girl.
  let im;
  try { im = x.getImageData(0, 0, w, h); }
  catch (e) {
    if (e.name !== 'SecurityError') throw e;
    x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(9,9,12,.36)'; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'source-over';
    return CGIRL[key] = { cv: c, w, h, foot: h - 1 };
  }
  const d = im.data, op = (X, Y) => X >= 0 && Y >= 0 && X < w && Y < h && d[(Y * w + X) * 4 + 3] > 0;
  for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 110) { d[i + 3] = 0; continue; } d[i + 3] = 255; const q = v => Math.round(v / 12) * 12, l = d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11, f = .5; d[i] = q((d[i] * f + l * (1 - f)) * .66); d[i + 1] = q((d[i + 1] * f + l * (1 - f)) * .64); d[i + 2] = q((d[i + 2] * f + l * (1 - f)) * .7); }
  const rim = []; for (let Y = 0; Y < h; Y++) for (let X = 0; X < w; X++) if (op(X, Y) && !op(fromRight ? X - 1 : X + 1, Y)) rim.push(X, Y); // the side facing the fire
  for (let k = 0; k < rim.length; k += 2) { const i = (rim[k + 1] * w + rim[k]) * 4; d[i] = d[i] * .4 + 255 * .6; d[i + 1] = d[i + 1] * .4 + 150 * .6; d[i + 2] = d[i + 2] * .4 + 60 * .6; }
  const out = []; for (let Y = 0; Y < h; Y++) for (let X = 0; X < w; X++) if (!op(X, Y) && (op(X - 1, Y) || op(X + 1, Y) || op(X, Y - 1) || op(X, Y + 1))) out.push(X, Y);
  for (let k = 0; k < out.length; k += 2) { const i = (out[k + 1] * w + out[k]) * 4; d[i] = 8; d[i + 1] = 6; d[i + 2] = 8; d[i + 3] = 255; }
  let foot = h - 1; for (; foot > 0; foot--) { let any = false; for (let X = 0; X < w; X++) if (d[(foot * w + X) * 4 + 3]) { any = true; break; } if (any) break; }
  x.putImageData(im, 0, 0); return CGIRL[key] = { cv: c, w, h, foot };
}
// you: a hooded survivor: charcoal coat with folds, belt and pouches; goggles and a respirator inside the hood; a scarf with a
// trailing end; a pack with a bedroll and a cup, a rifle slung behind; trousers and boots below the coat; an 8-frame walk
const CHERO = {};
function campHero(f) {
  if (CHERO[f]) return CHERO[f];
  const p = new CPix(38, 66), G0 = 65, idle = f === 'idle', ph = idle ? 0 : f / 8 * Math.PI * 2, sw = idle ? 0 : Math.sin(ph), hx = 19;
  const CO = ['#0b0a09', '#12100e', '#1a1714', '#221e1a', '#2b2621', '#353029', '#403931', '#4d453a'], PA = ['#0d0c0b', '#151311', '#1d1a17', '#26221e'], SC = ['#1e0c0a', '#2e120e', '#401a14', '#52221a', '#622a20'];
  const legOf = s2 => { const q = ph + (s2 < 0 ? Math.PI : 0), a = idle ? s2 * .04 : Math.sin(q) * .42, bend = idle ? .02 : Math.max(0, Math.cos(q)) * .75; return { a, b: a - bend }; };
  const pose = (hip, L) => { const kx = hip[0] + Math.sin(L.a) * 10, ky = hip[1] + Math.cos(L.a) * 10; return { kx, ky, fx: kx + Math.sin(L.b) * 11, fy: ky + Math.cos(L.b) * 11 }; };
  const Lf = legOf(1), Lb = legOf(-1), drop = Math.max(pose([0, 0], Lf).fy, pose([0, 0], Lb).fy), hipY = Math.round(G0 - 3 - drop), hip = [hx, hipY];
  const drawLeg = (L, back) => { const q = pose(hip, L), r0 = back ? 0 : 1;
    for (let k = 0; k <= 12; k++) { const t2 = k / 12; p.disc(hip[0] + (q.kx - hip[0]) * t2, hip[1] + (q.ky - hip[1]) * t2, 2.1, PA[1 + r0]); }
    for (let k = 0; k <= 12; k++) { const t2 = k / 12; p.disc(q.kx + (q.fx - q.kx) * t2, q.ky + (q.fy - q.ky) * t2, 1.7, PA[1 + r0 + (k > 9 ? 1 : 0)]); }
    p.set(q.kx + 1, q.ky, PA[2 + r0]); const fx = Math.round(q.fx), fy = Math.round(q.fy);
    p.rect(fx - 2, fy - 2, 6, 3, back ? '#0a0807' : '#120e0b'); p.rect(fx + 3, fy - 1, 1, 2, back ? '#0a0807' : '#120e0b'); p.rect(fx - 2, fy + 1, 7, 1, back ? '#1a1612' : '#2a241d'); p.set(fx + 1, fy - 2, back ? '#16120f' : '#241d17'); };
  const arm = (dark) => { const a = (dark ? 1 : -1) * sw * .55, sx = hx + (dark ? -1 : 2), sy = hipY - 22, ex = sx + Math.sin(a) * 9, ey = sy + Math.cos(a) * 9, b2 = a + (dark ? .2 : .35), wx = ex + Math.sin(b2) * 8, wy = ey + Math.cos(b2) * 8;
    for (let k = 0; k <= 10; k++) { const t2 = k / 10; p.disc(sx + (ex - sx) * t2, sy + (ey - sy) * t2, 2, CO[dark ? 2 : 4]); p.set(sx + (ex - sx) * t2 + 1, sy + (ey - sy) * t2 - 1, CO[dark ? 3 : 6]); }
    for (let k = 0; k <= 10; k++) { const t2 = k / 10; p.disc(ex + (wx - ex) * t2, ey + (wy - ey) * t2, 1.6, CO[dark ? 2 : 4]); }
    p.rect(Math.round(ex) - 1, Math.round(ey), 3, 1, CO[dark ? 1 : 3]); p.disc(wx, wy + 1, 1.5, dark ? '#0c0a08' : '#17130f'); p.set(wx + 1, wy, dark ? '#1a1612' : '#2a241d'); };
  drawLeg(Lb, true); drawLeg(Lf, false);
  arm(true);
  // the rifle across the back, the pack, its bedroll and a cup
  p.line(hx - 15, hipY - 40, hx + 3, hipY - 6, '#0a0908'); p.line(hx - 14, hipY - 40, hx + 4, hipY - 6, '#211d19'); p.rect(hx - 16, hipY - 42, 2, 3, '#2a2a2c'); p.rect(hx - 1, hipY - 14, 3, 4, '#1a1410');
  camSurf(p, hx - 13, hipY - 27, 9, 20, ['#100d09', '#18140e', '#211b13', '#2b2319', '#362c20', '#433628'], { seed: 3, lx: 1, base: .55, grime: .3 });
  p.rect(hx - 13, hipY - 21, 9, 1, '#0d0a07'); p.rect(hx - 10, hipY - 20, 3, 2, '#5a4a30'); p.rect(hx - 12, hipY - 15, 7, 6, '#211b13'); p.rect(hx - 12, hipY - 15, 7, 1, '#362c20');
  p.fill(hx - 15, hipY - 32, 13, 6, (i, j, X, Y) => { const e = Math.abs(j - 2.5) / 3; return e > 1 ? null : cramp(['#14160f', '#1c1f15', '#25291c', '#2f3424', '#3a402d'], .65 - e * .45 + (i % 4 === 0 ? -.15 : 0), X, Y); });
  p.rect(hx - 15, hipY - 31, 1, 4, '#3a402d'); p.set(hx - 15, hipY - 29, '#14160f'); p.rect(hx - 15, hipY - 12, 3, 3, '#3a3e42'); p.set(hx - 15, hipY - 12, '#6a6e72');
  // the coat
  const flap = idle ? 0 : Math.sin(ph * 2) * 1.3, sway = idle ? 0 : Math.sin(ph) * .8;
  p.poly([[hx - 6, hipY - 25], [hx + 5, hipY - 25], [hx + 7, hipY - 15], [hx + 8, hipY - 2], [hx + 10 - flap, hipY + 9], [hx - 8 + flap + sway, hipY + 10], [hx - 7, hipY - 3], [hx - 7, hipY - 18]], null, (X, Y) => {
    let v = .5 + (X - hx) / 18 * .32 - (Y - (hipY - 25)) / 45 * .22 + (chash(X, Y, 7) - .5) * .1;
    if (X === hx - 2 + Math.round(sway * (Y - hipY) / 12) && Y > hipY - 18) v -= .22; if (X === hx + 3 && Y > hipY - 10) v -= .16; if (X === hx + 6 && Y > hipY - 14) v -= .3; return cramp(CO, v, X, Y); });
  for (let x = hx - 9; x < hx + 11; x++) { const by = hipY + 9 + (x > hx ? 0 : 1); if (chash(x, 2, 9) > .55) p.clear(x, by); if (chash(x, 3, 9) > .85) p.clear(x, by - 1); }
  for (let k = 0; k < 3; k++) p.set(hx + 6, hipY - 12 + k * 6, '#5a5040');
  p.rect(hx - 7, hipY - 4, 15, 2, '#0e0b09'); p.rect(hx + 2, hipY - 4, 2, 2, '#7a6a4a'); p.rect(hx + 3, hipY - 2, 4, 4, '#1c1915'); p.rect(hx + 3, hipY - 2, 4, 1, '#2e2a24'); p.rect(hx - 5, hipY - 2, 3, 3, '#1c1915');
  // scarf, hood, goggles, respirator
  const hy = hipY - 31;
  p.fill(hx - 5, hy + 4, 12, 4, (i, j, X, Y) => cramp(SC, .6 - j * .1 + (i % 3 === 1 ? .15 : 0) + (chash(X, Y, 4) - .5) * .1, X, Y));
  const tail = idle ? 0 : Math.sin(ph * 2 + 1) * 1.6; for (let k = 0; k <= 10; k++) { const t2 = k / 10; p.disc(hx - 5 - t2 * 6, hy + 6 + t2 * 6 + tail * t2, 1.2 - t2 * .4, SC[2 + (k < 4 ? 1 : 0)]); }
  p.poly([[hx - 5, hy + 5], [hx - 6, hy], [hx - 4, hy - 5], [hx + 2, hy - 7], [hx + 6, hy - 4], [hx + 7, hy + 1], [hx + 6, hy + 5]], null, (X, Y) => cramp(CO, .55 + (X - hx) / 14 * .25 - (Y - hy) / 12 * .2 + (chash(X, Y, 11) - .5) * .1 + (Y === hy - 6 ? .2 : 0), X, Y));
  p.set(hx - 6, hy - 3, CO[3]); p.set(hx - 7, hy - 2, CO[2]); // the hood's peak, falling back
  p.rect(hx + 2, hy - 3, 5, 7, '#0a0807'); p.rect(hx + 3, hy - 2, 4, 2, '#151210'); p.set(hx + 4, hy - 2, '#d0902e'); p.set(hx + 6, hy - 2, '#ffd070'); p.set(hx + 5, hy - 2, '#3a2a14');
  p.rect(hx + 3, hy, 4, 3, '#24262a'); p.set(hx + 4, hy + 1, '#3a3e42'); p.rect(hx + 7, hy + 1, 2, 2, '#3e4246'); p.set(hx + 8, hy + 1, '#6a7076');
  arm(false);
  p.outline('#050404'); return CHERO[f] = p.canvas();
}

// ---------------- art cache ----------------
function campArt() {
  if (CAMP.art && CAMP.art.W === W && CAMP.art.H === H) return CAMP.art;
  const g = campGround(), old = CAMP.art, fw = W + Math.ceil((CAMP_W - W) * .12) + 30, mfw = W + Math.ceil((CAMP_W - W) * .3) + 30, mw = W + Math.ceil((CAMP_W - W) * .6) + 30, far = campFar(fw, g);
  return CAMP.art = { W, H, g, sky: campSky(W, H, g), far: far.cv, fires: far.fires, midfar: campMidFar(mfw, g), mid: campMid(mw, g), ground: campGroundArt(CAMP_W, g, H), fore: campFore(Math.ceil(W + (CAMP_W - W) * 1.25) + 40, 34), props: old ? old.props : campProps() };
}

// ---------------- leaving: the truck ----------------
// campLaunch(fn): you climb in, the boom lifts, the engine starts, the truck drives out through the gate, the screen goes black,
// then fn() starts the run (a new one, or the saved one)
function campLaunch(fn) { MENU.page = 'main'; MENU.stack = []; CAMP.pop = null; CAMP.go = null; CAMP.dep = { t: 0, fn, done: false, sfx: 0 }; AU.init(); AU.play('door', .8); }
const campTruckDX = () => { const d = CAMP.dep; if (!d || d.t < 1.25) return 0; const q = d.t - 1.25; return Math.round(q * q * 95 + q * 10); };
const campBoom = () => { const d = CAMP.dep; return d ? clamp((d.t - .35) / .6, 0, 1) : 0; };
function updateCampDeparture(rdt) { const d = CAMP.dep; d.t += rdt;
  const want = clamp(Math.round(CPOS.truck - W * .32), 0, Math.max(0, CAMP_W - W)); CAMP.cam = Math.round(lerp(CAMP.cam, want, .08));
  if (d.sfx < 1 && d.t > .3) { d.sfx = 1; AU.play('gateBoom'); }
  if (d.real === undefined && d.t > .45) d.real = AU.hasSample('engStart') && AU.hasSample('engLoop');
  if (d.real) { // the recording: it cranks and catches, idles; the loop takes over as the jeep pulls away, its pitch climbing, then fades into the dark
    if (d.sfx < 2) { d.sfx = 2; d.st = AU.sample('engStart', { vol: 1.1, lp: 5200 }); }
    if (d.sfx < 3 && d.t > 1.15) { d.sfx = 3; d.lp = AU.sample('engLoop', { loop: true, vol: 0, rate: .52, lp: 1100 });
      if (d.lp) { const n = d.lp.c.currentTime, g = d.lp.g.gain, r = d.lp.s.playbackRate; g.setValueAtTime(0, n); g.linearRampToValueAtTime(.95, n + .5); g.setValueAtTime(.95, n + 1.25); g.exponentialRampToValueAtTime(.001, n + 2.2);
        r.setValueAtTime(.52, n); r.linearRampToValueAtTime(.62, n + .45); r.exponentialRampToValueAtTime(1.12, n + 2); d.lp.f.frequency.setValueAtTime(1100, n); d.lp.f.frequency.exponentialRampToValueAtTime(2600, n + 1.6); d.lp.s.stop(n + 2.3); }
      if (d.st) { const n = d.st.c.currentTime; d.st.g.gain.setValueAtTime(d.st.g.gain.value, n); d.st.g.gain.linearRampToValueAtTime(0, n + .6); d.st.s.stop(n + .7); } AU.play('gravel'); } }
  else { if (d.sfx < 2 && d.t > .45) { d.sfx = 2; AU.play('engineCrank'); } if (d.sfx < 3 && d.t > 1.0) { d.sfx = 3; AU.play('engineCatch'); } if (d.sfx < 4 && d.t > 1.3) { d.sfx = 4; AU.play('engineRev'); } }
  if (!d.real && d.t > 1.05 && d.t < 3.3) { d.rt = (d.rt || 0) - rdt; if (d.rt <= 0) { d.rt = .09; AU.play('engineRun', 1 + clamp((d.t - 1.25) * .45, 0, .9), clamp(1.15 - Math.max(0, d.t - 2.3) * .9, .2, 1)); } }
  if (d.t > .8 && Math.random() < rdt * 22) CAMP.smoke.push({ x: CPOS.truck - 55 + campTruckDX(), y: campGround() - 11, r: 1.5, life: 1.6, max: 1.6, vx: -rand(14, 26) });
  if (d.t > 3.25 && !d.done) { d.done = true; const fn = d.fn; CAMP.dep = null; CAMP.x = CPOS.truck - 40; fn(); } }
function campDepart() {
  const sv = loadSave(); if (!sv) { openDiffSelect(); return; }
  CAMP.pop = { sel: 0, t: 0, items: [{ l: () => L('cont'), sub: () => chapterTitle(sv.floor) + ' · ' + tr(DIFF_BY[sv.diff].nm), act: () => campLaunch(campResume) }, { l: () => L('start'), act: () => openDiffSelect() }, { l: () => L('back'), act: () => {} }] };
  AU.play('menuOk');
}
function campResume() { if (!loadSave()) return; AU.init(); AU.startDrone(); resumeRun(); Input.down = false; LAUNCH.inT = 0; AU.play('select'); }
function campPopRect() { const p = CAMP.pop, w = 190, h = 34 + p.items.length * 18; return { x: Math.round(W / 2 - w / 2), y: Math.round(H / 2 - h / 2 - 10), w, h }; }
function updateCampPop() {
  const p = CAMP.pop, r = campPopRect(), n = p.items.length; p.t += FRAME_DT;
  let hov = -1; p.items.forEach((it, i) => { const y = r.y + 30 + i * 18; if (Input.mx > r.x + 6 && Input.mx < r.x + r.w - 6 && Input.my > y - 3 && Input.my < y + 14) hov = i; });
  if (hov >= 0 && !TOUCH.on) p.sel = hov;
  if (pressed('KeyW') || pressed('ArrowUp')) { p.sel = (p.sel + n - 1) % n; AU.play('menu'); }
  if (pressed('KeyS') || pressed('ArrowDown')) { p.sel = (p.sel + 1) % n; AU.play('menu'); }
  const run = i => { const it = p.items[i]; CAMP.pop = null; AU.play('menuOk'); it.act(); };
  if (pressed('Escape')) { CAMP.pop = null; AU.play('menu', .8); return; }
  if (pressed('Enter') || pressed('Space') || pressed('KeyE')) { run(p.sel); return; }
  if (Input.clicked) { Input.clicked = false; if (hov >= 0) run(hov); else if (!inR(r, Input.mx, Input.my)) CAMP.pop = null; }
}

// ---------------- update ----------------
const GEAR = () => ({ x: 8, y: H - 24, w: 16, h: 16 });
function campBox(o) { const a = campArt(), g = a.g; if (o.gid) return { x: o.x - 12, y: g - 62, w: 24, h: 62 }; const s = a.props[o.spr || o.id]; return { x: o.x - s.ax, y: g - s.ay - 1, w: s.w, h: s.h }; }
function campHit(mx, my) { const cx = mx + CAMP.cam; let best = null;
  for (const o of campObjs()) { const b = campBox(o); if (cx > b.x && cx < b.x + b.w && my > b.y && my < b.y + b.h + 4) { const better = !best || (o.gid && !best.gid) || (!!o.gid === !!best.gid && Math.abs(cx - o.x) < Math.abs(cx - best.x)); if (better) best = o; } } // a girl in front of a prop wins
  return best; }
function campUse(o) { CAMP.go = null; CAMP.face = o.x >= CAMP.x ? 1 : -1; o.act(); }
function updateCamp(rdt) {
  CAMP.t += rdt; evTick(); const objs = campObjs(), g = campGround();
  if (CAMP.dep) { updateCampDeparture(rdt); campAmbient(rdt, g); return; }
  for (const id of SURV_IDS) if (girlMet(id)) loadPortrait(id);
  { const b = loginBox(); MENU.lgHov = NET.ready && inR(b, Input.mx, Input.my); if (MENU.lgHov && Input.clicked) { Input.clicked = false; if (!NET.user) netLogin(); else netToast('lg_plat', '#8c8c93'); return; } }
  if (CAMP.pop) { updateCampPop(); return; }
  if (pressed('Escape') || (Input.clicked && inR(GEAR(), Input.mx, Input.my))) { Input.clicked = false; goPage('settings'); return; }
  const L1 = Input.keys.KeyA || Input.keys.ArrowLeft, R1 = Input.keys.KeyD || Input.keys.ArrowRight; let dir = 0;
  if (L1 || R1) { CAMP.go = null; dir = (R1 ? 1 : 0) - (L1 ? 1 : 0); }
  CAMP.hov = TOUCH.on ? null : campHit(Input.mx, Input.my);
  if (Input.clicked) { Input.clicked = false; const o = campHit(Input.mx, Input.my); CAMP.go = o ? { x: o.x, o } : { x: Input.mx + CAMP.cam }; if (o) AU.play('menu', 1.1); }
  else if (TOUCH.on && Input.down && CAMP.go && !CAMP.go.o) CAMP.go.x = Input.mx + CAMP.cam;
  if (CAMP.go) { const d = CAMP.go.x - CAMP.x, reach = CAMP.go.o ? Math.max(8, CAMP.go.o.rw / 2 - 4) : 2;
    if (Math.abs(d) <= reach) { const o = CAMP.go.o; CAMP.go = null; if (o) { campUse(o); return; } } else dir = Math.sign(d); }
  CAMP.moving = dir !== 0; if (dir) { CAMP.face = dir; CAMP.x = clamp(CAMP.x + dir * CAMP_SPD * rdt, 14, CAMP_W - 14); CAMP.walkT += rdt; }
  let near = null; for (const o of objs) { const d = Math.abs(o.x - CAMP.x); if (d < o.rw / 2 + 4 && (!near || d < Math.abs(near.x - CAMP.x))) near = o; }
  if (near && (!CAMP.near || CAMP.near.id !== near.id)) AU.play('ui', 1.25, .5); CAMP.near = near;
  if (near && (pressed('KeyE') || pressed('Enter') || pressed('Space'))) { campUse(near); return; }
  CAMP.cam = clamp(Math.round(CAMP.x - W / 2), 0, Math.max(0, CAMP_W - W)); campAmbient(rdt, g);
}
// embers, sparks from the barrel, smoke from the fire; ash everywhere; now and then something explodes far away
function campAmbient(rdt, g) {
  const sp = (x, y, n) => { if (Math.random() < rdt * n) CAMP.sparks.push({ x: x + rand(-5, 5), y, vx: rand(-8, 8), vy: rand(-34, -14), life: rand(.8, 2), c: choice([C.orange, C.gold, '#ff5a2a']) }); };
  sp(CAMP_FIRE, g - 14, 18); sp(CPOS.barrel, g - 20, 5);
  for (let i = CAMP.sparks.length - 1; i >= 0; i--) { const s = CAMP.sparks[i]; s.life -= rdt; s.x += (s.vx + Math.sin(CAMP.t * 3 + i) * 7) * rdt; s.y += s.vy * rdt; if (s.life <= 0) CAMP.sparks.splice(i, 1); }
  if (Math.random() < rdt * 4) CAMP.smoke.push({ x: CAMP_FIRE + rand(-3, 3), y: g - 22, r: 2, life: 4, max: 4, vx: rand(2, 6) });
  for (let i = CAMP.smoke.length - 1; i >= 0; i--) { const s = CAMP.smoke[i]; s.life -= rdt; s.y -= 9 * rdt; s.x += s.vx * rdt; s.r += 2.2 * rdt; if (s.life <= 0) CAMP.smoke.splice(i, 1); }
  while (CAMP.ash.length < 130) CAMP.ash.push({ x: Math.random() * (W + 40) - 20, y: Math.random() * H, z: .4 + Math.random() * 1.1, ph: Math.random() * 6 });
  for (const a of CAMP.ash) { a.y += 9 * a.z * rdt; a.x += (Math.sin(CAMP.t * .7 + a.ph) * 4 - 5) * a.z * rdt; if (a.y > H) { a.y = -2; a.x = Math.random() * (W + 40) - 20; } if (a.x < -20) a.x += W + 40; }
  CAMP.boom = Math.max(0, CAMP.boom - rdt * 1.4); CAMP.nextBoom -= rdt; if (CAMP.nextBoom <= 0) { CAMP.nextBoom = 10 + Math.random() * 14; CAMP.boom = 1; CAMP.boomX = 40 + Math.random() * (W - 80); }
}

// ---------------- drawing ----------------
function campGlow(x, y, R, rgb, a, sy = 1) { if (a <= 0 || R <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(1, sy); const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, R); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(.4, `rgba(${rgb},${a * .4})`); gr.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = gr; ctx.fillRect(-R, -R, R * 2, R * 2); ctx.restore(); }
function campFlames(x, g, t, size, n) {
  for (let i = -n; i <= n; i++) { const e = Math.abs(i) / (n + 1), hmax = size * Math.pow(1 - e, .7), hh = Math.round(hmax * (.62 + .38 * cnoise(i * 3 + 50, t * 13, 2.4, 7)) + (cnoise(i + 9, t * 7, 3, 2) - .5) * 3);
    for (let y = 0; y < hh; y++) { const k = y / Math.max(1, hh), core = Math.abs(i) < n * .35; let c = k < .3 && core ? '#fff1c0' : k < .55 ? '#ffc04a' : k < .8 ? '#ff7a26' : '#d23a16';
      if (k > .85 && ((x + i + y + ((t * 30) | 0)) & 1)) c = '#7a1e10'; rect(x + i, g - y, 1, 1, c); } }
  for (let k = 0; k < 3; k++) { const q = (t * 2.2 + k * .37) % 1, fx = x + Math.round(Math.sin(t * 5 + k * 2) * n * .5), fy = g - size * (.7 + q * .8); ctx.globalAlpha = 1 - q; rect(fx, fy, 1, 2, q < .5 ? '#ffc04a' : '#ff7a26'); } ctx.globalAlpha = 1; }
const campFocus = o => (CAMP.near && CAMP.near.id === o.id) || (CAMP.hov && CAMP.hov.id === o.id);
function drawCampWorld(t) {
  const a = campArt(), g = a.g, cam = CAMP.cam, P = a.props, flick = .85 + Math.sin(t * 9) * .06 + Math.sin(t * 23) * .04;
  ctx.drawImage(a.sky, 0, 0);
  if (CAMP.boom > 0) { ctx.globalCompositeOperation = 'lighter'; campGlow(CAMP.boomX, g - 20, 140, '255,120,40', CAMP.boom * .35, .5); ctx.globalCompositeOperation = 'source-over'; }
  ctx.drawImage(a.far, -Math.round(cam * .12), 0);
  for (const [fx, fy] of a.fires) { const x0 = fx - cam * .12; if (x0 < -30 || x0 > W + 30) continue; for (let k = 0; k < 7; k++) { const q = (t * .05 + k / 7 + fx * .013) % 1; ctx.globalAlpha = (1 - q) * .35; disc(x0 + q * 26 + Math.sin(t * .4 + k) * 3, fy - q * 70, 2 + q * 9, '#0e0a0b'); } } ctx.globalAlpha = 1; // smoke from burning towers
  ctx.drawImage(a.midfar, -Math.round(cam * .3), 0);
  ctx.drawImage(a.mid, -Math.round(cam * .6), 0);
  ctx.drawImage(a.ground.cv, cam, 0, W, a.ground.cv.height, 0, a.ground.top, W, a.ground.cv.height);
  const at = (s, x) => Math.round(x - cam - s.ax), on = (s, x) => x - cam - s.ax < W + 10 && x - cam - s.ax + s.w > -10;
  for (const [id, x] of CAMP_DECOR) { const s = P[id]; if (on(s, x)) ctx.drawImage(s.cv, at(s, x), g - s.ay); }
  for (const o of CAMP_PROPS) { const s = P[o.spr || o.id], dx = o.id === 'gate' ? campTruckDX() : 0, sh = o.id === 'gate' && CAMP.dep && CAMP.dep.t > .8 ? Math.round(Math.sin(t * 60) * .6) : 0; if (!on(s, o.x + dx)) continue;
    if (campFocus(o) && !CAMP.dep) { ctx.globalAlpha = .55 + Math.sin(t * 5) * .25; ctx.drawImage(s.ol, at(s, o.x) - 1, g - s.ay - 1); ctx.globalAlpha = 1; } ctx.drawImage(s.cv, at(s, o.x) + dx, g - s.ay + sh); }
  campLive(t, g, cam);
  for (const o of CAMP_BACKDROP ? [] : campGirls()) { const x = o.x - cam; if (x < -30 || x > W + 30) continue; const fr = o.x > CAMP_FIRE, s = campGirlArt(o.gid, fr);
    if (!s) { drawChar(svSprite(o.gid, 0), x, g, fr, false, { sx: 2.4, sy: 2.4, shw: .8 }); continue; }
    const br = 1 + Math.max(0, Math.sin(t * 2 + o.x)) * .012; shadow(x, g, 18, .5);
    ctx.save(); ctx.translate(Math.round(x), g + (s.h - 1 - s.foot)); ctx.scale(1, br);
    if (campFocus(o)) { ctx.globalAlpha = .5 + Math.sin(t * 5) * .2; ctx.filter = 'brightness(2.2)'; ctx.drawImage(s.cv, -Math.round(s.w / 2) - 1, -s.h); ctx.drawImage(s.cv, -Math.round(s.w / 2) + 1, -s.h); ctx.filter = 'none'; ctx.globalAlpha = 1; }
    ctx.drawImage(s.cv, -Math.round(s.w / 2), -s.h); ctx.restore(); }
  if (!CAMP.dep && !CAMP_BACKDROP) { const fr = CAMP.moving ? ((CAMP.walkT * 9) | 0) % 8 : 'idle', hs = campHero(fr), br = CAMP.moving ? 1 : 1 + Math.max(0, Math.sin(t * 2.4)) * .02, x = Math.round(CAMP.x - cam);
    shadow(x, g, 16, .55); ctx.save(); ctx.translate(x, g + 1); ctx.scale(CAMP.face < 0 ? -1 : 1, br); ctx.drawImage(hs, -19, -66); ctx.restore(); }
  for (const s of CAMP.sparks) { ctx.globalAlpha = clamp(s.life, 0, 1); rect(s.x - cam, s.y, 1, 1, s.c); } ctx.globalAlpha = 1;
  for (const s of CAMP.smoke) { ctx.globalAlpha = (s.life / s.max) * .22; disc(s.x - cam, s.y, s.r, '#1a1416'); } ctx.globalAlpha = 1;
  // light: the fire, the barrel, the lamps, the truck's headlights, the watchtower's searchlight
  ctx.globalCompositeOperation = 'lighter';
  campGlow(CAMP_FIRE - cam, g - 12, 130 * flick, '255,110,40', .32 * flick); campGlow(CAMP_FIRE - cam, g - 1, 140 * flick, '255,90,30', .2 * flick, .18);
  campGlow(CPOS.barrel - cam, g - 22, 46 * flick, '255,110,40', .24);
  for (const [px, py, pr] of a.ground.pud) { const d = Math.abs(px - CAMP_FIRE); if (d < 260) campGlow(px - cam, py + 1, pr + 4, '255,120,50', .3 * (1 - d / 260) * flick, .25); }
  campGlow(CPOS.codex - cam - 3, g - 66, 22, '255,220,150', .22); if (Math.sin(t * 13) > -.95) campGlow(CPOS.board - cam, g - 63, 26, '255,230,170', .22);
  campGlow(CPOS.radio - cam - 18, g - 47, 18, '255,150,60', .18 * (.6 + Math.sin(t * 17) * .1));
  campGlow(CPOS.market - cam - 46, g - 62, 26, '120,255,170', .2); campGlow(CPOS.truck + 37 - cam + campTruckDX(), g - 25, 22, '255,240,190', .25);
  { ctx.save(); const hx = CPOS.truck + 39 - cam + campTruckDX(), hy = g - 25, gr = ctx.createLinearGradient(hx, hy, hx + 90, hy); gr.addColorStop(0, 'rgba(255,240,190,.2)'); gr.addColorStop(1, 'rgba(255,240,190,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(hx, hy - 2); ctx.lineTo(hx + 90, hy - 12); ctx.lineTo(hx + 90, hy + 24); ctx.lineTo(hx, hy + 3); ctx.fill(); ctx.restore(); }
  { const sx = CPOS.wall + 63 - cam, sy = g - 114, an = -Math.PI / 2 - .9 + Math.sin(t * .35) * .85, len = 260; ctx.save(); const gr = ctx.createLinearGradient(sx, sy, sx + Math.cos(an) * len, sy + Math.sin(an) * len); gr.addColorStop(0, 'rgba(230,235,255,.16)'); gr.addColorStop(1, 'rgba(230,235,255,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(an - .07) * len, sy + Math.sin(an - .07) * len); ctx.lineTo(sx + Math.cos(an + .07) * len, sy + Math.sin(an + .07) * len); ctx.fill(); ctx.restore(); }
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(a.fore, -Math.round(cam * 1.25), H - 34);
  for (const s of CAMP.ash) { ctx.globalAlpha = .35 + s.z * .3; rect(s.x, s.y, s.z > 1.2 ? 2 : 1, 1, s.z > 1 ? '#6a6060' : '#4a4444'); } ctx.globalAlpha = 1;
  if (!CAMP.vig || CAMP.vig.width !== W || CAMP.vig.height !== H) { const v = document.createElement('canvas'); v.width = W; v.height = H; const x = v.getContext('2d'), gr = x.createRadialGradient(W / 2, H * .62, H * .3, W / 2, H * .62, W * .72); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.55)'); x.fillStyle = gr; x.fillRect(0, 0, W, H); CAMP.vig = v; }
  ctx.drawImage(CAMP.vig, 0, 0);
}
// what moves on the props: the fires, the radio's needle and lights, the trader, the lantern, the flag and the gauge
function campLive(t, g, cam) {
  { const px = CPOS.wall + 2 - cam, py = g - 17, an = -campBoom() * Math.PI / 2 * .96; // the boom: a post and a striped arm that lifts
    rect(px - 2, py - 1, 4, 18, '#2a2a2e'); rect(px - 2, py - 1, 4, 1, '#4a4a50'); rect(px - 3, g - 2, 6, 2, '#1a1a1e');
    for (let k = 0; k < 40; k++) { const qx = px + Math.cos(an) * k, qy = py + Math.sin(an) * k, c = Math.floor(k / 5) % 2 ? '#c8c0a8' : '#8a1c18'; rect(qx, qy, 1, 2, c); }
    rect(px - 1, py, 2, 2, '#5a5a60'); if (((t * 2) | 0) % 2) rect(px + Math.cos(an) * 39, py + Math.sin(an) * 39 - 1, 1, 1, C.red); }
  const fx = CAMP_FIRE - cam; campFlames(fx, g - 4, t, 27, 11); for (let k = 0; k < 6; k++) if (Math.sin(t * 7 + k * 2.3) > .2) rect(fx - 10 + k * 4, g - 3 - (k % 2), 1, 1, '#ff6a20');
  { const st = (t * .6) % 1; ctx.globalAlpha = (1 - st) * .4; rect(fx - 1 + Math.round(Math.sin(t * 2) * 2), g - 26 - st * 10, 2, 2, '#8a8486'); ctx.globalAlpha = 1; } // steam from the pot
  campFlames(CPOS.barrel - cam, g - 20, t + 3, 8, 4);
  { const rx = CPOS.radio - cam - 36, ry = g - 55, ang = -2.4 + (Math.sin(t * 6) * .3 + Math.sin(t * 13.7) * .2 + .5) * 1.6; ctx.save(); ctx.strokeStyle = '#1a1a10'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(rx + 18.5, ry + 11); ctx.lineTo(rx + 18.5 + Math.cos(ang) * 6, ry + 11 + Math.sin(ang) * 6); ctx.stroke(); ctx.restore();
    rect(rx + 5, ry + 16, 1, 1, ((t * 3) | 0) % 2 ? C.red : '#3a1010'); rect(rx + 9, ry + 16, 1, 1, WC.msgs.length ? C.cyan : '#103030'); rect(rx + 4, ry - 7, 2, 1, ((t * 5) | 0) % 3 ? '#4aff8a' : '#1a5a3a'); rect(rx + 7, ry - 7, 4, 1, '#3aaa6a');
    const mx = CPOS.radio - cam - 46 + 92; rect(mx, g - 123, 1, 1, ((t * 1.2) | 0) % 2 ? '#ff3d5a' : '#3a0a10');
    if (WC.msgs.length) for (let k = 0; k < 2; k++) { const q = (t * .7 + k * .5) % 1; ctx.globalAlpha = (1 - q) * .7; pxCircle(mx, g - 121, 3 + q * 10, C.cyan); } ctx.globalAlpha = 1; }
  { const m = CPOS.market - cam - 72, blink = (t % 4.3) < .14, bob = Math.round(Math.sin(t * 1.3)), x0 = m + 52, y0 = g - 46 + bob; // the trader behind the counter
    rect(x0, y0, 13, 15, '#141016'); rect(x0 + 1, y0 - 4, 11, 5, '#1a141c'); rect(x0 + 2, y0 - 6, 9, 3, '#1e1820'); rect(x0 + 3, y0 - 1, 7, 6, '#08070a'); rect(x0 + 4, y0 + 3, 5, 2, '#2a2e2a'); rect(x0 + 5, y0 + 4, 1, 1, '#5a6a6a'); rect(x0 + 7, y0 + 4, 1, 1, '#5a6a6a');
    if (!blink) { rect(x0 + 4, y0 + 1, 2, 1, C.gold); rect(x0 + 7, y0 + 1, 2, 1, C.gold); } rect(x0 - 2, y0 + 8, 4, 2, '#141016'); rect(x0 + 11, y0 + 8, 4, 2, '#141016');
    const by = g - 99, lx = m + 26 + Math.sin(t * 1.3) * 1.5; ctx.strokeStyle = '#2a2a2e'; ctx.beginPath(); ctx.moveTo(m + 26.5, by + 21); ctx.lineTo(lx + .5, by + 28); ctx.stroke(); rect(lx - 2, by + 28, 5, 6, '#2a3a30'); rect(lx - 1, by + 29, 3, 4, ((t * 8) | 0) % 9 ? '#9affc0' : '#5aaa80'); }
  { const ex = CPOS.event - cam - 66, ey = g - 103, cy = g - 46, lvl = Math.round(33 * clamp(evTotal() / EVC.goal, 0, 1)); // the gauge and the flag
    if (lvl > 0) { rect(ex + 71, cy + 41 - lvl, 8, lvl, evDone() ? '#3ad07a' : '#d0a030'); rect(ex + 71, cy + 41 - lvl, 8, 1, '#fff0b0'); rect(ex + 72, cy + 41 - lvl, 1, lvl, '#fff6d040'.slice(0, 7)); for (let k = 0; k < 3; k++) { const q = (t * .8 + k * .33) % 1; rect(ex + 72 + Math.round(chash(k, 0, 3) * 6), cy + 41 - q * lvl, 1, 1, '#fff6d0'); } }
    for (let i = 0; i < 22; i++) { const w2 = Math.sin(t * 4 - i * .35) * (i / 22) * 2.5; for (let j = 0; j < 12 - Math.floor(i / 4); j++) { if (i > 14 && chash(i, j, 3) > .7) continue; rect(ex + 126 + i, ey + 5 + j + w2, 1, 1, j === 0 ? '#e8d890' : evDone() ? '#2a8a4a' : (j + i) % 7 === 0 ? '#5a1a14' : '#8a2a1e'); } }
    if (((t * 1.5) | 0) % 2) rect(ex + 124, ey + 1, 2, 1, C.red); }
}

// ---------------- text and buttons on top (UI pass) ----------------
function drawCampUI(t) {
  const a = campArt(), g = a.g, cam = CAMP.cam, sx = x => x - cam, k = easeOut(clamp(MENU.t / .6, 0, 1));
  ctx.globalAlpha = k;
  { const word = L('gameTitle'), gl = Math.sin(t * 13) > .96; if (gl) { textG(word, 11, 10, C.red, 3); textG(word, 13, 10, C.cyan, 3); } textG(word, 13, 12, '#000', 3); textG(word, 12, 10, '#f0efe8', 3); text(L('gameSub'), 13, 34, '#6c6c74'); }
  drawLoginChip(t);
  { const x = sx(CPOS.radio + 46), list = WC.msgs.slice(-5); if (x > -90 && x < W + 90 && wcOn()) { const m = list.length ? list[((t / 4) | 0) % list.length] : null, s = m ? m.name + '：' + m.text : (WC.busy || WC.nextPoll === 0 ? L('bd_loading') : L('wc_empty'));
      const tw = Math.min(160, textW(s) + 10), bx = Math.round(clamp(x - tw - 4, 4, W - tw - 4)), by = g - 136; rect(bx, by, tw, 13, 'rgba(9,9,10,.85)'); box(bx, by, tw, 13, null, '#2b4a4a'); rect(bx + tw - 4, by + 13, 3, 2, '#2b4a4a');
      text(fitText(s, tw - 8), bx + 4, by + (isCJK(s) ? 2 : 4), m && m.mine ? C.gold : '#c8e8e8'); } }
  { const x = sx(CPOS.event); if (x > -90 && x < W + 90) { const pct = Math.floor(clamp(evTotal() / EVC.goal, 0, 1) * 100), s = L('ev_tag') + '  ' + (EV.d ? pct + '%' : '...'), s2 = evOpen() ? evLeft() : L('ev_over');
      text(s, Math.round(x - 8), g - 128, evDone() ? C.green : C.gold, 1, 'center'); text(s2, Math.round(x - 8), g - 118, evOpen() ? C.red : '#8c8c93', 1, 'center'); } }
  const show = (o, prompt) => { const b = campBox(o), top = b.y - 6, x = Math.round(sx(o.x)), lbl = o.k(), s = prompt ? (TOUCH.on ? '' : '[E] ') + lbl : lbl, w2 = textW(s) + 10;
    const c = o.gid ? SURV[o.gid].c : C.gold, bx = Math.round(clamp(x - w2 / 2, 2, W - w2 - 2)); rect(bx, top - 12, w2, 12, 'rgba(9,9,10,.9)'); box(bx, top - 12, w2, 12, null, prompt ? c : '#4a4a51'); text(s, bx + 5, top - 12 + (isCJK(s) ? 1 : 3), prompt ? '#f0efe8' : '#c8c8c0');
    if (o.gid && prompt) { const d = gpLoad().girls[o.gid]; drawHeart(bx + w2 + 3, top - 9, TIER_C()[affTier(d ? d.aff : 0)]); }
    if (o.id === 'gate' && prompt) { const sv = loadSave(); if (sv) text(L('cont') + ' · ' + chapterTitle(sv.floor), x, top + 2, '#8c8c93', 1, 'center'); } };
  if (CAMP.hov && !CAMP.dep && (!CAMP.near || CAMP.hov.id !== CAMP.near.id)) show(CAMP.hov, false);
  if (CAMP.near && !CAMP.dep) show(CAMP.near, true);
  { const b = GEAR(), hv = !TOUCH.on && inR(b, Input.mx, Input.my); box(b.x, b.y, b.w, b.h, hv ? '#1c1c22' : 'rgba(9,9,10,.7)', hv ? '#f0efe8' : '#4a4a51'); campGearIcon(b.x + 8, b.y + 8, hv ? '#f0efe8' : '#8c8c93'); }
  text(TOUCH.on ? L('camp_hintT') : L('camp_hint'), 30, H - 19, '#6c6c74');
  text('V2.3', W - 8, H - 10, '#3b3b42', 1, 'right');
  if (!ONDZ()) text(L('st_local'), 30, H - 9 - (isCJK(L('st_local')) ? 1 : 0), '#c8a640', 1);
  ctx.globalAlpha = 1;
  if (CAMP.pop) drawCampPop(t);
  if (CAMP.dep) { const q = clamp((CAMP.dep.t - 2.3) / .8, 0, 1); if (q > 0) { ctx.globalAlpha = q; rect(0, 0, W, H, '#000'); ctx.globalAlpha = 1; } }
}
function campGearIcon(cx, cy, c) { for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; rect(cx + Math.round(Math.cos(a) * 5) - 1, cy + Math.round(Math.sin(a) * 5) - 1, 2, 2, c); } pxCircle(cx, cy, 3, c); rect(cx, cy, 1, 1, c); }
function drawCampPop(t) {
  const p = CAMP.pop, r = campPopRect(), k = easeOut(clamp(p.t / .18, 0, 1)); ctx.globalAlpha = k; winBackdrop(.5); winFrame(r.x, r.y, r.w, r.h, C.gold, L('camp_go'), { close: false });
  p.items.forEach((it, i) => { const y = r.y + 30 + i * 18, on = i === p.sel; if (on) { rect(r.x + 4, y - 3, r.w - 8, 16, '#18181d'); rect(r.x + 4, y - 3, 2, 16, C.gold); }
    text(it.l(), r.x + 12, y, on ? '#f0efe8' : '#8c8c93'); if (it.sub) text(fitText(it.sub(), r.w - 24 - textW(it.l())), r.x + r.w - 8, y, on ? C.gold : '#55555c', 1, 'right'); });
  ctx.globalAlpha = 1;
}
