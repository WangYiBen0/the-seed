// ===== ACHROMA combat: stats, shards (universal upgrades), synergies, control resistance, hit pipeline =====
'use strict';
function baseStats() {
  return { dmg: 1, rate: 1, size: 1, extra: 0, crit: .05, critMul: 2, burn: 0, shock: 0, frost: 0, bounce: 0, pierce: 0, split: 0, boom: 0, echo: 0,
    vamp: 0, home: 0, knock: 1, dashNova: 0, orbit: 0, speed: 1, dashCd: 1, maxHp: 0, armor: 0, armorRegen: 1,
    venom: 0, spite: 0, moment: 0, guill: 0, fury: 0, big: 0, vortex: 0, drone: 0, luck: 0, focus: 0, phoenix: 0, stat: 0,
    reload: 1, mag: 1, lastround: 0, primed: 0, rnova: 0, tactical: 0, bottomless: 0,
    frag: 0, close: 0, lead: 0, bspd: 1, mark: 0, sear: 0, soul: 0, ovclk: 0, veil: 0, refit: 0, lone: 0, greed: 0, allin: 0, pristine: 0, breakw: 0, trail: 0, farshot: 0, expose: 0, volley: 0, hotb: 0, weave: 0 };
}
const RAR = [{ k: 'rar0', c: () => col(5), w: 60 }, { k: 'rar1', c: () => C.cyan, w: 28 }, { k: 'rar2', c: () => C.violet, w: 12 }, { k: 'rar3', c: () => C.gold, w: 4 }];
const TAGS = { ELEMENT: ['ELEMENT', '元素', '属性'], CRIT: ['CRIT', '暴擊', '会心'], FORM: ['FORM', '形態', '形態'], POWER: ['POWER', '力量', 'パワー'], KILL: ['ON KILL', '擊殺', '撃破時'],
  DASH: ['DASH', '衝刺', 'ダッシュ'], AMMO: ['AMMO', '彈藥', '弾薬'], ALLY: ['ALLY', '夥伴', '味方'], SURVIVE: ['SURVIVE', '生存', '生存'], MOVE: ['MOVE', '移動', '移動'], CURSE: ['SIDE EFFECT', '副作用', '副作用', '副作用'], HUNT: ['HUNT', '狩獵', '狩り'], LOOT: ['LOOT', '收穫', '収穫'] };
