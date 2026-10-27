// ===== TheSeed black market (main menu): spend proofs on items that take effect on your next sortie =====
// bought items wait in the girls progress (gp.market) and are used up when the next new run starts (G.buffs keeps them for that run,
// including in its save):
//   armory   黑市武库        3  choose any weapon as the starting weapon
//   adren    肾上腺素        3  whenever health drops to 3 or less: 3 s of invincibility (60 s cooldown)
//   resolve  探索之人的决心  5  20% more enemies on every floor, +10% starting damage
'use strict';
Object.assign(STR, { mk_gearHead: ['PARTNER GEAR', '搭檔裝備', '相棒の装備', '搭档装备'], mk_gearD: ['BUY ONCE, THEN PUT IT ON ONE GIRL IN HER EQUIP PAGE (THE PARTNER STRIPS)', '購買一次後，在搭檔的「裝備」頁為其中一位少女穿戴', '一度買えば、相棒の「装備」ページで一人に装備できる', '购买一次后，在搭档的「装备」页为其中一位少女穿戴'],
  mk_gearOk: ['GEAR BOUGHT', '已購買裝備', '装備を購入した', '已购买装备'], mk_gearOn: ['WORN BY {0}', '{0} 穿戴中', '{0}が装備中', '{0} 穿戴中'], mk_gearFree: ['NOT WORN', '未穿戴', '未装備', '未穿戴'], mk_wHead: ['WEAPON UNLOCKS', '武器解鎖', '武器の解放', '武器解锁'], mk_wD: ['UNLOCKED WEAPONS JOIN THE RUN WEAPON POOL AND THE ARMORY', '解鎖後會進入局內武器池與黑市武庫自選', '解放すると道中の武器と武器庫に加わる', '解锁后会进入局内武器池与黑市武库自选'],
  mk_wOk: ['WEAPON UNLOCKED', '武器已解鎖', '武器を解放した', '武器已解锁'], mk_wHave: ['UNLOCKED', '已解鎖', '解放済み', '已解锁'], mk_unlock: ['UNLOCK', '解鎖', '解放', '解锁'] });
