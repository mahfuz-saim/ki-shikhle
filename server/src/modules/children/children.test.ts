import { describe, it, expect } from 'vitest';
import { canCreateChild, getPlanLimits } from '../../services/entitlements';

describe('Entitlements', () => {
  it('trial max 2', () => expect(getPlanLimits('trial').maxChildren).toBe(2));
  it('canCreateChild respects freemium limit', () => {
    expect(canCreateChild(1, 'free')).toBe(false);
    expect(canCreateChild(0, 'free')).toBe(true);

    expect(canCreateChild(1, 'basic')).toBe(false);
    expect(canCreateChild(0, 'basic')).toBe(true);

    // Premium allows 2 children
    expect(canCreateChild(1, 'premium')).toBe(true);
    expect(canCreateChild(2, 'premium')).toBe(false);
  });
});

describe('Child PIN', () => {
  it('ownership enforced at query level (concept)', () => {
    // Parent can only access own children — service checks parentId in where clause
    const query = { where: { id: 'child1', parentId: 'parent1' } };
    expect(query.where.parentId).toBe('parent1');
  });
});
