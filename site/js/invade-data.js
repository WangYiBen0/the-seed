// ===== TheSeed 入侵抵抗 (Invasion Resistance) data: a Brotato-style arena mode. Stats, weapon sets, weapons, items, level-up picks =====
// Every number a player can see lives here; the rules that use them are in js/invade.js.
'use strict';
const IZ = (en, zhs) => ({ en, zh: zhs, ja: en, zhs });
// ---- the character's numbers (all start at 0; health starts at 10 on top of 'hp') ----
// key, name, shown as a percentage, colour of the stat's dot
const IV_STATS = [
  ['hp', IZ('MAX HP', '生命上限'), 0], ['regen', IZ('HP REGEN', '生命再生'), 0], ['steal', IZ('LIFE STEAL', '生命窃取'), 1], ['dmg', IZ('DAMAGE', '伤害'), 1],
  ['melee', IZ('MELEE DMG', '近战伤害'), 0], ['ranged', IZ('RANGED DMG', '远程伤害'), 0], ['elem', IZ('ELEMENTAL DMG', '元素伤害'), 0], ['aspd', IZ('ATTACK SPEED', '攻击速度'), 1],
  ['crit', IZ('CRIT CHANCE', '暴击率'), 1], ['eng', IZ('ENGINEERING', '工程学'), 0], ['range', IZ('RANGE', '范围'), 0], ['armor', IZ('ARMOR', '护甲'), 0],
  ['dodge', IZ('DODGE', '闪避'), 1], ['speed', IZ('SPEED', '移动速度'), 1], ['luck', IZ('LUCK', '幸运'), 0], ['harvest', IZ('HARVESTING', '收获'), 0],
];
// secondary numbers that only items touch
const IV_STATS2 = [['xp', IZ('XP GAIN', '经验获取'), 1], ['price', IZ('SHOP PRICES', '商店价格'), 1], ['pick', IZ('PICKUP RANGE', '拾取范围'), 1], ['expl', IZ('EXPLOSION SIZE', '爆炸范围'), 1], ['crateC', IZ('CRATE CHANCE', '补给箱几率'), 1]];
const IV_STAT = {}; for (const s of [...IV_STATS, ...IV_STATS2]) IV_STAT[s[0]] = { k: s[0], n: s[1], pct: !!s[2] };
const IV_TIER_C = ['#d8d2c4', '#5ea8e0', '#a07ad8', '#e0483e'], IV_TIER_N = ['I', 'II', 'III', 'IV'];
// ---- weapon sets (词条): holding several weapons of the same set gives a bonus (2 to 6 of them) ----
const IV_SETS = {
  precise: { n: IZ('PRECISE', '精准'), st: 'crit', v: [3, 6, 9, 12, 15], c: '#efb94a' },
  blunt: { n: IZ('BLUNT', '钝器'), st: 'armor', v: [1, 2, 3, 4, 5], c: '#bdb5a6' },
  blade: { n: IZ('BLADE', '利刃'), st: 'steal', v: [1, 2, 3, 4, 5], c: '#e0483e' },
  gun: { n: IZ('GUN', '枪械'), st: 'range', v: [10, 20, 30, 40, 50], c: '#8fa77e' },
  heavy: { n: IZ('HEAVY', '重型'), st: 'dmg', v: [5, 10, 15, 20, 25], c: '#c8703a' },
  elemental: { n: IZ('ELEMENTAL', '元素'), st: 'elem', v: [1, 2, 3, 4, 5], c: '#5ed0c8' },
  explosive: { n: IZ('EXPLOSIVE', '爆炸'), st: 'expl', v: [10, 20, 30, 40, 50], c: '#ee7a34' },
  medical: { n: IZ('MEDICAL', '医疗'), st: 'regen', v: [1, 2, 3, 4, 5], c: '#8ed872' },
  primitive: { n: IZ('PRIMITIVE', '原始'), st: 'hp', v: [3, 6, 9, 12, 15], c: '#a08060' },
  tool: { n: IZ('TOOL', '工具'), st: 'eng', v: [1, 2, 3, 4, 5], c: '#7fa3a8' },
  support: { n: IZ('SUPPORT', '支援'), st: 'harvest', v: [5, 10, 15, 20, 25], c: '#d873b0' },
  unarmed: { n: IZ('UNARMED', '徒手'), st: 'dodge', v: [3, 6, 9, 12, 15], c: '#c9c1b2' },
};
// ---- weapons: spr is legacy metadata; invasion models now come from invade-art.js. dmg per tier (I-IV), sc = stat scaling, cd = seconds between attacks per tier,
// range in arena units (3 units = 1 pixel), crit chance and multiplier, knockback; ranged ones fire projectiles (spd px/s, n per shot,
// spread, pierce, bounce); then the special lines (fx): burn, chain, slow, expl (explosion radius px), heal (chance to heal 1), split, turret, sweep
const IV_W = {
  fist: { spr: 'fist', n: IZ('KNUCKLES', '指虎拳套'), set: ['unarmed'], melee: 1, dmg: [8, 12, 17, 24], sc: { melee: 1 }, cd: [.78, .74, .7, .62], range: 150, crit: .03, cm: 2, kb: 20, price: 14 },
  edge: { spr: 'edge', n: IZ('MACHETE', '开山刀'), set: ['blade', 'precise'], melee: 1, dmg: [10, 16, 25, 40], sc: { melee: .8 }, cd: [1, .95, .9, .82], range: 175, crit: .1, cm: 2, kb: 10, price: 24 },
  axe: { spr: 'axe', n: IZ('FIRE AXE', '消防斧'), set: ['blade', 'heavy'], melee: 1, dmg: [20, 30, 45, 70], sc: { melee: 1.2 }, cd: [1.35, 1.3, 1.25, 1.15], range: 190, crit: .05, cm: 2, kb: 30, price: 30 },
  hammer: { spr: 'hammer', n: IZ('SLEDGEHAMMER', '战锤'), set: ['blunt', 'heavy'], melee: 1, dmg: [25, 40, 60, 90], sc: { melee: 1.5 }, cd: [1.65, 1.6, 1.55, 1.45], range: 160, crit: .03, cm: 2, kb: 45, slam: 26, price: 34 },
  baton: { spr: 'baton', n: IZ('STUN BATON', '电击警棍'), set: ['blunt', 'elemental'], melee: 1, dmg: [8, 12, 16, 22], sc: { melee: .6, elem: .6 }, cd: [.9, .86, .82, .75], range: 150, crit: .03, cm: 2, kb: 15, slow: 1, price: 24 },
  chainsaw: { spr: 'chainsaw', n: IZ('CHAINSAW', '链锯'), set: ['tool', 'blade'], melee: 1, dmg: [4, 6, 8, 11], sc: { melee: .4, eng: .3 }, cd: [.26, .25, .24, .22], range: 130, crit: .02, cm: 2, kb: 0, price: 28 },
  scythe: { spr: 'scythe', n: IZ('SCYTHE', '收割镰'), set: ['primitive', 'blade'], melee: 1, sweep: 1, dmg: [15, 22, 32, 48], sc: { melee: 1 }, cd: [1.3, 1.25, 1.2, 1.1], range: 180, crit: .05, cm: 2, kb: 20, matKill: .05, price: 30 },
  lance: { spr: 'lance', n: IZ('PIKE', '长矛'), set: ['primitive', 'precise'], melee: 1, dmg: [12, 18, 26, 40], sc: { melee: 1 }, cd: [1.1, 1.05, 1, .92], range: 250, crit: .08, cm: 2, kb: 10, price: 26 },
  whip: { spr: 'whip', n: IZ('CHAIN WHIP', '铁链鞭'), set: ['primitive'], melee: 1, sweep: 1, dmg: [9, 13, 18, 26], sc: { melee: .7 }, cd: [1, .96, .92, .85], range: 260, crit: .03, cm: 2, kb: 15, price: 22 },
  nail: { spr: 'nail', n: IZ('NAIL GUN', '钉枪'), set: ['gun'], dmg: [12, 20, 30, 50], sc: { ranged: 1 }, cd: [1.2, 1.12, 1.03, .87], range: 400, crit: .05, cm: 2, kb: 15, spd: 330, pierce: 1, price: 20 },
  scatter: { spr: 'scatter', n: IZ('SHOTGUN', '霰弹枪'), set: ['gun'], dmg: [3, 5, 7, 10], sc: { ranged: .7 }, cd: [1.37, 1.3, 1.22, 1.1], range: 300, crit: .03, cm: 2, kb: 15, spd: 320, pel: [4, 5, 6, 7], spread: .5, pierce: 1, price: 30 },
  storm: { spr: 'storm', n: IZ('SMG', '冲锋枪'), set: ['gun'], dmg: [3, 4, 5, 7], sc: { ranged: .5 }, cd: [.17, .165, .155, .13], range: 350, crit: .01, cm: 2, kb: 3, spd: 360, spread: .25, price: 30 },
  longshot: { spr: 'longshot', n: IZ('SNIPER RIFLE', '狙击枪'), set: ['gun', 'precise'], dmg: [15, 25, 40, 65], sc: { ranged: 1 }, cd: [2, 1.9, 1.8, 1.6], range: 600, crit: .2, cm: 2.5, kb: 25, spd: 520, split: 4, price: 38 },
  bow: { spr: 'bow', n: IZ('CROSSBOW', '十字弩'), set: ['precise', 'primitive'], dmg: [12, 20, 30, 45], sc: { ranged: 1 }, cd: [1.2, 1.15, 1.1, 1], range: 400, crit: .15, cm: 2.5, kb: 10, spd: 380, pierce: 1, price: 25 },
  rail: { spr: 'rail', n: IZ('COIL RIFLE', '线圈步枪'), set: ['heavy', 'gun'], dmg: [30, 45, 70, 100], sc: { ranged: 2 }, cd: [2.3, 2.2, 2.1, 1.9], range: 500, crit: .05, cm: 2, kb: 30, spd: 620, pierce: 99, price: 42 },
  bloom: { spr: 'bloom', n: IZ('ROCKET LAUNCHER', '火箭筒'), set: ['explosive', 'heavy'], dmg: [20, 30, 45, 70], sc: { ranged: .8 }, cd: [2.1, 2, 1.9, 1.75], range: 450, crit: .03, cm: 2, kb: 30, spd: 240, expl: 30, price: 40 },
  cluster: { spr: 'cluster', n: IZ('GRENADE LAUNCHER', '榴弹发射器'), set: ['explosive'], dmg: [12, 18, 26, 38], sc: { ranged: .6, elem: .3 }, cd: [1.6, 1.52, 1.45, 1.3], range: 350, crit: .03, cm: 2, kb: 20, spd: 220, expl: 24, price: 32 },
  flamer: { spr: 'flamer', n: IZ('FLAMETHROWER', '喷火器'), set: ['elemental', 'tool'], dmg: [2, 3, 4, 6], sc: { elem: 1 }, cd: [.13, .125, .12, .11], range: 180, crit: 0, cm: 2, kb: 0, spd: 200, pierce: 99, burn: 1, spread: .3, short: 1, price: 32 },
  volt: { spr: 'volt', n: IZ('TASER', '电击枪'), set: ['elemental', 'precise'], dmg: [5, 8, 12, 18], sc: { elem: 1 }, cd: [1, .95, .9, .82], range: 350, crit: .05, cm: 2, kb: 5, spd: 420, chain: [2, 3, 4, 5], price: 30 },
  frostbite: { spr: 'frostbite', n: IZ('CRYO GUN', '冷冻枪'), set: ['elemental'], dmg: [6, 9, 13, 20], sc: { elem: .8 }, cd: [.8, .77, .74, .68], range: 350, crit: .03, cm: 2, kb: 5, spd: 340, slow: 1, price: 26 },
  shuriken: { spr: 'shuriken', n: IZ('THROWING STARS', '手里剑'), set: ['precise', 'blade'], dmg: [7, 10, 14, 20], sc: { ranged: .8 }, cd: [.9, .86, .82, .76], range: 380, crit: .2, cm: 2, kb: 5, spd: 360, bounce: [1, 2, 2, 3], price: 24 },
  harpoon: { spr: 'harpoon', n: IZ('HARPOON GUN', '鱼叉枪'), set: ['primitive', 'gun'], dmg: [15, 24, 36, 55], sc: { ranged: 1 }, cd: [1.6, 1.52, 1.45, 1.32], range: 420, crit: .05, cm: 2, kb: 40, spd: 400, pierce: 2, price: 30 },
  leech: { spr: 'leech', n: IZ('BLOOD SIPHON', '吸血导管'), set: ['medical'], dmg: [5, 8, 11, 15], sc: { ranged: .5, regen: .5 }, cd: [.9, .86, .82, .75], range: 330, crit: .03, cm: 2, kb: 5, spd: 340, heal: .25, price: 28 },
  glue: { spr: 'glue', n: IZ('GLUE GUN', '胶枪'), set: ['support', 'tool'], dmg: [4, 6, 8, 12], sc: { ranged: .5, eng: .3 }, cd: [.85, .82, .78, .72], range: 330, crit: .02, cm: 2, kb: 0, spd: 300, slow: 1, price: 22 },
  deploy: { spr: 'deploy', n: IZ('WRENCH', '扳手'), set: ['tool'], melee: 1, dmg: [8, 12, 18, 26], sc: { melee: .5, eng: .5 }, cd: [1.1, 1.05, 1, .92], range: 150, crit: .03, cm: 2, kb: 15, turret: 1, price: 30 },
  drill: { spr: 'drill', n: IZ('DRILL GUN', '钻头枪'), set: ['tool', 'support'], dmg: [6, 9, 13, 19], sc: { ranged: .5, eng: .8 }, cd: [.55, .53, .5, .45], range: 320, crit: .03, cm: 2, kb: 5, spd: 330, pierce: 1, matKill: .03, price: 28 },
};
const IV_W_IDS = Object.keys(IV_W);
const IV_START = ['fist', 'edge', 'nail', 'scatter', 'bow', 'volt', 'deploy', 'leech'];
const IV_TIER_PRICE = [1, 1.9, 3.7, 7];
// ---- items: tier (0-3), base price, stat changes, an optional special (fx) with its own line, an optional cap on copies ----
const IV_I = {};
const IV_I_IDS = []; // Filled by invade-items.js before the runtime loads.
// ---- level-up picks: a stat and its amount for tiers I-IV ----
const IV_UP = { hp: [3, 6, 9, 12], regen: [2, 3, 4, 5], steal: [1, 2, 3, 4], dmg: [5, 8, 12, 16], melee: [2, 3, 4, 5], ranged: [1, 2, 3, 4], elem: [1, 2, 3, 4], aspd: [5, 10, 15, 20],
  crit: [3, 5, 7, 9], eng: [2, 3, 4, 5], range: [15, 30, 45, 60], armor: [1, 2, 3, 4], dodge: [3, 6, 9, 12], speed: [3, 6, 9, 12], luck: [5, 10, 15, 20], harvest: [5, 8, 10, 12] };
