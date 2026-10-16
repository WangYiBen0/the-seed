// ===== ACHROMA shards II: 15 new upgrades, their synergies, and the curse system =====
'use strict';
// N4 lives in combat.js (the serum names there use it too)
Object.assign(ICONS, {
  frac: ['..1..1..', '.1.11.1.', '1..11..1', '..1111..', '..1111..', '1..11..1', '.1.11.1.', '..1..1..'],
  close: ['1......1', '.1....1.', '..1111..', '..1..1..', '..1..1..', '..1111..', '.1....1.', '1......1'],
  lead: ['..1111..', '.111111.', '11111111', '111..111', '111..111', '11111111', '.111111.', '..1111..'],
  mark: ['...1....', '.11111..', '.1.1.1..', '1111111.', '.1.1.1..', '.11111..', '...1....', '........'],
  sear: ['1.......', '11......', '111.....', '1111....', '111.1...', '11..11..', '1...111.', '....1111'],
  soul: ['.11111..', '1111111.', '1..1..1.', '1111111.', '.11.11..', '.1.1.1..', '..111...', '...1....'],
  gear: ['..1..1..', '.111111.', '11....11', '.1.11.1.', '.1.11.1.', '11....11', '.111111.', '..1..1..'],
  veil: ['.111111.', '1......1', '1..11..1', '1.1..1.1', '1.1..1.1', '1..11..1', '.1....1.', '..1111..'],
  wrench: ['.....11.', '....1..1', '.....1.1', '....111.', '...111..', '..111...', '.111....', '11......'],
  lone: ['......11', '.....111', '....111.', '...111..', '1.111...', '.111....', '.11.....', '1..1....'],
  coin: ['..1111..', '.1....1.', '1..11..1', '1.1....1', '1..11..1', '1....1.1', '.1.11.1.', '..1111..'],
  dice: ['11111111', '1......1', '1.1..1.1', '1......1', '1......1', '1.1..1.1', '1......1', '11111111'],
  gem: ['.111111.', '1.1..1.1', '11111111', '.1.11.1.', '..1..1..', '...11...', '........', '........'],
  breakw: ['1..11..1', '.1....1.', '..1..1..', '1.1111.1', '1.1111.1', '..1..1..', '.1....1.', '1..11..1'],
  trail: ['.....1..', '....11..', '1...111.', '..11111.', '1.111111', '..111111', '1..1111.', '........'],
  // curse sigils
  c_greed: ['..1111..', '.11..11.', '.1....1.', '1..11..1', '1.1..1.1', '1..11..1', '.1....1.', '..1111..'],
  c_hubris: ['1.1.1.1.', '11111111', '1......1', '1.1111.1', '1......1', '1.1111.1', '1......1', '11111111'],
  c_coward: ['..1111..', '.1....1.', '1.1..1.1', '1......1', '1..11..1', '1.1..1.1', '.1....1.', '..1111..'],
  c_wrath: ['1......1', '11....11', '.11..11.', '..1111..', '.11..11.', '11....11', '1......1', '........'],
  c_sloth: ['..1111..', '.1....1.', '1...1..1', '1...1..1', '1...111.', '1......1', '.1....1.', '..1111..'],
  c_tremor: ['1...1...', '.1.1.1..', '..1...1.', '.1.1.1.1', '1...1...', '.1.1.1..', '..1...1.', '.1.1.1.1'],
  c_surr: ['...11...', '..1111..', '...11...', '...11...', '1..11..1', '.1.11.1.', '..1111..', '...11...'],
  c_over: ['.111111.', '1......1', '1.1111.1', '1......1', '1.11...1', '1......1', '1.1....1', '.111111.'],
  c_disaster: ['1.1.1.1.', '.1.1.1.1', '1.1.1.1.', '.1.1.1.1', '1.1.1.1.', '.1.1.1.1', '1.1.1.1.', '.1.1.1.1'],
  c_seal: ['.111111.', '1.1..1.1', '1..11..1', '1.1..1.1', '1..11..1', '1.1..1.1', '.111111.', '........'],
  c_time: ['11111111', '.1....1.', '..1111..', '...11...', '...11...', '..1..1..', '.1.11.1.', '11111111'],
  c_drought: ['...1....', '..1.1...', '..1.1...', '.1...1..', '.1.1.1..', '1..1..1.', '.1...1..', '..111...'],
  c_slow: ['11111111', '1......1', '1.1111.1', '1.1..1.1', '1.1..1.1', '1.1111.1', '1......1', '11111111'],
});

