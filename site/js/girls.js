// ===== EMBER girls: affection, proofs, training, companion profiles and squad auto-speech =====
// progress lives in STORE 'achroma_girls' (dzmm.kv on DZMM): { v, proofs, bring, girls: { id: { met, aff, lv: { spd, dmg, hp }, own: [weapon ids], wsel, log: [chat], imgs: [{ id, scene, at }] } } }
'use strict';
const AFF_MAX = 100, AFF_MEET = 10, AFF_CLEAR = 30, LV_MAX = 10;
// proofs for a clear (nightmare was not specified: it sits between hard and despair)
const PROOF_BY_DIFF = { easy: 3, classic: 3, hard: 5, nightmare: 6, despair: 7 };
const GIRL_INFO = {
  seye: { age: 20, sig: 'rivet', bio: N4('QUIET AND COMPOSED. FEW WORDS, ALWAYS TO THE POINT, WITH A DEADPAN SENSE OF HUMOR.', '安靜鎮定，話少但回應準確，會一本正經地說出意外的話。', '静かで落ち着いている。言葉は少ないが的確で、真顔で意外なことを言う。', '安静镇定，话少但回应准确，会一本正经地说出意外的话。'),
    look: '1girl, long straight black hair, blunt bangs, white collared shirt, black necktie, glossy black bodysuit, black ribbon at waist, calm expression' },
  chishima: { age: 19, sig: 'twin', bio: N4('OUTGOING AND QUICK TO PULL OTHERS INTO WHATEVER IS HAPPENING, BUT SHE NOTICES HOW HER FRIENDS FEEL.', '外向主動，擅長把人拉進正在發生的事裡，也看得見同伴的情緒。', '外向的で、人を巻き込むのが得意。でも仲間の気持ちにもちゃんと気づく。', '外向主动，擅长把人拉进正在发生的事里，也看得见同伴的情绪。'),
    look: '1girl, dark hair in double buns, red hair ornaments, teal eyes, oversized black hoodie with dark red lines, plaid pleated skirt, crossbody bag, light gray tights, bright smile' },
  ling: { age: 18, sig: 'fist', bio: N4('KEEPS HER OWN PACE AND HATES BEING TOLD WHAT TO DO. RESERVED IN WORDS, NEVER ABSENT IN DEEDS.', '有自己的節奏，不喜歡被安排；嘴上保留，行動上從不缺席。', '自分のペースを守り、指図されるのが嫌い。口数は少ないが、行動では必ず味方する。', '有自己的节奏，不喜欢被安排；嘴上保留，行动上从不缺席。'),
    look: '1girl, short dark brown hair, side bangs covering one eye, dark beret with metal buckle, short dark jacket, red gloves, dark skirt, sheer black tights, black boots, punk street style' },
  miko: { age: 19, sig: 'hail', bio: N4('KIND AND ATTENTIVE. SHE LOOKS AFTER PEOPLE IN SMALL, PRACTICAL WAYS, AND KNOWS HER OWN MIND.', '親切細心，用小而具體的辦法照顧人，溫柔裡有主見。', '親切で気配り上手。小さく具体的なやり方で人を支え、芯はしっかりしている。', '亲切细心，用小而具体的办法照顾人，温柔里有主见。'),
    look: '1girl, short dark hair, small hairclip, blue eyes, oversized cream knit cardigan with brown trim, plaid bow tie, plaid pleated skirt, shoulder bag, gentle smile' },
  yuexun: { age: 21, sig: 'frostbite', bio: N4('CALM AND PATIENT. SHE LISTENS FIRST, ANSWERS SECOND, AND KNOWS WHERE THE LINES ARE.', '沉靜耐心，先傾聽再回應，給人安心的分寸感。', '物静かで辛抱強い。まず聞いてから答え、人との距離感を大切にする。', '沉静耐心，先倾听再回应，给人安心的分寸感。'),
    look: '1girl, medium wavy grayish lilac-brown hair, white eyepatch over one eye, high-collared dark gray coat with large buttons, dark gloves, large soft shoulder bag, calm expression' },
  rin: { age: 20, sig: 'halo', bio: N4('DIRECT AND EARNEST. SHE BREAKS PROBLEMS INTO STEPS, TAKES RESPONSIBILITY, AND OWNS HER MISTAKES.', '直率認真，習慣拆解步驟、承擔責任，也懂得自我修正。', '率直でまじめ。手順を分けて考え、責任を負い、間違いは自分で正す。', '直率认真，习惯拆解步骤、承担责任，也懂得自我修正。'),
    look: '1girl, long black hair, blue eyes, dark long coat, white collared shirt, black necktie, gray argyle sweater vest, dark pleated skirt, school uniform style' },
  yoru: { age: 18, sig: 'shuriken', bio: N4('SLOW TO WARM UP AND CAREFUL WITH WORDS, BUT FIRM WHEN IT MATTERS.', '慢熱謹慎，開口前會先斟酌，關鍵時刻卻很堅定。', '人見知りで言葉を選ぶが、大事なときはきっぱりしている。', '慢热谨慎，开口前会先斟酌，关键时刻却很坚定。'),
    look: '1girl, long wavy gray hair, thick bangs, large white bow covering her mouth, dark belted coat with metal buttons, dark tights, long boots, classic style' },
};
// weapon tiers for training: price in proofs
const W_TIER = { nail: 1, hail: 1, twin: 1, rivet: 1, splinter: 1, shuriken: 1, helix: 1, fist: 1, halo: 1, frostbite: 1,
  scatter: 2, volt: 2, edge: 2, lance: 2, whirl: 2, mirage: 2, carom: 2, crescent: 2, bow: 2, saw: 2, rail: 3, longshot: 3, trident: 3, hammer: 3, bloom: 3 };
