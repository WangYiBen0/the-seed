# [TheSeed] 镜像工具 Benchmark（宏 + 倍速）

> 本文档给出镜像工具的跑分方法与样例数据。所有数据都在**未修改任何游戏源码**
> 的前提下测得：倍速通过重排 `requestAnimationFrame` 的虚拟时间戳实现，
> 宏/自动挂机通过游戏自己的公开输入状态（`Input`）与 DOM 事件驱动。

## 1. 三种基准

| 场景 | 内容 | 关键指标 |
|---|---|---|
| `throughput` | 在一局真实对局中，×8 倍速连续跑 N 秒（性能模式：粒子 15%、关特效、无帧率上限） | `tps`（每真实秒的模拟帧数）、`ratio`（游戏秒/真实秒） |
| `macro` | 回放内置"站桩 30s"操作宏（按住攻击 + 绕圈瞄准），×4 倍速 | `ratio`（宏时间轴对齐精度）、击杀/伤害 |
| `fullrun` | 自动挂机（全自动模式）从新档打到目标无尽深度 | 深度、击杀、受击、结局、真实耗时 |

面板入口：`基准 · BENCHMARK` 三个按钮；命令行入口：

```bash
nix run .#bench -- --kind throughput --seconds 8 --speed 8
nix run .#bench -- --kind macro      --seconds 15 --speed 4
nix run .#bench -- --kind fullrun --seed 7 --policy bloom --goal-depth 1 --speed 8 --timeout 300
```

每次运行输出一行 JSON（`TSW_RESULT …`），`--out results.jsonl` 可追加落盘。

## 2. 样例数据（本机：NixOS，headless Chromium 155，软件渲染）

### 吞吐（throughput）

```json
{"kind":"throughput","speed":8,"seconds":6,"ticks":2879,"tps":479.7,
 "gameS":48,"ratio":8,"inRun":true,"ua":"Chrome/155.0.0.0"}
```

- ×8 档理论值 = 8 × 60 = **480 ticks/s**，实测 **479.7**，误差 < 0.1%；
- `ratio = 8.00`：游戏内时间与真实时间严格 1:8。

### 宏 + 倍速（macro）

```json
{"kind":"macro","speed":4,"seconds":15,"macro":"hold-attack",
 "gameS":25.1,"wall":6.3,"ratio":4,"kills":0,"dmg":0,"ua":"Chrome/155.0.0.0"}
```

- 宏按**虚拟时间轴**录制，回放时与游戏时间严格对齐（`ratio = 4.00`）；
- 站桩宏在起始房没有敌人，所以 kills/dmg 为 0 —— 这是预期行为；
  要测战斗表现请用 `fullrun`。

### 全自动一局（fullrun）

样例（bloom 策略、seed 7、×8、目标无尽 1 层）：

```json
{"kind":"fullrun","speed":8,"seed":7,"policy":"bloom","goalDepth":1,
 "end":"death","gameT":117,"floor":0,"kills":74,"hits":25,"dmg":2570,
 "weapons":["nail"],"shards":{"stat":1,"rnova":1,"rico":1,"fury":1},"syn":0}
```

自动挂机的走位/拿卡策略是"可用"水平，不是人类上限 —— **数据用于策略横向
对比（选卡倾向、武器偏好），不代表任何"人类天花板"**。多次运行的矩阵
（4 策略 × 2 种子）见第 4 节。

> **Firefox 支持**：2026-10-18 已在 headless Firefox 158 验证完整链路——
> boot → 起名 → 选难度 → 自动挂机一整局（`ua: Firefox/158.0`，kills>0）。
> 游戏与全部工具在 Chrome / Edge / Firefox 下均可运行。

## 3. 方法论说明（为什么这些数字可信）

1. **倍速不靠改游戏**：`tools/core.js` 在游戏启动前替换
   `window.requestAnimationFrame`，把虚拟时间戳按倍率推进；游戏的
   `frame(now)` 只看到时间戳，模拟与渲染节拍完全不变。
2. **宏不靠改游戏**：回放重新派发真实 DOM 事件（KeyboardEvent/MouseEvent），
   走的是引擎自己的监听器；坐标按画布矩形换算，分辨率无关。
3. **可复现性**：`TSW.rng.seed(n)` 用 mulberry32 替换 `Math.random`，
   同一 seed 的 fullrun 从洗牌到掉落完全一致。
4. **性能模式只动视觉**：`QS.part/fx/fps`、`SET.shake/flash` 是渲染质量参数，
   不触碰任何游戏数值。

## 4. 构建对比（probe：构造存档 → 模拟无尽深度）

