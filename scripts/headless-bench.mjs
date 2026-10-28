#!/usr/bin/env node
// Headless benchmark driver for the [TheSeed] offline mirror.
// Boots site/ in headless Chromium, drives it through the tools' autotest
// protocol (?autotest=...), and collects the "TSW_RESULT {json}" console lines.
//
//   node scripts/headless-bench.mjs --kind fullrun --seed 7 --policy bloom \
//        --goal-depth 2 --speed 8 --timeout 1200 --out results.jsonl
//   node scripts/headless-bench.mjs --smoke            # boot check + screenshot
//
// Chromium is taken from $CHROMIUM or `chromium` on PATH.  Results are printed
// as JSON and (with --out) appended to a JSONL file.

import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, mkdtemp, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, extname, resolve } from 'node:path';
import { existsSync } from 'node:fs';

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith('--')) args[a.slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : true;
}

const ROOT = resolve(new URL('..', import.meta.url).pathname);
// when run via `nix run .#bench` this script lives in the nix store, so the
// site must be resolved from the CWD (repo root) first; fall back to the
// checkout next to the script for direct invocation.
const SITE = [join(process.cwd(), 'site'), join(ROOT, 'site')].find((p) => existsSync(join(p, 'index.html'))) ?? join(process.cwd(), 'site');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.md': 'text/markdown' };

function serve() {
  return new Promise((res) => {
    const srv = createServer(async (req, rsp) => {
      try {
        const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
        let file = join(SITE, path === '/' ? 'index.html' : path);
        if (!existsSync(file)) {
          rsp.writeHead(404); rsp.end('nope');
          appendFile(join(ROOT, '.tmp', 'missing.log'), JSON.stringify({ path, at: Date.now() }) + '\n').catch(() => { });
          return;
        }
        const body = await readFile(file);
        rsp.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
        rsp.end(body);
      } catch (e) { rsp.writeHead(500); rsp.end(String(e)); }
    });
    srv.listen(0, '127.0.0.1', () => res({ srv, port: srv.address().port }));
  });
}

const findChromium = () => {
  for (const c of [process.env.CHROMIUM, 'chromium', 'chromium-browser', 'google-chrome'].filter(Boolean)) {
    const r = spawnSync(c, ['--version'], { stdio: 'ignore' });
    if (r.status === 0) return c;
  }
  console.error('no chromium found (set $CHROMIUM)'); process.exit(2);
};

