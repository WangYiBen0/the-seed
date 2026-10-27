// ===== ACHROMA skill chips: Limit! / Dash! / Risk! =====
'use strict';
const SKILLS = {
  limit: { nm: 'Limit!', c: () => C.cyan, icon: 'hourglass', dur: 5, cd: 25, manual: true,
    d: N3('SLOW EVERYTHING BUT YOUR OWN MOVEMENT TO 0.2X FOR UP TO 5S. PRESS E AGAIN TO END EARLY. COOLDOWN 25S.', '除了你自身的移動外，一切減速至 0.2 倍，最長 5 秒。再按 E 提前結束。冷卻 25 秒。', '自分の動き以外の全てを0.2倍に減速、最大5秒。もう一度Eで終了。CT25秒。') },
  dash: { nm: 'Dash!', c: () => C.pink, icon: 'dash', dur: 5, cd: 25, manual: true,
    d: N3('3 TEMPORARY SHIELDS, +40% MOVE SPEED, AND A RAINBOW TRAIL THAT HITS FOES. ENDS IN A SHOCKWAVE THAT ERASES BULLETS. UP TO 5S, E TO END. COOLDOWN 25S.', '獲得 3 層臨時護盾與 +40% 移速，移動時的彩虹軌跡會傷害敵人。結束時釋放抹除子彈的衝擊波。最長 5 秒，E 提前結束。冷卻 25 秒。', '一時シールド3層、移動速度+40%、虹の軌跡が敵を打つ。終了時に弾を消す衝撃波。最大5秒、Eで終了。CT25秒。') },
  risk: { nm: 'Risk!', c: () => C.red, icon: 'crackheart', dur: 5, cd: 25, manual: false,
    d: N3('FOR 5S, FATAL DAMAGE LEAVES YOU AT 1 HP. SHIELDS ARE DISABLED AND DARKNESS CLOSES IN AS HEALTH FALLS. AFTERWARD RESTORE 1 SHIELD AND 1 HP. COOLDOWN 25S.', '5 秒內致命傷害只會讓你剩下 1 點生命。期間護甲失效，生命越低視野越暗。結束時回復 1 格護甲與 1 點生命。冷卻 25 秒。', '5秒間、致命傷でもHP1で耐える。その間シールドは無効、HPが低いほど視界が闇に覆われる。終了時にシールド1とHP1を回復。CT25秒。') },
};
// chip cooldowns scale with difficulty (DESPAIR: +50%)
function skillCdMax(k) { return SKILLS[k].cd * (diffV('skillCd') || 1); }
SKILLS.teleport = { nm: 'Teleport!', c: () => C.violet, icon: 'warp', dur: 3, cd: 10, manual: false,
  d: N3('FREEZE ALL ACTION FOR UP TO 3S AND LEFT-CLICK ANYWHERE IN VIEW INSIDE A ROOM TO TELEPORT THERE. 1S OF INVINCIBILITY AFTER. COOLDOWN 10S.', '凍結一切行動最長 3 秒，左鍵點擊視野內房間中的任意位置即可瞬移。瞬移後無敵 1 秒。冷卻 10 秒。', '全ての動きを最大3秒停止し、視界内の部屋の任意地点を左クリックで瞬間移動。移動後1秒無敵。CT10秒。') };
const SKILL_IDS = Object.keys(SKILLS);
const skillOn = k => !!(G.p && G.p.skillOn && G.p.skill === k);
function chipPool() { return SKILL_IDS.filter(k => k !== G.p.skill && (typeof chipUnlocked !== 'function' || chipUnlocked(k))); }
const HUES = () => [C.red, C.orange, C.gold, C.green, C.cyan, C.violet, C.pink];

