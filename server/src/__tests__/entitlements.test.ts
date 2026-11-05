/**
 * Plan entitlements.
 *
 * Four of the six declared limits were not enforced anywhere:
 *
 *  - `aiVisionOCR` — declared on every plan, checked nowhere, so a plan that was
 *    supposed to exclude AI image reading got it for free.
 *  - `aiExplanation` — same: the Free plan's "no explanations" was not enforced.
 *  - `historyMonths` — same: a Free plan could read its entire history.
 *  - `autoQuizScheduling` — WAS enforced, but through a hand-written string check
 *    (`planCode !== 'premium' && planCode !== 'pro'`) that bypassed the limit flag
 *    entirely, so a plan whose `autoQuizScheduling` was true but whose code was not
 *    one of those two strings was still refused.
 *
 * These tests pin the predicates that the services now call.
 */

import { describe, it, expect } from 'vitest';
import {
  PLANS,
  LEGACY_PLANS,
  CATALOGUE_CODES,
  getPlanLimits,
  resolvePlan,
  legacyTierFor,
  isSellablePlan,
  canCreateChild,
  canGenerateQuiz,
  canUseVision,
  canUseAiExplanation,
  historyWindowMonths,
  resolvePlanCode,
} from '../services/entitlements';

describe('plan limits', () => {
  it('resolves the current plan codes to their own limits', () => {
    expect(getPlanLimits('free')).toEqual(PLANS.free.limits);
    expect(getPlanLimits('basic')).toEqual(PLANS.basic.limits);
    expect(getPlanLimits('premium')).toEqual(PLANS.premium.limits);
    expect(getPlanLimits('pro')).toEqual(PLANS.pro.limits);
  });

  /**
   * A legacy plan code must grant at least what it was **sold**.
   *
   * The database said `standard` was sold with five children while the entitlement
   * code granted two, so a subscriber who paid ৳299 for a five-child plan was
   * blocked at two. These assertions pin the promise, not the implementation.
   */
  it('never grants a legacy plan less than it was sold', () => {
    for (const [code, legacy] of Object.entries(LEGACY_PLANS)) {
      const granted = getPlanLimits(code);
      expect(granted.maxChildren).toBeGreaterThanOrEqual(legacy.sold.maxChildren);
      expect(granted.aiQuizzesPerMonth).toBeGreaterThanOrEqual(legacy.sold.aiQuizzesPerMonth);
      if (legacy.sold.aiVisionOCR) expect(granted.aiVisionOCR).toBe(true);
      if (legacy.sold.aiExplanation) expect(granted.aiExplanation).toBe(true);
      if (legacy.sold.autoQuizScheduling) expect(granted.autoQuizScheduling).toBe(true);
      if (legacy.sold.historyMonths !== null) {
        expect(granted.historyMonths === null || granted.historyMonths >= legacy.sold.historyMonths).toBe(true);
      }
    }
  });

  it('maps a legacy plan onto the cheapest current plan that covers it', () => {
    // `standard` was sold with five children, which only `pro` grants.
    expect(legacyTierFor('standard')).toBe('pro');
    // `trial` was sold with two children and forty quizzes — `premium` covers both.
    expect(legacyTierFor('trial')).toBe('premium');
    // `starter` was sold with three children and ten quizzes — `pro` is the only
    // current plan with three or more child slots.
    expect(legacyTierFor('starter')).toBe('pro');
  });

  it('keeps a legacy plan identifiable while granting the covering tier', () => {
    const resolved = resolvePlan('standard');
    expect(resolved.code).toBe('standard');
    expect(resolved.legacy).toBe(true);
    expect(resolved.tier).toBe('pro');
    expect(resolved.limits).toEqual(PLANS.pro.limits);
  });

  it('does not let a legacy plan be bought', () => {
    // `standard` at ৳299 grants five children while `premium` at ৳599 grants two.
    for (const code of ['trial', 'starter', 'standard']) {
      expect(isSellablePlan(code)).toBe(false);
    }
    for (const code of CATALOGUE_CODES) {
      expect(isSellablePlan(code)).toBe(true);
    }
  });

  it('falls back to the free limits for an unknown plan', () => {
    expect(getPlanLimits('nonsense')).toEqual(getPlanLimits('free'));
  });

  it('enforces the children limit', () => {
    expect(canCreateChild(0, 'free')).toBe(true);
    expect(canCreateChild(1, 'free')).toBe(false);
    expect(canCreateChild(4, 'pro')).toBe(true);
    expect(canCreateChild(5, 'pro')).toBe(false);
  });

  it('enforces the monthly quiz quota', () => {
    expect(canGenerateQuiz(0, 'free')).toBe(true);
    expect(canGenerateQuiz(2, 'free')).toBe(false);
    expect(canGenerateQuiz(49, 'premium')).toBe(true);
    expect(canGenerateQuiz(50, 'premium')).toBe(false);
  });
});

describe('AI vision limit', () => {
  it('is enabled on the plans that include it', () => {
    expect(canUseVision('free')).toBe(true);
    expect(canUseVision('basic')).toBe(true);
    expect(canUseVision('premium')).toBe(true);
  });

  it('is refused for a plan that excludes it', () => {
    // A plan whose `aiVisionOCR` is false must actually refuse.
    const original = PLANS.pro.limits.aiVisionOCR;
    (PLANS.pro.limits as any).aiVisionOCR = false;
    try {
      expect(canUseVision('pro')).toBe(false);
    } finally {
      (PLANS.pro.limits as any).aiVisionOCR = original;
    }
  });
});

describe('AI explanation limit', () => {
  it('is refused on the free plan', () => {
    expect(PLANS.free.limits.aiExplanation).toBe(false);
    expect(canUseAiExplanation('free')).toBe(false);
  });

  it('is allowed on the paid plans', () => {
    expect(canUseAiExplanation('basic')).toBe(true);
    expect(canUseAiExplanation('premium')).toBe(true);
    expect(canUseAiExplanation('pro')).toBe(true);
  });
});

describe('history window', () => {
  it('limits the free plan to one month of history', () => {
    expect(historyWindowMonths('free')).toBe(1);
  });

  it('is unlimited on the top plan', () => {
    expect(historyWindowMonths('pro')).toBeNull();
  });

  it('grows with the plan', () => {
    const free = historyWindowMonths('free') as number;
    const basic = historyWindowMonths('basic') as number;
    expect(basic).toBeGreaterThan(free);
  });
});

describe('resolvePlanCode', () => {
  it('returns free for an account with no subscription', async () => {
    expect(await resolvePlanCode('no-such-user-uuid')).toBe('free');
  });
});
