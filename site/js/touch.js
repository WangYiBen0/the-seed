// ===== ACHROMA mobile: touch detection, floating joystick, dash / attack-interact / skill buttons, auto-aim, back button =====
'use strict';
const MOBILE = (() => { try { return matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform)); } catch (e) { return false; } })();
const TOUCH = { on: MOBILE, ids: {}, joy: null, jx: 0, jy: 0, queue: [], held: [], press: {}, target: null, lastA: 0, t: 0 };
// layout in logical 480x270 coordinates (thumb-sized at phone scale)
const TB = { atk: { x: W - 48, y: H - 60, r: 24 }, dash: { x: W - 104, y: H - 30, r: 15 }, skill: { x: W - 30, y: H - 114, r: 15 },
  joyRest: { x: 92, y: H - 104 }, joyR: 36, swap: { x: 26, y: H - 30, r: 16 }, pause: { x: W - 98, y: 11, r: 8 }, back: { x: 16, y: 16, r: 11 }, build: { x: W - 118, y: 11, r: 8 }, full: { x: W - 138, y: 11, r: 8 }, reload: { x: W - 98, y: H - 98, r: 12 }, sup: { x: W - 66, y: H - 146, r: 13 }, ptn: { x: W - 66, y: H - 178, r: 13 } };
// ---- customisable layout: every control has a default spot and size; the player's edits live in SET.tlay ----
const TL_DEF = { joy: { x: 92, y: H - 104, r: 36 }, hud: { x: 30, y: 64, r: 1 }, skill: { x: W - 30, y: H - 114, r: 15 }, atk: { x: W - 48, y: H - 60, r: 24 }, dash: { x: W - 104, y: H - 30, r: 15 }, swap: { x: 26, y: H - 30, r: 16 }, reload: { x: W - 98, y: H - 98, r: 12 },
  sup: { x: W - 66, y: H - 146, r: 13 }, ptn: { x: W - 66, y: H - 178, r: 13 }, phud: { x: W - 26, y: H - 58, r: 1 }, shud: { x: W - 26, y: H - 92, r: 1 } };
// on a phone the buttons (now with the army support and radio partner pads); on a PC the two HUD blocks above the skill chip
const tlIds = () => TOUCH.on ? ['joy', 'hud', 'skill', 'atk', 'dash', 'swap', 'reload', 'sup', 'ptn'] : ['phud', 'shud'];
const TL_BLOCK = new Set(['phud', 'shud']);
TOUCH.hud = { x: 30, y: 64, s: 1 };
function tlGet(id) { const d = TL_DEF[id], o = (SET.tlay && SET.tlay[id]) || {}; return { x: o.x !== undefined ? o.x : d.x, y: o.y !== undefined ? o.y : d.y, s: o.s || 1 }; }
function applyTLayout() { for (const id of ['skill', 'atk', 'dash', 'swap', 'reload', 'sup', 'ptn']) { const q = tlGet(id); TB[id].x = q.x; TB[id].y = q.y; TB[id].r = TL_DEF[id].r * q.s; }
  const j = tlGet('joy'); TB.joyRest.x = j.x; TB.joyRest.y = j.y; TB.joyR = TL_DEF.joy.r * j.s; const h = tlGet('hud'); TOUCH.hud = { x: h.x, y: h.y, s: h.s }; }
applyTLayout();
// right-hand controls are anchored to the right edge, so a wider screen moves their defaults with it
RELAYOUT.push(() => { Object.assign(TL_DEF.atk, { x: W - 48 }); Object.assign(TL_DEF.dash, { x: W - 104 }); Object.assign(TL_DEF.skill, { x: W - 30 }); Object.assign(TL_DEF.reload, { x: W - 98 }); for (const k of ['sup', 'ptn']) TL_DEF[k].x = W - 66; for (const k of ['phud', 'shud']) TL_DEF[k].x = W - 26; TB.pause.x = W - 98; TB.build.x = W - 118; TB.full.x = W - 138; applyTLayout(); });
const inPlay = () => G.state === 'play' && !G.hintQ && G.p && G.p.alive;
const cardsTop = () => G.state === 'cards' && G.cards && G.cards.pick < 0 && G.cards.t > .3 && !G.hintQ;
const reloadable = () => { const p = G.p, w = p && WEAPONS[p.weapons[p.wi]]; return !!w && usesAmmo(w); };
const needsBack = () => (G.state === 'menu' && MENU.page !== 'main') || G.state === 'dead' || G.state === 'win' || G.state === 'build' || G.state === 'pause';
const hitB = (b, x, y, pad = 6) => dist(x, y, b.x, b.y) <= b.r + pad;
function tpos(t) { const r = view.getBoundingClientRect(); if (!r.width || !r.height) return [clamp(t.clientX, 0, W - 1), clamp(t.clientY, 0, H - 1)]; return [clamp((t.clientX - r.left) / r.width * W, 0, W - 1), clamp((t.clientY - r.top) / r.height * H, 0, H - 1)]; }
function tKey(code) { TOUCH.queue.push(code); }

