# [TheSeed] 无尽挂机最佳流派指南（源码机制分析 + 工具实测）

> 本文由非官方镜像项目写成：机制结论来自对游戏源码（v78，脚本指纹 `mv9nfppo`）
> 的逐条阅读；动态数据来自镜像自带的「自动挂机 × 倍速」跑分工具（见
> `benchmark.md`）。**挂机 AI 的操作水平有限**，动态数据用于方向性对比，
> 不代表人类操作上限。游戏著作权归原作者所有。

---

## 1. 无尽模式到底在跟什么较劲

打完最终 Boss 后进入红色传送门进入无尽（或暂停菜单主动结束）。游戏锁定
`statFloor() = 4`（核心实验室档位），并按 `ENDLESS_GROW` 逐层加深：

| 项目 | 每层增长 | 上限 |
|---|---|---|
| 怪物生命 mhp | ×(1 + 0.35×depth) | **无上限** |
| Boss 生命 bhp | ×(1 + 0.35×depth) | **无上限** |
| 弹幕密度 barrage | ×(1 + 0.06×depth) | ×3（实际 `bpace()=min(1,v)`，只放慢不加速） |
| 攻击欲望 aggr | ×(1 + 0.08×depth) | ×4 |
| 每波数量 wave | ×(1 + 0.07×depth) | ×3 |

怪物基础生命（第 5 档位）：

```
hpMul = (1 + 4×0.55 + 16×0.12) × powerScale() × diffV('mhp')
      = 5.12 × powerScale()        （经典难度）
再乘 (1 + 0.35×depth)：depth=10 ≈ ×25.9，depth=20 ≈ ×100
```

**第一个大原则**：怪物 HP 指数增长，你的大部分伤害是"固定值"。
挂机流派的一切规划都围绕下面两件事：

1. 让伤害中**有一部分按敌人 maxHp 的百分比结算**（唯一随深度放大的成分）；
2. 理解 **powerScale**：你拿的很多血清会**同时让怪物变强**——见下节。

## 2. powerScale：哪些血清是"免费"的，哪些不是

`powerScale()`（combat.js）：以下血清每级 **+3% 怪物生命**，每个协同 **+6%**，
总上限 **×1.35**（Boss ×1.15）。进入无尽时该倍率**冻结在 `powCap`**
（`startEndless()` 时快照）。

```
计入 powerScale（让怪变强）：
  标签 ∈ { POWER, CRIT, ELEMENT, FORM, HUNT, ALLY, DASH }
  白名单 id ∈ { glass, pristine, bloom, fury, shrap, hotb, lastround, primed, rnova }

完全免费（不进公式）：
  leech（KILL）、plate / vital / spite（SURVIVE）、swift（MOVE）、
  quick / extmag / tactical / bottomless（AMMO）
```

注意 **bloom / shrap / fury 虽然标签是 KILL，但 id 在白名单里——照样让怪变
强**（每级 +3%）。这是很多"引爆流"攻略会算错的地方。

推论：

- **进无尽之前**，把会冻结的输出系往 ×1.35 顶格拿（keen/heavy/frenzy/fork/
  guill/big/stat/drone…）——反正怪的血量上限已经被你抬到封顶，之后白拿；
- **进无尽之后**，只有"免费清单"里的血清是零成本成长；拿 bloom/shrap/fury/
  keen 等每级都让所有怪 +3% 生命——只有当你判断"这一级带来的输出 > 全场怪
  +3% 血"时才值得拿（引爆流早期往往值得，后期不划算）。

## 3. 随深度放大的伤害：只有 maxHp 百分比

| 机制 | 公式（源码） | 随深度？ |
|---|---|---|
| **NECROTIC BURST（bloom）** 击杀引爆 | `e.maxHp × [0.26, 0.38, 0.49][lv] + 3` | ✅ 完全跟随 |
| **EUTHANASIA（guill）** 处决 | 非 Boss HP < `(8 + 4×lv)%` 直接归零 | ✅ 阈值按百分比 |
| 燃烧 DoT | `(1+层数) × (1+burn×0.35) × 0.7` | ❌ 固定 |
| 中毒 DoT | `层数 × (1.5+0.8×lv) × 0.5 × 2.2`（第5档） | ❌ 固定 |
| 武器面板伤害 | 武器基础 × (1+0.25/级) × 系数 | ❌ 固定 |

bloom 引爆是**命中管线里的真伤害**（走 `hitEnemy`，吃暴击/易伤等修正），
半径 42px（3 级），配合 `shrap` 的骨刺（协同 CASCADE NECROSIS：骨刺爆炸）
与 `ember`（协同 SPONTANEOUS COMBUSTION：爆炸点燃全场）形成雪球。
但引爆的**第一滴血必须由武器面板打出来**——武器 DPS 决定起爆速度。

## 4. 实测：同一个挂机所，三套 build 打模拟深度 5

工具 `probe` 会**直接构造存档**（走游戏自己的 `loadSave` 校验，不改源码），
把游戏投放到第 5 章并设 `endless=depth`，然后让自动挂机打 90 游戏秒。
同一 seed（7），同版本，×8 倍速，战斗时间归一化（combat-only）：

