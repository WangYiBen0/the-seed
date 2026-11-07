// ===== self-evolution loop for the exploration autopilot =====================
// The pieces it needs already exist: a deterministic-ish bench, a fixed seed
// set, and a fitness signal (bench 'score' = floors × 100000 − damage penalty).
// What was missing is a *search*: a genome, a population, selection, variation.
//
//   TSW.evolve.start({ generations, pop, seeds, seconds, diff })
//
// Each candidate is a partial genome (see GENE_DEF in auto.js). Candidates are
// scored by running every seed and averaging `score`; the best-of-generation is
// kept as an elite so the population can only improve.
//
// Everything is cancellable and logs a compact line per generation, so it can
// run unattended in a tab while the real game is closed.
'use strict';
(() => {
  const TSW = window.__TSW;                 // core.js publishes it as __TSW
  if (!TSW || TSW.evolve) return;
  const EV = TSW.evolve = {};

  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---- genome helpers -----------------------------------------------------
  const defs = () => (TSW.auto && TSW.auto.geneDef) || null;
  const clampG = (k, v) => { const d = defs()[k]; return Math.min(d.max, Math.max(d.min, v)); };

  EV.randomGenome = (base) => {
    const d = defs(); if (!d) return {};
    const g = Object.assign({}, base || {});
    for (const k of Object.keys(d)) {
      if (g[k] === undefined) g[k] = d[k].def;
      if (Math.random() < .6) g[k] = clampG(k, g[k] * rnd(.75, 1.3));
    }
    return g;
  };
  EV.cross = (a, b) => {
    const d = defs(), out = {};
    for (const k of Object.keys(d)) out[k] = Math.random() < .5 ? a[k] : b[k];
    // Option genes live under 'o:<key>' and are NOT in the numeric gene table,
    // so iterating Object.keys(d) silently dropped every evolved decision at the
    // first crossover.  Carry them across explicitly.
    for (const k of EV.OPT_KEYS) {
      const key = 'o:' + k;
      const av = a[key], bv = b[key];
      if (av === undefined && bv === undefined) continue;
      out[key] = Math.random() < .5 ? (av === undefined ? bv : av) : (bv === undefined ? av : bv);
    }
    return out;
  };
  // ---- switchable options ------------------------------------------------
  // The numeric genes only tune spacing bands and margins.  Whether a whole
  // behaviour is enabled is a separate, often much larger, decision.  These are
  // the options where on/off is a genuine strategy question rather than a safety
  // floor (dashHazards and openSeals stay out: they are never worth disabling).
  EV.OPT_KEYS = ['chest', 'vault', 'idol', 'altar', 'fount', 'labSerum', 'dialysis',
    'arsenal', 'weaponPick', 'chipPick', 'pickups', 'shop', 'forge', 'partner',
    'weaponSwap', 'pairSwap', 'bossDashDodge', 'bossCriticalRetreat', 'bossAddsFirst',
    'bossPrepHeal', 'noFire', 'specialsFirst', 'powerupFirst', 'rushBoss'];
  // a mutated option is keyed with an 'o:' prefix so it can never collide with a
  // numeric gene name when the genome is applied
  EV.mutate = (g, rate) => {
    const d = defs(), out = Object.assign({}, g);
    for (const k of Object.keys(d)) {
      if (Math.random() < (rate === undefined ? .25 : rate)) out[k] = clampG(k, out[k] * rnd(.85, 1.18));
    }
    // flip a few on/off decisions per child: that is how the loop can discover
    // "opening chests is worth more than a tighter retreat band"
    const opRate = (rate === undefined ? .25 : rate) * .5;
    for (const k of EV.OPT_KEYS) {
      if (Math.random() < opRate) out['o:' + k] = (out['o:' + k] === undefined ? (TSW.auto.opts[k] !== false) : out['o:' + k]) ? false : true;
    }
    return out;
  };
  EV.fitness = (r) => {
    if (!r) return -1e9;
    // Floor progress has to dominate, and it does in bench.score (+100000 per
    // floor).  But on the despair five-lock seed set most runs clear ZERO floors,
    // and score alone then reduces to "-damage taken": every genome looks
    // identical, the elite never moves, and the loop is effectively optimising
    // "get hit less" instead of "clear the floor".  Add a GRADED progress term so
    // a genome that nearly clears a room / kills more / lives longer still beats
    // one that stalls, without letting secondary terms outrank a real floor.
    const floors = (r.maxFloor !== undefined && r.maxFloor !== null) ? r.maxFloor : (r.floor | 0);
    const score = (typeof r.score === 'number') ? r.score : floors * 100000;
    // rooms cleared is the sub-floor progress signal that actually moves
    const rooms = (r.roomsCleared | 0) * 900;
    const kills = Math.min(9000, (r.kills | 0) * 30);
    const alive = Math.min(6000, (r.gameT | 0) * 3);
    return score + rooms + kills + alive;
  };

  // ---- the loop -----------------------------------------------------------
  let running = false, stopFlag = false;
  EV.isRunning = () => running;
  // Fast self-test: builds a genome, applies it, and reads the effective values
  // back out of the autopilot.  No bench runs, so it finishes instantly.
  EV.selftest = () => {
    const d = defs(); if (!d) return { ok: false, why: 'geneDef missing' };
    const g = EV.randomGenome({});
    const prev = TSW.auto.opts.genome;
    TSW.auto.opts.genome = g;
    const eff = {};
    try { for (const k of Object.keys(d)) eff[k] = TSW.auto.gene(k); } finally { TSW.auto.opts.genome = prev; }
    const changed = Object.keys(d).filter((k) => Math.abs(eff[k] - d[k].def) > 1e-9).length;
    return { ok: true, genes: Object.keys(d).length, applied: changed, sample: g, effective: eff };
  };
  EV.stop = () => { stopFlag = true; };

  EV.start = async (o = {}) => {
    if (running) return { error: 'already running' };
    if (!defs()) return { error: 'genome definitions not loaded yet' };
    const gens = Math.max(1, o.generations | 0 || 6);
    const pop = Math.max(2, o.pop | 0 || 6);
    const seeds = (o.seeds && o.seeds.length) ? o.seeds : [1, 5, 13, 23, 31];
    // A candidate is scored by floors cleared.  Under ~420 s of game time the
    // autopilot cannot finish even floor 0 (the measured pass floor needs
    // 500-700 s), so every genome scores 0 and the search has no gradient.
    const seconds = Math.max(420, o.seconds | 0 || 420);
    const diff = o.diff || 'classic';
    const mods = o.mods || null;
    const speed = o.speed || 8;
    running = true; stopFlag = false;
    TSW.log('[evolve] start gens=' + gens + ' pop=' + pop + ' seeds=' + seeds.join(',') + ' seconds=' + seconds);
    const log = [], hist = [];
    const prevGenome = TSW.auto.opts.genome;
    const evaluate = async (g) => {
      TSW.auto.opts.genome = g;
      // option genes are stored as 'o:<key>'; apply them for this evaluation only
      const savedOpts = {};
      for (const k of EV.OPT_KEYS) {
        if (g['o:' + k] === undefined) continue;      // not evolved: keep the user setting
        savedOpts[k] = TSW.auto.opts[k];
        TSW.auto.opts[k] = g['o:' + k];
      }
      let sum = 0, best = -1e9, rows = [];
      try {
      for (const s of seeds) {
        if (stopFlag) break;
        let r = null;
        TSW.log('[evolve] candidate seed=' + s + ' begin');
        // Consecutive bench.run('fullrun') calls can wedge: the run is started by
        // writing a crafted save and calling resumeRun(), and a second resume
        // while the game is still sitting in the previous run's dead/cards state
        // never reaches 'play'.  Measured: candidate 2 began and then the whole
        // evolve run hit its hard timeout with no result at all.
        // Park the game in a clean state between candidates, then WAIT until it
        // really is idle.  bench.run starts a run by writing a crafted save and
        // calling resumeRun(); if that happens while the previous run is still
        // finishing (dead screen, level-up cards, the results overlay) the resume
        // is swallowed and the next candidate never starts playing - measured:
        // candidate 2 logged 'begin' and then the evolve run hit its hard timeout
        // with no result at all.
        try {
          const waitIdle = async (ms) => {
            const t0 = performance.now();
            while (performance.now() - t0 < ms) {
              const g = window.__achroma && window.__achroma.G;
              if (g && (g.state === 'dead' || g.state === 'cards' ||
                  (typeof OVL !== 'undefined' && OVL && OVL.open) ||
                  (typeof NAMEED !== 'undefined' && NAMEED && NAMEED.open))) {
                if (typeof toMenu === 'function' && g.state !== 'menu') toMenu();
              } else if (g && g.state === 'menu') return true;
              await new Promise((r) => setTimeout(r, 250));
            }
            return false;
          };
          await waitIdle(4000);
        } catch (e) { }
        try { r = await TSW.bench.run('fullrun', { seed: s, policy: 'rounded', goalDepth: 2, speed, timeoutS: (seconds | 0) + 60, diff, mods }); } catch (e) { TSW.log('[evolve] bench threw ' + (e && e.message)); }
        TSW.log('[evolve] candidate seed=' + s + ' done floor=' + (r ? (r.maxFloor != null ? r.maxFloor : r.floor) : 'null'));
        const f = EV.fitness(r);
        sum += f; if (f > best) best = f;
        rows.push({ seed: s, f, floor: r ? (r.maxFloor != null ? r.maxFloor : r.floor) : -1 });
      }
      } finally { for (const [k, v] of Object.entries(savedOpts)) TSW.auto.opts[k] = v; }
      return { mean: sum / Math.max(1, seeds.length), best, rows };
    };
    try {
      // seed the population with the incumbent (current defaults) plus mutants
      let population = [];
      const base = Object.assign({}, o.base || {});
      // incumbent: the explicit defaults (empty genome = all GENE_DEF defaults)
      population.push({ g: Object.assign({}, base), f: null, tag: 'incumbent' });
      for (let i = 1; i < pop; i++) population.push({ g: EV.randomGenome(base), f: null });

      for (let gen = 0; gen < gens; gen++) {
        if (stopFlag) break;
        // evaluate the unevaluated
        for (const p of population) {
          if (stopFlag) break;
          if (p.f !== null) continue;
          const ev = await evaluate(p.g);
          p.f = ev.mean; p.detail = ev;
        }
        population.sort((x, y) => (y.f || -1e9) - (x.f || -1e9));
        const elite = population[0];
        hist.push({ gen, best: +elite.f.toFixed(0), mean: +(population.reduce((a, b) => a + (b.f || 0), 0) / population.length).toFixed(0),
          genome: elite.g, tag: elite.tag || 'mutant',
          floors: +(elite.detail ? (elite.detail.rows.reduce((a, r) => a + Math.max(0, r.floor), 0) / Math.max(1, elite.detail.rows.length)).toFixed(2) : 0),
          spread: +(population.map((p) => p.f || 0).reduce((a, b) => a + b, 0) / population.length).toFixed(0) });
        log.push(`gen ${gen}: best ${elite.f.toFixed(0)} (floors≈${((elite.detail && elite.detail.best) | 0) / 100000}), pop mean ${hist[hist.length - 1].mean}`);
        TSW.log('[evolve] ' + log[log.length - 1]);
        if (gen === gens - 1) break;
        // build the next generation: elite + tournament-selected children
        const pick = () => { const a = population[(Math.random() * population.length) | 0], b = population[(Math.random() * population.length) | 0]; return (a.f || -1e9) >= (b.f || -1e9) ? a : b; };
        const next = [{ g: elite.g, f: elite.f, detail: elite.detail }];
        while (next.length < pop) {
          const c = EV.mutate(EV.cross(pick().g, pick().g));
          next.push({ g: c, f: null });
        }
        population = next;
      }
      population.sort((x, y) => (y.f || -1e9) - (x.f || -1e9));
      const champ = population[0];
      const out = {
        kind: 'evolve', at: Date.now(), generations: hist.length, pop, seeds, seconds, diff,
        best: +champ.f.toFixed(1), genome: champ.g, history: hist, log
      };
      TSW.log('TSW_RESULT ' + JSON.stringify(out));
      return out;
    } finally {
      TSW.auto.opts.genome = prevGenome;      // never leave a candidate active
      running = false;
    }
  };

  // Attaching is not enough: the gene table lives in auto.js, which may load
  // later. Announce (and self-test the plumbing) once it exists.
  const announce = () => {
    if (TSW.auto && TSW.auto.geneDef) {
      try {
        const st = EV.selftest();
        console.info('[evolve] attached; selftest ' + JSON.stringify({ ok: st.ok, genes: st.genes, applied: st.applied }));
      } catch (e) { console.info('[evolve] attached; selftest threw ' + e.message); }
      return true;
    }
    return false;
  };
  if (EV.selftest && !announce()) {
    const t = setInterval(() => { if (announce()) clearInterval(t); }, 250);
    setTimeout(() => clearInterval(t), 20000);
  }
})();
