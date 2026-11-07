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
  // The manifest is the sync script's own local state (upstream base + asset URLs).
  // It lives OUTSIDE the served root so it is never published, and so a stale
  // snapshot cannot be mistaken for a build artifact.
  const manifestPath = join(root, opt('state', 'state'), 'manifest.json');

  // The manifest stores a VERSION, not a base URL (see fetch-source.mjs).  The
  // base is rebuilt from it plus the game id, which keeps the file free of a
  // hardcoded, stale host.
  const manifest = existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, 'utf8')) : null;
  const fromManifest = (manifest && manifest.version)
    ? 'https://www.dzmm.ai/api/gamefy/static/' + opt('game-id', process.env.DZMM_GAME_ID || '90e4b323-9859-482f-9eb0-7cba6f44a51b') + '/__v' + manifest.version + '/'
    : null;

  const base = opt('base', process.env.UPSTREAM_BASE) || fromManifest;
  if (!base) {
    console.error('[sync-scripts] no base: pass --base, set UPSTREAM_BASE, or keep state/manifest.json with a version');
    process.exit(2);
  }
  const baseUrl = base.endsWith('/') ? base : base + '/';

  const report = {
    base: baseUrl,
    gameV: { local: parseGameV(await readFile(join(jsDir, 'platform.js'), 'utf8')), upstream: null },
    files: { planned: 0, identical: 0, changed: [], missing: [], stale: [] },
  };

  // ONE PASS IS NOT ENOUGH.  platform.js is itself one of the fetched files AND it
  // carries the list of scripts to fetch (parseGameScripts), so updating it changes
  // what the next pass should ask for.  Measured on 2026-11-07 (run 42338839222):
  // pass 1 planned 77, wrote 8 changed files including platform.js, then --check
  // re-planned and found 79 — boss4.js and weapons4.js had appeared in the new
  // list and had never been fetched — so the gate failed on drift the same run had
  // just introduced, every time upstream touched that list.  Iterate until
  // platform.js stops changing (bounded, so a flapping upstream cannot spin).
  const MAX_PASSES = 4;
  const changedAll = [];
  const missingAll = new Map();          // name -> why (dedupe across passes)
  let passes = 0, local = [], wanted = [], converged = false;
  for (;;) {
    passes++;
    const platformLocal = await readFile(join(jsDir, 'platform.js'), 'utf8');
    report.gameV.local = parseGameV(platformLocal);
    const localScripts = parseGameScripts(platformLocal);
    local = await readdir(jsDir);
    wanted = planFiles({ scripts: localScripts, local });
    report.files.planned = wanted.length;

    let wrotePlatform = false, wroteAny = false, identicalThisPass = 0;
    for (const name of wanted) {
      const url = baseUrl + 'js/' + name;
      let rsp;
      try {
        rsp = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 theseed-mirror-sync' } });
      } catch (e) {
        missingAll.set(name, String(e.message || e));
        continue;
      }
      if (rsp.status !== 200) { missingAll.set(name, 'HTTP ' + rsp.status); continue; }

      const body = Buffer.from(await rsp.arrayBuffer());
      if (name === 'platform.js') report.gameV.upstream = parseGameV(body.toString('utf8'));

      const dst = join(jsDir, name);
      if (existsSync(dst) && sha(await readFile(dst)) === sha(body)) { identicalThisPass++; continue; }

      // One entry per file, even if a later pass sees it again.
      if (!changedAll.some((c) => c.name === name)) {
        changedAll.push({ name, bytes: body.length, sha256: sha(body).slice(0, 16) });
      }
      if (name === 'platform.js') wrotePlatform = true;
      wroteAny = true;
      if (flag('dry') || flag('check')) continue;
      await writeFile(dst, body);
    }
    // identical is a property of the LAST pass, not a running total, or a three-pass
    // convergence would report more identical files than the plan contains.
    report.files.identical = identicalThisPass;

    // In dry/check mode nothing is written, so there is no second pass to converge.
    if (flag('dry') || flag('check')) break;
    if (!wrotePlatform) { converged = true; break; }   // the fetch list is now stable
    if (!wroteAny) { converged = true; break; }
    if (passes >= MAX_PASSES) break;                  // bounded
  }
  report.files.changed = changedAll;
  report.files.missing = [...missingAll.entries()].map(([name, why]) => ({ name, why }));
  report.passes = passes;
  report.converged = flag('dry') || flag('check') ? null : converged;

    // an upstream script that vanished is NOT deleted, only reported
  for (const name of local.filter((f) => f.endsWith('.js'))) {
    if (!wanted.includes(name)) report.files.stale.push(name);
  }

  const localV = report.gameV.local;
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
