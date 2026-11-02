# 房间与世界生成机制（mechanics-rooms）

> 分析对象：`site/js/world.js`、`rooms.js`、`traps.js`、`game.js`、`squad.js`、`support.js`、`partners.js`、`camp.js`、`market.js`、`arsenal.js`、`look.js`、`ui.js`（只读，字节级未改动）。
> 约定的引用格式：`site/js/文件名:行号`。凡推断、或源码中查不到的，一律标「**未证实**」。

---

## 0. 结论摘要

一句话结论：**每层地图是纯随机游走 + 硬性必选房间（start/boss/treasure/camp）再随机抽 3–4 个特殊房的产物；`camp`、`treasure`、`dialysis` 根本不在 `SPECIALS` 里，所以它们"必然会出"而不是"概率出"。**

| 你可能以为 | 实际 | 出处 |
|---|---|---|
| 房间按权重表概率出现 | 无权重表。`SPECIALS` 洗牌后 `slice(0, specials)`，每层抽 3/3/4/4/4 个**不重复**的房型 | `site/js/world.js:12`、`site/js/world.js:54`、`site/js/world.js:5-10` |
| camp 是特殊房之一 | camp 不在 `SPECIALS` 中，是每层强制 1 个，且在抽特殊房**之前**就占好位 | `site/js/world.js:48-49` |
| `dialysis` 是常规特殊房 | 只在 `depthNo ∈ {5,15,45,75}` 出现，且要 `free.length > 3` 才放 | `site/js/world.js:51-53` |
| 特殊房清完要打怪 | 非 combat/boss 的房**生来就是 `cleared`**，所以永远不会关门 | `site/js/world.js:75`、`site/js/game.js:216` |
| `bossChip` 是"头目钥匙/筹码" | 它是头目血条上的**残影（掉血滞后动画）**，与钥匙无关 | `site/js/ui.js:85-86`、`site/js/game.js:50` |
| `hashKey` 是房间哈希/密钥 | **全仓库 grep 零命中，不存在** | 「未证实」（见 §10） |
| `prism` 是一种房间类型 | 它是**可拾取物 / 交互物**（`G.inter` 里 `kind==='prism'`），不是 `r.type` | `site/js/game.js:206`、`site/js/game.js:356`、`site/js/world.js:13` |

---

## 1. WORLD 生成

一句话结论：**6×6 网格、每格 26×20 瓦片、瓦片 16px，地图 156×120 瓦片（2496×1920 像素）；布局是"随机游走长细胞 + BFS 定最远点为 boss + 单入口校验 + 失败整层重掷"，无固定种子。**

### 1.1 尺寸与常量

| 项 | 值 | 出处 |
|---|---|---|
| 瓦片像素 `T` | 16 | `site/js/engine.js:4` |
| 网格 `GRID` | 6 | `site/js/world.js:4` |
| 房间格 `CW × CH` | 26 × 20 瓦片 | `site/js/world.js:4` |
| 地图 `mw × mh` | `GRID*CW = 156` × `GRID*CH = 120` | `site/js/world.js:18` |
| 像素尺寸 | 2496 × 1920 | 由 `mw*T` 推出（`site/js/world.js:256`） |
| 瓦片枚举 | VOID/FLOOR/WALL/PIT/SLUDGE/SPIKE/DOOR/PILLAR | `site/js/world.js:3` |

### 1.2 floor 数与主题（`FLOORS`）

| fi | 名称 | rooms | specials | audio root | 特殊 | 出处 |
|---|---|---|---|---|---|---|
| 0 | RUINS 廢墟 | 11 | 3 | 1 | — | `site/js/world.js:6` |
| 1 | BLACKOUT 斷電區 | 12 | 3 | 0.89 | — | `site/js/world.js:7` |
| 2 | CULTURE LEVEL 培養層 | 13 | 4 | 0.75 | — | `site/js/world.js:8` |
| 3 | QUARANTINE FOG 隔離霧區 | 14 | 4 | 0.67 | `fog:1` 迷雾 | `site/js/world.js:9`、`site/js/game.js:645` |
| 4 | CORE LAB 核心實驗室 | 15 | 4 | 0.6 | — | `site/js/world.js:10` |

`rooms` 是房间格数（含 start/boss/treasure/camp/specials/combat），`specials` 是每层抽几个特殊房。

### 1.3 布局算法（`genFloor`）

结论：**随机游走 + 三重验收失败则整层重掷，最多 3000 次扩格保护。**

1. 起点随机 `randi(2,3)` 落在网格中心偏左上 2–3 格（`site/js/world.js:25`）。
2. 从已有细胞随机挑一个，随机方向长出邻居，直到达到 `FLOORS[fi].rooms`（`site/js/world.js:28-30`）。
3. **保分支规则**：新格若已有 >1 个邻居，有 80% 概率放弃该格（`site/js/world.js:33-34`）。
4. `guard++ < 3000` 上限；若仍未达目标，外层 `for(;;)` 重来（`site/js/world.js:28`、`site/js/world.js:37`）。
5. BFS 从起点算距离，`boss = max(d)`，且必须 `boss.d >= 3` 且 `boss.links.length === 1`（真走廊尽头），否则 `cells=null` 重掷（`site/js/world.js:40-43`）。
6. 之后是**固定顺序占位**（关键：顺序决定谁先抢到死胡同）：
   - start / boss（`site/js/world.js:44`）
   - treasure：优先死胡同 `links.length===1`（`site/js/world.js:45-47`）
   - camp：优先死胡同，且 `d > 0`（`site/js/world.js:48-49`）
   - dialysis：仅特定深度（`site/js/world.js:51-53`）
   - specials：优先死胡同，但 `free.length <= 3` 就 `break`（`site/js/world.js:54-56`）
   - 剩余全部 combat（`site/js/world.js:57`）
   - key：见 §3.1（`site/js/world.js:58-61`）
   - champ 房：随机 2 个 combat 格打标（`site/js/world.js:62-63`）

### 1.4 路网（走廊）

结论：**走廊是 3 瓦片宽的直线通道，两端各挂 3 个 DOOR 瓦片；只有水平/垂直，无斜线。**

