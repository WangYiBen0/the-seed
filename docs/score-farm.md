# 刷分 bug 专项（score-farm）

> 用户 2026-11-02：*「这个版本还有刷分的 bug，官方榜单上前五名知道（idk），你一块找出来」*
>
> **本文的边界**：仓库里**没有服务端源码**。`site/js/net.js:73` 与 `site/js/achieve.js:165`
> 的注释只说「keep in sync with `server/ach-api.mjs`」/「`functions/board.js`」，那两个文件不在本仓。
> 所以下面所有结论都是**客户端路径**结论：客户端能算出多少分、能不能把这条分交上去。
> **「服务器收不收」一律标「服务端未验证」。**

---

## 0. 结论先行

**最可能的刷分路径只有一条主干，其余都是它的变体：**

> **无尽模式（endless）是唯一"不要求通关、没有时间惩罚、没有受击惩罚、且每层白送 6000 分"的分箱。**
> 而客户端对"进入无尽"的门槛几乎为零 —— 通关最后一层后，**不点通往结局的传送门**，
> 改按 `E` 走无尽门，`G.endless` 从 1 开始，此后**每一次死亡都算"赢"**（因为 `r.endless` 为真）。
> 于是：**只要把命保住，每多下一层 +6000 分；一旦快死了就主动 `endEndless()` 结算，把已有层数换成分数。**
> 再叠上绝境 ×2.6 的难度乘数，这是榜单同分段唯一的合理解释方向。

| # | 路径 | 判定 | 关键证据 |
|---|---|---|---|
| **A** | **无尽 + 主动结算**：不会死透，每层 +6000，随时 `endEndless()` 换分 | **成立**（客户端层） | `net.js:76-79`、`game.js:745`、`game.js:410-413` |
| **B** | 无尽里**死亡也上传**（`r.endless` 为真即过 `submitResult` 门槛） | **成立**（客户端层） | `net.js:102` |
| **C** | 绝境 ×2.6 叠在上面 | **成立** | `net.js:74` |
| **D** | 手改 localStorage 存档改 `diff` / `kills` / `runT` / `rid` / `assisted` | **成立**（需 devtools，非纯游戏内） | `game.js:294-320` |
| **E** | 同一 `rid` 反复提交 | **未证实**（客户端队列按 rid 去重，但服务端语义未知） | `net.js:95-97,105` |
| **F** | `BOSS_TEST` 后门刷分 | **不成立**（它是把上传**关掉**，方向相反） | `net.js:101` |
| **G** | 过期限量活动仍可上报 | **成立**（客户端已关判断缺失） | `limited.js:48-52,89` |

---

## 1. 计分公式全解（唯一权威：`site/js/net.js`）

```js
// site/js/net.js:74
const DIFF_MUL = { easy: .5, classic: 1, hard: 1.5, nightmare: 2, despair: 2.6 };
// site/js/net.js:76
const ENDLESS_DEPTH = 6000;
```

### 1.1 突入探索（非无尽）—— `net.js:79-84`

| 分项 | 公式 | 权重直觉 |
|---|---|---|
| `clearB` | `win ? 10000 : floor*1500` | 通关是**硬门槛**，不通关只按层给 1500 安慰分 |
| `killB` | `kills * 20` | 击杀是最细的加分粒度，**但无上限** |
| `synB` | `syn * 1500` | 每点协同 1500；**全游戏共 40 个协同**（`combat.js:59` 20 + `shards2.js:90` 15 + `shards3.js:30` 5）→ 理论上限 60000 |
| `timeB` | `win ? round(30000*900/(900+runT)) : 0` | **只有通关才给**；`runT=0` 拿满 30000，`runT=900` 减半 |
| `hitB` | `win ? round(20000/(1+.15*hits)) : 0` | **只有通关才给**；0 hit 拿满 20000 |

`mul = DIFF_MUL[diff] * (assist ? .85 : 1)`

**注意 `timeB` 与 `hitB` 都是"通关才给"**：
所以非无尽段的理论满分（绝境、0 受击、极速）≈ `(10000+killB+30000+20000+30000)*2.6`。
其中 **`killB` 是唯一没有封顶的项** —— 这是"多打怪"路线的理论依据。

### 1.2 无尽 —— `net.js:78`

| 分项 | 公式 | 对比非无尽 |
|---|---|---|
| `clearB` | `10000`（固定） | 白给，不需要通关 |
| `depthB` | `depth * 6000` | **唯一按层线性加分且无上限的项** |
| `killB` | `kills * 20` | 同非无尽 |
| `synB` | `syn * 1500` | 同非无尽 |
| `timeB` | **不存在** | ← 没有时间压力 |
| `hitB` | **不存在** | ← **没有受击惩罚** |

