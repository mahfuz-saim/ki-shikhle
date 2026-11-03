export type InstitutionType = 'school' | 'college' | 'admission';

/**
 * Resolves student institution type:
 * - 'school' for Classes 1 to 10
 * - 'college' for Classes 11, 12, HSC
 * - 'admission' for University / Medical / Engineering Admission Candidates
 */
export function getInstitutionType(grade?: string | null): InstitutionType {
  if (!grade) return 'school';
  const g = grade.trim().toLowerCase();

  // Admission candidates
  if (
    g.includes('admission') ||
    g.includes('varsity') ||
    g.includes('university') ||
    g.includes('medical') ||
    g.includes('buet') ||
    g.includes('এডমিশন') ||
    g.includes('ভর্তি')
  ) {
    return 'admission';
  }

  // College candidates (Class 11, 12, HSC)
  if (
    g.includes('11') ||
    g.includes('12') ||
    g.includes('hsc') ||
    g.includes('college') ||
    g.includes('কলেজ')
  ) {
    return 'college';
  }

  // Numeric check for 1-10 vs 11-12
  const match = g.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    if (num >= 11 && num <= 12) return 'college';
    if (num >= 1 && num <= 10) return 'school';
  }

  return 'school';
}

export function getInstitutionInfo(type: InstitutionType, isBn = false) {
  if (type === 'college') {
    return {
      type,
      name: isBn ? 'কলেজ' : 'College',
      shortName: isBn ? 'কলেজ' : 'College',
      sourceKey: 'college' as const,
      hasSchool: false,
      hasCollege: true,
      categoryFilterPill: isBn ? '🏛️ কলেজ ক্লাস' : '🏛️ College Classes',
      classesHeading: isBn ? 'আজকের কলেজের ক্লাস ও রুটিন' : "Today's College Classes & Schedule",
      routineTitle: isBn ? 'কলেজ ক্লাস রুটিন' : 'College Routine',
      icon: '🏛️',
      description: isBn
        ? 'কলেজের নির্ধারিত ক্লাস, ল্যাব ও প্রাইভেট টিউশনের রুটিন পরিচালনা করুন।'
        : 'Manage college lectures, lab sessions, and private tuition routines.',
    };
  }

  if (type === 'admission') {
    return {
      type,
      name: isBn ? 'এডমিশন টেস্ট / কোচিং' : 'Admission Prep',
      shortName: isBn ? 'এডমিশন' : 'Admission',
      sourceKey: null,
      hasSchool: false,
      hasCollege: false,
      categoryFilterPill: isBn ? '🎓 কোচিং ও মডেল টেস্ট' : '🎓 Coaching & Tests',
      classesHeading: isBn ? 'আজকের এডমিশন রুটিন ও মডেল টেস্ট' : "Today's Admission Routine & Tests",
      routineTitle: isBn ? 'এডমিশন রুটিন ও সময়সূচী' : 'Admission Prep Routine',
      icon: '🎓',
      description: isBn
        ? 'বিশ্ববিদ্যালয় ও মেডিকেল ভর্তি পরীক্ষার কোচিং, মডেল টেস্ট ও সেলফ-স্টাডি রুটিন।'
        : 'Manage university and medical admission coaching, mock tests, and intensive self-study schedules.',
    };
  }

  // Default: School (Class 1 to 10)
  return {
    type,
    name: isBn ? 'স্কুল' : 'School',
    shortName: isBn ? 'স্কুল' : 'School',
    sourceKey: 'school' as const,
    hasSchool: true,
    hasCollege: false,
    categoryFilterPill: isBn ? '🏫 স্কুল ক্লাস' : '🏫 School Classes',
    classesHeading: isBn ? 'আজকের স্কুলের ক্লাস ও রুটিন' : "Today's School Classes & Schedule",
    routineTitle: isBn ? 'স্কুল ক্লাস রুটিন' : 'School Routine',
    icon: '🏫',
    description: isBn
      ? 'স্কুলের নির্ধারিত ক্লাস ও প্রাইভেট টিউশনের সময়সূচি পরিচালনা করুন।'
      : 'Manage school periods, homework sessions, and private tuition routines.',
  };
}
