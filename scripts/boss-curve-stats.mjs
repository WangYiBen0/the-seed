#!/usr/bin/env node
// Paired stats for the boss-endurance armour curve.
//
//   node scripts/boss-curve-stats.mjs site/docs/data/boss-armor-curve-10seed.jsonl
//
// The rig (bench.js runBossBench, kind: boss) writes one JSON result per
// (seed, armour) run.  Runs are interleaved by seed in a single batch, so the
// honest comparison is a PAIRED difference per seed: same seed, same budget,
// same build, only `armor` differs.  This script groups by armour value, pairs
// each arm against a base arm on the seeds they share, and reports mean paired
// delta + 95% CI (two-sided paired t) for every metric that matters.
//
// No game source is touched; this only reads results.
import { readFile } from 'node:fs/promises';

const file = process.argv[2];
const baseArmor = +(process.argv[3] || 3);
if (!file) { console.error('usage: boss-curve-stats.mjs <results.jsonl> [baseArmor]'); process.exit(2); }

// two-sided 95% t multipliers by df; 1.96 beyond the table
const T95 = [NaN, 12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228,
  2.201, 2.179, 2.160, 2.145, 2.131, 2.120, 2.110, 2.101, 2.093, 2.086, 2.080, 2.074,
  2.069, 2.064, 2.060, 2.056, 2.052, 2.048, 2.045, 2.042];
const t95 = (df) => (df >= 1 && df < T95.length ? T95[df] : 1.96);

const raw = (await readFile(file, 'utf8')).trim().split('\n').filter(Boolean)
  .map((l) => { try { return JSON.parse(l); } catch (e) { return null; } })
  .filter((r) => r && r.kind === 'boss');

const mean = (v) => v.reduce((a, b) => a + b, 0) / (v.length || 1);
const sd = (v) => { const m = mean(v); return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, v.length - 1)); };
const ci95 = (v) => { const m = mean(v), s = sd(v), n = v.length; const se = s / Math.sqrt(n || 1); return [m - t95(n - 1) * se, m + t95(n - 1) * se]; };
const f1 = (x) => (x === undefined || x === null || Number.isNaN(x) ? '—' : (+x).toFixed(1));

// per-arm aggregates
const arms = [...new Set(raw.map((r) => r.armor))].sort((a, b) => a - b);
const byArm = new Map();
for (const a of arms) byArm.set(a, raw.filter((r) => r.armor === a));

// direction of every metric for the endurance goal: 'up' = higher is better,
// 'down' = lower is better, 'flat' = descriptive only (no good/bad sign).
const METRICS = [
  ['fightS', 'up', (r) => r.fightS],
  ['zeroArmS', 'down', (r) => r.zeroArmS],
  ['arLost', 'flat', (r) => r.arLost],
  ['hpLost', 'down', (r) => r.hpLost],
  ['hits', 'flat', (r) => r.hits],
  ['arLostPerS', 'flat', (r) => (r.fightS > 0 ? r.arLost / r.fightS : 0)],
  ['hitRate', 'down', (r) => (r.fightS > 0 ? r.hits / r.fightS : 0)],
  ['kill', 'up', (r) => (r.end === 'kill' ? 1 : 0)],
  ['death', 'down', (r) => (r.end === 'death' ? 1 : 0)],
  ['timeout', 'flat', (r) => (r.end === 'timeout' ? 1 : 0)],
  ['hpLeft', 'up', (r) => r.hpLeft],
];
const verdictOf = (m, lo, hi, dir, hiName, loName) => {
  if (lo <= 0 && hi >= 0) return 'no significant difference';
  const higher = m > 0;
  const fav = dir === 'up' ? higher : dir === 'down' ? !higher : null;
  const tail = fav === null ? '' : (fav ? ' (favourable)' : ' (unfavourable)');
  return `${higher ? hiName : loName} larger${tail}`;
};