const tagName = t => SET.lang === 'zhs' ? toSimp(TAGS[t][1]) : TAGS[t][{ en: 0, zh: 1, ja: 2 }[SET.lang] || 0];
const N3 = (en, zh, ja) => ({ en, zh, ja }); const N4 = (en, zh, ja, zhs) => ({ en, zh, ja, zhs });
const FORK_DAMAGE = [0, .4, .55, .7];
const SHARDS = [
  { id: 'ember', n: N4('PYROGEN', '致熱原', '発熱原', '致热原'), rar: 1, max: 3, c: C.red, icon: 'flame', tag: 'ELEMENT', d: l => N3(`HITS IGNITE FOES. BURN STACKS UP TO ${3 + l * 2}.${l >= 2 ? ' BURNING KILLS SPREAD FIRE.' : ''}`, `命中使敵人燃燒，最多疊加 ${3 + l * 2} 層。${l >= 2 ? '燃燒中的敵人死亡時擴散火焰。' : ''}`, `攻撃で敵を炎上させる。最大${3 + l * 2}スタック。${l >= 2 ? '炎上中の敵を倒すと延焼する。' : ''}`), a: (S, l) => S.burn = l },
  { id: 'arc', n: N4('NEURO-CONDUCTOR', '神經導電劑', '神経導電剤', '神经导电剂'), rar: 1, max: 3, c: C.cyan, icon: 'bolt', tag: 'ELEMENT', d: l => N3(`HITS MAY CHAIN LIGHTNING TO ${1 + l} NEARBY FOES.`, `命中時有機率向 ${1 + l} 個鄰近敵人釋放連鎖閃電。`, `攻撃時、近くの敵${1 + l}体へ連鎖電撃が走ることがある。`), a: (S, l) => S.shock = l },
  { id: 'rime', n: N4('CRYOGEN', '低溫凝劑', '低温凝固剤', '低温凝剂'), rar: 0, max: 3, c: C.frost, icon: 'flake', tag: 'ELEMENT', d: l => N3(`HITS CHILL AND SLOW. 3 CHILLS FREEZE FOR ${(0.6 + l * .3).toFixed(1)}S.`, `命中造成寒冷減速，累積 3 層凍結 ${(0.6 + l * .3).toFixed(1)} 秒。`, `攻撃で冷気を与え減速。3回で${(0.6 + l * .3).toFixed(1)}秒凍結。`), a: (S, l) => S.frost = l },
  { id: 'venom', n: N4('NECROTOXIN', '壞死毒素', '壊死毒素', '坏死毒素'), rar: 1, max: 3, c: C.lime, icon: 'drop', tag: 'ELEMENT', d: l => N3(`HITS POISON FOES. EACH STACK DEALS ${(1.5 + .8 * l).toFixed(1)}/S, UP TO 5 STACKS.`, `命中使敵人中毒，每層每秒 ${(1.5 + .8 * l).toFixed(1)} 傷害，最多 5 層。`, `攻撃で毒を付与。1スタック毎秒${(1.5 + .8 * l).toFixed(1)}ダメージ、最大5。`), a: (S, l) => S.venom = l },
  { id: 'keen', n: N4('OCULAR BOOST', '視覺增強劑', '視覚増強剤', '视觉增强剂'), rar: 0, max: 4, c: C.gold, icon: 'eye', tag: 'CRIT', d: l => N3(`+${12 * l}% CRIT CHANCE. CRITS DEAL X${[1.6, 1.9, 2.2, 2.5][l - 1].toFixed(1)}.`, `暴擊率 +${12 * l}%，暴擊造成 X${[1.6, 1.9, 2.2, 2.5][l - 1].toFixed(1)} 傷害。`, `会心率+${12 * l}%。会心ダメージX${[1.6, 1.9, 2.2, 2.5][l - 1].toFixed(1)}。`), a: (S, l) => { S.crit += .12 * l; S.critMul += [1.6, 1.9, 2.2, 2.5][l - 1] - 2; } },
  { id: 'fork', n: N4('MITOTIC AGENT', '有絲分裂劑', '有糸分裂剤', '有丝分裂剂'), rar: 2, max: 3, c: null, icon: 'fork', tag: 'FORM', d: l => N4(`+${l} COPY PER ATTACK AT ${Math.round(FORK_DAMAGE[l] * 100)}% DAMAGE. GUNS FAN, BLADES SWING AGAIN, BEAMS SPLIT.`, `每次攻擊 +${l} 份 ${Math.round(FORK_DAMAGE[l] * 100)}% 傷害複製：槍械散射、刀刃追斬、光束分裂。`, `攻撃毎に+${l}複製（威力${Math.round(FORK_DAMAGE[l] * 100)}%）。銃は扇状、刀は追撃、ビームは分裂。`, `每次攻击 +${l} 份 ${Math.round(FORK_DAMAGE[l] * 100)}% 伤害复制：枪械散射、刀刃追斩、光束分裂。`), a: (S, l) => S.extra = l },
  { id: 'echo', n: N4('MIRROR NEURONS', '鏡像神經元', '鏡像神経', '镜像神经元'), rar: 2, max: 2, c: C.violet, icon: 'echo', tag: 'FORM', d: l => N3(`EVERY ${[5, 3][l - 1]} ATTACKS REPEAT AS A GHOST ECHO.`, `每 ${[5, 3][l - 1]} 次攻擊會以幽影回響重現一次。`, `${[5, 3][l - 1]}回攻撃毎に幻影の残響が再現する。`), a: (S, l) => S.echo = l },
  { id: 'rico', n: N4('KINETIC RECOIL', '動能回彈劑', '運動反跳剤', '动能回弹剂'), rar: 0, max: 3, c: null, icon: 'rico', tag: 'FORM', d: l => N3(`SHOTS AND BEAMS BOUNCE +${l}. BLADES LAUNCH A BOUNCING CRESCENT EVERY ${6 - l} ATTACKS (COPIES DO NOT COUNT).`, `子彈與光束反彈 +${l} 次，刀刃每 ${6 - l} 次攻擊射出反彈月牙（複製不計次數）。`, `弾とビームが+${l}回跳ね返る。刀剣は${6 - l}回攻撃毎に跳ねる三日月を放つ（複製は数えない）。`), a: (S, l) => S.bounce = l },
  { id: 'needle', n: N4('OSTEO-PIERCE', '骨質穿透劑', '骨質穿通剤', '骨质穿透剂'), rar: 0, max: 3, c: null, icon: 'needle', tag: 'FORM', d: l => N3(`SHOTS PIERCE +${l}. +${l * 10}% DAMAGE.`, `子彈穿透 +${l}，傷害 +${l * 10}%。`, `弾が+${l}体貫通。ダメージ+${l * 10}%。`), a: (S, l) => { S.pierce = l; S.dmg *= 1 + .1 * l; } },
  { id: 'heavy', n: N4('MUSCLE AGENT', '增肌劑', '増筋剤', '增肌剂'), rar: 0, max: 5, c: null, icon: 'heavy', tag: 'POWER', d: l => N3(`+${l * 20}% DAMAGE, +${l * 15}% SIZE, MORE KNOCKBACK.`, `傷害 +${l * 20}%、體積 +${l * 15}%、擊退增強。`, `ダメージ+${l * 20}%、サイズ+${l * 15}%、ノックバック強化。`), a: (S, l) => { S.dmg *= 1 + .2 * l; S.size *= 1 + .15 * l; S.knock *= 1 + .3 * l; } },
  { id: 'frenzy', n: N4('ADRENAL SPIKE', '腎上腺激增', '副腎急増', '肾上腺激增'), rar: 0, max: 5, c: null, icon: 'frenzy', tag: 'POWER', d: l => N3(`+${l * 14}% ATTACK SPEED.`, `攻擊速度 +${l * 14}%。`, `攻撃速度+${l * 14}%。`), a: (S, l) => S.rate *= 1 + .14 * l },
  { id: 'overk', n: N4('STIMULANT X', '興奮劑 X', '興奮剤X', '兴奋剂 X'), rar: 2, max: 2, c: C.red, icon: 'frenzy', tag: 'POWER', d: l => N3(`+${l * 24}% ATTACK SPEED AND +${l * 10}% DAMAGE.`, `攻速 +${l * 24}%，傷害 +${l * 10}%。`, `攻撃速度+${l * 24}%、ダメージ+${l * 10}%。`), a: (S, l) => { S.rate *= 1 + .24 * l; S.dmg *= 1 + .1 * l; } },
  { id: 'moment', n: N4('MOTOR AGENT', '運動激活劑', '運動賦活剤', '运动激活剂'), rar: 0, max: 3, c: null, icon: 'swift', tag: 'POWER', d: l => N3(`+${l * 10}% DAMAGE WHILE MOVING.`, `移動時傷害 +${l * 10}%。`, `移動中ダメージ+${l * 10}%。`), a: (S, l) => S.moment = l },
  { id: 'fury', n: N4('RAGE HORMONE', '狂怒激素', '激昂ホルモン', '狂怒激素'), rar: 1, max: 3, c: C.orange, icon: 'fire2', tag: 'KILL', d: l => N3(`KILLS GRANT +${1 + 2 * l}% ATTACK SPEED FOR 3S, STACKING 10X.`, `擊殺後 3 秒內攻速 +${1 + 2 * l}%，最多疊加 10 次。`, `撃破毎に3秒間攻撃速度+${1 + 2 * l}%（最大10）。`), a: (S, l) => S.fury = l },
  { id: 'bloom', n: N4('NECROTIC BURST', '壞死爆裂菌', '壊死破裂菌', '坏死爆裂菌'), rar: 1, max: 3, c: C.orange, icon: 'boom', tag: 'KILL', d: l => N3(`KILLS DETONATE FOR ${[26, 38, 49][l - 1]}% OF THE FOE'S MAX HP +3.`, `擊殺時引爆，造成敵人最大生命 ${[26, 38, 49][l - 1]}%＋3 的傷害。`, `撃破時、敵の最大HPの${[26, 38, 49][l - 1]}%＋3で爆発する。`), a: (S, l) => S.boom = l },
  { id: 'shrap', n: N4('BONE SPURS', '骨刺增生', '骨棘増殖', '骨刺增生'), rar: 1, max: 3, c: null, icon: 'shrap', tag: 'KILL', d: l => N3(`KILLS BURST INTO ${2 + l * 2} SEEKING FRAGMENTS.`, `擊殺時迸發 ${2 + l * 2} 枚追蹤碎片。`, `撃破時、追尾する破片を${2 + l * 2}個放つ。`), a: (S, l) => S.split = l },
  { id: 'leech', n: N4('HEMOPHAGE', '噬血酶', '吸血酵素', '噬血酶'), rar: 1, max: 2, c: C.green, icon: 'heart', tag: 'KILL', d: l => N3(`KILLS HAVE ${l * 6}% CHANCE TO DROP A HEART.`, `擊殺有 ${l * 6}% 機率掉落心臟。`, `撃破時${l * 6}%でハートを落とす。`), a: (S, l) => S.vamp = l },
  { id: 'guill', n: N4('EUTHANASIA', '安樂死劑', '安楽死剤', '安乐死剂'), rar: 2, max: 3, c: C.red, icon: 'axe', tag: 'HUNT', d: l => N3(`EXECUTE FOES BELOW ${8 + 4 * l}% HP. +${15 * l}% DAMAGE TO BOSSES BELOW 30%.`, `處決生命低於 ${8 + 4 * l}% 的敵人。對 30% 以下的頭目傷害 +${15 * l}%。`, `HP${8 + 4 * l}%未満の敵を処刑。HP30%未満のボスへ+${15 * l}%。`), a: (S, l) => S.guill = l },
  { id: 'big', n: N4('TROPHY INSTINCT', '獵殺本能', '狩猟本能', '猎杀本能'), rar: 0, max: 3, c: null, icon: 'crown', tag: 'HUNT', d: l => N3(`+${20 * l}% DAMAGE TO ELITES AND BOSSES.`, `對精英與頭目傷害 +${20 * l}%。`, `エリートとボスへのダメージ+${20 * l}%。`), a: (S, l) => S.big = l },
  { id: 'focus', n: N4('TUNNEL VISION', '管狀視野', '視野狭窄', '管状视野'), rar: 0, max: 2, c: null, icon: 'eye', tag: 'HUNT', d: l => N3(`THE FIRST HIT ON AN UNHURT FOE DEALS X${1.5 + .5 * l}.`, `對滿血敵人的第一擊造成 X${1.5 + .5 * l} 傷害。`, `無傷の敵への初撃がX${1.5 + .5 * l}。`), a: (S, l) => S.focus = l },
  { id: 'seeker', n: N4('TRACKER', '追蹤費洛蒙', '追跡フェロモン', '追踪费洛蒙'), rar: 0, max: 3, c: null, icon: 'seek', tag: 'FORM', d: l => N3(`SHOTS CURVE TO FOES. BEAMS AND BLADES AUTO-AIM.`, `子彈轉向敵人，光束與刀刃自動瞄準。`, `弾が敵へ曲がる。ビームと刀剣は自動照準。`), a: (S, l) => S.home = l },
  { id: 'vortex', n: N4('VORTEX SPORES', '渦旋孢子', '渦巻胞子', '涡旋孢子'), rar: 1, max: 3, c: C.indigo, icon: 'spiral', tag: 'ELEMENT', d: l => N3(`HITS MAY OPEN A VORTEX THAT PULLS AND GRINDS FOES.`, `命中時有機率開啟渦流，吸引並絞碎敵人。`, `攻撃時、敵を引き寄せ削る渦が生じることがある。`), a: (S, l) => S.vortex = l },
  { id: 'stat', n: N4('BIOELECTRIC GLAND', '生物電腺體', '生体電気腺', '生物电腺体'), rar: 1, max: 3, c: C.cyan, icon: 'bolt', tag: 'ALLY', d: l => N3(`EVERY ${(2.4 - .4 * l).toFixed(1)}S, ZAP ${1 + l} NEARBY FOES.`, `每 ${(2.4 - .4 * l).toFixed(1)} 秒電擊 ${1 + l} 個附近敵人。`, `${(2.4 - .4 * l).toFixed(1)}秒毎に近くの敵${1 + l}体を電撃。`), a: (S, l) => S.stat = l },
  { id: 'drone', n: N4('DRONE LINK', '無人機鏈接', 'ドローンリンク', '无人机链接'), rar: 1, max: 3, c: null, icon: 'drone', tag: 'ALLY', d: l => N3(`${l} DRONE${l > 1 ? 'S' : ''} FIRE AT FOES, CARRYING YOUR ON-HIT EFFECTS.`, `${l} 架無人機向敵人開火，附帶你的命中效果。`, `ドローン${l}機が敵を撃つ。命中効果も乗る。`), a: (S, l) => S.drone = l },
  { id: 'sat', n: N4('SATELLITE CYST', '衛星囊腫', '衛星嚢胞', '卫星囊肿'), rar: 1, max: 4, c: null, icon: 'orbit', tag: 'ALLY', d: l => N3(`${l} CUBE${l > 1 ? 'S' : ''} ORBIT YOU, HITTING FOES AND EATING BULLETS.`, `${l} 個方塊環繞你，撞擊敵人並吞噬子彈。`, `${l}個のキューブが周回し、敵を叩き弾を消す。`), a: (S, l) => S.orbit = l },
  { id: 'after', n: N4('NEURAL AFTERIMAGE', '神經殘像', '神経残像', '神经残像'), rar: 1, max: 3, c: C.violet, icon: 'dash', tag: 'DASH', d: l => N3(`DASHING RELEASES A NOVA CARRYING ALL ON-HIT EFFECTS. -${l * 10}% DASH COOLDOWN.`, `衝刺釋放衝擊波，附帶所有命中效果。衝刺冷卻 -${l * 10}%。`, `ダッシュ時に全命中効果を持つ衝撃波。ダッシュCT-${l * 10}%。`), a: (S, l) => { S.dashNova = l; S.dashCd *= 1 - .1 * l; } },
  { id: 'swift', n: N4('FAST-TWITCH FIBER', '快肌纖維', '速筋線維', '快肌纤维'), rar: 0, max: 3, c: null, icon: 'swift', tag: 'MOVE', d: l => N3(`+${l * 12}% MOVE SPEED. -${l * 12}% DASH COOLDOWN.`, `移速 +${l * 12}%，衝刺冷卻 -${l * 12}%。`, `移動速度+${l * 12}%、ダッシュCT-${l * 12}%。`), a: (S, l) => { S.speed *= 1 + .12 * l; S.dashCd *= 1 - .12 * l; } },
  { id: 'spite', n: N4('PAIN RESPONSE', '痛覺反擊', '痛覚反撃', '痛觉反击'), rar: 0, max: 3, c: C.red, icon: 'shrap', tag: 'SURVIVE', d: l => N3(`WHEN HURT, RELEASE ${4 + 4 * l} SEEKING FRAGMENTS.`, `受傷時釋放 ${4 + 4 * l} 枚追蹤碎片。`, `被弾時、追尾する破片を${4 + 4 * l}個放つ。`), a: (S, l) => S.spite = l },
  { id: 'vital', n: N4('HEMOGLOBIN', '血紅蛋白', 'ヘモグロビン', '血红蛋白'), rar: 0, max: 3, c: C.green, icon: 'heart', tag: 'SURVIVE', d: l => N3(`+2 MAX HP. HEAL 2.`, `最大生命 +2，回復 2。`, `最大HP+2、2回復。`), a: (S, l) => S.maxHp += 2 * l, once: p => { healPlayer(2); } },
  { id: 'plate', n: N4('KERATIN PLATING', '角質化甲', '角質装甲', '角质化甲'), rar: 0, max: 3, c: null, icon: 'shield', tag: 'SURVIVE', d: l => N3(`+1 ARMOR. ARMOR REGENERATES ${l * 25}% FASTER.`, `護甲 +1，護甲恢復速度 +${l * 25}%。`, `アーマー+1。アーマー回復速度+${l * 25}%。`), a: (S, l) => { S.armor = l; S.armorRegen = 1 + .25 * l; } },
  { id: 'quick', n: N4('REFLEX ACCELERANT', '反射加速劑', '反射加速剤', '反射加速剂'), rar: 0, max: 3, c: C.cyan, icon: 'clock', tag: 'AMMO', d: l => N3(`-${Math.round((1 - Math.pow(.78, l)) * 100)}% RELOAD TIME.`, `裝填時間 -${Math.round((1 - Math.pow(.78, l)) * 100)}%。`, `リロード時間-${Math.round((1 - Math.pow(.78, l)) * 100)}%。`), a: (S, l) => S.reload *= Math.pow(.78, l) },
  { id: 'extmag', n: N4('HOARDING INSTINCT', '囤積本能', '溜め込み本能', '囤积本能'), rar: 0, max: 3, c: null, icon: 'mag', tag: 'AMMO', d: l => N3(`+${l * 35}% MAGAZINE SIZE.`, `彈匣容量 +${l * 35}%。`, `装弾数+${l * 35}%。`), a: (S, l) => S.mag *= 1 + .35 * l },
  { id: 'lastround', n: N4('DESPERATION', '絕望反應', '絶望反応', '绝望反应'), rar: 1, max: 3, c: C.gold, icon: 'round', tag: 'AMMO', d: l => N3(`THE LAST ATTACK IN A MAGAZINE DEALS X${(1.8 + .5 * l).toFixed(1)}.`, `彈匣中最後一擊造成 X${(1.8 + .5 * l).toFixed(1)} 傷害。`, `弾倉最後の一撃がX${(1.8 + .5 * l).toFixed(1)}。`), a: (S, l) => S.lastround = l },
  { id: 'primed', n: N4('PRIMING', '神經預激', '神経予備', '神经预激'), rar: 1, max: 3, c: C.orange, icon: 'round', tag: 'AMMO', d: l => N3(`AFTER A RELOAD, THE NEXT ${2 + 2 * l} ATTACKS DEAL +40%.`, `裝填完成後，接下來 ${2 + 2 * l} 次攻擊傷害 +40%。`, `リロード後、次の${2 + 2 * l}回の攻撃が+40%。`), a: (S, l) => S.primed = l },
  { id: 'rnova', n: N4('SPORE RELEASE', '孢子釋放', '胞子放出', '孢子释放'), rar: 1, max: 3, c: C.pink, icon: 'prism', tag: 'AMMO', d: l => N3(`FINISHING A RELOAD RELEASES THE ABSORBED COLOR AS A SHOCKWAVE.`, `完成裝填時，將吸收的色彩化為衝擊波釋放。`, `リロード完了時、吸収した色を衝撃波として放つ。`), a: (S, l) => S.rnova = l },
  { id: 'tactical', n: N4('ROLL REFLEX', '翻滾反射', '回避反射', '翻滚反射'), rar: 0, max: 3, c: null, icon: 'dash', tag: 'AMMO', d: l => N3(`DASHING RESTORES ${20 * l}% OF YOUR MAGAZINE.`, `衝刺時回復 ${20 * l}% 彈匣。`, `ダッシュで弾倉の${20 * l}%を回復。`), a: (S, l) => S.tactical = l },
  { id: 'bottomless', n: N4('SCAVENGER INSTINCT', '拾荒本能', '拾い集め本能', '拾荒本能'), rar: 3, max: 1, c: C.gold, icon: 'mag', tag: 'AMMO', d: l => N3(`30% CHANCE FOR AN ATTACK TO COST NO AMMO.`, `攻擊有 30% 機率不消耗彈藥。`, `30%の確率で弾を消費しない。`), a: (S, l) => S.bottomless = l },
  { id: 'glass', n: N4('CARDIAC OVERDRIVE', '心肌超載', '心筋過負荷', '心肌超载'), rar: 3, max: 1, c: C.gold, icon: 'glass', tag: 'CURSE', d: l => N3(`+60% DAMAGE. -2 MAX HP. NO TURNING BACK.`, `傷害 +60%，最大生命 -2。沒有回頭路。`, `ダメージ+60%、最大HP-2。後戻りはできない。`), a: (S, l) => { S.dmg *= 1.6; S.maxHp -= 2; } },
  { id: 'prism', n: N4('COCKTAIL THERAPY', '雞尾酒療法', 'カクテル療法', '鸡尾酒疗法'), rar: 3, max: 1, c: C.pink, icon: 'prism', tag: 'ELEMENT', d: l => N3(`+1 LEVEL TO PYROGEN, NEURO-CONDUCTOR, CRYOGEN AND NECROTOXIN. ALL OF IT, AT ONCE.`, `致熱原、神經導電劑、低溫凝劑、壞死毒素各 +1 級。一次全部打進去。`, `発熱原・神經導電劑・霜・壊死毒素を各+1。色が溢れ出す。`), a: (S, l) => { S.burn++; S.shock++; S.frost++; S.venom++; } },
  { id: 'phoenix', n: N4('LAZARUS', '拉撒路劑', 'ラザロ剤', '拉撒路剂'), rar: 3, max: 1, c: C.orange, icon: 'flame', tag: 'SURVIVE', d: l => N3(`ONCE PER RUN, RISE AGAIN WITH FULL HP.`, `每局一次，死亡時滿血復活。`, `1ランに1度、HP全快で蘇る。`), a: (S, l) => S.phoenix = l },
];
const SHARD = Object.fromEntries(SHARDS.map(s => [s.id, s]));
const SYNERGIES = [
  { id: 'plasma', n: N4('IONIZED BLOOD', '電離血液', '電離血液', '电离血液'), need: ['ember', 'arc'], c: C.pink, d: N3('LIGHTNING DETONATES BURNING FOES', '閃電會引爆燃燒中的敵人', '電撃が炎上中の敵を爆破する') },
  { id: 'shatter', n: N4('BRITTLE BONE', '脆骨症', '脆骨症', '脆骨症'), need: ['rime', 'keen'], c: C.frost, d: N3('CRITS ON FROZEN FOES DEAL 225% AND SHATTER', '對凍結敵人的暴擊造成 225% 並碎裂', '凍結中の敵への会心が225%で粉砕') },
  { id: 'choir', n: N4('DOUBLE NERVOUS SYSTEM', '雙重神經', '二重神経', '双重神经'), need: ['echo', 'fork'], c: C.violet, d: N4('ECHOES STRIKE AT FULL STRENGTH', '回響以全力攻擊', 'エコーが全力で攻撃する', '回响以全力攻击') },
  { id: 'chain', n: N4('CASCADE NECROSIS', '連鎖壞死', '連鎖壊死', '连锁坏死'), need: ['bloom', 'shrap'], c: C.orange, d: N4('BONE SPUR SHARDS EXPLODE', '骨刺碎片會爆炸', '骨棘の破片が爆発する', '骨刺碎片会爆炸') },
  { id: 'mirror', n: N4('MIRRORED CORTEX', '鏡像腦', '鏡像脳', '镜像脑'), need: ['rico', 'seeker'], c: C.cyan, d: N3('EACH BOUNCE ADDS +40% DAMAGE; RICOCHET DAMAGE IS SCALED TO 75% ONCE, SHARED WITH TUMOR GROWTH', '每次反彈傷害 +40%；反彈傷害統一以 75% 結算，與腫瘤增生共用一次衰減', '反射毎にダメージ+40%。反射ダメージは75%に調整（腫瘍増殖と共通、1回のみ）') },
  { id: 'wild', n: N4('SPONTANEOUS COMBUSTION', '自燃體質', '自然発火体質', '自燃体质'), need: ['ember', 'bloom'], c: C.red, d: N3('DETONATIONS IGNITE EVERYTHING', '爆炸會點燃一切', '爆発が全てを燃やす') },
  { id: 'storm', n: N4('CHARGED CYST', '帶電囊腫', '帯電嚢胞', '带电囊肿'), need: ['arc', 'sat'], c: C.cyan, d: N4('THE SATELLITE CYST ALWAYS TRIGGERS CHAIN LIGHTNING', '衛星囊腫必定觸發連鎖閃電', '衛星嚢胞が必ず連鎖電撃を起こす', '卫星囊肿必定触发连锁闪电') },
  { id: 'phantom', n: N4('DOPPELGANGER', '分身症', 'ドッペルゲンガー', '分身症'), need: ['after', 'echo'], c: C.violet, d: N4('DASHING TRIGGERS A FREE ECHO ATTACK', '衝刺觸發一次免費的回響攻擊', 'ダッシュで無料のエコー攻撃が出る', '冲刺触发一次免费的回响攻击') },
  { id: 'caustic', n: N4('SEPSIS', '敗血症', '敗血症', '败血症'), need: ['venom', 'ember'], c: C.lime, d: N3('POISON AND BURN DEAL DOUBLE TO FOES WITH BOTH', '同時中毒與燃燒的敵人受雙倍持續傷害', '毒と炎上が重なると継続ダメージ2倍') },
  { id: 'plague', n: N4('CONTAGION', '傳染', '伝染', '传染'), need: ['venom', 'shrap'], c: C.lime, d: N3('POISONED FOES SPREAD THEIR POISON ON DEATH', '中毒的敵人死亡時散播毒素', '毒状態の敵が倒れると毒をばら撒く') },
  { id: 'singular', n: N4('IMPLOSION', '內爆', '内破', '内爆'), need: ['vortex', 'bloom'], c: C.indigo, d: N3('VORTICES COLLAPSE INTO AN EXPLOSION', '渦旋孢子消散時坍縮爆炸', '渦が崩壊して爆発する') },
  { id: 'swarm', n: N4('HIVE MIND', '蜂巢意識', '群体意識', '蜂巢意识'), need: ['drone', 'fork'], c: col(5), d: N4('DRONES FIRE TWIN SHOTS', '無人機發射雙發子彈', 'ドローンが二連射する', '无人机发射双发子弹') },
  { id: 'berserk', n: N4('AMOK', '狂暴症', '狂暴症', '狂暴症'), need: ['fury', 'frenzy'], c: C.orange, d: N3('RAGE HORMONE STACKS UP TO 20', '狂怒激素最多可疊加 20 層', '激昂ホルモンが最大20スタック') },
  { id: 'execu', n: N4('EXECUTIONER', '處刑本能', '処刑本能', '处刑本能'), need: ['guill', 'keen'], c: C.gold, d: N3('EXECUTIONS RELEASE A SHOCKWAVE. THRESHOLD +10%', '處決釋放衝擊波，處決門檻 +10%', '処刑で衝撃波。処刑ライン+10%') },
  { id: 'retrib', n: N4('AUTOIMMUNITY', '免疫反擊', '免疫反撃', '免疫反击'), need: ['spite', 'plate'], c: C.red, d: N3('LOSING ARMOR ALSO TRIGGERS PAIN RESPONSE AND A BLAST', '失去護甲也會觸發痛覺反擊與爆炸', 'アーマー損失でも痛覚反撃と爆発が発動') },
  { id: 'tesla', n: N4('LIVING DYNAMO', '活體發電', '生体発電', '活体发电'), need: ['stat', 'arc'], c: C.cyan, d: N3('BIOELECTRIC GLAND ZAPS TWICE AS OFTEN AND CHAINS', '生物電腺體頻率加倍並會連鎖', '生体電気腺の頻度2倍、さらに連鎖') },
  { id: 'flash', n: N4('SPORE IGNITION', '孢子燃爆', '胞子発火', '孢子燃爆'), need: ['rnova', 'bloom'], c: C.orange, d: N4('SPORE RELEASE DETONATES AND IGNITES', '孢子釋放會爆炸並點燃', '胞子放出が爆発し炎上させる', '孢子释放会爆炸并点燃') },
  { id: 'deadeye', n: N4('COLD BLOOD', '冷血', '冷血', '冷血'), need: ['lastround', 'keen'], c: C.gold, d: N4('THE LAST ROUND IN THE MAGAZINE ALWAYS CRITS AND PIERCES', '彈匣最後一發必定暴擊並穿透', '弾倉の最後の一発は必ず会心で貫通する', '弹匣最后一发必定暴击并穿透') },
  { id: 'sleight', n: N4('HYPERREFLEXIA', '反射亢進', '反射亢進', '反射亢进'), need: ['tactical', 'quick'], c: C.cyan, d: N3('DASHING WHILE RELOADING FINISHES IT', '裝填中衝刺會立刻完成裝填', 'リロード中のダッシュで即完了') },
  { id: 'slip', n: N4('RUNNER\'S HIGH', '跑者亢奮', 'ランナーズハイ', '跑者亢奋'), need: ['moment', 'swift'], c: col(5), d: N3('MOTOR AGENT BONUS DOUBLED', '運動激活劑加成翻倍', '運動野賦活剤ボーナス2倍') },
];
const SYN = {};
const ELEM_IDS = ['ember', 'arc', 'rime', 'venom'];
const hasShard = n => G.p.shards[n] || (ELEM_IDS.includes(n) && G.p.shards.prism);
function recomputeStats() {
  const p = G.p, S = baseStats();
  // a level past the shard's max (bought in a shop after it was maxed by a card, in older versions) is brought back to the max:
  // several effects read a table by level, and reading past its end turned every hit into NaN
  for (const id in p.shards) { const m = SHARD[id].max || 1; if (!(p.shards[id] >= 1 && p.shards[id] <= m)) p.shards[id] = clamp(Math.floor(p.shards[id]) || 1, 1, m); SHARD[id].a(S, p.shards[id]); }
  G.S = S;
  for (const k in SYN) delete SYN[k];
  for (const s of SYNERGIES) if (s.need.every(hasShard)) SYN[s.id] = true;
  if (SYN.laststand) S.rate *= 1.25; if (SYN.jackpot) S.crit += .15; curseStats(S);
  p.maxHp = Math.max(2, 5 + S.maxHp); p.hp = Math.min(p.hp, p.maxHp);
  p.maxArmor = 3 + S.armor + diffV('armor');
  G.rerollBase = 15;
}
function shardColor(s) { return s.c || RAR[s.rar].c(); }
function rateMul() { return G.S.rate * (1 + (.01 + .02 * G.S.fury) * (G.fury || 0) * (G.S.fury ? 1 : 0)); }

