// ===== the special rooms: what stands in them, what the floor around it looks like, and the dialysis machine =====
'use strict';
// ---------------- the floor of a special room: painted once into the decal layer when the floor is entered ----------------
function roomDecor(r, cx, cy) {
  const d = WORLD.dctx; if (!d) return; const rng = campRng((r.id + 1) * 977 + (G.floor + 1) * 31), R = (a, b) => a + rng() * (b - a);
  const x0 = r.x0 * T + 18, y0 = r.y0 * T + 18, x1 = (r.x0 + r.w) * T - 18, y1 = (r.y0 + r.h) * T - 18;
  const px = (x, y, c, w = 1, h = 1) => { d.fillStyle = c; d.fillRect(Math.round(x), Math.round(y), w, h); };
  const blot = (x, y, rr, c, n = 18) => { for (let i = 0; i < n; i++) { const a = rng() * 6.283, q = Math.sqrt(rng()) * rr; px(x + Math.cos(a) * q, y + Math.sin(a) * q * .6, c, 1 + (rng() * 2 | 0), 1); } };
  const pool = (x, y, rx, c, c2) => { for (let j = -3; j <= 3; j++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j / 3.4) ** 2))); px(x - w, y + j, c, w * 2, 1); } if (c2) for (let j = -1; j <= 1; j++) px(x - rx * .4, y + j, c2, rx * .6, 1); };
  const trail = (x, y, n, c) => { let a = rng() * 6.28; for (let i = 0; i < n; i++) { a += (rng() - .5) * .6; x += Math.cos(a) * 3; y += Math.sin(a) * 2; px(x, y, c, 2, 1); } };
  const debris = (n, cs) => { for (let i = 0; i < n; i++) px(R(x0, x1), R(y0, y1), cs[i % cs.length], 1 + (rng() * 2 | 0), 1); };
  const stripes = (x, y, w, h) => { for (let i = 0; i < w; i += 6) for (let j = 0; j < h; j++) px(x + i + (j % 6 < 3 ? 0 : 3), y + j, '#6a5a1a', 3, 1); };
  switch (r.type) {
    case 'treasure': pool(cx - 12, cy - 22, 9, 'rgba(60,90,96,.35)', 'rgba(110,150,156,.25)'); trail(cx - 8, cy - 26, 8, 'rgba(60,90,96,.3)'); debris(14, ['rgba(140,130,110,.3)']); break; // spilled water around the purifier
    case 'shrine': pool(cx + 2, cy + 6, 11, '#3a0a0e', '#5a0e14'); for (let i = 0; i < 5; i++) blot(cx + R(-30, 30), cy + R(-20, 24), 4, '#3a0a0e', 8); trail(cx, cy + 6, 14, '#2a080a');
      debris(10, ['#d6cdbb', 'rgba(140,40,40,.6)']); break;                                                  // blood, cotton swabs, spent needles
    case 'forge': pool(cx - 4, cy + 8, 10, 'rgba(10,8,6,.55)'); blot(cx + 10, cy + 6, 6, 'rgba(10,8,6,.5)'); debris(26, ['#8e877b', '#5a4030', '#6e675c']); break; // oil, bolts and shavings
    case 'trial': stripes(cx - 30, cy + 14, 60, 4); stripes(cx - 30, cy - 26, 60, 4); for (let i = 0; i < 4; i++) blot(cx + R(-40, 40), cy + R(-30, 30), 5, 'rgba(60,10,12,.6)', 10); break; // hazard tape lines, old fights
    case 'idol': for (let i = 0; i < 40; i++) px(cx + R(-16, 16), cy + R(-6, 14), rng() < .5 ? 'rgba(200,200,220,.5)' : 'rgba(140,110,180,.4)'); blot(cx, cy + 6, 9, 'rgba(70,40,90,.35)', 24); break; // broken glass, a stain that is not blood
    case 'vault': for (let i = 0; i < 12; i++) { const x = cx + R(-36, 36), y = cy + R(-24, 26); px(x, y, 'rgba(214,205,187,.35)', 4, 3); px(x + 1, y + 1, 'rgba(60,50,40,.4)', 2, 1); } debris(8, ['#8e877b']); break; // scattered papers
    case 'shop': for (let i = 0; i < 3; i++) { const x = cx + R(-46, 46), y = cy + R(-34, 30); px(x - 5, y - 4, 'rgba(90,64,40,.55)', 10, 8); px(x - 5, y - 4, 'rgba(140,100,60,.35)', 10, 1); } debris(16, ['#5a4030', '#8e877b']); break; // crates, sawdust
    case 'dialysis': for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) if ((i + j) & 1) px(cx + i * 10 - 5, cy + j * 10 - 5, 'rgba(214,205,187,.05)', 10, 10); pool(cx + 14, cy + 10, 7, '#3a0a0e', '#5a0e14'); trail(cx + 14, cy + 10, 10, '#3a0a0e'); debris(8, ['#a4cfe0', '#d6cdbb']); break; // clinic tiles, a leak
    case 'camp': debris(10, ['#3a3530', '#5a4030']); break;
    case 'barracks': for (let k = 0; k < 2; k++) { const ty = cy - 16 + k * 10; for (let i = -60; i < 60; i += 4) { px(cx + i, ty + Math.round(Math.sin(i * .05) * 3), 'rgba(20,18,14,.45)', 3, 2); px(cx + i, ty + 5 + Math.round(Math.sin(i * .05) * 3), 'rgba(20,18,14,.45)', 3, 2); } }
      for (let i = 0; i < 4; i++) blot(cx + R(-50, 50), cy + R(-30, 30), 7, 'rgba(40,34,24,.5)', 22); debris(30, ['#c8a040', '#8a6a30']); px(cx - 30, cy + 14, 'rgba(214,205,187,.6)', 5, 2); px(cx - 28, cy + 14, '#8a1820', 2, 1); break;
  }
}
// ---------------- the things in the rooms (world pass, pixel art; x, y = where it stands) ----------------
const RMC = { wood: '#5a4030', wood2: '#7a5838', rust: '#6a3a22', glass: '#0c1416', water: '#3a6a72', water2: '#7fb0b6', blood: '#8a1820', blood2: '#b8262e', bone: '#d6cdbb', led: '#8fa77e' };
function drawPurifier(it, x, y, t) {
  const u = it.used, O = col(0); shadowBox(x - 10, y + 7, 22);
  rect(x - 9, y - 18, 18, 26, O); rect(x - 8, y - 17, 16, 24, col(3)); rect(x - 8, y - 17, 16, 1, col(4)); rect(x - 8, y - 17, 1, 24, col(4));
  rect(x - 6, y - 15, 12, 10, RMC.glass); const lv = u ? 1 : 7 + Math.round(Math.sin(t * 2) * .5); rect(x - 6, y - 5 - lv, 12, lv, RMC.water); rect(x - 6, y - 5 - lv, 12, 1, RMC.water2); rect(x - 5, y - 14, 1, 8, 'rgba(255,255,255,.22)');
  if (!u) for (let i = 0; i < 2; i++) { const q = (t * .6 + i * .5) % 1; rect(x - 3 + i * 5, y - 5 - q * lv, 1, 1, RMC.water2); } // bubbles
  rect(x - 7, y - 3, 14, 1, col(2)); disc(x + 4, y + 1, 2, col(1)); rect(x + 4, y, 1, 1, u ? C.red : RMC.led); rect(x - 6, y + 3, 2, 1, u ? C.red : ((t * 2 | 0) % 2 ? RMC.led : col(2)));
  rect(x - 10, y - 4, 3, 1, col(4)); rect(x - 11, y - 4, 1, 5, col(4)); rect(x - 14, y + 3, 6, 4, col(2)); rect(x - 14, y + 3, 6, 1, col(4)); rect(x - 13, y + 4, 4, 1, u ? col(1) : RMC.water); // faucet over a bucket
  if (!u && ((t * 3) | 0) % 2) rect(x - 11, y + 1 + ((t * 9) % 2), 1, 1, RMC.water2);
}
function drawDrawStation(it, x, y, t) {
  const u = it.used; shadowBox(x - 12, y + 7, 26);
  rect(x + 7, y - 24, 1, 31, col(4)); rect(x + 3, y - 24, 9, 1, col(4)); rect(x + 4, y + 7, 7, 1, col(3)); rect(x + 5, y + 6, 1, 1, col(3)); rect(x + 9, y + 6, 1, 1, col(3)); // IV pole
  rect(x + 3, y - 23, 6, 9, col(0)); rect(x + 4, y - 22, 4, 7, u ? '#2a2222' : RMC.blood); if (!u) rect(x + 4, y - 22 + Math.round(Math.sin(t * 1.5)), 4, 1, RMC.blood2); rect(x + 5, y - 15, 2, 1, col(4)); // the bag
  pxLine(x + 6, y - 14, x + 2, y - 4, u ? col(3) : RMC.blood);                                                                            // tube
  rect(x - 11, y - 10, 4, 13, col(2)); rect(x - 11, y - 10, 4, 1, col(4)); rect(x - 11, y + 1, 15, 3, col(3)); rect(x - 11, y + 1, 15, 1, col(4)); rect(x - 7, y - 3, 10, 1, col(4)); // the chair
  rect(x - 10, y + 4, 1, 4, col(2)); rect(x + 2, y + 4, 1, 4, col(2)); rect(x - 4, y - 4, 1, 2, '#5a3a2a'); rect(x - 1, y - 4, 1, 2, '#5a3a2a');                // legs, straps
  rect(x - 17, y + 1, 5, 1, col(4)); rect(x - 16, y - 1, 1, 2, RMC.bone); rect(x - 14, y - 2, 1, 3, u ? col(3) : RMC.blood2);                                  // a tray, a vial
  if (!u && Math.random() < .05) part({ x: it.x + 2, y: it.y - 4, vx: 0, vy: 12, life: .5, max: .5, c: RMC.blood, grav: 200 });
}
function drawWorkbench(it, x, y, t) {
  shadowBox(x - 14, y + 7, 30); const maxed = (G.p.wlv[G.p.weapons[G.p.wi]] || 0) >= 3;
  rect(x - 12, y - 22, 24, 12, col(1)); for (let i = 0; i < 6; i++) rect(x - 11 + i * 4, y - 21, 1, 1, col(2)); rect(x - 9, y - 19, 1, 7, col(4)); rect(x - 10, y - 19, 3, 2, col(4)); rect(x - 4, y - 19, 4, 1, col(4)); rect(x - 2, y - 19, 1, 6, RMC.wood2); rect(x + 4, y - 18, 5, 4, col(3)); // pegboard, tools
  rect(x, y - 27, 1, 5, col(3)); rect(x - 2, y - 22, 5, 2, col(4)); ctx.globalAlpha = .12 + Math.sin(t * 7) * .02; disc(x, y - 12, 14, '#ffb070'); ctx.globalAlpha = 1;            // the lamp
  rect(x - 14, y - 6, 28, 4, RMC.wood); rect(x - 14, y - 6, 28, 1, RMC.wood2); rect(x - 13, y - 2, 2, 9, col(2)); rect(x + 11, y - 2, 2, 9, col(2)); rect(x - 13, y + 3, 26, 1, col(2)); // bench
  rect(x - 12, y - 10, 6, 4, col(4)); rect(x - 13, y - 9, 1, 2, col(3)); rect(x - 7, y - 11, 1, 1, col(5));                                                    // vise
  const sa = t * 20; disc(x + 8, y - 9, 3, col(2)); rect(Math.round(x + 8 + Math.cos(sa) * 2), Math.round(y - 9 + Math.sin(sa) * 2), 1, 1, col(5)); rect(x + 6, y - 7, 5, 1, col(3)); // grinder
  if (!maxed && Math.random() < .3) part({ x: it.x + 8 + rand(-1, 1), y: it.y - 9, vx: rand(-60, -10), vy: rand(-50, 10), life: .3, max: .3, c: choice(['#ffb070', '#d0702e', '#ffd27a']), grav: 160 });
}
function drawAlarm(it, x, y, t) {
  const u = it.used, on = G.trial && G.trial.room === it.room; shadowBox(x - 8, y + 7, 26);
  rect(x - 1, y - 22, 2, 28, col(3)); rect(x - 1, y - 22, 1, 28, col(4)); rect(x - 4, y - 27, 8, 5, col(0)); rect(x - 3, y - 26, 6, 4, on ? (((t * 8) | 0) % 2 ? RMC.blood2 : '#ff8a6a') : u ? col(2) : '#5a1a14'); // the siren
  if (on) { ctx.globalAlpha = .18 + Math.sin(t * 16) * .08; disc(x, y - 24, 22, RMC.blood2); ctx.globalAlpha = 1; }
  rect(x - 4, y - 2, 8, 7, col(3)); rect(x - 4, y - 2, 8, 1, col(4)); rect(x - 2, y, 4, 2, RMC.blood); rect(x + 3, y - 1 + (u || on ? 3 : 0), 4, 1, col(4)); // the box and its lever
  rect(x + 7, y - 15, 11, 21, col(0)); rect(x + 8, y - 14, 9, 19, col(2)); rect(x + 9, y - 13, 7, 11, RMC.glass); rect(x + 10, y - 12, 1, 9, 'rgba(255,255,255,.2)'); // the cabinet
  if (!u) { rect(x + 12, y - 11, 2, 7, C.cyan); rect(x + 12, y - 12, 2, 1, col(4)); } rect(x + 15, y - 1, 2, 2, u ? RMC.led : '#c8a040'); // a rare serum behind glass, a padlock
}
function drawVialCase(it, x, y, t) {
  const u = it.used, pu = .5 + Math.sin(t * 2.4) * .5; shadowBox(x - 8, y + 9, 18);
  if (!u) { ctx.globalAlpha = .12 + pu * .1; disc(x, y - 5, 14, '#8a76a8'); ctx.globalAlpha = 1; }
  rect(x - 8, y - 16, 16, 24, col(0)); rect(x - 7, y - 15, 14, 22, col(3)); rect(x - 6, y - 14, 12, 14, '#0c0a10'); rect(x - 6, y - 14, 12, 1, col(4));
  pxLine(x - 5, y - 12, x - 1, y - 6, 'rgba(232,225,211,.5)'); pxLine(x - 1, y - 6, x + 3, y - 9, 'rgba(232,225,211,.4)');      // the crack in the glass
  if (!u) { rect(x - 1, y - 11, 3, 8, col(0)); rect(x, y - 10, 1, 6, C.violet); rect(x, y - 11, 1, 1, col(4)); if (Math.random() < .15) part({ x: it.x + rand(-4, 4), y: it.y - 8, vx: 0, vy: -10, life: .8, max: .8, c: '#8a76a8' }); }
  rect(x - 7, y + 2, 14, 1, col(2)); rect(x - 4, y + 4, 8, 1, '#5a3a2a'); rect(x + 4, y - 3, 1, 1, u ? col(2) : (((t * 2) | 0) % 2 ? '#d873b0' : col(2)));
}
function drawSafe(it, x, y, t) {
  const u = it.used; shadowBox(x - 11, y + 9, 24);
  rect(x - 11, y - 10, 22, 19, col(0)); rect(x - 10, y - 9, 20, 17, col(3)); rect(x - 10, y - 9, 20, 1, col(4)); rect(x - 10, y + 7, 20, 1, col(2));
  if (u) { rect(x - 8, y - 7, 16, 13, col(0)); rect(x - 8, y - 7, 3, 13, col(2)); rect(x - 14, y - 7, 6, 13, col(3)); rect(x - 14, y - 7, 6, 1, col(4)); } // the door hangs open
  else { rect(x - 8, y - 7, 16, 13, col(2)); rect(x - 8, y - 7, 16, 1, col(3)); disc(x - 1, y - 1, 3, col(4)); rect(x - 1, y - 4, 1, 3, col(1)); rect(x + 4, y - 6, 3, 5, col(1)); rect(x + 5, y - 5, 1, 1, ((t * 3) | 0) % 2 ? C.red : '#5a1a14'); // dial, keypad
    rect(x - 9, y - 4, 1, 2, col(4)); rect(x - 9, y + 2, 1, 2, col(4)); pxLine(x + 6, y - 1, x + 10, y + 6, '#c8a040'); pxLine(x + 7, y - 1, x + 12, y + 7, '#8a1820'); } // hinges, wires
}
function drawDialysis(it, x, y, t) {
  shadowBox(x - 13, y + 9, 30); const pump = t * 5;
  rect(x - 10, y - 24, 20, 32, col(0)); rect(x - 9, y - 23, 18, 30, '#a8a092'); rect(x - 9, y - 23, 18, 1, RMC.bone); rect(x - 9, y - 23, 1, 30, '#c9c1b2'); rect(x + 8, y - 23, 1, 30, '#6e675c');
  rect(x - 7, y - 21, 14, 7, RMC.glass); for (let i = 0; i < 12; i++) { const v = Math.sin((i + t * 8) * .9) * (i % 4 === 0 ? 2 : .5); rect(x - 6 + i, Math.round(y - 18 + v), 1, 1, RMC.led); } // the screen
  for (const [ox, dir] of [[-4, 1], [4, -1]]) { disc(x + ox, y - 8, 3, col(1)); ringC(x + ox, y - 8, 3, col(3), 1); const a = pump * dir; rect(Math.round(x + ox + Math.cos(a) * 2), Math.round(y - 8 + Math.sin(a) * 2), 1, 1, RMC.bone); } // the pumps
  rect(x + 11, y - 18, 4, 14, '#c8d4d8'); rect(x + 11, y - 18, 4, 1, RMC.bone); rect(x + 12, y - 16, 2, 10, 'rgba(138,24,32,.6)');           // the filter
  pxLine(x - 4, y - 5, x - 14, y + 2, RMC.blood); pxLine(x - 14, y + 2, x - 14, y + 7, RMC.blood); pxLine(x + 4, y - 5, x + 13, y - 4, '#3a5a8a'); pxLine(x + 13, y - 18, x + 13, y - 22, RMC.blood); // tubes
  const fq = (t * 1.5) % 1; rect(Math.round(x - 4 - fq * 10), Math.round(y - 5 + fq * 7), 1, 1, RMC.blood2);
  rect(x - 7, y - 1, 14, 6, '#8e877b'); rect(x - 6, y, 3, 1, ((t * 2) | 0) % 2 ? RMC.led : col(2)); rect(x - 2, y, 6, 1, col(2)); rect(x - 8, y + 7, 3, 2, col(1)); rect(x + 5, y + 7, 3, 2, col(1)); // panel, wheels
}
function shadowBox(x, y, w) { ctx.globalAlpha = .45; rect(x + 1, y, w - 2, 1, col(0)); rect(x, y + 1, w, 1, col(0)); ctx.globalAlpha = 1; }
// the black market's table: a sheet of scrap on trestles with a dirty cloth
function drawStall(x, y) { rect(x - 11, y + 2, 22, 3, RMC.wood); rect(x - 11, y + 2, 22, 1, RMC.wood2); rect(x - 9, y + 5, 2, 6, col(2)); rect(x + 7, y + 5, 2, 6, col(2)); rect(x - 8, y + 1, 16, 1, '#5a4a3a'); rect(x - 8, y + 2, 1, 3, '#5a4a3a'); rect(x + 7, y + 2, 1, 2, '#5a4a3a'); }

