// ===== TheSeed radio partners: the girls no longer walk into the fight. The girl you last accepted at a camp stays on the radio
// for the rest of the run (a newer one takes her place, like a skill chip); a girl at full affection can also be brought along from
// the start. She gives one active skill (F), always a buff on you, and one passive. Her affection unlocks a new trait at 30 / 60 / 100,
// and her skill tree (cooldown, potency, passive), bought with embers between runs, sharpens it. Camp meetings, chat, stories stay.
'use strict';
Object.assign(ICONS, {
  pk_snipe: ['...1....', '.11111..', '.1.1.1..', '1111111.', '.1.1.1..', '.11111..', '...1....', '........'],
  pk_bounce: ['1.......', '.1....1.', '..1..1..', '...11...', '......1.', '.....1.1', '....1...', '...1....'],
  pk_fire: ['...1....', '..11....', '..111.1.', '.11111..', '.111111.', '11111111', '.111111.', '..1111..'],
  pk_med: ['..1111..', '..1111..', '11111111', '11111111', '11111111', '11111111', '..1111..', '..1111..'],
  pk_calm: ['11111111', '.111111.', '..1111..', '...11...', '...11...', '..1..1..', '.1....1.', '11111111'],
  pk_order: ['1......1', '11....11', '.11..11.', '..1111..', '1..11..1', '11....11', '.11..11.', '..1111..'],
  pk_bird: ['........', '1.....1.', '11...11.', '.11.11..', '..111...', '..11....', '.1......', '........'],
});
Object.assign(STR, {
  ra_row: ['BRING ALONG', '出戰攜帶', '出撃時に同行', '出战携带'], ra_none: ['NOBODY', '不攜帶', '同行なし', '不携带'], ra_set: ['BRING HER ON SORTIES', '設為出戰攜帶', '出撃に同行させる', '设为出战携带'],
  ra_unset: ['STOP BRINGING HER', '取消出戰攜帶', '同行をやめる', '取消出战携带'], ra_is: ['BROUGHT ON SORTIES', '出戰攜帶中', '出撃に同行中', '出战携带中'], ra_badge: ['RADIO', '電台', '無線', '电台'],
  ra_lock: ['AT AFFECTION 100 SHE CAN BE BROUGHT FROM THE START; UNTIL THEN, MEET HER AT A CAMP IN THE RUN', '好感度 100 後可出戰攜帶；在那之前，只能在局內營地遇見她時接受', '好感度100で出撃から同行できる。それまでは道中のキャンプで出会った時のみ', '好感度 100 后可出战携带；在那之前，只能在局内营地遇见她时接受'],
  ra_lockRow: ['AFFECTION 100 NEEDED', '需好感度 100', '好感度100が必要', '需好感度 100'],
  ra_cd: ['COOLDOWN {0}S', '冷卻 {0} 秒', 'クールダウン{0}秒', '冷却 {0} 秒'], ra_passive: ['PASSIVE', '被動', 'パッシブ', '被动'], ra_traits: ['BOND TRAITS', '羈絆特性', '絆の特性', '羁绊特性'],
  ra_tree: ['SKILL TREE', '技能樹', 'スキルツリー', '技能树'],
  ra_tCd: ['COOLDOWN', '冷卻縮減', 'クールダウン', '冷却缩减'], ra_tPw: ['POTENCY', '技能強度', '技能強度', '技能强度'], ra_tPs: ['PASSIVE', '被動強化', 'パッシブ強化', '被动强化'],
  ra_tCdD: ['-8% COOLDOWN PER LEVEL', '每級冷卻 -8%', 'レベル毎にCT-8%', '每级冷却 -8%'], ra_tPwD: ['+12% BUFF STRENGTH PER LEVEL', '每級增益數值 +12%', 'レベル毎に強化量+12%', '每级增益数值 +12%'], ra_tPsD: ['+25% PASSIVE PER LEVEL', '每級被動效果 +25%', 'レベル毎にパッシブ+25%', '每级被动效果 +25%'],
  ra_wait: ['{0} IS NOT READY ({1}S)', '{0}還沒準備好（{1} 秒）', '{0}はまだ準備中（{1}秒）', '{0}还没准备好（{1} 秒）'],
  ra_meetMine: ['{0} CAME IN PERSON: SKILL READY', '{0} 親自趕來了：技能冷卻重置', '{0}が直接来た：スキル準備完了', '{0} 亲自赶来了：技能冷却重置'],
  ra_card: ['MET {0} · AFFECTION +{1}', '與 {0} 相遇 · 好感度 +{1}', '{0}と出会った・好感度+{1}', '与 {0} 相遇 · 好感度 +{1}'],
  ra_took: ['{0} IS ON THE RADIO NOW · F: {1}', '{0} 接管了電台 · F：{1}', '{0}が無線を担当・F：{1}', '{0} 接管了电台 · F：{1}'],
  ra_kept: ['{0} STAYS ON THE RADIO', '電台仍由 {0} 負責', '無線は引き続き{0}', '电台仍由 {0} 负责'],
  ra_take: ['TAKE HER ON', '接受她', '彼女に任せる', '接受她'], ra_keep: ['KEEP', '保留', 'そのまま', '保留'], ra_askHint: ['A/D CHOOSE · E CONFIRM', 'A/D 選擇 · E 確認', 'A/D 選択・E 決定', 'A/D 选择 · E 确认'],
  ra_rest: ['RESTED BY THE FIRE: RADIO SKILL READY', '篝火休整：電台技能冷卻重置', '焚き火で休んだ：無線スキル準備完了', '篝火休整：电台技能冷却重置'],
  ra_saved: ['MIKO TALKED YOU THROUGH IT: 1 HEALTH LEFT', '米可在電台裡把你喊了回來：保留 1 點生命', 'ミコの声に引き戻された：HP1で踏みとどまった', '米可在电台里把你喊了回来：保留 1 点生命'],
  ra_refund: ['PARTNER TRAINING REFUNDED: +{0} EMBERS', '搭檔強化已退還：火種 +{0}', '相棒の強化を返還：火種+{0}', '搭档强化已退还：火种 +{0}'],
  g_tabUpg: ['SKILL', '技能', 'スキル', '技能'], h_partner: ['RADIO PARTNER SKILL', '電台搭檔技能', '無線の相棒スキル', '电台搭档技能'],
});
const PT_COST = [1, 2, 3];
// ---------------- the seven skills: each is a buff on you ----------------
// ic icon, cd base cooldown, dur base duration (none for the medkit), n name, d what it does (w = potency), pd passive (k = passive multiplier), tr three bond traits
const pct = v => Math.round(v * 100);
const PSK = {
  seye: { ic: 'pk_snipe', cd: 22, dur: 8, n: N4('SPOTTER', '狙擊觀測', '観測手', '狙击观测'),
    d: w => N4(`SHE CALLS YOUR SHOTS FOR 8S: +${pct(.2 * w)}% CRIT CHANCE, +${pct(.3 * w)}% CRIT DAMAGE, SHOTS PIERCE +1.`, `她在遠處替你報點，持續 8 秒：暴擊率 +${pct(.2 * w)}%，暴擊傷害 +${pct(.3 * w)}%，子彈穿透 +1。`, `8秒間、彼女が着弾を指示：会心率+${pct(.2 * w)}%、会心ダメージ+${pct(.3 * w)}%、貫通+1。`, `她在远处替你报点，持续 8 秒：暴击率 +${pct(.2 * w)}%，暴击伤害 +${pct(.3 * w)}%，子弹穿透 +1。`),
    pd: k => N4(`ELITES, CHAMPIONS AND BOSSES TAKE +${Math.round(8 * k)}% DAMAGE.`, `對精英、冠軍與首領的傷害 +${Math.round(8 * k)}%。`, `エリート・チャンピオン・ボスへのダメージ+${Math.round(8 * k)}%。`, `对精英、冠军与首领的伤害 +${Math.round(8 * k)}%。`),
    tr: [N4('WHILE IT LASTS, +15% DAMAGE TO ELITES, CHAMPIONS AND BOSSES.', '觀測期間，對精英、冠軍與首領的傷害再 +15%。', '観測中、エリート・チャンピオン・ボスへのダメージ+15%。', '观测期间，对精英、冠军与首领的伤害再 +15%。'),
      N4('IT LASTS 3S LONGER.', '持續時間 +3 秒。', '持続時間+3秒。', '持续时间 +3 秒。'),
      N4('EACH KILL WHILE IT LASTS TAKES 1S OFF THE COOLDOWN (UP TO 6S).', '觀測期間每次擊殺，冷卻減少 1 秒（最多 6 秒）。', '観測中の撃破ごとにCT-1秒（最大6秒）。', '观测期间每次击杀，冷却减少 1 秒（最多 6 秒）。')],
    say: ['看見了。往左一點——對。', '目標確認。你只管開槍。', '我在你左後方的樓頂。'] },
  chishima: { ic: 'pk_bounce', cd: 22, dur: 8, n: N4('RICOCHET ROUNDS', '跳彈改裝', '跳弾改造', '跳弹改装'),
    d: w => N4(`SHE TALKS YOU THROUGH A QUICK MOD, FOR 8S: SHOTS BOUNCE +1, +${pct(.2 * w)}% BULLET SIZE, +${pct(.3 * w)}% KNOCKBACK.`, `她用電台教你臨時改裝子彈，持續 8 秒：子彈彈射 +1，子彈尺寸 +${pct(.2 * w)}%，擊退 +${pct(.3 * w)}%。`, `8秒間、無線で弾を即席改造：跳弾+1、弾サイズ+${pct(.2 * w)}%、ノックバック+${pct(.3 * w)}%。`, `她用电台教你临时改装子弹，持续 8 秒：子弹弹射 +1，子弹尺寸 +${pct(.2 * w)}%，击退 +${pct(.3 * w)}%。`),
    pd: k => N4(`+${Math.round(8 * k)}% PARTS GAINED.`, `零件獲取 +${Math.round(8 * k)}%。`, `パーツ獲得+${Math.round(8 * k)}%。`, `零件获取 +${Math.round(8 * k)}%。`),
    tr: [N4('EACH KILL WHILE IT LASTS GIVES 2 MORE PARTS.', '改裝期間每次擊殺額外獲得 2 零件。', '改造中の撃破ごとにパーツ+2。', '改装期间每次击杀额外获得 2 零件。'),
      N4('IT LASTS 3S LONGER.', '持續時間 +3 秒。', '持続時間+3秒。', '持续时间 +3 秒。'),
      N4('SHOTS BOUNCE +2 INSTEAD.', '子彈彈射改為 +2。', '跳弾が+2になる。', '子弹弹射改为 +2。')],
    say: ['子彈我動了點手腳，嘿嘿。', '這招我在廢車場練過！', '彈來彈去的，很好玩吧？'] },
  ling: { ic: 'pk_fire', cd: 20, dur: 6, n: N4('ALL GUNS', '火力全開', '全力射撃', '火力全开'),
    d: w => N4(`SHE COUNTS YOU IN, FOR 6S: +${pct(.25 * w)}% DAMAGE.`, `她替你數拍子，持續 6 秒：傷害 +${pct(.25 * w)}%。`, `6秒間、彼女が拍を取る：ダメージ+${pct(.25 * w)}%。`, `她替你数拍子，持续 6 秒：伤害 +${pct(.25 * w)}%。`),
    pd: k => N4(`FOR 1.5S AFTER A DASH, +${Math.round(10 * k)}% DAMAGE.`, `衝刺後 1.5 秒內傷害 +${Math.round(10 * k)}%。`, `ダッシュ後1.5秒間、ダメージ+${Math.round(10 * k)}%。`, `冲刺后 1.5 秒内伤害 +${Math.round(10 * k)}%。`),
    tr: [N4('WHILE IT LASTS, SHOTS PIERCE +1.', '火力全開期間子彈穿透 +1。', '発動中、貫通+1。', '火力全开期间子弹穿透 +1。'),
      N4('IT LASTS 2S LONGER.', '持續時間 +2 秒。', '持続時間+2秒。', '持续时间 +2 秒。'),
      N4('EACH KILL WHILE IT LASTS ADDS +3% DAMAGE (UP TO +30%).', '期間每次擊殺，傷害再 +3%（最多 +30%）。', '発動中の撃破ごとにダメージ+3%（最大+30%）。', '期间每次击杀，伤害再 +3%（最多 +30%）。')],
    say: ['跟上。一、二——', '頭低一點，手別停。', '……這片我看著。'] },
  miko: { ic: 'pk_med', cd: 55, n: N4('MEDKIT DROP', '醫療空投', '医療投下', '医疗空投'),
    d: () => N4('A MEDKIT FLOATS DOWN ON YOU: 1 HEALTH (1 ARMOR IF YOUR HEALTH IS FULL).', '一個醫療包空投到你身上：恢復 1 點生命（生命全滿時改為恢復 1 點護甲）。', '医療キットが降ってくる：HP1回復（満タンならアーマー1回復）。', '一个医疗包空投到你身上：恢复 1 点生命（生命全满时改为恢复 1 点护甲）。'),
    pwd: N4('+1 ARMOR FROM THE MEDKIT PER LEVEL', '每級醫療包額外恢復 1 點護甲', 'レベル毎にアーマー+1回復', '每级医疗包额外恢复 1 点护甲'),
    pd: k => N4(`ARMOR RECOVERS ${Math.round(15 * k)}% FASTER.`, `護甲恢復速度 +${Math.round(15 * k)}%。`, `アーマー回復速度+${Math.round(15 * k)}%。`, `护甲恢复速度 +${Math.round(15 * k)}%。`),
    tr: [N4('THE MEDKIT ALSO GIVES 1 TEMPORARY ARMOR FOR 30S.', '醫療包額外給予 1 點臨時護甲（30 秒）。', '一時アーマー1（30秒）も得る。', '医疗包额外给予 1 点临时护甲（30 秒）。'),
      N4('ONCE PER RUN, A KILLING BLOW LEAVES YOU AT 1 HEALTH INSTEAD, INVINCIBLE FOR 2S.', '每局一次，受到致命傷害時改為保留 1 點生命，並無敵 2 秒。', '一回の出撃につき一度、致命傷を受けてもHP1で耐え2秒無敵。', '每局一次，受到致命伤害时改为保留 1 点生命，并无敌 2 秒。'),
      N4('THE MEDKIT RESTORES 2 HEALTH.', '醫療包恢復 2 點生命。', '医療キットでHP2回復。', '医疗包恢复 2 点生命。')],
    say: ['接住！別嫌我包得醜。', '先止血，再逞強。', '這是最後一包紗布……騙你的。'] },
  yuexun: { ic: 'pk_calm', cd: 24, dur: 7, n: N4('STEADY BREATH', '冷靜判斷', '冷静な判断', '冷静判断'),
    d: w => N4(`SHE SLOWS YOUR BREATHING, FOR 7S: DASH COOLDOWN -${pct(1 - .5 / w)}%, +${pct(.1 * w)}% MOVE SPEED.`, `她讓你的呼吸慢下來，持續 7 秒：衝刺冷卻 -${pct(1 - .5 / w)}%，移動速度 +${pct(.1 * w)}%。`, `7秒間、呼吸を整える：ダッシュCT-${pct(1 - .5 / w)}%、移動速度+${pct(.1 * w)}%。`, `她让你的呼吸慢下来，持续 7 秒：冲刺冷却 -${pct(1 - .5 / w)}%，移动速度 +${pct(.1 * w)}%。`),
    pd: k => N4(`DASH COOLDOWN -${Math.round(6 * k)}%. SPECIAL ROOMS SHOW ON THE MAP AT THE START OF EACH FLOOR.`, `衝刺冷卻 -${Math.round(6 * k)}%；每層開始時，小地圖標出所有特殊房間。`, `ダッシュCT-${Math.round(6 * k)}%。各階層の開始時、特殊な部屋が地図に表示される。`, `冲刺冷却 -${Math.round(6 * k)}%；每层开始时，小地图标出所有特殊房间。`),
    tr: [N4('WHEN IT STARTS, YOU ARE INVINCIBLE FOR 1.5S.', '發動時無敵 1.5 秒。', '発動時1.5秒無敵。', '发动时无敌 1.5 秒。'),
      N4('IT LASTS 3S LONGER.', '持續時間 +3 秒。', '持続時間+3秒。', '持续时间 +3 秒。'),
      N4('WHILE IT LASTS, BEING HIT GIVES 1S MORE INVINCIBILITY.', '期間受到傷害後，無敵時間額外 +1 秒。', '発動中、被弾後の無敵時間+1秒。', '期间受到伤害后，无敌时间额外 +1 秒。')],
    say: ['呼吸。看清楚再走。', '不急。它們沒有你想的快。', '我在聽。你慢慢來。'] },
  rin: { ic: 'pk_order', cd: 24, dur: 8, n: N4('TACTICAL ORDER', '戰術指令', '戦術指令', '战术指令'),
    d: w => N4(`FOR 8S: +${pct(.25 * w)}% ATTACK SPEED, +${pct(.15 * w)}% MOVE SPEED.`, `持續 8 秒：攻擊速度 +${pct(.25 * w)}%，移動速度 +${pct(.15 * w)}%。`, `8秒間：攻撃速度+${pct(.25 * w)}%、移動速度+${pct(.15 * w)}%。`, `持续 8 秒：攻击速度 +${pct(.25 * w)}%，移动速度 +${pct(.15 * w)}%。`),
    pd: k => N4(`FOR 3S AFTER A ROOM LOCKS, +${Math.round(20 * k)}% DAMAGE.`, `房間封鎖後 3 秒內，傷害 +${Math.round(20 * k)}%。`, `部屋が閉じてから3秒間、ダメージ+${Math.round(20 * k)}%。`, `房间封锁后 3 秒内，伤害 +${Math.round(20 * k)}%。`),
    tr: [N4('WHILE IT LASTS, RELOADS ARE 50% FASTER.', '指令期間換彈速度 +50%。', '指令中、リロード50%高速。', '指令期间换弹速度 +50%。'),
      N4('EACH KILL WHILE IT LASTS ADDS 1S (UP TO +4S).', '指令期間每次擊殺延長 1 秒（最多 +4 秒）。', '指令中の撃破ごとに1秒延長（最大+4秒）。', '指令期间每次击杀延长 1 秒（最多 +4 秒）。'),
      N4('IT STARTS BY REFILLING YOUR MAGAZINE AND YOUR DASH.', '發動時立即裝滿彈匣並重置衝刺冷卻。', '発動時に弾倉とダッシュを即回復。', '发动时立即装满弹匣并重置冲刺冷却。')],
    say: ['聽我指揮：推進！', '先清左邊，再壓右邊。', '節奏給你了，別浪費。'] },
  yoru: { ic: 'pk_bird', cd: 18, dur: 8, n: N4('PAPER WARDS', '紙鳥守護', '紙鳥の守り', '纸鸟守护'),
    d: w => N4(`THREE PAPER BIRDS CIRCLE YOU FOR ${Math.round(8 * w)}S. EACH CATCHES ONE ENEMY BULLET, THEN FOLDS AWAY.`, `三隻紙鳥繞著你飛 ${Math.round(8 * w)} 秒，每隻替你擋下一顆敵方子彈後消散。`, `紙の鳥3羽が${Math.round(8 * w)}秒間周回し、それぞれ敵弾を1つ受け止めて消える。`, `三只纸鸟绕着你飞 ${Math.round(8 * w)} 秒，每只替你挡下一颗敌方子弹后消散。`),
    pd: k => N4(`THE FIRST SERUM REROLL ON EACH FLOOR IS FREE. REROLLS COST ${Math.round(10 * (k - 1) / .25)}% LESS.`, `每層第一次重抽血清免費；重抽花費 -${Math.round(10 * (k - 1) / .25)}%。`, `各階層の最初の血清引き直しは無料。引き直し費用-${Math.round(10 * (k - 1) / .25)}%。`, `每层第一次重抽血清免费；重抽花费 -${Math.round(10 * (k - 1) / .25)}%。`),
    tr: [N4('FOUR BIRDS.', '紙鳥增加為 4 隻。', '紙の鳥が4羽になる。', '纸鸟增加为 4 只。'),
      N4('EACH CAUGHT BULLET GIVES +10% DAMAGE FOR 3S.', '每擋下一顆子彈，3 秒內傷害 +10%。', '弾を受け止めるたび3秒間ダメージ+10%。', '每挡下一颗子弹，3 秒内伤害 +10%。'),
      N4('EACH BIRD CATCHES TWO BULLETS.', '每隻紙鳥可以擋下兩顆子彈。', '各鳥が弾を2つまで受け止める。', '每只纸鸟可以挡下两颗子弹。')],
    say: ['那個……牠們會保護你的。', '折了一整晚。請珍惜。', '飛吧。'] },
};
const ptDur = (id, P) => (PSK[id].dur || 0) + (P.tier >= 2 ? { seye: 3, chishima: 3, ling: 2, yuexun: 3 }[id] || 0 : 0);
// ---------------- who can be brought along, the tree, the tier ----------------
const ptCanCarry = id => girlMet(id) && girlData(id).aff >= AFF_MAX;
function radioId() { const r = gpLoad().radio; return r && SURV_IDS.includes(r) && ptCanCarry(r) ? r : null; }
function setRadio(id) { if (id && !ptCanCarry(id)) { AU.play('locked'); return; } gpLoad().radio = id || null; gpSave(); AU.play('menuOk'); }
function cycleRadio(d) { const ids = [null, ...SURV_IDS.filter(ptCanCarry)]; if (ids.length < 2) { AU.play('locked'); return; } const i = Math.max(0, ids.indexOf(radioId())); setRadio(ids[(i + d + ids.length) % ids.length]); }
function ptTree(id) { const d = girlData(id); if (!d.pt || typeof d.pt !== 'object') d.pt = {}; for (const k of ['cd', 'pw', 'ps']) d.pt[k] = clamp(Math.floor(d.pt[k]) || 0, 0, 3); return d.pt; }
const ptTier = id => { const a = girlData(id).aff; return a >= 100 ? 3 : a >= 60 ? 2 : a >= 30 ? 1 : 0; };
function ptCdMax(id) { return PSK[id].cd * (1 - .08 * ptTree(id).cd); }
// the old training (speed, damage, health, follower weapons) is handed back as embers, once
let PT_REFUND_N = 0, PT_REFUND_OK = false;
function ptRefund() { const gp = gpLoad(); if (gp.ptRefund) return; let n = 0;
  for (const id of SURV_IDS) { const d = gp.girls[id]; if (!d) continue; for (const k of ['spd', 'dmg', 'hp']) n += (d.lv && d.lv[k]) || 0; d.lv = { spd: 0, dmg: 0, hp: 0 };
    for (const w of d.own || []) n += (typeof W_TIER !== 'undefined' && W_TIER[w]) || 1; d.own = []; d.wsel = null; }
  gp.proofs += n; gp.ptRefund = 1; gpSave(); if (n) PT_REFUND_N = n; }
