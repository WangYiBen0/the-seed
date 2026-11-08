// ===== TheSeed: the arsenal (突入探索 special room, the ev3 reward). A weapon rack in an armory: choose any weapon (from those you have
// unlocked) once, and it is laid on the pedestal before the rack to be picked up like any found weapon. The room joins the floors
// once the event goal is reached or the reward is claimed (gp.unlocks.arsenal).
// Also: Overclock! (the last event's chip) is sold at the black market supplies for 10 embers (gp.chips.ovc).
'use strict';
Object.assign(STR, {
  ars_room: ['ARSENAL', '軍械庫', '武器庫', '军械库'], ars_prompt: ['CHOOSE A WEAPON', '自選一把武器', '武器を選ぶ', '自选一把武器'],
  ars_sub: ['ONE WEAPON FROM THE RACK', '從武器架上取下一把', '武器棚から一つ', '从武器架上取下一把'], ars_used: ['THE RACK IS EMPTY', '武器架已經空了', '武器棚は空だ', '武器架已经空了'],
  ars_pick: ['TAKE WHICH WEAPON?', '要取下哪一把武器？', 'どの武器を取る？', '要取下哪一把武器？'], ars_laid: ['{0} IS ON THE PEDESTAL', '{0} 已放在台座上', '{0}を台座に置いた', '{0} 已放在台座上'],
});
const arsOpen = () => { const gp = gpLoad(); return !!((gp.unlocks || {}).arsenal) || (typeof evDone === 'function' && EVC && EVC.unlock === 'arsenal' && evDone()); };
// ---------------- the room joins the special-room pool while the floor is built ----------------
ROOM_MARK.arsenal = () => '#d9b575';
const _genFloorArs = genFloor; genFloor = function (...a) { const on = arsOpen() && !SPECIALS.includes('arsenal'); if (on) SPECIALS.push('arsenal');
  try { return _genFloorArs(...a); } finally { if (on) SPECIALS.splice(SPECIALS.indexOf('arsenal'), 1); } };
function arsSetup(r, cx, cy) { G.inter.push({ kind: 'arsrack', x: cx, y: cy - 10, used: false, room: r }); }
const _enterFloorArs = enterFloor; enterFloor = function (...a) { const r = _enterFloorArs(...a);
  if (WORLD) for (const rm of WORLD.rooms) if (rm.type === 'arsenal' && !G.inter.some(it => it.kind === 'arsrack' && it.room === rm)) arsSetup(rm, rm.cx * T + 8, rm.cy * T + 8);
  return r; };
const _roomDecorArs = roomDecor; roomDecor = function (r, cx, cy) { if (r.type !== 'arsenal') return _roomDecorArs(r, cx, cy);
  const d = WORLD.dctx; if (!d) return; const rng = campRng((r.id + 1) * 733 + (G.floor + 1) * 17), R = (a, b) => a + rng() * (b - a), px = (x, y, c, w = 1, h = 1) => { d.fillStyle = c; d.fillRect(Math.round(x), Math.round(y), w, h); };
  // a painted floor line, oil stains, spent casings
  for (let i = -48; i <= 48; i += 6) { px(cx + i, cy + 22, 'rgba(200,170,90,.18)', 3, 1); px(cx + i, cy - 34, 'rgba(200,170,90,.12)', 3, 1); }
  for (let i = 0; i < 4; i++) { const x = cx + R(-46, 46), y = cy + R(-20, 30); for (let j = -2; j <= 2; j++) px(x - 4 + Math.abs(j), y + j, 'rgba(20,18,16,.35)', 8 - Math.abs(j) * 2, 1); }
  for (let i = 0; i < 18; i++) px(cx + R(-50, 50), cy + R(-26, 36), rng() < .5 ? 'rgba(200,170,90,.45)' : 'rgba(150,120,60,.4)', 2, 1); };
// the rack (world pass): a frame with weapons hanging on it, gone once one is chosen
function drawArsRack(it, x, y, t) { shadow(x, y + 9, 34);
  rect(x - 18, y - 12, 36, 2, '#5a4a3a'); rect(x - 18, y + 6, 36, 2, '#5a4a3a'); rect(x - 18, y - 12, 2, 20, '#4a3a2a'); rect(x + 16, y - 12, 2, 20, '#4a3a2a'); rect(x - 18, y - 12, 36, 1, '#8a7a5a');
  if (!it.used) { for (let i = 0; i < 4; i++) { const wx = x - 13 + i * 9; rect(wx, y - 10, 2, 14, ['#9aa4a8', '#c9a06a', '#7a8a6a', '#a89ab8'][i]); rect(wx - 1, y - 2, 4, 2, '#3a3631'); }
    if (((t * 2) | 0) % 2) rect(x - 1, y - 18, 2, 2, TH.gold); }
  else for (let i = 0; i < 4; i++) rect(x - 13 + i * 9, y - 10, 2, 1, '#3a3631'); }
