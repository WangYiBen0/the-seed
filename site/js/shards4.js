// ===== ACHROMA serums IV: parts into power, overflowing healing into armor, a grudge, and health converted to armor =====
'use strict';
Object.assign(ICONS, {
  scrap: ['..1111..', '.1....1.', '1..11..1', '1.1..1.1', '1.1..1.1', '1..11..1', '.1....1.', '..1111..'],
  hyper: ['...11...', '..1111..', '.111111.', '11111111', '1.1111.1', '..1111..', '..1..1..', '..1..1..'],
  grudge: ['1......1', '.1....1.', '..1..1..', '11111111', '1..11..1', '1.1..1.1', '11111111', '........'],
  melt: ['.111111.', '11....11', '1.1111.1', '1.1111.1', '.111111.', '...11...', '...11...', '..1111..'],
});
const SHARDS4 = [
  { id: 'scrap', n: N4('SCRAP HUNGER', '拾荒本能', '拾い屋の本能', '拾荒本能'), rar: 1, max: 2, c: C.gold, icon: 'scrap', tag: 'POWER',
    d: l => N4(`+${[2, 3][l - 1]}% DAMAGE FOR EVERY 200 PARTS YOU CARRY (UP TO +${[30, 45][l - 1]}%).`, `每持有 200 零件，傷害 +${[2, 3][l - 1]}%（最多 +${[30, 45][l - 1]}%）。`, `所持パーツ200ごとにダメージ+${[2, 3][l - 1]}%（最大+${[30, 45][l - 1]}%）。`, `每持有 200 零件，伤害 +${[2, 3][l - 1]}%（最多 +${[30, 45][l - 1]}%）。`),
    a: (S, l) => { S.scrap = l; } },
  { id: 'hyper', n: N4('HYPERPLASIA', '代償增生', '代償性過形成', '代偿增生'), rar: 1, max: 2, c: C.green, icon: 'hyper', tag: 'SURVIVE',
    d: l => N4(`HEALING PAST FULL HEALTH BECOMES TEMPORARY ARMOR (UP TO 2, LASTS ${[30, 60][l - 1]}S).`, `溢出的治療轉化為臨時護甲（最多 2 點，持續 ${[30, 60][l - 1]} 秒）。`, `HP上限を超えた回復は一時アーマーになる（最大2、${[30, 60][l - 1]}秒持続）。`, `溢出的治疗转化为临时护甲（最多 2 点，持续 ${[30, 60][l - 1]} 秒）。`),
    a: (S, l) => { S.hyper = l; } },
  { id: 'grudge', n: N4('GRUDGE', '宿怨素', '怨恨', '宿怨素'), rar: 1, max: 2, c: C.red, icon: 'grudge', tag: 'HUNT',
    d: l => N4(`AFTER YOU LOSE HEALTH OR ARMOR, DEAL +${[20, 30][l - 1]}% DAMAGE TO THE FOE THAT DID IT FOR ${[5, 8][l - 1]}S (ONE FOE AT A TIME).`, `受到傷害後，對造成此次傷害的敵人傷害 +${[20, 30][l - 1]}%，持續 ${[5, 8][l - 1]} 秒（同時只記恨一個敵人）。`, `被弾後、その攻撃をした敵へのダメージ+${[20, 30][l - 1]}%（${[5, 8][l - 1]}秒、対象は一体のみ）。`, `受到伤害后，对造成此次伤害的敌人伤害 +${[20, 30][l - 1]}%，持续 ${[5, 8][l - 1]} 秒（同时只记恨一个敌人）。`),
    a: (S, l) => { S.grudge = l; } },
  { id: 'melt', n: N4('OSTEOLYSIS', '骨甲溶解', '骨甲溶解', '骨甲溶解'), rar: 2, max: 1, c: '#d84a5a', icon: 'melt', tag: 'SURVIVE',
    d: l => N4('REDUCE MAXIMUM HEALTH TO 1. GAIN ARMOR EQUAL TO THE MAXIMUM HEALTH LOST +2.', '生命上限降至 1，獲得等同於扣除生命上限 +2 的護甲。', 'HP上限を1にし、減少したHP上限+2のアーマーを獲得する。', '生命上限降至 1，获得等同于扣除生命上限 +2 的护甲。'),
    a: (S, l) => { S.melt = 1; }, once: p => { const n = p.meltArmor || 0; if (n > 0) { p.armor = Math.min(p.maxArmor, p.armor + n); AU.play('armor'); burst(p.x, p.y, 20, '#d84a5a', 110, .5); notify(L('n_melt', n), '#d84a5a'); } } },
];
for (const s of SHARDS4) { SHARDS.push(s); SHARD[s.id] = s; }
Object.assign(STR, { n_melt: ['OSTEOLYSIS: +{0} ARMOR', '骨甲溶解：護甲 +{0}', '骨甲溶解：アーマー+{0}', '骨甲溶解：护甲 +{0}'], n_tarmor: ['TEMPORARY ARMOR', '臨時護甲', '一時アーマー', '临时护甲'], n_grudge: ['GRUDGE', '記恨', '恨み', '记恨'] });

// ---- osteolysis: derive capacity from unconverted stats; only acquisition grants current armor ----
const _recomputeS4 = recomputeStats; recomputeStats = function () { _recomputeS4(); const p = G.p, S = G.S;
  if (S.melt && G.mode !== 'invade') { p.meltArmor = Math.max(0, p.maxHp - 1) + 2; p.maxHp = 1; p.hp = Math.min(p.hp, 1); p.maxArmor += p.meltArmor; p.armor = Math.min(p.armor, p.maxArmor); } };
