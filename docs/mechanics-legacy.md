# 历史遗留包袱 · 死代码 · 未解释魔数

> 范围：`site/js/`（77 个可加载脚本 + `FILES.txt`，共 78 个文件，22831 行）。
> 本文只记录**能追到行号**的遗留物。凡标注「未证实」的，是我只看到代码形状、没有实测确认结论。
> 上游代码字节级只读，本文不含任何修改建议的强制项。

## 结论先行

1. **同一款游戏有三套身份**：源码内部叫 **ACHROMA**（29 个文件头注释），对外叫 **TheSeed**（产品名/中文内容），网络与存档层叫 **EMBER**（8 个文件头 + 所有 `achroma_*` 存储键）。三者不是同义词，是三个不同时代的命名层叠在一起。
2. **版本号有 4 个互不相通的通道**：`GAME_VER='v78'`（成绩上报用）、`GAME_V='mvkp5c7g'`（脚本缓存戳）、页脚硬编码 `'V2.3'`（玩家实际看到的）、`SET.v`（存档迁移水位）。改版本时改哪一个都不影响其它三个。
3. **死代码以「一次性调试开关」为主**：`testOn()` 恒 false 让整个测试面板（`testmode.js` 200+ 行）永远不可达；`CAMP_BACKDROP` 恒 true 让两段人物渲染分支永久短路。
4. **`BOSS_TEST` 是一个 21 处短路的后门**：它在存档、计分、成就、每日任务、活动进度、好感度、市场道具、Modifier、上传等 14 个位置直接把逻辑跳过或改成 `st:'test'`。它**从未在仓库内定义**，只能靠外部注入 `window.BOSS_TEST.on`。
5. **魔数大多数没有注释**；少数有注释的（`ENDLESS_DEPTH`、`INK_RATE`）反而是最好懂的那几个。

---

## A. 命名三重身份

| 身份 | 出现次数（`grep -o`） | 涉及文件 | 典型行号 | 语义层 |
|---|---|---|---|---|
| `ACHROMA` | 30 | 29 | `engine.js:1`、`game.js:1`、`shards3.js:24` | 源码内部代号（文件头 `// ===== ACHROMA xxx =====`） |
| `TheSeed` | 28 | 20 | `camp.js:1`、`i18n.js:332`、`i18n.js:375` | 产品名 / 玩家可见标题 |
| `EMBER` | 39 | 17 | `net.js:1`、`platform.js:1`、`i18n.js:47` | 网络、平台、存档层代号 |

细分：

- **文件头 banner**：`// ===== ACHROMA` 出现在 29 个文件第 1 行（`engine.js:1`、`i18n.js:1`、`world.js:1`、`combat.js:1` …）。
- **`// ===== TheSeed`** 只有 16 个文件第 1 行（`camp.js:1`、`look.js:1`、`market.js:1`、`achieve.js:1` …），另有 12 处出现在正文/字符串里（`i18n.js:332` DLC 标题、`i18n.js:375` `gameTitle`、`prompts.js:16/19` AI 提示词里的《TheSeed》、`girls.js:266` 截图文件名前缀）。
- **`// ===== EMBER`** 8 个文件（`net.js:1`、`platform.js:1`、`players.js→name.js:1`、`overlay.js:1`、`chat.js:1`、`girls.js:1`、`prompts.js:1`、`squad.js:1`），其余 31 处是玩家可见文案：`i18n.js:47` `'THE EMBER LIVES ON'`、`market.js` 的「火種」= EMBERS。
- 有 17 个文件**完全没有** banner 注释（`gamepad.js`、`invade-*.js` 共 12 个、`limited.js`、`modifiers.js`、`stories-data.js`、`stories.js`），说明这批是后期追加、没走同一套模板。

**关键矛盾**：中文文案把 EMBER 译作「火種」，所以玩家看到的是「火种」，代码里是 EMBER，注释里是 ACHROMA，标题里是 TheSeed —— 四层词表指同一件事。

---

## B. 版本与存档迁移

