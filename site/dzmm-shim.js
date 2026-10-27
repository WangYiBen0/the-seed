// ===== dzmm platform shim (offline mirror) ==================================
// This file emulates the DZMM Gamefy SDK (the `window.dzmm` object that the
// host page normally injects) so that the UNMODIFIED game + js/platform.js run
// anywhere as a static site and still keep saves.  Everything the game stores
// on DZMM's kv store is persisted to this browser's localStorage instead.
//
//   * no game script is modified — upstream updates keep working: refresh
//     site/js/ with `nix run .#sync` and the shim keeps working as-is.
//   * AI features (squad chat, girl portraits, world events, leaderboards)
//     answer with { code: 'offline' } which the game already handles.
//   * this file is OURS, not upstream code.
//
// Inspect / export the save from the console:
//   __dzmmMirror.export()  -> JSON string of the whole save
//   __dzmmMirror.import(jsonString)
//   __dzmmMirror.reset()   // wipe
//   __dzmmMirror.dump()    // console.table of keys
'use strict';
(function () {
  const PREFIX = 'theseed.kv.';
  const VERSION = '1.0';

  // ---- localStorage backend (falls back to memory when unavailable) ----
  let mem = null; // fallback store when localStorage is blocked
  let persistOK = true;
  try { localStorage.setItem(PREFIX + '__probe', '1'); localStorage.removeItem(PREFIX + '__probe'); }
  catch (e) { persistOK = false; mem = {}; console.warn('[dzmm-shim] localStorage unavailable, saves live in memory only', e); }

  const full = (k) => PREFIX + k;
  const lsGet = (k) => persistOK ? localStorage.getItem(full(k)) : (k in mem ? mem[k] : null);
  const lsSet = (k, v) => { if (persistOK) { try { localStorage.setItem(full(k), v); } catch (e) { console.warn('[dzmm-shim] write failed', k, e); } } else mem[k] = v; };
  const lsDel = (k) => { if (persistOK) { try { localStorage.removeItem(full(k)); } catch (e) { } } else delete mem[k]; };
  const lsKeys = () => {
    if (!persistOK) return Object.keys(mem);
    const out = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(PREFIX)) out.push(k.slice(PREFIX.length)); } return out;
  };

  const fail = (code, message) => Promise.reject(Object.assign(new Error(message || code), { code }));
  const val = (v) => typeof v === 'string' ? v : JSON.stringify(v);
  const unwrap = (r) => r && typeof r === 'object' && 'value' in r ? r.value : r;

  // ---- window.dzmm ----
  const dzmm = {
    __shim: { name: 'theseed-offline-mirror', version: VERSION },

    kv: {
      async get(k) {
        const v = lsGet(k);
        return { key: k, value: v, updated_at: null }; // value === null when absent
      },
      async batchGet(keys) {
        const out = {}; // every requested key must exist (platform.js checks hasOwnProperty)
        for (const k of keys) out[k] = { key: k, value: lsGet(k), updated_at: null };
        return out;
      },
      async put(k, v, _opts) { lsSet(k, val(v)); return { ok: true }; },
      async batchPut(obj, _opts) { for (const k of Object.keys(obj)) lsSet(k, val(obj[k])); return { ok: true }; },
      async putIfAbsent(k, v) { if (lsGet(k) == null) lsSet(k, val(v)); return { ok: true }; },
      async delete(k) { lsDel(k); return { ok: true }; },
      async list(prefix) { return lsKeys().filter((k) => !prefix || k.startsWith(prefix)).map((k) => ({ key: k })); },
    },

    capabilities: {
      // caps gates: kvBatch enables batch reads/writes; fn/draw off puts boards,
      // events and image generation into the same "offline" state the game already
      // has outside DZMM.  completions flips ON when the user configured an
      // OpenAI-compatible endpoint in the workshop panel (AI 设置).
      async get() {
        return {
          kvBatch: true,
          fn: false, completions: !!aiCfg()?.endpoint, draw: false, drawStatus: false, drawPresentation: false,
          loading: true, log: true, gamepad: true,
          environment: { type: 'web', name: 'offline-mirror', version: VERSION, offline: true },
        };
      },
    },

    user: { async info() { return null; } },

    loading: {
      progress(_o) { },
      ready() { },
      error(code, msg) { console.warn('[dzmm-shim] loading error:', code, msg); },
    },

    log: {
      info(msg, data, tag) { console.info('[dzmm]' + (tag ? '[' + tag + ']' : ''), msg, data ?? ''); },
      error(msg, data, tag) { console.error('[dzmm]' + (tag ? '[' + tag + ']' : ''), msg, data ?? ''); },
      write(level, msg, data, tag) { (level === 'error' ? console.error : console.info)('[dzmm]', msg, data ?? ''); },
    },

    save: {
      _handlers: [],
      onAction(fn) { this._handlers.push(fn); return { ok: true }; },
      async action(req) { const rs = await Promise.all(this._handlers.map((f) => f(req))); return rs[rs.length - 1] ?? { ok: false, code: 'unsupported' }; },
    },

    // ---- platform AI: squad/girls chat bridge ----------------------------------
    // Without configuration these reject with 'offline' (the game handles it).
    // The workshop panel (AI 设置) can point them at ANY OpenAI-compatible
    // endpoint; config lives in localStorage 'theseed.ai':
    //   { endpoint: 'https://api.openai.com/v1', key: 'sk-…', model: 'gpt-4o-mini' }
    models: {
      async list() {
        const c = aiCfg(); if (!c || !c.endpoint) return fail('offline', '未配置 AI 接口（工坊 → AI 设置）');
        return { models: [{ internalName: c.model || 'default', displayName: '自定义接口 · ' + (c.model || 'default') }] };
      },
    },
    async completions(opts, onChunk) {
      const c = aiCfg(); if (!c || !c.endpoint) return fail('offline', '未配置 AI 接口（工坊 → AI 设置）');
      const base = c.endpoint.replace(/\/+$/, '');
      const rsp = await fetch(base + '/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(c.key ? { authorization: 'Bearer ' + c.key } : {}) },
        body: JSON.stringify({
          model: c.model || opts?.model || 'default',
          messages: opts?.messages || [],
          max_tokens: opts?.maxTokens || 300,
          stream: true,
        }),
      });
      if (!rsp.ok || !rsp.body) throw Object.assign(new Error('AI endpoint HTTP ' + rsp.status), { code: 'AI_HTTP' });
      const reader = rsp.body.getReader(), dec = new TextDecoder();
      let buf = '', full = '';
      const emit = (done) => { try { onChunk(full, done); } catch (e) { } };
      for (;;) {
        const { done, value } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') { emit(true); continue; }
          try {
            const j = JSON.parse(data);
            const piece = j.choices?.[0]?.delta?.content || '';
            if (piece) { full += piece; emit(false); }
          } catch (e) { }
        }
      }
      emit(true);
      return full;
    },
    draw: {
      generateModels() { return fail('offline', 'draw models need the DZMM platform'); },
      generate(_o) { return fail('offline', 'image generation needs the DZMM platform'); },
      status(_id) { return fail('offline', 'image generation needs the DZMM platform'); },
      download(_id) { return fail('offline', 'image download needs the DZMM platform'); },
      edit() { return fail('offline', 'image edit needs the DZMM platform'); },
      nav() { return fail('offline', 'draw nav needs the DZMM platform'); },
    },
    fn: {
      invoke(_name, _body) { return fail('offline', 'server functions need the DZMM platform'); },
      invokeStream(_name, _body) { return fail('offline', 'server functions need the DZMM platform'); },
    },
  };

  function aiCfg() { try { return JSON.parse(localStorage.getItem('theseed.ai') || 'null'); } catch (e) { return null; } }
  window.dzmm = dzmm;

  // ---- save management helpers (used by the tools panel and the console) ----
  window.__dzmmMirror = {
    version: VERSION,
    keys() { return lsKeys(); },
    export() {
      const o = { __mirror: 'theseed', version: VERSION, at: new Date().toISOString(), kv: {} };
      for (const k of lsKeys()) o.kv[k] = lsGet(k);
      return JSON.stringify(o);
    },
    import(json, { merge = false } = {}) {
      const o = JSON.parse(json);
      const kv = o && o.kv ? o.kv : o; // accept raw {key:value} too
      if (!merge) for (const k of lsKeys()) lsDel(k);
      let n = 0; for (const k of Object.keys(kv)) { const v = kv[k]; if (v == null) continue; lsSet(k, val(v)); n++; }
      return n;
    },
    reset() { for (const k of lsKeys()) lsDel(k); return true; },
    dump() { const rows = {}; for (const k of lsKeys()) { const v = lsGet(k); rows[k] = v == null ? null : (v.length > 96 ? v.slice(0, 96) + '…(' + v.length + 'B)' : v); } console.table(rows); return lsKeys(); },
    // invoke the game's own reset pipeline (same as the host's reset button)
    async resetViaGame() { try { return await dzmm.save.action({ action: 'reset' }); } catch (e) { return { ok: false, error: e }; } },
  };

  console.info('[dzmm-shim] offline mirror ready — saves persist in localStorage under "' + PREFIX + '*" (export: __dzmmMirror.export())');
})();
