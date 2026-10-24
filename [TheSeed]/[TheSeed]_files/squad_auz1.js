// ===== EMBER survivors: one camp per floor, a survivor to talk to, and a squad that fights at your side =====
'use strict';
// ---------------- the seven survivors ----------------
// sprite rows are 9 wide: 10 body rows, then legs (leg colour + shoe colour) that step while walking
// talk: ['h', text] is her line, ['p', text] is yours; {name} becomes the name you chose
const SURV = {
  seye: { nm: N4('SEYE', '瑟葉', '瑟葉', '瑟叶'), file: '瑟叶', c: '#e8e8ec', legs: '20',
    spr: ['..11111..', '.1111111.', '.1111111.', '.1k0k0k1.', '11kkkkk11', '115505511', '152000251', '1k20002k1', '1.21012.1', '..20002..'],
    talk: [
      ['h', N4("DON'T MOVE. ... NOT INFECTED? GOOD. THEN I WON'T HAVE TO SHOOT.", '別動。……你沒被感染？好，那我就不用開槍了。', '動かないで。……感染してない？そう。なら撃たなくて済む。', '别动。……你没被感染？好，那我就不用开枪了。')],
      ['p', N4("I'M {name}. I'M HEADING TO THE LAB TO FIND THE SOURCE OF ALL THIS.", '我叫{name}。我要去實驗室，找到異變的源頭。', '{name}だ。研究所へ行って、異変の源を突き止める。', '我叫{name}。我要去实验室，找到异变的源头。')],
      ['h', N4('THE LAB. THAT IS WHERE THE MONSTERS ARE THICKEST. ALONE, YOUR ODDS ARE POOR. I DID THE MATH.', '實驗室。那是怪物最多的地方。你一個人去，活著回來的機率不高。我算過了。', '研究所。怪物が一番多い場所。ひとりで行けば、生きて帰れる確率は低い。計算済み。', '实验室。那是怪物最多的地方。你一个人去，活着回来的概率不高。我算过了。')],
      ['p', N4('SO... WILL YOU COME WITH ME?', '所以……要一起來嗎？', 'だったら……一緒に来るか？', '所以……要一起来吗？')],
      ['h', N4("OKAY. I'M SEYE. I AM HAPPY. MY FACE JUST DIDN'T SHOW UP FOR WORK.", '可以。我是瑟葉。我有在高興，只是表情沒有一起上班。', 'いいよ。私は瑟葉。ちゃんと喜んでる。表情が出勤してないだけ。', '可以。我是瑟叶。我有在高兴，只是表情没有一起上班。')],
      ['h', N4("LET'S GO. I'LL TAKE YOUR LEFT AND WATCH YOUR BLIND SPOT.", '走吧。我跟在你左邊，替你看著死角。', '行こう。左側につく。死角は私が見る。', '走吧。我跟在你左边，替你看着死角。')]],
    bye: N4("TOOK TOO MANY HITS. FALLING BACK TO REGROUP. DON'T LOSE.", '傷得有點多。我先撤下去整備，你別輸。', '少し被弾しすぎた。下がって立て直す。負けないで。', '伤得有点多。我先撤下去整备，你别输。') },
  chishima: { nm: N4('CHISHIMA', '千島', '千島', '千岛'), file: '千岛', c: '#e0483e', legs: '40',
    spr: ['.11...11.', '1r11111r1', '.1111111.', '.1k0k0k1.', '..kkkkk..', '.11p1p11.', 'k1111111k', '..1ppp1..', '..23232..', '.2323232.'],
    talk: [
      ['h', N4("WAIT - A LIVING PERSON! A REAL ONE! HI, HI! I'M CHISHIMA!", '欸——活人！真的是活人！你好你好，我是千島！', 'えっ、生きてる人！ほんとに生きてる人だ！こんにちは、私は千島！', '欸——活人！真的是活人！你好你好，我是千岛！')],
      ['p', N4("HI, I'M {name}. HOW LONG HAVE YOU BEEN HOLDING OUT HERE ALONE?", '你好，我是{name}。你一個人在這裡撐了多久？', 'やあ、{name}だ。ひとりでどれくらいここに？', '你好，我是{name}。你一个人在这里撑了多久？')],
      ['h', N4("LOST COUNT. EVERY DAY IT'S CANNED FOOD AND MONSTERS... HONESTLY I'M GOING STIR-CRAZY. WHERE ARE YOU HEADED?", '數不清啦，每天都在跟罐頭和怪物打交道……說真的，快悶壞了。你要去哪兒？', 'もう数えてないよ。毎日缶詰と怪物の相手ばっかり……正直、退屈で死にそう。どこに行くの？', '数不清啦，每天都在跟罐头和怪物打交道……说真的，快闷坏了。你要去哪儿？')],
      ['p', N4("THE LAB. I'M GOING TO FIND THE SOURCE OF THE OUTBREAK.", '實驗室。我要找到異變的源頭。', '研究所だ。異変の源を見つけに行く。', '实验室。我要找到异变的源头。')],
      ['h', N4('SOUNDS SUPER DANGEROUS... BUT BETTER THAN ROTTING HERE! TAKE ME ALONG. IF IT GOES BAD, WE PULL OUT. PROMISE!', '聽起來超危險……不過總比在這兒發霉好！帶上我嘛，真不行我們就撤，我保證！', 'めちゃくちゃ危なそう……でもここでカビるよりマシ！連れてってよ。ダメそうならすぐ引くから、約束！', '听起来超危险……不过总比在这儿发霉好！带上我嘛，真不行我们就撤，我保证！')],
      ['h', N4("IT'S SETTLED! LET'S GO, {name}!", '就這麼定了！走吧，{name}！', '決まりっ！行こう、{name}！', '就这么定了！走吧，{name}！')]],
    bye: N4("WAAH, CAN'T TAKE MORE! I'LL PULL BACK AND REGROUP. YOU GOT THIS!", '嗚哇，撐不住了！我先撤一下整備，你可要加油啊！', 'うわぁ、もう限界！ちょっと下がって立て直すね、がんばって！', '呜哇，撑不住了！我先撤一下整备，你可要加油啊！') },
  ling: { nm: N4('LING', '鈴', '鈴', '铃'), file: '铃', c: '#ee7a34', legs: '20',
    spr: ['..11111..', '.1111141.', '.nnnnnnn.', '.nnnk0kn.', '..kkkkk..', '..24442..', '.2222222.', '.r22422r.', '..11111..', '.1111111.'],
    talk: [
      ['h', N4("... STOP THERE. DON'T COME CLOSER. WHO ARE YOU?", '……站那兒，別過來。你是誰？', '……そこで止まって。近寄らないで。誰？', '……站那儿，别过来。你是谁？')],
      ['p', N4("I'M {name}. NOT INFECTED. I'M GOING TO THE LAB TO FIND THE SOURCE OF THE OUTBREAK.", '我是{name}，沒被感染。我要去實驗室，找到異變的源頭。', '{name}だ。感染はしてない。研究所へ行って、異変の源を探す。', '我是{name}，没被感染。我要去实验室，找到异变的源头。')],
      ['h', N4('THE LAB? THERE ARE TEN TIMES MORE MONSTERS THERE. ARE YOU SERIOUS?', '去實驗室？那邊的怪物比這裡多十倍。你認真的？', '研究所？あそこの怪物はここの十倍いるよ。本気？', '去实验室？那边的怪物比这里多十倍。你认真的？')],
      ['p', N4('DEAD SERIOUS. IF YOU WANT, COME WITH ME.', '認真的。如果你願意，我們一起走。', '本気だ。よかったら、一緒に行こう。', '认真的。如果你愿意，我们一起走。')],
      ['h', N4("I DON'T LIKE BEING TOLD WHAT TO DO. ... BUT SITTING HERE ALONE ISN'T MUCH OF A LIFE EITHER.", '我不喜歡被人安排。……不過一個人守在這兒，也沒什麼意思。', '人に決められるのは好きじゃない。……でも、ひとりでここに籠もってても仕方ないか。', '我不喜欢被人安排。……不过一个人守在这儿，也没什么意思。')],
      ['h', N4("LING. THAT'S MY NAME. IF WE'RE DOING THIS TOGETHER, SAY IT STRAIGHT WHEN SOMETHING'S WRONG.", '鈴。我的名字。既然一起走，有問題就直接說清楚。', '鈴。私の名前。一緒に行くなら、問題があればはっきり言って。', '铃。我的名字。既然一起走，有问题就直接说清楚。')]],
    bye: N4("... TCH. TOOK TOO MANY. I'M FALLING BACK TO REGROUP. DON'T PUSH YOUR LUCK.", '……嘖，挨太多下了。我先撤，整備好就回來。你別逞強。', '……ちっ、食らいすぎた。一度下がって立て直す。無理しないで。', '……啧，挨太多下了。我先撤，整备好就回来。你别逞强。') },
  miko: { nm: N4('MIKO', '米可', 'ミコ', '米可'), file: '米可', c: '#efb94a', legs: '50',
    spr: ['..11111..', '.1111111.', '.11111g1.', '.1k0k0k1.', '..kkkkk..', '.ww525ww.', '.wwb5bww.', 'kwwb5bwwk', '..bbbbb..', '.2323232.'],
    talk: [
      ['h', N4('OH, HELLO... YOU LOOK EXHAUSTED. WANT TO SIT DOWN AND HAVE SOME WATER FIRST?', '啊，你好……你看起來好累。要不要先坐下來喝口水？', 'あ、こんにちは……すごく疲れてるみたい。座ってお水でもどう？', '啊，你好……你看起来好累。要不要先坐下来喝口水？')],
      ['p', N4("THANKS. I'M {name}. I'M ON MY WAY TO THE LAB.", '謝謝。我是{name}，正在去實驗室的路上。', 'ありがとう。{name}だ。研究所に向かう途中なんだ。', '谢谢。我是{name}，正在去实验室的路上。')],
      ['h', N4('TO THE SOURCE...? I THINK THAT WOULD BE HARD ALONE. I HAVE SOME BANDAGES AND FOOD. THEY SHOULD COME IN HANDY.', '要去源頭那邊嗎……我覺得，一個人去會很辛苦哦。我這裡還有些繃帶和吃的，路上應該用得著。', '源の方へ行くの……？ひとりじゃ大変だと思うな。包帯と食べ物ならあるよ、道中きっと役に立つ。', '要去源头那边吗……我觉得，一个人去会很辛苦哦。我这里还有些绷带和吃的，路上应该用得着。')],
      ['p', N4('WOULD YOU COME WITH ME?', '要和我一起走嗎？', '一緒に来てくれるか？', '要和我一起走吗？')],
      ['h', N4("MM, I'M MIKO. HOW ABOUT THIS: YOU TAKE THE FRONT, AND I'LL BACK YOU UP FROM BEHIND.", '嗯，我叫米可。這樣分工會不會更方便——你在前面，我在後面幫你。', 'うん、私はミコ。こういう分担はどう？あなたが前で、私が後ろから支えるの。', '嗯，我叫米可。这样分工会不会更方便——你在前面，我在后面帮你。')],
      ['h', N4("BUT NO TOUGHING IT OUT IF YOU GET HURT, OKAY? I'LL BE KEEPING AN EYE ON YOU.", '不過受傷了可不許硬撐哦？我會盯著你的。', 'でも、ケガしたら無理しちゃダメだよ？ちゃんと見てるからね。', '不过受伤了可不许硬撑哦？我会盯着你的。')]],
    bye: N4("I'LL STEP BACK AND PATCH UP... BE CAREFUL ON YOUR OWN. I'LL BE BACK!", '我先退下去整理一下……你一個人要小心哦，等我回來！', 'ちょっと下がって立て直すね……ひとりでも気をつけて、すぐ戻るから！', '我先退下去整理一下……你一个人要小心哦，等我回来！') },
  yuexun: { nm: N4('YUEXUN', '月巡', '月巡', '月巡'), file: '月巡', c: '#a07ad8', legs: '10',
    spr: ['..mmmmm..', '.mmmmmmm.', '.mmmmmmm.', 'mmk5k0kmm', 'mmkkkkkmm', 'm3333333m', '.3303033.', '033030330', '.3333333.', '..11111..'],
    talk: [
      ['h', N4("HELLO. NO NEED TO TENSE UP, I MEAN NO HARM. ... YOU'RE A SURVIVOR TOO, AREN'T YOU.", '你好。別緊張，我沒有惡意。……你也是倖存者吧。', 'こんにちは。警戒しなくていい、敵意はないから。……あなたも生存者ね。', '你好。别紧张，我没有恶意。……你也是幸存者吧。')],
      ['p', N4("I'M {name}. I'M GOING TO THE LAB TO FIND WHERE ALL OF THIS STARTED.", '我是{name}。我準備去實驗室，找到這一切的源頭。', '{name}だ。研究所へ行って、すべての源を突き止めるつもりだ。', '我是{name}。我准备去实验室，找到这一切的源头。')],
      ['h', N4('I SEE. YOU THOUGHT IT THROUGH BEFORE COMING THIS FAR.', '原來如此。你是想清楚了，才走到這裡的吧。', 'そう。よく考えた上で、ここまで来たのね。', '原来如此。你是想清楚了，才走到这里的吧。')],
      ['h', N4("I WON'T TELL YOU EVERYTHING WILL BE FINE. BUT I CAN WALK THIS STRETCH OF ROAD WITH YOU.", '我不會說「一切都會好起來」。但這一段路，我可以陪你走。', '「全部うまくいく」とは言わない。でも、この道は一緒に歩ける。', '我不会说“一切都会好起来”。但这一段路，我可以陪你走。')],
      ['p', N4("THEN I'M COUNTING ON YOU.", '那就拜託你了。', 'なら、頼む。', '那就拜托你了。')],
      ['h', N4("I'M YUEXUN. TELL ME WHEN YOU'RE TIRED. WE'LL GO AT OUR OWN PACE.", '我叫月巡。累了就告訴我，我們按自己的節奏走。', '月巡よ。疲れたら言って。自分たちのペースで行きましょう。', '我叫月巡。累了就告诉我，我们按自己的节奏走。')]],
    bye: N4("I NEED TO FALL BACK AND REGROUP. DON'T WORRY ABOUT ME. KEEP MOVING FORWARD.", '我需要先撤下去整備。別擔心我，專心往前走。', '一度下がって立て直すわ。私のことは気にしないで、前だけ見て。', '我需要先撤下去整备。别担心我，专心往前走。') },
  rin: { nm: N4('RIN', '凜', '凛', '凛'), file: '凛', c: '#5aa8ff', legs: '10',
    spr: ['..11111..', '.1111111.', '.1111111.', '11kukuk11', '11kkkkk11', '125505521', '124404421', '.2444442.', '.2111112.', '.2.111.2.'],
    talk: [
      ['h', N4('HOLD IT. NAME FIRST. HAVE YOU BEEN BITTEN?', '停下，先報上名字。被咬過嗎？', '止まって。まず名前を。噛まれてない？', '停下，先报上名字。被咬过吗？')],
      ['p', N4("I'M {name}. NOT INFECTED. I'M GOING TO THE LAB TO FIND THE SOURCE OF THE OUTBREAK.", '我是{name}，沒被感染。我要去實驗室找異變的源頭。', '{name}だ。感染はしてない。研究所へ異変の源を探しに行く。', '我是{name}，没被感染。我要去实验室找异变的源头。')],
      ['h', N4("CLEAR GOAL. GOOD. HERE'S THE PROBLEM: ALONE, YOU DON'T HAVE THE FIREPOWER.", '目標明確，很好。問題在這裡——你一個人火力不夠。', '目標がはっきりしてるのはいい。問題はそこ。ひとりじゃ火力が足りない。', '目标明确，很好。问题在这里——你一个人火力不够。')],
      ['h', N4("FIRST WE CLEAR THE MONSTERS ON THE WAY, THEN WE PUSH TO THE CORE. I'LL HANDLE THE FLANKS.", '先清掉沿路的怪物，再推進到核心區。側翼我來處理。', 'まず道中の怪物を片づけて、それから中枢へ進む。側面は私が引き受ける。', '先清掉沿路的怪物，再推进到核心区。侧翼我来处理。')],
      ['p', N4("SO YOU'RE COMING WITH ME?", '這麼說，你願意一起走？', 'つまり、一緒に来てくれるのか？', '这么说，你愿意一起走？')],
      ['h', N4("I'M RIN. ... SORRY, I WAS TOO SHARP JUST NOW. I JUST DON'T WANT TO SEE ANYONE ELSE FALL. LET'S MOVE, {name}.", '我叫凜。……抱歉，剛才語氣太衝了。我只是不想再看到有人倒下。出發吧，{name}。', '凛よ。……ごめん、さっきは言い方がきつかった。もう誰にも倒れてほしくないだけ。行こう、{name}。', '我叫凛。……抱歉，刚才语气太冲了。我只是不想再看到有人倒下。出发吧，{name}。')]],
    bye: N4("I'M IN BAD SHAPE. FALLING BACK TO REGROUP! THIS IS YOURS NOW, I'LL BE QUICK!", '狀態太差了，我先撤退整備！這邊交給你，我很快回來！', '状態が悪すぎる、一度撤退して立て直す！ここは任せた、すぐ戻る！', '状态太差了，我先撤退整备！这边交给你，我很快回来！') },
  yoru: { nm: N4('YORU', '夜露', '夜露', '夜露'), file: '夜露', c: '#a4cfe0', legs: '10',
    spr: ['..44444..', '.4444444.', '.4444444.', '44k0k0k44', '44kkkkk44', '455525554', '4222g2224', '.k20g02k.', '..22g22..', '.2222222.'],
    talk: [
      ['h', N4('UM... ARE YOU... SOMEONE FROM OUTSIDE?', '那、那個……你是從外面來的人嗎？', 'あ、あの……外から来た人、ですか？', '那、那个……你是从外面来的人吗？')],
      ['p', N4("YES. I'M {name}. I'M GOING TO THE LAB TO FIND THE SOURCE OF THE OUTBREAK.", '嗯。我是{name}。我要去實驗室，找到異變的源頭。', 'ああ。{name}だ。研究所へ行って、異変の源を見つける。', '嗯。我是{name}。我要去实验室，找到异变的源头。')],
      ['h', N4("ACTUALLY... I'VE BEEN WATCHING OUTSIDE FROM HERE. I'VE MEMORIZED A FEW OF THE SAFER ROUTES NEARBY.", '其實……我一直在這裡觀察外面的動靜。附近有幾條比較安全的路，我都記下來了。', '実は……ずっとここから外の様子を見ていて。近くの比較的安全な道、いくつか覚えてます。', '其实……我一直在这里观察外面的动静。附近有几条比较安全的路，我都记下来了。')],
      ['p', N4('WILL YOU COME WITH ME?', '要和我一起走嗎？', '一緒に来ないか？', '要和我一起走吗？')],
      ['h', N4('...', '……', '……', '……')],
      ['h', N4("I'VE THOUGHT IT OVER. THIS TIME, I WANT TO GO WITH YOU. I'M YORU.", '我想過了。這一次，我想跟你一起去。我叫夜露。', '考えました。今度は、あなたと一緒に行きたい。夜露、です。', '我想过了。这一次，我想跟你一起去。我叫夜露。')]],
    bye: N4("UM... I'LL FALL BACK AND REGROUP FOR A BIT. PLEASE... DO YOUR BEST.", '那個……我先撤退整備一下。你，一定要加油。', 'あの……一度下がって、立て直してきます。どうか、がんばって。', '那个……我先撤退整备一下。你，一定要加油。') },
};
const SURV_IDS = Object.keys(SURV);
for (const id of SURV_IDS) SURV[id].spr.forEach((r, i) => { if (r.length !== 9) console.warn('[ember] survivor sprite row', id, i); });
const svName = id => tr(SURV[id].nm);
const svText = o => tr(o).split('{name}').join(SET.name || '?');
// walking: the legs step out and back (frame 0 and 2 stand straight)
function svSprite(id, fr) { const S = SURV[id], l = S.legs[0], f = S.legs[1], st = [[2, 6], [2, 7], [2, 6], [1, 6]][fr % 4];
  const row = c => { const a = '.........'.split(''); a[st[0]] = c; a[st[1]] = c; return a.join(''); };
  return sprite('sv_' + id + (fr % 4), S.spr.concat([row(l), row(f)])); }