function installChip(id, x, y) {
  const p = G.p;
  if (p.skill && p.skill !== id) { if (p.skillOn) endSkill(); G.inter.push({ kind: 'chip', id: p.skill, x, y: y + 22, born: G.time }); }
  p.skill = id; p.skillCd = Math.min(p.skillCd || 0, 1.5); p.skillOn = false;
  const c = SKILLS[id].c(); AU.play('chipGet'); flash(c, .3, true); ringFx(p.x, p.y, 40, c, .5, 3); burst(p.x, p.y, 24, c, 140, .5, 2);
  notify(L('n_chip', SKILLS[id].nm), c); G.skillCall = { k: id, t: 0, install: true };
}
function activateSkill() {
  const p = G.p, k = p.skill, c = SKILLS[k].c(); p.skillOn = true; p.skillT = SKILLS[k].dur; p.skillAge = 0;
  G.skillCall = { k, t: 0 }; G.skillPulse = { x: p.x, y: p.y, t: 0, k, out: false };
  if (k === 'limit') { G.limit = true; AU.play('limitOn'); chroma(1.2, true); flash(C.cyan, .25, true); }
  if (k === 'dash') { p.tempShield = 3; AU.play('dashOn'); for (let i = 0; i < 30; i++) burst(p.x, p.y, 1, choice(HUES()), 180, .6, 2); flash(C.pink, .2, true); }
  if (k === 'risk') { AU.play('riskOn'); flash(C.red, .45, true); shake(.3, true); p.fovR = 300; G.riskBeat = 0; }
  if (k === 'teleport') { G.tpPause = true; G.tpDone = false; G.tpFold = null; AU.play('tpOn'); chroma(.8, true); flash(C.violet, .2, true); Input.clicked = false; }
}
function endSkill() {
  const p = G.p, k = p.skill; if (!p.skillOn) return; p.skillOn = false; p.skillCd = skillCdMax(k); G.skillPulse = { x: p.x, y: p.y, t: 0, k, out: true };
  if (k === 'limit') { G.limit = false; AU.play('limitOff'); chroma(1, true); }
  if (k === 'dash') { p.tempShield = 0; AU.play('dashOff'); shake(.35, true); flash(col(5), .25, true); G.shockwaves.push({ x: p.x, y: p.y, r: 4, max: 175, spd: 560, hit: new Set() }); }
  if (k === 'teleport') { G.tpPause = false; G.tpFold = { t: 0 }; if (!G.tpDone) AU.play('tpOff'); }
  if (k === 'risk') { p.armor = Math.min(p.maxArmor, p.armor + 1); healPlayer(1); AU.play('riskOff'); G.riskRestore = { t: 0, r0: p.fovR || 40 };
    notify(L('n_hp'), C.green); burst(p.x, p.y, 16, C.green, 90, .5); }
}
function playerPose(p) { const sn = Math.sin(p.aim), dir = Math.abs(sn) > .72 ? (sn > 0 ? 'f' : 'b') : 's', moving = Math.hypot(p.vx, p.vy) > 10; const fr = p.dashT > 0 ? 'd' : moving ? ((p.walkT * 10) | 0) % 4 : 0; return { dir, fr }; }
// rdt = real time (skill timers / player), wdt = world time (affected by Limit!)
function updateSkill(rdt, wdt) {
  const p = G.p; if (!p) return;
  if (G.skillCall) { G.skillCall.t += rdt; if (G.skillCall.t > 1.2) G.skillCall = null; }
  if (G.skillPulse) { G.skillPulse.t += rdt; if (G.skillPulse.t > .8) G.skillPulse = null; }
  if (G.riskRestore) { G.riskRestore.t += rdt; if (G.riskRestore.t > 2) G.riskRestore = null; }
  if (G.skillReadyT > 0) G.skillReadyT -= rdt;
  if (G.tpFold) { G.tpFold.t += rdt; if (G.tpFold.t > .34) G.tpFold = null; }
  if (G.tpTrail) { G.tpTrail.t += rdt; if (G.tpTrail.t > .35) G.tpTrail = null; } if (G.tpDeny > 0) G.tpDeny -= rdt; if (p.tpGlow > 0) p.tpGlow -= rdt;
  for (let i = G.strails.length - 1; i >= 0; i--) { G.strails[i].life -= rdt; if (G.strails[i].life <= 0) G.strails.splice(i, 1); }
  for (let i = G.shockwaves.length - 1; wdt > 0 && i >= 0; i--) { const sw = G.shockwaves[i]; sw.r += sw.spd * wdt * (1 - sw.r / (sw.max * 1.4));
    for (let j = G.ebullets.length - 1; j >= 0; j--) { const b = G.ebullets[j]; if (dist(sw.x, sw.y, b.x, b.y) < sw.r) { G.ebullets.splice(j, 1); if (Math.random() < .5) part({ x: b.x, y: b.y, vx: rand(-40, 40), vy: rand(-40, 40), life: .3, max: .3, c: choice(HUES()), s: 2 }); } }
    for (const e of G.enemies) if (!e.dead && e.spawnT <= 0 && !sw.hit.has(e) && dist(sw.x, sw.y, e.x, e.y) < sw.r + e.r) { sw.hit.add(e); hitEnemy(e, (14 + 5 * statFloor()) * G.S.dmg, { proc: 1, ka: ang(sw.x, sw.y, e.x, e.y), knock: 280, color: C.pink }); }
    if (sw.r >= sw.max) G.shockwaves.splice(i, 1); }
  if (!p.skill || !p.alive) return;
  const sk = SKILLS[p.skill];
  if (p.skillOn) {
    p.skillT -= rdt; p.skillAge += rdt;
    if (p.skill === 'limit') { G.limGhost = (G.limGhost || 0) - rdt; if (G.limGhost <= 0) { G.limGhost = .045; const ps = playerPose(p); G.ghosts.push({ x: p.x, y: p.y, flip: Math.cos(p.aim) < 0, life: .55, max: .55, c: HUES()[((G.time * 14) | 0) % 7], rows: PBODY[ps.dir].concat(ps.fr === 'd' ? PLEGS.dash : PLEGS[ps.dir][ps.fr]), key: ps.dir + ps.fr }); }
      G.limBeat = (G.limBeat || 0) - rdt; if (G.limBeat <= 0) { G.limBeat = .9; AU.play('limitBeat'); } }
    if (p.skill === 'dash') { const mv = Math.hypot(p.vx, p.vy) > 20 || p.dashT > 0;
      if (mv) { for (let k = 0; k < 2; k++) G.strails.push({ x: p.x + rand(-2, 2), y: p.y + 2 + rand(-2, 2), c: HUES()[((G.time * 20 + k) | 0) % 7], life: .45, max: .45 });
        for (const e of G.enemies) if (!e.dead && e.spawnT <= 0 && dist(p.x, p.y, e.x, e.y) < p.r + e.r + 4 && (e.skHit || 0) < G.time) { e.skHit = G.time + .35; hitEnemy(e, (10 + 4 * statFloor()) * G.S.dmg, { proc: 1, ka: ang(p.x, p.y, e.x, e.y), knock: 170, color: choice(HUES()) }); } }
      if (p.tempShield <= 0) { endSkill(); return; } }
    if (p.skill === 'teleport') { const tx = Input.mx + G.cam.x, ty = Input.my + G.cam.y;
      if (Input.clicked && p.skillAge > .05) { Input.clicked = false;
        if (tpValid(tx, ty)) { G.tpTrail = { x1: p.x, y1: p.y, x2: tx, y2: ty, t: 0 }; tpFx(p.x, p.y, false); p.x = tx; p.y = ty; p.vx = p.vy = p.kx = p.ky = 0; p.safe = { x: tx, y: ty }; p.dashT = 0; p.fly = false;
          p.inv = Math.max(p.inv, 1); p.tpGlow = 1; G.tpDone = true; tpFx(tx, ty, true); AU.play('tpGo'); shake(.2, true); chroma(1, true); endSkill(); return; }
        else { AU.play('locked'); G.tpDeny = .3; } } }
    if (p.skill === 'risk') { const f = (p.hp - 1) / Math.max(1, p.maxHp - 1), tgt = lerp(30, 250, clamp(f, 0, 1)); p.fovR = lerp(p.fovR || 300, tgt, Math.min(1, rdt * 4));
      G.riskBeat -= rdt; if (G.riskBeat <= 0) { G.riskBeat = .35 + .55 * clamp(f, 0, 1); AU.play('riskBeat', 1, .5 + (1 - f) * .5); G.riskThump = .25; } }
    if (G.riskThump > 0) G.riskThump -= rdt;
    if (p.skillT <= 0) endSkill();
    else if (sk.manual && p.skillAge > .25 && ((pressed('KeyE') && !G.prompt) || pressed('SkillBtn'))) endSkill();
  } else {
    if (p.skillCd > 0) { p.skillCd -= rdt; if (p.skillCd <= 0) { p.skillCd = 0; AU.play('skillReady'); G.skillReadyT = .7; } }
    else if (((pressed('KeyE') && !G.prompt) || pressed('SkillBtn'))) { if (hasCurse('seal') && p.lastHit < 3) { AU.play('locked'); notify(L('n_sealed'), CURSE_C); } else activateSkill(); }
  }
}
// absorb a hit with Dash! shields; returns true when the hit was eaten
function skillShieldHit() {
  const p = G.p; if (!(p.tempShield > 0) || !skillOn('dash')) return false;
  p.tempShield--; p.inv = .45; AU.play('shieldPop'); shake(.2, true); hitstop(.03, true);
  for (let i = 0; i < 14; i++) burst(p.x, p.y, 1, choice(HUES()), 140, .4, 2); ringFx(p.x, p.y, 16, C.pink, .3, 2);
  if (p.tempShield <= 0) endSkill(); return true;
}