const IV_UP_IC = { hp: 'heart', regen: 'drop', steal: 'crackheart', dmg: 'heavy', melee: 'axe', ranged: 'round', elem: 'bolt', aspd: 'frenzy', crit: 'eye', eng: 'drone', range: 'seek', armor: 'shield', dodge: 'warp', speed: 'swift', luck: 'spiral', harvest: 'ink8' };
// Invasion-only D1–D5 rules. Never use exploration's difficulty modifiers here.
const IV_DIFFICULTY = {
  easy: { danger: 1, hp: 1, damage: 1, events: 0, bosses: 1 },
  classic: { danger: 2, hp: 1, damage: 1, events: 1, bosses: 1 },
  hard: { danger: 3, hp: 1.12, damage: 1.12, events: 1, bosses: 1 },
  nightmare: { danger: 4, hp: 1.26, damage: 1.26, events: 3, bosses: 1 },
  despair: { danger: 5, hp: 1.4, damage: 1.4, events: 3, bosses: 2 }
};
// Crash Zone enemy roles; sprite IDs are local artwork, not exploration AI.
// Linear HP/damage growth, with movement scaled against the player's 92 px/s.
const IV_ENEMIES = {
  baby: { spr: 'crawler', hp: 3, growth: 2, speed: [41, 61], damage: 1, dmgGrowth: .6, ai: 'chase', mat: 1 },
  chaser: { spr: 'runner', hp: 1, growth: 1, speed: [78, 78], damage: 1, dmgGrowth: .6, ai: 'chase', mat: 1 },
  charger: { spr: 'charger', hp: 4, growth: 2.5, speed: [70, 76], damage: 1, dmgGrowth: .85, ai: 'charge', mat: 1, dash: 145 },
  spitter: { spr: 'gunner', hp: 8, growth: 1, speed: [41, 41], damage: 1, dmgGrowth: .6, shotGrowth: .75, ai: 'shoot', ranged: true, mat: 1, shotSpeed: 85, cooldown: 2.8 },
  fly: { spr: 'swarm', hp: 15, growth: 4, speed: [66, 76], damage: 1, dmgGrowth: .85, shotGrowth: 1, ai: 'orbit', mat: 1 },
  slasher: { spr: 'spinner', hp: 50, growth: 25, speed: [51, 61], damage: 1, dmgGrowth: 1, ai: 'slash', mat: 3, heavy: .1 },
  healer: { spr: 'healer', hp: 10, growth: 8, speed: [60, 70], damage: 1, dmgGrowth: .85, ai: 'heal', mat: 2 },
  bruiser: { spr: 'bloater', hp: 20, growth: 11, speed: [61, 61], damage: 2, dmgGrowth: .85, ai: 'charge', mat: 3, dash: 135, heavy: .1 },
  hornedBruiser: { spr: 'warden', hp: 30, growth: 22, speed: [61, 61], damage: 1, dmgGrowth: 1.15, ai: 'charge', mat: 3, dash: 150, heavy: .1 },
  fin: { spr: 'runner', hp: 12, growth: 2, speed: [82, 82], damage: 1, dmgGrowth: 1, ai: 'chase', mat: 1 },
  helmet: { spr: 'shielder', hp: 8, growth: 4, speed: [46, 56], damage: 1, dmgGrowth: 1, ai: 'chase', mat: 1, heavy: .5 },
  pursuer: { spr: 'mini', hp: 10, growth: 24, speed: [31, 31], damage: 1, dmgGrowth: 1.2, ai: 'pursue', mat: 3 },
  tentacle: { spr: 'digger', hp: 100, growth: 20, speed: [36, 36], damage: 1, dmgGrowth: 1, ai: 'slash', mat: 3, heavy: .3 },
  spawner: { spr: 'splitter', hp: 10, growth: 1, speed: [25, 25], damage: 1, dmgGrowth: .85, ai: 'chase', mat: 1, ranged: true },
  junkie: { spr: 'wisp', hp: 5, growth: 5, speed: [65, 71], damage: 1, dmgGrowth: 1, ai: 'shoot', ranged: true, mat: 1, shotSpeed: 76, cooldown: 3.2 },
  buffer: { spr: 'empower', hp: 20, growth: 3, speed: [31, 31], damage: 1, dmgGrowth: .6, ai: 'buff', mat: 2 },
  hornedCharger: { spr: 'charger', hp: 12, growth: 5, speed: [82, 87], damage: 1, dmgGrowth: 1.1, ai: 'charge', mat: 1, dash: 160 }
};
// Explicit per-wave spawn budgets, adapted to this arena and weapon economy.
// These are local tuning values, not a claim to reproduce Brotato's asset files.
const IV_WAVES = [
  { count: 4, interval: 1.6, cap: 32, shooters: 0, pool: { baby: 100 } },
  { count: 4, interval: 1.45, cap: 36, shooters: 0, pool: { baby: 85, chaser: 15 } },
  { count: 5, interval: 1.5, cap: 40, shooters: 0, pool: { baby: 77, chaser: 15, charger: 8 } },
  { count: 5, interval: 1.45, cap: 44, shooters: 2, pool: { baby: 70, chaser: 12, charger: 8, spitter: 7, fly: 2, slasher: 1 } },
  { count: 6, interval: 1.5, cap: 48, shooters: 2, pool: { baby: 69, chaser: 12, charger: 8, spitter: 8, fly: 2, slasher: 1 } },
  { count: 6, interval: 1.45, cap: 52, shooters: 3, pool: { baby: 68, chaser: 12, charger: 8, spitter: 9, fly: 2, slasher: 1 } },
  { count: 7, interval: 1.5, cap: 56, shooters: 3, pool: { baby: 65, chaser: 12, charger: 8, spitter: 9, fly: 2, slasher: 2, healer: 2 } },
  { count: 7, interval: 1.45, cap: 60, shooters: 3, pool: { baby: 62, chaser: 12, charger: 8, spitter: 10, healer: 2, bruiser: 4, hornedBruiser: 2 } },
  { count: 8, interval: 1.5, cap: 64, shooters: 3, pool: { baby: 60, chaser: 12, fin: 8, charger: 4, spitter: 10, bruiser: 4, healer: 2 } },
  { count: 8, interval: 1.45, cap: 68, shooters: 4, pool: { baby: 52, chaser: 12, fin: 8, helmet: 10, spitter: 12, bruiser: 4, healer: 2 } },
  { count: 8, interval: 1.4, cap: 70, shooters: 4, pool: { baby: 52, chaser: 10, helmet: 12, pursuer: 3, spitter: 12, bruiser: 5, slasher: 4, healer: 2 } },
  { count: 8, interval: 1.35, cap: 72, shooters: 4, pool: { baby: 50, chaser: 10, helmet: 12, pursuer: 3, spitter: 14, bruiser: 5, slasher: 4, healer: 2 } },
  { count: 9, interval: 1.4, cap: 74, shooters: 4, pool: { baby: 47, fin: 12, helmet: 12, pursuer: 3, spitter: 14, hornedBruiser: 6, slasher: 4, healer: 2 } },
  { count: 9, interval: 1.35, cap: 76, shooters: 4, pool: { baby: 45, fin: 12, helmet: 12, pursuer: 3, spitter: 10, spawner: 5, hornedBruiser: 7, slasher: 4, healer: 2 } },
  { count: 9, interval: 1.3, cap: 78, shooters: 5, pool: { baby: 45, fin: 12, helmet: 12, pursuer: 3, spitter: 10, spawner: 6, hornedBruiser: 6, slasher: 4, healer: 2 } },
  { count: 9, interval: 1.25, cap: 80, shooters: 5, pool: { baby: 43, fin: 12, helmet: 12, pursuer: 3, spitter: 10, spawner: 6, hornedBruiser: 6, slasher: 4, healer: 2, buffer: 2 } },
  { count: 10, interval: 1.3, cap: 82, shooters: 5, pool: { baby: 41, fin: 12, helmet: 12, pursuer: 3, spitter: 12, spawner: 6, hornedBruiser: 6, slasher: 4, healer: 2, buffer: 2 } },
  { count: 10, interval: 1.25, cap: 84, shooters: 6, pool: { baby: 39, fin: 12, helmet: 12, pursuer: 3, spitter: 12, spawner: 6, hornedBruiser: 6, hornedCharger: 4, slasher: 2, healer: 2, buffer: 2 } },
  { count: 10, interval: 1.2, cap: 86, shooters: 6, pool: { baby: 37, fin: 12, helmet: 12, pursuer: 3, spitter: 14, spawner: 6, hornedBruiser: 6, hornedCharger: 4, slasher: 2, healer: 2, buffer: 2 } },
  { count: 8, interval: 1.4, cap: 72, shooters: 4, pool: { baby: 48, fin: 12, helmet: 12, spitter: 12, spawner: 6, bruiser: 4, hornedCharger: 2, healer: 2, buffer: 2 } }
];
// ---- texts ----
Object.assign(STR, {
  md_head: ['CHOOSE A MODE', '選擇模式', 'モード選択', '选择模式'], md_explore: ['BREACH & EXPLORE', '突入探索', '突入探索', '突入探索'], md_invade: ['INVASION RESISTANCE', '入侵抵抗', '侵攻抵抗', '入侵抵抗'],
  md_exploreD: ['FIVE CHAPTERS OF ROOMS, SERUMS AND BOSSES', '五個章節的房間、血清與首領', '五章の部屋・血清・ボス', '五个章节的房间、血清与首领'],
  md_invadeD: ['HOLD ONE ARENA FOR 20 WAVES. WEAPONS FIRE ON THEIR OWN; COLLECT PARTS, LEVEL UP, SHOP BETWEEN WAVES.', '在一片場地中堅守 20 波。武器自動攻擊；收集零件、升級，在波次之間購物。', '一つの闘技場で20波を耐える。武器は自動攻撃。パーツを集め、レベルアップし、波の合間に買い物。', '在一片场地中坚守 20 波。武器自动攻击；收集零件、升级，在波次之间购物。'],
  md_best: ['BEST: WAVE {0}', '最佳：第 {0} 波', '最高：第{0}波', '最佳：第 {0} 波'], md_go: ['DEFEND: {0}', '開始抵抗：{0}', '出撃：{0}', '开始抵抗：{0}'],
  iv_wave: ['WAVE {0}', '第 {0} 波', '第{0}波', '第 {0} 波'], iv_shop: ['SHOP', '商店', 'ショップ', '商店'], iv_reroll: ['REROLL', '刷新', 'リロール', '刷新'], iv_go: ['START WAVE {0}', '開始第 {0} 波', '第{0}波へ', '开始第 {0} 波'],
  iv_weapons: ['WEAPONS', '武器', '武器', '武器'], iv_items: ['ITEMS', '道具', 'アイテム', '道具'], iv_stats: ['STATS', '屬性', 'ステータス', '属性'], iv_lock: ['LOCK', '鎖定', 'ロック', '锁定'], iv_locked: ['LOCKED', '已鎖定', 'ロック中', '已锁定'],
  iv_buy: ['BUY', '購買', '購入', '购买'], iv_sell: ['RECYCLE +{0}', '回收 +{0}', 'リサイクル+{0}', '回收 +{0}'], iv_combine: ['COMBINE', '合成', '合成', '合成'], iv_close: ['CLOSE', '關閉', '閉じる', '关闭'],
  iv_full: ['WEAPON SLOTS FULL', '武器欄已滿', '武器枠がいっぱい', '武器栏已满'], iv_poor: ['NOT ENOUGH PARTS', '零件不足', 'パーツが足りない', '零件不足'], iv_max: ['LIMIT REACHED', '已達上限', '上限に達した', '已达上限'],
  iv_lvl: ['LEVEL UP!', '升級！', 'レベルアップ！', '升级！'], iv_lvlLeft: ['{0} MORE', '還有 {0} 次', 'あと{0}回', '还有 {0} 次'], iv_crate: ['SUPPLY CRATE', '補給箱', '補給箱', '补给箱'], iv_take: ['TAKE', '拿取', '受け取る', '拿取'],
  iv_start: ['PICK A STARTING WEAPON', '選擇初始武器', '初期武器を選ぶ', '选择初始武器'], iv_win: ['THE INVASION IS HELD BACK', '入侵被擋下了', '侵攻を食い止めた', '入侵被挡下了'], iv_dead: ['OVERRUN', '防線失守', '防衛線崩壊', '防线失守'],
  iv_reached: ['REACHED WAVE {0}', '抵達第 {0} 波', '第{0}波まで到達', '抵达第 {0} 波'], iv_endHint: ['CLICK TO TRY AGAIN · ESC TO RETURN TO CAMP', '點擊再來一局 · Esc 返回營地', 'クリックで再挑戦・Escでキャンプへ', '点击再来一局 · Esc 返回营地'],
  iv_kills: ['KILLS {0}', '擊殺 {0}', '撃破 {0}', '击杀 {0}'], iv_dodge: ['DODGE', '閃避', '回避', '闪避'], iv_lv: ['LV {0}', 'LV {0}', 'LV {0}', 'LV {0}'], iv_set: ['{0} ({1}): {2}', '{0}（{1}）：{2}', '{0}（{1}）：{2}', '{0}（{1}）：{2}'],
  iv_dmgL: ['DAMAGE', '傷害', 'ダメージ', '伤害'], iv_cdL: ['COOLDOWN', '冷卻', 'クールダウン', '冷却'], iv_rangeL: ['RANGE', '範圍', '射程', '范围'], iv_critL: ['CRIT', '暴擊', '会心', '暴击'],
  iv_boss: ['SURVIVE 90 SECONDS OR DEFEAT ALL BOSSES', '存活90秒或擊敗全部首領', '90秒生存するか全ボスを倒せ', '存活90秒或击败全部首领'], iv_elite: ['ELITE', '精英', 'エリート', '精英'], iv_harvest: ['HARVESTING +{0}', '收獲 +{0}', '収穫+{0}', '收获 +{0}'],
  iv_horde: ['HORDE', '獸潮', '大群', '兽潮'], iv_recover: ['START EVERY WAVE AT FULL HP', '每波開始回滿生命', '各ウェーブ開始時にHP全回復', '每波开始回满生命'],
  iv_nextEvent: ['WAVE {0}: {1}', '第{0}波：{1}', '第{0}波：{1}', '第{0}波：{1}'],
  iv_diffTag: ['HP / DAMAGE {0}%. {1} ELITE / HORDE EVENTS. {2} FINAL BOSSES.', '生命／傷害{0}%。{1}次精英／獸潮，最終{2}隻首領。', 'HP・攻撃力{0}%。特殊波{1}回、最終ボス{2}体。', '生命／伤害{0}%。{1}次精英／兽潮，最终{2}只首领。'],
  iv_angel: ['THE GUARDIAN ANGEL CAUGHT YOU', '守護天使接住了你', '守護天使が受け止めた', '守护天使接住了你'], iv_hint: ['WEAPONS FIRE BY THEMSELVES. MOVE, DODGE, PICK UP PARTS.', '武器會自動攻擊。移動、躲避、撿起零件。', '武器は自動で撃つ。動いて避け、パーツを拾え。', '武器会自动攻击。移动、躲避、捡起零件。'],
});
