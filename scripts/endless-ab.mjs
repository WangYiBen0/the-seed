#!/usr/bin/env node
// Binary A/B for the endless target: "did the run reach the budget" (end=goal).
//
// Endless survival is bimodal, not continuous (benchmark.md 229): across ten seeds
// two runs reached end=goal and eight died inside 56 game-seconds. A mean of
// "92 seconds" hides that, so the honest criterion is the boolean goal rate.
//
//   node scripts/endless-ab.mjs --seeds 1,2,3,4,5,6,7,8,9,10 \
//     --a '{}' --b '{"genome":{"retreatHi":340}}'
import { spawn } from 'node:child_process';
import { readFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const args = (() => {
  const o = {}; const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    if (!a[i].startsWith('--')) continue;
    const k = a[i].slice(2);
    if (k === 'a' || k === 'b' || k === 'boost') { o[k] = a[++i] ?? ''; continue; }
    const v = (a[i + 1] && !a[i + 1].startsWith('--')) ? a[++i] : true;
    o[k] = v;
  }
  return o;
})();

const SEEDS = String(args.seeds || '1,2,3,4,5,6,7,8,9,10').split(',').map(Number).filter((n) => n > 0);
const A = String(args.a || '{}');
const B = String(args.b || '{}');
const BOOST = String(args.boost || '{"weapons":["hail","twin"],"wlv":{"hail":3},"shards":{"vital":3},"ink":300,"endless":1}');
const OUTDIR = String(args.out || '.tmp/endlessab');
const PAR = +(args.parallel || 4);
mkdirSync(OUTDIR, { recursive: true });

function runCell(seed, optJson, tag) {
  return new Promise((resolve) => {
    const out = join(OUTDIR, 's' + seed + '_' + tag + '.jsonl');
    rmSync(out, { force: true });
    const child = spawn(process.execPath, ['scripts/headless-bench.mjs', '--kind', 'fullrun',
      '--seed', String(seed), '--policy', 'rounded', '--goal-depth', '3', '--speed', '8',
      '--diff', 'classic', '--game-seconds', String(args['game-seconds'] || 400),
      '--timeout', String(args.timeout || 400), '--boost', BOOST,
      '--autoOpts', optJson, '--out', out], { stdio: 'ignore' });
    child.on('exit', () => {
      let row = null;
      try {
        const rows = readFileSync(out, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
        const fr = rows.filter((r) => r.kind === 'fullrun');
        row = fr.length ? fr[fr.length - 1] : null;
      } catch (e) { row = null; }
      resolve({ seed, tag, end: row ? row.end : null, gameT: row ? row.gameT : null });
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

console.log('seed\toff end\toff sec\ton end\ton sec');
let offP = 0, onP = 0, pairs = 0;
for (const seed of SEEDS) {
  const off = results.find((r) => r.seed === seed && r.tag === 'off');
  const on = results.find((r) => r.seed === seed && r.tag === 'on');
  if (!off || !on || off.end == null || on.end == null) { console.log(seed + '\tINCOMPLETE'); continue; }
  const a = off.end === 'goal' ? 1 : 0, b = on.end === 'goal' ? 1 : 0;
  offP += a; onP += b; pairs++;
  console.log([seed, off.end, off.gameT, on.end, on.gameT].join('\t'));
}
console.log('--- pairs ' + pairs + '/' + SEEDS.length + '   goal-rate  off=' + offP + '/' + pairs + '  on=' + onP + '/' + pairs);
if (pairs < SEEDS.length) { console.log('[endless-ab] INCOMPLETE PAIRS — not a result'); process.exit(3); }
