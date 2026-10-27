// ===== TSW core — [TheSeed] Workshop kernel =================================
// Runs BEFORE the game boots (see index.html).  Provides, without touching a
// single upstream byte:
//   * TSW.speed  — game-speed warp by re-pacing requestAnimationFrame: the
//                  game receives virtual timestamps that advance N× faster.
//                  0.25× … 16×, hotkeys  - / = , shown in the HUD.
//   * TSW.rng    — optional seeded Math.random for reproducible benchmarks.
//   * TSW.perf   — performance mode (fewer particles/FX, no fps cap): visual
//                  settings only, never gameplay.
//   * TSW.hooks  — beforeTick(fn) runs just before every simulated frame;
//                  this is where the autopilot steers the player.
//   * TSW.whenGame(cb) — resolve once window.__achroma (the game's own debug
//                  export) and all game globals exist.
//   * TSW.settings / TSW.bus / TSW.log — plumbing shared by the other tools.
'use strict';
(function () {
  if (window.__TSW) return;
  const TSW = window.__TSW = { version: '1.0' };

  // ---------- tiny bus + settings ----------
  const listeners = {};
  TSW.bus = {
    on(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); return () => { const a = listeners[ev]; const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); }; },
    emit(ev, data) { (listeners[ev] || []).slice().forEach((fn) => { try { fn(data); } catch (e) { console.error('[tsw] bus', ev, e); } }); },
  };
  const SETTINGS_KEY = 'theseed.tools.settings';
  let settings = {};
  try { settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch (e) { }
  TSW.settings = {
    get(k, dflt) { return settings[k] !== undefined ? settings[k] : dflt; },
    set(k, v) { settings[k] = v; try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { } TSW.bus.emit('settings', settings); },
    all() { return settings; },
  };
  TSW.log = (...a) => console.info('%c[TSW]', 'color:#efb94a', ...a);
  TSW.err = (...a) => console.warn('%c[TSW]', 'color:#e0483e', ...a);

  // ---------- requestAnimationFrame time warp ----------
  const realRAF = window.requestAnimationFrame.bind(window);
  const realCAF = window.cancelAnimationFrame.bind(window);
  const VIRT_DT = 1000 / 60;           // each simulated frame is one 60 Hz tick
  const MAX_STEPS = 40;                // hard ceiling per real frame (32× @30Hz)
  let speed = +TSW.settings.get('speed', 1) || 1;
  let virt = (typeof performance !== 'undefined' ? performance.now() : 0);
  let lastReal = virt, acc = 0, pumping = false, rafId = 0, rafSeq = 0;
  const pending = new Map();           // handle -> callback

  TSW.clock = {
    get virtualNow() { return virt; },
    get speed() { return speed; },
    // game-seconds per real second actually delivered (diagnostic)
    ratio() { return speed; },
  };

  TSW.speed = {
    min: 0.25, max: 16,
    get() { return speed; },
    set(v, silent) {
      v = Math.min(this.max, Math.max(this.min, +v || 1));
      speed = Math.round(v * 100) / 100;
      acc = 0; // do not carry backlog across a speed change
      TSW.settings.set('speed', speed);
      if (!silent) TSW.bus.emit('speed', speed);
      return speed;
    },
    nudge(dir) { const steps = [0.25, 0.5, 1, 2, 3, 4, 6, 8, 12, 16]; let i = steps.findIndex((s) => s >= speed - 1e-9); i = Math.min(steps.length - 1, Math.max(0, (i < 0 ? 0 : i) + dir)); return this.set(steps[i]); },
  };

  function fireTick() {
    for (const fn of TSW.hooks._before) { try { fn(virt); } catch (e) { TSW.err('beforeTick', e); } }
    // rAF is one-shot: take a snapshot, remove each handle as it fires (the
    // game's frame() re-registers itself, which must NOT accumulate here)
    const cbs = [...pending.entries()];
    for (const [h, cb] of cbs) {
      pending.delete(h);
      try { cb(virt); } catch (e) { console.error('[tsw] raf cb', e); }
    }
  }

  function pump(realNow) {
    rafId = realRAF(pump);
    const dt = Math.min(250, Math.max(0, realNow - lastReal));
    lastReal = realNow;
    if (!pending.size) return;
    if (speed === 1) { virt += dt; fireTick(); return; }
    acc += dt * speed;
    let steps = 0;
    while (acc >= VIRT_DT && steps < MAX_STEPS) { acc -= VIRT_DT; virt += VIRT_DT; fireTick(); steps++; }
    if (steps >= MAX_STEPS) acc = 0; // machine can't keep up: drop backlog instead of spiralling
  }
  function ensurePump() { if (!pumping) { pumping = true; lastReal = performance.now(); rafId = realRAF(pump); } }

  window.requestAnimationFrame = (cb) => { ensurePump(); const h = ++rafSeq; pending.set(h, cb); return h; };
  window.cancelAnimationFrame = (h) => { pending.delete(h); realCAF(h); };

  // hotkeys:  - / =  step speed down/up   (workspace keys never reach the panel)
  window.addEventListener('keydown', (e) => {
    const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (e.code === 'Minus' || e.code === 'NumpadSubtract') TSW.speed.nudge(-1);
    else if (e.code === 'Equal' || e.code === 'NumpadAdd') TSW.speed.nudge(1);
    else if (e.code === 'F9') { e.preventDefault(); if (TSW.hud) TSW.hud.toggle(); }
    else if (e.code === 'F8') { e.preventDefault(); if (TSW.panel) TSW.panel.toggle(); }
  });

  // ---------- seeded RNG for reproducible benchmarks ----------
  let rngState = 0, rngOn = false;
  const nativeRandom = Math.random.bind(Math);
  const mulberry32 = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  TSW.rng = {
    seed(n) { rngState = (n >>> 0) || 1; rngOn = true; Math.random = mulberry32(rngState); TSW.bus.emit('rng', n); },
    clear() { rngOn = false; Math.random = nativeRandom; TSW.bus.emit('rng', null); },
    get on() { return rngOn; },
  };

  // ---------- performance mode (visuals only) ----------
  // NOTE: QS/SET are top-level `const` bindings in the game's classic scripts —
  // they are visible as bare identifiers (shared global lexical scope) but are
  // never window properties, so guard with typeof, not window.X.
  let perfSaved = null;
  TSW.perf = {
    get active() { return !!perfSaved; },
    enable() {
      if (perfSaved || typeof QS === 'undefined' || typeof SET === 'undefined') return false;
      perfSaved = { part: QS.part, fx: QS.fx, fps: QS.fps, shake: SET.shake, flash: SET.flash };
      QS.part = .15; QS.fx = false; QS.fps = 240; SET.shake = 0; SET.flash = 0;
      TSW.bus.emit('perf', true); return true;
    },
    disable() {
      if (!perfSaved || typeof QS === 'undefined') return false;
      QS.part = perfSaved.part; QS.fx = perfSaved.fx; QS.fps = perfSaved.fps; SET.shake = perfSaved.shake; SET.flash = perfSaved.flash;
      perfSaved = null; TSW.bus.emit('perf', false); return true;
    },
  };

  // ---------- game handshake ----------
  let gameReadyResolve; const gameReady = new Promise((r) => { gameReadyResolve = r; });
  TSW.whenGame = () => gameReady;
  (function poll() {
    // __achroma = { step, get G() } is the game's own debug export; `G` is a
    // top-level `let` in game.js so it never becomes window.G — check the getter instead.
    if (window.__achroma && typeof window.__achroma.step === 'function') { gameReadyResolve(window.__achroma); TSW.bus.emit('game'); return; }
    setTimeout(poll, 50);
  })();

  // ---------- beforeTick hooks ----------
  TSW.hooks = {
    _before: [],
    beforeTick(fn) { this._before.push(fn); return () => { const i = this._before.indexOf(fn); if (i >= 0) this._before.splice(i, 1); }; },
  };

  TSW.info = () => ({ version: TSW.version, speed: TSW.speed.get(), rng: TSW.rng.on, perf: TSW.perf.active, game: !!window.__achroma });
  TSW.log('core ready', TSW.info());
})();
