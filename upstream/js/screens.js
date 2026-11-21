// ===== ACHROMA screens: the animated run summary (end screen + leaderboard detail) and the leaderboard =====
'use strict';
// ---------------- run summary ----------------
const ROW0 = .9, ROWS = .2; // score rows reveal one after another, then the total counts up
function chapShort(f) { f = f | 0; return SET.lang === 'en' ? 'CH.' + (f + 1) : '第' + CN_NUM[f] + '章'; }
function scoreRows(R) {
  const p = R.parts || {}, win = R.win !== false;
  if (R.mode === 'invade') return [[L('iv_waveRow'), L('iv_wave', R.wave | 0), p.wave], win ? [L('en_clear'), '', p.clear] : [L('en_reach'), L('iv_wave', R.wave | 0), null], [L('st_time'), fmtTime(R.runT), null],
    [L('st_kills'), fmtNum(R.kills), p.kills], [L('en_hits'), String(R.hits | 0), win ? p.hits : null], [L('iv_lvRow'), 'LV ' + (R.lv | 0), p.lv]];
  if (R.endless) return [[L('en_clear'), '', p.clear], [L('en_depthRow'), L('endlessShort', R.depth | 0), p.depth], [L('st_time'), fmtTime(R.runT), null], [L('st_kills'), fmtNum(R.kills), p.kills],
    [L('st_syn'), String(R.syn), p.syn], [L('st_combo'), 'X' + (R.comboMax | 0), null]];
  return [win ? [L('en_clear'), '', p.clear] : [L('en_reach'), chapShort(R.floor), p.clear],
    [L('st_time'), fmtTime(R.runT), win ? p.time : null], [L('st_kills'), fmtNum(R.kills), p.kills],
    [L('en_hits'), String(R.hits), win ? p.hits : null], [L('st_syn'), String(R.syn), p.syn], [L('st_combo'), 'X' + (R.comboMax | 0), null]];
}
function totTimes(R) { const t0 = ROW0 + scoreRows(R).length * ROWS + .15; return [t0, t0 + 1]; }
function diamondPip(x, y, on, c) { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = on ? c : '#2d2925'; ctx.fillRect(-2, -2, 4, 4); ctx.restore(); }
// two panels: what you carried (weapons, chip, shards, synergies) and how the score was made
function drawResultPanels(R, t, py) {
  const win = R.win !== false, ph = 150, ox = Math.round(Math.max(0, (W - 480) / 2)), lx = 20 + ox, lw = 214, rx = 246 + ox, rw = 214;
  const kL = easeOut(clamp((t - .3) / .4, 0, 1)), kR = easeOut(clamp((t - .42) / .4, 0, 1));
  // ---- loadout ----
  if (kL > 0 && R.mode === 'invade') ivResultLoadout(R, lx, py, lw, ph, t, kL);
  else if (kL > 0) { ctx.save(); ctx.translate(Math.round(-(1 - kL) * 30), 0); ctx.globalAlpha = kL;
    frame2(lx, py, lw, ph, TH.cyan, L('en_load'));
    (R.weapons || []).filter(id => WEAPONS[id]).forEach((id, i) => { const w = WEAPONS[id], bx = lx + 8, by = py + 17 + i * 30, k = clamp((t - .55 - i * .12) / .25, 0, 1); if (k <= 0) return;
      ctx.globalAlpha = kL * k; const ac = usesAmmo(w) ? wAccent(w) : '#8e877b';
      rect(bx, by, 46, 26, '#0a0908'); box(bx, by, 46, 26, null, '#2d2925'); rect(bx, by, 2, 26, ac);
      const sp = sprite('w_' + id, w.spr), sc = sp.w * 2 <= 40 && sp.h * 2 <= 22 ? 2 : 1; ctx.drawImage(sp.n, Math.round(bx + 24 - sp.w * sc / 2), Math.round(by + 13 - sp.h * sc / 2), sp.w * sc, sp.h * sc);
      text(fitText(wname(id), lw - 92), bx + 54, by + 4, '#e8e1d3'); text(fitText(L('k_' + (w.lab || w.kind)), 90), bx + 54, by + 15, ac);
      const lv = (R.wlv && R.wlv[id]) || 0; for (let j = 0; j < 3; j++) diamondPip(lx + lw - 12 - j * 7, by + 8, j < lv, TH.orange);
      if (k < 1) { ctx.globalAlpha = kL * (1 - k); rect(bx, by, lw - 16, 26, '#ffffff'); } ctx.globalAlpha = kL; });
    // skill chip
    const sk = R.skill && SKILLS[R.skill], sy = py + 79; if (t > .75) { if (sk) { icon(sk.icon, lx + 10, sy, sk.c()); text(sk.nm, lx + 22, sy + 1, sk.c()); } else text(L('en_noSkill'), lx + 10, sy + 1, '#3f3f46');
      (R.curses || []).filter(c => CURSE[c]).forEach((c, i) => { const cx2 = lx + lw - 16 - i * 11; rect(cx2 - 1, sy - 1, 10, 10, '#0a0405'); icon(CURSE[c].icon, cx2, sy, CURSE_C); }); }
    // shards and synergies share one scrolling strip: drag / wheel it, tap it for the full details
    const ids = Object.keys(R.shards || {}).filter(id => SHARD[id]), gy = py + 94, reg = { x: lx + 8, y: gy + 8, w: lw - 20, h: py + ph - 5 - (gy + 8) }, per = Math.floor((reg.w - 2) / 12);
    text(L('st_shards') + '  ' + ids.reduce((a, id) => a + R.shards[id], 0), lx + 10, gy, '#57524a');
    const syn = (R.synIds || []).map(id => SYNERGIES.find(q => q.id === id)).filter(Boolean), sRows = Math.ceil(ids.length / per), lines = []; { let ln = [], lw2 = 0;
      for (const q of syn) { const w2 = textW(tr(q.n)) + 8; if (ln.length && lw2 + w2 > reg.w - 4) { lines.push(ln); ln = []; lw2 = 0; } ln.push(q); lw2 += w2; } if (ln.length) lines.push(ln); }
    const synY = sRows * 13 + (sRows ? 2 : 0), sp = RSC.pos; RSC.r = reg; RSC.ch = synY + Math.max(1, lines.length) * 11;
    scrollClip(reg);
    ids.forEach((id, i) => { const k = clamp((t - .8 - i * .025) / .12, 0, 1); if (k <= 0) return; const s2 = SHARD[id], x = reg.x + 1 + (i % per) * 12, y = Math.round(reg.y + 1 + Math.floor(i / per) * 13 - sp); if (y < reg.y - 13 || y > reg.y + reg.h) return;
      if (k < 1) { rect(x + 4 - k * 4, y + 4 - k * 4, k * 8, k * 8, '#ffffff'); return; }
      icon(s2.icon, x, y, shardColor(s2)); for (let l = 0; l < R.shards[id]; l++) rect(x + l * 2, y + 9, 1, 1, '#e8e1d3'); });
    if (t > 1) { const y0 = Math.round(reg.y + synY - sp); if (!syn.length) text(L('none'), reg.x + 2, y0 + 1, '#3f3f46'); lines.forEach((l, j) => { let sx = reg.x + 2; for (const q of l) { text(tr(q.n), sx, y0 + j * 11 + 1, q.c); sx += textW(tr(q.n)) + 8; } }); }
    ctx.restore(); RSC.max = Math.max(0, Math.ceil(RSC.ch - reg.h)); scrollBar(RSC, reg);
    ctx.restore(); ctx.globalAlpha = 1; }
  // ---- score ----
  if (kR > 0) { ctx.save(); ctx.translate(Math.round((1 - kR) * 30), 0); ctx.globalAlpha = kR;
    frame2(rx, py, rw, ph, win ? TH.gold : TH.red, L('en_score'));
    const rows = scoreRows(R);
    rows.forEach(([lab, val, pts], i) => { const t0 = ROW0 + i * ROWS, k = clamp((t - t0) / .2, 0, 1); if (k <= 0) return; const y = py + 18 + i * 12, kc = easeOut(clamp((t - t0) / .4, 0, 1));
      ctx.globalAlpha = kR * k; text(fitText(lab, 92), rx + 10 + Math.round((1 - k) * 6), y, '#8e877b'); text(val, rx + 138, y, '#e8e8ec', 1, 'right');
      if (pts === null || pts === undefined) text('-', rx + rw - 10, y, '#3c3732', 1, 'right'); else text('+' + fmtNum(pts * kc), rx + rw - 10, y, kc >= 1 ? TH.gold : '#c8a640', 1, 'right'); });
    ctx.globalAlpha = kR;
    const dy = py + 18 + rows.length * 12 + 1, dk = clamp((t - (ROW0 + rows.length * ROWS)) / .25, 0, 1);
    if (dk > 0) { const d = DIFF_BY[R.diff] || DIFF_BY.classic; rect(rx + 10, dy, (rw - 20) * easeOut(dk), 1, '#2d2925'); ctx.globalAlpha = kR * dk;
      text(L('en_diffMul'), rx + 10, dy + 5, '#8e877b'); drawDiffIcon(d.id, rx + 92, dy + 3, 1, t); text(fitText(tr(d.nm), 60), rx + 106, dy + 5, d.c());
      text('X' + (+(R.mul || 1).toFixed(3)), rx + rw - 10, dy + 5, d.c(), 1, 'right'); if (R.assist) text(L('aimShort'), rx + rw - 10, dy - 6, '#8e877b', 1, 'right'); }
    const [a0, a1] = totTimes(R), tk = clamp((t - a0) / (a1 - a0), 0, 1);
    if (tk > 0) { ctx.globalAlpha = kR; const ty = py + ph - 26, done = tk >= 1, cc = win ? TH.gold : '#e8e1d3';
      text(L('en_total'), rx + 10, ty + 5, '#8e877b');
      if (done) { const f = clamp(1 - (t - a1) / .5, 0, 1); if (f > 0) { ctx.globalAlpha = kR * f * .35; rect(rx + 4, ty - 4, rw - 8, 24, cc); ctx.globalAlpha = kR; } }
      textS(fmtNum(R.score * (1 - Math.pow(1 - tk, 3))), rx + rw - 10, ty, done ? cc : '#c9c1b2', 3, 'right'); }
    ctx.restore(); ctx.globalAlpha = 1; }
}
// ---------------- end screen ----------------
const END = { sel: 0, t0: 0, played: -1, lmx: 0, lmy: 0, tot: false };
const END_ACT = [{ k: 'en_again', f: () => newRun() }, { k: 'en_detail', f: () => openRunDet(G.result) }, { k: 'board', f: () => { toMenu(); openBoard(); } }, { k: 'en_menu', f: () => toMenu() }];
function endBtns() { const n = END_ACT.length, bw = 100, gap = 8, x0 = W / 2 - (n * bw + (n - 1) * gap) / 2; return END_ACT.map((a, i) => ({ x: Math.round(x0 + i * (bw + gap)), y: 242, w: bw, h: 18 })); }
function updateEnd(rdt) {
  const t = G.endT, R = G.result; if (!R) { if (t > 1 && (pressed('Escape'))) toMenu(); else if (t > 1 && (Input.clicked || pressed('KeyR'))) newRun(); return; }
  if (RUNDET.R) { updateRunDet(rdt); return; }
  const idx = Math.floor((t - ROW0) / ROWS), n = scoreRows(R).length;
  if (idx > END.played && idx >= 0 && idx < n) { END.played = idx; AU.play('ui', 1 + idx * .1); }
  if (idx >= n && END.played < n) { END.played = n; AU.play('menu', 1.3); }
  const [, a1] = totTimes(R); if (t >= a1 && !END.tot) { END.tot = true; AU.play(R.win ? 'select' : 'menuOk'); }
  if (t < .9) return;
  if (scrollUpd(RSC, RSC.r, RSC.ch, 13)) { openRunDet(R); return; }
  const bs = endBtns(); let hov = -1; bs.forEach((b, i) => { if (Input.mx >= b.x && Input.mx <= b.x + b.w && Input.my >= b.y && Input.my <= b.y + b.h) hov = i; });
  const mv = Math.abs(Input.mx - END.lmx) + Math.abs(Input.my - END.lmy) > .5; END.lmx = Input.mx; END.lmy = Input.my;
  if (mv && hov >= 0 && hov !== END.sel) { END.sel = hov; AU.play('menu'); }
  const nB = END_ACT.length; if (pressed('KeyA') || pressed('ArrowLeft')) { END.sel = (END.sel + nB - 1) % nB; AU.play('menu'); }
  if (pressed('KeyD') || pressed('ArrowRight')) { END.sel = (END.sel + 1) % nB; AU.play('menu'); }
  if (pressed('Escape')) { toMenu(); return; }
  if (pressed('KeyR')) { newRun(); return; }
  if ((Input.clicked && hov >= 0) || pressed('Enter') || pressed('Space')) { const i = Input.clicked && hov >= 0 ? hov : END.sel; Input.clicked = false; AU.play('menuOk'); END_ACT[i].f(); }
}
function finishRunReset() { END.sel = 0; END.played = -1; END.tot = false; scrollReset(RSC); RUNDET.R = null; }
function drawEnd(win, t) {
  const R = G.result; ctx.drawImage(ditherLayer(clamp(t * 1.4, 0, .88), '#0a0908'), 0, 0);
  if (!R) return;
  // title: letters drop in one by one; colour splits trail the victory title
  const big = R.mode === 'invade' ? (win ? L('iv_win') : L('iv_dead')) : R.endless ? L('en_endT') : win ? L('restored') : L('erased'), c = R.endless ? TH.ember : win ? TH.gold : TH.blood, sc = 4, tw = textW(big, sc), tx = Math.round(W / 2 - tw / 2), ty = 10, ch = [...big];
  ch.forEach((cc, i) => { const k = clamp((t - .1 - i * .035) / .22, 0, 1); if (k <= 0) return; const x = tx + textW(ch.slice(0, i).join(''), sc), y = ty - Math.round((1 - easeOut(k)) * 10);
    ctx.globalAlpha = k * (Math.sin(t * 13 + i * 3) > .985 ? .45 : 1); textS(cc, x, y, win && !R.endless ? TH.bone : c, sc); });
  ctx.globalAlpha = 1;
  const ul = clamp((t - .45) / .45, 0, 1); if (ul > 0) { const w2 = Math.round((tw + 24) * easeOut(ul)); rect(W / 2 - w2 / 2, ty + 26, w2, 1, TH.line2); rect(W / 2 - 14, ty + 26, 28, 1, c); }
  // difficulty badge + where the run ended
  if (t > .5) { const d = DIFF_BY[R.diff] || DIFF_BY.classic, sub = (R.mode === 'invade' ? L('iv_reached', R.wave | 0) : R.endless ? L('en_depth', R.depth | 0) : win ? L('en_cleared') : L('en_fell') + ' ' + chapterTitle(R.floor | 0, 0)) + '   ' + tr(d.nm), sw = 22 + textW(sub), sx = Math.round(W / 2 - sw / 2);
    ctx.globalAlpha = clamp((t - .5) / .3, 0, 1); drawDiffBadge(d.id, sx, 39, t); text(sub, sx + 22, 44 - (isCJK(sub) ? 2 : 0), TH.bone2); ctx.globalAlpha = 1; }
  drawResultPanels(R, t, 62);
  // rewards: proofs and affection, then this run's materials for the limited-time event, on one line
  if (t > 1.2) { const pr = (win || R.endless) && G.proofGain ? L('en_proof', G.proofGain) + (G.affGain || []).map(([id, n]) => '   ' + L('n_aff', svName(id), n)).join('') : '';
    const e = R.ev, evS = e ? L({ up: 'ev_addUp', ok: 'ev_addOk', later: 'ev_addLater', ended: 'ev_addEnded', login: 'ev_addLogin', err: 'ev_addErr' }[e.st] || 'ev_addUp', e.amt) : '', gap = pr && evS ? 14 : 0;
    const w2 = (pr ? textW(pr) + 12 : 0) + gap + (evS ? textW(evS) : 0), x = Math.round(W / 2 - w2 / 2); ctx.globalAlpha = clamp((t - 1.2) / .3, 0, 1);
    if (pr) { drawProof(x, 228); text(pr, x + 12, 229 - (isCJK(pr) ? 1 : 0), TH.gold); }
    if (evS) text(evS, x + (pr ? textW(pr) + 12 : 0) + gap, 229 - (isCJK(evS) ? 1 : 0), e.st === 'ok' ? TH.cyan : '#8e877b');
    ctx.globalAlpha = 1; }
  // upload status
  if (t > 1) { const u = R.up || {}, a = clamp((t - 1) / .3, 0, 1), y = 216; ctx.globalAlpha = a; let s = '', sc2 = '#8e877b';
    if (u.st === 'up') s = L('up_up').replace(/\.+$|…$/, '') + '...'.slice(0, 1 + ((t * 3) | 0) % 3);
    else if (u.st === 'ok') { s = L('up_ok', u.rank) + (u.newBest ? '   ' + L('up_best') : ''); sc2 = TH.gold; }
    else if (u.st === 'login') { s = L('up_loginDz'); sc2 = '#c9c1b2'; } else if (u.st === 'off' || u.st === 'err') s = L('up_off'); else if (u.st === 'none') s = L('up_none'); else if (u.st === 'test') s = L('up_test');
    if (s) text(s, W / 2, y, sc2, 1, 'center');
    ctx.globalAlpha = 1; }
  // buttons
  if (t > .9) { const k = easeOut(clamp((t - .9) / .35, 0, 1)); endBtns().forEach((b, i) => { const on = END.sel === i, y = b.y + Math.round((1 - k) * 12); ctx.globalAlpha = k; drawBtn(b.x, y, b.w, b.h, L(END_ACT[i].k), on && !TOUCH.on, i === 0 ? TH.ember : TH.bone); }); ctx.globalAlpha = 1; }
  drawRunDet();
}
// angled-corner button shared by the end screen and the leaderboard
function drawBtn(x, y, w, h, label, on, acc) {
  const A = acc && acc[0] === '#' && acc.length >= 7 ? acc : TH.bone;
  rect(x, y, w, h, on ? thA(A, .12) : 'rgba(8,8,8,.7)'); box(x, y, w, h, null, on ? thA(A, .85) : '#34302b'); if (on) { rect(x, y, 2, h, A); rect(x + 2, y + h - 1, w - 2, 1, thA(A, .35)); }
  text(fitText(label, w - 14), x + w / 2 + (on ? 1 : 0), y + h / 2 - (isCJK(label) ? 4 : 2), on ? '#f2ebde' : '#a9a294', 1, 'center');
}

