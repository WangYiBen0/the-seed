// ===== ACHROMA panels: the build view (TAB), full run details, effect timers, scrolling lists =====
'use strict';
// ---------- scroll regions: wheel over it, drag with the mouse or a finger; a press released without moving is a tap ----------
function mkScroll() { return { pos: 0, target: 0, max: 0, drag: null, r: null, ch: 0 }; }
function scrollReset(S) { S.pos = S.target = 0; S.drag = null; }
// returns the tap position in content coordinates ({x, y} from the region's top-left, scroll included), or null
function scrollUpd(S, r, ch, step) {
  if (!r) return null; S.r = r; S.ch = ch; S.max = Math.max(0, Math.ceil(ch - r.h)); let tap = null;
  const mx = Input.mx, my = Input.my, inside = mx >= r.x && mx <= r.x + r.w + 4 && my >= r.y && my <= r.y + r.h;
  if (inside && Input.wheel) S.target += Math.sign(Input.wheel) * (step || 24);
  if (Input.clicked && inside && !S.drag) S.drag = { x: mx, y: my, s: S.target, moved: false };
  if (S.drag) { const d = S.drag; if (Math.abs(my - d.y) > 4) d.moved = true; if (d.moved) S.target = d.s - (my - d.y);
    if (!Input.down) { if (!d.moved) tap = { x: d.x - r.x, y: d.y - r.y + S.pos }; S.drag = null; } }
  S.target = clamp(S.target, 0, S.max);
  S.pos = S.drag && S.drag.moved ? S.target : lerp(S.pos, S.target, .35); if (Math.abs(S.pos - S.target) < .3) S.pos = S.target;
  return tap;
}
function scrollClip(r) { ctx.save(); ctx.beginPath(); ctx.rect(r.x - 2, r.y, r.w + 4, r.h); ctx.clip(); }
// a thin track and thumb on the right edge, plus small chevrons when more is hidden above / below
function scrollBar(S, r) { if (S.max <= 0) return; const kh = Math.max(10, r.h * r.h / (r.h + S.max)), ky = r.y + (r.h - kh) * (S.pos / S.max), x = r.x + r.w + 3;
  rect(x, r.y, 1, r.h, '#1f1f24'); rect(x - 1, Math.round(ky), 3, Math.round(kh), S.drag && S.drag.moved ? '#c9c1b2' : '#4c463f');
  const bl = ((G.time * 2) | 0) % 2 ? '#8e877b' : '#57524a';
  if (S.pos > 1) { rect(x - 9, r.y + 1, 5, 1, bl); rect(x - 8, r.y, 3, 1, bl); }
  if (S.pos < S.max - 1) { rect(x - 9, r.y + r.h - 2, 5, 1, bl); rect(x - 8, r.y + r.h - 1, 3, 1, bl); } }
const cjY = s => isCJK(String(s)) ? 1 : 0;
const ownedShardDesc = (id, lv) => id === 'phoenix' ? L(G.p.phoenixUsed ? 'reviveSpent' : 'reviveReady') : tr(SHARD[id].d(lv));

// =====================================================================
// the build view (TAB): shards on the left, stats + synergies + curses on the right; everything scrolls, any entry opens its details
// =====================================================================
Object.assign(BUILD, { t: 0, out: -1, ret: 'play', det: null, SL: mkScroll(), SR: mkScroll(), hov: null });
function openBuild(ret) { G.state = 'build'; BUILD.ret = ret || 'play'; BUILD.t = 0; BUILD.out = -1; BUILD.det = null; BUILD.hov = null; BUILD.SL.drag = BUILD.SR.drag = null; AU.play('menu', 1.15); AU.play('card', 1.4, .35); }
function closeBuild() { if (BUILD.out < 0) { BUILD.out = 0; BUILD.det = null; AU.play('menu', .8); } }
const BUILD_OUT = .2;
function buildLay() { const rx = W - 152, top = 34, bot = H - 8;
  const L0 = { x: 12, y: top, w: rx - 20, h: bot - top }, R0 = { x: rx, y: top + 98, w: W - rx - 12, h: bot - top - 98 };
  return { L0, list: { x: L0.x + 6, y: L0.y + 16, w: L0.w - 16, h: L0.h - 21 }, st: { x: rx, y: top, w: W - rx - 12, h: 92 }, R0, rl: { x: R0.x + 5, y: R0.y + 16, w: R0.w - 14, h: R0.h - 21 }, cw: Math.floor((L0.w - 16 - 6) / 2) }; }
