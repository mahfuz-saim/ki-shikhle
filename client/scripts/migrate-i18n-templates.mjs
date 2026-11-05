#!/usr/bin/env node
/**
 * Second-pass i18n codemod: move `isBn ? \`...${x}...\` : \`...${x}...\`` template
 * pairs into the message dictionaries.
 *
 * The first pass only handled pairs of plain string literals. The interpolated ones
 * need the `{placeholder}` support that `t()` now has, so each template's
 * interpolations become named placeholders:
 *
 *   isBn ? `${toBnNum(n)}টি নতুন` : `${n} New`
 *     → t('notifications.unread_new', { p0: isBn ? toBnNum(n) : n }, `${n} New`)
 *
 * The value passed for each placeholder is locale-aware — the Bangla side usually
 * wraps the number in `toBnNum`, so the digits are Bengali. The English template is
 * passed as the fallback, so a missing dictionary entry still renders English
 * rather than the raw key.
 *
 * Usage:  node scripts/migrate-i18n-templates.mjs [--dry]
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry');

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
 * A template-literal pair. The bodies cannot contain a backtick.
 *
 * The leading `\b` matters. Without it, the pattern matches the trailing `sBn` of
 * one `isBn` plus the `?` of the *next* one — so `isBn ? a : b` where `a` and `b` are
 * template literals was read as `isBn` matching just the `i`, with `sBn ? …` as the
 * body. Every key was then wrong and every rewrite was skipped.
 */
const TEMPLATE_PAIR = /\bisBn\s*\?\s*`([^`]*)`\s*:\s*`([^`]*)`/g;

/**
 * A plain-string pair where one side uses double quotes.
 *
 * The first pass only matched single-quoted strings, so a pair whose English side
 * contains an apostrophe ("View Today's Routine") was left behind.
 *
 * The leading `\b` matters here for the same reason as above.
 */
const MIXED_PAIR =
  /\bisBn\s*\?\s*'((?:[^'\\]|\\.)*)'\s*:\s*"((?:[^"\\]|\\.)*)"|\bisBn\s*\?\s*"((?:[^"\\]|\\.)*)"\s*:\s*'((?:[^'\\]|\\.)*)'/g;

function collectFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

/**
 * Split a template body into its literal text and its interpolations.
 *
 * The literal text is kept verbatim so it can be rebuilt into a fallback template
 * later.
 */
function parseTemplate(body) {
  const parts = [];
  let i = 0;
  let literal = '';
  while (i < body.length) {
    if (body[i] === '\\') {
      literal += body.slice(i, i + 2);
      i += 2;
      continue;
    }
    if (body[i] === '$' && body[i + 1] === '{') {
      let depth = 0;
      let j = i + 1;
      for (; j < body.length; j++) {
        if (body[j] === '{') depth++;
        else if (body[j] === '}') {
          depth--;
          if (depth === 0) break;
        }
      }
      if (literal) {
        parts.push({ kind: 'lit', value: literal });
        literal = '';
      }
      parts.push({ kind: 'expr', value: body.slice(i + 2, j) });
      i = j + 1;
      continue;
    }
    literal += body[i];
    i++;
  }
  if (literal) parts.push({ kind: 'lit', value: literal });
  return parts;
}

/** Rebuild a template literal source string from its parts. */
function toTemplate(parts) {
  let out = '`';
  for (const p of parts) {
    if (p.kind === 'lit') out += p.value;
    else out += `\${${p.value.trim()}}`;
  }
  return out + '`';
}

/** Turn a parsed template into a dictionary value with `{name}` placeholders. */
function toMessage(parts, names) {
  let out = '';
  for (const p of parts) {
    if (p.kind === 'lit') out += p.value;
    else out += `{${names[p.value]}}`;
  }
  return out;
}

/** A readable key from the English side. */
function slug(s) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 48) || 'text'
  );
}

const usedKeys = new Set();
function uniqueKey(ns, base) {
  let key = base;
  let n = 2;
  while (usedKeys.has(`${ns}.${key}`)) key = `${base}_${n++}`;
  usedKeys.add(`${ns}.${key}`);
  return key;
}

const skipped = [];
const perFile = new Map();

for (const abs of collectFiles(join(ROOT, 'src'))) {
  const rel = abs.slice(ROOT.length + 1).replace(/\\/g, '/');
  const ns = NAMESPACE[rel];
  if (!ns) continue;
  const src = readFileSync(abs, 'utf8');

  const pairs = [];

  for (const m of src.matchAll(TEMPLATE_PAIR)) {
    const bnParts = parseTemplate(m[1]);
    const enParts = parseTemplate(m[2]);
    const enExprs = enParts.filter((p) => p.kind === 'expr');
    const bnExprs = bnParts.filter((p) => p.kind === 'expr');

    // The two sides do not always have the same number of interpolations.
    //
    // English pluralises by interpolating a suffix — `${num} Child${num > 1 ? 'ren' :
    // ''}` — while Bangla does not, so the Bangla side has one fewer. The extra
    // English interpolation is a plural suffix, not a missing value.
    //
    // The sides are therefore aligned from the left: the first `min(en, bn)` are the
    // same value, and any extra trailing ones belong only to that side.
    const shared = Math.min(enExprs.length, bnExprs.length);

    // Name the placeholders `p0`, `p1`, … by order of first appearance in the
    // English side. The Bangla side is matched by position, because it often
    // wraps the same value differently (`toBnNum(n)` vs `n`).
    const names = {};
    enExprs.forEach((e) => {
      if (!(e.value in names)) names[e.value] = `p${Object.keys(names).length}`;
    });
    const bnNames = {};
    bnExprs.forEach((e, i) => {
      // An expression past the shared range is a suffix only this side has.
      bnNames[e.value] = names[enExprs[i]?.value] ?? `p${i}`;
    });

    pairs.push({
      kind: 'template',
      enParts,
      bnParts,
      names,
      bnNames,
      shared,
      en: toMessage(enParts, names),
      bn: toMessage(bnParts, bnNames),
    });
  }

  for (const m of src.matchAll(MIXED_PAIR)) {
    const en = m[2] !== undefined ? m[2] : m[4];
    const bn = m[1] !== undefined ? m[1] : m[3];
    pairs.push({ kind: 'plain', en, bn, enParts: [{ kind: 'lit', value: en }] });
  }

  if (pairs.length) perFile.set(rel, { ns, pairs });
}

