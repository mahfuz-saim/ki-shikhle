import { prisma } from '../../db/client';
import { storage } from '../../services/storage';
import { callAI, estimateCost, generateSubjectNote, AIImage } from '../../services/ai';
import { sha256Hex } from '../../utils/crypto';
import { notFound, forbidden, badRequest } from '../../utils/errors';
import { store, seedDemoRows, registerDemoFixture } from '../../core/store';
import { assertChildAccess, assertEntityAccess, type Actor } from '../../core/tenancy';
import { decodeBase64Image } from '../../middleware/upload';
import { canUseVision, resolvePlanCode } from '../../services/entitlements';

/**
 * The demo note fixtures.
 *
 * These belong to the demo tenant. They are registered into the owner-partitioned store
 * (`core/store`) at import time, with the legacy `demo-child-N` ids re-keyed onto the
 * demo children's real ids.
 */
const demoNoteFixtures: any[] = [
  // Rahim Ahmed (Class 8) Notes
  {
    id: 'note-rahim-1',
    childId: 'demo-child-1',
    subject: 'Physics',
    title: 'গতির সমীকরণ ও নিউটনের ২য় সূত্র (Equations of Motion & Force)',
    date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    fileUrl: '/notes/physics-sample.png',
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
    fileUrl: '/notes/math-sample.png',
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
    fileUrl: '/notes/chem-sample.png',
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
    title: 'গুণনীয়ক ও গুণিতক (Factors & Multiples)',
    date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
    fileUrl: '/notes/math-tasnim.png',
    textClean: 'Class 5 Math: Factors and Multiples. Prime factors of 24 = 2 x 2 x 2 x 3. LCM of 12 and 18 is 36. HCF of 12 and 18 is 6. LCM x HCF = Product of numbers.',
    aiSummary: `### 📌 মৌলিক সংজ্ঞা ও নিয়মাবলী
- **গুণনীয়ক (Factor)**: কোনো সংখ্যা যেসব সংখ্যা দ্বারা নিঃশেষে বিভাজ্য হয়, সেগুলোই ঐ সংখ্যার গুণনীয়ক। যেমন: ১২ এর গুণনীয়ক হলো ১, ২, ৩, ৪, ৬, ১২।
- **গুণিতক (Multiple)**: কোনো সংখ্যাকে পূর্ণসংখ্যা দিয়ে গুণ করলে যে সংখ্যাগুলো পাওয়া যায়। যেমন: ৫ এর গুণিতক ৫, ১০, ১৫, ২০...
- **মৌলিক সংখ্যা (Prime Number)**: ১ এর চেয়ে বড় যেসব সংখ্যার ১ এবং ঐ সংখ্যা ছাড়া অন্য কোনো গুণনীয়ক নেই (যেমন: ২, ৩, ৫, ৭, ১১)।

### 📐 গ.সা.গু ও ল.সা.গু নির্ণয়
1. **গ.সা.গু (HCF/GCD)**: গরিষ্ঠ সাধারণ গুণনীয়ক — সাধারণ গুণনীয়কগুলোর মধ্যে সবচেয়ে বড়টি।
2. **ল.সা.গু (LCM)**: লঘিষ্ঠ সাধারণ গুণিতক — সাধারণ গুণিতকগুলোর মধ্যে সবচেয়ে ছোটটি।
3. **গুরুত্বপূর্ণ সূত্র**: দুইটি সংখ্যার গুণফল = সংখ্যা দুইটির গ.সা.গু × ল.সা.গু

### 💡 সহজে মনে রাখার নিয়ম
- ২ হলো একমাত্র জোড় মৌলিক সংখ্যা।
- কোনো সংখ্যার গুণনীয়কের সংখ্যা নির্দিষ্ট, কিন্তু গুণিতকের সংখ্যা অনির্দিষ্ট (অসীম)।`,
    textHash: 'hash-tasnim-1',
    ocrConfidence: 0.98,
    status: 'active',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'note-tasnim-2',
    childId: 'demo-child-2',
    subject: 'Primary Science',
    title: 'জীবনের জন্য পানি ও বিশুদ্ধকরণ (Water for Life)',
    date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
    fileUrl: '/notes/science-tasnim.png',
    textClean: 'Primary Science Ch 3: Water cycle and water purification. Evaporation, Condensation, Precipitation. Boiling water for 20 minutes kills germs.',
    aiSummary: `### 📌 পানি চক্রের ৪টি প্রধান ধাপ
1. **বাষ্পীভবন (Evaporation)**: সূর্যের তাপে নদী, নালা ও সমুদ্রের পানি বাষ্পে পরিণত হয়ে উপরে ওঠে।
2. **ঘনীভবন (Condensation)**: জলীয় বাষ্প ঠান্ডা হয়ে মেঘের আকার ধারণ করে।
3. **অধঃক্ষেপণ / বৃষ্টি (Precipitation)**: মেঘ থেকে বৃষ্টির ফোঁটা আকারে পানি আবার মাটিতে ফিরে আসে।
4. **সংগ্রহ (Collection)**: বৃষ্টির পানি পুনরায় নদী ও সমুদ্রে গিয়ে মেশে।

### 📐 পানি বিশুদ্ধকরণের নিরাপদ উপায়সমূহ
- **ফোটানো (Boiling)**: নিরাপদ পানির জন্য পানিকে টগবগিয়ে কমপক্ষে ২০ মিনিট ফোটাতে হবে।
- **ছাঁকন (Filtration)**: বালু বা পাতলা কাপড়ের সাহায্যে ভাসমান ময়লা দূর করা।
- **থিতানো (Sedimentation)**: কলসিতে পানি রেখে তলানি নিচে জমার পর পরিষ্কার পানি আলাদা করা।
- **রাসায়নিক উপাদান**: ফিটকিরি বা হ্যালোজেন ট্যাবলেট ব্যবহার।

### 💡 পরীক্ষার প্রস্তুতি চেকলিস্ট
- দূষিত পানি পান করলে ডায়রিয়া, কলেরা, আমাশয় ও টাইফয়েড হতে পারে।
- আর্সেনিকযুক্ত টিউবওয়েলের পানি পান করা নিষেধ (লাল রঙ চিহ্নিত নলকূপ)।`,
    textHash: 'hash-tasnim-2',
    ocrConfidence: 0.94,
    status: 'active',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'note-tasnim-3',
    childId: 'demo-child-2',
    subject: 'English',
    title: 'Eat Healthy - The Food Pyramid (Unit 6)',
    date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
    fileUrl: '/notes/english-tasnim.png',
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

/**
 * Register the demo notes into the owner-partitioned store.
 *
 * The degraded (no-database) path reads from `store.notes`, which is partitioned by
 * owner — so the demo notes are visible to the demo parent and to nobody else.
 */
registerDemoFixture(() => {
  seedDemoRows(store.notes, demoNoteFixtures);
});

export function generateStructuredFallback(rawText: string, subject: string): string {
  if (!rawText || rawText.trim().length < 10) {
    return generateSubjectNote(subject);
  }
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

export type MakeAINoteInput = {
  text?: string;
  subject?: string;
  date?: string;
  title?: string;
  imageBase64?: string;
  imageMimeType?: string;
  file?: any;
};

export async function makeAINote(actor: Actor, childId: string, body: MakeAINoteInput) {
  await assertChildAccess(actor, childId);

  const hasImage = Boolean(body.file?.buffer || body.imageBase64);

  // Entitlement: the AI vision path (reading a note image) is a paid feature on the
  // plans that exclude it.
  //
  // `aiVisionOCR` was declared on every plan but never checked, so the limit was
  // decorative. A text-only note is not affected — it uses the cheap text model.
  if (hasImage) {
    const planCode = await resolvePlanCode(actor.ownerId);
    if (!canUseVision(planCode)) {
      throw forbidden(
        `AI note generation from images is not available on the ${planCode} plan. Upgrade to unlock it.`
      );
    }
  }

  const rawText = body.text || '';
  let subject = body.subject || 'General';

  let aiImage: AIImage | undefined;
  if (body.file?.buffer) {
    // The upload guard has already checked the magic bytes and normalised
    // `file.mimetype`, so this mapping is over a type we have verified.
    const mt = (body.file.mimetype || 'image/jpeg').toLowerCase();
    const mediaType = mt.includes('png')
      ? 'image/png'
      : mt.includes('webp')
      ? 'image/webp'
      : mt.includes('gif')
      ? 'image/gif'
      : 'image/jpeg';
    aiImage = {
      data: body.file.buffer.toString('base64'),
      mediaType,
    };
  } else if (body.imageBase64) {
    // The base64 path is *not* covered by the multipart upload guard, so the bytes
    // are checked here. Previously the media type was taken from a client-supplied
    // string with no validation at all.
    const clean = body.imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
    const decoded = decodeBase64Image(clean);
    if (!decoded) {
      throw badRequest('The uploaded image could not be read. Upload a JPEG, PNG, WebP or GIF.');
    }
    aiImage = { data: clean, mediaType: decoded.mediaType as AIImage['mediaType'] };
  }

  const system = `You are an expert pedagogy teacher and study-note specialist for Bangladeshi school students following the NCTB curriculum.
Your mission is to examine uploaded class notes, handwritten pages, chalkboard photos, diagrams, or text and synthesize a beautifully structured, comprehensive, high-quality study note.

Note Structure (Clean Markdown):
# 📌 [Appropriate Emoji & Clear Topic Title]
### 📌 মূল ধারণা ও সংজ্ঞা (Core Concepts & Definitions)
- Clear, student-friendly explanation of all fundamental terms, laws, and definitions visible in the lesson.

### 📐 সূত্র, সমীকরণ ও প্রয়োগ (Formulas, Equations & Rules)
- Exact mathematical/scientific formulas, SI units, variables explained, and step-by-step example where applicable.

### 💡 সারসংক্ষেপ ও রিভিশন চেকলিস্ট (Key Points & Exam Checklist)
- 3-5 concise bullet points highlighting the most essential points to remember for school and board exams.

### ✍️ স্ব-মূল্যায়ন ও অনুশীলন প্রশ্ন (Self-Test Practice Questions)
- 2-3 practice questions (with brief hints or answers in parentheses) to test understanding.

Tone: Encouraging, clear, academically accurate.
Language: Bilingual (clear Bangla with English scientific/technical terms in brackets, or English if note is primarily English).`;

  const user = `Subject: ${subject}
Date: ${body.date || new Date().toISOString().slice(0, 10)}
${rawText ? `Student Context / Notes:\n${rawText}` : 'Please examine the uploaded note image carefully and synthesize a complete, clear study note.'}`;

  try {
    const aiResult = await callAI({
      system,
      user,
      model: hasImage ? 'smart' : 'fast',
      image: aiImage,
      maxTokens: 2500,
      feature: 'note',
    });
    if (aiResult.content && aiResult.content.length > 50) {
      let title: string | undefined;
      const titleMatch = aiResult.content.match(/^#+\s*(.+)$/m);
      if (titleMatch) {
        title = titleMatch[1].trim().replace(/^[📌🔬📐⚡💡\s]+/, '');
      }
      return {
        aiSummary: aiResult.content,
        title: title || body.title || `${subject} Study Note`,
        subject,
        textClean: rawText || (hasImage ? `[AI Vision Note from image: ${title || subject}]` : ''),
        model: aiResult.model,
        // True when the content came from the deterministic mock rather than a real model.
        // The client shows a "generated" badge either way, but the API response is honest
        // about which one it was.
        mocked: !!aiResult.mocked,
      };
    }
  } catch (err) {
    console.error('AI notemaking call failed, using fallback formatter', err);
  }

  const fallbackFormatted = generateSubjectNote(subject);
  return {
    aiSummary: fallbackFormatted,
    title: body.title || `${subject} Study Note`,
    subject,
    textClean: rawText || `[AI Study Note: ${subject}]`,
    model: 'fast-formatter',
    mocked: true,
  };
}

export async function createNote(actor: Actor, childId: string, file: any, body: any) {
  await assertChildAccess(actor, childId);
  let fileUrl: string | undefined;
  let textClean = body.textClean || body.text || '';
  const ocrConfidence: number | undefined = body.ocrConfidence ? parseFloat(body.ocrConfidence) : 0.95;
  let subject = body.subject || body.subjectId || 'Physics';
  let title = body.title;
  let aiSummary = body.aiSummary || null;

  if (file) {
    const saved = await storage.save(file.buffer, file.originalname, file.mimetype);
    fileUrl = saved.url;
  }

  // If aiSummary is missing and an image or text is provided, generate the AI note!
  if (!aiSummary && (file || body.imageBase64)) {
    try {
      const aiNote = await makeAINote(actor, childId, {
        file,
        imageBase64: body.imageBase64,
        imageMimeType: body.imageMimeType,
        text: textClean,
        subject,
        date: body.date,
      });
      aiSummary = aiNote.aiSummary;
      if (!title && aiNote.title) title = aiNote.title;
      if (aiNote.subject && (!subject || subject === 'General')) subject = aiNote.subject;
      if (!textClean || textClean.startsWith('[OCR from')) {
        textClean = aiNote.textClean || aiSummary.slice(0, 300);
      }
    } catch {
      aiSummary = generateStructuredFallback(textClean || subject, subject);
    }
  } else if (!aiSummary && textClean && textClean.trim().length > 10) {
    try {
      const aiNote = await makeAINote(actor, childId, { text: textClean, subject, date: body.date });
      aiSummary = aiNote.aiSummary;
      if (!title && aiNote.title) title = aiNote.title;
    } catch {
      aiSummary = generateStructuredFallback(textClean, subject);
    }
  }

  if (!title) {
    title = `${subject}: ${(textClean || 'Study Note').slice(0, 35).replace(/[\r\n]+/g, ' ')}...`;
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
      ownerId: actor.ownerId,
      createdAt: new Date().toISOString(),
    };
    store.notes.add(note as any);
    if (textHash) queueDigest('note', note.id, childId, payload.subjectId, textClean);
    return note;
  }
}

export async function listNotes(actor: Actor, childId: string) {
  await assertChildAccess(actor, childId);
  try {
    const dbNotes = await prisma.note.findMany({ where: { childId }, orderBy: { date: 'desc' } });
    if (dbNotes && dbNotes.length > 0) return dbNotes;
    return store.notes.forChild(actor.ownerId, childId);
  } catch {
    return store.notes.forChild(actor.ownerId, childId);
  }
}

export async function updateNote(actor: Actor, noteId: string, data: any) {
  await assertEntityAccess(actor, { kind: 'note', id: noteId });
  const note: any = await findNote(actor, noteId);
  const textHash = data.textClean ? hashText(data.textClean) : note.textHash;
  const payload = { ...data, textHash };
  try {
    return await prisma.note.update({ where: { id: noteId }, data: payload });
  } catch {
    Object.assign(note, payload);
    return note;
  }
}

export async function deleteNote(actor: Actor, noteId: string) {
  await assertEntityAccess(actor, { kind: 'note', id: noteId });
  const note: any = await findNote(actor, noteId);
  const key = typeof note.fileUrl === 'string' ? note.fileUrl.split('/').pop() : null;
  if (key) await storage.delete(key).catch(() => {});
  try {
    await prisma.note.delete({ where: { id: noteId } });
  } catch {
    store.notes.remove(noteId);
  }
  return { message: 'Deleted' };
}

export async function aiOcrFallback(actor: Actor, noteId: string) {
  await assertEntityAccess(actor, { kind: 'note', id: noteId });
  const note: any = await findNote(actor, noteId);
  const prompt = {
    system: 'You are an educational study note helper. Improve and format class notes text.',
    user: `Subject: ${note.subject || 'General'}\nImprove and structure study note for: ${note.textClean?.slice(0, 4000) ?? ''}`,
    model: 'fast' as const,
    maxTokens: 2000,
  };
  const start = Date.now();
  const result = await callAI(prompt);
  const latency = Date.now() - start;
  const cost = estimateCost(result.inputTokens, result.outputTokens, result.model);

  /**
   * A mocked "improvement" is a canned note about a generic subject. It used to be
   * written straight over the note's `textClean` — so with the AI unavailable, the
   * child's actual class notes were **destroyed** and replaced by the mock, and the
   * usage log recorded the call as a success with zero tokens.
   *
   * The note's real text is now left alone when the content is mocked.
   */
  if (result.mocked) {
    throw badRequest('The AI service is unavailable, so the note could not be improved. The original text has been left unchanged.');
  }

  const improved = result.content.slice(0, 5000);
  try {
    await prisma.aiUsageLog.create({
      data: {
        userId: actor.ownerId,
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
  await updateNote(actor, noteId, { textClean: improved, aiSummary: improved, ocrConfidence: 0.98 });
  return {
    improvedText: improved,
    usage: { inputTokens: result.inputTokens, outputTokens: result.outputTokens, costEst: cost, model: result.model },
  };
}

/**
 * Load a note the actor is allowed to touch.
 *
 * The ownership check itself lives in `core/tenancy` — this only resolves the row.
 *
 * The child row is projected, not included wholesale: `Child` carries `passwordHash`
 * and `pinHash`, and `updateNote` returns this object straight to the browser.
 */
async function findNote(actor: Actor, noteId: string) {
  try {
    const n: any = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        child: {
          select: { id: true, name: true, nickname: true, grade: true, curriculum: true, medium: true, avatar: true },
        },
      },
    });
    if (!n) throw notFound('Note not found');
    return n;
  } catch (e: any) {
    if (e.statusCode) throw e;
    const n = store.notes.find(actor.ownerId, noteId);
    if (!n) throw notFound('Note not found');
    return n;
  }
}

function queueDigest(sourceType: string, sourceId: string, childId: string, subjectId: string | null, text: string) {
  console.log(`[Digest] note ${sourceId}: ${text.slice(0, 60)}...`);
}
