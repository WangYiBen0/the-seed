// Panel wiring, verified against the live DOM (headless chromium): the workshop
// rendered 22 checkboxes across 5 dropdowns, zero "[object Object]" labels, and a
// toggled checkbox survived a reload (chest true -> false, stored null -> false).
//
// The bug these guard: setOpt(label, sk) used the first argument as the opts KEY,
// but callers passed a Chinese label — so every 细项 checkbox wrote ao['自动开箱']
// (a key that does not exist), never touched opts.chest, and nothing persisted.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PANEL = readFileSync(join(ROOT, 'site', 'tools', 'panel.js'), 'utf8');
const AUTO = readFileSync(join(ROOT, 'site', 'tools', 'auto.js'), 'utf8');

test('setOpt binds the opts key explicitly, not the label', () => {
  assert.match(PANEL, /const setOpt = \(label, key, sk\)/, 'setOpt must take label, key, settings key');
  assert.match(PANEL, /check\(label, \(\) => ao\[key\], \(v\) => \{ ao\[key\] = v; TSW\.settings\.set\(sk, v\); \}\)/,
    'the checkbox must read and write ao[key] and persist under sk');
});

test('every detail option maps to a real opts key', () => {
  const m = PANEL.match(/const autoItems = \[([\s\S]*?)\];/);
  assert.ok(m, 'the option table must exist');
  const rows = [...m[1].matchAll(/\['([^']*)', '([^']*)', '([^']*)'\]/g)];
  assert.ok(rows.length >= 15, 'the table must list every 细项, got ' + rows.length);
  for (const [, , key] of rows) {
    assert.ok(new RegExp('^      ' + key + ': ', 'm').test(AUTO),
      'opts.' + key + ' is not declared in auto.js');
  }
});

test('the learner panel row reads and writes TSW.auto.learn, not opts', () => {
  // The learner lives on TSW.auto.learn rather than A.opts, so a control bound to
  // the generic opts path would write a key nothing reads — the same shape as the
  // setOpt(label, sk) bug above, which left every checkbox non-functional.
  assert.match(PANEL, /TSW\.auto\.learn\.on/, 'the switch must read the learner state');
  assert.match(PANEL, /TSW\.auto\.learn\.set\('on', v\)/,
    'the switch must write through the learner setter so it persists');
  assert.match(PANEL, /TSW\.auto\.learn\.reset\(true\)/, 'reset must clear the stored genome');
  assert.match(PANEL, /TSW\.auto\.learn\.dump\(\)/, 'the row must paint live learner state');
  // It must refresh on the events that change it, or the line goes stale.
  assert.match(PANEL, /TSW\.bus\.on\('auto', paintLearn\)/, 'the row must repaint on auto changes');
  assert.match(PANEL, /TSW\.bus\.on\('newRun', paintLearn\)/, 'the row must repaint on a new run');
  // And the API it calls must actually exist on the learner.
  assert.match(AUTO, /A\.learn\.set = /, 'A.learn.set must exist');
  assert.match(AUTO, /A\.learn\.dump = /, 'A.learn.dump must exist');
  assert.match(AUTO, /A\.learn\.reset = /, 'A.learn.reset must exist');
});

test('localised names never leak [object Object]', () => {
  // the only remaining mention is the explanatory comment, so strip comments first
  const code = PANEL.replace(/\/\/[^\n]*/g, '');
  assert.ok(!/String\(k\.nm/.test(code), 'the skill list must not String() an N4 object');
  assert.match(PANEL, /typeof v === 'object'\) return v\.zhs \|\| v\.zh \|\| v\.en \|\| v\.ja/,
    'L1 must resolve N4 objects to a localised string');
});

test('goal pickers are multi-select and tolerate legacy string values', () => {
  assert.match(AUTO, /const goalList = \(k\) =>/, 'goals must normalise to a list');
  assert.match(AUTO, /Array\.isArray\(v\)\) return v\.filter\(Boolean\)/, 'a stored list must be accepted');
  assert.match(AUTO, /typeof v === 'string'\) return v\.split\(','\).map/, 'a legacy single id must still work');
  assert.match(PANEL, /multiDrop\(r, label/, 'goal pickers must use the dropdown control');
});
