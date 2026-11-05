import { env } from '../config/env';
import { logger } from '../utils/logger';

export type AIModel = 'fast' | 'smart';
export type AIImage = {
  data: string; // base64 string
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
};

/**
 * The kind of output the caller wants back.
 *
 * This used to be inferred by string-sniffing the prompt for the word "note", which meant
 * a quiz prompt that happened to mention a note was answered with **Markdown** instead of
 * JSON — the quiz generator silently degraded to a static question bank. The feature is
 * now declared explicitly by the caller; the sniffing remains only as a fallback for
 * callers that have not been migrated yet.
 */
export type AIFeature = 'quiz' | 'note' | 'voice' | 'digest' | 'explanation' | 'unknown';

export type CallAIOptions = {
  system: string;
  user: string;
  model: AIModel;
  maxTokens?: number;
  responseFormat?: 'json';
  image?: AIImage;
  /** What this call is for. Determines the shape of the mock response. */
  feature?: AIFeature;
};

type AIResult = {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  cached?: boolean;
  /**
   * True when the content came from the deterministic mock rather than a real model.
   *
   * Callers must not record a mocked response as a successful AI call — that is how a
   * production outage ends up persisting fake quizzes and logging them as `success`.
   */
  mocked?: boolean;
};

export function generateSubjectNote(subject: string = 'General'): string {
  const s = subject.toLowerCase();
  if (s.includes('phys')) {
    return `### 📌 মূল বিষয়বস্তু ও সংজ্ঞা (Core Concepts - Physics)
- **বল (Force)**: যা কোনো স্থির বস্তুর ওপর ক্রিয়া করে তাকে গতিশীল করে বা করতে চায়, অথবা গতিশীল বস্তুর গতির পরিবর্তন ঘটায়। এসআই একক নিউটন (\\(N = \\text{kg}\\cdot\\text{m/s}^2\\))।
- **ত্বরণ (Acceleration)**: সময়ের সাথে বস্তুর অসম বেগের পরিবর্তনের হার (\\(a = \\frac{v - u}{t}\\))।
- **ভরবেগ (Momentum)**: বস্তুর ভর ও বেগের গুণফল (\\(p = mv\\))। ভরবেগের সংরক্ষণশীলতার নীতি অনুযায়ী বাহ্যিক বল প্রযুক্ত না হলে মোট ভরবেগ স্থির থাকে।

### 📐 গতির সমীকরণ ও নিউটনের সূত্রাবলী (Key Formulas & Laws)
1. \\(v = u + at\\)
2. \\(s = ut + \\frac{1}{2}at^2\\)
3. \\(v^2 = u^2 + 2as\\)
4. \\(s = \\left(\\frac{u + v}{2}\\right)t\\)
5. **নিউটনের ২য় সূত্র**: \\(F = ma\\) (বল = ভর × ত্বরণ)

### 💡 পরীক্ষার জন্য গুরুত্বপূর্ণ সারসংক্ষেপ (Exam Revision Points)
- বস্তু যদি স্থির অবস্থান থেকে যাত্রা শুরু করে, তবে আদিবেগ \\(u = 0\\)।
- মন্দন (Deceleration) হলে ত্বরণের মান ঋণাত্মক (\\(-a\\)) ধরতে হবে।
- অভিকর্ষজ ত্বরণের মান ভূপৃষ্ঠে আদর্শ মান \\(g = 9.8 \\text{ m/s}^2\\)।

### ✍️ স্ব-মূল্যায়ন ও অনুশীলন প্রশ্ন (Practice Questions)
1. ৫ কেজি ভরের কোনো স্থির বস্তুর ওপর ২০ নিউটন বল ৪ সেকেন্ড ধরে প্রয়োগ করলে শেষ বেগ কত হবে? (উত্তর: ১৬ মি/সে)
2. নিউটনের দ্বিতীয় সূত্র থেকে কীভাবে বলের পরিমাপ ও একক পাওয়া যায় ব্যাখ্যা করো।`;
  }

  if (s.includes('math') || s.includes('গণিত') || s.includes('algeb')) {
    return `### 📌 মূল বিষয়বস্তু ও বীজগণিতীয় সূত্রাবলী (Core Concepts - Mathematics)
- **বর্গ ও উৎপাদকে বিশ্লেষণ**: একটি বীজগাণিতিক রাশিকে দুই বা ততোধিক রাশির গুণফল আকারে প্রকাশ করাই হলো উৎপাদকে বিশ্লেষণ।
- **দ্বিঘাত সমীকরণ**: \\(ax^2 + bx + c = 0\\) আকারের এক চলকবিশিষ্ট সমীকরণ।

### 📐 প্রয়োজনীয় সূত্র ও অনুসিদ্ধান্ত (Key Formulas & Identities)
1. \\((a + b)^2 = a^2 + 2ab + b^2\\)
2. \\((a - b)^2 = a^2 - 2ab + b^2\\)
3. \\(a^2 - b^2 = (a + b)(a - b)\\)
4. \\((a + b)^2 = (a - b)^2 + 4ab\\)
5. **দ্বিঘাত সমীকরণের মূল**: \\(x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\\)

### 💡 সহজে মনে রাখার টেকনিক ও টিপস (Quick Revision)
- উৎপাদকে বিশ্লেষণের প্রথম ধাপ: প্রথমে কোনো সাধারণ উৎপাদক (Common Factor) আছে কি না যাচাই করা।
- দ্বিতীয় ধাপ: সূত্রের প্রয়োগ (\\(a^2 - b^2\\) বা ঘন সূত্র)।
- তৃতীয় ধাপ: মিডল টার্ম ফ্যাক্টরাইজেশন (Middle term factorization)।

### ✍️ স্ব-মূল্যায়ন ও অনুশীলন প্রশ্ন (Practice Questions)
1. \\(x^2 - 5x + 6\\) রাশিটির উৎপাদকে বিশ্লেষিত রূপ কী? (উত্তর: \\((x - 2)(x - 3)\\))
2. \\(a + b = 5\\) এবং \\(ab = 6\\) হলে, \\(a^2 + b^2\\) এর মান নির্ণয় করো। (উত্তর: ১৩)`;
  }

  if (s.includes('chem') || s.includes('রসায়ন')) {
    return `### 📌 মূল বিষয়বস্তু ও সংজ্ঞা (Core Concepts - Chemistry)
- **পর্যায় সারণি (Periodic Table)**: মৌলসমূহের পারমাণবিক সংখ্যা অনুযায়ী পর্যায় ও গ্রুপে সাজানো সারণি।
- **যোজনী (Valency)**: একটি মৌলের পরমাণুর সাথে অন্য মৌলের পরমাণুর যুক্ত হওয়ার ক্ষমতা।
- **আয়নিক ও সমযোজী বন্ধন**: ইলেকট্রন স্থানান্তরের মাধ্যমে ক্যাটায়ন-অ্যানায়ন আকর্ষণে আয়নিক বন্ধন এবং ইলেকট্রন শেয়ারের মাধ্যমে সমযোজী বন্ধন গঠিত হয়।

### 📐 ইলেকট্রন বিন্যাস ও সূত্রাবলী (Key Principles & Rules)
1. প্রধান শক্তিস্তরে ইলেকট্রন ধারণক্ষমতার সূত্র: \\(2n^2\\) (\\(n = 1, 2, 3\\dots\\))
2. আউফবাউ নীতি: ইলেকট্রন প্রথমে সর্বনিম্ন শক্তিস্তরে এবং পরে ক্রমান্বয়ে উচ্চ শক্তিস্তরে প্রবেশ করে।
3. অষ্টক নিয়ম (Octet Rule): মৌলসমূহ রাসায়নিক স্থিতিশীলতার জন্য সর্ববহিঃস্থ স্তরে ৮টি ইলেকট্রন অর্জন করতে চায়।

### 💡 পরীক্ষার সারসংক্ষেপ (Key Takeaways)
- গ্রুপ ১ এর মৌলদের ক্ষার ধাতু এবং গ্রুপ ১৭ এর মৌলদের হ্যালোজেন বলা হয়।
- একই পর্যায়ে বাম থেকে ডানে পারমাণবিক ব্যাসার্ধ কমে এবং আয়নীকরণ শক্তি বৃদ্ধি পায়।

### ✍️ স্ব-মূল্যায়ন ও অনুশীলন প্রশ্ন (Practice Questions)
1. সোডিয়াম (Na, Z = 11) এবং ক্লোরিন (Cl, Z = 17) এর মধ্যে কীভাবে আয়নিক বন্ধন সৃষ্টি হয় ব্যাখ্যা করো।
2. পর্যায় সারণির একই গ্রুপে উপর থেকে নিচে নামলে পারমাণবিক আকারের কী রূপ পরিবর্তন হয়?`;
  }

  if (s.includes('bio') || s.includes('sci') || s.includes('বিজ্ঞান')) {
    return `### 📌 মূল বিষয়বস্তু ও সংজ্ঞা (Core Concepts - Science)
- **সালোকসংশ্লেষণ (Photosynthesis)**: সবুজ উদ্ভিদ সূর্যালোক ও ক্লোরোফিলের সহায়তায় কার্বন ডাই-অক্সাইড এবং পানির বিক্রিয়ায় শর্করা ও অক্সিজেন উৎপন্ন করে।
- **কোষ (Cell)**: জীবদেহের গঠন ও কাজের মৌলিক একক।
- **নিরাপদ পানি ও বিশুদ্ধকরণ**: ফোটানো, ফিল্টারিং বা ক্লোরিনেশনের মাধ্যমে জীবাণুমুক্ত খাবার পানি প্রস্তুত করা।

### 📐 জৈবিক সমীকরণ ও প্রক্রিয়া (Key Biological Process)
- **সালোকসংশ্লেষণের সামগ্রিক রাসায়নিক সমীকরণ**:
  \\[6CO_2 + 12H_2O \\xrightarrow[\\text{ক্লোরোফিল}]{\\text{সূর্যালোক}} C_6H_{12}O_6 + 6O_2 + 6H_2O\\]
- আলোক পর্যায়ে এটিপি (ATP) ও এনএডিপিএইচ (\\(\\text{NADPH}_2\\)) তৈরি হয় যা অন্ধকার পর্যায়ে শর্করা তৈরিতে কাজে লাগে।

### 💡 রিভিশন চেকলিস্ট (Quick Revision Points)
- লাল আলোতে সালোকসংশ্লেষণের হার সর্বোচ্চ হয়।
- পানি বিশুদ্ধকরণের সবচেয়ে নিরাপদ প্রাকৃতিক পদ্ধতি হলো কমপক্ষে ২০ মিনিট ধরে টগবগিয়ে ফোটানো।

### ✍️ স্ব-মূল্যায়ন ও অনুশীলন প্রশ্ন (Practice Questions)
1. উদ্ভিদ ও প্রাণিজগতের অস্তিত্বের জন্য সালোকসংশ্লেষণ প্রক্রিয়ার গুরুত্ব ব্যাখ্যা করো।
2. পানিবাহিত প্রধান ৩টি রোগের নাম লেখো এবং তা প্রতিরোধের উপায় কী?`;
  }

  if (s.includes('eng') || s.includes('ইংরেজি')) {
    return `### 📌 Core Concepts & Grammar Rules (English)
- **Tense & Sentence Structure**: The backbone of English communication. Understanding Present, Past, and Future forms.
- **Subject-Verb Agreement**: A singular subject requires a singular verb, while a plural subject requires a plural verb.
- **Active & Passive Voice**: Active voice highlights the doer; Passive voice highlights the action/receiver.

### 📐 Key Structures & Patterns
1. **Present Perfect**: \\(\\text{Subject} + \\text{have/has} + \\text{V3 (Past Participle)} + \\text{Object}\\)
2. **Passive Transformation**: \\(\\text{Object} + \\text{auxiliary verb} + \\text{V3} + \\text{by} + \\text{Subject}\\)
3. **First Conditional**: If + Present Simple, Future Simple (will + base verb).

### 💡 Common Mistakes & Tips
- Remember: Words like *everybody, someone, neither* take singular verbs (e.g., "Everybody has done their work").
- Always use the past participle (V3) after have, has, and had.

### ✍️ Self-Test Practice Questions
1. Change into passive: "The teacher explained the difficult physics formula." (Answer: The difficult physics formula was explained by the teacher.)
2. Fill in the blank: "Neither of the two solutions _____ (is / are) correct." (Answer: is)`;
  }

  return `### 📌 মূল বিষয়বস্তু ও প্রধান ধারণা (Core Concepts - ${subject})
- **পাঠের সারসংক্ষেপ**: ক্লাসে শিক্ষকের আলোচিত বিষয়বস্তু, প্রধান ধারণা ও মৌলিক সংজ্ঞা।
- **গুরুত্বপূর্ণ পরিভাষা**: পরীক্ষার জন্য প্রয়োজনীয় মৌলিক বৈজ্ঞানিক ও তাত্ত্বিক পরিভাষা।

### 📐 প্রয়োজনীয় তথ্য ও নিয়মাবলী (Key Facts & Principles)
- মূল বৈশিষ্ট্য, শ্রেণিবিন্যাস এবং ব্যবহারিক প্রয়োগ।
- পরীক্ষার জন্য প্রয়োজনীয় চিত্র, ছক ও তথ্য সারণি।

### 💡 সারসংক্ষেপ ও রিভিশন চেকলিস্ট (Revision Checklist)
- প্রতিটি গুরুত্বপূর্ণ পয়েন্ট খাতায় লিখে রিভিশন করো।
- বিগত প্রশ্নপত্রের সাথে মিলিয়ে দুর্বল অংশগুলো চিহ্নিত করো।

### ✍️ স্ব-মূল্যায়ন ও অনুশীলন প্রশ্ন (Self-Test Questions)
1. এই অধ্যায়ে আলোচিত প্রধান তত্ত্ব বা ধারণার সংজ্ঞা দাও।
2. বাস্তব জীবনে এর প্রয়োগ উদাহরণসহ ব্যাখ্যা করো।`;
}

