// ===== TheSeed: the sample sieve. Bought at the black market (1 ember: one EXCLUDE and one SKIP, stacking), spent on the serum
// choices of a 突入探索 run: EXCLUDE shatters one syringe (that serum never shows up again this run, a new one drops into its slot),
// SKIP waves the whole choice away (the three syringes shrink back and fade). The counts live with the market (gp.market.sv).
'use strict';
Object.assign(STR, {
  sv_ban: ['EXCLUDE', '排除', '除外', '排除'], sv_skip: ['SKIP', '跳過', 'スキップ', '跳过'],
  sv_banPick: ['CHOOSE THE SERUM TO EXCLUDE FROM THIS RUN', '選擇要排除的血清（本局不再出現）', 'この出撃から除外する血清を選ぶ', '选择要排除的血清（本局不再出现）'],
  sv_banHint: ['ESC / RIGHT CLICK TO CANCEL', 'ESC / 右鍵取消', 'ESC / 右クリックで取消', 'ESC / 右键取消'],
  sv_none: ['NONE LEFT: BUY THE SAMPLE SIEVE AT THE BLACK MARKET', '次數不足：可在黑市購買「樣本篩濾」', '回数がない：闇市で「サンプル濾過」を購入', '次数不足：可在黑市购买「样本筛滤」'],
  sv_banned: ['{0} EXCLUDED FOR THIS RUN', '{0} 已排除，本局不再出現', '{0}を除外した（この出撃中は出ない）', '{0} 已排除，本局不再出现'],
  sv_skipped: ['SERUM CHOICE SKIPPED', '已跳過本次血清選擇', '血清の選択をスキップした', '已跳过本次血清选择'],
  sv_have: ['EXCLUDE ×{0} · SKIP ×{1}', '排除 ×{0} · 跳過 ×{1}', '除外×{0}・スキップ×{1}', '排除 ×{0} · 跳过 ×{1}'],
  sv_ok: ['+1 EXCLUDE, +1 SKIP', '排除 +1，跳過 +1', '除外+1・スキップ+1', '排除 +1，跳过 +1'],
});
// ---------------- the black market: first in the supplies ----------------
MARKET.unshift({ id: 'sieve', price: 1, c: () => TH.cyan, n: N4('SAMPLE SIEVE', '樣本篩濾', 'サンプル濾過', '样本筛滤'),
  d: N4('ONE EXCLUDE AND ONE SKIP FOR THE SERUM CHOICES IN BREACH RUNS. BUY AS OFTEN AS YOU LIKE; THEY ADD UP.', '購買突入探索局內血清三選一的「排除」與「跳過」各一次。可重複購買，次數累加。',
    '突入探索の血清三択で使う「除外」と「スキップ」を各1回分。何度でも買えて、回数は累積する。', '购买突入探索局内血清三选一的「排除」与「跳过」各一次。可重复购买，次数累加。') });
const svData = () => { const m = mkt(); if (!m.sv || typeof m.sv !== 'object') m.sv = { ban: 0, skip: 0 }; m.sv.ban = Math.max(0, m.sv.ban | 0); m.sv.skip = Math.max(0, m.sv.skip | 0); return m.sv; };
const _mktBuySv = mktBuy; mktBuy = function (it) { if (it.id !== 'sieve') return _mktBuySv(it); if (!buyProofs(it.price)) return; const d = svData(); d.ban++; d.skip++; gpSave(); AU.play('shop'); mktFlash('sv_ok', TH.cyan); };
const _mktCardSv = mktCard; mktCard = function (it, x, y, h, gp, m, t) { _mktCardSv(it, x, y, h, gp, m, t); if (it.id !== 'sieve') return; const d = svData(), s = fitText(L('sv_have', d.ban, d.skip), MKT_CW - 8);
  text(s, x + MKT_CW / 2, y + h - 36, d.ban || d.skip ? TH.cyan : '#6e675c', 1, 'center'); };
