// ===== ACHROMA weapons: 15 attack methods, all routed through the universal hit pipeline =====
'use strict';
const WEAPONS = {
  nail: { nm: N3('NAIL', '釘槍', 'ネイル'), d: N3('STEADY SIDEARM', '穩定的隨身手槍', '安定したサイドアーム'), kind: 'gun', rate: 5, dmg: 7, spd: 340, spread: .05, n: 1, life: .75, r: 2, proc: 1, knock: 60, recoil: 2, shake: .03, sfx: 'shoot', shell: 1, st: [2, 3, 3],
    spr: ['..........', '.555555555', '.544433333', '.55.......', '.55.......'] },
  hail: { nm: N3('HAIL', '冰雹', 'ヘイル'), d: N3('BULLET HOSE', '彈雨傾瀉', '弾幕ホース'), kind: 'gun', rate: 13, dmg: 3, spd: 380, spread: .1, n: 1, life: .6, r: 1.5, proc: .45, knock: 25, recoil: 1, shake: .015, sfx: 'smg', shell: 1, st: [1, 5, 3],
    spr: ['............', '555555555555', '544444443333', '555.55......', '..5.55......'] },
  storm: { nm: N3('STORM', '暴風', 'ストーム'), d: N3('SPINS UP TO A ROAR. KEEP FIRING TO STAY HOT', '越轉越快，持續射擊保持熱度', '回転で加速。撃ち続けて維持'), kind: 'gun', spin: 1, rate: 22, dmg: 2.8, spd: 400, spread: .13, n: 1, life: .6, r: 1.5, proc: .35, knock: 20, recoil: 1, shake: .01, sfx: 'minigun', shell: 1, st: [1, 5, 3],
    spr: ['..............', '55555555555555', '53333333333333', '55555555555555', '5544..........', '.55...........'] },
  scatter: { nm: N3('SCATTER', '散射', 'スキャッター'), d: N3('SEVEN PELLETS, POINT BLANK', '七發散彈，近距離致命', '7発の散弾、至近距離で真価'), kind: 'gun', rate: 1.5, dmg: 4.5, spd: 310, spdVar: .7, spread: .3, n: 7, life: .33, r: 1.5, proc: .5, knock: 120, recoil: 7, shake: .14, sfx: 'pellet', bk: 'pellet', shell: 2, st: [4, 2, 1],
    spr: ['.............', '5555555555555', '5444444444444', '5553.........', '553..........'] },
  rail: { nm: N3('RAIL', '軌道', 'レール'), d: N3('PIERCES EVERYTHING IN A LINE', '貫穿直線上的一切', '直線上の全てを貫く'), kind: 'rail', rate: 1.1, dmg: 28, proc: 1, knock: 140, recoil: 8, shake: .2, sfx: 'rail', st: [5, 1, 5],
    spr: ['..............', '55555555555555', '54444333333335', '5555..........', '.55...........'] },
  prism: { nm: N3('PRISM', '稜光', 'プリズム'), d: N3('CONTINUOUS BEAM. MELTS', '持續光束，熔解一切', '持続ビーム。溶かし尽くす'), kind: 'beam', rate: 14, dmg: 2.4, proc: .22, knock: 18, recoil: 0, shake: 0, sfx: 'beam', st: [2, 5, 4],
    spr: ['...........', '.5555555555', '54444444445', '.5555555555', '..55.......'] },
  volt: { nm: N3('VOLT', '伏特', 'ボルト'), d: N3('LIGHTNING THAT JUMPS BETWEEN FOES', '在敵人之間跳躍的閃電', '敵から敵へ跳ぶ電撃'), kind: 'chain', rate: 3.2, dmg: 9, proc: .7, knock: 30, recoil: 2, shake: .04, sfx: 'zap', st: [3, 3, 3],
    spr: ['..........5.', '5555555555.5', '54444cc44445', '5555555555.5', '..55......5.'] },
  edge: { nm: N3('EDGE', '鋒刃', 'エッジ'), d: N3('BLADE. CUTS BULLETS OUT OF THE AIR', '刀刃，可將子彈斬回', '弾を斬り返す刀'), kind: 'melee', refl: .5, rate: 2.6, dmg: 15, range: 26, arc: 2.5, proc: 1, knock: 210, recoil: 0, shake: .05, sfx: 'slash', st: [4, 3, 1],
    spr: ['.............', '..55555555555', '33444444444..', '..5..........', '.............'] },
  lance: { nm: N3('LANCE', '長槍', 'ランス'), d: N3('LUNGING THRUST THAT SKEWERS A LINE', '突進刺擊，貫穿一整列', '突進突き。一列を串刺し'), kind: 'thrust', rate: 2, dmg: 20, range: 50, proc: 1, knock: 170, recoil: 0, shake: .06, sfx: 'thrust', st: [4, 2, 2],
    spr: ['..............5.', '5555555555555455', '..............5.'] },
  whirl: { nm: N3('WHIRL', '迴旋', 'ワール'), d: N3('SPINNING GLAIVE. HITS ALL AROUND', '旋轉長刃，橫掃四周', '回転する薙刀。周囲を一掃'), kind: 'spin', rate: 2.1, dmg: 11, range: 30, proc: .8, knock: 190, recoil: 0, shake: .05, sfx: 'whirl', st: [3, 3, 1],
    spr: ['5.............5', '455555555555554', '5.............5'] },
  halo: { nm: N3('HALO', '光環', 'ハロー'), d: N3('RETURNING DISC, HITS TWICE', '回旋飛刃，往返兩次命中', '戻ってくる円刃。2度当たる'), kind: 'chakram', rate: 1.8, dmg: 10, spd: 280, proc: .7, knock: 70, recoil: 2, shake: .04, sfx: 'chakram', st: [3, 2, 3],
    spr: ['.5555.', '54..45', '5.....', '54..45', '.5555.'] },
  bloom: { nm: N3('BLOOMER', '綻花砲', 'ブルーマー'), d: N3('ROCKETS. BIG BLAST RADIUS', '火箭，大範圍爆炸', 'ロケット。広い爆発範囲'), kind: 'rocket', rate: 1.15, dmg: 8, aoe: 20, spd: 230, proc: .6, knock: 80, recoil: 6, shake: .08, sfx: 'rocket', st: [4, 2, 4],
    spr: ['.............', '5555555555555', '5444444444445', '5555555555555', '...55........'] },
  cluster: { nm: N3('CLUSTER', '集束', 'クラスター'), d: N3('LOBBED GRENADE THAT SPLITS INTO BOMBLETS', '拋射榴彈，分裂成子炸彈', '子弾に分裂する投擲グレネード'), kind: 'lob', rate: 1.2, dmg: 20, proc: .5, knock: 90, recoil: 4, shake: .05, sfx: 'lob', st: [4, 2, 3],
    spr: ['.555555555.', '54444444445', '54333333345', '.555555555.', '...55......'] },
  bow: { nm: N3('LONGBOW', '長弓', 'ロングボウ'), d: N3('HOLD TO CHARGE. FULL DRAW PIERCES', '按住蓄力，滿弓穿透', '長押しで溜め。最大で貫通'), kind: 'bow', charge: .7, dmg: 8, dmgMax: 46, proc: 1, knock: 160, recoil: 4, shake: .1, sfx: 'bow', st: [5, 1, 5],
    spr: ['.55..', '5..5.', '5...5', '5..5.', '.55..'] },
  splinter: { nm: N3('SPLINTER', '裂針', 'スプリンター'), d: N3('NEEDLES STICK IN, THEN BURST', '針刺入後爆裂', '刺さった針が破裂する'), kind: 'stick', rate: 5.5, dmg: 3, burstDmg: 7, spd: 420, spread: .06, proc: .5, knock: 20, recoil: 1, shake: .02, sfx: 'needle', st: [3, 4, 3],
    spr: ['...........', '55555555555', '5444333333.', '55.5.......', '55.........'] },
  flamer: { nm: N3('FLAMER', '噴火器', 'フレイマー'), d: N3('SHORT CONE OF FIRE. ALWAYS IGNITES', '短程火焰噴射，必定點燃', '短射程の炎。必ず炎上させる'), kind: 'flame', rate: 16, dmg: 1.7, proc: .25, knock: 8, recoil: 0, shake: 0, sfx: 'flame', st: [2, 5, 1],
    spr: ['.......55...', '555555555555', '54444443334o', '5555555555..', '..55.55.....'] },
  graviton: { nm: N3('GRAVITON', '重力子', 'グラビトン'), d: N3('SLOW ORB THAT DRAGS FOES IN AND PULSES', '緩慢的球體，吸入敵人並脈衝傷害', '敵を引き寄せ脈動する低速球'), kind: 'orb', rate: .85, dmg: 8, spd: 85, proc: .4, knock: 0, recoil: 3, shake: .05, sfx: 'vortex', st: [3, 1, 3],
    spr: ['..55555..', '.5444445.', '5440v0445', '.5444445.', '..55555..', '...5.5...'] },
  whip: { nm: N3('LASH', '鞭笞', 'ラッシュ'), d: N3('LONG WHIP. THE TIP CRACKS FOR DOUBLE DAMAGE', '長鞭，鞭梢造成雙倍傷害', '長い鞭。先端は2倍ダメージ'), kind: 'whip', rate: 2.2, dmg: 10, range: 58, proc: 1, knock: 90, recoil: 0, shake: .04, sfx: 'whip', st: [3, 3, 3],
    spr: ['..........55', '........55..', '......55....', '5555555.....', '54..........'] },
  hammer: { nm: N3('MAUL', '戰鎚', 'モール'), d: N3('SLOW SLAM. SHOCKWAVE CRUSHES BULLETS', '緩慢重擊，衝擊波粉碎子彈', '重い叩きつけ。衝撃波が弾を砕く'), kind: 'slam', rate: .9, dmg: 26, range: 34, proc: 1, knock: 240, recoil: 0, shake: .14, sfx: 'hammer', st: [5, 1, 2],
    spr: ['........5555', '........5445', '555555555445', '544444445445', '555555555445', '........5445', '........5555'] },
  shuriken: { nm: N3('SHURIKEN', '手裏劍', '手裏剣'), d: N3('THREE STARS THAT BOUNCE AND PIERCE', '三枚會反彈並穿透的飛星', '跳ね返り貫通する三つの星'), kind: 'gun', bk: 'star', rate: 2.8, dmg: 6, spd: 290, spread: .2, n: 3, life: 1.4, r: 2.5, bounce: 2, pierce: 1, proc: .7, knock: 40, recoil: 2, shake: .03, sfx: 'chakram', st: [2, 3, 4],
    spr: ['...5...', '...4...', '..444..', '5444445', '..444..', '...4...', '...5...'] },
  twin: { nm: N3('TWINFANG', '雙牙', 'ツインファング'), d: N3('ALTERNATING DUAL PISTOLS', '左右交替射擊的雙槍', '左右交互に撃つ二丁拳銃'), kind: 'gun', alt: 1, rate: 9, dmg: 4.5, spd: 360, spread: .06, n: 1, life: .7, r: 1.8, proc: .8, knock: 40, recoil: 1, shake: .02, sfx: 'shoot', shell: 1, st: [2, 4, 3],
    spr: ['..55555555', '..54444445', '..55......', '5555555...', '5444444...', '55........'] },
  rivet: { nm: N3('RIVET', '鉚釘', 'リベット'), d: N3('THREE-ROUND BURSTS', '三連發點射', '3点バースト'), kind: 'gun', lab: 'burst', burst: 3, rate: 2.4, dmg: 7, spd: 430, spread: .03, n: 1, life: .8, r: 2, proc: 1, knock: 60, recoil: 3, shake: .04, sfx: 'shoot', shell: 1, st: [3, 3, 4],
    spr: ['............', '555555555555', '544443333335', '5555.55.....', '.55..55.....'] },
  helix: { nm: N3('HELIX', '螺旋', 'ヘリックス'), d: N3('TWO SHOTS THAT SPIRAL AROUND EACH OTHER', '兩發子彈互相纏繞前進', '絡み合って進む二発の弾'), kind: 'gun', bk: 'helix', n: 2, rate: 4, dmg: 5, spd: 250, spread: 0, life: 1.1, r: 2, proc: .8, knock: 40, recoil: 2, shake: .03, sfx: 'zap', st: [2, 3, 3],
    spr: ['...v...v...', '55555555555', '5444v4444v5', '55555555555', '.55........'] },
  mirage: { nm: N3('MIRAGE', '蜃影', 'ミラージュ'), d: N3('SHOTS SPLIT INTO THREE MID-FLIGHT', '子彈在飛行中分裂為三', '弾が飛行中に三つに分裂'), kind: 'gun', bk: 'split', rate: 3.4, dmg: 6, spd: 300, spread: .04, n: 1, life: .9, r: 2.2, proc: .8, knock: 40, recoil: 2, shake: .03, sfx: 'shoot', st: [3, 3, 3],
    spr: ['...........', '55555555555', '54443334445', '555.5555555', '55.........'] },
  saw: { nm: N3('BUZZSAW', '迴鋸', 'バズソー'), d: N3('A SPINNING BLADE THAT RICOCHETS AND KEEPS CUTTING', '不斷反彈並持續切割的旋鋸', '跳ね返りながら切り続ける回転刃'), kind: 'gun', lab: 'saw', bk: 'saw', rate: 1.4, dmg: 8, spd: 210, spread: 0, n: 1, life: 3, r: 5, bounce: 5, pierce: 999, proc: .6, knock: 50, recoil: 3, shake: .04, sfx: 'chakram', st: [3, 2, 3],
    spr: ['..55555..', '.5433345.', '543...345', '53.....35', '53..r..35', '53.....35', '543...345', '.5433345.', '..55555..'] },
  longshot: { nm: N3('LONGSHOT', '遠星', 'ロングショット'), d: N3('SNIPER. DAMAGE GROWS WITH DISTANCE', '狙擊槍，傷害隨距離增長', '狙撃銃。距離でダメージ上昇'), kind: 'gun', lab: 'snipe', bk: 'snipe', sight: 1, rate: .9, dmg: 36, spd: 650, spread: 0, n: 1, life: 1.2, r: 2, pierce: 1, proc: 1, knock: 120, recoil: 9, shake: .16, sfx: 'rail', st: [5, 1, 5],
    spr: ['....55..........', '5555555555555555', '5444444333333333', '55.5............'] },
  nova: { nm: N3('NOVA', '新星', 'ノヴァ'), d: N3('A RING OF SHOTS IN EVERY DIRECTION', '向四面八方射出一圈子彈', '全方位に弾を放つ'), kind: 'nova', rate: 1.4, dmg: 7, spd: 240, n: 14, life: .7, r: 2, proc: .6, knock: 60, recoil: 0, shake: .06, sfx: 'pellet', st: [3, 2, 2],
    spr: ['...555...', '..54445..', '.5g...g5.', '54.....45', '54..g..45', '54.....45', '.5g...g5.', '..54445..', '...555...'] },
  mines: { nm: N3('SOWER', '播種者', 'ソウワー'), d: N3('SCATTERS MINES THAT BURST WHEN FOES COME CLOSE', '撒下地雷，敵人靠近時爆炸', '敵が近づくと爆発する地雷をまく'), kind: 'mine', rate: 2.2, dmg: 26, proc: .5, knock: 100, recoil: 2, shake: .03, sfx: 'lob', st: [4, 2, 2],
    spr: ['..........', '.55555555.', '5444rr4445', '5444444445', '.55555555.', '..55..55..'] },
  hive: { nm: N3('HIVE', '蜂巢', 'ハイヴ'), d: N3('FOUR SEEKING MICRO-MISSILES', '四枚追蹤微型飛彈', '追尾するマイクロミサイル四発'), kind: 'hive', rate: 1.1, dmg: 6, proc: .5, knock: 50, recoil: 4, shake: .05, sfx: 'rocket', st: [3, 2, 4],
    spr: ['555555555555', '5o5o5o5o5445', '555555555445', '544444444445', '555555555445', '5o5o5o5o5445', '555555555555'] },
  frostbite: { nm: N3('FROSTBITE', '霜咬', 'フロストバイト'), d: N3('ICE SERUMS THAT CHILL AND SHATTER', '冰晶子彈，冰凍並碎裂', '冷気を与え砕ける氷の弾'), kind: 'gun', bk: 'ice', rate: 3.2, dmg: 6, spd: 330, spread: .05, n: 1, life: .8, r: 2.2, proc: .8, knock: 40, recoil: 2, shake: .03, sfx: 'needle', st: [3, 3, 3],
    spr: ['.......f...', '55555555ff.', '544444444f5', '5555555555.', '55.........'] },
  iai: { nm: N3('IAI', '居合', '居合'), d: N3('DASH THROUGH FOES IN ONE DRAWN CUT', '拔刀一閃，衝刺斬穿敵人', '抜刀一閃、敵を斬り抜ける'), kind: 'iai', rate: 1.3, dmg: 24, range: 64, proc: 1, knock: 120, recoil: 0, shake: .1, sfx: 'thrust', st: [5, 2, 2],
    spr: ['..............55', '3355555555555554', '33..............'] },
  fist: { nm: N3('GAUNTLET', '拳套', 'ガントレット'), d: N3('RAPID PUNCHES. EVERY THIRD BLOW SHATTERS', '連續快拳，每第三擊造成重擊', '連打の拳。三撃目が粉砕する'), kind: 'fist', rate: 4.5, dmg: 7, range: 18, proc: 1, knock: 80, recoil: 0, shake: .03, sfx: 'slash', st: [3, 5, 1],
    spr: ['.5555..', '544445.', '5444445', '5444445', '544445.', '.5554..', '..55...'] },
  carom: { nm: N3('CAROM', '撞球', 'キャロム'), d: N3('SHOTS RICOCHET OFF WALLS AND HIT HARDER WITH EVERY BOUNCE', '子彈在牆面間反彈，每次反彈威力提升', '壁で跳ね返るたびに威力が増す跳弾'), kind: 'gun', lab: 'carom', bk: 'pin', rate: 2.8, dmg: 7, spd: 330, spread: .04, n: 1, life: 1.7, r: 2.2, bounce: 4, proc: .8, knock: 40, recoil: 2, shake: .03, sfx: 'shoot', shell: 1, st: [2, 3, 4],
    spr: ['............', '555555555555', '5444ll444445', '5555555555..', '.55.........'] },
  crescent: { nm: N3('CRESCENT', '新月', 'クレセント'), d: N3('A SLOW CRESCENT WAVE THAT CUTS THROUGH EVERYTHING', '緩慢的新月波，貫穿一切', '全てを切り裂くゆっくりとした三日月波'), kind: 'gun', lab: 'crescent', bk: 'wave', rate: 1.5, dmg: 14, spd: 190, spread: 0, n: 1, life: 1, r: 7, pierce: 999, proc: .9, knock: 90, recoil: 3, shake: .05, sfx: 'whirl', st: [3, 2, 3],
    spr: ['.......55..', '55555555v55', '5444444445.', '55555555v55', '.55....55..'] },
  trident: { nm: N3('TRIDENT', '三叉戟', 'トライデント'), d: N3('THREE PIERCING RAILS IN A FAN', '扇形射出三道穿透軌光', '扇状に放つ三本の貫通レール'), kind: 'rail', lab: 'trident', fan: 3, fanSp: .1, rate: 1.2, dmg: 15, proc: .8, knock: 90, recoil: 7, shake: .14, sfx: 'rail', st: [4, 2, 4],
    spr: ['...........5.5', '55555555555455', '544444444444g5', '55555555555455', '.55........5.5'] },
  firework: { nm: N3('FIREWORK', '煙火', 'ファイアワーク'), d: N3('A SHELL THAT BURSTS INTO SPARKS AT THE CROSSHAIR', '在準星處綻放成火花的彈殼', '照準の位置で火花に弾ける弾'), kind: 'gun', lab: 'firework', bk: 'fw', rate: 1.4, dmg: 7, spd: 260, spread: .02, n: 1, life: 1.2, r: 2.5, proc: .7, knock: 60, recoil: 4, shake: .05, sfx: 'rocket', st: [4, 2, 3],
    spr: ['.........r..', '555555555g5.', '5444444445r5', '555555555g5.', '..55.....r..'] },
  scythe: { nm: N3('SCYTHE', '收割鐮', 'サイス'), d: N3('HOLD TO CHARGE: THE LONGER YOU HOLD, THE MORE TIMES THE SCYTHE WHIRLS AROUND YOU (UP TO 5), DRAGGING FOES IN', '按住蓄力：蓄力越久，鐮刀繞身旋轉的圈數越多（最多 5 圈），並將敵人拉向你', '長押しで溜め：長いほど鎌が周囲を回る回数が増える（最大5回）。敵を引き寄せる'), kind: 'reap', lab: 'reap', reap: 1, charge: 1.2, rate: 1.7, dmg: 17, range: 36, proc: 1, knock: 160, recoil: 0, shake: .07, sfx: 'slash', st: [4, 2, 2],
    spr: ['..........5555.', '.........544445', '33555555555..45', '..........5..4.', '...........5...'] },
};
for (const k in WEAPONS) WEAPONS[k].id = k;
// magazine size, reload seconds, cartridge style, accent color (the color the reload "absorbs")
const AMMO = { nail: [12, 1, 'round', 'cyan'], hail: [40, 1.5, 'round', 'gold'], storm: [150, 2.6, 'round', 'orange'], scatter: [6, 1.4, 'shell', 'red'], rail: [4, 1.8, 'cell', 'cyan'],
  prism: [70, 1.8, 'cell', 'pink'], volt: [10, 1.3, 'cell', 'cyan'], halo: [3, 1.2, 'disc', 'gold'], bloom: [4, 1.9, 'rocket', 'orange'], cluster: [3, 1.7, 'grenade', 'orange'], bow: [6, 1.3, 'arrow', 'gold'],
  splinter: [24, 1.5, 'needle', 'red'], flamer: [90, 2, 'fuel', 'orange'], graviton: [2, 1.9, 'orb', 'indigo'], shuriken: [5, 1.2, 'star', 'frost'], twin: [24, 1.2, 'round', 'pink'], rivet: [8, 1.5, 'round', 'gold'],
  helix: [16, 1.3, 'cell', 'violet'], mirage: [14, 1.4, 'round', 'pink'], saw: [4, 1.7, 'disc', 'red'], longshot: [5, 2, 'round', 'frost'], nova: [6, 1.6, 'cell', 'gold'], mines: [6, 1.8, 'grenade', 'red'],
  hive: [5, 2, 'rocket', 'orange'], frostbite: [12, 1.4, 'needle', 'frost'],
  carom: [10, 1.3, 'round', 'lime'], crescent: [5, 1.5, 'disc', 'violet'], trident: [4, 1.8, 'cell', 'gold'], firework: [4, 1.7, 'rocket', 'pink'] };
