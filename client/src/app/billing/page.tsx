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
  Zap,
} from 'lucide-react';

export default function BillingPage() {
  const { user } = useAuth();
  const { t, isBn } = useI18n();

  const [plans, setPlans] = useState<any[]>([]);
  const [sub, setSub] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  const [checkoutForm, setCheckoutForm] = useState({
    planCode: 'premium',
    childCount: 1,
    billingPeriod: 'monthly',
    method: 'bkash',
    walletNumber: '01700000000',
    simulateFailure: false,
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const defaultPlans = [
    {
      code: 'free',
      name: isBn ? 'ফ্রি (Free)' : 'Free',
      priceBdt: 0,
      limitsJson: {
        maxChildren: 1,
        aiQuizzesPerMonth: 2,
        historyMonths: 1,
        autoQuizScheduling: false,
      },
      features: isBn
        ? [
            '১ জন শিক্ষার্থীর প্রোফাইল',
            'প্রতি মাসে ২টি এআই কুইজ (চিরকাল ফ্রি)',
            'দৈনিক পড়ার রুটিন ও ম্যানুয়াল লগিং',
            'বেসিক স্কোর ট্র্যাকিং ও ১ মাসের ইতিহাস',
          ]
        : [
            '1 Child profile slot',
            '2 AI quizzes per month (Always Free)',
            'Daily routine & manual study logging',
            'Basic score tracking & 1-month history',
          ],
    },
    {
      code: 'basic',
      name: isBn ? 'বেসিক (Basic)' : 'Basic',
      priceBdt: 249,
      limitsJson: {
        maxChildren: 1,
        aiQuizzesPerMonth: 10,
        historyMonths: 6,
        autoQuizScheduling: false,
      },
      features: isBn
        ? [
            '১ জন শিক্ষার্থীর প্রোফাইল',
            'প্রতি মাসে ১০টি এআই কুইজ',
            'ভয়েস লগ ও ক্লদ এআই স্ট্রাকচার্ড সামারি',
            'খাতার নোট ও হস্তলিপি স্ক্যানার (OCR)',
            'অধ্যায়ভিত্তিক দুর্বলতা বনাম নির্ভুলতা গ্রাফ',
            '৬ মাসের পূর্ণ স্টাডি হিস্ট্রি',
          ]
        : [
            '1 Child profile slot',
            '10 AI quizzes per month',
            'Voice Logging with Claude AI preview',
            'Class Notes & handwritten OCR scanner',
            'Weak vs strong topic insights',
            '6-month study history',
          ],
    },
    {
      code: 'premium',
      name: isBn ? 'প্রিমিয়াম (Premium)' : 'Premium',
      priceBdt: 599,
      recommended: true,
      limitsJson: {
        maxChildren: 2,
        aiQuizzesPerMonth: 50,
        historyMonths: null,
        autoQuizScheduling: true,
      },
      features: isBn
        ? [
            '২ জন শিক্ষার্থীর প্রোফাইল (2 Children Slots)',
            'প্রতি মাসে ৫০টি এআই কুইজ',
            '⭐ স্বয়ংক্রিয় কুইজ সেটআপ সিস্টেম (Auto Quiz Setup)',
            'গতকালকের পাঠে ১-দিন স্পেসড রিপিটেশন কুইজ',
            'এআই ডাইনামিক সময় (গণিতে বেশি, তাত্ত্বিকে টাইট)',
            'দুর্বল অধ্যায়ে অ্যাডাপটিভ এআই রিকভারি',
            'সীমাহীন ইতিহাস ও প্রায়োরিটি এআই প্রসেসিং',
          ]
        : [
            '2 Children profile slots',
            '50 AI quizzes per month',
            '⭐ Automatic Quiz Setup System',
            'Spaced repetition: Auto quizzes on 1-day-old topics',
            'AI Dynamic Smart Timing (Math vs Theory)',
            'Adaptive topic understanding & recovery',
            'Unlimited history & priority AI processing',
          ],
    },
    {
      code: 'pro',
      name: isBn ? 'প্রো ফ্যামিলি (Pro)' : 'Pro Family',
      priceBdt: 999,
      limitsJson: {
        maxChildren: 5,
        aiQuizzesPerMonth: 150,
        historyMonths: null,
        autoQuizScheduling: true,
      },
      features: isBn
        ? [
            '৫ জন পর্যন্ত শিক্ষার্থী (পুরো পরিবারের জন্য)',
            'প্রতি মাসে ১৫০টি এআই কুইজ',
            'সকল সন্তানের জন্য স্বয়ংক্রিয় কুইজ শিডিউলিং',
            'হোয়াটসঅ্যাপ ও এসএমএস ডেইলি স্টাডি অ্যালার্ট',
            'মাসিক অ্যাকাডেমিক অডিট রিপোর্ট (PDF ডাউনলোড)',
            'স্কুল পরীক্ষার সিলেবাস ইন্টিগ্রেশন ও ২৪/৭ সাপোর্ট',
          ]
        : [
            'Up to 5 Children profile slots',
            '150 AI quizzes per month',
            'Automatic Quiz Setup for all siblings',
            'WhatsApp & SMS study alerts & daily summaries',
            'Monthly academic audit report (PDF export)',
            'School exam syllabus integration & 24/7 support',
          ],
    },
  ];

  useEffect(() => {
    api
      .get('/billing/plans')
      .then((r) => {
        if (r.data?.data && Array.isArray(r.data.data) && r.data.data.length >= 3) {
          setPlans(r.data.data);
        } else {
          setPlans(defaultPlans);
        }
      })
      .catch(() => setPlans(defaultPlans));

    api
      .get('/billing/subscription')
      .then((r) => setSub(r.data.data))
      .catch(() =>
        setSub({
          status: 'active',
          planCode: 'free',
          childSlots: 1,
          currentPeriodEnd: null,
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
            amount: 599,
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
          ? `পেমেন্ট সফল হয়েছে! প্ল্যান আপডেট সম্পন্ন। ইনভয়েস নং: ${inv?.invoiceNo || 'INV-DEMO'}`
          : `Payment successful! Plan updated. Invoice: ${inv?.invoiceNo || 'INV-DEMO'}`
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

  // Selected plan calculation
  const effectivePlans = plans.length > 0 ? plans : defaultPlans;
  const selectedPlan = effectivePlans.find((p) => p.code === checkoutForm.planCode) || effectivePlans[2] || { priceBdt: 599 };
  const baseRate = selectedPlan.priceBdt || 0;

  // Sibling discount: 2nd child 25% off, 3rd+ 35% off
  let totalBdt = baseRate;
  if (baseRate > 0) {
    if (checkoutForm.childCount === 2) {
      totalBdt = baseRate + baseRate * 0.75;
    } else if (checkoutForm.childCount > 2) {
      totalBdt = baseRate + baseRate * 0.75 + (checkoutForm.childCount - 2) * (baseRate * 0.65);
    }
    if (checkoutForm.billingPeriod === 'yearly') {
      totalBdt = totalBdt * 10; // 10 months for 12 months
    }
  } else {
    totalBdt = 0;
  }
  totalBdt = Math.round(totalBdt);

  const currentPlanCode = sub?.plan?.code || sub?.planCode || 'free';

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="pb-2 border-b">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {t('billing.title', 'Subscription & Billing')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isBn
              ? 'ফ্রিমিয়াম মডেল: চিরকাল ফ্রি প্ল্যান সহ ৩য় প্যাকেজে স্বয়ংক্রিয় এআই কুইজ শিডিউলিং'
              : 'Freemium model: Always Free tier with Automatic Quiz Setup System available in Premium'}
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

        {/* Current Subscription Status Card */}
        <Card
          className={`rounded-2xl p-5 sm:p-6 shadow-sm border ${
            currentPlanCode === 'premium' || currentPlanCode === 'pro'
              ? 'border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-primary/5 to-transparent'
              : currentPlanCode === 'basic'
              ? 'border-sky-500/30 bg-sky-500/5'
              : 'border-emerald-500/30 bg-emerald-500/5'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge
                  className={`font-bold text-xs ${
                    currentPlanCode === 'pro'
                      ? 'bg-purple-600 text-white'
                      : currentPlanCode === 'premium'
                      ? 'bg-indigo-600 text-white'
                      : currentPlanCode === 'basic'
                      ? 'bg-sky-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {currentPlanCode === 'pro'
                    ? (isBn ? 'প্রো ফ্যামিলি প্ল্যান' : 'Pro Family Plan')
                    : currentPlanCode === 'premium'
                    ? (isBn ? 'প্রিমিয়াম প্ল্যান' : 'Premium Plan')
                    : currentPlanCode === 'basic'
                    ? (isBn ? 'বেসিক প্ল্যান' : 'Basic Plan')
                    : (isBn ? 'চিরকাল ফ্রি প্ল্যান' : 'Always Free Plan')}
                </Badge>
                <span className="text-xs text-muted-foreground font-medium">
                  {currentPlanCode === 'premium' || currentPlanCode === 'pro'
                    ? (isBn ? '⭐ স্বয়ংক্রিয় কুইজ সেটআপ সক্রিয়' : '⭐ Automatic Quiz Setup Active')
                    : (isBn ? 'সীমাহীন মেয়াদ • প্রতি মাসে ২টি কুইজ' : 'Lifetime Free • 2 AI Quizzes/mo')}
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {currentPlanCode === 'free'
                  ? (isBn ? 'বিনামূল্যে ব্যবহার করছেন (Free Tier)' : 'Free Tier Active (Forever Free)')
                  : `${sub?.plan?.name || currentPlanCode.toUpperCase()} (${isBn ? 'সক্রিয়' : 'Active'})`}
              </h3>
              <p className="text-xs text-muted-foreground max-w-xl">
                {isBn
                  ? 'আপনার কোনো স্টাডি লগ বা খাতার নোট কখনো মুছে যাবে না। ৩য় প্যাকেজ (প্রিমিয়াম)-এ রয়েছে স্বয়ংক্রিয় কুইজ সেটআপ ও স্পেসড রিপিটেশন।'
                  : 'Your learning logs and notes are never deleted. Package 3 (Premium) unlocks the Automatic Quiz Setup System and 50 AI quizzes per month.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {currentPlanCode !== 'premium' && currentPlanCode !== 'pro' ? (
                <Button
                  onClick={() => openCheckout('premium')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl h-10 px-5 shadow-md shadow-indigo-600/20 gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isBn ? 'প্রিমিয়ামে আপগ্রেড (অটো কুইজ)' : 'Upgrade to Premium (Auto Quiz)'}</span>
                </Button>
              ) : (
                <Button
                  onClick={() => openCheckout('pro')}
                  variant="outline"
                  className="text-xs font-bold rounded-xl h-10 px-4"
                >
                  <span>{isBn ? 'প্ল্যান পরিবর্তন করুন' : 'Change Plan'}</span>
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Pricing Plans 4-Column Grid */}
        <div className="space-y-3">
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-bold text-foreground">
              {t('billing.plans', 'Subscription Plans')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isBn
                ? '১টি ফ্রি ও ৩টি পেইড প্যাকেজ। ৩য় প্যাকেজে রয়েছে সম্পূর্ণ স্বয়ংক্রিয় কুইজ সেটআপ। বাৎসরিক: ১০ মাসের খরচে ১২ মাস!'
                : '1 Free & 3 Paid Packages. Package 3 includes Automatic Quiz Setup System. Annual: pay 10 months, get 12!'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {effectivePlans.map((p) => {
              const isRecommended = p.code === 'premium' || p.recommended;
              const isCurrent = currentPlanCode === p.code;

              return (
                <Card
                  key={p.code}
                  className={`rounded-2xl border transition-all flex flex-col justify-between ${
                    isRecommended
                      ? 'border-indigo-600 ring-2 ring-indigo-600/20 shadow-lg scale-[1.02] bg-card relative'
                      : isCurrent
                      ? 'border-emerald-500/50 bg-card shadow-sm'
                      : 'bg-card/70 hover:shadow-md'
                  }`}
                >
                  <CardHeader className="p-5 pb-3">
                    {isRecommended && (
                      <Badge className="w-fit mb-2 bg-indigo-600 text-white text-[10px] font-bold">
                        {isBn ? 'সবচেয়ে জনপ্রিয়' : 'Most Popular'}
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge className="w-fit mb-2 bg-emerald-600 text-white text-[10px] font-bold">
                        {isBn ? 'বর্তমান প্ল্যান' : 'Current Plan'}
                      </Badge>
                    )}
                    <CardTitle className="text-lg font-black text-foreground">{p.name}</CardTitle>
                    <div className="flex items-baseline gap-1 mt-1.5">
                      <span className="text-3xl font-black text-foreground">৳{p.priceBdt}</span>
                      <span className="text-xs text-muted-foreground">
                        {p.priceBdt === 0
                          ? (isBn ? '/ চিরকাল' : '/ forever')
                          : (isBn ? '/ মাস' : '/ month')}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-4">
                    <ul className="space-y-2 text-xs">
                      {(p.features || [
                        `${p.limitsJson?.aiQuizzesPerMonth} AI quizzes/mo`,
                        `Up to ${p.limitsJson?.maxChildren} children`,
                        p.limitsJson?.historyMonths ? `${p.limitsJson.historyMonths}mo history` : 'Unlimited history',
                      ]).map((f: string, idx: number) => {
                        const isAutoQuizFeature = f.includes('স্বয়ংক্রিয়') || f.includes('Automatic') || f.includes('Auto');
                        return (
                          <li key={idx} className="flex items-start gap-2">
                            <Check
                              className={`w-4 h-4 shrink-0 mt-0.5 ${
                                isAutoQuizFeature ? 'text-indigo-600 font-bold' : 'text-emerald-500'
                              }`}
                            />
                            <span
                              className={`leading-relaxed ${
                                isAutoQuizFeature
                                  ? 'font-bold text-indigo-700 dark:text-indigo-300'
                                  : 'text-foreground font-medium'
                              }`}
                            >
                              {f}
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    <Button
                      onClick={() => openCheckout(p.code)}
                      disabled={isCurrent}
                      variant={isRecommended ? 'default' : isCurrent ? 'secondary' : 'outline'}
                      className={`w-full h-10 text-xs font-bold rounded-xl ${
                        isRecommended && !isCurrent
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                          : ''
                      }`}
                    >
                      {isCurrent
                        ? (isBn ? 'বর্তমান প্ল্যান' : 'Active Plan')
                        : p.code === 'free'
                        ? (isBn ? 'ফ্রি প্ল্যানে থাকুন' : 'Stay on Free')
                        : `${p.name} ${isBn ? 'বেছে নিন' : 'Select'}`}
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
              {isBn ? 'পেমেন্ট ট্রানজ্যাকশন হিস্ট্রি ও রিসিপ্ট' : 'All demo and live payment transactions'}
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
              <p className="text-xs text-muted-foreground py-4 text-center">
                {isBn ? 'কোনো পূর্ববর্তী ইনভয়েস নেই।' : 'No invoices yet.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Demo Checkout Modal */}
      <Modal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title={t('billing.demoCheckout', 'Complete Subscription (Demo)')}
        description={
          isBn
            ? 'বিকাশ, নগদ বা কার্ড দিয়ে ডেমো পেমেন্ট টেস্ট করুন। কোনো আসল টাকা কাটা হবে না।'
            : 'Simulated checkout with bKash, Nagad or Card. No real money will be charged.'
        }
      >
        <form onSubmit={handleCheckout} className="space-y-4 pt-1">
          {/* Plan & Child count */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">{isBn ? 'নির্বাচিত প্ল্যান' : 'Selected Plan'}</Label>
              <select
                value={checkoutForm.planCode}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, planCode: e.target.value })}
                className="w-full h-10 border rounded-xl px-3 bg-background text-xs font-semibold mt-1"
              >
                <option value="free">Free Forever (৳0 - 1 Child, 2 Quizzes/mo)</option>
                <option value="basic">Basic (৳249 - 1 Child, 10 Quizzes/mo)</option>
                <option value="premium">Premium (৳599 - 2 Children, 50 Quizzes + Auto Quiz)</option>
                <option value="pro">Pro Family (৳999 - Up to 5 Children, 150 Quizzes + Auto Quiz)</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold">{isBn ? 'সন্তানের সংখ্যা' : 'Number of Children'}</Label>
              <select
                value={checkoutForm.childCount}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, childCount: parseInt(e.target.value) || 1 })}
                className="w-full h-10 border rounded-xl px-3 bg-background text-xs font-semibold mt-1"
              >
                <option value={1}>1 Child</option>
                <option value={2}>2 Children (25% off 2nd)</option>
                <option value={3}>3 Children (35% off 3rd)</option>
                <option value={4}>4 Children</option>
                <option value={5}>5 Children</option>
              </select>
            </div>
          </div>

          {/* Billing Cycle */}
          <div>
            <Label className="text-xs font-semibold block mb-1">
              {isBn ? 'বিলিং সাইকেল' : 'Billing Period'}
            </Label>
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
                {isBn ? 'মাসিক' : 'Monthly'}
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
                {isBn ? 'বাৎসরিক (১০ মাসের খরচে ১২ মাস)' : 'Yearly (Pay 10, Get 12)'}
              </button>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <Label className="text-xs font-semibold block mb-1">
              {isBn ? 'পেমেন্ট মাধ্যম (ডেমো)' : 'Payment Method (Demo)'}
            </Label>
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

          {/* Wallet / card number */}
          <div>
            <Label className="text-xs font-semibold">
              {checkoutForm.method === 'card'
                ? (isBn ? 'কার্ড নম্বর (ডেমো)' : 'Card Number (Demo)')
                : (isBn ? 'মোবাইল ওয়ালেট নম্বর (ডেমো)' : 'Wallet Number (Demo)')}
            </Label>
            <Input
              value={checkoutForm.walletNumber}
              onChange={(e) => setCheckoutForm({ ...checkoutForm, walletNumber: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* Total calculation banner */}
          <div className="p-3.5 rounded-xl bg-muted/40 border flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground">
              {isBn ? 'মোট পরিশোধযোগ্য পরিমাণ:' : 'Total Payable Amount:'}
            </span>
            <span className="text-base font-black text-foreground">৳{totalBdt}</span>
          </div>

          {error && <p className="text-xs text-destructive font-medium">{error}</p>}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => setCheckoutModalOpen(false)}>
              {isBn ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              {loading
                ? isBn ? 'প্রক্রিয়াধীন...' : 'Processing...'
                : isBn ? `পেমেন্ট নিশ্চিত করুন (৳${totalBdt})` : `Confirm Demo Payment (৳${totalBdt})`}
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
