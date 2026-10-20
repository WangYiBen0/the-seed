// ===== TSW auto — 自动挂机 / autopilot =======================================
// Steers the player through the game's own public input state (Input, the same
// object the engine's listeners write) from a beforeTick hook — no game file is
// touched.  Modes:
//   combat — fight & loot in the current floor, no purchases
//   full   — explore (BFS over the room graph), fight, loot, heal, shop,
//            pick serums per policy, take the endless portal, auto-restart
// Policies score serum cards differently (balanced / offense / bloom / survival).
'use strict';
(function () {
  const TSW = window.__TSW; if (!TSW || TSW.auto) return;

  const A = TSW.auto = {
    mode: TSW.settings.get('autoMode', 'off'),        // off | combat | full
    policy: TSW.settings.get('autoPolicy', 'bloom'),  // balanced | offense | bloom | survival
    opts: {
      autoCards: TSW.settings.get('autoCards', true),
      autoRestart: TSW.settings.get('autoRestart', true),
      preferEndless: TSW.settings.get('preferEndless', true),
      shop: TSW.settings.get('autoShop', true),
      forge: TSW.settings.get('autoForge', true),
      dash: TSW.settings.get('autoDash', true),
    },
    status: { note: '', target: null },
  };
  const set = (k, v) => { A.opts[k] = v; TSW.settings.set(k, v); };
  A.setMode = (m) => { A.mode = m; TSW.settings.set('autoMode', m); TSW.bus.emit('auto'); };
  A.setPolicy = (p) => { A.policy = p; TSW.settings.set('autoPolicy', p); TSW.bus.emit('auto'); };

  // ---------------- scoring tables ----------------
  const RARW = [1, 2.2, 3.2, 4.2];
  // per-policy shard weights (default 1)
  const POLICY_W = {
    balanced: { heavy: 1.6, frenzy: 1.6, keen: 1.4, fork: 1.6, needle: 1.3, rime: 1.2, ember: 1.2, vital: 1.2, plate: 1.2, bloom: 1.3, big: 1.2, leech: 1.2 },
    offense: { keen: 2, heavy: 2, frenzy: 2, overk: 2.2, fork: 1.8, echo: 1.6, needle: 1.5, focus: 1.4, guill: 1.5, big: 1.5, moment: 1.2, rico: 1.3, seeker: 1.2, lastround: 1.3, primed: 1.3, glass: 1.4 },
    bloom: { bloom: 3, shrap: 2.6, fury: 1.8, leech: 1.8, fork: 1.7, echo: 1.4, frenzy: 1.5, heavy: 1.3, keen: 1.2, rime: 1.1, ember: 1.1, big: 1.3, stat: 1.2, drone: 1.2, plate: 1.2, vital: 1.1 },
    survival: { plate: 2.4, vital: 2.4, leech: 2, quick: 1.4, spite: 1.4, swift: 1.3, after: 1.2, frenzy: 1.2, heavy: 1.2, keen: 1.2 },
    // 暴击狙击：mark+keen→omen（标记暴击×1.5）、allin+keen→jackpot、farshot+expose→sniper/hawkeye
    crit: { keen: 2.6, mark: 2.4, heavy: 1.8, frenzy: 1.8, allin: 1.4, farshot: 1.6, expose: 1.5, focus: 1.3, guill: 1.3, lastround: 1.3, big: 1.2, moment: 1.1, needle: 1.2, glass: 1.3 },
    // 元素侵蚀：四元素+prism，caustic/plasma/shatter 群体协同，高频低伤武器上元素最快
    dot: { ember: 2.2, venom: 2.2, arc: 1.8, rime: 1.8, prism: 2.4, keen: 1.1, seeker: 1.2, stat: 1.2, plate: 1.2, vital: 1.2, leech: 1.2, quick: 1.2 },
    // 近战斩击：needle/rico/lead→wreck（弹射长大）、guill 处决、moment 走A打A
    melee: { needle: 2, rico: 1.8, lead: 1.6, guill: 2, moment: 1.6, echo: 1.4, overk: 1.4, swift: 1.4, heavy: 1.3, veil: 1.3, plate: 1.2, leech: 1.3, frac: 1.2 },
    // 伙伴军团：drone+fork→swarm 双发、volley+fork→firing 副手齐射、stat/sat 自动火力
    ally: { drone: 2.6, fork: 2.2, stat: 2, sat: 2, volley: 1.8, seeker: 1.3, frenzy: 1.2, heavy: 1.2, plate: 1.2, vital: 1.2, leech: 1.2 },
    // 弹药工程：热循环（hotb/overheat）、装填（quick/tactical/refit）、空尖（lastround/primed/rnova）
    ammo: { quick: 2.2, hotb: 2.2, lastround: 1.8, primed: 1.8, extmag: 1.6, tactical: 1.5, rnova: 1.5, refit: 1.4, veil: 1.2, bottomless: 1.6, frenzy: 1.3, plate: 1.1 },
    // 虚体闪避：veil+quick→phase、after+echo→phantom 残影、trail+ember→blaze 燃烧步态
    phase: { veil: 2.4, quick: 1.8, after: 2.2, echo: 1.8, trail: 1.8, swift: 1.6, spite: 1.4, hyper: 1.4, weave: 1.3, plate: 1.1, vital: 1.2 },
  };
  // weapon class preference per policy (higher = take it / buy it)
  const WEAPON_W = {
    balanced: { rail: 5, scatter: 5, lance: 4.5, volt: 4, bow: 4, nail: 3, twin: 3.5, rivet: 3.5, halo: 3, splinter: 3, edge: 3 },
    offense: { rail: 6, longshot: 6, scatter: 5.5, lance: 5, hammer: 5, bow: 4.5, crescent: 4.5, volt: 4, iai: 4, trident: 4 },
    bloom: { hail: 6, storm: 6, flamer: 5.5, twin: 5, splinter: 4.5, nail: 4, shuriken: 4, saw: 4, halo: 3.5, whirl: 4, hive: 3.5, frostbite: 4 },
    survival: { hammer: 5, whirl: 4.5, edge: 4, fist: 4, graviton: 4, mines: 4, halo: 3.5, shuriken: 3.5 },
    crit: { rail: 6, longshot: 6, trident: 5, scatter: 5, crescent: 4.5, lance: 4.5, bow: 4, rivet: 4, slug: 4, harpoon: 3.5, flechette: 3.5 },
    dot: { flamer: 6, frostbite: 5.5, helix: 5, splinter: 5, hive: 4.5, gas: 4.5, volt: 4, nail: 3.5, prism: 4, twin: 4 },
    melee: { edge: 5.5, lance: 5.5, whirl: 5, hammer: 5, iai: 5, scythe: 5, axe: 4.5, chainsaw: 4.5, baton: 4, flail: 4, fist: 4, crescent: 3.5 },
    ally: { hail: 5, splinter: 5, twin: 4.5, hive: 4.5, summon: 4.5, deploy: 4, nail: 3.5, shuriken: 3.5, storm: 4 },
    ammo: { storm: 6, flamer: 5.5, prism: 5, hail: 5, splinter: 4.5, rivet: 4, twin: 4, flak: 4, nail: 3.5 },
    phase: { shuriken: 5.5, mirage: 5, halo: 4.5, saw: 4.5, carom: 4.5, crescent: 4, bolas: 4, whirl: 3.5, hive: 3.5 },
  };
  const wScore = (id) => (WEAPON_W[A.policy] && WEAPON_W[A.policy][id]) || 2.5;
  const CURSE_RANK = { greed: 0, hubris: 1, wrath: 2, surr: 3, seal: 4, coward: 5, sloth: 6, disaster: 7, time: 8, over: 9, tremor: 10, drought: 11 };

  function scoreShard(id, lv) {
    if (typeof SHARD === 'undefined') return 0; const s = SHARD[id]; if (!s) return 0;
    let v = RARW[s.rar] || 1;
    v *= (POLICY_W[A.policy] && POLICY_W[A.policy][id]) || 1;
    // stacking beyond lv2 gives diminishing value for most, but bloom chains want max levels
    if (lv >= 2) v *= (id === 'bloom' || id === 'shrap' || id === 'keen' || id === 'heavy' || id === 'frenzy') ? 1.1 : .8;
    // synergy hint: completing a pair is worth a lot
    try { if (typeof synergyHint === 'function' && synergyHint(id)) v *= 1.8; } catch (e) { }
    // never make yourself squishier while idle
    if (id === 'glass') v *= A.mode === 'full' ? .4 : 1;
    return v;
  }

  // ---------------- room graph ----------------
  let navCache = null;
  function graph() {
    const G = __achroma.G;
    if (navCache && navCache.rid === G.rid && navCache.floor === G.floor) return navCache;
    const rooms = WORLD.rooms, adj = {}, doorOf = {};
    rooms.forEach((r) => { adj[r.id] = []; });
    for (const r of rooms) for (const [gx, gy] of r.doors) {
      const dx = Math.sign(gx - r.cx), dy = Math.sign(gy - r.cy);
      for (let step = 1; step <= 10; step++) {
        const tx = gx + dx * step, ty = gy + dy * step;
        const other = roomAt(tx * 16 + 8, ty * 16 + 8);
        if (other && other.id !== r.id) {
          if (!adj[r.id].includes(other.id)) { adj[r.id].push(other.id); adj[other.id].push(r.id); doorOf[r.id + ':' + other.id] = [gx * 16 + 8, gy * 16 + 8]; doorOf[other.id + ':' + r.id] = [gx * 16 + 8, gy * 16 + 8]; }
          break;
        }
      }
    }
    return navCache = { rid: G.rid, floor: G.floor, adj, doorOf, rooms };
  }
  function bfsPath(fromId, toId) {
    const { adj } = graph();
    if (fromId === toId) return [toId];
    const prev = { [fromId]: -1 }, q = [fromId];
    while (q.length) { const cur = q.shift(); for (const n of adj[cur] || []) if (!(n in prev)) { prev[n] = cur; if (n === toId) { const path = [n]; let c = n; while (prev[c] !== -1) { c = prev[c]; path.unshift(c); } return path; } q.push(n); } }
    return null;
  }

  // ---------------- helpers ----------------
  // the game's W/H are top-level `let` bindings (not on the window object) —
  // clamping against the wrong handle produced NaN, which the camera lerp
  // absorbed and blacked out the whole world pass (HUD kept drawing).
  const GW = () => (typeof W !== 'undefined' && isFinite(W)) ? W : 480;
  const GH = () => (typeof H !== 'undefined' && isFinite(H)) ? H : 270;
  const clampM = (v, hi) => {
    hi = (typeof hi === 'number' && isFinite(hi)) ? hi : 480;
    if (!isFinite(v)) v = hi / 2;
    return Math.max(1, Math.min(hi - 1, v));
  };
  const clickAt = (x, y) => { Input.mx = x; Input.my = y; Input.clicked = true; };
  const exclList = (k) => { const v = TSW.settings.get(k, []); return Array.isArray(v) ? v : []; };
  const excluded = (id) => exclList('serumExclude').includes(id);
  // BFS over the tile grid: real path around walls/pits instead of random wiggling
  function gridPath(p, tx, ty) {
    if (typeof WORLD === 'undefined' || !WORLD || !WORLD.tiles || typeof TL === 'undefined') return null;
    const Wd = WORLD.w, Ht = WORLD.h, tiles = WORLD.tiles;
    const okT = (gx, gy) => { if (gx < 0 || gy < 0 || gx >= Wd || gy >= Ht) return false; const t = tiles[gy * Wd + gx]; return t === TL.FLOOR || t === TL.SLUDGE; };
    const sx = Math.floor(p.x / 16), sy = Math.floor(p.y / 16);
    const gx2 = Math.floor(tx / 16), gy2 = Math.floor(ty / 16);
    if (!okT(sx, sy) || !okT(gx2, gy2)) return null;
    const start = sy * Wd + sx, goal = gy2 * Wd + gx2;
    if (start === goal) return [];
    const prev = new Map([[start, start]]);
    const q = [start];
    while (q.length) {
      const cur = q.shift();
      if (cur === goal) break;
      const cx = cur % Wd, cy = (cur / Wd) | 0;
      for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + d[0], ny = cy + d[1];
        if (!okT(nx, ny)) continue;
        const ni = ny * Wd + nx;
        if (prev.has(ni)) continue;
        prev.set(ni, cur); q.push(ni);
      }
    }
    if (!prev.has(goal)) return null;
    const path = []; let cur = goal;
    while (cur !== start) { path.push([(cur % Wd) * 16 + 8, ((cur / Wd) | 0) * 16 + 8]); cur = prev.get(cur); }
    path.reverse(); return path;
  }
  // dash only when the dash arc does not end inside a pit
  function dashSafe(p, dx, dy) {
    const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    for (let d = 10; d <= 56; d += 8) {
      const t = tileAtPx(p.x + dx * d, p.y + dy * d);
      if (t === TL.PIT) {
        let land = -1;
        for (let e = d + 8; e <= 62; e += 8) { const t3 = tileAtPx(p.x + dx * e, p.y + dy * e); if (t3 !== TL.PIT && t3 !== TL.VOID) { land = e; break; } }
        if (land < 0 || land > 56) return false;
      }
    }
    return true;
  }

  function isMelee(id) { const w = WEAPONS[id]; return w && ['melee', 'thrust', 'spin', 'whip', 'slam', 'iai', 'fist', 'reap'].includes(w.kind); }
  function nearestEnemy(x, y, maxD, needLos) {
    let best = null, bd = maxD;
    for (const e of __achroma.G.enemies) { if (e.dead || e.spawnT > 0) continue; const d = dist(x, y, e.x, e.y); if (d < bd && (!needLos || los(x, y, e.x, e.y))) { bd = d; best = e; } }
    return best;
  }
  // ---------- threat field ----------
  // The game exposes inMech(m, x, y) — its own hit test for EVERY telegraph type
  // (circle/seg/rect/cone/donut/cells/…).  Combined with bullet trajectory
  // prediction this one function powers the whole avoidance logic.
  function mechDanger(m) {
    const warn = m.warn || 0;
    if (warn >= 90) return .55;                       // lingering hazard (wet ink …)
    if (m.t >= warn) return 0;                        // already resolved
    return 1 + 2.5 * Math.max(0, Math.min(1, 1 - (warn - m.t) / .6)); // about to fire = worst
  }
  function spotDanger(x, y, p) {
    const G = __achroma.G; let d = 0;
    const h = hard(), horizon = h ? .95 : .7, wMul = h ? 1.3 : 1;
    if (typeof inMech === 'function' && G.mechs) for (const m of G.mechs) {
      const w = mechDanger(m); if (!w) continue;
      let inside = false;
      try { inside = !!inMech(m, x, y); } catch (e) { }
      if (inside) d += 2.2 * w * wMul;
    }
    for (const b of G.ebullets) {                     // closest-approach prediction
      const sp2 = b.vx * b.vx + b.vy * b.vy; if (sp2 < 25) continue;
      const t = ((x - b.x) * b.vx + (y - b.y) * b.vy) / sp2;
      if (t < -.05 || t > horizon) continue;
      const bt = Math.max(0, t);
      const miss = Math.hypot(x - (b.x + b.vx * bt), y - (b.y + b.vy * bt));
      const rr = (b.r || 3) + p.r + 3;
      if (miss < rr) d += 2.4 * wMul * (1 - miss / rr) * (1.4 - Math.min(1.4, t));
    }
    for (const z of G.zones || []) if (dist(x, y, z.x, z.y) < (z.r || 18) + 3) d += 1.4;
    // pits: walking in hurts and teleports back — never path through them
    if (typeof TL !== 'undefined' && tileAtPx(x, y) === TL.PIT) d += 2.6;
    if (typeof TL !== 'undefined' && typeof spikeState === 'function' && tileAtPx(x, y) === TL.SPIKE && spikeState() === 2) d += 1.4;
    // gunners locking a shot: stay off the firing line before the bullet exists
    if (G.enemies) for (const e of G.enemies) {
      if (e.dead || e.spawnT > 0 || e.st !== 'aim') continue;
      const dxp = p.x - e.x, dyp = p.y - e.y, dE = Math.hypot(dxp, dyp);
      if (dE > 340 || dE < 1) continue;
      const ux = dxp / dE, uy = dyp / dE;
      const lx = x - e.x, ly = y - e.y;
      const along = lx * ux + ly * uy;
      if (along < 0) continue;
      const lat = Math.abs(lx * uy - ly * ux);
      if (lat < 15 && along < dE + 70) d += 1.7;
    }
    return d;
  }
  // choose the walk direction: alignment with "want", walls block, threats repel
  function pickDir(p, wx, wy) {
    const wl = Math.hypot(wx, wy); const ld = A._lastDir || [1, 0];
    let best = null, bestScore = -1e9;
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a);
      const nx = p.x + dx * 16, ny = p.y + dy * 16, fx = p.x + dx * 46, fy = p.y + dy * 46;
      let s;
      if (collides(nx, ny, p.r, false) || collides(fx, fy, p.r, false)) s = -8;
      else {
        s = wl > .1 ? 2.2 * (dx * wx + dy * wy) / wl : 0;
        s -= 2.0 * spotDanger(nx, ny, p) + .9 * spotDanger(fx, fy, p);
        s += .18 * (dx * ld[0] + dy * ld[1]);         // anti-jitter
      }
      if (s > bestScore) { bestScore = s; best = [dx, dy]; }
    }
    if (best) A._lastDir = best;
    return best || [0, 0];
  }
  const moveKeys = (dx, dy) => {
    Input.keys.KeyW = dy < -.3; Input.keys.KeyS = dy > .3; Input.keys.KeyA = dx < -.3; Input.keys.KeyD = dx > .3;
  };
  const stopMove = () => { Input.keys.KeyW = Input.keys.KeyS = Input.keys.KeyA = Input.keys.KeyD = false; };

  // ---------------- main per-tick driver ----------------
  let lastPos = { x: 0, y: 0, t: 0 };
  const navProg = { tgt: null, x: 0, y: 0, t: 0 };
  const wiggle = { dir: null, until: 0, n: 0 };
  A._taps = {};
  const hard = () => (typeof diffV === 'function') && diffV('mhp') >= 1.25;
  A._tick = 0;
  A._tapGap = {};
  TSW.trace = new URLSearchParams(location.search).has('trace');
  TSW.hooks.beforeTick(() => {
    // release one-frame taps from the previous tick (always, even when off)
    for (const c in A._taps) if (A._taps[c]) { Input.keys[c] = false; A._taps[c] = 0; }
    const G = window.__achroma && __achroma.G;
    if (!G || !G.p || A.mode === 'off') return;
    A._tick++;
    try { drive(G); } catch (e) { TSW.err('auto', e); A.status.note = 'err: ' + e.message; }
    if (TSW.trace && (++A._tick % 120 === 0)) {
      const p2 = G.p, foes = G.enemies ? G.enemies.filter((e) => !e.dead).length : 0;
      const act = typeof WORLD !== 'undefined' && WORLD.rooms ? WORLD.rooms.find((r) => r.active) : null;
      console.info('[TSW:auto]', JSON.stringify({ st: G.state, fl: G.floor, dep: G.endless | 0, t: (G.runT || 0) | 0, k: G.kills | 0, ink: G.ink | 0, hp: p2.hp, foes, act: act ? act.type : 0, tgt: A.status.target, note: A.status.note, x: p2.x | 0, y: p2.y | 0, mx: A._dbg ? A._dbg[0].toFixed(1) : 0, my: A._dbg ? A._dbg[1].toFixed(1) : 0, eb: G.ebullets.length, keys: ['KeyW', 'KeyA', 'KeyS', 'KeyD'].filter((k) => Input.keys[k]).join('') }));
    }
  });

  function drive(G) {
    const p = G.p;
    // edge-safe tap: the game detects key PRESSES (down && !prev-down).  Holding a
    // key across ticks (e.g. re-tapping Enter every frame on a dialog) presses it
    // exactly once and never again — so enforce >=1 released tick between taps.
    const tap = (c) => {
      if (A._tick - (A._tapGap[c] ?? -9) < 2) return;
      Input.keys[c] = true; A._taps[c] = 1; A._tapGap[c] = A._tick;
    };

    // first-run blockers: the mechanics-hint dialog and the name editor freeze the sim
    if (G.hintQ) { tap('ArrowRight'); tap('Enter'); A.status.note = '提示确认（否）'; return; }
    if (window.NAMEED && NAMEED.open) {
      try { if (!NAMEED.inp.value) NAMEED.inp.value = 'TSW'; nameEdConfirm(); A.status.note = '自动命名'; } catch (e) { }
      return;
    }

    switch (G.state) {
      case 'play': return drivePlay(G, p, tap);
      case 'cards': return A.opts.autoCards && driveCards(G, tap);
      case 'curse': return driveCurse(G, tap);
      case 'bossintro': if (G.introT > 1.1) Input.clicked = true; return;
      case 'dead':
      case 'win': {
        if (!A.opts.autoRestart || G.endT < 2.2) return;
        A.status.note = '重开一局…';
        if (typeof restartRun === 'function') { restartRun(); TSW.bus.emit('newRun'); A.status.note = ''; }
        return;
      }
      case 'pause': tap('Escape'); return;
      case 'build': tap('Tab'); return;
      case 'orbopen': case 'trans': case 'fusion': case 'launch': case 'menu': case 'intro': return;
    }
  }

  function driveCards(G, tap) {
    const cd = G.cards; if (!cd || cd.pick >= 0 || cd.t < .7) return;
    if (cd.skipT !== undefined || cd.ban) return;   // sieve animation in progress
    const ex = exclList('serumExclude'), prio = exclList('serumPriority');
    const hasSv = (typeof svData === 'function') ? svData() : { ban: 0, skip: 0 };
    const exIdx = cd.opts.map((id, i) => (ex.includes(id) ? i : -1)).filter((i) => i >= 0);
    // 定向洗掉: wash excluded offers out with the game's own sieve (排除/跳过)
    if (exIdx.length && (hasSv.ban > 0 || hasSv.skip > 0) && typeof svBtns === 'function' && typeof cardRect === 'function') {
      const allEx = exIdx.length === cd.opts.length;
      const btns = svBtns();
      const press = (x, y, note) => { clickAt(x, y); A.status.note = note; };
      if (allEx && hasSv.skip > 0) return press(btns[1].x + btns[1].w / 2, btns[1].y + btns[1].h / 2, '筛滤:跳过全部');
      if (hasSv.ban > 0) {
        if (!cd.banMode) return press(btns[0].x + btns[0].w / 2, btns[0].y + btns[0].h / 2, '筛滤:排除模式');
        const i = exIdx[0], r = cardRect(i);
        return press(r.x + 52, r.y + 104, '筛滤:排除 ' + cd.opts[i]);
      }
    }
    let best = -1, bestV = -1e9;
    cd.opts.forEach((id, i) => {
      let v = scoreShard(id, cd.lv ? cd.lv[i] : 1);
      if (ex.includes(id)) v -= 100;                      // 排除列表: last resort only
      if (v > bestV) { bestV = v; best = i; }
    });
    if (best < 0) return;
    if (bestV < 0) {                                      // forced: all options excluded → priority order
      for (const pid of prio) { const i = cd.opts.indexOf(pid); if (i >= 0) { best = i; break; } }
      A.status.note = '被迫选: ' + cd.opts[best];
    }
    tap('Digit' + (best + 1));
  }

  function driveCurse(G, tap) {
    const q = G.curseQ; if (!q || q.pick >= 0 || q.t < 1.4) return;
    let best = -1, bestR = -1;
    q.opts.forEach((id, i) => { const r = CURSE_RANK[id] ?? 5; if (best < 0 || r < bestR) { bestR = r; best = i; } });
    if (best >= 0) tap('Digit' + (best + 1));
  }

  function drivePlay(G, p, tap) {
    const w = WEAPONS[p.weapons[p.wi]], melee = isMelee(w.id);
    const active = WORLD.rooms.find((r) => r.active);
    const foes = G.enemies.filter((e) => !e.dead && e.spawnT <= 0);
    const near = nearestEnemy(p.x, p.y, 900, false);
    A.status.note = '';

    // Teleport! freezes the whole simulation until a destination click lands
    if (G.tpPause) {
      const ne = near || foes[0];
      let tx = p.x + 60, ty = p.y;
      if (ne) { tx = ne.x; ty = ne.y; }                       // blink onto the nearest foe
      else { const a = Math.random() * 6.28; tx = p.x + Math.cos(a) * 90; ty = p.y + Math.sin(a) * 90; }
      Input.mx = clampM(tx - G.cam.x, GW()); Input.my = clampM(ty - G.cam.y, GH());
      Input.clicked = true;
      A.status.note = '瞬移…';
      return;
    }

    // ---------- interactions (E) ----------
    if (A.mode === 'full' && !active) {
      for (const it of G.inter) {
        const d = dist(p.x, p.y, it.x, it.y); if (d > 24) continue;
        if (it.kind === 'fount' && !it.used && p.hp < p.maxHp - 1 && !hasCurse('drought') && G.ink >= it.cost) { A.status.note = '治疗'; tap('KeyE'); break; }
        if (it.kind === 'chest' && !it.used) { A.status.note = '开箱'; tap('KeyE'); break; }
        if (it.kind === 'key' || it.kind === 'prism') break; // walk over
        if (it.kind === 'chip') { if (!p.skill || it.id !== 'teleport') { tap('KeyE'); break; } continue; }
        if (it.kind === 'weapon') { const cur = wScore(w.id), nw = wScore(it.id); if (nw > cur + .5 || p.weapons.length < wCap()) { A.status.note = '拿武器 ' + it.id; tap('KeyE'); } break; }
        if (it.kind === 'forge' && A.opts.forge) { const lv = p.wlv[w.id] || 0, cost = 30 + lv * 25; if (lv < 3 && G.ink >= cost + 15) { A.status.note = '锻造 +' + (lv + 1); tap('KeyE'); } break; }
        if (it.kind === 'shop' && A.opts.shop && !it.sold) {
          if (it.what === 'heart' && p.hp < p.maxHp && G.ink >= it.price) { tap('KeyE'); break; }
          if (it.what === 'shard' && G.ink >= it.price && !excluded(it.id) && scoreShard(it.id, (p.shards[it.id] || 0) + 1) >= 2) { tap('KeyE'); break; }
          if (it.what === 'weapon' && G.ink >= it.price && p.weapons.length < wCap() && wScore(it.id) > wScore(w.id) + .5) { tap('KeyE'); break; }
          if (it.what === 'chip' && G.ink >= it.price && !p.skill) { tap('KeyE'); break; }
          continue;
        }
        if (it.kind === 'portal') {
          if (it.endless && A.opts.preferEndless && G.time - it.born > .6) { A.status.note = '→ 无尽'; tap('KeyE'); break; }
          if (!it.endless && !G.endless && G.time - it.born > .6) { A.status.note = '→ 下一层'; tap('KeyE'); break; }
        }
        if (it.kind === 'seal' && G.hasKey) { tap('KeyE'); break; }
      }
    }

    // ---------- combat target & kite ----------
    let mx = 0, my = 0, wantFire = false;
    if (active || G.trial || near) {
      const ne = nearestEnemy(p.x, p.y, 900, false) || (G.boss && !G.boss.dead ? G.boss : null);
      // aim at the closest foe (screen coords = world - camera)
      if (ne) { Input.mx = clampM(ne.x - G.cam.x, GW()); Input.my = clampM(ne.y - G.cam.y, GH()); }
      if (ne) {
        const d = dist(p.x, p.y, ne.x, ne.y);
        // armor rhythm: with armor down, disengage for ~3.6s so it regenerates
        // (armor = 3 free hits in this game; lastHit > 3 starts the regen)
        const retreat = (p.armor <= 0 && p.lastHit < 3.6) || (p.hp <= 2 && p.armor <= 0);
        const bs = hard() ? 1.2 : 1;                    // harder difficulties keep more distance
        const band = (retreat ? [160, 240] : melee ? [30, 52] : [80, 150]).map((v) => Math.round(v * bs));
        const ux = (ne.x - p.x) / (d || 1), uy = (ne.y - p.y) / (d || 1);
        if (d < band[0]) { mx -= ux; my -= uy; }
        else if (d > band[1]) { mx += ux; my += uy; }
        else {                                           // strafe — sign persists per target (no spinning)
          if (A._strafeFor !== ne.id) { A._strafeFor = ne.id; A._strafeS = Math.random() < .5 ? 1 : -1; }
          mx += -uy * .6 * A._strafeS; my += ux * .6 * A._strafeS;
        }
        wantFire = d < (melee ? 90 : 400);
        if (wantFire && typeof los === 'function') wantFire = los(p.x, p.y, ne.x, ne.y); // don't spray walls
      }
      // doorway funnel: on hard difficulties, fight from the room's door —
      // enemies arrive one by one from a narrow arc instead of surrounding us.
      if (hard() && !melee && active && active.type === 'combat' && active.doors.length) {
        let bd = null, bdd = 1e9;
        for (const pair of active.doors) {
          const px = pair[0] * 16 + 8, py = pair[1] * 16 + 8, dd = dist(p.x, p.y, px, py);
          if (dd < bdd) { bdd = dd; bd = [px, py]; }
        }
        if (bd && bdd > 26 && bdd < 220) {
          mx += (bd[0] - p.x) / bdd * .9; my += (bd[1] - p.y) / bdd * .9;
          A.status.note = 'doorfunnel';
        }
      }
      // threat field does the dodging: bullets, telegraph circles/lines, void zones, spikes
      [mx, my] = pickDir(p, mx, my);
      // dash out when the current spot is about to hurt and the dash is up (never into a pit)
      const dirdash = () => { const l = Math.hypot(mx, my) || 1; return dashSafe(p, mx / l, my / l); };
      if (A.opts.dash && p.dashCd <= 0 && spotDanger(p.x, p.y, p) >= (hard() ? 1.3 : 1.8) && dirdash()) tap('Space');
      if (A.opts.dash && ne && dist(p.x, p.y, ne.x, ne.y) < 26 && p.dashCd <= 0 && dirdash()) tap('Space');
      // proactive reload: a dry mag triggers the passive reload (SLOTH curse: 1 dmg each)
      if (usesAmmo(w)) {
        const a = ammoOf(p, w.id), cap = magSize(w) || 1;
        const sloth = hasCurse('sloth');
        const low = a.n <= Math.max(1, Math.round(cap * (sloth ? .45 : .2)));
        const safeish = sloth || !nearestEnemy(p.x, p.y, 140, false);
        if (a.rl <= 0 && p.dashT <= 0 && (a.n <= 0 || (low && safeish))) tap('KeyR');
      }
      // cast the skill chip whenever it is up (E with no prompt casts)
      if (p.skill && !p.skillOn && p.skillCd <= 0 && (active || G.trial || near) && !G.prompt) tap('KeyE');
    }

    // ---------- navigation (no active fight) ----------
    if (!active && !G.trial && A.mode === 'full') {
      const tgt = pickObjective(G, p);
      if (tgt) {
        const path = navPath(G, p, tgt.room ? tgt.room.id : null);
        let wp = tgt.pt;
        if (path && path.length > 1) { const { doorOf } = graph(); const key = path[0] + ':' + path[1]; wp = doorOf[key] || tgt.pt; }
        if (wp) {
          const dx = wp[0] - p.x, dy = wp[1] - p.y, dl = Math.hypot(dx, dy);
          // 破甲后在门口等甲回满再进下一个战斗房（HARD+ 是生死差）
          if (tgt.label === 'fight' && p.armor < p.maxArmor - 1 && p.lastHit > 1 && dl < 90) {
            mx = 0; my = 0; A.status.note = '等甲恢复 ' + p.armor + '/' + p.maxArmor;
          } else if (dl > 12) { [mx, my] = pickDir(p, dx, dy); }
          // stuck on this objective? bench it for a while so the run keeps moving
          if (navProg.tgt === tgt.room && G.time - navProg.t > 6 && Math.hypot(p.x - navProg.x, p.y - navProg.y) < 40) { benchFor(tgt.room || tgt.pt, 30); navProg.t = G.time; }
          else if (navProg.tgt !== tgt.room) { navProg.tgt = tgt.room; navProg.x = p.x; navProg.y = p.y; navProg.t = G.time; }
          else if (Math.hypot(p.x - navProg.x, p.y - navProg.y) > 40) { navProg.x = p.x; navProg.y = p.y; navProg.t = G.time; }
          A.status.target = tgt.label;
          A._lastWp = wp;
        }
      }
    } else A.status.target = null;

    // stuck? first try REAL pathfinding to the last waypoint; wiggle is the last resort
    if (Math.abs(p.x - lastPos.x) + Math.abs(p.y - lastPos.y) < 2) {
      if (G.time - lastPos.t > 1.2) {
        lastPos.t = G.time;
        let handled = false;
        if (A._lastWp) {
          const path = gridPath(p, A._lastWp[0], A._lastWp[1]);
          if (path && path.length) {
            for (const node of path) { if (dist(p.x, p.y, node[0], node[1]) > 14) { const l = Math.hypot(node[0] - p.x, node[1] - p.y) || 1; mx = (node[0] - p.x) / l; my = (node[1] - p.y) / l; handled = true; break; } }
            A.status.note = '寻路绕行';
          }
        }
        if (!handled) {  // no path: wiggle in a committed direction, dash through (pit-safe)
          if (!wiggle.dir || wiggle.until < G.time) {
            const a = Math.random() * Math.PI * 2;
            wiggle.dir = [Math.cos(a), Math.sin(a)]; wiggle.until = G.time + 1.2;
            wiggle.n = (wiggle.n || 0) + 1;
            if (wiggle.n >= 3) { if (navProg.tgt) benchFor(navProg.tgt, 30); navCache = null; wiggle.n = 0; }
          }
          if (wiggle.dir && wiggle.until > G.time) [mx, my] = wiggle.dir;
          const l = Math.hypot(mx, my) || 1;
          if ((mx || my) && p.dashCd <= 0 && dashSafe(p, mx / l, my / l)) tap('Space');
        }
      }
    } else { lastPos = { x: p.x, y: p.y, t: G.time }; wiggle.n = 0; }

    moveKeys(mx, my);
    A._dbg = [mx, my];
    Input.down = !!wantFire && A.mode !== 'off';
  }

  // choose the next room/point to walk to
  function pickObjective(G, p) {
    const rooms = WORLD.rooms;
    // 1) loose pickups: prisms / keys (skip ones we failed to reach recently)
    for (const it of G.inter) if ((it.kind === 'prism' || it.kind === 'key') && !unreachable(it)) return { pt: [it.x, it.y], label: it.kind, room: roomAt(it.x, it.y) };
    // 1b) weapon/chip drops on the floor worth walking to
    let bw = null, bwd = 1e9;
    for (const it of G.inter) {
      if (it.kind !== 'weapon' && it.kind !== 'chip') continue;
      if (unreachable(it)) continue;
      const want = it.kind === 'chip' ? (!p.skill || it.id !== 'teleport')
        : (p.weapons.length < wCap() || wScore(it.id) > wScore(p.weapons[p.wi]) + .5);
      if (!want) continue;
      const d = dist(p.x, p.y, it.x, it.y); if (d < bwd) { bwd = d; bw = it; }
    }
    if (bw) return { pt: [bw.x, bw.y], label: bw.kind, room: roomAt(bw.x, bw.y) };
    // 1c) forge when the current weapon can still be upgraded and we can pay
    for (const r of rooms) {
      if (r.type !== 'forge' || unreachable(r)) continue;
      const cur = p.weapons[p.wi], lv = p.wlv[cur] || 0;
      if (lv < 3 && G.ink >= 30 + lv * 25 + 10) return { pt: [r.cx * 16 + 8, r.cy * 16 + 8], label: 'forge', room: r };
    }
    const boss = rooms.find((r) => r.type === 'boss');
    // 2) boss room once unlocked (or never locked)
    if (boss && !boss.cleared && (!WORLD.bossLocked || G.hasKey) && !unreachable(boss)) return { pt: [boss.cx * 16 + 8, boss.cy * 16 + 8], label: 'boss', room: boss };
    // 3) nearest unvisited combat room
    let best = null, bd = 1e9;
    for (const r of rooms) {
      if (r.type === 'combat' && !r.cleared && !r.active && !unreachable(r)) { const d = dist(p.x, p.y, r.cx * 16 + 8, r.cy * 16 + 8); if (d < bd) { bd = d; best = r; } }
    }
    if (best) return { pt: [best.cx * 16 + 8, best.cy * 16 + 8], label: 'fight', room: best };
    // 4) specials worth a detour (policy: shop on)
    if (A.opts.shop) for (const r of rooms) if (!r.visited && ['treasure', 'shop', 'camp', 'dialysis', 'barracks'].includes(r.type) && !unreachable(r)) return { pt: [r.cx * 16 + 8, r.cy * 16 + 8], label: r.type, room: r };
    for (const r of rooms) if (!r.visited && ['forge', 'shrine'].includes(r.type) && !unreachable(r)) return { pt: [r.cx * 16 + 8, r.cy * 16 + 8], label: r.type, room: r };
    // 5) fallback: boss room or any unvisited room
    if (boss && !unreachable(boss)) return { pt: [boss.cx * 16 + 8, boss.cy * 16 + 8], label: 'boss?', room: boss };
    for (const r of rooms) if (!r.visited && !unreachable(r)) return { pt: [r.cx * 16 + 8, r.cy * 16 + 8], label: 'explore', room: r };
    return null;
  }

  // things the autopilot failed to reach get benched for a while so it keeps moving
  const bench = new Map();
  function unreachable(t) { const until = bench.get(t); if (until && G_time() < until) return true; if (until) bench.delete(t); return false; }
  const G_time = () => (window.__achroma && __achroma.G ? __achroma.G.time : 0);
  const benchFor = (t, sec) => bench.set(t, G_time() + sec);

  function navPath(G, p, targetRoomId) {
    if (targetRoomId == null) return null;
    // rebuild the graph periodically: doors/locks change and stale paths cause wall-hugging
    if (navCache && G.time - navCache.at > 3) navCache = null;
    const cur = roomAt(p.x, p.y); if (!cur) return null;
    if (cur.id === targetRoomId) return [cur.id];
    return bfsPath(cur.id, targetRoomId);
  }

  TSW.log('auto module ready');
})();