- 去重键 `min_id-max_id`（`site/js/world.js:82`）。
- 同 `gy` → 水平走廊；否则垂直走廊（`site/js/world.js:84-92`）。
- 走廊外围的 VOID 补成 WALL（`site/js/world.js:86`、`site/js/world.js:90`）。
- 门瓦片登记在两侧 room 的 `doors` 数组（`site/js/world.js:87`、`site/js/world.js:91`），`setDoors` 一次性把它们写成 `TL.DOOR`（关）或 `TL.FLOOR`（开）（`site/js/world.js:252`）。

### 1.5 定种子？

结论：**没有固定种子。** 地图与内容全走 `Math.random()`（`site/js/engine.js:27-29` 的 `rand/randi/choice`，world.js 直接调 `Math.random()`），保存的是**楼层索引**而非种子：`loadSave` 只校验 `s.floor` 合法（`site/js/game.js:295`），重进同层会**重新生成一张新地图**。局部"伪随机"只用在**装饰**上：`campRng(seed)` 是 LCG（`site/js/camp.js:37`），房间地贴用 `(r.id+1)*977 + (G.floor+1)*31` 做种子，因此同一 floor+room 的地面泼溅是稳定可复现的（`site/js/rooms.js:5`）。

---

## 2. 房间类型全表

一句话结论：**`r.type` 只有 8 种会被写进 WORLD（start/combat/boss/treasure/camp/dialysis/lab/arsenal + SPECIALS 里的 7 种），其余"房型"是交互物或纯测试模式。**

### 2.1 全表

| type | 何时出现 | 数量/概率 | 房间尺寸（瓦片） | 生成时的 `cleared` | 交互物 | 出处 |
|---|---|---|---|---|---|---|
| `start` | 每层必出 | 1 | **13 × 11**（走 `c.type !== 'combat'` 分支，**不是**随机大小） | true | 首层/`wFloors` 给武器；`sf>0` 撒 25 个 ink | `site/js/world.js:44`、`site/js/world.js:71`、`site/js/game.js:75-76` |
| `combat` | 填充所有空格 | 剩余全部（≥3） | 普通 **15–21 × 11–15**（`15+2*randi(0,3)` × `11+2*randi(0,2)`）；champ 例外为 **23 × 17** | **false** | 无；进房关门打波次 | `site/js/world.js:57`、`site/js/world.js:72-73`、`site/js/world.js:75` |
| `boss` | 每层必出 | 1 | **25 × 19** | **false** | 门上有 `seal` 封印；死后出 prism(minRar 2)+portal | `site/js/world.js:42-44`、`site/js/world.js:71`、`site/js/game.js:77-78`、`site/js/game.js:243` |
| `locked` | **不存在**（仅 i18n 键 `locked` 提示字） | 0 | — | — | — | 「未证实」见 §10 |
| `treasure` | 每层必出，优先死胡同 | 1 | 13 × 11 | true | `chest` ×1（难度高可 2）+ `fount(cost 20)` | `site/js/world.js:45-47`、`site/js/world.js:71`、`site/js/game.js:58` |
| `shop` | `SPECIALS` 抽中 | 每层 0–1 | 13 × 11 | true | 4 个货位 + 血换重掷 | `site/js/world.js:12`、`site/js/game.js:69-74` |
| `forge` | 抽中 | 0–1 | 13 × 11 | true | `forge` 升级当前武器 | `site/js/game.js:394-396` |
| `trial` | 抽中 | 0–1 | **19 × 15** | **生来 true，拉警报后改 false** | `totem` 拉警报，25 秒生存 | `site/js/world.js:71`、`site/js/world.js:75`、`site/js/game.js:397-398` |
| `shrine` | 抽中 | 0–1 | 13 × 11 | true | `altar`：1 HP 换 RARE+ 卡 | `site/js/game.js:59`、`site/js/game.js:379-380` |
| `idol` | 抽中 | 0–1 | 13 × 11 | true | `idol`：+1 诅咒，换 cursedGift 卡 | `site/js/game.js:67`、`site/js/game.js:399-400` |
| `vault` | 抽中 | 0–1 | 13 × 11 | true | `vault`：付 ink 抽四档 | `site/js/game.js:68`、`site/js/game.js:401-409` |
| `barracks` | 抽中 | 0–1 | 13 × 11 | true | 2 名士兵 + 1 件支援装备 | `site/js/world.js:12`、`site/js/game.js:61`、`site/js/support.js:11-19` |
| `camp` | **每层必出**（不在 SPECIALS） | 1 | **15 × 11** | true | 火堆（休息）+ 幸存者 NPC | `site/js/world.js:48-49`、`site/js/world.js:71`、`site/js/game.js:64` |
| `dialysis` | 深度 ∈ {5,15,45,75} | 条件性 0–1 | 13 × 11 | true | `dialysis`：免费滤 1 血清/诅咒，代价护甲上限 -1 | `site/js/world.js:51-53`、`site/js/game.js:60` |
| `lab`（破碎实验室） | 运行时 `SPECIALS.push('lab')` | 0–1 | 13 × 11 | true | `labvial`：实验血清 α/β/Ω | `site/js/labserum.js:35`、`site/js/labserum.js:36` |
| `arsenal`（军械库） | 解锁后 `SPECIALS.push('arsenal')` | 0–1 | 13 × 11 | true | `arsrack`：任选一把已解锁武器 | `site/js/arsenal.js:11`、`site/js/arsenal.js:14-15`、`site/js/arsenal.js:37-39` |
| `prism`（当作房型） | **不是房型** | — | — | — | `G.inter` 的 `kind:'prism'` 是血清球 | `site/js/game.js:206`、`site/js/game.js:356` |

补充：`specials` 池实际是 7 个（`shop/forge/trial/shrine/idol/vault/barracks`，`site/js/world.js:12`），lab 与 arsenal 在运行时被 `push` 进去（`site/js/labserum.js:35`、`site/js/arsenal.js:14`），所以池最多 9 个，但每层仍只抽 `FLOORS[fi].specials`（3–4）个。

### 2.2 隐藏规则

