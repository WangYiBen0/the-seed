// ===== ACHROMA shards III: upgrades and synergies that reward fighting at range =====
'use strict';
Object.assign(ICONS, {
  farshot: ['...1....', '...1....', '.11111..', '11.1.11.', '1111111.', '11.1.11.', '.11111..', '...1....'],
  expose: ['1.1..1.1', '.1....1.', '1..11..1', '..1111..', '..1111..', '1..11..1', '.1....1.', '1.1..1.1'],
  volley: ['........', '1111..1.', '......11', '1111111.', '......11', '1111..1.', '........', '........'],
  hotb: ['.1..1..1', '1..1..1.', '.1..1..1', '........', '11111111', '1.1.1.11', '11111111', '........'],
  weave: ['1......1', '.1....1.', '..1..1..', '...11...', '...11...', '..1..1..', '.1....1.', '1......1'],
});
const SHARDS3 = [
  { id: 'farshot', n: N4('RAPTOR RETINA', '鷹視網膜', '鷹の網膜', '鹰视网膜'), rar: 0, max: 3, c: C.cyan, icon: 'farshot', tag: 'POWER',
    d: l => N4(`RANGED WEAPONS HIT HARDER THE FARTHER THE FOE: UP TO +${[15, 25, 35][l - 1]}%.`, `遠程武器距離敵人越遠傷害越高，最多 +${[15, 25, 35][l - 1]}%。`, `遠距離武器は敵が遠いほど威力上昇。最大+${[15, 25, 35][l - 1]}%。`, `远程武器距离敌人越远伤害越高，最多 +${[15, 25, 35][l - 1]}%。`), a: (S, l) => S.farshot = l },
  { id: 'expose', n: N4('LUMINOL', '魯米諾', 'ルミノール', '鲁米诺'), rar: 1, max: 3, c: C.gold, icon: 'expose', tag: 'HUNT',
    d: l => N4(`RANGED HITS EXPOSE FOES FOR 2S: EXPOSED FOES TAKE +${[6, 10, 14][l - 1]}% DAMAGE FROM EVERYTHING.`, `遠程命中會使敵人暴露 2 秒，暴露的敵人受到的所有傷害 +${[6, 10, 14][l - 1]}%。`, `遠距離攻撃の命中で敵を2秒間露出させ、受けるダメージ+${[6, 10, 14][l - 1]}%。`, `远程命中会使敌人暴露 2 秒，暴露的敌人受到的所有伤害 +${[6, 10, 14][l - 1]}%。`), a: (S, l) => S.expose = l },
  { id: 'volley', n: N4('AMBIDEXTERITY', '雙手同利', '両手利き', '双手同利'), rar: 2, max: 1, c: C.orange, icon: 'volley', tag: 'FORM',
    d: l => N4('YOUR OTHER WEAPON ATTACKS ALONGSIDE YOUR MAIN ONE AT 30% ATTACK SPEED AND 40% DAMAGE.', '另一把武器以 30% 攻速、40% 傷害與主手武器一同攻擊。', 'もう一方の武器が攻撃速度30%・威力40%で一緒に攻撃する。', '另一把武器以 30% 攻速、40% 伤害与主手武器一同攻击。'), a: (S, l) => S.volley = l },
  { id: 'hotb', n: N4('FEVER', '高燒', '高熱', '高烧'), rar: 1, max: 3, c: C.red, icon: 'hotb', tag: 'AMMO',
    d: l => N4(`EVERY SHOT OF A RANGED WEAPON ADDS +2% ATTACK SPEED, UP TO +${[9, 15, 21][l - 1]}%. RELOADING VENTS THE HEAT.`, `遠程武器每次射擊攻速 +2%，最多 +${[9, 15, 21][l - 1]}%，換彈時熱量歸零。`, `遠距離武器の射撃ごとに攻撃速度+2%（最大+${[9, 15, 21][l - 1]}%）。リロードで熱が抜ける。`, `远程武器每次射击攻速 +2%，最多 +${[9, 15, 21][l - 1]}%，换弹时热量归零。`), a: (S, l) => S.hotb = l },
  { id: 'weave', n: N4('REFLEX ARC', '反射弧', '反射弓', '反射弧'), rar: 1, max: 2, c: '#e8e8ec', icon: 'weave', tag: 'SURVIVE',
    d: l => N4(`YOUR PROJECTILES HAVE A ${[10, 20][l - 1]}% CHANCE TO ERASE ENEMY BULLETS THEY TOUCH.`, `彈丸碰到敵彈時，有 ${[10, 20][l - 1]}% 機率將其抵消。`, `自分の弾が敵弾に触れると${[10, 20][l - 1]}%の確率で相殺する。`, `弹丸碰到敌弹时，有 ${[10, 20][l - 1]}% 概率将其抵消。`), a: (S, l) => S.weave = l },
];
for (const s of SHARDS3) { SHARDS.push(s); SHARD[s.id] = s; }
const SYN3 = [
  { id: 'hawkeye', n: N4('TETRACHROMACY', '四色視覺', '四色型色覚', '四色视觉'), need: ['farshot', 'keen'], c: C.cyan, d: N4('RANGED HITS ON DISTANT FOES GAIN +20% CRIT CHANCE', '遠程命中遠處敵人時，暴擊率 +20%', '遠くの敵への遠距離攻撃の会心率+20%', '远程命中远处敌人时，暴击率 +20%') },
  { id: 'firing', n: N4('EXTRA LIMB', '多生肢體', '余剰肢', '多生肢体'), need: ['volley', 'fork'], c: C.orange, d: N4('THE OFF-HAND WEAPON ATTACKS AT 50% SPEED', '副手武器攻速提高至 50%', '副武器の攻撃速度が50%に上がる', '副手武器攻速提高至 50%') },
  { id: 'overheat', n: N4('HYPERTHERMIA', '惡性高熱', '悪性高熱', '恶性高热'), need: ['hotb', 'quick'], c: C.red, d: N4('FEVER CAP DOUBLED; RELOADING KEEPS HALF THE HEAT', '高燒上限加倍，換彈時保留一半熱量', '高熱の上限が倍、リロードで熱が半分残る', '高烧上限加倍，换弹时保留一半热量') },
  { id: 'crossfire', n: N4('COMPOUND EYES', '複眼', '複眼', '复眼'), need: ['weave', 'expose'], c: C.gold, d: N4('ERASING A BULLET FIRES A SEEKING FRAGMENT THAT EXPOSES ITS TARGET', '抵消子彈時射出一枚追蹤碎片，並使目標暴露', '弾を相殺すると追尾する欠片を放ち、標的を露出させる', '抵消子弹时射出一枚追踪碎片，并使目标暴露') },
  { id: 'sniper', n: N4('HUNTER\'S PATIENCE', '獵手耐心', '狩人の忍耐', '猎手耐心'), need: ['farshot', 'expose'], c: '#a4cfe0', d: N4('EXPOSE IS TWICE AS STRONG ON DISTANT FOES', '暴露效果對遠處的敵人加倍', '遠くの敵への露出効果が2倍', '暴露效果对远处的敌人加倍') },
];
for (const s of SYN3) SYNERGIES.push(s);

