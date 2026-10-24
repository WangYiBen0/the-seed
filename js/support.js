// ===== the abandoned barracks: two soldiers, what is left of their camp, and one piece of hardware they can still send your way =====
// talk to a soldier, ask for support, carry it (one at a time), call it with Q (or the button on a phone):
//   gunship: a helicopter follows you for 30s and hoses the nearest foe; it reloads for 2s after every 100 rounds
//   artillery: three salvos; each marks three foes (marks may stack when there are fewer), the shells land 3s later; 4s between salvos
//   sentry: a red flare where you stand, a crate on a parachute 3s later; it opens into a turret that draws the foes onto itself,
//           takes 25 hits (a quarter second of grace after each) and fires until it breaks, with a small homing missile every 5th shot
'use strict';
const SUP_KINDS = ['heli', 'gun', 'sentry'];
const supName = k => L('sup_' + k);
// ---------------- the room ----------------
function barracksSetup(r, cx, cy) {
  const k = choice(SUP_KINDS); r.sup = k;
  // nothing is put down on a wall, a pillar or a pit: each thing looks for clear floor near its spot (decoration that finds none is left out)
  const clear = (x, y, rr) => !collides(x, y, rr, false) && tileAtPx(x, y) !== TL.PIT, place = (o, rr) => { for (let i = 0; i < 24; i++) { const a = i * 2.4, d = i * 3, x = o.x + Math.cos(a) * d, y = o.y + Math.sin(a) * d; if (clear(x, y, rr) && clear(x - rr, y, 2) && clear(x + rr, y, 2)) { o.x = Math.round(x); o.y = Math.round(y); return o; } } return o.kind === 'deco' ? null : o; };
  const push = (...os) => { for (const o of os) { const q = place(o, o.kind === 'asset' ? 22 : o.kind === 'deco' ? 10 : 6); if (q) G.inter.push(q); } };
  push({ kind: 'deco', d: 'sandbags', x: cx - 44, y: cy - 30 }, { kind: 'deco', d: 'sandbags', x: cx + 40, y: cy - 34 }, { kind: 'deco', d: 'tent', x: cx - 52, y: cy + 26 },
    { kind: 'deco', d: 'drum', x: cx + 6, y: cy + 22 }, { kind: 'deco', d: 'crates', x: cx + 50, y: cy + 24 }, { kind: 'deco', d: 'radio', x: cx - 18, y: cy + 30 },
    { kind: 'asset', sup: k, x: cx, y: cy - 34 }, { kind: 'soldier', id: 0, sup: k, room: r, x: cx - 22, y: cy + 6 }, { kind: 'soldier', id: 1, sup: k, room: r, x: cx + 26, y: cy + 4 });
}
// ---------------- the soldiers (no portraits: small figures in the room, a dialogue box at the bottom) ----------------
const SOLDIER_ART = [
  ['...hhh...', '..hHHHh..', '.hhhhhhh.', '..ssesS..', '...sSs...', '..uuuuu..', '.uuUuUuu.', '.uugggggg', '.suuUuug.', '..uuuuu..', '..uU.Uu..', '..uu.uu..', '..uu.uu..', '..bb.bb..'],
  ['...hhh...', '..hHHHh..', '.hhhhhhh.', '..ssesS..', '...sSs...', '..uuuuu..', '.uuwwwuu.', '.uwwsuuu.', '.uuuuuuu.', '..uuuuu..', '.uuu.uuu.', 'uuu...uuu', 'bb.....bb']];
