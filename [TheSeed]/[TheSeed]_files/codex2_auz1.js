// ===== the archive: synergies, serums, weapons and the infected; a list down the left, the chosen entry on the right =====
'use strict';
const CX_TABS = ['cx_syn', 'cx_shards', 'cx_weapons', 'cx_enemies'];
const CX = { tab: 0, sel: [0, 0, 0, 0], top: [0, 0, 0, 0], hits: [], lmx: 0, lmy: 0, t: 0 };
let CXS = null; // what has been seen, kept in memory so spawning does not touch storage every time
function cxSeen(k) { if (!CXS) CXS = new Set(codexGet()); if (!CXS.has(k)) { CXS.add(k); codexAdd(k); } }
function cxKnows(k) { if (!ONDZ()) return true; if (!CXS) CXS = new Set(codexGet()); return CXS.has(k); } // outside DZMM everything is known (testing)
function openCodex(i) { CXS = new Set(codexGet()); CX.tab = i || 0; CX.t = 0; goPage('codex'); }

// ---- the infected: names and a line about each ----
const EINFO = {
  crawler: [N3('CRAWLER', '爬行者', '這い寄るもの'), N3('IT LOST ITS LEGS BUT NOT ITS HUNGER. FAST, LOW, NEVER STOPS.', '失去了雙腿，卻沒失去飢餓。貼著地面疾行，從不停下。', '脚を失っても飢えは失っていない。低く速く、止まらない。')],
  mini: [N3('PLAGUE RAT', '瘟疫鼠', '疫病ネズミ'), N3('SMALL, FAST AND NEVER ALONE. THEY POUR OUT OF THE SACS.', '體型小、速度快，從不單獨出現。會從膿囊裡湧出來。', '小さく速く、決して一匹では来ない。膿嚢から湧き出る。')],
  gunner: [N3('INFECTED SOLDIER', '感染士兵', '感染兵'), N3('IT STILL REMEMBERS HOW TO AIM. IT STOPS FOR A MOMENT BEFORE EACH SHOT.', '還記得怎麼瞄準。每次開火前都會停頓片刻。', 'まだ狙い方を覚えている。撃つ前に一瞬止まる。')],
  charger: [N3('MUTATED HOUND', '變異獵犬', '変異猟犬'), N3('IT LOWERS ITS HEAD, THEN CHARGES IN A STRAIGHT LINE. A WALL STUNS IT.', '先低頭蓄勢，再直線衝撞。撞上牆壁會暈眩。', '頭を下げてから一直線に突進する。壁に当たると気絶する。')],
  splitter: [N3('PUS SAC', '膿囊', '膿嚢'), N3('IT BURSTS INTO PLAGUE RATS WHEN IT DIES.', '死亡時會爆開，放出一群瘟疫鼠。', '死ぬと破裂し、疫病ネズミを撒き散らす。')],
  turret: [N3('SCRAP GUN', '拼裝機槍', '廃材の機銃'), N3('AN AUTO-GUN SOMEONE LEFT BEHIND. IT NEVER MOVES AND NEVER STOPS.', '不知是誰留下的自動機槍。不會移動，也不會停火。', '誰かが残した自動機銃。動かず、撃ち止まない。')],
  bomber: [N3('BOOMER', '膨脹者', '膨れ者'), N3('IT RUNS AT YOU AND BURSTS. KEEP YOUR DISTANCE.', '會衝向你然後爆開。保持距離。', '駆け寄って破裂する。距離を取れ。')],
  shielder: [N3('RIOT COP', '防暴警察', '機動隊員'), N3('STILL HOLDING THE RIOT SHIELD. HIT IT FROM THE SIDE OR FROM BEHIND.', '還舉著防暴盾。從側面或背後攻擊它。', 'まだ盾を構えている。横か背後から撃て。')],
  wisp: [N3('SPORE POD', '孢子囊', '胞子嚢'), N3('IT DRIFTS, FADES OUT, AND TURNS UP SOMEWHERE ELSE.', '飄浮著，消失，然後在別處出現。', '漂い、消え、別の場所に現れる。')],
  sniper: [N3('HOODED SNIPER', '兜帽狙擊手', 'フードの狙撃手'), N3('FIRST A LONG RED LINE, THEN THE SHOT. GET OUT OF THE LINE.', '先是一道長長的紅線，接著才是子彈。離開那條線。', 'まず長い赤い線、それから一発。線から離れろ。')],
  mortar: [N3('HAZMAT MORTAR', '防化迫擊手', '防護服の迫撃手'), N3('IT LOBS SHELLS OVER WALLS. WATCH THE MARKS ON THE FLOOR.', '越過牆壁拋射炮彈。注意地上的標記。', '壁越しに砲弾を放る。床の印に注意。')],
  warden: [N3('THE BRUTE', '巨型暴徒', '巨躯の暴徒'), N3('SLOW, HUGE AND HARD TO STOP. IT SENDS A RING OF FORCE AROUND ITSELF.', '緩慢、巨大、難以阻擋。會在身邊釋放一圈衝擊。', '遅く巨大で止めにくい。周囲に衝撃の輪を放つ。')],
  echo: [N3('SHRIEKER', '尖嘯者', '叫ぶもの'), N3('A PALE THING THAT CIRCLES YOU AND SCREAMS BULLETS.', '繞著你盤旋的蒼白之物，尖嘯著噴出子彈。', '周りを回りながら弾を叫び出す、青白いもの。')],
  healer: [N3('FIELD MEDIC', '戰地醫護', '野戦衛生兵'), N3('IT KEEPS PATCHING UP THE OTHERS. KILL IT FIRST.', '會不停替同伴治療。優先擊殺。', '仲間を治し続ける。先に倒せ。')],
  spinner: [N3('THRASHER', '絞刃者', '斬り回るもの'), N3('ITS ARMS ARE BONE BLADES NOW. IT SPINS INTO YOU.', '雙臂已經化為骨刃，會旋轉著撞向你。', '腕は骨の刃と化した。回転しながら突っ込んでくる。')],
  archer: [N3('CROSSBOWMAN', '弩手', '弩兵'), N3('IT FIRES BOLTS IN SPREADS FROM A DISTANCE.', '從遠處扇形射出弩箭。', '遠くから扇状に矢を放つ。')],
  bombard: [N3('GRENADIER', '擲彈兵', '擲弾兵'), N3('A GAS MASK AND A CANISTER ON ITS BACK. IT THROWS WHAT IT CARRIES.', '戴著防毒面具，背著罐子。會把背上的東西扔過來。', 'ガスマスクに背中の缶。背負ったものを投げてくる。')],
  empower: [N3('SCREAMER', '狂嘯者', '煽るもの'), N3('ITS SCREAM DRIVES THE INFECTED AROUND IT INTO A FRENZY.', '它的尖叫會讓周圍的感染者陷入狂暴。', 'その叫びは周りの感染者を狂わせる。')],
  // champions
  ashbrute: [null, N3('A TANK OF SWOLLEN MUSCLE. SLOW, BUT EVERY STEP SHAKES THE ROOM.', '一團膨脹的肌肉。動作緩慢，但每一步都讓房間震動。', '膨れ上がった筋肉の塊。遅いが、一歩ごとに部屋が揺れる。')],
  cinder: [null, N3('STILL BURNING. IT LEAVES FIRE WHEREVER IT FLOATS.', '仍在燃燒。飄到哪裡，火就燒到哪裡。', 'まだ燃えている。漂った先に火を残す。')],
  gravekeep: [null, N3('IT KEPT THE MORGUE LONG AFTER IT FILLED UP. IT STILL CARRIES THE LANTERN.', '停屍間早就滿了，它還在看守。手裡仍提著燈。', '霊安室が満杯になっても番を続けた。今もランタンを提げている。')],
  stormcoil: [null, N3('A SPECIMEN STILL INSIDE ITS CHARGED TANK.', '一個仍被關在帶電容器裡的樣本。', '帯電した槽の中にまだいるサンプル。')],
  arcknight: [null, N3('A SECURITY GUARD, MUTATED. IT STILL SWINGS A LIVE BATON.', '變異的保安。仍揮舞著帶電的警棍。', '変異した警備員。今も電気警棒を振るう。')],
  herald: [null, N3('A CRACKED BATTERY PACK ON ITS BACK. SPARKS EVERYWHERE.', '背著一個破裂的電池組，四處迸出電火花。', '背中に割れたバッテリー。辺りに火花を散らす。')],
  hollowmaw: [null, N3('MOSTLY MOUTH.', '幾乎只剩一張嘴。', 'ほとんど口だけ。')],
  matron: [null, N3('SHE CARRIES HER BROOD IN SACS ON HER BACK.', '把卵囊背在背上的母體。', '背中の嚢に子を抱える母体。')],
  seer: [null, N3('EYES EVERYWHERE. IT SEES WHERE YOU ARE GOING TO BE.', '全身都是眼睛。它看得見你下一步會在哪裡。', '全身に目。次に君がどこにいるかが見えている。')],
  veilknight: [null, N3('IT MOVES IN THE FOG. ITS FRONT IS SHIELDED.', '在霧中移動，正面有護盾。', '霧の中を動く。正面は盾で守られている。')],
  weaver: [null, N3('IT WEAVES SPORES INTO THE AIR.', '把孢子織進空氣裡。', '胞子を空気に織り込む。')],
  thorn: [null, N3('A GROWTH OF THORNS THAT KEEPS SPREADING.', '一團不斷蔓延的荊棘增生。', '広がり続ける茨の増殖体。')],
  prismguard: [null, N3('THE LAB\'S LAST WORKING GUARD. STILL ON DUTY.', '實驗室最後一台還能運作的警衛。仍在執勤。', '研究所で最後に動いている警備機。今も勤務中。')],
  corehulk: [null, N3('FLESH GROWN AROUND A GLOWING CORE.', '圍著發光核心長出來的血肉。', '光る核の周りに育った肉。')],
  nullpriest: [null, N3('ONE OF THE RESEARCHERS. STILL WEARING THE COAT.', '曾是研究員之一，身上還穿著白袍。', 'かつての研究員。今も白衣を着ている。')],
};
const BINFO = {
  monolith: N3('THE THING IN THE SEALED POD. ITS SKIN HAS TURNED TO STONE.', '隔離艙裡的東西。皮膚已經化為石頭。', '隔離槽の中のもの。皮膚は石と化した。'),
  crown: N3('THE HEAD OF THE HIVE. EVERYTHING HERE SERVES HER.', '寄生群的首領。這裡的一切都為她服務。', '寄生群の頭。ここの全てが彼女に仕える。'),
  eraser: N3('SUBJECT ONE. IT WATCHES.', '一號觀察體。它在看著。', '観察体一号。見ている。'),
  arbiter: N3('THE DIRECTOR, INFECTED. STILL GIVING ORDERS.', '被感染的所長。仍在下達命令。', '感染した所長。今も命令を下している。'),
  absence: N3('WHERE THE OUTBREAK BEGAN.', '一切異變開始的地方。', '異変が始まった場所。'),
  kiln: N3('BORN IN THE INCINERATOR. IT NEVER COOLED DOWN.', '在焚化間裡誕生，從未冷卻。', '焼却室で生まれ、冷めることはなかった。'),
  dynamo: N3('IT LIVES IN THE POWER ROOM AND FEEDS ON THE CURRENT.', '棲息在配電室，以電流為食。', '配電室に棲み、電流を喰らう。'),
  chasm: N3('THE SUNKEN CULTURE TANK OPENED ITS MOUTH.', '沉沒的培養池張開了嘴。', '沈んだ培養槽が口を開けた。'),
  codex: N3('IT REWRITES THE RECORDS SO NO ONE WILL KNOW WHAT HAPPENED.', '它篡改記錄，讓沒有人知道發生過什麼。', '何が起きたか誰にも分からぬよう、記録を書き換える。'),
  pale: N3('THE HERALD OF THE BLIGHT.', '疫病的先驅。', '疫病の先触れ。'),
};
// ---- where each weapon came from: a line of its story ----
const WBLURB = {
  nail: N3('OLD ZHOU IN WAREHOUSE 3 NAILED HIS DOOR SHUT THREE TIMES OVER WITH THIS. THE DOOR GAVE IN THE END. THE GUN IS ALL HE LEFT.', '三號倉庫的老周用它把門釘死了三層。門最後還是被撞開了，他只留下了這把槍。', '第三倉庫の周じいさんはこれで扉を三重に打ち付けた。それでも扉は破られ、残ったのはこの銃だけだった。'),
  hail: N3('THE SOLDIER ON THE CORDON KEPT THE TRIGGER DOWN UNTIL THE BELT RAN OUT. WHEN THE ARMY PULLED BACK, NOBODY CAME FOR THE GUN.', '封鎖線上的士兵一直扣著扳機，直到彈鏈打空。軍隊撤走的時候，沒有人回來收它。', '封鎖線の兵士は弾帯が尽きるまで引き金を引き続けた。軍が撤退した時、誰も銃を回収に来なかった。'),
  storm: N3('IT WAS MOUNTED ON AN ARMORED CAR THAT FLIPPED UNDER THE OVERPASS. THE GUNNER NEVER CLIMBED OUT. THE BARRELS WERE STILL WARM.', '它原本裝在一輛裝甲車頂上。車翻在高架橋下，炮手沒能爬出來，槍管卻還是熱的。', '装甲車の屋根に据え付けられていた。車は高架下で横転し、銃手は出てこなかった。銃身はまだ温かかった。'),
  scatter: N3('THE FARMER SAWED THE BARREL SHORT SO HE COULD TURN AROUND INDOORS. HE HELD HIS BARN FOR ELEVEN DAYS.', '農場主把槍管鋸短，說這樣在屋裡比較好轉身。他守住自家穀倉整整十一天。', '農場主は屋内で取り回せるよう銃身を切り詰めた。彼は自分の納屋を十一日間守り抜いた。'),
  rail: N3('A LAB PROTOTYPE. THE MANUAL SAYS "NEVER FIRE AT A PERSON." THE MAN WHO WROTE THAT LINE IS NOT ONE ANYMORE.', '實驗室的原型機，說明書上寫著「禁止對人使用」。寫下這行字的人，已經不算是人了。', '研究所の試作機。説明書には「人に向けて撃つな」とある。それを書いた男は、もう人ではない。'),
  prism: N3('PULLED OFF A CUTTING RIG IN THE UNDERGROUND PLANT. THE WORKERS SPENT THEIR LAST SHIFT CUTTING A WAY THROUGH THE BLAST DOOR.', '從地下工廠的切割機上拆下來的。工人們最後一次加班，是用它在封鎖門上切出一條路。', '地下工場の切断機から外したもの。工員たちの最後の残業は、これで封鎖扉に道を切り開くことだった。'),
  volt: N3('A GUARD\'S STUN GUN, REWIRED TO DROP A COW. THE MAN WHO DID IT SAID: "THEY ARE HARDER TO KILL THAN COWS."', '保全隊員的電擊槍，後來被人改到足以讓一頭牛倒下。改裝的人說：「它們比牛難殺。」', '警備員のスタンガンを、牛が倒れるほどに改造したもの。改造した男は言った。「奴らは牛より死ににくい」'),
  edge: N3('THE BUTCHER\'S CLEAVER FROM THE WET MARKET. THIRTY YEARS OF PORK BONES, HE SAID, AND HE NEVER THOUGHT THE LAST THING HE CUT WOULD BE HIS NEIGHBORS.', '菜市場肉攤老闆的砍刀。他說砍了三十年豬骨，從沒想過最後要砍的會是鄰居。', '市場の肉屋の鉈。三十年豚の骨を叩き切ってきたが、最後に切るのが隣人だとは思わなかったと彼は言った。'),
  lance: N3('THE KIDS AT THE SHELTER LASHED A BAYONET TO A CLOTHES POLE AND TAUGHT EACH OTHER TO STAB THROUGH THE GAPS IN THE FENCE.', '避難所的孩子們把刺刀綁在晾衣桿上，互相教對方怎麼從柵欄縫裡往外刺。', '避難所の子供たちは銃剣を物干し竿に括り付け、柵の隙間から突く方法を教え合った。'),
  whirl: N3('A MARTIAL ARTS COACH\'S PRIZE PIECE. HE SWUNG IT IN THE GYM ALL NIGHT. BY DAWN NOTHING IN THERE WAS STANDING.', '一位武術教練的收藏品。他在體育館裡揮著它守了一整夜，天亮時，館裡沒有一個東西還站著。', '武術の師範の愛蔵品。彼は体育館で一晩中これを振るい、夜明けには立っているものは何もなかった。'),
  halo: N3('A SAWMILL BLADE, GROUND SHARPER. THE GIRL WHO THREW IT ALWAYS SAID WHATEVER YOU THROW HAD BETTER COME BACK.', '鋸木廠的圓鋸片，又被磨得更利。扔它的那個女孩總說，扔出去的東西最好自己會回來。', '製材所の丸鋸刃をさらに研いだもの。投げていた少女はいつも、投げたものは戻ってきてほしいと言っていた。'),
  bloom: N3('THE LAST LAUNCHER CARRIED OUT OF THE ARMORY IN THE RETREAT. WHEN THE FIRST ROUND WENT OFF, SOMEONE SAID IT LOOKED LIKE NEW YEAR.', '撤退時從軍火庫裡帶出來的最後一具火箭筒。第一發炸開的時候，有人說像在過年。', '撤退時に武器庫から持ち出した最後のランチャー。最初の一発が炸裂した時、誰かが正月みたいだと言った。'),
  cluster: N3('EVIDENCE FROM THE BOMB SQUAD, MEANT TO BE DESTROYED. THERE IS NO ONE LEFT AT THE DISPOSAL SITE.', '拆彈小組的證物，本來該送去銷毀。銷毀場已經沒有人了。', '爆発物処理班の証拠品で、廃棄されるはずだった。処分場にはもう誰もいない。'),
  bow: N3('THE ARCHERY CLUB CAPTAIN KEPT IT ON THE CLUBROOM WALL. AFTER THE POWER WENT OUT, IT WAS THE ONLY WEAPON THAT DID NOT NEED ANY.', '射箭社的社長把它掛在社辦牆上。停電之後，它成了唯一不需要電的武器。', 'アーチェリー部の部長が部室の壁に掛けていた。停電の後、電気のいらない唯一の武器になった。'),
  splinter: N3('A VET\'S DART GUN FOR SEDATING LARGE ANIMALS. SOMEONE SWAPPED IN NEEDLES THAT BURST.', '獸醫用來給大型動物打麻醉的針槍，被人換上了會炸開的針頭。', '獣医が大型動物の麻酔に使っていた銃。誰かが破裂する針に付け替えた。'),
  flamer: N3('THE QUARANTINE SQUAD BURNED WHOLE STREETS OF BODIES WITH IT. LATER THE SQUAD BECAME SOMETHING THAT NEEDED BURNING TOO.', '防疫隊用它燒過整條街的屍體。後來，防疫隊自己也成了要被燒掉的東西。', '防疫隊はこれで通り一つ分の死体を焼いた。やがて防疫隊自身も焼かれる側になった。'),
  graviton: N3('A DEVICE FROM THE CORE LAB. NO MANUAL, ONLY A NOTE: "WHATEVER YOU DO, DO NOT OPEN STAGE TWO."', '從核心實驗室帶出來的裝置，沒有說明書，只有一張便條：「千萬別打開第二段。」', '中枢研究所から持ち出した装置。説明書はなく、メモが一枚。「第二段だけは絶対に開けるな」'),
  whip: N3('STEEL CABLE CUT FROM AN ELEVATOR AND WRAPPED IN BARBED WIRE. THE ELEVATOR IS STILL STOPPED ON THE SEVENTH FLOOR, DOORS OPEN.', '從電梯上拆下的鋼纜，被人纏上了鐵絲。那部電梯還停在七樓，門一直開著。', 'エレベーターから切り取った鋼索に鉄条網を巻いたもの。そのエレベーターは今も七階で扉を開けたまま止まっている。'),
  hammer: N3('THE DEMOLITION CREW\'S SLEDGE, MEANT FOR TEARING DOWN ILLEGAL EXTENSIONS. NOW IT TEARS DOWN SOMETHING ELSE.', '拆遷隊的大鎚，本來是用來拆違建的。現在拆的是另一種東西。', '解体業者の大槌。違法建築を壊すためのものだった。今は別のものを壊している。'),
  shuriken: N3('A SCHOOLBOY CUT THESE OUT OF SHEET METAL. HE PRACTICED FOR YEARS AS A KID AND NEVER THOUGHT HE WOULD REALLY NEED IT.', '一個中學生用鐵皮剪出來的飛鏢。他說小時候練了好幾年，從沒想過真的會用上。', '中学生がトタンを切って作った手裏剣。何年も練習したが、本当に使う日が来るとは思わなかったという。'),
  twin: N3('THE SIDEARMS OF TWO PATROL OFFICERS. THEY FELL AT THE SAME INTERSECTION, AND THE GUNS LANDED TOGETHER.', '兩名巡警各自的配槍。他們倒在同一個路口，兩把槍落在一起。', '二人の巡査それぞれの拳銃。二人は同じ交差点で倒れ、銃は寄り添うように落ちていた。'),
  rivet: N3('A RIVET GUN FROM THE BUILDING SITE. THE FOREMAN SAID ONCE IT IS IN A STEEL BEAM IT NEVER COMES OUT, LET ALONE BONE.', '工地的鉚釘槍。工頭說這東西打進鋼樑都拔不出來，更別說是骨頭。', '工事現場のリベット銃。現場監督いわく、鉄骨に打てば二度と抜けない。骨なら言うまでもない。'),
  helix: N3('THE LAST TRIAL BATCH OFF THE ARSENAL LINE. IT NEVER EVEN GOT A MODEL NUMBER.', '兵工廠流水線上的最後一批試產品，連型號都還沒定下來。', '兵器工場のラインから出た最後の試作品。型番すら決まっていなかった。'),
  mirage: N3('STOLEN OUT OF THE CORE LAB. AFTER YOU FIRE IT, YOU ALWAYS FEEL ANOTHER YOU IS STANDING BEHIND YOU.', '被人從核心實驗室偷出來的東西。開槍之後，總覺得身後還站著另一個自己。', '中枢研究所から盗み出されたもの。撃った後、背後にもう一人の自分がいる気がしてならない。'),
  saw: N3('A FIRE RESCUE SAW. ONCE THE BLADE WORKED LOOSE THEY JUST STARTED FIRING IT. THE FIREMEN CALLED IT THEIR LAST RESCUE.', '消防隊的破拆電鋸，鋸片鬆脫之後就乾脆射出去。消防員們說，這是他們最後一次救援。', '消防の破壊用チェーンソー。刃が外れてからはそのまま撃ち出した。消防士たちはそれを最後の救助と呼んだ。'),
  longshot: N3('A SNIPER HELD THE CLOCK TOWER FOR TWENTY DAYS, CUTTING A NOTCH IN THE STOCK EACH DAY. THE LAST NOTCH IS VERY SHALLOW.', '一名狙擊手在鐘樓上守了二十天，每天在槍托上刻一道。最後一道刻得很淺。', '狙撃手は時計塔で二十日間持ちこたえ、毎日銃床に刻みを入れた。最後の刻みはとても浅い。'),
  nova: N3('AN EMERGENCY UNIT FROM THE SUBSTATION, MEANT TO PROTECT THE NIGHT OPERATOR. HE PRESSED THE BUTTON WHEN THEY HAD HIM SURROUNDED.', '變電站的應急裝置，原本是用來保護值班員的。值班員按下按鈕的時候，已經被包圍了。', '変電所の非常装置で、当直員を守るためのものだった。当直員がボタンを押したのは、囲まれた時だった。'),
  mines: N3('AN OLD VETERAN PLANTED MINES IN HIS OWN YARD, IN NEAT ROWS, LIKE VEGETABLES.', '一個老兵把地雷埋在自家院子裡，整整齊齊，像種菜一樣。', '老兵が自宅の庭に地雷を埋めた。野菜を植えるように整然と。'),
  hive: N3('DELIVERY DRONES FROM A COURIER FIRM, REPROGRAMMED. THEY ARE STILL LOOKING FOR THE RECIPIENT.', '物流公司的送貨無人機，被人重寫了程式。它們到現在還在找收件人。', '宅配会社の配達ドローンをプログラムし直したもの。今も受取人を探している。'),
  frostbite: N3('A LIQUID NITROGEN TANK FROM THE COLD STORE, FITTED WITH A NOZZLE. THE COLD STORE HELD THE SAMPLES. IT IS EMPTY NOW.', '冷凍庫裡的液氮罐接上了噴嘴。那個冷凍庫原本放著樣本，現在空了。', '冷凍庫の液体窒素タンクにノズルを付けたもの。冷凍庫には検体が保管されていた。今は空だ。'),
  iai: N3('AN OLD SWORD FROM A MUSEUM CASE, THE GLASS SMASHED. WHOEVER TOOK IT NEVER WALKED OUT OF THAT STREET.', '博物館展櫃裡的古刀，玻璃被砸碎了。拿走它的人，再也沒有走出那條街。', '博物館の展示ケースにあった古刀。ガラスは割られていた。持ち去った者は、あの通りから二度と出てこなかった。'),
  fist: N3('THE UNDERGROUND RING\'S CHAMPION WRAPPED NAILS AROUND HIS FISTS. HE FOUGHT ALL HIS LIFE, HE SAID. THE LAST FIGHT HAD NO REFEREE.', '地下拳場的冠軍把鐵釘纏在拳頭上。他說他打了一輩子架，最後一場沒有裁判。', '地下闘技場の王者が拳に釘を巻いたもの。一生殴り合ってきたが、最後の試合には審判がいなかったという。'),
  carom: N3('THE POOL HALL OWNER\'S PRIVATE MODIFIED GUN. GET THE ANGLE RIGHT, HE SAID, AND ONE SHOT CLEARS THE TABLE.', '撞球館老闆私藏的改裝槍。他說角度算對了，一發就能清台。', 'ビリヤード場の主人が隠し持っていた改造銃。角度さえ合えば、一発で台を空にできると彼は言った。'),
  crescent: N3('A REAL BLADE FROM A THEATER PROP ROOM. TEN YEARS PLAYING THE VILLAIN. IN ITS LAST PERFORMANCE IT FINALLY DREW BLOOD.', '劇團道具間裡的一把真刀，演了十年反派。最後一場戲，它終於見了血。', '劇団の小道具部屋にあった本物の刀で、十年間悪役を演じてきた。最後の舞台で、ついに血を見た。'),
  trident: N3('A FISHING SPEAR FROM THE HARBOR VILLAGE. NONE OF THE BOATS CAME BACK, SO THE PEOPLE ON SHORE USED IT ON WHAT WALKED UP OUT OF THE WATER.', '漁村的魚叉。出海的船一艘也沒回來，岸上的人只好拿它對付從水裡走上岸的東西。', '漁村の銛。沖に出た船は一隻も戻らず、岸の者たちは海から上がってくるものにこれを使った。'),
  firework: N3('FIREWORKS MEANT FOR NEW YEAR\'S EVE. THAT YEAR THERE WAS NO NEW YEAR.', '本來要在跨年夜放的煙火。那一年，沒有跨年。', '大晦日に打ち上げるはずだった花火。その年、年は越せなかった。'),
  scythe: N3('THE OLD WOMAN USED IT EVERY YEAR FOR THE RICE HARVEST. THIS YEAR WHAT GREW IN THE FIELD WAS NOT RICE.', '老婆婆每年都用它收稻子。今年田裡長出來的，不是稻子。', 'おばあさんが毎年稲刈りに使っていた鎌。今年、田んぼに生えてきたのは稲ではなかった。'),
  hook: N3('A TOW TRUCK DRIVER\'S HOOK. HE SAID THEY WERE A LOT EASIER TO HAUL THAN ILLEGALLY PARKED CARS.', '拖吊車司機的鉤子。他說這些東西比違停的車好拖多了。', 'レッカー車の運転手のフック。違法駐車の車よりずっと引きやすいと彼は言った。'),
  aegis: N3('A RIOT SHIELD SOMEONE COVERED IN BROKEN MIRROR. THEY SAY THOSE THINGS ARE AFRAID OF SEEING THEMSELVES.', '防暴警察的盾，有人在上面貼滿了碎鏡子。聽說那些東西害怕看見自己。', '機動隊の盾に、誰かが割れた鏡を貼り詰めた。あいつらは自分の姿を見るのを怖がるという噂だ。'),
  rod: N3('A WEATHER STATION RESEARCHER\'S LIGHTNING ROD. ON THE NIGHT OF THE STORM HE STOOD ON THE ROOF AND DREW THE LIGHTNING ONTO THE THINGS OUTSIDE.', '氣象站研究員的避雷針。暴風雨那晚，他站在屋頂上，把雷引向了外面的東西。', '気象観測所の研究員の避雷針。嵐の夜、彼は屋根に立ち、外のものに雷を落とした。'),
  strike: N3('A MILITARY RADIO. PRESS THE KEY AND SOMETHING FALLS FROM THE SKY. NO ONE KNOWS WHO IS STILL UP THERE ANSWERING.', '一台軍用通訊器，按下去就會有東西從天上落下來。沒人知道上面還有誰在回應。', '軍用の通信機。押せば空から何かが落ちてくる。上で誰がまだ応答しているのか、誰も知らない。'),
  summon: N3('AN OLD DOG GUARDED THE SPOT WHERE ITS OWNER FELL UNTIL IT FELL TOO. THEN IT GOT BACK UP.', '一隻老狗守著主人倒下的地方，直到牠自己也倒下。後來，牠又站了起來。', '老犬は主人が倒れた場所を守り続け、やがて自分も倒れた。そして、また起き上がった。'),
  net: N3('THE ZOO\'S CAPTURE NET GUN. THE ANIMALS ARE LONG GONE, BUT THE NETS ARE STILL IN USE.', '動物園的捕獸網槍。園裡的動物早就不見了，網卻一直用到現在。', '動物園の捕獲網銃。動物たちはとうにいないが、網は今も使われている。'),
  fissure: N3('A SURVEY TEAM\'S SEISMIC HAMMER. THE CITY WAS ALREADY CRACKED UNDERNEATH, THE TEAM LEADER SAID. HE ONLY MADE IT VISIBLE.', '地質隊的震源錘。隊長說，這座城市底下早就裂開了，他只是讓裂縫被看見而已。', '地質調査隊の震源ハンマー。隊長いわく、この街の下はとうに裂けていた。彼はその亀裂を見えるようにしただけだ。'),
  sweep: N3('THE HARBOR LIGHTHOUSE LAMP, TURNED UP UNTIL IT SCORCHES FLESH. THE KEEPER SAID THE SHIPS DO NOT NEED IT ANYMORE.', '港口燈塔的探照燈，被調到足以燒焦皮肉的強度。燈塔守說，船已經用不著它了。', '港の灯台のサーチライトを、肉を焦がすほどに強めたもの。灯台守は、もう船には必要ないと言った。'),
  recall: N3('A CIRCUS KNIFE THROWER\'S BLADES ON FINE STEEL WIRE. HE NEVER MISSED, AND HE DID NOT MISS THIS TIME EITHER.', '馬戲團飛刀手的刀，綁著細鋼絲。他從來沒有失手過，這一次也一樣。', 'サーカスのナイフ投げの刃に細い鋼線を結んだもの。彼は一度も外したことがなく、今回も同じだった。'),
  vacuum: N3('THE INDUSTRIAL VACUUM FROM THE HOSPITAL\'S BIOHAZARD ROOM. THE CLEANER SAID IT WAS BETTER AT THE MOVING THINGS THAN THE MESS ON THE FLOOR.', '醫院污染處理室的工業吸塵器。清潔工說，比起地上的髒東西，它更擅長吸走會動的。', '病院の汚染処理室の業務用掃除機。清掃員いわく、床の汚れより動いているものを吸う方が得意だ。'),
  wall: N3('A BLAST-FREEZER GUN FROM THE FROZEN FOOD PLANT. THE WORKERS RAISED WALLS OF ICE AT THE DOOR TO HOLD OUT UNTIL THE RESCUE CAME. IT NEVER CAME.', '冷凍食品廠的急凍噴槍。工人們用它在門口築起冰牆，想撐到救援來的那天。救援沒有來。', '冷凍食品工場の急速冷凍ガン。工員たちは扉に氷の壁を築き、救助が来る日まで耐えた。救助は来なかった。'),
  flail: N3('A BLACKSMITH\'S COUNTERWEIGHT ON A CHAIN. THE HEAVIEST THING IN TOWN, HE SAID, SHOULD LAND WHERE IT IS NEEDED MOST.', '鐵匠用鐵鍊拴住的秤砣。他說，這城裡最重的東西，就該砸在最該砸的地方。', '鍛冶屋が鎖に繋いだ分銅。この街で一番重いものは、一番必要な所に落とすべきだと彼は言った。'),
};
const CX_FOES = ['crawler', 'mini', 'gunner', 'charger', 'splitter', 'turret', 'bomber', 'shielder', 'wisp', 'sniper', 'mortar', 'warden', 'echo', 'healer', 'spinner', 'archer', 'bombard', 'empower',
  'runner', 'bloater', 'screamer', 'boneshot', 'swarm', 'digger', 'tongue', 'pouncer', 'spitter', 'weeper'];
