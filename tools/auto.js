// ===== TSW auto — 自动挂机 / autopilot =======================================
// Steers the player through the game's own public input state (Input, the same
// object the engine's listeners write) from a beforeTick hook — no game file is
// touched.  Modes:
//   combat — fight & loot in the current floor, no purchases
//   full   — explore (BFS over the room graph), fight, loot, heal, shop,
//            pick serums per policy, take the endless portal, auto-restart
// Policies = the game's own 12 invasion preferences; each reweights serum/weapon picks.
'use strict';
(function () {
  const TSW = window.__TSW; if (!TSW || TSW.auto) return;

  const A = TSW.auto = {
    mode: TSW.settings.get('autoMode', 'off'),        // off | combat | full
    policy: TSW.settings.get('autoPolicy', 'rounded'),  // 12 个入侵偏好之一，见 POLICY_W
    opts: {
      autoCards: TSW.settings.get('autoCards', true),
      autoRestart: TSW.settings.get('autoRestart', true),
      preferEndless: TSW.settings.get('preferEndless', true),
      shop: TSW.settings.get('autoShop', true),
      forge: TSW.settings.get('autoForge', true),
      dash: TSW.settings.get('autoDash', true),
      noFire: false,                                       // dodge-bench stress mode: never shoot
      // ---- fine-grained "wire it up" switches (panel: 挂机 → 细项) ----
      chest: TSW.settings.get('autoChest', true),          // open chests
      labSerum: TSW.settings.get('autoLabSerum', true),    // inject the experimental serum in the lab
      fount: TSW.settings.get('autoFount', true),          // drink from healing founts
      weaponPick: TSW.settings.get('autoWeaponPick', true),// walk to floor weapons / take better ones
      chipPick: TSW.settings.get('autoChipPick', true),    // pick skill chips
      pickups: TSW.settings.get('autoPickups', true),      // prisms & keys
      arsenal: TSW.settings.get('autoArsenal', true),      // visit the armory rack
      dialysis: TSW.settings.get('autoDialysis', true),    // use the dialysis machine to purge a curse
      // ---- 战斗动作开关（用户要求可逐项禁用） ----
      skill: TSW.settings.get('autoSkill', true),          // cast the skill chip (E)
      reload: TSW.settings.get('autoReload', true),        // active reload to dodge the passive-reload damage
      partner: TSW.settings.get('autoPartner', true),      // radio partner skill (KeyF)
      weaponSwap: TSW.settings.get('autoWeaponSwap', true),// swap to the sidearm during a reload
      mate: TSW.settings.get('autoMate', true),            // recruit survivors at camp fires
      dashHazards: TSW.settings.get('autoDashHazards', true), // refuse dashes into hazards/void
      navFallback: TSW.settings.get('autoNavFallback', true), // break out of zero-movement wedges
      invadeCircle: true,                                    // invade: circulate instead of straight backoff
      invadeShop: TSW.settings.get('autoInvadeShop', true),  // invade: buy between waves
      invadeCombine: TSW.settings.get('autoInvadeCombine', true), // invade: merge duplicate weapons
      invadeLvStyle: 'dps',                                   // invade: 'dps' | 'tank' upgrade order
      invadeShopStyle: 'weapon',                             // invade: 'weapon' | 'dps' (weapon-only measured better, CI-confirmed)
      invadeSell: TSW.settings.get('autoInvadeSell', true),   // invade: sell the weakest weapon when slots are full
      invadeSets: true,                                      // invade: prefer weapons that complete a set
      invadeDupStyle: 'normal',                              // invade: 'normal' | 'strong' duplicate-weapon priority
      invadeEscape: TSW.settings.get('autoInvadeEscape', true), // invade: break toward the emptiest sector when surrounded
      exploreOrder: 'fight',                                  // explore: 'fight' | 'resources' (specials before combat rooms)
      forgeMode: 'held',                                     // explore: 'held' | 'any' (upgrade any equipped weapon)
      fightSM: false,                                        // explore: three-state combat machine (measured: not significant, -33s, so off by default)
      manual: TSW.settings.get('autoManual', true),        // yield the controls when the player steers
    },
    // evasion scorecard, accumulated per play tick (see the dodge benchmark)
    metrics: { ticks: 0, dangerSum: 0, hazard: 0, clearSum: 0, clearMin: 1e9, samples: [], dash: 0, navStall: 0, navReplan: 0 },
    status: { note: '', target: null },
  };
  const set = (k, v) => { A.opts[k] = v; TSW.settings.set(k, v); };
  A.metrics.reset = () => { const m = A.metrics; m.ticks = 0; m.dangerSum = 0; m.hazard = 0; m.clearSum = 0; m.clearMin = 1e9; m.samples = []; m.dash = 0; m.navStall = 0; m.navReplan = 0; };
  A.setMode = (m) => { A.mode = m; TSW.settings.set('autoMode', m); TSW.bus.emit('auto'); };
  A.setPolicy = (p) => { A.policy = p; TSW.settings.set('autoPolicy', p); TSW.bus.emit('auto'); };

  // ---------------- scoring tables ----------------
  const RARW = [1, 2.2, 3.2, 4.2];
  // ---- 12 个流派 = 入侵抵抗的 12 个偏好（名字取自游戏自身，实质由我们定义） ----
  // rounded 均衡适应 · brawler 近身搏击 · crazy 精准猛攻 · ranger 远距火力
  // mage 元素反应 · chunky 厚重生存 · old 稳守缓进 · lucky 幸运搜集
  // engineer 工程布防 · doctor 医疗续航 · mutant 快速蜕变 · loud 喧嚣引敌
  const POLICY_W = {
    // 均衡适应：什么都拿一点，优先能形成协同的通用卡
    rounded: { heavy: 1.5, frenzy: 1.5, keen: 1.4, fork: 1.5, needle: 1.3, rime: 1.2, ember: 1.2, vital: 1.2, plate: 1.2, bloom: 1.25, big: 1.2, leech: 1.2, echo: 1.2 },
    // 近身搏击：贴脸打，靠弹射/处决/走砍，血厚一点撑住近身交换
    brawler: { needle: 2, rico: 1.9, lead: 1.6, guill: 2.1, moment: 1.7, overk: 1.5, plate: 1.4, vital: 1.3, leech: 1.4, swift: 1.3, veil: 1.2 },
    // 精准猛攻：暴击/标记/全押，玻璃大炮但只吃精准武器
    crazy: { keen: 2.6, mark: 2.4, heavy: 1.8, frenzy: 1.9, allin: 1.5, focus: 1.4, guill: 1.4, lastround: 1.3, moment: 1.2, glass: 1.2, big: 1.2 },
    // 远距火力：拉远打，远距增伤 + 暴露标记，近身卡一律不碰
    ranger: { farshot: 2.4, expose: 1.8, keen: 1.8, mark: 1.6, heavy: 1.5, frenzy: 1.5, seeker: 1.4, focus: 1.3, needle: 0.6, moment: 0.6, guill: 0.8, plate: 1.1, vital: 1.1 },
    // 元素反应：四元素 + prism，靠状态叠伤与群体协同
    mage: { ember: 2.2, venom: 2.2, arc: 1.9, rime: 1.9, prism: 2.4, seeker: 1.3, stat: 1.2, keen: 1.1, plate: 1.2, vital: 1.2, leech: 1.2, quick: 1.2 },
    // 厚重生存：血上限/护甲/吸血，站桩打完再走
    chunky: { plate: 2.6, vital: 2.6, leech: 2.1, big: 1.4, frenzy: 1.2, heavy: 1.2, keen: 1.1, spite: 1.3, quick: 1.2 },
    // 稳守缓进：慢节奏，回血/护甲恢复优先，只打必打的房间
    old: { plate: 2.2, vital: 2.2, leech: 1.9, quick: 1.5, after: 1.4, swift: 1.3, spite: 1.3, veil: 1.2, frenzy: 1.2, heavy: 1.2 },
    // 幸运搜集：拾取/贪婪/赏金，靠经济与掉落滚雪球
    lucky: { greed: 2.4, bounty: 2.2, jackpot: 1.9, scrap: 1.8, perfect: 1.5, allin: 1.3, keen: 1.3, stat: 1.3, plate: 1.2, vital: 1.2, leech: 1.2 },
    // 工程布防：无人机/炮台/召唤物，自动火力为主
    engineer: { drone: 2.6, sat: 2.3, stat: 2, summon: 1.9, deploy: 1.7, fork: 1.6, seeker: 1.3, plate: 1.2, vital: 1.2, leech: 1.2 },
    // 医疗续航：吸血 + 上限 + 再生，打得慢但很难死
    doctor: { leech: 2.6, vital: 2.1, plate: 1.9, after: 1.5, spite: 1.4, quick: 1.3, heavy: 1.2, frenzy: 1.2, keen: 1.2 },
    // 快速蜕变：经验/成长类，早升级早滚雪球
    mutant: { stat: 2.3, greed: 1.8, keen: 1.5, frenzy: 1.5, heavy: 1.4, fork: 1.4, bloom: 1.3, echo: 1.3, plate: 1.1, vital: 1.2 },
    // 喧嚣引敌：全输出，靠更快的清怪速度抵消更密的波次
    loud: { frenzy: 2.3, heavy: 2.1, overk: 2, keen: 1.9, fork: 1.8, echo: 1.7, rico: 1.5, bloom: 1.4, big: 1.4, moment: 1.3, plate: 1.1 },
  };
  // weapon class preference per policy (higher = take it / buy it)
  const WEAPON_W = {
    rounded: { rail: 5, scatter: 5, lance: 4.5, volt: 4, bow: 4, twin: 3.5, rivet: 3.5, nail: 3, halo: 3, splinter: 3 },
    brawler: { edge: 5.5, lance: 5.5, whirl: 5, hammer: 5, iai: 5, scythe: 5, axe: 4.5, chainsaw: 4.5, flail: 4, fist: 4, baton: 4 },
    crazy: { rail: 6, longshot: 6, trident: 5, scatter: 5, slug: 4.5, crescent: 4.5, lance: 4.5, harpoon: 4, rivet: 4 },
    ranger: { rail: 6.5, longshot: 6.5, bow: 5.5, crossbow: 5.5, lance: 5, scatter: 4.5, slug: 4.5, trident: 4.5, edge: 1.5, fist: 1.5 },
    mage: { flamer: 6, frostbite: 5.5, helix: 5, splinter: 5, hive: 4.5, gas: 4.5, prism: 4.5, volt: 4, twin: 4 },
    chunky: { hammer: 5.5, whirl: 5, edge: 4.5, graviton: 4.5, mines: 4.5, halo: 3.5, shuriken: 3.5, saw: 4 },
    old: { hammer: 5, whirl: 4.5, edge: 4.5, graviton: 4, mines: 4, halo: 4, hammer: 5, shuriken: 3.5 },
    lucky: { shuriken: 5, carom: 4.5, hail: 4.5, splinter: 4.5, twin: 4, halo: 4, mirage: 4, saw: 4 },
    engineer: { summon: 6, deploy: 5.5, hive: 5, hail: 4.5, twin: 4.5, splinter: 4, storm: 4 },
    doctor: { edge: 4.5, lance: 4.5, crescent: 4.5, volley: 4, halo: 4, splinter: 4, hammer: 3.5, rivet: 3.5 },
    mutant: { storm: 5, hail: 5, flamer: 4.5, twin: 4.5, splinter: 4.5, nail: 4, hive: 4, volt: 4 },
    loud: { hail: 6, storm: 6, flamer: 5.5, whirl: 5, saw: 4.5, twin: 5, splinter: 4.5, hammer: 4.5 },
  };
  // ---- 最终稳定状态（面板 goal.*）：目标武器/技能/搭档，命中即加权 ----------
  const goal = (k) => {
    try { const st = TSW && TSW.settings; return (st && typeof st.get === 'function' ? st.get('goal.' + k, '') : '') || ''; }
    catch (e) { return ''; }
  };
  A.goal = { weapon: () => goal('weapon'), skill: () => goal('skill'), radio: () => goal('radio'), mate: () => goal('mate') };
  const GOAL_W = 1.9;                                  // how strongly a match pulls
  const wScore = (id) => {
    try {
      let v = (WEAPON_W[A.policy] && WEAPON_W[A.policy][id]) || 2.5;
      const g = A.goal && A.goal.weapon ? A.goal.weapon() : '';
      if (id && g && id === g) v += GOAL_W;             // target weapon wins ties
      return v;
    } catch (e) { return 2.5; }
  };
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
    const walkable = (gx, gy) => { if (gx < 0 || gy < 0 || gx >= Wd || gy >= Ht) return false; const t = tiles[gy * Wd + gx]; return t === TL.FLOOR || t === TL.SLUDGE; };
    // prefer routes that do not cross a live hazard; fall back to plain walkable
    // tiles when the only way through is past a blade/flame/pool.
    const hazardFree = (gx, gy) => hazardAt(gx * 16 + 8, gy * 16 + 8, 10, .3) < .9;
    const okT = (gx, gy) => walkable(gx, gy) && (A._plainPath === true || hazardFree(gx, gy));
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
    if (!prev.has(goal) && A._plainPath !== true) {           // one retry that ignores hazards
      A._plainPath = true;
      try { return gridPath(p, tx, ty); } finally { A._plainPath = false; }
    }
    if (!prev.has(goal)) return null;
    const path = []; let cur = goal;
    while (cur !== start) { path.push([(cur % Wd) * 16 + 8, ((cur / Wd) | 0) * 16 + 8]); cur = prev.get(cur); }
    path.reverse(); return path;
  }
  // dash only when the dash arc does not end inside a pit
  // a dash is 330px/s for ~.16s ≈ 52px.  Refuse the arc when ANY sample lands in
  // a pit, the void (tiles or boss zones) or an active hazard — the old version
  // only looked at pits, which is why we happily dashed into blades and acid.
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
    for (const e of __achroma.G.enemies) { if (e.dead || e.spawnT > 0 || e.deathFightLeft > 0 || e.inv > 0) continue; const d = dist(x, y, e.x, e.y); if (d < bd && (!needLos || los(x, y, e.x, e.y))) { bd = d; best = e; } }
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
  // ---- in-room hazards: rotating blades, flame pillars, poison pools ----------
  // blade: two arms, length R, angle a, angular speed va — the segment sweeps, so
  // we score the CURRENT and a short LOOK-AHEAD of each arm.
  // flame: a corridor along angle a; state 0 idle / 1 warning / 2 firing.
  // pool: a circle; it ticks damage every .5s.
  function segDist2(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
    return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
  }
  const HAZ_PAD = 5;                       // body radius allowance
  function hazardAt(x, y, pad, look) {
    try {
      return hazardAt_(x, y, pad === undefined ? 5 : pad, look === undefined ? .45 : look);
    } catch (e) { return 0; }              // never let the threat field throw
  }
  function hazardAt_(x, y, pad, look) {
    const Wd = (typeof WORLD !== 'undefined' && WORLD) || null;
    if (!Wd || !Wd.tiles) return 0;        // floor not built yet (right after launch)
    const G_ = (typeof __achroma !== 'undefined' && __achroma) ? __achroma.G : null;
    let d = 0;
    for (const t of Wd.traps || []) {
      if (t.kind === 'blade') {
        const RR = t.R || 30;
        // sweep the two arms over the look-ahead window
        for (let k = 0; k < 2; k++) {
          for (let w = 0; w <= look; w += look / 3) {
            const a = (t.a || 0) + (t.va || 0) * w + k * Math.PI;
            const ex = t.x + Math.cos(a) * RR, ey = t.y + Math.sin(a) * RR;
            const dd = segDist2(x, y, t.x, t.y, ex, ey);
            const hit = 3 + pad + (w > 0 ? 3 : 0);        // the future is slightly cheaper
            if (dd < hit) d = Math.max(d, 2.6 * (1 - dd / hit) + 1.1);
          }
        }
        // inside the swept disc is risky but not forbidden: a room with a blade
        // centre still has to be fought, so this is only a soft nudge.
        const dc = Math.hypot(x - t.x, y - t.y);
        if (dc < RR + 3 + pad) d = Math.max(d, .45 * (1 - dc / (RR + 3 + pad)) + .12);
      } else if (t.kind === 'flame') {
        const per = t.per || 4, fire = t.fire || .8, warn = t.warn || .5, L = t.L || 40;
        const ph = ((t.t || 0) + (.25)) % per;            // slight look-ahead bias
        const st = ph < per - warn - fire ? 0 : ph < per - fire ? 1 : 2;
        const L4 = t.L ? L * Math.min(1, Math.max(0, (ph - (per - fire)) * 6)) : L;
        if (st >= 1) {
          const len = st === 2 ? L4 : L;
          for (let w = 0; w <= 1; w += .5) {
            const a = (t.a || 0) + (t.va || 0) * w;
            const ex = t.x + Math.cos(a) * len, ey = t.y + Math.sin(a) * len;
            const dd = segDist2(x, y, t.x, t.y, ex, ey);
            const hit = (st === 2 ? 8 : 6) + pad;
            if (dd < hit) d = Math.max(d, (st === 2 ? 2.4 : 1.0) * (1 - dd / hit) + (st === 2 ? .9 : .25));
          }
        }
      }
    }
    // ---- enemy-created dynamic hazards: G.foeFx (acid pools, gas clouds, lobs) ----
    // These are NOT in WORLD.pools; they are per-instance objects with their own
    // update closure.  acidPool/gasCloud carry {x,y,R,life}; foeLob carries a
    // landing point + warnR while it is still in the air.
    for (const f of (G_ && G_.foeFx) || []) {
      if (f.R && f.life !== undefined) {                    // acidPool / gasCloud
        const rr = (f.R || 24) * (f.kind === 'gas' ? .8 : 1) + pad - 4;
        const dd = Math.hypot(x - f.x, y - f.y);
        if (dd < rr) d = Math.max(d, 1.9 * (1 - dd / rr) + .8);
      } else if (f.land && f.dur != null) {                  // foeLob in flight: its landing circle
        const k = Math.min(1, (f.t || 0) / f.dur);
        const rr = (f.warnR || 26) + pad - 2;
        const dd = Math.hypot(x - f.tx, y - f.ty);
        if (dd < rr) d = Math.max(d, (1.2 + 1.6 * k) * (1 - dd / rr) + .5);
      }
    }
    // ---- void zones (bosses' erase circles, chasm cells): lethal, never step in ----
    if (G_) for (const z of G_.zones || []) {
      const rr = (z.r || 24) + pad - 2;
      const dd = Math.hypot(x - z.x, y - z.y);
      if (dd < rr) d = Math.max(d, (z.warn > 0 && (z.t || 0) < z.warn ? 1.6 : 3.4) * (1 - dd / rr) + 1.2);
    }
    for (const q of Wd.pools || []) {
      const rr = (q.r || 18) + pad - 2;
      const dd = Math.hypot(x - q.x, y - q.y);
      if (dd < rr) d = Math.max(d, 1.6 * (1 - dd / rr) + .6);
    }
    return d;
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
    // in-room hazards (blades / flame pillars / poison pools)
    { const hz = hazardAt(x, y, Math.max(4, p.r - 1)); if (hz) d += hz; }
    // pits: walking in hurts and teleports back — never path through them
    if (typeof TL !== 'undefined' && tileAtPx(x, y) === TL.PIT) d += 2.6;
    if (typeof TL !== 'undefined' && tileAtPx(x, y) === TL.SPIKE && typeof spikeState === 'function') {
      const sv = spikeState(); if (sv === 2) d += 2.4; else if (sv === 1) d += .9;   // 2 = out, 1 = warning
    }
    // death-fight (绝境「死斗」修饰符): a foe with deathFightLeft > 0 cannot be
    // selected or shot, but it KEEPS dealing contact damage for 2s
    // (enemies.js:115 has no deathFightLeft filter).  So treat it as a pure
    // hazard: never aim at it, but push away from it.
    if (G.enemies) for (const e of G.enemies) {
      if (e.dead || !(e.deathFightLeft > 0) || e.spawnT > 0) continue;
      const rr = (e.r || 6) + p.r + 10;
      const dd = Math.hypot(x - e.x, y - e.y);
      if (dd < rr) d += 2.2 * (1 - dd / rr) + .9;
    }
    // gunners locking a shot: stay off the firing line before the bullet exists
    if (G.enemies) for (const e of G.enemies) {
      if (e.dead || e.spawnT > 0 || e.deathFightLeft > 0 || e.st !== 'aim') continue;
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
  // the worst-case clearance along a short ray: how far the closest bullet path
  // stays from this lane.  Maximising the MINIMUM clearance is what turns
  // "dodge the average" into "never get squeezed" — the 16-way version only
  // summed danger, so it happily picked a lane with one near-miss on each side.
  // the worst-case clearance along a short ray: how far the closest bullet path
  // stays from this lane.  Maximising the MINIMUM clearance is what turns
  // "dodge the average" into "never get squeezed" — the 16-way version only
  // summed danger, so it happily picked a lane with one near-miss on each side.
  function laneClear(p, dx, dy) {
    const G = __achroma.G, R = 46;
    let m = 40;
    for (const b of G.ebullets) {
      const cx = b.x - p.x, cy = b.y - p.y;
      if (Math.abs(cx) > 140 || Math.abs(cy) > 140) continue;
      const sp2 = b.vx * b.vx + b.vy * b.vy; if (sp2 < 25) continue;
      const t = ((p.x - b.x) * b.vx + (p.y - b.y) * b.vy) / sp2;
      if (t < -.05 || t > 1.05) continue;
      const bx = b.x + b.vx * Math.max(0, t), by = b.y + b.vy * Math.max(0, t);
      const lx = bx - p.x, ly = by - p.y;
      const along = lx * dx + ly * dy;
      if (along < 0 || along > R) continue;
      const lat = Math.abs(-lx * dy + ly * dx) - (b.r || 3) - p.r;
      if (lat < m) m = lat;
    }
    return Math.max(0, m);
  }
  // choose the walk direction: alignment with "want", walls block, threats repel.
  // 24 candidate angles, three sampling radii (the near ring dominates), then a
  // half-step refinement around the winner.
  function pickDir(p, wx, wy) {
    const wl = Math.hypot(wx, wy); const ld = A._lastDir || [1, 0];
    const RX = [18, 42, 70], RW = [2.0, 1.0, .5];
    // A direction is only truly unusable when the FIRST ring is inside geometry.
    // Everything else is a soft penalty — the old code returned -1e9 for *any*
    // blocked sample, so when the bot stood in a corner every candidate scored
    // -1e9, `bestA` fell back to 0 (due east) and it pressed into the wall and
    // never moved (measured: 9s frozen, seed 91).
    let blockedAll = true;
    const evalDir = (a) => {
      const dx = Math.cos(a), dy = Math.sin(a);
      const nx0 = p.x + dx * RX[0], ny0 = p.y + dy * RX[0];
      if (collides(nx0, ny0, p.r, false)) return -1e9;      // really cannot step
      blockedAll = false;
      let s = 0;
      for (let k = 0; k < 3; k++) {
        const nx = p.x + dx * RX[k], ny = p.y + dy * RX[k];
        if (collides(nx, ny, p.r, false)) { s -= 4 * RW[k]; continue; }
        s -= 1.8 * RW[k] * spotDanger(nx, ny, p);
      }
      if (wl > .1) s += 2.2 * (dx * wx + dy * wy) / wl;
      s += .18 * (dx * ld[0] + dy * ld[1]);          // anti-jitter
      s += 1.15 * Math.min(1.6, laneClear(p, dx, dy) / 26);
      return s;
    };
    const N = 24;
    let bestS = -1e9, bestA = 0;
    for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, v = evalDir(a); if (v > bestS) { bestS = v; bestA = a; } }
    const hstep = Math.PI / N / 2;
    for (const a of [bestA - hstep, bestA + hstep]) { const v = evalDir(a); if (v > bestS) { bestS = v; bestA = a; } }
    // Absolute fallback: if the first ring is blocked in every one of the 24
    // directions we are wedged.  Press the direction with the most open space
    // (probe out to 4 rings) instead of standing still.
    if (blockedAll) {
      let fbA = 0, fbFree = -1;
      for (let i = 0; i < N; i++) {
        const a = i / N * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a);
        let free = 0;
        for (let k = 1; k <= 4; k++) { if (collides(p.x + dx * 10 * k, p.y + dy * 10 * k, p.r, false)) break; free++; }
        if (free > fbFree) { fbFree = free; fbA = a; }
      }
      bestA = fbA;
      A.metrics.navStall = (A.metrics.navStall | 0) + 1;
    }
    const best = [Math.cos(bestA), Math.sin(bestA)];
    A._lastDir = best;
    return best;
  }
  // pick the dash direction: among the 16 arcs that are safe to land, take the one
  // that ends in the calmest spot (a dash is also our escape from a squeeze).
  function dashDir(p, prefer) {
    let best = null, bestScore = -1e9;
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a);
      if (!dashSafe(p, dx, dy)) continue;
      const ex = p.x + dx * 52, ey = p.y + dy * 52;
      let s = -spotDanger(ex, ey, p) - .8 * spotDanger(p.x + dx * 30, p.y + dy * 30, p)
        + .9 * Math.min(1.6, laneClear(p, dx, dy) / 26);
      const pl = Math.hypot(prefer[0], prefer[1]) || 1;
      s += .9 * (dx * prefer[0] + dy * prefer[1]) / pl;
      if (s > bestScore) { bestScore = s; best = [dx, dy]; }
    }
    return best;
  }
  // ---- input rotation the game applies to our keys -------------------------
  // The player vector is quantised to 8 directions from the keys, then the
  // REVERSE mech flips it, then the TREMOR curse (hp<=3) rotates it by
  // j = sin(t*2.1)*.32 + sin(t*5.3+1)*.16 (game.js:130).  We therefore choose the
  // key combo whose *post-rotation* direction matches what we want.
  const KEY8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const angDiff2 = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
  function tremorAngle() {
    const G = typeof __achroma !== 'undefined' && __achroma && __achroma.G; if (!G || !G.p) return 0;
    if (G.p.hp > 3 || typeof hasCurse !== 'function' || !hasCurse('tremor')) return 0;
    const t = G.time || 0;
    return Math.sin(t * 2.1) * .32 + Math.sin(t * 5.3 + 1) * .16;
  }
  function reverseOn() {
    const G = typeof __achroma !== 'undefined' && __achroma && __achroma.G;
    return !!(G && G.mechs && G.mechs.some((m) => m && m.type === 'reverse' && m.t > m.on));
  }
  A._own = { KeyW: false, KeyS: false, KeyA: false, KeyD: false };
  const setKeys = (kw, ks, ka, kd) => {
    Input.keys.KeyW = kw; Input.keys.KeyS = ks; Input.keys.KeyA = ka; Input.keys.KeyD = kd;
    A._own.KeyW = kw; A._own.KeyS = ks; A._own.KeyA = ka; A._own.KeyD = kd;
  };
  const moveKeys = (dx, dy) => {
    const l = Math.hypot(dx, dy); if (l < .06) { setKeys(false, false, false, false); return; }
    let want = Math.atan2(dy, dx) - tremorAngle();     // undo the terror/tremor rotation
    if (reverseOn()) want += Math.PI;                  // undo the reverse mech
    let best = 0, bd = 9;
    for (let i = 0; i < 8; i++) { const a = Math.atan2(KEY8[i][1], KEY8[i][0]); const d = Math.abs(angDiff2(a, want)); if (d < bd) { bd = d; best = i; } }
    const c = KEY8[best];
    setKeys(c[1] < 0, c[1] > 0, c[0] < 0, c[0] > 0);
  };
  const stopMove = () => setKeys(false, false, false, false);

  // ---- tile-level travel: BFS nodes as the *primary* steering target --------
  // The room graph only gets us to the right doorway; inside a room (pillars,
  // corners, pits) greedy steering can orbit forever.  So for any leg longer
  // than ~26px we follow real BFS nodes and let pickDir only do local avoidance.
  const travel = { path: null, goal: null, i: 0, t: 0 };
  function nextWaypoint(p, gx, gy) {
    const now = (typeof __achroma !== 'undefined' && __achroma && __achroma.G ? __achroma.G.time : 0) || 0;
    const stale = !travel.path || !travel.goal || now - travel.t > 1.4 ||
      Math.hypot(travel.goal[0] - gx, travel.goal[1] - gy) > 24 || travel.i >= (travel.path ? travel.path.length : 0);
    if (stale) {
      const path = gridPath(p, gx, gy);
      travel.path = (path && path.length) ? path : null;
      travel.goal = [gx, gy]; travel.i = 0; travel.t = now;
    }
    if (!travel.path) return null;
    // drop nodes we already cleared (reached, or now behind us)
    while (travel.i < travel.path.length - 1) {
      const n = travel.path[travel.i], nx = travel.path[travel.i + 1];
      const d = Math.hypot(n[0] - p.x, n[1] - p.y);
      const behind = ((nx[0] - p.x) * (n[0] - p.x) + (nx[1] - p.y) * (n[1] - p.y)) < 0;
      if (d > 18 && !behind) break;
      travel.i++; travel.adv = now;
    }
    // carrot: aim at the FURTHEST node within 64px, not the next tile.  Aiming
    // 20px ahead makes pickDir's heading term meaningless and the bot stalls.
    let pick = travel.path[travel.i], bestD = -1;
    for (let k = travel.i; k < travel.path.length; k++) {
      const n = travel.path[k];
      const d = Math.hypot(n[0] - p.x, n[1] - p.y);
      if (d > 64) break;
      if (d > bestD) { bestD = d; pick = n; }
    }
    return pick;
  }

  // ---------------- main per-tick driver ----------------
  let lastPos = { x: 0, y: 0, t: 0 };
  const navProg = { tgt: null, x: 0, y: 0, t: 0 };
  const wiggle = { dir: null, until: 0, n: 0 };
  A._taps = {};
  const hard = () => (typeof diffV === 'function') && diffV('mhp') >= 1.25;
  A._tick = 0;
  A._tapGap = {};
  A._pickTries = new Map();
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

  // ---- the game's picker overlay: walk the selection to the best row, confirm.
  // Weapon racks (the update's armory) are scored with the same table as card
  // picks; for any other list we keep the current value, or cancel — never make
  // a blind choice.  Every key goes through the edge-safe tap().
  function drivePicker(tap) {
    const o = (typeof OVL !== 'undefined' && OVL.o) || {}, items = o.items || [], n = items.length;
    if (!n) { tap('Escape'); A.status.note = '关闭选择框'; return; }
    const cur = G.p && G.p.weapons ? G.p.weapons[G.p.wi] : null;
    let want = -1;
    if (items.every((it) => WEAPONS[it.v])) {
      // armory rack: take the best weapon we do not already carry better
      let best = -1, bestId = null;
      for (const it of items) { const s = wScore(it.v); if (it.v !== cur && s > best) { best = s; bestId = it.v; } }
      const cs = cur && WEAPONS[cur] ? wScore(cur) : -1e9;
      if (bestId && best > cs + .5) want = items.findIndex((it) => it.v === bestId);
      else if (cur) want = items.findIndex((it) => it.v === cur);
      if (want < 0) want = 0;
      A.status.note = '军械库选武器 ' + items[want].v;
    } else if (o.cur !== undefined && items.some((it) => it.v === o.cur)) {
      want = items.findIndex((it) => it.v === o.cur);   // keep the current value
      A.status.note = '选择框：保持当前项';
    } else {
      A.status.note = '关闭选择框';
      tap('Escape');
      return;
    }
    const sel = typeof OVL.sel === 'number' ? OVL.sel : 0;
    if (sel === want) { tap('Enter'); return; }
    const down = (want - sel + n) % n;
    tap(down <= n - down ? 'KeyS' : 'KeyW');
  }

  // which curse is worth paying 1 max armor to be rid of (higher = worse for us)
  const CURSE_W = { night: 9, tremor: 8, surr: 6, wrath: 6, sloth: 5, lung: 5, drought: 4, reject: 4, seal: 3, slow: 3, disaster: 3, over: 2, greed: 2, hubris: 2, coward: 2, time: 2 };
  // the dialysis machine (floors 5/15/45/75): free once, removes ONE serum or ONE
  // curse for 1 max armor.  Removing a serum is a loss, so we only ever purge a
  // curse — and only when we actually carry one.
  function driveDialysis(G, tap) {
    const D = (typeof DIA !== 'undefined') ? DIA : null;
    if (!D) { tap('Escape'); return; }
    const curses = (G.curses || []).slice();
    const canPay = ((G.p && G.p.maxArmor) | 0) >= 1;
    if (!D.mode) {                                        // the two-option menu: 0 serum, 1 curse
      if (!A.opts.dialysis || !curses.length || !canPay) { tap('Escape'); A.status.note = '透析：不用'; return; }
      if ((D.sel | 0) !== 1) { tap('KeyW'); A.status.note = '透析：选“诅咒”'; return; }
      tap('Enter'); A.status.note = '透析：打开诅咒列表'; return;
    }
    const ids = (typeof diaIds === 'function' ? diaIds() : curses).slice();
    if (!ids.length) { tap('Escape'); return; }
    let best = 0, bw = -1;
    for (let i = 0; i < ids.length; i++) { const w = CURSE_W[ids[i]] != null ? CURSE_W[ids[i]] : 2; if (w > bw) { bw = w; best = i; } }
    const sel = D.sel | 0;
    if (sel !== best) { tap(best > sel ? 'KeyD' : 'KeyA'); A.status.note = '透析：选 ' + ids[sel]; return; }
    tap('Enter'); A.status.note = '透析：清除 ' + ids[best];
  }
  // the lab serum question: inject (sel 0) or walk away (sel 1).  Without this
  // the modal freezes the run — it was a genuine soft-lock before.
  function driveLabQ(G, tap) {
    const q = (typeof LABQ !== 'undefined' && LABQ) || null;
    if (!q) { tap('Escape'); return; }
    const want = A.opts.labSerum ? 0 : 1;
    const sel = q.sel | 0;
    if (sel !== want) { tap(want === 0 ? 'KeyA' : 'KeyD'); A.status.note = '实验血清：选择' + (want ? '不注射' : '注射'); return; }
    if ((q.t || 0) < .35) return;                       // the panel refuses input for .3s
    tap('Enter');
    A.status.note = want ? '实验血清：注射' : '实验血清：跳过';
  }
  // is the human driving?  (we never overwrite a key the player is holding)
  function manualHold() {
    if (!A.opts.manual) return false;
    const k = Input.keys;
    for (const c of ['KeyW', 'KeyS', 'KeyA', 'KeyD']) if (k[c] && !A._own[c]) return true;
    return false;
  }
  function drive(G) {
    const p = G.p;
    // edge-safe tap: the game detects key PRESSES (down && !prev-down).  Holding a
    // key across ticks (e.g. re-tapping Enter every frame on a dialog) presses it
    // exactly once and never again — so enforce >=1 released tick between taps.
    if (A._pickTries.size > 60) A._pickTries.clear();
  const tap = (c) => {
      if (A._tick - (A._tapGap[c] ?? -9) < 2) return;
      Input.keys[c] = true; A._taps[c] = 1; A._tapGap[c] = A._tick;
    };

    // the player is steering: hands off movement/fire for a moment, but keep the
    // HUD and status live.  Manual control wins over every mode.
    if (manualHold()) {
      A._manualUntil = (G.time || 0) + 1.2;
      A.status.note = '手动接管中…';
    }
    if (A._manualUntil && (G.time || 0) < A._manualUntil) { A.status.note = '手动接管中…'; return; }

    // the canvas picker overlay (armory weapon rack, camp/market lists) REPLACES
    // update() while open — if we do not drive it the whole run soft-locks.
    if (typeof OVL !== 'undefined' && OVL.open) { drivePicker(tap); return; }
    // first-run blockers: the mechanics-hint dialog and the name editor freeze the sim
    if (G.hintQ) { tap('ArrowRight'); tap('Enter'); A.status.note = '提示确认（否）'; return; }
    if (window.NAMEED && NAMEED.open) {
      try { if (!NAMEED.inp.value) NAMEED.inp.value = 'TSW'; nameEdConfirm(); A.status.note = '自动命名'; } catch (e) { }
      return;
    }

    // 入侵的三个波间界面（crate/lv/shop）不是普通 state，必须主动驱动
    if ((G.state === 'ivcrate' || G.state === 'ivlv' || G.state === 'ivshop') && driveInvadeUI(G, tap)) return;

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
      case 'labq': return driveLabQ(G, tap);
      case 'dialysis': return driveDialysis(G, tap);
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

  // ---------------- 入侵抵抗（Brotato 式竞技场）-------------------------------
  // 没有房间/门/交互物，只有一波一波的敌人和计时器。突入探索的那套
  // (房间图/门框/目标) 在这里全部失效——实测挂机会在无目标状态下游走。
  function driveInvade(G, p, tap) {
    const iv = G.iv || {};
    const W = (typeof WORLD !== 'undefined' && WORLD) ? WORLD : null;
    if (!W || !W.w) { A.status.note = '入侵：等待场地…'; return; }
    let mx = 0, my = 0;
    const foes = (G.enemies || []).filter((e) => !e.dead && e.spawnT <= 0);
    // 1) shoot: invade fires automatically, we only aim (the game aims via Input)
    let tgt = null, bd = 1e9;
    for (const e of foes) { const d = dist(p.x, p.y, e.x, e.y); if (d < bd) { bd = d; tgt = e; } }
    if (tgt) { Input.mx = clampM(tgt.x - G.cam.x, GW()); Input.my = clampM(tgt.y - G.cam.y, GH()); }
    // 2) kite: the arena is a walled box, so "back off" alone walks into a corner
    //    and dies.  Instead we circulate: pick the tangential direction (clockwise
    //    or counter-clockwise, committed for the whole wave) and add a radial
    //    correction that keeps us in the firing band.  That keeps a ring of space
    //    between the swarm and the wall.
    if (tgt) {
      const ux = (tgt.x - p.x) / (bd || 1), uy = (tgt.y - p.y) / (bd || 1);
      const band = iv.wave % 5 === 0 ? [80, 150] : [60, 120];      // boss waves: keep further
      if (A._ivWave !== iv.wave) { A._ivWave = iv.wave; A._ivSpin = Math.random() < .5 ? 1 : -1; }
      if (A.opts.invadeCircle === false) {            // A/B: plain backoff/approach
        if (bd < band[0]) { mx = -ux; my = -uy; A.status.note = '入侵：拉开距离'; }
        else if (bd > band[1]) { mx = ux; my = uy; A.status.note = '入侵：接近'; }
        else { mx = -uy * A._ivSpin * .6; my = ux * A._ivSpin * .6; A.status.note = '入侵：绕行'; }
        moveKeys(mx, my); [mx, my] = pickDir(p, mx, my);
        if (A.opts.dash && p.dashCd <= 0 && spotDanger(p.x, p.y, p) >= 1.6) {
          const dd0 = dashDir(p, [mx, my]);
          if (dd0) { tap('Space'); A.metrics.dash++; }
        }
        moveKeys(mx, my); A.status.target = 'invade'; return;
      }
      // ---- 被围时向「最空的一侧」突围 -------------------------------------
      // Circling inside a closed ring walks THROUGH the swarm.  When >=3 foes are
      // close, score 8 escape sectors by how many enemies sit in them and run for
      // the emptiest one (this is also what lets us leave a corner).
      const near = foes.filter((e) => Math.hypot(e.x - p.x, e.y - p.y) < 95);
      if (A.opts.invadeEscape !== false && near.length >= 3) {
        let bestA2 = 0, bestCost = 1e9;
        for (let k = 0; k < 8; k++) {
          const a2 = k / 8 * Math.PI * 2, ex = Math.cos(a2), ey = Math.sin(a2);
          let cost = 0;
          for (const e of near) {
            const ux2 = e.x - p.x, uy2 = e.y - p.y, d2 = Math.hypot(ux2, uy2) || 1;
            const align = (ex * ux2 + ey * uy2) / d2;            // 1 = straight into it
            if (align > 0) cost += align * (120 / Math.max(30, d2));
          }
          // avoid walls: sample 3 distances
          for (const dd of [26, 52, 80]) {
            if (typeof collides === 'function' && collides(p.x + ex * dd, p.y + ey * dd, p.r, false)) { cost += 3; break; }
          }
          if (cost < bestCost) { bestCost = cost; bestA2 = a2; }
        }
        mx = Math.cos(bestA2); my = Math.sin(bestA2);
        A.status.note = '入侵：突围（' + near.length + ' 敌包围）';
        [mx, my] = pickDir(p, mx, my);
        moveKeys(mx, my);
        if (A.opts.dash && p.dashCd <= 0 && spotDanger(p.x, p.y, p) >= 1.3 && typeof dashSafe === 'function' && dashSafe(p, mx, my)) { tap('Space'); A.metrics.dash++; }
        A.status.target = 'invade'; return;
      }
      const tx = -uy * A._ivSpin, ty = ux * A._ivSpin;           // tangential (circle)
      if (bd < band[0]) { mx = tx * .8 - ux * 1.2; my = ty * .8 - uy * 1.2; A.status.note = '入侵：绕圈脱离'; }
      else if (bd > band[1]) { mx = tx * .5 + ux * .9; my = ty * .5 + uy * .9; A.status.note = '入侵：绕圈接近'; }
      else { mx = tx; my = ty; A.status.note = '入侵：绕圈'; }
      // wall repulsion: if the tangential path points into a wall, flip the spin
      const probeX = p.x + mx * 40, probeY = p.y + my * 40;
      if (typeof collides === 'function' && collides(probeX, probeY, p.r, false)) {
        A._ivSpin = -A._ivSpin;
        mx = -tx; my = -ty;
        A.status.note = '入侵：反向绕圈';
      }
    } else if (iv.phase === 'fight') {
      // nothing to shoot: orbit the arena (never idle in the middle of the box)
      const cx = W.w * 8, cy = W.h * 8;
      const dx = p.x - cx, dy = p.y - cy, l = Math.hypot(dx, dy) || 1;
      if (A._ivWave !== iv.wave) { A._ivWave = iv.wave; A._ivSpin = Math.random() < .5 ? 1 : -1; }
      mx = (-dy / l) * A._ivSpin; my = (dx / l) * A._ivSpin;
      if (l < 60) { mx += dx / l; my += dy / l; }                 // move out from the centre
      A.status.note = '入侵：绕场等刷怪';
    }
    [mx, my] = pickDir(p, mx, my);
    // dash away when the local threat spikes
    if (A.opts.dash && p.dashCd <= 0 && spotDanger(p.x, p.y, p) >= 1.6) {
      const dd = dashDir(p, [mx, my]);
      if (dd) { Input.keys.KeyW = dd[1] < -.3; Input.keys.KeyS = dd[1] > .3; Input.keys.KeyA = dd[0] < -.3; Input.keys.KeyD = dd[0] > .3; tap('Space'); A.metrics.dash++; }
    }
    moveKeys(mx, my);
    A.status.target = 'invade';
  }

  // 入侵波间：补给箱 → 升级 → 商店 → 下一波。挂机原来完全不认识这三个界面，
  // 所以永远停在商店/升级里（或被时间耗尽）。游戏自身按钮都带合法性与付款
  // 检查（ivBuy 内部校验武器槽/物品上限/ivPay），因此按优先级点按钮是安全的。
  function driveInvadeUI(G, tap) {
    const iv = G.iv; if (!iv) return false;
    const hits = (typeof IVU !== 'undefined' && IVU && IVU.hits) ? IVU.hits : [];
    const call = (h) => { try { if (h && typeof h.f === 'function') { h.f(); return true; } } catch (e) { } return false; };
    if (G.state === 'ivcrate') { tap('Enter'); A.status.note = '入侵：领补给箱'; return true; }
    if (G.state === 'ivlv') {
      // pick the upgrade that best matches the goal build: damage first, then hp
      const opts = iv.lvOpts || [];
      // priority is switchable for A/B (A.opts.invadeLvPref)
      const DPS_FIRST = ['dmg', 'aspd', 'crit', 'range', 'elem', 'melee', 'ranged', 'eng', 'hp', 'armor', 'dodge', 'speed', 'steal', 'regen', 'harvest', 'luck'];
      const TANK_FIRST = ['hp', 'armor', 'regen', 'steal', 'dodge', 'dmg', 'aspd', 'crit', 'speed', 'range', 'elem', 'melee', 'ranged', 'eng', 'harvest', 'luck'];
      // growth-first: harvest (per-wave materials) and luck (per-kill loot multiplier,
      // invade-effects.js:116 -> lk = 1 + luck/100) compound into money+XP, which is
      // what actually gates wave progression.
      const GROWTH_FIRST = ['harvest', 'luck', 'dmg', 'aspd', 'hp', 'crit', 'range', 'armor', 'elem', 'melee', 'ranged', 'eng', 'speed', 'dodge', 'steal', 'regen'];
      const pref = Array.isArray(A.opts.invadeLvPref) ? A.opts.invadeLvPref
        : (A.opts.invadeLvStyle === 'tank' ? TANK_FIRST
          : (A.opts.invadeLvStyle === 'growth' ? GROWTH_FIRST : DPS_FIRST));
      let best = null, bw = -1e9;
      for (const o of opts) {
        const idx = pref.indexOf(o.id);
        const w = pref.length - (idx >= 0 ? idx : pref.length);
        if (w > bw) { bw = w; best = o; }
      }
      if (best && typeof ivLvPick === 'function') { ivLvPick(best); A.status.note = '入侵：升级 ' + best.id; return true; }
      tap('Enter'); A.status.note = '入侵：升级'; return true;
    }
    if (G.state === 'ivshop') {
      // ---- 先合成升级：三件同名同阶 -> 一件 +1 阶（成长优先于数量） ----
      // ivCombine 自带同阶检查与 t<3 上限，直接调用是安全的。绝境里「阶」比
      // 「件数」重要得多：实测第 4 波后崩，缺的就是武器阶数。
      if (A.opts.invadeCombine !== false && typeof ivCombine === 'function') {
        const w = iv.w || [];
        for (let i = 0; i < w.length; i++) {
          const s0 = w[i]; if (!s0 || s0.t >= 3) continue;
          const dup = w.findIndex((q, j) => j !== i && q && q.id === s0.id && q.t === s0.t);
          if (dup >= 0) { try { ivCombine(i); A.status.note = '入侵：合成 ' + s0.id + ' → t' + (s0.t + 1); return true; } catch (e) { } }
        }
      }
      // ---- 槽位满时卖弱换强 ------------------------------------------------
      // ivBuy 在 6 槽且「非同阶可升」时直接拒绝（ivFlash('iv_full')），于是
      // 满了以后成长完全停滞。这里在买之前腾位：卖掉当前最弱的一件武器，
      // 但只在报价里确实有更强的武器时才卖（避免白卖）。
      const wl = iv.w || [];
      if (A.opts.invadeSell !== false && wl.length >= 6) {
        const offers = iv.offers || [];
        let bestOfferT = -1, bestOfferId = null;
        for (const o of offers) {
          if (!o || o.k !== 'w') continue;
          const t = o.t | 0;
          if (t > bestOfferT) { bestOfferT = t; bestOfferId = o.id; }
        }
        if (bestOfferT >= 0) {
          // weakest = lowest tier, tie-break by fewest duplicates (can't combine)
          let wi = -1, wt = 99, wdup = 99;
          for (let i = 0; i < wl.length; i++) {
            const s0 = wl[i]; if (!s0) continue;
            const dup = wl.filter((q) => q && q.id === s0.id && q.t === s0.t).length;
            const t = s0.t | 0;
            if (t < wt || (t === wt && dup < wdup)) { wi = i; wt = t; wdup = dup; }
          }
          if (wi >= 0 && wt < bestOfferT && typeof ivSell === 'function') {
            try { ivSell(wi); A.status.note = '入侵：卖弱换强 (t' + wt + '→可买t' + bestOfferT + ')'; return true; } catch (e) { }
          }
        }
      }
      // buy affordable offers, most useful first, then start the next wave
      if (A.opts.invadeShop !== false) {
        const offers = iv.offers || [];
        const priceOf = (o) => { try { return ivPrice(o); } catch (e) { return 1e9; } };
        // purchase priority is switchable for A/B (A.opts.invadeShopStyle)
        const style = A.opts.invadeShopStyle || 'weapon';
        // set completion: >=2 pieces of one set grants a real stat bonus
        // (invade-effects.js), so a weapon that completes a set we already hold
        // one of is worth extra.
        const setOf = (id) => { try { const w = IV_W[id]; return (w && Array.isArray(w.set)) ? w.set : []; } catch (e) { return []; } };
        const counts = (() => { const c = {}; for (const s2 of (iv.w || [])) for (const k of setOf(s2.id)) c[k] = (c[k] || 0) + 1; return c; })();
        // Real DPS of an offered weapon at tier t: damage x projectiles / cooldown.
        // Ranking by tier alone (the old rule) picks a t3 wet noodle over a t1
        // hammer.  The measured wall is raw DPS (wave 4: foes 5->32 while ink +18).
        const dpsOf = (id, t) => {
          try {
            const w = IV_W[id]; if (!w) return 0;
            const dmg = Array.isArray(w.dmg) ? (w.dmg[Math.min(3, t | 0)] || 0) : (w.dmg || 0);
            const cd = Array.isArray(w.cd) ? (w.cd[Math.min(3, t | 0)] || 1) : (w.cd || 1);
            const n = w.n ? (Array.isArray(w.n) ? (w.n[Math.min(3, t | 0)] || 1) : w.n) : 1;
            return (dmg * n) / Math.max(.15, cd);
          } catch (e) { return 0; }
        };
        // duplicate of something we own at the same tier => buying it enables a
        // COMBINE (+1 tier, multiplicative damage), which is worth more than a
        // same-DPS stranger.
        // Buying a duplicate enables a COMBINE (+1 tier = multiplicative damage).
        // Weight is switchable: 'strong' prioritises combines over raw DPS.
        const dupW = A.opts.invadeDupStyle === 'strong' ? 400 : 120;
        const dupBonus = (id, t) => ((iv.w || []).some((q) => q && q.id === id && (q.t | 0) === (t | 0)) ? dupW : 0);
        const setBonus = (id) => {
          if (A.opts.invadeSets === false) return 0;
          let b = 0;
          for (const k of setOf(id)) { const n = counts[k] || 0; if (n >= 1) b += 40 + Math.min(4, n) * 15; }
          return b;
        };
        const rank = (o) => {
          if (!o) return -1;
          if (style === 'weapon') return o.k === 'w' ? 60 + dpsOf(o.id, o.t | 0) + dupBonus(o.id, o.t | 0) + setBonus(o.id) : 10;   // weapons only, best DPS first
          if (o.k === 'w') return 100 + (o.t || 0) * 10;            // otherwise strongest weapon
          const id = o.id || '';
          if (/dmg|crit|aspd|atk|power/.test(id)) return 90;
          if (/hp|armor|regen|life|shield/.test(id)) return 70;
          if (/speed|dodge|warp/.test(id)) return 60;
          return 40;
        };
        let bi = -1, bs = -1;
        for (let i = 0; i < offers.length; i++) { const o = offers[i]; if (!o) continue; if (priceOf(o) > (G.ink | 0)) continue; const s2 = rank(o); if (s2 > bs) { bs = s2; bi = i; } }
        if (bi >= 0 && typeof ivBuy === 'function') { ivBuy(bi); A.status.note = '入侵：购买 #' + bi; return true; }
      }
      if (typeof ivNextWave === 'function') { ivNextWave(); A.status.note = '入侵：开始第 ' + ((iv.wave | 0) + 1) + ' 波'; return true; }
      return false;
    }
    return false;
  }

  function drivePlay(G, p, tap) {
    // invade runs its own arena logic (no rooms/doors/interactables at all)
    if (G.mode === 'invade') {
      driveInvade(G, p, tap);
      // trace: invade state is invisible to the normal debug mirror (we return early)
      if (TSW.trace) {
        const iv0 = G.iv || {};
        try {
          A.dbg = { t: G.time | 0, mode: 'invade', state: G.state, wave: iv0.wave | 0, phase: iv0.phase || '',
            t_: Math.round(iv0.t || 0), lv: iv0.lv | 0, lvPend: iv0.lvPend | 0, ink: G.ink | 0,
            foes: (G.enemies || []).filter((e) => !e.dead).length, note: A.status.note, px: Math.round(p.x), py: Math.round(p.y) };
          if ((G.time | 0) % 3 === 0 && A._dbgT !== (G.time | 0)) { A._dbgT = G.time | 0; TSW.log('DBG ' + JSON.stringify(A.dbg)); }
        } catch (e) { }
      }
      return;
    }
    // no floor yet: do nothing but keep the status honest (a stale objective here
    // used to strand the autopilot in an endless "walk to X" loop)
    if (typeof WORLD === 'undefined' || !WORLD || !Array.isArray(WORLD.rooms) || !WORLD.rooms.length) {
      A.status.note = '等待地形生成…'; A.status.target = null;
      return;
    }
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
        if (it.kind === 'fount' && A.opts.fount && !it.used && p.hp < p.maxHp - 1 && !hasCurse('drought') && G.ink >= it.cost) { A.status.note = '治疗'; tap('KeyE'); break; }
        if (it.kind === 'chest' && A.opts.chest && !it.used) { A.status.note = '开箱'; tap('KeyE'); break; }
        if (it.kind === 'survivor' && A.opts.mate && !it.used) {
          const wantMate = !A.goal.mate() || it.id === A.goal.mate() || it.id === A.goal.radio();
          if (wantMate) { A.status.note = '招募搭档 ' + it.id; tap('KeyE'); break; }
          continue;
        }
        if (it.kind === 'arsrack' && A.opts.arsenal && !it.used) { A.status.note = '军械库：打开武器架'; tap('KeyE'); break; }
        if (it.kind === 'labvial' && A.opts.labSerum && !it.used) { A.status.note = '实验血清：打开'; tap('KeyE'); break; }
        if (it.kind === 'dialysis' && A.opts.dialysis && !it.used && (G.curses || []).length && ((p.maxArmor | 0) >= 1)) { A.status.note = '透析机：清诅咒'; tap('KeyE'); break; }
        if (it.kind === 'key' || it.kind === 'prism') break; // walk over
        if (it.kind === 'chip') {
          const wantSkill = !p.skill || it.id !== 'teleport' || it.id === A.goal.skill();
          if (A.opts.chipPick && wantSkill) { tap('KeyE'); break; }
          continue;
        }
        if (it.kind === 'weapon') {
          const cur = wScore(w.id), nw = wScore(it.id);
          if (nw > cur + .5 || p.weapons.length < wCap()) {
            A.status.note = '拿武器 ' + it.id;
            tap('KeyE');
            const tries = (A._pickTries.get(it) || 0) + 1; A._pickTries.set(it, tries);
            if (tries > 240) { benchFor(it, 90); A._pickTries.delete(it); A.status.note = '放弃该武器'; }
          } else benchFor(it, 90);
          break;
        }
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
      // aim at the closest foe WITH a clear shot (falls back to the closest so the
      // aim stays warm); firing is gated on that target actually existing
      const neF = nearestEnemy(p.x, p.y, 900, true);
      // ---- 清房停滞：房间已激活但没有「能打到」的敌人 → 主动去找那一个漏网的 ----
      if (active && !neF) {
        const anyFoe = nearestEnemy(p.x, p.y, 2000, false);
        if (anyFoe) {
          A._hunt = (A._hunt || 0) + 1;
          if (A._hunt > 30) {                       // ~0.5s of no shot: commit to hunting
            // Straight chase: keeps aim/DPS live.  (A BFS "walk to a shootable
            // tile" variant was measured over 3 seeds: 284s/54.7 kills vs
            // 323s/52.7 straight — inside the +-30% run-to-run noise, so it was
            // not adopted.  See docs/benchmark.md §10.)
            const hx = anyFoe.x - p.x, hy = anyFoe.y - p.y, hl = Math.hypot(hx, hy) || 1;
            mx = hx / hl; my = hy / hl;
            A.status.note = '清房：追击漏网之敌';
            A.status.target = 'hunt';
          }
        }
      } else if (neF) A._hunt = 0;
      const aimT = neF || ne;
      if (aimT) { Input.mx = clampM(aimT.x - G.cam.x, GW()); Input.my = clampM(aimT.y - G.cam.y, GH()); }
      // ---- 战斗状态机：RETREAT / FOCUS / KITE ------------------------------
      // 原来的逻辑是逐帧的临时判断（护甲阈值 + 距离带），没有记忆，于是会在
      // 边界上抖动。 这里引入明确的三态：
      //   RETREAT  护甲破且未恢复 / 低血              → 拉远到 170~250 且不开火
      //   FOCUS    场上 <=3 敌且血量健康              → 压到近距（40~90）抢输出
      //   KITE     其它情况（人海）                   → 保持 90~150 绕行
      // 进入/退出都带滞回（迟滞窗口），避免逐帧翻转。
      if (ne) {
        const d = dist(p.x, p.y, ne.x, ne.y);
        const foesN = (G.enemies || []).filter((e) => !e.dead && e.spawnT <= 0).length;
        const nowT = G.time || 0;
        let st = A.opts.fightSM === false ? 'LEGACY' : (A._fightState || 'KITE');
        const wantRetreat = (p.armor <= 0 && p.lastHit < 3.6) || (p.hp <= 2 && p.armor <= 0);
        if (wantRetreat) { st = 'RETREAT'; A._stateHold = nowT + .6; }
        else if (st === 'RETREAT' && nowT < (A._stateHold || 0)) { /* hold the retreat a beat */ }
        else if (st === 'RETREAT') { st = foesN <= 3 ? 'FOCUS' : 'KITE'; A._stateHold = nowT + .8; }
        else if (st === 'KITE' && foesN <= 3 && p.armor >= 1) { st = 'FOCUS'; A._stateHold = nowT + .8; }
        else if (st === 'FOCUS' && nowT > (A._stateHold || 0) && (foesN > 4 || p.armor <= 0)) { st = 'KITE'; A._stateHold = nowT + .8; }
        A._fightState = st;
        A.status.mode = st;
        let retreat, focus;
        if (st === 'LEGACY') {                    // the old per-frame rule (A/B baseline)
          retreat = (p.armor <= 0 && p.lastHit < 3.6) || (p.hp <= 2 && p.armor <= 0);
          focus = false;
        } else { retreat = st === 'RETREAT'; focus = st === 'FOCUS'; }
        const bs = hard() ? 1.2 : 1;                    // harder difficulties keep more distance
        const band = (retreat ? [170, 250]
          : focus ? (melee ? [26, 46] : [40, 90])
            : (melee ? [30, 52] : [90, 150])).map((v) => Math.round(v * bs));
        const ux = (ne.x - p.x) / (d || 1), uy = (ne.y - p.y) / (d || 1);
        if (d < band[0]) { mx -= ux; my -= uy; }
        else if (d > band[1]) { mx += ux; my += uy; }
        else {                                           // strafe — sign persists per target (no spinning)
          if (A._strafeFor !== ne.id) { A._strafeFor = ne.id; A._strafeS = Math.random() < .5 ? 1 : -1; }
          mx += -uy * .6 * A._strafeS; my += ux * .6 * A._strafeS;
        }
        wantFire = !!neF && !retreat && d < (melee ? 90 : 450);   // 撤退时不输出
      }
      // doorway funnel: on hard difficulties, fight from the room's door —
      // enemies arrive one by one from a narrow arc instead of surrounding us.
      const neDist = ne ? dist(p.x, p.y, ne.x, ne.y) : 1e9;
      if (hard() && !melee && neDist > 70 && active && active.type === 'combat' && active.doors.length) {
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
      // ---- evasion scorecard (meaningful while a fight is live)
      {  // always score the dodge while a run is live (benchmark + HUD)
        const M = A.metrics, dg = spotDanger(p.x, p.y, p);
        M.ticks++; M.dangerSum += dg; if (dg >= 1.2) M.hazard++;
        const cl = laneClear(p, mx, my); M.clearSum += cl; if (cl < M.clearMin) M.clearMin = cl;
        if (M.samples.length < 4000) M.samples.push(cl);
      }
      // dash out when the current spot is about to hurt and the dash is up (never into a pit)
      const dirdash = () => { const l = Math.hypot(mx, my) || 1; return dashSafe(p, mx / l, my / l); };
      if (A.opts.dash && p.dashCd <= 0 && spotDanger(p.x, p.y, p) >= (hard() ? 1.3 : 1.8)) {
        const dd = dashDir(p, [mx, my]);                 // escape toward the calmest arc
        if (dd) { Input.keys.KeyW = dd[1] < -.3; Input.keys.KeyS = dd[1] > .3; Input.keys.KeyA = dd[0] < -.3; Input.keys.KeyD = dd[0] > .3; tap('Space'); A.metrics.dash++; }
        else if (dirdash()) { tap('Space'); A.metrics.dash++; }
      }
      if (A.opts.dash && ne && dist(p.x, p.y, ne.x, ne.y) < 26 && p.dashCd <= 0 && dirdash()) tap('Space');
      // proactive reload: a dry mag triggers the passive reload (SLOTH curse: 1 dmg each)
      if (usesAmmo(w)) {
        const a = ammoOf(p, w.id), cap = magSize(w) || 1;
        const sloth = hasCurse('sloth');
        const low = a.n <= Math.max(1, Math.round(cap * (sloth ? .45 : .2)));
        const safeish = sloth || !nearestEnemy(p.x, p.y, 140, false);
        if (A.opts.reload && a.rl <= 0 && p.dashT <= 0 && (a.n <= 0 || (low && safeish))) tap('KeyR');
      }
      // ---- reload window: switch to the sidearm instead of standing there dry ----
      // KeyX toggles p.wi (game.js:160).  While the equipped weapon is reloading
      // we swap to the other one if *it* is loaded; when the first is ready again
      // we swap back so the better weapon keeps the DPS.
      if (A.opts.weaponSwap && p.weapons.length > 1 && p.dashT <= 0) {
        const curW = WEAPONS[p.weapons[p.wi]], othW = WEAPONS[p.weapons[1 - p.wi]];
        if (curW && othW && usesAmmo(curW) && usesAmmo(othW)) {
          const curA = ammoOf(p, curW.id), othA = ammoOf(p, othW.id);
          const curBusy = curA.rl > 0 || curA.n <= 0;
          const othReady = othA.rl <= 0 && othA.n > 0;
          const othBusy = othA.rl > 0 || othA.n <= 0;
          const curReady = curA.rl <= 0 && curA.n > 0;
          if (curBusy && othReady) { tap('KeyX'); A.status.note = '换弹切副武器 ' + othW.id; }
          else if (curReady && othBusy && wScore(curW.id) >= wScore(othW.id)) { tap('KeyX'); A.status.note = '切回主武器 ' + curW.id; }
        }
      }
      // ---- radio partner skill: KeyF (partners.js) ----
      if (A.opts.partner && G.ptn && (G.ptn.cd || 0) <= 0 && !(G.ptn.act && G.ptn.act.t < G.ptn.act.dur) && !G.prompt) {
        tap('KeyF'); A.status.note = '搭档技能 ' + (G.ptn.id || '');
      }
      // cast the skill chip whenever it is up (E with no prompt casts)
      if (A.opts.skill && p.skill && !p.skillOn && p.skillCd <= 0 && (active || G.trial || near) && !G.prompt) tap('KeyE');
    }

    // debug mirror: what the bot *thinks* the world looks like this tick
    try {
      A.dbg = {
        t: G.time | 0,
        world: (typeof WORLD !== 'undefined' && WORLD) ? (WORLD.w + 'x' + WORLD.h + ' rooms=' + (WORLD.rooms || []).length) : 'NO_WORLD',
        active: !!(active && active.id !== undefined), trial: !!G.trial, near: near | 0,
        state: G.state, obj: A.status.target, note: A.status.note,
        inter: (G.inter || []).length,
        px: Math.round(p.x), py: Math.round(p.y),
        vial: (function () { const v = (G.inter || []).find((i) => i.kind === 'labvial' && !i.used); return v ? Math.round(Math.hypot(v.x - p.x, v.y - p.y)) : -1; })(),
        wp: A._lastWp ? [Math.round(A._lastWp[0]), Math.round(A._lastWp[1])] : null,
      };
      // trace mode: with ?trace=1 print the mirror so headless runs can see it
      if (TSW.trace && (G.time | 0) % 3 === 0 && A._dbgT !== (G.time | 0)) { A._dbgT = G.time | 0; TSW.log('DBG ' + JSON.stringify(A.dbg)); }
    } catch (e) { A.dbg = { err: String(e).slice(0, 80) }; }

    // ---- 导航硬兜底 ----------------------------------------------------------
    // Measured failure (seed 91): the bot locked a far objective and stood still
    // for 90+ game-seconds with a valid waypoint,因为 pickDir 在该点找不到任何
    // 得分 > 0 的方向（威胁场 + 墙惩罚同时压制）。 任何「零位移」都必须被打破。
    if (A.opts.navFallback && (A.mode === 'full') && !active && !G.trial) {
      const moved = (A._mvRef && Math.hypot(p.x - A._mvRef[0], p.y - A._mvRef[1]));
      if (!A._mvRef || !isFinite(moved) || moved > 6) { A._mvRef = [p.x, p.y]; A._mvT = G.time; }
      else if (G.time - (A._mvT || 0) > 2.5) {
        A._mvT = G.time;
        // force a movement burst in a committed random direction (pit/void safe)
        let ang2 = Math.random() * Math.PI * 2, okDir = null;
        for (let k = 0; k < 8; k++) {
          const a2 = ang2 + k * Math.PI / 4, dx2 = Math.cos(a2), dy2 = Math.sin(a2);
          if (typeof dashSafe === 'function' ? dashSafe(p, dx2, dy2) : true) { okDir = [dx2, dy2]; break; }
        }
        if (okDir) {
          A._forceDir = okDir; A._forceUntil = G.time + 1.2;
          A.metrics.navStall = (A.metrics.navStall | 0) + 1;
          A.status.note = '导航兜底：强制移动';
        }
      }
      if (A._forceUntil && G.time < A._forceUntil && A._forceDir) { mx = A._forceDir[0]; my = A._forceDir[1]; }
    }

    // ---------- navigation (no active fight) ----------
    if (!active && !G.trial && A.mode === 'full') {
      const tgt = pickObjective(G, p);
      if (tgt) {
        const path = navPath(G, p, tgt.room ? tgt.room.id : null);
        let wp = tgt.pt;
        if (path && path.length > 1) { const { doorOf } = graph(); const key = path[0] + ':' + path[1]; wp = doorOf[key] || tgt.pt; }
        if (wp) {
          // Only path around real obstacles: when the straight line to the waypoint
          // is clear we keep the old "aim at it" behaviour (which dodges better in
          // open rooms), and use BFS nodes only when something blocks the line.
          const clear = (typeof los === 'function') ? los(p.x, p.y, wp[0], wp[1])
            : !collides(wp[0], wp[1], p.r, false);
          const leg = (!clear && Math.hypot(wp[0] - p.x, wp[1] - p.y) > 26) ? nextWaypoint(p, wp[0], wp[1]) : null;
          if (clear) travel.path = null;               // keep the BFS cache honest
          const aim = leg || wp;
          const dx = aim[0] - p.x, dy = aim[1] - p.y, dl = Math.hypot(dx, dy);
          // route-progress detector.  Distance-to-goal is NOT a progress signal
          // (walking around a wall increases it), so watch the BFS waypoint index:
          // if it stops advancing we really are circling.
          {
            const st = navProg;
            if (st.goal !== wp) { st.goal = wp; st.fails = 0; travel.path = null; st.t = G.time; }
            if (travel.adv !== st.advSeen) { st.advSeen = travel.adv; st.t = G.time; st.fails = 0; }
            else if (G.time - (st.t || 0) > 2.6) {
              st.t = G.time; st.fails = (st.fails || 0) + 1;
              travel.path = null;                      // force a fresh BFS
              A.metrics.navReplan = (A.metrics.navReplan | 0) + 1;
              if (st.fails >= 3) { benchFor(tgt.room || tgt.pt, 25); st.fails = 0; A.status.note = '绕圈：换目标'; A.metrics.navStall = (A.metrics.navStall | 0) + 1; }
              else A.status.note = '绕圈：重算路径';
            }
          }
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
    Input.down = !!wantFire && A.mode !== 'off' && !A.opts.noFire;
  }

  // choose the next room/point to walk to
  function pickObjective(G, p) {
    // The floor may not exist yet (right after launch, or a failed generation).
    // Without this guard the bot chases interactables that have no room, and the
    // run sits still: measured 80+ game-seconds with rooms:0 and kills:0.
    if (typeof WORLD === 'undefined' || !WORLD || !Array.isArray(WORLD.rooms) || !WORLD.rooms.length) return null;
    const rooms = WORLD.rooms;
    // 1) loose pickups: prisms / keys (skip ones we failed to reach recently)
    if (A.opts.arsenal) for (const it of G.inter) if (it.kind === 'arsrack' && !it.used && !unreachable(it) && !unreachable(roomAt(it.x, it.y)))
      return { pt: [it.x, it.y], label: '军械库', room: roomAt(it.x, it.y) };
    if (A.opts.dialysis && (G.curses || []).length && ((p.maxArmor | 0) >= 1))
      for (const it of G.inter) if (it.kind === 'dialysis' && !it.used && !unreachable(it) && !unreachable(roomAt(it.x, it.y)))
        return { pt: [it.x, it.y], label: '透析机', room: roomAt(it.x, it.y) };
    if (A.opts.labSerum) for (const it of G.inter) if (it.kind === 'labvial' && !it.used && !unreachable(it) && !unreachable(roomAt(it.x, it.y)))
      return { pt: [it.x, it.y], label: '实验血清', room: roomAt(it.x, it.y) };
    if (A.opts.pickups) for (const it of G.inter) if ((it.kind === 'prism' || it.kind === 'key') && !unreachable(it) && !unreachable(roomAt(it.x, it.y))) return { pt: [it.x, it.y], label: it.kind, room: roomAt(it.x, it.y) };
    // 1b) weapon/chip drops on the floor worth walking to
    let bw = null, bwd = 1e9;
    for (const it of G.inter) {
      if (it.kind === 'weapon' && !A.opts.weaponPick) continue;
      if (it.kind === 'chip' && !A.opts.chipPick) continue;
      if (it.kind !== 'weapon' && it.kind !== 'chip') continue;
      if (unreachable(it) || unreachable(roomAt(it.x, it.y))) continue;
      const want = it.kind === 'chip'
        ? (!p.skill || it.id !== 'teleport' || it.id === A.goal.skill())
        : (p.weapons.length < wCap() || it.id === A.goal.weapon() || wScore(it.id) > wScore(p.weapons[p.wi]) + .5);
      if (!want) continue;
      const d = dist(p.x, p.y, it.x, it.y); if (d < bwd) { bwd = d; bw = it; }
    }
    if (bw) return { pt: [bw.x, bw.y], label: bw.kind, room: roomAt(bw.x, bw.y) };
    // 1c) forge: 武器是唯一的伤害**基数**（入侵侧实测结论），锻造把墨水变成
    // 武器等级（+25%/级，乘在基数上），应当尽早做而不是排在所有战斗房之后。
    // 'any' 模式检查**所有已装备武器**（原来只看手持，绝境里手持常是初始钉枪，
    // 条件经常不满足 → 等于从未用过锻造）。
    {
      const forgeMode = A.opts.forgeMode || 'held';
      for (const r of rooms) {
        if (r.type !== 'forge' || unreachable(r)) continue;
        const ids = forgeMode === 'any' ? (p.weapons || []) : [p.weapons[p.wi]];
        for (const id of ids) {
          const lv = (p.wlv && p.wlv[id]) || 0;
          if (lv < 3 && G.ink >= 30 + lv * 25 + 10) return { pt: [r.cx * 16 + 8, r.cy * 16 + 8], label: 'forge', room: r };
        }
      }
    }
    // ---- 资源优先 vs 直接清房（A/B 开关 A.opts.exploreOrder）-----------------
    // 绝境里 输出/补给 往往比多打一个房间更值：先去商店/锻造/神龛/宝箱，
    // 再回头清战斗房。 默认保持原顺序（直接清房），可用 A/B 切换验证。
    if (A.opts.exploreOrder === 'resources') {
      if (A.opts.shop) for (const r of rooms) if (!r.visited && ['treasure', 'shop', 'camp', 'dialysis', 'barracks'].includes(r.type) && !unreachable(r)) return { pt: [r.cx * 16 + 8, r.cy * 16 + 8], label: r.type, room: r };
      for (const r of rooms) if (!r.visited && ['forge', 'shrine'].includes(r.type) && !unreachable(r)) return { pt: [r.cx * 16 + 8, r.cy * 16 + 8], label: r.type, room: r };
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