// ---------------- portraits (assets/portraits/<id>.webp, made from the SVGs by tools/dzmm/portraits.mjs; drawn once into a canvas at UI resolution) ----------------
const PORT = {}, PORT_H = 236, PORT_AR = 436.59732 / 581.93203;
function loadPortrait(id) {
  if (!SURV[id]) return null; if (PORT[id]) return PORT[id];
  const P = PORT[id] = { img: new Image(), ok: false, err: false, cv: null, dk: null, us: 0 };
  P.img.onload = () => { P.ok = true; setTimeout(() => portraitReady(id), 30); }; P.img.onerror = () => { P.err = true; };
  P.img.src = 'assets/portraits/' + id + '.webp'; return P;
}
// a lit copy and a dimmed copy (used while you are the one speaking)
function portraitReady(id) {
  const P = loadPortrait(id); if (!P || !P.ok) return null; if (P.cv && P.us === US) return P;
  try { const h = Math.round(PORT_H * US), w = Math.round(h * PORT_AR), cv = document.createElement('canvas'), dk = document.createElement('canvas');
    cv.width = dk.width = w; cv.height = dk.height = h; const x = cv.getContext('2d'); x.imageSmoothingEnabled = true; x.drawImage(P.img, 0, 0, w, h);
    const y = dk.getContext('2d'); y.drawImage(cv, 0, 0); y.globalCompositeOperation = 'source-atop'; y.fillStyle = 'rgba(9,9,10,.55)'; y.fillRect(0, 0, w, h);
    P.cv = cv; P.dk = dk; P.us = US; } catch (e) { console.error('[ember] portrait', id, e); P.err = true; return null; }
  return P;
}

