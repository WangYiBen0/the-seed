// ===== TheSeed weapons IV: ten more, each with an attack of its own =====
// slingshot (a steel ball that bounces from foe to foe), scalpels (bleeding, then a haemorrhage), caltrops (a field that slows),
// singularity (a grenade that drags foes in, then collapses), remote charges (place three, the fourth pull detonates them),
// prism gun (a beam that splits into three at the first foe), tripwire (anchors linked by laser wires), bubble gun (traps a foe and lifts it),
// crystal seeder (the seed grows six spikes where it lands), pile driver (a piston stab whose shock carries through the foe)
'use strict';
Object.assign(WEAPONS, {
  slingshot: { nm: N4('SLINGSHOT', '鋼珠彈弓', 'スリングショット', '钢珠弹弓'), d: N4('A STEEL BALL THAT BOUNCES FROM ONE FOE TO THE NEXT, UP TO FOUR TIMES, HITTING HARDER EACH TIME', '鋼珠擊中敵人後會彈向下一個敵人，最多彈跳四次，每次傷害更高', '鋼球が敵から敵へ最大4回跳ね、跳ねるたびに威力が上がる', '钢珠击中敌人后会弹向下一个敌人，最多弹跳四次，每次伤害更高'),
    kind: 'marble', rate: 2.2, dmg: 9, proc: .6, knock: 40, recoil: 2, shake: .03, sfx: 'shoot', st: [3, 3, 3],
    story: N4('A BOY KEPT IT IN HIS BACK POCKET TO SHOOT CANS OFF THE FENCE. HE WAS ALWAYS PROUD OF HOW THE BALL CAME BACK OFF THE SECOND CAN.', '一個男孩把它插在後口袋，用來打籬笆上的鐵罐。他最得意的是鋼珠打中第一個罐子後還能彈中第二個。', '少年は塀の空き缶を撃つため後ろポケットに入れていた。二つ目の缶まで跳ねる球が自慢だった。', '一个男孩把它插在后口袋，用来打篱笆上的铁罐。他最得意的是钢珠打中第一个罐子后还能弹中第二个。'),
    spr: ['5.....5.....', '.5...5......', '..555.......', '...4........', '...4........', '..444.......'] },
  scalpel: { nm: N4('SCALPELS', '手術刀', 'メス', '手术刀'), d: N4('THROWS TWO SCALPELS. EACH HIT ADDS A BLEED; AT FIVE, THE WOUND HAEMORRHAGES FOR HEAVY DAMAGE', '一次擲出兩把手術刀，每次命中疊加流血，疊滿五層時傷口大出血造成重創', '2本のメスを投げる。命中ごとに出血を重ね、5つで大出血して大ダメージ', '一次掷出两把手术刀，每次命中叠加流血，叠满五层时伤口大出血造成重创'),
    kind: 'bleed', rate: 3, dmg: 4, proc: .5, knock: 15, recoil: 0, shake: 0, sfx: 'needle', st: [2, 4, 3],
    story: N4('THE SURGEON WHO OWNED THEM LEFT A NOTE IN THE TRAY: STERILISE AFTER EACH USE. NOBODY HAS HAD THE TIME.', '刀盤裡留著主刀醫生的字條：「每次使用後請消毒。」從那以後誰都沒時間照做。', '持ち主の外科医はトレイにメモを残した。「使用後は毎回消毒すること」。そんな暇のある者はいない。', '刀盘里留着主刀医生的字条：「每次使用后请消毒。」从那以后谁都没时间照做。'),
    spr: ['..........1.', '555555555511', '.444444443..', '..........1.'] },
  caltrop: { nm: N4('CALTROPS', '蒺藜', 'まきびし', '蒺藜'), d: N4('SCATTERS SIX CALTROPS AROUND THE CROSSHAIR. FOES WALKING OVER THEM ARE HURT AND SLOWED (6S)', '在準星附近撒下六枚蒺藜，踩上的敵人受傷並減速（持續 6 秒）', '照準の周りに6つのまきびしを撒く。踏んだ敵は傷つき減速する（6秒）', '在准星附近撒下六枚蒺藜，踩上的敌人受伤并减速（持续 6 秒）'),
    kind: 'caltrop', rate: .9, dmg: 6, proc: .4, knock: 0, recoil: 1, shake: .02, sfx: 'lob', st: [2, 2, 3],
    story: N4('THE ROAD CREW USED THEM TO STOP CARS AT THE QUARANTINE LINE. THE THINGS THAT CAME LATER DID NOT HAVE TYRES, BUT THEY HAD FEET.', '道路封鎖隊用它攔下想闖隔離線的車。後來來的東西沒有輪胎，但它們有腳。', '道路封鎖班が隔離線の車を止めるのに使った。後から来たものにタイヤはなかったが、足はあった。', '道路封锁队用它拦下想闯隔离线的车。后来来的东西没有轮胎，但它们有脚。'),
    spr: ['....5.......', '...545......', '..5.4.5.....', '.5..4..5....', '....4.......', '...444......'] },
  singularity: { nm: N4('SINGULARITY', '奇點手雷', '特異点グレネード', '奇点手雷'), d: N4('A GRENADE THAT OPENS A GRAVITY WELL FOR 1.6S, DRAGGING FOES IN, THEN COLLAPSES IN A BLAST', '落地後張開重力井 1.6 秒，把周圍敵人拖向中心，最後坍縮爆炸', '着弾すると1.6秒の重力井戸を開き敵を引き寄せ、最後に崩壊して爆発', '落地后张开重力井 1.6 秒，把周围敌人拖向中心，最后坍缩爆炸'),
    kind: 'singul', rate: .7, dmg: 30, proc: .5, knock: 0, recoil: 3, shake: .05, sfx: 'lob', st: [5, 1, 3],
    story: N4('THE LABEL READS "CONTAINMENT PROTOTYPE - DO NOT ARM INDOORS". THE LAB IT CAME FROM HAS NO WALLS LEFT TO WORRY ABOUT.', '標籤寫著「收容原型——禁止在室內啟動」。它出身的那間實驗室，已經沒有牆壁需要擔心了。', 'ラベルには「封じ込め試作品・屋内起動禁止」。出所の研究所には、もう心配すべき壁がない。', '标签写着「收容原型——禁止在室内启动」。它出身的那间实验室，已经没有墙壁需要担心了。'),
    spr: ['..5555......', '.5vvvv5.....', '5vv00vv5....', '5vv00vv5....', '.5vvvv5.....', '..5555......'] },
  remote: { nm: N4('REMOTE CHARGES', '遙控炸藥', 'リモート爆薬', '遥控炸药'), d: N4('EACH SHOT PLANTS A CHARGE AT THE CROSSHAIR (UP TO THREE). THE NEXT SHOT DETONATES THEM ALL, AT 150% DAMAGE', '每次射擊在準星處放置一枚炸藥（最多三枚），下一次射擊將它們全部引爆，傷害 150%', '撃つたびに照準へ爆薬を設置（最大3つ）。次の射撃で全て起爆し150%ダメージ', '每次射击在准星处放置一枚炸药（最多三枚），下一次射击将它们全部引爆，伤害 150%'),
    kind: 'remote', rate: 2.5, dmg: 20, proc: .6, knock: 120, recoil: 1, shake: .02, sfx: 'stick', st: [5, 2, 3],
    story: N4('THE DEMOLITION FOREMAN COUNTED THREE CLICKS BEFORE EVERY BLAST. HIS CREW STILL COUNTS. HE NO LONGER DOES.', '拆除工頭每次引爆前都會數三聲。他的工人們到現在還在數，他已經不數了。', '解体現場の親方は爆破の前に必ず三回数えた。部下は今も数える。彼はもう数えない。', '拆除工头每次引爆前都会数三声。他的工人们到现在还在数，他已经不数了。'),
    spr: ['..r.........', '.555555.....', '.544445.....', '.545545.....', '.555555.....', '..5..5......'] },
  prism: { nm: N4('PRISM GUN', '稜鏡槍', 'プリズムガン', '棱镜枪'), d: N4('A BEAM THAT SPLITS INTO THREE COLOURED BEAMS AT THE FIRST FOE IT HITS', '光束在命中的第一個敵人處分裂成三道彩色光束', '光線が最初に当たった敵で3色の光線に分かれる', '光束在命中的第一个敌人处分裂成三道彩色光束'),
    kind: 'prism', rate: 1.6, dmg: 12, proc: .7, knock: 30, recoil: 2, shake: .04, sfx: 'rail', st: [4, 2, 5],
    story: N4('BUILT FROM A SPECTROMETER BY A PHYSICIST WHO WANTED TO SEE WHAT THE SPECIMENS WERE MADE OF. SHE NEVER FOUND OUT. THE LIGHT GOES THROUGH THEM ANYWAY.', '一位物理學家用光譜儀改造的，她想看清那些樣本由什麼構成。她到最後都沒找到答案，但光照樣能穿過它們。', '標本の正体を見たかった物理学者が分光器から作った。答えは見つからなかったが、光は彼らを貫く。', '一位物理学家用光谱仪改造的，她想看清那些样本由什么构成。她到最后都没找到答案，但光照样能穿过它们。'),
    spr: ['.......c....', '555555ccv...', '544444cvvl..', '555555ccl...', '.55....c....'] },
  tripwire: { nm: N4('TRIPWIRE', '絆線槍', 'トリップワイヤー', '绊线枪'), d: N4('FIRES ANCHORS; EACH NEW ANCHOR IS LINKED TO THE LAST BY A LASER WIRE THAT CUTS FOES (7S, UP TO FOUR ANCHORS)', '射出錨點，每個新錨點會與上一個用雷射絆線相連，切割經過的敵人（持續 7 秒，最多四個錨點）', 'アンカーを撃ち込み、新しいアンカーは直前のものとレーザー線で結ばれ敵を切る（7秒、最大4つ）', '射出锚点，每个新锚点会与上一个用激光绊线相连，切割经过的敌人（持续 7 秒，最多四个锚点）'),
    kind: 'tripwire', rate: 1.2, dmg: 8, proc: .5, knock: 0, recoil: 1, shake: .02, sfx: 'zap', st: [3, 2, 4],
    story: N4('A SECURITY CONTRACTOR STRUNG THESE ACROSS THE STAIRWELLS OF THE TOWER. THE ALARMS STOPPED RINGING AFTER THE FIRST NIGHT. THE WIRES DID NOT STOP CUTTING.', '保全承包商把它們拉在大樓的樓梯間。第一晚之後警報就不響了，但絆線一直沒停止切割。', '警備業者が塔の階段に張り巡らせた。最初の夜で警報は鳴り止んだが、線は切り続けた。', '保安承包商把它们拉在大楼的楼梯间。第一晚之后警报就不响了，但绊线一直没停止切割。'),
    spr: ['r...........', '55555555r...', '544443335...', '555..5......', '.5...5......'] },
  bubble: { nm: N4('BUBBLE GUN', '泡泡槍', 'バブルガン', '泡泡枪'), d: N4('SLOW BUBBLES THAT TRAP THE FIRST FOE THEY TOUCH FOR 1.5S, THEN POP FOR DOUBLE DAMAGE. BOSSES AND CHAMPIONS POP THEM AT ONCE', '緩慢的泡泡會把碰到的第一個敵人困住 1.5 秒，再破裂造成雙倍傷害；首領與冠軍碰到會立刻破裂', 'ゆっくり飛ぶ泡が最初に触れた敵を1.5秒閉じ込め、割れて2倍ダメージ。ボスとチャンピオンは即座に割る', '缓慢的泡泡会把碰到的第一个敌人困住 1.5 秒，再破裂造成双倍伤害；首领与冠军碰到会立刻破裂'),
    kind: 'bubble', rate: 2, dmg: 10, proc: .5, knock: 0, recoil: 0, shake: 0, sfx: 'pop', st: [3, 3, 2],
    story: N4('A TOY FROM THE GIFT SHOP OF THE CITY AQUARIUM. THE SOAP WAS SWAPPED FOR SOMETHING THE LAB WAS THROWING AWAY. IT STILL MAKES CHILDREN LAUGH, THE FEW WHO ARE LEFT.', '市立水族館紀念品店裡的玩具，肥皂水被換成了實驗室要丟掉的東西。剩下的孩子們看到還是會笑。', '市立水族館の売店のおもちゃ。石鹸液は研究所の廃液に替えられた。残った子どもたちは今も笑う。', '市立水族馆纪念品店里的玩具，肥皂水被换成了实验室要丢掉的东西。剩下的孩子们看到还是会笑。'),
    spr: ['........ff..', '.55555.f..f.', '5ff44455..f.', '.55555..ff..', '..5.........'] },
  crystal: { nm: N4('CRYSTAL SEEDER', '結晶播種器', '結晶シーダー', '结晶播种器'), d: N4('FIRES A SEED; WHERE IT STRIKES, SIX CRYSTAL SPIKES BURST OUT A MOMENT LATER', '射出結晶種子，命中處片刻後迸出六根結晶尖刺', '種を撃ち込み、着弾点から少し遅れて6本の結晶の棘が突き出す', '射出结晶种子，命中处片刻后迸出六根结晶尖刺'),
    kind: 'crystal', rate: 1.5, dmg: 8, proc: .5, knock: 20, recoil: 2, shake: .03, sfx: 'freeze', st: [4, 2, 3],
    story: N4('THE GEOLOGY DEPARTMENT GREW SALT CRYSTALS IN JARS FOR SCHOOL VISITS. SOMETHING IN THE WATER MADE THEM GROW FASTER, AND SHARPER.', '地質系為了學校參觀在罐子裡養鹽結晶。水裡多了某種東西之後，它們長得更快，也更鋒利了。', '地質学科は見学用に瓶で塩の結晶を育てていた。水に何かが混じってから、速く、鋭く育つようになった。', '地质系为了学校参观在罐子里养盐结晶。水里多了某种东西之后，它们长得更快，也更锋利了。'),
    spr: ['.........f..', '55555555fcf.', '54444443cff.', '55555555.f..', '.55.........'] },
  piledriver: { nm: N4('PILE DRIVER', '打樁槍', 'パイルドライバー', '打桩枪'), d: N4('A SHORT PISTON STAB. THE SHOCK CARRIES THROUGH THE FIRST FOE AND HITS EVERYTHING IN A CONE BEHIND IT', '短距離活塞突刺，衝擊會穿透第一個敵人，命中其身後扇形範圍內的所有敵人', '短距離のピストン刺突。衝撃は最初の敵を貫き、その背後の扇形範囲に届く', '短距离活塞突刺，冲击会穿透第一个敌人，命中其身后扇形范围内的所有敌人'),
    kind: 'pile', rate: .9, dmg: 30, range: 34, proc: 1, knock: 220, recoil: 0, shake: .12, sfx: 'hammer', st: [5, 1, 1],
    story: N4('IT DROVE THE FOUNDATION PILES FOR THE NEW HOSPITAL WING. THE WING WAS NEVER FINISHED. THE PILES ARE STILL THERE, AND SO IS THE DRIVER, NOW A LOT LIGHTER.', '它曾為醫院新翼打地基樁。新翼一直沒蓋完，地基樁還在，打樁機也還在，只是輕了許多。', '病院の新棟の基礎杭を打ち込んだ機械。新棟は完成しなかった。杭は残り、機械も残った。ずっと軽くなって。', '它曾为医院新翼打地基桩。新翼一直没盖完，地基桩还在，打桩机也还在，只是轻了许多。'),
    spr: ['...55.......', '55544555555.', '544444444445', '55544555555.', '...55.......'] },
});
const W4_IDS = ['slingshot', 'scalpel', 'caltrop', 'singularity', 'remote', 'prism', 'tripwire', 'bubble', 'crystal', 'piledriver'];
for (const k of W4_IDS) { WEAPONS[k].id = k; WEAPON_IDS.push(k); }
const AMMO4 = { slingshot: [8, 1.4, 'round', 'gold'], scalpel: [10, 1.3, 'needle', 'red'], caltrop: [4, 1.6, 'grenade', 'lime'], singularity: [2, 2, 'grenade', 'violet'], remote: [4, 1.5, 'grenade', 'red'],
  prism: [6, 1.5, 'cell', 'cyan'], tripwire: [3, 1.8, 'cell', 'red'], bubble: [6, 1.5, 'orb', 'frost'], crystal: [5, 1.6, 'cell', 'frost'] };
