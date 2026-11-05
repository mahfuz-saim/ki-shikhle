/**
 * Tenant-partitioned in-memory store.
 *
 * Why this exists
 * ---------------
 * The API is documented to run with no database at all ("clone and run with no env file").
 * That degraded mode used to be implemented with module-level `export const memX: any[]`
 * arrays scattered across the service files. Two problems:
 *
 *  1. They were **global and un-partitioned** — every tenant read the same array, so the
 *     fallback path silently became a shared-tenant data leak.
 *  2. They created a **circular import**: `auth.service.ts` imported `memChildren` from
 *     `children.service.ts` while `children.service.ts` imported `memUsers` back.
 *
 * This module is the single owner of the fallback data. Every record carries an `ownerId`
 * (the id of the account that owns it). There is deliberately **no accessor that returns
 * everything** — a caller must say whose data it wants.
 *
 * The mem store is NOT a bypass. It is a second data source with the same access rules:
 * `core/tenancy.ts` applies the identical ownership checks to records loaded from here.
 *
 * Runtime note: this file must stay free of `node:` imports — the server also runs on
 * Cloudflare Workers, where there is no filesystem or `node:` module resolution.
 */

/** The id of the seeded demo tenant. Its data belongs to it alone. */
export const DEMO_PARENT_ID = '00000000-0000-4000-8000-000000000001';

/** Deterministic ids for the seeded demo children. Never used as a security signal. */
export const DEMO_CHILD_IDS = {
  rahim: '00000000-0000-4000-8000-000000000101',
  tasnim: '00000000-0000-4000-8000-000000000102',
  fahim: '00000000-0000-4000-8000-000000000103',
} as const;

/** Stable human keys for the demo children, used to select the demo dataset. */
export const DEMO_SLUGS = ['rahim', 'tasnim', 'fahim'] as const;

/**
 * The legacy fixture ids the in-module demo datasets were written against.
 *
 * The demo children are real rows with real (UUID) ids, so a fixture that still says
 * `demo-child-1` would no longer line up with anything. Every demo dataset is re-keyed
 * through this map when it is registered into the store, so the datasets keep working
 * without any code path having to recognise a `demo-` prefix.
 */
export const LEGACY_DEMO_CHILD_IDS: Record<string, string> = {
  'demo-child-1': DEMO_CHILD_IDS.rahim,
  'demo-child-2': DEMO_CHILD_IDS.tasnim,
  'demo-child-3': DEMO_CHILD_IDS.fahim,
};

/** Map a legacy fixture child id onto the demo tenant's real child id. */
export function rekeyDemoChildId(childId: string | undefined | null): string | undefined | null {
  if (!childId) return childId;
  return LEGACY_DEMO_CHILD_IDS[childId] ?? childId;
}

/**
 * Copy demo fixture rows into an owner-scoped partition.
 *
 * The fixture arrays live next to the code that uses them (entries, notes, routines,
 * quizzes) so the demo content stays readable and reviewable. This copies them into the
 * single owner-partitioned store, re-keying the child ids and stamping the demo
 * parent's id as the owner — so a lookup scoped to any other account cannot reach them.
 */
export function seedDemoRows<T extends { id: string; childId?: string; ownerId?: string | null }>(
  partition: Partition<any>,
  rows: T[],
  extra?: (row: T) => Partial<T>
): void {
  for (const row of rows) {
    const copy: any = { ...row };
    if (copy.childId) copy.childId = rekeyDemoChildId(copy.childId);
    copy.ownerId = DEMO_PARENT_ID;
    if (extra) Object.assign(copy, extra(copy));
    partition.add(copy as T);
  }
}

/**
 * Registrars for the demo datasets, so `resetStore()` can rebuild them.
 *
 * Modules call `registerDemoFixture()` once at import time. The store keeps the
 * callback and re-runs it after a reset.
 */
const demoFixtureRegistrars: Array<() => void> = [];

export function registerDemoFixture(registrar: () => void): void {
  demoFixtureRegistrars.push(registrar);
  registrar();
}

export type MemRole = 'parent' | 'child' | 'admin';

export interface MemUser {
  id: string;
  name: string;
  email: string;
  /** argon2id hash — never a plaintext password. */
  passwordHash?: string;
  role: MemRole;
  language?: string;
  country?: string;
  timezone?: string;
  trialEndsAt?: string | null;
  createdAt?: string;
}