// ---------------- the camp: a fire, a tent, and whoever is sheltering there ----------------
function pickCampSurvivor() {
  const inSquad = id => (G.squad || []).some(m => m.id === id); let id = null;
  if (G.campResume && SURV[G.campResume] && !inSquad(G.campResume)) id = G.campResume;
  else { let pool = SURV_IDS.filter(k => !G.met.includes(k) && !inSquad(k)); if (!pool.length) pool = SURV_IDS.filter(k => !inSquad(k)); id = pool.length ? choice(pool) : null; }
  G.campResume = null; if (id && !G.met.includes(id)) G.met.push(id); G.campPick = id;
  if (id && !RESUMING) loadPortrait(id); return id;
}
function campInter(r) { const cx = r.cx * T + 8, cy = r.cy * T + 8, id = (G.campUsed || []).includes(exploreDepth()) ? null : pickCampSurvivor(); const out = [{ kind: 'camp', x: cx, y: cy - 2 }];
  if (id) out.push({ kind: 'survivor', id, x: cx + 30, y: cy + 2 }); return out; }
function drawCamp(it, x, y, t) {
  // warm light first, so everything else stands in it
  ctx.globalAlpha = .1 + Math.sin(t * 7) * .02 + Math.sin(t * 13) * .015; disc(x, y + 2, 34, C.orange); ctx.globalAlpha = .1; disc(x, y + 2, 20, C.gold); ctx.globalAlpha = 1;
  // tent
  const tx = x - 50, ty = y - 4; ctx.fillStyle = col(3); ctx.beginPath(); ctx.moveTo(tx, ty - 17); ctx.lineTo(tx + 20, ty + 9); ctx.lineTo(tx - 20, ty + 9); ctx.fill();
  ctx.fillStyle = col(2); ctx.beginPath(); ctx.moveTo(tx, ty - 17); ctx.lineTo(tx + 20, ty + 9); ctx.lineTo(tx + 4, ty + 9); ctx.fill();
  ctx.fillStyle = col(0); ctx.beginPath(); ctx.moveTo(tx - 1, ty - 4); ctx.lineTo(tx + 6, ty + 9); ctx.lineTo(tx - 7, ty + 9); ctx.fill();
  pxLine(tx, ty - 17, tx - 20, ty + 9, col(4)); pxLine(tx, ty - 19, tx, ty - 17, col(4)); pxLine(tx - 20, ty + 9, tx - 25, ty + 12, col(3)); pxLine(tx + 20, ty + 9, tx + 25, ty + 12, col(3));
  // bedroll, crates and a pack
  rect(x + 36, y + 18, 18, 6, col(3)); rect(x + 36, y + 18, 18, 1, col(4)); rect(x + 36, y + 18, 5, 6, col(4));
  rect(x + 40, y - 26, 11, 9, col(3)); rect(x + 40, y - 26, 11, 1, col(4)); pxLine(x + 40, y - 25, x + 50, y - 18, col(2)); rect(x + 52, y - 22, 8, 5, col(2)); rect(x + 52, y - 22, 8, 1, col(3));
  rect(x - 30, y + 18, 7, 8, col(2)); rect(x - 30, y + 18, 7, 2, col(3)); rect(x - 28, y + 16, 3, 2, col(3));
  // stones and logs
  for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; rect(x + Math.cos(a) * 10 - 1, y + 3 + Math.sin(a) * 4, 3, 2, i % 2 ? col(3) : col(4)); }
  pxLine(x - 6, y + 5, x + 6, y + 1, col(3), 2); pxLine(x - 6, y + 1, x + 6, y + 5, col(2), 2);
  // the flame: the only living colour in the room
  for (let i = 0; i < 5; i++) { const h = 5 + Math.round((Math.sin(t * 9 + i * 1.7) + 1) * 2.5 + (i === 2 ? 4 : 0)); rect(x - 5 + i * 2, y + 2 - h, 2, h, i % 2 ? C.orange : C.red); }
  const h2 = 4 + Math.round((Math.sin(t * 11) + 1) * 1.5); rect(x - 2, y + 1 - h2, 4, h2, C.gold); rect(x - 1, y - 1, 2, 2, '#fff1b8');
  if (Math.random() < .35) part({ x: it.x + rand(-4, 4), y: it.y - 4, vx: rand(-8, 8), vy: rand(-45, -20), life: .9, max: .9, c: choice([C.orange, C.gold, C.red]), drag: 1 });
}
function campRest(it) {
  const ms = (G.squad || []).filter(m => !m.away); it.used = true; AU.play('heal'); burst(it.x, it.y - 4, 24, C.orange, 90, .6);
  for (const m of ms) { m.hits = Math.max(0, m.hits - Math.round(m.maxHits * .25)); ringFx(m.x, m.y, 14, SURV[m.id].c, .4, 2); burst(m.x, m.y, 10, C.green, 70, .4); }
  notify(L(ms.length ? 'cp_rested' : 'cp_alone'), C.green);
}
function drawSurvivorNPC(it, x, y, t) {
  const s = svSprite(it.id, 0), face = G.p ? G.p.x < it.x : true, br = 1 + Math.max(0, Math.sin(t * 2.4)) * .05;
  drawChar(s, x, y + 4, face, false, { sy: br, shw: .75 });
  // "...": she has something to say
  if (!G.talk && ((t * 2) | 0) % 2 === 0) { const by = y - 15; rect(x - 6, by - 4, 12, 7, col(0)); rect(x - 5, by - 3, 10, 5, col(5)); rect(x - 1, by + 2, 2, 2, col(5)); for (let i = 0; i < 3; i++) rect(x - 3 + i * 3, by - 1, 1, 1, SURV[it.id].c); }
}

