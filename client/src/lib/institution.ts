import { type Translator } from './i18n-context';

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
    g.includes('মেডিকেল') ||
    g.includes('বুয়েট')
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

/**
 * The labels for an institution type.
 *
 * This is a plain module, not a component, so it cannot call `useI18n()` — the
 * translator is passed in. Every string comes from the message dictionaries, so a
 * new language needs no change here.
 */
export function getInstitutionInfo(type: InstitutionType, t: Translator) {
  if (type === 'college') {
    return {
      type,
      name: t('institution.college'),
      shortName: t('institution.college'),
      sourceKey: 'college' as const,
      hasSchool: false,
      hasCollege: true,
      categoryFilterPill: t('institution.college_classes'),
      classesHeading: t('institution.college_classes_heading'),
      routineTitle: t('institution.college_routine'),
      icon: '🏛️',
      description: t('institution.manage_college_lectures_lab_sessions_and_private'),
    };
  }

  if (type === 'admission') {
    return {
      type,
      name: t('institution.admission_prep'),
      shortName: t('institution.admission'),
      sourceKey: null,
      hasSchool: false,
      hasCollege: false,
      categoryFilterPill: t('institution.coaching_tests'),
      classesHeading: t('institution.admission_classes_heading'),
      routineTitle: t('institution.admission_prep_routine'),
      icon: '🎓',
      description: t('institution.manage_university_and_medical_admission_coaching'),
    };
  }

  // Default: School (Class 1 to 10)
  return {
    type,
    name: t('institution.school'),
    shortName: t('institution.school'),
    sourceKey: 'school' as const,
    hasSchool: true,
    hasCollege: false,
    categoryFilterPill: t('institution.school_classes'),
    classesHeading: t('institution.school_classes_heading'),
    routineTitle: t('institution.school_routine'),
    icon: '🏫',
    description: t('institution.manage_school_periods_homework_sessions_and_priv'),
  };
}
