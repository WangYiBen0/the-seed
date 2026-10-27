// [TheSeed] 工具注入器 — 一行粘到原版页面（https://www.dzmm.ai/character/3738712）的控制台，
// 即可把工坊面板 / HUD / 指令台 / 挂机 / 宏 / 基准 搬到官方游戏里。
//
// 用法：打开原版页面 → 等游戏画面出来 → F12 打开控制台 → 粘贴下面这一整段 → 回车。
// 成功会打印： [TSW] 注入成功 · F8 工坊 / F9 HUD / F10 指令台
//
// 说明：
//   * 只往页面里追加 8 个 <script>，不修改官方任何代码；
//   * 官方页面 CSP 仅 upgrade-insecure-requests，不限制 script-src，可跨域加载；
//   * 工具状态存在 dzmm.ai 域下的 localStorage，与镜像页（GitHub Pages）互相独立；
//   * ⚠ 原版页面上的指令台/作弊/存档导入导出会直接改动你在 dzmm 的真实存档，慎用。

(() => {
  const BASE = 'https://wangyiben0.github.io/the-seed/tools/';
  const FILES = ['core', 'macro', 'auto', 'hud', 'bench', 'explore', 'cheats', 'panel'];
  if (window.__TSW) return console.warn('[TSW] 已注入 —— F8 工坊 / F9 HUD / F10 指令台');
  (async () => {
    const failed = [];
    for (const n of FILES) {
      await new Promise((done) => {
        const s = document.createElement('script');
        s.src = BASE + n + '.js?v=' + Date.now();
        s.onload = done;
        s.onerror = () => { failed.push(n); done(); };
        document.head.appendChild(s);
      });
    }
    if (failed.length) console.error('[TSW] 部分脚本加载失败: ' + failed.join(',') + '（若页面有 CSP script-src 限制，请改用镜像页 https://wangyiben0.github.io/the-seed/）');
    else console.log('[TSW] 注入成功 · F8 工坊 / F9 HUD / F10 指令台');
  })();
})();