const W_TIER_ORDER = Object.keys(W_TIER).sort((a, b) => W_TIER[a] - W_TIER[b]);
// how close she feels to you; her voice in chats and auto-speech follows it
const affTier = a => a >= AFF_MAX ? 3 : a >= 60 ? 2 : a >= 30 ? 1 : 0;
const TIER_C = () => ['#8e877b', TH.cyan, TH.pink, TH.gold];
// (the affection-tier prompts are in js/prompts.js: TIER_PROMPTS)

// ---------------- progress ----------------
const GKEY = 'achroma_girls';
let GP = null;
function gpLoad() { if (GP) return GP; let o = null; try { o = JSON.parse(STORE.getItem(GKEY) || 'null'); } catch (e) { }
  GP = Object.assign({ v: 1, proofs: 0, bring: null, girls: {} }, o && o.v === 1 ? o : {});
  // Older saves may predate training, chat or albums. Repair individual fields
  // without discarding valid progress, receipts or unrecognized extension data.
  const obj = v => v && typeof v === 'object' && !Array.isArray(v), num = (v, max) => Number.isFinite(Number(v)) ? Math.max(0, Math.min(max, Math.floor(Number(v)))) : 0;
  GP.proofs = num(GP.proofs, Number.MAX_SAFE_INTEGER);
  if (!obj(GP.girls)) GP.girls = {};
  // Legacy sortie selection is retired; keep existing squads in in-progress run saves.
  GP.bring = null;
  for (const id of SURV_IDS) if (Object.hasOwn(GP.girls, id)) {
    const d = GP.girls[id] = obj(GP.girls[id]) ? GP.girls[id] : {};
    d.met = num(d.met, Number.MAX_SAFE_INTEGER); d.aff = num(d.aff, AFF_MAX);
    if (!obj(d.lv)) d.lv = {}; for (const k of ['spd', 'dmg', 'hp']) d.lv[k] = num(d.lv[k], LV_MAX);
    d.own = Array.isArray(d.own) ? [...new Set(d.own.filter(w => typeof w === 'string' && Object.hasOwn(WEAPONS, w)))] : [];
    if (typeof d.wsel !== 'string' || !Object.hasOwn(WEAPONS, d.wsel)) d.wsel = null;
    d.log = Array.isArray(d.log) ? d.log.filter(q => q && !q.live && ['p', 'h'].includes(q.r) && typeof q.t === 'string' && q.t).slice(-48).map(q => ({ r: q.r, t: q.t.slice(0, 300) })) : [];
    d.imgs = Array.isArray(d.imgs) ? d.imgs.filter(q => obj(q) && typeof q.id === 'string' && q.id).slice(0, 24) : [];
    d.stories = Array.isArray(d.stories) ? [...new Set(d.stories.filter(n => Number.isInteger(n) && n >= 0 && n < 3))] : [];
    if (!obj(d.storyPage)) d.storyPage = {};
    d.storyPage = Object.fromEntries(Object.entries(d.storyPage).filter(([k, v]) => ['0', '1', '2'].includes(k) && Number.isInteger(v) && v >= 0 && v < 400));
    // the choices made in each chapter (index of the option picked at each choice, in order)
    if (!obj(d.storyPick)) d.storyPick = {};
    d.storyPick = Object.fromEntries(Object.entries(d.storyPick).filter(([k, v]) => ['0', '1', '2'].includes(k) && Array.isArray(v)).map(([k, v]) => [k, v.slice(0, 8).map(n => Number.isInteger(n) && n >= 0 && n < 4 ? n : 0)]));
  }
  if (!obj(GP.market)) GP.market = {};
  if (typeof GP.market.armory !== 'string' || !Object.hasOwn(WEAPONS, GP.market.armory)) GP.market.armory = null;
  return GP; }
function gpSave() { try { STORE.setItem(GKEY, JSON.stringify(gpLoad())); } catch (e) { } }
function girlData(id) { const g = gpLoad().girls; return g[id] || (g[id] = { met: 0, aff: 0, lv: { spd: 0, dmg: 0, hp: 0 }, own: [], wsel: null, log: [], imgs: [] }); }
const girlMet = id => !!(gpLoad().girls[id] && gpLoad().girls[id].met);
function girlMul(id) { const d = gpLoad().girls[id], lv = (d && d.lv) || {}; return { spd: 1 + .1 * (lv.spd || 0), dmg: 1 + .1 * (lv.dmg || 0), hp: 1 + .1 * (lv.hp || 0) }; }
function addAff(id, n) { const d = girlData(id), before = d.aff; d.aff = Math.min(AFF_MAX, d.aff + n); return d.aff - before; }
function girlWeapon(id) { const d = girlData(id); return d.wsel && WEAPONS[d.wsel] && (d.wsel === GIRL_INFO[id].sig || d.own.includes(d.wsel)) ? d.wsel : GIRL_INFO[id].sig; }
// Offline test code only; platform players cannot create progression by renaming.
// testing outside DZMM: everything is open (every girl met at full affection with her photo, 999 embers, the game cleared)
function localUnlockAll() { if (ONDZ()) return; girlsCheat(); const gp = gpLoad(); for (const id of SURV_IDS) girlData(id).priv = true; mkt().unl = Object.fromEntries(MK_WLOCK.map(k => [k, true])); gpSave(); if (!SET.cleared) { SET.cleared = true; saveSettings(); } }
function girlsCheat() { if (ONDZ()) return; const gp = gpLoad(); for (const id of SURV_IDS) { const d = girlData(id); d.met = Math.max(1, d.met); d.aff = AFF_MAX; } gp.proofs = 999; gpSave(); }
// meeting her at a camp
function girlsMeet(id) { if (window.BOSS_TEST && BOSS_TEST.on) return; const d = girlData(id); d.met++; const g = addAff(id, AFF_MEET); gpSave();
  if (g) G.later.push({ t: 1.2, f: () => notify(L('n_aff', svName(id), g), TH.pink) }); }
