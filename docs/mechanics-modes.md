# 机制文档 · 模式 / 难度 / 存档

> 只读分析，未改动 `site/js/**` 与 `[TheSeed]/**` 任何字节。
> 每条结论后附 `site/js/文件名:行号`。推断或服务端相关标「未证实」。
> 覆盖 task-3 范围：三种模式、难度表、绝境五锁、limited 五锁榜、存档、成就称号、每日/事件/公告/好感、云存档。

---

## 0. 结论先行（十条）

1. **三种模式是同一套 `newRun` + 三个分支**：`RUN_MODE` 只决定下一次开局的模式（`site/js/invade.js:5`），`enterFloor` 是唯一分流点——`RUN_MODE==='invade'` 直接转 `ivBegin()`，否则把 `G.mode` 标成 `'explore'`（`site/js/invade.js:192`）。
2. **只有"通关"进榜，且三个模式的门槛不同**：探索只有 `win` 才上传；无尽只要 `r.endless` 就上传（哪怕倒地）；入侵是 `win || wave>=3`（`site/js/net.js:102`、`site/js/achieve.js:176`）。
3. **"无尽跌倒算赢"只对入侵抵抗成立，探索无尽不成立**：探索无尽倒地仍是 `finishRun(false)`（`site/js/game.js:110`），靠 `endless` 标志进无尽榜（`site/js/net.js:102`）；入侵无尽由 `ivFinish` 把 `win` 强制改真（`site/js/invade-endless.js:72`）。
4. **难度通过 10 个键乘进全局公式，而不是给玩家减益**：`diffV(k)` 是唯一入口，`barrage` 永远封顶 3，无尽下 `wave` 封顶 3、`aggr` 封顶 4，血量类**不封顶**（`site/js/difficulty.js:36-40`）。
5. **绝境五锁是"自愿加码"，只在探索+绝境+非入侵+非测试时可生效**，五个全带 = 通关额外 +12 火种（`site/js/modifiers.js:4-8,14-15`）。
6. **`rot` 不是 bug：`defineProperty` 把 burn/venom/frozen 五个槽全锁成 0**，因为武器、地面场、扩散各写各的，统一拒绝写入才覆盖全部来源（`site/js/modifiers.js:29-30`）。
7. **limited 五锁榜的口径是"第 5 层 + 无 5 修饰符不报"**：`G.floor===4`（5 层制的最后一层）+ `cleanModifiers(...).length===5`，且 `cleanModifiers` 在非绝境直接返回 `[]`，所以**难度=绝境是隐式条件**（`site/js/limited.js:49`、`site/js/modifiers.js:12`）。
8. **读档不会重置分数项，而是"恢复"它们**：`runT/kills/hits/comboMax/rid` 全部从存档写回 `G`（`site/js/game.js:335`），存档是**每次进层时**拍的快照（`site/js/game.js:84`）。
9. **存盘的 8 个 KV 键全部由 dzmm 宿主代写，客户端没有任何 HTTP**：`STORE` 是 `dzmm.kv` 的内存镜像，`setItem` 后 `{flush:true}` 回写（`site/js/platform.js:10,16,31-33`）；全仓库无 `fetch`/`XMLHttpRequest`/`localStorage`。
10. **`daily.js` 里没有"每日种子"**：它是每日**任务**（通关探索 +3 火种 / 通关入侵 +3 火种），日界 0:00 GMT+8，用 `evDay(evNow())` 算（`site/js/daily.js:14-15`、`site/js/event.js:14`）。任务书里的"每日种子"是误称——本仓库不存在每日种子机制（`grep -rn "daySeed\|dailySeed" site/js` 为空）。

---

## 1. 三种模式：开始 / 结束 / 计分 / 上榜

### 1.1 总表

| 维度 | 突入探索 explore | 突入探索·无尽 endless | 入侵抵抗 invade |
|---|---|---|---|
| 入口 | 任务栏 出击 → 选难度（`site/js/invade.js:360,367`） | 最后一层 Boss 房清空后出现的红色传送门（`site/js/game.js:243`） | 任务栏 出击 → 入侵抵抗 → 选难度（`site/js/invade.js:366`） |
| 模式变量 | `G.mode='explore'`（`site/js/invade.js:192`）；`RUN_MODE` 默认 `'explore'`（`site/js/invade.js:5`） | `G.endless >= 1`，每次续走 +1（`site/js/game.js:413,747`） | `G.mode='invade'`（`site/js/invade.js:62`）；`RUN_MODE='invade'`（`site/js/invade.js:370`） |
| 开始条件 | 只有"无存档"或新局；`newRun()` 建局（`site/js/game.js:28`） | 必须**已通关最后一层 Boss 房**且 `!G.endless`、非 BOSS_TEST（`site/js/game.js:243`），按 E 触发 `startEndless()`（`site/js/game.js:410-411`） | 20 波区域战，先选偏好（`site/js/invade.js:71`），再选初始武器（`site/js/invade.js:304`） |
| 结束条件（胜） | 最后一层传送门按 E → `finishRun(true)`（`site/js/game.js:413`） | 无"胜"；暂停菜单"结束无尽"→ `endEndless()`（`site/js/game.js:745`、`site/js/ui.js:424`） | 守住第 20 波 → `ivWin()` → `ivFinish(true)`（`site/js/invade.js:110,113`） |
| 结束条件（负） | `hurtPlayer` 里 `hp<=0` → `finishRun(false)`（`site/js/game.js:110`） | 倒地 → 仍是 `finishRun(false)`（`site/js/game.js:110`）；主动结束 → `finishRun(false)`（`site/js/game.js:745`） | 倒地 → `ivFinish(false)`（`site/js/invade-effects.js:144`）；无尽倒地**强制改判为胜**（`site/js/invade-endless.js:72`） |
| 计分口径 | `clear 10000 / 未通关 floor*1500` + `kills*20` + `syn*1500` + 时间分 + 受击分（`site/js/net.js:81-83`） | `clear 10000` + `depth*6000` + `kills*20` + `syn*1500`，**无时间分/受击分**（`site/js/net.js:76,78-79`） | `clear 10000`（仅胜）+ `wave*1500` + `kills*10` + 受击分（仅胜）+ `lv*200`（`site/js/achieve.js:166-167`） |
| 上榜资格 | 必须 `win`（`site/js/net.js:102`） | 必须 `r.endless`（`site/js/net.js:102`） | `win || wave>=3`（`site/js/achieve.js:176`） |
| 榜单 key | `''`→`board`（`site/js/screens.js:131`） | `'e'`→`eboard`（`site/js/screens.js:131`） | `'i'`→`iboard`；无尽入侵 `'ie'`→`ieboard`（`site/js/screens.js:131`、`site/js/achieve.js:237`） |

