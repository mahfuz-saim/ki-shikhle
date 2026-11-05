#!/usr/bin/env node
/**
 * One-off repair: make the dictionaries match what each call site actually shows.
 *
 * Two classes of problem, both left behind by the migration codemod:
 *
 *  1. **Collisions.** `slug()` strips `{pN}`, so a template whose English text is
 *     only interpolations (`${avgScore}%`) slugifies to `text` — the same key the
 *     plain-literal codemod hands out for its own strings. The two codemods each
 *     kept their own `usedKeys` set, so neither saw the other's keys and one of
 *     the two was silently dropped. Seven template entries were lost that way
 *     (`childHome.text`, `childQuiz.text`, `schedule.text`/`text_2`/`text_3`,
 *     `charts.text`/`text_2`), and `schedule.full_date` was renamed by hand but
 *     never written to the dictionary.
 *
 *  2. **Shared keys.** A pre-existing key like `child.add` ("Add Child") was
 *     reused at call sites whose own text says something different
 *     ("Create Student Account"). The key resolves, so nothing breaks — the
 *     screen just says the wrong thing.
 *
 * The fix is deliberately minimal:
 *
 *  - A colliding call site gets its own, descriptive key. The value moves with
 *    it, so the English and the Bangla stay together.
 *  - A call site whose text is simply a *better* wording of what the key already
 *    holds gets the dictionary value updated instead. No new key.
 *
 * Every replacement is asserted, so the script fails loudly rather than half
 * applying. It is idempotent: running it twice does nothing the second time.
 *
 * Usage:  node scripts/add-i18n-keys.mjs [--dry]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry');

const enPath = join(ROOT, 'src/messages/en.json');
const bnPath = join(ROOT, 'src/messages/bn.json');
const en = JSON.parse(readFileSync(enPath, 'utf8'));
const bn = JSON.parse(readFileSync(bnPath, 'utf8'));

/**
 * Source edits.
 *
 * `from` must appear exactly once unless `count` says otherwise — the script
 * refuses to guess.
 */
