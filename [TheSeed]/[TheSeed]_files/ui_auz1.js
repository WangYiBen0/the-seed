// ===== ACHROMA UI: menus, HUD, shard cards, weapon preview, minimap, banners, screens (drawn in the crisp UI pass) =====
'use strict';
const ICONS = {
  flame: ['...1....', '...11...', '..111...', '..1111..', '.11.11..', '.1...11.', '.1...11.', '..1111..'],
  fire2: ['..1..1..', '..11.11.', '.1111.1.', '.111111.', '11.11111', '1...1.11', '11....11', '.111111.'],
  bolt: ['....11..', '...11...', '..11....', '.111111.', '....11..', '...11...', '..11....', '.1......'],
  flake: ['...1....', '.1.1.1..', '..111...', '1111111.', '..111...', '.1.1.1..', '...1....', '........'],
  drop: ['...1....', '...1....', '..111...', '..111...', '.11111..', '.11.11..', '.11111..', '..111...'],
  eye: ['........', '..1111..', '.1....1.', '1..11..1', '1..11..1', '.1....1.', '..1111..', '........'],
  fork: ['1..1..1.', '1..1..1.', '.1.1.1..', '..111...', '...1....', '...1....', '...1....', '...1....'],
  echo: ['1111....', '1..1....', '1..1111.', '1111..1.', '...1..1.', '...1111.', '........', '........'],
  rico: ['1.......', '.1.....1', '..1...1.', '...1.1..', '....1...', '........', '11111111', '........'],
  needle: ['......11', '.....111', '....111.', '...111..', '..111...', '.111....', '.11.....', '1.......'],
  heavy: ['........', '..1111..', '.111111.', '11111111', '11111111', '.111111.', '..1111..', '........'],
  frenzy: ['1...1...', '.1...1..', '..1...1.', '...1...1', '..1...1.', '.1...1..', '1...1...', '........'],
  boom: ['1..1..1.', '.1.1.1..', '..111...', '111.111.', '..111...', '.1.1.1..', '1..1..1.', '........'],
  shrap: ['1......1', '.1....1.', '........', '...11...', '...11...', '........', '.1....1.', '1......1'],
  heart: ['........', '.11.11..', '1111111.', '1111111.', '.11111..', '..111...', '...1....', '........'],
  seek: ['...1....', '..111...', '.1...1..', '111.111.', '.1...1..', '..111...', '...1....', '........'],
  dash: ['........', '11...1..', '....111.', '111.1111', '....111.', '11...1..', '........', '........'],
  orbit: ['..1.....', '........', '...11...', '1.1111.1', '..1111..', '...11...', '........', '.....1..'],
  shield: ['11111111', '1......1', '1.1111.1', '1.1111.1', '.1.11.1.', '.1....1.', '..1..1..', '...11...'],
  swift: ['........', '1.1.111.', '.1.1111.', '1.1.111.', '....11..', '....1111', '........', '........'],
  glass: ['...1....', '..1.1...', '.1...1..', '1..1..1.', '.1...1..', '..1.1...', '...1....', '........'],
  prism: ['...1....', '...1....', '..1.1...', '..1.1...', '.1...1..', '.1...1..', '1111111.', '........'],
  axe: ['.1111...', '111111..', '1111.1..', '.11..1..', '.....1..', '.....1..', '.....1..', '.....1..'],
  crown: ['........', '1..1..1.', '11.1.11.', '1111111.', '1111111.', '1111111.', '........', '........'],
  spiral: ['.11111..', '1.....1.', '1.111.1.', '1.1.1.1.', '1.1...1.', '1..111..', '.1......', '..1111..'],
  drone: ['........', '11....11', '.111111.', '..1111..', '.111111.', '11....11', '...11...', '........'],
  ink8: ['...1....', '..111...', '.11111..', '1111111.', '.11111..', '..111...', '...1....', '........'],
  ink: ['..1..', '.111.', '11111', '.111.', '..1..'],
  key: ['.111....', '1...1...', '1...1111', '.111.1.1', '........', '........', '........', '........'],
  clock: ['..1111..', '.1....1.', '1...1..1', '1...1..1', '1..11..1', '1......1', '.1....1.', '..1111..'],
  mag: ['.111111.', '.1....1.', '.111111.', '.1....1.', '.111111.', '.1....1.', '.111111.', '..1111..'],
  round: ['...11...', '..1111..', '..1111..', '..1111..', '..1111..', '..1111..', '.111111.', '.111111.'],
  hourglass: ['11111111', '.1....1.', '..1111..', '...11...', '...11...', '..1..1..', '.111111.', '11111111'],
  crackheart: ['.11..11.', '11111111', '111.1111', '1111.111', '111.1111', '.11.111.', '..1111..', '...11...'],
  warp: ['...11...', '..1..1..', '.1.11.1.', '1.1..1.1', '1.1..1.1', '.1.11.1.', '..1..1..', '...11...'],
  reroll: ['..11111.', '.1....11', '1....111', '1.......', '.......1', '111....1', '11....1.', '.11111..'],
  lock: ['..1111..', '.1....1.', '.1....1.', '11111111', '11111111', '111..111', '11111111', '11111111'],
};
function icon(name, x, y, c, sc = 1) { const g = ICONS[name]; if (!g) return; ctx.fillStyle = c; for (let j = 0; j < g.length; j++) for (let i = 0; i < g[j].length; i++) if (g[j][i] === '1') ctx.fillRect(Math.round(x + i * sc), Math.round(y + j * sc), sc, sc); }
function box(x, y, w, h, bg, bd) { if (bg) rect(x, y, w, h, bg); if (bd) { rect(x, y, w, 1, bd); rect(x, y + h - 1, w, 1, bd); rect(x, y, 1, h, bd); rect(x + w - 1, y, 1, h, bd); } }
const sname = s => tr(s.n), wname = id => tr(WEAPONS[id].nm);
// truncate text to a pixel width so nothing ever spills out of its box
function fitText(str, maxW, sc = 1) { str = String(str); if (textW(str, sc) <= maxW) return str; const ell = isCJK(str) ? '…' : '..'; let a = [...str]; while (a.length > 1 && textW(a.join('') + ell, sc) > maxW) a.pop(); return a.join('') + ell; }
function poly(pts, fill, edge) { ctx.fillStyle = fill; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); if (fill) ctx.fill(); if (edge) for (let i = 0; i < pts.length; i++) pxLine(pts[i][0], pts[i][1], pts[(i + 1) % pts.length][0], pts[(i + 1) % pts.length][1], edge); }
function frame2(x, y, w, h, acc, title) { // angled-corner panel used by every overlay
  rect(x, y, w, h, 'rgba(8,8,8,.97)'); box(x, y, w, h, null, WIN_EDGE);
  if (title) text(title, x + 10, y + 7 - (isCJK(title) ? 1 : 0), '#e6dfd1', 1);
}