function touchDown(t) {
  const [x, y] = tpos(t), id = t.identifier;
  if (FSQ.open) { TOUCH.ids[id] = 'fs'; FSQ.down = fsHit(x, y); if (FSQ.down >= 0) FSQ.sel = FSQ.down; return; }
  if (needsBack() && hitB(TB.back, x, y)) { TOUCH.ids[id] = 'back'; TOUCH.press.back = .2; tKey('Escape'); AU.play('menu', .8); return; }
  if (inPlay()) {
    if (hitB(TB.pause, x, y, 4)) { TOUCH.ids[id] = 'pause'; tKey('Escape'); return; }
    if (wcOn() && inR(WC_BTN(), x, y)) { TOUCH.ids[id] = 'none'; tKey('KeyT'); return; }
    if (hitB(TB.build, x, y, 4)) { TOUCH.ids[id] = 'build'; TOUCH.press.build = 1; tKey('Tab'); return; }
    if (fsBtnOn() && hitB(TB.full, x, y, 4)) { TOUCH.ids[id] = 'fsbtn'; TOUCH.press.full = 1; return; }
    if (hitB(TB.atk, x, y)) { TOUCH.ids[id] = 'atk'; TOUCH.press.atk = 1; if (G.prompt) { tKey('KeyE'); TOUCH.ids[id] = 'act'; } else { Input.down = true; Input.clicked = true; } return; }
    if (hitB(TB.dash, x, y)) { TOUCH.ids[id] = 'dash'; TOUCH.press.dash = 1; Input.rclicked = true; return; }
    if (hitB(TB.skill, x, y)) { TOUCH.ids[id] = 'skill'; TOUCH.press.skill = 1; tKey('SkillBtn'); return; }
    if (reloadable() && hitB(TB.reload, x, y, 3)) { TOUCH.ids[id] = 'reload'; TOUCH.press.reload = 1; tKey('KeyR'); return; }
    // Teleport!: while time is frozen, a tap anywhere else picks the destination
    if (skillOn('teleport')) { TOUCH.ids[id] = 'tap'; Input.mx = x; Input.my = y; Input.clicked = true; return; }
    if ((G.support || G.sup) && hitB(supBtn(), x, y)) { TOUCH.ids[id] = 'sup'; TOUCH.press.sup = 1; tKey('KeyQ'); return; }
    if (G.ptn && hitB(ptnBtn(), x, y)) { TOUCH.ids[id] = 'ptn'; TOUCH.press.ptn = 1; tKey('KeyF'); return; }
    if (hitB(TB.swap, x, y) && G.p.weapons.length > 1) { TOUCH.ids[id] = 'swap'; TOUCH.press.swap = 1; tKey('KeyX'); return; }
    const left = TB.joyRest.x < W / 2; if ((left ? x < W * .5 : x >= W * .5) && !TOUCH.joy) { const R = TB.joyR; TOUCH.joy = { id, x0: left ? clamp(x, R + 4, W * .5 - R) : clamp(x, W * .5 + R, W - R - 4), y0: clamp(y, R + 30, H - R - 4), x, y }; TOUCH.ids[id] = 'joy'; touchMove(t); return; }
    TOUCH.ids[id] = 'none'; return;
  }
  if (cardsTop()) { if (hitB(TB.pause, x, y, 4)) { TOUCH.ids[id] = 'none'; tKey('Escape'); return; } if (hitB(TB.build, x, y, 4)) { TOUCH.ids[id] = 'none'; TOUCH.press.build = 1; tKey('Tab'); return; } }
  // menus, cards, end screens, pop-ups: a tap is a click
  TOUCH.ids[id] = 'ui'; Input.mx = x; Input.my = y; Input.clicked = true; Input.down = true;
}
function touchMove(t) {
  const [x, y] = tpos(t), role = TOUCH.ids[t.identifier];
  if (role === 'joy' && TOUCH.joy) { const j = TOUCH.joy, R = TB.joyR, dx = x - j.x0, dy = y - j.y0, d = Math.hypot(dx, dy), k = Math.min(1, d / R);
    j.x = j.x0 + (d ? dx / d : 0) * k * R; j.y = j.y0 + (d ? dy / d : 0) * k * R;
    if (k < .18) { TOUCH.jx = TOUCH.jy = 0; } else { TOUCH.jx = dx / d * k; TOUCH.jy = dy / d * k; } }
  else if (role === 'ui') { Input.mx = x; Input.my = y; }
}
function touchUp(t) {
  const role = TOUCH.ids[t.identifier]; delete TOUCH.ids[t.identifier];
  // full screen may only be requested inside a user gesture: touchend is one, the game loop is not
  if (role === 'fsbtn') { const [x, y] = tpos(t); if (hitB(TB.full, x, y, 8)) { goFullscreen(); AU.play('menuOk'); } return; }
  if (role === 'fs' && FSQ.open) { const [x, y] = tpos(t), i = fsHit(x, y); if (i >= 0 && i === FSQ.down) fsChoose(i); return; }
  if (role === 'joy') { TOUCH.joy = null; TOUCH.jx = TOUCH.jy = 0; }
  else if (role === 'atk' || role === 'ui') Input.down = false;
}
const onT = f => e => { if (e.target && e.target.closest && e.target.closest('#nameEd, #chatEd, #ovlEd, #wcEd')) return; e.preventDefault(); if (!TOUCH.on) TOUCH.on = true; try { AU.init(); } catch (er) { } for (const t of e.changedTouches) f(t); };
addEventListener('touchstart', onT(touchDown), { passive: false });
addEventListener('touchmove', onT(touchMove), { passive: false });
addEventListener('touchend', onT(touchUp), { passive: false });
addEventListener('touchcancel', onT(touchUp), { passive: false });

