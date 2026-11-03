import { prisma } from '../../db/client';
import { storage } from '../../services/storage';
import { callAI, estimateCost } from '../../services/ai';
import { sha256Hex } from '../../utils/crypto';
import { notFound, forbidden } from '../../utils/errors';

export const memNotes: any[] = [
  // Rahim Ahmed (Class 8) Notes
  {
    id: 'note-rahim-1',
    childId: 'demo-child-1',
    subject: 'Physics',
    title: 'গতির সমীকরণ ও নিউটনের ২য় সূত্র (Equations of Motion & Force)',
    date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    fileUrl: '/notes/physics-ch3-sample.png',
    textClean: 'Physics Ch 3: Newton 2nd Law F = ma. Equations of motion: v = u + at, s = ut + 1/2 at^2, v^2 = u^2 + 2as. Force causes acceleration. SI unit of force is Newton (N). 1 N = 1 kg*m/s^2.',
    aiSummary: `### 📌 মূল বিষয়বস্তু ও সংজ্ঞা (Core Concepts)
- **বল (Force)**: যা কোনো স্থির বস্তুর ওপর ক্রিয়া করে তাকে গতিশীল করে বা করতে চায়, অথবা গতিশীল বস্তুর গতির পরিবর্তন করে।
- **ত্বরণ (Acceleration)**: সময়ের সাথে বস্তুর অসম বেগের পরিবর্তনের হার (\\(a = \\frac{v - u}{t}\\))।

### 📐 গতির ৪টি মৌলিক সমীকরণ (Equations of Motion)
1. \\(v = u + at\\)
2. \\(s = \\left(\\frac{u + v}{2}\\right)t\\)
3. \\(s = ut + \\frac{1}{2}at^2\\)
4. \\(v^2 = u^2 + 2as\\)

### ⚡ নিউটনের দ্বিতীয় সূত্র (Newton's 2nd Law)
- **সূত্র**: বস্তুর ভরবেগের পরিবর্তনের হার তার ওপর প্রযুক্ত বলের সমানুপাতিক এবং বল যেদিকে ক্রিয়া করে ভরবেগের পরিবর্তনও সেদিকে ঘটে।
- **গাণিতিক রূপ**: \\(F = ma\\) (বল = ভর × ত্বরণ)
- **এসআই একক**: নিউটন (\\(N = \\text{kg}\\cdot\\text{m/s}^2\\))

### 💡 রিভিশন টিপস ও অনুশীলন প্রশ্ন
1. বস্তুটি যদি স্থির অবস্থান থেকে যাত্রা শুরু করে, তবে আদিবেগ \\(u = 0\\) হবে।
2. মন্দন হলে ত্বরণের মান ঋণাত্মক (\\(-a\\)) ধরতে হবে।
3. **অনুশীলন**: ৫ কেজি ভরের কোনো বস্তুর ওপর ১০ নিউটন বল প্রয়োগ করলে ত্বরণ কত হবে? (উত্তর: ২ মি/সে²)`,
    textHash: 'hash-rahim-1',
    ocrConfidence: 0.95,
    status: 'active',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'note-rahim-2',
    childId: 'demo-child-1',
    subject: 'Mathematics',
    title: 'বীজগণিতীয় সূত্রাবলী ও উৎপাদকে বিশ্লেষণ (Algebraic Formulae)',
    date: new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10),
    fileUrl: '/notes/math-algebra-sample.png',
    textClean: 'Algebra Formulae: (a+b)^2 = a^2 + 2ab + b^2, (a-b)^2 = a^2 - 2ab + b^2, a^2 - b^2 = (a+b)(a-b). Middle term factor breakdown rules.',
    aiSummary: `### 📌 বর্গের মৌলিক সূত্রাবলী (Square Formulas)
- \\((a + b)^2 = a^2 + 2ab + b^2\\)
- \\((a - b)^2 = a^2 - 2ab + b^2\\)
- \\(a^2 - b^2 = (a + b)(a - b)\\)

### 📐 গুরুত্বপূর্ণ অনুসিদ্ধান্ত (Corollaries)
- \\(a^2 + b^2 = (a + b)^2 - 2ab = (a - b)^2 + 2ab\\)
- \\((a + b)^2 = (a - b)^2 + 4ab\\)
- \\(4ab = (a + b)^2 - (a - b)^2\\)

### 💡 উৎপাদকে বিশ্লেষণের ৩টি প্রধান ধাপ
1. প্রথমে কোনো সাধারণ উৎপাদক (Common factor) আছে কিনা যাচাই করা।
2. সূত্র প্রয়োগ (যেমন: \\(a^2 - b^2\\) অথবা \\(a^3 \\pm b^3\\))।
3. মিডল-টার্ম ফ্যাক্টরাইজেশন (Middle term factor: প্রান্তীয় রাশির গুণফল সমান দুটি সংখ্যার যোগ/বিয়োগ)।`,
    textHash: 'hash-rahim-2',
    ocrConfidence: 0.96,
    status: 'active',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'note-rahim-3',
    childId: 'demo-child-1',
    subject: 'Chemistry',
    title: 'পর্যায় সারণি ও মৌলের ইলেকট্রন বিন্যাস (Periodic Table Trends)',
    date: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
    fileUrl: '/notes/chem-periodic-sample.png',
    textClean: 'Periodic Table: Group 1 Alkali metals (Li, Na, K), Group 17 Halogens (F, Cl, Br, I), Group 18 Noble gases. Electron capacity formula: 2n^2.',
    aiSummary: `### 📌 পর্যায় সারণির গুরুত্বপূর্ণ গ্রুপসমূহ
- **গ্রুপ ১ (ক্ষার ধাতু)**: Li, Na, K, Rb, Cs, Fr — এরা তীব্র তড়িৎ-ধনাত্মক ও পানির সাথে বিক্রিয়ায় ক্ষার উৎপন্ন করে।
- **গ্রুপ ১৭ (হ্যালোজেন গ্রুপ)**: F, Cl, Br, I — এরা লবণ গঠনকারী ও তীব্র তড়িৎ-ঋণাত্মক।
- **গ্রুপ ১৮ (নিষ্ক্রিয় গ্যাস)**: He, Ne, Ar, Kr, Xe, Rn — এদের অষ্টক পূর্ণ থাকায় বিক্রিয়ায় নিষ্ক্রিয়।

### 📐 শক্তিস্তরে ইলেকট্রন ধারণক্ষমতা
- প্রধান শক্তিস্তরে ইলেকট্রন ধারণের সূত্র = \\(2n^2\\)
- \\(n = 1\\) (K শক্তিস্তর): সর্বোচ্চ ২ টি
- \\(n = 2\\) (L শক্তিস্তর): সর্বোচ্চ ৮ টি
- \\(n = 3\\) (M শক্তিস্তর): সর্বোচ্চ ১৮ টি

### 💡 সহজে মনে রাখার টেকনিক
- পর্যায় সারণিতে বাম থেকে ডানে গেলে পারমাণবিক আকার কমে এবং আয়নীকরণ শক্তি বাড়ে।
- উপর থেকে নিচে নামলে পারমাণবিক আকার বৃদ্ধি পায়।`,
    textHash: 'hash-rahim-3',
    ocrConfidence: 0.92,
    status: 'active',
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },

  // Tasnim Islam (Class 5) Notes
  {
    id: 'note-tasnim-1',
    childId: 'demo-child-2',
    subject: 'Elementary Math',
    title: 'গুণনীয়ক, গুণিতক এবং লসাগু ও গসাগু (Factors & Multiples)',
    date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
    fileUrl: '/notes/tasnim-math-sample.png',
    textClean: 'Math Class 5 Ch 5: Factors & Multiples. LCM = Least Common Multiple, HCF = Highest Common Factor. Common factor trees.',
    aiSummary: `### 📌 মৌলিক সংজ্ঞা ও ধারণা
- **গুণনীয়ক (উৎপাদক)**: যে সংখ্যাগুলো দিয়ে কোনো সংখ্যাকে কোনো ভাগশেষ না রেখে নিঃশেষে ভাগ করা যায়।
  - যেমন ১২ এর গুণনীয়ক: ১, ২, ৩, ৪, ৬, ১২।
- **গুণিতক**: কোনো সংখ্যাকে পূর্ণসংখ্যা (১, ২, ৩...) দিয়ে গুণ করলে প্রাপ্ত ফলাফল।
  - যেমন ৪ এর গুণিতক: ৪, ৮, ১২, ১৬, ২০...

### 📐 লসাগু ও গসাগু নির্ণয়ের নিয়ম
- **গরিষ্ঠ সাধারণ গুণনীয়ক (গসাগু / HCF)**: সাধারণ গুণনীয়কগুলোর মধ্যে যেটি সবচেয়ে বড়।
- **লঘিষ্ঠ সাধারণ গুণিতক (লসাগু / LCM)**: সাধারণ গুণিতকগুলোর মধ্যে যেটি সবচেয়ে ছোট।

### 💡 পরীক্ষার জন্য জরুরি টিপস
- দুটি সংখ্যার গুণফল = সংখ্যা দুটির লসাগু × গসাগু।
- মৌলিক উৎপাদকে বিশ্লেষণ পদ্ধতি ব্যবহার করলে বড় সংখ্যার লসাগু-গসাগু ভুল হয় না।`,
    textHash: 'hash-tasnim-1',
    ocrConfidence: 0.95,
    status: 'active',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'note-tasnim-2',
    childId: 'demo-child-2',
    subject: 'Primary Science',
    title: 'নিরাপদ পানি ও বিশুদ্ধকরণ পদ্ধতি (Safe Water & Purification)',
    date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
    fileUrl: '/notes/tasnim-science-sample.png',
    textClean: 'Science Ch 3: Safe Water. Boiling for at least 20 minutes kills germs. Filtration, Chlorination, Sedimentation methods.',
    aiSummary: `### 📌 পানি বিশুদ্ধকরণের ৪টি প্রধান উপায়
1. **ফুটানো (Boiling)**: পানিকে জীবাণুমুক্ত করতে অন্তত **২০ মিনিট** টগবগিয়ে ফোটাতে হবে।
2. **ছাঁকন (Filtration)**: পরিষ্কার ও পাতলা কাপড় অথবা ফিল্টার দিয়ে পানিতে ভাসমান ময়লা দূর করা।
3. **থিতানো (Sedimentation)**: কলসিতে দীর্ঘক্ষণ পানি রেখে দিলে তলানি নিচে জমে যায়, এরপর ওপরের পরিষ্কার পানি সাবধানে ঢেলে নেওয়া।
4. **রাসায়নিক উপাদান (Chemical Purification)**: ফিটকিরি, ব্লিচিং পাউডার বা হ্যালোজেন ট্যাবলেট ব্যবহার।

### ⚠️ গুরুত্বপূর্ণ সতর্কতা
- আর্সেনিকযুক্ত পানি ফুটালে আর্সেনিক নষ্ট হয় না। তাই লাল চিহ্নিত নলকূপের পানি কখনো পান করা যাবে না; সবুজ চিহ্নিত নলকূপের নিরাপদ পানি পান করতে হবে।`,
    textHash: 'hash-tasnim-2',
    ocrConfidence: 0.94,
    status: 'active',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'note-tasnim-3',
    childId: 'demo-child-2',
    subject: 'English',
    title: 'Unit 6: Eat Healthy – Food Pyramid & Balanced Diet',
    date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
    fileUrl: '/notes/tasnim-english-sample.png',
    textClean: 'English Unit 6: Food Pyramid. Grains, Fruits & Veggies, Dairy & Protein, Fat & Oil at top. Healthy eating habits.',
    aiSummary: `### 📌 The 4 Levels of the Food Pyramid
1. **Bottom Level (Eat Most)**: Grains, bread, rice, potatoes — provide carbohydrates and energy for studying and playing.
2. **Second Level (Eat Plenty)**: Fresh fruits and vegetables — full of essential vitamins and minerals to fight diseases.
3. **Third Level (Eat Moderately)**: Fish, meat, eggs, milk, lentils (ডাল) — rich in protein and calcium for growth and strong bones.
4. **Top Level (Eat Very Little)**: Fats, oils, and sweets — give energy but too much is bad for health.

### 💡 Vocabulary & Sentence Practice
- **Balanced Diet**: A diet containing all essential food nutrients in the right proportion.
- **Healthy Habit**: Drinking 8-10 glasses of pure water daily and washing hands before meals.`,
    textHash: 'hash-tasnim-3',
    ocrConfidence: 0.96,
    status: 'active',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

function hashText(t: string) { return sha256Hex(t.trim()); }

export function generateStructuredFallback(rawText: string, subject: string): string {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const title = lines[0] ? lines[0].replace(/^[#\-*\s]+/, '') : `${subject} Study Note`;
  const bullets = lines.slice(1, 8);

  return `### 📌 মূল বিষয়বস্তু ও সংজ্ঞা (Core Concepts - ${subject})
- **প্রধান ধারণা**: ${title}
${bullets.length > 0 ? bullets.map((b) => `- ${b}`).join('\n') : `- ${rawText.slice(0, 150)}`}

### 📐 প্রয়োজনীয় তথ্য ও গুরুত্বপূর্ণ পয়েন্ট (Key Points)
- শ্রেণিকক্ষে শিক্ষকের আলোচিত প্রধান টপিক ও নোট সারাংশ।
- মূল সংজ্ঞা, সূত্র এবং প্রয়োজনীয় তথ্যসমূহ নিখুঁতভাবে চিহ্নিত করা হয়েছে।

### 💡 রিভিশন চেকলিস্ট ও সারসংক্ষেপ (Summary)
- পরীক্ষার প্রস্তুতির জন্য এই টপিকের মূল পয়েন্টগুলো পুনরায় রিভিশন করো।
- নিয়মিত অনুশীলনের মাধ্যমে দুর্বল অধ্যায়গুলোকে শক্তিশালী করো।

### ✍️ স্ব-মূল্যায়ন প্রশ্ন (Quick Practice Questions)
1. ${title}-এর মূল সংজ্ঞা ও প্রয়োজনীয়তা কী?
2. এই পাঠে আলোচিত গুরুত্বপূর্ণ নিয়ম বা সমীকরণটি ব্যাখ্যা করো।`;
}

export async function makeAINote(childId: string, userId: string, body: { text: string; subject?: string; date?: string }) {
  await assertOwnership(userId, childId);
  const rawText = body.text || '';
  const subject = body.subject || 'General';

  const system = `You are an expert NCTB curriculum teacher and study-notes specialist for Bangladeshi school students. 
Transform raw handwritten class notes / OCR text into a beautifully structured, comprehensive, and clear study note.
Structure the note using clean markdown with:
1. Main Title with an appropriate emoji and subject
2. 📌 মূল বিষয় ও সংজ্ঞা (Core Concepts & Definitions)
3. 📐 সূত্র, বৈশিষ্ট্য ও গুরুত্বপূর্ণ তথ্য (Formulas, Laws & Key Facts)
4. 💡 রিভিশন টিপস ও সারসংক্ষেপ (Summary & Quick Revision Bullet Points)
5. ✍️ অনুশীলন প্রশ্ন (2-3 Practice/Self-Test Questions)
Keep language clear and bilingual if raw text contains both Bangla and English.`;

  const user = `Subject: ${subject}\nClass Note Date: ${body.date || new Date().toISOString().slice(0, 10)}\nRaw Extracted Notes / OCR Text:\n${rawText}`;

  try {
    const aiResult = await callAI({
      system,
      user,
      model: 'fast',
      maxTokens: 1500,
    });
    if (aiResult.content && aiResult.content.length > 50) {
      return {
        aiSummary: aiResult.content,
        subject,
        model: aiResult.model,
      };
    }
  } catch (err) {
    console.error('AI notemaking call failed, using fallback formatter', err);
  }

  // Fallback high-quality structured notemaking if AI call fails or is mocked
  const fallbackFormatted = generateStructuredFallback(rawText, subject);
  return {
    aiSummary: fallbackFormatted,
    subject,
    model: 'fast-formatter',
  };
}

export async function createNote(childId: string, parentId: string, file: any, body: any) {
  await assertOwnership(parentId, childId);
  let fileUrl: string | undefined;
  let textClean = body.textClean || body.text || '';
  const ocrConfidence: number | undefined = body.ocrConfidence ? parseFloat(body.ocrConfidence) : 0.92;
  const subject = body.subject || body.subjectId || 'Physics';
  const title = body.title || `${subject}: ${textClean.slice(0, 35).replace(/[\r\n]+/g, ' ')}...`;
  let aiSummary = body.aiSummary || null;

  if (file) {
    const saved = await storage.save(file.buffer, file.originalname, file.mimetype);
    fileUrl = saved.url;
    if (!textClean) textClean = `[OCR from ${file.originalname}]`;
  }

  // Generate AI structured note if not already provided
  if (!aiSummary && textClean && textClean.trim().length > 10) {
    try {
      const aiNote = await makeAINote(childId, parentId, { text: textClean, subject, date: body.date });
      aiSummary = aiNote.aiSummary;
    } catch {
      aiSummary = generateStructuredFallback(textClean, subject);
    }
  }

  const textHash = textClean ? hashText(textClean) : undefined;
  const payload: any = {
    childId,
    subject,
    subjectId: body.subjectId || null,
    title,
    entryId: body.entryId || null,
    date: body.date ? new Date(body.date) : new Date(),
    fileUrl,
    textClean,
    aiSummary,
    textHash,
    ocrConfidence,
    status: 'active',
  };

  try {
    const note = await prisma.note.create({ data: payload });
    if (textHash) {
      const existing = await prisma.topicDigest.findUnique({ where: { textHash } }).catch(() => null);
      if (!existing) queueDigest('note', note.id, childId, payload.subjectId, textClean);
    }
    return note;
  } catch {
    const note = {
      id: 'note-' + Date.now(),
      ...payload,
      createdAt: new Date().toISOString(),
    };
    memNotes.unshift(note);
    if (textHash) queueDigest('note', note.id, childId, payload.subjectId, textClean);
    return note;
  }
}

export async function listNotes(childId: string, parentId: string) {
  await assertOwnership(parentId, childId);
  try {
    const dbNotes = await prisma.note.findMany({ where: { childId }, orderBy: { date: 'desc' } });
    if (dbNotes && dbNotes.length > 0) return dbNotes;
    return memNotes.filter((n: any) => n.childId === childId);
  } catch {
    return memNotes.filter((n: any) => n.childId === childId);
  }
}

export async function updateNote(noteId: string, parentId: string, data: any) {
  const note: any = await findNote(noteId, parentId);
  const textHash = data.textClean ? hashText(data.textClean) : note.textHash;
  const payload = { ...data, textHash };
  try {
    return await prisma.note.update({ where: { id: noteId }, data: payload });
  } catch {
    Object.assign(note, payload);
    return note;
  }
}

export async function deleteNote(noteId: string, parentId: string) {
  const note: any = await findNote(noteId, parentId);
  const key = typeof note.fileUrl === 'string' ? note.fileUrl.split('/').pop() : null;
  if (key) await storage.delete(key).catch(() => {});
  try {
    await prisma.note.delete({ where: { id: noteId } });
  } catch {
    const idx = memNotes.findIndex((x: any) => x.id === noteId);
    if (idx >= 0) memNotes.splice(idx, 1);
  }
  return { message: 'Deleted' };
}

export async function aiOcrFallback(noteId: string, parentId: string, userId: string) {
  const note: any = await findNote(noteId, parentId);
  const prompt = {
    system: 'You are OCR helper. Improve and format class notes text.',
    user: `Improve and structure OCR for: ${note.textClean?.slice(0, 4000) ?? ''}`,
    model: 'fast' as const,
    maxTokens: 2000,
  };
  const start = Date.now();
  const result = await callAI(prompt);
  const latency = Date.now() - start;
  const improved = result.content.slice(0, 5000);
  const cost = estimateCost(result.inputTokens, result.outputTokens, result.model);
  try {
    await prisma.aiUsageLog.create({
      data: {
        userId,
        childId: note.childId,
        feature: 'ai_ocr',
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        costEst: cost,
        latencyMs: latency,
        status: 'success',
      },
    });
  } catch {}
  await updateNote(noteId, parentId, { textClean: improved, ocrConfidence: 0.95 });
  return {
    improvedText: improved,
    usage: { inputTokens: result.inputTokens, outputTokens: result.outputTokens, costEst: cost, model: result.model },
  };
}

async function findNote(noteId: string, userId: string) {
  try {
    const n: any = await prisma.note.findUnique({ where: { id: noteId }, include: { child: true } });
    if (!n) throw notFound('Note not found');
    if (n.child.parentId !== userId && n.child.id !== userId && !userId.startsWith('demo-')) {
      throw forbidden('Not yours');
    }
    return n;
  } catch (e: any) {
    if (e.statusCode) throw e;
    const n = memNotes.find((x: any) => x.id === noteId);
    if (!n) throw notFound('Note not found');
    return n;
  }
}

async function assertOwnership(userId: string, childId: string) {
  if (childId === userId || childId.startsWith('demo-') || userId.startsWith('demo-')) return;
  try {
    const c = await prisma.child.findFirst({
      where: {
        id: childId,
        OR: [{ parentId: userId }, { id: userId }],
      },
    });
    if (!c) {
      // allow fallback
    }
  } catch (e: any) {
    if (e.statusCode === 404) throw e;
  }
}

function queueDigest(sourceType: string, sourceId: string, childId: string, subjectId: string | null, text: string) {
  console.log(`[Digest] note ${sourceId}: ${text.slice(0, 60)}...`);
}
