// ===== TheSeed 入侵抵抗 (Invasion Resistance): a Brotato-style mode. One walled arena, 20 timed waves; up to six weapons attack on their own;
// kills drop parts (materials) that are money and experience; level-ups, supply crates and a shop come between waves. The run's
// own systems (enemies, bosses, hits, explosions, particles) are reused; the rooms, serums, partners and saves of 突入探索 are not.
'use strict';
let RUN_MODE = 'explore'; // the mode the next new run starts in; a restart keeps it
const ivOn = () => !!(G && G.mode === 'invade');
const IV_UI = new Set(['ivrole', 'ivstart', 'ivlv', 'ivcrate', 'ivshop']);
const IVU = { pop: null, t: 0, flash: null, hits: [], sel: -1 };
// ---------------- numbers ----------------
function ivStats() { return ivEffectStats(); }
function ivSetCounts() { const c = {}; for (const w of G.iv.w) for (const k of IV_W[w.id].set) c[k] = (c[k] || 0) + 1; return c; }
function ivDirty() { G.iv.cache = null; recomputeStats(); }
const ivCount = id => G.iv.items[id] || 0;
const ivFx = k => { let n = 0; for (const id in G.iv.items) if (IV_I[id].fx === k) n += G.iv.items[id]; return n; };
const ivTier = (v,t) => Array.isArray(v) ? v[t] : v;
function ivWDmg(s) { const w=IV_W[s.id], st=ivStats(); let d=w.dmg[s.t];
  for(const [k,v] of Object.entries(w.sc)) d+=(k==='hp'?10+st.hp:st[k]||0)*ivTier(v,s.t);
  d+=ivCount('nail')*.2*st.eng+ivCount('frozen_heart')*.1*st.elem;
  if(s.id==='stick')d+=[4,6,8,10][s.t]*(G.iv.w.filter(q=>q.id==='stick').length-1);
  return Math.max(1,Math.round(d*Math.max(0,1+st.dmg/100))); }
function ivWCd(s) { const w=IV_W[s.id], a=ivStats().aspd+(G.iv.role==='brawler'&&w.set.includes('unarmed')?50:0)+(G.iv.role==='doctor'&&w.set.includes('medical')?200:0);
  return Math.max(ivCount('ball_and_chain')?.75:.03,w.cd[s.t]/Math.max(.01,1+a/100)); }
function ivWRange(s) { const w=IV_W[s.id], bonus=G.iv.role==='crazy'&&w.set.includes('precise')?100:0;
  return Math.max(30,(ivTier(w.range,s.t)+ivStats().range*(w.melee?.5:1)+bonus)/3); }
function ivWCrit(s) { return clamp(ivTier(IV_W[s.id].crit,s.t) + ivStats().crit / 100, 0, 1); }
const ivNeed = lv => (lv + 4) * (lv + 4);
function ivPrice(o) { if (o.price !== undefined) return o.price; const st = ivStats(), base = o.k === 'w' ? IV_W[o.id].price * IV_TIER_PRICE[o.t] : IV_I[o.id].p, wave = G.iv.wave; return Math.max(1, Math.floor((base + wave + base * .1 * wave) * (1 + (st.price || 0) / 100))); }
const ivRerollCost = (rolls = G.iv.rr) => { const w = Math.max(1, G.iv.wave); return Math.floor(w * .75) + (rolls + 1) * Math.max(1, Math.floor(w * .4)); };
function ivRollTier() { const w = G.iv.wave, lk = Math.max(0,1 + ivStats().luck / 100), r = Math.random();
  const p4 = Math.min(.08, Math.max(0, (w - 7) * .0023) * lk), p3 = Math.min(.25, Math.max(0, (w - 3) * .02) * lk), p2 = Math.min(.6, Math.max(0, (w - 1) * .06) * lk);
  return r < p4 ? 3 : r < p3 ? 2 : r < p2 ? 1 : 0; }
const ivItemOk = id => !IV_I[id].max || ivCount(id) < IV_I[id].max;
function ivRollItem(t,tagged=false,crate=false) { const tags=ivRole()?.tags||[]; const reserved={};if(crate)G.iv.offers.forEach((o,i)=>{if(G.iv.lock[i]&&o?.k==='i'&&IV_I[o.id].max)reserved[o.id]=(reserved[o.id]||0)+1;});const locked=Object.keys(reserved).filter(id=>ivCount(id)+reserved[id]>=IV_I[id].max); for (let k = t; k >= 0; k--) { let pool = IV_I_IDS.filter(id => IV_I[id].t === k && ivItemOk(id)&&!locked.includes(id)); if(tagged){const preferred=pool.filter(id=>IV_I[id].tags?.some(t=>tags.includes(t)));if(preferred.length)pool=preferred;} if (pool.length) return { k: 'i', id: choice(pool), t: k }; } return { k: 'i', id: 'plant', t: 0 }; }
function ivRollOffer(kind) { const t = ivRollTier();
  if (kind === 'w' || (!kind && Math.random() < .35)) { const own = [...new Map(G.iv.w.filter(s=>ivWeaponAllowed(s.id)).map(s=>[s.id,s])).values()], r = Math.random(), bonus = Math.max(0, 6 - G.iv.wave) * .03;
    const sets = new Set(own.flatMap(s => IV_W[s.id].set)), sameClass = IV_W_IDS.filter(id => ivWeaponAllowed(id) && IV_W[id].set.some(k => sets.has(k)));
    const id = own.length && r < .2 ? choice(own).id : sameClass.length && r < .35 + bonus ? choice(sameClass) : choice(IV_W_IDS.filter(ivWeaponAllowed)); return { k: 'w', id, t }; }
  return ivRollItem(t,Math.random()<.05); }
function ivFillShop() { const iv = G.iv, free = [], kept = [], previous = iv.offers.filter(Boolean), same = (a, b) => a.k === b.k && a.id === b.id && a.t === b.t;
  for (let i = 0; i < 4; i++) { if (iv.lock[i] && iv.offers[i]) kept.push(iv.offers[i]); else { free.push(i); iv.offers[i] = null; iv.lock[i] = false; } }
  // Locks are never replaced. If a player locks too many items for the early quota,
  // all remaining slots become weapons; the full guarantee resumes when unlocked.
  let need = Math.max(0, (iv.wave <= 2 ? 2 : iv.wave <= 5 ? 1 : 0) - kept.filter(o => o.k === 'w').length);
  const kinds = free.map(() => need-- > 0 ? 'w' : iv.wave <= 2 ? 'i' : null);
  shuffle(kinds).forEach((kind, k) => { const i = free[k]; let o;
    const available = q => ![...previous, ...iv.offers.filter(Boolean)].some(p => same(p, q));
    for (let n = 0; n < 24; n++) { o = ivRollOffer(kind); if (available(o)) break; }
    if (!available(o)) { const pool = o.k === 'w' ? IV_W_IDS.filter(ivWeaponAllowed).map(id => ({ k: 'w', id, t: o.t })) : IV_I_IDS.filter(id => IV_I[id].t === o.t && ivItemOk(id)).map(id => ({ k: 'i', id, t: o.t }));
      const candidates = pool.filter(available); if (candidates.length) o = choice(candidates); }
    o.price = ivPrice(o); iv.offers[i] = o; }); }
// ---------------- the arena ----------------
function ivArena() {
  if (WORLD) { WORLD.level.width = 0; WORLD.decal.width = 0; }
  const small = G.iv && G.iv.role === 'old', mw = small ? 33 : 40, mh = small ? 21 : 26, tiles = new Uint8Array(mw * mh), Wd = { w: mw, h: mh, tiles, rooms: [], fi: G.ivPal || 0, spikeT: 0, props: [], traps: [], pools: [] };
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) tiles[y * mw + x] = x === 0 || y === 0 || x === mw - 1 || y === mh - 1 ? TL.WALL : TL.FLOOR;
  const room = { key: false, id: 0, gx: 0, gy: 0, cx: mw >> 1, cy: mh >> 1, x0: 0, y0: 0, w: mw, h: mh, type: 'arena', cleared: true, active: false, doors: [], visited: true, cell: { links: [] }, d: 0, orb: true };
  Wd.rooms.push(room); Wd.boss = null; Wd.bossLocked = false; WORLD = Wd; Wd.level = renderLevel(Wd);
  Wd.decal = document.createElement('canvas'); Wd.decal.width = mw * T; Wd.decal.height = mh * T; Wd.dctx = Wd.decal.getContext('2d'); return room; }