const SOLDIER_PAL = { h: '#4a5038', H: '#626a4a', s: '#a88c74', S: '#7a6454', e: '#1a1614', u: '#46483a', U: '#32342a', g: '#26241f', b: '#1c1a16', w: '#d6cdbb' };
function drawMap(rows, pal, x, y, flip) {
  const h = rows.length, w = rows[0].length, X = i => flip ? x + (w - 1 - i) : x + i;
  ctx.fillStyle = col(0); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (rows[j][i] !== '.') for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + (flip ? -dx : dx), jj = j + dy; if (ii < 0 || jj < 0 || ii >= w || jj >= h || rows[jj][ii] === '.') ctx.fillRect(X(i) + (flip ? -dx : dx), y + j + dy, 1, 1); }
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const c = rows[j][i]; if (c !== '.') { ctx.fillStyle = pal[c]; ctx.fillRect(X(i), y + j, 1, 1); } }
}
function drawSoldier(it, x, y, t) {
  const A = SOLDIER_ART[it.id], h = A.length, br = Math.sin(t * 2 + it.id * 2) > .6 ? 1 : 0, facing = G.p.x < it.x;
  ctx.globalAlpha = .45; rect(x - 5, y + 6, 11, 2, col(0)); ctx.globalAlpha = 1;
  if (it.id === 1) { rect(x - 7, y - 1, 14, 7, '#5a4030'); rect(x - 7, y - 1, 14, 1, '#7a5838'); rect(x - 6, y + 2, 12, 1, '#3a2a20'); } // the crate he sits on
  drawMap(A, SOLDIER_PAL, x - 4, y - h + 7 - (it.id === 1 ? 6 : 0) + br * 0, facing);
  if (it.id === 0 && Math.random() < .02) part({ x: it.x + (facing ? -3 : 3), y: it.y - 10, vx: rand(-3, 3), vy: -8, life: 1.2, max: 1.2, c: 'rgba(200,200,200,.4)' }); // a cigarette
}
// ---------------- the hardware in the room ----------------
function drawAsset(it, x, y, t) {
  ctx.globalAlpha = .4; rect(x - 26, y + 7, 52, 3, col(0)); ctx.globalAlpha = 1;
  const O = '#3e4432', O2 = '#565e44', O3 = '#2a2e22';
  if (it.sup === 'heli') { // a gunship that will fly once more, patched and leaking
    rect(x - 18, y - 9, 30, 11, O); rect(x - 18, y - 9, 30, 1, O2); rect(x - 20, y - 7, 3, 7, O); rect(x - 17, y - 7, 8, 5, '#22302e'); rect(x - 16, y - 6, 2, 3, 'rgba(160,200,200,.35)'); // body, canopy
    rect(x + 12, y - 7, 18, 3, O); rect(x + 28, y - 11, 2, 7, O2); rect(x + 27, y - 12, 4, 1, O2);                         // tail
    rect(x - 2, y - 12, 3, 3, O3); rect(x - 26, y - 13, 54, 1, '#1e1c18'); rect(x - 26, y - 12, 2, 1, '#1e1c18');              // mast, blades
    rect(x - 14, y + 3, 24, 1, '#2a2a26'); rect(x - 11, y + 2, 1, 2, '#2a2a26'); rect(x + 6, y + 2, 1, 2, '#2a2a26');          // skids
    rect(x - 20, y - 2, 4, 2, '#26241f'); rect(x - 22, y - 1, 3, 1, '#26241f');                                               // the gun
    for (const [dx, dy] of [[-4, -6], [2, -4], [8, -7], [16, -6]]) rect(x + dx, y + dy, 1, 1, '#0a0908');                     // bullet holes
    rect(x + 4, y - 9, 6, 2, '#6a5a2a'); if (Math.random() < .2) part({ x: it.x + 6, y: it.y - 10, vx: rand(-4, 4), vy: -14, life: 1.4, max: 1.4, c: 'rgba(80,76,70,.6)', s: 2 });
  } else if (it.sup === 'gun') { // a towed howitzer, barrel to the sky
    for (let i = 0; i < 3; i++) pxLine(x - 4, y - 6 + i, x - 26, y - 22 + i, i === 0 ? O2 : O);                              // barrel
    rect(x - 27, y - 23, 3, 3, O3); rect(x - 8, y - 10, 12, 8, O); rect(x - 8, y - 10, 12, 1, O2); rect(x - 10, y - 14, 3, 10, O2); // breech, shield
    pxLine(x + 2, y - 3, x + 22, y + 4, O); pxLine(x + 2, y - 2, x + 22, y + 5, O3);                                          // trail
    for (const wx of [-6, 4]) { disc(x + wx, y + 1, 5, '#1e1c18'); disc(x + wx, y + 1, 2, '#565e44'); }                        // wheels
    rect(x + 14, y + 2, 8, 5, '#5a4030'); rect(x + 15, y + 1, 2, 1, '#c8a040'); rect(x + 18, y + 1, 2, 1, '#c8a040');           // a crate of shells
  } else { // a folded sentry gun on supply crates under a torn parachute
    rect(x - 14, y - 6, 14, 12, '#5a4030'); rect(x - 14, y - 6, 14, 1, '#7a5838'); rect(x + 1, y - 2, 12, 8, '#5a4030'); rect(x + 1, y - 2, 12, 1, '#7a5838');
    rect(x - 12, y - 3, 10, 1, '#3a2a20'); rect(x + 3, y + 1, 8, 1, '#3a2a20');
    rect(x - 10, y - 14, 8, 6, O); rect(x - 10, y - 14, 8, 1, O2); rect(x - 2, y - 12, 10, 2, O3); rect(x - 9, y - 8, 1, 2, O3); rect(x - 4, y - 8, 1, 2, O3); // the gun, folded
    ctx.globalAlpha = .85; for (let i = 0; i < 14; i++) rect(x + 2 + i, y - 6 + Math.round(Math.sin(i * .7) * 1.5) + (i > 9 ? i - 9 : 0), 1, 3, i % 3 ? '#8e877b' : '#6e675c'); ctx.globalAlpha = 1; // the parachute cloth
  }
}
function drawDeco(it, x, y, t) {
  if (it.d === 'sandbags') { for (let r = 0; r < 2; r++) for (let i = 0; i < 4 - r; i++) { const bx = x - 14 + i * 7 + r * 3, by = y - r * 4; rect(bx, by, 7, 4, '#6a6248'); rect(bx, by, 7, 1, '#8a8264'); rect(bx, by + 3, 7, 1, '#4a4432'); } }
  else if (it.d === 'tent') { ctx.fillStyle = '#3e4432'; ctx.beginPath(); ctx.moveTo(x - 16, y + 6); ctx.lineTo(x - 2, y - 12); ctx.lineTo(x + 14, y + 6); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#0a0908'; ctx.beginPath(); ctx.moveTo(x - 4, y + 6); ctx.lineTo(x, y - 4); ctx.lineTo(x + 6, y + 6); ctx.closePath(); ctx.fill();
    pxLine(x - 2, y - 12, x + 14, y + 6, '#565e44'); pxLine(x + 4, y - 4, x + 10, y + 2, '#2a2e22'); rect(x + 6, y - 3, 3, 2, '#2a2e22'); } // torn
  else if (it.d === 'drum') { rect(x - 4, y - 7, 8, 11, '#5a3a22'); rect(x - 4, y - 7, 8, 1, '#7a5030'); rect(x - 4, y - 3, 8, 1, '#3a2418'); campFlamesWorld(x, y - 7, t); }
  else if (it.d === 'crates') { rect(x - 9, y - 6, 10, 10, '#4a5038'); rect(x - 9, y - 6, 10, 1, '#626a4a'); rect(x + 1, y - 2, 9, 6, '#4a5038'); rect(x + 1, y - 2, 9, 1, '#626a4a'); rect(x - 7, y - 3, 6, 1, '#c8c0a0'); }
  else if (it.d === 'radio') { rect(x - 6, y - 4, 12, 7, '#2e3226'); rect(x - 6, y - 4, 12, 1, '#4a5038'); rect(x - 4, y - 2, 3, 3, '#1a1614'); rect(x + 1, y - 2, 4, 1, ((t * 3) | 0) % 2 ? '#8fa77e' : '#2a2e22'); rect(x + 4, y - 14, 1, 10, '#6e675c'); }
}
function campFlamesWorld(x, y, t) { for (let i = 0; i < 4; i++) { const f = ((t * 6 + i * 1.7) % 1), fx = x - 2 + i * 1.3 + Math.sin(t * 9 + i) * .7; rect(fx, y - f * 6, 1, 2, f < .4 ? '#ffd27a' : f < .7 ? '#e07a34' : '#8a2a14'); }
  ctx.globalAlpha = .12; disc(x, y - 2, 12, '#ff9a4a'); ctx.globalAlpha = 1; if (Math.random() < .1) part({ x: G.cam.x + x, y: G.cam.y + y - 4, vx: rand(-3, 3), vy: -18, life: 1, max: 1, c: '#e07a34' }); }

