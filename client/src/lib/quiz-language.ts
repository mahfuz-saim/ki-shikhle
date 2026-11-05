/** Match the server's medium/subject policy, independently of the UI locale. */
export function quizLanguage(medium: string | undefined, subject: string): 'en' | 'bn' {
  return /english|ইংরেজ[িী]/i.test(medium || '') || /\b(?:eng|english)\b|ইংরেজ[িী]|ইংলিশ/i.test(subject) ? 'en' : 'bn';
}

export function quizLanguageMode(medium: string | undefined, subjects: string[]): 'en' | 'bn' | 'mixed' {
  const languages = new Set((subjects.length ? subjects : ['General']).map((subject) => quizLanguage(medium, subject)));
  return languages.size > 1 ? 'mixed' : languages.has('en') ? 'en' : 'bn';
}
