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
  // `boost` lets a run START with better gear, so the damage threshold can be
  // measured directly instead of inferred: { weapons, wlv, shards, ink }.
  function startRunWith({ diff = 'classic', mods = null, policy = null, boost = null, seed = null } = {}) {
    // DETERMINISTIC SAVE STAMP.  `at` and `rid` went into the save that the run
    // resumes from, and both came from Date.now().  A save is not just bookkeeping:
    // the game keys clear-run rewards and markAssisted off G.rid, so two runs of the
    // same seed were resuming from genuinely different saves.  Deriving both from
    // the seed makes the starting state identical.
    const stamp = (seed == null) ? Date.now() : (0x5eed0000 + (seed >>> 0));
    const ridOf = (seed == null) ? ('r' + Date.now().toString(36)) : ('s' + (seed >>> 0).toString(36));
    const d = (DIFF_BY && DIFF_BY[diff]) ? diff : (diff || 'classic');
    SET.diff = d; saveSettings();
    const useMods = Array.isArray(mods) && mods.length ? mods.slice() : null;
    const b = boost || null;
    let resumed = false;
    if (useMods || b) {
      const save = {
        v: 1, at: stamp, floor: 0, diff: d, modifiers: useMods || [],
        // hp/armor are overridable so a scenario can start from a realistic build.
        // The endless floor is designed for a player who finished three floors; a
        // boost that jumped there with 5 hp / 3 armor died in 15 seconds with eight
        // enemies on screen (benchmark.md 213).
        hp: (b && b.hp != null) ? b.hp : 5, maxHp: (b && b.hp != null) ? b.hp : 5,
        armor: (b && b.armor != null) ? b.armor : 3, maxArmor: (b && b.armor != null) ? b.armor : 3,
        weapons: (b && b.weapons) ? b.weapons.slice() : ['nail'], wi: 0,
        wlv: (b && b.wlv) ? Object.assign({}, b.wlv) : {},
        shards: (b && b.shards) ? Object.assign({}, b.shards) : {},
        skill: null, ink: (b && b.ink) || 0, kills: 0, runT: 0, hits: 0, curses: [],
        // DO NOT write endless into the save.  startEndless() begins with
        // `if (G.endless) return;` (game.js:747), so pre-setting the counter makes
        // the entry point a no-op: measured, a boost with endless:1 ran 4 game
        // seconds with zero kills because beginFloorTransition never ran.
        // The floor is entered by calling startEndless below, which sets the
        // counter itself.  `endlessWanted` only signals that intent to the caller.
        rid: ridOf,
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
  async function runThroughput({ seconds = 12, speed = 8, startRun = true, perf = true } = {}) {
    const wasPerf = TSW.perf.active, wasSpeed = TSW.speed.get(), wasMode = TSW.auto.mode;
    // perf=0 measures the mode OFF, so "does performance mode help" becomes a
    // number instead of a claim.  It used to be unconditional.
    if (perf && !wasPerf) TSW.perf.enable();
    else if (!perf && wasPerf) TSW.perf.disable();
    if (startRun) ensureInRun();
    await new Promise((r) => setTimeout(r, 1500)); // let the run spin up
    TSW.auto.setMode('combat'); // hold position, shoot anything near
    TSW.speed.set(speed, true);
    const g0 = window.__achroma.G;
    const inRun = !!(g0.p && g0.state === 'play');
    const m = await measureTicks(seconds * 1000);
    TSW.speed.set(wasSpeed, true); if (wasMode === 'off') TSW.auto.setMode('off');
    if (!wasPerf) TSW.perf.disable();
    else if (!perf) TSW.perf.enable();
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

  // ---- shared hurtPlayer wrapper --------------------------------------------
  // Every scenario that wants damage attribution installs this once.  It snapshots
  // the state BEFORE the hit resolves and records whether the hit actually landed
  // (i-frames, dashes and shields all return early), plus whether an enemy body
  // was in contact range at that moment.  Without the post-state a "hit" that
  // merely ate a frame of i-frames is indistinguishable from real hp loss, and
  // without the contact flag "plain damage" is unattributable.
  function installHurtLog() {
    try {
      if (window.__hurtWrap) return;
      window.__hurtWrap = true;
      const orig = window.hurtPlayer;
      if (typeof orig !== 'function') return;
      window.hurtPlayer = function (dmg, sx, sy, mechHit, pierce) {
        const pre = (function () {
          try { const q = __achroma.G.p; return { hp: q.hp | 0, ar: q.armor | 0, ma: q.maxArmor | 0, inv: +(q.inv || 0).toFixed(2), dash: +(q.dashT || 0).toFixed(2), lastHit: +(q.lastHit || 0).toFixed(2) }; }
          catch (e) { return {}; }
        })();
        let r;
        try { r = orig.apply(this, arguments); } catch (e) { throw e; }
        try {
          const q = __achroma.G.p, gg = __achroma.G;
          let nearN = 0, nearType = '', nearD = 999, nearRanged = 0;
          for (const e of (gg.enemies || [])) {
            if (!e || e.dead || e.spawnT > 0) continue;
            const dd = Math.hypot(e.x - q.x, e.y - q.y) - (e.r || 4) - (q.r || 4);
            if (dd < nearD) { nearD = dd; nearType = e.type || ''; nearRanged = e.ranged || e.shot ? 1 : 0; }
            if (dd < 6) nearN++;
          }
          window.__hurtLog.push({
            d: dmg, p: +!!pierce, m: +!!mechHit, at: (window.__achroma && __achroma.G.time) | 0,
            hp: pre.hp, ar: pre.ar, ma: pre.ma, inv: pre.inv, dash: pre.dash,
            php: q.hp | 0, par: q.armor | 0,
            res: (r === true) ? 1 : 0,
            n: nearN, nt: nearType, nd: Math.round(nearD), nr: nearRanged,
          });
        } catch (e) { }
        return r;
      };
    } catch (e) { }
  }

  async function runFullRun({ speed = 8, seed = null, policy = 'bloom', goalDepth = 1, timeoutS = 900, diff = 'classic', mods = null, ticks = null, boost = null, autoOpts = null, gameSeconds = 0, abortOn = null } = {}) {
    // Enable the deterministic clock; it used to be merely READ here, so fullrun
    // ran on real frame time.  Measured: the same seed twice gave rooms 1 vs 2 and
    // kills 234 vs 142, which is the entire five-lock history being unreproducible.
    const detWas = !!(TSW.det && TSW.det.on);
    const detMode = !(autoOpts && autoOpts.det === false);
    if (detMode) TSW.det.enable();
    const detT0 = detMode ? (TSW.det.ticks || 0) : 0;   // per-run baseline
    // log every hurtPlayer call (dmg, pierce, mechHit) so death causes are visible
    installHurtLog();
    try { window.__hurtLog = []; } catch (e) { }
    const wasSpeed = TSW.speed.get(), wasPolicy = TSW.auto.policy, wasRestart = TSW.auto.opts.autoRestart, wasDiff = SET.diff;
    // Per-run autopilot overrides.  This exists because same-session A/B is not
    // trustworthy here: a second inner run inside one session stalls (measured:
    // run 1 died at gameT 422, run 2 "timed out" at gameT 9), so paired trials are
    // driven as separate interleaved processes instead.
    const optSaved = {};
    const optUnknown = [];
    if (autoOpts && typeof autoOpts === 'object') for (const [k, v] of Object.entries(autoOpts)) {
      if (k in TSW.auto.opts) { optSaved[k] = TSW.auto.opts[k]; TSW.auto.opts[k] = v; }
      else { optUnknown.push(k); TSW.err('fullrun: unknown autoOpts ignored → ' + k); }
    }
    if (seed != null) TSW.rng.seed(seed);
    TSW.auto.setPolicy(policy);
    TSW.auto.opts.autoRestart = false;
    // The workshop now defaults every master switch to OFF (so a player opening
    // the page gets no autopilot).  That is correct for a human and fatal for a
    // measurement: nothing drives the card picker, the run freezes in
    // G.state='cards' and gameT stops advancing, so a run of 60 game-seconds
    // never ends and the harness reports "no result".
    // Measured: runT 21.6 -> 46.8 -> frozen at 46.8 with state='cards'.
    // A benchmark must always drive its own modals, so this is forced on here,
    // after any caller-supplied autoOpts has been applied.
    // Every income/growth switch defaults to OFF so a human's run does not
    // silently spend ink.  A benchmark must be allowed to grow, or it measures a
    // bot that never upgrades (five-lock showed wlv {} and shardN 0 on 2 of 3
    // seeds, still holding the starting nail after 400 game-seconds).
    //
    // BUT: forcing must not override an EXPLICIT request, or an A/B on these
    // switches becomes impossible.  That is exactly what happened: a labSerum
    // A/B asked for false, the forcing code set it true anyway, and both arms ran
    // the same configuration while printing a plausible-looking result
    // (benchmark.md 186½).  Now "forced" means "defaulted unless asked".
    const forced = { autoCards: true, shop: true, forge: true, labSerum: true };
    const askedFor = (autoOpts && typeof autoOpts === 'object') ? autoOpts : {};
    for (const [k, v] of Object.entries(forced)) {
      if (!(k in askedFor)) TSW.auto.opts[k] = v;
    }
    TSW.auto.setMode('full');
    TSW.speed.set(speed, true);
    const M = TSW.metrics;
    M.reset();
    // start a fresh run: either the game's own launchRun() or (with modifiers)
    // a crafted save resumed through the game's loader
    await waitScripts();
    startRunWith({ diff, mods, boost, seed });
    // Endless must be ENTERED, not merely recorded in a save.  G.endless is just
    // a counter; the endless floor is built by startEndless() ->
    // beginFloorTransition(endlessFloor()).  Writing endless:1 into a save left
    // the bot on an ordinary floor and it died in 13-15 s with zero kills
    // (benchmark.md 182).  This calls the game's own entry point instead.
    let endlessEntry = null;
    if (boost && boost.endless) {
      try {
        // Wait for the resumed run to actually be in 'play' before entering
        // endless. A fixed 600 ms was not enough on a cold page: measured, the
        // same boost produced floor 2 in one probe and floor 0 in another, i.e.
        // startEndless ran before G existed and silently did nothing.
        let ws2 = performance.now();
        while (performance.now() - ws2 < 12000) {
          const gg = window.__achroma && window.__achroma.G;
          if (gg && gg.state === 'play' && gg.p) break;
          await new Promise((r) => setTimeout(r, 100));
        }
        if (typeof startEndless === 'function') startEndless();
        else console.warn('[bench] startEndless is not defined — endless entry skipped');
        // confirm it took: endless set and the floor actually moved
        // WAIT FOR THE FLOOR TRANSITION.  startEndless sets the counter and starts a
        // transition; it does not finish it. Measured: right after the call the game
        // was at state 'trans' with floor still 0 on seed 5 but floor 4 on seed 1,
        // purely because seed 5's transition was slower. The entry only counts once
        // the new floor is actually playing.
        {
          let wt = performance.now();
          while (performance.now() - wt < 15000) {
            const gg2 = window.__achroma && window.__achroma.G;
            if (gg2 && gg2.state === 'play' && (gg2.floor | 0) > 0) break;
            await new Promise((r) => setTimeout(r, 100));
          }
        }
        const g2 = window.__achroma && window.__achroma.G;
        // console, not TSW.log: TSW.log is swallowed by the headless log capture,
        // which is why "why did seed 5 stay on floor 0" was invisible.
        // Record it in the ROW, not just the console: headless log capture never
        // showed the page's console output, which is why "why is floor 0" stayed
        // invisible across several runs.
        endlessEntry = g2
          ? { endless: (g2.endless | 0), floor: (g2.floor | 0), hp: g2.p ? (g2.p.hp + '/' + g2.p.maxHp) : '?',
              shards: JSON.stringify(g2.p && g2.p.shards ? g2.p.shards : {}), state: g2.state }
          : { missing: true };
      } catch (e) { TSW.err('endless entry', e); }
    }
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
    let maxFloor = 0;   // deepest floor reached (floor at end can be reset by death)
    // Rooms are rebuilt per floor, so "cleared" only reflects the CURRENT floor.
    // Accumulate across floors, otherwise a run that swept floor one and moved on
    // reports zero.
    window.__roomsDone = 0; window.__floorSeen = -1; window.__floorDone = 0;
    window.__bossMaxHp = 0; window.__bossMinHp = undefined; window.__bossHits = 0;
    window.__firstBossT = undefined; window.__bossEntry = null;
    // ---- boss fight timeline (harness-side, survives the fight's own state) ----
    // Reading "how long did the boss fight last" out of bossMaxHp alone is
    // impossible: the hp floor never says WHEN.  Track the first sighting, the
    // last sighting, and the deepest hp on the way, so both length and result
    // are measured even if the run dies mid-fight.
    window.__bossT = null;
    // ---- time decomposition ----------------------------------------------
    // "33-48 seconds per room" is the number to attack, but it lumps fights,
    // travel and stalls together.  Split it so the optimisation targets the
    // part that actually dominates.
    window.__tDecomp = { combat: 0, travel: 0, idle: 0, paused: 0, t: 0 };
    // Wave bookkeeping: room waves are 2-4 per room with a mandatory inter-wave
    // gap (game.js:184,199), which is a fixed cost that does not shrink with dps.
    window.__waves = { count: 0, gapS: 0, rooms: 0, wavesPerRoom: [], dryS: 0, lastKillT: 0, t: 0 };
    // Counting wave boundaries from the monitor loop missed most of them because
    // the gap is only .5-1s.  Wrap spawnWave directly — it runs once per wave.
    // Wrap hitEnemy to see WHERE output is being lost: attempts rejected because
    // the body is dead / spawn-invulnerable / death-fight / iframe, versus hits
    // that land but get eaten by a shield.
    window.__hits = { try: 0, land: 0, dead: 0, spawn: 0, dfight: 0, inv: 0, shield: 0 };
    try {
      if (!window.__hitWrap && typeof hitEnemy === 'function') {
        window.__hitWrap = true;
        const origHit = hitEnemy;
        window.hitEnemy = function (e, dmg, o) {
          try {
            const H = window.__hits;
            H.try++;
            if (!e) return origHit.apply(this, arguments);
            if (e.dead) H.dead++;
            else if (e.spawnT > 0) H.spawn++;
            else if (e.deathFightLeft > 0) H.dfight++;
            else if (e.inv > 0) H.inv++;
            // MEASURE THE DAMAGE THAT ACTUALLY LANDED, not the damage requested.
            // hitEnemy can return true while the enemy absorbs it (shield), and a
            // 5.4x stronger weapon changed neither the real output nor the room
            // count (benchmark.md 171), so the missing piece is here: what the
            // enemy's hp actually lost per call.
            const hpBefore = e.hp;
            const r = origHit.apply(this, arguments);
            if (r === 'block') H.shield++;
            else if (r) {
              H.land++;
              const lost = hpBefore - (e.hp || 0);
              if (lost > 0) { H.dmgReal = (H.dmgReal || 0) + lost; H.landReal = (H.landReal || 0) + 1; }
            }
            return r;
          } catch (err) { return origHit.apply(this, arguments); }
        };
      }
    } catch (e) { }
    try {
      if (!window.__waveWrap && typeof spawnWave === 'function') {
        window.__waveWrap = true;
        const origWave = window.spawnWave || spawnWave;
        window.spawnWave = function (r) {
          try {
            window.__waves.count++;
            if (r && r.waves) window.__waves.wavesPerRoom.push(r.waves.length + 1);
          } catch (e) { }
          return origWave.apply(this, arguments);
        };
      }
    } catch (e) { }
    // ---- black box: per-game-second snapshots, rolled inside the harness ------
    // The trace above only keeps the LAST 8 hurtPlayer calls, which answers
    // "where did we die" but not "why did we die there".  To get the second
    // question without hand-editing the game, sample the live state once per
    // game second and keep a rolling window, so a post-mortem can look at the
    // last seconds of any run.
    window.__bb = { ring: [], lastT: -1 };
    window.__bbHook = TSW.hooks.beforeTick(() => {
      try {
        const g = window.__achroma && __achroma.G;
        if (!g || !g.p || g.state !== 'play') return;
        const t = g.runT || 0;
        const bb = window.__bb;
        if (t - bb.lastT < 1) return;
        bb.lastT = t;
        const p = g.p;
        const foes = (g.enemies || []).filter((e) => e && !e.dead && e.spawnT <= 0);
        let minFoe = 999;
        for (const e of foes) { const d2 = Math.hypot(e.x - p.x, e.y - p.y) - (e.r || 0) - (p.r || 0); if (d2 < minFoe) minFoe = d2; }
        const b = (g.boss && !g.boss.dead) ? g.boss : null;
        bb.ring.push({
          t: +t.toFixed(1),
          hp: p.hp, ar: p.armor, maxAr: p.maxArmor, inv: +(p.inv || 0).toFixed(2),
          x: Math.round(p.x), y: Math.round(p.y),
          // how many enemies are literally inside hurt range of the player
          close: foes.filter((e) => Math.hypot(e.x - p.x, e.y - p.y) < (e.r || 4) + 8).length,
          foes: foes.length, minFoe: Math.round(minFoe),
          mode: (window.__TSW && TSW.auto && TSW.auto._fightState) || '',
          note: (window.__TSW && TSW.auto && TSW.auto.status && TSW.auto.status.note) || '',
          // what autopilot was actually walking at.  Without this a frozen
          // player is unattributable: the note is empty whenever no special
          // objective owns the tick, which is exactly the soft-lock case
          // (measured: 40-44 s parked in place with no foes and no note).
          tgt: (window.__TSW && TSW.auto && TSW.auto.status && TSW.auto.status.target) || null,
          dash: +(p.dashT || 0) > 0 ? 1 : 0,
          boss: b ? { hp: Math.round(b.hp), atk: b.atk || '', ph: b.phase || 0 } : null,
        });
        if (bb.ring.length > 90) bb.ring.shift();
      } catch (e) { }
    });
    // ---- run scoring -------------------------------------------------------
    // Progress is DECISIVE.  Damage taken contributes a negative term integrated
    // over time: the square of what was consumed, hp weighted heavier than armour.
    let scorePenalty = 0, prevHp = null, prevArmor = null, prevT = 0;
    const HP_W = 3.0, ARM_W = 1.0;      // hp loss hurts more than shield loss
    window.__forgeSeen = 0;
    const wd = setInterval(() => {
      const g = G(); if (!g || !g.p) return;
      // integrate the squared loss-rate penalty (per second, dt-aware)
      try {
        const p = g.p;
        if (p) {
          const t = g.runT || 0, dtr = Math.max(.05, Math.min(2, t - prevT));
          if (prevHp !== null) {
            const dHp = Math.max(0, prevHp - p.hp);
            const dAr = Math.max(0, prevArmor - p.armor);
            if (dHp || dAr) scorePenalty += (HP_W * dHp * dHp + ARM_W * dAr * dAr) * dtr;
          }
          prevHp = p.hp; prevArmor = p.armor; prevT = t;
        }
      } catch (e) { }
      // The most reliable "we are in the boss room" signal is the boss object
      // itself existing with health: WORLD.boss.visited is not set by the unlock
      // path, which is why the first version always reported -1.
      // "dry time": inside an active room with foes alive but no kill landed for
      // a while.  A wave takes 27-38s; if most of it is dry, the bot is waiting
      // rather than fighting and the fix is engagement, not damage.
      try {
        const wv = window.__waves;
        const act = !!(g.boss && !g.boss.dead)
          || (typeof WORLD !== 'undefined' && WORLD && WORLD.rooms && WORLD.rooms.some((r) => r.active))
          || !!g.trial;
        const live = (g.enemies || []).filter((e) => !e.dead).length;
        const dt3 = Math.max(.05, Math.min(2, (g.runT || 0) - (wv.t || 0)));
        wv.t = g.runT || 0;
        const k = g.kills | 0;
        if (k !== wv.lastK) { wv.lastK = k; wv.lastKillT = g.runT || 0; }
        // THE EFFICIENCY METRIC.  actual dps is only 42% of the weapon's own
        // sustained dps, and the interesting half of that gap is time with a live
        // target where the trigger is NOT held.  Split every combat second into:
        //   liveFiring  - enemies alive and the trigger held (productive)
        //   liveIdle    - enemies alive but not firing   <- the fixable loss
        //   noFoes      - nothing to shoot (not the bot's fault)
        if (act) {
          wv.combatT = (wv.combatT || 0) + dt3;
          if (live > 0) {
            // Input.down stays TRUE while reloading, so "trigger held" is not
            // "bullets leaving".  Count a round actually being chambered instead:
            // p.ammo[held].rl > 0 means reloading.  Without this split the metric
            // reports ~86% firing while real output is 33% of sustained dps, which
            // is nonsense on its face.
            let reloading = false;
            try {
              const heldId = g.p.weapons[g.p.wi | 0];
              const a2 = g.p.ammo && g.p.ammo[heldId];
              reloading = !!(a2 && a2.rl > 0);
            } catch (e) { }
            if (Input && Input.down && !reloading) wv.liveFiring = (wv.liveFiring || 0) + dt3;
            else if (reloading) wv.liveReload = (wv.liveReload || 0) + dt3;
            else wv.liveIdle = (wv.liveIdle || 0) + dt3;
          } else wv.noFoes = (wv.noFoes || 0) + dt3;
        }
        if (act && live > 0 && (g.runT || 0) - (wv.lastKillT || 0) > 1.5) {
          wv.dryS += dt3;
          // is the trigger held during the dry stretch, or is the bot simply not
          // shooting?  That splits "aimed wrong" from "never fired".
          if (Input && Input.down) wv.dryFiring = (wv.dryFiring || 0) + dt3;
          else wv.dryIdle = (wv.dryIdle || 0) + dt3;
        }
      } catch (e) { }
      // accumulate cleared combat/boss rooms per floor
      try {
        const fl = g.floor | 0;
        const cur = (WORLD && WORLD.rooms) ? WORLD.rooms.filter((r) => r.cleared && (r.type === 'combat' || r.type === 'boss')).length : 0;
        const mx = Math.max(cur, (fl === window.__floorSeen) ? window.__floorDone : 0);
        if (fl !== window.__floorSeen) {
          window.__roomsDone = (window.__roomsDone || 0) + (window.__floorDone || 0);
          window.__floorSeen = fl; window.__floorDone = cur;
        } else { window.__floorDone = mx; }
      } catch (e) { }
      try {
        const dc = window.__tDecomp;
        if (dc) {
          const act = !!(g.boss && !g.boss.dead)
            || (typeof WORLD !== 'undefined' && WORLD && WORLD.rooms && WORLD.rooms.some((r) => r.active))
            || !!g.trial;
          // Cap only runaway gaps (a tab stall), not normal long intervals: at
          // 8x speed the monitor can be several game-seconds apart, and clamping to
          // 2 lost most of those, so a 752s run only accounted for 475s.
          const raw = (g.runT || 0) - (dc.t || 0);
          const dt2 = raw < 0 ? 0 : (raw > 30 ? 30 : raw);
          dc.t = g.runT || 0;
          // Non-play states used to fall through every bucket, so a run reporting
          // 2696 seconds only accounted for 1315 of them.  Transitions, dialogue
          // and shop screens are their own category: they are time the player
          // cannot fight, and they are a large share of a long run.
          const st2 = g.state || 'play';
          if (st2 !== 'play' && st2 !== 'dead') dc.paused += dt2;
          else if (act) dc.combat += dt2;
          else {
            const p3 = g.p || {};
            const moving = Math.abs(p3.vx || 0) + Math.abs(p3.vy || 0) > 12;
            if (moving) dc.travel += dt2;
            else {
              dc.idle += dt2;
              // WHY is it idle?  "43% idle" is not actionable; "43% idle while
              // the note said X and the target was Y" is.  Bucket the idle seconds
              // by (note, target) so the biggest contributor is visible.
              try {
                const A2 = TSW.auto, st3 = (A2 && A2.status) || {};
                // Include WHY the bot thinks it cannot act: the item it is parked
                // on, and whether the pick-up handler would refuse it.
                let extra = '';
                try {
                  // Widen the radius and consider EVERY interactable: the stall may
                  // be on a prism, a seal or a door rather than the weapon the
                  // target label mentions first.
                  const pp = g.p || {};
                  const near = (g.inter || []).filter((x) => !x.used && Math.hypot(x.x - pp.x, x.y - pp.y) < 40);
                  if (near.length) {
                    extra = ' [' + near.slice(0, 3).map((x) => x.kind + (x.id ? ':' + x.id : '') + '@' + Math.round(Math.hypot(x.x - pp.x, x.y - pp.y))).join(',') + ']';
                  } else {
                    // nothing within 40px: record where it is standing instead, so a
                    // stuck position is still identifiable
                    // Nothing nearby yet the note says "arrived": the TARGET POINT
                    // itself is wrong. Record it so the wrong objective is visible.
                    let tp = '?';
                    try { tp = A2 && A2._objCache && A2._objCache.tgt && A2._objCache.tgt.pt ? A2._objCache.tgt.pt.map(Math.round).join(',') : 'none'; } catch (e) { }
                    extra = ' [pos=' + Math.round(pp.x) + ',' + Math.round(pp.y) + ' tpt=' + tp + ' inter=' + (g.inter || []).length + ']';
                  }
                } catch (e) { }
                const kb = (st3.note || '(no note)') + ' | ' + (st3.target || '(no target)') + extra;
                dc.idleBy = dc.idleBy || {};
                dc.idleBy[kb] = (dc.idleBy[kb] || 0) + dt2;
              } catch (e) { }
            }
          }
        }
      } catch (e) { }
      try {
        if (window.__firstBossT === undefined && g.boss && g.boss.maxHp > 0) {
          window.__firstBossT = g.runT || 0;
          // Snapshot the state at the moment the boss room is entered: these are
          // the PROCESS numbers that explain WHY it took that long, which a result
          // metric cannot answer on its own.
          const p2 = g.p || {};
          window.__bossEntry = {
            // Reward rooms are BORN cleared (world.js:59: cleared = type !== 'combat'
            // && type !== 'boss'), so counting every cleared room reports progress
            // that never happened and made a healthy run look pinned at 1 room.
            // Only combat and boss rooms are progress.
            roomsCleared: (function () { try { return (WORLD.rooms || []).filter((r) => r.cleared && (r.type === 'combat' || r.type === 'boss')).length; } catch (e) { return -1; } })(),
            roomsTotal: (function () { try { return (WORLD.rooms || []).length; } catch (e) { return -1; } })(),
            ink: g.ink | 0,
            dps: (function () { try {
              const volley = !!(g.S && g.S.volley); let d = 0;
              for (let i = 0; i < p2.weapons.length; i++) {
                const w = WEAPONS[p2.weapons[i]]; if (!w) continue;
                const lv = (p2.wlv && p2.wlv[w.id]) | 0;
                let one = (w.dmg || 0) * (w.rate || 1) * (w.n || 1) * (1 + .25 * lv);
                if (i !== (p2.wi | 0)) one *= volley ? .12 : 0;
                d += one;
              } return Math.round(d);
            } catch (e) { return 0; } })(),
            shards: Object.keys((p2.shards) || {}).length,
            hp: p2.hp | 0, maxHp: p2.maxHp | 0,
          };
        }
      } catch (e) { }
      try {
        const b = g.boss && !g.boss.dead ? g.boss : null;
        if (b) {
          if (!window.__bossMaxHp || b.maxHp > window.__bossMaxHp) window.__bossMaxHp = b.maxHp;
          if (window.__bossMinHp === undefined || b.hp < window.__bossMinHp) window.__bossMinHp = b.hp;
        }
        try {
          const try_ = window.__bossT;
          const tNow = g.runT || 0;
          if (b) {
            if (!try_) window.__bossT = { t0: tNow, tLast: tNow, hpMin: b.hp, hpMax: b.maxHp, dead: false, ar0: g.p.armor, hp0: g.p.hp, t0arm: null, s0arm: 0 };
            else {
              const dtb = Math.max(0, Math.min(30, tNow - (try_.tLast || tNow)));
              try_.tLast = tNow; if (b.hp < try_.hpMin) try_.hpMin = b.hp;
              // endurane accounting inside the fight: total damage absorbed and how
              // long we spent with NO armour left (the state the bot dies in).
              if (g.p.armor <= 0) try_.s0arm = +(try_.s0arm + dtb).toFixed(1);
              const dA = Math.max(0, (try_.pAr === undefined ? g.p.armor : try_.pAr) - g.p.armor);
              const dH = Math.max(0, (try_.pHp === undefined ? g.p.hp : try_.pHp) - g.p.hp);
              try_.arLost = +( (try_.arLost || 0) + dA).toFixed(0);
              try_.hpLost = +( (try_.hpLost || 0) + dH).toFixed(0);
            }
            try_.pAr = g.p.armor; try_.pHp = g.p.hp;
          } else if (try_ && !try_.dead) {
            // the boss object vanished while we were still alive: it died
            const whither = (g.floors && g.floor !== undefined) ? '' : '';
            try_.dead = true; try_.tLast = try_.tLast || tNow;
          }
        } catch (e) { }
      } catch (e) { }
      if ((g.floor | 0) > maxFloor) {
        maxFloor = g.floor | 0;
        try {
          const W = (typeof WORLD !== 'undefined') ? WORLD : null;
          if (W && W.rooms) window.__forgeSeen += W.rooms.filter((r) => r.type === 'forge').length;
        } catch (e) { }
      }
      // NB: the player's position must be part of the signature.  Without it, a bot
      // that is walking (e.g. crossing a large floor to reach the next room) shows
      // NO observable change for 30s and gets killed as "stuck" — which is exactly
      // what the hurt-trace showed on every "failed" run (dmg=999, pierce, mech).
      const sig = [g.state, g.kills | 0, g.ink | 0, g.floor, g.endless | 0,
        g.enemies.filter((e) => !e.dead).length,
        Math.round(g.p.x / 24), Math.round(g.p.y / 24), g.p.hp | 0, g.p.armor | 0].join(',');
      if (sig === lastSig) {
        if (g.state === 'play' && performance.now() - lastSigT > 30000) {
          try { hurtPlayer(999, g.p.x, g.p.y, true, true); } catch (e) { }
          TSW.log('watchdog: stuck run ended');
          lastSigT = performance.now();
        }
      } else { lastSig = sig; lastSigT = performance.now(); }
    }, 1000);
    // ---- 局部指标采样 ----------------------------------------------------------
    // Whole-run gameT has SD 147-208s, so a +50s change needs ~35 pairs.  Room
    // clear times give hundreds of samples per run with far lower variance, and
    // "kills per 100 game-seconds" is scale-free.  Both are used for A/B.
    const roomT = new Map();          // room id -> {t0, dur}
    const clears = [];
    let lastK = 0, lastT = 0, kRate = [];
    const sampler = setInterval(() => {
      try {
        const g = G(); if (!g || !g.p || g.state !== 'play') return;
        const rooms = (typeof WORLD !== 'undefined' && WORLD && WORLD.rooms) ? WORLD.rooms : [];
        const now = g.runT || 0;
        for (const r of rooms) {
          const id = r.id != null ? r.id : (r.cx + ':' + r.cy);
          if (r.active && !roomT.has(id)) roomT.set(id, { t0: now });
          else if (!r.active && r.cleared && roomT.has(id)) {
            const d = now - roomT.get(id).t0;
            if (d > 0.4 && d < 600) clears.push(+d.toFixed(1));
            roomT.set(id, { done: true });
          }
        }
        // rolling kill rate per 100 game-seconds
        if (now - lastT >= 10) {
          const dk = (g.kills | 0) - lastK, dt = now - lastT;
          if (dt > 0) kRate.push(dk / dt * 100);
          lastK = g.kills | 0; lastT = now;
        }
      } catch (e) { }
    }, 250);
    // A tick is one 60 Hz frame = 1/60 game-second.  Derive the budget from
    // --game-seconds; the old line read only `ticks` and fell back to a hardcoded
    // 18000 (= 300 game-seconds) no matter what --game-seconds said, so every
    // "400 second" five-lock run silently stopped at 300.
    const tickBudget = detMode
      ? Math.round(ticks || (gameSeconds ? gameSeconds * 60 : 18000))
      : 0;
    // --timeout is expressed in WALL seconds, but the browser only reaches ~4x
    // realtime even at speed 8 (measured gameT/wall = 3.29-4.68 over 11 runs).
    // A full despair five-lock run needs 2500+ game-seconds, so the documented
    // --timeout 200 silently cut the second half off: runs that were 11 s short
    // of killing the boss (2.8 percent left) were recorded as "timeout" and read
    // as failures.  --game-seconds makes the budget meaningful; --timeout still
    // works as a hard wall ceiling for a hung browser.
    const gameBudget = +(gameSeconds || 0);
    let ticksAtStop = null;          // hoisted: the row builder below needs it
    const res = await new Promise((resolve) => {
      // TICK-BASED STOP.  This used to be a 500 ms setInterval polling the tick
      // count, so a run always overshot its budget by however many ticks fit in
      // the next half second — and that amount depends on the machine's frame
      // rate.  Measured: two identical seeds produced 18109 and 18030 ticks, which
      // is why five-lock runs diverged (rooms 2 vs 0) even with the det clock on.
      // Checking inside beforeTick makes the cut exact.
      let stopHook = null, settled = false;
      const finish = (aborted) => {
        if (settled) return; settled = true;
        // Snapshot the tick count AT THE CUT.  The row used to read TSW.det.ticks
        // after everything unwound, by which point the game's rAF loop had run a
        // few more frames — that is where the 24005/24006/24010 spread came from,
        // and a five-tick spread is enough to flip a threshold and send two
        // otherwise-identical runs down different paths.
        ticksAtStop = (TSW.det && TSW.det.ticks) || 0;
        try { if (stopHook) { stopHook(); stopHook = null; } } catch (e) { }
        clearInterval(iv);
        const g0 = G();
        // The abort rule must stay explicit here: an aborted run is NOT a timeout.
        resolve({ end: aborted ? 'aborted' : (g0.state === 'dead' ? 'death' : g0.state === 'win' ? 'ascend' : (detMode && (TSW.det.ticks - detT0) >= tickBudget ? 'goal' : 'timeout')), wall: (performance.now() - t0) / 1000, aborted });
      };
      // exact cut: evaluated once per simulated tick, not once per 500 ms of wall
      if (detMode && tickBudget > 0) {
        stopHook = TSW.hooks.beforeTick(() => { if ((TSW.det.ticks - detT0) >= tickBudget) finish(false); });
      }
      const iv = setInterval(() => {
        const g = G(), wall = (performance.now() - t0) / 1000;
        const ticksDone = (TSW.det && TSW.det.on && TSW.det.ticks) ? (TSW.det.ticks - detT0) : 0;
        // --abort-on makes the two strict evaluation rules expressible without
        // changing the default run:
        //   alphaHp  : any hp loss while an experimental serum α is active
        //              (α takes losses out of MAX hp, so one hit is permanent)
        //   zeroArmor: armour reached 0 and stayed 0 for a moment
        // Without these a "did it survive" experiment silently measures a
        // different question than the one asked.
        let aborted = false;
        if (abortOn) {
          try {
            const p2 = g.p;
            if (abortOn === 'alphaHp' && g.exp && g.exp.id === 'a' && (g.exp.left | 0) > 0) {
              if ((window.__abortHp0 === undefined)) window.__abortHp0 = p2.hp;
              else if (p2.hp < window.__abortHp0) aborted = true;
            } else if (abortOn === 'zeroArmor') {
              if ((p2.maxArmor | 0) > 0 && (p2.armor | 0) <= 0) { window.__zeroArmT = (window.__zeroArmT || 0) + 1; if (window.__zeroArmT >= 4) aborted = true; }
              else window.__zeroArmT = 0;
            }
          } catch (e) { }
        }
        const done = aborted || (g.state === 'dead') || (g.endless >= goalDepth) || (g.state === 'win')
          || (detMode && ticksDone >= tickBudget);
        // The wall backstop must never be the thing that ends a healthy run: a
        // 900 game-second budget was cut at wall=774 (= 900*0.66+180, the old
        // formula's number) while the game had only reached 221 s, i.e. this
        // machine delivered 0.29x realtime, not the 0.66x the formula assumed.
        // A truncated run is indistinguishable from a failed one, so the ratio is
        // now deliberately pessimistic: 0.25 game-seconds per wall-second plus a
        // generous constant. The hard ceiling still bounds a hung browser.
        const ranOut = (gameBudget > 0)
          ? ((g.runT || 0) >= gameBudget || wall > gameBudget * 4 + 300)
          : wall > timeoutS;
        if (done || ranOut) {
          finish(aborted);
          return;
        }
      }, 500);
    });
    clearInterval(wd); clearInterval(sampler);
    try { if (window.__bbHook) { window.__bbHook(); window.__bbHook = null; } } catch (e) { }
    TSW.auto.setMode('off');
    TSW.auto.opts.autoRestart = wasRestart;
    // Capture the flags THIS run actually ran with BEFORE restoring them.  The
    // row used to read TSW.auto.opts after the restore below, so every row
    // reported the defaults no matter which arm it belonged to: an A/B that set
    // a flag to false was indistinguishable from the arm that left it true.
    const appliedOpts = {};
    try { for (const k of Object.keys(autoOpts || {})) appliedOpts[k] = TSW.auto.opts[k]; } catch (e) { }
    for (const [k, v] of Object.entries(optSaved)) TSW.auto.opts[k] = v;
    TSW.auto.setPolicy(wasPolicy);
    TSW.speed.set(wasSpeed, true);
    SET.diff = wasDiff; saveSettings();
    TSW.rng.clear();
    if (!detWas) TSW.det.disable();            // leave the clock as we found it
    const g = G();
    return {
      kind: 'fullrun', at: Date.now(), speed, seed, policy, goalDepth, diff,
      // what THIS run actually ran with, and what the caller asked for.  Both are
      // recorded because they can disagree (an unknown key is refused, not applied).
      autoOpts: appliedOpts,
      autoOptsRequested: (function () { try { return Object.assign({}, autoOpts || {}); } catch (e) { return {}; } })(),
      // keys the caller asked for that autopilot does not declare: if this is
      // non-empty the two arms ran the same code and the pair is worthless.
      autoOptsUnknown: optUnknown.slice(),
      // 0 = unbounded by game time (the wall ceiling still applies)
      gameSeconds,
      autoOptsDefault: { bossBodyDanger: TSW.auto.opts.bossBodyDanger, plateWeight: TSW.auto.opts.plateWeight, armorWaitT: TSW.auto.opts.armorWaitT },
      det: !!detMode, ticks: ticksAtStop ?? ((TSW.det && TSW.det.ticks) || 0),
      modifiers: modsEarly,
      modifiersAtEnd: (window.__achroma.G && __achroma.G.modifiers) || [],
      end: res.end, wall: +res.wall.toFixed(1),
      // what strict rule ended the run, so 'aborted' is never mistaken for a timeout
      abortOn: abortOn || null,
      gameT: +g.runT.toFixed(0), floor: g.floor, maxFloor: maxFloor, depth: g.endless | 0,
      endlessEntry,
      // The endgame the objectives actually ask for: endless depth × modifiers ×
      // damage-free × full pickups.  Each term is recorded separately so the
      // composite is auditable instead of a single opaque score.
      //   hpLostTotal : how many hp points were lost (0 = a damage-free run;
      //                 armour absorption is NOT damage and does not count)
      //   pickups     : serums taken, the "满增益" half
      //   mods5       : all five despair modifiers were active at the end
      hpLostTotal: (function () { try { return (window.__hurtLog || []).reduce((a, x) => a + Math.max(0, (x.hp || 0) - (x.php === undefined ? x.hp : x.php)), 0); } catch (e) { return 0; } })(),
      pickups: (function () { try { return (g.p ? (g.p.shards ? Object.keys(g.p.shards).length : 0) : 0) + (window.__orbs | 0); } catch (e) { return 0; } })(),
      mods5: (Array.isArray(modsEarly) && modsEarly.length >= 5 && Array.isArray((window.__achroma.G || {}).modifiers) && window.__achroma.G.modifiers.length >= 5) ? 1 : 0,
      kills: g.kills | 0, hits: g.hits | 0, dmg: Math.round(M.dmgTotal), stall: (TSW.auto.metrics && TSW.auto.metrics.navStall) | 0, replan: (TSW.auto.metrics && TSW.auto.metrics.navReplan) | 0,
      // where the damage actually comes from, from the hurtPlayer log
      hurtMechanic: (function () { try { return (window.__hurtLog || []).filter((x) => x.m).length; } catch (e) { return 0; } })(),
      hurtPierce: (function () { try { return (window.__hurtLog || []).filter((x) => x.p && !x.m).length; } catch (e) { return 0; } })(),
      hurtPlain: (function () { try { return (window.__hurtLog || []).filter((x) => !x.p && !x.m).length; } catch (e) { return 0; } })(),
      // WHO and HOW FAR.  "hurtPlain 160 / hurtDmg 160" says contact hits at
      // 1 damage each, but not whether they came from melee the bot walked into
      // or from ranged enemies it failed to dodge. Summarise the log instead of
      // leaving the next reader to re-derive it from a repro.
      hurtBy: (function () {
        try {
          const log = window.__hurtLog || [];
          const by = {};
          for (const x of log) {
            if (!x.res) continue;                       // only hits that landed
            const k = (x.nt || '?') + (x.nr ? '(ranged)' : '');
            by[k] = (by[k] || 0) + 1;
          }
          return by;
        } catch (e) { return {}; }
      })(),
      hurtDist: (function () {
        try {
          const log = (window.__hurtLog || []).filter((x) => x.res);
          if (!log.length) return null;
          const in6 = log.filter((x) => (x.nd == null ? 999 : x.nd) < 6).length;
          return { hits: log.length, within6px: in6, medianDist: log.map((x) => x.nd).sort((a, b) => a - b)[Math.floor(log.length / 2)] };
        } catch (e) { return null; }
      })(),
      hurtDmg: (function () { try { return Math.round((window.__hurtLog || []).reduce((a, x) => a + (x.d || 0), 0)); } catch (e) { return 0; } })(),
      // opening survival: damage taken in the first 30 game-seconds.  Half the
      // runs clear nothing at all, so the start is where they collapse.
      hurt30: (function () { try { return Math.round((window.__hurtLog || []).filter((x) => x.at <= 30).reduce((a, x) => a + (x.d || 0), 0)); } catch (e) { return 0; } })(),
      hits30: (function () { try { return (window.__hurtLog || []).filter((x) => x.at <= 30).length; } catch (e) { return 0; } })(),
      hpAt30: (function () {
        try {
          const L = (window.__hurtLog || []).filter((x) => x.at <= 30);
          return L.length ? L[L.length - 1].hp : -1;
        } catch (e) { return -1; } })(),
      navFail: (function () { try { return TSW.auto._navFail || {}; } catch (e) { return {}; } })(),
      roomFallback: (function () { try { return TSW.auto._roomFb | 0; } catch (e) { return 0; } })(),
      tgtSwitches: (function () { try { return TSW.auto._tgtSw | 0; } catch (e) { return 0; } })(),
      roomFallbackOK: (function () { try { return TSW.auto._roomFbOK | 0; } catch (e) { return 0; } })(),
      navFailWhy: (function () { try { return TSW.auto._navFailWhy || []; } catch (e) { return []; } })(),
      orbs: (g.floorOrbs | 0), shardN: Object.keys((g.p && g.p.shards) || {}).length,
      // damage inputs: weapon levels are the multiplicative part of DPS, shard
      // count is the additive part; totalDps is a cheap proxy used for ranking
      wlvAtEnd: (function () { try { return Object.assign({}, g.p && g.p.wlv); } catch (e) { return {}; } })(),
      forgeRoomsSeen: (window.__forgeSeen | 0),
      upgradesDone: (function () { try { const p = g.p; let n = 0; for (const k in (p && p.wlv) || {}) n += p.wlv[k]; return n; } catch (e) { return 0; } })(),
      // SUSTAINED dps: the same weapon but including its magazine and reload cycle.
      // dpsProxy (below) is "rate*dmg as if the trigger were held forever", which
      // overstated nail by 34% (42 vs 27.7) because 12 rounds at rate 5 empties in
      // 2.4 s and then reloads for 1 s.  Measured actual combat output was 13.1,
      // i.e. 29% of the proxy — two separate losses that were being conflated.
      dpsSustained: (function () {
        try {
          const p = g.p; if (!p || !p.weapons) return 0;
          const i2 = p.wi | 0; const id = p.weapons[i2]; const w = WEAPONS[id];
          if (!w) return 0;
          const lv = (p.wlv && p.wlv[id]) | 0;
          const rate = w.rate || 1, n = w.n || 1, mag = w.mag || 0, rl = w.reload || 0;
          const dmg = (w.dmg || 0) * (1 + .25 * lv);
          if (!mag || !rl) return +(dmg * rate * n).toFixed(1);   // no magazine: no reload
          const burst = mag / rate, cycle = burst + rl;
          return +((mag * dmg * n) / cycle).toFixed(1);
        } catch (e) { return 0; }
      })(),
      dpsProxy: (function () {
        try {
          const p = g.p; if (!p || !p.weapons) return 0;
          let dps = 0;
          // ONLY the held weapon fires at full rate.  The holstered one joins in
          // solely with the `volley` shard and even then at 40% damage and 30%
          // attack speed (shards3.js:50 offhandTick).  Summing both weapons at
          // full strength overstated real output by roughly 2x.
          const volley = !!(g.S && g.S.volley);
          for (let i = 0; i < p.weapons.length; i++) {
            const id = p.weapons[i]; const w = WEAPONS[id]; if (!w) continue;
            const lv = (p.wlv && p.wlv[id]) | 0;
            const rate = w.rate || 1, n = w.n || 1;
            let one = (w.dmg || 0) * rate * n * (1 + .25 * lv);
            if (i !== (p.wi | 0)) one *= volley ? (.4 * .3) : 0;
            dps += one;
          }
          for (const k in (p.shards || {})) dps *= 1.06;      // rough shard multiplier
          return Math.round(dps);
        } catch (e) { return 0; }
      })(),
      // end-of-run room state: which rooms were left (and whether they were
      // active) tells us whether a floor was blocked by an orphan room, by a
      // boss, or simply ran out of time.
      wcount: (function () { try { return (g.p && g.p.weapons ? g.p.weapons.length : 0); } catch (e) { return 0; } })(),
      endFloor: (g.floor | 0),
      // boss-room pipeline state at the end: did we ever hold a key / unlock?
      hasKeyAtEnd: (function () { try { return !!g.hasKey; } catch (e) { return null; } })(),
      bossLockedAtEnd: (function () { try { return (typeof WORLD !== 'undefined' && WORLD) ? !!WORLD.bossLocked : null; } catch (e) { return null; } })(),
      // boss health telemetry: maxHp freezes at spawn so the lowest observed hp
      // shows whether damage lands at all (a stalled boss keeps hp == maxHp)
      bossMaxHp: Math.round(window.__bossMaxHp || 0),
      bossMinHp: Math.round(window.__bossMinHp || 0),
      bossHitsLanded: (window.__bossHits | 0),
      // Continuous progress marker: seconds until the first boss room was entered.
      // A binary "cleared a floor" metric needs ~80 pairs to resolve a 20-point
      // difference; this number resolves far better per run. -1 = never reached.
      firstBossT: (window.__firstBossT === undefined ? -1 : Math.round(window.__firstBossT)),
      bossEntry: window.__bossEntry || null,
      // bossFight: harness-side wall/game clock of the first boss fight.  The
      // previous proxy (bossMaxHp vs bossMinHp) answers "did damage land" but not
      // "how long did we last", which is the number the big goal needs.
      bossFight: (function () {
        try {
          const b = window.__bossT;
          if (!b) return null;
          const len = Math.max(0, +((b.tLast || 0) - (b.t0 || 0)).toFixed(1));
          return { s: len, hpMax: Math.round(b.hpMax || 0), hpMin: Math.round(b.hpMin || 0), killed: !!b.dead,
            arLost: b.arLost || 0, hpLost: b.hpLost || 0, s0arm: b.s0arm || 0, arAtEntry: b.ar0, hpAtEntry: b.hp0 };
        } catch (e) { return null; }
      })(),
      // Every hp/armour point the run lost, straight from the post-hit state.
      hpTaken: (function () { try { return (window.__hurtLog || []).reduce((a, x) => a + Math.max(0, (x.hp || 0) - (x.php === undefined ? x.hp : x.php)), 0); } catch (e) { return 0; } })(),
      arTaken: (function () { try { return (window.__hurtLog || []).reduce((a, x) => a + Math.max(0, (x.ar || 0) - (x.par === undefined ? x.ar : x.par)), 0); } catch (e) { return 0; } })(),
      // hits that resolved into damage (i-frames and dashes rejected the rest)
      hitsApplied: (function () { try { return (window.__hurtLog || []).filter((x) => x.res).length; } catch (e) { return 0; } })(),
      hurtTrace: (window.__hurtLog || []).slice(-8),
      // Rooms cleared per minute: the one metric that answers "how much progress
      // does this strategy buy per second", without being distorted by how many
      // fights a seed happens to offer or by the combat/travel split.
      // Only combat and boss rooms count: reward rooms start the floor already
      // flagged cleared (world.js:75), so counting them inflated the numerator
      // and produced impossible values like 12 rooms per minute.
      roomsCleared: (function () { try {
        return (window.__roomsDone || 0) + (window.__floorDone || 0);
      } catch (e) { return 0; } })(),
      roomsPerMin: +(function () {
        try {
          const rc = (window.__roomsDone || 0) + (window.__floorDone || 0);
          const mins = Math.max(1, (g.runT || 0) / 60);     // floor of one minute
          return (rc / mins).toFixed(2);
        } catch (e) { return 0; }
      })(),
      tCombat: +(function () { try { return window.__tDecomp.combat.toFixed(1); } catch (e) { return 0; } })(),
      tTravel: +(function () { try { return window.__tDecomp.travel.toFixed(1); } catch (e) { return 0; } })(),
      tIdle: +(function () { try { return window.__tDecomp.idle.toFixed(1); } catch (e) { return 0; } })(),
      // top idle causes, so "43% idle" becomes actionable
      idleBy: (function () {
        try {
          const d = window.__tDecomp.idleBy || {};
          return Object.entries(d).sort((a, b) => b[1] - a[1]).slice(0, 5)
            .reduce((o, [k, v]) => { o[k] = +v.toFixed(1); return o; }, {});
        } catch (e) { return {}; }
      })(),
      tPaused: +(function () { try { return (window.__tDecomp.paused || 0).toFixed(1); } catch (e) { return 0; } })(),
      // Ratio not absolute: absolute combat seconds are dominated by how many
      // fights the seed happened to offer, which swamps any strategy effect.
      // A working strategy clears more rooms per second, i.e. lower ratio.
      waveCount: (function () { try { return window.__waves.count | 0; } catch (e) { return 0; } })(),
      waveGapS: +(function () { try { return window.__waves.gapS.toFixed(1); } catch (e) { return 0; } })(),
      // seconds spent in a live room with living foes but no kill for >1.5s
      dryS: +(function () { try { return window.__waves.dryS.toFixed(1); } catch (e) { return 0; } })(),
      dryFiring: +(function () { try { return (window.__waves.dryFiring || 0).toFixed(1); } catch (e) { return 0; } })(),
      dryNotFiring: +(function () { try { return (window.__waves.dryIdle || 0).toFixed(1); } catch (e) { return 0; } })(),
      fire: (function () {
        try {
          const w = window.__waves || {};
          const c = (w.combatT || 0) || 1;
          return {
            combatT: +(w.combatT || 0).toFixed(0),
            firing: +(w.liveFiring || 0).toFixed(0),
            idle: +(w.liveIdle || 0).toFixed(0),
            reload: +(w.liveReload || 0).toFixed(0),
            noFoes: +(w.noFoes || 0).toFixed(0),
            firingPct: +(((w.liveFiring || 0) / c) * 100).toFixed(0),
          };
        } catch (e) { return null; }
      })(),
      hitsTry: (window.__hits ? window.__hits.try : 0),
      dmgReal: (window.__hits ? (window.__hits.dmgReal || 0) : 0),
      landReal: (window.__hits ? (window.__hits.landReal || 0) : 0),
      hitsLand: (window.__hits ? window.__hits.land : 0),
      hitsRejDead: (window.__hits ? window.__hits.dead : 0),
      hitsRejSpawn: (window.__hits ? window.__hits.spawn : 0),
      hitsRejDfight: (window.__hits ? window.__hits.dfight : 0),
      hitsRejInv: (window.__hits ? window.__hits.inv : 0),
      hitsShield: (window.__hits ? window.__hits.shield : 0),
      combatRatio: +(function () { try {
        const d = window.__tDecomp;
        const tot = d.combat + d.travel + d.idle + (d.paused || 0);
        return tot > 0 ? (d.combat / tot).toFixed(3) : 0;
      } catch (e) { return 0; } })(),
      penalty: Math.round(scorePenalty * 10) / 10,
      // decisive term first: floors cleared dominates any damage penalty
      score: Math.round(((maxFloor) * 100000 - scorePenalty) * 10) / 10,
      openRoomsAtEnd: (function () {
        try {
          const W = (typeof WORLD !== 'undefined') ? WORLD : null;
          if (!W || !W.rooms) return '';
          return W.rooms.filter((r) => !r.cleared).map((r) => r.type + (r.active ? '*' : '')).join(',');
        } catch (e) { return 'ERR'; }
      })(),
      // death causes: who actually took the last hits (pierce ignores armour, so
      // a "3-hit death" is usually pierce or a post-armour burst)
      hitsTaken: (window.__hurtLog || []).length,
      hurtTrace: (window.__hurtLog || []).slice(-8),
      // blackBox: per-game-second samples of the final ~90 s (state, spacing,
      // fight mode and the boss's attack in play) so a death can be explained
      // after the fact without touching the game's own code.
      blackBox: (function () { try { return (window.__bb && window.__bb.ring) ? window.__bb.ring.slice(-45) : []; } catch (e) { return []; } })(),
      // Longest stretch the player spent parked in place with no foes nearby.
      // A run that does this dies of the clock, not of damage, so every
      // damage/gold/kill metric reads healthy while nothing happens. Two such
      // loops were found by hand (40 s and 44 s, x-span exactly 0 px); this
      // makes the check a number in the row instead of an archaeological dig.
      frozenS: (function () {
        try {
          const ring = (window.__bb && window.__bb.ring) || [];
          let best = 0, start = 0;
          for (let i = 1; i < ring.length; i++) {
            const d = Math.hypot(ring[i].x - ring[start].x, ring[i].y - ring[start].y);
            if (d <= 8 && ring[i].foes === 0) best = Math.max(best, ring[i].t - ring[start].t);
            else start = i;
          }
          return +best.toFixed(1);
        } catch (e) { return 0; }
      })(),
      // Was the run's final death injected by the harness watchdog (dmg 999 pierce
      // mech) instead of earned?  Several recorded "deaths" in earlier datasets
      // are this injection, so an unqualified death overstates fragility.
      watchdogKilled: (function () { try { return (window.__hurtLog || []).some((x) => x.d >= 999 && x.p && x.m) ? 1 : 0; } catch (e) { return 0; } })(),
      // local, low-variance metrics
      roomClears: clears.length,
      roomClearMean: clears.length ? +(clears.reduce((a, b) => a + b, 0) / clears.length).toFixed(1) : 0,
      roomClearMax: clears.length ? Math.max(...clears) : 0,
      killPer100: kRate.length ? +(kRate.reduce((a, b) => a + b, 0) / kRate.length).toFixed(1) : 0,
      weapons: (g.p ? g.p.weapons : []).slice(), shards: Object.assign({}, g.p ? g.p.shards : {}),
      syn: Object.keys(SYN || {}).length,
      ua: navigator.userAgent.match(/(Chrome|Firefox|Safari)\/[\d.]+/)?.[0] || '',
    };
  }

  // ---------------- boss endurance bench ------------------------------------
  // The named goal is "boss fight endurance 151 s -> 240 s+", but a full run only
  // contains one boss fight and costs 4-10 minutes, so the number was never
  // measurable in practice.  This rig drops a crafted save straight into a boss
  // room (the game's own activateRoom() spawns the boss, so no source is touched)
  // and reports the fight length, the armour/hp it consumed and whether the boss
  // died.  Cheap enough to run 10 seeds per candidate.
  async function runBossBench({ speed = 8, seed = null, diff = 'despair', mods = MOD_IDS,
    floor = 0, hp = 5, armor = 3, build = null, policy = 'rounded', seconds = 240, autoOpts = null, bossFloor = null } = {}) {
    if (bossFloor !== null && bossFloor !== undefined) floor = bossFloor;
    const wasSpeed = TSW.speed.get(), wasPolicy = TSW.auto.policy, wasRestart = TSW.auto.opts.autoRestart, wasDiff = SET.diff;
    const saved = {};
    if (autoOpts && typeof autoOpts === 'object') for (const [k, v] of Object.entries(autoOpts)) {
      if (k in TSW.auto.opts) { saved[k] = TSW.auto.opts[k]; TSW.auto.opts[k] = v; }
      else TSW.err('boss: unknown autoOpts ignored → ' + k);
    }
    if (seed != null) TSW.rng.seed(seed);
    TSW.auto.setPolicy(policy);
    TSW.auto.opts.autoRestart = false;
    TSW.speed.set(speed, true);
    const b = build || {};
    await waitScripts();
    const save = {
      v: 1, at: Date.now(), floor: floor, diff: diff || 'despair', modifiers: (mods || []).slice(),
      hp, maxHp: hp, armor, maxArmor: armor,
      weapons: b.weapons || ['nail'], wi: 0, wlv: b.wlv || {}, shards: b.shards || {},
      skill: b.skill || null, ink: b.ink == null ? 60 : b.ink, kills: 0, runT: 0, hits: 0, curses: [],
      rid: 'r' + Date.now().toString(36),
    };
    let ok = false;
    try {
      const txt = JSON.stringify(save);
      STORE.mem['achroma_run'] = txt; STORE.dirty.add('achroma_run');
      resumeRun(); ok = true;
    } catch (e) { TSW.err('boss resume', e); }
    const t0 = performance.now();
    while (performance.now() - t0 < 15000) {
      const g = window.__achroma.G;
      const wOk = (typeof WORLD !== 'undefined') && WORLD && Array.isArray(WORLD.rooms) && WORLD.tiles;
      if (g && g.p && wOk && (g.state === 'play' || g.state === 'bossintro')) break;
      await new Promise((r) => setTimeout(r, 120));
    }
    // walk in: unlock the seal and put the player inside the boss arena, then let
    // the game's own activation path spawn the boss
    let spawned = false;
    try {
      const g = window.__achroma.G;
      const room = WORLD.rooms.find((r) => r.type === 'boss');
      if (room) {
        WORLD.bossLocked = false;
        g.p.x = room.cx * T + 8; g.p.y = (room.cy + 2) * T + 8;
        g.cam.x = g.p.x - W / 2; g.cam.y = g.p.y - H / 2;
        activateRoom(room);
        spawned = !!g.boss;
      }
    } catch (e) { TSW.err('boss enter', e); }
    TSW.auto.setMode('full');
    const g0 = window.__achroma.G;
    const p0 = g0.p;
    p0.hp = p0.maxHp = hp; p0.armor = p0.maxArmor = armor;
    const entry = { hp: p0.hp, armor: p0.armor, maxArmor: p0.maxArmor, weapons: (p0.weapons || []).slice(), shards: Object.assign({}, p0.shards || {}) };
    // measure the fight itself: from "boss alive" to "boss dead or player dead"
    const tStart = g0.runT || 0;
    let tEnd = tStart, bossDead = false, playerDead = false, arLost = 0, hpLost = 0, arGained = 0, hpGained = 0,
      pAr = p0.armor, pHp = p0.hp, zeroArmS = 0, lastT = g0.runT || 0, hits = 0, maxHpSeen = 0, addsPeak = 0,
      dashS = 0, invS = 0;
    installHurtLog();
    window.__hurtLog = [];
    // Why did the measured window end?  Several "timeout" rows used to stop well
    // short of the 240 s cap with the boss still alive and the player at full HP,
    // which is impossible for a pure seconds budget.  Recording the exit branch
    // (and reconciling death state after the loop) keeps `end` honest.
    let why = 'running', runTAtEnd = tStart;
    const mon = setInterval(() => {
      const g = window.__achroma.G;
      if (!g || !g.p) return;
      const q = g.p, tNow = g.runT || 0;
      const dt = Math.max(0, Math.min(20, tNow - lastT)); lastT = tNow;
      const dA = Math.max(0, pAr - q.armor), dH = Math.max(0, pHp - q.hp);
      arLost += dA; hpLost += dH;
      if (q.dashT > 0) dashS += dt;
      if (q.inv > 0) invS += dt;
      arGained += Math.max(0, q.armor - pAr); hpGained += Math.max(0, q.hp - pHp);
      pAr = q.armor; pHp = q.hp;
      if (q.armor <= 0) zeroArmS += dt;
      if (g.boss && !g.boss.dead) { tEnd = tNow; maxHpSeen = Math.max(maxHpSeen, g.boss.hp); }
      if (g.boss && !g.boss.dead) addsPeak = Math.max(addsPeak, (g.enemies || []).filter((e) => !e.dead && !e.boss).length);
      if (q.alive === false || g.state === 'dead') playerDead = true;
      hits = (window.__hurtLog || []).length;
      if ((!g.boss || g.boss.dead) && tNow > tStart + 1) bossDead = true;
    }, 200);
    await new Promise((res) => {
      const iv = setInterval(() => {
        const g = window.__achroma.G;
        runTAtEnd = g ? (g.runT || 0) : runTAtEnd;
        if (!g) why = 'noGame';
        else if (g.state === 'dead' || (g.p && g.p.alive === false)) why = 'stateDead';
        else if (!g.boss) why = 'noBoss';
        else if (g.boss.dead) why = 'bossDead';
        else if ((g.runT || 0) - tStart > seconds) why = 'seconds';
        const done = why !== 'running';
        if (done) { clearInterval(iv); res(); }
      }, 500);
    });
    clearInterval(mon);
    const g = window.__achroma.G;
    // Reconcile after the loop: the 500 ms done-check can win the race against the
    // 200 ms monitor, so a death seen by one and not the other was mislabelled
    // 'timeout'.  Trust whichever terminal state is observable now.
    if (g && (g.state === 'dead' || (g.p && g.p.alive === false))) playerDead = true;
    if (g && g.boss && g.boss.dead) bossDead = true;
    if (g && !g.boss && runTAtEnd > tStart + 1) bossDead = true;
    const fightS = Math.max(0, +((tEnd || 0) - tStart).toFixed(1));
    TSW.auto.setMode('off');
    TSW.auto.opts.autoRestart = wasRestart;
    for (const [k, v] of Object.entries(saved)) TSW.auto.opts[k] = v;
    TSW.auto.setPolicy(wasPolicy);
    TSW.speed.set(wasSpeed, true);
    SET.diff = wasDiff; saveSettings();
    TSW.rng.clear();
    return {
      kind: 'boss', at: Date.now(), speed, seed, diff, floor, hp, armor, policy,
      autoOpts: Object.assign({}, autoOpts || {}), build: entry,
      spawned, end: playerDead ? 'death' : (bossDead ? 'kill' : 'timeout'),
      why, runTAtEnd: +runTAtEnd.toFixed(1),
      fightS, arLost: Math.round(arLost), hpLost: Math.round(hpLost),
      arGained: Math.round(arGained), hpGained: Math.round(hpGained),
      zeroArmS: +zeroArmS.toFixed(1), dashS: +dashS.toFixed(1), invS: +invS.toFixed(1), hits,
      bossMaxHp: Math.round(maxHpSeen || 0), addsPeak,
      hpLeft: g && g.p ? (g.p.hp | 0) : -1, arLeft: g && g.p ? (g.p.armor | 0) : -1,
      // who landed what: n>0 = an enemy body was in contact range at hurt time
      hurtTrace: (window.__hurtLog || []).slice(-10),
      hurtContact: (function () { try { return (window.__hurtLog || []).filter((x) => x.res && x.n > 0).length; } catch (e) { return 0; } })(),
      hurtNoBody: (function () { try { return (window.__hurtLog || []).filter((x) => x.res && x.n <= 0).length; } catch (e) { return 0; } })(),
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
    // the floor may not be built yet after resumeRun(); the game itself then
    // throws every frame on WORLD.spikeT (game.js:608) and nothing progresses
    while (performance.now() - t0 < 15000) {
      const g = window.__achroma.G;
      const wOk = (typeof WORLD !== 'undefined') && WORLD && Array.isArray(WORLD.rooms) && WORLD.tiles;
      if (g && g.p && wOk && (g.state === 'play' || g.state === 'dead')) break;
      await new Promise((r) => setTimeout(r, 120));
    }
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
      // where the damage comes from: mech (telegraphed), pierce, contact
      hurtMechanic: (function () { try {
        const L = window.__hurtLog || []; return L.filter((x) => x.m).length; } catch (e) { return 0; } })(),
      hurtPierce: (function () { try {
        const L = window.__hurtLog || []; return L.filter((x) => x.p && !x.m).length; } catch (e) { return 0; } })(),
      hurtPlain: (function () { try {
        const L = window.__hurtLog || []; return L.filter((x) => !x.p && !x.m).length; } catch (e) { return 0; } })(),
      hurtDmg: (function () { try {
        const L = window.__hurtLog || []; return Math.round(L.reduce((a, x) => a + (x.d || 0), 0)); } catch (e) { return 0; } })(),
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
  // The dodge test used to run on an EXPLORE floor, where the bot could step into
  // a closed room and leave the enemies outside — the measurement then reported a
  // near-perfect rate that meant nothing.  The invade arena is a single open
  // rectangle with no rooms and no doors (ivArena), so that escape cannot happen.
  async function runDodgeOne({ depth = 6, seconds = 45, speed = 8, policy = 'survival', seed = 11,
    // keep/spawnEvery raised: the arena was technically spawning, but with 9 kept
    // and a 2.2 s cadence the floor often showed only 1-2 foes, which reads as
    // "it doesn't spawn anything". A dodge test wants a visible barrage.
    arena = true, keep = 16, spawnEvery = 0.9, spawnN = 5, hp = 14,
    types = ['gunner', 'sniper', 'turret', 'mortar'], diff = 'classic', autoOpts = null } = {}) {
    // Dodge runs must accept autopilot flags too, otherwise an A/B of the dodge
    // logic cannot be expressed at all: the first attempt produced twelve rows
    // that were indistinguishable from each other.
    // The learner controls are NOT autopilot options (they live on TSW.auto.learn),
    // so they are declared here or every learn A/B would be voided as an unknown
    // option — which is exactly what the first smoke run reported (autoOptsUnknown
    // = ["learn"]).  Keep this list explicit; a typo must still be caught.
    const LEARN_KEYS = ['learn', 'noLearn', 'learnRate', 'keepLearn'];
    const optSavedD = {}, optUnknownD = [];
    if (autoOpts && typeof autoOpts === 'object') for (const [k, v] of Object.entries(autoOpts)) {
      if (k in TSW.auto.opts) { optSavedD[k] = TSW.auto.opts[k]; TSW.auto.opts[k] = v; }
      else if (LEARN_KEYS.indexOf(k) >= 0) { /* handled below; declared, not unknown */ }
      else { optUnknownD.push(k); TSW.err('dodge: unknown autoOpts ignored → ' + k); }
    }
    const wasSpeed = TSW.speed.get(), wasPolicy = TSW.auto.policy, wasMode = TSW.auto.mode;
    const wasNoFire = TSW.auto.opts.noFire;
    TSW.rng.seed(seed);
    TSW.auto.setPolicy(policy);
    TSW.speed.set(speed, true);
    TSW.auto.opts.noFire = true;              // stress: never shoot back
    // A dodge test with the dash switched off is not a dodge test — it is a
    // walking test.  Every master switch now defaults to OFF so a player gets no
    // autopilot, which is correct for a human and wrong here: the bench must
    // exercise the movement tools it is measuring.
    TSW.auto.opts.dash = true;
    // ---- in-run online learning (self-evolution v2, benchmark 291) -----------
    // `learn` turns the learner on for THIS run; `noLearn` is the ablation arm:
    // it records the same per-tick danger readings but never applies an update, so
    // a difference between the arms proves the updates (not the measurement) did
    // the work.  A dodge test always starts from a clean slate unless `keepLearn`
    // is set, so a previous seed cannot leak into this one.
    const wasLearn = (TSW.auto.learn && TSW.auto.learn.on) || false;
    const wasFrozen = (TSW.auto.learn && TSW.auto.learn.frozen) || false;
    const wasLR = TSW.auto.learn ? TSW.auto.learn.lr : 0;
    if (TSW.auto.learn) {
      TSW.auto.learn.on = !!autoOpts && autoOpts.learn === true;
      TSW.auto.learn.frozen = !!autoOpts && autoOpts.noLearn === true;
      if (autoOpts && typeof autoOpts.learnRate === 'number') TSW.auto.learn.lr = autoOpts.learnRate;
      if (!(autoOpts && autoOpts.keepLearn)) TSW.auto.learn.reset(false);
    }
    const M = TSW.metrics; M.reset(); TSW.auto.metrics.reset();
    const save = {
      v: 1, at: Date.now(), floor: 4, diff: diff || 'classic', hp, armor: 3,
      weapons: ['rivet'], wi: 0, wlv: { rivet: 1 }, shards: { plate: 1, vital: 1 },
      skill: null, ink: 200, kills: 0, runT: 0, hits: 0, endless: depth,
      rid: 'r' + Date.now().toString(36),
    };
    let arenaOk = false;
    if (arena && typeof ivBegin === 'function' && typeof ivArena === 'function') {
      try {
        // Build the open arena directly: one walled rectangle, no rooms, no doors,
        // so enemies can never be shut out and the barrage is continuous.
        ivBegin();
        const p2 = window.__achroma.G.p;
        p2.hp = p2.maxHp = hp; p2.armor = 3; p2.maxArmor = 3;
        p2.weapons = ['rivet']; p2.wi = 0; p2.wlv = { rivet: 1 };
        p2.shards = { plate: 1, vital: 1 };
        window.__achroma.G.state = 'play';
        recomputeStats(); p2.hp = p2.maxHp;
        arenaOk = true;
      } catch (e) { TSW.err('dodge arena', e); }
    }
    if (!arenaOk) {
      try { STORE.setItem('achroma_run', JSON.stringify(save)); resumeRun(); }
      catch (e) { TSW.err('dodge resume', e); }
    }
    const t0 = performance.now();
    // the floor may not be built yet after resume/arena(); the game itself then
    // throws every frame on WORLD.spikeT (game.js:608) and nothing progresses
    while (performance.now() - t0 < 15000) {
      const g = window.__achroma.G;
      const wOk = (typeof WORLD !== 'undefined') && WORLD && Array.isArray(WORLD.rooms) && WORLD.tiles;
      if (g && g.p && wOk && (g.state === 'play' || g.state === 'dead')) break;
      await new Promise((r) => setTimeout(r, 120));
    }
    TSW.auto.setMode('full');
    const g1 = window.__achroma.G;
    const runT0 = g1.runT || 0, h0 = g1.hits | 0;
    // own hit counter for the window: immune to any reset elsewhere
    // Death attribution was never installed on this path: installHurtLog() ran for
    // fullrun and invade only, so the dodge arena recorded no cause for any of its
    // deaths.  Install it FIRST, then wrap its result for the local counter, so the
    // chain is installHurtLog -> localHits -> game and the log sees every call.
    installHurtLog();
    window.__hurtLog = [];
    let localHits = 0; const _hp = window.hurtPlayer;
    try { window.hurtPlayer = function (...a) { const r = _hp.apply(this, a); if (r === true) localHits++; return r; }; } catch (e) { }
    // ---- survival clock (benchmark 292) --------------------------------------
    // 22 of 24 rows in the learn A/B ended in `death` at 19-37s, i.e. they never
    // reached the 45s cut.  `hpLeft` therefore reads 0 for EVERY configuration and
    // has no gradient — an A/B judged on it is judged on a constant.  The quantity
    // that carries information is how long the bot lasted, so record the tick at
    // which the run entered 'dead'.
    let deathTick = -1, aliveTicks = 0;
    // keep the arena populated with ranged enemies so the barrage never dries up
    let spawnAcc = 0, spawned = 0;
    const off = TSW.hooks.beforeTick(() => {
      const g = window.__achroma.G; if (!g || !g.p) return;
      if (deathTick < 0) { if (g.state === 'dead' || g.p.alive === false) deathTick = aliveTicks; else aliveTicks++; }
      // Diagnose why the arena stays empty: record what the hook actually sees.
      const dbg = (window.__dodgeDbg = window.__dodgeDbg || { ticks: 0, states: {}, sawPlay: 0 });
      dbg.ticks += 1;
      dbg.states[g.state] = (dbg.states[g.state] || 0) + 1;
      if (g.state !== 'play') return;
      dbg.sawPlay += 1;
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
    for (const k of Object.keys(optSavedD)) TSW.auto.opts[k] = optSavedD[k];   // restore dodge overrides
    // the learner is process- wide state, so it must be restored even though the
    // run itself is over; otherwise the NEXT seed silently inherits this one's genes
    const learnN = TSW.auto.learn ? TSW.auto.learn.n : 0;
    const learnMean = (TSW.auto.learn && TSW.auto.learn.n) ? TSW.auto.learn.rewards / TSW.auto.learn.n : 0;
    const learnGenes = (TSW.auto.learn && TSW.auto.learn.n) ? Object.assign({}, TSW.auto.learn.genes) : {};
    if (TSW.auto.learn) { TSW.auto.learn.on = wasLearn; TSW.auto.learn.frozen = wasFrozen; TSW.auto.learn.lr = wasLR; }
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
      // 'floor' is not a runDodgeOne parameter any more: referencing it threw a
      // ReferenceError on EVERY dodge run, which is why the bench appeared to
      // spawn nothing — it died before the arena was populated.
      // Dodge rows must carry the options too, or an A/B cannot be verified after
      // the fact (the first run of the dodge-dash A/B produced 12 rows that were
      // all indistinguishable).
      // Record the REQUESTED overrides, not the live values: the live ones have
      // already been restored to defaults by the time this row is built, so the
      // first version of this field reported dodgeDashAt=1 for a run that was
      // explicitly launched with 99 and made both arms look identical.
      autoOpts: (function () { try { return Object.assign({}, autoOpts || {}); } catch (e) { return {}; } })(),
      autoOptsUnknown: optUnknownD.slice(),
      kind: 'dodge', at: Date.now(), depth, seconds, policy, seed, speed,
      diff: diff || 'classic',
      end: g.state === 'dead' ? 'death' : 'alive',
      // the metric that actually moves (see the survival-clock comment above):
      // ticks survived, capped at the 45s cut so an untouched run reads the ceiling
      survivedTicks: (deathTick >= 0 ? deathTick : aliveTicks),
      survivedS: +((deathTick >= 0 ? deathTick : aliveTicks) / 60).toFixed(2),
      diedAtTick: deathTick,
      gameS: +gameS.toFixed(1),
      hits, hitsPerMin: +(hits / mins).toFixed(2), hpLeft: Math.round(g.p ? g.p.hp : 0), gameMinutes: +mins.toFixed(2),
      dangerAvg: +(A.ticks ? A.dangerSum / A.ticks : 0).toFixed(3),
      hazardPct: +(A.ticks ? A.hazard / A.ticks * 100 : 0).toFixed(1),
      clearAvg: +(A.ticks ? A.clearSum / A.ticks : 0).toFixed(2),
      clearP5: pct(.05), clearP1: pct(.01), clearMin: A.clearMin === 1e9 ? 0 : +A.clearMin.toFixed(2),
      dashes: A.dash, dashesPerMin: +(A.dash / mins).toFixed(2),
      // in-run learning evidence: `learnUpdates` > 0 proves the learner actually
      // ran (mirrors forgeRoomsSeen — never conclude from an option being set),
      // `learnMeanReward` is its own view of whether it was doing well, and
      // `learnGenes` is the genome it converged to on this seed.
      learnUpdates: learnN | 0,
      learnMeanReward: +learnMean.toFixed(4),
      learnGenes: learnGenes,
      learnFrozen: wasFrozen || !!(autoOpts && autoOpts.noLearn === true),
      spawned, ticks: A.ticks,
      // hitsMetric used to read `M.hitsTaken`, the counter owned by hud.js:34
      // (`wrap(window,'hurtPlayer', a => if (r===true) M.hitsTaken++)`).  The dodge
      // bench never loads the HUD, so that counter stayed 0 in ALL 24 rows of the
      // learn A/B while the bench's own wrapper was counting correctly.  Bind it to
      // the bench's counter instead, and keep the old value for the record.
      hitsMetric: localHits | 0, hitsMetricHud: M.hitsTaken | 0, hitsGame: (g.hits | 0) - h0,
      // DEATH-CAUSE TRACE.  The dodge row never carried the shared hurtLog, so 34
      // deaths in this arena were never attributed: was it a bullet, contact, or a
      // mechanism?  The log records nearest-enemy distance (nd), its type (nt),
      // whether it was ranged (nr), and the pre-hit hp/armor/inv/dash state, so the
      // last few entries before death say what actually ended the run.
      hurtTrace: (function () { try { return (window.__hurtLog || []).slice(-10); } catch (e) { return []; } })(),
      hurtsTotal: (function () { try { return (window.__hurtLog || []).length; } catch (e) { return 0; } })(),
      hurtPlain: (function () { try { return (window.__hurtLog || []).filter((x) => !x.p && !x.m).length; } catch (e) { return 0; } })(),
      hurtPierce: (function () { try { return (window.__hurtLog || []).filter((x) => x.p && !x.m).length; } catch (e) { return 0; } })(),
      hurtMech: (function () { try { return (window.__hurtLog || []).filter((x) => x.m).length; } catch (e) { return 0; } })(),
      // nearest-enemy distance at each landed hit: if this is small, contact is
      // killing us; if it is large, it is ranged fire we failed to dodge
      nearDistMean: (function () { try { const L = (window.__hurtLog || []).filter((x) => x.res); if (!L.length) return -1; return +(L.reduce((a, x) => a + (x.nd || 0), 0) / L.length).toFixed(1); } catch (e) { return -1; } })(),
      nearDistMin: (function () { try { const L = (window.__hurtLog || []).filter((x) => x.res); if (!L.length) return -1; return Math.min.apply(null, L.map((x) => x.nd || 999)); } catch (e) { return -1; } })(),
      hitRangedPct: (function () { try { const L = (window.__hurtLog || []).filter((x) => x.res); if (!L.length) return -1; return +(L.filter((x) => x.nr).length / L.length * 100).toFixed(1); } catch (e) { return -1; } })(),
      // how many hits landed while the dash was off cooldown: those were dodges we
      // had available and did not use
      hitsDashReady: (function () { try { return (window.__hurtLog || []).filter((x) => x.res && (x.dash || 0) <= 0).length; } catch (e) { return 0; } })(),
      // invulnerability was active: these should not exist, a nonzero value is a bug
      hitsDuringInv: (function () { try { return (window.__hurtLog || []).filter((x) => x.res && (x.inv || 0) > 0).length; } catch (e) { return 0; } })(),
      // Did the overlap escape actually engage?  Without this the whole A/B rests on
      // the option being set, which is the forgeRoomsSeen mistake: the treatment may
      // simply never have triggered.
      overlapTicks: A.overlap | 0,
      // Which fight state did the autopilot actually think it was in?  The whole
      // kite state machine sits inside the same `active || near` guard as the rest
      // of the combat block, so in a roomless arena it may never have run at all —
      // and 'the bot does not kite' would then be an artefact of the harness.
      fightState: (A._fightState || 'none'),
      statusMode: ((TSW.auto.status && TSW.auto.status.mode) || 'none'),
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
    timeoutS = 900, hpCap = null, autoOpts = null } = {}) {
    // Invade must accept autopilot flags too.  Without this, an A/B on
    // invadeLvStyle ran both arms with the DEFAULT priority and the rows carried
    // no autoOpts at all, so the comparison was between a setting and itself.
    // (Same defect the dodge bench had; see benchmark.md 157.)
    const optSavedI = {}, optUnknownI = [];
    if (autoOpts && typeof autoOpts === 'object') for (const [k, v] of Object.entries(autoOpts)) {
      if (k in TSW.auto.opts) { optSavedI[k] = TSW.auto.opts[k]; TSW.auto.opts[k] = v; }
      else { optUnknownI.push(k); TSW.err('invade: unknown autoOpts ignored → ' + k); }
    }
    await waitScripts();
    const wasSpeed = TSW.speed.get(), wasMode = TSW.auto.mode;
    if (seed != null) TSW.rng.seed(seed);
    // REPRODUCIBILITY.  Seeding Math.random is not enough: the game derives dt
    // from real elapsed time (game.js rdt = (now-last)/1000), so two runs of the
    // same seed diverge.  Measured: same seed 19 twice gave waves 6 vs 5, kills
    // 470 vs 315, gameS 203.8 vs 149.5.  TSW.det replaces that clock with a fixed
    // 16.667ms per frame, which is what makes an A/B comparable at all — and no
    // bench had ever enabled it.
    const detWas = TSW.det.on;
    // Deterministic by default: a benchmark you cannot re-run is not a measurement.
    // Callers can pass opts.det=false to opt out (e.g. when measuring throughput).
    const detMode = !(autoOpts && autoOpts.det === false);
    if (detMode) TSW.det.enable();
    // THE SAME LEAK FIXED FOR runFullRun, HERE TOO.  §200 made startRunWith derive
    // its stamp from the seed because Date.now() in the save changes the resumed
    // state; runInvade kept reading the real clock, so every invade sample carried
    // a fresh timestamp no matter how deterministic the ticks were.
    const stamp = detMode && seed != null ? (0x1eead0000 + seed) : Date.now();
    const save = {
      v: 1, at: stamp, rid: 'r' + (detMode && seed != null ? 's' + String(seed) : Date.now().toString(36)), diff,
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
      if (gg && (gg.floor | 0) > maxFloor) maxFloor = gg.floor | 0;
    }, 250);
    // Run until the player dies (or the wall budget expires) instead of a fixed
    // duration.  Fixed 60-150s windows always ended "alive" and hid the real
    // ceiling (measured death: wave 5 / 127s), so they had no resolution for
    // anything that only pays off later.
    {
      // DETERMINISTIC STOP.  This loop used to run until a WALL-CLOCK budget expired
      // (seconds*1000/4 + 3000), so how far the run got depended on the machine's
      // frame rate: three identical invocations produced 177.5 s/5 waves twice and
      // 303.5 s/8 waves once.  With the det clock the game advances a fixed number
      // of ticks per frame, so a game-time bound (and a tick bound as a backstop)
      // is what makes the sample length constant.
      const t1 = performance.now();
      const tickBudgetIv = detMode ? Math.round((seconds || 120) * 60) : 0;
      const tickT0 = detMode ? (TSW.det.ticks || 0) : 0;
      const wallCap = Math.max(6000, seconds * 1000 / Math.min(4, speed) + 3000);
      while (performance.now() - t1 < wallCap) {
        const gg = window.__achroma.G;
        if (!gg) break;
        if (gg.state === 'dead' || gg.state === 'win') break;
        if (detMode) {
          // constant sample length: stop on the tick ordinal, never on wall time
          if ((TSW.det.ticks || 0) - tickT0 >= tickBudgetIv) break;
        } else if ((gg.runT || 0) >= (seconds || 120)) break;
        await new Promise((r) => setTimeout(r, 300));
      }
    }
    clearInterval(mon);
    TSW.auto.setMode('off');
    TSW.auto.opts.autoRestart = wasRestart;
    for (const k of Object.keys(optSavedI)) TSW.auto.opts[k] = optSavedI[k];   // restore invade overrides
    if (!detWas) TSW.det.disable();                                            // leave the clock as found
    TSW.speed.set(wasSpeed, true);
    if (wasMode !== 'off') TSW.auto.setMode(wasMode);
    TSW.rng.clear();
    const g = window.__achroma.G, iv = g.iv || {};
    const gameS = Math.max(1, (g.runT || 0) - runT0);
    return {
      // Record BOTH what was asked for and what was in effect.  runFullRun does
      // this; runInvade only recorded the applied object, so an A/B on a default
      // value (tank) could not be told apart from the other arm and the paired
      // runner reported "one arm produced nothing" on a complete batch.
      autoOptsRequested: (function () { try { return Object.assign({}, autoOpts || {}); } catch (e) { return {}; } })(),
      autoOpts: (function () { try { return Object.assign({}, autoOpts || {}); } catch (e) { return {}; } })(),
      autoOptsUnknown: optUnknownI.slice(),
      kind: 'invade', at: Date.now(), seed, diff, role, startWave: wave, seconds, speed,
      end: g.state === 'dead' ? 'death' : 'alive',
      gameS: +gameS.toFixed(1),
      // peakWave is the highest wave number seen. `wave` is one LESS than the
      // wave played: ivStartWave() does `iv.wave++` on entry (invade.js:76), so a
      // run that reached wave 6 stores wave=5. Record both, plus the number of
      // waves actually cleared, so a start-wave can never be mistaken for
      // progress. (Earlier rows were read as "stuck at wave 6" purely because
      // the start wave leaked into this field.)
      waveReached: peakWave || (iv.wave | 0),
      waveIndex: iv.wave | 0,
      wavesPlayed: Math.max(0, (peakWave || (iv.wave | 0)) - wave),
      // a run that is still alive when the budget expires has NOT found a
      // ceiling: it was cut off. Distinguish that from a real death.
      cutOff: g.state !== 'dead' && g.state !== 'win',
      wavePhase: iv.phase || '',
      survived: +gameS.toFixed(1),
      kills: (g.kills | 0) - k0, hits: g.hits | 0,
      dmg: Math.round(TSW.metrics.dmgTotal - d0),
      weapons: (iv.w || []).map((w) => w.id + ':t' + w.t),
      lv: iv.lv | 0, state: g.state,
      // Proof that this row came off the deterministic clock.  Without it a reader
      // cannot tell a reproducible run from one that free-runs on real time.
      det: detMode,
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
    seconds = 60, speed = 8, seed = null, diff = 'despair', mods = null, goalDepth = 1, timeoutS = 200, metric = null, warmup = true } = {}) {
    const K = abKind || kind || 'fullrun';        // inner scenario
    // 'reach' = 1/0 whether the run got at least `reachWave` waves (binary,
    // low-variance).  'survived' (seconds) is too noisy on the invade side.
    const reachWave = +((base && base.reachWave) ? base.reachWave : 6);   // default: reach wave 6
    const metricKey = metric || (K === 'invade' ? 'survived' : 'gameT');
    const pick = (r) => {
      if (!r) return 0;
      if (metricKey === 'reach') {
        // binary: invade -> waves, explore -> floors (both bounded, low variance)
        if (K === 'invade') return ((r.waveReached | 0) >= reachWave) ? 1 : 0;
        // maxFloor, not floor: floor resets on death, so a run that cleared a
        // floor and then died reported 0 and looked like it never advanced.
        return (((r.maxFloor !== undefined && r.maxFloor !== null ? r.maxFloor : r.floor) | 0) >= reachWave) ? 1 : 0;
      }
      // firstBossT uses -1 for "never entered the boss room"; encode that as a
      // large penalty so a missing boss counts as the worst outcome, not the best.
      if (metricKey === 'firstBossT') {
        const v = r.firstBossT;
        return (v === undefined || v === null || v < 0) ? 9999 : v;
      }
      return r[metricKey] || 0;
    };
    const A = Object.assign({}, base, optA), B = Object.assign({}, base, optB);
    const pairs = [];
    const exec = async (o) => {
      // apply autopilot option overrides, remember originals
      const saved = {};
      const unknown = [];
      for (const [k, val] of Object.entries(o.autoOpts || {})) {
        if (k in (TSW.auto.opts || {})) { saved[k] = TSW.auto.opts[k]; TSW.auto.opts[k] = val; }
        else unknown.push(k);
      }
      // A typo (or a patch that never landed) would otherwise silently run the
      // SAME code on both arms and produce a plausible-looking fake difference.
      if (unknown.length) TSW.err('AB: unknown autoOpts ignored → ' + unknown.join(', '));
      let r;
      try {
        // START WAVE MUST BE EXPLICIT.  This defaulted to 9, so an A/B measuring
        // "does the build reach wave N" was really measuring "does it survive one
        // or two waves from wave 9" — and any reach threshold below 10 passed
        // trivially.  Measured: reach 3/5/7/10 all returned 1/1 while the inner
        // runs only lasted 9-16 game-seconds.  Default is now wave 1, i.e. the
        // same question the target asks, and it can be overridden via base.wave.
        if (K === 'invade') r = await runInvade(Object.assign({ seconds, speed, seed, diff, timeoutS, role: base.role || 'rounded', wave: (base.wave != null ? base.wave : 1) }, o));
        else r = await runFullRun(Object.assign({ speed, seed, policy: 'rounded', goalDepth, timeoutS, diff, mods, gameSeconds }, o));
      } finally { for (const [k, v] of Object.entries(saved)) TSW.auto.opts[k] = v; }
      // Diagnostics: an inner run that ends in a few game-seconds means the
      // repeated same-session start is broken, not that the arms are equal.
      try { TSW.log('AB inner: end=' + (r && r.end) + ' gameT=' + (r && r.gameT) + ' kills=' + (r && r.kills) + ' floor=' + (r && r.maxFloor) + ' bossFight=' + JSON.stringify(r && r.bossFight)); } catch (e) { }
      return r;
    };
    // Warm-up: the FIRST run of a session starts from a cold state and is the
    // only source of noise left under det mode (measured: 3 pairs differed by
    // 1/-3/1s, the first pair by 160s).  Burn one run and discard it.
    if (warmup) {
      TSW.log('AB warmup run (discarded)…');
      try { await exec(A); } catch (e) { }
      try { await exec(B); } catch (e) { }
    }
    TSW.log('AB start: rounds=' + rounds + ' inner=' + K + ' diff=' + diff);
    for (let i = 0; i < rounds; i++) {
      // order alternates: even rounds A→B, odd rounds B→A (cancels session drift)
      const flip = i % 2 === 1;
      TSW.log('AB round ' + (i + 1) + (flip ? ' B→A' : ' A→B'));
      const first = await exec(flip ? B : A);
      const second = await exec(flip ? A : B);
      // IMPORTANT: when flipped, the *first* run is arm B.  Mapping back has to
      // honour that, otherwise every flipped pair silently reverses the sign
      // (a null A/B test proved it: identical arms still scored "A better" by -63s).
      const a = flip ? second : first;          // arm A result
      const b = flip ? first : second;          // arm B result
      const ka = pick(a);
      const kb = pick(b);
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
      else if (kind === 'boss') r = await runBossBench(opts);
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
