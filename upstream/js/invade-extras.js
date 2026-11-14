// ===== 入侵抵抗: the run saved at every shop, a pause screen for the mode, a fuller crate opening, and a small DPS panel =====
'use strict';
Object.assign(STR, { iv_cont: ['CONTINUE', '繼續', '続ける', '继续'], iv_dps: ['DPS', 'DPS', 'DPS', 'DPS'] });
// ---------------- saving: a snapshot each time the shop opens; continuing reopens that shop ----------------
const IV_SAVE = 'achroma_ivrun', IV_SAVE_KEYS = ['base', 'items', 'xp', 'lv', 'lvPend', 'crates', 'offers', 'lock', 'rr', 'freeRolls', 'role', 'wave', 'events', 'pending', 'hpCap', 'speedCap', 'mats0', 'crateDrops'];
const IV_SLOT_RT = new Set(['x', 'y', 'a', 'mode', 'cd', 'mt', 'tx', 'ty', 'bx', 'by', 'dmg', 'ma', 'mr', 'slammed', 'swingDir', 'dpsAcc', 'dpsRate']);
let IV_RESUMING = false;
function ivSave() { if (!ivOn() || !G.iv || !G.p || !G.p.alive || G.iv.finished) return; const iv = G.iv, o = {};
  for (const k of IV_SAVE_KEYS) if (iv[k] !== undefined) o[k] = iv[k];
  o.w = iv.w.map(s => { const c = {}; for (const [k, v] of Object.entries(s)) if (!IV_SLOT_RT.has(k) && (v === null || ['number', 'string', 'boolean'].includes(typeof v))) c[k] = v; return c; });
  try { STORE.setItem(IV_SAVE, JSON.stringify({ v: 1, at: Date.now(), rid: G.rid, diff: G.diff, ink: G.ink | 0, kills: G.kills | 0, runT: G.runT || 0, iv: o })); } catch (e) { } }
function ivLoadSave() { try {
    const s = JSON.parse(STORE.getItem(IV_SAVE) || 'null'), iv = s?.iv;
    if (!s || s.v !== 1 || !iv || !Object.hasOwn(DIFF_BY, s.diff) || !Number.isInteger(iv.wave) || iv.wave < 1 || iv.wave > 19 ||
        !IV_ROLES.some(r => r.id === iv.role) || !Array.isArray(iv.w) || iv.w.length > 6) return null;
    if (!iv.w.every(w => w && Object.hasOwn(IV_W, w.id) && Number.isInteger(w.t) && w.t >= 0 && w.t <= 3)) return null;
    const count = (v, max = 1e6) => Math.floor(saveNum(v, 0, 0, max));
    // Keep valid checkpoint fields; repair optional fields before any renderer or
    // stat loop sees them. Extremely large/invalid stack counts are not playable saves.
    const items = iv.items && typeof iv.items === 'object' && !Array.isArray(iv.items) ? iv.items : {};
    if (Object.values(items).some(n => !Number.isInteger(n) || n < 0 || n > 10000)) return null;
    iv.items = Object.fromEntries(Object.entries(items).filter(([id,n]) => Object.hasOwn(IV_I,id) && n > 0));
    iv.base = Object.fromEntries([...IV_STATS,...IV_STATS2].map(([k]) => [k,saveNum(iv.base?.[k],0,-1e6,1e6)]));
    iv.w = iv.w.map(w => ({id:w.id,t:w.t,kills:count(w.kills),fired:count(w.fired)}));
    const offer = o => {
      if (!o || !Number.isInteger(o.t) || o.t < 0 || o.t > 3 || !(o.k === 'w' ? Object.hasOwn(IV_W,o.id) : o.k === 'i' && Object.hasOwn(IV_I,o.id))) return null;
      const q = {k:o.k,id:o.id,t:o.k === 'i' ? IV_I[o.id].t : o.t};
      if (typeof o.price === 'number' && Number.isFinite(o.price) && o.price >= 0) q.price = Math.min(1e9,Math.floor(o.price));
      return q;
    };
    iv.offers = Array.from({length:4},(_,i) => offer(saveList(iv.offers)[i]));
    iv.lock = Array.from({length:4},(_,i) => !!iv.offers[i] && saveList(iv.lock)[i] === true);
    iv.crates = saveList(iv.crates).slice(0,2048).filter(k => k && typeof k === 'object').map(k => ({legendary:!!k.legendary,...(offer(k.offer) ? {offer:offer(k.offer)} : {})}));
    iv.events = saveList(iv.events).filter(e => e && Number.isInteger(e.wave) && e.wave >= 1 && e.wave <= 20 && ['elite','horde'].includes(e.kind)).slice(0,3);
    iv.pending = Object.fromEntries(['bait','celery_tea','lure','peacock','weird_ghost','hourglass'].map(k => [k,count(iv.pending?.[k],10000)]));
    for (const k of ['lv','lvPend','rr','freeRolls','mats0','crateDrops']) iv[k] = count(iv[k]);
    iv.xp = saveNum(iv.xp,0,0,1e9);
    for (const k of ['hpCap','speedCap']) if (typeof iv[k] !== 'number' || !Number.isFinite(iv[k])) delete iv[k]; else iv[k] = clamp(iv[k],-1e6,1e6);
    s.ink = count(s.ink,1e9); s.kills = count(s.kills,1e9); s.runT = saveNum(s.runT,0,0,1e9);
    if (typeof s.rid !== 'string' || s.rid.length > 100) delete s.rid;
    return s;
  } catch (e) { return null; } }