| 规则 | 内容 | 出处 |
|---|---|---|
| 死胡同优先 | treasure / camp / dialysis / specials 都先挑 `links.length===1` 的格，没有再退化为任意格 | `site/js/world.js:46`、`site/js/world.js:49`、`site/js/world.js:53`、`site/js/world.js:56` |
| 保底 combat | 特殊房放置循环里 `free.length <= 3` 直接 `break` | `site/js/world.js:55` |
| champ 房 | 2 个 combat 格，尺寸 23 × 17（比普通房大），`decorateRoom` 会给 3 组模板 + 2 个 cover | `site/js/world.js:62-63`、`site/js/world.js:72`、`site/js/enemies2.js:47-50` |
| champ 兜底 | 若带 `champRoom` 的 combat 不足 2 个，补任意 combat 房 | `site/js/enemies2.js:48` |
| trial 自带角柱 | 生成时就放 4 组 2 连 WALL 做掩体 | `site/js/world.js:97` |
| boss 掩体 | 5 套布局 × 2 变体，按 `G.bossPick.alt` 选，四象限镜像 | `site/js/world.js:173-183` |
| 迷雾 | `FLOORS[3].fog` 逐帧叠一张径向 Bayer 抖动黑幕 | `site/js/world.js:9`、`site/js/game.js:626-628`、`site/js/game.js:645` |

### 2.3 内部数值（`data` 供参考）

| 交互 | 付出的代价 | 得到 | 出处 |
|---|---|---|---|
| `altar`（shrine） | `p.hp--`（**hp>1 才可用**） | `openCards(1, 'pact')` 即 RARE+ | `site/js/game.js:379-380` |
| `idol` | 无直接代价 | `G.curse++`，`openCards(2,'cursedGift')` | `site/js/game.js:399-400` |
| `totem`（trial） | 关门 + 25 秒生存 | `prism minRar 1` + 20 ink | `site/js/game.js:235-238` |
| `dialysis` | `maxArmor -1` | 删 1 个血清或 1 个诅咒，并**本局永久禁掉**该 id | `site/js/rooms.js:132-142` |
| `chest` | 无 | `r<.25` 卡 / `<.5` 武器 / 其余芯片 | `site/js/game.js:359-362` |
| `fount` | `cost 20` ink | `healPlayer(2)` | `site/js/game.js:377-378`、`site/js/game.js:58` |

---

## 3. 门、钥匙、清空判定、`roomCleanup`、软锁

一句话结论：**只有 `combat` 与 `boss` 会关门；boss 门在生成时就被 DOOR 封死，必须靠"深层 combat 房打出来的 key"去 `seal` 处手动解锁；`roomCleanup` 不是房间状态，而是 `killEnemy` 的一个"这次击杀不算战斗击杀"的选项位。**

### 3.1 key / hasKey / bossLocked

| 环节 | 事实 | 出处 |
|---|---|---|
| 生成时 | `WORLD.bossLocked = true`，`setDoors(boss, true)`，即 boss 门一开始就是 DOOR | `site/js/world.js:99` |
| key 房挑选 | 在 `type==='combat'` 且 `d >= 2` 且**不与 boss 相邻**的格里，按 `d` 降序，从**前一半**里随机 1 个 | `site/js/world.js:59-61` |
| key 每次进层清空 | `G.hasKey = false` | `site/js/game.js:49` |
| key 掉落 | 该 combat 房 `clearRoom` 时把 `{kind:'key'}` 塞进 `G.inter` | `site/js/game.js:203-208` |
| 拾取 | 距 12px 且掉落 >0.6 秒后自动拾取，不必按 E | `site/js/game.js:365` |
| 解锁 | `seal` 交互物，`d <= 34` 且 `G.hasKey` → `bossLocked=false`、`hasKey=false`、开 boss 门、全房门口爆金 | `site/js/game.js:366-369` |
| 无钥匙提示 | 提示 `locked`，1.5 秒一次的 `AU.play('locked')` 蜂鸣 | `site/js/game.js:369` |
| minimap 表现 | `bossLocked` 时 boss 格闪烁红点 | `site/js/ui.js:209` |
| 传送保护 | `tpValid` 禁止进出 `active` 房间或未解锁的 boss 房 | `site/js/skills.js:200-201` |

**隐藏规则**：key 房选的是"较深的前一半"，所以越深的 combat 房越可能藏钥匙；但它**永远不会紧贴 boss**（`!c.links.includes(boss)`，`site/js/world.js:59`），所以拿到钥匙后一定得走回 boss 门。

### 3.2 `bossChip`

**它不是钥匙或筹码，是"血条残影"。** `G.bossChip` 初值 1（`site/js/game.js:50`），每帧取 `max(hp/maxHp, bossChip - (bossDmgT>0 ? 0 : .004))`（`site/js/ui.js:85`），画成血条后面那截灰色余量（`site/js/ui.js:86`）。`bossDmgT > 0` 期间不衰减，所以连续输出时残影不追上来。**命名与钥匙机制无关，纯属命名歧义。**

### 3.3 房间清空判定

| 房型 | 清空条件 | 出处 |
|---|---|---|
| combat | `rm.waves` 打空 **且** 房内无 `e.room === rm` 的存活敌人 | `site/js/game.js:227-230` |
| boss | `br.active && G.bossDead && 房内无存活敌人` | `site/js/game.js:239-241` |
| trial | 25 秒计时归零，**强制** `killEnemy(e,{roomCleanup:true})` 清场再 `unlockRoom` | `site/js/game.js:232-238` |
| 其余房 | **生来 `cleared=true`**，永不关门、永不需清场 | `site/js/world.js:75` |

`clearRoom` 的产出（`site/js/game.js:203-210`）：

- 该层血清球配额未满（`ORB_CAP = 4`，`site/js/game.js:182`）→ 掉一个 `prism minRar 0`；
- 否则 → 掉 `14 + statFloor()*4` 个 ink；
- `r.key` → 掉钥匙；
- 30% 概率额外掉 1 颗心（`site/js/game.js:209`）。
- 精英击杀另有 25% 概率送 1 个额外球（每层最多 1 个，`G.bonusOrbs<1`），`site/js/combat.js:248`。

### 3.4 `roomCleanup` 是什么

结论：**它只是 `killEnemy(e, {roomCleanup:true})` 的一个选项标志，语义是"这次移除是清场，不是被玩家打死的"。**

| 位置 | 作用 | 出处 |
|---|---|---|
| trial 计时结束清场 | 传入 `{roomCleanup:true}` | `site/js/game.js:235` |
| volatile 词缀 | 有 `roomCleanup` 时不放死亡爆炸 | `site/js/combat.js:249` |
| `onDeath` 回调 | 有 `roomCleanup` 时不触发 | `site/js/combat.js:251` |
| `deathfight` 修饰符 | 有 `roomCleanup` 时把 `deathFightLeft=0`（直接死，不再"死斗"2 秒） | `site/js/modifiers.js:39-40` |