// the right-hand list: active synergies, then (if any) the curses you carry
function buildRight() { const out = SYNERGIES.filter(q => SYN[q.id]).map(q => ({ kind: 'syn', id: q.id, h: 19 })); const cs = G.curses || [];
  if (cs.length) { out.push({ kind: 'hdr', h: 13 }); cs.forEach(id => { if (CURSE[id]) out.push({ kind: 'curse', id, h: 19 }); }); } return out; }
function buildRightAt(items, y) { let acc = 0; for (const it of items) { if (y >= acc && y < acc + it.h - 2) return it.kind === 'hdr' ? null : it; acc += it.h; } return null; }
function updateBuild(rdt) {
  BUILD.t += rdt;
  if (BUILD.out >= 0) { BUILD.out += rdt; if (BUILD.out > BUILD_OUT) { G.state = BUILD.ret || 'play'; BUILD.out = -1; } return; }
  if (BUILD.det) { BUILD.det.t += rdt; if (pressed('Tab')) { closeBuild(); return; }
    if (pressed('Escape') || pressed('Enter') || pressed('Space') || (Input.clicked && BUILD.det.t > .15)) { Input.clicked = false; BUILD.det = null; AU.play('menu', .8); } return; }
  if (pressed('Tab') || pressed('Escape')) { closeBuild(); return; }
  const Ly = buildLay(), ids = Object.keys(G.p.shards), cw = Ly.cw, right = buildRight();
  if (pressed('KeyW') || pressed('ArrowUp')) BUILD.SL.target -= 24; if (pressed('KeyS') || pressed('ArrowDown')) BUILD.SL.target += 24;
  const tapL = scrollUpd(BUILD.SL, Ly.list, Math.ceil(ids.length / 2) * 24, 24), tapR = scrollUpd(BUILD.SR, Ly.rl, right.reduce((a, it) => a + it.h, 0), 19);
  const shardAt = (x, y) => { if (x < 0 || x > Ly.list.w) return -1; const c = x > cw + 3 ? 1 : 0, row = Math.floor(y / 24), i = row * 2 + c; return y - row * 24 < 21 && i < ids.length && y >= 0 ? i : -1; };
  const open = d => { BUILD.det = Object.assign({ t: 0 }, d); AU.play('ui', 1.25); };
  if (tapL) { const i = shardAt(tapL.x, tapL.y); if (i >= 0) open({ kind: 'shard', id: ids[i] }); }
  if (tapR) { const it = buildRightAt(right, tapR.y); if (it) open({ kind: it.kind, id: it.id }); }
  // hover highlight (mouse only)
  BUILD.hov = null; if (!TOUCH.on && !BUILD.SL.drag && !BUILD.SR.drag) { const mx = Input.mx, my = Input.my;
    if (inR(Ly.list, mx, my)) { const i = shardAt(mx - Ly.list.x, my - Ly.list.y + BUILD.SL.pos); if (i >= 0) BUILD.hov = 'S' + ids[i]; }
    else if (inR(Ly.rl, mx, my)) { const it = buildRightAt(right, my - Ly.rl.y + BUILD.SR.pos); if (it) BUILD.hov = it.kind + it.id; } }
  if (BUILD.hov && BUILD.hov !== BUILD.lastHov) AU.play('ui', 1.4, .5); BUILD.lastHov = BUILD.hov;
}
// opening: the backdrop dithers in, a scan line sweeps, the panels slide in from both sides and the shards pop in one by one; closing runs it backwards
function buildK() { return BUILD.out >= 0 ? 1 - easeOut(clamp(BUILD.out / BUILD_OUT, 0, 1)) : easeOut(clamp(BUILD.t / .28, 0, 1)); }
function slideK(delay) { return BUILD.out >= 0 ? buildK() : easeOut(clamp((BUILD.t - delay) / .3, 0, 1)); }
function drawBuildOverlay() {
  const k = buildK(), opening = BUILD.out < 0, t = BUILD.t, Ly = buildLay(), p = G.p, ids = Object.keys(p.shards), cw = Ly.cw;
  if (k > .02) ctx.drawImage(ditherLayer(Math.max(.0625, .85 * k), col(0)), 0, 0);
  if (opening && t < .4) { const q = easeOut(t / .4), y = Math.round(q * H); ctx.globalAlpha = .55 * (1 - q); rect(0, y, W, 1, buildTint()); rect(0, H - y, W, 1, col(5)); ctx.globalAlpha = 1; }
  // title
  { const kk = slideK(0); ctx.globalAlpha = kk; textS(L('build'), 34 - Math.round((1 - kk) * 24), 9, col(5), 3);
    if (!TOUCH.on) text(L('buildHint'), W - 14 + Math.round((1 - kk) * 24), 17, col(3), 1, 'right'); }
  // ---- shards (left) ----
  { const kk = slideK(.04), L0 = Ly.L0, li = Ly.list, S = BUILD.SL; ctx.save(); ctx.translate(-Math.round((1 - kk) * 36), 0); ctx.globalAlpha = kk;
    frame2(L0.x, L0.y, L0.w, L0.h, C.gold, L('st_shards')); const tot = ids.reduce((a, id) => a + p.shards[id], 0); text(String(tot), L0.x + L0.w - 10, L0.y + 6, '#8e877b', 1, 'right');
    if (!ids.length) wrapW(L('noShards'), li.w - 8).forEach((l, i) => text(l, li.x + 2, li.y + 4 + i * lineH(), col(4)));
    scrollClip(li);
    ids.forEach((id, i) => { const s2 = SHARD[id], x = li.x + (i % 2) * (cw + 6), y = Math.round(li.y + Math.floor(i / 2) * 24 - S.pos), ch = 24; if (y > li.y + li.h || y + ch < li.y) return;
      const ik = opening ? easeOut(clamp((t - .1 - i * .018) / .2, 0, 1)) : 1; if (ik <= 0) return; ctx.globalAlpha = kk * ik;
      const c = shardColor(s2), lv = p.shards[id], hov = BUILD.hov === 'S' + id, ox = Math.round((1 - ik) * 10);
      poly([[x + ox, y], [x + ox + cw, y], [x + ox + cw, y + ch - 6], [x + ox + cw - 4, y + ch - 3], [x + ox, y + ch - 3]], hov ? '#18181d' : col(1), hov ? c : col(2)); rect(x + ox, y, 2, ch - 3, c);
      icon(s2.icon, x + ox + 5, y + 6, c); text(fitText(sname(s2), cw - 24 - s2.max * 5), x + ox + 17, y + 3, c);
      for (let l = 0; l < s2.max; l++) rect(x + ox + cw - 6 - (s2.max - l) * 5, y + 4, 3, 3, l < lv ? c : col(2));
      text(fitText((wrapW(ownedShardDesc(id, lv), 9999)[0] || ''), cw - 22), x + ox + 17, y + 12, id === 'phoenix' && p.phoenixUsed ? '#6e675c' : hov ? '#c9c1b2' : col(4));
      if (ik < 1) { ctx.globalAlpha = kk * (1 - ik) * .8; rect(x + ox, y, cw, ch - 3, '#ffffff'); } });
    ctx.restore(); ctx.save(); ctx.translate(-Math.round((1 - kk) * 36), 0); ctx.globalAlpha = kk; scrollBar(S, li); ctx.restore(); }
  // ---- stats (right, top) ----
  { const kk = slideK(.08), st = Ly.st, rw = st.w, rx = st.x; ctx.save(); ctx.translate(Math.round((1 - kk) * 36), 0); ctx.globalAlpha = kk;
    frame2(rx, st.y, rw, st.h, C.cyan, L('stats'));
    const S = G.S, w = WEAPONS[p.weapons[p.wi]];
    const rows = [[L('st_dmg'), 'X' + S.dmg.toFixed(2)], [L('st_rate'), 'X' + rateMul().toFixed(2)], [L('st_crit'), Math.round(S.crit * 100) + '%'], [L('st_size'), 'X' + S.size.toFixed(2)], [L('st_mag'), usesAmmo(w) ? 'X' + S.mag.toFixed(2) : '-'], [L('st_rel'), 'X' + S.reload.toFixed(2)]];
    rows.forEach(([a, v], i) => { const y = st.y + 18 + i * 11, rk = opening ? clamp((t - .14 - i * .03) / .15, 0, 1) : 1; ctx.globalAlpha = kk * rk; text(fitText(a, rw - 50), rx + 8, y, '#8e877b'); text(v, rx + rw - 8, y, '#e8e1d3', 1, 'right'); });
    ctx.restore(); }
  // ---- synergies + curses (right, bottom) ----
  { const kk = slideK(.12), R0 = Ly.R0, rl = Ly.rl, S = BUILD.SR, items = buildRight(), nS = items.filter(it => it.kind === 'syn').length; ctx.save(); ctx.translate(Math.round((1 - kk) * 36), 0); ctx.globalAlpha = kk;
    frame2(R0.x, R0.y, R0.w, R0.h, C.violet, L('synergies')); text(String(nS), R0.x + R0.w - 10, R0.y + 6, '#8e877b', 1, 'right');
    if (!items.length) text(L('none'), rl.x + 4, rl.y + 2, '#4c463f');
    scrollClip(rl); let y = rl.y - S.pos;
    items.forEach((it, i) => { const yy = Math.round(y); y += it.h; if (yy > rl.y + rl.h || yy + it.h < rl.y) return; const ik = opening ? easeOut(clamp((t - .16 - i * .04) / .2, 0, 1)) : 1; ctx.globalAlpha = kk * ik;
      const hov = BUILD.hov === it.kind + it.id, ox = Math.round((1 - ik) * 8);
      if (it.kind === 'hdr') { rect(rl.x + 1, yy + 4, 3, 5, CURSE_C); text(L('b_curses'), rl.x + 8, yy + 3 - cjY(L('b_curses')), '#e8b8bc'); pxLine(rl.x + 12 + textW(L('b_curses')), yy + 6, rl.x + rl.w, yy + 6, '#3a1c20'); return; }
      if (hov) rect(rl.x - 1 + ox, yy - 1, rl.w + 2, it.h - 1, '#17171c');
      if (it.kind === 'syn') { const q = SYNERGIES.find(s => s.id === it.id); rect(rl.x + 1 + ox, yy, 2, 16, q.c); text(fitText(tr(q.n), rl.w - 8), rl.x + 6 + ox, yy + 1, q.c); text(fitText(tr(q.d), rl.w - 8), rl.x + 6 + ox, yy + 9, hov ? '#c9c1b2' : '#8e877b'); }
      else { const c = CURSE[it.id]; rect(rl.x + 1 + ox, yy, 2, 16, CURSE_C); icon(c.icon, rl.x + 6 + ox, yy, CURSE_C); text(fitText(tr(c.n), rl.w - 19), rl.x + 17 + ox, yy + 1, '#e8b8bc'); text(fitText(tr(c.d), rl.w - 8), rl.x + 6 + ox, yy + 9, hov ? '#c8a8ac' : '#8c6a6e'); } });
    ctx.restore(); ctx.save(); ctx.translate(Math.round((1 - kk) * 36), 0); ctx.globalAlpha = kk; scrollBar(S, rl); ctx.restore(); }
  ctx.globalAlpha = 1;
  if (BUILD.det) drawBuildDet(BUILD.det);
}
// ---- the detail card for one entry ----
function detContent(d) { const p = G.p, lh = lineH(), pw = 272, tw = pw - 24, out = { pw, rows: [] }, add = (s, c, gap) => { wrapW(s, tw).forEach(l => out.rows.push({ s: l, c, h: lh })); if (gap) out.rows.push({ h: gap }); };
  if (d.kind === 'shard') { const s = SHARD[d.id], lv = p.shards[d.id] || 0, c = shardColor(s); Object.assign(out, { c, ic: s.icon, nm: sname(s), sub: L(RAR[s.rar].k) + '  ' + tagName(s.tag), subC: RAR[s.rar].c(), lv, max: s.max });
    out.rows.push({ s: 'LV ' + lv + (lv >= s.max ? '  ' + L('b_max') : ''), c: C.gold, h: lh + 1 }); add(ownedShardDesc(d.id, lv), '#e8e8ec', 5);
    if (lv < s.max) { out.rows.push({ s: L('b_next') + '  LV ' + (lv + 1), c: '#8e877b', h: lh + 1 }); add(tr(s.d(lv + 1)), '#8e877b', 5); }
    const rel = SYNERGIES.filter(q => q.need.includes(d.id)); if (rel.length) { out.rows.push({ s: L('synergies'), c: '#8e877b', h: lh + 2 }); rel.forEach(q => out.rows.push({ syn: q, h: 12 })); } }
  else if (d.kind === 'syn') { const q = SYNERGIES.find(s => s.id === d.id); Object.assign(out, { c: q.c, ic: null, nm: tr(q.n), sub: L('synergy'), subC: q.c });
    add(tr(q.d), '#e8e8ec', 6); out.rows.push({ s: L('b_need'), c: '#8e877b', h: lh + 2 }); q.need.forEach(n => { if (SHARD[n]) out.rows.push({ need: n, h: 12 }); }); }
  else { const c = CURSE[d.id]; Object.assign(out, { c: CURSE_C, ic: c.icon, nm: tr(c.n), sub: L('b_curses'), subC: '#8c6a6e' }); add(tr(c.d), '#e8b8bc', 2); }
  out.h = 46 + out.rows.reduce((a, r) => a + r.h, 0) + 16; return out; }
