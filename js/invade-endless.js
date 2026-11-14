// ===== TheSeed 入侵抵抗: endless mode, after Brotato's. Once wave 20 is held the player may settle (a win) or go on. From wave 21:
//   endless_wave = wave - 20; endless_mult = 2 + max(0, (wave - 35) * 0.2); endless_factor = endless_wave * (endless_wave + 1) / 2 / 100 * endless_mult
//   enemy health x (1 + 2.25 * factor), damage x (1 + factor), speed x (1 + min(1.75, factor / 13.33)), on top of the usual per-wave growth
//   waves last 60 s; both bosses on every 10th wave; elite waves each ten waves by danger (0 / 1 / 3), one more elite per ten waves passed
//   harvesting drops 20% after every wave; item prices x (1 + factor / 5); rerolls x sqrt(1 + factor)
//   materials drop at max(50%, 100% - 1.5% x wave); consumables and plain crates at 1 / (1 + factor); invulnerability after a hit / max(1, factor)
// Falling in endless still counts as a win (scored by the wave reached), like Brotato.
'use strict';
Object.assign(STR, {
  ive_title: ['WAVE 20 HELD', '第 20 波已守住', '第20波を守り抜いた', '第 20 波已守住'],
  ive_q: ['SETTLE THE RUN AS A WIN, OR GO ON INTO ENDLESS MODE? FOES KEEP GROWING STRONGER EVERY WAVE; FALLING IN ENDLESS STILL COUNTS AS A WIN, SCORED BY THE WAVE YOU REACH.',
    '结算本局胜利，还是进入无尽模式？无尽中敌人每波都会持续变强；在无尽中倒下依然算作胜利，按到达的波数计分。', '勝利として精算するか、無限モードに進むか？無限では敵が毎波強くなる。倒れても勝利扱いで、到達した波で採点される。',
    '结算本局胜利，还是进入无尽模式？无尽中敌人每波都会持续变强；在无尽中倒下依然算作胜利，按到达的波数计分。'],
  ive_settle: ['SETTLE (WIN)', '结算胜利', '勝利で精算', '结算胜利'], ive_go: ['GO ENDLESS', '进入无尽', '無限へ', '进入无尽'],
  ive_on: ['ENDLESS', '无尽', '無限', '无尽'], ive_wave: ['ENDLESS · WAVE {0}', '无尽 · 第 {0} 波', '無限・第{0}波', '无尽 · 第 {0} 波'],
  ive_stats: ['FOES: HEALTH +{0}% · DAMAGE +{1}%', '敌人：生命 +{0}% · 伤害 +{1}%', '敵：体力+{0}%・ダメージ+{1}%', '敌人：生命 +{0}% · 伤害 +{1}%'],
});
IV_SAVE_KEYS.push('endless');
const ivEndless = () => !!(G && G.iv && G.iv.endless && G.iv.wave > 20);
function ivEndlessFactor(w = G.iv.wave) { const ew = Math.max(0, w - 20), mult = 2 + Math.max(0, (w - 35) * .2); return Math.max(0, ew * (ew + 1) / 2 / 100) * mult; }
// ---- the choice after wave 20 ----
const IVE = { sel: 1, hits: [], t: 0 };
const _ivNextScreenE = ivNextScreen; ivNextScreen = function () { const iv = G.iv;
  if (iv && iv.wave === 20 && !iv.endless && !iv.crates.length && !(iv.lvPend > 0) && !iv.endAsked) { iv.endAsked = true; IVE.sel = 1; IVE.t = 0; IVE.hits = []; IVE.lmx = Input.mx; IVE.lmy = Input.my; G.state = 'ivendq'; AU.play('select'); return; }
  if (iv && iv.endless && iv.wave >= 20 && !iv.crates.length && !(iv.lvPend > 0)) { IVU.hits = []; IVU.detail = null; IVU.pop = null; IVU.t = 0; ivOpenShop(); return; }
  return _ivNextScreenE(); };
IV_UI.add('ivendq');
function iveSettle() { G.iv.endless = false; AU.play('menuOk'); ivWin(); }
function iveGo() { const iv = G.iv; iv.endless = true; AU.play('menuOk'); AU.play('roar', .8, .5); flash(C.red, .3, true); IVU.hits = []; IVU.t = 0; ivOpenShop(); try { ivSave(); } catch (e) { } }
const _ivUpdateUIE = ivUpdateUI; ivUpdateUI = function (dt) { if (G.state !== 'ivendq') return _ivUpdateUIE(dt); IVE.t += dt;
  if (pressed('KeyA') || pressed('ArrowLeft')) IVE.sel = 0; if (pressed('KeyD') || pressed('ArrowRight')) IVE.sel = 1;
  const moved = Input.mx !== IVE.lmx || Input.my !== IVE.lmy; IVE.lmx = Input.mx; IVE.lmy = Input.my;
  const hv = IVE.hits.findIndex(b => inR(b, Input.mx, Input.my)); if (hv >= 0 && moved && !TOUCH.on) IVE.sel = hv;
  if (IVE.t < .35) { Input.clicked = false; return; }
  const pick = Input.clicked && hv >= 0 ? hv : pressed('Enter') || pressed('Space') ? IVE.sel : -1; Input.clicked = false;
  if (pick === 0) iveSettle(); else if (pick === 1) iveGo(); };
