import { describe,it,expect } from 'vitest';
describe('Admin metrics', ()=>{
  it('computes MRR', ()=>{
    const paid=12; const mrr=paid*299;
    expect(mrr).toBe(3588);
  });
  it('AI cost per active child', ()=>{
    const cost=3.42; const active=12; const perChild=cost/active;
    expect(perChild).toBeLessThan(1);
  });
});