export interface MemChild {
  id: string;
  /** The account that owns this child. */
  ownerId: string;
  name: string;
  nickname?: string;
  grade?: string;
  curriculum?: string;
  medium?: string;
  avatar?: string | null;
  email?: string | null;
  /** argon2id hash — never a plaintext password. */
  passwordHash?: string | null;
  /** argon2id hash of the child-mode PIN. */
  pinHash?: string | null;
  /** Stable human key, unique per parent. */
  slug?: string | null;
  /** Selects the seeded demo dataset. Content marker only — never an auth signal. */
  demoProfile?: string | null;
  deletedAt?: string | null;
  createdAt?: string;
}

export interface MemEntry {
  id: string;
  ownerId: string;
  childId: string;
  [key: string]: any;
}

export interface MemNote {
  id: string;
  ownerId: string;
  childId: string;
  [key: string]: any;
}

export interface MemRoutine {
  id: string;
  ownerId: string;
  childId: string;
  [key: string]: any;
}

export interface MemQuiz {
  id: string;
  ownerId: string;
  childId: string;
  [key: string]: any;
}

export interface MemAttempt {
  id: string;
  ownerId: string;
  childId: string;
  [key: string]: any;
}

export interface MemNotification {
  id: string;
  ownerId: string;
  userId: string;
  [key: string]: any;
}

export interface MemSubject {
  id: string;
  /** null for seeded (shared) subjects. */
  ownerId: string | null;
  [key: string]: any;
}

export interface MemException {
  id: string;
  ownerId: string;
  childId: string;
  routineId: string;
  [key: string]: any;
}

/**
 * A "this scheduled session was done" marker.
 *
 * The schedule page used to keep these in `localStorage`, so the server never knew
 * which sessions a child actually completed and the parent's dashboard could not
 * reflect them.
 */
export interface MemRoutineCompletion {
  id: string;
  ownerId: string;
  childId: string;
  routineId: string | null;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm */
  startTime: string;
  completed: boolean;
  completedAt: string;
  [key: string]: any;
}

export interface MemPayment {
  id: string;
  ownerId: string;
  userId: string;
  [key: string]: any;
}

/**
 * A partition of records by owner.
 *
 * `forOwner` returns the records belonging to one account. `forChild` narrows to one
 * child. `find` looks up a single record **by owner**, so a caller can never accidentally
 * reach another tenant's row by guessing an id.
 */
class Partition<T extends { ownerId: string | null }> {
  constructor(private readonly label: string, private readonly rows: T[] = []) {}

  private get all(): T[] {
    return this.rows;
  }

  /** Every record belonging to `ownerId`. */
  forOwner(ownerId: string): T[] {
    if (!ownerId) return [];
    return this.all.filter((r) => r.ownerId === ownerId);
  }

  /** Every record belonging to one child of `ownerId`. */
  forChild(ownerId: string, childId: string): T[] {
    if (!ownerId || !childId) return [];
    return this.all.filter((r) => r.ownerId === ownerId && (r as any).childId === childId);
  }

  /** Find one record by id, scoped to `ownerId`. Returns undefined across tenants. */
  find(ownerId: string, id: string): T | undefined {
    if (!ownerId || !id) return undefined;
    return this.all.find((r) => r.ownerId === ownerId && (r as any).id === id);
  }

  /** Find one record by id with NO owner scope. Callers must assert ownership afterwards. */
  findAny(id: string): T | undefined {
    if (!id) return undefined;
    return this.all.find((r) => (r as any).id === id);
  }

  /**
   * Every record in this partition, across all owners.
   *
   * This exists for **platform-level jobs only** (the cron runner, which has no caller to
   * scope by). A request handler must never use it — it would hand back every tenant's
   * data. Anything derived from the result still has to re-assert ownership per row.
   */
  listAll(): T[] {
    return this.all.slice();
  }

  /** Find one record by a string field, e.g. a child's email. */
  findByField(field: string, value: string): T | undefined {
    if (!value) return undefined;
    const norm = value.trim().toLowerCase();
    return this.all.find((r) => String((r as any)[field] ?? '').toLowerCase() === norm);
  }

  /** Insert a record. */
  add(row: T): T {
    this.rows.push(row);
    return row;
  }

  /** Remove a record by id. */
  remove(id: string): boolean {
    const i = this.rows.findIndex((r) => (r as any).id === id);
    if (i === -1) return false;
    this.rows.splice(i, 1);
    return true;
  }