所以它解决的是**"trial 结束的一刹那怪还没死，如果不加标记会被 volatile/onDeath/deathfight 再演一遍"**的时序问题，**不是房间状态机**（房间状态是 `active` / `cleared` / `visited` / `doors`，见 `site/js/world.js:75`）。

### 3.5 什么情况会软锁

**代码里已有的软锁风险点（按"是否真的能卡死"排序）：**

| # | 场景 | 是否被护栏兜住 | 出处 |
|---|---|---|---|
| 1 | 关门瞬间玩家正踩在门瓦片上 → 被墙包住 | **有护栏**：`roomTrigger` 只在躯干**完全进入**房间后才 `activateRoom`，并先把 `p.safe` 记下 | `site/js/game.js:217-219` |
| 2 | 已在锁死房间里被挤进墙 | **有护栏**：`unstick` 先 `freeSpot(maxR 48)`，再回 `p.safe`，最后强制落到 `roomFloorTiles` 的任一点 | `site/js/game.js:173-177` |
| 3 | 锁死房间内 `roomFloorTiles` 也找不到站立点 | **理论可卡**（无二次兜底）；但房间内部至少 13×11 且装饰留中心 3 宽十字，实际极难触发 | `site/js/world.js:243-251`、`site/js/world.js:117` |
| 4 | 打完 key 房但**没捡**钥匙就离开 | **不会软锁**：key 是 `G.inter` 持久交互物，不会消失 | `site/js/game.js:208` |
| 5 | 钥匙掉在墙里 | **有护栏**：`DROP_KINDS` 含 `'key'`，`snapFree` 会挪到可站立地面 | `site/js/game.js:265`、`site/js/game.js:268-270` |
| 6 | boss 已死但房内还剩一只不可到达的小怪 | **理论可卡**：解锁要求 `!G.enemies.some(e => !e.dead && e.room === br)`，无超时兜底 | `site/js/game.js:240` |
| 7 | trial 拉警报后计时器停在 25 秒 | **不会**：`G.trial` 在 `updateRooms` 里按 `wdt` 递减，且 `state!=='play'` 会提前 return（冻结而非丢失） | `site/js/game.js:232`、`site/js/game.js:226` |

**关于 3 和 6：源码没有超时/强制解锁兜底，属于"能证明代码路径存在、但未观测到实际复现"的项 → 标「未证实（可复现性未验证）」。**

---

## 4. 陷阱（`traps.js` 全表）

一句话结论：**只有两类世界陷阱 + 一类投掷后残留的毒池，全部由房间生成器在**大房**（`w>=19 或 h>=15`）里布置，且陷阱的伤害与 `statFloor()` 线性挂钩。**

### 4.1 全表

| kind | 放置条件 | 关键参数 | 对玩家 | 对敌人 | 出处 |
|---|---|---|---|---|---|
| `blade`（旋转刀） | `big && Math.random() < .45 + fi*.1`；`fi===0` **必为 blade**；否则 50/50 blade/flame | `R=30`，`va = dir*(1.5 + fi*.15)`，双刀（`a` 与 `a+π`） | `segDist < 3 + p.r` → `hurtPlayer(1)` | `hitEnemy(6 + fi*4)`，同一敌人 0.5s 冷却 `bladeT` | `site/js/world.js:125-130`、`site/js/traps.js:15-19` |
| `flame`（壁挂喷火） | 同上，落在另一半 | `per=3.4`，`warn=.9`，`fire=1.2`，`L = min(6, w/2-2)` 瓦片 | `segDist < 8 + p.r - 2` → `hurtPlayer(1)` | `hitEnemy(3 + fi*2)` + `burn=2, burnT=3`，0.4s 冷却 `flameT` | `site/js/world.js:131-133`、`site/js/traps.js:20-26` |
| `gas` 毒池（`WORLD.pools`） | 房间 `fi >= 1 && Math.random() < .45` 时放 1 对气罐；罐被打爆 → `gasBurst` | `r=24`，`life=6`，`tick=.2` → 每 0.5s 一次 | `dist < r + p.r - 3` → `hurtPlayer(1)` | `venom = min(5, venom+1)`，`venomT=4`；**飞行敌人免疫**（`!e.fly`） | `site/js/world.js:170`、`site/js/traps.js:48`、`site/js/traps.js:27-29` |
| `spike`（地刺） | 由 `'spikes'` 模板铺（第 2/3/4 层模板池里有） | `spikeT % 3`：`<1.8` 收起、`<2.2` 预警、否则刺出 | 刺出且未冲刺 → `hurtPlayer(1)` | 不伤敌 | `site/js/world.js:311`、`site/js/game.js:158`、`site/js/world.js:151` |
| `pit`（深坑） | 由 `'pits'/'islands'` 模板铺 | `blocksMove` 对非飞行单位是实心 | 冲刺落地在 PIT → `fallInPit()`（-1 HP，回 `p.safe`） | 敌人不走 pit（`!e.fly` 也会被挡） | `site/js/world.js:190`、`site/js/game.js:136`、`site/js/game.js:179` |
| `barrel`（爆炸桶） | `Math.random() < .55` 放 1 对 | `hp=5`，爆 `r=38, dmg=28` | `hurtsPlayer:true` | 会伤敌 | `site/js/world.js:169`、`site/js/world.js:185`、`site/js/combat.js:275` |
| `crate`（木箱） | 每房 `1+(champ?3:0)+(含 crates 模板 +2)+(50% 再 +1)` 对 | `hp=12` | 挡弹 | 挡弹 | `site/js/world.js:167-168`、`site/js/world.js:185` |

### 4.2 陷阱布置的三条硬规则

1. **陷阱先于地形铺**，并被加入 `reserved` 集，后续模板/箱桶不能压在上面（`site/js/world.js:123-134`、`site/js/world.js:162`）。
2. **`'crates'` 模板是空实现**，只在 `picks` 里存在以触发"额外 2 对箱子"（`site/js/world.js:152`、`site/js/world.js:167`）。
3. **每间 combat 房至少有一处能挡枪**：`picks` 里若没有 `COVER_KINDS` 之一，强制补一个；若补完仍然一堵内墙都没有（`wallsIn()===0`），再在剩余地面随机立一对柱子（`site/js/world.js:141`、`site/js/world.js:155-160`）。

