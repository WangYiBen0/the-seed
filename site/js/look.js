// ===== TheSeed look: the lettermark, film grain, the difficulty medallions, the title screen =====
// The art direction is restrained and heavy: a gray, dead world; bone-white type; one ember-orange accent used sparingly; thin rules.
'use strict';
const TH = { bone: '#e6dfd1', bone2: '#bdb5a6', dim: '#857f74', faint: '#4a4640', line: '#24221f', line2: '#36322d', ember: '#d0702e', emberHi: '#ffa45a', blood: '#a3212a',
  // the menu pages' accents: the game's colours, muted
  gold: '#c9a35a', pink: '#c07a8a', cyan: '#7fa3a8', red: '#b8443a', green: '#8fa77e', violet: '#8a76a8', orange: '#c8703a' };
const thA = (hex, a) => { const n = parseInt(hex.slice(1, 7), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };

// ---------------- the lettermark: THE SEED ----------------
// condensed, chamfered capitals cut from plate, then worn down: eroded edges, pits, cracks, rust and grime running down, drips
// under the letters; a crack in the second E still glows with a last ember (the seed). Built once at device resolution.
const LOGO = { cv: null, us: 0, ember: [0, 0], w: 0, h: 0, sparks: [], flick: 0 };
const LOGO_LAY = { pad: 8, theH: 11, seedY: 17, seedH: 48, s: 13, gap: 5, widths: { S: 31, E: 27, D: 33 } };
function logoGlyph(g, ch, x, y, w, h, s) {
  const c = Math.round(s * .6), P = pts => { g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(x + a, y + b) : g.moveTo(x + a, y + b)); g.closePath(); g.fill(); };
  const cut = pts => { g.save(); g.globalCompositeOperation = 'destination-out'; P(pts); g.restore(); }, R = (a, b, cw, chh) => g.fillRect(x + a, y + b, cw, chh);
  g.fillStyle = '#fff';
  if (ch === 'T') { P([[0, 0], [w, 0], [w - s * .35, s], [s * .35, s]]); R((w - s) / 2, 0, s, h); }
  else if (ch === 'H') { R(0, 0, s, h); R(w - s, 0, s, h); R(s, (h - s * .85) / 2, w - 2 * s, s * .85); }
  else if (ch === 'E') { R(0, 0, s, h); P([[0, 0], [w, 0], [w - s * .45, s], [0, s]]); const m = s * .82; P([[0, (h - m) / 2], [w * .82, (h - m) / 2], [w * .82 - s * .35, (h + m) / 2], [0, (h + m) / 2]]); P([[0, h - s], [w - s * .45, h - s], [w, h], [0, h]]); cut([[0, 0], [c, 0], [0, c]]); cut([[0, h], [c, h], [0, h - c]]); }
  else if (ch === 'S') P([[c, 0], [w, 0], [w - s * .45, s], [s, s], [s, (h - s) / 2], [w - c, (h - s) / 2], [w, (h - s) / 2 + c], [w, h - c], [w - c, h], [0, h], [s * .45, h - s], [w - s, h - s], [w - s, (h + s) / 2], [c, (h + s) / 2], [0, (h + s) / 2 - c], [0, c]]);
  else if (ch === 'D') { const k = c * 1.6; P([[0, 0], [w - k, 0], [w, k], [w, h - k], [w - k, h], [0, h]]); cut([[s, s], [w - k - s * .3, s], [w - s, k + s * .3], [w - s, h - k - s * .3], [w - k - s * .3, h - s], [s, h - s]]); }
}
function buildLogo() {
  const k = US, LY = LOGO_LAY, ws = LY.widths, seedW = ws.S + ws.E * 2 + ws.D + LY.gap * 3, LW = seedW + LY.pad * 2, LH = LY.seedY + LY.seedH + 22 + LY.pad * 2;
  const W2 = Math.round(LW * k), H2 = Math.round(LH * k), m = document.createElement('canvas'); m.width = W2; m.height = H2; const g = m.getContext('2d'); g.scale(k, k);
  const ox = LY.pad, oy = LY.pad; let x = ox; const boxes = [];
  for (const ch of 'SEED') { const w = ws[ch]; logoGlyph(g, ch, x, oy + LY.seedY, w, LY.seedH, LY.s); boxes.push([x, w]); x += w + LY.gap; }
  x = ox + 1; for (const ch of 'THE') { logoGlyph(g, ch, x, oy, ch === 'E' ? 8 : 9, LY.theH, 3); x += (ch === 'E' ? 8 : 9) + 4; }
  const im = g.getImageData(0, 0, W2, H2), d = im.data, A = (X, Y) => X < 0 || Y < 0 || X >= W2 || Y >= H2 ? 0 : d[(Y * W2 + X) * 4 + 3];
  // wear: eroded edges and pits
  const keep = new Uint8Array(W2 * H2);
  for (let Y = 0; Y < H2; Y++) for (let X = 0; X < W2; X++) { if (!A(X, Y)) continue; let edge = 0; for (const [dx, dy] of [[k, 0], [-k, 0], [0, k], [0, -k], [k, k], [-k, -k]]) if (!A(X + dx, Y + dy)) edge++;
    const n = cfbm(X * .45, Y * .45, 4, 17), h = chash(X, Y, 23), small = Y / k < oy + LY.seedY - 2; let on = true; if (!small && edge && (n > .64 || h > .94)) on = false; if (!small && !edge && cfbm(X * .7, Y * .7, 3, 29) > .84 && h > .5) on = false; keep[Y * W2 + X] = on ? 1 : 0; }
  // cracks: random walks downward through the letters; one runs through the second E's middle bar and keeps an ember
  const crack = new Uint8Array(W2 * H2), ember = []; const rng = campRng(97);
  const walk = (x0, y0, n, dirx, diry, glow) => { let X = x0, Y = y0; for (let i = 0; i < n; i++) { const id = Y * W2 + X; if (X >= 0 && Y >= 0 && X < W2 && Y < H2) { crack[id] = 1; if (glow) ember.push([X, Y]); if (rng() < .5 && X + 1 < W2) crack[id + 1] = 1; }
      X += Math.round(dirx + (rng() - .5) * 1.6); Y += Math.round(diry + (rng() - .5) * 1.2); } };
  for (const [bx, w] of boxes) for (let q = 0; q < 2; q++) walk(Math.round((bx + w * (.2 + rng() * .6)) * k), Math.round((oy + LY.seedY + (q ? LY.seedH * .55 : 0)) * k), Math.round((14 + rng() * 22) * k), (rng() - .5) * .6, 1, false);
  { const [bx, w] = boxes[2]; walk(Math.round((bx + 1) * k), Math.round((oy + LY.seedY + LY.seedH / 2) * k), Math.round(w * .78 * k), 1, (rng() - .5) * .3, true); }
  // colour: worn bone-gray plate lit from above, rust and grime running down, bevelled edges, the ember crack
  const RAMP2 = ['#151312', '#22201d', '#33302b', '#48443d', '#615b52', '#7d766b', '#9b9384', '#b9b09f', '#d6cdbb', '#ece4d4'], lerpC = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  const rgbOf = c => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }, RR = RAMP2.map(rgbOf), rust = rgbOf('#5a2617'), glowC = rgbOf('#ff8f3a'), glowE = rgbOf('#8a2c12');
  const out = new Uint8ClampedArray(W2 * H2 * 4), on = (X, Y) => X >= 0 && Y >= 0 && X < W2 && Y < H2 && keep[Y * W2 + X] && !crack[Y * W2 + X];
  for (let Y = 0; Y < H2; Y++) for (let X = 0; X < W2; X++) { const id = Y * W2 + X; if (!keep[id]) continue; const i = id * 4;
    if (crack[id]) { let near = false; for (const [ex, ey] of ember) if (Math.abs(ex - X) < 2 && Math.abs(ey - Y) < 2) { near = true; break; } if (near) { const c = chash(X, Y, 3) > .5 ? glowC : glowE; out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2]; out[i + 3] = 255; } continue; }
    const ly = (Y / k - oy) / (LY.seedY + LY.seedH); let v = .7 - ly * .32 + (cfbm(X * .35, Y * .35, 6, 5) - .5) * .32 + (chash(X, Y, 9) - .5) * .07;
    if (!on(X, Y - Math.ceil(k * .7))) v += .26; if (!on(X, Y + Math.ceil(k * .7))) v -= .3; if (!on(X - Math.ceil(k * .7), Y)) v += .07; if (!on(X + Math.ceil(k * .7), Y)) v -= .06;
    { const gs = cnoise(X * .12, Y * .02, 3, 11); if (gs > .7) v -= ly * (gs - .7) * 1.2; } // grime running down, in a few places
    v = clamp(v, 0, .999); const f = v * (RR.length - 1), lo = Math.floor(f); let c = lerpC(RR[lo], RR[Math.min(RR.length - 1, lo + 1)], f - lo);
    const r = cfbm(X * .22, Y * .5, 9, 31); if (r > .66) c = lerpC(c, rust, Math.min(.6, (r - .66) * 3));
    out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2]; out[i + 3] = 255; }
  // drips under the SEED letters
  for (let X = 0; X < W2; X++) for (let Y = H2 - 2; Y > 0; Y--) { const id = Y * W2 + X; if (!keep[id] || crack[id]) continue; if (keep[id + W2]) break; if (Y / k < oy + LY.seedY + LY.seedH * .8) break;
    if (chash(X >> 1, 7, 41) > .93) { const n = Math.round((3 + chash(X, 1, 43) * 18) * k * (chash(X, 2, 47) > .7 ? 1.6 : 1)); for (let q = 1; q < n && Y + q < H2; q++) { const j = ((Y + q) * W2 + X) * 4, a = 1 - q / n; out[j] = 70; out[j + 1] = 30; out[j + 2] = 22; out[j + 3] = 255 * Math.min(1, a * 1.4); } }
    break; }
  const art = document.createElement('canvas'); art.width = W2; art.height = H2; art.getContext('2d').putImageData(new ImageData(out, W2, H2), 0, 0);
  // a heavy shadow under it all
  const cv = document.createElement('canvas'); cv.width = W2; cv.height = H2; const x2 = cv.getContext('2d'); x2.shadowColor = 'rgba(0,0,0,.85)'; x2.shadowBlur = 5 * k; x2.shadowOffsetX = 2 * k; x2.shadowOffsetY = 3 * k; x2.drawImage(art, 0, 0); x2.shadowColor = 'transparent'; x2.drawImage(art, 0, 0);
  const e = ember[Math.floor(ember.length * .55)] || [0, 0];
  Object.assign(LOGO, { cv, us: k, ember: [e[0] / k, e[1] / k], w: LW, h: LH });
}
// draws the lettermark with its top-left at (x, y) (logical px); the ember breathes and sheds sparks; the light fails now and then
function drawSeedLogo(x, y, t) {
  if (!LOGO.cv || LOGO.us !== US) buildLogo(); const A0 = ctx.globalAlpha;
  LOGO.flick = Math.max(0, LOGO.flick - FRAME_DT); if (Math.random() < FRAME_DT / 9) LOGO.flick = .14;
  ctx.globalAlpha = A0 * (LOGO.flick > 0 && ((LOGO.flick * 40) | 0) % 2 ? .78 : 1); ctx.drawImage(LOGO.cv, x - LOGO_LAY.pad, y - LOGO_LAY.pad, LOGO.w, LOGO.h); ctx.globalAlpha = A0;
  const ex = x - LOGO_LAY.pad + LOGO.ember[0], ey = y - LOGO_LAY.pad + LOGO.ember[1], br = .55 + Math.sin(t * 1.7) * .2 + Math.sin(t * 7.3) * .06;
  ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(ex, ey, 0, ex, ey, 16); gr.addColorStop(0, `rgba(255,140,60,${.38 * br})`); gr.addColorStop(1, 'rgba(255,90,30,0)'); ctx.fillStyle = gr; ctx.fillRect(ex - 16, ey - 16, 32, 32); ctx.globalCompositeOperation = 'source-over';
  if (Math.random() < FRAME_DT * 2.2) LOGO.sparks.push({ x: ex + rand(-6, 6), y: ey, vy: -rand(6, 14), vx: rand(-2, 2), life: rand(1, 2.4) });
  for (let i = LOGO.sparks.length - 1; i >= 0; i--) { const s = LOGO.sparks[i]; s.life -= FRAME_DT; s.x += s.vx * FRAME_DT + Math.sin(t * 3 + i) * .05; s.y += s.vy * FRAME_DT; if (s.life <= 0) { LOGO.sparks.splice(i, 1); continue; } ctx.globalAlpha = A0 * Math.min(1, s.life); rect(s.x, s.y, .5, .5, s.life > 1.2 ? TH.emberHi : TH.ember); } ctx.globalAlpha = A0;
}

