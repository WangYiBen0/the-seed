// ===== ACHROMA main: player, rooms, special rooms, states, two-pass render loop =====
'use strict';
const PSPR = {
  a: ['...555...', '..55555..', '.5555555.', '.5500055.', '.5555555.', '..44444..', '.4455544.', '.4455544.', '..44444..', '..4...4..', '..3...3..'],
  b: ['...555...', '..55555..', '.5555555.', '.5500055.', '.5555555.', '..44444..', '.4455544.', '.4455544.', '..44444..', '.4.....4.', '.3.....3.'],
};
const ghostRows = rows => rows.map(r => r.replace(/[0-9]/g, 't'));
const PBODY = {
  f: ['...555...', '..55555..', '.5555555.', '.5500055.', '.5555555.', '..44444..', '.4455544.', '.4455544.', '..44444..'],
  b: ['...555...', '..55555..', '.5555555.', '.5555555.', '.5455545.', '..43334..', '.4333334.', '.4333334.', '..44444..'],
  s: ['...555...', '..55555..', '.5555555.', '.5555000.', '.5555555.', '..44444..', '..45544..', '..45544..', '..44444..'] };
const PLEGS = {
  f: [['..4...4..', '..3...3..'], ['..4....4.', '..3....3.'], ['..4...4..', '..3...3..'], ['.4....4..', '.3....3..']],
  s: [['...4.4...', '...3.3...'], ['..4...4..', '.3.....3.'], ['...4.4...', '...3.3...'], ['....44...', '....33...']],
  dash: ['.4.....4.', '3.......3'] };
PLEGS.b = PLEGS.f;
function pSprite(dir, fr) { return sprite('p' + dir + fr, PBODY[dir].concat(fr === 'd' ? PLEGS.dash : PLEGS[dir][fr])); }
let G = { state: 'intro', time: 0, p: null };

function startRun() { AU.init(); AU.startDrone(); AU.play('select'); newRun(); Input.down = false; }
// menu -> game: the menu dissolves into a diamond of light, then the world irises open around the player
function launchRun() { AU.init(); AU.startDrone(); AU.play('menuOk'); AU.play('fusionCharge'); LAUNCH.t = 0; LAUNCH.done = false; G.state = 'launch'; }
const LAUNCH = { t: 0, done: false, inT: 9 };
function toMenu() { setFloorPal(0); AU.pickMenuSong(); G.state = 'menu'; MENU.page = 'main'; MENU.stack = []; MENU.sel = 0; MENU.t = 0; MENU.hy = 0; AU.setMode('calm'); }
// the first floor's start room only offers basic weapons
const BASIC_WEAPONS = ['edge', 'scatter', 'halo', 'bow', 'volt', 'lance', 'cluster', 'splinter', 'hail', 'twin', 'rivet', 'helix', 'frostbite', 'shuriken', 'mirage', 'carom', 'crescent', 'whirl', 'whip', 'fist', 'hook', 'net'];
function restartRun() { SET.diff = G.diff || SET.diff; saveSettings(); clearSave(); LAUNCH.fn = null; launchRun(); }
function newRun() {
  FX.slow = 1; FX.slowT = 0; FX.hitstop = 0; FX.trauma = 0; FX.chroma = 0; FX.flashA = 0; FX.load = 0;
  G = { state: 'play', time: 0, runT: 0, floor: 0, kills: 0, combo: 0, comboT: 0, comboMax: 0, comboPop: 0, ink: 0, rerolls: 0, rerollBase: 15, tints: [], curse: 0, fury: 0, furyT: 0,
    enemies: [], bullets: [], ebullets: [], slashes: [], beams: [], bolts: [], thrusts: [], muzzles: [], vortices: [], whips: [], slams: [], iais: [], punches: [], orbOpen: null, bgReloadT: 0, emitters: [], wreck: null, strails: [], shockwaves: [], limit: false, skillCall: null, skillPulse: null, riskRestore: null, mechs: [], pillars: [], fusionQ: [], fusion: null, deathwall: null, picks: [], inter: [], later: [], lasers: [], zones: [], ghosts: [], went: [],
    cam: { x: 0, y: 0 }, banner: null, boss: null, cards: null, endT: 0, muzzle: 0, inkPitch: 0, inkT: 0, trial: null, notes: [], inkAcc: 0, hits: 0, freeReroll: false, curses: [], fires: [], curseDone: false, result: null, squad: [], met: [], campPick: null, talk: null, rid: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8) };
  G.diff = DIFF_BY[SET.diff] ? SET.diff : 'classic'; G.proofGain = 0;
  G.p = { x: 0, y: 0, r: 4, vx: 0, vy: 0, aim: 0, hp: 5, maxHp: 5, armor: 3, maxArmor: 3, armorRegen: 0, lastHit: 99, inv: 0, dashT: 0, dashCd: 0, dx: 0, dy: 0,
    weapons: ['nail'], wi: 0, wlv: {}, ammo: {}, skill: null, skillCd: 0, skillOn: false, skillT: 0, tempShield: 0, lean: 0, primed: 0, kx: 0, ky: 0, slowT: 0, cd: 0, charge: 0, spin: 0, recoil: 0, shards: {}, alive: true, walkT: 0, safe: null, echoN: 0, ricoN: {}, veilClock: 0, veilCd: 0, veilReloads: {}, fly: false, phoenixUsed: false };
  G.seenW = new Set(G.p.weapons); recomputeStats(); computeTints(); codexMark('w:nail'); G.p.armor = G.p.maxArmor;
  CHATTER.t = 0; CHATTER.req++; CHATTER.busy = false; CHATTER.kills = 0; SQ.ticker.length = 0;
  if (!RESUMING) { G.buffs = marketTake(); marketApply(); recomputeStats(); }
  enterFloor(0);
}
function enterFloor(fi) {
  G.floor = fi; G.sup = null; setFloorPal(fi); PALV++; spriteCache.clear();
  P.length = 0; FT.length = 0;
  for (const k of ['enemies', 'bullets', 'ebullets', 'picks', 'inter', 'later', 'lasers', 'zones', 'vortices', 'mechs', 'slashes', 'beams', 'bolts', 'thrusts', 'muzzles', 'whips', 'slams', 'iais', 'punches', 'went', 'ghosts']) if (G[k]) G[k].length = 0;
  if (G.p.skillOn) G.p.skillCd = skillCdMax(G.p.skill);
  Object.assign(G.p, { skillOn: false, skillT: 0, tempShield: 0, vx: 0, vy: 0, kx: 0, ky: 0, dashT: 0, fly: false, charge: 0, fullT: 0, spin: 0, reapT: 0, anim: null, aegisOn: false, vacOn: false, vacN: 0, flK: 0, flB: null, drones: [] });
  G.limit = false; G.tpPause = false; G.decoy = null; G.sing = null; G.tpTrail = null; G.tpFold = null; G.skillCall = null; G.skillPulse = null; G.prompt = null; G.nextFloor = null;
  G.strails = []; G.shockwaves = []; G.riskRestore = null;
  G.deathwall = null; G.fires = []; G.floorOrbs = 0; G.bonusOrbs = 0; G.hasKey = false; G.emitters = []; G.wreck = null; if (G.p) G.p.pol = null;
  G.rerolls = 0; if (!(window.BOSS_TEST && BOSS_TEST.on) && !G.resumePick) pickBoss(); genFloor(fi); if (!(window.BOSS_TEST && BOSS_TEST.on)) pickChampRooms(fi); G.resumePick = false; G.boss = null; G.bossDead = false; G.bossChip = 1; G.trial = null;
  const sf = statFloor();
  const s = WORLD.rooms.find(r => r.type === 'start'); const p = G.p;
  p.x = s.cx * T + 8; p.y = s.cy * T + 8; p.safe = { x: p.x, y: p.y };
  G.cam.x = p.x - W / 2; G.cam.y = p.y - H / 2;
  squadEnterFloor();
  for (const r of WORLD.rooms) {
    const cx = r.cx * T + 8, cy = r.cy * T + 8;
    if (r.type === 'treasure') { const two = diffV('wChest') && Math.random() < .5; G.inter.push({ kind: 'chest', x: two ? cx - 26 : cx, y: cy + 4 }, { kind: 'fount', x: cx, y: cy - 34, cost: 20 }); if (two) G.inter.push({ kind: 'chest', weapon: true, x: cx + 26, y: cy + 4 }); }
    if (r.type === 'shrine') G.inter.push({ kind: 'altar', x: cx, y: cy });
    if (r.type === 'dialysis') G.inter.push({ kind: 'dialysis', x: cx, y: cy });
    if (r.type === 'barracks') barracksSetup(r, cx, cy);
    try { roomDecor(r, cx, cy); } catch (e) { console.error(e); }
    if (r.type === 'camp') G.inter.push(...campInter(r));
    if (r.type === 'forge') G.inter.push({ kind: 'forge', x: cx, y: cy });
    if (r.type === 'trial') G.inter.push({ kind: 'totem', x: cx, y: cy, room: r });
    if (r.type === 'idol') G.inter.push({ kind: 'idol', x: cx, y: cy - 6 });
    if (r.type === 'vault') G.inter.push({ kind: 'vault', x: cx, y: cy, cost: 25 + sf * 10 });
    if (r.type === 'shop') { const sid = rollCards(0, 1)[0], pr = [25, 40, 60, 90];
      if (sid) G.inter.push({ kind: 'shop', what: 'shard', id: sid, price: pr[SHARD[sid].rar] + sf * 5, x: cx - 32, y: cy });
      G.inter.push({ kind: 'shop', what: 'heart', price: 15 + sf * 5, x: cx, y: cy });
      G.inter.push({ kind: 'shop', what: 'weapon', id: newWeapon(), price: 35 + sf * 5, x: cx + 32, y: cy });
      G.inter.push({ kind: 'shop', what: 'chip', id: choice(SKILL_IDS.filter(k => k !== p.skill && chipUnlocked(k))), price: 50 + sf * 5, x: cx, y: cy + 32 });
      if (!G.freeReroll) G.inter.push({ kind: 'shop', what: 'reroll', price: 1, hpCost: true, x: cx, y: cy - 32 }); }
    if (r.type === 'start' && ((fi === 0 && !G.endless) || diffV('wFloors'))) G.inter.push({ kind: 'weapon', id: newWeapon(fi === 0 && !G.endless ? BASIC_WEAPONS : null), x: cx + 30, y: cy });
    if (r.type === 'start' && sf > 0) for (let i = 0; i < 25; i++) G.picks.push({ kind: 'ink', x: cx, y: cy - 20, vx: rand(-80, 80), vy: rand(-80, 80), t: 0 });
    if (r.type === 'boss') { const dx = r.doors.reduce((a, d) => a + d[0], 0) / r.doors.length, dy = r.doors.reduce((a, d) => a + d[1], 0) / r.doors.length, ox = Math.sign(Math.round(dx) - r.cx) * (Math.abs(dx - r.cx) > Math.abs(dy - r.cy) ? 1 : 0), oy = Math.sign(Math.round(dy) - r.cy) * (Math.abs(dy - r.cy) >= Math.abs(dx - r.cx) ? 1 : 0);
      G.inter.push({ kind: 'seal', x: dx * T + 8 + ox * 18, y: dy * T + 8 + oy * 18, room: r }); }
  }
  if (sf > 0 && hasCurse('over') && !G.resuming) { const lost = Math.floor(G.ink / 2); G.ink -= lost; if (lost) G.later.push({ t: 1.2, f: () => notify(L('n_over', lost), CURSE_C) }); }
  G.resuming = false;
  if (AU.ctx) AU.setRoot(FLOORS[fi].root); AU.rootMul = FLOORS[fi].root; AU.setMode('calm');
  G.banner = { t: 3, big: chapterTitle(fi), small: '', c: FLOORS[fi].c() };
  saveRun();
}
// "Chapter X: Name" (Chinese and Japanese use numerals)
const CN_NUM = '一二三四五六七八九十';
function chapterTitle(fi, depth) { const nm = tr(FLOORS[fi].name), d = depth !== undefined ? depth : G && G.endless; if (d) return L('endlessCh', d, nm); return SET.lang === 'en' ? 'CHAPTER ' + (fi + 1) + ': ' + nm : '第' + CN_NUM[fi] + '章：' + nm; }
// every ink pickup passes through here: halved for everyone, then scaled by difficulty
const INK_RATE = .5;
function gainInk(n) { G.inkAcc = (G.inkAcc || 0) + n * INK_RATE * diffV('ink') * inkMul(); const w = Math.floor(G.inkAcc + 1e-9); G.inkAcc -= w; G.ink += w; return w; }