// called at the start of every frame: one-frame virtual key presses + auto-aim
// PC aim assist (unlocked by clearing the game once): the mobile target lock, while the mouse cursor stays free
const pcAssist = () => !TOUCH.on && !(typeof PAD !== 'undefined' && PAD.active) && !!SET.aimAssist;
function touchPre(rdt) {
  if (!TOUCH.on) { assistPre(); pcBackPre(); return; } TOUCH.t += rdt;
  for (const k of TOUCH.held) Input.keys[k] = false; TOUCH.held = [];
  for (const k of TOUCH.queue) { Input.keys[k] = true; TOUCH.held.push(k); } TOUCH.queue = [];
  for (const k in TOUCH.press) TOUCH.press[k] = Math.max(0, TOUCH.press[k] - rdt * 5);
  TOUCH.target = null;
  if (!inPlay() || skillOn('teleport')) return;
  // auto-aim: the nearest visible foe (bosses favoured), otherwise the way you are moving
  const p = G.p; let bd = 250;
  for (const e of G.enemies) { if (e.dead || e.deathFightLeft > 0 || e.spawnT > 0) continue; const d = dist(p.x, p.y, e.x, e.y) - (e.boss ? 60 : 0); if (d < bd && los(p.x, p.y, e.x, e.y)) { bd = d; TOUCH.target = e; } }
  if (TOUCH.jx || TOUCH.jy) TOUCH.lastA = Math.atan2(TOUCH.jy, TOUCH.jx);
  if (TOUCH.target) { Input.mx = TOUCH.target.x - G.cam.x; Input.my = TOUCH.target.y - G.cam.y; }
  else { Input.mx = p.x - G.cam.x + Math.cos(TOUCH.lastA) * 50; Input.my = p.y - G.cam.y + Math.sin(TOUCH.lastA) * 50; }
}

// ---------------- drawing (UI pass) ----------------
function tDots(x, y, r, n, c, frac = 1, off = 0) { for (let i = 0; i < n; i++) { if (i / n >= frac) break; const a = -Math.PI / 2 + off + i / n * 6.2832; rect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1, c); } }
// octagonal pads, matching the weapon dial: dark glass, a bright rim, an accent notch, and a fill flash when pressed
function octPts(x, y, r) { const pts = []; for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } return pts; }
function tPad(b, c, on) { const r = b.r + (on ? 1 : 0);
  ctx.globalAlpha = .55; poly(octPts(b.x, b.y, r), '#0a0908', null); ctx.globalAlpha = on ? .34 : .1; poly(octPts(b.x, b.y, r - 2), c, null);
  ctx.globalAlpha = .9; poly(octPts(b.x, b.y, r), null, on ? col(5) : '#5a5a62'); ctx.globalAlpha = .6; poly(octPts(b.x, b.y, r - 3), null, '#2d2925'); ctx.globalAlpha = 1; }