// ---------------- the run: who is on the radio ----------------
const mkPtn = (id, cd) => ({ id, cd, act: null, tier: ptTier(id), t: ptTree(id), readyT: 0, cut: null });
function ptnRevealRooms() { if (G.ptn?.id === 'yuexun' && G.mode !== 'invade' && WORLD) for (const rm of WORLD.rooms) if (rm.type !== 'combat' && rm.type !== 'start') rm.ptnSeen = true; }
function ptnSet(id, cd) { const old = G.ptn; G.ptn = id ? mkPtn(id, cd) : null; G.squad = id ? [mkMate(id, 'nail', 0, false)] : []; if (G.p && (old || G.ptn)) recomputeStats(); ptnRevealRooms(); }
const ptPw = () => G.ptn ? 1 + .12 * G.ptn.t.pw : 1, ptPs = () => G.ptn ? 1 + .25 * G.ptn.t.ps : 1, ptAct = k => G.ptn && G.ptn.act && G.ptn.id === k ? G.ptn.act : null;
const _newRunPt = newRun; newRun = function (...a) { ptRefund(); const r = _newRunPt(...a); G.ptnSaved = false; ptnSet(radioId(), 3); if (G.mode !== 'invade') saveRun(); return r; };
// a resumed run takes the partner from its save (older saves: the last girl who had joined the squad)
const _resumeRunPt = resumeRun; resumeRun = function (...a) { const s = loadSave(), r = _resumeRunPt(...a); if (G && G.p && s) { const q = s.ptn;
    const id = q && SURV_IDS.includes(q.id) ? q.id : q === undefined && Array.isArray(s.squad) && s.squad.length && SURV_IDS.includes(s.squad[s.squad.length - 1].id) ? s.squad[s.squad.length - 1].id : null;
    ptnSet(id, clamp(+(q && q.cd) || 0, 0, 60)); G.ptnSaved = !!(q && q.sv); saveRun(); } return r; };
