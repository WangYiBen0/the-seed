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
    'position:fixed', 'left:8px', 'top:8px', 'z-index:60', 'width:252px', 'max-height:calc(100dvh - 16px)', 'overflow-y:auto', 'scrollbar-width:thin',
    'background:rgba(10,9,8,.94)', 'border:1px solid #36322d', 'border-radius:8px',
    'color:#e8e1d3', 'font:11px/1.5 ui-monospace,Menlo,Consolas,"Microsoft YaHei",monospace',
    'box-shadow:0 4px 18px rgba(0,0,0,.55)', 'user-select:none', '-webkit-user-select:none', 'cursor:default',
  ].join(';');
  document.body.appendChild(root);
  const stop = (e) => { e.stopPropagation(); };
  // bubble phase: buttons/inputs inside the panel work normally, but events
  // stopped here never reach the game's window-level listeners
  for (const ev of ['keydown', 'keyup', 'mousedown', 'mouseup', 'mousemove', 'click', 'wheel', 'contextmenu', 'pointerdown', 'pointerup', 'touchstart', 'touchend']) root.addEventListener(ev, stop);

  let open = TSW.settings.get('panelOpen', false);
  const head = document.createElement('div');
  head.style.cssText = 'display:flex;align-items:center;gap:6px;padding:6px 8px;border-bottom:1px solid #2d2925;cursor:move';
  head.title = '拖动移动面板';
  root.appendChild(head);
  const title = document.createElement('span'); title.textContent = '⚙ [TheSeed] 工坊'; title.style.cssText = 'flex:1;color:#efb94a'; head.appendChild(title);
  const closeBtn = document.createElement('button'); closeBtn.textContent = '✕'; closeBtn.title = '关闭工坊（F8 重新打开）';
  closeBtn.style.cssText = 'background:transparent;color:#8e877b;border:none;cursor:pointer;font:13px/1 monospace;padding:2px 4px;';
  closeBtn.onmouseenter = () => { closeBtn.style.color = '#efb94a'; };
  closeBtn.onmouseleave = () => { closeBtn.style.color = '#8e877b'; };
  head.appendChild(closeBtn);
  const body = document.createElement('div'); root.appendChild(body);
  // gear tab: the closed panel shrinks to this; click (or F8) opens it again
  const tab = document.createElement('button');
  tab.id = 'tsw-gear-tab';
  tab.textContent = '⚙'; tab.title = '打开 [TheSeed] 工坊（F8）';
  tab.style.cssText = 'position:fixed;z-index:59;width:28px;height:28px;display:none;opacity:.72;'
    + 'background:rgba(10,9,8,.9);color:#efb94a;border:1px solid #36322d;border-radius:7px;'
    + 'cursor:pointer;font:14px/1 monospace;padding:0;box-shadow:0 2px 10px rgba(0,0,0,.5);';
  tab.onmouseenter = () => { tab.style.opacity = '1'; tab.style.borderColor = '#efb94a'; };
  tab.onmouseleave = () => { tab.style.opacity = '.72'; tab.style.borderColor = '#36322d'; };
  tab.addEventListener('click', (e) => { e.stopPropagation(); TSW.panel.toggle(); });
  document.body.appendChild(tab);
  function applyOpen() {
    root.style.display = open ? '' : 'none';
    tab.style.display = open ? 'none' : '';
    tab.style.left = root.style.left; tab.style.top = root.style.top;
  }
  function setOpen(v) { open = !!v; applyOpen(); TSW.settings.set('panelOpen', open); }
  TSW.panel = { toggle() { setOpen(!open); }, get open() { return open; } };
  closeBtn.addEventListener('click', (e) => { e.stopPropagation(); setOpen(false); });
  applyOpen();

  // drag the panel by its header (position persists)
  const savedPos = TSW.settings.get('panelPos', null);
  if (savedPos && typeof savedPos.x === 'number') { root.style.left = Math.max(0, Math.min(innerWidth - 44, savedPos.x)) + 'px'; root.style.top = Math.max(0, Math.min(innerHeight - 22, savedPos.y)) + 'px'; }
  let drag = null;
  head.addEventListener('mousedown', (e) => { if (e.target === colBtn) return; drag = { dx: e.clientX - root.offsetLeft, dy: e.clientY - root.offsetTop }; e.preventDefault(); });
  window.addEventListener('mousemove', (e) => {
    if (!drag) return;
    root.style.left = Math.max(0, Math.min(innerWidth - 44, e.clientX - drag.dx)) + 'px';
    root.style.top = Math.max(0, Math.min(innerHeight - 22, e.clientY - drag.dy)) + 'px';
  }, true);
  window.addEventListener('mouseup', () => { if (!drag) return; drag = null; TSW.settings.set('panelPos', { x: root.offsetLeft, y: root.offsetTop }); }, true);

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
  const cbHud = check('测评 HUD（F9 或 HUD 右上角 ✕ 隐藏）', () => TSW.hud.visible, (v) => TSW.hud.toggle(v));
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
  // draggable speed slider (0.25x steps up to 16x, log-ish feel via a stepped range)
  // logarithmic: each notch is roughly a fixed ratio, and it reaches DOWN to
  // slow-motion as well as up to 16x.  Declared before the slider so its max
  // attribute can be computed (using it earlier threw a TDZ ReferenceError and
  // took the whole panel down).
  const SLIDER_STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8, 11, 16];
  const spRow = row(sState);
  const spSlider = el('input', 'width:120px;flex:none;accent-color:#8ed872');
  spSlider.type = 'range'; spSlider.min = '0'; spSlider.max = String(SLIDER_STEPS.length - 1); spSlider.step = '1';
  spSlider.value = '0';
  const spOut = el('span', 'color:#a07ad8;min-width:34px;text-align:right');
  spRow.append(spSlider, spOut);
  const sliderToSpeed = (v) => SLIDER_STEPS[Math.max(0, Math.min(SLIDER_STEPS.length - 1, +v | 0))];
  const speedToSlider = (x) => {
    let best = 0, bd = 1e9;
    SLIDER_STEPS.forEach((v, i) => { const d = Math.abs(v - x); if (d < bd) { bd = d; best = i; } });
    return best;
  };
  const updSlider = () => { spSlider.value = String(speedToSlider(TSW.speed.get())); spOut.textContent = `×${TSW.speed.get()}`; };
  spSlider.oninput = () => { const v = sliderToSpeed(spSlider.value); TSW.speed.set(v); spOut.textContent = `×${v}`; };
  spSlider.onchange = () => updSlider();
  TSW.bus.on('speed', updSlider);

  const updSpeed = () => { speedVal.textContent = `速度 ×${TSW.speed.get()} （热键 - / ＝，或拖动上面的滑块）`; };
  TSW.bus.on('speed', updSpeed); updSpeed();
  updSlider();
  TSW.bus.on('auto', () => { modeSel.value = TSW.auto.mode; polSel.value = TSW.auto.policy; });
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
  const polSel = sel([['rounded', '均衡适应'], ['brawler', '近身搏击'], ['crazy', '精准猛攻'], ['ranger', '远距火力'], ['mage', '元素反应'], ['chunky', '厚重生存'], ['old', '稳守缓进'], ['lucky', '幸运搜集'], ['engineer', '工程布防'], ['doctor', '医疗续航'], ['mutant', '快速蜕变'], ['loud', '喧嚣引敌']]);
  polSel.value = TSW.auto.policy; polSel.onchange = () => TSW.auto.setPolicy(polSel.value); row(sAuto).append(polSel);
  // 排除列表 / 优先级 (comma-separated shard ids)
  const exIn = el('input', 'background:#151310;color:#e8e1d3;border:1px solid #3c3732;border-radius:4px;padding:3px 5px;width:100%;font:11px monospace;margin:1px 0');
  exIn.placeholder = '排除血清(逗号分隔id): glass,allin,prism…';
  exIn.value = (TSW.settings.get('serumExclude', []) || []).join(',');
  exIn.onchange = () => { TSW.settings.set('serumExclude', exIn.value.split(',').map((x) => x.trim()).filter(Boolean)); note('排除列表已保存'); };
  sAuto.append(exIn);
  const prIn = el('input', exIn.style.cssText);
  prIn.placeholder = '被迫选择时的优先级(逗号分隔id)';
  prIn.value = (TSW.settings.get('serumPriority', []) || []).join(',');
  prIn.onchange = () => { TSW.settings.set('serumPriority', prIn.value.split(',').map((x) => x.trim()).filter(Boolean)); note('优先级已保存'); };
  sAuto.append(prIn);
  const ao = TSW.auto.opts;
  row(sAuto).append(
    check('自动选血清', () => ao.autoCards, (v) => ao.autoCards = v),
    check('死亡自动重开', () => ao.autoRestart, (v) => ao.autoRestart = v));
  row(sAuto).append(
    check('优先无尽传送门', () => ao.preferEndless, (v) => ao.preferEndless = v),
    check('购物/锻造', () => ao.shop, (v) => ao.shop = v));
  // ---- 细项：逐项决定挂机要不要碰它们 ----
  const setOpt = (k, sk) => check(k, () => ao[k], (v) => { ao[k] = v; TSW.settings.set(sk, v); });
  row(sAuto).append(setOpt('自动开箱', 'autoChest'), setOpt('治疗泉', 'autoFount'));
  row(sAuto).append(setOpt('实验血清（α/β/Ω）', 'autoLabSerum'), setOpt('军械库', 'autoArsenal'));
  row(sAuto).append(setOpt('捡武器', 'autoWeaponPick'), setOpt('捡芯片', 'autoChipPick'));
  row(sAuto).append(setOpt('棱镜/钥匙', 'autoPickups'), setOpt('玩家可手动接管', 'autoManual'));
  row(sAuto).append(setOpt('透析机（花 1 护甲上限清诅咒）', 'autoDialysis'));
  row(sAuto).append(setOpt('技能芯片（E）', 'autoSkill'), setOpt('主动换弹（R）', 'autoReload'));
  row(sAuto).append(setOpt('搭档技能（F）', 'autoPartner'), setOpt('换弹切副武器（X）', 'autoWeaponSwap'));
  row(sAuto).append(setOpt('招募伙伴（篝火）', 'autoMate'), setOpt('冲刺避开陷阱/虚空', 'autoDashHazards'));
  row(sAuto).append(check('启用冲刺', () => ao.dash, (v) => { ao.dash = v; TSW.settings.set('autoDash', v); }));
  const autoNote = el('div', 'color:#57534c', sAuto);

  // ---------------- 测评（无尽探索） ----------------
  const sExp = section('无尽流派测评 · EXPLORE');
  const expCfg = row(sExp);
  const expPolicy = sel([['rounded', '均衡适应'], ['brawler', '近身搏击'], ['crazy', '精准猛攻'], ['ranger', '远距火力'], ['mage', '元素反应'], ['chunky', '厚重生存'], ['old', '稳守缓进'], ['lucky', '幸运搜集'], ['engineer', '工程布防'], ['doctor', '医疗续航'], ['mutant', '快速蜕变'], ['loud', '喧嚣引敌']]);
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
  bBf.onclick = () => { note('跑分中…（全自动一局，目标无尽1）'); TSW.bench.run('fullrun', { speed: 8, seed: 7, policy: 'rounded', goalDepth: 1, timeoutS: 900 }); };
  bBmd.onclick = () => navigator.clipboard && navigator.clipboard.writeText(TSW.bench.markdown()).then(() => note('已复制'), () => { });
  bBclr.onclick = () => { TSW.bench.clear(); renderBench(); };
  // ---------------- 躲弹幕测评 (pure-evasion stress test) ----------------
  const sDodge = section('躲弹幕测评 · DODGE BENCH');
  const dHelp = el('div', 'color:#8d867a');
  dHelp.textContent = '禁止开火 + 持续补充远程敌人：敌人不会减少，弹幕只会更密。\n' +
    '指标：受击/游戏分钟（越低越好）、危险值均值、暴露率、弹幕余量、冲刺频率。';
  sDodge.appendChild(dHelp);
  const numIn = (ph, w) => { const n = el('input', 'background:#151310;color:#e8e1d3;border:1px solid #3c3732;border-radius:4px;padding:2px 4px;width:' + w + 'px;font:11px monospace'); n.placeholder = ph; return n; };
  const lab = (txt, node) => { const w = el('label', 'display:flex;align-items:center;gap:3px;color:#8d867a'); w.append(document.createTextNode(txt), node); return w; };
  const dR1 = row(sDodge);
  const dSec = numIn('45', 46), dDep = numIn('6', 34), dSeed = numIn('11', 46);
  dSec.value = '45'; dDep.value = '6'; dSeed.value = '11';
  dR1.append(lab('时长(秒)', dSec), lab('起始深度', dDep), lab('随机种子', dSeed));
  const dR2 = row(sDodge);
  const dGo = btn('开始躲弹幕测评');
  dR2.append(dGo);
  const dOut = el('div', 'white-space:pre;overflow:auto;max-height:170px;color:#c9c1b2;border-top:1px dashed #2d2925;margin-top:4px;padding-top:3px');
  sDodge.appendChild(dOut);
  const fmt = (r, name) => `${name} 受击 ${r.hitsPerMin}/分（${r.hits} 次 / ${r.gameMinutes} 分）\n` +
    `   危险值 ${r.dangerAvg} · 暴露率 ${r.hazardPct}% · 弹幕余量均值 ${r.clearAvg}（最差 ${r.clearMin}）\n` +
    `   冲刺 ${r.dashesPerMin}/分 · 存活 ${r.end === 'dead' ? '阵亡' : '存活'} · ticks ${r.ticks}`;
  const runDodge = async () => {
    note('躲弹幕测评中…（×8，需要几十秒）');
    dOut.textContent = '跑分中…';
    const o = { seconds: +dSec.value || 45, depth: +dDep.value || 6, seed: +dSeed.value || 11, speed: 8 };
    const r = await TSW.bench.run('dodge', o);
    if (!r) { dOut.textContent = '（失败）'; return; }
    else if (r.kind === 'error') dOut.textContent = '错误：' + r.error;
    else dOut.textContent = fmt(r, 'v2');
    note('完成');
  };
  dGo.onclick = () => runDodge();

  function renderBench() {
    const rs = TSW.bench.results.slice(-8).reverse();
    benchOut.textContent = rs.length ? rs.map((r) => {
      if (r.kind === 'throughput') return `吞吐 ×${r.speed}: ${r.tps} ticks/s · 游戏时间/真实=${r.ratio}`;
      if (r.kind === 'macro') return `宏 ×${r.speed}: 游戏时间/真实=${r.ratio} (目标 ${r.speed}) · 击杀 ${r.kills} · 伤害 ${(r.dmg / 1000).toFixed(1)}k`;
      if (r.kind === 'dodge') return `躲弹幕 ${r.engine} 深度${r.depth} seed=${r.seed}: 受击 ${r.hitsPerMin}/分 · 危险 ${r.dangerAvg} · 余量 ${r.clearAvg}`;
      if (r.kind === 'dodge-ab') return `躲弹幕对比 深度${r.depth} seed=${r.seed}: v2 ${r.v2.hitsPerMin}/分 vs v1 ${r.simple.hitsPerMin}/分 → ${r.verdict}`;
      return `全自动 ×${r.speed} seed=${r.seed}: ${r.end} 深度${r.depth} 击杀${r.kills} 用时${r.wall}s(真实)`;
    }).join('\n') : '（暂无结果）';
  }
  renderBench();

  // ---------------- dzmm 账号 ----------------
  // ---------------- 最终稳定状态 · GOAL BUILD ----------------
  // 挂机把这套配置当“目标终局”：选卡/选枪/招募/技能都朝它靠。
  // 每一项显示游戏内真实名字与描述（取自 WEAPONS / SKILLS / SURV 表）。
  const sGoal = section('最终稳定状态 · GOAL BUILD');
  const goalHelp = el('div', 'color:#8d867a');
  goalHelp.textContent = '挂机会把这套配置当目标终局；没选的项＝不限。（名字与描述取自游戏数据表）';
  sGoal.appendChild(goalHelp);

  const L1 = (v) => { if (!v) return ''; if (Array.isArray(v)) return v[1] || v[0] || ''; return String(v); };
  const goalStore = (k, d) => TSW.settings.get('goal.' + k, d);
  const goalSet = (k, v) => { TSW.settings.set('goal.' + k, v); note('目标已保存：' + k); };

  const goalSelects = [];
  const goalSel = (label, items, key) => {
    const r = row(sGoal);
    const lb = el('span', 'color:#8d867a;min-width:80px', r); lb.textContent = label;
    const s2 = sel(items);
    s2.value = goalStore(key, '');
    r.append(s2);
    goalSelects.push({ sel: s2, key, label, items });
    const dd = el('div', 'color:#57534c;margin:0 0 3px 0;padding-left:4px');
    sGoal.appendChild(dd);
    const up = () => {
      const hit = items.find((it) => it[0] === s2.value);
      dd.textContent = hit && hit[2] ? hit[2] : '';
    };
    s2.onchange = () => { goalSet(key, s2.value); up(); };
    up();
    return s2;
  };

  // The panel is built synchronously at load time, when the game's data tables
  // may not exist yet — that left every goal dropdown with only 不限.  Fill them
  // once the game is ready instead.
  const wItems = [['', '（不限）', '']];
  if (wItems.length < 2) console.warn('[panel] weapon goal list empty; items=', wItems.length);
  goalSel('目标武器', wItems, 'weapon');

  const kItems = [['', '（不限）', '']];
  goalSel('目标技能', kItems, 'skill');

  const svItems = [['', '（不限）', '']];
  if (svItems.length < 2) console.warn('[panel] squad goal list empty; items=', svItems.length);
  goalSel('电台搭档', svItems, 'radio');
  goalSel('战斗搭档', svItems, 'mate');

  // ---- fill the goal dropdowns once the game data exists -------------------
  TSW.whenGame().then(() => {
    const fill = (items, ids, make) => { for (const id of ids) { const it = make(id); if (it) items.push(it); } };
    try {
      fill(wItems, (typeof WEAPON_IDS !== 'undefined') ? WEAPON_IDS : Object.keys(WEAPONS || {}),
        (id) => { const w = WEAPONS[id]; return (w && w.nm) ? [id, L1(w.nm) + ' · ' + id, L1(w.d) + '（' + (w.kind || '') + '）'] : null; });
    } catch (e) { console.error('[panel] goal weapons', e); }
    try {
      fill(kItems, (typeof SKILL_IDS !== 'undefined') ? SKILL_IDS : Object.keys(SKILLS || {}),
        (id) => { const k = SKILLS[id]; return k ? [id, String(k.nm || id), L1(k.d)] : null; });
    } catch (e) { console.error('[panel] goal skills', e); }
    try {
      fill(svItems, (typeof SURV_IDS !== 'undefined') ? SURV_IDS : Object.keys(SURV || {}),
        (id) => { const m = SURV[id]; return m ? [id, L1(m.nm) + ' · ' + id, L1(m.file || '')] : null; });
    } catch (e) { console.error('[panel] goal squad', e); }
    for (const g of goalSelects) {
      const keep = g.sel.value || goalStore(g.key, '');
      while (g.sel.options.length > 1) g.sel.remove(1);
      for (const [v, l] of g.items) {
        if (!v) continue;
        const o = document.createElement('option'); o.value = v; o.textContent = l; g.sel.appendChild(o);
      }
      g.sel.value = keep && g.sel.querySelector('option[value="' + CSS.escape(keep) + '"]') ? keep : '';
    }
  });

  const exLabel = el('div', 'color:#8d867a;margin-top:3px');
  exLabel.textContent = '目标排除血清（逗号分隔 id）';
  sGoal.appendChild(exLabel);
  const exBox = el('input', 'background:#151310;color:#e8e1d3;border:1px solid #3c3732;border-radius:4px;padding:2px 4px;width:100%;font:11px monospace');
  exBox.placeholder = 'bloom,shrap,fury …';
  exBox.value = (TSW.settings.get('serumExclude', []) || []).join(',');
  exBox.onchange = () => { TSW.settings.set('serumExclude', exBox.value.split(',').map((x) => x.trim()).filter(Boolean)); note('排除血清已保存'); };
  sGoal.appendChild(exBox);

  const gRow = row(sGoal);
  const bGoalShow = btn('查看当前目标');
  const bGoalClear = btn('清空目标');
  gRow.append(bGoalShow, bGoalClear);
  const gOut = el('div', 'white-space:pre-wrap;color:#c9c1b2;border-top:1px dashed #2d2925;margin-top:3px;padding-top:3px');
  sGoal.appendChild(gOut);
  const showGoal = () => {
    const k = (x) => goalStore(x, '') || '（不限）';
    gOut.textContent = '目标武器：' + k('weapon') + '\n目标技能：' + k('skill') +
      '\n电台搭档：' + k('radio') + '\n战斗搭档：' + k('mate') +
      '\n排除血清：' + ((TSW.settings.get('serumExclude', []) || []).join(',') || '（无）');
  };
  bGoalShow.onclick = () => { showGoal(); note('目标如上'); };
  bGoalClear.onclick = () => {
    for (const x of ['weapon', 'skill', 'radio', 'mate']) TSW.settings.set('goal.' + x, '');
    TSW.settings.set('serumExclude', []);
    note('目标已清空（刷新面板生效）');
  };

  const sAcc = section('工具注入 · INJECT');
  const accRow = row(sAcc);
  const bInject = btn('复制工具注入代码');
  const bAccNote = el('div', 'color:#8d867a');
  bAccNote.textContent = '官网页（dzmm.ai）是纯静态页面之外的另一套登录态，镜像读不到它；\n想在官方页里用这套工具：点上面按钮复制代码，到官网页面按 F12 打开控制台粘贴回车，\n然后 F8 工坊 / F9 HUD / F10 指令台。源码见 inject.js。';
  accRow.append(bInject);
  sAcc.appendChild(bAccNote);
  // 注入代码只有一份（site/inject.js），按钮直接把它取过来复制，避免两处不同步
  const INJECT_FALLBACK = "(()=>{const B='https://wangyiben0.github.io/the-seed/tools/',F=['core','macro','auto','hud','bench','explore','cheats','panel'];if(window.__TSW)return console.warn('[TSW] already injected');(async()=>{const bad=[];for(const n of F){await new Promise(r=>{const s=document.createElement('script');s.src=B+n+'.js?v='+Date.now();s.onload=r;s.onerror=()=>{bad.push(n);r()};document.head.appendChild(s)})}console.log(bad.length?'[TSW] failed: '+bad:'[TSW] injected')})()})();";
  const copyInject = async () => {
    let code = INJECT_FALLBACK;
    try {
      const url = new URL('../inject.js', document.baseURI);
      const res = await fetch(url.href, { cache: 'no-store' });
      if (res.ok) { const t = await res.text(); if (t && t.length > 80) code = t; }
    } catch (e) { /* 取不到就退回内置一行版 */ }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(code); note('已复制注入代码 → 到官网页面 F12 粘贴回车'); return; }
    } catch (e) { }
    // 剪贴板不可用（无 https / 被拒）时给一个可选中的文本框
    const ta = document.createElement('textarea');
    ta.value = code; ta.style.cssText = 'width:100%;height:70px;margin-top:4px;background:#151310;color:#e8e1d3;border:1px solid #3c3732;font:10px monospace';
    sAcc.appendChild(ta); ta.focus(); ta.select();
    note('剪贴板被拒：已选中文本，请手动 Ctrl+C');
  };
  bInject.onclick = copyInject;

  // ---------------- 存档 ----------------
  const sSave = section('存档 · SAVE (localStorage)');
  const rS1 = row(sSave);
  const bSe = btn('导出存档'); const bSi = btn('导入存档'); const bSr = btn('清空存档');
  rS1.append(bSe, bSi); row(sSave).append(bSr);
  bSe.onclick = () => download('theseed-save.json', window.__dzmmMirror.export());
  bSi.onclick = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json'; inp.onchange = async () => { try { const t = await inp.files[0].text(); const n = window.__dzmmMirror.import(t); note(`已导入 ${n} 个键，刷新页面生效`); } catch (e) { note('导入失败: ' + e.message); } }; inp.click(); };
  bSr.onclick = () => { if (confirm('清空本镜像的全部存档？（不影响上游 dzmm.ai 的存档）')) { window.__dzmmMirror.reset(); note('已清空，刷新页面生效'); } };

  // ---------------- 指令 · 测试 ----------------
  const sCmd = section('指令 · 测试（改游戏状态，测评数据作废）');
  const cmdIn = el('input', 'background:#151310;color:#e8e1d3;border:1px solid #3c3732;border-radius:4px;padding:3px 5px;width:100%;font:11px monospace');
  cmdIn.placeholder = 'help / god / lockhp 5 / ink 500 / kill / next / endless / weapon rail ...';
  sCmd.append(cmdIn);
  const rC = row(sCmd);
  const bCmd = btn('执行'); rC.append(bCmd);
  const cmdOut = el('div', 'white-space:pre;overflow:auto;max-height:90px;color:#c9c1b2;border-top:1px dashed #2d2925;margin-top:4px;padding-top:3px;min-height:14px');
  sCmd.appendChild(cmdOut);
  const runCmd = () => { if (!cmdIn.value.trim()) { cmdOut.textContent = TSW.cmd('help'); return; } cmdOut.textContent = TSW.cmd(cmdIn.value); cmdIn.select(); };
  bCmd.onclick = runCmd;
  cmdIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.stopPropagation(); e.preventDefault(); runCmd(); } });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'F10') { e.preventDefault(); if (!TSW.panel.open) TSW.panel.toggle(); setTimeout(() => cmdIn.focus(), 60); }
  });
  cmdOut.textContent = 'F10 唤出 · help 查看指令';

  // ---------------- AI 设置（可选：OpenAI 兼容接口） ----------------
  const sAI = section('AI 设置 · 小队/少女聊天（可选）');
  const aiE = el('input', 'background:#151310;color:#e8e1d3;border:1px solid #3c3732;border-radius:4px;padding:3px 5px;width:100%;font:11px monospace;margin:1px 0');
  aiE.placeholder = 'OpenAI 兼容接口，如 https://api.openai.com/v1';
  const aiK = el('input', aiE.style.cssText); aiK.type = 'password'; aiK.placeholder = 'API Key（留空则不带鉴权头）';
  const aiM = el('input', aiE.style.cssText); aiM.placeholder = '模型名，如 gpt-4o-mini';
  const aiCur = (() => { try { return JSON.parse(localStorage.getItem('theseed.ai') || 'null') || {}; } catch (e) { return {}; } })();
  aiE.value = aiCur.endpoint || ''; aiK.value = aiCur.key || ''; aiM.value = aiCur.model || '';
  sAI.append(aiE, aiK, aiM);
  const rAI = row(sAI);
  const bAiSave = btn('保存'); rAI.append(bAiSave);
  const aiNote = el('span', 'color:#57534c', sAI); aiNote.textContent = '保存后刷新页面生效；不填 = AI 聊天保持关闭';
  bAiSave.onclick = () => {
    localStorage.setItem('theseed.ai', JSON.stringify({ endpoint: aiE.value.trim(), key: aiK.value.trim(), model: aiM.value.trim() }));
    note('已保存 AI 配置，刷新页面生效');
  };

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
      policy: q.get('policy') || 'rounded', goalDepth: +(q.get('goalDepth') || 1),
      timeoutS: +(q.get('timeoutS') || 900), seconds: +(q.get('seconds') || 12),
      depth: +(q.get('depth') || 5), diff: q.get('diff') || undefined,
      engine: q.get('engine') || 'v2',
      mods: q.get('mods') ? q.get('mods').split(',').map((x) => x.trim()).filter(Boolean) : null,
      role: q.get('role') || undefined, wave: q.get('wave') ? +q.get('wave') : undefined,
      rounds: q.get('rounds') ? +q.get('rounds') : 5,
      abKind: q.get('abKind') || 'fullrun',
      base: Object.assign(q.get('startWave') ? { wave: +q.get('startWave') } : {}, q.get('reachWave') ? { reachWave: +q.get('reachWave') } : {}),
      metric: q.get('metric') || undefined,
      optA: q.get('optA') ? JSON.parse(q.get('optA')) : {},
      optB: q.get('optB') ? JSON.parse(q.get('optB')) : {},
    };
    // build probe: ?build=<json> with {weapons,wlv,shards,skill}
    if (q.get('build')) { try { Object.assign(opts, JSON.parse(q.get('build'))); } catch (e) { } }
    TSW.perf.enable();
    if (q.get('det') !== '0' && q.get('det')) TSW.det.enable();
    const emit = (r) => { (window.__TSW_RESULTS = window.__TSW_RESULTS || []).push(r); console.info('TSW_RESULT ' + JSON.stringify(r)); };
    TSW.whenGame().then(async () => {
      try {
        if (kind === 'throughput') emit(await TSW.bench.run('throughput', opts));
        else if (kind === 'macro') emit(await TSW.bench.run('macro', opts));
        else if (kind === 'fullrun') emit(await TSW.bench.run('fullrun', opts));
        else if (kind === 'probe') emit(await TSW.bench.run('probe', opts));
        else if (kind === 'dodge') emit(await TSW.bench.run('dodge', opts));
        else if (kind === 'invade') emit(await TSW.bench.run('invade', opts));
        else if (kind === 'ab') emit(await TSW.bench.run('ab', opts));
        else if (kind === 'evolve') {
          emit(await TSW.evolve.start(Object.assign({}, opts,
            q.get('gens') ? { generations: +q.get('gens') } : {},
            q.get('pop') ? { pop: +q.get('pop') } : {},
            q.get('seeds') ? { seeds: q.get('seeds').split(',').map(Number) } : {})));
        }
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
