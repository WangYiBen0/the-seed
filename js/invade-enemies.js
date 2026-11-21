// Invasion has its own spawn, movement, attack and cleanup rules.
// Shared sprites / hit effects are used without changing exploration definitions.
'use strict';
// Only player-bought Bait/Lure spawn these; neither joins normal wave pools.
IV_ENEMIES.lamprey={spr:'charger',hp:30,growth:15,speed:[70,70],damage:1,dmgGrowth:.75,shotGrowth:.75,ai:'lamprey',mat:1,heavy:.05};
IV_ENEMIES.looter={spr:'runner',hp:5,growth:30,speed:[61,82],damage:1,dmgGrowth:.85,ai:'flee',mat:8};
const ivDifficulty = (id = G.diff) => IV_DIFFICULTY[id] || IV_DIFFICULTY.classic;
function ivWaveDef(w = G.iv.wave) { return IV_WAVES[clamp(w - 1, 0, 19)]; }
function ivEventSchedule() { const n = ivDifficulty().events, events = [], elites = shuffle(['rhino', 'caster', 'slasher']);
  for (let i = 0; i < n; i++) events.push({ wave: choice([[11, 12], [14, 14], [17, 18]][i]), kind: i === 2 || Math.random() >= .4 ? 'elite' : 'horde', elite: elites[i] });
  return events; }
function ivWavePool() { const iv = G.iv, pool = Object.assign({}, ivWaveDef().pool), d = ivDifficulty().danger;
  if (d >= 4 && iv.wave >= 4 && iv.wave < 10) { pool.baby -= 6; pool.helmet = 6; }
  if (d >= 4 && iv.wave >= 5 && iv.wave < 18) { pool.baby -= 3; pool.hornedCharger = 3; }
  if (d >= 3 && iv.wave >= 13) { pool.baby -= 2; pool.tentacle = 2; }
  return pool; }
function ivPickEnemy() { const pool = ivWavePool(), n = Object.values(pool).reduce((a, b) => a + b, 0); let r = Math.random() * n;
  for (const id in pool) { r -= pool[id]; if (r < 0) return id; } return 'baby'; }
function ivLiving() { return G.enemies.filter(e => !e.dead); }
function ivShooterCount() { return ivLiving().filter(e => e.ivDef && e.ivDef.ranged).length; }
function ivEnemyCap() { return Math.max(4, Math.round((ivWaveDef().cap + (G.iv.event && G.iv.event.kind === 'horde' ? 18 : 0)) * Math.max(.1,1+ivStats().enemies/100))); }
function ivFree(minD = 110) { const r = G.ivRoom, p = G.p; let best = null, bd = -1;
  for (let k = 0; k < 40; k++) { const q = [randi(r.x0 + 2, r.x0 + r.w - 3) * T + 8, randi(r.y0 + 2, r.y0 + r.h - 3) * T + 8], d = dist(q[0], q[1], p.x, p.y);
    if (d > minD) return q; if (d > bd) { bd = d; best = q; } }
  return best; }
function ivSpawn(id, x, y) { const iv = G.iv, def = IV_ENEMIES[id]; if (!def || iv.phase !== 'fight' || ivLiving().length >= ivEnemyCap()) return null;
  if (def.ranged && ivShooterCount() >= ivWaveDef().shooters) return null;
  const diff = ivDifficulty(), w = iv.wave - 1;
  const e = spawnEnemy(def.spr, x, y, { room: G.ivRoom, elite: false, boss: false, onDeath: null, shield: false, affix: null, ink: 1e-9 });
  Object.assign(e, { ivKind: id, ivDef: def, hp: (def.hp + def.growth * w) * diff.hp, spd: rand(...def.speed),
    ivDamage: (def.damage + def.dmgGrowth * w) * diff.damage, ivShotDamage: (def.damage + (def.shotGrowth || def.dmgGrowth) * w) * diff.damage,
    ivAge: 0, ivBuffT: 0, ivReactCd: 0, t: 0, cd: rand(1.2, 2), st: 'idle', heavy: def.heavy === undefined ? 1 : def.heavy,
    contact: 1, hide: false, onDeath: ivEnemyDeath, fly: id === 'fly' });
  const st=ivStats(); e.hp*=Math.max(.1,1+st.enemyHp/100); const damage=1+.5*(iv.waveMods?.peacock||0);e.ivDamage*=damage;e.ivShotDamage*=damage;
  e.maxHp = e.hp; return e; }
