// Invade wave accounting.  ivStartWave() does `iv.wave++` on entry
// (invade.js:76), so the stored wave is one less than the wave being played.
// Earlier rows were read as "the bot is stuck at wave 6" when the number was
// actually the start wave plus a couple of clears.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = readFileSync(join(ROOT, 'site', 'tools', 'bench.js'), 'utf8');
const IV = readFileSync(join(ROOT, 'site', 'js', 'invade.js'), 'utf8');

test('the game increments wave on entry, which the row must account for', () => {
  assert.match(IV, /iv\.wave\+\+/, 'invade.js still bumps the wave on entry');
});

test('invade rows separate the start wave from real progress', () => {
  assert.match(SRC, /wavesPlayed: /, 'progress must be a first-class field');
  assert.match(SRC, /wavesPlayed: Math\.max\(0, \(peakWave/, 'progress must be relative to the start wave');
});

test('a run cut off by the budget is distinguishable from a death', () => {
  assert.match(SRC, /cutOff: g\.state !== 'dead' && g\.state !== 'win'/, 'cut-off runs must be flaggable');
});