// ---------------- talking (the portrait fades in, a few lines, then she joins) ----------------
const talkSc = () => SET.lang === 'en' ? 1 : 1.5;
function startTalk(it) { G.talk = { id: it.id, it, i: 0, t: 0, ch: 0, end: -1 }; G.state = 'talk'; loadPortrait(it.id); Input.down = false; AU.play('menuOk'); AU.play('door', 1.6, .4); }
function talkLine(T) { const l = SURV[T.id].talk[T.i]; return { who: l[0], s: svText(l[1]) }; }
function talkWrap(s) { return wrapW(s, W - 64, talkSc()); }
function updateTalk(rdt) {
  const T = G.talk; if (!T) { G.state = 'play'; return; } T.t += rdt;
  if (T.end >= 0) { T.end += rdt; if (T.end > 2.2 || (T.end > .7 && (Input.clicked || pressed('Enter') || pressed('Space') || pressed('KeyE')))) closeTalk(); return; }
  const lines = SURV[T.id].talk, ln = talkLine(T), n = [...ln.s].length;
  T.ch += rdt * (SET.lang === 'en' ? 70 : 26);
  if (pressed('Escape')) { recruit(T); return; }
  if ((Input.clicked || pressed('Enter') || pressed('Space') || pressed('KeyE')) && T.t > .45) {
    if (T.ch < n) T.ch = n;
    else { T.i++; T.ch = 0; if (T.i >= lines.length) { T.i = lines.length - 1; T.ch = 1e9; recruit(T); } else AU.play('menu', talkLine(T).who === 'h' ? 1.15 : .9); } }
}
function recruit(T) {
  if (T.end >= 0) return; T.end = 0; const it = T.it, wid = choice(MATE_WEAPONS.filter(w => WEAPONS[w] && !(G.squad || []).some(m => m.wid === w))) || 'nail';
  const m = mkMate(T.id, wid, 0, false); m.x = it.x; m.y = it.y; G.squad.push(m); T.wid = wid;
  const k = G.inter.indexOf(it); if (k >= 0) G.inter.splice(k, 1);
  AU.play('select'); AU.play('heal', 1.2, .6); notify(L('sq_join', svName(T.id)), SURV[T.id].c); girlsMeet(T.id);
}
function closeTalk() { const T = G.talk; G.talk = null; G.state = 'play'; Input.down = false; Input.clicked = false; if (T) { const m = G.squad.find(q => q.id === T.id); if (m) { ringFx(m.x, m.y, 18, SURV[T.id].c, .4, 2); burst(m.x, m.y, 14, SURV[T.id].c, 80, .4); } } }
function drawPortrait(id, x, y, a, dim) {
  const P = portraitReady(id), w = Math.round(PORT_H * PORT_AR);
  if (!P) { // still loading: a soft silhouette in her colour
    ctx.globalAlpha = a * .25; rect(x + w * .3, y + 30, w * .4, PORT_H - 30, SURV[id].c); disc(x + w / 2, y + 40, 26, SURV[id].c); ctx.globalAlpha = 1; return; }
  ctx.globalAlpha = a; ctx.drawImage(dim ? P.dk : P.cv, Math.round(x * US) / US, Math.round(y * US) / US, P.cv.width / US, P.cv.height / US); ctx.globalAlpha = 1;
}
function drawTalk() {
  const T = G.talk; if (!T) return; const S = SURV[T.id], c = S.c;
  const kIn = easeOut(clamp(T.t / .45, 0, 1)), kOut = T.end > 1.5 ? clamp(1 - (T.end - 1.5) / .6, 0, 1) : 1, k = kIn * kOut;
  ctx.globalAlpha = .6 * k; rect(0, 0, W, H, '#000'); ctx.globalAlpha = 1;
  const ln = talkLine(T), me = ln.who === 'p' && T.end < 0, pw = Math.round(PORT_H * PORT_AR);
  // the portrait slides in from the right and fades in; it steps back a little while you speak
  drawPortrait(T.id, W - pw - 10 + (1 - kIn) * 30 + (me ? 6 : 0), H - PORT_H + (1 - kIn) * 4, k, me);
  if (T.end >= 0) { drawJoinCard(T, k); return; }
  // dialogue box
  const bx = 12, bw = W - 24, bh = 64, by = H - bh - 8, sc = talkSc(), lh = lineH(sc), acc = me ? '#8e877b' : c;
  ctx.globalAlpha = k * .94; rect(bx, by, bw, bh, '#0b0b0d'); ctx.globalAlpha = k; box(bx, by, bw, bh, null, '#2d2925'); rect(bx, by, 2, bh, acc); rect(bx, by, bw, 1, acc);
  const who = me ? (SET.name || '?') : svName(T.id), nw = textW(who) + 14; rect(bx + 8, by - 10, nw, 12, acc); text(who, bx + 15, by - 7 - (isCJK(who) ? 1 : 0), '#0a0908');
  const full = talkWrap(ln.s); let left = Math.floor(T.ch);
  full.forEach((l, i) => { const ch = [...l], n = clamp(left, 0, ch.length); left -= ch.length; if (n > 0) text(ch.slice(0, n).join(''), bx + 14, by + 12 + i * lh, me ? '#c9c1b2' : '#e8e1d3', sc); });
  const done = T.ch >= [...ln.s].length;
  if (done && ((G.time * 3) | 0) % 2 === 0) { const ax = bx + bw - 14, ay = by + bh - 10; rect(ax - 3, ay, 7, 1, acc); rect(ax - 2, ay + 1, 5, 1, acc); rect(ax - 1, ay + 2, 3, 1, acc); rect(ax, ay + 3, 1, 1, acc); }
  // progress pips and the skip hint
  const N = S.talk.length; for (let i = 0; i < N; i++) rect(bx + bw - 12 - (N - i) * 6, by + 5, 4, 2, i < T.i ? '#57524a' : i === T.i ? acc : '#27231f');
  if (!TOUCH.on) text(L('sq_skip'), W - 10, 8, '#57524a', 1, 'right');
  ctx.globalAlpha = 1;
}
function drawJoinCard(T, k) {
  const S = SURV[T.id], c = S.c, e = easeOut(clamp(T.end / .35, 0, 1)), h = 52 * e, y = 104;
  ctx.globalAlpha = k; rect(0, y - h / 2, W, h, '#0a0908'); if (h > 4) { rect(0, y - h / 2, W, 1, c); rect(0, y + h / 2 - 1, W, 1, c); }
  if (e > .6) { const a = clamp((e - .6) / .4, 0, 1) * k, sx = (1 - a) * 30; ctx.globalAlpha = a;
    textS(L('sq_join', svName(T.id)), W / 2 + sx, y - 15, c, 2, 'center');
    const w = WEAPONS[T.wid], lab = L('sq_carry', wname(T.wid)), ws = sprite('w_' + T.wid, w.spr), tw = textW(lab) + ws.w + 8, x0 = W / 2 - sx - tw / 2;
    ctx.drawImage(ws.n, Math.round(x0), Math.round(y + 8 - ws.h / 2)); text(lab, x0 + ws.w + 8, y + 5 - (isCJK(lab) ? 1 : 0), '#c9c1b2'); }
  ctx.globalAlpha = 1;
}

