export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'canceled';
export interface CheckoutInput { userId: string; planCode: string; childCount: number; billingPeriod: 'monthly' | 'yearly'; simulateFailure?: boolean; }
export interface CheckoutResult { paymentId: string; status: PaymentStatus; invoiceNo: string; amount: number; currency: string; }

export interface PaymentProvider {
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  confirm(paymentId: string): Promise<CheckoutResult>;
  cancel(paymentId: string): Promise<void>;
  webhook(payload: any): Promise<void>;
}

class DemoProvider implements PaymentProvider {
  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const amountMap: Record<string, number> = { starter: 149, standard: 299, premium: 499, trial: 0 };
    const amount = (amountMap[input.planCode] || 299) * input.childCount * (input.billingPeriod === 'yearly' ? 10 : 1);
    if (input.simulateFailure) return { paymentId: `demo-fail-${Date.now()}`, status: 'failed', invoiceNo: `INV-FAIL-${Date.now()}`, amount, currency: 'BDT' };
    return { paymentId: `demo-${Date.now()}`, status: 'succeeded', invoiceNo: `INV-${Date.now()}`, amount, currency: 'BDT' };
  }
  async confirm(paymentId: string): Promise<CheckoutResult> { return { paymentId, status: 'succeeded', invoiceNo: `INV-${Date.now()}`, amount: 299, currency: 'BDT' }; }
  async cancel(paymentId: string) { console.log('Demo cancel', paymentId); }
  async webhook(payload: any) { console.log('Demo webhook', payload); }
}

export const paymentProvider: PaymentProvider = new DemoProvider();