`fullrun` 测的是"挂机从零打到无尽"的全流程；要单独比较**构建（build）**，
用 `probe`：它构造一份带指定武器/血清/芯片的运行存档（走游戏自己的
`loadSave` 校验，不改任何源码），把游戏投放到第 5 章 + 模拟无尽深度，
然后让自动挂机打 N 游戏秒，输出战斗时间归一化的击杀/伤害速率：

```bash
node scripts/headless-bench.mjs --kind probe --depth 5 --seconds 90 --seed 7 \
  --speed 8 --build '{"weapons":["rail"],"wlv":{"rail":3},"shards":{"keen":4,"heavy":5}}'
```

### 深度 5 · 同 seed 对比（自动挂机，战斗时间内归一化）

| build | 击杀/分 | 伤害/分 |
|---|---|---|
| rail + keen4/heavy5/frenzy5/needle3（满锻造） | **54.0** | **1194** |
| nail 裸装 | 40.5 | 825 |
| hail + bloom3/shrap3/ember/fury/leech | 31.4 | 723 |

**结论**（详见 `endless-guide.md`）：高面板武器 + 冻结期输出血清 > 低面板
高频武器硬灌引爆链；bloom 引爆是唯一随深度放大的伤害，但起爆仍靠武器 DPS。
挂机所方差较大（导航/走位占一半因素），精确结论以多 seed 中位数为准。

## 5. 无尽策略矩阵（4 策略 × 3 种子 fullrun）

> **流派改名（2026-10-25）**：面板上的流派已从「bloom/offense/balanced/survival/…」
> 换成**游戏自身的 12 个入侵抵抗偏好**：均衡适应、近身搏击、精准猛攻、远距火力、
> 元素反应、厚重生存、稳守缓进、幸运搜集、工程布防、医疗续航、快速蜕变、喧嚣引敌。
> 下表是改名前的历史数据（原策略名），保留以便对照。

自动挂机从零开局打到无尽深度 1（×8 倍速，seed 7/42/99，2026-10-17）：

| 策略 | 平均击杀 | 最高击杀 | 平均存活(游戏秒) | 最深楼层 |
|---|---|---|---|---|
| **bloom（坏死爆裂连锁）** | **56** | **116** | **241** | **2** |
| balanced | 34 | 56 | 127 | 1 |
| offense | 31 | 48 | 159 | 1 |
| survival | 14 | 18 | 182 | 1 |

- **bloom 策略在击杀数与推进深度上领先**（选卡倾向：bloom/shrap/fury/leech 优先）；
- survival 策略活得久但击杀少（输出血清拿太少，清怪慢 → 被拖入弹幕海）；
- 挂机所方差较大（单局 7~116 击杀），上表是 3 种子平均；工具面板可自行加种子。

## 6. 躲弹幕测评（dodge benchmark）

专门测"闪避"这一项能力，而不是整局综合强度。做法：**禁止开火**（`noFire`），
让敌人不会减少，再按固定节拍**持续补充远程敌人**（gunner/sniper/turret/mortar，
保底 7 个），于是弹幕只会越来越密 —— 这是一场纯挨打压力测试。

指标：

| 指标 | 含义 | 方向 |
|---|---|---|
| `hitsPerMin` | 受击次数 / 游戏分钟 | 越低越好 |
| `dangerAvg` | 站位处威胁值均值（预警圈+弹道预测+虚空区+地刺） | 越低越好 |
| `hazardPct` | 威胁值 ≥1.2 的 tick 占比（暴露率） | 越低越好 |
| `clearAvg` / `clearP5` / `clearMin` | 所选方向上"最坏一枚子弹"的横向余量（均值 / 5% 分位 / 最小值） | 越高越好 |
| `dashesPerMin` | 冲刺频率 | 参考 |

归一化用**实测 play tick 数**（`ticks/3600 = 游戏分钟`），而不是 `G.runT`——
后者在自动重开时会归零，早期版本用它算出了 4440 次/分的荒谬数字。

### v2 vs v1（同深度 6，各 30 秒，×8，禁止开火压力局）

本表直接由 `docs/data/dodge-ab.jsonl` 生成，数字与该文件一一对应：

| 种子 | v2 受击/分 | v1 受击/分 | v2 危险值 | v1 危险值 | 胜 |
|---|---|---|---|---|---|
| 11 | **15.1** | 22.2 | 4.138 | 1.698 | v2 |
| 23 | 22.4 | **22.0** | 3.356 | 5.68 | v1 |
| 41 | **9.2** | 21.2 | 0.734 | 3.367 | v2 |
| **平均** | **15.6** | 21.8 | — | — | — |

