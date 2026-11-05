/** Quiz language follows the student's medium and the subject, never UI locale. */
export function isEnglishSubject(subject: string): boolean {
  return /\b(?:eng|english)\b|ইংরেজ[িী]|ইংলিশ/i.test(subject);
}

export function quizSubjectKey(subject: string): string {
  if (isEnglishSubject(subject)) return 'eng';
  const aliases: Array<[string, RegExp]> = [
    ['math', /\b(?:math|hmath|mathematics|algebra)\b|গণিত|বীজগণিত/i],
    ['phys', /\b(?:phys|physics)\b|পদার্থ/i],
    ['chem', /\b(?:chem|chemistry)\b|রসায়ন|রসায়ন/i],
    ['bio', /\b(?:bio|biology)\b|জীব/i],
    ['bn', /\b(?:bn|bangla|bengali)\b|বাংলা/i],
    ['ict', /\b(?:ict|computer)\b|তথ্য/i],
    ['bgs', /\bbgs\b|bangladesh.*global|বাংলাদেশ.*বিশ্ব/i],
    ['science', /\bscience\b|বিজ্ঞান/i],
  ];
  return aliases.find(([, pattern]) => pattern.test(subject))?.[0] || subject.trim().toLowerCase();
}

export function quizLanguage(medium: string | null | undefined, subject: string): 'en' | 'bn' {
  return /english|ইংরেজ[িী]/i.test(medium || '') || isEnglishSubject(subject) ? 'en' : 'bn';
}

export function quizLanguageMode(medium: string | null | undefined, subjects: string[]): 'en' | 'bn' | 'mixed' {
  const languages = new Set((subjects.length ? subjects : ['General']).map((subject) => quizLanguage(medium, subject)));
  return languages.size > 1 ? 'mixed' : languages.has('en') ? 'en' : 'bn';
}

export function hasQuizLanguage(question: { prompt: string; explanation: string }, language: 'en' | 'bn'): boolean {
  const bengali = /[\u0980-\u09ff]/;
  return language === 'bn'
    ? bengali.test(question.prompt) && bengali.test(question.explanation)
    : /[a-z]/i.test(question.prompt) && /[a-z]/i.test(question.explanation)
      && !bengali.test(question.prompt) && !bengali.test(question.explanation);
}

export const QUIZ_LANGUAGE_RULE = 'Use each topic/source subject\'s required language for its question, explanation, and ordinary option text. For Bangla-medium/version students, English/eng/ইংরেজি is in English; every other subject is in Bangla. Mixed-subject quizzes must follow this per question. Symbols, formulas, proper names and quoted English terms may remain unchanged. Never choose output language from the interface language or from the language of the source notes.';
