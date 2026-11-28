// ===== ACHROMA enemies III: six more common infected and four special infected =====
// common: runner, bloater, screamer, bone thrower, fly swarm, burrower (they join the floor pools)
// special: the tongue, the pouncer, the spitter, the weeper (one may join the last wave of a room from floor 2; health bar and name)
'use strict';
Object.assign(ESPR, {
  runner: ['..33.....', '.3443....', '.34r3....', '..34433..', '..3p443..', '.3.3443..', '3..3..3..', '..3....3.', '.3......3'],
  bloater: ['...3333...', '..344443..', '.34r44r43.', '3444ll4443', '34l4444l43', '344p44p443', '3444ll4443', '.34444443.', '..3.33.3..', '.33....33.'],
  screamer: ['..33333..', '.3444443.', '.34r4r43.', '.3400043.', '..30p03..', '..34443..', '.344p443.', '3.34443.3', '..3...3..', '.33...33.'],
  boneshot: ['...333....', '..34443...', '..344r3.w.', '...333.ww.', '.3444ww...', '34p44w43..', '.344443...', '..34443...', '..3...3...', '.33...33..'],
  swarm: ['l.....l', '.l.3.l.', '..343..', '.34r43.', '..343..', '.l...l.'],
  digger: ['....333....', '...34443...', '..344r443..', '.34444444o.', '3444p4444oo', '34444444443', '.344p44443.', '..3333333..', '.3.3.3.3.3.'],
  tongue: ['...33333...', '..3444443..', '..34r4r43..', '..3444443..', '...3ppp3...', '.334444433.', '3444p444443', '3.3444443.3', '..34...43..', '..3.....3..', '.33.....33.'],
  pouncer: ['...333....', '..35553...', '..3r5r3...', '..35553...', '.3444443..', '34p4444433', '.344p4443.', '.3444443..', '3.3...3.3.', '3........3'],
  spitter: ['....333....', '...3lll3...', '...3r4r3...', '...34l43...', '....3l3....', '....343....', '..3444443..', '.344l4l443.', '.3444p4443.', '..3444443..', '..3.....3..', '.33.....33.'],
  weeper: ['....333....', '...3yyy3...', '..3yrryy3..', '..3yyyyy3..', '.3y3444y3..', '.3y44444y3.', '3y4444444y3', '.3444p4443.', '..3444443..', '.3.3...3.3.'],
});
const I3 = (n, d) => [n, d];
Object.assign(ETYPES, {
  runner: { hp: 11, r: 4, spd: 92, cost: 1, ink: 2, contact: 1, info: I3(N4('RUNNER', '疾奔者', 'ランナー', '疾奔者'), N4('FRESH. THE MUSCLES HAVE NOT ROTTED YET. IT ZIGZAGS IN AND LUNGES THE LAST STEP.', '剛轉化不久，肌肉還沒腐爛。它會蛇行逼近，最後一步猛撲過來。', '転化して間もなく、筋肉はまだ腐っていない。蛇行して近づき、最後の一歩で飛びかかる。', '刚转化不久，肌肉还没腐烂。它会蛇行逼近，最后一步猛扑过来。')) },
  bloater: { hp: 40, r: 7, spd: 22, cost: 2, ink: 3, contact: 1, heavy: .5, info: I3(N4('BLOATER', '腐脹者', '膨張体', '腐胀者'), N4('SWOLLEN WITH GAS. IT LEAKS SLOW BUBBLES, AND WHEN IT BURSTS THE CLOUD LINGERS.', '體內充滿腐氣，會滲出緩慢的氣泡，爆開後毒雲會停留一陣子。', '腐敗ガスで膨れている。遅い泡を漏らし、破裂すると毒の雲が残る。', '体内充满腐气，会渗出缓慢的气泡，爆开后毒云会停留一阵子。')) },
  screamer: { hp: 18, r: 5, spd: 30, cost: 3, ink: 4, info: I3(N4('SCREAMER', '尖嘯者', '叫ぶもの', '尖啸者'), N4('ITS THROAT SPLIT OPEN. THE SHRIEK SENDS OUT RINGS AND DRIVES THE OTHERS INTO A FRENZY.', '喉嚨整個裂開。它的尖嘯會擴散出彈環，並讓周圍的感染體陷入狂暴。', '喉が裂けている。叫び声は弾の輪を放ち、周囲の感染体を狂乱させる。', '喉咙整个裂开。它的尖啸会扩散出弹环，并让周围的感染体陷入狂暴。')) },
  boneshot: { hp: 20, r: 5, spd: 30, cost: 2, ink: 3, info: I3(N4('BONE THROWER', '骨刺投手', '骨投げ', '骨刺投手'), N4('IT BREAKS OFF ITS OWN RIBS AND THROWS THEM. WHERE THEY LAND, THEY SHATTER.', '它折下自己的肋骨扔出去，落地時碎成一圈骨片。', '自分の肋骨を折って投げる。落ちた所で砕け散る。', '它折下自己的肋骨扔出去，落地时碎成一圈骨片。')) },
  swarm: { hp: 5, r: 3, spd: 70, cost: 1, ink: 1, contact: 1, fly: true, info: I3(N4('FLY SWARM', '寄生蠅群', '寄生蝿', '寄生蝇群'), N4('A KNOT OF FLIES AROUND SOMETHING THAT USED TO BE A HEAD. IT DARTS IN SHORT, JERKING BURSTS.', '一團蒼蠅圍著某個曾經是頭顱的東西，忽快忽停地亂竄。', 'かつて頭だった何かにたかる蝿の塊。小刻みに素早く飛び回る。', '一团苍蝇围着某个曾经是头颅的东西，忽快忽停地乱窜。')) },
  digger: { hp: 28, r: 6, spd: 75, cost: 3, ink: 4, contact: 1, info: I3(N4('BURROWER', '掘地者', '穴掘り', '掘地者'), N4('IT MOVES UNDER THE FLOOR. WATCH FOR THE CRACKING GROUND: THAT IS WHERE IT COMES UP.', '它在地板下移動。注意地面龜裂的地方，那就是它鑽出來的位置。', '床下を移動する。地面が割れる所に注意。そこから出てくる。', '它在地板下移动。注意地面龟裂的地方，那就是它钻出来的位置。')) },
  tongue: { hp: 70, r: 6, spd: 26, cost: 0, ink: 10, special: true, scale: 1.25, heavy: .4, info: I3(N4('THE TONGUE', '拖拽者', '舌の化物', '拖拽者'), N4('SPECIAL INFECTED. ITS TONGUE REACHES ACROSS THE ROOM AND DRAGS YOU IN. DASH OR HURT IT TO BREAK FREE.', '特殊感染體。舌頭能伸過整個房間把你拖過去，衝刺或對它造成傷害即可掙脫。', '特殊感染体。部屋の向こうから舌で引き寄せる。ダッシュか攻撃で振りほどける。', '特殊感染体。舌头能伸过整个房间把你拖过去，冲刺或对它造成伤害即可挣脱。')) },
  pouncer: { hp: 60, r: 5, spd: 45, cost: 0, ink: 10, special: true, scale: 1.25, info: I3(N4('THE POUNCER', '獵撲者', '飛びかかるもの', '猎扑者'), N4('SPECIAL INFECTED. IT CROUCHES, MARKS WHERE YOU STAND, AND LEAPS THERE. GET OUT OF THE CIRCLE.', '特殊感染體。它會伏低身子鎖定你的位置，然後撲過去。快離開那個圈。', '特殊感染体。身を屈めて位置を定め、そこへ跳ぶ。円の外へ出ろ。', '特殊感染体。它会伏低身子锁定你的位置，然后扑过去。快离开那个圈。')) },
  spitter: { hp: 55, r: 6, spd: 30, cost: 0, ink: 10, special: true, scale: 1.25, info: I3(N4('THE SPITTER', '噴吐者', '吐くもの', '喷吐者'), N4('SPECIAL INFECTED. IT SPITS ACID THAT POOLS ON THE FLOOR FOR A WHILE, AND IT BURSTS INTO ONE WHEN IT DIES.', '特殊感染體。它吐出的酸液會在地上積成一灘並持續一陣子，死時也會爆出一灘。', '特殊感染体。床に溜まる酸を吐き、死ぬ時にも酸を撒く。', '特殊感染体。它吐出的酸液会在地上积成一滩并持续一阵子，死时也会爆出一滩。')) },
  weeper: { hp: 110, r: 6, spd: 0, cost: 0, ink: 14, special: true, scale: 1.25, info: I3(N4('THE WEEPER', '哭泣者', '泣くもの', '哭泣者'), N4('SPECIAL INFECTED. SHE SITS AND CRIES. GET TOO CLOSE, OR HURT HER, AND SHE WILL NOT STOP UNTIL ONE OF YOU IS DEAD.', '特殊感染體。她只是坐著哭泣。靠得太近或傷了她，她就會追殺到其中一方死去為止。', '特殊感染体。座って泣いている。近づくか傷つけると、どちらかが死ぬまで止まらない。', '特殊感染体。她只是坐着哭泣。靠得太近或伤了她，她就会追杀到其中一方死去为止。')) },
});
[['runner', 'runner', 'swarm'], ['runner', 'swarm', 'bloater', 'boneshot'], ['runner', 'bloater', 'boneshot', 'screamer', 'digger'], ['runner', 'swarm', 'bloater', 'boneshot', 'screamer', 'digger'], ['runner', 'swarm', 'bloater', 'boneshot', 'screamer', 'digger', 'digger']].forEach((add, f) => POOLS[f].push(...add));
const SPEC_INF = [[], ['tongue', 'spitter'], ['tongue', 'spitter', 'pouncer'], ['tongue', 'spitter', 'pouncer', 'weeper'], ['tongue', 'spitter', 'pouncer', 'weeper']];
// one special infected may join the last wave of a combat room (from the second floor on)
const _makeWaves3 = makeWaves; makeWaves = function (r) { const w = _makeWaves3(r), fi = Math.min(4, G.floor || 0), pool = SPEC_INF[fi];
  if (pool.length && w.length && Math.random() < .3 + .08 * fi) w[w.length - 1].push({ t: choice(pool) }); return w; };