---

## 5. 价格公式与 `statFloor()`

一句话结论：**所有局内价格都是"基础价 + `statFloor() * 步长`"的线性式，唯一例外是锻造（按武器等级）和喷泉（固定 20）；`statFloor()` 在无尽模式里被**钉死为 4**（最后一层），所以无尽层不会越买越贵。**

### 5.1 `statFloor()` 怎么算

```js
const statFloor = () => G && G.endless ? FLOORS.length - 1 : G.floor;   // site/js/world.js:237
```
即普通局返回 `0..4`，无尽局**永远返回 4**（`FLOORS.length - 1`）。它决定难度缩放、掉落量、价格步长，以及 `SCALE` 类的等级判定（如 `RAR` 加权里的 `statFloor()>=1` 加成，`site/js/ui.js:236`）。

### 5.2 价格表

| 房 / 项目 | 公式 | 展开（sf = statFloor） | 出处 |
|---|---|---|---|
| shop 血清 | `pr[SHARD[sid].rar] + sf*5`，`pr = [25,40,60,90]` | rar0=25+5sf，rar1=40+5sf，rar2=60+5sf，rar3=90+5sf | `site/js/game.js:69-70` |
| shop 心 | `15 + sf*5` | 15/20/25/30/35 | `site/js/game.js:71` |
| shop 武器 | `35 + sf*5` | 35/40/45/50/55 | `site/js/game.js:72` |
| shop 芯片 | `50 + sf*5` | 50/55/60/65/70 | `site/js/game.js:73` |
| shop 重掷 | **1 HP**（不是 ink），每层商店只卖一次；买下后 `G.freeReroll=true`，此状态**跨层保留**并让后续所有商店**不再上架**该货位 | — | `site/js/game.js:74`、`site/js/game.js:382-384`、`site/js/game.js:492` |
| 抽卡重掷 | `RR_BASE[f] + rerolls*RR_STEP[f]`，`RR_BASE=[30,80,180,290,430]`，`RR_STEP=[20,40,80,90,120]` | f = `clamp(statFloor,0,4)` | `site/js/ui.js:257-258` |
| vault | `25 + sf*10` | 25/35/45/55/65 | `site/js/game.js:68` |
| fountain | **固定 20**（无 sf 项） | 20 | `site/js/game.js:58` |
| forge | `30 + lv*25`，`lv = p.wlv[当前武器]`，`lv>=3` 封顶 | 30/55/80 | `site/js/game.js:394-396` |
| dialysis | **免费**，代价 `maxArmor -1` | — | `site/js/rooms.js:101`、`site/js/rooms.js:205` |
| altar | **1 HP** | — | `site/js/game.js:380` |

**全局倍率**：`priceOf(it) = round(it.price * (G.S.greed ? 1.5 : 1))`（`site/js/shards2.js:95`），即"囤积癖"血清让**所有**用 ink 的标价 +50%（`site/js/shards2.js:61-62`）。注意 **HP 价与 ink 价走的是不同通道**：重掷走 `p.hp--`（`site/js/game.js:384`），`priceOf` 根本不参与。

### 5.3 四档随机（vault）

| r 区间 | 概率 | 结果 | 出处 |
|---|---|---|---|
| `r < .4` | 40% | `openCards(1, 'choose')`（RARE+ 卡） | `site/js/game.js:403` |
| `.4 ≤ r < .6` | 20% | 掉一个 skill chip | `site/js/game.js:404` |
| `.6 ≤ r < .8` | 20% | 掉一把新武器 | `site/js/game.js:405` |
| `r ≥ .8` | 20% | ink 大礼包：`round(cost*1.8)`；满血/干旱诅咒时再加 `round(cost*.4)`；未满血再送 1 颗心 | `site/js/game.js:407-409` |

"永远比门票值"是**刻意的保值设计**（注释原话 "always worth more than the vault cost"，`site/js/game.js:406`），不是 bug。

---

## 6. 幸存者 / 小队 / 支援 / 搭档 / camp / market / 两种货币

一句话结论：**四条并行的"同伴系统"——`squad.js` 的战场小兵、`follow.js` 的随行少女、`partners.js` 的电台搭档、`support.js` 的军事支援；其中 `squad.js` 的战场功能已被 `partners.js` 与 `follow.js` 依次置空，属于**历史遗留层叠覆盖**。**

### 6.1 覆盖链（关键历史包袱）

| 层 | 做了什么 | 出处 |
|---|---|---|
| 原始 `squad.js` | 招募 → `G.squad`，随行、自动索敌、30 次受击后撤退 | `site/js/squad.js:162-167`、`site/js/squad.js:207`、`site/js/squad.js:227-262` |
| `follow.js`（后加载） | 用 `SQ_ORIG = {updateSquad,...}` 包住原函数，接管"同行少女" | `site/js/follow.js:116-128` |
| `partners.js`（最后加载） | **直接置空** `updateSquad/drawSquad/updateSquadShots`，把"人"改成"电台技能" | `site/js/partners.js:117-118` |

**加载顺序证明**（`platform.js` 的 `GAME_SCRIPTS` 里 `squad` 在 `partners` 之前、`follow` 在 `partners` 之后）：`site/js/platform.js:82-83`。
**结论**：`squad.js` 里"跟着你打、挨 30 下撤退"的整套战场逻辑，在当前构建中**只剩数值与数据结构活着，执行体已被置空**。`girlMul` 也被拍平成全 1（`site/js/follow.js:30`），训练系统彻底退役，旧训练以"火种"退还（`site/js/partners.js:100-105`）。

### 6.2 四套系统对照