// ---- player ----
function hurtPlayer(dmg, sx, sy, mechHit, pierce) { if (typeof TST !== 'undefined' && TST.god) return;
  const p = G.p; if (!p.alive || p.inv > 0 || (p.dashT > 0 && !mechHit) || G.state !== 'play') return false;
  p.lastHit = 0; p.armorRegen = 0;
  const a = ang(sx, sy, p.x, p.y); p.vx += Math.cos(a) * 160; p.vy += Math.sin(a) * 160;
  if (!pierce && skillShieldHit()) return true;
  G.hits = (G.hits || 0) + 1;
  if (p.armor > 0 && !skillOn('risk') && !pierce) { p.armor--; if (p.armor === 0) onArmorBroken(p); p.inv = .6; AU.play('armor'); shake(.2, true); hitstop(.04, true); burst(p.x, p.y, 10, col(4), 100, .3); notify(L('n_armor'), col(4)); onPlayerHurt(true); return true; }
  p.hp -= dmg; p.inv = 1.1; AU.play('hurt'); shake(.5, true); hitstop(.1, true); flash(C.red, .4, true); chroma(1.2, true); burst(p.x, p.y, 18, C.red, 140, .5, 2);
  G.combo = 0; onPlayerHurt(false);
  if (p.hp <= 0 && skillOn('risk')) { p.hp = 1; AU.play('riskLock'); ringFx(p.x, p.y, 24, C.red, .4, 3); }
  if (p.hp <= 0) {
    // Resolve actual lethal health damage after armor, skill shields and Risk protection.
    if (ptnSaveLethalHit()) return true;
    if (G.S.phoenix && !p.phoenixUsed) { p.phoenixUsed = true; p.hp = hasCurse('drought') ? 1 : p.maxHp; p.inv = 2.5; AU.play('revive'); flash(C.orange, .6, true); slowmo(.25, 1);
      notify(L('n_revived'), C.orange); for (let i = 0; i < 3; i++) ringFx(p.x, p.y, 40 + i * 30, [C.orange, C.gold, col(5)][i], .6, 3); G.ebullets.length = 0;
      for (const e of G.enemies) if (!e.dead && dist(p.x, p.y, e.x, e.y) < 90) hitEnemy(e, 40 * G.S.dmg, { proc: 1, ka: ang(p.x, p.y, e.x, e.y), knock: 300, color: C.orange }); return true; }
    clearSave(); p.alive = false; p.hp = 0; G.state = 'dead'; G.endT = 0; finishRun(false); AU.play('death'); slowmo(.2, 1.5); splat(p.x, p.y, C.red, 40, 16); AU.setMode('calm');
  }
  return true;
}
function openPause(ret) { G.pauseRet = ret || 'play'; G.state = 'pause'; MENU.page = 'pause'; MENU.stack = []; MENU.sel = 0; MENU.t = 0; MENU.hy = 0; AU.play('menu'); }
function resumeFromPause() { G.state = G.pauseRet === 'cards' && G.cards ? 'cards' : 'play'; G.pauseRet = 'play'; }
function updatePlayer(dt) {
  if (!(dt > 0) || G.tpPause || G.state !== 'play') return;
  const p = G.p, S = G.S;
  p.inv -= dt; p.dashCd -= dt; p.cd -= dt; if (p.veilT > 0) p.veilT -= dt; if (p.reapT > 0) p.reapT -= dt; p.lastHit += dt; p.recoil *= Math.pow(.001, dt); if (p.anim) p.anim.t += dt; G.bgReloadT -= dt;
  p.veilClock = (p.veilClock || 0) + dt; p.veilStep = dt; p.veilCd = Math.max(0, (p.veilCd || 0) - dt);
  p.lean = lerp(p.lean, clamp(p.vx / 320 + (p.dashT > 0 ? p.dx * .25 : 0), -.3, .3), Math.min(1, dt * 12));
  const sx = p.x - G.cam.x, sy = p.y - G.cam.y; p.aim = Math.atan2(Input.my - sy, Input.mx - sx);
  if (!TOUCH.on && TOUCH.target && !TOUCH.target.dead) p.aim = ang(p.x, p.y, TOUCH.target.x, TOUCH.target.y); // PC aim assist
  let mx = (key('KeyD') || key('ArrowRight') ? 1 : 0) - (key('KeyA') || key('ArrowLeft') ? 1 : 0), my = (key('KeyS') || key('ArrowDown') ? 1 : 0) - (key('KeyW') || key('ArrowUp') ? 1 : 0);
  if (TOUCH.on && (TOUCH.jx || TOUCH.jy)) { mx = TOUCH.jx; my = TOUCH.jy; } // virtual joystick
  const analog = !mx && !my && (Input.padX || Input.padY);
  if (analog) { mx = Input.padX; my = Input.padY; }
  const ml = Math.hypot(mx, my); if (ml && (!analog || ml > 1)) { mx /= ml; my /= ml; }
  if (G.mechs && G.mechs.some(m => m.type === 'reverse' && m.t > m.on)) { mx = -mx; my = -my; }
  if (ml && hasCurse('tremor') && p.hp <= 3) { const j = Math.sin(G.time * 2.1) * .32 + Math.sin(G.time * 5.3 + 1) * .16, c2 = Math.cos(j), s2 = Math.sin(j); [mx, my] = [mx * c2 - my * s2, mx * s2 + my * c2]; }
  p.holdT = attackHeld() && !G.tpPause ? (p.holdT || 0) + dt : 0;
  const tile = tileAtPx(p.x, p.y), sl = tile === TL.SLUDGE ? .6 : 1;
  if (p.dashT > 0) {
    p.dashT -= dt; moveBody(p, p.dx * 330 * dt, p.dy * 330 * dt); trailTick(p);
    if (((p.dashT * 60) | 0) % 2 === 0) G.ghosts.push({ x: p.x, y: p.y, flip: Math.cos(p.aim) < 0, life: .25, c: buildTint() });
    if (p.dashT <= 0) { p.fly = false; if (tileAtPx(p.x, p.y) === TL.PIT) fallInPit(); else unstick(p); }
  } else {
    const spd = 92 * S.speed * sl * (p.charge > 0 ? .6 : 1) * (skillOn('dash') ? 1.4 : 1) * (p.aegisOn ? .65 : 1);
    p.vx = lerp(p.vx, mx * spd, Math.min(1, dt * 14)); p.vy = lerp(p.vy, my * spd, Math.min(1, dt * 14));
    moveBody(p, p.vx * dt, p.vy * dt);
    if (ml) { p.walkT += dt; if (((p.walkT * 7) | 0) !== (((p.walkT - dt) * 7) | 0)) { AU.play('step'); if (tile === TL.SLUDGE) burst(p.x, p.y + 4, 2, col(3), 30, .3); } }
    const cowed = hasCurse('coward') && p.armor <= 0 && p.maxArmor > 0;
    if ((pressed('Space') || Input.rclicked || pressed('ShiftLeft')) && cowed && p.dashCd <= 0) { AU.play('locked'); if ((G.cowT || 0) < G.time) { G.cowT = G.time + 2; notify(L('n_coward'), CURSE_C); } }
    if ((pressed('Space') || Input.rclicked || pressed('ShiftLeft')) && p.dashCd <= 0 && !G.tpPause && !cowed) {
      const dashLength = Math.hypot(mx, my) || 1;
      p.dashT = .16; p.dashCd = .55 * S.dashCd; p.fly = true; p.dx = ml ? mx / dashLength : Math.cos(p.aim); p.dy = ml ? my / dashLength : Math.sin(p.aim);
      AU.play('dash'); burst(p.x, p.y, 8, col(4), 60, .3);
      if (S.dashNova) dashNova(p);
      onDashAmmo(p); for (let i = 0; i < 6; i++) part({ x: p.x + rand(-3, 3), y: p.y + 4, vx: -p.dx * rand(20, 60) + rand(-20, 20), vy: rand(-20, 0), life: .35, max: .35, c: col(3), s: 2, drag: 3 });
      if (SYN.phantom) G.later.push({ t: .08, f: () => attack(p, WEAPONS[p.weapons[p.wi]], { ghost: true }) });
    }
  }
  if (p.dashT <= 0 && collides(p.x, p.y, p.r, false)) unstick(p);
  if (Math.abs(p.kx) + Math.abs(p.ky) > 4) { moveBody(p, p.kx * dt, p.ky * dt); const kk = Math.pow(.02, dt); p.kx *= kk; p.ky *= kk; } else p.kx = p.ky = 0;
  if (p.slowT > 0) { p.slowT -= dt; p.vx *= .5; p.vy *= .5; }
  const t2 = tileAtPx(p.x, p.y);
  if ((t2 === TL.FLOOR || t2 === TL.SLUDGE) && p.dashT <= 0) p.safe = { x: p.x, y: p.y };
  if (t2 === TL.SPIKE && spikeState() === 2 && p.dashT <= 0) hurtPlayer(1, p.x, p.y + 5);
  if (p.lastHit > 3 && p.armor < p.maxArmor && !skillOn('risk')) { p.armorRegen += dt * S.armorRegen / 1.1; if (p.armorRegen >= 1) { p.armorRegen = 0; p.armor++; AU.play('ui', 1.5); } }
  if (pressed('KeyX') || Input.wheel) { if (p.weapons.length > 1) { p.wi = 1 - p.wi; p.charge = 0; p.spin = 0; p.aegisOn = false; p.vacOn = false; p.flK = 0; AU.play('ui', .8); } }
  const w = WEAPONS[p.weapons[p.wi]];
  if (pressed('KeyR') && usesAmmo(w)) startReload(p, w.id);
  if (usesAmmo(w) && Input.clicked && ammoOf(p, w.id).rl > 0) AU.play('dry');
  if (G.state !== 'play') return;
  tryFire(p, w, dt, attackHeld() && !G.tpPause);
  if (G.state !== 'play') return;
  offhandTick(p, dt, attackHeld() && !G.tpPause);
  tickReloads(p, dt);
  updateOrbs(dt);
}
function unstick(p) {
  if (!collides(p.x, p.y, p.r, false)) return;
  const locked = WORLD.rooms.find(r => r.active), allowed = (x, y) => !locked || roomAt(x, y) === locked;
  const q = freeSpot(p.x, p.y, p.r, false, 48, allowed);
  if (q) { p.x = q[0]; p.y = q[1]; }
  else if (p.safe && allowed(p.safe.x, p.safe.y) && !collides(p.safe.x, p.safe.y, p.r, false)) { p.x = p.safe.x; p.y = p.safe.y; }
  else if (locked) { const tiles = roomFloorTiles(locked), t = tiles.find(([x, y]) => !collides(x * T + 8, y * T + 8, p.r, false)); if (t) { p.x = t[0] * T + 8; p.y = t[1] * T + 8; } }
}
function fallInPit() { const p = G.p; AU.play('fall'); p.inv = 0; p.dashT = 0; const ok = hurtPlayer(1, p.x, p.y, true, true); p.x = p.safe.x; p.y = p.safe.y; p.vx = p.vy = 0; p.inv = Math.max(p.inv, .8); notify(L('n_pit'), col(4)); }