function drawTouchUI() {
  if (!TOUCH.on) { if (pcBackOn()) drawPCBack(); return; } const t = TOUCH.t;
  if (FSQ.open) { drawFSQ(); return; }
  if (needsBack()) { const b = TB.back, on = TOUCH.press.back > 0; tPad(b, col(5), on); pxLine(b.x + 2, b.y - 5, b.x - 3, b.y, col(5)); pxLine(b.x - 3, b.y, b.x + 2, b.y + 5, col(5)); pxLine(b.x + 3, b.y - 5, b.x - 2, b.y, '#8e877b'); }
  if (innerHeight > innerWidth) { ctx.globalAlpha = .88; rect(0, 0, W, H, '#000'); ctx.globalAlpha = 1; const cx = W / 2, cy = H / 2 - 14, a = Math.sin(t * 2) * .4 - .4;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); box(-11, -18, 22, 36, null, col(5)); rect(-3, 13, 6, 1, col(5)); ctx.restore(); text(L('rotate'), cx, cy + 32, col(5), 1, 'center'); return; }
  if (cardsTop()) { drawPauseBtn(); drawBuildBtn(); return; }
  if (!inPlay()) return;
  const p = G.p, ac = buildTint();
  drawPauseBtn(); drawBuildBtn(); if (fsBtnOn()) drawFullBtn();
  // joystick: a ring of ticks, four direction notches, and a knob that carries your build colour
  { const j = TOUCH.joy, R = TB.joyR, bx = j ? j.x0 : TB.joyRest.x, by = j ? j.y0 : TB.joyRest.y, live = !!j;
    ctx.globalAlpha = live ? .5 : .28; disc(bx, by, R, '#0a0908'); ctx.globalAlpha = live ? .9 : .4;
    ringC(bx, by, R, '#5a5a62', 1); tDots(bx, by, R - 4, 32, '#3c3732', 1, t * .3);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2, nx = bx + Math.cos(a) * (R - 9), ny = by + Math.sin(a) * (R - 9); const lit = live && (Math.cos(a) * TOUCH.jx + Math.sin(a) * TOUCH.jy) > .5;
      pxLine(nx + Math.cos(a) * 3, ny + Math.sin(a) * 3, nx + Math.cos(a + 2.3) * 3, ny + Math.sin(a + 2.3) * 3, lit ? ac : '#8e877b'); pxLine(nx + Math.cos(a) * 3, ny + Math.sin(a) * 3, nx + Math.cos(a - 2.3) * 3, ny + Math.sin(a - 2.3) * 3, lit ? ac : '#8e877b'); }
    const kx = live ? j.x : bx, ky = live ? j.y : by;
    if (live && (TOUCH.jx || TOUCH.jy)) { ctx.globalAlpha = .35; pxLine(bx, by, kx, ky, ac); ctx.globalAlpha = .9; }
    disc(kx, ky, 13, '#0a0908'); disc(kx, ky, 12, live ? '#d8d8de' : '#8e877b'); ringC(kx, ky, 8, ac, 1); disc(kx - 4, ky - 4, 2, col(5)); ctx.globalAlpha = 1; }
  // attack / interact
  { const b = TB.atk, act = !!G.prompt, on = TOUCH.press.atk > 0 || (Input.down && !act), c = act ? (G.prompt.c || C.gold) : ac; tPad(b, c, on);
    if (act) { const s = 7 + Math.sin(t * 6); pxSquare(b.x, b.y - 2, s * 2, Math.PI / 4, c); pxSquare(b.x, b.y - 2, s * 2 - 4, Math.PI / 4 + t, col(5)); rect(b.x - 1, b.y - 6, 2, 5, col(5)); rect(b.x - 1, b.y + 1, 2, 2, col(5));
      text(fitText(L('tInteract'), b.r * 2 - 6), b.x, b.y + 11, c, 1, 'center'); }
    else { const g = on ? 5 : 7; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4, ex = b.x + Math.cos(a) * g, ey = b.y + Math.sin(a) * g;
        pxLine(ex, ey, ex + Math.cos(a + 2.4) * 4, ey + Math.sin(a + 2.4) * 4, col(5)); pxLine(ex, ey, ex + Math.cos(a - 2.4) * 4, ey + Math.sin(a - 2.4) * 4, col(5)); }
      rect(b.x - 1, b.y - 1, 3, 3, c);
      const w = WEAPONS[p.weapons[p.wi]]; if (usesAmmo(w)) { const a2 = ammoOf(p, w.id), k = a2.rl > 0 ? 1 - a2.rl / a2.max : a2.n / magSize(w); tDots(b.x, b.y, b.r + 3, 28, a2.rl > 0 ? wAccent(w) : '#8e877b', k); } } }
  // weapon swap (left side): shows the holstered weapon and its background reload
  if (p.weapons.length > 1) { const b = TB.swap, w2id = p.weapons[1 - p.wi], w2 = WEAPONS[w2id], c2 = usesAmmo(w2) ? wAccent(w2) : col(4); tPad(b, c2, TOUCH.press.swap > 0);
    const s2 = sprite('w_' + w2id, w2.spr), sw = Math.min(s2.w, 20); ctx.save(); ctx.translate(Math.round(b.x - sw / 2), Math.round(b.y - s2.h / 2 - 1)); ctx.beginPath(); ctx.rect(0, 0, sw, s2.h); ctx.clip(); ctx.drawImage(s2.n, 0, 0); ctx.restore();
    if (usesAmmo(w2)) { const a2 = ammoOf(p, w2id), k = a2.rl > 0 ? 1 - a2.rl / a2.max : a2.n / magSize(w2); tDots(b.x, b.y, b.r + 3, 24, a2.rl > 0 ? c2 : '#8e877b', k); }
    const ay = b.y + 8; pxLine(b.x - 5, ay, b.x + 4, ay, col(5)); pxLine(b.x + 4, ay, b.x + 2, ay - 2, col(5)); pxLine(b.x + 4, ay, b.x + 2, ay + 2, col(5)); }
  // dash: double chevron + cooldown dots
  { const b = TB.dash, cd = Math.max(0, p.dashCd) / (.55 * G.S.dashCd), ready = cd <= 0; tPad(b, col(5), TOUCH.press.dash > 0);
    for (const o of [-3, 2]) { pxLine(b.x + o - 2, b.y - 4, b.x + o + 2, b.y, ready ? col(5) : '#5a5a62'); pxLine(b.x + o + 2, b.y, b.x + o - 2, b.y + 4, ready ? col(5) : '#5a5a62'); }
    if (!ready) tDots(b.x, b.y, b.r + 3, 20, col(4), 1 - cd); }
  // reload: only for weapons with a magazine; fills while reloading
  if (reloadable()) { const b = TB.reload, w = WEAPONS[p.weapons[p.wi]], a2 = ammoOf(p, w.id), rel = a2.rl > 0, full = !rel && a2.n >= magSize(w), c = wAccent(w); tPad(b, c, TOUCH.press.reload > 0 || rel);
    drawReloadGlyph(b.x, b.y, b.r, full ? '#5a5a62' : rel ? c : col(5), rel ? t * 6 : 0);
    if (rel) tDots(b.x, b.y, b.r + 3, 20, c, 1 - a2.rl / a2.max); else if (a2.n <= Math.max(1, magSize(w) * .25)) tDots(b.x, b.y, b.r + 3, 20, ((t * 6) | 0) % 2 ? C.red : col(5), 1); }
  // skill: the chip's icon, a cooldown sweep and a pulse while it runs; sealed (curse) = locked and red
  { const b = TB.skill, sk = p.skill && SKILLS[p.skill], seal = skillSealed();
    if (sk && seal) { tPad(b, CURSE_C, TOUCH.press.skill > 0); ctx.globalAlpha = .45; icon(sk.icon, b.x - 8, b.y - 8, '#3c3732', 2); ctx.globalAlpha = 1; icon('lock', b.x - 4, b.y - 4, CURSE_C); tDots(b.x, b.y, b.r + 3, 20, CURSE_C, seal / 3); }
    else { tPad(b, sk ? sk.c() : col(3), TOUCH.press.skill > 0 || p.skillOn);
    if (!sk) { for (let i = 0; i < 3; i++) rect(b.x - 4 + i * 4, b.y, 1, 1, '#3c3732'); }
    else { const cdk = p.skillCd > 0 ? p.skillCd / skillCdMax(p.skill) : 0, c = sk.c(); icon(sk.icon, b.x - 8, b.y - 8, cdk > 0 ? col(3) : p.skillOn ? col(5) : c, 2);
      if (cdk > 0) tDots(b.x, b.y, b.r + 3, 20, c, 1 - cdk); else if (p.skillOn) ringC(b.x, b.y, b.r + 3 + Math.sin(t * 10), c, 1); else tDots(b.x, b.y, b.r + 3, 20, c, 1, t); } } }
}
// in-game full-screen button (phones): shown only while not full screen, where the browser supports it
const fsBtnOn = () => { if (ONDZ()) return false; const el = document.documentElement; return !!(el.requestFullscreen || el.webkitRequestFullscreen) && !(document.fullscreenElement || document.webkitFullscreenElement); };
function drawFullBtn() { const b = TB.full, on = TOUCH.press.full > 0, c = on ? C.cyan : col(5); ctx.globalAlpha = .55; disc(b.x, b.y, b.r, '#0a0908'); ctx.globalAlpha = 1; ringC(b.x, b.y, b.r, on ? col(5) : '#5a5a62', 1);
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const x = b.x + sx * 4, y = b.y + sy * 3; rect(sx < 0 ? x : x - 2, y, 3, 1, c); rect(x, sy < 0 ? y : y - 1, 1, 2, c); } }
function drawPauseBtn() { const b = TB.pause; ctx.globalAlpha = .55; disc(b.x, b.y, b.r, '#0a0908'); ctx.globalAlpha = 1; ringC(b.x, b.y, b.r, '#5a5a62', 1); rect(b.x - 3, b.y - 3, 2, 7, col(5)); rect(b.x + 1, b.y - 3, 2, 7, col(5)); }
// the build view: four little tiles
function drawBuildBtn() { const b = TB.build, on = TOUCH.press.build > 0; ctx.globalAlpha = .55; disc(b.x, b.y, b.r, '#0a0908'); ctx.globalAlpha = 1; ringC(b.x, b.y, b.r, on ? col(5) : '#5a5a62', 1);
  const c = buildTint(); rect(b.x - 4, b.y - 4, 3, 3, col(5)); rect(b.x + 1, b.y - 4, 3, 3, c); rect(b.x - 4, b.y + 1, 3, 3, c); rect(b.x + 1, b.y + 1, 3, 3, col(5)); }