// ---- control resistance: repeated control on one foe gets weaker; bosses adapt fastest ----
// bosses take 40% knockback; THE MONOLITH (and its variant) cannot be moved at all
function bossKnock(e) { return e.def && e.def.key === 'monolith' ? 0 : .4; }
function ccMul(e, k) { return e.affix === 'warded' ? .12 : 1 / (1 + (e.cc[k] || 0)); }
function ccAdd(e, k, a) { e.cc[k] = Math.min(6, (e.cc[k] || 0) + a * (e.boss ? 2.2 : e.elite ? 1.4 : 1)); }
function ccDecay(e, dt) { for (const k in e.cc) e.cc[k] = Math.max(0, e.cc[k] - dt * (e.boss ? .35 : .5)); }
function resistText(e) { if ((e.resT || 0) > G.time) return; e.resT = G.time + 1.6; floatText(e.x, e.y - e.r - 10, L('resist'), col(4), 1, .6); }
function applyFreeze(e, base) {
  if(e.deathFightLeft>0||hasRunModifier('rot'))return false;
  const d = base * ccMul(e, 'freeze'); ccAdd(e, 'freeze', 1);
  if (d < .08) { resistText(e); return false; }
  e.frozen = d; AU.play('freeze'); burst(e.x, e.y, 8, C.frost, 60, .4); return true;
}

