# AGENTS.md

给在本仓库工作的 AI agent（以及未来的我）的操作手册。**先读这页再动手。**

---

## 0. 这个仓库是什么

`[TheSeed]` 的**非官方离线镜像**：把 dzmm.ai 上的网页游戏原封不动搬下来，加一个
平台 shim 让它离线跑，再挂一套工具（挂机 / 宏 / HUD / 基准 / 指令台）。

- 游戏著作权归原作者所有；本仓库只是镜像 + 工具，**与官方无关**。
- 官方页面：<https://www.dzmm.ai/character/3738712>
- 线上地址：<https://wangyiben0.github.io/the-seed/>（gh-pages 分支）
- 仓库：`WangYiBen0/the-seed`

---

## 1. 铁律（违反 = 返工）

1. **绝不修改上游代码**：
   - `site/js/**` —— 游戏脚本，**字节级**同步自浏览器保存，改一个字符都算破坏（会挡住后续 sync）。
   - `[TheSeed]/**` —— 原始保存页 + 76 个带哈希的上游脚本，是镜像的**来源证据**，必须进 git、不可编辑、**不要 ignore**（见 §7）。
2. **不改上游行为来迁就工具**：所有适配写在 `site/tools/**`、`site/dzmm-shim.js`。
3. **不许编造验证结果**。说「跑通了 / 部署了 / 测试过了」之前必须有一次**真实**的成功输出支撑；
   以前发生过凭想象报告「24/24 通过 + 已部署」，用户当场抓出，代价很大。
   没验证就直说「未验证」。
4. **保持声明**：README 与页面页脚的「非官方镜像 / 非本人创作 / 官网链接」不能删。
5. 每次工具调用都要带 `description`（用户明确批评过缺失）；长脚本先 write 到 `.tmp/` 再执行。

---

## 2. 目录地图

| 路径 | 作用 | 可改？ |
|---|---|---|
| `site/js/**` | 上游游戏脚本（76 个，GAME_V `mvkp5c7g`） | ❌ 只由 `sync` 覆盖 |
| `[TheSeed]/**` | 浏览器保存的原版页 + 76 脚本（来源） | ❌ 只增不删 |
| `site/dzmm-shim.js` | dzmm SDK 的 localStorage 实现 + AI 桥 | ✅ |
| `site/tools/core.js` | rAF 时间扭曲、倍速、种子 RNG、设置、调试镜像、错误环 | ✅ |
| `site/tools/auto.js` | **挂机核心**（最大最复杂） | ✅ |
| `site/tools/hud.js` | 可视化 HUD + 指标装饰 | ✅ |
| `site/tools/bench.js` | 基准：throughput/macro/fullrun/probe/dodge | ✅ |
| `site/tools/explore.js` | 无尽流派矩阵 | ✅ |
| `site/tools/cheats.js` | 无敌/锁血/指令台 `TSW.cmd` | ✅ |
| `site/tools/macro.js` | 操作宏录制/回放 | ✅ |
| `site/tools/panel.js` | 工坊面板（F8）+ autotest 协议 | ✅ |
| `site/inject.js` | 粘到官网页控制台的一键注入 | ✅ |
| `scripts/*.mjs` | 服务/同步/抓资源/无头基准/格式化/语法闸门 | ✅ |
| `tests/*.test.mjs` | 单元测试（42 个） | ✅ |
| `site/docs/**` | 文档 + `docs/data/*.jsonl` 原始数据 | ✅ |
| `flake.nix` | devShell / apps / checks / git-hooks | ✅ |

---

## 3. 常用命令

