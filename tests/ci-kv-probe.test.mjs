// The cloud-save endpoint probe.  docs/iframe-sso.md only ever recorded the
// ANONYMOUS answer of /api/gamefy/<gameId>/kv (401 {"error":"请先登录"}); whether
// a signed-in cookie session can actually use it was never checked, yet the
// whole iframe-host design depends on that.  ci-login reads it and CI prints it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOGIN = readFileSync(join(ROOT, 'scripts', 'ci-login.mjs'), 'utf8');
const WF = readFileSync(join(ROOT, '.github', 'workflows', 'sync.yml'), 'utf8');

test('ci-login probes the kv endpoint from the signed-in page, read-only', () => {
  assert.match(LOGIN, /kvProbe/, 'the probe result must be reported');
  const blk = LOGIN.slice(LOGIN.indexOf('let kvProbe'), LOGIN.indexOf('let kvProbe') + 700);
  assert.ok(blk.includes("fetch('/api/gamefy/"), 'it must hit the real endpoint');
  assert.match(blk, /credentials:'include'/, 'the probe must carry the session cookie');
  assert.ok(!/\.put\(|method: ?'PUT'|method: ?"PUT"/.test(blk), 'the probe must never write');
});

test('the workflow surfaces the probe so it is visible in the log', () => {
  assert.match(WF, /console\.log\("kvProbe=" \+/, 'CI must print the probe result');
});

test('a failed probe cannot fail the job', () => {
  // wrapped in try/catch with a string fallback, so a network hiccup is data not a red run
  assert.match(LOGIN, /catch \(e\) \{ kvProbe = 'probe error: '/);
});
