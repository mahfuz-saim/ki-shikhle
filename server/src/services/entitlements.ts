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

/**
 * The catalogue of plans that are actually sold.
 *
 * These four are the product. `getPlans()` returns exactly them, the billing page
 * renders exactly them, and the checkout schema accepts exactly them.
 */
export const CATALOGUE_CODES = ['free', 'basic', 'premium', 'pro'] as const;

/**
 * Plans from an abandoned pricing model.
 *
 * `trial`, `starter` and `standard` were once sellable. They are no longer advertised
 * or purchasable, but a `Subscription` row may still point at one, so they must
 * resolve to *something*. They used to be handled by three separate mechanisms that
 * disagreed with each other:
 *
 *   - an alias block:  `PLANS.starter = PLANS.basic` etc.
 *   - special cases:  `if (code === 'standard') return PLANS.basic.limits`
 *   - the database:   `plans.limits_json` said 5 children for `standard`
 *
 * so an account that paid ৳299 for `standard` was quoted five children and then
 * blocked at two. The alias block and the special cases are both gone; what remains
 * is one rule, applied by `legacyTierFor`, that grants each legacy subscriber at
 * least what they were sold.
 */
export const LEGACY_PLANS: Record<string, { name: string; priceBDT: number; priceUSD: number; sold: PlanLimits }> = {
  trial: {
    name: 'Trial',
    priceBDT: 0,
    priceUSD: 0,
    sold: { maxChildren: 2, aiQuizzesPerMonth: 40, aiVisionOCR: false, historyMonths: 12, aiExplanation: true, autoQuizScheduling: false },
  },
  starter: {
    name: 'Starter',
    priceBDT: 149,
    priceUSD: 2,
    sold: { maxChildren: 3, aiQuizzesPerMonth: 10, aiVisionOCR: false, historyMonths: 3, aiExplanation: false, autoQuizScheduling: false },
  },
  standard: {
    name: 'Standard',
    priceBDT: 299,
    priceUSD: 4,
    sold: { maxChildren: 5, aiQuizzesPerMonth: 40, aiVisionOCR: false, historyMonths: 12, aiExplanation: true, autoQuizScheduling: false },
  },
};

/**
 * Does `granted` grant at least as much as `sold` on every dimension?
 *
 * `historyMonths: null` means unlimited, which is at least as much as any number.
 * `false` for a boolean flag means the feature is simply not granted, so any value
 * satisfies it.
 */
function grantsAtLeast(granted: PlanLimits, sold: PlanLimits): boolean {
  if (granted.maxChildren < sold.maxChildren) return false;
  if (granted.aiQuizzesPerMonth < sold.aiQuizzesPerMonth) return false;
  if (sold.aiVisionOCR && !granted.aiVisionOCR) return false;
  if (sold.aiExplanation && !granted.aiExplanation) return false;
  if (sold.autoQuizScheduling && !granted.autoQuizScheduling) return false;
  if (sold.historyMonths !== null) {
    if (granted.historyMonths === null) {
      // Unlimited covers any window.
    } else if (granted.historyMonths < sold.historyMonths) {
      return false;
    }
  }
  return true;
}

/**
 * The cheapest current plan that grants a legacy subscriber at least what they bought.
 *
 * This is computed rather than hand-written, so it cannot drift from the catalogue:
 * if `pro` is ever re-priced below `premium`, the mapping follows. When no current
 * plan covers what was sold, `pro` is the fallback — being generous to a subscriber
 * who already paid is a smaller failure than blocking them from their own children.
 */
export function legacyTierFor(code: string): string {
  const legacy = LEGACY_PLANS[code];
  if (!legacy) return 'free';
  const covering = CATALOGUE_CODES.map((c) => PLANS[c])
    .filter((p) => grantsAtLeast(p.limits, legacy.sold))
    .sort((a, b) => a.priceBDT - b.priceBDT);
  return covering[0]?.code || 'pro';
}

/**
 * The limits for a plan code.
 *
 * One rule, three inputs, one answer:
 *
 *  - a current plan code returns its own limits;
 *  - a legacy code returns the limits of the current plan that covers what it sold;
 *  - anything unknown falls back to the free limits.
 *
 * Nothing here reads the database, so the answer cannot depend on whether the
 * database was reachable.
 */