function drawBuildDet(d) {
  const k = easeOut(clamp(d.t / .18, 0, 1)), D = detContent(d), pw = D.pw, ph = Math.min(H - 12, D.h), x = Math.round(W / 2 - pw / 2), y = Math.round(H / 2 - ph / 2 + (1 - k) * 14), c = D.c;
  ctx.globalAlpha = .55 * k; rect(0, 0, W, H, '#000'); ctx.globalAlpha = k;
  rect(x + 4, y + 4, pw, ph, '#000'); poly([[x + 8, y], [x + pw, y], [x + pw, y + ph - 8], [x + pw - 8, y + ph], [x, y + ph], [x, y + 8]], '#0d0c0b', '#3c3732');
  rect(x + 8, y, Math.round((pw - 8) * k), 2, c); rect(x + pw - 2, y + ph - 26, 2, 18, c);
  // header: big icon, name, sub line, level pips
  let tx = x + 12; if (D.ic) { rect(x + 12, y + 10, 28, 28, '#0a0908'); box(x + 12, y + 10, 28, 28, null, '#2d2925'); icon(D.ic, x + 14, y + 12, c, 3); tx = x + 48; }
  else { rect(x + 12, y + 10, 3, 28, c); tx = x + 22; }
  textS(fitText(D.nm, x + pw - tx - 12, 2), tx, y + 11, c, 2); text(D.sub, tx, y + 30 - cjY(D.sub), D.subC);
  if (D.max) for (let l = 0; l < D.max; l++) { const px = x + pw - 12 - (D.max - l) * 7; if (l < D.lv) rect(px, y + 32, 5, 3, c); else box(px, y + 32, 5, 3, null, '#3c3732'); }
  pxLine(x + 12, y + 42, x + pw - 12, y + 42, '#27231f');
  let yy = y + 48; for (const r of D.rows) { if (yy > y + ph - 18) break;
    if (r.s) text(r.s, x + 12, yy, r.c);
    else if (r.syn) { const q = r.syn, on = !!SYN[q.id]; rect(x + 12, yy + 1, 2, 7, on ? q.c : '#3c3732'); text(tr(q.n), x + 18, yy, on ? q.c : '#57524a'); let ix = x + 24 + textW(tr(q.n)); q.need.forEach(n => { const s = SHARD[n]; if (!s) return; icon(s.icon, ix, yy, hasShard(n) ? shardColor(s) : '#3c3732'); ix += 10; }); }
    else if (r.need) { const s = SHARD[r.need], own = hasShard(r.need); icon(s.icon, x + 14, yy, own ? shardColor(s) : '#3c3732'); text(sname(s), x + 26, yy, own ? '#e8e8ec' : '#57524a'); if (own) text('LV ' + (G.p.shards[r.need] || 1), x + pw - 12, yy, '#8e877b', 1, 'right'); }
    yy += r.h; }
  text(L('b_tap'), x + pw / 2, y + ph - 11, '#4c463f', 1, 'center');
  ctx.globalAlpha = 1;
}