### 1.2 上传链路（结论：先入队、再上传、只有明确 reject 才丢弃）

- `submitResult` 一进来先置 `r.up={st:'up'}`，BOSS_TEST 直接短路成 `'test'` 不上传（`site/js/net.js:100-101`）。
- 门槛：`if (!r.win && !r.endless && r.mode !== 'invade') → {st:'none'}`（`site/js/net.js:102`）。
- 入队键 `achroma_pending`，`stripResult` 只挑白名单字段（探索 19 个键 / `site/js/net.js:110`；入侵 15 个键 / `site/js/achieve.js:169-170`）。
- 未登录 → `st:'login'` 但**已经入队**（`site/js/net.js:103-104`），下次 `netInit` 后 `flushPending` 补交（`site/js/net.js:33,113`）。
- 只有 `j.reject` 才 `pendDrop`；网络/平台错误保留并 60s 后重试（`site/js/net.js:106,111`）。
- 服务器调用走单一队列、按优先级排序，`limitedSubmit` 优先级最高 `-1`（`site/js/net.js:12`）。

---

## 2. 难度表 DIFFS 全表

### 2.1 五个难度的 `v` 全键值（结论：10 个键，`armor` 只有 easy 非 0）

| 键 | easy :4-8 | classic :9-13 | hard :14-18 | nightmare :19-23 | despair :24-28 | 代码消费点 |
|---|---|---|---|---|---|---|
| `barrage` | **.8** | 1 | 1.1 | 1.2 | **1.7** | 敌弹数 `site/js/enemies2.js:46`；Boss 弹 `site/js/boss.js:87` |
| `mhp` | **.8** | 1 | 1.25 | 1.3 | **2** | 小怪血 `site/js/enemies.js:50` |
| `bhp` | 1 | 1 | 1.25 | 1.35 | **2.2** | Boss 血 `site/js/boss.js:31` |
| `ink` | 1 | 1 | .6 | .5 | **.45** | 墨水收益 `site/js/game.js:91` |
| `armor` | **1** | 0 | 0 | 0 | 0 | 初始护甲 `site/js/combat.js:94` |
| `aggr` | 1 | 1 | 1 | 1.3 | **2.3** | 怪攻击节奏 `site/js/enemies.js:108`；Boss 闲置 `site/js/boss.js:51` |
| `wave` | 1 | 1 | 1 | 1.2 | **1.5** | 每波刷怪预算 `site/js/game.js:185` |
| `wFloors` | 1 | 1 | **0** | 0 | 0 | 起始房是否给武器 `site/js/game.js:75` |
| `wChest` | 1 | 1 | 1 | **0** | **0** | 宝箱是否可能开双箱 `site/js/game.js:58` |
| `skillCd` | 1 | 1 | 1 | 1 | **1.5** | 技能冷却 `site/js/skills.js:12` |

所有 `v` 定义在 `site/js/difficulty.js:7,12,17,22,27`；`curDiff()` 找不到就回退 classic（`site/js/difficulty.js:31`）。

### 2.2 `mods` 文案（卡面展示的加减项）

| 难度 | 文案（`mods`） | 行号 |
|---|---|---|
| easy | `-` Boss 弹幕 -20%；`-` 怪物生命 -20%；`-` 初始护甲 +1 | `site/js/difficulty.js:6` |
| classic | `=` 原汁原味的平衡 | `site/js/difficulty.js:11` |
| hard | `+` Boss 生命 +25%；`+` Boss 弹幕 +10%；`+` 怪物生命 +25%；`+` 零件获取 -40% | `site/js/difficulty.js:16` |
| nightmare | `+` Boss 生命 +35%；`+` Boss 弹幕 +20%；`+` 怪物生命 +30%；`+` 攻击欲更强；`+` 波次人数 +20%；`+` 零件 -50% | `site/js/difficulty.js:21` |
| despair | `+` 一切（EVERYTHING） | `site/js/difficulty.js:26` |

文案与 `v` 的一处不对齐：hard/nightmare 的"零件获取 -40%/-50%"在 `v` 里对应 `ink .6/.5`（`site/js/difficulty.js:17,22`），不是独立字段——**同一数值被当"墨水/零件"复用**（未证实是否同义，`ink` 只进 `gainInk`，`site/js/game.js:91`）。

