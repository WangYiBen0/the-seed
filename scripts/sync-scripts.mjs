#!/usr/bin/env node
// Sync the upstream game scripts (site/js/*.js) from the public static base.
//
//   node scripts/sync-scripts.mjs            # fetch, rewrite only changed files
//   node scripts/sync-scripts.mjs --dry      # report drift, write nothing
//   node scripts/sync-scripts.mjs --check    # exit 1 if upstream drifted
//   node scripts/sync-scripts.mjs --json     # machine-readable report
//
// Why this exists: site/js/ must stay byte-identical to upstream (AGENTS.md
// rule 1), and the browser "save page as" flow that sync-upstream.mjs implements
// needs a human. The same bytes are served from the public asset base
// (api/gamefy/static/<gameId>/__v<publishedAt>/js/<name>.js), so the sync can
// run unattended in CI. Measured on 2026-11-01: 77/77 scripts identical.
//
// What this does NOT do:
//   * never deletes: an upstream script that disappears is reported as stale,
//     because a deletion here would break platform.js' load order silently;
//   * never touches [TheSeed]/: that is the browser-save provenance artifact,
//     with hashed filenames this script cannot reproduce;
//   * never invents GAME_V: the version is read from the fetched platform.js.

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const argv = process.argv.slice(2);
const flag = (k) => argv.includes('--' + k);
const opt = (k, d) => {
  const i = argv.indexOf('--' + k);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};

// ---- pure helpers (unit-tested in tests/sync-scripts.test.mjs) -------------

// platform.js declares the load order in GAME_SCRIPTS and the version in
// GAME_V. Both are single-quoted string literals in a generated file.
export function parseGameScripts(src) {
  const m = src.match(/const GAME_SCRIPTS = \[([^\]]*)\]/);
  if (!m) return [];
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}

export function parseGameV(src) {
  const m = src.match(/const GAME_V = '([^']+)'/);
  return m ? m[1] : null;
}

// One path per script, deduplicated and sorted, so two runs always fetch the
// same things in the same order.
export function planFiles({ scripts, local }) {
  const want = new Set(scripts.map((s) => s + '.js'));
  for (const f of local) if (f.endsWith('.js')) want.add(f);
  return [...want].sort();
}

const sha = (buf) => createHash('sha256').update(buf).digest('hex');

// ---- main ------------------------------------------------------------------

async function main() {
  const root = resolve(opt('root', process.cwd()));
  const site = join(root, opt('site', 'site'));
  const jsDir = join(site, 'js');
  const manifestPath = join(site, 'asset-manifest.json');

  const base = opt('base', process.env.UPSTREAM_BASE)
    || (existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, 'utf8')).base : null);
  if (!base) {
    console.error('[sync-scripts] no base: pass --base, set UPSTREAM_BASE, or keep site/asset-manifest.json');
    process.exit(2);
  }
  const baseUrl = base.endsWith('/') ? base : base + '/';

  const platformLocal = await readFile(join(jsDir, 'platform.js'), 'utf8');
  const localV = parseGameV(platformLocal);
  const localScripts = parseGameScripts(platformLocal);
  const local = await readdir(jsDir);
  const wanted = planFiles({ scripts: localScripts, local });

  const report = {
    base: baseUrl,
    gameV: { local: localV, upstream: null },
    files: { planned: wanted.length, identical: 0, changed: [], missing: [], stale: [] },
  };

  for (const name of wanted) {
    const url = baseUrl + 'js/' + name;
    let rsp;
    try {
      rsp = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 theseed-mirror-sync' } });
    } catch (e) {
      report.files.missing.push({ name, why: String(e.message || e) });
      continue;
    }
    if (rsp.status !== 200) { report.files.missing.push({ name, why: 'HTTP ' + rsp.status }); continue; }

    const body = Buffer.from(await rsp.arrayBuffer());
    if (name === 'platform.js') report.gameV.upstream = parseGameV(body.toString('utf8'));

    const dst = join(jsDir, name);
    if (existsSync(dst) && sha(await readFile(dst)) === sha(body)) { report.files.identical++; continue; }

    report.files.changed.push({ name, bytes: body.length, sha256: sha(body).slice(0, 16) });
    if (flag('dry') || flag('check')) continue;
    await writeFile(dst, body);
  }

    // an upstream script that vanished is NOT deleted, only reported
  for (const name of local.filter((f) => f.endsWith('.js'))) {
    if (!wanted.includes(name)) report.files.stale.push(name);
  }

  const vDrift = report.gameV.upstream && localV !== report.gameV.upstream;
  const failed = report.files.missing.length > 0;

  if (flag('json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    for (const c of report.files.changed) console.log('+ js/' + c.name + '  (' + (c.bytes / 1024).toFixed(1) + ' KiB, ' + c.sha256 + ')');
    for (const m of report.files.missing) console.log('! js/' + m.name + ' — ' + m.why);
    for (const s of report.files.stale) console.log('· js/' + s + ' — local only, left in place');
    console.log(
      '[sync-scripts] ' + report.files.planned + ' planned, ' + report.files.identical + ' identical, '
      + report.files.changed.length + ' changed, ' + report.files.missing.length + ' unavailable, '
      + report.files.stale.length + ' local-only');
    if (report.gameV.upstream) {
      console.log('[sync-scripts] GAME_V ' + (vDrift ? 'CHANGED ' : 'unchanged ') + localV + ' → ' + report.gameV.upstream);
    }
  }

  // --check is the CI gate: upstream moved but we did not (or could not) write
  if (flag('check') && report.files.changed.length > 0) {
    console.error('[sync-scripts] upstream drifted; regenerate site/js/');
    process.exit(1);
  }
  if (failed) process.exit(1);
}

// Only run when executed directly; importing this module (unit tests) must not
// touch the network.
if (import.meta.url === pathToFileURL(resolve(process.argv[1] || '')).href) main();