for (const k in AMMO4) { const [mag, rl, am, ac] = AMMO4[k]; Object.assign(WEAPONS[k], { mag, reload: rl, am, acK: ac }); }
MELEE.add('pile');
Object.assign(STR, {
  k_marble: ['RICOCHET', '彈跳', '跳弾', '弹跳'], k_bleed: ['BLEED', '流血', '出血', '流血'], k_caltrop: ['CALTROP', '蒺藜', 'まきびし', '蒺藜'], k_singul: ['GRAVITY', '重力', '重力', '重力'],
  k_remote: ['REMOTE', '遙控', '遠隔', '遥控'], k_prism: ['PRISM', '稜鏡', 'プリズム', '棱镜'], k_tripwire: ['WIRE', '絆線', 'ワイヤー', '绊线'], k_bubble: ['BUBBLE', '泡泡', '泡', '泡泡'],
  k_crystal: ['CRYSTAL', '結晶', '結晶', '结晶'], k_pile: ['PILE', '打樁', '杭打ち', '打桩'], w4_bleed: ['HAEMORRHAGE', '大出血', '大出血', '大出血'],
});

// ---------------- attack methods ----------------
const W4_BEAM = (x1, y1, x2, y2, c, w = 2) => went({ x1, y1, x2, y2, c, w, life: .16, u(q, dt) { q.life -= dt; return q.life <= 0; },
  dr(q, cx, cy) { const k = q.life / .16; ctx.globalAlpha = k; pxLine(q.x1 - cx, q.y1 - cy, q.x2 - cx, q.y2 - cy, q.c, q.w + 1); pxLine(q.x1 - cx, q.y1 - cy, q.x2 - cx, q.y2 - cy, col(5)); ctx.globalAlpha = 1; } });