// ---------------- the squad: follows you, picks its own targets, takes 30 hits before falling back ----------------
const MATE_HITS = 30;
// weapons a survivor may carry (base weapons whose attacks have plain numbers)
const MATE_WEAPONS = ['nail', 'hail', 'scatter', 'rail', 'volt', 'edge', 'lance', 'whirl', 'halo', 'bloom', 'bow', 'splinter', 'shuriken', 'twin', 'rivet', 'helix', 'mirage', 'frostbite', 'longshot', 'fist', 'hammer', 'carom', 'crescent', 'trident', 'saw'];
const SQ = { shots: [], fx: [], bubbles: [], ticker: [], a: 0 };
function mkMate(id, wid, hits, away) { return { id, wid, hits: hits || 0, away: !!away, maxHits: Math.round(MATE_HITS * girlMul(id).hp), x: 0, y: 0, r: 4, vx: 0, vy: 0, aim: 0, cd: .5, hitT: 0, walkT: 0, stuck: 0, tg: null, tgT: 0, swing: null }; }
const mateStyle = w => MELEE.has(w.kind) ? 'melee' : (w.kind === 'rail' || w.kind === 'beam' || w.kind === 'chain') ? 'line' : 'shot';
// survivors hit harder on deeper floors, so they stay useful as foes get tougher
const matePow = () => .9 * (1 + .5 * statFloor());
function squadEnterFloor() {
  SQ.shots.length = 0; SQ.fx.length = 0; SQ.bubbles.length = 0; const p = G.p; SQ.a = p.aim + Math.PI;
  (G.squad || []).forEach((m, i) => { if (m.away) { m.away = false; m.hits = 0; if (!G.resuming) G.later.push({ t: 1.4 + i * .3, f: () => notify(L('sq_back', svName(m.id)), SURV[m.id].c) }); }
    m.tg = null; m.swing = null; m.cd = .6; m.hitT = 0; mateWarp(m, false); });
}
function mateWarp(m, fx) {
  const p = G.p, pr = roomAt(p.x, p.y); let spot = null;
  for (let k = 0; k < 10 && !spot; k++) { const a = rand(0, 6.283), r = rand(12, 22), q = freeSpot(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, m.r, false, 24); if (q && (!pr || roomAt(q[0], q[1]) === pr) && !collides(q[0], q[1], m.r, false)) spot = q; }
  if (!spot) spot = [p.x, p.y]; m.x = spot[0]; m.y = spot[1]; m.vx = m.vy = 0; m.stuck = 0;
  if (fx) { const c = SURV[m.id].c; burst(m.x, m.y, 10, c, 70, .35); ringFx(m.x, m.y, 12, c, .3, 1); }
}
function mateTarget(m) { let best = null, bd = 185; for (const e of G.enemies) { if (e.dead || e.deathFightLeft > 0 || e.spawnT > 0) continue; const d = dist(m.x, m.y, e.x, e.y) - (e.boss ? 30 : 0); if (d < bd && los(m.x, m.y - 2, e.x, e.y)) { bd = d; best = e; } } return best; }
function updateSquad(dt) {
  updateSquadShots(dt); for (let i = SQ.fx.length - 1; i >= 0; i--) { SQ.fx[i].t += dt; if (SQ.fx[i].t > SQ.fx[i].dur) SQ.fx.splice(i, 1); }
  const list = (G.squad || []).filter(m => !m.away); if (!list.length || !dt) return;
  const p = G.p, pr = roomAt(p.x, p.y); SQ.a += angDiff(SQ.a, p.aim + Math.PI) * Math.min(1, dt * 2.5);
  list.forEach((m, i) => {
    const w = WEAPONS[m.wid], st = mateStyle(w); m.hitT -= dt; m.cd -= dt; m.tgT -= dt; if (m.swing) { m.swing.t += dt; if (m.swing.t > m.swing.dur) m.swing = null; }
    // never left behind: through a sealed door, too far away, or stuck on a wall she reappears at your side
    const dp = dist(m.x, m.y, p.x, p.y), mr = roomAt(m.x, m.y);
    if (dp > 230 || (pr && pr.active && mr !== pr)) { mateWarp(m, true); return; }
    if (m.tgT <= 0 || !m.tg || m.tg.dead || m.tg.deathFightLeft>0) { m.tg = mateTarget(m); m.tgT = .2; }
    const tg = m.tg && !m.tg.dead && !(m.tg.deathFightLeft>0) ? m.tg : null;
    // where to stand: a slot fanned out behind you, or in reach of her target when she fights up close
    let gx, gy; const reach = (w.range || 24) * .85 + 8;
    if (tg && st === 'melee' && dist(p.x, p.y, tg.x, tg.y) < 175) { const a = ang(tg.x, tg.y, m.x, m.y), rr = reach * .6 + tg.r; gx = tg.x + Math.cos(a) * rr; gy = tg.y + Math.sin(a) * rr; }
    else { const a = SQ.a + (i - (list.length - 1) / 2) * .85, rr = 20 + (i % 2) * 4; gx = p.x + Math.cos(a) * rr; gy = p.y + Math.sin(a) * rr; }
    const dx = gx - m.x, dy = gy - m.y, d = Math.hypot(dx, dy), sp = d > 90 ? 165 : d > 30 ? 115 : 75, want = d > 4;
    m.vx = lerp(m.vx, want ? dx / d * sp : 0, Math.min(1, dt * 10)); m.vy = lerp(m.vy, want ? dy / d * sp : 0, Math.min(1, dt * 10));
    const ox = m.x, oy = m.y; moveBody(m, m.vx * dt, m.vy * dt); if (Math.hypot(m.vx, m.vy) > 10) m.walkT += dt;
    if (d > 50 && Math.hypot(m.x - ox, m.y - oy) < sp * dt * .25) { m.stuck += dt; if (m.stuck > 1.2) mateWarp(m, true); } else m.stuck = Math.max(0, m.stuck - dt);
    // aim and attack
    if (tg) { m.aim = ang(m.x, m.y - 2, tg.x, tg.y); if (m.cd <= 0) mateAttack(m, w, st, tg, reach); }
    else if (want && Math.hypot(m.vx, m.vy) > 20) m.aim += angDiff(m.aim, Math.atan2(m.vy, m.vx)) * Math.min(1, dt * 8);
    // enemy bullets that reach her count as hits (a short flinch after each one lets the next few pass)
    for (let k = G.ebullets.length - 1; k >= 0; k--) { const q = G.ebullets[k]; if (q.delay > 0 || dist(q.x, q.y, m.x, m.y - 3) > (q.r || 3) + 4) continue;
      if (m.hitT > 0) continue; G.ebullets.splice(k, 1); mateHurt(m); if (m.away) break; }
  });
}
function mateHurt(m) {
  m.hits++; m.hitT = .45; AU.play('hit', 1.5, .45); burst(m.x, m.y - 3, 6, SURV[m.id].c, 70, .25);
  if (m.hits < m.maxHits) return;
  // out of strength: she says her piece and falls back until the next floor
  m.away = true; m.hits = m.maxHits; m.tg = null; const c = SURV[m.id].c;
  SQ.bubbles.push({ id: m.id, x: m.x, y: m.y - 14, t: 0, txt: svText(SURV[m.id].bye) });
  notify(L('sq_away', svName(m.id)), c); AU.play('shieldPop', .8, .7); ringFx(m.x, m.y, 18, c, .4, 2); burst(m.x, m.y, 18, c, 100, .5);
  for (let i = 0; i < 6; i++) G.ghosts.push({ x: m.x + i * 3 * Math.cos(m.aim + Math.PI), y: m.y, flip: false, life: .2 + i * .05, max: .45, c, rows: SURV[m.id].spr, key: 'sv' + m.id });
}
function mateAttack(m, w, st, tg, reach) {
  if (w.alt) m.alt = !m.alt;
  const origin = shotOrigin(m, w, 0, { wa: m.aim, off: 2 });
  const S = SURV[m.id], c = S.c, gm = girlMul(m.id), pow = matePow() * gm.dmg, a = m.aim, mx = origin.x, my = origin.y, rate = (w.rate || 1 / (w.charge || .8)) * .6 * gm.spd;
  const base = (w.dmgMax ? w.dmgMax * .6 : w.dmg) * pow;
  if (st === 'melee') {
    if (dist(m.x, m.y, tg.x, tg.y) > reach + tg.r) return; // walk in first
    const arc = Math.max(1.6, w.arc || 2.2), sw = { t: 0, dur: .18, a, flip: !(m.swing && m.swing.flip) }; m.swing = sw;
    for (const e of G.enemies) if (!e.dead && !(e.deathFightLeft > 0) && e.spawnT <= 0 && dist(m.x, m.y, e.x, e.y) < reach + e.r && Math.abs(angDiff(a, ang(m.x, m.y, e.x, e.y))) < arc / 2 + .2)
      hitEnemy(e, base, { melee: true, proc: 0, ka: a, knock: (w.knock || 80) * .6, quiet: true, color: c, sx: m.x, sy: m.y });
    // her swing also knocks enemy bullets out of the air
    for (let k = G.ebullets.length - 1; k >= 0; k--) { const q = G.ebullets[k]; if (q.delay > 0) continue; if (dist(m.x, m.y, q.x, q.y) < reach && Math.abs(angDiff(a, ang(m.x, m.y, q.x, q.y))) < arc / 2) { G.ebullets.splice(k, 1); burst(q.x, q.y, 3, c, 50, .15); } }
    SQ.fx.push({ k: 'slash', x: m.x, y: m.y - 2, a, r: reach, arc, c, t: 0, dur: .16, flip: sw.flip }); AU.play(w.sfx || 'slash', 1.15, .35);
  } else if (st === 'line') {
    const pts = rayPath(mx, my, a, 260, 0), [ex, ey] = pts[pts.length - 1];
    for (const e of G.enemies) if (!e.dead && !(e.deathFightLeft > 0) && e.spawnT <= 0 && segDist(e.x, e.y, mx, my, ex, ey) < e.r + 3) hitEnemy(e, base * (w.fan ? 1.6 : 1), { proc: 0, ka: a, knock: (w.knock || 60) * .5, quiet: true, color: c, sx: m.x, sy: m.y });
    SQ.fx.push({ k: 'line', x: mx, y: my, ex, ey, c, t: 0, dur: .14 }); AU.play(w.sfx || 'rail', 1.2, .3);
  } else {
    const n = Math.min(w.n || 1, 5), spd = (w.spd || 300) * .9, boom = ['rocket', 'lob', 'mine', 'hive', 'orb'].includes(w.kind) || w.bk === 'fw';
    for (let k = 0; k < n; k++) { const sp = n > 1 ? (w.spread || .12) : (w.spread || .04) * .6, aa = a + rand(-sp, sp);
      SQ.shots.push({ x: mx, y: my, vx: Math.cos(aa) * spd, vy: Math.sin(aa) * spd, r: Math.max(1.5, Math.min(4, w.r || 2)), life: Math.min(1.1, 230 / spd), dmg: base * (w.kind === 'hive' ? 2.5 : 1), pierce: Math.min(3, w.pierce || 0), boom, knock: (w.knock || 50) * .5, c, sx: m.x, sy: m.y, hit: new Set(), tr: [] }); }
    AU.play(w.sfx || 'shoot', 1.2, .25); part({ x: mx, y: my, vx: 0, vy: 0, life: .06, max: .06, c, s: 2 });
  }
  m.cd = Math.max(.12, 1 / rate);
}
function shotBoom(b) { burst(b.x, b.y, 10, b.c, 90, .3); ringFx(b.x, b.y, 16, b.c, .25, 2); AU.play('pop', 1.2, .4);
  for (const e of G.enemies) if (!e.dead && !(e.deathFightLeft > 0) && e.spawnT <= 0 && dist(b.x, b.y, e.x, e.y) < 18 + e.r) hitEnemy(e, b.dmg * .6, { boom: true, proc: 0, ka: ang(b.x, b.y, e.x, e.y), knock: 100, quiet: true, color: b.c }); }