| 项 | 值 / 逻辑 | 位置 | 结论 |
|---|---|---|---|
| 成绩版本 | `const GAME_VER = 'v78'` | `net.js:4` | 只写进上传成绩（`net.js:89` `ver: GAME_VER`、`achieve.js:173` `ver: GAME_VER`），服务端用它判定版本 |
| 脚本缓存戳 | `const GAME_V = 'mvkp5c7g'` | `platform.js:84` | 拼在 `js/xxx.js?v=` 后（`platform.js:120`），与 GAME_VER 无关联 |
| 玩家可见版本 | `text('V2.3', ...)` 硬编码 | `camp.js:651` | 与上面两个都不同步；这是主菜单右下角那行小字 |
| 存档迁移水位 | `if ((SET.v \|\| 0) < 2) { SET.lang = 'zhs'; SET.v = 2; }` | `engine.js:23` | 全仓**唯一**一处 `SET.v` 迁移（`grep -rn "SET\.v" site/js` 只有 1 行命中）；效果是旧存档语言被强制改成简中 |
| 血清迁移标记 | `meltVersion: p.shards.melt ? 2 : undefined` | `game.js:282` | 存盘时写入，读档时 `if (G.S.melt && s.meltVersion !== 2 ...) p.armor = min(...)`（`game.js:342`），用于兼容旧版「骨甲溶解」血清的护甲结算 |
| 战局存档自身版本 | `const s = { v: 1, at: Date.now(), ... }` | `game.js:282` | 字段叫 `v` 但**无人读取**（`grep -rn "\.v\b"` 在 loadSave 区间无匹配）→ 死字段 |

结论：**没有任何一处代码同时校验这 4 个版本号**。`SET.v` 只保证语言迁移跑一次，其它三个各说各话。

---

## C. 死代码（仅列已给检索证据的 3 项）

判定口径：`grep -rn "名字" site/js | wc -l` 的结果 = 定义处 + 取用点总数；若所有取用点都被恒 false/恒 true 短路，即为死代码。