// a bleed on a foe: stacks up to five (each ticks for 30% of the hit every 0.5s for 3s); the fifth stack haemorrhages at once
function w4Bleed(e, dmg, w, o) {
  e.bleedN = Math.min(5, (e.bleedN || 0) + 1); e.bleedD = Math.max(e.bleedD || 0, dmg * .3); e.bleedT = 3;
  if (e.bleedN >= 5) { e.bleedN = 0; hitEnemy(e, dmg * 3.5, hitOpts(w, o, { knock: 0, color: '#e0303a' })); splat(e.x, e.y, '#5a0e14', 12, 8); burst(e.x, e.y, 14, '#b8262e', 110, .4); floatText(e.x, e.y - e.r - 12, L('w4_bleed'), '#e0303a', 1, .8); AU.play('hit', .7, .8); if (e.dead) return; }
  if (e.bleedTick) return; e.bleedTick = true;
  went({ e, tk: .5, u(s, dt) { const f = s.e; if (f.dead || !(f.bleedT > 0) || !(f.bleedN > 0)) { f.bleedTick = false; if (!f.dead) f.bleedN = 0; return true; }
      f.bleedT -= dt; s.tk -= dt; if (s.tk <= 0) { s.tk = .5; hitEnemy(f, f.bleedD * f.bleedN, hitOpts(w, o, { knock: 0, quiet: true, proc: 0, color: '#b8262e' })); part({ x: f.x + rand(-3, 3), y: f.y, vx: rand(-15, 15), vy: rand(-10, 20), life: .4, max: .4, c: '#8a1820', s: 1 }); }
      return false; }, dr(s, cx, cy) { const f = s.e; if (f.dead) return; for (let i = 0; i < f.bleedN; i++) rect(f.x - cx - 5 + i * 2, f.y - cy - f.r - 6, 1, 2, '#e0303a'); } });
}
function w4Grow(x, y, a0, dmg, w, o) { // six crystal spikes burst out of a point a moment later
  went({ x, y, a0, sp: null, u(q, dt) { if (!q.sp && q.t > .32) { q.sp = []; AU.play('freeze', 1.4, .5); const R = 40 * sz();
        for (let i = 0; i < 6; i++) { const aa = q.a0 + i * 1.0472, pts = rayPath(q.x, q.y, aa, R, 0), e2 = pts[pts.length - 1]; q.sp.push(e2);
          for (const e of liveFoes()) if (segDist(e.x, e.y, q.x, q.y, e2[0], e2[1]) < e.r + 2) hitEnemy(e, dmg * .8, hitOpts(w, o, { ka: aa, knock: 60, color: C.frost })); }
        for (let i = G.ebullets.length - 1; i >= 0; i--) { const b = G.ebullets[i]; if (b.delay > 0) continue; if (q.sp.some(e2 => segDist(b.x, b.y, q.x, q.y, e2[0], e2[1]) < (b.r || 3) + 1)) G.ebullets.splice(i, 1); } }
      return q.t > 1.1; },
    dr(q, cx, cy) { const x = q.x - cx, y = q.y - cy;
      if (!q.sp) { const k = q.t / .32; ctx.globalAlpha = .5 + .5 * k; disc(x, y, 1 + k * 3, C.frost); ringC(x, y, 3 + k * 4, col(5), 1); ctx.globalAlpha = 1; return; }
      const k = clamp(1 - (q.t - .32) / .78, 0, 1); ctx.globalAlpha = k; for (const [ex, ey] of q.sp) { pxLine(x, y, ex - cx, ey - cy, '#2a5a6a', 3); pxLine(x, y, ex - cx, ey - cy, C.frost); rect(ex - cx - 1, ey - cy - 1, 2, 2, col(5)); } disc(x, y, 3, C.frost); ctx.globalAlpha = 1; } });
}
function w4RemoteBoom(q) { if (q.boom) return; q.boom = true; explode(q.x, q.y, 34 * sz(), q.dmg * 1.5, { color: C.orange, proc: .6 }); shake(.08); }
function w4Pop(q, e2) { const e = e2 || q.trap; AU.play('pop', 1.1, .7); burst(q.x, q.y, 12, C.frost, 90, .3); ringFx(q.x, q.y, 14, col(5), .2, 1);
  if (e && !e.dead) hitEnemy(e, q.dmg * 2, hitOpts(q.w, q.o, { knock: 60, ka: rand(0, 6.28), color: C.frost }));
  for (const f of liveFoes()) if (f !== e && dist(f.x, f.y, q.x, q.y) < 22 + f.r) hitEnemy(f, q.dmg * .5, hitOpts(q.w, q.o, { knock: 40, quiet: true, ka: ang(q.x, q.y, f.x, f.y) })); }