function ivRepaint(fi) { G.ivPal = fi; setFloorPal(fi); PALV++; spriteCache.clear(); const Wd = WORLD; Wd.fi = fi; Wd.level.width = 0; Wd.level = renderLevel(Wd); }
function ivBegin() {
  G.mode = 'invade'; G.iv = null; G.floor = 0; G.sup = null; G.support = null; G.ivPal = 0; setFloorPal(0); PALV++; spriteCache.clear(); P.length = 0; FT.length = 0;
  for (const k of ['enemies', 'bullets', 'ebullets', 'picks', 'inter', 'later', 'lasers', 'zones', 'vortices', 'mechs', 'slashes', 'beams', 'bolts', 'thrusts', 'muzzles', 'whips', 'slams', 'iais', 'punches', 'went', 'ghosts']) if (G[k]) G[k].length = 0;
  G.ivRoom = ivArena(); G.boss = null; G.bossDead = false; G.hasKey = false; G.trial = null; G.fires = []; G.emitters = []; G.strails = []; G.shockwaves = []; G.prompt = null;
  const p = G.p, r = G.ivRoom; p.x = r.cx * T + 8; p.y = r.cy * T + 8; p.safe = { x: p.x, y: p.y }; G.cam.x = p.x - W / 2; G.cam.y = p.y - H / 2;
  p.weapons = ['nail']; p.wi = 0; p.skill = null; p.maxArmor = 0; p.armor = 0; p.shards = {};
  const base = {}; for (const s of [...IV_STATS, ...IV_STATS2]) base[s[0]] = 0;
  G.iv = { role: null, pending: {}, pets: [], trees: [], elapsed: 0, waveHits: 0, waveBurnKills: 0, stomach: 0, waveMods: {}, waveTick: 0, waveTimers: {}, wave: 0, t: 0, dur: 0, phase: 'shop', base, items: {}, w: [], xp: 0, lv: 0, lvPend: 0, crates: [], offers: [null, null, null, null], lock: [false, false, false, false], rr: 0, lvOpts: null, lvRr: 0,
    spawnT: 0, regT: 0, medT: 0, lsN: 0, lsT: 0, str: [], shots: [], drones: [], teslaT: 0, magnet: false, endT: 0, angelOn: false, champs: [], bossT: -1, bosses: [], warnings: [], events: ivEventSchedule(), cache: null, mats0: 0 };
  G.ink = 0; G.inkAcc = 0; G.ptn = null; G.squad = []; recomputeStats(); p.hp = p.maxHp;
  IVU.pop = null; IVU.detail = null; IVU.flash = null; IVU.t = 0; G.state = 'ivrole'; IVU.roleSel = 0; IVU.itemPage = 0; IVU.hits = []; AU.setMode('calm'); if (AU.ctx) AU.setRoot(FLOORS[0].root);
}
// ---------------- waves ----------------
const ivDur = w => w >= 20 ? 90 : Math.min(60, 15 + w * 5);
function ivStartWave() {
  const iv = G.iv, p = G.p; ivClearCombat(); iv.wave++; iv.dur = iv.t = ivDur(iv.wave); iv.phase = 'fight'; iv.spawnT = .6; iv.magnet = false; iv.endT = 0; iv.angelOn = ivFx('angel') > 0; iv.str = []; iv.shots = []; iv.bosses = []; G.bossDead = false;
  iv.event = iv.events.find(e => e.wave === iv.wave) || null; iv.regT = iv.medT = iv.lsT = iv.lsN = 0;
  p.hp = p.maxHp; p.inv = .75; p.vx = p.vy = p.kx = p.ky = 0;
  const pal = Math.min(4, Math.floor((iv.wave - 1) / 4)); if (pal !== G.ivPal) ivRepaint(pal);
  iv.champs = iv.event && iv.event.kind === 'elite' ? [iv.dur - 4] : [];
  iv.bossT = iv.wave%5===0 ? 2.5 : -1;
  ivWaveEffects();
  for (const s of iv.w) { s.cd = .3 + Math.random() * .3; s.mode = 'idle'; s.kills = 0; s.fired = 0; }
  G.state = 'play'; AU.setMode(iv.wave%5===0 ? 'boss' : 'fight');
  G.banner = { t: 2.2, big: L('iv_wave', iv.wave), small: iv.wave%5===0 ? L('iv_boss') : iv.event ? L('iv_' + iv.event.kind) : '', c: iv.wave === 20 ? C.red : TH.emberHi };
}
function ivUpdate(dt) {
  const iv = G.iv, p = G.p; if (!iv) return;
  ivVisualTick(dt);
  if (iv.phase === 'end') { iv.endT += dt; if (iv.endT > 1.1) ivAfterWave(); return; }
  if (iv.phase !== 'fight') return;
  iv.t = Math.max(0, iv.t - dt); ivEffectTick(dt); if (G.state !== 'play') return;
  if(iv.wave===20&&(iv.t<=0||(iv.bosses.length&&iv.bosses.every(b=>b.dead)))){ivEndWave();return;}
  if (iv.t > 1) { iv.spawnT -= dt; if (iv.spawnT <= 0) { iv.spawnT += ivWaveDef().interval; ivSpawnGroup(); } }
  while (iv.champs.length && iv.t <= iv.champs[0]) { iv.champs.shift(); ivSpawnChamp(); }
  if (iv.bossT > 0) { iv.bossT -= dt; if (iv.bossT <= 0) ivSpawnBoss(); }
  ivUpdateWeapons(dt); ivUpdateShots(dt); ivUpdateStructures(dt); ivRegen(dt);
  if(iv.wave<20&&iv.t<=0)ivEndWave();
}
function ivEndWave() { const iv = G.iv;if(iv.phase!=='fight')return;const st=ivStats(); iv.phase = 'end'; iv.endT = 0;
  ivClearCombat(); iv.magnet = true;
  const h = Math.round(st.harvest); if (h < 0) G.ink = Math.max(0, G.ink + h); if (h > 0) { ivGainMat(h); notify(L('iv_harvest', h), C.green); iv.base.harvest += Math.ceil(h * (.05 + .08 * ivCount('crown'))); ivDirty(); }
  ivWaveEndEffects(); AU.play('clear'); AU.setMode('calm'); G.banner = { t: 1.2, big: L('clear'), small: L('iv_wave', iv.wave), c: col(5) }; }
function ivAfterWave() { const iv = G.iv;if(iv.phase!=='end')return; iv.phase = 'shop'; iv.lvRr = 0;
  for (const k of G.picks) { if (k.kind === 'ink') ivGainMat(1); else if (k.kind === 'crate') ivCollect(k); } G.picks.length = 0; iv.str = []; iv.drones = [];
  ivNextScreen(); }
function ivNextScreen() { const iv = G.iv; IVU.hits=[];IVU.detail=null;IVU.pop = null; IVU.t = 0;
  if (iv.crates.length) { G.state = 'ivcrate'; ivPrepareCrate(); AU.play('crate'); return; }
  if (iv.lvPend > 0) { iv.lvOpts = ivLvOpts(); G.state = 'ivlv'; AU.play('select'); return; }
  if(iv.wave>=20){ivWin();return;}
  ivOpenShop(); }
function ivOpenShop() { IVU.hits=[];ivShopEffects(); G.iv.rr = 0; ivFillShop(); G.state = 'ivshop'; AU.play('shop', .9); }
function ivWin() { if (G.iv.finished) return; G.iv.phase = 'won'; ivClearCombat(); G.bossDead = true; G.state = 'win'; G.endT = 0; AU.play('win'); AU.setMode('calm'); ivFinish(true); }
function ivFinish(win) { const iv = G.iv; if (iv.finished) return; iv.finished = true; const gp = gpLoad(); G.result = null; gp.ivBest = gp.ivBest && typeof gp.ivBest === 'object' ? gp.ivBest : {}; const reach = win ? 20 : iv.wave;
  if (reach > (gp.ivBest[G.diff] | 0)) gp.ivBest[G.diff] = reach; gpSave(); G.ivReach = reach; if (win) girlsOnClear(); }