// ---- hit pipeline: every attack flows through here, so every shard works with every weapon ----
function hitEnemy(e, dmg, o = {}) {
  if (e.dead || e.deathFightLeft > 0 || e.spawnT > 0 || e.inv > 0) return false;
  const S = G.S, p = G.p, pr = o.proc === undefined ? 1 : o.proc;
  if (e.shield && !o.boom && !o.melee) {
    const from = o.sx !== undefined ? ang(e.x, e.y, o.sx, o.sy) : e.face;
    if (Math.abs(angDiff(e.face, from)) < 1.0) {
      e.sflash = .1; e.shieldHp = (e.shieldHp === undefined ? 30 * (1 + statFloor() * .5) : e.shieldHp) - dmg;
      burst(e.x + Math.cos(e.face) * 9, e.y + Math.sin(e.face) * 9, 3, col(5), 70, .2); AU.play('deflect');
      if (e.shieldHp <= 0) { e.shield = false; AU.play('crate'); shake(.15); hitstop(.04); burst(e.x + Math.cos(e.face) * 9, e.y + Math.sin(e.face) * 9, 16, C.gold, 140, .5, 2); floatText(e.x, e.y - 14, L('shieldBroken'), C.gold, 1, 1); }
      return 'block'; }
  }
  // damage modifiers
  if (S.focus && e.hp >= e.maxHp - .01) { dmg *= 1.5 + .5 * S.focus; starFx(e.x, e.y, 6, col(5), .15); }
  if (S.big && (e.elite || e.boss)) dmg *= 1 + .2 * S.big;
  if (S.moment && (Math.hypot(p.vx, p.vy) > 30 || p.dashT > 0)) dmg *= 1 + .10 * S.moment * (SYN.slip ? 2 : 1);
  if (S.guill && e.boss && e.hp < e.maxHp * .3) dmg *= 1 + .15 * S.guill;
  dmg = dmgMods(e, dmg, o);
  let crit = Math.random() < S.crit + (o.critBonus || 0);
  if (markCrit(e)) { crit = true; if (SYN.omen) dmg *= 1.5; starFx(e.x, e.y, 7, C.red, .15); }
  if (crit) dmg *= S.critMul; else if (S.allin) dmg *= .5;
  if (crit && SYN.shatter && e.frozen > 0) { dmg *= 2.25; e.frozen = 0; burst(e.x, e.y, 18, C.frost, 140, .5, 2); reactionFx(e.x, e.y, C.frost, C.gold, 16, 'shatter'); }
  if (e.frozen > 0) dmg *= 1.25;
  if (e.boss && e.armorT > 0) dmg *= .3;
  if (e.buffT > 0) dmg *= .5;
  dmg *= modifierDamageMul(e);
  e.hp -= dmg; e.flash = .07; e.hurtT = .15; if (!o.fromField && !o.quiet) G.hitMark = { t: .14, crit: false, kill: false };
  if (!e.boss || Math.random() < .5) { const ba = o.ka !== undefined ? o.ka : rand(0, 6.28); for (let i = 0; i < (crit ? 5 : 2); i++) { const a = ba + rand(-.6, .6), v = rand(40, 120); part({ x: e.x, y: e.y - 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, life: .35, max: .35, c: Math.random() < .5 ? '#8a1820' : '#b8262e', grav: 300, drag: 2 }); } if (Math.random() < .3) splat(e.x + rand(-4, 4), e.y + rand(-2, 4), '#3a0a0e', 3, 5); }
  if (e.boss) G.bossDmgT = .4;
  let kb = (o.knock === undefined ? 60 : o.knock) * S.knock * (e.boss ? bossKnock(e) : (e.heavy || 1));
  if (o.ka !== undefined && kb > 0) { kb *= ccMul(e, 'knock'); ccAdd(e, 'knock', kb / 500); e.kx += Math.cos(o.ka) * kb; e.ky += Math.sin(o.ka) * kb; }
  const shown = Math.max(1, Math.round(dmg));
  if (crit) { if (G.hitMark) G.hitMark.crit = true; floatText(e.x, e.y - e.r - 4, shown + '!', C.gold, 2, .8); AU.play('crit'); hitstop(.04); shake(.06); burst(e.x, e.y, 6, C.gold, 110, .3); starFx(e.x, e.y, 5, C.gold, .12); }
  else { floatText(e.x, e.y - e.r - 4, shown, o.ghost ? C.violet : col(5), 1, .55); AU.play('hit', e.boss ? .7 : 1, o.quiet ? .4 : 1); if (dmg >= 14) hitstop(.016); }
  // impact spark aimed back along the hit
  const ia = o.ka !== undefined ? o.ka + Math.PI : rand(0, 6.28);
  for (let i = 0; i < (crit ? 4 : 2); i++) { const a = ia + rand(-.8, .8), v = rand(60, 130); part({ x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .15, max: .15, c: o.color || col(5), t: 'spark', drag: 6 }); }
  // elements (proc-gated)
  if (S.burn && Math.random() < pr) { const was = e.burn; e.burn = Math.min(e.burn + 1, 3 + S.burn * 2); e.burnT = 3; if (!was) AU.play('burn'); }
  if (S.venom && Math.random() < pr * .8) { const was = e.venom; e.venom = Math.min(5, e.venom + 1); e.venomT = 4; if (!was) AU.play('venom'); }
  if (S.frost && Math.random() < pr * .9) {
    e.chill++; e.slowT = 2; e.slowMul = 1 - .45 * ccMul(e, 'slow'); ccAdd(e, 'slow', .12);
    if (e.chill >= (e.boss ? 6 : 3)) { e.chill = 0; applyFreeze(e, e.boss ? .5 : .6 + S.frost * .3); }
  }
  if (S.shock && !o.fromShock && Math.random() < (.22 + S.shock * .08) * pr) chainLightning(e, dmg * .45 + 3, 1 + S.shock);
  if (S.vortex && !o.fromField && Math.random() < .05 * S.vortex * pr && G.vortices.length < 4) spawnVortex(e.x, e.y);
  // guillotine
  if (S.guill && !e.boss && e.hp > 0 && e.hp < e.maxHp * (.08 + .04 * S.guill + (SYN.execu ? .1 : 0))) {
    e.hp = 0; floatText(e.x, e.y - 16, L('execute'), C.red, 1, .9); streak(e.x - 10, e.y - 10, .785, 28, C.red, .2); AU.play('thrust');
    if (SYN.execu) { reactionFx(e.x, e.y, C.red, C.gold, 18, 'execu'); G.later.push({ t: .04, f: () => explode(e.x, e.y, 30, 10 * S.dmg, { color: C.gold, small: true, proc: .3 }) }); }
  }
  afterHit(e, dmg, o);
  if (e.hp <= 0) killEnemy(e, Object.assign({ crit }, o));
  return true;
}
function chainLightning(src, dmg, n) {
  dmg *= .75;
  AU.play('shock');
  let cur = src; const hit = new Set([src]);
  if (SYN.plasma && src.burn > 0) plasmaPop(src);
  for (let i = 0; i < n; i++) {
    let best = null, bd = 85;
    for (const e of G.enemies) { if (e.dead || e.deathFightLeft>0 || hit.has(e)) continue; const d = dist(cur.x, cur.y, e.x, e.y); if (d < bd) { bd = d; best = e; } }
    if (!best) break; hit.add(best);
    G.bolts.push({ pts: zig(cur.x, cur.y, best.x, best.y), life: .14, max: .14, c: C.cyan });
    hitEnemy(best, dmg, { proc: .35, fromShock: true, color: C.cyan, knock: 20, ka: ang(cur.x, cur.y, best.x, best.y) });
    if (SYN.plasma && best.burn > 0 && !best.dead) plasmaPop(best);
    cur = best;
  }
}
function plasmaPop(e) { const b = e.burn; e.burn = 0; reactionFx(e.x, e.y, C.red, C.cyan, 16, 'plasma'); G.later.push({ t: .05, f: () => explode(e.x, e.y, 22 + b * 3, 6 + b * 4, { color: C.pink, proc: .2, small: true }) }); }
function zig(x1, y1, x2, y2) { const pts = [[x1, y1]], n = 5; for (let i = 1; i < n; i++) { const t = i / n; pts.push([lerp(x1, x2, t) + rand(-5, 5), lerp(y1, y2, t) + rand(-5, 5)]); } pts.push([x2, y2]); return pts; }