const out = { file, baseArmor, seeds: [...new Set(raw.map((r) => r.seed))].sort((a, b) => a - b), perArmor: {}, pairedVsBase: {} };

console.log('## per-armour aggregate\n');
console.log('| armour | n | fightS mean ± sd | zeroArmS | arLost | hpLost | hits | kill | death | timeout |');
console.log('|---|---|---|---|---|---|---|---|---|---|');
for (const a of arms) {
  const rs = byArm.get(a);
  const g = (k, f) => { const v = rs.map(f).filter((x) => x !== undefined && x !== null); return v.length ? mean(v) : NaN; };
  out.perArmor[a] = {
    n: rs.length,
    fightS: +mean(rs.map((r) => r.fightS)).toFixed(1), fightSsd: +sd(rs.map((r) => r.fightS)).toFixed(1),
    zeroArmS: +mean(rs.map((r) => r.zeroArmS)).toFixed(1),
    arLost: +mean(rs.map((r) => r.arLost)).toFixed(1),
    hpLost: +mean(rs.map((r) => r.hpLost)).toFixed(1),
    hits: +mean(rs.map((r) => r.hits)).toFixed(1),
    kills: rs.filter((r) => r.end === 'kill').length,
    deaths: rs.filter((r) => r.end === 'death').length,
    timeouts: rs.filter((r) => r.end === 'timeout').length,
  };
  console.log(`| ${a} | ${rs.length} | ${f1(g('fightS', (r) => r.fightS))} ± ${f1(sd(rs.map((r) => r.fightS)))} | ${f1(g('zeroArmS', (r) => r.zeroArmS))} | ${f1(g('arLost', (r) => r.arLost))} | ${f1(g('hpLost', (r) => r.hpLost))} | ${f1(g('hits', (r) => r.hits))} | ${out.perArmor[a].kills}/${rs.length} | ${out.perArmor[a].deaths}/${rs.length} | ${out.perArmor[a].timeouts}/${rs.length} |`);
}

// one paired table per comparison set; each set is a list of [loArm, hiArm]
const pairedTable = (comparisons, loName, hiName, label) => {
  console.log(`\n## paired delta: ${label}\n`);
  console.log('| comparison | metric | mean Δ | 95% CI | n | verdict |');
  console.log('|---|---|---|---|---|---|');
  const store = {};
  for (const [loArm, hiArm] of comparisons) {
    const loMap = new Map(byArm.get(loArm).map((r) => [r.seed, r]));
    const pairs = byArm.get(hiArm).filter((r) => loMap.has(r.seed)).map((r) => [loMap.get(r.seed), r]);
    if (!pairs.length) continue;
    const key = `${hiArm}-${loArm}`;
    store[key] = { n: pairs.length, metrics: {} };
    for (const [name, dir, f] of METRICS) {
      const d = pairs.map(([x, y]) => f(y) - f(x)).filter((x) => Number.isFinite(x));
      if (!d.length) continue;
      const m = mean(d), [lo, hi] = ci95(d);
      const significant = !(lo <= 0 && hi >= 0);
      store[key].metrics[name] = { mean: +m.toFixed(3), ci95: [+lo.toFixed(3), +hi.toFixed(3)], n: d.length, significant };
      console.log(`| ${hiArm} vs ${loArm} | ${name} | ${f1(m)} | [${f1(lo)}, ${f1(hi)}] | ${d.length} | ${verdictOf(m, lo, hi, dir, hiName, loName)} |`);
    }
  }
  return store;
};
out.pairedVsBase = pairedTable(arms.filter((a) => a !== baseArmor).map((a) => [baseArmor, a]), 'base', 'arm', `each armour vs base ${baseArmor}`);
out.pairedAdjacent = pairedTable(arms.slice(1).map((a, i) => [arms[i], a]), 'lower', 'higher', 'adjacent armour steps');

console.log('\n## JSON\n');
console.log(JSON.stringify(out, null, 2));
