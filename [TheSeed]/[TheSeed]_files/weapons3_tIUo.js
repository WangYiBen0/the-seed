// ===== ACHROMA weapons III: twenty more, each attacking in a way no other weapon does =====
// melee: chainsaw (hold to grind), stun baton (stores a charge, then discharges), fire axe (executes the wounded)
// ballistic: slug, flechettes, drill, harpoon, bolas, flak, glue, tranquilizer, satellite, recoilless rifle
// special: deployable turret, gas canister, leech tube (hold), sonic cannon, mortar barrage, thermite, parasite hive
'use strict';
Object.assign(WEAPONS, {
  chainsaw: { nm: N4('CHAINSAW', '鏈鋸', 'チェーンソー', '链锯'), d: N4('HOLD TO GRIND WHAT IS IN FRONT OF YOU. THE LONGER IT BITES ONE FOE, THE DEEPER IT CUTS', '按住持續鋸切前方，同一個敵人鋸得越久傷得越深', '長押しで前方を削り続ける。同じ敵を削るほど深く切る', '按住持续锯切前方，同一个敌人锯得越久伤得越深'),
    kind: 'chainsaw', hold: true, rate: 12, dmg: 3.4, proc: .3, knock: 20, recoil: 0, shake: 0, sfx: 'smg', st: [3, 5, 1],
    story: N4('THE TREE SURGEON CUT THE ROADS CLEAR FOR THE EVACUATION. WHEN THE CONVOY NEVER CAME, HE KEPT CUTTING. HE NEVER RAN OUT OF THINGS IN THE WAY.', '樹木外科醫生替撤離車隊鋸開了道路。車隊一直沒來，他就一直鋸下去。擋路的東西從來沒少過。', '樹木医は避難車列のために道を切り開いた。車列は来なかったが、彼は切り続けた。邪魔なものは尽きなかった。', '树木外科医生替撤离车队锯开了道路。车队一直没来，他就一直锯下去。挡路的东西从来没少过。'),
    spr: ['..55..o.o.o.', '.54455555555', '544444444445', '.54455555555', '..55..o.o.o.'] },
  baton: { nm: N4('STUN BATON', '電擊警棍', 'スタンバトン', '电击警棍'), d: N4('STRIKES STAGGER FOES AND STORE A CHARGE. AT FIVE, THE NEXT STRIKE DISCHARGES INTO THE GROUND', '擊中使敵人僵直並儲存電荷，滿五格時下一擊釋放地面放電', '打撃で敵をよろめかせ電荷を溜める。5つで次の一撃が地面へ放電', '击中使敌人僵直并储存电荷，满五格时下一击释放地面放电'),
    kind: 'baton', rate: 3.2, dmg: 9, range: 24, proc: 1, knock: 70, recoil: 0, shake: .03, sfx: 'zap', st: [3, 4, 1],
    story: N4('ISSUED TO THE QUARANTINE LINE TO KEEP PEOPLE ORDERLY. THE GUARD WHO CARRIED IT HELD THE GATE FOR NINE DAYS. ON THE TENTH, THE PEOPLE BEHIND IT STOPPED BEING PEOPLE.', '配發給隔離線維持秩序用的。帶著它的警衛守了九天大門。第十天，門後的人不再是人了。', '隔離線で秩序を保つために支給された。持ち主の警備員は九日間門を守った。十日目、門の向こうの人々は人でなくなった。', '配发给隔离线维持秩序用的。带着它的警卫守了九天大门。第十天，门后的人不再是人了。'),
    spr: ['.........cc', '55555555c4c', '54433333.cc', '55.........'] },
  axe: { nm: N4('FIRE AXE', '消防斧', '消防斧', '消防斧'), d: N4('AN OVERHEAD CHOP. FOES LEFT BELOW 30% ARE FINISHED OFF, AND A KILL READIES THE NEXT SWING AT ONCE', '劈下一斧，剩餘生命低於 30% 的敵人直接處決，擊殺後立刻可以再劈', '振り下ろしの一撃。残りHP30%未満の敵は処刑され、撃破で即座に次を振れる', '劈下一斧，剩余生命低于 30% 的敌人直接处决，击杀后立刻可以再劈'),
    kind: 'chop', rate: 1.4, dmg: 22, range: 36, proc: 1, knock: 200, recoil: 0, shake: .1, sfx: 'hammer', st: [5, 2, 2],
    story: N4('IT HUNG BEHIND GLASS IN THE STATION FOR TWENTY YEARS: BREAK IN CASE OF FIRE. THE CITY BURNED FOR A WEEK. SOMEONE FINALLY BROKE THE GLASS.', '它在消防站的玻璃櫃裡掛了二十年：「火災時擊破」。城市燒了一整週，終於有人打破了玻璃。', '署のガラスケースに二十年掛かっていた。「火災時は割ってください」。街は一週間燃え、ついに誰かがガラスを割った。', '它在消防站的玻璃柜里挂了二十年：「火灾时击破」。城市烧了一整周，终于有人打破了玻璃。'),
    spr: ['........555.', '.......5445.', '55555555445.', '54333333445.', '........545.', '.........5..'] },
  slug: { nm: N4('SLUG GUN', '獨頭彈', 'スラッグ', '独头弹'), d: N4('ONE HEAVY SLUG THAT HURLS THE FOE BACK. SLAMMED INTO A WALL, IT IS PINNED AND HURT AGAIN', '一發沉重的獨頭彈將敵人轟飛，撞上牆壁會被釘住並再次受傷', '重いスラッグ弾で敵を吹き飛ばす。壁に叩きつけると釘付けにして追撃', '一发沉重的独头弹将敌人轰飞，撞上墙壁会被钉住并再次受伤'),
    kind: 'slug', rate: 1.2, dmg: 22, proc: 1, knock: 0, recoil: 8, shake: .14, sfx: 'pellet', st: [5, 2, 3],
    story: N4('A FARMER LOADED THESE FOR THE BOAR THAT KEPT GETTING INTO THE BARN. THE THING THAT GOT IN LAST AUTUMN WAS NOT A BOAR. THE SLUGS WORKED ANYWAY.', '農夫裝這種彈是為了那頭老是闖進穀倉的野豬。去年秋天闖進來的不是野豬，但這些子彈照樣管用。', '農夫が納屋を荒らす猪のために込めた弾。去年の秋に入ってきたのは猪ではなかったが、弾は効いた。', '农夫装这种弹是为了那头老是闯进谷仓的野猪。去年秋天闯进来的不是野猪，但这些子弹照样管用。'),
    spr: ['............', '555555555555', '544443333333', '5555.5......', '.55..5......'] },
  flechette: { nm: N4('FLECHETTE', '箭霰彈', 'フレシェット', '箭霰弹'), d: N4('SIX DARTS SPREAD WIDE, THEN ALL TURN AND CONVERGE ON THE CROSSHAIR, PIERCING ON THE WAY', '六枚飛鏢先向外散開，再一齊轉向準星匯聚，沿途穿透', '6本の矢が広がった後、照準へ一斉に収束し貫通する', '六枚飞镖先向外散开，再一齐转向准星汇聚，沿途穿透'),
    kind: 'converge', rate: 1.6, dmg: 5, proc: .6, knock: 30, recoil: 4, shake: .05, sfx: 'needle', st: [3, 2, 4],
    story: N4('MILITARY SURPLUS FROM A WAR NOBODY REMEMBERS. THE MANUAL SAYS EVERY DART FINDS THE SAME POINT. THE MANUAL WAS WRITTEN FOR A DIFFERENT KIND OF ENEMY.', '一場沒人記得的戰爭留下的軍用剩貨。說明書說每一枚飛鏢都會飛向同一點。說明書是為另一種敵人寫的。', '誰も覚えていない戦争の軍の余剰品。説明書には全ての矢が一点に集まるとある。別の種類の敵のために書かれた説明書だ。', '一场没人记得的战争留下的军用剩货。说明书说每一枚飞镖都会飞向同一点。说明书是为另一种敌人写的。'),
    spr: ['...........f', '5555555555ff', '54444333333f', '555.55.....f', '.55.........'] },
  drill: { nm: N4('DRILL GUN', '鑽頭槍', 'ドリルガン', '钻头枪'), d: N4('FIRES A DRILL BIT THAT BORES INTO A FOE FOR A WHILE, THEN PUSHES OUT THE OTHER SIDE (TWICE)', '射出的鑽頭會鑽進敵人體內持續鑽削，之後從另一側鑽出（兩次）', 'ドリルの刃が敵に食い込みしばらく削った後、反対側へ抜ける（2回）', '射出的钻头会钻进敌人体内持续钻削，之后从另一侧钻出（两次）'),
    kind: 'drill', rate: 1.8, dmg: 7, proc: .5, knock: 20, recoil: 3, shake: .04, sfx: 'rocket', st: [4, 2, 3],
    story: N4('BUILT FROM A MINING RIG BY A MAN WHO WAS TRAPPED UNDERGROUND FOR A MONTH. HE CAME UP SAYING THE ROCK HAD BEEN EASIER. IT DID NOT FIGHT BACK.', '一個被困在地底一個月的礦工用鑽機改造的。他回到地面後說，岩石還好對付一點。至少岩石不會還手。', '一ヶ月地下に閉じ込められた鉱夫が採掘機から作った。地上に出た彼は、岩の方が楽だったと言った。岩は反撃しない。', '一个被困在地底一个月的矿工用钻机改造的。他回到地面后说，岩石还好对付一点。至少岩石不会还手。'),
    spr: ['.....5555...', '5555544445.o', '544444444ooo', '5555544445.o', '.55..5555...'] },
  harpoon: { nm: N4('HARPOON', '魚叉槍', 'ハープーン', '鱼叉枪'), d: N4('SKEWERS THE FIRST FOE AND CARRIES IT ALONG. IF IT REACHES A WALL, THE FOE IS NAILED THERE', '刺穿第一個敵人並將其帶著飛行，撞上牆壁時把敵人釘在牆上', '最初の敵を貫いて運び、壁に届けばそこへ縫い付ける', '刺穿第一个敌人并将其带着飞行，撞上墙壁时把敌人钉在墙上'),
    kind: 'harpoon', rate: 1.1, dmg: 16, proc: 1, knock: 0, recoil: 5, shake: .08, sfx: 'bow', st: [4, 1, 4],
    story: N4('THE LAST WHALER IN THE HARBOR TOWN NEVER SAILED AGAIN AFTER THE WATER TURNED BLACK. THE THINGS THAT CRAWLED OUT OF IT WERE SMALLER THAN WHALES. HE WAS GRATEFUL FOR THAT.', '海港小鎮最後一個捕鯨人，在海水變黑之後再也沒出過海。從海裡爬出來的東西比鯨魚小，他對此心存感激。', '港町最後の捕鯨師は、海が黒くなってから二度と船を出さなかった。海から這い出たものは鯨より小さかった。彼はそれに感謝した。', '海港小镇最后一个捕鲸人，在海水变黑之后再也没出过海。从海里爬出来的东西比鲸鱼小，他对此心存感激。'),
    spr: ['..............5.', '555555555555545.', '5444433333333455', '5555.55......5..', '.55.............'] },
  bolas: { nm: N4('CHAIN SHOT', '鏈彈', 'チェーンショット', '链弹'), d: N4('TWO WEIGHTS ON A CHAIN SPIN AS THEY FLY. THE CHAIN CUTS EVERYTHING BETWEEN THEM AND SWATS BULLETS ASIDE', '兩顆以鐵鏈相連的重錘邊轉邊飛，鐵鏈切過其間的一切，並撥開子彈', '鎖で繋いだ二つの錘が回転しながら飛び、間の全てを切り弾を払う', '两颗以铁链相连的重锤边转边飞，铁链切过其间的一切，并拨开子弹'),
    kind: 'bolas', rate: 1.5, dmg: 7, proc: .7, knock: 90, recoil: 3, shake: .04, sfx: 'chakram', st: [3, 2, 3],
    story: N4('A SAILOR\'S TRICK FROM THE MUSEUM SHIP: CHAIN THE CANNONBALLS AND YOU TAKE DOWN THE MAST. THE CURATOR LOADED IT INTO A SIGNAL GUN AND HELD THE GANGWAY ALONE.', '博物館船上的水手技法：把砲彈用鐵鏈連起來，就能打斷桅杆。館長把它塞進信號槍，一個人守住了舷梯。', '博物館船の水兵の技：砲弾を鎖で繋げばマストを折れる。館長はそれを信号銃に込め、一人で舷梯を守った。', '博物馆船上的水手技法：把炮弹用铁链连起来，就能打断桅杆。馆长把它塞进信号枪，一个人守住了舷梯。'),
    spr: ['....5....', '...545...', '5555455.5', '5444..545', '55.....5.'] },
  flak: { nm: N4('FLAK', '高射砲', 'フラック', '高射炮'), d: N4('SHELLS WITH A PROXIMITY FUSE: THEY BURST NEAR A FOE INTO A RING OF SHRAPNEL', '近炸引信砲彈，靠近敵人時炸開，向四周噴射彈片', '近接信管の砲弾。敵の近くで炸裂し破片を撒き散らす', '近炸引信炮弹，靠近敌人时炸开，向四周喷射弹片'),
    kind: 'flak', rate: 1.3, dmg: 12, proc: .5, knock: 60, recoil: 5, shake: .07, sfx: 'rocket', st: [4, 2, 4],
    story: N4('PULLED OFF THE ROOF OF THE AIRPORT WHEN THE SKY FILLED WITH THINGS THAT FLEW. THE CREW FIRED UNTIL THE BARREL GLOWED. THE SKY STAYED FULL.', '天空中滿是會飛的東西時，人們把它從機場屋頂拆了下來。砲手一直打到砲管發紅，天空依然滿滿的。', '空が飛ぶものに埋め尽くされた時、空港の屋上から外された。砲手は砲身が赤くなるまで撃った。空は埋まったままだった。', '天空中满是会飞的东西时，人们把它从机场屋顶拆了下来。炮手一直打到炮管发红，天空依然满满的。'),
    spr: ['....5555.....', '5555544445...', '5444444444455', '5555544445...', '.55..5555....'] },
  glue: { nm: N4('GLUE GUN', '膠槍', 'グルーガン', '胶枪'), d: N4('GLOBS OF INDUSTRIAL GLUE: A DIRECT HIT STICKS THE FOE IN PLACE, AND EVERY GLOB LEAVES A PUDDLE THAT SLOWS', '工業黏膠團：直接命中會黏住敵人，每一團都會留下減速的膠灘', '工業用接着剤の塊。直撃で敵を固め、着弾地点に減速の水たまりを残す', '工业黏胶团：直接命中会黏住敌人，每一团都会留下减速的胶滩'),
    kind: 'glue', rate: 2.4, dmg: 5, proc: .5, knock: 10, recoil: 2, shake: .02, sfx: 'pop', st: [2, 3, 3],
    story: N4('THE SHOE FACTORY RAN ITS LAST SHIFT WITH THE DOORS GLUED SHUT. THE WORKERS SURVIVED THE NIGHT. THE GLUE HELD LONGER THAN THE DOORS.', '鞋廠最後一班是把大門黏死了才開工的。工人們撐過了那一夜，膠比門撐得還久。', '靴工場は扉を接着して閉ざしたまま最後のシフトを回した。工員たちは夜を越えた。接着剤は扉より長持ちした。', '鞋厂最后一班是把大门黏死了才开工的。工人们撑过了那一夜，胶比门撑得还久。'),
    spr: ['.....lll..', '5555544l5.', '544444445l', '5555555555', '.55.......'] },
  tranq: { nm: N4('TRANQ GUN', '麻醉鏢', '麻酔銃', '麻醉镖'), d: N4('THREE DARTS PUT A FOE TO SLEEP. ANY HIT ON A SLEEPING FOE DEALS 2.5X AND WAKES IT', '三枚麻醉鏢讓敵人睡著，攻擊熟睡的敵人造成 2.5 倍傷害並將其驚醒', '3本で敵を眠らせる。眠った敵への攻撃は2.5倍で、目を覚まさせる', '三枚麻醉镖让敌人睡着，攻击熟睡的敌人造成 2.5 倍伤害并将其惊醒'),
    kind: 'tranq', rate: 4, dmg: 4, proc: .6, knock: 15, recoil: 1, shake: .015, sfx: 'needle', st: [2, 4, 4],
    story: N4('THE ZOO VET STILL MAKES HER ROUNDS. SHE SAYS THE ANIMALS JUST NEED TO REST. THE CAGES ARE EMPTY. THE THINGS SHE PUTS TO SLEEP ARE NOT ANIMALS.', '動物園的獸醫還在照常巡房。她說動物們只是需要休息。籠子都是空的，被她弄睡的也不是動物。', '動物園の獣医は今も回診を続けている。動物たちは休む必要があるだけだと言う。檻は空だ。彼女が眠らせるのは動物ではない。', '动物园的兽医还在照常巡房。她说动物们只是需要休息。笼子都是空的，被她弄睡的也不是动物。'),
    spr: ['...........', '5555555555v', '5444333333.', '55.5.......', '55.........'] },
  orbit: { nm: N4('SATELLITE', '衛星槍', 'サテライト', '卫星枪'), d: N4('EACH ROUND FIRST CIRCLES YOU ONCE, HITTING FOES AND EATING BULLETS, THEN LAUNCHES WHERE YOU AIM', '每發子彈先繞身一圈，撞擊敵人並吞掉子彈，再朝準星射出', '弾はまず周囲を一周し敵に当たり弾を食べ、その後照準へ発射される', '每发子弹先绕身一圈，撞击敌人并吞掉子弹，再朝准星射出'),
    kind: 'orbit', rate: 2.6, dmg: 7, proc: .7, knock: 40, recoil: 2, shake: .03, sfx: 'zap', st: [3, 3, 3],
    story: N4('A PROTOTYPE FROM THE MAGNETICS LAB. THE ENGINEER SAID IT WOULD CHANGE WARFARE. THERE ARE NO MORE WARS. IT CHANGED SOMETHING ELSE.', '磁學實驗室的原型機。工程師說它會改變戰爭的樣貌。現在已經沒有戰爭了，它改變的是別的東西。', '磁気研究所の試作品。技師は戦争を変えると言った。もう戦争はない。変わったのは別のものだった。', '磁学实验室的原型机。工程师说它会改变战争的样貌。现在已经没有战争了，它改变的是别的东西。'),
    spr: ['...c.....c', '5555555555', '544cc4cc45', '5555555555', '.55..c....'] },
  recoilless: { nm: N4('RECOILLESS', '無後座砲', '無反動砲', '无后坐炮'), d: N4('A HEAVY SHELL THAT EXPLODES ON IMPACT. THE BACKBLAST SCORCHES AND HURLS AWAY ANYTHING BEHIND YOU', '沉重的砲彈命中即爆，後噴火焰灼燒並轟飛身後的一切', '着弾で爆発する重い砲弾。後方噴射が背後の敵を焼き吹き飛ばす', '沉重的炮弹命中即爆，后喷火焰灼烧并轰飞身后的一切'),
    kind: 'backblast', rate: .8, dmg: 24, proc: .6, knock: 120, recoil: 0, shake: .18, sfx: 'rocket', st: [5, 1, 4],
    story: N4('THE ARMORY SERGEANT LEFT A NOTE ON THE CRATE: NEVER STAND BEHIND IT. THE SOLDIER WHO OPENED THE CRATE HAD THINGS BEHIND HIM AND IN FRONT. HE WAS GRATEFUL FOR BOTH ENDS.', '軍械士官在箱子上留了張字條：「絕對不要站在它後面」。打開箱子的士兵前後都是怪物，他很慶幸這東西兩頭都能用。', '武器係の軍曹は木箱に書き残した。「絶対に後ろに立つな」。箱を開けた兵士は前にも後ろにも敵がいた。両端があってよかったと思った。', '军械士官在箱子上留了张字条：「绝对不要站在它后面」。打开箱子的士兵前后都是怪物，他很庆幸这东西两头都能用。'),
    spr: ['...............', '555555555555555', 'o44444444444445', '555555555555555', '....55..5......'] },
  deploy: { nm: N4('POP TURRET', '便攜砲塔', 'ポップタレット', '便携炮塔'), d: N4('THROWS A SMALL TURRET THAT SHOOTS THE NEAREST FOE BY ITSELF FOR 7S (UP TO 2 AT ONCE)', '投出一座小砲塔，自動射擊最近的敵人 7 秒（最多同時 2 座）', '小型タレットを投げる。7秒間、最寄りの敵を自動で撃つ（同時に2基まで）', '投出一座小炮塔，自动射击最近的敌人 7 秒（最多同时 2 座）'),
    kind: 'deploy', rate: .9, dmg: 4, proc: .5, knock: 25, recoil: 2, shake: .03, sfx: 'lob', st: [2, 1, 4],
    story: N4('A HOME SECURITY KIT, THE KIND THAT WAS SOLD ON LATE-NIGHT TV. NOBODY BELIEVED THE ADVERTS. THE BUYER WHO DID IS STILL ALIVE.', '一套家用保全組件，就是深夜電視購物在賣的那種。沒人相信那些廣告，唯一相信的買家到現在還活著。', '深夜の通販番組で売られていた家庭用防犯キット。誰も広告を信じなかった。信じた買い手は今も生きている。', '一套家用保全组件，就是深夜电视购物在卖的那种。没人相信那些广告，唯一相信的买家到现在还活着。'),
    spr: ['..555....', '.54445555', '5444444.5', '.54445...', '.5.5.5...'] },
  gas: { nm: N4('GAS CANISTER', '毒氣罐', 'ガス缶', '毒气罐'), d: N4('A CANISTER ROLLS TO THE CROSSHAIR, HISSES, THEN BLOOMS INTO A POISON CLOUD THAT LINGERS FOR 5S', '毒氣罐滾向準星，嘶嘶作響後擴散成持續 5 秒的毒雲', '缶が照準へ転がり、音を立てて5秒間残る毒の雲になる', '毒气罐滚向准星，嘶嘶作响后扩散成持续 5 秒的毒云'),
    kind: 'gas', rate: .8, dmg: 4, proc: .4, knock: 0, recoil: 2, shake: .02, sfx: 'lob', st: [3, 1, 3],
    story: N4('PEST CONTROL, FOR THE GRAIN SILOS. THE EXTERMINATOR WORE HIS MASK FOR A YEAR AFTER THE OUTBREAK. THE PESTS GOT BIGGER. HE BOUGHT A BIGGER CANISTER.', '穀倉用的除蟲藥劑。爆發之後，除蟲員戴著防毒面具過了一整年。害蟲越長越大，他就買更大的罐子。', '穀物サイロ用の害虫駆除剤。発生後、駆除業者は一年間マスクを着け続けた。害虫は大きくなり、彼は缶を大きくした。', '谷仓用的除虫药剂。爆发之后，除虫员戴着防毒面具过了一整年。害虫越长越大，他就买更大的罐子。'),
    spr: ['..55..', '.5ll5.', '5llll5', '5l55l5', '5llll5', '.5555.'] },
  leech: { nm: N4('LEECH TUBE', '吸血導管', '吸血チューブ', '吸血导管'), d: N4('HOLD TO DRIVE A TUBE INTO THE NEAREST FOE AHEAD AND DRAIN IT. THE LONGER IT DRINKS, THE HARDER IT DRAINS (UP TO 3X)', '按住將導管刺入前方最近的敵人並持續吸取，吸得越久越猛（最多 3 倍）', '長押しで前方の敵に管を刺し吸い続ける。吸うほど強くなる（最大3倍）', '按住将导管刺入前方最近的敌人并持续吸取，吸得越久越猛（最多 3 倍）'),
    kind: 'tether', hold: true, rate: 7, dmg: 2.4, proc: .35, knock: 0, recoil: 0, shake: 0, sfx: 'venom', st: [3, 4, 3],
    story: N4('A TRANSFUSION RIG FROM THE BLOOD BANK, REWIRED BY A NURSE WHO NEVER LEFT HER POST. SHE SAYS THE DONORS ARE NO LONGER ASKED FOR THEIR CONSENT.', '血庫的輸血設備，被一名始終沒離開崗位的護理師改裝過。她說，現在已經不用徵求捐血者同意了。', '血液銀行の輸血装置を、持ち場を離れなかった看護師が改造した。もう提供者に同意は求めないと彼女は言う。', '血库的输血设备，被一名始终没离开岗位的护理师改装过。她说，现在已经不用征求献血者同意了。'),
    spr: ['.......pp.', '55555555p.', '54444444pp', '55555555..', '.55.......'] },
  sonic: { nm: N4('SONIC CANNON', '聲波砲', 'ソニックキャノン', '声波炮'), d: N4('A WIDENING WALL OF SOUND THAT HURLS FOES AWAY AND ERASES BULLETS. FOES SLAMMED INTO WALLS ARE STUNNED', '向前擴散的聲波牆，轟飛敵人並抹除子彈，被撞上牆的敵人會暈眩', '広がる音の壁が敵を吹き飛ばし弾を消す。壁に叩きつけられた敵は気絶する', '向前扩散的声波墙，轰飞敌人并抹除子弹，被撞上墙的敌人会晕眩'),
    kind: 'sonic', rate: 1.2, dmg: 9, proc: .5, knock: 0, recoil: 4, shake: .08, sfx: 'vortex', st: [3, 2, 3],
    story: N4('THE RIOT POLICE USED IT TO CLEAR THE SQUARE. THE CROWD THAT CAME BACK THE NEXT MORNING DID NOT FLINCH AT THE NOISE. IT STILL KNOCKED THEM DOWN.', '鎮暴警察用它來清空廣場。隔天早上回來的人群聽到聲音也不閃避了，但照樣被它撞倒。', '機動隊が広場を空けるのに使った。翌朝戻ってきた群衆は音に怯まなかった。それでも倒れた。', '镇暴警察用它来清空广场。隔天早上回来的人群听到声音也不闪避了，但照样被它撞倒。'),
    spr: ['....5555..', '5555vvvv5.', '5444v..v45', '5555vvvv5.', '.55.5555..'] },
  barrage: { nm: N4('MORTAR', '迫擊砲', '迫撃砲', '迫击炮'), d: N4('WALKS FOUR SHELLS FROM IN FRONT OF YOU TO THE CROSSHAIR. THEY FALL OVER WALLS', '四枚砲彈從你面前一路落到準星處，可越過牆壁', '4発の砲弾を目の前から照準まで順に落とす。壁を越えて届く', '四枚炮弹从你面前一路落到准星处，可越过墙壁'),
    kind: 'barrage', rate: .7, dmg: 15, proc: .5, knock: 120, recoil: 4, shake: .05, sfx: 'lob', st: [4, 1, 5],
    story: N4('THE GARRISON ZEROED IT ON THE BRIDGE AND WAITED. WHEN THE BRIDGE FILLED, THEY FIRED UNTIL THE BRIDGE WAS GONE. THE RIVER FILLED NEXT.', '駐軍把它瞄準了大橋然後等待。橋上擠滿之後，他們一直開砲直到橋塌了。接著，河裡也擠滿了。', '守備隊は橋に照準を合わせて待った。橋が埋まると、橋がなくなるまで撃った。次は川が埋まった。', '驻军把它瞄准了大桥然后等待。桥上挤满之后，他们一直开炮直到桥塌了。接着，河里也挤满了。'),
    spr: ['.......55.', '......5445', '555555544.', '5444444445', '5555555...', '.55..55...'] },
  thermite: { nm: N4('THERMITE', '鋁熱劑', 'テルミット', '铝热剂'), d: N4('A CHARGE THAT STICKS TO THE FIRST FOE IT TOUCHES, THEN BURNS WHITE-HOT AROUND IT FOR 3S', '黏在第一個碰到的敵人身上，隨後在其周圍燃起白熱烈焰 3 秒', '最初に触れた敵に張り付き、周囲を3秒間白熱で焼く', '黏在第一个碰到的敌人身上，随后在其周围燃起白热烈焰 3 秒'),
    kind: 'sticky', rate: 1, dmg: 3.2, proc: .3, knock: 0, recoil: 2, shake: .03, sfx: 'stick', st: [4, 1, 3],
    story: N4('THE WELDING SCHOOL TAUGHT IT AS A SAFETY LESSON: WHAT NOT TO DO. THE LAST CLASS GRADUATED EARLY AND TOOK THE LESSON WITH THEM.', '焊接學校把它當作安全教材來教：「什麼事不能做」。最後一屆學生提前畢業，把這堂課帶走了。', '溶接学校で安全教育として教わった。「やってはいけないこと」。最後の学年は早めに卒業し、その授業を持ち出した。', '焊接学校把它当作安全教材来教：「什么事不能做」。最后一届学生提前毕业，把这堂课带走了。'),
    spr: ['.555.', '5oo45', '5o445', '54445', '.555.', '..5..'] },
  parasite: { nm: N4('HIVE JAR', '寄生蜂巢', '寄生蜂の巣', '寄生蜂巢'), d: N4('A JAR OF PARASITIC WASPS. THEIR STINGS INFECT, AND AN INFECTED FOE THAT DIES RELEASES TWO MORE', '裝滿寄生蜂的罐子，蜂螫會讓敵人感染，受感染的敵人死去時再放出兩隻蜂', '寄生蜂の瓶。刺された敵は感染し、死ぬとさらに2匹を放つ', '装满寄生蜂的罐子，蜂螫会让敌人感染，受感染的敌人死去时再放出两只蜂'),
    kind: 'parasite', rate: .7, dmg: 3, proc: .4, knock: 10, recoil: 2, shake: .02, sfx: 'lob', st: [3, 1, 3],
    story: N4('A BIOLOGIST KEPT THESE TO CONTROL AN INVASIVE BEETLE. THE WASPS ADAPTED FASTER THAN THE BEETLES DID. THEY ARE STILL ADAPTING.', '生物學家養牠們來控制入侵的甲蟲。結果寄生蜂適應得比甲蟲還快，而且牠們還在繼續適應。', '生物学者が外来甲虫の駆除に飼っていた。蜂は甲虫より早く適応した。今も適応し続けている。', '生物学家养它们来控制入侵的甲虫。结果寄生蜂适应得比甲虫还快，而且它们还在继续适应。'),
    spr: ['.g.g.', 'g5g5g', '54445', '5gg45', '54445', '.555.'] },
});
const W3_IDS = ['chainsaw', 'baton', 'axe', 'slug', 'flechette', 'drill', 'harpoon', 'bolas', 'flak', 'glue', 'tranq', 'orbit', 'recoilless', 'deploy', 'gas', 'leech', 'sonic', 'barrage', 'thermite', 'parasite'];
for (const k of W3_IDS) { WEAPONS[k].id = k; WEAPON_IDS.push(k); }
const AMMO3 = { slug: [5, 1.6, 'shell', 'red'], flechette: [6, 1.4, 'needle', 'frost'], drill: [6, 1.6, 'round', 'orange'], harpoon: [3, 1.6, 'arrow', 'cyan'], bolas: [4, 1.4, 'disc', 'gold'],
  flak: [5, 1.7, 'grenade', 'orange'], glue: [8, 1.4, 'orb', 'lime'], tranq: [10, 1.3, 'needle', 'violet'], orbit: [8, 1.5, 'cell', 'cyan'], recoilless: [2, 2, 'rocket', 'red'],
  deploy: [2, 2.2, 'grenade', 'gold'], gas: [3, 1.9, 'grenade', 'lime'], sonic: [6, 1.5, 'cell', 'violet'], barrage: [2, 2.2, 'rocket', 'orange'], thermite: [3, 1.8, 'grenade', 'orange'], parasite: [2, 2, 'orb', 'lime'] };