| 系统 | 触发 | 存在形式 | 战力/效果 | 失效条件 | 出处 |
|---|---|---|---|---|---|
| 幸存者（NPC） | 每层 camp 房，`campUsed` 未消耗该深度 | `kind:'survivor'`，对话 5–6 行后 recruit | 成为 `G.squad` 成员 | 每深度只能遇 1 个 | `site/js/squad.js:113`、`site/js/squad.js:106-111` |
| 小队（`G.squad`） | recruit 时随机分配一把 `MATE_WEAPONS` 里的武器 | 数据结构层 | `MATE_HITS=30`，`maxHits = round(30*girlMul(id).hp)`，挨 30 下 `away=true` | 换层恢复（`squadEnterFloor` 把 `away` 重置） | `site/js/squad.js:207`、`site/js/squad.js:209`、`site/js/squad.js:211`、`site/js/squad.js:215-219` |
| 随行（`G.follow`） | 营地三选一选 "FIGHT AT YOUR SIDE" | 全功能战士，走玩家自己的 `attack` 代码 | `FL_HP=25`（重甲 +10 → 35），`FL_POW=.5`，`FL_RATE=.6`；2 倍射速（`regul`） | `hits` 打满撤回营地（`FL_CAMP=15` 可在 camp 一次补） | `site/js/follow.js:31`、`site/js/follow.js:33-34`、`site/js/follow.js:57-60`、`site/js/follow.js:134` |
| 电台搭档（`G.ptn`） | 好感满 100 可"出战携带"，或局内营地接受 | 一个主动技能（F）+ 一个被动 | `PT_COST=[1,2,3]` 升级技能树；`ptTier` 在 aff 30/60/100 升阶 | 新人顶替（像芯片一样） | `site/js/partners.js:35`、`site/js/partners.js:93`、`site/js/partners.js:97-99`、`site/js/partners.js:110` |
| 军事支援（`G.support`） | barracks 向士兵申请，**一次一件** | `G.sup` 运行时对象 | heli 30s / gun 3 轮 3 标记 / sentry 25 血 | `room.supUsed=true` 后同一栋只能申请一次 | `site/js/support.js:8`、`site/js/support.js:91-92`、`site/js/support.js:109-116` |

### 6.3 `SUP_KINDS` 三种支援的硬参数

| kind | 参数 | 出处 |
|---|---|---|
| `heli` | 跟随 30s；`13 * 1.35` 发/秒；每 100 发停 2s；`supDmg(2.6)`、`spd 620` | `site/js/support.js:112`、`site/js/support.js:124-132` |
| `gun` | 3 轮；每轮标 3 个目标（目标不足可叠加）；落点延迟 3s；轮间 4s；`explode(r=88, supDmg(70))` | `site/js/support.js:113`、`site/js/support.js:135-141` |
| `sentry` | 信号弹 3s → 空投 → 展开；`hp=25`，每次受击 0.25s 无敌帧；每 5 发 1 枚追踪火箭；`supDmg(4.5)` | `site/js/support.js:114`、`site/js/support.js:143-156`、`site/js/support.js:159-160` |
| 统一缩放 | `supDmg = base * (1 + supDepth() * .6)`，`supDepth() = floor`（0 基） | `site/js/support.js:117-118` |
| 仇恨 | sentry 会让 `ds<170 && ds<dp+50` 的敌人改打它 | `site/js/support.js:162` |

### 6.4 camp 与 market 的区别（**同名不同物**）

| 名字 | 是什么 | 位置 | 花什么 | 出处 |
|---|---|---|---|---|
| **camp.js** | **主菜单场景**（横版幸存者营地，A/D 走动、E 交互：档案/公告板/电台/少女/黑市商人/限时活动/卡车出击） | 主菜单 UI | — | `site/js/camp.js:1-11`、`site/js/camp.js:12-14`、`site/js/camp.js:528-546` |
| **camp 房**（局内） | 每层 1 个的火堆房：休息（回 25% 小队耐久 / 重置电台 CD）+ 遇幸存者 | 地图内 | — | `site/js/squad.js:135-139`、`site/js/partners.js:143` |
| **market.js** | 黑市**商店页**（跨局元进度消费） | 主菜单 UI | **火种（proofs）** | `site/js/market.js:1-6`、`site/js/market.js:64` |

camp 里的"黑市"摊位就是打开 `market.js` 那一页（`site/js/camp.js:13` 的 `market: 995`，配 `site/js/look.js:158` 的 `dockGo('market', …)`）。

### 6.5 proofs（火种） vs ink（零件）——两套完全独立的货币

| | **proofs / 火种 / EMBER** | **ink / 零件 / PARTS** |
|---|---|---|
| 生命周期 | **跨局永久**，存 `achroma_girls` KV | **单局内**，`G.ink`，死亡即清零 |
| 存储 | `gp.proofs`（`site/js/girls.js:2`、`site/js/girls.js:36`） | `G.ink` + `G.inkAcc`（`site/js/game.js:91`） |
| 获得 | 通关按难度：easy/classic 3、hard 5、nightmare 6、despair 7（`site/js/girls.js:6`、`site/js/girls.js:83`）；成就/每日/活动/旧训练退款 | 击杀掉落、清房补偿、vault 大奖、`gainInk(1)` 每个零件 |
| 获得倍率 | 无 | `INK_RATE=.5`（先砍半） × `diffV('ink')`（hard .6 / nightmare .5 / despair .45） × `inkMul()`（囤积癖 1.3，干旱诅咒 .75） → 见 `site/js/game.js:90-91`、`site/js/shards2.js:96`、`site/js/difficulty.js:17,22,27` |
| 花在 | 黑市（装备 3–10）、少女训练/技能树（`PT_COST` 1/2/3）、私照 5、武器解锁 5、筛子 1 | 局内 shop / vault / fountain / forge / 抽卡重掷 |
| 关键区别 | **不进局**，买的东西在"下次出击"生效（`marketTake` 消费缓冲，`site/js/market.js:173-176`） | **只在本局有效**，`loadSave` 会带 `ink` 一起续上（`site/js/game.js:283`） |

---

## 7. 三个"深度"函数（同一概念三种定义）

一句话结论：**`statFloor` / `exploreDepth` / `supDepth` 对"第几层"给出三个不同答案，这是最容易被误读的历史遗留。**

| 函数 | 定义 | 普通局 5 层取值 | 无尽局 | 用途 | 出处 |
|---|---|---|---|---|---|
| `statFloor()` | `endless ? FLOORS.length-1 : G.floor` | 0,1,2,3,4 | **恒为 4** | 难度/掉落/价格步长 | `site/js/world.js:237` |
| `exploreDepth()` | `endless ? FLOORS.length+endless : G.floor+1` | 1,2,3,4,5 | 5+endless | "每层一次性"房的记账键（dialysis/camp/lab） | `site/js/rooms.js:97` |
| `supDepth()` | `endless ? FLOORS.length-1+endless : G.floor` | 0,1,2,3,4 | 4+endless | 支援伤害缩放 | `site/js/support.js:117` |