// ---------------- shards ----------------
const FRAG_DAMAGE = [0, .3, .5, .65];
const SHARDS2 = [
  { id: 'frac', n: N4('CLEAVAGE FACTOR', '卵裂素', '卵割因子', '卵裂素'), rar: 1, max: 3, c: '#a4cfe0', icon: 'frac', tag: 'FORM',
    d: l => N4(`HITS SPLIT INTO ${l + 1} CRYSTAL FRAGMENTS THAT SEEK OTHER FOES, EACH CARRYING ${Math.round(FRAG_DAMAGE[l] * 100)}% OF THE HIT DAMAGE.`, `命中敵人後分裂成 ${l + 1} 發碎片，追擊其他敵人，每枚繼承命中傷害的 ${Math.round(FRAG_DAMAGE[l] * 100)}%。`, `命中時、他の敵を追う欠片${l + 1}発に分裂する（各命中ダメージの${Math.round(FRAG_DAMAGE[l] * 100)}%）。`, `命中敌人后分裂成 ${l + 1} 发碎片，追击其他敌人，每枚继承命中伤害的 ${Math.round(FRAG_DAMAGE[l] * 100)}%。`), a: (S, l) => S.frag = l },
  { id: 'close', n: N4('CLOSE-QUARTERS', '近身本能', '近接本能', '近身本能'), rar: 0, max: 3, c: C.orange, icon: 'close', tag: 'POWER',
    d: l => N4(`THE CLOSER THE FOE, THE HARDER YOU HIT: UP TO +${[20, 30, 40][l - 1]}%.`, `距離越近傷害越高，最多 +${[20, 30, 40][l - 1]}%。`, `敵が近いほど威力上昇。最大+${[20, 30, 40][l - 1]}%。`, `距离越近伤害越高，最多 +${[20, 30, 40][l - 1]}%。`), a: (S, l) => S.close = l },
  { id: 'lead', n: N4('HEAVY METAL', '重金屬沉積', '重金属沈着', '重金属沉积'), rar: 1, max: 3, c: '#aaa293', icon: 'lead', tag: 'FORM',
    d: l => N4(`PROJECTILES SLOW DOWN AND GROW AS THEY FLY (UP TO +${60 * l}% SIZE, HALF SPEED). DAMAGE +${15 * l}%.`, `彈丸在飛行中逐漸變慢、逐漸變大（最多體積 +${60 * l}%、速度減半），傷害 +${15 * l}%。`, `弾は飛ぶほど遅く大きくなる（最大サイズ+${60 * l}%、速度半減）。威力+${15 * l}%。`, `弹丸在飞行中逐渐变慢、逐渐变大（最多体积 +${60 * l}%、速度减半），伤害 +${15 * l}%。`),
    a: (S, l) => { S.lead = l; S.dmg *= 1 + .15 * l; } },
  { id: 'mark', n: N4('SCENT MARK', '氣味標記', '匂いの標識', '气味标记'), rar: 1, max: 3, c: C.red, icon: 'mark', tag: 'CRIT',
    d: l => N4(`HITS MARK FOES. THE NEXT HIT ON A MARKED FOE ALWAYS CRITS (RE-MARK AFTER ${(3 - .5 * l).toFixed(1)}S).`, `命中會標記敵人，對被標記敵人的下一擊必定暴擊（${(3 - .5 * l).toFixed(1)} 秒後可再次標記）。`, `命中で敵に印。印のある敵への次の一撃は必ず会心（${(3 - .5 * l).toFixed(1)}秒後に再付与）。`, `命中会标记敌人，对被标记敌人的下一击必定暴击（${(3 - .5 * l).toFixed(1)} 秒后可再次标记）。`), a: (S, l) => S.mark = l },
  { id: 'sear', n: N4('CAUTERY', '燒灼素', '焼灼素', '烧灼素'), rar: 1, max: 3, c: C.gold, icon: 'sear', tag: 'HUNT',
    d: l => N4(`HITTING THE SAME FOE AGAIN WITHIN 1S STACKS +${2 + 2 * l}% DAMAGE (UP TO 10). WEAKER ON BOSSES.`, `1 秒內連續命中同一敵人，每層傷害 +${2 + 2 * l}%（最多 10 層），對頭目效果大幅減弱。`, `1秒以内に同じ敵へ連続命中でダメージ+${2 + 2 * l}%（最大10）。ボスには弱い。`, `1 秒内连续命中同一敌人，每层伤害 +${2 + 2 * l}%（最多 10 层），对头目效果大幅减弱。`), a: (S, l) => S.sear = l },
  { id: 'soul', n: N4('MARROW FEEDER', '骨髓攝食', '骨髄摂食', '骨髓摄食'), rar: 1, max: 1, c: C.green, icon: 'soul', tag: 'KILL',
    d: l => N4('KILLING AN ELITE OR A CHAMPION ALWAYS RESTORES 1 HEALTH.', '擊殺精英或冠軍時，必定恢復 1 點生命。', 'エリートまたはチャンピオンを倒すと必ずHPを1回復。', '击杀精英或冠军时，必定恢复 1 点生命。'), a: (S, l) => S.soul = l },
  { id: 'ovclk', n: N4('OVERCLOCK', '神經超頻', '神経超過', '神经超频'), rar: 1, max: 2, c: C.cyan, icon: 'gear', tag: 'KILL',
    d: l => N4(`KILLS CUT YOUR SKILL CHIP COOLDOWN BY ${l * 750}MS.`, `擊殺使技能晶片冷卻減少 ${l * 750} 毫秒。`, `撃破でスキルのクールダウンを${l * 750}ミリ秒短縮。`, `击杀使技能芯片冷却减少 ${l * 750} 毫秒。`), a: (S, l) => S.ovclk = l },
  { id: 'veil', n: N4('PAIN BLOCK', '痛覺阻斷', '痛覚遮断', '痛觉阻断'), rar: 0, max: 2, c: C.violet, icon: 'veil', tag: 'AMMO',
    d: l => N4(`AN AUTOMATIC RELOAD (EMPTY MAGAZINE) GRANTS UP TO ${400 + 300 * l}MS OF INVINCIBILITY. DURATION ADAPTS TO THE RELOAD CYCLE; MAXIMUM COVERAGE 70%.`, `被動換彈（彈匣打空）時，最多無敵 ${400 + 300 * l} 毫秒，依換彈週期調整，最高覆蓋率 70%。`, `弾切れによる自動リロード時、最大${400 + 300 * l}ミリ秒無敵。装填周期に応じて調整、最大稼働率70%。`, `被动换弹（弹匣打空）时，最多无敌 ${400 + 300 * l} 毫秒，依换弹周期调整，最高覆盖率 70%。`), a: (S, l) => S.veil = l },
  { id: 'refit', n: N4('SCAB FACTOR', '結痂素', '痂皮因子', '结痂素'), rar: 1, max: 2, c: col(4), icon: 'wrench', tag: 'AMMO',
    d: l => N4(`FINISHING A RELOAD RESTORES 1 ARMOR (ONCE EVERY ${5 - l}S).`, `換彈完成時恢復 1 點護甲（每 ${5 - l} 秒一次）。`, `リロード完了時アーマーを1回復（${5 - l}秒に1回）。`, `换弹完成时恢复 1 点护甲（每 ${5 - l} 秒一次）。`), a: (S, l) => S.refit = l },
  { id: 'lone', n: N4('OBSESSION', '執念', '執念', '执念'), rar: 2, max: 1, c: C.red, icon: 'lone', tag: 'POWER',
    d: l => N4('+40% DAMAGE, BUT YOU CAN ONLY CARRY ONE WEAPON.', '傷害 +40%，但只能攜帶一把武器。', 'ダメージ+40%。ただし武器は1つしか持てない。', '伤害 +40%，但只能携带一把武器。'),
    a: (S, l) => { S.lone = 1; S.dmg *= 1.4; }, once: p => loneDrop(p) },
  { id: 'greed', n: N4('HOARDING DISORDER', '囤積癖', '収集癖', '囤积癖'), rar: 1, max: 1, c: C.gold, icon: 'coin', tag: 'LOOT',
    d: l => N4('+30% PARTS GAINED. SHOP PRICES +50%.', '零件獲取 +30%，商店售價 +50%。', 'パーツ獲得+30%。ショップ価格+50%。', '零件获取 +30%，商店售价 +50%。'), a: (S, l) => S.greed = 1 },
  { id: 'allin', n: N4('GAMBLER', '賭徒症候群', '賭博症候群', '赌徒症候群'), rar: 2, max: 1, c: C.pink, icon: 'dice', tag: 'CRIT',
    d: l => N4('CRITICAL DAMAGE +150%. NON-CRITICAL DAMAGE -50%.', '暴擊傷害 +150%，非暴擊傷害 -50%。', '会心ダメージ+150%。非会心ダメージ-50%。', '暴击伤害 +150%，非暴击伤害 -50%。'), a: (S, l) => { S.allin = 1; S.critMul += 1.5; } },
  { id: 'pristine', n: N4('IMMACULATE', '潔癖', '潔癖', '洁癖'), rar: 1, max: 2, c: '#e8e8ec', icon: 'gem', tag: 'SURVIVE',
    d: l => N4(`WITH FULL ARMOR, DEAL +${20 + 15 * l}% DAMAGE. WITHOUT IT, DEAL -${15 + 10 * l}%.`, `護甲全滿時傷害 +${20 + 15 * l}%，護甲不滿時傷害 -${15 + 10 * l}%。`, `アーマー満タン時ダメージ+${20 + 15 * l}%、満タンでない時-${15 + 10 * l}%。`, `护甲全满时伤害 +${20 + 15 * l}%，护甲不满时伤害 -${15 + 10 * l}%。`), a: (S, l) => S.pristine = l },
  { id: 'breakw', n: N4('SHOCK RESPONSE', '休克反應', 'ショック反応', '休克反应'), rar: 1, max: 2, c: C.cyan, icon: 'breakw', tag: 'SURVIVE',
    d: l => N4(`WHEN YOUR LAST ARMOR BREAKS, A SHOCKWAVE ERASES NEARBY BULLETS AND HURTS FOES (RADIUS ${70 + 40 * l}).`, `護甲完全破碎時發出衝擊波，清除附近彈幕並傷害敵人（半徑 ${70 + 40 * l}）。`, `アーマーが全て砕けた時、衝撃波で周囲の弾を消し敵を攻撃（半径${70 + 40 * l}）。`, `护甲完全破碎时发出冲击波，清除附近弹幕并伤害敌人（半径 ${70 + 40 * l}）。`), a: (S, l) => S.breakw = l },
  { id: 'trail', n: N4('PHOSPHORUS SWEAT', '磷汗', '燐の汗', '磷汗'), rar: 0, max: 3, c: C.orange, icon: 'trail', tag: 'DASH',
    d: l => N4(`DASHING LEAVES A TRAIL OF FIRE THAT BURNS FOES (${(1.2 + .4 * l).toFixed(1)}S).`, `衝刺後留下火焰，灼燒觸碰的敵人（${(1.2 + .4 * l).toFixed(1)} 秒）。`, `ダッシュ後に炎を残し、触れた敵を焼く（${(1.2 + .4 * l).toFixed(1)}秒）。`, `冲刺后留下火焰，灼烧触碰的敌人（${(1.2 + .4 * l).toFixed(1)} 秒）。`), a: (S, l) => S.trail = l },
];
for (const s of SHARDS2) { SHARDS.push(s); SHARD[s.id] = s; }
const SYN2 = [
  { id: 'cstorm', n: N4('CALCIFICATION', '鈣化', '石灰化', '钙化'), need: ['frac', 'needle'], c: '#a4cfe0', d: N4('FRAGMENTS PIERCE AND DEAL DOUBLE', '碎片可穿透並造成雙倍傷害', '欠片が貫通し2倍ダメージ', '碎片可穿透并造成双倍伤害') },
  { id: 'demol', n: N4('GIGANTISM', '巨人症', '巨人症', '巨人症'), need: ['close', 'heavy'], c: C.orange, d: N4('CLOSE-QUARTERS BONUS X1.5 AND HEAVY KNOCKBACK', '近身本能加成 X1.5，並造成強力擊退', '近接本能ボーナスX1.5、強力なノックバック', '近身本能加成 X1.5，并造成强力击退') },
  { id: 'wreck', n: N4('TUMOR GROWTH', '腫瘤增生', '腫瘍増殖', '肿瘤增生'), need: ['lead', 'rico'], c: '#aaa293', d: N4('BOUNCES GROW SHOTS AND ADD +25% DAMAGE; RICOCHET DAMAGE IS SCALED TO 75% ONCE, SHARED WITH MIRRORED CORTEX', '每次反彈彈丸變大並 +25% 傷害；反彈傷害統一以 75% 結算，與鏡像腦共用一次衰減', '反射毎に弾が拡大、威力+25%。反射ダメージは75%に調整（鏡像脳と共通、1回のみ）', '每次反弹弹丸变大并 +25% 伤害；反弹伤害统一以 75% 结算，与镜像脑共用一次衰减') },
  { id: 'omen', n: N4('DEATH SIGHT', '死相視覺', '死相視', '死相视觉'), need: ['mark', 'keen'], c: C.red, d: N4('MARKED CRITS DEAL X1.5. KILLS PASS THE MARK ON', '標記暴擊造成 X1.5，擊殺時標記會轉移', '印の会心がX1.5。撃破で印が移る', '标记暴击造成 X1.5，击杀时标记会转移') },
  { id: 'melt', n: N4('FEVER DELIRIUM', '高熱譫妄', '高熱譫妄', '高热谵妄'), need: ['sear', 'frenzy'], c: C.gold, d: N4('CAUTERY STACKS BUILD TWICE AS FAST, UP TO 15', '燒灼素層數累積速度加倍，上限 15', '焼灼素の蓄積が2倍、最大15', '烧灼素层数累积速度加倍，上限 15') },
  { id: 'covenant', n: N4('VAMPIRISM', '吸血症', '吸血症', '吸血症'), need: ['soul', 'leech'], c: C.green, d: N4('MARROW FEEDER RESTORES 2 HEALTH', '骨髓攝食改為恢復 2 點生命', '骨髄摂食の回復量が2になる', '骨髓摄食改为恢复 2 点生命') },
  { id: 'adren', n: N4('ADRENAL STORM', '腎上腺風暴', '副腎嵐', '肾上腺风暴'), need: ['ovclk', 'fury'], c: C.cyan, d: N4('KILLS ALSO REMOVE 75% OF YOUR REMAINING DASH COOLDOWN', '擊殺同時消減 75% 剩餘衝刺冷卻', '撃破でダッシュの残りCTを75%短縮', '击杀同时消减 75% 剩余冲刺冷却') },
  { id: 'phase', n: N4('DISSOCIATION', '解離', '解離', '解离'), need: ['veil', 'quick'], c: C.violet, d: N4('PAIN BLOCK DURATION CAP DOUBLES AND CLEARS NEARBY BULLETS; COVERAGE STILL CAPPED AT 70%', '痛覺阻斷時間上限加倍，並清除附近彈幕；覆蓋率仍不超過 70%', '痛覚遮断の時間上限が倍、周囲の弾を消す。最大稼働率は70%のまま', '痛觉阻断时间上限加倍，并清除附近弹幕；覆盖率仍不超过 70%') },
  { id: 'fortress', n: N4('EXOSKELETON', '外骨骼', '外骨格', '外骨骼'), need: ['refit', 'plate'], c: col(4), d: N4('SCAB FACTOR COOLDOWN HALVED', '結痂素冷卻減半', '痂皮因子のクールダウン半減', '结痂素冷却减半') },
  { id: 'laststand', n: N4('TERMINAL LUCIDITY', '迴光返照', '終末期明晰', '回光返照'), need: ['lone', 'heavy'], c: C.red, d: N4('+25% ATTACK SPEED', '攻擊速度 +25%', '攻撃速度+25%', '攻击速度 +25%') },
  { id: 'bounty', n: N4('MAGPIE', '喜鵲症', 'カササギ症', '喜鹊症'), need: ['greed', 'big'], c: C.gold, d: N4('ELITES AND BOSSES DROP TRIPLE PARTS', '精英與頭目掉落三倍零件', 'エリートとボスがパーツ3倍', '精英与头目掉落三倍零件') },
  { id: 'jackpot', n: N4('LUCKY MUTATION', '幸運突變', '幸運な突然変異', '幸运突变'), need: ['allin', 'keen'], c: C.pink, d: N4('+15% CRIT CHANCE', '暴擊率 +15%', '会心率+15%', '暴击率 +15%') },
  { id: 'perfect', n: N4('HOMEOSTASIS', '體內恆定', '恒常性', '体内恒定'), need: ['pristine', 'plate'], c: '#e8e8ec', d: N4('IMMACULATE STILL WORKS WITH 1 ARMOR MISSING', '缺少 1 點護甲時潔癖仍然生效', 'アーマーが1欠けても潔癖が有効', '缺少 1 点护甲时洁癖仍然生效') },
  { id: 'lastbreath', n: N4('DEATH RATTLE', '臨終喘鳴', '死前喘鳴', '临终喘鸣'), need: ['breakw', 'spite'], c: C.cyan, d: N4('SHOCK RESPONSE ALSO GRANTS 1.5S OF INVULNERABILITY', '休克反應同時給予 1.5 秒無敵', 'ショック反応で1.5秒無敵になる', '休克反应同时给予 1.5 秒无敌') },
  { id: 'blaze', n: N4('BURNING GAIT', '燃燒步態', '燃える歩様', '燃烧步态'), need: ['trail', 'ember'], c: C.orange, d: N4('THE TRAIL LASTS TWICE AS LONG AND BURNS HARDER', '火焰持續時間加倍，灼燒更猛烈', '炎の持続2倍、さらに強く焼く', '火焰持续时间加倍，灼烧更猛烈') },
];
for (const s of SYN2) SYNERGIES.push(s);