const ivBest = d => { const b = gpLoad().ivBest; return b && b[d] | 0; };
// ---------------- parts, experience, levels ----------------
function ivGainMat(n) { const iv = G.iv, st = ivStats(); G.ink += n; iv.xp += n * Math.max(0, 1 + (st.xp || 0) / 100);
  while (iv.xp >= ivNeed(iv.lv)) { iv.xp -= ivNeed(iv.lv); iv.lv++; iv.lvPend++; iv.base.hp += 1 - ivCount('decomposing_flesh'); iv.base.steal += ivCount('decomposing_flesh'); ivDirty(); if (!ivCount('torture')) G.p.hp = Math.min(G.p.maxHp, G.p.hp + 1); if (iv.phase === 'fight') { floatText(G.p.x, G.p.y - 16, L('iv_lvl'), C.green, 1, 1); AU.play('skillReady', 1.2, .6); } } }
function ivLvOpts() { const ks = shuffle(Object.keys(IV_UP)).slice(0, 4); return ks.map(k => ({ k: 'u', id: k, t: ivRollTier() })); }
function ivHealP(n, source) { if (ivCount('torture') && source !== 'torture') return; const p = G.p, h = Math.min(n, p.maxHp - p.hp); if (h <= 0) return; p.hp += h; floatText(p.x, p.y - 14, '+' + h, C.green, 1, .5); }
function ivRegen(dt) { const iv=G.iv,st=ivStats(),p=G.p; iv.lsT+=dt;if(iv.lsT>=1){iv.lsT%=1;iv.lsN=0;}
  if(st.regen>0&&p.hp<p.maxHp&&!ivCount('torture')){iv.regT+=dt;const per=5/(1+(st.regen-1)*.45);while(iv.regT>=per){iv.regT-=per;ivHealP(1);}}else iv.regT=0;
}
function ivUpdatePicks(dt) { const p=G.p,iv=G.iv,R=Math.max(4,26*(1+ivStats().pick/100));
  for(let i=G.picks.length-1;i>=0;i--){const k=G.picks[i];k.t+=dt;const d=dist(k.x,k.y,p.x,p.y),usable=k.kind!=='food'||p.hp<p.maxHp||(ivCount('extra_stomach')&&iv.stomach<8)||ivCount('spicy_sauce');
    if(usable&&k.t>.3&&(d<R||k.attract||(iv.magnet&&k.kind==='ink'))){const a=ang(k.x,k.y,p.x,p.y),v=230+k.t*120;k.vx=lerp(k.vx,Math.cos(a)*v,Math.min(1,dt*8));k.vy=lerp(k.vy,Math.sin(a)*v,Math.min(1,dt*8));}else{k.vx*=Math.pow(.02,dt);k.vy*=Math.pow(.02,dt);}
    k.x+=k.vx*dt;k.y+=k.vy*dt;if(usable&&d<7&&k.t>.2){G.picks.splice(i,1);ivCollect(k);}
  }
}

// ---------------- weapons in the arena ----------------
function ivSlotHome(i, n) { const a = (i / Math.max(1, n)) * 6.283 + .5, R = n > 1 ? 14 : 10; return [Math.cos(a) * R, Math.sin(a) * R * .8 - 3]; }
function ivUpdateWeapons(dt) { const p = G.p, iv = G.iv, n = iv.w.length;
  iv.w.forEach((s, i) => { const w = IV_W[s.id], [hx, hy] = ivSlotHome(i, n), home = { x: p.x + hx, y: p.y + hy }; s.cd -= dt; if (s.a === undefined) s.a = 0;
    if (s.mode === 'out' || s.mode === 'back') { ivMeleeStep(s, w, home, dt); return; }
    s.x = home.x; s.y = home.y; const R = ivWRange(s), tg = ivNearest(p.x, p.y, R + 6);
    if (tg) s.a += angDiff(s.a, ang(s.x, s.y, tg.x, tg.y)) * Math.min(1, dt * 18); else if (Math.abs(p.vx) + Math.abs(p.vy) > 10) s.a += angDiff(s.a, Math.atan2(p.vy, p.vx)) * Math.min(1, dt * 6);
    if (s.cd <= 0 && tg) { s.cd = ivWCd(s); if (w.melee) ivMeleeStart(s, w, tg, home); else ivFire(s, w, tg); } }); }
function ivHitOpts(s, w) { const st = ivStats(); return { crit: ivWCrit(s), cm: ivTier(w.cm,s.t), kb: Math.max(0,ivTier(w.kb,s.t)+st.kb) * 4, slot: s, elemental: !!w.sc.elem, c: IV_SETS[w.set[0]].c, burn: w.burn ? ivTier(w.burn,s.t) : 0, burnN: w.burnN ? ivTier(w.burnN,s.t) : 3, slow: w.slow, heal: ivTier(w.heal || 0,s.t), chain: w.chain ? w.chain[s.t] : 0, matKill: w.matKill || 0, elem: st.elem, ivRanged: !w.melee }; }
function ivMeleeStart(s, w, tg, home) { const p = G.p, R = ivWRange(s), a = ang(p.x, p.y, tg.x, tg.y), d = Math.min(R, dist(p.x, p.y, tg.x, tg.y));
  s.mode = 'out'; s.mt = 0; s.hit = new Set(); s.dmg = ivWDmg(s); s.ho = ivHitOpts(s, w); s.ma = a; s.mr = d; s.tx = p.x + Math.cos(a) * d; s.ty = p.y + Math.sin(a) * d; s.slammed = false; s.swingDir = -(s.swingDir || -1);
  AU.play(w.sweep ? 'whip' : w.slam ? 'hammer' : 'slash', 1 + Math.random() * .2, .5); }
function ivMeleeStep(s,w,home,dt) { const p=G.p,style=w.attack||'thrust',baseOut=style==='sweep'?.24:style==='slam'?.28:style==='saw'?.22:.13,tempo=Math.min(1,ivWCd(s)/(baseOut+.12)),out=baseOut*tempo,back=.12*tempo;
  const before=s.mt;s.mt+=dt;
  if(s.mode==='out'){
    const steps=Math.max(1,Math.ceil(dt/.012));
    for(let j=1;j<=steps;j++){const k=clamp((before+dt*j/steps)/out,0,1),oldx=s.x??home.x,oldy=s.y??home.y;
      let a=s.ma,r=s.mr*easeOut(k); if(style==='sweep'){a=s.ma+(s.swingDir||1)*(-1.3+2.6*k);r=Math.max(18,s.mr);}
      if(style==='slam'){a=s.ma-1.4*(1-k);r=s.mr*(k<.55?.4:.4+.6*(k-.55)/.45);}
      if(style==='saw'){a=s.ma+Math.sin(k*25)*.1;r=s.mr*(.85+.15*Math.sin(k*18));}
      if(style==='punch'){a=s.ma+.16*Math.sin(k*Math.PI);r=k<.15?-5*k/.15:s.mr*easeOut((k-.15)/.85);}
      s.x=p.x+Math.cos(a)*r;s.y=p.y+Math.sin(a)*r;s.a=a;
      if(style==='slam'&&k<.8)continue;
      for(const e of ivTargets()){if(e.dead||e.spawnT>0||s.hit.has(e))continue;
        const hit=style==='sweep'?segDist(e.x,e.y,p.x+Math.cos(a)*10,p.y+Math.sin(a)*10,s.x+Math.cos(a)*8,s.y+Math.sin(a)*8)<e.r+6:segDist(e.x,e.y,oldx,oldy,s.x,s.y)<e.r+7;
        if(hit){s.hit.add(e);ivHit(e,s.dmg,s.ho,a);}}
      if(k>=1)break;
    }
    if(s.mt>=out){s.mode='back';s.mt=0;s.bx=s.x;s.by=s.y;if(w.slam&&!s.slammed){s.slammed=true;ivExplosion(s.x,s.y,w.slam,s.dmg,s.ho,s.hit);} }
  }else{const k=Math.min(1,s.mt/back);s.x=lerp(s.bx,home.x,k);s.y=lerp(s.by,home.y,k);if(k>=1)s.mode='idle';}
}