| build | 武器(满锻) | 血清 | 击杀/分(战斗内) | 伤害/分(战斗内) |
|---|---|---|---|---|
| **crit/heavy 满配** | RAIL | keen4 + heavy5 + frenzy5 + needle3 | **54.0** | **1194** |
| 引爆链+高频武器 | HAIL | bloom3 + shrap3 + ember1 + fury1 + leech1 | 31.4 | 723 |
| 裸装 | NAIL | — | 40.5 | 825 |

（数值取自两次运行的中位趋势；挂机所方差较大，精确数字见 `benchmark.md`
第 4 节与 `.tmp/probe-ab*.jsonl`。）

**解读**：

1. **weapons 的 DPS 上限决定起爆与清理速度**——RAIL 这类高面板武器配
   crit/heavy/frenzy（powerScale 冻结前白拿）碾压低面板高频武器；
2. 引爆链（bloom+shrap）不是"不厉害"，而是**起爆慢**：HAIL 的面板太低，
   第一只怪都要打半天，雪球滚不起来。引爆链的正确打开方式是
   **高面板武器 + bloom/shrap 做 AoE 补刀**，而不是"低面板武器硬灌"；
3. 引爆链组件全部计入 powerScale（白名单），在无尽里边际成本递增——
   **它是一条"进无尽前的成型路线"，不是"无尽里的免费午餐"**。

## 5. 最终推荐：无尽挂机路线

**开局 → 无尽（目标：把 powCap 顶到 1.35 并成型）**

1. 武器：**RAIL / LONGSHOT / SCATTER**（高面板，满锻造 +75% 伤 +30% 速）；
   黑市解锁的 4 把重武器（sonic/barrage/thermite/recoilless，5 证明/把）优先买；
2. 血清（冻结前，全部"白赚"）：`heavy ×5 → keen ×4 → frenzy ×5 → fork ×3 →
   needle ×3 → guill / big`；
3. `bloom ×3 + shrap ×3`（AoE 清屏 + 无尽深度引擎）+ `ember ×1`（爆炸点燃）；
4. 免费生存线随时拿：`plate / vital / leech`；
5. 芯片：**Limit!**（0.2 倍速 5s = 完美走位窗口）> Dash! > Risk!；
6. 黑市：`ADRENALINE`（HP≤3 无敌 3s/60s CD）必买；`RESERVED SERUM` 选 heavy
   或 keen；样例筛滤（EXCLUDE/SKIP）留到无尽里排除副作用血清。

**无尽中（每级都要算账）**

- 拿：`leech / plate / vital / spite / swift / quick / extmag / tactical /
  bottomless`（全部免费）；
- 拿：`bloom/shrap` 补满级——**只在**清屏速度明显不够时；
- 避开：无尽里的 `glass`（+60% 伤害是固定值，-2 maxHp 却是永久的）；
- 锻造：主武器满 3 级后，副武器也满；
- 走位节律：破甲即撤 3.6s 回甲再进场（护甲=3 次免伤，lastHit>3s 回 1）。

## 6. 深度曲线速查（估算）

| depth | 怪物 HP 倍率 | 主要瓶颈 |
|---|---|---|
| 1 | ×6.9 | 无 |
| 5 | ×22.9（powCap 1.35 已含） | DoT 开始失效 |
| 10 | ×42（1.35^10=23.6 → ×121 总计） | 弹幕密度、芯片真空期 |
| 20 | ×1.35^20=404 → ×2000 总计 | 数量顶格（wave ×2.4）+ 帧率 |
| 30+ | ×1.35^30≈8100 → ×41000 | 理论墙：只有 bloom% 和处决线还"在场" |

> 深层唯一的"真输出"是 bloom 引爆（49% maxHp）与 guill 处决线——
> 但引爆的起爆速度仍由武器 DPS 决定。**挂机无尽的最终形态 = 高面板武器
> （冻结期的输出血清）+ bloom/shrap AoE + 免费生存线 + Limit! 芯片走位。**

## 7. 一页纸结论

```
武器：RAIL / LONGSHOT / SCATTER（黑市重武器更佳），双满锻造
冻结前：heavy → keen → frenzy → fork → needle → guill/big → bloom+shrap+ember
免费线：leech / plate / vital / spite / swift / quick / extmag / tactical / bottomless
芯片：Limit! > Dash! > Risk!
黑市：ADRENALINE 必买；RESERVED SERUM = heavy 或 keen
禁忌：无尽里拿 glass；DoT 类（ember 深层只当起爆媒介，别指望烧死谁）
节律：破甲即撤 3.6s；连击不断 = 墨水 ×2；血泉>商店血清>心脏
```

## 附：复现方式

- 机制结论：`site/js/*.js`（未修改的上游脚本）——`game.js`（无尽入口）、
  `difficulty.js`（ENDLESS_GROW/diffV）、`combat.js`（powerScale/PS_TAGS/PS_IDS、
  hitEnemy、DoT、killEnemy）、`enemies.js`（hpMul）、`shards*.js`（血清/协同）、
  `skills.js`（芯片）。
- 动态数据：`nix run .#bench -- --kind probe --depth 5 --build '{"weapons":["rail"],...}'`；
  策略矩阵：`nix run .#bench -- --kind fullrun --seed 7 --policy bloom ...`。
