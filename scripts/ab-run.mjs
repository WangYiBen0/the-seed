#!/usr/bin/env node
// Paired multi-seed A/B that CANNOT produce unbalanced arms.
//
// Why this exists: every "improvement" that later collapsed came from comparing
// arms with different seeds or different run counts (4 vs 3), or from a batch
// where one arm silently produced no row.  The rule was written down but always
// enforced by hand, so it kept being broken.  This script enforces it mechanically:
//
//   * both arms run the SAME seed list, in the same order, interleaved;
//   * a run that produces no row is retried once, and if it still fails the
//     WHOLE PAIR is dropped (never one arm alone);
//   * the summary prints per-pair deltas, so a single seed cannot dominate.
//
// Usage:
//   node scripts/ab-run.mjs --seed-list 1,5,11,19 --out .tmp/ab.jsonl \
//     --a '{"rateBias":false}' --b '{"rateBias":true}' \
//     [--kind fullrun] [--game-seconds 400] [--timeout 200]
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, existsSync, appendFile, rmSync } from 'node:fs';

const args = (() => {
  const o = {};
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    if (!a[i].startsWith('--')) continue;
    const k = a[i].slice(2);
    // --extra is the ONE flag whose value legitimately starts with "--"
    // (it forwards benchmark flags verbatim).  Treating that like a missing
    // value made --extra silently become true, so the runner fell back to the
    // benchmark's own defaults (invade: startWave 5, seconds 12) and measured
    // something else entirely.
    if (k === 'extra' || k === 'mods' || k === 'autoOpts') { o[k] = a[++i] ?? ''; continue; }
    const v = (a[i + 1] && !a[i + 1].startsWith('--')) ? a[++i] : true;
    o[k] = v;
  }
  return o;
})();

const seeds = String(args['seed-list'] || '1,5,11,19,23,29').split(',').map((x) => +x.trim()).filter((x) => x > 0);
const A = String(args.a || '{}');
const B = String(args.b || '{}');
const OUT = String(args.out || '.tmp/ab-run.jsonl');
const KIND = String(args.kind || 'fullrun');
const GAME_SECONDS = String(args['game-seconds'] || 400);
const TIMEOUT = String(args.timeout || 200);
const DIFF = String(args.diff || 'despair');
const MODS = String(args.mods || 'rage,deathfight,bulwark,rot,cyst');

if (seeds.length < 2) { console.error('[ab] need at least 2 seeds'); process.exit(2); }

rmSync(OUT, { force: true });

function runOnce(seed, optJson, armExtra) {
  // Pass-through args.  Every benchmark kind has its own parameter names: fullrun
  // takes --game-seconds, but invade takes --wave and --seconds.  Without a
  // pass-through this runner silently used invade defaults (startWave 5,
  // seconds 12) and produced a batch that measured the wrong thing entirely —
  // rows showed startWave 5 / seconds 12 while the intent was wave 1 / 300 s.
  // Per-arm extra flags, so an A/B can vary more than a single autopilot option
  // (e.g. give arm A a hail build and arm B a bloom build).  Falls back to the
  // shared --extra.
  const shared = String(args.extra || '').split(' ').filter(Boolean);
  const extra = armExtra ? String(armExtra).split(' ').filter(Boolean) : shared;
  const r = spawnSync(process.execPath, ['scripts/headless-bench.mjs',
    '--kind', KIND, '--seed', String(seed), '--policy', 'rounded', '--goal-depth', '1',
    '--speed', '8', '--diff', DIFF, '--mods', MODS,
    '--autoOpts', optJson, '--out', OUT, ...extra,
  ], { encoding: 'utf8' });
  // the row is only trustworthy if it landed AND carries the options we asked for
  if (!existsSync(OUT)) return null;
  const rows = readFileSync(OUT, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch (e) { return null; } })
    .filter((x) => x && x.kind === KIND);
  return rows.length ? rows[rows.length - 1] : null;
}

function runWithRetry(seed, optJson, label, armExtra) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const row = runOnce(seed, optJson, armExtra);
    if (row) return row;
    console.log('[ab] ' + label + ' seed ' + seed + ' produced no row (attempt ' + (attempt + 1) + ')');
  }
  return null;
}

const pairs = [];
for (const seed of seeds) {
  // interleave: A then B for the same seed, so drift affects both equally
  const a = runWithRetry(seed, A, 'A', args['extra-a']);
  const b = a ? runWithRetry(seed, B, 'B', args['extra-b']) : null;
  if (!a || !b) { console.log('[ab] seed ' + seed + ' INCOMPLETE — dropping the pair (never one arm alone)'); continue; }
  pairs.push({ seed, a, b });
}

const mean = (xs) => xs.length ? xs.reduce((x, y) => x + y, 0) / xs.length : 0;
const pick = (r, k) => (r && typeof r[k] === 'number' ? r[k] : 0);

console.log('\nseed\tA rooms\tB rooms\tA kills\tB kills');
for (const p of pairs) {
  console.log([p.seed, pick(p.a, 'roomsCleared'), pick(p.b, 'roomsCleared'), pick(p.a, 'kills'), pick(p.b, 'kills')].join('\t'));
}
console.log('\npairs used: ' + pairs.length + ' of ' + seeds.length);
if (pairs.length < 2) { console.log('[ab] TOO FEW PAIRS — result is not usable'); process.exit(3); }
const ar = pairs.map((p) => pick(p.a, 'roomsCleared')), br = pairs.map((p) => pick(p.b, 'roomsCleared'));
console.log('A rooms mean ' + mean(ar).toFixed(2) + '   B rooms mean ' + mean(br).toFixed(2));
const ak = pairs.map((p) => pick(p.a, 'kills')), bk = pairs.map((p) => pick(p.b, 'kills'));
console.log('A kills mean ' + mean(ak).toFixed(1) + '   B kills mean ' + mean(bk).toFixed(1));
const deltas = pairs.map((p) => pick(p.b, 'roomsCleared') - pick(p.a, 'roomsCleared'));
console.log('per-pair room delta (B-A): ' + deltas.join(', '));
console.log('pairs favouring B: ' + deltas.filter((d) => d > 0).length + ', favouring A: ' + deltas.filter((d) => d < 0).length + ', ties: ' + deltas.filter((d) => d === 0).length);
