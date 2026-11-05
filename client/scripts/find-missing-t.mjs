/**
 * Report every `t(...)` call that is not inside a scope where `t` is bound.
 *
 * The codemod rewrote `isBn ? 'a' : 'b'` into `t('ns.key')`. Most call sites are in
 * components that already destructure `t` from `useI18n()`. Two kinds are not:
 *
 *  - module-level helpers that take `isBn` as a parameter — a React hook cannot be
 *    called there, so `t` has to be passed in.
 *  - secondary components in the same file with their own `useI18n()` call, which the
 *    codemod's single-destructuring heuristic did not match.
 *
 * This finds them so they can be fixed by hand.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.argv[2] || process.cwd();

function collect(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const f = join(dir, e.name);
    if (e.isDirectory()) collect(f, out);
    else if (/\.tsx?$/.test(e.name)) out.push(f);
  }
  return out;
}

for (const abs of collect(join(ROOT, 'src'))) {
  const rel = abs.slice(ROOT.length + 1).replace(/\\/g, '/');
  const lines = readFileSync(abs, 'utf8').split('\n');

  // Every line that binds `t`.
  const binders = new Set();
  lines.forEach((l, i) => {
    if (/const\s*\{[^}]*\bt\b[^}]*\}\s*=\s*useI18n\(\)/.test(l)) binders.add(i + 1);
  });

  if (!binders.size) continue;

  // The scope of a binder runs until the next binder at the same or lower indentation
  // — approximated by "until the next `useI18n()` line", which is where a new
  // component's scope begins.
  const binderLines = [...binders].sort((a, b) => a - b);
  const scopeEnd = (line) => {
    for (const b of binderLines) if (b > line) return b - 1;
    return Infinity;
  };

  const problems = [];
  lines.forEach((l, i) => {
    const n = i + 1;
    if (!/\bt\('[a-zA-Z]+\./.test(l)) return;
    if (binders.has(n)) return;
    const start = [...binderLines].reverse().find((b) => b < n) ?? -Infinity;
    if (start === -Infinity) {
      problems.push(n);
      return;
    }
    if (n <= scopeEnd(n)) return;
    problems.push(n);
  });

  if (problems.length) {
    console.log(`\n${rel}`);
    // Group contiguous-ish line numbers.
    const shown = problems.slice(0, 6);
    for (const n of shown) console.log(`  ${n}: ${lines[n - 1].trim().slice(0, 100)}`);
    if (problems.length > shown.length) console.log(`  … and ${problems.length - shown.length} more`);
  }
}