function ivFire(s, w, tg) { const st = ivStats(), a0 = ang(s.x, s.y, tg.x, tg.y), n = w.pel ? w.pel[s.t] : 1, R = ivWRange(s), dmg = ivWDmg(s), ho = ivHitOpts(s, w);
  const muzzle=ivMuzzle(s,a0,tg),fx=IV_WEAPON_ART[s.id].fx;
  for (let k = 0; k < n; k++) { const a = a0 + (n > 1 ? (k / (n - 1) - .5) * (w.spread || .4) : rand(-1, 1) * (w.spread || 0) * .5), sp = w.spd * rand(.95, 1.05);
    const q={ x: muzzle.x, y: muzzle.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: R / sp * (w.short ? 1 : 1.25), dmg, ho, pierce: ivTier(w.pierce || 0,s.t) + ivCount('bandana') + ivCount('sharp_bullet'), pierceMul: Math.min(1,(w.pierceMul ?? .5) + st.pierceDmg / 100), bounce: (w.bounce ? w.bounce[s.t] : 0) + ivCount('ricochet'),
      expl: w.expl && Math.random() < ivTier(w.explChance ?? 1,s.t) ? w.expl : 0, split: w.split || 0, hit: new Set(), c: ho.c, flame: !!w.burn, big: !!w.expl,fx,age:0 };
    q.maxLife=q.life;
    if(fx==='laser'||fx==='rail')ivBeam(q.x,q.y,a,R*1.25,dmg,ho,q);else G.iv.shots.push(q); }
  s.fired = (s.fired || 0) + 1; if(s.id === 'revolver' && s.fired % 6 === 0) s.cd *= [2.07,1.93,1.80,1.67][s.t] / w.cd[s.t];
  ivMuzzleFlash(s,w,a0,muzzle);
  AU.play(fx==='laser'?'zap':fx==='rail'?'rail':w.burn ? 'flame' : w.expl ? 'rocket' : w.chain ? 'zap' : n > 1 ? 'pellet' : ['storm','smg'].includes(s.id) ? 'smg' : 'shoot', 1 + rand(-.08, .08), w.burn ? .25 : .45); }
function ivUpdateShots(dt) { const L3 = G.iv.shots;
  for (let i = L3.length - 1; i >= 0; i--) { const q = L3[i], ox = q.x, oy = q.y;q.trail=q.trail||[];q.trailT=(q.trailT||0)+dt;if(q.trailT>=.025){q.trailT=0;q.trail.push({x:ox,y:oy});if(q.trail.length>6)q.trail.shift();} q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; q.age=(q.age||0)+dt;
    if (q.life <= 0 || shotBlocked(q.x, q.y)) { if (q.expl) ivBoom(q); L3.splice(i, 1); continue; }
    const targets = ivTargets().filter(e => !e.dead && e.spawnT <= 0 && !q.hit.has(e) && segDist(e.x, e.y, ox, oy, q.x, q.y) <= e.r + (q.big ? 4 : 2)).sort((a, b) => dist(ox, oy, a.x, a.y) - dist(ox, oy, b.x, b.y));
    for (const e of targets) { if (e.dead) continue;
      q.hit.add(e); const a = Math.atan2(q.vy, q.vx);
      if (q.expl) { const dx = q.x - ox, dy = q.y - oy, k = clamp(((e.x - ox) * dx + (e.y - oy) * dy) / (dx * dx + dy * dy || 1), 0, 1); q.x = ox + dx * k; q.y = oy + dy * k; ivBoom(q); L3.splice(i, 1); break; }
      ivHit(e, q.dmg, q.ho, a);ivAddVisual({kind:'impact',fx:ivShotStyle(q),x:e.x,y:e.y,a,life:.13});
      if(q.ho.lastCrit&&q.ho.slot){const w=IV_W[q.ho.slot.id],t=q.ho.slot.t;if(w.critPierce&&!q.critGranted){q.pierce+=w.critPierce[t];q.critGranted=true;}if(w.critBounce&&!q.critGranted){q.bounce+=w.critBounce[t];q.critGranted=true;}}
      if (q.split) { for (let k = 0; k < q.split; k++) { const b = rand(0, 6.283); L3.push({ x: e.x, y: e.y, vx: Math.cos(b) * 300, vy: Math.sin(b) * 300, life: .3, dmg: Math.max(1, Math.round(q.dmg * .5)), ho: q.ho, pierce: 0, bounce: 0, expl: 0, split: 0, hit: new Set([e]), c: q.c }); } q.split = 0; }
      if (q.pierce > 0) { q.pierce--; q.dmg *= q.pierceMul ?? 1; continue; }
      if (q.bounce > 0) { q.bounce--; const n = ivNearest(q.x, q.y, 140, f => !q.hit.has(f)); if (n) { const b = ang(q.x, q.y, n.x, n.y), sp = Math.hypot(q.vx, q.vy); q.vx = Math.cos(b) * sp; q.vy = Math.sin(b) * sp; q.life = Math.max(q.life, .5); break; } }
      L3.splice(i, 1); break; } } }
function ivBoom(q) { ivExplosion(q.x,q.y,q.expl,q.dmg,q.ho); }
// Combat and structures are implemented in invade-effects.js, isolated from exploration.

// ---------------- hooks into the run ----------------
const _openHintQIv = openHintQ; openHintQ = function () { if (ivOn()) { G.hintQ = false; return; } return _openHintQIv(); };
const _enterFloorIv = enterFloor; enterFloor = function (fi) { if (RUN_MODE === 'invade') return ivBegin(); if (G) G.mode = 'explore'; return _enterFloorIv(fi); };
const _newRunIv = newRun; newRun = function (...a) { const r = _newRunIv(...a); if (ivOn()) { G.ptn = null; G.squad = []; G.support = null; recomputeStats(); G.p.hp = G.p.maxHp; } return r; };
const _resumeRunIv = resumeRun; resumeRun = function (...a) { RUN_MODE = 'explore'; return _resumeRunIv(...a); };
const _marketTakeIv = marketTake; marketTake = function () { return RUN_MODE === 'invade' ? {} : _marketTakeIv(); };
const _saveRunIv = saveRun; saveRun = function () { if (ivOn()) return; return _saveRunIv(); };
const _restartRunIv = restartRun; restartRun = function () { if (!ivOn()) return _restartRunIv(); SET.diff = G.diff || SET.diff; saveSettings(); LAUNCH.fn = null; launchRun(); };
const _recomputeIv = recomputeStats; recomputeStats = function () { const p = G && G.p, hp0 = p ? p.hp : 0; _recomputeIv(); if (!ivOn() || !G.S || !G.iv || !p) return;
  const S = G.S, st = ivStats(); S.speed = Math.max(.3, 1 + st.speed / 100); S.crit = 0; S.critMul = 2; S.knock = 1; S.dmg = 1; S.size = 1; S.bspd = 1;
  p.maxHp = Math.max(1, 10 + Math.round(st.hp)); p.maxArmor = 0; p.armor = 0; p.hp = Math.min(hp0, p.maxHp); };
const _updateRoomsIv = updateRooms; updateRooms = function (dt) { if (ivOn()) return ivUpdate(dt); return _updateRoomsIv(dt); };
const _updatePicksIv = updatePicks; updatePicks = function (dt) { if (ivOn()) return ivUpdatePicks(dt); return _updatePicksIv(dt); };
const _tryFireIv = tryFire; tryFire = function (...a) { if (ivOn()) return; return _tryFireIv(...a); };
const _offhandIv = offhandTick; offhandTick = function (...a) { if (ivOn()) return; return _offhandIv(...a); };
const _openBuildIv = openBuild; openBuild = function (...a) { if (ivOn()) return; return _openBuildIv(...a); };
const _killEnemyIv = killEnemy; killEnemy = function(e,o={}) {
  if(!ivOn()||!e||e.dead)return _killEnemyIv(e,o);
  if(e.ivTree)return ivKillTree(e);
  e.ink=1e-9; _killEnemyIv(e,o); if(!G.ivClearing)ivKillEffects(e,o);
};
const _hurtPlayerIv = hurtPlayer; hurtPlayer = function(dmg,sx,sy,mechHit,pierce){
  if(!ivOn())return _hurtPlayerIv(dmg,sx,sy,mechHit,pierce);
  return ivHurt(dmg,sx,sy);
};