// ---------------- the conversation ----------------
const BAR = { t: 0, i: 0, ch: 0, it: null, lines: [], sel: 0, hits: [] };
function supLines(k, have) {
  const base = [[0, 'sup_a1'], [1, 'sup_b1']];
  if (have) return base.concat([[0, 'sup_have']]);
  return base.concat([[0, 'sup_' + k + '1'], [1, 'sup_' + k + '2']]);
}
function openBarracksTalk(it) { Object.assign(BAR, { t: 0, i: 0, ch: 0, it, sel: 0, lines: supLines(it.sup, !!G.support) }); G.state = 'barracks'; AU.play('menuOk'); }
function updateBarracks(rdt) {
  BAR.t += rdt; const ln = BAR.lines[BAR.i], s = ln ? L(ln[1], supName(BAR.it.sup)) : '', done = BAR.ch >= [...s].length, last = BAR.i >= BAR.lines.length - 1;
  BAR.ch += rdt * (SET.lang === 'en' ? 60 : 24);
  if (pressed('Escape')) { G.state = 'play'; AU.play('menu', .8); return; }
  if (Input.clicked) for (const h of BAR.hits) if (inR(h, Input.mx, Input.my)) { Input.clicked = false; h.f(); return; }
  if (last && done && !G.support) { if (pressed('KeyW') || pressed('ArrowUp') || pressed('KeyS') || pressed('ArrowDown') || pressed('KeyA') || pressed('KeyD')) { BAR.sel = 1 - BAR.sel; AU.play('menu'); }
    if (pressed('Enter') || pressed('Space') || pressed('KeyE')) { BAR.sel ? leaveBarracks() : askSupport(); } return; }
  if (Input.clicked || pressed('Enter') || pressed('Space') || pressed('KeyE')) { Input.clicked = false; if (!done) BAR.ch = 999; else if (!last) { BAR.i++; BAR.ch = 0; AU.play('ui', 1.1); } else leaveBarracks(); }
}
function leaveBarracks() { G.state = 'play'; AU.play('menu', .8); }
function askSupport() { const it = BAR.it; G.support = it.sup; it.room.supUsed = true; G.state = 'play'; AU.play('chipGet'); AU.play('radio');
  notify(L('n_sup', supName(it.sup)), '#8fa77e'); }