function ivClearSave() { try { STORE.removeItem(IV_SAVE); } catch (e) { } }
const _ivOpenShopX = ivOpenShop; ivOpenShop = function () { const r = _ivOpenShopX(); ivSave(); return r; };
const _ivFinishX = ivFinish; ivFinish = function (win) { ivClearSave(); return _ivFinishX(win); };
const _ivBeginX = ivBegin; ivBegin = function () { if (!IV_RESUMING) ivClearSave(); return _ivBeginX(); };
function ivResume() { const s = ivLoadSave(); if (!s) return false; RUN_MODE = 'invade'; SET.diff = s.diff; IV_RESUMING = true; try { newRun(); } finally { IV_RESUMING = false; }
  const iv = G.iv; G.diff = s.diff; if (s.rid) G.rid = s.rid; G.ink = s.ink; G.kills = s.kills; G.runT = s.runT; G.hintQ = false;
  for (const k of IV_SAVE_KEYS) if (s.iv[k] !== undefined) iv[k] = s.iv[k];
  iv.items = Object.fromEntries(Object.entries(iv.items || {}).filter(([id, n]) => IV_I[id] && n > 0)); const okOffer = o => o && (o.k === 'w' ? IV_W[o.id] : o.k === 'i' ? IV_I[o.id] : false);
  iv.offers = (iv.offers || []).map(o => okOffer(o) ? o : null); while (iv.offers.length < 4) iv.offers.push(null); iv.crates = (iv.crates || []).filter(k => k && (!k.offer || okOffer(k.offer)));
  iv.w = s.iv.w.map(c => Object.assign({}, c, { cd: 0, mode: 'idle' })); iv.phase = 'shop';
  // Rebuild after restoring the preference: Steady has a smaller arena.
  G.ivRoom = ivArena(); G.p.x = G.ivRoom.cx*T+8; G.p.y = G.ivRoom.cy*T+8; G.p.safe = {x:G.p.x,y:G.p.y}; G.cam.x = G.p.x-W/2; G.cam.y = G.p.y-H/2;
  ivRepaint(Math.min(4, Math.floor(Math.max(0, iv.wave - 1) / 4)));
  ivDirty(); G.p.hp = G.p.maxHp; IVU.hits = []; IVU.detail = null; IVU.pop = null; G.state = 'ivshop'; ivTransition('营地补给 / 整备'); return true; }
