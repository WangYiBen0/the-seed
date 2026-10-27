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