function drawBarracksTalk() {
  const k = easeOut(clamp(BAR.t / .3, 0, 1)), ln = BAR.lines[BAR.i]; if (!ln) return; BAR.hits = [];
  ctx.globalAlpha = .55 * k; rect(0, 0, W, H, '#000'); ctx.globalAlpha = k;
  const bx = 12, bw = W - 24, bh = 60, by = H - bh - 8, who = L(ln[0] ? 'sup_nameB' : 'sup_nameA'), acc = '#8fa77e';
  rect(bx, by, bw, bh, 'rgba(8,8,8,.97)'); box(bx, by, bw, bh, null, WIN_EDGE);
  const nw = textW(who) + 14; rect(bx + 8, by - 10, nw, 12, 'rgba(8,8,8,.97)'); box(bx + 8, by - 10, nw, 12, null, WIN_EDGE); text(who, bx + 15, by - 7 - (isCJK(who) ? 1 : 0), TH.bone);
  { const rr = by + 18; for (let i = 0; i < 4; i++) rect(bx + bw - 16 + (i % 2) * 3, rr - 6 + i * 2 + (((BAR.t * 8) | 0) % 2 && i === 1 ? 1 : 0), 2, 1, acc); } // the radio crackle
  const s = L(ln[1], supName(BAR.it.sup)), ch = [...s], n = clamp(Math.floor(BAR.ch), 0, ch.length), lines = wrapW(ch.slice(0, n).join(''), bw - 30); lines.slice(0, 3).forEach((l, i) => text(l, bx + 14, by + 12 + i * lineH(), TH.bone));
  const last = BAR.i >= BAR.lines.length - 1, done = n >= ch.length;
  if (last && done && !G.support) { [['sup_ask', 0], ['sup_leave', 1]].forEach(([key, i]) => { const b = { x: bx + bw - 10 - (2 - i) * 116, y: by + bh - 22, w: 110, h: 16, f: () => (i ? leaveBarracks() : askSupport()) }; BAR.hits.push(b);
      const hv = !TOUCH.on && inR(b, Input.mx, Input.my); if (hv) BAR.sel = i; drawBtn(b.x, b.y, b.w, b.h, i ? L(key) : L(key) + ' · ' + supName(BAR.it.sup), BAR.sel === i, i ? TH.bone : acc); }); }
  else if (done && ((G.time * 3) | 0) % 2 === 0) { const ax = bx + bw - 14, ay = by + bh - 10; rect(ax - 3, ay, 7, 1, acc); rect(ax - 2, ay + 1, 5, 1, acc); rect(ax - 1, ay + 2, 3, 1, acc); }
  ctx.globalAlpha = 1;
}