// damage-over-time (burn + venom), called from enemy update
function dotTick(e, dt) {
  const S = G.S, both = SYN.caustic && e.burn > 0 && e.venom > 0 ? 2 : 1;
  if (both > 1 && Math.random() < dt * 2) reactionFx(e.x, e.y, C.lime, C.red, 10, 'caustic');
  const dotMul = (e.affix === 'warded' ? .6 : 1)*modifierDamageMul(e);
  if (e.burn > 0) { e.burnT -= dt; e.bt -= dt;
    if (e.bt <= 0) { e.bt = .33; const dmg = (1 + e.burn) * (1 + S.burn * .35) * .7 * (e.boss ? 1.5 : 1) * both * dotMul; e.hp -= dmg; e.flash = .03;
      floatText(e.x, e.y - e.r - 2, Math.round(dmg), C.red, 1, .4); if (e.hp <= 0) { killEnemy(e, { color: C.red }); return true; } }
    if (Math.random() < .3) part({ x: e.x + rand(-e.r, e.r), y: e.y - rand(0, e.r), vx: 0, vy: -40, life: .3, max: .3, c: Math.random() < .5 ? C.red : C.orange, s: 1, drag: 0 });
    if (e.burnT <= 0) e.burn = 0; }
  if (e.venom > 0) { e.venomT -= dt; e.vt = (e.vt || 0) - dt;
    if (e.vt <= 0) { e.vt = .5; const dmg = e.venom * (1.5 + .8 * S.venom) * .5 * (1 + statFloor() * .3) * both * dotMul; e.hp -= dmg;
      floatText(e.x, e.y - e.r - 2, Math.round(dmg), C.lime, 1, .4); if (e.hp <= 0) { killEnemy(e, { color: C.lime }); return true; } }
    if (Math.random() < .2) part({ x: e.x + rand(-e.r, e.r), y: e.y + rand(-2, 2), vx: 0, vy: -15, life: .5, max: .5, c: C.lime, s: 1, drag: 0 });
    if (e.venomT <= 0) e.venom = 0; }
  return false;
}