for (const k in AMMO) { const [mag, rl, am, ac] = AMMO[k]; Object.assign(WEAPONS[k], { mag, reload: rl, am, acK: ac }); }
const MELEE = new Set(['melee', 'thrust', 'spin', 'whip', 'slam', 'iai', 'fist', 'reap']);
const usesAmmo = w => !MELEE.has(w.kind) && !!w.mag;
const wAccent = w => w.acK ? C[w.acK] : col(5);
const WEAPON_IDS = Object.keys(WEAPONS);

function buildTint() { const t = G.tints; return t.length ? t[((G.time * 10) | 0) % t.length] : col(5); }
function computeTints() { const s = G.p.shards, t = []; if (s.ember || s.prism) t.push(C.red); if (s.arc || s.prism || s.stat) t.push(C.cyan); if (s.rime || s.prism) t.push(C.frost); if (s.venom || s.prism) t.push(C.lime);
  if (s.keen) t.push(C.gold); if (s.echo || s.after) t.push(C.violet); if (s.vortex) t.push(C.indigo); if (s.bloom || s.fury) t.push(C.orange); if (s.leech) t.push(C.green); G.tints = t; }

function mkBullet(o) {
  const bs2 = (G.S && G.S.bspd) || 1; return Object.assign({ x: 0, y: 0, vx: Math.cos(o.a) * o.spd * bs2, vy: Math.sin(o.a) * o.spd * bs2, r: 2, dmg: 5, life: 1, kind: 'bolt', pierce: 0, bounce: 0, home: 0, proc: 1, knock: 60, hits: new Set(), t: 0, tint: buildTint(), tr: [] }, o);
}
function nearestEnemy(x, y, maxD, filter) { let best = null, bd = maxD; for (const e of G.enemies) { if (e.dead || e.spawnT > 0) continue; if (filter && !filter(e)) continue; const d = dist(x, y, e.x, e.y); if (d < bd) { bd = d; best = e; } } return best; }
function segDist(px, py, x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy; let t = l ? ((px - x1) * dx + (py - y1) * dy) / l : 0; t = clamp(t, 0, 1); return Math.hypot(px - x1 - t * dx, py - y1 - t * dy); }
const wlvMul = w => 1 + .25 * ((G.p.wlv && G.p.wlv[w.id]) || 0);
// attack-speed bonuses only count 55% for melee weapons
function rateBonus(p, w) { const m = rateMul() * (1 + .1 * ((p.wlv && p.wlv[w.id]) || 0)); return MELEE.has(w.kind) ? 1 + (m - 1) * .55 : m * heatMul(p, w); }
function weaponRate(p, w) { let r = w.rate * rateBonus(p, w); if (w.spin) r *= lerp(.2, 1, p.spin || 0); return w.kind === 'iai' ? Math.min(r, 4) : r; }

