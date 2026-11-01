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

function serve(posted) {
  return new Promise((res) => {
    const srv = createServer(async (req, rsp) => {
      try {
        // Result intake: tools/panel.js POSTs every emitted row here, so the
        // harness never has to scrape the console (which yields nothing on
        // current chromium) nor race a CDP attach.
        if (req.method === 'POST' && req.url === '/__result') {
          let raw = '';
          req.on('data', (d) => { raw += d.toString(); if (raw.length > 4_000_000) req.destroy(); });
          req.on('end', () => {
            try { posted.push(JSON.parse(raw)); } catch (e) { posted.push({ error: 'bad json: ' + raw.slice(0, 120) }); }
            rsp.writeHead(204); rsp.end();
          });
          return;
        }
        const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
        // '/' serves auto.html: the bench drives the game through tools/panel.js's
        // ?autotest= protocol, so it needs the tools preloaded.  index.html is a
        // host page that mounts the game in an iframe, and game.html is the
        // vanilla game with NO tools — pointing the bench at either one breaks
        // measurement silently (verified: the run timed out with no TSW_RESULT).
        let file = join(SITE, path === '/' ? 'auto.html' : path);
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
  const posted = [];
  const { srv, port } = await serve(posted);
  const chrome = findChromium();
  const profile = await mkdtemp(join(tmpdir(), 'tsw-bench-'));
  // a random high port, so parallel runs cannot collide
  const dbgPort = 9200 + Math.floor(Math.random() * 500);

  const q = new URLSearchParams();
  if (args.smoke) { /* just load */ }
  else {
    q.set('autotest', args.kind || 'throughput');
    if (args.trace) q.set('trace', '1');
    for (const [k, v] of Object.entries({ speed: args.speed, seed: args.seed, policy: args.policy, goalDepth: args['goal-depth'] ?? args.goalDepth, timeoutS: args.timeout, seconds: args.seconds, results: args.results, depth: args.depth, build: args.build, diff: args.diff, mods: args.mods, engine: args.engine, role: args.role, wave: args.wave, rounds: args.rounds, optA: args.optA, optB: args.optB, abKind: args['ab-kind'] ?? args.abKind, startWave: args['start-wave'] ?? args.startWave, boost: args.boost, gens: args.gens, pop: args.pop, seeds: args.seeds, reachWave: args['reach-wave'] ?? args.reachWave, metric: args.metric, det: args.det, autoOpts: args.autoOpts, hp: args.hp, armor: args.armor, floor: args.floor, gameSeconds: args['game-seconds'] ?? args.gameSeconds, abortOn: args['abort-on'] ?? args.abortOn, perf: args.perf })) if (v != null) q.set(k, v);
  }
  // rpost tells the page to POST its rows back to this server (see serve()).
  q.set('rpost', '/__result');
  const url = `http://127.0.0.1:${port}/` + (q.toString() ? '?' + q.toString() : '');
  const shot = args.screenshot ? resolve(String(args.screenshot)) : null;
  if (shot) await mkdir(dirname(shot), { recursive: true });

  const chromeArgs = [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    // REQUIRED in this environment.  Without them chromium starts, the window
    // exists, and the page's scripts never run far enough to emit anything —
    // measured: an identical URL run by a hand-written CDP harness (which passes
    // these) produced a full row in 12 s, while this binary hit its 409 s hard
    // timeout with "no TSW_RESULT captured".  ci-login.mjs already passes them
    // for the same reason (ZygoteHostImpl::Init SIGTRAP in containers).
    '--no-sandbox', '--no-zygote', '--disable-dev-shm-usage',
    '--disable-features=Translate,MediaRouter', '--autoplay-policy=no-user-gesture-required', '--mute-audio',
    `--user-data-dir=${profile}`, `--window-size=${args.width || 1280},${args.height || 800}`,
    '--enable-logging=stderr', '--v=0',
    // A debug port makes the page's console reachable over CDP.  The stderr
    // console scrape below is kept as a fallback, but on current chromium it
    // yields NOTHING: measured, a fullrun that emitted a complete TSW_RESULT was
    // reported as "no TSW_RESULT captured", and every run looked like a hang
    // while the game was in fact running normally.
    '--remote-debugging-port=' + dbgPort,
  ];
  if (args.smoke) chromeArgs.push('--screenshot=' + (shot || join(profile, 'shot.png')), '--timeout=15000');
  // Start on the target url directly.  The POST channel added in panel.js makes
  // the previous "attach CDP before the page starts" dance unnecessary and, more
  // importantly, that dance was the reason nothing ran at all: with about:blank
  // as the launch url the page only existed as a CDP target, and the autotest
  // protocol never executed.  Measured: identical URL via a plain webbrowser
  // launch emits a row in seconds, while the CDP-navigated one hit its hard
  // timeout with "no TSW_RESULT captured".
  chromeArgs.push(url);

  console.error(`[bench] ${chrome} ${q.get('autotest') || 'smoke'} → ${url}`);
  // A/B runs `rounds` pairs in ONE session; each pair is 2 runs, so the hard
  // timeout must scale with the work or the whole result is thrown away.
  const rounds = +(args.rounds || 1);
  // evolve is much heavier: generations × pop × seeds full runs
  const gens = +(args.gens || 3), popN = +(args.pop || 6);
  const seedsN = args.seeds ? String(args.seeds).split(',').length : 3;
  // evolve: each candidate plays `seeds` games, and each game is timed in GAME
  // seconds then compressed by the speed multiplier.  Budget wall time, not game
  // time, or small runs die on the hard timeout before emitting TSW_RESULT.
  const evSpeed = Math.max(1, +args.speed || 8);
  // per GAME: (game seconds) / speed, plus ~14 s of fixed session cost
  // (page load, waitScripts, crafted-save resume, the 8 s play-state wait).
  // A game that ENDS EARLY (death) still costs its full share of wall time once
  // the fixed session overhead is counted: measured 67 s of wall time for a run
  // that only reached 274 game-seconds, so (game)/speed is a lower bound, not an
  // estimate.  Charge the overhead generously; a slightly long budget only wastes
  // an idle tail, a short one throws the whole evolution away.
  // a --game-seconds budget is converted to wall time here too: the browser
  // reaches only ~4x realtime, and the in-page backstop allows gameBudget*6+60.
  // Without this the outer chromium is killed BEFORE the page decides the run is
  // over, and the whole result is thrown away as "no TSW_RESULT".
  const gameSec = +(args['game-seconds'] ?? args.gameSeconds ?? 0);
  const wallFromGame = gameSec ? gameSec * 0.66 + 180 : 0;
  const perRun = args.kind === 'evolve' ? (gens * popN * seedsN * ((+(args.timeout || 120) + 60) / evSpeed + 55))
    : args.kind === 'ab' ? (+args.timeout || 200) : Math.max(+args.timeout || 900, wallFromGame);
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
  // ---- CDP console channel (secondary) -----------------------------------
  // The page already launched at the target url, so this channel only LISTENS.
  // It exists as a backup to the POST intake: if the page cannot POST, the
  // console still carries the same rows.
  const cdpPromise = (async () => {
    let wsUrl = null;
    for (let i = 0; i < 120 && !wsUrl; i++) {
      try {
        const r = await fetch('http://127.0.0.1:' + dbgPort + '/json/list');
        if (r.ok) {
          const list = await r.json();
          const page = list.find((x) => x.type === 'page' && /127\.0\.0\.1/.test(x.url || ''));
          if (page && page.webSocketDebuggerUrl) wsUrl = page.webSocketDebuggerUrl;
        }
      } catch (e) { }
      if (!wsUrl) await new Promise((r) => setTimeout(r, 250));
    }
    if (!wsUrl) return false;
    let sock;
    try { sock = new WebSocket(wsUrl); } catch (e) { return false; }
    await new Promise((res, rej) => { sock.onopen = res; sock.onerror = rej; });
    let id = 1;
    sock.onmessage = (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.method !== 'Runtime.consoleAPICalled') return;
      const parts = (m.params.args || []).map((a) => (a.value !== undefined ? a.value : (a.description || '')));
      const msg = parts.join(' ');
      if (args.verbose) console.error('[page] ' + msg.slice(0, 300));
      if (msg.startsWith('TSW_RESULT ')) { try { results.push(JSON.parse(msg.slice(11))); } catch (e) { } }
      if (m.params.type === 'error') errors.push(msg.slice(0, 300));
    };
    try { sock.send(JSON.stringify({ id: id++, method: 'Runtime.enable', params: {} })); } catch (e) { }
    return true;
  })();
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
      // wait for a row on EITHER channel: the POST intake is the reliable one
      const iv = setInterval(() => { if (results.length || posted.length) { clearInterval(iv); res(); } }, 500);
      child.on('exit', () => { clearInterval(iv); res(); });
    });
    // give the POST a moment to arrive after the title flips
    await new Promise((r) => setTimeout(r, 1500));
    setTimeout(() => child.kill('SIGKILL'), 4000);
  }
  clearTimeout(timer);
  // fold the POSTed rows into results (dedupe: a row may arrive on both channels)
  for (const r of posted) {
    if (!r || typeof r !== 'object') continue;
    if (results.some((x) => JSON.stringify(x) === JSON.stringify(r))) continue;
    results.push(r);
  }
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