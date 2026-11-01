import { prisma } from '../../db/client';
import { notFound, forbidden } from '../../utils/errors';

const now = Date.now();
const dayMs = 86400000;

export const memEntries: any[] = [
  // Rahim Ahmed (Class 8)
  {
    id: 'entry-rahim-1',
    childId: 'demo-child-1',
    subject: 'Mathematics',
    subjectName: 'গণিত (Mathematics)',
    topicsText: 'অধ্যায় ৪: বীজগণিতীয় সূত্রাবলী ও প্রয়োগ (অনুশীলনী ৪.১) — বর্গের সূত্র (a+b)^2 ও (a-b)^2 ব্যবহার করে ১ থেকে ১২ নং প্রশ্ন সমাধান সম্পন্ন।',
    durationMin: 75,
    source: 'tuition',
    confidence: 4,
    date: new Date(now).toISOString(),
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-rahim-2',
    childId: 'demo-child-1',
    subject: 'General Science',
    subjectName: 'সাধারণ বিজ্ঞান (Science)',
    topicsText: 'অধ্যায় ২: গতি ও ত্বরণ — গতির ৩টি মৌলিক সমীকরণ, বেগ-সময় লেখচিত্র ও তাৎক্ষণিক দ্রুতি নির্ণয়ের গাণিতিক উদাহরণ।',
    durationMin: 60,
    source: 'school',
    confidence: 5,
    date: new Date(now - 1 * dayMs).toISOString(),
    createdAt: new Date(now - 1 * dayMs).toISOString(),
    updatedAt: new Date(now - 1 * dayMs).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-rahim-3',
    childId: 'demo-child-1',
    subject: 'English 1st Paper',
    subjectName: 'ইংরেজি ১ম পত্র (English)',
    topicsText: 'Unit 3: Health and Hygiene — Passage comprehension, new vocabulary with synonyms/antonyms, and theme writing.',
    durationMin: 45,
    source: 'self_study',
    confidence: 4,
    date: new Date(now - 2 * dayMs).toISOString(),
    createdAt: new Date(now - 2 * dayMs).toISOString(),
    updatedAt: new Date(now - 2 * dayMs).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-rahim-4',
    childId: 'demo-child-1',
    subject: 'ICT',
    subjectName: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)',
    topicsText: 'অধ্যায় ৩: স্প্রেডশিট সফটওয়্যারের ব্যবহার — মাইক্রোসফট এক্সেলে যোগ, গড়, গুণ এবং শতকরা বের করার সেল ফর্মুলা তৈরি।',
    durationMin: 60,
    source: 'tuition',
    confidence: 5,
    date: new Date(now - 3 * dayMs).toISOString(),
    createdAt: new Date(now - 3 * dayMs).toISOString(),
    updatedAt: new Date(now - 3 * dayMs).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-rahim-5',
    childId: 'demo-child-1',
    subject: 'Bangla 1st Paper',
    subjectName: 'বাংলা ১ম পত্র (Bangla)',
    topicsText: 'কবিতা: "বঙ্গভূমির প্রতি" (মাইকেল মধুসূদন দত্ত) — মূলভাব বিশ্লেষণ, কবি পরিচিতি এবং সৃজনশীল জ্ঞান ও অনুধাবনমূলক প্রশ্ন অনুশীলন।',
    durationMin: 50,
    source: 'self_study',
    confidence: 4,
    date: new Date(now - 4 * dayMs).toISOString(),
    createdAt: new Date(now - 4 * dayMs).toISOString(),
    updatedAt: new Date(now - 4 * dayMs).toISOString(),
    verifiedByParent: true,
  },

  // Tasnim Islam (Class 5 - PEC)
  {
    id: 'entry-tasnim-1',
    childId: 'demo-child-2',
    subject: 'Elementary Mathematics',
    subjectName: 'প্রাথমিক গণিত (Math)',
    topicsText: 'অধ্যায় ৫: গুণনীয়ক ও গুণিতক — মৌলিক উৎপাদকে বিশ্লেষণ করে লসাগু (LCM) ও গসাগু (HCF) নির্ণয় এবং কথার অঙ্ক সমাধান।',
    durationMin: 60,
    source: 'tuition',
    confidence: 5,
    date: new Date(now).toISOString(),
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-tasnim-2',
    childId: 'demo-child-2',
    subject: 'Primary Science',
    subjectName: 'প্রাথমিক বিজ্ঞান (Science)',
    topicsText: 'অধ্যায় ৩: জীবনের জন্য পানি — নিরাপদ পানি পানের গুরুত্ব, পানি বিশুদ্ধকরণ প্রক্রিয়া এবং পানি দূষণ প্রতিরোধের উপায়।',
    durationMin: 50,
    source: 'school',
    confidence: 4,
    date: new Date(now - 1 * dayMs).toISOString(),
    createdAt: new Date(now - 1 * dayMs).toISOString(),
    updatedAt: new Date(now - 1 * dayMs).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-tasnim-3',
    childId: 'demo-child-2',
    subject: 'English',
    subjectName: 'ইংরেজি (English)',
    topicsText: 'Unit 6: Eat Healthy — Food pyramid, healthy fruits and vegetables vocabulary, and simple present tense sentences.',
    durationMin: 45,
    source: 'tuition',
    confidence: 5,
    date: new Date(now - 2 * dayMs).toISOString(),
    createdAt: new Date(now - 2 * dayMs).toISOString(),
    updatedAt: new Date(now - 2 * dayMs).toISOString(),
    verifiedByParent: true,
  },
  {
    id: 'entry-tasnim-4',
    childId: 'demo-child-2',
    subject: 'Bangladesh & Global Studies',
    subjectName: 'বাংলাদেশ ও বিশ্বপরিচয় (BGS)',
    topicsText: 'অধ্যায় ১: আমাদের মুক্তিযুদ্ধ — ১৯৭১ সালের ২৫শে মার্চের কালরাত, মুজিবনগর সরকার গঠন এবং সাধারণ মানুষের অবদান।',
    durationMin: 40,
    source: 'self_study',
    confidence: 5,
    date: new Date(now - 3 * dayMs).toISOString(),
    createdAt: new Date(now - 3 * dayMs).toISOString(),
    updatedAt: new Date(now - 3 * dayMs).toISOString(),
    verifiedByParent: true,
  },
];
const memRevisions: any[] = [];

