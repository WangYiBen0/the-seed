// ===== TheSeed: a girl can fight at your side again. Met at a camp, she either takes the radio (her skill on F) or follows you
// into the fight with her own weapon; only one girl follows at a time (a newer one takes her place) and a girl is never on the radio
// and at your side at once. Nobody follows from the start of a run. The follower attacks through the player's own attack code
// (same bullets, same effects), has a magazine and reloads ("Reloading!" over her head), and wears one piece of exclusive gear
// bought at the black market. Also here: the radio skill card shown when a girl takes the radio, the launch notice after the
// opening card, and the gear page of the partner strips.
'use strict';
Object.assign(STR, {
  fl_radio: ['RADIO SUPPORT', '電台支援', '無線支援', '电台支援'], fl_follow: ['FIGHT AT YOUR SIDE', '協同戰鬥', '共に戦う', '协同战斗'], fl_skip: ['NOT NOW', '暫不', '今はいい', '暂不'],
  fl_skipD: ['SHE STAYS AT THE CAMP', '她留在營地', '野営地に残る', '她留在营地'], fl_replace: ['REPLACES {0}', '頂替 {0}', '{0}と交代', '顶替 {0}'],
  fl_leaveRadio: ['LEAVES THE RADIO', '將離開電台', '無線から離れる', '将离开电台'], fl_leaveSide: ['LEAVES YOUR SIDE', '將不再隨行', '同行をやめる', '将不再随行'],
  fl_ready: ['SKILL READIED', '技能冷卻重置', 'スキル準備完了', '技能冷却重置'], fl_heal: ['BACK TO FULL STRENGTH', '恢復全部狀態', '全快する', '恢复全部状态'],
  fl_took: ['{0} FIGHTS AT YOUR SIDE · {1}', '{0} 加入協同戰鬥 · {1}', '{0}が共に戦う・{1}', '{0} 加入协同战斗 · {1}'],
  fl_mine: ['{0} IS BACK TO FULL STRENGTH', '{0} 恢復了全部狀態', '{0}が全快した', '{0} 恢复了全部状态'],
  fl_skipped: ['{0} STAYS AT THE CAMP', '{0} 留在了營地', '{0}は野営地に残った', '{0} 留在了营地'],
  fl_rest: ['{0} RESTED: HEALTH +{1}', '{0} 休整完畢，生命 +{1}', '{0}は休んで回復した：体力+{1}', '{0} 休整完毕，生命 +{1}'],
  fl_shield: ['{0} RAISED THE EMERGENCY SHIELD', '{0} 展開了應急護盾', '{0}が緊急シールドを展開', '{0} 展开了应急护盾'],
  fl_askHint: ['A / D TO CHOOSE · ENTER TO CONFIRM', 'A / D 選擇 · ENTER 確認', 'A / D で選択・ENTERで決定', 'A / D 选择 · ENTER 确认'],
  fl_introT: ['RADIO SUPPORT ONLINE', '電台支援已接通', '無線支援 接続', '电台支援已接通'], fl_dur: ['LASTS {0}S', '持續 {0} 秒', '効果{0}秒', '持续 {0} 秒'],
  fl_key: ['PRESS F TO USE', '按 F 釋放', 'Fキーで使用', '按 F 释放'], fl_keyT: ['TAP THE SKILL BUTTON TO USE', '點擊技能按鈕釋放', 'スキルボタンで使用', '点击技能按钮释放'],
  fl_ok: ['GOT IT', '知道了', '了解', '知道了'], fl_skill: ['ACTIVE SKILL', '主動技能', 'アクティブ', '主动技能'],
  g_tabGear: ['GEAR', '裝備', '装備', '装备'], fl_gearHead: ['EXCLUSIVE GEAR (ONE PIECE)', '專屬裝備（可穿戴一件）', '専用装備（一つまで）', '专属装备（可穿戴一件）'],
  fl_gearNone: ['NOTHING WORN · GEAR IS SOLD AT THE BLACK MARKET', '未穿戴 · 裝備可在黑市購買', '未装備・装備は闇市で購入', '未穿戴 · 装备可在黑市购买'],
  fl_wear: ['WEAR', '穿戴', '装備', '穿戴'], fl_off: ['REMOVE', '卸下', '外す', '卸下'], fl_notOwned: ['MARKET', '黑市', '闇市', '黑市'],
  fl_weapons: ['WEAPON AT YOUR SIDE (SIGNATURE FREE)', '協同戰鬥武器（專屬武器免費）', '同行時の武器（専用は無料）', '协同战斗武器（专属武器免费）'],
  fl_needMarket: ['BUY IT AT THE BLACK MARKET FIRST', '請先在黑市購買', '先に闇市で購入', '请先在黑市购买'],
  fl_immune: ['BLOCKED', '免疫', '無効', '免疫'], ann_title: ['NOTICE', '公告', 'お知らせ', '公告'],
});
// the old training (health, attack speed, damage) is gone: every girl fights at the same strength, gear makes the difference
girlMul = function () { return { spd: 1, dmg: 1, hp: 1 }; };
const FL_POW = .5, FL_RATE = .6, FL_SHIELD_T = 5, FL_SHIELD_R = 30, FL_PUMP = 3, FL_HP = 25, FL_IFR = .5, FL_CAMP = 15;
const flGear = id => { const k = girlData(id).gear; return k && PGEAR[k] && pgOwned(k) ? k : null; };
function mkFollow(id, wid, hits, away) { const w = wid && WEAPONS[wid] ? wid : girlWeapon(id), m = mkMate(id, w, hits, away), g = flGear(id);
  Object.assign(m, { fl: true, gear: g, weapons: [w], wi: 0, ammo: {}, wlv: {}, spin: 1, charge: 0, alive: true, shT: 0, pumpT: 0 }); m.maxHits = FL_HP + (g === 'armor' ? 10 : 0); m.hits = Math.min(m.hits, m.maxHits - 1); return m; }
