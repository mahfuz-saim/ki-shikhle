#!/usr/bin/env node
/**
 * One-off codemod: wire the call sites of the strings the first migration dropped.
 *
 * `repair-i18n-missing.mjs` added the 36 strings that a key collision had discarded,
 * but the call sites still hold the inline `isBn ? '…' : '…'` pair. This finds those
 * exact pairs in the current source and replaces them with `t('namespace.key')`.
 *
 * A pair is only rewritten when **both** of its strings are in the dictionaries under
 * a known namespace, so nothing is replaced by guesswork.
 *
 * Usage:  node scripts/wire-i18n-missing.mjs [--dry]
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(ROOT, '..');
const DRY = process.argv.includes('--dry');

const en = JSON.parse(readFileSync(join(ROOT, 'src/messages/en.json'), 'utf8'));
const bn = JSON.parse(readFileSync(join(ROOT, 'src/messages/bn.json'), 'utf8'));

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

/** The reverse map: an English string → the key it lives under. */
const keyByEn = new Map();
for (const [k, v] of Object.entries(enFlat)) {
  if (!keyByEn.has(String(v))) keyByEn.set(String(v), k);
}

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
  'src/app/admin/page.tsx': 'admin',
  'src/lib/institution.ts': 'institution',
};

function collect(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const f = join(dir, e.name);
    if (e.isDirectory()) collect(f, out);
    else if (/\.tsx?$/.test(e.name)) out.push(f);
  }
  return out;
}

const PAIR = /\bisBn\s*\?\s*'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)'/g;

let rewritten = 0;
let pairs = 0;
const missed = [];

for (const abs of collect(join(ROOT, 'src'))) {
  const rel = abs.slice(ROOT.length + 1).replace(/\\/g, '/');
  const ns = NAMESPACE[rel];
  if (!ns) continue;
  const src = readFileSync(abs, 'utf8');

  let next = src.replace(PAIR, (whole, bnBody, enBody) => {
    pairs++;
    const bnTxt = bnBody.replace(/\\'/g, "'");
    const enTxt = enBody.replace(/\\'/g, "'");

    const key = keyByEn.get(enTxt);
    if (!key || !key.startsWith(ns + '.')) {
      missed.push(`${rel}: ${JSON.stringify(enTxt.slice(0, 50))}`);
      return whole;
    }
    // The Bangla side has to match too, or the pair is not the one we added.
    if (String(bnFlat[key]) !== bnTxt) {
      missed.push(`${rel}: ${JSON.stringify(enTxt.slice(0, 50))} (bn differs)`);
      return whole;
    }
    return `t('${key}')`;
  });

  if (next === src) continue;
  rewritten++;

  // Make sure `t` is in scope.
  if (/t\('[a-zA-Z]+\./.test(next) && !/const\s*\{[^}]*\bt\b[^}]*\}\s*=\s*useI18n\(\)/.test(next)) {
    const destructure = next.match(/const\s*\{\s*([^}]*?)\s*\}\s*=\s*useI18n\(\)/);
    if (destructure) {
      const names = destructure[1].split(',').map((s) => s.trim()).filter(Boolean);
      if (!names.includes('t')) {
        next = next.replace(destructure[0], `const { t, ${names.join(', ')} } = useI18n()`);
      }
    } else {
      console.error(`  !! ${rel}: uses t() but has no useI18n() — add it by hand`);
    }
  }

  if (!DRY) writeFileSync(abs, next, 'utf8');
}

console.log(`pairs seen:        ${pairs}`);
console.log(`files rewritten:   ${rewritten}`);
console.log(`pairs not replaced: ${missed.length}`);
for (const m of missed.slice(0, 30)) console.log(`   ${m}`);