// a circular arrow (reload)
function drawReloadGlyph(x, y, r, c, rot) { const R = Math.max(4, r * .45); for (let i = 0; i < 14; i++) { const a = rot + .5 + i / 14 * 5.2; rect(Math.round(x + Math.cos(a) * R), Math.round(y + Math.sin(a) * R), 1, 1, c); }
  const a = rot + .5 + 5.2, hx = x + Math.cos(a) * R, hy = y + Math.sin(a) * R, ta = a + Math.PI / 2; pxLine(hx, hy, hx - Math.cos(ta - .7) * 3, hy - Math.sin(ta - .7) * 3, c); pxLine(hx, hy, hx - Math.cos(ta + .9) * 3, hy - Math.sin(ta + .9) * 3, c);
  rect(Math.round(x) - 1, Math.round(y) - 1, 2, 2, c); }
// on touch screens the skill button replaces the skill HUD, and the cursor only appears as the auto-aim lock
const _drawSkillHUDT = drawSkillHUD; drawSkillHUD = function () { if (!TOUCH.on) _drawSkillHUDT(); };
const _drawCursorT = drawCursor; drawCursor = function () { if (TOUCH.on && !(G.state === 'play' && (TOUCH.target || skillOn('teleport')))) return; _drawCursorT(); };

// ---- PC aim assist ----
function assistTarget() { const p = G.p; let bd = 250, tg = null;
  for (const e of G.enemies) { if (e.dead || e.deathFightLeft > 0 || e.spawnT > 0) continue; const d = dist(p.x, p.y, e.x, e.y) - (e.boss ? 60 : 0); if (d < bd && los(p.x, p.y, e.x, e.y)) { bd = d; tg = e; } } return tg; }