// ---------------- film grain (UI pass, device resolution) ----------------
const GRAIN = { cv: [], k: '' };
// ---- the in-run HUD plates: flat, a little see-through, a thin edge and a short accent rule ----
function hudPlate(x, y, w, h, edge, acc, bg) { rect(x, y, w, h, bg || 'rgba(10,9,8,.84)'); box(x, y, w, h, null, edge || '#2d2925'); if (acc) { rect(x, y, Math.min(30, w), 1, acc); rect(x, y + 1, Math.min(10, w), 1, thA(acc, .4)); } }
// ---- tabs on a window: flat plates, the chosen one lit with an ember rule under it ----
function thTab(x, y, w, h, s, on, hv) {
  rect(x, y, w, h, on ? 'rgba(208,112,46,.10)' : hv ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.3)'); box(x, y, w, h, null, on ? thA(TH.ember, .5) : hv ? TH.line2 : TH.line);
  if (on) rect(x, y + h - 1, w, 1, TH.ember);
  text(s, Math.round(x + w / 2), y + Math.floor((h - 5) / 2) - (isCJK(s) ? 2 : 0), on ? TH.bone : hv ? TH.bone2 : TH.dim, 1, 'center');
}
// where the tabs can start on a full page (panel): after the title and its small English kicker
const winTabX = title => 24 + 12 + textW(title, 1.5) + 14;
function filmGrain(a = .06) {
  const key = W + 'x' + H + 'x' + US; if (GRAIN.k !== key) { GRAIN.k = key; GRAIN.cv = []; const gw = Math.ceil(W * US / 2), gh = Math.ceil(H * US / 2);
    for (let f = 0; f < 3; f++) { const c = document.createElement('canvas'); c.width = gw; c.height = gh; const x = c.getContext('2d'), im = x.createImageData(gw, gh), d = im.data;
      for (let i = 0; i < d.length; i += 4) { const v = Math.random() < .5 ? 0 : 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = Math.random() * 90; } x.putImageData(im, 0, 0); GRAIN.cv.push(c); } }
  ctx.globalAlpha = a; ctx.drawImage(GRAIN.cv[((performance.now() / 60) | 0) % 3], 0, 0, W, H); ctx.globalAlpha = 1;
}

// ---------------- difficulty medallions (25x25): an iron disc with a worn rim and rivets, the sign of the danger inside ----------------
const EMB = {};
function diffEmblem(id, dim) {
  const key = id + (dim ? 'd' : ''); if (EMB[key]) return EMB[key];
  const N = 25, p = new CPix(N, N), c = 12, d = DIFF_BY[id] || DIFF_BY.classic, acc = dim ? '#56524b' : d.c(), B = dim ? '#5c5850' : '#d2c9b7', B2 = dim ? '#3d3a35' : '#8c8476', B3 = '#2a2724', HOLE = '#070707', IN = '#141416';
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const r = Math.hypot(i - c, j - c), lit = ((c - i) + (c - j)) / 24; if (r > 12.3) continue;
    if (r > 10.7) p.set(i, j, cramp(RAMP.steel, .45 + lit * .9 + (chash(i, j, 3) - .5) * .25, i, j)); else if (r > 9.9) p.set(i, j, '#080809');
    else p.set(i, j, cramp(['#0d0d0f', '#121214', '#17171a', '#1d1d20'], .45 - lit * .35 + (chash(i, j, 5) - .5) * .35, i, j)); }
  for (const a of [.785, 2.356, 3.927, 5.498]) { const rx = Math.round(c + Math.cos(a) * 11.5), ry = Math.round(c + Math.sin(a) * 11.5); p.set(rx, ry, '#9a9aa0'); p.set(rx + 1, ry + 1, '#202022'); }
  if (id === 'easy') { // a sprout through a crack in the ground
    p.fill(5, 16, 15, 4, (i, j, X, Y) => (j === 0 && Math.abs(X - 12) > 5 + (chash(X, 0, 2) > .5 ? 1 : 0)) ? null : (j === 0 ? B2 : B3)); for (let X = 6; X < 19; X++) if (chash(X, 1, 4) > .45) p.set(X, 17 + (X % 3 === 0 ? 1 : 0), HOLE);
    for (let Y = 9; Y < 17; Y++) p.set(12 + (Y < 12 ? 0 : Y < 14 ? -1 : 0), Y, acc); p.fill(7, 7, 5, 3, (i, j) => (Math.abs(i - 2) + Math.abs(j - 1) * 1.6 <= 2.6) ? acc : null); p.fill(13, 5, 5, 3, (i, j) => (Math.abs(i - 2) + Math.abs(j - 1) * 1.6 <= 2.6) ? acc : null);
    p.set(8, 7, '#d8f0c0'); p.set(15, 5, '#d8f0c0'); }
  else if (id === 'classic') { // an ember behind the glass of a lantern
    p.rect(9, 6, 7, 1, B2); p.rect(11, 4, 3, 2, B2); p.rect(8, 7, 9, 1, B); p.rect(8, 18, 9, 2, B); p.rect(8, 8, 1, 10, B2); p.rect(16, 8, 1, 10, B2); p.rect(12, 8, 1, 10, B3);
    p.fill(9, 8, 7, 10, (i, j) => i === 3 ? null : '#1c1712'); p.poly([[12.5, 9], [15, 14], [14, 17], [11, 17], [10, 14]], acc); p.poly([[12.5, 12], [13.6, 15], [12.5, 17], [11.4, 15]], '#ffd27a'); }
  else if (id === 'hard') { // a cracked gas mask
    p.fill(5, 4, 15, 16, (i, j, X, Y) => { const e = Math.hypot((X - 12) / 6.6, (Y - 11) / 7.6); return e > 1 ? null : cramp(['#3d3a35', '#57524a', '#77706a', '#a8a090', '#d2c9b7'].map(v => dim ? '#4a4741' : v), .7 - e * .5 + (12 - X) / 30, X, Y); });
    for (const ex of [9, 15]) { p.disc(ex, 10, 2.4, '#0b0b0c'); p.disc(ex, 10, 1.6, acc); p.set(ex - 1, 9, dim ? acc : '#ffe0c0'); }
    p.rect(10, 15, 5, 5, B2); p.rect(10, 15, 5, 1, B); for (let k = 0; k < 2; k++) p.rect(11, 16 + k * 2, 3, 1, B3); p.line(14, 4, 16, 8, HOLE); p.line(16, 8, 15, 10, HOLE); }
  else if (id === 'nightmare') { // the biohazard sign, bleeding
    for (const a of [-Math.PI / 2, Math.PI / 6, Math.PI * 5 / 6]) { const lx = c + Math.cos(a) * 4.4, ly = c + Math.sin(a) * 4.4; p.disc(lx, ly, 3.6, acc); }
    for (const a of [-Math.PI / 2, Math.PI / 6, Math.PI * 5 / 6]) { const lx = c + Math.cos(a) * 5.9, ly = c + Math.sin(a) * 5.9; p.disc(lx, ly, 2.2, IN); }
    p.disc(c, c, 2.4, IN); for (let a = 0; a < 6.28; a += .3) p.set(Math.round(c + Math.cos(a) * 2.6), Math.round(c + Math.sin(a) * 2.6), acc); p.set(c, c, IN);
    p.rect(15, 17, 1, 3, acc); p.rect(9, 17, 1, 2, acc); p.set(15, 20, acc); }
  else { // a cracked skull, one eye still burning
    p.disc(12, 10, 6.4, B); p.fill(6, 4, 13, 6, (i, j, X, Y) => Y < 7 && X > 13 ? (p.a(X, Y) ? B2 : null) : null); p.rect(8, 14, 9, 5, B2); p.rect(9, 18, 7, 1, B2); for (let k = 0; k < 4; k++) p.rect(9 + k * 2, 16, 1, 3, HOLE);
    p.disc(9.5, 11, 1.9, HOLE); p.disc(14.5, 11, 1.9, HOLE); p.set(14, 11, acc); p.set(15, 11, acc); p.set(14, 10, '#ff8080'); p.poly([[12, 12], [13, 14], [11, 14]], HOLE);
    p.line(12, 4, 11, 7, HOLE); p.line(11, 7, 13, 9, HOLE); }
  return EMB[key] = p.canvas(true);
}
function drawDiffEmblem(id, x, y, sc, t, dim) {
  ctx.drawImage(diffEmblem(id, dim), x, y, 25 * sc, 25 * sc); if (dim) return;
  const glow = { classic: [12.5, 14, 9, '255,150,60'], hard: [12, 10, 7, '255,120,60'], despair: [14.5, 11, 6, '255,40,40'], nightmare: [12, 12, 10, '200,60,50'], easy: [12, 8, 6, '150,220,120'] }[id];
  if (!glow) return; const br = .5 + Math.sin(t * (id === 'classic' ? 6.3 : 2.1)) * .2 + (id === 'classic' ? Math.sin(t * 17) * .08 : 0);
  ctx.globalCompositeOperation = 'lighter'; const gx = x + glow[0] * sc, gy = y + glow[1] * sc, R = glow[2] * sc, gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, R); gr.addColorStop(0, `rgba(${glow[3]},${.32 * br})`); gr.addColorStop(1, `rgba(${glow[3]},0)`); ctx.fillStyle = gr; ctx.fillRect(gx - R, gy - R, R * 2, R * 2); ctx.globalCompositeOperation = 'source-over';
}

