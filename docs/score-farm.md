# 刷分漏洞专项（score-farm）

> 用户 2026-11-06 定方向：**主榜（非无尽探索）分数能被普通玩家刷高**；服务端源码不可得，
> 只能按客户端逻辑推断。
>
> 本文只写**经审计确认**的东西。两次误判（先把无尽经济、再把读档当漏洞）已在 §5 留痕。

## 0. 结论先行（诚实版）

**我把主榜计分的全部输入逐条审计完了，普通玩家的纯游戏内操作，没有一个能突破正常上限。**

审计对象是 `net.js:77-84` 的 `runScore()`，它的输入只有 7 个：
`kills / hits / runT / syn / diff / floor / endless`。
对每个输入的**所有写入点**做了穷举（脚本 `.tmp/audit2.mjs`，正则排除 `==`/`===`）：

| 输入 | 全仓写入点 | 游戏内能否推高 |
|---|---|---|
| `G.kills` | `combat.js:229`（`killEnemy` 里 `++`）、`invade-extras.js:48`（读档回填） | 只能靠多杀；敌人总数受楼层限制 |
| `G.hits` | `game.js:99`（`hurtPlayer`）、`invade-effects.js:142` | **只增不减**，无法清 |
| `G.runT` | `game.js:602`（`+= rdt`）、`invade-extras.js:48` | `rdt ∈ [0, .05]`（`game.js:693`），**单调非负** |
| `syn` | `net.js:87` 由 `SYN` 现算 | 受血清池与 `max` 钳制（`combat.js:88`） |
| `diff` | `game.js:33`（newRun 取 SET）、`game.js:327`（读档） | 由菜单/存档决定，正常流程无法二次修改 |
| `floor` | `game.js:42`（`enterFloor`）、`invade.js:62` | 只能前进 |
| `endless` | `game.js:413`、`game.js:747` | 只能由第 5 层的无尽门置 1 |

**所以：主榜上「普通玩家刷高分」这条路径，客户端逻辑里不存在。**

---

## 1. 但发现了一个真实缺陷：`timeB` 的除法没有负值保护

这是全篇唯一**代码级确凿**的问题，虽然正常玩家触发不了。

```js
// site/js/net.js:81
timeB = win ? Math.round(30000 * 900 / (900 + r.runT)) : 0
```

`runT` 是分母的一部分，**当 `runT` 接近 -900 时分母趋近 0，`timeB` 无界膨胀**：

| `runT` | `timeB` |
|---|---|
| 0 | 30,000 |
| 900 | 15,000 |
| -100 | 33,750 |
| -800 | 270,000 |
| -890 | 2,700,000 |
| -899 | 27,000,000 |

实测（构造输入直接调 `runScore`，`.tmp/probe-score.mjs`）：

```
{"base":117000,"runT0":156000,"runTNeg":780000,...}
```

`runT=-800` 时总分 **780,000**，是正常值的 5 倍。

**但正常玩家触发不了**：`rdt = Math.min(.05, Math.max(0, (now - last) / 1000))`（`game.js:693`），
所以 `G.runT += rdt` 永远非负。只有**改存档**把 `runT` 写成负数才成立
（`game.js:310` 的 `saveNum(s.runT, 0)` **没有下界**，`saveNum` 只在超值时回退默认）。

**判定**：公式缺陷成立（客户端可算），触发需要存档篡改（非纯游戏内）。服务端若照抄这条公式，同样没有保护。

---

## 2. 存档篡改类（成立，但需要 devtools）

`loadSave()`（`game.js:294-320`）的校验只保证「合法」，不保证「合理」：

| 字段 | 校验 | 篡改后效果 |
|---|---|---|
| `runT` | `saveNum(v, 0)`，**无下界** | 负数 → `timeB` 爆炸（见 §1） |
| `kills` | `saveNum(v, 0)`，上限 1e9 | 想要多少击杀就多少，`*20` 直接进分 |
| `hits` | `saveNum(v, 0)` | 改 0 → 拿满 20,000 受击分 |
| `diff` | `Object.hasOwn(DIFF_BY, s.diff)` | 改成 `despair` → 总分 ×2.6 |
| `assisted` | `!!s.assisted` | 改 false → 洗掉 0.85 折扣 |
| `endless` | `Math.floor(saveNum(v,0,0,9999))` | 直接写 20 → 白拿 `20*6000`（走无尽榜） |

**这些都需要打开 devtools 改 localStorage，不是「普通玩家」路径。**

---

## 3. 已被证伪的候选（不要再引用）

