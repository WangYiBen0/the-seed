// ===== 入侵抵抗 look and motion: summons at a sensible size with a marker where they will appear, the HUD and the screens between
// waves dressed like the rest of the game (warm near-black plates, bone text, an ember rule), and motion for everything that used to
// pop: screens fade in, cards drop in one after another, the stats panel slides in, pop-ups open, the HUD slides in when a wave starts,
// and changes of screen close and open black shutters like the floor transition (no captions).
'use strict';
const IVS = { cardT: 9, enterT: 9, hudT: 9, last: '', sig: '', hpTrail: 0, ink: 0, inkPulse: 0, sold: [0, 0, 0, 0], ci: 0 };
const ivEase = (t, d) => easeOut(clamp(t / d, 0, 1));
// ---------------- summons: smaller, and placed the Brotato way with a marker first ----------------
// structures: anywhere on the arena away from the walls, never on top of another structure or the player; mines may sit closer together.
// Pets appear around the player. Each spot shows a marker for a moment before the summon lands there.
// the engineer builds around himself: a random spot 22-60 px from the player, on open floor, not on top of another structure
function ivNearSpot() { const iv = G.iv, p = G.p, m = 30, W2 = WORLD.w * T, H2 = WORLD.h * T; let best = null, bd = -1e9;
  for (let i = 0; i < 48; i++) { const a = rand(0, 6.283), r = rand(22, 46) + i * .4, x = clamp(p.x + Math.cos(a) * r, m, W2 - m), y = clamp(p.y + Math.sin(a) * r, m, H2 - m);
    if (blocksMove(tileAtPx(x, y), false)) continue; const near = Math.min(dist(x, y, p.x, p.y) - 18, ...iv.str.map(s => dist(x, y, s.x, s.y) - 18), 999);
    if (near >= 0) return [x, y]; if (near > bd) { bd = near; best = [x, y]; } }
  return best || [clamp(p.x, m, W2 - m), clamp(p.y + 30, m, H2 - m)]; }
function ivSummonSpot(k) { const iv = G.iv, p = G.p, mine = k === 'mine', margin = mine ? 28 : 44, gap = mine ? 18 : 30, W2 = WORLD.w * T, H2 = WORLD.h * T;
  const taken = iv.str; let best = null, bd = -1;
  for (let i = 0; i < 40; i++) { const x = rand(margin, W2 - margin), y = rand(margin, H2 - margin); if (blocksMove(tileAtPx(x, y), false)) continue;
    const near = Math.min(dist(x, y, p.x, p.y) - 26, ...taken.map(s => dist(x, y, s.x, s.y) - gap), 999); if (near >= 0) return [x, y]; if (near > bd) { bd = near; best = [x, y]; } }
  return best || [W2 / 2, H2 / 2]; }
// summons placed by the game (wave start, timers) wait on their marker; ones placed at a given spot (a tree, a mine bot) land at once.
// While waiting, a structure does not fight (a garden or a medical turret may still count down); a pet stays on its marker.
const _ivBuildSt = ivBuild; ivBuild = function (k, x, y) { const iv = G.iv, auto = x === undefined;
  if (auto) [x, y] = iv.role === 'engineer' && k !== 'mine' ? ivNearSpot() : ivSummonSpot(k);
  const s = _ivBuildSt(k, x, y); if (auto) s.pend = s.pendMax = k === 'mine' ? .55 : .85; return s; };
function ivLand(x, y, c) { burst(x, y - 2, 8, c, 70, .3); ringFx(x, y, 10, c, .25, 1); }
const IV_IDLE_OK = new Set(['garden', 'medical_turret']);
const _ivUpdStructSt = ivUpdateStructures; ivUpdateStructures = function (dt) { const iv = G.iv;
  for (const s of iv.str) if (s.pend > 0) { s.pend -= dt; if (s.pend <= 0) { ivLand(s.x, s.y, s.k === 'mine' ? '#e0605a' : '#d9b575'); AU.play('drone', 1.4, .25); } }
  const hold = iv.str.filter(s => s.pend > 0 && !IV_IDLE_OK.has(s.k)); if (!hold.length) return _ivUpdStructSt(dt);
  iv.str = iv.str.filter(s => !hold.includes(s)); try { return _ivUpdStructSt(dt); } finally { iv.str.push(...hold); } };