function assistPre() {
  TOUCH.target = null;
  if (pcAssist() && inPlay() && !skillOn('teleport')) { TOUCH.target = assistTarget(); if (G.p && !(window.BOSS_TEST && BOSS_TEST.on)) markAssisted(); }
  // lobbed shells and fireworks land on the locked target too
  if (TOUCH.target) { G.aimX = TOUCH.target.x; G.aimY = TOUCH.target.y; TOUCH.setAim = true; }
  else if (TOUCH.setAim) { delete G.aimX; delete G.aimY; TOUCH.setAim = false; }
}
// a turning lock bracket on the target (the normal crosshair keeps following the mouse)
function drawAssistLock() {
  if (TOUCH.on || !TOUCH.target || !inPlay()) return; const e = TOUCH.target, x = e.x - G.cam.x, y = e.y - G.cam.y, r = e.r + 6 + Math.sin(G.time * 6), a0 = G.time * 2;
  for (let i = 0; i < 4; i++) { const a = a0 + i * Math.PI / 2, cx = x + Math.cos(a) * r, cy = y + Math.sin(a) * r;
    pxLine(cx, cy, cx + Math.cos(a + 2.4) * 4, cy + Math.sin(a + 2.4) * 4, C.red); pxLine(cx, cy, cx + Math.cos(a - 2.4) * 4, cy + Math.sin(a - 2.4) * 4, C.red); }
}

// ===== phones: on entering the page, offer full screen + landscape (same plain style as the hints pop-up) =====
const FSQ = { open: MOBILE && !ONDZ() && !document.fullscreenElement && !document.webkitFullscreenElement, sel: 0, t: 0, down: -1 };
function fsLayout() { const pw = 300, lines = wrapW(L('fsMsg'), pw - 28, 2), lh = lineH(2), bh = lines.length * lh, ph = 26 + bh + 14 + 24 + 14, px = Math.round(W / 2 - pw / 2), py = Math.round(H / 2 - ph / 2), by = py + 26 + bh + 10, bw = 118, gap = 12;
  return { pw, ph, px, py, lines, lh, btns: [{ x: W / 2 - gap / 2 - bw, y: by, w: bw, h: 24 }, { x: W / 2 + gap / 2, y: by, w: bw, h: 24 }] }; }
function fsHit(x, y) { return fsLayout().btns.findIndex(b => x >= b.x - 4 && x <= b.x + b.w + 4 && y >= b.y - 4 && y <= b.y + b.h + 4); }
function fsChoose(i) { FSQ.open = false; Input.clicked = false; Input.down = false; try { AU.init(); AU.play('menuOk'); } catch (e) { } if (i === 0) goFullscreen(); }
function goFullscreen() {
  const el = document.documentElement, req = el.requestFullscreen ? () => el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen ? () => el.webkitRequestFullscreen() : null;
  const lock = () => { try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => { }); } catch (e) { } setTimeout(fit, 250); };
  try { const pr = req && req(); if (pr && pr.then) pr.then(lock, lock); else lock(); } catch (e) { lock(); }
}
addEventListener('fullscreenchange', () => setTimeout(fit, 120)); addEventListener('webkitfullscreenchange', () => setTimeout(fit, 120));
addEventListener('orientationchange', () => setTimeout(fit, 250));
// keyboard / mouse fallback (e.g. a tablet with a keyboard): the menu waits until the question is answered
function updateFSQ() { FSQ.t += FRAME_DT;
  if (pressed('KeyA') || pressed('ArrowLeft')) FSQ.sel = 0; if (pressed('KeyD') || pressed('ArrowRight')) FSQ.sel = 1;
  if (Input.clicked) { const i = fsHit(Input.mx, Input.my); if (i >= 0) fsChoose(i); } else if (pressed('Enter') || pressed('Space')) fsChoose(FSQ.sel); }
const _updateMenuFS = updateMenu; updateMenu = function (rdt) { if (FSQ.open) { updateFSQ(); return; } _updateMenuFS(rdt); };
function drawFSQ() {
  const k = clamp(FSQ.t / .25, 0, 1), lay = fsLayout(), { px, py, pw, ph } = lay;
  ctx.globalAlpha = .75 * k; rect(0, 0, W, H, '#000'); ctx.globalAlpha = k;
  rect(px, py, pw, ph, '#0b0b0d'); box(px, py, pw, ph, null, '#2d2925'); rect(px + 14, py + 10, 20, 1, '#e8e1d3');
  lay.lines.forEach((l, i) => text(l, W / 2, py + 18 + i * lay.lh, '#e8e8ec', 2, 'center'));
  lay.btns.forEach((b, i) => { const on = FSQ.sel === i; if (on) rect(b.x, b.y, b.w, b.h, '#e8e1d3'); else box(b.x, b.y, b.w, b.h, null, '#3c3732');
    text(fitText(L(i ? 'fsLater' : 'fsOk'), b.w - 10, 2), b.x + b.w / 2, b.y + 7, on ? '#0a0908' : '#8e877b', 2, 'center'); });
  ctx.globalAlpha = 1;
}

