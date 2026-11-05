#!/usr/bin/env node
/**
 * One-off codemod: move `isBn ? 'English' : 'বাংলা'` string pairs into the message
 * dictionaries and rewrite the call site to `t('namespace.key')`.
 *
 * It only rewrites pairs where BOTH sides are plain single-quoted string
 * literals with no interpolation — those map cleanly onto a dictionary entry.
 * Interpolated template literals are reported but left alone; they need
 * `{placeholder}` support and are handled separately.
 *
 * Usage:  node scripts/migrate-i18n.mjs [--dry]
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry');

// The namespace each source file's strings land under.
const NAMESPACE = {
  'src/app/child/schedule/page.tsx': 'childSchedule',
  'src/app/children/[id]/log/page.tsx': 'childLog',
  'src/app/quizzes/page.tsx': 'quizzes',
  'src/app/dashboard/page.tsx': 'dashboard',
  'src/app/child/notes/page.tsx': 'childNotes',
  'src/app/schedule/page.tsx': 'schedule',
  'src/app/child/log/page.tsx': 'childLogHome',
  'src/app/page.tsx': 'landing',
  'src/app/billing/page.tsx': 'billing',
  'src/app/children/[id]/quizzes/new/page.tsx': 'quizNew',
  'src/components/layout/kid-shell.tsx': 'kidShell',
  'src/app/child/quiz/page.tsx': 'childQuiz',
  'src/app/notes/page.tsx': 'notes',
  'src/components/charts/study-time-chart.tsx': 'charts',
  'src/app/child/page.tsx': 'childHome',
  'src/app/notifications/page.tsx': 'notifications',
  'src/app/pricing/page.tsx': 'pricing',
  'src/app/login/page.tsx': 'login',
  'src/app/attempts/[id]/results/page.tsx': 'results',
  'src/components/layout/header.tsx': 'header',
  'src/components/layout/public-navbar.tsx': 'publicNav',
  'src/app/child/quiz/[id]/page.tsx': 'childQuizPlay',
  'src/components/layout/bottom-nav.tsx': 'bottomNav',
  'src/app/register/page.tsx': 'register',
  'src/app/onboarding/page.tsx': 'onboarding',
  'src/app/quizzes/[id]/page.tsx': 'quizDetail',
  'src/app/children/page.tsx': 'children',
  'src/app/settings/page.tsx': 'settings',
};

/**
 * `isBn ? 'English' : 'বাংলা'` — both sides plain literals, no interpolation.
 *
 * The leading `\b` matters: without it the pattern matches the trailing `sBn` of one
 * `isBn` plus the `?` of the next one, so `isBn ? 'a' : 'b'` was read as `i` + the
 * whole `sBn ? 'a' : 'b'` body. Every key was wrong and no rewrite applied.
 */
const PAIR_RE = /\bisBn\s*\?\s*'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)'/g;