// ---------------- hooks used by the hit pipeline and the player ----------------
const wCap = () => (G.S && G.S.lone ? 1 : 2);
function loneDrop(p) { if (p.weapons.length < 2) return; const keep = p.weapons[p.wi], drop = p.weapons[1 - p.wi]; p.weapons = [keep]; p.wi = 0; G.inter.push({ kind: 'weapon', id: drop, x: p.x, y: p.y + 14 }); notify(L('n_lone', wname(drop)), C.red); }
function priceOf(it) { return Math.round(it.price * (G.S && G.S.greed ? 1.5 : 1)); }
function inkMul() { return (G.S && G.S.greed ? 1.3 : 1) * (hasCurse('greed') ? .75 : 1); }
// every heal goes through here (the drought curse blocks them all)
function healPlayer(n) { const p = G.p; if (hasCurse('drought')) { notify(L('n_drought'), '#ff2a3a'); return 0; } const h = Math.min(n, p.maxHp - p.hp); p.hp += h; return h; }
// damage modifiers applied before the crit roll
function dmgMods(e, dmg, o) {
  const S = G.S, p = G.p;
  if (S.close) { const k = clamp((150 - dist(p.x, p.y, e.x, e.y)) / 110, 0, 1); dmg *= 1 + [0, .2, .3, .4][S.close] * k * (SYN.demol ? 1.5 : 1); if (SYN.demol && k > .6 && o.ka !== undefined) o.knock = (o.knock || 60) * 1.8; }
  if (S.sear && !o.fromField) { const fast = G.time - (e.searT || -9) < 1, cap = SYN.melt ? 15 : 10; e.searN = fast ? Math.min(cap, (e.searN || 0) + (SYN.melt ? 2 : 1)) : 1; e.searT = G.time; dmg *= 1 + (.02 + .02 * S.sear) * e.searN * (e.boss ? .25 : 1); }
  if (S.pristine) dmg *= p.armor >= p.maxArmor - (SYN.perfect ? 1 : 0) && p.maxArmor > 0 ? 1.2 + .15 * S.pristine : [1, .75, .65][S.pristine];
  dmg = rangedMods(e, dmg, o);
  if (hasCurse('wrath') && (p.holdT || 0) > 1) dmg *= .7;
  if (hasCurse('surr') && p.lastHit < 2) dmg *= .6;
  return dmg;
}
function markCrit(e) { const S = G.S; if (!S.mark) return false; if (e.marked) { e.marked = false; e.markCd = G.time + (3 - .5 * S.mark); return true; } return false; }
function afterHit(e, dmg, o) {
  rangedAfterHit(e, o);
  const S = G.S;
  if (S.mark && !e.dead && !e.marked && G.time > (e.markCd || 0) && !o.fromField) e.marked = true;
  if (S.frag && !o.frag && !o.fromField && !o.fromShock && !o.boom && (G.fragBudget || 0) >= 1) { G.fragBudget -= 1;
    const n = S.frag + 1, a0 = rand(0, 6.28), cs = SYN.cstorm;
    for (let i = 0; i < n; i++) { const b = mkBullet({ x: e.x, y: e.y, a: a0 + i / n * 6.283, spd: 210, dmg: dmg * FRAG_DAMAGE[S.frag] * (cs ? 2 : 1), r: 1.5, life: .5, kind: 'shard', home: 2.5, pierce: cs ? 2 : 0, proc: .25, knock: 15, tint: '#a4cfe0', frag: true }); b.hits.add(e); G.bullets.push(b); } }
}
function onKillExtra(e) {
  const S = G.S, p = G.p;
  if (S.soul && (e.elite || e.champ)) { if (healPlayer(SYN.covenant ? 2 : 1)) { AU.play('heal'); burst(p.x, p.y, 12, C.green, 80, .4); notify(L('n_hp'), C.green); } }
  if (S.ovclk && p.skillCd > 0) p.skillCd = Math.max(0, p.skillCd - S.ovclk * .75);
  if (SYN.adren) p.dashCd = Math.max(0, p.dashCd * .25);
  if (SYN.omen && e.marked) { const n = nearestEnemy(e.x, e.y, 90, q => q !== e); if (n) { n.marked = true; starFx(n.x, n.y, 6, C.red, .15); } }
}
// automatic reload (the magazine ran dry): veil, sloth
function onPassiveReload(p, w = WEAPONS[p.weapons[p.wi]]) {
  const S = G.S;
  if (S.veil && w && usesAmmo(w)) {
    // Use the observed cycle when available. The shared cooldown still enforces a
    // 70% duty ceiling when switching weapons or finishing a reload with a dash.
    const clock = p.veilClock || 0, times = p.veilReloads || (p.veilReloads = {}), last = times[w.id];
    times[w.id] = clock;
    if (!(p.veilCd > 0)) {
      const rate = w.kind === 'bow' ? 1 / (w.charge / rateMul() + .1) : weaponRate(p, w);
      const frame = p.veilStep || 0;
      const estimate = reloadTime(w) + Math.max(0, magSize(w) - 1) * Math.max(frame, 1 / Math.max(.01, rate));
      const cycle = last !== undefined && clock > last ? clock - last : estimate;
      const cap = (.4 + .3 * S.veil) * (SYN.phase ? 2 : 1);
      // Leave one frame of scheduling tolerance so a slightly shorter next cycle
      // does not skip an entire protection window, especially on 30 FPS phones.
      const d = Math.max(.001, Math.floor(Math.min(cap, Math.max(.001, cycle - frame) * .7) * 1000) / 1000);
      p.veilCd = Math.ceil(d * 1000 / .7) / 1000;
      p.inv = Math.max(p.inv, d); p.veilT = d; p.veilMax = d;
      ringFx(p.x, p.y, 16, C.violet, .3, 2); AU.play('shieldPop', 1.3, .5);
      if (SYN.phase) for (let i = G.ebullets.length - 1; i >= 0; i--) if (dist(p.x, p.y, G.ebullets[i].x, G.ebullets[i].y) < 44) G.ebullets.splice(i, 1);
    }
  }
  if (hasCurse('sloth')) { const was = p.inv; p.inv = 0; hurtPlayer(1, p.x, p.y, true); if (p.inv < was) p.inv = was; }
}
function onReloadFinished(p, active) { const S = G.S; if (!S.refit || !active || p.armor >= p.maxArmor || G.time < (p.refitT || 0)) return;
  p.armor++; p.refitT = G.time + (5 - S.refit) * (SYN.fortress ? .5 : 1); AU.play('armor', 1.3); ringFx(p.x, p.y, 12, col(4), .25, 1); }
