// Timeout semantics.  --timeout is WALL seconds, but the browser only reaches
// ~4x realtime even at speed 8 (measured gameT/wall = 3.29-4.68 across 11 runs).
// A despair five-lock run needs 2500+ game-seconds, so --timeout 200 cut the
// second half off and a run that was 11 s short of the kill was recorded as a
// timeout and read as a failure.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BENCH = readFileSync(join(ROOT, 'site', 'tools', 'bench.js'), 'utf8');
const CLI = readFileSync(join(ROOT, 'scripts', 'headless-bench.mjs'), 'utf8');
const PANEL = readFileSync(join(ROOT, 'site', 'tools', 'panel.js'), 'utf8');

test('fullrun accepts a game-time budget, not only a wall one', () => {
  assert.ok(/runFullRun\(\{[^}]*gameSeconds/.test(BENCH), 'runFullRun must take gameSeconds');
  assert.match(BENCH, /const gameBudget = \+\(gameSeconds \|\| 0\)/, 'the budget must be read');
  assert.match(BENCH, /ranOut/, 'the budget must gate the end condition');
});

test('the budget is wired end to end', () => {
  assert.match(CLI, /game-seconds/, 'the CLI must forward --game-seconds');
  assert.match(PANEL, /gameSeconds: q\.get\('gameSeconds'\)/, 'the autotest URL must accept gameSeconds');
  assert.match(BENCH, /gameSeconds,/, 'the row must record the budget it ran under');
});

test('a wall ceiling still exists so a hung browser cannot run forever', () => {
  assert.match(BENCH, /wall > gameBudget \* 0\.66 \+ 180/, 'game budget needs a wall backstop derived from the measured ratio');
});
