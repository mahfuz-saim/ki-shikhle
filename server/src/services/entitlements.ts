export type PlanCode = 'free' | 'basic' | 'premium' | 'pro' | 'trial' | 'starter' | 'standard';

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
    name: 'Free (ফ্রি)',
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
      '2 AI quizzes per month (চিরকাল ফ্রি)',
      'Daily routine & activity calendar',
      'Manual quick study logging',
      'Basic quiz score tracking',
      '1-month study history',
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
      'Voice Logging with Claude AI transcription preview',
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
      'Automatic Quiz Setup System (স্বয়ংক্রিয় এআই কুইজ শিডিউলিং)',
      'Spaced Repetition: Auto quizzes for 1-day-old topics',
      'AI Dynamic Time Limits (Tight for theory, generous for math/analytical)',
      'Adaptive topic understanding & weakness auto-targeting',
      'Unlimited study history & priority AI processing',
    ],
  },
  pro: {
    code: 'pro',
    name: 'Pro Family (প্রো ফ্যামিলি)',
    priceBDT: 999,
    priceUSD: 11.99,
    limits: {
      maxChildren: 5,
      aiQuizzesPerMonth: 150,
      aiVisionOCR: true,
      historyMonths: null,
      aiExplanation: true,
      autoQuizScheduling: true,
    },
    features: [
      'Up to 5 Children profile slots (পুরো পরিবারের জন্য)',
      '150 AI quizzes per month',
      'Automatic Quiz Setup System for all siblings',
      'WhatsApp & SMS study alerts & daily summary',
      'Monthly academic audit report (PDF download)',
      'School exam syllabus integration & priority support',
      'Full plain-language AI performance analytics',
    ],
  },
};

PLANS.starter = PLANS.basic;
PLANS.standard = PLANS.premium;
PLANS.trial = PLANS.free;

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
