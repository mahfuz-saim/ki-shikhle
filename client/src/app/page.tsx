'use client';

import React, { useState } from 'react';
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
  Sparkles,
  Camera,
  CheckCircle2,
  ArrowRight,
  Flame,
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
      <PublicNavbar />

      <main className="flex-1 overflow-hidden">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
          {/* Subtle Ambient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-indigo-500/15 via-purple-500/10 to-amber-500/10 blur-3xl pointer-events-none rounded-full -z-10" />

          <div className="container max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-7">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {isBn
                  ? 'স্মার্ট লার্নিং ও প্রাইভেট টিউশন প্রগ্রেস ট্র্যাকার'
                  : 'Intelligent Study & Tuition Progress Tracker'}
              </span>
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
                  <span>{isBn ? '১৫ দিনের ফ্রি ট্রায়াল শুরু করুন' : 'Start 15-Day Free Trial'}</span>
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

            {/* Interactive Showcase Mockup Card */}
            <div className="pt-10 max-w-4xl mx-auto">
              <div className="relative rounded-3xl border bg-card/80 backdrop-blur-xl shadow-2xl p-4 sm:p-6 text-left transition-all hover:shadow-indigo-500/10">
                {/* Header of showcase */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                      কি
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {isBn ? 'আজকের লার্নিং স্ট্যাটাস' : "Today's Study Snapshot"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {isBn ? 'রহিম আহমেদ • ৮ম শ্রেণি' : 'Rahim Ahmed • Class 8'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      5-Day Streak
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                      88% Avg Score
                    </span>
                  </div>
                </div>

                {/* Body mockup grid */}
                <div className="grid sm:grid-cols-3 gap-3.5 pt-4">
                  {/* Card 1: Today's log */}
                  <div className="p-3.5 rounded-2xl bg-muted/40 border space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                        {isBn ? 'টিউশন লগ' : 'Tuition Log'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">4:30 PM</span>
                    </div>
                    <p className="text-xs font-bold text-foreground truncate">
                      Algebra: Quadratic Equations
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {isBn ? 'সূত্র প্রয়োগ ও অনুশীলনী ৩.১' : 'Formula application & exercise 3.1'}
                    </p>
                    <div className="pt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Logged in 45 sec
                      </span>
                    </div>
                  </div>

                  {/* Card 2: AI Quiz generated */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/40 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <Brain className="w-3.5 h-3.5" />
                        {isBn ? 'এআই কুইজ প্রস্তুত' : 'AI Quiz Ready'}
                      </span>
                      <Badge variant="outline" className="text-[10px] bg-background">
                        4 MCQs
                      </Badge>
                    </div>
                    <p className="text-xs font-bold text-foreground">
                      Concept Check: Roots of Quadratic
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {isBn ? 'খাতার সূত্র থেকে স্বয়ংক্রিয় প্রশ্ন' : 'Generated from notebook photo'}
                    </p>
                    <div className="pt-1">
                      <div className="h-1.5 w-full bg-indigo-200/60 dark:bg-indigo-900 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full w-[88%]" />
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Weekly breakdown */}
                  <div className="p-3.5 rounded-2xl bg-muted/40 border space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
                        {isBn ? 'সাপ্তাহিক স্টাডি' : 'Weekly Time'}
                      </span>
                      <span className="text-[11px] font-bold text-foreground">7.5 hrs</span>
                    </div>
                    <div className="space-y-1.5 pt-1 text-[11px]">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Math & Science</span>
                        <span className="font-semibold text-foreground">65%</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>English & ICT</span>
                        <span className="font-semibold text-foreground">35%</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                      ✓ Routine on track
                    </p>
                  </div>
                </div>
              </div>
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
                  ? '১৫ দিনের সম্পূর্ণ ফ্রি ট্রায়াল। ক্রেডিট কার্ডের প্রয়োজন নেই।'
                  : 'Start with a 15-day free trial. Upgrade, downgrade, or cancel anytime.'}
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
              {/* Free Trial Plan */}
              <Card className="rounded-3xl border bg-card/70 backdrop-blur p-6 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-foreground">
                      {isBn ? '১৫ দিনের ফ্রি ট্রায়াল' : '15-Day Free Trial'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isBn ? 'সম্পূর্ণ ফিচার পরীক্ষা করুন' : 'Full access to explore features'}
                    </p>
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold text-foreground">৳০</span>
                    <span className="text-xs text-muted-foreground"> / 15 days</span>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? '১ জন শিক্ষার্থীর প্রোফাইল' : '1 Student profile'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? 'দৈনিক পড়ার লগ ও রুটিন' : 'Daily study logging & routine'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? '১০টি এআই কুইজ জেনারেশন' : '10 AI quiz generations'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? 'অভিভাবক ড্যাশবোর্ড' : 'Parent dashboard analytics'}</span>
                    </li>
                  </ul>
                </div>
                <Link href="/register" className="w-full">
                  <Button variant="outline" className="w-full text-xs font-semibold h-10 rounded-xl">
                    {isBn ? 'ফ্রি ট্রায়াল শুরু করুন' : 'Start Free Trial'}
                  </Button>
                </Link>
              </Card>

              {/* Starter Plan */}
              <Card className="rounded-3xl border bg-card/70 backdrop-blur p-6 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-foreground">Starter</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isBn ? '১ সন্তানের দৈনন্দিন ট্র্যাকিং' : 'Essential tracking for 1 child'}
                    </p>
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold text-foreground">
                      ৳{billingCycle === 'yearly' ? '১১৯' : '১৪৯'}
                    </span>
                    <span className="text-xs text-muted-foreground"> / child / mo</span>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? '১ জন শিক্ষার্থীর অ্যাকাউন্ট' : '1 Student account'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? 'আনলিমিটেড পড়ার লগ' : 'Unlimited daily study logs'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? 'প্রতি মাসে ১৫টি ওসিআর নোট' : '15 OCR notes / month'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? 'সাপ্তাহিক প্রগ্রেস সামারি' : 'Weekly progress summary'}</span>
                    </li>
                  </ul>
                </div>
                <Link href="/register" className="w-full">
                  <Button variant="outline" className="w-full text-xs font-semibold h-10 rounded-xl">
                    {isBn ? 'প্ল্যান নিন' : 'Choose Starter'}
                  </Button>
                </Link>
              </Card>

              {/* Standard Plan (Recommended) */}
              <Card className="rounded-3xl border-2 border-indigo-600 bg-card shadow-xl p-6 flex flex-col justify-between space-y-5 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-indigo-600 text-white text-[10px] px-3 py-0.5 font-bold uppercase tracking-wider">
                    {isBn ? 'সবচেয়ে জনপ্রিয়' : 'Most Popular'}
                  </Badge>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-foreground">Standard</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isBn ? 'সম্পূর্ণ এআই কুইজ ও অ্যানালিটিক্স' : 'Full AI quizzes & radar insights'}
                    </p>
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                      ৳{billingCycle === 'yearly' ? '২৩৯' : '২৯৯'}
                    </span>
                    <span className="text-xs text-muted-foreground"> / mo</span>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2 font-medium text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? '২ জন শিক্ষার্থীর প্রোফাইল' : 'Up to 2 Students included'}</span>
                    </li>
                    <li className="flex items-center gap-2 font-medium text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? 'আনলিমিটেড এআই কুইজ' : 'Unlimited AI revision quizzes'}</span>
                    </li>
                    <li className="flex items-center gap-2 font-medium text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? 'আনলিমিটেড নোট ওসিআর' : 'Unlimited notebook OCR'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? 'দুর্বল টপিক ডিটেকশন ও রাডার' : 'Weak topic radar & alerts'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? 'স্মার্ট রুটিন ও রিশিডিউলিং' : 'Smart routine & rescheduler'}</span>
                    </li>
                  </ul>
                </div>
                <Link href="/register" className="w-full">
                  <Button className="w-full text-xs font-bold h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25">
                    {isBn ? 'স্ট্যান্ডার্ড শুরু করুন' : 'Start with Standard'}
                  </Button>
                </Link>
              </Card>

              {/* Family / Premium Plan */}
              <Card className="rounded-3xl border bg-card/70 backdrop-blur p-6 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-foreground">Premium / Family</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isBn ? 'একাধিক সন্তান ও অ্যাডভান্সড রিপোর্ট' : 'Multi-child families & priority AI'}
                    </p>
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold text-foreground">
                      ৳{billingCycle === 'yearly' ? '৩৯৯' : '৪৯৯'}
                    </span>
                    <span className="text-xs text-muted-foreground"> / mo</span>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? '৪ জন পর্যন্ত শিক্ষার্থী' : 'Up to 4 Students'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? 'প্রায়োরিটি এআই কুইজ ইঞ্জিন' : 'Priority AI quiz engine'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? 'সম্পূর্ণ স্টাডি হিস্ট্রি ও রিপোর্ট' : 'Full history & report exports'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isBn ? 'মাল্টি-চাইল্ড কম্প্যারিজন' : 'Sibling analytics overview'}</span>
                    </li>
                  </ul>
                </div>
                <Link href="/register" className="w-full">
                  <Button variant="outline" className="w-full text-xs font-semibold h-10 rounded-xl">
                    {isBn ? 'ফ্যামিলি প্ল্যান নিন' : 'Choose Family'}
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
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">
              কি
            </div>
            <div>
              <span className="font-bold text-foreground">কি শিখলে? (Ki Shikhle?)</span>
              <span className="text-[11px] text-muted-foreground ml-2">
                © {new Date().getFullYear()} All rights reserved.
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 font-medium">
            <button
              onClick={() => scrollTo('features')}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              {isBn ? 'ফিচারসমূহ' : 'Features'}
            </button>
            <button
              onClick={() => scrollTo('pricing')}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              {isBn ? 'মূল্য ও প্ল্যান' : 'Pricing'}
            </button>
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
