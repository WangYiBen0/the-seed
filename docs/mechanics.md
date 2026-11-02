# 原版机制总账 —— 索引

> 目标：把原版（上游 `site/js/**`，字节级不可动）里所有**神秘未解释机制**与
> **历史遗留包袱**找齐、说清、留证。每条结论都带 `文件:行号`，能追到源码。
>
> 用户 2026-11-02 提的要求，登记在 `TASKS.md`。分册：

| 分册 | 管什么 |
|---|---|
| [`mechanics-rooms.md`](mechanics-rooms.md) | 世界生成、房间类型、门/钥匙/锁、特殊房、幸存者/小队、货币 |
| [`mechanics-combat.md`](mechanics-combat.md) | 伤害管线、**色彩机制**、血清/协同/诅咒、武器、ink 经济 |
| [`mechanics-modes.md`](mechanics-modes.md) | 三模式、难度表、绝境五锁、存档、成就称号、云存档 |
| [`mechanics-legacy.md`](mechanics-legacy.md) | 命名三重身份、版本迁移、死代码、魔数、i18n 包袱 |
| [`score-farm.md`](score-farm.md) | 刷分 bug 专项（官方榜单前五用的那个） |

---

## 0. 先看这三条结论

1. **这游戏的身份是三重叠加的**。代码里叫 `ACHROMA`（29 个文件头注释 `===== ACHROMA …`），
   线上产品叫 `TheSeed`/`[TheSeed]`，而网络层叫 `EMBER`（`site/js/net.js:1`）。
   三套命名同时存在于同一份源码，是最大的历史包袱。
2. **色彩不是美术，是进度条**。世界默认只有 6 级灰阶（`site/js/engine.js:75`），
   颜色**由你拿到的血清点亮**（`computeTints` / `buildTint`，`site/js/weapons.js:93-95`）。
   营地场景更进一步：只有 18 个白名单色（`CACC`）能不被转成灰（`site/js/camp.js:38`）。
3. **计分是纯客户端可算的**，服务端有一份镜像实现（注释原话
   "keep in sync with server/ach-api.mjs" / "functions/board.js"），
   见 `site/js/net.js:73-95`。**具体刷分路径见 [`score-farm.md`](score-farm.md)。**

---

## 1. 数据总表（本仓库实测计数）

| 内容 | 数量 | 出处 |
|---|---|---|
| 上游脚本 | 77 个 `.js` | `site/js/FILES.txt` |
| 血清 / 强化（SHARD） | **64** | `combat.js` 40 + `shards2.js` 15 + `shards3.js` 5 + `shards4.js` 4 |
| 协同（SYNERGIES） | **40** | `combat.js:59` 20 + `shards2.js` 的 `SYN2` 15 + `shards3.js` 的 `SYN3` 5（push 见 `shards2.js:90`、`shards3.js:30`） |
| 诅咒（CURSES） | **16** | `shards2.js:171` 13 条 + `curses2.js:8` push 3 条 |
| 武器 | **69**（37 + 12 + 20，三文件 `Object.assign` 合并；其中 22 把是首层基础池 `BASIC_WEAPONS`） | `weapons.js:3` / `weapons2.js:3` / `weapons3.js:6` / `game.js` 的 `BASIC_WEAPONS` |
| 楼层 | 5 | `site/js/world.js:5-11` |
| 难度 | 5（含绝境） | `site/js/difficulty.js:3-17` |
| 绝境修饰符（五锁） | 5 | `site/js/modifiers.js:4-8` |
| 语言 | 4（en / zh(繁) / ja / zhs(简)） | `site/js/i18n.js` |
| 特殊房种类 | 11 + boss/start/combat | `site/js/world.js:12` 的 `SPECIALS` 7 种 + 固定分配的 4 种 |

> 计数方法：脚本按 `[` `]` 配平截取数组字面量后数 `{ id: '` 出现次数，**再补上后续文件的 push**。
> `SHARD` 是 `SHARDS`+`SHARDS2`+`SHARDS3`+`SHARDS4` 依次 push 合并
> （`shards2.js:72`、`shards3.js:22`、`shards4.js:23`）；`SYNERGIES` 同样在
> `shards2.js:90`、`shards3.js:30` 被追加；`CURSES` 在 `curses2.js:8` 被追加。
>
> **踩过的坑**：只数 `combat.js:59` 的 `const SYNERGIES = [` 会得出 20，
> 只数 `shards2.js:171` 的 `const CURSES = [` 会得出 13 —— 两者都漏掉了后续 push。
> 正确值是 **40 协同 / 16 诅咒**。

---

## 2. 色彩机制（用户点名的那一项）

### 2.1 灰阶世界

