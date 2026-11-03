import { prisma } from '../../db/client';
import { paymentProvider } from '../../services/payments';
import { PLANS } from '../../services/entitlements';
import { notFound, badRequest } from '../../utils/errors';

const memSubs: any[] = [];
const memPayments: any[] = [];

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
  try {
    const sub = await prisma.subscription.findFirst({
      where: { userId },
      include: { plan: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
    if (sub) return sub;
  } catch {}

  // In demo or fallback, return active Premium tier so parents can freely use and test Auto Quiz Scheduling
  const existing = memSubs.find((s) => s.userId === userId);
  if (existing) return existing;

  const defaultSub = {
    id: 'sub-demo-parent',
    userId,
    plan: {
      code: 'premium',
      name: 'Premium (প্রিমিয়াম)',
      priceBdt: 599,
      limits: PLANS.premium.limits,
    },
    status: 'active',
    childSlots: 2,
    currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
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

  try {
    const planRec = await prisma.plan.findUnique({ where: { code: input.planCode } });
    const periodEnd = new Date(Date.now() + (input.billingPeriod === 'yearly' ? 365 : 30) * 86400000);
    let subscription: any;
    if (sub.id && !sub.id.startsWith('sub-demo')) {
      subscription = await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          planId: planRec!.id,
          status: 'active',
          childSlots: Math.max(input.childCount, plan.limits.maxChildren),
          currentPeriodEnd: periodEnd,
        },
      });
    } else {
      subscription = await prisma.subscription.create({
        data: {
          userId,
          planId: planRec?.id || 'plan-demo',
          status: 'active',
          childSlots: Math.max(input.childCount, plan.limits.maxChildren),
          currentPeriodEnd: periodEnd,
        },
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
    return { subscription, payment, invoiceNo: result.invoiceNo, amount: result.amount };
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
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
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
    return { subscription: subMock, payment: pay, invoiceNo: result.invoiceNo, amount: result.amount };
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