```bash
nix develop                 # node + chromium + gh + jq + seed-* 助手；并安装 pre-commit 钩子
nix run .#serve             # 起静态服（默认 8000）
nix run .#sync              # 从 [TheSeed]/ 重新同步 site/js/（会校验 GAME_SCRIPTS 完整性）
nix run .#source            # 补抓游戏请求过但仓库里没有的资源（写 asset-manifest.json）
nix run .#bench -- --kind fullrun --seed 7 --policy rounded --goal-depth 1 --speed 8
nix run .#test              # 42 个单元测试
nix build                   # 静态站产物 → result/
nix flake check             # 含 pre-commit 检查
```

**没有 `nix develop` 时**：node 不在 PATH，用
`export PATH="/nix/store/bfqsxlviikq7vlp36kasy5hhamlxlkd2-nodejs-slim-24.19.0/bin:$PATH"`
（store 路径会随 GC 变化，用 `ls -d /nix/store/*nodejs*/bin | head -1` 重新找）。

---

## 4. 上游更新流程（用户说「上游更新了」）

```bash
# 1) 用户重新「另存为」覆盖 [TheSeed]/ 后：
nix run .#sync                 # 输出 synced: N new/changed, M unchanged; 校验脚本完整性
grep -oaE "GAME_V = '[^']+'" site/js/platform.js   # 记下新版本号
nix run .#source               # 资源 base 会轮转，重抓缺失项（通常仍是 57/57）
# 2) 审计新增脚本（新 API / 新资源族 / 新交互物 kind）
# 3) 冒烟 + 跑一局，再提交部署
```

**审计要点**：新脚本是否调用未实现的 `dzmm.*`；是否引用新资源目录；是否新增 `G.inter` 的
`kind`（决定挂机要不要处理）；`STORE_KEYS` 是否新增存档键。

---

## 5. 挂机（auto.js）结构速查

- **入口**：`TSW.hooks.beforeTick(drive)`，每 tick 一次；`A.status.note` 是当前动作，调试先看它。
- **模态必须驱动**，否则整局冻结（软锁）：`G.hintQ`、`NAMEED.open`、`OVL.open`（picker，
  如军械库）、`G.state === 'labq'`（实验血清）、`G.state === 'dialysis'`（透析机）、
  `cards` / `curse`。新增交互物/弹窗时**先确认游戏用哪个 state 冻结**。
- **输入**：游戏用按下沿 `pressed(k)=keys[k]&&!prev[k]`，所以一切按键走边沿安全的
  `tap()`（`A._tapGap` 强制中间有释放 tick），否则按住不放只会触发一次。
- **移动**：`pickDir()` = 24 方向 × 3 半径 + `laneClear()` 最大最小余量；
  `moveKeys()` 会**反向补偿** tremor（`hp<=3` 时的 ±27° 旋转）与 reverse 机制。
- **寻路**：直线畅通就直奔目标（避弹更自然），被挡才用 `gridPath` BFS + `nextWaypoint` 64px 前瞻；
  绕圈用**路标推进**判定（`travel.adv`），不是到目标的直线距离（绕墙时距离会变大，曾经的错）。
- **威胁场** `spotDanger()`：预警圈 `inMech`、子弹最近接近、地刺（含预警期）、虚空格、
  沟、陷阱（刀臂按 0.45s 预判、火柱按状态机、毒池）、**敌方动态 hazard `G.foeFx`**
  （`acidPool`/`gasCloud`/抛物落点）与 `G.zones`。
- **性能铁律**：`hazardAt` 每 tick 被调几十次，**不要在里面遍历大数组还逐采样调用**——
  曾经把完整 `hazardAt` 塞进 `dashSafe` 的每采样点，结果 fullrun **静默卡死**（无报错）。
  现在 `dashSafe` 只查弧线地块 + **落点**一次；动态危险用 `hazDyn()` 每 tick 缓存一次。
- **选项**都在 `A.opts`（持久化到 `theseed.tools.settings`）：`dash` `skill` `reload`
  `partner` `weaponSwap` `mate` `chest` `fount` `labSerum` `dialysis` `arsenal`
  `weaponPick` `chipPick` `pickups` `manual` `dashHazards` `noFire`。