// ---------------- the title screen: the lettermark, two panels, the taskbar; picking a place on the bar takes the camera there ----------------
function drawMainMenu(t) {
  const fk = TBAR.fk, dep = CAMP.dep ? clamp(CAMP.dep.t / .5, 0, 1) : 0, a = (1 - fk) * (1 - dep);
  drawMenuShade();
  const k = easeOut(clamp(MENU.t / 1.2, 0, 1)); if (a > 0) { ctx.globalAlpha = k * a; drawSeedLogo(30, 24, t); ctx.globalAlpha = 1; }
  if (a > .02) { ctx.globalAlpha = a; drawEventCard(t); ctx.globalAlpha = 1; }
  drawAreaPanel(t); if (TBAR.shown === PTN_AREA) drawPartners(t);
  if (dep < 1) { ctx.globalAlpha = 1 - dep; drawTaskbar(t); drawLoginChip(t); ctx.globalAlpha = 1; }
  if (CAMP.dep) { const q = clamp((CAMP.dep.t - 2.2) / .9, 0, 1); if (q > 0) { ctx.globalAlpha = q; rect(0, 0, W, H, '#000'); ctx.globalAlpha = 1; } }
  filmGrain(.055);
}
// ---------------- the taskbar: six places in the camp. A click moves the camera to that place and opens what can be done there ----------------
const TBAR = { area: -1, shown: -1, sel: 0, k: 0, fk: 0, dk: 0, hov: -1, hk: [], lmx: 0, lmy: 0, focus: 0, kb: false, rowH: -1, sub: [], subT: 1, fx: null, fv: 0, side: 1 };
const TB_H = 24, TB_CLOCK_W = 0, WC_CHIP_MIN = 110;
function openGirlTab(id, i) { openGirls(); GIRLS.sel = id; GIRLS.tab = i; }
function openMarketAt(i) { openMarket(); MKT.tab = i; MKT.hs = 0; }
function openBoardAt(i) { openBoard(); if (i) setTab(i); }
function sortie(i) { SET.diff = DIFFS[i].id; saveSettings(); AU.play('menuOk'); TBAR.k = 0; campLaunch(startRunFromCamp); }
// each place: where it stands in the camp and what it offers. A row: head (a small heading), info (shown, not chosen), cur (lit as
// the one open now), sub (opens a level below), v (a value), slider, key (a key and what it does), clr (the clears on DZMM), aff, dot
const DEP = { pick: -1, t: 0, btn: null, card: null };
function tbItems() {
  const sv = loadSave();
  return [
    { ic: 'start', l: () => L('tb_go'), at: CPOS.truck, rows: () => [...(sv ? [{ l: () => L('cont'), v: () => chapterTitle(sv.floor) + ' · ' + tr(DIFF_BY[sv.diff].nm), act: () => { TBAR.k = 0; campLaunch(campResume); } }, { head: true, l: () => L('tb_new') }] : []),
      ...DIFFS.map((d, i) => ({ l: () => tr(d.nm), diff: d.id, clr: d.id, cur: () => DEP.pick === i, act: () => depPick(i) }))] },
    { ic: 'girls', l: () => L('tb_partner'), at: CAMP_FIRE, rows: () => SURV_IDS.map(id => girlMet(id) ? { l: () => svName(id), dot: SURV[id].c, aff: id, act: () => openGirlTab(id, 0) } : { l: () => '???', off: true }) },
    { ic: 'market', l: () => L('market'), at: CPOS.market, rows: () => [{ l: () => L('mk_tabSup'), cur: () => MENU.page === 'market' && MKT.tab === 0, act: () => dockGo('market', 0) }, { l: () => L('mk_wHead'), cur: () => MENU.page === 'market' && MKT.tab === 1, act: () => dockGo('market', 1) }, { l: () => L('mk_privHead'), cur: () => MENU.page === 'market' && MKT.tab === 2, act: () => dockGo('market', 2) }, { l: () => L('mk_gearHead'), cur: () => MENU.page === 'market' && MKT.tab === 3, act: () => dockGo('market', 3) }, { l: () => L('g_proofs', gpLoad().proofs), off: true, info: true }] },
    { ic: 'board', l: () => L('board'), at: CPOS.board, rows: () => ['bd_top', 'bd_endless', 'bd_invade', 'bd_invadeE'].map((k, i) => ({ l: () => L(k), cur: () => MENU.page === 'board' && BOARD.tab === i, act: () => dockGo('board', i) })) },
    { ic: 'codex', l: () => L('codex'), at: CPOS.codex, rows: () => CX_TABS.map((k, i) => ({ l: () => L(k), cur: () => MENU.page === 'codex' && CX.tab === i, act: () => dockGo('codex', i) })) },
    { ic: 'settings', l: () => L('settings'), title: () => TBAR.sub.length ? L(SET_SUB[TBAR.sub[TBAR.sub.length - 1]]) : L('settings'), at: CPOS.radio, rows: setRows },
  ];
}
// ---- the settings live in the side column: each level is a list, the first row of a lower level goes back up ----
const SET_SUB = { gameset: 'set_game', aiset: 'set_ai', quality: 'q_custom', howto: 'howto' };
const HOWTO_KEYS = [['WASD', 'h_move'], ['MOUSE', 'h_aim'], ['LMB', 'h_atk'], ['SPACE', 'h_dash'], ['R', 'h_reload'], ['X / WHEEL', 'h_swap'], ['Q', 'h_support'], ['E', 'h_use'], ['E', 'h_skill'], ['TAB', 'h_build'], ['ESC', 'h_pause']];
function setRows() {
  const lv = TBAR.sub[TBAR.sub.length - 1], back = { l: () => '<  ' + L('back'), back: true, act: tbUp }, keep = a => a.filter(r => r.l() !== L('back'));
  if (!lv) return [{ l: () => L('set_game'), sub: true, act: () => tbSub('gameset') }, { l: () => L('set_ai'), sub: true, act: () => tbSub('aiset') }, { l: () => L('q_custom'), sub: true, act: () => tbSub('quality') },
    { l: () => L('language'), v: () => (LANGS.find(g => g.id === SET.lang) || LANGS[0]).name, act: () => cycleLang(1), adj: d => cycleLang(d) }, ...(TOUCH.on ? [] : [{ l: () => L('howto'), sub: true, act: () => tbSub('howto') }])];
  if (lv === 'gameset') return [back, ...keep(menuItems('gameset')).map(r => r.l() === L('q_custom') ? Object.assign({}, r, { sub: true, act: () => tbSub('quality') }) : r)];
  if (lv === 'aiset') return [back, ...keep(aiItems())];
  if (lv === 'quality') return [back, ...keep(qualityItems())];
  return [back, ...HOWTO_KEYS.map(([k, d]) => ({ l: () => L(d), key: k, info: true }))];
}
function tbSub(k) { TBAR.sub.push(k); TBAR.subT = 0; const rows = setRows(), i = rows.findIndex((r, j) => j > 0 && !r.off && !r.head && !r.info); TBAR.sel = i > 0 ? i : 0; }
function tbUp() { const from = TBAR.sub.pop(); TBAR.subT = 0; const rows = setRows(); TBAR.sel = Math.max(0, rows.findIndex(r => r.sub && r.act && from && r.l() === L(SET_SUB[from]))); AU.play('menu', .8); }
function tbLayout() {
  const y = H - TB_H, items = tbItems(), lb = NET.ready ? loginBox() : { x: W - TB_CLOCK_W - 10 };
  const full = items.reduce((a, p) => a + textW(p.l()) + 28, 0) + (items.length - 1) * 2 <= lb.x - 14 - (wcOn() ? WC_CHIP_MIN : 0); let x = 6;
  return { y, items: items.map(p => { const w = full ? textW(p.l()) + 28 : 24, b = Object.assign({ x, y: y + 3, w, h: TB_H - 6, full }, p); x += w + 2; return b; }) };
}
// where the camera rests for a place: the place a third of the way across, unless the camp runs out
const areaCam = it => clamp(Math.round(it.at - W * .36), 0, Math.max(0, CAMP_W - W));
// the column sits on the side away from the place (decided by where the place will stand, so it never flips mid-move); with a window
// docked beside it, it narrows to a slim column of smaller rows
const AREA_RH = 19;
const areaRight = it => it.at - areaCam(it) < W / 2;
function areaBox(it, rows) {
  const right = areaRight(it), dk = easeInOut(clamp(TBAR.dk || 0, 0, 1)), w = Math.round(lerp(196, 104, dk)), m = Math.round(lerp(18, 10, dk)), x = right ? W - w - m : m, ty = Math.round(lerp(34, 24, dk)), ry = ty + Math.round(lerp(40, 26, dk));
  const avail = H - TB_H - 10 - ry, rh = rows.length ? clamp(Math.floor(avail / rows.length), 12, dk > .5 ? 15 : AREA_RH) : AREA_RH;
  return { x, y: ry, w, h: rows.length * rh, ry, rh, ty, right, ox: (TBAR.fx == null ? it.at : TBAR.fx) - CAMP.cam, oy: campGround() - 44, sc: dk > .5 || rh < 16 ? 1 : 1.5, tsc: dk > .5 ? 2 : 3 };
}
// the focus of the push-in follows the camera on the same spring, so the scaling never jumps from one place to the next
function tbFocusTick(rdt) { const it = TBAR.area >= 0 ? tbItems()[TBAR.area] : null; if (TBAR.fx == null) TBAR.fx = it ? it.at : CAMP_FIRE; if (it) springTo(TBAR, 'fx', 'fv', it.at, 5.2, rdt);
  if (it) TBAR.side = lerp(TBAR.side, areaRight(it) ? 1 : 0, Math.min(1, rdt * 7)); }