const _ivDrawUIE = ivDrawUI; ivDrawUI = function () { if (G.state !== 'ivendq') return _ivDrawUIE(); const e = easeOut(clamp(IVE.t / .3, 0, 1)), w = Math.min(W - 40, 320), lh = lineH(), ls = wrapW(L('ive_q'), w - 28), h = 54 + ls.length * lh + 40;
  const x = Math.round(W / 2 - w / 2), y = Math.round(H / 2 - h / 2 + (1 - e) * 10); IVE.hits = [];
  ctx.globalAlpha = .7 * e; rect(0, 0, W, H, '#000'); ctx.globalAlpha = e; frame2(x, y, w, h, C.red);
  textS(L('ive_title'), W / 2, y + 12, '#f2ebde', 1.5, 'center'); rect(x + 14, y + 32, w - 28, 1, '#2d2925'); rect(W / 2 - 20, y + 32, 40, 1, C.red);
  ls.forEach((l, i) => text(l, x + 14, y + 42 + i * lh, '#a9a294'));
  const by = y + h - 28, bw = Math.floor((w - 38) / 2);
  [[0, 'ive_settle', TH.gold], [1, 'ive_go', C.red]].forEach(([j, k, c]) => { const b = { x: x + 14 + j * (bw + 10), y: by, w: bw, h: 18 }; IVE.hits.push(b); drawBtn(b.x, b.y, b.w, b.h, L(k), IVE.sel === j, c); });
  ctx.globalAlpha = 1; };
// ---- waves: 60 s, timed; bosses every 10th wave (both), elites by danger ----
const _ivStartWaveE = ivStartWave; ivStartWave = function (...a) { const r = _ivStartWaveE(...a), iv = G.iv; if (!ivEndless()) return r;
  const w = iv.wave, extra = Math.floor((w - 21) / 10), slots = [[], [5], [3, 6, 8]][Math.min(2, ivDifficulty().events >= 3 ? 2 : ivDifficulty().events)] || [];
  iv.bossT = w % 10 === 0 ? 2.5 : -1; iv.event = null;
  const n = w % 10 === 0 ? extra + (extra > 0 ? 0 : 0) : slots.includes(w % 10) ? 1 + extra : 0;
  iv.champs = []; for (let i = 0; i < n; i++) iv.champs.push(Math.max(2, iv.dur - 4 - i * 3));
  const f = ivEndlessFactor(w); G.banner = { t: 2.4, big: L('ive_wave', w), small: w % 10 === 0 ? L('iv_boss') : n ? L('iv_elite') : L('ive_stats', Math.round(225 * f), Math.round(100 * f)), c: C.red };
  AU.setMode(w % 10 === 0 ? 'boss' : 'fight'); return r; };
const _ivSpawnBossE = ivSpawnBoss; ivSpawnBoss = function () { const iv = G.iv; if (!ivEndless()) return _ivSpawnBossE(); if (iv.bosses.length) return;
  for (const id of ['predator', 'invoker']) ivSpawnMajor(id, true); G.boss = iv.bosses[0]; G.bossDead = false; AU.play('roar'); };
// the timer ends every endless wave (wave 20 itself still ends with its bosses)
const _ivUpdateE = ivUpdate; ivUpdate = function (dt) { const iv = G.iv; const r = _ivUpdateE(dt); if (ivEndless() && iv.phase === 'fight' && iv.t <= 0 && G.state === 'play') ivEndWave(); return r; };
// ---- enemies grow with the endless factor ----
function iveScale(e) { if (!e || !ivEndless()) return e; const f = ivEndlessFactor();
  e.hp *= 1 + 2.25 * f; e.maxHp = e.hp; if (e.ivDamage) e.ivDamage *= 1 + f; if (e.ivShotDamage) e.ivShotDamage *= 1 + f; if (e.spd) e.spd *= 1 + Math.min(1.75, f / 13.33); return e; }
const _ivSpawnE = ivSpawn; ivSpawn = function (...a) { return iveScale(_ivSpawnE(...a)); };
const _ivSpawnMajorE = ivSpawnMajor; ivSpawnMajor = function (...a) { return iveScale(_ivSpawnMajorE(...a)); };
// ---- the economy: harvesting shrinks, prices and rerolls rise, drops thin out ----
const _ivEndWaveE = ivEndWave; ivEndWave = function (...a) { const iv = G.iv, on = ivEndless() && iv.phase === 'fight'; const r = _ivEndWaveE(...a);
  if (on) { const h = ivStats().harvest; if (h > 0) { iv.base.harvest -= h * .2; ivDirty(); } } return r; };
