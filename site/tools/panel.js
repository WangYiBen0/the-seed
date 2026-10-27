// ===== TSW panel — the workshop control panel ================================
// A DOM side-panel (never touches the game's scripts; input events that hit the
// panel are stopped from reaching the game's window listeners).  Tabs:
//   状态 / 宏 / 挂机 / 测评 / 基准 / 存档 / 关于
// Also implements the headless autotest protocol (?autotest=...) used by
// scripts/headless-bench.mjs to produce TSW_RESULT lines in the console.
'use strict';
(function () {
  const TSW = window.__TSW; if (!TSW || TSW.panel) return;

  // ---------------- panel skeleton ----------------
  const root = document.createElement('div');
  root.id = 'tsw-panel';
  root.style.cssText = [
    'position:fixed', 'left:8px', 'top:8px', 'z-index:60', 'width:252px',
    'background:rgba(10,9,8,.94)', 'border:1px solid #36322d', 'border-radius:8px',
    'color:#e8e1d3', 'font:11px/1.5 ui-monospace,Menlo,Consolas,"Microsoft YaHei",monospace',
    'box-shadow:0 4px 18px rgba(0,0,0,.55)', 'user-select:none', '-webkit-user-select:none', 'cursor:default',
  ].join(';');
  document.body.appendChild(root);
  const stop = (e) => { e.stopPropagation(); };
  for (const ev of ['keydown', 'keyup', 'mousedown', 'mouseup', 'mousemove', 'click', 'wheel', 'contextmenu', 'pointerdown', 'pointerup', 'touchstart', 'touchend']) root.addEventListener(ev, stop, true);

  let collapsed = TSW.settings.get('panelCollapsed', false);
  const head = document.createElement('div');
  head.style.cssText = 'display:flex;align-items:center;gap:6px;padding:6px 8px;border-bottom:1px solid #2d2925;cursor:default';
  root.appendChild(head);
  const title = document.createElement('span'); title.textContent = '⚙ [TheSeed] 工坊'; title.style.cssText = 'flex:1;color:#efb94a'; head.appendChild(title);
  const colBtn = document.createElement('button'); colBtn.textContent = collapsed ? '▸' : '▾';
  colBtn.style.cssText = 'background:#151310;color:#efb94a;border:1px solid #36322d;border-radius:4px;width:22px;height:18px;cursor:pointer;font:11px monospace';
  head.appendChild(colBtn);
  const body = document.createElement('div'); root.appendChild(body);
  if (collapsed) body.style.display = 'none';
  colBtn.onclick = () => { collapsed = !collapsed; body.style.display = collapsed ? 'none' : ''; colBtn.textContent = collapsed ? '▸' : '▾'; TSW.settings.set('panelCollapsed', collapsed); };

  // ---------------- widgets ----------------
  const el = (tag, style, parent) => { const n = document.createElement(tag); if (style) n.style.cssText = style; (parent || body).appendChild(n); return n; };
  const section = (name) => { const s = el('div', 'padding:6px 8px;border-bottom:1px solid #221f1c'); const h = el('div', 'color:#8e877b;margin-bottom:3px;letter-spacing:.08em', s); h.textContent = name; return s; };
  const btn = (label, style) => { const b = el('button', 'background:#151310;color:#e8e1d3;border:1px solid #3c3732;border-radius:4px;padding:3px 8px;cursor:pointer;font:11px ui-monospace,monospace;margin:1px;' + (style || '')); b.onmouseenter = () => b.style.borderColor = '#efb94a'; b.onmouseleave = () => b.style.borderColor = '#3c3732'; b.textContent = label; return b; };
  const sel = (opts) => { const s = el('select', 'background:#151310;color:#e8e1d3;border:1px solid #3c3732;border-radius:4px;padding:2px;font:11px ui-monospace,monospace;width:100%'); opts.forEach(([v, l]) => { const o = document.createElement('option'); o.value = v; o.textContent = l; s.appendChild(o); }); return s; };
  const check = (label, get, set) => { const l = el('label', 'display:flex;align-items:center;gap:5px;margin:2px 0;cursor:pointer'); const c = document.createElement('input'); c.type = 'checkbox'; c.checked = get(); c.onchange = () => set(c.checked); c.style.accentColor = '#efb94a'; l.appendChild(c); l.appendChild(document.createTextNode(label)); return l; };
  const row = (s) => el('div', 'display:flex;gap:4px;flex-wrap:wrap;align-items:center', s);
  const status = el('div', 'padding:4px 8px;color:#8ed872;min-height:15px;border-bottom:1px solid #221f1c');

  // ---------------- 状态 ----------------
  const sState = section('状态 · SPEED');
  const speedVal = el('div', 'color:#a07ad8', sState);
  const r1 = row(sState);
  const bSlow = btn('−'); const bFast = btn('＋'); r1.append(bSlow, bFast);
  const b1 = btn('1×'), b2 = btn('2×'), b4 = btn('4×'), b8 = btn('8×'), b16 = btn('16×');
  row(sState).append(b1, b2, b4, b8, b16);
  const rPerf = row(sState);
  const cbHud = check('测评 HUD', () => TSW.hud.visible, (v) => TSW.hud.toggle(v));
  rPerf.append(cbHud);
  const rPerf2 = row(sState);
  const cbPerf = check('性能模式', () => TSW.perf.active, (v) => v ? TSW.perf.enable() : TSW.perf.disable());
  rPerf2.append(cbPerf);
  const seedRow = row(sState);
  const seedInp = el('input', 'background:#151310;color:#e8e1d3;border:1px solid #3c3732;border-radius:4px;padding:2px 4px;width:70px;font:11px monospace');
  seedInp.placeholder = 'seed'; seedRow.append(seedInp);
  const bSeed = btn('设定随机种子'); seedRow.append(bSeed);
  bSeed.onclick = () => { const v = parseInt(seedInp.value, 10); if (v) { TSW.rng.seed(v); note('RNG seed = ' + v + '（复现用，重开一局生效）'); } };
  const bSeedClear = btn('清除'); seedRow.append(bSeedClear);
  bSeedClear.onclick = () => { TSW.rng.clear(); note('RNG 恢复随机'); };
  const updSpeed = () => { speedVal.textContent = `速度 ×${TSW.speed.get()} （热键 - / ＝）`; };
  TSW.bus.on('speed', updSpeed); updSpeed();
  [b1, b2, b4, b8, b16].forEach((b) => { const v = +b.textContent.slice(0, -1); b.onclick = () => TSW.speed.set(v); });
  bSlow.onclick = () => TSW.speed.nudge(-1); bFast.onclick = () => TSW.speed.nudge(1);

  // ---------------- 宏 ----------------
  const sMacro = section('操作宏 · MACRO');
  const rM1 = row(sMacro);
  const bRec = btn('● 录制'); const bStop = btn('■ 停止'); const bSave = btn('保存…'); const bDemo = btn('演示宏(站桩30s)');
  rM1.append(bRec, bStop, bSave); row(sMacro).append(bDemo);
  const macroSel = sel([['', '— 选择已存宏 —']]);
  row(sMacro).append(macroSel);
  const rM2 = row(sMacro);
  const bPlay = btn('▶ 回放'); const bLoop = btn('↻ 循环'); const bDel = btn('删除'); const bExp = btn('导出'); const bImp = btn('导入');
  rM2.append(bPlay, bLoop, bDel); row(sMacro).append(bExp, bImp);
  let lastRec = null;
  bRec.onclick = () => { TSW.macro.record(); note('录制中… 再点“停止”结束'); };
  bStop.onclick = () => { if (TSW.macro.recording) { lastRec = TSW.macro.stop(); note(`已录制 ${lastRec.length} 个事件`); } else TSW.macro.stopPlay(); };
  bSave.onclick = () => { const ev = lastRec; if (!ev) return note('没有可保存的录制'); const name = prompt('宏名称：', 'macro-' + Date.now() % 10000); if (name) { TSW.macro.save(name, ev); refreshMacros(); note('已保存 ' + name); } };
  bDemo.onclick = () => { TSW.macro.play(TSW.macro.presetHoldAttack(30)); note('演示宏：按住攻击并绕圈瞄准 30s（虚拟时间）'); };
  bPlay.onclick = () => { const n = macroSel.value; if (!n) return note('先选择一个宏'); TSW.macro.play(n); note('回放 ' + n); };
  bLoop.onclick = () => { const n = macroSel.value; if (!n) return note('先选择一个宏'); TSW.macro.play(n, { loop: true }); note('循环回放 ' + n + '（点击 停止 结束）'); };
  bDel.onclick = () => { const n = macroSel.value; if (n) { TSW.macro.remove(n); refreshMacros(); note('已删除 ' + n); } };
  bExp.onclick = () => { const n = macroSel.value; if (!n) return; const j = TSW.macro.export(n); download(n + '.macro.json', j); };
  bImp.onclick = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json'; inp.onchange = async () => { try { const t = await inp.files[0].text(); const n = TSW.macro.import(t); refreshMacros(); note('导入宏 ' + n); } catch (e) { note('导入失败: ' + e.message); } }; inp.click(); };
  function refreshMacros() { macroSel.innerHTML = '<option value="">— 选择已存宏 —</option>' + TSW.macro.list().map((m) => `<option value="${m.name}">${m.name} (${(m.len / 1000).toFixed(1)}s)</option>`).join(''); }
  refreshMacros();

  // ---------------- 挂机 ----------------
  const sAuto = section('自动挂机 · AUTOPILOT');
  const modeSel = sel([['off', '关闭'], ['combat', '战斗模式（原地打怪）'], ['full', '全自动（探索/战斗/购物/无尽）']]);
  modeSel.value = TSW.auto.mode; modeSel.onchange = () => { TSW.auto.setMode(modeSel.value); }; row(sAuto).append(modeSel);
  const polSel = sel([['bloom', '流派: 坏死爆裂连锁 (bloom)'], ['offense', '流派: 极限输出 (offense)'], ['balanced', '流派: 均衡 (balanced)'], ['survival', '流派: 生存 (survival)'], ['crit', '流派: 暴击狙击 (crit)'], ['dot', '流派: 元素侵蚀 (dot)'], ['melee', '流派: 近战斩击 (melee)'], ['ally', '流派: 伙伴军团 (ally)'], ['ammo', '流派: 弹药工程 (ammo)'], ['phase', '流派: 虚体闪避 (phase)']]);
  polSel.value = TSW.auto.policy; polSel.onchange = () => TSW.auto.setPolicy(polSel.value); row(sAuto).append(polSel);
  const ao = TSW.auto.opts;
  row(sAuto).append(
    check('自动选血清', () => ao.autoCards, (v) => ao.autoCards = v),
    check('死亡自动重开', () => ao.autoRestart, (v) => ao.autoRestart = v));
  row(sAuto).append(
    check('优先无尽传送门', () => ao.preferEndless, (v) => ao.preferEndless = v),
    check('购物/锻造', () => ao.shop, (v) => ao.shop = v));
  const autoNote = el('div', 'color:#57534c', sAuto);

  // ---------------- 测评（无尽探索） ----------------
  const sExp = section('无尽流派测评 · EXPLORE');
  const expCfg = row(sExp);
  const expPolicy = sel([['bloom', 'bloom'], ['offense', 'offense'], ['balanced', 'balanced'], ['survival', 'survival'], ['crit', 'crit'], ['dot', 'dot'], ['melee', 'melee'], ['ally', 'ally'], ['ammo', 'ammo'], ['phase', 'phase']]);
  const expDepth = el('input', 'background:#151310;color:#e8e1d3;border:1px solid #3c3732;border-radius:4px;padding:2px 4px;width:44px;font:11px monospace');
  expDepth.value = '2'; expDepth.title = '目标无尽深度';
  const expSeeds = el('input', 'background:#151310;color:#e8e1d3;border:1px solid #3c3732;border-radius:4px;padding:2px 4px;width:44px;font:11px monospace');
  expSeeds.value = '3'; expSeeds.title = '每个配置跑几次';
  const expSpeed = el('input', 'background:#151310;color:#e8e1d3;border:1px solid #3c3732;border-radius:4px;padding:2px 4px;width:44px;font:11px monospace');
  expSpeed.value = '8'; expSpeed.title = '倍速';
  expCfg.append('策略', expPolicy, '深度', expDepth, '次数', expSeeds, '倍速', expSpeed);
  const rE1 = row(sExp);
  const bExpRun = btn('▶ 开始测评'); const bExpStop = btn('■ 停止'); const bExpMd = btn('复制排名'); const bExpClr = btn('清空');
  rE1.append(bExpRun, bExpStop); row(sExp).append(bExpMd, bExpClr);
  const expOut = el('div', 'white-space:pre;overflow:auto;max-height:150px;color:#c9c1b2;border-top:1px dashed #2d2925;margin-top:4px;padding-top:3px');
  sExp.appendChild(expOut);
  bExpRun.onclick = () => {
    const p = expPolicy.value, depth = Math.max(1, +expDepth.value | 0), n = Math.max(1, +expSeeds.value | 0), sp = +expSpeed.value || 8;
    TSW.explore.start({ policies: [p], seeds: Array.from({ length: n }, (_, i) => 101 + i * 17), speed: sp, goalDepth: depth, timeoutS: 1800 });
    note('测评开始：' + p + ' × ' + n + ' 局，目标无尽深度 ' + depth);
  };
  bExpStop.onclick = () => { TSW.explore.stop(); TSW.macro.stopPlay(); note('将在当前局结束后停止'); };
  bExpMd.onclick = () => { navigator.clipboard && navigator.clipboard.writeText(TSW.explore.markdown()).then(() => note('排名已复制（Markdown）'), () => note('复制失败，请用控制台 TSW.explore.markdown()')); };
  bExpClr.onclick = () => { TSW.explore.clear(); renderExp(); };
  function renderExp() { expOut.textContent = TSW.explore.markdown(); }
  renderExp();

  // ---------------- 基准 ----------------
  const sBench = section('基准 · BENCHMARK');
  const rB1 = row(sBench);
  const bBt = btn('引擎吞吐 ×8'); const bBm = btn('宏+倍速 ×4'); const bBf = btn('全自动一局 ×8');
  rB1.append(bBt, bBm); row(sBench).append(bBf);
  const benchOut = el('div', 'white-space:pre;overflow:auto;max-height:150px;color:#c9c1b2;border-top:1px dashed #2d2925;margin-top:4px;padding-top:3px');
  sBench.appendChild(benchOut);
  const rB2 = row(sBench);
  const bBmd = btn('复制结果(Markdown)'); const bBclr = btn('清空'); rB2.append(bBmd, bBclr);
  bBt.onclick = () => { note('跑分中…（引擎吞吐）'); TSW.bench.run('throughput', { seconds: 10, speed: 8 }); };
  bBm.onclick = () => { note('跑分中…（宏+倍速）'); TSW.bench.run('macro', { seconds: 20, speed: 4 }); };
  bBf.onclick = () => { note('跑分中…（全自动一局，目标无尽1）'); TSW.bench.run('fullrun', { speed: 8, seed: 7, policy: 'bloom', goalDepth: 1, timeoutS: 900 }); };
  bBmd.onclick = () => navigator.clipboard && navigator.clipboard.writeText(TSW.bench.markdown()).then(() => note('已复制'), () => { });
  bBclr.onclick = () => { TSW.bench.clear(); renderBench(); };
  function renderBench() {
    const rs = TSW.bench.results.slice(-8).reverse();
    benchOut.textContent = rs.length ? rs.map((r) => {
      if (r.kind === 'throughput') return `吞吐 ×${r.speed}: ${r.tps} ticks/s · 游戏时间/真实=${r.ratio}`;
      if (r.kind === 'macro') return `宏 ×${r.speed}: 游戏时间/真实=${r.ratio} (目标 ${r.speed}) · 击杀 ${r.kills} · 伤害 ${(r.dmg / 1000).toFixed(1)}k`;
      return `全自动 ×${r.speed} seed=${r.seed}: ${r.end} 深度${r.depth} 击杀${r.kills} 用时${r.wall}s(真实)`;
    }).join('\n') : '（暂无结果）';
  }
  renderBench();

  // ---------------- 存档 ----------------
  const sSave = section('存档 · SAVE (localStorage)');
  const rS1 = row(sSave);
  const bSe = btn('导出存档'); const bSi = btn('导入存档'); const bSr = btn('清空存档');
  rS1.append(bSe, bSi); row(sSave).append(bSr);
  bSe.onclick = () => download('theseed-save.json', window.__dzmmMirror.export());
  bSi.onclick = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json'; inp.onchange = async () => { try { const t = await inp.files[0].text(); const n = window.__dzmmMirror.import(t); note(`已导入 ${n} 个键，刷新页面生效`); } catch (e) { note('导入失败: ' + e.message); } }; inp.click(); };
  bSr.onclick = () => { if (confirm('清空本镜像的全部存档？（不影响上游 dzmm.ai 的存档）')) { window.__dzmmMirror.reset(); note('已清空，刷新页面生效'); } };

  // ---------------- 关于 ----------------
  const sAbout = section('关于 · ABOUT');
  const about = el('div', 'color:#8e877b;user-select:text;-webkit-user-select:text', sAbout);
  about.innerHTML = '本页面是 <b style="color:#e8e1d3">非官方离线镜像</b>，游戏《[TheSeed]》著作权归原作者所有（官网：dzmm.ai/character/3738712）。' +
    '镜像未修改任何游戏源码，仅外挂 dzmm 平台 shim 与工具（宏/倍速/测评）。' +
    '文档：github.com/WangYiBen0/the-seed（站点内 <span style="color:#5ed0c8">/docs/</span> 路径下有流派指南与 benchmark 数据）。';

  // ---------------- helpers ----------------
  function note(t) { status.textContent = t; clearTimeout(note._t); note._t = setTimeout(() => status.textContent = '', 5000); }
  function download(name, text) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
  TSW.bus.on('explore', () => { renderExp(); if (TSW.explore.current) note(`测评运行中: ${TSW.explore.current.policy} seed=${TSW.explore.current.seed}（剩余 ${TSW.explore.queue.length} 局）`); else if (!TSW.explore.running) note('测评结束'); });
  TSW.bus.on('bench', renderBench);
  setInterval(() => { const A = TSW.auto; autoNote.textContent = A.mode === 'off' ? '' : `→ ${A.status.target || A.status.note || '…'}`; }, 300);

  // ---------------- headless autotest protocol ----------------
  // ?autotest=<throughput|macro|fullrun|explore>&speed=&seed=&policy=&goalDepth=&timeoutS=&results=<n>
  // Prints "TSW_RESULT {json}" lines to the console and retitles the tab when done.
  const q = new URLSearchParams(location.search);
  if (q.get('autotest')) {
    const kind = q.get('autotest');
    const opts = {
      speed: +(q.get('speed') || 8), seed: q.get('seed') != null ? +q.get('seed') : (kind === 'fullrun' || kind === 'probe' ? 7 : null),
      policy: q.get('policy') || 'bloom', goalDepth: +(q.get('goalDepth') || 1),
      timeoutS: +(q.get('timeoutS') || 900), seconds: +(q.get('seconds') || 12),
      depth: +(q.get('depth') || 5),
    };
    // build probe: ?build=<json> with {weapons,wlv,shards,skill}
    if (q.get('build')) { try { Object.assign(opts, JSON.parse(q.get('build'))); } catch (e) { } }
    TSW.perf.enable();
    const emit = (r) => { (window.__TSW_RESULTS = window.__TSW_RESULTS || []).push(r); console.info('TSW_RESULT ' + JSON.stringify(r)); };
    TSW.whenGame().then(async () => {
      try {
        if (kind === 'throughput') emit(await TSW.bench.run('throughput', opts));
        else if (kind === 'macro') emit(await TSW.bench.run('macro', opts));
        else if (kind === 'fullrun') emit(await TSW.bench.run('fullrun', opts));
        else if (kind === 'probe') emit(await TSW.bench.run('probe', opts));
        else if (kind === 'explore') {
          const n = +(q.get('results') || 4);
          TSW.explore.start({ policies: [opts.policy], seeds: Array.from({ length: n }, (_, i) => 101 + i * 17), speed: opts.speed, goalDepth: opts.goalDepth, timeoutS: opts.timeoutS });
          await new Promise((res) => TSW.bus.on('explore', () => { if (!TSW.explore.running) res(); }));
          emit({ kind: 'explore', rank: TSW.explore.rank(), results: TSW.explore.results.slice(-n) });
        }
        document.title = 'TSW_AUTOTEST_DONE';
      } catch (e) { console.info('TSW_RESULT ' + JSON.stringify({ error: String(e && e.stack || e) })); document.title = 'TSW_AUTOTEST_DONE'; }
    });
  }

  TSW.log('panel ready');
})();