const _ivWaveFxSt = ivWaveEffects; ivWaveEffects = function () { _ivWaveFxSt(); const iv = G.iv, p = G.p;
  iv.pets.forEach((q, i) => { const a = i * 2.39 + rand(-.3, .3), r = rand(26, 40); q.x = clamp(p.x + Math.cos(a) * r, T * 2, (WORLD.w - 2) * T); q.y = clamp(p.y + Math.sin(a) * r, T * 2, (WORLD.h - 2) * T); q.pend = q.pendMax = .7 + i * .12; }); };
const _ivUpdPetsSt = ivUpdatePets; ivUpdatePets = function (dt) { const iv = G.iv;
  for (const q of iv.pets) if (q.pend > 0) { q.pend -= dt; if (q.pend <= 0) { ivLand(q.x, q.y, '#8ed872'); AU.play('pickup', 1.5, .3); } }
  const hold = iv.pets.filter(q => q.pend > 0); if (!hold.length) return _ivUpdPetsSt(dt);
  iv.pets = iv.pets.filter(q => !hold.includes(q)); try { return _ivUpdPetsSt(dt); } finally { iv.pets.push(...hold); } };
// the marker: a ring closing in with four ticks, in the summon's colour
function ivMarker(x, y, k, c) { const t = G.time; ctx.save(); ctx.globalAlpha = .35 + .35 * k; ringC(x, y, 3 + (1 - k) * 8, c, 1); ctx.globalAlpha = .8;
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + t * 2, r = 5 + (1 - k) * 4; rect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r * .6), 1, 1, c); }
  if (((t * 10) | 0) % 2) rect(x - 1, y - 1, 2, 2, c); ctx.restore(); }
ivDrawStructures = function (cx, cy) { const iv = G.iv;
  for (const s of iv.str) { if (s.pend > 0) { ivMarker(Math.round(s.x - cx), Math.round(s.y - cy), 1 - s.pend / s.pendMax, s.k === 'mine' ? '#e0605a' : '#d9b575'); continue; } const x = Math.round(s.x - cx), y = Math.round(s.y - cy), sp = ivSummonSprite(s.k, Math.floor((G.time + s.x * .01) * 5)), age = s.t || 0, pop = age < .2 ? 1 + (1 - age / .2) * .25 : 1;
    shadow(x, y + 2, 6); ctx.save(); ctx.imageSmoothingEnabled = true; ctx.translate(x, y + 2); ctx.scale(pop, pop); ctx.drawImage(sp.n, -9, -17, 18, 17); ctx.restore();
    if (s.flash > 0 && ['turret', 'explosive_turret', 'incendiary_turret'].includes(s.k)) { ctx.save(); ctx.globalAlpha = Math.min(1, s.flash * 8); disc(x + Math.cos(s.a || 0) * 4, y - 7 + Math.sin(s.a || 0) * 3, 1.5, s.k === 'incendiary_turret' ? '#f1ad65' : '#f8dc9c'); ctx.restore(); } } };
ivDrawCompanions = function (cx, cy) { const iv = G.iv;
  for (const q of iv.pets) { if (q.pend > 0) { ivMarker(Math.round(q.x - cx), Math.round(q.y - cy), 1 - q.pend / q.pendMax, '#8ed872'); continue; } const x = Math.round(q.x - cx), y = Math.round(q.y - cy), sp = ivSummonSprite(q.id, Math.floor((G.time + q.x * .01) * 7)), hover = ['doc_moth', 'jellyshield', 'wandering_bot'].includes(q.id), lift = hover ? Math.sin(G.time * 4 + q.a) * 1 - 2 : 0;
    shadow(x, y + 3, 5); ctx.save(); ctx.imageSmoothingEnabled = true; if (q.hp <= 0) ctx.globalAlpha = .4; ctx.translate(x, y); if (Math.cos(q.facing || 0) < 0) ctx.scale(-1, 1); ctx.drawImage(sp.n, -8, -13 + lift, 16, 15); ctx.restore();
    if (q.id === 'jellyshield') { ctx.save(); ctx.globalAlpha = .25; ringC(x, y - 4, 9, '#8ac1c1', 1); ctx.restore(); }
    if (q.id === 'scapegoat' && q.hp <= 0) { text('靠近复活', x, y + 6, TH.dim, .8, 'center'); if (q.revive) { rect(x - 8, y + 4, 16, 1, '#303b38'); rect(x - 8, y + 4, 8 * q.revive, 1, '#c7ca9a'); } } }
  for (const q of iv.healShots || []) { const x = q.x - cx, y = q.y - cy; ctx.save(); ctx.globalAlpha = .2; disc(x, y, 4, '#8bcaa7'); ctx.restore(); rect(x - 2, y, 5, 1, '#a5c590'); rect(x, y - 2, 1, 5, '#e3e5c6'); } };