function updateSquadShots(dt) {
  for (let i = SQ.shots.length - 1; i >= 0; i--) { const b = SQ.shots[i]; b.life -= dt; b.tr.push([b.x, b.y]); if (b.tr.length > 3) b.tr.shift();
    b.x += b.vx * dt; b.y += b.vy * dt; let dead = b.life <= 0 || shotBlocked(b.x, b.y);
    if (!dead) for (const e of G.enemies) { if (e.dead || e.deathFightLeft > 0 || e.spawnT > 0 || b.hit.has(e) || dist(b.x, b.y, e.x, e.y) > e.r + b.r) continue; b.hit.add(e);
      hitEnemy(e, b.dmg, { proc: 0, ka: Math.atan2(b.vy, b.vx), knock: b.knock, quiet: true, color: b.c, sx: b.sx, sy: b.sy }); if (b.pierce-- <= 0) { dead = true; break; } }
    if (dead) { SQ.shots.splice(i, 1); if (b.boom) shotBoom(b); else burst(b.x, b.y, 3, b.c, 50, .15); } }
}
// ---- drawing (world pass) ----
function drawSquad(cx, cy) {
  for (const b of SQ.shots) { const x = b.x - cx, y = b.y - cy; if (b.tr.length) pxLine(b.tr[0][0] - cx, b.tr[0][1] - cy, x, y, b.c); rect(x - 1, y - 1, Math.max(2, b.r), Math.max(2, b.r), '#e8e1d3'); }
  for (const f of SQ.fx) { const k = 1 - f.t / f.dur; ctx.globalAlpha = k;
    if (f.k === 'line') { pxLine(f.x - cx, f.y - cy, f.ex - cx, f.ey - cy, f.c, 2); pxLine(f.x - cx, f.y - cy, f.ex - cx, f.ey - cy, '#e8e1d3'); }
    else { const n = 12, sp = f.arc * (.4 + .6 * (1 - k)); for (let i = 0; i <= n; i++) { const a = f.a + (f.flip ? -1 : 1) * (i / n - .5) * sp; rect(f.x - cx + Math.cos(a) * f.r - 1, f.y - cy + Math.sin(a) * f.r - 1, 2, 2, i % 3 ? f.c : '#e8e1d3'); } }
    ctx.globalAlpha = 1; }
  for (const m of G.squad || []) if (!m.away) drawMate(m, cx, cy);
}
function drawMate(m, cx, cy) {
  const S = SURV[m.id], w = WEAPONS[m.wid], x = m.x - cx, foot = m.y + 4 - cy, moving = Math.hypot(m.vx, m.vy) > 10, fr = moving ? ((m.walkT * 10) | 0) % 4 : 0;
  if (m.hitT > 0 && ((m.hitT * 24) | 0) % 2) { shadow(x, foot, 8); return; }
  const flip = Math.cos(m.aim) < 0, up = Math.sin(m.aim) < -.6, grip = weaponGrip(m), hy = grip.y - cy;
  const drawW = () => { const ws = sprite('w_' + m.wid, w.spr); let wa = m.aim, off = 2;
    if (m.swing) { const e = easeOut(clamp(m.swing.t / m.swing.dur, 0, 1)), side = Math.cos(m.swing.a) < 0 ? -1 : 1; wa = m.swing.a + (m.swing.flip ? -1 : 1) * side * lerp(-1.3, 1.3, e); off = 4; }
    ctx.save(); ctx.translate(grip.x - cx, hy); ctx.rotate(wa); if (Math.cos(wa) < 0) ctx.scale(1, -1); ctx.drawImage(ws.n, off, -Math.floor(ws.h / 2)); ctx.restore(); };
  if (up) drawW();
  drawChar(svSprite(m.id, fr), x, foot, flip, m.hitT > .3, { lift: moving && fr % 2 ? 1 : 0, shw: .75 });
  if (!up) drawW();
  // strength left: a thin bar in her colour
  const left = 1 - m.hits / m.maxHits, bw = 14; rect(x - bw / 2 - 1, foot - 19, bw + 2, 3, col(0)); rect(x - bw / 2, foot - 18, Math.max(1, Math.round(bw * left)), 1, left < .3 ? C.red : S.c);
}
// ---- the speech ticker (UI pass): one line at a time scrolls along the top, between the vitals and the right-hand HUD ----
const TICK_SPEED = 42;
function drawTicker() {
  const q = SQ.ticker[0]; if (!q) return; const x0 = 112, x1 = W - 166, w = x1 - x0, y = 3, h = 12; if (w < 60) return;
  const S = SURV[q.id], nm = svName(q.id), body = q.txt, tw = textW(nm) + 10 + textW(body); q.t += FRAME_DT;
  const x = x1 - q.t * TICK_SPEED; if (x + tw < x0) { SQ.ticker.shift(); return; }
  const a = clamp(Math.min(q.t / .3, 1), 0, 1); ctx.globalAlpha = .78 * a; rect(x0, y, w, h, '#050506'); ctx.globalAlpha = a; rect(x0, y, 2, h, S.c); rect(x0, y + h - 1, w, 1, '#1d1a17');
  ctx.save(); ctx.beginPath(); ctx.rect(x0 + 3, y, w - 3, h); ctx.clip();
  text(nm, x, y + 3 - (isCJK(nm) ? 1 : 0), S.c); text(body, x + textW(nm) + 10, y + 3 - (isCJK(body) ? 1 : 0), '#e8e1d3');
  ctx.restore(); ctx.globalAlpha = 1;
}
// ---- speech bubbles (UI pass): what she says as she falls back ----
function drawSquadUI(cx, cy) {
  for (let i = SQ.bubbles.length - 1; i >= 0; i--) { const b = SQ.bubbles[i], life = b.life || 4.2; b.t += FRAME_DT; if (b.t > life || (b.m && b.m.away)) { SQ.bubbles.splice(i, 1); continue; }
    if (b.m) { b.x = b.m.x; b.y = b.m.y - 14; }
    const a = clamp(Math.min(b.t / .15, (life - b.t) / .5), 0, 1), S = SURV[b.id], lines = wrapW(b.txt, 128), lh = lineH(), nm = svName(b.id);
    const bw = Math.max(textW(nm) + 12, ...lines.map(l => textW(l))) + 12, bh = lines.length * lh + 18;
    const x = clamp(Math.round(b.x - cx - bw / 2), 4, W - bw - 4), y = clamp(Math.round(b.y - cy - bh - 6 - (1 - easeOut(Math.min(1, b.t / .25))) * 6), 4, H - bh - 10), tx = clamp(Math.round(b.x - cx), x + 6, x + bw - 6);
    ctx.globalAlpha = a; rect(x + 2, y + 2, bw, bh, '#000'); rect(x, y, bw, bh, '#e8e1d3'); box(x, y, bw, bh, null, S.c);
    for (let k = 0; k < 4; k++) rect(tx - 3 + k, y + bh + k, 7 - k * 2, 1, k ? '#e8e1d3' : S.c); rect(tx - 4, y + bh, 1, 1, S.c); rect(tx + 4, y + bh, 1, 1, S.c);
    rect(x + 4, y + 3, textW(nm) + 8, 10, S.c); text(nm, x + 8, y + 5 - (isCJK(nm) ? 1 : 0), '#0a0908');
    lines.forEach((l, j) => text(l, x + 6, y + 16 + j * lh, '#0a0908')); ctx.globalAlpha = 1; }
}