// one trigger pull -> FORK copies + ECHO ghosts
function attack(p, w, o = {}) {
  const S = G.S, n0 = 1 + (o.decoy ? 0 : S.extra), n = n0 + volleyPull(p, w, o);
  // Count real weapon attacks once; fork copies, echoes and the decoy cannot accelerate crescents.
  let crescent = false;
  if (S.bounce && MELEE.has(w.kind) && !o.ghost && !o.child && !o.decoy) {
    const counts = p.ricoN || (p.ricoN = {}), count = (counts[w.id] || 0) + 1;
    crescent = count >= 6 - S.bounce; counts[w.id] = crescent ? 0 : count;
  }
  let base = p.aim;
  if (w.burst && !o.child) for (let k = 1; k < w.burst; k++) G.later.push({ t: k * .065, f: () => attack(p, w, Object.assign({}, o, { child: true })) });
  if (S.home && ['melee', 'rail', 'beam', 'thrust', 'chain', 'whip', 'flame'].includes(w.kind)) { const t = nearestEnemy(p.x, p.y, 170, e => Math.abs(angDiff(p.aim, ang(p.x, p.y, e.x, e.y))) < .55); if (t) base += angDiff(base, ang(p.x, p.y, t.x, t.y)) * Math.min(1, .35 * S.home); }
  for (let i = 0; i < n; i++) {
    const idx = i === 0 ? 0 : (i % 2 ? (i + 1) >> 1 : -(i >> 1));
    const sp = (w.kind === 'rail' || w.kind === 'beam' || w.kind === 'chain') ? .17 : (w.kind === 'lob' || w.kind === 'orb') ? .3 : w.kind === 'slam' ? .45 : .14;
    const scale = (i === 0 || i >= n0 ? 1 : FORK_DAMAGE[S.extra]) * (o.ghost ? (SYN.choir ? 1 : .6) : 1) * (o.power || 1) * wlvMul(w) * (o.bonus || 1);
    if (w.kind === 'melee' || w.kind === 'spin' || w.kind === 'thrust' || w.kind === 'whip' || w.kind === 'fist' || w.kind === 'reap') { const go = () => fireOnce(p, w, base + (w.kind === 'thrust' ? idx * .12 : 0), Object.assign({}, o, { scale, flip: i % 2 === 1, copy: i, crescent: crescent && i === 0 })); i ? G.later.push({ t: i * .09, f: go }) : go(); }
    else if (MELEE.has(w.kind) || w.kind === 'nova') fireOnce(p, w, base + idx * sp, Object.assign({}, o, { scale, copy: i, crescent: crescent && i === 0 }));
    else fireOnce(p, w, base, Object.assign({}, o, { scale, copy: i, off: idx * 5 }));
  }
  if (!o.ghost && !o.child && !o.offhand && !o.decoy && S.echo) { p.echoN = (p.echoN || 0) + 1; if (p.echoN >= [5, 3][S.echo - 1]) { p.echoN = 0; G.later.push({ t: .13, f: () => attack(p, w, Object.assign({}, o, { ghost: true })) }); } }
}
function muzzleFx(x, y, a, size, c) { G.muzzles.push({ x, y, a, s: size, c, life: .06, max: .06 }); }
// Drawing and shooting share the same hand height, weapon transform and barrel pixel.
function weaponGrip(p) {
  const moving = Math.hypot(p.vx || 0, p.vy || 0) > 10, frame = moving ? ((p.walkT || 0) * 10 | 0) % 4 : 0;
  const lift = p.dashT > 0 ? 2 : moving && frame % 2 ? 1 : 0;
  return { x: Math.round(p.x), y: Math.round(p.y - 2 - lift) };
}
const BARREL_POINTS = new WeakMap();
function barrelPoint(w, lower = false) {
  let cached = BARREL_POINTS.get(w);
  if (!cached || cached.rows !== w.spr) { cached = { rows: w.spr, points: [] }; BARREL_POINTS.set(w, cached); }
  const index = w.alt && lower ? 1 : 0; if (cached.points[index]) return cached.points[index];
  const rows = w.spr, from = w.alt && lower ? 3 : 0, to = w.alt && !lower ? 3 : rows.length;
  let right = -1, ys = [];
  for (let y = from; y < to; y++) for (let x = 0; x < rows[y].length; x++) if (rows[y][x] !== '.') {
    if (x > right) { right = x; ys = [y]; } else if (x === right) ys.push(y);
  }
  // sprite() adds one outline pixel; use the edge of the actual barrel, not canvas width.
  return cached.points[index] = { x: right + 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 + 1.5 - Math.floor((rows.length + 2) / 2) };
}
function weaponMuzzle(p, w, sideOffset = 0, pose = weaponPose(p, w)) {
  const grip = weaponGrip(p), tip = barrelPoint(w, !!p.alt), ca = Math.cos(pose.wa), sa = Math.sin(pose.wa);
  const x = pose.off + tip.x, y = tip.y * (ca < 0 ? -1 : 1) + sideOffset;
  return { x: grip.x + ca * x - sa * y, y: grip.y + sa * x + ca * y };
}
function shotOrigin(p, w, sideOffset = 0, pose) {
  const grip = weaponGrip(p), tip = weaponMuzzle(p, w, sideOffset, pose), steps = Math.ceil(dist(grip.x, grip.y, tip.x, tip.y));
  let last = grip;
  for (let i = 1; i <= steps; i++) { const q = { x: lerp(grip.x, tip.x, i / steps), y: lerp(grip.y, tip.y, i / steps) };
    if (shotBlocked(q.x, q.y)) return last; last = q; }
  return tip;
}
// melee weapons always block the bullets they hit; only some of them are sent back
function reflectChance() { const w = WEAPONS[G.p.weapons[G.p.wi]]; return w && w.refl !== undefined ? w.refl : .35; }
function deflectBullets(p, test, a, reflect) {
  let n = 0; const S = G.S;
  for (let i = G.ebullets.length - 1; i >= 0; i--) { const b = G.ebullets[i]; if (b.delay > 0 || !test(b)) continue;
    G.ebullets.splice(i, 1); n++;
    if (reflect && Math.random() < reflectChance()) { const sp = Math.max(220, Math.hypot(b.vx, b.vy) * 1.6), ra = a === null ? ang(p.x, p.y, b.x, b.y) : a + rand(-.15, .15);
      G.bullets.push(mkBullet({ x: b.x, y: b.y, a: ra, spd: sp, dmg: 8 * S.dmg, r: 2.5, life: 1, kind: 'deflect', pierce: S.pierce, bounce: S.bounce, home: S.home, proc: .6, tint: C.gold })); }
    else burst(b.x, b.y, 4, col(5), 60, .2); }
  if (n) { AU.play('deflect'); hitstop(.03); notify(L('n_parry'), C.gold); }
  return n;
}
function fireOnce(p, w, a, o) {
  const S = G.S, sc = o.scale || 1, ghost = !!o.ghost, quiet = o.copy > 0 || !!o.offhand || !!o.decoy;
  const tint = ghost ? C.violet : buildTint();
  if (!ghost && !quiet) p.anim = { k: w.kind, t: 0, dur: { melee: .16, thrust: .16, spin: .2, whip: .18, slam: .3, iai: .22, fist: .1, reap: .2 }[w.kind] || .12, a, flip: !!o.flip, heavy: false };
  if (!ghost && !quiet) p.recoil = w.recoil || 0;
  if (w.alt && !ghost && !(o.copy > 0)) p.alt = !p.alt;
  const origin = shotOrigin(p, w, o.off || 0), mx = origin.x, my = origin.y;
  if (o.crit2) o.critBonus = 1;
  if (w.kind === 'nova') {
    for (let k = 0; k < w.n; k++) { const aa = a + k / w.n * 6.2832; G.bullets.push(mkBullet({ x: p.x + Math.cos(aa) * 6, y: p.y + Math.sin(aa) * 6, a: aa, spd: w.spd, dmg: w.dmg * S.dmg * sc, r: w.r * S.size, life: w.life, kind: 'bolt', pierce: S.pierce, bounce: S.bounce, home: S.home, proc: w.proc, knock: w.knock, ghost, tint, critBonus: o.critBonus })); }
    ringFx(p.x, p.y, 14, tint, .25, 2); starFx(p.x, p.y, 6, col(5), .08);
  } else if (w.kind === 'mine') {
    for (let k = 0; k < 2; k++) G.bullets.push(mkBullet({ x: mx, y: my, a: a + rand(-.25, .25), spd: rand(150, 230), dmg: w.dmg * S.dmg * sc, r: 3, life: 6, kind: 'mine', pierce: 999, bounce: 9, proc: w.proc, knock: w.knock, ghost, tint, arm: .4 }));
  } else if (w.kind === 'hive') {
    for (let k = 0; k < 4; k++) { const side = k % 2 ? 1 : -1, aa = a + side * (1 + (k >> 1) * .45); G.bullets.push(mkBullet({ x: mx, y: my, a: aa, spd: 130, dmg: w.dmg * S.dmg * sc, r: 2, life: 1.6, kind: 'missile', pierce: 0, bounce: 0, home: 0, proc: w.proc, knock: w.knock, ghost, tint, acc: 1.8, critBonus: o.critBonus })); }
    muzzleFx(mx, my, a, 5, C.orange);
  } else if (w.kind === 'iai') {
    const L2 = w.range * Math.sqrt(S.size), sx0 = p.x, sy0 = p.y, dmg = w.dmg * S.dmg * sc;
    // Only the primary draw moves the hero. Fork, echo, mirror and offhand cuts
    // retain their damage without multiplying movement or refreshing invulnerability.
    const dash = !ghost && !quiet && (G.preview || (G.state === 'play' && !G.tpPause));
    if (dash) { const st = Math.max(12, Math.ceil(L2 / 3));
      for (let k = 0; k < st; k++) {
        const before = roomAt(p.x, p.y), wasActive = before && before.active;
        moveBody(p, Math.cos(a) * L2 / st, Math.sin(a) * L2 / st);
        if (k % 3 === 0) G.ghosts.push({ x: p.x, y: p.y, flip: Math.cos(a) < 0, life: .3, c: tint });
        const after = roomAt(p.x, p.y);
        if (!G.preview && (G.state !== 'play' || (after && after.active && (after !== before || !wasActive)))) break;
      }
      p.inv = Math.max(p.inv, .12);
    }
    const tip = dash ? [p.x, p.y] : rayPath(sx0, sy0, a, L2, 0).slice(-1)[0];
    const ex = tip[0], ey = tip[1];
    G.iais.push({ x1: sx0, y1: sy0, x2: ex, y2: ey, life: .35, max: .35, c: tint, ghost });
    const hitL = []; for (const e of G.enemies) if (!e.dead && segDist(e.x, e.y, sx0, sy0, ex, ey) < e.r + 9) { hitL.push(e); hitEnemy(e, dmg, { melee: true, ka: a, knock: w.knock, proc: w.proc, ghost }); }
    for (const pr of WORLD.props) if (!pr.dead && segDist(pr.x, pr.y, sx0, sy0, ex, ey) < pr.r + 9) damageProp(pr, dmg);
    deflectBullets(p, b => segDist(b.x, b.y, sx0, sy0, ex, ey) < 9, null, false);
    G.later.push({ t: .2, f: () => { AU.play('whip'); for (const e of hitL) if (!e.dead) { hitEnemy(e, dmg * .6, { melee: true, ka: a, knock: 40, proc: .5, ghost }); starFx(e.x, e.y, 7, col(5), .12); } } });
    if (S.bounce && o.crescent) G.bullets.push(mkBullet({ x: ex, y: ey, a, spd: 260, dmg: dmg * .5, r: 6 * S.size, life: .8, kind: 'wave', bounce: S.bounce, pierce: 99, proc: .5, knock: 60, ghost, tint }));
  } else if (w.kind === 'fist') {
    if (G.time - (p.fistT || 0) > .8) p.fistN = 0; p.fistT = G.time; p.fistN = ((p.fistN || 0) + 1) % 3; const heavy = p.fistN === 0;
    if (p.anim) p.anim.heavy = heavy;
    const R = (heavy ? 30 : 18) * S.size, arc = heavy ? 1.7 : 1.1, dmg = w.dmg * S.dmg * sc * (heavy ? 2.8 : 1);
    G.punches.push({ x: p.x, y: p.y, a, r: R, life: heavy ? .25 : .12, max: heavy ? .25 : .12, heavy, c: tint, ghost, side: p.fistN % 2 ? 1 : -1 });
    for (const e of G.enemies) if (!e.dead && dist(p.x, p.y, e.x, e.y) < R + e.r && Math.abs(angDiff(a, ang(p.x, p.y, e.x, e.y))) < arc / 2 + .2) hitEnemy(e, dmg, { melee: true, ka: a, knock: heavy ? 330 : w.knock, proc: w.proc, ghost });
    for (const pr of WORLD.props) if (!pr.dead && dist(p.x, p.y, pr.x, pr.y) < R + pr.r) damageProp(pr, dmg);
    if (heavy) { deflectBullets(p, b => dist(p.x, p.y, b.x, b.y) < R + 6 && Math.abs(angDiff(a, ang(p.x, p.y, b.x, b.y))) < arc / 2 + .3, null, false); if (!ghost) { shake(.12); hitstop(.04); AU.play('hammer', 1.3, .6); } cone(p.x + Math.cos(a) * R * .6, p.y + Math.sin(a) * R * .6, a, .5, 12, tint, 220, .25, 2); }
    if (!ghost && !o.offhand) { p.vx += Math.cos(a) * (heavy ? 120 : 40); p.vy += Math.sin(a) * (heavy ? 120 : 40); }
  } else if (w.kind === 'gun' || w.kind === 'stick') {
    const isStick = w.kind === 'stick';
    for (let k = 0; k < (w.n || 1); k++) { const aa = a + rand(-w.spread, w.spread);
      const bx = mx, by = my;
      G.bullets.push(mkBullet({ x: bx, y: by, a: aa, spd: w.spd * rand(w.spdVar || 1, 1), dmg: w.dmg * S.dmg * sc, r: (w.r || 1.5) * S.size, life: (w.life || .7) * rand(.85, 1), kind: isStick ? 'needle' : (w.bk || 'bolt'), pierce: S.pierce + (w.pierce || 0) + (o.pierceAll ? 99 : 0), bounce: S.bounce + (w.bounce || 0), home: S.home, proc: w.proc, knock: w.knock, ghost, tint, burst: isStick ? w.burstDmg * S.dmg * sc : 0, critBonus: o.critBonus, ph: k * Math.PI, bx, by, trav: 0, hitMap: w.bk === 'saw' ? new Map() : null, fuse: w.bk === 'fw' ? fwFuse(p, w) : 0 })); }
    muzzleFx(mx, my, a, w.n > 1 ? 7 : 4, tint); cone(mx, my, a, .5, w.n > 1 ? 8 : 2, col(5), 140, .1);
    if (w.shell && !quiet && !ghost) for (let i = 0; i < (w.shell === 2 ? 1 : 1); i++) casing(p.x, p.y, a);
  } else if (w.kind === 'rail' || w.kind === 'beam') {
    const isRail = w.kind === 'rail', fan = w.fan || 1, bw = (isRail ? (fan > 1 ? 3 : 5) : 3) * S.size;
    for (let f = 0; f < fan; f++) { const aa = a + (f - (fan - 1) / 2) * (w.fanSp || .17), pts = rayPath(mx, my, aa, isRail ? 440 : 210, S.bounce);
      beamHit(pts, w.dmg * S.dmg * sc * (1 + S.pierce * .15), bw, w.proc, { knock: w.knock, ghost, color: ghost ? C.violet : null, sx: p.x, sy: p.y, critBonus: o.critBonus });
      G.beams.push({ pts, w: bw, life: isRail ? .24 : .07, max: isRail ? .24 : .07, c: tint, rail: isRail, seed: rand(0, 9) });
      const end = pts[pts.length - 1]; burst(end[0], end[1], isRail ? 10 : 2, tint, 90, .25); starFx(end[0], end[1], isRail ? 7 : 3, col(5), .08); }
    if (isRail) { muzzleFx(mx, my, a, 9, tint); ringFx(mx, my, 10, tint, .2, 2); cone(mx, my, a, .3, 8, col(5), 200, .15); if (!ghost) { hitstop(.03); chroma(.4); } }
  } else if (w.kind === 'chain') {
    const R = 150 * Math.sqrt(S.size); let jumps = 2 + S.bounce + S.pierce, dmg = w.dmg * S.dmg * sc;
    let cur = nearestEnemy(p.x, p.y, R, e => Math.abs(angDiff(a, ang(p.x, p.y, e.x, e.y))) < .6 && los(p.x, p.y, e.x, e.y));
    let fx = mx, fy = my; const hit = new Set();
    if (!cur) { const pts = rayPath(mx, my, a + rand(-.1, .1), R * .7, 0), e2 = pts[pts.length - 1]; G.bolts.push({ pts: zig(mx, my, e2[0], e2[1]), life: .1, max: .1, c: tint, big: true }); burst(e2[0], e2[1], 4, tint, 60, .2); }
    while (cur && jumps-- >= 0) { hit.add(cur); G.bolts.push({ pts: zig(fx, fy, cur.x, cur.y), life: .13, max: .13, c: tint, big: true }); starFx(cur.x, cur.y, 5, col(5), .1);
      hitEnemy(cur, dmg, { proc: w.proc, ka: ang(fx, fy, cur.x, cur.y), knock: w.knock, ghost, color: C.cyan, fromShock: false });
      fx = cur.x; fy = cur.y; dmg *= .85; const from = cur; cur = nearestEnemy(from.x, from.y, 80, e => !hit.has(e)); }
    muzzleFx(mx, my, a, 4, C.cyan);
  } else if (w.kind === 'reap') {
    const n = clamp(o.spins || 1, 1, 5), R = w.range * S.size, dmg = w.dmg * S.dmg * sc, per = .2;
    if (!ghost && !quiet) p.reapT = n * per;
    for (let k = 0; k < n; k++) G.later.push({ t: k * per, f: () => reapSpin(p, w, R, dmg, ghost, tint, k, n, !!o.flip, o.crescent) });
  } else if (w.kind === 'melee') {
    const R = w.range * S.size, dmg = w.dmg * S.dmg * sc;
    G.slashes.push({ x: p.x, y: p.y, a, arc: w.arc, r: R, life: .16, max: .16, flip: o.flip, c: tint, ghost });
    for (const e of G.enemies) { if (e.dead) continue; const d = dist(p.x, p.y, e.x, e.y);
      if (d < R + e.r && Math.abs(angDiff(a, ang(p.x, p.y, e.x, e.y))) < w.arc / 2 + .2) hitEnemy(e, dmg, { melee: true, ka: w.reap ? ang(e.x, e.y, p.x, p.y) : ang(p.x, p.y, e.x, e.y), knock: w.reap ? Math.min(w.knock, Math.max(0, d - 12) * 5) : w.knock, proc: w.proc, ghost }); }
    if (w.reap) for (let k = 0; k < 12; k++) { const aa = a + rand(-w.arc / 2, w.arc / 2), rr = R * rand(.6, 1); part({ x: p.x + Math.cos(aa) * rr, y: p.y + Math.sin(aa) * rr, vx: -Math.cos(aa) * 160, vy: -Math.sin(aa) * 160, life: .18, max: .18, c: k % 2 ? tint : col(5), t: 'spark' }); }
    for (const pr of WORLD.props) if (!pr.dead && dist(p.x, p.y, pr.x, pr.y) < R + pr.r && Math.abs(angDiff(a, ang(p.x, p.y, pr.x, pr.y))) < w.arc / 2) damageProp(pr, dmg);
    if (deflectBullets(p, b => dist(p.x, p.y, b.x, b.y) < R + 6 && Math.abs(angDiff(a, ang(p.x, p.y, b.x, b.y))) < w.arc / 2 + .3, a, true)) burst(p.x + Math.cos(a) * R * .7, p.y + Math.sin(a) * R * .7, 8, C.gold, 120, .3);
    if (S.bounce && o.crescent) G.bullets.push(mkBullet({ x: p.x, y: p.y, a, spd: 230, dmg: dmg * .5, r: 6 * S.size, life: .9, kind: 'wave', bounce: S.bounce, pierce: 99, proc: .5, knock: 80, ghost, tint }));
    if (!ghost && !o.offhand) { p.vx += Math.cos(a) * 70; p.vy += Math.sin(a) * 70; }
  } else if (w.kind === 'thrust') {
    const L2 = w.range * S.size, Wd = 6 * S.size, dmg = w.dmg * S.dmg * sc, ex = p.x + Math.cos(a) * L2, ey = p.y + Math.sin(a) * L2;
    G.thrusts.push({ x: p.x, y: p.y, a, len: L2, life: .16, max: .16, c: tint, ghost });
    for (const e of G.enemies) if (!e.dead && segDist(e.x, e.y, p.x, p.y, ex, ey) < e.r + Wd) hitEnemy(e, dmg, { melee: true, ka: a, knock: w.knock, proc: w.proc, ghost });
    for (const pr of WORLD.props) if (!pr.dead && segDist(pr.x, pr.y, p.x, p.y, ex, ey) < pr.r + Wd) damageProp(pr, dmg);
    deflectBullets(p, b => segDist(b.x, b.y, p.x, p.y, ex, ey) < Wd + 3, a, false);
    if (S.bounce && o.crescent) G.bullets.push(mkBullet({ x: ex, y: ey, a, spd: 380, dmg: dmg * .5, r: 2, life: .8, kind: 'arrow', bounce: S.bounce, pierce: 2 + S.pierce, proc: .5, knock: 60, ghost, tint }));
    if (!ghost && !o.offhand) { p.vx += Math.cos(a) * 170; p.vy += Math.sin(a) * 170; }
    cone(ex, ey, a, .2, 5, tint, 160, .15);
  } else if (w.kind === 'spin') {
    const R = w.range * S.size, dmg = w.dmg * S.dmg * sc;
    G.slashes.push({ x: p.x, y: p.y, a: a + (o.flip ? Math.PI : 0), arc: Math.PI * 2, r: R, life: .2, max: .2, flip: o.flip, c: tint, ghost, spin: true });
    for (const e of G.enemies) if (!e.dead && dist(p.x, p.y, e.x, e.y) < R + e.r) hitEnemy(e, dmg, { melee: true, ka: ang(p.x, p.y, e.x, e.y), knock: w.knock, proc: w.proc, ghost });
    for (const pr of WORLD.props) if (!pr.dead && dist(p.x, p.y, pr.x, pr.y) < R + pr.r) damageProp(pr, dmg);
    deflectBullets(p, b => dist(p.x, p.y, b.x, b.y) < R + 4, null, true);
    if (S.bounce && o.crescent) G.bullets.push(mkBullet({ x: p.x, y: p.y, a, spd: 230, dmg: dmg * .5, r: 6 * S.size, life: .9, kind: 'wave', bounce: S.bounce, pierce: 99, proc: .5, knock: 80, ghost, tint }));
  } else if (w.kind === 'flame') {
    for (let k = 0; k < 2; k++) { const aa = a + rand(-.28, .28); G.bullets.push(mkBullet({ x: mx, y: my, a: aa, spd: rand(150, 230), dmg: w.dmg * S.dmg * sc, r: 2.5 * S.size, life: .38 * Math.sqrt(S.size), kind: 'flame', pierce: 99, bounce: 0, proc: w.proc, knock: w.knock, ghost, tint })); }
  } else if (w.kind === 'orb') {
    G.bullets.push(mkBullet({ x: mx, y: my, a, spd: w.spd, dmg: w.dmg * S.dmg * sc, r: 5 * S.size, life: 2.2, kind: 'orb', pierce: 999, bounce: 6 + S.bounce, proc: w.proc, knock: 0, ghost, tint, pulse: 0, hitMap: new Map() }));
    ringFx(mx, my, 10, C.indigo, .25, 1);
  } else if (w.kind === 'whip') {
    const L2 = w.range * Math.sqrt(S.size), dmg = w.dmg * S.dmg * sc, side = o.flip ? -1 : 1, pts = [];
    for (let i = 0; i <= 12; i++) { const t2 = i / 12, off = Math.sin(t2 * Math.PI) * 10 * side; pts.push([p.x + Math.cos(a) * L2 * t2 - Math.sin(a) * off, p.y + Math.sin(a) * L2 * t2 + Math.cos(a) * off]); }
    G.whips.push({ pts, life: .18, max: .18, c: tint, ghost });
    const hit = new Set();
    for (let i = 0; i < pts.length - 1; i++) for (const e of G.enemies) { if (e.dead || hit.has(e)) continue;
      if (segDist(e.x, e.y, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]) < e.r + 4) { hit.add(e); const tip = i >= 8;
        hitEnemy(e, dmg * (tip ? 2 : 1), { melee: true, ka: a, knock: w.knock * (tip ? 1.6 : 1), proc: w.proc, ghost, critBonus: tip ? .3 : 0 }); if (tip) starFx(e.x, e.y, 6, C.gold, .12); } }
    for (const pr of WORLD.props) if (!pr.dead && segDist(pr.x, pr.y, p.x, p.y, pts[12][0], pts[12][1]) < pr.r + 4) damageProp(pr, dmg);
    deflectBullets(p, b => segDist(b.x, b.y, p.x, p.y, pts[12][0], pts[12][1]) < 6, a, true);
    starFx(pts[12][0], pts[12][1], 4, col(5), .08);
    if (S.bounce && o.crescent) G.bullets.push(mkBullet({ x: pts[12][0], y: pts[12][1], a, spd: 260, dmg: dmg * .5, r: 5 * S.size, life: .8, kind: 'wave', bounce: S.bounce, pierce: 99, proc: .5, knock: 60, ghost, tint }));
  } else if (w.kind === 'slam') {
    const R = w.range * S.size, dmg = w.dmg * S.dmg * sc, ix = p.x + Math.cos(a) * 18, iy = p.y + Math.sin(a) * 18;
    G.slams.push({ x: ix, y: iy, r: R, life: .3, max: .3, c: tint, ghost });
    for (const e of G.enemies) if (!e.dead && dist(ix, iy, e.x, e.y) < R + e.r) hitEnemy(e, dmg * (1 - .35 * dist(ix, iy, e.x, e.y) / (R + e.r)), { melee: true, boom: true, ka: ang(ix, iy, e.x, e.y), knock: w.knock, proc: w.proc, ghost });
    for (const pr of WORLD.props) if (!pr.dead && dist(ix, iy, pr.x, pr.y) < R + pr.r) damageProp(pr, dmg);
    deflectBullets(p, b => dist(ix, iy, b.x, b.y) < R + 3, null, false);
    burst(ix, iy, 18, col(4), 140, .45, 2); for (let i = 0; i < 10; i++) { const aa = i / 10 * 6.28; part({ x: ix, y: iy, vx: Math.cos(aa) * 200, vy: Math.sin(aa) * 200, life: .2, max: .2, c: tint, t: 'spark', drag: 4 }); }
    splat(ix, iy, col(0), 18, R * .6); if (!ghost) hitstop(.035);
    if (S.bounce && o.crescent) for (let i = 0; i < 4; i++) G.bullets.push(mkBullet({ x: ix, y: iy, a: a + i * 1.5708, spd: 230, dmg: dmg * .35, r: 5 * S.size, life: .7, kind: 'wave', bounce: S.bounce, pierce: 99, proc: .4, knock: 60, ghost, tint }));
  } else if (w.kind === 'chakram') {
    G.bullets.push(mkBullet({ x: mx, y: my, a, spd: w.spd, dmg: w.dmg * S.dmg * sc, r: 5 * S.size, life: 3, kind: 'chakram', pierce: 999, bounce: 9, home: S.home, proc: w.proc, knock: w.knock, out: .38, ghost, tint, hitMap: new Map() }));
  } else if (w.kind === 'rocket') {
    G.bullets.push(mkBullet({ x: mx, y: my, a, spd: w.spd, dmg: w.dmg * S.dmg * sc, aoe: w.aoe * S.dmg * sc, r: 3 * Math.sqrt(S.size), life: 1.6, kind: 'rocket', pierce: 0, bounce: S.bounce, home: S.home, proc: w.proc, knock: w.knock, ghost, tint, acc: 1.6 }));
    muzzleFx(mx, my, a, 6, C.orange); cone(mx, my, a + Math.PI, .4, 6, col(4), 80, .3);
  } else if (w.kind === 'lob') {
    const tx0 = G.aimX !== undefined ? G.aimX : Input.mx + G.cam.x, ty0 = G.aimY !== undefined ? G.aimY : Input.my + G.cam.y, d = clamp(dist(p.x, p.y, tx0, ty0), 40, 175);
    G.bullets.push(lobBullet(mx, my, mx + Math.cos(a) * d, my + Math.sin(a) * d, w.dmg * S.dmg * sc, S.bounce, false, ghost, tint));
  } else if (w.kind === 'bow') {
    const pw = o.charge || 0, full = pw >= 1;
    G.bullets.push(mkBullet({ x: mx, y: my, a, spd: lerp(260, 560, pw), dmg: lerp(w.dmg, w.dmgMax, pw) * S.dmg * sc, r: (full ? 3 : 2) * S.size, life: 1.1, kind: 'arrow', pierce: S.pierce + (full ? 4 : 0), bounce: S.bounce, home: S.home, proc: w.proc, knock: w.knock * (.4 + pw), ghost, tint, critBonus: full ? .25 : 0, full }));
    if (full && !ghost) { hitstop(.02); chroma(.3); cone(mx, my, a, .2, 10, tint, 220, .2); ringFx(mx, my, 8, C.gold, .15, 1); }
  }
  else if (WK[w.kind]) WK[w.kind](p, w, a, Object.assign(o, { scale: sc }), mx, my);
  if (!ghost && !quiet) { kick(a, w.recoil); shake(w.shake); p.recoil = w.recoil; AU.play(w.sfx); } else if (ghost && !quiet) AU.play(w.sfx, 1.4, .35);
}
// one revolution of the charged scythe: hits everything around you once and drags it inward
function reapSpin(p, w, R, dmg, ghost, tint, k, n, flip, crescent = false) {
  if (!p.alive) return; const S = G.S, a = p.aim + k * 2.1;
  G.slashes.push({ x: p.x, y: p.y, a, arc: Math.PI * 2, r: R, life: .2, max: .2, flip, c: tint, ghost, spin: true });
  if (!ghost) p.anim = { k: 'spin', t: 0, dur: .2, a: p.aim, flip, heavy: false };
  for (const e of G.enemies) { if (e.dead) continue; const d = dist(p.x, p.y, e.x, e.y); if (d < R + e.r) hitEnemy(e, dmg, { melee: true, ka: ang(e.x, e.y, p.x, p.y), knock: Math.min(w.knock, Math.max(0, d - 12) * 4), proc: w.proc, ghost }); }
  for (const pr of WORLD.props) if (!pr.dead && dist(p.x, p.y, pr.x, pr.y) < R + pr.r) damageProp(pr, dmg);
  deflectBullets(p, b => dist(p.x, p.y, b.x, b.y) < R + 4, null, true);
  for (let i = 0; i < 10; i++) { const aa = rand(0, 6.283), rr = R * rand(.6, 1); part({ x: p.x + Math.cos(aa) * rr, y: p.y + Math.sin(aa) * rr, vx: -Math.cos(aa) * 150, vy: -Math.sin(aa) * 150, life: .18, max: .18, c: i % 2 ? tint : col(5), t: 'spark' }); }
  if (S.bounce && crescent && k === n - 1) G.bullets.push(mkBullet({ x: p.x, y: p.y, a: p.aim, spd: 230, dmg: dmg * .5, r: 6 * S.size, life: .9, kind: 'wave', bounce: S.bounce, pierce: 99, proc: .5, knock: 80, ghost, tint }));
  if (!ghost) { AU.play('whirl', 1 + k * .07, k === n - 1 ? 1 : .7); if (k === n - 1 && n >= 3) { shake(.12); hitstop(.03); } }
}
// charge pips around the hero while the scythe is drawn back
function drawReapCharge(cx, cy) { const p = G.p; if (!p || !p.alive || !(p.charge > 0)) return; const w = WEAPONS[p.weapons[p.wi]]; if (!w || w.kind !== 'reap') return;
  const n = 1 + Math.floor(p.charge * 4 + 1e-6), x = p.x - cx, y = p.y - cy, c = buildTint();
  for (let i = 0; i < 5; i++) { const aa = -Math.PI / 2 + (i - 2) * .42, on = i < n; rect(Math.round(x + Math.cos(aa) * 15) - 1, Math.round(y - 2 + Math.sin(aa) * 15) - 1, 2, 2, on ? (n === 5 && ((G.time * 10) | 0) % 2 ? col(5) : c) : col(2)); } }