// =====================================================================
// run details (end screen / leaderboard): every weapon, shard, synergy and curse of a run, with full descriptions
// =====================================================================
const RSC = mkScroll(); // the small scrolling strip inside the result panel
const RUNDET = { R: null, t: 0, out: -1, S: mkScroll(), blocks: null, key: '', ch: 0, backHov: false };
function openRunDet(R) { if (!R) return; RUNDET.R = R; RUNDET.t = 0; RUNDET.out = -1; RUNDET.blocks = null; scrollReset(RUNDET.S); AU.play('menuOk'); }
function rdLay() { return { list: { x: 26, y: 32, w: W - 58, h: H - 32 - 34 }, back: { x: W / 2 - 46, y: H - 25, w: 92, h: 16 } }; }
function updateRunDet(rdt) { const D = RUNDET; D.t += rdt; if (D.out >= 0) { D.out += rdt; if (D.out > .16) D.R = null; return; }
  const Ly = rdLay(); D.backHov = inR(Ly.back, Input.mx, Input.my) && (!TOUCH.on || Input.down);
  if (pressed('Escape') || pressed('Backspace') || (Input.clicked && inR(Ly.back, Input.mx, Input.my) && D.t > .15)) { Input.clicked = false; D.out = 0; AU.play('menu', .8); return; }
  if (pressed('KeyW') || pressed('ArrowUp')) D.S.target -= 30; if (pressed('KeyS') || pressed('ArrowDown')) D.S.target += 30;
  scrollUpd(D.S, Ly.list, D.ch, 30); }