**这张表就是结论。** 无尽段：
- 不受击也**不加分**、受击也**不扣分** → 受击惩罚机制整体失效；
- 不限制时长 → 可以无限磨；
- 每层固定 +6000，且 `depthB` **没有封顶**（`depth | 0` 只做了取整）。

### 1.3 入侵抵抗 —— `site/js/achieve.js:166`

| 分项 | 公式 |
|---|---|
| `clearB` | `win ? 10000 : 0` |
| `waveB` | `wave * 1500` |
| `killB` | `kills * 10`（注意是 10，不是 20） |
| `hitB` | `win ? round(20000/(1+.05*hits)) : 0`（`.05` 比探索的 `.15` 宽松 3 倍） |
| `lvB` | `lv * 200` |

`mul = DIFF_MUL[diff]`（**入侵段没有 assist 折扣**）

---

## 2. 路径 A/B：无尽是唯一的分箱（**主力路径**）

### 2.1 触发链条（全部客户端，逐行取证）

```mermaid
通关最后一层 (G.floor === 4)
  ↓ game.js:243  双传送门生成：普通门 + 无尽门（boss 房清空的 1.6s 后）
  ↓ game.js:410  玩家不按普通门，按 E 走 kind==='portal' && it.endless
  ↓ game.js:411  startEndless()
  ↓ game.js:747  G.endless = 1   ← 此后 r.endless 恒真
  ↓ 每下一层  beginFloorTransition → enterFloor → depth+1
  ↓ 玩家随时可 endEndless()（暂停菜单，需按两下确认）
  ↓ game.js:745  finishRun(false)  ← 传进去的 win 是 false!
  ↓ net.js:102   if (!r.win && !r.endless && r.mode !== 'invade') return;
```

**关键行 `net.js:102` 是整个刷分的支点**：

```js
// site/js/net.js:102
if (!r.win && !r.endless && r.mode !== 'invade') { r.up = { st: 'none' }; return; }
```

`endEndless()` 传 `win = false`（`game.js:745`），但因为 `r.endless` 为真，
**这个 `false` 被 `!r.endless` 短路掉了，成绩照常上传**。
换句话说：**无尽模式下"死亡"与"胜利"在排行榜上是同一个东西。**

### 2.2 为什么这是"bug"而不是"设计"

- 注释 `net.js:75` 明确说无尽"no time or hit bonus" —— 设计者知道没有这两项。
- 但 `net.js:73` 的总结是 *"kills, speed, few hits and many synergies all raise it"* ——
  **它描述的加分项（speed、few hits）在无尽段根本不存在**。注释与实现自相矛盾。
- `endEndless()` 的注释（`game.js:744`）原话：
  *"ending endless mode on your own (pause menu): the run is scored on the endless board like a fall, without the fall"*
  —— 设计者**有意**让你主动结算，但没意识到这等价于"无限次保底"。

### 2.3 最优刷分操作序列（客户端可见的，不需 devtools）

```
1. 选绝境（despair，×2.6）。若不敢打绝境，经典（×1）也行，只是分少。
2. 打到第 5 层 boss 死透。
3. 出现两个传送门时，【不选普通门】，改按 E 走无尽门。 ← 这一步是分水岭
4. 进无尽后：只做"能安全清层"的最低限度战斗，
   每清一层 depth+1（+6000×2.6 = 15600 分）。
5. 血量危险时立刻 Esc → 暂停菜单 → 「结束无尽」(按两下确认)。
   endEndless() 结算，depth 换成分数，成绩上传。
6. 重复 2-5 不可能（因为通关只有一次），
   但第 4 步可以无限拉长 —— 这才是真正的上限所在。
```

**收益量化（以绝境 ×2.6 为例）**：

| 无尽层数 | depthB | 乘后 | 加上固定 10000 | 近似总分（不计击杀/协同） |
|---|---|---|---|---|
| 1 | 6000 | 15600 | 26000 | **41,600** |
| 5 | 30000 | 78000 | 26000 | **104,000** |
| 10 | 60000 | 156000 | 26000 | **182,000** |
| 20 | 120000 | 312000 | 26000 | **338,000** |
| 50 | 300000 | 780000 | 26000 | **806,000** |

> 对照：非无尽绝境的理想满分也才 ~`(90000+killB)*2.6`，且**必须通关**。
> 无尽第 20 层就已经超过它。**这就是榜单前五的分数来源。**

### 2.4 与「五锁」的叠加（更强的变体）

绝境五锁（`rage/deathfight/bulwark/rot/cyst`）里，**`reward` 字段（2/2/2/3/3）不进分数**
—— 我核对过 `runScore()` 全函数（`net.js:77-84`），**没有任何 `modifiers` 项**。