// ================= HUD =================
function drawHUD() {
  const p = G.p;
  const low = p.hp <= 2 && ((G.time * 4) | 0) % 2;
  for (let i = 0; i < p.maxHp; i++) { const x = 8 + i * 9, y = 8; rect(x - 1, y - 1, 9, 9, col(0)); if (i < p.hp) { rect(x, y, 7, 7, low ? C.red : col(5)); rect(x + 1, y + 1, 2, 2, low ? '#fff' : col(4)); } else box(x, y, 7, 7, col(1), col(3)); }
  if (SET.name) textS(SET.name, 8 + p.maxHp * 9 + 4, isCJK(SET.name) ? 8 : 9, col(4));
  for (let i = 0; i < p.maxArmor; i++) { const x = 8 + i * 9, y = 18; rect(x - 1, y - 1, 9, 5, col(0)); if (i < p.armor) rect(x, y, 7, 3, col(4)); else box(x, y, 7, 3, col(1), col(2)); }
  if (skillOn('risk')) for (let i = 0; i < p.maxArmor; i++) { const x = 8 + i * 9, y = 18; rect(x, y, 7, 3, col(1)); pxLine(x, y, x + 6, y + 2, C.red); }
  if (p.armor < p.maxArmor && p.armorRegen > 0) rect(8 + p.armor * 9, 22, 7 * Math.min(1, p.armorRegen), 1, col(3));
  icon('ink', 8, 27, col(5)); textS(G.ink, 16, 27, col(5));
  if (G.fury > 0) { icon('fire2', 40, 26, C.orange); textS('X' + G.fury, 50, 27, C.orange); }
  { let cx2 = 8; if (G.curse) { textS(L('cursed') + ' X' + G.curse, 8, 37, C.violet); cx2 += textW(L('cursed') + ' X' + G.curse) + 6; } if (G.curses && G.curses.length) drawCurseHUD(cx2, 36); }
  if (G.hasKey) { const kx = G.fury > 0 ? 70 : 40; rect(kx - 1, 25, 11, 9, col(0)); icon('key', kx, 26, C.gold); }
  if (G.freeReroll) { const kx = (G.fury > 0 ? 70 : 40) + (G.hasKey ? 14 : 0); rect(kx - 1, 25, 10, 10, col(0)); icon('reroll', kx, 26, C.gold); }
  // weapons
  drawWeaponPanel(p);
  // shard strip
  const ids = Object.keys(p.shards), L0 = 166, R0 = W - 142, perRow = Math.max(1, Math.floor((R0 - L0) / 12)), rows = Math.ceil(ids.length / perRow);
  G.shardRows = rows;
  ids.forEach((id, i) => { const s = SHARD[id], row = Math.floor(i / perRow), inRow = Math.min(perRow, ids.length - row * perRow), sx = (L0 + R0) / 2 - inRow * 6 + (i % perRow) * 12, sy = H - 13 - row * 13;
    rect(sx - 1, sy, 12, 12, col(0)); icon(s.icon, sx + 1, sy + 1, shardColor(s)); for (let l = 0; l < p.shards[id]; l++) rect(sx + l * 2, sy + 10, 1, 1, col(5)); });
  drawMinimap(W - 60, 6); drawDiffBadge(G.diff || 'classic', W - 84, 3, G.time);
  textS(G.endless ? L('endlessShort', G.endless) + '-' + tr(FLOORS[G.floor].name) : `${G.floor + 1}-${tr(FLOORS[G.floor].name)}`, W - 8, 58, G.endless ? C.red : col(4), 1, 'right');
  if (G.combo >= 3) { const k = clamp(G.comboT / 2.2, 0, 1), c = G.combo >= 25 ? buildTint() : G.combo >= 10 ? C.gold : col(5);
    const sc = G.combo >= 10 ? 3 : 2, pop = G.comboPop > 0 ? 1 : 0;
    textS('X' + G.combo, W - 8, 70 - pop, c, sc + pop, 'right'); text(L('combo'), W - 8, 73 + sc * 5, col(3), 1, 'right'); rect(W - 8 - 30 * k, 82 + sc * 5, 30 * k, 1, c); }
  if (G.trial) { const s = Math.ceil(G.trial.t); textS(L('survive'), W / 2, 8, C.pink, 1, 'center'); textS(String(s), W / 2, 18, s <= 5 ? C.gold : col(5), 4, 'center'); }
  // boss bar
  const b = G.boss;
  if (b && !b.dead && G.state === 'play') { const bw = 168, bmx = (166 + W - 142) / 2, bx = bmx - bw / 2, by = H - 22 - (G.shardRows || 1) * 13;
    textS(tr(b.def.name), bmx, by - 9, col(5), 1, 'center');
    rect(bx - 2, by - 2, bw + 4, 8, col(0)); rect(bx, by, bw, 4, col(2));
    G.bossChip = G.bossChip === undefined ? 1 : Math.max(b.hp / b.maxHp, G.bossChip - (G.bossDmgT > 0 ? 0 : .004));
    rect(bx, by, bw * G.bossChip, 4, col(4)); rect(bx, by, bw * Math.max(0, b.hp / b.maxHp), 4, b.armorT > 0 ? col(3) : C.red);
    rect(bx, by, bw * Math.max(0, b.hp / b.maxHp), 1, '#ff9aa8');
    for (const t of [.34, .67]) rect(bx + bw * t, by - 2, 1, 8, col(5));
    if (b.enrageT !== undefined) { const e2 = Math.max(0, b.enrageT); textS(L('enrage') + ' ' + Math.ceil(e2), bmx + bw / 2, by + 7, e2 < 10 ? C.red : col(4), 1, 'right'); } }
  // interaction prompt
  if (G.prompt) { const pr = G.prompt, tw = textW(pr.t) + 16, x = pr.x - G.cam.x - tw / 2, y = pr.y - G.cam.y - 28;
    box(x, y, tw, 12, col(0), pr.c || col(5)); rect(x + 2, y + 2, 8, 8, pr.c || col(5)); text(typeof PAD !== 'undefined' && PAD.active ? padLabel(0) : 'E', x + 6, y + 4, col(0), 1, 'center'); text(pr.t, x + 13, y + 4, col(5));
    if (pr.sub) textS(pr.sub, pr.x - G.cam.x, y - 10, col(4), 1, 'center');
    if (pr.weapon) drawPreviewWindow(pr.weapon); }
}
// ---------------- ammo HUD ----------------
const AM_W = { round: 2, shell: 3, cell: 3, arrow: 3, disc: 5, rocket: 3, grenade: 4, needle: 1, orb: 5, star: 5, fuel: 3 };
function cartridge(type, x, y, live, c, low) {
  const body = live ? (low ? (((G.time * 8) | 0) % 2 ? C.red : col(5)) : col(5)) : col(2), tip = live ? c : col(2);
  switch (type) {
    case 'round': rect(x, y + 2, 2, 6, body); rect(x, y, 2, 2, tip); break;
    case 'shell': rect(x, y, 3, 6, live ? col(4) : col(2)); rect(x, y + 6, 3, 2, live ? C.red : col(1)); if (live) rect(x, y, 3, 1, body); break;
    case 'cell': rect(x, y, 3, 8, live ? c : col(2)); if (live) rect(x + 1, y + 1, 1, 6, col(5)); break;
    case 'arrow': rect(x + 1, y + 2, 1, 6, body); rect(x, y + 1, 3, 1, tip); rect(x + 1, y, 1, 1, tip); break;
    case 'disc': ringC(x + 2, y + 4, 2, live ? c : col(2), 1); if (live) rect(x + 2, y + 4, 1, 1, col(5)); break;
    case 'rocket': rect(x, y + 2, 3, 6, body); rect(x + 1, y, 1, 2, tip); if (live) rect(x, y + 7, 3, 1, C.orange); break;
    case 'grenade': rect(x, y + 3, 4, 4, body); rect(x + 1, y + 1, 2, 2, tip); break;
    case 'needle': rect(x, y + 1, 1, 7, live ? c : col(2)); break;
    case 'orb': disc(x + 2, y + 4, 2, live ? c : col(2)); if (live) rect(x + 2, y + 3, 1, 1, col(5)); break;
    case 'star': rect(x, y + 4, 5, 1, live ? c : col(2)); rect(x + 2, y + 2, 1, 5, live ? c : col(2)); if (live) rect(x + 2, y + 4, 1, 1, col(5)); break;
    default: rect(x, y, 2, 8, body);
  }
}
// draws a weapon's magazine as cartridges (small mags) or a segmented gauge (big mags); reloading pours color in from the left
function drawMag(p, w, x, y, wd, a) {
  if (!usesAmmo(w)) { for (let i = 0; i < 3; i++) { rect(x + i * 9, y + 3, 7, 2, col(3)); rect(x + i * 9 + 5, y + 2, 2, 4, col(4)); } return; }
  a = a || ammoOf(p, w.id); const M = magSize(w), c = wAccent(w), t = AM_W[w.am] || 2, gap = t >= 4 ? 2 : 1, rel = a.rl > 0, k = rel ? 1 - a.rl / a.max : 0, low = !rel && a.n <= Math.max(1, M * .25);
  if (M * (t + gap) <= wd && w.am !== 'fuel') {
    for (let i = 0; i < M; i++) { const xx = x + i * (t + gap); const live = rel ? i < Math.floor(M * k) : i < a.n; cartridge(w.am, xx, y, live, c, low && live); }
    if (rel) { const hx = x + Math.floor(M * k) * (t + gap); rect(hx, y - 1, 1, 10, col(5)); }
  } else {
    const segs = 12, sw = Math.floor((wd - (segs - 1)) / segs), frac = rel ? k : a.n / M;
    for (let i = 0; i < segs; i++) { const xx = x + i * (sw + 1), f = clamp(frac * segs - i, 0, 1); rect(xx, y + 1, sw, 6, col(2)); if (f > 0) { rect(xx, y + 1, Math.max(1, Math.round(sw * f)), 6, rel ? c : low ? (((G.time * 8) | 0) % 2 ? C.red : col(5)) : (i % 3 === 2 ? c : col(5))); } }
    if (rel) rect(x + frac * (wd - 1), y, 1, 8, col(5));
  }
  if (a.flash > 0) { ctx.globalAlpha = a.flash / .35; rect(x - 2, y - 2, wd + 4, 12, c); ctx.globalAlpha = 1; }
}
function drawWeaponPanel(p) {
  if (TOUCH.on && TOUCH.hud && (TOUCH.hud.x !== 30 || TOUCH.hud.y !== 64 || TOUCH.hud.s !== 1)) { const h = TOUCH.hud; ctx.save(); ctx.translate(h.x, h.y); ctx.scale(h.s, h.s); ctx.translate(-30, -64); drawWeaponPanel0(p); ctx.restore(); return; }
  drawWeaponPanel0(p);
}
function drawWeaponPanel0(p) {
  const wid = p.weapons[p.wi], w = WEAPONS[wid], cx = 30, cy = TOUCH.on ? 64 : H - 30, R = 19, lv = (p.wlv && p.wlv[wid]) || 0, uses = usesAmmo(w), am = uses ? ammoOf(p, wid) : null, ac = uses ? wAccent(w) : buildTint();
  // name plate (slanted) + sub tag, both clear of the dial ring
  hudPlate(cx + 12, cy - 20, 116, 12, col(2), ac);
  text(fitText(wname(wid), 92), cx + 26, cy - 17, col(5), 1);
  hudPlate(cx + 10, cy - 5, 98, 10, col(1));
  text(fitText(L('k_' + (w.lab || w.kind)), 50), cx + 24, cy - 2, col(3), 1);
  for (let i = 0; i < 3; i++) { const dx = cx + 96 - i * 8, on = i < lv; ctx.save(); ctx.translate(dx, cy); ctx.rotate(Math.PI / 4); ctx.fillStyle = on ? C.orange : col(2); ctx.fillRect(-2, -2, 4, 4); ctx.restore(); }
  if (p.primed > 0) for (let i = 0; i < Math.min(8, p.primed); i++) rect(cx + 18 + i * 4, cy + 8, 2, 3, C.orange);
  if (am && am.rl > 0 && ((G.time * 4) | 0) % 2) text(L('reloading'), cx + 64, cy + 8, ac, 1);
  // dial body
  const oct = []; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + Math.PI / 8; oct.push([cx + Math.cos(a) * (R - 1), cy + Math.sin(a) * (R - 1)]); }
  poly(oct, col(0), col(3));
  if (am && am.rl > 0) drawReloadWheel(cx, cy, R - 4, 1 - am.rl / am.max, ac);
  const ws = sprite('w_' + wid, w.spr), sc2 = ws.w <= 16 ? 2 : 1; ctx.save(); ctx.translate(cx - ws.w * sc2 / 2, cy - ws.h * sc2 / 2); ctx.scale(sc2, sc2); ctx.drawImage(ws.n, 0, 0);
  if (am && am.rl > 0) { const k = 1 - am.rl / am.max, ts = sprite('wt_' + wid, ghostRows(w.spr), ac); ctx.beginPath(); ctx.rect(0, 0, ws.w * k, ws.h); ctx.clip(); ctx.drawImage(ts.n, 0, 0); }
  ctx.restore();
  // ring magazine: 300 degrees of segments around the dial
  const a0 = -Math.PI / 2 - 2.6, a1 = -Math.PI / 2 + 2.6, RR = R + 3;
  if (uses) { const M = magSize(w), N = Math.min(M, 30), low = am.rl <= 0 && am.n <= Math.max(1, M * .25), rel = am.rl > 0, k = rel ? 1 - am.rl / am.max : am.n / M, lit = rel ? Math.floor(N * k) : Math.ceil(N * k - 1e-6);
    for (let i = 0; i < N; i++) { const a = lerp(a1, a0, N > 1 ? i / (N - 1) : .5), x = cx + Math.cos(a) * RR, y = cy + Math.sin(a) * RR, on = i < lit;
      const c = on ? (rel ? ac : low ? (((G.time * 8) | 0) % 2 ? C.red : col(5)) : (i === lit - 1 ? ac : col(5))) : col(2); rect(x - 1, y - 1, N > 20 ? 2 : 3, N > 20 ? 2 : 3, c); }
    if (am.flash > 0) { ctx.globalAlpha = am.flash / .35; ringC(cx, cy, RR + 2, ac, 1); ctx.globalAlpha = 1; }
    }
  else { for (let i = 0; i < 12; i++) { const a = lerp(a1, a0, i / 11); rect(cx + Math.cos(a) * RR - 1, cy + Math.sin(a) * RR - 1, 2, 2, i % 3 ? col(3) : ac); } }
  if (w.spin) { const n = Math.round(p.spin * 18); for (let i = 0; i < n; i++) { const a = Math.PI * .75 + i / 18 * Math.PI * 1.5; rect(Math.round(cx + Math.cos(a) * (R - 5)), Math.round(cy + Math.sin(a) * (R - 5)), 1, 1, p.spin > .8 ? C.orange : col(5)); } }
  // holstered weapon: small satellite dial that keeps reloading
  if (p.weapons.length > 1 && !TOUCH.on) { const w2id = p.weapons[1 - p.wi], w2 = WEAPONS[w2id], sx = cx - 2, sy = cy - 36, r2 = 9, a2 = usesAmmo(w2) ? ammoOf(p, w2id) : null, c2 = usesAmmo(w2) ? wAccent(w2) : col(3), fl = G.bgReloadT > 0 && ((G.time * 16) | 0) % 2;
    disc(sx, sy, r2 + 1, col(0)); ringC(sx, sy, r2 + 1, fl ? c2 : col(2), 1);
    const s2 = sprite('w_' + w2id, w2.spr); ctx.save(); ctx.translate(sx - Math.min(s2.w, 14) / 2, sy - s2.h / 2); ctx.beginPath(); ctx.rect(0, 0, 14, s2.h); ctx.clip(); ctx.globalAlpha = .7; ctx.drawImage(s2.n, 0, 0); ctx.restore(); ctx.globalAlpha = 1;
    if (a2) { const k = a2.rl > 0 ? 1 - a2.rl / a2.max : a2.n / magSize(w2), seg = 16; for (let i = 0; i < seg; i++) { const a = -Math.PI / 2 + i / seg * 6.283; rect(sx + Math.cos(a) * (r2 + 3) - .5, sy + Math.sin(a) * (r2 + 3) - .5, 1, 1, i < Math.floor(seg * k) ? (a2.rl > 0 ? c2 : col(4)) : col(1)); } }
    rect(sx + 8, sy - 12, 9, 9, col(5)); text('X', sx + 11, sy - 10, col(0)); }
}

// crosshair ring: reload fill + low-ammo pips around the cursor
// pixel reload wheel: a 2x2-block sweep with a checker body and a bright leading edge
function drawReloadWheel(cx, cy, R, k, c) { const lim = k * 6.2832;
  for (let gy = -R; gy < R; gy += 2) for (let gx = -R; gx < R; gx += 2) { const mx = gx + 1, my = gy + 1, d = Math.hypot(mx, my); if (d > R || d < 3) continue;
    let an = Math.atan2(my, mx) + Math.PI / 2; if (an < 0) an += 6.2832; if (an > lim) continue;
    const edge = lim - an < .45, chk = ((gx + gy) / 2 & 1) === 0; if (!edge && !chk) continue;
    ctx.globalAlpha = edge ? .95 : .5; rect(cx + gx, cy + gy, 2, 2, edge ? col(5) : c); }
  ctx.globalAlpha = 1; }
function drawAmmoRing(x, y) {
  const p = G.p; if (!p) return; const w = WEAPONS[p.weapons[p.wi]]; if (!usesAmmo(w)) return; const a = ammoOf(p, w.id), M = magSize(w), c = wAccent(w), N = 16;
  if (a.rl > 0) { const k = 1 - a.rl / a.max; for (let i = 0; i < N; i++) { const aa = -Math.PI / 2 + i / N * 6.283; rect(Math.round(x + Math.cos(aa) * 10), Math.round(y + Math.sin(aa) * 10), 1, 1, i < Math.floor(N * k) ? c : col(2)); }
    const aa = -Math.PI / 2 + k * 6.283; rect(Math.round(x + Math.cos(aa) * 10) - 1, Math.round(y + Math.sin(aa) * 10) - 1, 2, 2, col(5)); }
  else if (a.n <= M * .3) { const lit = Math.ceil(N * a.n / M); for (let i = 0; i < N; i++) { const aa = -Math.PI / 2 + i / N * 6.283; rect(x + Math.cos(aa) * 10 - .5, y + Math.sin(aa) * 10 - .5, 1, 1, i < lit ? (((G.time * 6) | 0) % 2 ? C.red : col(5)) : col(1)); } }
}
function drawPreviewWindow(id) {
  const mob = TOUCH.on, w = WEAPONS[id], x = mob ? W / 2 - 79 : W - 166, y = mob ? 4 : 60, ww = 158, hh = mob ? 118 : 168, p = G.p;
  ctx.globalAlpha = .6; rect(x + 3, y + 4, ww, hh, '#000'); ctx.globalAlpha = 1; rect(x, y, ww, hh, 'rgba(12,11,10,.96)'); box(x, y, ww, hh, null, '#2d2925'); rect(x, y, ww, 1, '#3c3732'); rect(x, y, 40, 1, TH.ember); rect(x, y + 1, 14, 1, thA(TH.ember, .4));
  textS(wname(id), x + 6, y + 6, TH.bone, 2); text(L('k_' + (w.lab || w.kind)), x + ww - 6, y + 8, TH.dim, 1, 'right');
  previewUpdate(id, FRAME_DT); previewDraw(x + 4, y + 22);
  box(x + 4, y + 22, 150, 56, null, col(2)); if (usesAmmo(w)) { const fake = { n: magSize(w), rl: 0 }; drawMag(G.p, w, x + 6, y + 80, 146, fake); }
  if (mob) { wrapW(tr(w.d), ww - 12).slice(0, 1).forEach(l => text(l, x + 6, y + 92, col(4))); text(p.weapons.length >= wCap() ? L('replaces', wname(p.weapons[p.wi])) : L('eTake'), x + 6, y + hh - 11, p.weapons.length >= wCap() ? C.red : C.gold); return; }
  [['dmg', 0], ['rate', 1], ['range', 2]].forEach(([k, i]) => { const yy = y + 94 + i * 9; text(L(k), x + 6, yy, col(3)); for (let j = 0; j < 5; j++) rect(x + 60 + j * 8, yy, 6, 5, j < w.st[i] ? col(5) : col(2)); });
  if (usesAmmo(w)) { text(L('reload'), x + 6, y + 121, col(3)); const rs = clamp(Math.round(6 - w.reload * 2), 1, 5); for (let j = 0; j < 5; j++) rect(x + 60 + j * 8, y + 121, 6, 5, j < rs ? wAccent(w) : col(2)); }
  wrapW(tr(w.d), ww - 12).slice(0, 2).forEach((l, i) => text(l, x + 6, y + 132 + i * lineH(), col(4)));
  if (p.weapons.length >= wCap()) text(L('replaces', wname(p.weapons[p.wi])), x + 6, y + hh - 10, C.red);
  else text(L('eTake'), x + 6, y + hh - 10, C.gold);
}
function drawMinimap(x0, y0) {
  const cw = 10, ch = 8;
  box(x0 - 3, y0 - 3, GRID * cw + 4, GRID * ch + 4, 'rgba(10,9,8,.84)', col(2)); rect(x0 - 3, y0 - 3, 16, 1, TH.ember);
  const cur = roomAt(G.p.x, G.p.y);
  for (const r of WORLD.rooms) {
    const seen = r.visited || r.ptnSeen || r.cell.links.some(n => n.room.visited); if (!seen) continue;
    const x = x0 + r.gx * cw, y = y0 + r.gy * ch;
    for (const n of r.cell.links) if (n.room.visited || r.visited) { const nx = x0 + n.room.gx * cw, ny = y0 + n.room.gy * ch; rect(Math.min(x, nx) + 3, Math.min(y, ny) + 2, Math.abs(nx - x) + 2, Math.abs(ny - y) + 2, col(2)); }
  }
  for (const r of WORLD.rooms) {
    const seen = r.visited || r.ptnSeen || r.cell.links.some(n => n.room.visited); if (!seen) continue;
    const x = x0 + r.gx * cw, y = y0 + r.gy * ch, isCur = r === cur;
    rect(x, y, cw - 2, ch - 2, isCur ? col(5) : r.visited ? col(3) : col(2));
    const mark = ROOM_MARK[r.type]; if (mark) rect(x + 2, y + 1, cw - 6, ch - 4, isCur && ((G.time * 4) | 0) % 2 ? col(0) : mark());
    if (r.active) rect(x, y, cw - 2, 1, C.red);
    if (r.key && !r.cleared && seen) rect(x + cw - 4, y, 2, 2, C.gold);
    if (r.type === 'boss' && WORLD.bossLocked) rect(x + 3, y + ch - 4, 2, 2, ((G.time * 3) | 0) % 2 ? col(5) : C.red);
  }
}
// menu pointer: a classic outlined arrow
const ARROW = ['1......', '11.....', '121....', '1221...', '12221..', '122221.', '1222221', '1222111', '12121..', '11.121.', '1..121.', '....11.'];
function drawCursor() {
  const x = Math.round(Input.mx), y = Math.round(Input.my), p = G.p, inGame = G.state === 'play' && !G.hintQ;
  if (!inGame) { for (let j = 0; j < ARROW.length; j++) for (let i = 0; i < ARROW[j].length; i++) { const ch = ARROW[j][i]; if (ch !== '.') rect(x + i, y + j, 1, 1, ch === '1' ? '#0a0908' : '#e8e1d3'); } return; }
  // lock-on when the reticle sits on a foe
  let lock = false; const wx = Input.mx + G.cam.x, wy = Input.my + G.cam.y; for (const e of G.enemies) if (!e.dead && e.spawnT <= 0 && dist(wx, wy, e.x, e.y) < e.r + 8) { lock = true; break; }
  G.xhA = lerp(G.xhA || 0, (p && p.recoil ? p.recoil * .12 : 0) + (lock ? .785 : 0), .25);
  const g = (lock ? 4 : 6) + (p && p.recoil ? p.recoil * .8 : 0), c = lock ? C.red : col(5), tint = buildTint();
  for (let i = 0; i < 4; i++) { const a = G.xhA + i * 1.5708, bx = x + Math.cos(a) * g, by = y + Math.sin(a) * g;
    const ax = Math.cos(a + 2.4) * 3, ay = Math.sin(a + 2.4) * 3, bx2 = Math.cos(a - 2.4) * 3, by2 = Math.sin(a - 2.4) * 3;
    pxLine(bx + 1, by + 1, bx + ax + 1, by + ay + 1, col(0)); pxLine(bx + 1, by + 1, bx + bx2 + 1, by + by2 + 1, col(0));
    pxLine(bx, by, bx + ax, by + ay, c); pxLine(bx, by, bx + bx2, by + by2, c); }
  rect(x - 1, y - 1, 3, 3, col(0)); rect(x, y, 1, 1, tint);
  const hm = G.hitMark; if (hm && hm.t > 0) { hm.t -= FRAME_DT; const hc = hm.kill ? C.red : hm.crit ? C.gold : col(5), r0 = hm.kill ? 4 : 3, r1 = hm.kill ? 9 : 6;
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) pxLine(x + sx * r0, y + sy * r0, x + sx * r1, y + sy * r1, hc); }
  drawAmmoRing(x, y);
  if (p && p.charge > 0) { const k = Math.min(1, p.charge); ringC(x, y, 13 - k * 7, k >= 1 ? C.gold : col(5), 1); }
}

