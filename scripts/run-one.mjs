
// Run one fullrun with budgets that cannot contradict each other.
//   outer timeout  = CLI hard timeout + 120
//   CLI hard       = max(--timeout, gameSec*0.66 + 180) + 150
// Recomputing this by hand has killed three batches, so it is a script now.
import { spawn } from 'node:child_process';
import { appendFileSync, openSync } from 'node:fs';

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
const logPath = '.tmp/run-' + seed + '.log';
const logFd = openSync(logPath, 'a');
appendFileSync(logPath, '[' + new Date().toISOString().slice(11, 19) + '] ' + cmd.join(' ') + '\n');
// headless-bench exits 3 when it captured no TSW_RESULT — a chromium boot
// failure (its log stops at the launch line), not a result.  On this machine
// that happens intermittently, so re-exec ONCE with RETRY=1 instead of leaving
// a hole where a row should be.  ESM has no require(), hence re-exec.
const retrying = process.env.RETRY === '1';
const child = spawn(cmd[0], cmd.slice(1), { stdio: ['ignore', logFd, logFd], detached: false });
const outerTimer = setTimeout(() => {
  try { child.kill('SIGKILL'); } catch (e) { }
  appendFileSync('.tmp/runner.log', 'killed by outer timeout\n');
  process.exit(3);
}, outer);
child.on('exit', (code) => {
  clearTimeout(outerTimer);
  appendFileSync('.tmp/runner.log', 'exit=' + code + '\n');
  if (code === 3 && !retrying) {
    appendFileSync('.tmp/runner.log', 'boot failure; retrying once\n');
    const again = spawn(process.execPath, [process.argv[1], ...args], {
      stdio: 'inherit', env: { ...process.env, RETRY: '1' },
    });
    again.on('exit', (c2) => { appendFileSync('.tmp/runner.log', 'retry exit=' + c2 + '\n'); process.exit(0); });
    return;
  }
  process.exit(0);
});
