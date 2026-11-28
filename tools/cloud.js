// ===== offline "cloud" — shareable runs and a local leaderboard =============
// The mirror cannot talk to dzmm.ai (no CORS, SameSite=Lax cookies), so this
// provides the same two features by other means:
//
//   • 存档交换 — export a save to a compact string / file, import it back
//   • 排行     — record finished runs locally and compare; a shareable link
//                 carries the score so it can be posted anywhere
//
// Everything is client-side; nothing leaves the browser unless the user copies it.
'use strict';
(function () {
  const TSW = window.__TSW; if (!TSW || TSW.cloud) return;
  const C = TSW.cloud = {};
  const KEY = 'theseed.cloud.runs.v1';

  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
  const write = (a) => { try { localStorage.setItem(KEY, JSON.stringify(a.slice(-400))); } catch (e) { } };

  // ---- save exchange -------------------------------------------------------
  C.exportSave = () => {
    try { return window.__dzmmMirror ? window.__dzmmMirror.export() : null; } catch (e) { return null; }
  };
  C.importSave = (txt, merge) => {
    try {
      const n = window.__dzmmMirror.import(txt, { merge: !!merge });
      return { ok: true, keys: n };
    } catch (e) { return { ok: false, error: String(e) }; }
  };
  // base64 "code" so the whole save can be pasted into a chat message
  C.toCode = () => {
    try { return btoa(unescape(encodeURIComponent(C.exportSave() || ''))); } catch (e) { return ''; }
  };
  C.fromCode = (code) => {
    try { return C.importSave(decodeURIComponent(escape(atob((code || '').trim())))); } catch (e) { return { ok: false, error: String(e) }; }
  };
  C.download = () => {
    const j = C.exportSave(); if (!j) return false;
    const a = document.createElement('a');
    a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(j);
    a.download = 'theseed-save-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.json';
    a.click(); return true;
  };

  // ---- leaderboard --------------------------------------------------------
  C.record = (r) => {
    if (!r) return null;
    const row = {
      at: Date.now(),
      mode: r.mode || 'explore', kind: r.kind || 'fullrun',
      maxFloor: r.maxFloor | 0, depth: r.depth | 0,
      kills: r.kills | 0, rooms: r.roomsCleared | 0,
      difficulty: r.diff || '', mods: (r.modifiersAtEnd || []).length,
    };
    // one score that is comparable across runs: endless depth dominates, then
    // floors, then rooms, then kills as a tiebreak.
    row.score = row.depth * 1e8 + row.maxFloor * 1e6 + row.rooms * 1e3 + Math.min(999, row.kills);
    const a = read(); a.push(row); write(a);
    return row;
  };
  C.runs = () => read();
  C.rank = (limit) => read().slice().sort((x, y) => y.score - x.score).slice(0, limit || 20);
  C.clear = () => { write([]); return true; };

  // shareable link carrying the best run, so it can be posted anywhere
  C.shareLink = (row) => {
    const r = row || C.rank(1)[0]; if (!r) return '';
    const q = 'run=' + [r.maxFloor, r.depth, r.rooms, r.kills, r.mods].join('.');
    return location.origin + location.pathname + '#' + q;
  };
  // import a run from a shared link (read-only: it only adds a leaderboard row)
  C.importLink = (hash) => {
    const m = /run=(\d+)\.(\d+)\.(\d+)\.(\d+)\.(\d+)/.exec(hash || location.hash || '');
    if (!m) return null;
    const row = { at: Date.now(), mode: 'shared', kind: 'fullrun', maxFloor: +m[1], depth: +m[2], rooms: +m[3], kills: +m[4], mods: +m[5], difficulty: 'shared' };
    row.score = row.depth * 1e8 + row.maxFloor * 1e6 + row.rooms * 1e3 + Math.min(999, row.kills);
    const a = read(); a.push(row); write(a);
    return row;
  };
})();