function rdBlocks(R, w) {
  const key = SET.lang + '|' + w; if (RUNDET.blocks && RUNDET.key === key) return RUNDET.blocks;
  const out = [], cw = Math.floor((w - 8) / 2), lh = lineH();
  const hdr = (label, n, c) => out.push({ h: 17, draw: (x, y) => { const s = label + (n !== undefined ? '  ' + n : ''); rect(x, y + 4, 3, 7, c); text(s, x + 7, y + 4 - cjY(s), '#c9c1b2'); pxLine(x + 12 + textW(s), y + 7, x + w, y + 7, '#27231f'); } });
  const pairs = items => { for (let i = 0; i < items.length; i += 2) { const a = items[i], b = items[i + 1], h = Math.max(a.h, b ? b.h : 0); out.push({ h: h + 4, draw: (x, y) => { a.draw(x, y, cw, h); if (b) b.draw(x + cw + 8, y, cw, h); } }); } };
  const none = () => out.push({ h: 14, draw: (x, y) => text(L('none'), x + 7, y + 2, '#3f3f46') });
  const card = (c, head, desc, extraH, extra) => { const ls = wrapW(desc, cw - 12); return { h: 17 + ls.length * lh + 3 + (extraH || 0), draw: (x, y, w2, h) => { rect(x, y, w2, h, '#0d0c0b'); rect(x, y, 2, h, c); head(x, y, w2); ls.forEach((l, j) => text(l, x + 6, y + 16 + j * lh, '#aaa293')); if (extra) extra(x, y + 16 + ls.length * lh + 2, w2); } }; };
  // weapons + chip
  const ws = (R.weapons || []).filter(id => WEAPONS[id]), sk = R.skill && SKILLS[R.skill];
  hdr(L('b_weapons'), undefined, C.cyan);
  pairs(ws.map(id => { const w = WEAPONS[id], ac = usesAmmo(w) ? wAccent(w) : '#8e877b', lv = (R.wlv && R.wlv[id]) || 0;
    return card(ac, (x, y, w2) => { text(fitText(wname(id), w2 - 70), x + 6, y + 4 - cjY(wname(id)), '#e8e1d3'); text(fitText(L('k_' + (w.lab || w.kind)), 50), x + w2 - 26, y + 4 - cjY(L('k_' + (w.lab || w.kind))), ac, 1, 'right'); for (let j = 0; j < 3; j++) diamondPip(x + w2 - 8 - j * 6, y + 7, j < lv, C.orange); }, tr(w.d)); }).concat(sk ? [card(sk.c(), (x, y, w2) => { icon(sk.icon, x + 5, y + 4, sk.c()); text(sk.nm, x + 16, y + 4, sk.c()); text(L('skillChip'), x + w2 - 6, y + 4 - cjY(L('skillChip')), '#57524a', 1, 'right'); }, tr(sk.d))] : []));
  // shards
  const ids = Object.keys(R.shards || {}).filter(id => SHARD[id]);
  hdr(L('st_shards'), ids.reduce((a, id) => a + R.shards[id], 0), C.gold);
  pairs(ids.map(id => { const s = SHARD[id], lv = Math.min(s.max, R.shards[id]), c = shardColor(s);
    return card(c, (x, y, w2) => { icon(s.icon, x + 5, y + 4, c); text(fitText(sname(s), w2 - 24 - s.max * 5), x + 16, y + 4 - cjY(sname(s)), c); for (let l = 0; l < s.max; l++) rect(x + w2 - 6 - (s.max - l) * 5, y + 6, 3, 3, l < lv ? c : '#2d2925'); }, tr(s.d(lv))); }));
  if (!ids.length) none();
  // synergies
  const syn = (R.synIds || []).map(id => SYNERGIES.find(q => q.id === id)).filter(Boolean);
  hdr(L('synergies'), syn.length, C.violet);
  pairs(syn.map(q => card(q.c, (x, y) => text(tr(q.n), x + 6, y + 4 - cjY(tr(q.n)), q.c), tr(q.d), 11, (x, y) => q.need.forEach((n, j) => { const s = SHARD[n]; if (s) icon(s.icon, x + 6 + j * 11, y, shardColor(s)); }))));
  if (!syn.length) none();
  // curses
  const cs = (R.curses || []).filter(c => CURSE[c]);
  if (cs.length) { hdr(L('b_curses'), cs.length, CURSE_C); pairs(cs.map(id => { const c = CURSE[id]; return card(CURSE_C, (x, y) => { icon(c.icon, x + 5, y + 4, CURSE_C); text(tr(c.n), x + 16, y + 4 - cjY(tr(c.n)), '#e8b8bc'); }, tr(c.d)); })); }
  RUNDET.key = key; RUNDET.blocks = out; return out;
}
function drawRunDet() {
  const D = RUNDET, R = D.R; if (!R) return; const k = D.out >= 0 ? 1 - clamp(D.out / .16, 0, 1) : easeOut(clamp(D.t / .22, 0, 1)), Ly = rdLay(), li = Ly.list;
  ctx.globalAlpha = .94 * k; rect(0, 0, W, H, '#0a0908'); ctx.globalAlpha = k;
  ctx.save(); ctx.translate(0, Math.round((1 - k) * 14));
  frame2(14, 8, W - 28, H - 16, C.cyan); textS(L('en_detail'), 26, 15, '#e8e1d3', 1);
  { const d = DIFF_BY[R.diff] || DIFF_BY.classic, s = (R.win !== false ? L('en_cleared') : chapShort(R.floor)) + '   ' + fmtTime(R.runT) + '   ' + fmtNum(R.score || 0); text(s, W - 26, 15 - cjY(s), '#8e877b', 1, 'right'); drawDiffIcon(d.id, W - 40 - textW(s), 13, 1, D.t); }
  pxLine(26, 26, W - 26, 26, '#27231f');
  const bl = rdBlocks(R, li.w); D.ch = bl.reduce((a, b) => a + b.h, 0);
  scrollClip(li); let y = li.y - D.S.pos; bl.forEach((b, i) => { const yy = Math.round(y); y += b.h; if (yy + b.h < li.y || yy > li.y + li.h) return; const ik = easeOut(clamp((D.t - .05 - i * .03) / .2, 0, 1)); ctx.globalAlpha = k * ik; b.draw(li.x + Math.round((1 - ik) * 10), yy); });
  ctx.restore(); ctx.globalAlpha = k; scrollBar(D.S, li);
  ctx.restore();
  drawBtn(Ly.back.x, Ly.back.y, Ly.back.w, Ly.back.h, L('back'), D.backHov, '#e8e1d3'); ctx.globalAlpha = 1;
}