const SOURCE_EDITS = [
  // --- The collisions -------------------------------------------------------

  // `childHome.text` held the demo's pending-quiz title and was also used for
  // the average score. The score gets its own key.
  {
    file: 'src/app/child/page.tsx',
    from: `t('childHome.text', {`,
    to: `t('childHome.avg_score', {`,
    count: 1,
  },
  // …and the title gets a name that says what it is.
  {
    file: 'src/app/child/page.tsx',
    from: `t('childHome.text')`,
    to: `t('childHome.pending_quiz_title')`,
    count: 1,
  },

  // `childQuiz.text` held the page heading and was also used for the average
  // score and the highest score.
  {
    file: 'src/app/child/quiz/page.tsx',
    from: `t('childQuiz.text', {`,
    to: `t('childQuiz.avg_score', {`,
    count: 2,
  },
  {
    file: 'src/app/child/quiz/page.tsx',
    from: `t('childQuiz.text')`,
    to: `t('childQuiz.heading')`,
    count: 1,
  },
  // The "Highest Score" card was showing the *average*. It had its own
  // `highestScore` value all along and simply was not using it.
  {
    file: 'src/app/child/quiz/page.tsx',
    from: `                {t('childQuiz.avg_score', { p0: isBn ? toBnNum(avgScore) : avgScore }, \`\${avgScore}%\`)}
              </div>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">
                {t('childQuiz.text_16')}`,
    to: `                {t('childQuiz.highest_score', { p0: isBn ? toBnNum(highestScore) : highestScore }, \`\${highestScore}%\`)}
              </div>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">
                {t('childQuiz.text_16')}`,
    count: 1,
  },

  // `schedule.text_2` / `text_3` held the demo timetable's period names and
  // were also used for the week header's dates.
  {
    file: 'src/app/schedule/page.tsx',
    from: `t('schedule.text_2', {`,
    to: `t('schedule.week_of_month', {`,
    count: 1,
  },
  {
    file: 'src/app/schedule/page.tsx',
    from: `t('schedule.text_3', {`,
    to: `t('schedule.week_date_range', {`,
    count: 1,
  },

  // `charts.text` / `text_2` held the axis unit and the tooltip's "mins", and
  // were also used for the lesson count and the percentage.
  {
    file: 'src/components/charts/study-time-chart.tsx',
    from: `unit={t('charts.text')}`,
    to: `unit={t('charts.axis_unit')}`,
    count: 1,
  },
  {
    file: 'src/components/charts/study-time-chart.tsx',
    from: `t('charts.text_2')}`,
    to: `t('charts.minutes')}`,
    count: 1,
  },
  {
    file: 'src/components/charts/study-time-chart.tsx',
    from: `t('charts.text', {`,
    to: `t('charts.lesson_count', {`,
    count: 1,
  },
  {
    file: 'src/components/charts/study-time-chart.tsx',
    from: `t('charts.text_2', {`,
    to: `t('charts.percentage', {`,
    count: 1,
  },

  // --- The shared keys ------------------------------------------------------
  //
  // Each of these call sites says something different from the key it used, so
  // each gets its own key.

  // `child.add` — the button, the modal title and the header link all differ.
  {
    file: 'src/app/children/page.tsx',
    from: `title={t('child.add', 'Create Student Account')}`,
    to: `title={t('child.create_account', 'Create Student Account')}`,
    count: 1,
  },
  {
    file: 'src/app/children/page.tsx',
    from: `t('child.add', 'Create Student Account')`,
    to: `t('child.create_account', 'Create Student Account')`,
    count: 1,
  },
  {
    file: 'src/components/layout/header.tsx',
    from: `t('child.add', 'Manage / Add Student')`,
    to: `t('child.manage_accounts', 'Manage / Add Student')`,
    count: 1,
  },

  // `child.name` — "Student Full Name" when creating, "Full Name" when editing.
  {
    file: 'src/app/children/page.tsx',
    from: `t('child.name', 'Student Full Name')`,
    to: `t('child.student_full_name', 'Student Full Name')`,
    count: 1,
  },

  // `child.nickname` — the field is optional when creating.
  {
    file: 'src/app/children/page.tsx',
    from: `t('child.nickname', 'Nickname (Optional)')`,
    to: `t('child.nickname_optional', 'Nickname (Optional)')`,
    count: 1,
  },

  // `common.loading` — three different words for "busy".
  {
    file: 'src/app/children/page.tsx',
    from: `t('common.loading', 'Creating...')`,
    to: `t('common.creating', 'Creating...')`,
    count: 1,
  },
  {
    file: 'src/app/children/page.tsx',
    from: `t('common.loading', 'Saving...')`,
    to: `t('common.saving', 'Saving...')`,
    count: 2,
  },
  {
    file: 'src/app/notes/page.tsx',
    from: `t('common.loading', 'Saving...')`,
    to: `t('common.saving', 'Saving...')`,
    count: 1,
  },
  {
    file: 'src/app/schedule/page.tsx',
    from: `t('common.loading', 'Saving...')`,
    to: `t('common.saving', 'Saving...')`,
    count: 1,
  },
  {
    file: 'src/app/quizzes/[id]/page.tsx',
    from: `t('common.loading', 'Loading quiz...')`,
    to: `t('common.loading_quiz', 'Loading quiz...')`,
    count: 1,
  },

  // `common.save` — "Save Changes" on a form, "Create Routine" on the schedule.
  {
    file: 'src/app/schedule/page.tsx',
    from: `t('common.save', 'Create Routine')`,
    to: `t('schedule.create_routine', 'Create Routine')`,
    count: 1,
  },

  // `schedule.createRoutine` — the modal's own button says "Add Routine".
  {
    file: 'src/app/schedule/page.tsx',
    from: `t('schedule.createRoutine', 'Add Routine')`,
    to: `t('schedule.add_routine', 'Add Routine')`,
    count: 1,
  },

  // `common.viewAll` — the dashboard's link goes to the calendar.
  {
    file: 'src/app/dashboard/page.tsx',
    from: `t('common.viewAll', 'View Calendar')`,
    to: `t('dashboard.view_calendar', 'View Calendar')`,
    count: 1,
  },

  // `nav.billing` — the header says "Subscription & Billing", the sidebar says
  // "Billing & Plans".
  {
    file: 'src/components/layout/header.tsx',
    from: `t('nav.billing', 'Subscription & Billing')`,
    to: `t('nav.subscription_billing', 'Subscription & Billing')`,
    count: 1,
  },
];