function onArmorBroken(p) { const S = G.S; if (!S.breakw) return; const R = 70 + 40 * S.breakw;
  for (let i = G.ebullets.length - 1; i >= 0; i--) if (dist(p.x, p.y, G.ebullets[i].x, G.ebullets[i].y) < R) G.ebullets.splice(i, 1);
  for (const e of G.enemies) if (!e.dead && e.spawnT <= 0 && dist(p.x, p.y, e.x, e.y) < R + e.r) hitEnemy(e, (14 + 8 * S.breakw) * S.dmg, { proc: .6, ka: ang(p.x, p.y, e.x, e.y), knock: 260, color: C.cyan, boom: true });
  for (let k = 0; k < 3; k++) ringFx(p.x, p.y, R * (.5 + k * .25), k % 2 ? col(5) : C.cyan, .35 + k * .08, 3); AU.play('dashOff'); flash(C.cyan, .3, true); shake(.3, true);
  if (SYN.lastbreath) p.inv = Math.max(p.inv, 1.5); }
// flame trail left by dashes
function trailTick(p) { const S = G.S; if (!S.trail) return; G.fires = G.fires || []; const last = G.fires[G.fires.length - 1];
  if (!last || dist(last.x, last.y, p.x, p.y) > 7) G.fires.push({ x: p.x, y: p.y + 3, life: (1.2 + .4 * S.trail) * (SYN.blaze ? 2 : 1), max: (1.2 + .4 * S.trail) * (SYN.blaze ? 2 : 1), tick: 0 }); if (G.fires.length > 120) G.fires.shift(); }