function ivSpawnGroup() { const iv = G.iv, wd = ivWaveDef(), horde = iv.event && iv.event.kind === 'horde';
  const desired=(G.iv.bosses.some(b=>!b.dead)?.6:1)*(wd.count + (horde ? Math.ceil(wd.count * .6) : 0))*Math.max(.1,1+ivStats().enemies/100);
  const count = Math.min(ivEnemyCap() - ivLiving().length, Math.floor(desired)+(Math.random()<desired%1?1:0));
  for (let i = 0; i < count; i++) { let id = horde && i >= wd.count ? choice(['baby', 'chaser']) : ivPickEnemy();
    if (IV_ENEMIES[id].ranged && ivShooterCount() >= wd.shooters) id = 'baby';
    const [x, y] = ivFree(110); ivSpawn(id, x, y); } }
function ivBossName(id) { const n={rhino:['BREACHER','破闸巨体'],caster:['WATCHER','警戒母体'],slasher:['SPORE HOST','孢囊宿主']};if(n[id])return IZ(...n[id]);return id === 'predator' ? IZ('THE HUNTER', '巢穴猎手') : IZ('THE SUMMONER', '巢穴召唤者'); }
function ivSpawnMajor(id, boss) { const iv = G.iv, diff = ivDifficulty(), [x, y] = ivFree(145), type = ({predator:'corehulk',invoker:'seer',rhino:'arcknight',caster:'seer',slasher:'ashbrute'})[id];
  const e = spawnEnemy(type, x, y, { room: G.ivRoom, boss: !!boss, champ: !boss, elite: false, onDeath: null, ink: 1e-9 });
  const milestone=boss&&iv.wave<20,bi=Math.max(0,Math.floor(iv.wave/5)-1);const baseHp = boss ? (milestone?[650,2000,4800][bi]:14000*(diff.bosses===2?.75:1)) : (4500 + Math.max(0, iv.wave - 11) * 450) * (iv.wave <= 12 ? .75 : 1);
  Object.assign(e, { ivKind: id, ivMajor: true, ivAge: 0, ivBuffT: 0, ivReactCd: 0, hp: baseHp * diff.hp, maxHp: baseHp * diff.hp,
    spd: milestone?35:boss ? (id === 'predator' ? 61 : 41) : 51, ivDamage: (boss ? (milestone?[4,8,14][bi]:30) : 1 + (iv.wave - 1) * 1.5) * diff.damage,
    ivShotDamage: (boss ? (milestone?[3,6,10][bi]:23) : 1 + (iv.wave - 1) * 1.2) * diff.damage, r: boss ? 13 : 9, scale: boss ? 2.1 : 1.5,
    t: 0, cd: boss ? 2 : 1.6, st: 'idle', contact: 1, heavy: .1, onDeath: ivEnemyDeath, phase: 0, armorT: 0, def: { name: ivBossName(id), key: 'iv_' + id } });
  e.hp*=Math.max(.1,1+ivStats().enemyHp/100);e.maxHp=e.hp;e.ivDamage*=1+.5*(iv.waveMods?.peacock||0);e.ivShotDamage*=1+.5*(iv.waveMods?.peacock||0);
  if (boss) iv.bosses.push(e); return e; }
function ivSpawnChamp() { const e = ivSpawnMajor(G.iv.event?.elite || choice(['rhino','caster','slasher']), false); AU.play('roar', 1.5, .5); notify(L('iv_elite'), C.gold); return e; }
function ivSpawnBoss() { const iv = G.iv;if(iv.bosses.length)return; const ids = iv.wave<20 ? [[null,'rhino','caster','slasher'][Math.floor(iv.wave/5)]] : ivDifficulty().bosses === 2 ? ['predator', 'invoker'] : [choice(['predator', 'invoker'])];
  for (const id of ids) ivSpawnMajor(id, true); G.boss = iv.bosses[0]; G.bossDead = false; AU.play('roar'); }
