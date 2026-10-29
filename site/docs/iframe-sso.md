# 用官方（不自建后端）实现云存档 / 排行

## 结论

**可行。** 只要用户**手动粘贴自己的 dzmm cookie**，我们就能直接调用官方 API，
使用**官方的云存档**，不需要自建任何后端。

前提：不伪造、不代登录、不索取他人 cookie —— 用户主动提供自己的会话，等同于「在官网上玩」。

---

## 一、协议全貌（已从官方 SDK 反推确认）

### 1. 前端 SDK 走 postMessage，不走 HTTP

`dzmm` SDK（65 KB）里**只有 2 处 fetch**，且都不是身份/存档接口。
真正的数据通路是：

```js
{ type: 'dzmm:request', id: <n>, method: 'kv.get' | 'kv.put' | 'kv.delete' | 'kv.list', params: {...} }
→ postMessage(host, '*')
← { type: 'dzmm:response', id: <n>, result | error }
```

一句 `dzmm.kv.put(k, v)` 最终由**宿主页（dzmm.ai）**转成 HTTP 请求。

### 2. 宿主页对应的 HTTP 端点（实测）

| 端点 | 未登录响应 | 含义 |
|---|---|---|
| `GET /api/gamefy/<gameId>/kv` | **401 `{"error":"请先登录"}`** | 路由存在，**cookie 鉴权** |
| `GET /api/gamefy/kv` | 401 | 同上（不带 gameId 的变体） |
| `GET /api/gamefy/leaderboard` | 401 | 排行端点存在 |
| `GET /api/gamefy/3738712` | 401 | 作品元数据（含 `gameId` / `publishedAt`）|

**关键**：401 且**没有** `www-authenticate` 头 → 是 **cookie 会话鉴权**，
不是 Bearer token。所以**只要带上浏览器 cookie 就能通**。

### 3. 游戏实际使用的存档键

`platform.js` 从 `dzmm.kv` 读一批键（`STORE_KEYS`），游戏内的 `STORE` 就是它们的
内存镜像。已知至少包含 `achroma_run`（局内存档）、`achroma_girls`（养成进度）等。

## 二、落到工具里的做法

```
面板（F8）
 └─ [粘贴 dzmm cookie] 输入框   ← 用户手动填写，不自动获取
      └─ 存到 TSW.settings（仅本机 localStorage）
           └─ [同步云存档] 按钮
                ├─ GET  /api/gamefy/<gameId>/kv            (读全量)
                ├─ 合并本地 STORE 与云端，取更优的那份
                └─ PUT  /api/gamefy/<gameId>/kv            (写回)
```

- **不碰 cookie 的获取**：用户自己从 DevTools 复制，粘进来；
- **不做代理**：浏览器直连 `dzmm.ai`，cookie 由浏览器按正常规则携带
  （需要 `credentials: 'include'`，且我们要在**允许跨域的页面**里调用 —— 见下方约束）；
- **不伪造指纹**：完全不经过登录流程。

## 三、必须正视的三个技术约束

### 约束 1：CORS

从 `wangyiben0.github.io` 直连 `https://www.dzmm.ai/api/...` 属于跨域。
需要响应头 `Access-Control-Allow-Origin` 包含我们的域名 + `Allow-Credentials: true`。
**我们控制不了 dzmm.ai 的响应头**，所以这条**很可能失败**。

实测方式：在浏览器里从我们的页面 `fetch('https://www.dzmm.ai/api/gamefy/<gameId>/kv', {credentials:'include'})`，
看控制台是否报 CORS。**这是决定性的下一步验证。**

### 约束 2：Cookie 的作用域与 SameSite

dzmm 的会话 cookie 若为 `SameSite=Lax/Strict`，跨站请求**不会携带**它，
即使粘贴了也没用。只有 `SameSite=None; Secure` 才能在跨站带上。
**同样需要实测。**

### 约束 3：手动粘贴的 cookie 里包含 HttpOnly 部分