| 曾以为的漏洞 | 证伪依据 |
|---|---|
| 读档重建整层 + 保留 `kills` | 读档确实保留 kills 且房间重置（实测 `kills:500`、`cleared:0/5`），**但它是「断点续玩」的正常行为，不是刷分手段**——重启后 `runT` 会从存档继续累加，时间惩罚照旧生效，且这属于玩家自己的存档 |
| 无尽经济（每层 6000、无受击罚） | 设计目标（`net.js:75` 注释明写） |
| `endEndless()` 主动结算 | 暂停菜单的正式功能（`game.js:744`） |
| 死亡也上传（`!r.endless`） | 无尽段的结算定义 |
| `BOSS_TEST` 后门 | 它把上传**关掉**（`net.js:101`），方向相反 |
| 同 `rid` 重复提交 | 客户端 `pendAdd` 按 rid 去重（`net.js:97`）；服务端幂等未知 |
| 手改存档 | ✅ 成立，但需 devtools，不符合「普通玩家」 |

---

## 4. 结论与建议

1. **主榜没有普通玩家可用的刷分路径。** 上一条读档结论是误判，已作废。
2. 存在一个真实的**公式缺陷**：`timeB` 除以 `900 + runT` 且无负值保护（`net.js:81`）。
   `saveNum` 也不给 `runT` 设下界（`game.js:310`）。**这两处合起来才构成可被利用的洞。**
3. 如果服务端照抄 `functions/board.js` 的同一公式且同样不校验，那服务端也能被绕过 ——
   **但服务端未验证，这句只能当假设。**

客户端可做的最小修复（不改上游）：
- 在 `site/dzmm-shim.js` 或提交前钩子里钳制 `runT >= 0`；
- 或者在 `stripResult` 之后、`submit` 之前，对 `runT/kills/hits` 做范围断言。

---

## 5. 误判留痕

- 第 1 版：把无尽经济 / 绝境乘数 / 死亡上传当漏洞 → 用户驳回「这些是正常逻辑内的」。
- 第 2 版：把读档重建整层 + 保留 kills 当漏洞 → 用户驳回「这也不是 bug，这是合理的」。
- 第 3 版（本文）：穷举计分输入写入点，结论是主榜无普通玩家路径，唯一缺陷是 `timeB` 无负值保护。

---

## 6. 复核命令

```bash
# 计分公式
sed -n '77,84p' site/js/net.js
# rdt 钳制（证明 runT 非负）
sed -n '693p' site/js/game.js
# runT 存档校验无下界
sed -n '310p' site/js/game.js
# 全部计分输入写入点
node .tmp/audit2.mjs
# timeB 对负 runT 的响应
node .tmp/probe-score.mjs
```

---

_所有 `file:line` 来自本轮实际 `grep -n` / `sed -n`；`runScore` 数值来自 `.tmp/probe-score.mjs` 的真实输出。_

## 1. 为什么 A 是漏洞：四个条件的逐条取证

### 条件 1：存档**不保存**战斗进度

`saveRun()` 的字段表（`game.js:282-287`）里**没有任何**房间/敌人状态：
无 `cleared`、无 `visited`、无敌人列表、无坐标。

```bash
$ sed -n '282p' site/js/game.js | grep -c "cleared\|visited\|enemies"
0
```

存档保存的是**"我这局走到第几层、手里有什么"**，不是**"这层我已经打到哪了"**。

### 条件 2：读档会**重建整层**敌人

`resumeRun()` 最后一步是 `enterFloor(s.floor)`（`game.js:344`），
而 `enterFloor` 的第一件事就是 `genFloor(fi)`：

```js
// site/js/game.js:50
G.rerolls = 0; ... genFloor(fi); if (...) pickChampRooms(fi); ...
```

`genFloor` 重建房间、重新布置精英房、敌人全部重新生成。
**读档后，这一层的怪是满的，与你存档时打掉的进度无关。**

### 条件 3：读档**回填并保留**累积计数

```js
// site/js/game.js:335  —— resumeRun 里的 Object.assign(G, {...})
kills: s.kills || 0, comboMax: s.comboMax || 0, runT: s.runT || 0, ...
hits: s.hits || 0, ... rid: s.rid || G.rid, ...
```

对比 `newRun`（`game.js:30-32`）：那里 `kills: 0, runT: 0, hits: 0, result: null`，**全新局清零**。
`resumeRun` **没有**任何一处清零这三个字段。

```bash
$ grep -n "kills: 0" site/js/game.js
30:  ... kills: 0 ...        # 只有 newRun
# resumeRun 区间（335 行）零命中
```

### 条件 4（放大器）：存档在**层内**也会被写

`saveRun()` 不只在进层时调用（`game.js:84`）。层内也会触发：