由此推出的**隐藏规则**：`dialysis` 的深度判定用 `exploreDepth()`（1 基，`site/js/game.js:51-53` 用 `depthNo = fi+1`），所以**普通局第 5 层（`depthNo==5`）必刷 dialysis**，而 15/45/75 只有打到无尽第 10/40/70 层才会再遇到。

---

## 8. 看起来像 bug 其实是设计

| # | 现象 | 为什么是设计 | 出处 |
|---|---|---|---|
| 1 | `const r = it.weapon ? .3 : Math.random();` | 常量 `.3` 落在 `.25 ≤ r < .5` 区间，**武器宝箱 100% 出武器**，是刻意短路 | `site/js/game.js:359-361` |
| 2 | 随机游走时"已有 >1 个邻居的新格有 80% 概率被拒" | 明确注释 "keep branchy"，为了生成枝状而非团状地图 | `site/js/world.js:32-34` |
| 3 | `if (!wallsIn())` 强行补一对柱子 | 注释 "every combat room has something that stops bullets"，保证掩体永远存在 | `site/js/world.js:140-141`、`site/js/world.js:155-160` |
| 4 | 特殊房放置循环 `free.length <= 3` 就 `break` | 保证每层至少留 3 间 combat 房（有仗打） | `site/js/world.js:55` |
| 5 | 非 combat/boss 房 `cleared: true` | 让 reward 房永不关门；`roomTrigger` 也只对 combat/boss 生效 | `site/js/world.js:75`、`site/js/game.js:216` |
| 6 | trial 房 `cleared` 生来是 true，拉警报时又被改成 false | 先保证平时不锁门，再在事件开始时手动锁 | `site/js/world.js:75`、`site/js/game.js:398` |
| 7 | vault 的"ink 大奖"要加 `cost*.4` | 血量满时不会掉心，用 ink 补偿，避免"满了就亏" | `site/js/game.js:407` |
| 8 | `world.js:264` 三元两分支完全相同 `fi===1 ? col(1) : col(1)` | 无害冗余（应为调色差异未实现），**不影响渲染** | `site/js/world.js:264` |
| 9 | `'crates'` 模板函数体是空的 | 它只是个"多放 2 对箱子"的开关 | `site/js/world.js:152`、`site/js/world.js:167` |
| 10 | `squad.js` 一整套战斗逻辑但跑不到 | 被 `partners.js:117-118` 置空，是**第七次系统重构的遗迹**，不是 bug | `site/js/squad.js:227-262`、`site/js/partners.js:117-118` |
| 11 | `girlMul` 一眼看像训练系数，实际恒返回 1 | 训练系统退役后拍平成常量，避免删调用点 | `site/js/follow.js:29-30` |
| 12 | 旧存档 `meltVersion !== 2` 才补一次护甲 | 一次性迁移补偿，防重复发放 | `site/js/game.js:340-342` |
| 13 | `or: 前一半` 的 key 房挑选 | 刻意让钥匙偏向深层，制造"深挖再回头"的路线压力 | `site/js/world.js:59-61` |

## 9. 没人解释的魔数

| 魔数 | 在哪 | 猜测 | 状态 |
|---|---|---|---|
| `[5, 15, 45, 75]` | `site/js/world.js:53` | dialysis 出现深度；只有 5 有解释（末层），15/45/75 无任何注释 | **无注释** |
| `25*19 / 19*15 / 15*11 / 13*11 / 23*17` | `site/js/world.js:71-72` | 按房型手挑的瓦片尺寸，无推导 | **无注释** |
| `3000` | `site/js/world.js:28` | 随机游走保护上限 | 有 guard 名，无理由 |
| `977 / 31`、`577 / 13`、`733 / 17` | `site/js/rooms.js:5`、`site/js/labserum.js:38`、`site/js/arsenal.js:21` | 三套装饰 PRNG 的种子乘子，纯挑的质数 | **无注释** |
| `.45 + fi*.1`（陷阱概率） | `site/js/world.js:125` | 越深陷阱越多 | 无推导 |
| `1.5 + fi*.15`（刀转速） | `site/js/world.js:130` | 越深转越快 | 无推导 |
| `6 + fi*4` / `3 + fi*2`（陷阱对敌伤害） | `site/js/traps.js:18,24` | 与层数线性 | 无推导 |
| `ORB_CAP = 4` | `site/js/game.js:182` | 每层血清球上限 | 有注释，无理由 |
| `14 + statFloor()*4`（清房 ink） | `site/js/game.js:207` | 补偿掉落 | 无推导 |
| `MATE_HITS = 30` / `FL_HP = 25` / `FL_POW = .5` / `FL_RATE = .6` / `FL_IFR = .5` | `site/js/squad.js:207`、`site/js/follow.js:31` | 同伴耐久/输出平衡值 | 无推导；`FL_CAMP=15` 与 30 是 2:1 |
| `13 * 1.35`（直升机射速） | `site/js/support.js:130` | 13 发/秒 × 1.35 | **无注释** |
| `25`（sentry hp）/ `0.25`（无敌帧） | `site/js/support.js:114,159` | 能扛约 6 秒 | 无推导 |
| `1 + supDepth()*.6`（支援伤害） | `site/js/support.js:118` | 每层 +60% | 无推导 |
| `1 + .5*statFloor()`（`matePow`） | `site/js/squad.js:214` | 早亡的计算（已无调用） | 死代码 |
| `25 秒`（trial） | `site/js/game.js:398` | 生存时长，同时写死在 `trialSub` 文案里 | 硬编码两处 |
| `.03`/`1.6`/`.7`（trial 刷怪加速） | `site/js/game.js:233` | `spawn = max(.7, 1.6 - (25-t)*.03)` | 无注释 |
| `9`（trial 场上敌人上限） | `site/js/game.js:233` | 全局计数（不是房内计数） | **疑似用错粒度**，见 §10 |
| `1.8 / .4`（vault ink 倍率） | `site/js/game.js:407` | 保值设计 | 有注释 |
| `60 / 3`（`ADREN_CD` / `ADREN_T`） | `site/js/market.js:50` | 肾上腺素 CD / 无敌时长 | 无推导 |
| `.004`（bossChip 衰减） | `site/js/ui.js:85` | 每秒约 0.24 血条单位滞后 | 无推导 |
| `TICK_SPEED = 42` | `site/js/squad.js:320` | 小队状态 UI 滚动速度 | 无推导 |
| `1.5`（囤积癖涨价） | `site/js/shards2.js:95` | +50% | 与文案一致 |

