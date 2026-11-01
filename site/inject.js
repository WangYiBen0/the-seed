// [TheSeed] 工具注入器 — 在官网页面的控制台里粘一行，即可挂上工坊/HUD/指令台。
//
// 用法：打开 https://www.dzmm.ai/character/3738712 → 等游戏画面出现 → F12 控制台 → 粘贴 → 回车
//
// 为什么这么短：
//   * 工具都是普通脚本，注入 = 依次加载它们，不需要复制任何游戏代码；
//   * 官网页 CSP 只 upgrade-insecure-requests，不拦 script-src；
//   * 已注入就什么都不做（幂等）；
//   * dzmm.kv 只存在于官网页，所以云存档同步只有在这种注入模式下才可用。
//
// ⚠ 这里的指令台/作弊会直接影响你在 dzmm 的真实存档，慎用。

(() => {
  if (window.__TSW) return console.warn('[TSW] 已注入 —— F8 工坊 / F9 HUD / F10 指令台');
  const B = 'https://wangyiben0.github.io/the-seed/tools/';
  const F = ['core', 'macro', 'auto', 'hud', 'bench', 'explore', 'evolve', 'cheats', 'cloud', 'cloudhost', 'panel'];
  F.forEach((n) => {
    const s = document.createElement('script');
    s.src = B + n + '.js';
    s.onload = () => { if (n === 'panel') console.log('[TSW] 注入成功 · F8 工坊 / F9 HUD / F10 指令台'); };
    s.onerror = () => console.error('[TSW] 加载失败: ' + n + '（页面可能有 CSP script-src 限制）');
    document.head.appendChild(s);
  });
})();
