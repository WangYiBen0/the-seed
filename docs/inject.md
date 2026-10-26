# 在原版游戏里注入工具（inject）

把工坊面板 / HUD / 指令台 / 挂机 / 宏 / 基准 **搬进官方页面**，不修改官方任何代码，
只往页面追加 8 个 `<script>`。

官方页：<https://www.dzmm.ai/character/3738712>

## 一键注入（复制这一整段，粘到控制台，回车）

```js
(()=>{const B='https://wangyiben0.github.io/the-seed/tools/',F=['core','macro','auto','hud','bench','explore','cheats','panel'];if(window.__TSW)return console.warn('[TSW] 已注入 —— F8 工坊 / F9 HUD / F10 指令台');(async()=>{const bad=[];for(const n of F){await new Promise(r=>{const s=document.createElement('script');s.src=B+n+'.js?v='+Date.now();s.onload=r;s.onerror=()=>{bad.push(n);r()};document.head.appendChild(s)})}if(bad.length)console.error('[TSW] 部分脚本加载失败: '+bad.join(',')+'（若页面有 CSP 限制，请改用镜像页）');else console.log('[TSW] 注入成功 · F8 工坊 / F9 HUD / F10 指令台')})()})();
```

成功时控制台会依次打印 `core ready` … `panel ready`，最后一行
`[TSW] 注入成功 · F8 工坊 / F9 HUD / F10 指令台`。

同一份脚本也在：<https://wangyiben0.github.io/the-seed/inject.js>（可 `view-source` 核对）。

## 注入后能做什么

| 键 | 功能 |
|---|---|
| `F8` | 工坊面板（状态/宏/挂机/测评/躲弹幕测评/基准/指令台/存档/关于） |
| `F9` | 可视化 HUD（DPS、击杀、墨水、楼层曲线；右上 ✕ 关闭） |
| `F10` | 指令台（`help` 看全部指令：`god`、`lockhp`、`ink`、`kill`、`next`、`endless`、`weapon`、`shard`、`skill`、`spawn`、`speed`、`mode`、`policy`、`state`） |
| `-` / `=` | 全局倍速 ×0.25 – ×16 |

挂机、宏、躲弹幕测评、基准都照镜像页一样用；面板默认隐藏，右下角 ⚙ 或 `F8` 打开。

## 必须知道的限制与风险

1. **会写真实存档**：原版页面上的工具运行在 `www.dzmm.ai` 域，`localStorage` 里就是你的
   **真实进度**。指令台的 `ink`/`weapon`/`shard`/`kill`、存档面板的导入/导出/重置，
   都会直接改动你的真实存档 —— 想安全实验请用镜像页。
2. **设置不互通**：镜像页（`wangyiben0.github.io`）和官方页（`dzmm.ai`）是两个域，
   工坊设置、宏、AI 设置各存一份，互不共享。
3. **面板里的“AI 设置”分支在原版页无意义**：那是给镜像的 dzmm shim 用的；原版用官方 AI。
4. **注入时机**：等游戏画面出来再粘。粘早了也没关系 —— `core.js` 会自己轮询等待游戏就绪。
5. **页面若加了 CSP `script-src`**：注入会被拦，脚本会打印哪些文件失败；此时只能用
   镜像页 <https://wangyiben0.github.io/the-seed/>。目前官方页 CSP 只有
   `upgrade-insecure-requests`，不限制脚本来源。

## 已验证

- 在“无工具的原版页模拟”（只保留游戏本体 + SDK）里注入：8 个脚本全部 `ok`，
  `window.__TSW` 出现，`auto/bench/cheats/panel` 均就绪，面板挂钮在 DOM 里，游戏保持运行；
- 工具文件从**线上 GitHub Pages** 跨域加载测试通过（非本地文件）；
- 官方页响应头确认：`content-security-policy: upgrade-insecure-requests`、`access-control-allow-origin: *`。
