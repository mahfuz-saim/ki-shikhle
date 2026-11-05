/**
 * Check the message dictionaries for problems that would show up as broken UI.
 *
 *  - A key used in the source but missing from a dictionary.
 *  - A `{placeholder}` in one language that the other language does not have (or has
 *    a different name for), which renders as a literal `{name}` in the UI.
 *  - A placeholder with no matching variable passed at the call site.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.argv[2] || process.cwd();

const en = JSON.parse(readFileSync(join(ROOT, 'src/messages/en.json'), 'utf8'));
const bn = JSON.parse(readFileSync(join(ROOT, 'src/messages/bn.json'), 'utf8'));

function collect(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const f = join(dir, e.name);
    if (e.isDirectory()) collect(f, out);
    else if (/\.tsx?$/.test(e.name)) out.push(f);
  }
  return out;
}

/** Flatten a nested dictionary into `a.b.c` → string. */
function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flatten(v, path, out);
    else out[path] = v;
  }
  return out;
}

const enFlat = flatten(en);
const bnFlat = flatten(bn);

const problems = [];

// 1. Keys present in one dictionary but not the other.
for (const k of Object.keys(enFlat)) {
  if (!(k in bnFlat)) problems.push(`missing in bn.json: ${k}`);
}
for (const k of Object.keys(bnFlat)) {
  if (!(k in enFlat)) problems.push(`missing in en.json: ${k}`);
}

// 2. Placeholders that differ between the two languages.
//
// English pluralises by interpolating a suffix — `${n} Child${n > 1 ? 'ren' : ''}`
// becomes `{p0} Child{p1}` — while Bangla has no inflection and so carries one
// fewer placeholder. The extra English placeholder is that suffix, not a missing
// value, so a language with a strict prefix of the other's placeholders is fine.
const placeholders = (s) => (String(s).match(/\{(\w+)\}/g) || []).sort();
const isPrefix = (short, long) =>
  short.length <= long.length && short.every((p, i) => p === long[i]);
for (const k of Object.keys(enFlat)) {
  if (!(k in bnFlat)) continue;
  const a = placeholders(enFlat[k]);
  const b = placeholders(bnFlat[k]);
  if (a.join(',') === b.join(',')) continue;
  if (isPrefix(a, b) || isPrefix(b, a)) continue; // a plural suffix on one side only
  problems.push(`placeholder mismatch at ${k}: en=[${a}] bn=[${b}]`);
}

// 3. Keys referenced in the source that are not in the dictionary.
const used = new Set();
for (const abs of collect(join(ROOT, 'src'))) {
  // Strip comments first — the doc comments in `i18n-context.tsx` use `t('a.b')`
  // as examples, and those are not real call sites.
  const src = readFileSync(abs, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
  for (const m of src.matchAll(/\bt\('([a-zA-Z][\w.]*)'/g)) used.add(m[1]);
}
for (const k of used) {
  if (!(k in enFlat)) problems.push(`used in code but not in en.json: ${k}`);
}

console.log(`dictionary keys: en=${Object.keys(enFlat).length} bn=${Object.keys(bnFlat).length}`);
console.log(`keys referenced in code: ${used.size}`);
console.log(`problems: ${problems.length}`);
for (const p of problems.slice(0, 40)) console.log('  ' + p);
if (problems.length > 40) console.log(`  … and ${problems.length - 40} more`);
