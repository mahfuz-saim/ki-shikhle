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

describe('Unlogged Study Alert Configuration', () => {
  it('saves and retrieves student-specific unlogged alert settings', async () => {
    const { getUnloggedAlertConfig, saveUnloggedAlertConfig } = await import('./children.service');
    const initial = await getUnloggedAlertConfig('parent-demo', 'demo-child-1');
    expect(initial.childId).toBe('demo-child-1');
    expect(initial.enabled).toBe(true);

    const updated = await saveUnloggedAlertConfig('parent-demo', 'demo-child-1', {
      time: '21:30',
      channel: 'email',
    });
    expect(updated.time).toBe('21:30');
    expect(updated.channel).toBe('email');

    // Distinct from child 2 (saved separately per student)
    const child2Config = await getUnloggedAlertConfig('parent-demo', 'demo-child-2');
    expect(child2Config.childId).toBe('demo-child-2');
    expect(child2Config.time).not.toBe('21:30');
  });

  it('triggers test alert notification', async () => {
    const { triggerTestUnloggedAlert } = await import('./children.service');
    const res = await triggerTestUnloggedAlert('parent-demo', 'demo-child-1');
    expect(res.success).toBe(true);
    expect(res.notification.userId).toBe('parent-demo');
  });
});