// ---- hooks ----
const LONG_R = 120; // "distant" for hawkeye / sniper's nest
function rangedWeapon() { const p = G.p, w = p && WEAPONS[p.weapons[p.wi]]; return !!w && !MELEE.has(w.kind); }
// a hit from the ranged weapon in hand (not fields, chain shocks, fragments or anything a melee weapon spawned)
function rangedHit(o) { return !o.melee && !o.fromField && !o.fromShock && !o.frag && rangedWeapon(); }
function exposeMul(e) { const S = G.S; if (!S.expose || !(e.expT > G.time)) return 1; const far = SYN.sniper && dist(G.p.x, G.p.y, e.x, e.y) >= LONG_R; return 1 + [0, .06, .1, .14][S.expose] * (far ? 2 : 1); }
function rangedMods(e, dmg, o) {
  const S = G.S, p = G.p; dmg *= exposeMul(e);
  if (!rangedHit(o)) return dmg;
  const d = dist(p.x, p.y, e.x, e.y);
  if (S.farshot) dmg *= 1 + [0, .15, .25, .35][S.farshot] * clamp((d - 60) / 100, 0, 1);
  if (SYN.hawkeye && d >= LONG_R) o.critBonus = (o.critBonus || 0) + .2;
  return dmg;
}
function rangedAfterHit(e, o) { if (G.S.expose && rangedHit(o)) e.expT = G.time + 2; }
// Heat is stored as integer percentage points; only main-hand trigger pulls add heat.
function volleyPull(p, w, o) { const S = G.S; if (MELEE.has(w.kind) || o.ghost || o.child || o.offhand || o.decoy) return 0;
  if (S.hotb) p.heat = Math.min(heatCap(), (p.heat || 0) + 2); return 0; }