// the push-in: the camp is drawn, then scaled about the place (world pass, nearest-neighbour)
const MZ = { cv: null };
function menuZoom() {
  if (TBAR.area < 0 && TBAR.fk < .01) return; const it = tbItems()[Math.max(0, TBAR.area)]; if (!it) return;
  const z = 1 + .32 * easeInOut(clamp(TBAR.fk, 0, 1)); if (z < 1.002) return; const fx = (TBAR.fx == null ? it.at : TBAR.fx) - CAMP.cam, fy = campGround() - 30;
  if (!MZ.cv || MZ.cv.width !== cv.width || MZ.cv.height !== cv.height) { MZ.cv = document.createElement('canvas'); MZ.cv.width = cv.width; MZ.cv.height = cv.height; }
  const m = MZ.cv.getContext('2d'); m.clearRect(0, 0, MZ.cv.width, MZ.cv.height); m.drawImage(cv, 0, 0);
  const sx = cv.width / W, sy = cv.height / H; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(MZ.cv, (fx - fx / z) * sx, (fy - fy / z) * sy, cv.width / z, cv.height / z, 0, 0, cv.width, cv.height); ctx.restore();
}
function tbSet(i) { if (TBAR.area === i) return; if (TBAR.area >= 0) TBAR.last = TBAR.area; else if (TBAR.fk < .05) { TBAR.fx = CAMP.cam + W * .36; TBAR.fv = 0; } TBAR.area = i; TBAR.sub = []; TBAR.subT = 1; DEP.pick = -1; if (i === PTN_AREA) ptnInit(); TBAR.sel = 0;
  if (i >= 0) { TBAR.focus = i; if (i === 0) loadClears(); const rows = tbItems()[i].rows(); TBAR.sel = Math.max(0, rows.findIndex(r => !r.off && !r.head && !r.info)); } AU.play(i >= 0 ? 'menuOk' : 'menu', i >= 0 ? 1 : .8); }
function tbAct(r) { if (!r || r.off || r.head || r.info) { if (r && !r.head && !r.info) AU.play('locked'); return; } AU.play('menuOk'); r.act(); }
function areaStep(rows, d) { if (!rows.length) return; let i = TBAR.sel; for (let n = 0; n < rows.length; n++) { i = (i + d + rows.length) % rows.length; if (!rows[i].head && !rows[i].info) break; } TBAR.sel = i; AU.play('menu'); }
// 列表只选择难度，统一从右侧出击按钮开始。
function depPick(i) { if (DEP.pick === i) return; DEP.pick = i; DEP.t = 0; AU.play('menu', .9 + i * .08); loadClears(); }
function updateTaskbar(rdt) {
  if (Input.clicked && wcChipClick()) return;
  const lay = tbLayout(), mx = Input.mx, my = Input.my, mv = Math.abs(mx - TBAR.lmx) + Math.abs(my - TBAR.lmy) > .5; TBAR.lmx = mx; TBAR.lmy = my; if (mv) TBAR.kb = false;
  const it = TBAR.area >= 0 ? lay.items[TBAR.area] : null, near = it && Math.abs(CAMP.cam - areaCam(it)) < 6;
  TBAR.fk = lerp(TBAR.fk, it ? 1 : 0, Math.min(1, rdt * 6)); TBAR.dk = Math.max(0, (TBAR.dk || 0) - rdt * 5); TBAR.subT += rdt; DEP.t += rdt;
  // what the column shows fades out before the next place's fades in (no snap when two places sit close together)
  if (TBAR.shown !== TBAR.area) { TBAR.k = Math.max(0, TBAR.k - rdt * 8); if (TBAR.k <= 0) TBAR.shown = TBAR.area; }
  else TBAR.k = it && near ? Math.min(1, TBAR.k + rdt * 3.2) : Math.max(0, TBAR.k - rdt * 6);
  TBAR.hov = lay.items.findIndex(p => inR(p, mx, my));
  if (TBAR.area === PTN_AREA && !(TBAR.hov >= 0 && Input.clicked)) { if (TBAR.shown === PTN_AREA && TBAR.k > .95) updatePartners(rdt); else if (pressed('Escape')) tbSet(-1); return; } // the strips take every click except one on the bar
  const live = it && TBAR.shown === TBAR.area, rows = live ? it.rows() : [], box = live ? areaBox(it, rows) : null;
  if (TBAR.sel >= rows.length) TBAR.sel = 0;
  TBAR.rowH = box && TBAR.k > .6 && mx >= box.x - 6 && mx < box.x + box.w && my >= box.ry && my < box.ry + rows.length * box.rh ? Math.floor((my - box.ry) / box.rh) : -1;
  if (mv && TBAR.rowH >= 0 && !rows[TBAR.rowH].head && !rows[TBAR.rowH].info && TBAR.rowH !== TBAR.sel) { TBAR.sel = TBAR.rowH; AU.play('menu'); }
  if (Input.clicked) {
    if (TBAR.hov >= 0) { Input.clicked = false; tbSet(TBAR.area === TBAR.hov ? -1 : TBAR.hov); return; }
    if (TBAR.rowH >= 0) { Input.clicked = false; const r = rows[TBAR.rowH];
      if (r.slider) { const sx = box.x + box.w - 4 - 70; if (mx >= sx - 4) { r.set(clamp((mx - sx) / 70 + .05, 0, 1)); return; } }
      tbAct(r); return; }
    if (TBAR.shown === 0 && DEP.btn && inR(DEP.btn, mx, my)) { Input.clicked = false; tbAct({ act: () => sortie(DEP.pick) }); return; }
    if (TBAR.shown === 0 && DEP.card && inR(DEP.card, mx, my)) { Input.clicked = false; return; }
    if (it && !(box && mx >= box.x - 10 && mx < box.x + box.w + 10 && my >= box.ty - 4 && my < box.ry + rows.length * box.rh + 4)) { Input.clicked = false; tbSet(-1); return; }
  }
  const n = lay.items.length, up = pressed('KeyW') || pressed('ArrowUp'), dn = pressed('KeyS') || pressed('ArrowDown'), lf = pressed('KeyA') || pressed('ArrowLeft'), rt = pressed('KeyD') || pressed('ArrowRight'), ok = pressed('Enter') || pressed('Space');
  if (up || dn || lf || rt || ok) TBAR.kb = true;
  if (!it) { if (lf) { TBAR.focus = (TBAR.focus + n - 1) % n; AU.play('menu'); } if (rt) { TBAR.focus = (TBAR.focus + 1) % n; AU.play('menu'); } if (ok || up) tbSet(TBAR.focus); return; }
  if (pressed('Escape') || pressed('Backspace')) { if (TBAR.sub.length) tbUp(); else if (TBAR.area === 0 && DEP.pick >= 0) { DEP.pick = -1; AU.play('menu', .8); } else if (pressed('Escape')) tbSet(-1); return; }
  if (!live) return;
  if (up) areaStep(rows, -1); if (dn) areaStep(rows, 1);
  const r = rows[TBAR.sel]; if (r && r.adj && (lf || rt)) { r.adj(lf ? -1 : 1); return; }
  if (lf) tbSet((TBAR.area + n - 1) % n); else if (rt) tbSet((TBAR.area + 1) % n);
  if (ok && TBAR.k > .6) tbAct(r);
}
function tbFade() { if (TBAR.seen) return 1; const k = clamp((MENU.t - .4) / .6, 0, 1); if (k >= 1) TBAR.seen = true; return k; }
function drawTaskbar(t) {
  const lay = tbLayout(), y = lay.y, a0 = ctx.globalAlpha, a = a0 * tbFade(); ctx.globalAlpha = a;
  rect(0, y, W, TB_H, 'rgba(9,8,7,.94)'); ctx.globalAlpha = a * .5; ctx.drawImage(winGrain(Math.ceil(W), TB_H), 0, y); ctx.globalAlpha = a;
  rect(0, y, W, 1, TH.line2); rect(0, y + 1, W, 1, 'rgba(255,255,255,.025)');
  lay.items.forEach((p, i) => { const open = TBAR.area === i, hv = (TBAR.hov === i && !TOUCH.on) || (TBAR.kb && TBAR.area < 0 && TBAR.focus === i), lit = open || hv; TBAR.hk[i] = lerp(TBAR.hk[i] || 0, lit ? 1 : 0, .3); const k = TBAR.hk[i];
    if (open) { const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h); g.addColorStop(0, 'rgba(208,112,46,.26)'); g.addColorStop(1, 'rgba(208,112,46,.06)'); rect(p.x, p.y, p.w, p.h, g); }
    else if (k > .02) rect(p.x, p.y, p.w, p.h, `rgba(255,255,255,${.05 * k})`);
    if (k > .02 || open) rect(p.x + 3, p.y + p.h - 1, p.w - 6, 1, thA(TH.ember, open ? 1 : k));
    mmIcon(p.ic, p.x + (p.full ? 7 : 8), p.y + 5, lit ? (open ? TH.emberHi : TH.bone) : TH.dim); if (p.full) { const s = p.l(); text(s, p.x + 18, p.y + 6 - (isCJK(s) ? 2 : 0), lit ? TH.bone : TH.bone2); }
    else if (hv && !open) { const s = p.l(), tw = textW(s) + 10, tx = Math.round(clamp(p.x + p.w / 2 - tw / 2, 2, W - tw - 2)); hudPlate(tx, y - 16, tw, 13, TH.line2); text(s, tx + 5, y - 13 - (isCJK(s) ? 1 : 0), TH.bone); } });
  drawWcChip(t, lay);
  ctx.globalAlpha = a0;
}
// the place, once the camera is there: letterbox bars close in, a work light falls on it, the far side darkens under a large title and a column of choices
function drawAreaPanel(t) {
  const fk = easeInOut(clamp(TBAR.fk, 0, 1)); if (fk < .01) return; const lay = tbLayout(), g0 = campGround(), ox = (TBAR.fx == null ? CAMP_FIRE : TBAR.fx) - CAMP.cam;
  drawWorkLight(ox, g0, fk, t);
  // the far side falls into shadow so the words can be read (cross-fades when the column changes sides)
  { const sd = clamp(TBAR.side, 0, 1); for (const [rt, wg] of [[1, sd], [0, 1 - sd]]) { if (wg < .01) continue; const g3 = rt ? ctx.createLinearGradient(W * .38, 0, W, 0) : ctx.createLinearGradient(W * .62, 0, 0, 0);
    g3.addColorStop(0, 'rgba(6,5,5,0)'); g3.addColorStop(.45, `rgba(6,5,5,${.78 * fk * wg})`); g3.addColorStop(1, `rgba(6,5,5,${.92 * fk * wg})`); ctx.fillStyle = g3; ctx.fillRect(0, 0, W, H); } }
  // letterbox
  const bh = Math.round(16 * fk); rect(0, 0, W, bh, '#000'); rect(0, H - TB_H - Math.round(8 * fk), W, Math.round(8 * fk), '#000');
  const it = TBAR.shown >= 0 ? lay.items[TBAR.shown] : null, k = easeOut(TBAR.k); if (!it || k <= 0 || TBAR.shown === PTN_AREA) return;
  const rows = it.rows(), b = areaBox(it, rows), tx = b.x, title = it.title ? it.title() : it.l(), sl = Math.round((1 - easeOut(clamp(TBAR.subT / .22, 0, 1))) * 16);
  // the title, a short ember rule, then the choices
  const lineY = b.ty + (b.tsc === 3 ? 30 : 20); ctx.globalAlpha = k; textS(title, tx + Math.round((1 - k) * (b.right ? 14 : -14)) + sl, b.ty, TH.bone, b.tsc);
  rect(tx, lineY, Math.round(48 * k), 1, TH.ember); rect(tx + Math.round(48 * k), lineY, Math.round((b.w - 48) * k), 1, 'rgba(255,255,255,.08)');
  rows.forEach((r, i) => { const ry = b.ry + i * b.rh, ra = clamp(k * 2.4 - i * .1, 0, 1); if (ra <= 0) return; ctx.globalAlpha = ra;
    const cur = !!(r.cur && r.cur()), on = i === TBAR.sel && !r.off && !r.head && !r.info && !(TBAR.dk > .5 && TBAR.rowH !== i), s = r.l(), big = b.sc > 1, cy = ry + Math.round(b.rh / 2), slide = Math.round((1 - ra) * 10) + (on ? 5 : 0) + sl;
    if (r.head) { text(s, tx + sl, cy - 2 - (isCJK(s) ? 2 : 0), TH.faint, 1); ctx.globalAlpha = 1; return; }
    if (on || cur) { const g = ctx.createLinearGradient(tx - 6, 0, tx + b.w, 0); g.addColorStop(0, `rgba(208,112,46,${cur ? .3 : .2})`); g.addColorStop(1, 'rgba(208,112,46,0)'); rect(tx - 6, ry + 1, b.w + 6, b.rh - 2, g); rect(tx - 6, ry + 1, 2, b.rh - 2, cur ? TH.emberHi : TH.ember); }
    let lx = tx + slide;
    if (r.key) { keyCap(r.key, lx, cy - 5); text(fitText(s, b.w - 56), tx + sl + 52, cy - 3 - (isCJK(s) ? 1 : 0), TH.bone2); ctx.globalAlpha = 1; return; }
    if (r.diff) { drawDiffIcon(r.diff, lx, cy - 5, 1, t, !(on || cur)); lx += 16; } else if (r.dot) { rect(lx, cy - 1, 3, 3, r.dot); lx += 8; }
    const c = r.off ? (r.info ? TH.gold : TH.faint) : on || cur ? TH.bone : r.back ? TH.dim : TH.bone2;
    if (big) textS(s, lx, ry + Math.round((b.rh - 13) / 2) - (isCJK(s) ? 1 : 0), c, 1.5); else text(s, lx, cy - 3 - (isCJK(s) ? 2 : 0), c, 1);
    const rx = tx + b.w - 4, vy = cy - 3;
    if (r.slider) { const v = SET[r.slider], sx = rx - 70; for (let j = 0; j < 10; j++) rect(sx + j * 7, cy - 2, 5, 4, j < Math.round(v * 10) ? (on ? TH.ember : '#8e877b') : '#27231f'); }
    else if (r.v) { const v = r.v(); text(fitText(v, b.w - textW(s, b.sc) - (r.diff ? 44 : 28)), rx - (r.sub ? 9 : 0), vy - (isCJK(v) ? 2 : 0), on ? TH.bone2 : TH.dim, 1, 'right'); }
    if (r.sub) text('>', rx, vy, on ? TH.ember : TH.faint, 1, 'right');
    if (r.clr) { const src = r.clrI ? NET.iclears : NET.clears, n = src ? src[r.clr] : null, ns = n == null ? '-' : String(n | 0); text(ns, rx, vy, on || cur ? TH.bone : TH.bone2, 1, 'right'); drawGlobe(rx - textW(ns) - 7, cy, 3.5, on || cur ? TH.bone2 : TH.dim); }
    if (r.aff) { const af = (gpLoad().girls[r.aff] || {}).aff || 0, n2 = Math.round(5 * af / AFF_MAX); for (let j = 0; j < 5; j++) rect(rx - (4 - j) * 6 - 4, cy - 1, 4, 3, j < n2 ? TH.pink : '#24221f'); }
    ctx.globalAlpha = 1; });
  ctx.globalAlpha = 1;
  if (TBAR.shown === 0) drawDeployCard(t, k);
}
// a small wire globe (the count beside it is every clear of that level on DZMM)
function drawGlobe(x, y, r, c) {
  ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = .5; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x, y, r * .45, r, 0, 0, 6.2832); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y);
  for (const f of [-.55, .55]) { const yy = y + f * r, hw = Math.sqrt(1 - f * f) * r; ctx.moveTo(x - hw, yy); ctx.lineTo(x + hw, yy); } ctx.stroke(); ctx.restore();
}
// the chosen threat level, pinned above the jeep: its medallion and name, what it is, what it changes, what a clear brings, and the way out
function depCard() { const w = 180, tx = (TBAR.fx == null ? CPOS.truck : TBAR.fx) - CAMP.cam, g0 = campGround(), fy = g0 - 30, z = 1 + .32 * easeInOut(clamp(TBAR.fk, 0, 1)), top = fy + (g0 - 60 - fy) * z, y = 18, h = Math.round(clamp(top - 6 - y, 120, 156));
  return { x: Math.round(clamp(tx - w / 2 + 14, W / 2 + 6, W - w - 10)), y, w, h }; }