export function generateSubjectQuiz(userPrompt: string): string {
  const p = userPrompt.toLowerCase();
  if (p.includes('water') || p.includes('পানি') || p.includes('class 5') || p.includes('pec') || p.includes('primary') || p.includes('tasnim')) {
    return JSON.stringify({
      questions: [
        { type: "mcq", prompt: "১২ এবং ১৮ এর গসাগু (HCF) কত?", options: ["৬", "৩৬", "৩", "২"], correct_answer: "৬", explanation: "১২ ও ১৮ এর গরিষ্ঠ সাধারণ গুণনীয়ক হলো ৬।", topic: "Mathematics" },
        { type: "mcq", prompt: "পানিকে সম্পূর্ণ জীবাণুমুক্ত করতে অন্তত কত মিনিট টগবগিয়ে ফোটাতে হবে?", options: ["২০ মিনিট", "৫ মিনিট", "১০ মিনিট", "২ মিনিট"], correct_answer: "২০ মিনিট", explanation: "২০ মিনিট ফোটালে সব ক্ষতিকর জীবাণু ধ্বংস হয়।", topic: "Science" },
        { type: "mcq", prompt: "৪ এবং ৬ এর লসাগু (LCM) কত?", options: ["১২", "২৪", "২", "৮"], correct_answer: "১২", explanation: "৪ ও ৬ উভয়ের ক্ষুদ্রতম সাধারণ গুণিতক ১২।", topic: "Mathematics" },
        { type: "true_false", prompt: "আর্সেনিকযুক্ত পানি ফুটালে আর্সেনিক মুক্ত হয় না।", options: ["True", "False"], correct_answer: "True", explanation: "পানি ফুটালে আর্সেনিক দূর হয় না।", topic: "Science" },
        { type: "mcq", prompt: "নিচের কোন সংখ্যাটি মৌলিক সংখ্যা?", options: ["৭", "৯", "১৫", "২১"], correct_answer: "৭", explanation: "৭ শুধুমাত্র ১ ও ৭ ছাড়া অন্য সংখ্যা দ্বারা বিভাজ্য নয়।", topic: "Mathematics" }
      ]
    });
  }
  if (p.includes('projectile') || p.includes('প্রক্ষেপক') || p.includes('class 11') || p.includes('hsc') || p.includes('ম্যাট্রিক্স') || p.includes('fahim')) {
    return JSON.stringify({
      questions: [
        { type: "mcq", prompt: "একটি বস্তুকে অনুভূমিকের সাথে কত কোণে নিক্ষেপ করলে সর্বাধিক অনুভূমিক পাল্লা পাওয়া যায়?", options: ["45°", "30°", "60°", "90°"], correct_answer: "45°", explanation: "sin 2θ এর সর্বোচ্চ মান 1 হয় যখন θ = 45°।", topic: "Physics" },
        { type: "mcq", prompt: "প্রক্ষেপকের গতিপথ (Trajectory) এর জ্যামিতিক রূপ কোনটি?", options: ["প্যারাবোলা বা পরাবৃত্ত", "উপবৃত্ত", "সরলরেখা", "বৃত্তাকার"], correct_answer: "প্যারাবোলা বা পরাবৃত্ত", explanation: "প্রক্ষেপকের গতিপথ একটি পরাবৃত্ত।", topic: "Physics" },
        { type: "mcq", prompt: "সর্বোচ্চ বিন্দুতে প্রক্ষেপকের উলম্ব বেগ কত?", options: ["0 m/s", "v0 sin θ", "v0 cos θ", "g"], correct_answer: "0 m/s", explanation: "সর্বোচ্চ বিন্দুতে উলম্ব বেগ শূন্য হয়ে যায়।", topic: "Physics" },
        { type: "mcq", prompt: "ম্যাট্রিক্স A (3×2) এবং B (2×4) হলে তাদের গুণফল AB এর ক্রম কত?", options: ["3 × 4", "2 × 2", "3 × 2", "2 × 4"], correct_answer: "3 × 4", explanation: "গুণফল ম্যাট্রিক্সের ক্রম 3 × 4।", topic: "Higher Math" },
        { type: "true_false", prompt: "বায়ুর বাধা উপেক্ষা করলে প্রক্ষেপকের অনুভূমিক ত্বরণ সর্বদা শূন্য থাকে।", options: ["True", "False"], correct_answer: "True", explanation: "অনুভূমিক দিকে কোনো বল ক্রিয়া করে না।", topic: "Physics" }
      ]
    });
  }
  return JSON.stringify({
    questions: [
      { type: "mcq", prompt: "(a + b)² এর সঠিক বিস্তৃত সূত্র কোনটি?", options: ["a² + 2ab + b²", "a² - 2ab + b²", "a² + b²", "(a-b)² + 2ab"], correct_answer: "a² + 2ab + b²", explanation: "বর্গের ১ম সূত্র: (a+b)² = a² + 2ab + b²।", topic: "Mathematics" },
      { type: "mcq", prompt: "একটি বস্তুর ত্বরণ a = 2 m/s² এবং আদিবেগ u = 5 m/s হলে, 4 সেকেন্ড পর বেগ কত?", options: ["13 m/s", "10 m/s", "15 m/s", "8 m/s"], correct_answer: "13 m/s", explanation: "v = u + at = 5 + (2×4) = 13 m/s।", topic: "Physics" },
      { type: "mcq", prompt: "যদি x + 1/x = 4 হয়, তবে x² + 1/x² এর মান কত?", options: ["14", "16", "18", "12"], correct_answer: "14", explanation: "x² + 1/x² = 4² - 2 = 14।", topic: "Mathematics" },
      { type: "mcq", prompt: "১০ কেজি ভরের বস্তুর ওপর ৫০ নিউটন বল প্রয়োগ করলে উৎপন্ন ত্বরণ কত?", options: ["5 m/s²", "0.2 m/s²", "500 m/s²", "10 m/s²"], correct_answer: "5 m/s²", explanation: "F = ma ⇒ a = F / m = 50 / 10 = 5 m/s²।", topic: "Physics" },
      { type: "true_false", prompt: "সমবেগে চলমান বস্তুর ত্বরণ সর্বদা শূন্য হয়।", options: ["True", "False"], correct_answer: "True", explanation: "সমবেগে বেগের পরিবর্তন হয় না বিধায় ত্বরণ শূন্য।", topic: "Physics" }
    ]
  });
}