// ---------------- calling it in ----------------
function useSupport() {
  if (!G.support) { return; } if (G.sup) { notify(L('sup_busy'), C.red); AU.play('locked'); return; }
  const k = G.support, p = G.p; G.support = null; AU.play('radio');
  if (k === 'heli') { G.sup = { k, t: 0, x: p.x - 40, y: p.y + 30, alt: 230, fired: 0, rest: 0, cd: 0, a: 0, rot: 0 }; AU.play('heliIn'); }
  else if (k === 'gun') { G.sup = { k, t: 0, round: 0, phase: 'aim', marks: [], next: .3 }; }
  else { G.sup = { k, t: 0, phase: 'flare', x: p.x, y: p.y + 4, alt: 220, hp: 25, shots: 0, cd: 0, a: -1.57, hitT: 0, invT: 0 }; AU.play('flare'); }
  notify(L('n_supGo', supName(k)), '#8fa77e');
}
const supDepth = () => G.endless ? FLOORS.length - 1 + G.endless : G.floor;
const supDmg = base => base * (1 + supDepth() * .6);
function supShoot(x, y, a, o) { G.bullets.push(mkBullet(Object.assign({ x, y, a, spd: 360, dmg: 3, r: 1.5, life: .7, kind: 'bolt', proc: .08, knock: 30, tint: '#ffd27a', sup: true }, o))); }
function updateSupport(dt) {
  if (G.support && pressed('KeyQ')) useSupport();
  const S = G.sup; if (!S) return; S.t += dt; const p = G.p;
  if (S.k === 'heli') {
    const leaving = S.t > 30, tx = p.x + Math.cos(S.t * .45) * 46, ty = p.y + Math.sin(S.t * .45) * 26 + 6;
    S.x = lerp(S.x, tx, 1 - Math.pow(.25, dt)); S.y = lerp(S.y, ty, 1 - Math.pow(.25, dt)); S.rot += dt * 30;
    S.alt = leaving ? S.alt + dt * 140 : Math.max(34, S.alt - dt * 120);
    if (((S.t * 12) | 0) !== ((S.t * 12 - dt * 12) | 0)) AU.play('rotor', 1, Math.min(1, 34 / S.alt * 1.2));
    if (leaving && S.alt > 260) { G.sup = null; return; }
    if (!leaving && S.alt <= 40) { if (S.rest > 0) S.rest -= dt; else { S.cd -= dt; const tg = nearestEnemy(S.x, S.y, 210); if (tg) { S.a = ang(S.x, S.y, tg.x, tg.y);
          while (S.cd <= 0) { S.cd += 1 / (13 * 1.35); const tx = tg.x + rand(-5, 5), ty = tg.y + rand(-4, 4), sx = tx + rand(-30, 30) + (S.x - tx) * .25, sy = G.cam.y - 6, a = ang(sx, sy, tx, ty), dd = dist(sx, sy, tx, ty);
            supShoot(sx, sy, a, { dmg: supDmg(2.6), spd: 620, life: dd / 620 + .06, r: 1.5, sky: true }); AU.play('minigun', 1.1, .7); S.fired++;
            if (S.fired % 100 === 0) { S.rest = 2; S.cd = 0; break; } } } else S.cd = Math.max(0, S.cd); } }
    S.flash = Math.max(0, (S.flash || 0) - dt);
  } else if (S.k === 'gun') {
    if (S.phase === 'aim') { S.next -= dt; if (S.next <= 0) { const foes = shuffle(G.enemies.filter(e => !e.dead && !(e.deathFightLeft > 0) && e.spawnT <= 0)); S.marks = [];
        for (let i = 0; i < 3; i++) { const e = foes.length ? foes[i % foes.length] : null; S.marks.push(e ? { x: e.x, y: e.y, t: 0 } : { x: p.x + rand(-90, 90), y: p.y + rand(-60, 60), t: 0 }); }
        S.phase = 'fall'; S.ft = 0; AU.play('telegraph', .7); } }
    else if (S.phase === 'fall') { S.ft += dt; if (S.ft > 2.3 && !S.whistle) { S.whistle = true; AU.play('shellIn'); }
      if (S.ft >= 3) { for (const m of S.marks) { explode(m.x, m.y, 88, supDmg(70), { color: '#e07a34', proc: .2, friendly: true }); ringFx(m.x, m.y, 120, '#ffb070', .45, 3); burst(m.x, m.y, 70, '#3a3530', 240, 1.1, 3, { grav: 120 }); splat(m.x, m.y, '#0e0c0a', 70, 52); }
        shake(.55, true); hitstop(.05); flash('#ffb070', .25, true); AU.play('artillery'); S.round++; S.whistle = false; S.marks = [];
        if (S.round >= 3) { G.sup = null; return; } S.phase = 'aim'; S.next = 4; } }
  } else {
    if (S.phase === 'flare') { if (Math.random() < .7) part({ x: S.x + rand(-2, 2), y: S.y - 2, vx: rand(-6, 6) + 4, vy: rand(-26, -14), life: 1.6, max: 1.6, c: choice(['rgba(200,60,50,.55)', 'rgba(170,40,40,.45)', 'rgba(220,90,70,.4)']), s: 3, drag: 1 });
      if (S.t >= 3) { S.phase = 'drop'; S.alt = Math.max(220, S.y - G.cam.y + 50); AU.play('dropIn'); } }
    else if (S.phase === 'drop') { S.alt = Math.max(0, S.alt - dt * Math.max(70, S.alt * .55)); if (Math.random() < .5) part({ x: S.x + rand(-2, 2), y: S.y - 2, vx: rand(-4, 4), vy: rand(-18, -8), life: 1.2, max: 1.2, c: 'rgba(200,60,50,.4)', s: 3 });
      if (S.alt <= 0) { S.phase = 'deploy'; S.dt = 0; shake(.15, true); burst(S.x, S.y, 18, '#5a5248', 80, .5, 2, { grav: 120 }); AU.play('crate'); AU.play('door', 1.3); } }
    else if (S.phase === 'deploy') { S.dt += dt; if (S.dt > .9) { S.phase = 'on'; AU.play('reloadDone'); } }
    else if (S.phase === 'on') {
      const tg = nearestEnemy(S.x, S.y, 200); if (tg) { const want = ang(S.x, S.y - 6, tg.x, tg.y); S.a += clamp(angDiff(S.a, want), -dt * 9, dt * 9) || (want - S.a) * .2;
        S.cd -= dt; if (S.cd <= 0) { S.cd = .1; S.shots++; supShoot(S.x + Math.cos(S.a) * 8, S.y - 6 + Math.sin(S.a) * 8, S.a + rand(-.05, .05), { dmg: supDmg(4.5), spd: 380, tint: '#ffb070' }); AU.play('shoot', 1.3, .6); S.flash = .06;
          if (S.shots % 5 === 0) { G.bullets.push(mkBullet({ x: S.x, y: S.y - 10, a: S.a - .6 + Math.random() * 1.2, spd: 150, dmg: supDmg(12), r: 2, life: 2.2, kind: 'bolt', home: 7, proc: .1, knock: 80, boomOnEnd: true, tint: '#e0483e', sup: true, missile: true })); AU.play('rocket', 1.4, .6); } } }
      S.flash = Math.max(0, (S.flash || 0) - dt); S.hitT = Math.max(0, S.hitT - dt); S.invT = Math.max(0, (S.invT || 0) - dt);
      // it soaks up what was meant for you
      for (let i = G.ebullets.length - 1; i >= 0; i--) { const b = G.ebullets[i]; if (dist(b.x, b.y, S.x, S.y - 4) < 8 + (b.r || 3)) { G.ebullets.splice(i, 1); sentryHurt(S); if (!G.sup) return; } }
      for (const e of G.enemies) if (!e.dead && !(e.deathFightLeft > 0) && e.spawnT <= 0 && !e.boss && dist(e.x, e.y, S.x, S.y) < e.r + 9 && (e.sentT || 0) < G.time) { e.sentT = G.time + .7; sentryHurt(S); if (!G.sup) return; }
    }
  }
}
function sentryHurt(S) { if (S.invT > 0) return; S.invT = .25; S.hp--; S.hitT = .12; AU.play('armor', 1.2, .8); burst(S.x, S.y - 6, 5, '#ffb070', 70, .25);
  if (S.hp <= 0) { explode(S.x, S.y - 4, 26, supDmg(20), { color: '#e07a34', proc: 0, friendly: true }); burst(S.x, S.y, 24, '#3e4432', 120, .8, 2, { grav: 200 }); G.sup = null; notify(L('sup_down'), C.red); } }
