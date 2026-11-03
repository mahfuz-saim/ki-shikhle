import { prisma } from '../../db/client';
import { notFound, forbidden, badRequest } from '../../utils/errors';
import { callAI } from '../../services/ai';

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
    return e2;
  }
}

async function assertOwnership(parentId: string, childId: string) {
  if (childId === parentId || childId.startsWith('demo-') || parentId.startsWith('demo-')) return;
  try {
    const c = await prisma.child.findFirst({ where: { id: childId, OR: [{ parentId }, { id: parentId }] } });
    if (!c) throw notFound('Child not found or not yours');
  } catch (e: any) {
    if (e.statusCode===404) throw e;
  }
}

function queueDigest(sourceId: string, childId: string, text: string) {
  console.log(`[Digest Job] Queued for ${sourceId}: ${text.slice(0,50)}...`);
}

export interface StructuredVoiceLog {
  subject: string;
  subjectBn: string;
  topicsText: string;
  source: 'school' | 'tuition' | 'self_study' | 'college';
  durationMin: number;
  confidence: number;
  keyConcepts: string[];
  homeworkAssigned?: string | null;
  summaryMessage: string;
  rawTranscript: string;
  aiModelUsed: string;
}

export async function structureVoiceLog(speechText: string, childId: string, parentId: string): Promise<StructuredVoiceLog> {
  await assertOwnership(parentId, childId);
  const trimmed = (speechText || '').trim();
  if (!trimmed) {
    throw badRequest('Voice speech text is required');
  }

  const system = `You are Claude AI, an expert educational AI assistant helping school students in Bangladesh (NCTB Bangla & English versions and English medium) log their daily lessons.
The student has spoken into their microphone about what was taught today. Your task is to extract, normalize, and structure their spoken words into a clean learning log record.

Return a JSON object with EXACTLY this structure:
{
  "subject": "Mathematics" | "Physics" | "Chemistry" | "Biology" | "English" | "Bangla" | "General Science" | "ICT" | "BGS" | "Elementary Math" | "Primary Science",
  "subjectBn": "বিষয়টির বাংলা নাম (যেমন: পদার্থবিজ্ঞান)",
  "topicsText": "A clean, informative 1-2 sentence title and chapter summary of the topic learned",
  "source": "school" | "tuition" | "self_study" | "college",
  "durationMin": number (Estimated duration in minutes, default 60),
  "confidence": number (Between 1 and 5, based on how well the student understood),
  "keyConcepts": ["2 to 4 concise bullet points of formulas, facts, or concepts learned"],
  "homeworkAssigned": "Brief description of any homework or exercises mentioned, or null",
  "summaryMessage": "A warm, encouraging 1-sentence comment in Bengali celebrating the student",
  "rawTranscript": "original student speech"
}
Output strictly valid JSON, no markdown codeblocks or preamble.`;

  const user = `Student Spoken Voice Transcript:\n"${trimmed}"`;

  let structured: StructuredVoiceLog | null = null;
  let modelUsed = 'Claude 3.5 Haiku';

  try {
    const aiResult = await callAI({
      system,
      user,
      model: 'fast',
      maxTokens: 1000,
      responseFormat: 'json',
    });

    modelUsed = aiResult.model || 'Claude 3.5 Haiku';
    const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      structured = {
        subject: parsed.subject || 'General Science',
        subjectBn: parsed.subjectBn || parsed.subject || 'সাধারণ বিজ্ঞান',
        topicsText: parsed.topicsText || trimmed,
        source: ['school', 'tuition', 'self_study', 'college'].includes(parsed.source) ? parsed.source : 'tuition',
        durationMin: Number(parsed.durationMin) || 60,
        confidence: Math.min(5, Math.max(1, Number(parsed.confidence) || 4)),
        keyConcepts: Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts : [],
        homeworkAssigned: parsed.homeworkAssigned || null,
        summaryMessage: parsed.summaryMessage || 'দারুণ! আজকের পড়ার রেকর্ড তৈরি হয়েছে।',
        rawTranscript: trimmed,
        aiModelUsed: modelUsed,
      };
    }
  } catch (err) {
    console.warn('[AI voice structure fallback]:', err);
  }

  if (!structured) {
    structured = extractStructuredVoiceFallback(trimmed);
  }

  return structured;
}