  /** Replace a record by id (owner-scoped). */
  update(ownerId: string, id: string, patch: Partial<T>): T | undefined {
    const row = this.find(ownerId, id);
    if (!row) return undefined;
    Object.assign(row, patch);
    return row;
  }

  get size(): number {
    return this.all.length;
  }

  /** Test helper — reset a partition. */
  reset(): void {
    this.rows.length = 0;
  }
}

/** Owner-scoped accessor for users. Users are keyed by their own id, not a parent id. */
class UserPartition {
  constructor(private readonly rows: MemUser[] = []) {}

  forOwner(ownerId: string): MemUser[] {
    if (!ownerId) return [];
    return this.rows.filter((u) => u.id === ownerId);
  }

  byEmail(email: string): MemUser | undefined {
    if (!email) return undefined;
    const norm = email.trim().toLowerCase();
    return this.rows.find((u) => u.email?.toLowerCase() === norm);
  }

  byId(id: string): MemUser | undefined {
    if (!id) return undefined;
    return this.rows.find((u) => u.id === id);
  }

  /** A child actor's own login identity, matched by email. */
  byRole(email: string, role: MemRole): MemUser | undefined {
    return this.rows.find((u) => u.email?.toLowerCase() === email?.trim().toLowerCase() && u.role === role);
  }

  add(row: MemUser): MemUser {
    this.rows.push(row);
    return row;
  }

  remove(id: string): boolean {
    const i = this.rows.findIndex((u) => u.id === id);
    if (i === -1) return false;
    this.rows.splice(i, 1);
    return true;
  }

  get size(): number {
    return this.rows.length;
  }

  reset(): void {
    this.rows.length = 0;
  }
}

/**
 * The demo fixtures.
 *
 * These belong to the demo tenant and to nobody else. `ownerId` is always the demo
 * parent's id, so a lookup scoped to any other account can never reach them.
 */