/**
 * The dictionary changes.
 *
 * `value` — the key's new English value, and its new Bangla value.
 * `add`   — a key that does not exist yet.
 */
const DICT_EDITS = [
  // --- The collisions -------------------------------------------------------

  ['childHome.pending_quiz_title', 'Primary Science: Safe Water & Purification', 'প্রাথমিক বিজ্ঞান: জীবনের জন্য পানি বিশুদ্ধকরণ', true],
  ['childHome.avg_score', '{p0}%', '{p0}%', true],
  ['childQuiz.heading', 'AI Revision Quiz Hub', 'এআই রিভিশন কুইজ সেন্টার', true],
  ['childQuiz.avg_score', '{p0}%', '{p0}%', true],
  ['childQuiz.highest_score', '{p0}%', '{p0}%', true],
  ['schedule.week_of_month', '{p0} {p1}', '{p0} {p1}', true],
  ['schedule.week_date_range', '{p0} {p1} – {p2} {p3}', '{p0} {p1} – {p2} {p3}', true],
  // The English date order is "Monday, March 5, 2026" and the Bangla one is
  // "সোমবার, ৫ মার্চ ২০২৬", so the two languages order the placeholders
  // differently. The call site passes p0=day, p1=date, p2=month, p3=year.
  ['schedule.full_date', '{p0}, {p2} {p1}, {p3}', '{p0}, {p1} {p2} {p3}', true],
  ['charts.axis_unit', ' m', ' মি', true],
  ['charts.minutes', 'mins', 'মিনিট', true],
  ['charts.lesson_count', '{p0}', '{p0}টি', true],
  ['charts.percentage', '{p0}%', '{p0}%', true],

  // --- The shared keys ------------------------------------------------------
  //
  // These keys already exist; the value is corrected to the wording the call
  // site uses. The Bangla is the one the pre-migration source carried.

  // `child.add` — the "Add Student Account" button.
  ['child.add', 'Add Student Account', 'নতুন শিক্ষার্থী অ্যাকাউন্ট যোগ করুন', false],
  ['child.create_account', 'Create Student Account', 'শিক্ষার্থী অ্যাকাউন্ট তৈরি করুন', true],
  ['child.manage_accounts', 'Manage / Add Student', 'শিক্ষার্থী পরিচালনা / যোগ করুন', true],
  ['child.student_full_name', 'Student Full Name', 'শিক্ষার্থীর পূর্ণ নাম', true],
  ['child.nickname', 'Nickname', 'ডাকনাম', false],
  ['child.nickname_optional', 'Nickname (Optional)', 'ডাকনাম (ঐচ্ছিক)', true],
  ['child.grade', 'Class / Grade', 'শ্রেণী / গ্রেড', false],
  ['child.edit', 'Edit Student Profile', 'শিক্ষার্থীর প্রোফাইল সম্পাদনা', false],
  ['child.selectChild', 'Switch Student', 'শিক্ষার্থী পরিবর্তন করুন', false],

  ['common.creating', 'Creating...', 'তৈরি হচ্ছে...', true],
  ['common.saving', 'Saving...', 'সংরক্ষণ হচ্ছে...', true],
  ['common.loading_quiz', 'Loading quiz...', 'কুইজ লোড হচ্ছে...', true],

  ['schedule.create_routine', 'Create Routine', 'রুটিন তৈরি করুন', true],
  ['schedule.add_routine', 'Add Routine', 'রুটিন যোগ', true],
  ['schedule.routineName', 'Routine Name', 'রুটিনের নাম', false],
  ['schedule.weekdays', 'Days of Week', 'সপ্তাহের দিনগুলো', false],
  ['schedule.duration', 'Duration (mins)', 'সময়কাল (মিনিট)', false],

  ['notes.saveNote', 'Save Note to Library', 'নোট লাইব্রেরিতে সংরক্ষণ করুন', false],

  ['billing.invoices', 'Invoices & Receipts', 'ইনভয়েস ও রসিদ', false],
  ['billing.demoCheckout', 'Complete Subscription (Demo)', 'সাবস্ক্রিপশন সম্পন্ন করুন (ডেমো)', false],

  ['quiz.builderTitle', 'AI Quiz Builder', 'এআই কুইজ বিল্ডার', false],
  ['quiz.scope', 'Lessons Scope', 'পাঠের পরিধি', false],
  ['quiz.difficulty', 'Difficulty', 'কठিনতা', false],
  ['quiz.language', 'Language', 'ভাষা', false],
  ['quiz.regenerateQuestion', 'Regenerate', 'পুনরায় তৈরি করুন', false],
  ['quiz.removeQuestion', 'Remove', 'বাদ দিন', false],

  ['dashboard.scoreTrend', 'Quiz Score Progress', 'কুইজ স্কোর অগ্রগতি', false],
  ['dashboard.subjectMastery', 'Subject Mastery Radar', 'বিষয়ে দক্ষতার রাডার', false],
  ['dashboard.weakestTopics', 'Needs Practice', 'রিভিশন ও অনুশীলনের প্রয়োজন', false],
  ['dashboard.strongestTopics', 'Mastered Topics', 'আয়ত্তাধীন অধ্যায়সমূহ', false],
  ['dashboard.view_calendar', 'View Calendar', 'ক্যালেন্ডার দেখুন', true],

  ['nav.subscription_billing', 'Subscription & Billing', 'সাবস্ক্রিপশন ও বিলিং', true],
  ['nav.admin', 'Admin Portal', 'অ্যাডমিন পোর্টাল', false],
];

