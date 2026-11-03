import { prisma } from '../../db/client';
import { paymentProvider } from '../../services/payments';
import { PLANS } from '../../services/entitlements';
import { notFound, badRequest } from '../../utils/errors';
import { memUsers } from '../auth/auth.service';

const memSubs: any[] = [
  {
    id: 'sub-demo-parent-pro',
    userId: 'parent-demo',
    plan: {
      code: 'pro',
      name: 'Pro Family (প্রো ফ্যামিলি)',
      priceBdt: 999,
      limits: PLANS.pro.limits,
    },
    status: 'active',
    childSlots: 5,
    currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
    payments: [
      {
        id: 'pay-demo-pro-1',
        amountBdt: 999,
        method: 'bkash',
        status: 'completed',
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ],
  },
];
const memPayments: any[] = [
  {
    id: 'pay-demo-pro-1',
    subscriptionId: 'sub-demo-parent-pro',
    userId: 'parent-demo',
    amount: 999,
    currency: 'BDT',
    invoiceNo: 'INV-2026-8801',
    status: 'succeeded',
    method: 'bkash',
    isDemo: true,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

export async function getPlans() {
  return [PLANS.free, PLANS.basic, PLANS.premium, PLANS.pro].map((p) => ({
    code: p.code,
    name: p.name,
    priceBdt: p.priceBDT,
    priceUsd: p.priceUSD,
    limitsJson: p.limits,
    features: p.features,
    active: true,
  }));
}

export async function getSubscription(userId: string) {
  // 1. In-memory check first to instantly reflect runtime upgrades/demo checkouts
  const existing = memSubs.find((s) => s.userId === userId);
  if (existing) return existing;

  // 2. Query Prisma database
  try {
    const sub = await prisma.subscription.findFirst({
      where: { userId },
      include: { plan: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
    if (sub) {
      // Map legacy 'trial' database records to standard freemium Free plan
      if (sub.plan?.code === 'trial') {
        return {
          ...sub,
          plan: {
            ...sub.plan,
            code: 'free',
            name: 'Free (ফ্রি)',
            limits: PLANS.free.limits,
          },
        };
      }
      return sub;
    }
  } catch {}

  // 3. Fallback default subscription
  const isDemoParent = userId === 'parent-demo' || userId === 'parent@demo.com';
  const defaultSub = isDemoParent
    ? {
        id: 'sub-demo-parent-pro',
        userId,
        plan: {
          code: 'pro',
          name: 'Pro Family (প্রো ফ্যামিলি)',
          priceBdt: 999,
          limits: PLANS.pro.limits,
        },
        status: 'active',
        childSlots: 5,
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      }
    : {
        id: 'sub-' + userId,
        userId,
        plan: {
          code: 'free',
          name: 'Free (ফ্রি)',
          priceBdt: 0,
          limits: PLANS.free.limits,
        },
        status: 'active',
        childSlots: 1,
        currentPeriodEnd: null,
      };
  memSubs.push(defaultSub);
  return defaultSub;
}

export async function demoCheckout(
  userId: string,
  input: { planCode: string; childCount: number; billingPeriod: 'monthly' | 'yearly'; simulateFailure?: boolean }
) {
  const plan = PLANS[input.planCode] || (PLANS as any)[input.planCode];
  if (!plan) throw notFound('Plan');
  const sub = (await getSubscription(userId)) as any;

  const result = await paymentProvider.createCheckout({
    userId,
    planCode: input.planCode,
    childCount: input.childCount,
    billingPeriod: input.billingPeriod,
    simulateFailure: input.simulateFailure,
  });
  if (result.status === 'failed') {
    throw badRequest('Payment failed (demo simulation) — try without simulateFailure');
  }

  // Clear trial state on in-memory user
  const memU = memUsers.find((u) => u.id === userId);
  if (memU) {
    memU.trialEndsAt = null;
  }

  const periodEnd = new Date(Date.now() + (input.billingPeriod === 'yearly' ? 365 : 30) * 86400000);

  try {
    // Clear trialEndsAt in DB user record
    await prisma.user.update({
      where: { id: userId },
      data: { trialEndsAt: null },
    }).catch(() => {});

    // Ensure plan exists in database; create if missing
    let planRec = await prisma.plan.findFirst({ where: { code: input.planCode } });
    if (!planRec) {
      planRec = await prisma.plan.create({
        data: {
          code: input.planCode,
          name: plan.name,
          priceBdt: plan.priceBDT,
          priceUsd: plan.priceUSD || 0,
          limitsJson: plan.limits,
          active: true,
        },
      }).catch(() => null);
    }

    if (!planRec) throw new Error('Plan table unavailable, fallback to mock');

    let subscription: any;
    if (sub.id && !sub.id.startsWith('sub-demo') && !sub.id.startsWith('sub-')) {
      subscription = await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          planId: planRec.id,
          status: 'active',
          childSlots: Math.max(input.childCount, plan.limits.maxChildren),
          currentPeriodEnd: periodEnd,
        },
        include: { plan: true },
      });
    } else {
      subscription = await prisma.subscription.create({
        data: {
          userId,
          planId: planRec.id,
          status: 'active',
          childSlots: Math.max(input.childCount, plan.limits.maxChildren),
          currentPeriodEnd: periodEnd,
        },
        include: { plan: true },
      });
    }

    const payment = await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        amount: result.amount,
        currency: result.currency,
        provider: 'demo',
        status: 'succeeded',
        isDemo: true,
        invoiceNo: result.invoiceNo,
      },
    });

    const subRecord = {
      ...subscription,
      plan: {
        code: input.planCode,
        name: plan.name,
        priceBdt: plan.priceBDT,
        limits: plan.limits,
      },
    };

    const existingIdx = memSubs.findIndex((s) => s.userId === userId);
    if (existingIdx >= 0) memSubs[existingIdx] = subRecord;
    else memSubs.push(subRecord);

    return { subscription: subRecord, payment, invoiceNo: result.invoiceNo, amount: result.amount, planCode: input.planCode };
  } catch {
    const subMock = {
      id: 'sub-' + Date.now(),
      userId,
      plan: {
        code: input.planCode,
        name: plan.name,
        priceBdt: plan.priceBDT,
        limits: plan.limits,
      },
      status: 'active',
      childSlots: Math.max(input.childCount, plan.limits.maxChildren),
      currentPeriodEnd: periodEnd.toISOString(),
    };
    const existingIdx = memSubs.findIndex((s) => s.userId === userId);
    if (existingIdx >= 0) memSubs[existingIdx] = subMock;
    else memSubs.push(subMock);

    const pay = {
      id: 'pay-' + Date.now(),
      subscriptionId: subMock.id,
      amount: result.amount,
      invoiceNo: result.invoiceNo,
      isDemo: true,
      status: 'succeeded',
    };
    memPayments.push(pay);
    return { subscription: subMock, payment: pay, invoiceNo: result.invoiceNo, amount: result.amount, planCode: input.planCode };
  }
}

export async function cancelSubscription(userId: string) {
  const sub = (await getSubscription(userId)) as any;
  try {
    await prisma.subscription.update({ where: { id: sub.id }, data: { cancelAtPeriodEnd: true } });
  } catch {
    sub.cancelAtPeriodEnd = true;
  }
  return { message: 'Subscription will cancel at period end' };
}

export async function getInvoices(userId: string) {
  try {
    return await prisma.payment.findMany({
      where: { subscription: { userId } },
      orderBy: { createdAt: 'desc' },
    });
  } catch {
    return memPayments.filter((p: any) => p.userId === userId || true);
  }
}
export const listInvoices = getInvoices;