// ---------------- foe effects: thrown things, pools, clouds, the tongue ----------------
function foeFx(o) { (G.foeFx || (G.foeFx = [])).push(Object.assign({ t: 0 }, o)); }
const _updHz3 = updateHazards; updateHazards = function (dt) { _updHz3(dt); const L3 = G.foeFx; if (!L3) return; for (let i = L3.length - 1; i >= 0; i--) { const f = L3[i]; f.t += dt; if (f.u(f, dt)) L3.splice(i, 1); } };
const _drawHz3 = drawHazards; drawHazards = function (cx, cy) { if (G.foeFx) for (const f of G.foeFx) if (f.under) f.dr(f, cx, cy); _drawHz3(cx, cy); if (G.foeFx) for (const f of G.foeFx) if (!f.under) f.dr(f, cx, cy); };
const hurtFrom = (e, x, y) => { G.hitSrc = e; try { return hurtPlayer(1, x, y); } finally { G.hitSrc = null; } };
function foeLob(own, sx, sy, tx, ty, dur, c, warnR, land) {
  foeFx({ own, sx, sy, tx, ty, dur, c, warnR, land, u(q) { if (q.t >= q.dur) { q.land(q); return true; } return false; },
    dr(q, cx, cy) { const k = Math.min(1, q.t / q.dur), x = lerp(q.sx, q.tx, k) - cx, y = lerp(q.sy, q.ty, k) - cy - Math.sin(k * Math.PI) * 30, wx = q.tx - cx, wy = q.ty - cy;
      ringC(wx, wy, q.warnR, ((G.time * 12) | 0) % 2 ? q.c : col(3), 1); ringC(wx, wy, Math.max(1, q.warnR * (1 - k)), q.c, 1); ctx.globalAlpha = .5; disc(lerp(q.sx, q.tx, k) - cx, lerp(q.sy, q.ty, k) - cy, 2, col(0)); ctx.globalAlpha = 1;
      disc(x, y, 3, col(0)); disc(x, y, 2, q.c); } });
}
function acidPool(own, x, y, R, life) { AU.play('venom', .5, .6); splat(x, y, '#3a4a10', 8, R * .6);
  foeFx({ own, x, y, R, life, max: life, under: true, seed: rand(0, 9), u(q, dt) { q.life -= dt; const p = G.p; if (q.t > .3 && p.alive && dist(p.x, p.y, q.x, q.y) < q.R + p.r - 4) hurtFrom(q.own, q.x, q.y);
      if (Math.random() < .2) part({ x: q.x + rand(-q.R, q.R) * .7, y: q.y + rand(-q.R, q.R) * .5, vx: 0, vy: -12, life: .5, max: .5, c: '#bfdc4a', s: 1 }); return q.life <= 0; },
    dr(q, cx, cy) { const x = q.x - cx, y = q.y - cy, k = Math.min(1, q.life / .6, q.t * 5); ctx.globalAlpha = .55 * k; for (let i = 0; i < 5; i++) { const a = q.seed + i * 1.26; disc(x + Math.cos(a) * q.R * .4, y + Math.sin(a) * q.R * .28, q.R * .5, '#5a7a18'); }
      ctx.globalAlpha = .75 * k; disc(x, y, q.R * .5, '#8aaa28'); ctx.globalAlpha = k; if (((G.time * 3 + q.seed) | 0) % 2) rect(x - 2, y - 1, 2, 1, '#e8f8a0'); ringC(x, y, q.R, '#3a4a10', 1); ctx.globalAlpha = 1; } });
}
function gasCloud(own, x, y, R, life) { AU.play('vortex', .6, .5);
  foeFx({ own, x, y, R, life, puffs: Array.from({ length: 9 }, () => ({ a: rand(0, 6.28), r: rand(0, 1), s: rand(.5, 1), v: rand(-.5, .5) })), u(q, dt) { q.life -= dt; const p = G.p; if (q.t > .4 && p.alive && dist(p.x, p.y, q.x, q.y) < q.R * .8 + p.r) hurtFrom(q.own, q.x, q.y); return q.life <= 0; },
    dr(q, cx, cy) { const x = q.x - cx, y = q.y - cy, k = Math.min(1, q.life / .8, q.t * 3); for (const pf of q.puffs) { pf.a += pf.v * FRAME_DT; const rr = pf.r * q.R * .7; ctx.globalAlpha = .2 * k; disc(x + Math.cos(pf.a) * rr, y + Math.sin(pf.a) * rr * .7, q.R * .45 * pf.s, '#7a8a2a'); }
      ctx.globalAlpha = .4 * k; ringC(x, y, q.R * .8, '#bfdc4a', 1); ctx.globalAlpha = 1; } });
}
ETYPES.bloater.onDeath = e => { burst(e.x, e.y, 20, C.lime, 120, .5, 2); splat(e.x, e.y, '#4a5a18', 18, 12); gasCloud(null, e.x, e.y, 32, 4); };
ETYPES.spitter.onDeath = e => acidPool(null, e.x, e.y, 24, 4);