// ================= shard cards =================
function rollCards(minRar = 0, n = 3) {
  const p = G.p, pool = SHARDS.filter(s => (p.shards[s.id] || 0) < s.max && s.rar >= minRar);
  const out = [];
  while (out.length < n && pool.length) { const s = weighted(pool, s => RAR[s.rar].w * (statFloor() >= 1 && s.rar >= 2 ? 1.5 : 1) * (p.shards[s.id] ? 1.4 : 1) * (synergyHint(s.id) ? 1.6 : 1)); out.push(s.id); pool.splice(pool.indexOf(s), 1); }
  return out;
}
function rollCardOptions(minRar = 0) { const opts = rollCards(minRar); return opts.length ? opts : rollCards(0); }
function setCardOptions(cd, opts, t = 0) {
  cd.opts = opts; cd.lv = opts.map(id => (G.p.shards[id] || 0) + 1); cd.t = t; cd.pick = cd.hover = cd.lastHover = -1; cd.pickT = 0;
  // Exclusion arrival times belong to the previous offer, not the new reroll clock.
  cd.born = null; cd.ban = null; cd.frags = null; cd.banMode = false; cd.svHov = cd.svHovL = -1; delete cd.skipT;
}
function finishExhaustedCards() { G.cards = null; G.state = 'play'; notify(L('n_maxed', gainInk(30)), C.gold); }
function openCards(minRar = 0, titleKey = 'choose') {
  const opts = rollCardOptions(minRar);
  if (!opts.length) { finishExhaustedCards(); return; }
  G.cards = { minRar, title: titleKey }; setCardOptions(G.cards, opts); G.state = 'cards'; AU.play('card');
}
// each choice is a long syringe hanging needle-down, its label printed on the barrel
const CARD = { w: 104, h: 208 }, SYR_Y = 30;
function cardRect(i) { const n = G.cards.opts.length, x = W / 2 + (i - (n - 1) / 2) * 140 - CARD.w / 2; return { x, y: SYR_Y }; }
function synergyHint(id) { const p = G.p; for (const s of SYNERGIES) if (!SYN[s.id] && s.need.includes(id) && s.need.every(n => n === id || hasShard(n))) return s;
  if (id === 'prism') for (const s of SYNERGIES) if (!SYN[s.id] && s.need.every(n => ELEM_IDS.includes(n) || p.shards[n])) return s; return null; }
// reroll price: each floor starts higher and climbs faster with every reroll taken on it
const RR_BASE = [30, 80, 180, 290, 430], RR_STEP = [20, 40, 80, 90, 120];
function rerollCost() { const f = clamp(statFloor() | 0, 0, RR_BASE.length - 1); return RR_BASE[f] + (G.rerolls | 0) * RR_STEP[f]; }
const RRB = { x: W / 2 - 64, y: H - 26, w: 128, h: 22 };
RELAYOUT.push(() => { RRB.x = W / 2 - 64; RRB.y = H - 26; menuSky = null; });
function doReroll() { const cd = G.cards; if (!cd || cd.pick >= 0 || cd.skipT !== undefined || cd.banMode || (cd.ban && !cd.ban.done)) return;
  // No payment (including a free charge) when there is nothing left to offer.
  const opts = rollCardOptions(cd.minRar);
  if (!opts.length) { finishExhaustedCards(); return; }
  if (G.freeReroll) G.freeReroll = false;
  else { const c = rerollCost(); if (G.ink < c) { AU.play('ui', .5); notify(L('n_noInk'), C.red); cd.rrDeny = .35; cd.inkFl = .35; return; } G.ink -= c; G.rerolls++; }
  setCardOptions(cd, opts, .2); cd.rrT = 0; AU.play('card'); AU.play('menuOk'); }