// the girls stay off the field: the follower code does nothing now (the squad list only holds the radio partner, for chat and affection)
const SQ_ORIG = { updateSquad, drawSquad, updateSquadShots };
updateSquad = function () { }; drawSquad = function () { }; updateSquadShots = function () { };
// a camp meeting: affection as before; with nobody on the radio she takes it, if it is already her the skill is readied,
// otherwise you choose whether she takes over from the one on the radio now
function ptnTake(id, T) { ptnSet(id, 0); AU.play('radio'); if (T) T.res = L('ra_took', svName(id), tr(PSK[id].n)); notify(L('ra_took', svName(id), tr(PSK[id].n)), SURV[id].c); }
recruit = function (T) { if (T.end >= 0) return; T.end = 0; const it = T.it, k = G.inter.indexOf(it); if (k >= 0) G.inter.splice(k, 1);
  AU.play('select'); AU.play('heal', 1.2, .6); girlsMeet(T.id);
  if (G.ptn && G.ptn.id === T.id) { G.ptn.cd = 0; G.ptn.tier = ptTier(T.id); T.res = L('ra_meetMine', svName(T.id)); }
  else if (G.ptn) { T.ask = true; T.sel = 0; } else ptnTake(T.id, T); };
const joinBtns = () => [0, 1].map(j => ({ j, x: Math.round(W / 2 - 158 + j * 162), y: 98, w: 154, h: 30 }));
const _updateTalkPt = updateTalk; updateTalk = function (rdt) { const T = G.talk; if (!T || !T.ask) return _updateTalkPt(rdt);
  T.t += rdt; T.end = Math.min(T.end + rdt, .6); if (T.end < .45) return;
  const bs = joinBtns(), hv = bs.findIndex(b => inR(b, Input.mx, Input.my)); if (hv >= 0 && !TOUCH.on && hv !== T.sel) { T.sel = hv; AU.play('menu', 1.1, .5); }
  if (pressed('KeyA') || pressed('ArrowLeft')) T.sel = 0; if (pressed('KeyD') || pressed('ArrowRight')) T.sel = 1;
  const pick = Input.clicked && hv >= 0 ? hv : pressed('Enter') || pressed('Space') || pressed('KeyE') ? T.sel : pressed('Escape') ? 1 : -1; Input.clicked = false;
  if (pick < 0) return; T.ask = false; T.end = .5; if (pick === 0) ptnTake(T.id, T); else { T.res = L('ra_kept', svName(G.ptn.id)); AU.play('menu', .8); } };
