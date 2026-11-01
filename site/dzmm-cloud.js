// ===== dzmm cloud-save backend (READ-ONLY until writing is authorised) ======
// Measured contract (CI, signed-in session, run 41294623260):
//   GET /api/gamefy/<gameId>/kv        -> 200 {data:[], count:0}      key list
//   GET /api/gamefy/<gameId>/kv/<key>  -> 200 {value:null, updated_at:null}
//
// The second shape is EXACTLY what js/platform.js expects:
//   storeLoad() reads dz.kv.get(k) and requires {value, updated_at}.
//
// The WRITE side has never been probed, because writing changes the player's
// account and that needs their explicit go-ahead.  So put/delete REFUSE instead
// of pretending to succeed -- a silent fake success would look like a working
// cloud save and quietly lose data.
'use strict';
(function () {
  function make({ gameId, base }) {
    const root = (base || '/api/gamefy/') + gameId + '/kv';
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
      // deliberately unimplemented: see the header.  Throwing makes the shim fall
      // back to localStorage, which is visible and lossless.
      throw Object.assign(new Error('cloud write not enabled: ' + kind + ' (write support needs authorisation)'), { code: 'CLOUD_WRITE_DISABLED' });
    };
  }
  window.DzmmCloud = { make, readOnly: true };
})();