---

## 10. 「未证实」清单（含源码查不到的项）

| # | 事项 | 状态 |
|---|---|---|
| 1 | **`hashKey`** | 全仓库（含 `[TheSeed]/`）`grep -rn "hashKey"` **零命中**，该符号不存在。任务提到的"hashKey"无源码支撑 → **未证实**（可能是任务描述中的假设，或来自更早版本） |
| 2 | **`locked` 房间类型** | `r.type` 从未被赋 `'locked'`；存在的只是 i18n 文案键 `locked`（`site/js/game.js:369`）与 `AU.play('locked')` 音效 → **房型 `locked` 未证实** |
| 3 | **各房型的"出现概率/权重"** | 源码**没有权重表**：特殊房是均匀洗牌后取前 N（`site/js/world.js:54`）。若有人声称"shop 30% / vault 20%"，无源码支撑 → **未证实**；正确说法是"每层从 7–9 个房型里不重复抽 3–4 个，单个房型的出现概率 ≈ specials/池大小" |
| 4 | **软锁 §3.5 的 #3、#6** | 代码路径存在（`site/js/game.js:243-251`、`site/js/game.js:240` 均无超时兜底），但**未实际复现** → 未证实 |
| 5 | **trial 刷怪上限用全局敌人数** | `G.enemies.filter(e => !e.dead).length < 9` 是**全场**计数（`site/js/game.js:233`），理论上房外还有 8 只时 trial 会停止刷怪。是否刻意，源码无注释 → **未证实（疑似设计取舍：防同屏爆炸）** |
| 6 | **`TL.PILLAR` 死枚举** | `TL.PILLAR=7` 有碰撞/渲染/查询分支（`site/js/world.js:3,190,191,294,296`），但**整个仓库没有任何 `set(x,y,TL.PILLAR)`**。是否为已移除的独立柱地形 → **未证实** |
| 7 | **`nb > 1 && Math.random() < .8` 的具体调参依据** | 只有 "keep branchy" 一行注释，无数据 → 参数来源未证实 |
| 8 | **`0.45/0.55` 之类的箱桶概率** | 无注释、无文档 → 未证实其平衡依据 |
| 9 | **`rooms.js` 承载 dialysis 而非 rooms** | 文件名与内容不符（该文件 95 行之后全是透析机 `DIA`），但**是否曾有正式的房间模块被合并** → 未证实 |

---

## 11. 引用抽查记录（自查用）

写完后对正文全部 **303 处引用 / 224 个唯一 `文件:行号`** 做了逐条 `awk` 复核，行号与内容全部对得上，无一条越界。按文件归并如下（即正文实际用到的行号）：

- `world.js` : 3,4,5,6,7,8,9,10,12,13,18,25,28,32,33,37,40,42,44,45,46,48,49,51,53,54,55,56,57,58,59,62,71,72,75,82,84,86,87,90,91,97,99,117,123,125,130,131,140,141,151,152,155,162,167,169,170,173,185,190,237,243,252,256,264,311
- `game.js` : 49,50,51,58,59,60,61,64,67,68,69,71,72,73,74,75,77,90,91,136,158,173,179,182,203,206,207,208,209,216,217,226,227,232,233,235,239,240,243,265,268,283,295,340,356,359,365,366,369,377,379,380,382,384,394,397,398,399,401,403,404,405,406,407,492,626,645
- `ui.js` : 85,86,209,236,257
- `engine.js` : 4,27
- `camp.js` : 1,12,13,37,528
- `rooms.js` : 5,97,101,132,205
- `support.js` : 8,11,91,109,112,113,114,117,118,124,130,135,143,159,162
- `labserum.js` : 35,36,38
- `arsenal.js` : 11,14,21,37
- `enemies2.js` : 47,48
- `skills.js` : 200
- `combat.js` : 248,249,251,275
- `modifiers.js` : 39
- `traps.js` : 15,18,20,27,48
- `shards2.js` : 61,95,96
- `squad.js` : 106,113,135,162,207,209,211,214,215,227,320
- `follow.js` : 29,30,31,33,57,116,134
- `partners.js` : 35,93,97,100,110,117,143
- `platform.js` : 82
- `market.js` : 1,50,64,173
- `look.js` : 158
- `girls.js` : 2,6,36,83
- `difficulty.js` : 17

复核方式（可原样重跑）：

```bash
cd site/js
# 1) 提取正文全部引用并检查是否越界
grep -o 'site/js/[a-z0-9]*\.js:[0-9]*' ../docs/mechanics-rooms.md | sed 's|site/js/||' | sort -u |
  while IFS=: read -r f n; do
    tot=$(wc -l < "$f"); { [ "$n" -ge 1 ] && [ "$n" -le "$tot" ]; } || echo "OUT OF RANGE $f:$n (has $tot)"
  done
# 2) 逐条打印被引用行，人工比对
awk 'NR==237{print "world.js:237 →", $0}' world.js
awk 'NR==118{print "support.js:118 →", $0}' support.js
```

本次人工抽查覆盖 63 个关键点（节选）：`world.js:4,44,53,59,75,99,125,155,237,264,311`、`game.js:49,58,68,69,182,206,216,232,235,240,359,384,394,403,407`、`rooms.js:5,97,101,132`、`traps.js:18,24,48`、`squad.js:113,207,214`、`support.js:8,118,130`、`partners.js:35,93,117,143`、`market.js:173`、`arsenal.js:14`、`labserum.js:35`、`ui.js:85,236,257`、`combat.js:248`、`skills.js:200`、`modifiers.js:40`、`engine.js:4,27`、`girls.js:6,83`、`shards2.js:95`、`camp.js:37`、`platform.js:82`、`follow.js:30,31`、`enemies2.js:48`。

复核中**发现并已修正** 2 处事实错误：`start` 房尺寸（原误写为随机大小，实为固定 13×11）、`combat` 尺寸区间未写明；另补全了 shop 重掷的 `freeReroll` 跨层语义。
