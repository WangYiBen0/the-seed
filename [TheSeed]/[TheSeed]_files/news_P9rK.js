// ===== ACHROMA main-menu notice board: the patch announcement and the DLC teaser =====
'use strict';
// the tab icon's prism, and its "decayed" twin for the DLC: drained of colour, split by a crack, dripping
const LOGO_ART = ['................', '................', '.......aa.......', '......baac......', '.....bbaacc.....', '....bbbaaccc....', '...bbbbaacccc...', '..bbbbbaaccccc..', '..dddddaaeeeee..', '...ddddaaeeee...', '....dddaaeee....', '.....ddaaee.....', '......daae......', '.......aa.......', '................', '................'];
const LOGO_C = { a: '#e8e1d3', b: '#e0483e', c: '#efb94a', d: '#a07ad8', e: '#5ed0c8' };
const DECAY_C = { a: '#c8c6be', b: '#6a4048', c: '#6f6a5a', d: '#463f52', e: '#4a5c5e' };
const CRACK = { 3: 10, 4: 10, 5: 9, 6: 9, 7: 8, 8: 8, 9: 7, 10: 7, 11: 6, 12: 6, 13: 7 };
function drawDecayLogo(x, y, sc, t) {
  const glitch = Math.sin(t * 7.1) > .96;
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const ch = LOGO_ART[j][i]; if (ch === '.') continue; const cr = CRACK[j];
    if (cr !== undefined && i === cr) continue; // the crack itself
    const off = cr !== undefined && i > cr ? 1 : 0, c = (cr !== undefined && Math.abs(i - cr) === 1 && ((t * 3 + j) | 0) % 4 === 0) ? '#8a1020' : DECAY_C[ch];
    rect(x + (i + off + (glitch && j % 3 === 0 ? 1 : 0)) * sc, y + (j + off * .5) * sc, sc, sc, c); }
  // ink drips off the bottom tip
  for (let k = 0; k < 2; k++) { const q = (t * .55 + k * .5) % 1, dy = 14 + q * q * 9; ctx.globalAlpha = 1 - q; rect(x + (7 + k) * sc, y + dy * sc, sc, sc * (1 + q * 2), DECAY_C.a); } ctx.globalAlpha = 1;
}
function drawNews(t) {
  const x = W - 178, w = 170; let y = 166;
  const k1 = easeOut(clamp((MENU.t - .2) / .5, 0, 1)), k2 = easeOut(clamp((MENU.t - .38) / .5, 0, 1));
  // card 1: the patch notice
  if (k1 > 0) { ctx.globalAlpha = k1; const ox = Math.round((1 - k1) * 20), h = 54, cx = x + ox;
    poly([[cx + 5, y], [cx + w, y], [cx + w, y + h - 5], [cx + w - 5, y + h], [cx, y + h], [cx, y + 5]], 'rgba(9,9,10,.86)', '#2d2925');
    rect(cx + 5, y, 22, 2, '#ff2a3a'); const tag = L('ann_tag'); rect(cx + 6, y + 5, textW(tag) + 6, 9, '#ff2a3a'); text(tag, cx + 9, y + (isCJK(tag) ? 5 : 7), '#0a0908');
    drawDiffIcon('despair', cx + w - 17, y + 4, 1, t);
    const tl = wrapW(L('ann_title'), w - 14), bl = wrapW(L('ann_body'), w - 14), lh = lineH(); let yy = y + 17;
    tl.slice(0, 2).forEach(l => { text(l, cx + 7, yy, '#e8e1d3'); yy += lh; }); yy += 1;
    bl.slice(0, 3).forEach(l => { text(l, cx + 7, yy, '#8e877b'); yy += lh; }); y += h + 4; }
  else y += 58;
  // card 2: the DLC teaser with the decayed logo
  if (k2 > 0) { ctx.globalAlpha = k2; const ox = Math.round((1 - k2) * 20), h = 40, cx = x + ox;
    poly([[cx + 5, y], [cx + w, y], [cx + w, y + h - 5], [cx + w - 5, y + h], [cx, y + h], [cx, y + 5]], 'rgba(9,9,10,.86)', '#2d2925');
    rect(cx + 5, y, 22, 2, '#6a6a72'); rect(cx + 4, y + 4, 34, 32, '#050506'); box(cx + 4, y + 4, 34, 32, null, '#27231f'); drawDecayLogo(cx + 5, y + 4, 2, t);
    const tt = L('dlc_title'), bt = L('dlc_body'), gl = Math.sin(t * 5.3) > .93;
    if (gl) { text(fitText(tt, w - 50), cx + 43, y + 9, '#5a000c'); }
    text(fitText(tt, w - 50), cx + 44 + (gl ? 1 : 0), y + 8, '#d8d6ce');
    wrapW(bt, w - 50).slice(0, 2).forEach((l, i) => text(l, cx + 44, y + 21 + i * lineH(), '#6a6a72')); }
  ctx.globalAlpha = 1;
}
