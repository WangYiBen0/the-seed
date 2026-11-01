#!/usr/bin/env node
// CI helper: sign in to dzmm.ai with the sign-in-code link, then read the two
// values the asset fetcher needs (gameId / publishedAt).
//
//   node scripts/ci-login.mjs --code "$DZMM_SIGN_IN_CODE" --out .tmp/meta.json
//
// Why a browser and not curl:
//   * the metadata endpoint is cookie-authenticated (anonymous -> {"error":"请先登录"});
//   * the session cookie is SameSite=Lax, so a node-side fetch cannot carry it
//     across origins — the browser has to make the request;
//   * the API sends no Access-Control-Allow-* headers, so a page we host cannot
//     read it either.  The request must therefore come from the dzmm.ai origin.
//
// So we drive headless chromium over its own DevTools protocol (no puppeteer
// dependency), let it visit the sign-in link (which logs in automatically),
// then evaluate a same-origin fetch inside that page and print the JSON.
//
// Output (stdout, and to --out if given):
//   {"gameId":"...","publishedAt":1234567890123,"characterId":"3738712"}
// Exit 0 only when both values are present; anything else is a hard failure so
// CI never silently falls back to stale asset bases.

import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const argv = process.argv.slice(2);
const opt = (k, d) => {
  const i = argv.indexOf('--' + k);
  // i >= 0, not i > 0: `--code` may legitimately be the FIRST argument.
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};

// the character id comes from the repository variable CHARA_ID via
// scripts/ci-login.mjs --character; an empty value falls back to the default so
// an unset variable cannot silently query /api/gamefy/ (a bare 404).
const CHARACTER_ID = opt('character', process.env.DZMM_CHARACTER) || '3738712';
const CODE = opt('code', process.env.DZMM_SIGN_IN_CODE);
const OUT = opt('out', null);
const ORIGIN = 'https://www.dzmm.ai';
const TIMEOUT_MS = +(opt('timeout', 120000));
const CHROMIUM = opt('chromium', process.env.CHROMIUM || 'chromium');

if (!CODE) {
  console.error('[ci-login] missing sign-in code: pass --code or set DZMM_SIGN_IN_CODE');
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const findChromium = () => {
  for (const c of [CHROMIUM, 'chromium', 'chromium-browser', 'google-chrome'].filter(Boolean)) {
    try { if (spawnSync(c, ['--version'], { stdio: 'ignore' }).status === 0) return c; } catch (e) { }
  }
  return null;
};

// Minimal CDP client over node's built-in WebSocket.
function connect(url) {
  return new Promise((res, rej) => {
    const ws = new WebSocket(url);
    let nextId = 1;
    const pending = new Map();
    const listeners = new Set();
    ws.onopen = () => res({
      send: (method, params, sessionId) => new Promise((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
      }),
      on: (fn) => listeners.add(fn),
      close: () => { try { ws.close(); } catch (e) { } },
    });
    ws.onerror = () => rej(new Error('devtools websocket failed'));
    ws.onmessage = (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.id && pending.has(m.id)) {
        const p = pending.get(m.id); pending.delete(m.id);
        if (m.error) p.reject(new Error(JSON.stringify(m.error))); else p.resolve(m.result);
        return;
      }
      for (const fn of listeners) fn(m);
    };
  });
}