function lobBullet(x, y, tx, ty, dmg, bounce, mini, ghost, tint) {
  const d = dist(x, y, tx, ty);
  return { kind: 'lob', x, y, sx: x, sy: y, tx, ty, t: 0, dur: mini ? .28 : .45 + d / 700, h: mini ? 10 : 14 + d * .22, dmg, bounce, mini, ghost, tint: tint || buildTint(), life: 9, hits: new Set(), tr: [], vx: 0, vy: 0, r: 2 };
}
function beamHit(pts, dmg, width, proc, o) {
  const hitSet = new Set();
  for (let s = 0; s < pts.length - 1; s++) { const [x1, y1] = pts[s], [x2, y2] = pts[s + 1];
    for (const e of G.enemies) { if (e.dead || hitSet.has(e)) continue; if (segDist(e.x, e.y, x1, y1, x2, y2) < e.r + width) { hitSet.add(e);
      hitEnemy(e, dmg, { proc, ka: ang(x1, y1, x2, y2), knock: o.knock, ghost: o.ghost, color: o.color, sx: x1, sy: y1, quiet: proc < .5, critBonus: o.critBonus }); } }
    for (const pr of WORLD.props) if (!pr.dead && segDist(pr.x, pr.y, x1, y1, x2, y2) < pr.r + width) damageProp(pr, dmg); }
}