### 2.3 卡面与选择逻辑

- 五张卡横排、`pips` 1..5 表示强度；`PROOF_BY_DIFF` 火种数展示（`site/js/difficulty.js:96-97`、`site/js/girls.js:6`）。
- 选难度只写 `SET.diff` 并立刻存档（`site/js/difficulty.js:66`）。
- 入侵模式下选难度界面会额外显示 `D1..D5`（`site/js/difficulty.js:88,95,99-100`），D 值来自 `IV_DIFFICULTY`（`site/js/invade-data.js:74-80`）。
- 入侵难度表独立于 `DIFFS.v`：`easy{hp1,dmg1,events0,boss1}` … `despair{hp1.4,dmg1.4,events3,boss2}`（`site/js/invade-data.js:75-79`）。

### 2.4 ENDLESS_GROW 与 `diffV()` 封顶

- 增长率：`{mhp:.35, bhp:.35, barrage:.06, aggr:.08, wave:.07}`（`site/js/difficulty.js:33`），公式 `v *= 1 + grow * G.endless`（`site/js/difficulty.js:37`），`G.endless` 是**已走过的无尽层数**（每层 +1，`site/js/game.js:413`）。
- 封顶规则（`site/js/difficulty.js:37,40`）：
  - `barrage` → `min(v, 3)`，**无论是否无尽都封**；
  - 无尽时 `wave` → `min(v, 3)`、`aggr` → `min(v, 4)`；
  - `mhp/bhp` **不封顶**，随层数线性上升；
  - `ink/skillCd/armor/wFloors/wChest` 没有 GROW 键，永远维持基础值。
- 额外联动：`buffs.resolve`（决心）把 `wave` ×1.2（`site/js/difficulty.js:38`）；`bpace()` 把弹幕节奏夹到 ≤1，即"简单会变慢、困难不会变快，只加弹量"（`site/js/difficulty.js:34-35`、`site/js/boss.js:87`）。
- 玩家侧存在反向封顶：无尽开始时记下 `G.powCap=powerScale()`，之后强度不得超过该值（`site/js/game.js:747`、`site/js/combat.js:214`）；旧存档缺 `powCap` 时读档补算（`site/js/game.js:339`）。

---

## 3. 绝境五锁 RUN_MODIFIERS

结论：五锁是**自愿加码**，只在"探索 + 绝境 + 非入侵 + 非预览 + 非 BOSS_TEST"生效，全带通关额外 +12 火种。

### 3.1 真实代码效果（来源：`site/js/modifiers.js`）

| id | 名 | 奖励 | 文档措辞 :4-8 | 真实实现 | 行号 |
|---|---|---|---|---|---|
| `rage` | 激怒 | 2 | 敌人攻击频率翻倍（首领只生效 20%） | `enemyAttackRate()` 返回 2；怪 `e.cd`/`e.t` 按 2 倍推进，**Boss 上是 `1+(2-1)*.2=1.2`** | `site/js/modifiers.js:16`、`site/js/enemies.js:107-108` |
| `deathfight` | 死斗 | 2 | 致命伤后不可选中，2 秒后死亡 | `killEnemy` 拦截：`hp=0`、`deathFightLeft=2`、`inv=max(2,inv)`，期间 `hitEnemy/dotTick` 全返回 false，2 秒后补一次真实 `killEnemy` | `site/js/modifiers.js:42-46`、`:35-36`、`:18-24` |
| `bulwark` | 铁壁 | 2 | 交战 20 秒内受伤 -20% | `modifierDamageMul(e)` 在 `modCombatAge<20` 时 ×.8，命中管线和 DoT 都乘（`:139`、`:191`），并有蓝环提示 | `site/js/modifiers.js:17`、`site/js/combat.js:139,191` |
| `rot` | 腐烂 | 3 | 免疫燃烧/中毒/冰冻 | **`Object.defineProperty` 把 `burn/burnT/venom/venomT/frozen` 五个属性锁成 getter=0 / setter=空**；唯一的显式短路是 `applyFreeze` 直接 `return false`。DoT 不再被"拦"，而是 `dotTick` 里 `e.burn>0 / e.venom>0` 永远不成立 | `site/js/modifiers.js:29-30`、`site/js/combat.js:108`、`:188-201` |
| `cyst` | 囊肿 | 3 | 所有敌人生命上限 +25% | `spawnEnemy` 后对非 Boss `hp=maxHp=maxHp*1.25`；`spawnBoss` 后对 `def.form!==2` 的 Boss 同样 ×1.25 | `site/js/modifiers.js:26-28,33` |

### 3.2 `rot` 为什么"看起来像 bug 其实是设计"

- 直接写 `e.burn=0` 只覆盖一个来源；而写入方至少 8 处：命中管线、武器火焰、地面火焰、陷阱、扩散、等离子等（`site/js/combat.js:152-153,246-247,267`、`site/js/weapons.js:412`、`site/js/weapons3.js:263,286,316`、`site/js/traps.js:24,29`、`site/js/shards2.js:163`）。
- 用属性拦截器一次性堵死"所有来源"，注释明写"统一拒绝写入以覆盖全部来源"（`site/js/modifiers.js:29`）。
- 副作用可验证：`burn` 变只读后，`plasmaPop` 里 `e.burn=0` 是静默失败（`site/js/combat.js:184`），但 `rot` 本身已让 burn 恒 0，语义上等价——**这不是 bug**。

