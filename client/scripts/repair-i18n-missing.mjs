#!/usr/bin/env node
/**
 * One-off repair: add the strings the migration dropped.
 *
 * The codemod derives a key by slugifying the English text, and the slug function
 * strips non-ASCII — so a Bangla string slugifies to an empty string and every such
 * pair collapses onto the same `text`, `text_2`, … sequence. When two pairs produced
 * the same slug, the second one was silently dropped: its text never reached either
 * dictionary, so the call site fell back to the raw key or the `t()` fallback.
 *
 * `audit-i18n-coverage.mjs` finds these by comparing the pre-migration source against
 * the current dictionaries. This script adds the missing ones.
 *
 * The keys are derived from the namespace plus a slug of the English text, so they
 * read as names rather than `text_17`.
 *
 * Usage:  node scripts/repair-i18n-missing.mjs [--dry]
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(ROOT, '..');
const PRE = 'HEAD~3';
const DRY = process.argv.includes('--dry');

const enPath = join(ROOT, 'src/messages/en.json');
const bnPath = join(ROOT, 'src/messages/bn.json');
const en = JSON.parse(readFileSync(enPath, 'utf8'));
const bn = JSON.parse(readFileSync(bnPath, 'utf8'));

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flatten(v, path, out);
    else out[path] = v;
  }
  return out;
}

function unflatten(flat) {
  const out = {};
  for (const [path, value] of Object.entries(flat)) {
    const parts = path.split('.');
    let node = out;
    for (const p of parts.slice(0, -1)) {
      if (!node[p] || typeof node[p] !== 'object') node[p] = {};
      node = node[p];
    }
    node[parts[parts.length - 1]] = value;
  }
  return out;
}

const enFlat = flatten(en);
const bnFlat = flatten(bn);
const enVals = new Set(Object.values(enFlat).map(String));
const bnVals = new Set(Object.values(bnFlat).map(String));

/**
 * The namespace each source file's strings land under — the same map the codemods
 * use, so a repaired key sits next to the ones it belongs with.
 */
const NAMESPACE = {
  'client/src/app/child/schedule/page.tsx': 'childSchedule',
  'client/src/app/children/[id]/log/page.tsx': 'childLog',
  'client/src/app/quizzes/page.tsx': 'quizzes',
  'client/src/app/dashboard/page.tsx': 'dashboard',
  'client/src/app/child/notes/page.tsx': 'childNotes',
  'client/src/app/schedule/page.tsx': 'schedule',
  'client/src/app/child/log/page.tsx': 'childLogHome',
  'client/src/app/page.tsx': 'landing',
  'client/src/app/billing/page.tsx': 'billing',
  'client/src/app/children/[id]/quizzes/new/page.tsx': 'quizNew',
  'client/src/components/layout/kid-shell.tsx': 'kidShell',
  'client/src/app/child/quiz/page.tsx': 'childQuiz',
  'client/src/app/notes/page.tsx': 'notes',
  'client/src/components/charts/study-time-chart.tsx': 'charts',
  'client/src/app/child/page.tsx': 'childHome',
  'client/src/app/notifications/page.tsx': 'notifications',
  'client/src/app/pricing/page.tsx': 'pricing',
  'client/src/app/login/page.tsx': 'login',
  'client/src/app/attempts/[id]/results/page.tsx': 'results',
  'client/src/components/layout/header.tsx': 'header',
  'client/src/components/layout/public-navbar.tsx': 'publicNav',
  'client/src/app/child/quiz/[id]/page.tsx': 'childQuizPlay',
  'client/src/components/layout/bottom-nav.tsx': 'bottomNav',
  'client/src/app/register/page.tsx': 'register',
  'client/src/app/onboarding/page.tsx': 'onboarding',
  'client/src/app/quizzes/[id]/page.tsx': 'quizDetail',
  'client/src/app/children/page.tsx': 'children',
  'client/src/app/settings/page.tsx': 'settings',
  'client/src/app/admin/page.tsx': 'admin',
  'client/src/lib/institution.ts': 'institution',
};

function slug(s) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 48) || 'text'
  );
}

const files = execFileSync('git', ['ls-tree', '-r', '--name-only', PRE, 'client/src'], {
  cwd: REPO,
  maxBuffer: 1e8,
  encoding: 'utf8',
})
  .split('\n')
  .filter((f) => /\.tsx?$/.test(f));

const PAIR = /\bisBn\s*\?\s*'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)'/g;

let added = 0;
const seen = new Set();
for (const f of files) {
  const ns = NAMESPACE[f];
  if (!ns) continue;
  const src = execFileSync('git', ['show', `${PRE}:${f}`], {
    cwd: REPO,
    maxBuffer: 1e8,
    encoding: 'utf8',
  });
  for (const m of src.matchAll(PAIR)) {
    const bnTxt = m[1].replace(/\\'/g, "'");
    const enTxt = m[2].replace(/\\'/g, "'");
    if (enVals.has(enTxt) && bnVals.has(bnTxt)) continue;

    const id = `${ns}::${enTxt}`;
    if (seen.has(id)) continue;
    seen.add(id);

    // A readable key, unique within the namespace.
    let key = slug(enTxt);
    let n = 2;
    while (`${ns}.${key}` in enFlat) key = `${slug(enTxt)}_${n++}`;

    enFlat[`${ns}.${key}`] = enTxt;
    bnFlat[`${ns}.${key}`] = bnTxt;
    added++;
    console.log(`  + ${ns}.${key}`);
  }
}

console.log(`missing strings added: ${added}`);

if (!DRY) {
  writeFileSync(enPath, JSON.stringify(unflatten(enFlat), null, 2) + '\n', 'utf8');
  writeFileSync(bnPath, JSON.stringify(unflatten(bnFlat), null, 2) + '\n', 'utf8');
}