// ---- rooms & waves ----
const ORB_CAP = 4; // shard orbs from room clears per floor (the rest pay out ink)
function makeWaves(r) {
  const fi = G.floor, sf = statFloor(), n = Math.min(4, 2 + (r.d > 2 ? 1 : 0) + (sf >= 1 ? 1 : 0)), waves = [];
  for (let w = 0; w < n; w++) { let budget = (4 + sf * 3 + r.d + w * 2) * diffV('wave') * (hasCurse('disaster') ? 1.2 : 1); const list = [];
    while (budget > 0 && list.length < 48) { const t = choice(POOLS[fi]), c = ETYPES[t].cost; if (!(c > 0) || (c > budget + .5 && list.length)) break; list.push({ t, elite: Math.random() < .03 + sf * .06 + r.d * .01 }); budget -= c; }
    waves.push(list); }
  return waves;
}
function lockRoom(r) { r.active = true; setDoors(r, true); AU.play('door'); shake(.2, true); for (const [x, y] of r.doors) burst(x * T + 8, y * T + 8, 4, col(4), 60, .3); }
function activateRoom(r) {
  lockRoom(r);
  if (r.type === 'boss') { G.state = 'bossintro'; G.introT = 0; spawnBoss(r); AU.setMode('boss'); AU.play('roar'); return; }
  r.waves = makeWaves(r); r.waveT = .3; r.actT = G.time; AU.setMode('fight');
}
function spawnWave(r) {
  const list = r.waves.shift(), all = roomFloorTiles(r).filter(([x, y]) => !trapDanger(x * T + 8, y * T + 8, 12)), tiles = all.filter(([x, y]) => dist(x * T + 8, y * T + 8, G.p.x, G.p.y) > 70);
  list.forEach((s, i) => G.later.push({ t: i * .07, f: () => { const [tx, ty] = choice(tiles.length ? tiles : all.length ? all : roomFloorTiles(r)); spawnEnemy(s.t, tx * T + 8, ty * T + 8, { elite: s.elite, room: r }); } }));
  r.waveT = .5 + list.length * .07;
  if (r.champ && !r.champDone) { r.champDone = true; G.later.push({ t: .3, f: () => spawnChamp(r) }); }
}
function unlockRoom(r) { r.active = false; r.cleared = true; setDoors(r, false); AU.play('door'); G.later.push({ t: .25, f: () => AU.play('clear') }); AU.setMode('calm'); slowmo(.3, .5); chroma(.5, true); for (const pk of G.picks) pk.magnet = true; }
function clearRoom(r) {
  unlockRoom(r);
  const cx = r.cx * T + 8, cy = r.cy * T + 8;
  if (!r.orb && G.floorOrbs < ORB_CAP) { r.orb = true; G.floorOrbs++; G.inter.push({ kind: 'prism', x: cx, y: cy, minRar: 0, born: G.time }); }
  else { for (let i = 0; i < 14 + statFloor() * 4; i++) G.picks.push({ kind: 'ink', x: cx, y: cy, vx: rand(-130, 130), vy: rand(-130, 130), t: 0, magnet: true }); }
  if (r.key) G.inter.push({ kind: 'key', x: cx + (r.orb ? 26 : 0), y: cy, born: G.time });
  if (Math.random() < .3) G.picks.push({ kind: 'heart', x: cx + 14, y: cy + 14, vx: 0, vy: 0, t: 0 });
  G.banner = { t: 1.4, big: L('clear'), small: G.combo > 5 ? L('comboX', G.combo) : L('silent'), c: col(5) };
}
// stepping well inside an uncleared room shuts its doors; true when it did. Also checked at every step of an instant move
// (the iai dash), which could otherwise carry you through a room between two frames without ever triggering it
function roomTrigger(p) {
  if (G.preview || p !== G.p || G.state !== 'play') return false;
  const r = roomAt(p.x, p.y); if (!r || r.cleared || r.active || (r.type !== 'combat' && r.type !== 'boss')) return false;
  // Seal as soon as the whole body clears the doorway, including wall-side tiles.
  if (p.x - p.r < (r.x0 + 1) * T || p.y - p.r < (r.y0 + 1) * T || p.x + p.r > (r.x0 + r.w - 1) * T || p.y + p.r > (r.y0 + r.h - 1) * T) return false;
  p.safe = { x: p.x, y: p.y };
  activateRoom(r); return true;
}
function updateRooms(dt) {
  const p = G.p, r = roomAt(p.x, p.y);
  if (r && !r.visited) r.visited = true;
  roomTrigger(p);
  if (G.state !== 'play') return;
  for (const rm of WORLD.rooms) if (rm.active && rm.type === 'combat') {
    rm.waveT -= dt;
    if (rm.waveT <= 0 && !G.enemies.some(e => !e.dead && e.room === rm)) { if (rm.waves.length) spawnWave(rm); else clearRoom(rm); }
  }
  // trial: survive a timed flood of foes
  if (G.trial) { const tr2 = G.trial; tr2.t -= dt; tr2.spawn -= dt;
    if (tr2.spawn <= 0 && tr2.t > 2) { tr2.spawn = Math.max(.7, 1.6 - (25 - tr2.t) * .03); if (G.enemies.filter(e => !e.dead).length < 9) { const all = roomFloorTiles(tr2.room), distant = all.filter(([x, y]) => dist(x * T + 8, y * T + 8, p.x, p.y) > 60), tiles = distant.length ? distant : all;
      for (let i = 0; tiles.length && i < randi(1, 2); i++) { const [tx, ty] = choice(tiles); spawnEnemy(choice(POOLS[G.floor]), tx * T + 8, ty * T + 8, { elite: Math.random() < .15, room: tr2.room, ink: 1 }); } } }
    if (tr2.t <= 0) { G.trial = null; for (const e of G.enemies) if (!e.dead) killEnemy(e, {}); unlockRoom(tr2.room);
      const cx = tr2.room.cx * T + 8, cy = tr2.room.cy * T + 8; G.inter.push({ kind: 'prism', x: cx, y: cy + 16, minRar: 1, born: G.time });
      for (let i = 0; i < 20; i++) G.picks.push({ kind: 'ink', x: cx, y: cy, vx: rand(-120, 120), vy: rand(-120, 120), t: 0, magnet: true });
      G.banner = { t: 1.8, big: L('trialDone'), small: L('comboX', G.comboMax), c: C.pink }; } }
  const br = WORLD.rooms.find(x => x.type === 'boss');
  if (br && br.active && G.bossDead && !G.enemies.some(e => !e.dead && e.room === br)) {
    br.active = false; br.cleared = true; setDoors(br, false); AU.setMode('calm');
    const cx = br.cx * T + 8, cy = br.cy * T + 8;
    G.later.push({ t: 1.6, f: () => { G.inter.push({ kind: 'prism', x: cx - 24, y: cy + 10, minRar: 2, born: G.time }); G.inter.push({ kind: 'portal', x: cx + 24, y: cy + 10, born: G.time }); if (G.floor === FLOORS.length - 1 && !G.endless && !(window.BOSS_TEST && BOSS_TEST.on)) G.inter.push({ kind: 'portal', endless: true, x: cx, y: cy + 46, born: G.time }); for (const pk of G.picks) pk.magnet = true; } });
  }
}

// ---- pickups & interactables ----
function updatePicks(dt) {
  const p = G.p; G.inkT -= dt; if (G.inkT <= 0) G.inkPitch = 0;
  for (let i = G.picks.length - 1; i >= 0; i--) { const k = G.picks[i]; k.t += dt;
    const d = dist(k.x, k.y, p.x, p.y);
    if (k.t > .45 && (d < 56 || k.magnet)) { const a = ang(k.x, k.y, p.x, p.y), s = 260 + k.t * 120; k.vx = lerp(k.vx, Math.cos(a) * s, Math.min(1, dt * 8)); k.vy = lerp(k.vy, Math.sin(a) * s, Math.min(1, dt * 8)); }
    else { k.vx *= Math.pow(.02, dt); k.vy *= Math.pow(.02, dt); }
    // free-flying drops bounce off walls; only the pull toward the hero may cross them
    const homing = k.t > .45 && (d < 56 || k.magnet), nx = k.x + k.vx * dt, ny = k.y + k.vy * dt;
    if (homing) { k.x = nx; k.y = ny; }
    else { if (!k.snapped && !dropFree(k.x, k.y, 2)) { snapFree(k, 2); k.snapped = true; }
      if (dropFree(nx, k.y, 2)) k.x = nx; else k.vx *= -.35; if (dropFree(k.x, ny, 2)) k.y = ny; else k.vy *= -.35; }
    if (d < 8 && k.t > .2) { G.picks.splice(i, 1);
      if (k.kind === 'ink') { gainInk(1); G.inkPitch = Math.min(G.inkPitch + .04, 1); G.inkT = .3; AU.play('ink', 1 + G.inkPitch); part({ x: p.x + rand(-4, 4), y: p.y - 6, vx: 0, vy: -30, life: .3, max: .3, c: col(5) }); }
      else if (k.kind === 'heart') { if (p.hp < p.maxHp && !hasCurse('drought')) { healPlayer(1); AU.play('heal'); notify(L('n_hp'), C.green); burst(p.x, p.y, 12, C.green, 80, .4); } else { const g = gainInk(5); AU.play('pickup'); notify(L('n_ink', g), col(5)); } } }
  }
}
// ---- keep dropped things on walkable floor (never inside a wall or out in the void) ----
const DROP_KINDS = new Set(['weapon', 'chip', 'key', 'prism', 'portal']);
function floorAt(x, y) { const t = tileAtPx(x, y); return t === TL.FLOOR || t === TL.SLUDGE || t === TL.SPIKE; }
function dropFree(x, y, r) { return floorAt(x, y) && floorAt(x - r, y) && floorAt(x + r, y) && floorAt(x, y - r) && floorAt(x, y + r); }
function snapFree(o, r) { if (dropFree(o.x, o.y, r)) return;
  for (let rad = 4; rad <= 96; rad += 4) for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, x = o.x + Math.cos(a) * rad, y = o.y + Math.sin(a) * rad;
    if (dropFree(x, y, r)) { o.x = x; o.y = y; if (o.vx !== undefined) { o.vx = 0; o.vy = 0; } return; } }
  if (G.p) { o.x = G.p.x; o.y = G.p.y; } }
// weapon offers: never one you are holding, and weapons that have not appeared yet this run come first
function newWeapon(pool) { const p = G.p, seen = G.seenW || (G.seenW = new Set());
  let c = (pool || WEAPON_IDS).filter(w => !p.weapons.includes(w) && wUnlocked(w)); if (!c.length) c = WEAPON_IDS.filter(w => !p.weapons.includes(w) && wUnlocked(w));
  const fresh = c.filter(w => !seen.has(w)), id = choice(fresh.length ? fresh : c); seen.add(id); return id; }