### 3.3 `hasRunModifier` 的四个前置（外加 id 在列）

`G.mode!=='invade' && G.diff==='despair' && !G.preview && !(window.BOSS_TEST && BOSS_TEST.on) && G.modifiers.includes(id)`（`site/js/modifiers.js:14`）。即：①非入侵 ②难度=绝境 ③非图鉴预览 ④非 Boss 测试；第 5 条是 `id` 在 `G.modifiers` 里。

### 3.4 入口与清洗

- `cleanModifiers(ids,diff,mode)`：非绝境或入侵一律返回 `[]`（`site/js/modifiers.js:12`）——这是"难度=绝境"在所有下游的**唯一强制点**。
- 菜单入口 `modifierEntryAllowed()` 只在 `DEP.mode==='explore' && 难度==='despair'` 时给按钮（`site/js/modifiers.js:55`）。
- 普通出击清空待选（`site/js/modifiers.js:52`）；重开沿用本局（`:53`）；`sortie` 才把待选灌进 `PENDING_MODIFIERS`（`:51`）；`newRun` 取走（`site/js/game.js:33`）。
- 五锁表格奖励合计 = 2+2+2+3+3 = **12**（`site/js/modifiers.js:4-8` 求和）；只进 `girlsOnClear` 的火种，不进排行榜分数（`site/js/girls.js:83`），因为 `runScore` 不含该字段（`site/js/net.js:81-83`）。

---

## 4. limited.js 五锁榜（限量任务）

结论：**只有"第 5 层通关 + 5 锁全开 + 非入侵 + 非无尽 + 行为合法"才上报**，名额由服务端独占，客户端只负责提交与展示。

- 条件（`site/js/limited.js:49`）：`achRunEligible() && G.mode!=='invade' && !G.endless && G.floor===4 && cleanModifiers(...,G.mode).length===5`。
- `G.floor===4` 即 5 层制的最后一层（`site/js/world.js:5-11` 只有 5 个 FLOORS）。
- 难度=绝境是**隐式**的：`cleanModifiers` 在非绝境返回 `[]`（`site/js/modifiers.js:12`），长度不可能等于 5。
- 上报体：`buildResult(true)` 再覆盖 `{mode:'explore', modifiers:G.modifiers.slice(), test:false}`（`site/js/limited.js:50`）；入队键 `achroma_ltpend`（`:3`）。
- 触发点：`girlsOnClear` 被包装（`site/js/limited.js:59`），而 `girlsOnClear` 只在 **通关**（`site/js/game.js:348`）和**进入无尽**（`site/js/game.js:747`）时调用。
- 关键顺序细节：`startEndless()` 里 `girlsOnClear()` 在 `G.endless=1` **之前**执行（`site/js/game.js:747`），所以"最后一层不进传送门、改走无尽"这条路径上 `!G.endless` 仍然为真，条件能通过。**服务端是否接受该路径的上报未证实**（无服务端源码）。
- 名额与截止：`LTC={end:Date.UTC(2026,9,21,16), title:'t_traveler'}`（`site/js/limited.js:3`），仅前 10 名自动发称号（`:19` 文案 `FIRST 10 ACCOUNTS · AUTO AWARD`）。
- 客户端只用 `board.limitedStatus` / `board.limitedSubmit` 两个 action（`site/js/limited.js:44,54`），`FN_PRI.limitedSubmit=-1` 最高优先级（`site/js/net.js:12`）。
- 状态防回滚：先到的新状态不会被旧响应覆盖（`site/js/limited.js:29`）；拿到名额后把 `t_traveler` 塞进 `NET.specialTitles`（`:31`）。
- 界面：主菜单右侧竖排卡片，`ltRail()` 固定宽度 188（`site/js/limited.js:65`）；名额满/截止后进入 48h 公示（`:13-16,89-90`）。
- `achRunEligible()` 排除预览/BOSS_TEST/`TST.god`/已死（`site/js/achieve.js:115`）。

---

## 5. 存档机制

### 5.1 `achroma_run`（SAVE_KEY）全字段清单

`SAVE_KEY='achroma_run'`（`site/js/game.js:278`）。快照在 `saveRun()` 里构造（`site/js/game.js:280-289`），**每次 `enterFloor` 结束都会存一次**（`site/js/game.js:84`）。

