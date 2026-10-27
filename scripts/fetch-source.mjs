#!/usr/bin/env node
// Build the COMPLETE asset manifest for the mirror and pull what's missing.
//
//   nix run .#source                # scan → fetch every missing asset from upstream
//   nix run .#source -- --list      # just show the manifest
//   nix run .#source -- --dry       # show what would be fetched
//   nix run .#source -- --force     # re-download even if present
//   nix run .#source -- img/x.png   # also add a specific path
//
// Asset families are parsed from the game's own source (no guesswork):
//   assets/portraits/<id>.webp       one per survivor          (js/squad.js)
//   assets/private/<id>.png          CG 私房照 per survivor     (js/girls.js)
//   assets/stories/<id>-p<pose>.webp  story CGs, poses 1..6     (js/stories.js)
// plus favicon.svg and anything the runtime 404 log recorded.
// Results live in site/asset-manifest.json; login-gated files are reported, not faked.

import { readFile, writeFile, mkdir, stat, appendFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, dirname, normalize } from 'node:path';
import { createHash } from 'node:crypto';

const argv = process.argv.slice(2);
const flag = (k) => argv.includes('--' + k);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i > 0 && argv[i + 1] ? argv[i + 1] : d; };
const ROOT = process.cwd();
const SITE = [join(ROOT, 'site'), join(ROOT, '..', 'site')].find((p) => existsSync(join(p, 'index.html'))) ?? join(ROOT, 'site');
const JS = join(SITE, 'js');
const MISSING = resolve(ROOT, '.tmp/missing.log');
const MANIFEST_PATH = join(SITE, 'asset-manifest.json');
const POSES = 6; // js/stories.js: pose < 1 || pose > 6

// ---- family ids, parsed from the game's own data files ----
async function survIds() {
  const src = await readFile(join(JS, 'squad.js'), 'utf8');
  return [...src.matchAll(/^  ([a-z0-9_]+): \{ nm: N4\(/gm)].map((m) => m[1]);
}
async function storyIds() {
  const src = await readFile(join(JS, 'stories-data.js'), 'utf8');
  return [...src.matchAll(/^  ([a-z0-9_]+): \[/gm)].map((m) => m[1]);
}

async function buildWanted() {
  const wanted = new Map();
  const add = (p, from) => { if (p && !wanted.has(p)) wanted.set(p, { from }); };
  for (const id of await survIds()) {
    add(`assets/portraits/${id}.webp`, 'scan');
    add(`assets/private/${id}.png`, 'scan');
  }
  for (const sid of await storyIds()) for (let pose = 1; pose <= POSES; pose++) add(`assets/stories/${sid}-p${pose}.webp`, 'scan');
  add('favicon.svg', 'scan');
  if (existsSync(MISSING)) { // runtime 404s: assets the game asks for that static scanning can't know
    for (const line of (await readFile(MISSING, 'utf8')).split('\n')) {
      if (!line.trim()) continue;
      try { const o = JSON.parse(line); if (o.path && o.path.startsWith('/')) add(o.path.slice(1).split('?')[0], '404'); } catch (e) { }
    }
  }
  for (const a of argv) if (!a.startsWith('--') && a !== (opt('base', '') || '\0')) add(a.replace(/^\/+/, ''), 'arg');
  return wanted;
}

// Upstream static base. The public endpoint
//   https://www.dzmm.ai/api/gamefy/<characterId>
// answers {"gameId": ..., "publishedAt": ...} without a login, so these two
// env vars are all that is needed to rebuild the asset base:
//   DZMM_GAME_ID       <- JSON "gameId"
//   DZMM_PUBLISHED_AT  <- JSON "publishedAt"
// static root = https://www.dzmm.ai/api/gamefy/static/<gameId>/__v<publishedAt>/
function baseFromEnv() {
  const gid = opt("game-id", process.env.DZMM_GAME_ID);
  const pub = opt("published-at", process.env.DZMM_PUBLISHED_AT);
  if (!gid && !pub) return null;
  if (!gid || !pub) { console.error("[source] need BOTH DZMM_GAME_ID and DZMM_PUBLISHED_AT"); process.exit(1); }
  const base = `https://www.dzmm.ai/api/gamefy/static/${gid}/__v${pub}/`;
  console.log("[source] base from DZMM_GAME_ID / DZMM_PUBLISHED_AT:", base);
  return base;
}

async function detectBase() {
  const envBase = baseFromEnv(); if (envBase) return envBase;
  const b = opt('base', process.env.UPSTREAM_BASE);
  if (b) return b.endsWith('/') ? b : b + '/';
  const saveDir = join(ROOT, '[TheSeed]');
  if (existsSync(saveDir)) {
    for (const f of ['[TheSeed].html', 'index.html']) {
      const p = join(saveDir, f); if (!existsSync(p)) continue;
      const m = (await readFile(p, 'utf8')).match(/base href="([^"]+)"/);
      if (m) { console.log('[source] base auto-detected from save:', m[1]); return m[1]; }
    }
  }
  console.error('[source] cannot determine upstream base — pass --base <url> or re-save the page into ./[TheSeed]/');
  process.exit(1);
}

const BASE = await detectBase();
const urlFor = (p) => (p.startsWith('api/')) ? new URL(BASE).origin + '/' + p : BASE + p;

// ---- manifest: merge previous entries, mark present/missing ----
const prev = existsSync(MANIFEST_PATH) ? JSON.parse(await readFile(MANIFEST_PATH, 'utf8')) : { assets: {} };
const manifest = { base: BASE, updatedAt: Date.now(), assets: {} };
const wanted = await buildWanted();
for (const [p, meta] of [...wanted].sort()) {
  const old = (prev.assets || {})[p];
  const file = normalize(join(SITE, p));
  const present = existsSync(file) && !flag('force');
  manifest.assets[p] = {
    url: old?.url || urlFor(p), from: meta.from, present,
    ...(present ? { bytes: (await stat(file)).size } : {}),
    ...(old?.sha256 ? { sha256: old.sha256 } : {}),
  };
}
await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 1) + '\n');