```js
// site/js/engine.js:75
const PAL = ['#0a0908', '#1d1a17', '#2d2925', '#4c463f', '#8e877b', '#e8e1d3'];
```

只有 6 个灰阶位。`col(i)` 就是 `PAL[i]`（`engine.js:81`），所以全世界的地板、墙、
敌人、UI 底色都从这 6 个值里取。

### 2.2 每层给灰上一点色

`FLOOR_PAL`（`engine.js:76-79`）为 5 层各准备一套 6 色灰阶，注释原文说明了意图：

> every floor tints the gray a little: ash (ruins), cold steel (blackout),
> sick olive (culture), pale fog (quarantine), dried blood (core lab)

| 层 | 名 | 色调 |
|---|---|---|
| 1 | RUINS 废墟 | 中性灰（默认） |
| 2 | BLACKOUT 断电区 | 冷钢蓝 |
| 3 | CULTURE LEVEL 培养层 | 病态橄榄绿 |
| 4 | QUARANTINE FOG 隔离雾区 | 苍白雾灰 |
| 5 | CORE LAB 核心实验室 | 干血红 |

`setFloorPal(fi)` 进入楼层时替换 `PAL`（`engine.js:80`）。

### 2.3 颜色是挣来的（核心）

```js
// site/js/weapons.js:93-95
function buildTint() { const t = G.tints; return t.length ? t[((G.time * 10) | 0) % t.length] : col(5); }
function computeTints() { const s = G.p.shards, t = [];
  if (s.ember || s.prism) t.push(C.red); if (s.arc || s.prism || s.stat) t.push(C.cyan);
  if (s.rime || s.prism) t.push(C.frost); if (s.venom || s.prism) t.push(C.lime);
  if (s.keen) t.push(C.gold); if (s.echo || s.after) t.push(C.violet);
  if (s.vortex) t.push(C.indigo); if (s.bloom || s.fury) t.push(C.orange);
  if (s.leech) t.push(C.green); G.tints = t; }
```

要点：
- **没有血清 → `G.tints` 为空 → 所有动态元素回落到 `col(5)`（最亮的灰）**。
  这就是"世界没有颜色"的代码级实现。
- 每拿到一种元素/关键词血清，就往 `G.tints` 里 push 一个颜色；
  `buildTint()` 以 10Hz 在颜色列表里轮播。所以**角色身上颜色越多，说明 Build 越强**。
  这是一个用画面直接表达 build 强度的机制，不是纯装饰。
- `buildTint()` 被 7 个文件共 17 处调用（`ui.js` 4、`weapons.js` 5、`game.js` 3、
  `touch.js` 2、`panels.js`/`weapons2.js`/`weapons3.js` 各 1）—— 影响 HUD、子弹、
  角色、冲刺残影、近战弧线、准星等一切"属于你"的东西。
- 稀有度颜色也走同一套：`RAR = [白(col5), 青C.cyan, 紫C.violet, 金C.gold]`
  （`site/js/combat.js:10`），权重 60/28/12/4。

### 2.4 营地：18 色白名单（最容易看漏的一条）

`site/js/camp.js:9` 的注释把规则写死了：

> Like the game itself the world has no colour: every painted pixel turns gray
> unless it is one of the CACC colours (fire, lamps, lights, a few meaningful marks).
> **Colour is what is alive.**

实现：`CPix.set()` 时用 `CACC.has(c)` 打个标记位（`camp.js:43`），
不符合白名单的像素统一走 `campGray()` 转灰（`camp.js:39`）。

白名单只有 18 个色值（`camp.js:38`）：火光的橙黄、灯的黄、血的红、两处蓝绿标记。

**含义**：制作组用"颜色"来标记"还活着的东西"（火、灯、少女、记号）。
这也是为什么营地背景是个死城，但火堆和灯是彩色。

### 2.5 后处理 chroma

`chroma(a, force)`（`engine.js:245`）是一个屏幕级色散冲击参数，受 `QS.fx`
（画质档位）控制、按 `rdt * 6` 衰减（`engine.js:254`）。被击杀、受击、boss 相位、
传送等事件调用。它与上面两套"结构性色彩"**不是一回事**：chroma 是瞬时特效，
`PAL`/`tints`/`CACC` 才是持久的世界观设定。

---

## 3. 三模式的计分公式（完整版）

全部在 `site/js/net.js`。`DIFF_MUL` 见 `net.js:74`。

### 3.1 突入探索（非无尽）