// a clear: proofs for the difficulty, and a big jump for everyone still standing beside you
function girlsOnClear() {
  if (window.BOSS_TEST && BOSS_TEST.on) return;
  if (!SET.cleared) { SET.cleared = true; saveSettings(); G.newUnlock = true; }
  const gp = gpLoad(); gp.clearRuns = Array.isArray(gp.clearRuns) ? gp.clearRuns : [];
  if (G.clearRewarded || gp.clearRuns.includes(G.rid)) { G.clearRewarded = true; return; }
  // The reward and its receipt share one KV value: a retry/replayed checkpoint
  // cannot award proofs or affection twice, even without batch KV support.
  const n = PROOF_BY_DIFF[G.diff] || 3; gp.proofs += n; G.proofGain = n; G.affGain = []; G.clearRewarded = true;
  gp.clearRuns = gp.clearRuns.concat(G.rid).slice(-128);
  gpSave();
}
// ---------------- AI settings: models ----------------
const AIM = { chat: null, draw: null, busy: false };
function aiLoadModels() {
  if (!ONDZ()) return Promise.resolve(); if (AIM.chat && AIM.draw) return Promise.resolve(); if (AIM.busy) return AIM.busy;
  return AIM.busy = Promise.all([dzmm.models.list().then(r => { AIM.chat = (r && r.models) || []; }).catch(() => { AIM.chat = []; }),
    (PLAT.caps.draw ? dzmm.draw.generateModels().then(r => { AIM.draw = (r && r.models) || []; AIM.drawDef = r && r.defaultModel; }).catch(() => { AIM.draw = []; }) : Promise.resolve(AIM.draw = []))]).finally(() => { AIM.busy = null; });
}
const chatModel = () => SET.aiChat || 'default', chatterModel = () => SET.aiAuto || 'default', drawModel = () => SET.aiDraw || AIM.drawDef || undefined;
function aiModelName(kind, v) { if (!ONDZ()) return L('ai_off'); if (!v) return L('ai_default');
  const list = kind === 'draw' ? AIM.draw : AIM.chat; if (!list) return L('ai_loading'); const m = list.find(q => (q.internalName || q.id) === v); return m ? m.displayName : v; }
// a drop-down list of the platform's models (fetched from DZMM), with "follow the platform setting" first
function aiPick(kind, key, title) {
  if (!ONDZ()) { netToast('ai_off', '#8e877b'); AU.play('locked'); return; }
  aiLoadModels().then(() => { const list = (kind === 'draw' ? AIM.draw : AIM.chat) || [];
    const items = [{ v: '', label: L('ai_default'), sub: L(kind === 'draw' ? 'ai_defDraw' : 'ai_defChat') }].concat(list.map(q => ({ v: q.internalName || q.id, label: q.displayName || q.internalName || q.id, sub: [q.price, q.description].filter(Boolean).join(' · ').slice(0, 120) })));
    openPicker({ title, items, cur: SET[key] || '', acc: TH.pink, onPick: v => { SET[key] = v || null; saveSettings(); AU.play('select'); } }); });
}
// one of the three global prompts: empty or unchanged means "use the default in js/prompts.js"
function aiPromptEd(k, title) {
  openTextEd({ title, hint: L('ai_pHint'), value: promptGlobal(k), multiline: true, maxLen: 4000, acc: TH.pink, reset: PROMPT_DEFAULTS[k],
    onOk: v => { v = String(v).trim(); SET['p_' + k] = v && v !== PROMPT_DEFAULTS[k] ? v : null; saveSettings(); } });
}
function aiItems() { const tog = () => { SET.aiChatter = SET.aiChatter === false; saveSettings(); AU.play('menu', 1.2); };
  const pv = k => SET['p_' + k] ? L('ai_custom') : L('ai_dflt');
  return [{ l: () => L('ai_chat'), v: () => fitText(aiModelName('chat', SET.aiChat), 150), act: () => aiPick('chat', 'aiChat', L('ai_chat')) },
    { l: () => L('ai_draw'), v: () => fitText(aiModelName('draw', SET.aiDraw), 150), act: () => aiPick('draw', 'aiDraw', L('ai_draw')) },
    { l: () => L('ai_rounds'), v: () => String(chatRounds()), act: () => openTextEd({ title: L('ai_rounds'), hint: L('ai_roundsHint'), value: chatRounds(), number: { min: 1, max: 20 }, acc: TH.pink, onOk: v => { SET.aiRounds = v; saveSettings(); } }) },
    { l: () => L('ai_pChat'), v: () => pv('chat'), act: () => aiPromptEd('chat', L('ai_pChat')) },
    { l: () => L('ai_pDraw'), v: () => pv('draw'), act: () => aiPromptEd('draw', L('ai_pDraw')) },
    { l: () => L('back'), act: () => backPage() }]; }