// ---------------- motion bookkeeping ----------------
const ivOfferSig = () => { const iv = G.iv; return G.state + ':' + (G.state === 'ivshop' ? iv.offers.map(o => o ? o.k + o.id + o.t : '-').join() : G.state === 'ivlv' ? (iv.lvOpts || []).map(o => o.id + o.t).join() + iv.lvPend : G.state === 'ivstart' ? IVU.startPage || 0 : G.state === 'ivcrate' ? iv.crates.length + ':' + !!IVU.crateOpen : ''); };
const _ivUpdateSt = update; update = function (rdt) { const prev = G.state; _ivUpdateSt(rdt); if (!ivOn() || !G.iv) return;
  IVS.cardT += rdt; IVS.enterT += rdt; IVS.hudT += rdt; IVS.inkPulse = Math.max(0, IVS.inkPulse - rdt); for (let i = 0; i < 4; i++) IVS.sold[i] = Math.max(0, IVS.sold[i] - rdt);
  if (G.state !== IVS.last) { if (IV_UI.has(G.state) && !(IV_UI.has(IVS.last) && G.state === IVS.last)) { IVS.enterT = 0; IVS.cardT = 0; } if (G.state === 'play' && IV_UI.has(IVS.last)) IVS.hudT = 0; IVS.last = G.state; }
  if (IV_UI.has(G.state)) { const sig = ivOfferSig(); if (sig !== IVS.sig) { if (IVS.sig.split(':')[0] === G.state) IVS.cardT = 0; IVS.sig = sig; } }
  if ((G.ink | 0) > IVS.ink) IVS.inkPulse = .3; IVS.ink = G.ink | 0;
  const p = G.p; if (p) IVS.hpTrail = IVS.hpTrail > p.hp ? Math.max(p.hp, IVS.hpTrail - p.maxHp * rdt * .6) : p.hp; };
// buying empties a slot: a short flash where the card was
const _ivBuySt = ivBuy; ivBuy = function (i) { const had = G.iv.offers[i]; _ivBuySt(i); if (had && !G.iv.offers[i]) IVS.sold[i] = .35; };
const ivCardK = i => ivEase(IVS.cardT - i * .05, .22);
// ---------------- the screens between waves ----------------
// the backdrop and the title: the game's dark ground with grain, the title with a short ember rule, the parts in a plate beside it
ivTop = function (title) { const k = ivEase(IVS.enterT, .25); ctx.globalAlpha = .92; rect(0, 0, W, H, '#070606'); ctx.globalAlpha = .4; ctx.drawImage(winGrain(Math.ceil(W), H), 0, 0); ctx.globalAlpha = 1;
  const g = ctx.createLinearGradient(0, 0, 0, 30); g.addColorStop(0, 'rgba(208,112,46,.07)'); g.addColorStop(1, 'rgba(208,112,46,0)'); rect(0, 0, W, 30, g);
  const ox = Math.round((1 - k) * -14); let x = 10 + ox;
  if (title) { textS(title, x, 5, TH.bone, 2); rect(x, 23, Math.round(40 * k), 1, TH.ember); rect(x + Math.round(40 * k), 23, Math.round((textW(title, 2) + 20) * k), 1, 'rgba(255,255,255,.07)'); x += textW(title, 2) + 12; }
  const s = String(G.ink | 0), w = textW(s) + 20, pul = IVS.inkPulse / .3; hudPlate(x, 7, w, 13, pul > 0 ? thA('#8ed872', .4 + .6 * pul) : TH.line2, '#8ed872'); drawMat(x + 4, 11); text(s, x + 14, 10, pul > 0 ? '#e8ffd8' : '#c8f0b0', 1); };