| 字段 | 类型/含义 | 行号 |
|---|---|---|
| `v` | 恒 1，版本闸门 | `site/js/game.js:282` |
| `at` | `Date.now()` | `site/js/game.js:282` |
| `modifiers` | 五锁数组（再 `cleanModifiers` 过滤） | `site/js/game.js:282` |
| `floor` | 当前层索引 0..4 | `site/js/game.js:282` |
| `diff` | 难度 id | `site/js/game.js:282` |
| `hp` / `armor` | 当前生命/护甲 | `site/js/game.js:282` |
| `weapons` / `wi` | 武器数组 / 当前槽 | `site/js/game.js:282` |
| `wlv` / `shards` | 武器等级 / 血清等级映射 | `site/js/game.js:282` |
| `meltVersion` | 骨溶解旧存档兼容标记（值为 2） | `site/js/game.js:282` |
| `skill` / `phoenixUsed` | 芯片 id / 凤凰是否已用 | `site/js/game.js:283` |
| `ink` / `inkAcc` / `rerolls` / `curse` / `mhpLoss` | 经济与诅咒 | `site/js/game.js:283` |
| `ptn` | `{id,cd,sv}` 电台搭档 | `site/js/game.js:283` |
| `kills` / `comboMax` / `runT` / `hits` | **分数项** | `site/js/game.js:283` |
| `seenW` | 已见武器集合 | `site/js/game.js:283` |
| `freeReroll` / `diaN` / `support` | 免费重摇 / 透析次数 / 支援类型 | `site/js/game.js:283` |
| `rid` | 本局唯一 id | `site/js/game.js:283` |
| `curses` / `bossPick` / `endless` / `powCap` / `buffs` / `adrenAt` | 诅咒、Boss 选择、无尽层数、强度上限、增益、肾上腺素冷却 | `site/js/game.js:283` |
| `squad` | `[{id,wid,hits,away}]` | `site/js/game.js:284` |
| `met` / `campPick` | 已遇伙伴 / 营地选择 | `site/js/game.js:284` |
| `assisted` / `clearRewarded` / `proofGain` / `affGain` | 辅助标记 / 通关奖励凭据 / 火种增益 / 好感增益 | `site/js/game.js:285` |
| `svBan` / `curseBan` / `armorLoss` / `diaUsed` / `campUsed` | 血清/诅咒排除池与消耗计数 | `site/js/game.js:286` |
| `exp` / `expPerm` / `labUsed` | 实验血清进度与永久强化 | `site/js/game.js:287` |
| `transition` | `{floor,curseDone}` 或 null | `site/js/game.js:288` |

### 5.2 `loadSave` 的每一道校验（结论：白名单 + 数值夹取 + 顶层拒绝）

| 校验 | 规则 | 行号 |
|---|---|---|
| 顶层拒绝 | `!s || s.v!==1 || !Number.isInteger(s.floor) || !FLOORS[s.floor] || !Object.hasOwn(DIFF_BY,s.diff)` → 返回 null | `site/js/game.js:295` |
| 武器白名单 | `WEAPONS` 存在性 + 去重 + 最多 2 把；空则补 `['nail']` | `site/js/game.js:296` |
| `wi` | `floor(clamp(v,0,len-1))` | `site/js/game.js:297` |
| `levels()` | 键在定义表内、数值有限且 >0、`clamp(floor(v),1,cap)` | `site/js/game.js:298` |
| `wlv` | cap **3** | `site/js/game.js:299` |
| `shards` | cap = `defs[k].max` | `site/js/game.js:299` |
| `modifiers` | 再过 `cleanModifiers`（注意此处**不传 mode**） | `site/js/game.js:300` |
| `curses` / `svBan` / `curseBan` | 各自表白名单 + 去重 | `site/js/game.js:301-303` |
| `armorLoss` | `floor(0..10004)` | `site/js/game.js:304` |
| `diaUsed`/`labUsed`/`campUsed` | 整数、1..10004、去重 | `site/js/game.js:305` |
| `exp` | id 在 `EXP` 且 `left>0`，夹到 1..`EXP_FIGHTS` | `site/js/game.js:306` |
| `expPerm` | `levels(...,EXP,9)` | `site/js/game.js:307` |
| `squad` | id 在 `SURV` 且 wid 在 `WEAPONS`；再按 id 去重 | `site/js/game.js:308,316` |
| `met` / `seenW` | 各自表白名单 | `site/js/game.js:309` |
| 数值键 | `ink/inkAcc/rerolls/curse/kills/comboMax/runT/hits/powCap/adrenAt/proofGain` → `saveNum(v,0)`，默认范围 0..1e9 | `site/js/game.js:310,291` |
| `endless` | `floor(0..9999)` | `site/js/game.js:311` |
| `hp` | **1..30**（下限 1，读档不会 0 血） | `site/js/game.js:311` |
| `armor` | **0..30** | `site/js/game.js:311` |
| `affGain` | 每项 `[SURV内id, 有限数]` | `site/js/game.js:312` |
| `skill` | 在 `SKILLS` 内否则 null | `site/js/game.js:313` |
| `rid` | `/^[A-Za-z0-9_-]{1,40}$/`，否则 **null**（不是拒绝整档） | `site/js/game.js:314` |
| `campPick` | 在 `SURV` 内 | `site/js/game.js:315` |
| `buffs` | 重建成 `{resolve:bool, adren:bool}`（只留两个键） | `site/js/game.js:317` |
| `bossPick` | 重建成 `{alt:bool, v:bool}` | `site/js/game.js:318` |
| `transition` | `floor` 整数且在 `FLOORS` 内 | `site/js/game.js:319` |

补充：`s.modifiers = cleanModifiers(s.modifiers, s.diff)` 只传两个参数（`site/js/game.js:300`），第三个 `mode` 为 `undefined`，而 `cleanModifiers` 判的是 `mode!=='invade'`，所以**读档时不会被误清空**（`site/js/modifiers.js:12`）。

### 5.3 `RESUMING` 标志与 transition 存档

- `let RESUMING=false`（`site/js/game.js:279`）；`saveRun` 首行 `if (RESUMING || !G.p || BOSS_TEST.on) return;`（`site/js/game.js:281`）——读档期间重建楼层**不会反向覆盖**刚读进来的档。
- `resumeRun` 用 `try/finally` 夹住 `newRun()`（`site/js/game.js:326`），`newRun` 内部 `if(!RESUMING){市场增益取用}`（`site/js/game.js:38`），避免读档重复消费市场物品。
- `transition`：`beginFloorTransition` 先置 `G.nextFloor`、切 `'trans'`、再 `saveRun()`（`site/js/game.js:746`），所以存档里带 `{floor:nextFloor, curseDone}`（`site/js/game.js:288`）；`resumeRun` 读到就恢复转场态并**立刻再存一次**（`site/js/game.js:345`）。
- `clearSave()` 在 BOSS_TEST 下是空操作（`site/js/game.js:322`）；死亡、通关、主动结束无尽都会清档（`site/js/game.js:110,413,745`）。
- `markAssisted()`：辅助瞄准一旦用过，把 `assisted` 直接写回**当前 rid** 的存档（`site/js/game.js:323`），但**不取消资格**（`site/js/achieve.js:114` 注释明说），只让分数乘 0.85（`site/js/net.js:82`）。