// ---------------- squad auto-speech: about once a minute, one of them says something about what is going on ----------------
const CHATTER = { t: 0, busy: false, kills: 0, req: 0 };
const CHATTER_EVERY = 60;
// the situation as a short list (the order and wording are part of the in-run speech prompt; see buildChatterPrompt in js/prompts.js)
function situation(m) {
  const p = G.p, r = roomAt(p.x, p.y), me = SET.name || '?', out = [], foes = G.enemies.filter(e => !e.dead).length, left = m.maxHits - m.hits;
  out.push('- 地点：' + chapterTitle(G.floor));
  if (G.boss && !G.boss.dead) out.push('- 正在发生：' + `正在和头目「${tr(G.boss.def.name)}」交战，它还剩大约${Math.max(1, Math.round(G.boss.hp / G.boss.maxHp * 100))}%的体力`);
  else out.push('- 正在发生：' + (r && r.active ? `在房间里战斗，还剩${foes}只怪物` : r && r.type === 'camp' ? '在幸存者营地的篝火旁歇脚' : r && r.type === 'shop' ? '在一处废弃的商店里补给' : r && r.type === 'boss' && WORLD.bossLocked ? '站在被封锁的头目房间门口' : '在废墟里探索，暂时没有危险'));
  out.push(`- 你的武器：${wname(m.wid)}；你的状态：${left > m.maxHits * .6 ? '还好' : left > m.maxHits * .3 ? '受了些伤' : '伤得不轻'}`);
  out.push(`- ${me}的武器：${wname(p.weapons[p.wi])}；${me}的剩余血量：${p.hp}/${p.maxHp}`);
  const k = G.kills - CHATTER.kills; if (k > 0) out.push(`- 最近：小队击倒了${k}只怪物`);
  out.push('- 头目房间的钥匙：' + (G.hasKey ? '已经拿到' : WORLD.bossLocked ? '还没找到' : '门已经打开'));
  const others = chatMates().filter(q => q.id !== m.id).map(q => svName(q.id)); if (others.length) out.push('- 同行的还有：' + others.join('、'));
  // the mood: worried when you are hurt, keyed up against a boss, rallying in a fight, otherwise relaxed
  const mood = p.hp <= 2 ? 'hurt' : G.boss && !G.boss.dead ? 'boss' : left <= m.maxHits * .3 ? 'self' : r && r.active ? 'fight' : 'calm';
  return { text: out.join('\n'), mood };
}
function updateChatter(dt) { return; // in-run auto speech was removed
  if (!chatOn() || SET.aiChatter === false || G.state !== 'play' || !G.p || !G.p.alive) return;
  const ms = chatMates(); if (!ms.length) { CHATTER.t = 0; return; }
  CHATTER.t += dt; if (CHATTER.t < CHATTER_EVERY || CHATTER.busy || SQ.ticker.length) return;
  CHATTER.t = 0; const m = choice(ms), rq = ++CHATTER.req, rid = G.rid; CHATTER.busy = true;
  const sit = situation(m), prompt = buildChatterPrompt(m, sit.text, sit.mood);
  CHATTER.kills = G.kills; let txt = '';
  dzmm.completions({ model: chatterModel(), messages: [{ role: 'user', content: prompt }], maxTokens: 200 }, c => { txt = String(c || ''); })
    .then(() => { if (rq !== CHATTER.req || G.rid !== rid || m.away) return; const s = txt.replace(/^[\s"“「『]+|[\s"”」』]+$/g, '').split('\n')[0].slice(0, 48);
      if (s) SQ.ticker.push({ id: m.id, txt: s, t: 0 }); })
    .catch(() => { }).finally(() => { if (rq === CHATTER.req) CHATTER.busy = false; });
}