// the screens between waves, and a camera that follows the player (not the pointer) and stays over the arena
const _updateIv = update; update = function (rdt) {
  if (ivOn() && IV_UI.has(G.state) && !G.hintQ) { G.time += rdt; ivVisualTick(rdt); IVU.t += rdt; if (IVU.flash) { IVU.flash.t += rdt; if (IVU.flash.t > 1.6) IVU.flash = null; } ivUpdateUI(rdt); updateParticles(rdt * .3); updateFT(rdt); return; }
  const cx0 = G.cam.x, cy0 = G.cam.y; _updateIv(rdt);
  if (ivOn() && G.p && WORLD && (G.state === 'play')) { const p = G.p, k = Math.min(1, rdt * 8), mx = WORLD.w * T - W, my = WORLD.h * T - H;
    G.cam.x = lerp(cx0, p.x - W / 2, k); G.cam.y = lerp(cy0, p.y - H / 2, k); G.cam.x = mx > 0 ? clamp(G.cam.x, -6, mx + 6) : mx / 2; G.cam.y = my > 0 ? clamp(G.cam.y, -6, my + 6) : my / 2; } };
// ---------------- drawing in the arena ----------------
function ivDrawWeapons(cx, cy) { ivDrawHeldWeapons(cx,cy); }
function ivDrawPlayer(cx, cy) { const p = G.p; if (!p.alive) return; const x = p.x - cx, foot = p.y + 4 - cy;
  if (Math.abs(p.vx) > 5) p.ivFlip = p.vx < 0;
  if (p.inv > 0 && ((p.inv * 20) | 0) % 2) shadow(x, foot, 9);
  else { const moving = Math.hypot(p.vx, p.vy) > 10, fr = moving ? ((p.walkT * 10) | 0) % 4 : 0, lift = moving ? (fr % 2 ? 1 : 0) : 0;
    drawChar(pSprite('s', fr), x, foot, !!p.ivFlip, false, { lift, shw: .75, rot: p.lean, sx: 1, sy: moving ? 1 : 1 + Math.max(0, Math.sin(G.time * 2.6)) * .06 }); }
  ivDrawWeapons(cx, cy);
  ivDrawCombatVisuals(cx,cy); }
const _drawPlayerIv = drawPlayer; drawPlayer = function (cx, cy) { if (ivOn()) return ivDrawPlayer(cx, cy); return _drawPlayerIv(cx, cy); };
const _drawGroundIv = drawSupportGround; drawSupportGround = function (cx, cy) { _drawGroundIv(cx, cy); if (!ivOn() || !G.iv) return; const t = G.time;
  ivDrawWarnings(cx, cy);
  ivDrawStructures(cx,cy);
  for (const d of G.iv.drones) { const x = Math.round(d.x - cx), y = Math.round(d.y - cy); rect(x - 3, y - 1, 6, 2, '#bfc8d8'); rect(x - 4, y - 2, 2, 1, col(4)); rect(x + 2, y - 2, 2, 1, col(4)); }
  for (const k of G.picks) { const x = Math.round(k.x - cx), y = Math.round(k.y - cy);
    if (k.kind === 'food') { rect(x - 2, y - 2, 4, 4, '#b8443a'); rect(x - 2, y - 2, 4, 1, '#d8d2c4'); rect(x - 1, y - 1, 2, 1, '#8ed872'); }
    else if(k.kind==='crate')ivDrawGroundCrate(k,x,y,t); } };
// ---------------- the HUD in a wave ----------------
function drawMat(x, y, c) { rect(x + 2, y, 3, 1, c || '#8ed872'); rect(x + 1, y + 1, 5, 3, c || '#8ed872'); rect(x + 2, y + 4, 3, 1, c || '#8ed872'); rect(x + 2, y + 1, 1, 1, '#e8ffd8'); }
function ivDrawHUD() { const p = G.p, iv = G.iv; if (!iv) return; const x = TOUCH.on ? 34 : 8, y = 8;
  hudPlate(x, y, 122, 12, col(2)); const hk = clamp(p.hp / p.maxHp, 0, 1); rect(x + 1, y + 1, Math.round(120 * hk), 10, '#8a1820'); rect(x + 1, y + 1, Math.round(120 * hk), 1, '#e0483e');
  text(Math.ceil(p.hp) + ' / ' + p.maxHp, x + 61, y + 3, col(5), 1, 'center');
  hudPlate(x, y + 14, 122, 7, col(1)); rect(x + 1, y + 15, Math.round(120 * clamp(iv.xp / ivNeed(iv.lv), 0, 1)), 5, '#4a8a3a'); text(L('iv_lv', iv.lv), x + 125, y + 13, '#8ed872', 1);
  drawMat(x, y + 26); text(String(G.ink | 0), x + 10, y + 26, '#c8f0b0', 1);
  if(iv.crates.length){const reds=iv.crates.filter(k=>k.legendary).length,greens=iv.crates.length-reds;ivDrawBadge(ivCrateSprite(false),x+49,y+29,12);text(String(greens),x+57,y+26,'#abc991');ivDrawBadge(ivCrateSprite(true),x+80,y+29,12);text(String(reds),x+88,y+26,'#dc9180');}
  const s1 = L('iv_wave', iv.wave); textS(s1, W / 2, 6, '#c9c1b2', 1, 'center');
  textS(String(Math.ceil(iv.t)), W / 2, 18, iv.t <= 5 ? C.red : col(5), 2.5, 'center');
  text('D' + ivDifficulty().danger, W - 12, 8, TH.bone, 1, 'right');
  const bosses = iv.bosses.filter(b => !b.dead), bw = bosses.length > 1 ? 145 : 200;
  bosses.forEach((b, i) => { const bx = Math.round(W / 2 - (bosses.length * (bw + 8) - 8) / 2 + i * (bw + 8)), by = H - 16;
    hudPlate(bx, by, bw, 8, col(2)); rect(bx + 1, by + 1, Math.round((bw - 2) * clamp(b.hp / b.maxHp, 0, 1)), 6, C.red); text(tr(b.def.name), bx + bw / 2, by - 11, C.red, 1, 'center'); }); }
const _drawHUDIv = drawHUD; drawHUD = function () { if (ivOn()) return ivDrawHUD(); return _drawHUDIv(); };
const _drawSkillHUDIv = drawSkillHUD; drawSkillHUD = function () { if (ivOn()) return; return _drawSkillHUDIv(); };
const IV_PADS = ['atk', 'dash', 'skill', 'reload', 'swap', 'sup', 'ptn'];
const _drawTouchUIIv = drawTouchUI; drawTouchUI = function (...a) { if (!ivOn()) return _drawTouchUIIv(...a); const keep = {}; for (const k of IV_PADS) if (TB[k]) { keep[k] = TB[k].x; TB[k].x = -999; }
  try { return _drawTouchUIIv(...a); } finally { for (const k in keep) TB[k].x = keep[k]; } };
// ---------------- the screens between waves ----------------
function ivDesc(o) { const L4 = [];
  if (o.k === 'p') return IV_ROLES.find(r=>r.id===o.id).lines.map(s=>[s,'#d4d4bf']);
  if (o.k === 'u') { const v = IV_UP[o.id][o.t], S2 = IV_STAT[o.id]; L4.push(['+' + v + (S2.pct ? '%' : '') + ' ' + tr(S2.n), '#8ed872']); return L4; }
  if (o.k === 'i') { const it = IV_I[o.id]; for (const k in it.m) { const v = it.m[k], S2 = IV_STAT[k]; L4.push([(v > 0 ? '+' : '') + v + (S2.pct ? '%' : '') + ' ' + tr(S2.n), v > 0 ? '#8ed872' : '#e0605a']); }
    if (it.desc) L4.push([it.desc, '#c9c1b2']); if (it.max) L4.push([tr(IZ('LIMIT ', '上限 ')) + it.max, '#6e675c']); return L4; }
  return ivWeaponDescription(o); }
function ivName(o) { return o.k === 'p' ? IV_ROLES.find(r=>r.id===o.id).n : o.k === 'u' ? tr(IV_STAT[o.id].n) : o.k === 'i' ? tr(IV_I[o.id].n) : tr(IV_W[o.id].n) + ' ' + IV_TIER_N[o.t]; }
function ivIcon(o, x, y, sc) { if (o.k === 'w'||o.k==='i') return ivDrawArtIcon(o,x,y,sc);
  if(o.k==='p')return ivDrawBadge(ivPreferenceSprite(o.id),x,y,sc*16);
  if(o.k==='u')return ivDrawBadge(ivStatSprite(o.id),x,y,sc*12);const ic=IV_I[o.id].ic; icon(ic, Math.round(x - 4 * sc), Math.round(y - 4 * sc), IV_TIER_C[o.t], sc); }