function cxEnemies() {
  if (CX.elist) return CX.elist; const out = [];
  for (const id of CX_FOES) if (ESPR[id] && (EINFO[id] || ETYPES[id].info)) { const inf = () => EINFO[id] || ETYPES[id].info; out.push({ k: 'e:' + id, kind: ETYPES[id].special ? 'special' : 'foe', id, n: () => tr(inf()[0]), d: () => tr(inf()[1]), hp: ETYPES[id].hp }); }
  for (const f of CHAMPS) for (const c of f) out.push({ k: 'e:' + c.id, kind: 'champ', id: c.id, n: () => tr(c.n), d: () => EINFO[c.id] ? tr(EINFO[c.id][1]) : '', hp: c.hp });
  const bs = [...BOSSES.slice(0, 5).map((d, i) => ({ d, look: i })), ...(typeof BOSSES_ALT !== 'undefined' ? BOSSES_ALT.map(d => ({ d, look: d.look })) : [])];
  for (const { d, look } of bs) out.push({ k: 'b:' + d.key, kind: 'boss', id: d.key, def: d, look, n: () => tr(d.name), d: () => BINFO[d.key] ? tr(BINFO[d.key]) : '', hp: d.hp });
  return CX.elist = out;
}
function cxItems(tab) {
  if (tab === 0) return SYNERGIES.map(s => ({ k: s.id, s, n: () => tr(s.n) }));
  if (tab === 1) return SHARDS.map(s => ({ k: 's:' + s.id, sh: s, n: () => sname(s) }));
  if (tab === 2) return WEAPON_IDS.map(id => ({ k: 'w:' + id, w: id, n: () => wname(id) }));
  return cxEnemies();
}
// ---- layout ----
const CXL = () => { const x0 = 30, y0 = 38, lw = W < 440 ? 100 : 118, bot = H - 18; return { list: { x: x0, y: y0, w: lw, h: bot - y0 }, det: { x: x0 + lw + 8, y: y0, w: W - 30 - (x0 + lw + 8), h: bot - y0 }, rh: 13 }; };
function cxRows() { const l = CXL(); return Math.max(1, Math.floor((l.list.h - 4) / l.rh)); }
function cxPick(i) { const n = cxItems(CX.tab).length; i = clamp(i, 0, n - 1); if (i === CX.sel[CX.tab]) return; CX.sel[CX.tab] = i; const r = cxRows(); if (i < CX.top[CX.tab]) CX.top[CX.tab] = i; if (i >= CX.top[CX.tab] + r) CX.top[CX.tab] = i - r + 1; AU.play('menu'); }
function cxTab(i) { CX.tab = (i + 4) % 4; CX.t = 0; AU.play('menu', 1.1); }
function updateCodex(rdt) {
  CX.t += rdt; const l = CXL(), items = cxItems(CX.tab), r = cxRows(), mx = Input.mx, my = Input.my;
  if (pressed('KeyA') || pressed('ArrowLeft') || pressed('KeyQ')) cxTab(CX.tab - 1);
  if (pressed('KeyD') || pressed('ArrowRight') || pressed('KeyE')) cxTab(CX.tab + 1);
  if (pressed('KeyW') || pressed('ArrowUp')) cxPick(CX.sel[CX.tab] - 1);
  if (pressed('KeyS') || pressed('ArrowDown')) cxPick(CX.sel[CX.tab] + 1);
  if (Input.wheel && inR(l.list, mx, my)) CX.top[CX.tab] = clamp(CX.top[CX.tab] + Input.wheel * 2, 0, Math.max(0, items.length - r));
  else if (Input.wheel) cxPick(CX.sel[CX.tab] + Input.wheel);
  if (Input.clicked) { for (const h of CX.hits) if (inR(h, mx, my)) { Input.clicked = false; h.f(); break; } }
  if (Input.clicked && inR(l.list, mx, my)) { Input.clicked = false; CX.drag = { y: my, top: CX.top[CX.tab], moved: false, row: CX.top[CX.tab] + Math.floor((my - l.list.y - 2) / l.rh) }; }
  if (CX.drag) { const d = CX.drag; if (Math.abs(my - d.y) > 4) d.moved = true; if (d.moved) CX.top[CX.tab] = clamp(Math.round(d.top - (my - d.y) / l.rh), 0, Math.max(0, items.length - r));
    if (!Input.down) { if (!d.moved && d.row >= 0 && d.row < items.length) cxPick(d.row); CX.drag = null; } }
  if (pressed('Escape')) backPage();
}
// ---- drawing ----
function drawCodex() {
  panel(L(CX_TABS[CX.tab]), TH.ember); CX.hits = [];
  const items = cxItems(CX.tab), got = items.filter(it => cxKnows(it.k)).length; text(got + ' / ' + items.length, W - 52, 21, TH.dim, 1, 'right');
  const l = CXL(), r = cxRows(), top = CX.top[CX.tab] = clamp(CX.top[CX.tab], 0, Math.max(0, items.length - r)), sel = CX.sel[CX.tab] = clamp(CX.sel[CX.tab], 0, items.length - 1);
  // the list
  rect(l.list.x, l.list.y, l.list.w, l.list.h, 'rgba(0,0,0,.28)'); box(l.list.x, l.list.y, l.list.w, l.list.h, null, TH.line);
  items.slice(top, top + r).forEach((it, j) => { const i = top + j, y = l.list.y + 2 + j * l.rh, on = i === sel, known = cxKnows(it.k), hv = !TOUCH.on && inR({ x: l.list.x, y, w: l.list.w, h: l.rh }, Input.mx, Input.my);
    if (on) { const g = ctx.createLinearGradient(l.list.x, 0, l.list.x + l.list.w, 0); g.addColorStop(0, 'rgba(208,112,46,.24)'); g.addColorStop(1, 'rgba(208,112,46,0)'); rect(l.list.x + 1, y, l.list.w - 2, l.rh, g); rect(l.list.x + 1, y, 2, l.rh, TH.ember); }
    else if (hv) rect(l.list.x + 1, y, l.list.w - 2, l.rh, 'rgba(255,255,255,.04)');
    cxListIcon(it, l.list.x + 6, y + 2, known);
    const s = known ? it.n() : '???'; text(fitText(s, l.list.w - 26), l.list.x + 20, y + 4 - (isCJK(s) ? 2 : 0), !known ? TH.faint : on ? TH.bone : TH.bone2); });
  if (items.length > r) { const sh = Math.max(8, l.list.h * r / items.length), sy = l.list.y + (l.list.h - sh) * top / Math.max(1, items.length - r); rect(l.list.x + l.list.w - 2, sy, 1, sh, TH.line2); }
  // the entry
  const d = l.det, it = items[sel]; rect(d.x, d.y, d.w, d.h, 'rgba(0,0,0,.2)'); box(d.x, d.y, d.w, d.h, null, TH.line);
  if (!it) return; ctx.save(); ctx.beginPath(); ctx.rect(d.x + 1, d.y + 1, d.w - 2, d.h - 2); ctx.clip();
  if (!cxKnows(it.k)) cxUnknown(it, d); else if (CX.tab === 0) cxSyn(it.s, d); else if (CX.tab === 1) cxSerum(it.sh, d); else if (CX.tab === 2) cxWeapon(it.w, d); else cxEnemy(it, d);
  ctx.restore();
}
function cxListIcon(it, x, y, known) {
  if (it.s) { const s0 = SHARD[it.s.need[0]]; icon(s0 ? s0.icon : 'star', x, y, known ? it.s.c : TH.faint); }
  else if (it.sh) icon(it.sh.icon, x, y, known ? shardColor(it.sh) : TH.faint);
  else if (it.w) { const wd = WEAPONS[it.w], sp = sprite('w_' + it.w, wd.spr); if (known) { ctx.save(); ctx.beginPath(); ctx.rect(x - 2, y - 1, 13, 10); ctx.clip(); ctx.drawImage(sp.n, x - 2, Math.round(y + 4 - sp.h / 2)); ctx.restore(); } else rect(x, y + 3, 9, 2, TH.line2); }
  else { const c = it.kind === 'boss' ? C.red : it.kind === 'champ' || it.kind === 'special' ? C.gold : TH.dim; rect(x + 2, y + 2, 4, 4, known ? c : TH.line2); if (it.kind !== 'foe') { rect(x + 3, y, 2, 1, known ? c : TH.line2); rect(x + 3, y + 7, 2, 1, known ? c : TH.line2); } }
}
function cxHead(d, name, c, sub) { textS(name, d.x + 10, d.y + 8, c || TH.bone, 2); if (sub) text(sub, d.x + d.w - 10, d.y + 12, TH.dim, 1, 'right'); rect(d.x + 10, d.y + 29, d.w - 20, 1, TH.line); rect(d.x + 10, d.y + 29, 24, 1, TH.ember); }
function cxWrap(s, x, y, w, c, max) { const lh = lineH(); wrapW(s, w).slice(0, max || 99).forEach((ln, i) => text(ln, x, y + i * lh, c)); return y + Math.min(max || 99, wrapW(s, w).length) * lh; }
function cxUnknown(it, d) { cxHead(d, '???', TH.faint); text(L('cx_unk'), d.x + 10, d.y + 38, TH.dim); }
function cxSyn(s, d) {
  cxHead(d, tr(s.n), s.c); let y = d.y + 38; text(L('cx_need'), d.x + 10, y, TH.dim); y += lineH() + 3;
  for (const n of s.need) { const sh = SHARD[n]; if (!sh) continue; rect(d.x + 10, y - 1, 12, 12, '#0a0908'); icon(sh.icon, d.x + 12, y + 1, shardColor(sh)); text(sname(sh), d.x + 28, y + 2 - (isCJK(sname(sh)) ? 1 : 0), TH.bone2); y += 14; }
  y += 6; cxWrap(tr(s.d), d.x + 10, y, d.w - 20, TH.bone);
}
function cxSerum(s, d) {
  const c = shardColor(s); cxHead(d, sname(s), TH.bone, L(RAR[s.rar].k) + '  ' + tagName(s.tag));
  const pcx = d.x + 34, pcy = d.y + 62; disc(pcx, pcy, 22, '#070605'); ringC(pcx, pcy, 22, thA(c, .6), 1); ringC(pcx, pcy, 19, '#151310', 1); icon(s.icon, pcx - 16, pcy - 16, c, 4);
  text(L('cx_maxlv', s.max || 1), d.x + 66, d.y + 44, TH.dim); let y = d.y + 58;
  for (let lv = 1; lv <= (s.max || 1); lv++) { text('LV' + lv, d.x + 66, y, c); y = cxWrap(tr(s.d(lv)), d.x + 86, y, d.w - 96, TH.bone2, 3) + 3; }
}
function cxWeapon(id, d) {
  const w = WEAPONS[id], ac = usesAmmo(w) ? wAccent(w) : TH.bone2; cxHead(d, wname(id), TH.bone, L('k_' + (w.lab || w.kind)));
  // the live preview: the real weapon code firing in a small room, drawn at 2x
  const pw = Math.min(290, d.w - 20), px = d.x + 10, py = d.y + 36; previewUpdate(id, FRAME_DT); previewDraw(-9999, -9999);
  if (PV.cnv) { ctx.drawImage(PV.cnv, 150 - pw / 2, 0, pw / 2, 56, px, py, pw, 112); } box(px - 1, py - 1, pw + 2, 114, null, TH.line2); rect(px - 1, py - 1, 20, 1, ac);
  let y = cxWrap(tr(WBLURB[id] || w.story || w.d), d.x + 10, py + 120, d.w - 20, TH.bone, 3) + 5;
  const st = [['dmg', w.st[0]], ['rate', w.st[1]], ['range', w.st[2]]]; if (usesAmmo(w)) st.push(['reload', clamp(Math.round(6 - w.reload * 2), 1, 5)]);
  st.forEach(([k, v], i) => { const x = d.x + 10 + (i % 2) * Math.floor((d.w - 20) / 2), yy = y + Math.floor(i / 2) * 10; text(L(k), x, yy, TH.dim); for (let j = 0; j < 5; j++) rect(x + 50 + j * 9, yy + 1, 7, 4, j < v ? (k === 'reload' ? ac : TH.bone2) : '#24221f'); });
  y += Math.ceil(st.length / 2) * 10 + 4; cxWrap(tr(w.d), d.x + 10, y, d.w - 20, TH.dim, 2);
}
function cxEnemy(it, d) {
  cxHead(d, it.n(), it.kind === 'boss' ? C.red : TH.bone, L(it.kind === 'boss' ? 'cx_boss' : it.kind === 'champ' ? 'cx_champ' : it.kind === 'special' ? 'cx_special' : 'cx_foe'));
  const bx = d.x + 10, by = d.y + 36, bw = 96, bh = 96; rect(bx, by, bw, bh, '#0a0908'); box(bx, by, bw, bh, null, TH.line2);
  ctx.save(); ctx.beginPath(); ctx.rect(bx + 1, by + 1, bw - 2, bh - 2); ctx.clip();
  if (it.kind === 'boss') cxBossArt(it, bx + bw / 2, by + bh / 2 + 6);
  else { const s = sprite(it.id, ESPR[it.id]), sc = Math.max(2, Math.min(6, Math.floor(70 / Math.max(s.w, s.h)))), bob = Math.round(Math.sin(G.time * 3) * 1.5), cx = bx + bw / 2, fy = by + bh - 16;
    ctx.globalAlpha = .5; rect(cx - s.w * sc * .35, fy, s.w * sc * .7, 3, '#000'); ctx.globalAlpha = 1; ctx.drawImage(s.n, Math.round(cx - s.w * sc / 2), Math.round(fy - s.h * sc + bob), s.w * sc, s.h * sc); }
  ctx.restore();
  let y = by; const x = bx + bw + 10; text(L('cx_hp'), x, y, TH.dim); text(fmtNum(it.hp), x + 40, y, TH.bone); y += lineH() + 6;
  cxWrap(it.d(), x, y, d.x + d.w - 10 - x, TH.bone2);
}
// bosses are drawn by their own code; borrow it with a stand-in body, and fall back to a shadow if it needs more than that
function cxBossArt(it, x, y) {
  if (!CX.bossErr) CX.bossErr = {}; if (CX.bossErr[it.id]) { disc(x, y, 22, '#151310'); ringC(x, y, 22, C.red, 1); return; }
  const realG = G, b = { def: Object.assign({}, it.def, { look: it.look }), r: it.def.r, eye: Math.sin(realG.time || 0), flash: 0, hover: 0, bvx: 0, bvy: 0, hp: 1, maxHp: 1, phase: 0, fadeT: 0, x: 0, y: 0, face: 0, t: realG.time || 0, mem: {}, atk: null, at: 0, armorT: 0, boss: true, form: it.def.form };
  ctx.save(); const sc = Math.min(1.6, 34 / Math.max(10, it.def.r)); ctx.translate(x, y); ctx.scale(sc, sc);
  try { G = Object.assign({}, realG, { p: realG.p || { x: 0, y: 40, alive: true }, enemies: [], boss: b, time: realG.time || 0, floor: 0 }); drawBoss(b, 0, 0); }
  catch (e) { CX.bossErr[it.id] = true; }
  finally { G = realG; ctx.restore(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
}