| 名字 | 定义 | 引用计数 | 证据 | 判定 |
|---|---|---|---|---|
| `testOn` | `testmode.js:5` `const testOn = () => false;` | **4** | 定义 1 + `testmode.js:6`、`game.js:584`、`ui.js:424` 三处取用；三处都是 `if (!testOn()` / `testOn() &&` ，恒 false ⇒ 永不进入 | **死开关**：整个 `testmode.js` 测试面板（`F2`/`` ` `` 快捷键、暂停菜单 Test 项）不可达 |
| `CAMP_BACKDROP` | `camp.js:17` `const CAMP_BACKDROP = true;` | **3** | 定义 1 + `camp.js:582` `for (const o of CAMP_BACKDROP ? [] : campGirls())`（恒空数组）+ `camp.js:588` `if (!CAMP.dep && !CAMP_BACKDROP)`（恒 false） | **死分支**：营地女孩/主角的绘制路径永久跳过，只剩背景板 |
| `MOD_AI_BODY` | `modifiers.js:11` `let ... MOD_AI_BODY=null, MOD_AI_RATE=1;` | **3** | 定义 1 + `enemies.js:113` 赋值 + `modifiers.js:34` 读取（`e===MOD_AI_BODY?MOD_AI_RATE:1`） | **活代码**（不是死代码）：`enemies.js` 每帧写入，`modifiers.js` 用于「激怒」修饰符的攻速缩放 —— 反例，留此对照 |

补充说明：`CAMP_BACKDROP` 的定义实际在 `camp.js:17`（`camp.js:15` 是无关的 `campGround` 箭头函数）；以 `grep -n` 结果为准。

#### C2. 12 个「零取用」函数（本轮已全部亲验，`grep -o` 计数均为 **1**）

判定：`grep -o "\b函数名\b" site/js/*.js | wc -l` = 1，即全仓只有定义处，没有任何调用点。

| 函数 | 定义位置 | 计数 | 原本属于哪个旧界面 |
|---|---|---|---|
| `ditherRect` | `engine.js:272` | 1 | 旧的抖动矩形绘制（`ditherLayer` 已取代它） |
| `drawMenuWorld` | `ui.js:643` | 1 | 旧主菜单背景世界 |
| `drawLogo` | `ui.js:657` | 1 | 旧 logo 绘制 |
| `drawMainList` | `ui.js:706` | 1 | 旧主菜单列表 |
| `drawNews` | `news.js:17` | 1 | 旧公告卡（**注意：`news.js:17` 的 `drawNews` 整函数 200+ 行全部不可达**） |
| `drawEmblem` | `look.js:396` | 1 | 旧难度徽章 |
| `drawCampUI` | `camp.js:633` | 1 | 旧营地 UI |
| `thTab` | `look.js:79` | 1 | 旧标签页组件 |
| `pxEllipse` | `difficulty.js:82` | 1 | 旧像素椭圆 |
| `pxDiamond` | `difficulty.js:84` | 1 | 旧像素菱形 |
| `introLines` | `ui.js:739` | 1 | 旧开场文字 |
| `finishIntro` | `ui.js:744` | 1 | 旧开场收尾 |
| `AFF_CLEAR` | `girls.js:4` | 1 | **死常量**：好感度通关奖励 30，定义后再无引用（`AFF_MEET=10` 才是活的那个） |

**这批是「主菜单重写」的历史残留**：新菜单走 `look.js:132 drawMainMenu` + `camp.js:568 drawCampWorld`，
旧的 `ui.js:643-744` 整段（约 100 行）连同 `news.js:17-…` 一起被留在了源码里。

#### C3. 音乐遗留：5 首旧轻音乐「kept but unused」

`audio.js:193` 原话：

> the title screen: one of the heavy scores (h0-h2), never the same twice in a row
> (**the old light themes m0-m4 are kept but unused**)

- 定义：`m0: {` … `m4: {` 共 5 首，`grep -o "m[0-4]: {"` = 5（`audio.js` 内）。
- 唯一残留引用：`audio.js:196` 的兜底 `return this.menuSong || 'm0'` ——
  而 `menuSong` 初始化即为 `'h0'`（`audio.js:194`）且 `pickMenuSong()` 只会产生 `h0-h2`，
  **所以 `'m0'` 这个兜底分支永远走不到**。
- 结论：5 首曲子 + 那段兜底代码都是死资产，体积约 1.2KB 乐谱。

已知还有至少 12 个「只定义、零取用」的绘图函数（`ditherRect` `engine.js:272`、`drawMenuWorld` `ui.js:643`、`drawLogo` `ui.js:657`、`drawMainList` `ui.js:706`、`drawNews` `news.js:17`、`drawEmblem` `look.js:396`、`drawCampUI` `camp.js:633`、`thTab` `look.js:79`、`pxEllipse`/`pxDiamond` `difficulty.js:82/84`、`introLines` `ui.js:739`、`finishIntro` `ui.js:744`），每个 `grep -o` 计数均为 1。这批是旧主菜单/旧营地 UI 的残留（新菜单走 `look.js:132 drawMainMenu` + `camp.js:568 drawCampWorld`）。本轮未逐条展开。

---

## D. `BOSS_TEST` 短路点清单（21 处 / 14 文件）

**定义状态**：`grep -rn "BOSS_TEST" site/js | grep -v "window.BOSS_TEST"` 为 0 —— 仓库内**没有任何赋值**，全部是读取 `window.BOSS_TEST && BOSS_TEST.on`。即它必须由外部脚本注入；未注入时恒为 `undefined`，所有分支走正常路径。

| # | 位置 | 短路了什么 |
|---|---|---|
| 1 | `achieve.js:115` | 成就资格 `achRunEligible()` 恒 false：BOSS_TEST 下本局不计成就 |
| 2 | `achieve.js:154` | `girlsOnClear` 包装：跳过通关次数统计与成就检查 |
| 3 | `boss3.js:20` | `G.formPick` 不再重掷（配合外部固定形态）；`G.absenceHp` 仍被设为 `maxHp*1.65` |
| 4 | `daily.js:21` | 每日任务不推进（`d[k]='done'` 跳过） |
| 5 | `event.js:58` | 限时活动贡献不提交（`evContribute` 直接 return） |
| 6 | `follow.js:41` | `saveRun` 包装后不再写跟随者状态到存档 |
| 7 | `game.js:50` | 不 `pickBoss()`、不 `pickChampRooms()` —— 固定 boss 与固定精英房 |
| 8 | `game.js:243` | 最终层不进「无尽门」（`kind:'portal', endless:true` 不 push） |
| 9 | `game.js:281` | `saveRun()` 整体不执行 → **本局不落盘** |
| 10 | `game.js:322` | `clearSave()` 不删存档（配合 9 保全测试局存档） |
| 11 | `game.js:413` | 通关不置 `SET.cleared`、不 `saveSettings()`、不 `G.newUnlock` |
| 12 | `game.js:706` | 恢复存档时的 rid 校验被跳过 |
| 13 | `game.js:746` | `G.curseDone` 强制 true —— 层间诅咒选择被跳过 |
| 14 | `girls.js:73` | `girlsMeet` 直接 return：不涨 `met`、不加好感 |
| 15 | `girls.js:77` | 同上包装的第二处，好感结算跳过 |
| 16 | `market.js:174` | 黑市「下场出击生效」道具返回空对象 `{}` → 道具全部失效 |
| 17 | `modifiers.js:14` | `hasRunModifier()` 恒 false → 绝境修饰符全部不生效 |
| 18 | `net.js:101` | `submitResult` 直接置 `r.up = { st: 'test' }` → **不上传成绩** |
| 19 | `partners.js:150` | 搭档使用后不加好感、不 `gpSave()` |
| 20 | `touch.js:169` | 不调 `markAssisted()` → 不计入「辅助瞄准」标记（影响成绩 0.85 系数判定） |
| 21 | `ui.js:424` | 暂停菜单**隐藏**重开与结束无尽两项（两处 `...(X ? [] : [...])`） |

**归纳（不下刷分结论）**：这些短路的共同方向是「关掉一切会持久化或会上报的副作用」——存档、成就、好感、市场、Modifier、上传全部冻结，并把 boss/精英房/诅咒固定下来。这与「可复现的 boss 测试局」用途一致；第 18 项 `st:'test'` 是最明确的自证。

---

## E. 未解释魔数（10 个）

| 值 | 位置 | 有无注释 | 用途 |
|---|---|---|---|
| `INK_RATE = .5` | `game.js:90` | **有**（`game.js:89`：`// every ink pickup passes through here: halved for everyone...`） | 零件收益统一腰斩，再叠 `diffV('ink')` |
| `DIFF_MUL = {easy:.5 … despair:2.6}` | `net.js:74` | **无**（只在上方 `net.js:73` 写「keep in sync with server/ach-api.mjs」） | 成绩难度系数；`.85` 辅助瞄准惩罚在同一行赋值（`net.js:78/82`） |
| `ENDLESS_DEPTH = 6000` | `net.js:76` | **有**（`net.js:75`：`// plus 6000 for every endless floor reached`） | 无尽每层 6000 分 |
| `10000` / `1500` | `net.js:78` / `net.js:81` | 半有（`net.js:73` 只说明大类，没解释为什么是 10000/1500） | 通关底分 10000；未通关按层 `floor*1500` |
| `30000 * 900/(900+runT)` | `net.js:81` | **无** | 时间分：`runT=0` 得 30000，`runT=900` 减半；900 秒的由来无注释 |
| `20000/(1+.15*hits)` | `net.js:81` | **无** | 受击分：满血 20000；`.15` 是每次受击的衰减斜率，无说明 |
| `1500`（syn）| `net.js:78/80` | **无** | 每点变异（synergy）1500 分 |
| combo 20 层 +5% | `combat.js:240` | **无** | `1 + min(G.combo,20)*.05`：连击最多 20 层加成、总上限 +100%；与 `COMBO_STEPS`（`combat.js:205`，音高用）是两套独立表 |
| `inv = 1.1` / `inv = .6` | `game.js:101` / `game.js:100` | **无** | 受击无敌 1.1s；护甲抵消后无敌 .6s。`.6` 与护甲上限 3（`combat.js:94`）无联动说明 |
| `hitstop .03 / .25` | `combat.js:238` | **无**；另 `engine.js:241` 有 `hsCd=.14` 与 `min(s,.045)` 的真实上限 | 普通击杀 .03s、boss 击杀 .25s（boss 带 `force` 参数绕过 .045 封顶） |
| `FN_PRI` 数字表 | `net.js:12` | **无** | 服务函数优先级：`limitedSubmit:-1`（抢最高）、`submit/add:0`、`board/mine:2`、`head:4`；数字间隔与 `??3` 兜底无说明 |
| `PEND_RETRY = 60e3` | `net.js:94` | **无**（只有 `net.js:93` 说明「失败就留在队列重试」） | 上传队列重试节流 60s |

补充同类节流（均有行号，**全部无注释**）：`net.js:39` 15 s 列表刷新、`net.js:45` 60 s 清榜刷新、`event.js:48` 活动 20 s/60 s、`event.js:73` 60 s 补交、`limited.js:58` 5 s 重试、`girls.js:238` 5 s/60 s 指数退避。

---

## F. 已核实但本轮不展开的线索（留给后续）

- `engine.js:4` `H=270 / T=16 / US=3` 与 `engine.js:8` `Math.min(640, ...)` 有注释（像素格、UI 3 倍缩放、宽屏上限 640）。
- `engine.js:77` `FLOOR_PAL` 5 套调色板，`engine.js:78` 注释「每层给灰调一点色」；`setFloorPal` 有 5 处调用（`game.js:24/42`、`invade.js:60/62`）→ 活代码。
- `camp.js:38` `CACC` 18 色白名单，`camp.js:9-10` 有 2 行注释解释「只有活的东西保留颜色」。
- `i18n.js:3` `LANGS` 四语种 en/zh(`繁體中文`)/zhs(`简体中文`)/ja；`tr()` `i18n.js:5`、`L()` `i18n.js:462` 都对 `zhs` 特判，`zhs` 缺失时回退 `toSimp(zh)`（`i18n.js:469`，含 `T2S_PHRASE` 9 条短语 + 逐字表）。
- 三套本地化工厂：`N3`/`N4` 定义在 `combat.js:14`，`IZ` 定义在 `invade-data.js:4`（`IZ` 把 `ja` 直接等于 `en` —— 入侵模式未做日文）。
- 存档键共 6 个：`achroma_set`(`engine.js:22`)、`achroma_run`(`game.js:278`)、`achroma_codex`(`ui.js:401`)、`achroma_pending`(`net.js:94`)、`achroma_girls`(`girls.js:33`)、`achroma_evpend`(`event.js:54`)、`achroma_ivrun`(`invade-extras.js:5`)、`achroma_ltpend`(`limited.js:3`)；白名单集中在 `platform.js:10` `STORE_KEYS`（8 个），`platform.js:12` `STORE_NOW` 只对 6 个立即落盘。
### F.1 「看起来像 bug 其实是设计」全量清单（本轮已逐条取证）

| 现象 | 真相 | 取证 |
|---|---|---|
| 世界只有灰色，角色偶尔闪彩 | 颜色由血清点亮，是 build 强度的可视化 | `engine.js:75`、`weapons.js:93-95` |
| 每层画面底色不同 | `FLOOR_PAL` 每层一套灰阶 | `engine.js:76-80` |
| 营地只有火/灯/血有颜色 | `CACC` 18 色白名单，颜色标记"活物" | `camp.js:9-10,38,43` |
| 五锁「腐烂」让火/毒/冰全失效 | `defineProperty` 把 5 个字段的 setter 置空 | `modifiers.js:30` |
| 奖励房不用清怪就能进 | 非 combat/boss 房生来 `cleared: true` | `world.js:75` |
| 锁血 ≠ 无敌 | 两个独立作弊，锁血仍消耗护甲、触发受击效果 | `site/tools/cheats.js:3-5` |
| boss 同色激光打不到你 | 极性染色机制：`pol` 相同则免伤 | `boss.js:640`、`boss.js:657` |
| 陷阱也会打怪 | `traps.js` 的刀/火/毒池同时伤害敌人 | `traps.js:18,24,29` |
| 图鉴在非 DZMM 环境全部解锁 | `cxKnows()` 第一行 `if (!ONDZ()) return true;` | `codex2.js:7` |
| 入侵模式没有日文 | `IZ()` 把 `ja` 直接等于 `en` | `invade-data.js:4` |
| 限量活动结束时间已过期 | `LTC.end` 写死 2026-10-22 00:00 GMT+8 | `limited.js:3` |

### F.2 限量活动：写死的过期时间

```js
// site/js/limited.js:3
const LTC = { end: Date.UTC(2026, 9, 21, 16), title: 't_traveler', pending: 'achroma_ltpend' };
```

`Date.UTC(2026, 9, 21, 16)` = 2026-10-22 00:00 GMT+8。相对当前（2026-11-02）**活动已经结束 11 天**。
`ltPhase()`（`limited.js:24`）在 `ltNow() >= (LT.d?.end || LTC.end)` 时返回 `'ended'`，
所以整个限量任务链路现在走的是"已结束"分支 —— 但 `ltQueueClear()`（`limited.js:48`）**仍然会在
满足条件时往 `achroma_ltpend` 塞记录并尝试上传**，因为结束判定只在 UI 层（`ltPhase`）做，
上报函数里没有复查 `ltPhase()`。

> 这是 task-5（刷分）值得看的一条：**过期活动仍然接受客户端上报**，只要服务端还认这个 `limitedSubmit`。
> 服务端是否已关闭未证实。详见 [`score-farm.md`](score-farm.md)。

### F.3 平衡补丁文件：一个只为接口存在的文件

`balance.js`（全文件 7 行）不是数值表，而是一个**运行期 monkey patch**：

```js
// site/js/balance.js:7-11
const CHAMP_REST = .8;
for (const id of Object.keys(CHAMP)) { const f = AI[id]; if (typeof f !== 'function') continue;
  AI[id] = function (e, dt, ...rest) { ... }; }
```

它把每个精英（champion）的硬编码 `AI[type]` 包一层，强行让精英在每次新冷却后再"休息" 80% 的冷却时间。
文件头注释原话：`rests for another 80% of that cooldown in real time (floor and difficulty speed-ups do not shorten the rest)`。

**这就是"历史遗留包袱"的典型形态**：难度爬升的 bug 被修在一个独立的补丁文件里，
而不是改 `enemies.js` 的 AI 本体。后果是 `CHAMP_REST` 这个魔数只在这里出现一次，
任何人读 `enemies2.js` 的精英 AI 都看不出它实际冷却是名义值的 1.8 倍。

### F.4 黑市/活动道具的双轨解锁

`chipUnlocked`（`event.js:81`）只对 `'ovc'`（Overclock! 技能晶片）生效：

```js
const chipUnlocked = k => k !== 'ovc' || !!((gpLoad().chips || {})[k]);
```

- 未买时：`ovc` 不出现在任何晶片池（`skills.js:17 chipPool`、`game.js:73` 商店）。
- 买了之后：进入池子，但**没有任何地方写 `gp.chips.ovc = true` 之外的解锁标记**
  （`arsenal.js:44` 是唯一写入点）。
- 遗留点：这是"已结束活动的道具转为常驻商店"的补丁，`arsenal.js:4` 注释直接承认
  `Also: Overclock! (the last event's chip) is sold at the black market supplies for 10 embers`。
  换句话说**活动系统被降级成了一行商店条目**，活动本身的代码（`event.js`）还留着。

### F.5 三套本地化工厂并存（N3 / N4 / IZ）

| 工厂 | 定义 | 槽位 | 用在哪 |
|---|---|---|---|
| `N3` | `combat.js:14` | en / zh / ja（3） | 旧的血清、敌人、协同描述 |
| `N4` | `combat.js:14` | en / zh / ja / zhs（4） | 后来重写的血清、武器（补了简中） |
| `IZ` | `invade-data.js:4` | en / zhs（`zh: zhs`、`ja: en`） | 入侵模式全部文案 |

`IZ = (en, zhs) => ({ en, zh: zhs, ja: en, zhs })` —— **入侵模式没有做日文**，
日文玩家看到的是英文；同时它的"繁体"槽位塞的其实是简体。这是入侵模式开发时
"先上线再说"留下的三语缺口。

`i18n.js` 侧：438 条 `STR` 条目里，**279 条有第 4 槽（简中），72 条只有 3 槽**。
缺第 4 槽时 `L()`（`i18n.js:462`）会回退到 `toSimp(s[1])`，
即用 `T2S_PHRASE`（9 条短语，`i18n.js:465`）+ 逐字表 `T2S`（`i18n.js:466-467`）做繁转简。
**逐字表是手写字符串对齐的**（`T2S_SRC`/`T2S_DST` 各约 500 字），改错一个字不会报错，只会静默翻译错。

---

_行号抽查：本文所有 `file:line` 均来自本轮 `grep -n` / `sed -n` 实际输出。_
