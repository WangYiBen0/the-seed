// ===== ACHROMA bosses, remodelled: every boss drawn as something the outbreak made (stone, flesh, rust, fungus, glass) =====
// Replaces drawBossBase (looks 0-4) and drawBoss2 (looks 5-11); the gameplay tells (armor ring, eye colour, raised hand, glyphs,
// enrage ring, burn, freeze, the dash line) are all kept.
'use strict';
const BA = {
  flesh: ['#2a0e0e', '#4a1a18', '#6e2a24', '#93443a', '#b8685a', '#d8927e'], bone: ['#3a342a', '#6a604e', '#a0937a', '#d0c4a6', '#ece2c8'],
  stone: ['#141211', '#2a2725', '#3d3935', '#57514a', '#77706a', '#9a928a'], rust: ['#1a0d08', '#3d1d0f', '#6b351a', '#9d5a2c', '#c08050'],
  iron: ['#101214', '#1e2226', '#30363c', '#4a525a', '#6a747c', '#9aa4ac'], D: '#080505',
};
function bEll(x, y, rx, ry, c) { if (rx <= 0 || ry <= 0) return; x = Math.round(x); y = Math.round(y); ctx.fillStyle = c; const R = Math.ceil(ry);
  for (let j = -R; j <= R; j++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry)))); if (w > 0) ctx.fillRect(x - w, y + j, w * 2, 1); } }