const _mktIconSv = mktIcon; mktIcon = function (id) { if (id !== 'sieve' || MKT_ICON[id]) return _mktIconSv(id); const p = new CPix(20, 20);
  // a funnel with a mesh, a drop falling through into a vial
  p.poly([[2, 2], [17, 2], [12, 9], [7, 9]], '#5a6a72'); p.poly([[3, 3], [16, 3], [12, 8], [7, 8]], '#9ab8c4'); for (let x = 4; x < 16; x += 2) p.set(x, 4, '#e8f4f8'); for (let x = 5; x < 15; x += 2) p.set(x, 6, '#e8f4f8');
  p.rect(9, 9, 2, 3, '#5a6a72'); p.rect(9, 12, 2, 2, '#5ed0c8'); p.rect(6, 14, 8, 5, '#2a3a40'); p.rect(7, 15, 6, 3, '#5ed0c8'); p.rect(7, 15, 6, 1, '#b8f4ee'); p.rect(6, 14, 8, 1, '#8aa8b4');
  p.outline('#050506'); return MKT_ICON[id] = p.canvas(true); };
// ---------------- in the run: banned serums never roll ----------------
const _rollCardsSv = rollCards; rollCards = function (...a) { const ban = (G && G.svBan) || [], sh = G && G.p && G.p.shards; if (!ban.length || !sh) return _rollCardsSv(...a);
  const keep = {}; for (const id of ban) if (SHARD[id]) { keep[id] = sh[id]; sh[id] = SHARD[id].max || 1; }
  try { return _rollCardsSv(...a); } finally { for (const id in keep) { if (keep[id] === undefined) delete sh[id]; else sh[id] = keep[id]; } } };
