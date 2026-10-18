// ===== TSW hud — live 可视化测评 (visual telemetry) ==========================
// Wraps the game's own damage/kill/ink entry points (they are global function
// declarations, so we can decorate them without touching any file) and draws a
// telemetry overlay next to the game: DPS, kills/min, ink/min, HP/armor,
// weapons+serums, endless depth, speed multiplier, plus rolling charts.
'use strict';
(function () {
  const TSW = window.__TSW; if (!TSW || TSW.hud) return;

  // ---------------- metrics collector ----------------
  const M = TSW.metrics = {
    dmgTotal: 0, dmgBoss: 0, kills: 0, bossKills: 0, ink: 0, hitsTaken: 0, deaths: 0,
    dmgWindow: [],            // {t: gameRunT, d: dmg} for rolling DPS
    series: [],               // 1 Hz samples of the run
    runStart: 0, runStartReal: 0,
    reset() { this.dmgTotal = this.dmgBoss = this.kills = this.bossKills = this.ink = this.hitsTaken = this.deaths = 0; this.dmgWindow.length = 0; this.series.length = 0; this.runStart = null; },
    dps(sec = 3) {
      if (!this.dmgWindow.length) return 0;
      const G = window.__achroma && __achroma.G; const t = G ? G.runT : 0;
      let s = 0; for (let i = this.dmgWindow.length - 1; i >= 0; i--) { if (t - this.dmgWindow[i].t > sec) break; s += this.dmgWindow[i].d; }
      return s / sec;
    },
  };

  TSW.whenGame().then(() => {
    // decorate the global hit pipeline (game calls these by name every time)
    const wrap = (obj, name, before, after) => {
      const orig = obj[name]; if (typeof orig !== 'function') return;
      obj[name] = function (...a) { if (before) before(a); const r = orig.apply(this, a); if (after) after(r, a); return r; };
    };
    wrap(window, 'hitEnemy', ([e, dmg]) => { if (e && dmg > 0) { M.dmgTotal += dmg; if (e.boss) M.dmgBoss += dmg; M.dmgWindow.push({ t: (__achroma.G ? __achroma.G.runT : 0), d: dmg }); if (M.dmgWindow.length > 4000) M.dmgWindow.splice(0, 1000); } });
    wrap(window, 'killEnemy', ([e]) => { if (e && !e.dead) { M.kills++; if (e.boss) { M.bossKills++; TSW.bus.emit('bossKill', e); } } });
    wrap(window, 'gainInk', (a, r) => { M.ink += r || 0; });
    wrap(window, 'hurtPlayer', (a, r) => { if (r === true) M.hitsTaken++; });
    // deaths & new runs
    TSW.bus.on('tick', (G) => { if (G.state === 'dead' && !M._dead) { M._dead = true; M.deaths++; TSW.bus.emit('death', G); } if (G.state !== 'dead' && M._dead) M._dead = false; if (G.state === 'play' && M.runStart === null) { M.runStart = G.runT; M.runStartReal = performance.now(); } });
    TSW.log('metrics wired (hitEnemy/killEnemy/gainInk/hurtPlayer decorated)');
  });

  // 1 Hz sampler on the virtual clock (runs even when speed-warping)
  TSW.hooks.beforeTick(() => {
    const G = window.__achroma && __achroma.G; if (!G || !G.p) return;
    const sec = Math.floor(G.runT);
    if (sec === M._lastSec) return; M._lastSec = sec;
    const p = G.p;
    M.series.push({
      t: G.runT, floor: G.floor, depth: G.endless || 0, kills: G.kills, ink: G.ink,
      hp: p.hp, maxHp: p.maxHp, armor: p.armor, dps: +M.dps(5).toFixed(1),
      state: G.state, enemies: G.enemies ? G.enemies.filter((e) => !e.dead).length : 0,
    });
    if (M.series.length > 7200) M.series.splice(0, 1800);
    TSW.bus.emit('tick', G);
  });
  TSW.bus.on('newRun', () => M.reset());

  // ---------------- overlay ----------------
  const cv = document.createElement('canvas');
  cv.id = 'tsw-hud'; cv.width = 300; cv.height = 210;
  cv.style.cssText = 'position:fixed;top:6px;right:6px;z-index:40;pointer-events:auto;cursor:default;opacity:.92;image-rendering:auto;border-radius:6px;box-shadow:0 0 12px rgba(0,0,0,.6)';
  document.body.appendChild(cv);
  const cx = cv.getContext('2d');

  const PAL = { bg: 'rgba(8,8,10,.82)', line: '#2d2925', text: '#e8e1d3', dim: '#8e877b', gold: '#efb94a', red: '#e0483e', cyan: '#5ed0c8', green: '#8ed872', violet: '#a07ad8' };
  const f = (s) => Math.round(s) + 'px ui-monospace,Menlo,Consolas,"Microsoft YaHei",monospace';

  function spark(x, y, w, h, vals, color, fillTo) {
    if (vals.length < 2) return;
    let lo = Math.min(...vals), hi = Math.max(...vals); if (hi - lo < 1e-6) hi = lo + 1;
    cx.beginPath();
    vals.forEach((v, i) => { const px = x + (i / (vals.length - 1)) * w, py = y + h - ((v - lo) / (hi - lo)) * h; i ? cx.lineTo(px, py) : cx.moveTo(px, py); });
    cx.strokeStyle = color; cx.lineWidth = 1.25; cx.stroke();
    if (fillTo) { cx.lineTo(x + w, y + h); cx.lineTo(x, y + h); cx.closePath(); cx.fillStyle = color; cx.globalAlpha = .13; cx.fill(); cx.globalAlpha = 1; }
  }

  let visible = TSW.settings.get('hudVisible', true);
  TSW.hud = {
    get visible() { return visible; },
    toggle(v) { visible = v === undefined ? !visible : !!v; cv.style.display = visible ? '' : 'none'; TSW.settings.set('hudVisible', visible); TSW.bus.emit('hud', visible); },
  };
  if (!visible) cv.style.display = 'none';

  // ✕ hotspot in the top-right corner: click hides the HUD (event stays local)
  const XBOX = 16;
  const inX = (e) => { const r = cv.getBoundingClientRect(); return e.clientX > r.right - XBOX && e.clientY < r.top + XBOX; };
  cv.addEventListener('mousemove', (e) => { cv.style.cursor = inX(e) ? 'pointer' : 'default'; });
  cv.addEventListener('click', (e) => { if (inX(e)) { e.stopPropagation(); TSW.hud.toggle(false); } }, true);

  function draw() {
    cx.clearRect(0, 0, cv.width, cv.height);
    const G = window.__achroma && __achroma.G;
    cx.fillStyle = PAL.bg; cx.strokeStyle = PAL.line;
    cx.beginPath(); cx.roundRect(0, 0, cv.width, cv.height, 6); cx.fill(); cx.stroke();
    cx.textBaseline = 'top';
    let y = 6; const L = (txt, c = PAL.text, bold) => { cx.font = f(bold ? 11 : 10); cx.fillStyle = c; cx.fillText(txt, 7, y); y += bold ? 14 : 13; };
    if (!G || !G.p) { L(window.__achroma ? 'TSW · 主菜单（进局后显示数据）' : 'TSW · 等待游戏启动…', PAL.dim); requestAnimationFrame(draw); return; }
    const runT = G.runT || 0, kpm = runT > 5 ? M.kills / (runT / 60) : 0, ipm = runT > 5 ? M.ink / (runT / 60) : 0;
    const depth = G.endless || 0;
    L(`TSW 测评 · ${depth ? `无尽 depth ${depth}` : `第 ${G.floor + 1} 章`}`, PAL.gold, true);
    L(`时间 ${runT.toFixed(0)}s · 击杀 ${M.kills} · 受击 ${M.hitsTaken}${M.deaths ? ' · 死亡 ' + M.deaths : ''}`, PAL.dim);
    L(`DPS(3s) ${M.dps(3).toFixed(1)}  累计伤害 ${(M.dmgTotal / 1000).toFixed(1)}k`, PAL.red);
    L(`击杀/分 ${kpm.toFixed(1)} · 墨水/分 ${ipm.toFixed(0)} · 墨水 ${G.ink | 0}`, PAL.green);
    L(`HP ${G.p.hp | 0}/${G.p.maxHp} · 甲 ${G.p.armor | 0}/${G.p.maxArmor} · 敌 ${G.enemies.filter((e) => !e.dead).length}`, PAL.cyan);
    if (G.boss && !G.boss.dead) {
      const k = Math.max(0, G.boss.hp / G.boss.maxHp);
      L(`BOSS ${(k * 100).toFixed(0)}%`, PAL.red, true);
      cx.fillStyle = '#3a0a0e'; cx.fillRect(7, y, cv.width - 14, 4);
      cx.fillStyle = PAL.red; cx.fillRect(7, y, (cv.width - 14) * k, 4); y += 8;
    }
    // charts: dps + kills rate over the last 90 s
    const s = M.series.filter((r) => runT - r.t <= 90);
    if (s.length > 1) {
      const chY = y + 2, chH = 52, w = cv.width - 14;
      cx.fillStyle = 'rgba(255,255,255,.03)'; cx.fillRect(7, chY, w, chH);
      spark(7, chY, w, chH, s.map((r) => r.dps), PAL.red, true);
      spark(7, chY, w, chH, s.map((r) => r.kills), PAL.gold);
      cx.font = f(9); cx.fillStyle = PAL.dim; cx.fillText('红: DPS  金: 击杀累计  (近90s)', 7, chY + chH + 2); y = chY + chH + 14;
    }
    // status line: speed / autopilot / macro / perf
    const st = [];
    if (TSW.speed.get() !== 1) st.push(`×${TSW.speed.get()}`);
    if (TSW.auto && TSW.auto.mode !== 'off') st.push('AUTO·' + TSW.auto.mode);
    if (TSW.macro && TSW.macro.playing) st.push('宏·回放');
    if (TSW.macro && TSW.macro.recording) st.push('宏·REC');
    if (TSW.perf.active) st.push('PERF');
    if (TSW.rng.on) st.push('SEED');
    L(st.length ? st.join('  ') : '×1 手动', st.length ? PAL.violet : PAL.dim, true);
    // ✕ (hide) in the corner
    cx.strokeStyle = '#6e675c'; cx.lineWidth = 1;
    cx.beginPath(); cx.moveTo(cv.width - 12, 7); cx.lineTo(cv.width - 6, 13);
    cx.moveTo(cv.width - 6, 7); cx.lineTo(cv.width - 12, 13); cx.stroke();
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  // toast for speed changes
  let toast = null;
  TSW.bus.on('speed', (v) => { toast = { txt: `游戏速度 ×${v}`, t: performance.now() }; });
  setInterval(() => { if (toast && performance.now() - toast.t > 1200) toast = null; }, 200);
})();