function ivResumeFromCamp() { AU.init(); AU.startDrone(); if (!ivResume()) { toMenu(); return; } Input.down = false; LAUNCH.inT = 0; AU.play('select'); }
// A repeated render failure must restore this mode's checkpoint, never the
// unrelated exploration save. A first-wave failure keeps the mode at its menu.
const _softRecoverIvX = softRecover; softRecover = function () {
  if (!ivOn()) return _softRecoverIvX();
  if (!G.p || ['menu','launch','intro','dead','win'].includes(G.state)) return;
  FX.slow=1; FX.slowT=FX.hitstop=0; IVU.detail=IVU.pop=null; Input.down=Input.clicked=false;
  // Reset both canvas state stacks, including a save() left by the failed draw.
  cv.width=cv.width; view.width=view.width; wctx.imageSmoothingEnabled=vctx.imageSmoothingEnabled=false; ctx=wctx;
  try { const s=ivLoadSave(); if (s && s.rid===G.rid && ivResume()) notify('已恢复上一轮补给存档',C.gold); else toMenu(); }
  catch(e) { console.error('[achroma] invasion recovery failed',e); toMenu(); }
};
// the sortie column, in this mode: CONTINUE above the threat levels while a save exists
const _tbItemsX = tbItems; tbItems = function () { const items = _tbItemsX(), it = items[0], rows = it.rows;
  it.rows = () => { const r = rows(); if (DEP.mode !== 'invade') return r; const s = ivLoadSave(); if (!s) return r;
    const d = DIFF_BY[s.diff]; return [r[0], { l: () => L('iv_cont'), v: () => L('iv_wave', s.iv.wave + 1) + ' · ' + tr(d.nm), act: () => { TBAR.k = 0; RUN_MODE = 'invade'; campLaunch(ivResumeFromCamp); } }, ...r.slice(1)]; };
  return items; };
// ---------------- DPS: each weapon's damage, smoothed over a few seconds, listed from the highest ----------------
const _ivHitX = ivHit; ivHit = function (e, dmg, o = {}, ka = 0) { const before = e && !e.dead ? e.hp : 0, r = _ivHitX(e, dmg, o, ka);
  const s = o && o.slot; if (s && e && before > 0) s.dpsAcc = (s.dpsAcc || 0) + Math.max(0, Math.min(before, before - (e.dead ? 0 : e.hp)) || 0); return r; };
const _ivUpdateX = ivUpdate; ivUpdate = function (dt) { const r = _ivUpdateX(dt); const iv = G.iv; if (iv && dt > 0 && iv.phase === 'fight') { const k = 1 - Math.exp(-dt / 2.5);
    for (const s of iv.w) { s.dpsRate = (s.dpsRate || 0) + ((s.dpsAcc || 0) / dt - (s.dpsRate || 0)) * k; s.dpsAcc = 0; } } return r; };
const _ivStartWaveX = ivStartWave; ivStartWave = function () { const r = _ivStartWaveX(); for (const s of G.iv.w) { s.dpsRate = 0; s.dpsAcc = 0; } return r; };
function ivDrawDps() { const iv = G.iv; if (!iv || !iv.w.length) return; const list = iv.w.slice().sort((a, b) => (b.dpsRate || 0) - (a.dpsRate || 0)), w = 92, rh = 11, x = W - w - 6, y = 22, h = 13 + list.length * rh;
  hudPlate(x, y, w, h, col(2), TH.ember); text(L('iv_dps'), x + 5, y + 3, '#8e877b', .85);
  list.forEach((s, i) => { const yy = y + 12 + i * rh, sp = ivWeaponSprite(s.id), sc = Math.min(12 / sp.w, 8 / sp.h); ctx.save(); ctx.imageSmoothingEnabled = !!sp.smooth; ctx.drawImage(sp.n, Math.round(x + 5), Math.round(yy + 5 - sp.h * sc / 2), sp.w * sc, sp.h * sc); ctx.restore();
    text(fitText(tr(IV_W[s.id].n), w - 50, .85), x + 20, yy + 1, IV_TIER_C[s.t], .85); text(String(Math.round(s.dpsRate || 0)), x + w - 5, yy + 1, '#e6dfd1', .85, 'right'); }); }