// the bullet being moved right now (a follower's bullets hit with her own serums, see js/follow.js)
let BUL_CUR = null;
function updateBullets(dt) {
  const S1 = G.S, p = G.p; let S = S1;
  for (let i = G.bullets.length - 1; i >= 0; i--) {
    const b = G.bullets[i]; BUL_CUR = b; S = b.fl && typeof flStats === 'function' ? flStats() : S1; b.life -= dt; b.t += dt; let dead = b.life <= 0;
    b.tr.push([b.x, b.y]); if (b.tr.length > 5) b.tr.shift();
    if (S.lead) leadTick(b);
    if (b.kind === 'lob') { // arcing grenade: flies over walls, bursts on landing
      const k = Math.min(1, b.t / b.dur); b.x = lerp(b.sx, b.tx, k); b.y = lerp(b.sy, b.ty, k); b.z = Math.sin(k * Math.PI) * b.h;
      if (k >= 1) { G.bullets.splice(i, 1);
        explode(b.x, b.y, (b.mini ? 15 : 27) * Math.sqrt(S.size), b.mini ? b.dmg : b.dmg, { color: b.ghost ? C.violet : b.tint, proc: b.mini ? .3 : .5, small: b.mini });
        if (!b.mini) for (let k2 = 0; k2 < 4; k2++) { const a = rand(0, 6.28), d = rand(18, 34); G.bullets.push(lobBullet(b.x, b.y, b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, b.dmg * .35, 0, true, b.ghost, b.tint)); }
        if (b.bounce > 0 && !b.mini) { const a = ang(b.sx, b.sy, b.tx, b.ty); G.bullets.push(lobBullet(b.x, b.y, b.x + Math.cos(a) * 50, b.y + Math.sin(a) * 50, b.dmg * .7, b.bounce - 1, false, b.ghost, b.tint)); }
      }
      continue;
    }
    if (b.stuck !== undefined) { // splinter needle waiting to burst
      b.fuse -= dt; if (b.stuck && !b.stuck.dead) { b.x = b.stuck.x + b.ox; b.y = b.stuck.y + b.oy; }
      if (b.fuse <= 0 || (b.stuck && b.stuck.dead)) { G.bullets.splice(i, 1); explode(b.x, b.y, 14 * Math.sqrt(S.size), b.burst, { small: true, color: b.ghost ? C.violet : (b.tint === col(5) ? C.red : b.tint), proc: .35 }); }
      continue;
    }
    if (b.kind === 'split' && b.t > .22) { G.bullets.splice(i, 1); const a0 = Math.atan2(b.vy, b.vx), sp = Math.hypot(b.vx, b.vy);
      for (let k = -1; k <= 1; k++) G.bullets.push(mkBullet({ x: b.x, y: b.y, a: a0 + k * .32, spd: sp * 1.1, dmg: b.dmg * .65, r: b.r * .8, life: .5, kind: 'bolt', pierce: b.pierce, bounce: b.bounce, bounceSoftened: b.bounceSoftened, home: b.home, proc: b.proc * .7, knock: b.knock, ghost: b.ghost, tint: b.tint }));
      starFx(b.x, b.y, 4, col(5), .08); continue; }
    if (b.kind === 'fw' && b.t >= b.fuse) { G.bullets.splice(i, 1); fwBurst(b); continue; }
    if (b.kind === 'mine') { b.vx *= Math.pow(.02, dt); b.vy *= Math.pow(.02, dt); b.arm -= dt;
      if ((b.arm <= 0 && G.enemies.some(e => !e.dead && e.spawnT <= 0 && dist(e.x, e.y, b.x, b.y) < 22 + e.r)) || b.life <= dt) { G.bullets.splice(i, 1); explode(b.x, b.y, 30 * Math.sqrt(S.size), b.dmg, { color: b.ghost ? C.violet : C.red, proc: b.proc }); continue; } }
    if (b.kind === 'missile') { if (b.t > .18) b.home = 7; if (Math.random() < .6) part({ x: b.x, y: b.y, vx: rand(-8, 8), vy: rand(-8, 8), life: .3, max: .3, c: Math.random() < .4 ? C.orange : col(3), s: 1 }); }
    if (b.kind === 'flame') { b.r += dt * 9; b.vx *= 1 - dt * 2.5; b.vy *= 1 - dt * 2.5; }
    if (b.kind === 'orb') { b.vx *= 1 - dt * .3; b.vy *= 1 - dt * .3; b.pulse -= dt;
      for (const e of G.enemies) { if (e.dead || e.spawnT > 0) continue; const d = dist(b.x, b.y, e.x, e.y); if (d < 60 && d > 3) { const pull = 90 * ccMul(e, 'pull') * (e.boss ? .1 * (bossKnock(e) ? 1 : 0) : 1); ccAdd(e, 'pull', dt * .4); moveBody(e, (b.x - e.x) / d * pull * dt, (b.y - e.y) / d * pull * dt); } }
      if (b.pulse <= 0) { b.pulse = .25; ringFx(b.x, b.y, 30, b.ghost ? C.violet : C.indigo, .2, 1); for (const e of G.enemies) if (!e.dead && e.spawnT <= 0 && dist(b.x, b.y, e.x, e.y) < 30 + e.r) hitEnemy(e, b.dmg, { proc: b.proc, knock: 0, quiet: true, color: C.indigo, fromField: true }); }
      if (b.life <= dt) explode(b.x, b.y, 34, b.dmg * 2.5, { color: C.indigo, proc: .4, small: true }); }
    if (b.home && b.kind !== 'chakram' || (b.kind === 'chakram' && b.t < b.out && b.home)) {
      if (!b.tg || b.tg.dead || ((b.t * 10) | 0) % 2 === 0) b.tg = nearestEnemy(b.x, b.y, 150);
      if (b.tg) { const sp = Math.hypot(b.vx, b.vy), a = Math.atan2(b.vy, b.vx), da = angDiff(a, ang(b.x, b.y, b.tg.x, b.tg.y)); const na = a + clamp(da, -1, 1) * Math.min(1, dt * 2.2 * b.home); b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp; }
    }
    if (b.kind === 'chakram' && b.t > b.out) { const a = ang(b.x, b.y, p.x, p.y), sp = Math.min(520, Math.hypot(b.vx, b.vy) + 900 * dt); b.vx = lerp(b.vx, Math.cos(a) * sp, Math.min(1, dt * 9)); b.vy = lerp(b.vy, Math.sin(a) * sp, Math.min(1, dt * 9)); if (dist(b.x, b.y, p.x, p.y) < 10) dead = true; }
    else if (b.kind === 'chakram') { b.vx *= 1 - dt * 2.2; b.vy *= 1 - dt * 2.2; }
    if (b.acc) { b.vx *= 1 + b.acc * dt; b.vy *= 1 + b.acc * dt; if (Math.random() < .7) part({ x: b.x, y: b.y, vx: rand(-10, 10), vy: rand(-10, 10), life: .4, max: .4, c: Math.random() < .3 ? C.orange : col(3), s: 2 }); }
    let nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
    if (b.kind === 'helix') { b.bx += b.vx * dt; b.by += b.vy * dt; const a0 = Math.atan2(b.vy, b.vx), off = Math.sin(b.t * 16 + b.ph) * 6 * Math.min(1, b.t * 6); nx = b.bx - Math.sin(a0) * off; ny = b.by + Math.cos(a0) * off; }
    if (b.kind === 'snipe') b.trav += Math.hypot(b.vx, b.vy) * dt;
    if (!b.sky && shotBlocked(nx, ny) && !(b.kind === 'chakram' && b.t > b.out)) { // (rounds from the sky fly over the walls)
      if (b.kind === 'fw') { G.bullets.splice(i, 1); fwBurst(b); continue; }
      if (b.kind === 'needle' && b.bounce <= 0) { b.stuck = null; b.fuse = .6; AU.play('stick'); continue; }
      if (b.kind === 'ice' && b.bounce <= 0) { iceShatter(b); G.bullets.splice(i, 1); continue; }
      if (b.kind === 'missile') { G.bullets.splice(i, 1); explode(b.x, b.y, 16, b.dmg * .6, { small: true, color: C.orange, proc: .3 }); continue; }
      if (b.bounce > 0) { b.bounce--; const vx = shotBlocked(nx, b.y), vy = shotBlocked(b.x, ny); if (vx || !vy) b.vx = -b.vx; if (vy || !vx) b.vy = -b.vy;
        if (b.kind === 'pin') { b.dmg *= 1.3; b.vx *= 1.08; b.vy *= 1.08; b.r = Math.min(4.5, b.r + .45); ringFx(b.x, b.y, 6, b.ghost ? C.violet : C.lime, .15, 1); }
        if ((SYN.mirror || SYN.wreck) && !b.bounceSoftened) { b.dmg *= .75; b.bounceSoftened = true; }
        if (SYN.mirror) { b.dmg *= 1.4; b.home = Math.max(b.home, 2); } if (SYN.wreck) { b.dmg *= 1.25; b.r = Math.min(8, b.r * 1.15); } if (b.kind !== 'chakram') b.hits.clear(); burst(b.x, b.y, 3, b.tint, 50, .15); starFx(b.x, b.y, 3, b.tint, .06); if (b.kind !== 'chakram') AU.play('tick'); }
      else { dead = true; burst(b.x, b.y, 3, col(4), 50, .15); starFx(b.x, b.y, 2, col(5), .05); }
    } else { b.x = nx; b.y = ny; }
    if (!dead) for (const e of G.enemies) {
      if (e.dead || e.spawnT > 0 || dist(b.x, b.y, e.x, e.y) > e.r + b.r) continue;
      if (b.kind === 'orb' || b.kind === 'mine') continue;
      if (b.kind === 'saw') { const last = b.hitMap.get(e) || -9; if (b.t - last < .15) continue; b.hitMap.set(e, b.t); }
      if (b.kind === 'chakram') { const last = b.hitMap.get(e) || -9; if (b.t - last < .22) continue; b.hitMap.set(e, b.t); }
      else if (b.kind !== 'saw' && b.hits.has(e)) continue;
      b.hits.add(e);
      if (b.kind === 'rocket') { dead = true; break; }
      if (b.kind === 'missile') { dead = true; explode(b.x, b.y, 16, b.dmg * .6, { small: true, color: C.orange, proc: .3 }); }
      const r = hitEnemy(e, b.kind === 'snipe' ? b.dmg * (1 + b.trav * 1.2 / 200) : b.dmg, { proc: b.proc, ka: Math.atan2(b.vy, b.vx), knock: b.knock, ghost: b.ghost, sx: b.x - b.vx * .05, sy: b.y - b.vy * .05, critBonus: b.critBonus, quiet: b.kind === 'flame', frag: b.frag });
      if (b.kind === 'fw') { fwBurst(b); dead = true; break; }
      if (b.kind === 'ice' && !e.dead) { e.chill++; e.slowT = 2; e.slowMul = Math.min(e.slowMul || 1, 1 - .45 * ccMul(e, 'slow')); if (e.chill >= 3 && !e.boss) { e.chill = 0; applyFreeze(e, .7); } }
      if (b.kind === 'ice') { iceShatter(b); dead = true; break; }
      if (b.kind === 'flame' && !e.dead) { e.burn = Math.min((e.burn || 0) + 1, 3 + G.S.burn * 2); e.burnT = 3; }
      if (r === 'block') { dead = true; break; }
      if (b.kind === 'needle' && b.pierce <= 0) { b.stuck = e; b.ox = b.x - e.x; b.oy = b.y - e.y; b.fuse = .6; AU.play('stick'); break; }
      if (dead) break;
      if (b.kind !== 'chakram' && b.kind !== 'wave' && b.kind !== 'flame' && b.kind !== 'saw' && --b.pierce < 0) { dead = true; break; }
    }
    if (b.stuck !== undefined) continue;
    if (!dead && b.kind !== 'chakram' && b.kind !== 'wave' && b.kind !== 'orb' && b.kind !== 'flame' && b.kind !== 'mine' && b.kind !== 'saw') for (const pr of WORLD.props) if (!pr.dead && dist(b.x, b.y, pr.x, pr.y) < pr.r + b.r) { damageProp(pr, b.dmg); dead = b.kind !== 'arrow' || !b.full; if (dead) break; }
    if (dead) {
      if (b.kind === 'rocket') explode(b.x, b.y, 30 * Math.sqrt(S.size), b.aoe + b.dmg, { color: b.tint !== col(5) ? b.tint : col(5), proc: b.proc });
      if (b.boomOnEnd) explode(b.x, b.y, 16, 6, { small: true, color: C.orange, proc: .2 });
      G.bullets.splice(i, 1);
    }
  }
  // enemy bullets
  BUL_CUR = null; S = S1;
  const CRATES = WORLD && WORLD.props ? WORLD.props.filter(pr => pr.kind === 'crate' && !pr.dead) : [];
  for (let i = G.ebullets.length - 1; i >= 0; i--) {
    // Lazarus can clear this array from inside hurtPlayer during the current iteration.
    const b = G.ebullets[i]; if (!b) continue; b.life -= dt; b.t = (b.t || 0) + dt;
    if (b.delay > 0) { b.delay -= dt; continue; }
    if (b.bomb !== undefined) { if (shotBlocked(b.x + b.vx * dt, b.y + b.vy * dt)) { b.vx = 0; b.vy = 0; } if (updateBomb(b, dt)) { if (G.ebullets[i] === b) G.ebullets.splice(i, 1); continue; } }
    if (b.acc) { const s = Math.hypot(b.vx, b.vy), ns = clamp(s + b.acc * dt, 10, b.maxSpd || 400); b.vx *= ns / s; b.vy *= ns / s; }
    if (b.curve) { const a = Math.atan2(b.vy, b.vx) + b.curve * dt, s = Math.hypot(b.vx, b.vy); b.vx = Math.cos(a) * s; b.vy = Math.sin(a) * s; }
    b.x += b.vx * dt; b.y += b.vy * dt;
    let dead = b.life <= 0;
    if (!b.ghostWall && shotBlocked(b.x, b.y)) { dead = true; burst(b.x, b.y, 2, C.red, 40, .15); }
    if (!dead && !b.ghostWall && b.bomb === undefined) for (const pr of CRATES) if (!pr.dead && Math.abs(b.x - pr.x) < pr.r + 3 && Math.abs(b.y - pr.y) < pr.r + 3 && dist(b.x, b.y, pr.x, pr.y) < pr.r + (b.r || 2)) { damageProp(pr, 2); dead = true; burst(b.x, b.y, 3, col(4), 40, .15); break; }
    if (!dead && p.alive && !b.vac && !(b.pol && b.pol === p.pol) && dist(b.x, b.y, p.x, p.y) < b.r + p.r - 2) { G.hitSrc = b.own || null; try { if (hurtPlayer(1, b.x, b.y)) dead = true; } finally { G.hitSrc = null; } }
    if (dead && G.ebullets[i] === b) G.ebullets.splice(i, 1);
  }
  updateWents(dt);
  // very high fire-rate builds: drop the oldest shots instead of grinding the frame rate down (done after iterating)
  if (G.bullets.length > 700) G.bullets.splice(0, G.bullets.length - 700);
  if (G.ebullets.length > 900) G.ebullets.splice(0, G.ebullets.length - 900);
}
// FIREWORK: the fuse is the flight time to the crosshair; the shell bursts into a ring of colored sparks
function fwFuse(p, w) { const tx = G.aimX !== undefined ? G.aimX : Input.mx + G.cam.x, ty = G.aimY !== undefined ? G.aimY : Input.my + G.cam.y; return clamp(dist(p.x, p.y, tx, ty) / w.spd, .12, .9); }
function fwBurst(b) { const cs = [C.red, C.gold, C.cyan, C.pink, C.lime, C.violet], n = 10, o = rand(0, 6.28);
  for (let k = 0; k < n; k++) { const a = o + k / n * 6.283; G.bullets.push(mkBullet({ x: b.x, y: b.y, a, spd: rand(170, 230), dmg: b.dmg * .7, r: 1.6, life: .32, kind: 'bolt', pierce: 0, bounce: 0, proc: b.proc * .6, knock: 30, ghost: b.ghost, tint: b.ghost ? C.violet : cs[k % cs.length] })); }
  ringFx(b.x, b.y, 18, col(5), .2, 2); starFx(b.x, b.y, 8, col(5), .1); burst(b.x, b.y, 12, choice(cs), 120, .4); AU.play('zap', 1.6, .5); }
