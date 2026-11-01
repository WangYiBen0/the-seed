
// Run one fullrun with budgets that cannot contradict each other.
//   outer timeout  = CLI hard timeout + 120
//   CLI hard       = max(--timeout, gameSec*0.66 + 180) + 150
// Recomputing this by hand has killed three batches, so it is a script now.
import { spawn } from 'node:child_process';
import { appendFileSync, openSync, statSync, readFileSync, mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const seed = get('seed', '1');
const gameSec = +(get('game-seconds', '1600'));
const benchTimeout = +(get('timeout', '900'));

const wallFromGame = gameSec ? gameSec * 0.66 + 180 : 0;
const hard = (Math.max(benchTimeout, wallFromGame) + 150) * 1000;
const outer = hard + 120 * 1000;

const out = get('out', '.tmp/run.jsonl');
const cmd = ['node', 'scripts/headless-bench.mjs', '--kind', 'fullrun', '--seed', seed,
  '--policy', 'rounded', '--goal-depth', '1', '--speed', '8',
  '--timeout', String(benchTimeout), '--game-seconds', String(gameSec),
  '--diff', 'despair', '--mods', 'rage,deathfight,bulwark,rot,cyst', '--out', out];

appendFileSync('.tmp/runner.log', '[' + new Date().toISOString().slice(11, 19) + '] start seed=' + seed + ' gameSec=' + gameSec + ' outer=' + (outer / 1000) + 's\n');
// Stream the bench output into a log instead of discarding it: with
// stdio:'ignore' a run that never emits TSW_RESULT is indistinguishable from one
// that is still booting, and that ambiguity has cost several batches.
// TRUNCATE, not append: the harvester reads the whole file, so an append-mode
 // log would re-harvest every earlier row for the same seed.  Measured: a run
 // asking for --game-seconds 400 harvested four rows from previous runs.
const logPath = '.tmp/run-' + seed + '.log';
const logFd = openSync(logPath, 'w');
appendFileSync(logPath, '[' + new Date().toISOString().slice(11, 19) + '] ' + cmd.join(' ') + '\n');
// headless-bench exits 3 when it captured no TSW_RESULT — a chromium boot
// failure (its log stops at the launch line), not a result.  On this machine
// that happens intermittently, so re-exec ONCE with RETRY=1 instead of leaving
// a hole where a row should be.  ESM has no require(), hence re-exec.
const retrying = process.env.RETRY === '1';
const child = spawn(cmd[0], cmd.slice(1), { stdio: ['ignore', logFd, logFd], detached: false });

// Watchdog on LOG STALL, not on total time.  A bench that emits nothing for
// STALL_MS after the launch line is genuinely hung (measured: seed 5 sat for 4+
// minutes against a ~120 s budget with the log frozen at the launch line), while
// a slow-but-working run keeps writing.  Without this, a hang burns the whole
// outer budget and the batch loses that seed silently.
const STALL_MS = 120000;
let lastSize = 0, lastGrowth = Date.now();
const watch = setInterval(() => {
  let size = 0;
  try { size = statSync(logPath).size; } catch (e) { }
  if (size > lastSize) { lastSize = size; lastGrowth = Date.now(); return; }
  if (Date.now() - lastGrowth > STALL_MS) {
    clearInterval(watch);
    try { child.kill('SIGKILL'); } catch (e) { }
    appendFileSync('.tmp/runner.log', 'log stalled >' + (STALL_MS / 1000) + 's; killed\n');
  }
}, 5000);

const outerTimer = setTimeout(() => {
  try { child.kill('SIGKILL'); } catch (e) { }
  appendFileSync('.tmp/runner.log', 'killed by outer timeout\n');
}, outer);

// Pull every TSW_RESULT row out of a streamed log and append it to --out.
// Returns how many rows were written.
function harvest(logFile, outFile) {
  let text = '';
  try { text = readFileSync(logFile, 'utf8'); } catch (e) { return 0; }
  const rows = [];
  for (const line of text.split('\n')) {
    const i = line.indexOf('{"kind"');
    if (i < 0) continue;
    try {
      const o = JSON.parse(line.slice(i));
      // only the run's own result row: 'summary' and stale rows do not belong
      if (o && o.kind === 'fullrun') rows.push(o);
    } catch (e) { }
  }
  if (!rows.length) return 0;
  try {
    const dir = outFile.replace(/[^/]*$/, '');
    if (dir) mkdirSync(dir, { recursive: true });
    for (const r of rows) appendFileSync(outFile, JSON.stringify(r) + '\n');
  } catch (e) { return 0; }
  return rows.length;
}

child.on('exit', (code) => {
  clearInterval(watch);
  clearTimeout(outerTimer);
  appendFileSync('.tmp/runner.log', 'exit=' + code + '\n');
  // The bench prints every result to stdout; its --out writer has been
  // unreliable here (a run can log a complete TSW_RESULT and still leave no
  // file), so harvest the row from the log we already streamed.  That makes the
  // log the single source of truth and removes a silent-data-loss path.
  const got = harvest(logPath, out);
  appendFileSync('.tmp/runner.log', 'harvested=' + got + '\n');
  if (code !== 0 && got === 0 && !retrying) {
    appendFileSync('.tmp/runner.log', 'no result (exit ' + code + '); retrying once\n');
    const again = spawn(process.execPath, [process.argv[1], ...args], { stdio: 'inherit', env: { ...process.env, RETRY: '1' } });
    again.on('exit', (c2) => { appendFileSync('.tmp/runner.log', 'retry exit=' + c2 + '\n'); process.exit(0); });
    return;
  }
  process.exit(0);
});