// ---------------- behaviour ----------------
Object.assign(AI, {
  runner(e, dt, d, a, sp) {
    if (e.st === 'lunge') { e.face = e.la; const hit = moveBody(e, Math.cos(e.la) * 240 * dt, Math.sin(e.la) * 240 * dt); if (hit || e.t > .28) { e.st = 'rest'; e.t = 0; } return; }
    if (e.st === 'rest') { if (e.t > .55) { e.st = 'idle'; e.cd = rand(.6, 1.1); } return; }
    e.face = a; const z = Math.sin(e.t * 7 + e.wob) * 26; steer(e, G.p.x - Math.sin(a) * z, G.p.y + Math.cos(a) * z, sp, dt);
    if (e.cd <= 0 && d < 62) { e.st = 'lunge'; e.t = 0; e.la = a; AU.play('dash', 1.5, .35); } },
  bloater(e, dt, d, a, sp) { e.face = a; steer(e, G.p.x, G.p.y, sp, dt);
    if (e.cd <= 0) { e.cd = rand(2.2, 3); for (let i = 0; i < eb(3); i++) eshot(e.x, e.y, rand(0, 6.28), rand(28, 46), { c: C.lime, r: 3.5, life: 4 }); AU.play('venom', .6, .4); } },
  screamer(e, dt, d, a, sp) { e.face = a;
    if (e.st === 'shriek') { if (e.t > .65) { AU.play('roar', 1.8, .6); shake(.1); for (let k = 0; k < 2; k++) G.later.push({ t: k * .25, f: () => { if (!e.dead) ringShot(e.x, e.y, eb(14), 66 + k * 22, { c: C.violet }, rand(0, 6.28)); } });
        for (const o of G.enemies) if (!o.dead && o !== e && !o.boss && dist(o.x, o.y, e.x, e.y) < 130) o.buffT = Math.max(o.buffT || 0, 2); ringFx(e.x, e.y, 130, C.violet, .5, 2); e.st = 'idle'; e.cd = rand(3.6, 4.6); } return; }
    keepAt(e, dt, d, a, sp, 150);
    if (e.cd <= 0 && d < 230) { e.st = 'shriek'; e.t = 0; AU.play('telegraph', 1.4); } },
  boneshot(e, dt, d, a, sp) { e.face = a;
    if (e.st === 'throw') { if (e.t > .5) { const own = e; foeLob(e, e.x, e.y - 4, G.p.x, G.p.y, .8, '#d8ccb0', 16, q => { AU.play('crate', 1.3, .5); burst(q.tx, q.ty, 10, '#d8ccb0', 100, .3); ringShot(q.tx, q.ty, eb(6), 95, { c: '#d8ccb0', r: 2.5 }, rand(0, 6.28)); if (dist(q.tx, q.ty, G.p.x, G.p.y) < 14 + G.p.r) hurtFrom(own, q.tx, q.ty); });
        AU.play('lob', 1.2, .6); e.st = 'idle'; e.cd = rand(2.4, 3.2); } return; }
    keepAt(e, dt, d, a, sp, 140);
    if (e.cd <= 0 && d < 230) { e.st = 'throw'; e.t = 0; } },
  swarm(e, dt, d, a, sp) { e.face = a;
    if (e.st === 'dart') { moveBody(e, e.dvx * dt, e.dvy * dt); if (e.t > .3) { e.st = 'hover'; e.t = 0; e.hv = rand(.25, .5); } return; }
    if (e.st === 'hover') { if (e.t > e.hv) { const tx = G.p.x + rand(-32, 32), ty = G.p.y + rand(-32, 32), aa = ang(e.x, e.y, tx, ty); e.dvx = Math.cos(aa) * 190; e.dvy = Math.sin(aa) * 190; e.st = 'dart'; e.t = 0; } return; }
    e.st = 'hover'; e.t = 0; e.hv = rand(.2, .5); },
  digger(e, dt, d, a, sp) {
    if (e.st === 'idle' || e.st === 'under') { if (e.st !== 'under') { e.st = 'under'; e.t = 0; e.hide = true; AU.play('crate', .5, .4); }
      e.inv = .1; e.contact = 0; steer(e, G.p.x, G.p.y, sp, dt); if (Math.random() < .6) part({ x: e.x + rand(-4, 4), y: e.y + rand(-2, 2), vx: rand(-20, 20), vy: rand(-30, -10), life: .4, max: .4, c: choice(['#4a3a2a', '#6a5a40', col(3)]), s: 1 });
      if (e.t > 2.4 || d < 26) { e.st = 'rise'; e.t = 0; mech({ type: 'circle', x: e.x, y: e.y, r: 24, warn: .75, owner: e, cancelOnDeath: true, small: true }); AU.play('telegraph', .8); } return; }
    if (e.st === 'rise') { e.inv = .1; if (e.t > .75) { e.hide = false; e.contact = 1; e.st = 'surface'; e.t = 0; ringShot(e.x, e.y, eb(10), 80, { c: C.orange }, rand(0, 6)); burst(e.x, e.y, 16, '#5a4a3a', 120, .4, 2); splat(e.x, e.y, '#2a2018', 12, 12); shake(.1); AU.play('slam', 1.2, .6); } return; }
    if (e.st === 'surface') { e.face = a; if (every(e.t, dt, .8)) { for (let i = -1; i <= 1; i++) eshot(e.x, e.y, a + i * .2, 110, { c: C.orange }); AU.play('ebullet'); } if (e.t > 2.6) e.st = 'idle'; return; }
    e.st = 'idle'; },
  // ---- special infected ----
  tongue(e, dt, d, a, sp) {
    if (e.st === 'aim') { if (e.t < .55) e.face = a; if (e.t > .8) { e.st = 'lash'; e.t = 0; tongueLash(e); AU.play('whip', .7); } return; }
    if (e.st === 'lash') return;
    if (Math.random() < .15) part({ x: e.x + rand(-4, 4), y: e.y - 8, vx: rand(-8, 8), vy: -18, life: .9, max: .9, c: col(3), s: 2 });
    keepAt(e, dt, d, a, sp, 140); e.face = a;
    if (e.cd <= 0 && d < 200 && los(e.x, e.y, G.p.x, G.p.y)) { e.st = 'aim'; e.t = 0; AU.play('telegraph', .7); } },
  pouncer(e, dt, d, a, sp) {
    if (e.st === 'crouch') { e.face = ang(e.x, e.y, e.tx, e.ty); if (e.t > .7) { e.st = 'leap'; e.t = 0; e.sx = e.x; e.sy = e.y; AU.play('dash', .8); } return; }
    if (e.st === 'leap') { const k = Math.min(1, e.t / .45); moveBody(e, lerp(e.sx, e.tx, k) - e.x, lerp(e.sy, e.ty, k) - e.y); e.hop = Math.sin(k * Math.PI) * 22;
      if (k >= 1) { e.hop = 0; e.st = 'rest'; e.t = 0; ringShot(e.x, e.y, eb(10), 90, { c: C.red }, rand(0, 6)); burst(e.x, e.y, 14, col(4), 110, .35); splat(e.x, e.y, col(0), 10, 10); shake(.15); AU.play('slam', 1.1, .7); } return; }
    if (e.st === 'rest') { if (e.t > .9) { e.st = 'idle'; e.cd = rand(1.8, 2.6); } return; }
    e.face = a; keepAt(e, dt, d, a, sp, 110);
    if (e.cd <= 0 && d < 210 && d > 40) { let tx = G.p.x, ty = G.p.y; if (collides(tx, ty, e.r, false)) { const f = freeSpot(tx, ty, e.r, false); if (f) [tx, ty] = f; } e.tx = tx; e.ty = ty; e.st = 'crouch'; e.t = 0;
      mech({ type: 'circle', x: tx, y: ty, r: 20, warn: 1.15, owner: e, cancelOnDeath: true, small: true }); AU.play('telegraph', 1.1); } },
  spitter(e, dt, d, a, sp) { e.face = a;
    if (e.st === 'spit') { if (e.t > .55) { foeLob(e, e.x, e.y - 8, G.p.x, G.p.y, .9, '#9aca28', 26, q => acidPool(q.own, q.tx, q.ty, 26, 5)); AU.play('venom', .7); e.st = 'idle'; e.cd = rand(2.8, 3.6); } return; }
    keepAt(e, dt, d, a, sp, 160);
    if (e.cd <= 0 && d < 240) { e.st = 'spit'; e.t = 0; AU.play('cast', .6, .5); } },
  weeper(e, dt, d, a, sp) {
    if (!e.rage) { e.contact = 0; if (Math.random() < dt * 1.2) part({ x: e.x + rand(-2, 2), y: e.y - 6, vx: rand(-6, 6), vy: 14, life: .5, max: .5, c: '#a4cfe0', s: 1 });
      if ((G.time - (e.sobT || 0)) > 3.5 && d < 200) { e.sobT = G.time; AU.play('ink', .45, .35); }
      if (d < 70 || e.hp < e.maxHp) { e.rage = true; e.st = 'scream'; e.t = 0; AU.play('roar', 1.5); flash(C.red, .2, true); shake(.25, true); } return; }
    e.contact = 1;
    if (e.st === 'scream') { if (e.t > .5) { e.st = 'chase'; e.t = 0; } return; }
    if (e.st === 'slash') { e.face = e.sa; if (e.t > .22 && !e.did) { e.did = true; for (let i = -2; i <= 2; i++) eshot(e.x, e.y, e.sa + i * .22, 150, { c: C.red }); moveBody(e, Math.cos(e.sa) * 10, Math.sin(e.sa) * 10); AU.play('slash', .8); }
      if (e.t > .55) { e.did = false; e.st = 'chase'; e.t = 0; } return; }
    steer(e, G.p.x, G.p.y, 150 * (e.slowT > 0 ? e.slowMul : 1), dt); e.face = a;
    if (d < 34 || e.t > 1.6) { e.st = 'slash'; e.t = 0; e.sa = a; AU.play('telegraph', 1.5, .6); } },
});
// the tongue shoots out along its aim; touching you it latches on and reels you in until you dash, hurt it enough, or 1.8s pass
function tongueLash(e) {
  foeFx({ own: e, a: e.face, len: 0, st: 'out',
    u(q, dt) { const e2 = q.own, p = G.p, gone = e2.dead || !G.enemies.includes(e2);
      if (gone) { if (p.grabbed === q) p.grabbed = null; return true; }
      if (q.st === 'out') { q.len += 360 * dt; const tx = e2.x + Math.cos(q.a) * q.len, ty = e2.y + Math.sin(q.a) * q.len;
        if (shotBlocked(tx, ty) || q.len > 190) q.st = 'back';
        else if (p.alive && p.dashT <= 0 && dist(tx, ty, p.x, p.y) < p.r + 4) { q.st = 'grab'; q.gt = 0; q.hp0 = e2.hp; p.grabbed = q; hurtFrom(e2, e2.x, e2.y); AU.play('stick', .5); } return false; }
      if (q.st === 'grab') { q.gt += dt; const d = dist(p.x, p.y, e2.x, e2.y); q.a = ang(e2.x, e2.y, p.x, p.y); q.len = d;
        if (d > 16) moveBody(p, (e2.x - p.x) / d * 125 * dt, (e2.y - p.y) / d * 125 * dt);
        if (d < 18 && (q.bite || 0) < G.time) { q.bite = G.time + 1; hurtFrom(e2, e2.x, e2.y); }
        if (p.dashT > 0 || e2.hp < q.hp0 - e2.maxHp * .15 || q.gt > 1.8 || !p.alive) { q.st = 'back'; p.grabbed = null; burst(p.x, p.y, 6, '#c06070', 80, .3); } return false; }
      q.len -= 420 * dt; if (q.len <= 0) { e2.st = 'idle'; e2.cd = rand(3.5, 4.5); return true; } return false; },
    dr(q, cx, cy) { const e2 = q.own, x = e2.x - cx, y = e2.y - cy - 4, n = Math.max(2, Math.floor(q.len / 3));
      for (let i = 0; i <= n; i++) { const k = i / n, wv = Math.sin(k * 10 + G.time * 18) * (q.st === 'grab' ? .6 : 1.5) * Math.sin(k * Math.PI); const px = x + Math.cos(q.a) * q.len * k - Math.sin(q.a) * wv, py = y + Math.sin(q.a) * q.len * k + Math.cos(q.a) * wv; rect(px - 1, py - 1, 2, 2, '#3a0a14'); rect(px - .5, py - .5, 1, 1, '#c06070'); }
      const tx = x + Math.cos(q.a) * q.len, ty = y + Math.sin(q.a) * q.len; disc(tx, ty, 2.5, '#3a0a14'); disc(tx, ty, 1.5, '#d87080'); } });
}
// a grabbed hero cannot dash away from the pull by walking; the move code checks p.grabbed only for this
const _drawEnemyExtra3 = drawEnemyExtra; drawEnemyExtra = function (e, x, cyb) { _drawEnemyExtra3(e, x, cyb);
  if (e.sleepT > G.time) for (let i = 0; i < 3; i++) { const q = (G.time * .7 + i / 3) % 1; ctx.globalAlpha = 1 - q; text('z', x + 4 + q * 6, cyb - 10 - q * 12, C.violet, 1); ctx.globalAlpha = 1; }
  if (e.type === 'tongue' && e.st === 'aim') { ctx.globalAlpha = e.t > .55 ? (((e.t * 30) | 0) % 2 ? 1 : .3) : .45; line(x, cyb, x + Math.cos(e.face) * 190, cyb + Math.sin(e.face) * 190, '#d87080', 1); ctx.globalAlpha = 1; }
  if (e.type === 'screamer' && e.st === 'shriek') { ctx.globalAlpha = .6; ringC(x, cyb, 6 + e.t * 30, C.violet, 1); ctx.globalAlpha = 1; }
  if (e.type === 'pouncer' && e.st === 'crouch') rect(x - 1, cyb - 8, 3, 3, ((G.time * 14) | 0) % 2 ? C.red : col(5));
  if (e.type === 'spitter' && e.st === 'spit') { disc(x + Math.cos(e.face) * 4, cyb - 6, 2 + e.t * 3, '#9aca28'); }
  if (e.type === 'weeper' && !e.rage) { ctx.globalAlpha = .5 + Math.sin(G.time * 3) * .2; ringC(x, cyb + 4, 70, '#3a3a44', 1); ctx.globalAlpha = 1; }
  if (e.type === 'weeper' && e.rage) { ctx.globalAlpha = .35 + Math.sin(G.time * 12) * .2; disc(x, cyb, 9, '#ff2a3a'); ctx.globalAlpha = 1; }
  if (e.type === 'bloater' && Math.random() < .08) part({ x: e.x + rand(-5, 5), y: e.y - rand(4, 10), vx: 0, vy: -10, life: .6, max: .6, c: C.lime, s: 1 }); };