drawJoinCard = function (T, k) { const c = SURV[T.id].c, e = easeOut(clamp(T.end / .35, 0, 1)), ask = T.ask, hh = ask ? 96 : 52, h = hh * e, y = ask ? 108 : 104;
  ctx.globalAlpha = k; rect(0, y - h / 2, W, h, '#0a0908'); if (h > 4) { rect(0, y - h / 2, W, 1, c); rect(0, y + h / 2 - 1, W, 1, c); }
  if (e > .6) { const a = clamp((e - .6) / .4, 0, 1) * k, sx = (1 - a) * 30; ctx.globalAlpha = a; textS(L('ra_card', svName(T.id), AFF_MEET), W / 2 + sx, y - hh / 2 + 10, c, 2, 'center');
    if (ask) { for (const b of joinBtns()) { const id = b.j ? G.ptn.id : T.id, cc = SURV[id].c, on = T.sel === b.j;
        rect(b.x, b.y, b.w, b.h, on ? thA(cc, .16) : '#0d0c0b'); box(b.x, b.y, b.w, b.h, null, on ? cc : '#3a3631'); if (on) rect(b.x, b.y, 2, b.h, cc);
        icon(PSK[id].ic, b.x + 8, b.y + 7, cc, 2); const l1 = L(b.j ? 'ra_keep' : 'ra_take'), l2 = svName(id) + ' · ' + tr(PSK[id].n);
        text(l1, b.x + 30, b.y + 5 - (isCJK(l1) ? 1 : 0), on ? '#e6dfd1' : '#8e877b'); text(fitText(l2, b.w - 36), b.x + 30, b.y + 17 - (isCJK(l2) ? 1 : 0), cc); }
      if (!TOUCH.on) text(L('ra_askHint'), W / 2, y + hh / 2 - 12, '#57524a', 1, 'center'); }
    else if (T.res) text(T.res, W / 2 - sx, y + 6, '#c9c1b2', 1, 'center'); }
  ctx.globalAlpha = 1; };
