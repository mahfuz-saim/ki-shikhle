'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { useI18n } from '@/lib/i18n-context';
import { Check, Sparkles, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

export default function PricingPage() {
  const { isBn } = useI18n();

  const plans = [
    {
      code: 'free',
      name: isBn ? 'বিনামূল্যে (Free)' : 'Free Tier',
      price: '৳০',
      per: isBn ? '/ চিরতরে ফ্রি' : '/ forever free',
      description: isBn
        ? '১ সন্তানের দৈনন্দিন রুটিন ও প্রাথমিক কুইজ ট্র্যাকিং'
        : 'Essential study routine logging & basic progress tracking for 1 child',
      features: isBn
        ? [
            '১ সন্তানের প্রোফাইল (1 Child)',
            'প্রতি মাসে ২টি এআই কুইজ (2 AI Quizzes/mo)',
            'প্রতিদিনের পড়ার রুটিন ও মাসিক ধারাবাহিকতা ক্যালেন্ডার',
            '১ মিনিটে চটপট পড়ার বিবরণ জমা (Quick Log)',
            'শিক্ষার্থী ও অভিভাবক উভয়ের ডেডিকেটেড পোর্টাল',
          ]
        : [
            '1 Child profile slot',
            '2 AI quizzes per month',
            'Daily routine & study consistency calendar',
            '1-minute quick learning logs & streak tracking',
            'Access to both Student & Parent portals',
          ],
      ctaText: isBn ? 'বিনামূল্যে শুরু করুন' : 'Get Started Free',
      ctaHref: '/register',
    },
    {
      code: 'basic',
      name: isBn ? 'বেসিক (Basic)' : 'Basic Plan',
      price: '৳২৪৯',
      per: isBn ? '/ মাস' : '/ month',
      description: isBn
        ? 'নিয়মিত কুইজ অনুশীলন ও খাতার নোট স্ক্যানের জন্য উপযুক্ত'
        : 'Ideal for regular homework practice, notebook scanning, and topic tracking',
      features: isBn
        ? [
            '১ সন্তানের প্রোফাইল (1 Child)',
            'প্রতি মাসে ১০টি এআই কুইজ (10 AI Quizzes/mo)',
            'খাতার ছবি ও হস্তলিপি স্ক্যান (Class Notes & OCR)',
            'অধ্যায়ভিত্তিক দুর্বলতা ও নির্ভুলতা বিশ্লেষণ',
            'রুটিন অনুযায়ী পড়ার তাগিদ ও নোটিফিকেশন',
            '৬ মাসের পূর্ণ পাঠ্য ইতিহাস ও অগ্রগতি গ্রাফ',
          ]
        : [
            '1 Child profile slot',
            '10 AI quizzes per month',
            'Class notes upload & handwritten OCR scanner',
            'Chapter-wise weak vs strong topic analysis',
            'Routine study log reminder notifications',
            '6-month complete learning history',
          ],
      ctaText: isBn ? 'বেসিক নির্বাচন করুন' : 'Choose Basic',
      ctaHref: '/register',
    },
    {
      code: 'premium',
      name: isBn ? 'প্রিমিয়াম (Premium)' : 'Premium Family',
      price: '৳৫৯৯',
      per: isBn ? '/ মাস' : '/ month',
      recommended: true,
      description: isBn
        ? 'স্বয়ংক্রিয় কুইজ শিডিউলিং, ২ সন্তান ও এআই বুদ্ধিমত্তাভিত্তিক প্রস্তুতি'
        : 'Full auto-quiz scheduling, 2 children slots, and AI dynamic timing',
      features: isBn
        ? [
            '২ সন্তানের সম্পূর্ণ প্রোফাইল (2 Children Slots)',
            'প্রতি মাসে ৫০টি এআই কুইজ (50 AI Quizzes/mo)',
            'স্বয়ংক্রিয় কুইজ শিডিউলিং (Auto Quiz Scheduler)',
            'গতকালকের শেখা পাঠে ১-দিন স্পেসড রিপিটেশন কুইজ',
            'এআই বুদ্ধিমত্তাভিত্তিক সময় (গণিতে বেশি সময়, তাত্ত্বিকে টাইট সময়)',
            'দুর্বল অধ্যায়ে এআই অ্যাডাপটিভ রিকভারি কুইজ',
            'সম্পূর্ণ বাংলা ও ইংরেজিতে বিস্তারিত এআই ব্যাখ্যা ও ফিডব্যাক',
            'অগ্রাধিকারভিত্তিতে দ্রুত এআই প্রসেসিং ও সীমাহীন হিস্ট্রি',
          ]
        : [
            '2 Children profile slots included',
            '50 AI quizzes per month',
            'Auto Quiz Scheduling from Parent Portal',
            'Spaced Repetition: Automated quizzes on 1-day-old topics',
            'AI Dynamic Smart Timing: Tight for non-math, extra time for math',
            'Adaptive topic understanding & weakness recovery',
            'In-depth plain language AI explanations & feedback',
            'Unlimited study history & priority AI processing',
          ],
      ctaText: isBn ? 'প্রিমিয়াম শুরু করুন' : 'Start Premium',
      ctaHref: '/register',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background flex flex-col">
      <PublicNavbar />

      <main className="flex-1 container max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold">
            <Zap className="w-3.5 h-3.5 mr-1 text-amber-500 inline" />
            {isBn ? 'ফ্রিমিয়াম মডেল • কোনো ক্রেডিট কার্ড ছাড়াই শুরু করুন' : 'Freemium Model • Start Free Without Credit Card'}
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
            {isBn ? 'সহজ ও স্পষ্ট ফ্রীমিয়াম প্ল্যান' : 'Simple Freemium Plans'}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isBn
              ? 'বিনামূল্যে শুরু করো ১ সন্তানের জন্য ২টি কুইজ দিয়ে। বেশি কুইজ ও স্বয়ংক্রিয় শিডিউলিংয়ের জন্য বেছে নাও বেসিক অথবা প্রিমিয়াম!'
              : 'Start free with 1 child & 2 AI quizzes. Upgrade to Basic or Premium whenever you need auto-quiz scheduling and higher limits!'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 pt-4">
          {plans.map((p) => (
            <Card
              key={p.code}
              className={`rounded-3xl border transition-all flex flex-col justify-between ${
                p.recommended
                  ? 'border-indigo-600 ring-2 ring-indigo-600/20 shadow-xl scale-[1.02] bg-card relative'
                  : 'bg-card/70 hover:shadow-lg'
              }`}
            >
              <CardHeader className="p-6 pb-4">
                {p.recommended && (
                  <Badge className="w-fit mb-2 bg-indigo-600 text-white text-[10px] font-bold">
                    {isBn ? 'সর্বাধিক জনপ্রিয় ও সাশ্রয়ী' : 'Most Popular & Best Value'}
                  </Badge>
                )}
                <CardTitle className="text-2xl font-black text-foreground">{p.name}</CardTitle>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-black text-foreground">{p.price}</span>
                  <span className="text-xs text-muted-foreground">{p.per}</span>
                </div>
                <CardDescription className="text-xs mt-1 leading-relaxed">
                  {p.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 pt-0 space-y-6">
                <ul className="space-y-3 text-xs">
                  {p.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-foreground font-medium leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-2 pt-2">
                  <Link href={p.ctaHref} className="block">
                    <Button
                      className={`w-full h-11 text-xs font-bold rounded-2xl ${
                        p.recommended ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' : ''
                      }`}
                      variant={p.recommended ? 'default' : 'outline'}
                    >
                      <span>{p.ctaText}</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>

                  <Link href="/billing" className="block">
                    <Button variant="ghost" className="w-full text-xs text-muted-foreground h-9">
                      {isBn ? 'পেমেন্ট ডেমো টেস্ট করুন' : 'Test Demo Checkout'}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Guarantee Note */}
        <div className="p-6 rounded-2xl border bg-muted/20 text-center max-w-2xl mx-auto space-y-1">
          <p className="text-xs font-bold text-foreground flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{isBn ? 'নিরাপদ ডেটা নিশ্চয়তা' : 'Data Safety & Privacy Guarantee'}</span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            {isBn
              ? 'প্ল্যান পরিবর্তন বা মেয়াদ শেষ হলেও সন্তানের খাতার নোট ও পাঠ্য ইতিহাস মুছে যায় না। ফ্রি প্ল্যানে সবসময় ডেটা সুরক্ষিত থাকে।'
              : 'Your child\'s learning logs and handwritten notes are never deleted. Even on the Free tier, your history is safe.'}
          </p>
        </div>
      </main>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground bg-card/40">
        <div className="container max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} কি শিখলে? All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
