export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'canceled';
export interface CheckoutInput {
  userId: string;
  planCode: string;
  childCount: number;
  billingPeriod: 'monthly' | 'yearly';
  simulateFailure?: boolean;
}
export interface CheckoutResult {
  paymentId: string;
  status: PaymentStatus;
  invoiceNo: string;
  amount: number;
  currency: string;
}

export interface PaymentProvider {
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  confirm(paymentId: string): Promise<CheckoutResult>;
  cancel(paymentId: string): Promise<void>;
  webhook(payload: any): Promise<void>;
}

export interface PlanTierPricing {
  basePrice: number;
  includedChildren: number;
  extraChildPrice: number;
}

export const PLAN_TIER_CONFIG: Record<string, PlanTierPricing> = {
  free: { basePrice: 0, includedChildren: 1, extraChildPrice: 0 },
  basic: { basePrice: 249, includedChildren: 1, extraChildPrice: 180 },
  starter: { basePrice: 249, includedChildren: 1, extraChildPrice: 180 },
  premium: { basePrice: 599, includedChildren: 2, extraChildPrice: 199 },
  standard: { basePrice: 599, includedChildren: 2, extraChildPrice: 199 },
  pro: { basePrice: 999, includedChildren: 5, extraChildPrice: 150 },
  trial: { basePrice: 0, includedChildren: 2, extraChildPrice: 0 },
};

export function calculateSubscriptionAmount(
  planCode: string,
  childCount: number,
  billingPeriod: 'monthly' | 'yearly'
): number {
  const cfg = PLAN_TIER_CONFIG[planCode] || PLAN_TIER_CONFIG.basic;
  let monthly = cfg.basePrice;

  // Charge extra only if childCount exceeds the plan's included children count
  if (childCount > cfg.includedChildren && cfg.basePrice > 0) {
    const extra = childCount - cfg.includedChildren;
    monthly += extra * cfg.extraChildPrice;
  }

  // Yearly: 10 months fee for 12 months (2 months free discount)
  const total = billingPeriod === 'yearly' ? monthly * 10 : monthly;
  return Math.round(total);
}

class DemoProvider implements PaymentProvider {
  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const amount = calculateSubscriptionAmount(input.planCode, input.childCount, input.billingPeriod);
    if (input.simulateFailure) {
      return {
        paymentId: `demo-fail-${Date.now()}`,
        status: 'failed',
        invoiceNo: `INV-FAIL-${Date.now()}`,
        amount,
        currency: 'BDT',
      };
    }
    return {
      paymentId: `demo-${Date.now()}`,
      status: 'succeeded',
      invoiceNo: `INV-${Date.now()}`,
      amount,
      currency: 'BDT',
    };
  }
  async confirm(paymentId: string): Promise<CheckoutResult> {
    return { paymentId, status: 'succeeded', invoiceNo: `INV-${Date.now()}`, amount: 599, currency: 'BDT' };
  }
  async cancel(paymentId: string) {
    console.log('Demo cancel', paymentId);
  }
  async webhook(payload: any) {
    console.log('Demo webhook', payload);
  }
}

export const paymentProvider: PaymentProvider = new DemoProvider();
