import { prisma } from '../../db/client';
import { paymentProvider } from '../../services/payments';
import { PLANS, resolvePlan, isSellablePlan } from '../../services/entitlements';
import { notFound, badRequest } from '../../utils/errors';
import { store, DEMO_PARENT_ID } from '../../core/store';
import type { Actor } from '../../core/tenancy';

/**
 * Subscriptions and payments.
 *
 * Two bugs lived here:
 *
 *  1. `getInvoices` filtered with `p.userId === userId || true` — the `|| true` made the
 *     filter a no-op, so **every tenant's invoices** were returned to anyone who asked.
 *  2. `getSubscription` handed the seeded demo parent a free Pro plan because the id was
 *     matched by the hardcoded strings `'parent-demo'` / `'parent@demo.com'`. The demo
 *     tenant is now a normal account with a real id, so the plan comes from a real seeded
 *     subscription instead of an id check.
 */

/** In-memory subscriptions, scoped by their owner's user id. */
const memSubs: any[] = [
  {
    id: 'sub-demo-parent-pro',
    userId: DEMO_PARENT_ID,
    plan: {
      code: 'pro',
      name: 'Pro Family (প্রো ফ্যামিলি)',
      priceBdt: 999,
      limits: PLANS.pro.limits,
      tier: 'pro',
      legacy: false,
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
export async function getSubscription(actor: Actor) {
  const userId = actor.ownerId;

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
      // The plan's identity and its limits are resolved together, so the two can
      // never disagree.
      //
      // A legacy plan code ('trial', 'starter', 'standard') keeps its own code and
      // name — the subscriber should still see the plan they bought — but carries
      // the limits of the current plan that covers what they sold.
      //
      // It used to be rewritten to `free`, which silently downgraded a paying
      // subscriber: `standard` was sold at five children and came back as one.
      const resolved = resolvePlan(sub.plan?.code || 'free');
      return {
        ...sub,
        plan: {
          ...sub.plan,
          name: resolved.name,
          limits: resolved.limits,
          tier: resolved.tier,
          legacy: resolved.legacy,
        },
      };
    }
  } catch {}

  // 3. Fallback default subscription — everyone starts on the free plan. There is no
  //    id-based exception for any particular account.
  const defaultSub = {
    id: 'sub-' + userId,
    userId,
    plan: {
      code: 'free',
      name: 'Free (ফ্রি)',
      priceBdt: 0,
      limits: PLANS.free.limits,
      tier: 'free',
      legacy: false,
    },
    status: 'active',
    childSlots: 1,
    currentPeriodEnd: null,
  };
  memSubs.push(defaultSub);
  return defaultSub;
}

export async function demoCheckout(
  actor: Actor,
  input: { planCode: string; childCount: number; billingPeriod: 'monthly' | 'yearly'; simulateFailure?: boolean }
) {
  const userId = actor.ownerId;
  // Only the catalogue plans may be bought. The legacy codes ('trial', 'starter',
  // 'standard') are held by existing subscribers but must not be purchasable:
  // `standard` at ৳299 grants five children while `premium` at ৳599 grants two, so
  // selling it would undercut the flagship plan.
  if (!isSellablePlan(input.planCode)) throw badRequest(`Plan "${input.planCode}" is not available for purchase.`);
  const plan = PLANS[input.planCode];
  if (!plan) throw notFound('Plan');
  const sub = (await getSubscription(actor)) as any;

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
  const memU = store.users.byId(userId);
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

    store.payments.add({
      id: payment.id,
      ownerId: userId,
      userId,
      subscriptionId: subscription.id,
      amount: result.amount,
      invoiceNo: result.invoiceNo,
      status: 'succeeded',
      isDemo: true,
      createdAt: new Date().toISOString(),
    } as any);

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
      userId,
      amount: result.amount,
      invoiceNo: result.invoiceNo,
      isDemo: true,
      status: 'succeeded',
      createdAt: new Date().toISOString(),
    };
    store.payments.add(pay as any);
    return { subscription: subMock, payment: pay, invoiceNo: result.invoiceNo, amount: result.amount, planCode: input.planCode };
  }
}

export async function cancelSubscription(actor: Actor) {
  const sub = (await getSubscription(actor)) as any;
  try {
    await prisma.subscription.update({ where: { id: sub.id }, data: { cancelAtPeriodEnd: true } });
  } catch {
    sub.cancelAtPeriodEnd = true;
  }
  return { message: 'Subscription will cancel at period end' };
}

export async function getInvoices(actor: Actor) {
  const userId = actor.ownerId;
  try {
    return await prisma.payment.findMany({
      where: { subscription: { userId } },
      orderBy: { createdAt: 'desc' },
    });
  } catch {
    // Scoped to this account. The old `p.userId === userId || true` returned every tenant's
    // invoices to anyone who asked.
    return store.payments.forOwner(userId);
  }
}
export const listInvoices = getInvoices;