- **换弹空窗**：主武器换弹中且副武器就绪 → `KeyX` 切过去，装好再切回（评分更高时）。
- **搭档技能**：`G.ptn.cd<=0` 时 `KeyF`（`usePartner`）。
- **流派**：`POLICY_W` / `WEAPON_W` 的键 = 游戏自身 12 个入侵偏好
  （rounded/brawler/crazy/ranger/mage/chunky/old/lucky/engineer/doctor/mutant/loud）。
- **最终稳定状态**（面板 goal.*）：`goal.weapon` / `goal.skill` / `goal.radio` / `goal.mate`
  + `serumExclude`，命中即加权（`GOAL_W`）。

---

## 6. 测试与基准

```bash
nix run .#test                                   # 42 个：决策纯函数 + bench 记账
# 单局
nix run .#bench -- --kind fullrun --seed 7 --policy rounded --goal-depth 1 --speed 8 --timeout 200
# 绝境五锁（修饰符直接进存档，游戏自己校验）
nix run .#bench -- --kind probe --diff despair --mods rage,deathfight,bulwark,rot,cyst \
                    --depth 5 --seconds 20 --speed 8 --timeout 330
# 躲弹幕专项（禁火压力局，v2 单引擎）
nix run .#bench -- --kind dodge --seconds 45 --depth 6 --seed 11 --speed 8
# 多种子：--out 累积后自动多打一行 {"kind":"summary"}（均值/标准差）
```

**读数字的纪律**：

- 单局方差极大（实测 5 种子：`gameT 267±81`、`kills 41±14`，CV 30~35%）。
  **改动的优劣必须多种子看均值**，别用单局下结论（我自己被单局误导过多次）。
- 结果行里 `stall` / `replan` 是绕圈计数器；`hits` 是受击；`dodge` 行用 tick 归一化并带
  `valid` 门槛（`ticks<600` 判无效重试，防止「没进战斗 = 0 受击」的假完美）。
- bench 的硬超时是 `--timeout + 60` 秒；probe/dodge 需要 `seconds*1000/min(4,speed)+几秒`。

---

## 7. Git / 提交 / 部署

**gitignore 的坑**（已修，别改回去）：曾经写过一行 `[TheSeed]/`，那是 gitignore 的
**字符类**语法（匹配单个 `T/h/e/S/d` 字符后接 `eed/`），**从未匹配到字面目录**，
造成「以为忽略了、其实没有」，进而让原版页一度没进 git。
现在**故意不忽略** `[TheSeed]/`，`.gitignore` 里有注释说明原因。

**提交**：走 `git-hooks.nix` 的 pre-commit（`nix develop` 里自动装好）：

- `seed-fmt`：行尾空白 / CRLF / 连续空行 / 末尾换行，格式化后自动重新暂存；
- `seed-syntax`：`node --check`；
- `excludes` 明确排除 `site/js/`、`[TheSeed]/`、资源与 data；
- 需要可写缓存：devShell 已设 `PRE_COMMIT_HOME=$PWD/.tmp/pre-commit`（沙箱 `~/.cache` 只读），
  **所以要在 `nix develop` 里提交**。

**部署**（gh-pages 分支根 = `site/` 的内容）：

```bash
# main
git push origin main            # 若 TLS 抖动/凭据助手挂起，用 token 直连：
GH_TOKEN=$(gh auth token)
git -c credential.helper= push "https://x-access-token:$GH_TOKEN@github.com/WangYiBen0/the-seed.git" HEAD:refs/heads/main

# gh-pages 用「基于现有分支的增量提交」，整树 force-push 会被网络掐断
rm -rf .tmp/ghp3 && mkdir -p .tmp/ghp3 && cd .tmp/ghp3
git init -q -b gh-pages . && git remote add origin "https://x-access-token:$GH_TOKEN@github.com/WangYiBen0/the-seed.git"
git -c credential.helper= fetch -q --depth 2 origin gh-pages && git checkout -q -B gh-pages FETCH_HEAD
rsync -a --delete --exclude='.git' ../../site/ ./
git add -A && git commit -m "pages: …" && git -c credential.helper= push origin gh-pages
```