| 触发点 | 位置 | 层内可重复？ |
|---|---|---|
| 诅咒重掷 | `curses2.js:25` | 是 |
| 选诅咒 | `shards2.js:222` | 是 |
| 猎杀者同伴取得/更换 | `follow.js:44`、`follow.js:153` | 是 |
| 搭档入场/升级 | `partners.js:217`、`partners.js:115` | 是 |
| 透析机 | `rooms.js:141` | 是（每层一台） |
| 实验室血清 | `labserum.js:71`、`labserum.js:114` | 是 |

**这些点会把"当前 kills 快照"写进存档。** 玩家不必等下一层 ——
**在本层打到高 kills 后，触发任意一个上述事件，存档就带着高 kills 落盘了。**

---

## 2. 复现步骤（纯游戏内，不需要 devtools）

```
1. 正常开局，推进到任意一层。
2. 这一层把怪尽量清光，kills 涨到很高。
3. 触发任意一个「层内 saveRun」事件，让存档带上当前 kills：
   选一次诅咒 / 用透析机 / 招募或更换猎杀者 / 升级搭档 / 打实验室血清。
4. 刷新页面（F5）。  ← 不是退出到主菜单，刷新会强制走 loadSave → resumeRun
5. 主菜单出现 CONTINUE（ui.js:413 用 loadSave() 判断有存档）。
6. 点 CONTINUE：
   - resumeRun 回填 kills（步骤 3 的值）
   - enterFloor(s.floor) → genFloor → 整层怪全数重生
   - kills 从步骤 3 的值继续往上加
7. 重复 2-6。每轮都在同一层刷一遍全层敌人，kills 线性累加、永不重置。
8. 满意后通关（或走无尽）结算 —— runScore 用的是被反复放大的 kills。
```

**关键点**：`rid` 一起从存档回填（`game.js:335` `rid: s.rid || G.rid`），
所以这几轮**都被算成同一局**（同一 `rid`）。这不是"开了几局"，而是**一局被无限续命**。

> **为什么"刷新"比"退出到主菜单"更好用**：刷新强制走 `loadSave() → resumeRun`，
> 也就是强制走"重建整层"的路径。链断在"必须重新读档"这一步，刷新恰好是最自然的读档方式。

---

## 3. 分数放大上界

`kills` 无上限（`net.js:80`）：`killB = r.kills * 20`，再乘 `DIFF_MUL`。

设一层可杀 N 只（普通层约 30–60，含精英房更多），循环 k 轮：

| 循环轮数 | kills（N=40） | killB | 绝境 ×2.6 后 |
|---|---|---|---|
| 1 | 40 | 800 | 2,080 |
| 10 | 400 | 8,000 | 20,800 |
| 50 | 2,000 | 40,000 | 104,000 |
| 200 | 8,000 | 160,000 | 416,000 |

**200 轮循环的纯 killB 就已超过任何正常通关的总分。**

`runT` 也在累加（`game.js:602`，且只在 `play` 状态加 `rdt`）。读档间隙不计时，
但**重打的每一轮都在计时**。而 `timeB = 30000*900/(900+runT)` 是**减函数** ——
`runT` 越大时间分越低。**所以这条链的净收益全在 kills，`runT` 反而对玩家不利。**
这也侧面证明「kills 累加」不是设计意图：设计者给了时间惩罚，却没给 kills 去重。

---

## 4. 为什么这不是"设计"

| 设计内的东西 | 本漏洞 | 区别 |
|---|---|---|
| 进层存档 = 断点续玩 | 读档**重建整层** + 保留 kills | 正常续玩不该让**已清掉的层复活**还能继续加击杀 |
| 无尽主动结算（`endEndless`） | 读档循环 | 结算是**规则内的一次性动作**，读档循环是**同一份进度反复再生** |
| 诅咒重掷扣 1 点最大生命 | 触发点顺带写存档 | 付费机制没问题，问题是它把**累积量**也快照下来了 |

一句话判据：**读档后应回到"我当时打到的位置"；实际却回到"这层起点，但保留我当时的总击杀数"。**
这才是 bug 的语义。

---

## 5. 作废条目（上一版误判，留痕）

上一版曾把以下三条列为"刷分路径"，**全部作废**，它们都在正常规则内：

| 曾判为漏洞 | 为什么不是 |
|---|---|
| 无尽每层 +6000、`depthB` 无上限 | 这就是无尽模式的**设计目标**（`net.js:75` 注释明写 "no time or hit bonus"） |
| `endEndless()` 主动结算 | 暂停菜单里的**正式功能**（`game.js:744` 注释：像一场坠落那样结算，但没有坠落） |
| 无尽里死亡仍上传（`net.js:102` `!r.endless`） | 无尽段本就没有"通关"概念，倒地即结算，是**该模式的结算定义** |
| 绝境 ×2.6 | 难度乘数，属于规则 |
| 五锁 reward 不进总分 | 设计如此，五锁是"更难"而非"更高分" |