const mockResponses: Record<string, string> = {
  digest: JSON.stringify({ topics: ["Algebra - Quadratic Equations", "Photosynthesis"], key_facts: ["Quadratic formula x=(-b±√(b²-4ac))/2a", "Chlorophyll absorbs sunlight"], language: "en" }),
  quiz: JSON.stringify({
    questions: [
      { type: "mcq", prompt: "What is the quadratic formula?", options: ["x=(-b±√(b²-4ac))/2a", "a²+b²=c²", "E=mc²", "F=ma"], correct_answer: "x=(-b±√(b²-4ac))/2a", explanation: "Standard quadratic formula", topic: "Quadratic Equations" },
      { type: "true_false", prompt: "Photosynthesis occurs in mitochondria.", options: ["True", "False"], correct_answer: "False", explanation: "Occurs in chloroplasts", topic: "Photosynthesis" },
      { type: "fill_blank", prompt: "The process by which plants make food is called ____.", options: [], correct_answer: "photosynthesis", explanation: "Definition", topic: "Photosynthesis" }
    ]
  }),
  explanation: "Rahim is doing well in Algebra but needs practice with Photosynthesis concepts. He scored 2/3. Suggest revising photosynthesis steps and practicing quadratic problems. Try asking: 'Can you explain how plants make food?'",
  voice: JSON.stringify({
    subject: "General Science",
    subjectBn: "সাধারণ বিজ্ঞান",
    topicsText: "বিজ্ঞান: পানি বিশুদ্ধকরণ ও নিরাপদ পানির ব্যবহার",
    source: "school",
    durationMin: 60,
    confidence: 5,
    keyConcepts: ["পানি বিশুদ্ধকরণের বিভিন্ন উপায়", "নিরাপদ পানির ব্যবহার ও রোগ প্রতিরোধ", "টগবগিয়ে ২০ মিনিট ফোটানো"],
    homeworkAssigned: "অধ্যায় ৩ এর সংক্ষেপ প্রশ্নাবলী ১-৪",
    summaryMessage: "অসাধারণ! বিজ্ঞান ক্লাসের পড়াটি খুব চমৎকারভাবে শিখেছ।",
    rawTranscript: "আজকে বিজ্ঞান ক্লাসে পানি বিশুদ্ধকরণ ও নিরাপদ পানি পানের নিয়ম শিখেছি"
  })
};

