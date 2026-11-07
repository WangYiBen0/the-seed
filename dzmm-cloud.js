// ===== dzmm cloud-save backend ==============================================
// READ contract — measured (CI, signed-in session, run 41294623260):
//   GET /api/gamefy/<gameId>/kv        -> 200 {data:[], count:0}      key list
//   GET /api/gamefy/<gameId>/kv/<key>  -> 200 {value:null, updated_at:null}
// The second shape is EXACTLY what js/platform.js expects: storeLoad() reads
// dz.kv.get(k) and requires {value, updated_at}.
//
// WRITE contract — NOT measured.  The SDK sends kv.put over postMessage and the
// host's own HTTP request is invisible, so the body shape cannot be observed
// from outside.  Therefore the body is configurable ({ writeBody }) and every
// write is read back to prove it landed ({ verifyWrites }, on by default).
//
// The rule that matters: a write that cannot be verified is reported as a FAILURE.
// An unverified "ok" is the only outcome that silently loses saves.
//
// IMPORTANT (docs/benchmark.md 155): this REST write path is NOT the player save
// route. The real save is dzmm.kv.put over postMessage, executed by the dzmm HOST
// (platform.js:31 does no HTTP at all). Keeping this path is only useful if a
// real host route is found later; do not wire it into production as-is.
'use strict';
(function () {
  function make(opts) {
    const o = opts || {};
    const gameId = o.gameId;
    const base = o.base;
    const root = (base || '/api/gamefy/') + gameId + '/kv';
    // The write body is NOT documented anywhere and cannot be observed through
    // the SDK, so it must be configurable and must default to the most plausible
    // shape.  { value } is what a per-key endpoint returns on read, so writing
    // the same envelope is the natural guess; the read-back verification is what
    // turns the guess into an answer.
    const writeBody = o.writeBody || ((x) => ({ value: x.value }));
    const verifyWrites = o.verifyWrites !== false;
    const j = (r) => r.json();
    const must = (r, what) => {
      if (!r.ok) throw Object.assign(new Error(what + ' HTTP ' + r.status), { code: 'CLOUD_HTTP' });
      return r;
    };
    return async function kvFetch(op) {
      const kind = (op && op.op) || 'get';
      if (kind === 'get') {
        if (!op.key) throw Object.assign(new Error('kvFetch get needs a key'), { code: 'BAD_OP' });
        const r = await must(await fetch(root + '/' + encodeURIComponent(op.key), { credentials: 'include', headers: { accept: 'application/json' } }), 'kv get');
        const v = await j(r);
        // hand back the exact shape storeLoad() validates
        return { value: v && 'value' in v ? v.value : null, updated_at: (v && v.updated_at) || null };
      }
      if (kind === 'list') {
        const r = await must(await fetch(root, { credentials: 'include', headers: { accept: 'application/json' } }), 'kv list');
        const v = await j(r);
        const list = (v && v.data) || [];
        // the endpoint returns rows; the SDK wants key strings
        return { keys: list.map((x) => (typeof x === 'string' ? x : (x && (x.key || x.name)) || '')).filter(Boolean) };
      }
      // ---- writes ------------------------------------------------------------
      // The HTTP shape of a write was never observable from the SDK (kv.put goes
      // over postMessage to the host, and the host's own request is invisible),
      // so it is probed once at runtime instead of hardcoded: whoever mounts the
      // host can pass { writeBody } to try a shape, and every write is verified by
      // reading the key back.  A write that cannot be verified is reported as
      // failed — a silent fake success is the one outcome that loses saves.
      if (kind === 'put') {
        if (!op.key) throw Object.assign(new Error('kvFetch put needs a key'), { code: 'BAD_OP' });
        const url = root + '/' + encodeURIComponent(op.key);
        const body = writeBody({ key: op.key, value: op.value });
        const r = await fetch(url, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify(body),
        });
        if (!r.ok) {
          // The measured reason is a PERMISSION wall, not a shape problem:
          //   403 FORBIDDEN {"message":"没有访问权限"}
          // and /api/gamefy/mine reports developer.eligible=false,
          // reason=VIP_REQUIRED.  kv writes are a developer capability.  Surface
          // that instead of a bare status so the caller knows upgrading is the
          // only way through.
          let detail = '';
          try { detail = (await r.text()).slice(0, 120); } catch (e2) { }
          const forbidden = r.status === 403;
          throw Object.assign(
            new Error('kv put HTTP ' + r.status + (detail ? ' ' + detail : '')
              + (forbidden ? ' (this REST path is not the player save route; the real write runs in the dzmm host, see docs/benchmark.md 155)' : '')),
            { code: forbidden ? 'CLOUD_FORBIDDEN' : 'CLOUD_HTTP' });
        }
        if (!verifyWrites) return { ok: true };
        // read-back: the only proof the value actually landed
        const back = await kvFetch({ op: 'get', key: op.key });
        const same = JSON.stringify(back && back.value) === JSON.stringify(op.value);
        if (!same) throw Object.assign(new Error('kv put not visible on read-back'), { code: 'CLOUD_VERIFY_FAILED' });
        return { ok: true, verified: true };
      }
      if (kind === 'delete') {
        if (!op.key) throw Object.assign(new Error('kvFetch delete needs a key'), { code: 'BAD_OP' });
        const r = await fetch(root + '/' + encodeURIComponent(op.key), { method: 'DELETE', credentials: 'include', headers: { accept: 'application/json' } });
        if (!r.ok) throw Object.assign(new Error('kv delete HTTP ' + r.status), { code: 'CLOUD_HTTP' });
        return { ok: true };
      }
      throw Object.assign(new Error('kvFetch: unknown op ' + kind), { code: 'BAD_OP' });
    };
  }
  window.DzmmCloud = { make, readOnly: true };
})();