// ---- scrap hunger: damage from the parts you carry ----
const _dmgModsS4 = dmgMods; dmgMods = function (e, dmg, o) { dmg = _dmgModsS4(e, dmg, o); const S = G.S, p = G.p;
  if (S.scrap) { const per = [0, .02, .03][S.scrap], cap = [0, .3, .45][S.scrap]; dmg *= 1 + Math.min(cap, Math.floor((G.ink || 0) / 200) * per); }
  if (S.grudge && p.grudge && p.grudge.e === e && p.grudge.t > G.time) dmg *= 1 + [0, .2, .3][S.grudge];
  return dmg; };
// ---- hyperplasia: overflowing healing turns into temporary armor ----
const _healS4 = healPlayer; healPlayer = function (n) { const p = G.p, before = p.hp, h = _healS4(n); const over = n - h;
  if (G.S.hyper && over > 0 && !hasCurse('drought')) { p.tArm = p.tArm || []; const life = [0, 30, 60][G.S.hyper]; let add = 0; for (let i = 0; i < over && p.tArm.length < 2; i++) { p.tArm.push(G.time + life); add++; }
    if (add) { AU.play('armor', 1.4, .6); ringFx(p.x, p.y, 16, C.green, .3, 2); notify(L('n_tarmor') + ' +' + add, C.green); } }
  return h; };
// ---- who hurt you: enemy bullets carry their shooter; contact, mechanics and pools are matched to the nearest foe ----
const _eshotS4 = eshot; eshot = function (x, y, a, spd, o = {}) { if (G.curShooter && o.own === undefined) o = Object.assign({}, o, { own: G.curShooter }); return _eshotS4(x, y, a, spd, o); };
function hurtSource(sx, sy, mechHit) { if (G.hitSrc && !G.hitSrc.dead) return G.hitSrc;
  let best = null, bd = 1e9; for (const e of G.enemies) { if (e.dead || e.deathFightLeft > 0 || e.spawnT > 0) continue; const d = dist(e.x, e.y, sx, sy) - e.r * (e.scale || 1); if (d < bd) { bd = d; best = e; } }
  if (best && bd < 14) return best; if (G.boss && !G.boss.dead) return G.boss; return best; }
const _hurtPlayerS4 = hurtPlayer; hurtPlayer = function (dmg, sx, sy, mechHit, pierce) { const p = G.p;
  // temporary armor soaks a hit before anything else
  if (p && p.tArm && p.tArm.length && !pierce && p.alive && p.inv <= 0 && !(p.dashT > 0 && !mechHit) && G.state === 'play' && !(typeof TST !== 'undefined' && TST.god)) {
    p.tArm.shift(); p.inv = .6; p.lastHit = 0; AU.play('armor', 1.2); shake(.18, true); hitstop(.04, true); burst(p.x, p.y, 10, C.green, 100, .3); grudgeOn(sx, sy, mechHit); return true; }
  const hp0 = p ? p.hp : 0, ar0 = p ? p.armor : 0, r = _hurtPlayerS4(dmg, sx, sy, mechHit, pierce);
  if (r && p && (p.hp < hp0 || p.armor < ar0)) grudgeOn(sx, sy, mechHit);
  return r; };
function grudgeOn(sx, sy, mechHit) { const S = G.S, p = G.p; if (!S || !S.grudge) return; const e = hurtSource(sx, sy, mechHit); if (!e) return;
  const fresh = !p.grudge || p.grudge.e !== e || p.grudge.t < G.time; p.grudge = { e, t: G.time + [0, 5, 8][S.grudge] }; if (fresh) { floatText(e.x, e.y - e.r - 14, L('n_grudge'), C.red, 1, .9); AU.play('curse', 1.6, .4); } }
// the shooter of every bullet fired inside an AI update (bosses included)
const _updateEnemiesS4 = updateEnemies; updateEnemies = function (dt) { const prev = G.curShooter; try { _updateEnemiesS4(dt); } finally { G.curShooter = prev; } };
// expired temporary armor falls away
const _updatePlayerS4 = updatePlayer; updatePlayer = function (dt) { _updatePlayerS4(dt); const p = G.p; if (p && p.tArm && p.tArm.length) { const n = p.tArm.length; p.tArm = p.tArm.filter(t => t > G.time); if (p.tArm.length < n) AU.play('ui', .7, .4); } };
// the grudge target wears a red mark
const _drawEnemyExtraS4 = drawEnemyExtra; drawEnemyExtra = function (e, x, cyb) { _drawEnemyExtraS4(e, x, cyb); const p = G.p;
  if (p && p.grudge && p.grudge.e === e && p.grudge.t > G.time && G.S.grudge) { const r = e.r * (e.scale || 1) + 5, a = G.time * 3; for (let i = 0; i < 4; i++) { const aa = a + i * 1.57; pxLine(x + Math.cos(aa) * r, cyb + Math.sin(aa) * r, x + Math.cos(aa) * (r - 3), cyb + Math.sin(aa) * (r - 3), C.red); } } };
// the temporary armor on the HUD: green plates after the armor (blinking in their last 5 seconds)
const _drawHUDS4 = drawHUD; drawHUD = function () { _drawHUDS4(); const p = G.p; if (!p || !p.tArm || !p.tArm.length) return; const x0 = 8 + p.maxArmor * 9 + (p.maxArmor ? 3 : 0);
  p.tArm.forEach((t, i) => { const x = x0 + i * 9, y = 18, left = t - G.time; if (left < 5 && ((G.time * 6) | 0) % 2) return; rect(x - 1, y - 1, 9, 5, col(0)); rect(x, y, 7, 3, C.green); rect(x, y, 7, 1, '#d8f0c0'); }); };
