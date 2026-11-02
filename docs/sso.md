# DZMM SSO 调研 · 官方 SDK 与登录

## 官方资源

| 资源 | 地址 | 实测 |
|---|---|---|
| 浏览器 SDK | `https://www.dzmm.ai/gamefy/sdk/v1.js` | ✅ 200 / 65681 B |
| 文档索引 | `https://www.dzmm.ai/gamefy/llms.txt` | ✅ 200 / 3154 B |
| 玩家信息文档 | `https://www.dzmm.ai/gamefy/docs/sdk/user.md` | ✅ 200 / 5356 B |

## 登录相关的唯一 API：`dzmm.user.info()`

```js
const { id, name, avatarUrl, token, environment } = await dzmm.user.info();
```

| 字段 | 说明 |
|---|---|
| `id` | 玩家 UUID |
| `name` / `avatarUrl` | 昵称 / 头像 |
| **`token`** | **平台签发的 RS256 JWT，有效期 30 分钟** |
| `environment` | `'dev'`（Workbench 预览）/ `'prod'`（玩家游玩）|

未登录时四个字段全为 `null`。

## 关键事实：这套 API **只在 DZMM 的 iframe 沙箱内可用**

`dzmm` 是**宿主页（dzmm.ai）注入到 iframe 的全局对象**，不是我们能在离线镜像里生成的。
所以：

- **离线镜像（本站）拿不到真实身份** —— 我们的 `site/dzmm-shim.js` 里
  `user: { async info() { return null; } }`，这是**正确的设计**：没有宿主就没有身份；
- **想用 SSO，只能在官方页面内运行**（`site/inject.js` 那条路——把工具注入到
  官网页控制台）。此时 `dzmm.user.info()` 返回真实玩家信息。

## 因此「SSO」其实已经有答案了

用户的诉求是「在工具里显示/使用 DZMM 身份」。三条可行路径：

1. **在官方页面注入工具**（`inject.js`）：工具与游戏同域，可直接 `await dzmm.user.info()`
   拿到 `name`/`avatarUrl`，显示在 HUD 上。**零破解、零伪造**；
2. **把 token 用于自己的后端**（多数游戏不需要）：前端 `Authorization: Bearer <token>`，
   后端用 `https://www.dzmm.ai/api/gamefy/.well-known/jwks.json` 的 JWKS 公钥验签；
3. **离线镜像保持匿名**：`user.info()` 返回 null，面板显示「离线模式」。

## 明确不可行（已实测，勿再尝试）

- **游客账号自动创建**：`POST /api/auth/anonymous-sign-in` 需要完整浏览器指纹
  （`fp.data` 11 组信号 + 32 位 `fp.hash`），且即便指纹合法，服务端返回
  `{"code":"human_check_required"}` —— **必须人工过人机验证**；
- **伪造/复用指纹**：不得尝试（违反平台意图，且换环境必然失效）。

## 落地建议（下一步可做）

在 `site/inject.js` 注入后的工具里加一个「身份」面板项：
- 检测 `typeof dzmm !== 'undefined' && dzmm.user`；
- 有则 `await dzmm.user.info()`，显示 `name` + `avatarUrl`；
- 无则显示「离线镜像 · 未登录」。

这样官方页里有身份、离线页里诚实显示未登录，两种场景都不需要伪造任何东西。