campRest = function (it) { it.used = true; AU.play('heal'); burst(it.x, it.y - 4, 24, C.orange, 90, .6); if (G.ptn) { G.ptn.cd = 0; notify(L('ra_rest'), C.green); } else notify(L('cp_alone'), C.green); };
// ---------------- using the skill ----------------
const ptnCol = id => SURV[id].c === '#e8e8ec' ? '#bfc8d8' : SURV[id].c;
function usePartner() { const P = G.ptn, p = G.p; if (!P || !p || !p.alive) return;
  if (P.cd > 0) { AU.play('locked'); notify(L('ra_wait', svName(P.id), Math.ceil(P.cd)), col(4)); return; }
  P.cd = ptCdMax(P.id); P.cut = { t: 0 }; AU.play('radio'); AU.play('menuOk', 1.2, .5);
  const dur = ptDur(P.id, P); if (dur) { P.act = { k: P.id, t: 0, dur: P.id === 'yoru' ? dur * ptPw() : dur, ext: 0, stk: 0, cdBack: 0 }; recomputeStats(); ptnAura(P); }
  PTN_USE[P.id](P, p); ringFx(p.x, p.y, 26, ptnCol(P.id), .4, 2); if (!(window.BOSS_TEST && BOSS_TEST.on)) { addAff(P.id, 1); gpSave(); }
  if (!SQ.ticker.length && Math.random() < .7) SQ.ticker.push({ id: P.id, txt: svText(choice(PSK[P.id].say)), t: 0 }); }
// a thin ring of ticks in her colour turns around you while her buff lasts
function ptnAura(P) { const A = P.act, c = ptnCol(P.id);
  went({ ptn: true, u() { return !G.ptn || G.ptn.act !== A; },
    dr(q, cx, cy) { const p = G.p, x = p.x - cx, y = p.y - cy - 3, k = Math.min(1, q.t * 5, (A.dur - A.t) * 2); ctx.globalAlpha = .75 * k;
      for (let i = 0; i < 6; i++) { const a = G.time * 1.6 + i * 1.047; rect(Math.round(x + Math.cos(a) * 13), Math.round(y + Math.sin(a) * 9), 2, 1, c); } ctx.globalAlpha = 1; } }); }
