# 自我进化 · SELF-EVOLUTION

## 它需要什么，现在有什么

| 要件 | 作用 | 状态 |
|---|---|---|
| **基因组**（可变参数） | 定义搜索空间 | ✅ `auto.js` 的 `GENE_DEF`（12 个基因） |
| **适应度函数** | 怎么算「更好」 | ✅ `bench` 的 `score = floors × 100000 − penalty` |
| **固定评估集** | 保证可比 | ✅ 固定种子列表 + 同批次 |
| **选择循环** | 迭代改进 | ✅ `evolve.js`，**已端到端跑通** |

## 基因组（12 个）

| 基因 | 默认 | 范围 | 影响 |
|---|---|---|---|
| `dashDanger` | 1.6 | 0.6–3.2 | 危险值达到多少就冲刺 |
| `bandNearLo/Hi` | 40/90 | 20–160 | FOCUS 态交战距离带 |
| `bandFarLo/Hi` | 90/150 | 50–260 | KITE 态交战距离带 |
| `meleeLo/Hi` | 28/49 | 16–90 | 近战交战距离带 |
| `retreatHi` | 250 | 170–340 | 撤退时拉多远 |
| `goalGiveUp` | 90 | 40–160 | 目标卡多久放弃 |
| `wallMargin` | 12 | 4–28 | 拒绝贴墙的最小间距 |
| `hazardPad` | 1 | 0.4–2.4 | 危险判定额外余量 |
| `aimLead` | 1 | 0.4–1.8 | 瞄准提前量 |

未提供基因组时全部取默认值，**行为与手工调参完全一致**（不改变现状）。

## 遗传算法（`site/tools/evolve.js`）

```
T1 = 当前默认基因组（永远保留，防止退化）
P0 = T1 + (pop−1) 个随机变异体
for gen in 1..G:
    每个个体跑 seeds 里的全部种子 → fitness = mean(score)
    精英 = 最优个体（直接进入下一代，不重新评估）
    其余 = 锦标赛选择(2) × 交叉 × 变异
输出：历史曲线 + 冠军基因组
结束：恢复 TSW.auto.opts.genome，绝不把候选留在线上
```

### 用法

```bash
# 命令行（无人值守）
node scripts/headless-bench.mjs --kind evolve --gens 6 --pop 8 --seeds 1,5,13,23,31
# 页面上（工坊面板 autotest 协议）
?autotest=evolve&gens=6&pop=8&seeds=1,5,13,23,31
```

运行时每代打一行 `[evolve] gen N: best <fitness> ...`，结束打 `TSW_RESULT`。

## 已知问题（诚实记录）

**端到端尚未跑通。** 现象：`evolve` 分支没有产出 `TSW_RESULT`，日志也没有 `[evolve] attached`。
已定位到两个真实 bug 并修复：

1. `evolve.js` 用了 `window.TSW`，但 `core.js` 实际发布的是 **`window.__TSW`**
   （其他工具如 `explore.js`/`bench.js` 都用的 `__TSW`）——已修；
2. 面板曾因 `SLIDER_STEPS` 的 TDZ 崩溃，导致整个 `panel.js` 不执行——已修。

仍存疑点：`TSW.bench.run` 在循环里被连续调用时，可能与 `evolve` 自身设置的
`running` 标志或 bench 的 `autoRestart` 状态互相干扰。下一步先加一条
**不跑 bench 的 `EV.selftest()`**（已实现），用它在浏览器里单独验证基因组管道。

## 为什么这条路值得走

这个系统的自动挂机有 **12+ 个人工拍定的常数**（距离带、放弃阈值、冲刺阈值……），
每一个都只能靠「改一次、跑 12 局、看统计」来调，一轮十几分钟。
进化循环把它变成「跑一晚上、自动收敛」，而且是**用同一套评分和同一批种子**，
不会像人工调参那样被批次漂移骗。

前提是测量够稳。当前 `score` 已做到「进度决定性」，比早期的 `gameT` 稳得多。
