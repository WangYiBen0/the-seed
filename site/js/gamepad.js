// Standard Gamepad API input. Physical keyboard, mouse and touch state stay separate.
'use strict';
const PAD = { active: false, index: null, id: '', status: 'waiting', prev: [], blocked: new Set(), context: '', drawn: '',
  suspended: false, neutral: false, focus: null, cursor: false, aim: 0, aimed: false, nav: '', repeat: 0, toast: null };
const padText = (en, zh, ja, zhs = zh) => tr(N4(en, zh, ja, zhs));
const padNumber = (v, fallback, lo, hi) => Number.isFinite(v) ? clamp(v, lo, hi) : fallback;
const padDeadzone = () => padNumber(SET.padDeadzone, .18, .1, .4);
const padCursorSpeed = () => padNumber(SET.padCursorSpeed, 1, .5, 2);
function padStick(p, offset) {
  const x = padNumber(p.axes[offset], 0, -1, 1), y = padNumber(p.axes[offset + 1], 0, -1, 1), m = Math.hypot(x, y), dead = padDeadzone();
  if (m <= dead) return [0, 0]; const k = Math.min(1, (m - dead) / (1 - dead)) / m; return [x * k, y * k];
}
function padButtons(p) { return Array.from({ length: 17 }, (_, i) => !!p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > .55)); }
function padClear() { Input.padKeys = {}; Input.padX = Input.padY = 0; Input.padFire = false; }
function padNotice(s) { PAD.toast = { s, t: 3 }; }
function padSuspend() {
  if (PAD.active && inPlay()) openPause('play');
  PAD.suspended = true; PAD.neutral = true; padClear(); Input.padPrev = {};
}
function padPhysical() {
  if (!PAD.active) return; PAD.active = false; PAD.neutral = true; PAD.focus = null; PAD.cursor = false; padClear(); Input.padPrev = {};
}
addEventListener('keydown', padPhysical, true);
addEventListener('mousedown', padPhysical, true);
addEventListener('mousemove', e => { if (Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0) > 1) padPhysical(); }, true);
addEventListener('touchstart', padPhysical, { capture: true, passive: true });
addEventListener('blur', padSuspend);
addEventListener('focus', () => { PAD.suspended = false; if (PAD.status === 'blocked') PAD.status = 'waiting'; });
document.addEventListener('visibilitychange', () => { if (document.hidden) padSuspend(); else { PAD.suspended = false; if (PAD.status === 'blocked') PAD.status = 'waiting'; } });
addEventListener('gamepadconnected', () => { if (PAD.status === 'blocked') PAD.status = 'waiting'; });
function padDisconnect() {
  if (PAD.active) { if (inPlay()) openPause('play'); padNotice(padText('CONTROLLER DISCONNECTED', '手柄已斷開', 'コントローラー切断', '手柄已断开')); }
  PAD.active = false; PAD.index = null; PAD.id = ''; PAD.prev = []; PAD.blocked.clear(); PAD.focus = null; PAD.context = ''; PAD.neutral = true; padClear(); Input.padPrev = {};
}
addEventListener('gamepaddisconnected', e => { if (e.gamepad && e.gamepad.index === PAD.index) padDisconnect(); });
function padRead() {
  if (typeof navigator.getGamepads !== 'function') { PAD.status = 'unavailable'; return []; }
  if (PAD.status === 'blocked') return [];
  try { return Array.from(navigator.getGamepads() || []).filter(p => p && p.connected !== false); }
  catch (e) { PAD.status = 'blocked'; return []; }
}
function padContext() {
  return [G.rid || '', G.state, MENU.page, G.hintQ ? 'hint' : '', G.tpPause ? 'teleport' : '',
    NAMEED.open ? 'name' : '', OVL.open ? 'overlay:' + OVL.kind : '', WC.open ? 'world' : '', FSQ.open ? 'fullscreen' : '',
    ANN.open ? 'announcement' : '', TBAR.area, TBAR.sub.join('/'), DEP.mode || '', DEP.pick,
    IVU.detail ? 'ivdetail:' + IVU.detail.o.k + ':' + IVU.detail.o.id : '', BUILD.det ? 'build-detail' : '',
    G.talk && G.talk.ask3 ? 'recruit-choice' : '', G.state === 'dialysis' ? DIA.mode : '',
    GIRLS.chat ? 'chat' : '', GIRLS.view ? 'gallery' : '', PST.open ? 'story' : ''].join('|');
}
function padPulse(code, on = true) { if (on) Input.padKeys[code] = true; }
function padDirection(x, y, buttons, dt) {
  if (buttons[14] || buttons[15]) { x = buttons[15] ? 1 : -1; y = 0; }
  else if (buttons[12] || buttons[13]) { y = buttons[13] ? 1 : -1; x = 0; }
  const dir = Math.max(Math.abs(x), Math.abs(y)) < .45 ? '' : Math.abs(x) > Math.abs(y) ? (x < 0 ? 'Left' : 'Right') : (y < 0 ? 'Up' : 'Down');
  if (!dir) { PAD.nav = ''; PAD.repeat = 0; return ''; }
  if (dir !== PAD.nav) { PAD.nav = dir; PAD.repeat = .34; return dir; }
  PAD.repeat -= dt; if (PAD.repeat > 0) return ''; PAD.repeat = .12; return dir;
}
function padMenuRows(page) {
  const lay = menuLayout(page); return menuItems(page).map((it, i) => ({ x: lay.x - 5, y: lay.y + i * lay.step - 2, w: lay.w + 4, h: lay.step - 2 }));
}
function padTargets() {
  if (NAMEED.open || OVL.open || FSQ.open || ANN.open || WC.open || G.hintQ) return [];
  let list = [];
  if (G.state === 'talk' && G.talk && G.talk.ask3) list = flBtns();
  else if (G.state === 'dialysis') list = DIA.hits;
  else if (ivOn() && IVU.detail) list = IVU.hits;
  else if (ivOn() && IV_UI.has(G.state)) list = IVU.pop ? IVU.hits.slice(IVU.popAt || 0) : IVU.hits;
  else if (G.state === 'cards' && G.cards && G.cards.pick < 0 && G.cards.skipT === undefined) {
    list = G.cards.opts.map((_, i) => Object.assign({ w: CARD.w, h: CARD.h }, cardRect(i))).concat(RRB, svBtns());
  } else if (G.state === 'curse' && G.curseQ && G.curseQ.pick < 0) list = G.curseQ.opts.map((_, i) => curseRect(i)).concat(CRR);
  else if (G.state === 'pause' && MENU.page === 'pause' && ivOn()) list = padMenuRows('pause').concat(IVP.hits || []);
  else if ((G.state === 'menu' || G.state === 'pause') && ['girls', 'market'].includes(MENU.page)) {
    list = GIRLS.hits;
    if (docked()) { const r = dockRect(); list = list.map(b => ({ ...b, x: b.x + r.x - 24, y: b.y + r.y - 12 })); }
  } else if (G.state === 'build' && !BUILD.det) {
    const lay = buildLay(), ids = Object.keys(G.p.shards), r = lay.list;
    list = ids.map((id, i) => ({ x: r.x + i % 2 * (lay.cw + 6), y: r.y + Math.floor(i / 2) * 24 - BUILD.SL.pos, w: lay.cw, h: 21 }))
      .filter(b => b.y >= r.y && b.y + b.h <= r.y + r.h);
    let y = lay.rl.y - BUILD.SR.pos;
    for (const it of buildRight()) { if (it.kind !== 'hdr' && y >= lay.rl.y && y + it.h <= lay.rl.y + lay.rl.h) list.push({ x: lay.rl.x, y, w: lay.rl.w, h: it.h - 2 }); y += it.h; }
  }
  return list.filter(b => b && Number.isFinite(b.x) && Number.isFinite(b.y) && b.w > 0 && b.h > 0 &&
    b.x + b.w / 2 > 0 && b.x + b.w / 2 < W && b.y + b.h / 2 > 0 && b.y + b.h / 2 < H && !(b.w > W * .9 && b.h > H * .7));
}
function padPoint(b) { return [b.x + b.w / 2, b.y + b.h / 2]; }
function padFocusMove(list, dir) {
  if (!list.length) { PAD.focus = null; return; }
  let current = PAD.focus ? list.reduce((best, b) => dist(...padPoint(b), ...padPoint(PAD.focus)) < dist(...padPoint(best), ...padPoint(PAD.focus)) ? b : best, list[0]) : list[0];
  if (dir) {
    const [x, y] = padPoint(current), dx = dir === 'Left' ? -1 : dir === 'Right' ? 1 : 0, dy = dir === 'Up' ? -1 : dir === 'Down' ? 1 : 0;
    const candidates = list.filter(b => b !== current).map(b => { const [bx, by] = padPoint(b), along = (bx - x) * dx + (by - y) * dy, across = Math.abs((bx - x) * dy - (by - y) * dx); return { b, along, across }; });
    const forward = candidates.filter(q => q.along > 2).sort((a, b) => (a.along + a.across * 3) - (b.along + b.across * 3));
    const wrap = candidates.sort((a, b) => (a.along + a.across * 3) - (b.along + b.across * 3));
    current = (forward[0] || wrap[0] || { b: current }).b; AU.play('menu', 1.1, .5);
  }
  PAD.focus = { x: current.x, y: current.y, w: current.w, h: current.h }; [Input.mx, Input.my] = padPoint(current);
}
function padBack() {
  if (FSQ.open) { fsChoose(1); return; }
  if (!NAMEED.open && !OVL.open && !G.hintQ && !IVU.detail && ivOn() && IV_UI.has(G.state)) {
    if (G.state === 'ivrole') toMenu(); else if (G.state === 'ivstart') padPulse('Escape');
    else if (IVU.pop) padPulse('Escape'); else openPause(G.state);
  } else padPulse('Escape');
}
function padMenu(x, y, rx, ry, down, edge, dt) {
  const direction = padDirection(x, y, down, dt), movingCursor = !!(rx || ry), list = PAD.drawn === padContext() ? padTargets() : [];
  if (movingCursor) { PAD.cursor = true; PAD.focus = null; Input.mx = clamp(Input.mx + rx * 230 * padCursorSpeed() * dt, 1, W - 2); Input.my = clamp(Input.my + ry * 230 * padCursorSpeed() * dt, 1, H - 2); }
  if (direction) {
    PAD.cursor = false;
    if (list.length) padFocusMove(list, direction); else padPulse('Arrow' + direction);
  } else if (list.length && !PAD.cursor) padFocusMove(list, '');
  if (edge(1) || edge(9)) { padBack(); return; }
  // Confirm is one action: shop Enter starts the next wave, so focused cards use clicks only.
  if (edge(0)) {
    if (PAD.cursor || list.length || G.state === 'bossintro') Input.clicked = true;
    else padPulse('Enter');
  }
  if (edge(2) && ['cards', 'curse', 'ivshop', 'ivlv'].includes(G.state) && !IVU.detail) padPulse('KeyR');
  if (edge(3) && G.state === 'cards') padPulse('KeyX');
  if (edge(4) && G.state === 'cards') padPulse('KeyZ');
  if (IVU.detail) { padPulse('PageUp', edge(4)); padPulse('PageDown', edge(5)); }
  else if (!['cards', 'curse'].includes(G.state)) { if (edge(4)) Input.wheel--; if (edge(5)) Input.wheel++; }
  if (edge(8) && G.state === 'cards') padPulse('Tab');
}
function gamepadPre(rdt) {
  padClear(); const dt = clamp(rdt, 0, .05);
  if (PAD.suspended || document.hidden) return;
  const all = padRead(), supported = all.filter(p => p.mapping === 'standard' && p.axes && p.buttons);
  let p = supported.find(p => p.index === PAD.index && p.id === PAD.id);
  if (PAD.index !== null && !p) padDisconnect();
  const live = q => { const [x,y] = padStick(q,0), [rx,ry] = padStick(q,2); return x || y || rx || ry || padButtons(q).some(Boolean); };
  if (!p || !PAD.active) p = supported.find(live) || p || supported[0];
  if (!p) { if (PAD.status !== 'blocked' && PAD.status !== 'unavailable') PAD.status = all.length ? 'unsupported' : 'waiting'; return; }
  PAD.status = 'ready'; const down = padButtons(p), [x,y] = padStick(p,0), [rx,ry] = padStick(p,2), active = down.some(Boolean) || x || y || rx || ry;
  if (PAD.neutral) { PAD.prev = down; if (active) return; PAD.neutral = false; }
  if (!PAD.active && !active) return;
  const newlyActive = !PAD.active || PAD.index !== p.index || PAD.id !== p.id;
  if (newlyActive) {
    PAD.active = true; PAD.index = p.index; PAD.id = p.id; PAD.aim = G.p ? G.p.aim : 0; PAD.aimed = false; PAD.cursor = false; PAD.focus = null;
    PAD.blocked = new Set(down.flatMap((on,i) => on ? [i] : [])); PAD.prev = down; PAD.context = ''; PAD.nav = '';
    for (const k of TOUCH.held) Input.keys[k] = false;
    if (TOUCH.on) Input.down = Input.clicked = false;
    TOUCH.on = false; TOUCH.ids = {}; TOUCH.joy = null; TOUCH.jx = TOUCH.jy = 0; TOUCH.target = null; TOUCH.queue = []; TOUCH.held = [];
    try { AU.init(); AU.startDrone(); } catch (e) { }
    padNotice(padText('CONTROLLER READY · SETTINGS / CONTROLLER', '手柄已接管 · 設定中可查看操作', 'コントローラー接続・設定で操作を確認', '手柄已接管 · 设置中可查看操作'));
  }
  const previous = PAD.prev; PAD.prev = down;
  for (const i of PAD.blocked) if (!down[i]) PAD.blocked.delete(i);
  const context = padContext();
  if (context !== PAD.context) {
    for (let i=0;i<down.length;i++) if (down[i] && previous[i]) PAD.blocked.add(i);
    PAD.context = context; PAD.focus = null; PAD.cursor = false; PAD.nav = ''; PAD.repeat = 0;
  }
  const edge = i => down[i] && !previous[i] && !PAD.blocked.has(i), held = i => down[i] && !PAD.blocked.has(i);
  const playing = inPlay() && !NAMEED.open && !OVL.open && !WC.open && !FSQ.open;
  if (!playing) { padMenu(x,y,rx,ry,down,edge,dt); return; }
  TOUCH.target = null; TOUCH.setAim = false; G.aimX = G.aimY = undefined;
  if (edge(9)) { padPulse('Escape'); return; }
  if (edge(8) || edge(13)) { if (ivOn()) openPause('play'); else padPulse('Tab'); return; }
  if (G.tpPause) {
    Input.mx = clamp(Input.mx + (rx || x) * 230 * padCursorSpeed() * dt, 1, W-2);
    Input.my = clamp(Input.my + (ry || y) * 230 * padCursorSpeed() * dt, 1, H-2);
    if (edge(0) || edge(7)) Input.clicked = true;
    if (edge(5) || edge(1)) endSkill(); return;
  }
  Input.padX = x; Input.padY = y;
  if (rx || ry) { PAD.aim = Math.atan2(ry,rx); PAD.aimed = true; }
  else if (!PAD.aimed && (x || y)) PAD.aim = Math.atan2(y,x);
  Input.mx = G.p.x - G.cam.x + Math.cos(PAD.aim) * 110; Input.my = G.p.y - G.cam.y + Math.sin(PAD.aim) * 110;
  Input.padFire = held(7) && !ivOn();
  padPulse('Space', edge(1) || edge(6)); padPulse('KeyE', edge(0)); padPulse('KeyR', edge(2)); padPulse('KeyX', edge(3));
  padPulse('SkillBtn', edge(5)); padPulse('KeyF', edge(4)); padPulse('KeyQ', edge(12));
}