const MARKET = [
  { id: 'armory', price: 3, c: () => TH.gold, n: N4('BLACK-MARKET ARMORY', '黑市武庫', '闇市の武器庫', '黑市武库'),
    d: N4('PICK ANY WEAPON AS YOUR STARTING WEAPON FOR THE NEXT SORTIE.', '自選任意一把武器，作為下次出擊的初始武器。', '次の出撃の初期武器を好きな武器から選べる。', '自选任意一把武器，作为下次出击的初始武器。') },
  { id: 'adren', price: 3, c: () => TH.red, n: N4('ADRENALINE', '腎上腺素', 'アドレナリン', '肾上腺素'),
    d: N4('NEXT SORTIE: WHENEVER YOUR HEALTH DROPS TO 3 OR LESS, YOU ARE INVINCIBLE FOR 3S (60S COOLDOWN).', '下次出擊時，每當生命值小於等於 3 點，無敵 3 秒（冷卻 60 秒）。', '次の出撃：HPが3以下になるたび3秒間無敵（CT60秒）。', '下次出击时，每当生命值小于等于 3 点，无敌 3 秒（冷却 60 秒）。') },
  { id: 'resolve', price: 5, c: () => TH.violet, n: N4("THE EXPLORER'S RESOLVE", '探索之人的決心', '探索者の決意', '探索之人的决心'),
    d: N4('NEXT SORTIE: 20% MORE ENEMIES ON EVERY FLOOR, +10% STARTING DAMAGE.', '下次出擊時，每層敵人數量 +20%，自身初始傷害 +10%。', '次の出撃：各階層の敵の数+20%、初期ダメージ+10%。', '下次出击时，每层敌人数量 +20%，自身初始伤害 +10%。') },
  { id: 'serum', price: 5, c: () => C.green, n: N4('RESERVED SERUM', '預留血清', '予約の血清', '预留血清'),
    d: N4('PICK ANY SERUM NOW: YOU HAVE IT FROM THE START OF THE NEXT SORTIE.', '自選任意一個血清，下次出擊時立刻擁有。', '好きな血清を一つ選ぶ。次の出撃の開始時から持っている。', '自选任意一个血清，下次出击时立刻拥有。') },
];
// four heavy weapons are locked until bought here (5 proofs each): until then they never appear in a run or in the armory (gp.market.unl)
const MK_WLOCK = ['sonic', 'barrage', 'thermite', 'recoilless'], MK_WPRICE = 5;
const wUnlocked = id => !MK_WLOCK.includes(id) || !!(mkt().unl || {})[id];
// private photos: one per girl, 5 proofs, for sale only once her affection is full (bought ones live in her album: gp.girls[id].priv)
const PRIV_PRICE = 5;
const PGEAR = {
  armor: { price: 6, c: '#9aa6b0', n: N4('HEAVY BODY ARMOR', '重型防彈盔甲', '重装防弾アーマー', '重型防弹盔甲'), d: N4("THE PARTNER'S HEALTH +10; EACH HIT HAS A 10% CHANCE TO DO NOTHING.", '搭檔的生命值 +10，受到傷害時有 10% 幾率免疫。', '相棒のHP+10、被弾時10%で無効化。', '搭档的生命值 +10，受到伤害时有 10% 几率免疫。') },
  regul: { price: 7, c: '#e0483e', n: N4('CENTRAL REGULATOR', '中樞調節器', '中枢調整器', '中枢调节器'), d: N4('THE PARTNER IS MORE EAGER TO FIGHT: TWICE THE ATTACK RATE.', '搭檔的攻擊慾望更強，攻擊頻率提升 2 倍。', '相棒がより好戦的に。攻撃頻度2倍。', '搭档的攻击欲望更强，攻击频率提升 2 倍。') },
  shield: { price: 7, c: '#5ed0c8', n: N4('EMERGENCY SHIELD', '應急護盾', '緊急シールド', '应急护盾'), d: N4('ON A KILLING BLOW THE PARTNER RAISES A ROUND SHIELD WHERE SHE STANDS FOR 5S: BULLETS FROM OUTSIDE ARE STOPPED AND FOES CANNOT ENTER. THEN IT FADES AND SHE WITHDRAWS.', '搭檔受到致命傷害時，原地展開一個圓形護盾，可抵擋從外而來的彈幕，敵人無法入內，持續 5 秒，隨後護盾消失，搭檔撤離。', '致命傷を受けると、その場に円形シールドを5秒展開。外からの弾を防ぎ、敵は入れない。その後シールドは消え、相棒は撤退する。', '搭档受到致命伤害时，原地展开一个圆形护盾，可抵挡从外而来的弹幕，敌人无法入内，持续 5 秒，随后护盾消失，搭档撤离。') },
  pump: { price: 8, c: '#8ed872', n: N4('PORTABLE BLOOD PUMP', '便攜式血泵', '携帯式血液ポンプ', '便携式血泵'), d: N4('OUT OF COMBAT THE PARTNER RECOVERS 1 HEALTH EVERY 3S.', '搭檔在非戰鬥狀態下，每 3 秒恢復 1 點生命。', '戦闘外では3秒ごとにHP1回復。', '搭档在非战斗状态下，每 3 秒恢复 1 点生命。') },
};
const PGEAR_IDS = Object.keys(PGEAR);
const pgOwned = k => !!((gpLoad().pgear || {})[k]);
const pgWearer = k => SURV_IDS.find(id => (gpLoad().girls[id] || {}).gear === k) || null;
function mktBuyGear(k) { if (pgOwned(k)) { AU.play('locked'); return; } if (!buyProofs(PGEAR[k].price)) return; const gp = gpLoad(); gp.pgear = gp.pgear || {}; gp.pgear[k] = true; gpSave(); AU.play('shop'); mktFlash('mk_gearOk', TH.gold); }
function gearIcon(k, x, y, s, c) { const S = s || 1; c = c || PGEAR[k].c; ctx.save(); ctx.translate(x, y); ctx.scale(S, S);
  if (k === 'armor') { rect(-5, -6, 10, 11, '#3a3f45'); rect(-4, -5, 8, 9, c); rect(-1, -5, 2, 9, '#5a6068'); rect(-6, -6, 2, 4, c); rect(4, -6, 2, 4, c); }
  else if (k === 'regul') { disc(0, 0, 5, '#2a1212'); ringC(0, 0, 5, c, 1); for (let i = 0; i < 6; i++) { const a = i * 1.047; rect(Math.cos(a) * 6 - .5, Math.sin(a) * 6 - .5, 1, 1, c); } rect(-1, -3, 2, 6, '#ffd0c0'); rect(-3, -1, 6, 2, '#ffd0c0'); }
  else if (k === 'shield') { ringC(0, 0, 6, c, 1); ctx.globalAlpha *= .35; disc(0, 0, 6, c); ctx.globalAlpha /= .35; rect(-1, -4, 2, 8, '#e8ffff'); }
  else { rect(-3, -6, 6, 11, '#2a3a2a'); rect(-2, -3, 4, 7, c); rect(-1, -7, 2, 2, '#c9c1b2'); rect(-2, -1, 4, 1, '#e8ffd8'); }
  ctx.restore(); }
