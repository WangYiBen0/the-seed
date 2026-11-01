// The two strict evaluation rules the user asked for: in an α-serum window any
// hp loss is permanent (α takes losses out of MAX hp), and a run whose armour
// hits zero has already failed the endurance test. Without an explicit flag a
// 'did it survive' experiment silently measures a different question.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BENCH = readFileSync(join(ROOT, 'site', 'tools', 'bench.js'), 'utf8');
const CLI = readFileSync(join(ROOT, 'scripts', 'headless-bench.mjs'), 'utf8');
const PANEL = readFileSync(join(ROOT, 'site', 'tools', 'panel.js'), 'utf8');

test('fullrun accepts an abort rule', () => {
  assert.ok(/runFullRun\(\{[^}]*abortOn/.test(BENCH), 'runFullRun must take abortOn');
  assert.match(BENCH, /abortOn === 'alphaHp'/, 'the α rule must exist');
  assert.match(BENCH, /abortOn === 'zeroArmor'/, 'the armour rule must exist');
});

test('an aborted run is labelled, not reported as a timeout', () => {
  assert.ok(BENCH.includes("end: aborted ? 'aborted' :"), 'the end reason must distinguish abort');
  assert.match(BENCH, /abortOn: abortOn \|\| null,/, 'the row must record the rule');
});

test('the flag is wired end to end', () => {
  assert.match(CLI, /abort-on/, 'the CLI must forward --abort-on');
  assert.match(PANEL, /abortOn: q\.get\('abortOn'\)/, 'the autotest URL must accept it');
});