// enemies near a working sentry go for it instead of you (enemies.js asks this before each one thinks)
function sentryTarget(e) { const S = G.sup; if (!S || S.k !== 'sentry' || S.phase !== 'on' || e.boss) return null; const ds = dist(e.x, e.y, S.x, S.y), dp = dist(e.x, e.y, G.p.x, G.p.y); return ds < 170 && ds < dp + 50 ? S : null; }

// ---------------- drawing ----------------
function drawSupportGround(cx, cy) {
  const S = G.sup; if (!S) return; const t = G.time;
  if (S.k === 'heli') { const k = clamp((230 - S.alt) / 190, 0, 1), x = S.x - cx, y = S.y - cy + 10, f = Math.cos(S.a) < 0 ? -1 : 1, sc = 2.2 + (1 - k) * 1.2, A = .12 + k * .36;
    ctx.save(); ctx.translate(x, y); ctx.scale(f * sc, sc * .62); ctx.fillStyle = '#000'; ctx.globalAlpha = A;
    ctx.beginPath(); ctx.ellipse(-2, 0, 12, 4.2, 0, 0, 6.2832); ctx.fill();                                                      // fuselage
    ctx.beginPath(); ctx.moveTo(-14, -1.5); ctx.quadraticCurveTo(-17, 0, -14, 1.5); ctx.lineTo(-10, 2.5); ctx.lineTo(-10, -2.5); ctx.fill(); // the nose
    ctx.beginPath(); ctx.moveTo(8, -1.6); ctx.lineTo(28, -.7); ctx.lineTo(28, .7); ctx.lineTo(8, 1.6); ctx.fill();                 // tail boom
    ctx.fillRect(26, -4, 2.2, 8); ctx.fillRect(21, -.6, 6, 1.2);                                                                 // fin, stabiliser
    ctx.fillRect(-6, -8, 4, 16); ctx.fillRect(-7.5, -9.5, 7, 2.6); ctx.fillRect(-7.5, 6.9, 7, 2.6);                                // stub wings, rocket pods
    ctx.fillRect(-12, -6.2, 20, 1); ctx.fillRect(-12, 5.2, 20, 1); ctx.fillRect(-9, -6, 1, 2); ctx.fillRect(3, -6, 1, 2); ctx.fillRect(-9, 4, 1, 2); ctx.fillRect(3, 4, 1, 2); // skids
    ctx.globalAlpha = A * .35; ctx.beginPath(); ctx.ellipse(-1, 0, 26, 26, 0, 0, 6.2832); ctx.fill();                              // the rotor disc
    ctx.globalAlpha = A * .9; for (let i = 0; i < 4; i++) { const a2 = S.rot * .35 + i * 1.5708; ctx.save(); ctx.translate(-1, 0); ctx.rotate(a2); ctx.fillRect(0, -.9, 26, 1.8); ctx.restore(); } // four blades
    ctx.globalAlpha = A * .45; ctx.beginPath(); ctx.ellipse(27, 4.5, 4.5, 4.5, 0, 0, 6.2832); ctx.fill();                          // tail rotor blur
    ctx.restore(); ctx.globalAlpha = 1;
    if (S.rest <= 0 && S.alt <= 40 && ((t * 26) | 0) % 2) { ctx.globalAlpha = .35; rect(x - f * 18 * sc - 2, y - 2, 4, 3, '#ffd27a'); ctx.globalAlpha = 1; } }
  else if (S.k === 'gun' && S.phase === 'fall') for (const m of S.marks) { const x = m.x - cx, y = m.y - cy, k = clamp(S.ft / 3, 0, 1), R = 68, blink = ((t * (4 + k * 10)) | 0) % 2; // the strike marker
    ctx.globalAlpha = .18 + k * .2; disc(x, y, R, '#5a0e14'); ctx.globalAlpha = 1; ringC(x, y, R, blink ? '#e0483e' : '#8a1820', 1); ringC(x, y, R * (1 - k) + 2, '#ffb070', 1);
    for (let i = 0; i < 4; i++) { const a = i * 1.5708 + t * .8; pxLine(x + Math.cos(a) * (R - 14), y + Math.sin(a) * (R - 14), x + Math.cos(a) * (R + 8), y + Math.sin(a) * (R + 8), '#e0483e'); }
    ringC(x, y, R * .5, 'rgba(224,72,62,.5)', 1);
    rect(x - 1, y - 1, 3, 3, '#ffb070'); }
  else if (S.k === 'sentry') { const x = S.x - cx, y = S.y - cy;
    if (S.phase === 'flare' || S.phase === 'drop') { rect(x - 1, y - 3, 2, 4, '#3a3530'); if (((t * 10) | 0) % 2) { rect(x - 1, y - 4, 2, 2, '#ff6a4a'); ctx.globalAlpha = .25; disc(x, y - 3, 8, '#ff4a3a'); ctx.globalAlpha = 1; } }
    if (S.phase === 'drop') { const k = clamp(1 - S.alt / 220, 0, 1); ctx.globalAlpha = .2 + k * .3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, y + 2, 4 + k * 6, 2 + k * 2, 0, 0, 6.2832); ctx.fill(); ctx.globalAlpha = 1; } }
}
function drawSentry(S, x, y, t) {
  const fl = S.hitT > 0; ctx.globalAlpha = .45; rect(x - 8, y + 2, 16, 3, col(0)); ctx.globalAlpha = 1;
  if (S.phase === 'deploy') { const k = clamp(S.dt / .9, 0, 1); rect(x - 7, y - 6 + k * 4, 14, 8 - k * 4, '#5a4030'); rect(x - 7 - k * 5, y - 2, 4, 4, '#5a4030'); rect(x + 3 + k * 5, y - 2, 4, 4, '#5a4030'); if (k < .5) return; }
  pxLine(x, y - 4, x - 7, y + 2, '#2a2e22'); pxLine(x, y - 4, x + 7, y + 2, '#2a2e22'); pxLine(x, y - 4, x, y + 3, '#2a2e22');            // tripod
  rect(x - 4, y - 10, 8, 6, fl ? '#e8e1d3' : '#3e4432'); rect(x - 4, y - 10, 8, 1, fl ? '#fff' : '#565e44'); rect(x - 1, y - 9, 2, 1, ((t * 4) | 0) % 2 ? '#e0483e' : '#5a1a14'); // head, eye
  const ex = x + Math.cos(S.a) * 9, ey = y - 7 + Math.sin(S.a) * 9; for (let i = -1; i <= 0; i++) pxLine(x, y - 7 + i, ex, ey + i, '#1e1c18');                    // barrel
  rect(x - 6, y - 12, 2, 4, '#565e44'); rect(x + 4, y - 12, 2, 4, '#565e44');                                                                                  // missile pods
  if (S.flash > 0) { disc(ex, ey, 2, '#ffd27a'); rect(ex - 1, ey - 1, 3, 3, '#fff'); }
  for (let i = 0; i < 25; i++) rect(x - 12 + i, y - 15, 1, 1, i < S.hp ? (S.hp > 8 ? '#8fa77e' : '#e0483e') : '#2a2420');                                       // its health
}
function drawSupportAir(cx, cy) {
  const S = G.sup; if (!S) return; const t = G.time;
  if (S.k === 'gun' && S.phase === 'fall' && S.ft > 2.6) for (const m of S.marks) { const q = clamp((S.ft - 2.6) / .4, 0, 1), x = Math.round(m.x - cx), top = -10, yy = Math.round(lerp(top, m.y - cy, q * q)); // the shells, falling from above the screen
    ctx.globalAlpha = .5; rect(x - 1, Math.max(top, yy - 40), 2, Math.min(40, yy - top), '#ffd27a'); ctx.globalAlpha = 1; rect(x - 2, yy - 6, 4, 7, '#3a3530'); rect(x - 1, yy - 7, 2, 1, '#8e877b'); }
  else if (S.k === 'sentry') { const x = Math.round(S.x - cx), y = Math.round(S.y - cy);
    if (S.phase === 'drop') { const yy = y - S.alt, sw = Math.sin(t * 2) * 2; ctx.fillStyle = '#8e877b'; ctx.beginPath(); ctx.ellipse(x + sw, yy - 24, 14, 7, 0, Math.PI, 0); ctx.fill(); rect(x + sw - 14, yy - 25, 28, 1, '#6e675c'); // the parachute
      for (const dx of [-12, -4, 4, 12]) pxLine(x + sw + dx, yy - 24, x + dx * .3, yy - 6, 'rgba(214,205,187,.6)');
      rect(x - 7, yy - 6, 14, 10, '#5a4030'); rect(x - 7, yy - 6, 14, 1, '#7a5838'); rect(x - 5, yy - 2, 10, 1, '#3a2a20'); rect(x - 2, yy - 4, 4, 2, '#c8c0a0'); }
    else if (S.phase === 'deploy' || S.phase === 'on') drawSentry(S, x, y, t); }
}
// ---------------- HUD: what you are carrying, or what is out there ----------------
function supIcon(k, x, y, c) {
  if (k === 'heli') { rect(x, y + 3, 7, 3, c); rect(x + 7, y + 4, 4, 1, c); rect(x - 2, y + 1, 12, 1, c); rect(x + 3, y + 2, 1, 1, c); }
  else if (k === 'gun') { pxLine(x, y + 7, x + 9, y, c); pxLine(x, y + 8, x + 9, y + 1, c); rect(x + 1, y + 6, 4, 3, c); }
  else { pxLine(x + 4, y + 4, x, y + 9, c); pxLine(x + 4, y + 4, x + 8, y + 9, c); rect(x + 1, y + 1, 6, 3, c); rect(x + 7, y + 2, 4, 1, c); }
}
function drawSupportHUD() {
  const k = G.sup ? G.sup.k : G.support; if (!k) return; const x = W - 174, y = H - 40, act = !!G.sup, c = act ? '#8fa77e' : TH.bone;
  hudPlate(x, y, 34, 25, act ? thA('#8fa77e', .6) : col(2), '#8fa77e'); supIcon(k, x + 6, y + 5, c);
  if (!act) { rect(x + 22, y + 3, 9, 9, col(5)); text('Q', x + 25, y + 5, col(0)); if (((G.time * 2) | 0) % 2) rect(x + 2, y + 23, 30, 1, '#8fa77e'); }
  else { const S = G.sup, f = S.k === 'heli' ? clamp(1 - S.t / 30, 0, 1) : S.k === 'gun' ? 1 - (S.round || 0) / 3 : clamp((S.hp || 0) / 25, 0, 1); rect(x + 3, y + 20, 28, 2, '#24221f'); rect(x + 3, y + 20, 28 * f, 2, '#8fa77e'); }
  if (TOUCH.on) { const b = supBtn(); tPad(b, '#8fa77e', TOUCH.press.sup > 0); supIcon(k, b.x - 5, b.y - 5, act ? '#8fa77e' : col(5)); }
}
function supBtn() { return TB.sup; }