export function getPlanLimits(code: string): PlanLimits {
  const direct = PLANS[code];
  if (direct) return direct.limits;
  if (LEGACY_PLANS[code]) return PLANS[legacyTierFor(code)].limits;
  return PLANS.free.limits;
}

/**
 * The full plan for a code, resolved for display.
 *
 * A legacy code keeps its own `code` and `name` — an account should still see the
 * plan it bought — but carries the limits of the current plan that covers it, and a
 * `tier` naming that current plan so the UI can highlight the right card.
 */
export function resolvePlan(code: string): {
  code: string;
  name: string;
  priceBDT: number;
  priceUSD: number;
  limits: PlanLimits;
  features: string[];
  tier: string;
  legacy: boolean;
} {
  const direct = PLANS[code];
  if (direct) {
    return {
      code: direct.code,
      name: direct.name,
      priceBDT: direct.priceBDT,
      priceUSD: direct.priceUSD,
      limits: direct.limits,
      features: direct.features,
      tier: direct.code,
      legacy: false,
    };
  }
  const legacy = LEGACY_PLANS[code];
  if (legacy) {
    const tier = legacyTierFor(code);
    const tierPlan = PLANS[tier];
    return {
      code,
      name: legacy.name,
      priceBDT: legacy.priceBDT,
      priceUSD: legacy.priceUSD,
      limits: tierPlan.limits,
      features: tierPlan.features,
      tier,
      legacy: true,
    };
  }
  const free = PLANS.free;
  return { code: 'free', name: free.name, priceBDT: 0, priceUSD: 0, limits: free.limits, features: free.features, tier: 'free', legacy: false };
}

/**
 * Can this plan be purchased?
 *
 * The legacy codes can still be *held* by an existing subscriber but must not be
 * *bought*: `standard` at ৳299 grants five children while `premium` at ৳599 grants
 * two, so leaving it purchasable would sell the family plan at half the flagship
 * price.
 */
export function isSellablePlan(code: string): boolean {
  return (CATALOGUE_CODES as readonly string[]).includes(code);
}

export function canCreateChild(currentCount: number, planCode: string): boolean {
  return currentCount < getPlanLimits(planCode).maxChildren;
}

export function canGenerateQuiz(quizzesThisMonth: number, planCode: string): boolean {
  return quizzesThisMonth < getPlanLimits(planCode).aiQuizzesPerMonth;
}

/**
 * Resolve the plan code for an account.
 *
 * The lookup was duplicated in three services, each with its own "on error, assume
 * free" behaviour. It lives here now so there is one answer to "what plan is this
 * account on".
 *
 * A legacy code resolves to the current tier that covers it, so the answer is always
 * a code `getPlanLimits` understands.
 *
 * An account with no subscription is on `free` — never on a paid plan.
 */
export async function resolvePlanCode(userId: string): Promise<string> {
  try {
    const { prisma } = await import('../db/client');
    const sub = await prisma.subscription.findFirst({
      where: { userId, status: { in: ['active', 'trialing'] } },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
    const code = sub?.plan?.code;
    if (!code) return 'free';
    return PLANS[code] ? code : legacyTierFor(code);
  } catch {
    return 'free';
  }
}

/**
 * Can this plan use the AI vision / OCR feature?
 *
 * `aiVisionOCR` was declared in every plan but never checked anywhere, so the limit
 * was purely decorative.
 */
export function canUseVision(planCode: string): boolean {
  return getPlanLimits(planCode).aiVisionOCR;
}

/**
 * Can this plan get an AI explanation of a quiz result?
 *
 * `aiExplanation` was declared but never checked — the Free plan's "no explanations"
 * restriction was not enforced.
 */
export function canUseAiExplanation(planCode: string): boolean {
  return getPlanLimits(planCode).aiExplanation;
}

/**
 * How far back the account may read history.
 *
 * `historyMonths` was declared but never applied, so a Free plan could read its whole
 * history. `null` means unlimited.
 */
export function historyWindowMonths(planCode: string): number | null {
  return getPlanLimits(planCode).historyMonths;
}