- 三个有效种子中 v2 赢 2 个（平均 **15.6 vs 21.8** 次/分，约 **-29%**）；种子上限只有 3 个，
  单种子可翻转，所以结论按平均值看，不要当成显著性证明；
- 来源：v2 把"最坏一枚子弹的横向余量"（`laneClear`）算进评分，避免两侧同时被夹，
  而不是单纯追求平均空旷（v1 的危险值均值有时更低，但受击更多）；
- 跑分噪声说明：同一配置重复跑会得到不同绝对值（本会话两次平均分别为
  19.9/26.8 与上述结果），**结论看方向与差距，不要看单次绝对值**；
- 有效样本门槛：`ticks < 600`（不足 10 秒实战）判为无效并自动重试，
  防止"没进战斗 = 0 受击 = 完胜"的假数据。

面板路径：工坊 → **躲弹幕测评 · DODGE BENCH** → 选引擎/秒数/深度/种子 → 开始
（选"对比 v2 vs v1"会连跑两次并给差值）。命令行：

```bash
node scripts/headless-bench.mjs --kind dodge --engine both \
     --seconds 60 --depth 6 --seed 11 --speed 8 --timeout 400
```

## 7. 原始数据

- `docs/data/matrix.jsonl` — 策略矩阵 12 局的原始 JSONL
- `docs/data/probe-ab.jsonl` — 构建 A/B 的原始 JSONL
- `docs/data/smoke-bench.jsonl` — 吞吐/宏冒烟数据
- `docs/data/dodge-ab.jsonl` — 躲弹幕 v2/v1 对比的原始 JSONL

## 8. 复现清单

```bash
nix develop                      # node + chromium + python3
nix run .#serve                  # http://127.0.0.1:8000 （面板 → 基准）
node scripts/headless-bench.mjs --kind fullrun --seed 7 --policy bloom \
     --goal-depth 1 --speed 8 --timeout 300 --out results.jsonl
```

## 9. 实力期望与方差（5 种子实测）

同配置（bloom 流派 · classic · 目标无尽 1 层 · ×8 倍速 · 全自动）跑 seed 11/23/41/57/73：

| 指标 | 均值 | 标准差 | 最差 | 最好 |
|---|---|---|---|---|
| 存活（游戏秒） | 267 | ±81（CV 30%） | 163 | 389 |
| 击杀 | 41.2 | ±14.4（CV 35%） | 21 | 59 |

- 方差主要来自**开局房间构成与掉落**：拿到能配合的血清（bloom/shrap/frenzy）就滚起来，
  拿不到就死在第一章；
- 另有两个种子触发了 `stall`/`replan` 计数（4/14 与 8/25），即仍有少量绕圈重算，
  但都被兜住（没有卡死：两局都正常推进到死亡）；
- 复现：

```bash
for s in 11 23 41 57 73; do
  node scripts/headless-bench.mjs --kind fullrun --seed $s --policy bloom \
    --goal-depth 1 --speed 8 --timeout 200 --out .tmp/var.jsonl
done
```

跑多局会额外输出一行 `{"kind":"summary", ...}`（均值/标准差），便于对比改动效果。

### 被数据否掉的方差假设（留档，避免重复踩）

| 假设 | 做法 | 结果 | 结论 |
|---|---|---|---|
| 开局先堆生存能压方差 | 首层且血清 <2 时，plate/vital/quick/swift/leech 权重 ×1.45 | seed 23/41/57 的 gameT 264/251/268 → **200/206/173**，击杀 40/36/59 → **25/31/8** | **否**：标准差从 80 降到 18，但均值塌了——"稳定地更差"，已回滚 |

原因分析：首层防御血清挤压了输出位，清怪变慢 → 房间拖长 → 弹幕叠满，反而更容易死。
下一个该试的方向是**反方向**（首层 DPS 偏向）或直接治理"清怪速度"而非生存。

## 10. 绝境五锁基线（目标①的起点）

五个修饰符全开：`rage`（敌人攻击频率 ×2）、`deathfight`（致命伤后 2 秒不可选中）、
`bulwark`（敌人进战后 20 秒减伤 20%）、`rot`（免疫燃烧/中毒/冰冻）、`cyst`（敌人生命上限 +25%）。

**怎么让修饰符进入基准局**（踩过三个坑，记下来）：

1. `modifiers.js` 的 `PENDING_MODIFIERS` 是它自己作用域里的 `let`，bench 里赋值只会遮蔽，
   改不到游戏；`sortie()` 又会走营地而不是直接开局。
