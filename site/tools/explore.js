// ===== TSW explore — 无尽流派探索 (endless-build search) ======================
// Queues a matrix of full autopilot runs (policy × seed × start weapon), runs
// them back-to-back at high speed, and aggregates the outcomes into a ranking:
// which serum-pick policy actually survives deepest into 无尽 (endless) mode.
//
//   TSW.explore.start({ policies, seeds, speed, goalDepth, timeoutS })
//   TSW.explore.stop()  ·  TSW.explore.results  ·  TSW.explore.rank()
//
// Each row is a bench 'fullrun' record; the aggregated ranking is derived from
// depth reached, deaths and kills/min.
'use strict';
(function () {
  const TSW = window.__TSW; if (!TSW || TSW.explore) return;

  const KEY = 'theseed.tools.explore.v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
  const persist = (a) => { try { localStorage.setItem(KEY, JSON.stringify(a.slice(-300))); } catch (e) { } };

  const E = TSW.explore = {
    queue: [], running: false, current: null, results: load(),
    stopFlag: false,
  };

  // optional: give the run a starting weapon by placing it via the armory buff
  // (the same mechanism the black market uses — gp.market.armory)
  function setStartWeapon(id) {
    if (!id || typeof mkt !== 'function') return;
    const m = mkt(); m.armory = id; gpSave();
  }

  E.start = function ({ policies = ['bloom', 'offense', 'balanced', 'survival'], seeds = [11, 22, 33], weapons = [null], speed = 8, goalDepth = 3, timeoutS = 1200 } = {}) {
    if (E.running) { TSW.err('explore already running'); return false; }
    E.queue = [];
    for (const policy of policies) for (const seed of seeds) for (const w of weapons) E.queue.push({ policy, seed, weapon: w, speed, goalDepth, timeoutS });
    E.running = true; E.stopFlag = false; TSW.bus.emit('explore');
    (async () => {
      while (E.queue.length && !E.stopFlag) {
        const job = E.queue.shift(); E.current = job; TSW.bus.emit('explore');
        TSW.log('explore job', job);
        setStartWeapon(job.weapon);
        const r = await TSW.bench.run('fullrun', job);
        if (r) { E.results.push(r); persist(E.results); }
        E.current = null; TSW.bus.emit('explore');
      }
      E.running = false; TSW.bus.emit('explore');
      TSW.log('explore finished,', E.results.length, 'results total');
    })();
    return true;
  };
  E.stop = () => { E.stopFlag = true; TSW.bench.running = null; };

  E.rank = function (rows = E.results) {
    const by = {};
    for (const r of rows) {
      if (r.kind !== 'fullrun') continue;
      const k = r.policy + (r.weapons && r.weapons[0] ? ':' + r.weapons[0] : '');
      (by[k] = by[k] || []).push(r);
    }
    return Object.entries(by).map(([k, rs]) => ({
      build: k, runs: rs.length,
      avgDepth: +(rs.reduce((s, r) => s + (r.depth || 0), 0) / rs.length).toFixed(2),
      maxDepth: Math.max(...rs.map((r) => r.depth || 0)),
      deathRate: +(rs.filter((r) => r.end === 'death').length / rs.length).toFixed(2),
      avgKills: Math.round(rs.reduce((s, r) => s + (r.kills || 0), 0) / rs.length),
      avgGameT: Math.round(rs.reduce((s, r) => s + (r.gameT || 0), 0) / rs.length),
      avgSyn: +(rs.reduce((s, r) => s + (r.syn || 0), 0) / rs.length).toFixed(1),
    })).sort((a, b) => b.maxDepth - a.maxDepth || b.avgDepth - a.avgDepth || a.deathRate - b.deathRate);
  };

  E.clear = () => { E.results = []; persist(E.results); TSW.bus.emit('explore'); };
  E.markdown = () => {
    const rows = E.rank(); if (!rows.length) return '(no explore results)';
    const keys = Object.keys(rows[0]);
    return ['| ' + keys.join(' | ') + ' |', '|' + keys.map(() => '---').join('|') + '|',
    ...rows.map((r) => '| ' + keys.map((k) => r[k]).join(' | ') + ' |')].join('\n');
  };
  TSW.log('explore module ready');
})();