function mktGearCard(k, x, y, h, gp, t) { const G2 = PGEAR[k], own = pgOwned(k), who = pgWearer(k), c = G2.c, hv = !TOUCH.on && inR({ x, y, w: MKT_CW, h }, Input.mx, Input.my);
  mktFrame(x, y, h, c, hv || own); gearIcon(k, x + MKT_CW / 2, y + 32 + (hv && !own ? Math.round(Math.sin(t * 5)) : 0), 3);
  const nl = mktText(x, y + 61, MKT_CW - 10, tr(G2.n), c, 2), py = y + 63 + nl * lineH();
  { const ps = String(G2.price), pw = textW(ps) + 12, px = Math.round(x + MKT_CW / 2 - pw / 2); drawProof(px, py); text(ps, px + 12, py + 1, !own && gp.proofs >= G2.price ? TH.gold : '#57524a'); }
  mktText(x, py + 14, MKT_CW - 12, tr(G2.d), '#9a9aa2', Math.max(2, Math.floor((h - (py - y) - 50) / lineH())));
  if (own) text(fitText(who ? L('mk_gearOn', svName(who)) : L('mk_gearFree'), MKT_CW - 8), x + MKT_CW / 2, y + h - 36, who ? SURV[who].c : '#8e877b', 1, 'center');
  const b = { x: x + 8, y: y + h - 23, w: MKT_CW - 16, h: 16, inRow: true, f: () => mktBuyGear(k) }; MKT.hits.push(b);
  drawBtn(b.x, b.y, b.w, b.h, own ? L('g_owned') : L('mk_buy'), !TOUCH.on && !own && inR(b, Input.mx, Input.my), own ? '#3c3732' : c); }
const ADREN_CD = 60, ADREN_T = 3;
const mkt = () => { const gp = gpLoad(), m = gp.market || (gp.market = { armory: null, adren: false, resolve: false }); if (!m.unl || typeof m.unl !== 'object') m.unl = {}; return m; };
const mktOwned = id => { const m = mkt(); return id === 'armory' ? !!m.armory : id === 'serum' ? !!m.serum : !!m[id]; };
// the serum list: every serum, chosen like the armory's weapon (changing your mind before the sortie is free)
function mktPickSerum(paid) { const items = SHARDS.filter(s => SHARD[s.id]).map(s => ({ v: s.id, label: sname(s), sub: L('rar' + s.rar) }));
  openPicker({ title: tr(MARKET.find(q => q.id === 'serum').n), items, cur: mkt().serum || '', acc: C.green, onPick: v => { if (!paid && !buyProofs(5)) return; mkt().serum = v; gpSave(); AU.play('shop'); } }); }