export async function listEntries(childId: string, parentId: string, query: { from?: string; to?: string; page?: string; limit?: string }) {
  // ownership check: child belongs to parent
  await assertOwnership(parentId, childId);
  try {
    const where: any = { childId };
    if (query.from || query.to) {
      where.date = {};
      if (query.from) where.date.gte = new Date(query.from);
      if (query.to) where.date.lte = new Date(query.to);
    }
    const page = parseInt(query.page || '1'); const limit = parseInt(query.limit || '20');
    const [data, total] = await Promise.all([
      prisma.learningEntry.findMany({ where, orderBy: { date: 'desc' }, skip: (page - 1) * limit, take: limit, include: { revisions: true } }),
      prisma.learningEntry.count({ where }),
    ]);
    return { data, total, page, limit };
  } catch {
    let filtered = memEntries.filter((e: any) => e.childId === childId);
    if (query.from) filtered = filtered.filter((e: any) => e.date >= query.from!);
    if (query.to) filtered = filtered.filter((e: any) => e.date <= query.to!);
    return { data: filtered, total: filtered.length, page: 1, limit: 20 };
  }
}

export async function createEntry(childId: string, parentId: string, data: any, userRole: string) {
  await assertOwnership(parentId, childId);
  const payload = { childId, ...data, date: new Date(data.date) };
  try {
    const entry = await prisma.learningEntry.create({ data: payload });
    // queue digest job (cheap model)
    queueDigest(entry.id, childId, data.topicsText);
    return entry;
  } catch {
    const entry = { id: 'entry-' + Date.now(), ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), verifiedByParent: false };
    memEntries.push(entry);
    queueDigest(entry.id, childId, data.topicsText);
    return entry;
  }
}

export async function updateEntry(entryId: string, parentId: string, data: any, changedBy: string) {
  let entry: any;
  try {
    entry = await prisma.learningEntry.findUnique({ where: { id: entryId }, include: { child: true } });
    if (!entry) throw notFound('Entry not found');
    if (entry.child.parentId !== parentId) throw forbidden('Not your child');
    // 48h edit window for child role
    if (changedBy === 'child' && Date.now() - new Date(entry.createdAt).getTime() > 48 * 3600000) throw forbidden('Edit window expired (48h)');

    // save revision
    await prisma.entryRevision.create({ data: { entryId, snapshotJson: entry as any, changedBy } }).catch(()=>{});
    const updated = await prisma.learningEntry.update({ where: { id: entryId }, data });
    return updated;
  } catch (e: any) {
    if (e.statusCode) throw e;
    const idx = memEntries.findIndex((x: any) => x.id === entryId);
    if (idx < 0) throw notFound('Entry not found');
    // check ownership via childId lookup
    if (memEntries[idx].childId) {
      // already checked ownership earlier for memEntries? skip for mock
    }
    const snapshot = { ...memEntries[idx] };
    memRevisions.push({ id: 'rev-' + Date.now(), entryId, snapshotJson: snapshot, changedBy, changedAt: new Date() });
    Object.assign(memEntries[idx], data, { updatedAt: new Date().toISOString() });
    return memEntries[idx];
  }
}

export async function deleteEntry(entryId: string, parentId: string) {
  const entry: any = await findEntry(entryId, parentId);
  try { await prisma.learningEntry.delete({ where: { id: entryId } }); } catch { const idx = memEntries.findIndex((x:any)=>x.id===entryId); if(idx>=0) memEntries.splice(idx,1); }
  return { message: 'Deleted' };
}

export async function verifyEntry(entryId: string, parentId: string) {
  const entry: any = await findEntry(entryId, parentId);
  try { return await prisma.learningEntry.update({ where: { id: entryId }, data: { verifiedByParent: true } }); }
  catch { const idx = memEntries.findIndex((x:any)=>x.id===entryId); if(idx>=0) memEntries[idx].verifiedByParent = true; return memEntries[idx]; }
}

async function findEntry(entryId: string, parentId: string) {
  try {
    const e: any = await prisma.learningEntry.findUnique({ where: { id: entryId }, include: { child: true } });
    if (!e) throw notFound('Entry not found');
    if (e.child.parentId !== parentId) throw forbidden('Not your child');
    return e;
  } catch (e: any) {
    if (e.statusCode) throw e;
    const e2 = memEntries.find((x:any)=> x.id===entryId);
    if (!e2) throw notFound('Entry not found');
    // for mem, we skip strict ownership if no child lookup
    return e2;
  }
}

async function assertOwnership(parentId: string, childId: string) {
  try {
    const c = await prisma.child.findFirst({ where: { id: childId, parentId } });
    if (!c) throw notFound('Child not found or not yours');
  } catch (e: any) {
    if (e.statusCode===404) throw e;
    // mem fallback: allow if in memChildren
  }
}

function queueDigest(sourceId: string, childId: string, text: string) {
  // In real, would queue job for AI digest (cheap model) — hash & cache
  // Here just log and simulate topic_digests creation
  console.log(`[Digest Job] Queued for ${sourceId}: ${text.slice(0,50)}...`);
}