const _ivDrawHUDX = ivDrawHUD; ivDrawHUD = function () { _ivDrawHUDX(); if (G.iv && G.iv.phase === 'fight') ivDrawDps(); };
// ---------------- the pause screen in this mode: the run, the weapons and items (each opens its details), the stats ----------------
const IVP = { hits: [] };
function ivPauseLayout() { const px = 206, pw = W - px - 126, py = 30, ph = H - 46; return { px, pw, py, ph }; }
const _drawPauseX = drawPause; drawPause = function () { if (!(ivOn() && G.iv && MENU.page === 'pause')) return _drawPauseX();
  ctx.drawImage(ditherLayer(.75, col(0)), 0, 0); textS(L('paused'), 34, 40, TH.bone, 3); rect(34, 69, 150, 1, TH.line2); rect(34, 69, 30, 1, TH.ember); drawMenuList('pause');
  const iv = G.iv, { px, pw, py, ph } = ivPauseLayout(); IVP.hits = []; frame2(px, py, pw, ph, TH.ember, L('run'));
  const mins = Math.floor(G.runT / 60), secs = ('0' + Math.floor(G.runT % 60)).slice(-2);
  [[L('iv_wave', iv.wave), ''], [L('st_time'), mins + ':' + secs], [L('st_kills'), G.kills]].forEach(([k, v], i) => { const x = px + 10 + i * Math.floor((pw - 20) / 3); text(fitText(k, 60), x, py + 20, '#8e877b'); if (v !== '') text(fitText(String(v), 60), x, py + 29, '#e8e1d3'); });
  text(L('iv_lv', iv.lv), px + 10, py + 29, '#8ed872');
  let y = py + 44; text(L('iv_weapons') + ' ' + iv.w.length + '/6', px + 10, y, '#8e877b'); y += 11;
  iv.w.forEach((s, i) => { const x = px + 10 + i * 24, b = { x, y, w: 22, h: 20, o: { k: 'w', id: s.id, t: s.t } }, hv = !TOUCH.on && inR(b, Input.mx, Input.my); IVP.hits.push(b);
    rect(x, y, 22, 20, hv ? '#17140f' : '#0e0d0b'); box(x, y, 22, 20, null, hv ? IV_TIER_C[s.t] : thA(IV_TIER_C[s.t], .6)); ivIcon({ k: 'w', id: s.id, t: s.t }, x + 11, y + 10, 1); });
  y += 28; const owned = IV_I_IDS.filter(id => iv.items[id]); text(L('iv_items') + ' ' + owned.reduce((a, id) => a + iv.items[id], 0), px + 10, y, '#8e877b'); y += 11;
  const per = Math.max(1, Math.floor((pw - 20) / 19)), rows = Math.max(1, Math.floor((py + ph - 6 - y) / 19)), shown = owned.slice(0, per * rows);
  shown.forEach((id, i) => { const it = IV_I[id], x = px + 10 + (i % per) * 19, yy = y + Math.floor(i / per) * 19, b = { x, y: yy, w: 17, h: 17, o: { k: 'i', id, t: it.t } }, hv = !TOUCH.on && inR(b, Input.mx, Input.my); IVP.hits.push(b);
    rect(x, yy, 17, 17, hv ? '#17140f' : '#0e0d0b'); box(x, yy, 17, 17, null, hv ? IV_TIER_C[it.t] : thA(IV_TIER_C[it.t], .6)); ivIcon({ k: 'i', id, t: it.t }, x + 8, yy + 8, 1); if (iv.items[id] > 1) text(String(iv.items[id]), x + 16, yy + 9, col(5), 1, 'right'); });
  if (owned.length > shown.length) text('+' + (owned.length - shown.length), px + pw - 10, y - 11, '#8e877b', 1, 'right');
  ivStatsPanel(W - 116, py, 104, ph);
  if (IVU.detail) ivDrawUI(); };
const _updateMenuX = updateMenu; updateMenu = function (rdt) { if (!(ivOn() && G.iv && G.state === 'pause' && MENU.page === 'pause')) return _updateMenuX(rdt);
  if (IVU.detail) { ivUpdateUI(rdt); return; }
  if (Input.clicked) { const h = IVP.hits.find(b => inR(b, Input.mx, Input.my)); if (h) { Input.clicked = false; ivOpenDetail(h.o); AU.play('ui'); return; } }
  return _updateMenuX(rdt); };
