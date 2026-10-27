// ===== ACHROMA weapons II: twelve weapons, each with an attack method of its own =====
'use strict';
Object.assign(WEAPONS, {
  hook: { nm: N4('GRAPPLE', '鉤鎖', 'グラップル', '钩锁'), d: N4('A CHAIN HOOK THAT DRAGS THE FIRST FOE TO YOU, THEN STRIKES AGAIN', '鉤住第一個敵人並將其拖到身前，再補上一擊', '最初の敵を引き寄せ、もう一撃を加える鎖鉤', '钩住第一个敌人并将其拖到身前，再补上一击'), kind: 'hook', rate: 1.6, dmg: 12, proc: 1, knock: 0, recoil: 3, shake: .06, sfx: 'whip', st: [3, 2, 4],
    spr: ['..........55', '.........5.5', '55555555555.', '544443333...', '55..........'] },
  aegis: { nm: N4('AEGIS', '鏡盾', 'イージス', '镜盾'), d: N4('HOLD TO RAISE A MIRROR SHIELD THAT REFLECTS BULLETS. RELEASE TO BASH', '按住舉起鏡盾反射子彈，放開時盾擊', '長押しで弾を反射する鏡盾。離すと盾打ち', '按住举起镜盾反射子弹，放开时盾击'), kind: 'aegis', hold: 1, dmg: 14, proc: 1, knock: 260, recoil: 0, shake: .08, sfx: 'hammer', st: [3, 2, 1],
    spr: ['.5555.', '544445', '54ff45', '54ff45', '544445', '.5445.', '..55..'] },
  rod: { nm: N4('STORMROD', '引雷杖', '避雷杖', '引雷杖'), d: N4('PLANTS LIGHTNING RODS THAT ZAP FOES AND FENCE THEM WITH ARCS', '插下避雷針，電擊附近敵人並以電弧相連', '避雷針を設置。敵を撃ち、電弧の柵で結ぶ', '插下避雷针，电击附近敌人并以电弧相连'), kind: 'rod', rate: 1.5, dmg: 6, proc: .6, knock: 30, recoil: 2, shake: .04, sfx: 'zap', st: [2, 2, 4],
    spr: ['.c.........', 'c5c........', '.5555555555', '.544443333.', '.5.........'] },
  strike: { nm: N4('HALO STRIKE', '天罰', '天罰', '天罚'), d: N4('CALLS A PILLAR OF LIGHT DOWN ON THE CROSSHAIR. IGNORES WALLS', '在準星處降下光柱，無視牆壁', '照準に光の柱を落とす。壁を無視', '在准星处降下光柱，无视墙壁'), kind: 'strike', rate: 1, dmg: 32, proc: 1, knock: 120, recoil: 2, shake: .05, sfx: 'cast', st: [5, 1, 5],
    spr: ['....g....', '...g5g...', '555555555', '544445555', '..55.....'] },
  summon: { nm: N4('SPECTER', '魂犬', 'スペクター', '魂犬'), d: N4('RELEASES SPECTRAL HOUNDS THAT HUNT AND BITE FOES', '釋放幽魂獵犬，追獵並撕咬敵人', '敵を追って噛みつく霊犬を放つ', '释放幽魂猎犬，追猎并撕咬敌人'), kind: 'summon', rate: 1.2, dmg: 6, proc: .7, knock: 40, recoil: 1, shake: .03, sfx: 'cast', st: [3, 2, 4],
    spr: ['..vvv....', '.v555v...', 'v5v5v5555', '.v555v445', '..vvv..55'] },
  net: { nm: N4('SNARE', '羅網', 'スネア', '罗网'), d: N4('A NET THAT ROOTS FOES IN PLACE AND WEARS THEM DOWN', '張開羅網，將敵人定在原地並持續消耗', '敵をその場に縛り削り続ける網', '张开罗网，将敌人定在原地并持续消耗'), kind: 'net', rate: 1.3, dmg: 4, proc: .5, knock: 0, recoil: 3, shake: .04, sfx: 'lob', st: [2, 2, 3],
    spr: ['......5.5.5', '5555555.5.5', '5444443.5.5', '5555555.5.5', '.55...5.5.5'] },
  fissure: { nm: N4('FAULTLINE', '斷層', 'フォルト', '断层'), d: N4('A GROUND SLAM THAT TEARS A LINE OF ERUPTIONS FORWARD', '重擊地面，向前撕開一連串噴發', '地面を叩き、前方へ噴出の列を走らせる', '重击地面，向前撕开一连串喷发'), kind: 'fissure', rate: 1.1, dmg: 14, proc: .8, knock: 150, recoil: 0, shake: .12, sfx: 'hammer', st: [4, 2, 4],
    spr: ['.......5555', '.......5oo5', '55555555oo5', '54444445oo5', '55555555555'] },
  sweep: { nm: N4('LIGHTHOUSE', '燈塔', 'ライトハウス', '灯塔'), d: N4('A BEAM THAT SWEEPS A WIDE ARC IN FRONT OF YOU', '掃過前方大範圍扇形的光束', '前方の広い弧を薙ぎ払う光線', '扫过前方大范围扇形的光束'), kind: 'sweep', rate: 1.4, dmg: 13, proc: .7, knock: 70, recoil: 3, shake: .06, sfx: 'laser', st: [4, 2, 3],
    spr: ['.....555...', '5555544455o', '5444444445o', '5555544455o', '.55..555...'] },
  recall: { nm: N4('RECALL', '回刃', 'リコール', '回刃'), d: N4('DAGGERS HANG IN THE AIR, THEN ALL FLY BACK TO YOU AT ONCE', '飛刀懸停空中，隨後一齊飛回你身邊', '短剣が宙に留まり、一斉に手元へ戻る', '飞刀悬停空中，随后一齐飞回你身边'), kind: 'recall', rate: 4, dmg: 5, proc: .6, knock: 30, recoil: 1, shake: .02, sfx: 'needle', st: [3, 4, 3],
    spr: ['.........f.', '55555555ff5', '54443333f..', '55.........'] },
  vacuum: { nm: N4('SIPHON', '虹吸', 'サイフォン', '虹吸'), d: N4('HOLD TO SWALLOW ENEMY BULLETS. RELEASE TO FIRE THEM BACK', '按住吞噬敵方子彈，放開時全部射回', '長押しで敵弾を吸い込み、離すと撃ち返す', '按住吞噬敌方子弹，放开时全部射回'), kind: 'vacuum', hold: 1, dmg: 7, proc: .6, knock: 40, recoil: 2, shake: .04, sfx: 'vortex', st: [3, 3, 2],
    spr: ['.5555.....', '544445555.', '5v...44445', '544445555.', '.5555.....'] },
  wall: { nm: N4('GLACIER', '冰壁', 'グレイシャー', '冰壁'), d: N4('RAISES A WALL OF ICE THAT EATS BULLETS, THEN SHATTERS', '升起一道吞噬子彈的冰牆，消散時碎裂', '弾を防ぐ氷壁を立て、最後に砕け散る', '升起一道吞噬子弹的冰墙，消散时碎裂'), kind: 'wall', rate: 1, dmg: 8, proc: .7, knock: 60, recoil: 2, shake: .05, sfx: 'freeze', st: [2, 1, 2],
    spr: ['.ff.ff.ff.', 'ffffffffff', '5555555555', '5444444445', '.55.......'] },
  flail: { nm: N4('MORNINGSTAR', '流星錘', 'モーニングスター', '流星锤'), d: N4('HOLD TO WHIRL A SPIKED BALL AROUND YOU. FASTER SPINS HIT HARDER', '按住讓刺球繞身旋轉，轉得越快傷害越高', '長押しで鉄球を振り回す。速いほど威力増', '按住让刺球绕身旋转，转得越快伤害越高'), kind: 'flail', hold: 1, dmg: 12, proc: .8, knock: 180, recoil: 0, shake: .05, sfx: 'whirl', st: [4, 3, 2],
    spr: ['......5.5', '.......5.', '5555..555', '5445.5.5.', '5555.....'] },
});
for (const k of ['hook', 'aegis', 'rod', 'strike', 'summon', 'net', 'fissure', 'sweep', 'recall', 'vacuum', 'wall', 'flail']) { WEAPONS[k].id = k; WEAPON_IDS.push(k); }
const AMMO2 = { hook: [4, 1.4, 'disc', 'gold'], rod: [3, 2.2, 'cell', 'cyan'], strike: [2, 2, 'cell', 'gold'], summon: [3, 2.4, 'orb', 'violet'], net: [3, 1.6, 'disc', 'lime'], sweep: [3, 1.6, 'cell', 'orange'], recall: [6, 1.2, 'needle', 'frost'], wall: [2, 2.6, 'disc', 'frost'] };
for (const k in AMMO2) { const [mag, rl, am, ac] = AMMO2[k]; Object.assign(WEAPONS[k], { mag, reload: rl, am, acK: ac }); }
for (const k of ['aegis', 'fissure', 'vacuum', 'flail']) MELEE.add(k);
// balance pass: ranged weapons lose time to reloads and stand far away, so they hit a little harder
WEAPONS.summon.dmg = 8;
for (const k of ['nail', 'hail', 'storm', 'scatter', 'rail', 'prism', 'volt', 'halo', 'bloom', 'shuriken', 'twin', 'rivet', 'helix', 'mirage', 'hive', 'frostbite', 'hook', 'rod', 'net', 'sweep', 'recall', 'wall']) { const w = WEAPONS[k]; for (const f of ['dmg', 'aoe', 'burstDmg', 'dmgMax']) if (typeof w[f] === 'number') w[f] = +(w[f] * 1.12).toFixed(2); }