// the burrower under the floor: a moving mound of cracked earth
function drawBurrow(e, x, y) { const r = e.st === 'rise' ? 8 + Math.sin(G.time * 30) : 6; ctx.globalAlpha = .7; disc(x, y + 2, r, '#2a2018'); ctx.globalAlpha = 1;
  for (let i = 0; i < 5; i++) { const a = i * 1.26 + e.wob, rr = r * .7; rect(x + Math.cos(a) * rr - 1, y + 2 + Math.sin(a) * rr * .5 - 1, 2, 2, i % 2 ? '#6a5a40' : '#4a3a2a'); }
  if (e.st === 'rise') for (let i = 0; i < 4; i++) pxLine(x, y + 2, x + Math.cos(i * 1.57 + .4) * 10, y + 2 + Math.sin(i * 1.57 + .4) * 6, col(0)); }
// special infected: a name and a health bar like the champions (smaller, in their colour of danger)
const _drawChampBars3 = drawChampBars; drawChampBars = function (cx, cy) { _drawChampBars3(cx, cy);
  for (const e of G.enemies) { if (!e.special || e.dead || e.spawnT > 0 || e.hide) continue; const x = Math.round(e.x - cx), y = Math.round(e.y - cy - e.r * (e.scale || 1) - 18), w = 30, f = Math.max(0, e.hp / e.maxHp);
    if (x < -40 || x > W + 40 || y < -20 || y > H + 20) continue;
    rect(x - w / 2 - 1, y - 1, w + 2, 4, col(0)); rect(x - w / 2, y, w, 2, '#2d2925'); rect(x - w / 2, y, w * f, 2, '#c8503a');
    const nm = tr(ETYPES[e.type].info[0]); textS(nm, x, y - (isCJK(nm) ? 10 : 8), '#e8a090', 1, 'center'); } };