// ---------------- the reload veil: a shield bubble around you while it lasts ----------------
function drawPlayerShield(cx, cy) {
  const p = G.p; if (!p || !(p.veilT > 0)) return; const t = G.time, mx = p.veilMax || .7, age = mx - p.veilT, x = Math.round(p.x - cx), y = Math.round(p.y - cy - 4);
  const k = Math.min(1, age / .12), R = Math.round(13 * (.6 + .4 * easeOut(k))), end = p.veilT < .2 && ((t * 24) | 0) % 2; if (end) return;
  ctx.globalAlpha = .16; disc(x, y, R, '#a4cfe0'); ctx.globalAlpha = .1; disc(x, y, R - 3, '#e8f4f8');
  ctx.globalAlpha = .35; for (let i = 0; i < 6; i++) { const a = i * 1.0472 + t * .8; pxLine(x + Math.cos(a) * (R - 5), y + Math.sin(a) * (R - 5), x + Math.cos(a + 1.0472) * (R - 5), y + Math.sin(a + 1.0472) * (R - 5), '#a4cfe0'); } // the hex weave
  ctx.globalAlpha = .85; ringC(x, y, R, '#a4cfe0', 1); ctx.globalAlpha = .6; ringC(x, y, R + 1 + Math.round(Math.sin(t * 20)), '#e8f4f8', 1);
  ctx.globalAlpha = .7; for (let i = 0; i < 5; i++) { const a = -2.4 + i * .18; rect(Math.round(x + Math.cos(a) * (R - 2)), Math.round(y + Math.sin(a) * (R - 2)), 1, 1, '#ffffff'); } // a highlight
  ctx.globalAlpha = 1;
}