### 5.4 读档会不会重置分数项？（结论：不会，是"恢复"，而且恢复后本局继续累加）

| 分数项 | 读档动作 | 行号 |
|---|---|---|
| `runT` | `G.runT = s.runT || 0`，之后 `G.runT += rdt` 继续涨 | `site/js/game.js:335`、`:602` |
| `kills` | `G.kills = s.kills || 0` | `site/js/game.js:335` |
| `hits` | `G.hits = s.hits || 0`，只增不减（`hurtPlayer` 里 `+1`） | `site/js/game.js:335`、`:99` |
| `comboMax` | `G.comboMax = s.comboMax || 0` | `site/js/game.js:335` |
| `rid` | `G.rid = s.rid || G.rid` | `site/js/game.js:335` |
| `proofGain`/`affGain`/`clearRewarded` | 原样恢复，且 `clearRewarded` 在无尽局被强制为真 | `site/js/game.js:337` |
| `ink`/`curse`/`rerolls`/`powCap` | 原样恢复 | `site/js/game.js:335` |

要点：`hits` 是**只增**计数（`site/js/game.js:99`、`site/js/invade-effects.js:142`），读档只会把它带回存档值，不会清零；而存档值本身来自"进层那一刻"，所以本层内的受击**只要没再进层就不会丢**——这既是设计（防掉档吃亏），也是刷分向的入口（另见 task-5）。

---

## 6. 成就与称号

### 6.1 ACH 全表（25 条，榜位类 top10/3/1 合并成一行展示；`site/js/achieve.js:41-67`）

| id | 名称 | 条件（简） | 火种 | 称号 | 行号 |
|---|---|---|---|---|---|
| `ex_sterile` | 无菌操作 | 探索·经典+：Boss 战全程不掉血/甲 | 2 | `t_sterile` | `:42` |
| `all_bonds` | 患难之交 | 全部伙伴好感满 | 2 | `t_bonds` | `:43` |
| `iv_variety` | 各有所长 | 入侵·经典+：6 种偏好通关 | 3 | `t_variety` | `:44` |
| `iv_mastery` | 没有短板 | 入侵·绝境：全部偏好通关 | 8 | `t_mastery` | `:45` |
| `iv_specialist` | 一技之长 | 入侵·经典+：6 把同名武器 | 2 | `t_specialist` | `:46` |
| `iv_storm` | 风暴中心 | 入侵·困难+：第 20 波零受伤并胜 | 5 | `t_storm` | `:47` |
| `ex_pressure` | 主动加压 | 探索·绝境：≥1 修饰符通关 | 2 | — | `:48` |
| `ex_burden` | 负重前行 | 探索·绝境：≥3 修饰符通关 | 3 | `t_burden` | `:49` |
| `ex_five` | 五重绝境 | 探索·绝境：5 修饰符通关 | 5 | `t_five` | `:50` |
| `ex_first` | 初次突破 | 探索首次通关 | 1 | — | `:51` |
| `ex_despair1` | 穿越绝境 | 探索·绝境首次通关 | 5 | — | `:52` |
| `ex_despair5` | 绝境常客 | 探索·绝境通关 5 次 | — | `t_ex5` | `:53` |
| `ex_score` | 二十万分 | 非无尽探索单局 ≥200000 | — | `t_score` | `:54` |
| `ex_top10/3/1` | 榜上有名/三甲/登顶 | 探索榜 10/3/1 | — | `t_ex10/3/1` | `:55-57` |
| `en_top10/3/1` | 无尽榜 10/3/1 | 无尽榜 | — | `t_en10/3/1` | `:58-60` |
| `iv_first` | 守住了 | 入侵首次通关 | 1 | — | `:61` |
| `iv_despair1` | 绝境防线 | 入侵·绝境首次通关 | 5 | — | `:62` |
| `iv_despair5` | 固若金汤 | 入侵·绝境通关 5 次 | — | `t_iv5` | `:63` |
| `iv_top10/3/1` | 抵抗榜 10/3/1 | 入侵榜 | — | `t_iv10/3/1` | `:64-66` |

- 计数来自 `achData().n`：`exClr/exDes/ivClr/ivDes/ivVariety/ivMastery/fullAff`（`site/js/achieve.js:69-76`）。
- 通关计数只在**首次**加：`gp.clearRuns` 里已有本局 `rid` 就跳过（`site/js/girls.js:79-80,84`）。
- 成就解锁发火种（`site/js/achieve.js:82-83`），并立刻 `gpSave()`。

### 6.2 称号体系 `TITLES`（23 条）