// ===== save: a snapshot of the run taken each time a floor is entered =====
// leaving the page mid-run lets the main menu offer CONTINUE, which rebuilds that floor with the state you entered it with
const SAVE_KEY = 'achroma_run';
let RESUMING = false;
function saveRun() {
  if (RESUMING || !G.p || (window.BOSS_TEST && BOSS_TEST.on)) return; const p = G.p;
  const s = { v: 1, at: Date.now(), floor: G.floor, diff: G.diff, hp: p.hp, armor: p.armor, weapons: p.weapons.slice(), wi: p.wi, wlv: Object.assign({}, p.wlv), shards: Object.assign({}, p.shards), meltVersion: p.shards.melt ? 2 : undefined,
    skill: p.skill || null, phoenixUsed: !!p.phoenixUsed, ink: G.ink, inkAcc: G.inkAcc || 0, rerolls: G.rerolls, curse: G.curse || 0, mhpLoss: G.mhpLoss || 0, ptn: G.ptn ? { id: G.ptn.id, cd: +G.ptn.cd.toFixed(1), sv: !!G.ptnSaved } : null, kills: G.kills, comboMax: G.comboMax, runT: G.runT, seenW: [...(G.seenW || [])], hits: G.hits || 0, freeReroll: !!G.freeReroll, diaN: G.diaN || 0, support: G.support || null, rid: G.rid, curses: (G.curses || []).slice(), bossPick: G.bossPick || null, endless: G.endless || 0, powCap: G.powCap || 0, buffs: G.buffs || {}, adrenAt: G.adrenAt || 0,
    squad: (G.squad || []).map(m => ({ id: m.id, wid: m.wid, hits: m.hits, away: !!m.away })), met: (G.met || []).slice(), campPick: G.campPick || null,
    assisted: !!G.assisted, clearRewarded: !!G.clearRewarded, proofGain: G.proofGain || 0, affGain: G.affGain || [],
    transition: Number.isInteger(G.nextFloor) ? { floor: G.nextFloor, curseDone: !!G.curseDone } : null };
  try { STORE.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { }
}
const saveNum = (v, fallback, min = 0, max = 1e9) => typeof v === 'number' && Number.isFinite(v) ? clamp(v, min, max) : fallback;
const saveList = v => Array.isArray(v) ? v : [];
function loadSave() { try {
  const s = JSON.parse(STORE.getItem(SAVE_KEY) || 'null');
  if (!s || s.v !== 1 || !Number.isInteger(s.floor) || !FLOORS[s.floor] || !Object.hasOwn(DIFF_BY, s.diff)) return null;
  s.weapons = [...new Set(saveList(s.weapons).filter(w => Object.hasOwn(WEAPONS, w)))].slice(0, 2); if (!s.weapons.length) s.weapons = ['nail'];
  s.wi = Math.floor(saveNum(s.wi, 0, 0, s.weapons.length - 1));
  const levels = (o, defs, cap) => { const out = {}; if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (Object.hasOwn(defs, k) && Number.isFinite(+v) && +v > 0) out[k] = clamp(Math.floor(+v), 1, cap || defs[k].max); return out; };
  s.wlv = levels(s.wlv, WEAPONS, 3); s.shards = levels(s.shards, SHARD);
  s.curses = [...new Set(saveList(s.curses).filter(c => Object.hasOwn(CURSE, c)))];
  s.squad = saveList(s.squad).filter(m => m && Object.hasOwn(SURV, m.id) && Object.hasOwn(WEAPONS, m.wid));
  s.met = saveList(s.met).filter(id => Object.hasOwn(SURV, id)); s.seenW = saveList(s.seenW).filter(id => Object.hasOwn(WEAPONS, id));
  for (const k of ['ink', 'inkAcc', 'rerolls', 'curse', 'kills', 'comboMax', 'runT', 'hits', 'powCap', 'adrenAt', 'proofGain']) s[k] = saveNum(s[k], 0);
  s.endless = Math.floor(saveNum(s.endless, 0, 0, 9999)); s.hp = saveNum(s.hp, 5, 1, 30); s.armor = saveNum(s.armor, 0, 0, 30);
  s.affGain = saveList(s.affGain).filter(a => Array.isArray(a) && Object.hasOwn(SURV, a[0]) && Number.isFinite(a[1]));
  s.skill = Object.hasOwn(SKILLS, s.skill) ? s.skill : null;
  s.rid = typeof s.rid === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(s.rid) ? s.rid : null;
  s.campPick = Object.hasOwn(SURV, s.campPick) ? s.campPick : null;
  s.squad = s.squad.filter((m, i, a) => a.findIndex(n => n.id === m.id) === i);
  s.buffs = { resolve: !!(s.buffs && s.buffs.resolve), adren: !!(s.buffs && s.buffs.adren) };
  s.bossPick = s.bossPick && typeof s.bossPick === 'object' ? { alt: !!s.bossPick.alt, v: !!s.bossPick.v } : null;
  s.transition = s.transition && Number.isInteger(s.transition.floor) && FLOORS[s.transition.floor] ? { floor: s.transition.floor, curseDone: !!s.transition.curseDone } : null;
  return s;
} catch (e) { return null; } }
function clearSave() { if (window.BOSS_TEST && BOSS_TEST.on) return; try { STORE.removeItem(SAVE_KEY); } catch (e) { } }
function markAssisted() { if (G.assisted) return; G.assisted = true; const s = loadSave(); if (s && s.rid === G.rid) { s.assisted = true; STORE.setItem(SAVE_KEY, JSON.stringify(s)); } }
function resumeRun() {
  const s = loadSave(); if (!s) { newRun(); return; }
  RESUMING = true; try { newRun(); } finally { RESUMING = false; }
  G.diff = s.diff; const p = G.p;
  // only restore things that still exist in this version of the game
  p.weapons = s.weapons.filter(w => WEAPONS[w]); if (!p.weapons.length) p.weapons = ['nail']; p.wi = Math.min(s.wi || 0, p.weapons.length - 1);
  p.wlv = {}; for (const k in s.wlv || {}) if (WEAPONS[k]) p.wlv[k] = s.wlv[k];
  p.shards = {}; for (const k in s.shards || {}) if (SHARD[k]) p.shards[k] = s.shards[k];
  p.skill = s.skill && SKILLS[s.skill] ? s.skill : null; p.skillCd = 0; p.phoenixUsed = !!s.phoenixUsed; p.ammo = {};
  recomputeStats(); computeTints(); p.hp = clamp(s.hp, 1, p.maxHp); p.armor = clamp(s.armor, 0, p.maxArmor);
  Object.assign(G, { support: SUP_KINDS.includes(s.support) ? s.support : null, diaN: s.diaN || 0, ink: s.ink || 0, inkAcc: s.inkAcc || 0, rerolls: s.rerolls || 0, curse: s.curse || 0, mhpLoss: Math.max(0, s.mhpLoss | 0), kills: s.kills || 0, comboMax: s.comboMax || 0, runT: s.runT || 0, seenW: new Set(s.seenW || p.weapons), hits: s.hits || 0, freeReroll: !!s.freeReroll, rid: s.rid || G.rid, curses: (s.curses || []).filter(c => CURSE[c]), resuming: true, bossPick: s.bossPick || null, resumePick: !!s.bossPick, endless: s.endless | 0, powCap: +s.powCap || 0, buffs: s.buffs && typeof s.buffs === 'object' ? s.buffs : {}, adrenAt: s.adrenAt || 0,
    squad: s.squad.map(m => mkMate(m.id, m.wid, saveNum(m.hits, 0, 0, 60), m.away)), met: s.met, campResume: s.campPick || null,
    assisted: !!s.assisted, clearRewarded: !!s.clearRewarded || s.endless > 0, proofGain: s.proofGain, affGain: s.affGain });
  recomputeStats(); if (G.endless && !G.powCap) G.powCap = powerScale(); // saves from before the cap existed
  // Older osteolysis saves had no armor. Grant the replacement conversion once,
  // after curses/HP costs are restored, before enterFloor writes the new checkpoint.
  if (G.S.melt && s.meltVersion !== 2 && G.mode !== 'invade') p.armor = Math.min(p.maxArmor, p.armor + p.meltArmor);
  for (const w of p.weapons) G.seenW.add(w);
  enterFloor(s.floor);
  if (s.transition) { G.nextFloor = s.transition.floor; G.curseDone = s.transition.curseDone; G.transT = 0; G.transDone = false; G.state = 'trans'; saveRun(); }
}
// the run is over: freeze its numbers into a result, then upload it (cleared runs only)
function finishRun(win) { if (G.result) return; try { if (win) girlsOnClear(); G.result = buildResult(win); submitResult(G.result); } catch (e) { console.error('[achroma] result', e); } finishRunReset(); }
function continueRun() { if (!loadSave()) return; LAUNCH.fn = resumeRun; launchRun(); }
function pay(cost) { if (G.ink >= cost) { G.ink -= cost; return true; } AU.play('ui', .5); notify(L('n_noInk'), C.red); return false; }
function giveWeapon(id, x, y) { codexMark('w:' + id); const p = G.p; if (p.weapons.length < wCap()) { p.weapons.push(id); p.wi = 1; } else { G.inter.push({ kind: 'weapon', id: p.weapons[p.wi], x, y }); p.weapons[p.wi] = id; } p.charge = 0; p.spin = 0; }
function updateInter(dt) {
  const p = G.p; G.prompt = null; const E = pressed('KeyE');
  for (const it of G.inter) if (!it.snapped && DROP_KINDS.has(it.kind)) { snapFree(it, 6); it.snapped = true; }
  for (let i = G.inter.length - 1; i >= 0; i--) { const it = G.inter[i], d = dist(p.x, p.y, it.x, it.y);
    if (it.kind === 'prism') { if (d < 13 && G.time - (it.born || 0) > .9) { G.inter.splice(i, 1); G.orbOpen = { x: it.x, y: it.y, t: 0, minRar: it.minRar, title: it.minRar >= 2 ? 'trophy' : 'choose' }; G.state = 'orbopen'; AU.play('orbOpen'); slowmo(1, 0); return; } continue; }
    if (it.kind === 'wreck') { if (!G.wreck || G.time < it.born) continue; if (d < 26) { G.prompt = { x: it.x, y: it.y, t: L('interact'), c: col(5) }; if (E) { G.inter.splice(i, 1); startReform(); return; } } continue; }
    if (it.kind === 'chest') { if (it.used || d > 24) continue; G.prompt = { x: it.x, y: it.y, t: L(it.weapon ? 'wChestOpen' : 'chestOpen'), sub: L(it.weapon ? 'wChestSub' : 'chestSub'), c: it.weapon ? C.cyan : C.gold };
      if (E) { it.used = true; AU.play('chestOpen'); shake(.15, true); const cc = it.weapon ? C.cyan : C.gold; burst(it.x, it.y - 6, 30, cc, 140, .6, 2); ringFx(it.x, it.y, 30, cc, .4, 2); const r = it.weapon ? .3 : Math.random();
        if (r < .25) G.later.push({ t: .45, f: () => openCards(0, 'choose') });
        else if (r < .5) G.inter.push({ kind: 'weapon', id: newWeapon(), x: it.x, y: it.y + 26 });
        else G.inter.push({ kind: 'chip', id: choice(chipPool()), x: it.x, y: it.y + 26, born: G.time }); } continue; }
    if (it.kind === 'chip') { if (d > 22 || G.time - (it.born || 0) < .4) continue; G.prompt = { x: it.x, y: it.y, t: L('install', SKILLS[it.id].nm), sub: L('skillChip'), c: SKILLS[it.id].c(), chip: it.id };
      if (E) { G.inter.splice(i, 1); installChip(it.id, it.x, it.y); } continue; }
    if (it.kind === 'key') { if (d < 12 && G.time - it.born > .6) { G.inter.splice(i, 1); G.hasKey = true; AU.play('key'); flash(C.gold, .3, true); burst(it.x, it.y, 24, C.gold, 120, .5); notify(L('n_key'), C.gold); } continue; }
    if (it.kind === 'seal') { if (!WORLD.bossLocked) { G.inter.splice(i, 1); continue; } if (d > 34) continue;
      if (G.hasKey) { WORLD.bossLocked = false; G.hasKey = false; setDoors(it.room, false); G.inter.splice(i, 1); AU.play('unlock'); shake(.3, true); flash(C.gold, .35, true); chroma(.6, true);
        for (const [dx, dy] of it.room.doors) burst(dx * T + 8, dy * T + 8, 10, C.gold, 120, .5, 2); ringFx(it.x, it.y, 40, C.gold, .5, 3); notify(L('n_seal'), C.gold); continue; }
      if (!G.prompt) G.prompt = { x: it.x, y: it.y, t: L('locked'), sub: L('keySub'), c: C.red, noKey: true }; if (!it.buzz || G.time - it.buzz > 1.5) { it.buzz = G.time; AU.play('locked'); } continue; }
    if (d > 22 || G.prompt) continue;
    if (it.kind === 'weapon') { G.prompt = { x: it.x, y: it.y, t: L('take', wname(it.id)), weapon: it.id, c: C.gold };
      if (E) { codexMark('w:' + it.id); AU.play('pickup'); burst(it.x, it.y, 16, col(5), 100, .4); if (p.weapons.length < wCap()) { p.weapons.push(it.id); p.wi = 1; G.inter.splice(i, 1); } else { const old = p.weapons[p.wi]; p.weapons[p.wi] = it.id; it.id = old; } p.charge = 0; p.spin = 0; notify(L('n_equip', wname(p.weapons[p.wi])), col(5)); } }
    else if (it.kind === 'camp' && !it.used && (G.squad || []).length) { G.prompt = { x: it.x, y: it.y - 4, t: L('cp_rest'), sub: L('cp_restSub'), c: C.orange }; if (E) campRest(it); }
    else if (it.kind === 'survivor') { G.prompt = { x: it.x, y: it.y - 4, t: L('sq_talk', svName(it.id)), sub: L('sq_survivor'), c: SURV[it.id].c }; if (E) { startTalk(it); return; } }
    else if (it.kind === 'soldier') { const gone = it.room && it.room.supUsed; G.prompt = { x: it.x, y: it.y - 8, t: L('sup_talk'), sub: gone ? L('sup_gone') : supName(it.sup), c: '#8fa77e' }; if (E) { if (gone) { notify(L('sup_gone'), col(4)); AU.play('locked'); } else { openBarracksTalk(it); return; } } }
    else if (it.kind === 'dialysis') { G.prompt = { x: it.x, y: it.y, t: L('dia'), sub: L('diaSub2', diaCost(0), diaCost(1)), c: '#a4cfe0' }; if (E) openDialysis(); }
    else if (it.kind === 'fount') { G.prompt = { x: it.x, y: it.y, t: it.used ? L('dry') : L('fount', it.cost), sub: it.used ? '' : L('fountSub'), c: C.green };
      if (E && !it.used) { if (hasCurse('drought')) notify(L('n_drought'), CURSE_C); else if (p.hp >= p.maxHp) notify(L('n_whole'), C.red); else if (pay(it.cost)) { healPlayer(2); it.used = true; AU.play('heal'); burst(p.x, p.y, 20, C.green, 100, .5); } } }
    else if (it.kind === 'altar') { G.prompt = { x: it.x, y: it.y, t: it.used ? L('spent') : L('pact'), sub: it.used ? '' : L('pactSub'), c: C.red };
      if (E && !it.used) { if (p.hp > 1) { p.hp--; it.used = true; flash(C.red, .4, true); AU.play('hurt'); G.later.push({ t: .35, f: () => openCards(1, 'pact') }); } else { AU.play('ui', .5); notify(L('n_weak'), C.red); } } }
    else if (it.kind === 'shop') { if (it.sold) { G.prompt = { x: it.x, y: it.y, t: L('sold'), c: col(3) }; continue; }
      if (it.what === 'reroll') { if (G.freeReroll) { G.prompt = { x: it.x, y: it.y, t: L('rrHeld'), c: col(3) }; continue; }
        G.prompt = { x: it.x, y: it.y, t: L('buy', L('rrItem')), sub: L('rrSub'), c: C.gold };
        if (E) { if (p.hp <= 1) { AU.play('ui', .5); notify(L('n_weak2'), C.red); } else { p.hp--; it.sold = true; G.freeReroll = true; AU.play('shop'); AU.play('hurt'); flash(C.red, .25, true); burst(it.x, it.y, 18, C.gold, 100, .4); notify(L('n_rrGot'), C.gold); } } continue; }
      const name = it.what === 'shard' ? sname(SHARD[it.id]) : it.what === 'heart' ? L('heartItem') : it.what === 'chip' ? SKILLS[it.id].nm : wname(it.id);
      G.prompt = { x: it.x, y: it.y, t: L('buy', name), sub: L('price', priceOf(it)), c: C.green, weapon: it.what === 'weapon' ? it.id : null, shard: it.what === 'shard' ? it.id : null };
      if (it.what === 'shard' && (p.shards[it.id] || 0) >= SHARD[it.id].max) { G.prompt.sub = L('b_max'); G.prompt.c = '#8e877b'; if (E) AU.play('locked'); continue; }
      if (E && it.what === 'heart' && hasCurse('drought')) { notify(L('n_drought'), CURSE_C); continue; }
      if (E && pay(priceOf(it))) { it.sold = true; AU.play('shop'); burst(it.x, it.y, 18, C.green, 100, .4);
        if (it.what === 'shard') applyShard(it.id);
        else if (it.what === 'heart') { healPlayer(2); AU.play('heal'); }
        else if (it.what === 'chip') installChip(it.id, it.x, it.y);
        else giveWeapon(it.id, it.x, it.y + 22); } }
    else if (it.kind === 'forge') { const wid = p.weapons[p.wi], lv = p.wlv[wid] || 0, cost = 30 + lv * 25;
      G.prompt = { x: it.x, y: it.y, t: lv >= 3 ? L('forgeMax') : L('forge', wname(wid), cost), sub: L('forgeSub'), c: C.orange };
      if (E && lv < 3 && pay(cost)) { p.wlv[wid] = lv + 1; AU.play('forge'); shake(.2, true); flash(C.orange, .3, true); burst(it.x, it.y - 6, 30, C.orange, 150, .6, 2); ringFx(p.x, p.y, 40, C.orange, .5, 3); notify(L('n_awaken', wname(wid), lv + 1), C.orange); } }
    else if (it.kind === 'totem') { if (it.used) continue; G.prompt = { x: it.x, y: it.y, t: L('trialStart'), sub: L('trialSub', 25), c: C.pink };
      if (E) { it.used = true; lockRoom(it.room); it.room.cleared = false; G.trial = { t: 25, spawn: .5, room: it.room }; AU.setMode('fight'); AU.play('roar'); } }
    else if (it.kind === 'idol') { if (it.used) continue; G.prompt = { x: it.x, y: it.y, t: L('idol'), sub: L('idolSub'), c: C.violet };
      if (E) { it.used = true; G.curse++; AU.play('curse'); flash(C.violet, .5, true); chroma(1, true); G.later.push({ t: .5, f: () => openCards(2, 'cursedGift') }); } }
    else if (it.kind === 'vault') { if (it.used) continue; G.prompt = { x: it.x, y: it.y, t: L('vault'), sub: L('vaultSub', it.cost), c: C.cyan };
      if (E && pay(it.cost)) { it.used = true; AU.play('shop'); shake(.15, true); burst(it.x, it.y, 30, C.cyan, 140, .6, 2); const r = Math.random();
        if (r < .4) G.later.push({ t: .3, f: () => openCards(1, 'choose') });
        else if (r < .6) G.inter.push({ kind: 'chip', id: choice(chipPool()), x: it.x, y: it.y + 24, born: G.time });
        else if (r < .8) G.inter.push({ kind: 'weapon', id: newWeapon(), x: it.x, y: it.y + 24 });
        // the ink hoard: always worth more than the vault cost (paid straight to you, not scaled by ink rates), plus a heart that flies to you
        else { const full = p.hp >= p.maxHp || hasCurse('drought'), g = Math.round(it.cost * 1.8) + (full ? Math.round(it.cost * .4) : 0); G.ink += g; AU.play('pickup'); AU.play('chestOpen');
          notify(L('n_vault', g), C.cyan); floatText(it.x, it.y - 16, '+' + g, C.cyan, 2, 1.2); for (let k = 0; k < 24; k++) part({ t: 'conv', tf: () => [G.p.x, G.p.y], tx: p.x, ty: p.y, a: rand(0, 6.28), r: rand(10, 30), x: it.x, y: it.y, life: .5, max: .5, c: col(5), s: 1 });
          if (!full) G.picks.push({ kind: 'heart', x: it.x, y: it.y + 10, vx: 0, vy: 0, t: .5, magnet: true }); } } }
    else if (it.kind === 'portal' && it.endless && G.time - it.born > .5) { G.prompt = { x: it.x, y: it.y, t: L('endlessGo'), sub: L('endlessSub'), c: C.red };
      if (E) startEndless(); }
    else if (it.kind === 'portal' && G.time - it.born > .5) { const last = G.floor === FLOORS.length - 1 && !G.endless; G.prompt = { x: it.x, y: it.y, t: last ? L('ascend') : L('descend'), sub: last ? L('bringHome') : G.endless ? L('endlessShort', G.endless + 1) : chapterTitle(G.floor + 1), c: buildTint() };
      if (E) { if (last) { clearSave(); G.state = 'win'; G.endT = 0; AU.play('win'); finishRun(true); if (!SET.cleared && !(window.BOSS_TEST && BOSS_TEST.on)) { SET.cleared = true; saveSettings(); G.newUnlock = true; } } else { if (G.endless) G.endless++; beginFloorTransition(G.endless ? endlessFloor() : G.floor + 1); } } }
  }
}
// the reward: a serum injector that forms out of blood drawn in across the floor; the glass fills as it forms, then it beats like a heart
const ORB_CS = [C.red, C.orange, C.gold, C.green, C.cyan, C.violet, C.pink];
const BLOOD = ['#3a0a0e', '#5a0e14', '#8a1820', '#b8262e', '#e0483e'];
function bloodPool(x, y, r, a) { if (r < 1) return; ctx.globalAlpha = a; for (let j = -2; j <= 2; j++) { const w = Math.round(r * Math.sqrt(1 - (j / 2.6) * (j / 2.6))); rect(x - w, y + j, w * 2, 1, BLOOD[0]); }
  for (let j = -1; j <= 1; j++) { const w = Math.round(r * .62 * Math.sqrt(1 - (j / 1.8) * (j / 1.8))); rect(x - w - 1, y + j, w * 2, 1, BLOOD[1]); } rect(x - Math.round(r * .4), y - 1, 2, 1, BLOOD[3]); ctx.globalAlpha = 1; }
function drawPrismOrb(it, x, y, t) {
  const age = G.time - (it.born || -9), k = clamp(age / .9, 0, 1), lvl = it.minRar || 0, beat = Math.pow(Math.max(0, Math.sin(t * 5.2)), 10);
  const bob = Math.round(Math.sin(t * 2.4) * 1.5 * k), cy = y - 10 + bob, hal = lvl >= 2 ? C.gold : lvl >= 1 ? C.cyan : BLOOD[3];
  // its arrival: a column of red light slams down from above the screen, the floor shakes, three shockwaves, blood thrown up and pulled back in
  if (!it.landed && age >= .12) { it.landed = true; shake(.18, true); flash('#b8262e', .18, true); AU.play('orbBurst', 1.1); AU.play('select', 1.3, .7);
    burst(it.x, it.y, 34, BLOOD[3], 190, .7, 2, { grav: 260 }); burst(it.x, it.y, 18, '#ffd0c0', 130, .4, 1); for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283; part({ x: it.x, y: it.y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 160, life: .3, max: .3, c: '#ffb0a0', t: 'spark', drag: 4 }); }
    splat(it.x, it.y + 2, '#3a0a0e', 26, 16); }
  if (age < 1.6) { const q = clamp(age / 1.6, 0, 1), drop = clamp(age / .12, 0, 1), w = Math.max(1, 22 * (1 - q) * (1 + Math.sin(t * 40) * .12)), by = (y + 4) * drop;
    ctx.globalAlpha = .28 * (1 - q * .5); rect(x - w * 1.8, 0, w * 3.6, by, '#5a0e14'); ctx.globalAlpha = .55 * (1 - q * .4); rect(x - w, 0, w * 2, by, '#b8262e'); ctx.globalAlpha = .95 * (1 - q); rect(x - w / 3, 0, Math.max(1, w * .66), by, '#ffd0c0'); ctx.globalAlpha = 1;
    if (drop >= 1) { ctx.globalAlpha = .6 * (1 - q); disc(x, y + 4, 10 + 20 * easeOut(Math.min(1, age * 3)), '#ffb0a0'); ctx.globalAlpha = 1; }
    for (let i = 0; i < 3; i++) { const qq = clamp((age - .12 - i * .14) / .75, 0, 1); if (qq > 0 && qq < 1) { ctx.globalAlpha = 1 - qq; ringC(x, y + 4, 6 + qq * (60 + i * 14), i === 1 ? '#ffd0c0' : i ? '#e0483e' : '#ffb070', 1); ringC(x, y + 4, 5 + qq * (60 + i * 14), '#5a0e14', 1); ctx.globalAlpha = 1; } }
    for (let i = 0; i < 10; i++) { const a = i * .628 + t * 3, rr = 30 * (1 - q) + 6; rect(Math.round(x + Math.cos(a) * rr), Math.round(cy + Math.sin(a) * rr * .6), 2, 2, i % 2 ? '#ffb0a0' : BLOOD[3]); } }
  // a soft glow and a slow halo on the floor, so it reads from across the room
  { const pu = .5 + Math.sin(t * 3) * .5; ctx.globalAlpha = .14 + pu * .1; disc(x, y - 6, 22, BLOOD[3]); ctx.globalAlpha = .5 + pu * .3; ringC(x, y + 4, 15 + pu * 3, hal === BLOOD[3] ? '#e0483e' : hal, 1); ctx.globalAlpha = 1; }
  // the pool it rises from
  bloodPool(x, y + 4, 4 + 7 * easeOut(Math.min(1, age / .5)) + beat, .9);
  // blood crawling in from all around while it forms: spiralling drops with short trails
  if (k < 1) for (let i = 0; i < 16; i++) { const q = clamp((age - (i % 8) * .035) / .62, 0, 1); if (q >= 1) continue;
    const a0 = i * 2.4 + (it.x | 0), R0 = 30 + (i % 4) * 7; for (let j = 3; j >= 0; j--) { const qq = Math.max(0, q - j * .05), r = R0 * (1 - qq * qq), a = a0 + qq * 2.2;
      rect(Math.round(x + Math.cos(a) * r), Math.round(cy + 6 + Math.sin(a) * r * .55), j ? 1 : 2, j ? 1 : 2, BLOOD[j ? 4 - j : 4]); } }
  // the heartbeat glow
  ctx.globalAlpha = (.1 + beat * .2) * k; disc(x, cy, 10 + beat * 3, BLOOD[3]); ctx.globalAlpha = 1;
  if (lvl) { ctx.globalAlpha = .5 + beat * .4; ringC(x, y + 4, 12 + beat * 2, hal, 1); ctx.globalAlpha = 1; }
  // the injector: plunger, collar, a glass barrel that fills from the bottom, the needle
  const O = col(0), fill = Math.round(10 * easeOut(clamp((age - .25) / .65, 0, 1)) * (.86 + Math.sin(t * 3) * .04));
  rect(x - 3, cy - 13, 7, 2, O); rect(x - 1, cy - 12, 3, 5, O); rect(x - 4, cy - 8, 9, 3, O); rect(x - 4, cy - 6, 9, 13, O); rect(x - 2, cy + 7, 5, 2, O); rect(x - 1, cy + 9, 3, 4, O);
  rect(x - 2, cy - 12, 5, 1, col(4)); rect(x, cy - 11, 1, 4, col(3)); rect(x - 3, cy - 7, 7, 1, col(4)); rect(x - 3, cy - 6, 7, 1, col(3));
  rect(x - 3, cy - 5, 7, 11, '#141010');
  if (fill > 0) { rect(x - 3, cy + 6 - fill, 7, fill, BLOOD[2]); rect(x + 1, cy + 6 - fill, 2, fill, BLOOD[1]); rect(x - 3, cy + 6 - fill, 7, 1, beat > .3 ? BLOOD[4] : BLOOD[3]); }
  ctx.globalAlpha = .55; rect(x - 2, cy - 4, 1, 9, col(5)); ctx.globalAlpha = 1; for (let i = 0; i < 3; i++) rect(x + 2, cy - 3 + i * 3, 1, 1, col(4));
  rect(x - 1, cy + 7, 3, 1, col(3)); rect(x, cy + 8, 1, 4, col(5));
  if (lvl >= 2) { rect(x - 4, cy - 8, 1, 1, C.gold); rect(x + 4, cy - 8, 1, 1, C.gold); }
  // a marker bobbing above it
  if (k >= 1) { const my = Math.round(cy - 24 + Math.sin(t * 4) * 2), mc = lvl >= 2 ? C.gold : '#e0483e'; for (let i = 0; i < 4; i++) rect(x - 3 + i, my + i, 7 - i * 2, 1, mc); rect(x - 4, my - 1, 9, 1, col(0)); }
  // a drop now and then from the needle, and blood still being drawn in
  if (k >= 1 && Math.random() < .06) part({ x: it.x, y: it.y - 10 + bob + 12, vx: 0, vy: 8, life: .45, max: .45, c: BLOOD[2], grav: 220 });
  if (k >= 1 && Math.random() < .25) { const a = rand(0, 6.28), r = rand(18, 30); part({ t: 'conv', tf: () => [it.x, it.y - 6], tx: it.x, ty: it.y - 6, a, r, x: it.x + Math.cos(a) * r, y: it.y - 6 + Math.sin(a) * r * .6, life: .6, max: .6, c: choice([BLOOD[2], BLOOD[3]]), s: 1 }); }
}
function pedestal(x, y) { drawStall(x, y); }
function drawInter(cx, cy) {
  const t = G.time;
  for (const it of G.inter) { const x = it.x - cx, y = it.y - cy;
    if (it.kind === 'prism') drawPrismOrb(it, x, y, t);
    else if (it.kind === 'weapon') { pedestal(x, y); const s = sprite('w_' + it.id, WEAPONS[it.id].spr); drawSprite(s, x, y - 4 + Math.sin(t * 3) * 1.5, false, false); if (((t * 2) | 0) % 2) rect(x - 1, y - 12, 2, 2, C.gold); }
    else if (it.kind === 'fount') drawPurifier(it, x, y, t);
    else if (it.kind === 'dialysis') drawDialysis(it, x, y, t);
    else if (it.kind === 'soldier') drawSoldier(it, x, y, t);
    else if (it.kind === 'asset') drawAsset(it, x, y, t);
    else if (it.kind === 'deco') drawDeco(it, x, y, t);
    else if (it.kind === 'altar') drawDrawStation(it, x, y, t);
    else if (it.kind === 'portal') { ctx.globalAlpha = .5; disc(x, y, 16 + Math.sin(t * 2) * 1.5, '#2a0e08'); ctx.globalAlpha = 1; for (let i = 0; i < 3; i++) ringC(x, y, 14 - i * 2 + Math.sin(t * 3 + i) * .5, i ? col(2) : '#6a3a22', 1); disc(x, y, 10, col(0)); ctx.globalAlpha = .35 + Math.sin(t * 3) * .15; disc(x, y + 1, 6, '#d0702e'); ctx.globalAlpha = 1; disc(x, y + 1, 2 + Math.sin(t * 6) * .5, '#ffa45a');
      if (Math.random() < .3) part({ x: it.x + rand(-6, 6), y: it.y, vx: rand(-4, 4), vy: rand(-30, -14), life: .9, max: .9, c: choice(['#d0702e', '#ffa45a', '#5a3a2a']) }); }
    else if (it.kind === 'shop') { pedestal(x, y); if (it.sold) continue; const by = y - 5 + Math.sin(t * 3 + it.x) * 1.5;
      if (it.what === 'shard') { const s = SHARD[it.id]; rect(x - 6, by - 6, 12, 12, col(0)); icon(s.icon, x - 4, by - 4, shardColor(s)); }
      else if (it.what === 'heart') { rect(x - 5, by - 4, 11, 9, col(0)); rect(x - 4, by - 3, 9, 7, '#d8d0c0'); rect(x - 4, by - 3, 9, 1, '#f0e8d8'); rect(x, by - 2, 1, 5, '#b8262e'); rect(x - 2, by, 5, 1, '#b8262e'); rect(x - 1, by - 5, 3, 1, col(3)); }
      else if (it.what === 'chip') drawChip(it, x, by + 4, t);
      else if (it.what === 'reroll') { ringC(x, by, 7 + Math.sin(t * 4) * .5, C.gold, 1); icon('reroll', x - 4, by - 4, C.gold); }
      else drawSprite(sprite('w_' + it.id, WEAPONS[it.id].spr), x, by, false, false); }
    else if (it.kind === 'forge') drawWorkbench(it, x, y, t);
    else if (it.kind === 'totem') drawAlarm(it, x, y, t);
    else if (it.kind === 'idol') drawVialCase(it, x, y, t);
    else if (it.kind === 'key') { const bob = Math.sin(t * 4) * 2; ringC(x, y + bob, 10 + Math.sin(t * 6), C.gold, 1); icon('key', x - 4, y - 4 + bob, C.gold); if (Math.random() < .3) part({ x: it.x + rand(-6, 6), y: it.y + rand(-6, 6), vx: 0, vy: -20, life: .5, max: .5, c: C.gold }); }
    else if (it.kind === 'seal') { const c2 = G.hasKey ? C.gold : C.red; ringC(x, y, 9 + Math.sin(t * 3), c2, 1); icon('lock', x - 4, y - 4, c2); }
    else if (it.kind === 'chest') drawChest(it, x, y, t);
    else if (it.kind === 'chip') drawChip(it, x, y, t);
    else if (it.kind === 'camp') drawCamp(it, x, y, t);
    else if (it.kind === 'survivor') drawSurvivorNPC(it, x, y, t);
    else if (it.kind === 'vault') drawSafe(it, x, y, t);
  }
}
function drawInterLabels(cx, cy) { for (const it of G.inter) if (it.kind === 'shop' && !it.sold) { const x = it.x - cx, y = it.y - cy + 14;
  if (it.hpCost) { if (G.freeReroll) continue; icon('heart', x - textW('1') / 2 - 7, y - 1, C.red); textS('1', x + 3, y, G.p.hp > 1 ? col(5) : C.red, 1, 'center'); continue; }
  const pr = priceOf(it); icon('ink', x - textW(String(pr)) / 2 - 5, y, C.green); textS(pr, x + 3, y, G.ink >= pr ? col(5) : C.red, 1, 'center'); } }
