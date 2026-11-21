// Handwritten companion stories, read like a visual novel: the place fills the screen, her art stands in it, the lines type
// themselves into a box at the foot; a chapter opens on a title card and ends on one; choices change a few lines; a log and an
// auto mode. Art is bundled (assets/stories); progress and choices share the existing DZMM KV save (girlData).
'use strict';
Object.assign(STR, {
  ps_title: ['PARTNER STORIES', '搭檔故事', 'パートナーストーリー', '搭档故事'],
  ps_thresholds: ['UNLOCK AT 30 / 60 / 100 AFFECTION', '好感度 30 / 60 / 100 解鎖', '好感度 30 / 60 / 100 で解放', '好感度 30 / 60 / 100 解锁'],
  ps_part: ['CHAPTER {0}', '第 {0} 話', '第 {0} 話', '第 {0} 话'],
  ps_locked: ['AFFECTION {0} REQUIRED', '好感度達到 {0} 解鎖', '好感度 {0} で解放', '好感度达到 {0} 解锁'],
  ps_read: ['READ', '已讀', '読了', '已读'], ps_new: ['NEW', '未讀', '未読', '未读'],
  ps_continue: ['CONTINUE', '繼續閱讀', '続きを読む', '继续阅读'],
  ps_log: ['LOG', '記錄', 'ログ', '记录'], ps_auto: ['AUTO', '自動', 'オート', '自动'], ps_end: ['— END —', '— 完 —', '— 終 —', '— 完 —'],
  ps_retry: ['RELOAD ART', '重載立繪', '立ち絵を再読込', '重载立绘'], ps_logHint: ['WHEEL TO SCROLL · CLICK TO CLOSE', '滾輪翻看 · 點擊關閉', 'ホイールで移動・クリックで閉じる', '滚轮翻看 · 点击关闭'],
});
const PST = { open: false, id: null, episode: -1, page: 0, pages: [], hits: [], t: 0, tt: 0, card: 99, sceneT: 9, auto: false, autoT: 0, log: false, logS: 0, end: -1, pose: 0, prevPose: 0, poseT: 9, hov: -1 };
const STORY_AFF = [30, 60, 100], STORY_IMAGES = new Map(), STORY_CPS = 30;
function storyUnlocked(id, episode) {
  return SURV_IDS.includes(id) && Number.isInteger(episode) && episode >= 0 && episode < 3 && girlMet(id) && girlData(id).aff >= STORY_AFF[episode];
}
function closePartnerStory() { PST.open = false; PST.episode = -1; PST.hits = []; PST.pages = []; PST.log = false; }
function openPartnerStories(id) {
  if (!SURV_IDS.includes(id) || !girlMet(id)) return false;
  Object.assign(PST, { open: true, id, episode: -1, page: 0, pages: [], hits: [], t: 0, log: false, end: -1 });
  for (let e = 0; e < 3; e++) storyImage(id, PARTNER_STORIES[id][e].scenes[0].pose);
  GIRLS.drag = null; Input.clicked = false; AU.play('menuOk'); return true;
}
// ---- the script: lines become pages; a choice that has not been made yet ends the list there ----
function storyPicks(id, ep) { const d = girlData(id); if (!d.storyPick || typeof d.storyPick !== 'object' || Array.isArray(d.storyPick)) d.storyPick = {};
  const a = d.storyPick[ep]; return Array.isArray(a) ? a.map(v => Number.isInteger(v) ? v : -1) : []; }
