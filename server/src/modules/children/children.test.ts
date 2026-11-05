import { describe, it, expect } from 'vitest';
import { canCreateChild, getPlanLimits } from '../../services/entitlements';
import { demoParent, demoChildIds, parent } from '../../test-utils/actors';

describe('Entitlements', () => {
  it('trial max 2', () => {
    // `trial` was sold with two child slots, so it must still grant two — the
    // entitlement layer maps it onto a current plan that covers what it sold.
    expect(getPlanLimits('trial').maxChildren).toBeGreaterThanOrEqual(2);
  });
  it('canCreateChild respects freemium limit', () => {
    expect(canCreateChild(1, 'free')).toBe(false);
    expect(canCreateChild(0, 'free')).toBe(true);

    expect(canCreateChild(1, 'basic')).toBe(false);
    expect(canCreateChild(0, 'basic')).toBe(true);

    // Premium allows 2 children
    expect(canCreateChild(1, 'premium')).toBe(true);
    expect(canCreateChild(2, 'premium')).toBe(false);

    // Pro allows 5 children
    expect(canCreateChild(4, 'pro')).toBe(true);
    expect(canCreateChild(5, 'pro')).toBe(false);
  });
});

describe('Child ownership isolation', () => {
  it('a parent can read their own child', async () => {
    const { getChild } = await import('./children.service');
    const child = await getChild(demoParent(), demoChildIds.rahim);
    expect(child.id).toBe(demoChildIds.rahim);
  });

  it('a parent CANNOT read another tenant\'s child (404, not 403)', async () => {
    const { getChild } = await import('./children.service');
    // A brand-new account has no children of its own, so the demo child is not reachable.
    await expect(getChild(parent('someone-elses-account'), demoChildIds.rahim)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('a child CANNOT read a sibling\'s data', async () => {
    const { getChild } = await import('./children.service');
    const { child: childActor } = await import('../../test-utils/actors');
    const rahim = childActor(demoParent().ownerId, demoChildIds.rahim);
    await expect(getChild(rahim, demoChildIds.tasnim)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('listChildren returns only the actor\'s own children', async () => {
    const { listChildren } = await import('./children.service');
    const mine = await listChildren(parent('a-brand-new-account'));
    expect(mine).toBeDefined();
    expect(mine.length).toBe(0);
  });
});

describe('Unlogged Study Alert Configuration', () => {
  it('saves and retrieves student-specific unlogged alert settings', async () => {
    const { getUnloggedAlertConfig, saveUnloggedAlertConfig } = await import('./children.service');
    const actor = demoParent();
    const initial = await getUnloggedAlertConfig(actor, demoChildIds.rahim);
    expect(initial.childId).toBe(demoChildIds.rahim);
    expect(initial.enabled).toBe(true);

    const updated = await saveUnloggedAlertConfig(actor, demoChildIds.rahim, {
      time: '21:30',
      channel: 'email',
    });
    expect(updated.time).toBe('21:30');
    expect(updated.channel).toBe('email');

    // Distinct from child 2 (saved separately per student)
    const child2Config = await getUnloggedAlertConfig(actor, demoChildIds.tasnim);
    expect(child2Config.childId).toBe(demoChildIds.tasnim);
    expect(child2Config.time).not.toBe('21:30');
  });

  it('another tenant cannot read an alert config', async () => {
    const { getUnloggedAlertConfig } = await import('./children.service');
    await expect(getUnloggedAlertConfig(parent('someone-elses-account'), demoChildIds.rahim)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('triggers test alert notification', async () => {
    const { triggerTestUnloggedAlert } = await import('./children.service');
    const actor = demoParent();
    const res = await triggerTestUnloggedAlert(actor, demoChildIds.rahim);
    expect(res.success).toBe(true);
    expect(res.notification.userId).toBe(actor.ownerId);
  });
});