const _drawInterArs = drawInter; drawInter = function (cx, cy) { _drawInterArs(cx, cy); for (const it of G.inter) if (it.kind === 'arsrack') drawArsRack(it, Math.round(it.x - cx), Math.round(it.y - cy), G.time); };
const _updateInterArs = updateInter; updateInter = function (dt) { _updateInterArs(dt); if (G.state !== 'play' || G.prompt) return; const p = G.p;
  for (const it of G.inter) { if (it.kind !== 'arsrack' || dist(p.x, p.y, it.x, it.y) > 24) continue;
    if (it.used) { G.prompt = { x: it.x, y: it.y - 14, t: L('ars_room'), sub: L('ars_used'), c: '#57524a' }; break; }
    G.prompt = { x: it.x, y: it.y - 14, t: L('ars_prompt'), sub: L('ars_sub'), c: TH.gold }; if (pressed('KeyE')) arsChoose(it); break; } };
function arsChoose(it) { const items = WEAPON_IDS.filter(id => WEAPONS[id] && WEAPONS[id].spr && wUnlocked(id)).map(id => ({ v: id, label: wname(id), sub: tr(WEAPONS[id].d) }));
  openPicker({ title: L('ars_pick'), items, cur: '', acc: TH.gold, onPick: v => { if (it.used || !WEAPONS[v]) return; it.used = true;
    G.inter.push({ kind: 'weapon', id: v, x: it.x, y: it.y + 22 }); codexMark('w:' + v); AU.play('shop'); burst(it.x, it.y + 22, 16, TH.gold, 90, .4); notify(L('ars_laid', wname(v)), TH.gold); } }); }
// ---------------- the black market: Overclock! for 10 embers ----------------
MARKET.push({ id: 'chip_ovc', price: 10, c: () => C.gold, n: N4('SKILL CHIP: OVERCLOCK!', '技能晶片：Overclock!', 'スキルチップ：Overclock!', '技能芯片：Overclock!'),
  d: N4('FROM NOW ON IT CAN APPEAR AMONG THE SKILL CHIPS IN RUNS. 5S: DOUBLE DAMAGE TAKEN, EVERY HIT CRITS, CRIT DAMAGE +100%, ATTACK SPEED +50%.', '購買後永久進入局內技能晶片池。開啟 5 秒：受到雙倍傷害，攻擊必定暴擊，暴擊傷害 +100%，攻速 +50%。', '購入後、出撃中のスキルチップに出現する。5秒：被ダメ2倍、必ず会心、会心ダメ+100%、攻速+50%。', '购买后永久进入局内技能芯片池。开启 5 秒：受到双倍伤害，攻击必定暴击，暴击伤害 +100%，攻速 +50%。') });
const _mktBuyArs = mktBuy; mktBuy = function (it) { if (it.id !== 'chip_ovc') return _mktBuyArs(it); if (mktOwned('chip_ovc')) { AU.play('locked'); return; }
  if (!buyProofs(it.price)) return; const gp = gpLoad(); gp.chips = gp.chips || {}; gp.chips.ovc = true; gpSave(); AU.play('shop'); mktFlash('mk_bought', TH.gold); };
const _mktIconArs = mktIcon; mktIcon = function (id) { if (id !== 'chip_ovc' || MKT_ICON[id]) return _mktIconArs(id); const p = new CPix(20, 20);
  // a chip with gold pins and the Overclock! mark
  p.rect(4, 4, 12, 12, '#2a2a30'); p.rect(5, 5, 10, 10, '#4a4a52'); for (let i = 0; i < 4; i++) { p.rect(6 + i * 2, 2, 1, 2, '#efb94a'); p.rect(6 + i * 2, 16, 1, 2, '#efb94a'); p.rect(2, 6 + i * 2, 2, 1, '#efb94a'); p.rect(16, 6 + i * 2, 2, 1, '#efb94a'); }
  p.rect(7, 7, 6, 6, '#efb94a'); p.rect(8, 8, 4, 4, '#ffd27a'); p.set(9, 9, '#2a2a30'); p.set(10, 10, '#2a2a30');
  p.outline('#050506'); return MKT_ICON[id] = p.canvas(true); };
