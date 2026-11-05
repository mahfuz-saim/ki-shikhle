'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { FeaturesSection, HowItWorksSection } from '@/components/landing/feature-sections';
import { useI18n } from '@/lib/i18n-context';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const { t, isBn } = useI18n();
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
                width={400}
                height={123}
                priority
                className="h-14 sm:h-16 md:h-20 w-auto object-contain hover:scale-105 transition-transform drop-shadow-sm"
              />
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground leading-[1.16] max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-700">
              {isBn ? (
                <>
                  সন্তান আসলে{' '}
                  <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 bg-clip-text text-transparent">
                    কী শিখছে
                  </span>
                  , প্রতিদিন জানুন ৩০ সেকেন্ডে
                </>
              ) : (
                <>
                  Know what your child{' '}
                  <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 bg-clip-text text-transparent">
                    actually learned
                  </span>{' '}
                  every day in 30 seconds
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700">
              {t('landing.text')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center pt-2 animate-in fade-in slide-in-from-bottom-5 duration-700">
              <Link href="/register">
                <Button
                  size="lg"
                  className="h-12 px-8 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>{t('landing.text_2')}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <button
                onClick={() => scrollTo('features')}
                className="h-12 px-7 rounded-2xl text-sm font-semibold border border-input bg-background/80 hover:bg-muted text-foreground transition-all hover:border-primary/50"
              >
                {t('landing.text_3')}
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {t('landing.text_4')}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {t('landing.text_5')}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {t('landing.text_6')}
              </span>
            </div>
          </div>
        </section>

        <FeaturesSection />

        <HowItWorksSection />

        {/* PRICING SECTION */}
        <section id="pricing" className="py-16 md:py-24 border-t bg-muted/20">
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <Badge
                variant="secondary"
                className="text-xs px-3 py-1 font-semibold uppercase tracking-wider"
              >
                {t('landing.text_29')}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {t('landing.text_30')}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {t('landing.text_31')}
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
                    {t('landing.text_32')}
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      billingCycle === 'yearly'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>{t('landing.text_33')}</span>
                    <Badge
                      variant="default"
                      className="text-[10px] px-1.5 py-0 bg-emerald-600 hover:bg-emerald-600"
                    >
                      {t('landing.text_34')}
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
                      {t('landing.free')}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t('landing.text_35')}
                    </p>
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold text-foreground">৳০</span>
                    <span className="text-xs text-muted-foreground">
                      {' '}
                      {t('landing.text_36')}
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{t('landing.text_37')}</span>
                    </li>
                    <li className="flex items-center gap-2 font-medium text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{t('landing.text_38')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>
                        {t('landing.text_39')}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{t('landing.text_40')}</span>
                    </li>
                  </ul>
                </div>
                <Link href="/register" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full text-xs font-semibold h-10 rounded-xl"
                  >
                    {t('landing.text_41')}
                  </Button>
                </Link>
              </Card>

              {/* Plan 2: Basic */}
              <Card className="rounded-3xl border bg-card/70 backdrop-blur p-6 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-foreground">
                      {t('landing.basic')}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t('landing.text_42')}
                    </p>
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold text-foreground">
                      ৳{billingCycle === 'yearly' ? '১৯৯' : '২৪৯'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {' '}
                      {t('landing.text_43')}
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{t('landing.text_44')}</span>
                    </li>
                    <li className="flex items-center gap-2 font-medium text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{t('landing.text_45')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>
                        {t('landing.text_46')}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>
                        {t('landing.ocr')}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>
                        {t('landing.text_47')}
                      </span>
                    </li>
                  </ul>
                </div>
                <Link href="/register" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full text-xs font-semibold h-10 rounded-xl"
                  >
                    {t('landing.text_48')}
                  </Button>
                </Link>
              </Card>

              {/* Plan 3: Premium (Recommended with Auto Quiz Setup) */}
              <Card className="rounded-3xl border-2 border-indigo-600 bg-card shadow-xl p-6 flex flex-col justify-between space-y-5 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-indigo-600 text-white text-[10px] px-3 py-0.5 font-bold uppercase tracking-wider">
                    {t('landing.text_49')}
                  </Badge>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-foreground">
                      {t('landing.premium')}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t('landing.text_50')}
                    </p>
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                      ৳{billingCycle === 'yearly' ? '৪৭৯' : '৫৯৯'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {' '}
                      {t('landing.text_43')}
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2 font-medium text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>
                        {t('landing.text_51')}
                      </span>
                    </li>
                    <li className="flex items-center gap-2 font-medium text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{t('landing.text_52')}</span>
                    </li>
                    <li className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>
                        {t('landing.text_53')}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>
                        {t('landing.text_54')}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>
                        {t('landing.text_55')}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>
                        {t('landing.text_56')}
                      </span>
                    </li>
                  </ul>
                </div>
                <Link href="/register" className="w-full">
                  <Button className="w-full text-xs font-bold h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25">
                    {t('landing.text_57')}
                  </Button>
                </Link>
              </Card>

              {/* Plan 4: Pro Family */}
              <Card className="rounded-3xl border bg-card/70 backdrop-blur p-6 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-foreground">
                      {t('landing.pro')}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t('landing.text_58')}
                    </p>
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold text-foreground">
                      ৳{billingCycle === 'yearly' ? '৭৯৯' : '৯৯৯'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {' '}
                      {t('landing.text_43')}
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2 font-medium text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{t('landing.text_59')}</span>
                    </li>
                    <li className="flex items-center gap-2 font-medium text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{t('landing.text_60')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>
                        {t('landing.text_61')}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>
                        {t('landing.text_62')}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>
                        {t('landing.pdf')}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>
                        {t('landing.text_63')}
                      </span>
                    </li>
                  </ul>
                </div>
                <Link href="/register" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full text-xs font-semibold h-10 rounded-xl"
                  >
                    {t('landing.text_64')}
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
              {t('landing.text_65')}
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              {t('landing.text_66')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