function drawShardTip(id) {
  const s = SHARD[id], x = TOUCH.on ? W / 2 - 79 : W - 166, y = TOUCH.on ? 4 : 84, ww = 158, lv = (G.p.shards[id] || 0) + 1, c = shardColor(s);
  const lines = wrapW(tr(s.d(lv)), ww - 12), hh = 44 + lines.length * lineH();
  rect(x + 3, y + 3, ww, hh, col(0)); box(x, y, ww, hh, col(1), c); rect(x, y, ww, 3, c);
  rect(x + 6, y + 8, 20, 20, col(0)); icon(s.icon, x + 8, y + 10, c, 2); textS(sname(s), x + 32, y + 9, col(5), 2); text(L(RAR[s.rar].k) + '  ' + tagName(s.tag), x + 32, y + 22, RAR[s.rar].c());
  lines.forEach((l, i) => text(l, x + 6, y + 36 + i * lineH(), col(4)));
}
function drawProps(cx, cy) {
  for (const p of WORLD.props) { if (p.dead) continue; const x = Math.round(p.x - cx), y = Math.round(p.y - cy), f = p.flash > 0;
    rect(x - 6, y + 4, 12, 3, col(0));
    if (p.kind === 'crate') { rect(x - 6, y - 6, 12, 12, f ? col(5) : col(3)); rect(x - 6, y - 6, 12, 1, col(4)); rect(x - 5, y - 5, 10, 10, f ? col(5) : col(2)); line(x - 5, y - 5, x + 5, y + 5, col(3)); line(x + 5, y - 5, x - 5, y + 5, col(3)); }
    else if (p.kind === 'gas') { rect(x - 4, y - 9, 8, 15, f ? col(5) : '#3d6b2a'); rect(x - 4, y - 9, 8, 2, '#5d9b3a'); rect(x - 2, y - 11, 4, 2, col(4)); rect(x - 4, y - 3, 8, 2, col(0)); rect(x - 1, y - 2, 2, 1, C.lime); rect(x + 2, y - 7, 1, 8, '#5d9b3a'); }
    else { rect(x - 5, y - 7, 10, 13, f ? col(5) : col(3)); rect(x - 5, y - 7, 10, 2, col(4)); rect(x - 5, y - 2, 10, 3, C.red); rect(x - 2, y - 1, 4, 1, col(5)); }
    p.flash -= 1 / 60; }
}
function weaponPose(p, w) {
  // returns weapon angle + forward offset from the current attack animation (melee swings, thrusts, recoil kicks...)
  let wa = p.aim, off = 2 - (p.recoil || 0); const an = p.anim, side = Math.cos(p.aim) < 0 ? -1 : 1;
  if (an && an.k === w.kind && an.t < an.dur + .06) { const k = clamp(an.t / an.dur, 0, 1), e = easeOut(k), sw = an.flip ? -1 : 1;
    switch (an.k) {
      case 'melee': wa = an.a + sw * side * lerp(-1.35, 1.35, e); off = 4; break;
      case 'thrust': wa = an.a; off = 2 + Math.sin(k * Math.PI) * 12; break;
      case 'spin': wa = an.a + sw * e * 6.283; off = 5; break;
      case 'whip': wa = an.a + side * lerp(-1.2, .45, e); off = 3; break;
      case 'slam': wa = an.a - side * lerp(2.5, 0, clamp(k * 1.7, 0, 1)); off = 3 + (k > .6 ? 2 : 0); break;
      case 'iai': wa = an.a + side * lerp(2, -.8, e); off = 4; break;
      case 'fist': wa = an.a; off = 2 + Math.sin(k * Math.PI) * (an.heavy ? 11 : 6); break;
      case 'reap': wa = an.a; off = 4; break;
      default: wa = p.aim; off = 2 - (p.recoil || 0); } }
  // the scythe is drawn back (and trembles) while charging
  if (w.kind === 'reap' && p.charge > 0 && !(an && an.t < an.dur)) { wa = p.aim - side * (1.3 + p.charge * .7) + Math.sin(G.time * 40) * .04 * p.charge; off = 2; }
  return { wa, off };
}
function drawPlayer(cx, cy) {
  const p = G.p; if (!p.alive) return;
  const foot = p.y + 4 - cy;
  for (const g of G.ghosts) { ctx.globalAlpha = Math.min(1, g.life / (g.max || .25)) * .6; drawChar(sprite('pg' + (g.key || ''), ghostRows(g.rows || PBODY.s.concat(PLEGS.dash)), g.c), g.x - cx, g.y + 4 - cy, g.flip, false, { noShadow: true }); } ctx.globalAlpha = 1;
  if (p.inv > 0 && p.dashT <= 0 && !(p.tpGlow > 0) && ((p.inv * 20) | 0) % 2) { shadow(p.x - cx, foot, 9); return; }
  const x = p.x - cx, sn = Math.sin(p.aim), dir = Math.abs(sn) > .72 ? (sn > 0 ? 'f' : 'b') : 's', flip = Math.cos(p.aim) < 0;
  const speed = Math.hypot(p.vx, p.vy), moving = speed > 10, dashing = p.dashT > 0;
  const fr = dashing ? 'd' : moving ? ((p.walkT * 10) | 0) % 4 : 0;
  const lift = dashing ? 2 : moving ? (fr % 2 ? 1 : 0) : 0, breathe = moving || dashing ? 1 : 1 + Math.max(0, Math.sin(G.time * 2.6)) * .06;
  const wid = p.weapons[p.wi], w = WEAPONS[wid], pose = weaponPose(p, w), grip = weaponGrip(p), hy = grip.y - cy;
  const drawW = () => { const ws = sprite('w_' + wid, w.spr), wf = Math.cos(pose.wa) < 0;
    if (w.kind === 'chakram' && G.bullets.some(b => b.kind === 'chakram')) return; // the disc is in flight
    ctx.save(); ctx.translate(grip.x - cx, hy); ctx.rotate(pose.wa); if (wf) ctx.scale(1, -1);
    ctx.drawImage(ws.n, pose.off, -Math.floor(ws.h / 2));
    // reload: the weapon absorbs color from back to front
    if (usesAmmo(w)) { const am = ammoOf(p, wid), tc = wAccent(w), tsp = sprite('wt_' + wid, ghostRows(w.spr), tc);
      if (am.rl > 0) { const k = 1 - am.rl / am.max; ctx.save(); ctx.beginPath(); ctx.rect(pose.off, -ws.h, Math.max(0, ws.w * k), ws.h * 2); ctx.clip(); ctx.globalAlpha = .9; ctx.drawImage(tsp.n, pose.off, -Math.floor(ws.h / 2)); ctx.restore();
        ctx.globalAlpha = 1; rect(pose.off + ws.w * k - .5, -Math.floor(ws.h / 2) - 1, 1, ws.h + 2, col(5)); }
      else if (am.flash > 0) { ctx.globalAlpha = am.flash / .35; ctx.drawImage(tsp.n, pose.off, -Math.floor(ws.h / 2)); }
      ctx.globalAlpha = 1; }
    ctx.restore();
    if (w.sight) { const m = weaponMuzzle(p, w); ctx.globalAlpha = .35; line(m.x - cx, m.y - cy, m.x - cx + Math.cos(p.aim) * 120, m.y - cy + Math.sin(p.aim) * 120, C.red, 1); ctx.globalAlpha = 1; }
    if (w.spin && p.spin > .8) rect(x + Math.cos(p.aim) * (4 + ws.w), hy + Math.sin(p.aim) * (4 + ws.w), 1, 1, C.orange);
    if (w.kind === 'bow' && p.charge > 0) { const k = p.charge, bx = x + Math.cos(p.aim) * 5, by = hy + Math.sin(p.aim) * 5; line(bx - Math.cos(p.aim) * 4 * k, by - Math.sin(p.aim) * 4 * k, bx + Math.cos(p.aim) * 10, by + Math.sin(p.aim) * 10, k >= 1 ? C.gold : col(5), 1);
      if (Math.random() < k * .6) part({ t: 'conv', tf: () => [p.x + Math.cos(p.aim) * 5, p.y - 2 + Math.sin(p.aim) * 5], tx: p.x, ty: p.y - 2, a: rand(0, 6.28), r: 14, x: p.x, y: p.y, life: .3, max: .3, c: k >= 1 ? C.gold : col(4) }); } };
  if (dir === 'b') drawW();
  const s = pSprite(dir, fr);
  drawChar(s, x, foot, dir === 's' ? flip : flip && dashing, p.inv > .9, { lift, shw: .75, rot: p.lean, sx: dashing ? 1.18 : 1, sy: dashing ? .88 : breathe });
  if (dir !== 'b') rect(Math.round(x) + (dir === 'f' ? (flip ? -1 : 1) : flip ? -2 : 2), Math.round(foot - lift) - 7, 1, 1, buildTint()); // eye glint carries your build color
  if (dir !== 'b') drawW();
  if (p.slowT > 0) ringC(x, foot - 6, 8, C.violet, 1);
  if (p.pol) { const pulse = ((G.time * 6) | 0) % 2; ringC(x, foot - 6, 9, p.pol, 1); rect(x - 2, foot - 20, 5, 4, col(0)); rect(x - 1, foot - 19, 3, 2, pulse ? p.pol : col(5)); }
  if (p.dashCd > 0) rect(x - 4, foot + 3, 8 * (1 - p.dashCd / (.55 * G.S.dashCd)), 1, col(4));
}
// ---- main update / render ----
// ---- fusion: synergy unlock cinematic (two element orbs spiral in and collide) ----
function updateFusion(rdt) {
  const f = G.fusion, p = G.p, sy = f.syn; f.t += rdt; updateParticles(rdt); updateFT(rdt);
  if (f.t > 1.1 && !f.hit) { f.hit = true; AU.play('fusionHit'); flash('#5a0e14', .45, true); shake(.45, true);
    for (let i = 0; i < 3; i++) ringFx(p.x, p.y, 40 + i * 50, i % 2 ? '#8a1820' : sy.c, .5 + i * .12, 2);
    burst(p.x, p.y, 60, '#8a1820', 240, 1, 2, { grav: 220 }); burst(p.x, p.y, 30, sy.c, 200, .7, 2); burst(p.x, p.y, 24, '#3a0a0e', 160, .9, 2, { grav: 260 });
    for (let i = 0; i < 30; i++) splat(p.x + rand(-70, 70), p.y + rand(-60, 60), i % 4 ? '#5a0e14' : sy.c, 6, 6);
    for (const e of G.enemies) if (!e.dead && e.spawnT <= 0 && dist(p.x, p.y, e.x, e.y) < 110) hitEnemy(e, 25 * G.S.dmg, { proc: 1, ka: ang(p.x, p.y, e.x, e.y), knock: 260, color: sy.c }); }
  if (f.t > 2.4) { G.fusion = null; G.state = 'play'; }
}
function update(rdt) {
  if (G.hintQ) { updateHintQ(rdt); return; }
  G.time += rdt;
  if (G.banner) { G.banner.t -= rdt; if (G.banner.t <= 0) G.banner = null; }
  if (G.state === 'cards') { updateCards(rdt); updateParticles(rdt * .2); return; }
  if (G.state === 'talk') { updateTalk(rdt); updateParticles(rdt); updateFT(rdt); return; }
  if (G.state === 'chat') { updateChat(rdt); return; }
  if (G.state === 'world') { updateWorld(rdt); return; }
  if (G.state === 'fusion') { updateFusion(rdt); return; }
  if (G.state === 'dialysis') { updateDialysis(rdt); updateParticles(rdt); return; }
  if (G.state === 'barracks') { updateBarracks(rdt); updateParticles(rdt); return; }
  if (G.state === 'test') { updateTest(rdt); return; }
  if (G.state === 'play' && testOn() && (pressed('F2') || pressed('Backquote'))) { openTest(); return; }
  if (G.state === 'reform') { updateReform(rdt); return; }
  if (G.state === 'orbopen') { const o = G.orbOpen; o.t += rdt; updateParticles(rdt); updateFT(rdt);
    if (o.t > .3 && !o.burst) { o.burst = true; const cs = [C.red, C.gold, C.cyan, C.violet, C.green, C.pink]; for (let i = 0; i < 40; i++) burst(o.x, o.y - 8, 1, choice(cs), 200, .7, 2); ringFx(o.x, o.y - 8, 40, col(5), .4, 3); flash(col(5), .25, true); AU.play('orbBurst'); }
    if (o.t > .8) { G.orbOpen = null; G.state = 'play'; openCards(o.minRar, o.title); if (G.cards) G.cards.fromOrb = true; } return; }
  if (G.state === 'play' && G.fusionQ.length && !G.fusion) { G.fusion = { syn: G.fusionQ.shift(), t: 0, hit: false }; G.state = 'fusion'; AU.play('fusionCharge'); return; }
  if (G.state === 'build') { updateBuild(rdt); return; }
  if (G.state === 'pause') { updateMenu(rdt); return; }
  if (G.state === 'dead' || G.state === 'win') { G.endT += rdt; updateParticles(rdt * .3); updateFT(rdt); updateEnd(rdt); return; }
  if (G.state === 'curse') { updateCurse(rdt); return; }
  if (G.state === 'trans') { G.transT += rdt; if (G.transT > 1 && !G.transDone && !G.curseDone) { G.transT = 1; openCurse(); return; } if (G.transT > 1 && !G.transDone) { G.transDone = true; enterFloor(Number.isInteger(G.nextFloor) ? G.nextFloor : G.endless ? endlessFloor() : G.floor + 1); } if (G.transT > 2.2) { G.state = 'play'; G.transDone = false; } return; }
  if (G.state === 'bossintro') { G.introT += rdt; updateParticles(rdt); if (G.introT > 3 || (G.introT > 1 && Input.clicked)) { G.state = 'play'; G.introT = 0; } return; }
  if (pressed('Escape')) { openPause('play'); return; }
  if (pressed('Tab')) { openBuild('play'); return; }
  if (pressed('KeyC') && G.squad && G.squad.length) { openChat('play'); return; }
  if (wcOn() && (pressed('KeyT') || (Input.clicked && !TOUCH.on && inR(WC_BTN(), Input.mx, Input.my)))) { Input.clicked = false; Input.down = false; openWorld('play'); return; }
  if (FX.hitstop > 0) { FX.hitstop -= rdt; return; }
  const dt = rdt * FX.slow;
  G.runT += rdt; G.muzzle -= dt; G.comboPop -= dt; G.bossDmgT = (G.bossDmgT || 0) - dt;
  if (G.combo > 0) { G.comboT -= dt; if (G.comboT <= 0) G.combo = 0; }
  const tpz = !!G.tpPause, pdt = tpz ? 0 : dt, wdt = tpz ? 0 : dt * (G.limit ? .2 : 1);
  // dt=0 still runs collision and ready-to-fire branches. Freeze the simulation
  // entirely; only the teleport timer and its UI may advance.
  if (tpz) { G.prompt = null; updateSkill(dt, 0); if (!G.tpPause) roomTrigger(G.p); return; }
  WORLD.spikeT += wdt;
  const due = []; for (let i = G.later.length - 1; i >= 0; i--) { const l = G.later[i]; l.t -= wdt; if (l.t <= 0) { G.later.splice(i, 1); due.push(l); } }
  for (let i = 0; i < due.length; i++) {
    due[i].f();
    if (G.state !== 'play') { G.later.push(...due.slice(i + 1)); return; }
  }
  for (let i = G.ghosts.length - 1; i >= 0; i--) { G.ghosts[i].life -= dt; if (G.ghosts[i].life <= 0) G.ghosts.splice(i, 1); }
  updatePlayer(pdt); if (G.state !== 'play') return;
  updateRooms(wdt); if (G.state !== 'play') return;
  adrenTick(); updateSquad(wdt); updateChatter(wdt); updateEnemies(wdt); updateSupport(wdt); if (G.state !== 'play') return;
  updateBullets(wdt); if (G.state !== 'play') return;
  weaveTick(); updateHazards(wdt); if (G.state !== 'play') return;
  updateTraps(wdt); if (G.state !== 'play') return;
  updateFields(wdt); updateAttackFx(wdt); updatePicks(pdt); updateInter(dt); if (G.state !== 'play') return;
  updateSkill(dt, wdt); updateParticles(wdt); updateFT(wdt);
  const p = G.p; const tx = p.x - W / 2 + (Input.mx - W / 2) * .22, ty = p.y - H / 2 + (Input.my - H / 2) * .22;
  G.cam.x = lerp(G.cam.x, tx, Math.min(1, rdt * 8)); G.cam.y = lerp(G.cam.y, ty, Math.min(1, rdt * 8));
}
let fogC = null;
function getFog() { if (fogC) return fogC; fogC = document.createElement('canvas'); fogC.width = W * 2; fogC.height = H * 2; const x = fogC.getContext('2d'); x.fillStyle = col(0);
  for (let j = 0; j < H * 2; j++) for (let i = 0; i < W * 2; i++) { const d = Math.hypot(i - W, (j - H) * 1.25), v = clamp((d - 70) / 90, 0, 1) * 16; if (v > BAYER[(j & 3) * 4 + (i & 3)]) x.fillRect(i, j, 1, 1); } return fogC; }
