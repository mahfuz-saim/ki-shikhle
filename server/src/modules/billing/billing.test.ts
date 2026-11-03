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
});