// --- Assign keys ----------------------------------------------------------------
const entries = new Map(); // `${rel}::${en}` → entry

for (const [rel, { ns, pairs }] of perFile) {
  for (const p of pairs) {
    const id = `${rel}::${p.en}`;
    if (entries.has(id)) continue;
    const base = slug(p.en.replace(/\{p\d+\}/g, ' '));
    entries.set(id, { ns, key: uniqueKey(ns, base), en: p.en, bn: p.bn, rel, pair: p });
  }
}

// --- Rewrite the source files -----------------------------------------------------
let rewritten = 0;

for (const [rel, { ns, pairs }] of perFile) {
  const abs = join(ROOT, rel);
  let src = readFileSync(abs, 'utf8');

  const build = (whole, enText) => {
    const entry = entries.get(`${rel}::${enText}`);
    if (!entry) {
      console.log(
        'MISS',
        rel,
        JSON.stringify(enText),
        '| have:',
        [...entries.keys()].filter((k) => k.startsWith(rel)).join(' || ')
      );
      return whole;
    }
    const p = entry.pair;

    if (p.kind === 'plain') {
      return `t('${entry.ns}.${entry.key}')`;
    }

    const enExprs = p.enParts.filter((x) => x.kind === 'expr');
    const bnExprs = p.bnParts.filter((x) => x.kind === 'expr');

    // Each placeholder in the English message needs a value. The first `shared`
    // placeholders exist on both sides and are locale-aware; any beyond that are
    // English-only (a plural suffix), so they take the English expression.
    const vars = enExprs.map((e, idx) => {
      const name = p.names[e.value];
      const enExpr = e.value.trim();
      const bnExpr = bnExprs[idx] ? bnExprs[idx].value.trim() : undefined;
      if (bnExpr === undefined) return `${name}: ${enExpr}`;
      return enExpr === bnExpr ? `${name}: ${enExpr}` : `${name}: isBn ? ${bnExpr} : ${enExpr}`;
    });

    // The Bangla message may use a placeholder the English one does not — it can
    // only happen when the Bangla side has *more* interpolations, which no pair
    // currently does, but the value is still needed so the message renders.
    for (const b of bnExprs) {
      const name = p.bnNames[b.value];
      if (name && !vars.some((v) => v.startsWith(`${name}:`))) {
        vars.push(`${name}: isBn ? ${b.value.trim()} : ''`);
      }
    }

    const fallback = toTemplate(p.enParts);
    return `t('${entry.ns}.${entry.key}', { ${vars.join(', ')} }, ${fallback})`;
  };

  // NOTE: a `replace` callback receives the match string first, then the capture
  // groups as separate arguments. Reading `m[1]`/`m[2]` off the match string
  // indexes into the *text* — `m[2]` of "isBn ? …" is the letter "B".
  let next = src.replace(TEMPLATE_PAIR, (whole, bnBody, enBody) => {
    const enParts = parseTemplate(enBody);
    const bnParts = parseTemplate(bnBody);
    const names = {};
    enParts
      .filter((p) => p.kind === 'expr')
      .forEach((e) => {
        if (!(e.value in names)) names[e.value] = `p${Object.keys(names).length}`;
      });
    return build(whole, toMessage(enParts, names));
  });

  next = next.replace(MIXED_PAIR, (whole, g1, g2, g3, g4) => {
    const en = g2 !== undefined ? g2 : g4;
    return build(whole, en);
  });

  if (next === src) continue;
  rewritten++;

  // Make sure `t` is in scope.
  if (/t\('[a-zA-Z]+\./.test(next) && !/const\s*\{[^}]*\bt\b[^}]*\}\s*=\s*useI18n\(\)/.test(next)) {
    const destructure = next.match(/const\s*\{\s*([^}]*?)\s*\}\s*=\s*useI18n\(\)/);
    if (destructure) {
      const names = destructure[1].split(',').map((s) => s.trim()).filter(Boolean);
      next = next.replace(destructure[0], `const { t, ${names.join(', ')} } = useI18n()`);
    }
  }

  if (!DRY) writeFileSync(abs, next, 'utf8');
}

// --- Write the dictionary entries ---------------------------------------------------
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
console.log(`left for manual work: ${skipped.length}`);
for (const s of skipped) console.log(`   ${s.file}: ${s.reason}\n      ${s.text}`);