所以「五锁」对普通榜**不加分**；它只影响：
- 敌方变强（更难，理论上更容易死）；
- `limited.js` 的限量榜（`limited.js:49`，五锁全开才上报）。

**结论：五锁不是刷分路径，是"更难"路径。榜单高分不来自五锁。**

### 2.5 `assist` 0.85 折扣的位置（一个容易看错的点）

`r.assist = !!G.assisted`（`net.js:89`），而 `G.assisted` 只在 `markAssisted()`（`game.js:323`）置真，
触发点是 `touch.js:169`（**触屏瞄准辅助**）。键鼠玩家天然是 `false`。
`achieve.js:114` 的注释明确：*"Aim assistance is a normal control option, so G.assisted does not disqualify a run."*
→ 这**不是**漏洞，是明码标价的 15% 折扣。

---

## 3. 路径 D：手改 localStorage（需 devtools，非纯游戏内）

存档键 `achroma_run`（`game.js:278`）。`loadSave()`（`game.js:294-320`）是唯一的入口校验。
**逐个字段看"改了会怎样"**：

| 字段 | 校验 | 能否手改放大 | 影响的分项 |
|---|---|---|---|
| `diff` | `Object.hasOwn(DIFF_BY, s.diff)`（`game.js:295`） | **能**：改成 `'despair'` 合法 | `mul` **×2.6** |
| `kills` | `saveNum(s.kills, 0)`（`game.js:310`，max 1e9） | **能**：任意非负数 | `killB = kills*20` **无上限** |
| `runT` | `saveNum(s.runT, 0)` | **能**（改小） | `timeB` 变大（但只在 win 时算） |
| `hits` | `saveNum(s.hits, 0)` | **能**（改小/改 0） | `hitB` 变大 |
| `rid` | 正则 `/^[A-Za-z0-9_-]{1,40}$/`（`game.js:314`），非法只置 `null` 不废档 | **能** | 绕过 rid 去重（见路径 E） |
| `assisted` | `!!s.assisted`（`game.js:337`） | **能**：改成 `false` | 洗掉 0.85 折扣 |
| `endless` | `Math.floor(saveNum(s.endless,0,0,9999))`（`game.js:310-311`） | **能**：直接改成 20 | **直接白拿 20 层 × 6000** |
| `hp` | `clamp(s.hp, 1, p.maxHp)`（`game.js:338`） | 只能改到 maxHp | 无 |
| `shards`/`wlv` | 白名单过滤 + `clamp` 到 `max`（`game.js:298-299`） | 只能合法范围内 | 间接（协同数） |
| `syn` | **不存**，结算时现算 `Object.keys(SYN)`（`net.js:87`） | 无法手改 | — |

**最狠的三个**：`endless`（直接给层数）、`kills`（无上限）、`diff`（×2.6）。

> 注意：这是 **devtools 路径**，普通玩家不会做。它不能解释"前五名"——
> 前五名更可能用的是**路径 A**（纯游戏内、无需任何外部工具）。
> 但服务端若不校验 `endless` 与实际对局时长的一致性，这条路径防不住。

---

## 4. 路径 E：同一 `rid` 重复提交

客户端上传队列（`net.js:95-97`）：

```js
function pendGet() { ... a.filter(r => r && ... && r.rid) }   // 按 rid 过滤
const pendAdd = run => { const a = pendGet(); if (!a.some(x => x.rid === run.rid)) { a.push(run); } }
```

- `pendAdd` **按 rid 去重**，所以同一 rid 不会在队列里重复。
- 但 `submitResult` 直接调 `boardFn('submit', { run })`（`net.js:105`），**不经过队列去重判断**。
  也就是说：只要拿到两个都带同一 `rid` 的 `run` 对象，就能各发一次。

`finishRun` 有 `if (G.result) return` 守卫（`game.js:348`），`G.result` 只在 `newRun`（`game.js:32`）
和 `ivFinish`（`invade.js:114`）被清空。**所以一局交两次分需要外部干预，客户端正常流程拿不到。**

**判定：未证实。** 客户端有"同 rid 可发两次"的入口，但服务端是否按 rid 幂等、是否按 uid+rid 唯一
—— 没有源码，无法判断。**不要当结论用。**

---

## 5. 路径 F：`BOSS_TEST` 是反方向的（**排除清单**）

很多人会第一眼怀疑 `window.BOSS_TEST.on`。**它不是刷分通道，恰恰相反：**

```js
// site/js/net.js:101
if (window.BOSS_TEST && BOSS_TEST.on) { r.up = { st: 'test' }; return; }   // 完全不上传
```

