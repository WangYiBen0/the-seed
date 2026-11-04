# TASKS — 当前待办（短期）

> **分工**：长期目标写 `ROADMAP.md`；**这里的只放这一阵要做的事**，做完勾掉。
> 会话里的 `todo` 工具是「本轮即时步骤」，DSH 每次 `turn/start` 就清空
> （`todo/tool-todo/src/index.ts:119`），而 goal 每推进一轮就是新一轮 ——
> 所以**跨轮跟踪只能靠这个文件**。

---

## 待办

- [ ] **原版机制总账 + 刷分 bug**（用户 2026-11-02 提出，已完成文档，待复核）
      要求一：把原版里所有**神秘/未解释机制**与**历史遗留包袱**（色彩、命名、难度表、
      存档字段、死代码等）全部找出并汇总写到 `docs/`。
      要求二：找出本版本**刷分 bug**（官方榜单前五名用的那个），写清触发路径与证据。
      产出：`docs/mechanics.md`（总索引）+ `mechanics-rooms.md` / `mechanics-combat.md` /
      `mechanics-modes.md` / `mechanics-legacy.md` + `score-farm.md`。
      纪律：每条结论必须带 `文件:行号`，无源码支撑的一律标「未证实」。

- [ ] **入侵抵抗**：当前 6.25 波（最好 8），目标 20 波通关。
      已试过 4 个方向，只有 `tank` 有效。下一步需要一个**结构性**的改动，
      而不是继续调参数（噪声已证明掩盖不了小改动）。
- [ ] **五锁过层**：清战斗房 1.2–1.7（需 11 间）。已证明瓶颈不是火力、
      不是空转、不是换枪——但**没找到真因**。
- [ ] **无尽**：尚未建立任何基线。
- [ ] **真实云存档写入验证**：需用户授权（会覆盖官方存档）。

## 已完成

- [x] **部署 gh-pages（新结构）**：commit `32d609a`，Pages build `built`。
      线上校验：`index.html` 7683B / `upstream/index.html` 70506B 均与本地**逐字节一致**；
      `docs/benchmark.md` 返回 **404**（内部文档已撤下）；headless 实跑线上站点
      `achroma:true state:intro`，**零异常、零资源加载失败**。
      真实浏览器实测行为：`frames:1, cta:true, barHidden:true, innerTsw:"undefined"`（注入前无工具）→
      点注入后 `ctaGone:true, barOn:true, inner:{tsw:"object", auto:true, panel:true}`。

- [x] `:8000` 根路径 404 —— `serve.mjs` 从不把 `/` 映射到 `index.html`
      （`join(ROOT,'/')` 是目录，`stat` 判「非文件」）。实测修后 `/ 200`、`/nope 404`。
- [x] 三入口分清：`/` 宿主页 · `/game.html` 纯游戏 · `/auto.html` 游戏+工具（仅无头）。
- [x] bench 断链回归 —— `game.html` 变纯游戏后 bench 仍指向它，`?autotest` 永不触发。
      复现 `rc=124` 无结果；改指 `auto.html` 后 `rc=0 tps=479.7 inRun=true`。
- [x] 性能模式真优化 —— 包装 `render()` 屏蔽全屏合成层 + `QS.part=0`。
      实测 **419.4 vs 231.2 tps（+81%）**。
- [x] 躲弹幕测评不刷怪 —— 结果行引用已删除的 `floor`，每次抛 `ReferenceError`。
      修复后 `spawned=7, valid=true`。
- [x] 面板孤儿代码（`INJECT_FALLBACK`/`copyInject` 残留）已删，区块数 14 → 13。
- [x] 面板可折叠（13 块平铺 → 7 块默认收起，实测 `collapsedCount=7`）。
- [x] 复选框计数冻结（勾选后 `13/16` 不刷新）已修。
- [x] `runner` 日志按批次隔离（`--tag`），消除批次互写造成的「不可能数据」。
- [x] 无产出必重试（旧逻辑要求退出码非 0，但 bench 会 `exit 0` 且无输出）。
- [x] 云存档写入机制厘清（宿主代写，非 HTTP）；原「需要 VIP1」结论已作废（§155）。

---

## 事实性限制（不是待办）

- 本机 chromium 启动会稳定失败在某些种子上，代码无法消除。
- 71 条历史五锁数据**没有** `hpTaken/arTaken/hitsApplied`（0/71），受击分析无效（§156）。
- 官方云存档写入在真实账号上未验证。

## 用户明确偏好（违反=返工）

- 中文；结论先行；每个数字必须有出处；没跑就说没跑；不许编造验证结果。
- 面板/HUD 默认隐藏（F8/F9/F10）；无 `?v=`；锁血≠无敌；没视线不开火；不冲沟不撞陷阱。
- Conventional Commits；subject 不塞测量数据。
- **用户提的要求先写进待办再动手**；长期目标写 `ROADMAP.md`，不要写 todo。
## 已完成（2026-11-03 新增）

### 查明「无明确任务」的 116 秒在做什么 —— **已完成**


`seed 19` 五锁探针显示：400 秒预算里 **116 秒 `A.status.note` 为空**（29%），
另有 22 秒「空目标点：放弃」。两者合计 31% 的运行时间没有进展。

而这一局**跑满 448 秒没死**，说明瓶颈不是时间不够，而是利用率。

这是 157 轮里第一个指向具体可修缺陷的线索。
**下一步：给探针加 `A._goal` / `A._pickTries` / 当前目标位置等字段，定位空转的具体分支。**

**结果**：那段时间里 bot 被单一目标钉住（一把地上的武器占 83 秒，
`gs=88s` 直到 90 秒的 `goalGiveUp` 兜底）。修复：`pickupLeap` 给可选目标
25 秒时限（§252）。**实测清房 1.39 → 1.44，无实质改善**（§253）——
浪费不等于可转化为产出。

### 五锁证据链已闭环（§264 前后）

七环证据写进 `ROADMAP.md`：清房要求房间无活敌 → 每房 2–4 波 →
波次卡在 `ashbrute`（活 175 秒）→ 集火已最优 → 输出靠装备 →
主动获取装备无效 → 锻造房仅 37.5% 楼层出现。

**结论：五锁 1.67 房是当前约束下的真实上限。**

## 进行中（2026-11-05 01:25 启动）

### 基因训练首轮（evolve.js，目标里的「训练」正主）

`node scripts/headless-bench.mjs --kind evolve --gens 4 --pop 6 --seeds 1,5,13 --seconds 420 --timeout 100 --speed 8 --diff despair --mods rage,deathfight,bulwark,rot,cyst --out .tmp/evolve.jsonl`

后台作业 bash-4f035e4e0b334dbf，预计 80–90 分钟（~02:45）。提醒 schedule-444ef9b6 已设（03:00 前后触发收取）。

**收结果后**：提取冠军 genome → `room-ab.mjs --b '{"genome":{...}}'`（6 种子 × 3 重复）→
显著优于默认则设默认并更新基线；无差异则如实记录。**训练期间不要跑并行基准**（避免 CPU 竞争扰动 speed=8）。
