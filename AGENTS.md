# AGENTS.md — 操作规范

给在本仓库工作的 AI agent（以及未来的我）。**开工前读完这页。**
这里只放**规则**；背景、实测数字、踩坑战史在其它文件，按下面的表去查。

| 想知道 | 去哪读 |
|---|---|
| 长期目标、当前状态、已否决方向 | `ROADMAP.md` |
| 当前待办 | `TASKS.md` |
| 实测结论、被数据否掉的假设 | `docs/benchmark.md` |
| 踩过的坑与排查顺序 | `docs/pitfalls.md` |
| 挂机内部结构（模态/寻路/威胁场/选项） | `docs/auto-internals.md` |
| 武器数据 | `docs/weapons.md` |
| 进化、无尽 | `docs/evolution.md`、`docs/endless-guide.md` |

> 会话里的 `todo` 工具是**本轮**计划，每次 `turn/start` 会被清空
> （`todo/tool-todo` 在 `turn/start` 置 `null`），而 goal 每推进一轮就是新一轮。
> 所以**跨轮的东西不能写 todo**：长期写 `ROADMAP.md`，短期写 `TASKS.md`。

---

## 1. 铁律

1. **绝不修改上游代码**：`site/js/**` 与 `site/upstream/index.html` 的脚本内容字节级不可动，改一个字符都算破坏。
   （`site/upstream/index.html` 唯一的例外是它的 `<script src>` 路径前缀，见第 2 节说明。）
   所有适配写在 `site/tools/**`、`site/dzmm-shim.js`。
2. **不许编造验证结果**。说「跑通/部署/测试过」之前，必须有一次真实成功输出支撑。
   没验证就直说「未验证」。
3. **保持声明**：README 与页面页脚的「非官方镜像 / 非本人创作 / 官网链接」不能删。
4. **每个工具调用都要带 `description`**；长脚本先 `write` 到 `.tmp/` 再执行。
5. **用户提的要求先写进 `TASKS.md` 再动手。**

---

## 2. 目录

| 路径 | 作用 | 可改 |
|---|---|---|
| `site/js/**` | 上游游戏脚本 | ❌ 只由 sync 覆盖 |
| `site/upstream/index.html` | 原版页（脚本路径改指 `../js/`，内容不变） | ❌ 内容不动 |
| `site/dzmm-shim.js` | dzmm SDK 的 localStorage 实现 | ✅ |
| `site/tools/**` | 工具（core / auto / hud / bench / panel / …） | ✅ |
| `site/inject.js` | 粘到官网页控制台的一键注入 | ✅ |
| `scripts/*.mjs` | 服务 / 同步 / 抓资源 / 无头基准 / 闸门 | ✅ |
| `tests/*.test.mjs` | 单元测试 | ✅ |
| `docs/**` | 内部文档 + `docs/data/*.jsonl` 原始数据（**不发布**） | ✅ |
| `state/manifest.json` | 同步状态：`version` + 相对路径 | ✅ 由脚本自动生成 |

三个入口各司其职，**不要混淆**：

| URL | 内容 | 给谁 |
|---|---|---|
| `/` | 宿主页（iframe + 注入按钮） | 玩家 |
| `/upstream/index.html` | 原版页（唯一入口，宿主页与 bench 都套它） | iframe 挂载 |
| `/auto.html` | 游戏 + 工具预载 | 只给无头 bench |

---

## 3. 常用命令

```bash
nix develop                 # node + chromium + gh + jq + seed-* 助手
node scripts/serve.mjs --port 8000    # 起静态服（绕开 nix 缓存问题）
nix run .#serve             # 同上，若报 nix 缓存只读则加 XDG_CACHE_HOME=$PWD/.tmp/nix-cache
nix run .#sync              # 从上游重同步 site/js/
nix run .#source            # 补抓缺失资源
nix run .#test              # 单元测试（数量以实际输出为准）
nix run .#bench -- --kind fullrun --seed 7 --policy rounded --goal-depth 1 --speed 8
nix build                   # 静态站产物 → result/
```