// ---------------- the crate: it bobs and breathes; opening it shakes it, bursts the lid in a flash and a spray of sparks, a beam
// rises and the card climbs out of the crate, overshoots a little and settles; then the buttons fade in ----------------
const IV_CRATE_T = .95;
ivDrawCrateUI = function (px, panelW) { const k = G.iv.crates[0]; if (!k) return; const red = !!k.legendary, c = red ? '#e18b79' : '#a6cb83', cx = Math.round((px - 8) / 2), cy = 122, t = IVU.crateOpen ? IVU.crateAge || 0 : 0, rm = ivReducedMotion();
  ivTop(''); ivStatsPanel(px, 24, panelW, H - 30); const tt = G.time, open = IVU.crateOpen, T1 = .3;
  if (open && t >= T1 && !IVU.crateBoom) { IVU.crateBoom = true; AU.play('chestOpen'); AU.play('crate', 1.3, .6); }
  if (!open) IVU.crateBoom = false;
  // the glow under the crate
  const charge = open ? clamp(t / T1, 0, 1) : 0, after = open ? clamp((t - T1) / .5, 0, 1) : 0;
  ctx.save(); ctx.globalAlpha = .08 + .05 * Math.sin(tt * 3) + .18 * charge * (1 - after); disc(cx, cy + 10, 46 + 10 * charge, c); ctx.restore();
  // the beam and the rays after the burst
  if (open && t >= T1 && after < 1) { const a = 1 - after; ctx.save(); ctx.globalAlpha = .22 * a; rect(cx - 10 - 8 * after, 0, 20 + 16 * after, cy + 4, c); ctx.globalAlpha = .45 * a; rect(cx - 2, 0, 4, cy + 4, '#f2ebde'); ctx.restore();
    ctx.save(); for (let i = 0; i < 14; i++) { const ang2 = i * Math.PI / 7 + tt * .6, r1 = 18 + after * 30, r2 = r1 + 6 + 10 * (1 - after); ctx.globalAlpha = (1 - after) * .85; line(cx + Math.cos(ang2) * r1, cy + Math.sin(ang2) * r1, cx + Math.cos(ang2) * r2, cy + Math.sin(ang2) * r2, c, 1); } ctx.restore(); }
  // the crate: bobbing, then a shake that grows, then the lid flies open and it sinks back
  { const shake = open && t < T1 ? (rm ? 0 : Math.sin(t * 70) * 3 * charge) : 0, bob = open ? 0 : Math.sin(tt * 3) * 2, squash = open && t < T1 ? 1 - .08 * charge : open && t < T1 + .15 ? 1 + .1 * (1 - (t - T1) / .15) : 1;
    const lid = open ? (t < T1 ? 0 : Math.round(clamp((t - T1) / .15, 0, 1) * 4)) : 0, fade = open ? 1 - clamp((t - T1 - .25) / .4, 0, 1) * .55 : 1;
    ctx.save(); ctx.globalAlpha = fade; ctx.translate(cx + shake, cy + 30 + bob); ctx.scale(1 / squash, squash); ivDrawBadge(ivCrateSprite(red, lid), 0, -30, 80); ctx.restore(); }
  // the flash and the sparks
  if (open && t >= T1 && t < T1 + .5) { const f = (t - T1) / .5; ctx.save(); ctx.globalAlpha = (1 - f) * .7; disc(cx, cy, 10 + f * 40, '#f2ebde'); ctx.globalAlpha = 1 - f;
    for (let i = 0; i < 22; i++) { const a = i * 2.39996 + (red ? .5 : 0), v = 60 + (i * 37 % 50), d = v * f, sx = cx + Math.cos(a) * d, sy = cy - 6 + Math.sin(a) * d * .8 + 40 * f * f; rect(Math.round(sx), Math.round(sy), i % 3 ? 1 : 2, i % 3 ? 1 : 2, i % 2 ? c : '#f2ebde'); } ctx.restore(); }
  if (!open) { ivBtn({ x: cx - 62, y: 204, w: 124, h: 24, f: ivOpenCrate }, '开启', c); return; }
  // the card climbs out of the crate and settles
  if (t >= T1 + .05) { const o = ivCrateOffer(), x = Math.round(cx - 68), y = 44, rise = clamp((t - T1 - .05) / .45, 0, 1), e = rm ? 1 : 1 - Math.pow(1 - rise, 3), over = rise < 1 ? Math.sin(rise * Math.PI) * .06 : 0, sc = .25 + .75 * e + over;
    const yy = lerp(cy - 10, y + 72, e) - 72 * sc; ctx.save(); ctx.globalAlpha = clamp(rise * 2, 0, 1); ctx.translate(cx, yy + 72 * sc); ctx.scale(sc, sc); ctx.translate(-cx, -(y + 72)); ivCardBody(x, y, 136, 145, o, false); ctx.restore();
    if (t >= IV_CRATE_T - .1) { const a = clamp((t - IV_CRATE_T + .1) / .2, 0, 1); ctx.save(); ctx.globalAlpha *= a; IVU.hits.push({ x, y, w: 136, h: 145, f: () => ivOpenDetail(o) });
      ivBtn({ x, y: 199, w: 65, h: 24, f: () => ivCrate(true) }, '收下', c, ivItemOk(o.id)); ivBtn({ x: x + 71, y: 199, w: 65, h: 24, f: () => ivCrate(false) }, '回收 +' + ivRecycleValue(o), '#b7c996'); ctx.restore(); } } };