// =====================================================================
// effect timers: every timed effect on you gets a chip with its icon, the seconds left and a draining bar
// =====================================================================
const STM = {};
function fxMax(k, t) { if (!(t > 0)) { STM[k] = 0; return 1; } if (t > (STM[k] || 0)) STM[k] = t; return STM[k]; }
function statusList() {
  const p = G.p, out = []; if (!p || !p.alive) return out; const sk = p.skill && SKILLS[p.skill];
  if (p.skillOn && sk) out.push({ ic: sk.icon, c: sk.c(), t: Math.max(0, p.skillT), max: sk.dur });
  if (G.fury > 0 && G.furyT > 0) out.push({ ic: 'fire2', c: C.orange, t: G.furyT, max: fxMax('fury', G.furyT), n: G.fury });
  if (p.veilT > 0) out.push({ ic: 'veil', c: C.violet, t: p.veilT, max: fxMax('veil', p.veilT) });
  if (p.slowT > 0) out.push({ ic: 'clock', c: C.cyan, t: p.slowT, max: fxMax('slow', p.slowT) });
  if (hasCurse('seal') && p.lastHit < 3) out.push({ ic: 'c_seal', c: CURSE_C, t: 3 - p.lastHit, max: 3 });
  if (hasCurse('surr') && p.lastHit < 2) out.push({ ic: 'c_surr', c: CURSE_C, t: 2 - p.lastHit, max: 2 });
  if (hasCurse('wrath') && (p.holdT || 0) > 1) out.push({ ic: 'c_wrath', c: CURSE_C, t: -1 });
  if (hasCurse('time')) { const r = roomAt(p.x, p.y); if (r && r.active && r.actT !== undefined) { const left = 20 - (G.time - r.actT); out.push(left > 0 ? { ic: 'c_time', c: '#c8a0a4', t: left, max: 20 } : { ic: 'c_time', c: CURSE_C, t: -1 }); } }
  return out;
}
function drawStatusFx(x, y) {
  let cx = x; for (const s of statusList()) {
    const lab = s.t < 0 ? '' : (s.n ? 'X' + s.n + ' ' : '') + (s.t >= 10 ? String(Math.ceil(s.t)) : s.t.toFixed(1)), w = 11 + (lab ? textW(lab) + 4 : 0), low = s.t >= 0 && s.t < 1;
    rect(cx - 1, y - 1, w + 2, 14, col(0)); box(cx, y, 11, 11, '#0d0c0b', s.c); if (ICONS[s.ic]) icon(s.ic, cx + 1.5, y + 1.5, s.t < 0 && ((G.time * 3) | 0) % 2 ? col(5) : s.c);
    if (lab) text(lab, cx + 14, y + 3, low && ((G.time * 8) | 0) % 2 ? s.c : '#e8e8ec');
    if (s.t >= 0 && s.max) { const f = clamp(s.t / s.max, 0, 1); rect(cx, y + 12, w, 1, '#27231f'); rect(cx, y + 12, Math.max(1, Math.round(w * f)), 1, s.c); }
    cx += w + 4; }
}
const statusH = () => statusList().length ? 15 : 0;
const _drawHUDP = drawHUD; drawHUD = function () { _drawHUDP(); if (!TOUCH.on) drawStatusFx(8, (G.curse || (G.curses && G.curses.length)) ? 48 : 37); };
// on phones the chips sit under the weapon dial (and move with it in the button layout)
const _drawWP0 = drawWeaponPanel0; drawWeaponPanel0 = function (p) { _drawWP0(p); if (TOUCH.on) drawStatusFx(10, 91); };