function setDeep(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

// --- Rewrite the source files -------------------------------------------------
const problems = [];
let applied = 0;

// Group by file so each file is read and written once.
const byFile = new Map();
for (const edit of SOURCE_EDITS) {
  if (!byFile.has(edit.file)) byFile.set(edit.file, []);
  byFile.get(edit.file).push(edit);
}

for (const [file, edits] of byFile) {
  const abs = join(ROOT, file);
  let src = readFileSync(abs, 'utf8');

  // The needles below are written with `\n`. The files in this repo use CRLF, so
  // a multi-line needle has to be re-spaced to match, or the match silently
  // fails.
  const eol = src.includes('\r\n') ? '\r\n' : '\n';
  const spacify = (s) => (eol === '\r\n' ? s.replace(/\n/g, '\r\n') : s);

  for (const edit of edits) {
    const from = spacify(edit.from);
    const to = spacify(edit.to);
    const found = src.split(from).length - 1;
    const expected = edit.count ?? 1;
    if (found !== expected) {
      problems.push(`${file}: expected ${expected} occurrence(s) of ${JSON.stringify(edit.from.slice(0, 70))}, found ${found}`);
      continue;
    }
    src = src.split(from).join(to);
    applied++;
  }

  if (!DRY) writeFileSync(abs, src, 'utf8');
}

// --- Update the dictionaries --------------------------------------------------
let added = 0;
let updated = 0;

for (const [key, enValue, bnValue, isNew] of DICT_EDITS) {
  const [ns, name] = key.split('.');
  const curEn = en[ns] && en[ns][name];
  const curBn = bn[ns] && bn[ns][name];
  const exists = curEn !== undefined;

  if (!exists && !isNew) {
    problems.push(`${key} does not exist but was not marked as new`);
    continue;
  }
  if (exists && isNew) {
    problems.push(`${key} already exists (${JSON.stringify(curEn)}) but was marked as new`);
    continue;
  }
  if (exists && curEn === enValue && curBn === bnValue) continue;

  setDeep(en, key, enValue);
  setDeep(bn, key, bnValue);
  if (exists) updated++;
  else added++;
}

if (!DRY) {
  writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
  writeFileSync(bnPath, JSON.stringify(bn, null, 2) + '\n', 'utf8');
}

console.log(`source edits applied: ${applied}/${SOURCE_EDITS.length}`);
console.log(`dictionary entries added: ${added}, updated: ${updated}`);
console.log(`problems: ${problems.length}`);
for (const p of problems) console.log('   ' + p);

if (problems.length) process.exitCode = 1;
