import { describe, it, expect } from 'vitest';
import { PLANS } from '../../services/entitlements';

describe('Billing', ()=>{
  it('plans have correct prices', ()=>{
    expect(PLANS.starter.priceBDT).toBe(149);
    expect(PLANS.standard.priceBDT).toBe(299);
    expect(PLANS.premium.priceBDT).toBe(499);
  });
  it('sibling discount concept', ()=>{
    const base=299;
    const second=Math.round(base*0.75);
    const third=Math.round(base*0.65);
    expect(second).toBe(224);
    expect(third).toBe(194);
  });
  it('annual pay 10 get 12', ()=>{
    const monthly=299; const annual=monthly*10;
    expect(annual).toBe(2990);
    expect(annual/12).toBeLessThan(monthly);
  });
});