// a card: the tier's colour on the edge, the picture, the name, the lines; returns the area for the button under it
function ivCard(x, y, w, h, o, hv, extra) { if(o.k==='w')return ivDrawWeaponCard(x,y,w,h-(extra||0),o,hv); const c = IV_TIER_C[o.t];
  rect(x, y, w, h, hv ? '#15130f' : '#0e0d0b'); box(x, y, w, h, null, hv ? c : thA(c, .55)); rect(x + 1, y + 1, w - 2, 2, c);
  rect(x + w / 2 - 15, y + 7, 30, 24, '#08080a'); ivIcon(o, x + w / 2, y + 19, 2);
  let yy = y + 35; const nl = wrapW(ivName(o), w - 8).slice(0, 2); nl.forEach(l => { text(l, x + w / 2, yy, c, 1, 'center'); yy += lineH(); });
  if (o.k === 'w') { const ts = IV_W[o.id].set.map(k => tr(IV_SETS[k].n)).join(' · '); text(fitText(ts, w - 8), x + w / 2, yy, '#8e877b', 1, 'center'); yy += lineH(); }
  yy += 2; const lim = y + h - (extra || 0) - 2;
  for (const [s, cc] of ivDesc(o)) for (const l of wrapW(s, w - 8)) { if (yy + lineH() > lim) break; text(l, x + 4, yy, cc, 1); yy += lineH(); } }
function ivStatsPanel(x, y, w, h) { const st = ivStats(), lh = lineH(); rect(x, y, w, h, 'rgba(10,9,8,.92)'); box(x, y, w, h, null, '#2d2925'); rect(x, y, 30, 1, TH.ember);
  text(L('iv_stats'), x + 6, y + 4, '#8e877b'); let yy = y + 4 + lh + 2;
  for (const [k, n] of IV_STATS) { const v = Math.round(st[k] * 10) / 10 + (k === 'hp' ? 10 : 0), pc = IV_STAT[k].pct, c = (k === 'hp' ? v > 10 : v > 0) ? '#8ed872' : (k === 'hp' ? v < 10 : v < 0) ? '#e0605a' : '#c9c1b2';
    ivDrawBadge(ivStatSprite(k),x+11,yy+4,11);text(fitText(tr(n), w - 47), x + 20, yy, IV_STAT_COLOR[k]||TH.bone2); text(v + (pc ? '%' : ''), x + w - 6, yy, c, 1, 'right'); yy += lh; if (yy > y + h - lh) break; }
  const sets = Object.entries(ivSetCounts()).filter(([, n]) => n >= 2); if (sets.length && yy + lh < y + h) { yy += 2; for (const [k, n] of sets) { if (yy + lh > y + h) break; const S2 = IV_SETS[k], v = S2.v[Math.min(6, n) - 2];
      text(fitText(tr(S2.n) + n + ' +' + v + (IV_STAT[S2.st].pct ? '%' : '') + tr(IV_STAT[S2.st].n), w - 10), x + 6, yy, S2.c); yy += lh; } } }
function ivBtn(b, label, c, on) { IVU.hits.push(b); drawBtn(b.x, b.y, b.w, b.h, label, on !== false && !TOUCH.on && inR(b, Input.mx, Input.my), c); }
function ivTop(title) { ctx.globalAlpha = .9; rect(0, 0, W, H, '#060506'); ctx.globalAlpha = 1; if(title)textS(title, 10, 6, TH.bone, 2); const s = String(G.ink | 0), x = title ? 10 + textW(title, 2) + 14 : 10; drawMat(x, 12); text(s, x + 10, 11, '#c8f0b0', 1); }
function ivFlash(k, c) { IVU.flash = { txt: L(k), c: c || C.red, t: 0 }; AU.play('locked'); }
function ivPay(n) { if (G.ink < n) { ivFlash('iv_poor'); return false; } G.ink -= n; ivDirty(); return true; }
// weapons: the sixth slot is the last; a seventh of the same weapon and tier joins its twin (combine)
function ivGiveWeapon(id, t) { const iv = G.iv; if (!ivWeaponAllowed(id)) return false; if (iv.w.length < 6) { iv.w.push({ id, t, cd: 0, mode: 'idle' }); ivDirty(); return true; }
  const twin = iv.w.find(s => s.id === id && s.t === t && t < 3); if (twin) { twin.t++; ivDirty(); return true; } ivFlash('iv_full'); return false; }
function ivBuy(i) { const iv = G.iv, o = iv.offers[i]; if (!o) return; const pr = ivPrice(o);
  if(o.k==='w'&&!ivWeaponAllowed(o.id))return;
  if (o.k === 'i' && !ivItemOk(o.id)) { ivFlash('iv_max'); return; }
  if (o.k === 'w' && iv.w.length >= 6 && !iv.w.some(s => s.id === o.id && s.t === o.t && o.t < 3)) { ivFlash('iv_full'); return; }
  if (!ivPay(pr)) return; if (o.k === 'w') ivGiveWeapon(o.id, o.t); else ivGainItem(o.id);
  iv.offers[i] = null; iv.lock[i] = false; AU.play('shop'); if (iv.offers.every(o => !o)) ivFillShop(); }
function ivReroll() { const iv = G.iv, c = ivShopRerollCost(); if (iv.lock.every((v, i) => v && iv.offers[i]) || !ivPay(c)) return; if(iv.freeRolls>0)iv.freeRolls--;else iv.rr++; ivFillShop(); AU.play('card'); }
const ivRecycleValue = o => Math.max(1, Math.floor(ivPrice(o) * (.25 + .35 * ivCount('recycling_machine'))));
function ivSell(si) { const iv = G.iv, s = iv.w[si]; if (!s) return; const v = ivRecycleValue({ k: 'w', id: s.id, t: s.t }); iv.w.splice(si, 1); G.ink += v; ivDirty(); IVU.pop = null; AU.play('pickup'); }
function ivCombine(si) { const iv = G.iv, s = iv.w[si], j = iv.w.findIndex((q, k) => k !== si && q.id === s.id && q.t === s.t); if (j < 0 || s.t >= 3) return; iv.w.splice(j, 1); s.t++; ivDirty(); IVU.pop = null; AU.play('forge'); }
function ivNextWave() { if(G.state!=='ivshop')return;const iv = G.iv; IVU.pop = null; ivStartWave(); }
function ivUpdateUI(rdt) { const st = G.state, iv = G.iv, mx = Input.mx, my = Input.my;
  if (Input.clicked) { const h = (IVU.pop ? IVU.hits.slice(IVU.popAt || 0) : IVU.hits).slice().reverse().find(b => inR(b, mx, my)); Input.clicked = false; if (h) { h.f(); return; } if (IVU.pop) { IVU.pop = null; return; } }
  if(st==='ivrole'){for(let i=0;i<IV_ROLES.length;i++)if(pressed('Digit'+((i+1)%10)))IVU.roleSel=i; if(pressed('ArrowRight'))IVU.roleSel=((IVU.roleSel||0)+1)%IV_ROLES.length;if(pressed('ArrowLeft'))IVU.roleSel=((IVU.roleSel||0)+IV_ROLES.length-1)%IV_ROLES.length;if(pressed('ArrowDown'))IVU.roleSel=((IVU.roleSel||0)+2)%IV_ROLES.length;if(pressed('ArrowUp'))IVU.roleSel=((IVU.roleSel||0)+IV_ROLES.length-2)%IV_ROLES.length;if(pressed('Enter'))ivChooseRole(IV_ROLES[IVU.roleSel||0].id);}
  if(st==='ivstart'){if(pressed('Escape'))G.state='ivrole';for(let i=0;i<8;i++)if(pressed('Digit'+(i+1)))ivChooseWeapon(ivRole().start[(IVU.startPage||0)*8+i]);if(pressed('Enter'))ivChooseWeapon(ivRole().start[(IVU.startPage||0)*8+(IVU.startSel||0)]);}
  if (st === 'ivshop') { if (pressed('KeyR')) ivReroll(); if (pressed('Enter')) ivNextWave(); if (pressed('Escape') && IVU.pop) IVU.pop = null; }
  if (st === 'ivlv' && pressed('KeyR')) ivLvReroll();
  if (st === 'ivcrate') { if (pressed('Enter') || pressed('KeyE')) ivCrate(true); }
}
function ivLvReroll() { const iv = G.iv, c = ivRerollCost(iv.lvRr); if (!ivPay(c)) return; iv.lvRr++; iv.lvOpts = ivLvOpts(); AU.play('card'); }
function ivLvPick(o) { const iv = G.iv; iv.base[o.id] += IV_UP[o.id][o.t]; iv.lvPend--; ivDirty(); AU.play('chipGet'); if (o.id === 'hp' && !ivCount('torture')) G.p.hp = Math.min(G.p.maxHp, G.p.hp + IV_UP.hp[o.t]); iv.lvOpts = iv.lvPend > 0 ? ivLvOpts() : null; if (!iv.lvOpts) ivNextScreen(); }
function ivCrate(take) { if(G.state!=='ivcrate')return;const iv = G.iv; if(!iv.crates.length){ivNextScreen();return;}if(!IVU.crateOpen){ivOpenCrate();return;}if(IVU.crateAge<IV_CRATE_T&&!ivReducedMotion())return;const o=ivCrateOffer();iv.crates.shift();
  if (take && ivItemOk(o.id)) { ivGainItem(o.id); AU.play('chipGet'); } else { G.ink += ivRecycleValue(o); AU.play('pickup'); }
  ivNextScreen(); }
