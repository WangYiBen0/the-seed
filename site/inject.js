// [TheSeed] 工具注入器 —— 在官网页控制台粘一行，即可挂上工坊 / HUD / 指令台。
//
// 用法：打开 https://www.dzmm.ai/character/3738712 → 等游戏画面出现 → F12 → 粘贴 → 回车
//
// 两个入口，任选其一：
//   A. 加载本文件（最短，一行）：
//      document.head.append(Object.assign(document.createElement('script'),{src:'https://wangyiben0.github.io/the-seed/inject.js'}))
//   B. 直接把下面的工具清单逐个拉起来（见 docs/inject.md 的一行版）。
//
// 关键约束：
//   * 工具脚本有依赖顺序（core → macro → auto → … → panel），必须**串行**加载。
//     用 forEach 并发时，首次访问会在 forward 引用上抛出
//     "Cannot read properties of undefined (reading 'visible')"，
//     auto / cloudhost 因此挂不上（已实测）。
//   * 官网页 CSP 只 upgrade-insecure-requests，不拦 script-src，所以外链可行。
//   * 幂等：已注入就什么都不做。
//   * dzmm.kv 只存在于官网页，云存档只有在这种注入模式下才可用。
//
// ⚠ 指令台 / cheats 会直接影响你在 dzmm 的真实存档，慎用。

(() => {
  if (window.__TSW) return console.warn('[TSW] 已注入 —— F8 工坊 / F9 HUD / F10 指令台');
  const B = 'https://wangyiben0.github.io/the-seed/tools/';
  const F = ['core', 'macro', 'auto', 'hud', 'bench', 'explore', 'evolve', 'cheats', 'cloud', 'cloudhost', 'panel'];
  const bad = [];
  // SERIAL, not forEach: each tool expects the previous one to exist.
  (async () => {
    for (const n of F) {
      await new Promise((res) => {
        const s = document.createElement('script');
        s.src = B + n + '.js';
        s.onload = res;
        s.onerror = () => { bad.push(n); res(); };
        document.head.appendChild(s);
      });
    }
    if (bad.length) console.error('[TSW] 部分脚本加载失败: ' + bad.join(',') + '（若页面有 CSP 限制，请改用镜像页）');
    else console.log('[TSW] 注入成功 · F8 工坊 / F9 HUD / F10 指令台');
  })();
})();
