// ===== EMBER online: the DZMM identity, run scores, uploads and the leaderboard (server function 'board') =====
'use strict';
const NET = { ready: false, off: false, canLogin: true, user: null, board: null, boardAt: 0, boardBusy: false, mine: null, mineBusy: false, runs: {}, toast: null, imgs: new Map(), pix: new Map() };
const GAME_VER = 'v78';
function netToast(key, c) { NET.toast = { txt: L(key), c: c || '#e8e1d3', t: 0 }; }
// the player is whoever DZMM says they are, and the board lives in the 'board' server function; outside DZMM nothing is online
const ONDZ = () => typeof PLAT !== 'undefined' && PLAT.dzmm;
// Every server-function call goes through one queue: one call at a time for this player, the most important first. The platform lets
// the whole game (all players together) run only 5 calls at once and each player 3, and turns the rest away with 'too_many_requests'
// before the function runs, so such a call is simply sent again after a pause (the server's retryAfterMs, else 1, 2, 4, 8, 16 s);
// reads give up after 8 tries (about a minute), uploads and posts after 4; then it fails like any other error.
const FN_PRI = { limitedSubmit: -1, submit: 0, add: 0, claim: 1, post: 1, board: 2, mine: 2, run: 2, clears: 2, older: 3, list: 3, status: 3, limitedStatus: 3, head: 4 }, FN_READ = new Set(['board', 'mine', 'run', 'clears', 'older', 'list', 'head', 'status', 'limitedStatus']);
const FNQ = { q: [], busy: false, hold: 0, fails: 0, n: 0, t: 0 };
function fnCall(name, action, body) {
  if (!ONDZ()) return Promise.reject(Object.assign(new Error('offline'), { code: 'offline' }));
  return new Promise((res, rej) => { FNQ.q.push({ name, body: Object.assign({ action }, body || {}), pri: FN_PRI[action] ?? 3, n: FNQ.n++, tries: 0, res, rej }); fnPump(); });
}
function fnPump() {
  if (FNQ.busy || !FNQ.q.length) return; const wait = FNQ.hold - Date.now();
  if (wait > 0) { clearTimeout(FNQ.t); FNQ.t = setTimeout(fnPump, wait); return; }
  FNQ.q.sort((a, b) => a.pri - b.pri || a.n - b.n); const j = FNQ.q.shift(); FNQ.busy = true;
  Promise.resolve().then(() => dzmm.fn.invoke(j.name, j.body)).then(r => { FNQ.fails = 0; j.res(r); }, e => {
    if (e && (e.code === 'too_many_requests' || e.code === 'runtime_busy')) {
      FNQ.fails++; const ms = e.retryAfterMs > 0 ? e.retryAfterMs : 1000 * 2 ** Math.min(FNQ.fails - 1, 4);
      FNQ.hold = Date.now() + Math.min(30e3, ms) * (.8 + Math.random() * .4); // spread out so players do not all come back at once
      if (++j.tries < (FN_READ.has(j.body.action) ? 8 : 4)) { FNQ.q.push(j); return; }
    }
    j.rej(e); }).finally(() => { FNQ.busy = false; fnPump(); });
}
const boardFn = (action, body) => fnCall('board', action, body);
function netInit() {
  const u = ONDZ() && PLAT.user; NET.user = u && u.id ? { uid: u.id, name: u.name || '', username: u.name || '', avatar: u.avatarUrl || '', plat: true } : null;
  NET.canLogin = false; NET.off = !ONDZ() || PLAT.caps.fn === false; NET.ready = true; if (NET.user && !NET.off) setTimeout(flushPending, 1500);
}
// guests are told how to get an identity (sign in to DZMM); there is no logging in or out inside the game
function netLogin() { netToast(ONDZ() ? 'lg_guest2' : 'g_dz', '#8e877b'); }
function loadBoard(force, mode) {
  const k = mode === 'e' ? 'eboard' : mode === 'i' ? 'iboard' : mode === 'ie' ? 'ieboard' : 'board', busy = k + 'Busy', at = k + 'At';
  if (NET[busy] || (!force && NET[k] && Date.now() - NET[at] < 15000)) return; NET[busy] = true;
  boardFn('board', { mode: ['e', 'i', 'ie'].includes(mode) ? mode : '' }).then(j => { NET[k] = j && Array.isArray(j.top) ? j : { err: true, top: [] }; NET[at] = Date.now(); }).catch(e => { if (!NET[k]) NET[k] = { err: true, top: [] }; }).finally(() => { NET[busy] = false; });
}
// how many runs have cleared each threat level on DZMM (shown on the sortie column); outside DZMM a fixed sample stands in
const CLEARS_SAMPLE = { easy: 1286, classic: 3412, hard: 958, nightmare: 207, despair: 12 }, ICLEARS_SAMPLE = { easy: 842, classic: 1907, hard: 511, nightmare: 96, despair: 7 };
function loadClears(force) {
  if (!ONDZ()) { NET.clears = CLEARS_SAMPLE; NET.iclears = ICLEARS_SAMPLE; return; } if (NET.clearsBusy || (!force && NET.clears && Date.now() - (NET.clearsAt || 0) < 60e3)) return; NET.clearsBusy = true;
  boardFn('clears').then(j => { if (j && j.clears) { NET.clears = j.clears; NET.iclears = j.iclears || NET.iclears; NET.clearsAt = Date.now(); } }).catch(() => { }).finally(() => { NET.clearsBusy = false; });
}
function loadMine(force) {
  if (!NET.user || NET.mineBusy || (!force && NET.mine)) return; NET.mineBusy = true;
  boardFn('mine').then(j => { NET.mine = j.runs || []; }).catch(() => { NET.mine = NET.mine || { err: true }; }).finally(() => { NET.mineBusy = false; });
}
function loadRun(id) { const c = NET.runs[id]; if (c) return c; NET.runs[id] = { busy: true }; boardFn('run', { id }).then(j => { NET.runs[id] = j && j.run ? j.run : { err: true }; }).catch(() => { NET.runs[id] = { err: true }; }); return NET.runs[id]; }

