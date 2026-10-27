// 语法闸门：对给定的 .js/.mjs 逐个跑 node --check，任一失败即非零退出。
// 由 git-hooks.nix 的 seed-syntax hook 调用（pre-commit 阶段）。
import { execFileSync } from 'node:child_process';

const files = process.argv.slice(2).filter((f) => /\.(m?js)$/.test(f));
const bad = [];
for (const f of files) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); }
  catch (e) { bad.push(f + '\n    ' + String(e.stderr || e).split('\n').filter(Boolean).slice(0, 2).join('\n    ')); }
}
if (bad.length) { console.error('语法错误，拒绝提交:\n  ' + bad.join('\n  ')); process.exit(1); }
console.log(`语法检查通过: ${files.length} 个文件`);
