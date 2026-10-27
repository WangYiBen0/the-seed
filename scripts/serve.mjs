#!/usr/bin/env node
// Static server for the mirror that RECORDS 404s.
// Every request the game makes that we don't have on disk is appended to
// .tmp/missing.log (JSONL) — `nix run .#source` turns that list into downloads.
//
//   node scripts/serve.mjs [--port 8000] [--root ./site]
import { createServer } from 'node:http';
import { readFile, mkdir, appendFile, stat } from 'node:fs/promises';
import { join, resolve, extname, normalize } from 'node:path';
import { existsSync } from 'node:fs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = resolve(arg('root', [join(process.cwd(), 'site'), join(process.cwd(), '..', 'site')].find((p) => existsSync(join(p, 'index.html'))) ?? join(process.cwd(), 'site')));
const PORT = +(arg('port', process.env.PORT ?? 8000));
const MISSING = resolve(process.cwd(), '.tmp/missing.log');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.css': 'text/css' };

await mkdir(resolve(process.cwd(), '.tmp'), { recursive: true }).catch(() => { });
console.log(`[serve] root=${ROOT}  port=${PORT}  (404s → ${MISSING})`);

createServer(async (rq, rs) => {
  let path = decodeURIComponent(new URL(rq.url, 'http://x').pathname);
  try {
    const file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT)) { rs.writeHead(403); rs.end(); return; }
    const st = await stat(file).catch(() => null);
    const body = st && st.isFile() ? await readFile(file) : null;
    if (body == null) {
      rs.writeHead(404, { 'content-type': 'text/plain' }); rs.end('404');
      appendFile(MISSING, JSON.stringify({ path, at: Date.now() }) + '\n').catch(() => { });
      return;
    }
    rs.writeHead(200, { 'content-type': MIME[extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
    rs.end(body);
  } catch (e) {
    rs.writeHead(404, { 'content-type': 'text/plain' }); rs.end('404');
    appendFile(MISSING, JSON.stringify({ path, at: Date.now() }) + '\n').catch(() => { });
  }
}).listen(PORT, '127.0.0.1', () => console.log(`[serve] http://127.0.0.1:${PORT}/`));
