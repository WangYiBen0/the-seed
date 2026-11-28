// ===== TSW cheats — 锁血 / 无敌 / 指令台 =====================================
// 无敌 (god): damage is nullified at the single choke point (hurtPlayer).
// 锁血 (hpLock): damage HAPPENS, but health is clamped back up every tick and
//   after every hit — two genuinely different cheats (god ignores everything;
//   hpLock still consumes armor, triggers on-hurt effects and DOT ramps).
// 指令台: TSW.cmd('…') + panel input + F10.  All cheats are local-test tools;
//   enabling one flags the HUD with CHEAT and marks benchmark rows as cheated.
'use strict';
(function () {
  const TSW = window.__TSW; if (!TSW || TSW.cheats) return;
  const C = TSW.cheats = {
    god: false,
    hpLock: 0,                    // 0 = off, otherwise the locked HP value
    on() { return !!(this.god || this.hpLock > 0); },
    label() { const l = []; if (this.god) l.push('无敌'); if (this.hpLock > 0) l.push('锁血' + this.hpLock); return l.join('+') || null; },
  };
  TSW.bus.on('tick', () => { });  // (sampler already ticks elsewhere)

  TSW.whenGame().then(() => {
    // single choke point: every damage path (bullets, mechs, spikes, pits, DOT
    // via killEnemy? no — dot subtracts e.hp/hp directly) funnels through hurtPlayer.
    const orig = window.hurtPlayer;
    window.hurtPlayer = function (...a) {
      if (C.god) return false;                     // 无敌：伤害完全无效
      const r = orig.apply(this, a);
      const p = window.__achroma && __achroma.G && __achroma.G.p;
      if (C.hpLock > 0 && p && p.alive) p.hp = Math.max(p.hp, Math.min(C.hpLock, p.maxHp));
      return r;
    };
    TSW.cheats._hooked = true;
  });
  // per-tick clamp: catches multi-hit frames and DOT that bypasses hurtPlayer
  TSW.hooks.beforeTick(() => {
    const G = window.__achroma && __achroma.G;
    if (C.hpLock > 0 && G && G.p && G.p.alive && G.p.hp < C.hpLock) G.p.hp = Math.min(C.hpLock, G.p.maxHp);
  });

  // ---------------- 指令台 ----------------
  const H = [];
  const cmd = (names, help, fn) => H.push({ names, help, fn });
  cmd(['help', '?'], '列出指令', () => H.map((c) => '  ' + c.names.join('/') + ' — ' + c.help).join('\n'));
  cmd(['god', '无敌'], '无敌 开/关', (a) => { C.god = a[0] ? a[0] !== 'off' : !C.god; return '无敌 ' + (C.god ? 'ON' : 'OFF'); });
  cmd(['lockhp', '锁血'], '锁血 <n>（0 关闭）', (a) => { C.hpLock = Math.max(0, +a[0] || 0); return '锁血 ' + (C.hpLock || 'OFF'); });
  cmd(['hp'], '设置当前血量 <n>', (a) => { const p = __achroma.G.p; p.hp = Math.max(1, Math.min(+a[0] || p.maxHp, p.maxHp)); return 'HP=' + p.hp; });
  cmd(['heal', '奶'], '满血满甲', () => { const p = __achroma.G.p; p.hp = p.maxHp; p.armor = p.maxArmor; return '已回满'; });
  cmd(['ink', '墨水'], '加墨水 <n>', (a) => { __achroma.G.ink += +a[0] || 100; return '墨水 ' + __achroma.G.ink; });
  cmd(['kill', '清怪'], '清空当前房间敌人', () => { let n = 0; for (const e of __achroma.G.enemies) if (!e.dead && e.spawnT <= 0) { killEnemy(e, {}); n++; } return '清了 ' + n; });
  cmd(['next', '下 layer'], '下一层', () => { beginFloorTransition(__achroma.G.endless ? endlessFloor() : Math.min(FLOORS.length - 1, __achroma.G.floor + 1)); return '下…'; });
  cmd(['endless', '无尽'], '进入无尽', () => { if (!__achroma.G.endless) startEndless(); return '无尽 ' + (__achroma.G.endless || ''); });
  cmd(['weapon', '武器'], 'weapon <id>（第二把则替换副手）', (a) => { if (!WEAPONS[a[0]]) return '未知武器: ' + a[0]; giveWeapon(a[0], __achroma.G.p.x, __achroma.G.p.y); return '武器 ' + a[0]; });
  cmd(['shard', '血清'], 'shard <id> [级]', (a) => { if (!SHARD[a[0]]) return '未知血清: ' + a[0]; const p = __achroma.G.p; p.shards[a[0]] = Math.min(SHARD[a[0]].max || 1, +a[1] || (p.shards[a[0]] || 0) + 1); recomputeStats(); computeTints(); return sname(SHARD[a[0]]) + ' LV' + p.shards[a[0]]; });
  cmd(['skill', '芯片'], 'skill <id>', (a) => { if (!SKILLS[a[0]]) return '未知芯片: ' + a[0]; installChip(a[0], __achroma.G.p.x, __achroma.G.p.y); return '芯片 ' + a[0]; });
  cmd(['spawn', '刷怪'], 'spawn <type> [n]', (a) => { const n = Math.min(20, +a[1] || 3); for (let i = 0; i < n; i++) { const ang2 = i / n * 6.283, x = __achroma.G.p.x + Math.cos(ang2) * 90, y = __achroma.G.p.y + Math.sin(ang2) * 70; if (!collides(x, y, 6, false)) spawnEnemy(a[0] || 'crawler', x, y, { room: roomAt(x, y) }); } return 'spawned ' + n; });
  cmd(['speed', '倍速'], 'speed <x>', (a) => { TSW.speed.set(+a[0] || 1); return '×' + TSW.speed.get(); });
  cmd(['mode', '挂机'], 'mode <off|combat|full>', (a) => { TSW.auto.setMode(a[0] || 'off'); return 'mode ' + TSW.auto.mode; });
  cmd(['policy', '流派'], 'policy <名>', (a) => { TSW.auto.setPolicy(a[0] || 'balanced'); return 'policy ' + TSW.auto.policy; });
  cmd(['state'], '打印状态', () => JSON.stringify(TSW.info()));

  TSW.cmd = function (line) {
    const parts = String(line || '').trim().split(/\s+/);
    if (!parts[0]) return '';
    const c = H.find((q) => q.names.includes(parts[0].toLowerCase()));
    if (!c) return '未知指令（help 查看列表）';
    try { return String(c.fn(parts.slice(1)) ?? '(ok)'); } catch (e) { return 'err: ' + e.message; }
  };
  TSW.cmd.list = H;
  TSW.cheats._cmd = TSW.cmd;
  TSW.log('cheats ready (god/lockhp/cmd)');
})();