for (const k in AMMO3) { const [mag, rl, am, ac] = AMMO3[k]; Object.assign(WEAPONS[k], { mag, reload: rl, am, acK: ac }); }
for (const k of ['chainsaw', 'baton', 'chop']) MELEE.add(k);
Object.assign(STR, {
  k_chainsaw: ['CHAINSAW', '鏈鋸', 'チェーンソー', '链锯'], k_baton: ['BATON', '警棍', '警棒', '警棍'], k_chop: ['AXE', '斧', '斧', '斧'],
  k_slug: ['SLUG', '獨頭彈', 'スラッグ', '独头弹'], k_converge: ['FLECHETTE', '箭霰', '矢弾', '箭霰'], k_drill: ['DRILL', '鑽頭', 'ドリル', '钻头'], k_harpoon: ['HARPOON', '魚叉', '銛', '鱼叉'],
  k_bolas: ['CHAIN', '鏈彈', '鎖弾', '链弹'], k_flak: ['FLAK', '高射', '高射', '高射'], k_glue: ['GLUE', '黏膠', '接着', '黏胶'], k_tranq: ['DART', '麻醉', '麻酔', '麻醉'], k_orbit: ['ORBIT', '環繞', '周回', '环绕'],
  k_backblast: ['RECOILLESS', '無後座', '無反動', '无后坐'], k_deploy: ['TURRET', '砲塔', 'タレット', '炮塔'], k_gas: ['GAS', '毒氣', 'ガス', '毒气'], k_tether: ['DRAIN', '吸取', '吸収', '吸取'],
  k_sonic: ['SONIC', '聲波', '音波', '声波'], k_barrage: ['MORTAR', '迫擊', '迫撃', '迫击'], k_sticky: ['THERMITE', '燃燒', '焼夷', '燃烧'], k_parasite: ['PARASITE', '寄生', '寄生', '寄生'],
  w3_pin: ['PINNED', '釘住', '釘付け', '钉住'], w3_sleep: ['ZZZ', '昏睡', '睡眠', '昏睡'], w3_exec: ['EXECUTED', '處決', '処刑', '处决'],
});