function updateCards(rdt) {
  const cd = G.cards; if (!cd) { if (G.state === 'cards') G.state = 'play'; return; } cd.t += rdt;
  if (cd.pick >= 0) { cd.pickT += rdt; if (cd.pickT > 1.05) { G.cards = null; G.state = 'play'; } return; }
  // Recover an empty choice regardless of ink or purchased skip charges.
  if (!Array.isArray(cd.opts) || !cd.opts.length) { const opts = rollCardOptions(cd.minRar); if (opts.length) { setCardOptions(cd, opts); AU.play('card'); } else finishExhaustedCards(); return; }
  // the build view and the pause menu open on top of the choice and come back to it
  if (cd.t > .3 && pressed('Tab')) { openBuild('cards'); return; }
  if (cd.t > .3 && pressed('Escape')) { openPause('cards'); return; }
  cd.hover = -1;
  cd.opts.forEach((id, i) => { const r = cardRect(i); if (Input.mx > r.x && Input.mx < r.x + CARD.w && Input.my > r.y && Input.my < r.y + CARD.h) cd.hover = i; });
  cd.rrHov = Input.mx >= RRB.x && Input.mx <= RRB.x + RRB.w && Input.my >= RRB.y && Input.my <= RRB.y + RRB.h; cd.rrT = (cd.rrT === undefined ? 9 : cd.rrT) + rdt; cd.rrDeny = Math.max(0, (cd.rrDeny || 0) - rdt); cd.inkFl = Math.max(0, (cd.inkFl || 0) - rdt);
  if (cd.rrHov && !cd.rrHovL) AU.play('ui', 1.3); cd.rrHovL = cd.rrHov;
  if (cd.hover !== cd.lastHover && cd.hover >= 0) AU.play('ui', 1 + cd.hover * .12); cd.lastHover = cd.hover;
  let pick = -1; if (cd.t > .45) { if (Input.clicked && cd.hover >= 0) pick = cd.hover; ['Digit1', 'Digit2', 'Digit3'].forEach((k, i) => { if (pressed(k) && i < cd.opts.length) pick = i; }); }
  if (cd.t > .3 && (pressed('KeyR') || (Input.clicked && cd.rrHov))) { doReroll(); return; }
  if (pick >= 0) { G.cards.pick = pick; G.cards.pickT = 0; AU.play('inject'); applyShard(cd.opts[pick]); }
}
function applyShard(id) {
  const p = G.p, s = SHARD[id], before = Object.assign({}, SYN);
  codexMark('s:' + id); p.shards[id] = Math.min(s.max || 1, (p.shards[id] || 0) + 1); recomputeStats(); if (s.once) s.once(p); p.hp = Math.min(p.hp, p.maxHp); computeTints();
  const c = shardColor(s); AU.play('select'); flash(c, .3, true); chroma(.6, true);
  ringFx(p.x, p.y, 50, c, .5, 3); burst(p.x, p.y, 30, c, 160, .7, 2);
  notify(L('n_shard', sname(s) + (p.shards[id] > 1 ? ' LV' + p.shards[id] : '')), c);
  for (const sy of SYNERGIES) if (SYN[sy.id] && !before[sy.id]) { codexAdd(sy.id); G.fusionQ.push(sy); }
}
// a long syringe, needle down: thumb rest, plunger rod, finger flange, a glass barrel of serum with a printed label, shoulder, hub, needle
// press 0..1 drives the plunger home and empties the barrel; returns where the needle tip is
const SYR = { BH: 140, BW: 88 };
// the mark on the label: colours are darkened into ink; a pale (white or grey) one is printed in dark ink instead
const labelInk = c => { const a = hexRgb(c.length > 7 ? c.slice(0, 7) : c), mx = Math.max(...a), mn = Math.min(...a); return mx > 170 && mx - mn < 45 ? '#2a2420' : inkOn(c); };
const inkOn = c => { const a = hexRgb(c.length > 7 ? c.slice(0, 7) : c), m = a.map(v => Math.round(v * .55 + 28 * .45)); return '#' + m.map(v => ('0' + v.toString(16)).slice(-2)).join(''); };
function drawSyringe(cx, top, s, lv, lit, press, t) {
  const c = shardColor(s), rc = RAR[s.rar].c(), BH = SYR.BH, bw = SYR.BW, bx = Math.round(cx - bw / 2), bt = top + 28, po = press * (BH - 16), sy = bt + 2 + po, M = '#8e877b', M2 = '#57524a';
  if (lit) { const g = ctx.createRadialGradient(cx, bt + BH / 2, 4, cx, bt + BH / 2, 90); g.addColorStop(0, thA(c, .2)); g.addColorStop(1, thA(c, 0)); rect(cx - 90, bt - 30, 180, BH + 70, g); }
  const tp = top + press * 20; // the thumb comes down onto the flange while the stopper inside runs the length of the barrel
  rect(cx - 22, tp, 44, 4, M); rect(cx - 22, tp, 44, 1, '#c9c1b2'); rect(cx - 22, tp + 3, 44, 1, M2);                       // thumb rest
  rect(cx - 3, tp + 4, 6, bt - 4 - tp - 4, M2); rect(cx - 3, tp + 4, 1, bt - 4 - tp - 4, M);                                 // rod
  rect(bx - 12, bt - 4, bw + 24, 5, M); rect(bx - 12, bt - 4, bw + 24, 1, '#c9c1b2'); rect(bx - 12, bt, bw + 24, 1, M2);     // flange
  rect(bx, bt, bw, BH, 'rgba(16,14,12,.92)');                                                                                 // glass
  const ly = sy + 6, lh = bt + BH - 1 - ly; if (lh > 0) { const g = ctx.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, thA(c, .95)); g.addColorStop(.5, thA(c, .8)); g.addColorStop(1, thA(c, .5)); rect(bx + 2, ly, bw - 4, lh, g);
    rect(bx + 2, ly, bw - 4, 1, 'rgba(255,255,255,.35)'); for (let i = 0; i < 5; i++) { const q = (t * .35 + i * .29) % 1, bby = bt + BH - 3 - q * Math.max(1, lh - 3); if (bby > ly + 1) rect(bx + 3 + (i % 2) * (bw - 7), bby, 1, 1, 'rgba(255,255,255,.45)'); } }
  rect(bx + 3, sy, bw - 6, 6, '#1a1614'); rect(bx + 3, sy, bw - 6, 1, '#3c3732');                                              // stopper
  // the label: rarity, kind, the serum's mark, its name, level, what it does, what it would trigger
  const lx = bx + 8, lw = bw - 16, lt = bt + 14, lH = BH - 26, ink = '#1e1a16', ink2 = '#5a5248';
  rect(lx, lt, lw, lH, '#d6cdbb'); ctx.globalAlpha *= .35; ctx.drawImage(winGrain(lw, lH), lx, lt); ctx.globalAlpha /= .35;
  { const g = ctx.createLinearGradient(0, lt, 0, lt + lH); g.addColorStop(0, 'rgba(60,40,20,0)'); g.addColorStop(1, 'rgba(60,40,20,.25)'); rect(lx, lt, lw, lH, g); }
  rect(lx, lt, lw, 3, rc); rect(lx + 4, lt + 7, 3, 3, rc); text(L(RAR[s.rar].k), lx + 10, lt + 6 - (isCJK(L(RAR[s.rar].k)) ? 1 : 0), ink, 1); text(tagName(s.tag), lx + lw - 4, lt + 6 - (isCJK(tagName(s.tag)) ? 1 : 0), ink2, 1, 'right');
  icon(s.icon, cx - 8, lt + 17, labelInk(c), 2);
  { const nm = sname(s); text(fitText(nm, lw - 6, 1.5), cx, lt + 36, ink, 1.5, 'center'); }
  for (let l = 0; l < (s.max || 1); l++) { const px = lx + 4 + l * 7; rect(px, lt + 53, 5, 2, l < lv - 1 ? ink2 : l === lv - 1 ? (((t * 4) | 0) % 2 ? inkOn(c) : ink) : '#b5ab98'); }
  { const st = lv > 1 ? L('upLv', lv) : L('isNew'); text(st, lx + lw - 4, lt + 51 - (isCJK(st) ? 1 : 0), lv > 1 ? '#8a5a1a' : ink2, 1, 'right'); }
  rect(lx + 4, lt + 60, lw - 8, 1, '#a89f8e');
  const sh = synergyHint(s.id), lhh = lineH(), maxL = Math.max(1, Math.floor((lH - 64 - (sh ? 15 : 3)) / lhh));
  { const lines = wrapW(tr(s.d(lv)), lw - 8), top = lt + 64;
    if (lines.length <= maxL) lines.forEach((ln, j) => text(ln, lx + 4, top + j * lhh, ink, 1));
    else { const boxH = maxL * lhh, cyc = (lines.length + 1) * lhh, hold = 1.4, run = cyc / 9, ph = t % (hold + run), off = ph < hold ? 0 : (ph - hold) * 9; // rests on the first line, then rolls up and round
      ctx.save(); ctx.beginPath(); ctx.rect(lx, top - 2, lw, boxH + 1); ctx.clip();
      for (const k of [0, 1]) lines.forEach((ln, j) => { const yy = top + j * lhh - off + k * cyc; if (yy > top - lhh && yy < top + boxH) text(ln, lx + 4, yy, ink, 1); });
      for (const [y0, d] of [[top - 2, 1], [top + boxH - 4, -1]]) { const g = ctx.createLinearGradient(0, y0, 0, y0 + 5); g.addColorStop(d > 0 ? 0 : 1, 'rgba(214,205,187,1)'); g.addColorStop(d > 0 ? 1 : 0, 'rgba(214,205,187,0)'); rect(lx, y0, lw, 5, g); } // the lines fade in and out at the edges
      ctx.restore(); } }
  if (sh) { const pu = .5 + Math.sin(t * 4) * .5, by = lt + lH - 14; rect(lx + 2, by, lw - 4, 12, '#1e1a16'); rect(lx + 2, by, 2, 12, sh.c); ctx.globalAlpha *= .6 + pu * .4; const us = L('unlocks', tr(sh.n)), uw = textW(us), room = lw - 12, uy = by + 3 - (isCJK(us) ? 1 : 0);
    if (uw <= room) text(us, cx + 1, uy, sh.c, 1, 'center'); else { const gap = 24, off = (t * 22) % (uw + gap); ctx.save(); ctx.beginPath(); ctx.rect(lx + 6, by, room, 12); ctx.clip(); text(us, lx + 6 - off, uy, sh.c, 1); text(us, lx + 6 - off + uw + gap, uy, sh.c, 1); ctx.restore(); }
    ctx.globalAlpha /= .6 + pu * .4; }
  for (let i = 0; i < 9; i++) rect(bx + bw - 5, bt + 6 + i * 15, i % 2 ? 2 : 4, 1, 'rgba(232,225,211,.7)');                 // graduations
  { const g = ctx.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, 'rgba(255,255,255,.05)'); g.addColorStop(.12, 'rgba(255,255,255,.22)'); g.addColorStop(.2, 'rgba(255,255,255,.03)'); g.addColorStop(.85, 'rgba(0,0,0,.12)'); g.addColorStop(.93, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(0,0,0,.2)'); rect(bx + 1, bt + 1, bw - 2, BH - 2, g); } // the curve of the glass
  box(bx, bt, bw, BH, null, lit ? thA(c, .85) : '#6e675c');
  ctx.fillStyle = M; ctx.beginPath(); ctx.moveTo(bx, bt + BH); ctx.lineTo(bx + bw, bt + BH); ctx.lineTo(cx + 8, bt + BH + 6); ctx.lineTo(cx - 8, bt + BH + 6); ctx.closePath(); ctx.fill(); // shoulder
  rect(cx - 5, bt + BH + 6, 10, 6, M2); rect(cx - 5, bt + BH + 6, 10, 1, M);                                                   // hub
  rect(cx - 1, bt + BH + 12, 2, 28, '#d6cdbb'); rect(cx - 1, bt + BH + 12, 1, 28, '#f0e8d8'); rect(cx, bt + BH + 40, 1, 2, '#8e877b'); // needle
  return bt + BH + 42;
}
function drawCards() {
  const cd = G.cards; if (!cd || !Array.isArray(cd.opts)) return; ctx.drawImage(ditherLayer(.75, col(0)), 0, 0);
  if (cd.fromOrb && cd.t < .5) { const q = cd.t / .5; ctx.globalAlpha = 1 - q; for (let i = 0; i < 3; i++) ringC(W / 2 + (i - 1) * 140, SYR_Y + 98, 20 + q * 90, BLOOD[3], 1); ctx.globalAlpha = 1; }
  const ta = clamp(cd.t * 3, 0, 1), tyo = Math.round((1 - ta) * 8), out = cd.pick >= 0 ? clamp((cd.pickT - .85) / .2, 0, 1) : 0; ctx.globalAlpha = ta * (1 - (cd.pick >= 0 ? clamp(cd.pickT / .2, 0, 1) : 0)) * (cd.skipT !== undefined ? 1 - clamp(cd.skipT / .3, 0, 1) : 1);
  textS(L(cd.title), W / 2, 8 - tyo, TH.bone, 2, 'center'); ctx.globalAlpha = 1;
  if (cd.skipT === undefined) { drawRerollBtn(cd); drawCardInk(cd); }
  let pc = null;
  cd.opts.forEach((id, i) => {
    const s = SHARD[id], r = cardRect(i), lv = cd.lv ? cd.lv[i] : (G.p.shards[id] || 0) + 1, hov = cd.hover === i && cd.pick < 0, chosen = cd.pick === i, cx = r.x + CARD.w / 2;
    // they drop in from above the screen, one after another; the chosen one drives its needle down out of the screen, the others are pulled back up
    // a syringe dropped into a slot later (after an exclusion, js/sieve.js) has its own start time; skipping shrinks them all back
    const k = clamp((cd.t - (cd.born && cd.born[i] !== undefined ? cd.born[i] : i * .1)) / .6, 0, 1); let yo = (easeBack(k) - 1) * (SYR_Y + 250), press = 0, a = 1, sc = 1;
    if (cd.ban && cd.ban.i === i && !cd.ban.done) return;
    if (cd.skipT !== undefined) { const e = clamp(cd.skipT / .5, 0, 1); a = 1 - e * e; sc = 1 - .45 * easeOut(e); yo -= e * 14; }
    if (hov) yo += 3 + Math.sin(G.time * 3) * .8;
    if (cd.pick >= 0) { if (chosen) { const s1 = clamp(cd.pickT / .12, 0, 1); yo += s1 * s1 * 48; press = easeInOut(clamp((cd.pickT - .14) / .45, 0, 1)); pc = shardColor(s); } else { const q = clamp(cd.pickT / .35, 0, 1); yo -= q * q * 320; a = 1 - q; } a *= 1 - out; }
    if (k <= 0 || a <= 0) return;
    ctx.globalAlpha = a; if (sc !== 1) { const py = r.y + yo + 100; ctx.save(); ctx.translate(cx, py); ctx.scale(sc, sc); ctx.translate(-cx, -py); }
    const tip = drawSyringe(cx, r.y + yo, s, lv, (hov || chosen) && cd.skipT === undefined, press, G.time + i * 1.7); if (sc !== 1) ctx.restore();
    if (hov && ((G.time * 1.3 + i) % 1) < .5) { const q = ((G.time * 1.3 + i) % 1) / .5; rect(cx - 1, tip + q * 6, 2, 2, thA(shardColor(s), 1 - q)); } // a bead at the tip
    ctx.globalAlpha = 1;
  });
  // the serum goes in: the edges of the screen flush with its colour
  if (pc) { const ga = clamp((cd.pickT - .1) / .2, 0, 1) * (1 - clamp((cd.pickT - .7) / .35, 0, 1)) * (.85 + Math.sin(cd.pickT * 22) * .15);
    if (ga > 0) { const g = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, W * .62); g.addColorStop(0, thA(pc, 0)); g.addColorStop(.6, thA(pc, .25)); g.addColorStop(1, thA(pc, .85)); ctx.globalAlpha = ga; rect(0, 0, W, H, g); ctx.globalAlpha = 1; } }
}
// the reroll button under the cards: price in ink, or FREE while a free reroll is held
function drawRerollBtn(cd) {
  if (cd.pick >= 0) return; const free = !!G.freeReroll, cost = rerollCost(), can = free || G.ink >= cost, hov = cd.rrHov && can, k = clamp((cd.t - .25) / .3, 0, 1); if (k <= 0) return;
  const shk = cd.rrDeny > 0 ? Math.round(Math.sin(cd.rrDeny * 60) * 2) : 0, x = RRB.x + shk, y = RRB.y + (1 - easeOut(k)) * 10 - (hov ? 1 : 0), w = RRB.w, h = RRB.h, c = free ? C.gold : can ? '#e8e1d3' : '#57524a', ac = free ? C.gold : hov ? C.gold : can ? '#8e877b' : '#3c3732';
  ctx.globalAlpha = k;
  rect(x, y, w, h, hov ? thA(TH.ember, .12) : 'rgba(13,12,11,.94)'); box(x, y, w, h, null, hov ? thA(TH.ember, .8) : '#36322d'); if (hov) rect(x, y, 2, h, TH.ember); rect(x, y, 24, 1, free ? C.gold : TH.ember);
  // spinning glyph
  const sp = cd.rrT < .5 ? easeOut(cd.rrT / .5) * 6.283 : 0, ix = x + 15, iy = y + h / 2;
  ctx.save(); ctx.translate(ix, iy); ctx.rotate(sp + (hov ? Math.sin(G.time * 5) * .25 : 0)); icon('reroll', -4, -4, free ? C.gold : can ? '#e8e1d3' : '#57524a'); ctx.restore();
  text(L('reroll'), x + 27, y + h / 2 - (isCJK(L('reroll')) ? 4 : 2), c, 1);
  rect(x + w - 50, y + 5, 1, h - 10, '#2d2925');
  if (free) { const on = ((G.time * 3) | 0) % 2; textS(L('rrFree'), x + w - 26, y + h / 2 - (isCJK(L('rrFree')) ? 4 : 2), on ? C.gold : '#fff1b8', 1, 'center'); }
  else { const cs = String(cost); icon('ink', x + w - 26 - textW(cs) / 2 - 4, y + h / 2 - 2, can ? C.green : C.red); text(cs, x + w - 26 + 4, y + h / 2 - 2, can ? '#e8e1d3' : C.red, 1, 'center'); }
  if (hov) { const q = (G.time * 1.6) % 1; ctx.globalAlpha = .18 * k; rect(x + 4 + q * (w - 16), y + 2, 6, h - 4, '#ffffff'); }
  ctx.globalAlpha = 1;
}
// how much ink you hold, next to the reroll price
function drawCardInk(cd) { if (cd.pick >= 0) return; const k = clamp((cd.t - .25) / .3, 0, 1); if (k <= 0) return;
  const s = String(G.ink), lab = L('c_held'), w = Math.max(64, textW(lab) + textW(s) + 30), h = RRB.h, x = RRB.x - w - 8, y = RRB.y + (1 - easeOut(k)) * 10, fl = (cd.inkFl || 0) > 0;
  ctx.globalAlpha = k; rect(x, y, w, h, 'rgba(13,12,11,.94)'); box(x, y, w, h, null, fl ? C.red : '#2d2925'); rect(x + w - 26, y, 20, 1, C.green);
  text(lab, x + 8, y + h / 2 - (isCJK(lab) ? 4 : 2), '#8e877b'); icon('ink', x + w - 12 - textW(s) - 10, y + h / 2 - 4, C.green); textS(s, x + w - 10, y + h / 2 - 2, fl ? C.red : '#e8e1d3', 1, 'right');
  ctx.globalAlpha = 1; }