// volley: the holstered weapon attacks alongside the main one at 30% attack speed (50% with Firing Line) and 40% damage
function offhandTick(p, dt, held) {
  if (!G.S.volley || p.weapons.length < 2) return; p.offCd = (p.offCd || 0) - dt; if (!held || p.offCd > 0) return;
  const w2 = WEAPONS[p.weapons[1 - p.wi]]; if (!w2 || w2.hold) { p.offCd = .4; return; }
  // the off-hand weapon spends its own magazine and reloads like any holstered weapon
  if (usesAmmo(w2)) { const a = ammoOf(p, w2.id); if (a.rl > 0) return; if (a.n <= 0) { startReload(p, w2.id); return; }
    if (!(G.S.bottomless && Math.random() < .3)) a.n--; if (a.n <= 0) startReload(p, w2.id); }
  attack(p, w2, { offhand: true, power: .4, charge: w2.kind === 'bow' ? 1 : undefined, spins: 1 });
  p.offCd = 1 / (weaponRate(p, w2) * (SYN.firing ? .5 : .3)); }
// lead core: projectiles lose speed and gain size over their first 0.8s of flight
const LEAD_SKIP = new Set(['lob', 'mine', 'orb', 'chakram', 'saw', 'missile', 'rocket', 'flame', 'shard', 'deflect']);
function leadTick(b) { if (LEAD_SKIP.has(b.kind) || b.frag) return; if (b.r0 === undefined) { b.r0 = b.r; b.v0 = Math.hypot(b.vx, b.vy); } if (!b.v0) return;
  const k = Math.min(1, b.t / .8), l = G.S.lead, v = Math.hypot(b.vx, b.vy), want = b.v0 * (1 - .5 * k);
  if (v > 0) { b.vx *= want / v; b.vy *= want / v; } b.r = Math.max(b.r, b.r0 * (1 + .6 * l * k)); }
const heatCap = () => [0, 9, 15, 21][G.S.hotb || 0] * (SYN.overheat ? 2 : 1);
function heatMul(p, w) { return G.S.hotb && !MELEE.has(w.kind) ? 1 + .01 * Math.min(heatCap(), p.heat || 0) : 1; }
function ventHeat(p) { p.heat = SYN.overheat ? Math.floor((p.heat || 0) / 2) : 0; }
// bullet weave: each enemy bullet is rolled once, by the first projectile of yours that touches it
function weaveTick() {
  const S = G.S; if (!S || !S.weave || !G.ebullets.length || !G.bullets.length) return; const ch = [0, .1, .2][S.weave];
  for (const b of G.bullets) { if (b.kind === 'lob' || b.kind === 'mine' || b.dead) continue; const br = (b.r || 2) + 1;
    for (let i = G.ebullets.length - 1; i >= 0; i--) { const q = G.ebullets[i]; if (q.wv || q.delay > 0) continue; const rr = br + (q.r || 3); if (Math.abs(q.x - b.x) > rr || Math.abs(q.y - b.y) > rr || dist(q.x, q.y, b.x, b.y) > rr) continue;
      q.wv = true; if (Math.random() >= ch) continue;
      G.ebullets.splice(i, 1); burst(q.x, q.y, 4, col(5), 60, .2); starFx(q.x, q.y, 4, C.gold, .08);
      if (SYN.crossfire && G.time > (G.cfT || 0)) { G.cfT = G.time + .08; const e = nearestEnemy(q.x, q.y, 170); if (e) { e.expT = G.time + 2;
        G.bullets.push(mkBullet({ x: q.x, y: q.y, a: ang(q.x, q.y, e.x, e.y), spd: 260, dmg: 7 * S.dmg, r: 1.5, life: .8, kind: 'shard', home: 3, proc: .3, knock: 10, tint: C.gold, frag: true })); } } } }
}
// exposed foes carry a small gold bracket
function drawExposed(e, x, y) { if (!(e.expT > G.time) || e.dead) return; const r = e.r + 3, c = ((G.time * 6) | 0) % 2 ? C.gold : '#fff1b8';
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { rect(x + sx * r - (sx > 0 ? 1 : 0), y + sy * r - (sy > 0 ? 1 : 0), 1, 1, c); rect(x + sx * (r - 1) - (sx > 0 ? 1 : 0), y + sy * r - (sy > 0 ? 1 : 0), 1, 1, c); rect(x + sx * r - (sx > 0 ? 1 : 0), y + sy * (r - 1) - (sy > 0 ? 1 : 0), 1, 1, c); } }
const _drawMarks3 = drawMarks; drawMarks = function (e, x, y) { _drawMarks3(e, x, y); drawExposed(e, x, y); };