function cardPlate(x, y, w, h) { rect(x, y, w, h, 'rgba(8,8,8,.95)'); box(x, y, w, h, null, WIN_EDGE); }
function drawDeployCard(t, k0) {
  DEP.btn = null; DEP.card = null; DEP.modBtn = null; const d = DIFFS[DEP.pick]; if (!d) return; const q = easeOut(clamp(DEP.t / .28, 0, 1)) * k0; if (q <= .01) return;
  const r = depCard(), c = d.c(), x = r.x + 10, iw = r.w - 20, lh = lineH(), by = r.y + r.h - 22, a0 = ctx.globalAlpha, mod = typeof modifierEntryAllowed === 'function' && modifierEntryAllowed(), mw = mod ? Math.max(46, Math.round(iw * .34)) : 0;
  DEP.card = r; DEP.btn = { x, y: by, w: iw - (mod ? mw + 4 : 0), h: 16 }; DEP.modBtn = mod ? { x: x + iw - mw, y: by, w: mw, h: 16 } : null;
  ctx.globalAlpha = a0 * q; ctx.save(); ctx.translate(0, Math.round((1 - q) * -12)); cardPlate(r.x, r.y, r.w, r.h, c);
  drawDiffEmblem(d.id, x - 3, r.y + 7, 1.4, t); textS(tr(d.nm), x + 36, r.y + 9, c, 2); for (let p = 0; p < DIFFS.length; p++) rect(x + 37 + p * 6, r.y + 31, 5, 2, p < d.pips ? c : '#24221f');
  const sep = by - 4 - lh * 3 - 6; let y = r.y + 45;
  for (const l of wrapW(tr(d.tag), iw).slice(0, 4)) { if (y + lh > sep) break; text(l, x, y, TH.bone2); y += lh; }
  rect(x, sep, iw, 1, TH.line); rect(x, sep, 14, 1, thA(c, .7)); y = sep + 5;
  text(L('dw_reward'), x, y, TH.faint); y += lh;
  { const s1 = '×' + (PROOF_BY_DIFF[d.id] || 3); drawProof(x, y); text(s1, x + 11, y + 1, TH.gold); let rx = x + 11 + textW(s1) + 12;
    if (typeof evOpen === 'function' && evOpen()) { const s2 = '+' + (EV_MAT[d.id] || 0); rect(rx, y + 2, 7, 5, '#3a2a14'); rect(rx, y + 2, 7, 1, '#8a6a30'); text(s2, rx + 10, y + 1, TH.bone2); } }
  drawBtn(DEP.btn.x, DEP.btn.y, DEP.btn.w, DEP.btn.h, L('dw_go', tr(d.nm)), true, c);
  if (DEP.modBtn) { const b = DEP.modBtn; drawBtn(b.x, b.y, b.w, b.h, '修饰符', !TOUCH.on && inR(b, Input.mx, Input.my), '#bd9cdb'); }
  ctx.restore(); ctx.globalAlpha = a0;
}
// ---------------- docked windows: the codex, the leaderboard and the black market open beside the column, sliding in from the open side ----------------
// the column stays, slimmer, and picks what the window shows; the window lays itself out as if the screen were its own box (withDock)
const DOCK_PAGES = new Set(['codex', 'board', 'market', 'achv']);
const DOCK = { k: 0, out: null, r: null, cur: null };
function docked() { return G.state === 'menu' && DOCK_PAGES.has(MENU.page) && TBAR.area >= 0 && !(MENU.page === 'board' && BOARD.detail); }
function dockRect() { const right = areaRight(tbItems()[Math.max(0, TBAR.area)]), w = W - 128; return { x: right ? 6 : 122, y: 8, w, h: H - TB_H - 14, fromLeft: right }; }
function dockGo(pg, i) {
  if (pg === 'achv') { if (MENU.page !== 'achv') { MENU.stack = []; DOCK.k = 0; DOCK.out = null; DOCK.cur = null; openAchv(); } return; }
  if (MENU.page === pg) { if (pg === 'codex') { if (CX.tab !== i) cxTab(i); } else if (pg === 'market') openMarketTab(i); else setTab(i); return; }
  MENU.page = 'main'; MENU.stack = []; DOCK.k = 0; DOCK.out = null; DOCK.cur = null;
  if (pg === 'codex') openCodex(i); else if (pg === 'market') openMarketAt(i); else openBoardAt(i);
}
function dockClose() { if (DOCK_PAGES.has(MENU.page)) { MENU.page = 'main'; MENU.stack = []; MENU.t = 99; } }
// W, H, the drawing origin and the pointer all become the window's own while fn runs
function withDock(r, fn) { const sw = W, sh = H, mx = Input.mx, my = Input.my, ox = r.x - 24 + (r.sx || 0), oy = r.y - 12;
  W = r.w + 48; H = r.h + 24; Input.mx = mx - ox; Input.my = my - oy; ctx.save(); ctx.translate(ox, oy);
  try { fn(); } finally { ctx.restore(); W = sw; H = sh; Input.mx = mx; Input.my = my; } }