function updateFires(dt) { const F = G.fires; if (!F || !F.length) return; const S = G.S;
  for (let i = F.length - 1; i >= 0; i--) { const f = F[i]; f.life -= dt; f.tick -= dt; if (f.life <= 0) { F.splice(i, 1); continue; }
    if (f.tick <= 0) { f.tick = .3; for (const e of G.enemies) if (!e.dead && e.spawnT <= 0 && !e.fly && dist(f.x, f.y, e.x, e.y) < 8 + e.r) { hitEnemy(e, (2 + S.trail * 1.5) * S.dmg, { proc: .2, fromField: true, knock: 0, quiet: true, color: C.orange }); e.burn = Math.max(e.burn, SYN.blaze ? 3 : 1); e.burnT = 3; } }
    if (Math.random() < .25) part({ x: f.x + rand(-3, 3), y: f.y - rand(0, 3), vx: rand(-6, 6), vy: rand(-40, -20), life: .35, max: .35, c: Math.random() < .5 ? C.orange : C.red, s: 1, drag: 0 }); } }
function drawFires(cx, cy) { const F = G.fires; if (!F) return; for (const f of F) { const k = f.life / f.max, x = f.x - cx, y = f.y - cy, h = 3 + Math.sin(G.time * 18 + f.x) * 1.5;
  ctx.globalAlpha = .35 * k; disc(x, y, 5, C.red); ctx.globalAlpha = Math.min(1, k * 1.6); rect(x - 2, y - h, 4, h, C.orange); rect(x - 1, y - h + 1, 2, h - 1, C.gold); ctx.globalAlpha = 1; } }