// ---- avatars: loaded once, then resampled into tiny pixel portraits that sit on the game's pixel grid ----
function avatarPix(u, n) {
  if (!u || !u.avatar) return null; const key = u.avatar + '|' + n; if (NET.pix.has(key)) return NET.pix.get(key);
  let im = NET.imgs.get(u.avatar);
  if (!im) { im = new Image(); im.decoding = 'async'; im.src = u.avatar; im.onerror = () => { im.bad = true; }; NET.imgs.set(u.avatar, im); }
  if (!im.complete || im.bad || !im.naturalWidth) return null;
  const c = document.createElement('canvas'); c.width = c.height = n * US; const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  const s = document.createElement('canvas'); s.width = s.height = n; const sx = s.getContext('2d'); sx.imageSmoothingEnabled = true; sx.imageSmoothingQuality = 'high'; sx.drawImage(im, 0, 0, n, n);
  x.imageSmoothingEnabled = false; x.drawImage(s, 0, 0, n * US, n * US); NET.pix.set(key, c); return c;
}
// framed portrait: falls back to a lettered tile while the picture loads
function drawAvatar(u, x, y, n, edge) {
  x = Math.round(x); y = Math.round(y); rect(x - 1, y - 1, n + 2, n + 2, edge || '#3c3732');
  const pc = avatarPix(u, n);
  if (pc) ctx.drawImage(pc, x, y, n, n);
  else { rect(x, y, n, n, '#1d1a17'); const ch = ((u && (u.username || u.name)) || '?')[0].toUpperCase(); text(ch, x + n / 2, y + n / 2 - 3, '#8e877b', 1, 'center'); }
  rect(x - 1, y - 1, 1, 1, col(0)); rect(x + n, y - 1, 1, 1, col(0)); rect(x - 1, y + n, 1, 1, col(0)); rect(x + n, y + n, 1, 1, col(0)); // clipped corners
}