function updateDocked(rdt) {
  if (Input.clicked && wcChipClick()) return;
  MENU.t += rdt; campBackdropTick(rdt); evTick(); DOCK.k = Math.min(1, DOCK.k + rdt * 4); TBAR.dk = Math.min(1, (TBAR.dk || 0) + rdt * 5); TBAR.subT += rdt;
  TBAR.fk = lerp(TBAR.fk, 1, Math.min(1, rdt * 6)); if (TBAR.shown === TBAR.area) TBAR.k = Math.min(1, TBAR.k + rdt * 3.2);
  const lay = tbLayout(), mx = Input.mx, my = Input.my, it = lay.items[TBAR.area], rows = it.rows(), b = areaBox(it, rows), r = dockRect();
  TBAR.hov = lay.items.findIndex(p => inR(p, mx, my));
  TBAR.rowH = mx >= b.x - 6 && mx < b.x + b.w && my >= b.ry && my < b.ry + rows.length * b.rh ? Math.floor((my - b.ry) / b.rh) : -1;
  if (Input.clicked && !inR(r, mx, my)) { Input.clicked = false;
    if (TBAR.hov >= 0) { const h = TBAR.hov; dockClose(); tbSet(TBAR.area === h ? -1 : h); return; }
    if (TBAR.rowH >= 0) { const row = rows[TBAR.rowH]; if (!row.head && !row.info && !row.off) { TBAR.sel = TBAR.rowH; tbAct(row); } return; }
    dockClose(); AU.play('menu', .8); return; }
  withDock(r, () => { if (Input.clicked && inR(WIN_CLOSE(), Input.mx, Input.my)) { Input.clicked = false; ESC_TAP = true; AU.play('menu', .8); }
    const pg = MENU.page; if (pg === 'board') updateBoard(rdt); else if (pg === 'market') updateMarket(rdt); else if (pg === 'achv') updateAchv(rdt); else updateCodex(rdt); });
}
function drawDockWin(pg, r, k, t) { if (!r) return; const e = easeOut(clamp(k, 0, 1)), sx = Math.round((1 - e) * (r.fromLeft ? -(r.x + r.w + 14) : W - r.x + 14));
  WINX.nobd = true; try { withDock(Object.assign({}, r, { sx }), () => { if (pg === 'board') drawBoard(t); else if (pg === 'market') drawMarket(t); else if (pg === 'achv') drawAchv(t); else drawCodex(); }); } finally { WINX.nobd = false; } }
// ---------------- the emblem (the opening screen): a cracked seed with a sprout, held in a hazard ring broken in three places ----------------
// built once at device resolution from four masks (all of it, the seed, the crack, the sprout), then worn like the lettermark
const EMBL = { cv: null, us: 0, S: 100, sparks: [] };
function buildEmblem() {
  const k = US, S = EMBL.S, P = Math.round(S * k), cx = 50, cy = 47;
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = P; const g = c.getContext('2d'); g.scale(k, k); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = 'round'; g.lineJoin = 'round'; return g; };
  const g = mk(), gs = mk(), gc = mk(), gp = mk();
  g.beginPath(); g.arc(cx, cy, 42, 0, 6.2832); g.arc(cx, cy, 34.5, 0, 6.2832, true); g.fill('evenodd');                 // the ring
  g.lineWidth = 1.3; g.beginPath(); g.arc(cx, cy, 30.5, 0, 6.2832); g.stroke();                                          // a thin inner ring
  for (let i = 0; i < 36; i++) { if (i % 3 === 0) continue; const a = i / 36 * 6.2832; g.beginPath(); g.arc(cx + Math.cos(a) * 38.2, cy + Math.sin(a) * 38.2, .9, 0, 6.2832); g.save(); g.globalCompositeOperation = 'destination-out'; g.fill(); g.restore(); } // stamped holes
  g.save(); g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 3; i++) { const a = Math.PI / 2 + i * 2.0944; g.save(); g.translate(cx + Math.cos(a) * 37, cy + Math.sin(a) * 37); g.rotate(a); g.fillRect(-8, -3.2, 16, 6.4); g.restore(); } g.restore(); // broken in three places
  const seed = c => { c.beginPath(); c.moveTo(cx, cy - 19); c.bezierCurveTo(cx + 16, cy - 11, cx + 15, cy + 13, cx, cy + 22); c.bezierCurveTo(cx - 15, cy + 13, cx - 16, cy - 11, cx, cy - 19); c.closePath(); c.fill(); };
  seed(g); seed(gs);
  const crack = [[cx, cy - 17], [cx + 2.2, cy - 10], [cx - 1.2, cy - 3], [cx + 2.6, cy + 4], [cx - 1, cy + 11], [cx + 1, cy + 18]];
  gc.lineWidth = 2.4; gc.beginPath(); crack.forEach(([x, y], i) => i ? gc.lineTo(x, y) : gc.moveTo(x, y)); gc.stroke();
  gc.lineWidth = 1; gc.beginPath(); gc.moveTo(cx - 1.2, cy - 3); gc.lineTo(cx - 6, cy + 1); gc.lineTo(cx - 8, cy + 6); gc.stroke(); gc.beginPath(); gc.moveTo(cx + 2.6, cy + 4); gc.lineTo(cx + 7, cy + 8); gc.stroke(); // branches
  const sprout = c => { c.lineWidth = 1.7; c.beginPath(); c.moveTo(cx, cy - 18); c.quadraticCurveTo(cx - 2.5, cy - 24, cx + 1, cy - 29.5); c.stroke();
    c.beginPath(); c.moveTo(cx + 1, cy - 27.5); c.quadraticCurveTo(cx + 9, cy - 33, cx + 12, cy - 27.5); c.quadraticCurveTo(cx + 6.5, cy - 24.5, cx + 1, cy - 27.5); c.fill();
    c.beginPath(); c.moveTo(cx - .5, cy - 24); c.quadraticCurveTo(cx - 7.5, cy - 28.5, cx - 10, cy - 24); c.quadraticCurveTo(cx - 5, cy - 21, cx - .5, cy - 24); c.fill(); };
  sprout(g); sprout(gp);
  for (const [dx, len] of [[-15, 8], [-8.5, 15], [10, 6], [17, 11], [-22, 4]]) { const x = cx + dx, y0 = cy + Math.sqrt(42 * 42 - dx * dx) - 2.5; g.fillRect(x, y0, 1.7, len); g.beginPath(); g.arc(x + .85, y0 + len, 1.5, 0, 6.2832); g.fill(); } // drips
  const D = g.getImageData(0, 0, P, P).data, Ds = gs.getImageData(0, 0, P, P).data, Dc = gc.getImageData(0, 0, P, P).data, Dp = gp.getImageData(0, 0, P, P).data;
  const A = (X, Y) => X >= 0 && Y >= 0 && X < P && Y < P && D[(Y * P + X) * 4 + 3] > 110, kk = Math.max(1, Math.ceil(k * .8));
  const RAMP2 = ['#151312', '#22201d', '#33302b', '#48443d', '#615b52', '#7d766b', '#9b9384', '#b9b09f', '#d6cdbb', '#ece4d4'].map(c => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; });
  const mix = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f), rust = [92, 40, 22], ash = [118, 132, 94], out = new Uint8ClampedArray(P * P * 4);
  for (let Y = 0; Y < P; Y++) for (let X = 0; X < P; X++) { const id = Y * P + X, i = id * 4; if (D[i + 3] <= 110) continue;
    const isSeed = Ds[i + 3] > 110, isCrack = isSeed && Dc[i + 3] > 110, isSprout = Dp[i + 3] > 110, ry = Y / k, ring = !isSeed && !isSprout && ry < cy + 41;
    if (isCrack) { const c = chash(X, Y, 3) > .45 ? [255, 150, 62] : [150, 50, 18]; out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2]; out[i + 3] = 255; continue; }
    let edge = 0; for (const [dx, dy] of [[kk, 0], [-kk, 0], [0, kk], [0, -kk]]) if (!A(X + dx, Y + dy)) edge++;
    if (ring && edge && (cfbm(X * .45, Y * .45, 4, 17) > .66 || chash(X, Y, 23) > .95)) continue; // worn edges
    if (ring && !edge && cfbm(X * .7, Y * .7, 3, 29) > .86 && chash(X, Y, 5) > .5) continue;     // pits
    let v = .68 - (ry / S) * .3 + (cfbm(X * .35, Y * .35, 5, 7) - .5) * .3 + (chash(X, Y, 9) - .5) * .07;
    if (!A(X, Y - kk)) v += .26; if (!A(X, Y + kk)) v -= .3; if (!A(X - kk, Y)) v += .07; if (!A(X + kk, Y)) v -= .06;
    if (isSeed) v -= .1; v = clamp(v, 0, .999); const f = v * (RAMP2.length - 1), lo = Math.floor(f); let c = mix(RAMP2[lo], RAMP2[Math.min(RAMP2.length - 1, lo + 1)], f - lo);
    if (cfbm(X * .22, Y * .5, 9, 31) > .64) c = mix(c, rust, Math.min(.6, (cfbm(X * .22, Y * .5, 9, 31) - .64) * 3));
    if (isSprout) c = mix(c, ash, .55);
    if (isSeed) { let near = 99; for (let dy = -3 * kk; dy <= 3 * kk; dy += kk) for (let dx = -3 * kk; dx <= 3 * kk; dx += kk) { const j = ((Y + dy) * P + X + dx) * 4; if (Dc[j + 3] > 110) near = Math.min(near, Math.abs(dx) + Math.abs(dy)); } if (near < 99) c = mix(c, [210, 96, 40], .45 * (1 - near / (6 * kk))); }
    if (ry > cy + 40) c = mix(c, [74, 26, 20], .75); // the drips
    out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2]; out[i + 3] = 255; }
  const art = document.createElement('canvas'); art.width = art.height = P; art.getContext('2d').putImageData(new ImageData(out, P, P), 0, 0);
  const cv = document.createElement('canvas'); cv.width = cv.height = P; const x2 = cv.getContext('2d'); x2.shadowColor = 'rgba(0,0,0,.85)'; x2.shadowBlur = 5 * k; x2.shadowOffsetX = 2 * k; x2.shadowOffsetY = 3 * k; x2.drawImage(art, 0, 0);
  EMBL.cv = cv; EMBL.us = US;
}
function drawEmblem(x, y, t) {
  if (!EMBL.cv || EMBL.us !== US) buildEmblem(); const A0 = ctx.globalAlpha;
  ctx.drawImage(EMBL.cv, x, y, EMBL.S, EMBL.S);
  const ex = x + 50, ey = y + 47, br = .6 + Math.sin(t * 1.7) * .2 + Math.sin(t * 6.1) * .06;
  ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(ex, ey, 0, ex, ey, 24); gr.addColorStop(0, `rgba(255,140,60,${.4 * br})`); gr.addColorStop(1, 'rgba(255,90,30,0)'); ctx.fillStyle = gr; ctx.fillRect(ex - 24, ey - 24, 48, 48); ctx.globalCompositeOperation = 'source-over';
  if (Math.random() < FRAME_DT * 3) EMBL.sparks.push({ x: ex + rand(-2, 3), y: ey + rand(-14, 14), vy: -rand(6, 14), vx: rand(-3, 3), life: rand(1, 2.2) });
  for (let i = EMBL.sparks.length - 1; i >= 0; i--) { const s = EMBL.sparks[i]; s.life -= FRAME_DT; s.x += s.vx * FRAME_DT; s.y += s.vy * FRAME_DT; if (s.life <= 0) { EMBL.sparks.splice(i, 1); continue; } ctx.globalAlpha = A0 * Math.min(1, s.life); rect(s.x, s.y, .6, .6, s.life > 1.2 ? '#ffb070' : '#d0702e'); }
  ctx.globalAlpha = A0;
}