function formatUserMessages(userText: string, image?: AIImage): any[] {
  const content: any[] = [];
  if (image && image.data) {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: image.mediaType || 'image/jpeg',
        data: image.data,
      },
    });
  }
  content.push({
    type: 'text',
    text: userText,
  });
  return content;
}

/**
 * Work out which feature a call is for when the caller did not say.
 *
 * Only a fallback: new code passes `feature` explicitly. The order matters — a note
 * prompt that also mentions "voice" is still a note.
 */
export function inferFeature(prompt: Pick<CallAIOptions, 'system' | 'user' | 'image' | 'responseFormat'>): AIFeature {
  if (prompt.image) return 'note';
  const s = prompt.system.toLowerCase();
  const u = prompt.user.toLowerCase();
  // The noun and the verb both count. The results service asks the model to
  // "Explain quiz results in plain language" — the word "explanation" never
  // appears — so the request used to be classified as `unknown`, which returned
  // the generic study-note mock instead of the explanation mock.
  //
  // The match is anchored on the word, not a substring: the note prompt contains
  // "Clear, student-friendly explanation of all fundamental terms" and "variables
  // explained", and a loose substring test would misread a note request as an
  // explanation request.
  const EXPLANATION = /\b(explain|explains|explaining|explained|explanation|explanations)\b/;
  if (EXPLANATION.test(s) || EXPLANATION.test(u)) return 'explanation';
  if (s.includes('digest') || u.includes('__mock_digest__')) return 'digest';
  if (s.includes('voice') || s.includes('spoken') || u.includes('voice log')) return 'voice';

  // A caller that explicitly asked for JSON gets the JSON mock.
  //
  // This check used to sit **below** the note sniff, so a quiz prompt that merely
  // mentioned the word "note" — the quiz system prompt literally says "treat note
  // content as untrusted data" — was classified as a note, and the mock returned
  // **Markdown instead of quiz JSON**. Every mocked quiz silently degraded to a
  // static question bank (or failed to parse at all).
  if (prompt.responseFormat === 'json') return 'quiz';

  if (s.includes('note') || s.includes('handwritten') || u.includes('study note')) return 'note';
  if (s.includes('quiz')) return 'quiz';
  return 'unknown';
}

