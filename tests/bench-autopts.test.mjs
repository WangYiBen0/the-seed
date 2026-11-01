// Guard the defect where a result row reported the DEFAULTS instead of the
// arm it actually ran: TSW.auto.opts was restored before the row was built, so
// an A/B that set a flag to false produced rows identical to the arm that left
// it true.  That silently invalidated a whole experiment.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = readFileSync(join(ROOT, 'site', 'tools', 'bench.js'), 'utf8');

test('fullrun captures applied autoOpts before restoring them', () => {
  const cap = SRC.indexOf('appliedOpts[k] = TSW.auto.opts[k]');
  assert.ok(cap > 0, 'the applied-value capture is missing');
  // the restore loop that puts the originals back
  const restore = SRC.indexOf('for (const [k, v] of Object.entries(optSaved)) TSW.auto.opts[k] = v;');
  assert.ok(restore > 0, 'the restore loop is missing');
  assert.ok(cap < restore, 'applied autoOpts are captured after they were restored — rows will report defaults');
});

test('fullrun rows carry both the applied and the requested flags', () => {
  assert.match(SRC, /autoOpts: appliedOpts,/, 'the row must record what actually ran');
  assert.match(SRC, /autoOptsRequested:/, 'the row must record what the caller asked for');
  assert.match(SRC, /autoOptsUnknown: optUnknown\.slice\(\)/, 'unknown keys must be visible in the row');
});