function ivDrawUI() { const st = G.state, iv = G.iv; IVU.hits = []; const lh = lineH(), panelW = 104, px = W - panelW - 6;
  if (st === 'ivrole') ivDrawRoleUI();
  if (st === 'ivstart') ivDrawStartUI();
  if (st === 'ivlv') { ivTop('选择强化'); if (iv.lvPend > 1) text(L('iv_lvlLeft', iv.lvPend), 10, 26, '#8e877b');
    const cw = Math.floor((W - panelW - 20 - 18) / 4), ch = 132; (iv.lvOpts || []).forEach((o, i) => { const x = 10 + i * (cw + 6), y = 40, b = { x, y, w: cw, h: ch, f: () => ivLvPick(o) }; IVU.hits.push(b); ivCard(x, y, cw, ch, o, !TOUCH.on && inR(b, Input.mx, Input.my)); });
    const c = ivRerollCost(iv.lvRr); ivBtn({ x: 10, y: 182, w: 90, h: 16, f: ivLvReroll }, L('iv_reroll') + '  -' + c, '#8ed872'); ivStatsPanel(px, 24, panelW, H - 30); }
  if (st === 'ivcrate') ivDrawCrateUI(px,panelW);
  if (st === 'ivshop') { ivTop(L('iv_shop') + '  ' + L('iv_wave', iv.wave)); const cw = Math.floor((W - panelW - 20 - 18) / 4), ch = 134;
    { const c = ivShopRerollCost(); ivBtn({ x: 10 + 3 * (cw + 6) + cw - 80, y: 6, w: 80, h: 15, f: ivReroll }, L('iv_reroll') + '  -' + c, '#8ed872'); }
    iv.offers.forEach((o, i) => { const x = 10 + i * (cw + 6), y = 26; if (!o) { box(x, y, cw, ch, null, '#24211d'); return; } const pr = ivPrice(o), hv = !TOUCH.on && inR({ x, y, w: cw, h: ch }, Input.mx, Input.my);
      ivCard(x, y, cw, ch - 18, o, hv); IVU.hits.push({x,y,w:cw,h:ch-18,f:()=>ivOpenDetail(o)}); const b = { x, y: y + ch - 16, w: cw - 18, h: 16, f: () => ivBuy(i) }; IVU.hits.push(b);
      drawBtn(b.x, b.y, b.w, b.h, '', !TOUCH.on && inR(b, Input.mx, Input.my), G.ink >= pr ? '#8ed872' : '#5a3a3a'); { const s = String(pr), w2 = textW(s) + 10, bx = Math.round(b.x + b.w / 2 - w2 / 2); drawMat(bx, b.y + 5, G.ink >= pr ? null : '#8a5a5a'); text(s, bx + 9, b.y + 4, G.ink >= pr ? '#e6dfd1' : '#e0605a'); }
      const lk = { x: x + cw - 16, y: y + ch - 16, w: 16, h: 16, f: () => { iv.lock[i] = !iv.lock[i]; AU.play('ui'); } }; IVU.hits.push(lk); box(lk.x, lk.y, lk.w, lk.h, iv.lock[i] ? thA(C.gold, .25) : '#0e0d0b', iv.lock[i] ? C.gold : '#3a3631'); icon('lock', lk.x + 4, lk.y + 4, iv.lock[i] ? C.gold : '#6e675c'); });
    // what you own: weapons (click for combine / recycle), then items
    let y = 26 + ch + 6; text(L('iv_weapons') + ' (' + iv.w.length + '/6)', 10, y, '#8e877b'); y += lh;
    iv.w.forEach((s, i) => { const x = 10 + i * 30, b = { x, y, w: 26, h: 24, f: () => { ivOpenDetail({k:'w',id:s.id,t:s.t,owned:s}); AU.play('ui'); } }; IVU.hits.push(b); const on = IVU.detail?.o.owned === s;
      rect(x, y, 26, 24, on ? '#17140f' : '#0e0d0b'); box(x, y, 26, 24, null, IV_TIER_C[s.t]); ivIcon({ k: 'w', id: s.id, t: s.t }, x + 13, y + 12, 1); });
    const iy = y + 28; text(L('iv_items'), 10, iy, '#8e877b'); const role=ivRole(),itemX=role?34:10;
    if(role){ivDrawBadge(ivPreferenceSprite(role.id),18,iy+lh+8,22);IVU.hits.push({kind:'preference',x:7,y:iy+lh-3,w:23,h:23,f:()=>{ivOpenDetail({k:'p',id:role.id,t:0});AU.play('ui');}});}
    let k = 0; const perRow = Math.max(1,Math.floor((px-itemX-6)/19)), owned = IV_I_IDS.filter(id=>iv.items[id]), pages=Math.max(1,Math.ceil(owned.length/perRow)); IVU.itemPage=clamp(IVU.itemPage||0,0,pages-1); if(pages>1){ivBtn({kind:'inventory-page',x:px-125,y:iy-2,w:120,h:13,f:()=>IVU.itemPage=(IVU.itemPage+1)%pages},'道具翻页 '+(IVU.itemPage+1)+'/'+pages,TH.dim);}
    for (const id of owned.slice(IVU.itemPage*perRow,(IVU.itemPage+1)*perRow)) { const n = iv.items[id]; if (!n) continue; const x = itemX + (k % perRow) * 19, yy = iy + lh + Math.floor(k / perRow) * 19, it = IV_I[id], b = {kind:'owned-item',id, x, y: yy, w: 17, h: 17, f: () => { ivOpenDetail({k:'i',id,t:IV_I[id].t}); AU.play('ui'); } }; IVU.hits.push(b);
      rect(x, yy, 17, 17, '#0e0d0b'); box(x, yy, 17, 17, null, thA(IV_TIER_C[it.t], .7)); ivIcon({k:'i',id,t:it.t},x+8,yy+8,1); if (n > 1) text(String(n), x + 16, yy + 9, col(5), 1, 'right'); k++; }
    ivStatsPanel(px, 24, panelW, H - 50); ivBtn({ x: px, y: H - 22, w: panelW, h: 18, f: ivNextWave }, L('iv_go', iv.wave + 1), TH.ember);
    { const ev = iv.events.find(e => e.wave > iv.wave), hint = ev ? L('iv_nextEvent', ev.wave, L('iv_' + ev.kind)) : L('iv_recover');
      text(fitText('D' + ivDifficulty().danger + ' · ' + hint, px - 18), 10, H - 16, TH.bone2); }
    // the pop-up for an owned weapon or item
    const P2 = IVU.pop; if (P2) { const o = P2.k === 'w' ? (iv.w[P2.i] ? { k: 'w', id: iv.w[P2.i].id, t: iv.w[P2.i].t } : null) : { k: 'i', id: P2.id, t: IV_I[P2.id].t }; if (o) { const pw = 140, ph = 132, x = Math.round((W - panelW) / 2 - pw / 2), y2 = 40;
        IVU.popAt = IVU.hits.length; rect(x - 4, y2 - 4, pw + 8, ph + 30, 'rgba(0,0,0,.6)'); ivCard(x, y2, pw, ph, o, true); IVU.hits.push({ x: x - 4, y: y2 - 4, w: pw + 8, h: ph + 30, f: () => { } });
        if (P2.k === 'w') { const s = iv.w[P2.i], v = ivRecycleValue(o), can = s.t < 3 && iv.w.some((q, j) => j !== P2.i && q.id === s.id && q.t === s.t);
          ivBtn({ x, y: y2 + ph + 6, w: 66, h: 16, f: () => ivSell(P2.i) }, L('iv_sell', v), '#8ed872'); ivBtn({ x: x + pw - 66, y: y2 + ph + 6, w: 66, h: 16, f: () => { if (can) ivCombine(P2.i); else AU.play('locked'); } }, L('iv_combine'), can ? C.gold : '#3c3732', can); }
        else { ivBtn({ x: x + pw / 2 - 33, y: y2 + ph + 6, w: 66, h: 16, f: () => { IVU.pop = null; } }, L('iv_close'), '#8e877b'); } } } }
  const f = IVU.flash; if (f) { const a = clamp(Math.min(f.t / .1, (1.6 - f.t) / .3), 0, 1), s = f.txt, w2 = textW(s) + 16; ctx.globalAlpha = a; rect(W / 2 - w2 / 2, H - 46, w2, 13, '#0b0b0d'); box(W / 2 - w2 / 2, H - 46, w2, 13, null, f.c); text(s, W / 2, H - 43, f.c, 1, 'center'); ctx.globalAlpha = 1; }
}
const _renderIv = render; render = function () { _renderIv(); if (!ivOn()) return; if (IV_UI.has(G.state)) ivDrawUI(); };
// the pause menu shows the stats; the end of a run
const _drawPauseIv = drawPause; drawPause = function () { _drawPauseIv(); if (ivOn() && MENU.page === 'pause' && G.iv) ivStatsPanel(W - 112, 24, 104, H - 40); };
function ivDrawEnd(win, t) { const iv = G.iv; ctx.drawImage(ditherLayer(clamp(t * 1.4, 0, .88), '#0a0908'), 0, 0); if (t < .3) return; const a = clamp((t - .3) / .4, 0, 1); ctx.globalAlpha = a;
  textS(win ? L('iv_win') : L('iv_dead'), W / 2, 40, win ? TH.gold : TH.blood, 3, 'center'); const d = DIFF_BY[G.diff] || DIFF_BY.classic;
  text(L('iv_reached', G.ivReach || iv.wave) + '   ' + tr(d.nm) + '   ' + L('iv_lv', iv.lv), W / 2, 80, TH.bone2, 1, 'center');
  text(L('iv_kills', G.kills | 0), W / 2, 94, '#8e877b', 1, 'center');
  iv.w.forEach((s, i) => { const x = W / 2 - iv.w.length * 15 + i * 30; box(x, 112, 26, 24, '#0e0d0b', IV_TIER_C[s.t]); ivIcon({ k: 'w', id: s.id, t: s.t }, x + 13, 124, 1); });
  if (win && G.proofGain) { const s = L('en_proof', G.proofGain), w2 = textW(s) + 12, x = Math.round(W / 2 - w2 / 2); drawProof(x, 150); text(s, x + 12, 151, TH.gold); }
  if (t > 1) text(L('iv_endHint'), W / 2, H - 30, '#8e877b', 1, 'center'); ctx.globalAlpha = 1; }