// ---------------- leaderboard ----------------
// tabs: 0 the normal top 100, 1 the endless top 100, 2 your own recent runs
const bTop = () => true, bData = () => NET[['board', 'eboard', 'iboard', 'ieboard'][BOARD.tab] || 'board'], bMode = () => ['', 'e', 'i', 'ie'][BOARD.tab] || '';
const BOARD = { tab: 0, scroll: 0, target: 0, sel: -1, detail: null, detT: 0, hits: [], drag: null, lmx: 0, lmy: 0 };
const BL = { x: 34, y: 58, w: W - 72, rh: 14, rows: 11 };
RELAYOUT.push(() => { BL.w = W - 72; });
// the list fits whatever box the page is given (a docked window is narrower and shorter than the screen)
function blFit() { BL.w = W - 72; BL.y = 40; BL.rows = Math.max(4, Math.floor((H - 107) / BL.rh)); }
function openBoard() { BOARD.tab = 0; BOARD.scroll = BOARD.target = 0; BOARD.detail = null; BOARD.sel = -1; BOARD.drag = null; loadBoard(true); if (NET.user) loadMine(true); goPage('board'); }
function boardRows() { if (bTop()) return (bData() && bData().top) || []; return Array.isArray(NET.mine) ? NET.mine : []; }
function openDetail(row) { if (!row) return; AU.play('menuOk'); BOARD.detT = 0; scrollReset(RSC); RSC.r = null; RUNDET.R = null; BOARD.detail = bTop() ? { id: row.id, rank: row.rank } : { run: row }; }
const inR = (r, x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
function setTab(i) { if (BOARD.tab === i) return; BOARD.tab = i; BOARD.scroll = BOARD.target = 0; BOARD.sel = -1; AU.play('menu'); loadBoard(false, ['', 'e', 'i', 'ie'][i] || ''); }
function updateBoard(rdt) {
  blFit();
  const mx = Input.mx, my = Input.my, back = { x: W / 2 - 46, y: H - 34, w: 92, h: 16 };
  BOARD.backHov = inR(back, mx, my) && (!TOUCH.on || Input.down);
  if (BOARD.detail) { BOARD.detT += rdt; if (RUNDET.R) { updateRunDet(rdt); return; }
    const bk = { x: W / 2 - 96, y: H - 34, w: 92, h: 16 }, db = { x: W / 2 + 4, y: H - 34, w: 92, h: 16 }, d = BOARD.detail, R = d.run || loadRun(d.id), ok = R && !R.busy && !R.err, full = () => Object.assign({ win: true }, R);
    BOARD.backHov = inR(bk, mx, my) && (!TOUCH.on || Input.down); BOARD.detHov = ok && inR(db, mx, my) && (!TOUCH.on || Input.down);
    if (pressed('Escape') || pressed('Backspace') || (Input.clicked && BOARD.detT > .2 && inR(bk, mx, my))) { BOARD.detail = null; AU.play('menu', .8); return; }
    if (ok && ((Input.clicked && BOARD.detT > .2 && inR(db, mx, my)) || pressed('Enter'))) { Input.clicked = false; openRunDet(full()); return; }
    if (ok && scrollUpd(RSC, RSC.r, RSC.ch, 13)) openRunDet(full()); return; }
  if (pressed('Escape')) { backPage(); return; }
  if (Input.clicked && BOARD.backHov) { backPage(); return; }
  if (Input.clicked) for (const h of BOARD.hits) if (inR(h, mx, my)) { Input.clicked = false; h.f(); return; }
  if (pressed('KeyA') || pressed('ArrowLeft') || pressed('KeyQ')) setTab(Math.max(0, BOARD.tab - 1));
  if (pressed('KeyD') || pressed('ArrowRight') || pressed('KeyE')) setTab(Math.min(3, BOARD.tab + 1));
  const rows = boardRows(), vis = BL.rows, maxS = Math.max(0, rows.length - vis), ly0 = BL.y + 12;
  if (Input.wheel) BOARD.target = clamp(BOARD.target + Math.sign(Input.wheel) * 3, 0, maxS);
  if (pressed('KeyW') || pressed('ArrowUp')) { BOARD.sel = Math.max(0, BOARD.sel - 1); AU.play('menu'); }
  if (pressed('KeyS') || pressed('ArrowDown')) { BOARD.sel = Math.min(rows.length - 1, BOARD.sel + 1); AU.play('menu'); }
  if ((pressed('KeyW') || pressed('ArrowUp') || pressed('KeyS') || pressed('ArrowDown')) && BOARD.sel >= 0) { if (BOARD.sel < BOARD.target) BOARD.target = BOARD.sel; if (BOARD.sel >= BOARD.target + vis) BOARD.target = BOARD.sel - vis + 1; }
  const inList = mx >= BL.x && mx <= BL.x + BL.w && my >= ly0 && my < ly0 + vis * BL.rh, hi = inList ? Math.floor((my - ly0) / BL.rh + BOARD.scroll) : -1;
  const mv = Math.abs(mx - BOARD.lmx) + Math.abs(my - BOARD.lmy) > .5; BOARD.lmx = mx; BOARD.lmy = my;
  if (mv && hi >= 0 && hi < rows.length && !BOARD.drag) BOARD.sel = hi;
  // press, drag to scroll (mouse or finger), release without moving to open
  if (Input.clicked && inList) BOARD.drag = { y: my, s: BOARD.target, moved: false, row: hi };
  if (BOARD.drag) { const d = BOARD.drag; if (Math.abs(my - d.y) > 4) d.moved = true; if (d.moved) BOARD.target = clamp(d.s - (my - d.y) / BL.rh, 0, maxS);
    if (!Input.down) { if (!d.moved && d.row >= 0 && d.row < rows.length) openDetail(rows[d.row]); BOARD.drag = null; } }
  if (pressed('Enter') && BOARD.sel >= 0) openDetail(rows[BOARD.sel]);
  BOARD.scroll = lerp(BOARD.scroll, BOARD.target, .3); if (Math.abs(BOARD.scroll - BOARD.target) < .01) BOARD.scroll = BOARD.target;
}
const MEDAL = () => [C.gold, '#e8e8ec', C.orange];
// shown while something from the server is still loading (the platform runs only a few server calls at once for the whole game)
function slowNote(y, x = W / 2, w = W - 80, al = 'center') { if (!ONDZ()) return; wrapW(L('net_slow'), w).forEach((l, i) => text(l, x, y + i * lineH(), '#6e675c', 1, al)); }
function drawBoard(t) {
  if (BOARD.detail) { drawBoardDetail(t); return; }
  panel(L(['bd_top', 'bd_endless', 'bd_invade', 'bd_invadeE'][BOARD.tab]), TH.gold, { stripes: false }); BOARD.hits = []; blFit();
  if (bTop() && bData() && bData().players) text(L('bd_players', bData().players), W - 52, 23, TH.faint, 1, 'right');
  const x0 = BL.x, y0 = BL.y, w = BL.w, rows = boardRows(), ly0 = y0 + 12, vis = BL.rows, cs = Math.min(1, w / 408), cx = v => x0 + Math.round(v * cs);
  const msg = (k, c) => text(L(k), W / 2, ly0 + 54, c || '#57524a', 1, 'center');
  const dots = '.'.repeat(1 + ((t * 3) | 0) % 3);
  if (bTop()) { const B = bData();
    if (!B) { text(L('bd_loading').replace(/\.+$|…$/, '') + dots, W / 2, ly0 + 54, '#57524a', 1, 'center'); slowNote(ly0 + 68); }
    else if (B.err) { msg(ONDZ() ? 'bd_err' : 'g_dz', ONDZ() ? TH.red : '#8e877b'); const r = { x: W / 2 - 40, y: ly0 + 70, w: 80, h: 16 }; drawBtn(r.x, r.y, r.w, r.h, L('bd_retry'), inR(r, Input.mx, Input.my), TH.gold); BOARD.hits.push(Object.assign(r, { f: () => { NET[['board', 'eboard', 'iboard'][BOARD.tab]] = null; loadBoard(true, bMode()); } })); }
    else if (!rows.length) msg('bd_empty');
  } else {
    if (NET.off) msg(ONDZ() ? 'bd_err' : 'g_dz', ONDZ() ? TH.red : '#8e877b');
    else if (!NET.user) msg('bd_guest', '#8e877b');
    else if (!Array.isArray(NET.mine)) { if (NET.mine && NET.mine.err) msg('bd_err', TH.red); else { loadMine(); text(L('bd_loading').replace(/\.+$|…$/, '') + dots, W / 2, ly0 + 54, '#57524a', 1, 'center'); slowNote(ly0 + 68); } }
    else if (!rows.length) msg('bd_mineEmpty');
  }
  if (rows.length) {
    // header
    const H0 = bTop() ? [[L('bd_rank'), x0 + 4, 'left'], [L('bd_player'), x0 + 42, 'left'], [L('bd_diff'), cx(222), 'left'], [L(BOARD.tab === 1 ? 'bd_depth' : BOARD.tab >= 2 ? 'bd_wave' : 'bd_time'), cx(330), 'right'], [L('bd_score'), x0 + w - 8, 'right']]
      : [[L('bd_date'), x0 + 8, 'left'], [L('bd_diff'), cx(130), 'left'], [L('bd_time'), cx(290), 'right'], [L('bd_score'), x0 + w - 8, 'right']];
    H0.forEach(([s, x, al]) => text(s, x, y0, '#57524a', 1, al)); rect(x0, y0 + 9, w, 1, '#27231f');
    ctx.save(); ctx.beginPath(); ctx.rect(x0 - 4, ly0, w + 8, vis * BL.rh); ctx.clip();
    const me = NET.user && NET.user.uid, first = Math.max(0, Math.floor(BOARD.scroll));
    for (let i = first; i < Math.min(rows.length, first + vis + 1); i++) { const r = rows[i], y = Math.round(ly0 + (i - BOARD.scroll) * BL.rh), on = i === BOARD.sel && !TOUCH.on;
      const mine = bTop() && (r.mine || (r.user && me && r.user.uid === me));
      if (on) rect(x0 - 2, y, w + 4, BL.rh - 1, '#17171c'); else if (mine) rect(x0 - 2, y, w + 4, BL.rh - 1, '#0e1719'); else if (i % 2) rect(x0 - 2, y, w + 4, BL.rh - 1, '#0d0c0b');
      if (mine) rect(x0 - 2, y, 2, BL.rh - 1, TH.cyan); else if (bTop() && r.rank <= 3) rect(x0 - 2, y, 2, BL.rh - 1, MEDAL()[r.rank - 1]); else if (on) rect(x0 - 2, y, 2, BL.rh - 1, '#8e877b');
      const d = DIFF_BY[r.diff] || DIFF_BY.classic, ty = y + 4;
      if (bTop()) {
        if (r.rank <= 3) { diamondPip(x0 + 8, y + 6, true, MEDAL()[r.rank - 1]); text(String(r.rank), x0 + 14, ty, MEDAL()[r.rank - 1]); } else text(String(r.rank), x0 + 6, ty, '#8e877b');
        drawAvatar(r.user, x0 + 42, y + 2, 9, mine ? TH.cyan : '#2d2925');
        const nm = fitText(r.user.name || r.user.username, Math.round(150 * cs)); text(nm, x0 + 56, ty - (isCJK(nm) ? 1 : 0), mine ? TH.cyan : '#e8e8ec');
        if (mine) text(L('bd_you'), x0 + 60 + textW(nm), ty - (isCJK(L('bd_you')) ? 1 : 0), '#4a8c94');
        drawDiffIcon(d.id, cx(222), y + 1, 1, t); text(fitText(tr(d.nm), cx(330) - cx(222) - 48), cx(222) + 14, ty - (isCJK(tr(d.nm)) ? 1 : 0), d.c());
        text(BOARD.tab === 1 ? L('endlessShort', r.depth | 0) : BOARD.tab >= 2 ? L('iv_wave', r.wave | 0) : fmtTime(r.runT), cx(330), ty - (BOARD.tab !== 0 && SET.lang !== 'en' ? 1 : 0), BOARD.tab === 1 ? TH.orange : BOARD.tab === 2 ? '#8ed872' : '#aaa293', 1, 'right');
        text(fmtNum(r.score), x0 + w - 8, ty, r.rank <= 3 ? MEDAL()[r.rank - 1] : '#e8e1d3', 1, 'right');
      } else {
        text(fmtDate(r.at), x0 + 8, ty, '#c9c1b2'); drawDiffIcon(d.id, cx(130), y + 1, 1, t); text(fitText(tr(d.nm), cx(290) - cx(130) - 50), cx(130) + 14, ty - (isCJK(tr(d.nm)) ? 1 : 0), d.c());
        text(r.endless ? L('endlessShort', r.depth | 0) : fmtTime(r.runT), cx(290), ty - (r.endless && isCJK(L('endlessShort', 1)) ? 1 : 0), r.endless ? TH.orange : '#aaa293', 1, 'right'); text(fmtNum(r.score), x0 + w - 8, ty, '#e8e1d3', 1, 'right');
      } }
    ctx.restore();
    // scrollbar
    if (rows.length > vis) { const th = vis * BL.rh, kh = Math.max(10, th * vis / rows.length), ky = ly0 + (th - kh) * (BOARD.scroll / (rows.length - vis)); rect(x0 + w + 6, ly0, 1, th, '#1f1f24'); rect(x0 + w + 5, ky, 3, kh, '#4c463f'); }
    // your own standing when it is not on the visible page
    const me2 = bTop() && bData() && bData().me; if (me2 && (me2.rank > 100 || me2.rank - 1 < Math.floor(BOARD.scroll) || me2.rank - 1 >= Math.floor(BOARD.scroll) + vis)) {
      const y = ly0 + vis * BL.rh + 3; rect(x0 - 2, y, w + 4, BL.rh - 1, '#0e1719'); rect(x0 - 2, y, 2, BL.rh - 1, TH.cyan);
      text(me2.over ? '100+' : String(me2.rank), x0 + 6, y + 4, TH.cyan); drawAvatar(me2.user, x0 + 42, y + 2, 9, TH.cyan); text(fitText(me2.user.name || me2.user.username, Math.round(150 * cs)), x0 + 56, y + 4 - (isCJK(me2.user.name || '') ? 1 : 0), TH.cyan);
      text(BOARD.tab === 1 ? L('endlessShort', me2.depth | 0) : BOARD.tab >= 2 ? L('iv_wave', me2.wave | 0) : fmtTime(me2.runT), cx(330), y + 4 - (BOARD.tab !== 0 && SET.lang !== 'en' ? 1 : 0), '#aaa293', 1, 'right'); text(fmtNum(me2.score), x0 + w - 8, y + 4, TH.cyan, 1, 'right');
      BOARD.hits.push({ x: x0, y, w, h: BL.rh, f: () => openDetail(me2) }); }
  }
  drawBtn(W / 2 - 46, H - 34, 92, 16, L('back'), BOARD.backHov, '#e8e1d3');
}
function drawBoardDetail(t) {
  const d = BOARD.detail, R = d.run || loadRun(d.id), k = clamp(BOARD.detT / .2, 0, 1);
  ctx.globalAlpha = k; rect(0, 0, W, H, '#0a0908'); ctx.globalAlpha = 1;
  if (!R || R.busy) { text(L('bd_loading'), W / 2, H / 2, '#57524a', 1, 'center'); slowNote(H / 2 + 14); }
  else if (R.err) text(L('bd_err'), W / 2, H / 2, TH.red, 1, 'center');
  else { const u = R.user || {}, hk = easeOut(clamp(BOARD.detT / .35, 0, 1));
    ctx.globalAlpha = hk; drawAvatar(u, 22, 14, 22, '#4c463f');
    const nm = fitText(u.name || u.username || '?', 260); textS(nm, 52, 14, '#e8e1d3', 2);
    text((d.rank ? L('bd_rank') + ' ' + d.rank + '   ' : '') + fmtDate(R.at), 52, 33 - (SET.lang !== 'en' && d.rank ? 1 : 0), '#8e877b');
    text(L('dt_run'), W - 22, 16, '#57524a', 1, 'right'); const dd = DIFF_BY[R.diff] || DIFF_BY.classic; drawDiffBadge(dd.id, W - 38, 26, t);
    ctx.globalAlpha = 1;
    drawResultPanels(Object.assign({ win: true }, R), BOARD.detT * 1.4 + .2, 56); drawBtn(W / 2 + 4, H - 34, 92, 16, L('en_detail'), BOARD.detHov, TH.cyan); }
  drawBtn(R && !R.busy && !R.err ? W / 2 - 96 : W / 2 - 46, H - 34, 92, 16, L('back'), BOARD.backHov, '#e8e1d3');
  drawRunDet();
}