// ---------------- helpers ----------------
const aimPt = () => [G.aimX !== undefined ? G.aimX : Input.mx + G.cam.x, G.aimY !== undefined ? G.aimY : Input.my + G.cam.y];
const wTint = o => o.ghost ? C.violet : buildTint();
const wDmg = (w, o) => w.dmg * G.S.dmg * (o.scale || 1);
const sz = () => Math.sqrt(G.S.size || 1);
const solo = o => !o.ghost && !o.offhand && !(o.copy > 0) && !o.child;
// a projectile that is a weapon entity: it flies in small steps and calls back when it touches a foe or a wall.
// pre() may return true (gone) or 'hold' (stay put this frame, e.g. while lodged in a foe)
function wproj(o) { went(Object.assign({ life: 1.2, r: 2, hit: new Set(), u: wprojU }, o)); }
function wprojU(q, dt) {
  const pr = q.pre ? q.pre(q, dt) : false; if (pr === true) return true; if (pr === 'hold') return false;
  const sp = Math.hypot(q.vx, q.vy), n = Math.max(1, Math.ceil(sp * dt / 4));
  for (let s = 0; s < n; s++) { const nx = q.x + q.vx * dt / n, ny = q.y + q.vy * dt / n;
    if (shotBlocked(nx, ny)) { if (!q.onWall || q.onWall(q) !== false) return true; break; }
    q.x = nx; q.y = ny;
    for (const e of liveFoes()) if (!q.hit.has(e) && dist(e.x, e.y, q.x, q.y) < e.r + q.r) { q.hit.add(e); if (q.onFoe(q, e)) return true; } }
  if (q.post) q.post(q, dt);
  q.life -= dt; if (q.life <= 0) return !q.onEnd || q.onEnd(q) !== false;
  return false; }
