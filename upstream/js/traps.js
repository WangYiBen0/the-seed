// ===== ACHROMA room hazards: spinning propeller blades, wall flamethrowers, poison pools from gas canisters =====
'use strict';
// blades and flamers live in WORLD.traps (placed by the room generator); poison pools in WORLD.pools
function trapDanger(x, y, pad = 10) {
  if (!WORLD || !WORLD.traps) return false;
  for (const t of WORLD.traps) {
    if (t.kind === 'blade' && dist(x, y, t.x, t.y) < t.R + pad) return true;
    if (t.kind === 'flame' && segDist(x, y, t.x, t.y, t.x + Math.cos(t.a) * t.L, t.y + Math.sin(t.a) * t.L) < 10 + pad) return true; }
  for (const q of WORLD.pools || []) if (dist(x, y, q.x, q.y) < q.r + pad) return true;
  return false;
}
function updateTraps(dt) {
  const Wd = WORLD; if (!Wd || !Wd.traps) return; const p = G.p, fi = statFloor();
  for (const t of Wd.traps) {
    if (t.kind === 'blade') { t.a += t.va * dt;
      for (let k = 0; k < 2; k++) { const a = t.a + k * Math.PI, ex = t.x + Math.cos(a) * t.R, ey = t.y + Math.sin(a) * t.R;
        if (p.alive && segDist(p.x, p.y, t.x, t.y, ex, ey) < 3 + p.r) hurtPlayer(1, ex, ey);
        for (const e of G.enemies) if (!e.dead && !e.boss && e.spawnT <= 0 && !e.fly && (e.bladeT || 0) < G.time && segDist(e.x, e.y, t.x, t.y, ex, ey) < 3 + e.r) { e.bladeT = G.time + .5; hitEnemy(e, 6 + fi * 4, { proc: 0, knock: 120, ka: a + Math.PI / 2 * Math.sign(t.va), quiet: true, fromField: true }); } }
      if (Math.random() < dt * 6) { const a = t.a + (Math.random() < .5 ? 0 : Math.PI); part({ x: t.x + Math.cos(a) * t.R, y: t.y + Math.sin(a) * t.R, vx: -Math.sin(a) * t.va * 40, vy: Math.cos(a) * t.va * 40, life: .2, max: .2, c: col(4), s: 1, t: 'spark' }); } }
    else if (t.kind === 'flame') { t.t += dt; const ph = t.t % t.per; t.st = ph < t.per - t.warn - t.fire ? 0 : ph < t.per - t.fire ? 1 : 2;
      if (t.st === 2) { const L4 = t.L * Math.min(1, (ph - (t.per - t.fire)) * 6), ex = t.x + Math.cos(t.a) * L4, ey = t.y + Math.sin(t.a) * L4;
        if (!t.snd) { t.snd = 1; if (dist(p.x, p.y, t.x, t.y) < 220) AU.play('flame', .8); }
        if (p.alive && segDist(p.x, p.y, t.x, t.y, ex, ey) < 8 + p.r - 2) hurtPlayer(1, t.x, t.y);
        for (const e of G.enemies) if (!e.dead && !e.boss && e.spawnT <= 0 && segDist(e.x, e.y, t.x, t.y, ex, ey) < 8 + e.r && (e.flameT || 0) < G.time) { e.flameT = G.time + .4; hitEnemy(e, 3 + fi * 2, { proc: 0, knock: 0, quiet: true, fromField: true, color: C.orange }); e.burn = Math.max(e.burn, 2); e.burnT = 3; }
        for (let k = 0; k < 3; k++) { const d = rand(4, L4), s = rand(-5, 5); part({ x: t.x + Math.cos(t.a) * d - Math.sin(t.a) * s, y: t.y + Math.sin(t.a) * d + Math.cos(t.a) * s, vx: Math.cos(t.a) * 60, vy: Math.sin(t.a) * 60 - 20, life: .3, max: .3, c: choice([C.orange, C.red, C.gold]), s: 2, drag: 2 }); } }
      else t.snd = 0; } }
  for (let i = (Wd.pools || []).length - 1; i >= 0; i--) { const q = Wd.pools[i]; q.life -= dt; if (q.life <= 0) { Wd.pools.splice(i, 1); continue; }
    q.tick -= dt; if (q.tick <= 0) { q.tick = .5; if (p.alive && dist(p.x, p.y, q.x, q.y) < q.r + p.r - 3) hurtPlayer(1, q.x, q.y);
      for (const e of G.enemies) if (!e.dead && !e.boss && !e.fly && dist(e.x, e.y, q.x, q.y) < q.r + e.r) { e.venom = Math.min(5, e.venom + 1); e.venomT = 4; } }
    if (Math.random() < dt * 8) part({ x: q.x + rand(-q.r, q.r) * .8, y: q.y + rand(-q.r, q.r) * .6, vx: 0, vy: -14, life: .6, max: .6, c: Math.random() < .5 ? C.lime : '#3d6b2a', s: 2, drag: 0 }); }
}
function drawTraps(cx, cy) {
  const Wd = WORLD; if (!Wd) return; const t0 = G.time;
  for (const q of Wd.pools || []) { const x = q.x - cx, y = q.y - cy, k = Math.min(1, q.life / .8, (q.max - q.life) * 4); ctx.globalAlpha = .55 * k; ctx.fillStyle = '#2f5a1f'; ctx.beginPath(); ctx.ellipse(x, y, q.r * k, q.r * .7 * k, 0, 0, 6.283); ctx.fill();
    ctx.globalAlpha = .7 * k; for (let i = 0; i < 5; i++) { const a = i * 1.26 + t0 * .5, r = q.r * .55; rect(x + Math.cos(a) * r, y + Math.sin(a) * r * .7, 2, 2, C.lime); } ctx.globalAlpha = 1; }
  for (const t of Wd.traps || []) { const x = t.x - cx, y = t.y - cy; if (x < -60 || y < -60 || x > W + 60 || y > H + 60) continue;
    if (t.kind === 'blade') { ctx.globalAlpha = .18; ringC(x, y, t.R, C.red, 1); ctx.globalAlpha = 1;
      for (let k = 0; k < 2; k++) { const a = t.a + k * Math.PI; ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(a); ctx.fillStyle = col(0); ctx.fillRect(2, -3, t.R, 6); ctx.fillStyle = col(4); ctx.fillRect(3, -2, t.R - 2, 4); ctx.fillStyle = col(5); ctx.fillRect(3, -2, t.R - 2, 1); ctx.fillStyle = C.red; ctx.fillRect(t.R - 4, -2, 3, 4); ctx.restore(); }
      disc(x, y, 5, col(0)); disc(x, y, 4, col(3)); rect(x - 1, y - 1, 2, 2, col(5)); }
    else if (t.kind === 'flame') { const ca = Math.cos(t.a), sa = Math.sin(t.a), bl = ((t0 * 14) | 0) % 2;
      if (t.st === 1) { ctx.globalAlpha = .25 + (bl ? .2 : 0); for (let d = 6; d < t.L; d += 6) rect(x + ca * d - 1, y + sa * d - 1, 2, 2, C.orange); ctx.globalAlpha = 1; }
      if (t.st === 2) { const ph = t.t % t.per, L4 = t.L * Math.min(1, (ph - (t.per - t.fire)) * 6); ctx.globalAlpha = .5; ctx.save(); ctx.translate(x, y); ctx.rotate(t.a); ctx.fillStyle = C.red; ctx.fillRect(0, -7, L4, 14); ctx.fillStyle = C.orange; ctx.fillRect(0, -5, L4, 10); ctx.fillStyle = C.gold; ctx.fillRect(0, -2, L4 * .8, 4); ctx.restore(); ctx.globalAlpha = 1; }
      // the nozzle block on the wall
      ctx.save(); ctx.translate(Math.round(x - ca * 8), Math.round(y - sa * 8)); ctx.rotate(t.a); ctx.fillStyle = col(0); ctx.fillRect(-1, -6, 12, 12); ctx.fillStyle = col(3); ctx.fillRect(0, -5, 10, 10); ctx.fillStyle = col(4); ctx.fillRect(0, -5, 10, 1);
      ctx.fillStyle = t.st === 1 ? (bl ? C.gold : C.orange) : t.st === 2 ? C.gold : col(2); ctx.fillRect(8, -3, 3, 6); ctx.restore(); } }
}
// gas canister burst: a poison pool that lingers
function gasBurst(x, y) { AU.play('pop'); AU.play('venom'); burst(x, y, 18, C.lime, 110, .5, 2); ringFx(x, y, 22, C.lime, .35, 2);
  (WORLD.pools || (WORLD.pools = [])).push({ x, y, r: 24, life: 6, max: 6, tick: .2 }); }
