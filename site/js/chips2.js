// ===== ACHROMA skill chips II: Singularity! (pulls foes and bullets in, then implodes) =====
'use strict';
Object.assign(ICONS, {
  skSing: ['..1111..', '.1....1.', '1..11..1', '1.1111.1', '1.1111.1', '1..11..1', '.1....1.', '..1111..'],
});
SKILLS.sing = { nm: 'Singularity!', c: () => C.indigo, icon: 'skSing', dur: 4, cd: 24, manual: false,
  d: N4('OPENS A SINGULARITY AT THE CROSSHAIR FOR 4S: FOES AND ENEMY BULLETS WITHIN REACH ARE DRAGGED IN (BOSSES ARE ONLY SLOWED). IT THEN IMPLODES: 30 DAMAGE +2 PER BULLET SWALLOWED (UP TO +80). COOLDOWN 24S.',
    '在準星處開啟奇點 4 秒，範圍內的敵人與敵方子彈都會被吸入（頭目只會被減速）。結束時內爆，造成 30 傷害，每吸入一顆子彈 +2（最多 +80）。冷卻 24 秒。',
    '照準に4秒間の特異点を開く。範囲内の敵と敵弾を吸い寄せる（ボスは減速のみ）。最後に内爆し30ダメージ、吸い込んだ弾1つにつき+2（最大+80）。CT24秒。',
    '在准星处开启奇点 4 秒，范围内的敌人与敌方子弹都会被吸入（头目只会被减速）。结束时内爆，造成 30 伤害，每吸入一颗子弹 +2（最多 +80）。冷却 24 秒。') };
SKILL_IDS.push('sing');

// ---------------- Singularity! ----------------
const SING_R = 90;
function singPoint() { const p = G.p; let x, y;
  if (TOUCH.on) { const t = TOUCH.target; if (t && !t.dead) { x = t.x; y = t.y; } else { x = p.x + Math.cos(p.aim) * 70; y = p.y + Math.sin(p.aim) * 70; } }
  else { x = Input.mx + G.cam.x; y = Input.my + G.cam.y; }
  // never inside a wall: walk the point back toward the hero until it stands on open floor
  for (let k = 0; k < 20 && (solidAt(x, y) || !los(p.x, p.y, x, y)); k++) { x = lerp(x, p.x, .15); y = lerp(y, p.y, .15); }
  return [x, y]; }
function solidAt(x, y) { const t = tileAtPx(x, y); return t === TL.WALL || t === TL.PILLAR || t === TL.VOID; }
function startSing() { const [x, y] = singPoint(); G.sing = { x, y, t: 0, n: 0 }; AU.play('vortex', .6); AU.play('tpOn', .7, .6); chroma(.6, true); ringFx(x, y, SING_R, C.indigo, .4, 2); }
function tickSing(dt) { const s = G.sing; if (!s) return; if (!skillOn('sing')) { G.sing = null; return; } s.t += dt;
  for (const e of G.enemies) { if (e.dead || e.spawnT > 0) continue; const d = dist(e.x, e.y, s.x, s.y); if (d > SING_R + e.r) continue;
    if (e.boss) { e.slowT = Math.max(e.slowT || 0, .2); e.slowMul = Math.min(e.slowMul || 1, .7); continue; }
    if (d > 6) { const k = (1 - d / (SING_R + e.r)) * 110 + 40; moveBody(e, (s.x - e.x) / d * k * dt, (s.y - e.y) / d * k * dt); } }
  for (let i = G.ebullets.length - 1; i >= 0; i--) { const q = G.ebullets[i], d = dist(q.x, q.y, s.x, s.y); if (d > SING_R || q.delay > 0) continue;
    if (d < 7) { G.ebullets.splice(i, 1); s.n++; if (Math.random() < .5) part({ x: s.x, y: s.y, vx: rand(-30, 30), vy: rand(-30, 30), life: .25, max: .25, c: C.indigo }); continue; }
    const pull = 520 * dt, vx = (s.x - q.x) / d, vy = (s.y - q.y) / d; q.vx = q.vx * Math.pow(.15, dt) + vx * pull; q.vy = q.vy * Math.pow(.15, dt) + vy * pull; q.curve = 0; q.homing = 0; }
  if (Math.random() < .6) { const a = rand(0, 6.28), r = rand(SING_R * .5, SING_R); part({ t: 'conv', tx: s.x, ty: s.y, a, r, x: s.x, y: s.y, life: .5, max: .5, c: Math.random() < .5 ? C.indigo : col(4), s: 1 }); } }
function singImplode() { const s = G.sing; if (!s) return; G.sing = null; const dmg = (30 + Math.min(80, s.n * 2)) * G.S.dmg;
  for (const e of G.enemies) if (!e.dead && e.spawnT <= 0 && dist(e.x, e.y, s.x, s.y) < 72 + e.r) hitEnemy(e, dmg, { proc: 1, ka: ang(s.x, s.y, e.x, e.y), knock: e.boss ? 0 : 200, color: C.indigo, boom: true });
  AU.play('explode', .8); AU.play('fusionHit', 1.2, .6); shake(.35, true); flash(C.indigo, .25, true); hitstop(.05, true);
  for (let k = 0; k < 4; k++) ringFx(s.x, s.y, 20 + k * 22, k % 2 ? col(5) : C.indigo, .35 + k * .08, 3); burst(s.x, s.y, 30 + s.n, C.indigo, 220, .6, 2);
  if (s.n) notify(L('n_sing', s.n), C.indigo); }
function drawSing(cx, cy) { const s = G.sing; if (!s) return; const x = s.x - cx, y = s.y - cy, t = G.time, pulse = Math.sin(t * 9);
  ctx.globalAlpha = .1; disc(x, y, SING_R, C.indigo); ctx.globalAlpha = .55; for (let i = 0; i < 40; i++) { if ((i + ((t * 10) | 0)) % 4 === 0) continue; const a = i / 40 * 6.283 - t * 1.5; rect(x + Math.cos(a) * SING_R, y + Math.sin(a) * SING_R, 1, 1, C.indigo); }
  ctx.globalAlpha = 1; for (let i = 0; i < 3; i++) { const a0 = t * (4 + i), rr = 9 + i * 4; for (let j = 0; j < 10; j++) { const a = a0 + j * .25; rect(x + Math.cos(a) * rr, y + Math.sin(a) * rr * .7, 1, 1, i % 2 ? col(5) : C.indigo); } }
  disc(x, y, 6 + pulse, col(0)); ringC(x, y, 7 + pulse, C.indigo, 1);
  if (s.n) textS(String(s.n), x, y - 22, C.indigo, 1, 'center'); }

// ---------------- hooks into the chip system ----------------
const _activateSkillC = activateSkill; activateSkill = function () { const p = G.p, k = p.skill;
  if (k !== 'sing') { _activateSkillC(); return; }
  p.skillOn = true; p.skillT = SKILLS[k].dur; p.skillAge = 0; G.skillCall = { k, t: 0 }; G.skillPulse = { x: p.x, y: p.y, t: 0, k, out: false };
  startSing(); };
const _endSkillC = endSkill; endSkill = function () { const p = G.p; if (p && p.skillOn) { if (p.skill === 'sing') singImplode(); } _endSkillC(); };
const _updateSkillC = updateSkill; updateSkill = function (rdt, wdt) { _updateSkillC(rdt, wdt); tickSing(wdt); };
const _drawSkillWorldC = drawSkillWorld; drawSkillWorld = function (cx, cy) { drawSing(cx, cy); _drawSkillWorldC(cx, cy); };
