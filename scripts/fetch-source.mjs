#!/usr/bin/env node
// Pull missing assets from the upstream game page.
//
//   nix run .#source                    # fetch everything recorded in .tmp/missing.log
//   node scripts/fetch-source.mjs favicon.svg img/cg/x.png   # fetch specific paths
//   node scripts/fetch-source.mjs --dry --list
//
// The upstream base URL is auto-detected from the saved page ([TheSeed]/*.html
// contains `<!-- base href="…" -->`), or set it explicitly:
//   --base https://www.dzmm.ai/api/gamefy/static/<id>/<ver>/
// Results are recorded in site/asset-manifest.json (url + sha256 + time).

import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, dirname, normalize } from 'node:path';
import { createHash } from 'node:crypto';

const argv = process.argv.slice(2);
const flag = (k) => argv.includes('--' + k);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i > 0 ? argv[i + 1] : d; };
const ROOT = process.cwd();
const SITE = [join(ROOT, 'site'), join(ROOT, '..', 'site')].find((p) => existsSync(join(p, 'index.html'))) ?? join(ROOT, 'site');
const MISSING = resolve(ROOT, '.tmp/missing.log');
const MANIFEST = join(SITE, 'asset-manifest.json');

// ---- collect requested paths ----
let paths = argv.filter((a) => !a.startsWith('--') && !(argv[argv.indexOf(a) - 1] ?? '').match(/^--(base|file)$/));
if (!paths.length && existsSync(MISSING)) {
  const seen = new Map();
  for (const line of (await readFile(MISSING, 'utf8')).split('\n')) {
    if (!line.trim()) continue;
    try { const o = JSON.parse(line); seen.set(o.path, (seen.get(o.path) ?? 0) + 1); } catch (e) { }
  }
  paths = [...seen.keys()];
  console.log(`[source] ${paths.length} unique missing paths from ${MISSING}`);
}
if (!paths.length) { console.log('[source] nothing to fetch (no .tmp/missing.log entries, no path args)'); process.exit(0); }

// ---- resolve upstream base ----
async function detectBase() {
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
  console.error('[source] cannot determine upstream base URL.');
  console.error('  pass --base https://www.dzmm.ai/api/gamefy/static/<id>/<ver>/ or re-save the page into ./[TheSeed]/');
  process.exit(1);
}
const BASE = await detectBase();
const HOST = new URL(BASE).origin;

// ---- manifest ----
const manifest = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : { assets: {} };

let ok = 0, skip = 0, fail = 0;
for (const raw of [...new Set(paths)]) {
  if (flag('list')) { console.log(' ', raw); continue; }
  const path = raw.split('?')[0];
  if (/\\\\|\.\./.test(path) || !path.startsWith('/')) { console.log(`skip (not a site-relative path): ${raw}`); skip++; continue; }
  const rel = path.replace(/^\/+/, '');
  const dst = normalize(join(SITE, rel));
  if (!dst.startsWith(SITE)) { console.log(`skip (escapes site/): ${raw}`); skip++; continue; }
  if (!flag('force') && existsSync(dst)) { skip++; continue; }
  const url = path.startsWith('/api/') ? HOST + path : BASE + rel;
  if (flag('dry')) { console.log(`[dry] ${url} → site/${rel}`); continue; }
  try {
    const rsp = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) theseed-mirror-fetch', 'referer': BASE } });
    const type = rsp.headers.get('content-type') || '';
    if (rsp.status !== 200 || /text\/html/i.test(type)) throw new Error(`${rsp.status} ${type || 'no type'}`);
    const buf = Buffer.from(await rsp.arrayBuffer());
    await mkdir(dirname(dst), { recursive: true });
    await writeFile(dst, buf);
    manifest.assets[rel] = { url, bytes: buf.length, sha256: createHash('sha256').update(buf).digest('hex').slice(0, 16), at: Date.now() };
    ok++;
    console.log(`+ site/${rel}  (${(buf.length / 1024).toFixed(1)} KiB, ${type})`);
  } catch (e) {
    fail++;
    console.log(`! ${url} → ${e.message}`);
    await appendFile(MISSING, JSON.stringify({ path: raw, at: Date.now(), fail: true }) + '\n').catch(() => { });
  }
}
if (!flag('dry') && !flag('list')) { manifest.updatedAt = Date.now(); await writeFile(MANIFEST, JSON.stringify(manifest, null, 1) + '\n'); }
console.log(`\n[source] ok=${ok} skip=${skip} fail=${fail}` + (flag('dry') ? ' (dry run)' : ''));
if (fail > 0) console.log('[source] some assets failed — the upstream may gate them behind login; fetch them manually into site/<path>.');