// ---------------- world-pass visuals ----------------
function drawSkillWorld(cx, cy) {
  const p = G.p; if (!p) return;
  if (G.tpTrail) { const k = 1 - G.tpTrail.t / .35, tr2 = G.tpTrail; ctx.globalAlpha = k; line(tr2.x1 - cx, tr2.y1 - cy - 3, tr2.x2 - cx, tr2.y2 - cy - 3, C.violet, 3); line(tr2.x1 - cx, tr2.y1 - cy - 3, tr2.x2 - cx, tr2.y2 - cy - 3, col(5), 1); ctx.globalAlpha = 1; }
  if (p.tpGlow > 0 && p.alive) { const k = p.tpGlow; ringC(p.x - cx, p.y - cy - 3, 9 + (1 - k) * 4, ((G.time * 12) | 0) % 2 ? C.violet : col(5), 1); }
  for (const s of G.strails) { const k = s.life / s.max; ctx.globalAlpha = k; rect(s.x - cx - 1.5, s.y - cy - 1.5, 3 * k + 1, 3 * k + 1, s.c); } ctx.globalAlpha = 1;
  for (const sw of G.shockwaves) { const x = sw.x - cx, y = sw.y - cy, k = 1 - sw.r / sw.max;
    for (let i = 0; i < 3; i++) ringC(x, y, Math.max(1, sw.r - i * 3), HUES()[(i * 2 + ((G.time * 20) | 0)) % 7], 1); ringC(x, y, Math.max(1, sw.r - 9), col(5), Math.max(1, Math.round(3 * k)));
    ctx.globalAlpha = .12 * k; disc(x, y, sw.r, col(5)); ctx.globalAlpha = 1; }
  if (skillOn('dash') && p.alive) { const fx = p.x - cx, fy = p.y - cy - 4;
    for (let i = 0; i < 3; i++) { const a = G.time * 3.2 + i * 2.094, hx = fx + Math.cos(a) * 13, hy = fy + Math.sin(a) * 9, on = i < p.tempShield;
      if (!on) continue; const c = HUES()[(i * 2 + ((G.time * 8) | 0)) % 7]; ctx.fillStyle = col(0); ctx.beginPath(); for (let j = 0; j < 6; j++) { const b = j * 1.047; ctx.lineTo(hx + Math.cos(b) * 4, hy + Math.sin(b) * 4); } ctx.fill();
      ctx.fillStyle = c; ctx.beginPath(); for (let j = 0; j < 6; j++) { const b = j * 1.047; ctx.lineTo(hx + Math.cos(b) * 3, hy + Math.sin(b) * 3); } ctx.fill(); rect(hx - .5, hy - .5, 1, 1, col(5)); }
    ringC(fx, fy + 8, 7 + Math.sin(G.time * 12), HUES()[((G.time * 16) | 0) % 7], 1); }
  const sp = G.skillPulse; if (sp) { const x = sp.x - cx, y = sp.y - cy, k = sp.t / .8, c = SKILLS[sp.k].c();
    if (sp.k === 'limit') { const r = sp.out ? (1 - k) * 260 : easeOut(k) * 260; for (let i = 0; i < 4; i++) ringC(x, y, Math.max(1, r - i * 7), i % 2 ? col(5) : c, 1); }
    else if (sp.k === 'risk') { ringC(x, y, (sp.out ? k : 1 - k) * 90 + 8, sp.out ? C.green : C.red, 2); }
    else if (!sp.out) for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + k * 2; pxLine(x + Math.cos(a) * (8 + k * 20), y + Math.sin(a) * (8 + k * 20), x + Math.cos(a) * (20 + k * 60), y + Math.sin(a) * (20 + k * 60), HUES()[i % 7]); } }
}
// screen-wide overlays (still in the world pass so they stay pixel-crisp)
function drawSkillScreen(cx, cy) {
  const p = G.p; if (!p) return;
  if (G.tpFold && !skillOn('teleport')) { const q = clamp(G.tpFold.t / .34, 0, 1); drawDomain(p.x - cx, p.y - cy - 3, (1 - q * q) * 560, 1 - q * .4, cx, cy, q); }
  if (skillOn('teleport')) { const q = Math.min(1, p.skillAge / .5), e = 1 - Math.pow(1 - q, 3), c = C.violet;
    drawDomain(p.x - cx, p.y - cy - 3, 6 + e * 560, 1, cx, cy, 1 - q);
    if (q > .55) { const m = 6 + (1 - (q - .55) / .45) * 30; ctx.globalAlpha = (q - .55) / .45; for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) { rect(x, y, 12 * sx, 2 * sy, c); rect(x, y, 2 * sx, 12 * sy, c); } ctx.globalAlpha = 1; }
    // 3-second countdown arc around the player
    { const tx = Input.mx + G.cam.x, ty = Input.my + G.cam.y, ok = tpValid(tx, ty), c = ok ? C.violet : C.red, x = tx - cx, y = ty - cy;
    for (let i = 0; i <= 30; i++) { const q = i / 30; if ((i + ((G.time * 20) | 0)) % 3 === 0) rect(lerp(p.x - cx, x, q) - 1, lerp(p.y - cy - 3, y - 3, q) - 1, 2, 2, ok ? col(5) : C.red); }
    const ps = playerPose(p); ctx.globalAlpha = .55 + Math.sin(G.time * 10) * .15; drawChar(sprite('pg' + ps.dir + 'i' + (ok ? 1 : 0), ghostRows(PBODY[ps.dir].concat(PLEGS[ps.dir][0])), c), x, y + 4, Math.cos(p.aim) < 0, false, { noShadow: true }); ctx.globalAlpha = 1;
    shadow(x, y + 4, 9, .4); }
    const N = 24, left = p.skillT / SKILLS.teleport.dur, px = p.x - cx, py = p.y - cy - 3; for (let i = 0; i < N; i++) { const a = -Math.PI / 2 + i / N * 6.283; rect(px + Math.cos(a) * 16 - .5, py + Math.sin(a) * 16 - .5, 1, 1, i < Math.ceil(N * left) ? c : col(2)); } }
  if (skillOn('limit')) { const k = Math.min(1, p.skillAge / .35) * (p.skillT < .35 ? p.skillT / .35 : 1);
    ctx.globalAlpha = .35 * k; ctx.drawImage(ditherLayer(.13, C.cyan), 0, 0); ctx.globalAlpha = 1;
    ctx.globalAlpha = .25 * k; for (let y = ((G.time * 40) | 0) % 3; y < H; y += 3) rect(0, y, W, 1, '#000'); ctx.globalAlpha = 1;
    // frame brackets + a slowly draining time bar along the top edge
    const c = C.cyan, m = 6; for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) { rect(x, y, 16 * sx, 1 * sy, c); rect(x, y, 1 * sx, 12 * sy, c); }
    rect(W / 2 - 80, 4, 160 * (p.skillT / SKILLS.limit.dur), 1, c); }
  const riskActive = skillOn('risk'), rr = G.riskRestore;
  if (riskActive || rr) { const px = p.x - cx, py = p.y - cy - 3; let R = p.fovR || 300; if (rr) R = lerp(rr.r0, 520, easeOut(rr.t / 2));
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(px, py, R, 0, 6.2832, true); ctx.clip('evenodd'); ctx.drawImage(ditherLayer(.55, '#000'), 0, 0); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(px, py, R * 1.35 + 6, 0, 6.2832, true); ctx.clip('evenodd'); rect(0, 0, W, H, '#000'); ctx.restore();
    if (riskActive) { const th = G.riskThump > 0 ? G.riskThump / .25 : 0; ctx.globalAlpha = .25 + th * .45; ctx.strokeStyle = C.red; ctx.lineWidth = 3; ctx.strokeRect(1.5, 1.5, W - 3, H - 3); ctx.globalAlpha = 1;
      for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + G.time * .3; ctx.globalAlpha = .4 + th * .4; pxLine(px + Math.cos(a) * R, py + Math.sin(a) * R, px + Math.cos(a) * (R + 10 + th * 8), py + Math.sin(a) * (R + 10 + th * 8), C.red); } ctx.globalAlpha = 1; } }
}

