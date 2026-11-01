export type PlanCode = 'trial' | 'starter' | 'standard' | 'premium';
export interface PlanLimits { maxChildren: number; aiQuizzesPerMonth: number; aiVisionOCR: boolean; historyMonths: number | null; aiExplanation: boolean; }

export const PLANS: Record<PlanCode, { name: string; priceBDT: number; priceUSD: number; limits: PlanLimits }> = {
  trial: { name: 'Trial', priceBDT: 0, priceUSD: 0, limits: { maxChildren: 2, aiQuizzesPerMonth: 40, aiVisionOCR: false, historyMonths: 12, aiExplanation: true } },
  starter: { name: 'Starter', priceBDT: 149, priceUSD: 2, limits: { maxChildren: 3, aiQuizzesPerMonth: 10, aiVisionOCR: false, historyMonths: 3, aiExplanation: false } },
  standard: { name: 'Standard', priceBDT: 299, priceUSD: 4, limits: { maxChildren: 5, aiQuizzesPerMonth: 40, aiVisionOCR: false, historyMonths: 12, aiExplanation: true } },
  premium: { name: 'Premium', priceBDT: 499, priceUSD: 6, limits: { maxChildren: 10, aiQuizzesPerMonth: 120, aiVisionOCR: true, historyMonths: null, aiExplanation: true } },
};

export function getPlanLimits(code: string): PlanLimits { return (PLANS as any)[code]?.limits || PLANS.standard.limits; }
export function canCreateChild(currentCount: number, planCode: string): boolean { return currentCount < getPlanLimits(planCode).maxChildren; }
export function canGenerateQuiz(quizzesThisMonth: number, planCode: string): boolean { return quizzesThisMonth < getPlanLimits(planCode).aiQuizzesPerMonth; }