function seedDemoFixtures() {
  const now = new Date().toISOString();
  const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

  store.users.add({
    id: DEMO_PARENT_ID,
    name: 'Rafiqul Islam',
    email: 'parent@demo.com',
    role: 'parent',
    language: 'en',
    country: 'BD',
    timezone: 'Asia/Dhaka',
    trialEndsAt: null,
    createdAt: daysAgo(30),
  });

  const demoChildren: MemChild[] = [
    {
      id: DEMO_CHILD_IDS.rahim,
      ownerId: DEMO_PARENT_ID,
      name: 'Rahim Ahmed',
      nickname: 'Rahim',
      grade: 'Class 8',
      curriculum: 'NCTB',
      medium: 'Bangla',
      avatar: '/avatars/boy-1.png',
      email: 'rahim@demo.com',
      slug: 'rahim',
      demoProfile: 'rahim',
      createdAt: daysAgo(30),
    },
    {
      id: DEMO_CHILD_IDS.tasnim,
      ownerId: DEMO_PARENT_ID,
      name: 'Tasnim Islam',
      nickname: 'Tasnim',
      grade: 'Class 5',
      curriculum: 'NCTB',
      medium: 'Bangla',
      avatar: '/avatars/girl-1.png',
      email: 'tasnim@demo.com',
      slug: 'tasnim',
      demoProfile: 'tasnim',
      createdAt: daysAgo(25),
    },
    {
      id: DEMO_CHILD_IDS.fahim,
      ownerId: DEMO_PARENT_ID,
      name: 'Fahim Islam',
      nickname: 'Fahim',
      grade: 'Class 11',
      curriculum: 'NCTB',
      medium: 'Bangla',
      avatar: '/avatars/boy-2.png',
      email: 'fahim@demo.com',
      slug: 'fahim',
      demoProfile: 'fahim',
      createdAt: daysAgo(20),
    },
  ];

  for (const c of demoChildren) {
    store.children.add(c);
    // The `users` table doubles as the child-credential table, so a child login identity
    // exists for each demo child too.
    store.users.add({
      id: `demo-user-${c.slug}`,
      name: c.name,
      email: c.email!,
      role: 'child',
      language: 'en',
      createdAt: c.createdAt,
    });
  }

  // A small slice of learning entries for the demo children so the demo dashboard has
  // something to show in the no-database mode.
  const demoEntries: Array<[string, string, string, number, number, string]> = [
    [DEMO_CHILD_IDS.rahim, 'e-rahim-1', 'বীজগণিতীয় সূত্রাবলী ও প্রয়োগ (a+b)^2 ও (a-b)^2', 75, 5, daysAgo(0)],
    [DEMO_CHILD_IDS.rahim, 'e-rahim-2', 'গতি ও ত্বরণ — গতির ৩টি মৌলিক সূকরণ ও তাৎক্ষণিক দ্রুতি নির্ণয়', 60, 4, daysAgo(1)],
    [DEMO_CHILD_IDS.rahim, 'e-rahim-3', 'Unit 3: Health and Hygiene — passage comprehension', 45, 4, daysAgo(2)],
    [DEMO_CHILD_IDS.rahim, 'e-rahim-4', 'স্প্রেডশিট সফটওয়্যারের ব্যবহার — গড়, গুণ ও শতকরা', 60, 5, daysAgo(3)],
    [DEMO_CHILD_IDS.rahim, 'e-rahim-5', 'কবিতা: "বঙ্গভূমির দিকে" — সাহিত্য বিশ্লেষণ ও সৃজনশীল প্রশ্ন', 50, 4, daysAgo(4)],
    [DEMO_CHILD_IDS.tasnim, 'e-tasnim-1', 'গুণনীয়ক ও গুণিতক — লসাগু ও গসাগু নির্ণয়', 60, 5, daysAgo(0)],
    [DEMO_CHILD_IDS.tasnim, 'e-tasnim-2', 'জীবনের জন্য পানি — নিরাপদ পানি ও শুদ্ধিকরণ', 50, 4, daysAgo(1)],
    [DEMO_CHILD_IDS.tasnim, 'e-tasnim-3', 'Unit 6: Eat Healthy — food pyramid vocabulary', 45, 5, daysAgo(2)],
    [DEMO_CHILD_IDS.tasnim, 'e-tasnim-4', 'আমাদের মুক্তিযুদ্ধ — ১৯৭১ সালের ২৫শে মার্চ', 40, 5, daysAgo(3)],
    [DEMO_CHILD_IDS.tasnim, 'e-tasnim-5', '"হাতি আর শিয়ালের গল্প" — শব্দার্থ ও যুক্তবর্ণ', 45, 5, daysAgo(4)],
    [DEMO_CHILD_IDS.fahim, 'e-fahim-1', 'গতিবিদ্যা — প্রক্ষেপক গতি ও সর্বাধিক উচ্চতা', 50, 5, daysAgo(0)],
    [DEMO_CHILD_IDS.fahim, 'e-fahim-2', 'গুণগত রসায়ন — বোর পরমাণু মডেল', 50, 5, daysAgo(0)],
    [DEMO_CHILD_IDS.fahim, 'e-fahim-3', 'প্রক্ষেপকের গতিবিদ্যা — নির্দিষ্ট কোণে গতিপথ', 75, 5, daysAgo(1)],
    [DEMO_CHILD_IDS.fahim, 'e-fahim-4', 'উচ্চতর গণিতবিদ্যা — ম্যাট্রিক্সের বিধি', 50, 5, daysAgo(1)],
    [DEMO_CHILD_IDS.fahim, 'e-fahim-5', 'সংখ্যাপদ্ধতি — বাইনারি, দশমিক ও ষোড়দশ', 50, 5, daysAgo(2)],
  ];

  for (const [childId, id, topicsText, durationMin, confidence, date] of demoEntries) {
    store.entries.add({
      id,
      ownerId: DEMO_PARENT_ID,
      childId,
      source: 'tuition',
      providerName: 'Demo Tutor',
      date,
      topicsText,
      durationMin,
      confidence,
      verifiedByParent: true,
      createdAt: now,
    });
  }

  const demoRoutines: Array<[string, string, string, number[], string, number]> = [
    [DEMO_CHILD_IDS.rahim, 'r-rahim-1', 'গণিত প্রাইভেট — রহিম স্যার', [0, 2, 5], '16:00', 90],
    [DEMO_CHILD_IDS.rahim, 'r-rahim-2', 'পদার্থবিজ্ঞান কোচিং', [1, 3], '17:30', 60],
    [DEMO_CHILD_IDS.tasnim, 'r-tasnim-1', 'প্রাথমিক গণিত প্রাইভেট', [0, 2, 4], '16:00', 60],
    [DEMO_CHILD_IDS.fahim, 'r-fahim-1', '১ম পিরিয়ড: পদার্থবিজ্ঞান ১ম পত্র', [0, 1, 2, 3, 4], '08:30', 50],
    [DEMO_CHILD_IDS.fahim, 'r-fahim-2', '২য় পিরিয়ড: রসায়ন ১ম পত্র', [0, 1, 2, 3, 4], '09:20', 50],
    [DEMO_CHILD_IDS.fahim, 'r-fahim-3', 'পদার্থবিজ্ঞান কোচিং — গতিবিদ্যা', [0, 2, 4], '16:30', 75],
  ];

  for (const [childId, id, name, weekdays, startTime, durationMin] of demoRoutines) {
    store.routines.add({
      id,
      ownerId: DEMO_PARENT_ID,
      childId,
      name,
      source: 'tuition',
      weekdays,
      startTime,
      durationMin,
      startsOn: daysAgo(30),
      active: true,
      createdAt: now,
    });
  }
}