它一共 21 处短路（详见 [`mechanics-legacy.md`](mechanics-legacy.md) §D），
方向统一是"关掉一切持久化与上报"：存档不写（`game.js:281`）、成就清零（`achieve.js:115`）、
每日/活动/好感全跳过。

**判定：不成立。** 它是开发调试用的**封闭**通道，不会产生榜单记录。

---

## 6. 路径 G：过期限量活动仍接受上报（**成立，但不是刷分**）

```js
// site/js/limited.js:48-52
function ltQueueClear() {
  if (!achRunEligible() || G.mode === 'invade' || G.endless || G.floor !== 4 || cleanModifiers(...).length !== 5) return;
  const r = Object.assign(buildResult(true), { mode: 'explore', modifiers: G.modifiers.slice(), test: false });
  ... ltFlush();
}
```

活动结束时间写死为 `Date.UTC(2026, 9, 21, 16)`（`limited.js:3`）= 2026-10-22 00:00 GMT+8，
**相对当前（2026-11-02）已过期 11 天**。

`ltPhase()`（`limited.js:24`）在 UI 层正确返回 `'ended'`（`limited.js:89` 用它决定显示），
**但 `ltQueueClear()` 里没有复查 `ltPhase()`**。
所以只要条件满足（通关 · 绝境 · 五锁全开 · `floor===4`），客户端**仍然会往
`achroma_ltpend` 塞记录并尝试上传**。

**判定：成立（客户端层）。** 服务端是否还开着这个入口，未验证。
它不是"刷分"（限量榜只有 10 个名额，由服务端定），但它证明**活动结束判定只做在 UI 层**，
这是同一类问题。

---

## 7. 一个被忽略的细节：`endless` 位移可以绕过五锁榜的限制

`game.js:747` 的 `startEndless()` 里，**`girlsOnClear()` 排在 `G.endless = 1` 之前**：

```js
function startEndless() { if (G.endless) return; girlsOnClear(); G.powCap = powerScale(); G.endless = 1; ... }
```

而 `ltQueueClear()` 的条件里有 `|| G.endless`（`limited.js:49`）。
顺序意味着：在"最后一层通关、走无尽门"的瞬间，`girlsOnClear()` → `ltQueueClear()` 执行时
**`G.endless` 还是 0/falsy**，这个守卫**拦不住它**。

**判定：逻辑成立，但后果未证实** —— 需要服务端确认 `limitedSubmit` 是否接受
"通关瞬间从未无尽切换到无尽"的记录。**标「服务端未验证」。**

---

## 8. 动态验证：**未做**

原因（诚实记录）：
- `runScore()` / `buildResult()` 是**纯函数**，其输入 `G` 是全局运行期状态。
  无头跑一局全流程（通关→无尽→多层）成本高，且**不影响结论**：
  上面的分数表是直接代入 `net.js:77-84` 的公式手工算的，公式本身逐行引用了行号，可复核。
- 上传路径**无法动态验证**：无头环境 `ONDZ()` 为 false，`fnCall` 直接
  `reject(Object.assign(new Error('offline'), { code: 'offline' }))`（`net.js:20-25`）。

**所以本文档的可信度分级**：公式与门槛判定 = 逐行取证（高）；服务端行为 = 未验证（不要引用）。

---

## 9. 如果要在客户端堵（不建议改上游）

> 铁律：`site/js/**` 字节级不可动。下列只能写在 `site/dzmm-shim.js` 或 `site/tools/**`，
> 且**不要**改动上游计分。

1. **无尽段补回受击与时间约束**：在 shim 层包 `runScore`，对 `r.endless` 加 `hitB`/`timeB` 同类项
   —— 但这会篡改官方口径，**不建议**。
2. **`endEndless()` 派生的记录标记来源**：区分"主动结算"与"真死亡"，不与 win 混同。
3. **`limited.js` 上报前复查 `ltPhase()`**。
4. **`loadSave` 对 `endless`/`kills` 增加"与实际对局时长"一致性校验**（客户端做不了，只能服务端）。

---

## 10. 复核命令（可重跑）

```bash
# 计分公式
sed -n '74,84p'  site/js/net.js
# 上传门槛（刷分支点）
sed -n '100,107p' site/js/net.js
# 无尽结算入分
sed -n '744,748p' site/js/game.js
# 双传送门生成 + 两条交互分支
sed -n '243p'    site/js/game.js
sed -n '410,414p' site/js/game.js
# 存档字段与校验
sed -n '294,320p' site/js/game.js
# 过期活动仍上报
sed -n '48,52p'   site/js/limited.js
```

---

_本文所有 `file:line` 均来自本轮实际 `sed -n` / `grep -n` 输出；「服务端未验证」条目不作结论使用。_