function openMarket() { gpLoad(); MKT.t = 0; MKT.hits = []; MKT.hs = 0; MKT.hsv = 0; MKT.drag = null; goPage('market'); }
const MKT = { t: 0, hits: [], flash: null, tab: 0, hs: 0, hsv: 0, hmax: 0, drag: null };
function mktFlash(k, c) { MKT.flash = { txt: L(k), c: c || TH.red, t: 0 }; }
// the armory asks which weapon (a scrolling list); changing your mind before the sortie costs nothing
function mktPickWeapon(paid) {
  const items = WEAPON_IDS.filter(id => WEAPONS[id] && WEAPONS[id].spr && wUnlocked(id)).map(id => ({ v: id, label: wname(id), sub: tr(WEAPONS[id].d) }));
  openPicker({ title: L('mk_pick'), items, cur: mkt().armory || '', acc: TH.gold, onPick: v => { if (!paid && !buyProofs(3)) return; mkt().armory = v; gpSave(); AU.play('shop'); } });
}
function buyProofs(n) { const gp = gpLoad(); if (gp.proofs < n) { mktFlash('g_noProof'); AU.play('locked'); return false; } gp.proofs -= n; return true; }
function mktBuy(it) {
  if (it.id === 'armory') { mktPickWeapon(mktOwned('armory')); return; }
  if (it.id === 'serum') { mktPickSerum(mktOwned('serum')); return; }
  if (mktOwned(it.id)) { AU.play('locked'); return; }
  if (!buyProofs(it.price)) return; mkt()[it.id] = true; gpSave(); AU.play('shop'); mktFlash('mk_bought', TH.gold);
}
function mktBuyPriv(id) {
  const d = girlData(id); if (d.priv) { AU.play('locked'); return; } if (d.aff < AFF_MAX) { mktFlash('mk_locked'); AU.play('locked'); return; }
  if (!buyProofs(PRIV_PRICE)) return; d.priv = true; gpSave(); AU.play('shop'); mktFlash('mk_privOk', TH.pink);
}
function mktBuyW(id) { const m = mkt(); if (m.unl[id]) { AU.play('locked'); return; } if (!buyProofs(MK_WPRICE)) return; m.unl[id] = true; gpSave(); AU.play('shop'); mktFlash('mk_wOk', TH.gold); }
// ---------------- the page: two tabs (supplies, weapon unlocks), each a row of cards that scrolls sideways ----------------
// wheel, drag (mouse or finger), the arrows at the ends, or A/D move the row; a press that did not move is a click
function openMarketTab(i) { if (MKT.tab === i) return; MKT.tab = i; MKT.hs = 0; MKT.t = .15; AU.play('menu'); }
const MKT_ROW = () => ({ x: 34, y: 58, w: W - 68, h: H - 92 }), MKT_CW = 104, MKT_GAP = 8;
function updateMarket(rdt) {
  MKT.t += rdt; if (MKT.flash) { MKT.flash.t += rdt; if (MKT.flash.t > 2) MKT.flash = null; }
  if (pressed('Escape')) { backPage(); return; }
  if (pressed('Tab') || pressed('KeyW') || pressed('KeyS') || pressed('ArrowUp') || pressed('ArrowDown')) openMarketTab((MKT.tab + 1) % 4);
  if (pressed('KeyA') || pressed('ArrowLeft')) MKT.hs = clamp(MKT.hs - (MKT_CW + MKT_GAP), 0, MKT.hmax);
  if (pressed('KeyD') || pressed('ArrowRight')) MKT.hs = clamp(MKT.hs + (MKT_CW + MKT_GAP), 0, MKT.hmax);
  if (Input.wheel) MKT.hs = clamp(MKT.hs + Input.wheel * 40, 0, MKT.hmax);
  MKT.hsv = lerp(MKT.hsv || 0, MKT.hs, .3);
  if (MKT.drag) { const g = MKT.drag; if (Math.abs(Input.mx - g.x) > 4) g.moved = true; if (g.moved) { MKT.hs = clamp(g.s - (Input.mx - g.x), 0, MKT.hmax); MKT.hsv = MKT.hs; }
    if (!Input.down) { MKT.drag = null; if (!g.moved && g.hit) g.hit.f(); } }
  if (Input.clicked) { Input.clicked = false; const h = MKT.hits.find(q => inR(q, Input.mx, Input.my));
    if (h && !h.inRow) { h.f(); return; } if (inR(MKT_ROW(), Input.mx, Input.my)) MKT.drag = { x: Input.mx, s: MKT.hs, hit: h || null, moved: false }; }
}
// the icons: small pixel pictures, painted once (20x20, drawn at 2x)
const MKT_ICON = {};
function mktIcon(id) {
  if (MKT_ICON[id]) return MKT_ICON[id]; const p = new CPix(20, 20);
  if (id === 'armory') { camPlanks(p, 2, 11, 16, 8, RAMP.olive, { pw: 4, seed: 4, lx: 1 }); p.rect(2, 11, 16, 1, '#687656'); p.rect(8, 13, 4, 2, '#d8c890'); p.set(9, 14, '#2a2620');
    p.line(1, 9, 18, 3, '#151515'); p.line(1, 10, 18, 4, '#3a3a40'); p.line(2, 10, 7, 8, '#5a3a24'); p.rect(2, 9, 4, 3, '#4a2e1c'); p.rect(11, 5, 3, 3, '#202024'); p.set(18, 3, '#8a8a92'); p.rect(9, 7, 1, 3, '#202024'); }
  else if (id === 'adren') { for (let k = 0; k < 11; k++) { const x = 4 + k, y = 15 - k; p.rect(x, y - 1, 3, 3, k < 8 ? (k > 1 ? '#b0283a' : '#d8d8e0') : '#c8c8d0'); if (k > 1 && k < 8) p.set(x + 1, y - 1, '#ff6a7a'); }
    p.line(15, 4, 18, 1, '#e8e8f0'); p.line(1, 18, 4, 15, '#8a8a92'); p.rect(0, 17, 3, 3, '#5a5a62'); for (let k = 0; k < 3; k++) p.set(5 + k * 2, 17 - k * 2, '#40101a'); p.set(12, 8, '#fff0f0'); }
  else if (id === 'resolve') { p.rect(8, 10, 4, 9, '#4a3020'); p.rect(8, 10, 4, 1, '#6a4a30'); p.rect(7, 9, 6, 2, '#2a2a30');
    const fl = [[9, 2], [8, 3], [10, 3], [7, 4], [11, 5], [7, 6], [12, 6], [8, 8], [11, 8]]; p.poly([[10, 1], [14, 6], [13, 9], [7, 9], [6, 6]], '#8a4ae0'); p.poly([[10, 3], [12, 7], [11, 9], [8, 9], [8, 6]], '#c89aff'); p.poly([[10, 5], [11, 8], [9, 8]], '#f4e8ff'); }
  else if (id === 'serum') { for (let k = 0; k < 11; k++) { const x = 4 + k, y = 15 - k; p.rect(x, y - 1, 3, 3, k < 8 ? (k > 1 ? '#4a8a3a' : '#d8d8e0') : '#c8c8d0'); if (k > 1 && k < 8) p.set(x + 1, y - 1, '#a8f08a'); }
    p.line(15, 4, 18, 1, '#e8e8f0'); p.line(1, 18, 4, 15, '#8a8a92'); p.rect(0, 17, 3, 3, '#5a5a62'); p.set(12, 8, '#f0fff0'); }
  else { const lock = id === 'photoLock'; p.rect(3, 1, 14, 18, '#d8d4c8'); p.rect(3, 1, 14, 1, '#f0ece0'); p.rect(5, 3, 10, 10, '#16141a'); p.rect(5, 15, 10, 1, '#a8a498');
    if (!lock) { p.rect(7, 6, 2, 2, '#d873b0'); p.rect(11, 6, 2, 2, '#d873b0'); p.rect(6, 7, 8, 2, '#d873b0'); p.rect(7, 9, 6, 1, '#d873b0'); p.rect(8, 10, 4, 1, '#d873b0'); p.rect(9, 11, 2, 1, '#d873b0'); p.set(7, 6, '#ffd0f0'); }
    else { p.rect(7, 8, 6, 5, '#6a6a72'); p.rect(8, 5, 4, 1, '#6a6a72'); p.rect(7, 6, 1, 2, '#6a6a72'); p.rect(12, 6, 1, 2, '#6a6a72'); p.set(10, 10, '#16141a'); p.set(10, 11, '#16141a'); } }
  p.outline('#050506'); return MKT_ICON[id] = p.canvas(true);
}
function drawMarket(t) {
  panel(L(['mk_tabSup', 'mk_wHead', 'mk_privHead', 'mk_gearHead'][MKT.tab] || 'mk_tabSup'), TH.gold); MKT.hits = []; const gp = gpLoad(), m = mkt();
  { const s = L('g_proofs', gp.proofs), x = W - 64 - textW(s); drawProof(x - 10, 21); text(s, x, 22 - (isCJK(s) ? 1 : 0), TH.gold); }
  { const hint = L(['mk_hint', 'mk_wD', 'mk_privD', 'mk_gearD'][MKT.tab] || 'mk_hint'); text(fitText(hint, W - 76), 38, 41 - (isCJK(hint) ? 1 : 0), '#6e675c'); }
  // the cards
  const R = MKT_ROW(), list = MKT.tab === 0 ? MARKET.map(it => ({ kind: 'item', it })) : MKT.tab === 1 ? MK_WLOCK.map(id => ({ kind: 'wpn', id })) : MKT.tab === 2 ? SURV_IDS.map(id => ({ kind: 'photo', id })) : PGEAR_IDS.map(id => ({ kind: 'gear', id })), n = list.length;
  const span = n * (MKT_CW + MKT_GAP) - MKT_GAP; MKT.hmax = Math.max(0, span - R.w); MKT.hs = Math.min(MKT.hs, MKT.hmax);
  const x0 = R.x + (span < R.w ? Math.round((R.w - span) / 2) : 0) - Math.round(MKT.hsv || 0), ch = R.h;
  ctx.save(); ctx.beginPath(); ctx.rect(R.x - 2, R.y - 4, R.w + 4, R.h + 8); ctx.clip();
  list.forEach((e, i) => { const k = easeOut(clamp((MKT.t - i * .06) / .3, 0, 1)), x = x0 + i * (MKT_CW + MKT_GAP), y = R.y + Math.round((1 - k) * 10); if (x > R.x + R.w + 4 || x + MKT_CW < R.x - 4) return; ctx.globalAlpha = k;
    if (e.kind === 'item') mktCard(e.it, x, y, ch, gp, m, t); else if (e.kind === 'photo') mktPhotoCard(e.id, x, y, ch, gp, t); else if (e.kind === 'gear') mktGearCard(e.id, x, y, ch, gp, t); else mktWeaponCard(e.id, x, y, ch, gp, t); ctx.globalAlpha = 1; });
  ctx.restore();
  // the ends of the row: arrows when there is more
  if (MKT.hmax > 0) { const ay = R.y + R.h / 2;
    if (MKT.hs > 1) { const b = { x: R.x - 12, y: ay - 12, w: 12, h: 24, f: () => { MKT.hs = clamp(MKT.hs - (MKT_CW + MKT_GAP), 0, MKT.hmax); } }; MKT.hits.push(b); for (let k = 0; k < 5; k++) rect(b.x + 4 + Math.abs(k - 2), ay - 2 + k, 1, 1, TH.gold); }
    if (MKT.hs < MKT.hmax - 1) { const b = { x: R.x + R.w, y: ay - 12, w: 12, h: 24, f: () => { MKT.hs = clamp(MKT.hs + (MKT_CW + MKT_GAP), 0, MKT.hmax); } }; MKT.hits.push(b); for (let k = 0; k < 5; k++) rect(b.x + 7 - Math.abs(k - 2), ay - 2 + k, 1, 1, TH.gold); }
    const tw = R.w * .5, tx = R.x + R.w / 2 - tw / 2, kw = Math.max(14, tw * R.w / (R.w + MKT.hmax)), kx = tx + (tw - kw) * (MKT.hsv || 0) / MKT.hmax; rect(tx, R.y + R.h + 5, tw, 1, '#27231f'); rect(kx, R.y + R.h + 4, kw, 3, '#5a5a62'); }
  const f = MKT.flash; if (f) { const a = clamp(Math.min(f.t / .1, (2 - f.t) / .3), 0, 1), s = f.txt, w2 = textW(s) + 16; ctx.globalAlpha = a; rect(W / 2 - w2 / 2, H - 30, w2, 13, '#0b0b0d'); box(W / 2 - w2 / 2, H - 30, w2, 13, null, f.c); text(s, W / 2, H - 30 + (isCJK(s) ? 2 : 4), f.c, 1, 'center'); ctx.globalAlpha = 1; }
}
// one card: an accent strip, the icon on a plate, the name, the price, what it does, and a button at the foot
function mktFrame(x, y, h, c, lit) { rect(x, y, MKT_CW, h, lit ? '#121216' : '#0e0d0b'); box(x, y, MKT_CW, h, null, lit ? c : '#26262c'); rect(x + 1, y + 1, MKT_CW - 2, 2, c);
  rect(x + MKT_CW / 2 - 23, y + 9, 46, 46, '#08080a'); box(x + MKT_CW / 2 - 23, y + 9, 46, 46, null, '#2a2a30'); for (const [dx, dy] of [[0, 0], [43, 0], [0, 43], [43, 43]]) rect(x + MKT_CW / 2 - 23 + dx, y + 9 + dy, 3, 3, '#3a3a42'); }