const COMBO_STEPS = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
function comboPitch() { return Math.pow(2, COMBO_STEPS[Math.min(COMBO_STEPS.length - 1, Math.max(0, G.combo - 1))] / 12); }
// in endless mode it stops at what it was when endless began (G.powCap): endless gets harder on its own (ENDLESS_GROW), and the
// bonuses found there would otherwise be cancelled out by the tougher foes they bring
// enemies grow a little with your OUTPUT serums only (damage, crit, elements, forms, hunting, allies, damaging kill / dash / ammo effects):
// +3% per level and +6% per synergy, capped at +15% for bosses and +35% for everything else; defensive and utility serums never make foes tougher
const PS_TAGS = new Set(['POWER', 'CRIT', 'ELEMENT', 'FORM', 'HUNT', 'ALLY', 'DASH']), PS_IDS = new Set(['glass', 'pristine', 'bloom', 'fury', 'shrap', 'hotb', 'lastround', 'primed', 'rnova']);
const psCounts = id => { const s = SHARD[id]; return !!s && (PS_TAGS.has(s.tag) || PS_IDS.has(id)); };
function powerScale(kind) { let n = 0; for (const k in G.p.shards) if (psCounts(k)) n += G.p.shards[k]; let v = Math.min(1 + .03 * n + .06 * Object.keys(SYN).length, kind === 'boss' ? 1.15 : 1.35);
  return G.endless && G.powCap ? Math.min(v, G.powCap) : v; }