// ---------------- UI pass: skill callout + HUD ----------------
function drawSkillCallout() {
  const sc = G.skillCall; if (!sc) return; const k = sc.t / 1.2, c = SKILLS[sc.k].c(), nm = SKILLS[sc.k].nm;
  const inK = easeOut(Math.min(1, sc.t / .2)), out = sc.t > .9 ? (sc.t - .9) / .3 : 0, y = 30, x = lerp(W + 60, W / 2, inK) - out * 60;
  ctx.globalAlpha = 1 - out; hudPlate(x - 100, y - 2, 190, 20, thA(c, .5), c);
  for (let i = 0; i < 3; i++) rect(x - 98 + i * 4 - out * 30, y + 2 + i * 5, 26 - i * 6, 2, c);
  text(nm.toUpperCase(), x - 4 + 1, y + 4 + 1, '#000', 2, 'center'); text(nm.toUpperCase(), x - 4, y + 4, c, 2, 'center');
  if (sc.install) text(L('skillChip'), x + 76, y + 21, col(4), 1, 'right'); ctx.globalAlpha = 1;
}
function drawSkillHUD() {
  const p = G.p, sk = p.skill && SKILLS[p.skill], c = sk ? sk.c() : col(3), hx = W - 26, hy = H - 24, R = 15;
  // plates to the left of the badge
  hudPlate(W - 136, H - 40, 92, 11, col(2)); rect(W - 130, H - 40, 22, 1, c);
  text(sk ? sk.nm.toUpperCase() : '- - -', W - 126, H - 37, sk ? c : col(3), 1);
  hudPlate(W - 128, H - 26, 84, 11, col(1));
  if (sk) {
    if (p.skillOn) { const k = Math.max(0, p.skillT / sk.dur); rect(W - 118, H - 21, 64, 2, col(2)); rect(W - 118, H - 21, 64 * k, 2, c);
      if (p.skill === 'risk') { ctx.strokeStyle = C.red; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i <= 64; i++) { const ph = (i + G.time * 60) % 32, v = ph > 14 && ph < 18 ? (ph < 16 ? -5 : 4) : 0; ctx.lineTo(W - 118 + i, H - 23 + v); } ctx.stroke(); }
      if (p.skill === 'dash') for (let i = 0; i < 3; i++) rect(W - 118 + i * 6, H - 18, 4, 2, i < p.tempShield ? HUES()[i * 2] : col(2)); }
    else if (p.skillCd > 0) { const k = 1 - p.skillCd / skillCdMax(p.skill); rect(W - 118, H - 21, 64, 2, col(2)); rect(W - 118, H - 21, 64 * k, 2, col(4)); text(Math.ceil(p.skillCd) + 'S', W - 50, H - 23, col(4), 1, 'right'); }
    else { const on = ((G.time * 3) | 0) % 2; keyCap('E', W - 120, H - 25); text(L('ready'), W - 104, H - 23, on ? c : col(5), 1); } }
  else text(L('skillChip'), W - 118, H - 23, col(3), 1);
  // hexagon badge
  const hex = r => { const pts = []; for (let i = 0; i < 6; i++) { const a = i * 1.0472 + Math.PI / 6; pts.push([hx + Math.cos(a) * r, hy + Math.sin(a) * r]); } return pts; };
  poly(hex(R + 1), col(0), sk && !p.skillOn && !p.skillCd ? (((G.time * 3) | 0) % 2 ? c : col(4)) : col(3));
  if (sk) { if (p.skillOn) { ctx.globalAlpha = .25 + Math.sin(G.time * 10) * .1; poly(hex(R - 2), c); ctx.globalAlpha = 1; }
    icon(sk.icon, hx - 8, hy - 8, p.skillCd > 0 ? col(3) : p.skillOn ? col(5) : c, 2);
    if (p.skillCd > 0) { const k = p.skillCd / skillCdMax(p.skill); ctx.globalAlpha = .6; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.arc(hx, hy, R - 1, -Math.PI / 2, -Math.PI / 2 + k * 6.283); ctx.fill(); ctx.globalAlpha = 1;
      const a = -Math.PI / 2 + k * 6.283; pxLine(hx, hy, hx + Math.cos(a) * (R - 2), hy + Math.sin(a) * (R - 2), c); }
    if (p.skillOn) { const N = 18, k = p.skillT / sk.dur; for (let i = 0; i < N; i++) { const a = -Math.PI / 2 + i / N * 6.283; rect(hx + Math.cos(a) * (R + 4) - .5, hy + Math.sin(a) * (R + 4) - .5, 2, 2, i < Math.ceil(N * k) ? c : col(1)); } } }
  else { for (let i = 0; i < 6; i++) if (((G.time * 2) | 0) % 6 !== i) { const pts = hex(R - 4); rect(pts[i][0] - 1, pts[i][1] - 1, 2, 2, col(3)); } }
  if (G.skillReadyT > 0) { const k = 1 - G.skillReadyT / .7; ringC(hx, hy, R + 2 + k * 14, c, 1); }
}
function drawChipTip(id) {
  const sk = SKILLS[id], x = TOUCH.on ? W / 2 - 79 : W - 166, y = TOUCH.on ? 4 : 70, ww = 158, c = sk.c(), lines = wrapW(tr(sk.d), ww - 12), hh = 40 + lines.length * lineH();
  rect(x + 3, y + 3, ww, hh, col(0)); box(x, y, ww, hh, col(1), c); rect(x, y, ww, 3, c);
  rect(x + 6, y + 8, 20, 20, col(0)); icon(sk.icon, x + 8, y + 10, c, 2); textS(sk.nm.toUpperCase(), x + 32, y + 9, c, 2); text(L('skillChip'), x + 32, y + 21, col(4));
  lines.forEach((l, i) => text(l, x + 6, y + 34 + i * lineH(), col(4)));
  if (G.p.skill && G.p.skill !== id) text(L('replaces', SKILLS[G.p.skill].nm), x + 6, y + hh - 9, C.red);
}
function drawChip(it, x, y, t) {
  const sk = SKILLS[it.id], c = sk.c(), bob = Math.sin(t * 3 + it.x) * 2, cy2 = y - 6 + bob;
  ctx.globalAlpha = .35; disc(x, y + 4, 7, c); ctx.globalAlpha = 1;
  for (let i = 0; i < 6; i++) { const a = t * .8 + i * 1.047; ctx.globalAlpha = .35; pxLine(x + Math.cos(a) * 9, cy2 + Math.sin(a) * 9, x + Math.cos(a) * 16, cy2 + Math.sin(a) * 16, c); } ctx.globalAlpha = 1;
  rect(x - 7, cy2 - 6, 14, 12, col(0)); rect(x - 6, cy2 - 5, 12, 10, col(3)); for (let i = 0; i < 3; i++) { rect(x - 9, cy2 - 4 + i * 4, 2, 1, col(4)); rect(x + 7, cy2 - 4 + i * 4, 2, 1, col(4)); }
  rect(x - 4, cy2 - 3, 8, 6, col(0)); icon(sk.icon, x - 4, cy2 - 4, c, 1); if (((t * 4) | 0) % 2) rect(x + 4, cy2 - 4, 1, 1, col(5));
}
function drawChest(it, x, y, t) {
  const open = it.used, lift = open ? 5 : 0, ac = it.weapon ? C.cyan : C.gold;
  ctx.globalAlpha = .5; rect(x - 11, y + 6, 22, 3, col(0)); ctx.globalAlpha = 1;
  rect(x - 10, y - 4, 20, 11, col(0)); rect(x - 9, y - 3, 18, 9, col(3)); rect(x - 9, y + 1, 18, 1, ac); rect(x - 1, y - 1, 2, 3, ac);
  rect(x - 10, y - 9 - lift, 20, 6, col(0)); rect(x - 9, y - 8 - lift, 18, 4, col(4)); rect(x - 9, y - 8 - lift, 18, 1, col(5));
  if (!open) { if (((t * 2) | 0) % 2) rect(x - 1, y - 12, 2, 2, ac); for (let i = 0; i < 4; i++) { const a = t * 1.5 + i * 1.57; rect(x + Math.cos(a) * 14, y - 2 + Math.sin(a) * 6, 1, 1, ac); } }
  if (it.weapon) { pxLine(x - 6, y - 2, x - 2, y + 4, col(5)); pxLine(x - 2, y - 2, x - 6, y + 4, col(5)); pxLine(x + 2, y - 2, x + 6, y + 4, col(5)); pxLine(x + 6, y - 2, x + 2, y + 4, col(5)); }
}

