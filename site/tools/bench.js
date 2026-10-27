// ===== TSW bench — 宏+倍速 benchmark =========================================
// Measures what the game (plus macro/autopilot) actually delivers at a given
// speed setting, and renders a report you can copy into an issue or doc:
//
//   TSW.bench.run(kind, opts) — kinds:
//     'throughput'  engine step throughput: virtual ticks/s and wall cost,
//                   autopilot off, hold-attack macro for realism, perf mode.
//     'macro'       replay the selected macro (or hold-attack) at a speed and
//                   report speed accuracy (game-s per real-s), events/s, kills.
//     'fullrun'     autopilot 'full' from a fresh run to a floor/depth goal.
//
// Results land in TSW.bench.results (and localStorage) and are shown in the
// panel; TSW.bench.markdown() produces a paste-ready table.
'use strict';
(function () {
  const TSW = window.__TSW; if (!TSW || TSW.bench) return;

  const KEY = 'theseed.tools.bench.v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
  const save = (a) => { try { localStorage.setItem(KEY, JSON.stringify(a.slice(-60))); } catch (e) { } };

  const B = TSW.bench = {
    running: null,           // {kind, opts, t0Real, phase, note}
    results: load(),
    clear() { this.results = []; save(this.results); TSW.bus.emit('bench'); },
  };

  // ---------------- low-level timers ----------------
  async function measureTicks(msReal) {
    const G = () => window.__achroma.G;
    let ticks = 0;
    const off = TSW.hooks.beforeTick(() => { ticks++; });
    const t0 = performance.now(), runT0 = G().runT || 0;
    await new Promise((res) => setTimeout(res, msReal));
    off();
    const wall = (performance.now() - t0) / 1000;
    return { ticks, tps: ticks / wall, wall, gameS: (G().runT || 0) - runT0 };
  }

  // 绝境五锁：修饰符不是 UI 状态，而是 sortie(i, ids) → PENDING_MODIFIERS →
  // takeRunModifiers() 在 newRun 里取走。直接写 PENDING_MODIFIERS 就能让一局
  // 带着任意修饰符开场（游戏自己的 cleanModifiers 仍会校验 diff==='despair'）。
  // 绝境五锁（以及任意带修饰符的开局）：修饰符只认存档字段。
  //   * modifiers.js 的 PENDING_MODIFIERS 是它自己作用域里的 let，bench 里赋值
  //     只会遮蔽，改不到游戏；sortie() 又会进营地而不是直接开局。
  //   * 所以这里构造一份最小存档（floor 0、diff despair、modifiers 五锁），
  //     交给游戏自己的 loadSave()/cleanModifiers() 校验，然后 resumeRun()。
  const MOD_IDS = ['rage', 'deathfight', 'bulwark', 'rot', 'cyst'];
  // `whenGame()` resolves as soon as game.js is up, but scripts load in order and
  // modifiers.js is #70 of 76 — newRun() calls takeRunModifiers(), so starting a
  // modifier run before that file executes throws ReferenceError.
  function scriptsReady() {
    try {
      return typeof takeRunModifiers === 'function' && typeof cleanModifiers === 'function'
        && typeof resumeRun === 'function' && typeof newRun === 'function';
    } catch (e) { return false; }
  }
  async function waitScripts(ms = 15000) {
    const t0 = performance.now();
    while (performance.now() - t0 < ms) {
      if (scriptsReady()) return true;
      await new Promise((r) => setTimeout(r, 100));
    }
    return scriptsReady();
  }
  function startRunWith({ diff = 'classic', mods = null, policy = null } = {}) {
    const d = (DIFF_BY && DIFF_BY[diff]) ? diff : (diff || 'classic');
    SET.diff = d; saveSettings();
    const useMods = Array.isArray(mods) && mods.length ? mods.slice() : null;
    let resumed = false;
    if (useMods) {
      const save = {
        v: 1, at: Date.now(), floor: 0, diff: d, modifiers: useMods,
        hp: 5, maxHp: 5, armor: 3, maxArmor: 3, weapons: ['nail'], wi: 0, wlv: {},
        shards: {}, skill: null, ink: 0, kills: 0, runT: 0, hits: 0, curses: [],
        rid: 'r' + Date.now().toString(36),
      };
      try {
        // STORE.setItem silently drops writes while STORE.locked is set (it is
        // locked during platform flushes), so write through mem + dirty directly.
        const txt = JSON.stringify(save);
        STORE.mem['achroma_run'] = txt;
        try { STORE.dirty.add('achroma_run'); } catch (e) { }
        resumeRun(); resumed = true;
        TSW.log('fiveLock: resumed with ' + useMods.join(',') + ' → G.modifiers=' + JSON.stringify((window.__achroma.G && __achroma.G.modifiers) || []));
      } catch (e) { TSW.err('fiveLock resume', e); }
    }
    if (!resumed) { clearSave(); LAUNCH.fn = null; launchRun(); }
  }

  // ensure we are inside a real run (benchmarking the menu measures almost nothing)
  function ensureInRun() {
    const g = window.__achroma.G;
    if (g.p && (g.state === 'play' || g.state === 'cards' || g.state === 'trans')) return false;
    try { SET.diff = 'classic'; saveSettings(); clearSave(); LAUNCH.fn = null; launchRun(); return true; } catch (e) { TSW.err('ensureInRun', e); return false; }
  }

  // ---------------- scenarios ----------------
  async function runThroughput({ seconds = 12, speed = 8, startRun = true } = {}) {
    const wasPerf = TSW.perf.active, wasSpeed = TSW.speed.get(), wasMode = TSW.auto.mode;
    if (!wasPerf) TSW.perf.enable();
    if (startRun) ensureInRun();
    await new Promise((r) => setTimeout(r, 1500)); // let the run spin up
    TSW.auto.setMode('combat'); // hold position, shoot anything near
    TSW.speed.set(speed, true);
    const g0 = window.__achroma.G;
    const inRun = !!(g0.p && g0.state === 'play');
    const m = await measureTicks(seconds * 1000);
    TSW.speed.set(wasSpeed, true); if (wasMode === 'off') TSW.auto.setMode('off');
    if (!wasPerf) TSW.perf.disable();
    return {
      kind: 'throughput', at: Date.now(), speed, seconds,
      ticks: m.ticks, tps: +m.tps.toFixed(1), gameS: +m.gameS.toFixed(1),
      ratio: +(m.gameS / m.wall).toFixed(2), inRun,
      ua: navigator.userAgent.match(/(Chrome|Firefox|Safari)\/[\d.]+/)?.[0] || '',
    };
  }

  async function runMacro({ seconds = 20, speed = 4, macro = null } = {}) {
    const wasSpeed = TSW.speed.get(), wasMode = TSW.auto.mode;
    ensureInRun();
    await new Promise((r) => setTimeout(r, 1500));
    TSW.auto.setMode('off'); // the macro IS the driver
    TSW.speed.set(speed, true);
    const M = TSW.metrics; const d0 = M.dmgTotal, kill0 = __achroma.G.kills | 0;
    const ev = macro || TSW.macro.presetHoldAttack(seconds);
    const runT0 = __achroma.G.runT || 0;
    const t0 = performance.now();
    TSW.macro.play(ev, { onDone: () => { } });
    await new Promise((res) => setTimeout(res, seconds * 1000 / Math.min(4, speed) + 2500));
    TSW.macro.stopPlay();
    TSW.speed.set(wasSpeed, true); if (wasMode !== 'off') TSW.auto.setMode(wasMode);
    const wall = (performance.now() - t0) / 1000;
    const G = __achroma.G;
    const gameS = Math.max(0, (G.runT || 0) - runT0);
    return {
      kind: 'macro', at: Date.now(), speed, seconds, macro: macro ? 'custom' : 'hold-attack',
      gameS: +gameS.toFixed(1), wall: +wall.toFixed(1), ratio: +(gameS / wall).toFixed(2),
      kills: (G.kills | 0) - kill0, dmg: Math.round(M.dmgTotal - d0),
      ua: navigator.userAgent.match(/(Chrome|Firefox|Safari)\/[\d.]+/)?.[0] || '',
    };
  }

  async function runFullRun({ speed = 8, seed = null, policy = 'bloom', goalDepth = 1, timeoutS = 900, diff = 'classic', mods = null } = {}) {
    const wasSpeed = TSW.speed.get(), wasPolicy = TSW.auto.policy, wasRestart = TSW.auto.opts.autoRestart, wasDiff = SET.diff;
    if (seed != null) TSW.rng.seed(seed);
    TSW.auto.setPolicy(policy);
    TSW.auto.opts.autoRestart = false;
    TSW.auto.setMode('full');
    TSW.speed.set(speed, true);
    const M = TSW.metrics;
    M.reset();
    // start a fresh run: either the game's own launchRun() or (with modifiers)
    // a crafted save resumed through the game's loader
    await waitScripts();
    startRunWith({ diff, mods });
    const G = () => window.__achroma.G;
    const t0 = performance.now();
    // the resume path needs a beat; without this the first ticks record the menu
    let modsEarly = [];
    {
      const ws = performance.now();
      while (performance.now() - ws < 8000) {
        const g = G();
        if (g && g.p && (g.state === 'play' || g.state === 'cards' || g.state === 'dead')) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      const g = G(); modsEarly = (g && g.modifiers) ? g.modifiers.slice() : [];
    }
    // watchdog: if the run's observable state hasn't changed for 30 real seconds
    // (soft-lock: unpickable state, geometry, …) end it as 'stuck' so experiment
    // matrices always complete.  hurtPlayer is the game's own damage entry point.
    let lastSig = '', lastSigT = performance.now();
    const wd = setInterval(() => {
      const g = G(); if (!g || !g.p) return;
      const sig = [g.state, g.kills | 0, g.ink | 0, g.floor, g.endless | 0, g.enemies.filter((e) => !e.dead).length].join(',');
      if (sig === lastSig) {
        if (g.state === 'play' && performance.now() - lastSigT > 30000) {
          try { hurtPlayer(999, g.p.x, g.p.y, true, true); } catch (e) { }
          TSW.log('watchdog: stuck run ended');
          lastSigT = performance.now();
        }
      } else { lastSig = sig; lastSigT = performance.now(); }
    }, 1000);
    const res = await new Promise((resolve) => {
      const iv = setInterval(() => {
        const g = G(), wall = (performance.now() - t0) / 1000;
        const done = (g.state === 'dead') || (g.endless >= goalDepth) || (g.state === 'win');
        if (done || wall > timeoutS) {
          clearInterval(iv);
          resolve({ end: g.state === 'dead' ? 'death' : g.state === 'win' ? 'ascend' : g.endless >= goalDepth ? 'goal' : 'timeout', wall });
        }
      }, 500);
    });
    clearInterval(wd);
    TSW.auto.setMode('off');
    TSW.auto.opts.autoRestart = wasRestart;
    TSW.auto.setPolicy(wasPolicy);
    TSW.speed.set(wasSpeed, true);
    SET.diff = wasDiff; saveSettings();
    TSW.rng.clear();
    const g = G();
    return {
      kind: 'fullrun', at: Date.now(), speed, seed, policy, goalDepth, diff,
      modifiers: modsEarly,
      modifiersAtEnd: (window.__achroma.G && __achroma.G.modifiers) || [],
      end: res.end, wall: +res.wall.toFixed(1),
      gameT: +g.runT.toFixed(0), floor: g.floor, depth: g.endless | 0,
      kills: g.kills | 0, hits: g.hits | 0, dmg: Math.round(M.dmgTotal), stall: (TSW.auto.metrics && TSW.auto.metrics.navStall) | 0, replan: (TSW.auto.metrics && TSW.auto.metrics.navReplan) | 0,
      weapons: (g.p ? g.p.weapons : []).slice(), shards: Object.assign({}, g.p ? g.p.shards : {}),
      syn: Object.keys(SYN || {}).length,
      ua: navigator.userAgent.match(/(Chrome|Firefox|Safari)\/[\d.]+/)?.[0] || '',
    };
  }

  // ---------------- build probe (build A/B testing) ----------------
  // Crafts a run-save with a chosen build (weapons/shards/skill) and drops the
  // game onto floor 5 at a SIMULATED endless depth (the game's own loader
  // validates everything — no source is modified).  The autopilot then plays
  // N game-seconds and we report kills/dmg per game-minute at that depth.
  // This is the empirical leg of docs/endless-guide.md.
  async function runProbe({ depth = 5, seconds = 60, speed = 8, policy = 'bloom', seed = 7,
    shards = { bloom: 3, shrap: 3 }, weapons = ['hail'], wlv = { hail: 3 }, skill = null, hp = null, diff = 'classic' } = {}) {
    const wasSpeed = TSW.speed.get(), wasPolicy = TSW.auto.policy, wasMode = TSW.auto.mode;
    TSW.rng.seed(seed);
    TSW.auto.setPolicy(policy);
    TSW.speed.set(speed, true);
    const M = TSW.metrics; M.reset();
    const save = {
      v: 1, at: Date.now(), floor: 4, diff: diff || 'classic', hp: hp ?? 5, armor: 3,
      weapons: weapons.slice(), wi: 0, wlv: Object.assign({}, wlv), shards: Object.assign({}, shards),
      skill: skill || null, ink: 400, kills: 0, runT: 0, hits: 0, endless: depth,
      rid: 'r' + Date.now().toString(36),
    };
    try { STORE.setItem('achroma_run', JSON.stringify(save)); resumeRun(); }
    catch (e) { TSW.err('probe resume', e); }
    // wait for the resumed floor to be live
    const t0 = performance.now();
    while (performance.now() - t0 < 15000) { const g = window.__achroma.G; if (g && g.p && (g.state === 'play' || g.state === 'dead')) break; await new Promise((r) => setTimeout(r, 120)); }
    TSW.auto.setMode('full');
    const g1 = window.__achroma.G;
    const runT0 = g1.runT || 0, k0 = g1.kills | 0, d0 = M.dmgTotal;
    // combat-only accumulators: navigation time would otherwise drown the signal
    let cDmg = 0, cKills = 0, cT = 0, lastDmg = d0, lastKills = k0, lastAct = null;
    const off = TSW.hooks.beforeTick(() => {
      const g = window.__achroma.G; if (!g || !g.p) return;
      const act = !!(WORLD.rooms && (WORLD.rooms.some((r) => r.active) || g.trial || (g.boss && !g.boss.dead)));
      if (lastAct === null) lastAct = act;
      if (act) {
        cDmg += M.dmgTotal - lastDmg; cKills += (g.kills | 0) - lastKills; cT += 1 / 60;
      }
      lastAct = act; lastDmg = M.dmgTotal; lastKills = g.kills | 0;
    });
    await new Promise((res) => setTimeout(res, Math.max(3000, seconds * 1000 / Math.min(4, speed) + 4000)));
    off();
    TSW.auto.setMode('off');
    TSW.speed.set(wasSpeed, true); TSW.auto.setPolicy(wasPolicy);
    if (wasMode !== 'off') TSW.auto.setMode(wasMode);
    TSW.rng.clear();
    const g = window.__achroma.G;
    const gameS = Math.max(1, (g.runT || 0) - runT0);
    const kills = (g.kills | 0) - k0, dmg = Math.round(M.dmgTotal - d0);
    const cTmax = Math.max(1, cT);
    return {
      kind: 'probe', at: Date.now(), depth, seconds, policy, seed, speed, diff: diff || 'classic',
      build: { weapons, wlv, shards, skill },
      end: g.state === 'dead' ? 'death' : 'alive',
      gameS: +gameS.toFixed(1), combatS: +cT.toFixed(1),
      kills, kpm: +(kills / (gameS / 60)).toFixed(1),
      dmg, dpm: Math.round(dmg / (gameS / 60)),
      cKills, ckpm: +(cKills / (cTmax / 60)).toFixed(1),
      cDmg, cdpm: Math.round(cDmg / (cTmax / 60)),
      hits: g.hits | 0,
      ua: navigator.userAgent.match(/(Chrome|Firefox|Safari)\/[\d.]+/)?.[0] || '',
    };
  }

  // ---------------- dodge benchmark (纯躲弹幕测评) ----------------
  // Pure-evasion stress test: a real run at a given endless depth with FIRING
  // DISABLED, so enemies never die and the barrage only gets denser.  We top the
  // arena up with ranged attackers, then report hits taken per game-minute plus
  // the autopilot's own evasion scorecard (danger exposure, worst-case bullet
  // clearance, dash usage).  engine 'v2' vs 'simple' is an A/B of the dodge AI
  // itself, so the number says something about the code and not just the seed.
  async function runDodgeOne({ depth = 6, seconds = 45, speed = 8, policy = 'survival', seed = 11,
    floor = 4, keep = 7, spawnEvery = 3, spawnN = 4, hp = 14, types = ['gunner', 'sniper', 'turret', 'mortar'], diff = 'classic' } = {}) {
    const wasSpeed = TSW.speed.get(), wasPolicy = TSW.auto.policy, wasMode = TSW.auto.mode;
    const wasNoFire = TSW.auto.opts.noFire;
    TSW.rng.seed(seed);
    TSW.auto.setPolicy(policy);
    TSW.speed.set(speed, true);
    TSW.auto.opts.noFire = true;              // stress: never shoot back
    const M = TSW.metrics; M.reset(); TSW.auto.metrics.reset();
    const save = {
      v: 1, at: Date.now(), floor, diff: diff || 'classic', hp, armor: 3,
      weapons: ['rivet'], wi: 0, wlv: { rivet: 1 }, shards: { plate: 1, vital: 1 },
      skill: null, ink: 200, kills: 0, runT: 0, hits: 0, endless: depth,
      rid: 'r' + Date.now().toString(36),
    };
    try { STORE.setItem('achroma_run', JSON.stringify(save)); resumeRun(); }
    catch (e) { TSW.err('dodge resume', e); }
    const t0 = performance.now();
    while (performance.now() - t0 < 15000) { const g = window.__achroma.G; if (g && g.p && (g.state === 'play' || g.state === 'dead')) break; await new Promise((r) => setTimeout(r, 120)); }
    TSW.auto.setMode('full');
    const g1 = window.__achroma.G;
    const runT0 = g1.runT || 0, h0 = g1.hits | 0;
    // own hit counter for the window: immune to any reset elsewhere
    let localHits = 0; const _hp = window.hurtPlayer;
    try { window.hurtPlayer = function (...a) { const r = _hp.apply(this, a); if (r === true) localHits++; return r; }; } catch (e) { }
    // keep the arena populated with ranged enemies so the barrage never dries up
    let spawnAcc = 0, spawned = 0;
    const off = TSW.hooks.beforeTick(() => {
      const g = window.__achroma.G; if (!g || !g.p || g.state !== 'play') return;
      const foes = g.enemies.filter((e) => !e.dead && e.spawnT <= 0);
      const ranged = foes.filter((e) => e.ranged || e.shot || ['gunner', 'sniper', 'turret', 'mortar', 'echo'].includes(e.type)).length;
      spawnAcc += 1;
      if (ranged < keep && spawnAcc >= spawnEvery * 60) {
        spawnAcc = 0;
        for (let i = 0; i < spawnN; i++) {
          const a = Math.random() * 6.283, x = g.p.x + Math.cos(a) * 120, y = g.p.y + Math.sin(a) * 100;
          try { if (!collides(x, y, 6, false)) { spawnEnemy(types[i % types.length], x, y, { room: roomAt(x, y) }); spawned++; } } catch (e) { }
        }
      }
    });
    await new Promise((res) => setTimeout(res, Math.max(3000, seconds * 1000 / Math.min(4, speed) + 2500)));
    off();
    TSW.auto.setMode('off');
    TSW.speed.set(wasSpeed, true); TSW.auto.setPolicy(wasPolicy);
    TSW.auto.opts.noFire = wasNoFire;
    if (wasMode !== 'off') TSW.auto.setMode(wasMode);
    try { window.hurtPlayer = _hp; } catch (e) { }
    TSW.rng.clear();
    const g = window.__achroma.G, A = TSW.auto.metrics;
    const gameS = Math.max(1, (g.runT || 0) - runT0);
    const hits = localHits;                          // restart-proof (a new run resets G.hits)
    const sorted = A.samples.slice().sort((a, b) => a - b);
    const pct = (q) => sorted.length ? +sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))].toFixed(2) : 0;
    // normalise on measured play ticks: G.runT resets when a run restarts, ticks do not
    const mins = Math.max(1 / 60, (A.ticks || 0) / 3600);
    return {
      kind: 'dodge', at: Date.now(), depth, floor, seconds, policy, seed, speed,
      diff: diff || 'classic',
      end: g.state === 'dead' ? 'death' : 'alive',
      gameS: +gameS.toFixed(1),
      hits, hitsPerMin: +(hits / mins).toFixed(2), hpLeft: Math.round(g.p ? g.p.hp : 0), gameMinutes: +mins.toFixed(2),
      dangerAvg: +(A.ticks ? A.dangerSum / A.ticks : 0).toFixed(3),
      hazardPct: +(A.ticks ? A.hazard / A.ticks * 100 : 0).toFixed(1),
      clearAvg: +(A.ticks ? A.clearSum / A.ticks : 0).toFixed(2),
      clearP5: pct(.05), clearP1: pct(.01), clearMin: A.clearMin === 1e9 ? 0 : +A.clearMin.toFixed(2),
      dashes: A.dash, dashesPerMin: +(A.dash / mins).toFixed(2),
      spawned, ticks: A.ticks, hitsMetric: M.hitsTaken | 0, hitsGame: (g.hits | 0) - h0,
      // a run that never got into combat measures nothing: 0 hits would be a
      // false win, so such a sample is flagged invalid and retried by runDodge.
      valid: A.ticks >= 600,
      ua: navigator.userAgent.match(/(Chrome|Firefox|Safari)\/[\d.]+/)?.[0] || '',
    };
  }
  // ---------------- 入侵抵抗 (invasion resistance) ----------------
  // The mode is a Brotato-style arena: ivBegin() opens an ivrole picker, then a
  // shop, then ivStartWave() begins the fight.  The autopilot knows none of the
  // IV_UI states, so a benchmark has to resume a crafted invade save (the game's
  // own ivLoadSave validates every field) and let ivResume() set up the arena.
  async function runInvade({ speed = 8, seed = null, diff = 'despair', role = 'rounded',
    wave = 5, weapons = [{ id: 'edge', t: 2 }, { id: 'hammer', t: 1 }], seconds = 120,
    timeoutS = 900, hpCap = null } = {}) {
    await waitScripts();
    const wasSpeed = TSW.speed.get(), wasMode = TSW.auto.mode;
    if (seed != null) TSW.rng.seed(seed);
    const save = {
      v: 1, at: Date.now(), rid: 'r' + Date.now().toString(36), diff,
      ink: 0, kills: 0, runT: 0,
      iv: {
        wave, role, w: weapons.slice(), items: {}, base: {}, xp: 0, lv: 0, lvPend: 0,
        crates: [], offers: [null, null, null, null], lock: [false, false, false, false],
        rr: 0, freeRolls: 0, events: [], pending: {}, mats0: 0, crateDrops: 0,
      },
    };
    if (hpCap != null) save.iv.hpCap = hpCap;
    let started = false;
    try {
      const txt = JSON.stringify(save);
      STORE.mem['achroma_ivrun'] = txt;              // STORE.setItem drops writes when locked
      try { STORE.dirty.add('achroma_ivrun'); } catch (e) { }
      const ok = (typeof ivResume === 'function') ? ivResume() : false;
      started = !!ok;
      TSW.log('invade: resume ' + (ok ? 'ok' : 'FAILED') + ' diff=' + diff + ' wave=' + wave + ' role=' + role);
    } catch (e) { TSW.err('invade resume', e); }
    if (!started) return { kind: 'invade', at: Date.now(), error: 'ivResume failed (save rejected)', diff, wave, role };

    const wasRestart = TSW.auto.opts.autoRestart;
    TSW.auto.opts.autoRestart = false;          // a death must end the sample, not restart it
    TSW.auto.setMode('full');
    TSW.speed.set(speed, true);
    // walk into the fight: ivshop/ivrole need a click/keypress to advance
    const t0 = performance.now();
    const seen = [];
    while (performance.now() - t0 < 12000) {
      const g = window.__achroma.G;
      if (!g) { await new Promise((r) => setTimeout(r, 150)); continue; }
      if (seen[seen.length - 1] !== g.state) seen.push(g.state);
      if (g.state === 'play') break;
      // ivshop is the between-wave shop: ivNextWave() is the game's own entry
      if (g.state === 'ivshop') { try { ivNextWave(); } catch (e) { try { ivStartWave(); } catch (e2) { } } }
      await new Promise((r) => setTimeout(r, 150));
    }
    TSW.log('invade: state path ' + seen.join(' → ') + ' (final=' + (window.__achroma.G && __achroma.G.state) + ')');
    const g0 = window.__achroma.G;
    const runT0 = g0.runT || 0, k0 = g0.kills | 0, d0 = TSW.metrics.dmgTotal;
    let peakWave = (g0.iv && g0.iv.wave) | 0;
    const mon = setInterval(() => {
      const gg = window.__achroma.G;
      if (gg && gg.iv && (gg.iv.wave | 0) > peakWave) peakWave = gg.iv.wave | 0;
    }, 250);
    await new Promise((res) => setTimeout(res, Math.max(4000, seconds * 1000 / Math.min(4, speed) + 3000)));
    clearInterval(mon);
    TSW.auto.setMode('off');
    TSW.auto.opts.autoRestart = wasRestart;
    TSW.speed.set(wasSpeed, true);
    if (wasMode !== 'off') TSW.auto.setMode(wasMode);
    TSW.rng.clear();
    const g = window.__achroma.G, iv = g.iv || {};
    const gameS = Math.max(1, (g.runT || 0) - runT0);
    return {
      kind: 'invade', at: Date.now(), seed, diff, role, startWave: wave, seconds, speed,
      end: g.state === 'dead' ? 'death' : 'alive',
      gameS: +gameS.toFixed(1), waveReached: peakWave || (iv.wave | 0), wavePhase: iv.phase || '',
      survived: +gameS.toFixed(1),
      kills: (g.kills | 0) - k0, hits: g.hits | 0,
      dmg: Math.round(TSW.metrics.dmgTotal - d0),
      weapons: (iv.w || []).map((w) => w.id + ':t' + w.t),
      lv: iv.lv | 0, state: g.state,
      ua: navigator.userAgent.match(/(Chrome|Firefox|Safari)\/[\d.]+/)?.[0] || '',
    };
  }

  async function runDodge(o = {}) {
    // 躲弹幕只有一个引擎（v2）；无效样本自动重试，避免"没进战斗=0受击"的假数据
    let r = await runDodgeOne(o);
    for (let i = 0; i < 2 && r && !r.valid; i++) r = await runDodgeOne(o);
    return r;
  }

  // ---------------- paired A/B (同一会话内交错，配对差) ----------------
  // The game computes dt from real elapsed time (game.js:693), so绝对时长不可
  // 复现。唯一诚实做法：在同一浏览器会话里交错跑 A/B/A/B…，然后看**配对差**。
  // optA / optB 是本模块认识的选项覆盖，例如 { policy: 'rounded' } 与
  // { onLowKillsDps: true }（后者由 auto.js 的 A.opts 读取）。
  async function runAB({ rounds = 5, abKind = null, kind = null, base = {}, optA = {}, optB = {},
    seconds = 60, speed = 8, seed = null, diff = 'despair', mods = null, goalDepth = 1, timeoutS = 200, metric = null } = {}) {
    const K = abKind || kind || 'fullrun';        // inner scenario
    const metricKey = metric || (K === 'invade' ? 'survived' : 'gameT');
    const A = Object.assign({}, base, optA), B = Object.assign({}, base, optB);
    const pairs = [];
    const exec = async (o) => {
      // apply autopilot option overrides, remember originals
      const saved = {};
      for (const [k, val] of Object.entries(o.autoOpts || {})) {
        if (k in (TSW.auto.opts || {})) { saved[k] = TSW.auto.opts[k]; TSW.auto.opts[k] = val; }
      }
      let r;
      try {
        if (K === 'invade') r = await runInvade(Object.assign({ seconds, speed, seed, diff, timeoutS, role: base.role || 'rounded', wave: (base.wave != null ? base.wave : 9) }, o));
        else r = await runFullRun(Object.assign({ speed, seed, policy: 'rounded', goalDepth, timeoutS, diff, mods }, o));
      } finally { for (const [k, v] of Object.entries(saved)) TSW.auto.opts[k] = v; }
      return r;
    };
    TSW.log('AB start: rounds=' + rounds + ' inner=' + K + ' diff=' + diff);
    for (let i = 0; i < rounds; i++) {
      // order alternates: even rounds A→B, odd rounds B→A (cancels session drift)
      const flip = i % 2 === 1;
      TSW.log('AB round ' + (i + 1) + (flip ? ' B→A' : ' A→B'));
      const a = await exec(flip ? B : A);
      const b = await exec(flip ? A : B);
      const ka = (a && a[metricKey]) || 0;
      const kb = (b && b[metricKey]) || 0;
      const kk = 'kills';
      pairs.push({ i: i + 1, order: flip ? 'B,A' : 'A,B', a: ka, b: kb, da: (a && a[kk]) || 0, db: (b && b[kk]) || 0, d: +(kb - ka).toFixed(1), kd: (((b && b[kk]) || 0) - ((a && a[kk]) || 0)) });
      TSW.log('AB pair ' + (i + 1) + ': ' + ka + ' vs ' + kb + ' (delta ' + (kb - ka) + ')');
    }
    const ds = pairs.map((p) => p.d);
    const ks = pairs.map((p) => p.kd);
    const mean = (v) => v.reduce((x, y) => x + y, 0) / (v.length || 1);
    const sd = (v) => { const m = mean(v); return Math.sqrt(v.reduce((x, y) => x + (y - m) ** 2, 0) / Math.max(1, v.length - 1)); };
    const md = mean(ds), sdd = sd(ds);
    const sem = sdd / Math.sqrt(ds.length || 1);
    // paired t (two-sided, df = n-1) — report a rough 95% interval
    const t = ds.length > 1 ? md / (sem || 1) : 0;
    return {
      kind: 'ab', at: Date.now(), inner: K, metric: metricKey,
      rounds: ds.length, seconds, speed, diff, mods, optA, optB,
      aMean: +mean(pairs.map((p) => p.a)).toFixed(1), bMean: +mean(pairs.map((p) => p.b)).toFixed(1),
      deltaMean: +md.toFixed(1), deltaSd: +sdd.toFixed(1), sem: +sem.toFixed(1),
      killDeltaMean: +mean(ks).toFixed(1),
      ci95: [+(md - 1.96 * sem).toFixed(1), +(md + 1.96 * sem).toFixed(1)],
      t: +t.toFixed(2),
      verdict: ds.length < 3 ? '样本太少（<3 对）'
        : (sdd === 0 ? (md === 0 ? '完全无差异（指标无分辨率）' : (md > 0 ? 'B 更好（无方差）' : 'A 更好（无方差）'))
          : (Math.abs(md) < 1.96 * sem ? '无显著差异' : (md > 0 ? 'B 更好' : 'A 更好'))),
      pairs,
      ua: navigator.userAgent.match(/(Chrome|Firefox|Safari)\/[\d.]+/)?.[0] || '',
    };
  }

  B.run = async function (kind, opts = {}) {
    if (B.running) { TSW.err('bench already running'); return null; }
    await TSW.whenGame();
    B.running = { kind, note: '准备…' }; TSW.bus.emit('bench');
    let r = null;
    try {
      if (kind === 'throughput') r = await runThroughput(opts);
      else if (kind === 'macro') r = await runMacro(opts);
      else if (kind === 'fullrun') r = await runFullRun(opts);
      else if (kind === 'probe') r = await runProbe(opts);
      else if (kind === 'dodge') r = await runDodge(opts);
      else if (kind === 'invade') r = await runInvade(opts);
      else if (kind === 'ab') r = await runAB(opts);
      else throw new Error('unknown kind ' + kind);
    } catch (e) { TSW.err('bench', e); B.running = null; TSW.bus.emit('bench'); return { kind: 'error', error: String(e && e.stack || e).slice(0, 500) }; }
    B.running = null;
    if (r) { B.results.push(r); save(B.results); TSW.bus.emit('bench'); console.info('[TSW] bench result', r); }
    return r;
  };

  B.markdown = function (rows = B.results) {
    if (!rows.length) return '(no results)';
    const keys = [...rows.reduce((s, r) => { Object.keys(r).forEach((k) => s.add(k)); return s; }, new Set())].filter((k) => k !== 'ua');
    const head = '| ' + keys.join(' | ') + ' |';
    const sep = '|' + keys.map(() => '---').join('|') + '|';
    const lines = rows.map((r) => '| ' + keys.map((k) => typeof r[k] === 'object' ? JSON.stringify(r[k]) : String(r[k])).join(' | ') + ' |');
    return [head, sep, ...lines].join('\n');
  };
  TSW.log('bench module ready');
})();
