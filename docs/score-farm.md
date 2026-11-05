# 刷分漏洞专项（score-farm）

> 用户 2026-11-05 更正：**「什么叫刷分 bug，你写的是属于正常逻辑内的，要找的是漏洞」**
> —— 上一版把「无尽经济」「绝境 ×2.6」「死亡也上传」当成漏洞，这些是**设计内的正常玩法**，判定作废。
> 本文重写：只保留**能突破正常上限、绕过惩罚、或把同一份战斗成果结算多次**的路径。

> **边界**：仓库里没有服务端源码（`net.js:73` 只说 "keep in sync with `server/ach-api.mjs`"）。
> 所以下面全部是**客户端路径**结论。**「服务器收不收」一律标「服务端未验证」。**

---

## 0. 结论先行

**真正的漏洞只有一条：读档会把「整层的战斗成果」重新变成可再生资源。**

```
存档不保存战斗进度   →  读档重建整层敌人（全数重生）
          +
存档保存了累积计数   →  kills / runT / hits 原样回填、不清零
          ↓
每"读档-重打一层"一轮，同一批敌人可以再被杀一次，kills 无限增长
```

`kills` 是分数里**唯一没有上限的输入**（`net.js:80` `killB = r.kills * 20`）。
**这条链才是刷分，不是无尽。**

| # | 路径 | 判定 | 关键证据 |
|---|---|---|---|
| **A** | **读档重开整层，kills/runT 累加不重置** | **成立**（纯游戏内，无需 devtools） | `game.js:282`、`game.js:335`、`game.js:50`、`game.js:84` |
| **B** | 同一 `rid` 由读档持续复用 → 多轮结果算作同一局 | **成立**（客户端层） | `game.js:335` `rid: s.rid \|\| G.rid` |
| **C** | 手改 localStorage 存档字段 | 成立但**需 devtools**，非"游戏内刷分" | `game.js:294-320` |
| **D** | 过期限量活动仍接受客户端上报 | 成立（UI 层关了、上报层没关） | `limited.js:48-52` vs `limited.js:24` |
| **E** | 无尽 + 绝境 + 主动结算 | **不成立（是设计）** | 见 §5 作废说明 |
| **F** | `BOSS_TEST` 后门 | **不成立**（它把上传关掉） | `net.js:101` |
| **G** | 同 rid 提交两次（不经读档） | 未证实（服务端幂等未知） | `net.js:105` |

---

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