const _ivPriceE = ivPrice; ivPrice = function (o) { const p = _ivPriceE(o); return o.price === undefined && ivEndless() ? Math.max(1, Math.floor(p * (1 + ivEndlessFactor() / 5))) : p; };
const _ivDropE = ivDrop; ivDrop = function (kind, x, y, extra = {}) { if (ivEndless()) { const iv = G.iv;
    if (kind === 'ink' && Math.random() > Math.max(.5, 1 - .015 * iv.wave)) return;
    if ((kind === 'food' || (kind === 'crate' && !extra.legendary)) && Math.random() > 1 / (1 + ivEndlessFactor())) return; }
  return _ivDropE(kind, x, y, extra); };
const _ivHurtE = ivHurt; ivHurt = function (...a) { const p = G.p, before = p.inv, r = _ivHurtE(...a); if (ivEndless() && p.inv > before && p.inv > 0) p.inv /= Math.max(1, ivEndlessFactor()); return r; };
// ---- the end: falling in endless is a win, scored by the wave reached ----
const _ivFinishE = ivFinish; ivFinish = function (win) { const iv = G.iv, endless = !!(iv && iv.endless && !iv.finished); if (endless) win = true;
  const r = _ivFinishE(win); if (endless && iv) { const gp = gpLoad(); gp.ivBest = gp.ivBest || {}; if (iv.wave > (gp.ivBest[G.diff] | 0)) { gp.ivBest[G.diff] = iv.wave; gpSave(); } G.ivReach = iv.wave; } return r; };
const _ivBuildResultE = ivBuildResult; ivBuildResult = function (win) { const r = _ivBuildResultE(win), iv = G.iv; if (iv && iv.endless) { r.endless = true; r.win = true; r.wave = Math.max(20, iv.wave | 0); const s = ivRunScore(r); r.score = s.total; r.parts = s.parts; r.mul = s.mul; } return r; };
IV_RES_KEYS.push('endless');
// the HUD: a red ENDLESS tag beside the wave
const _ivDrawHUDE = ivDrawHUD; ivDrawHUD = function (...a) { const r = _ivDrawHUDE(...a); if (!ivEndless() || G.state !== 'play') return r; const s = L('ive_on'), w = textW(s) + 8, x = Math.round(W / 2 - w / 2), y = 2;
  rect(x, y, w, 11, 'rgba(10,6,6,.85)'); box(x, y, w, 11, null, C.red); text(s, W / 2, y + 2 - (isCJK(s) ? 1 : 0), C.red, 1, 'center'); return r; };
// ---- settling from the endless shop: a button above "next wave"; the first press asks, the second settles every wave held so far as a win ----
Object.assign(STR, { ive_now: ['SETTLE NOW', '立即结算', '今すぐ精算', '立即结算'], ive_sure: ['CONFIRM: SETTLE AS A WIN', '确认按胜利结算？', '勝利で精算する？', '确认按胜利结算？'] });
const IVS_NOW = { armT: 0 };
function iveSettleNow() { const iv = G.iv; if (G.state !== 'ivshop' || !iv || !iv.endless || iv.wave <= 20) return;
  if (IVS_NOW.armT <= 0) { IVS_NOW.armT = 3; AU.play('menu', 1.2); return; }
  IVS_NOW.armT = 0; IVU.pop = null; IVU.detail = null; AU.play('menuOk'); ivWin(); }
const iveNowBox = () => { const panelW = 104, px = W - panelW - 6; return { x: px, y: H - 42, w: panelW, h: 16 }; };
const _ivStatsPanelE = ivStatsPanel; ivStatsPanel = function (x, y, w, h) { if (G.state === 'ivshop' && G.iv && G.iv.endless && G.iv.wave > 20 && y === 24) h -= 20; return _ivStatsPanelE(x, y, w, h); };
const _ivDrawUINow = ivDrawUI; ivDrawUI = function () { const r = _ivDrawUINow(); const iv = G.iv;
  if (G.state !== 'ivshop' || !iv || !iv.endless || iv.wave <= 20 || IVU.detail || IVU.pop) return r; IVS_NOW.armT = Math.max(0, IVS_NOW.armT - FRAME_DT);
  const b = iveNowBox(), armed = IVS_NOW.armT > 0; ivBtn(Object.assign({ kind: 'settle-now', f: iveSettleNow }, b), armed ? L('ive_sure') : L('ive_now') + ' · ' + L('iv_wave', iv.wave), armed ? C.red : TH.gold, armed ? true : undefined);
  return r; };