// in-world reaction: two counter-rotating element rings + tag, shown whenever a synergy actually fires
function reactionFx(x, y, c1, c2, r = 14, synId) {
  part({ x, y, t: 'react', c: c1, c2, r, life: .35, max: .35 }); starFx(x, y, 6, col(5), .1);
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; part({ x, y, vx: Math.cos(a) * 110, vy: Math.sin(a) * 110, life: .25, max: .25, c: i % 2 ? c1 : c2, t: 'spark', drag: 5 }); }
  if (synId) { G.synTagT = G.synTagT || {}; if ((G.synTagT[synId] || 0) < G.time) { G.synTagT[synId] = G.time + 1.4; const sy = SYNERGIES.find(q => q.id === synId); floatText(x, y - 18, tr(sy.n), sy.c, 1, .9); } }
}
function killColor(e, o) {
  if (o.color && o.color !== col(5)) return o.color;
  if (e.frozen > 0) return C.frost; if (e.burn > 0) return C.red; if (e.venom > 0) return C.lime; if (o.crit) return C.gold; if (e.chill > 0) return C.frost;
  return null;
}
function killEnemy(e, o = {}) {
  if (e.dead) return; e.dead = true; const S = G.S; G.hitMark = { t: .22, crit: !!o.crit, kill: true };
  const kc = killColor(e, o);
  G.kills++; G.combo++; G.comboT = 2.2; G.comboMax = Math.max(G.comboMax, G.combo); G.comboPop = .08;
  if (S.fury) { G.fury = Math.min((G.fury || 0) + 1, SYN.berserk ? 20 : 10); G.furyT = 3; }
  const big = e.boss ? 3 : e.elite ? 1.6 : 1;
  burst(e.x, e.y, 16 * big, '#8a1820', 160 * big, .55, 2, { grav: 260 }); burst(e.x, e.y, 8 * big, '#b8262e', 120 * big, .45, 1, { grav: 260 });
  for (let i = 0; i < 5 * big; i++) { const a = rand(0, 6.28), v = rand(60, 160); part({ x: e.x, y: e.y - 3, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: .6, max: .6, c: i % 3 ? col(3) : '#5a0e14', s: 2, grav: 420, drag: 1.5 }); } // flesh
  if (kc) for (let i = 0; i < 4 * big; i++) { const a = rand(0, 6.28), v = rand(100, 200); part({ x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .2, max: .2, c: kc, t: 'spark', drag: 5 }); }
  ringFx(e.x, e.y, e.r + 12, '#5a0e14', .25, 2);
  splat(e.x, e.y, '#3a0a0e', 30 * big, 12 * big); splat(e.x, e.y, '#5a0e14', 14 * big, 7 * big);
  if (kc) splat(e.x, e.y, kc, 5, 8);
  AU.play('kill', comboPitch(), e.boss ? 1.4 : 1); shake(.1 * big, e.boss); hitstop(e.boss ? .25 : .03, e.boss);
  if (kc) chroma(.5);
  const ink = Math.round((e.ink || 2) * (1 + Math.min(G.combo, 20) * .05) * (SYN.bounty && (e.elite || e.boss) ? 3 : 1));
  for (let i = 0; i < ink; i++) G.picks.push({ kind: 'ink', x: e.x, y: e.y, vx: rand(-90, 90), vy: rand(-90, 90), t: 0 });
  if (S.vamp && Math.random() < .06 * S.vamp) G.picks.push({ kind: 'heart', x: e.x, y: e.y, vx: 0, vy: -30, t: 0 });
  if (S.boom && !e.minion) G.later.push({ t: .06, f: () => explode(e.x, e.y, 24 + S.boom * 6, e.maxHp * [0, .26, .38, .49][S.boom] + 3, { color: C.orange, proc: .4, ignite: SYN.wild, friendly: true }) });
  if (S.split) { const n = 2 + S.split * 2, a0 = rand(0, 6.28);
    for (let i = 0; i < n; i++) { const a = a0 + i / n * 6.28; G.bullets.push(mkBullet({ x: e.x, y: e.y, a, spd: 200, dmg: 4 * S.dmg + 2, r: 1.5, life: .9, kind: 'shard', home: 3, pierce: 0, bounce: 0, proc: .4, boomOnEnd: SYN.chain })); } }
  if (S.burn >= 2 && e.burn > 0) for (const n of G.enemies) if (!n.dead && n !== e && dist(e.x, e.y, n.x, n.y) < 46) { n.burn = Math.max(n.burn, 2); n.burnT = 3; }
  if (SYN.plague && e.venom > 0) { ringFx(e.x, e.y, 50, C.lime, .4, 2); reactionFx(e.x, e.y, C.lime, col(5), 14, 'plague'); for (const n of G.enemies) if (!n.dead && n !== e && dist(e.x, e.y, n.x, n.y) < 50) { n.venom = Math.max(n.venom, e.venom); n.venomT = 4; } }
  if (e.elite && e.room && !e.room.orb && (G.bonusOrbs || 0) < 1 && Math.random() < .25) { e.room.orb = true; G.bonusOrbs = (G.bonusOrbs || 0) + 1; G.inter.push({ kind: 'prism', x: e.x, y: e.y, minRar: 0, born: G.time }); }
  if (e.affix === 'volatile' && !o.roomCleanup) G.later.push({ t: .35, f: () => { for (let i = 0; i < 12; i++) eshot(e.x, e.y, i / 12 * 6.28, 80, { c: C.orange }); ringFx(e.x, e.y, 20, C.orange, .3, 2); AU.play('pop'); } });
  onKillExtra(e);
  if (e.onDeath && !o.roomCleanup) e.onDeath(e);
}
function explode(x, y, r, dmg, o = {}) {
  const c = o.color || col(5);
  // white core frame, then shockwave + colored ring + debris + smoke
  part({ x, y, t: 'ring', r0: r * .1, r: r * .55, c: '#ffc070', life: .08, max: .08, w: r * .5 });
  ringFx(x, y, r, '#e07a34', .22, 3); ringFx(x, y, r * .7, c, .35, 2);
  burst(x, y, o.small ? 10 : 22, c, r * 6, .45, 2);
  for (let i = 0; i < (o.small ? 4 : 10); i++) { const a = rand(0, 6.28), v = rand(r * 4, r * 8); part({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .2, max: .2, c: i % 2 ? c : '#ffb070', t: 'spark', drag: 4 }); }
  for (let i = 0; i < (o.small ? 3 : 7); i++) part({ x: x + rand(-r / 2, r / 2), y: y + rand(-r / 2, r / 2), vx: rand(-20, 20), vy: rand(-40, -10), life: rand(.5, 1), max: 1, c: col(2), s: 3, drag: 2 });
  splat(x, y, col(0), o.small ? 12 : 30, r * .7);
  // player-caused explosions are throttled by the fx governor; hostile ones always land
  const hostile = o.hurtsPlayer;
  AU.play(o.small ? 'pop' : 'explode', 1, o.small ? .7 : 1); shake(o.small ? .06 : .18, hostile); hitstop(o.small ? 0 : .03); if (!o.small) flash(c, .2, false);
  for (const e of G.enemies) { if (e.dead) continue; const d = dist(x, y, e.x, e.y); if (d < r + e.r) {
    hitEnemy(e, dmg * (1 - .4 * d / (r + e.r)), { boom: true, proc: o.proc || .5, ka: ang(x, y, e.x, e.y), knock: 160, color: c, quiet: true, fromField: o.fromField });
    if (o.ignite) { e.burn = Math.max(e.burn, 3); e.burnT = 3; } } }
  for (const p of WORLD.props) if (!p.dead && dist(x, y, p.x, p.y) < r + p.r) damageProp(p, dmg);
  if (hostile && dist(x, y, G.p.x, G.p.y) < r + G.p.r) hurtPlayer(1, x, y);
}
function damageProp(p, dmg) {
  if (p.dead) return; p.hp -= dmg; p.flash = .08;
  if (p.hp > 0) { AU.play('hit', 1.6, .5); return; }
  p.dead = true;
  if (p.kind === 'barrel') G.later.push({ t: .08, f: () => explode(p.x, p.y, 38, 28, { color: C.red, hurtsPlayer: true, proc: .3 }) });
  else if (p.kind === 'gas') G.later.push({ t: .05, f: () => gasBurst(p.x, p.y) });
  else { AU.play('crate'); burst(p.x, p.y, 16, col(4), 90, .5, 2); splat(p.x, p.y, col(2), 10, 7);
    if (Math.random() < .12) G.picks.push({ kind: 'heart', x: p.x, y: p.y, vx: 0, vy: -20, t: 0 });
    for (let i = 0; i < randi(1, 3); i++) G.picks.push({ kind: 'ink', x: p.x, y: p.y, vx: rand(-60, 60), vy: rand(-60, 60), t: 0 }); }
}