function drawBanner() {
  const b = G.banner; if (!b) return;
  b.max = b.max || b.t; const k = b.t;
  const inT = clamp((b.max - k) * 4, 0, 1), outT = clamp(k * 3, 0, 1), h = 46 * easeOut(Math.min(inT, outT)), y = 96;
  ctx.globalAlpha = .9; rect(0, y - h / 2, W, h, '#080706'); ctx.globalAlpha = 1; if (h > 4) { rect(0, y - h / 2, W, 1, '#2d2925'); rect(0, y + h / 2 - 1, W, 1, '#2d2925'); rect(W / 2 - 40, y - h / 2, 80, 1, b.c); rect(W / 2 - 40, y + h / 2 - 1, 80, 1, b.c); }
  if (h > 30) { const sx = (1 - easeOut(inT)) * 60;
    if (b.syn) { ctx.globalAlpha = .35; text(b.big, W / 2 + sx, y - 13, b.c, 4, 'center'); ctx.globalAlpha = 1; }
    textS(b.big, W / 2 + sx, y - 14, b.c, 4, 'center'); text(b.small, W / 2 - sx, y + 10, col(5), 1, 'center'); }
}
// ================= menus =================
const CODEX = { tab: 0, page: 0, pages: 1, hits: [] };
const BUILD = {};
function codexMark(k) { codexAdd(k); }
const MENU = { page: 'main', sel: 0, t: 0, stack: [], hy: 0, lastMx: 0, lastMy: 0 };
function codexGet() { try { const c = JSON.parse(STORE.getItem('achroma_codex') || '[]'); return Array.isArray(c) ? [...new Set(c.filter(id => typeof id === 'string'))] : []; } catch (e) { return []; } }
function codexAdd(id) { const c = codexGet(); if (!c.includes(id)) { c.push(id); try { STORE.setItem('achroma_codex', JSON.stringify(c)); } catch (e) { } } }
function goPage(p) { MENU.stack.push(MENU.page); MENU.page = p; MENU.sel = 0; MENU.t = 0; MENU.hy = 0; AU.play('menuOk'); }
function backPage() { if (MENU.stack.length) { MENU.page = MENU.stack.pop(); MENU.sel = 0; MENU.t = 0; MENU.hy = 0; AU.play('menu', .8); return true; } return false; }
function cycleLang(d) { const i = LANGS.findIndex(l => l.id === SET.lang); SET.lang = LANGS[(i + (d || 1) + LANGS.length) % LANGS.length].id; saveSettings(); AU.play('menu', 1.2); }
function toggleFS() { if (ONDZ()) return; if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => { }); }
function slider(key, label) {
  const set = v => { SET[key] = clamp(Math.round(v * 10) / 10, 0, 1); saveSettings(); AU.applyVolumes(); AU.play('menu', .6 + SET[key]); };
  return { l: () => L(label || key), slider: key, set, adj: d => set(SET[key] + d * .1), act: () => set(SET[key] >= 1 ? 0 : SET[key] + .1) };
}
function menuItems(page) {
  const lang = { l: () => L('language'), v: () => (LANGS.find(x => x.id === SET.lang) || LANGS[0]).name, adj: d => cycleLang(d), act: () => cycleLang(1) };
  const sv = page === 'main' ? loadSave() : null, cont = sv ? [{ l: () => L('cont'), info: () => chapterTitle(sv.floor) + (SET.lang === 'en' ? ' - ' : ' · ') + tr(DIFF_BY[sv.diff].nm), act: () => continueRun() }] : [];
  if (page === 'main') return [...cont.map(c => Object.assign(c, { ic: 'cont', en: () => 'CONTINUE' })), { ic: 'start', en: () => 'DEPART', l: () => L('start'), sub: () => L('mm_startSub'), act: () => openDiffSelect() }, { ic: 'girls', en: () => 'SURVIVORS', l: () => L('girls'), sub: () => L('mm_girlsSub', SURV_IDS.filter(girlMet).length, SURV_IDS.length), act: () => openGirls() },
    { ic: 'market', en: () => 'BLACK MARKET', l: () => L('market'), sub: () => L('g_proofs', gpLoad().proofs), act: () => openMarket() }, { ic: 'board', en: () => 'RECORDS', l: () => L('board'), sub: () => '', act: () => openBoard() }, { ic: 'codex', en: () => 'ARCHIVE', l: () => L('codex'), sub: () => '', act: () => goPage('codex') }, { ic: 'settings', en: () => 'SETTINGS', l: () => L('settings'), sub: () => '', act: () => goPage('settings') }];
  const hintT = () => { SET.hints = !SET.hints; saveSettings(); AU.play('menu', 1.2); };
  const aimT = () => { SET.aimAssist = !SET.aimAssist; saveSettings(); AU.play('menu', 1.2); };
  const aimItem = !TOUCH.on ? [{ l: () => L('aimAssist'), v: () => SET.aimAssist ? L('on') + '  ' + L('aimPen') : L('off'), act: aimT, adj: aimT }] : [];
  if (page === 'quality') return qualityItems();
  if (page === 'settings') return [{ l: () => L('set_game'), act: () => goPage('gameset') }, { l: () => L('set_ai'), act: () => goPage('aiset') }, ...(TOUCH.on ? [] : [{ l: () => L('howto'), act: () => goPage('howto') }]), { l: () => L('back'), act: () => backPage() }];
  if (page === 'aiset') return aiItems();
  if (page === 'gameset') return [{ l: () => L('nm_set'), v: () => SET.name || '-', act: () => openNameEd(false) }, { l: () => L('hintsSet'), v: () => SET.hints ? L('on') : L('off'), act: hintT, adj: hintT }, ...aimItem, { l: () => L('q_title'), v: () => L(SET.q === 'custom' ? 'q_custom2' : 'q_' + SET.q), act: () => cycleQ(1), adj: d => cycleQ(d) }, { l: () => L('q_custom'), act: () => goPage('quality') }, slider('master'), slider('music'), slider('sfx'), slider('shake', 'shakeS'), slider('flash', 'flashS'),
    ...(ONDZ() ? [] : [{ l: () => L('fullscreen'), v: () => document.fullscreenElement ? L('on') : L('off'), act: toggleFS, adj: toggleFS }]), lang, { l: () => L('back'), act: () => backPage() }];
  if (page === 'pause') return [{ l: () => L('resume'), act: () => { resumeFromPause(); AU.play('menuOk'); } }, ...(chatOn() && G.squad && G.squad.length && G.pauseRet !== 'cards' ? [{ l: () => L('ch_open'), act: () => { if (!openChat('pause')) resumeFromPause(); } }] : []), { l: () => L('settings'), act: () => goPage('settings') }, ...(testOn() && G.pauseRet !== 'cards' ? [{ l: () => L('test_title'), act: () => { G.state = 'play'; openTest(); } }] : []), ...(window.BOSS_TEST && BOSS_TEST.on ? [] : [{ l: () => performance.now() - (MENU.rsArm || -1e9) < 3000 ? L('restartSure') : L('restart'), act: () => { if (performance.now() - (MENU.rsArm || -1e9) < 3000) { MENU.rsArm = 0; restartRun(); } else { MENU.rsArm = performance.now(); AU.play('menu', .7); } } }]), ...(G.endless && G.p && G.p.alive && !(window.BOSS_TEST && BOSS_TEST.on) ? [{ l: () => performance.now() - (MENU.enArm || -1e9) < 3000 ? L('en_endSure') : L('en_end'), act: () => { if (performance.now() - (MENU.enArm || -1e9) < 3000) { MENU.enArm = 0; endEndless(); } else { MENU.enArm = performance.now(); AU.play('menu', .7); } } }] : []), { l: () => L('mainmenu'), act: () => toMenu() }];
  return [{ l: () => L('back'), act: () => backPage() }];
}
function menuLayout(page) {
  if (page === 'main') return { x: 34, y: Math.max(122, Math.round(H * .45)), w: 210, step: 17, sc: 2 };
  if (page === 'pause') return { x: 34, y: 80, w: 160, step: 18, sc: 2 };
  if (page === 'settings' || page === 'quality' || page === 'gameset' || page === 'aiset') { const n = menuItems(page).length, step = Math.min(TOUCH.on ? 19 : 18, Math.floor((H - 62) / n)); return { x: W / 2 - 140, y: 46, w: 280, step, sc: 1 }; }
  return { x: W / 2 - 40, y: H - 30, w: 80, step: 16, sc: 1 };
}
function updateMenu(rdt) {
  if (docked()) { updateDocked(rdt); return; } // js/look.js
  if (WIN_PAGES.has(MENU.page) && Input.clicked && inR(WIN_CLOSE(), Input.mx, Input.my)) { Input.clicked = false; ESC_TAP = true; AU.play('menu', .8); }
  if (MENU.page === 'difficulty') { MENU.t += rdt; updateDiffSelect(rdt); return; }
  if (MENU.page === 'board') { MENU.t += rdt; updateBoard(rdt); return; }
  if (MENU.page === 'girls') { MENU.t += rdt; updateGirls(rdt); return; }
  if (MENU.page === 'market') { MENU.t += rdt; updateMarket(rdt); return; }
  if (MENU.page === 'codex') { MENU.t += rdt; updateCodex(rdt); return; }
  if (G.state === 'menu') campBackdropTick(rdt);
  if (MENU.page === 'main' && G.state === 'menu') { evTick(); if (CAMP.dep) { MENU.t += rdt; return; }
    if (TBAR.area < 0 && Input.clicked && !evHidden() && inR(evCardBox(), Input.mx, Input.my) && (typeof ltCardHit !== 'function' || ltCardHit(evCardBox()))) { Input.clicked = false; openEvent(); return; }
    const b = loginBox(); MENU.lgHov = NET.ready && inR(b, Input.mx, Input.my); if (MENU.lgHov && Input.clicked) { Input.clicked = false; if (!NET.user) netLogin(); else netToast('lg_plat', '#8e877b'); return; }
    MENU.t += rdt; updateTaskbar(rdt); return; }
  if (MENU.page === 'event') { MENU.t += rdt; updateEvent(rdt); return; }
  MENU.t += rdt; const items = menuItems(MENU.page), lay = menuLayout(MENU.page);
  if (MENU.sel >= items.length) MENU.sel = 0;
  const mv = Math.abs(Input.mx - MENU.lastMx) + Math.abs(Input.my - MENU.lastMy) > .5; MENU.lastMx = Input.mx; MENU.lastMy = Input.my;
  let hover = -1; items.forEach((it, i) => { const y = lay.y + i * lay.step; if (Input.mx > lay.x - 8 && Input.mx < lay.x + lay.w && Input.my > y - 4 && Input.my < y + lay.step - 4) hover = i; });
  if (mv && hover >= 0 && hover !== MENU.sel) { MENU.sel = hover; AU.play('menu'); }
  if (MENU.page === 'codex') { }
  else if (pressed('KeyW') || pressed('ArrowUp')) { MENU.sel = (MENU.sel - 1 + items.length) % items.length; AU.play('menu'); }
  if (MENU.page !== 'codex' && (pressed('KeyS') || pressed('ArrowDown'))) { MENU.sel = (MENU.sel + 1) % items.length; AU.play('menu'); }
  const it = items[MENU.sel];
  if (it.adj && (pressed('KeyA') || pressed('ArrowLeft'))) it.adj(-1);
  if (it.adj && (pressed('KeyD') || pressed('ArrowRight'))) it.adj(1);
  if (pressed('Enter') || pressed('Space')) it.act();
  else if (Input.clicked && hover >= 0) { const h = items[hover]; MENU.tapI = hover; MENU.tapT = .18;
    if (h.slider) { if (TOUCH.on) { const bx = lay.x + lay.w; if (Input.mx < bx - 94) h.adj(-1); else if (Input.mx >= bx - 20) h.adj(1); else h.set(clamp((Input.mx - (bx - 94)) / 72, 0, 1)); } else h.adj(Input.mx > lay.x + lay.w - 44 ? 1 : -1); } else h.act(); }
  MENU.tapT = Math.max(0, (MENU.tapT || 0) - rdt);
  if (pressed('Escape')) { if (!backPage() && MENU.page === 'pause') resumeFromPause(); }
}
// option rows: a dark plate with an accent edge (no numbers); values only light up on the chosen row
// on touch screens there is no hover: every row looks the same, a tap flashes the row, sliders become [-] bar [+]
function drawMenuList(page) {
  const items = menuItems(page), lay = menuLayout(page), selY = lay.y + MENU.sel * lay.step, touch = TOUCH.on;
  MENU.hy = MENU.hy ? lerp(MENU.hy, selY, .35) : selY;
  const acc = TH.ember, sc = lay.sc, ty = sc === 2 ? 0 : 3;
  const cj = SET.lang !== 'en', bh = lay.step - (cj ? 1 : 2);
  if (!touch) { const by0 = Math.round(MENU.hy - (cj ? 6 : 4)); rect(lay.x - 8, by0, lay.w + 10, bh, 'rgba(208,112,46,.08)'); rect(lay.x - 8, by0, 2, bh, acc); rect(lay.x - 6, by0 + bh - 1, lay.w + 8, 1, thA(TH.ember, .25)); }
  items.forEach((it, i) => { const y = lay.y + i * lay.step, on = !touch && i === MENU.sel, tap = touch && MENU.tapI === i && MENU.tapT > 0, c = on || touch ? TH.bone : TH.dim, tx = lay.x + (on ? 4 : 0);
    if (touch) { const ry = y - (cj ? 6 : 4); rect(lay.x - 8, ry, lay.w + 10, bh, tap ? '#1d1a17' : '#0e0d0b'); rect(lay.x - 8, ry, 2, bh, tap ? acc : '#2d2925'); }
    text(it.l(), tx, y + ty - 1, c, sc);
    if (it.slider) { const v = SET[it.slider];
      if (touch) { const bx = lay.x + lay.w, mid = y + ty + 1; box(bx - 112, mid - 5, 14, 11, '#151310', '#4c463f'); rect(bx - 108, mid, 6, 1, '#e8e1d3'); box(bx - 16, mid - 5, 14, 11, '#151310', '#4c463f'); rect(bx - 12, mid, 6, 1, '#e8e1d3'); rect(bx - 10, mid - 3, 1, 7, '#e8e1d3');
        rect(bx - 94, mid - 2, 72, 5, '#1d1a17'); rect(bx - 94, mid - 2, 72 * v, 5, acc); rect(bx - 94 + 72 * v - 1, mid - 4, 2, 9, '#e8e1d3'); text(Math.round(v * 100) + '%', bx - 118, mid - 2, '#8e877b', 1, 'right'); }
      else { const sx = lay.x + lay.w - 84; for (let j = 0; j < 10; j++) { const lit = j < Math.round(v * 10); rect(sx + j * 7, y + 2, 5, 5, lit ? (on ? acc : '#8e877b') : '#27231f'); }
        if (on) { text('<', sx - 9, y + 2, acc); text('>', sx + 73, y + 2, acc); } } }
    else if (it.v) { const vs = it.v(), vy = y + ty - (isCJK(vs) ? 1 : 0);
      if (touch) text(vs, lay.x + lay.w - 4, vy, acc, 1, 'right');
      else if (on) { text(vs, lay.x + lay.w - 12, vy, acc, 1, 'right'); text('<', lay.x + lay.w - 18 - textW(vs) - 4, y + ty, acc); text('>', lay.x + lay.w - 6, y + ty, acc); }
      else text(vs, lay.x + lay.w - 12, vy, '#57524a', 1, 'right'); } });
}
// ---------- render quality ----------
const Q_ORDER = ['high', 'medium', 'low', 'lowest', 'custom'];
const FPS_OPTS = () => TOUCH.on ? [0, 30, 60, 90, 120] : [0, 30, 60, 90, 120, 144];
const FPS_MAX = () => TOUCH.on ? 120 : 144;
function applyQuality() { if (!SET.q) SET.q = TOUCH.on ? 'medium' : 'high'; const q = SET.q === 'custom' ? Object.assign({}, QP.high, SET.qc || {}) : Object.assign({}, QP[SET.q] || QP.high); if (q.fps === 'max') q.fps = 0; else if (q.fps > FPS_MAX()) q.fps = FPS_MAX();
  QS.part = q.part; QS.fx = !!q.fx; QS.fps = q.fps ? q.fps : 999; setUIScale(q.ui); }
