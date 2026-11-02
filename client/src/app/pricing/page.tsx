'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { useI18n } from '@/lib/i18n-context';
import { Check, Sparkles, ArrowRight } from 'lucide-react';

const plans = [
  {
    code: 'starter',
    name: 'Starter',
    price: '৳149',
    per: '/ child / mo',
    features: [
      'Daily learning logs & routines',
      '10 AI quizzes per month',
      'Class notes upload & OCR scanner',
      'Basic progress charts',
      '3-month study history',
    ],
  },
  {
    code: 'standard',
    name: 'Standard',
    price: '৳299',
    per: '/ child / mo',
    recommended: true,
    features: [
      '40 AI quizzes per month',
      'Full dashboards & mastery radar',
      'Plain language AI explanations',
      '12-month study history',
      'Multi-child switcher (up to 5)',
      'Timezone Asia/Dhaka schedule',
    ],
  },
  {
    code: 'premium',
    name: 'Premium',
    price: '৳499',
    per: '/ child / mo',
    features: [
      '120 AI quizzes per month',
      'AI vision OCR fallback',
      'Weekly parent progress digest',
      'Unlimited study history',
      'Priority tutoring review',
    ],
  },
];

export default function PricingPage() {
  const { isBn } = useI18n();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background flex flex-col">
      <PublicNavbar />

      <main className="flex-1 container max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold">
            15-Day Free Trial Available
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
            {isBn ? 'সহজ ও স্পষ্ট মূল্য তালিকা' : 'Simple, Transparent Pricing'}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isBn
              ? '১৫ দিনের ফ্রি ট্রায়াল (সব সুবিধা অন্তর্ভুক্ত)। ২য় সন্তানের ক্ষেত্রে ২৫% ছাড়, ৩য় বা ততোধিকের ক্ষেত্রে ৩৫% ছাড়। বাৎসরিক: ১০ মাসের খরচে ১২ মাস!'
              : '15-day free trial with full Standard features. Sibling discounts: 25% off 2nd child, 35% off 3rd+. Annual: pay for 10 months, get 12.'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 pt-4">
          {plans.map((p) => (
            <Card
              key={p.code}
              className={`rounded-3xl border transition-all flex flex-col justify-between ${
                p.recommended
                  ? 'border-indigo-600 ring-2 ring-indigo-600/20 shadow-xl scale-[1.02] bg-card'
                  : 'bg-card/70 hover:shadow-lg'
              }`}
            >
              <CardHeader className="p-6 pb-4">
                {p.recommended && (
                  <Badge className="w-fit mb-2 bg-indigo-600 text-white text-[10px] font-bold">
                    Recommended Choice
                  </Badge>
                )}
                <CardTitle className="text-2xl font-black text-foreground">{p.name}</CardTitle>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-black text-foreground">{p.price}</span>
                  <span className="text-xs text-muted-foreground">{p.per}</span>
                </div>
                <CardDescription className="text-xs mt-1">
                  Billed per child • Demo payment gateway
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 pt-0 space-y-6">
                <ul className="space-y-3 text-xs">
                  {p.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-foreground font-medium">{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-2 pt-2">
                  <Link href="/register" className="block">
                    <Button
                      className={`w-full h-11 text-xs font-bold rounded-2xl ${
                        p.recommended ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' : ''
                      }`}
                      variant={p.recommended ? 'default' : 'outline'}
                    >
                      <span>Start 15-Day Free Trial</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>

                  <Link href="/billing" className="block">
                    <Button variant="ghost" className="w-full text-xs text-muted-foreground h-9">
                      Test Demo Checkout
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Guarantee Note */}
        <div className="p-6 rounded-2xl border bg-muted/20 text-center max-w-2xl mx-auto space-y-1">
          <p className="text-xs font-bold text-foreground">
            🔒 Non-Payment Data Safety Guarantee
          </p>
          <p className="text-[11px] text-muted-foreground">
            If your trial ends and you choose not to subscribe right away, your study notes and learning history are never deleted. Your account simply switches to read-only access.
          </p>
        </div>
      </main>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground bg-card/40">
        <div className="container max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
