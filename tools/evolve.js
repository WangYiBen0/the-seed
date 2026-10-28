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
    return out;
  };
  EV.mutate = (g, rate) => {
    const d = defs(), out = Object.assign({}, g);
    for (const k of Object.keys(d)) {
      if (Math.random() < (rate === undefined ? .25 : rate)) out[k] = clampG(k, out[k] * rnd(.85, 1.18));
    }
    return out;
  };
  EV.fitness = (r) => {
    if (!r) return -1e9;
    // progress dominates (it already is ×100000 in bench.score); kills break ties
    const s = (typeof r.score === 'number') ? r.score : ((r.maxFloor || r.floor || 0) * 100000);
    return s + Math.min(1e4, (r.kills | 0) * 10);
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
    const pop = Math.max(4, o.pop | 0 || 8);
    const seeds = (o.seeds && o.seeds.length) ? o.seeds : [1, 5, 13, 23, 31];
    const seconds = o.seconds || 120;
    const diff = o.diff || 'classic';
    const mods = o.mods || null;
    const speed = o.speed || 8;
    running = true; stopFlag = false;
    const log = [], hist = [];
    const prevGenome = TSW.auto.opts.genome;
    const evaluate = async (g) => {
      TSW.auto.opts.genome = g;
      let sum = 0, best = -1e9, rows = [];
      for (const s of seeds) {
        if (stopFlag) break;
        let r = null;
        try { r = await TSW.bench.run('fullrun', { seed: s, policy: 'rounded', goalDepth: 2, speed, timeoutS: (seconds | 0) + 60, diff, mods }); } catch (e) { }
        const f = EV.fitness(r);
        sum += f; if (f > best) best = f;
        rows.push({ seed: s, f, floor: r ? (r.maxFloor != null ? r.maxFloor : r.floor) : -1 });
      }
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