// ---- fields & allies: vortices, drones, static aura, spite ----
function spawnVortex(x, y) { G.vortices.push({ x, y, r: 42 * Math.sqrt(G.S.size), life: 1.4, max: 1.4, tick: 0 }); AU.play('vortex'); }
function updateFields(dt) {
  const S = G.S, p = G.p;
  for (let i = G.vortices.length - 1; i >= 0; i--) { const v = G.vortices[i]; v.life -= dt; v.tick -= dt;
    for (const e of G.enemies) { if (e.dead || e.deathFightLeft > 0 || e.spawnT > 0) continue; const d = dist(v.x, v.y, e.x, e.y); if (d > v.r || d < 2) continue;
      const pull = 110 * ccMul(e, 'pull') * (e.boss ? .15 * (bossKnock(e) ? 1 : 0) : 1) * (1 - d / v.r * .5); ccAdd(e, 'pull', dt * .5);
      moveBody(e, (v.x - e.x) / d * pull * dt, (v.y - e.y) / d * pull * dt);
      if (v.tick <= 0) hitEnemy(e, 2.5 * S.dmg, { proc: .15, fromField: true, knock: 0, quiet: true, color: C.indigo }); }
    if (v.tick <= 0) v.tick = .25;
    if (Math.random() < .8) { const a = rand(0, 6.28); part({ t: 'conv', tx: v.x, ty: v.y, a, r: v.r, x: v.x, y: v.y, life: .5, max: .5, c: Math.random() < .5 ? C.indigo : col(4), s: 1 }); }
    if (v.life <= 0) { G.vortices.splice(i, 1); if (SYN.singular) reactionFx(v.x, v.y, C.indigo, C.orange, 22, 'singular'); if (SYN.singular) explode(v.x, v.y, 36, 16 * S.dmg, { color: C.indigo, proc: .4, fromField: true }); }
  }
  // drones
  p.drones = p.drones || [];
  while (p.drones.length < S.drone) p.drones.push({ x: p.x, y: p.y, cd: rand(0, .5) });
  p.drones.length = S.drone;
  p.drones.forEach((d, i) => { const a = G.time * 1.3 + i * 2.1, tx = p.x + Math.cos(a) * 16 - Math.cos(p.aim) * 6, ty = p.y - 14 + Math.sin(a * 1.7) * 4;
    d.x = lerp(d.x, tx, Math.min(1, dt * 6)); d.y = lerp(d.y, ty, Math.min(1, dt * 6)); d.cd -= dt;
    if (d.cd <= 0) { const t = nearestEnemy(d.x, d.y, 170, e => los(d.x, d.y, e.x, e.y)); if (t) { d.cd = .55; const a2 = ang(d.x, d.y, t.x, t.y);
      for (let k = 0; k < (SYN.swarm ? 2 : 1); k++) G.bullets.push(mkBullet({ x: d.x, y: d.y, a: a2 + (k ? .12 : 0), spd: 320, dmg: (4 + 2 * S.drone) * S.dmg, r: 1.5, life: .8, kind: 'bolt', proc: .5, knock: 30, pierce: 0, bounce: 0, home: 1 }));
      starFx(d.x + Math.cos(a2) * 4, d.y + Math.sin(a2) * 4, 2, col(5), .06); AU.play('drone'); } else d.cd = .2; } });
  // static aura
  if (S.stat) { G.staticT = (G.staticT || 0) - dt;
    if (G.staticT <= 0) { G.staticT = (2.4 - .4 * S.stat) * (SYN.tesla ? .5 : 1);
      const ts = G.enemies.filter(e => !e.dead && !(e.deathFightLeft > 0) && e.spawnT <= 0 && dist(p.x, p.y, e.x, e.y) < 110).sort((a, b) => dist(p.x, p.y, a.x, a.y) - dist(p.x, p.y, b.x, b.y)).slice(0, 1 + S.stat);
      if (ts.length) AU.play('static');
      for (const e of ts) { G.bolts.push({ pts: zig(p.x, p.y - 2, e.x, e.y), life: .12, max: .12, c: C.cyan }); hitEnemy(e, (5 + 3 * S.stat) * S.dmg, { proc: .5, fromShock: !SYN.tesla, color: C.cyan, knock: 30, ka: ang(p.x, p.y, e.x, e.y) }); } } }
  if (G.furyT > 0) { G.furyT -= dt; if (G.furyT <= 0) G.fury = 0; }
  G.fragBudget = Math.min(30, (G.fragBudget || 0) + dt * 60); updateFires(dt);
}
function onPlayerHurt(armorHit) {
  const S = G.S, p = G.p;
  if (S.spite && (!armorHit || SYN.retrib)) { const n = 4 + 4 * S.spite, a0 = rand(0, 6.28);
    for (let i = 0; i < n; i++) G.bullets.push(mkBullet({ x: p.x, y: p.y, a: a0 + i / n * 6.28, spd: 230, dmg: 6 * S.dmg, r: 1.5, life: 1, kind: 'shard', home: 3, proc: .5, tint: C.red })); }
  if (SYN.retrib && armorHit) explode(p.x, p.y, 44, 15 * S.dmg, { color: C.red, proc: .5 });
}