const _drawEndIv = drawEnd; drawEnd = function (win, t) { if (ivOn()) return ivDrawEnd(win, t); return _drawEndIv(win, t); };
// ---------------- the sortie column: first the mode, then the threat level ----------------
DEP.mode = null;
function depMode(m) { DEP.mode = m; DEP.pick = -1; TBAR.subT = 0; const rows = tbItems()[0].rows(); TBAR.sel = Math.max(0, rows.findIndex((r, j) => j > 0 && !r.off && !r.head && !r.info)); AU.play('menuOk'); }
const _tbItemsIv = tbItems; tbItems = function () { const items = _tbItemsIv(), it = items[0], rows = it.rows;
  it.title = () => DEP.mode === 'invade' ? L('md_invade') : DEP.mode === 'explore' ? L('md_explore') : L('tb_go');
  it.rows = () => { const all = rows(), fd = Math.max(0, all.findIndex(r => r.diff)), pre = all.slice(0, fd).filter(r => !r.head), rest = all.slice(fd);
    const back = { l: () => '<  ' + L('back'), back: true, act: () => { DEP.mode = null; DEP.pick = -1; TBAR.subT = 0; TBAR.sel = 0; } };
    if (DEP.mode === 'explore') return [back, ...rest];
    if (DEP.mode === 'invade') return [back, ...DIFFS.map((d, i) => ({ l: () => tr(d.nm), diff: d.id, clr: d.id, clrI: true, cur: () => DEP.pick === i, act: () => depPick(i) }))];
    return [...pre, { head: true, l: () => L('md_head') }, { l: () => L('md_explore'), sub: true, act: () => depMode('explore') }, { l: () => L('md_invade'), sub: true, act: () => depMode('invade') }]; };
  return items; };
const _tbSetIv = tbSet; tbSet = function (i) { if (TBAR.area !== i) DEP.mode = null; return _tbSetIv(i); };
const _sortieIv = sortie; sortie = function (i) { RUN_MODE = DEP.mode === 'invade' ? 'invade' : 'explore'; return _sortieIv(i); };
const _updateTaskbarIv = updateTaskbar; updateTaskbar = function (rdt) {
  if (TBAR.area === 0 && TBAR.shown === 0 && DEP.mode && DEP.pick < 0 && (pressed('Escape') || pressed('Backspace'))) { DEP.mode = null; TBAR.subT = 0; TBAR.sel = 0; AU.play('menu', .8); Input.prev.Escape = true; Input.prev.Backspace = true; if (typeof ESC_TAP !== 'undefined') ESC_TAP = false; }
  return _updateTaskbarIv(rdt); };
const _drawDeployCardIv = drawDeployCard; drawDeployCard = function (t, k0) { if (DEP.mode !== 'invade') return _drawDeployCardIv(t, k0);
  DEP.btn = null; DEP.card = null; const d = DIFFS[DEP.pick]; if (!d) return; const q = easeOut(clamp(DEP.t / .28, 0, 1)) * k0; if (q <= .01) return;
  const r = depCard(), c = d.c(), x = r.x + 10, iw = r.w - 20, lh = lineH(), by = r.y + r.h - 22, a0 = ctx.globalAlpha; DEP.card = r; DEP.btn = { x, y: by, w: iw, h: 16 };
  ctx.globalAlpha = a0 * q; ctx.save(); ctx.translate(0, Math.round((1 - q) * -12)); cardPlate(r.x, r.y, r.w, r.h, c);
  drawDiffEmblem(d.id, x - 3, r.y + 7, 1.4, t); textS(tr(d.nm), x + 36, r.y + 9, c, 2); text(L('md_invade'), x + 37, r.y + 30 - 1, TH.dim);
  const sep = by - 4 - lh * 2 - 6; let y = r.y + 45; for (const l of wrapW(L('md_invadeD'), iw).slice(0, 5)) { if (y + lh > sep) break; text(l, x, y, TH.bone2); y += lh; }
  rect(x, sep, iw, 1, TH.line); rect(x, sep, 14, 1, thA(c, .7)); y = sep + 5; text(L('dw_reward'), x, y, TH.faint);
  { const s1 = '×' + (PROOF_BY_DIFF[d.id] || 3); drawProof(x + 50, y); text(s1, x + 61, y + 1, TH.gold); const b = ivBest(d.id); if (b) text(L('md_best', b), x + iw, y, TH.dim, 1, 'right'); }
  drawBtn(DEP.btn.x, DEP.btn.y, DEP.btn.w, DEP.btn.h, L('md_go', tr(d.nm)), true, c); ctx.restore(); ctx.globalAlpha = a0; };
