import { describe, it, expect } from 'vitest';
import { PLANS } from '../../services/entitlements';

describe('Billing', () => {
  it('freemium plans have correct prices and limits', () => {
    expect(PLANS.free.priceBDT).toBe(0);
    expect(PLANS.free.limits.maxChildren).toBe(1);
    expect(PLANS.free.limits.aiQuizzesPerMonth).toBe(2);

    expect(PLANS.basic.priceBDT).toBe(249);
    expect(PLANS.basic.limits.maxChildren).toBe(1);
    expect(PLANS.basic.limits.aiQuizzesPerMonth).toBe(10);

    expect(PLANS.premium.priceBDT).toBe(599);
    expect(PLANS.premium.limits.maxChildren).toBe(2);
    expect(PLANS.premium.limits.aiQuizzesPerMonth).toBe(50);
    expect(PLANS.premium.limits.autoQuizScheduling).toBe(true);

    expect(PLANS.pro.priceBDT).toBe(999);
    expect(PLANS.pro.limits.maxChildren).toBe(5);
    expect(PLANS.pro.limits.aiQuizzesPerMonth).toBe(150);
    expect(PLANS.pro.limits.autoQuizScheduling).toBe(true);
  });

  it('sibling discount concept', () => {
    const base = 249;
    const second = Math.round(base * 0.75);
    const third = Math.round(base * 0.65);
    expect(second).toBe(187);
    expect(third).toBe(162);
  });

  it('annual pay 10 get 12', () => {
    const monthly = 599;
    const annual = monthly * 10;
    expect(annual).toBe(5990);
    expect(annual / 12).toBeLessThan(monthly);
  });

  it('calculates tier pricing with included and extra children accurately', async () => {
    const { calculateSubscriptionAmount } = await import('../../services/payments');
    // Pro Family includes 5 children:
    expect(calculateSubscriptionAmount('pro', 5, 'monthly')).toBe(999);
    expect(calculateSubscriptionAmount('pro', 1, 'monthly')).toBe(999); // lessened
    expect(calculateSubscriptionAmount('pro', 6, 'monthly')).toBe(1149); // +1 extra child
    expect(calculateSubscriptionAmount('pro', 5, 'yearly')).toBe(9990); // 10 months

    // Premium includes 2 children:
    expect(calculateSubscriptionAmount('premium', 2, 'monthly')).toBe(599);
    expect(calculateSubscriptionAmount('premium', 1, 'monthly')).toBe(599); // lessened
    expect(calculateSubscriptionAmount('premium', 3, 'monthly')).toBe(798); // +1 extra child

    // Basic includes 1 child:
    expect(calculateSubscriptionAmount('basic', 1, 'monthly')).toBe(249);
    expect(calculateSubscriptionAmount('basic', 2, 'monthly')).toBe(429); // +1 extra child

    // Free includes 1 child:
    expect(calculateSubscriptionAmount('free', 1, 'monthly')).toBe(0);
  });
});