/** A template-literal variant, which needs `{placeholder}` support. */
const TEMPLATE_RE = /\bisBn\s*\?\s*`([^`]*)`\s*:\s*`([^`]*)`/g;

function collectFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

// --- Collect every pair, grouped by the source file it came from -------------
/** @type {Map<string, {en: string, bn: string}[]>} */
const perFile = new Map();
const skipped = [];

for (const abs of collectFiles(join(ROOT, 'src'))) {
  const rel = abs.slice(ROOT.length + 1).replace(/\\/g, '/');
  const src = readFileSync(abs, 'utf8');

  for (const m of src.matchAll(TEMPLATE_RE)) {
    skipped.push({ file: rel, text: m[0].slice(0, 90) });
  }

  const ns = NAMESPACE[rel];
  if (!ns) continue;

  const found = [];
  for (const m of src.matchAll(PAIR_RE)) {
    found.push({ en: m[1], bn: m[2] });
  }
  if (found.length) perFile.set(rel, found);
}

// --- Build the key for each string ------------------------------------------
/** Turn a string into a stable, readable key fragment. */
function slug(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}

// English is the source language, so the key comes from the English text.
const usedKeys = new Set();
function uniqueKey(ns, en) {
  let base = slug(en) || 'text';
  let key = base;
  let n = 2;
  while (usedKeys.has(`${ns}.${key}`)) {
    key = `${base}_${n++}`;
  }
  usedKeys.add(`${ns}.${key}`);
  return key;
}

/** entry → { en, bn, key } */
const entries = new Map(); // `${rel}::${en}` -> entry

for (const [rel, pairs] of perFile) {
  const ns = NAMESPACE[rel];
  for (const p of pairs) {
    const id = `${rel}::${p.en}`;
    if (entries.has(id)) continue;
    const key = uniqueKey(ns, p.en);
    entries.set(id, { ns, key, en: p.en, bn: p.bn, rel });
  }
}

// --- Rewrite the source files -------------------------------------------------
let rewritten = 0;
let tAdded = 0;
for (const [rel] of perFile) {
  const abs = join(ROOT, rel);
  let src = readFileSync(abs, 'utf8');

  const next = src.replace(PAIR_RE, (whole, en, bn) => {
    const entry = entries.get(`${rel}::${en}`);
    if (!entry) return whole;
    return `t('${entry.ns}.${entry.key}')`;
  });

  if (next === src) continue;

  rewritten++;

  // The rewritten call sites need `t` in scope. Most files already destructure it
  // from `useI18n()`; the rest only pulled `isBn`, so add `t` there.
  let final = next;
  const usesT = /t\('[a-zA-Z]+\./.test(final);
  if (usesT) {
    const destructure = final.match(/const\s*\{\s*([^}]*?)\s*\}\s*=\s*useI18n\(\)/);
    if (destructure) {
      const names = destructure[1].split(',').map((s) => s.trim()).filter(Boolean);
      if (!names.includes('t')) {
        // Put `t` first so the destructuring reads naturally.
        final = final.replace(
          destructure[0],
          `const { t, ${names.join(', ')} } = useI18n()`
        );
        tAdded++;
      }
    } else {
      // No `useI18n()` destructuring at all. If the file imports the hook, add a
      // `const { t } = useI18n();` line inside the first component body.
      if (/import\s*\{[^}]*useI18n[^}]*\}\s*from\s*['"]@\/lib\/i18n-context['"]/.test(final)) {
        const component = final.match(/export function (\w+)\([^)]*\)\s*\{/);
        if (component) {
          final = final.replace(
            component[0],
            `${component[0]}\n  const { t } = useI18n();`
          );
          tAdded++;
        }
      } else {
        console.error(`  !! ${rel}: uses t() but has no useI18n() — add it by hand`);
      }
    }
  }

  if (!DRY) writeFileSync(abs, final, 'utf8');
}

// --- Write the dictionary entries --------------------------------------------
const enDict = JSON.parse(readFileSync(join(ROOT, 'src/messages/en.json'), 'utf8'));
const bnDict = JSON.parse(readFileSync(join(ROOT, 'src/messages/bn.json'), 'utf8'));

function setDeep(obj, ns, key, value) {
  if (!obj[ns]) obj[ns] = {};
  if (obj[ns][key] === undefined) obj[ns][key] = value;
}

for (const e of entries.values()) {
  setDeep(enDict, e.ns, e.key, e.en);
  setDeep(bnDict, e.ns, e.key, e.bn);
}

if (!DRY) {
  writeFileSync(join(ROOT, 'src/messages/en.json'), JSON.stringify(enDict, null, 2) + '\n', 'utf8');
  writeFileSync(join(ROOT, 'src/messages/bn.json'), JSON.stringify(bnDict, null, 2) + '\n', 'utf8');
}

console.log(`files rewritten: ${rewritten}`);
console.log(`entries added:   ${entries.size}`);
console.log(`template-literal ternaries left for manual work: ${skipped.length}`);
if (skipped.length) {
  const byFile = new Map();
  for (const s of skipped) {
    byFile.set(s.file, (byFile.get(s.file) || 0) + 1);
  }
  for (const [f, n] of [...byFile].sort((a, b) => b[1] - a[1])) {
    console.log(`   ${n}  ${f}`);
  }
}
