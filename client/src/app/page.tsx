'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Sparkles,
  Camera,
  CheckCircle2,
  ArrowRight,
  Award,
  Clock,
  ShieldCheck,
  Star,
  Layers,
  ChevronRight,
} from 'lucide-react';

export default function HomePage() {
  const { isBn } = useI18n();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const scrollTo = (id: string) => {
    if (typeof window !== 'undefined') {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-indigo-500 selection:text-white">
      <PublicNavbar hideBadge />

      <main className="flex-1 overflow-hidden">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
          {/* Subtle Ambient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-indigo-500/15 via-purple-500/10 to-amber-500/10 blur-3xl pointer-events-none rounded-full -z-10" />

          <div className="container max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-7">
            {/* Built For AIgnite Buildathon Sticker above headline */}
            <div className="flex justify-center mb-1 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <Image
                src="/built-for-aignite.png"
                alt="Built For Ostad Presents YUNet AIgnite Buildathon 2026"
                width={260}
                height={92}
                priority
                className="h-10 sm:h-12 md:h-14 w-auto object-contain hover:scale-105 transition-transform"
              />
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground leading-[1.16] max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-700">
              {isBn ? (
                <>
                  সন্তান আসলে <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 bg-clip-text text-transparent">কী শিখছে</span>, প্রতিদিন জানুন ৩০ সেকেন্ডে
                </>
              ) : (
                <>
                  Know what your child <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 bg-clip-text text-transparent">actually learned</span> every day in 30 seconds
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700">
              {isBn
                ? 'স্কুল, প্রাইভেট টিউশন ও সেলফ স্টাডি—সব এক প্ল্যাটফর্মে। খাতার পাতার ছবি থেকে এআই কুইজ তৈরি ও সহজ ভাষায় প্রগ্রেস অ্যানালিটিক্স।'
                : 'School, coaching, and home tuition organized in one place. Instant AI revision quizzes from handwritten notes and clear weekly progress insights.'}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center pt-2 animate-in fade-in slide-in-from-bottom-5 duration-700">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <span>{isBn ? 'বিনামূল্যে শুরু করুন (ফ্রি)' : 'Get Started Free'}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <button
                onClick={() => scrollTo('features')}
                className="h-12 px-7 rounded-2xl text-sm font-semibold border border-input bg-background/80 hover:bg-muted text-foreground transition-all hover:border-primary/50"
              >
                {isBn ? 'ফিচারসমূহ দেখুন' : 'Explore Key Features'}
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {isBn ? 'কোন ক্রেডিট কার্ড লাগবে না' : 'No credit card required'}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {isBn ? 'অভিভাবক ও শিক্ষার্থীর আলাদা পোর্টাল' : 'Dual Parent & Student Portals'}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {isBn ? 'বাংলা ও ইংরেজি নোট ওসিআর' : 'Bangla + English Notes OCR'}
              </span>
            </div>

          </div>
        </section>

        {/* CORE FEATURES SECTION */}
        <section id="features" className="py-16 md:py-24 border-t bg-muted/20 relative">
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <Badge variant="secondary" className="text-xs px-3 py-1 font-semibold uppercase tracking-wider">
                {isBn ? 'প্রধান সুবিধাসমূহ' : 'Core Platform Features'}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {isBn
                  ? 'সন্তানের পড়াশোনায় পাশে থাকার সবকিছু এক সাথে'
                  : 'Everything you need to support your child\'s learning'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {isBn
                  ? 'কোন জটিলতা ছাড়াই প্রতিদিনের পড়া, এআই কুইজ ও প্রগ্রেস ট্র্যাকিংয়ের সমন্বিত প্ল্যাটফর্ম।'
                  : 'Designed specifically for busy parents and curious learners to stay aligned without academic friction.'}
              </p>
            </div>

            {/* 6 Key Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <Card className="rounded-3xl border bg-card/70 backdrop-blur hover:shadow-xl hover:border-indigo-500/40 transition-all p-6 space-y-3 group">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 group-hover:scale-110 transition-transform flex items-center justify-center font-bold">
                  <BookOpen className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg font-bold text-foreground">
                  {isBn ? '১ মিনিটে দৈনিক পড়ার লগ' : '1-Minute Daily Study Logging'}
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {isBn
                    ? 'স্কুল, কোচিং, হোম টিউশন বা সেলফ স্টাডি—কী পড়া হলো তা ১ মিনিটের কম সময়ে ট্যাগ করুন ও স্ট্রিক বজায় রাখুন।'
                    : 'Effortlessly record school lectures, private tuition sessions, and self-study topics in under 60 seconds.'}
                </CardDescription>
              </Card>

              {/* Feature 2 */}
              <Card className="rounded-3xl border bg-card/70 backdrop-blur hover:shadow-xl hover:border-indigo-500/40 transition-all p-6 space-y-3 group">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 group-hover:scale-110 transition-transform flex items-center justify-center font-bold">
                  <Brain className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg font-bold text-foreground">
                  {isBn ? 'খাতার নোট থেকে এআই কুইজ' : 'AI Quizzes from Real Notes'}
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {isBn
                    ? 'খাতার পাতার ছবি তুললেই ক্লদ এআই সরাসরি আসল টপিক থেকে প্রাসঙ্গিক প্রশ্ন ও ব্যাখ্যা তৈরি করে।'
                    : 'Snap photos of class notebooks. Smart OCR extracts topics and generates instant revision quizzes with feedback.'}
                </CardDescription>
              </Card>

              {/* Feature 3 */}
              <Card className="rounded-3xl border bg-card/70 backdrop-blur hover:shadow-xl hover:border-indigo-500/40 transition-all p-6 space-y-3 group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform flex items-center justify-center font-bold">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg font-bold text-foreground">
                  {isBn ? '৩০ সেকেন্ডে ড্যাশবোর্ড ওভারভিউ' : '30-Second Parent Clarity'}
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {isBn
                    ? 'সাপ্তাহিক পড়ার সময়, বিষয়ভিত্তিক নির্ভুলতা ও ধারাবাহিকতা এক নজরে স্পষ্ট গ্রাফে দেখুন।'
                    : 'See weekly study hours by source, topic strengths and weaknesses, and consistency heatmap in seconds.'}
                </CardDescription>
              </Card>

              {/* Feature 4 */}
              <Card className="rounded-3xl border bg-card/70 backdrop-blur hover:shadow-xl hover:border-indigo-500/40 transition-all p-6 space-y-3 group">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 group-hover:scale-110 transition-transform flex items-center justify-center font-bold">
                  <Sparkles className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg font-bold text-foreground">
                  {isBn ? 'শিক্ষার্থীর জন্য আলাদা পোর্টাল' : 'Dedicated Student Experience'}
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {isBn
                    ? 'শিক্ষার্থী নিজের ইমেইল দিয়ে লগইন করে বিভ্রান্তিমুক্ত পরিবেশে কুইজ দেবে, পড়ার লগ রাখবে ও ব্যাজ অর্জন করবে।'
                    : 'Distraction-free student portal where children can answer interactive quizzes, track streaks, and build learning habits.'}
                </CardDescription>
              </Card>

              {/* Feature 5 */}
              <Card className="rounded-3xl border bg-card/70 backdrop-blur hover:shadow-xl hover:border-indigo-500/40 transition-all p-6 space-y-3 group">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform flex items-center justify-center font-bold">
                  <Camera className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg font-bold text-foreground">
                  {isBn ? 'বাংলা ও ইংরেজি নোট ওসিআর' : 'Bilingual OCR & Notes Reader'}
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {isBn
                    ? 'বাংলা হাতের লেখা, ইংরেজি নোট ও গণিতের সমীকরণ নির্ভুলভাবে রিড করে এআই কুইজে রূপান্তর করে।'
                    : 'Optimized for Bangla handwriting, English text, and mixed formulas from everyday student notebooks.'}
                </CardDescription>
              </Card>

              {/* Feature 6 */}
              <Card className="rounded-3xl border bg-card/70 backdrop-blur hover:shadow-xl hover:border-indigo-500/40 transition-all p-6 space-y-3 group">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 group-hover:scale-110 transition-transform flex items-center justify-center font-bold">
                  <Calendar className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg font-bold text-foreground">
                  {isBn ? 'স্মার্ট রুটিন ও রিশিডিউল' : 'Smart Recurring Routine & Alerts'}
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {isBn
                    ? 'সাপ্তাহিক প্রাইভেট বা স্কুলের সময়সূচি সেট করুন। কোনো ক্লাস মিস হলে সহজে রিশিডিউল করুন।'
                    : 'Manage weekly tutor schedules, handle class reschedules gracefully, and stay ahead of upcoming sessions.'}
                </CardDescription>
              </Card>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-16 md:py-24 border-t">
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <Badge variant="secondary" className="text-xs px-3 py-1 font-semibold uppercase tracking-wider">
                {isBn ? 'কার্যপদ্ধতি' : 'How It Works'}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {isBn ? '৩টি সহজ ধাপে শুরু করুন' : 'Simple 3-Step Routine'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {isBn
                  ? 'দৈনিক মাত্র কয়েক মিনিট সময় দিয়েই সন্তানের শিক্ষাজীবনে সেরা সহায়তা দিন।'
                  : 'Requires less than 2 minutes of your daily time while keeping you deeply in touch with learning.'}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 relative">
              {/* Step 1 */}
              <div className="rounded-3xl border p-6 bg-card/60 backdrop-blur space-y-4 relative">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-indigo-600/30">
                  1
                </div>
                <h3 className="text-base font-bold text-foreground">
                  {isBn ? '১. রুটিন ও পড়ার বিষয় যোগ করুন' : '1. Add Schedule & Topics'}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isBn
                    ? 'স্কুল বা প্রাইভেট শেষ হওয়ার পর সন্তান বা অভিভাবক ১ ট্যাপে আজকের পড়া বিষয়বস্তু লিখে বা সিলেক্ট করে ফেলুন।'
                    : 'Set up weekly school & tutor schedules. Quickly log topics covered after each session in 45 seconds.'}
                </p>
              </div>

              {/* Step 2 */}
              <div className="rounded-3xl border p-6 bg-card/60 backdrop-blur space-y-4 relative">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-amber-500/30">
                  2
                </div>
                <h3 className="text-base font-bold text-foreground">
                  {isBn ? '২. এআই কুইজ প্র্যাকটিস' : '2. Instant AI Practice Quizzes'}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isBn
                    ? 'খাতার ছবি আপলোড করুন অথবা টপিক সিলেক্ট করুন। শিক্ষার্থী নিজের পোর্টালে ঝটপট ৪টি এমসিকিউ প্র্যাকটিস করবে।'
                    : 'Snap a notebook photo or select a logged topic. Student solves 4 quick conceptual questions on their portal.'}
                </p>
              </div>

              {/* Step 3 */}
              <div className="rounded-3xl border p-6 bg-card/60 backdrop-blur space-y-4 relative">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-emerald-600/30">
                  3
                </div>
                <h3 className="text-base font-bold text-foreground">
                  {isBn ? '৩. প্রগ্রেস দেখুন ও উৎসাহ দিন' : '3. Review Insights & Encourage'}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isBn
                    ? 'অভিভাবক ড্যাশবোর্ডে দেখুন কোন বিষয়ে দখল মজবুত হচ্ছে এবং কোথায় আরও একটু মনোযোগ প্রয়োজন।'
                    : 'Glance at mastery trends on your parent dashboard. Celebrate consistency and identify weak topics early.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="py-16 md:py-24 border-t bg-muted/20">
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <Badge variant="secondary" className="text-xs px-3 py-1 font-semibold uppercase tracking-wider">
                {isBn ? 'সাবস্ক্রিপশন প্ল্যান' : 'Transparent Pricing'}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {isBn
                  ? 'সাশ্রয়ী মূল্যে পুরো মাসের পড়াশোনা ট্র্যাক করুন'
                  : 'Fair pricing designed for every family'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {isBn
                  ? 'চিরকাল ফ্রি প্ল্যান সহ ৪টি স্পষ্ট প্যাকেজ। ৩য় প্যাকেজে রয়েছে সম্পূর্ণ স্বয়ংক্রিয় কুইজ শিডিউলিং!'
                  : 'Freemium plans designed for real learning. 3rd Package includes Automatic Quiz Setup System!'}
              </p>

              {/* Billing Cycle Toggle */}
              <div className="pt-2 flex items-center justify-center">
                <div className="inline-flex items-center p-1 rounded-2xl bg-muted border">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {isBn ? 'মাসিক' : 'Monthly'}
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      billingCycle === 'yearly'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>{isBn ? 'বাৎসরিক' : 'Yearly'}</span>
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-emerald-600 hover:bg-emerald-600">
                      {isBn ? '২০% ছাড়' : 'Save 20%'}
                    </Badge>
                  </button>
                </div>
              </div>
            </div>

            {/* Pricing Cards Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Plan 1: Free Forever */}
              <Card className="rounded-3xl border bg-card/70 backdrop-blur p-6 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-foreground">
                      {isBn ? 'ফ্রি (Free)' : 'Always Free'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isBn ? '১ সন্তানের জন্য চিরকাল বিনামূল্যে' : 'Always free for 1 child'}
                    </p>
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold text-foreground">৳০</span>
                    <span className="text-xs text-muted-foreground"> {isBn ? '/ চিরকাল' : '/ forever free'}</span>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? '১ জন শিক্ষার্থীর প্রোফাইল' : '1 Child profile slot'}</span>
                    </li>
                    <li className="flex items-center gap-2 font-medium text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? 'প্রতি মাসে ২টি এআই কুইজ' : '2 AI quizzes per month'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? 'দৈনিক পড়ার রুটিন ও লগিং' : 'Daily study logging & routine'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? '১ মাসের স্টাডি হিস্ট্রি' : '1-month study history'}</span>
                    </li>
                  </ul>
                </div>
                <Link href="/register" className="w-full">
                  <Button variant="outline" className="w-full text-xs font-semibold h-10 rounded-xl">
                    {isBn ? 'বিনামূল্যে শুরু করুন' : 'Start Free'}
                  </Button>
                </Link>
              </Card>

              {/* Plan 2: Basic */}
              <Card className="rounded-3xl border bg-card/70 backdrop-blur p-6 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-foreground">
                      {isBn ? 'বেসিক (Basic)' : 'Basic'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isBn ? 'ভয়েস এন্ট্রি ও খাতার নোট স্ক্যানার' : 'Voice logging & notebook scanner'}
                    </p>
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold text-foreground">
                      ৳{billingCycle === 'yearly' ? '১৯৯' : '২৪৯'}
                    </span>
                    <span className="text-xs text-muted-foreground"> {isBn ? '/ মাস' : '/ month'}</span>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? '১ জন শিক্ষার্থীর অ্যাকাউন্ট' : '1 Child profile slot'}</span>
                    </li>
                    <li className="flex items-center gap-2 font-medium text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? 'প্রতি মাসে ১০টি এআই কুইজ' : '10 AI quizzes per month'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? 'ভয়েস লগ ও ক্লদ এআই স্ট্রাকচারিং' : 'Voice logging & Claude AI'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? 'খাতার নোট ও হস্তলিপি স্ক্যানার (OCR)' : 'Class notebook OCR scanner'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? 'দুর্বল বনাম শক্তিশালী অধ্যায়' : 'Weak vs strong topic insights'}</span>
                    </li>
                  </ul>
                </div>
                <Link href="/register" className="w-full">
                  <Button variant="outline" className="w-full text-xs font-semibold h-10 rounded-xl">
                    {isBn ? 'বেসিক প্ল্যান নিন' : 'Choose Basic'}
                  </Button>
                </Link>
              </Card>

              {/* Plan 3: Premium (Recommended with Auto Quiz Setup) */}
              <Card className="rounded-3xl border-2 border-indigo-600 bg-card shadow-xl p-6 flex flex-col justify-between space-y-5 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-indigo-600 text-white text-[10px] px-3 py-0.5 font-bold uppercase tracking-wider">
                    {isBn ? 'সবচেয়ে জনপ্রিয়' : 'Most Popular'}
                  </Badge>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-foreground">
                      {isBn ? 'প্রিমিয়াম (Premium)' : 'Premium'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isBn ? 'স্বয়ংক্রিয় কুইজ শিডিউলিং ও ২ সন্তান' : 'Auto quiz scheduling & 2 children'}
                    </p>
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                      ৳{billingCycle === 'yearly' ? '৪৭৯' : '৫৯৯'}
                    </span>
                    <span className="text-xs text-muted-foreground"> {isBn ? '/ মাস' : '/ month'}</span>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2 font-medium text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? '২ জন শিক্ষার্থীর সম্পূর্ণ প্রোফাইল' : '2 Children profile slots'}</span>
                    </li>
                    <li className="flex items-center gap-2 font-medium text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? 'প্রতি মাসে ৫০টি এআই কুইজ' : '50 AI quizzes per month'}</span>
                    </li>
                    <li className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{isBn ? '⭐ স্বয়ংক্রিয় কুইজ সেটআপ সিস্টেম' : '⭐ Automatic Quiz Setup System'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? '১ দিন আগের টপিকে স্পেসড রিপিটেশন' : '1-day-old topic spaced repetition'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? 'গণিতে বেশি সময়, তাত্ত্বিকে টাইট টাইমিং' : 'AI Dynamic Math & Analytical timing'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? 'সীমাহীন হিস্ট্রি ও প্রায়োরিটি এআই' : 'Unlimited study history & priority AI'}</span>
                    </li>
                  </ul>
                </div>
                <Link href="/register" className="w-full">
                  <Button className="w-full text-xs font-bold h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25">
                    {isBn ? 'প্রিমিয়াম শুরু করুন' : 'Start with Premium'}
                  </Button>
                </Link>
              </Card>

              {/* Plan 4: Pro Family */}
              <Card className="rounded-3xl border bg-card/70 backdrop-blur p-6 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-foreground">
                      {isBn ? 'প্রো ফ্যামিলি (Pro)' : 'Pro Family'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isBn ? 'পুরো পরিবার ও এসএমএস/হোয়াটসঅ্যাপ অ্যালার্ট' : 'Full family & SMS/WhatsApp alerts'}
                    </p>
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold text-foreground">
                      ৳{billingCycle === 'yearly' ? '৭৯৯' : '৯৯৯'}
                    </span>
                    <span className="text-xs text-muted-foreground"> {isBn ? '/ মাস' : '/ month'}</span>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2 font-medium text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? '৫ জন পর্যন্ত শিক্ষার্থী' : 'Up to 5 Children profiles'}</span>
                    </li>
                    <li className="flex items-center gap-2 font-medium text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? '১৫০টি এআই কুইজ প্রতি মাসে' : '150 AI quizzes per month'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? 'সকল সন্তানের স্বয়ংক্রিয় কুইজ শিডিউলিং' : 'Auto quiz setup for all siblings'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? 'হোয়াটসঅ্যাপ ও এসএমএস ডেইলি সামারি' : 'WhatsApp & SMS study alerts'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? 'মাসিক প্রগ্রেস অডিট রিপোর্ট (PDF)' : 'Monthly audit report (PDF export)'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? '২৪/৭ ডেডিকেটেড প্যারেন্টিং সাপোর্ট' : '24/7 dedicated priority support'}</span>
                    </li>
                  </ul>
                </div>
                <Link href="/register" className="w-full">
                  <Button variant="outline" className="w-full text-xs font-semibold h-10 rounded-xl">
                    {isBn ? 'প্রো ফ্যামিলি নিন' : 'Choose Pro Family'}
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* MINIMALIST BOTTOM BAR FOOTER */}
      <footer className="border-t py-8 bg-card/50 text-xs text-muted-foreground">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-5 font-medium">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              {isBn ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              {isBn ? 'ব্যবহারের শর্তাবলী' : 'Terms of Service'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