function mktText(x, y, w, s, c, max) { const ls = wrapW(s, w); ls.slice(0, max).forEach((l, i) => text(l, x + MKT_CW / 2, y + i * lineH(), c, 1, 'center')); return Math.min(ls.length, max); }
function mktCard(it, x, y, h, gp, m, t) {
  const c = it.c(), own = mktOwned(it.id), hv = !TOUCH.on && inR({ x, y, w: MKT_CW, h }, Input.mx, Input.my); mktFrame(x, y, h, c, hv || own);
  const ic = mktIcon(it.id), bob = hv ? Math.round(Math.sin(t * 5)) : 0; ctx.drawImage(ic, x + MKT_CW / 2 - 20, y + 12 + bob, 40, 40);
  const nl = mktText(x, y + 61, MKT_CW - 10, tr(it.n), c, 2), py = y + 63 + nl * lineH();
  { const ps = String(it.price), pw = textW(ps) + 12, px = Math.round(x + MKT_CW / 2 - pw / 2); drawProof(px, py); text(ps, px + 12, py + 1, gp.proofs >= it.price || own ? TH.gold : '#57524a'); }
  mktText(x, py + 14, MKT_CW - 12, tr(it.d), '#9a9aa2', Math.max(2, Math.floor((h - (py - y) - 50) / lineH())));
  if (it.id === 'armory' && m.armory) text(fitText(L('mk_chosen', wname(m.armory)), MKT_CW - 8), x + MKT_CW / 2, y + h - 36, TH.gold, 1, 'center');
  else if (it.id === 'serum' && m.serum && SHARD[m.serum]) text(fitText(L('mk_chosen', sname(SHARD[m.serum])), MKT_CW - 8), x + MKT_CW / 2, y + h - 36, C.green, 1, 'center');
  else if (own) text(L('mk_bought'), x + MKT_CW / 2, y + h - 36, '#8e877b', 1, 'center');
  const lbl = own ? (it.id === 'armory' || it.id === 'serum' ? L('mk_change') : L('mk_ready')) : L('mk_buy'), b = { x: x + 8, y: y + h - 23, w: MKT_CW - 16, h: 16, inRow: true, f: () => mktBuy(it) };
  MKT.hits.push(b); drawBtn(b.x, b.y, b.w, b.h, lbl, !TOUCH.on && inR(b, Input.mx, Input.my), own && it.id !== 'armory' && it.id !== 'serum' ? '#57524a' : c);
}
function mktWeaponCard(id, x, y, h, gp, t) {
  const wd = WEAPONS[id], own = !!mkt().unl[id], c = own ? '#8e877b' : TH.gold, hv = !TOUCH.on && inR({ x, y, w: MKT_CW, h }, Input.mx, Input.my); mktFrame(x, y, h, c, hv && !own);
  { const sp = sprite('w_' + id, wd.spr), s = Math.min(3, Math.floor(40 / Math.max(sp.w, sp.h))) || 1, bob = hv && !own ? Math.round(Math.sin(t * 5)) : 0; ctx.drawImage(sp.n, Math.round(x + MKT_CW / 2 - sp.w * s / 2), Math.round(y + 32 - sp.h * s / 2) + bob, sp.w * s, sp.h * s); }
  if (own) { rect(x + MKT_CW / 2 + 12, y + 44, 10, 10, TH.green); for (const [dx, dy] of [[2, 5], [3, 6], [4, 7], [5, 6], [6, 5], [7, 4]]) rect(x + MKT_CW / 2 + 12 + dx, y + 44 + dy - 1, 1, 1, '#0a0908'); }
  const nl = mktText(x, y + 61, MKT_CW - 10, wname(id), '#e8e1d3', 2), py = y + 63 + nl * lineH();
  { const ps = String(MK_WPRICE), pw = textW(ps) + 12, px = Math.round(x + MKT_CW / 2 - pw / 2); drawProof(px, py); text(ps, px + 12, py + 1, !own && gp.proofs >= MK_WPRICE ? TH.gold : '#57524a'); }
  mktText(x, py + 14, MKT_CW - 12, tr(wd.d), '#9a9aa2', Math.max(2, Math.floor((h - (py - y) - 50) / lineH())));
  if (own) text(L('mk_wHave'), x + MKT_CW / 2, y + h - 36, '#8e877b', 1, 'center');
  const b = { x: x + 8, y: y + h - 23, w: MKT_CW - 16, h: 16, inRow: true, f: () => mktBuyW(id) };
  MKT.hits.push(b); drawBtn(b.x, b.y, b.w, b.h, own ? L('g_owned') : L('mk_unlock'), !TOUCH.on && !own && inR(b, Input.mx, Input.my), own ? '#3c3732' : TH.gold);
}