function cycleQ(d) { const i = Q_ORDER.indexOf(SET.q); SET.q = Q_ORDER[(i + d + Q_ORDER.length) % Q_ORDER.length]; if (SET.q === 'custom' && !SET.qc) SET.qc = Object.assign({}, QP.medium); applyQuality(); saveSettings(); AU.play('menu', 1.1); }
function qSet(k, v) { SET.qc = Object.assign({}, SET.q === 'custom' && SET.qc ? SET.qc : QP[SET.q] || QP.high, { [k]: v }); SET.q = 'custom'; applyQuality(); saveSettings(); AU.play('menu', 1.2); }
function qualityItems() { const cur = () => SET.q === 'custom' ? Object.assign({}, QP.high, SET.qc || {}) : QP[SET.q] || QP.high, PL = [1, .6, .35, .15];
  const fpsStep = d => { const o = FPS_OPTS(), f = cur().fps === 'max' ? 0 : cur().fps; let i = o.indexOf(f ? Math.min(FPS_MAX(), f) : 0); if (i < 0) i = 0; qSet('fps', o[(i + (d > 0 ? 1 : o.length - 1)) % o.length]); };
  const partStep = d => { const i = PL.indexOf(cur().part); qSet('part', PL[((i < 0 ? 0 : i) + (d > 0 ? 1 : PL.length - 1)) % PL.length]); };
  return [{ l: () => L('q_title'), v: () => L(SET.q === 'custom' ? 'q_custom2' : 'q_' + SET.q), act: () => cycleQ(1), adj: d => cycleQ(d) },
    { l: () => L('q_part'), v: () => Math.round(cur().part * 100) + '%', act: () => partStep(1), adj: partStep },
    { l: () => L('q_fx'), v: () => cur().fx ? L('on') : L('off'), act: () => qSet('fx', cur().fx ? 0 : 1), adj: () => qSet('fx', cur().fx ? 0 : 1) },
    { l: () => L('q_ui'), v: () => L(cur().ui >= 3 ? 'q_sharp' : 'q_soft'), act: () => qSet('ui', cur().ui >= 3 ? 2 : 3), adj: () => qSet('ui', cur().ui >= 3 ? 2 : 3) },
    { l: () => L('q_fps'), v: () => { const f = cur().fps; return !f || f === 'max' ? L('q_unl') : Math.min(FPS_MAX(), f) + ' FPS'; }, act: () => fpsStep(1), adj: fpsStep },
    { l: () => L('back'), act: () => backPage() }]; }
// ---------------- windows: every page opened from the camp (and the pause menu) is one of these ----------------
// the camp stays visible behind a dimmed backdrop; a grained plate with a shadow, a header strip with the title and a close button,
// brackets on the corners in the page's colour
const WGRAIN = {};
function winGrain(w, h) { const k = w + 'x' + h; if (WGRAIN[k]) return WGRAIN[k]; const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.fillStyle = '#0c0c0e'; x.fillRect(0, 0, w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const n = (Math.imul(i * 73856093 ^ j * 19349663, 2654435761) >>> 0) / 4294967296; if (n > .84) { x.fillStyle = n > .975 ? '#18181c' : '#111114'; x.fillRect(i, j, 1, 1); } }
  x.fillStyle = 'rgba(255,255,255,.015)'; for (let j = 0; j < h; j += 3) x.fillRect(0, j, w, 1);
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,.03)'); g.addColorStop(1, 'rgba(0,0,0,.25)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  return WGRAIN[k] = c; }
// WINX.nobd: the backdrop was already laid (a sliding window lays it before it moves, a docked one has none)
const WINX = { nobd: false };
function winBackdrop(a = .66) { if (WINX.nobd) return; ctx.globalAlpha = Math.min(.92, a + .14); rect(0, 0, W, H, '#040404'); ctx.globalAlpha = 1; }
const WIN_HH = 22;
// the plate: dark, with a light border; the title and a plain close mark (nothing else)
const WIN_EDGE = '#bdb5a6';
function winFrame(x, y, w, h, acc, title, o = {}) {
  const hh = o.hh || WIN_HH;
  rect(x, y, w, h, 'rgba(8,8,8,.97)'); box(x, y, w, h, null, WIN_EDGE);
  if (title) textS(title, x + 10, y + Math.round((hh - (isCJK(title) ? 14 : 8)) / 2) + 2, '#ece4d4', 1.5);
  if (o.close !== false) { const b = o.closeBox || { x: x + w - 20, y: y + 4, w: 14, h: 14 }, hv = !TOUCH.on && inR(b, Input.mx, Input.my), c = hv ? '#ffffff' : '#8e877b';
    for (let k = 0; k < 6; k++) { rect(b.x + 4 + k, b.y + 4 + k, 1, 1, c); rect(b.x + 9 - k, b.y + 4 + k, 1, 1, c); } }
}
const WIN_KICK = { settings: 'SETTINGS', gameset: 'GAME', aiset: 'AI', quality: 'GRAPHICS', howto: 'FIELD MANUAL', codex: 'ARCHIVE', girls: 'SURVIVORS', market: 'BLACK MARKET', event: 'OPERATION', board: 'RECORDS', difficulty: 'THREAT LEVEL', pause: 'PAUSED' };
// the full-size page window (settings, codex, leaderboard, girls, black market, event, how to play)
const WIN_CLOSE = () => ({ x: W - 44, y: 16, w: 14, h: 14 });
const WIN_PAGES = new Set(['settings', 'gameset', 'aiset', 'quality', 'howto', 'codex', 'girls', 'market', 'event', 'board']);
function panel(title, acc = TH.ember, o = {}) { winBackdrop(); winFrame(24, 12, W - 48, H - 24, acc, title, Object.assign({ closeBox: WIN_CLOSE() }, o)); }
function keyCap(k, x, y) { const w = textW(k) + 6; box(x, y, w, 10, '#e8e1d3'); text(k, x + 3, y + 2, '#0a0908'); return w; }
function drawHowTo() {
  panel(L('howto'), TH.cyan);
  const rows = [['WASD', 'h_move'], ['MOUSE', 'h_aim'], ['LMB', 'h_atk'], ['SPACE', 'h_dash'], ['R', 'h_reload'], ['X / WHEEL', 'h_swap'], ['Q', 'h_support'], ['E', 'h_use'], ['E', 'h_skill'], ['TAB', 'h_build'], ['ESC', 'h_pause']];
  const lx = 38, ty = 44, colW = 196, bottom = H - 40;
  rect(lx, ty, 3, 8, TH.cyan); text(L('controls'), lx + 7, ty + 1, '#8e877b');
  const step = Math.min(16, Math.floor((bottom - ty - 14) / rows.length));
  rows.forEach(([k, d], i) => { const y = ty + 14 + i * step; const kw = keyCap(k, lx, y); text(fitText(L(d), colW - 52), lx + 50, y + 2, '#c9c1b2'); });
  const rx = 250, rw = W - 38 - rx; rect(rx, ty, 3, 8, TH.gold); text(L('tips'), rx + 7, ty + 1, '#8e877b');
  const tips = ['h_p1', 'h_p2', 'h_p3', 'h_p4', 'h_p5'], cols = [TH.red, TH.cyan, TH.gold, TH.violet, TH.green];
  const blocks = tips.map(k => wrapW(L(k), rw - 14)); let total = blocks.reduce((a, b) => a + b.length * lineH() + 8, 0), gap = 8;
  let lines = blocks; if (total > bottom - ty - 14) { gap = 3; lines = blocks.map(b => b.slice(0, 2)); }
  let y = ty + 14; lines.forEach((ls, i) => { const h = ls.length * lineH() + 2; if (y + h > bottom) return; rect(rx, y, 2, h, cols[i]); ls.forEach((l, j) => text(l, rx + 8, y + 1 + j * lineH(), '#c9c1b2')); y += h + gap; });
  drawMenuList('howto');
}

function drawPause() {
  ctx.drawImage(ditherLayer(.75, col(0)), 0, 0);
  if (MENU.page === 'pause') {
    textS(L('paused'), 34, 40, TH.bone, 3); rect(34, 69, 150, 1, TH.line2); rect(34, 69, 30, 1, TH.ember);
    drawMenuList('pause');
    const px = 206, py = 30, pw = W - px - 16, ph = H - 46; frame2(px, py, pw, ph, TH.ember, L('run'));
    const mins = Math.floor(G.runT / 60), secs = ('0' + Math.floor(G.runT % 60)).slice(-2);
    const st = [[L('st_floor'), (G.floor + 1) + '-' + tr(FLOORS[G.floor].name)], [L('st_time'), mins + ':' + secs], [L('st_kills'), G.kills]];
    st.forEach(([k, v], i) => { const x = px + 10 + i * Math.floor((pw - 20) / 3); text(fitText(k, 70), x, py + 20, '#8e877b'); text(fitText(String(v), 74), x, py + 29, '#e8e1d3'); });
    // weapons
    G.p.weapons.forEach((id, i) => { const w = WEAPONS[id], y = py + 44 + i * 14, sp = sprite('w_' + id, w.spr), lv = (G.p.wlv && G.p.wlv[id]) || 0;
      rect(px + 10, y + 2, 2, 9, usesAmmo(w) ? wAccent(w) : col(4)); ctx.drawImage(sp.n, px + 16, Math.round(y + 6 - sp.h / 2)); text(fitText(wname(id), pw - 90), px + 40, y + 3, i === G.p.wi ? '#e8e1d3' : '#8e877b');
      for (let j = 0; j < lv; j++) rect(px + pw - 14 - j * 6, y + 4, 4, 4, C.orange); });
    // shards: auto-sized grid, icon-only when crowded
    const ids = Object.keys(G.p.shards), gy = py + 78, gh = ph - 78 - 34, full = ids.length * 14 <= gh * 2 / 14 * 14 ? false : true;
    text(L('st_shards') + ' ' + ids.length, px + 10, gy, '#8e877b');
    const cellW = ids.length > 12 ? 18 : Math.floor((pw - 20) / 2), cols = Math.max(1, Math.floor((pw - 20) / cellW)), maxRows = Math.floor((gh - 10) / 13);
    ids.slice(0, cols * maxRows).forEach((id, i) => { const s2 = SHARD[id], x = px + 10 + (i % cols) * cellW, y = gy + 10 + Math.floor(i / cols) * 13;
      icon(s2.icon, x, y, shardColor(s2)); if (cellW > 18) text(fitText(sname(s2) + ' ' + G.p.shards[id], cellW - 14), x + 11, y + 1, '#c9c1b2'); else for (let l = 0; l < G.p.shards[id]; l++) rect(x + l * 2, y + 9, 1, 1, col(5)); });
    if (ids.length > cols * maxRows) text('+' + (ids.length - cols * maxRows), px + pw - 10, gy, '#8e877b', 1, 'right');
    // synergies along the bottom, wrapped and capped
    const syn = SYNERGIES.filter(q => SYN[q.id]); let sx = px + 10, sy = py + ph - 22; text(L('synergies'), sx, sy - 9, '#8e877b');
    for (const q of syn) { const w2 = textW(tr(q.n)) + 8; if (sx + w2 > px + pw - 8) { sx = px + 10; sy += 9; } if (sy > py + ph - 6) break; text(tr(q.n), sx, sy, q.c); sx += w2; }
    if (!syn.length) text(L('none'), sx, sy, '#4c463f');
  } else if (MENU.page === 'settings') { panel(L('settings')); drawMenuList('settings'); }
  else if (MENU.page === 'gameset') { panel(L('set_game')); drawMenuList('gameset'); }
  else if (MENU.page === 'aiset') { panel(L('set_ai'), C.pink); drawMenuList('aiset'); }
  else if (MENU.page === 'quality') { panel(L('q_custom')); drawMenuList('quality'); }
  else if (MENU.page === 'howto') drawHowTo();
  else if (MENU.page === 'gamepad') drawGamepadSettings();
}

