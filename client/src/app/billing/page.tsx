'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/components/auth/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { api } from '@/lib/api';
import {
  CreditCard,
  Check,
  Sparkles,
  ShieldCheck,
  Receipt,
  Download,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function BillingPage() {
  const { user } = useAuth();
  const { t, isBn } = useI18n();

  const [plans, setPlans] = useState<any[]>([]);
  const [sub, setSub] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  const [checkoutForm, setCheckoutForm] = useState({
    planCode: 'standard',
    childCount: 1,
    billingPeriod: 'monthly',
    method: 'bkash',
    walletNumber: '01700000000',
    simulateFailure: false,
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/billing/plans')
      .then((r) => setPlans(r.data.data))
      .catch(() =>
        setPlans([
          {
            code: 'starter',
            name: 'Starter',
            priceBdt: 149,
            limitsJson: {
              maxChildren: 2,
              aiQuizzesPerMonth: 10,
              historyMonths: 3,
            },
            features: [
              'Daily learning logs & routines',
              '10 AI quizzes per month',
              'Notes upload & OCR scanner',
              'Basic progress charts',
              '3-month study history',
            ],
          },
          {
            code: 'standard',
            name: 'Standard (Recommended)',
            priceBdt: 299,
            recommended: true,
            limitsJson: {
              maxChildren: 5,
              aiQuizzesPerMonth: 40,
              historyMonths: 12,
            },
            features: [
              '40 AI quizzes per month',
              'Full dashboards & mastery radar',
              'Plain language AI explanations',
              '12-month study history',
              'Multi-child switcher (up to 5)',
            ],
          },
          {
            code: 'premium',
            name: 'Premium',
            priceBdt: 499,
            limitsJson: {
              maxChildren: 10,
              aiQuizzesPerMonth: 120,
              historyMonths: null,
            },
            features: [
              '120 AI quizzes per month',
              'AI vision OCR fallback',
              'Weekly parent progress digest',
              'Unlimited study history',
              'Priority tutoring review',
            ],
          },
        ])
      );

    api
      .get('/billing/subscription')
      .then((r) => setSub(r.data.data))
      .catch(() =>
        setSub({
          status: 'trialing',
          planCode: 'trial',
          childSlots: 2,
          currentPeriodEnd: new Date(Date.now() + 12 * 86400000).toISOString(),
        })
      );

    api
      .get('/billing/invoices')
      .then((r) => setInvoices(r.data.data))
      .catch(() =>
        setInvoices([
          {
            id: 'inv-1',
            invoiceNo: 'INV-2026-001',
            amount: 299,
            currency: 'BDT',
            status: 'paid',
            isDemo: true,
            createdAt: new Date().toISOString(),
          },
        ])
      );
  }, []);

  const openCheckout = (planCode: string) => {
    setCheckoutForm({ ...checkoutForm, planCode });
    setError('');
    setMsg('');
    setCheckoutModalOpen(true);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');

    try {
      const res = await api.post('/billing/demo-checkout', {
        planCode: checkoutForm.planCode,
        childCount: checkoutForm.childCount,
        billingPeriod: checkoutForm.billingPeriod,
        simulateFailure: checkoutForm.simulateFailure,
      });

      const inv = res.data?.data;
      setMsg(
        isBn
          ? `পেমেন্ট সফল হয়েছে! ইনভয়েস নং: ${inv?.invoiceNo || 'INV-DEMO'}`
          : `Payment successful! Invoice: ${inv?.invoiceNo || 'INV-DEMO'}`
      );
      setCheckoutModalOpen(false);

      // Refresh sub & invoices
      const s = await api.get('/billing/subscription');
      setSub(s.data.data);
      const invList = await api.get('/billing/invoices');
      setInvoices(invList.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Payment simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  const trialEnds = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
  const trialDaysLeft = trialEnds
    ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 12;

  // Selected plan calculation
  const selectedPlan = plans.find((p) => p.code === checkoutForm.planCode) || plans[1] || { priceBdt: 299 };
  const baseRate = selectedPlan.priceBdt || 299;
  // Sibling discount: 2nd child 25% off, 3rd+ 35% off
  let totalBdt = baseRate;
  if (checkoutForm.childCount === 2) {
    totalBdt = baseRate + baseRate * 0.75;
  } else if (checkoutForm.childCount > 2) {
    totalBdt = baseRate + baseRate * 0.75 + (checkoutForm.childCount - 2) * (baseRate * 0.65);
  }
  if (checkoutForm.billingPeriod === 'yearly') {
    totalBdt = totalBdt * 10; // 10 months for 12 months
  }
  totalBdt = Math.round(totalBdt);

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="pb-2 border-b">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {t('billing.title', 'Subscription & Billing')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isBn
              ? 'ন্যায্য মূল্য নির্ধারণ ও ডেমো পেমেন্ট পোর্টাল (বিকাশ, নগদ, কার্ড)'
              : 'Honest pricing per child with 15-day free trial, sibling discounts, and demo gateway.'}
          </p>
        </div>

        {msg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
            <span>{msg}</span>
            <button onClick={() => setMsg('')} className="underline text-[11px]">
              Dismiss
            </button>
          </div>
        )}

        {/* Trial Status Card */}
        {sub?.status === 'trialing' && (
          <Card className="rounded-2xl border-amber-500/40 bg-amber-500/5 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-500 text-white font-bold text-xs">
                    {t('billing.trialBanner', '15-Day Free Trial')}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Full Standard features active
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {trialDaysLeft} {t('billing.trialDaysLeft', 'days remaining in trial')}
                </h3>
                <p className="text-xs text-muted-foreground max-w-lg">
                  {isBn
                    ? 'ট্রায়াল শেষ হলেও আপনার কোনো তথ্য বা নোট মুছে যাবে না। এআই কুইজ অব্যাহত রাখতে পছন্দসই প্ল্যানটি বেছে নিন।'
                    : 'Your study logs and notes are never deleted after trial. Upgrade anytime to keep unlimited AI quizzes.'}
                </p>
              </div>

              <Button
                onClick={() => openCheckout('standard')}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl h-10 px-6 shrink-0 shadow-md shadow-amber-500/20"
              >
                {isBn ? 'স্ট্যান্ডার্ড প্ল্যানে আপগ্রেড করুন' : 'Upgrade to Standard Plan'}
              </Button>
            </div>
          </Card>
        )}

        {/* Pricing Plans Grid */}
        <div className="space-y-3">
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-bold text-foreground">
              {t('billing.plans', 'Subscription Plans')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isBn
                ? '২য় সন্তানের ক্ষেত্রে ২৫% ছাড়, ৩য় বা ততোধিকের ক্ষেত্রে ৩৫% ছাড়। বাৎসরিক: ১০ মাসের খরচে ১২ মাস!'
                : 'Sibling discount: 25% off 2nd child, 35% off 3rd+. Annual: pay for 10 months, get 12.'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-2">
            {plans.map((p) => {
              const isRecommended = p.code === 'standard' || p.recommended;
              return (
                <Card
                  key={p.code}
                  className={`rounded-2xl border transition-all flex flex-col justify-between ${
                    isRecommended
                      ? 'border-indigo-600 ring-2 ring-indigo-600/20 shadow-lg scale-[1.02] bg-card'
                      : 'bg-card/70 hover:shadow-md'
                  }`}
                >
                  <CardHeader className="p-6 pb-4">
                    {isRecommended && (
                      <Badge className="w-fit mb-2 bg-indigo-600 text-white text-[10px] font-bold">
                        Most Popular
                      </Badge>
                    )}
                    <CardTitle className="text-xl font-black text-foreground">{p.name}</CardTitle>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-black text-foreground">৳{p.priceBdt}</span>
                      <span className="text-xs text-muted-foreground">/ child / month</span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 pt-0 space-y-5">
                    <ul className="space-y-2.5 text-xs">
                      {(p.features || [
                        `${p.limitsJson?.aiQuizzesPerMonth} AI quizzes/mo`,
                        `Up to ${p.limitsJson?.maxChildren} children`,
                        p.limitsJson?.historyMonths ? `${p.limitsJson.historyMonths}mo history` : 'Unlimited history',
                      ]).map((f: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-foreground font-medium">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => openCheckout(p.code)}
                      variant={isRecommended ? 'default' : 'outline'}
                      className={`w-full h-10 text-xs font-bold rounded-xl ${
                        isRecommended ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' : ''
                      }`}
                    >
                      {sub?.planCode === p.code ? 'Current Plan' : `Choose ${p.name}`}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Invoices List */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              <span>{t('billing.invoices', 'Invoices & Receipts')}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              All demo and live payment transactions
            </CardDescription>
          </CardHeader>

          <CardContent>
            {invoices.length > 0 ? (
              <div className="space-y-2">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-xl border bg-muted/20 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{inv.invoiceNo}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {inv.isDemo ? 'Demo Payment' : 'Paid'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(inv.createdAt).toLocaleDateString()} • {inv.currency}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-extrabold text-foreground text-sm">৳{inv.amount}</span>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Download">
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">No invoices yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Demo Checkout Modal */}
      <Modal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title={t('billing.demoCheckout', 'Complete Subscription (Demo)')}
        description="Simulated checkout with bKash, Nagad or Card. No real money will be charged."
      >
        <form onSubmit={handleCheckout} className="space-y-4 pt-1">
          {/* Plan & Child count */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Selected Plan</Label>
              <select
                value={checkoutForm.planCode}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, planCode: e.target.value })}
                className="w-full h-10 border rounded-xl px-3 bg-background text-sm mt-1"
              >
                <option value="starter">Starter (৳149)</option>
                <option value="standard">Standard (৳299)</option>
                <option value="premium">Premium (৳499)</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Number of Children</Label>
              <select
                value={checkoutForm.childCount}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, childCount: parseInt(e.target.value) || 1 })}
                className="w-full h-10 border rounded-xl px-3 bg-background text-sm mt-1"
              >
                <option value={1}>1 Child</option>
                <option value={2}>2 Children (25% off 2nd)</option>
                <option value={3}>3 Children (35% off 3rd)</option>
              </select>
            </div>
          </div>

          {/* Billing Cycle */}
          <div>
            <Label className="text-xs font-semibold block mb-1">Billing Period</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCheckoutForm({ ...checkoutForm, billingPeriod: 'monthly' })}
                className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  checkoutForm.billingPeriod === 'monthly'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'bg-muted/20 text-muted-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setCheckoutForm({ ...checkoutForm, billingPeriod: 'yearly' })}
                className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  checkoutForm.billingPeriod === 'yearly'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'bg-muted/20 text-muted-foreground'
                }`}
              >
                Yearly (Pay 10, Get 12)
              </button>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <Label className="text-xs font-semibold block mb-1">Payment Method (Demo)</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'bkash', label: '🟢 bKash' },
                { id: 'nagad', label: '🟠 Nagad' },
                { id: 'card', label: '💳 Card' },
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setCheckoutForm({ ...checkoutForm, method: m.id })}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    checkoutForm.method === m.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'bg-muted/20 text-muted-foreground'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fake wallet number */}
          <div>
            <Label className="text-xs font-semibold">
              {checkoutForm.method === 'card' ? 'Card Number (Demo)' : 'Wallet Number (Demo)'}
            </Label>
            <Input
              value={checkoutForm.walletNumber}
              onChange={(e) => setCheckoutForm({ ...checkoutForm, walletNumber: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* Total calculation banner */}
          <div className="p-3.5 rounded-xl bg-muted/40 border flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground">Total Payable Amount:</span>
            <span className="text-base font-black text-foreground">৳{totalBdt}</span>
          </div>

          {error && <p className="text-xs text-destructive font-medium">{error}</p>}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => setCheckoutModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              {loading ? 'Processing...' : `Confirm Demo Payment (৳${totalBdt})`}
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