function iceShatter(b) { AU.play('freeze', 1, .5); burst(b.x, b.y, 6, C.frost, 80, .3); for (let k = 0; k < 4; k++) G.bullets.push(mkBullet({ x: b.x, y: b.y, a: Math.atan2(b.vy, b.vx) + Math.PI + (k - 1.5) * .5 + Math.PI, spd: 180, dmg: b.dmg * .35, r: 1.2, life: .3, kind: 'shard', proc: .3, knock: 20, ghost: b.ghost, tint: C.frost })); }
function updateOrbs(dt) {
  const S = G.S, p = G.p, n = S.orbit; p.orbs = [];
  if (!n) return; p.orbA = (p.orbA || 0) + dt * 3.2;
  for (let i = 0; i < n; i++) { const a = p.orbA + i / n * Math.PI * 2, o = { x: p.x + Math.cos(a) * 22, y: p.y + Math.sin(a) * 22 }; p.orbs.push(o);
    for (let j = G.ebullets.length - 1; j >= 0; j--) { const b = G.ebullets[j]; if (dist(o.x, o.y, b.x, b.y) < 5 + b.r) { G.ebullets.splice(j, 1); burst(b.x, b.y, 4, col(5), 50, .2); } }
    for (const e of G.enemies) { if (e.dead || e.spawnT > 0 || dist(o.x, o.y, e.x, e.y) > e.r + 4) continue; e.orbCd = e.orbCd || 0; if (G.time - e.orbCd < .3) continue; e.orbCd = G.time;
      hitEnemy(e, 6 * S.dmg, { proc: .5, ka: ang(p.x, p.y, e.x, e.y), knock: 90, quiet: true }); if (SYN.storm && !e.dead) chainLightning(e, 5 * S.dmg, 1 + S.shock); }
  }
}
function dashNova(p) {
  const S = G.S, R = 42 * S.size;
  ringFx(p.x, p.y, R, C.violet, .3, 3); ringFx(p.x, p.y, R * .6, col(5), .2, 2); burst(p.x, p.y, 16, C.violet, 160, .35);
  for (const e of G.enemies) if (!e.dead && dist(p.x, p.y, e.x, e.y) < R + e.r) hitEnemy(e, (6 + 5 * S.dashNova) * S.dmg, { proc: 1, ka: ang(p.x, p.y, e.x, e.y), knock: 220, color: C.violet });
  for (let j = G.ebullets.length - 1; j >= 0; j--) if (dist(p.x, p.y, G.ebullets[j].x, G.ebullets[j].y) < R * .8) G.ebullets.splice(j, 1);
}

