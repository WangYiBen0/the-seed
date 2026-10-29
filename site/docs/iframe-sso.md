# 用 iframe 套平台页做「云存档 / 排行」的可行性评估

## 结论先行

**技术上可以，但这不是「伪造身份」，而且大概率仍拿不到登录态。**
真正可行的形态是：**iframe 里加载官方页面本身**（让它自己去拿它自己的 cookie），
而不是「我们的 shim 去索要别域的 cookie」。

---

## 一、为什么「索要另一个域的 cookie」做不到

| 机制 | 现状 |
|---|---|
| `document.cookie` | **只能读同源**。跨域 iframe 里读 `dzmm.ai` 的 cookie 会被浏览器直接拒绝 |
| `fetch(url, {credentials:'include'})` | 跨域 + 需要 `Access-Control-Allow-Credentials: true`，且 **CORS 白名单由 dzmm.ai 控制**，我们无法改 |
| 官方 SDK `dzmm.user.info()` | **根本不走 HTTP**。实测 SDK（65 KB）里只有 2 处 `fetch`，且都不是身份接口；身份走 **postMessage** |
| postMessage 协议 | `postMessage(e, "*")`（通配目标），消息类型 `dzmm:ready` / `dzmm:request` / `dzmm:response` |

> **关键点**：SDK 的通信是 **`postMessage(e, "*")`**，它不校验来源域。
> 这意味着**如果父窗口配合**，iframe 里的 `dzmm.user.info()` 确实能返回任何父窗口给的东西
> —— 但那个「东西」必须是**真实的 dzmm 会话**，否则服务端不认。

## 二、真正可行的三种形态

### 形态 A：iframe 加载官方页面（推荐，最诚实）

```
你的站点 (wangyiben0.github.io)
 └─ <iframe src="https://www.dzmm.ai/character/3738712">
      └─ 官方页 → 拿它自己的 cookie → dzmm.user.info() 返回真实身份
```

- **不需要伪造任何东西**：iframe 里的页面是官方的，cookie 也是它自己的；
- 你能拿到什么：**只能拿到你在父页里被允许的**（同源策略挡住直接读取 iframe 内部）；
- 要通信必须靠 **`postMessage`**，而官方页**不接受任意父窗口的消息**（它只监听自己的 SDK 协议）。

**所以形态 A 的用途是「嵌入游玩」，不是「云存档」。**

### 形态 B：完全自建的云存档（推荐，可行）

不碰 DZMM 的身份，**自己提供存储**：

```
site/tools/cloud.js
 ├─ 匿名 ID：crypto.randomUUID() 存 localStorage
 ├─ 存档上传：PUT 到自己的端点（GitHub Gist / Cloudflare KV / 任何免费 KV）
 └─ 排行：服务端按 score 排序，前端只读
```

- **不需要登录**：用匿名 UUID 做「同一台设备」的标识；
- **不需要伪造 cookie**：完全不涉及 dzmm.ai；
- **风险**：匿名 ID 可被伪造（刷榜），但这是**你自己的榜单**，不是官方的。

### 形态 C：iframe + 自有后端（形态 A+B 组合）

iframe 里跑官方页（真实游玩 + 真实身份），
父页通过 **`postMessage` 主动向 iframe 索要它愿意给的成绩**（需要官方页配合，做不到），
或者干脆**父页自己监测**（做不到，同源）。

**结论：形态 C 不成立。**

## 三、「伪造成平台网页」这条路的实质

要「伪造成平台网页」意味着：
1. 让 `dzmm.ai` 认为请求来自它自己的页面 → **需要它的 cookie**；
2. 拿到 cookie → **需要用户在 dzmm.ai 登录过**，且我们要能读到它。

浏览器**不允许** `wangyiben0.github.io` 读 `dzmm.ai` 的 cookie。
唯一能绕过的是「在自己的域名下代理请求」，但那要求**请求携带用户的 dzmm cookie**
—— 而那个 cookie 我们拿不到。**死循环。**

> 除非用户**手动把 cookie 复制给我们**（等于把账号交给第三方），
> 这既不可行也不该做。

## 四、实际建议

按「能真做、且不违规」的顺序：

1. **自建云存档（形态 B）** —— 最实际。用匿名 UUID + 免费 KV，
   存 `score / roomsPerMin / 最深楼层`，前端能看自己的历史与本地排行；
2. **嵌入官方页（形态 A）** —— 作为「去官网玩」的入口，不做数据互通；
3. **不要做** cookie 索要 / 指纹伪造 / 代理登录 —— 技术上死路，且违反平台意图。

## 五、给用户的一句话总结

> **iframe 能让你「在页面里打开官网」，但不能让你「读到官网的身份」。**
> 想要云存档和排行，正确做法是**自己搭一套匿名存储**，
> 而不是伪装成平台页去要 cookie。