// ---- the skill chip while it is sealed (curse of the seal): dimmed, locked, and counting down ----
function skillSealed() { const p = G.p; return p && p.skill && hasCurse('seal') && p.lastHit < 3 ? 3 - p.lastHit : 0; }
const _drawSkillHUDP = drawSkillHUD; drawSkillHUD = function () { _drawSkillHUDP(); const s = skillSealed(); if (!s) return;
  const hx = W - 26, hy = H - 24, R = 15, pts = []; for (let i = 0; i < 6; i++) { const a = i * 1.0472 + Math.PI / 6; pts.push([hx + Math.cos(a) * (R + 1), hy + Math.sin(a) * (R + 1)]); }
  ctx.globalAlpha = .78; poly(pts, '#0a0405'); ctx.globalAlpha = 1; poly(pts, null, CURSE_C); icon('lock', hx - 8, hy - 8, CURSE_C, 2);
  const k = s / 3; for (let i = 0; i < 18; i++) { if (i / 18 >= k) break; const a = -Math.PI / 2 + i / 18 * 6.283; rect(hx + Math.cos(a) * (R + 4) - .5, hy + Math.sin(a) * (R + 4) - .5, 2, 2, CURSE_C); }
  hudPlate(W - 128, H - 26, 84, 11, CURSE_C, null, '#0a0405'); text(L('sk_sealed') + ' ' + s.toFixed(1) + 'S', W - 118, H - 23 - cjY(L('sk_sealed')), CURSE_C, 1); };