Object.assign(WK, {
  marble(p, w, a, o, mx, my) { const dmg = wDmg(w, o);
    wproj({ x: mx, y: my, vx: Math.cos(a) * 360, vy: Math.sin(a) * 360, r: 2, life: 1, n: 0, dmg,
      onFoe(q, e) { hitEnemy(e, q.dmg, hitOpts(w, o, { ka: Math.atan2(q.vy, q.vx), knock: 40 })); AU.play('tick', 1.3 + q.n * .15, .5); burst(q.x, q.y, 4, col(5), 80, .15);
        if (q.n >= 4) return true; let nx = null, bd = 110; for (const f of liveFoes()) { if (f === e || q.hit.has(f)) continue; const d = dist(f.x, f.y, e.x, e.y); if (d < bd && los(e.x, e.y, f.x, f.y)) { bd = d; nx = f; } }
        if (!nx) return true; q.n++; q.dmg *= 1.15; const a2 = ang(q.x, q.y, nx.x, nx.y); q.vx = Math.cos(a2) * 380; q.vy = Math.sin(a2) * 380; q.life = Math.max(q.life, .5); return false; },
      onWall(q) { burst(q.x, q.y, 4, col(4), 60, .2); return true; },
      dr(q, cx, cy) { const x = q.x - cx, y = q.y - cy; disc(x, y, 2.2, col(0)); disc(x, y, 1.6, q.n ? '#e8d8a0' : '#c9ccd0'); rect(x - 1, y - 1, 1, 1, col(5)); } });
    muzzleFx(mx, my, a, 4, col(5)); },
  bleed(p, w, a, o, mx, my) { const dmg = wDmg(w, o);
    for (const s of [-.07, .07]) { const aa = a + s;
      wproj({ x: mx, y: my, a: aa, vx: Math.cos(aa) * 430, vy: Math.sin(aa) * 430, r: 1.5, life: .6,
        onFoe(q, e) { hitEnemy(e, dmg, hitOpts(w, o, { ka: q.a, knock: 15 })); if (!e.dead) w4Bleed(e, dmg, w, o); return true; },
        onWall(q) { burst(q.x, q.y, 3, col(4), 50, .15); return true; },
        dr(q, cx, cy) { const x = q.x - cx, y = q.y - cy; pxLine(x, y, x - Math.cos(q.a) * 6, y - Math.sin(q.a) * 6, '#c9ccd0'); rect(x, y, 1, 1, col(5)); pxLine(x - Math.cos(q.a) * 4, y - Math.sin(q.a) * 4, x - Math.cos(q.a) * 6, y - Math.sin(q.a) * 6, '#8a1820'); } }); }
    AU.play('needle', 1.3, .4); },
  caltrop(p, w, a, o, mx, my) { const dmg = wDmg(w, o), [tx, ty] = throwTo(p, a, 170, 40), mine = (G.went || []).filter(q => q.caltrop);
    if (mine.length > 30) for (const q of mine.slice(0, mine.length - 30)) q.life = 0;
    for (let i = 0; i < 6; i++) { const aa = rand(0, 6.283), rr = rand(4, 20) * sz(); let x = tx + Math.cos(aa) * rr, y = ty + Math.sin(aa) * rr; if (shotBlocked(x, y)) { x = tx; y = ty; }
      went({ caltrop: true, sx: mx, sy: my, x, y, landed: false, life: 6, cd: new Map(), sp: rand(0, 6.28),
        u(q, dt) { if (!q.landed) { if (arcFly(q, dt, .28 + i * .02)) { q.landed = true; if (i === 0) AU.play('tick', .8, .5); } return false; }
          q.life -= dt; for (const e of liveFoes()) if (!e.fly && dist(e.x, e.y, q.x, q.y) < e.r + 3 && (q.cd.get(e) || 0) < G.time) { q.cd.set(e, G.time + .5); hitEnemy(e, dmg, hitOpts(w, o, { knock: 0, quiet: true }));
            if (!e.dead && !e.boss) { e.slowT = Math.max(e.slowT || 0, 1); e.slowMul = Math.min(e.slowMul || 1, .5); } }
          return q.life <= 0; },
        dr(q, cx, cy) { const x = (q.landed ? q.x : q.cx) - cx, y = (q.landed ? q.y : q.cy) - cy, k = q.landed ? Math.min(1, q.life) : 1; ctx.globalAlpha = k;
          for (let j = 0; j < 3; j++) { const aa = q.sp + j * 2.094; pxLine(x, y, x + Math.cos(aa) * 3, y + Math.sin(aa) * 3, col(4)); } rect(x, y - 2, 1, 2, col(5)); ctx.globalAlpha = 1; } }); }
    AU.play('lob', 1.3, .5); },
  singul(p, w, a, o, mx, my) { const dmg = wDmg(w, o), [tx, ty] = throwTo(p, a, 190, 40);
    went({ sx: mx, sy: my, x: tx, y: ty, ph: 0, t2: 0, R: 64 * sz(),
      u(q, dt) { if (q.ph === 0) { if (arcFly(q, dt, .4)) { q.ph = 1; AU.play('vortex'); ringFx(q.x, q.y, q.R, C.violet, .4, 2); } return false; }
        q.t2 += dt; for (const e of liveFoes()) { const d = dist(e.x, e.y, q.x, q.y); if (d < q.R && d > 3 && !e.boss) { const k = ((1 - d / q.R) * 170 + 25) * dt * (e.champ ? .4 : 1); moveBody(e, (q.x - e.x) / d * k, (q.y - e.y) / d * k); } }
        if (every(q.t2, dt, .25)) for (const e of liveFoes()) if (dist(e.x, e.y, q.x, q.y) < q.R) hitEnemy(e, dmg * .06, hitOpts(w, o, { knock: 0, quiet: true, proc: .2, color: C.violet }));
        if (Math.random() < .6) { const aa = rand(0, 6.28), r = rand(q.R * .6, q.R); part({ x: q.x + Math.cos(aa) * r, y: q.y + Math.sin(aa) * r, vx: -Math.cos(aa) * r * 2, vy: -Math.sin(aa) * r * 2, life: .4, max: .4, c: Math.random() < .5 ? C.violet : col(4), s: 1 }); }
        if (q.t2 > 1.6) { explode(q.x, q.y, 40 * sz(), dmg, { color: C.violet, proc: .5 }); shake(.15); return true; } return false; },
      dr(q, cx, cy) { if (q.ph === 0) { const x = q.cx - cx, y = q.cy - cy; disc(x, y, 3, col(0)); disc(x, y, 2, C.violet); return; }
        const x = q.x - cx, y = q.y - cy, k = q.t2 / 1.6; ctx.globalAlpha = .18; disc(x, y, q.R * (1 - k * .25), '#2a0a3a'); ctx.globalAlpha = .6; ringC(x, y, q.R * (1 - k * .25), C.violet, 1); ctx.globalAlpha = 1;
        for (let i = 0; i < 3; i++) { const aa = G.time * 5 + i * 2.094; for (let j = 0; j < 6; j++) { const r = 4 + j * 3, a2 = aa + j * .35; rect(x + Math.cos(a2) * r, y + Math.sin(a2) * r, 1, 1, j % 2 ? C.violet : col(5)); } }
        disc(x, y, 4 + k * 3, col(0)); ringC(x, y, 5 + k * 3, C.violet, 1); } });
    AU.play('lob', .9, .6); },
  remote(p, w, a, o, mx, my) { const dmg = wDmg(w, o), mine = (G.went || []).filter(q => q.remote && !q.boom);
    if (mine.length >= 3) { if (!solo(o)) return; mine.forEach((q, i) => G.later.push({ t: i * .09, f: () => w4RemoteBoom(q) })); AU.play('tick', 2, .6); return; }
    const [tx, ty] = throwTo(p, a, 170, 30);
    went({ remote: true, sx: mx, sy: my, x: tx, y: ty, landed: false, life: 9, dmg,
      u(q, dt) { if (q.boom) return true; if (!q.landed) { if (arcFly(q, dt, .3)) { q.landed = true; AU.play('stick', .9, .6); } return false; } q.life -= dt; if (q.life <= 0) { w4RemoteBoom(q); return true; } return false; },
      dr(q, cx, cy) { const x = (q.landed ? q.x : q.cx) - cx, y = (q.landed ? q.y : q.cy) - cy; rect(x - 3, y - 2, 6, 4, col(0)); rect(x - 2, y - 1, 4, 2, '#7a6a5a');
        if (q.landed && ((G.time * (q.life < 2 ? 10 : 3)) | 0) % 2) rect(x - 1, y - 3, 2, 1, C.red); } });
    AU.play('lob', 1.2, .4); },
  prism(p, w, a, o, mx, my) { const dmg = wDmg(w, o), c = wTint(o), pts = rayPath(mx, my, a, 320, 0), [ex, ey] = pts[pts.length - 1];
    let first = null, fd = 1e9; for (const e of liveFoes()) if (segDist(e.x, e.y, mx, my, ex, ey) < e.r + 3) { const d = dist(mx, my, e.x, e.y); if (d < fd) { fd = d; first = e; } }
    W4_BEAM(mx, my, first ? first.x : ex, first ? first.y : ey, c, 2);
    if (first) { hitEnemy(first, dmg, hitOpts(w, o, { ka: a, knock: 40, color: c })); const fx = first.x, fy = first.y;
      [[-.55, C.red], [0, C.lime], [.55, C.cyan]].forEach(([s, cc]) => { const a2 = a + s, p2 = rayPath(fx, fy, a2, 190, 0), [x2, y2] = p2[p2.length - 1]; W4_BEAM(fx, fy, x2, y2, cc, 1);
        for (const e of liveFoes()) if (e !== first && segDist(e.x, e.y, fx, fy, x2, y2) < e.r + 3) hitEnemy(e, dmg * .6, hitOpts(w, o, { ka: a2, knock: 20, color: cc })); });
      burst(fx, fy, 8, col(5), 90, .2); starFx(fx, fy, 6, col(5), .1); }
    muzzleFx(mx, my, a, 6, C.cyan); },
  tripwire(p, w, a, o, mx, my) { const dmg = wDmg(w, o), [tx, ty] = throwTo(p, a, 210, 30), all = (G.went || []).filter(q => q.trip && q.life > 0);
    if (all.length >= 4) all[0].life = 0; const prev = all.length ? all[all.length - 1] : null;
    W4_BEAM(mx, my, tx, ty, C.red, 0);
    went({ trip: true, x: tx, y: ty, life: 7, link: prev, cd: new Map(),
      u(q, dt) { q.life -= dt; const L2 = q.link && q.link.life > 0 ? q.link : null;
        if (L2) for (const e of liveFoes()) if (segDist(e.x, e.y, q.x, q.y, L2.x, L2.y) < e.r + 2 && (q.cd.get(e) || 0) < G.time) { q.cd.set(e, G.time + .3); hitEnemy(e, dmg, hitOpts(w, o, { knock: 0, quiet: true, color: C.red })); burst(e.x, e.y, 3, C.red, 60, .15); }
        return q.life <= 0; },
      dr(q, cx, cy) { const x = q.x - cx, y = q.y - cy, L2 = q.link && q.link.life > 0 ? q.link : null, k = Math.min(1, q.life);
        if (L2) { ctx.globalAlpha = k * (.7 + .3 * Math.sin(G.time * 20)); pxLine(x, y, L2.x - cx, L2.y - cy, C.red); ctx.globalAlpha = k * .35; pxLine(x, y + 1, L2.x - cx, L2.y - cy + 1, C.red); ctx.globalAlpha = 1; }
        ctx.globalAlpha = k; rect(x - 2, y - 2, 4, 4, col(0)); rect(x - 1, y - 1, 2, 2, ((G.time * 4) | 0) % 2 ? C.red : '#7a2020'); ctx.globalAlpha = 1; } });
    AU.play('zap', 1.4, .4); },
  bubble(p, w, a, o, mx, my) { const dmg = wDmg(w, o);
    wproj({ x: mx, y: my, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, r: 5, life: 2.4, trap: null, tt: 0, dmg, w, o, wob: rand(0, 6),
      pre(q, dt) { if (!q.trap) { q.vx *= Math.pow(.7, dt); q.vy *= Math.pow(.7, dt); return false; } const e = q.trap; q.tt -= dt;
        if (e.dead || q.tt <= 0) { w4Pop(q); return true; } moveBody(e, q.x - e.x, q.y - e.y); e.kx = e.ky = 0; e.rootT = Math.max(e.rootT || 0, .1); return 'hold'; },
      onFoe(q, e) { if (e.boss || e.champ || q.trap) { w4Pop(q, e); return true; } q.trap = e; q.tt = 1.5; q.life = 2; q.x = e.x; q.y = e.y; AU.play('pop', .6, .6); return false; },
      onWall(q) { AU.play('pop', 1.3, .4); burst(q.x, q.y, 6, C.frost, 60, .2); return true; },
      onEnd(q) { burst(q.x, q.y, 6, C.frost, 60, .2); return true; },
      dr(q, cx, cy) { const x = q.x - cx, y = q.y - cy + Math.sin(G.time * 4 + q.wob), r = q.trap ? q.trap.r + 5 : 4; ctx.globalAlpha = .18; disc(x, y, r, C.frost); ctx.globalAlpha = .9; ringC(x, y, r, C.frost, 1); rect(x - r * .5, y - r * .5, 2, 1, col(5)); ctx.globalAlpha = 1; } });
    AU.play('pop', 1.6, .3); },
  crystal(p, w, a, o, mx, my) { const dmg = wDmg(w, o);
    wproj({ x: mx, y: my, a, vx: Math.cos(a) * 360, vy: Math.sin(a) * 360, r: 2, life: .9,
      onFoe(q, e) { hitEnemy(e, dmg, hitOpts(w, o, { ka: q.a, knock: 20 })); w4Grow(q.x, q.y, q.a, dmg, w, o); return true; },
      onWall(q) { w4Grow(q.x - Math.cos(q.a) * 4, q.y - Math.sin(q.a) * 4, q.a + Math.PI, dmg, w, o); return true; },
      onEnd(q) { w4Grow(q.x, q.y, q.a, dmg, w, o); return true; },
      dr(q, cx, cy) { const x = q.x - cx, y = q.y - cy; rect(x - 1, y - 2, 2, 4, C.frost); rect(x - 2, y - 1, 4, 2, C.frost); rect(x, y, 1, 1, col(5)); } });
    muzzleFx(mx, my, a, 5, C.frost); },
  pile(p, w, a, o, mx, my) { const dmg = wDmg(w, o), R = (w.range || 34) * sz(), tx = p.x + Math.cos(a) * R, ty = p.y + Math.sin(a) * R; let first = null, fd = 1e9;
    for (const e of liveFoes()) if (segDist(e.x, e.y, p.x, p.y, tx, ty) < e.r + 5) { const d = dist(p.x, p.y, e.x, e.y); if (d < fd) { fd = d; first = e; } }
    W4_BEAM(p.x + Math.cos(a) * 6, p.y + Math.sin(a) * 6, tx, ty, col(4), 3);
    for (const pr of WORLD.props) if (!pr.dead && segDist(pr.x, pr.y, p.x, p.y, tx, ty) < pr.r + 4) damageProp(pr, dmg);
    deflectBullets(p, b => segDist(b.x, b.y, p.x, p.y, tx, ty) < 6, null, false);
    if (first) { hitEnemy(first, dmg, hitOpts(w, o, { melee: true, ka: a, knock: first.boss ? 0 : 220 })); const fx = first.x, fy = first.y, R2 = 64 * sz();
      for (const e of liveFoes()) if (e !== first && dist(fx, fy, e.x, e.y) < R2 + e.r && Math.abs(angDiff(a, ang(fx, fy, e.x, e.y))) < .55) hitEnemy(e, dmg * .6, hitOpts(w, o, { melee: true, ka: a, knock: 140 }));
      for (let i = 0; i < 7; i++) { const aa = a + rand(-.5, .5), rr = rand(10, R2); part({ x: fx + Math.cos(aa) * rr * .3, y: fy + Math.sin(aa) * rr * .3, vx: Math.cos(aa) * 240, vy: Math.sin(aa) * 240, life: .25, max: .25, c: col(5), t: 'spark', drag: 4 }); }
      ringFx(fx, fy, 12, col(5), .2, 2); if (solo(o)) { hitstop(.05); shake(.15); } }
    if (solo(o)) { p.vx -= Math.cos(a) * 60; p.vy -= Math.sin(a) * 60; } },
});
