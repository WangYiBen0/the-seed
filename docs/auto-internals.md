# auto.js 内部结构

> 这份是**模块参考**：写挂机代码时查这里，不要塞进 `AGENTS.md`（那里只放规范）。
> 变更代码后请同步更新对应条目。

## 入口

- `TSW.hooks.beforeTick(drive)`，每 tick 一次。
- `A.status.note` 是当前动作，调试先看它。

## 模态必须驱动（否则整局冻结 / 软锁）

`G.hintQ`、`NAMEED.open`、`OVL.open`（picker，如军械库）、`G.state === 'labq'`（实验血清）、
`G.state === 'dialysis'`（透析机）、`talk`（营地篝火对话）、`cards` / `curse`。

**新增交互物或弹窗时，先确认游戏用哪个 state 冻结**。

## 输入

游戏用按下沿 `pressed(k) = keys[k] && !prev[k]`，所以一切按键走**边沿安全**的 `tap()`
（`A._tapGap` 强制中间有释放 tick）。直接按住不放只会触发一次。

## 移动

- `pickDir()` = 24 方向 × 3 半径 + `laneClear()` 最大最小余量。
- `moveKeys()` 会**反向补偿** tremor（`hp<=3` 时的 ±27° 旋转）与 reverse 机制。

## 寻路

- 直线畅通就直奔目标（避弹更自然），被挡才用 `gridPath` BFS + `nextWaypoint` 64px 前瞻。
- 绕圈判定用**路标推进**（`travel.adv`），**不要**用「到目标的直线距离」——
  绕墙时距离会变大，会被误判成没进展。

## 威胁场 `spotDanger()`

覆盖：预警圈 `inMech`、子弹最近接近、地刺（含预警期）、虚空格、沟、
陷阱（刀臂按 0.45s 预判、火柱按状态机、毒池）、敌方动态 hazard `G.foeFx`
（`acidPool`/`gasCloud`/抛物落点）与 `G.zones`。

## 性能约束

`hazardAt` 每 tick 被调几十次。**不要**在里面遍历大数组再逐个采样点调用——
`dashSafe` 曾把完整 `hazardAt` 塞进每个采样点，导致 fullrun 静默卡死（无报错）。
当前做法：`dashSafe` 只查弧线地块 + **落点**一次；动态危险用 `hazDyn()` 每 tick 缓存一次。

## 选项（`A.opts`，持久化到 `theseed.tools.settings`）

挂机侧：`dash` `skill` `reload` `partner` `weaponSwap` `mate` `chest` `fount` `labSerum`
`dialysis` `arsenal` `weaponPick` `chipPick` `pickups` `manual` `dashHazards` `noFire`

探索侧：`goalGiveUp` `wallMargin` `specialsFirst` `powerupFirst` `forgeFirst`
`meleeBlock` `fullHpGate` `weaponLateBias` `openSeals` `usePortals` `pickupOrder`

新增选项时**必须**同时写进 `A.opts` 的默认表，否则 `runAB` 会打印
`unknown autoOpts ignored`（实验作废）。

## 武器与换弹

- **换弹空窗**：主武器换弹中且副武器就绪 → `KeyX` 切过去，装好再切回（评分更高时）。
  **任一槽位是近战就完全不换枪**（近战无弹匣，换掉会连带丢失格挡能力）。
- **策略**见 `docs/weapons.md`。要点：穿墙武器（`saw`/`crescent` = pierce 999，
  `shuriken`/`longshot` = 1）要**横向对齐敌群纵列**而不是盲目绕圈；
  近战贴身并主动挥击**格挡弹幕**（`deflectBullets` 销毁子弹 + 35% 反弹 8×dmg）。

## boss 激光

`G.lasers` 是「从 `r0`（多为 46）到 `len`（420~460）的线段」，`a` 随 `va` 旋转；
**`r0` 以内无伤害**。`laserPush()` 给逆向扫射的切向力 + 就近内缩/外撤。

## 实验血清

- `α` 期（`G.exp.id==='a' && left>0`）：受伤扣**血量上限**，不可逆。
  该期间前瞻 1.35s、权重 ×1.9、交战带放大 1.5 倍。
- 优先级最高（早于 powerup/seal/reward）。副作用是「接下来 3 场战斗」，
  只在**真正打过有敌人的房间**时递减（`expBattle` 挂在 `unlockRoom`），
  所以不许带着副作用下一层。

## 满血过层门槛

治疗泉只回 **2 点血且一次性**，所以只在 `p.hp+2 >= p.maxHp` 时才去；
每层给 45 秒窗口，超时放弃。

## 基因组

`GENE_DEF`（12 个可调参数）经 `gene(k)` 读取，优先级：

1. `A.opts.genome[k]`（离线 GA 注入的候选）——**最高优先**，保证历史 A/B 逐位可复现；
2. `A.learn.genes[k]`（**局内在线学习**到的偏移）——见下节；
3. `GENE_DEF[k].def`（手工调参的默认值）。

三者都会按 `GENE_DEF` 的 `min/max` 重新夹紧，所以任何来源都出不了已验证的区间。
离线进化循环见 `docs/evolution.md`。

## 局内在线学习（自我进化 v2）

与离线 GA 的区别：**没有人类写的适应度函数**、**不需要跑一批再回填**、**每 tick 更新**。

- 观测：`auto.js` 每 play tick 本来就在算 `spotDanger(p.x,p.y,p)`（危险场在玩家自身位置的读数）；
- 学分：`reward = (dPrev - dNow) + 1.2 * 掉血量`，掉血再额外扣 1.6，最后裁剪到 ±3；
- 归因：按每个基因**偏离默认值的程度**加权把学分分摊下去——加分就把它推向已偏向的那端，扣分拉回默认；
- 学习率 `lr=0.008`（可调），每 tick 的位移很小，所以是**慢漂移**而非被单局带偏；
- 持久化：`localStorage['theseed.auto.learn.v1']`，读入时逐项夹进 `min/max`；
- **默认关闭**（改挂机行为 = 有副作用），面板「挂机 → 局内在线学习」可开关与重置；
- 进新局清空危险基线（否则新局第一 tick 会拿上一局的坐标算学分，注入假奖励）。

消融与证据：bench `--autoOpts '{"learn":true}'` / `'{"noLearn":true}'`；
结果行必须看 `learnUpdates > 0`（**开了选项不等于跑了**）、`learnGenes`、`learnFrozen`。
`tests/measurement-discipline.test.mjs` 会强制这些字段与默认关。
实测与预注册判据见 `docs/benchmark.md` 291。

## 搭档技能

`G.ptn.cd<=0` 时 `KeyF`（`usePartner`）。

## 流派

`POLICY_W` / `WEAPON_W` 的键 = 游戏自身 12 个入侵偏好：
rounded / brawler / crazy / ranger / mage / chunky / old / lucky / engineer / doctor / mutant / loud。

## 最终稳定状态（面板 `goal.*`）

`goal.weapon` / `goal.skill` / `goal.radio` / `goal.mate` + `serumExclude`，
命中即加权（`GOAL_W`）。

## 优先级（从高到低，改动前先读）

1. 学派血清（实验血清）
2. powerup / seal / reward
3. 拾取（棱镜 / 钥匙 / 武器 / 芯片）
4. 未清房间（按 `roomWeight`）
5. 传送门 —— **只有在附近没有值得捡的东西时**才进（`LOOT_R`）

已用尽的交互物（`it.used`）**绝不选为目标**，否则会在原地反复横跳。
