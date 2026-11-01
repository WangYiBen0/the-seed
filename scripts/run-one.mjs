
// Run one fullrun with budgets that cannot contradict each other.
//   outer timeout  = CLI hard timeout + 120
//   CLI hard       = max(--timeout, gameSec*0.66 + 180) + 150
// Recomputing this by hand has killed three batches, so it is a script now.
import { spawn } from 'node:child_process';
import { appendFileSync } from 'node:fs';

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
const child = spawn(cmd[0], cmd.slice(1), { stdio: 'ignore', detached: false });
const timer = setTimeout(() => { try { child.kill('SIGKILL'); } catch (e) { } appendFileSync('.tmp/runner.log', 'killed by outer timeout\n'); process.exit(3); }, outer);
child.on('exit', (code) => { clearTimeout(timer); appendFileSync('.tmp/runner.log', 'exit=' + code + '\n'); process.exit(0); });