// ---- weapon entities: rods, hounds, nets, walls... each with its own update/draw ----
function went(o) { (G.went || (G.went = [])).push(Object.assign({ t: 0 }, o)); }
function updateWents(dt) { const L3 = G.went; if (!L3) return; for (let i = L3.length - 1; i >= 0; i--) { const e = L3[i]; e.t += dt; if (e.u(e, dt)) L3.splice(i, 1); } }
function drawWents(cx, cy) { const L3 = G.went; if (!L3) return; for (const e of L3) e.dr(e, cx, cy); }
const liveFoes = () => G.enemies.filter(e => !e.dead && !(e.deathFightLeft > 0) && e.spawnT <= 0);
function hitOpts(w, o, extra) { return Object.assign({ proc: w.proc, knock: w.knock, ghost: o.ghost, critBonus: o.critBonus }, extra); }
function rootFoe(e, t) { const k = e.boss ? 0 : ccMul(e, 'root'); ccAdd(e, 'root', .5); if (k < .1) { if (e.boss) { e.slowT = Math.max(e.slowT, t); e.slowMul = .6; } else resistText(e); return; } e.rootT = Math.max(e.rootT || 0, t * k); }

const WK = {
  hook(p, w, a, o, mx, my) { const dmg = w.dmg * G.S.dmg * o.scale, R = 175 * Math.sqrt(G.S.size), tint = o.ghost ? C.violet : buildTint();
    went({ x: mx, y: my, a, d: 0, st: 'out', R, dmg, tint, o,
      u(h, dt) { const P = G.p;
        if (h.st === 'out') { h.d += 420 * dt; h.x = P.x + Math.cos(h.a) * h.d; h.y = P.y + Math.sin(h.a) * h.d;
          if (shotBlocked(h.x, h.y) || h.d > h.R) { h.st = 'back'; return false; }
          const e = G.enemies.find(q => !q.dead && !(q.deathFightLeft>0) && q.spawnT <= 0 && dist(q.x, q.y, h.x, h.y) < q.r + 5);
          if (e) { h.tg = e; h.st = 'pull'; h.pt = 0; hitEnemy(e, h.dmg, hitOpts(w, h.o, { ka: h.a, melee: true })); AU.play('stick', .7); shake(.06); } return false; }
        if (h.st === 'pull') { const e = h.tg; h.pt += dt; if (!e || e.dead) { h.st = 'back'; return false; } h.x = e.x; h.y = e.y; const d = dist(P.x, P.y, e.x, e.y);
          if (e.boss || e.champ) { if (d > 26 && P.dashT <= 0) moveBody(P, (e.x - P.x) / d * 260 * dt, (e.y - P.y) / d * 260 * dt); }
          else if (d > 18) moveBody(e, (P.x - e.x) / d * 380 * dt, (P.y - e.y) / d * 380 * dt);
          if (d <= 28 || h.pt > .35) { hitEnemy(e, h.dmg * 1.3, hitOpts(w, h.o, { ka: ang(P.x, P.y, e.x, e.y), knock: 220, melee: true })); starFx(e.x, e.y, 7, col(5), .12); AU.play('hammer', 1.5, .5); h.st = 'back'; } return false; }
        h.d = Math.max(0, dist(P.x, P.y, h.x, h.y) - 520 * dt); const ba = ang(P.x, P.y, h.x, h.y); h.x = P.x + Math.cos(ba) * h.d; h.y = P.y + Math.sin(ba) * h.d; return h.d < 6; },
      dr(h, cx, cy) { const P = G.p, x = h.x - cx, y = h.y - cy, px = P.x - cx, py = P.y - cy - 2, n = Math.max(2, Math.floor(dist(px, py, x, y) / 4));
        for (let i = 0; i <= n; i++) { const q = i / n; rect(lerp(px, x, q) - .5, lerp(py, y, q) - .5, i % 2 ? 1 : 2, i % 2 ? 1 : 2, i % 2 ? col(4) : h.tint); }
        const a2 = h.st === 'out' ? h.a : ang(px, py, x, y); pxLine(x, y, x - Math.cos(a2 + .6) * 5, y - Math.sin(a2 + .6) * 5, col(5)); pxLine(x, y, x - Math.cos(a2 - .6) * 5, y - Math.sin(a2 - .6) * 5, col(5)); rect(x - 1, y - 1, 3, 3, h.tint); } });
  },
  rod(p, w, a, o) { const S = G.S, tx0 = G.aimX !== undefined ? G.aimX : Input.mx + G.cam.x, ty0 = G.aimY !== undefined ? G.aimY : Input.my + G.cam.y, d0 = Math.min(160, dist(p.x, p.y, tx0, ty0));
    const pts = rayPath(p.x, p.y, a, d0, 0), e2 = pts[pts.length - 1], x = e2[0] - Math.cos(a) * 3, y = e2[1] - Math.sin(a) * 3, dmg = w.dmg * S.dmg * o.scale;
    const rods = (G.went || []).filter(q => q.rod); if (rods.length >= 3) rods[0].life = 0;
    burst(x, y, 10, C.cyan, 90, .3); ringFx(x, y, 12, C.cyan, .25, 1);
    went({ rod: true, x, y, life: 8, zt: .2, ft: 0, dmg, o,
      u(r, dt) { r.life -= dt; r.zt -= dt; r.ft -= dt; if (r.life <= 0) { burst(r.x, r.y, 8, C.cyan, 60, .3); return true; }
        if (r.zt <= 0) { const t = nearestEnemy(r.x, r.y, 72 * Math.sqrt(G.S.size)); if (t) { r.zt = .6; G.bolts.push({ pts: zig(r.x, r.y - 10, t.x, t.y), life: .12, max: .12, c: C.cyan }); hitEnemy(t, r.dmg, hitOpts(w, r.o, { ka: ang(r.x, r.y, t.x, t.y), color: C.cyan, fromShock: true })); AU.play('static'); } else r.zt = .2; }
        if (r.ft <= 0) { r.ft = .3; const rods2 = G.went.filter(q => q.rod && q !== r && q.life > 0 && dist(q.x, q.y, r.x, r.y) < 200); for (const q of rods2) if (q.x + q.y > r.x + r.y) for (const e of liveFoes()) if (segDist(e.x, e.y, r.x, r.y - 6, q.x, q.y - 6) < e.r + 3) hitEnemy(e, r.dmg * .6, hitOpts(w, r.o, { color: C.cyan, knock: 0, quiet: true, fromShock: true })); }
        return false; },
      dr(r, cx, cy) { const x = r.x - cx, y = r.y - cy; rect(x - 1, y - 12, 2, 12, col(4)); rect(x - 2, y - 14, 4, 3, ((G.time * 8) | 0) % 2 ? C.cyan : col(5)); rect(x - 3, y, 6, 1, col(3));
        for (const q of G.went) if (q.rod && q !== r && q.x + q.y > r.x + r.y && dist(q.x, q.y, r.x, r.y) < 200) { const pts = zig(r.x, r.y - 7, q.x, q.y - 7); ctx.globalAlpha = .6; drawBolt(pts, cx, cy, C.cyan, 1); ctx.globalAlpha = 1; } } });
  },
  strike(p, w, a, o) { const S = G.S, tx = G.aimX !== undefined ? G.aimX : Input.mx + G.cam.x, ty = G.aimY !== undefined ? G.aimY : Input.my + G.cam.y, R = 26 * Math.sqrt(S.size), dmg = w.dmg * S.dmg * o.scale, c = o.ghost ? C.violet : C.gold;
    went({ x: tx, y: ty, R, dmg, c, o, hit: false,
      u(s, dt) { if (!s.hit && s.t > .55) { s.hit = true; AU.play('rail', .8); shake(.2); flash(col(5), .12);
          for (const e of liveFoes()) if (dist(e.x, e.y, s.x, s.y) < s.R + e.r) { hitEnemy(e, s.dmg, hitOpts(w, s.o, { ka: ang(s.x, s.y, e.x, e.y), color: s.c })); if (!e.dead && !e.boss) e.frozen = Math.max(e.frozen, .35 * ccMul(e, 'freeze')); }
          burst(s.x, s.y, 24, s.c, 160, .5, 2); ringFx(s.x, s.y, s.R, col(5), .3, 3); splat(s.x, s.y, col(0), 14, s.R * .6); }
        return s.t > .85; },
      dr(s, cx, cy) { const x = s.x - cx, y = s.y - cy; if (s.t < .55) { const k = s.t / .55; ringC(x, y, s.R, s.c, 1); ringC(x, y, s.R * (1 - k) + 2, col(5), 1); for (let i = 0; i < 4; i++) { const aa = G.time * 4 + i * 1.57; rect(x + Math.cos(aa) * s.R - 1, y + Math.sin(aa) * s.R - 1, 2, 2, s.c); } ctx.globalAlpha = .25 * k; rect(x - 2, y - 200, 4, 200, s.c); ctx.globalAlpha = 1; }
        else { const k = 1 - (s.t - .55) / .3; ctx.globalAlpha = k; rect(x - s.R * .6, y - 260, s.R * 1.2, 260, s.c); rect(x - s.R * .3, y - 260, s.R * .6, 260, col(5)); disc(x, y, s.R * k, col(5)); ctx.globalAlpha = 1; } } });
  },
  summon(p, w, a, o) { const S = G.S, dmg = w.dmg * S.dmg * o.scale, c = o.ghost ? C.violet : '#c9a6ff';
    if ((G.went || []).filter(q => q.hound).length >= 4) { const old = G.went.find(q => q.hound); if (old) old.life = 0; }
    went({ hound: true, x: p.x + Math.cos(a) * 8, y: p.y + Math.sin(a) * 8, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160, life: 3, bites: 4, bt: 0, dmg, c, o, face: a,
      u(h, dt) { h.life -= dt; h.bt -= dt; if (h.life <= 0 || h.bites <= 0) { burst(h.x, h.y, 10, h.c, 60, .4); return true; }
        if (!h.tg || h.tg.dead || h.tg.deathFightLeft>0) h.tg = nearestEnemy(h.x, h.y, 220);
        if (h.tg) { const a2 = ang(h.x, h.y, h.tg.x, h.tg.y); h.face = a2; h.vx = lerp(h.vx, Math.cos(a2) * 230, Math.min(1, dt * 6)); h.vy = lerp(h.vy, Math.sin(a2) * 230, Math.min(1, dt * 6));
          if (dist(h.x, h.y, h.tg.x, h.tg.y) < h.tg.r + 6 && h.bt <= 0) { h.bt = .3; h.bites--; hitEnemy(h.tg, h.dmg, hitOpts(w, h.o, { ka: h.face, color: h.c })); AU.play('slash', 1.4, .5); burst(h.x, h.y, 5, h.c, 70, .2); } }
        else { h.vx *= Math.pow(.2, dt); h.vy *= Math.pow(.2, dt); }
        h.x += h.vx * dt; h.y += h.vy * dt; if (Math.random() < .5) part({ x: h.x, y: h.y, vx: 0, vy: -10, life: .3, max: .3, c: h.c, s: 1 }); return false; },
      dr(h, cx, cy) { const x = Math.round(h.x - cx), y = Math.round(h.y - cy), f = Math.cos(h.face) < 0 ? -1 : 1, k = Math.min(1, h.life * 2);
        ctx.globalAlpha = .85 * k; rect(x - 4, y - 2, 8, 4, h.c); rect(x + f * 3, y - 4, 3, 3, h.c); rect(x + f * 4, y - 3, 1, 1, col(0)); rect(x - f * 5, y - 3, 2, 1, h.c); rect(x - 3, y + 2, 1, 2, h.c); rect(x + 2, y + 2, 1, 2, h.c); ctx.globalAlpha = 1; } });
    ringFx(p.x, p.y, 12, c, .25, 1);
  },
  net(p, w, a, o, mx, my) { const S = G.S, dmg = w.dmg * S.dmg * o.scale, tx = G.aimX !== undefined ? G.aimX : Input.mx + G.cam.x, ty = G.aimY !== undefined ? G.aimY : Input.my + G.cam.y, L4 = clamp(dist(p.x, p.y, tx, ty), 40, 190);
    went({ x: mx, y: my, a, d: 0, L: L4, st: 'fly', R: 34 * Math.sqrt(S.size), dmg, o, tick: 0, life: 2.6,
      u(n, dt) { if (n.st === 'fly') { n.d += 300 * dt; const nx = n.x + Math.cos(n.a) * 300 * dt, ny = n.y + Math.sin(n.a) * 300 * dt;
          const hitE = G.enemies.some(e => !e.dead && !(e.deathFightLeft > 0) && e.spawnT <= 0 && dist(e.x, e.y, nx, ny) < e.r + 4);
          if (shotBlocked(nx, ny) || hitE || n.d >= n.L) { n.st = 'open'; n.t = 0; AU.play('chakram', .6); for (const e of liveFoes()) if (dist(e.x, e.y, n.x, n.y) < n.R + e.r) rootFoe(e, 2); } else { n.x = nx; n.y = ny; } return false; }
        n.life -= dt; n.tick -= dt; if (n.tick <= 0) { n.tick = .4; for (const e of liveFoes()) if (dist(e.x, e.y, n.x, n.y) < n.R + e.r) { hitEnemy(e, n.dmg, hitOpts(w, n.o, { knock: 0, quiet: true, color: C.lime })); if ((e.rootT || 0) < .2) rootFoe(e, .5); } }
        return n.life <= 0; },
      dr(n, cx, cy) { const x = n.x - cx, y = n.y - cy;
        if (n.st === 'fly') { ringC(x, y, 3, C.lime, 1); rect(x - 1, y - 1, 2, 2, col(5)); return; }
        const R = n.R * Math.min(1, n.t * 6), k = Math.min(1, n.life * 2); ctx.globalAlpha = .8 * k;
        for (let i = 0; i < 8; i++) { const aa = i / 8 * 6.283; pxLine(x, y, x + Math.cos(aa) * R, y + Math.sin(aa) * R, C.lime); } ringC(x, y, R, C.lime, 1); ringC(x, y, R * .55, C.lime, 1); ctx.globalAlpha = 1; } });
  },
  fissure(p, w, a, o) { const S = G.S, dmg = w.dmg * S.dmg * o.scale, c = o.ghost ? C.violet : C.orange; if (p.anim) p.anim.k = 'slam';
    hitstop(.02); for (let i = 0; i < 7; i++) { const d = 18 + i * 17 * Math.sqrt(S.size), x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
      G.later.push({ t: i * .055, f: () => { if (shotBlocked(x, y)) return; AU.play('hammer', 1.4 + i * .05, .4); burst(x, y, 8, c, 120, .35, 2); splat(x, y, col(0), 6, 8); went({ x, y, life: .25, dr(q, cx, cy) { const k = q.life / .25; rect(q.x - cx - 4, q.y - cy - 14 * k, 8, 14 * k, c); rect(q.x - cx - 2, q.y - cy - 18 * k, 4, 18 * k, col(5)); }, u(q, dt) { q.life -= dt; return q.life <= 0; } });
        for (const e of liveFoes()) if (dist(e.x, e.y, x, y) < 13 * Math.sqrt(S.size) + e.r) hitEnemy(e, dmg, hitOpts(w, o, { ka: a, melee: true, boom: true })); deflectBullets(p, b => dist(x, y, b.x, b.y) < 12, null, false); } }); }
  },
  sweep(p, w, a, o) { const S = G.S, dmg = w.dmg * S.dmg * o.scale, c = o.ghost ? C.violet : C.orange, L4 = 150 * Math.sqrt(S.size), dir = (p.swDir = -(p.swDir || 1)), arc = 1.8;
    went({ a0: a - dir * arc / 2, dir, arc, L: L4, dmg, c, o, hit: new Set(), dur: .32,
      u(s, dt) { const P = G.p, k = Math.min(1, s.t / s.dur), aa = s.a0 + s.dir * s.arc * k; s.cur = aa; const pts = rayPath(P.x, P.y, aa, s.L, 0), e2 = pts[pts.length - 1];
        for (const e of liveFoes()) if (!s.hit.has(e) && segDist(e.x, e.y, P.x, P.y, e2[0], e2[1]) < e.r + 4) { s.hit.add(e); hitEnemy(e, s.dmg, hitOpts(w, s.o, { ka: aa, color: s.c })); }
        s.end = e2; return s.t > s.dur + .08; },
      dr(s, cx, cy) { const P = G.p, x = P.x - cx, y = P.y - cy - 2; if (!s.end) return; const k = Math.min(1, s.t / s.dur);
        ctx.globalAlpha = .18; ctx.fillStyle = s.c; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, s.L, Math.min(s.a0, s.cur), Math.max(s.a0, s.cur)); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
        line(x, y, s.end[0] - cx, s.end[1] - cy, s.c, 4); line(x, y, s.end[0] - cx, s.end[1] - cy, col(5), 1); disc(s.end[0] - cx, s.end[1] - cy, 3, col(5)); } });
  },
  recall(p, w, a, o, mx, my) { const S = G.S, dmg = w.dmg * S.dmg * o.scale, c = o.ghost ? C.violet : C.frost, aa = a + rand(-.08, .08);
    went({ x: mx, y: my, vx: Math.cos(aa) * 360, vy: Math.sin(aa) * 360, st: 'fly', dmg, c, o, hit: new Set(), hov: 0,
      u(k, dt) { const P = G.p;
        if (k.st === 'fly') { k.vx *= Math.pow(.004, dt); k.vy *= Math.pow(.004, dt); const nx = k.x + k.vx * dt, ny = k.y + k.vy * dt; if (shotBlocked(nx, ny)) { k.vx = k.vy = 0; } else { k.x = nx; k.y = ny; }
          if (Math.hypot(k.vx, k.vy) < 30 || k.t > .35) { k.st = 'hover'; k.hov = 0; k.hit.clear(); } }
        else if (k.st === 'hover') { k.hov += dt; if (k.hov > 1.1) { k.st = 'back'; k.hit.clear(); AU.play('chakram', 1.6, .3); } }
        else { const a2 = ang(k.x, k.y, P.x, P.y), sp = 420; k.x += Math.cos(a2) * sp * dt; k.y += Math.sin(a2) * sp * dt; k.vx = Math.cos(a2); k.vy = Math.sin(a2); if (dist(k.x, k.y, P.x, P.y) < 8) return true; }
        if (k.st !== 'hover') for (const e of liveFoes()) if (!k.hit.has(e) && dist(e.x, e.y, k.x, k.y) < e.r + 3) { k.hit.add(e); hitEnemy(e, k.dmg * (k.st === 'back' ? 1.6 : 1), hitOpts(w, k.o, { ka: Math.atan2(k.vy, k.vx), color: k.c })); }
        return k.t > 4; },
      dr(k, cx, cy) { const x = k.x - cx, y = k.y - cy, a2 = k.st === 'hover' ? G.time * 6 : Math.atan2(k.vy, k.vx) + (k.st === 'back' ? Math.PI : 0);
        ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(a2); ctx.fillStyle = col(0); ctx.fillRect(-4, -2, 9, 3); ctx.fillStyle = k.c; ctx.fillRect(-3, -1, 7, 1); ctx.fillStyle = col(5); ctx.fillRect(3, -1, 2, 1); ctx.restore();
        if (k.st === 'hover') { ctx.globalAlpha = .35; ringC(x, y, 5, k.c, 1); ctx.globalAlpha = 1; } } });
  },
  wall(p, w, a, o) { const S = G.S, dmg = w.dmg * S.dmg * o.scale, cxw = p.x + Math.cos(a) * 42, cyw = p.y + Math.sin(a) * 42, nx = -Math.sin(a), ny = Math.cos(a), n = 5 + Math.round((S.size - 1) * 3), blocks = [];
    for (let i = 0; i < n; i++) { const off = (i - (n - 1) / 2) * 11, x = cxw + nx * off, y = cyw + ny * off; if (!shotBlocked(x, y)) blocks.push({ x, y }); }
    if (!blocks.length) return; AU.play('freeze'); for (const b of blocks) burst(b.x, b.y, 4, C.frost, 60, .3);
    went({ blocks, life: 4, dmg, o, tick: 0,
      u(wl, dt) { wl.life -= dt; wl.tick -= dt;
        for (const b of wl.blocks) for (let j = G.ebullets.length - 1; j >= 0; j--) { const q = G.ebullets[j]; if (Math.abs(q.x - b.x) < 6 + q.r && Math.abs(q.y - b.y) < 6 + q.r) { G.ebullets.splice(j, 1); burst(q.x, q.y, 3, C.frost, 50, .2); } }
        if (wl.tick <= 0) { wl.tick = .5; for (const b of wl.blocks) for (const e of liveFoes()) if (dist(e.x, e.y, b.x, b.y) < e.r + 7) { hitEnemy(e, wl.dmg * .4, hitOpts(w, wl.o, { knock: 60, quiet: true, color: C.frost, ka: ang(b.x, b.y, e.x, e.y) })); e.chill++; e.slowT = 2; e.slowMul = Math.min(e.slowMul || 1, 1 - .4 * ccMul(e, 'slow')); } }
        if (wl.life <= 0) { AU.play('freeze', .7); for (const b of wl.blocks) for (let k = 0; k < 3; k++) G.bullets.push(mkBullet({ x: b.x, y: b.y, a: rand(0, 6.28), spd: 200, dmg: wl.dmg, r: 1.5, life: .4, kind: 'shard', proc: .4, knock: 30, tint: C.frost, ghost: wl.o.ghost })); return true; }
        return false; },
      dr(wl, cx, cy) { const k = Math.min(1, wl.t * 5), fl = wl.life < .8 && ((G.time * 12) | 0) % 2; for (const b of wl.blocks) { const x = b.x - cx, y = b.y - cy, h = 12 * k;
        rect(x - 6, y - h + 4, 12, h, col(0)); rect(x - 5, y - h + 5, 10, h - 2, fl ? col(5) : '#7fc8f0'); rect(x - 5, y - h + 5, 10, 2, '#e8f8ff'); rect(x - 3, y - h + 8, 2, h - 6, '#bfe8ff'); } } });
  },
};
// ---- hold weapons: their trigger is a stance rather than a stream of shots ----
const HOLD = {
  aegis(p, w, dt, held) { const S = G.S; p.aegisHp = p.aegisHp === undefined ? 12 : p.aegisHp; p.aegisBrk = Math.max(0, (p.aegisBrk || 0) - dt);
    const up = held && p.aegisBrk <= 0; if (!up) p.aegisHp = Math.min(12, p.aegisHp + dt * 5);
    if (up) { p.aegisT = (p.aegisT || 0) + dt; const R = 15 * Math.sqrt(S.size), arc = 1.7;
      for (let i = G.ebullets.length - 1; i >= 0; i--) { const b = G.ebullets[i], d = dist(p.x, p.y, b.x, b.y); if (b.delay > 0 || d > R + b.r + 2 || Math.abs(angDiff(p.aim, ang(p.x, p.y, b.x, b.y))) > arc / 2) continue;
        G.ebullets.splice(i, 1); p.aegisHp -= 1; const ra = p.aim + rand(-.25, .25); G.bullets.push(mkBullet({ x: b.x, y: b.y, a: ra, spd: Math.max(240, Math.hypot(b.vx, b.vy) * 1.7), dmg: 9 * S.dmg * wlvMul(w), r: 2.5, life: 1, kind: 'deflect', pierce: S.pierce, bounce: S.bounce, home: S.home, proc: .6, tint: C.gold })); AU.play('deflect'); burst(b.x, b.y, 4, C.gold, 80, .2);
        if (p.aegisHp <= 0) { p.aegisBrk = 1.5; AU.play('crate'); burst(p.x, p.y, 14, C.frost, 120, .4); break; } }
      p.bashCd = (p.bashCd || 0) - dt; if (p.bashCd <= 0) for (const e of liveFoes()) if (dist(p.x, p.y, e.x, e.y) < R + e.r && Math.abs(angDiff(p.aim, ang(p.x, p.y, e.x, e.y))) < arc / 2 + .3) { p.bashCd = .45; hitEnemy(e, w.dmg * S.dmg * .4 * wlvMul(w), { melee: true, ka: p.aim, knock: 120, proc: .4 }); } }
    else if (p.aegisOn && (p.aegisT || 0) > .3) { const R = 30 * S.size, dmg = w.dmg * S.dmg * wlvMul(w); G.slashes.push({ x: p.x, y: p.y, a: p.aim, arc: 1.6, r: R, life: .16, max: .16, c: C.frost, ghost: false });
      for (const e of liveFoes()) if (dist(p.x, p.y, e.x, e.y) < R + e.r && Math.abs(angDiff(p.aim, ang(p.x, p.y, e.x, e.y))) < 1) hitEnemy(e, dmg * (1 + Math.min(1, p.aegisT / 2)), { melee: true, ka: p.aim, knock: w.knock, proc: w.proc });
      AU.play('hammer', 1.2); shake(.1); p.vx += Math.cos(p.aim) * 150; p.vy += Math.sin(p.aim) * 150; }
    if (!up) p.aegisT = 0; p.aegisOn = up; },
  vacuum(p, w, dt, held) { const S = G.S; p.vacN = p.vacN || 0; const L4 = 64 * Math.sqrt(S.size), arc = 1.1;
    if (held) { p.vacOn = true; for (let i = G.ebullets.length - 1; i >= 0; i--) { const b = G.ebullets[i], d = dist(p.x, p.y, b.x, b.y); if (b.delay > 0 || d > L4 || Math.abs(angDiff(p.aim, ang(p.x, p.y, b.x, b.y))) > arc / 2) continue;
        const a2 = ang(b.x, b.y, p.x, p.y), s2 = Math.max(80, Math.hypot(b.vx, b.vy)); b.vx = Math.cos(a2) * s2 * 1.4; b.vy = Math.sin(a2) * s2 * 1.4; b.vac = 1;
        if (d < 12) { G.ebullets.splice(i, 1); p.vacN = Math.min(24, p.vacN + 1); AU.play('ink', 1 + p.vacN * .03); } }
      p.vacT = (p.vacT || 0) - dt; if (p.vacT <= 0) { p.vacT = .3; for (const e of liveFoes()) { const d = dist(p.x, p.y, e.x, e.y); if (d < L4 + e.r && Math.abs(angDiff(p.aim, ang(p.x, p.y, e.x, e.y))) < arc / 2 + .2) { hitEnemy(e, w.dmg * .35 * S.dmg * wlvMul(w), { proc: .3, knock: 0, quiet: true, color: C.violet }); if (!e.boss && d > 16) moveBody(e, (p.x - e.x) / d * 6, (p.y - e.y) / d * 6); } } }
      if (Math.random() < .8) { const aa = p.aim + rand(-arc / 2, arc / 2), r = rand(20, L4); part({ x: p.x + Math.cos(aa) * r, y: p.y + Math.sin(aa) * r, vx: -Math.cos(aa) * r * 3, vy: -Math.sin(aa) * r * 3, life: .25, max: .25, c: Math.random() < .5 ? C.violet : col(4), s: 1 }); } }
    else { if (p.vacOn && p.vacN > 0) { const n = p.vacN; p.vacN = 0; AU.play('rocket'); kick(p.aim, 4); for (let i = 0; i < n; i++) G.later.push({ t: i * .025, f: () => { const P = G.p, tip = shotOrigin(P, w); G.bullets.push(mkBullet({ x: tip.x, y: tip.y, a: P.aim + rand(-.25, .25), spd: 320, dmg: w.dmg * S.dmg * wlvMul(w), r: 2.5, life: .9, kind: 'bolt', pierce: S.pierce, bounce: S.bounce, home: Math.max(1, S.home), proc: w.proc, knock: w.knock, tint: C.violet })); } }); } p.vacOn = false; }
    if (!held) for (const b of G.ebullets) if (b.vac) b.vac = 0; },
  flail(p, w, dt, held) { const S = G.S; p.flK = clamp((p.flK || 0) + (held ? dt / .8 : -dt * 2.5), 0, 1); const k = p.flK; if (k <= 0) { p.flA = p.aim; return; }
    p.flA = (p.flA || 0) + dt * (5 + 9 * k); const R = (12 + 24 * k) * Math.sqrt(S.size), bx = p.x + Math.cos(p.flA) * R, by = p.y + Math.sin(p.flA) * R * .85, br = 5 * Math.sqrt(S.size); p.flB = { x: bx, y: by, r: br };
    for (const e of liveFoes()) { if (dist(e.x, e.y, bx, by) > e.r + br) continue; e.flCd = e.flCd || 0; if (G.time < e.flCd) continue; e.flCd = G.time + .25;
      hitEnemy(e, w.dmg * S.dmg * wlvMul(w) * (.45 + .9 * k), { melee: true, ka: ang(p.x, p.y, e.x, e.y), knock: w.knock * k, proc: w.proc }); AU.play('hammer', 1.6, .45); starFx(bx, by, 5, col(5), .08); }
    if (k > .4) deflectBullets(p, b => dist(b.x, b.y, bx, by) < br + 3, null, false);
    if (held && every(G.time, dt, .3)) AU.play('whirl', .8 + k * .6, .4); },
};
function drawHoldFx(p, cx, cy) { const w = WEAPONS[p.weapons[p.wi]]; if (!w || !w.hold) return; const x = p.x - cx, y = p.y - cy - 2;
  if (w.kind === 'aegis' && p.aegisOn) { const R = 15 * Math.sqrt(G.S.size), hpk = (p.aegisHp || 0) / 12; ctx.strokeStyle = hpk < .3 && ((G.time * 12) | 0) % 2 ? C.red : '#bfe8ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, R, p.aim - .85, p.aim + .85); ctx.stroke(); ctx.strokeStyle = col(5); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, R + 1, p.aim - .6, p.aim + .6); ctx.stroke(); }
  if (w.kind === 'aegis' && p.aegisBrk > 0) for (let i = 0; i < 3; i++) rect(x + Math.cos(G.time * 6 + i * 2) * 7, y - 12, 1, 1, C.frost);
  if (w.kind === 'vacuum' && p.vacOn) { const L4 = 64 * Math.sqrt(G.S.size); ctx.globalAlpha = .12; ctx.fillStyle = C.violet; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, L4, p.aim - .55, p.aim + .55); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; }
  if (w.kind === 'vacuum' && p.vacN) for (let i = 0; i < Math.min(12, p.vacN); i++) { const aa = G.time * 4 + i / Math.min(12, p.vacN) * 6.283; rect(x + Math.cos(aa) * 9, y + Math.sin(aa) * 6, 1, 1, C.violet); }
  if (w.kind === 'flail' && p.flB && p.flK > 0) { const b = p.flB, bx = b.x - cx, by = b.y - cy, n = 6; for (let i = 1; i < n; i++) rect(lerp(x, bx, i / n), lerp(y, by, i / n), 1, 1, col(4));
    disc(bx, by, b.r + 1, col(0)); disc(bx, by, b.r, col(4)); for (let i = 0; i < 6; i++) { const aa = G.time * 10 + i * 1.05; rect(bx + Math.cos(aa) * (b.r + 1) - .5, by + Math.sin(aa) * (b.r + 1) - .5, 2, 2, col(5)); } rect(bx - 1, by - 1, 2, 2, C.orange); } }