// ================= fusion cinematic =================
// a synergy takes hold: two cells drift in, their membranes touch and merge, and the merged cell mutates
// (it swells, its nuclei divide, it puts out pseudopods and buds off daughters) before its name surfaces
function cellBlob(x, y, r, t, seed, fill, edge, spikes) {
  const n = 30; ctx.beginPath(); for (let i = 0; i <= n; i++) { const a = i / n * 6.2832, w = 1 + .1 * Math.sin(3 * a + t * 4 + seed) + .06 * Math.sin(5 * a - t * 3 + seed * 2) + (spikes ? spikes * Math.max(0, Math.sin(7 * a + seed)) ** 6 : 0);
    const px = x + Math.cos(a) * r * w, py = y + Math.sin(a) * r * w * .9; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (edge) { ctx.strokeStyle = edge; ctx.lineWidth = 1; ctx.stroke(); }
}
function cellInside(x, y, r, t, seed, c) { for (let i = 0; i < 9; i++) { const a = seed * 3 + i * 2.4 + t * (.6 + (i % 3) * .3), d = r * (.25 + ((i * 37) % 10) / 16); rect(x + Math.cos(a) * d, y + Math.sin(a) * d * .9, 1, 1, i % 3 ? thA(c, .7) : '#e8e1d3'); } }
function drawFusion(cx, cy) {
  const f = G.fusion; if (!f) return; const sy = f.syn, p = G.p, t = f.t, px = p.x - cx, py = p.y - cy - 4;
  const dim = Math.min(1, t * 3) * (t > 2.1 ? 1 - (t - 2.1) / .3 : 1);
  if (dim > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(px, py, 40 + (t > 1.1 ? (t - 1.1) * 200 : 0), 0, 6.2832, true); ctx.clip('evenodd'); ctx.globalAlpha = dim; ctx.drawImage(ditherLayer(.75, col(0)), 0, 0); ctx.restore(); ctx.globalAlpha = 1; }
  const A = SHARD[sy.need[0]], B = SHARD[sy.need[1]] || A, ca = shardColor(A), cb = shardColor(B);
  if (t < 1.1) { // two cells drift together, wobbling; vesicles drift in with them; at the end the membranes touch and merge
    const k = t / 1.1, R = 64 * Math.pow(1 - k, 1.3), rot = k * 2.2, r0 = 9 + k * 2;
    for (let i = 0; i < 14; i++) { const q = (k * 1.4 + i / 14) % 1, a = i * 2.4, d = 70 * (1 - q); ctx.globalAlpha = q; disc(px + Math.cos(a) * d, py + Math.sin(a) * d * .8, 1.5, i % 2 ? thA(ca, .8) : thA(cb, .8)); } ctx.globalAlpha = 1;
    const cs = [[A, ca, 0, 1.3], [B, cb, Math.PI, 2.7]].map(([sh, c, o, sd]) => ({ sh, c, sd, x: px + Math.cos(rot + o) * R, y: py + Math.sin(rot + o) * R * .8 }));
    if (R < r0 * 2.2) { const mx = (cs[0].x + cs[1].x) / 2, my = (cs[0].y + cs[1].y) / 2; cellBlob(mx, my, r0 * .8 + (r0 * 2.2 - R) * .35, t, 5, 'rgba(60,12,16,.85)', null); } // the bridge where they touch
    for (const c of cs) { cellBlob(c.x, c.y, r0, t, c.sd, 'rgba(40,14,16,.88)', thA(c.c, .9)); cellInside(c.x, c.y, r0, t, c.sd, c.c); disc(c.x, c.y, 3.5, '#120607'); disc(c.x, c.y, 2, c.c); icon(c.sh.icon, c.x - 4, c.y - r0 - 11, thA(c.c, .8)); }
  } else { // the mutation
    const k = Math.min(1, (t - 1.1) / .5), fade = t > 2.1 ? 1 - (t - 2.1) / .3 : 1, R = 14 + easeBack(k) * 8 + Math.sin(t * 9) * 1.2;
    ctx.globalAlpha = Math.max(0, fade);
    for (let i = 0; i < 6; i++) { const a = i * 1.047 + t * .4, d = R + 6 + (t - 1.1) * 40 * (.6 + (i % 3) * .2); cellBlob(px + Math.cos(a) * d, py + Math.sin(a) * d * .85, 3 + (i % 2), t, i, 'rgba(50,12,14,.85)', thA(i % 2 ? ca : cb, .8)); } // buds
    cellBlob(px, py, R, t, 9, 'rgba(46,10,12,.92)', thA(sy.c, .95), .35 * k);
    cellBlob(px, py, R * .78, t * 1.3, 4, null, thA(sy.c, .35));
    cellInside(px, py, R, t, 7, sy.c);
    const nn = 1 + Math.min(3, Math.floor(k * 4)); for (let i = 0; i < nn; i++) { const a = t * 1.6 + i * 6.283 / nn, d = nn > 1 ? 5 + k * 3 : 0, x = px + Math.cos(a) * d, y = py + Math.sin(a) * d * .9; disc(x, y, 3.5, '#120607'); disc(x, y, 2, i % 2 ? ca : cb); } // the nuclei divide
    const nm = [...tr(sy.n)], shown = nm.slice(0, Math.ceil(nm.length * Math.min(1, (t - 1.15) * 2.5))).join('');
    textS(shown, px, py - 54, sy.c, 3, 'center');
    if (t > 1.5) textS(tr(sy.d), px, py + 36, col(5), 1, 'center');
    ctx.globalAlpha = 1;
  }
}

// ================= reward orb opening transition =================
function drawOrbOpen(cx, cy) {
  const o = G.orbOpen; if (!o) return; const t = o.t, ox = o.x - cx, oy = o.y - cy - 8, k = clamp(t / .8, 0, 1);
  ctx.drawImage(ditherLayer(Math.min(.75, k * .9), col(0)), 0, 0);
  if (t < .3) { const q = t / .3, sx = ox + (Math.random() - .5) * 3 * q;
    ctx.globalAlpha = .3 + q * .4; disc(sx, oy - q * 12, 4 + q * 10, BLOOD[2]); ctx.globalAlpha = 1; disc(sx, oy - q * 12, 2 + q * 5, BLOOD[3]); disc(sx, oy - q * 12, 1 + q * 2, BLOOD[4]);
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283 + t * 3, r = (1 - q) * 60; rect(sx + Math.cos(a) * r, oy - q * 12 + Math.sin(a) * r * .7, 2, 2, BLOOD[2 + i % 3]); }
    for (let i = 0; i < 5; i++) { const a = i * 1.26 + 0.3; pxLine(sx, oy - q * 12, sx + Math.cos(a) * q * 9, oy - q * 12 + Math.sin(a) * q * 9, col(5)); } // the glass cracking
  } else { const q = clamp((t - .3) / .5, 0, 1), sy0 = oy - 12;
    for (let i = 0; i < 3; i++) { const tx = W / 2 + (i - 1) * 140, ty = SYR_Y + 98, c = BLOOD[3];
      const at = qq => { const e = easeOut(qq), bend = Math.sin(qq * Math.PI) * 40 * (i - 1 || .5); return [lerp(ox, tx, e) + bend * .3, lerp(sy0, ty, e) - Math.sin(qq * Math.PI) * 50]; };
      for (let j = 14; j >= 0; j--) { const qq = Math.max(0, q - j * .022), [x, y] = at(qq); rect(x - 1, y - 1, j ? (j > 8 ? 1 : 2) : 4, j ? (j > 8 ? 1 : 2) : 4, j ? BLOOD[j > 8 ? 1 : 2] : BLOOD[4]); }
      const [hx, hy] = at(q); disc(hx, hy, 2 + Math.round(q * 2), BLOOD[3]); rect(hx - 1, hy - 1, 1, 1, '#ff9a8a');
    }
    if (q < .3) { ctx.globalAlpha = 1 - q / .3; disc(ox, sy0, 16 * (1 - q), BLOOD[3]); ctx.globalAlpha = 1; } }
}

// ================= main menu =================
const MENU_ACC = () => [C.red, C.cyan, C.gold, C.violet, C.green, C.pink];
let menuSky = null, menuMtn = null; const GLOWC = {};
function menuAccent() { return MENU.page === 'main' ? MENU_ACC()[MENU.sel % 6] : MENU.page === 'difficulty' ? DIFFS[diffCur()].c() : C.cyan; }
function buildMenuBg() {
  menuSky = document.createElement('canvas'); menuSky.width = W; menuSky.height = H; const x = menuSky.getContext('2d');
  const cols = ['#08080a', '#0d0c0b', '#121215', '#181512', '#1c1c21'];
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const v = clamp(j / 190, 0, 1) * 4, lo = Math.floor(v), fr = v - lo; x.fillStyle = cols[Math.min(4, lo + (fr * 16 > BAYER[(j & 3) * 4 + (i & 3)] ? 1 : 0))]; x.fillRect(i, j, 1, 1); }
  menuMtn = [[], []]; for (let i = 0; i < W + 40; i++) { menuMtn[0].push(166 + Math.sin(i * .021) * 18 + Math.sin(i * .057 + 1) * 8 + Math.sin(i * .13) * 3); menuMtn[1].push(204 + Math.sin(i * .015 + 2) * 14 + Math.sin(i * .045) * 9 + Math.sin(i * .11 + 1) * 3); }
}
// soft halo: an ordered-dither radial falloff, cached per colour
function glowSprite(c, R) { const k = c + R; if (GLOWC[k]) return GLOWC[k]; const g = document.createElement('canvas'); g.width = g.height = R * 2; const x = g.getContext('2d'); x.fillStyle = c;
  for (let j = 0; j < R * 2; j++) for (let i = 0; i < R * 2; i++) { const d = Math.hypot(i - R + .5, j - R + .5) / R; if (d >= 1) continue; if (Math.pow(1 - d, 2.4) * 16 > BAYER[(j & 3) * 4 + (i & 3)]) x.fillRect(i, j, 1, 1); } return GLOWC[k] = g; }
function drawMenuWorld(t) {
  if (!menuSky) buildMenuBg(); ctx.drawImage(menuSky, 0, 0);
  const px = (Input.mx - W / 2) * .015, py = (Input.my - H / 2) * .01;
  // far stars
  for (let i = 0; i < 40; i++) { const x = (i * 131 + 17) % W, y = (i * 71 + 9) % 150, on = Math.sin(t * (.6 + i % 5 * .3) + i) > .6; rect(x - px, y, 1, 1, on ? '#4c463f' : '#1f1f24'); }
  // mountains (parallax)
  [['#111114', .5], ['#0b0b0d', 1]].forEach(([c, f], L2) => { ctx.fillStyle = c; const o = Math.round(px * 6 * f);
    for (let i = 0; i < W; i++) { const h = Math.round(menuMtn[L2][i + 20 + o] + py * 4 * f); ctx.fillRect(i, h, 1, H - h); } });
  // ash falling + coloured embers drifting up
  for (let i = 0; i < 60; i++) { const x = (i * 97 + Math.sin(t * .3 + i) * 12 - px * 4) % W, y = ((i * 53 + t * (8 + i % 5 * 3)) % H); rect((x + W) % W, y, 1, 1, '#27231f'); }
  for (let i = 0; i < 16; i++) { const q = (t * .05 + i * .0625) % 1, sx = 20 + (i * 131) % (W - 40), x = sx + Math.sin(t * .8 + i * 2) * 10 - px * 3, y = lerp(268, 40, q), c = MENU_ACC()[i % 6];
    ctx.globalAlpha = q < .1 ? q * 10 : q > .8 ? (1 - q) / .2 : 1; rect(x, y, 1, 1, c); ctx.globalAlpha *= .5; rect(x, y + 3, 1, 2, c); ctx.globalAlpha = 1; }
  ctx.drawImage(getVignette(), 0, 0);
}
function drawLogo(x, y, sc, t) {
  const word = L('gameTitle'), s2 = 6, acc = menuAccent(), gl = Math.sin(t * 13) > .95, ch = [...word], hot = 0, by = y + 44;
  if (gl) { textG(word, x - 2, y, C.red, s2); textG(word, x + 2, y, C.cyan, s2); }
  // the first letter carries the menu's accent colour and drips it
  ch.forEach((c, i) => { const ox = x + textWG(ch.slice(0, i).join(''), s2), oy = y + Math.sin(t * 3 + i * .6) * 1.2; textG(c, ox + 2, y + 2, '#000', s2); textG(c, ox, oy, i === hot ? acc : '#e8e1d3', s2); });
  text(L('gameSub'), x + 2, by + 6, '#57524a', 1);
  MENU.drips = MENU.drips || []; if (Math.random() < .05) MENU.drips.push({ x: x + rand(2, textWG(ch[hot], s2) - 4), y: by, v: 0, c: acc });
  for (let i = MENU.drips.length - 1; i >= 0; i--) { const d = MENU.drips[i]; d.v += .03; d.y += d.v; rect(d.x, d.y, 2, 3, d.c); if (d.y > 108) MENU.drips.splice(i, 1); }
}
function drawMenu(t) {
  const pg = MENU.page;
  // the camp: a docked window that just closed slides back out of sight
  if (pg === 'main') { if (DOCK.cur) { DOCK.out = DOCK.cur; DOCK.cur = null; } drawMainMenu(t); // js/look.js
    if (DOCK.out) { DOCK.k -= FRAME_DT * 5; if (DOCK.k <= 0 || TBAR.area < 0 && TBAR.fk < .05) { DOCK.out = null; DOCK.k = 0; } else drawDockWin(DOCK.out, DOCK.r, DOCK.k, t); } drawNetToast(); return; }
  // the codex, the leaderboard and the market open beside the column
  if (docked()) { drawMainMenu(t); DOCK.cur = pg; DOCK.r = dockRect(); drawDockWin(pg, DOCK.r, DOCK.k, t); drawNetToast(); return; }
  DOCK.cur = null;
  // any other window slides in from the right over the darkened camp
  const slide = G.state === 'menu' && WIN_PAGES.has(pg);
  if (slide) { if (TBAR.area >= 0) drawMainMenu(t); winBackdrop(); WINX.nobd = true; ctx.save(); ctx.translate(Math.round((1 - easeOut(clamp(MENU.t / .3, 0, 1))) * W * .7), 0); }
  try {
    if (pg === 'settings') { panel(L('settings')); drawMenuList('settings'); }
    else if (pg === 'gameset') { panel(L('set_game')); drawMenuList('gameset'); }
    else if (pg === 'aiset') { panel(L('set_ai'), C.pink); drawMenuList('aiset'); }
    else if (pg === 'girls') drawGirls(t);
    else if (pg === 'market') drawMarket(t);
    else if (pg === 'event') drawEvent(t);
    else if (pg === 'quality') { panel(L('q_custom')); drawMenuList('quality'); }
    else if (pg === 'howto') drawHowTo();
    else if (pg === 'gamepad') drawGamepadSettings();
    else if (pg === 'codex') drawCodex();
    else if (pg === 'difficulty') drawDiffSelect(t);
    else if (pg === 'board') drawBoard(t);
  } finally { if (slide) { ctx.restore(); WINX.nobd = false; } }
  drawNetToast();
}
// the title list: a pixel icon and a hint for each entry; the chosen one sits on a lit plate with an accent bar and a marker
const MM_ICON = { cont: ['.1.....', '.11....', '.111...', '.1111..', '.111...', '.11....', '.1.....'], start: ['1......', '11111..', '1.1111.', '1.11111', '1......', '1......', '1......'],
  girls: ['.11.11.', '1111111', '1111111', '.11111.', '..111..', '...1...', '.......'], market: ['..111..', '.1...1.', '1111111', '1.1.1.1', '1111111', '1.....1', '1111111'],
  board: ['1111111', '1.111.1', '.11111.', '..111..', '...1...', '..111..', '.11111.'], codex: ['111.111', '1.111.1', '1.1.1.1', '1.1.1.1', '1.1.1.1', '111.111', '...1...'],
  settings: ['..1.1..', '.11111.', '11...11', '.1...1.', '11...11', '.11111.', '..1.1..'] };
