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

  async function runFullRun({ speed = 8, seed = null, policy = 'bloom', goalDepth = 1, timeoutS = 900, diff = 'classic' } = {}) {
    const diff = opts.diff || 'classic';
    const wasSpeed = TSW.speed.get(), wasPolicy = TSW.auto.policy, wasRestart = TSW.auto.opts.autoRestart, wasDiff = SET.diff;
    if (seed != null) TSW.rng.seed(seed);
    TSW.auto.setPolicy(policy);
    TSW.auto.opts.autoRestart = false;
    TSW.auto.setMode('full');
    TSW.speed.set(speed, true);
    const M = TSW.metrics;
    M.reset();
    // start a fresh run (same entry the pause-menu restart uses)
    SET.diff = diff; saveSettings(); clearSave();
    LAUNCH.fn = null; launchRun();
    const G = () => window.__achroma.G;
    const t0 = performance.now();
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
      end: res.end, wall: +res.wall.toFixed(1),
      gameT: +g.runT.toFixed(0), floor: g.floor, depth: g.endless | 0,
      kills: g.kills | 0, hits: g.hits | 0, dmg: Math.round(M.dmgTotal),
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
  async function runProbe({ depth = 5, seconds = 60, speed = 8, policy = 'bloom', seed = 7, diff = 'classic',
    shards = { bloom: 3, shrap: 3 }, weapons = ['hail'], wlv = { hail: 3 }, skill = null, hp = null } = {}) {
    const wasSpeed = TSW.speed.get(), wasPolicy = TSW.auto.policy, wasMode = TSW.auto.mode;
    TSW.rng.seed(seed);
    TSW.auto.setPolicy(policy);
    TSW.speed.set(speed, true);
    const M = TSW.metrics; M.reset();
    const save = {
      v: 1, at: Date.now(), floor: 4, diff, hp: hp ?? 5, armor: 3,
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
    await new Promise((res) => setTimeout(res, Math.max(3000, seconds * 1000 / Math.min(4, speed) + 2500)));
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
      kind: 'probe', at: Date.now(), depth, seconds, policy, seed, speed, diff,
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