async function main() {
  const { srv, port } = await serve();
  const chrome = findChromium();
  const profile = await mkdtemp(join(tmpdir(), 'tsw-bench-'));

  const q = new URLSearchParams();
  if (args.smoke) { /* just load */ }
  else {
    q.set('autotest', args.kind || 'throughput');
    if (args.trace) q.set('trace', '1');
    for (const [k, v] of Object.entries({ speed: args.speed, seed: args.seed, policy: args.policy, goalDepth: args['goal-depth'] ?? args.goalDepth, timeoutS: args.timeout, seconds: args.seconds, results: args.results, depth: args.depth, build: args.build, diff: args.diff, mods: args.mods, engine: args.engine, role: args.role, wave: args.wave, rounds: args.rounds, optA: args.optA, optB: args.optB, abKind: args['ab-kind'] ?? args.abKind, startWave: args['start-wave'] ?? args.startWave, boost: args.boost, gens: args.gens, pop: args.pop, seeds: args.seeds, reachWave: args['reach-wave'] ?? args.reachWave, metric: args.metric, det: args.det })) if (v != null) q.set(k, v);
  }
  const url = `http://127.0.0.1:${port}/` + (q.toString() ? '?' + q.toString() : '');
  const shot = args.screenshot ? resolve(String(args.screenshot)) : null;
  if (shot) await mkdir(dirname(shot), { recursive: true });

  const chromeArgs = [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-features=Translate,MediaRouter', '--autoplay-policy=no-user-gesture-required', '--mute-audio',
    `--user-data-dir=${profile}`, `--window-size=${args.width || 1280},${args.height || 800}`,
    '--enable-logging=stderr', '--v=0',
  ];
  if (args.smoke) chromeArgs.push('--screenshot=' + (shot || join(profile, 'shot.png')), '--timeout=15000');
  chromeArgs.push(url);

  console.error(`[bench] ${chrome} ${q.get('autotest') || 'smoke'} → ${url}`);
  // A/B runs `rounds` pairs in ONE session; each pair is 2 runs, so the hard
  // timeout must scale with the work or the whole result is thrown away.
  const rounds = +(args.rounds || 1);
  // evolve is much heavier: generations × pop × seeds full runs
  const gens = +(args.gens || 3), popN = +(args.pop || 6);
  const seedsN = args.seeds ? String(args.seeds).split(',').length : 3;
  const perRun = args.kind === 'evolve' ? (gens * popN * seedsN * (+args.timeout || 120))
    : args.kind === 'ab' ? (+args.timeout || 200) : (+args.timeout || 900);
  // one pair = 2 runs, and each run costs ~timeout + start/measure overhead
  // AB spends (rounds*2 + warmup 2) runs of perRun seconds each; forgetting the
  // warm-up pair made every AB invocation die on the hard timeout.
  const work = args.kind === 'ab' ? (rounds * 2 + 2) * perRun : perRun;
  const hardTimeout = (args.smoke ? 40 : work + 150) * 1000;
  const child = spawn(chrome, chromeArgs, {
    stdio: ['ignore', 'ignore', 'pipe'],
    env: { ...process.env, HOME: profile, XDG_CACHE_HOME: join(profile, 'cache'), XDG_CONFIG_HOME: join(profile, 'config') },
  });
  const results = [];
  const errors = [];
  let buf = '';
  child.stderr.on('data', (d) => {
    buf += d.toString(); let idx;
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, idx); buf = buf.slice(idx + 1);
      // chromium console line: [INFO:CONSOLE(34)] "msg", source: …  (older) or
      // [INFO:CONSOLE:34] "msg", source: …  (newer, parens → colon)
      const m = line.match(/CONSOLE[:()]?\d*\)?\] "(.*)", source/s);
      if (!m) continue;
      const raw = m[1].replace(/\\"/g, '"');
      const msg = raw.replace(/\\n/g, '\n');
      if (args.verbose) console.error('[page] ' + msg.slice(0, 300));
      if (msg.startsWith('TSW_RESULT ')) { try { results.push(JSON.parse(msg.slice(11))); } catch (e) { try { results.push(JSON.parse(raw.slice(11))); } catch (e2) { } } }
      if (/\[ERROR:CONSOLE/.test(line)) errors.push(line.slice(line.indexOf(']"') + 2, 400));
    }
  });

  const timer = setTimeout(() => { console.error('[bench] hard timeout, killing'); child.kill('SIGKILL'); }, hardTimeout);
  if (args.smoke) {
    // smoke mode: wait for chromium to exit on its own (screenshot taken), report console errors
    await new Promise((res) => child.on('exit', res));
  } else {
    // wait until at least one result arrives (or chrome dies)
    await new Promise((res) => {
      const iv = setInterval(() => { if (results.length) { clearInterval(iv); res(); } }, 500);
      child.on('exit', () => { clearInterval(iv); res(); });
    });
    setTimeout(() => child.kill('SIGKILL'), 4000);
  }
  clearTimeout(timer);
  srv.close();
  try { child.kill('SIGKILL'); } catch (e) { }

  if (results.length) {
    for (const r of results) console.log(JSON.stringify(r));
    if (results.length > 1) {
      const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
      const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / Math.max(1, a.length - 1)); };
      const g = results.map((r) => r.gameT || 0), k = results.map((r) => r.kills || 0);
      console.log(JSON.stringify({ kind: 'summary', runs: results.length, gameT: +mean(g).toFixed(1), gameTsd: +sd(g).toFixed(1), kills: +mean(k).toFixed(1), killsSd: +sd(k).toFixed(1) }));
    }
    if (args.out) { await mkdir(dirname(resolve(String(args.out))), { recursive: true }); await writeFile(resolve(String(args.out)), results.map((r) => JSON.stringify(r)).join('\n') + '\n', { flag: 'a' }); }
  } else {
    console.error('[bench] no TSW_RESULT captured');
    if (errors.length) console.error('[bench] console errors:\n' + errors.slice(0, 10).join('\n'));
  }
  if (args.smoke && shot) console.error('[bench] screenshot → ' + shot);
  process.exit(results.length || args.smoke ? 0 : 3);
}

main();