const PTN_USE = {
  seye() { AU.play('rail', 1.6, .3); },
  chishima() { AU.play('reloadDone', 1.3, .6); },
  ling() { AU.play('smg', 1.2, .5); },
  miko(P, p) { went({ ptn: true, x: p.x, y: p.y, drop: 1, done: false,
      u(q, dt) { const P2 = G.ptn, pl = G.p; q.x = lerp(q.x, pl.x, Math.min(1, dt * 6)); q.y = lerp(q.y, pl.y, Math.min(1, dt * 6));
        if (!q.done && q.t >= q.drop) { q.done = true; const tier = P2 && P2.id === 'miko' ? P2.tier : P.tier, heal = tier >= 3 ? 2 : 1, arm = P.t.pw;
          if (pl.hp < pl.maxHp) healPlayer(heal); else pl.armor = Math.min(pl.maxArmor, pl.armor + 1);
          if (arm) pl.armor = Math.min(pl.maxArmor, pl.armor + arm);
          if (tier >= 1) { pl.tArm = pl.tArm || []; if (pl.tArm.length < 2) pl.tArm.push(G.time + 30); }
          AU.play('heal'); burst(pl.x, pl.y - 4, 22, C.green, 100, .5); ringFx(pl.x, pl.y, 22, C.green, .4, 2); }
        return q.t > q.drop + .4; },
      dr(q, cx, cy) { if (q.t >= q.drop) { const k = 1 - (q.t - q.drop) / .4; ctx.globalAlpha = k; ringC(q.x - cx, q.y - cy, 10 + (1 - k) * 14, C.green, 1); ctx.globalAlpha = 1; return; }
        const k = q.t / q.drop, x = q.x - cx + Math.sin(q.t * 5) * 3, y = q.y - cy - (1 - k) * 160 - 8; ctx.fillStyle = '#e8e1d3'; ctx.beginPath(); ctx.arc(x, y - 12, 9, Math.PI, 0); ctx.fill(); pxLine(x - 9, y - 12, x - 3, y - 2, col(3)); pxLine(x + 9, y - 12, x + 3, y - 2, col(3));
        rect(x - 4, y - 3, 8, 6, col(0)); rect(x - 3, y - 2, 6, 4, '#efe8dc'); rect(x - 1, y - 2, 2, 4, C.red); rect(x - 3, y - 1, 6, 2, C.red); ctx.globalAlpha = .4; disc(q.x - cx, q.y - cy + 3, 4 + k * 3, col(0)); ctx.globalAlpha = 1; } });
  },
  yuexun(P, p) { AU.play('freeze', .7, .5); if (P.tier >= 1) p.inv = Math.max(p.inv, 1.5); },
  rin(P, p) { AU.play('phase', 1.4, .5); if (P.tier >= 3) { const w = WEAPONS[p.weapons[p.wi]]; if (w && usesAmmo(w)) { const am = ammoOf(p, w.id); am.n = magSize(w); am.rl = 0; } p.dashCd = 0; } },
  // the birds only guard: each catches enemy bullets around you, then folds away
  yoru(P, p) { const n = P.tier >= 1 ? 4 : 3, A = P.act;
    for (let i = 0; i < n; i++) went({ ptn: true, ph: i / n * 6.283, blocks: P.tier >= 3 ? 2 : 1, x: p.x, y: p.y, gone: 0,
      u(q, dt) { const pl = G.p, live = G.ptn && G.ptn.act === A && q.blocks > 0;
        if (!live) { q.gone += dt; q.y -= dt * 30; return q.gone > .35; }
        q.ph += dt * 3.2; q.x = pl.x + Math.cos(q.ph) * 18; q.y = pl.y - 3 + Math.sin(q.ph) * 13;
        for (let k = G.ebullets.length - 1; k >= 0; k--) { const b = G.ebullets[k]; if (b.delay > 0 || dist(b.x, b.y, q.x, q.y) > (b.r || 3) + 5) continue;
          G.ebullets.splice(k, 1); burst(b.x, b.y, 5, '#e8e8f0', 60, .25); AU.play('stick', 1.6, .3); if (G.ptn && G.ptn.tier >= 2) G.ptnWing = G.time + 3; if (--q.blocks <= 0) break; }
        return false; },
      dr(q, cx, cy) { const x = Math.round(q.x - cx), y = Math.round(q.y - cy), a = q.ph + 1.57, f = ((G.time * 12) | 0) % 2; ctx.globalAlpha = 1 - q.gone / .35;
        ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = '#f2ece2'; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-3, f ? -3 : -2); ctx.lineTo(-1, 0); ctx.lineTo(-3, f ? 3 : 2); ctx.closePath(); ctx.fill(); ctx.restore();
        if (q.blocks > 1) rect(x - 1, y - 5, 2, 1, '#bfa8d8'); ctx.globalAlpha = 1; } });
    AU.play('chakram', 1.6, .4); },
};
// ---------------- each frame in the run ----------------
const _updateSupportPt = updateSupport; updateSupport = function (dt) { _updateSupportPt(dt); const P = G.ptn, p = G.p; if (!P || !p) return;
  if (pressed('KeyF')) usePartner();
  const was = P.cd; P.cd = Math.max(0, P.cd - dt); if (was > 0 && P.cd <= 0) { P.readyT = .7; AU.play('ui', 1.6, .4); } P.readyT = Math.max(0, P.readyT - dt); if (P.cut) { P.cut.t += dt; if (P.cut.t > 1.1) P.cut = null; }
  if (p.dashT > 0) p.ptnDashAt = G.time;
  const A = P.act; if (A) { A.t += dt; if (A.t >= A.dur) { P.act = null; recomputeStats(); } } };
// the buffs, the passives and the traits, in the shared numbers
const _recomputePt = recomputeStats; recomputeStats = function () { _recomputePt(); const P = G.ptn, S = G.S; if (!P || !S) return; const ps = ptPs(), w = ptPw(), A = P.act;
  if (P.id === 'miko') S.armorRegen *= 1 + .15 * ps;
  if (P.id === 'yuexun') S.dashCd *= 1 - .06 * ps;
  if (!A) return;
  if (P.id === 'seye') { S.crit += .2 * w; S.critMul += .3 * w; S.pierce += 1; }
  if (P.id === 'chishima') { S.bounce += P.tier >= 3 ? 2 : 1; S.size *= 1 + .2 * w; S.knock *= 1 + .3 * w; }
  if (P.id === 'ling') { S.dmg *= 1 + .25 * w; if (P.tier >= 1) S.pierce += 1; }
  if (P.id === 'yuexun') { S.dashCd *= .5 / w; S.speed *= 1 + .1 * w; }
  if (P.id === 'rin') { S.rate *= 1 + .25 * w; S.speed *= 1 + .15 * w; if (P.tier >= 1) S.reload *= .67; } };
const _dmgModsPt = dmgMods; dmgMods = function (e, dmg, o) { dmg = _dmgModsPt(e, dmg, o); const P = G.ptn; if (!P) return dmg; const ps = ptPs(), big = e.elite || e.champ || e.boss || e.special;
  if (P.id === 'seye' && big) dmg *= (1 + .08 * ps) * (P.act && P.tier >= 1 ? 1.15 : 1);
  if (P.id === 'ling' && G.time - (G.p.ptnDashAt || -9) < 1.5) dmg *= 1 + .1 * ps;
  if (P.id === 'ling' && P.act && P.act.stk) dmg *= 1 + .03 * P.act.stk;
  if (P.id === 'rin' && G.time - (G.roomLockAt || -9) < 3) dmg *= 1 + .2 * ps;
  if (P.id === 'yoru' && G.ptnWing > G.time) dmg *= 1.1;
  return dmg; };
const _inkMulPt = inkMul; inkMul = function () { const m = _inkMulPt(); return G.ptn && G.ptn.id === 'chishima' ? m * (1 + .08 * ptPs()) : m; };
const _rerollCostPt = rerollCost; rerollCost = function () { const c = _rerollCostPt(); return G.ptn && G.ptn.id === 'yoru' ? Math.max(0, Math.round(c * (1 - .1 * G.ptn.t.ps))) : c; };
const _activateRoomPt = activateRoom; activateRoom = function (r) { G.roomLockAt = G.time; return _activateRoomPt(r); };
const _enterFloorPt = enterFloor; enterFloor = function (fi) { const r = _enterFloorPt(fi); const P = G.ptn; if (P) { P.act = null;
    if (P.id === 'yoru') G.freeReroll = true;
    ptnRevealRooms(); recomputeStats(); saveRun(); } return r; };
// kills while a buff lasts: Rin's order grows longer, Seye's cooldown shrinks, Ling's fire builds, Chishima's mod pays parts
const _killEnemyPt = killEnemy; killEnemy = function (e, o) { const P = G.ptn, A = P && P.act; if (A && e && !e.dead) {
    if (P.id === 'rin' && P.tier >= 2 && A.ext < 4) { A.dur += 1; A.ext += 1; }
    if (P.id === 'seye' && P.tier >= 3 && A.cdBack < 6) { P.cd = Math.max(0, P.cd - 1); A.cdBack += 1; }
    if (P.id === 'ling' && P.tier >= 3 && A.stk < 10) A.stk += 1;
    if (P.id === 'chishima' && P.tier >= 1) G.ink += 2; }
  return _killEnemyPt(e, o); };