// ---------------- Teleport! ----------------
// valid: on screen, on a walkable tile inside a room, never into or out of a sealed room
function tpValid(x, y) {
  const p = G.p; if (x < G.cam.x + 4 || y < G.cam.y + 4 || x > G.cam.x + W - 4 || y > G.cam.y + H - 4) return false;
  const t = tileAtPx(x, y); if (t !== TL.FLOOR && t !== TL.SLUDGE && t !== TL.SPIKE) return false;
  if (collides(x, y, p.r, false)) return false;
  const rFrom = roomAt(p.x, p.y), rTo = roomAt(x, y); if (!rTo) return false;
  const sealed = r => r && (r.active || (r.type === 'boss' && WORLD.bossLocked));
  if (rTo !== rFrom && (sealed(rFrom) || sealed(rTo))) return false;
  return true;
}
function tpFx(x, y, arrive) {
  if (arrive) { ringFx(x, y, 34, C.violet, .35, 3); ringFx(x, y, 18, col(5), .25, 2); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; part({ x, y, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160, life: .3, max: .3, c: i % 2 ? C.violet : col(5), t: 'spark', drag: 4 }); } starFx(x, y - 3, 8, col(5), .15); }
  else { for (let i = 0; i < 18; i++) part({ t: 'conv', tx: x, ty: y - 3, a: rand(0, 6.28), r: rand(14, 30), x, y, life: .3, max: .3, c: i % 2 ? C.violet : col(4), s: 2 }); ringFx(x, y, 22, C.violet, .25, 2); }
}
// the crosshair turns into a teleport indicator while time is frozen
const _drawCursorBase = drawCursor;
drawCursor = function () {
  if (!(G.state === 'play' && skillOn('teleport'))) return _drawCursorBase();
  const x = Math.round(Input.mx), y = Math.round(Input.my), ok = tpValid(Input.mx + G.cam.x, Input.my + G.cam.y), c = ok ? C.violet : C.red, deny = G.tpDeny > 0 ? 3 : 0;
  const r = 9 + Math.sin(G.time * 8) * 1.5 + deny, rot = G.time * 2;
  for (let i = 0; i < 4; i++) { const a = rot + i * 1.5708, a2 = a + .9; pxLine(x + Math.cos(a) * r, y + Math.sin(a) * r, x + Math.cos(a2) * r, y + Math.sin(a2) * r, c); }
  const d = 5; pxLine(x, y - d, x + d, y, col(5)); pxLine(x + d, y, x, y + d, col(5)); pxLine(x, y + d, x - d, y, col(5)); pxLine(x - d, y, x, y - d, col(5));
  if (!ok) { pxLine(x - 3, y - 3, x + 3, y + 3, C.red); pxLine(x + 3, y - 3, x - 3, y + 3, C.red); } else rect(x, y, 1, 1, col(5));
};