| 稀有度 | 颜色 | 集合 | 行号 |
|---|---|---|---|
| r0 普通 | `TITLE_C[0]` 蓝 | `t_ex10, t_en10, t_iv10, t_sterile, t_bonds, t_variety, t_specialist` | `site/js/achieve.js:16-21,31` |
| r1 稀有 | 橙 | `t_ex5, t_score, t_ex3, t_en3, t_iv5, t_iv3, t_storm, t_burden` | `site/js/achieve.js:15-22` |
| r2 传说 | 红+白描边+扫光 | `t_ex1, t_en1, t_iv1, t_mastery, t_five` | `site/js/achieve.js:16-22,90-94` |
| r3 特殊 | 渐变 | `t_dev`(开发者)、`t_tester`(测试先锋)、`t_traveler`(终末旅行者) | `site/js/achieve.js:26,28-30` |

- **榜位称号**：`RANK_TITLES` 只含 9 个（`t_ex1/3/10, t_en1/3/10, t_iv1/3/10`），只在"当前仍在榜位"时可戴（`site/js/achieve.js:32-33`）。
- **top1/3/10 的解锁**：`achRank(mode,rank)`：`rank<=10→*_top10`、`rank<=3→*_top3`、`rank===1→*_top1`（`site/js/achieve.js:86`）；触发点是上传回包 `up.st==='ok'` 后解析 `up.rank`（`:159`），以及读榜时 `B.me.rank`（`:162`）。
- 由于回包 `rank` 兜底是字符串 `'100+'`（`site/js/net.js:107`），`parseInt('100+')=100` → 不会误解锁（`:159`）。
- **specialTitles**：由服务端 `world.me` 返回，客户端只保留 `TITLES[t].special` 的项（`site/js/achieve.js:34-35`）；`t_traveler` 还会由 limited 本地补进（`site/js/achieve.js:36`、`site/js/limited.js:31`）。
- 称号校验：`achOwnsTitle` 分三支——special 看 `NET.specialTitles`、榜位看 `NET.rankTitles`、其余看 `ACH.done`（`site/js/achieve.js:79`）；戴着的称号若已失去会在 `achData()` 里被清空（`:77`）。

### 6.3 `achRunEligible()` 的排除条件

`G && G.p && G.p.alive && !G.preview && !(window.BOSS_TEST && BOSS_TEST.on) && !(typeof TST !== 'undefined' && TST.god)`（`site/js/achieve.js:115`）。

- 即排除：已死、图鉴预览（`G.preview`）、BOSS_TEST、测试面板无敌（`TST.god`，定义在 `site/js/testmode.js:4`）。
- **辅助瞄准不在排除项**（`site/js/achieve.js:114` 注释），只影响分数乘子。
- 失效时会把进行中的 Boss 无菌战与第 20 波零伤战标 `invalid`（`site/js/achieve.js:160`），且第 20 波进入瞬间就先快照合法性（`:152`）。

---

## 7. 每日任务 / 世界事件 / 公告 / 好感

### 7.1 `daily.js` — 每日任务（不是每日种子）

- 状态在 `gp.daily = {day,x,i}`，日界由 `evDay(evNow())` 决定（GMT+8 的 0 点，`site/js/event.js:14`）；跨日自动重置（`site/js/daily.js:15-16`）。
- 两个任务固定：`x`=通关突入探索，`i`=通关入侵抵抗；奖励 3 火种（`site/js/daily.js:7,14`）。
- 状态机 `''→'acc'→'done'→'got'`：接取写 `acc`（`:17`），结算置 `done`（`:21-22`），领奖写 `got` 并 `gp.proofs += 3`（`:18`）。
- 完成判定挂在 `evContribute` 上：`invade` 只看 `R.win`，探索看 `R.win || R.endless`（`site/js/daily.js:21`）；BOSS_TEST 不计（`:21`）。
- 剩余时间用 `(dyToday()+1)*86400e3 - 8*3600e3`（`site/js/daily.js:26`）。

### 7.2 `event.js` — 世界事件

- 当前事件 `EVC={id:'ev3', goal:500, goalX:500, goalI:0, reward:30, unlock:'arsenal'}`，截止 `Date.UTC(2026,9,31,15,59,59,999)` = 2026-10-31 23:59:59.999 GMT+8，即 `evOpen()` 在 11-01 00:00 前为真（`site/js/event.js:9,15`）。
- 计入条件 `evKind`：非入侵、难度=绝境、`win||endless`、且带 ≥1 修饰符（`site/js/event.js:24`）。
- 时钟用服务端：`evNow()=Date.now()+EV.skew`（`site/js/event.js:13`），状态轮询 60s（事件页 20s）（`:48,51`）。
- 三人成团都归零：`evDone()` 要求 x 与 i 同时达标（`site/js/event.js:19`）；`goalI=0` 时只显示 x 一条（`:18`）。
- 上报同样"先入队再上传"，键 `achroma_evpend`（`site/js/event.js:54-56`），抵赖失败 60s 重试（`:73`）。
- 发奖有 receipt 幂等：先落盘 token 再请求（`site/js/event.js:85-87`），成功后写 `gp.ev[id]` 与 `gp.unlocks.arsenal`（`:90-91`）。
- 探索通关与入侵通关都从这里记账（`site/js/event.js:77`、`site/js/achieve.js:239`）。

### 7.3 `follow.js` — 通知 / 公告

- 主菜单公告面板 `ANN`，文档 `ANN_DOC`（含"实验血清Ω调整""Overclock! 改为黑市 10 火种"两条）（`site/js/follow.js:237-241`）。
- 公告赠礼 `ANN_GIFT={id:'v127',n:20,on:false}`，**已关闭**；关闭公告时发放（`site/js/follow.js:228,233-235,259-260`）。
- 公告 id `n147`：换 id 就会对"选择不再看"的玩家重新弹一次（`site/js/follow.js:229`）。
- 播报另有 `fl_introT`（电台支援接通）与 `NET.toast` 通道（`site/js/follow.js:19`、`site/js/net.js:5`）。