// the squad list keeps both (chat, the camp rest, the save); the radio girl never walks the field
function sqSync() { const r = G.ptn ? ((G.squad || []).find(m => m.id === G.ptn.id && !m.fl) || mkMate(G.ptn.id, 'nail', 0, false)) : null; G.squad = [r, G.follow].filter(Boolean); }
const flList = () => G.follow ? [G.follow] : [];
function flRun(f) { const keep = G.squad; G.squad = flList(); try { return f(); } finally { G.squad = keep; } }
const _ptnSetFl = ptnSet; ptnSet = function (id, cd) { _ptnSetFl(id, cd); if (G.follow && G.ptn && G.follow.id === G.ptn.id) G.follow = null; sqSync(); };
const _newRunFl = newRun; newRun = function (...a) { if (G) G.follow = null; const r = _newRunFl(...a); G.follow = null; if (G.mode !== 'invade') sqSync(); return r; };
const _saveRunFl = saveRun; saveRun = function () { _saveRunFl(); if (RESUMING || !G.p || G.mode === 'invade' || (window.BOSS_TEST && BOSS_TEST.on)) return;
  try { const s = JSON.parse(STORE.getItem(SAVE_KEY) || 'null'); if (!s) return; const m = G.follow; s.follow = m ? { id: m.id, wid: m.wid, hits: m.hits, away: !!m.away } : null; STORE.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { } };
const _resumeRunFl = resumeRun; resumeRun = function (...a) { const s = loadSave(), r = _resumeRunFl(...a); const q = s && s.follow;
  if (G && G.p && q && Object.hasOwn(SURV, q.id) && !(G.ptn && G.ptn.id === q.id)) { G.follow = mkFollow(q.id, Object.hasOwn(WEAPONS, q.wid) ? q.wid : null, saveNum(q.hits, 0, 0, 60), !!q.away); sqSync(); mateWarp(G.follow, false); saveRun(); }
  return r; };
// ---------------- in the fight ----------------
squadEnterFloor = (orig => function () { flRun(orig); const m = G.follow; if (m) { m.shT = 0; m.pumpT = 0; m.ammo = {}; } })(squadEnterFloor);
const _mateTargetFl = mateTarget; mateTarget = function (m) { if (!m.fl) return _mateTargetFl(m);
  let best = null, bd = m.gear === 'regul' ? 260 : 185; for (const e of G.enemies) { if (e.dead || e.deathFightLeft > 0 || e.spawnT > 0) continue; const d = dist(m.x, m.y, e.x, e.y) - (e.boss ? 30 : 0); if (d < bd && los(m.x, m.y - 2, e.x, e.y)) { bd = d; best = e; } } return best; };
// her shot goes through the same attack code as yours, but of your serums only the damage ones and the magazine / reload ones
// reach it: while her attack (and every hit of her bullets) is worked out, G.S holds just those and the synergies are switched off
const FL_KEEP = ['dmg', 'crit', 'critMul', 'focus', 'big', 'moment', 'close', 'sear', 'pristine', 'allin', 'farshot', 'mag', 'reload'];
let FL_CUR = false;
function flStats() { const S = baseStats(), R = G.S || S; for (const k of FL_KEEP) if (k in R) S[k] = R[k]; return S; }
function flWith(f) { if (FL_CUR) return f(); const S0 = G.S, syn = Object.assign({}, SYN); for (const k in SYN) delete SYN[k]; const FS = G.S = flStats(); FL_CUR = true;
  try { return f(); } finally { if (G.S === FS) G.S = S0; for (const k in SYN) delete SYN[k]; Object.assign(SYN, syn); FL_CUR = false; } }
const _attackFl = attack; attack = function (p, w, o) { if (!p || !p.fl) return _attackFl(p, w, o); const n0 = G.bullets.length;
  flWith(() => _attackFl(p, w, o)); for (let i = n0; i < G.bullets.length; i++) G.bullets[i].fl = true; };
const _hitEnemyFl = hitEnemy; hitEnemy = function (e, dmg, o) { if (!FL_CUR && ((o && o.fl) || (BUL_CUR && BUL_CUR.fl))) return flWith(() => _hitEnemyFl(e, dmg, o)); return _hitEnemyFl(e, dmg, o); };
const _mateAttackFl = mateAttack; mateAttack = function (m, w, st, tg, reach) { if (!m.fl) return _mateAttackFl(m, w, st, tg, reach);
  if (st === 'melee' && dist(m.x, m.y, tg.x, tg.y) > reach + tg.r) return;
  const id = m.wid; if (usesAmmo(w)) { const a = ammoOf(m, id); if (a.rl > 0) return; if (a.n <= 0) { flReload(m); return; } a.n--; if (a.n <= 0) G.later.push({ t: .12, f: () => flReload(m) }); }
  m.spin = 1; if (MELEE.has(w.kind)) m.swing = { t: 0, dur: .18, a: m.aim, flip: !(m.swing && m.swing.flip) };
  const o = { decoy: true, power: FL_POW }; if (w.kind === 'bow') o.charge = 1; if (w.kind === 'reap') o.spins = 3;
  attack(m, w, o); AU.play(w.sfx || 'shoot', 1.15, .3);
  const rate = flWith(() => (w.rate ? weaponRate(m, w) : rateBonus(m, w) / (w.charge || .8))) * FL_RATE * (m.gear === 'regul' ? 2 : 1); m.cd = Math.max(.06, 1 / rate); };
function flReload(m) { if (G.follow !== m || m.away) return; const a = ammoOf(m, m.wid); if (a.rl > 0) return; startReload(m, m.wid, true); if (a.rl > 0) AU.play('reloadStart', 1.25, .35); }
const _mateHurtFl = mateHurt; mateHurt = function (m, n) { if (!m.fl) return _mateHurtFl(m); if (m.shT > 0) return; n = Math.max(1, n | 0);
  if (m.gear === 'armor' && Math.random() < .1) { m.hitT = .3; AU.play('deflect', 1.4, .45); ringFx(m.x, m.y - 3, 9, PGEAR.armor.c, .25, 1); floatText(m.x, m.y - 14, L('fl_immune'), PGEAR.armor.c); return; }
  if (m.gear === 'shield' && m.hits + n >= m.maxHits) { m.hits = m.maxHits - 1; m.shT = FL_SHIELD_T; m.shX = m.x; m.shY = m.y; m.hitT = .45; const c = PGEAR.shield.c;
    AU.play('shieldPop', 1.3, .8); ringFx(m.x, m.y, FL_SHIELD_R, c, .45, 2); burst(m.x, m.y, 20, c, 110, .5); notify(L('fl_shield', svName(m.id)), c); return; }
  m.hits = Math.min(m.maxHits - 1, m.hits + n - 1); _mateHurtFl(m); if (!m.away) m.hitT = FL_IFR; if (n > 1) floatText(m.x, m.y - 14, '-' + n, C.red); };
// ---- hazards hurt her too: floor spikes, spinning blades, flame jets, gas pools, boss lasers, zones and mechanics ----
const FL_AREA = new Set(['track', 'cells', 'rect', 'seg', 'annulus', 'holes', 'circle', 'blot', 'donut', 'half', 'cone', 'plus', 'nuke']);
function flHit(n) { const m = G.follow; if (!m || m.away || m.shT > 0 || m.hitT > 0 || G.state !== 'play') return false; mateHurt(m, n || 1); return true; }
// the boss mechanics that run their own tick: the same shapes the player is tested against
function flTickHit(q, x, y, r) { switch (q.tick && q.tick.name) {
  case 'tickBlade': return q.bx !== undefined && dist(x, y, q.bx, q.by) < 10 + r;
  case 'tickCage': { if (q.t < q.t0) return false; const dx = x - q.x, dy = y - q.y, ax = Math.abs(dx), ay = Math.abs(dy), side = ax > ay ? (dx > 0 ? 0 : 1) : (dy > 0 ? 2 : 3), along = side < 2 ? dy : dx;
    return Math.abs(Math.max(ax, ay) - q.h) < r + 1.5 && !(side === q.side && Math.abs(along - q.gp * q.h) < q.gw / 2 - 2); }
  case 'tickStar': return dist(x, y, q.x, q.y) < q.r + r;
  case 'tickWell': return q.t >= q.t0 && q.t < q.t0 + q.dur && dist(x, y, q.x, q.y) < q.r + r;
  case 'tickNova': return q.t >= q.t0 && q.R !== undefined && Math.abs(dist(x, y, q.x, q.y) - q.R) < 3 + r && Math.abs(angDiff(q.gap, ang(q.x, q.y, x, y))) > q.gh;
  case 'tickPool': return q.t >= q.warn && q.rr !== undefined && dist(x, y, q.x, q.y) < q.rr + r - 3;
  case 'tickBelt': return q.t >= q.t0 && q.t < q.t0 + q.dur && x > q.x0 && x < q.x1 && y > q.y0 && y < q.y1;
  case 'tickMagnet': { if (q.t < q.t0 || q.t > q.t0 + q.dur) return false; const pl = q.poles[q.act || 0]; return !!pl && dist(x, y, pl[0], pl[1]) < q.r + r - 2; }
  case 'tickSnake': for (let i = 0; i < (q.trail || []).length; i += 5) { const t = q.trail[i]; if (dist(t[0], t[1], x, y) < (i ? 4 : 6) + r - 1) return true; } return false;
  case 'tickSprout': return q.t >= q.warn && dist(x, y, q.x, q.y) < q.r - 4 + r;
  case 'tickWetInk': return segDist(x, y, q.x, q.y, q.x2, q.y2) < q.w / 2 + r - 3;
  case 'tickPendulum': return q.t >= q.t0 && q.ex !== undefined && (dist(x, y, q.ex, q.ey) < 16 + r || (segDist(x, y, q.px, q.py, q.ex, q.ey) < 3 + r && dist(x, y, q.ex, q.ey) < 70));
  case 'tickOrbit': return !!q.pts && q.pts.some(t => dist(t[0], t[1], x, y) < 8 + r - 1);
  case 'tickConveyor': { if (q.t <= .8 || q.t > q.warn) return false; const A = q.A; return q.vert ? (y < A.y0 + 22 || y > A.y1 - 22) : (x < A.x0 + 22 || x > A.x1 - 22); }
  } return false; }
function flHazards() { const m = G.follow; if (!m || m.away || m.shT > 0 || m.hitT > 0) return; const x = m.x, y = m.y, r = m.r, Wd = WORLD;
  if (tileAtPx(x, y) === TL.SPIKE && spikeState() === 2) { flHit(1); return; }
  if (Wd && Wd.traps) for (const t of Wd.traps) {
    if (t.kind === 'blade') { for (let k = 0; k < 2; k++) { const a = t.a + k * Math.PI; if (segDist(x, y, t.x, t.y, t.x + Math.cos(a) * t.R, t.y + Math.sin(a) * t.R) < 3 + r) { flHit(1); return; } } }
    else if (t.kind === 'flame' && t.st === 2) { const ph = t.t % t.per, l = t.L * Math.min(1, (ph - (t.per - t.fire)) * 6); if (segDist(x, y, t.x, t.y, t.x + Math.cos(t.a) * l, t.y + Math.sin(t.a) * l) < 8 + r - 2) { flHit(1); return; } } }
  for (const q of (Wd && Wd.pools) || []) if (dist(x, y, q.x, q.y) < q.r + r - 3) { flHit(1); return; }
  for (const L2 of G.lasers || []) { if (L2.warn > 0 || !L2.pts || !L2.owner || L2.owner.dead) continue; const e2 = L2.pts[L2.pts.length - 1], r0 = L2.r0 || 0;
    if (segDist(x, y, L2.owner.x + Math.cos(L2.a) * r0, L2.owner.y + Math.sin(L2.a) * r0, e2[0], e2[1]) < L2.w / 2 + r - 2) { flHit(1); return; } }
  for (const z of G.zones || []) if (z.warn <= 0 && dist(x, y, z.x, z.y) < z.r + r - 2 && (z.kind === 'void' || z.life > .15)) { flHit(1); return; }
  for (const q of G.mechs || []) { let hit = false;
    try { if (q.tick) hit = flTickHit(q, x, y, r);
      else if (q.type === 'band' && q.t >= q.warn) { const bb = bandRect(q), gg = bandGap(q), al = q.vert ? y : x; hit = !(al > gg[0] + 2 && al < gg[1] - 2) && x > bb[0] && x < bb[0] + bb[2] && y > bb[1] && y < bb[1] + bb[3]; }
      else if (q.type === 'ring' && q.t >= q.warn) hit = dist(x, y, q.x, q.y) > q.r; } catch (e) { hit = false; }
    if (hit) { flHit(1); return; } }
  const D = G.deathwall; if (D && D.A) { const A = D.A; if (x < A.x0 + 14 || x > A.x1 - 14 || y < A.y0 + 14 || y > A.y1 - 14) flHit(1); } }
// mechanics that resolve at a moment (circles, cones, crosses, the nuke...): checked against her as they go off
const _updateMechsFl = updateMechs; updateMechs = function (dt) { const m = G.follow; if (!m || m.away || !G.mechs.length) return _updateMechsFl(dt);
  const due = G.mechs.filter(q => !q.tick && FL_AREA.has(q.type)), r = _updateMechsFl(dt);
  for (const q of due) { if (G.mechs.includes(q) || q.t < q.warn || (q.owner && q.owner.dead)) continue;
    try { if (q.type === 'nuke') { const d = dist(m.x, m.y, q.x, q.y); if (d < q.rIn) flHit(3); else if (d < q.rMid) flHit(1); } else if (inMech(q, m.x, m.y)) flHit(q.dmg || 1); } catch (e) { } }
  return r; };
const flInFight = m => G.enemies.some(e => !e.dead && e.spawnT <= 0 && dist(e.x, e.y, m.x, m.y) < 200) || !!((roomAt(G.p.x, G.p.y) || {}).active);
updateSquad = (orig => function (dt) { const m = G.follow; flRun(() => orig(dt)); if (!m || !dt || m.away) return;
  flWith(() => tickReloads(m, dt)); flHazards(); if (m.away) return; const w = WEAPONS[m.wid], a = usesAmmo(w) ? ammoOf(m, m.wid) : null; if (a && a.n <= 0 && a.rl <= 0) flReload(m);
  // the emergency shield: she holds her ground inside it; bullets from outside stop at the edge, foes are pushed back out
  if (m.shT > 0) { m.shT -= dt; m.x = m.shX; m.y = m.shY; m.vx = m.vy = 0; const R = FL_SHIELD_R, c = PGEAR.shield.c;
    for (let k = G.ebullets.length - 1; k >= 0; k--) { const q = G.ebullets[k]; if (q.delay > 0 || dist(q.x, q.y, m.shX, m.shY) > R) continue; G.ebullets.splice(k, 1); burst(q.x, q.y, 3, c, 50, .15); }
    for (const e of G.enemies) { if (e.dead) continue; const d = dist(m.shX, m.shY, e.x, e.y), need = R + e.r - d; if (need <= 0) continue; const an = d > .5 ? ang(m.shX, m.shY, e.x, e.y) : rand(0, 6.283); moveBody(e, Math.cos(an) * need, Math.sin(an) * need); }
    if (m.shT <= 0) { m.shT = 0; ringFx(m.x, m.y, R, c, .3, 2); _mateHurtFl(m); } return; }
  // the blood pump: out of the fight she mends one point every 3 seconds
  if (m.gear === 'pump' && m.hits > 0) { if (flInFight(m)) m.pumpT = 0; else if ((m.pumpT += dt) >= FL_PUMP) { m.pumpT = 0; m.hits--; burst(m.x, m.y - 4, 5, PGEAR.pump.c, 40, .35); floatText(m.x, m.y - 16, '+1', PGEAR.pump.c); } } })(SQ_ORIG.updateSquad);
drawSquad = (orig => function (cx, cy) { const m = G.follow;
  if (m && !m.away && m.shT > 0) { const x = m.shX - cx, y = m.shY - cy, c = PGEAR.shield.c, k = clamp(m.shT / .4, 0, 1), blink = m.shT < 1.2 && ((m.shT * 10) | 0) % 2;
    ctx.globalAlpha = .12 * k; disc(x, y, FL_SHIELD_R, c); ctx.globalAlpha = (blink ? .4 : .9) * k; ringC(x, y, FL_SHIELD_R, c, 1); ctx.globalAlpha = .35 * k; ringC(x, y, FL_SHIELD_R - 2, '#e8ffff', 1); ctx.globalAlpha = 1; }
  flRun(() => orig(cx, cy)); })(SQ_ORIG.drawSquad);
const _drawSquadUIFl = drawSquadUI; drawSquadUI = function (cx, cy) { _drawSquadUIFl(cx, cy); const m = G.follow; if (!m || m.away) return;
  const a = m.ammo && m.ammo[m.wid]; if (!a || !(a.rl > 0)) return; const x = Math.round(m.x - cx), y = Math.round(m.y - cy - 27), k = 1 - a.rl / (a.max || 1);
  ctx.globalAlpha = .75 + .25 * Math.sin(G.time * 12); textG('Reloading!', x + 1, y + 1, '#000', 1, 'center'); textG('Reloading!', x, y, '#ffd27a', 1, 'center'); ctx.globalAlpha = 1;
  rect(x - 11, y + 7, 22, 2, '#0a0908'); rect(x - 10, y + 7, Math.max(1, Math.round(20 * k)), 1, SURV[m.id].c); };
// a camp rest also mends the girl at your side
const _campRestFl = campRest; campRest = function (it) { const m = G.follow; if (m) { const back = m.away; m.hits = Math.max(0, (back ? m.maxHits : m.hits) - FL_CAMP); m.away = false; m.shT = 0; if (back) mateWarp(m, true);
    floatText(m.x, m.y - 16, '+' + FL_CAMP, C.green); if (G.ptn) notify(L('fl_rest', svName(m.id), FL_CAMP), SURV[m.id].c); }
  if (!G.ptn && m) { it.used = true; AU.play('heal'); burst(it.x, it.y - 4, 24, C.orange, 90, .6); notify(L('fl_rest', svName(m.id), FL_CAMP), C.green); return; } _campRestFl(it); };
// ---------------- the camp meeting: radio, at your side, or neither ----------------
recruit = function (T) { if (T.end >= 0) return; T.end = 0; const it = T.it, k = G.inter.indexOf(it); if (k >= 0) G.inter.splice(k, 1);
  AU.play('select'); AU.play('heal', 1.2, .6); T.ask3 = true; T.sel = G.follow && G.follow.id === T.id ? 1 : 0; };
const flBtns = () => [0, 1, 2].map(j => ({ j, x: Math.round(W / 2 - 189 + j * 128), y: 88, w: 122, h: 40 }));
function flTake(id, T) { const m0 = G.follow;
  if (m0 && m0.id === id) { m0.hits = 0; m0.away = false; m0.shT = 0; T.res = L('fl_mine', svName(id)); AU.play('heal'); return; }
  if (G.ptn && G.ptn.id === id) ptnSet(null, 0);
  const m = mkFollow(id); m.x = T.it.x; m.y = T.it.y; G.follow = m; sqSync(); const s = L('fl_took', svName(id), wname(m.wid)); T.res = s; notify(s, SURV[id].c); AU.play('menuOk'); }
function flPick(T, j) { if (!T || !T.ask3 || ![0, 1, 2].includes(j)) return;
  T.ask3 = false; T.end = .5; const id = T.id, depth = exploreDepth();
  if ((G.campUsed || []).includes(depth)) { T.res = L('fl_skipped', svName(id)); return; }
  (G.campUsed = G.campUsed || []).push(depth); girlsMeet(id);
  if (j === 0) { if (G.ptn && G.ptn.id === id) { G.ptn.cd = 0; G.ptn.tier = ptTier(id); T.res = L('ra_meetMine', svName(id)); } else { ptnTake(id, T); T.intro = true; } }
  else if (j === 1) flTake(id, T);
  else { T.res = L('fl_skipped', svName(id)); AU.play('menu', .8); }
  // Save the choice and encounter receipt together, before the introduction can be interrupted.
  saveRun(); }
const _updateTalkFl = updateTalk; updateTalk = function (rdt) { const T = G.talk; if (!T || !T.ask3) return _updateTalkFl(rdt);
  T.t += rdt; T.end = Math.min(T.end + rdt, .6); if (T.end < .45) return;
  const bs = flBtns(), hv = bs.findIndex(b => inR(b, Input.mx, Input.my)); if (hv >= 0 && !TOUCH.on && hv !== T.sel) { T.sel = hv; AU.play('menu', 1.1, .5); }
  if (pressed('KeyA') || pressed('ArrowLeft')) { T.sel = (T.sel + 2) % 3; AU.play('menu', 1.1, .5); } if (pressed('KeyD') || pressed('ArrowRight')) { T.sel = (T.sel + 1) % 3; AU.play('menu', 1.1, .5); }
  const pick = Input.clicked && hv >= 0 ? hv : pressed('Enter') || pressed('Space') || pressed('KeyE') ? T.sel : pressed('Escape') ? 2 : -1; Input.clicked = false;
  if (pick >= 0) flPick(T, pick); };
function flBtnText(T, j) { const id = T.id, wid = G.follow && G.follow.id === id ? G.follow.wid : girlWeapon(id);
  if (j === 0) return [L('fl_radio'), tr(PSK[id].n), G.ptn ? (G.ptn.id === id ? L('fl_ready') : L('fl_replace', svName(G.ptn.id))) : G.follow && G.follow.id === id ? L('fl_leaveSide') : '', SURV[id].c];
  if (j === 1) return [L('fl_follow'), wname(wid), G.follow ? (G.follow.id === id ? L('fl_heal') : L('fl_replace', svName(G.follow.id))) : G.ptn && G.ptn.id === id ? L('fl_leaveRadio') : '', SURV[id].c];
  return [L('fl_skip'), L('fl_skipD'), '', '#8e877b']; }
const _drawJoinCardFl = drawJoinCard; drawJoinCard = function (T, k) { if (!T.ask3) return _drawJoinCardFl(T, k);
  const c = SURV[T.id].c, e = easeOut(clamp(T.end / .35, 0, 1)), hh = 112, h = hh * e, y = 104;
  ctx.globalAlpha = k; rect(0, y - h / 2, W, h, '#0a0908'); if (h > 4) { rect(0, y - h / 2, W, 1, c); rect(0, y + h / 2 - 1, W, 1, c); }
  if (e > .6) { const a = clamp((e - .6) / .4, 0, 1) * k, sx = (1 - a) * 30; ctx.globalAlpha = a; textS(L('ra_card', svName(T.id), AFF_MEET), W / 2 + sx, y - hh / 2 + 9, c, 2, 'center');
    for (const b of flBtns()) { const [l1, l2, l3, cc] = flBtnText(T, b.j), on = T.sel === b.j;
      rect(b.x, b.y, b.w, b.h, on ? thA(cc, .16) : '#0d0c0b'); box(b.x, b.y, b.w, b.h, null, on ? cc : '#3a3631'); if (on) rect(b.x, b.y, 2, b.h, cc);
      if (b.j === 0) icon(PSK[T.id].ic, b.x + 6, b.y + 5, cc, 1); else if (b.j === 1) { const ws = sprite('w_' + flBtnWid(T), WEAPONS[flBtnWid(T)].spr); ctx.drawImage(ws.n, b.x + 4, b.y + 4, Math.min(14, ws.w), Math.min(9, ws.h)); }
      const tx = b.x + (b.j === 2 ? 8 : 20); text(fitText(l1, b.x + b.w - tx - 4), tx, b.y + 5 - (isCJK(l1) ? 1 : 0), on ? '#e6dfd1' : '#8e877b');
      text(fitText(l2, b.w - 12), b.x + 8, b.y + 17 - (isCJK(l2) ? 1 : 0), cc); if (l3) text(fitText(l3, b.w - 12), b.x + 8, b.y + 28 - (isCJK(l3) ? 1 : 0), '#8e877b'); }
    if (!TOUCH.on) text(L('fl_askHint'), W / 2, y + hh / 2 - 12, '#57524a', 1, 'center'); }
  ctx.globalAlpha = 1; };
const flBtnWid = T => G.follow && G.follow.id === T.id ? G.follow.wid : girlWeapon(T.id);
// ---------------- the radio skill card: what she just gave you ----------------
const FLI = { id: null, t: 0, hit: null };
const _closeTalkFl = closeTalk; closeTalk = function () { const T = G.talk; _closeTalkFl(); if (T && T.intro && G.ptn && G.ptn.id === T.id && G.state === 'play') { FLI.id = T.id; FLI.t = 0; G.state = 'ptnintro'; } };
function flIntroClose() { G.state = 'play'; FLI.id = null; Input.clicked = false; Input.down = false; AU.play('menuOk'); }
const _updateFl = update; update = function (rdt) { if (G && G.state === 'ptnintro') { FLI.t += rdt; updateParticles(rdt);
    if (FLI.t > .35 && (pressed('Enter') || pressed('Space') || pressed('Escape') || pressed('KeyE') || (Input.clicked && (!FLI.hit || inR(FLI.hit, Input.mx, Input.my) || !inR(FLI.box, Input.mx, Input.my))))) flIntroClose();
    Input.clicked = false; return; }
  return _updateFl(rdt); };
const _renderFl = render; render = function () { _renderFl(); if (G && G.state === 'ptnintro' && FLI.id) drawFlIntro(); };
function drawFlIntro() { const id = FLI.id, sk = PSK[id], c = SURV[id].c, e = easeOut(clamp(FLI.t / .3, 0, 1)), lh = lineH(), tier = ptTier(id), w = 300, tw = w - 24;
  const dl = wrapW(tr(sk.d(ptPw())), tw), pl = wrapW(tr(sk.pd(ptPs())), tw - 34), trl = sk.tr.map(t => wrapW(tr(t), tw - 26).slice(0, 2));
  const h = 74 + dl.length * lh + 6 + Math.max(1, pl.length) * lh + 6 + lh + trl.reduce((s, l) => s + l.length * lh + 2, 0) + 30, x = Math.round(W / 2 - w / 2), y = Math.round(H / 2 - h / 2 + (1 - e) * 10);
  ctx.globalAlpha = .65 * e; rect(0, 0, W, H, '#000'); ctx.globalAlpha = e; frame2(x, y, w, h, c, L('fl_introT')); FLI.box = { x, y, w, h };
  let yy = y + 24; rect(x + 12, yy, 26, 26, '#0a0908'); box(x + 12, yy, 26, 26, null, c); icon(sk.ic, x + 17, yy + 5, c, 2);
  textS(tr(sk.n), x + 46, yy + 1, '#e6dfd1', 1.5); const meta = svName(id) + ' · ' + L('ra_cd', +ptCdMax(id).toFixed(1)) + (sk.dur ? ' · ' + L('fl_dur', sk.dur) : ''); text(fitText(meta, w - 58), x + 46, yy + 17 - (isCJK(meta) ? 1 : 0), c);
  yy += 34; text(L('fl_skill'), x + 12, yy, '#8e877b'); yy += lh; dl.forEach(l => { text(l, x + 12, yy, '#c9c1b2'); yy += lh; }); yy += 6;
  text(L('ra_passive'), x + 12, yy, c); pl.forEach((l, i) => text(l, x + 46, yy + i * lh, '#c9c1b2')); yy += Math.max(1, pl.length) * lh + 6;
  text(L('ra_traits'), x + 12, yy, '#8e877b'); yy += lh;
  trl.forEach((ls, i) => { const got = tier > i; rect(x + 12, yy + 2, 3, 3, got ? c : '#3a3631'); text(String([30, 60, 100][i]), x + 18, yy, got ? c : '#57524a'); ls.forEach((l, j) => text(l, x + 38, yy + j * lh, got ? '#e6dfd1' : '#6e675c')); yy += ls.length * lh + 2; });
  const key = L(TOUCH.on ? 'fl_keyT' : 'fl_key'); text(key, x + 12, y + h - 18 - (isCJK(key) ? 1 : 0), TH.gold);
  const b = { x: x + w - 78, y: y + h - 22, w: 66, h: 16 }; FLI.hit = b; drawBtn(b.x, b.y, b.w, b.h, L('fl_ok'), !TOUCH.on && inR(b, Input.mx, Input.my), c); ctx.globalAlpha = 1; }
// ---------------- the partner strips: the gear page (one piece of gear, and her weapon for fighting at your side) ----------------
function drawGirlEquip(id, d, I, c, x, y, w) {
  const gp = gpLoad(), lh = lineH(); let yy = y + 2, hovK = null;
  text(L('fl_gearHead'), x, yy - (isCJK(L('fl_gearHead')) ? 1 : 0), '#8e877b'); yy += 11;
  for (const k of PGEAR_IDS) { const G2 = PGEAR[k], own = pgOwned(k), on = d.gear === k && own, who = pgWearer(k), ry = yy, row = { x, y: ry, w, h: 16 };
    if (!TOUCH.on && inR(row, Input.mx, Input.my)) hovK = k;
    rect(x, ry, w, 16, on ? thA(G2.c, .14) : '#0d0c0b'); box(x, ry, w, 16, null, on ? G2.c : '#2a2622'); if (on) rect(x, ry, 2, 16, G2.c);
    gearIcon(k, x + 10, ry + 8, 1, own ? G2.c : '#4a4540'); const nm = tr(G2.n); text(fitText(nm, w - 140), x + 20, ry + 5 - (isCJK(nm) ? 1 : 0), own ? '#e6dfd1' : '#6e675c');
    if (own && who && who !== id) { const s = fitText(L('mk_gearOn', svName(who)), 70); text(s, x + w - 58, ry + 5 - (isCJK(s) ? 1 : 0), SURV[who].c, 1, 'right'); }
    if (!own) gBtn(x + w - 54, ry + 1, 52, 14, L('fl_notOwned'), '#57524a', () => { gFlash('fl_needMarket'); AU.play('locked'); });
    else if (on) gBtn(x + w - 54, ry + 1, 52, 14, L('fl_off'), G2.c, () => { d.gear = null; gpSave(); AU.play('menu', .8); });
    else gBtn(x + w - 54, ry + 1, 52, 14, L('fl_wear'), G2.c, () => { const o = pgWearer(k); if (o && o !== id) girlData(o).gear = null; d.gear = k; gpSave(); AU.play('menuOk'); });
    yy += 18; }
  { const k = hovK || (d.gear && pgOwned(d.gear) ? d.gear : null), ls = k ? wrapW(tr(PGEAR[k].d), w).slice(0, 2) : wrapW(L('fl_gearNone'), w).slice(0, 2);
    ls.forEach(l => { text(l, x, yy, k ? '#c9c1b2' : '#6e675c'); yy += lh; }); if (ls.length < 2) yy += lh; }
  // her weapon at your side: the signature one is free, the rest cost 1 / 2 / 3 embers
  yy += 3; text(L('fl_weapons'), x, yy - (isCJK(L('fl_weapons')) ? 1 : 0), '#8e877b'); const cur = girlWeapon(id), list = [I.sig].concat(W_TIER_ORDER.filter(q => q !== I.sig)), ly = yy + 10, rows = Math.max(3, Math.floor((H - 22 - ly) / 11)), maxS = Math.max(0, list.length - rows);
  GIRLS.wscroll = Math.min(GIRLS.wscroll, maxS); const area = { x, y: ly, w, h: rows * 11 };
  for (let i = 0; i < rows && i + GIRLS.wscroll < list.length; i++) { const wid = list[i + GIRLS.wscroll], ry = ly + i * 11, own = wid === I.sig || d.own.includes(wid), use = wid === cur, tier = W_TIER[wid] || 1;
    const hov = !TOUCH.on && inR({ x, y: ry, w, h: 10 }, Input.mx, Input.my); if (use || hov) rect(x, ry, w, 10, use ? '#1c1a12' : '#151310');
    const ws = sprite('w_' + wid, WEAPONS[wid].spr); ctx.drawImage(ws.n, x + 1, ry + 1, Math.min(14, ws.w), 8);
    text(fitText(wname(wid), w - 90), x + 18, ry + 2 - (isCJK(wname(wid)) ? 1 : 0), use ? TH.gold : own ? '#e8e1d3' : '#8e877b');
    text(L('g_tier' + ['N', 'M', 'A'][tier - 1]), x + w - 52, ry + 2 - (isCJK(L('g_tierN')) ? 1 : 0), ['#8e877b', TH.cyan, TH.orange][tier - 1]);
    if (use) text(L('g_using'), x + w, ry + 2 - (isCJK(L('g_using')) ? 1 : 0), TH.gold, 1, 'right'); else if (own) text(L('g_owned'), x + w, ry + 2 - (isCJK(L('g_owned')) ? 1 : 0), '#aaa293', 1, 'right');
    else { text(String(tier), x + w - 2, ry + 2, gp.proofs >= tier ? TH.gold : '#57524a', 1, 'right'); drawProof(x + w - 14, ry + 1); }
    GIRLS.hits.push({ x, y: ry, w, h: 10, drag: true, f: () => { if (own) { d.wsel = wid; gpSave(); AU.play('menuOk'); } else if (buy(tier)) { d.own.push(wid); d.wsel = wid; gpSave(); } } }); }
  if (maxS) { const kh = Math.max(8, area.h * rows / list.length), ky = ly + (area.h - kh) * GIRLS.wscroll / maxS; rect(x + w + 3, ly, 1, area.h, '#1f1f24'); rect(x + w + 2, ky, 3, kh, '#4c463f'); }
}
// ---------------- the launch notice: shown once the opening card has played ----------------
const ANN = { open: false, t: 0, top: 0, drag: null, hit: null };
// this notice's gift: 20 embers for everyone, once (gp.gifts), handed over when the notice is closed
const ANN_GIFT = { id: 'v127', n: 20, on: false };   // the v127 gift is over; set on: true (and a new id) to hand out another
const ANN_ID = 'n147';                                 // a new id shows the notice again to players who chose not to see it
Object.assign(STR, { ann_gift: ['UPDATE GIFT: {0} EMBERS (GIVEN WHEN YOU CLOSE THIS NOTICE)', '更新補償：{0} 火種（關閉公告時發放）', 'アップデート補償：火種{0}（閉じると受け取り）', '更新补偿：{0} 火种（关闭公告时发放）'],
  ann_got: ['UPDATE GIFT: {0} EMBERS RECEIVED', '更新補償：已領取 {0} 火種', 'アップデート補償：火種{0}受け取り済み', '更新补偿：已领取 {0} 火种'],
  ann_claim: ['CLAIM {0}', '領取 {0} 火種', '{0}受け取る', '领取 {0} 火种'], ann_toast: ['+{0} EMBERS: UPDATE GIFT', '+{0} 火種：更新補償', '+{0} 火種：アップデート補償', '+{0} 火种：更新补偿'] });
const annGot = () => { if (!ANN_GIFT.on) return true; const gp = gpLoad(); return !!(gp.gifts && gp.gifts[ANN_GIFT.id]); };
function annClaim() { if (annGot()) return; const gp = gpLoad(); gp.gifts = gp.gifts || {}; gp.gifts[ANN_GIFT.id] = 1; gp.proofs = (gp.proofs || 0) + ANN_GIFT.n; gpSave();
  NET.toast = { txt: L('ann_toast', ANN_GIFT.n), c: TH.gold, t: 0 }; AU.play('chipGet'); }
// the notice is laid out in parts: a lead paragraph, sections with a heading, and update items (a coloured mark, a white title, grey details)
const ANN_DOC = [
  { k: 'h', s: IZ('IN THIS UPDATE', '本次更新') },
  { k: 'i', c: () => '#c89aff', t: IZ('Experimental serum Ω', '实验血清Ω调整'), s: IZ('Its drawback is now: for the next 3 fights armor regenerates at half speed (it used to forbid dashing). After that, maximum armor +1 for the run, as before.', '副作用改为：接下来 3 次战斗内护甲回复效率减半（原为无法冲刺）。3 次战斗后护甲上限永久 +1，与之前相同。') },
  { k: 'i', c: () => TH.gold, t: IZ('Getting the Overclock! chip', 'Overclock! 技能芯片获取方式'), s: IZ('The last event was not completed, so Overclock! is now sold in the black market supplies for 10 embers. Once bought it appears in the chip choices of every run.', '上次限时活动未完成，Overclock! 技能芯片现已在黑市补给道具中出售，价格 10 火种。购买后会进入局内的芯片池。') },
];
function annRows(w) { const lh = lineH(), out = [];
  for (const d of ANN_DOC) {
    if (d.k === 'p') { const ls = wrapW(tr(d.s), w); out.push({ h: ls.length * lh + 6, draw: (x, y) => ls.forEach((l, i) => text(l, x, y + i * lh, '#a9a294')) }); }
    else if (d.k === 'h') { const s = tr(d.s); out.push({ h: 20, draw: (x, y) => { y += 6; rect(x, y, 2, 8, TH.ember); text(s, x + 7, y + (isCJK(s) ? 0 : 1), TH.ember); const tw = textW(s) + 14; rect(x + tw, y + 4, w - tw, 1, '#2d2925'); } }); }
    else if (d.k === 'gift') { out.push({ h: 24, draw: (x, y) => { const got = annGot(), c = got ? '#6e675c' : TH.gold; rect(x, y + 2, w, 18, got ? 'rgba(20,18,16,.6)' : 'rgba(239,185,74,.08)'); box(x, y + 2, w, 18, null, got ? '#2d2925' : thA(TH.gold, .6));
      drawProof(x + 8, y + 7); const s = L(got ? 'ann_got' : 'ann_gift', ANN_GIFT.n); text(s, x + 20, y + 8 - (isCJK(s) ? 1 : 0), c); } }); }
    else if (d.k === 'title') { const s = tr(d.s); out.push({ h: 18, draw: (x, y) => { const tw = drawTitleTag(d.id, x + 10, y + 2, 1); text(s, x + 18 + tw, y + 2 - (isCJK(s) ? 1 : 0), '#6e675c'); } }); }
    else { const t = tr(d.t), ls = wrapW(tr(d.s), w - 12); out.push({ h: 13 + ls.length * lh + 6, draw: (x, y) => { const c = d.c(); rect(x + 1, y + 3, 4, 4, c); rect(x + 2, y + 4, 2, 2, '#ffffff');
      textS(t, x + 11, y + 1 - (isCJK(t) ? 1 : 0), '#f2ebde'); ls.forEach((l, i) => text(l, x + 11, y + 14 + i * lh, '#a9a294')); } }); } }
  return out; }
function annLayout() { const w = Math.min(W - 30, 400), cw = w - 36, rows = annRows(cw), total = rows.reduce((s, r) => s + r.h, 0), head = 40, foot = 30, h = Math.min(H - 20, head + total + 6 + foot), vh = h - head - foot;
  return { x: Math.round(W / 2 - w / 2), y: Math.round(H / 2 - h / 2), w, h, cw, rows, total, head, foot, vh, max: Math.max(0, total + 6 - vh) }; }
const _updateIntroAnn = updateIntro; updateIntro = function (rdt) { const was = G.state; _updateIntroAnn(rdt); if (was === 'intro' && G.state === 'menu' && SET.annHide !== ANN_ID) { ANN.open = true; ANN.t = 0; ANN.top = 0; } };
const _updateMenuAnn = updateMenu; updateMenu = function (rdt) { if (!ANN.open) return _updateMenuAnn(rdt); ANN.t += rdt; const A = annLayout();
  if (Input.wheel) ANN.top = clamp(ANN.top + Input.wheel * 24, 0, A.max);
  if (ANN.drag) { if (Math.abs(Input.my - ANN.drag.y) > 3) ANN.drag.moved = true; if (ANN.drag.moved) ANN.top = clamp(ANN.drag.top - (Input.my - ANN.drag.y), 0, A.max); if (!Input.down) ANN.drag = null; }
  if (pressed('ArrowDown') || pressed('KeyS')) ANN.top = Math.min(A.max, ANN.top + 24); if (pressed('ArrowUp') || pressed('KeyW')) ANN.top = Math.max(0, ANN.top - 24);
  if (ANN.t > .3 && Input.clicked && ANN.hide && inR(ANN.hide, Input.mx, Input.my)) { ANN.open = false; SET.annHide = ANN_ID; saveSettings(); Input.clicked = false; Input.down = false; AU.play('menu', .8); if (ANN_GIFT.on) annClaim(); return; }
  if (ANN.t > .3 && (pressed('Enter') || pressed('Escape') || pressed('Space') || (Input.clicked && ANN.hit && inR(ANN.hit, Input.mx, Input.my)))) { ANN.open = false; Input.clicked = false; Input.down = false; AU.play('menuOk'); if (ANN_GIFT.on) annClaim(); return; }
  if (Input.clicked) { if (inR(A, Input.mx, Input.my)) ANN.drag = { y: Input.my, top: ANN.top, moved: false }; Input.clicked = false; } };
const _drawMenuAnn = drawMenu; drawMenu = function (t) { _drawMenuAnn(t); if (!ANN.open || G.state !== 'menu') return; const A = annLayout(), e = easeOut(clamp(ANN.t / .3, 0, 1)), x = A.x, y = A.y + Math.round((1 - e) * 8), w = A.w;
  ctx.globalAlpha = .65 * e; rect(0, 0, W, H, '#000'); ctx.globalAlpha = e; frame2(x, y, w, A.h, TH.ember);
  // the head: a small ember tag, the title, the version on the right, a rule
  { const tag = L('ann_title'), tw = textW(tag) + 10; rect(x + 14, y + 11, tw, 12, TH.ember); text(tag, x + 19, y + 13 - (isCJK(tag) ? 1 : 0), '#0a0908');
    const ti = tr(IZ('TEST BUILD NOTES', '测试版更新说明')); textS(ti, x + 22 + tw, y + 10 - (isCJK(ti) ? 1 : 0), '#f2ebde', 1.5);
    text('v' + (typeof GAME_V !== 'undefined' ? GAME_V : ''), x + w - 14, y + 14, '#57524a', 1, 'right'); rect(x + 14, y + A.head - 8, w - 28, 1, '#2d2925'); rect(x + 14, y + A.head - 8, 40, 1, TH.ember); }
  // the body, scrolled and clipped
  const bx = x + 18, by = y + A.head - 2; ctx.save(); ctx.beginPath(); ctx.rect(x + 2, by, w - 4, A.vh); ctx.clip(); let yy = by - Math.round(ANN.top);
  for (const r of A.rows) { if (yy + r.h > by - 2 && yy < by + A.vh + 2) r.draw(bx, yy); yy += r.h; } ctx.restore();
  if (A.max) { const kh = Math.max(10, A.vh * A.vh / (A.total + 6)), ky = by + (A.vh - kh) * ANN.top / A.max; rect(x + w - 7, by, 1, A.vh, '#1f1f24'); rect(x + w - 8, ky, 3, kh, '#5a544c');
    if (ANN.top < A.max - 2) { const g = ctx.createLinearGradient(0, by + A.vh - 16, 0, by + A.vh); g.addColorStop(0, 'rgba(8,8,8,0)'); g.addColorStop(1, 'rgba(8,8,8,.95)'); rect(x + 2, by + A.vh - 16, w - 12, 16, g); } }
  // the foot: a scroll hint while there is more, and the button
  rect(x + 14, y + A.h - A.foot + 2, w - 28, 1, '#1d1a17');
  if (A.max && ANN.top < A.max - 2) { const s = tr(IZ('SCROLL FOR MORE', '下滑查看更多')); text(s, x + 16, y + A.h - 18 - (isCJK(s) ? 1 : 0), '#57524a'); }
  { const hb = { x: x + w - 166, y: y + A.h - 23, w: 74, h: 16 }; ANN.hide = hb; drawBtn(hb.x, hb.y, hb.w, hb.h, tr(IZ("DON'T SHOW", '不再显示')), !TOUCH.on && inR(hb, Input.mx, Input.my), TH.bone2); }
  const b = { x: x + w - 86, y: y + A.h - 23, w: 72, h: 16 }; ANN.hit = b; drawBtn(b.x, b.y, b.w, b.h, annGot() ? L('fl_ok') : L('ann_claim', ANN_GIFT.n), !TOUCH.on && inR(b, Input.mx, Input.my), annGot() ? TH.ember : TH.gold); ctx.globalAlpha = 1; };