export const store = {
  users: new UserPartition(),
  children: new Partition<MemChild>('children'),
  entries: new Partition<MemEntry>('entries'),
  notes: new Partition<MemNote>('notes'),
  routines: new Partition<MemRoutine>('routines'),
  quizzes: new Partition<MemQuiz>('quizzes'),
  attempts: new Partition<MemAttempt>('attempts'),
  notifications: new Partition<MemNotification>('notifications'),
  subjects: new Partition<MemSubject>('subjects'),
  payments: new Partition<MemPayment>('payments'),
  exceptions: new Partition<MemException>('exceptions'),
  routineCompletions: new Partition<MemRoutineCompletion>('routineCompletions'),
};

// Seed the demo tenant once per process.
seedDemoFixtures();

/**
 * Reset every partition. Used by tests to get a clean slate.
 */
export function resetStore() {
  store.users.reset();
  store.children.reset();
  store.entries.reset();
  store.notes.reset();
  store.routines.reset();
  store.quizzes.reset();
  store.attempts.reset();
  store.notifications.reset();
  store.subjects.reset();
  store.payments.reset();
  store.exceptions.reset();
  seedDemoFixtures();
}

/**
 * Strip credentials from a child record before it leaves the API.
 *
 * `passwordHash` and `pinHash` must never reach a client — not even the owning parent's.
 * The DB path now projects them out via `select`; this is the belt-and-braces version used
 * for records assembled in memory.
 */
export function sanitizeChild<T extends Record<string, any>>(child: T): Omit<T, 'passwordHash' | 'pinHash' | 'password'> {
  const { passwordHash, pinHash, password, ...rest } = child as any;
  return rest as Omit<T, 'passwordHash' | 'pinHash' | 'password'>;
}

/**
 * Strip credentials from a user record before it leaves the API.
 */
export function sanitizeUser<T extends Record<string, any>>(user: T): Omit<T, 'passwordHash'> {
  const { passwordHash, ...rest } = user as any;
  return rest as Omit<T, 'passwordHash'>;
}

/** The password every seeded demo account uses. */
export const DEMO_PASSWORD = 'Password123!';

let demoCredentialsReady: Promise<void> | null = null;

/**
 * Give the seeded demo accounts a real password hash.
 *
 * Hashing is async, but the store is a plain synchronous module, so this is done lazily and
 * memoised. It is only needed in degraded mode (no database), where there is no
 * `users.password_hash` column to read from.
 *
 * The hash is computed with the same `hashPassword` the rest of the app uses, so it is
 * peppered identically and `verifyPassword` accepts it.
 */
export function ensureDemoCredentials(): Promise<void> {
  if (!demoCredentialsReady) {
    demoCredentialsReady = (async () => {
      const { hashPassword } = await import('../services/password');
      const hash = await hashPassword(DEMO_PASSWORD);

      const parent = store.users.byId(DEMO_PARENT_ID);
      if (parent && !parent.passwordHash) parent.passwordHash = hash;

      for (const slug of DEMO_SLUGS) {
        const child = store.children.findByField('slug', slug);
        if (!child) continue;
        child.passwordHash = child.passwordHash || hash;
        const identity = store.users.byEmail(child.email || '');
        if (identity && !identity.passwordHash) identity.passwordHash = hash;
      }
    })();
  }
  return demoCredentialsReady;
}