// ---- drawing attacks ----
function drawSector(x, y, r0, r1, a0, a1, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r1, a0, a1); ctx.arc(x, y, r0, a1, a0, true); ctx.closePath(); ctx.fill(); }
function drawBolt(pts, cx, cy, c, wd) { ctx.strokeStyle = c; ctx.lineWidth = wd; ctx.lineJoin = 'miter'; ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(px - cx + rand(-1, 1), py - cy + rand(-1, 1)) : ctx.moveTo(px - cx, py - cy)); ctx.stroke(); }
function drawAttacks(cx, cy) {
  drawWents(cx, cy);
  // vortices
  for (const v of G.vortices) { const x = v.x - cx, y = v.y - cy, k = v.life / v.max;
    disc(x, y, v.r * .35 * Math.min(1, (1 - k) * 5), col(0)); ringC(x, y, v.r * .35, C.indigo, 1);
    for (let i = 0; i < 3; i++) { const a = G.time * 7 + i * 2.09; ctx.strokeStyle = i ? col(4) : C.indigo; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, v.r * (.5 + i * .15), a, a + 1.4); ctx.stroke(); } }
  for (const ia of G.iais) { const k = ia.life / ia.max, x1 = ia.x1 - cx, y1 = ia.y1 - cy, x2 = ia.x2 - cx, y2 = ia.y2 - cy;
    if (k > .55) { line(x1, y1, x2, y2, ia.ghost ? C.violet : ia.c, 3); line(x1, y1, x2, y2, col(5), 1); }
    else if (k > .35) { const a = ang(x1, y1, x2, y2), L2 = dist(x1, y1, x2, y2); for (let s2 = 0; s2 < L2; s2 += 6) star(x1 + Math.cos(a) * s2, y1 + Math.sin(a) * s2, 1, col(5)); } }
  for (const pu of G.punches) { const k = pu.life / pu.max, x = pu.x - cx, y = pu.y - cy, R = pu.r * (1.1 - k * .5), ex = x + Math.cos(pu.a) * R, ey = y + Math.sin(pu.a) * R;
    for (let i = -2; i <= 2; i++) { const aa = pu.a + i * (pu.heavy ? .3 : .2); pxLine(x + Math.cos(aa) * R * .5, y + Math.sin(aa) * R * .5, x + Math.cos(aa) * R, y + Math.sin(aa) * R, i ? pu.c : col(5)); }
    star(ex, ey, pu.heavy ? 5 : 3, col(5)); if (pu.heavy) ringC(ex, ey, (1 - k) * 16 + 3, pu.ghost ? C.violet : pu.c, 1); }
  for (const wp of G.whips) { const k = wp.life / wp.max, n = Math.max(2, Math.round(wp.pts.length * Math.min(1, (1 - k) * 4)));
    for (let i = 0; i < n - 1; i++) line(wp.pts[i][0] - cx, wp.pts[i][1] - cy, wp.pts[i + 1][0] - cx, wp.pts[i + 1][1] - cy, i > 8 ? col(5) : wp.ghost ? C.violet : wp.c, i < 4 ? 2 : 1);
    const tp = wp.pts[n - 1]; if (k > .3) star(tp[0] - cx, tp[1] - cy, 3, col(5)); }
  for (const sl of G.slams) { const k = sl.life / sl.max, x = sl.x - cx, y = sl.y - cy;
    ringC(x, y, sl.r * (1.15 - k * .6), col(5), Math.max(1, Math.round(3 * k))); ringC(x, y, sl.r * (1 - k * .6), sl.ghost ? C.violet : sl.c, 1);
    if (k > .6) { ctx.globalAlpha = .4; disc(x, y, sl.r * .5, col(5)); ctx.globalAlpha = 1; }
    for (let i = 0; i < 6; i++) { const aa = i * 1.047; pxLine(x + Math.cos(aa) * sl.r * .3, y + Math.sin(aa) * sl.r * .3, x + Math.cos(aa) * sl.r * (1 - k * .5), y + Math.sin(aa) * sl.r * (1 - k * .5), col(3)); } }
  // slashes: filled smear + bright leading edge + tip sparkle
  for (const s of G.slashes) { const k = s.life / s.max, x = s.x - cx, y = s.y - cy, prog = easeOut(1 - k);
    if (s.spin) { const rot = s.a + (s.flip ? -1 : 1) * prog * Math.PI * 2;
      ctx.globalAlpha = .45 * k; drawSector(x, y, s.r * .55, s.r, rot - 2.4, rot, s.c); ctx.globalAlpha = 1;
      ctx.strokeStyle = s.ghost ? C.violet : col(5); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, s.r, rot - 1.2, rot); ctx.stroke();
      star(x + Math.cos(rot) * s.r, y + Math.sin(rot) * s.r, 3, col(5)); continue; }
    const a0 = s.a - s.arc / 2, a1 = s.a + s.arc / 2;
    const st = s.flip ? a1 - (a1 - a0) * prog : a0, en = s.flip ? a1 : a0 + (a1 - a0) * Math.max(.2, prog);
    ctx.globalAlpha = .5 * k; drawSector(x, y, s.r * .5, s.r * 1.02, st, en, s.c); ctx.globalAlpha = .25 * k; drawSector(x, y, s.r * .3, s.r * .5, st, en, s.c); ctx.globalAlpha = 1;
    ctx.strokeStyle = s.ghost ? C.violet : col(5); ctx.lineWidth = 2.5 * k + .5; ctx.beginPath(); ctx.arc(x, y, s.r, st, en); ctx.stroke();
    const tip = s.flip ? st : en; if (k > .3) star(x + Math.cos(tip) * s.r, y + Math.sin(tip) * s.r, 3, col(5)); }
  // thrusts: tapered spear streak + speed lines
  for (const t of G.thrusts) { const k = t.life / t.max, x = t.x - cx, y = t.y - cy, ext = easeOut(Math.min(1, (1 - k) * 3)), L2 = t.len * ext, ca = Math.cos(t.a), sa = Math.sin(t.a), nx = -sa, ny = ca;
    ctx.globalAlpha = .55 * k; ctx.fillStyle = t.c; ctx.beginPath(); ctx.moveTo(x + nx * 4, y + ny * 4); ctx.lineTo(x + ca * L2, y + sa * L2); ctx.lineTo(x - nx * 4, y - ny * 4); ctx.fill(); ctx.globalAlpha = 1;
    line(x, y, x + ca * L2, y + sa * L2, t.ghost ? C.violet : col(5), 2 * k + .5); star(x + ca * L2, y + sa * L2, 3, col(5));
    for (let i = 0; i < 3; i++) { const o = (i - 1) * 5, s0 = L2 * .3 + i * 6; line(x + nx * o + ca * s0, y + ny * o + sa * s0, x + nx * o + ca * (s0 + 10 * k), y + ny * o + sa * (s0 + 10 * k), col(4), 1); } }
  // beams
  for (const b of G.beams) { const k = b.life / b.max; ctx.lineJoin = 'miter';
    const wob = b.rail ? 0 : 1.2;
    const path = () => { ctx.beginPath(); b.pts.forEach(([px, py], i) => i ? ctx.lineTo(px - cx, py - cy) : ctx.moveTo(px - cx, py - cy)); };
    ctx.globalAlpha = .35; ctx.strokeStyle = b.c; ctx.lineWidth = b.w * k * 3 + 2; path(); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.strokeStyle = b.c; ctx.lineWidth = b.w * k * 1.6 + 1; path(); ctx.stroke();
    ctx.strokeStyle = col(5); ctx.lineWidth = Math.max(1, b.w * k * .7); ctx.beginPath();
    b.pts.forEach(([px, py], i) => { if (!i) { ctx.moveTo(px - cx, py - cy); return; } const [qx, qy] = b.pts[i - 1], n = Math.max(1, Math.floor(dist(qx, qy, px, py) / 6)), a = ang(qx, qy, px, py);
      for (let j = 1; j <= n; j++) { const t = j / n, off = Math.sin(G.time * 40 + j * 1.3 + b.seed) * wob; ctx.lineTo(lerp(qx, px, t) - cx - Math.sin(a) * off, lerp(qy, py, t) - cy + Math.cos(a) * off); } });
    ctx.stroke();
    const [sx0, sy0] = b.pts[0]; disc(sx0 - cx, sy0 - cy, b.w * k + 1, col(5));
    if (b.rail) for (let i = 0; i < b.pts.length - 1; i++) { const [x1, y1] = b.pts[i], [x2, y2] = b.pts[i + 1], a = ang(x1, y1, x2, y2), L2 = dist(x1, y1, x2, y2);
      for (let s = 0; s < L2; s += 5) { const off = Math.sin(s * .3 + (1 - k) * 20) * (b.w + 3) * (1 - k * .5); rect(x1 + Math.cos(a) * s - Math.sin(a) * off - cx, y1 + Math.sin(a) * s + Math.cos(a) * off - cy, 1, 1, s % 10 ? b.c : col(5)); } } }
  for (const l of G.bolts) { const k = l.life / (l.max || .14); if (l.big) { ctx.globalAlpha = .5; drawBolt(l.pts, cx, cy, l.c, 3); ctx.globalAlpha = 1; drawBolt(l.pts, cx, cy, col(5), 1); } else drawBolt(l.pts, cx, cy, l.c, 1); }
  for (const m of G.muzzles) { const k = m.life / m.max, x = m.x - cx, y = m.y - cy, s = m.s * (0.6 + k * .6), ca = Math.cos(m.a), sa = Math.sin(m.a);
    ctx.fillStyle = m.c; ctx.beginPath(); ctx.moveTo(x - sa * s * .5, y + ca * s * .5); ctx.lineTo(x + ca * s * 1.6, y + sa * s * 1.6); ctx.lineTo(x + sa * s * .5, y - ca * s * .5); ctx.fill();
    disc(x, y, s * .5, col(5)); line(x - sa * s, y + ca * s, x + sa * s, y - ca * s, col(5), 1); }
  for (const b of G.bullets) { const x = b.x - cx, y = b.y - cy, a = Math.atan2(b.vy, b.vx), c = b.ghost ? C.violet : b.tint;
    if (b.kind === 'lob') { const z = b.z || 0; ctx.globalAlpha = .5; disc(x, y, b.mini ? 1.5 : 2.5, col(0)); ctx.globalAlpha = 1; disc(x, y - z, b.mini ? 1.5 : 3, col(5)); rect(x - 1, y - z - 1, 2, 2, ((b.t * 16) | 0) % 2 ? C.red : c);
      if (!b.mini) { ctx.globalAlpha = .4; ringC(b.tx - cx, b.ty - cy, 6 + Math.sin(b.t * 20), C.red, 1); ctx.globalAlpha = 1; } continue; }
    if (b.kind === 'flame') { const k = b.t / (b.t + b.life), fc = k < .25 ? (b.ghost ? C.violet : C.gold) : k < .5 ? C.orange : k < .75 ? C.red : col(3), s2 = Math.max(1, b.r * (1 - k * .4));
      rect(x - s2 / 2, y - s2 / 2, s2, s2, fc); if (k < .3) rect(x - 1, y - 1, 2, 2, col(5)); continue; }
    if (b.kind === 'orb') { const pr = 5 + Math.sin(b.t * 20) * 1; disc(x, y, pr + 2, col(0)); disc(x, y, pr, b.ghost ? C.violet : C.indigo); disc(x, y, pr * .5, col(5)); for (let i = 0; i < 4; i++) { const aa = b.t * 6 + i * 1.57; rect(x + Math.cos(aa) * 12, y + Math.sin(aa) * 12, 1, 1, col(4)); } continue; }
    if (b.kind === 'helix') { disc(x, y, b.r + 1, b.ghost ? C.violet : C.violet); rect(x - 1, y - 1, 2, 2, col(5)); continue; }
    if (b.kind === 'split') { ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(Math.PI / 4); ctx.fillStyle = c; ctx.fillRect(-3, -3, 6, 6); ctx.fillStyle = col(5); ctx.fillRect(-1, -1, 2, 2); ctx.restore(); continue; }
    if (b.kind === 'saw') { const sp2 = b.t * 30; disc(x, y, b.r + 1, col(0)); disc(x, y, b.r, col(4)); for (let k = 0; k < 8; k++) { const aa = sp2 + k * .785; rect(x + Math.cos(aa) * (b.r + 1) - .5, y + Math.sin(aa) * (b.r + 1) - .5, 2, 2, k % 2 ? c : col(5)); } disc(x, y, 1.5, C.red); continue; }
    if (b.kind === 'snipe') { line(x - Math.cos(a) * 16, y - Math.sin(a) * 16, x, y, c, 1); line(x - Math.cos(a) * 8, y - Math.sin(a) * 8, x, y, col(5), 2); continue; }
    if (b.kind === 'ice') { ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(a); ctx.fillStyle = C.frost; ctx.fillRect(-4, -1, 7, 3); ctx.fillStyle = col(5); ctx.fillRect(0, -1, 3, 2); ctx.restore(); continue; }
    if (b.kind === 'mine') { const armed = b.arm <= 0; disc(x, y, 3, col(0)); disc(x, y, 2, col(3)); rect(x - 1, y - 1, 2, 2, armed && ((b.t * 6) | 0) % 2 ? C.red : col(5)); if (armed) { ctx.globalAlpha = .25; ringC(x, y, 22, C.red, 1); ctx.globalAlpha = 1; } continue; }
    if (b.kind === 'missile') { line(x - Math.cos(a) * 4, y - Math.sin(a) * 4, x, y, col(5), 2); rect(x - Math.cos(a) * 5, y - Math.sin(a) * 5, 1, 1, C.orange); continue; }
    if (b.kind === 'star') { const sp2 = b.t * 25; ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(sp2); ctx.fillStyle = c; ctx.fillRect(-4, -1, 9, 3); ctx.fillRect(-1, -4, 3, 9); ctx.fillStyle = col(5); ctx.fillRect(-1, -1, 3, 3); ctx.restore(); continue; }
    // fading trail from recent positions
    if (b.tr.length > 1 && b.kind !== 'chakram') { for (let i = 1; i < b.tr.length; i++) { ctx.globalAlpha = i / b.tr.length * .6; line(b.tr[i - 1][0] - cx, b.tr[i - 1][1] - cy, b.tr[i][0] - cx, b.tr[i][1] - cy, c, Math.max(1, b.r * i / b.tr.length)); } ctx.globalAlpha = 1; }
    if (b.kind === 'bolt' || b.kind === 'pellet' || b.kind === 'deflect' || b.kind === 'arrow' || b.kind === 'needle') {
      const L2 = b.kind === 'arrow' ? 10 : b.kind === 'pellet' ? 4 : b.kind === 'needle' ? 6 : 7;
      if (b.stuck !== undefined) { line(x, y, x - Math.cos(b.sa || a) * 5, y - Math.sin(b.sa || a) * 5, col(4), 1); rect(x - 1, y - 1, 2, 2, ((b.fuse * 14) | 0) % 2 ? C.red : col(5)); continue; }
      ctx.globalAlpha = .4; line(x - Math.cos(a) * L2, y - Math.sin(a) * L2, x, y, c, b.r * 2 + 1); ctx.globalAlpha = 1;
      line(x - Math.cos(a) * L2, y - Math.sin(a) * L2, x, y, c, Math.max(1, b.r));
      rect(x - b.r / 2 - .5, y - b.r / 2 - .5, b.r + 1, b.r + 1, b.kind === 'deflect' ? C.gold : col(5));
      if (b.full && Math.random() < .5) part({ x: b.x, y: b.y, life: .2, max: .2, c: C.gold });
    } else if (b.kind === 'chakram') { const s = b.r;
      b.tr.forEach((q, i) => { ctx.globalAlpha = i / b.tr.length * .35; ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.save(); ctx.translate(Math.round(q[0] - cx), Math.round(q[1] - cy)); ctx.rotate((b.t - (b.tr.length - i) * .016) * 22); ctx.strokeRect(-s, -s, s * 2, s * 2); ctx.restore(); }); ctx.globalAlpha = 1;
      ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(b.t * 22);
      ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.strokeRect(-s, -s, s * 2, s * 2); ctx.fillStyle = col(5); ctx.fillRect(-s, -s, 2, 2); ctx.fillRect(s - 2, s - 2, 2, 2); ctx.restore();
    } else if (b.kind === 'rocket') { disc(x, y, b.r + 1, c); disc(x - Math.cos(a) * 2, y - Math.sin(a) * 2, b.r * .6, col(5));
      for (let i = 0; i < 3; i++) rect(x - Math.cos(a) * (5 + i * 2) + rand(-1, 1), y - Math.sin(a) * (5 + i * 2) + rand(-1, 1), 2, 2, i ? C.orange : C.gold); }
    else if (b.kind === 'shard') { rect(x - 1, y - 1, 2, 2, col(5)); rect(x - Math.cos(a) * 3, y - Math.sin(a) * 3, 1, 1, c); }
    else if (b.kind === 'pin') { disc(x, y, b.r + 1, col(0)); disc(x, y, b.r, b.ghost ? C.violet : C.lime); rect(x - 1, y - 1, 2, 2, col(5)); }
    else if (b.kind === 'fw') { disc(x, y, 3, col(0)); disc(x, y, 2, b.ghost ? C.violet : C.pink); rect(x - 1, y - 1, 1, 1, col(5)); if (Math.random() < .6) part({ x: b.x, y: b.y, vx: rand(-20, 20), vy: rand(-20, 20), life: .25, max: .25, c: choice([C.gold, C.pink, col(5)]), s: 1 }); }
    else if (b.kind === 'wave') { ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x - Math.cos(a) * b.r, y - Math.sin(a) * b.r, b.r * 1.4, a - 1, a + 1); ctx.stroke(); ctx.strokeStyle = col(5); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x - Math.cos(a) * b.r, y - Math.sin(a) * b.r, b.r * 1.6, a - .8, a + .8); ctx.stroke(); }
  }
  for (const b of G.ebullets) { const x = b.x - cx, y = b.y - cy;
    if (b.delay > 0) { ringC(x, y, b.r, C.red, 1); continue; }
    if (b.bomb !== undefined) { const bl = ((b.bomb * (b.bomb < .5 ? 16 : 6)) | 0) % 2; disc(x, y, 5, col(0)); disc(x, y, 4, bl ? C.orange : col(3)); rect(x - 1, y - 6, 2, 2, col(5)); ctx.globalAlpha = .3; ringC(x, y, 22, C.orange, 1); ctx.globalAlpha = 1; continue; }
    const ghost = b.pol && b.pol === G.p.pol; if (ghost) ctx.globalAlpha = .3; disc(x, y, b.r + 1, col(0)); disc(x, y, b.r, b.c || C.red); disc(x, y, Math.max(.8, b.r - 1.6), b.pol ? col(5) : '#ffe8ec'); ctx.globalAlpha = 1; }
  const p = G.p; if (p.orbs) for (const o of p.orbs) { rect(o.x - cx - 3, o.y - cy - 3, 6, 6, col(0)); rect(o.x - cx - 2, o.y - cy - 2, 4, 4, SYN.storm ? C.cyan : col(5)); }
  drawHoldFx(p, cx, cy);
  if (p.drones) for (const d of p.drones) { const x = d.x - cx, y = d.y - cy; rect(x - 3, y - 1, 7, 3, col(0)); rect(x - 2, y - 1, 5, 2, col(5)); rect(x - 4, y - 2, 2, 1, col(4)); rect(x + 3, y - 2, 2, 1, col(4)); rect(x, y + 1, 1, 1, SYN.swarm ? C.gold : C.red); }
}
function updateAttackFx(dt) {
  for (const arr of [G.slashes, G.beams, G.bolts, G.thrusts, G.muzzles, G.whips, G.slams, G.iais, G.punches]) for (let i = arr.length - 1; i >= 0; i--) { arr[i].life -= dt; if (arr[i].life <= 0) arr.splice(i, 1); }
}