// a thrown thing: it arcs from the hero to a point (never into a wall) and calls land() when it gets there
function throwTo(p, a, maxD, minD) { const [tx, ty] = aimPt(), d = clamp(dist(p.x, p.y, tx, ty), minD || 30, maxD), pts = rayPath(p.x, p.y, a, d, 0), e = pts[pts.length - 1]; return [e[0] - Math.cos(a) * 4, e[1] - Math.sin(a) * 4]; }
function arcFly(q, dt, dur) { q.ft = (q.ft || 0) + dt; const k = Math.min(1, q.ft / dur); q.cx = lerp(q.sx, q.x, k); q.cy = lerp(q.sy, q.y, k) - Math.sin(k * Math.PI) * 18; return k >= 1; }
// a foe knocked back hard and stopped by a wall within the next moment is pinned there (slug, sonic)
function slamWatch(e, a, dmg, w, o) {
  went({ e, a, dmg, life: .45, u(s, dt) { s.life -= dt; const f = s.e; if (f.dead) return true;
      const nx = f.x + Math.cos(s.a) * (f.r + 3), ny = f.y + Math.sin(s.a) * (f.r + 3);
      if (Math.hypot(f.kx, f.ky) > 40 && collides(nx, ny, 1, f.fly)) { hitEnemy(f, s.dmg, hitOpts(w, o, { boom: true, knock: 0 })); if (!f.dead) rootFoe(f, 1.1); f.kx = f.ky = 0;
        AU.play('hammer', .8, .7); shake(.12); hitstop(.03); burst(nx, ny, 12, col(4), 120, .35); splat(f.x, f.y, '#5a0e14', 10, 8); floatText(f.x, f.y - 16, L('w3_pin'), C.gold, 1, .8); return true; }
      return s.life <= 0; }, dr() { } });
}
function zapFx(x1, y1, x2, y2, c) { G.bolts.push({ pts: zig(x1, y1, x2, y2), life: .1, max: .1, c: c || C.cyan }); }