// turrets built by a weapon (the wrench and its kin) count toward that weapon's DPS: the wave's weapon-built structures are matched to
// their weapons in build order, and a structure's shots carry the owner along
const _ivWaveFxX = ivWaveEffects; ivWaveEffects = function () { const iv = G.iv, n0 = iv.str.length; _ivWaveFxX(); const fresh = iv.str.slice(n0);
  let i = ['turret', 'explosive_turret', 'laser_turret', 'incendiary_turret', 'medical_turret', 'garden', 'bot_o_mine', 'tyler'].reduce((a, id) => a + ivCount(id), 0);
  for (const w of iv.w) { if (w.id === 'wrench' || IV_W[w.id].turret) { if (fresh[i]) fresh[i].owner = w; i++; } if (w.id === 'pruner') i++; } };
const _ivProjectileX = ivProjectile; ivProjectile = function (x, y, a, dmg, ho = {}, extra = {}) {
  if (ho && ho.structure && !ho.slot) { const s = G.iv.str.find(q => q.owner && Math.abs(q.x - x) < 1 && Math.abs(q.y - y) < 9); if (s) ho = Object.assign({}, ho, { slot: s.owner }); }
  return _ivProjectileX(x, y, a, dmg, ho, extra); };
// ---------------- the dash, in this mode too: the dash pad comes back on phones, a dash passes through hits, and a thin bar under
// the player shows it coming back ----------------
{ const i = IV_PADS.indexOf('dash'); if (i >= 0) IV_PADS.splice(i, 1); }
const _hurtPlayerDashX = hurtPlayer; hurtPlayer = function (dmg, sx, sy, mechHit, pierce) { if (ivOn() && G.p && G.p.dashT > 0 && !mechHit) return false; return _hurtPlayerDashX(dmg, sx, sy, mechHit, pierce); };
const _ivDrawPlayerX = ivDrawPlayer; ivDrawPlayer = function (cx, cy) { const p = G.p; if (p && p.alive) { for (const g of G.ghosts || []) { ctx.globalAlpha = Math.min(1, g.life / .25) * .5; drawChar(pSprite('s', 'd'), g.x - cx, g.y + 4 - cy, g.flip, false, { noShadow: true }); } ctx.globalAlpha = 1; }
  _ivDrawPlayerX(cx, cy); if (!p.alive || !G.S) return;
  const full = .55 * G.S.dashCd; if (p.dashCd > 0 && full > 0) rect(Math.round(p.x - cx - 4), Math.round(p.y + 7 - cy), Math.round(8 * (1 - p.dashCd / full)), 1, col(4)); };