// Miko's bond trait: once per run a killing blow leaves you on 1 health. Yuexun's: a hit during her buff gives 1s more invincibility
function ptnSaveLethalHit() { const p = G.p, P = G.ptn;
  if (!P || P.id !== 'miko' || P.tier < 2 || G.ptnSaved || !p || !p.alive || p.hp > 0 || G.state !== 'play' || G.mode === 'invade') return false;
  G.ptnSaved = true; p.hp = 1; p.inv = Math.max(p.inv, 2); AU.play('revive', 1.3); flash('#efb94a', .4, true); slowmo(.25, .6); ringFx(p.x, p.y, 40, '#efb94a', .5, 3); notify(L('ra_saved'), '#efb94a'); return true;
}
const _hurtPlayerPt = hurtPlayer; hurtPlayer = function (dmg, sx, sy, mechHit, pierce) { const p = G.p, P = G.ptn;
  const h0 = p ? p.hp + p.armor : 0, r = _hurtPlayerPt(dmg, sx, sy, mechHit, pierce);
  if (P && P.id === 'yuexun' && P.act && P.tier >= 3 && p && p.alive && p.hp + p.armor < h0) p.inv += 1;
  return r; };
// ---------------- the HUD: army support (Q) and the radio partner (F) as two blocks built like the skill chip's ----------------
// on a PC: a badge with the icon and two plates to its left (name, then status), stacked above the skill chip; both blocks can be
// moved and resized in Settings > HUD layout (TL_DEF.phud / shud). On a phone: two round pads, placed in the button layout editor.
Object.assign(STR, { tl_sup: ['SUPPORT', '軍事支援', '支援', '军事支援'], tl_ptn: ['PARTNER', '搭檔技能', '相棒', '搭档技能'], tl_phud: ['PARTNER SKILL', '搭檔技能', '相棒スキル', '搭档技能'],
  tl_shud: ['ARMY SUPPORT', '軍事支援', '軍事支援', '军事支援'], tl_titlePC: ['HUD LAYOUT', 'HUD 佈局', 'HUD配置', 'HUD 布局'], ra_ready: ['READY', '就緒', '準備完了', '就绪'] });
const ptnBtn = () => TB.ptn;
// o: c colour, name, draw(cx, cy, colour) the badge icon, st 'ready' | 'cd' | 'act', k progress (cooldown left or active left), secs, key, pips, ping
function aidBlock(ax, ay, sc, o) {
  ctx.save(); ctx.translate(Math.round(ax), Math.round(ay)); ctx.scale(sc, sc); const c = o.c, t = G ? G.time : 0, R = 13, ready = o.st === 'ready';
  hudPlate(-110, -13, 92, 11, col(2)); rect(-104, -13, 22, 1, c);
  text(fitText(o.name, 70), -100, -10, c, 1);
  if (o.pips !== undefined) for (let i = 0; i < 3; i++) rect(-24 - (2 - i) * 4, -9, 3, 3, i < o.pips ? c : col(1));
  hudPlate(-102, 1, 84, 11, col(1));
  if (o.st === 'act') { rect(-92, 6, 64, 2, col(2)); rect(-92, 6, Math.round(64 * o.k), 2, c); }
  else if (o.st === 'cd') { rect(-92, 6, 64, 2, col(2)); rect(-92, 6, Math.round(64 * (1 - o.k)), 2, col(4)); text(Math.ceil(o.secs) + 'S', -24, 4, col(4), 1, 'right'); }
  else { const on = ((t * 3) | 0) % 2; if (!TOUCH.on) keyCap(o.key, -94, 2); text(L('ra_ready'), -80, 4, on ? c : col(5), 1); }
  // the badge: a diamond (the skill chip's is a hexagon)
  const dia = r => [[0, -r], [r, 0], [0, r], [-r, 0]];
  poly(dia(R + 1), col(0), ready ? (((t * 3) | 0) % 2 ? c : col(4)) : col(3));
  if (o.st === 'act') { ctx.globalAlpha = .25 + Math.sin(t * 10) * .1; poly(dia(R - 2), c); ctx.globalAlpha = 1; }
  o.draw(0, 0, o.st === 'cd' ? col(3) : o.st === 'act' ? col(5) : c);
  if (o.st === 'cd') { ctx.save(); ctx.beginPath(); dia(R - 1).forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip(); ctx.globalAlpha = .6; rect(-R, -R, R * 2, Math.round(R * 2 * o.k), '#000'); ctx.globalAlpha = 1; ctx.restore(); }
  if (o.st === 'act') { const N = 12; for (let i = 0; i < N; i++) { const a = -Math.PI / 2 + i / N * 6.283; rect(Math.cos(a) * (R + 4) - .5, Math.sin(a) * (R + 4) - .5, 2, 2, i < Math.ceil(N * o.k) ? c : col(1)); } }
  if (o.ping > 0) { const k = 1 - o.ping / .7; ctx.globalAlpha = 1 - k; poly(dia(R + 2 + k * 12), null, c); ctx.globalAlpha = 1; }
  ctx.restore(); }
function supBlockData(k) { const act = !!G.sup, S = G.sup, f = !act ? 0 : S.k === 'heli' ? clamp(1 - S.t / 30, 0, 1) : S.k === 'gun' ? 1 - (S.round || 0) / 3 : clamp((S.hp || 0) / 25, 0, 1);
  return { c: '#8fa77e', name: supName(k), st: act ? 'act' : 'ready', k: f, key: 'Q', draw: (x, y, c) => supIcon(k, x - 5, y - 5, c) }; }
function ptnBlockData(P) { const sk = PSK[P.id], A = P.act;
  return { c: ptnCol(P.id), name: svName(P.id) + ' · ' + tr(sk.n), st: A ? 'act' : P.cd > 0 ? 'cd' : 'ready', k: A ? 1 - A.t / A.dur : P.cd / ptCdMax(P.id), secs: P.cd, key: 'F', pips: P.tier, ping: P.readyT, draw: (x, y, c) => icon(sk.ic, x - 8, y - 8, c, 2) }; }
// the editor's preview of a block
function tlBlockDemo(id, q) { aidBlock(q.x, q.y, q.s, id === 'phud' ? { c: '#5ed0c8', name: tr(N4('PARTNER · SKILL', '搭檔 · 技能', '相棒・スキル', '搭档 · 技能')), st: 'ready', k: 0, key: 'F', pips: 2, draw: (x, y, c) => icon('pk_order', x - 8, y - 8, c, 2) }
  : { c: '#8fa77e', name: L('tl_shud'), st: 'ready', k: 0, key: 'Q', draw: (x, y, c) => supIcon('heli', x - 5, y - 5, c) }); }
// a round pad for the phone, in the style of the skill pad: the icon, a dotted ring for the cooldown or the time left
function aidPad(b, o, pressed2) { tPad(b, o.st === 'cd' ? col(3) : o.c, pressed2 || o.st === 'act'); o.draw(b.x, b.y, o.st === 'cd' ? '#5a5a62' : o.st === 'act' ? col(5) : o.c);
  if (o.st === 'cd') tDots(b.x, b.y, b.r + 3, 20, col(4), 1 - o.k); else if (o.st === 'act') tDots(b.x, b.y, b.r + 3, 20, o.c, o.k); }