// ---------------- the opening card: "iChing  presents" on one line ----------------
// A fine serif, widely tracked; both words share a size, with presents in italic.
// Letters surface one after another, and a sheen crosses the name once.
const PRS_SERIF = '"Didot","Bodoni 72","Bodoni MT","Playfair Display","Cormorant Garamond","Palatino Linotype","Book Antiqua",Georgia,serif';
const PRS = { k: '', L: null };
function prsLayout() { const key = W + 'x' + H; if (PRS.k === key) return PRS.L; ctx.save();
  const A = 'iChing', B = 'presents', fa = `400 24px ${PRS_SERIF}`, fb = `italic 400 24px ${PRS_SERIF}`, ta = 3.2, tb = 2.6, gap = 22;
  ctx.font = fa; const a = []; let x = 0; for (const ch of A) { a.push({ ch, x }); x += ctx.measureText(ch).width + ta; } const wa = x - ta;
  ctx.font = fb; const b = []; x = 0; for (const ch of B) { b.push({ ch, x }); x += ctx.measureText(ch).width + tb; } const wb = x - tb; ctx.restore();
  const total = wa + gap + wb, x0 = Math.round(W / 2 - total / 2), y = Math.round(H / 2 + 7);
  a.forEach(c => c.x += x0); b.forEach(c => c.x += x0 + wa + gap);
  return PRS.k = key, PRS.L = { a, b, fa, fb, y, x0, wa, wb, total }; }