const _newRunSv = newRun; newRun = function (...a) { const r = _newRunSv(...a); if (G) G.svBan = []; return r; };
const _saveRunSv = saveRun; saveRun = function () { _saveRunSv(); if (RESUMING || !G.p || G.mode === 'invade' || (window.BOSS_TEST && BOSS_TEST.on)) return;
  try { const s = JSON.parse(STORE.getItem(SAVE_KEY) || 'null'); if (!s) return; s.svBan = (G.svBan || []).slice(); STORE.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { } };
const _resumeRunSv = resumeRun; resumeRun = function (...a) { const s = loadSave(), r = _resumeRunSv(...a); if (G && G.p && s && Array.isArray(s.svBan)) { G.svBan = [...new Set(s.svBan.filter(id => Object.hasOwn(SHARD, id)))]; saveRun(); } return r; };
// ---------------- the choice: two buttons to the right of the reroll ----------------
function svBtns() { const x = RRB.x + RRB.w + 8, w = 70; return [{ k: 'ban', x, y: RRB.y, w, h: RRB.h }, { k: 'skip', x: x + w + 6, y: RRB.y, w, h: RRB.h }]; }
const svBusy = cd => cd.pick >= 0 || cd.skipT !== undefined || (cd.ban && !cd.ban.done);
function svDeny(cd, k) { cd.svDeny = { k, t: .35 }; AU.play('locked'); notify(L('sv_none'), C.red); }
function svStartBan(i) { const cd = G.cards, id = cd.opts[i], d = svData(); if (!id || d.ban <= 0) return; d.ban--; gpSave(); (G.svBan = G.svBan || []).push(id); saveRun();
  cd.banMode = false; const r = cardRect(i), cx = r.x + CARD.w / 2, bt = r.y + 28, c = shardColor(SHARD[id]), frags = [];
  for (let n = 0; n < 60; n++) { const x = cx + rand(-SYR.BW / 2 + 2, SYR.BW / 2 - 2), y = bt + rand(0, SYR.BH), glass = n % 5 < 3;
    frags.push({ x, y, vx: (x - cx) * rand(2.5, 5.5) + rand(-40, 40), vy: rand(-170, -30), g: rand(380, 520), s: glass ? rand(3, 8) : rand(2, 5), c: glass ? (n % 2 ? '#e6eef2' : '#a9bac4') : (n % 2 ? c : '#ffffff'), rot: rand(0, 6.28), vr: rand(-12, 12), glass }); }
  for (let n = 0; n < 10; n++) frags.push({ x: cx + rand(-12, 12), y: bt - 20 + rand(-6, 6), vx: rand(-60, 60), vy: rand(-90, -20), g: 480, s: rand(2, 4), c: '#8e877b', rot: rand(0, 6.28), vr: rand(-10, 10), glass: true });
  cd.ban = { i, id, t: 0, done: false, cx, cy: bt + SYR.BH / 2, c }; cd.frags = { list: frags, t: 0 };
  AU.play('freeze', 1.25, .9); AU.play('pop', .7, .8); AU.play('hit', .6, .5); notify(L('sv_banned', sname(SHARD[id])), C.red); }
// a new serum drops into the emptied slot (one not already on offer); with nothing left the slot closes
function svRefill(cd) { const b = cd.ban, have = new Set(cd.opts.filter((q, j) => j !== b.i)), nid = rollCards(cd.minRar, 8).concat(rollCards(0, 8)).find(q => !have.has(q) && q !== b.id);
  cd.born = cd.born || cd.opts.map((q, j) => j * .1);
  if (nid) { cd.opts[b.i] = nid; if (cd.lv) cd.lv[b.i] = (G.p.shards[nid] || 0) + 1; cd.born[b.i] = cd.t; AU.play('card', 1.1); }
  else { cd.opts.splice(b.i, 1); if (cd.lv) cd.lv.splice(b.i, 1); cd.born.splice(b.i, 1); cd.born = cd.born.map(() => -1); }
  b.done = true; if (!cd.opts.length) { G.cards = null; G.state = 'play'; } }
function svSkip(cd) { const d = svData(); if (d.skip <= 0) { svDeny(cd, 'skip'); return; } d.skip--; gpSave(); cd.banMode = false; cd.skipT = 0; AU.play('menu', .7); AU.play('door', 1.8, .3); notify(L('sv_skipped'), '#c9c1b2'); }
const _updateCardsSv = updateCards; updateCards = function (rdt) { const cd = G.cards; if (!cd) return _updateCardsSv(rdt);
  if (cd.frags) { cd.frags.t += rdt; for (const f of cd.frags.list) { f.vy += f.g * rdt; f.x += f.vx * rdt; f.y += f.vy * rdt; f.rot += f.vr * rdt; } if (cd.frags.t > 1.3) cd.frags = null; }
  if (cd.svDeny) { cd.svDeny.t -= rdt; if (cd.svDeny.t <= 0) cd.svDeny = null; }
  if (cd.skipT !== undefined) { cd.t += rdt; cd.skipT += rdt; if (cd.skipT > .55) { G.cards = null; G.state = 'play'; } Input.clicked = false; return; }
  if (cd.ban && !cd.ban.done) { cd.t += rdt; cd.ban.t += rdt; if (cd.ban.t > .42) svRefill(cd); Input.clicked = false; return; }
  if (cd.pick >= 0) return _updateCardsSv(rdt);
  const bs = svBtns(); cd.svHov = cd.t > .3 ? bs.findIndex(b => inR(b, Input.mx, Input.my)) : -1;
  if (cd.svHov !== cd.svHovL && cd.svHov >= 0) AU.play('ui', 1.3); cd.svHovL = cd.svHov;
  const banKey = cd.t > .45 && (pressed('KeyX') || (Input.clicked && cd.svHov === 0)), skipKey = cd.t > .45 && (pressed('KeyZ') || (Input.clicked && cd.svHov === 1));
  if (cd.banMode) { cd.t += rdt; cd.hover = -1; cd.opts.forEach((id, i) => { const r = cardRect(i); if (Input.mx > r.x && Input.mx < r.x + CARD.w && Input.my > r.y && Input.my < r.y + CARD.h) cd.hover = i; });
    if (cd.hover !== cd.lastHover && cd.hover >= 0) AU.play('ui', .8 + cd.hover * .1); cd.lastHover = cd.hover;
    let pick = Input.clicked && cd.hover >= 0 ? cd.hover : -1; ['Digit1', 'Digit2', 'Digit3'].forEach((k, i) => { if (pressed(k) && i < cd.opts.length) pick = i; });
    if (pick >= 0) { Input.clicked = false; svStartBan(pick); return; }
    if (banKey || pressed('Escape') || Input.rclicked) { cd.banMode = false; Input.clicked = false; AU.play('menu', .8); return; }
    if (skipKey) { Input.clicked = false; svSkip(cd); return; }
    Input.clicked = false; return; }
  if (banKey) { Input.clicked = false; if (svData().ban <= 0) svDeny(cd, 'ban'); else { cd.banMode = true; AU.play('menu', 1.2); } return; }
  if (skipKey) { Input.clicked = false; svSkip(cd); return; }
  return _updateCardsSv(rdt); };
const _drawCardsSv = drawCards; drawCards = function () { _drawCardsSv(); const cd = G.cards; if (!cd) return;
  // the shattered syringe: glass and serum flying apart, a ring where it was
  if (cd.frags) { const q = cd.frags.t, b = cd.ban; if (b && q < .1) { ctx.globalAlpha = 1 - q / .1; rect(b.cx - SYR.BW / 2, b.cy - SYR.BH / 2, SYR.BW, SYR.BH, '#ffffff'); ctx.globalAlpha = 1; }
    if (b && q < .35) { ctx.globalAlpha = 1 - q / .35; ringC(b.cx, b.cy, 20 + q * 160, b.c, 2); ringC(b.cx, b.cy, 10 + q * 90, '#ffffff', 1); ctx.globalAlpha = 1; }
    for (const f of cd.frags.list) { const a = clamp(1.3 - q, 0, 1); if (a <= 0) continue; ctx.globalAlpha = a; if (f.glass) { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot); ctx.fillStyle = f.c; ctx.fillRect(-f.s / 2, -f.s / 4, f.s, Math.max(1, f.s / 2)); ctx.restore(); } else disc(f.x, f.y, f.s / 2, f.c); }
    ctx.globalAlpha = 1; }
  if (cd.pick >= 0 || cd.skipT !== undefined) return;
  // choosing what to exclude: a red hint under the title, the hovered syringe marked with a cross
  if (cd.banMode) { const s = L('sv_banPick'), blink = ((G.time * 3) | 0) % 2; textS(s, W / 2, 26, blink ? C.red : '#ff8a80', 1, 'center'); if (!TOUCH.on) text(L('sv_banHint'), W / 2, 38, '#8e877b', 1, 'center');
    cd.opts.forEach((id, i) => { const r = cardRect(i), cx = r.x + CARD.w / 2, bt = r.y + 28, on = cd.hover === i; ctx.globalAlpha = on ? .9 : .35;
      box(cx - SYR.BW / 2 - 3, bt - 3, SYR.BW + 6, SYR.BH + 6, null, C.red); if (on) { for (let k = -14; k <= 14; k++) { rect(cx + k - 1, bt + SYR.BH / 2 + k - 1, 3, 3, C.red); rect(cx + k - 1, bt + SYR.BH / 2 - k - 1, 3, 3, C.red); } } ctx.globalAlpha = 1; }); }
  // the two buttons, each with how many are left
  const k = clamp((cd.t - .25) / .3, 0, 1); if (k <= 0) return; const d = svData();
  svBtns().forEach((b, i) => { const n = i ? d.skip : d.ban, can = n > 0, hov = cd.svHov === i && can && !TOUCH.on, act = i === 0 && cd.banMode, acc = i ? TH.cyan : C.red;
    const shk = cd.svDeny && cd.svDeny.k === b.k ? Math.round(Math.sin(cd.svDeny.t * 60) * 2) : 0, x = b.x + shk, y = b.y + (1 - easeOut(k)) * 10 - (hov ? 1 : 0); ctx.globalAlpha = k;
    rect(x, y, b.w, b.h, act ? thA(acc, .22) : hov ? thA(acc, .12) : 'rgba(13,12,11,.94)'); box(x, y, b.w, b.h, null, act || hov ? thA(acc, .85) : '#36322d'); rect(x, y, 18, 1, can ? acc : '#3c3732'); if (act || hov) rect(x, y, 2, b.h, acc);
    // a glyph: a cross for exclude, a double chevron for skip
    const gx = x + 9, gy = y + b.h / 2, gc = can ? (act || hov ? acc : '#e8e1d3') : '#57524a';
    if (i === 0) for (let q = -3; q <= 3; q++) { rect(gx + q, gy + q, 1, 1, gc); rect(gx + q, gy - q, 1, 1, gc); }
    else for (const o of [-3, 1]) for (let q = 0; q < 4; q++) { rect(gx + o + q, gy - 3 + q, 1, 1, gc); rect(gx + o + q, gy + 3 - q, 1, 1, gc); }
    const lb = L(i ? 'sv_skip' : 'sv_ban'); text(lb, x + 18, y + b.h / 2 - (isCJK(lb) ? 4 : 2), can ? '#e8e1d3' : '#57524a', 1);
    // the count, in a small dark well at the right end
    const ns = '×' + n, nw = Math.max(16, textW(ns) + 6), nx = x + b.w - nw - 3; rect(nx, y + 4, nw, b.h - 8, '#070606'); box(nx, y + 4, nw, b.h - 8, null, can ? thA(acc, .5) : '#2a2622');
    text(ns, nx + nw / 2, y + b.h / 2 - 2, can ? acc : '#57524a', 1, 'center');
    if (!TOUCH.on && hov) text(i ? '[Z]' : '[X]', x + b.w / 2, y - 9, '#6e675c', 1, 'center');
    ctx.globalAlpha = 1; }); };
