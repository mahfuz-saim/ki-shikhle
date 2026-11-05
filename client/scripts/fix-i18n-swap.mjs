#!/usr/bin/env node
/**
 * One-off repair: put each message back in the file it belongs to.
 *
 * The migration codemod read `isBn ? 'বাংলা' : 'English'` as if the **first** group
 * were the English one, so every entry landed in the wrong file: the Bangla strings
 * ended up in `en.json` and the English strings in `bn.json`.
 *
 * Three things make this less than a plain whole-file swap:
 *
 *  - `en.json` legitimately holds a couple of Bangla strings (`brandBn`, `taglineBn`),
 *    and `bn.json` holds their English counterparts.
 *  - The 107 keys that existed **before** the migration were already correct. They
 *    must be restored from the pre-migration files, not re-derived by script detection.
 *  - A few messages were only ever written in one language — the other side came from
 *    the `t()` call's fallback argument. For those the dictionary entry is the Bangla
 *    text and the *fallback* is the English text, so the two files hold opposite
 *    scripts and the swap has to move the English into `en.json`.
 *
 * The repair is therefore: restore every pre-existing key from the pre-migration
 * files, then for each newly-added key put the Bangla text in `bn.json` and the
 * English text in `en.json`. A message with no script at all (a number, a code) is
 * ambiguous and is left where it is — the two files agree on those.
 *
 * Usage:  node scripts/fix-i18n-swap.mjs [--dry]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(ROOT, '..');
const DRY = process.argv.includes('--dry');

const enPath = join(ROOT, 'src/messages/en.json');
const bnPath = join(ROOT, 'src/messages/bn.json');

/**
 * The commit before the i18n migration, where the two files were still correct.
 */
const PRE_MIGRATION = 'HEAD~1';
/**
 * The commit that applied the migration, with the swapped dictionaries.
 *
 * The repair reads the dictionaries from **git**, not from the working tree, so that
 * running it twice gives the same result. Reading the working tree would make the
 * script flip the files back and forth on every run.
 */
const MIGRATED = 'HEAD';

function gitShow(ref, path) {
  try {
    return JSON.parse(
      execFileSync('git', ['show', `${ref}:${path}`], {
        cwd: REPO,
        maxBuffer: 1e8,
        encoding: 'utf8',
      })
    );
  } catch {
    return null;
  }
}

const preEn = gitShow(PRE_MIGRATION, 'client/src/messages/en.json');
const preBn = gitShow(PRE_MIGRATION, 'client/src/messages/bn.json');
const en = gitShow(MIGRATED, 'client/src/messages/en.json');
const bn = gitShow(MIGRATED, 'client/src/messages/bn.json');

if (!preEn || !preBn || !en || !bn) {
  console.error(`Could not read the dictionaries from ${PRE_MIGRATION} / ${MIGRATED}.`);
  process.exit(1);
}

const BENGALI = /[\u0980-\u09FF]/;
const isBnText = (s) => BENGALI.test(String(s));

/** A flat `a.b.c` → value map. */
function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flatten(v, path, out);
    else out[path] = v;
  }
  return out;
}

/** Rebuild a nested object from a flat map. */
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

const preEnFlat = flatten(preEn);
const preBnFlat = flatten(preBn);
const nextEn = { ...flatten(en) };
const nextBn = { ...flatten(bn) };

// 1. Restore every pre-existing key to exactly what it was.
let restored = 0;
for (const k of Object.keys(preEnFlat)) {
  if (nextEn[k] !== preEnFlat[k]) {
    nextEn[k] = preEnFlat[k];
    restored++;
  }
}
for (const k of Object.keys(preBnFlat)) {
  if (nextBn[k] !== preBnFlat[k]) {
    nextBn[k] = preBnFlat[k];
    restored++;
  }
}

// 2. Fix the newly-added keys: Bangla goes to bn.json, English to en.json.
//
// This is a *placement* rule, not a swap. The migration left the two files in
// different states for different keys — most were inverted, but a handful happened to
// land correctly (their English side was the only one the codemod could read from a
// template). Swapping blindly would break those again; placing by script does not.
let placed = 0;
const ambiguous = [];
for (const k of Object.keys(nextEn)) {
  if (k in preEnFlat || k in preBnFlat) continue; // already restored above
  const a = nextEn[k];
  const b = nextBn[k];
  if (b === undefined) {
    // Only one file has it. If it is Bangla, it belongs in bn.json — but there is no
    // English counterpart, so the entry stays in en.json as a safety net: `t()` falls
    // back to the call site's English fallback anyway.
    continue;
  }

  const aBn = isBnText(a);
  const bBn = isBnText(b);
  if (aBn !== bBn) {
    // The English one goes to en.json and the Bangla one to bn.json.
    nextEn[k] = aBn ? b : a;
    nextBn[k] = aBn ? a : b;
    placed++;
  } else if (!aBn && !bBn && String(a).trim() !== String(b).trim()) {
    ambiguous.push(k);
  }
}

console.log(`pre-existing values restored: ${restored}`);
console.log(`newly-added keys placed:      ${placed}`);
console.log(`ambiguous pairs left alone:    ${ambiguous.length}`);
for (const k of ambiguous) console.log(`   ${k}`);

if (!DRY) {
  writeFileSync(enPath, JSON.stringify(unflatten(nextEn), null, 2) + '\n', 'utf8');
  writeFileSync(bnPath, JSON.stringify(unflatten(nextBn), null, 2) + '\n', 'utf8');
}

const check = (o) => {
  let bn = 0;
  let tot = 0;
  const walk = (x) => {
    for (const v of Object.values(x)) {
      if (v && typeof v === 'object') walk(v);
      else {
        tot++;
        if (isBnText(v)) bn++;
      }
    }
  };
  walk(o);
  return `${bn}/${tot}`;
};
console.log(`after: en.json Bengali values ${check(nextEn)}, bn.json ${check(nextBn)}`);