没有 `nix develop` 时 node 不在 PATH，用
`ls -d /nix/store/*nodejs*/bin | head -1` 找到后加进 PATH。

---

## 4. 提交规范

**Conventional Commits**，用户明确要求：

```
<type>(<scope>): <subject>

[body]
```

- `type`：`feat` `fix` `perf` `refactor` `docs` `test` `build` `ci` `chore` `revert`
- `scope`：`auto` `bench` `panel` `hud` `core` `invade` `explore` `deploy` `sync` `serve` `flake`
- `subject`：**祈使句、小写开头、不加句号**，一句话说清改了什么
- **不要把测量数据写进 subject**，结论与数字写 body 或 `benchmark.md`
- 同类小改动**合并成一个提交**

本机提交需要绕开 pre-commit 的缓存目录：

```bash
PRE_COMMIT_ALLOW_NO_CONFIG=1 PRE_COMMIT_HOME=$PWD/.tmp/pre-commit git commit ...
```

推送（TLS 常抖动，**必须循环重试到远端 SHA 对上才算成功**）：

```bash
export GH_TOKEN=$(gh auth token)
git -c credential.helper= push "https://x-access-token:$GH_TOKEN@github.com/WangYiBen0/the-seed.git" HEAD:refs/heads/main
gh api repos/WangYiBen0/the-seed/commits/main --jq '.sha[0:7]'
```

---

## 5. 验证要求

改完代码、跑实验之前，**必须确认改动真的落盘**：

```bash
grep -c "<新符号>" site/tools/auto.js     # 必须 > 0
```

否则补丁脚本可能在写盘前就失败了，而 fmt 与测试照常通过——你会拿一个不存在的
选项做实验。`runAB` 会额外检查 `autoOpts` 的键，打印
`AB: unknown autoOpts ignored` 时**实验作废**。

**部署必须验证字节**（github.io 有 CDN 滞后）：

```bash
gh api repos/WangYiBen0/the-seed/pages/builds/latest --jq '.status + " " + .commit[0:7]'
curl -s "https://wangyiben0.github.io/the-seed/index.html?cb=$RANDOM" -o /tmp/x.html
python3 -c "print(open('/tmp/x.html','rb').read()==open('site/index.html','rb').read())"
```

`curl | grep '中文串'` 偶发查不到，**不要据此断言成功或失败**。

---

## 6. UI 与运行时约定

- 面板 / HUD 默认隐藏，F8 工坊 / F9 HUD / F10 指令台。
- **工坊区块默认全部折叠**；指令台是**独立浮层**，不在工坊里。
- 选项必须持久化到 `theseed.tools.settings`，且默认值按副作用分组（有副作用的默认关）。
- 无 `?v=` 缓存参数。
- 锁血 ≠ 无敌，二者必须区分。
- 没视线不开火（除非显式开启）；不冲沟、不撞陷阱、不进虚空。
- 流派名用游戏自己的 12 个偏好名。

---

## 7. 测量纪律

- **多种子看均值**。单局方差很大（CV 30–35%），单局结论基本无效。
- **A/B 必须同批次交错**。跨批次基线会漂移，跨批比较得出的「改善」多半是假的。
- **先用一批稳定产出数据，再谈优化**。历史上多数「数据作废」根因在测量链路
  （日志互写、静默丢结果、墙钟误杀、遗留作业），不在分析本身。
- 结果行必须能区分**超时 / 中止 / 死亡**，不要把中止读成超时。

---

## 8. 与用户打交道

- 中文；**结论先行**；每个数字都要能追到出处（哪次跑、什么种子、多少局）。
- 用户会抓胡编。被质疑时先自己验（`git ls-remote`、sha256、build 状态），别嘴硬。
- 试过但更差的方案写进 `benchmark.md`，留下否决理由。
- 失败要留痕，不要粉饰。