// ---------------- attack methods ----------------
Object.assign(WK, {
  // ---- melee ----
  baton(p, w, a, o) { const S = G.S, R = 24 * sz(), arc = 1.9, charged = (p.batN || 0) >= 5 && solo(o), dmg = wDmg(w, o) * (charged ? 1.5 : 1), c = o.ghost ? C.violet : C.cyan;
    G.slashes.push({ x: p.x, y: p.y, a, arc, r: R, life: .14, max: .14, c, ghost: o.ghost, flip: !!o.flip }); let any = false;
    for (const e of liveFoes()) { if (dist(p.x, p.y, e.x, e.y) > R + e.r || Math.abs(angDiff(a, ang(p.x, p.y, e.x, e.y))) > arc / 2 + .2) continue;
      hitEnemy(e, dmg, hitOpts(w, o, { melee: true, ka: a })); any = true; zapFx(p.x + Math.cos(a) * 8, p.y + Math.sin(a) * 8, e.x, e.y, c);
      if (!e.dead && !e.boss) { e.slowT = Math.max(e.slowT, .6); e.slowMul = Math.min(e.slowMul || 1, .25); } }
    for (const pr of WORLD.props) if (!pr.dead && dist(p.x, p.y, pr.x, pr.y) < R + pr.r) damageProp(pr, dmg);
    deflectBullets(p, b => dist(p.x, p.y, b.x, b.y) < R + 3 && Math.abs(angDiff(a, ang(p.x, p.y, b.x, b.y))) < arc / 2 + .3, null, false);
    if (charged) { p.batN = 0; const fx = p.x + Math.cos(a) * R * .6, fy = p.y + Math.sin(a) * R * .6; AU.play('zap', .6); AU.play('explode', 1.6, .4); flash(C.cyan, .15); shake(.15); ringFx(fx, fy, 42 * sz(), C.cyan, .4, 3);
      went({ x: fx, y: fy, R: 42 * sz(), life: 2, tk: 0, dmg: wDmg(w, o) * .45, o,
        u(q, dt) { q.life -= dt; q.tk -= dt; if (q.tk <= 0) { q.tk = .25; for (const e of liveFoes()) if (dist(e.x, e.y, q.x, q.y) < q.R + e.r) { hitEnemy(e, q.dmg, hitOpts(w, q.o, { knock: 0, quiet: true, color: C.cyan, fromShock: true })); if (!e.dead) rootFoe(e, .3); zapFx(q.x + rand(-6, 6), q.y + rand(-6, 6), e.x, e.y); } }
          if (Math.random() < .5) { const aa = rand(0, 6.28), rr = rand(0, q.R); zapFx(q.x, q.y, q.x + Math.cos(aa) * rr, q.y + Math.sin(aa) * rr * .7); } return q.life <= 0; },
        dr(q, cx, cy) { const x = q.x - cx, y = q.y - cy, k = Math.min(1, q.life * 2); ctx.globalAlpha = .12 * k; disc(x, y, q.R, C.cyan); ctx.globalAlpha = .7 * k; ringC(x, y, q.R, C.cyan, 1); ringC(x, y, q.R * (.4 + .3 * Math.sin(G.time * 12)), col(5), 1); ctx.globalAlpha = 1; } }); }
    else if (any && solo(o)) { p.batN = Math.min(5, (p.batN || 0) + 1); if (p.batN === 5) { AU.play('charged', 1.2, .6); ringFx(p.x, p.y, 12, C.cyan, .25, 1); } }
  },
  chop(p, w, a, o) { const S = G.S, L4 = 36 * sz(), x1 = p.x + Math.cos(a) * 6, y1 = p.y + Math.sin(a) * 6, x2 = p.x + Math.cos(a) * L4, y2 = p.y + Math.sin(a) * L4, c = wTint(o); let killed = false;
    if (p.anim) { p.anim.k = 'slam'; p.anim.dur = .3; }
    for (const e of liveFoes()) { if (segDist(e.x, e.y, x1, y1, x2, y2) > e.r + 7) continue; const low = e.hp < e.maxHp * .3;
      hitEnemy(e, wDmg(w, o) * (e.boss && low ? 1.5 : 1), hitOpts(w, o, { melee: true, ka: a, knock: w.knock }));
      if (!e.dead && !e.boss && !e.champ && e.hp < e.maxHp * .3) { hitEnemy(e, e.hp + 1, { proc: 0, knock: 0, quiet: true, ka: a }); floatText(e.x, e.y - 18, L('w3_exec'), C.red, 1, .9); splat(e.x, e.y, '#5a0e14', 16, 10); burst(e.x, e.y, 16, '#b8262e', 140, .4, 2); }
      if (e.dead) killed = true; }
    for (const pr of WORLD.props) if (!pr.dead && segDist(pr.x, pr.y, x1, y1, x2, y2) < pr.r + 6) damageProp(pr, wDmg(w, o));
    deflectBullets(p, b => segDist(b.x, b.y, x1, y1, x2, y2) < 7, null, false);
    splat(x2, y2, col(0), 8, 7); burst(x2, y2, 8, col(4), 90, .3); if (!o.ghost) { hitstop(.03); }
    went({ x1, y1, x2, y2, a, c, life: .22, u(q, dt) { q.life -= dt; return q.life <= 0; },
      dr(q, cx, cy) { const k = q.life / .22, nx = -Math.sin(q.a), ny = Math.cos(q.a); ctx.globalAlpha = k;
        for (let i = -1; i <= 1; i++) pxLine(q.x1 - cx + nx * i, q.y1 - cy + ny * i, q.x2 - cx + nx * i, q.y2 - cy + ny * i, i ? q.c : col(5)); ctx.globalAlpha = 1; } });
    if (killed && solo(o)) { G.later.push({ t: 0, f: () => { if (G.p) G.p.cd = Math.min(G.p.cd, .07); } }); AU.play('crit', 1.3, .5); }
  },
  // ---- ballistic ----
  slug(p, w, a, o, mx, my) { const dmg = wDmg(w, o), c = wTint(o);
    wproj({ x: mx, y: my, a, vx: Math.cos(a) * 440, vy: Math.sin(a) * 440, r: 3 * sz(), life: .7, c,
      onFoe(q, e) { hitEnemy(e, dmg, hitOpts(w, o, { ka: q.a, knock: e.boss ? 0 : 430 })); burst(q.x, q.y, 10, col(5), 140, .3); if (!e.boss && !e.dead) slamWatch(e, q.a, dmg * .9, w, o); return true; },
      onWall(q) { burst(q.x, q.y, 8, col(4), 100, .3); splat(q.x, q.y, col(0), 6, 6); return true; },
      dr(q, cx, cy) { const x = q.x - cx, y = q.y - cy; pxLine(x, y, x - Math.cos(q.a) * 9, y - Math.sin(q.a) * 9, '#8a6a30'); disc(x, y, 2.5, col(0)); disc(x, y, 1.6, '#e0c080'); } });
    cone(mx, my, a, .45, 12, '#ffb070', 230, .2); muzzleFx(mx, my, a, 9, '#ffb070'); if (solo(o)) casing(p.x, p.y, a);
  },
  converge(p, w, a, o, mx, my) { const dmg = wDmg(w, o), c = wTint(o), [tx, ty] = aimPt(), n = 6;
    for (let i = 0; i < n; i++) { const aa = a + (i - (n - 1) / 2) * .22;
      wproj({ x: mx, y: my, vx: Math.cos(aa) * 300, vy: Math.sin(aa) * 300, r: 1.5, life: 1, c, tx, ty, turned: false,
        pre(q) { if (!q.turned && q.t > .16) { q.turned = true; q.hit.clear(); const a2 = ang(q.x, q.y, q.tx, q.ty); q.vx = Math.cos(a2) * 480; q.vy = Math.sin(a2) * 480; q.life = .7; } return false; },
        onFoe(q, e) { hitEnemy(e, dmg * (q.turned ? 1.2 : 1), hitOpts(w, o, { ka: Math.atan2(q.vy, q.vx), knock: 30 })); return !q.turned; },
        dr(q, cx, cy) { const x = q.x - cx, y = q.y - cy, aa2 = Math.atan2(q.vy, q.vx); pxLine(x, y, x - Math.cos(aa2) * 5, y - Math.sin(aa2) * 5, q.turned ? col(5) : q.c); rect(x, y, 1, 1, col(5)); } }); }
    muzzleFx(mx, my, a, 6, C.frost);
  },
  drill(p, w, a, o, mx, my) { const dmg = wDmg(w, o), c = wTint(o);
    wproj({ x: mx, y: my, a, vx: Math.cos(a) * 280, vy: Math.sin(a) * 280, r: 2.5, life: 1, c, n: 0, lodged: null, lt: 0, tk: 0,
      pre(q, dt) { if (!q.lodged) return false; const e = q.lodged;
        if (e.dead || q.lt <= 0) { q.lodged = null; q.life = Math.max(q.life, .45); AU.play('pop', 1.4, .4); return false; }
        q.lt -= dt; q.x = e.x - Math.cos(q.a) * Math.max(1, e.r - 2); q.y = e.y - Math.sin(q.a) * Math.max(1, e.r - 2); q.tk -= dt;
        if (q.tk <= 0) { q.tk = .1; hitEnemy(e, dmg * .4, hitOpts(w, o, { knock: 0, quiet: true, ka: q.a })); for (let i = 0; i < 2; i++) part({ x: q.x, y: q.y, vx: rand(-80, 80), vy: rand(-90, -20), life: .25, max: .25, c: i ? '#b8262e' : C.orange, t: 'spark', drag: 3 }); if (Math.random() < .5) AU.play('tick', 1.6, .3); }
        return 'hold'; },
      onFoe(q, e) { hitEnemy(e, dmg, hitOpts(w, o, { ka: q.a, knock: 10 })); if (q.n < 2 && !e.dead) { q.n++; q.lodged = e; q.lt = .8; q.tk = .05; AU.play('stick', .7); } return false; },
      dr(q, cx, cy) { const x = q.x - cx, y = q.y - cy, sp = G.time * 40; ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(q.a); ctx.fillStyle = col(0); ctx.fillRect(-5, -2, 9, 4); ctx.fillStyle = '#9a9a9e'; ctx.fillRect(-4, -1, 6, 2);
        ctx.fillStyle = C.orange; ctx.beginPath(); ctx.moveTo(2, -2); ctx.lineTo(6, 0); ctx.lineTo(2, 2); ctx.fill(); ctx.fillStyle = col(5); ctx.fillRect(Math.round(-3 + (sp % 5)), -1, 1, 2); ctx.restore(); } });
    muzzleFx(mx, my, a, 5, C.orange);
  },
  harpoon(p, w, a, o, mx, my) { const dmg = wDmg(w, o), c = wTint(o);
    wproj({ x: mx, y: my, a, vx: Math.cos(a) * 410, vy: Math.sin(a) * 410, r: 2.5, life: .75, c, car: null,
      onFoe(q, e) { hitEnemy(e, dmg * .6, hitOpts(w, o, { ka: q.a, knock: 0 })); if (!q.car && !e.dead && !e.boss && !e.champ) { q.car = e; AU.play('stick', .6); } else if (e.boss || e.champ) { burst(q.x, q.y, 8, col(5), 100, .3); return !q.car; } return false; },
      post(q) { const e = q.car; if (!e) return; if (e.dead) { q.car = null; return; } moveBody(e, q.x - Math.cos(q.a) * e.r - e.x, q.y - Math.sin(q.a) * e.r - e.y); e.kx = e.ky = 0; },
      onWall(q) { const e = q.car; if (e && !e.dead) { hitEnemy(e, dmg * 1.6, hitOpts(w, o, { boom: true, knock: 0, ka: q.a })); if (!e.dead) rootFoe(e, 1.6); AU.play('hammer', .7); shake(.15); hitstop(.04); splat(e.x, e.y, '#5a0e14', 18, 10); floatText(e.x, e.y - 16, L('w3_pin'), C.gold, 1, .8); }
        burst(q.x, q.y, 8, col(4), 90, .3); went({ x: q.x, y: q.y, a: q.a, life: 1.6, u(s, dt) { s.life -= dt; return s.life <= 0; }, dr(s, cx, cy) { const x = s.x - cx, y = s.y - cy; ctx.globalAlpha = Math.min(1, s.life); pxLine(x, y, x - Math.cos(s.a) * 12, y - Math.sin(s.a) * 12, col(4)); ctx.globalAlpha = 1; } }); return true; },
      onEnd(q) { if (q.car && !q.car.dead) { q.car.kx = Math.cos(q.a) * 120; q.car.ky = Math.sin(q.a) * 120; } return true; },
      dr(q, cx, cy) { const P = G.p, x = q.x - cx, y = q.y - cy; ctx.globalAlpha = .5; pxLine(P.x - cx, P.y - cy - 2, x, y, '#6a5a40'); ctx.globalAlpha = 1;
        pxLine(x, y, x - Math.cos(q.a) * 12, y - Math.sin(q.a) * 12, col(4)); pxLine(x, y, x - Math.cos(q.a + .5) * 4, y - Math.sin(q.a + .5) * 4, col(5)); pxLine(x, y, x - Math.cos(q.a - .5) * 4, y - Math.sin(q.a - .5) * 4, col(5)); } });
  },
  bolas(p, w, a, o, mx, my) { const dmg = wDmg(w, o), c = wTint(o);
    went({ x: mx, y: my, vx: Math.cos(a) * 215, vy: Math.sin(a) * 215, life: 1.15, rad: 13 * sz(), sp: a + 1.57, cd: new Map(), dmg, o, c,
      u(q, dt) { q.life -= dt; q.sp += dt * 15; const nx = q.x + q.vx * dt, ny = q.y + q.vy * dt; if (shotBlocked(nx, ny)) { q.vx *= -.5; q.vy *= -.5; burst(q.x, q.y, 4, col(4), 70, .2); } else { q.x = nx; q.y = ny; }
        const bx = Math.cos(q.sp) * q.rad, by = Math.sin(q.sp) * q.rad, x1 = q.x + bx, y1 = q.y + by, x2 = q.x - bx, y2 = q.y - by;
        for (const e of liveFoes()) if (segDist(e.x, e.y, x1, y1, x2, y2) < e.r + 2 && (q.cd.get(e) || 0) < G.time) { q.cd.set(e, G.time + .22); hitEnemy(e, q.dmg, hitOpts(w, q.o, { ka: ang(q.x, q.y, e.x, e.y), knock: 90, color: q.c })); AU.play('hit', 1.3, .4); }
        for (let i = G.ebullets.length - 1; i >= 0; i--) { const b = G.ebullets[i]; if (b.delay > 0) continue; if (segDist(b.x, b.y, x1, y1, x2, y2) < (b.r || 3) + 1) { G.ebullets.splice(i, 1); burst(b.x, b.y, 3, col(5), 60, .15); } }
        return q.life <= 0; },
      dr(q, cx, cy) { const bx = Math.cos(q.sp) * q.rad, by = Math.sin(q.sp) * q.rad, x = q.x - cx, y = q.y - cy;
        for (let i = 0; i <= 10; i++) { const k = i / 10 * 2 - 1; rect(x + bx * k - .5, y + by * k - .5, 1, 1, i % 2 ? col(4) : col(3)); }
        for (const s of [1, -1]) { disc(x + bx * s, y + by * s, 3, col(0)); disc(x + bx * s, y + by * s, 2, '#7a7a80'); rect(x + bx * s - 1, y + by * s - 1, 1, 1, col(5)); } } });
    muzzleFx(mx, my, a, 6, C.gold);
  },
  flak(p, w, a, o, mx, my) { const dmg = wDmg(w, o), c = wTint(o);
    const boom = q => { if (q.gone) return true; q.gone = true; explode(q.x, q.y, 18 * sz(), dmg * .8, { color: C.orange, small: true });
      for (let i = 0; i < 10; i++) G.bullets.push(mkBullet({ x: q.x, y: q.y, a: i / 10 * 6.283 + rand(-.1, .1), spd: rand(190, 250), dmg: dmg * .35, r: 1.5, life: .35, kind: 'shard', proc: .4, knock: 30, tint: C.orange, ghost: o.ghost })); return true; };
    wproj({ x: mx, y: my, a, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320, r: 2.5, life: .9, c,
      pre(q) { if (q.t > .06 && liveFoes().some(e => dist(e.x, e.y, q.x, q.y) < e.r + 20)) return boom(q); return false; },
      onFoe: q => boom(q), onWall: q => boom(q), onEnd: q => boom(q),
      dr(q, cx, cy) { const x = q.x - cx, y = q.y - cy; disc(x, y, 2.5, col(0)); disc(x, y, 1.6, '#c8703a'); if (((G.time * 20) | 0) % 2) rect(x - 1, y - 1, 2, 2, col(5)); } });
    muzzleFx(mx, my, a, 7, C.orange);
  },
  glue(p, w, a, o, mx, my) { const dmg = wDmg(w, o), c = wTint(o);
    const puddle = (x, y) => went({ x, y, R: 22 * sz(), life: 4, tk: 0, seed: rand(0, 9), u(d, dt) { d.life -= dt; d.tk -= dt;
        for (const e of liveFoes()) if (!e.fly && dist(e.x, e.y, d.x, d.y) < d.R + e.r * .5) { e.slowT = Math.max(e.slowT, .25); e.slowMul = Math.min(e.slowMul || 1, .3); if (d.tk <= 0) hitEnemy(e, dmg * .25, hitOpts(w, o, { knock: 0, quiet: true, color: C.lime, proc: .2 })); }
        if (d.tk <= 0) d.tk = .5; return d.life <= 0; },
      dr(d, cx, cy) { const x = d.x - cx, y = d.y - cy, k = Math.min(1, d.life / .6, d.t * 6); ctx.globalAlpha = .55 * k; for (let i = 0; i < 6; i++) { const aa = d.seed + i * 1.05; disc(x + Math.cos(aa) * d.R * .45, y + Math.sin(aa) * d.R * .3, d.R * .45, '#7a8a3a'); } disc(x, y, d.R * .55, '#9aaa4a'); ctx.globalAlpha = .8 * k; rect(x - 3, y - 2, 2, 1, '#e8f0b0'); ctx.globalAlpha = 1; } });
    wproj({ x: mx, y: my, a, vx: Math.cos(a) * 250, vy: Math.sin(a) * 250, r: 3, life: .7, c,
      onFoe(q, e) { hitEnemy(e, dmg, hitOpts(w, o, { ka: q.a, knock: 10, color: C.lime })); if (!e.dead) rootFoe(e, .8); puddle(e.x, e.y); AU.play('pop', .8, .5); return true; },
      onWall(q) { puddle(q.x - Math.cos(q.a) * 6, q.y - Math.sin(q.a) * 6); AU.play('pop', .7, .4); return true; },
      onEnd(q) { puddle(q.x, q.y); return true; },
      dr(q, cx, cy) { const x = q.x - cx, y = q.y - cy; disc(x, y, 3, col(0)); disc(x, y, 2.2, '#9aaa4a'); rect(x - 1, y - 1, 1, 1, '#e8f0b0'); } });
  },
  tranq(p, w, a, o, mx, my) { const dmg = wDmg(w, o), c = wTint(o);
    wproj({ x: mx, y: my, a: a + rand(-.03, .03), vx: 0, vy: 0, r: 1.5, life: .8, c,
      pre(q) { if (!q.vx && !q.vy) { q.vx = Math.cos(q.a) * 520; q.vy = Math.sin(q.a) * 520; } return false; },
      onFoe(q, e) { const was = e.sleepT > G.time; hitEnemy(e, dmg, hitOpts(w, o, { ka: q.a, knock: 15 }));
        if (!e.dead && !was) { e.sleepN = (e.sleepN || 0) + 1; if (e.sleepN >= 3) { e.sleepN = 0;
          if (e.boss) { e.slowT = Math.max(e.slowT, 1.5); e.slowMul = Math.min(e.slowMul || 1, .6); } else { const k = ccMul(e, 'root'); ccAdd(e, 'root', .6); if (k < .1) resistText(e); else { e.sleepT = G.time + 2.5 * k; floatText(e.x, e.y - 16, L('w3_sleep'), C.violet, 1, .8); AU.play('ink', .6, .6); } } } }
        return true; },
      dr(q, cx, cy) { const x = q.x - cx, y = q.y - cy; pxLine(x, y, x - Math.cos(q.a) * 6, y - Math.sin(q.a) * 6, '#d8d4c8'); rect(x - Math.cos(q.a) * 6 - .5, y - Math.sin(q.a) * 6 - .5, 2, 2, C.violet); } });
  },
  orbit(p, w, a, o) { const dmg = wDmg(w, o), c = o.ghost ? C.violet : C.cyan;
    went({ st: 'orbit', a0: a - 1.57, ph: 0, R: 18 * sz(), x: p.x, y: p.y, vx: 0, vy: 0, life: .7, cd: new Map(), dmg, o, c, tr: [],
      u(q, dt) { const P = G.p;
        if (q.st === 'orbit') { q.ph += dt * 12.6; q.x = P.x + Math.cos(q.a0 + q.ph) * q.R; q.y = P.y - 2 + Math.sin(q.a0 + q.ph) * q.R * .85;
          for (let i = G.ebullets.length - 1; i >= 0; i--) { const b = G.ebullets[i]; if (b.delay > 0) continue; if (dist(b.x, b.y, q.x, q.y) < (b.r || 3) + 3) { G.ebullets.splice(i, 1); burst(b.x, b.y, 3, q.c, 60, .15); } }
          if (q.ph >= 6.283) { q.st = 'fly'; const [tx, ty] = aimPt(), aa = dist(q.x, q.y, tx, ty) > 20 ? ang(q.x, q.y, tx, ty) : P.aim; q.vx = Math.cos(aa) * 430; q.vy = Math.sin(aa) * 430; q.cd.clear(); AU.play('shoot', 1.4, .3); } }
        else { const nx = q.x + q.vx * dt, ny = q.y + q.vy * dt; if (shotBlocked(nx, ny)) { burst(q.x, q.y, 5, q.c, 80, .2); return true; } q.x = nx; q.y = ny; q.life -= dt; if (q.life <= 0) return true; }
        for (const e of liveFoes()) if (dist(e.x, e.y, q.x, q.y) < e.r + 3 && (q.cd.get(e) || 0) < G.time) { q.cd.set(e, G.time + .25); hitEnemy(e, q.dmg * (q.st === 'fly' ? 1 : .5), hitOpts(w, q.o, { ka: ang(P.x, P.y, e.x, e.y), knock: 40, color: q.c })); if (q.st === 'fly') return true; }
        q.tr.push([q.x, q.y]); if (q.tr.length > 5) q.tr.shift(); return false; },
      dr(q, cx, cy) { q.tr.forEach(([x, y], i) => { ctx.globalAlpha = (i + 1) / 8; rect(x - cx - .5, y - cy - .5, 1, 1, q.c); }); ctx.globalAlpha = 1; const x = q.x - cx, y = q.y - cy; disc(x, y, 2.5, col(0)); disc(x, y, 1.6, q.c); rect(x, y - 1, 1, 1, col(5)); } });
    ringFx(p.x, p.y, 10, c, .2, 1);
  },
  backblast(p, w, a, o, mx, my) { const dmg = wDmg(w, o), c = wTint(o), ba = a + Math.PI;
    const boom = q => { explode(q.x, q.y, 24 * sz(), dmg, { color: C.orange }); return true; };
    wproj({ x: mx, y: my, a, vx: Math.cos(a) * 330, vy: Math.sin(a) * 330, r: 3, life: 1, c, onFoe: q => boom(q), onWall: q => boom(q), onEnd: q => boom(q),
      dr(q, cx, cy) { const x = q.x - cx, y = q.y - cy; pxLine(x, y, x - Math.cos(q.a) * 7, y - Math.sin(q.a) * 7, col(4), 2); disc(x, y, 2, '#d8d0c0'); if (Math.random() < .7) part({ x: q.x - Math.cos(q.a) * 8, y: q.y - Math.sin(q.a) * 8, vx: rand(-10, 10), vy: rand(-10, 10), life: .3, max: .3, c: col(3), s: 2 }); } });
    // the backblast
    const BL = 56 * sz(); for (const e of liveFoes()) { if (dist(p.x, p.y, e.x, e.y) > BL + e.r || Math.abs(angDiff(ba, ang(p.x, p.y, e.x, e.y))) > .55) continue; hitEnemy(e, dmg * .55, hitOpts(w, o, { ka: ba, knock: 280, boom: true, color: C.orange })); if (!e.dead) { e.burn = Math.max(e.burn, 2); e.burnT = 2; } }
    deflectBullets(p, b => dist(p.x, p.y, b.x, b.y) < BL && Math.abs(angDiff(ba, ang(p.x, p.y, b.x, b.y))) < .6, null, false);
    cone(p.x, p.y, ba, .55, 28, '#ffb070', 280, .35, 2); cone(p.x, p.y, ba, .7, 14, col(3), 140, .7, 3); muzzleFx(mx, my, a, 10, '#ffb070'); if (solo(o)) { shake(.15); flash('#ffb070', .08); }
  },
  // ---- special ----
  deploy(p, w, a, o) { const [ax, ay] = aimPt(), [x, y] = throwTo(p, a, clamp(dist(p.x, p.y, ax, ay) - 34, 30, 120), 30), dmg = wDmg(w, o), turrets = (G.went || []).filter(q => q.turret && q.life > 0); if (turrets.length >= 2) turrets[0].life = 0;
    went({ turret: true, sx: p.x, sy: p.y, x, y, cx: p.x, cy: p.y, st: 'fly', life: 7, cd: .4, aim: a, dmg, o,
      u(q, dt) { if (q.st === 'fly') { if (arcFly(q, dt, .35)) { q.st = 'set'; AU.play('crate', 1.4, .5); burst(q.x, q.y, 8, col(4), 80, .3); ringFx(q.x, q.y, 10, C.gold, .25, 1); } return false; }
        q.life -= dt; q.cd -= dt; const tg = nearestEnemy(q.x, q.y, 150, e => los(q.x, q.y - 4, e.x, e.y));
        if (tg) { q.aim += clamp(angDiff(q.aim, ang(q.x, q.y - 4, tg.x, tg.y)), -10 * dt, 10 * dt);
          if (q.cd <= 0 && Math.abs(angDiff(q.aim, ang(q.x, q.y - 4, tg.x, tg.y))) < .3) { q.cd = .22; const bx = q.x + Math.cos(q.aim) * 7, by = q.y - 6 + Math.sin(q.aim) * 7;
            G.bullets.push(mkBullet({ x: bx, y: by, a: q.aim + rand(-.04, .04), spd: 360, dmg: q.dmg, r: 1.5, life: .6, kind: 'bolt', proc: .5, knock: 25, tint: C.gold, ghost: q.o.ghost })); muzzleFx(bx, by, q.aim, 3, C.gold); AU.play('smg', 1.3, .3); } }
        if (q.life <= 0) { burst(q.x, q.y, 10, col(4), 90, .3); AU.play('crate', 1.6, .4); return true; } return false; },
      dr(q, cx, cy) { if (q.st === 'fly') { const x = q.cx - cx, y = q.cy - cy; rect(x - 3, y - 3, 6, 6, col(0)); rect(x - 2, y - 2, 4, 4, '#8a7a50'); return; }
        const x = q.x - cx, y = q.y - cy, bl = q.life < 1.2 && ((G.time * 10) | 0) % 2; pxLine(x - 5, y + 2, x, y - 3, col(3)); pxLine(x + 5, y + 2, x, y - 3, col(3)); pxLine(x, y + 3, x, y - 3, col(3));
        rect(x - 4, y - 8, 8, 5, col(0)); rect(x - 3, y - 7, 6, 3, bl ? col(5) : '#8a7a50'); pxLine(x, y - 6, x + Math.cos(q.aim) * 7, y - 6 + Math.sin(q.aim) * 7, col(4), 2); rect(x - 1, y - 9, 2, 1, ((G.time * 4) | 0) % 2 ? C.red : col(2));
        for (let i = 0; i < 7; i++) rect(x - 4 + i, y + 4, 1, 1, i < Math.ceil(q.life) ? C.gold : col(2)); } });
  },
  gas(p, w, a, o) { const [x, y] = throwTo(p, a, 150, 40), dmg = wDmg(w, o);
    went({ sx: p.x, sy: p.y, x, y, cx: p.x, cy: p.y, st: 'fly', fuse: .4, R: 0, Rmax: 46 * sz(), life: 5, tk: 0, dmg, o, puffs: [],
      u(q, dt) { if (q.st === 'fly') { if (arcFly(q, dt, .38)) { q.st = 'fuse'; AU.play('crate', 1.8, .4); } return false; }
        if (q.st === 'fuse') { q.fuse -= dt; if (Math.random() < .6) part({ x: q.x, y: q.y - 2, vx: rand(-20, 20), vy: rand(-30, -10), life: .4, max: .4, c: '#9aaa4a', s: 1 }); if (q.fuse <= 0) { q.st = 'cloud'; AU.play('vortex', 1.4, .5); AU.play('venom', .7); } return false; }
        q.life -= dt; q.R = Math.min(q.Rmax, q.R + dt * q.Rmax / .8); q.tk -= dt;
        if (q.tk <= 0) { q.tk = .45; for (const e of liveFoes()) if (dist(e.x, e.y, q.x, q.y) < q.R + e.r) { hitEnemy(e, q.dmg, hitOpts(w, q.o, { knock: 0, quiet: true, color: C.lime, proc: .3, fromField: true })); if (!e.dead) { e.venom = Math.min(5, (e.venom || 0) + 1); e.venomT = 4; } } }
        if (q.puffs.length < 14 && Math.random() < .5) q.puffs.push({ a: rand(0, 6.28), r: rand(0, 1), s: rand(.5, 1), v: rand(-.4, .4) });
        return q.life <= 0; },
      dr(q, cx, cy) { if (q.st === 'fly') { const x = q.cx - cx, y = q.cy - cy; rect(x - 2, y - 3, 4, 6, col(0)); rect(x - 1, y - 2, 2, 4, C.lime); return; }
        const x = q.x - cx, y = q.y - cy; rect(x - 2, y - 2, 4, 5, col(0)); rect(x - 1, y - 1, 2, 3, '#6a7a3a'); if (q.st !== 'cloud') return;
        const k = Math.min(1, q.life / .8); for (const pf of q.puffs) { pf.a += pf.v * FRAME_DT; const rr = pf.r * q.R * .75; ctx.globalAlpha = .16 * k; disc(x + Math.cos(pf.a) * rr, y + Math.sin(pf.a) * rr * .7, q.R * .42 * pf.s, '#8a9a4a'); }
        ctx.globalAlpha = .1 * k; disc(x, y, q.R, '#6a7a3a'); ctx.globalAlpha = 1; } });
  },
  sonic(p, w, a, o) { const dmg = wDmg(w, o), c = o.ghost ? C.violet : '#c9a6ff';
    went({ x: p.x, y: p.y, a, R: 8, Rmax: 115 * sz(), arc: 1.15, hit: new Set(), dmg, o, c,
      u(q, dt) { q.R += dt * 270;
        for (const e of liveFoes()) { if (q.hit.has(e)) continue; const d = dist(q.x, q.y, e.x, e.y); if (d > q.R + e.r || d < q.R - 14 - e.r || Math.abs(angDiff(q.a, ang(q.x, q.y, e.x, e.y))) > q.arc / 2) continue;
          q.hit.add(e); const ka = ang(q.x, q.y, e.x, e.y); hitEnemy(e, q.dmg, hitOpts(w, q.o, { ka, knock: e.boss ? 0 : 340, color: q.c })); if (!e.dead && !e.boss) slamWatch(e, ka, q.dmg * .7, w, q.o); }
        for (let i = G.ebullets.length - 1; i >= 0; i--) { const b = G.ebullets[i], d = dist(q.x, q.y, b.x, b.y); if (b.delay > 0 || d > q.R + 3 || d < q.R - 14 || Math.abs(angDiff(q.a, ang(q.x, q.y, b.x, b.y))) > q.arc / 2) continue; G.ebullets.splice(i, 1); burst(b.x, b.y, 2, q.c, 50, .15); }
        return q.R >= q.Rmax; },
      dr(q, cx, cy) { const x = q.x - cx, y = q.y - cy, k = 1 - q.R / q.Rmax; ctx.strokeStyle = q.c; for (let i = 0; i < 3; i++) { const r = q.R - i * 5; if (r <= 2) continue; ctx.globalAlpha = (.9 - i * .28) * (.3 + .7 * k); ctx.lineWidth = i ? 1 : 2; ctx.beginPath(); ctx.arc(x, y, r, q.a - q.arc / 2, q.a + q.arc / 2); ctx.stroke(); } ctx.globalAlpha = 1; } });
    ringFx(p.x, p.y, 8, c, .2, 1);
  },
  barrage(p, w, a, o) { const [tx, ty] = aimPt(), D = clamp(dist(p.x, p.y, tx, ty), 70, 210), dmg = wDmg(w, o), R = 20 * sz();
    for (let i = 0; i < 4; i++) { const d = lerp(40, D, i / 3), x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d; if (shotBlocked(x, y)) continue;
      went({ x, y, delay: .4 + i * .22, R, dmg, done: false,
        u(q) { if (q.t < q.delay) return false; if (!q.done) { q.done = true; explode(q.x, q.y, q.R, q.dmg, { color: C.orange }); } return true; },
        dr(q, cx, cy) { const x2 = q.x - cx, y2 = q.y - cy, k = clamp(q.t / q.delay, 0, 1); ringC(x2, y2, q.R, ((G.time * 14) | 0) % 2 ? C.orange : col(3), 1); ringC(x2, y2, Math.max(1, q.R * (1 - k)), C.orange, 1);
          const sy = y2 - (1 - k) * 160; if (k > .3) { rect(x2 - 1, sy - 5, 3, 6, col(0)); rect(x2, sy - 4, 1, 4, col(4)); } } }); }
    AU.play('lob', .8);
  },
  sticky(p, w, a, o, mx, my) { const dmg = wDmg(w, o);
    const attach = (host, x, y) => { AU.play('stick', .8); went({ host, x, y, ig: .35, life: 3.35, R: 20 * sz(), tk: 0, dmg, o,
      u(q, dt) { if (q.host && !q.host.dead) { q.x = q.host.x; q.y = q.host.y; } else q.host = null; q.life -= dt; if (q.t < q.ig) return false;
        if (!q.lit) { q.lit = true; AU.play('burn', .7); AU.play('flame', .6); }
        q.tk -= dt; if (q.tk <= 0) { q.tk = .2; for (const e of liveFoes()) if (dist(e.x, e.y, q.x, q.y) < q.R + e.r) { hitEnemy(e, q.dmg, hitOpts(w, q.o, { knock: 0, quiet: true, color: C.orange, proc: .3, fromField: true })); if (!e.dead) { e.burn = Math.max(e.burn, 2); e.burnT = 2; } } }
        for (let i = 0; i < 2; i++) part({ x: q.x + rand(-3, 3), y: q.y - 2, vx: rand(-90, 90), vy: rand(-120, -20), life: .3, max: .3, c: Math.random() < .5 ? '#fff0c0' : C.orange, t: 'spark', drag: 3, grav: 200 });
        return q.life <= 0; },
      dr(q, cx, cy) { const x = q.x - cx, y = q.y - cy; if (q.t < q.ig) { rect(x - 2, y - 2, 4, 4, col(0)); if (((G.time * 16) | 0) % 2) rect(x - 1, y - 1, 2, 2, C.red); return; }
        const fl = .8 + Math.sin(G.time * 30) * .2; ctx.globalAlpha = .18; disc(x, y, q.R, C.orange); ctx.globalAlpha = .5; disc(x, y, q.R * .5 * fl, '#ffb040'); ctx.globalAlpha = 1; disc(x, y, 3 * fl, '#fff4d0'); } }); };
    wproj({ x: mx, y: my, a, vx: Math.cos(a) * 280, vy: Math.sin(a) * 280, r: 2.5, life: .55,
      onFoe(q, e) { attach(e, e.x, e.y); return true; }, onWall(q) { attach(null, q.x - Math.cos(q.a) * 4, q.y - Math.sin(q.a) * 4); return true; }, onEnd(q) { attach(null, q.x, q.y); return true; },
      dr(q, cx, cy) { const x = q.x - cx, y = q.y - cy; rect(x - 2, y - 2, 4, 4, col(0)); rect(x - 1, y - 1, 2, 2, C.orange); } });
  },
  parasite(p, w, a, o) { const [x, y] = throwTo(p, a, 140, 40), dmg = wDmg(w, o);
    went({ sx: p.x, sy: p.y, x, y, cx: p.x, cy: p.y,
      u(q, dt) { if (!arcFly(q, dt, .35)) return false; AU.play('crate', 1.6, .5); burst(q.x, q.y, 12, '#c8a040', 90, .35); splat(q.x, q.y, '#6a5a20', 6, 6); for (let i = 0; i < 5; i++) wasp(q.x, q.y, dmg, w, o); return true; },
      dr(q, cx, cy) { const x2 = q.cx - cx, y2 = q.cy - cy; rect(x2 - 3, y2 - 3, 6, 6, col(0)); rect(x2 - 2, y2 - 2, 4, 4, '#c8a040'); rect(x2 - 1, y2 - 1, 1, 1, col(0)); } });
  },
});
// parasitic wasps: they hunt, sting and infect; an infected foe that dies lets two more out
function wasp(x, y, dmg, w, o) { if ((G.went || []).filter(q => q.wasp).length >= 14) return; AU.play('ui', 2.2, .2);
  went({ wasp: true, x, y, vx: rand(-90, 90), vy: rand(-90, 90), life: 5, bt: 0, dmg, o, wob: rand(0, 6),
    u(q, dt) { q.life -= dt; q.bt -= dt; if (!q.tg || q.tg.dead) q.tg = nearestEnemy(q.x, q.y, 220);
      if (q.tg) { const a = ang(q.x, q.y, q.tg.x, q.tg.y) + Math.sin(G.time * 9 + q.wob) * .7; q.vx = lerp(q.vx, Math.cos(a) * 175, Math.min(1, dt * 5)); q.vy = lerp(q.vy, Math.sin(a) * 175, Math.min(1, dt * 5));
        if (dist(q.x, q.y, q.tg.x, q.tg.y) < q.tg.r + 3 && q.bt <= 0) { q.bt = .5; q.life -= 1.1; const e = q.tg; hitEnemy(e, q.dmg, hitOpts(w, q.o, { knock: 10, quiet: true, color: C.lime })); if (!e.dead) infect(e, q.dmg, w, q.o); } }
      else { q.vx *= Math.pow(.3, dt); q.vy *= Math.pow(.3, dt); }
      q.x += q.vx * dt; q.y += q.vy * dt; return q.life <= 0; },
    dr(q, cx, cy) { const x = Math.round(q.x - cx), y = Math.round(q.y - cy), fl = ((G.time * 30 + q.wob) | 0) % 2; rect(x - 1, y, 3, 1, '#c8a040'); rect(x, y, 1, 1, col(0)); if (fl) { rect(x - 1, y - 1, 1, 1, '#e8e8f0'); rect(x + 1, y - 1, 1, 1, '#e8e8f0'); } } });
}
function infect(e, dmg, w, o) { e.infT = G.time + 6; if (e.infTr) return; e.infTr = true;
  went({ e, tk: .5, dmg: dmg * .5, w, o, u(q, dt) { const f = q.e; if (f.dead) { for (let i = 0; i < 2; i++) wasp(f.x, f.y, dmg, w, o); burst(f.x, f.y, 10, C.lime, 80, .3); return true; }
      if (G.time > f.infT) { f.infTr = false; return true; } q.tk -= dt; if (q.tk <= 0) { q.tk = .5; hitEnemy(f, q.dmg, hitOpts(w, q.o, { knock: 0, quiet: true, color: C.lime, proc: 0, fromField: true })); } return false; },
    dr(q, cx, cy) { const f = q.e; if (f.dead) return; for (let i = 0; i < 3; i++) { const a = G.time * 3 + i * 2.1; rect(f.x - cx + Math.cos(a) * (f.r + 2), f.y - cy - 3 + Math.sin(a) * 3, 1, 1, C.lime); } } });
}
// ---- hold weapons ----
Object.assign(HOLD, {
  chainsaw(p, w, dt, held) { const S = G.S; p.csK = clamp((p.csK || 0) + (held ? dt / .35 : -dt * 3), 0, 1); if (!held || p.csK <= 0) return;
    const k = p.csK, a = p.aim, L4 = 25 * sz(), x1 = p.x + Math.cos(a) * 5, y1 = p.y + Math.sin(a) * 5, x2 = p.x + Math.cos(a) * L4, y2 = p.y + Math.sin(a) * L4;
    p.csT = (p.csT || 0) - dt; if (p.csT > 0) return; p.csT = .08; let any = false;
    for (const e of liveFoes()) { if (segDist(e.x, e.y, x1, y1, x2, y2) > e.r + 5) continue; e.rip = e.ripT > G.time - .3 ? Math.min(10, (e.rip || 0) + 1) : 1; e.ripT = G.time;
      hitEnemy(e, w.dmg * S.dmg * wlvMul(w) * (.4 + .6 * k) * (1 + .06 * e.rip), { melee: true, ka: a, knock: 20, proc: w.proc, quiet: true, color: '#b8262e' }); any = true;
      for (let i = 0; i < 2; i++) part({ x: e.x, y: e.y, vx: Math.cos(a + rand(2, 4.3)) * rand(60, 140), vy: Math.sin(a + rand(2, 4.3)) * rand(60, 140) - 30, life: .35, max: .35, c: i ? '#8a1820' : '#b8262e', grav: 300 }); }
    for (const pr of WORLD.props) if (!pr.dead && segDist(pr.x, pr.y, x1, y1, x2, y2) < pr.r + 4) damageProp(pr, w.dmg * S.dmg);
    if (G.ebullets.length) deflectBullets(p, b => segDist(b.x, b.y, x1, y1, x2, y2) < 5, null, false);
    part({ x: x2, y: y2, vx: Math.cos(a + 2.4) * 120, vy: Math.sin(a + 2.4) * 120, life: .15, max: .15, c: '#ffd070', t: 'spark', drag: 4 });
    if (!G.preview) AU.play('smg', any ? .42 : .34, any ? .55 : .3); if (any) shake(.02); },
  tether(p, w, dt, held) { const S = G.S; if (!held) { p.lch = null; p.lchK = 0; return; } const R = 125 * sz(); let L4 = p.lch;
    if (!L4 || L4.dead || dist(p.x, p.y, L4.x, L4.y) > R + 20 || !los(p.x, p.y, L4.x, L4.y)) { const tg = nearestEnemy(p.x, p.y, R, e => Math.abs(angDiff(p.aim, ang(p.x, p.y, e.x, e.y))) < .75 && los(p.x, p.y, e.x, e.y)); if (tg && tg !== L4) AU.play('stick', .7, .6); p.lch = L4 = tg; }
    if (!L4) { p.lchK = Math.max(0, (p.lchK || 0) - dt); return; }
    p.lchK = Math.min(1, (p.lchK || 0) + dt / 3); p.lchT = (p.lchT || 0) - dt;
    if (p.lchT <= 0) { p.lchT = .15; hitEnemy(L4, w.dmg * S.dmg * wlvMul(w) * (1 + 2 * p.lchK), { proc: w.proc, knock: 0, quiet: true, color: '#b8262e', ka: ang(p.x, p.y, L4.x, L4.y) });
      const a = ang(L4.x, L4.y, p.x, p.y), d = dist(p.x, p.y, L4.x, L4.y); part({ x: L4.x, y: L4.y, vx: Math.cos(a) * d * 3, vy: Math.sin(a) * d * 3, life: .3, max: .3, c: '#b8262e', s: 1 });
      if (!G.preview && Math.random() < .3) AU.play('venom', 1.2 + p.lchK * .6, .35); } },
});
// the extras drawn around the hero for these weapons (the chainsaw bar, the tube, the baton's stored charge)
const _drawHoldFx3 = drawHoldFx; drawHoldFx = function (p, cx, cy) { const w = WEAPONS[p.weapons[p.wi]];
  if (w && p.alive) { const x = p.x - cx, y = p.y - cy - 2;
    if (w.kind === 'chainsaw' && (p.csK || 0) > 0) { const a = p.aim, L4 = 25 * sz(), k = p.csK, j = (Math.random() - .5) * k, ex = x + Math.cos(a) * L4, ey = y + Math.sin(a) * L4 + j;
      pxLine(x + Math.cos(a) * 6, y + Math.sin(a) * 6, ex, ey, col(0), 3); pxLine(x + Math.cos(a) * 6, y + Math.sin(a) * 6, ex, ey, '#8a8a90', 1);
      const n = Math.floor(L4 / 3), off = (G.time * 40) % 3; for (let i = 0; i < n; i++) { const d = 6 + i * 3 + off, nx = -Math.sin(a) * 2, ny = Math.cos(a) * 2; rect(x + Math.cos(a) * d + nx - .5, y + Math.sin(a) * d + ny - .5, 1, 1, col(5)); rect(x + Math.cos(a) * d - nx - .5, y + Math.sin(a) * d - ny - .5, 1, 1, col(4)); } }
    if (w.kind === 'tether' && p.lch && !p.lch.dead) { const tx = p.lch.x - cx, ty = p.lch.y - cy, n = Math.max(4, Math.floor(dist(x, y, tx, ty) / 3));
      for (let i = 0; i <= n; i++) { const q = i / n, wv = Math.sin(q * 9 + G.time * 14) * 1.5 * (1 - Math.abs(q - .5) * 2); rect(lerp(x, tx, q) - .5, lerp(y, ty, q) + wv - .5, 2, 2, '#3a0a0e'); if ((i + ((G.time * 24) | 0)) % 4 === 0) rect(lerp(x, tx, q), lerp(y, ty, q) + wv, 1, 1, '#d8343e'); }
      ringC(tx, ty, (p.lch.r || 4) + 2 + p.lchK * 3, p.lchK > .95 ? C.red : '#8a1820', 1); }
    if (w.kind === 'baton') for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * .4; rect(Math.round(x + Math.cos(a) * 13) - 1, Math.round(y - 2 + Math.sin(a) * 13) - 1, 2, 2, i < (p.batN || 0) ? (p.batN >= 5 && ((G.time * 12) | 0) % 2 ? col(5) : C.cyan) : col(2)); } }
  _drawHoldFx3(p, cx, cy); };
// a sleeping foe does nothing until it is hit (any hit lands 2.5x and wakes it)
const _hitEnemyW3 = hitEnemy; hitEnemy = function (e, dmg, o = {}) { if (e && e.sleepT > G.time && !e.dead && !(e.spawnT > 0)) { e.sleepT = 0; dmg *= 2.5; floatText(e.x, e.y - e.r - 12, '!', C.violet, 2, .6); } return _hitEnemyW3(e, dmg, o); };