// cards: the market's card plate (dark, a hairline edge lit on hover, the tier's strip), dropping in one after another
const _ivCardSt = ivCard; ivCard = function (x, y, w, h, o, hv, extra) { const k = ivCardK(IVS.ci++); if (k >= 1) return ivCardBody(x, y, w, h, o, hv, extra);
  ctx.save(); ctx.globalAlpha *= k; ctx.translate(0, Math.round((1 - k) * 12)); ivCardBody(x, y, w, h, o, hv, extra); ctx.restore(); };
function ivCardBody(x, y, w, h, o, hv, extra) { if (o.k === 'w') return ivDrawWeaponCard(x, y, w, h - (extra || 0), o, hv); const c = o.k === 'p' ? IV_PREF_COLOR[o.id] : IV_TIER_C[o.t];
  rect(x, y, w, h, hv ? '#15130f' : '#0e0d0b'); box(x, y, w, h, null, hv ? c : '#2b2823'); rect(x + 1, y + 1, w - 2, 2, c); if (hv) rect(x + 1, y + h - 2, w - 2, 1, thA(c, .35));
  rect(x + w / 2 - 15, y + 8, 30, 24, '#080707'); box(x + w / 2 - 15, y + 8, 30, 24, null, '#211e1a'); ivIcon(o, x + w / 2, y + 20, 2);
  let yy = y + 36; wrapW(ivName(o), w - 8).slice(0, 2).forEach(l => { text(l, x + w / 2, yy, c, 1, 'center'); yy += lineH(); });
  rect(x + 6, yy + 1, w - 12, 1, '#211e1a'); yy += 4; const lim = y + h - (extra || 0) - 2;
  for (const [s, cc] of ivDesc(o)) for (const l of wrapW(s, w - 8)) { if (yy + lineH() > lim) break; text(l, x + 4, yy, cc, 1); yy += lineH(); } }
// the stats panel slides in from the right
const _ivStatsSt = ivStatsPanel; ivStatsPanel = function (x, y, w, h) { const k = ivEase(IVS.enterT - .08, .3); ctx.save(); ctx.globalAlpha *= k; ctx.translate(Math.round((1 - k) * 24), 0);
  _ivStatsSt(x, y, w, h); box(x, y, w, h, null, TH.line2); rect(x, y, 30, 1, TH.ember); rect(x, y + 1, 10, 1, thA(TH.ember, .4)); ctx.restore(); };
// the whole screen fades in; emptied shop slots flash; the toast rises in
const _ivDrawUISt = ivDrawUI; ivDrawUI = function () { IVS.ci = 0; const a = ivEase(IVS.enterT, .18); ctx.save(); ctx.globalAlpha = a; _ivDrawUISt(); ctx.restore();
  if (G.state === 'ivshop') { const panelW = 104, cw = Math.floor((W - panelW - 20 - 18) / 4); for (let i = 0; i < 4; i++) if (IVS.sold[i] > 0) { const x = 10 + i * (cw + 6); ctx.save(); ctx.globalAlpha = IVS.sold[i] / .35 * .5; rect(x, 26, cw, 134, '#8ed872'); ctx.restore(); } } };
// ---------------- the shutters for a change of screen (timing from IVU.motion), the floor transition's look: black bars close from
// top and bottom, an ember seam where they meet, then they open again. No caption.
function ivDrawShutter(k) { const close = k < .4 ? easeOut(k / .4) : 1 - easeOut((k - .4) / .6), h = Math.ceil(H / 2 * close); if (h <= 0) return;
  rect(0, 0, W, h, '#000'); rect(0, H - h, W, h, '#000'); rect(0, h - 1, W, 1, thA(TH.ember, .7)); rect(0, H - h, W, 1, thA(TH.ember, .7));
  if (close > .9) { const w = Math.round(60 * (close - .9) * 10); rect(W / 2 - w / 2, H / 2, w, 1, TH.ember); } }