**验证部署（缺一不可）**：

```bash
gh api repos/WangYiBen0/the-seed/pages/builds/latest --jq '.status + " " + .commit[0:7]'  # built <你的 commit>
curl -s "https://wangyiben0.github.io/.../tools/auto.js?cb=$RANDOM" -o /tmp/x.js
python3 -c "print(open('/tmp/x.js','rb').read()==open('/home/.../site/tools/auto.js','rb').read())"
```

> github.io 有 `max-age=600`，CDN 会滞后；**`curl | grep '中文串'` 偶发查不到**，
> 以**字节比对**或带随机参数的读回为准，不要据此宣称失败或成功。

---

## 8. 已知陷阱清单（都是真踩过的）

| 症状 | 真因 |
|---|---|
| 全自动挂机黑屏（HUD 正常、画面全黑） | `Input.mx = clampM(v, window.W)` → `window.W` 是 undefined → NaN 进相机。用 `GW()/GH()` + NaN 防护 |
| 挂机完全不动 | `A._pickTries` 未初始化却在 drive 里访问 → 每帧抛错 |
| 面板后半截功能全失效（AI 设置/指令台消失） | `bench.js` 语法错误（重复形参）→ 整个文件不加载 → `TSW.bench` undefined → `panel.js` 中途抛错 |
| 面板按钮全点不动 | 事件拦截写在 **capture** 阶段；必须用冒泡 |
| 首局机制提示弹窗不消失、模拟冻结 | 每帧 `tap('Enter')` → 沿用 `pressed` 只触发一次；用边沿安全 tap |
| fullrun 静默卡死、无任何报错 | `dashSafe` 里逐采样点调完整 `hazardAt`（含 `G.foeFx`/`G.zones` 遍历）→ 每帧计算量爆炸 |
| 原地转圈 | 只靠「到目标直线距离」判进度（绕墙时距离变大 → 误判）；要用路标推进 |
| 冲刺撞刀臂/踩毒液/冲进虚空 | `dashSafe` 只看 PIT；敌方毒液在 `G.foeFx` 而非 `WORLD.pools` |
| `?v=` 版本参数 | 用户明确要求删除，接受 10 分钟 CDN 缓存 |
| 想忽略 `[TheSeed]` | 见 §7，字符类语法坑，且不该忽略 |
| 单局跑分忽好忽坏 | 真方差，不是回归；多种子看均值 |

---

## 9. 与用户打交道的要点

- 中文交流；结论先行，**数字必须有出处**（哪次跑、什么种子、多少局）。
- 用户会抓胡编：**没跑就说没跑**，被质疑时先自己验（`git ls-remote`、sha256、build 状态），
  别嘴硬。
- 失败要留痕：试过但更差的方案写进文档（例：`docs/benchmark.md` 里「被数据否掉的方差假设」）。
- 用户偏好：面板/HUD 默认隐藏（F8/F9/F10 唤出）；去掉了所有 `?v=`；
  误伤机制（锁血 vs 无敌）必须区分；没视线不开火；不冲沟不撞陷阱；
  流派=游戏自己的 12 个偏好名；躲弹幕只留 v2。

---

## 10. 终极目标（训练三档）

1. 突入探索 · 绝境 · **五锁**（5 个修饰符全开）通关；
2. 入侵抵抗 · 绝境 · **全偏好**通关；
3. 两种模式的无尽 **坚持最久**。

所有工具、选项、寻路、躲弹幕、搭档、武器逻辑都为这三档服务。
当前状态与数据见 `site/docs/benchmark.md`、`site/docs/endless-guide.md`。