function mktPhotoCard(id, x, y, h, gp, t) {
  const d = gp.girls[id], aff = d ? d.aff : 0, met = girlMet(id), open = aff >= AFF_MAX, own = !!(d && d.priv), c = SURV[id].c, hv = !TOUCH.on && inR({ x, y, w: MKT_CW, h }, Input.mx, Input.my);
  if (!open) ctx.globalAlpha *= .75; mktFrame(x, y, h, open ? TH.pink : '#3a3a42', hv && open);
  ctx.drawImage(mktIcon(open ? 'photo' : 'photoLock'), x + MKT_CW / 2 - 20, y + 12 + (hv && open && !own ? Math.round(Math.sin(t * 5)) : 0), 40, 40);
  if (own) { rect(x + MKT_CW / 2 + 12, y + 44, 10, 10, TH.green); for (const [dx, dy] of [[2, 5], [3, 6], [4, 7], [5, 6], [6, 5], [7, 4]]) rect(x + MKT_CW / 2 + 12 + dx, y + 44 + dy - 1, 1, 1, '#0a0908'); }
  const nm = L('mk_priv', met ? svName(id) : L('unknown')), nl = mktText(x, y + 61, MKT_CW - 10, nm, open ? '#e8e1d3' : '#8e877b', 2), py = y + 63 + nl * lineH();
  { const ps = String(PRIV_PRICE), pw = textW(ps) + 12, px = Math.round(x + MKT_CW / 2 - pw / 2); drawProof(px, py); text(ps, px + 12, py + 1, open && !own ? TH.gold : '#57524a'); }
  // her affection: the bar to 100
  { const by = py + 16, bw = MKT_CW - 24, bx = x + 12; text(L('mk_aff', aff | 0), x + MKT_CW / 2, by, open ? TH.pink : '#8e877b', 1, 'center'); rect(bx, by + 12, bw, 3, '#1c1c21'); rect(bx, by + 12, Math.round(bw * Math.min(1, aff / AFF_MAX)), 3, open ? TH.pink : '#5a5a62'); }
  if (own) text(L('mk_privHave'), x + MKT_CW / 2, y + h - 36, c, 1, 'center'); else if (!open) text(L('mk_privNeed'), x + MKT_CW / 2, y + h - 36, '#6e675c', 1, 'center');
  const lbl = own ? L('g_owned') : open ? L('mk_buy') : L('mk_locked'), b = { x: x + 8, y: y + h - 23, w: MKT_CW - 16, h: 16, inRow: true, f: () => mktBuyPriv(id) };
  MKT.hits.push(b); drawBtn(b.x, b.y, b.w, b.h, lbl, !TOUCH.on && open && !own && inR(b, Input.mx, Input.my), open && !own ? TH.pink : '#3c3732'); if (!open) icon('lock', b.x + 6, b.y + 4, '#57524a');
}