function drawMarks(e, x, y) { if (!e.marked) return; const r = e.r + 5, a = G.time * 3;
  for (let i = 0; i < 4; i++) { const q = a + i * 1.5708; pxLine(x + Math.cos(q) * r, y + Math.sin(q) * r, x + Math.cos(q) * (r - 3), y + Math.sin(q) * (r - 3), C.red); } }

// ---------------- curses ----------------
const CURSES = [
  { id: 'greed', icon: 'c_greed', n: N4('MALABSORPTION', '吸收不良', '吸収不良', '吸收不良'), d: N4('PARTS GAINED -25%.', '零件獲取量減少 25%。', 'パーツ獲得量-25%。', '零件获取量减少 25%。') },
  { id: 'hubris', icon: 'c_hubris', n: N4('HAND CRAMPS', '手部痙攣', '手の痙攣', '手部痉挛'), d: N4('MAGAZINE SIZE -40%.', '彈匣容量降低 40%。', '装弾数-40%。', '弹夹容量降低 40%。') },
  { id: 'coward', icon: 'c_coward', n: N4('PANIC DISORDER', '恐慌症', 'パニック障害', '恐慌症'), d: N4('WHILE ALL ARMOR IS BROKEN, YOU CANNOT DASH.', '護甲全部破碎時，無法衝刺。', 'アーマーが全て砕けている間、ダッシュ不可。', '护盾全部破碎时，无法冲刺。') },
  { id: 'wrath', icon: 'c_wrath', n: N4('MUSCLE FATIGUE', '肌肉疲勞', '筋疲労', '肌肉疲劳'), d: N4('ATTACKING CONTINUOUSLY LOWERS YOUR DAMAGE BY 30%.', '連續攻擊時，傷害降低 30%。', '攻撃し続けるとダメージ-30%。', '连续攻击时，降低 30% 伤害。') },
  { id: 'sloth', icon: 'c_sloth', n: N4('ARTHRITIS', '關節炎', '関節炎', '关节炎'), d: N4('AN AUTOMATIC RELOAD DEALS 1 DAMAGE TO YOU.', '被動換彈時受到 1 點傷害。', '自動リロード時に1ダメージを受ける。', '被动换弹时受到 1 点伤害。') },
  { id: 'tremor', icon: 'c_tremor', n: N4('ATAXIA', '共濟失調', '運動失調', '共济失调'), d: N4('AT 3 HEALTH OR LESS, YOUR MOVEMENT DRIFTS SLIGHTLY AT RANDOM.', '生命值偏少（3 點以下）時，移動會出現輕微隨機偏移。', 'HP3以下の時、移動がわずかにぶれる。', '血量偏少（小于等于 3）时，角色移动出现轻微随机偏移。') },
  { id: 'surr', icon: 'c_surr', n: N4('TRAUMATIC SHOCK', '創傷休克', '外傷性ショック', '创伤休克'), d: N4('FOR 2S AFTER TAKING DAMAGE, YOU DEAL 40% LESS DAMAGE.', '受到傷害後 2 秒內，造成的傷害降低 40%。', '被弾後2秒間、与ダメージ-40%。', '受到伤害后的短时间内（2 秒）造成伤害降低 40%。') },
  { id: 'over', icon: 'c_over', n: N4('AMNESIA', '健忘症', '健忘症', '健忘症'), d: N4('ENTERING THE NEXT FLOOR TAKES HALF OF YOUR PARTS.', '進入下一層時，扣除當前一半的零件。', '次の階層に入る時、パーツの半分を失う。', '进入下一层时，扣除当前一半的零件。') },
  { id: 'disaster', icon: 'c_disaster', n: N4('PHEROMONE LEAK', '費洛蒙外洩', 'フェロモン漏出', '费洛蒙外泄'), d: N4('MORE ENEMIES APPEAR (+20% PER WAVE).', '出現更多的敵人（每波多 20%）。', '敵が増える（ウェーブ毎+20%）。', '出现更多的敌人（每波多 20%）。') },
  { id: 'seal', icon: 'c_seal', n: N4('NERVE DAMAGE', '神經損傷', '神経損傷', '神经损伤'), d: N4('FOR 3S AFTER TAKING DAMAGE, YOUR SKILL CHIP IS DISABLED.', '受到傷害後 3 秒內，技能會被禁用。', '被弾後3秒間、スキルが使えない。', '受到伤害的短时间内（3 秒），技能会被禁用。') },
  { id: 'time', icon: 'c_time', n: N4('BLOOD SCENT', '血腥味', '血の匂い', '血腥味'), d: N4('20S AFTER A ROOM LOCKS, ITS ENEMIES BECOME 50% MORE AGGRESSIVE.', '進入房間 20 秒後，該房間的敵人攻擊欲望更強烈。', '部屋に入って20秒後、敵の攻撃性が50%上昇。', '进入房间 20 秒后，该房间的敌人攻击欲望更强烈。') },
  { id: 'drought', icon: 'c_drought', n: N4('HEMOPHILIA', '血友病', '血友病', '血友病'), d: N4('HEALTH CAN NO LONGER BE RESTORED BY ANY MEANS.', '生命值無法以任何手段恢復。', 'HPはいかなる手段でも回復しない。', '生命值无法以任何手段恢复。') },
  { id: 'slow', icon: 'c_slow', n: N4('ANEMIA', '貧血', '貧血', '贫血'), d: N4('ARMOR TAKES TWICE AS LONG TO RECOVER.', '護甲恢復時間 +100%。', 'アーマーの回復時間+100%。', '护盾恢复时间 +100%。') },
];
const CURSE = Object.fromEntries(CURSES.map(c => [c.id, c]));
const CURSE_C = '#c8323a';
function hasCurse(id) { return !!(G && G.curses && G.curses.includes(id)); }
function curseStats(S) { if (hasCurse('hubris')) S.mag *= .6; if (hasCurse('slow')) S.armorRegen *= .5; }
// the event: once the portal's black-out finishes closing, three curses surface through the dark
const CQ = { w: 118, h: 150, gap: 14 };
function openCurse() {
  const pool = CURSES.filter(c => !(G.curses || []).includes(c.id));
  G.curseQ = { opts: shuffle(pool.slice()).slice(0, 3).map(c => c.id), t: 0, hover: -1, pick: -1, pickT: 0, rr: false, rrT: 9, lh: -1 };
  G.state = 'curse'; AU.play('dread'); shake(.3, true);
}
function curseRect(i) { const n = G.curseQ.opts.length; return { x: Math.round(W / 2 + (i - (n - 1) / 2) * (CQ.w + CQ.gap) - CQ.w / 2), y: 62, w: CQ.w, h: CQ.h }; }
const CRR = { x: W / 2 - 62, y: 226, w: 124, h: 20 };
RELAYOUT.push(() => { CRR.x = W / 2 - 62; });
function curseRerollOk() { return !G.curseQ.rr && G.p.hp > 1; }
function updateCurse(rdt) {
  const q = G.curseQ; q.t += rdt; q.rrT += rdt;
  if (q.pick >= 0) { q.pickT += rdt; if (q.pickT > 1.5) { G.curseQ = null; G.curseDone = true; G.state = 'trans'; saveRun(); } return; }
  if (q.t < 1.3) return;
  q.hover = -1; q.opts.forEach((id, i) => { const r = curseRect(i); if (Input.mx > r.x && Input.mx < r.x + r.w && Input.my > r.y && Input.my < r.y + r.h) q.hover = i; });
  if (q.hover !== q.lh && q.hover >= 0) AU.play('ui', .5 + q.hover * .05); q.lh = q.hover;
  q.rrHov = Input.mx >= CRR.x && Input.mx <= CRR.x + CRR.w && Input.my >= CRR.y && Input.my <= CRR.y + CRR.h;
  let pick = -1; if (Input.clicked && q.hover >= 0) pick = q.hover; ['Digit1', 'Digit2', 'Digit3'].forEach((k, i) => { if (pressed(k) && i < q.opts.length) pick = i; });
  if ((pressed('KeyR') || (Input.clicked && q.rrHov)) && pick < 0) {
    if (curseRerollOk()) { q.rr = true; q.rrT = 0; G.p.hp--; AU.play('hurt'); AU.play('dread', 1.3, .6); flash(C.red, .35, true);
      const pool = CURSES.filter(c => !(G.curses || []).includes(c.id) && !q.opts.includes(c.id)); const fresh = shuffle(pool.map(c => c.id)); q.opts = q.opts.map(id => fresh.pop() || id); q.t = .9; }
    else { AU.play('locked'); q.deny = .35; } }
  if (pick >= 0) { q.pick = pick; q.pickT = 0; const id = q.opts[pick]; G.curses = (G.curses || []).concat(id); recomputeStats(); AU.play('cursePick'); shake(.6, true); chroma(1.5, true); }
  q.deny = Math.max(0, (q.deny || 0) - rdt);
}
// slice-shift the pixels already drawn in a band of the screen: cheap, convincing tearing
function tear(x, y, w, h, amp, n) { const v = view; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < n; i++) { const sy = Math.round(rand(y, y + h)), sh = Math.round(rand(1, 5)), dx = Math.round(rand(-amp, amp)); if (!dx) continue;
    ctx.drawImage(v, Math.max(0, x * US), sy * US, w * US, sh * US, (x + dx) * US, sy * US, w * US, sh * US); } ctx.restore(); }