const missing = Object.entries(manifest.assets).filter(([, a]) => !a.present);
console.log(`[source] manifest: ${Object.keys(manifest.assets).length} assets, ${missing.length} missing, base=${BASE}`);
if (flag('list')) { for (const [p, a] of Object.entries(manifest.assets)) console.log(` ${a.present ? '✓' : '·'} ${p}`); process.exit(0); }
if (flag('dry')) { for (const [p, a] of missing) console.log(`[dry] ${a.url} → site/${p}`); process.exit(0); }

// ---- fetch missing ----
let ok = 0, fail = 0, gate = 0;
for (const [p, a] of missing) {
  try {
    const rsp = await fetch(a.url, { headers: { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) theseed-mirror-fetch', 'referer': BASE } });
    const type = rsp.headers.get('content-type') || '';
    if (rsp.status !== 200) throw new Error(`HTTP ${rsp.status}`);
    if (/text\/html/i.test(type)) { gate++; console.log(`× ${p} — got HTML; likely login-gated upstream (fetch manually or ignore)`); continue; }
    const buf = Buffer.from(await rsp.arrayBuffer());
    const dst = normalize(join(SITE, p));
    if (!dst.startsWith(SITE)) { console.log(`skip (escapes site/): ${p}`); continue; }
    await mkdir(dirname(dst), { recursive: true });
    await writeFile(dst, buf);
    manifest.assets[p].present = true;
    manifest.assets[p].bytes = buf.length;
    manifest.assets[p].sha256 = createHash('sha256').update(buf).digest('hex').slice(0, 16);
    ok++;
    console.log(`+ site/${p}  (${(buf.length / 1024).toFixed(1)} KiB, ${type.split(';')[0]})`);
  } catch (e) {
    fail++;
    console.log(`! ${p} — ${e.message}`);
    await appendFile(MISSING, JSON.stringify({ path: '/' + p, at: Date.now(), fail: true }) + '\n').catch(() => { });
  }
}
manifest.updatedAt = Date.now();
await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 1) + '\n');
console.log(`\n[source] fetched=${ok} failed=${fail} gated=${gate} | manifest: ${MANIFEST_PATH}`);
