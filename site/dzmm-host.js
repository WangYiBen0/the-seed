// ===== dzmm HOST stub — run [TheSeed] as an iframe inside YOUR page ========
// The official SDK (gamefy/sdk/v1.js) talks to its host page over postMessage:
//
//   iframe -> parent   "iframe:content-ready"        (I am alive)
//   parent -> iframe   {type:'dzmm:ready', ...}      (capabilities)
//   iframe -> parent   {type:'dzmm:request', id, method, params}
//   parent -> iframe   {type:'dzmm:response', id, result | error}
//
// That is the whole contract (extracted from the 65 KB SDK: the request/response
// pair is the only data channel; identity and kv both travel through it).  So a
// page can BE the host, put the game in an iframe, and answer those requests
// itself — which is what this file does.
//
// Why this exists: dzmm.kv (the official cloud save) is only reachable from a
// dzmm-origin session.  From our own domain the API has no CORS headers and the
// cookie is SameSite=Lax, so a direct fetch cannot read or send it (measured;
// see docs/iframe-sso.md).  Inside an iframe the game does not need to know:
// the host answers, and the host can be a page that HAS a dzmm session (or is
// signed in through the sign-in link).
//
// Usage, in your own HTML:
//   <script src="dzmm-host.js"></script>
//   <script>
//     const host = DzmmHost.create({
//       // optional: forward kv to the real API when you are signed in
//       kvFetch: (op) => fetch('/api/gamefy/' + GID + '/kv', {credentials:'include'}) ...
//     });
//     host.mount('#game', 'index.html');       // creates the iframe
//   </script>
// What it does NOT do: it never fakes an identity.  dzmm.user.info() resolves to
// null unless you supply a real token, exactly like the offline shim.
'use strict';
(function () {
  const HOST_VERSION = '1.0';

  function create(opts) {
    const o = opts || {};
    const GID = o.gameId || '';
    // kv is kept in the host's own localStorage unless you provide a backend
    const KV_PREFIX = 'theseed.host.kv.';
    const OLD_PREFIX = 'theseed.kv.'; // pre-iframe direct-shim saves: migrate on read, never delete old
    // A page that HAS a dzmm session can forward kv to the real API instead of
    // localStorage (o.kvFetch).  That is the whole point of the iframe route: the
    // host runs the request from its own origin with its own cookies, so the
    // no-CORS / SameSite=Lax problem that blocks a direct fetch never applies.
    //   kvFetch: async ({ op:'get'|'put'|'delete'|'list', key, value, prefix }) => result
    const backend = o.kvFetch || null;
    function migrateKey(k) {
      k = norm(k);
      try {
        if (localStorage.getItem(KV_PREFIX + k) !== null) return;
        const oldv = localStorage.getItem(OLD_PREFIX + k);
        if (oldv !== null) localStorage.setItem(KV_PREFIX + k, oldv);
      } catch (e) { }
    }
    // The gamefy SDK prefixes every kv key with withKvPrefix before sending,
    // so a request key may already be 'theseed.host.kv.<name>'.  Reading or
    // writing with KV_PREFIX + k would then double-prefix it and land in a
    // different (nonexistent) slot — measured: writes went to
    // 'theseed.host.kv.theseed.host.kv.achroma_set' while reads looked up
    // 'theseed.host.kv.achroma_set' and came back null, so the game loaded an
    // empty save on every refresh even though the write had reported ok.
    // Normalize here: strip the prefix we own, then operate on the bare key.
    const norm = (k) => (k && k.startsWith(KV_PREFIX)) ? k.slice(KV_PREFIX.length) : k;
    const kvGet = (k) => { try { migrateKey(norm(k)); return localStorage.getItem(KV_PREFIX + norm(k)); } catch (e) { return null; } };
    const kvSet = (k, v) => { try { localStorage.setItem(KV_PREFIX + norm(k), v); } catch (e) { } };
    const kvDel = (k) => { try { localStorage.removeItem(KV_PREFIX + norm(k)); } catch (e) { } };
    const kvKeys = () => {
      const out = new Set();
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(KV_PREFIX)) out.add(k.slice(KV_PREFIX.length));
          else if (k && k.startsWith(OLD_PREFIX)) out.add(k.slice(OLD_PREFIX.length));
        }
      } catch (e) { }
      return [...out];
    };

    // ---- the request table: method name -> async (params) => result ----------
    // Every method the game calls goes through here.  Unknown methods answer with
    // an error code the game already handles, never with a fake success.
    const methods = {
      'kv.get': async (p) => {
        if (backend) { try { return await backend({ op: 'get', key: p.key }); } catch (e) { console.warn('[dzmm-host] backend get failed, local fallback', e); } }
        const raw = kvGet(p.key);
        if (raw === null) return { value: null, updated_at: null };
        try { return { value: JSON.parse(raw), updated_at: new Date().toISOString() }; }
        catch (e) { return { value: raw, updated_at: null }; }
      },
      'kv.put': async (p) => {
        if (backend) { try { await backend({ op: 'put', key: p.key, value: p.value }); return { ok: true }; } catch (e) { console.warn('[dzmm-host] backend put failed', e); } }
        kvSet(p.key, JSON.stringify(p.value === undefined ? null : p.value)); return { ok: true };
      },
      'kv.delete': async (p) => {
        if (backend) { try { await backend({ op: 'delete', key: p.key }); return { ok: true }; } catch (e) { console.warn('[dzmm-host] backend delete failed', e); } }
        kvDel(p.key); return { ok: true };
      },
      'kv.list': async (p) => {
        if (backend) { try { return await backend({ op: 'list', prefix: p.prefix || '' }); } catch (e) { console.warn('[dzmm-host] backend list failed, local fallback', e); } }
        const prefix = p.prefix || '';
        const keys = kvKeys().filter((k) => k.startsWith(prefix)).sort();
        const limit = p.limit || 20;
        return { keys: keys.slice(0, limit), cursor: keys.length > limit ? String(limit) : null };
      },
      'kv.batchGet': async (p) => {
        if (backend) { try { return await backend({ op: 'batchGet', keys: p.keys || [] }); } catch (e) { console.warn('[dzmm-host] backend batchGet failed, local fallback', e); } }
        const out = {};
        for (const k of (p.keys || [])) {
          // The SDK sends FULLY PREFIXED keys (dzmm.withKvPrefix); kvGet(k) would
          // prepend the prefix again and read a nonexistent double-prefixed key,
          // so every batch read returned null and the game loaded an empty save
          // even though writes had landed.  Strip the prefix we own and read bare.
          const raw = kvGet(norm(k));
          if (raw === null) { out[k] = null; continue; }
          try { out[k] = { value: JSON.parse(raw), updated_at: null }; }
          catch (e) { out[k] = { value: raw, updated_at: null }; }
        }
        return out;
      },
      'kv.batchPut': async (p) => { const entries = p.values || p.entries || {}; for (const [k, v] of Object.entries(entries)) kvSet(norm(k), JSON.stringify(v)); return { ok: true }; },
      // identity: never invented
      'user.info': async () => (o.user ? o.user : { id: null, name: null, avatarUrl: null, token: null, environment: 'prod' }),
      'capabilities.get': async () => ({ kv: true, kvBatch: true, kvList: true, kvPutIfAbsent: false, saveActions: true }),
      'log.write': async (p) => { console.info('[dzmm-host:log]', p && p.message); return { ok: true }; },
      'toast.show': async (p) => { console.info('[dzmm-host:toast]', p && p.message); return { ok: true }; },
      'save.action': async (p) => { if (o.onSaveAction) return o.onSaveAction(p); return { ok: false, code: 'unsupported' }; },
    };

    // ---- message plumbing ----------------------------------------------------
    let frameWin = null;
    function send(type, payload) {
      if (!frameWin) return;
      try { frameWin.postMessage(Object.assign({ type }, payload || {}), '*'); } catch (e) { }
    }
    function onMessage(ev) {
      const d = ev.data;
      if (typeof d === 'string') {
        if (d === 'iframe:content-ready' || d === 'iframe:alive') {
          send('dzmm:ready', { hostVersion: HOST_VERSION, gameId: GID, audioVolume: { volume: 1, muted: false } });
        }
        return;
      }
      if (!d || typeof d !== 'object') return;
      if (d.type === 'dzmm:request') {
        const { id, method, params } = d;
        const fn = methods[method];
        if (!fn) {
          // name the method in the console: the SDK calls a few host methods we
          // have not tabled yet, and METHOD_NOT_SUPPORTED alone hides which one
          console.warn('[dzmm-host] unsupported host request:', method);
          send('dzmm:response', { id, error: 'METHOD_NOT_SUPPORTED', errorCode: 'METHOD_NOT_SUPPORTED', errorPayload: { method } });
          return;
        }
        Promise.resolve()
          .then(() => fn(params || {}))
          .then((result) => send('dzmm:response', { id, result }))
          .catch((e) => send('dzmm:response', { id, error: String(e && e.message || e), errorCode: (e && e.code) || 'HOST_ERROR' }));
        return;
      }
      if (d.type === 'dzmm:loading-progress' || d.type === 'dzmm:iframe-error') {
        try { if (o.onStatus) o.onStatus(d); } catch (e) { }
      }
    }

    // ---- mount ---------------------------------------------------------------
    function mount(target, src, attrs) {
      const host = typeof target === 'string' ? document.querySelector(target) : target;
      if (!host) throw new Error('DzmmHost.mount: target not found');
      const f = document.createElement('iframe');
      f.src = src || 'index.html';
      f.style.cssText = 'border:0;width:100%;height:100%;display:block;background:#050506';
      f.setAttribute('allow', 'autoplay; fullscreen');
      f.setAttribute('title', '[TheSeed]');
      if (attrs) for (const [k, v] of Object.entries(attrs)) f.setAttribute(k, v);
      host.appendChild(f);
      frameWin = f.contentWindow;
      f.addEventListener('load', () => { frameWin = f.contentWindow; try { frameWin.postMessage('dzmm:parent-ready', '*'); } catch (e) { } });
      return f;
    }

    window.addEventListener('message', onMessage);
    return { mount, methods, send, destroy() { window.removeEventListener('message', onMessage); } };
  }

  window.DzmmHost = { create, version: HOST_VERSION };
})();
