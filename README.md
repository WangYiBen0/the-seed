# [TheSeed] 非官方离线镜像（ unofficial offline mirror）

> **声明 / Disclaimer**
> 游戏《[TheSeed]》（内部代号 EMBER / ACHROMA）的**著作权归原作者所有**，
> 游戏发布于 [dzmm.ai](https://www.dzmm.ai) 平台，上游游戏页面：
> <https://www.dzmm.ai/api/gamefy/static/90e4b323-9859-482f-9eb0-7cba6f44a51b/__v1792075608601/>
> **本仓库不是、也不声称是这款游戏的原创作品** —— 它只是一个**非官方的、
> 离线的镜像**，供在无法访问上游平台时游玩与学习使用。
> 本镜像**未修改任何一行游戏源码**；仓库中 `site/js/` 内的全部游戏脚本是
> 从上游页面按字节原样保存的副本（见 `site/js/FILES.txt` 的指纹清单）。
> 如原作者或平台方提出要求，本仓库将立即下架。

## 这是什么

一个把《[TheSeed]》搬出 dzmm 平台的静态站点（可直接部署到 GitHub Pages），
外挂了三样东西：

| 组件 | 说明 |
|---|---|
| `dzmm-shim.js` | 在 `localStorage` 上模拟 dzmm 平台 SDK（`dzmm.kv/*` 等），游戏照常读写存档、AI/排行榜按平台外状态优雅降级 |
| `tools/*` | 工坊：倍速（×0.25–×16）、操作宏（录制/回放/循环/导入导出）、自动挂机、可视化测评 HUD、宏+倍速基准、无尽流派测评 |
| `docs/*` | 无尽挂机流派指南（源码机制分析）、benchmark 方法与数据 |

游戏本体、玩法、美术、文本均属原作者；本仓库新增的只有
`index.html`、`dzmm-shim.js`、`tools/`、`docs/` 与部署脚本。

## 使用

```bash
nix run .#serve          # 本地起服务 → http://127.0.0.1:8000
# 或者任何静态服务器：
python3 -m http.server -d site 8000
```

打开页面后左侧是「[TheSeed] 工坊」面板：

- **状态**：倍速（热键 `-` / `＝`）、性能模式、随机种子（复现用）
- **宏**：● 录制 / ■ 停止 / 保存 / 回放 / 循环 / 导入导出（时间轴为游戏内时间，任意倍速下精确对齐）
- **挂机**：战斗模式 / 全自动（探索·战斗·购物·无尽传送门），四种选卡流派
- **测评**：无尽流派对比跑分（策略 × 种子矩阵）
- **基准**：引擎吞吐 / 宏+倍速 / 全自动一局，一键跑分并导出 Markdown
- **存档**：导出/导入/清空（仅本镜像的 localStorage，不影响上游账号数据）

命令行跑分（无头浏览器）：

```bash
nix run .#bench -- --kind fullrun --seed 7 --policy bloom --goal-depth 1 --speed 8
```

## 上游更新了怎么办

游戏在上游持续更新，因此本镜像**从不改动**游戏脚本。上游版本更新后：

```bash
# 1. 浏览器打开上游游戏页面，Ctrl+S 保存为"网页，全部"，替换 ./[TheSeed]/
nix run .#sync     # 把新脚本按字节同步进 site/js/（只改变化的文件）
# 2. 校对 site/js/FILES.txt 的差异，提交
```

`js/platform.js`（上游的平台启动层）会按 `GAME_SCRIPTS` 清单加载 `js/*.js`，
同步脚本会校验清单完整性。

## 部署（GitHub Pages）

`gh-pages` 分支即站点内容（把 `site/` 原样推到 `gh-pages` 分支根目录，含
`.nojekyll`）。当前部署：<https://wangyiben0.github.io/the-seed/>

重新发布：

```bash
rm -rf .tmp/ghp && mkdir -p .tmp/ghp && cp -r site/. .tmp/ghp/
cd .tmp/ghp && git init -q -b gh-pages . && git add -A && git commit -m "pages: publish"
git push -f https://github.com/WangYiBen0/the-seed.git gh-pages
```

启用方式：仓库 Settings → Pages → Source: **Deploy from a branch** →
`gh-pages / (root)`（已配置）。若你更想用 GitHub Actions，见
`site/docs/deploy-workflow.yml.example`（需要带 `workflow` scope 的 token）。

## 免责

- 本镜像与 dzmm.ai 及原作者**无任何隶属/合作关系**；
- 不接受任何形式的游戏内付费功能代理（AI 绘画/聊天等需要平台账号的功能在镜像中一律离线）；
- 工具仅用于本地学习研究；请在支持创作者的前提下游玩原作。
