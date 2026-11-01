'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { useI18n } from '@/lib/i18n-context';
import {
  BookOpen,
  BarChart3,
  Brain,
  Calendar,
  Shield,
  Languages,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Flame,
  Award,
} from 'lucide-react';

export default function HomePage() {
  const { isBn } = useI18n();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background flex flex-col">
      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold animate-in fade-in slide-in-from-bottom-2">
            <span>🇧🇩</span>
            <span>
              {isBn
                ? 'বাংলাদেশের শিক্ষার্থীদের জন্য তৈরি • জাতীয় শিক্ষাক্রম (NCTB) সচেতন'
                : 'Made for Bangladesh • NCTB & English Version Curriculum Aware'}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground leading-[1.15] max-w-4xl mx-auto">
            {isBn ? (
              <>
                সন্তান আসলে <span className="bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">কী শিখছে</span>, প্রতিদিন জানুন ৩০ সেকেন্ডে
              </>
            ) : (
              <>
                Know what your <span className="bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">child actually learned</span> in 30 seconds
              </>
            )}
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {isBn
              ? 'স্কুল, কলেজ ও প্রাইভেট টিউশন—সব এক প্ল্যাটফর্মে। ১ মিনিটে দৈনিক পড়ার লগ, খাতার নোট থেকে এআই কুইজ এবং অভিভাবকের জন্য সহজ ভাষায় বিশ্লেষণ।'
              : 'School, tuition, and self-study all in one place. Daily 1-minute logs, AI quizzes generated from real class notes, and non-judgmental progress insights.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center pt-2">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/25">
                <span>{isBn ? '১৫ দিনের ফ্রি ট্রায়াল শুরু করুন' : 'Start 15-Day Free Trial'}</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="h-12 px-8 rounded-2xl text-sm font-semibold">
                {isBn ? 'প্ল্যান দেখুন — মাত্র ৳১৪৯/মাস' : 'View Pricing — from ৳149/mo'}
              </Button>
            </Link>
          </div>

          {/* Social Proof Pills */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Dedicated student & parent portals
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Bangla + English notes OCR
            </span>
          </div>
        </section>

        {/* Core Features Grid */}
        <section className="container max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="rounded-3xl border bg-card/70 backdrop-blur hover:shadow-lg transition-all p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground">
                {isBn ? '১ মিনিটে দৈনিক পড়ার লগ' : 'Daily Learning Log'}
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                {isBn
                  ? 'আজকে স্কুল বা প্রাইভেটে কী পড়ানো হয়েছে তা ১ মিনিটের কম সময়ে লিপিবদ্ধ করে স্ট্রিক বজায় রাখুন।'
                  : 'Child logs topics, subjects, and confidence ratings in under 60 seconds with 1-tap quick add.'}
              </CardDescription>
            </Card>

            <Card className="rounded-3xl border bg-card/70 backdrop-blur hover:shadow-lg transition-all p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <Brain className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground">
                {isBn ? 'আসল নোট থেকে এআই কুইজ' : 'AI Quizzes from Real Notes'}
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                {isBn
                  ? 'খাতার পাতার ছবি তুলে ওসিআর করুন। ক্লদ এআই সরাসরি পড়ানো টপিক থেকে প্রশ্ন তৈরি করবে।'
                  : 'Scan notebook photos with bilingual OCR. Claude AI generates balanced MCQs and explanations.'}
              </CardDescription>
            </Card>

            <Card className="rounded-3xl border bg-card/70 backdrop-blur hover:shadow-lg transition-all p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <BarChart3 className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground">
                {isBn ? '৩০ সেকেন্ডে ড্যাশবোর্ড' : '30-Second Clarity'}
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                {isBn
                  ? 'সাপ্তাহিক পড়ার সময়, বিষয়ভিত্তিক নির্ভুলতা ও ধারাবাহিকতা পরিষ্কার চার্টে দেখুন।'
                  : 'Visual charts show weekly study hours by source, topic mastery, and missed routines.'}
              </CardDescription>
            </Card>
          </div>
        </section>

        {/* Secondary Features Grid */}
        <section className="container max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-16">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="rounded-3xl border bg-card/70 backdrop-blur hover:shadow-lg transition-all p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                <Calendar className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground">
                {isBn ? 'স্মার্ট রুটিন ও রিশিডিউল' : 'Smart Recurring Routine'}
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                {isBn
                  ? 'সাপ্তাহিক প্রাইভেট বা স্কুল রুটিন। কোনো ক্লাস পিছিয়ে গেলে সহজেই পুনর্নির্ধারণ করুন।'
                  : 'Recurring weekday schedule with exception handling: move classes, add extra sessions, and detect missed classes.'}
              </CardDescription>
            </Card>

            <Card className="rounded-3xl border bg-card/70 backdrop-blur hover:shadow-lg transition-all p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                <Languages className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground">
                {isBn ? 'বাংলা ও ইংরেজি পূর্ণ সাপোর্ট' : 'Bangla + English Bilingual'}
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                {isBn
                  ? 'নোটস স্ক্যানার ও ইন্টারফেসে সম্পূর্ণ বাংলা ও ইংরেজি সমর্থন। সুন্দর বাংলা ফন্ট ও স্পষ্ট লেআউট।'
                  : 'Native Bangla OCR extraction, Noto Sans Bengali typography, and bilingual parent explanations.'}
              </CardDescription>
            </Card>

            <Card className="rounded-3xl border bg-card/70 backdrop-blur hover:shadow-lg transition-all p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <Shield className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground">
                {isBn ? 'অভিভাবক ও শিক্ষার্থীর আলাদা পোর্টাল' : 'Dual Parent & Student Portals'}
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                {isBn
                  ? 'একই লগইন পেজ কিন্তু ভূমিকার ভিত্তিতে আলাদা ইন্টারফেস। বিলিং ও অ্যাকাউন্ট সেটিংস সম্পূর্ণ সুরক্ষিত।'
                  : 'Distraction-free student portal keeps billing and parent settings completely protected.'}
              </CardDescription>
            </Card>
          </div>
        </section>

        {/* Pricing CTA Banner */}
        <section className="container max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <Card className="rounded-3xl border bg-gradient-to-r from-indigo-900 to-indigo-800 text-white shadow-2xl p-8 sm:p-12 text-center space-y-5">
            <h2 className="text-2xl sm:text-3xl font-black">
              {isBn
                ? 'একটি প্রাইভেট ক্লাসের খরচে পুরো মাসের পড়াশোনা ট্র্যাক করুন'
                : 'Fair pricing designed for Bangladeshi families'}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 max-w-2xl mx-auto leading-relaxed">
              {isBn
                ? '১৫ দিনের ফ্রি ট্রায়াল • স্টার্টার ৳১৪৯ • স্ট্যান্ডার্ড ৳২৯৯ • প্রিমিয়াম ৳৪৯৯ প্রতি সন্তান/মাস। একাধিক সন্তানের জন্য ২৫%–৩৫% বিশেষ ছাড়।'
                : 'Free 15-day trial • Starter ৳149 • Standard ৳299 • Premium ৳499 per child/month. Sibling discounts up to 35%.'}
            </p>
            <div className="pt-2">
              <Link href="/pricing">
                <Button size="lg" className="rounded-2xl font-bold bg-white text-indigo-900 hover:bg-white/90 shadow-lg text-sm px-8">
                  {isBn ? 'প্ল্যান ও ডেমো পেমেন্ট দেখুন' : 'Explore Plans & Demo Checkout'}
                </Button>
              </Link>
            </div>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-xs text-muted-foreground bg-card/40">
        <div className="container max-w-6xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-foreground">
            Ki Shikhle? (কি শিখলে?) — Bangladesh&apos;s First Parent Learning Tracker
          </p>
          <p className="text-muted-foreground">
            Calm Indigo & Amber Theme • Error-only Red • NCTB Curriculum Aware • Multi-Country Architecture
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <span>•</span>
            <Link href="/pricing" className="hover:underline">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