function drawPresents(t) {
  const L4 = prsLayout(), A0 = ctx.globalAlpha; ctx.save(); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  // the name, letter by letter
  ctx.font = L4.fa; L4.a.forEach((c, i) => { const q = easeOut(clamp((t - .15 - i * .085) / .5, 0, 1)); if (q <= 0) return; ctx.globalAlpha = A0 * q; ctx.fillStyle = '#ece6da'; ctx.fillText(c.ch, c.x, L4.y + (1 - q) * 3); });
  // a sheen passes across the name once it has settled
  { const k = clamp((t - 1.45) / .75, 0, 1); if (k > 0 && k < 1) { const cx = L4.x0 - 20 + (L4.wa + 40) * easeInOut(k), g = ctx.createLinearGradient(cx - 16, 0, cx + 16, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,246,228,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.globalAlpha = A0; ctx.fillStyle = g; for (const c of L4.a) ctx.fillText(c.ch, c.x, L4.y); } }
  // the word, lighter and quicker
  ctx.font = L4.fb; L4.b.forEach((c, i) => { const q = easeOut(clamp((t - .95 - i * .05) / .45, 0, 1)); if (q <= 0) return; ctx.globalAlpha = A0 * q; ctx.fillStyle = '#9a9284'; ctx.fillText(c.ch, c.x, L4.y + (1 - q) * 2); });
  ctx.restore(); ctx.globalAlpha = A0;
}

// ---------------- the partners: every girl a tall strip of her portrait, side by side; the chosen one opens wide ----------------
const PTN = { sel: -1, w: [], hov: -1, hits: [], t: 0 };
const PTN_AREA = 1;
function ptnIds() { return SURV_IDS; }
function ptnInit() { const ids = ptnIds(); if (PTN.sel < 0 || PTN.sel >= ids.length) { const m = ids.findIndex(girlMet); PTN.sel = Math.max(0, m); } if (PTN.w.length !== ids.length) PTN.w = ids.map((_, i) => i === PTN.sel ? 3.4 : 1); PTN.t = 0; }
function ptnLayout() {
  const ids = ptnIds(), top = 0, bot = H - TB_H, sum = PTN.w.reduce((a, b) => a + b, 0) || 1; let x = 0;
  return ids.map((id, i) => { const w = W * PTN.w[i] / sum, o = { id, i, x: Math.round(x), y: top, w: Math.round(x + w) - Math.round(x), h: bot - top }; x += w; return o; });
}
function ptnSelect(i) { const ids = ptnIds(); i = (i + ids.length) % ids.length; if (i === PTN.sel) return; PTN.sel = i; AU.play('menu', 1 + i * .04); }
// four pages in two rows: profile / skill, gear / album
function ptnButtons(o) { const bw = Math.min(64, Math.floor((o.w - 24 - 4) / 2)), x0 = o.x + 12; return ['g_tabInfo', 'g_tabUpg', 'g_tabGear', 'g_tabGal'].map((k, i) => ({ k, j: [0, 1, 3, 2][i], x: x0 + (i % 2) * (bw + 4), y: o.y + o.h - (i < 2 ? 40 : 23), w: bw, h: 14 })); }
function updatePartners(rdt) {
  PTN.t += rdt; const ids = ptnIds(), lay = ptnLayout(), mx = Input.mx, my = Input.my;
  PTN.w = PTN.w.map((w, i) => lerp(w, i === PTN.sel ? 3.4 : 1, Math.min(1, rdt * 9)));
  PTN.hov = my < H - TB_H ? lay.findIndex(o => mx >= o.x && mx < o.x + o.w) : -1;
  const cur = lay[PTN.sel], met = cur && girlMet(cur.id), btns = cur && met ? ptnButtons(cur) : [];
  if (Input.clicked && PTN.hov >= 0) { Input.clicked = false; const b = btns.find(q => inR(q, mx, my) && PTN.hov === PTN.sel);
    if (b) { AU.play('menuOk'); openGirlTab(cur.id, b.j); return; } if (PTN.hov !== PTN.sel) ptnSelect(PTN.hov); else if (!met) AU.play('locked'); return; }
  if (pressed('KeyA') || pressed('ArrowLeft')) ptnSelect(PTN.sel - 1); if (pressed('KeyD') || pressed('ArrowRight')) ptnSelect(PTN.sel + 1);
  if (pressed('Enter') || pressed('Space')) { if (met) { AU.play('menuOk'); openGirlTab(cur.id, 0); } else AU.play('locked'); }
  if (pressed('Escape')) tbSet(-1);
}
function drawPartners(t) {
  const k = clamp(TBAR.k, 0, 1); if (k < .01) return; const lay = ptnLayout();
  lay.forEach((o, n) => { const id = o.id, met = girlMet(id), on = n === PTN.sel, hv = n === PTN.hov && !on && !TOUCH.on, e = easeOut(clamp(k * 2 - n * .14, 0, 1)); if (e <= 0) return;
    const S = SURV[id], y = o.y, sx = Math.round((1 - e) * (W - o.x + 10)); ctx.save(); ctx.translate(sx, 0); ctx.beginPath(); ctx.rect(o.x, o.y, o.w, o.h); ctx.clip(); ctx.globalAlpha = clamp(e * 1.5, 0, 1); const a = ctx.globalAlpha;
    // the strip: a dark ground in her colour, then her portrait (dimmed unless chosen)
    rect(o.x, o.y, o.w, o.h, '#050404'); { const g = ctx.createLinearGradient(0, o.y, 0, o.y + o.h); g.addColorStop(0, thA(S.c, met ? .14 : .05)); g.addColorStop(1, 'rgba(5,4,4,1)'); rect(o.x, o.y, o.w, o.h, g); }
    { const P = portraitReady(id), ph = o.h * 1.2, pw = ph * PORT_AR, px = o.x + o.w / 2 - pw / 2, py = y - o.h * .03;
      // a girl not met yet: her portrait in black and white
      if (P) { ctx.imageSmoothingEnabled = true; if (!met) ctx.filter = 'grayscale(1) brightness(' + (on || hv ? .8 : .6) + ')'; ctx.drawImage(on || hv ? P.cv : P.dk, px, py, pw, ph); ctx.filter = 'none'; ctx.imageSmoothingEnabled = false; }
      else { ctx.globalAlpha = a * .25; disc(o.x + o.w / 2, py + ph * .2, 22, S.c); rect(o.x + o.w / 2 - 16, py + ph * .3, 32, ph, S.c); ctx.globalAlpha = a; }
      if (!on) { ctx.globalAlpha = a * (hv ? .25 : .45); rect(o.x, o.y, o.w, o.h, '#060505'); ctx.globalAlpha = a; } }
    // the foot of the strip: her name; the chosen one gets more
    { const g = ctx.createLinearGradient(0, o.y + o.h - (on ? 90 : 40), 0, o.y + o.h); g.addColorStop(0, 'rgba(5,4,4,0)'); g.addColorStop(1, 'rgba(5,4,4,.95)'); rect(o.x, o.y + o.h - (on ? 90 : 40), o.w, on ? 90 : 40, g); }
    rect(o.x, o.y, o.w, on ? 2 : 1, on ? S.c : thA(S.c, met ? .5 : .2));
    const nm = met ? svName(id) : '???';
    if (on) { textS(nm, o.x + 12, o.y + o.h - 70, TH.bone, 2);
      if (met) { const af = (gpLoad().girls[id] || {}).aff || 0, n2 = Math.round(10 * af / AFF_MAX); for (let j = 0; j < 10; j++) rect(o.x + 12 + j * 7, o.y + o.h - 46, 5, 3, j < n2 ? TH.pink : '#24221f'); text(af + ' / ' + AFF_MAX, o.x + 86, o.y + o.h - 47, TH.dim, 1);
        for (const b of ptnButtons(o)) drawBtn(b.x, b.y, b.w, b.h, L(b.k), !TOUCH.on && sx === 0 && inR(b, Input.mx, Input.my), S.c); }
      else text(L('ptn_unmet'), o.x + 12, o.y + o.h - 44 - (isCJK(L('ptn_unmet')) ? 1 : 0), TH.dim, 1); }
    else { const s2 = fitText(nm, o.w - 6); text(s2, o.x + o.w / 2, o.y + o.h - 16 - (isCJK(s2) ? 2 : 0), hv ? TH.bone : TH.bone2, 1, 'center'); }
    ctx.restore(); ctx.save(); ctx.translate(sx, 0);
    if (n > 0) { ctx.globalAlpha = a; rect(o.x, o.y, 1, o.h, '#000'); }
    if (on) { ctx.globalAlpha = a; rect(o.x, o.y, 1, o.h, thA(S.c, .6)); rect(o.x + o.w - 1, o.y, 1, o.h, thA(S.c, .6)); }
    ctx.restore(); ctx.globalAlpha = 1; });
}

// ---------------- the world channel on the bar: the newest message and the unread count; a click opens it upward ----------------
function wcChipBox() { const lay = tbLayout(), last = lay.items[lay.items.length - 1], lb = NET.ready ? loginBox() : { x: W - 10 }, x = last.x + last.w + 6, w = lb.x - 8 - x;
  return { x, y: lay.y + 3, w, h: TB_H - 6, ok: wcOn() && w >= 40 }; }
function wcChipClick() { const b = wcChipBox(); if (!b.ok || !inR(b, Input.mx, Input.my)) return false; Input.clicked = false; openWorld('bar'); return true; }
function drawWcChip(t, lay) {
  const b = wcChipBox(); if (!b.ok) return; const open = WC.open && WC.from === 'bar', hov = (!TOUCH.on && inR(b, Input.mx, Input.my)) || open, last = WC.msgs[WC.msgs.length - 1];
  if (last && WC.lastSeq !== last.seq) { if (WC.lastSeq !== undefined) WC.flashT = t; WC.lastSeq = last.seq; }
  const fl = clamp(1 - (t - (WC.flashT || -9)) / .8, 0, 1);
  rect(b.x, b.y, b.w, b.h, open ? 'rgba(208,112,46,.16)' : hov ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.28)'); box(b.x, b.y, b.w, b.h, null, open ? thA(TH.ember, .6) : hov ? TH.line2 : TH.line);
  if (fl > 0) { ctx.globalAlpha *= fl; rect(b.x, b.y, b.w, b.h, 'rgba(208,112,46,.22)'); ctx.globalAlpha /= fl || 1; }
  rect(b.x, b.y, b.w, 1, open ? TH.ember : thA(TH.ember, .35));
  // a small speech bubble
  { const ix = b.x + 5, iy = b.y + 5, c = hov ? TH.bone : TH.dim; box(ix, iy, 9, 6, null, c); rect(ix + 2, iy + 6, 2, 2, c); for (let i = 0; i < 3; i++) rect(ix + 2 + i * 2, iy + 2, 1, 2, c); }
  // the unread count, a red pill on the right
  const n = wcUnread(), ns = n > 99 ? '99+' : String(n), bw = n > 0 ? Math.max(9, textW(ns) + 6) : 0, cy = b.y + Math.floor(b.h / 2);
  if (n > 0) { const bx = b.x + b.w - bw - 4; rect(bx, cy - 4, bw, 9, '#b8262e'); rect(bx, cy - 4, bw, 1, '#e05a5a'); text(ns, bx + bw / 2, cy - 2, '#ffffff', 1, 'center'); }
  // the newest message (it scrolls past when it does not fit)
  const tx = b.x + 18, tw = b.w - 18 - (bw ? bw + 8 : 4);
  let nm = '', msg; if (last) { nm = last.name + '：'; msg = last.text; } else msg = L(WC.busy || WC.nextPoll === 0 ? 'bd_loading' : 'wc_empty');
  const full = textW(nm) + textW(msg), cj = isCJK(nm + msg), ty = cy - 3 - (cj ? 2 : 0), nc = last ? (last.mine ? C.gold : wcColor(last.name)) : TH.faint, mc = last ? (hov ? TH.bone : TH.bone2) : TH.faint;
  ctx.save(); ctx.beginPath(); ctx.rect(tx, b.y, tw, b.h); ctx.clip();
  const put = ox => { if (nm) text(nm, ox, ty, nc); text(msg, ox + textW(nm), ty, mc); };
  if (full <= tw) put(tx); else { const gap = 30, off = ((t * 22) % (full + gap)); put(tx - off); put(tx - off + full + gap); }
  ctx.restore();
}

// ---------------- the work light: a tired bulb somewhere above the place, its beam full of dust ----------------
const LAMP = { flk: 0, next: 1.5, dust: null };
// how bright it is right now: a slow breathe and a mains buzz, and every few seconds it stutters (sometimes almost goes out)
function lampLevel(t) { const dt = FRAME_DT; LAMP.next -= dt; if (LAMP.next <= 0 && LAMP.flk <= 0) { LAMP.flk = rand(.15, .55); LAMP.next = rand(2.2, 6.5); LAMP.deep = Math.random() < .35; }
  let v = .92 + Math.sin(t * 1.7) * .04 + Math.sin(t * 50) * .015;
  if (LAMP.flk > 0) { LAMP.flk -= dt; const ph = Math.sin(t * 71) + Math.sin(t * 23.3) * .8; v *= ph > .25 ? 1 : ph > -.7 ? (LAMP.deep ? .25 : .55) : (LAMP.deep ? .05 : .3); }
  return v; }
function drawWorkLight(ox, g0, fk, t) {
  const v = lampLevel(t) * fk, z = 1 + .32 * fk, gz = g0 - 30 + 30 * z, top = -8, sx = ox - 10, sw = 7, bw = 66; if (v <= .01) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  // the beam: nested cones, each wider and fainter, so the edges are soft; brightest near the lamp
  for (const [k, a] of [[1.3, .035], [1.05, .05], [.78, .06], [.5, .07], [.25, .07]]) {
    const g = ctx.createLinearGradient(0, top, 0, gz); g.addColorStop(0, `rgba(255,222,170,${a * 1.8 * v})`); g.addColorStop(.55, `rgba(255,204,148,${a * v})`); g.addColorStop(1, `rgba(255,190,130,${a * .8 * v})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx - sw * k, top); ctx.lineTo(sx + sw * k, top); ctx.lineTo(ox + bw * k, gz); ctx.lineTo(ox - bw * k, gz); ctx.closePath(); ctx.fill(); }
  // the glare at the source
  { const r = ctx.createRadialGradient(sx, top + 4, 0, sx, top + 4, 46); r.addColorStop(0, `rgba(255,236,200,${.32 * v})`); r.addColorStop(1, 'rgba(255,220,170,0)'); ctx.fillStyle = r; ctx.fillRect(sx - 46, top - 40, 92, 90); }
  // dust turning slowly in the light (only where the beam is)
  if (!LAMP.dust) LAMP.dust = Array.from({ length: 34 }, () => ({ u: Math.random() * 2 - 1, y: Math.random(), s: rand(.3, 1), ph: rand(0, 6.28) }));
  for (const d of LAMP.dust) { d.y += FRAME_DT * .025 * d.s; if (d.y > 1) d.y -= 1; const yy = top + (gz - top) * d.y, half = sw + (bw - sw) * d.y, cx = lerp(sx, ox, d.y) + d.u * half * .8 + Math.sin(t * .6 + d.ph) * 3;
    const a = .55 * v * (1 - Math.abs(d.u) * .7) * d.s * (.6 + .4 * Math.sin(t * 2 + d.ph)); ctx.fillStyle = `rgba(255,238,205,${a})`; ctx.fillRect(cx, yy, .8, .8); }
  // the pool on the ground: an ellipse, a hot middle, a soft rim
  ctx.translate(ox, gz); ctx.scale(1, .26); { const r = ctx.createRadialGradient(0, 0, 0, 0, 0, bw * 1.5); r.addColorStop(0, `rgba(255,214,160,${.42 * v})`); r.addColorStop(.45, `rgba(255,190,130,${.18 * v})`); r.addColorStop(1, 'rgba(255,170,110,0)'); ctx.fillStyle = r; ctx.fillRect(-bw * 1.5, -bw * 1.5, bw * 3, bw * 3); }
  ctx.restore();
}