// ---------------- the 少女们 page ----------------
const GIRLS = { sel: null, tab: 0, chat: false, wscroll: 0, drag: null, gen: false, genReq: 0, view: null, hits: [], t: 0, flash: null };
const GAL = new Map(); // taskId -> { img, at, lost }
function openGirls() { gpLoad(); closePartnerStory(); const ids = SURV_IDS.filter(girlMet); GIRLS.sel = ids.includes(GIRLS.sel) ? GIRLS.sel : ids[0] || null; GIRLS.tab = 0; GIRLS.chat = false; GIRLS.view = null; GIRLS.wscroll = 0; GIRLS.t = 0; goPage('girls'); if (GIRLS.sel) loadPortrait(GIRLS.sel); aiLoadModels(); }
function girlsLayout() {
  const ph = Math.round(Math.min(214, H - 40)), pw = Math.round(ph * PORT_AR), px = W - 34 - pw, mx = 42;
  return { por: { x: px, y: H - 20 - ph, w: pw, h: ph }, mx, mw: px - mx - 16, my: 42 };
}
function gFlash(k, c) { GIRLS.flash = { txt: L(k), c: c || TH.red, t: 0 }; }
function buy(cost) { const gp = gpLoad(); if (gp.proofs < cost) { gFlash('g_noProof'); AU.play('locked'); return false; } gp.proofs -= cost; AU.play('shop'); return true; }
function updateGirls(rdt) {
  GIRLS.t += rdt; if (GIRLS.flash) { GIRLS.flash.t += rdt; if (GIRLS.flash.t > 2) GIRLS.flash = null; }
  if (PST.open) { updatePartnerStory(rdt); return; }
  if (GIRLS.chat) { updateChat(rdt); return; }
  if (GIRLS.view) {
    if (pressed('Escape') || pressed('Enter')) { GIRLS.view = null; Input.clicked = false; }
    else if (Input.clicked) { const hit = GIRLS.hits.find(h => h.view && inR(h, Input.mx, Input.my)); Input.clicked = false; if (hit) hit.f(); else GIRLS.view = null; }
    return;
  }
  if (pressed('Escape')) { backPage(); return; }
  const mx = Input.mx, my = Input.my;
  if (GIRLS.tab === 3 && Input.wheel) GIRLS.wscroll = Math.max(0, GIRLS.wscroll + Input.wheel);
  if (GIRLS.drag) { const g = GIRLS.drag; if (Math.abs(my - g.y) > 4) g.moved = true; if (g.moved) GIRLS.wscroll = Math.max(0, Math.round(g.s - (my - g.y) / 11));
    if (!Input.down) { GIRLS.drag = null; if (!g.moved && g.hit) g.hit.f(); } }
  if (!Input.clicked) return; Input.clicked = false;
  for (const h of GIRLS.hits) if (inR(h, mx, my)) { if (h.drag) GIRLS.drag = { y: my, s: GIRLS.wscroll, hit: h, moved: false }; else h.f(); return; }
}
// buttons are collected while drawing, so layout and clicks never disagree
function gBtn(x, y, w, h, label, acc, f, on = true, hov) { const b = { x, y, w, h, f: on ? f : () => { AU.play('locked'); } }; GIRLS.hits.push(b);
  drawBtn(x, y, w, h, label, !TOUCH.on && inR(b, Input.mx, Input.my) && on, on ? acc : '#3c3732'); return b; }
function drawGirls(t) {
  panel('', TH.pink); GIRLS.hits = []; const lay = girlsLayout(), gp = gpLoad();
  if (PST.open) { drawPartnerStory(); return; }
  gBtn(34, 18, 54, 16, L('back'), '#e8e1d3', () => backPage());
  // proofs
  { const s = L('g_proofs', gp.proofs), x = W - 64 - textW(s); drawProof(x - 10, 21); text(s, x, 22 - (isCJK(s) ? 1 : 0), TH.gold); }
  if (!GIRLS.sel) { wrapW(L('g_none'), lay.mw + 120).forEach((l, i) => text(l, lay.mx, lay.my + 30 + i * lineH(), '#6e675c')); drawGirlsFlash(); return; }
  const id = GIRLS.sel, S = SURV[id], d = girlData(id), I = GIRL_INFO[id], c = S.c;
  drawPortraitAt(id, lay.por.x, lay.por.y, lay.por.h, clamp(GIRLS.t / .3, 0, 1));
  const x = lay.mx, y = lay.my, w = lay.mw;
  if (GIRLS.tab === 0) drawGirlInfo(id, d, I, c, x, y, w); else if (GIRLS.tab === 1) drawGirlTrain(id, d, I, c, x, y, w); else if (GIRLS.tab === 3) drawGirlEquip(id, d, I, c, x, y, w); else drawGirlAlbum(id, d, c, x, y, w);
  drawGirlsFlash();
  if (GIRLS.view) drawGirlView(id);
  if (GIRLS.chat) drawChat();
}
function drawGirlsFlash() { const f = GIRLS.flash; if (!f) return; const a = clamp(Math.min(f.t / .1, (2 - f.t) / .3), 0, 1), w = textW(f.txt) + 16, x = Math.round(W / 2 - w / 2), y = H - 30;
  ctx.globalAlpha = a; rect(x, y, w, 13, '#0b0b0d'); box(x, y, w, 13, null, f.c); text(f.txt, W / 2, y + (isCJK(f.txt) ? 2 : 4), f.c, 1, 'center'); ctx.globalAlpha = 1; }