const chromaBuf = [document.createElement('canvas'), document.createElement('canvas')]; chromaBuf.forEach(c => { c.width = W; c.height = H; });
RELAYOUT.push(() => { fogC = null; chromaBuf.forEach(c => { c.width = W; }); });
function render() {
  // ---- pass 1: pixel world at 480x270 ----
  beginWorld();
  let cx = G.cam.x, cy = G.cam.y;
  if (G.state === 'bossintro' && G.boss) { const k = easeOut(Math.min(1, G.introT / .8)) * (G.introT > 2.4 ? 1 - (G.introT - 2.4) / .6 : 1); cx = lerp(cx, G.boss.x - W / 2, k); cy = lerp(cy, G.boss.y - H / 2, k); }
  cx = Math.round(cx + FX.sx + FX.kickX); cy = Math.round(cy + FX.sy + FX.kickY);
  rect(0, 0, W, H, col(0));
  drawWorld(cx, cy, G.time);
  drawProps(cx, cy); drawTraps(cx, cy); drawInter(cx, cy); drawSupportGround(cx, cy);
  for (const k of G.picks) { const x = k.x - cx, y = k.y - cy; if (k.kind === 'ink') { rect(x - 1, y - 1, 2, 2, col(4)); rect(x - 1, y - 1, 1, 1, col(5)); if (((k.x * 7) | 0) % 3 === 0) rect(x, y, 1, 1, '#8a5a3a'); if (((G.time * 10 + k.x) | 0) % 7 === 0) rect(x - 2, y, 4, 1, col(4)); } else { const by = Math.round(y - 3 + Math.sin(G.time * 4) * 1.5); rect(x - 4, by - 1, 9, 8, col(0)); rect(x - 3, by, 7, 6, '#d8d0c0'); rect(x - 3, by, 7, 1, '#f0e8d8'); rect(x, by + 1, 1, 4, '#b8262e'); rect(x - 1, by + 2, 3, 2, '#b8262e'); } }
  drawMechs(cx, cy); drawHazards(cx, cy); drawFires(cx, cy); drawEnemies(cx, cy); drawSquad(cx, cy); drawPlayer(cx, cy); drawReapCharge(cx, cy); drawAttacks(cx, cy); drawParticles(cx, cy); drawPlayerShield(cx, cy); drawSupportAir(cx, cy);
  drawSkillWorld(cx, cy); drawDark(cx, cy);
  ctx.drawImage(getVignette(), 0, 0);
  drawSkillScreen(cx, cy);
  if (FLOORS[G.floor].fog) ctx.drawImage(getFog(), Math.round(G.p.x - cx - W), Math.round(G.p.y - cy - H));
  if (G.p.alive && G.p.hp <= 2 && G.state === 'play') { const k = Math.pow(Math.max(0, Math.sin(G.time * 5.2)), 4) * .35 + .25; if (!G.bloodVig || G.bloodVig.width !== W) { const v = document.createElement('canvas'); v.width = W; v.height = H; const x = v.getContext('2d'), g = x.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, W * .62); g.addColorStop(0, 'rgba(90,10,14,0)'); g.addColorStop(1, 'rgba(110,8,14,.9)'); x.fillStyle = g; x.fillRect(0, 0, W, H); G.bloodVig = v; } ctx.globalAlpha = k; ctx.drawImage(G.bloodVig, 0, 0); ctx.globalAlpha = 1; }
  if (FX.chroma > .05 && QS.fx) { const o = Math.ceil(FX.chroma * 2.5);
    ['#a8241c', '#4a4038'].forEach((c, i) => { const b = chromaBuf[i], x = b.getContext('2d'); x.globalCompositeOperation = 'source-over'; x.drawImage(cv, 0, 0); x.globalCompositeOperation = 'multiply'; x.fillStyle = c; x.fillRect(0, 0, W, H); });
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = Math.min(.6, FX.chroma * .5); ctx.drawImage(chromaBuf[0], o, 0); ctx.drawImage(chromaBuf[1], -o, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  if (G.state === 'win') { const g = ctx.createLinearGradient(0, H, 0, 0); g.addColorStop(0, '#d0702e'); g.addColorStop(.55, '#8a4a2a'); g.addColorStop(1, '#2a2420');
    ctx.globalCompositeOperation = 'color'; ctx.globalAlpha = clamp(G.endT * .4, 0, .8); rect(0, 0, W, H, g); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  if (FX.flashA > 0) { ctx.globalAlpha = FX.flashA * .6; rect(0, 0, W, H, FX.flashC); ctx.globalAlpha = 1; }
  present();
  // ---- pass 2: crisp UI at 3x ----
  beginUI();
  drawFT(cx, cy); drawInterLabels(cx, cy); drawMechLabels(cx, cy); drawChampBars(cx, cy); drawSquadUI(cx, cy);
  if (G.state === 'fusion') drawFusion(cx, cy);
  if (LAUNCH.inT < 1.2) drawLaunchIn(cx, cy);
  if (G.state === 'orbopen') drawOrbOpen(cx, cy);
  if (G.state === 'play' || G.state === 'build' || G.state === 'cards' || G.state === 'orbopen') { drawSkillHUD(); drawHUD(); drawSupportHUD(); drawTicker(); drawWorldBtn(); if (G.state === 'play' && G.prompt && G.prompt.shard) drawShardTip(G.prompt.shard); if (G.state === 'play' && G.prompt && G.prompt.chip) drawChipTip(G.prompt.chip); drawSkillCallout(); }
  if (G.state === 'bossintro' && G.boss) { const k = Math.min(1, G.introT * 3) * (G.introT > 2.6 ? 1 - (G.introT - 2.6) / .4 : 1), bh = 34 * k;
    rect(0, 0, W, bh, col(0)); rect(0, H - bh, W, bh, col(0)); rect(0, bh, W, 1, C.red); rect(0, H - bh - 1, W, 1, C.red);
    if (G.introT > .7) { const full = tr(G.boss.def.name), nm = [...full], tk = Math.min(1, (G.introT - .7) * 3), name = nm.slice(0, Math.ceil(nm.length * tk)).join('');
      let sc = 4; while (sc > 1 && textW(full, sc) > W - 40) sc--; textS(name, W / 2, H - 70 - sc * 3, col(5), sc, 'center');
      const lw = Math.min(W - 60, textW(full, sc)) * Math.min(1, (G.introT - .9) * 2); if (lw > 0) { rect(W / 2 - lw / 2, H - 52, lw, 1, C.red); rect(W / 2 - 2, H - 54, 4, 5, C.red); } } }
  drawBanner();
  if (G.state === 'talk') drawTalk();
  if (G.state === 'chat') drawChat();
  if (G.state === 'world') drawWorldPanel();
  if (G.hintQ) drawHintQ();
  if (G.cards && (G.state === 'cards' || (G.state === 'build' && BUILD.ret === 'cards') || (G.state === 'pause' && G.pauseRet === 'cards'))) drawCards();
  if (G.state === 'build') drawBuildOverlay();
  if (G.state === 'pause') drawPause();
  if (G.state === 'dead') drawEnd(false, G.endT);
  if (G.state === 'win') { drawEnd(true, G.endT); for (let i = 0; i < 4; i++) rect(rand(0, W), rand(H * .3, H), 1, 2, choice([TH.ember, TH.emberHi, '#efb94a'])); }
  if (G.state === 'curse') drawCurse();
  if (G.state === 'dialysis') drawDialysisUI();
  if (G.state === 'barracks') drawBarracksTalk();
  if (G.state === 'test') drawTest();
  drawTestToast();
  // notices always sit above any overlay (e.g. 'not enough ink' while choosing a shard)
  if (G.state === 'play' || G.state === 'build' || G.state === 'cards' || G.state === 'orbopen' || G.state === 'curse' || G.state === 'dialysis' || G.state === 'barracks') drawNotes();
  if (QS.fx) filmGrain(.035);
  if (G.state === 'trans') { const k = G.transT < 1 ? G.transT : 2.2 - G.transT; const h = clamp(k * 1.4, 0, 1) * H; rect(0, 0, W, h / 2 + 1, '#000'); rect(0, H - h / 2 - 1, W, h / 2 + 2, '#000'); }
}

// ---- boot ----
let menuT = 0, last = performance.now();
// the next frame is always scheduled first, so a thrown error can never stop the loop (that used to look like a freeze)
const CRASH = { n: 0, last: '', log: [] };
// frame-rate cap: frames are paced on a fixed beat (no cap beyond what the display itself refreshes at)
let frameDue = 0;
function frame(now) { requestAnimationFrame(frame); if (QS.fps < 240) { const iv = 1000 / QS.fps; if (now < frameDue - 1) return; frameDue = Math.max(frameDue + iv, now); } const rdt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now;
  try { step(rdt); CRASH.n = Math.max(0, CRASH.n - 1); } catch (e) { onFrameError(e); } }
function onFrameError(e) {
  const msg = String(e && e.stack || e); if (CRASH.log.length < 20) { CRASH.log.push(msg); if (ONDZ() && CRASH.log.length <= 5) try { dzmm.log.error('frame error', { msg: msg.slice(0, 900) }, 'FRAME_ERROR'); } catch (e2) { } } console.error('[achroma] frame error', e);
  CRASH.n += 2; try { inputEndFrame(); } catch (e2) { }
  try { for (const c of [wctx, vctx]) { if (c.reset) c.reset(); else c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false; c.globalAlpha = 1; } ctx = wctx; } catch (e2) { }
  // Repeated failures recover the saved floor, preserving its transition state.
  if (CRASH.n > 20) { CRASH.n = 0; softRecover(); }
}
function softRecover() {
  try { FX.slow = 1; FX.slowT = 0; FX.hitstop = 0; ctx = wctx; ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (!G || !G.p || ['menu', 'launch', 'intro', 'dead', 'win'].includes(G.state)) return;
    const saved = loadSave();
    if (saved && saved.rid === G.rid && !(window.BOSS_TEST && BOSS_TEST.on)) {
      resumeRun(); G.hintQ = false; Input.down = false;
      notify(tr(N4('FLOOR CHECKPOINT RESTORED', '已恢復樓層存檔', 'フロアの記録を復元しました', '已恢复楼层存档')), C.gold);
    } else toMenu();
  } catch (e) { console.error('[achroma] recovery failed', e); toMenu(); } }
let FRAME_DT = 1 / 60;
function step(rdt) {
  FRAME_DT = rdt; fitCheck(); touchPre(rdt); if (typeof gamepadPre === 'function') gamepadPre(rdt);
  const inRun = G.p && G.state !== 'menu' && G.state !== 'launch' && G.state !== 'intro', title = '[' + L('gameTitle') + ']' + (inRun ? 'ch.' + (G.floor + 1) : ''); if (document.title !== title) document.title = title;
  updateFX(rdt);
  if (pressed('KeyM')) { AU.on = !AU.on; AU.applyVolumes(); }
  if (pressed('KeyF') && !ONDZ() && G.state !== 'play') toggleFS();
  if (G.state === 'menu' || G.state === 'intro') { if (Input.clicked || Object.keys(Input.keys).some(k => Input.keys[k])) { AU.init(); AU.startDrone(); } }
  if (G.state === 'launch') { LAUNCH.t += rdt; if (LAUNCH.t > .75 && !LAUNCH.done) { LAUNCH.done = true; const fn = LAUNCH.fn || newRun; LAUNCH.fn = null; fn(); Input.down = false; LAUNCH.inT = 0; AU.play('select'); } }
  if (LAUNCH.inT < 1.2) LAUNCH.inT += rdt;
  if (NAMEED.open) { updateNameEd(rdt); if (G.state === 'menu') menuT += rdt; }
  else if (OVL.open) { updateOvl(rdt); if (G.state === 'menu') menuT += rdt; }
  else if (WC.open && G.state === 'menu') { menuT += rdt; MENU.t += rdt; updateWorld(rdt); }
  else if (G.state === 'intro') { updateIntro(rdt); }
  else if (G.state === 'menu') { menuT += rdt; updateMenu(rdt); }
  else if (G.state !== 'launch') update(rdt);
  if (G.state === 'intro') { beginWorld(); drawIntroWorld(); present(); beginUI(); drawIntroUI(); }
  else if (G.state === 'menu' || G.state === 'launch') { menuT += G.state === 'launch' ? rdt : 0; beginWorld(); drawCampWorld(menuT); if (typeof menuZoom === 'function') menuZoom(); present(); beginUI(); drawMenu(menuT); if (WC.open && G.state === 'menu') drawWorldPanel(); if (G.state === 'launch') drawLaunchOut(); } else render();
  wcTick();
  if (NAMEED.open) drawNameEd();
  if (OVL.open) drawOvl();
  drawTouchUI(); drawAssistLock();
  drawCursor();
  if (typeof drawGamepadUI === 'function') drawGamepadUI(rdt);
  inputEndFrame();
}
window.__achroma = { step, get G() { return G; } };
// js/platform.js starts the loop once every script has loaded
// the first frame is drawn at once (a hidden frame gets no animation frames, and the host waits for this one), then the loop runs
window.EMBER_START = () => { try { localUnlockAll(); } catch (e) { console.error(e); } netInit(); try { step(0); } catch (e) { onFrameError(e); } last = performance.now(); requestAnimationFrame(frame); };

// ---- endless mode: after the last boss, floors go on with random themes and bosses, and everything grows stronger (see diffV) ----
// the clear itself still pays out (proofs, affection); from here the run is scored as an endless run when it ends
// ending endless mode on your own (pause menu): the run is scored on the endless board like a fall, without the fall
function endEndless() { if (!G.endless || !G.p.alive) return; clearSave(); G.ebullets.length = 0; G.state = 'win'; G.endT = 0; AU.play('win'); AU.setMode('calm'); finishRun(false); }
function beginFloorTransition(fi) { G.nextFloor = fi; G.state = 'trans'; G.transT = 0; G.transDone = false; G.curseDone = !!(window.BOSS_TEST && BOSS_TEST.on) || curseless(); saveRun(); AU.play('roar'); }
function startEndless() { if (G.endless) return; girlsOnClear(); G.powCap = powerScale(); G.endless = 1; beginFloorTransition(endlessFloor()); flash(C.red, .4, true); notify(L('endlessOn'), C.red); }
const endlessFloor = () => randi(0, FLOORS.length - 1);
// the curse event is skipped once every curse has been taken
const curseless = () => CURSES.every(c => (G.curses || []).includes(c.id));