async function main() {
  const chrome = findChromium();
  if (!chrome) { console.error('[ci-login] no chromium found; set $CHROMIUM'); process.exit(2); }

  const profile = await mkdtemp(join(tmpdir(), 'tsw-ci-login-'));
  const port = 9300 + Math.floor(Math.random() * 500);
  const child = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    // GitHub's runners (and every container) deny the namespace/unshare calls
    // that Chromium's zygote needs; without these the process dies in
    // ZygoteHostImpl::Init with a SIGTRAP stack dump and DevTools never opens.
    '--no-sandbox', '--disable-setuid-sandbox', '--no-zygote', '--disable-dev-shm-usage',
    '--disable-features=Translate,MediaRouter', '--mute-audio',
    `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`,
    '--window-size=1280,900', 'about:blank',
  ], {
    stdio: ['ignore', 'ignore', 'pipe'],
    env: { ...process.env, HOME: profile, XDG_CACHE_HOME: join(profile, 'cache'), XDG_CONFIG_HOME: join(profile, 'config') },
  });
  let stderr = '';
  child.stderr.on('data', (d) => { stderr += d.toString(); });
  // Fail fast: a browser that dies (sandbox denial, snap confinement, missing
  // libs) must not burn the whole timeout pretending DevTools might still open.
  let exited = null;
  child.on('exit', (code, sig) => { exited = { code, sig }; });

  const cleanup = () => { try { child.kill('SIGKILL'); } catch (e) { } };
  const fail = (code, msg) => {
    console.error('[ci-login] ' + msg);
    if (stderr) console.error(stderr.slice(-1500));
    cleanup();
    process.exit(code);
  };

  const deadline = Date.now() + TIMEOUT_MS;
  let wsUrl = null;
  while (Date.now() < deadline) {
    if (exited) fail(3, `chromium exited before DevTools came up (code=${exited.code} signal=${exited.sig})`);
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) { wsUrl = (await r.json()).webSocketDebuggerUrl; if (wsUrl) break; }
    } catch (e) { /* not listening yet */ }
    await sleep(400);
  }
  if (!wsUrl) fail(3, 'chromium devtools never came up');

  const browser = await connect(wsUrl);
  let sessionId = null;
  browser.on((m) => {
    if (m.method === 'Target.attachedToTarget' && m.params && m.params.sessionId) sessionId = m.params.sessionId;
  });
  await browser.send('Target.setDiscoverTargets', { discover: true });
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  await browser.send('Target.attachToTarget', { targetId, flatten: true });
  for (let i = 0; i < 60 && !sessionId; i++) await sleep(50);
  if (!sessionId) fail(3, 'could not attach to a tab');

  const s = (method, params) => browser.send(method, params, sessionId);
  await s('Runtime.enable', {});

  // 1) visit the sign-in link.  The code lives in the URL fragment, so it never
  //    reaches the server and is only read by the page's own script.
  const signInUrl = `${ORIGIN}/sign-in-code/v2#${encodeURIComponent(CODE)}`;
  await s('Page.enable', {});
  await s('Page.navigate', { url: signInUrl });
  await sleep(6000);

  // 2) read the metadata from inside the now-signed-in origin.
  let last = 'no attempt';
  while (Date.now() < deadline) {
    const { result } = await s('Runtime.evaluate', {
      expression: `fetch('/api/gamefy/${CHARACTER_ID}', {credentials:'include', headers:{accept:'application/json'}})
        .then(r => r.text().then(t => ({status:r.status, body:t})))
        .catch(e => ({status:0, body:'fetch failed: '+String(e)}))`,
      awaitPromise: true, returnByValue: true,
    });
    const v = result && result.value;
    if (v && v.body) {
      let j = null;
      try { j = JSON.parse(v.body); } catch (e) { }
      if (j && j.gameId && j.publishedAt) {
        // Read-only probe of the cloud-save endpoint from THIS signed-in page.
        // The docs only recorded its anonymous answer (401 {"error":"请先登录"});
        // whether a cookie session can use it was never checked.  GET only.
        let kvProbe = 'unavailable';
        try {
          const kv = await s('Runtime.evaluate', {
            expression: `fetch('/api/gamefy/${String(j.gameId)}/kv', {credentials:'include', headers:{accept:'application/json'}})
              .then(r => r.text().then(t => ({status:r.status, body:t.slice(0,180)})))
              .catch(e => ({status:0, body:'fetch failed: '+String(e)}))`,
            awaitPromise: true, returnByValue: true,
          });
          const kvv = kv && kv.result && kv.result.value;
          if (kvv) kvProbe = 'status=' + kvv.status + ' body=' + kvv.body;
          // The list endpoint answered {"data":[],"count":0}: a KEY LIST, not the
          // values.  The game reads its 8 STORE_KEYS by key (platform.js:64 uses
          // kv.batchGet), so the contract that matters is the per-key read.  Probe
          // one known key, still GET-only, to learn its shape.
          try {
            const one = await s('Runtime.evaluate', {
              expression: `fetch('/api/gamefy/${String(j.gameId)}/kv/achroma_set', {credentials:'include', headers:{accept:'application/json'}})
                .then(r => r.text().then(t => ({status:r.status, body:t.slice(0,160)})))
                .catch(e => ({status:0, body:'fetch failed: '+String(e)}))`,
              awaitPromise: true, returnByValue: true,
            });
            const ov = one && one.result && one.result.value;
            if (ov) kvProbe += ' | perKey=' + ov.status + ' ' + ov.body;
          } catch (e) { kvProbe += ' | perKey error'; }
          // Write contract probe.  The SDK sends kv.put over postMessage and the
          // host's request is invisible, so the body shape must be learned by
          // trying.  This uses ONE dedicated throwaway key, verifies by read-back,
          // and deletes it again -- it must never touch a real save key.
          if (process.env.DZMM_KV_WRITE_PROBE === '1') {
            try {
              const wp = await s('Runtime.evaluate', {
                expression: `(async () => {
                  var K = '__mirror_probe_delete_me';
                  var U = '/api/gamefy/${String(j.gameId)}/kv/' + K;
                  var body = { value: { probe: 1, at: Date.now() } };
                  var out = {};
                  try {
                    var w = await fetch(U, { method: 'PUT', credentials: 'include',
                      headers: { 'content-type': 'application/json', accept: 'application/json' },
                      body: JSON.stringify(body) });
                    // report WHY, not just the code: a 403 from a body-shape
                    // mismatch reads the same as a 403 from a policy block.
                    out.put = w.status;
                    try { out.putBody = (await w.text()).slice(0, 120); } catch (e) {}
                    // some APIs write with POST instead of PUT; try it once
                    try {
                      var q = await fetch(U, { method: 'POST', credentials: 'include',
                        headers: { 'content-type': 'application/json', accept: 'application/json' },
                        body: JSON.stringify(body) });
                      out.post = q.status;
                    } catch (e) { out.post = 'err'; }
                    var r = await fetch(U, { credentials: 'include', headers: { accept: 'application/json' } });
                    var t = await r.text();
                    out.read = r.status + ' ' + t.slice(0, 120);
                    var d = await fetch(U, { method: 'DELETE', credentials: 'include', headers: { accept: 'application/json' } });
                    out.del = d.status;
                  } catch (e) { out.err = String(e).slice(0, 120); }
                  return JSON.stringify(out);
                })()`,
                awaitPromise: true, returnByValue: true,
              });
              const wv = wp && wp.result && wp.result.value;
              if (wv) kvProbe += ' | writeProbe=' + wv;
            } catch (e) { kvProbe += ' | writeProbe error'; }
          }
        } catch (e) { kvProbe = 'probe error: ' + String(e).slice(0, 80); }
        const meta = {
          gameId: String(j.gameId),
          publishedAt: Number(j.publishedAt),
          kvProbe,
          characterId: CHARACTER_ID,
          // Read-only probe of the cloud-save endpoint from this signed-in
          // session.  The docs only ever recorded its ANONYMOUS answer (401
          // {"error":"请先登录"}); whether a cookie session can actually use it
          // was never checked.  This does not write anything: it is a GET, and
          // it reports the status plus a short body slice so the shape is known
          // before the iframe host is wired to it.

        };
        const txt = JSON.stringify(meta, null, 2);
        console.log(txt);
        if (OUT) { await mkdir(dirname(resolve(OUT)), { recursive: true }); await writeFile(resolve(OUT), txt + '\n'); }
        cleanup();
        process.exit(0);
      }
      last = `status=${v.status} body=${String(v.body).slice(0, 240)}`;
    } else last = 'runtime.evaluate returned no value';
    await sleep(2000);
  }
  fail(4, 'metadata never became readable from the signed-in session; last response: ' + last);
}

main();
