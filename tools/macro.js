// ===== TSW macro — 操作宏 (record / replay / loop) ===========================
// Records real input (keyboard, mouse, wheel) against the VIRTUAL game clock,
// so a macro replays identically at any speed (×0.25 … ×16).  Playback re-
// dispatches genuine DOM events through the game's own listeners — menus,
// hover states and everything else behave exactly as if you did it.
//
//   TSW.macro.record() / stop() / play(nameOrEvents, {loop, times}) / stopPlay()
//   TSW.macro.save(name) / list() / remove(name) / export(name) / import(json)
'use strict';
(function () {
  const TSW = window.__TSW; if (!TSW || TSW.macro) return;
  const STORE_KEY = 'theseed.tools.macros.v1';
  const GAME_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'Space', 'ShiftLeft', 'KeyX', 'KeyR', 'KeyE', 'KeyC', 'KeyT', 'Tab', 'Escape', 'Enter',
    'ArrowUp', 'Digit1', 'Digit2', 'Digit3', 'Backquote', 'KeyQ', 'KeyF']);

  const view = () => document.getElementById('c');
  const toGame = (e) => { const r = view().getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * (window.W || 480), y: (e.clientY - r.top) / r.height * (window.H || 270) }; };
  const toClient = (x, y) => { const r = view().getBoundingClientRect(); return { cx: r.left + (x / (window.W || 480)) * r.width, cy: r.top + (y / (window.H || 270)) * r.height }; };

  let rec = null;            // {events, t0}
  let play = null;           // {events, i, loop, times, left, gap, gapUntil, onDone, name}
  const macros = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch (e) { return []; } };
  const setMacros = (a) => localStorage.setItem(STORE_KEY, JSON.stringify(a.slice(0, 40)));

  const inPanel = (e) => e.target && e.target.closest && e.target.closest('#tsw-panel,#tsw-hud');

  // ---------------- recording ----------------
  window.addEventListener('keydown', (e) => { if (!rec || inPanel(e)) return; if (e.repeat) return; rec.events.push({ t: TSW.clock.virtualNow - rec.t0, k: 'kd', c: e.code }); });
  window.addEventListener('keyup', (e) => { if (!rec || inPanel(e)) return; rec.events.push({ t: TSW.clock.virtualNow - rec.t0, k: 'ku', c: e.code }); }, true);
  window.addEventListener('mousedown', (e) => { if (!rec || inPanel(e)) return; const p = toGame(e); rec.events.push({ t: TSW.clock.virtualNow - rec.t0, k: 'md', b: e.button, x: +p.x.toFixed(1), y: +p.y.toFixed(1) }); }, true);
  window.addEventListener('mouseup', (e) => { if (!rec || inPanel(e)) return; const p = toGame(e); rec.events.push({ t: TSW.clock.virtualNow - rec.t0, k: 'mu', b: e.button, x: +p.x.toFixed(1), y: +p.y.toFixed(1) }); }, true);
  let lastMM = { t: 0, x: -9, y: -9 };
  window.addEventListener('mousemove', (e) => {
    if (!rec || inPanel(e)) return;
    const now = TSW.clock.virtualNow, p = toGame(e);
    if (now - lastMM.t < 24 && Math.hypot(p.x - lastMM.x, p.y - lastMM.y) < 2) return;
    lastMM = { t: now, x: p.x, y: p.y };
    rec.events.push({ t: now - rec.t0, k: 'mm', x: +p.x.toFixed(1), y: +p.y.toFixed(1) });
  }, true);
  window.addEventListener('wheel', (e) => { if (!rec || inPanel(e)) return; rec.events.push({ t: TSW.clock.virtualNow - rec.t0, k: 'wh', d: Math.sign(e.deltaY) }); }, true);

  // ---------------- dispatch ----------------
  const dispatch = (ev) => {
    const v = view(); if (!v) return;
    try {
      if (ev.k === 'kd' || ev.k === 'ku') window.dispatchEvent(new KeyboardEvent(ev.k === 'kd' ? 'keydown' : 'keyup', { code: ev.c, key: ev.c, bubbles: true, cancelable: true }));
      else if (ev.k === 'md' || ev.k === 'mu') { const c = toClient(ev.x, ev.y); window.dispatchEvent(new MouseEvent(ev.k === 'md' ? 'mousedown' : 'mouseup', { button: ev.b, buttons: ev.k === 'md' ? (ev.b === 2 ? 2 : 1) : 0, clientX: c.cx, clientY: c.cy, bubbles: true, cancelable: true })); }
      else if (ev.k === 'mm') { const c = toClient(ev.x, ev.y); window.dispatchEvent(new MouseEvent('mousemove', { clientX: c.cx, clientY: c.cy, bubbles: true })); }
      else if (ev.k === 'wh') window.dispatchEvent(new WheelEvent('wheel', { deltaY: ev.d * 100, bubbles: true, cancelable: true }));
    } catch (e) { TSW.err('macro dispatch', e); }
  };

  TSW.hooks.beforeTick(() => {
    if (!play) return;
    const now = TSW.clock.virtualNow;
    if (play.gapUntil) { if (now < play.gapUntil) return; play.gapUntil = 0; play.i = 0; play.t0 = now; if (play.left !== Infinity) { play.left--; if (play.left <= 0) return stopPlay(true); } }
    while (play.i < play.events.length && play.events[play.i].t + play.t0 <= now) dispatch(play.events[play.i++]);
    if (play.i >= play.events.length) {
      if (play.loop || play.left > 1) play.gapUntil = now + (play.gap || 300);
      else stopPlay(true);
    }
  });

  function stopPlay(done) {
    const p = play; play = null;
    // release anything a half-finished loop may have left down
    window.dispatchEvent(new MouseEvent('mouseup', { button: 0, bubbles: true }));
    if (p && p.onDone) try { p.onDone(done !== false && !p.stopped); } catch (e) { TSW.err(e); }
    TSW.bus.emit('macroPlay', null);
  }

  TSW.macro = {
    get recording() { return !!rec; },
    get playing() { return !!play; },
    get playName() { return play && play.name; },
    record() { this.stopPlay(); rec = { events: [], t0: TSW.clock.virtualNow }; TSW.bus.emit('macroRec', true); TSW.log('macro REC…'); },
    stop() { if (!rec) return null; const r = rec; rec = null; r.events.push({ t: TSW.clock.virtualNow - r.t0, k: 'ku', c: '___flush' }); r.len = r.t0 ? (TSW.clock.virtualNow - r.t0) : 0; TSW.bus.emit('macroRec', false); TSW.log('macro stop:', r.events.length, 'events,', (r.len / 1000).toFixed(1), 's'); return r.events; },
    play(nameOrEvents, { loop = false, times = 1, gap = 300, onDone } = {}) {
      if (play) this.stopPlay();
      let events, name = null;
      if (typeof nameOrEvents === 'string') { const m = macros().find((q) => q.name === nameOrEvents); if (!m) { TSW.err('macro not found:', nameOrEvents); return false; } events = m.events; name = nameOrEvents; }
      else events = nameOrEvents;
      if (!events || !events.length) return false;
      play = { events: events.filter((e) => e.k !== 'ku' || e.c !== '___flush'), i: 0, t0: TSW.clock.virtualNow, loop, left: times, gap, gapUntil: 0, onDone, name };
      TSW.bus.emit('macroPlay', name || 'inline'); TSW.log('macro play', name || `(${events.length} events)`, loop ? '∞' : '×' + times);
      return true;
    },
    stopPlay() { if (play) { play.stopped = true; stopPlay(false); } },
    list() { return macros(); },
    save(name, events) { if (!events) { if (!rec) return false; events = this.stop(); } const a = macros().filter((q) => q.name !== name); a.push({ name, events, len: events.length ? events[events.length - 1].t : 0, at: Date.now() }); setMacros(a); TSW.bus.emit('macros'); return true; },
    remove(name) { setMacros(macros().filter((q) => q.name !== name)); TSW.bus.emit('macros'); },
    export(name) { const m = macros().find((q) => q.name === name); return m ? JSON.stringify(m) : null; },
    import(json) { const m = JSON.parse(json); if (!m || !m.name || !Array.isArray(m.events)) throw new Error('bad macro json'); const a = macros().filter((q) => q.name !== m.name); a.push(m); setMacros(a); TSW.bus.emit('macros'); return m.name; },
    // built-in: hold-attack dummy macro (benchmark "宏+倍速": hold LMB, tiny aim circles)
    presetHoldAttack(seconds = 30) {
      const ev = [{ t: 0, k: 'md', b: 0, x: (window.W || 480) / 2, y: (window.H || 270) / 2 }];
      for (let t = 200; t < seconds * 1000; t += 200) { const a = t / 400; ev.push({ t, k: 'mm', x: (window.W || 480) / 2 + Math.cos(a) * 40, y: (window.H || 270) / 2 + Math.sin(a) * 26 }); }
      ev.push({ t: seconds * 1000, k: 'mu', b: 0, x: (window.W || 480) / 2, y: (window.H || 270) / 2 });
      return ev;
    },
  };
  TSW.log('macro module ready');
})();
