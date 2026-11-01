// ===== TSW.cloudHost — talk to the REAL dzmm host ==========================
// Only useful when the tools are injected INTO the official page (site/inject.js),
// because that is the only place where `window.dzmm` exists and where the dzmm
// Host performs the actual cloud write.
//
// Why not HTTP (docs/benchmark.md 155): the game never issues a request.
// platform.js:31 does `await dzmm.kv.put(k, v, { flush: true })` and the SDK
// forwards it over postMessage; the HOST writes. Our own guessed REST path
// returns 403, so any self-built HTTP writer is wrong by construction.
//
// What this module does:
//   detect()        -> is a real host present?
//   load()          -> read the 8 STORE_KEYS through dzmm.kv into a plain object
//   save(payload)   -> write them through dzmm.kv (the Host performs the write)
//   export/import   -> reuse TSW.cloud's base64 codec so saves can move between
//                      the official page and the offline mirror.
'use strict';
(function () {
  const TSW = window.__TSW;
  if (!TSW) return;
  if (TSW.cloudHost) return;

  const KEYS = ['achroma_set', 'achroma_run', 'achroma_codex', 'achroma_pending',
    'achroma_girls', 'achroma_evpend', 'achroma_ivrun', 'achroma_ltpend'];

  const CH = TSW.cloudHost = {};

  // A host is present only when dzmm exists AND it is not our offline shim.
  CH.detect = () => {
    try {
      const d = window.dzmm;
      if (!d || !d.kv) return { ok: false, why: 'no dzmm.kv (not inside the official page)' };
      if (d.__shim) return { ok: false, why: 'offline shim only — no real host to write through' };
      return { ok: true, why: 'real host' };
    } catch (e) { return { ok: false, why: String(e && e.message || e) }; }
  };

  // Read every save key. Values come back through the Host, so this is the
  // authoritative copy of the player's cloud save.
  CH.load = async () => {
    const det = CH.detect();
    if (!det.ok) throw Object.assign(new Error(det.why), { code: 'NO_HOST' });
    const out = {};
    let got = 0;
    for (const k of KEYS) {
      try {
        const r = await window.dzmm.kv.get(k);
        const v = r && typeof r === 'object' && 'value' in r ? r.value : r;
        if (v != null) { out[k] = typeof v === 'string' ? v : JSON.stringify(v); got++; }
      } catch (e) { /* an absent key is fine */ }
    }
    return { keys: out, count: got };
  };

  // Write keys through the Host.  `flush:true` is what the game uses for a save
  // the player is told succeeded; without it the Host may debounce and the write
  // is not durable (kv.md).
  CH.save = async (payload) => {
    const det = CH.detect();
    if (!det.ok) throw Object.assign(new Error(det.why), { code: 'NO_HOST' });
    const keys = payload && payload.keys ? payload.keys : {};
    const written = [], failed = [];
    for (const [k, v] of Object.entries(keys)) {
      if (!KEYS.includes(k)) continue;               // never write unknown keys
      if (typeof v !== 'string') continue;           // the game stores JSON strings
      try { await window.dzmm.kv.put(k, v, { flush: true }); written.push(k); }
      catch (e) { failed.push(k + ' ' + (e && e.message || e)); }
    }
    // verify: read back and compare, because a Host may accept then fail silently
    const verified = [];
    for (const k of written) {
      try {
        const r = await window.dzmm.kv.get(k);
        const got = r && typeof r === 'object' && 'value' in r ? r.value : r;
        if ((typeof got === 'string' ? got : JSON.stringify(got)) === keys[k]) verified.push(k);
      } catch (e) { }
    }
    return { written, verified, failed, ok: failed.length === 0 && verified.length === written.length };
  };

  // Move a save between the official page and the offline mirror via the same
  // base64 code TSW.cloud already produces.
  CH.toCode = async () => {
    const { keys, count } = await CH.load();
    const txt = JSON.stringify({ v: 1, at: Date.now(), keys });
    try { return btoa(unescape(encodeURIComponent(txt))); }
    catch (e) { return ''; }
  };
  CH.fromCode = async (code) => {
    let payload;
    try { payload = JSON.parse(decodeURIComponent(escape(atob((code || '').trim())))); }
    catch (e) { return { ok: false, error: 'bad code' }; }
    if (!payload || !payload.keys) return { ok: false, error: 'no keys in code' };
    return CH.save({ keys: payload.keys });
  };
})();
