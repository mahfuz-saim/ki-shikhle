#!/usr/bin/env node
/**
 * Audit: no inline `isBn ? '…' : '…'` pair should be left in the source when both of
 * its strings are in the message dictionaries.
 *
 * A pair that *is* in the dictionaries but is still inline is a leftover the migration
 * did not reach — the string exists, but the call site still hardcodes it, so the
 * dictionary can never be the single source of truth.
 *
 * A pair whose strings are **not** in the dictionaries is a different problem (the
 * string was never migrated) and is reported separately.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
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

function collect(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const f = join(dir, e.name);
    if (e.isDirectory()) collect(f, out);
    else if (/\.tsx?$/.test(e.name)) out.push(f);
  }
  return out;
}

const PAIR = /\bisBn\s*\?\s*'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)'/g;

const leftover = [];
const unmigrated = [];
let total = 0;

for (const abs of collect(join(ROOT, 'src'))) {
  const rel = abs.slice(ROOT.length + 1).replace(/\\/g, '/');
  const src = readFileSync(abs, 'utf8');
  for (const m of src.matchAll(PAIR)) {
    total++;
    const bnTxt = m[1].replace(/\\'/g, "'");
    const enTxt = m[2].replace(/\\'/g, "'");
    if (enVals.has(enTxt) && bnVals.has(bnTxt)) {
      leftover.push({ rel, en: enTxt, bn: bnTxt });
    } else {
      unmigrated.push({ rel, en: enTxt, bn: bnTxt });
    }
  }
}

console.log(`inline plain-literal pairs in the source: ${total}`);
console.log(`  already in the dictionaries (leftovers): ${leftover.length}`);
console.log(`  never migrated:                         ${unmigrated.length}`);

if (leftover.length) {
  console.log('\n--- leftovers (in the dictionary but still inline) ---');
  const seen = new Set();
  for (const l of leftover) {
    const k = l.rel + '::' + l.en;
    if (seen.has(k)) continue;
    seen.add(k);
    console.log(`   ${l.rel} | ${JSON.stringify(l.en.slice(0, 60))}`);
  }
}

if (unmigrated.length) {
  console.log('\n--- never migrated ---');
  const seen = new Set();
  for (const l of unmigrated) {
    const k = l.rel + '::' + l.en;
    if (seen.has(k)) continue;
    seen.add(k);
    console.log(`   ${l.rel} | ${JSON.stringify(l.en.slice(0, 60))}`);
  }
}