2. 正解是**构造存档**：`{v:1, floor:0, diff:'despair', modifiers:[五锁], …}` → 交给游戏自己的
   `loadSave()` → `cleanModifiers(s.modifiers, s.diff)` 校验 → `resumeRun()`。
3. `STORE.setItem` 在 `STORE.locked` 时会**静默丢写**，必须直写 `STORE.mem` + `dirty`。
4. `whenGame()` 只等 `game.js`（脚本序号 25/76），而 `newRun()` 里调用 `takeRunModifiers()`
   定义在 `modifiers.js`（序号 70/76）→ 开局太早会 `ReferenceError`。基准必须先等脚本就绪。

结果行会回显 `modifiers: [...]`（开局）与 `modifiersAtEnd`，可据此确认五锁真的生效。

### 三轮迭代（seed 7 / 23 / 41，rounded，×8，各 150 秒，同种子同配置）

| 种子 | 原始基线 T/kills | +死斗识别 T/kills | +清房追击 T/kills |
|---|---|---|---|
| 7 | 198 / 9 | 158 / 15 | **357 / 21** |
| 23 | 136 / 11 | 267 / 17 | **255 / 25** |
| 41 | 111 / 86 | 389 / 59 | **357 / 112** |
| **均值** | **148 / 35.3** | 271 / 30.3 | **323 / 52.7** |

**两处改动**（都在 `tools/auto.js`，未动上游）：

1. **死斗敌人当危险源**：绝境「死斗」修饰符下，`deathFightLeft > 0` 的敌人**不可选中但仍每帧造成接触伤害**
   （`enemies.js:115` 没有过滤它）。原来挂机在 `nearestEnemy` 里把它们整个跳过 → 站在它们旁边挨打却不躲。
   现在不瞄准它，但纳入威胁场驱离。存活 **148 → 271 秒**。
2. **清房追击**：房间清空条件是无未死敌人（`game.js:229`），只要有一个漏网的（躲墙后、`rot` 免疫 DoT、
   够不到）整局就停摆。实测探针看到「敌人只剩 1 个、击杀数 50 秒不动」。
   现在：房间激活但**没有可射击目标**时，0.5 秒后主动朝最近敌人逼近。
   存活 271 → **323 秒**，击杀 30 → **53**。

两处都是**存活与击杀同向改善**（不是拿命换输出），所以是实质进步。
原始数据：`docs/data/despair-fivelock.jsonl`。

## 11. 入侵抵抗基线（目标②的起点）

入侵抵抗（`RUN_MODE='invade'`）是 Brotato 式竞技场：20 波、最多 6 把武器自动开火、
波间有商店/补给/升级。**挂机不认识它的界面状态**（`ivrole` / `ivstart` / `ivlv` /
`ivcrate` / `ivshop`，统称 `IV_UI`），所以直接开局会软锁。

**能测起来的最小通道**（`--kind invade`）：

1. 构造 `achroma_ivrun` 存档（`{v:1, diff, iv:{wave, role, w:[{id,t}], …}}`），
   字段由游戏自己的 `ivLoadSave()` 逐项校验（`wave` 1..19、`role` ∈ `IV_ROLES`、
   `w[i].id` ∈ `IV_W`、`t` 0..3）。
2. 直写 `STORE.mem`（`STORE.setItem` 在 `locked` 时静默丢写）→ `ivResume()`。
3. `ivResume()` 结束后 `G.state='ivshop'`；用游戏自己的 `ivNextWave()` 进战斗，
   状态路径会打印成 `ivshop → play`。
4. 关掉 `autoRestart`，否则死亡会被自动重开，样本变脏。

### 基线（seed 7 / 23 / 41，despair，角色 rounded，起始第 5 波，×8）

| 种子 | 游戏秒 | 到达波次 | 击杀 | 受击 | 伤害 | 结局 |
|---|---|---|---|---|---|---|
| 7 | 19.6 | 6 | 47 | 3 | 1470 | 阵亡 |
| 23 | 21.7 | 6 | 52 | 2 | 1675 | 阵亡 |
| 41 | 40.2 | 6 | 128 | 4 | 4180 | 阵亡 |
| **均值** | **27** | **6.0** | **76** | — | — | 全灭 |

**结论**：绝境入侵下挂机稳定卡在**第 6 波**（起始第 5 波＝撑过 1 波多），
三颗种子一致，说明这是结构性瓶颈而不是随机波动。目标②的起点就是 6 波 / 20 波。
原始数据：`docs/data/invade-baseline.jsonl`。

命令：

```bash
nix run .#bench -- --kind invade --diff despair --role rounded --wave 5 \
                    --seconds 45 --speed 8 --seed 7
```