// ===== ammo, magazines & reloading =====
function magSize(w) { return Math.max(1, Math.round(w.mag * (G.S ? G.S.mag : 1))); }
function reloadTime(w) { return Math.max(.25, w.reload * (G.S ? G.S.reload : 1)); }
function ammoOf(p, id) { p.ammo = p.ammo || {}; let a = p.ammo[id]; if (!a) a = p.ammo[id] = { n: magSize(WEAPONS[id]), rl: 0 }; return a; }
function startReload(p, id, passive) { const w = WEAPONS[id], a = ammoOf(p, id); if (!usesAmmo(w) || a.rl > 0 || a.n >= magSize(w)) return; a.rl = reloadTime(w); a.max = a.rl; if (p === G.p && !G.preview) ventHeat(p); if (passive && !G.preview && p === G.p) onPassiveReload(p, w); if (p === G.p && !G.preview) AU.play('reloadStart', 1 + (p.weapons[p.wi] === id ? 0 : .3), p.weapons[p.wi] === id ? 1 : .4); }
function tickReloads(p, dt) {
  for (const id of p.weapons) { const w = WEAPONS[id]; if (!usesAmmo(w)) continue; const a = ammoOf(p, id), active = p.weapons[p.wi] === id;
    if (a.n > magSize(w)) a.n = magSize(w);
    if (a.rl > 0) { a.rl -= dt;
      if (active && Math.random() < .7) { const wc = wAccent(w), cs = G.tints.length ? G.tints : [wc]; part({ t: 'conv', tf: () => [p.x + Math.cos(p.aim) * 8, p.y - 2 + Math.sin(p.aim) * 8], tx: p.x + Math.cos(p.aim) * 8, ty: p.y - 2 + Math.sin(p.aim) * 8, a: rand(0, 6.28), r: rand(14, 26), x: p.x, y: p.y, life: .35, max: .35, c: Math.random() < .6 ? wc : choice(cs), s: 1 }); }
      if (a.rl <= 0) { a.rl = 0; a.n = magSize(w); a.flash = .35; reloadDone(p, w, active); } }
    if (a.flash > 0) a.flash -= dt; }
}
function reloadDone(p, w, active) {
  const S = G.S, c = wAccent(w);
  if (S.primed) p.primed = 2 + 2 * S.primed;
  if (!G.preview && p === G.p) onReloadFinished(p, active);
  if (!G.preview) AU.play(active ? 'reloadDone' : 'reloadBg');
  if (active) { burst(p.x + Math.cos(p.aim) * 8, p.y - 2 + Math.sin(p.aim) * 8, 10, c, 90, .3); ringFx(p.x, p.y - 2, 12, c, .25, 1); } else G.bgReloadT = .6;
  if (S.rnova) { const R = (38 + 10 * S.rnova) * Math.sqrt(S.size); ringFx(p.x, p.y, R, c, .35, 3); ringFx(p.x, p.y, R * .6, col(5), .25, 2); burst(p.x, p.y, 18, c, 180, .4);
    for (const e of G.enemies) if (!e.dead && e.spawnT <= 0 && dist(p.x, p.y, e.x, e.y) < R + e.r) { hitEnemy(e, (6 + 7 * S.rnova) * S.dmg, { proc: 1, ka: ang(p.x, p.y, e.x, e.y), knock: 180, color: c }); if (SYN.flash) { e.burn = Math.max(e.burn, 3); e.burnT = 3; } }
    if (SYN.flash) G.later.push({ t: .05, f: () => explode(p.x, p.y, R * .8, 12 * S.dmg, { color: C.orange, proc: .3, small: true }) }); }
}
// shared trigger logic (player + preview sandbox): charge, spin-up, ammo, auto-reload
function tryFire(p, w, dt, held) {
  if (!(dt > 0) || (!G.preview && (G.tpPause || G.state !== 'play'))) return;
  const id = w.id, am = usesAmmo(w), a = am ? ammoOf(p, id) : null, S = G.S;
  if (w.spin) p.spin = held && !(a && a.rl > 0) ? Math.min(1, p.spin + dt / 1.1) : Math.max(0, p.spin - dt * 1.5);
  if (w.hold) { HOLD[w.kind](p, w, dt, held); return; }
  if (a && a.rl > 0) { p.charge = 0; return; }
  if (a && a.n <= 0) { startReload(p, id, true); return; }
  const shoot = o => {
    if (a) { const last = a.n === 1; o = o || {};
      if (last && S.lastround) { o.bonus = 1.8 + .5 * S.lastround; if (SYN.deadeye) { o.crit2 = true; o.pierceAll = true; } ringFx(p.x, p.y - 2, 10, C.gold, .2, 1); }
      if (!(S.bottomless && Math.random() < .3)) a.n--;
      if (a.n <= 0) G.later.push({ t: .12, f: () => startReload(p, id, true) }); }
    if (p.primed > 0) { o = o || {}; o.bonus = (o.bonus || 1) * 1.4; p.primed--; }
    attack(p, w, o); };
  if (w.kind === 'bow') {
    if (held) { const before = p.charge; p.charge = Math.min(1, p.charge + dt * rateMul() / w.charge); if (before < 1 && p.charge >= 1 && !G.preview) { AU.play('charged'); burst(p.x, p.y, 6, C.gold, 50, .3); } if (p.charge >= 1) { p.fullT = (p.fullT || 0) + dt; if (G.preview || p.fullT > .1) held = false; } else p.fullT = 0; }
    if (!held && p.charge > 0) { if (p.cd <= 0) { shoot({ charge: p.charge }); p.cd = .15; } p.charge = 0; }
  } else if (w.kind === 'reap') {
    if (p.reapT > 0) return;
    if (held && p.cd <= 0) { const before = p.charge, nb = 1 + Math.floor(before * 4 + 1e-6); p.charge = Math.min(1, p.charge + dt * rateBonus(p, w) / w.charge); const na = 1 + Math.floor(p.charge * 4 + 1e-6);
      if (na > nb && !G.preview) { AU.play(na === 5 ? 'charged' : 'ui', 1 + na * .08, .7); if (na === 5) burst(p.x, p.y, 8, C.gold, 60, .3); }
      if (p.charge >= 1) { p.fullT = (p.fullT || 0) + dt; if (G.preview || p.fullT > .12) held = false; } else p.fullT = 0; }
    if (!held && p.charge > 0) { const n = 1 + Math.floor(p.charge * 4 + 1e-6); shoot({ spins: n }); p.charge = 0; p.fullT = 0; p.cd = n * .2 + .4 / rateBonus(p, w); }
  } else if (held && p.cd <= 0) { shoot(); p.cd = 1 / weaponRate(p, w); }
}
function onDashAmmo(p) { const S = G.S, w = WEAPONS[p.weapons[p.wi]]; if (!usesAmmo(w)) return; const a = ammoOf(p, w.id);
  if (a.rl > 0 && SYN.sleight) { a.rl = 0; a.n = magSize(w); a.flash = .35; reloadDone(p, w, true); return; }
  if (S.tactical && a.rl <= 0) { a.n = Math.min(magSize(w), a.n + Math.ceil(magSize(w) * .2 * S.tactical)); a.flash = .2; } }

// ===== live weapon preview: a tiny sandbox world that runs the real weapon code =====
const PV = { id: null, cnv: null, ctx: null, P: [], FT: [], t: 0 };
function pvSwap(on) {
  if (on) { PV.sv = { G, WORLD, ctx, fx: Object.assign({}, FX), au: AU.on, syn: Object.assign({}, SYN) }; for (const k in SYN) delete SYN[k]; PV.svP = P.splice(0, P.length); P.push(...PV.P); PV.svFT = FT.splice(0, FT.length); FT.push(...PV.FT); G = PV.G; WORLD = PV.W; AU.on = false; }
  else { PV.P = P.splice(0, P.length); P.push(...PV.svP); PV.FT = FT.splice(0, FT.length); FT.push(...PV.svFT); G = PV.sv.G; WORLD = PV.sv.WORLD; ctx = PV.sv.ctx; Object.assign(FX, PV.sv.fx); AU.on = PV.sv.au; Object.assign(SYN, PV.sv.syn); }
}
function pvSetup(id) {
  const real = G, w = WEAPONS[id], tw = 13, th = 6, tiles = new Uint8Array(tw * th);
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) tiles[y * tw + x] = (x === 0 || y === 0 || x === tw - 1 || y === th - 1) ? TL.WALL : TL.FLOOR;
  const Wd = { w: tw, h: th, tiles, rooms: [], fi: real.floor || 0, spikeT: 0, props: [] };
  PV.id = id; PV.P = []; PV.FT = []; PV.t = 0;
  const melee = MELEE.has(w.kind);
  PV.G = { preview: true, state: 'play', time: 0, floor: real.floor || 0, enemies: [], bullets: [], ebullets: [], slashes: [], beams: [], bolts: [], thrusts: [], muzzles: [], vortices: [], whips: [], slams: [], iais: [], punches: [], mechs: [], picks: [], inter: [], later: [], lasers: [], zones: [], ghosts: [], went: [],
    tints: [], S: baseStats(), cam: { x: 8, y: 22 }, combo: 0, comboT: 0, comboMax: 0, kills: 0, ink: 0, fury: 0, curse: 0, bonusOrbs: 9,
    p: { x: 30, y: 52, r: 4, vx: 0, vy: 0, kx: 0, ky: 0, aim: 0, hp: 9, maxHp: 9, armor: 9, maxArmor: 9, inv: 0, dashT: 0, dashCd: 0, cd: .3, charge: 0, spin: 0, recoil: 0, walkT: 0, alive: true, weapons: [id], wi: 0, wlv: {}, shards: {}, ammo: {}, echoN: 0, slowT: 0, primed: 0 } };
  PV.sv = { G: real, WORLD, ctx, fx: Object.assign({}, FX), au: AU.on };
  G = PV.G; WORLD = Wd; Wd.level = renderLevel(Wd); Wd.decal = document.createElement('canvas'); Wd.decal.width = tw * T; Wd.decal.height = th * T; Wd.dctx = Wd.decal.getContext('2d'); PV.W = Wd;
  const spots = melee ? [[60, 52], [72, 40], [72, 64]] : w.kind === 'nova' ? [[56, 34], [56, 70], [14 + 2, 52]] : [[118, 52], [148, 40], [148, 66]];
  if (w.kind === 'iai') spots.splice(0, 3, [86, 52], [110, 46], [110, 60]);
  for (const [x, y] of spots) { const e = spawnEnemy('crawler', x, y, { instant: true, ai: () => { }, contact: 0, ink: 0 }); e.hp = e.maxHp = 1e9; }
  G = real; WORLD = PV.sv.WORLD;
  if (!PV.cnv) { PV.cnv = document.createElement('canvas'); PV.cnv.width = 150; PV.cnv.height = 56; PV.ctx = PV.cnv.getContext('2d'); PV.ctx.imageSmoothingEnabled = false; }
}
function previewUpdate(id, dt) {
  if (PV.id !== id || !PV.G) pvSetup(id);
  pvSwap(true);
  try {
    const p = G.p, w = WEAPONS[id], tg = G.enemies[0]; G.time += dt; PV.t += dt;
    if (w.kind === 'iai' && PV.t % 1.6 < dt) { p.x = 30; p.y = 52; }
    if (tg) { p.aim = ang(p.x, p.y, tg.x, tg.y); G.aimX = tg.x; G.aimY = tg.y; }
    p.cd -= dt; p.inv -= dt; p.recoil *= Math.pow(.001, dt); if (p.anim) p.anim.t += dt;
    p.vx *= Math.pow(.001, dt); p.vy *= Math.pow(.001, dt); p.x = clamp(p.x + p.vx * dt * .2, 24, 40); p.y = 52;
    tryFire(p, w, dt, true); tickReloads(p, dt);
    for (let i = G.later.length - 1; i >= 0; i--) { const l = G.later[i]; l.t -= dt; if (l.t <= 0) { G.later.splice(i, 1); l.f(); } }
    for (let i = G.ghosts.length - 1; i >= 0; i--) { G.ghosts[i].life -= dt; if (G.ghosts[i].life <= 0) G.ghosts.splice(i, 1); }
    for (const e of G.enemies) { e.hp = e.maxHp; e.dead = false; e.kx *= .5; e.ky *= .5; }
    updateEnemies(dt); G.enemies.forEach((e, i) => { const home = [e.hx ?? (e.hx = e.x), e.hy ?? (e.hy = e.y)]; e.x = lerp(e.x, home[0], .1); e.y = lerp(e.y, home[1], .1); });
    updateBullets(dt); updateFields(dt); updateAttackFx(dt); updateParticles(dt); updateFT(dt);
    G.ebullets.length = 0;
  } finally { pvSwap(false); }
}
function previewDraw(x0, y0) {
  if (!PV.G) return;
  pvSwap(true); ctx = PV.ctx;
  try { const cx = G.cam.x, cy = G.cam.y; rect(0, 0, 150, 56, col(0)); drawWorld(cx, cy, G.time); drawEnemies(cx, cy); drawPlayer(cx, cy); drawAttacks(cx, cy); drawParticles(cx, cy); }
  finally { pvSwap(false); }
  ctx.drawImage(PV.cnv, x0, y0);
}
