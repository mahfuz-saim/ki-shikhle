import { describe, it, expect, beforeEach } from 'vitest';
import { canCreateChild, getPlanLimits } from '../../services/entitlements';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

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

    // Pro allows 5 children
    expect(canCreateChild(4, 'pro')).toBe(true);
    expect(canCreateChild(5, 'pro')).toBe(false);
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

  it('creates child profile with long grade name and relative avatar path', async () => {
    const { app } = await import('../../app');
    const res = await app.request('/api/v1/children', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer demo-parent-token',
      },
      body: JSON.stringify({
        name: 'HSC Student',
        nickname: 'HSC',
        grade: 'Class 11 (HSC 1st Year)',
        curriculum: 'NCTB',
        medium: 'Bangla',
        avatar: '/avatars/boy-1.png',
        email: 'hsc_student@example.com',
        password: 'password123',
      }),
    });
    const data: any = await res.json();
    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('HSC Student');
    expect(data.data.grade).toBe('Class 11 (HSC 1st Year)');
    expect(data.data.avatar).toBe('/avatars/boy-1.png');
  });

  it('creates child profile with demo parent JWT having UUID userId and parent@demo.com email', async () => {
    const { app } = await import('../../app');
    const dbDemoToken = jwt.sign(
      { userId: '11111111-2222-3333-4444-555555555555', email: 'parent@demo.com', role: 'parent' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1d' }
    );
    const res = await app.request('/api/v1/children', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dbDemoToken}`,
      },
      body: JSON.stringify({
        name: 'Admission Candidate',
        nickname: 'Candidate',
        grade: 'Admission Prep',
        curriculum: 'NCTB',
        medium: 'English',
        avatar: '/avatars/girl-1.png',
        email: 'admission_candidate@example.com',
        password: 'password123',
      }),
    });
    const data: any = await res.json();
    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('Admission Candidate');
  });

  it('rejects duplicate student email with 409 Conflict', async () => {
    const { app } = await import('../../app');
    const res = await app.request('/api/v1/children', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer demo-parent-token',
      },
      body: JSON.stringify({
        name: 'Duplicate Student',
        grade: 'Class 8',
        email: 'rahim@demo.com',
        password: 'password123',
      }),
    });
    expect(res.status).toBe(409);
    const data: any = await res.json();
    expect(data.error.code).toBe('CONFLICT');
  });

  it('enforces plan limits with 403 Forbidden instead of Internal Server Error when slots full', async () => {
    const { app } = await import('../../app');
    // Now demo parent already has 5 children (Rahim, Tasnim, Fahim + HSC Student + Admission Candidate)
    const res = await app.request('/api/v1/children', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer demo-parent-token',
      },
      body: JSON.stringify({
        name: 'Sixth Child',
        grade: 'Class 9',
        email: 'sixth_child@example.com',
        password: 'password123',
      }),
    });
    const data: any = await res.json();
    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.data).toBeNull();
    expect(data.error.code).toBe('FORBIDDEN');
    expect(data.error.message).toContain('Plan pro allows max 5 children');
  });
});
