#!/usr/bin/env node
// Refresh site/js/ from a fresh browser "save page as" of the upstream game.
//
// Upstream updates constantly, so we never edit the game's own scripts.  This
// tool takes the folder a browser produces ("[TheSeed].html" +
// "[TheSeed]_files/<name>_<hash>.js") and copies every script byte-for-byte
// into site/js/<name>.js, which is the layout js/platform.js expects.
//
//   node scripts/sync-upstream.mjs [saveDir] [outDir]
//   default saveDir = ./[TheSeed]   outDir = ./site
//
// Only files whose content hash changed are rewritten, so re-running is cheap
// and git diffs stay readable.

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const args = process.argv.slice(2);
const saveDir = resolve(args[0] ?? './[TheSeed]');
const outDir = resolve(args[1] ?? './site');
const jsOut = join(outDir, 'js');

if (!existsSync(saveDir)) {
  console.error(`save dir not found: ${saveDir}`);
  console.error('open the game in a browser, "save page as → webpage, complete" into ./[TheSeed], then rerun.');
  process.exit(1);
}

// a browser save puts the scripts in "<page>_files/"; accept that layout or a flat dir
const findScriptDir = () => {
  if (readdirSync(saveDir).some((f) => f.endsWith('.js'))) return saveDir;
  const sub = readdirSync(saveDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.endsWith('_files'))
    .map((e) => join(saveDir, e.name))
    .find((d) => readdirSync(d).some((f) => f.endsWith('.js')));
  return sub ?? saveDir;
};
const scriptDir = findScriptDir();

// collect candidate script files from the save
const files = readdirSync(scriptDir).filter((f) => f.endsWith('.js'));

// the saved page prefixes every script with a short hash suffix (e.g. engine_tIUo.js).
const stripHash = (name) => {
  const m = name.match(/^(.+?)_([A-Za-z0-9]{4,6})\.js$/);
  return m ? m[1] + '.js' : name;
};

mkdirSync(jsOut, { recursive: true });

// the html save also contains the platform layer; platform.js must be present.
let copied = 0, unchanged = 0;
const manifest = [];
for (const f of files) {
  const src = join(scriptDir, f);
  if (!statSync(src).isFile()) continue;
  const dstName = stripHash(f);
  const body = readFileSync(src);
  const dst = join(jsOut, dstName);
  if (existsSync(dst) && readFileSync(dst).equals(body)) { unchanged++; manifest.push(dstName); continue; }
  writeFileSync(dst, body);
  copied++;
  manifest.push(dstName);
  console.log(`+ ${dstName}  (${(body.length / 1024).toFixed(1)} KiB, ${createHash('sha256').update(body).digest('hex').slice(0, 8)})`);
}

manifest.sort();
writeFileSync(join(jsOut, 'FILES.txt'), manifest.join('\n') + '\n');
console.log(`\nsynced: ${copied} new/changed, ${unchanged} unchanged → ${jsOut}`);

// sanity: platform.js must reference the same script list it will load
const plat = readFileSync(join(jsOut, 'platform.js'), 'utf8');
const listMatch = plat.match(/const GAME_SCRIPTS = \[([^\]]*)\]/);
if (!listMatch) { console.error('warning: could not parse GAME_SCRIPTS in platform.js'); process.exit(0); }
const wanted = listMatch[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '') + '.js');
const missing = wanted.filter((w) => !manifest.includes(w));
if (missing.length) { console.error('missing game scripts:', missing.join(', ')); process.exit(1); }
console.log(`platform.js GAME_SCRIPTS check: all ${wanted.length} scripts present.`);