function mmIcon(id, x, y, c) { const a = MM_ICON[id]; if (!a) return; for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) if (a[j][i] === '1') rect(x + i, y + j, 1, 1, c); }
const mmRGBA = (hex, a) => { const n = parseInt(hex.slice(1, 7), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
// the left of the screen darkens so the list reads over the camp; the bottom too
function drawMenuShade() { if (!MENU.shade || MENU.shade.width !== W || MENU.shade.height !== H) { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    let g = x.createLinearGradient(0, 0, W * .7, 0); g.addColorStop(0, 'rgba(3,3,4,.92)'); g.addColorStop(.45, 'rgba(3,3,4,.62)'); g.addColorStop(1, 'rgba(3,3,4,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(3,3,4,.55)'); g.addColorStop(.25, 'rgba(3,3,4,0)'); g.addColorStop(.75, 'rgba(3,3,4,0)'); g.addColorStop(1, 'rgba(3,3,4,.75)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    g = x.createRadialGradient(W * .62, H * .55, H * .2, W * .62, H * .55, W * .75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)'); x.fillStyle = g; x.fillRect(0, 0, W, H); MENU.shade = c; }
  ctx.drawImage(MENU.shade, 0, 0); }
function drawMainList(t) {
  const items = menuItems('main'), lay = menuLayout('main'), touch = TOUCH.on, selY = lay.y + MENU.sel * lay.step;
  MENU.hy = MENU.hy ? lerp(MENU.hy, selY, .28) : selY; MENU.hk = MENU.hk || []; const k0 = clamp((MENU.t - .6) / .8, 0, 1);
  items.forEach((it, i) => { const y = lay.y + i * lay.step, on = !touch && i === MENU.sel, tap = touch && MENU.tapI === i && MENU.tapT > 0, lit = on || tap, a = clamp(k0 * 1.4 - i * .08, 0, 1); if (a <= 0) return; ctx.globalAlpha = a;
    MENU.hk[i] = lerp(MENU.hk[i] || 0, lit ? 1 : 0, .22); const k = easeOut(MENU.hk[i]), ox = Math.round(k * 5), lbl = it.l();
    if (k > .02) { const g = ctx.createLinearGradient(lay.x - 18, 0, lay.x + 230, 0); g.addColorStop(0, `rgba(208,112,46,${.16 * k})`); g.addColorStop(1, 'rgba(208,112,46,0)'); ctx.fillStyle = g; ctx.fillRect(lay.x - 18, y - 3, 248, lay.step - 3); }
    text(lbl, lay.x + ox + 1, y + 1, '#000', 2); text(lbl, lay.x + ox, y, lit ? TH.bone : touch ? TH.bone2 : TH.dim, 2);
    const en = it.en ? it.en() : ''; if (en) text(en, lay.x + ox + textW(lbl, 2) + 9, y + 5, lit ? TH.ember : TH.faint, 1); });
  ctx.globalAlpha = 1;
  if (!touch && k0 > 0) { const my = Math.round(MENU.hy + 6); ctx.globalAlpha = k0; rect(lay.x - 16, my, 9, 1, TH.ember); rect(lay.x - 7, my, 1, 1, TH.emberHi); ctx.globalAlpha = 1;
    const cur = items[MENU.sel], sub = cur && (cur.sub ? cur.sub() : cur.info ? cur.info() : ''); if (sub) text(fitText(sub, 230), lay.x, lay.y + items.length * lay.step + 4, TH.dim); }
}
// the DZMM account: its portrait and name (guests see 游客)

function loginBox() { const u = NET.user, lbl = u ? fitText(u.name || u.username || '?', 90) : L('lg_guest'), w = (u ? 24 : 8) + textW(lbl) + 9, h = u ? 20 : 16; return { x: Math.round(W - TB_CLOCK_W - 12 - w), y: Math.round(H - TB_H / 2 - h / 2), w, h, lbl }; }
function drawLoginChip(t) {
  if (!NET.ready) return; const b = loginBox(), u = NET.user, hov = MENU.lgHov && !TOUCH.on, c = hov ? '#8e877b' : '#3c3732';
  const a = tbFade(); ctx.globalAlpha = a; if (hov) rect(b.x, b.y, b.w, b.h, 'rgba(255,255,255,.05)'); box(b.x, b.y, b.w, b.h, null, hov ? TH.line2 : TH.line);
  if (u) { drawAvatar(u, b.x + 3, b.y + 3, 14, '#4c463f'); text(b.lbl, b.x + 22, b.y + (isCJK(b.lbl) ? 6 : 8), TH.bone2); }
  else text(b.lbl, b.x + 6, b.y + (isCJK(b.lbl) ? 3 : 5), TH.dim);
  ctx.globalAlpha = 1;
}
function drawNetToast() { const n = NET.toast; if (!n) return; n.t += FRAME_DT; if (n.t > 3.2) { NET.toast = null; return; }
  const a = clamp(Math.min(n.t / .15, (3.2 - n.t) / .4), 0, 1), w = textW(n.txt) + 16, x = Math.round(W / 2 - w / 2), y = Math.round(H - 26 + (1 - easeOut(Math.min(1, n.t / .2))) * 8);
  ctx.globalAlpha = a; rect(x, y, w, 13, '#0b0b0d'); box(x, y, w, 13, null, '#2d2925'); rect(x, y, 2, 13, n.c); text(n.txt, W / 2 + 1, y + (isCJK(n.txt) ? 2 : 4), n.c, 1, 'center'); ctx.globalAlpha = 1; }

// ================= story intro: plain text, shown at every launch (hold Enter or the screen to skip) =================
const INTRO = { t: 0, hold: 0, done: 0, out: -1, cache: null };
const INTRO_KEYS = ['st_p1', 'st_p2', 'st_p3', 'st_p4', 'st_p5', 'st_p6'];
const introSc = () => SET.lang === 'en' ? 1 : 1.5;
const introCPS = () => SET.lang === 'en' ? 55 : 20; // characters typed per second
const INTRO_PAUSE = 12;                              // a paragraph break costs this many characters of time
// the story wrapped to one column (cached per language and screen width)
function introLines() { const k = SET.lang + W; if (INTRO.cache && INTRO.cache.k === k) return INTRO.cache;
  const sc = introSc(), cw = Math.min(W - 70, 420), lines = []; let total = 0;
  INTRO_KEYS.forEach((key, i) => wrapW(L(key), cw, sc).forEach((s, j) => { if (j === 0 && i > 0) total += INTRO_PAUSE; lines.push({ s, p: i, gap: j === 0 && i > 0 }); total += [...s].length; }));
  return INTRO.cache = { k, lines, total, sc }; }
const introTyped = () => INTRO.t * introCPS();
function finishIntro() { if (INTRO.out < 0) { INTRO.out = 0; AU.play('menuOk'); } }
function updateIntro(rdt) {
  if (typeof FSQ !== 'undefined' && FSQ.open) { updateFSQ(); return; }
  INTRO.t += rdt;
  if (INTRO.t > .3 && INTRO.t < 2.9 && (Input.clicked || pressed('Enter') || pressed('Space') || pressed('Escape'))) { Input.clicked = false; INTRO.t = 2.9; }
  if (INTRO.t >= 3.8) { G.state = 'menu'; MENU.page = 'main'; MENU.t = 0; if (!SET.name) openNameEd(true); }
}
const INTRO_FADE = t => t < 2.9 ? clamp(t / .2, 0, 1) : clamp(1 - (t - 2.9) / .8, 0, 1);
function drawIntroWorld() { rect(0, 0, W, H, '#000'); }
function drawIntroUI() {
  const t = INTRO.t, a = INTRO_FADE(t); ctx.globalAlpha = a; drawPresents(t); ctx.globalAlpha = 1; filmGrain(.05);
}

// ================= launch transition (menu -> run) =================
function drawLaunchOut() {
  const t = LAUNCH.t, acc = menuAccent(), cx = W / 2, cy = H / 2, k = clamp(t / .7, 0, 1), e = k * k * (3 - 2 * k);
  // menu text slides away
  ctx.globalAlpha = Math.min(1, k * 2); ctx.drawImage(ditherLayer(Math.min(.9, k), '#0a0908'), 0, 0); ctx.globalAlpha = 1;
  // a diamond of the accent color unfolds from the prism and swallows the screen
  const dia = (r, c) => { if (r <= 0) return; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); ctx.fill(); };
  const r = e * 470; dia(r, acc); dia(r - 26, '#0a0908'); dia(r * .72, '#e8e1d3'); dia(r * .72 - 6, '#0a0908'); dia(r * .48, acc); dia(r * .48 - 3, '#0a0908'); dia(10 + e * 30, '#e8e1d3');
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 + t * 3, l = 40 + e * 260; pxLine(cx + Math.cos(a) * l * .3, cy + Math.sin(a) * l * .3, cx + Math.cos(a) * l, cy + Math.sin(a) * l, i % 2 ? acc : '#e8e1d3'); }
  if (t > .6) { ctx.globalAlpha = clamp((t - .6) / .15, 0, 1); rect(0, 0, W, H, '#0a0908'); ctx.globalAlpha = 1; }
}
function drawLaunchIn(cx, cy) {
  const t = LAUNCH.inT, k = clamp(t / 1.1, 0, 1), e = 1 - Math.pow(1 - k, 3), p = G.p; if (!p) return;
  const px = p.x - cx, py = p.y - cy - 4, r = e * 560;
  ctx.fillStyle = '#0a0908'; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.moveTo(px, py - r); ctx.lineTo(px - r, py); ctx.lineTo(px, py + r); ctx.lineTo(px + r, py); ctx.closePath(); ctx.fill('evenodd');
  const ce = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => [px + dx * r, py + dy * r]); for (let i = 0; i < 4; i++) pxLine(ce[i][0], ce[i][1], ce[(i + 1) % 4][0], ce[(i + 1) % 4][1], buildTint());
  if (t < .5) { const w2 = (1 - t / .5) * 8; ctx.globalAlpha = .6; rect(px - w2, 0, w2 * 2, py + 6, '#e8e1d3'); ctx.globalAlpha = 1; ringC(px, py + 6, 6 + t * 40, '#e8e1d3', 1); }
}

// ================= system notices =================
// short, formally worded messages shown in a fixed log under the vitals instead of floating over the hero
function notify(txt, c, count = true) { if (!G || !G.notes) return; const n = G.notes.find(q => q.txt === txt); if (n) { n.n = count ? n.n + 1 : 1; n.born = G.time; return; }
  G.notes.unshift({ txt, c: c || col(5), born: G.time, n: 1 }); if (G.notes.length > 4) G.notes.length = 4; }
function drawNotes() { const ns = G.notes; if (!ns || !ns.length) return; let y = (TOUCH.on ? 96 : 48) + (G.curse || (G.curses && G.curses.length) ? 10 : 0) + (G.state === 'play' ? statusH() : 0);
  for (const q of ns) { const age = G.time - q.born, s = q.txt + (q.n > 1 ? '  X' + q.n : ''), w = textW(s) + 14, x = 6 - (1 - easeOut(Math.min(1, age / .16))) * (w + 10), a = clamp((2.8 - age) / .4, 0, 1);
    ctx.globalAlpha = a * .82; rect(x, y, w, 11, col(0)); ctx.globalAlpha = a; rect(x, y, 2, 11, q.c); rect(x + 2, y + 10, w - 2, 1, '#2d2925'); text(s, x + 7, y + 2, q.c === col(5) ? '#e8e8ec' : q.c); y += 13; }
  ctx.globalAlpha = 1; G.notes = ns.filter(q => G.time - q.born < 2.8); }

// ================= first-run question: mechanic hints =================
const HQ = { sel: 1, t: 0, lmx: 0, lmy: 0 };
function openHintQ() { G.hintQ = true; HQ.sel = 1; HQ.t = 0; }
function hintLayout() { const pw = 300, lines = wrapW(L('hintQBody'), pw - 28), lh = lineH(), bh = lines.length * lh, px = Math.round(W / 2 - pw / 2), by0 = 34 + bh + 10, ph = by0 + 18 + 26, py = Math.round(H / 2 - ph / 2), by = py + by0, bw = 120, gap = 10;
  return { pw, ph, px, py, lines, lh, by, btns: [{ x: W / 2 - gap / 2 - bw, y: by, w: bw, h: 18 }, { x: W / 2 + gap / 2, y: by, w: bw, h: 18 }] }; }
function updateHintQ(rdt) {
  if (LAUNCH.inT < .9) return; HQ.t += rdt; if (HQ.t < .35) return;
  if (pressed('KeyA') || pressed('ArrowLeft')) { HQ.sel = 0; AU.play('menu'); }
  if (pressed('KeyD') || pressed('ArrowRight')) { HQ.sel = 1; AU.play('menu', 1.1); }
  const lay = hintLayout(); let hov = -1; lay.btns.forEach((b, i) => { if (Input.mx >= b.x && Input.mx <= b.x + b.w && Input.my >= b.y && Input.my <= b.y + b.h) hov = i; });
  const mv = Math.abs(Input.mx - HQ.lmx) + Math.abs(Input.my - HQ.lmy) > .5; HQ.lmx = Input.mx; HQ.lmy = Input.my;
  if (mv && hov >= 0 && hov !== HQ.sel) { HQ.sel = hov; AU.play('menu', 1 + hov * .1); }
  if (pressed('Enter') || pressed('Space') || (Input.clicked && hov >= 0)) { if (hov >= 0 && Input.clicked) HQ.sel = hov;
    SET.hints = HQ.sel === 0; saveSettings(); G.hintQ = false; Input.clicked = false; Input.down = false; AU.play('menuOk'); notify(L(SET.hints ? 'hintOnN' : 'hintOffN'), col(5)); }
}
function drawHintQ() {
  if (LAUNCH.inT < .9) return; const k = clamp(HQ.t / .25, 0, 1), lay = hintLayout(), { px, py, pw, ph } = lay;
  ctx.globalAlpha = k; winBackdrop(.6); winFrame(px, py, pw, ph, TH.ember, L('hintQTitle'), { close: false });
  lay.lines.forEach((l, i) => text(l, px + 14, py + 32 + i * lay.lh, TH.bone2));
  lay.btns.forEach((b, i) => drawBtn(b.x, b.y, b.w, b.h, L(i ? 'hintNo' : 'hintYes'), HQ.sel === i, i ? TH.ember : TH.bone));
  text(L('hintNote'), W / 2, lay.by + 27, TH.faint, 1, 'center');
  ctx.globalAlpha = 1;
}
