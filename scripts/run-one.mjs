
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
// Each attempt is capped rather than given the full budget.  Measured: a healthy
// run of 94 game-seconds finished in 25.9 s (3.63 game-s per wall-s), while a
// wedged one burned the whole 912 s outer limit and only produced a row on the
// retry.  Capping each attempt makes a hang cost a third of that, and the retry
// path (which fires whenever no row was produced) absorbs the loss.
const ATTEMPT_CAP_MS = 400 * 1000;
const outer = Math.min(hard + 120 * 1000, ATTEMPT_CAP_MS);

const out = get('out', '.tmp/run.jsonl');
const cmd = ['node', 'scripts/headless-bench.mjs', '--kind', 'fullrun', '--seed', seed,
  '--policy', 'rounded', '--goal-depth', '1', '--speed', '8',
  '--timeout', String(benchTimeout), '--game-seconds', String(gameSec),
  '--diff', 'despair', '--mods', 'rage,deathfight,bulwark,rot,cyst', '--out', out];

// A tag keeps concurrent batches from sharing runner.log / run-<seed>.log.
// Without one, two batches wrote into the same file and each parsed the other's
// rows as its own — the cause of several "impossible" results earlier.
const tag = get('tag', '');
const RUNNER_LOG = '.tmp/runner' + (tag ? '-' + tag : '') + '.log';
const logPath = '.tmp/run-' + seed + (tag ? '-' + tag : '') + '.log';

appendFileSync(RUNNER_LOG, '[' + new Date().toISOString().slice(11, 19) + '] start seed=' + seed + ' gameSec=' + gameSec + ' outer=' + (outer / 1000) + 's\n');
// Stream the bench output into a log instead of discarding it: with
// stdio:'ignore' a run that never emits TSW_RESULT is indistinguishable from one
// that is still booting, and that ambiguity has cost several batches.
// TRUNCATE, not append: the harvester reads the whole file, so an append-mode
 // log would re-harvest every earlier row for the same seed.  Measured: a run
 // asking for --game-seconds 400 harvested four rows from previous runs.
const logFd = openSync(logPath, 'w');
appendFileSync(logPath, '[' + new Date().toISOString().slice(11, 19) + '] ' + cmd.join(' ') + '\n');
// headless-bench exits 3 when it captured no TSW_RESULT — a chromium boot
// failure (its log stops at the launch line), not a result.  On this machine
// that happens intermittently, so re-exec ONCE with RETRY=1 instead of leaving
// a hole where a row should be.  ESM has no require(), hence re-exec.
const retrying = process.env.RETRY === '1';
const child = spawn(cmd[0], cmd.slice(1), { stdio: ['ignore', logFd, logFd], detached: false });

// NO STALL WATCHDOG.  Two versions were written and both were wrong:
//   1. watching LOG growth — the bench logs only two lines (launch and result),
//      so every normal 250 s run was killed at 120 s and it looked like the
//      browser was hanging on this machine. It was not; the watchdog was.
//   2. watching the CHILD's CPU — the child is node, which starts chromium and
//      then sits idle; the CPU is in the grandchild, so node looked dead too.
//
// The outer timeout already covers a genuine hang, and the exit code / harvest
// path turns a failed run into a retry.  A watchdog that guesses is worse than
// one that does not exist: it invents failures on healthy runs.
const outerTimer = setTimeout(() => {
  try { child.kill('SIGKILL'); } catch (e) { }
  appendFileSync(RUNNER_LOG, 'killed by outer timeout\n');
}, outer);

// Pull every TSW_RESULT row out of a streamed log and append it to --out.
// Returns how many rows were written.
// Baseline size of the out file, captured BEFORE the bench runs.  Taking it
// inside harvest() is useless: by then the bench has already written, so the
// comparison always said "grew", and every row was appended twice (measured:
// two byte-identical lines, same timestamp).
let outSizeBefore = 0;
try { outSizeBefore = statSync(out).size; } catch (e) { outSizeBefore = 0; }

function harvest(logFile, outFile, sizeBefore) {
  const already = sizeBefore || 0;
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
  // If the bench's own writer already appended this run's rows, do nothing.
  let grew = 0;
  try { grew = statSync(outFile).size - already; } catch (e) { grew = 0; }
  if (grew > 0) return 0;
  try {
    const dir = outFile.replace(/[^/]*$/, '');
    if (dir) mkdirSync(dir, { recursive: true });
    for (const r of rows) appendFileSync(outFile, JSON.stringify(r) + '\n');
  } catch (e) { return 0; }
  return rows.length;
}

child.on('exit', (code) => {
  clearTimeout(outerTimer);
  appendFileSync(RUNNER_LOG, 'exit=' + code + '\n');
  // The bench prints every result to stdout; its --out writer has been
  // unreliable here (a run can log a complete TSW_RESULT and still leave no
  // file), so harvest the row from the log we already streamed.  That makes the
  // log the single source of truth and removes a silent-data-loss path.
  const got = harvest(logPath, out, outSizeBefore);
  appendFileSync(RUNNER_LOG, 'harvested=' + got + '\n');
  // Retry whenever NO ROW was produced — regardless of the exit code.  The
  // bench can exit 0 having emitted nothing (measured: seed 1 exited 0 with an
  // empty log), and gating the retry on a non-zero code lost that seed silently.
  if (got === 0 && !retrying) {
    appendFileSync(RUNNER_LOG, 'no result (exit ' + code + '); retrying once\n');
    const again = spawn(process.execPath, [process.argv[1], ...args], { stdio: 'inherit', env: { ...process.env, RETRY: '1' } });
    again.on('exit', (c2) => { appendFileSync(RUNNER_LOG, 'retry exit=' + c2 + '\n'); process.exit(0); });
    return;
  }
  process.exit(0);
});