// the embers (火种, the currency between runs): a small flame on a coal
function drawProof(x, y) { rect(x + 3, y, 1, 1, '#ffb070'); rect(x + 2, y + 1, 2, 1, '#ff9a4a'); rect(x + 4, y + 2, 1, 1, '#ff9a4a'); rect(x + 1, y + 2, 4, 2, '#e0702a'); rect(x + 2, y + 3, 2, 1, '#ffd890'); rect(x + 1, y + 4, 5, 1, '#c0501e'); rect(x, y + 5, 7, 2, '#3a2a24'); rect(x + 1, y + 5, 2, 1, '#8a3a1a'); rect(x + 4, y + 6, 1, 1, '#b04a1a'); }
function drawHeart(x, y, c) { rect(x, y, 2, 2, c); rect(x + 3, y, 2, 2, c); rect(x - 1, y + 1, 7, 2, c); rect(x, y + 3, 5, 1, c); rect(x + 1, y + 4, 3, 1, c); rect(x + 2, y + 5, 1, 1, c); }
function drawGirlInfo(id, d, I, c, x, y, w) {
  const nm = svName(id), tier = affTier(d.aff); textS(nm, x, y + 2, c, 2); text(L('g_age', I.age), x + textW(nm, 2) + 8, y + 7 - (isCJK(L('g_age', 1)) ? 1 : 0), '#8e877b');
  const ay = y + 26; text(L('g_aff'), x, ay - (isCJK(L('g_aff')) ? 1 : 0), '#8e877b'); const tl = L('g_tier' + tier); text(tl, x + w, ay - (isCJK(tl) ? 1 : 0), TIER_C()[tier], 1, 'right');
  rect(x, ay + 10, w, 5, '#1d1a17'); rect(x, ay + 10, Math.round(w * d.aff / AFF_MAX), 5, TIER_C()[tier]); for (const q of [30, 60]) rect(x + Math.round(w * q / AFF_MAX), ay + 9, 1, 7, '#0a0908');
  text(d.aff + ' / ' + AFF_MAX, x, ay + 18, '#aaa293');
  const lines = wrapW(tr(I.bio), w); lines.slice(0, 4).forEach((l, i) => text(l, x, ay + 32 + i * lineH(), '#c9c1b2'));
  // actions
  const by = H - 48;
  gBtn(x, by, Math.floor(w / 2) - 3, 16, L('g_chat'), c, () => { if (!chatOn()) { gFlash('g_dz'); return; } openChatMenu(id); }, chatOn());
  gBtn(x + Math.floor(w / 2) + 3, by, Math.ceil(w / 2) - 3, 16, L('ps_title'), TH.gold, () => openPartnerStories(id));
}
function drawGirlTrain(id, d, I, c, x, y, w) {
  const gp = gpLoad(); let yy = y + 2;
  for (const k of ['spd', 'dmg', 'hp']) { const lv = d.lv[k] || 0; text(L('g_' + k), x, yy + 3 - (isCJK(L('g_' + k)) ? 1 : 0), '#c9c1b2');
    for (let i = 0; i < LV_MAX; i++) rect(x + 56 + i * 4, yy + 3, 3, 5, i < lv ? c : '#27231f');
    text('+' + lv * 10 + '%', x + 56 + LV_MAX * 4 + 3, yy + 3, lv ? '#e8e1d3' : '#57524a');
    if (lv >= LV_MAX) text(L('g_max'), x + w, yy + 3, '#8e877b', 1, 'right');
    else { const b = gBtn(x + w - 24, yy, 24, 13, '1', TH.gold, () => { if (buy(1)) { d.lv[k] = lv + 1; gpSave(); } }); drawProof(b.x + 4, b.y + 3); }
    yy += 17; }
  // weapons: the signature one is free, the rest cost 1 / 2 / 3 proofs
  yy += 2; text(L('g_weapons'), x, yy, '#8e877b'); const cur = girlWeapon(id), list = [I.sig].concat(W_TIER_ORDER.filter(q => q !== I.sig)), ly = yy + 10, rows = Math.max(3, Math.floor((H - 22 - ly) / 11)), maxS = Math.max(0, list.length - rows);
  GIRLS.wscroll = Math.min(GIRLS.wscroll, maxS); const area = { x, y: ly, w, h: rows * 11 };
  for (let i = 0; i < rows && i + GIRLS.wscroll < list.length; i++) { const wid = list[i + GIRLS.wscroll], ry = ly + i * 11, own = wid === I.sig || d.own.includes(wid), use = wid === cur, tier = W_TIER[wid];
    const hov = !TOUCH.on && inR({ x, y: ry, w, h: 10 }, Input.mx, Input.my); if (use || hov) rect(x, ry, w, 10, use ? '#1c1a12' : '#151310');
    ctx.drawImage(sprite('w_' + wid, WEAPONS[wid].spr).n, x + 1, ry + 1, Math.min(14, sprite('w_' + wid, WEAPONS[wid].spr).w), 8);
    text(fitText(wname(wid), w - 90), x + 18, ry + 2 - (isCJK(wname(wid)) ? 1 : 0), use ? TH.gold : own ? '#e8e1d3' : '#8e877b');
    text(L('g_tier' + ['N', 'M', 'A'][tier - 1]), x + w - 52, ry + 2 - (isCJK(L('g_tierN')) ? 1 : 0), ['#8e877b', TH.cyan, TH.orange][tier - 1]);
    if (use) text(L('g_using'), x + w, ry + 2 - (isCJK(L('g_using')) ? 1 : 0), TH.gold, 1, 'right'); else if (own) text(L('g_owned'), x + w, ry + 2 - (isCJK(L('g_owned')) ? 1 : 0), '#aaa293', 1, 'right');
    else { text(String(tier), x + w - 2, ry + 2, gp.proofs >= tier ? TH.gold : '#57524a', 1, 'right'); drawProof(x + w - 14, ry + 1); }
    GIRLS.hits.push({ x, y: ry, w, h: 10, drag: true, f: () => { if (own) { d.wsel = wid; gpSave(); AU.play('menuOk'); } else if (buy(tier)) { d.own.push(wid); d.wsel = wid; gpSave(); } } }); }
  if (maxS) { const kh = Math.max(8, area.h * rows / list.length), ky = ly + (area.h - kh) * GIRLS.wscroll / maxS; rect(x + w + 3, ly, 1, area.h, '#1f1f24'); rect(x + w + 2, ky, 3, kh, '#4c463f'); }
}
// ---- album: pictures drawn by the platform (only task ids are kept; addresses are fetched when shown) ----
function galSetImage(g, url) {
  const im = new Image(); g.img = im; g.bad = false; g.next = Date.now() + 50 * 60e3;
  im.onload = () => { if (g.img === im) { g.bad = false; g.fails = 0; } };
  im.onerror = () => { if (g.img === im) { g.bad = true; galRetry(g); } };
  im.src = url;
}
function galRetry(g) { g.fails = Math.min(5, (g.fails || 0) + 1); g.next = Date.now() + Math.min(60000, 5000 * 2 ** (g.fails - 1)); }
function galImg(taskId) {
  let g = GAL.get(taskId); if (g && (g.lost || g.busy || Date.now() < (g.next ?? (g.at + 50 * 60e3)))) return g;
  g = Object.assign(g || {}, { busy: true, at: Date.now(), next: Date.now() + 5000 }); GAL.set(taskId, g);
  if (!ONDZ() || PLAT.caps.drawStatus !== true) { g.busy = false; if (!g.img) g.lost = true; return g; }
  Promise.resolve().then(() => dzmm.draw.status(taskId)).then(r => { const u = r && r.images && r.images[0]; if (u) galSetImage(g, u); else if (r && r.status === 'failed') g.lost = true; })
    .catch(e => { if (e && e.code === 'KEY_NOT_FOUND') g.lost = true; else galRetry(g); }).finally(() => { g.busy = false; }); return g;
}
// asks for the picture's description (starting from her look, or what you used last time); the global image prompt goes in front
function girlGenAsk(id) {
  if (!ONDZ() || !PLAT.caps.draw) { gFlash('g_dz'); return; } if (GIRLS.gen) return; const d = girlData(id);
  openTextEd({ title: L('g_genT', svName(id)), hint: L('g_genHint', promptGlobal('draw')), value: d.lastPrompt || GIRL_INFO[id].look, multiline: true, maxLen: 1500, acc: SURV[id].c, reset: GIRL_INFO[id].look, okLabel: L('g_gen'),
    onOk: v => { v = String(v).trim(); if (!v) return L('g_genEmpty'); d.lastPrompt = v; gpSave(); girlGenerate(id, v); } });
}
async function girlGenerate(id, input) {
  if (!ONDZ() || !PLAT.caps.draw) { gFlash('g_dz'); return; } if (GIRLS.gen) return; GIRLS.gen = true; const rq = ++GIRLS.genReq, d = girlData(id);
  try { const r = await dzmm.draw.generate({ prompt: buildDrawPrompt(input).slice(0, 2000), dimension: '2:3', model: drawModel(), negativePrompt: DRAW_NEGATIVE });
    if (r && r.taskId) { d.imgs.unshift({ id: r.taskId, at: Date.now() }); d.imgs = d.imgs.slice(0, 24); gpSave(); const u = r.images && r.images[0]; if (u) { const g = { at: Date.now() }; GAL.set(r.taskId, g); galSetImage(g, u); } AU.play('select'); }
  } catch (e) { /* the platform shows its own message (quota, review, ...) */ } finally { if (rq === GIRLS.genReq) GIRLS.gen = false; }
}
// ---- the private photo (bought at the black market): assets/private/<id>.png in the published game, copied there from 111/<名字>.png by
// tools/dzmm/build.mjs; a local preview of the source folder reads 111/ directly. Loaded only when it is opened.
const PRIV = new Map();
const privUrl = id => 'assets/private/' + id + '.png', privSrc = id => '111/' + encodeURIComponent(SURV[id].file) + '.png';
function privImg(id) { let im = PRIV.get(id); if (im) return im; im = new Image(); im.onerror = () => { if (!im.src.includes('111/')) im.src = privSrc(id); else im.bad = true; }; im.src = privUrl(id); PRIV.set(id, im); return im; }
// saving: a download link where downloads are allowed; inside the DZMM frame the picture opens in a new tab to be saved from there
function privSave(id) { const im = privImg(id), url = new URL(im.src, document.baseURI).href;
  if (ONDZ()) { let win = null; try { win = window.open(url, '_blank'); } catch (e) { } if (!win) gFlash('g_saveNo'); return; }
  const a = document.createElement('a'); a.href = url; a.download = 'TheSeed-' + id + '.png'; document.body.appendChild(a); a.click(); a.remove(); }
