# 战斗、色彩与词条机制（源码实证）

> 代码基线：`GAME_V = 'mvkp5c7g'`（[platform.js:84](../js/platform.js#L84)）；脚本加载顺序见 [platform.js:82](../js/platform.js#L82)-[83](../js/platform.js#L83)，`shards2 → shards3 → shards4 → curses2` 依次覆盖前面的钩子，读本文时**后加载的同名函数才是生效版本**。

**结论先行**

1. **一条管线吃所有武器**：每次命中都走 `hitEnemy`，顺序固定为「死亡/无敌/护盾 → 伤害修正 → 暴击 → 冻结/破甲减伤 → 扣血 → 击退 → 元素 proc → 处决 → afterHit → 击杀」，见 [combat.js:115](../js/combat.js#L115)-[168](../js/combat.js#L168)。所以 `fork`/`burn` 这类词条对近战、光束、无人机全都成立。
2. **`hurtPlayer` 的顺序是「无敌/冲刺 → Dash! 护盾 → 护甲 → 血量 → Risk! 锁血 → 伙伴救人 → 拉撒路 → 死亡」**，见 [game.js:94](../js/game.js#L94)-[113](../js/game.js#L113)；护甲吸收那一步会**跳过**（Risk! 生效中或 `pierce` 为真），锁血只是把血钉在 1 并继续吃后续判定。
3. **色彩是"六档灰 + 一组被点亮的具名色"**：世界本体只用 `col(0..5)`（[engine.js:75](../js/engine.js#L75)、[81](../js/engine.js#L81)），每层用 `FLOOR_PAL` 给这 6 档灰换一次色偏（[engine.js:77](../js/engine.js#L77)-[79](../js/engine.js#L79)）；玩家一路"挣来"的颜色是 `computeTints()` 按拥有的血清拼出的调色板（[weapons.js:94](../js/weapons.js#L94)-[95](../js/weapons.js#L95)），由 `buildTint()` 以 10 Hz 轮播（[weapons.js:93](../js/weapons.js#L93)），落在子弹、光标、冲刺残影、角色眼高光、连击数等处。
4. **血清 64 支**（combat 40 + shards2 15 + shards3 5 + shards4 4）、**协同 40 条**（20 + 15 + 5）、**诅咒 16 条**（13 + 3）。稀有度权重 `60/28/12/4`（[combat.js:10](../js/combat.js#L10)），第 1 层起点只发 `BASIC_WEAPONS` 22 件（[game.js:26](../js/game.js#L26)、[75](../js/game.js#L75)）。
5. **诅咒重掷现在扣的是 1 点最大生命，不是 1 点当前血**（[curses2.js:23](../js/curses2.js#L23)、[25](../js/curses2.js#L25)），旧的"扣 1 血"判定（[shards2.js:207](../js/shards2.js#L207)）在加载顺序上被覆盖。
6. **墨水（ink/零件）是 50% 转化率的经济**：`INK_RATE=.5`（[game.js:90](../js/game.js#L90)），再乘难度系数与 `inkMul()`（[game.js:91](../js/game.js#L91)、[shards2.js:96](../js/shards2.js#L96)）；连击每层 +5%，到 20 层封顶（[combat.js:240](../js/combat.js#L240)）。

---

## 1. 伤害管线

**结论：`hitEnemy` 是唯一入口，先算倍率、再掷暴击、再元素，最后才落血与击杀；护盾与无敌帧在最前面拦截。**

### 1.1 判定顺序（`hitEnemy`）

0. **门口拦截**：`e.dead` / `deathFightLeft>0` / `spawnT>0` / `e.inv>0` 直接 `return false`（[combat.js:116](../js/combat.js#L116)）。
1. **敌方护盾**：仅远程、且来向与 `e.face` 夹角 <1.0 弧度才格挡；`shieldHp` 递减，破盾后 `e.shield=false`（[combat.js:118](../js/combat.js#L118)-[125](../js/combat.js#L125)）。
2. **倍率修正**：`focus` 对满血首击、`big` 对精英/Boss、`moment` 移动中、`guill` 对 30% 以下 Boss（[combat.js:127](../js/combat.js#L127)-[130](../js/combat.js#L130)）。
3. **`dmgMods` 钩子**（在暴击之前）：近距、烧灼、洁癖、远程距离、诅咒 wrath/surr、`scrap`/`grudge`（[combat.js:131](../js/combat.js#L131)、[shards2.js:100](../js/shards2.js#L100)、[shards4.js:30](../js/shards4.js#L30)）。
4. **暴击**：`Math.random() < S.crit + o.critBonus`；`markCrit` 强制暴击；`allin` 非暴击 ×0.5（[combat.js:132](../js/combat.js#L132)-[134](../js/combat.js#L134)）。
5. **减伤**：冻结目标 +25%；Boss 转阶段 `armorT` 期间 ×0.3；`buffT` ×0.5（[combat.js:136](../js/combat.js#L136)-[138](../js/combat.js#L138)）。
6. **落血**：`e.hp -= dmg`，`hurtT=.15`，非场地伤害才写 `G.hitMark`（[combat.js:140](../js/combat.js#L140)）。
7. **击退**：`knock × S.knock × (Boss?bossKnock:e.heavy)`，再过 `ccMul('knock')`（[combat.js:143](../js/combat.js#L143)-[144](../js/combat.js#L144)）。
8. **元素 proc**（受 `proc` 门控）：burn / venom / frost / shock / vortex（[combat.js:152](../js/combat.js#L152)-[159](../js/combat.js#L159)）。
9. **处决**：非 Boss 且低于 `8+4l+协同10%` 上限直接归零（[combat.js:161](../js/combat.js#L161)）。
10. **收尾**：`afterHit`（标记/碎片）→ `killEnemy`（[combat.js:165](../js/combat.js#L165)-[166](../js/combat.js#L166)）。

Boss 击退固定 0.4，`monolith`（石化巨体）为 0（[combat.js:102](../js/combat.js#L102)）。

### 1.2 元素（burn / venom / chill→frozen / shock / vortex）

**结论：四种元素全是"命中时按概率叠层"，DoT 在敌人 update 里结算；冻结不是独立状态，是 3 层 chill（Boss 6 层）触发的一次性 `e.frozen` 计时。**

| 元素 | 触发 | 上限/时长 | 结算 | 行号 |
|---|---|---|---|---|
| burn | `S.burn` 且 `rand<proc` | 层数上限 `3+S.burn*2`，`burnT=3`；lv≥2 时燃烧击杀向 46px 内扩散 | 每 0.33s：`(1+burn)*(1+S.burn*.35)*.7*(boss?1.5:1)*caustic*dotMul` | [combat.js:152](../js/combat.js#L152)、[193](../js/combat.js#L193)、[246](../js/combat.js#L246) |
| venom | `S.venom` 且 `rand<proc*0.8` | 5 层，`venomT=4` | 每 0.5s：`venom*(1.5+.8*S.venom)*.5*(1+statFloor*.3)*caustic` | [combat.js:153](../js/combat.js#L153)、[198](../js/combat.js#L198) |
| chill | `S.frost` 且 `rand<proc*0.9` | `chill++`、`slowT=2`；3 层（Boss 6）冻结 | 减速 `1-.45*ccMul('slow')` | [combat.js:154](../js/combat.js#L154)-[157](../js/combat.js#L157) |
| frozen | `applyFreeze` | 时长 `base*ccMul('freeze')`，Boss 基础 0.5s、普通 `0.6+S.frost*.3` | 敌人整帧跳过 AI；被击 +25% | [combat.js:107](../js/combat.js#L107)-[112](../js/combat.js#L112)、[enemies.js:98](../js/enemies.js#L98)、[combat.js:136](../js/combat.js#L136) |
| shock | `S.shock`，概率 `.22+S.shock*.08` | 链数 `1+S.shock`，搜索半径 85，链上每次 ×0.75 | `chainLightning`（`fromShock` 防递归），proc 降为 0.35 | [combat.js:158](../js/combat.js#L158)、[169](../js/combat.js#L169)-[183](../js/combat.js#L183) |
| vortex | `S.vortex`，概率 `.05*l` | 场上最多 4 个 | 每 0.25s 2.5×`S.dmg` 并拉扯 | [combat.js:159](../js/combat.js#L159)、[283](../js/combat.js#L283)-[291](../js/combat.js#L291) |
`applyFreeze` 有两个硬豁免：`deathFightLeft>0`（死斗修饰符）与 `hasRunModifier('rot')`（腐烂：燃烧/中毒/冰冻全免疫）直接返回 false（[combat.js:108](../js/combat.js#L108)、[modifiers.js:7](../js/modifiers.js#L7)、[30](../js/modifiers.js#L30)）。

**睡眠/眩晕**是元素之外的另一套控制：麻醉镖给 `e.sleepT`，受 `ccMul('root')` 衰减，最短判定 2.5×k 秒（[weapons3.js:242](../js/weapons3.js#L242)）；睡着的敌人跳过 AI（[enemies.js:99](../js/enemies.js#L99)），且下一次命中 ×2.5 并惊醒（[weapons3.js:378](../js/weapons3.js#L378)）。`e.stunT` 有读取处（[enemies.js:99](../js/enemies.js#L99)）但本次范围内未找到写入点 → **未证实**。

### 1.3 控制抗性（同一敌人反复控制会递减，Boss 适应最快）

**结论：控制抗性是一个 `e.cc` 计数器 + 衰减器，不是抗性表。**

`ccMul(e,k)`：`warded` 词缀直接 ×0.12，否则 `1/(1+累计值)`——累计越高本次控制越短（[combat.js:103](../js/combat.js#L103)）；`ccAdd` 每次累加上限 6，且 Boss ×2.2 / 精英 ×1.4（[combat.js:104](../js/combat.js#L104)）；`ccDecay` 每秒衰减 Boss 0.35、其他 0.5（[combat.js:105](../js/combat.js#L105)）；控制短于 0.08s 时飘 "resist"（[combat.js:106](../js/combat.js#L106)、[110](../js/combat.js#L110)）。键位共五个、互不相干：`freeze`（[combat.js:109](../js/combat.js#L109)）、`slow`（[combat.js:155](../js/combat.js#L155)）、`knock`（[combat.js:144](../js/combat.js#L144)）、`pull`（[combat.js:288](../js/combat.js#L288)）、`root`（[weapons2.js:43](../js/weapons2.js#L43)）。

`warded` 同时把 DoT 收到 0.6 倍（[combat.js:191](../js/combat.js#L191)）；精英从 1 层起随机带词缀（[enemies.js:54](../js/enemies.js#L54)、[41](../js/enemies.js#L41)）。

## 2. `hurtPlayer` 与「锁血 ≠ 无敌」

**结论：这是两套完全不同的机制。锁血=把 `p.hp` 钳到 1 但伤害流程继续走（照常吃无敌帧、击退、清连击）；无敌=`p.inv>0` 让函数在门口直接 `return false`。**

### 2.1 玩家受伤判定顺序

| # | 步骤 | 规则 | 行号 |
|---|---|---|---|
| 0 | 总短路 | `TST.god` / `!p.alive` / `p.inv>0` / `p.dashT>0 && !mechHit` / 非 `play` → `return false` | [game.js:94](../js/game.js#L94)-[95](../js/game.js#L95) |
| 1 | 记账+击退 | `lastHit=0`、`armorRegen=0`、反方向推 160 | [game.js:96](../js/game.js#L96)-[97](../js/game.js#L97) |
| 2 | Dash! 临时盾 | `skillShieldHit()` 吃下（`tempShield--`、`inv=.45`） | [game.js:98](../js/game.js#L98)、[skills.js:84](../js/skills.js#L84)-[89](../js/skills.js#L89) |
| 3 | 护甲吸收 | **除非** Risk! 或 `pierce`；`armor--`，归零触发 `onArmorBroken`，`inv=.6` | [game.js:100](../js/game.js#L100) |
| 4 | 扣血 | `hp-=dmg`、`inv=1.1`、`combo=0` | [game.js:101](../js/game.js#L101)-[102](../js/game.js#L102) |
| 5 | Risk! 锁血 | `hp<=0 && skillOn('risk')` → `hp=1` | [game.js:103](../js/game.js#L103) |
| 6 | 伙伴救人 | `ptnSaveLethalHit()`（米可 tier≥2，一局一次） | [game.js:106](../js/game.js#L106)、[partners.js:226](../js/partners.js#L226)-[229](../js/partners.js#L229) |
| 7 | 拉撒路 | 一局一次满血复活（`drought` 只回 1）、`inv=2.5`、清空敌弹并反打 90 | [game.js:107](../js/game.js#L107)-[109](../js/game.js#L109) |
| 8 | 死亡 | `clearSave`、`state='dead'`、结算 | [game.js:110](../js/game.js#L110) |

外层还有两层包装：**临时护甲先吸一击**（[shards4.js:44](../js/shards4.js#L44)-[49](../js/shards4.js#L49)）；**Overclock! 期间受双倍伤害且护甲多吃 1 点**（[achieve.js:247](../js/achieve.js#L247)-[248](../js/achieve.js#L248)）。月循 tier3 同伴在场时每次真掉血额外 +1s 无敌（[partners.js:230](../js/partners.js#L230)-[233](../js/partners.js#L233)）。

### 2.2 锁血 vs 无敌 对照

| 机制 | 实现 | 是否"无敌" | 行号 |
|---|---|---|---|
| Risk! | 致命时 `hp=1`；期间护甲失效、视野收缩；结束回 1 甲 1 血 | ❌ 仍吃击退、清连击，下一击照常结算（再被钳回 1） | [game.js:103](../js/game.js#L103)、[skills.js:9](../js/skills.js#L9)、[40](../js/skills.js#L40) |
| 拉撒路 | `hp=maxHp` 且 `inv=2.5` | ✅ 2.5s | [game.js:107](../js/game.js#L107) |
| 米可救人 | `hp=1`、`inv=max(inv,2)` | ✅ 2s | [partners.js:228](../js/partners.js#L228) |
| 痛觉阻断 veil | 被动换弹把 `p.inv` 抬到 `d`（`d<=cap`），覆盖率≤70% | ✅ 分数秒 | [shards2.js:139](../js/shards2.js#L139)-[145](../js/shards2.js#L145) |
| 临终喘鸣 | 破甲冲击波附带 `inv=1.5` | ✅ | [shards2.js:157](../js/shards2.js#L157) |
| 普通受击 | `inv=1.1`；护甲吸收则 `.6` | ✅ 短暂 | [game.js:101](../js/game.js#L101)、[100](../js/game.js#L100) |
| 冲刺 | `p.dashT>0` 且非机制伤害时门口 return | ✅ 等价无敌帧 | [game.js:95](../js/game.js#L95) |

## 3. 色彩机制：「灰色世界，颜色是挣来的」

**结论：世界只画 6 档灰（`col(0..5)`），每层换一次灰的色温；玩家能"看见颜色"的唯一来源是血清/词条把具名色 `C.*` 注入 `G.tints`，再由 `buildTint()` 以 10Hz 轮流取色；营地是唯一的例外——它用一个 18 色白名单 `CACC` 决定哪些像素不被去色。**

### 3.1 三层调色板

- `PAL`：6 个十六进制灰，是世界的**唯一**基础色阶，`col(i)=PAL[i]`（[engine.js:75](../js/engine.js#L75)、[81](../js/engine.js#L81)）。
- `FLOOR_PAL`：5 组、每组 6 档，每层把同一档灰换成带色偏的灰（灰烬 / 冷钢 / 病绿 / 雾白 / 干血）；`setFloorPal` 还会把 `vignette` 置空重建（[engine.js:77](../js/engine.js#L77)-[79](../js/engine.js#L79)）。
- 具名色 `C`：red/cyan/gold/violet/frost/green/orange/pink/lime/indigo 十个，只给"被挣来的"东西用（[engine.js:82](../js/engine.js#L82)）。

进层时 `setFloorPal(fi)` + `PALV++` + 清空 `spriteCache`（[game.js:42](../js/game.js#L42)），因为精灵缓存键里带 `PALV`（[engine.js:153](../js/engine.js#L153)）——否则旧层的灰会残留在缓存位图里。精灵字模中 `'0'~'5'` 映射 `col(数字)`，其他字母映射具名色，`t` 映射传入 tint（[engine.js:149](../js/engine.js#L149)-[151](../js/engine.js#L151)、[158](../js/engine.js#L158)）——**角色/敌人本体天然是灰的，只有词条的地图字符带色。**

### 3.2 `buildTint()` 与 `computeTints()`

- `computeTints()` 只做一件事：把**拥有的血清**翻译成一串具名色，塞进 `G.tints`（[weapons.js:94](../js/weapons.js#L94)-[95](../js/weapons.js#L95)）。数组顺序就是轮播顺序。
- `buildTint()` 取 `G.tints[(G.time*10)|0 % length]`；**数组为空时回落到 `col(5)`**（[weapons.js:93](../js/weapons.js#L93)）——这就是"没打血清之前，连高光都是灰白"的落点。
- 调用点：开局（[game.js:36](../js/game.js#L36)）、每次取血清（[ui.js:287](../js/ui.js#L287)）、透析洗血清（[rooms.js:139](../js/rooms.js#L139)）。

**哪些血清点亮哪些颜色（这就是"颜色是挣来的"的清单）**

| 血清 | 点亮的颜色 | 行号 |
|---|---|---|
| ember（或 prism） | `C.red` | [weapons.js:94](../js/weapons.js#L94) |
| arc / prism / **stat** | `C.cyan` | [weapons.js:94](../js/weapons.js#L94) |
| rime（或 prism） | `C.frost` | [weapons.js:94](../js/weapons.js#L94) |
| venom（或 prism） | `C.lime` | [weapons.js:94](../js/weapons.js#L94) |
| keen | `C.gold` | [weapons.js:95](../js/weapons.js#L95) |
| echo / after | `C.violet` | [weapons.js:95](../js/weapons.js#L95) |
| vortex | `C.indigo` | [weapons.js:95](../js/weapons.js#L95) |
| bloom / fury | `C.orange` | [weapons.js:95](../js/weapons.js#L95) |
| leech | `C.green` | [weapons.js:95](../js/weapons.js#L95) |
注意两个"加速"点：`prism`（鸡尾酒疗法）一次性把四元素各 +1（[combat.js:55](../js/combat.js#L55)），因此单卡直接把 red/cyan/frost/lime 四色全点亮；`stat`（生物电腺体）即使没有 arc 也会点亮 cyan。

### 3.3 颜色的实际落点

`buildTint()` 的返回值被塞进这些可见位置：子弹默认色（`mkBullet` 的 `tint`，[weapons.js:98](../js/weapons.js#L98)、绘制 [525](../js/weapons.js#L525)）；枪口/射击火花（[weapons.js:175](../js/weapons.js#L175)）；冲刺残影 `c`（[game.js:135](../js/game.js#L135)）；角色**眼睛高光那一格像素**（[game.js:555](../js/game.js#L555)）；准星中心（[ui.js:220](../js/ui.js#L220)、[225](../js/ui.js#L225)）；连击数字在 ≥25 层时从金色改成你的调色板（[ui.js:76](../js/ui.js#L76)）；触屏摇杆刻线与建造键角标（[touch.js:108](../js/touch.js#L108)、[155](../js/touch.js#L155)）；面板开启扫线（[panels.js:68](../js/panels.js#L68)）；地面传送门提示色（[game.js:412](../js/game.js#L412)）。

另外 `wAccent(w)` 是"每把枪自带的强调色"（`C[w.acK]`，表在 `AMMO`），它独立于血清调色板（[weapons.js:90](../js/weapons.js#L90)、[81](../js/weapons.js#L81)-[86](../js/weapons.js#L86)）。所以枪的换弹光是"武器自带色 + 你的调色板"混合。

### 3.4 `CACC`：营地"世界没有颜色"的例外白名单

**结论：营地是逐像素后处理灰化——画的时候给每个像素记一位"是否 CACC"，出图时把非 CACC 的像素按亮度公式转灰。** 这是与游戏本体（靠 `col()` 天然灰）完全不同的第二套实现。

流程：规则写在文件头注释里（世界无颜色，除 CACC 之外全部转灰；"有颜色的是活着的东西：火与光、灯、女孩"）（[camp.js:9](../js/camp.js#L9)-[10](../js/camp.js#L10)）；白名单是 18 个色值（暖橙/赭石/火红/锈红/灯蓝/草绿等）（[camp.js:38](../js/camp.js#L38)）；灰化公式 `亮度=(r*.3+g*.59+b*.11)*1.12` 再偏冷 `[l*.98,l*.98,l*1.03]`（[camp.js:39](../js/camp.js#L39)）；`set()` 时写 `this.m[i>>2]=CACC.has(c)?1:0`（[camp.js:43](../js/camp.js#L43)）；`canvas(keep)` 在 `keep` 为假时遍历所有 `m=0` 且不透明的像素替换成灰，`keep=true` 保留彩色（[camp.js:59](../js/camp.js#L59)）。`canvas(true)` 只被 arsenal/look/market/sieve 的图标生成调用——**图标是彩色的，场景是灰的**。

### 3.5 chroma 后处理：色差 = "污染"的视觉语法

**结论：chroma 不是调色，是把已画好的整帧做两次"通道 multiply + screen 叠加"，用像素位移制造红/暖灰双影，模拟色差与"坏掉"的画面。**

`chroma(a,force)` 只写 `FX.chroma`（取最大值，上限 .6 / force 1.5）（[engine.js:245](../js/engine.js#L245)），每秒 -6（[engine.js:254](../js/engine.js#L254)）；两张同尺寸缓冲 canvas 在 [game.js:629](../js/game.js#L629)；合成时两份整帧分别 multiply `#a8241c`（红）与 `#4a4038`（暖灰），再以 `screen` 位移叠加，`o=ceil(chroma*2.5)`、alpha 上限 .6（[game.js:647](../js/game.js#L647)-[649](../js/game.js#L649)），`QS.fx` 关闭则整段跳过（[game.js:647](../js/game.js#L647)、[engine.js:6](../js/engine.js#L6)）。

主要触发：带元素/暴击的击杀（[combat.js:239](../js/combat.js#L239)，仅 `kc` 非空时）、玩家受击 1.2（[game.js:101](../js/game.js#L101)）、选诅咒 1.5（[shards2.js:222](../js/shards2.js#L222)）、选血清 0.6（[ui.js:288](../js/ui.js#L288)）、Limit!/传送（[skills.js:30](../js/skills.js#L30)、[71](../js/skills.js#L71)）、Boss 转阶段与融合（[boss.js:731](../js/boss.js#L731)、[774](../js/boss.js#L774)）。**"颜色出现"和"画面故障"被绑在同一个信号上。**

### 3.6 设计 → 代码 对照（一句话版）

- "世界没颜色" = 场景只允许 `col(0..5)`，字模数字位映射灰阶（[engine.js:75](../js/engine.js#L75)、[149](../js/engine.js#L149)）。
- "每层灰都不同" = `FLOOR_PAL` 覆写 `PAL` + `PALV` 重建精灵缓存（[engine.js:77](../js/engine.js#L77)-[79](../js/engine.js#L79)、[153](../js/engine.js#L153)）。
- "颜色是挣来的" = `computeTints` 只看 `p.shards`，空数组回落灰；血清色同时用于卡面与 tint 轮播（[weapons.js:93](../js/weapons.js#L93)-[95](../js/weapons.js#L95)、[combat.js:97](../js/combat.js#L97)、[ui.js:288](../js/ui.js#L288)）。
- "营地只有活物有颜色" = `CACC` 白名单 + 亮度灰化（[camp.js:38](../js/camp.js#L38)-[43](../js/camp.js#L43)、[59](../js/camp.js#L59)）。
- "污染有视觉代价" = chroma 双通道色差（[engine.js:245](../js/engine.js#L245)、[game.js:647](../js/game.js#L647)-[649](../js/game.js#L649)）。

## 4. SHARD（血清）全表

**结论：64 支血清，等级即层数（`max` 就是上限），稀有度 0~3 分别对应 60/28/12/4 的权重，第 1 层起点只发 22 件基础武器决定"第一针"的节奏。**

### 4.1 稀有度与抽取倍率

权重 `60/28/12/4` 对应 rar0~3，颜色分别是白、cyan、violet、gold（`RAR`，[combat.js:10](../js/combat.js#L10)）。抽取再叠三个倍率：`statFloor>=1` 时 rar≥2 ×1.5；已持有该血清 ×1.4；接近协同 ×1.6（[ui.js:236](../js/ui.js#L236)、`synergyHint` [ui.js:254](../js/ui.js#L254)-[255](../js/ui.js#L255)）。稀有度 3 的卡全部 `max:1`，即"一局只可能拿一次"。

### 4.2 全表（id / 名称 / rar·max / tag / 每层效果 / 行号）

| id | 名称 | rar·max | tag | 效果（每层） | 行号 |
|---|---|---|---|---|---|
| ember | 致热原 | 1·3 | ELEMENT | 命中点燃，层上限 3+2L；L≥2 燃烧击杀扩散 | [combat.js:17](../js/combat.js#L17) |
| arc | 神经导电剂 | 1·3 | ELEMENT | 命中概率链电到 1+L 个敌人 | [combat.js:18](../js/combat.js#L18) |
| rime | 低温凝剂 | 0·3 | ELEMENT | 命中寒冷减速，3 层冻结 0.6+0.3L 秒 | [combat.js:19](../js/combat.js#L19) |
| venom | 坏死毒素 | 1·3 | ELEMENT | 中毒，每层 1.5+0.8L/秒，最多 5 层 | [combat.js:20](../js/combat.js#L20) |
| keen | 视觉增强剂 | 0·4 | CRIT | 暴击率 +12L%，暴伤 ×1.6/1.9/2.2/2.5 | [combat.js:21](../js/combat.js#L21) |
| fork | 有丝分裂剂 | 2·3 | FORM | 每次攻击 +L 份复制，伤害 40/55/70% | [combat.js:22](../js/combat.js#L22)、[15](../js/combat.js#L15) |
| echo | 镜像神经元 | 2·2 | FORM | 每 5/3 次攻击回响一次（×0.6） | [combat.js:23](../js/combat.js#L23)、[weapons.js:122](../js/weapons.js#L122) |
| rico | 动能回弹剂 | 0·3 | FORM | 子弹/光束反弹 +L；近战每 6-L 次放月牙 | [combat.js:24](../js/combat.js#L24) |
| needle | 骨质穿透剂 | 0·3 | FORM | 穿透 +L，伤害 +10L% | [combat.js:25](../js/combat.js#L25) |
| heavy | 增肌剂 | 0·5 | POWER | 伤害 +20L%、体积 +15L%、击退增强 | [combat.js:26](../js/combat.js#L26) |
| frenzy | 肾上腺激增 | 0·5 | POWER | 攻速 +14L% | [combat.js:27](../js/combat.js#L27) |
| overk | 兴奋剂 X | 2·2 | POWER | 攻速 +24L%、伤害 +10L% | [combat.js:28](../js/combat.js#L28) |
| moment | 运动激活剂 | 0·3 | POWER | 移动中伤害 +10L%（协同翻倍） | [combat.js:29](../js/combat.js#L29) |
| fury | 狂怒激素 | 1·3 | KILL | 击杀后 3s 攻速 +1+2L%，10 层（协同 20） | [combat.js:30](../js/combat.js#L30)、[230](../js/combat.js#L230) |
| bloom | 坏死爆裂菌 | 1·3 | KILL | 击杀引爆 26/38/49% 最大生命 +3 | [combat.js:31](../js/combat.js#L31) |
| shrap | 骨刺增生 | 1·3 | KILL | 击杀迸发 2+2L 追踪碎片 | [combat.js:32](../js/combat.js#L32) |
| leech | 噬血酶 | 1·2 | KILL | 击杀 6L% 掉心 | [combat.js:33](../js/combat.js#L33) |
| guill | 安乐死剂 | 2·3 | HUNT | 处决 8+4L% 以下；Boss<30% 时 +15L% | [combat.js:34](../js/combat.js#L34) |
| big | 猎杀本能 | 0·3 | HUNT | 精英/Boss 伤害 +20L% | [combat.js:35](../js/combat.js#L35) |
| focus | 管状视野 | 0·2 | HUNT | 满血敌人首击 ×1.5+0.5L | [combat.js:36](../js/combat.js#L36) |
| seeker | 追踪费洛蒙 | 0·3 | FORM | 子弹转向，光束/刀刃自动瞄准 | [combat.js:37](../js/combat.js#L37) |
| vortex | 涡旋孢子 | 1·3 | ELEMENT | 命中 5L% 生成涡流（最多 4 个） | [combat.js:38](../js/combat.js#L38) |
| stat | 生物电腺体 | 1·3 | ALLY | 每 2.4-0.4L 秒电击 1+L 个敌人 | [combat.js:39](../js/combat.js#L39) |
| drone | 无人机链接 | 1·3 | ALLY | L 架无人机开火，附带命中效果 | [combat.js:40](../js/combat.js#L40) |
| sat | 卫星囊肿 | 1·4 | ALLY | L 个方块环绕、撞敌并吃子弹 | [combat.js:41](../js/combat.js#L41) |
| after | 神经残像 | 1·3 | DASH | 冲刺新星，冲刺冷却 -10L% | [combat.js:42](../js/combat.js#L42) |
| swift | 快肌纤维 | 0·3 | MOVE | 移速 +12L%，冲刺冷却 -12L% | [combat.js:43](../js/combat.js#L43) |
| spite | 痛觉反击 | 0·3 | SURVIVE | 受伤释放 4+4L 碎片 | [combat.js:44](../js/combat.js#L44) |
| vital | 血红蛋白 | 0·3 | SURVIVE | 最大生命 +2L，立即回 2 | [combat.js:45](../js/combat.js#L45) |
| plate | 角质化甲 | 0·3 | SURVIVE | 护甲 +L，回复速度 +25L% | [combat.js:46](../js/combat.js#L46) |
| quick | 反射加速剂 | 0·3 | AMMO | 装填时间 ×0.78^L | [combat.js:47](../js/combat.js#L47) |
| extmag | 囤积本能 | 0·3 | AMMO | 弹匣 +35L% | [combat.js:48](../js/combat.js#L48) |
| lastround | 绝望反应 | 1·3 | AMMO | 弹匣最后一发 ×1.8+0.5L | [combat.js:49](../js/combat.js#L49)、[weapons.js:604](../js/weapons.js#L604) |
| primed | 神经预激 | 1·3 | AMMO | 换弹后 2+2L 次攻击 +40% | [combat.js:50](../js/combat.js#L50)、[weapons.js:607](../js/weapons.js#L607) |
| rnova | 孢子释放 | 1·3 | AMMO | 换弹完成释放冲击波 | [combat.js:51](../js/combat.js#L51)、[weapons.js:590](../js/weapons.js#L590) |
| tactical | 翻滚反射 | 0·3 | AMMO | 冲刺回复 20L% 弹匣 | [combat.js:52](../js/combat.js#L52) |
| bottomless | 拾荒本能 | 3·1 | AMMO | 30% 攻击不耗弹 | [combat.js:53](../js/combat.js#L53) |
| glass | 心肌超载 | 3·1 | CURSE | 伤害 +60%，最大生命 -2 | [combat.js:54](../js/combat.js#L54) |
| prism | 鸡尾酒疗法 | 3·1 | ELEMENT | 四元素各 +1（同时点亮四色） | [combat.js:55](../js/combat.js#L55) |
| phoenix | 拉撒路剂 | 3·1 | SURVIVE | 每局一次满血复活 | [combat.js:56](../js/combat.js#L56) |
| frac | 卵裂素 | 1·3 | FORM | 命中分裂 L+1 枚碎片，各 30/50/65% | [shards2.js:39](../js/shards2.js#L39)、[37](../js/shards2.js#L37) |
| close | 近身本能 | 0·3 | POWER | 距离越近伤害越高，最多 +20/30/40% | [shards2.js:41](../js/shards2.js#L41) |
| lead | 重金属沉积 | 1·3 | FORM | 弹丸飞行中变慢变大，伤害 +15L% | [shards2.js:43](../js/shards2.js#L43) |
| mark | 气味标记 | 1·3 | CRIT | 命中标记，对标记敌人的下一击必暴击 | [shards2.js:46](../js/shards2.js#L46)、[110](../js/shards2.js#L110) |
| sear | 烧灼素 | 1·3 | HUNT | 1s 内连击同敌每层 +2+2L%，10 层 | [shards2.js:48](../js/shards2.js#L48)、[103](../js/shards2.js#L103) |
| soul | 骨髓摄食 | 1·1 | KILL | 击杀精英/冠军必回 1 血 | [shards2.js:50](../js/shards2.js#L50) |
| ovclk | 神经超频 | 1·2 | KILL | 击杀减技能冷却 750L 毫秒 | [shards2.js:52](../js/shards2.js#L52)、[122](../js/shards2.js#L122) |
| veil | 痛觉阻断 | 0·2 | AMMO | 自动换弹给 400+300L 毫秒无敌，覆盖≤70% | [shards2.js:54](../js/shards2.js#L54)、[139](../js/shards2.js#L139) |
| refit | 结痂素 | 1·2 | AMMO | 换弹完成回 1 甲，每 5-L 秒一次 | [shards2.js:56](../js/shards2.js#L56)、[152](../js/shards2.js#L152) |
| lone | 执念 | 2·1 | POWER | 伤害 +40%，只能带 1 把武器（`wCap`） | [shards2.js:58](../js/shards2.js#L58)、[93](../js/shards2.js#L93) |
| greed | 囤积癖 | 1·1 | LOOT | 零件 +30%，商店价格 +50% | [shards2.js:61](../js/shards2.js#L61)、[95](../js/shards2.js#L95) |
| allin | 赌徒症候群 | 2·1 | CRIT | 暴伤 +150%，非暴击 -50% | [shards2.js:63](../js/shards2.js#L63) |
| pristine | 洁癖 | 1·2 | SURVIVE | 满甲 +35/50%，缺甲 -25/35% | [shards2.js:65](../js/shards2.js#L65)、[104](../js/shards2.js#L104) |
| breakw | 休克反应 | 1·2 | SURVIVE | 破甲冲击波，半径 70+40L | [shards2.js:67](../js/shards2.js#L67)、[153](../js/shards2.js#L153) |
| trail | 磷汗 | 0·3 | DASH | 冲刺留火痕 1.2+0.4L 秒 | [shards2.js:69](../js/shards2.js#L69)、[160](../js/shards2.js#L160) |
| farshot | 鹰视网膜 | 0·3 | POWER | 远程武器越远伤害越高，最多 +15/25/35% | [shards3.js:11](../js/shards3.js#L11)、[42](../js/shards3.js#L42) |
| expose | 鲁米诺 | 1·3 | HUNT | 远程命中暴露 2s，全伤害 +6/10/14% | [shards3.js:13](../js/shards3.js#L13)、[37](../js/shards3.js#L37) |
| volley | 双手同利 | 2·1 | FORM | 副手以 30% 攻速 / 40% 伤害同击 | [shards3.js:15](../js/shards3.js#L15)、[51](../js/shards3.js#L51) |
| hotb | 高烧 | 1·3 | AMMO | 每发 +2% 攻速，上限 9/15/21%，换弹散热 | [shards3.js:17](../js/shards3.js#L17)、[64](../js/shards3.js#L64) |
| weave | 反射弧 | 1·2 | SURVIVE | 我方弹丸 10/20% 抵消敌弹 | [shards3.js:19](../js/shards3.js#L19)、[69](../js/shards3.js#L69) |
| scrap | 拾荒本能 | 1·2 | POWER | 每 200 零件 +2/3% 伤害，上限 30/45% | [shards4.js:10](../js/shards4.js#L10)、[31](../js/shards4.js#L31) |
| hyper | 代偿增生 | 1·2 | SURVIVE | 溢出治疗变临时护甲，最多 2 点，30/60s | [shards4.js:13](../js/shards4.js#L13)、[36](../js/shards4.js#L36) |
| grudge | 宿怨素 | 1·2 | HUNT | 受伤后对来源 +20/30%，持续 5/8s | [shards4.js:16](../js/shards4.js#L16)、[52](../js/shards4.js#L52) |
| melt | 骨甲溶解 | 2·1 | SURVIVE | 最大生命压到 1，护甲 += 损失值 +2 | [shards4.js:19](../js/shards4.js#L19)、[28](../js/shards4.js#L28) |
### 4.3 血清池、等级钳制与 `svBan` 排除池

- 池条件：`(p.shards[id]||0) < s.max && s.rar >= minRar`（[ui.js:234](../js/ui.js#L234)）；**已满级即永久退出卡池**，卡池空时发 30 墨水兜底（[ui.js:245](../js/ui.js#L245)）。
- 等级钳制：`recomputeStats` 每轮把越界层数夹回 `[1,max]`（[combat.js:88](../js/combat.js#L88)），因为多个效果用层数查表，越界会算出 NaN（同处注释）。
- 取卡：`applyShard` 层 +1、跑 `once` 钩子、刷新 tint、推协同动画（[ui.js:285](../js/ui.js#L285)-[292](../js/ui.js#L292)）。
- `svBan`（样本筛滤的"排除"）：实现是**临时把这些血清顶到满级**再调 `rollCards`，抽完恢复原层数（[sieve.js:29](../js/sieve.js#L29)-[31](../js/sieve.js#L31)），所以"排除"复用了"满级出池"这条规则；新开局清空 `svBan`（[sieve.js:32](../js/sieve.js#L32)）。
- `svBan` 还有第二个来源：透析洗掉某血清时同时拉黑（[rooms.js:136](../js/rooms.js#L136)）；面板列出被排除清单（[panels.js:259](../js/panels.js#L259)）。

---

## 5. SYNERGIES（协同）

**结论：协同不是新系统，而是"两个 id 同时在 `p.shards` 里 → 在已有的代码路径上开一个布尔分支"。`SYN` 每次 `recomputeStats` 全量重建（[combat.js:90](../js/combat.js#L90)-[91](../js/combat.js#L91)），所以它永远与当前血清同步，不需要额外存档。**

### 5.1 全表（id / 需求 / 代码里真正发生什么 / 行号）

| id | 需求 | 实际触发路径 | 行号 |
|---|---|---|---|
| plasma | ember+arc | 链电命中燃烧目标时 `plasmaPop` 清燃烧并爆炸（半径 22+3×层，伤害 6+4×层） | [combat.js:173](../js/combat.js#L173)、[180](../js/combat.js#L180)、[184](../js/combat.js#L184) |
| shatter | rime+keen | 暴击冻结目标 ×2.25 并清零 `frozen` | [combat.js:135](../js/combat.js#L135) |
| choir | echo+fork | 回响伤害从 ×0.6 变 ×1（仅 `o.ghost` 分支） | [weapons.js:122](../js/weapons.js#L122) |
| chain | bloom+shrap | 骨刺碎片子弹带 `boomOnEnd`，结束/撞墙时爆炸 | [combat.js:245](../js/combat.js#L245)、[weapons.js:422](../js/weapons.js#L422) |
| mirror | rico+seeker | 反弹：首次反弹统一 ×0.75 衰减一次，之后每次 +40% 且强制 `home≥2` | [weapons.js:395](../js/weapons.js#L395)-[396](../js/weapons.js#L396) |
| wild | ember+bloom | 击杀爆炸带 `ignite`，爆心敌人 `burn` 强制到 3 | [combat.js:243](../js/combat.js#L243)、[267](../js/combat.js#L267) |
| storm | arc+sat | 卫星方块每次命中都调 `chainLightning` | [weapons.js:460](../js/weapons.js#L460) |
| phantom | after+echo | 冲刺后 0.08s 补一次 `attack({ghost:true})` | [game.js:150](../js/game.js#L150) |
| caustic | venom+ember | 燃烧+中毒同时存在时 DoT ×2 | [combat.js:189](../js/combat.js#L189) |
| plague | venom+shrap | 中毒敌人死亡时向 50 半径内叠毒 | [combat.js:247](../js/combat.js#L247) |
| singular | vortex+bloom | 涡流消失时额外 `explode(36, 16×dmg)` | [combat.js:293](../js/combat.js#L293) |
| swarm | drone+fork | 无人机每次射 2 发（角度偏 0.12） | [combat.js:302](../js/combat.js#L302) |
| berserk | fury+frenzy | 狂怒层上限 10→20 | [combat.js:230](../js/combat.js#L230) |
| execu | guill+keen | 处决阈值 +10%，且处决时再炸 30 半径 | [combat.js:161](../js/combat.js#L161)、[163](../js/combat.js#L163) |
| retrib | spite+plate | 破甲也算"受伤"：仍放碎片 + 44 半径爆炸 | [combat.js:315](../js/combat.js#L315)-[317](../js/combat.js#L317) |
| tesla | stat+arc | 生物电间隔减半，且 `fromShock:false` 允许它触发链电 | [combat.js:306](../js/combat.js#L306)、[309](../js/combat.js#L309) |
| flash | rnova+bloom | 换弹冲击波额外点燃并炸一次 | [weapons.js:591](../js/weapons.js#L591)-[592](../js/weapons.js#L592) |
| deadeye | lastround+keen | 最后一发 `crit2`→`critBonus=1`（必暴）且 `pierceAll`→穿透 +99 | [weapons.js:604](../js/weapons.js#L604)、[180](../js/weapons.js#L180)、[225](../js/weapons.js#L225) |
| sleight | tactical+quick | 换弹中冲刺直接把换弹完成 | [weapons.js:621](../js/weapons.js#L621) |
| slip | moment+swift | 移动伤害加成翻倍 | [combat.js:129](../js/combat.js#L129) |
| cstorm | frac+needle | 碎片穿透 2 且伤害 ×2 | [shards2.js:117](../js/shards2.js#L117) |
| demol | close+heavy | 近距加成 ×1.5，近距离击退 ×1.8 | [shards2.js:102](../js/shards2.js#L102) |
| wreck | lead+rico | 反弹弹丸每次 +25% 伤害并变大（与 mirror 共用一次 0.75 衰减） | [weapons.js:395](../js/weapons.js#L395)-[396](../js/weapons.js#L396) |
| omen | mark+keen | 标记暴击 ×1.5；击杀时把标记传给 90 内最近的敌人 | [combat.js:133](../js/combat.js#L133)、[shards2.js:124](../js/shards2.js#L124) |
| melt(热) | sear+frenzy | 烧灼层数上限 10→15，且每次叠 2 层 | [shards2.js:103](../js/shards2.js#L103) |
| covenant | soul+leech | 骨髓摄食回 1→2 | [shards2.js:121](../js/shards2.js#L121) |
| adren | ovclk+fury | 击杀把剩余冲刺冷却砍到 25% | [shards2.js:123](../js/shards2.js#L123) |
| phase | veil+quick | 无敌时长上限 ×2，并清除 44 半径敌弹（覆盖率仍 ≤70%） | [shards2.js:139](../js/shards2.js#L139)、[146](../js/shards2.js#L146) |
| fortress | refit+plate | 结痂素冷却减半 | [shards2.js:152](../js/shards2.js#L152) |
| laststand | lone+heavy | 攻速 ×1.25（在 `recomputeStats` 里乘） | [combat.js:92](../js/combat.js#L92) |
| bounty | greed+big | 精英/Boss 掉落翻 3 倍（在 ink 公式里） | [combat.js:240](../js/combat.js#L240) |
| jackpot | allin+keen | 暴击率 +15%（`recomputeStats`） | [combat.js:92](../js/combat.js#L92) |
| perfect | pristine+plate | 允许缺 1 点护甲仍算"满甲" | [shards2.js:104](../js/shards2.js#L104) |
| lastbreath | breakw+spite | 破甲冲击波附带 1.5s 无敌 | [shards2.js:157](../js/shards2.js#L157) |
| blaze | trail+ember | 火痕时长 ×2，且灼烧层从 1 提到 3 | [shards2.js:160](../js/shards2.js#L160)、[163](../js/shards2.js#L163) |
| hawkeye | farshot+keen | 远程命中且距离 ≥120 时 `critBonus += .2` | [shards3.js:43](../js/shards3.js#L43)、[33](../js/shards3.js#L33) |
| firing | volley+fork | 副手攻速系数 0.3→0.5 | [shards3.js:58](../js/shards3.js#L58) |
| overheat | hotb+quick | 热量上限 ×2，换弹只清一半热量 | [shards3.js:64](../js/shards3.js#L64)、[66](../js/shards3.js#L66) |
| crossfire | weave+expose | 抵消敌弹时射一枚追踪碎片并使其暴露 | [shards3.js:74](../js/shards3.js#L74) |
| sniper | farshot+expose | 远距（≥120）暴露加成 ×2 | [shards3.js:37](../js/shards3.js#L37) |
### 5.2 只在特定武器/元素下生效的协同（重点警告）

- **远程专属**：`farshot`/`expose`/`hawkeye`/`sniper`/`hotb`/`volley`。`rangedWeapon()` 排除 `MELEE` 武器；`rangedHit()` 再排除场地伤害、链电、碎片与近战产物——所以近战流拿这几个等于空转（[shards3.js:34](../js/shards3.js#L34)、[36](../js/shards3.js#L36)）。
- **耗弹专属**：`deadeye`/`sleight`/`lastround`/`bottomless`，因为 `usesAmmo = 非近战 && 有 mag`，纯近战没有弹匣（[weapons.js:89](../js/weapons.js#L89)、[604](../js/weapons.js#L604)）。
- **必须真的弹过**：`mirror`/`wreck` 挂在"撞墙且 `bounce>0`"分支里（[weapons.js:393](../js/weapons.js#L393)-[396](../js/weapons.js#L396)）。
- **必须有场上的方块**：`storm` 只在 `updateOrbs` 的方块碰撞里触发链电（[weapons.js:459](../js/weapons.js#L459)-[460](../js/weapons.js#L460)）。
- **必须真的上了元素**：`plasma`/`caustic`/`blaze` 依赖 proc 门控（[combat.js:152](../js/combat.js#L152)-[154](../js/combat.js#L154)）。
- **必须是冲刺那一帧**：`phantom` 挂在 `dashT` 起手（[game.js:150](../js/game.js#L150)）。

## 6. CURSE（诅咒）与开卡规则

**结论：诅咒是"层间三选一"的永久并发症，16 条；诅咒事件本身由神像触发，触发后给的是 `minRar=2` 的**血清三选一**（`cursedGift`），而不是血清里带 `CURSE` tag 的那几支；重掷现在是 1 点最大生命的永久代价。**

### 6.1 全表（id / 名称 / 代价 / 落点 / 行号）

| id | 名称 | 代价 | 代码落点 | 行号 |
|---|---|---|---|---|
| greed | 吸收不良 | 零件 -25% | `inkMul()` ×0.75 | [shards2.js:172](../js/shards2.js#L172)、[96](../js/shards2.js#L96) |
| hubris | 手部痉挛 | 弹匣 -40% | `curseStats` `mag *= .6` | [shards2.js:173](../js/shards2.js#L173)、[189](../js/shards2.js#L189) |
| coward | 恐慌症 | 破甲时不能冲 | `cowed` 拦冲刺并提示 | [shards2.js:174](../js/shards2.js#L174)、[game.js:142](../js/game.js#L142)-[144](../js/game.js#L144) |
| wrath | 肌肉疲劳 | 持续攻击伤害 -30% | `holdT>1` → ×0.7 | [shards2.js:175](../js/shards2.js#L175)、[106](../js/shards2.js#L106) |
| sloth | 关节炎 | 自动换弹吃 1 伤 | 先把 `inv=0` 强行 `hurtPlayer(1)` 再还原 | [shards2.js:176](../js/shards2.js#L176)、[149](../js/shards2.js#L149) |
| tremor | 共济失调 | ≤3 血时移动抖动 | 旋转输入向量 | [shards2.js:177](../js/shards2.js#L177)、[game.js:130](../js/game.js#L130) |
| surr | 创伤休克 | 受伤后 2s 伤害 -40% | `lastHit<2` → ×0.6 | [shards2.js:178](../js/shards2.js#L178)、[107](../js/shards2.js#L107) |
| over | 健忘症 | 进层扣一半零件 | 进层时 `floor(ink/2)` | [shards2.js:179](../js/shards2.js#L179)、[game.js:80](../js/game.js#L80) |
| disaster | 费洛蒙外泄 | 每波多 20% 敌人 | 波次预算 ×1.2 | [shards2.js:180](../js/shards2.js#L180)、[game.js:185](../js/game.js#L185) |
| seal | 神经损伤 | 受伤后 3s 技能禁用 | 施放前置检查 + HUD 倒计时 | [shards2.js:181](../js/shards2.js#L181)、[skills.js:80](../js/skills.js#L80)、[panels.js:233](../js/panels.js#L233) |
| time | 血腥味 | 锁房 20s 后敌人 +50% 攻击欲 | `e.raged` 提高 `cd` 消耗 | [shards2.js:182](../js/shards2.js#L182)、[enemies.js:105](../js/enemies.js#L105)、[108](../js/enemies.js#L108) |
| drought | 血友病 | 任何治疗归零 | `healPlayer` 直接 return 0 | [shards2.js:183](../js/shards2.js#L183)、[98](../js/shards2.js#L98) |
| slow | 贫血 | 护甲回复 -50% | `armorRegen *= .5` | [shards2.js:184](../js/shards2.js#L184)、[189](../js/shards2.js#L189) |
| night | 夜盲症 | 视野缩小约 30% | 三圈黑幕 150/183/213 | [curses2.js:9](../js/curses2.js#L9)、[19](../js/curses2.js#L19)-[21](../js/curses2.js#L21) |
| reject | 排异反应 | 血清只出 2 张 | `rollCards` 结果切片 | [curses2.js:10](../js/curses2.js#L10)、[17](../js/curses2.js#L17) |
| lung | 肺气肿 | 冲刺冷却 +100% | `dashCd *= 2` | [curses2.js:11](../js/curses2.js#L11)、[15](../js/curses2.js#L15) |
### 6.2 开卡与重掷规则

- 触发：碰神像 `G.curse++` 后 `openCards(2,'cursedGift')`——**`minRar=2`，只出稀有度 ≥2 的血清**（[game.js:400](../js/game.js#L400)、[ui.js:234](../js/ui.js#L234)、[246](../js/ui.js#L246)-[249](../js/ui.js#L249)）；`cursedGift` 的标题是"无标药剂/UNMARKED VIAL"（[i18n.js:40](../js/i18n.js#L40)）。
- 副作用：每层 `G.curse` 让敌人生命 +20%、敌弹速度 +10%（[enemies.js:50](../js/enemies.js#L50)、[75](../js/enemies.js#L75)），面板按 20%/层显示（[panels.js:258](../js/panels.js#L258)、[251](../js/panels.js#L251)）。
- 层间诅咒事件：转场后 `openCurse()` 从池中洗 3 张；池 = 未拥有且未被透析拉黑（[game.js:594](../js/game.js#L594)、[shards2.js:198](../js/shards2.js#L198)-[201](../js/shards2.js#L201)、[192](../js/shards2.js#L192)）；池空时 `curseless()` 直接跳过（[game.js:746](../js/game.js#L746)、[750](../js/game.js#L750)）。
- 选定：写入 `G.curses`、`recomputeStats()`、`curseDone=true`、强 chroma（[shards2.js:222](../js/shards2.js#L222)）。
- **重掷代价 = 1 点最大生命**：`curseRerollOk()` 要求 `maxHp>2` 且有替补（[curses2.js:23](../js/curses2.js#L23)）；落地方式是先还原被扣的当前血、再 `G.mhpLoss++`，由 `curseStats` 做 `S.maxHp -= mhpLoss`（[curses2.js:24](../js/curses2.js#L24)-[25](../js/curses2.js#L25)、[15](../js/curses2.js#L15)）。
- 旧规则（"`hp>1` 时 `hp--`"，[shards2.js:207](../js/shards2.js#L207)、[219](../js/shards2.js#L219)）被 `curses2` 覆盖，因为后者在 `shards2` 之后加载并重定义 `curseRerollOk` 与 `updateCurse`（[platform.js:82](../js/platform.js#L82)-[83](../js/platform.js#L83)）。
- `mhpLoss` 随存档保存并在读档后重算（[game.js:283](../js/game.js#L283)、[335](../js/game.js#L335)、[curses2.js:28](../js/curses2.js#L28)），面板单列"以生命上限刷新"的损失（[panels.js:257](../js/panels.js#L257)）。

## 7. SKILLS 与技能晶片

**结论：技能是"按 E 开一个带时长的状态"，冷却随难度缩放；晶片系统只做安装/替换，具体行为由各技能自己的钩子接管；`Singularity!` 是 chips2 的唯一新技能，靠吸收敌弹数量换内爆伤害。**

- **Limit!**：5s 内除自己移动外世界减速到 0.2×，落地为 `wdt = dt*(G.limit?.2:1)`（[skills.js:4](../js/skills.js#L4)、[game.js:604](../js/game.js#L604)）。
- **Dash!**：3 层临时盾 +40% 移速，结束冲击波清弹；吃伤走 `skillShieldHit`（[skills.js:6](../js/skills.js#L6)-[7](../js/skills.js#L7)、[84](../js/skills.js#L84)-[89](../js/skills.js#L89)）。
- **Risk!**：5s 内致命伤留 1 血、护甲失效、视野随血量收缩，结束回 1 甲 1 血（[skills.js:8](../js/skills.js#L8)-[9](../js/skills.js#L9)、[game.js:100](../js/game.js#L100)、[103](../js/game.js#L103)、[skills.js:40](../js/skills.js#L40)）。
- **Teleport!**：冻结 3s，点视野内位置瞬移，落地 1s 无敌（[skills.js:13](../js/skills.js#L13)、[71](../js/skills.js#L71)）。
- **Overclock!**：5s 内受到双倍伤害、必定暴击、暴伤 +100%、攻速 +50%（[achieve.js:242](../js/achieve.js#L242)、[245](../js/achieve.js#L245)、[247](../js/achieve.js#L247)）。
- **冷却与解锁**：`skillCdMax = cd * diffV('skillCd')`（绝境 1.5×）（[skills.js:12](../js/skills.js#L12)、[difficulty.js:27](../js/difficulty.js#L27)）；`ovc` 需活动解锁，其余默认可选（[event.js:81](../js/event.js#L81)）；`SKILL_IDS` 会被 chips2/achieve 追加（[skills.js:15](../js/skills.js#L15)、[chips2.js:11](../js/chips2.js#L11)、[achieve.js:244](../js/achieve.js#L244)）。
- **安装/替换**：已有技能会被丢回地面成可拾取晶片（[skills.js:20](../js/skills.js#L20)-[26](../js/skills.js#L26)）。

**Singularity!（chips2）**：dur 4s / cd 24s，落点取鼠标（触屏取锁定目标），并逐帧向玩家回退直到不卡墙且有视线（[chips2.js:6](../js/chips2.js#L6)-[10](../js/chips2.js#L10)、[15](../js/chips2.js#L15)-[20](../js/chips2.js#L20)）；半径 90（[chips2.js:14](../js/chips2.js#L14)）；非 boss 被 `moveBody` 拉向中心、**boss 只减速到 0.7**（[chips2.js:24](../js/chips2.js#L24)-[26](../js/chips2.js#L26)）；7 以内敌弹被吞且 `s.n++`，其余被改速度拉向中心（[chips2.js:27](../js/chips2.js#L27)-[29](../js/chips2.js#L29)）；内爆 `dmg=(30+min(80,n*2))*G.S.dmg`、半径 72+e.r（[chips2.js:31](../js/chips2.js#L31)-[32](../js/chips2.js#L32)）；四个钩子被重定义（[chips2.js:43](../js/chips2.js#L43)-[49](../js/chips2.js#L49)）。

## 8. 武器等级、弹药、`wAccent` 与出池规则

**结论：武器 0~3 级，每级 +25% 伤害与 +10% 攻速；远程武器用 `AMMO` 表定义弹匣/装填/弹种/强调色；`wAccent` 决定换弹"吸收"的颜色；第 1 层起点只从 22 件 `BASIC_WEAPONS` 里出。**

- **总量 69 件**：`weapons.js` 37 + `weapons2.js` 12 + `weapons3.js` 20（[weapons.js:3](../js/weapons.js#L3)-[78](../js/weapons.js#L78)、[weapons2.js:3](../js/weapons2.js#L3)-[28](../js/weapons2.js#L28)、[weapons3.js:6](../js/weapons3.js#L6)-[88](../js/weapons3.js#L88)、[weapons.js:91](../js/weapons.js#L91)）。
- **等级上限 3**，铁匠台费用 `30+25*lv`（[game.js:394](../js/game.js#L394)-[396](../js/game.js#L396)、[rooms.js:50](../js/rooms.js#L50)）；收益 `伤害×(1+0.25lv)`、`攻速+10%lv`，近战只吃攻速加成的 55%（[weapons.js:102](../js/weapons.js#L102)、[104](../js/weapons.js#L104)）；读档时等级夹到 1..3（[game.js:299](../js/game.js#L299)）。
- **近战集合** `MELEE` 基础 8 种，后续追加 aegis/fissure/vacuum/flail/chainsaw/baton/chop（[weapons.js:88](../js/weapons.js#L88)、[weapons2.js:32](../js/weapons2.js#L32)、[weapons3.js:94](../js/weapons3.js#L94)）；`usesAmmo = 非近战 && 有 mag`（[weapons.js:89](../js/weapons.js#L89)）。
- **弹药**：`AMMO=[mag, reload秒, 弹种, 强调色键]`（[weapons.js:81](../js/weapons.js#L81)-[86](../js/weapons.js#L86)）；`wAccent=C[w.acK]`，缺省 `col(5)`（[weapons.js:90](../js/weapons.js#L90)）；`magSize=round(mag*S.mag)`、`reloadTime=max(.25,reload*S.reload)`（[weapons.js:572](../js/weapons.js#L572)-[573](../js/weapons.js#L573)）。
- **换弹链**：打空 → `startReload(...,passive)` → `onPassiveReload`（veil / 关节炎）（[weapons.js:601](../js/weapons.js#L601)、[575](../js/weapons.js#L575)、[shards2.js:127](../js/shards2.js#L127)）；完成 → `primed` 叠层、`rnova` 冲击波、`refit` 回甲（[weapons.js:584](../js/weapons.js#L584)-[592](../js/weapons.js#L592)、[shards2.js:151](../js/shards2.js#L151)）；最后一发 `lastround` 的 `bonus` 并入伤害倍率（[weapons.js:604](../js/weapons.js#L604)、[122](../js/weapons.js#L122)）；冲刺换弹 `sleight` 立即完成 / `tactical` 回 20%（[weapons.js:620](../js/weapons.js#L620)-[622](../js/weapons.js#L622)）。
- **出池**：首层起点房只出 `BASIC_WEAPONS` 22 件（[game.js:26](../js/game.js#L26)、[75](../js/game.js#L75)）；其余 `newWeapon()` 排除手持与未解锁、没出现过的优先（[game.js:273](../js/game.js#L273)-[275](../js/game.js#L275)）；`sonic/barrage/thermite/recoilless` 需黑市购买（[market.js:22](../js/market.js#L22)-[23](../js/market.js#L23)）；`wCap()` 在 `lone` 血清时降到 1（[shards2.js:93](../js/shards2.js#L93)、[game.js:351](../js/game.js#L351)）。

## 9. ink 墨水经济

**结论：敌人掉的"零件（ink）"按 50% 折价入账，再乘难度系数与贪婪/囤积修正；连击是唯一会放大单次掉落的乘数（每层 +5%，20 层封顶 = +100%）。**

| 项 | 规则 | 行号 |
|---|---|---|
| 基础转化 | `INK_RATE=0.5`；拾取 1 个 → 实际入账 0.5 | [game.js:90](../js/game.js#L90)、[91](../js/game.js#L91)、[260](../js/game.js#L260) |
| 累加器 | `G.inkAcc` 留小数，攒够整数才加 `G.ink`（不丢零头） | [game.js:91](../js/game.js#L91) |
| 难度系数 | `diffV('ink')`：简单 1 / 经典 1 / 困难 0.6 / 噩梦 0.5 / 绝境 0.45 | [difficulty.js:7](../js/difficulty.js#L7)、[17](../js/difficulty.js#L17)、[22](../js/difficulty.js#L22)、[27](../js/difficulty.js#L27)、[36](../js/difficulty.js#L36) |
| `inkMul()` | 血清 `greed` ×1.3；诅咒 `greed` ×0.75 | [shards2.js:96](../js/shards2.js#L96) |
| 单次掉落 | `round(e.ink\|\|2) * (1+min(combo,20)*.05) * (bounty?3:1)` | [combat.js:240](../js/combat.js#L240)-[241](../js/combat.js#L241) |
| 敌人自带 | 小怪 1~2，精英 ×3 | [enemies.js:20](../js/enemies.js#L20)、[54](../js/enemies.js#L54) |
| 连击 | 击杀 `combo++`、`comboT=2.2`；2.2s 断档或受伤清零 | [combat.js:229](../js/combat.js#L229)、[game.js:603](../js/game.js#L603)、[102](../js/game.js#L102) |
| 连击音高 | `COMBO_STEPS` 半音表 → `2^(step/12)` | [combat.js:205](../js/combat.js#L205)-[206](../js/combat.js#L206) |
| 满血吃心 | 心转成 5 墨水 | [game.js:261](../js/game.js#L261) |
| 花费与刷新 | `pay(cost)`；刷新价 `RR_BASE[层]+rerolls*RR_STEP` | [game.js:350](../js/game.js#L350)、[ui.js:257](../js/ui.js#L257)-[258](../js/ui.js#L258) |
| 商店加价 | `priceOf`：`greed` 血清时 ×1.5 | [shards2.js:95](../js/shards2.js#L95) |
| 反哺战斗 | `scrap` 按持有零件数给伤害 | [shards4.js:31](../js/shards4.js#L31) |
| 卡池耗尽 | 卡池空时直接给 30 墨水 | [ui.js:245](../js/ui.js#L245) |

注意：单次掉落用 `Math.round` 取整，入账又走 `gainInk` 的 50% 折价——**一条命掉 2 墨水，实际只进 1 点**（[combat.js:240](../js/combat.js#L240) + [game.js:91](../js/game.js#L91)）。

## 10. 未证实 / 需实测项

1. `CACC` 那 18 个色值分别对应场景里的哪些物件（火、灯、女孩、玻璃、锈迹），只从注释推断，未逐物件核对 → **未证实**（[camp.js:9](../js/camp.js#L9)-[10](../js/camp.js#L10)、[38](../js/camp.js#L38)）。
2. `chroma` 的"观感强度"与 `fxGain()` 负载抑制的交互，未做帧率/可读性实测 → **未证实**（[engine.js:239](../js/engine.js#L239)、[245](../js/engine.js#L245)）。
3. 各协同的实际 DPS 增益，本文只确认代码路径，未量化 → **未证实**。
4. `cursedGift`（`minRar=2`）三选一的稀有度实际分布，未统计 → **未证实**（[ui.js:236](../js/ui.js#L236)）。
5. `e.stunT` 只有读取处（[enemies.js:99](../js/enemies.js#L99)），本次给定文件内未找到写入处 → **未证实**是否仍有武器在写。
6. `bottomless`（拾荒本能）与 `scrap`（拾荒本能）中文同名，是否刻意文案重复 → **未证实**（[combat.js:53](../js/combat.js#L53)、[shards4.js:10](../js/shards4.js#L10)）。
7. Boss 的"颜色安全区"机制（`sliceColor` / `p.pol`）主要在 `boss.js`，超出本次给定文件范围，未展开 → **未证实**（[boss.js:374](../js/boss.js#L374)、[game.js:558](../js/game.js#L558)）。