drawSupportHUD = function () {
  const k = G.sup ? G.sup.k : G.support, P = G.ptn;
  if (k) { const o = supBlockData(k); if (TOUCH.on) aidPad(TB.sup, Object.assign({}, o, { draw: (x, y, c) => supIcon(k, x - 5, y - 5, c) }), TOUCH.press.sup > 0); else { const q = tlGet('shud'); aidBlock(q.x, q.y, q.s, o); } }
  if (P) { const o = ptnBlockData(P), sk = PSK[P.id], c = o.c;
    if (TOUCH.on) aidPad(TB.ptn, Object.assign({}, o, { draw: (x, y, cc) => icon(sk.ic, x - 4, y - 4, cc) }), TOUCH.press.ptn > 0); else { const q = tlGet('phud'); aidBlock(q.x, q.y, q.s, o); }
    // her face slides in at the right edge when she answers the call
    if (P.cut) { const t = P.cut.t, e = t < .25 ? easeOut(t / .25) : t > .85 ? 1 - (t - .85) / .25 : 1, w = 132, h = 40, x = W - w * e, yy = 60;
      ctx.save(); ctx.beginPath(); ctx.rect(x, yy, w, h); ctx.clip(); rect(x, yy, w, h, 'rgba(10,9,8,.9)'); drawPortraitAt(P.id, x + 56, yy - 4, 130, 1); ctx.restore();
      box(x, yy, w, h, null, '#2d2925'); rect(x, yy, 30, 1, c); rect(x, yy + 1, 10, 1, thA(c, .4));
      textS(svName(P.id), x + 8, yy + 6, c, 1.5); icon(sk.ic, x + 8, yy + 25, c); text(tr(sk.n), x + 19, yy + 25 - (isCJK(tr(sk.n)) ? 1 : 0), '#e6dfd1'); } }
};
// ---------------- between runs: who is brought along on the sortie column, a badge on her strip, the skill page ----------------
const _tbItemsPt = tbItems; tbItems = function () { const items = _tbItemsPt(), it = items[0], rows = it.rows;
  it.rows = () => { const can = SURV_IDS.some(ptCanCarry), id = radioId();
    return [...rows(), { head: true, l: () => L('ra_row') }, can ? { l: () => id ? svName(id) : L('ra_none'), v: () => id ? tr(PSK[id].n) : '', dot: id ? SURV[id].c : null, act: () => cycleRadio(1), adj: d => cycleRadio(d) } : { l: () => L('ra_lockRow'), off: true, info: true }]; };
  return items; };
HOWTO_KEYS.splice(7, 0, ['F', 'h_partner']);
const _updateTaskbarPt = updateTaskbar; updateTaskbar = function (rdt) { if (!PT_REFUND_OK) { PT_REFUND_OK = true; ptRefund(); } if (PT_REFUND_N) { NET.toast = { txt: L('ra_refund', PT_REFUND_N), c: TH.gold, t: 0 }; PT_REFUND_N = 0; } return _updateTaskbarPt(rdt); };
const _drawPartnersPt = drawPartners; drawPartners = function (t) { _drawPartnersPt(t); if (TBAR.k < .95) return; const id = radioId(); if (!id) return; const o = ptnLayout().find(q => q.id === id); if (!o) return;
  const s = L('ra_badge'), w = textW(s) + 10, x = o.x + o.w - w - 4; rect(x, 6, w, 12, 'rgba(6,6,8,.9)'); box(x, 6, w, 12, null, SURV[id].c); text(s, x + 5, 8 - (isCJK(s) ? 1 : 0), SURV[id].c); };
// the skill page (the old training tab): her skill, passive, bond traits by affection, the three-branch tree, and bringing her along
drawGirlTrain = function (id, d, I, c, x, y, w) {
  const sk = PSK[id], tree = ptTree(id), tier = ptTier(id), lh = lineH(), on = radioId() === id; let yy = y + 2;
  rect(x, yy, 22, 22, '#0a0908'); box(x, yy, 22, 22, null, c); icon(sk.ic, x + 3, yy + 3, c, 2);
  textS(tr(sk.n), x + 28, yy + 1, '#e6dfd1', 1.5); text(L('ra_cd', +ptCdMax(id).toFixed(1)) + (on ? '   ' + L('ra_is') : ''), x + 28, yy + 15 - 1, on ? TH.gold : '#8e877b'); yy += 27;
  wrapW(tr(sk.d(1 + .12 * tree.pw)), w).slice(0, 3).forEach(l => { text(l, x, yy, '#c9c1b2'); yy += lh; }); yy += 3;
  text(L('ra_passive'), x, yy, c); const pl = wrapW(tr(sk.pd(1 + .25 * tree.ps)), w - 34); pl.slice(0, 2).forEach((l, i) => text(l, x + 34, yy + i * lh, '#c9c1b2')); yy += Math.max(1, Math.min(2, pl.length)) * lh + 4;
  text(L('ra_traits'), x, yy, '#8e877b'); yy += lh;
  sk.tr.forEach((tx, i) => { const got = tier > i, need = [30, 60, 100][i]; rect(x, yy + 2, 3, 3, got ? c : '#3a3631'); text(String(need), x + 6, yy, got ? c : '#57524a');
    const ls = wrapW(tr(tx), w - 26); ls.slice(0, 2).forEach((l, j) => text(l, x + 24, yy + j * lh, got ? '#e6dfd1' : '#6e675c')); yy += Math.min(2, ls.length) * lh + 2; });
  yy += 3; text(L('ra_tree'), x, yy, '#8e877b'); yy += lh + 1;
  for (const [k, lb, ds] of [['cd', 'ra_tCd', 'ra_tCdD'], ['pw', 'ra_tPw', id === 'miko' ? null : 'ra_tPwD'], ['ps', 'ra_tPs', 'ra_tPsD']]) { const lv = tree[k];
    text(L(lb), x, yy + 2 - (isCJK(L(lb)) ? 1 : 0), '#c9c1b2'); for (let i = 0; i < 3; i++) rect(x + 56 + i * 7, yy + 3, 5, 5, i < lv ? c : '#27231f');
    text(fitText(ds ? L(ds) : tr(sk.pwd), w - 120), x + 82, yy + 2 - 1, '#6e675c');
    if (lv >= 3) text(L('g_max'), x + w, yy + 2, '#8e877b', 1, 'right');
    else { const cost = PT_COST[lv], b = gBtn(x + w - 26, yy, 26, 12, String(cost), TH.gold, () => { if (buy(cost)) { tree[k] = lv + 1; gpSave(); AU.play('chipGet', 1.2, .5); } }); drawProof(b.x + 3, b.y + 3); }
    yy += 15; }
  const by = Math.min(yy + 2, H - 40);
  if (ptCanCarry(id)) gBtn(x, by, w, 15, L(on ? 'ra_unset' : 'ra_set'), c, () => setRadio(on ? null : id));
  else wrapW(L('ra_lock'), w).slice(0, 2).forEach((l, i) => text(l, x, by + 2 + i * lh, '#6e675c'));
};
