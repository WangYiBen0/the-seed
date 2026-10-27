// ===== EMBER platform layer: runs the game on the DZMM Gamefy platform (sandboxed iframe + dzmm.* SDK) =====
// - storage: the game reads and writes through STORE (synchronous). It is an in-memory copy of dzmm.kv, read once before the game
//   scripts start. Changes are written back with { flush: true }, retried until they land, and pushed out when the page is hidden
//   or closed. Outside DZMM (opening index.html in a plain browser) nothing is persisted: STORE stays in memory only, and the
//   main menu says so. Browser-side storage APIs are never used: the DZMM sandbox forbids them.
// - boot: reports loading progress to the host, loads the saved data (a failed read stops the boot with a retry button, so an empty
//   start can never overwrite real progress), then loads the game scripts in order.
'use strict';
const PLAT = { dzmm: false, caps: {}, user: null, env: null };
const STORE_KEYS = ['achroma_set', 'achroma_run', 'achroma_codex', 'achroma_pending', 'achroma_girls', 'achroma_evpend', 'achroma_ivrun'];
// the run save and the girls' progress go out at once; settings are batched for a moment (sliders change many times a second)
const STORE_NOW = new Set(['achroma_run', 'achroma_girls', 'achroma_pending', 'achroma_evpend', 'achroma_ivrun']);
const STORE = {
  mem: {}, dirty: new Set(), dead: new Set(), locked: false, timer: 0, fails: 0, running: null, again: false,
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.mem, k) ? this.mem[k] : null; },
  setItem(k, v) { v = String(v); if (this.locked || this.mem[k] === v) return; this.mem[k] = v; this.dead.delete(k); this.dirty.add(k); this.later(STORE_NOW.has(k) ? 0 : 400); },
  removeItem(k) { if (this.locked || !(k in this.mem) && !this.dirty.has(k)) return; delete this.mem[k]; this.dirty.delete(k); this.dead.add(k); this.later(0); },
  later(ms) { if (!PLAT.dzmm) { this.dirty.clear(); this.dead.clear(); return; } clearTimeout(this.timer); this.timer = setTimeout(() => this.flush(), ms); },
  // one write-out at a time; whatever changed meanwhile goes in the next one
  flush() {
    if (!PLAT.dzmm || this.locked) return Promise.resolve(false);
    if (this.running) { this.again = true; return this.running; }
    clearTimeout(this.timer);
    // Snapshot before awaiting. A later removeItem must never turn a queued put
    // into put(key, undefined), and changes made in flight belong to the next batch.
    const deletes = [...this.dead], writes = [...this.dirty].filter(k => k in this.mem).map(k => [k, this.mem[k]]);
    this.dead.clear(); this.dirty.clear();
    return this.running = (async () => {
      let ok = true;
      for (const k of deletes) { try { await dzmm.kv.delete(k); } catch (e) { ok = false; if (!(k in this.mem) && !this.locked) this.dead.add(k); console.warn('[ember] kv delete', k, e && e.code); } }
      const put = async () => { if (PLAT.caps.kvBatch && typeof dzmm.kv.batchPut === 'function' && writes.length > 1) await dzmm.kv.batchPut(Object.fromEntries(writes), { flush: true });
        else for (const [k, v] of writes) await dzmm.kv.put(k, v, { flush: true }); };
      if (writes.length) try { await put(); } catch (e) { ok = false; for (const [k] of writes) if (k in this.mem && !this.locked) this.dirty.add(k); console.warn('[ember] kv write', e && e.code); }
      return ok;
    })().then(ok => { this.running = null;
      const again = this.again; this.again = false;
      if (this.locked) return false;
      // failed writes stay dirty and are tried again, waiting longer each time (2s, 4s, ... up to 30s)
      if (!ok) { this.fails++; this.later(Math.min(30000, 2000 * Math.pow(2, this.fails - 1))); } else this.fails = 0;
      if (ok && (again || this.dirty.size || this.dead.size)) return this.flush();
      return ok; });
  },
};
// leaving the page: push out anything not yet written (the host lets accepted writes finish)
addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') STORE.flush(); });
addEventListener('pagehide', () => STORE.flush());
// SDK calls at start-up: "the host cancelled it" (ABORTED) and other temporary errors are simply tried again, waiting a little
// longer each time (0.3s, 0.6s, 1.2s, 2.4s, 4.8s); errors that will not go away by waiting are thrown at once
const SDK_TRANSIENT = new Set(['ABORTED', 'NETWORK_ERROR', 'TIMEOUT', 'SERVICE_UNAVAILABLE', 'RATE_LIMITED', 'INTERNAL_ERROR', 'UNKNOWN_ERROR']);
async function sdkRetry(fn, what, prog, tries = 6) {
  for (let i = 0; ; i++) {
    try { return await fn(); }
    catch (e) { const code = e && e.code;
      if ((code && !SDK_TRANSIENT.has(code)) || i >= tries - 1) throw e;
      console.info('[ember] ' + what + ': ' + (code || 'error') + ', trying again (' + (i + 1) + ')');
      if (prog) prog({ phase: 'start', message: 'Connecting' });
      await new Promise(r => setTimeout(r, 300 * Math.pow(2, i))); }
  }
}
// reads every saved key; throws if the platform could not answer (an absent key is fine: it is simply not there yet)
async function storeLoad(dz) {
  const mem = {};
  const encoded = v => typeof v === 'string' ? v : JSON.stringify(v);
  if (PLAT.caps.kvBatch && typeof dz.kv.batchGet === 'function') { const r = await dz.kv.batchGet(STORE_KEYS); if (!r || typeof r !== 'object' || Array.isArray(r)) throw new Error('kv batchGet returned nothing');
    for (const k of STORE_KEYS) { if (!Object.prototype.hasOwnProperty.call(r, k)) throw new Error('kv batchGet missing key: ' + k);
      const e = r[k], v = e && typeof e === 'object' && 'value' in e && 'updated_at' in e ? e.value : e; if (v != null) mem[k] = encoded(v); } }
  else for (const k of STORE_KEYS) { const r = await dz.kv.get(k); if (r === undefined || (r !== null && (typeof r !== 'object' || !('value' in r)))) throw new Error('kv get invalid response: ' + k); if (r && r.value != null) mem[k] = encoded(r.value); }
  STORE.mem = mem;
}
// a failed read stops here until the player asks to try again
function bootRetry(msg) {
  return new Promise(ok => {
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#050506;color:#e8e1d3;font:15px "Microsoft YaHei","PingFang SC",sans-serif;z-index:9;text-align:center;padding:20px;cursor:default';
    box.innerHTML = '<div>存档读取失败，为避免覆盖你的进度，游戏暂未启动。<br><span style="color:#8e877b;font-size:12px">Could not read your save. The game waits so nothing gets overwritten.</span></div>';
    if (msg) { const m = document.createElement('div'); m.style.cssText = 'color:#6e675c;font-size:12px'; m.textContent = msg; box.appendChild(m); }
    const b = document.createElement('button'); b.textContent = '重试 / Retry';
    b.style.cssText = 'background:#151310;color:#efb94a;border:1px solid #efb94a;padding:9px 22px;font:inherit;cursor:pointer';
    b.addEventListener('click', () => { box.remove(); ok(); }); box.appendChild(b); document.body.appendChild(box);
  });
}
const GAME_SCRIPTS = ['engine', 'i18n', 'net', 'sfxdata', 'audio', 'world', 'combat', 'weapons', 'enemies', 'boss', 'ui', 'skills', 'shards2', 'shards3', 'enemies2', 'weapons2', 'boss2', 'boss3',
  'traps', 'difficulty', 'news', 'screens', 'name', 'overlay', 'panels', 'game', 'weapons3', 'enemies3', 'shards4', 'bossart', 'curses2', 'rooms', 'support', 'testmode', 'chips2', 'squad', 'prompts', 'chat', 'girls', 'stories-data', 'stories', 'market', 'wchat', 'event', 'camp', 'look', 'codex2', 'touch', 'partners', 'invade-data', 'invade-items', 'invade-weapons', 'invade-roles', 'invade-art-data', 'invade-art', 'invade-enemies', 'invade-weapon-info', 'invade', 'invade-effects', 'invade-details', 'invade-visuals', 'invade-presentation', 'invade-summons', 'invade-style', 'invade-extras', 'achieve', 'follow', 'sieve', 'gamepad', 'balance'];