// ---- score: kills, speed, few hits and many synergies all raise it (keep in sync with server/ach-api.mjs) ----
const DIFF_MUL = { easy: .5, classic: 1, hard: 1.5, nightmare: 2, despair: 2.6 };
// endless runs: the clear bonus, plus 6000 for every endless floor reached, plus kills and synergies (no time or hit bonus)
const ENDLESS_DEPTH = 6000;
function runScore(r) {
  if (r.endless) { const clearB = 10000, depthB = (r.depth | 0) * ENDLESS_DEPTH, killB = r.kills * 20, synB = r.syn * 1500, mul = (DIFF_MUL[r.diff] || 1) * (r.assist ? .85 : 1);
    return { total: Math.round((clearB + depthB + killB + synB) * mul), parts: { clear: clearB, depth: depthB, kills: killB, syn: synB }, mul }; }
  const win = r.win !== false, killB = r.kills * 20, synB = r.syn * 1500;
  const clearB = win ? 10000 : (r.floor || 0) * 1500, timeB = win ? Math.round(30000 * 900 / (900 + r.runT)) : 0, hitB = win ? Math.round(20000 / (1 + .15 * r.hits)) : 0;
  const mul = (DIFF_MUL[r.diff] || 1) * (r.assist ? .85 : 1);
  return { total: Math.round((clearB + killB + synB + timeB + hitB) * mul), parts: { clear: clearB, kills: killB, syn: synB, time: timeB, hits: hitB }, mul };
}
// a snapshot of the finished run: the end screen, the upload and the leaderboard detail all read this shape
function buildResult(win) {
  const p = G.p, synIds = Object.keys(SYN).filter(k => SYN[k]);
  const r = { win, rid: G.rid || ('r' + Date.now().toString(36)), diff: G.diff || 'classic', floor: G.floor, runT: Math.round(G.runT * 10) / 10, kills: G.kills | 0, hits: G.hits | 0, comboMax: G.comboMax | 0,
    syn: synIds.length, synIds, weapons: p.weapons.slice(), wlv: Object.assign({}, p.wlv), shards: Object.assign({}, p.shards), skill: p.skill || null, maxHp: p.maxHp, hp: Math.max(0, p.hp), ink: G.ink | 0, curses: (G.curses || []).slice(), assist: !!G.assisted, ver: GAME_VER, at: Date.now(), endless: !!G.endless, depth: G.endless | 0 };
  const s = runScore(r); r.score = s.total; r.parts = s.parts; r.mul = s.mul; return r;
}
// ---- uploads: only cleared runs count. A run is queued before it is sent and leaves the queue only when the server has recorded it
// or says it can never be accepted ({ ok: false, reject }); anything else (network, platform, "not now") stays queued and is retried ----
const PEND_KEY = 'achroma_pending', PEND_RETRY = 60e3;
function pendGet() { try { const a = JSON.parse(STORE.getItem(PEND_KEY) || '[]'); return Array.isArray(a) ? a.filter(r => r && typeof r === 'object' && typeof r.rid === 'string' && r.rid) : []; } catch (e) { return []; } }
function pendSet(a) { try { STORE.setItem(PEND_KEY, JSON.stringify(a)); } catch (e) { } }
const pendAdd = run => { const a = pendGet(); if (!a.some(x => x.rid === run.rid)) { a.push(run); pendSet(a); } };
const pendDrop = rid => pendSet(pendGet().filter(x => x.rid !== rid));
function submitResult(r) {
  r.up = { st: 'up' };
  if (window.BOSS_TEST && BOSS_TEST.on) { r.up = { st: 'test' }; return; }
  if (!r.win && !r.endless && r.mode !== 'invade') { r.up = { st: 'none' }; return; }
  const run = stripResult(r); pendAdd(run);
  if (NET.off || !NET.user) { r.up = { st: NET.off ? 'off' : 'login' }; return; }
  boardFn('submit', { run, avatar: NET.user.avatar })
    .then(j => { if (!j || j.ok !== true) { if (j && j.reject) { pendDrop(run.rid); r.up = { st: 'err' }; } else { r.up = { st: j && j.retry === 'login' ? 'login' : 'err' }; pendLater(); } return; }
      pendDrop(run.rid); r.up = { st: 'ok', rank: j.rank || '100+', best: j.best, newBest: !!j.newBest, id: j.id }; NET.board = null; NET.eboard = null; NET.iboard = null; NET.ieboard = null; NET.mine = null; })
    .catch(() => { r.up = { st: 'err' }; pendLater(); });
}
function stripResult(r) { const o = {}; for (const k of ['rid', 'diff', 'runT', 'kills', 'hits', 'comboMax', 'synIds', 'weapons', 'wlv', 'shards', 'skill', 'maxHp', 'hp', 'ink', 'curses', 'assist', 'ver', 'endless', 'depth']) o[k] = r[k]; return o; }
function pendLater() { clearTimeout(NET.pendT); NET.pendT = setTimeout(flushPending, PEND_RETRY); }
// one queued run at a time; a temporary failure pauses the queue for a minute
function flushPending() {
  if (!NET.user || NET.off || NET.flushing) return; const a = pendGet(); if (!a.length) return; const next = a[0]; NET.flushing = true;
  boardFn('submit', { run: next, avatar: NET.user.avatar })
    .then(j => { if (!j || (j.ok !== true && !j.reject)) { pendLater(); return; }
      pendDrop(next.rid); if (j.ok === true) { netToast('lg_flushed', C.gold); NET.board = null; NET.eboard = null; NET.iboard = null; NET.ieboard = null; NET.mine = null; } setTimeout(flushPending, 400); })
    .catch(() => pendLater()).finally(() => { NET.flushing = false; });
}
function fmtTime(s) { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = ('0' + (s % 60)).slice(-2); return h ? h + ':' + ('0' + m).slice(-2) + ':' + ss : m + ':' + ss; }
function fmtDate(ms) { const d = new Date(ms), z = n => ('0' + n).slice(-2); return d.getFullYear() + '.' + z(d.getMonth() + 1) + '.' + z(d.getDate()) + ' ' + z(d.getHours()) + ':' + z(d.getMinutes()); }
const fmtNum = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
