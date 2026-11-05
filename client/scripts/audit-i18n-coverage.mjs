#!/usr/bin/env node
/**
 * Audit: every `isBn ? '…' : '…'` pair that existed before the migration should have
 * both of its strings in the dictionaries.
 *
 * The codemod assigns keys by slugifying the English text, and the slug function
 * strips non-ASCII — so a Bangla string slugifies to an empty string and every such
 * pair collapses onto the same `text`, `text_2`, … sequence. A collision could
 * therefore have dropped a string entirely. This script checks that none did.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(ROOT, '..');
const PRE = process.argv[2] || 'HEAD~3';

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

const enVals = new Set(Object.values(flatten(en)).map(String));
const bnVals = new Set(Object.values(flatten(bn)).map(String));

const files = execFileSync('git', ['ls-tree', '-r', '--name-only', PRE, 'client/src'], {
  cwd: REPO,
  maxBuffer: 1e8,
  encoding: 'utf8',
})
  .split('\n')
  .filter((f) => /\.tsx?$/.test(f));

const PAIR = /\bisBn\s*\?\s*'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)'/g;

let checked = 0;
const missing = [];
for (const f of files) {
  const src = execFileSync('git', ['show', `${PRE}:${f}`], {
    cwd: REPO,
    maxBuffer: 1e8,
    encoding: 'utf8',
  });
  for (const m of src.matchAll(PAIR)) {
    checked++;
    const bnTxt = m[1].replace(/\\'/g, "'");
    const enTxt = m[2].replace(/\\'/g, "'");
    if (!enVals.has(enTxt) || !bnVals.has(bnTxt)) {
      missing.push({ file: f.replace('client/', ''), en: enTxt, bn: bnTxt });
    }
  }
}

console.log(`pre-migration plain-literal pairs checked: ${checked}`);
console.log(`pairs with a string missing from the dictionaries: ${missing.length}`);
const seen = new Set();
for (const m of missing) {
  const key = m.en;
  if (seen.has(key)) continue;
  seen.add(key);
  console.log(`   ${m.file} | en=${JSON.stringify(m.en.slice(0, 70))} | bn=${JSON.stringify(m.bn.slice(0, 50))}`);
}