// ===== touch layout editor (Settings > Button layout): drag any control, pick one to resize it =====
const TLE = { sel: 'atk', drag: null, moved: false, flash: 0 };
const TLB = () => { const y = 30, bw = 26, x0 = W / 2 - 128; return { minus: { x: x0, y, w: bw, h: 16 }, plus: { x: x0 + 82, y, w: bw, h: 16 }, reset: { x: x0 + 124, y, w: 62, h: 16 }, done: { x: x0 + 194, y, w: 62, h: 16 } }; };
function tlHit(id, x, y) { const q = tlGet(id), d = TL_DEF[id];
  if (id === 'hud') { const s = q.s; return x > q.x - 22 * s && x < q.x + 128 * s && y > q.y - 22 * s && y < q.y + 22 * s; }
  if (TL_BLOCK.has(id)) { const s = q.s; return x > q.x - 114 * s && x < q.x + 16 * s && y > q.y - 16 * s && y < q.y + 16 * s; }
  return dist(x, y, q.x, q.y) < d.r * q.s + 5; }
function tlSet(id, o) { SET.tlay = SET.tlay || {}; SET.tlay[id] = Object.assign(tlGet(id), o); applyTLayout(); }
function tlSize(d) { const q = tlGet(TLE.sel); tlSet(TLE.sel, { s: clamp(Math.round((q.s + d) * 10) / 10, .6, 1.8) }); saveSettings(); AU.play('menu', 1 + d); }
function updateTLayout(rdt) {
  TLE.flash = Math.max(0, TLE.flash - rdt); const mx = Input.mx, my = Input.my, B = TLB(), inB = b => mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h;
  if (pressed('Escape')) { saveSettings(); backPage(); return; }
  if (Input.clicked) {
    if (inB(B.done)) { saveSettings(); backPage(); return; }
    if (inB(B.reset)) { SET.tlay = {}; applyTLayout(); saveSettings(); TLE.flash = .5; AU.play('menuOk'); return; }
    if (inB(B.minus)) { tlSize(-.1); return; } if (inB(B.plus)) { tlSize(.1); return; }
    const hit = tlIds().slice().reverse().find(id => tlHit(id, mx, my));
    if (hit) { const q = tlGet(hit); TLE.sel = hit; TLE.drag = { dx: mx - q.x, dy: my - q.y }; TLE.moved = false; AU.play('menu', 1.1); }
  }
  if (TLE.drag && Input.down) { const q = tlGet(TLE.sel), nx = clamp(mx - TLE.drag.dx, 12, W - 12), ny = clamp(my - TLE.drag.dy, 50, H - 12);
    if (Math.abs(nx - q.x) + Math.abs(ny - q.y) > .5) { tlSet(TLE.sel, { x: Math.round(nx), y: Math.round(ny) }); TLE.moved = true; } }
  if (!Input.down && TLE.drag) { TLE.drag = null; if (TLE.moved) saveSettings(); }
  if (pressed('Minus') || pressed('NumpadSubtract')) tlSize(-.1); if (pressed('Equal') || pressed('NumpadAdd')) tlSize(.1);
}
function tlBtn(b, label, on, c) { poly([[b.x + 4, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h - 4], [b.x + b.w - 4, b.y + b.h], [b.x, b.y + b.h], [b.x, b.y + 4]], on ? '#18181d' : '#0b0b0d', c || '#3c3732');
  text(fitText(label, b.w - 6), b.x + b.w / 2, b.y + b.h / 2 - (isCJK(label) ? 4 : 2), '#e8e8ec', 1, 'center'); }