function ivEnemyDeath(e) {
  if (!ivOn() || G.iv.phase !== 'fight') return;
  if (e.boss) { G.boss = G.iv.bosses.find(b => !b.dead) || null; G.bossDead = G.iv.bosses.length > 0 && G.iv.bosses.every(b => b.dead); }
  if (e.ivKind === 'spawner') for (let i = 0; i < 3; i++) { const [x, y] = ivFree(85); ivSpawn('junkie', x, y); }
}
function ivShoot(e, a, speed = 85, x = e.x, y = e.y) { if (G.iv.phase !== 'fight') return;
  G.ebullets.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 2.5, life: 4.5, c: e.boss ? C.red : C.orange,
    own: e, ivDamage: e.ivShotDamage * (e.ivBuffT > 0 ? 1.25 : 1) }); }
function ivFan(e, n, spread, speed = 85) { for (let i = 0; i < n; i++) ivShoot(e, e.face + (i - (n - 1) / 2) * spread, speed); }
function ivWarn(e, kind, x, y, r, delay, extra = {}) { G.iv.warnings.push(Object.assign({ own: e, kind, x, y, r, delay, age: 0, damage: e.ivShotDamage }, extra)); }
function ivCharge(e, dt, d, a, sp, dash = 145) {
  if (e.st === 'wind') { if (e.t >= .75) { e.st = 'dash'; e.t = 0; } return; }
  if (e.st === 'dash') { const hit = moveBody(e, Math.cos(e.face) * dash * ivEnemySpeed(e) * dt, Math.sin(e.face) * dash * ivEnemySpeed(e) * dt);
    if (hit || e.t >= .55) { e.st = 'rest'; e.t = 0; } return; }
  if (e.st === 'rest') { if (e.t >= .8) { e.st = 'idle'; e.cd = rand(2.5, 3.5); e.t = 0; } return; }
  const target=ivEnemyTarget(e);steer(e, target.x, target.y, sp, dt); e.face = a;
  if (e.cd <= 0 && d < 190) { e.st = 'wind'; e.t = 0; e.face = a; AU.play('telegraph', .8, .4); }
}
function ivEnemyAI(e, dt) { const p = ivEnemyTarget(e), d = dist(e.x, e.y, p.x, p.y), a = ang(e.x, e.y, p.x, p.y), slow = (e.slowT > 0 ? e.slowMul : 1)*ivEnemySpeed(e);
  const sp = e.spd * slow * (e.ivBuffT > 0 ? 1.35 : 1), role = e.ivDef ? e.ivDef.ai : e.ivKind;
  if(role==='flee'){keepAt(e,dt,d,a,sp,500);return;}
  if(role==='lamprey'){
    if(e.st==='wind'){if(e.t>=.6){e.st='dash';e.t=0;e.ivSideShot=0;}return;}
    if(e.st==='dash'){moveBody(e,Math.cos(e.face)*145*slow*dt,Math.sin(e.face)*145*slow*dt);e.ivSideShot-=dt;if(e.ivSideShot<=0){e.ivSideShot=.15;ivShoot(e,e.face+Math.PI/2,70);ivShoot(e,e.face-Math.PI/2,70);}if(e.t>=.4){e.st='idle';e.cd=.5;}return;}
    steer(e,p.x,p.y,sp,dt);e.face=a;if(e.cd<=0){e.st='wind';e.t=0;}return;
  }
  if (role === 'charge' || role === 'rhino' || (role === 'predator' && e.hp > e.maxHp * .5 && e.ivAge < 45)) { ivCharge(e, dt, d, a, sp, e.ivDef ? e.ivDef.dash : 160); return; }
  e.face = e.st === 'aim' ? e.face : a;
  if (role === 'shoot' || role === 'caster') {
    if (e.st === 'aim') { if (e.t >= .8) { ivFan(e, role === 'caster' ? 3 : 1, .28, e.ivDef ? e.ivDef.shotSpeed : 80); e.st = 'idle'; e.cd = e.ivDef ? e.ivDef.cooldown : 2.4; e.t = 0; } return; }
    keepAt(e, dt, d, a, sp, 120); if (e.cd <= 0 && d < 230) { e.st = 'aim'; e.face = a; e.t = 0; } return; }
  if (role === 'slash' || role === 'slasher') { keepAt(e, dt, d, a, sp, role === 'slasher' ? 70 : 48);
    if (e.cd <= 0 && d < 110) { ivWarn(e, 'slash', p.x, p.y, role === 'slasher' ? 26 : 17, .85); e.cd = role === 'slasher' ? 2.2 : 3; } return; }
  if (role === 'invoker') { const phase = e.ivAge >= 60 || e.hp < e.maxHp * .4 ? 2 : e.ivAge >= 30 || e.hp < e.maxHp * .75 ? 1 : 0;
    steer(e, p.x + Math.cos(e.ivAge * .7) * 130, p.y + Math.sin(e.ivAge * .7) * 90, phase === 2 ? 102 * slow : sp, dt);
    if (e.cd <= 0) { const n = phase ? 10 : 6, off = rand(0, 6.283); for (let i = 0; i < n; i++) { const b = off + i / n * 6.283, r = phase ? 72 : 58;
      ivWarn(e, 'shot', p.x + Math.cos(b) * r, p.y + Math.sin(b) * r, 5, 1, { angle: b, speed: phase === 2 ? 68 : 55 }); } e.cd = 2.8; } return; }
  if (role === 'predator') { steer(e, p.x, p.y, sp * .8, dt); e.st = 'idle';
    if (e.cd <= 0) { const off = a + .5; for (let i = 1; i < 10; i++) ivWarn(e, 'shot', e.x, e.y, 6, .7, { angle: off + i / 10 * 6.283, speed: 65 }); e.cd = 2.8; } return; }
  if (role === 'heal' || role === 'buff') { keepAt(e, dt, d, a, sp, 150);
    if (e.cd <= 0) { const tg = ivLiving().filter(o => o !== e && !o.ivMajor && dist(o.x, o.y, e.x, e.y) < 100);
      if (role === 'heal') { for (const o of tg.slice(0, 4)) o.hp = Math.min(o.maxHp, o.hp + 12 + G.iv.wave * 2); }
      else for (const o of tg.slice(0, 3)) o.ivBuffT = 3;
      ringFx(e.x, e.y, 30, role === 'heal' ? C.green : C.violet, .3, 1); e.cd = 3.5; } return; }
  if (role === 'orbit') { steer(e, p.x + Math.cos(e.ivAge + e.wob) * 65, p.y + Math.sin(e.ivAge + e.wob) * 65, sp, dt); return; }
  steer(e, p.x, p.y, role === 'pursue' ? Math.min(123, e.spd + e.ivAge * 6) * slow : sp, dt);
}
function ivUpdateEnemies(dt) { if (G.iv.phase !== 'fight') return;
  for (const e of [...G.enemies]) { if (e.dead || !e.ivKind) continue;
    e.flash -= dt; e.hurtT -= dt; e.sflash -= dt; e.inv -= dt; e.land -= dt; e.ivReactCd -= dt;
    if (e.spawnT > 0) { e.spawnT -= dt; continue; }
    ccDecay(e, dt); if (ivBurnTick(e, dt)) continue;
    e.slowT -= dt; if (e.slowT <= 0) { e.chill = 0; e.slowMul = 1; }
    if (e.frozen > 0) { e.frozen -= dt; continue; }
    if (Math.abs(e.kx) + Math.abs(e.ky) > 1) { moveBody(e, e.kx * dt, e.ky * dt); const k = Math.pow(.0008, dt); e.kx *= k; e.ky *= k; }
    e.t += dt; e.ivAge += dt; e.cd -= dt; e.ivBuffT = Math.max(0, e.ivBuffT - dt); ivEnemyAI(e, dt);
    if (dist(e.x, e.y, G.p.x, G.p.y) < e.r + G.p.r - 1) hurtPlayer(e.ivDamage * (e.ivBuffT > 0 ? 1.25 : 1), e.x, e.y);
  }
  G.enemies = G.enemies.filter(e => !e.dead);
  const es = G.enemies; for (let i = 0; i < es.length; i++) for (let j = i + 1; j < es.length; j++) { const a = es[i], b = es[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = a.r + b.r;
    if (d > .01 && d < m) { const k = (m - d) * .3 / d; moveBody(a, -dx * k, -dy * k); moveBody(b, dx * k, dy * k); } }
  for (let i = G.iv.warnings.length - 1; i >= 0; i--) { const q = G.iv.warnings[i]; q.age += dt;
    if (q.own.dead) { G.iv.warnings.splice(i, 1); continue; }
    if (q.age >= q.delay) { G.iv.warnings.splice(i, 1); if (q.kind === 'shot') ivShoot(q.own, q.angle, q.speed, q.x, q.y);
      else { ringFx(q.x, q.y, q.r, C.red, .2, 2); if (dist(q.x, q.y, G.p.x, G.p.y) < q.r + G.p.r - 2) hurtPlayer(q.damage, q.x, q.y); } } }
}
function ivUpdateEnemyShots(dt) { if (G.iv.phase !== 'fight') return;
  for (let i = G.ebullets.length - 1; i >= 0; i--) { const b = G.ebullets[i], ox = b.x, oy = b.y; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    let dead = b.life <= 0 || shotBlocked(b.x, b.y);
    if(!dead) for(const q of G.iv.pets){if((q.id==='jellyshield'||q.id==='scapegoat'&&q.hp>0)&&segDist(q.x,q.y,ox,oy,b.x,b.y)<b.r+7){dead=true;if(q.id==='scapegoat')q.hp-=b.ivDamage||1;break;}}
    if (!dead && G.p.alive && segDist(G.p.x, G.p.y, ox, oy, b.x, b.y) < b.r + G.p.r - 2) { hurtPlayer(b.ivDamage || 1, b.x, b.y); dead = true; }
    if (dead) G.ebullets.splice(i, 1); }
}
function ivClearCombat() { for (const e of G.enemies) e.dead = true; G.enemies.length = 0;
  for (const key of ['later', 'ebullets', 'bullets', 'foeFx', 'mechs', 'lasers', 'zones', 'emitters', 'vortices', 'fires', 'strails', 'shockwaves']) if (G[key]) G[key].length = 0;
  G.deathwall = null; G.boss = null; G.iv.warnings = []; G.iv.shots = []; G.iv.visualFx=[]; }
function ivDrawWarnings(cx, cy) { for (const q of G.iv.warnings) { const x = q.x - cx, y = q.y - cy, k = clamp(q.age / q.delay, 0, 1);
    ringC(x, y, q.r, C.red, 1); ringC(x, y, Math.max(1, q.r * (1 - k)), C.gold, 1); }
  for (const e of G.enemies) if (e.ivKind && (e.st === 'wind' || e.st === 'aim')) { const x = e.x - cx, y = e.y - cy, len = e.st === 'wind' ? 90 : 70;
    ctx.globalAlpha = .6; line(x, y, x + Math.cos(e.face) * len, y + Math.sin(e.face) * len, C.red, 1); ctx.globalAlpha = 1; } }
const _updateEnemiesIv = updateEnemies; updateEnemies = function (dt) { if (ivOn()) return ivUpdateEnemies(dt); return _updateEnemiesIv(dt); };
const _updateBulletsIv = updateBullets; updateBullets = function (dt) { if (ivOn()) return ivUpdateEnemyShots(dt); return _updateBulletsIv(dt); };
const _drawBossIv = drawBoss; drawBoss = function (e, x, y) { if (!ivOn() || !e.ivKind) return _drawBossIv(e, x, y);
  drawChar(sprite(e.type, ESPR[e.type]), x, y + e.r, Math.cos(e.face) < 0, e.flash > 0, { sx: e.scale, sy: e.scale, shw: 1.5 }); };
const _hitEnemyIv = hitEnemy; hitEnemy = function (e, dmg, o = {}) { const hit = _hitEnemyIv(e, dmg, o);
  if (hit === true && ivOn() && !e.dead && e.ivKind === 'fly' && o.ivRanged && e.ivReactCd <= 0 && Math.random() < .5) { ivShoot(e, rand(0, 6.283), 65); e.ivReactCd = .8; }
  return hit; };