// Teleport! domain: a violet field unfolds from the hero tile by tile, with a sigil at its heart;
// when the warp is spent it folds back in. front = strength of the leading edge (1 while it races outward)
function drawDomain(px, py, R, a, cx, cy, front) {
  if (R <= 1 || a <= 0) return; const t = G.time, gx0 = -(((cx | 0) % 16) + 16) % 16, gy0 = -(((cy | 0) % 16) + 16) % 16;
  ctx.save(); ctx.beginPath(); ctx.arc(px, py, R, 0, 6.2832); ctx.clip();
  ctx.globalAlpha = .45 * a; ctx.drawImage(ditherLayer(.19, C.violet), 0, 0);
  ctx.globalAlpha = .16 * a; for (let x = gx0; x < W; x += 16) rect(x, 0, 1, H, col(5)); for (let y = gy0; y < H; y += 16) rect(0, y, W, 1, col(5));
  // tiles just behind the front light up as the field claims them
  if (front > 0) for (let y = gy0; y < H; y += 16) for (let x = gx0; x < W; x += 16) { const d = dist(x + 8, y + 8, px, py), k = 1 - (R - d) / 40; if (k > 0 && k <= 1) { ctx.globalAlpha = k * front * .8; box(x + 1, y + 1, 15, 15, null, col(5)); ctx.globalAlpha = k * front * .25; rect(x + 2, y + 2, 13, 13, C.violet); } }
  for (let i = 0; i < 4; i++) { const r = (t * 46 + i * 36) % 150; ctx.globalAlpha = .22 * a * (1 - r / 150); ringC(px, py, r, col(5), 1); }
  ctx.globalAlpha = .1 * a; for (let i = 0; i < 12; i++) { const an = i / 12 * 6.283 + t * .15; pxLine(px + Math.cos(an) * 26, py + Math.sin(an) * 26, px + Math.cos(an) * 560, py + Math.sin(an) * 560, col(5)); }
  ctx.restore();
  // the edge of the domain, ticked like a dial
  ctx.globalAlpha = a; if (R < 520) { ringC(px, py, R, C.violet, 2); ringC(px, py, R + 3, col(5), 1); if (front > 0) { ctx.globalAlpha = front; ringC(px, py, R - 3, col(5), 2); ctx.globalAlpha = a; }
    for (let i = 0; i < 32; i++) { const an = i / 32 * 6.283 - t * .9, big = i % 4 === 0; rect(px + Math.cos(an) * (R + 7) - (big ? 1 : .5), py + Math.sin(an) * (R + 7) - (big ? 1 : .5), big ? 3 : 1, big ? 3 : 1, big ? col(5) : C.violet); } }
  // sigil at the heart
  const s = Math.min(1, R / 60); pxSquare(px, py, 26 * s, t * 1.3, C.violet); pxSquare(px, py, 26 * s, -t * 1.3 + .785, col(4)); pxSquare(px, py, 14 * s, t * 2.2, col(5));
  for (let i = 0; i < 6; i++) { const an = t * .8 + i * 1.047; rect(px + Math.cos(an) * 34 * s - 1, py + Math.sin(an) * 34 * s - 1, 2, 2, i % 2 ? col(5) : C.violet); }
  ctx.globalAlpha = 1;
}