`HttpOnly` 的 cookie **JS 读不到**，用户从 DevTools 复制通常能看到（DevTools 会显示），
但**我们无法通过 `document.cookie` 把它设进去** —— 只能通过
`fetch` 的 `Cookie` 头伪造，**而浏览器禁止 JS 设置 `Cookie` 请求头**。

> 因此「粘贴 cookie」在**纯前端**里**无法生效**。
> 唯一可行的落地方式是：**在浏览器扩展 / 用户脚本（Tampermonkey）环境**里执行，
> 那里可以 `GM_xmlhttpRequest` 跨域 + 自定义 `Cookie` 头。

## 四、诚实的结论

| 方案 | 可行性 |
|---|---|
| 纯前端 + 粘贴 cookie 直连官方 API | **大概率不行**（CORS + HttpOnly + SameSite 三重阻碍）|
| 用户脚本（Tampermonkey）内做云存档 | **可行**（可跨域、可带 Cookie 头）|
| iframe 套官方页 | 能「游玩」，但**父页读不到**它的数据（同源策略）|
| 自建后端 | 用户明确不考虑 |

## 三½、实测结果（决定性）

用 `curl` 带 `Origin: https://wangyiben0.github.io` 请求官方 kv 端点，拿到完整响应头：

```
HTTP/2 401
server: cloudflare
cache-control: private, no-cache, no-store
set-cookie: chosen_language=zh-CN; ... Secure; SameSite=Lax
set-cookie: _geo=HK; ... Secure; SameSite=Lax
(没有 access-control-allow-origin，没有 access-control-allow-credentials)
```

**两条独立证据都指向「跨站不可行」**：

1. **无 `Access-Control-Allow-*`** → 浏览器会拦截跨域 `fetch` 的响应，
   JS 拿不到数据（请求发出去了，读不回来）；
2. **`SameSite=Lax`** → 即使用户把 cookie 粘贴给我们、即使加 `credentials:'include'`，
   **跨站请求也不会携带它**（Lax 只允许顶级导航等场景）。

> 所以「纯前端（本站域名）+ 粘贴 cookie」这条路**实测走不通**，
> 与是否愿意「自建后端」无关 —— 是浏览器安全模型挡住的。

### 那什么可行

| 载体 | 可行性 | 原因 |
|---|---|---|
| **官网页内注入**（`site/inject.js`）| ✅ **完全可行** | 同源，cookie 自动携带，`/api/gamefy/<gameId>/kv` 可直接用 |
| 用户脚本（Tampermonkey）| ✅ 可行 | `GM_xmlhttpRequest` 可跨域且能自定义 Cookie 头 |
| 本站域名直连官方 API | ❌ 不可行 | 无 CORS + SameSite=Lax |
| iframe 套官方页 | 能游玩、不能读数据 | 同源策略 |

### 因此「官方的云存档 / 排行」的正确形态

**在官网页里注入工具**（`inject.js` 那条路）——同源、cookie 天然可用、
不需要用户手动粘贴任何东西、不需要自建后端。

具体可做：
1. 注入后在官网页内直接 `fetch('/api/gamefy/<gameId>/kv', { credentials:'include' })`
   读写官方云存档（**与官网存档完全互通**）；
2. 排行同理走 `/api/gamefy/leaderboard`；
3. 我们的离线镜像仍保持匿名（`dzmm.kv` 退回 localStorage）。

### 建议的下一步（一条命令就能定性）

在**官网页面的控制台**里跑：

```js
await fetch('/api/gamefy/90e4b323-9859-482f-9eb0-7cba6f44a51b/kv', { credentials: 'include' })
  .then(r => r.status)
```

- 若返回 **200** → 官方 kv 端点可直接读，**在官网域内实现云存档完全可行**，
  这时「注入到官网页」这条路就是云存档的正确载体（配合 `site/inject.js`）；
- 若返回 401 → 说明还需要额外鉴权头，需要再抓一次官方页的真实请求。

**这条验证比继续猜测有效得多**，且只需一次操作。