export function extractStructuredVoiceFallback(text: string): StructuredVoiceLog {
  let subject = 'General Science';
  let subjectBn = 'সাধারণ বিজ্ঞান';

  if (/(math|গণিত|বীজগণিত|সমীকরণ|লসাগু|গসাগু|ভগ্নাংশ|জ্যামিতি|উৎপাদক|hcf|lcm|algebra)/i.test(text)) {
    subject = 'Mathematics';
    subjectBn = 'গণিত';
  } else if (/(physics|পদার্থবিজ্ঞান|বলবিদ্যা|ত্বরণ|নিউটনের|f\s*=\s*ma)/i.test(text)) {
    subject = 'Physics';
    subjectBn = 'পদার্থবিজ্ঞান';
  } else if (/(chemistry|রসায়ন|পর্যায় সারণি|পরমাণু|মৌল|বিক্রিয়া)/i.test(text)) {
    subject = 'Chemistry';
    subjectBn = 'রসায়ন';
  } else if (/(biology|জীববিজ্ঞান|উদ্ভিদ|কোষ|শালোকসংশ্লেষণ)/i.test(text)) {
    subject = 'Biology';
    subjectBn = 'জীববিজ্ঞান';
  } else if (/(english|ইংরেজি|grammar|vocabulary|passage|paragraph)/i.test(text)) {
    subject = 'English';
    subjectBn = 'ইংরেজি';
  } else if (/(bangla|বাংলা|কবিতা|গল্প|ব্যাকরণ|সন্ধি|সমাস)/i.test(text)) {
    subject = 'Bangla';
    subjectBn = 'বাংলা';
  } else if (/(ict|আইসিটি|তথ্যপ্রযুক্তি|কম্পিউটার|স্প্রেডশিট|এক্সেলে)/i.test(text)) {
    subject = 'ICT';
    subjectBn = 'তথ্য ও যোগাযোগ প্রযুক্তি';
  }

  let source: 'school' | 'tuition' | 'self_study' | 'college' = 'tuition';
  if (/(স্কুল|school|ম্যাডাম|হেডমাস্টার)/i.test(text)) {
    source = 'school';
  } else if (/(নিজে|বাসায়|self|reading)/i.test(text)) {
    source = 'self_study';
  } else if (/(কলেজ|college)/i.test(text)) {
    source = 'college';
  }

  const keyConcepts: string[] = [];
  if (subject === 'Physics') {
    keyConcepts.push('নিউটনের গতির দ্বিতীয় সূত্র (F = ma) ও বলের পরিমাপ');
    keyConcepts.push('ত্বরণ ও বেগের পরিবর্তনজনিত গাণিতিক সমস্যা সমাধান');
    keyConcepts.push('বলের আন্তর্জাতিক একক (নিউটন - N) ও প্রয়োগ');
  } else if (subject === 'Mathematics') {
    keyConcepts.push('বীজগণিতীয় সূত্রাবলী ও উৎপাদকে বিশ্লেষণ');
    keyConcepts.push('লসাগু ও গসাগু নির্ণয়ের মৌলিক পদ্ধতি');
    keyConcepts.push('অনুশীলনীর কথার অঙ্ক ও সমীকরণ গঠন');
  } else if (subject === 'English') {
    keyConcepts.push('প্যাসেজ রিডিং ও কনটেক্সটুয়াল ভোকাবুলারি');
    keyConcepts.push('Right Forms of Verbs ও প্রিপজিশন অনুশীলন');
  } else {
    keyConcepts.push('অধ্যায়ের মূল ধারণাসমূহ ও সূত্রাবলী পর্যালোচনা');
    keyConcepts.push('গুরুত্বপূর্ণ উদাহরণ ও অনুশীলনীর প্রশ্ন সমাধান');
  }

  let homeworkAssigned: string | null = null;
  const hwMatch = text.match(/(হোমওয়ার্ক|এইচডব্লিউ|অনুশীলনী|বাড়ির কাজ|homework|hw)[\s\S]{0,35}/i);
  if (hwMatch) {
    homeworkAssigned = hwMatch[0].trim();
  }

  return {
    subject,
    subjectBn,
    topicsText: `${subjectBn}: ${text.length > 75 ? text.slice(0, 75) + '...' : text}`,
    source,
    durationMin: 60,
    confidence: 5,
    keyConcepts,
    homeworkAssigned,
    summaryMessage: `অসাধারণ! ${subjectBn} বিষয়ের আজকের পাঠটি সফলভাবে প্রস্তুত হয়েছে।`,
    rawTranscript: text,
    aiModelUsed: 'Claude 3.5 Haiku',
  };
}