function drawCurse() {
  const q = G.curseQ; if (!q) return; const t = q.t, k = clamp(t / 1.2, 0, 1);
  rect(0, 0, W, H, '#000');
  // dark red breathing vignette and drifting static
  const br = .5 + Math.sin(t * 1.7) * .5; ctx.globalAlpha = .18 + br * .1; ctx.drawImage(glowSprite('#5a000c', 160), W / 2 - 160, H / 2 - 160 + 20); ctx.globalAlpha = 1;
  for (let i = 0; i < 70; i++) { const x = (i * 131 + ((t * 60) | 0) * 7) % W, y = (i * 53 + ((t * 40) | 0) * 13) % H; rect(x, y, Math.random() < .2 ? 2 : 1, 1, Math.random() < .3 ? '#3a0008' : '#151517'); }
  for (let i = 0; i < 3; i++) if (Math.random() < .25) rect(0, rand(0, H), W, 1, '#2a0006');
  // title: "give up..." typed in with a jittering split
  const title = L('cu_title'), chars = [...title], shown = chars.slice(0, Math.ceil(chars.length * clamp((t - .3) / .9, 0, 1))).join(''), sc = 3, tw = textW(title, sc), tx = Math.round(W / 2 - tw / 2), ty = 18;
  const jx = Math.random() < .2 ? rand(-2, 2) : 0;
  text(shown, tx + jx - 2, ty, '#4a0a0e', sc); text(shown, tx + jx + 1, ty + 1, '#1a0a0a', sc); text(shown, tx + jx, ty, '#e6dfd1', sc);
  if (t > 1 && ((t * 2) | 0) % 2 === 0) text(L('cu_sub'), W / 2, ty + 26, '#6a5a5c', 1, 'center');
  // cards
  q.opts.forEach((id, i) => { const c = CURSE[id], r = curseRect(i), ap = clamp((t - .6 - i * .15) / .5, 0, 1); if (ap <= 0) return;
    let x = r.x, y = r.y + Math.round((1 - easeOut(ap)) * 18); const hov = q.hover === i && q.pick < 0, chosen = q.pick === i;
    if (q.pick >= 0 && !chosen) { const f = clamp(q.pickT / .6, 0, 1); ctx.globalAlpha = 1 - f; y += f * 30; }
    else ctx.globalAlpha = ap;
    if (hov) y -= 3;
    rect(x + 3, y + 3, r.w, r.h, '#000');
    rect(x, y, r.w, r.h, chosen ? '#22090a' : hov ? '#140908' : '#0c0807'); box(x, y, r.w, r.h, null, chosen || hov ? CURSE_C : '#3a1414');
    rect(x, y, 34, 1, CURSE_C); rect(x, y + 1, 12, 1, '#6a1a1e');
    const ix = x + r.w / 2 - 18, iy = y + 16, pulse = .6 + Math.sin(G.time * 3 + i) * .4; ctx.save(); ctx.globalAlpha *= .35 * pulse; ctx.drawImage(glowSprite(CURSE_C, 24), ix - 6, iy - 6); ctx.restore();
    rect(ix, iy, 36, 36, '#050304'); box(ix, iy, 36, 36, null, '#3a0a10'); icon(c.icon, ix + 2 + (hov ? Math.round(rand(-1, 1)) : 0), iy + 2, chosen ? '#e6dfd1' : CURSE_C, 4);
    const nm = tr(c.n); text(fitText(nm, r.w - 10), x + r.w / 2, y + 60, '#e6dfd1', 1, 'center');
    rect(x + 14, y + 72, r.w - 28, 1, '#3a0a10');
    wrapW(tr(c.d), r.w - 14).slice(0, 6).forEach((ln, j) => text(ln, x + 7, y + 80 + j * lineH(), '#a8998f'));
    if (chosen) { const f = clamp(q.pickT / .4, 0, 1); ctx.globalAlpha = (1 - f) * .8; rect(x, y, r.w, r.h, CURSE_C); }
    ctx.globalAlpha = 1; });
  // reroll with blood
  if (q.pick < 0 && t > 1.3) { const ok = curseRerollOk(), hv = q.rrHov && ok, sh = q.deny > 0 ? Math.round(Math.sin(q.deny * 60) * 2) : 0, x = CRR.x + sh, y = CRR.y;
    rect(x, y, CRR.w, CRR.h, hv ? '#1a0909' : '#0a0706'); box(x, y, CRR.w, CRR.h, null, hv ? CURSE_C : ok ? '#3a1414' : '#2d2925'); if (hv) rect(x, y, 2, CRR.h, CURSE_C);
    const lb = q.rr ? L('cu_rrUsed') : L('cu_rr'), lw = textW(lb) + 22, lx = Math.round(W / 2 - lw / 2);
    icon('heart', lx, y + 6, ok ? CURSE_C : '#4c463f'); text(lb, lx + 12, y + (isCJK(lb) ? 5 : 7), ok ? (hv ? '#e6dfd1' : '#b8aaa0') : '#57524a');
    if (!q.rr) text('-1', lx + lw - 6, y + 7, ok ? CURSE_C : '#4c463f'); }
  // tearing and a slow wave while the curses surface; a hard tear on the pick
  const amp = (1 - k) * 18 + (q.rrT < .4 ? (1 - q.rrT / .4) * 14 : 0) + (q.pick >= 0 ? clamp(1 - q.pickT / .8, 0, 1) * 22 : 0) + (Math.random() < .06 ? 6 : 0);
  if (amp > .5) tear(0, 0, W, H, amp, 10 + Math.round(amp));
  if (q.pick >= 0 && q.pickT > .9) { ctx.globalAlpha = clamp((q.pickT - .9) / .5, 0, 1); rect(0, 0, W, H, '#000'); ctx.globalAlpha = 1; }
}
// small curse sigils under the vitals
function drawCurseHUD(x, y) { const cs = G.curses || []; cs.forEach((id, i) => { const cx = x + i * 11; rect(cx - 1, y - 1, 10, 10, '#0a0405'); icon(CURSE[id].icon, cx, y, CURSE_C); }); return cs.length * 11; }