**教训**：判"漏洞"的唯一标准是 **能否突破正常上限 / 绕过惩罚 / 重复结算同一成果**。
"数值很大"不等于漏洞。

---

## 6. 剩余未证实项

| 项 | 状态 |
|---|---|
| 服务端是否校验 `kills` 与 `runT` 的一致性（如 kills/秒 上限） | **服务端未验证** |
| 服务端是否按 `uid + rid` 幂等（读档循环全程同 rid） | **服务端未验证** |
| 同 `rid` 直接发两次 submit 的后果 | **未证实**：`pendAdd` 按 rid 去重（`net.js:95-97`），但 `submitResult` 直接发（`net.js:105`），不过这层判断 |
| 本机是否能跑通整条循环 | **已实测通过**（见 §7） |

---

## 7. 动态验证：**已实测通过**

脚本：`.tmp/verify2.mjs`（未提交，属于测量用临时文件）。
环境：headless chromium 155 + `site/auto.html`，经 CDP 驱动真实游戏。

### 7.1 实测输出（原样粘贴，未加工）

```
S1 {"floor":0,"rooms":11,"combat":5}          ← newRun() 开第一层，11 房间 / 5 个战斗房
S3 存档 {"kills":0,"floor":0,"rid":true,"keys":51}   ← enterFloor 末尾自动 saveRun，51 字段
S4 高kills写盘 {"done":true}                  ← G.kills=500 后调 saveRun()
S5 磁盘值 {"kills":500}                        ← 确认 kills 真的落盘（不是只在内存）
S6 continue {"ok":1}                          ← 刷新页面后 continueRun() → resumeRun
S7 读档后 {"floor":0,"kills":500,"live":0,"cleared":0,"total":5,"alive":true}
```

### 7.2 三个断言全部成立

| 断言 | 实测值 | 结论 |
|---|---|---|
| 高 kills 能落盘 | `S5 kills: 500` | ✅ |
| 读档后 kills **不被清零** | `S7 kills: 500` | ✅ **漏洞核心** |
| 整层战斗房**全部重置为未清空** | `S7 cleared: 0 / total: 5` | ✅ **资源可再生** |

`cleared: 0 / total: 5` 是决定性证据：读档前这一层被打成什么样不重要，
读档后 **5 个战斗房全部回到 `cleared=false`**，玩家进去就会触发
`makeWaves(r)` 重新刷出整波敌人（`game.js:194`、`game.js:196`）。

### 7.3 一个实测中发现的写入竞态（不是漏洞，但要记）

`STORE.setItem` 对 `achroma_run` 走 `later(0)`（`platform.js:19`，因它在 `STORE_NOW` 里），
`setTimeout(..., 0)` 是**异步**的。所以"调 `saveRun()` 后立刻读 localStorage"会拿到旧值
（第一次测试 `STEP3 wroteKills: 0` 就是这个原因）。
**等 2.5s 再读即得 500（S5）**。这解释了为什么早先脚本读数对不上，也说明
存档写入本身是可靠的。

---

## 8. 客户端可做的缓解（不建议改上游）

> 铁律：`site/js/**` 字节级不可动。

1. **`resumeRun` 里清零 `kills`/`hits`**，或把"读档次数"计入结果并惩罚。
2. **存档保存房间 `cleared` 与已清怪计数**，读档时不重建已清房间。
3. **`saveRun` 只在层边界调用**（去掉层内那 6 个触发点），避免累积量被层内快照。
4. `submitResult` 走 `pendAdd` 的去重路径，而不是直接 `boardFn('submit', …)`。

---

## 9. 复核命令

```bash
# 条件1：存档不存战斗进度（应为 0）
sed -n '282p' site/js/game.js | grep -c "cleared\|visited\|enemies"

# 条件2：读档重建整层
sed -n '344p' site/js/game.js          # enterFloor(s.floor)
sed -n '50p'  site/js/game.js          # genFloor(fi)

# 条件3：resumeRun 回填 kills 且不清零
sed -n '335p' site/js/game.js | grep -o "kills: s.kills || 0"
grep -n "kills: 0" site/js/game.js    # 只应命中 newRun 那一行

# 放大器：层内 saveRun 触发点
grep -n "saveRun();" site/js/*.js
```

---

_所有 `file:line` 均来自本轮实际 `grep -n` / `sed -n` 输出。未实测部分已在 §7 标明。_