function bPoly(pts, c) { ctx.fillStyle = c; ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(Math.round(px), Math.round(py)) : ctx.moveTo(Math.round(px), Math.round(py))); ctx.closePath(); ctx.fill(); }
// a shaded round mass: a dark rim, the body, light from the upper left
function bMass(x, y, rx, ry, ramp, K, lit = 1) { bEll(x, y, rx + 1, ry + 1, BA.D); bEll(x, y, rx, ry, K.c(ramp[1])); bEll(x - rx * .12, y - ry * .14, rx * .82, ry * .8, K.c(ramp[2])); if (lit) bEll(x - rx * .32, y - ry * .38, rx * .42, ry * .36, K.c(ramp[3])); }
const BOSS_ART = {
  // THE PETRIFIED: a giant grown over with concrete and stone; rebar through the shoulders; magma in the cracks; one eye in the chest
  0(b, x, y, t, K) { const S = BA.stone, c = K.c;
    for (const s of [-1, 1]) { rect(x + s * 7 - 4, y + 4, 8, 13, BA.D); rect(x + s * 7 - 3, y + 5, 6, 11, c(S[2])); rect(x + s * 7 - 3, y + 5, 6, 2, c(S[3])); pxLine(x + s * 7 - 1, y + 8, x + s * 7 + 1, y + 13, c(S[1])); }
    for (const s of [-1, 1]) { pxLine(x + s * 11, y - 12, x + s * 17, y + 1, BA.D, 5); pxLine(x + s * 11, y - 12, x + s * 17, y + 1, c(S[2]), 3); bMass(x + s * 18, y + 4, 5, 5, S, K); }
    bMass(x, y - 6, 15, 13, S, K); bEll(x - 5, y - 13, 4, 2, c(S[4]));
    pxLine(x - 12, y - 4, x - 3, y - 1, c(S[1])); pxLine(x + 3, y - 15, x + 7, y + 3, c(S[1])); pxLine(x - 6, y - 17, x - 10, y - 8, c(S[1]));
    pxLine(x - 10, y - 15, x - 15, y - 28, '#3a1e12', 2); pxLine(x + 8, y - 16, x + 12, y - 30, '#3a1e12', 2); pxLine(x + 11, y - 13, x + 19, y - 22, '#4a2818'); rect(x - 16, y - 29, 2, 1, '#9d5a2c'); rect(x + 12, y - 31, 2, 1, '#9d5a2c');
    bMass(x, y - 20, 5, 4, S, K, 0); rect(x - 2, y - 20, 1, 1, '#ff5a2a'); rect(x + 1, y - 20, 1, 1, '#ff5a2a');
    const glow = K.arm ? '#ffffff' : (((t * 6) | 0) % 2 ? '#ff7a2a' : '#e0402a'), F = [[-9, -2, -4, -10], [3, -12, 8, -4], [-2, 1, 4, 4], [6, -2, 11, 1], [-12, -9, -7, -14], [1, -16, -1, -19]];
    for (let i = 0; i < Math.min(F.length, 2 + b.phase * 2); i++) { const [a1, b1, a2, b2] = F[i]; pxLine(x + a1, y + b1, x + a2, y + b2, glow); }
    rect(x - 7, y - 9, 14, 4, BA.D); rect(x - 5 + K.ex, y - 8, 6, 2, K.arm ? '#ffffff' : '#ff3a2a'); rect(x - 3 + K.ex, y - 8, 2, 1, '#ffd0a0');
    if (K.fl) return; for (let i = 0; i < 5; i++) rect(x - 11 + i * 5, y - 1 + (i % 2) * 3, 2, 1, '#3a4a2a'); },
  // THE PARASITE QUEEN: a swollen egg sac under a chitin body, a crown of bone, six legs that never stop
  1(b, x, y, t, K) { const c = K.c; y += Math.sin(t * 3) * 2;
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const ph = t * 8 + i * 2 + (s > 0 ? 1 : 0), kx = x + s * (4 + i * 3), ky = y - 3 + i * 3, fx = kx + s * (10 + Math.sin(ph) * 2), fy = ky + 8 + Math.cos(ph) * 1.5, jx = (kx + fx) / 2 + s * 2, jy = ky - 4;
      pxLine(kx, ky, jx, jy, BA.D, 2); pxLine(jx, jy, fx, fy, BA.D, 2); pxLine(kx, ky, jx, jy, c('#3a2228')); pxLine(jx, jy, fx, fy, c('#3a2228')); rect(fx, fy, 1, 1, c('#d0c4a6')); }
    bEll(x, y + 7, 14, 10, BA.D); bEll(x, y + 7, 13, 9, c('#5a2a36')); bEll(x - 2, y + 5, 9, 6, c('#7a4252')); bEll(x - 4, y + 3, 4, 2, c('#a06072'));
    for (let k = 0; k < 4; k++) pxLine(x - 9 + k * 6, y + 1, x - 10 + k * 6, y + 14, c('#3a1a24'));
    for (let i = 0; i < 7; i++) { const a = i * .9 + t * .5, ex2 = x + Math.cos(a) * 7, ey2 = y + 8 + Math.sin(a) * 4; disc(ex2, ey2, 1.5, c('#d8c8a0')); rect(ex2, ey2 - 1, 1, 1, c('#fff8e0')); }
    bMass(x, y - 4, 7, 5, ['', '#2a1a20', '#3a2228', '#5a3a44'], K); bMass(x, y - 12, 5, 4, ['', '#3a2228', '#4a2a32', '#6a4a52'], K);
    for (let i = 0; i < 5; i++) { const sx = x - 8 + i * 4, h = i % 2 ? 6 : 10; pxLine(sx, y - 15, sx + (i - 2), y - 15 - h, BA.D, 2); pxLine(sx, y - 15, sx + (i - 2), y - 15 - h, c('#d0c4a6')); rect(sx + (i - 2), y - 16 - h, 1, 1, b.phase > (i % 3) ? C.violet : c('#ece2c8')); }
    const eye = K.arm ? '#ffffff' : '#ff3a4a'; rect(x - 3 + K.ex * .4, y - 13, 2, 1, eye); rect(x + 1 + K.ex * .4, y - 13, 2, 1, eye); rect(x + K.ex * .4, y - 15, 1, 1, eye);
    const m = Math.sin(t * 10) * 1.5; pxLine(x - 2, y - 9, x - 5 - m, y - 5, c('#d0c4a6')); pxLine(x + 2, y - 9, x + 5 + m, y - 5, c('#d0c4a6'));
    for (let i = 0; i < 6; i++) { const a = t * 1.5 + i * 1.05; rect(x + Math.cos(a) * 20, y + Math.sin(a) * 10 + 2, 1, 1, i % 2 ? C.lime : '#a06072'); } },
  // THE INK EYE: an eye the size of a person in a socket of raw flesh, trailing its nerves
  2(b, x, y, t, K) { const c = K.c, R = 14 + Math.sin(t * 2);
    for (let i = 0; i < 5; i++) { let px = x + (i - 2) * 4, py = y + R - 2; for (let k = 0; k < 7; k++) { const nx = px + Math.sin(t * 3 + i + k * .7) * 2, ny = py + 3; pxLine(px, py, nx, ny, c(k > 4 ? '#4a1a18' : '#6e2a24')); px = nx; py = ny; } }
    for (let i = 0; i < 8; i++) { const a = t * .6 + i * .785, r1 = R + 3, r2 = R + 8 + Math.sin(t * 4 + i) * 2; pxLine(x + Math.cos(a) * r1, y + Math.sin(a) * r1, x + Math.cos(a) * r2, y + Math.sin(a) * r2, i % 2 ? c('#93443a') : c('#d0c4a6')); }
    bEll(x, y, R + 3, R + 2, BA.D); bEll(x, y, R + 2, R + 1, c('#6e2a24')); bEll(x, y, R, R - 1, c('#b8a888')); bEll(x - 1, y - 1, R - 1, R - 2, c('#dccfb2'));
    for (let i = 0; i < 9; i++) { const a = i * .7 + .3; pxLine(x + Math.cos(a) * R * .95, y + Math.sin(a) * R * .9, x + Math.cos(a + .3) * R * .55, y + Math.sin(a + .3) * R * .5, c('#b0303a')); }
    const ix = x + K.ex * 2, iy = y + K.ey * 2; disc(ix, iy, 7, '#2a0808'); disc(ix, iy, 6, K.arm ? '#8e877b' : c('#8a1a1a')); disc(ix, iy, 4, K.arm ? '#bdb5a6' : c('#c8323a')); disc(ix, iy, 2.5, '#050202'); rect(ix - 3, iy - 3, 2, 1, '#ffffff');
    const blink = (t % 4) < .14; ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, R + .5, R - .5, 0, 0, 6.283); ctx.clip();
    if (blink) rect(x - R - 1, y - R - 1, R * 2 + 2, R * 2 + 2, c('#93443a')); else { rect(x - R - 1, y - R - 1, R * 2 + 2, 4, c('#93443a')); rect(x - R - 1, y + R - 4, R * 2 + 2, 4, c('#6e2a24')); for (let i = -3; i <= 3; i++) { rect(x + i * 3, y - R + 3, 1, 2, '#3a1010'); rect(x + i * 3 + 1, y + R - 5, 1, 2, '#3a1010'); } }
    ctx.restore(); },
  // THE ARBITER: a tall judge in a robe sewn from body bags, a gas mask for a face, meat hooks for hands
  3(b, x, y, t, K) { const c = K.c; y += Math.sin(t * 2) * 2;
    for (const sd of [-1, 1]) { const raised = b.hand === sd, hx = x + sd * 21, hy = y - 2 + Math.sin(t * 3 + sd) * 2 - (raised ? 10 : 0);
      pxLine(x + sd * 6, y - 6, hx, hy, BA.D, 3); pxLine(x + sd * 6, y - 6, hx, hy, c('#2e322a'), 1); pxLine(hx, hy, hx, hy + 6, c('#8a8a90')); pxLine(hx, hy + 6, hx - sd * 3, hy + 4, c('#8a8a90')); rect(hx - sd * 3, hy + 3, 1, 1, c('#d8d8e0'));
      if (raised) { ctx.globalAlpha = ((t * 12) | 0) % 2 ? .9 : .4; disc(hx, hy + 3, 4, C.red); ctx.globalAlpha = 1; } }
    bPoly([[x - 8, y - 9], [x + 8, y - 9], [x + 12, y + 17], [x - 12, y + 17]], BA.D); bPoly([[x - 7, y - 8], [x + 7, y - 8], [x + 11, y + 16], [x - 11, y + 16]], c('#2e322a'));
    bPoly([[x - 7, y - 8], [x - 3, y - 8], [x - 6, y + 16], [x - 11, y + 16]], c('#3e4438')); rect(x - 10, y + 4, 20, 1, c('#1a1c18')); rect(x - 11, y + 11, 22, 1, c('#1a1c18'));
    for (let k = 0; k < 6; k++) rect(x - 1, y - 6 + k * 4, 3, 1, c('#7a7466')); for (let i = 0; i < 6; i++) rect(x - 10 + i * 4, y + 16, 2, 1 + (i % 2) * 2, c('#2e322a'));
    for (let k = 0; k < 6; k++) rect(x - 5, y - 5 + k * 3, 1, 1, c('#6a6a70'));
    bMass(x, y - 13, 6, 6, ['', '#2a2824', '#4a4640', '#6a665e'], K, 0);
    const eye = b.atk === 'gaze' ? C.violet : K.arm ? '#ffffff' : '#ff3a2a'; for (const s of [-1, 1]) { disc(x + s * 2.5 + K.ex * .4, y - 14, 2, BA.D); disc(x + s * 2.5 + K.ex * .4, y - 14, 1.3, eye); }
    rect(x - 2, y - 10, 4, 3, c('#6a6a60')); rect(x - 1, y - 9, 2, 1, BA.D);
    for (let i = 0; i < 3; i++) rect(x - 7 + i * 6, y - 23 - (i === 1 ? 3 : 0), 2, 5, c('#9a928a')); },
  // SPECIMEN ZERO: a body curled in a cracked specimen tank, still wired to the lab
  4(b, x, y, t, K) { const c = K.c, I = BA.iron, bob = Math.sin(t * 1.5);
    pxLine(x - 8, y - 20, x - 15, y - 27, c(I[2]), 2); pxLine(x + 8, y - 20, x + 16, y - 25, c(I[2]), 2); pxLine(x, y - 21, x + 1, y - 30, c('#5a3a30'), 2);
    rect(x - 11, y - 21, 22, 5, BA.D); rect(x - 10, y - 20, 20, 3, c(I[3])); rect(x - 10, y - 20, 20, 1, c(I[4]));
    rect(x - 9, y - 16, 18, 30, '#081210'); ctx.globalAlpha = .92; rect(x - 8, y - 14 + Math.sin(t) * 1, 16, 27, c('#24402c')); ctx.globalAlpha = 1;
    bEll(x, y + 3 + bob, 5, 7, c('#c8b0a0')); bEll(x + 1, y - 6 + bob, 4, 4, c('#d8c0b0')); pxLine(x - 3, y + 6 + bob, x - 6, y + 10 + bob, c('#b89888')); pxLine(x + 3, y + 7 + bob, x + 5, y + 11 + bob, c('#b89888'));
    pxLine(x + 1, y - 10 + bob, x + 3, y - 16, c('#8a5a50')); disc(x + 1 + K.ex * .4, y - 6 + bob, 1.5, K.arm ? '#ffffff' : '#ff3a4a');
    rect(x - 7, y - 15, 2, 28, 'rgba(200,255,220,.22)'); for (let i = 0; i < 4; i++) { const q = (t * .6 + i * .27) % 1; rect(x - 6 + i * 4, y + 12 - q * 26, 1, 1, '#a0e0b0'); }
    const cr = '#d8f0ff'; if (b.phase >= 1) { pxLine(x - 6, y - 11, x - 2, y - 4, cr); pxLine(x - 2, y - 4, x - 4, y + 1, cr); } if (b.phase >= 2) { pxLine(x + 7, y - 2, x + 3, y + 5, cr); pxLine(x + 3, y + 5, x + 6, y + 10, cr); }
    rect(x - 11, y + 14, 22, 5, BA.D); rect(x - 10, y + 15, 20, 3, c(I[2])); for (let i = 0; i < 4; i++) rect(x - 8 + i * 5, y + 16, 1, 1, c(I[5]));
    for (let i = 0; i < 6; i++) { const a = t * (i % 2 ? -1.2 : .9) + i * 1.047, rr = 23 + Math.sin(t * 2 + i) * 2, sx = x + Math.cos(a) * rr, sy = y + Math.sin(a) * rr * .8;
      ctx.save(); ctx.translate(Math.round(sx), Math.round(sy)); ctx.rotate(a); ctx.fillStyle = BA.D; ctx.fillRect(-3, -3, 6, 6); ctx.fillStyle = G.p.pol ? (i % 2 ? C.red : C.cyan) : c(I[3]); ctx.fillRect(-2, -2, 4, 4); ctx.restore(); } },
  // SPECIMEN ZERO, broken out: a heaving mass of flesh with crystals of light growing through it
  recomposed(b, x, y, t, K) { const c = K.c, F = BA.flesh, gl = b.hurtT > 0 ? rand(-1, 1) : 0; x += gl;
    for (let i = 0; i < 5; i++) { const a = i * 1.26 + t * .3; bEll(x + Math.cos(a) * 7, y + Math.sin(a) * 6, 10 + Math.sin(t * 3 + i) * 1.5 + 1, 9, BA.D); }
    for (let i = 0; i < 5; i++) { const a = i * 1.26 + t * .3; bEll(x + Math.cos(a) * 7, y + Math.sin(a) * 6, 10 + Math.sin(t * 3 + i) * 1.5, 8, c(F[2])); bEll(x + Math.cos(a) * 6 - 2, y + Math.sin(a) * 5 - 2, 5, 4, c(F[3])); }
    bEll(x, y, 10, 9, c(F[3])); bEll(x - 3, y - 3, 5, 4, c(F[4]));
    for (let i = 0; i < 7; i++) { const a = t * .5 + i * .9, bx = x + Math.cos(a) * 10, by = y + Math.sin(a) * 9, L4 = 19 + Math.sin(t * 2 + i) * 2, tx = x + Math.cos(a) * L4, ty = y + Math.sin(a) * L4 * .95, nx = -Math.sin(a) * 2.5, ny = Math.cos(a) * 2.5;
      bPoly([[bx + nx, by + ny], [tx, ty], [bx - nx, by - ny]], K.fl ? '#ffffff' : PCOLS()[i % 3]); pxLine(bx, by, tx, ty, '#ffffff'); }
    disc(x + K.ex, y + K.ey, 4, BA.D); disc(x + K.ex, y + K.ey, 3, K.arm ? '#8e877b' : '#f4f0e8'); disc(x + K.ex * 1.3, y + K.ey * 1.3, 1.4, '#c81e2a');
    for (let i = 0; i < 3; i++) rect(x - 6 + i * 6, y + 9 + ((t * 20 + i * 7) % 6), 1, 2, '#8a1820');
    if (b.enrageT !== undefined) { const e2 = Math.max(0, b.enrageT); ringC(x, y, 32 + (e2 < 10 ? Math.sin(t * 20) * 2 : 0), e2 < 10 ? C.red : col(3), 1); } },
  // THE FURNACE BEAST: a boiler grown into a body, a grate for a mouth, two chimneys for shoulders
  5(b, x, y, t, K) { const c = K.c, R = BA.rust, I = BA.iron; y += Math.sin(t * 2);
    for (const s of [-1, 1]) { rect(x + s * 7 - 4, y + 8, 8, 9, BA.D); rect(x + s * 7 - 3, y + 9, 6, 7, c(R[2])); bMass(x + s * 18, y - 1, 4, 6, BA.flesh, K); for (let i = 0; i < 3; i++) rect(x + s * 18 - 2 + i * 2, y - 3 + i * 2, 1, 1, '#2a0a06'); }
    rect(x - 15, y - 14, 30, 24, BA.D); rect(x - 14, y - 13, 28, 22, c(R[2])); rect(x - 14, y - 13, 28, 2, c(R[3])); rect(x - 14, y + 7, 28, 2, c(R[1]));
    for (let i = 0; i < 6; i++) { rect(x - 12 + i * 5, y - 10, 1, 1, c(R[4])); rect(x - 12 + i * 5, y + 5, 1, 1, c(R[4])); } rect(x - 14, y - 6, 28, 1, c(R[1]));
    const glow = K.arm ? '#bdb5a6' : (((t * 8) | 0) % 2 ? '#ff8a3a' : '#ffc060'); rect(x - 9, y - 4, 18, 9, BA.D); rect(x - 8, y - 3, 16, 7, glow); rect(x - 6 + K.ex, y - 1, 12, 3, K.arm ? '#ffffff' : '#fff0b0');
    for (let i = 0; i < 4; i++) rect(x - 6 + i * 4, y - 3, 1, 7, BA.D);
    bMass(x, y - 17, 5, 3, BA.flesh, K); rect(x - 2, y - 18, 1, 1, '#ff8a3a'); rect(x + 1, y - 18, 1, 1, '#ff8a3a');
    for (const s of [-1, 1]) { rect(x + s * 9 - 2, y - 27, 5, 13, BA.D); rect(x + s * 9 - 1, y - 26, 3, 12, c(I[3])); rect(x + s * 9 - 1, y - 26, 3, 1, c(I[5])); if (Math.random() < .3) part({ x: b.x + s * 9, y: b.y - 28, vx: rand(-5, 5), vy: -30, life: .7, max: .7, c: Math.random() < .3 ? '#ff8a3a' : col(3), s: 2 }); }
    if (b.crysT > 0) { b.crysT -= FRAME_DT; ringC(x, y, b.r + 8, C.orange, 1); } },
  // THE VOLT EEL: a long coiled body, a capacitor buried in it, jaws full of needles
  6(b, x, y, t, K) { const c = K.c, segs = [];
    for (let i = 0; i < 10; i++) segs.push([x + Math.sin(t * 2 + i * .7) * (5 + i * 1.1), y + 14 - i * 3.4, 2.5 + Math.sin(i / 9 * Math.PI) * 4.5]);
    for (const [px, py, r] of segs) bEll(px, py, r + 1, r * .9 + 1, BA.D);
    segs.forEach(([px, py, r], i) => { bEll(px, py, r, r * .9, c('#24343e')); bEll(px - 1, py - 1, r * .55, r * .45, c('#3e5a68')); if (((t * 10 + i) | 0) % 3 === 0) rect(px, py, 1, 1, C.cyan); });
    const [mx2, my2] = segs[5]; rect(mx2 - 3, my2 - 2, 6, 4, BA.D); rect(mx2 - 2, my2 - 1, 4, 2, K.arm ? '#ffffff' : C.cyan);
    const [hx, hy] = segs[9], jaw = Math.abs(Math.sin(t * 5)) * 3; bMass(hx, hy - 2, 6, 4, ['', '#1a2830', '#24343e', '#3e5a68'], K);
    pxLine(hx - 4, hy, hx + 5, hy + jaw, BA.D, 2); for (let i = 0; i < 4; i++) rect(hx - 3 + i * 2, hy - 1, 1, 1, '#d8e8f0');
    const eye = K.arm ? '#ffffff' : C.cyan; rect(hx - 3 + K.ex * .3, hy - 4, 2, 1, eye); rect(hx + 2 + K.ex * .3, hy - 4, 2, 1, eye);
    if (Math.random() < .4) { const a = rand(0, 6.28); G.bolts.push({ pts: zig(b.x, b.y, b.x + Math.cos(a) * 24, b.y + Math.sin(a) * 24), life: .06, max: .06, c: C.cyan }); } },
  // THE MAW: a lamprey mouth as wide as a doorway, rings of teeth turning against each other
  7(b, x, y, t, K) { const c = K.c, F = BA.flesh, B = BA.bone;
    for (let i = 0; i < 6; i++) { const a = i * 1.047 + t * .3; let px = x + Math.cos(a) * 16, py = y + Math.sin(a) * 15; for (let k = 0; k < 4; k++) { const nx = px + Math.cos(a + Math.sin(t * 3 + i + k) * .5) * 3, ny = py + Math.sin(a + Math.sin(t * 3 + i + k) * .5) * 3; pxLine(px, py, nx, ny, c(F[k > 1 ? 1 : 2]), k < 2 ? 2 : 1); px = nx; py = ny; } }
    bEll(x, y, 18, 17, BA.D); bEll(x, y, 17, 16, c(F[2])); bEll(x - 3, y - 4, 12, 10, c(F[3])); bEll(x, y, 13, 12, c(F[1]));
    for (let k = 0; k < 3; k++) { const rr = 12 - k * 3.5, n = 14 - k * 3; for (let j = 0; j < n; j++) { const a = j / n * 6.283 + t * (k % 2 ? -.8 : .6), tx = x + Math.cos(a) * rr, ty = y + Math.sin(a) * rr * .95;
      pxLine(tx, ty, tx - Math.cos(a) * 3, ty - Math.sin(a) * 3, c(B[3])); rect(tx - Math.cos(a) * 3, ty - Math.sin(a) * 3, 1, 1, c(B[4])); } }
    bEll(x, y, 4, 4, '#050203'); disc(x + K.ex * .7, y + K.ey * .7, 2, K.arm ? '#8e877b' : C.violet); rect(x + K.ex * .7, y + K.ey * .7 - 1, 1, 1, '#ffffff');
    for (let i = 0; i < 3; i++) { const q = (t * .6 + i / 3) % 1; ctx.globalAlpha = (1 - q) * .45; ringC(x, y, 20 + q * 12, C.violet, 1); } ctx.globalAlpha = 1; },
  // THE ARCHIVIST: a clerk bent over a ledger he can no longer put down, bandaged, weeping ink, papers circling
  8(b, x, y, t, K) { const c = K.c, bob = Math.sin(t * 2) * 2, flap = Math.sin(t * 5) * 3; y += bob;
    for (let i = 0; i < 5; i++) { const a = t * .8 + i * 1.26, px = x + Math.cos(a) * 21, py = y - 4 + Math.sin(a) * 10 + Math.sin(t * 3 + i) * 2; rect(px - 2, py - 1, 4, 3, BA.D); rect(px - 2, py - 1, 3, 2, c('#d8ccb0')); rect(px - 1, py, 2, 1, c('#6a604e')); }
    bMass(x, y + 6, 10, 11, ['', '#24221e', '#3a3630', '#5a544a'], K);
    bMass(x, y - 10, 5, 5, ['', '#8a7a64', '#c8b8a0', '#e8dcc4'], K, 0); for (let k = 0; k < 3; k++) rect(x - 4, y - 12 + k * 2, 8, 1, c('#ece2c8')); rect(x - 2, y - 9, 1, 4, '#120a0a'); rect(x + 1, y - 9, 1, 5, '#120a0a');
    for (const s of [-1, 1]) { bPoly([[x, y - 2], [x + s * 17, y - 4 - (s > 0 ? flap : 0)], [x + s * 17, y + 11], [x, y + 13]], BA.D); bPoly([[x, y - 1], [x + s * 16, y - 3 - (s > 0 ? flap : 0)], [x + s * 16, y + 10], [x, y + 12]], c('#d8ccb0'));
      for (let i = 0; i < 4; i++) rect(x + s * 3 + (s < 0 ? -11 : 0), y + 2 + i * 3, 10, 1, c('#6a604e')); if (!K.fl) rect(x + s * 9, y + 5, 3, 3, '#5a0e14'); }
    rect(x, y - 2, 1, 15, c('#3a3630')); disc(x + K.ex * .5, y - 4, 3, BA.D); disc(x + K.ex * .5, y - 4, 2, K.arm ? '#ffffff' : C.gold); for (const s of [-1, 1]) pxLine(x + s * 6, y - 4, x + s * 12, y + 3, c('#c8b8a0')); },
  // THE PALE HOST: a body overgrown with white mould, a faceless mask, threads hanging to the floor, spores in the air
  9(b, x, y, t, K) { const c = K.c; y += Math.sin(t * 1.4) * 2;
    for (let i = 0; i < 7; i++) { const ox = x - 12 + i * 4; for (let j = 0; j < 8; j++) rect(ox + Math.sin(t * 2 + i + j * .6) * 2, y + 12 + j * 3, 1, 2, j > 5 ? col(2) : j > 3 ? col(3) : c('#c8c4b8')); }
    for (const s of [-1, 1]) { pxLine(x + s * 7, y - 3, x + s * 11, y + 10, BA.D, 3); pxLine(x + s * 7, y - 3, x + s * 11, y + 10, c('#c8c4b8')); for (let j = 0; j < 3; j++) rect(x + s * 11, y + 11 + j * 2, 1, 1, c('#e8e4d8')); }
    bMass(x, y + 4, 8, 11, ['', '#8a867c', '#c8c4b8', '#e8e4d8'], K); for (let i = 0; i < 9; i++) { const a = i * .8, r2 = i % 3 ? 1.5 : 2.2; disc(x + Math.cos(a) * 5, y + 4 + Math.sin(a * 1.3) * 7, r2, c('#f4f0e6')); }
    ctx.fillStyle = BA.D; ctx.beginPath(); ctx.ellipse(x, y - 9, 8, 10, 0, 0, 6.283); ctx.fill(); ctx.fillStyle = K.fl ? '#ffffff' : '#e8e8ec'; ctx.beginPath(); ctx.ellipse(x, y - 9, 7, 9, 0, 0, 6.283); ctx.fill();
    for (let i = 0; i < 4; i++) disc(x - 5 + i * 3.3, y - 17 + (i % 2), 1.6, c('#f8f6f0'));
    rect(x - 5 + K.ex * .5, y - 11, 3, 2, K.arm ? col(3) : col(0)); rect(x + 2 + K.ex * .5, y - 11, 3, 2, K.arm ? col(3) : col(0)); rect(x - 1, y - 4, 2, 1, col(3));
    for (let i = 0; i < 6; i++) { const q = (t * .3 + i / 6) % 1; ctx.globalAlpha = 1 - q; rect(x - 12 + i * 5, y + 8 - q * 34, 1, 1, '#e8e8e0'); } ctx.globalAlpha = 1;
    if (b.enrageT !== undefined) ringC(x, y, 26, C.red, 1); },
  // INVERSION (drawn in negative; the arena filter turns it black): a burned figure nailed inside a dead sun
  10(b, x, y, t, K) { const R = 17 + Math.sin(t * 4) * 1.5;
    for (let i = 0; i < 12; i++) { const a = t * (i % 2 ? -1.3 : .9) + i * .524, r1 = R + 3, r2 = R + 10 + Math.sin(t * 3 + i) * 4; pxLine(x + Math.cos(a) * r1, y + Math.sin(a) * r1, x + Math.cos(a + .08) * r2, y + Math.sin(a + .08) * r2, col(0), 2); }
    disc(x, y, R + 3, col(5)); disc(x, y, R, K.fl ? col(2) : '#f4f4f0');
    const g = '#8a8a86'; pxLine(x - 11, y - 6, x + 11, y - 6, g, 2); pxLine(x, y - 12, x, y + 12, g, 2); disc(x, y - 11, 3, g); pxLine(x, y + 2, x - 5, y + 11, g); pxLine(x, y + 2, x + 5, y + 11, g);
    disc(x + K.ex, y - 11 + K.ey * .5, 1.5, K.arm ? col(3) : col(0));
    for (let i = 0; i < 3; i++) { const q = (t * .6 + i / 3) % 1; ctx.globalAlpha = 1 - q; ringC(x, y, R + 6 + q * 26, col(0), 1); } ctx.globalAlpha = 1;
    if (b.enrageT !== undefined) { const e2 = Math.max(0, b.enrageT); ringC(x, y, 34 + (e2 < 10 ? Math.sin(t * 20) * 2 : 0), e2 < 10 ? C.red : col(3), 1); } },
  // LATTICE: a rusted steel cage turning on its own, a brain wired to it inside, glowing cold
  11(b, x, y, t, K) { const s = 13, rx = t * .7, ry = t * .9, V = [];
    for (const X of [-1, 1]) for (const Y of [-1, 1]) for (const Z of [-1, 1]) { let x1 = X, y1 = Y, z1 = Z; const cy1 = Math.cos(ry), sy1 = Math.sin(ry); [x1, z1] = [x1 * cy1 - z1 * sy1, x1 * sy1 + z1 * cy1]; const cx1 = Math.cos(rx), sx1 = Math.sin(rx); [y1, z1] = [y1 * cx1 - z1 * sx1, y1 * sx1 + z1 * cx1]; V.push([x + x1 * s, y + y1 * s, z1]); }
    const edges = []; for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) { const d = i ^ j; if (d === 1 || d === 2 || d === 4) edges.push([i, j, (V[i][2] + V[j][2]) / 2]); }
    const edge = ([i, j]) => { pxLine(V[i][0], V[i][1], V[j][0], V[j][1], BA.D, 3); pxLine(V[i][0], V[i][1], V[j][0], V[j][1], K.fl ? col(5) : '#7a4a2a', 1); rect(V[i][0] - 1, V[i][1] - 1, 2, 2, '#c08050'); };
    edges.filter(e => e[2] < 0).forEach(edge);
    bEll(x, y, 8, 7, BA.D); bEll(x, y, 7, 6, K.c('#a06072')); bEll(x - 2, y - 2, 4, 3, K.c('#c88898')); pxLine(x - 5, y, x + 5, y - 1, K.c('#6a3a48')); pxLine(x, y - 5, x - 1, y + 5, K.c('#6a3a48'));
    for (const v of [V[0], V[3], V[5], V[6]]) { ctx.globalAlpha = .6; pxLine(x, y, v[0], v[1], '#3a6a8a'); ctx.globalAlpha = 1; }
    disc(x + K.ex * .5, y + K.ey * .5, 2.5, K.arm ? col(4) : C.cyan); rect(x + K.ex * .5 - 1, y + K.ey * .5 - 1, 1, 1, col(5));
    edges.filter(e => e[2] >= 0).forEach(edge);
    if (b.glyph !== undefined && typeof GLYPH_DRAW !== 'undefined') { const gy = y - 34, gc = b.glyphT > 0 && ((t * 16) | 0) % 2 ? col(5) : C.cyan; if (b.glyphT > 0) b.glyphT -= FRAME_DT; disc(x, gy, 10, col(0)); GLYPH_DRAW[b.glyph](x, gy, 7, gc); GLYPH_DRAW[b.glyph](x, gy, 8, gc); }
    if (b.enrageT !== undefined) { const e2 = Math.max(0, b.enrageT); ringC(x, y, 34 + (e2 < 10 ? Math.sin(t * 20) * 2 : 0), e2 < 10 ? C.red : col(3), 1); } },
};
function bossK(b, t) { const fl = b.flash > 0; return { fl, arm: b.armorT > 0, ex: Math.cos(b.eye) * 3, ey: Math.sin(b.eye) * 2, c: fl ? () => '#f2ece4' : c => c }; }
drawBossBase = function (b, x, y, f, fl, hv, t) {
  ctx.globalAlpha = .6; bEll(x, y + b.r, b.r * (1 - hv / 80), b.r * .35, col(0)); ctx.globalAlpha = 1; y -= hv;
  const K = bossK(b, t), lean = clamp((b.bvx || 0) / 400, -.25, .25);
  if (lean && f !== 0) { ctx.save(); ctx.translate(Math.round(x), Math.round(y + b.r)); ctx.rotate(lean); ctx.translate(-Math.round(x), -Math.round(y + b.r)); }
  if (f === 4 && b.def.form === 2) BOSS_ART.recomposed(b, x, y, t, K); else (BOSS_ART[f] || BOSS_ART[0])(b, x, y, t, K);
  if (lean && f !== 0) ctx.restore();
  if (b.burn > 0) for (let i = 0; i < 2; i++) rect(x + rand(-12, 12), y - rand(0, 20), 1, 2, C.red);
  if (b.frozen > 0 || b.slowT > 0) ringC(x, y, b.r + 4, C.frost, 1);
  if (b.armorT > 0) ringC(x, y, b.r + 6 + Math.sin(t * 20) * 2, col(5), 1);
  if (b.atk === 'dashes' && b.mem.s === 'aim') { ctx.globalAlpha = .7; line(x, y, x + Math.cos(b.mem.a) * 300, y + Math.sin(b.mem.a) * 300, C.red, 1); ctx.globalAlpha = 1; }
};
drawBoss2 = function (b, x, y, f) { const t = G.time, K = bossK(b, t);
  ctx.globalAlpha = .6; bEll(x, y + b.r, b.r, b.r * .35, col(0)); ctx.globalAlpha = 1;
  (BOSS_ART[f] || BOSS_ART[5])(b, x, y, t, K);
  if (b.armorT > 0) ringC(x, y, b.r + 6 + Math.sin(t * 20) * 2, col(5), 1);
  if (b.burn > 0) for (let i = 0; i < 2; i++) rect(x + rand(-12, 12), y - rand(0, 20), 1, 2, C.red);
};