### 7.4 `girls.js` — 好感度

- 上限与步长：`AFF_MAX=100`、`AFF_MEET=10`、`AFF_CLEAR=30`、`LV_MAX=10`（`site/js/girls.js:4`）；**`AFF_CLEAR` 在本仓库无任何读取点**（grep 仅命中定义行），属遗留常量（未证实是否曾用于通关加好感）。
- 加好感：`addAff` 夹到 100（`site/js/girls.js:66`）；营地相遇 +10（`:73`）；使用搭档主动技 +1（`site/js/partners.js:150`）。
- 档位：`affTier` 30/60/100 分四档（`site/js/girls.js:28`）。
- 存档结构 `achroma_girls`：`{v,proofs,bring,girls{met,aff,lv,own,wsel,log,imgs,...},clearRuns,market,ach,daily,ev,gifts,...}`，`v!==1` 时整档丢弃并重建（`site/js/girls.js:35-36`），但会逐字段修补旧档（`:37-60`）；`bring` 被主动置 null 退休（`:43`）。
- 通关发火种公式：`PROOF_BY_DIFF[diff] + runModifierReward()`（`site/js/girls.js:83`），`PROOF_BY_DIFF={easy:3,classic:3,hard:5,nightmare:6,despair:7}`（`:6`）。所以绝境五锁通关 = 7+12 = **19 火种**。

---

## 8. 云存档（读/写）

结论：**全部存档由 dzmm 宿主的 KV 代写，客户端没有任何网络请求或浏览器存储**。

- 存储键 8 个：`achroma_set / achroma_run / achroma_codex / achroma_pending / achroma_girls / achroma_evpend / achroma_ivrun / achroma_ltpend`（`site/js/platform.js:10`）。
- `STORE` 是内存镜像，`getItem` 同步读内存（`site/js/platform.js:15`），`setItem` 标脏并延时回写（`site/js/platform.js:16`）；**立即写**集合 `STORE_NOW` 含 run/girls/pending/evpend/ivrun/ltpend，其余（设置）批量 400ms（`site/js/platform.js:12,16`）。
- 回写走 `dzmm.kv.put(k,v,{flush:true})`，多条时用 `batchPut`（`site/js/platform.js:31-32`）；失败保留脏标记并退避重试 2s→30s（`:39`）。
- 离开页面强制 flush：`visibilitychange` + `pagehide`（`site/js/platform.js:45-46`）。
- 读档在**所有游戏脚本之前**完成：`storeLoad` 用 `batchGet(STORE_KEYS)`，缺键即抛错（`site/js/platform.js:61-68`）；读失败**不进入游戏**而是弹重试按钮，避免空档覆盖真实进度（`site/js/platform.js:71-80`）。
- 宿主"重置/删除存档"通过 `dzmm.save.onAction` 处理，先锁写、等飞行中的写入结束，再删全部 8 键（`site/js/platform.js:135-145`）。
- 非 DZMM 环境：`STORE` 只在内存里，`later()` 直接清脏队列，**不持久化**（`site/js/platform.js:18`），且 `localUnlockAll()` 会解锁全内容（`site/js/game.js:740`、`site/js/girls.js:70-71`）。
- 入侵抵抗有**独立存档** `achroma_ivrun`：每个商店打开时快照（`site/js/invade-extras.js:44`），字段 `IV_SAVE_KEYS` 18 项 + `{v,at,rid,diff,ink,kills,runT,iv}`（`:5,11`）；读档校验 wave 1..19、偏好、武器 ≤6（`:14-16`），条目/事件/消耗品全部白名单化（`:21-34`）；`ivBegin` 非恢复态会清档（`:46`）。

---

## 9. 未证实 / 需服务端确认

1. 服务端是否按同一套公式计分：客户端注释要求"keep in sync with functions/board.js / server/ach-api.mjs"（`site/js/net.js:73`、`site/js/achieve.js:165`），但**服务端无源码，未验证**。
2. `limitedSubmit` 是否接受"最后一层转无尽"路径的上报（代码可走通，见 §4）——**服务端未验证**。
3. `'ie'`（入侵无尽）榜单在服务端的分桶行为——客户端只传 key（`site/js/screens.js:131`），**服务端未验证**。
4. `EV.d.mine` 的服务端去重语义（客户端靠 `r.dup` 判断，`site/js/event.js:68`）——**未证实**。
5. `AFF_CLEAR=30` 是否为已废弃的通关好感步长（`site/js/girls.js:4` 定义后无读取点）——**未证实**。
6. hard/nightmare 文案"零件获取 -40%/-50%"是否就等价于 `ink .6/.5`（`site/js/difficulty.js:17,22` vs `site/js/game.js:91`）——**未证实**（无字段直接绑定）。
7. `STORE` 的 `encoded()` 会把非字符串值 `JSON.stringify` 后落盘（`site/js/platform.js:63`），实际 KV 中 `achroma_run` 的存储形态是字符串还是对象——取决于宿主，**未验证**。

---

## 10. 自查

- 全部 `file:line` 均由 `sed -n '<line>p'` 逐条回读核对（抽样 ≥12 条，实际全量核对约 150 条）。
- 未修改 `site/js/**`、`[TheSeed]/**`；本文件为唯一产出。