const GAME_V = 'mv9nfppo';
// served from this machine (development): never reuse cached scripts
const DEV_BUST = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? '.' + Date.now() : '';
// startup timings (ms since the page started): printed to the console, and sent once to the author's DZMM log
const BOOT_T = {}; const mark = k => { BOOT_T[k] = Math.round(performance.now()); };
function startupReport() {
  const c = document.getElementById('c'), info = Object.assign({}, BOOT_T, { frame: innerWidth + 'x' + innerHeight, canvas: c ? c.style.width + 'x' + c.style.height : '?', hidden: document.visibilityState });
  console.info('[ember] startup', JSON.stringify(info));
  try { if (PLAT.dzmm && PLAT.caps.log !== false) dzmm.log.info('startup', info, 'STARTUP'); } catch (e) { }
}
(async function boot() {
  const inFrame = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
  // the SDK is injected by the host; give it a moment when we are inside an iframe
  for (let i = 0; i < 40 && !window.dzmm && inFrame; i++) await new Promise(r => setTimeout(r, 50));
  const dz = window.dzmm, prog = o => { try { if (PLAT.dzmm && PLAT.caps.loading !== false) dzmm.loading.progress(o); } catch (e) { } };
  try {
    if (dz) {
      PLAT.dzmm = true; prog({ phase: 'start', message: 'Preparing' });
      // the host cancels (ABORTED) requests made while it is still setting the frame up: start talking once the page has loaded
      if (document.readyState !== 'complete') await new Promise(r => addEventListener('load', r, { once: true }));
      mark('page load');
      try { PLAT.caps = await sdkRetry(() => dz.capabilities.get(), 'capabilities', prog); } catch (e) { PLAT.caps = {}; } mark('sdk');
      PLAT.env = PLAT.caps.environment || null;
      // the player's identity is fetched while the save loads; the save must load before anything can be written
      const who = sdkRetry(() => dz.user.info(), 'user', prog).then(u => { PLAT.user = u || null; }).catch(() => { PLAT.user = null; });
      // cancelled or temporarily failing reads are retried on their own; only a read that keeps failing stops on the retry screen
      for (;;) { try { await sdkRetry(() => storeLoad(dz), 'kv load', prog); break; }
        catch (e) { console.warn('[ember] kv load failed', e && e.code); try { dzmm.loading.error('SAVE_LOAD_FAILED', 'Could not read the save'); } catch (e2) { }
          await bootRetry(e && (e.code || e.message)); prog({ phase: 'start', message: 'Retrying' }); } }
      await who;
      registerSaveActions();
    }
    mark('save');
    // all scripts are requested at once (async = false keeps them running in order); progress is reported as each one arrives
    let got = 0; const N = GAME_SCRIPTS.length;
    prog({ phase: 'resource_loading', loadedResources: 0, totalResources: N, message: 'Loading' });
    await Promise.all(GAME_SCRIPTS.map(name => new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'js/' + name + '.js?v=' + GAME_V + DEV_BUST; s.async = false;
      s.onload = () => { got++; prog({ phase: 'resource_loading', loadedResources: got, totalResources: N, currentResource: name + '.js', message: 'Loading' }); ok(); };
      s.onerror = () => no(new Error(name)); document.body.appendChild(s); })));
    mark('scripts'); prog({ phase: 'first_frame' });
    // EMBER_START draws the first frame right away, so the host can be told at once
    window.EMBER_START(); mark('first frame');
    try { if (PLAT.dzmm) dzmm.loading.ready(); } catch (e) { }
    startupReport();
  } catch (e) {
    console.error('[ember] boot', e);
    try { if (PLAT.dzmm) dzmm.loading.error('BOOT_FAILED', 'Failed to load ' + (e && e.message)); } catch (e2) { }
    document.body.insertAdjacentHTML('beforeend', '<p style="color:#e8e1d3;font:14px sans-serif;position:fixed;inset:auto 0 45%;text-align:center">加载失败，请刷新重试 / Failed to load, please reload.</p>');
  }
})();
// The host's reset/delete buttons clear every chat-scoped key, including settings with progression flags.
function registerSaveActions() {
  try { dzmm.save.onAction(async req => {
    if (!req || !['reset', 'prepareDeleteRecord'].includes(req.action)) return { ok: false, code: 'unsupported' };
    // nothing may be written back after this: stop writing, let a write that is already on its way finish, then delete
    STORE.locked = true; clearTimeout(STORE.timer); STORE.dirty.clear(); STORE.dead.clear(); if (STORE.running) await STORE.running.catch(() => { });
    // Settings include progression (cleared/unlocks), so both actions remove all
    // chat-scoped keys. Global boards/chat/event receipts retain their own scope.
    const results = await Promise.allSettled(STORE_KEYS.map(k => dzmm.kv.delete(k)));
    if (results.some(r => r.status === 'rejected')) return { ok: false, code: 'SAVE_DELETE_FAILED', message: '存档清理未完成，请重试。' };
    STORE.mem = {};
    return req.action === 'reset' ? { ok: true, reload: true } : { ok: true }; }); } catch (e) { console.warn('[ember] save actions', e); }
}
