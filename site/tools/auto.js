// ===== TSW auto — 自动挂机 / autopilot =======================================
// Steers the player through the game's own public input state (Input, the same
// object the engine's listeners write) from a beforeTick hook — no game file is
// touched.  Modes:
//   combat — fight & loot in the current floor, no purchases
//   full   — explore (BFS over the room graph), fight, loot, heal, shop,
//            pick serums per policy, take the endless portal, auto-restart
// Policies = the game's own 12 invasion preferences; each reweights serum/weapon picks.
'use strict';
(function () {
  const TSW = window.__TSW; if (!TSW || TSW.auto) return;

  const A = TSW.auto = {
    mode: TSW.settings.get('autoMode', 'off'),        // off | combat | full
    policy: TSW.settings.get('autoPolicy', 'rounded'),  // 12 个入侵偏好之一，见 POLICY_W
    opts: {
      autoCards: TSW.settings.get('autoCards', true),
      autoRestart: TSW.settings.get('autoRestart', true),
      preferEndless: TSW.settings.get('preferEndless', true),
      shop: TSW.settings.get('autoShop', true),
      forge: TSW.settings.get('autoForge', true),
      dash: TSW.settings.get('autoDash', true),
      noFire: false,                                       // dodge-bench stress mode: never shoot
      // ---- fine-grained "wire it up" switches (panel: 挂机 → 细项) ----
      chest: TSW.settings.get('autoChest', true),          // open chests
      labSerum: TSW.settings.get('autoLabSerum', true),    // inject the experimental serum in the lab
      fount: TSW.settings.get('autoFount', false),         // healing founts: off by default
      weaponPick: TSW.settings.get('autoWeaponPick', true),// walk to floor weapons / take better ones
      chipPick: TSW.settings.get('autoChipPick', true),    // pick skill chips
      pickups: TSW.settings.get('autoPickups', true),      // prisms & keys
      arsenal: TSW.settings.get('autoArsenal', true),      // visit the armory rack
      dialysis: TSW.settings.get('autoDialysis', false),   // dialysis machine: off by default
      // ---- 战斗动作开关（用户要求可逐项禁用） ----
      skill: TSW.settings.get('autoSkill', true),          // cast the skill chip (E)
      reload: TSW.settings.get('autoReload', true),        // active reload to dodge the passive-reload damage
      partner: TSW.settings.get('autoPartner', true),      // radio partner skill (KeyF)
      weaponSwap: TSW.settings.get('autoWeaponSwap', true),// swap to the sidearm during a reload
      mate: TSW.settings.get('autoMate', true),            // recruit survivors at camp fires
      dashHazards: TSW.settings.get('autoDashHazards', true), // refuse dashes into hazards/void
      weaponDps: false,                                      // explore: fold real DPS into weapon scoring
      armorWaitT: 3,                                         // explore: match the game's real armour-regen start (lastHit > 3)
      forgeGiveUp: 25,                                       // explore: seconds before abandoning a stuck forge
      forgeFirst: true,                                      // explore: visit a forge before combat when affordable
      specialsFirst: TSW.settings.get('autoSpecialsFirst', true),                                   // explore: detour to special rooms before combat
      powerupFirst: TSW.settings.get('autoPowerupFirst', true),                                    // explore: grab weapons/chips/serums before fights
      meleeBlock: TSW.settings.get('autoMeleeBlock', true),                                      // explore: swing to deflect incoming bullets with melee
      weaponLateBias: TSW.settings.get('autoWeaponLateBias', 90),                                    // explore: ink level at which per-shot damage starts to weigh more
      shardFit: TSW.settings.get('autoShardFit', true),                                        // explore: score shards by fit to the held weapon
      keyRoomFirst: TSW.settings.get('autoKeyRoomFirst', true),                                    // explore: clear the key room before anything else
      mainHandBest: TSW.settings.get('autoMainHandBest', true),                                    // explore: hold the strongest weapon in the main hand
      arsenalByDps: TSW.settings.get('autoArsenalByDps', true),                                    // explore: pick the armoury weapon by measured dps
      shopByDps: TSW.settings.get('autoShopByDps', true),                                       // explore: rank shop weapons by measured dps
      deathfightHazard: TSW.settings.get('autoDeathfightHazard', true),                                // explore: treat death-fight corpses as hazard
      bossCriticalRetreat: TSW.settings.get('autoBossCriticalRetreat', true),                             // explore: disengage at 1 hp in a boss room
      bossAddsFirst: TSW.settings.get('autoBossAddsFirst', true),                                   // explore: clear summoned adds before the boss itself
      rushBoss: TSW.settings.get('autoRushBoss', false),                                       // explore: defer reward rooms to reach the boss sooner
      bossPrepHeal: TSW.settings.get('autoBossPrepHeal', true),                                    // explore: heal up before opening the boss seal
      focusFire: TSW.settings.get('autoFocusFire', true),                                       // explore: keep hitting one target until it dies
      fireWhileRetreat: TSW.settings.get('autoFireWhileRetreat', true),                                // explore: keep firing while backing off
      powerupRange: TSW.settings.get('autoPowerupRange', 700),                                     // explore: how far to walk for a loose weapon/chip
      vault: TSW.settings.get('autoVault', true),                                           // explore: open the vault when ink allows
      idol: TSW.settings.get('autoIdol', true),                                            // explore: take an idol wish with a curse
      altar: TSW.settings.get('autoAltar', true),                                           // explore: use blood altars
      altarPact: TSW.settings.get('autoAltarPact', true),                                       // explore: trade 1 hp for a card at an altar
      trial: TSW.settings.get('autoTrial', true),                                           // explore: start trial totems
      fireWithoutLos: TSW.settings.get('autoFireWithoutLos', false),                                 // explore: shoot point-blank without clear sight
      noLosRange: TSW.settings.get('autoNoLosRange', 150),                                       // explore: range at which sight is not required
      fullHpGate: TSW.settings.get('autoFullHpGate', true),                                      // explore: heal to full before descending
      goalGiveUp: TSW.settings.get('autoGoalGiveUp', 90),                                        // explore: seconds before abandoning ANY stuck objective (90 measured 9/12 vs 4/12 at 40)
      wallMargin: TSW.settings.get('autoWallMargin', 14),                                        // explore: px of clearance we prefer to keep from walls
      openSeals: true,                                       // explore: walk to the boss seal and open it
      usePortals: true,                                      // explore: walk to the floor/endless portal
      navFallback: TSW.settings.get('autoNavFallback', true), // break out of zero-movement wedges
      invadeCircle: true,                                    // invade: circulate instead of straight backoff
      invadeShop: TSW.settings.get('autoInvadeShop', true),  // invade: buy between waves
      invadeCombine: TSW.settings.get('autoInvadeCombine', true), // invade: merge duplicate weapons
      invadeLvStyle: 'dps',                                   // invade: 'dps' | 'tank' upgrade order
      invadeShopStyle: 'weapon',                             // invade: 'weapon' | 'dps' (weapon-only measured better, CI-confirmed)
      invadeSell: TSW.settings.get('autoInvadeSell', true),   // invade: sell the weakest weapon when slots are full
      invadeSets: true,                                      // invade: prefer weapons that complete a set
      invadeDupStyle: 'normal',                              // invade: 'normal' | 'strong' duplicate-weapon priority
      invadeReroll: true,                                    // invade: reroll the shop when it has no weapon
      invadeRerollCap: 3,                                    // max rerolls per wave
      invadeEscape: TSW.settings.get('autoInvadeEscape', true), // invade: break toward the emptiest sector when surrounded
      exploreOrder: 'fight',                                  // explore: 'fight' | 'resources' (specials before combat rooms)
      forgeMode: 'held',                                     // explore: 'held' | 'any' (upgrade any equipped weapon)
      pickupOrder: 'eager',                                  // explore: 'eager' | 'clear-first' (defer loose drops)
      invadeBossSafe: true,                                  // invade: keep clear of the boss's contact damage
      bossOrder: 'early',                                    // explore: 'early' | 'late' (clear rooms before the boss)
      shopShardBar: 2,                                       // explore: minimum scoreShard to buy a shop serum
      fightSM: false,                                        // explore: three-state combat machine (measured: not significant, -33s, so off by default)
      manual: TSW.settings.get('autoManual', true),        // yield the controls when the player steers
    },
    // evasion scorecard, accumulated per play tick (see the dodge benchmark)
    metrics: { ticks: 0, dangerSum: 0, hazard: 0, clearSum: 0, clearMin: 1e9, samples: [], dash: 0, navStall: 0, navReplan: 0 },
    status: { note: '', target: null },
  };
  const set = (k, v) => { A.opts[k] = v; TSW.settings.set(k, v); };
  A.metrics.reset = () => { const m = A.metrics; m.ticks = 0; m.dangerSum = 0; m.hazard = 0; m.clearSum = 0; m.clearMin = 1e9; m.samples = []; m.dash = 0; m.navStall = 0; m.navReplan = 0; };
  A.setMode = (m) => { A.mode = m; TSW.settings.set('autoMode', m); TSW.bus.emit('auto'); };
  A.setPolicy = (p) => { A.policy = p; TSW.settings.set('autoPolicy', p); TSW.bus.emit('auto'); };

  // ---------------- scoring tables ----------------
  const RARW = [1, 2.2, 3.2, 4.2];
  // ---- 12 个流派 = 入侵抵抗的 12 个偏好（名字取自游戏自身，实质由我们定义） ----
  // rounded 均衡适应 · brawler 近身搏击 · crazy 精准猛攻 · ranger 远距火力
  // mage 元素反应 · chunky 厚重生存 · old 稳守缓进 · lucky 幸运搜集
  // engineer 工程布防 · doctor 医疗续航 · mutant 快速蜕变 · loud 喧嚣引敌
  const POLICY_W = {
    // 均衡适应：什么都拿一点，优先能形成协同的通用卡
    rounded: { heavy: 1.5, frenzy: 1.5, keen: 1.4, fork: 1.5, needle: 1.3, rime: 1.2, ember: 1.2, vital: 1.2, plate: 1.2, bloom: 1.25, big: 1.2, leech: 1.2, echo: 1.2 },
    // 近身搏击：贴脸打，靠弹射/处决/走砍，血厚一点撑住近身交换
    brawler: { needle: 2, rico: 1.9, lead: 1.6, guill: 2.1, moment: 1.7, overk: 1.5, plate: 1.4, vital: 1.3, leech: 1.4, swift: 1.3, veil: 1.2 },
    // 精准猛攻：暴击/标记/全押，玻璃大炮但只吃精准武器
    crazy: { keen: 2.6, mark: 2.4, heavy: 1.8, frenzy: 1.9, allin: 1.5, focus: 1.4, guill: 1.4, lastround: 1.3, moment: 1.2, glass: 1.2, big: 1.2 },
    // 远距火力：拉远打，远距增伤 + 暴露标记，近身卡一律不碰
    ranger: { farshot: 2.4, expose: 1.8, keen: 1.8, mark: 1.6, heavy: 1.5, frenzy: 1.5, seeker: 1.4, focus: 1.3, needle: 0.6, moment: 0.6, guill: 0.8, plate: 1.1, vital: 1.1 },
    // 元素反应：四元素 + prism，靠状态叠伤与群体协同
    mage: { ember: 2.2, venom: 2.2, arc: 1.9, rime: 1.9, prism: 2.4, seeker: 1.3, stat: 1.2, keen: 1.1, plate: 1.2, vital: 1.2, leech: 1.2, quick: 1.2 },
    // 厚重生存：血上限/护甲/吸血，站桩打完再走
    chunky: { plate: 2.6, vital: 2.6, leech: 2.1, big: 1.4, frenzy: 1.2, heavy: 1.2, keen: 1.1, spite: 1.3, quick: 1.2 },
    // 稳守缓进：慢节奏，回血/护甲恢复优先，只打必打的房间
    old: { plate: 2.2, vital: 2.2, leech: 1.9, quick: 1.5, after: 1.4, swift: 1.3, spite: 1.3, veil: 1.2, frenzy: 1.2, heavy: 1.2 },
    // 幸运搜集：拾取/贪婪/赏金，靠经济与掉落滚雪球
    lucky: { greed: 2.4, bounty: 2.2, jackpot: 1.9, scrap: 1.8, perfect: 1.5, allin: 1.3, keen: 1.3, stat: 1.3, plate: 1.2, vital: 1.2, leech: 1.2 },
    // 工程布防：无人机/炮台/召唤物，自动火力为主
    engineer: { drone: 2.6, sat: 2.3, stat: 2, summon: 1.9, deploy: 1.7, fork: 1.6, seeker: 1.3, plate: 1.2, vital: 1.2, leech: 1.2 },
    // 医疗续航：吸血 + 上限 + 再生，打得慢但很难死
    doctor: { leech: 2.6, vital: 2.1, plate: 1.9, after: 1.5, spite: 1.4, quick: 1.3, heavy: 1.2, frenzy: 1.2, keen: 1.2 },
    // 快速蜕变：经验/成长类，早升级早滚雪球
    mutant: { stat: 2.3, greed: 1.8, keen: 1.5, frenzy: 1.5, heavy: 1.4, fork: 1.4, bloom: 1.3, echo: 1.3, plate: 1.1, vital: 1.2 },
    // 喧嚣引敌：全输出，靠更快的清怪速度抵消更密的波次
    loud: { frenzy: 2.3, heavy: 2.1, overk: 2, keen: 1.9, fork: 1.8, echo: 1.7, rico: 1.5, bloom: 1.4, big: 1.4, moment: 1.3, plate: 1.1 },
  };
  // weapon class preference per policy (higher = take it / buy it)
  const WEAPON_W = {
    rounded: { rail: 5, scatter: 5, lance: 4.5, volt: 4, bow: 4, twin: 3.5, rivet: 3.5, nail: 3, halo: 3, splinter: 3 },
    brawler: { edge: 5.5, lance: 5.5, whirl: 5, hammer: 5, iai: 5, scythe: 5, axe: 4.5, chainsaw: 4.5, flail: 4, fist: 4, baton: 4 },
    crazy: { rail: 6, longshot: 6, trident: 5, scatter: 5, slug: 4.5, crescent: 4.5, lance: 4.5, harpoon: 4, rivet: 4 },
    ranger: { rail: 6.5, longshot: 6.5, bow: 5.5, crossbow: 5.5, lance: 5, scatter: 4.5, slug: 4.5, trident: 4.5, edge: 1.5, fist: 1.5 },
    mage: { flamer: 6, frostbite: 5.5, helix: 5, splinter: 5, hive: 4.5, gas: 4.5, prism: 4.5, volt: 4, twin: 4 },
    chunky: { hammer: 5.5, whirl: 5, edge: 4.5, graviton: 4.5, mines: 4.5, halo: 3.5, shuriken: 3.5, saw: 4 },
    old: { hammer: 5, whirl: 4.5, edge: 4.5, graviton: 4, mines: 4, halo: 4, hammer: 5, shuriken: 3.5 },
    lucky: { shuriken: 5, carom: 4.5, hail: 4.5, splinter: 4.5, twin: 4, halo: 4, mirage: 4, saw: 4 },
    engineer: { summon: 6, deploy: 5.5, hive: 5, hail: 4.5, twin: 4.5, splinter: 4, storm: 4 },
    doctor: { edge: 4.5, lance: 4.5, crescent: 4.5, volley: 4, halo: 4, splinter: 4, hammer: 3.5, rivet: 3.5 },
    mutant: { storm: 5, hail: 5, flamer: 4.5, twin: 4.5, splinter: 4.5, nail: 4, hive: 4, volt: 4 },
    loud: { hail: 6, storm: 6, flamer: 5.5, whirl: 5, saw: 4.5, twin: 5, splinter: 4.5, hammer: 4.5 },
  };
  // ---- 最终稳定状态（面板 goal.*）：目标武器/技能/搭档，命中即加权 ----------
  const goal = (k) => {
    try { const st = TSW && TSW.settings; return (st && typeof st.get === 'function' ? st.get('goal.' + k, '') : '') || ''; }
    catch (e) { return ''; }
  };
  A.goal = { weapon: () => goal('weapon'), skill: () => goal('skill'), radio: () => goal('radio'), mate: () => goal('mate') };
  const GOAL_W = 1.9;                                  // how strongly a match pulls
  // Real DPS of an explore weapon = damage x shots-per-second x projectiles.
  // The table below was previously the ONLY input, so the bot could hold a
  // 30-DPS-while-preferred peashooter over a much stronger gun.
  const wDps = (id) => {
    try {
      const w = WEAPONS[id]; if (!w) return 0;
      const rate = w.rate || (w.melee ? 1 : 1);
      const n = w.n || 1;
      return (w.dmg || 0) * rate * n;
    } catch (e) { return 0; }
  };
  // room types that can yield supplies, upgrades or a companion
  // ---- evolvable genome ---------------------------------------------------
  // Every tunable the evolution loop is allowed to touch lives here.  Values come
  // from A.opts.genome when present (the loop injects a candidate), otherwise
  // these defaults reproduce the hand-tuned behaviour exactly.
  const GENE_DEF = {
    dashDanger:   { def: 1.6,  min: .6,  max: 3.2 },   // dash when threat >= this
    bandNearLo:   { def: 40,   min: 20,  max: 90  },   // focus band lower
    bandNearHi:   { def: 90,   min: 50,  max: 160 },
    bandFarLo:    { def: 90,   min: 50,  max: 170 },
    bandFarHi:    { def: 150,  min: 90,  max: 260 },
    meleeLo:      { def: 28,   min: 16,  max: 60  },
    meleeHi:      { def: 49,   min: 30,  max: 90  },
    retreatHi:    { def: 250,  min: 170, max: 340 },
    goalGiveUp:   { def: 90,   min: 40,  max: 160 },
    wallMargin:   { def: 12,   min: 4,   max: 28  },
    hazardPad:    { def: 1,    min: .4,  max: 2.4 },   // risky-by-this-much pad
    aimLead:      { def: 1,    min: .4,  max: 1.8 },   // target leading factor
  };
  function gene(k) {
    const g = A.opts && A.opts.genome;
    if (g && typeof g[k] === 'number' && isFinite(g[k])) {
      const d = GENE_DEF[k];
      return Math.min(d.max, Math.max(d.min, g[k]));
    }
    return GENE_DEF[k].def;
  }
  A.geneDef = GENE_DEF; A.gene = gene;

  const SPECIAL_ROOM_TYPES = ['treasure', 'shop', 'camp', 'dialysis', 'barracks', 'forge', 'shrine', 'trial', 'idol', 'vault', 'arsenal'];
  const wScore = (id) => {
    try {
      let v = (WEAPON_W[A.policy] && WEAPON_W[A.policy][id]) || 2.5;
      const g = A.goal && A.goal.weapon ? A.goal.weapon() : '';
      if (id && g && id === g) v += GOAL_W;             // target weapon wins ties
      // optional DPS term (A/B: A.opts.weaponDps)
      // Per-shot damage matters MORE than raw dps, because every upgrade level
      // multiplies the base: a 26/shot hammer outgrows a 7/shot nail quickly.
      // docs/weapons.md has the full table.
      try {
        const ww = WEAPONS[id];
        if (ww && ww.dmg) {
          const per = (Array.isArray(ww.dmg) ? ww.dmg[0] : ww.dmg) * (ww.n || 1);
          v += Math.min(3, per / 12);                    // burst-ish bonus
          if ((ww.pierce | 0) >= 1) v += 1.2;            // piercing is worth a slot
          // Late-game scaling: every upgrade multiplies the BASE damage, so
          // a heavy single-shot weapon outgrows a fast peashooter.  Only bias
          // toward that when upgrades are actually reachable (ink in hand).
          const lvl = (A.opts.weaponLateBias === undefined) ? 90 : A.opts.weaponLateBias;
          if (lvl && (G.ink | 0) >= lvl) v += Math.min(2.5, per / 24);
        }
      } catch (e) { }
      // Several genuinely strong guns had NO entry in the policy table (storm 62
      // base dps, nova 137, mines 57, trident 54, shuriken 50), so the bot kept
      // preferring nail at 35.  Score every weapon by its measured base dps floor,
      // independent of the policy's curated picks.
      try {
        const baseDps = wDps(id);
        if (baseDps > 0) v += Math.min(5, Math.max(0, (baseDps - 30) / 20));
      } catch (e) { }
      if (A.opts.weaponDps) { const d = wDps(id); if (d > 0) v += Math.min(6, d / 10); }
      return v;
    } catch (e) { return 2.5; }
  };
  const CURSE_RANK = { greed: 0, hubris: 1, wrath: 2, surr: 3, seal: 4, coward: 5, sloth: 6, disaster: 7, time: 8, over: 9, tremor: 10, drought: 11 };

  function scoreShard(id, lv) {
    if (typeof SHARD === 'undefined') return 0; const s = SHARD[id]; if (!s) return 0;
    let v = RARW[s.rar] || 1;
    v *= (POLICY_W[A.policy] && POLICY_W[A.policy][id]) || 1;
    // stacking beyond lv2 gives diminishing value for most, but bloom chains want max levels
    if (lv >= 2) v *= (id === 'bloom' || id === 'shrap' || id === 'keen' || id === 'heavy' || id === 'frenzy') ? 1.1 : .8;
    // synergy hint: completing a pair is worth a lot
    try { if (typeof synergyHint === 'function' && synergyHint(id)) v *= 1.8; } catch (e) { }
    // never make yourself squishier while idle
    if (id === 'glass') v *= A.mode === 'full' ? .4 : 1;
    // ---- fit to the weapon actually held --------------------------------
    // A fixed rarity/policy table ignores what the gun can convert into damage:
    // AMMO shards are dead weight on a melee kit, ELEMENT/POWER shards are weak
    // on a 3-damage hose, FORM/CRIT shine on high-rate guns.  With only 2-4 cards
    // per run, spending them on mismatched shards is the whole problem.
    try {
      if (A.opts.shardFit === false) throw 0;
      const tag = s.tag || '';
      const p2 = G.p;
      const wid = p2 && p2.weapons ? p2.weapons[p2.wi] : null;
      const w = wid && WEAPONS[wid] ? WEAPONS[wid] : null;
      if (w) {
        const meleeW = isMelee(wid);
        const fast = (w.rate || 1) >= 8;              // spray weapons
        const slowBig = (w.dmg || 0) >= 18;           // heavy single-shot
        const elems = (w.sc && w.sc.elem) || w.burn || w.slow || w.chain || w.proc > .5;
        const mult = (f) => { v *= f; };
        if (tag === 'AMMO' && meleeW) mult(.25);      // no magazine at all
        if (tag === 'AMMO' && !meleeW) mult(1.1);
        if (tag === 'ELEMENT' && !elems) mult(.6);    // gun cannot apply it
        if (tag === 'ELEMENT' && elems) mult(1.35);
        if (tag === 'FORM' && fast) mult(1.25);       // copies on every shot
        if (tag === 'FORM' && slowBig) mult(.8);
        if (tag === 'CRIT' && fast) mult(1.2);        // more rolls per second
        if (tag === 'CRIT' && slowBig) mult(1.15);
        if (tag === 'POWER' && slowBig) mult(1.3);    // multiply a big base
        if (tag === 'POWER' && !slowBig) mult(.85);
        if (tag === 'KILL' && fast) mult(1.2);        // on-kill procs scale with dps
        if (tag === 'HUNT' && slowBig) mult(1.2);
        if (tag === 'MOVE' || tag === 'SURVIVE' || tag === 'ALLY') mult(1);   // neutral
        if (meleeW && (tag === 'CRIT' || tag === 'POWER')) mult(1.1);
      }
    } catch (e) { }
    return v;
  }

  // ---------------- room graph ----------------
  let navCache = null;
  function graph() {
    const G = __achroma.G;
    if (navCache && navCache.rid === G.rid && navCache.floor === G.floor) return navCache;
    const rooms = WORLD.rooms, adj = {}, doorOf = {};
    rooms.forEach((r) => { adj[r.id] = []; });
    for (const r of rooms) for (const [gx, gy] of r.doors) {
      const dx = Math.sign(gx - r.cx), dy = Math.sign(gy - r.cy);
      for (let step = 1; step <= 10; step++) {
        const tx = gx + dx * step, ty = gy + dy * step;
        const other = roomAt(tx * 16 + 8, ty * 16 + 8);
        if (other && other.id !== r.id) {
          if (!adj[r.id].includes(other.id)) { adj[r.id].push(other.id); adj[other.id].push(r.id); doorOf[r.id + ':' + other.id] = [gx * 16 + 8, gy * 16 + 8]; doorOf[other.id + ':' + r.id] = [gx * 16 + 8, gy * 16 + 8]; }
          break;
        }
      }
    }
    return navCache = { rid: G.rid, floor: G.floor, adj, doorOf, rooms };
  }
  function bfsPath(fromId, toId) {
    const { adj } = graph();
    if (fromId === toId) return [toId];
    const prev = { [fromId]: -1 }, q = [fromId];
    while (q.length) { const cur = q.shift(); for (const n of adj[cur] || []) if (!(n in prev)) { prev[n] = cur; if (n === toId) { const path = [n]; let c = n; while (prev[c] !== -1) { c = prev[c]; path.unshift(c); } return path; } q.push(n); } }
    return null;
  }

  // ---------------- helpers ----------------
  // the game's W/H are top-level `let` bindings (not on the window object) —
  // clamping against the wrong handle produced NaN, which the camera lerp
  // absorbed and blacked out the whole world pass (HUD kept drawing).
  const GW = () => (typeof W !== 'undefined' && isFinite(W)) ? W : 480;
  const GH = () => (typeof H !== 'undefined' && isFinite(H)) ? H : 270;
  const clampM = (v, hi) => {
    hi = (typeof hi === 'number' && isFinite(hi)) ? hi : 480;
    if (!isFinite(v)) v = hi / 2;
    return Math.max(1, Math.min(hi - 1, v));
  };
  const clickAt = (x, y) => { Input.mx = x; Input.my = y; Input.clicked = true; };
  const exclList = (k) => { const v = TSW.settings.get(k, []); return Array.isArray(v) ? v : []; };
  const excluded = (id) => exclList('serumExclude').includes(id);
  // BFS over the tile grid: real path around walls/pits instead of random wiggling
  // Every null return records WHY: start blocked, goal blocked, no route, or the
  // world not being ready.  Guessing at these was costing whole rounds.
  const navFail = (why) => { A._navFail = A._navFail || {}; A._navFail[why] = (A._navFail[why] || 0) + 1; return null; };
  function gridPath(p, tx, ty) {
    if (typeof WORLD === 'undefined' || !WORLD || !WORLD.tiles || typeof TL === 'undefined') return navFail('noWorld');
    const Wd = WORLD.w, Ht = WORLD.h, tiles = WORLD.tiles;
    const walkable = (gx, gy) => { if (gx < 0 || gy < 0 || gx >= Wd || gy >= Ht) return false; const t = tiles[gy * Wd + gx]; return t === TL.FLOOR || t === TL.SLUDGE; };
    // prefer routes that do not cross a live hazard; fall back to plain walkable
    // tiles when the only way through is past a blade/flame/pool.
    const hazardFree = (gx, gy) => hazardAt(gx * 16 + 8, gy * 16 + 8, 10, .3) < .9;
    const okT = (gx, gy) => walkable(gx, gy) && (A._plainPath === true || hazardFree(gx, gy));
    const sx = Math.floor(p.x / 16), sy = Math.floor(p.y / 16);
    const gx2 = Math.floor(tx / 16), gy2 = Math.floor(ty / 16);
    // A blocked START or GOAL used to abort the whole search.  That is fatal: when
    // the player is standing on a hazard tile (hazardFree fails) or the objective
    // sits on one, every path request returns null and the bot cannot even walk
    // away.  Fall back to plain walkability for the endpoints.
    const okPlain = (gx, gy) => walkable(gx, gy);
    // NOTE: relaxing the endpoint test (allowing hazard tiles) was tried and
    // collapsed runs to 15-154 seconds: with a hazard-tolerant start node the
    // search happily routes THROUGH hazardous tiles, so the bot walks into
    // poison/void and dies at the first room.  Keep the strict test.
    if (!okT(sx, sy)) return navFail('startBlocked');
    // A blocked goal is usually a room CENTRE that happens to be a pillar or a
    // closed door — the objective coordinate is geometric, not walkable.  Rather
    // than failing the whole search, slide the goal to the nearest walkable tile.
    let gxx = gx2, gyy = gy2;
    if (!okT(gxx, gyy)) {
      let bestG = null, bestGD = 1e9;
      for (let r = 1; r <= 6 && !bestG; r++) {
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;   // ring only
          const nx2 = gx2 + dx, ny2 = gy2 + dy;
          if (!okT(nx2, ny2)) continue;
          const dd2 = dx * dx + dy * dy;
          if (dd2 < bestGD) { bestGD = dd2; bestG = [nx2, ny2]; }
        }
      }
      if (bestG) { gxx = bestG[0]; gyy = bestG[1]; }
      else return navFail('goalBlocked');
    }
    const okT2 = okT;
    const start = sy * Wd + sx, goal = gy2 * Wd + gx2;
    if (start === goal) return [];
    const prev = new Map([[start, start]]);
    const q = [start];
    while (q.length) {
      const cur = q.shift();
      if (cur === goal) break;
      const cx = cur % Wd, cy = (cur / Wd) | 0;
      for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + d[0], ny = cy + d[1];
        if (!okT2(nx, ny)) continue;
        const ni = ny * Wd + nx;
        if (prev.has(ni)) continue;
        prev.set(ni, cur); q.push(ni);
      }
    }
    if (!prev.has(goal) && A._plainPath !== true) {           // one retry that ignores hazards
      A._plainPath = true;
      try { return gridPath(p, tx, ty); } finally { A._plainPath = false; }
    }
    if (!prev.has(goal)) {
      // record the geometry so we can see WHERE it fails, not just how often
      A._navFailWhy = (A._navFailWhy || []);
      if (A._navFailWhy.length < 8) A._navFailWhy.push(
        Math.round(p.x) + ',' + Math.round(p.y) + '->' + (gxx * 16 + 8) + ',' + (gyy * 16 + 8));
      return navFail('noRoute');
    }
    const path = []; let cur = goal;
    while (cur !== start) { path.push([(cur % Wd) * 16 + 8, ((cur / Wd) | 0) * 16 + 8]); cur = prev.get(cur); }
    path.reverse(); return path;
  }
  // dash only when the dash arc does not end inside a pit
  // a dash is 330px/s for ~.16s ≈ 52px.  Refuse the arc when ANY sample lands in
  // a pit, the void (tiles or boss zones) or an active hazard — the old version
  // only looked at pits, which is why we happily dashed into blades and acid.
  function dashSafe(p, dx, dy) {
    const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    // Dash physics (game.js:133-136): dashT=.16s at 330px/s ≈ 53px, and it sets
    // p.fly=true so PITS STOP BLOCKING during the dash — the player really does
    // fly over them.  A dash that lands on a pit costs a hit, so scan further and
    // also refuse a landing that touches void/wall (we'd grind against it).
    const DASH_LEN = 56;
    let pit = -1;
    for (let d = 8; d <= DASH_LEN + 8; d += 6) {
      const t = tileAtPx(p.x + dx * d, p.y + dy * d);
      if (t === TL.VOID || t === TL.WALL) return false;      // would eat the wall
      if (t === TL.PIT && pit < 0 && d <= DASH_LEN) pit = d; // flies over it…
    }
    if (pit > 0) {
      // …but the LANDING must be solid ground within dash range
      let land = -1;
      for (let e = DASH_LEN; e >= pit; e -= 6) {
        const t3 = tileAtPx(p.x + dx * e, p.y + dy * e);
        if (t3 !== TL.PIT && t3 !== TL.VOID && t3 !== TL.WALL) { land = e; break; }
      }
      if (land < 0) return false;
      if (collides(p.x + (dx * land), p.y + (dy * land), p.r, false)) return false;
    }
    // never dash INTO a death-fight body: it deals contact damage for 2s and
    // cannot be killed, so the landing spot itself has to be clear of them.
    if (G.enemies) for (const e of G.enemies) {
      if (e.dead || !(e.deathFightLeft > 0) || e.spawnT > 0) continue;
      const ex = p.x + dx * DASH_LEN, ey = p.y + dy * DASH_LEN;
      if (Math.hypot(ex - e.x, ey - e.y) < (e.r || 6) + p.r + 14) return false;
    }
    return true;
  }
  function isMelee(id) { const w = WEAPONS[id]; return w && ['melee', 'thrust', 'spin', 'whip', 'slam', 'iai', 'fist', 'reap'].includes(w.kind); }
  function nearestEnemy(x, y, maxD, needLos) {
    let best = null, bd = maxD;
    for (const e of __achroma.G.enemies) { if (e.dead || e.spawnT > 0 || e.deathFightLeft > 0 || e.inv > 0) continue; const d = dist(x, y, e.x, e.y); if (d < bd && (!needLos || los(x, y, e.x, e.y))) { bd = d; best = e; } }
    return best;
  }
  // ---------- threat field ----------
  // The game exposes inMech(m, x, y) — its own hit test for EVERY telegraph type
  // (circle/seg/rect/cone/donut/cells/…).  Combined with bullet trajectory
  // prediction this one function powers the whole avoidance logic.
  function mechDanger(m) {
    const warn = m.warn || 0;
    if (warn >= 90) return .55;                       // lingering hazard (wet ink …)
    if (m.t >= warn) return 0;                        // already resolved
    return 1 + 2.5 * Math.max(0, Math.min(1, 1 - (warn - m.t) / .6)); // about to fire = worst
  }
  // ---- in-room hazards: rotating blades, flame pillars, poison pools ----------
  // blade: two arms, length R, angle a, angular speed va — the segment sweeps, so
  // we score the CURRENT and a short LOOK-AHEAD of each arm.
  // flame: a corridor along angle a; state 0 idle / 1 warning / 2 firing.
  // pool: a circle; it ticks damage every .5s.
  function segDist2(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
    return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
  }
  const HAZ_PAD = 5;                       // body radius allowance
  function hazardAt(x, y, pad, look) {
    try {
      return hazardAt_(x, y, pad === undefined ? 5 : pad, look === undefined ? .45 : look);
    } catch (e) { return 0; }              // never let the threat field throw
  }
  function hazardAt_(x, y, pad, look) {
    const Wd = (typeof WORLD !== 'undefined' && WORLD) || null;
    if (!Wd || !Wd.tiles) return 0;        // floor not built yet (right after launch)
    const G_ = (typeof __achroma !== 'undefined' && __achroma) ? __achroma.G : null;
    let d = 0;
    for (const t of Wd.traps || []) {
      if (t.kind === 'blade') {
        const RR = t.R || 30;
        // sweep the two arms over the look-ahead window
        for (let k = 0; k < 2; k++) {
          for (let w = 0; w <= look; w += look / 3) {
            const a = (t.a || 0) + (t.va || 0) * w + k * Math.PI;
            const ex = t.x + Math.cos(a) * RR, ey = t.y + Math.sin(a) * RR;
            const dd = segDist2(x, y, t.x, t.y, ex, ey);
            const hit = 3 + pad + (w > 0 ? 3 : 0);        // the future is slightly cheaper
            if (dd < hit) d = Math.max(d, 2.6 * (1 - dd / hit) + 1.1);
          }
        }
        // inside the swept disc is risky but not forbidden: a room with a blade
        // centre still has to be fought, so this is only a soft nudge.
        const dc = Math.hypot(x - t.x, y - t.y);
        if (dc < RR + 3 + pad) d = Math.max(d, .45 * (1 - dc / (RR + 3 + pad)) + .12);
      } else if (t.kind === 'flame') {
        const per = t.per || 4, fire = t.fire || .8, warn = t.warn || .5, L = t.L || 40;
        const ph = ((t.t || 0) + (.25)) % per;            // slight look-ahead bias
        const st = ph < per - warn - fire ? 0 : ph < per - fire ? 1 : 2;
        const L4 = t.L ? L * Math.min(1, Math.max(0, (ph - (per - fire)) * 6)) : L;
        if (st >= 1) {
          const len = st === 2 ? L4 : L;
          for (let w = 0; w <= 1; w += .5) {
            const a = (t.a || 0) + (t.va || 0) * w;
            const ex = t.x + Math.cos(a) * len, ey = t.y + Math.sin(a) * len;
            const dd = segDist2(x, y, t.x, t.y, ex, ey);
            const hit = (st === 2 ? 8 : 6) + pad;
            if (dd < hit) d = Math.max(d, (st === 2 ? 2.4 : 1.0) * (1 - dd / hit) + (st === 2 ? .9 : .25));
          }
        }
      }
    }
    // ---- enemy-created dynamic hazards: G.foeFx (acid pools, gas clouds, lobs) ----
    // These are NOT in WORLD.pools; they are per-instance objects with their own
    // update closure.  acidPool/gasCloud carry {x,y,R,life}; foeLob carries a
    // landing point + warnR while it is still in the air.
    for (const f of (G_ && G_.foeFx) || []) {
      if (f.R && f.life !== undefined) {                    // acidPool / gasCloud
        const rr = (f.R || 24) * (f.kind === 'gas' ? .8 : 1) + pad - 4;
        const dd = Math.hypot(x - f.x, y - f.y);
        if (dd < rr) d = Math.max(d, 1.9 * (1 - dd / rr) + .8);
      } else if (f.land && f.dur != null) {                  // foeLob in flight: its landing circle
        const k = Math.min(1, (f.t || 0) / f.dur);
        const rr = (f.warnR || 26) + pad - 2;
        const dd = Math.hypot(x - f.tx, y - f.ty);
        if (dd < rr) d = Math.max(d, (1.2 + 1.6 * k) * (1 - dd / rr) + .5);
      }
    }
    // ---- void zones (bosses' erase circles, chasm cells): lethal, never step in ----
    if (G_) for (const z of G_.zones || []) {
      const rr = (z.r || 24) + pad - 2;
      const dd = Math.hypot(x - z.x, y - z.y);
      if (dd < rr) d = Math.max(d, (z.warn > 0 && (z.t || 0) < z.warn ? 1.6 : 3.4) * (1 - dd / rr) + 1.2);
    }
    for (const q of Wd.pools || []) {
      const rr = (q.r || 18) + pad - 2;
      const dd = Math.hypot(x - q.x, y - q.y);
      if (dd < rr) d = Math.max(d, 1.6 * (1 - dd / rr) + .6);
    }
    return d;
  }
  // Repulsion direction away from live rotating lasers.  Strafe AGAINST the
  // sweep direction (the beam chases its rotation, so going the other way
  // crosses it fastest), and if the beam is already on us, fall back to radial
  // (duck inside r0 / back out past the tip).
  function laserPush(p) {
    const G = __achroma.G; let mx = 0, my = 0;
    for (const L of G.lasers || []) {
      if (!L || !L.owner || L.owner.dead || L.warn > 0) continue;
      const ox = L.owner.x, oy = L.owner.y;
      const dx = p.x - ox, dy = p.y - oy, dd = Math.hypot(dx, dy) || 1;
      const r0 = L.r0 || 0, len = L.len || 420;
      if (dd > len + 30) continue;
      const ang0 = Math.atan2(dy, dx);
      const off = ((ang0 - L.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      const lat = Math.abs(off) * dd;
      if (dd < r0 + 2) continue;                     // already safe inside the core
      if (lat > (L.w / 2) + 26) continue;            // far from the axis, ignore
      // tangential push, opposing the sweep
      const tang = -(L.va >= 0 ? 1 : -1);
      mx += -Math.sin(ang0) * tang * 1.4;
      my += Math.cos(ang0) * tang * 1.4;
      // plus radial: prefer the nearer exit (inward to r0 or outward past len)
      const inward = (dd - r0) < (len - dd);
      mx += (dx / dd) * (inward ? -1 : 1) * .9;
      my += (dy / dd) * (inward ? -1 : 1) * .9;
    }
    return [mx, my];
  }

  function spotDanger(x, y, p) {
    const G = __achroma.G; let d = 0;
    const h = hard();
    // α serum: for three fights every hit is taken from MAX HP permanently, so a
    // single careless touch costs a permanent resource.  Switch to zero-tolerance
    // while it is active: look further ahead and weight every danger higher.
    let alpha = false;
    try { alpha = !!(G.exp && G.exp.id === 'a' && (G.exp.left | 0) > 0); } catch (e) { }
    A._alphaMode = alpha;
    const horizon = alpha ? 1.35 : (h ? .95 : .7);
    const wMul = alpha ? 1.9 : (h ? 1.3 : 1);
    if (typeof inMech === 'function' && G.mechs) for (const m of G.mechs) {
      const w = mechDanger(m); if (!w) continue;
      let inside = false;
      try { inside = !!inMech(m, x, y); } catch (e) { }
      if (inside) d += 2.2 * w * wMul;
    }
    for (const b of G.ebullets) {                     // closest-approach prediction
      const sp2 = b.vx * b.vx + b.vy * b.vy; if (sp2 < 25) continue;
      const t = ((x - b.x) * b.vx + (y - b.y) * b.vy) / sp2;
      if (t < -.05 || t > horizon) continue;
      const bt = Math.max(0, t);
      const miss = Math.hypot(x - (b.x + b.vx * bt), y - (b.y + b.vy * bt));
      const rr = (b.r || 3) + p.r + 3;
      if (miss < rr) d += 2.4 * wMul * (1 - miss / rr) * (1.4 - Math.min(1.4, t));
    }
    for (const z of G.zones || []) if (dist(x, y, z.x, z.y) < (z.r || 18) + 3) d += 1.4;
    // ---- enemy CONTACT -----------------------------------------------------
    // Persistent contact is the actual killer: hurtPlayer fires every frame while
    // recorded hits only increment behind a cooldown (712 vs 47 on one seed). A
    // body that deals contact damage therefore belongs in the danger field far
    // more than any bullet does.
    for (const e of G.enemies || []) {
      if (e.dead || (e.spawnT > 0)) continue;
      if (!e.contact && !e.melee) continue;                 // only bodies that hurt
      const rr = (e.r || 6) + p.r;
      const dd = dist(x, y, e.x, e.y);
      // NOTE: a 34px radius here made the bot refuse to approach anything and it
      // died at the first room within seconds. Contact is dangerous but so is
      // never closing in, so keep this tight.
      if (dd < rr + 4) d += 2.6;
    }
    // ---- death-fight bodies (绝境「死斗」) ---------------------------------
    // A foe killed under this modifier stays lethal for two seconds and cannot be
    // killed again.  nearestEnemy() filters them out, so the bot used to walk
    // straight through a corpse field; four of six runs died within about 100 hp
    // of finishing a boss.  Treat them as standing hazard, at body radius + a
    // margin, for both the sampled point and the direction we are heading.
    if (A.opts.deathfightHazard !== false) for (const e of G.enemies || []) {
      if (e.dead || !(e.deathFightLeft > 0) || e.spawnT > 0) continue;
      const rr = (e.r || 6) + p.r + 16;
      const dd = dist(x, y, e.x, e.y);
      if (dd < rr) d += 3.0;
      else if (dd < rr + 18) d += 1.2;
    }
    // ---- rotating boss lasers (boss.js:634) --------------------------------
    // A live laser is a SEGMENT from owner + cos(a)*r0 out to len, sweeping at va.
    // Inside r0 there is no damage at all, so the two safe answers are "hug the
    // boss" (< r0) or "get out of the swept band" (> len).  The bot used to walk
    // straight into the beam because lasers were not modelled anywhere.
    for (const L of G.lasers || []) {
      if (!L || !L.owner || L.owner.dead) continue;
      const live = !(L.warn > 0);
      const r0 = L.r0 || 0, len = L.len || 420, half = (L.w / 2) + p.r + (live ? 1 : 6);
      const ox = L.owner.x, oy = L.owner.y;
      const dx = x - ox, dy = y - oy, distO = Math.hypot(dx, dy) || 1;
      if (distO < r0 + 2) continue;                       // inside the safe core
      if (distO > len) continue;                          // beyond the tip
      // angular offset from the beam axis, converted to arc length at this radius
      const off = Math.abs(((Math.atan2(dy, dx) - L.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      const lat = off * distO;                            // distance to the beam line
      // where the beam will be in .35s (it rotates at va)
      const latSoon = Math.abs(((Math.atan2(dy, dx) - (L.a + (L.va || 0) * .35) + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * distO;
      if (lat < half) d += 3.4;                           // in the beam right now
      else if (latSoon < half + 6) d += 2.2;              // about to sweep onto us
    }
    // in-room hazards (blades / flame pillars / poison pools)
    { const hz = hazardAt(x, y, Math.max(4, p.r - 1)); if (hz) d += hz; }
    // pits: walking in hurts and teleports back — never path through them
    if (typeof TL !== 'undefined' && tileAtPx(x, y) === TL.PIT) d += 2.6;
    if (typeof TL !== 'undefined' && tileAtPx(x, y) === TL.SPIKE && typeof spikeState === 'function') {
      const sv = spikeState(); if (sv === 2) d += 2.4; else if (sv === 1) d += .9;   // 2 = out, 1 = warning
    }
    // death-fight (绝境「死斗」修饰符): a foe with deathFightLeft > 0 cannot be
    // selected or shot, but it KEEPS dealing contact damage for 2s
    // (enemies.js:115 has no deathFightLeft filter).  So treat it as a pure
    // hazard: never aim at it, but push away from it.
    if (G.enemies) for (const e of G.enemies) {
      if (e.dead || !(e.deathFightLeft > 0) || e.spawnT > 0) continue;
      // A death-fight body is unkillable for 2s and deals contact damage the whole
      // time, so its danger radius must be much wider than its sprite: reaching
      // it at all is a guaranteed hit.  (Was r+10 ≈ 20px, which the bot happily
      // walked into while chasing something behind it.)
      const rr = (e.r || 6) + p.r + 34;
      const dd = Math.hypot(x - e.x, y - e.y);
      if (dd < rr) d += 3.4 * (1 - dd / rr) + 1.6;
    }
    // gunners locking a shot: stay off the firing line before the bullet exists
    if (G.enemies) for (const e of G.enemies) {
      if (e.dead || e.spawnT > 0 || e.deathFightLeft > 0 || e.st !== 'aim') continue;
      const dxp = p.x - e.x, dyp = p.y - e.y, dE = Math.hypot(dxp, dyp);
      if (dE > 340 || dE < 1) continue;
      const ux = dxp / dE, uy = dyp / dE;
      const lx = x - e.x, ly = y - e.y;
      const along = lx * ux + ly * uy;
      if (along < 0) continue;
      const lat = Math.abs(lx * uy - ly * ux);
      if (lat < 15 && along < dE + 70) d += 1.7;
    }
    return d;
  }
  // the worst-case clearance along a short ray: how far the closest bullet path
  // stays from this lane.  Maximising the MINIMUM clearance is what turns
  // "dodge the average" into "never get squeezed" — the 16-way version only
  // summed danger, so it happily picked a lane with one near-miss on each side.
  // the worst-case clearance along a short ray: how far the closest bullet path
  // stays from this lane.  Maximising the MINIMUM clearance is what turns
  // "dodge the average" into "never get squeezed" — the 16-way version only
  // summed danger, so it happily picked a lane with one near-miss on each side.
  function laneClear(p, dx, dy) {
    const G = __achroma.G, R = 46;
    let m = 40;
    for (const b of G.ebullets) {
      const cx = b.x - p.x, cy = b.y - p.y;
      if (Math.abs(cx) > 140 || Math.abs(cy) > 140) continue;
      const sp2 = b.vx * b.vx + b.vy * b.vy; if (sp2 < 25) continue;
      const t = ((p.x - b.x) * b.vx + (p.y - b.y) * b.vy) / sp2;
      if (t < -.05 || t > 1.05) continue;
      const bx = b.x + b.vx * Math.max(0, t), by = b.y + b.vy * Math.max(0, t);
      const lx = bx - p.x, ly = by - p.y;
      const along = lx * dx + ly * dy;
      if (along < 0 || along > R) continue;
      const lat = Math.abs(-lx * dy + ly * dx) - (b.r || 3) - p.r;
      if (lat < m) m = lat;
    }
    return Math.max(0, m);
  }
  // choose the walk direction: alignment with "want", walls block, threats repel.
  // 24 candidate angles, three sampling radii (the near ring dominates), then a
  // half-step refinement around the winner.
  // true when (x,y) is closer than `margin` px to a wall, door, pillar or pit
  function tooCloseToWallOrPit(x, y, r, margin) {
    if (collides(x, y, r, false)) return true;
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      if (collides(x + Math.cos(a) * margin, y + Math.sin(a) * margin, r, false)) return true;
    }
    return false;
  }

  function pickDir(p, wx, wy) {
    // local "openness" gradient: average of 8 rays tells us which way leads away
    // from nearby walls.  Recomputed once per tick (cheap: 8 collides calls).

    const wl = Math.hypot(wx, wy); const ld = A._lastDir || [1, 0];
    const RX = [18, 42, 70], RW = [2.0, 1.0, .5];
    // A direction is only truly unusable when the FIRST ring is inside geometry.
    // Everything else is a soft penalty — the old code returned -1e9 for *any*
    // blocked sample, so when the bot stood in a corner every candidate scored
    // -1e9, `bestA` fell back to 0 (due east) and it pressed into the wall and
    // never moved (measured: 9s frozen, seed 91).
    let blockedAll = true;
    const evalDir = (a) => {
      const dx = Math.cos(a), dy = Math.sin(a);
      const nx0 = p.x + dx * RX[0], ny0 = p.y + dy * RX[0];
      if (collides(nx0, ny0, p.r, false)) return -1e9;      // really cannot step
      blockedAll = false;
      let s = 0;
      for (let k = 0; k < 3; k++) {
        const nx = p.x + dx * RX[k], ny = p.y + dy * RX[k];
        if (collides(nx, ny, p.r, false)) { s -= 4 * RW[k]; continue; }
        s -= 1.8 * RW[k] * spotDanger(nx, ny, p);
      }
      // ---- wall / pit proximity: fixed penalty, no "moving away" reward ------
      // If stepping this way puts us within `wallMargin` px of a wall, door or pit,
      // the direction costs a FLAT amount.  There is deliberately no gradient bonus
      // for heading into open space: that made the bot drift around for no reason
      // instead of just refusing to hug walls.
      const margin = gene('wallMargin');
      // Only penalise stepping CLOSER to a wall.  Testing the destination in
      // isolation penalised almost every direction whenever we were already
      // near a wall (the test reduces to "8 probe points hit something" for all
      // but the outward one), which flattened the scores and left the bot
      // oscillating horizontally without ever moving — measured on seed 1:
      // px swinging 1029..1060 while py stayed pinned at 1165.
      const nearNow = tooCloseToWallOrPit(p.x, p.y, p.r, margin);
      const nearNext = tooCloseToWallOrPit(p.x + dx * margin, p.y + dy * margin, p.r, margin);
      if (nearNext && !nearNow) s -= 2.5;          // refusing to enter the margin
      else if (nearNext && nearNow) s -= .6;       // already inside: just prefer not sliding along it
      if (wl > .1) s += 2.2 * (dx * wx + dy * wy) / wl;
      s += .18 * (dx * ld[0] + dy * ld[1]);          // anti-jitter
      s += 1.15 * Math.min(1.6, laneClear(p, dx, dy) / 26);
      return s;
    };
    const N = 24;
    let bestS = -1e9, bestA = 0;
    for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, v = evalDir(a); if (v > bestS) { bestS = v; bestA = a; } }
    const hstep = Math.PI / N / 2;
    for (const a of [bestA - hstep, bestA + hstep]) { const v = evalDir(a); if (v > bestS) { bestS = v; bestA = a; } }
    // Absolute fallback: if the first ring is blocked in every one of the 24
    // directions we are wedged.  Press the direction with the most open space
    // (probe out to 4 rings) instead of standing still.
    if (blockedAll) {
      let fbA = 0, fbFree = -1;
      for (let i = 0; i < N; i++) {
        const a = i / N * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a);
        let free = 0;
        for (let k = 1; k <= 4; k++) { if (collides(p.x + dx * 10 * k, p.y + dy * 10 * k, p.r, false)) break; free++; }
        if (free > fbFree) { fbFree = free; fbA = a; }
      }
      bestA = fbA;
      A.metrics.navStall = (A.metrics.navStall | 0) + 1;
    }
    const best = [Math.cos(bestA), Math.sin(bestA)];
    A._lastDir = best;
    return best;
  }
  // pick the dash direction: among the 16 arcs that are safe to land, take the one
  // that ends in the calmest spot (a dash is also our escape from a squeeze).
  function dashDir(p, prefer) {
    let best = null, bestScore = -1e9;
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a);
      if (!dashSafe(p, dx, dy)) continue;
      const ex = p.x + dx * 52, ey = p.y + dy * 52;
      let s = -spotDanger(ex, ey, p) - .8 * spotDanger(p.x + dx * 30, p.y + dy * 30, p)
        + .9 * Math.min(1.6, laneClear(p, dx, dy) / 26);
      const pl = Math.hypot(prefer[0], prefer[1]) || 1;
      s += .9 * (dx * prefer[0] + dy * prefer[1]) / pl;
      if (s > bestScore) { bestScore = s; best = [dx, dy]; }
    }
    return best;
  }
  // ---- input rotation the game applies to our keys -------------------------
  // The player vector is quantised to 8 directions from the keys, then the
  // REVERSE mech flips it, then the TREMOR curse (hp<=3) rotates it by
  // j = sin(t*2.1)*.32 + sin(t*5.3+1)*.16 (game.js:130).  We therefore choose the
  // key combo whose *post-rotation* direction matches what we want.
  const KEY8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const angDiff2 = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
  function tremorAngle() {
    const G = typeof __achroma !== 'undefined' && __achroma && __achroma.G; if (!G || !G.p) return 0;
    if (G.p.hp > 3 || typeof hasCurse !== 'function' || !hasCurse('tremor')) return 0;
    const t = G.time || 0;
    return Math.sin(t * 2.1) * .32 + Math.sin(t * 5.3 + 1) * .16;
  }
  function reverseOn() {
    const G = typeof __achroma !== 'undefined' && __achroma && __achroma.G;
    return !!(G && G.mechs && G.mechs.some((m) => m && m.type === 'reverse' && m.t > m.on));
  }
  A._own = { KeyW: false, KeyS: false, KeyA: false, KeyD: false };
  const setKeys = (kw, ks, ka, kd) => {
    Input.keys.KeyW = kw; Input.keys.KeyS = ks; Input.keys.KeyA = ka; Input.keys.KeyD = kd;
    A._own.KeyW = kw; A._own.KeyS = ks; A._own.KeyA = ka; A._own.KeyD = kd;
  };
  const moveKeys = (dx, dy) => {
    const l = Math.hypot(dx, dy); if (l < .06) { setKeys(false, false, false, false); return; }
    let want = Math.atan2(dy, dx) - tremorAngle();     // undo the terror/tremor rotation
    if (reverseOn()) want += Math.PI;                  // undo the reverse mech
    let best = 0, bd = 9;
    for (let i = 0; i < 8; i++) { const a = Math.atan2(KEY8[i][1], KEY8[i][0]); const d = Math.abs(angDiff2(a, want)); if (d < bd) { bd = d; best = i; } }
    const c = KEY8[best];
    setKeys(c[1] < 0, c[1] > 0, c[0] < 0, c[0] > 0);
  };
  const stopMove = () => setKeys(false, false, false, false);

  // ---- tile-level travel: BFS nodes as the *primary* steering target --------
  // The room graph only gets us to the right doorway; inside a room (pillars,
  // corners, pits) greedy steering can orbit forever.  So for any leg longer
  // than ~26px we follow real BFS nodes and let pickDir only do local avoidance.
  const travel = { path: null, goal: null, i: 0, t: 0 };
  function nextWaypoint(p, gx, gy) {
    const now = (typeof __achroma !== 'undefined' && __achroma && __achroma.G ? __achroma.G.time : 0) || 0;
    const stale = !travel.path || !travel.goal || now - travel.t > 1.4 ||
      Math.hypot(travel.goal[0] - gx, travel.goal[1] - gy) > 24 || travel.i >= (travel.path ? travel.path.length : 0);
    if (stale) {
      const path = gridPath(p, gx, gy);
      travel.path = (path && path.length) ? path : null;
      travel.goal = [gx, gy]; travel.i = 0; travel.t = now;
    }
    if (!travel.path) return null;
    // drop nodes we already cleared (reached, or now behind us)
    while (travel.i < travel.path.length - 1) {
      const n = travel.path[travel.i], nx = travel.path[travel.i + 1];
      const d = Math.hypot(n[0] - p.x, n[1] - p.y);
      const behind = ((nx[0] - p.x) * (n[0] - p.x) + (nx[1] - p.y) * (n[1] - p.y)) < 0;
      if (d > 18 && !behind) break;
      travel.i++; travel.adv = now;
    }
    // carrot: aim at the FURTHEST node within 64px, not the next tile.  Aiming
    // 20px ahead makes pickDir's heading term meaningless and the bot stalls.
    let pick = travel.path[travel.i], bestD = -1;
    for (let k = travel.i; k < travel.path.length; k++) {
      const n = travel.path[k];
      const d = Math.hypot(n[0] - p.x, n[1] - p.y);
      if (d > 64) break;
      if (d > bestD) { bestD = d; pick = n; }
    }
    return pick;
  }

  // ---------------- main per-tick driver ----------------
  let lastPos = { x: 0, y: 0, t: 0 };
  const navProg = { tgt: null, x: 0, y: 0, t: 0 };
  const wiggle = { dir: null, until: 0, n: 0 };
  A._taps = {};
  const hard = () => (typeof diffV === 'function') && diffV('mhp') >= 1.25;
  A._tick = 0;
  A._tapGap = {};
  A._pickTries = new Map();
  TSW.trace = new URLSearchParams(location.search).has('trace');
  TSW.hooks.beforeTick(() => {
    // release one-frame taps from the previous tick (always, even when off)
    for (const c in A._taps) if (A._taps[c]) { Input.keys[c] = false; A._taps[c] = 0; }
    const G = window.__achroma && __achroma.G;
    if (!G || !G.p || A.mode === 'off') return;
    A._tick++;
    try { drive(G); } catch (e) { TSW.err('auto', e); A.status.note = 'err: ' + e.message; }
    if (TSW.trace && (++A._tick % 120 === 0)) {
      const p2 = G.p, foes = G.enemies ? G.enemies.filter((e) => !e.dead).length : 0;
      const act = typeof WORLD !== 'undefined' && WORLD.rooms ? WORLD.rooms.find((r) => r.active) : null;
      console.info('[TSW:auto]', JSON.stringify({ st: G.state, fl: G.floor, dep: G.endless | 0, t: (G.runT || 0) | 0, k: G.kills | 0, ink: G.ink | 0, hp: p2.hp, foes, act: act ? act.type : 0, tgt: A.status.target, note: A.status.note, x: p2.x | 0, y: p2.y | 0, mx: A._dbg ? A._dbg[0].toFixed(1) : 0, my: A._dbg ? A._dbg[1].toFixed(1) : 0, eb: G.ebullets.length, keys: ['KeyW', 'KeyA', 'KeyS', 'KeyD'].filter((k) => Input.keys[k]).join('') }));
    }
  });

  // ---- the game's picker overlay: walk the selection to the best row, confirm.
  // Weapon racks (the update's armory) are scored with the same table as card
  // picks; for any other list we keep the current value, or cancel — never make
  // a blind choice.  Every key goes through the edge-safe tap().
  function drivePicker(tap) {
    const o = (typeof OVL !== 'undefined' && OVL.o) || {}, items = o.items || [], n = items.length;
    if (!n) { tap('Escape'); A.status.note = '关闭选择框'; return; }
    const cur = G.p && G.p.weapons ? G.p.weapons[G.p.wi] : null;
    let want = -1;
    if (items.every((it) => WEAPONS[it.v])) {
      // Armoury rack: this is the ONLY place a weapon is chosen rather than
      // stumbled upon, so rank by measured damage instead of the policy table
      // (which lacks entries for storm/nova/mines/trident/shuriken entirely).
      // the rack hands out a LEVEL 0 gun, so compare it against what the held
      // weapon currently delivers WITH its upgrades — a level 3 nail (61) beats a
      // fresh storm (62) only barely, and swapping would throw the levels away.
      const lvOf = (id) => { try { return (G.p.wlv && G.p.wlv[id]) | 0; } catch (e) { return 0; } };
      const curD = (cur && WEAPONS[cur]) ? wDps(cur) * (1 + .25 * lvOf(cur)) : 0;
      let bestD = -1, bestId = null;
      for (const it of items) {
        const d = wDps(it.v);                 // the rack item is always level 0
        if (it.v === cur) continue;
        if (d > bestD) { bestD = d; bestId = it.v; }
      }
      if (A.opts.arsenalByDps !== false) {
        if (bestId && bestD > curD * 1.1 + 1) want = items.findIndex((it) => it.v === bestId);
        else if (cur) want = items.findIndex((it) => it.v === cur);
        A.status.note = '军械库按DPS选 ' + (want >= 0 ? items[want].v : '?');
      } else {
        let best = -1;
        for (const it of items) { const s = wScore(it.v); if (it.v !== cur && s > best) { best = s; bestId = it.v; } }
        const cs = cur && WEAPONS[cur] ? wScore(cur) : -1e9;
        if (bestId && best > cs + .5) want = items.findIndex((it) => it.v === bestId);
        else if (cur) want = items.findIndex((it) => it.v === cur);
      }
      if (want < 0) want = items.findIndex((it) => it.v === bestId);
      if (want < 0) want = 0;
      A.status.note = '军械库选武器 ' + items[want].v;
    } else if (o.cur !== undefined && items.some((it) => it.v === o.cur)) {
      want = items.findIndex((it) => it.v === o.cur);   // keep the current value
      A.status.note = '选择框：保持当前项';
    } else {
      A.status.note = '关闭选择框';
      tap('Escape');
      return;
    }
    const sel = typeof OVL.sel === 'number' ? OVL.sel : 0;
    if (sel === want) { tap('Enter'); return; }
    const down = (want - sel + n) % n;
    tap(down <= n - down ? 'KeyS' : 'KeyW');
  }

  // which curse is worth paying 1 max armor to be rid of (higher = worse for us)
  const CURSE_W = { night: 9, tremor: 8, surr: 6, wrath: 6, sloth: 5, lung: 5, drought: 4, reject: 4, seal: 3, slow: 3, disaster: 3, over: 2, greed: 2, hubris: 2, coward: 2, time: 2 };
  // the dialysis machine (floors 5/15/45/75): free once, removes ONE serum or ONE
  // curse for 1 max armor.  Removing a serum is a loss, so we only ever purge a
  // curse — and only when we actually carry one.
  function driveDialysis(G, tap) {
    const D = (typeof DIA !== 'undefined') ? DIA : null;
    if (!D) { tap('Escape'); return; }
    const curses = (G.curses || []).slice();
    const canPay = ((G.p && G.p.maxArmor) | 0) >= 1;
    if (!D.mode) {                                        // the two-option menu: 0 serum, 1 curse
      if (!A.opts.dialysis || !curses.length || !canPay) { tap('Escape'); A.status.note = '透析：不用'; return; }
      if ((D.sel | 0) !== 1) { tap('KeyW'); A.status.note = '透析：选“诅咒”'; return; }
      tap('Enter'); A.status.note = '透析：打开诅咒列表'; return;
    }
    const ids = (typeof diaIds === 'function' ? diaIds() : curses).slice();
    if (!ids.length) { tap('Escape'); return; }
    let best = 0, bw = -1;
    for (let i = 0; i < ids.length; i++) { const w = CURSE_W[ids[i]] != null ? CURSE_W[ids[i]] : 2; if (w > bw) { bw = w; best = i; } }
    const sel = D.sel | 0;
    if (sel !== best) { tap(best > sel ? 'KeyD' : 'KeyA'); A.status.note = '透析：选 ' + ids[sel]; return; }
    tap('Enter'); A.status.note = '透析：清除 ' + ids[best];
  }
  // the lab serum question: inject (sel 0) or walk away (sel 1).  Without this
  // the modal freezes the run — it was a genuine soft-lock before.
  function driveLabQ(G, tap) {
    const q = (typeof LABQ !== 'undefined' && LABQ) || null;
    if (!q) { tap('Escape'); return; }
    const want = A.opts.labSerum ? 0 : 1;
    const sel = q.sel | 0;
    if (sel !== want) { tap(want === 0 ? 'KeyA' : 'KeyD'); A.status.note = '实验血清：选择' + (want ? '不注射' : '注射'); return; }
    if ((q.t || 0) < .35) return;                       // the panel refuses input for .3s
    tap('Enter');
    A.status.note = want ? '实验血清：注射' : '实验血清：跳过';
  }
  // is the human driving?  (we never overwrite a key the player is holding)
  function manualHold() {
    if (!A.opts.manual) return false;
    const k = Input.keys;
    for (const c of ['KeyW', 'KeyS', 'KeyA', 'KeyD']) if (k[c] && !A._own[c]) return true;
    return false;
  }
  function drive(G) {
    const p = G.p;
    // edge-safe tap: the game detects key PRESSES (down && !prev-down).  Holding a
    // key across ticks (e.g. re-tapping Enter every frame on a dialog) presses it
    // exactly once and never again — so enforce >=1 released tick between taps.
    if (A._pickTries.size > 60) A._pickTries.clear();
  const tap = (c) => {
      if (A._tick - (A._tapGap[c] ?? -9) < 2) return;
      Input.keys[c] = true; A._taps[c] = 1; A._tapGap[c] = A._tick;
    };

    // the player is steering: hands off movement/fire for a moment, but keep the
    // HUD and status live.  Manual control wins over every mode.
    if (manualHold()) {
      A._manualUntil = (G.time || 0) + 1.2;
      A.status.note = '手动接管中…';
    }
    if (A._manualUntil && (G.time || 0) < A._manualUntil) { A.status.note = '手动接管中…'; return; }

    // the canvas picker overlay (armory weapon rack, camp/market lists) REPLACES
    // update() while open — if we do not drive it the whole run soft-locks.
    if (typeof OVL !== 'undefined' && OVL.open) { drivePicker(tap); return; }
    // first-run blockers: the mechanics-hint dialog and the name editor freeze the sim
    if (G.hintQ) { tap('ArrowRight'); tap('Enter'); A.status.note = '提示确认（否）'; return; }
    if (window.NAMEED && NAMEED.open) {
      try { if (!NAMEED.inp.value) NAMEED.inp.value = 'TSW'; nameEdConfirm(); A.status.note = '自动命名'; } catch (e) { }
      return;
    }

    // 入侵的三个波间界面（crate/lv/shop）不是普通 state，必须主动驱动
    if ((G.state === 'ivcrate' || G.state === 'ivlv' || G.state === 'ivshop') && driveInvadeUI(G, tap)) return;

    switch (G.state) {
      case 'play': return drivePlay(G, p, tap);
      case 'cards': return A.opts.autoCards && driveCards(G, tap);
      case 'curse': return driveCurse(G, tap);
      case 'bossintro': if (G.introT > 1.1) Input.clicked = true; return;
      case 'dead':
      case 'win': {
        if (!A.opts.autoRestart || G.endT < 2.2) return;
        A.status.note = '重开一局…';
        if (typeof restartRun === 'function') { restartRun(); TSW.bus.emit('newRun'); A.status.note = ''; }
        return;
      }
      case 'labq': return driveLabQ(G, tap);
      case 'dialysis': return driveDialysis(G, tap);
      case 'pause': tap('Escape'); return;
      case 'build': tap('Tab'); return;
      case 'orbopen': case 'trans': case 'fusion': case 'launch': case 'menu': case 'intro': return;
    }
  }

  function driveCards(G, tap) {
    // NOTE: A._cardsT is reset by drivePlay whenever the state is not 'cards'.
    const cd = G.cards; if (!cd || cd.pick >= 0 || cd.t < .7) return;
    // Sieve animation and 无尽's re-roll window can leave the card panel waiting
    // indefinitely; without a watchdog a run freezes with no note.  Track how long
    // the panel has been open and force a pick once it overruns.
    A._cardsT = (A._cardsT || 0) + 1;
    if (A._cardsT < 3) return;                       // let the animation start
    if (cd.skipT !== undefined || cd.ban) {
      // still animating: wait, but never forever
      if (A._cardsT < 90) return;
      A.status.note = '血清面板超时强制选择';
    }
    const ex = exclList('serumExclude'), prio = exclList('serumPriority');
    const hasSv = (typeof svData === 'function') ? svData() : { ban: 0, skip: 0 };
    const exIdx = cd.opts.map((id, i) => (ex.includes(id) ? i : -1)).filter((i) => i >= 0);
    // 定向洗掉: wash excluded offers out with the game's own sieve (排除/跳过)
    if (exIdx.length && (hasSv.ban > 0 || hasSv.skip > 0) && typeof svBtns === 'function' && typeof cardRect === 'function') {
      const allEx = exIdx.length === cd.opts.length;
      const btns = svBtns();
      const press = (x, y, note) => { clickAt(x, y); A.status.note = note; };
      if (allEx && hasSv.skip > 0) return press(btns[1].x + btns[1].w / 2, btns[1].y + btns[1].h / 2, '筛滤:跳过全部');
      if (hasSv.ban > 0) {
        if (!cd.banMode) return press(btns[0].x + btns[0].w / 2, btns[0].y + btns[0].h / 2, '筛滤:排除模式');
        const i = exIdx[0], r = cardRect(i);
        return press(r.x + 52, r.y + 104, '筛滤:排除 ' + cd.opts[i]);
      }
    }
    let best = -1, bestV = -1e9;
    cd.opts.forEach((id, i) => {
      let v = scoreShard(id, cd.lv ? cd.lv[i] : 1);
      if (ex.includes(id)) v -= 100;                      // 排除列表: last resort only
      if (v > bestV) { bestV = v; best = i; }
    });
    if (best < 0) return;
    if (bestV < 0) {                                      // forced: all options excluded → priority order
      for (const pid of prio) { const i = cd.opts.indexOf(pid); if (i >= 0) { best = i; break; } }
      A.status.note = '被迫选: ' + cd.opts[best];
    }
    tap('Digit' + (best + 1));
  }

  function driveCurse(G, tap) {
    const q = G.curseQ; if (!q || q.pick >= 0 || q.t < 1.4) return;
    let best = -1, bestR = -1;
    q.opts.forEach((id, i) => { const r = CURSE_RANK[id] ?? 5; if (best < 0 || r < bestR) { bestR = r; best = i; } });
    if (best >= 0) tap('Digit' + (best + 1));
  }

  // ---------------- 入侵抵抗（Brotato 式竞技场）-------------------------------
  // 没有房间/门/交互物，只有一波一波的敌人和计时器。突入探索的那套
  // (房间图/门框/目标) 在这里全部失效——实测挂机会在无目标状态下游走。
  function driveInvade(G, p, tap) {
    const iv = G.iv || {};
    const W = (typeof WORLD !== 'undefined' && WORLD) ? WORLD : null;
    if (!W || !W.w) { A.status.note = '入侵：等待场地…'; return; }
    let mx = 0, my = 0;
    const foes = (G.enemies || []).filter((e) => !e.dead && e.spawnT <= 0);
    // 1) shoot: invade fires automatically, we only aim (the game aims via Input)
    let tgt = null, bd = 1e9;
    for (const e of foes) { const d = dist(p.x, p.y, e.x, e.y); if (d < bd) { bd = d; tgt = e; } }
    if (tgt) { Input.mx = clampM(tgt.x - G.cam.x, GW()); Input.my = clampM(tgt.y - G.cam.y, GH()); }
    // 2) kite: the arena is a walled box, so "back off" alone walks into a corner
    //    and dies.  Instead we circulate: pick the tangential direction (clockwise
    //    or counter-clockwise, committed for the whole wave) and add a radial
    //    correction that keeps us in the firing band.  That keeps a ring of space
    //    between the swarm and the wall.
    if (tgt) {
      const ux = (tgt.x - p.x) / (bd || 1), uy = (tgt.y - p.y) / (bd || 1);
      // boss waves (5/10/15/20): the boss has contact:1 (any touch hurts) plus a
      // larger radius, so keep well outside its reach instead of trading bodies.
      const bossWave = (iv.wave % 5) === 0;
      // G.boss may be null between spawns; fall back to iv.bosses so the repel
      // still fires the moment a boss exists.
      let boss = (G.boss && !G.boss.dead) ? G.boss : null;
      if (!boss && iv.bosses && iv.bosses.length) boss = iv.bosses.find((b) => b && !b.dead) || null;
      if (!boss && iv.champs && iv.champs.length === 0 && (iv.wave % 5) === 0 && foes.length) {
        // boss wave but no boss object yet: treat a big foe (r>=12) as the boss
        boss = foes.find((e) => (e.r || 0) >= 12) || null;
      }
      const band = bossWave ? [130, 200] : [60, 120];
      // never let the boss bait us into contact: repel hard when it closes in
      if (A.opts.invadeBossSafe !== false && boss) {
        const bd2 = Math.hypot(boss.x - p.x, boss.y - p.y);
        if (bd2 < (boss.r || 13) + 46) {
          const ax = (p.x - boss.x) / (bd2 || 1), ay = (p.y - boss.y) / (bd2 || 1);
          [mx, my] = pickDir(p, ax * 1.4, ay * 1.4);
          moveKeys(mx, my);
          A.status.note = '入侵：躲首领接触';
          if (A.opts.dash && p.dashCd <= 0 && typeof dashSafe === 'function' && dashSafe(p, mx, my) && spotDanger(p.x, p.y, p) >= 1.0) { tap('Space'); A.metrics.dash++; }
          A.status.target = 'invade'; return;
        }
      }
      if (A._ivWave !== iv.wave) { A._ivWave = iv.wave; A._ivSpin = Math.random() < .5 ? 1 : -1; }
      if (A.opts.invadeCircle === false) {            // A/B: plain backoff/approach
        if (bd < band[0]) { mx = -ux; my = -uy; A.status.note = '入侵：拉开距离'; }
        else if (bd > band[1]) { mx = ux; my = uy; A.status.note = '入侵：接近'; }
        else { mx = -uy * A._ivSpin * .6; my = ux * A._ivSpin * .6; A.status.note = '入侵：绕行'; }
        moveKeys(mx, my); [mx, my] = pickDir(p, mx, my);
        if (A.opts.dash && p.dashCd <= 0 && spotDanger(p.x, p.y, p) >= gene('dashDanger')) {
          const dd0 = dashDir(p, [mx, my]);
          if (dd0) { tap('Space'); A.metrics.dash++; }
        }
        moveKeys(mx, my); A.status.target = 'invade'; return;
      }
      // ---- 被围时向「最空的一侧」突围 -------------------------------------
      // Circling inside a closed ring walks THROUGH the swarm.  When >=3 foes are
      // close, score 8 escape sectors by how many enemies sit in them and run for
      // the emptiest one (this is also what lets us leave a corner).
      const near = foes.filter((e) => Math.hypot(e.x - p.x, e.y - p.y) < 95);
      if (A.opts.invadeEscape !== false && near.length >= 3) {
        let bestA2 = 0, bestCost = 1e9;
        for (let k = 0; k < 8; k++) {
          const a2 = k / 8 * Math.PI * 2, ex = Math.cos(a2), ey = Math.sin(a2);
          let cost = 0;
          for (const e of near) {
            const ux2 = e.x - p.x, uy2 = e.y - p.y, d2 = Math.hypot(ux2, uy2) || 1;
            const align = (ex * ux2 + ey * uy2) / d2;            // 1 = straight into it
            if (align > 0) cost += align * (120 / Math.max(30, d2));
          }
          // avoid walls: sample 3 distances
          for (const dd of [26, 52, 80]) {
            if (typeof collides === 'function' && collides(p.x + ex * dd, p.y + ey * dd, p.r, false)) { cost += 3; break; }
          }
          if (cost < bestCost) { bestCost = cost; bestA2 = a2; }
        }
        mx = Math.cos(bestA2); my = Math.sin(bestA2);
        A.status.note = '入侵：突围（' + near.length + ' 敌包围）';
        [mx, my] = pickDir(p, mx, my);
        moveKeys(mx, my);
        if (A.opts.dash && p.dashCd <= 0 && spotDanger(p.x, p.y, p) >= 1.3 && typeof dashSafe === 'function' && dashSafe(p, mx, my)) { tap('Space'); A.metrics.dash++; }
        A.status.target = 'invade'; return;
      }
      const tx = -uy * A._ivSpin, ty = ux * A._ivSpin;           // tangential (circle)
      if (bd < band[0]) { mx = tx * .8 - ux * 1.2; my = ty * .8 - uy * 1.2; A.status.note = '入侵：绕圈脱离'; }
      else if (bd > band[1]) { mx = tx * .5 + ux * .9; my = ty * .5 + uy * .9; A.status.note = '入侵：绕圈接近'; }
      else { mx = tx; my = ty; A.status.note = '入侵：绕圈'; }
      // wall repulsion: if the tangential path points into a wall, flip the spin
      const probeX = p.x + mx * 40, probeY = p.y + my * 40;
      if (typeof collides === 'function' && collides(probeX, probeY, p.r, false)) {
        A._ivSpin = -A._ivSpin;
        mx = -tx; my = -ty;
        A.status.note = '入侵：反向绕圈';
      }
    } else if (iv.phase === 'fight') {
      // nothing to shoot: orbit the arena (never idle in the middle of the box)
      const cx = W.w * 8, cy = W.h * 8;
      const dx = p.x - cx, dy = p.y - cy, l = Math.hypot(dx, dy) || 1;
      if (A._ivWave !== iv.wave) { A._ivWave = iv.wave; A._ivSpin = Math.random() < .5 ? 1 : -1; }
      mx = (-dy / l) * A._ivSpin; my = (dx / l) * A._ivSpin;
      if (l < 60) { mx += dx / l; my += dy / l; }                 // move out from the centre
      A.status.note = '入侵：绕场等刷怪';
    }
    [mx, my] = pickDir(p, mx, my);
    // dash away when the local threat spikes
    if (A.opts.dash && p.dashCd <= 0 && spotDanger(p.x, p.y, p) >= gene('dashDanger')) {
      const dd = dashDir(p, [mx, my]);
      if (dd) { Input.keys.KeyW = dd[1] < -.3; Input.keys.KeyS = dd[1] > .3; Input.keys.KeyA = dd[0] < -.3; Input.keys.KeyD = dd[0] > .3; tap('Space'); A.metrics.dash++; }
    }
    moveKeys(mx, my);
    A.status.target = 'invade';
  }

  // 入侵波间：补给箱 → 升级 → 商店 → 下一波。挂机原来完全不认识这三个界面，
  // 所以永远停在商店/升级里（或被时间耗尽）。游戏自身按钮都带合法性与付款
  // 检查（ivBuy 内部校验武器槽/物品上限/ivPay），因此按优先级点按钮是安全的。
  function driveInvadeUI(G, tap) {
    const iv = G.iv; if (!iv) return false;
    const hits = (typeof IVU !== 'undefined' && IVU && IVU.hits) ? IVU.hits : [];
    const call = (h) => { try { if (h && typeof h.f === 'function') { h.f(); return true; } } catch (e) { } return false; };
    if (G.state === 'ivcrate') { tap('Enter'); A.status.note = '入侵：领补给箱'; return true; }
    if (G.state === 'ivlv') {
      // pick the upgrade that best matches the goal build: damage first, then hp
      const opts = iv.lvOpts || [];
      // priority is switchable for A/B (A.opts.invadeLvPref)
      const DPS_FIRST = ['dmg', 'aspd', 'crit', 'range', 'elem', 'melee', 'ranged', 'eng', 'hp', 'armor', 'dodge', 'speed', 'steal', 'regen', 'harvest', 'luck'];
      const TANK_FIRST = ['hp', 'armor', 'regen', 'steal', 'dodge', 'dmg', 'aspd', 'crit', 'speed', 'range', 'elem', 'melee', 'ranged', 'eng', 'harvest', 'luck'];
      // growth-first: harvest (per-wave materials) and luck (per-kill loot multiplier,
      // invade-effects.js:116 -> lk = 1 + luck/100) compound into money+XP, which is
      // what actually gates wave progression.
      const GROWTH_FIRST = ['harvest', 'luck', 'dmg', 'aspd', 'hp', 'crit', 'range', 'armor', 'elem', 'melee', 'ranged', 'eng', 'speed', 'dodge', 'steal', 'regen'];
      const pref = Array.isArray(A.opts.invadeLvPref) ? A.opts.invadeLvPref
        : (A.opts.invadeLvStyle === 'tank' ? TANK_FIRST
          : (A.opts.invadeLvStyle === 'growth' ? GROWTH_FIRST : DPS_FIRST));
      let best = null, bw = -1e9;
      for (const o of opts) {
        const idx = pref.indexOf(o.id);
        const w = pref.length - (idx >= 0 ? idx : pref.length);
        if (w > bw) { bw = w; best = o; }
      }
      if (best && typeof ivLvPick === 'function') { ivLvPick(best); A.status.note = '入侵：升级 ' + best.id; return true; }
      tap('Enter'); A.status.note = '入侵：升级'; return true;
    }
    if (G.state === 'ivshop') {
      // ---- 先合成升级：三件同名同阶 -> 一件 +1 阶（成长优先于数量） ----
      // ivCombine 自带同阶检查与 t<3 上限，直接调用是安全的。绝境里「阶」比
      // 「件数」重要得多：实测第 4 波后崩，缺的就是武器阶数。
      if (A.opts.invadeCombine !== false && typeof ivCombine === 'function') {
        const w = iv.w || [];
        for (let i = 0; i < w.length; i++) {
          const s0 = w[i]; if (!s0 || s0.t >= 3) continue;
          const dup = w.findIndex((q, j) => j !== i && q && q.id === s0.id && q.t === s0.t);
          if (dup >= 0) { try { ivCombine(i); A.status.note = '入侵：合成 ' + s0.id + ' → t' + (s0.t + 1); return true; } catch (e) { } }
        }
      }
      // ---- 槽位满时卖弱换强 ------------------------------------------------
      // ivBuy 在 6 槽且「非同阶可升」时直接拒绝（ivFlash('iv_full')），于是
      // 满了以后成长完全停滞。这里在买之前腾位：卖掉当前最弱的一件武器，
      // 但只在报价里确实有更强的武器时才卖（避免白卖）。
      const wl = iv.w || [];
      if (A.opts.invadeSell !== false && wl.length >= 6) {
        const offers = iv.offers || [];
        let bestOfferT = -1, bestOfferId = null;
        for (const o of offers) {
          if (!o || o.k !== 'w') continue;
          const t = o.t | 0;
          if (t > bestOfferT) { bestOfferT = t; bestOfferId = o.id; }
        }
        if (bestOfferT >= 0) {
          // weakest = lowest tier, tie-break by fewest duplicates (can't combine)
          let wi = -1, wt = 99, wdup = 99;
          for (let i = 0; i < wl.length; i++) {
            const s0 = wl[i]; if (!s0) continue;
            const dup = wl.filter((q) => q && q.id === s0.id && q.t === s0.t).length;
            const t = s0.t | 0;
            if (t < wt || (t === wt && dup < wdup)) { wi = i; wt = t; wdup = dup; }
          }
          if (wi >= 0 && wt < bestOfferT && typeof ivSell === 'function') {
            try { ivSell(wi); A.status.note = '入侵：卖弱换强 (t' + wt + '→可买t' + bestOfferT + ')'; return true; } catch (e) { }
          }
        }
      }
      // ---- 缺武器就 reroll 刷出武器 ----------------------------------------
      // 「钱买武器」是唯一被验证有效的杠杆（+94s / 1.94×）。如果这一屏报价里
      // 完全没有武器，且还付得起重掷，就重掷直到出现武器（ivReroll 自带付款与
      // freeRolls 检查）。有上限，避免把钱全烧在刷新上。
      if (A.opts.invadeReroll && typeof ivReroll === 'function') {
        const offers = iv.offers || [];
        const hasWeapon = offers.some((o) => o && o.k === 'w');
        const rollCap = A.opts.invadeRerollCap || 3;
        A._rollN = A._rollN || {};
        const wk = (iv.wave | 0);
        if (A._rollWave !== wk) { A._rollWave = wk; A._rollN[wk] = 0; }
        if (!hasWeapon && (A._rollN[wk] | 0) < rollCap) {
          const before = iv.rr | 0;
          try { ivReroll(); } catch (e) { }
          if ((iv.rr | 0) !== before) { A._rollN[wk] = (A._rollN[wk] | 0) + 1; A.status.note = '入侵：reroll 刷武器 (' + A._rollN[wk] + ')'; return true; }
        }
      }
      // buy affordable offers, most useful first, then start the next wave
      if (A.opts.invadeShop !== false) {
        const offers = iv.offers || [];
        const priceOf = (o) => { try { return ivPrice(o); } catch (e) { return 1e9; } };
        // purchase priority is switchable for A/B (A.opts.invadeShopStyle)
        const style = A.opts.invadeShopStyle || 'weapon';
        // set completion: >=2 pieces of one set grants a real stat bonus
        // (invade-effects.js), so a weapon that completes a set we already hold
        // one of is worth extra.
        const setOf = (id) => { try { const w = IV_W[id]; return (w && Array.isArray(w.set)) ? w.set : []; } catch (e) { return []; } };
        const counts = (() => { const c = {}; for (const s2 of (iv.w || [])) for (const k of setOf(s2.id)) c[k] = (c[k] || 0) + 1; return c; })();
        // Real DPS of an offered weapon at tier t: damage x projectiles / cooldown.
        // Ranking by tier alone (the old rule) picks a t3 wet noodle over a t1
        // hammer.  The measured wall is raw DPS (wave 4: foes 5->32 while ink +18).
        const dpsOf = (id, t) => {
          try {
            const w = IV_W[id]; if (!w) return 0;
            const dmg = Array.isArray(w.dmg) ? (w.dmg[Math.min(3, t | 0)] || 0) : (w.dmg || 0);
            const cd = Array.isArray(w.cd) ? (w.cd[Math.min(3, t | 0)] || 1) : (w.cd || 1);
            const n = w.n ? (Array.isArray(w.n) ? (w.n[Math.min(3, t | 0)] || 1) : w.n) : 1;
            return (dmg * n) / Math.max(.15, cd);
          } catch (e) { return 0; }
        };
        // duplicate of something we own at the same tier => buying it enables a
        // COMBINE (+1 tier, multiplicative damage), which is worth more than a
        // same-DPS stranger.
        // Buying a duplicate enables a COMBINE (+1 tier = multiplicative damage).
        // Weight is switchable: 'strong' prioritises combines over raw DPS.
        const dupW = A.opts.invadeDupStyle === 'strong' ? 400 : 120;
        const dupBonus = (id, t) => ((iv.w || []).some((q) => q && q.id === id && (q.t | 0) === (t | 0)) ? dupW : 0);
        const setBonus = (id) => {
          if (A.opts.invadeSets === false) return 0;
          let b = 0;
          for (const k of setOf(id)) { const n = counts[k] || 0; if (n >= 1) b += 40 + Math.min(4, n) * 15; }
          return b;
        };
        const rank = (o) => {
          if (!o) return -1;
          if (style === 'weapon') return o.k === 'w' ? 60 + dpsOf(o.id, o.t | 0) + dupBonus(o.id, o.t | 0) + setBonus(o.id) : 10;   // weapons only, best DPS first
          if (o.k === 'w') return 100 + (o.t || 0) * 10;            // otherwise strongest weapon
          const id = o.id || '';
          if (/dmg|crit|aspd|atk|power/.test(id)) return 90;
          if (/hp|armor|regen|life|shield/.test(id)) return 70;
          if (/speed|dodge|warp/.test(id)) return 60;
          return 40;
        };
        let bi = -1, bs = -1;
        for (let i = 0; i < offers.length; i++) { const o = offers[i]; if (!o) continue; if (priceOf(o) > (G.ink | 0)) continue; const s2 = rank(o); if (s2 > bs) { bs = s2; bi = i; } }
        if (bi >= 0 && typeof ivBuy === 'function') { ivBuy(bi); A.status.note = '入侵：购买 #' + bi; return true; }
      }
      if (typeof ivNextWave === 'function') { ivNextWave(); A.status.note = '入侵：开始第 ' + ((iv.wave | 0) + 1) + ' 波'; return true; }
      return false;
    }
    return false;
  }

  function drivePlay(G, p, tap) {
    // invade runs its own arena logic (no rooms/doors/interactables at all)
    if (G.mode === 'invade') {
      driveInvade(G, p, tap);
      // trace: invade state is invisible to the normal debug mirror (we return early)
      if (TSW.trace) {
        const iv0 = G.iv || {};
        try {
          A.dbg = { t: G.time | 0, mode: 'invade', state: G.state, wave: iv0.wave | 0, phase: iv0.phase || '', bosses: (iv0.bosses || []).length, bossTT: Math.round((iv0.bossT || -1) * 10) / 10,
            t_: Math.round(iv0.t || 0), lv: iv0.lv | 0, lvPend: iv0.lvPend | 0, ink: G.ink | 0,
            foes: (G.enemies || []).filter((e) => !e.dead).length, note: A.status.note, px: Math.round(p.x), py: Math.round(p.y) };
          if ((G.time | 0) % 3 === 0 && A._dbgT !== (G.time | 0)) { A._dbgT = G.time | 0; TSW.log('DBG ' + JSON.stringify(A.dbg)); }
        } catch (e) { }
      }
      return;
    }

    // ---- keep the strongest gun in the main hand ----------------------------
    // Only the held weapon fires at full rate; the holstered one needs the volley
    // shard and even then delivers 12% (shards3.js:50).  A run that ended with
    // nail held and bow holstered measured 8 real dps.  This used to sit inside
    // the combat branch, so it only ran while enemies were visible — too late.
    if (A.opts.mainHandBest !== false && p.weapons && p.weapons.length > 1 && p.dashT <= 0) {
      try {
        const cur = p.weapons[p.wi], alt = p.weapons[1 - p.wi];
        if (alt && cur && alt !== cur && wDps(alt) > wDps(cur) + 1.5) {
          A._mhLog = (A._mhLog || 0) + 1;
          if (A._mhLog <= 3) console.info('[mh] swap ' + cur + '->' + alt + ' dps ' + Math.round(wDps(cur)) + '->' + Math.round(wDps(alt)));
          tap('KeyX'); A.status.note = '主手换强枪 ' + alt;
        }
      } catch (e) { }
    }
    // no floor yet: do nothing but keep the status honest (a stale objective here
    // used to strand the autopilot in an endless "walk to X" loop)
    if (typeof WORLD === 'undefined' || !WORLD || !Array.isArray(WORLD.rooms) || !WORLD.rooms.length) {
      A.status.note = '等待地形生成…'; A.status.target = null;
      return;
    }
    const w = WEAPONS[p.weapons[p.wi]], melee = isMelee(w.id);
    const active = WORLD.rooms.find((r) => r.active);
    const foes = G.enemies.filter((e) => !e.dead && e.spawnT <= 0);
    const near = nearestEnemy(p.x, p.y, 900, false);
    A.status.note = '';

    // Teleport! freezes the whole simulation until a destination click lands
    if (G.tpPause) {
      const ne = near || foes[0];
      let tx = p.x + 60, ty = p.y;
      if (ne) { tx = ne.x; ty = ne.y; }                       // blink onto the nearest foe
      else { const a = Math.random() * 6.28; tx = p.x + Math.cos(a) * 90; ty = p.y + Math.sin(a) * 90; }
      Input.mx = clampM(tx - G.cam.x, GW()); Input.my = clampM(ty - G.cam.y, GH());
      Input.clicked = true;
      A.status.note = '瞬移…';
      return;
    }

    // ---------- interactions (E) ----------
    if (A.mode === 'full' && !active) {
      for (const it of G.inter) {
        const d = dist(p.x, p.y, it.x, it.y); if (d > 24) continue;
        if (A.opts.interDebug) console.info('[inter] ' + it.kind + ' d=' + d.toFixed(0) + ' used=' + !!it.used);
        if (it.kind === 'fount' && A.opts.fount && !it.used && p.hp < p.maxHp - 1 && !hasCurse('drought') && G.ink >= it.cost) { A.status.note = '治疗'; tap('KeyE'); break; }
        if (it.kind === 'chest' && A.opts.chest && !it.used) { A.metrics.interChest = (A.metrics.interChest || 0) + 1; A.status.note = '开箱'; tap('KeyE'); break; }
        // ---- every remaining interactable kind --------------------------------
        // Enumerated from game.js: 19 kinds exist and the bot used to handle eight,
        // which is why chests/inks/altars were walked past and no ink ever
        // accumulated for forging.
        if (it.kind === 'vault' && A.opts.vault && !it.used && (G.ink | 0) >= (it.cost | 0) + 20) {
          A.status.note = '保险柜'; tap('KeyE'); break;
        }
        if (it.kind === 'idol' && A.opts.idol && !it.used && (G.curses || []).length < 2) {
          A.status.note = '偶像祈愿'; tap('KeyE'); break;
        }
        if (it.kind === 'altar' && A.opts.altar && !it.used && p.hp > 2 && A.opts.altarPact) {
          A.status.note = '祭坛立约'; tap('KeyE'); break;
        }
        if (it.kind === 'totem' && A.opts.trial && !it.used && G.time > 12) {
          A.status.note = '开始试炼'; tap('KeyE'); break;
        }
        if (it.kind === 'forge' && A.opts.forge) {
          const fid = p.weapons[p.wi], flv = (p.wlv && p.wlv[fid]) | 0, fcost = 30 + flv * 25;
          if (flv < 3 && (G.ink | 0) >= fcost + 15) { A.status.note = '锻造 +' + (flv + 1); tap('KeyE'); break; }
        }
        if (it.kind === 'shop' && A.opts.shop && !it.sold) {
          if (it.what === 'heart' && p.hp < p.maxHp && (G.ink | 0) >= it.price) { A.status.note = '买心'; tap('KeyE'); break; }
          if (it.what === 'shard' && (G.ink | 0) >= it.price) { A.status.note = '买血清'; tap('KeyE'); break; }
          if (it.what === 'chip' && !p.skill && (G.ink | 0) >= it.price) { A.status.note = '买技能'; tap('KeyE'); break; }
          if (it.what === 'weapon' && (G.ink | 0) >= it.price && (p.weapons || []).length < wCap()) { A.status.note = '买武器'; tap('KeyE'); break; }
          continue;
        }
        if (it.kind === 'ink' && A.opts.pickups) { A.status.note = '捡墨水'; break; }   // walk over
        if (it.kind === 'survivor' && A.opts.mate && !it.used) {
          const wantMate = !A.goal.mate() || it.id === A.goal.mate() || it.id === A.goal.radio();
          if (wantMate) { A.status.note = '招募搭档 ' + it.id; tap('KeyE'); break; }
          continue;
        }
        if (it.kind === 'arsrack' && A.opts.arsenal && !it.used) { A.status.note = '军械库：打开武器架'; tap('KeyE'); break; }
        if (it.kind === 'labvial' && A.opts.labSerum && !it.used) { A.status.note = '实验血清：打开'; tap('KeyE'); break; }
        if (it.kind === 'dialysis' && A.opts.dialysis && !it.used && (G.curses || []).length && ((p.maxArmor | 0) >= 1)) { A.status.note = '透析机：清诅咒'; tap('KeyE'); break; }
        if (it.kind === 'key' || it.kind === 'prism') break; // walk over
        if (it.kind === 'chip') {
          const wantSkill = !p.skill || it.id !== 'teleport' || it.id === A.goal.skill();
          if (A.opts.chipPick && wantSkill) { tap('KeyE'); break; }
          continue;
        }
        if (it.kind === 'weapon') {
          // Compare by real DPS when asked: the policy table alone lets the bot
          // keep a preferred-but-weak gun over a much stronger pickup.
          const rDps = (id) => {
            try {
              const ww = WEAPONS[id]; if (!ww) return 0;
              const lv = (p.wlv && p.wlv[id]) | 0;
              return (ww.dmg || 0) * (ww.rate || 1) * (ww.n || 1) * (1 + .25 * lv);
            } catch (e) { return 0; }
          };
          const cur = A.opts.weaponDps ? rDps(w.id) : wScore(w.id);
          const nw = A.opts.weaponDps ? rDps(it.id) : wScore(it.id);
          // At capacity, picking up a different gun REPLACES the held one, so the
          // count never grows and we can lose a weapon that was already firing.
          // Only swap when the held one is clearly worse AND we are not trading
          // away a second gun (measured: always-swap left seed 5 with one weapon
          // and dps 79, versus two weapons and dps 120).
          // Picking up a gun while the held slot already has one REPLACES the held
          // weapon — the count stays the same.  Refusing to swap at capacity (the
          // previous behaviour) froze the starting `nail` in place forever: every
          // one of 12 runs still carried nail, contributing 35 of a total 52-76 dps.
          const atCap = p.weapons.length >= wCap();
          const clearlyBetter = nw > cur + .5;
          const worthSwap = clearlyBetter;              // count is preserved either way
          if (worthSwap || p.weapons.length < wCap()) {
            A.status.note = '拿武器 ' + it.id;
            tap('KeyE');
            const tries = (A._pickTries.get(it) || 0) + 1; A._pickTries.set(it, tries);
            if (tries > 240) { benchFor(it, 90); A._pickTries.delete(it); A.status.note = '放弃该武器'; }
          } else benchFor(it, 90);
          break;
        }
        if (it.kind === 'forge' && A.opts.forge) { const lv = p.wlv[w.id] || 0, cost = 30 + lv * 25; if (lv < 3 && G.ink >= cost + 15) { A.status.note = '锻造 +' + (lv + 1); tap('KeyE'); } break; }
        if (it.kind === 'shop' && A.opts.shop && !it.sold) {
          if (it.what === 'heart' && p.hp < p.maxHp && G.ink >= it.price) { tap('KeyE'); break; }
          {   // configurable bar (the earlier attempt never landed — verified by grep this time)
            const bar = (A.opts.shopShardBar === undefined) ? 2 : A.opts.shopShardBar;
            if (it.what === 'shard' && G.ink >= it.price && !excluded(it.id) && scoreShard(it.id, (p.shards[it.id] || 0) + 1) >= bar) { tap('KeyE'); break; }
          }
          if (it.what === 'weapon' && G.ink >= it.price) {
            // Rank by measured damage, not the policy table — the shop is one of
            // only two places a weapon can be chosen rather than stumbled upon.
            const shopD = A.opts.shopByDps === false ? wScore(it.id) * 20 : wDps(it.id);
            const heldD = A.opts.shopByDps === false
              ? wScore(w.id) * 20
              : wDps(w.id) * (1 + .25 * (((p.wlv && p.wlv[w.id]) | 0)));
            const room = p.weapons.length < wCap();
            const better = shopD > heldD * 1.1 + 1;
            if (room || better) { tap('KeyE'); A.status.note = '商店买枪 ' + it.id; break; }
          }
          if (it.what === 'chip' && G.ink >= it.price && !p.skill) { tap('KeyE'); break; }
          continue;
        }
        if (it.kind === 'portal') {
          if (it.endless && A.opts.preferEndless && G.time - it.born > .6) { A.status.note = '→ 无尽'; tap('KeyE'); break; }
          if (!it.endless && !G.endless && G.time - it.born > .6) { A.status.note = '→ 下一层'; tap('KeyE'); break; }
        }
        if (it.kind === 'seal' && G.hasKey) { tap('KeyE'); break; }
      }
    }

    // ---------- combat target & kite ----------
    let mx = 0, my = 0, wantFire = false;
    if (active || G.trial || near) {
      // In a boss room, phase changes summon two rings (bring(..., dn(22), ...),
      // boss.js:44).  Chasing the boss while 22 adds are alive means taking
      // contact damage from every direction, and several runs died with the boss
      // on 11-118 hp exactly there.  Clear the adds first, then the boss.
      let ne = nearestEnemy(p.x, p.y, 900, false) || (G.boss && !G.boss.dead ? G.boss : null);
      // ---- focus a target until it dies --------------------------------------
      // Damage spread across several enemies leaves all of them half-dead, so the
      // room takes longer than killing them one by one.  Keep hitting the current
      // target while it is alive, visible and not absurdly far; drop it otherwise.
      // Enemies carry no id field, so hold the object reference itself.
      try {
        if (A.opts.focusFire !== false) {
          const keep = A._focusRef;
          if (keep && !keep.dead && keep.deathFightLeft <= 0 && keep.spawnT <= 0
              && Math.hypot(keep.x - p.x, keep.y - p.y) < 460 && los(p.x, p.y, keep.x, keep.y)) {
            ne = keep; A.status.note = '集火 ' + Math.round(keep.hp | 0);
          } else {
            A._focusRef = (ne && ne !== (G.boss || null)) ? ne : undefined;
          }
        }
      } catch (e) { }
      try {
        const inBossRoom = !!(active && active.type === 'boss');
        if (inBossRoom && A.opts.bossAddsFirst !== false) {
          const adds = (G.enemies || []).filter((e) => !e.dead && !(e.boss) && e.spawnT <= 0 && e.deathFightLeft <= 0
            && Math.hypot(e.x - p.x, e.y - p.y) < 420);
          if (adds.length >= 2) {
            let best = null, bd = 1e9;
            for (const a of adds) {
              if (!los(p.x, p.y, a.x, a.y)) continue;
              const dd = Math.hypot(a.x - p.x, a.y - p.y);
              if (dd < bd) { bd = dd; best = a; }
            }
            if (best) { ne = best; A.status.note = '清boss援兵 ' + adds.length; }
          }
        }
      } catch (e) { }
      // aim at the closest foe WITH a clear shot (falls back to the closest so the
      // aim stays warm); firing is gated on that target actually existing
      let neF = nearestEnemy(p.x, p.y, 900, true);
      // 「sear」stacks need the SAME enemy hit again within 1s (shards2.js:103);
      // switching targets resets the counter to 1.  When we own the shard, keep
      // hammering the enemy already carrying stacks instead of the closest one.
      try {
        if (G.S && G.S.sear && neF) {
          let best = null, bestScore = -1;
          const now = G.time;
          for (const e of (G.enemies || [])) {
            if (e.dead || e.spawnT > 0 || e.deathFightLeft > 0) continue;
            if (!los(p.x, p.y, e.x, e.y)) continue;
            const dd = Math.hypot(e.x - p.x, e.y - p.y);
            if (dd > 900) continue;
            const fresh = (now - (e.searT || -9)) < 1.0;
            const n = fresh ? (e.searN | 0) : 0;
            // strongly prefer stacked targets, then nearer ones
            const sc = n * 100 - dd * .1 + (e.boss ? 30 : 0);
            if (sc > bestScore) { bestScore = sc; best = e; }
          }
          if (best) neF = best;
        }
      } catch (e) { }
      // ---- 清房停滞：房间已激活但没有「能打到」的敌人 → 主动去找那一个漏网的 ----
      if (active && !neF) {
        const anyFoe = nearestEnemy(p.x, p.y, 2000, false);
        if (anyFoe) {
          A._hunt = (A._hunt || 0) + 1;
          // Abort hunting if this floor still has an uncollected prism: serums are
          // the damage growth (measured 12 vs 2.9 for over-clearing runs), so a
          // pickup is worth more than chasing an unreachable straggler.
          const nearPrism = (G.inter || []).find((i) => i.kind === 'prism');
          if (nearPrism && A._hunt > 60) {
            // go take the serum instead of chasing an unreachable straggler
            const gx = nearPrism.x - p.x, gy = nearPrism.y - p.y, gl = Math.hypot(gx, gy) || 1;
            mx += gx / gl * 1.2; my += gy / gl * 1.2;
            A.status.note = '弃追：先去拿棱镜';
            A._hunt = 0;
          }
          if (A._hunt > 30) {                       // ~0.5s of no shot: commit to hunting
            // Straight chase: keeps aim/DPS live.  (A BFS "walk to a shootable
            // tile" variant was measured over 3 seeds: 284s/54.7 kills vs
            // 323s/52.7 straight — inside the +-30% run-to-run noise, so it was
            // not adopted.  See docs/benchmark.md §10.)
            const hx = anyFoe.x - p.x, hy = anyFoe.y - p.y, hl = Math.hypot(hx, hy) || 1;
            mx = hx / hl; my = hy / hl;
            A.status.note = '清房：追击漏网之敌';
            A.status.target = 'hunt';
          }
        }
      } else if (neF) A._hunt = 0;
      const aimT = neF || ne;
      if (aimT) { Input.mx = clampM(aimT.x - G.cam.x, GW()); Input.my = clampM(aimT.y - G.cam.y, GH()); }
      // ---- 战斗状态机：RETREAT / FOCUS / KITE ------------------------------
      // 原来的逻辑是逐帧的临时判断（护甲阈值 + 距离带），没有记忆，于是会在
      // 边界上抖动。 这里引入明确的三态：
      //   RETREAT  护甲破且未恢复 / 低血              → 拉远到 170~250 且不开火
      //   FOCUS    场上 <=3 敌且血量健康              → 压到近距（40~90）抢输出
      //   KITE     其它情况（人海）                   → 保持 90~150 绕行
      // 进入/退出都带滞回（迟滞窗口），避免逐帧翻转。
      if (ne) {
        const d = dist(p.x, p.y, ne.x, ne.y);
        const foesN = (G.enemies || []).filter((e) => !e.dead && e.spawnT <= 0).length;
        const nowT = G.time || 0;
        let st = A.opts.fightSM === false ? 'LEGACY' : (A._fightState || 'KITE');
        // 「pristine」is a two-way shard: full armour is +20~35% damage, but any
        // missing plate drops it to 0.75x (0.65x at lv2).  Losing the last point
        // is therefore a big damage loss, so retreat BEFORE the plate breaks.
        let pristineGuard = false;
        try { pristineGuard = !!(G.S && G.S.pristine); } catch (e) { }
        // In a boss room the fight is decided by damage-over-window (one run took
        // a 3654 hp boss to 20 and still died), so surviving longer converts
        // directly into damage.  Behave like the alpha period: wider spacing.
        let bossRoom = false;
        try { bossRoom = !!(active && active.type === 'boss'); } catch (e) { }
        const wantRetreat = pristineGuard
          ? ((p.armor <= 1 && p.lastHit < 3.6) || (p.hp <= 2))
          : ((p.armor <= 0 && p.lastHit < 3.6) || (p.hp <= 2 && p.armor <= 0));
        if (wantRetreat) { st = 'RETREAT'; A._stateHold = nowT + .6; }
        else if (st === 'RETREAT' && nowT < (A._stateHold || 0)) { /* hold the retreat a beat */ }
        else if (st === 'RETREAT') { st = foesN <= 3 ? 'FOCUS' : 'KITE'; A._stateHold = nowT + .8; }
        else if (st === 'KITE' && foesN <= 3 && p.armor >= 1) { st = 'FOCUS'; A._stateHold = nowT + .8; }
        else if (st === 'FOCUS' && nowT > (A._stateHold || 0) && (foesN > 4 || p.armor <= 0)) { st = 'KITE'; A._stateHold = nowT + .8; }
        A._fightState = st;
        A.status.mode = st;
        let retreat, focus;
        if (st === 'LEGACY') {                    // the old per-frame rule (A/B baseline)
          retreat = (p.armor <= 0 && p.lastHit < 3.6) || (p.hp <= 2 && p.armor <= 0);
          focus = false;
        } else { retreat = st === 'RETREAT'; focus = st === 'FOCUS'; }
        const bs = hard() ? 1.2 : 1;                    // harder difficulties keep more distance
        // ---- per-weapon-kind spacing ------------------------------------
        // Only the PIERCING case is differentiated: those guns want standoff so a
        // single shot threads a whole column (see docs/weapons.md).  Melee keeps
        // the old melee-only band — widening that to every "short range" kind
        // regressed the runs badly (seed 5: 268 -> 45 kills).
        const wk = w ? w.kind : 'gun';
        const pierceK = (wk === 'rail' || (w && (w.pierce | 0) >= 0 && (w.pierce | 0) >= 1));
        const gNL = gene('bandNearLo'), gNH = gene('bandNearHi');
        const gFL = gene('bandFarLo'), gFH = gene('bandFarHi');
        const gML = gene('meleeLo'), gMH = gene('meleeHi');
        const band = (retreat ? [170, gene('retreatHi')]
          : focus ? (melee ? [gML, gMH] : pierceK ? [gNL + 20, gNH + 20] : [gNL, gNH])
            : (melee ? [gML, gMH] : pierceK ? [gFL - 10, gFH - 10] : [gFL, gFH])).map((v) => Math.round(v * bs));
        // 「close」shard multiplies damage by up to +40% (1.5x with demolition)
        // inside 110px (shards2.js:102), but the default band sits at 90-150, so
        // that multiplier is almost never collected.  When we own it, close in.
        try {
          const st = G.S || {};
          if (st.close && !A._alphaMode) {
            band[0] = Math.max(26, Math.round(band[0] * .45));
            band[1] = Math.max(50, Math.round(Math.min(band[1], 110)));
          }
        } catch (e) { }
        // α serum active: widen the band so contact is less likely at all
        if (A._alphaMode) { band[0] = Math.round(band[0] * 1.5); band[1] = Math.round(band[1] * 1.45); }
        else if (bossRoom) { band[0] = Math.round(band[0] * 1.25); band[1] = Math.round(band[1] * 1.2); }
        // Critical health inside a boss room: several runs died with the boss on
        // 11-118 hp, i.e. a fraction of a second short.  When almost dead, break
        // off entirely and let armour regenerate (armour only comes back after
        // 3s without a hit) instead of trading the last hit for the boss's.
        const bossCritical = !!(bossRoom && p.hp <= 1 && A.opts.bossCriticalRetreat !== false);
        if (bossCritical) { band[0] = 230; band[1] = 330; retreat = true; A.status.note = 'boss残血自保'; }
        const ux = (ne.x - p.x) / (d || 1), uy = (ne.y - p.y) / (d || 1);
        if (d < band[0]) { mx -= ux; my -= uy; }
        else if (d > band[1]) { mx += ux; my += uy; }
        else if (pierceK) {
          // Piercing weapons: slide sideways until the aim line threads through as
          // many enemies as possible. A pierce shot that only touches the nearest
          // body throws away most of its value.
          let bestOff = 0, bestHits = -1;
          for (const off of [-48, -30, -16, -8, 0, 8, 16, 30, 48]) {
            const px2 = p.x - uy * off, py2 = p.y + ux * off;
            let hits = 0;
            for (const e of (G.enemies || [])) {
              if (e.dead || e.spawnT > 0) continue;
              const lx = e.x - px2, ly = e.y - py2;
              const along = lx * ux + ly * uy;
              if (along <= 0 || along > 420) continue;
              if (Math.abs(lx * uy - ly * ux) < 16) hits++;
            }
            if (hits > bestHits) { bestHits = hits; bestOff = off; }
          }
          if (bestOff) { mx += -uy * Math.sign(bestOff) * .8; my += ux * Math.sign(bestOff) * .8; }
          else { if (A._strafeFor !== ne.id) { A._strafeFor = ne.id; A._strafeS = Math.random() < .5 ? 1 : -1; }
            mx += -uy * .6 * A._strafeS; my += ux * .6 * A._strafeS; }
        }
        else {                                           // strafe — sign persists per target (no spinning)
          if (A._strafeFor !== ne.id) { A._strafeFor = ne.id; A._strafeS = Math.random() < .5 ? 1 : -1; }
          mx += -uy * .6 * A._strafeS; my += ux * .6 * A._strafeS;
        }
        // Retreating used to mean "stop shooting entirely", but 67-83 percent of
        // the idle combat time was spent with the trigger up.  While backing off
        // the target is still in range most of the time, so keep firing unless
        // the shot is hopeless (very far) — the damage is free.
        const retreatFire = retreat && A.opts.fireWhileRetreat !== false;
        const retreatRange = melee ? 120 : 520;
        wantFire = !!neF && d < (retreatFire ? retreatRange : (retreat ? 0 : (melee ? 90 : 450)));
        // Firing was off for 67-83 percent of the "enemies alive, nothing dying"
        // stretches.  The gate needs line of sight, and rooms are full of pillars,
        // so the bot holds fire exactly when a close shot could still connect.
        // Measured option: allow a point-blank shot without clear sight.
        if (!wantFire && !retreat && A.opts.fireWithoutLos) {
          const cl = nearestEnemy(p.x, p.y, A.opts.noLosRange || 150, false);
          if (cl) { wantFire = true; A.status.note = '近战无视线开火'; }
        }
        // Melee weapons destroy the bullets they swing through (deflectBullets,
        // weapons.js:209) and reflect 35% of them back.  Swinging while bullets
        // converge is therefore both defence and damage — do it even when no
        // enemy is currently aimable.
        if (A.opts.meleeBlock !== false && melee && !retreat) {
          let incoming = 0;
          for (const b of (G.ebullets || [])) {
            if (b.delay > 0) continue;
            const bd = Math.hypot(b.x - p.x, b.y - p.y);
            if (bd > 96) continue;
            const toMe = Math.atan2(p.y - b.y, p.x - b.x);
            const vel = Math.atan2(b.vy, b.vx);
            if (Math.abs(((toMe - vel + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < .6) incoming++;
          }
          if (incoming) { wantFire = true; if (!neF) A.status.note = '格挡弹幕'; }
        }
      }
      // doorway funnel: on hard difficulties, fight from the room's door —
      // enemies arrive one by one from a narrow arc instead of surrounding us.
      const neDist = ne ? dist(p.x, p.y, ne.x, ne.y) : 1e9;
      if (hard() && !melee && neDist > 70 && active && active.type === 'combat' && active.doors.length) {
        let bd = null, bdd = 1e9;
        for (const pair of active.doors) {
          const px = pair[0] * 16 + 8, py = pair[1] * 16 + 8, dd = dist(p.x, p.y, px, py);
          if (dd < bdd) { bdd = dd; bd = [px, py]; }
        }
        if (bd && bdd > 26 && bdd < 220) {
          mx += (bd[0] - p.x) / bdd * .9; my += (bd[1] - p.y) / bdd * .9;
          A.status.note = 'doorfunnel';
        }
      }
      // live rotating lasers get a dedicated escape vector (see laserPush)
      { const [lx, ly] = laserPush(p); if (lx || ly) { mx += lx * 1.6; my += ly * 1.6; A.status.note = '躲激光扫射'; } }
      // threat field does the dodging: bullets, telegraph circles/lines, void zones, spikes
      [mx, my] = pickDir(p, mx, my);
      // ---- evasion scorecard (meaningful while a fight is live)
      {  // always score the dodge while a run is live (benchmark + HUD)
        const M = A.metrics, dg = spotDanger(p.x, p.y, p);
        M.ticks++; M.dangerSum += dg; if (dg >= 1.2) M.hazard++;
        const cl = laneClear(p, mx, my); M.clearSum += cl; if (cl < M.clearMin) M.clearMin = cl;
        if (M.samples.length < 4000) M.samples.push(cl);
      }
      // dash out when the current spot is about to hurt and the dash is up (never into a pit)
      const dirdash = () => { const l = Math.hypot(mx, my) || 1; return dashSafe(p, mx / l, my / l); };
      if (A.opts.dash && p.dashCd <= 0 && spotDanger(p.x, p.y, p) >= (hard() ? 1.3 : 1.8)) {
        const dd = dashDir(p, [mx, my]);                 // escape toward the calmest arc
        if (dd) { Input.keys.KeyW = dd[1] < -.3; Input.keys.KeyS = dd[1] > .3; Input.keys.KeyA = dd[0] < -.3; Input.keys.KeyD = dd[0] > .3; tap('Space'); A.metrics.dash++; }
        else if (dirdash()) { tap('Space'); A.metrics.dash++; }
      }
      if (A.opts.dash && ne && dist(p.x, p.y, ne.x, ne.y) < 26 && p.dashCd <= 0 && dirdash()) tap('Space');
      // proactive reload: a dry mag triggers the passive reload (SLOTH curse: 1 dmg each)
      if (usesAmmo(w)) {
        const a = ammoOf(p, w.id), cap = magSize(w) || 1;
        const sloth = hasCurse('sloth');
        const low = a.n <= Math.max(1, Math.round(cap * (sloth ? .45 : .2)));
        const safeish = sloth || !nearestEnemy(p.x, p.y, 140, false);
        if (A.opts.reload && a.rl <= 0 && p.dashT <= 0 && (a.n <= 0 || (low && safeish))) tap('KeyR');
      }
      // ---- reload window: switch to the sidearm instead of standing there dry ----
      // KeyX toggles p.wi (game.js:160).  While the equipped weapon is reloading
      // we swap to the other one if *it* is loaded; when the first is ready again
      // we swap back so the better weapon keeps the DPS.
      if (A.opts.weaponSwap && p.weapons.length > 1 && p.dashT <= 0) {
        const curW = WEAPONS[p.weapons[p.wi]], othW = WEAPONS[p.weapons[1 - p.wi]];
        // Melee carries no magazine, so "wait for a reload" does not apply: if
        // either slot is a melee weapon the swap window is meaningless, and
        // swapping steals the melee blocking/deflection the bot relies on.
        const anyMelee = isMelee(curW && curW.id) || isMelee(othW && othW.id);
        if (curW && othW && !anyMelee && usesAmmo(curW) && usesAmmo(othW)) {
          const curA = ammoOf(p, curW.id), othA = ammoOf(p, othW.id);
          const curBusy = curA.rl > 0 || curA.n <= 0;
          const othReady = othA.rl <= 0 && othA.n > 0;
          const othBusy = othA.rl > 0 || othA.n <= 0;
          const curReady = curA.rl <= 0 && curA.n > 0;
          // The main-hand rule owns weapon choice; the reload dance must never
          // fight it.  Only swap for reloading when the MAIN hand is meant to be
          // the weaker gun (i.e. mainHandBest is off) or the swap keeps the best.
          const curDps = wDps(curW.id), othDps = wDps(othW.id);
          const keepBest = A.opts.mainHandBest !== false;
          if (curBusy && othReady && (!keepBest || othDps >= curDps)) { tap('KeyX'); A.status.note = '换弹切副武器 ' + othW.id; }
          else if (curReady && othBusy && (!keepBest || curDps >= othDps) && wScore(curW.id) >= wScore(othW.id)) { tap('KeyX'); A.status.note = '切回主武器 ' + curW.id; }
        }
      }
      // ---- radio partner skill: KeyF (partners.js) ----
      if (A.opts.partner && G.ptn && (G.ptn.cd || 0) <= 0 && !(G.ptn.act && G.ptn.act.t < G.ptn.act.dur) && !G.prompt) {
        tap('KeyF'); A.status.note = '搭档技能 ' + (G.ptn.id || '');
      }
      // ---- per-skill policy ---------------------------------------------
      // All three chips are 5s buff / 25s cooldown, and limit/dash are `manual`
      // (press E again to end early).  Firing on cooldown wastes them: the point
      // is to have the buff ACTIVE during danger, not during empty corridors.
      if (A.opts.skill && p.skill && !G.prompt) {
        const foesNow = (G.enemies || []).filter((e) => !e.dead && e.spawnT <= 0 && e.deathFightLeft <= 0).length;
        const closeFoes = (G.enemies || []).filter((e) => !e.dead && e.spawnT <= 0 && e.deathFightLeft <= 0
          && Math.hypot(e.x - p.x, e.y - p.y) < 150).length;
        let want = false;
        if (p.skill === 'limit') {
          // 0.2x slow on everything but us: strongest when a crowd is on top of us
          want = closeFoes >= 4 || p.hp <= 2;
        } else if (p.skill === 'dash') {
          // 3 shields + speed: save it for when we are about to be hit, i.e.
          // armour already broken (then any hit costs real hp)
          want = p.armor <= 0 || p.hp <= 2 || (spotDanger(p.x, p.y, p) >= 2.6);
        } else if (p.skill === 'risk') {
          // fatal damage leaves 1hp: use it when we are in real danger, not on cd
          want = p.hp <= 2 || spotDanger(p.x, p.y, p) >= 2.2 || closeFoes >= 3;
        } else {
          want = foesNow > 0;
        }
        // hold the buff while the threat is still live; end it early when the
        // room went quiet so the cooldown starts sooner
        if (p.skillOn) {
          const stillNeeded = p.skill === 'limit' ? (closeFoes >= 2 || p.hp <= 2)
            : p.skill === 'dash' ? (p.armor <= 1 || spotDanger(p.x, p.y, p) >= 1.6)
              : (p.hp <= 3 || spotDanger(p.x, p.y, p) >= 1.6);
          if (!stillNeeded && p.skillT > 1.2) tap('KeyE');       // manual skills: end early
        } else if (want && p.skillCd <= 0 && (active || G.trial || near)) {
          tap('KeyE');
        }
      }
    }

    // debug mirror: what the bot *thinks* the world looks like this tick
    try {
      // accumulate fight distance HERE: at the top of drivePlay the tick's
      // enemies have not spawned yet, so that version always read -1
      try {
        const es = (G.enemies || []).filter((e) => !e.dead && e.spawnT <= 0);
        if (es.length) {
          let d = 1e9;
          for (const e of es) { const dd = Math.hypot(e.x - p.x, e.y - p.y); if (dd < d) d = dd; }
          A._fdSum = (A._fdSum || 0) + d; A._fdN = (A._fdN || 0) + 1;
        }
        if ((A._fdN || 0) >= 30) { A._fdAvg = A._fdSum / A._fdN; A._fdSum = 0; A._fdN = 0; }
        else if (A._fdN) A._fdAvg = A._fdSum / A._fdN;
      } catch (e) { }
      A.dbg = {
        t: G.time | 0,
        world: (typeof WORLD !== 'undefined' && WORLD) ? (WORLD.w + 'x' + WORLD.h + ' rooms=' + (WORLD.rooms || []).length) : 'NO_WORLD',
        active: !!(active && active.id !== undefined), trial: !!G.trial, near: near | 0,
        // NOTE: chromium truncates long console lines (~308 chars), so put the
        // fields we actually read FIRST.  Anything at the end (px/py/iMin) never
        // reaches the log.
        xy: Math.round(p.x) + ',' + Math.round(p.y),
        tgt: (function () {
          const t = A._tgtPt; if (!t) return String(A.status.target || '');
          return Math.round(t[0]) + ',' + Math.round(t[1]);
        })(),
        state: G.state, obj: A.status.target, note: A.status.note,
        inter: (G.inter || []).length,
        orbs: (G.floorOrbs | 0) + '/' + (G.bonusOrbs | 0),
        floorN: G.floor | 0,
        roomsN: (typeof WORLD !== 'undefined' && WORLD && WORLD.rooms) ? WORLD.rooms.length : -1,
        clearedN: (typeof WORLD !== 'undefined' && WORLD && WORLD.rooms) ? WORLD.rooms.filter((r) => r.cleared).length : -1,
        openRooms: (typeof WORLD !== 'undefined' && WORLD && WORLD.rooms) ? WORLD.rooms.filter((r) => !r.cleared).map((r) => r.type + (r.active ? '*' : '')).join(',') : '',
        prisms: (G.inter || []).filter((i) => i.kind === 'prism').length,
        shardN: Object.keys((G.p && G.p.shards) || {}).length,
        // averaged over the last trace window (per-tick snapshots alias badly: the
        // 3s trace tick kept landing on navigation frames, where enemies are
        // filtered out, so every sample read -1)
        fightD: A._fdAvg ? Math.round(A._fdAvg) : -1,
        fightN: (G.enemies || []).filter((e) => !e.dead && e.spawnT <= 0).length,
        ink: G.ink | 0,
        forgeRooms: (typeof WORLD !== 'undefined' && WORLD && WORLD.rooms) ? WORLD.rooms.filter((r) => r.type === 'forge').length : -1,
        px: Math.round(p.x), py: Math.round(p.y),
        vial: (function () { const v = (G.inter || []).find((i) => i.kind === 'labvial' && !i.used); return v ? Math.round(Math.hypot(v.x - p.x, v.y - p.y)) : -1; })(),
        iMin: (function () {
          let m = 999, k = '';
          for (const it of (G.inter || [])) { if (it.used) continue; const dd = Math.round(Math.hypot(it.x - p.x, it.y - p.y)); if (dd < m) { m = dd; k = it.kind; } }
          return k ? (k + '@' + m) : '';
        })(),
        wp: A._lastWp ? [Math.round(A._lastWp[0]), Math.round(A._lastWp[1])] : null,
      };
      // trace mode: with ?trace=1 print the mirror so headless runs can see it
      if (TSW.trace && (G.time | 0) % 3 === 0 && A._dbgT !== (G.time | 0)) { A._dbgT = G.time | 0; TSW.log('DBG ' + JSON.stringify(A.dbg)); }
    } catch (e) { A.dbg = { err: String(e).slice(0, 80) }; }

    // ---- 导航硬兜底 ----------------------------------------------------------
    // Measured failure (seed 91): the bot locked a far objective and stood still
    // for 90+ game-seconds with a valid waypoint,因为 pickDir 在该点找不到任何
    // 得分 > 0 的方向（威胁场 + 墙惩罚同时压制）。 任何「零位移」都必须被打破。
    if (A.opts.navFallback && (A.mode === 'full') && !active && !G.trial) {
      // Progress is measured from the distance to the OBJECTIVE, not raw movement:
      // oscillating between two unreachable points moves plenty while getting
      // nowhere, and that is exactly the "stuck in a corner" symptom (60 seconds of
      // walking, 50 pixels of progress).
      const moved = (A._mvRef && Math.hypot(p.x - A._mvRef[0], p.y - A._mvRef[1]));
      const realProgress = moved;      // objective-distance progress collapsed runs; see docs

      if (!A._mvRef || !isFinite(moved) || realProgress > 6) { A._mvRef = [p.x, p.y]; A._mvT = G.time; }
      else if (G.time - (A._mvT || 0) > 2.5) {
        A._mvT = G.time;
        // force a movement burst in a committed random direction (pit/void safe)
        let ang2 = Math.random() * Math.PI * 2, okDir = null;
        for (let k = 0; k < 8; k++) {
          const a2 = ang2 + k * Math.PI / 4, dx2 = Math.cos(a2), dy2 = Math.sin(a2);
          if (typeof dashSafe === 'function' ? dashSafe(p, dx2, dy2) : true) { okDir = [dx2, dy2]; break; }
        }
        if (okDir) {
          A._forceDir = okDir; A._forceUntil = G.time + 1.2;
          A.metrics.navStall = (A.metrics.navStall | 0) + 1;
          A.status.note = '导航兜底：强制移动';
        }
      }
      A._forceActive = (A._forceUntil && G.time < A._forceUntil) ? A._forceDir : null;
    }

    // ---------- navigation (no active fight) ----------
    if (!active && !G.trial && A.mode === 'full') {
      let tgt = pickObjective(G, p);
      A._tgtPt = (tgt && tgt.pt) ? tgt.pt.slice(0, 2) : null;
      // ---- 通用目标放弃 ---------------------------------------------------
      // Any objective the bot keeps re-choosing but never completes pins the whole
      // run (measured: forge for 960s with 10/11 rooms already cleared).  The forge
      // case got its own timeout; this is the general net for shrine/treasure/camp/
      // boss/… so a single unreachable special can never freeze a run again.
      if (tgt) {
        const gk = tgt.label + '|' + (tgt.room ? (tgt.room.cx + ':' + tgt.room.cy) : (tgt.pt || []).join(','));
        if (A._goalKey !== gk) { A._goalKey = gk; A._goalSince = G.time; }
        else if (G.time - (A._goalSince || 0) > gene('goalGiveUp')) {
          benchFor(tgt.room || tgt.pt, 90);
          A._goalSince = G.time; A._goalKey = null;
          A.status.note = '放弃目标 ' + tgt.label + ' 90s';
          A.metrics.navStall = (A.metrics.navStall | 0) + 1;
          tgt = pickObjective(G, p);      // re-pick immediately, now without that one
        }
      }
      if (tgt) {
        const path = navPath(G, p, tgt.room ? tgt.room.id : null);
        let wp = tgt.pt;
        if (path && path.length > 1) { const { doorOf } = graph(); const key = path[0] + ':' + path[1]; wp = doorOf[key] || tgt.pt; }
        if (wp) {
          // Only path around real obstacles: when the straight line to the waypoint
          // is clear we keep the old "aim at it" behaviour (which dodges better in
          // open rooms), and use BFS nodes only when something blocks the line.
          const clear = (typeof los === 'function') ? los(p.x, p.y, wp[0], wp[1])
            : !collides(wp[0], wp[1], p.r, false);
          const leg = (!clear && Math.hypot(wp[0] - p.x, wp[1] - p.y) > 26) ? nextWaypoint(p, wp[0], wp[1]) : null;
          if (clear) travel.path = null;               // keep the BFS cache honest
          const aim = leg || wp;
          const dx = aim[0] - p.x, dy = aim[1] - p.y, dl = Math.hypot(dx, dy);
          // route-progress detector.  Distance-to-goal is NOT a progress signal
          // (walking around a wall increases it), so watch the BFS waypoint index:
          // if it stops advancing we really are circling.
          {
            const st = navProg;
            if (st.goal !== wp) { st.goal = wp; st.fails = 0; travel.path = null; st.t = G.time; }
            if (travel.adv !== st.advSeen) { st.advSeen = travel.adv; st.t = G.time; st.fails = 0; }
            else if (G.time - (st.t || 0) > 2.6) {
              st.t = G.time; st.fails = (st.fails || 0) + 1;
              travel.path = null;                      // force a fresh BFS
              A.metrics.navReplan = (A.metrics.navReplan | 0) + 1;
              if (st.fails >= 3) {
                // NOTE: a permanent blacklist was tried and made things WORSE
                // (seed 5 went to 1948s with 3 rooms cleared): it can lock out the
                // key room or the boss room, and the bot then has nowhere to go.
                // Keep the timed blacklist — a target is retried, which is
                // correct when the blocker was transient (a crowd of enemies).
                benchFor(tgt.room || tgt.pt, 25); st.fails = 0;
                A.status.note = '绕圈：换目标';
                A.metrics.navStall = (A.metrics.navStall | 0) + 1;
              }
              else A.status.note = '绕圈：重算路径';
            }
          }
          // 破甲后在门口等甲回满再进下一个战斗房（HARD+ 是生死差）
          // Armor only STARTS regenerating once lastHit > 3 (see AGENTS.md §5), so
          // waiting while lastHit is 1..3 stands still for nothing.  Configurable
          // so the two thresholds can be compared directly.
          const armorWait = A.opts.armorWaitT === undefined ? 1 : A.opts.armorWaitT;
          if (tgt.label === 'fight' && p.armor < p.maxArmor - 1 && p.lastHit > armorWait && dl < 90) {
            mx = 0; my = 0; A.status.note = '等甲恢复 ' + p.armor + '/' + p.maxArmor;
          } else if (dl > 12) { [mx, my] = pickDir(p, dx, dy); }
          // stuck on this objective? bench it for a while so the run keeps moving
          if (navProg.tgt === tgt.room && G.time - navProg.t > 6 && Math.hypot(p.x - navProg.x, p.y - navProg.y) < 40) { benchFor(tgt.room || tgt.pt, 30); navProg.t = G.time; }
          else if (navProg.tgt !== tgt.room) { navProg.tgt = tgt.room; navProg.x = p.x; navProg.y = p.y; navProg.t = G.time; }
          else if (Math.hypot(p.x - navProg.x, p.y - navProg.y) > 40) { navProg.x = p.x; navProg.y = p.y; navProg.t = G.time; }
          A.status.target = tgt.label;
          A._lastWp = wp;
        }
      }
    } else A.status.target = null;

    // stuck? first try REAL pathfinding to the last waypoint; wiggle is the last resort
    if (Math.abs(p.x - lastPos.x) + Math.abs(p.y - lastPos.y) < 2) {
      if (G.time - lastPos.t > 1.2) {
        lastPos.t = G.time;
        let handled = false;
        if (A._lastWp) {
          const path = gridPath(p, A._lastWp[0], A._lastWp[1]);
          if (path && path.length) {
            for (const node of path) { if (dist(p.x, p.y, node[0], node[1]) > 14) { const l = Math.hypot(node[0] - p.x, node[1] - p.y) || 1; mx = (node[0] - p.x) / l; my = (node[1] - p.y) / l; handled = true; break; } }
            A.status.note = '寻路绕行';
          }
        }
        if (!handled) {  // no path: wiggle in a committed direction, dash through (pit-safe)
          if (!wiggle.dir || wiggle.until < G.time) {
            const a = Math.random() * Math.PI * 2;
            wiggle.dir = [Math.cos(a), Math.sin(a)]; wiggle.until = G.time + 1.2;
            wiggle.n = (wiggle.n || 0) + 1;
            if (wiggle.n >= 3) { if (navProg.tgt) benchFor(navProg.tgt, 30); navCache = null; wiggle.n = 0; }
          }
          if (wiggle.dir && wiggle.until > G.time) [mx, my] = wiggle.dir;
          const l = Math.hypot(mx, my) || 1;
          if ((mx || my) && p.dashCd <= 0 && dashSafe(p, mx / l, my / l)) tap('Space');
        }
      }
    } else { lastPos = { x: p.x, y: p.y, t: G.time }; wiggle.n = 0; }

    // the hard nav fallback must win over whatever pickDir decided this tick
    if (A._forceActive) { mx = A._forceActive[0]; my = A._forceActive[1]; }
    moveKeys(mx, my);
    A._dbg = [mx, my];
    Input.down = !!wantFire && A.mode !== 'off' && !A.opts.noFire;
  }

  // choose the next room/point to walk to
  // ---- room priority -------------------------------------------------------
  // Reward rooms (chest/shop/arsenal/vault/camp/forge/…) come first; clearing the
  // floor for the exit comes next.  Among combat rooms: harmless rooms cost 1,
  // trapped rooms (blades/flames but no spawns) 2, unseen ones 3.  Only the ORDER
  // matters, not the absolute numbers.
  const REWARD_ROOMS = ['treasure', 'shop', 'arsenal', 'vault', 'camp', 'forge', 'dialysis', 'barracks', 'shrine', 'trial', 'idol'];
  const TRAPPED_ROOMS = ['blades', 'flames', 'spikes'];
  function roomWeight(r) {
    if (r.cleared) return 99;
    // "rush" mode: reward rooms are the main time sink before the boss gate, so
    // push them behind combat rooms when the goal is to reach the boss quickly.
    // Measured with firstBossT (seconds until the boss room is entered).
    if (A.opts.rushBoss && A.opts.rushBoss !== false && REWARD_ROOMS.includes(r.type)) {
      if (r.key) return 0;
      return 5;                                            // after combat, before boss
    }
    if (REWARD_ROOMS.includes(r.type)) return 0;          // reward first
    if (TRAPPED_ROOMS.includes(r.type)) return 2;         // hazards, no spawns
    if (r.type === 'combat') return r.visited ? 1 : 3;    // harmless already-seen vs unseen
    if (r.type === 'boss') return 4;                      // locked behind the seal anyway
    return 3;
  }
  // Does this floor still need work before we may leave?
  //  - any uncleared room that is not the exit portal
  //  - unless the reward pipeline is saturated (endless endgame) or the lab serum
  //    lets us skip ahead (handled by the caller through A.opts)
  function floorNeedsClear() {
    try {
      const rooms = (typeof WORLD !== 'undefined' && WORLD && WORLD.rooms) ? WORLD.rooms : [];
      return rooms.some((r) => !r.cleared && r.type !== 'start');
    } catch (e) { return false; }
  }
  // Lab serum drawback: G.exp.left counts the fights that must still be played
  // before the side effect wears off.  Carrying it into the next floor is banned,
  // so we deliberately pick extra fights while it is active.
  function labDebuffLeft() {
    try {
      const x = G.exp;
      return (x && x.left > 0) ? x.left | 0 : 0;
    } catch (e) { return 0; }
  }

  // Rooms are addressed by their geometric centre, but a centre can be a pillar
  // or sit behind a closed door.  When walking ACROSS the floor, approach the
  // nearest doorway instead — that is the only real entrance.
  function approachPoint(r, p) {
    if (!r) return null;
    if (r.active && r.doors && r.doors.length) {
      let best = null, bd = 1e9;
      for (const pair of r.doors) {
        const px = pair[0] * 16 + 8, py = pair[1] * 16 + 8;
        const dd = dist(p.x, p.y, px, py);
        if (dd < bd) { bd = dd; best = [px, py]; }
      }
      if (best) return best;
    }
    return [r.cx * 16 + 8, r.cy * 16 + 8];
  }

  function pickObjective(G, p) {
    // The floor may not exist yet (right after launch, or a failed generation).
    // Without this guard the bot chases interactables that have no room, and the
    // run sits still: measured 80+ game-seconds with rooms:0 and kills:0.
    if (typeof WORLD === 'undefined' || !WORLD || !Array.isArray(WORLD.rooms) || !WORLD.rooms.length) return null;
    const rooms = WORLD.rooms;
    // ---- 钥匙房间最高优先 ---------------------------------------------------
    // The boss room stays locked until the key is collected, and the key sits in
    // one of the FIRST HALF of candidate rooms and only spawns when that room is
    // cleared (world.js:61, game.js:208).  `r.key` is a public field, so we can
    // route straight at it instead of hoping to stumble on it — this shortens the
    // unlock chain deterministically (see docs/benchmark.md §89).
    if (A.opts.keyRoomFirst !== false && WORLD.bossLocked && !G.hasKey) {
      for (const r of rooms) {
        if (!r.key || r.cleared || unreachable(r)) continue;
        return { pt: [r.cx * 16 + 8, r.cy * 16 + 8], label: 'keyroom', room: r };
      }
    }
    // 1) loose pickups: prisms / keys (skip ones we failed to reach recently)
    if (A.opts.arsenal) for (const it of G.inter) if (it.kind === 'arsrack' && !it.used && !unreachable(it) && !unreachable(roomAt(it.x, it.y)))
      return { pt: [it.x, it.y], label: '军械库', room: roomAt(it.x, it.y) };
    if (A.opts.dialysis && (G.curses || []).length && ((p.maxArmor | 0) >= 1))
      for (const it of G.inter) if (it.kind === 'dialysis' && !it.used && !unreachable(it) && !unreachable(roomAt(it.x, it.y)))
        return { pt: [it.x, it.y], label: '透析机', room: roomAt(it.x, it.y) };
    if (A.opts.labSerum) for (const it of G.inter) if (it.kind === 'labvial' && !it.used && !unreachable(it) && !unreachable(roomAt(it.x, it.y)))
      return { pt: [it.x, it.y], label: '实验血清', room: roomAt(it.x, it.y) };

    // ---- power-ups before fights -------------------------------------------
    // Grabbing a weapon / chip / serum raises what the NEXT fight is worth, so
    // upgrades outrank entering an unseen combat room.  Position them ahead of
    // the room-weight sweep below (which is why this block sits here).
    if (A.opts.powerupFirst !== false) {
      const stops = [];
      for (const it of (G.inter || [])) {
        if (it.kind === 'weapon' && A.opts.weaponPick) {
          // only chase a floor gun when it can actually be taken: capacity free,
          // or the gun is stronger than what we hold
          const held = (p.weapons || []).map((id) => WEAPONS[id] ? (WEAPONS[id].dmg || 0) * (WEAPONS[id].rate || 1) * (WEAPONS[id].n || 1) : 0);
          const mine = (WEAPONS[it.id] ? (WEAPONS[it.id].dmg || 0) * (WEAPONS[it.id].rate || 1) * (WEAPONS[it.id].n || 1) : 0);
          const canTake = (p.weapons || []).length < wCap() || mine > Math.max(0, ...held) + 5;
          if (canTake) stops.push([it.x, it.y, 'weapon']);
        }
        else if (it.kind === 'chip' && A.opts.chipPick && !p.skill) stops.push([it.x, it.y, 'chip']);
        else if (it.kind === 'prism' && A.opts.pickups) stops.push([it.x, it.y, 'prism']);
        else if (it.kind === 'labvial' && A.opts.labSerum && !it.used) stops.push([it.x, it.y, 'labvial']);
      }
      let best = null, bd = 1e9;
      // Pathing can route around walls, so requiring a straight line hid most
      // floor guns: the bot walked past them and "never picked anything up".  Prefer
      // visible ones, but accept a reachable one at range too.
      let bestAny = null, bdAny = 1e9;
      for (const sp of stops) {
        if (unreachable([sp[0], sp[1]])) continue;
        const straight = los(p.x, p.y, sp[0], sp[1]);
        const d = dist(p.x, p.y, sp[0], sp[1]);
        if (straight && d < bd) { bd = d; best = sp; }
        if (d < bdAny) { bdAny = d; bestAny = sp; }
      }
      const reach = A.opts.powerupRange || 700;
      if (best && bd < reach) return { pt: [best[0], best[1]], label: best[2], room: roomAt(best[0], best[1]) };
      if (!best && bestAny && bdAny < reach) return { pt: [bestAny[0], bestAny[1]], label: bestAny[2], room: roomAt(bestAny[0], bestAny[1]) };
    }
    // 'clear-first' (A/B): during the first pass we push combat rooms before
    // walking back for loose drops; prisms are picked up once rooms are cleared.
    const deferLoose = A.opts.pickupOrder === 'clear-first';
    const combatLeft = rooms.some((r) => r.type === 'combat' && !r.cleared && !unreachable(r));
    if (A.opts.pickups && !(deferLoose && combatLeft))
      // A boss seal must be approached as an objective, not just tapped when we
      // happen to be near it: the boss room stays locked until the seal opens,
      // and the bot used to hover at the door forever (seed 19: 10/11 rooms
      // cleared, obj=boss, position oscillating in a 10x8 px box).
      // Portals are the only way to advance a floor (and the endless portal only
      // appears after the last floor).  Like the seal, they used to exist ONLY in
      // the interaction branch, so the bot never walked to one: it would clear a
      // floor, watch the portal spawn, and wander until it died.
      // ---- don't descend while hurt ------------------------------------------
      // A floor should be entered at full HP: arriving low means the next fight
      // starts at a disadvantage.  Healing sources are only enabled by default
      // when this rule needs them, so it overrides the `fount`/heart defaults.
      // Give the healing detour a hard deadline: if it has not helped within
      // `hpGateGiveUp` seconds, drop it for the rest of this attempt so a
      // reachable-but-unreachable fount can never pin the run (see the 700s stall).
      if (A._hpGateFor !== (G.floor | 0)) { A._hpGateFor = G.floor | 0; A._hpGateSince = G.time; }
      const hpGateStuck = (G.time - (A._hpGateSince || G.time)) > 45;
      // Boss rooms have no healing points inside, and one run entered one on 2/5
      // health.  Emergency heal before opening the seal: if the key is in hand and
      // the floor is otherwise clear (so the boss room is the only thing left),
      // take any remaining healing first, ignoring the usual stuck timer.
      if (A.opts.bossPrepHeal !== false && G.hasKey && WORLD.bossLocked && p.hp < p.maxHp) {
        const left = rooms.filter((r) => !r.cleared && r.type !== 'boss' && r.type !== 'start');
        if (left.length <= 1) {
          for (const it of (G.inter || [])) {
            if (it.used || unreachable([it.x, it.y]) || unreachable(roomAt(it.x, it.y))) continue;
            if (it.kind === 'fount' && ((G.ink | 0) >= (it.cost | 0)) && !hasCurse('drought') && p.hp + 2 >= p.maxHp)
              return { pt: [it.x, it.y], label: 'fount', room: roomAt(it.x, it.y) };
            if (it.kind === 'shop' && it.what === 'heart' && !it.sold && ((G.ink | 0) >= it.price))
              return { pt: [it.x, it.y], label: 'heart', room: roomAt(it.x, it.y) };
          }
        }
      }
      if (A.opts.fullHpGate !== false && !hpGateStuck && p.hp < p.maxHp && !(G.exp && G.exp.id === 'a' && (G.exp.left | 0) > 0)) {
        for (const it of (G.inter || [])) {
          if (it.used) continue;
          if (unreachable([it.x, it.y]) || unreachable(roomAt(it.x, it.y))) continue;
          // A fount heals exactly 2 hp and is single-use (game.js:378), so it only
          // pays off when that actually finishes the job; chasing it for 1 hp
          // pinned a run in place for 700+ seconds (measured seed 31).
          if (it.kind === 'fount' && ((G.ink | 0) >= (it.cost | 0)) && !hasCurse('drought')
              && p.hp + 2 >= p.maxHp)
            return { pt: [it.x, it.y], label: 'fount', room: roomAt(it.x, it.y) };
          if (it.kind === 'shop' && it.what === 'heart' && !it.sold && ((G.ink | 0) >= it.price)
              && p.hp + 1 >= p.maxHp)
            return { pt: [it.x, it.y], label: 'heart', room: roomAt(it.x, it.y) };
        }
      }
      if (A.opts.usePortals !== false) {
        // Only take a portal once this floor has nothing left worth clearing —
        // otherwise walking to it skips rooms, prisms and serums, and the run
        // arrives at the next floor weaker than it should be.
        const floorHasWork = rooms.some((r) => r.type === 'combat' && !r.cleared && !unreachable(r));
        if (floorHasWork) { /* fall through to the fight objectives */ }
        else for (const it of G.inter) {
          if (it.kind !== 'portal') continue;
          if (G.time - (it.born || 0) < .6) continue;
          if (it.endless) {
            if (!A.opts.preferEndless) continue;
          } else if (G.endless) continue;      // already endless: portals only chain
          if (!unreachable(it) && !unreachable(roomAt(it.x, it.y)))
            return { pt: [it.x, it.y], label: 'portal', room: roomAt(it.x, it.y) };
        }
      }
      if (A.opts.openSeals !== false) {
        for (const it of G.inter) {
          if (it.kind !== 'seal') continue;
          const locked = (typeof WORLD !== 'undefined' && WORLD && WORLD.bossLocked);
          if (!locked) continue;
          if (G.hasKey && !unreachable(it) && !unreachable(roomAt(it.x, it.y)))
            return { pt: [it.x, it.y], label: 'seal', room: roomAt(it.x, it.y) };
        }
      }
      for (const it of G.inter) if ((it.kind === 'prism' || it.kind === 'key') && !unreachable(it) && !unreachable(roomAt(it.x, it.y)))
        return { pt: [it.x, it.y], label: it.kind, room: roomAt(it.x, it.y) };
    // 1b) weapon/chip drops on the floor worth walking to
    let bw = null, bwd = 1e9;
    for (const it of G.inter) {
      if (it.kind === 'weapon' && !A.opts.weaponPick) continue;
      if (it.kind === 'chip' && !A.opts.chipPick) continue;
      if (it.kind !== 'weapon' && it.kind !== 'chip') continue;
      if (unreachable(it) || unreachable(roomAt(it.x, it.y))) continue;
      const want = it.kind === 'chip'
        ? (!p.skill || it.id !== 'teleport' || it.id === A.goal.skill())
        : (p.weapons.length < wCap() || it.id === A.goal.weapon() || wScore(it.id) > wScore(p.weapons[p.wi]) + .5);
      if (!want) continue;
      const d = dist(p.x, p.y, it.x, it.y); if (d < bwd) { bwd = d; bw = it; }
    }
    if (bw) return { pt: [bw.x, bw.y], label: bw.kind, room: roomAt(bw.x, bw.y) };
    // 1c) forge: 武器是唯一的伤害**基数**（入侵侧实测结论），锻造把墨水变成
    // 武器等级（+25%/级，乘在基数上），应当尽早做而不是排在所有战斗房之后。
    // 'any' 模式检查**所有已装备武器**（原来只看手持，绝境里手持常是初始钉枪，
    // 条件经常不满足 → 等于从未用过锻造）。
    // Weapon level is the only MULTIPLICATIVE damage term, and the end-of-run
    // stats showed wlv={} on every run while ink peaked at 200+: the bot simply
    // never visited a forge (obj=forge appeared 4 times vs 47 for fight).
    // Promote the forge ahead of combat rooms when it is actually affordable.
    if (A.opts.forgeFirst !== false) {
      for (const r of rooms) {
        if (r.type !== 'forge' || unreachable(r)) continue;
        const cur = p.weapons[p.wi];
        const lv = (p.wlv && p.wlv[cur]) || 0;
        if (lv >= 3) continue;
        if ((G.ink | 0) < 30 + lv * 25 + 15) continue;
        // aim at the forge INTERACTABLE, not the room centre: the bench sits at
        // a specific tile and the E prompt only appears within 24px of it, so
        // walking to (cx,cy) never opened it (which is why wlv stayed {}).
        const bench = (G.inter || []).find((i) => i.kind === 'forge' && !i.used
          && roomAt(i.x, i.y) === r);
        const tgt2 = bench ? [bench.x, bench.y] : [r.cx * 16 + 8, r.cy * 16 + 8];
        return { pt: tgt2, label: 'forge', room: r };
      }
    }
    {
      const forgeMode = A.opts.forgeMode || 'held';
      for (const r of rooms) {
        if (r.type !== 'forge' || unreachable(r)) continue;
        // A forge we keep committing to but never complete (e.g. the ink never
        // reaches the price, or the room is sealed) used to hold the bot forever:
        // measured seed 7 sat on obj=forge from t=240 to t=1200 with 10/11 rooms
        // already cleared.  Bench it after a while so the run keeps moving.
        A._forgeT = A._forgeT || {};
        const fid = r.cx + ':' + r.cy;
        if (A._forgeGoal !== fid) { A._forgeGoal = fid; A._forgeSince = G.time; }
        else if (G.time - (A._forgeSince || 0) > (A.opts.forgeGiveUp || 25)) {
          benchFor(r, 120); A._forgeSince = G.time; A.status.note = '放弃锻造 120s';
          continue;
        }
        // 'held'  = current weapon (default)
        // 'main'  = the weapon we actually shoot most (highest wScore), even if a
        //           weaker sidearm is the one currently drawn
        // 'any'   = every equipped weapon  (measured NEGATIVE: pass-floor 0/5)
        let ids;
        if (forgeMode === 'any') ids = (p.weapons || []);
        else if (forgeMode === 'main') {
          let best = p.weapons[p.wi], bs = -1e9;
          for (const id of p.weapons || []) { const sc = wScore(id); if (sc > bs) { bs = sc; best = id; } }
          ids = [best];
        } else ids = [p.weapons[p.wi]];
        for (const id of ids) {
          const lv = (p.wlv && p.wlv[id]) || 0;
          if (lv < 3 && G.ink >= 30 + lv * 25 + 10) return { pt: [r.cx * 16 + 8, r.cy * 16 + 8], label: 'forge', room: r };
        }
      }
    }
    // ---- 资源优先 vs 直接清房（A/B 开关 A.opts.exploreOrder）-----------------
    // 绝境里 输出/补给 往往比多打一个房间更值：先去商店/锻造/神龛/宝箱，
    // 再回头清战斗房。 默认保持原顺序（直接清房），可用 A/B 切换验证。
    if (A.opts.exploreOrder === 'resources') {
      if (A.opts.specialsFirst !== false)
        for (const r of rooms) if (!r.visited && SPECIAL_ROOM_TYPES.includes(r.type) && !unreachable(r))
          return { pt: [r.cx * 16 + 8, r.cy * 16 + 8], label: r.type, room: r };
      for (const r of rooms) if (!r.visited && ['forge', 'shrine'].includes(r.type) && !unreachable(r)) return { pt: [r.cx * 16 + 8, r.cy * 16 + 8], label: r.type, room: r };
    }
    // ---- reward rooms first, then finish the floor ---------------------------
    // Rule: reward rooms (chest/shop/arsenal/vault/camp/forge/…) take priority
    // over clearing, and the floor must be cleared before leaving unless the
    // serum pipeline is saturated.  A lab-serum drawback forbids carrying the
    // side effect downstairs, so while it is active we deliberately take unseen
    // fights to burn it off.
    {
      const debuff = labDebuffLeft();
      const portalReady = (G.inter || []).some((it) => it.kind === 'portal' && G.time - (it.born || 0) > .6);
      if (portalReady && !floorNeedsClear() ) { /* fall through to portal branch */ }
      else {
        // candidate rooms, weighted by roomWeight (lower = more urgent)
        let best = null, bw = 1e9, bd = 1e9;
        for (const r of rooms) {
          if (r.cleared || unreachable(r)) continue;
          if (r.type === 'start') continue;
          if (r.type === 'boss' && (WORLD.bossLocked && !G.hasKey)) continue;   // seal handler owns this
          const w = roomWeight(r) - (debuff > 0 && r.type === 'combat' && !r.visited ? .5 : 0);
          const d = dist(p.x, p.y, r.cx * 16 + 8, r.cy * 16 + 8);
          if (w < bw || (w === bw && d < bd)) { bw = w; bd = d; best = r; }
        }
        if (best && !portalReady) return { pt: [best.cx * 16 + 8, best.cy * 16 + 8], label: best.type, room: best };
        if (best && portalReady && bw <= 2) return { pt: [best.cx * 16 + 8, best.cy * 16 + 8], label: best.type, room: best };
      }
    }
    const boss = rooms.find((r) => r.type === 'boss');
    // 2) boss room once unlocked (or never locked).
    // 'late' mode: clear the combat rooms first (more prisms = more serums =
    // more damage) before committing to the boss.  Measured: runs that reached
    // 12 serums cleared 3 floors; runs with 2-3 serums died on floor 1 — and the
    // trace showed the bot heading for the boss with 16 pickups still on the floor.
    const bossLate = A.opts.bossOrder === 'late';
    const combatLeft0 = rooms.some((r) => r.type === 'combat' && !r.cleared && !unreachable(r));
    // An ACTIVE boss room is one we already walked into; leaving it un-cleared
    // orphans it forever, because the combat branch below skips active rooms and
    // this branch used to ignore them too.  Measured: cleared=12/13 for 900s
    // with openRooms showing "combat,boss*".
    // When the boss room is the LAST thing left on the floor, go finish it before
    // picking up any remaining prisms.  End-of-run statistics over 12 seeds showed
    // the single most common state was openRooms=boss with obj=prism (31 samples):
    // the bot kept collecting serums while the floor could never be completed.
    {
      // NOTE: do NOT require !boss.active — once we have stepped in, the room is
      // active and still unfinished, which is exactly when we must stay.
      const onlyBossLeft = boss && !boss.cleared
        && (!WORLD.bossLocked || G.hasKey) && !unreachable(boss)
        && !rooms.some((r) => r.type === 'combat' && !r.cleared && !unreachable(r));
      if (onlyBossLeft) return { pt: [boss.cx * 16 + 8, boss.cy * 16 + 8], label: 'boss', room: boss };
    }
    if (boss && !boss.cleared && (!WORLD.bossLocked || G.hasKey) && !unreachable(boss) && !(bossLate && combatLeft0))
      return { pt: [boss.cx * 16 + 8, boss.cy * 16 + 8], label: 'boss', room: boss };
    // An ACTIVE combat room we already entered but did not finish is an orphan:
    // the normal branch below skips `r.active`, so nothing ever returns to it and
    // the floor can never be completed ("cleared=12/13" while standing around).
    {
      let orphan = null, orphD = 1e9;
      for (const r of rooms) {
        if (r.cleared || !r.active || unreachable(r)) continue;
        if (r.type !== 'combat' && r.type !== 'boss') continue;
        const dd = dist(p.x, p.y, r.cx * 16 + 8, r.cy * 16 + 8);
        if (dd < orphD) { orphD = dd; orphan = r; }
      }
      if (orphan) {
        // An active room's doors are closed (setDoors(r,true) in lockRoom), so its
        // CENTRE is unreachable from outside and pathfinding reports noRoute.  Aim
        // at the nearest doorway instead, which is the only way in.
        let dp = null, dd0 = 1e9;
        for (const pair of (orphan.doors || [])) {
          const px2 = pair[0] * 16 + 8, py2 = pair[1] * 16 + 8;
          const d0 = dist(p.x, p.y, px2, py2);
          if (d0 < dd0) { dd0 = d0; dp = [px2, py2]; }
        }
        return { pt: dp || [orphan.cx * 16 + 8, orphan.cy * 16 + 8], label: orphan.type, room: orphan };
      }
    }
    // 3) nearest unvisited combat room
    let best = null, bd = 1e9;
    for (const r of rooms) {
      if (r.type === 'combat' && !r.cleared && !r.active && !unreachable(r)) { const d = dist(p.x, p.y, r.cx * 16 + 8, r.cy * 16 + 8); if (d < bd) { bd = d; best = r; } }
    }
    if (best) return { pt: [best.cx * 16 + 8, best.cy * 16 + 8], label: 'fight', room: best };
    // 4) specials worth a detour (policy: shop on)
    if (A.opts.shop) for (const r of rooms) if (!r.visited && ['treasure', 'shop', 'camp', 'dialysis', 'barracks'].includes(r.type) && !unreachable(r)) return { pt: [r.cx * 16 + 8, r.cy * 16 + 8], label: r.type, room: r };
    for (const r of rooms) if (!r.visited && ['forge', 'shrine'].includes(r.type) && !unreachable(r)) return { pt: [r.cx * 16 + 8, r.cy * 16 + 8], label: r.type, room: r };
    // 5) fallback: boss room or any unvisited room
    if (boss && !unreachable(boss)) return { pt: [boss.cx * 16 + 8, boss.cy * 16 + 8], label: 'boss?', room: boss };
    for (const r of rooms) if (!r.visited && !unreachable(r)) return { pt: [r.cx * 16 + 8, r.cy * 16 + 8], label: 'explore', room: r };
    // 6) last resort: everything is "visited" or blacklisted, but the floor is not
    // finished.  Returning null makes the bot stand still forever — measured 104
    // minutes of game time with only three rooms cleared.  Walk to the nearest
    // uncleared room ignoring the blacklist, which also clears stale entries.
    {
      let anyRoom = null, anyD = 1e9;
      for (const r of rooms) {
        if (r.cleared || r.type === 'start') continue;
        const dd = dist(p.x, p.y, r.cx * 16 + 8, r.cy * 16 + 8);
        if (dd < anyD) { anyD = dd; anyRoom = r; }
      }
      if (anyRoom) return { pt: [anyRoom.cx * 16 + 8, anyRoom.cy * 16 + 8], label: 'recover', room: anyRoom };
    }
    return null;
  }

  // things the autopilot failed to reach get benched for a while so it keeps moving
  const bench = new Map();
  function unreachable(t) { const until = bench.get(t); if (until && G_time() < until) return true; if (until) bench.delete(t); return false; }
  const G_time = () => (window.__achroma && __achroma.G ? __achroma.G.time : 0);
  const benchFor = (t, sec) => bench.set(t, G_time() + sec);

  function navPath(G, p, targetRoomId) {
    if (targetRoomId == null) return null;
    // rebuild the graph periodically: doors/locks change and stale paths cause wall-hugging
    if (navCache && G.time - navCache.at > 3) navCache = null;
    const cur = roomAt(p.x, p.y); if (!cur) return null;
    if (cur.id === targetRoomId) return [cur.id];
    return bfsPath(cur.id, targetRoomId);
  }

  TSW.log('auto module ready');
})();
