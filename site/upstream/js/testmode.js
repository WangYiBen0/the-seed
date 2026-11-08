// ===== the test panel (outside DZMM only): F2 or ` in a run, or "Test" in the pause menu =====
// serums, foes, every special room, every kind of support, the next floor, the boss, at a click
'use strict';
const TST = { open: false, t: 0, hits: [], god: false, msg: '', msgT: 0 };
const testOn = () => false;
function openTest() { if (!testOn() || !G.p) return; TST.open = true; TST.t = 0; TST.ret = G.state === 'pause' ? 'play' : G.state; G.state = 'test'; AU.play('menuOk'); }
function closeTest() { TST.open = false; G.state = 'play'; AU.play('menu', .8); }
function testSay(s) { TST.msg = s; TST.msgT = 2; }
// make the room you are in (or the nearest one) into any special room, and put you in it
function testRoom(type, variant) {
  const p = G.p, r = roomAt(p.x, p.y) || WORLD.rooms.find(q => q.type === 'start');
  const x0 = r.x0 * T, y0 = r.y0 * T, x1 = (r.x0 + r.w) * T, y1 = (r.y0 + r.h) * T, cx = r.cx * T + 8, cy = r.cy * T + 8;
  G.enemies.forEach(e => { if (e.room === r || (e.x >= x0 && e.x <= x1 && e.y >= y0 && e.y <= y1)) e.dead = true; }); G.ebullets.length = 0;
  if (WORLD.dctx) WORLD.dctx.clearRect(x0, y0, x1 - x0, y1 - y0); G.inter = G.inter.filter(it => !(it.x >= x0 && it.x <= x1 && it.y >= y0 && it.y <= y1));
  r.type = type; r.cleared = true; r.active = false; r.supUsed = false; if (typeof setDoors === 'function') setDoors(r, false);
  const sf = statFloor();
  if (type === 'treasure') G.inter.push({ kind: 'chest', x: cx, y: cy + 4 }, { kind: 'fount', x: cx, y: cy - 34, cost: 20 });
  if (type === 'shrine') G.inter.push({ kind: 'altar', x: cx, y: cy });
  if (type === 'forge') G.inter.push({ kind: 'forge', x: cx, y: cy });
  if (type === 'trial') G.inter.push({ kind: 'totem', x: cx, y: cy, room: r });
  if (type === 'idol') G.inter.push({ kind: 'idol', x: cx, y: cy - 6 });
  if (type === 'vault') G.inter.push({ kind: 'vault', x: cx, y: cy, cost: 25 + sf * 10 });
  if (type === 'dialysis') G.inter.push({ kind: 'dialysis', x: cx, y: cy });
  if (type === 'camp') { G.inter.push({ kind: 'camp', x: cx, y: cy }); const id = choice(SURV_IDS); G.inter.push({ kind: 'survivor', id, x: cx + 30, y: cy + 4 }); }
  if (type === 'shop') { const sid = rollCards(0, 1)[0], pr = [25, 40, 60, 90];
    if (sid) G.inter.push({ kind: 'shop', what: 'shard', id: sid, price: pr[SHARD[sid].rar] + sf * 5, x: cx - 32, y: cy }); G.inter.push({ kind: 'shop', what: 'heart', price: 15 + sf * 5, x: cx, y: cy }, { kind: 'shop', what: 'weapon', id: newWeapon(), price: 35 + sf * 5, x: cx + 32, y: cy }, { kind: 'shop', what: 'chip', id: choice(SKILL_IDS.filter(k => k !== p.skill)), price: 50 + sf * 5, x: cx, y: cy + 32 });
    if (!G.freeReroll) G.inter.push({ kind: 'shop', what: 'reroll', price: 1, hpCost: true, x: cx, y: cy - 32 }); }
  if (type === 'barracks') { barracksSetup(r, cx, cy); if (variant) { r.sup = variant; for (const it of G.inter) if ((it.kind === 'asset' || it.kind === 'soldier') && it.sup) it.sup = variant; } }
  if (type === 'prism') G.inter.push({ kind: 'prism', x: cx, y: cy, minRar: variant || 0, born: G.time });
  try { roomDecor(r, cx, cy); } catch (e) { }
  r.visited = true; p.x = cx; p.y = Math.min(y1 - 24, cy + 46); p.vx = p.vy = 0; G.cam.x = p.x - W / 2; G.cam.y = p.y - H / 2; closeTest(); testSay(type);
}
function testSpawn(type, n) { const p = G.p, r = roomAt(p.x, p.y); for (let i = 0; i < n; i++) { const a = i / n * 6.283, x = p.x + Math.cos(a) * 70, y = p.y + Math.sin(a) * 50; if (collides(x, y, 6, false)) continue; spawnEnemy(type, x, y, { room: r }); } closeTest(); }
function testItems() {
  const p = G.p;
  return [
    { h: 'test_serum' },
    { l: () => L('test_s1'), f: () => { const id = rollCards(0, 1)[0]; if (id) { applyShard(id); testSay(sname(SHARD[id])); } } },
    { l: () => L('test_s3'), f: () => { closeTest(); openCards(0); } },
    { l: () => L('test_s3r'), f: () => { closeTest(); openCards(2); } },
    { l: () => L('test_sorb'), f: () => { G.inter.push({ kind: 'prism', x: p.x, y: p.y - 34, minRar: 0, born: G.time }); closeTest(); } },
    { l: () => L('test_smax'), f: () => { for (const s of SHARDS) if (s.tag !== 'CURSE') p.shards[s.id] = s.max || 1; recomputeStats(); computeTints(); G.fusionQ.length = 0; testSay('MAX'); } },
    { l: () => L('test_sclr'), f: () => { for (const k in p.shards) delete p.shards[k]; recomputeStats(); computeTints(); testSay('0'); } },
    { h: 'test_fight' },
    { l: () => L('test_spawn'), f: () => { const r = roomAt(p.x, p.y); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283, x = p.x + Math.cos(a) * 70, y = p.y + Math.sin(a) * 50; if (!collides(x, y, 6, false)) spawnEnemy(choice(['crawler', 'gunner', 'charger', 'bomber', 'splitter', 'runner', 'bloater', 'screamer', 'boneshot', 'swarm', 'digger']), x, y, { room: r }); } } },
    { l: () => L('test_special'), f: () => testSpawn(choice(['tongue', 'pouncer', 'spitter', 'weeper']), 1) },
    { l: () => L('test_w3'), f: () => { const id = choice(W3_IDS.filter(k => !p.weapons.includes(k))); p.weapons[p.wi] = id; delete p.ammo[id]; codexMark('w:' + id); if (G.seenW) G.seenW.add(id); testSay(wname(id)); } },
    { l: () => L('test_elite'), f: () => { const c = choice(CHAMPS[Math.min(G.floor, CHAMPS.length - 1)]); testSpawn(c.id, 1); } },
    { l: () => L('test_kill'), f: () => { for (const e of G.enemies) if (!e.dead && e.spawnT <= 0) killEnemy(e); closeTest(); } },
    { l: () => L('test_god') + (TST.god ? ' ✓' : ''), f: () => { TST.god = !TST.god; testSay(TST.god ? 'ON' : 'OFF'); } },
    { l: () => L('test_ink'), f: () => { G.ink += 500; testSay('+500'); } },
    { l: () => L('test_heal'), f: () => { p.hp = p.maxHp; p.armor = p.maxArmor; testSay('HP'); } },
    { h: 'test_rooms' },
    ...['shop', 'treasure', 'shrine', 'forge', 'trial', 'idol', 'vault', 'dialysis', 'camp'].map(k => ({ l: () => L('test_r_' + k), f: () => testRoom(k) })),
    ...SUP_KINDS.map(k => ({ l: () => L('test_r_barracks') + '·' + supName(k), f: () => testRoom('barracks', k) })),
    { h: 'test_support' },
    ...SUP_KINDS.map(k => ({ l: () => supName(k), f: () => { G.sup = null; G.support = k; closeTest(); useSupport(); } })),
    { h: 'test_floor' },
    { l: () => L('test_next'), f: () => { closeTest(); beginFloorTransition(G.endless ? endlessFloor() : Math.min(FLOORS.length - 1, G.floor + 1)); } },
    { l: () => L('test_boss'), f: () => { const b = WORLD.rooms.find(q => q.type === 'boss'); if (!b) return; WORLD.bossLocked = false; G.hasKey = false; p.x = b.cx * T + 8; p.y = (b.cy + 3) * T + 8; G.cam.x = p.x - W / 2; G.cam.y = p.y - H / 2; closeTest(); } },
  ];
}
function testLayout() {
  const items = testItems(), cols = 4, w = Math.min(W - 24, 456), cw = Math.floor((w - 20 - (cols - 1) * 4) / cols), rows = []; let col = 0, row = -1, y = 0;
  for (const it of items) { if (it.h) { y += row < 0 ? 0 : 16; rows.push(Object.assign({ head: true, y }, it)); y += 10; col = 0; row = 0; continue; } if (col === 0 && row > 0) y += 15; it.x = col * (cw + 4); it.y = y; it.w = cw; rows.push(it); col++; if (col >= cols) { col = 0; row++; } }
  const h = Math.min(H - 8, 30 + y + 20), x = Math.round(W / 2 - w / 2), y0 = Math.max(4, Math.round(H / 2 - h / 2)); return { x, y: y0, w, h, rows, cw };
}
function updateTest(rdt) {
  TST.t += rdt; TST.msgT = Math.max(0, TST.msgT - rdt);
  if (pressed('Escape') || pressed('F2') || pressed('Backquote')) { closeTest(); return; }
  if (Input.clicked) { for (const h of TST.hits) if (inR(h, Input.mx, Input.my)) { Input.clicked = false; AU.play('menuOk'); h.f(); return; } }
}
function drawTest() {
  const L2 = testLayout(), k = easeOut(clamp(TST.t / .2, 0, 1)); TST.hits = []; ctx.globalAlpha = k; winBackdrop(.55);
  winFrame(L2.x, L2.y, L2.w, L2.h, '#8fa77e', L('test_title'), { closeBox: { x: L2.x + L2.w - 20, y: L2.y + 4, w: 14, h: 14 } }); TST.hits.push({ x: L2.x + L2.w - 20, y: L2.y + 4, w: 14, h: 14, f: closeTest });
  for (const r of L2.rows) { const yy = L2.y + 30 + r.y;
    if (r.head) { const s = L(r.h); text(s, L2.x + 10, yy - (isCJK(s) ? 1 : 0), '#8fa77e'); rect(L2.x + 14 + textW(s), yy + 4, L2.w - 24 - textW(s), 1, TH.line); continue; }
    const b = { x: L2.x + 10 + r.x, y: yy, w: r.w, h: 13, f: r.f }, hv = !TOUCH.on && inR(b, Input.mx, Input.my); TST.hits.push(b);
    rect(b.x, b.y, b.w, b.h, hv ? 'rgba(143,167,126,.18)' : 'rgba(0,0,0,.35)'); box(b.x, b.y, b.w, b.h, null, hv ? '#8fa77e' : TH.line2); const s = fitText(r.l(), b.w - 8); text(s, b.x + b.w / 2, b.y + 4 - (isCJK(s) ? 2 : 0), hv ? TH.bone : TH.bone2, 1, 'center'); }
  text(fitText(L('test_keys'), L2.w - 150), L2.x + L2.w - 26, L2.y + 9 - (isCJK(L('test_keys')) ? 1 : 0), TH.faint, 1, 'right');
  ctx.globalAlpha = 1;
}
function drawTestToast() { if (TST.msgT <= 0 || !TST.msg) return; ctx.globalAlpha = Math.min(1, TST.msgT * 2); const s = 'TEST · ' + TST.msg, w = textW(s) + 14; hudPlate(Math.round(W / 2 - w / 2), 30, w, 13, '#8fa77e', '#8fa77e'); text(s, W / 2, 33 - (isCJK(s) ? 1 : 0), TH.bone, 1, 'center'); ctx.globalAlpha = 1; }