function drawGirlAlbum(id, d, c, x, y, w) {
  const on = ONDZ() && PLAT.caps.draw, pw = d.priv ? 76 : 0;
  if (d.priv) gBtn(x + w - pw, y, pw, 14, L('g_priv'), TH.pink, () => { privImg(id); GIRLS.view = 'priv:' + id; AU.play('menuOk'); });
  gBtn(x, y, w - (pw ? pw + 4 : 0), 14, GIRLS.gen ? L('g_genning') : L('g_gen'), c, () => girlGenAsk(id), on && !GIRLS.gen);
  if (GIRLS.gen) { const k = (GIRLS.t * 1.5) % 1; rect(x, y + 15, w * k, 1, c); }
  if (!on) text(L('g_dz'), x, y + 20, '#57524a');
  const ty = y + 30, tw = 40, th = 60, cols = Math.max(1, Math.floor((w + 4) / (tw + 4))), rows = Math.max(1, Math.floor((H - 20 - ty) / (th + 4)));
  if (!d.imgs.length) text(L('g_empty'), x, ty + 4, '#57524a');
  d.imgs.slice(0, cols * rows).forEach((q, i) => { const tx = x + (i % cols) * (tw + 4), yy = ty + Math.floor(i / cols) * (th + 4), g = galImg(q.id);
    rect(tx, yy, tw, th, '#151310'); box(tx, yy, tw, th, null, '#2d2925');
    if (g.img && g.img.complete && g.img.naturalWidth) { ctx.imageSmoothingEnabled = true; ctx.drawImage(g.img, tx + 1, yy + 1, tw - 2, th - 2); ctx.imageSmoothingEnabled = false; }
    else if (g.lost || g.bad) text('X', tx + tw / 2, yy + th / 2 - 2, '#57524a', 1, 'center'); else text('.'.repeat(1 + ((GIRLS.t * 3) | 0) % 3), tx + tw / 2, yy + th / 2 - 2, '#57524a', 1, 'center');
    GIRLS.hits.push({ x: tx, y: yy, w: tw, h: th, f: () => { GIRLS.view = q.id; AU.play('menuOk'); } }); });
}
function drawPrivView(id) {
  ctx.globalAlpha = .9; rect(0, 0, W, H, '#000'); ctx.globalAlpha = 1; const im = privImg(id), bw = 70, by = H - 30;
  if (im.complete && im.naturalWidth) { const s = Math.min((W - 40) / im.naturalWidth, (H - 50) / im.naturalHeight), w = Math.round(im.naturalWidth * s), h = Math.round(im.naturalHeight * s), x = Math.round(W / 2 - w / 2), y = 14;
    ctx.imageSmoothingEnabled = true; ctx.drawImage(im, x, y, w, h); ctx.imageSmoothingEnabled = false; box(x - 1, y - 1, w + 2, h + 2, null, SURV[id].c); }
  else text(im.bad ? L('g_lost') : L('bd_loading'), W / 2, H / 2 - 4, '#8e877b', 1, 'center');
  const push = (i, k, f, acc) => { const b = { x: W / 2 - bw - 3 + i * (bw + 6), y: by, w: bw, h: 16, view: true, f }; GIRLS.hits.push(b); drawBtn(b.x, b.y, b.w, b.h, L(k), !TOUCH.on && inR(b, Input.mx, Input.my), acc); };
  push(0, 'g_save', () => privSave(id), TH.cyan); push(1, 'back', () => { GIRLS.view = null; }, '#e8e1d3');
  if (GIRLS.flash) text(GIRLS.flash.txt, W / 2, by - 12, GIRLS.flash.c, 1, 'center');
}
function drawGirlView(id) {
  if (String(GIRLS.view).startsWith('priv:')) { drawPrivView(id); return; }
  const g = galImg(GIRLS.view); ctx.globalAlpha = .85; rect(0, 0, W, H, '#000'); ctx.globalAlpha = 1;
  if (g.img && g.img.complete && g.img.naturalWidth) {
    const h = H - 50, w = Math.round(h * 2 / 3), x = Math.round(W / 2 - w / 2), y = 14; ctx.imageSmoothingEnabled = true; ctx.drawImage(g.img, x, y, w, h); ctx.imageSmoothingEnabled = false; box(x - 1, y - 1, w + 2, h + 2, null, SURV[id].c);
  } else text(L(g.lost || g.bad ? 'g_lost' : 'bd_loading'), W / 2, H / 2 - 4, '#8e877b', 1, 'center');
  const d = girlData(id), tid = GIRLS.view, bw = 70, by = H - 30, ok = PLAT.caps.drawPresentation === true, n = ok ? 3 : 2, bx = W / 2 - (n * bw + (n - 1) * 6) / 2;
  const push = (i, k, f, acc) => { const b = { x: bx + i * (bw + 6), y: by, w: bw, h: 16, view: true, f }; GIRLS.hits.push(b); drawBtn(b.x, b.y, b.w, b.h, L(k), !TOUCH.on && inR(b, Input.mx, Input.my), acc); };
  if (ok) push(0, 'g_save', () => { Promise.resolve().then(() => dzmm.draw.download(tid)).catch(() => gFlash('g_saveNo')); }, TH.cyan);
  push(ok ? 1 : 0, 'g_del', () => { d.imgs = d.imgs.filter(q => q.id !== tid); gpSave(); GIRLS.view = null; AU.play('menu', .8); }, TH.red);
  push(ok ? 2 : 1, 'back', () => { GIRLS.view = null; }, '#e8e1d3');
  if (GIRLS.flash) text(GIRLS.flash.txt, W / 2, by - 12, GIRLS.flash.c, 1, 'center');
}
// the portrait at any height (the cached canvas is made for the talk screen's size)
function drawPortraitAt(id, x, y, h, a) {
  const P = portraitReady(id), w = Math.round(h * PORT_AR); if (!P) { ctx.globalAlpha = a * .2; rect(x + w * .3, y + 20, w * .4, h - 20, SURV[id].c); ctx.globalAlpha = 1; return; }
  ctx.globalAlpha = a; ctx.imageSmoothingEnabled = true; ctx.drawImage(P.cv, x, y, w, h); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 1;
}
