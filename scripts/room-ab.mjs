#!/usr/bin/env node
// Binary-criterion A/B for the explore (five-lock) target.
//
// Why this exists: bench.js's runAB exposes `reach` for explore as "did maxFloor
// reach N", but five-lock never clears even the first floor (mean 1.67 combat
// rooms of 11), so that criterion has no resolution at all. The usable quantity
// is a ROOM COUNT threshold, which runAB cannot express. Measured by hand it
// works: roomsCleared >= 2 splits six seeds 2/6 (benchmark.md 219).
//
// This automates that: same seeds, both arms, binary outcome, pass-rate summary.
//
//   node scripts/room-ab.mjs --seeds 1,5,11,19,23,29 --rooms 2 \
//     --a '{"summonerFirst":false}' --b '{"summonerFirst":true}'
import { spawn } from 'node:child_process';
import { readFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const args = (() => {
  const o = {}; const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    if (!a[i].startsWith('--')) continue;
    const k = a[i].slice(2);
    if (k === 'a' || k === 'b' || k === 'mods' || k === 'boost-a' || k === 'boost-b') { o[k] = a[++i] ?? ''; continue; }
    const v = (a[i + 1] && !a[i + 1].startsWith('--')) ? a[++i] : true;
    o[k] = v;
  }
  return o;
})();

const SEEDS = String(args.seeds || '1,5,11,19,23,29').split(',').map(Number).filter((n) => n > 0);
const ROOMS = +(args.rooms || 2);
const A = String(args.a || '{}');
const B = String(args.b || '{}');
const MODS = String(args.mods || 'rage,deathfight,bulwark,rot,cyst');
const OUTDIR = String(args.out || '.tmp/roomab');
mkdirSync(OUTDIR, { recursive: true });

const PAR = +(args.parallel || 4);

function runCell(seed, optJson, tag) {
  return new Promise((resolve) => {
    const out = join(OUTDIR, `s${seed}_${tag}.jsonl`);
    rmSync(out, { force: true });
    // Per-arm boost: comparing BUILDS (e.g. a strong gun vs the default drop) needs
    // a different starting weapon per arm, not just a different autopilot flag.
    const boost = (tag === 'off') ? args['boost-a'] : args['boost-b'];
    const extra = boost ? ['--boost', String(boost)] : [];
    const child = spawn(process.execPath, ['scripts/headless-bench.mjs', '--kind', 'fullrun',
      '--seed', String(seed), '--policy', 'rounded', '--goal-depth', '1', '--speed', '8',
      '--diff', 'despair', '--mods', MODS, '--game-seconds', String(args['game-seconds'] || 400),
      '--timeout', String(args.timeout || 400), '--autoOpts', optJson, '--out', out, ...extra], { stdio: 'ignore' });
    child.on('exit', () => {
      let rooms = null;
      try {
        const rows = readFileSync(out, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
        const fr = rows.filter((r) => r.kind === 'fullrun');
        rooms = fr.length ? (fr[fr.length - 1].roomsCleared | 0) : null;
      } catch (e) { rooms = null; }
      resolve({ seed, tag, rooms });
    });
  });
}

const cells = [];
for (const seed of SEEDS) { cells.push([seed, A, 'off']); cells.push([seed, B, 'on']); }

const results = [];
let running = 0, idx = 0;
await new Promise((done) => {
  const pump = () => {
    while (running < PAR && idx < cells.length) {
      const [seed, opt, tag] = cells[idx++]; running++;
      runCell(seed, opt, tag).then((r) => { results.push(r); running--; pump(); });
    }
    if (running === 0 && idx >= cells.length) done();
  };
  pump();
});

results.sort((x, y) => x.seed - y.seed || x.tag.localeCompare(y.tag));
console.log('seed\toff\ton\t(binary >= ' + ROOMS + ' rooms)');
let offPass = 0, onPass = 0, pairs = 0;
for (const seed of SEEDS) {
  const off = results.find((r) => r.seed === seed && r.tag === 'off');
  const on = results.find((r) => r.seed === seed && r.tag === 'on');
  if (!off || !on || off.rooms == null || on.rooms == null) { console.log(seed + '\tINCOMPLETE'); continue; }
  const a = off.rooms >= ROOMS ? 1 : 0, b = on.rooms >= ROOMS ? 1 : 0;
  offPass += a; onPass += b; pairs++;
  console.log([seed, a, b].join('\t'));
}
console.log('--- pairs ' + pairs + '/' + SEEDS.length + '   pass-rate  off=' + offPass + '/' + pairs + '  on=' + onPass + '/' + pairs);
if (pairs < SEEDS.length) { console.log('[room-ab] INCOMPLETE PAIRS — not a result'); process.exit(3); }