// Xbox labels are the standard-layout baseline; other families follow the same physical positions.
function padFamily() {
  if (['xbox','ps','switch'].includes(SET.padLabels)) return SET.padLabels;
  if (/dualsense|dualshock|playstation|sony|054c/i.test(PAD.id)) return 'ps';
  if (/nintendo|switch|057e/i.test(PAD.id)) return 'switch'; return 'xbox';
}
function padLabel(i) {
  const family = padFamily(), labels = family === 'ps' ? ['×','○','□','△','L1','R1','L2','R2','SHARE','OPTIONS'] : family === 'switch' ? ['B','A','Y','X','L','R','ZL','ZR','−','+'] : ['A','B','X','Y','LB','RB','LT','RT','VIEW','MENU'];
  return labels[i] || ['L3','R3','↑','↓','←','→'][i-10] || '';
}
const _keyCapPad = keyCap; keyCap = function(k,...args) {
  if (PAD.active && inPlay()) k = ({E:padLabel(5),F:padLabel(4),Q:'↑'})[k] || k;
  return _keyCapPad(k,...args);
};
const _menuItemsPad = menuItems; menuItems = function(page) {
  if (page === 'gamepad') {
    const adjust = (key, value) => { SET[key] = value; saveSettings(); AU.play('menu',1.1); };
    const labels = ['auto','xbox','ps','switch'], cycle = d => { const at = Math.max(0, labels.indexOf(SET.padLabels || 'auto')); adjust('padLabels', labels[(at+d+labels.length)%labels.length]); };
    return [
      { l:()=>padText('STICK DEADZONE','搖桿死區','スティックのデッドゾーン','摇杆死区'), v:()=>Math.round(padDeadzone()*100)+'%', adj:d=>adjust('padDeadzone',clamp(Math.round((padDeadzone()+d*.02)*100)/100,.1,.4)), act:()=>adjust('padDeadzone',padDeadzone()>=.4?.1:Math.round((padDeadzone()+.02)*100)/100) },
      { l:()=>padText('CURSOR SPEED','光標速度','カーソル速度','光标速度'), v:()=>padCursorSpeed().toFixed(1)+'x', adj:d=>adjust('padCursorSpeed',clamp(Math.round((padCursorSpeed()+d*.1)*10)/10,.5,2)), act:()=>adjust('padCursorSpeed',padCursorSpeed()>=2?.5:Math.round((padCursorSpeed()+.1)*10)/10) },
      { l:()=>padText('BUTTON LABELS','按鍵圖示','ボタン表示','按键图标'), v:()=>({auto:padText('AUTO','自動','自動','自动'),xbox:'Xbox',ps:'PlayStation',switch:'Switch'})[SET.padLabels || 'auto'] || 'AUTO', adj:cycle, act:()=>cycle(1) },
      { l:()=>L('back'), act:()=>backPage() }
    ];
  }
  const items = _menuItemsPad(page); if (page === 'settings') items.splice(items.length-1,0,{l:()=>padText('CONTROLLER','手柄','コントローラー'),act:()=>goPage('gamepad')}); return items;
};
const _menuLayoutPad = menuLayout; menuLayout = function(page) { return page === 'gamepad' ? {x:48,y:55,w:W-96,step:17,sc:1} : _menuLayoutPad(page); };
const _setRowsPad = setRows; setRows = function() {
  const rows = _setRowsPad(); if (!TBAR.sub.length) rows.push({ l:()=>padText('CONTROLLER','手柄','コントローラー'), sub:true, act:()=>goPage('gamepad') }); return rows;
};
// Controller Back can pause inter-wave screens, which must resume at that same screen.
const _resumeFromPausePad = resumeFromPause; resumeFromPause = function() {
  const ret = G.pauseRet; _resumeFromPausePad(); if (ivOn() && IV_UI.has(ret)) G.state = ret;
};
WIN_PAGES.add('gamepad');
function drawGamepadSettings() {
  panel(padText('CONTROLLER','手柄','コントローラー'),TH.ember);
  const status = {ready:padText('CONNECTED','已連接','接続済み','已连接'),waiting:padText('PRESS ANY CONTROLLER BUTTON','按下任意手柄按鍵連接','コントローラーのボタンを押す','按下任意手柄按键连接'),unsupported:padText('USE STANDARD / XINPUT MODE','請切換手柄至標準 / XInput 模式','標準 / XInput モードに切替','请切换手柄至标准 / XInput 模式'),unavailable:padText('GAMEPAD API UNAVAILABLE','此瀏覽器不支援手柄','このブラウザーは未対応','此浏览器不支持手柄'),blocked:padText('HOST HAS NOT ENABLED CONTROLLERS','宿主頁面未開放手柄權限','埋め込み元でゲームパッドを許可してください','宿主页面未开放手柄权限')}[PAD.status];
  text(fitText(status || '',W-96),48,34,PAD.status==='ready'?TH.green:TH.dim); drawMenuList('gamepad');
  rect(48,128,W-96,1,TH.line2);
  const rows = [
    ['LS',padText('MOVE / SELECT','移動 / 選擇','移動 / 選択','移动 / 选择')],['RS',padText('AIM / MENU CURSOR','瞄準 / 選單光標','照準 / メニューカーソル','瞄准 / 菜单光标')],
    [padLabel(0),padText('INTERACT / CONFIRM','互動 / 確認','調べる / 決定','互动 / 确认')],[padLabel(1)+' / '+padLabel(6),padText('DASH; RIGHT FACE BACK','閃避；右側鍵返回','回避・右ボタンで戻る','闪避；右侧键返回')],
    [padLabel(7),padText('FIRE / TELEPORT','攻擊 / 瞬移確認','攻撃 / テレポート決定','攻击 / 瞬移确认')],[padLabel(2),padText('RELOAD / REROLL','換彈 / 刷新','リロード / 引き直し','换弹 / 刷新')],
    [padLabel(3),padText('SWAP / EXCLUDE SERUM','切換武器 / 排除血清','武器切替 / 血清を除外','切换武器 / 排除血清')],[padLabel(5)+' / '+padLabel(4),padText('SKILL / RADIO PARTNER','技能 / 電台夥伴','スキル / 無線仲間','技能 / 电台伙伴')],
    ['↑ / '+padLabel(8),padText('SUPPORT / INVENTORY','支援 / 已擁有物品','支援 / 所持品','支援 / 已拥有物品')],[padLabel(9),padText('PAUSE / BACK','暫停 / 返回','一時停止 / 戻る','暂停 / 返回')]
  ];
  rows.forEach(([k,s],i)=>{const x=i%2?W/2+6:48,y=139+Math.floor(i/2)*17;const w=Math.min(60,textW(k)+8);box(x,y-2,w,12,'#14120f',TH.line2);text(k,x+w/2,y,TH.bone,1,'center');text(fitText(s,W/2-w-62),x+w+6,y,TH.bone2);});
  text(fitText(padText('MENUS: RS CURSOR · LB/RB SCROLL. INVASION FIRES AUTOMATICALLY.','選單：右搖桿移動光標，肩鍵捲動。入侵抵抗自動攻擊。','メニュー：右スティックでカーソル、L/Rでスクロール。侵入抵抗は自動攻撃。','菜单：右摇杆移动光标，肩键滚动。入侵抵抗自动攻击。'),W-96),48,231,TH.dim);
  text(fitText(padText('SERUM CHOICE: LB SKIPS. TEXT ENTRY USES THE KEYBOARD.','血清選擇時左肩鍵跳過；輸入文字仍使用鍵盤。','血清選択ではLでスキップ。文字入力はキーボード。','血清选择时左肩键跳过；输入文字仍使用键盘。'),W-96),48,244,TH.dim);
}
function drawGamepadUI(dt) {
  if (FSQ.open && !TOUCH.on) drawFSQ();
  PAD.drawn = padContext();
  if (PAD.active && PAD.focus && !PAD.cursor && PAD.context === PAD.drawn) {
    const b = PAD.focus, c = TH.emberHi; ctx.save(); ctx.globalAlpha=.9;
    for(const [x,y,dx,dy] of [[b.x-2,b.y-2,1,1],[b.x+b.w+2,b.y-2,-1,1],[b.x-2,b.y+b.h+2,1,-1],[b.x+b.w+2,b.y+b.h+2,-1,-1]]) { pxLine(x,y,x+dx*6,y,c);pxLine(x,y,x,y+dy*6,c); } ctx.restore();
  }
  if (PAD.toast) { PAD.toast.t-=dt; if(PAD.toast.t<=0){PAD.toast=null;return;}const s=fitText(PAD.toast.s,W-36),w=textW(s)+16,x=Math.round((W-w)/2);ctx.save();ctx.globalAlpha=Math.min(1,PAD.toast.t);box(x,H-18,w,14,'#0e0d0b',TH.line2);text(s,W/2,H-14,TH.bone2,1,'center');ctx.restore(); }
}