```
clearB = win ? 10000 : floor * 1500
killB  = kills * 20
synB   = syn * 1500            // syn = 已激活协同数
timeB  = win ? round(30000 * 900 / (900 + runT)) : 0
hitB   = win ? round(20000 / (1 + 0.15 * hits)) : 0
mul    = DIFF_MUL[diff] * (assist ? 0.85 : 1)
total  = round((clearB + killB + synB + timeB + hitB) * mul)
```
出处 `net.js:77-84`。

### 3.2 无尽

```
clearB = 10000
depthB = depth * 6000          // ENDLESS_DEPTH
killB  = kills * 20
synB   = syn * 1500
mul    = DIFF_MUL[diff] * (assist ? 0.85 : 1)
total  = round((clearB + depthB + killB + synB) * mul)
```
出处 `net.js:76,78`。**注意：无尽没有时间奖励，也没有受击惩罚。**
这是分数上限远高于普通通关的直接原因。

### 3.3 入侵抵抗

```
clearB = win ? 10000 : 0
waveB  = wave * 1500
killB  = kills * 10
hitB   = win ? round(20000 / (1 + 0.05 * hits)) : 0
lvB    = lv * 200
mul    = DIFF_MUL[diff]        // 入侵没有 assist 折扣
total  = round((clearB + waveB + killB + hitB + lvB) * mul)
```
出处 `site/js/achieve.js:166`。

### 3.4 难度乘数

`DIFF_MUL = { easy: .5, classic: 1, hard: 1.5, nightmare: 2, despair: 2.6 }`（`net.js:74`）

| 难度 | 乘数 | 相对 classic |
|---|---|---|
| EASY | 0.5 | 半分 |
| CLASSIC | 1 | 基准 |
| HARD | 1.5 | ×1.5 |
| NIGHTMARE | 2 | ×2 |
| DESPAIR 绝境 | 2.6 | ×2.6 |

> **绝境 = 2.6 倍**，是所有刷分路径的共同放大器。
> 但要注意：**五锁的 `reward`（2/2/2/3/3）根本不进总分** —— `runScore()` 里没有任何
> `modifiers` 项（`net.js:77-84`）。五锁只让敌人变强，是"更难"路径，不是"更高分"路径。
>
> **真正的分箱是无尽**：`depth*6000` 无上限、**没有时间分也没有受击罚**
> （对比非无尽段 `timeB`/`hitB` 都只在通关时给）。且 `net.js:102` 的门槛里
> `!r.endless` 让"无尽里死亡"也照常上传。详见 [`score-farm.md`](score-farm.md)。

### 3.5 只有通关才上榜

`submitResult()`（`net.js:98-107`）：
- `win === false` 且非无尽且非入侵 → `st: 'none'`，**不上传**（`net.js:102`）。
- 入侵例外：`wave >= 3` 才提交（`achieve.js:175`）。
- 无尽跌倒算赢（`invade-endless.js:7` 与 `:74`）。
- 上传队列按 `rid` 去重（`pendGet`/`pendAdd`，`net.js:95-97`），
  但 `submitResult` 直接发（`net.js:105`）不经过这层判断 —— 服务端是否幂等未验证。
- 无限量活动上报**不复查 `ltPhase()`**（`limited.js:48-52` vs `limited.js:24`）。

---

## 4. 未解释 / 看起来像 bug 但其实是设计的清单（索引版）

| 现象 | 真相 | 出处 |
|---|---|---|
| 世界只有灰色，角色偶尔闪彩 | 颜色由血清点亮，是 build 强度的可视化 | `weapons.js:93-95` |
| 营地背景是灰的，只有火和灯有颜色 | `CACC` 18 色白名单，颜色标记"活物" | `camp.js:9,38,43` |
| 每层画面底色不一样 | `FLOOR_PAL` 每层一套灰阶 | `engine.js:76-80` |
| `testOn()` 永远是 `false` | 测试面板在正式版被硬关掉（死代码） | `testmode.js:5` |
| 五锁里的「腐烂」让火/毒/冰全失效 | 不是 bug：用 `defineProperty` 把三个字段的 setter 置空 | `modifiers.js:22` |
| 奖励房（宝箱/商店）不"清空"也能进 | `world.js:75` 奖励房生来 `cleared` | 见 `mechanics-rooms.md` |
| `BOSS_TEST.on` 时不计分、不存档、不给成就 | 开发用 boss 测试通道，整条链路短路 | 见 `mechanics-legacy.md` |

---

## 5. 读这份文档的规矩

- 本文件只给**索引与跨册结论**。细节去对应分册。
- 分册里每条结论都带 `site/js/文件名:行号`。**没有行号的断言一律不算数。**
- 标「未证实」的条目 = 只有推断、没有源码或实测支撑，**不要当结论引用**。
- 上游源码 `site/js/**` 与 `[TheSeed]/**` 字节级不可改。这份文档是唯一的产出。
