export type PlanCode = 'free' | 'basic' | 'premium' | 'trial' | 'starter' | 'standard';

export interface PlanLimits {
  maxChildren: number;
  aiQuizzesPerMonth: number;
  aiVisionOCR: boolean;
  historyMonths: number | null;
  aiExplanation: boolean;
  autoQuizScheduling: boolean;
}

export const PLANS: Record<string, { code: string; name: string; priceBDT: number; priceUSD: number; limits: PlanLimits; features: string[] }> = {
  free: {
    code: 'free',
    name: 'Free (বিনামূল্যে)',
    priceBDT: 0,
    priceUSD: 0,
    limits: {
      maxChildren: 1,
      aiQuizzesPerMonth: 2,
      aiVisionOCR: true,
      historyMonths: 1,
      aiExplanation: false,
      autoQuizScheduling: false,
    },
    features: [
      '1 Child profile slot',
      '2 AI quizzes per month',
      'Daily routine & activity calendar',
      'Quick study logging',
      'Basic quiz score tracking',
    ],
  },
  basic: {
    code: 'basic',
    name: 'Basic (বেসিক)',
    priceBDT: 249,
    priceUSD: 2.99,
    limits: {
      maxChildren: 1,
      aiQuizzesPerMonth: 10,
      aiVisionOCR: true,
      historyMonths: 6,
      aiExplanation: true,
      autoQuizScheduling: false,
    },
    features: [
      '1 Child profile slot',
      '10 AI quizzes per month',
      'Class Notes & OCR handwriting scanner',
      'Weakest vs strongest topics analysis',
      'Routine study log reminders',
      '6-month study history',
    ],
  },
  premium: {
    code: 'premium',
    name: 'Premium (প্রিমিয়াম)',
    priceBDT: 599,
    priceUSD: 6.99,
    limits: {
      maxChildren: 2,
      aiQuizzesPerMonth: 50,
      aiVisionOCR: true,
      historyMonths: null,
      aiExplanation: true,
      autoQuizScheduling: true,
    },
    features: [
      '2 Children profile slots',
      '50 AI quizzes per month',
      'Auto Quiz Scheduling (স্বয়ংক্রিয় কুইজ শিডিউলিং)',
      'Spaced Repetition: 1-Day-Old Topic Quizzes',
      'AI Dynamic Time: Tight for non-math, generous for math/analytical',
      'Adaptive topic understanding & weakness analysis',
      'Full plain-language AI performance feedback',
      'Unlimited study history & priority AI',
    ],
  },
};

export function getPlanLimits(code: string): PlanLimits {
  if (code === 'starter') return PLANS.basic.limits;
  if (code === 'standard') return PLANS.basic.limits;
  if (code === 'trial') return PLANS.premium.limits;
  return PLANS[code]?.limits || PLANS.free.limits;
}

export function canCreateChild(currentCount: number, planCode: string): boolean {
  return currentCount < getPlanLimits(planCode).maxChildren;
}

export function canGenerateQuiz(quizzesThisMonth: number, planCode: string): boolean {
  return quizzesThisMonth < getPlanLimits(planCode).aiQuizzesPerMonth;
}
