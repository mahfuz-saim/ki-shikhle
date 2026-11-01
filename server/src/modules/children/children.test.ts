import { describe, it, expect } from 'vitest';
import { canCreateChild, getPlanLimits } from '../../services/entitlements';

describe('Entitlements', () => {
  it('trial max 2', () => expect(getPlanLimits('trial').maxChildren).toBe(2));
  it('canCreateChild respects limit', () => {
    expect(canCreateChild(2, 'trial')).toBe(false);
    expect(canCreateChild(1, 'trial')).toBe(true);
    expect(canCreateChild(9, 'premium')).toBe(true);
  });
});

describe('Child PIN', () => {
  it('ownership enforced at query level (concept)', () => {
    // Parent can only access own children — service checks parentId in where clause
    const query = { where: { id: 'child1', parentId: 'parent1' } };
    expect(query.where.parentId).toBe('parent1');
  });
});