function storyPages(id, ep, picks) {
  const out = []; let qi = 0;
  const push = (scene, si, s) => { const k = s[0]; out.push({ scene, si, who: k === '@' ? 'h' : k === '#' ? 'p' : k === '~' ? 'm' : 'n', body: s.slice(1) }); };
  for (const [si, scene] of PARTNER_STORIES[id][ep].scenes.entries()) for (const ln of scene.lines) {
    if (typeof ln === 'string') { push(scene, si, ln); continue; }
    const o = ln.choice[picks[qi]]; if (!o) { out.push({ scene, si, choice: ln.choice, qi }); return out; }
    if (/^["“]/.test(o.label)) push(scene, si, '#' + o.label.replace(/^["“]|["”]$/g, '')); for (const l of o.lines) push(scene, si, l); qi++;
  }
  return out;
}
function openPartnerStory(episode) {
  if (!storyUnlocked(PST.id, episode)) { AU.play('locked'); return false; }
  PST.episode = episode; PST.pages = storyPages(PST.id, episode, storyPicks(PST.id, episode));
  const d = girlData(PST.id), saved = d.storyPage && d.storyPage[episode];
  PST.page = Number.isInteger(saved) ? clamp(saved, 0, PST.pages.length - 1) : 0;
  Object.assign(PST, { hits: [], tt: PST.page ? 99 : 0, card: PST.page ? 99 : 0, sceneT: PST.page ? 9 : 0, autoT: 0, log: false, end: -1, pose: PST.pages[PST.page].scene.pose, prevPose: 0, poseT: 9 });
  storyImage(PST.id, PST.pose); AU.play('menuOk'); return true;
}
function saveStoryPage() {
  if (!storyUnlocked(PST.id, PST.episode)) return;
  const d = girlData(PST.id); if (!d.storyPage || typeof d.storyPage !== 'object' || Array.isArray(d.storyPage)) d.storyPage = {};
  d.storyPage[PST.episode] = PST.page; gpSave();
}
function storyChoose(i) { const pg = PST.pages[PST.page]; if (!pg || !pg.choice || !pg.choice[i]) return;
  const picks = storyPicks(PST.id, PST.episode); picks[pg.qi] = i; for (let k = 0; k < pg.qi; k++) if (!Number.isInteger(picks[k]) || picks[k] < 0) picks[k] = 0;
  girlData(PST.id).storyPick[PST.episode] = picks; PST.pages = storyPages(PST.id, PST.episode, picks); PST.tt = 0; PST.autoT = 0; saveStoryPage(); AU.play('menuOk'); }
function storyGoto(p, full) { const old = PST.pages[PST.page]; PST.page = clamp(p, 0, PST.pages.length - 1); const pg = PST.pages[PST.page];
  if (old.si !== pg.si) PST.sceneT = 0; if (pg.scene.pose !== PST.pose) { PST.prevPose = PST.pose; PST.pose = pg.scene.pose; PST.poseT = 0; storyImage(PST.id, PST.pose); }
  PST.tt = full ? 99 : 0; PST.autoT = 0; saveStoryPage(); }
function storyAdvance(delta) {
  if (!PST.open || PST.episode < 0 || !storyUnlocked(PST.id, PST.episode) || PST.end >= 0) return;
  const pg = PST.pages[PST.page]; if (delta > 0 && pg.choice) return;
  if (delta > 0 && PST.page === PST.pages.length - 1) { // the last line: the chapter is read
    const d = girlData(PST.id); d.stories = Array.isArray(d.stories) ? d.stories : [];
    if (!d.stories.includes(PST.episode)) d.stories.push(PST.episode);
    if (d.storyPage) delete d.storyPage[PST.episode]; gpSave(); PST.end = 0; PST.auto = false; AU.play('chipGet', .8, .5); return; }
  if (delta < 0 && PST.page === 0) return;
  storyGoto(PST.page + delta, delta < 0); AU.play('menu', 1.15, .45);
}
const storyTyped = pg => !pg || pg.choice || PST.tt * STORY_CPS >= [...pg.body].length;
function storyTap() { // a click or Enter on the stage: skip the title card, finish the line, or go on
  if (PST.card < 2.3) { PST.card = 99; return; } const pg = PST.pages[PST.page]; if (!pg || pg.choice) return;
  if (!storyTyped(pg)) { PST.tt = 99; return; } storyAdvance(1); }
function storyImage(id, pose, retry = false) {
  const key = id + '-p' + pose;
  if (!SURV_IDS.includes(id) || !Number.isInteger(pose) || pose < 1 || pose > 6) return null;
  if (retry) STORY_IMAGES.delete(key);
  if (STORY_IMAGES.has(key)) return STORY_IMAGES.get(key);
  while (STORY_IMAGES.size >= 14) STORY_IMAGES.delete(STORY_IMAGES.keys().next().value);
  const asset = { img: new Image(), ready: false, failed: false };
  asset.img.onload = () => { asset.ready = true; }; asset.img.onerror = () => { asset.failed = true; };
  asset.img.src = 'assets/stories/' + key + '.webp?v=' + GAME_V;
  STORY_IMAGES.set(key, asset); return asset;
}
function updatePartnerStory(dt) {
  PST.t += dt; PST.tt += dt; PST.card += dt; PST.sceneT += dt; PST.poseT += dt;
  if (!girlMet(PST.id)) { closePartnerStory(); return; }
  if (PST.episode >= 0 && !storyUnlocked(PST.id, PST.episode)) { PST.episode = -1; PST.hits = []; }
  if (PST.episode >= 0 && PST.end >= 0) { PST.end += dt; if (PST.end > 2.4 || ((Input.clicked || pressed('Enter') || pressed('Space') || pressed('Escape')) && PST.end > .6)) { Input.clicked = false; PST.episode = -1; PST.end = -1; PST.hits = []; } return; }
  if (PST.log) { if (Input.wheel) PST.logS = Math.max(0, PST.logS - Input.wheel * 14);
    if (Input.clicked) { Input.clicked = false; PST.logDrag = { y: Input.my, s: PST.logS, moved: false }; }
    const g = PST.logDrag; if (g) { if (Math.abs(Input.my - g.y) > 4) g.moved = true; if (g.moved) PST.logS = Math.max(0, g.s + (Input.my - g.y)); if (!Input.down) { PST.logDrag = null; if (!g.moved) { PST.log = false; AU.play('menu', .8); } } }
    if (pressed('Escape') || pressed('KeyL')) { PST.log = false; PST.logDrag = null; AU.play('menu', .8); } return; }
  if (pressed('Escape')) { if (PST.episode >= 0) { saveStoryPage(); PST.episode = -1; PST.hits = []; } else closePartnerStory(); Input.clicked = false; return; }
  if (PST.episode >= 0) {
    const pg = PST.pages[PST.page];
    if (pg && pg.choice) { if (pressed('Digit1')) storyChoose(0); else if (pressed('Digit2')) storyChoose(1); }
    else if (pressed('Enter') || pressed('Space') || pressed('ArrowRight') || pressed('KeyD')) storyTap();
    if (pressed('ArrowLeft') || pressed('KeyA')) storyAdvance(-1);
    if (pressed('KeyL')) { PST.log = true; PST.logS = 0; AU.play('menu'); }
    if (pressed('KeyQ')) { PST.auto = !PST.auto; PST.autoT = 0; AU.play('menu', 1.2); }
    if (Input.wheel < 0 && !pg.choice) { PST.log = true; PST.logS = 0; }
    // auto: once the line is out, wait a moment that grows with its length
    if (PST.auto && pg && !pg.choice && PST.card > 2.3 && storyTyped(pg)) { PST.autoT += dt; if (PST.autoT > 1.1 + [...pg.body].length * .045) storyAdvance(1); }
  } else if (pressed('Digit1') || pressed('Digit2') || pressed('Digit3')) openPartnerStory(pressed('Digit1') ? 0 : pressed('Digit2') ? 1 : 2);
  if (Input.clicked) { Input.clicked = false; const hit = PST.hits.find(h => inR(h, Input.mx, Input.my)); if (hit) hit.f(); else if (PST.episode >= 0) storyTap(); }
}
// ---------------- drawing ----------------
// a plain text button (no plate): dim, lit when hovered
function storyLink(x, y, label, f, on, align = 'right') { const w = textW(label) + 8, bx = align === 'right' ? x - w : x, b = { x: bx, y: y - 3, w, h: 13, f }; PST.hits.push(b);
  const hv = !TOUCH.on && inR(b, Input.mx, Input.my); text(label, bx + 4, y - (isCJK(label) ? 1 : 0), hv ? '#ffffff' : on ? TH.emberHi : '#9a9284', 1); if (hv || on) rect(bx + 4, y + 9, w - 8, 1, hv ? '#ffffff' : TH.ember); return bx; }
function storyPlate(x, y, w, h, hv, edge) { rect(x, y, w, h, 'rgba(8,8,10,.86)'); box(x, y, w, h, null, hv ? '#ffffff' : edge || WIN_EDGE); }
function storyLock(x, y, color) { box(x, y + 5, 9, 7, color); box(x + 2, y, 5, 7, null, color); rect(x + 4, y + 7, 1, 3, '#0a0908'); }
// her art: the pose image (or the plain portrait while it loads), standing a little right of centre, breathing; dimmed while
// someone else is talking; a new pose cross-fades in
function storySprite(id, pose, a, dim, x0) {
  const art = storyImage(id, pose), ph = H * 1.1, bob = Math.sin(PST.t * 1.3) * 1.2, y = H * .05 + bob;
  ctx.save(); ctx.globalAlpha = a; if (dim < 1) ctx.filter = `brightness(${dim})`;
  if (art && art.ready) { const pw = ph * art.img.naturalWidth / art.img.naturalHeight; ctx.imageSmoothingEnabled = true; ctx.drawImage(art.img, x0 - pw / 2, y, pw, ph); ctx.imageSmoothingEnabled = false; }
  else drawPortraitAt(id, x0 - ph * PORT_AR / 2, y, ph, a);
  ctx.restore(); return art; }
function drawPartnerStory() {
  PST.hits = []; const id = PST.id, stories = PARTNER_STORIES[id], d = girlData(id), c = SURV[id].c;
  if (PST.episode < 0) { drawStoryList(id, stories, d, c); return; }
  const ep = stories[PST.episode], pg = PST.pages[PST.page], scene = pg.scene;
  // a black stage (no painted sets)
  storyDark(SURV[id].c);
  { const g = ctx.createRadialGradient(W / 2, H * .45, H * .3, W / 2, H * .45, W * .7); g.addColorStop(0, 'rgba(0,0,0,.05)'); g.addColorStop(1, 'rgba(0,0,0,.6)'); rect(0, 0, W, H, g); }
  // her
  const dim = pg.who === 'h' || pg.choice ? 1 : pg.who === 'n' ? .82 : .62, pk = clamp(PST.poseT / .35, 0, 1), sx = W * .66;
  if (pk < 1 && PST.prevPose) storySprite(id, PST.prevPose, 1 - pk, dim, sx);
  const art = storySprite(id, PST.pose, pk < 1 && PST.prevPose ? pk : 1, dim, sx);
  if (art && art.failed) storyLink(W - 10, 10, L('ps_retry'), () => storyImage(id, PST.pose, true));
  // where we are
  { const cap = L('ps_part', PST.episode + 1) + '  ' + ep.title; textS(cap, 14, 10, '#e6dfd1', 1); const pl = '— ' + scene.place; text(pl, 14, 22 - (isCJK(pl) ? 1 : 0), '#9a9284'); }
  // the dialogue box, its name plate, the line typing itself out
  const bx = 12, bh = 66, by = H - bh - 10, bw = W - 24;
  { const g = ctx.createLinearGradient(0, by, 0, by + bh); g.addColorStop(0, 'rgba(6,6,9,.78)'); g.addColorStop(1, 'rgba(6,6,9,.92)'); rect(bx, by, bw, bh, g); }
  ctx.globalAlpha = .7; box(bx, by, bw, bh, null, WIN_EDGE); ctx.globalAlpha = 1;
  // while a choice is open the box keeps the line that led to it
  const ln = pg.choice ? PST.pages[PST.page - 1] : pg, full = !!pg.choice, speaker = !ln ? '' : ln.who === 'h' ? svName(id) : ln.who === 'p' ? SET.name || '你' : '';
  if (speaker) { const nw = textW(speaker, 1.5) + 18; rect(bx + 10, by - 9, nw, 16, 'rgba(6,6,9,.95)'); box(bx + 10, by - 9, nw, 16, null, ln.who === 'h' ? c : TH.gold); rect(bx + 10, by - 9, 2, 16, ln.who === 'h' ? c : TH.gold);
    textS(speaker, bx + 19, by - 7 - (isCJK(speaker) ? 1 : 0), ln.who === 'h' ? c : TH.gold, 1.5); }
  if (ln) { const body = ln.body.replaceAll('{me}', SET.name || '你'), col = { h: '#f2ebde', p: '#ece0bf', n: '#c9c1b2', m: '#a8bccc' }[ln.who], lines = wrapW(body, bw - 34, 1.5), lh = 17;
    let left = full ? 9999 : Math.floor(PST.tt * STORY_CPS); const ty = by + (speaker ? 14 : 10);
    lines.slice(0, 3).forEach((ln, i) => { if (left <= 0) return; const ch = [...ln], s = ch.slice(0, left).join(''); left -= ch.length; text(s, bx + 17, ty + i * lh, col, 1.5); });
    if (!full && storyTyped(pg) && PST.card > 2.3) { const k = ((PST.t * 2) | 0) % 2, tx = bx + bw - 16, tyy = by + bh - 11 + (k ? 1 : 0); ctx.fillStyle = TH.bone2; ctx.beginPath(); ctx.moveTo(tx - 3, tyy); ctx.lineTo(tx + 3, tyy); ctx.lineTo(tx, tyy + 4); ctx.closePath(); ctx.fill(); } }
  // the controls just above the box, at the right
  { let x = bx + bw - 2; x = storyLink(x, by - 9, L('back'), () => { saveStoryPage(); PST.episode = -1; PST.hits = []; }) - 4; x = storyLink(x, by - 9, L('ps_auto'), () => { PST.auto = !PST.auto; PST.autoT = 0; }, PST.auto) - 4; storyLink(x, by - 9, L('ps_log'), () => { PST.log = true; PST.logS = 0; }); }
  // a choice: the options stand over the scene
  if (pg.choice) { ctx.globalAlpha = .45; rect(0, 0, W, H - bh - 10, '#000'); ctx.globalAlpha = 1;
    const n = pg.choice.length, ow = Math.min(280, W - 80), oh = 22, gap = 10, oy = Math.round((H - bh - 10) / 2 - (n * oh + (n - 1) * gap) / 2);
    pg.choice.forEach((o, i) => { const r = { x: Math.round(W / 2 - ow / 2), y: oy + i * (oh + gap), w: ow, h: oh, f: () => storyChoose(i) }; PST.hits.push(r); const hv = !TOUCH.on && inR(r, Input.mx, Input.my);
      storyPlate(r.x, r.y, r.w, r.h, hv); if (hv) rect(r.x + 1, r.y + 1, r.w - 2, r.h - 2, 'rgba(255,255,255,.06)'); text(String(i + 1), r.x + 9, r.y + 8, hv ? '#ffffff' : TH.faint, 1);
      const s = fitText(o.label.replace(/^["“]|["”]$/g, ''), ow - 40); text(s, W / 2, r.y + 8 - (isCJK(s) ? 2 : 0), hv ? '#ffffff' : TH.bone, 1, 'center'); }); }
  // a new scene comes up out of black
  if (PST.sceneT < .55 && PST.card > 2.3) { ctx.globalAlpha = 1 - PST.sceneT / .55; rect(0, 0, W, H, '#000'); ctx.globalAlpha = 1; }
  if (PST.log) drawStoryLog(id, c);
  // the chapter's title card, and its end
  if (PST.card < 2.3) { const k = PST.card, a = k < .25 ? 1 : k > 1.8 ? 1 - (k - 1.8) / .5 : 1, ta = clamp((k - .25) / .4, 0, 1) * (k > 1.8 ? 1 - (k - 1.8) / .5 : 1); storyCard(L('ps_part', PST.episode + 1), ep.title, ep.summary, a, ta, c); }
  if (PST.end >= 0) { const k = PST.end, a = clamp(k / .4, 0, 1); storyCard(L('ps_part', PST.episode + 1), ep.title, L('ps_end'), a, clamp((k - .3) / .4, 0, 1), c); }
}
function storyCard(kicker, title, sub, a, ta, c) {
  ctx.globalAlpha = a; rect(0, 0, W, H, '#050505'); ctx.globalAlpha = ta; const cy = H / 2 - 12;
  text(kicker, W / 2, cy - 18, c, 1, 'center'); textS(title, W / 2, cy - 4, '#ece6da', 2, 'center');
  const lw = Math.round(60 * ta); rect(W / 2 - lw, cy + 22, lw * 2, 1, 'rgba(189,181,166,.5)');
  text(sub, W / 2, cy + 30 - (isCJK(sub) ? 1 : 0), '#9a9284', 1, 'center'); ctx.globalAlpha = 1; }
// the log: every line read so far in this chapter, newest at the foot
function drawStoryLog(id, c) {
  ctx.globalAlpha = .92; rect(0, 0, W, H, '#050506'); ctx.globalAlpha = 1; textS(L('ps_log'), 18, 12, '#ece6da', 1.5); text(L('ps_logHint'), W - 18, 16, TH.faint, 1, 'right');
  const x = 30, w = W - 60, top = 34, bot = H - 14, lh = lineH() + 1, rows = [];
  for (let i = 0; i <= PST.page; i++) { const pg = PST.pages[i]; if (!pg || pg.choice) continue; const nm = pg.who === 'h' ? svName(id) : pg.who === 'p' ? SET.name || '你' : '', col = { h: '#f2ebde', p: '#ece0bf', n: '#c9c1b2', m: '#a8bccc' }[pg.who];
    if (nm) rows.push({ s: nm, c: pg.who === 'h' ? c : TH.gold }); for (const l of wrapW(pg.body.replaceAll('{me}', SET.name || '你'), w - (nm ? 12 : 0))) rows.push({ s: l, c: col, ind: nm ? 12 : 0 }); rows.push({ gap: 1 }); }
  const total = rows.reduce((a, r) => a + (r.gap ? 4 : lh), 0), maxS = Math.max(0, total - (bot - top)); PST.logS = Math.min(PST.logS, maxS);
  ctx.save(); ctx.beginPath(); ctx.rect(x - 4, top, w + 8, bot - top); ctx.clip(); let y = top + Math.max(0, bot - top - total) - (maxS - PST.logS);
  for (const r of rows) { if (r.gap) { y += 4; continue; } if (y > top - lh && y < bot) text(r.s, x + (r.ind || 0), y, r.c, 1); y += lh; } ctx.restore();
}
// the chapter list: her place behind, her art at the right, three chapters on plain plates
function drawStoryList(id, stories, d, c) {
  storyDark(c);
  { const g = ctx.createLinearGradient(0, 0, W * .62, 0); g.addColorStop(0, 'rgba(5,5,6,.8)'); g.addColorStop(1, 'rgba(5,5,6,0)'); rect(0, 0, W, H, g); }
  const hov = PST.hov; storySprite(id, hov >= 0 ? stories[hov].scenes[0].pose : 1, 1, 1, W * .76);
  textS(svName(id), 24, 18, c, 2); text(L('ps_title'), 26, 40, '#9a9284'); rect(26, 52, 40, 1, c); rect(66, 52, Math.round(W * .5) - 40, 1, 'rgba(189,181,166,.25)');
  PST.hov = -1; const cw = Math.round(W * .52), ch = 46;
  for (let i = 0; i < 3; i++) { const y = 64 + i * (ch + 8), open = storyUnlocked(id, i), read = (d.stories || []).includes(i), r = { x: 24, y, w: cw, h: ch, f: () => openPartnerStory(i) }, hv = open && !TOUCH.on && inR(r, Input.mx, Input.my);
    if (hv) PST.hov = i; PST.hits.push(r); storyPlate(r.x, r.y, r.w, r.h, hv, open ? WIN_EDGE : '#4a4640'); if (hv) rect(r.x + 1, r.y + 1, r.w - 2, r.h - 2, 'rgba(255,255,255,.05)');
    text(L('ps_part', i + 1), r.x + 10, y + 7, open ? c : TH.faint);
    const st = !open ? '' : read ? L('ps_read') : d.storyPage && d.storyPage[i] > 0 ? L('ps_continue') : L('ps_new'); if (st) text(st, r.x + r.w - 9, y + 7 - (isCJK(st) ? 1 : 0), read ? TH.faint : TH.emberHi, 1, 'right');
    textS(fitText(open ? stories[i].title : '？？？', r.w - 22, 1.5), r.x + 10, y + 17, open ? TH.bone : TH.faint, 1.5);
    if (open) text(fitText(stories[i].summary, r.w - 22), r.x + 10, y + 33 - (isCJK(stories[i].summary) ? 1 : 0), '#9a9284');
    else { storyLock(r.x + r.w - 20, y + 20, TH.faint); text(fitText(L('ps_locked', STORY_AFF[i]), r.w - 40), r.x + 10, y + 33 - 1, TH.faint); } }
  storyLink(24, H - 18, '< ' + L('back'), closePartnerStory, false, 'left');
}
// no painted sets: a black stage, with the faintest warmth of her colour behind her
function storyDark(c) { rect(0, 0, W, H, '#000000'); const g = ctx.createRadialGradient(W * .66, H * .5, 0, W * .66, H * .5, H * .8); g.addColorStop(0, thA(c, .07)); g.addColorStop(1, 'rgba(0,0,0,0)'); rect(0, 0, W, H, g); }