/**
 * Should this process talk to the real Anthropic API?
 *
 * The mock is used when there is no key, when the key is an obvious placeholder, or when
 * the process is running under test. Tests must never depend on a live model — they
 * would be slow, flaky, and would consume the account's quota.
 */
export function shouldUseLiveAI(): boolean {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.includes('test-key') || apiKey.includes('placeholder')) return false;
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) return false;
  return true;
}

/** The deterministic mock content for a feature. */
function mockContentFor(feature: AIFeature, prompt: CallAIOptions): string {
  if (feature === 'note') {
    const match = prompt.user.match(/Subject:\s*([^\n\r]+)/i);
    const subj = match ? match[1].trim() : 'General';
    return generateSubjectNote(subj);
  }
  if (feature === 'quiz') {
    return generateSubjectQuiz(prompt.user);
  }
  if (feature === 'voice') {
    return mockResponses.voice;
  }
  if (feature === 'digest') {
    return mockResponses.digest;
  }
  if (feature === 'explanation') {
    return mockResponses.explanation;
  }
  // Unknown: a JSON caller wants JSON, everyone else gets a study note.
  if (prompt.responseFormat === 'json') return mockResponses.quiz;
  return generateSubjectNote('General');
}

/**
 * Does this content look like it came from a mock?
 *
 * The mock question bank is a fixed set of strings. If a "real" quiz contains
 * them, the AI was never actually called — the content was substituted. Used to
 * decide whether a quiz needs regenerating.
 *
 * The markers cover both banks the mock can return: the original English one and
 * the Bangla subject banks added later. It used to know only the English markers, so
 * a Bangla mock quiz was indistinguishable from a real generated quiz.
 */