// ---------------- the dialysis machine: filters one serum out of the blood. 50 parts for a random one, 200 to choose; both double with every use ----------------
const DIA = { t: 0, mode: 0, sel: 0, hits: [], lmx: 0, lmy: 0 };
const diaCost = k => (k ? 200 : 50) * Math.pow(2, G.diaN || 0);
function openDialysis() { if (!Object.keys(G.p.shards).length) { notify(L('diaNone'), C.red); AU.play('locked'); return; } Object.assign(DIA, { t: 0, mode: 0, sel: 0 }); G.state = 'dialysis'; AU.play('menuOk'); }
function purgeShard(id) {
  const p = G.p, s = SHARD[id]; if (!s) return; delete p.shards[id]; recomputeStats(); computeTints(); p.hp = Math.min(p.hp, p.maxHp); G.diaN = (G.diaN || 0) + 1;
  AU.play('dialysis'); notify(L('n_dia', sname(s)), '#a4cfe0'); burst(p.x, p.y, 24, '#8a1820', 120, .6, 2, { grav: 200 }); ringFx(p.x, p.y, 34, '#a4cfe0', .5, 2); G.state = 'play'; saveRun();
}
function updateDialysis(rdt) {
  DIA.t += rdt; const ids = Object.keys(G.p.shards), mx = Input.mx, my = Input.my;
  if (pressed('Escape')) { diaBack(); return; }
  if (Input.clicked) { for (const h of DIA.hits) if (inR(h, mx, my)) { Input.clicked = false; h.f(); return; } }
  if (DIA.mode) { const n = ids.length, cols = 3; if (pressed('KeyA') || pressed('ArrowLeft')) DIA.sel = (DIA.sel + n - 1) % n; if (pressed('KeyD') || pressed('ArrowRight')) DIA.sel = (DIA.sel + 1) % n;
    if (pressed('KeyW') || pressed('ArrowUp')) DIA.sel = Math.max(0, DIA.sel - cols); if (pressed('KeyS') || pressed('ArrowDown')) DIA.sel = Math.min(n - 1, DIA.sel + cols);
    if (pressed('Enter') || pressed('Space') || pressed('KeyE')) diaPick(ids[DIA.sel]); return; }
  if (pressed('KeyW') || pressed('ArrowUp') || pressed('KeyS') || pressed('ArrowDown')) { DIA.sel = 1 - DIA.sel; AU.play('menu'); }
  if (pressed('Enter') || pressed('Space') || pressed('KeyE')) diaOption(DIA.sel);
}
function diaBack() { if (DIA.mode) { DIA.mode = 0; AU.play('menu', .8); } else { G.state = 'play'; Input.clicked = false; AU.play('menu', .8); } }
function diaOption(k) { const c = diaCost(k); if (G.ink < c) { notify(L('n_noInk'), C.red); AU.play('locked'); return; }
  if (k === 0) { G.ink -= c; purgeShard(choice(Object.keys(G.p.shards))); } else { DIA.mode = 1; DIA.sel = 0; AU.play('menuOk'); } }
