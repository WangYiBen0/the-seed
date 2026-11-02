# 武器策略表 · WEAPON STRATEGY

数据来源：`site/js/weapons.js` 的 `dmg / rate / n / pierce / kind`（37 把）。
`基础DPS = dmg × rate × n`。升级每级 +25%（`ivTier`/`wlv`），所以**单发伤害高的武器
吃等级收益更大**（乘在基数上），而**射速高的武器对血清加成更敏感**。

## 一、按「前期/后期」分层

| 层 | 判据 | 武器 | 说明 |
|---|---|---|---|
| **开局即强** | 基础DPS ≥ 40 | `nova`(137) `storm`(62) `mines`(57) `trident`(54) `shuriken`(50) `scatter`(47) `twin`(41) `lance`(40) `helix`(40) | 拿到就能打，适合前期保命 |
| **中段可用** | 25–40 | `hail`(39) `edge`(39) `nail`(35) `prism`(34) `longshot`(32) `fist`(32) `iai`(31) `rail`(31) `scythe`(29) `volt`(29) `flamer`(27) | |
| **后期才成** | < 25 但**单发高**或**有机制** | `hammer`(23/26) `cluster`(24/20) `rail`(31/28) `bow` `graviton` `hive` `bloom` `firework` | 单发 8–28，满级后 +75% 收益；`hive/graviton/bloom` 依赖扩散与聚集 |

**关键结论**：`nail`（初始枪，35）不是最差，但**成长最差**——
单发仅 7，满级也只到 61；而 `hammer`（26/发）满级到 45.5×0.9 ≈ 41，
`longshot`（36/发）满级 63×0.9 ≈ 56.7。**所以前期不该把资源押在 nail 上**。

## 二、穿墙类（pierce）——目前完全没利用

| 武器 | pierce | 基础DPS | 策略 |
|---|---|---|---|
| `saw` | **999** | 11.2 | 无限穿透：**打一条直线上的整列敌人**，应站在门口/走廊对齐敌群纵列 |
| `crescent` | **999** | 21.0 | 同上，单发 14 且可穿透 → 走廊神器 |
| `shuriken` | 1 | 50.4 | 穿 1 个：对**排成一队的敌人**收益翻倍，基础 DPS 已很高 |
| `longshot` | 1 | 32.4 | 单发 36，穿 1 个 = 72 等效，前期就能打出高伤 |

**利用方式**：穿墙武器不该「绕圈近距离」，而应**沿直线对齐敌群**（`laneClear` 已经算过
最空的一条线）——现在挂机对所有武器用同一套走位，这就是没利用的原因。

## 三、逐类机制策略

| kind | 武器 | 机制要点 | 走位策略 |
|---|---|---|---|
| `gun` | nail/hail/storm/twin/rivet/mirage/carom/frostbite/firework | 直射，散射随距离增大 | 中距离（90–150）最好，远了散射打不中 |
| `rail` | rail/trident | 直线贯穿，单发极高 | **必须对齐敌群直线**，不要横切 |
| `beam` | prism | 持续光束，贴身融化 | 越近越好（<90） |
| `chain` | volt | 链式跳电 | 敌人**越密越好**，应主动靠近密集处 |
| `melee`/`fist`/`spin`/`whip`/`slam`/`iai`/`reap`/`thrust` | edge/fist/whirl/whip/hammer/iai/scythe/lance | 近战 + **格挡弹幕**（`deflectBullets`，35% 反弹） | **贴身（<50）**，且可主动挥击消弹 |
| `rocket`/`lob`/`mine` | bloom/cluster/mines | 范围爆炸/延迟 | 打**成群**目标，不要追单个 |
| `chakram`/`orb` | halo/graviton | 回旋/滞留 | 站定等它回来，别持续移动 |
| `bow` | bow | 蓄力，单发高 | 需要站定蓄力窗口 |
| `nova` | nova | 环形爆发（14 发） | **被围时最强**，贴身放 |

## 四、待实现（本轮已记录，下轮做）

1. **按 kind 分派走位**：穿墙武器沿直线对齐、近战贴身、`chain`靠近密集处、
   `nova`被围时使用；
2. **前期/后期权重**：`wScore` 加入「单发伤害 × 等级上限」项，让后期武器在
   拿到锻造后权重上升；
3. **血清优先不再跳过**（当前会把实验血清当普通拾取）。