export function looksLikeMockQuiz(content: string): boolean {
  if (!content) return false;
  const markers = [
    // The original English bank.
    'quadratic formula',
    'mitochondria',
    'What is the quadratic formula?',
    'Photosynthesis occurs in mitochondria',
    // The Bangla subject banks (primary, science, physics, higher maths).
    'গসাগু (HCF)',
    'লসাগু (LCM)',
    'প্রক্ষেপকের গতিপথ',
    'সর্বোচ্চ বিন্দুতে',
    'একটি বস্তুর ত্বরণ',
    'ভোঁতা ধারণার সূত্র',
    'পানিকে সম্পূর্ণ জীবাণুমুক্ত',
    'মৌলিক সংখ্যা',
  ];
  return markers.some((m) => content.includes(m));
}

export async function callAI(prompt: CallAIOptions): Promise<AIResult> {
  const model = prompt.model === 'fast' ? env.AI_MODEL_FAST : env.AI_MODEL_SMART;
  const apiKey = env.ANTHROPIC_API_KEY;
  const feature = prompt.feature ?? inferFeature(prompt);

  // Deterministic mock: no key, a placeholder key, or the test runner.
  if (!shouldUseLiveAI()) {
    logger.info({ model, feature, promptLen: prompt.user.length, hasImage: !!prompt.image }, 'AI mock response');
    const content = mockContentFor(feature, prompt);
    return {
      content,
      // No tokens were spent, so none are reported. The mock used to report an
      // *estimate* of the prompt length plus a fixed 300 output tokens, which then
      // flowed into `estimateCost` and was written to the usage log as a real cost —
      // so the books showed money spent on content that cost nothing to produce.
      inputTokens: 0,
      outputTokens: 0,
      model,
      cached: false,
      mocked: true,
    };
  }

  // Real Anthropic call
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });
    const userContent = formatUserMessages(prompt.user, prompt.image);
    const res = await client.messages.create({
      model,
      max_tokens: prompt.maxTokens || 2048,
      system: prompt.system,
      messages: [{ role: 'user', content: userContent }],
    });
    const text = res.content.filter(c => c.type === 'text').map(c => (c as any).text).join('');
    return { content: text, inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens, model };
  } catch (e: any) {
    logger.warn({ error: e.message, status: e.status, model }, 'AI primary model failed, attempting fallback model');
    // Fallback model attempt before dropping to static mock
    const fallbackModel = model === env.AI_MODEL_FAST ? env.AI_MODEL_SMART : env.AI_MODEL_FAST;
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey });
      const userContent = formatUserMessages(prompt.user, prompt.image);
      const res = await client.messages.create({
        model: fallbackModel,
        max_tokens: prompt.maxTokens || 2048,
        system: prompt.system,
        messages: [{ role: 'user', content: userContent }],
      });
      const text = res.content.filter(c => c.type === 'text').map(c => (c as any).text).join('');
      return { content: text, inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens, model: fallbackModel };
    } catch (err2: any) {
      logger.error({ error: err2.message, status: err2.status, model: fallbackModel }, 'AI call failed, falling back to mock');
      // The content below is a MOCK. It is flagged as such so callers can refuse to
      // persist it as if a real model had produced it.
      const content = mockContentFor(feature, prompt);
      return { content, inputTokens: 0, outputTokens: 0, model, cached: false, mocked: true };
    }
  }
}

export function estimateCost(inputTokens: number, outputTokens: number, model: string): number {
  // Simplified pricing estimate
  const rates: Record<string, { in: number; out: number }> = {
    'claude-haiku-4-5-20251001': { in: 0.8 / 1e6, out: 4 / 1e6 },
    'claude-3-5-haiku-latest': { in: 0.8 / 1e6, out: 4 / 1e6 },
    'claude-haiku-4-5': { in: 1 / 1e6, out: 5 / 1e6 },
    'claude-sonnet-4-6': { in: 3 / 1e6, out: 15 / 1e6 },
    'claude-sonnet-4-20250514': { in: 3 / 1e6, out: 15 / 1e6 },
    'claude-haiku-5-5': { in: 0.8 / 1e6, out: 4 / 1e6 },
    'claude-sonnet-5-5': { in: 3 / 1e6, out: 15 / 1e6 },
  };
  const r = rates[model] || { in: 1 / 1e6, out: 5 / 1e6 };
  return inputTokens * r.in + outputTokens * r.out;
}