function diaPick(id) { const c = diaCost(1); if (!id) return; if (G.ink < c) { notify(L('n_noInk'), C.red); AU.play('locked'); return; } G.ink -= c; purgeShard(id); }
function drawDialysisUI() {
  const ids = Object.keys(G.p.shards), k = easeOut(clamp(DIA.t / .25, 0, 1)); DIA.hits = []; ctx.globalAlpha = k; ctx.drawImage(ditherLayer(.7, col(0)), 0, 0);
  const pw = DIA.mode ? 300 : 220, rows = Math.ceil(ids.length / 3), ph = (DIA.mode ? 46 + rows * 18 + 10 : 96) + 24, px = Math.round(W / 2 - pw / 2), py = Math.round(H / 2 - ph / 2);
  frame2(px, py, pw, ph, '#a4cfe0', DIA.mode ? L('diaTitle') : L('dia'));
  if (!DIA.mode) { text(L('diaSub'), px + 10, py + 22, TH.dim, 1);
    [0, 1].forEach(i => { const c = diaCost(i), b = { x: px + 10, y: py + 36 + i * 24, w: pw - 20, h: 20, f: () => diaOption(i) }, hv = !TOUCH.on && inR(b, Input.mx, Input.my); if (hv) DIA.sel = i; DIA.hits.push(b);
      drawBtn(b.x, b.y, b.w, b.h, '', DIA.sel === i, '#a4cfe0'); const s = L(i ? 'diaPick' : 'diaRand', c); text(s, b.x + 10, b.y + 7 - (isCJK(s) ? 2 : 0), G.ink >= c ? TH.bone : C.red, 1); }); }
  else ids.forEach((id, i) => { const s = SHARD[id], cw = Math.floor((pw - 20) / 3), x = px + 10 + (i % 3) * cw, y = py + 26 + Math.floor(i / 3) * 18, b = { x, y, w: cw - 4, h: 16, f: () => diaPick(id) }, hv = !TOUCH.on && inR(b, Input.mx, Input.my); if (hv) DIA.sel = i; DIA.hits.push(b);
    const on = DIA.sel === i; rect(x, y, cw - 4, 16, on ? 'rgba(164,207,224,.12)' : 'rgba(0,0,0,.3)'); box(x, y, cw - 4, 16, null, on ? '#a4cfe0' : '#2d2925'); icon(s.icon, x + 4, y + 4, shardColor(s)); const nm = fitText(sname(s), cw - 30); text(nm, x + 15, y + 5 - (isCJK(nm) ? 2 : 0), on ? TH.bone : TH.bone2); text(String(G.p.shards[id]), x + cw - 8, y + 5, TH.dim, 1, 'right'); });
  // a way out on every screen (a phone has no Esc): back to the two choices, or away from the machine
  { const b = { x: px + pw / 2 - 45, y: py + ph - 22, w: 90, h: 16, f: diaBack }; DIA.hits.push(b); drawBtn(b.x, b.y, b.w, b.h, L(DIA.mode ? 'back' : 'nm_cancel'), !TOUCH.on && inR(b, Input.mx, Input.my), TH.bone2); }
  if (DIA.mode) { const s = L('diaPick', diaCost(1)); text(s, px + pw - 10, py + ph - 36, G.ink >= diaCost(1) ? TH.dim : C.red, 1, 'right'); }
  ctx.globalAlpha = 1;
}