// ---------------- in the run ----------------
// a new run takes whatever was bought (and the market is emptied); a resumed run keeps what its save says
function marketTake() {
  if (window.BOSS_TEST && BOSS_TEST.on) return {}; const m = mkt(), b = { armory: m.armory && WEAPONS[m.armory] && wUnlocked(m.armory) ? m.armory : null, adren: !!m.adren, resolve: !!m.resolve, serum: m.serum && SHARD[m.serum] ? m.serum : null };
  if (b.armory || b.adren || b.resolve || b.serum) { Object.assign(m, { armory: null, adren: false, resolve: false, serum: null }); gpSave(); }
  return b;
}
function marketApply() {
  const b = G.buffs || {}, p = G.p, on = [];
  if (b.armory) { p.weapons = [b.armory]; p.wi = 0; G.seenW = new Set(p.weapons); codexMark('w:' + b.armory); on.push(tr(MARKET.find(q => q.id === 'armory').n) + '：' + wname(b.armory)); }
  if (b.adren) on.push(tr(MARKET.find(q => q.id === 'adren').n)); if (b.resolve) on.push(tr(MARKET.find(q => q.id === 'resolve').n));
  if (b.serum) { applyShard(b.serum); on.push(tr(MARKET.find(q => q.id === 'serum').n) + '：' + sname(SHARD[b.serum])); }
  if (on.length) G.later.push({ t: 2.4, f: () => notify(L('mk_active', on.join('、')), TH.gold) });
}
// adrenaline: fires when a hit takes your health to 3 or less (not again for 60 s)
function adrenTick() {
  const p = G.p; if (!G.buffs || !G.buffs.adren || !p || !p.alive) return; const before = G.adrenHp === undefined ? p.hp : G.adrenHp; G.adrenHp = p.hp;
  if (!(p.hp < before && p.hp <= 3) || G.runT < (G.adrenAt || 0)) return;
  G.adrenAt = G.runT + ADREN_CD; p.inv = Math.max(p.inv, ADREN_T); notify(L('mk_adren'), TH.red); AU.play('revive', 1.3, .6); ringFx(p.x, p.y, 30, TH.red, .5, 3); flash(TH.red, .2, true);
}
// the explorer's resolve: +10% damage for the whole run
const _recomputeMk = recomputeStats; recomputeStats = function () { _recomputeMk(); if (G && G.buffs && G.buffs.resolve && G.S) G.S.dmg *= 1.1; };
