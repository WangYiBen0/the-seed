// 轻量格式化器（离线、无依赖）：只动我们自己写的文件，绝不碰原版代码。
//
// 规则（保守，不重排语义）：
//   * 行尾空白去掉
//   * CRLF → LF
//   * 连续 3 行以上空行压成 1 行
//   * 文件末尾恰好一个换行
//   * .js/.mjs 额外跑 node --check 语法校验（失败即拒绝提交）
//
// 用法：node scripts/fmt.mjs [--check] <files...>
//   --check 只报告需要格式化的文件（pre-commit 用），返回码 1 表示有改动需求
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const EXCLUDE = [
  /^\[TheSeed\]\//,          // 原版页面与 76 个上游脚本：原样保存
  /^site\/js\//,             // 上游游戏脚本：字节级同步，禁止改
  /^site\/assets\//,         // 资源
  /^\.tmp\//,
  /^result\//,
  /\.(png|webp|jpg|gif|ico|woff2?|ttf|jsonl)$/i,
];
const CODE = /\.(m?js)$/;

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const gitAdd = args.includes('--git-add');
const files = args.filter((a) => !a.startsWith('--'));

function tidy(text) {
  let t = text.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '');
  t = t.replace(/\n{3,}/g, '\n\n');
  if (!t.endsWith('\n')) t += '\n';
  return t;
}

let changed = 0, checked = 0, failed = [];
const touched = [];
for (const f of files) {
  if (!f || EXCLUDE.some((re) => re.test(f))) continue;
  let src;
  try { src = readFileSync(f, 'utf8'); } catch { continue; }
  checked++;
  const out = tidy(src);
  const dirty = out !== src;
  if (dirty) {
    changed++;
    if (checkOnly) console.log('需要格式化: ' + f);
    else { writeFileSync(f, out); console.log('已格式化: ' + f); if (gitAdd) touched.push(f); }
  }
  if (CODE.test(f)) {
    try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); }
    catch (e) { failed.push(f + ' → ' + String(e.stderr || e).split('\n').slice(0, 2).join(' ')); }
  }
}
if (failed.length) { console.error('语法错误，拒绝提交:\n  ' + failed.join('\n  ')); process.exit(2); }
if (checkOnly) {
  console.log(`检查 ${checked} 个文件，${changed} 个需要格式化`);
  process.exit(changed ? 1 : 0);
}
if (gitAdd && touched.length) {
  // pre-commit 会因为“钩子修改了文件”而中止提交，所以这里直接把格式化结果重新暂存
  try { execFileSync('git', ['add', '--', ...touched], { stdio: 'inherit' }); console.log('已重新暂存: ' + touched.length + ' 个文件'); }
  catch (e) { console.error('git add 失败（请手动 add）'); }
}
console.log(`处理 ${checked} 个文件，格式化 ${changed} 个`);