function drawTLayout() {
  rect(0, 0, W, H, '#0a0908');
  for (let x = 0; x < W; x += 24) rect(x, 0, 1, H, '#111114'); for (let y = 0; y < H; y += 24) rect(0, y, W, 1, '#111114');
  textS(L(TOUCH.on ? 'tl_title' : 'tl_titlePC'), W / 2, 10, '#e8e1d3', 1, 'center');
  // the controls, drawn at their configured spots and sizes
  for (const id of tlIds()) { const q = tlGet(id), sel = TLE.sel === id, c = sel ? C.cyan : '#8e877b';
    if (TL_BLOCK.has(id)) { tlBlockDemo(id, q); text(L('tl_' + id), q.x - 50 * q.s, q.y + 18 * q.s, c, 1, 'center'); if (sel) box(Math.round(q.x - 116 * q.s), Math.round(q.y - 17 * q.s), Math.round(134 * q.s), Math.round(34 * q.s), null, C.cyan); continue; }
    if (id === 'joy') { const R = TL_DEF.joy.r * q.s; ctx.globalAlpha = .5; disc(q.x, q.y, R, '#0a0908'); ctx.globalAlpha = 1; ringC(q.x, q.y, R, sel ? C.cyan : '#5a5a62', 1); tDots(q.x, q.y, R - 4, 32, '#3c3732'); disc(q.x, q.y, 12 * q.s, '#0a0908'); disc(q.x, q.y, 11 * q.s, '#8e877b'); }
    else if (id === 'hud') { ctx.save(); ctx.translate(q.x, q.y); ctx.scale(q.s, q.s); const R = 19, oct = []; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + Math.PI / 8; oct.push([Math.cos(a) * (R - 1), Math.sin(a) * (R - 1)]); }
      hudPlate(12, -20, 116, 12, col(2)); hudPlate(10, -5, 98, 10, col(1)); poly(oct, col(0), sel ? C.cyan : col(3)); rect(-6, -1, 12, 2, col(4)); ctx.restore(); }
    else { const b = { x: q.x, y: q.y, r: TL_DEF[id].r * q.s }; tPad(b, sel ? C.cyan : col(4), sel);
      if (id === 'atk') { for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4, ex = b.x + Math.cos(a) * 7, ey = b.y + Math.sin(a) * 7; pxLine(ex, ey, ex + Math.cos(a + 2.4) * 4, ey + Math.sin(a + 2.4) * 4, col(5)); pxLine(ex, ey, ex + Math.cos(a - 2.4) * 4, ey + Math.sin(a - 2.4) * 4, col(5)); } }
      else if (id === 'dash') for (const o of [-3, 2]) { pxLine(b.x + o - 2, b.y - 4, b.x + o + 2, b.y, col(5)); pxLine(b.x + o + 2, b.y, b.x + o - 2, b.y + 4, col(5)); }
      else if (id === 'skill') icon('warp', b.x - 4, b.y - 4, col(5));
      else if (id === 'reload') drawReloadGlyph(b.x, b.y, b.r, col(5), 0);
      else if (id === 'sup') supIcon('heli', b.x - 5, b.y - 5, col(5));
      else if (id === 'ptn') icon('pk_order', b.x - 4, b.y - 4, col(5));
      else { pxLine(b.x - 5, b.y, b.x + 4, b.y, col(5)); pxLine(b.x + 4, b.y, b.x + 2, b.y - 2, col(5)); pxLine(b.x + 4, b.y, b.x + 2, b.y + 2, col(5)); } }
    const ly = id === 'hud' ? q.y + 26 * q.s : q.y + (id === 'joy' ? TL_DEF.joy.r * q.s : TL_DEF[id].r * q.s) + 4; text(L('tl_' + id), id === 'hud' ? q.x + 50 * q.s : q.x, ly, c, 1, 'center');
    if (sel) { const r = id === 'hud' ? 0 : (id === 'joy' ? TL_DEF.joy.r : TL_DEF[id].r) * q.s + 4; if (r) for (let i = 0; i < 24; i++) { if (((i + ((MENU.t * 8) | 0)) % 3) === 0) continue; const a = i / 24 * 6.283; rect(q.x + Math.cos(a) * r, q.y + Math.sin(a) * r, 1, 1, C.cyan); }
      else { const s = q.s; box(q.x - 22 * s, q.y - 22 * s, 150 * s, 44 * s, null, C.cyan); } } }
  // toolbar: size of the selected control, reset, done
  const B = TLB(), q = tlGet(TLE.sel); tlBtn(B.minus, '-', false); tlBtn(B.plus, '+', false); text(L('tl_' + TLE.sel) + ' ' + Math.round(q.s * 100) + '%', B.minus.x + 54, B.minus.y + 5 - (isCJK(L('tl_' + TLE.sel)) ? 2 : 0), C.cyan, 1, 'center');
  tlBtn(B.reset, L('tl_reset'), TLE.flash > 0, TLE.flash > 0 ? C.gold : null); tlBtn(B.done, L('tl_done'), false, C.cyan);
  text(L('tl_hint'), W / 2, H - 10, '#57524a', 1, 'center');
}
const _menuItemsTL = menuItems; menuItems = function (page) { const it = _menuItemsTL(page);
  if (page === 'gameset') it.splice(it.length - 2, 0, { l: () => L(TOUCH.on ? 'tl_title' : 'tl_titlePC'), act: () => { TLE.sel = TOUCH.on ? 'atk' : 'phud'; goPage('tlayout'); } });
  return it; };
const _updateMenuTL = updateMenu; updateMenu = function (rdt) { if (MENU.page === 'tlayout' && !FSQ.open) { MENU.t += rdt; updateTLayout(rdt); return; } _updateMenuTL(rdt); };
const _drawMenuTL = drawMenu; drawMenu = function (t) { if (MENU.page === 'tlayout') { drawTLayout(); return; } _drawMenuTL(t); };
const _drawPauseTL = drawPause; drawPause = function () { if (MENU.page === 'tlayout') { drawTLayout(); return; } _drawPauseTL(); };

// ===== PC: a back button (top left) on the screens that had none: difficulty select and the build view =====
const PCB = { hold: false, hov: false };
const pcBackOn = () => !TOUCH.on && G.state === 'build';
function pcBackPre() { if (PCB.hold) { Input.keys.Escape = false; PCB.hold = false; } if (!pcBackOn()) { PCB.hov = false; return; }
  const b = TB.back; PCB.hov = dist(Input.mx, Input.my, b.x, b.y) <= b.r + 3;
  if (Input.clicked && PCB.hov) { Input.clicked = false; Input.keys.Escape = true; Input.prev.Escape = false; PCB.hold = true; AU.play('menu', .8); } }
function drawPCBack() { const b = TB.back; tPad(b, col(5), PCB.hov); const c = PCB.hov ? col(5) : '#c9c1b2'; pxLine(b.x + 2, b.y - 5, b.x - 3, b.y, c); pxLine(b.x - 3, b.y, b.x + 2, b.y + 5, c); pxLine(b.x + 3, b.y - 5, b.x - 2, b.y, '#8e877b'); }
applyQuality();
