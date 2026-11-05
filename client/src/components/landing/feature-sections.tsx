'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  BellRing,
  Bot,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Languages,
  Library,
  LineChart,
  ListChecks,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n-context';

type T = ReturnType<typeof useI18n>['t'];

/* ---------------------------------------------------------------------------------- */
/* Shared bits                                                                        */
/* ---------------------------------------------------------------------------------- */

function SectionHeader({ badge, title, subtitle }: { badge: string; title: string; subtitle: string }) {
  return (
    <div className="text-center space-y-3 max-w-2xl mx-auto">
      <Badge variant="secondary" className="text-xs px-3 py-1 font-semibold uppercase tracking-wider">
        {badge}
      </Badge>
      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">{title}</h2>
      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{subtitle}</p>
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-background/70 px-2.5 py-1 text-[11px] font-semibold text-foreground">
      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------------------------- */
/* Features                                                                           */
/* ---------------------------------------------------------------------------------- */

interface FeatureItem {
  key: string;
  icon: LucideIcon;
}

const STUDENT_FEATURES: FeatureItem[] = [
  { key: 'log', icon: NotebookPen },
  { key: 'notes', icon: Camera },
  { key: 'library', icon: Library },
  { key: 'quiz', icon: Timer },
  { key: 'dashboard', icon: Star },
];

const PARENT_FEATURES: FeatureItem[] = [
  { key: 'visibility', icon: ListChecks },
  { key: 'autoQuiz', icon: Sparkles },
  { key: 'scores', icon: ClipboardCheck },
  { key: 'insights', icon: LineChart },
  { key: 'alerts', icon: BellRing },
  { key: 'children', icon: Users },
];

function AudiencePanel({
  t,
  group,
  icon: Icon,
  items,
  accent,
}: {
  t: T;
  group: 'students' | 'parents';
  icon: LucideIcon;
  items: FeatureItem[];
  accent: { ring: string; iconBg: string; iconText: string; header: string };
}) {
  const base = `landing.features.${group}`;
  return (
    <div className={`rounded-3xl border bg-card/70 backdrop-blur p-6 sm:p-7 space-y-6 ${accent.ring}`}>
      <div className="flex items-center gap-3">
        <div className={`h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center ${accent.header}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-foreground">{t(`${base}.title`)}</h3>
          <p className="text-xs text-muted-foreground">{t(`${base}.subtitle`)}</p>
        </div>
      </div>
      <ul className="space-y-4">
        {items.map(({ key, icon: ItemIcon }) => (
          <li key={key} className="flex gap-3.5">
            <div className={`mt-0.5 h-9 w-9 shrink-0 rounded-xl flex items-center justify-center ${accent.iconBg} ${accent.iconText}`}>
              <ItemIcon className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-foreground">{t(`${base}.${key}.title`)}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{t(`${base}.${key}.desc`)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FeaturesSection() {
  const { t } = useI18n();
  return (
    <section id="features" className="py-16 md:py-24 border-t bg-muted/20 relative">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        <SectionHeader
          badge={t('landing.features.badge')}
          title={t('landing.features.title')}
          subtitle={t('landing.features.subtitle')}
        />

        <div className="grid lg:grid-cols-2 gap-6">
          <AudiencePanel
            t={t}
            group="students"
            icon={GraduationCap}
            items={STUDENT_FEATURES}
            accent={{
              ring: 'hover:border-indigo-500/40 transition-colors',
              header: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30',
              iconBg: 'bg-indigo-500/10',
              iconText: 'text-indigo-600 dark:text-indigo-400',
            }}
          />
          <AudiencePanel
            t={t}
            group="parents"
            icon={Users}
            items={PARENT_FEATURES}
            accent={{
              ring: 'hover:border-emerald-500/40 transition-colors',
              header: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30',
              iconBg: 'bg-emerald-500/10',
              iconText: 'text-emerald-600 dark:text-emerald-400',
            }}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-3xl border bg-gradient-to-br from-amber-500/10 via-card/70 to-card/70 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                <Languages className="h-5 w-5" />
              </div>
              <h3 className="text-base font-extrabold text-foreground">{t('landing.features.bilingual.title')}</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{t('landing.features.bilingual.desc')}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Chip>{t('landing.features.bilingual.chip1')}</Chip>
              <Chip>{t('landing.features.bilingual.chip2')}</Chip>
              <Chip>{t('landing.features.bilingual.chip3')}</Chip>
            </div>
          </div>
          <div className="rounded-3xl border bg-gradient-to-br from-purple-500/10 via-card/70 to-card/70 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-purple-500/15 text-purple-600 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-extrabold text-foreground">{t('landing.features.ai.title')}</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{t('landing.features.ai.desc')}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Chip>{t('landing.features.ai.chip1')}</Chip>
              <Chip>{t('landing.features.ai.chip2')}</Chip>
              <Chip>{t('landing.features.ai.chip3')}</Chip>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------------- */
/* How it works — each step has an illustrative mini preview of the real screen        */
/* ---------------------------------------------------------------------------------- */

type Role = 'student' | 'parent' | 'ai' | 'app';

const ROLE_STYLE: Record<Role, { cls: string; icon: LucideIcon }> = {
  student: { cls: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20', icon: GraduationCap },
  parent: { cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20', icon: Users },
  ai: { cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20', icon: Bot },
  app: { cls: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20', icon: ClipboardCheck },
};

function RoleTag({ role, t }: { role: Role; t: T }) {
  const { cls, icon: Icon } = ROLE_STYLE[role];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cls}`}>
      <Icon className="h-3 w-3" />
      {t(`landing.howItWorks.roles.${role}`)}
    </span>
  );
}

function MockFrame({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden="true" className="rounded-2xl border bg-background shadow-lg shadow-black/5 p-4 space-y-3 text-left select-none">
      {children}
    </div>
  );
}

const m = (t: T, k: string) => t(`landing.howItWorks.mock.${k}`);

function RecordMock({ t }: { t: T }) {
  return (
    <MockFrame>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-foreground">{m(t, 'className')}</p>
          <p className="text-[11px] text-muted-foreground">{m(t, 'classTime')}</p>
        </div>
        <NotebookPen className="h-4 w-4 text-indigo-500" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {['topic1', 'topic2'].map((k) => (
          <span key={k} className="rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 text-[11px] font-semibold">
            {m(t, k)}
          </span>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground border-t pt-2">{m(t, 'homework')}</p>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted-foreground">{m(t, 'confidence')}</span>
        <span className="flex gap-0.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className={`h-3.5 w-3.5 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`} />
          ))}
        </span>
      </div>
    </MockFrame>
  );
}

function CaptureMock({ t }: { t: T }) {
  return (
    <MockFrame>
      <div className="grid grid-cols-[1fr_auto_1.4fr] items-center gap-2">
        <div className="rounded-xl border border-dashed bg-muted/40 h-32 flex flex-col items-center justify-center gap-1 p-2">
          <Camera className="h-5 w-5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground text-center">{m(t, 'photo')}</span>
          <div className="w-full space-y-1 pt-1">
            <div className="h-1 rounded bg-muted-foreground/20 w-full" />
            <div className="h-1 rounded bg-muted-foreground/20 w-4/5" />
            <div className="h-1 rounded bg-muted-foreground/20 w-3/5" />
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-amber-500" />
        <div className="rounded-xl border bg-card p-2.5 space-y-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300">
            <Sparkles className="h-3 w-3" />
            {m(t, 'aiNote')}
          </span>
          <p className="text-xs font-bold text-foreground leading-snug">{m(t, 'noteTitle')}</p>
          <p className="rounded-md bg-muted/60 px-1.5 py-1 text-center font-mono text-xs text-foreground">F = m × a</p>
          <p className="text-[10px] text-muted-foreground leading-snug">{m(t, 'noteLine')}</p>
        </div>
      </div>
    </MockFrame>
  );
}

function QuizMock({ t }: { t: T }) {
  return (
    <MockFrame>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{m(t, 'quizTitle')}</p>
          <p className="text-[11px] text-muted-foreground">{m(t, 'quizMeta')}</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-1.5 rounded-full bg-emerald-500/70" style={{ opacity: 0.55 + i * 0.15 }} />
        ))}
      </div>
      <div className="rounded-xl bg-emerald-600 text-white text-xs font-bold text-center py-2">{m(t, 'generate')}</div>
    </MockFrame>
  );
}

function PracticeMock({ t }: { t: T }) {
  return (
    <MockFrame>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-muted-foreground">{m(t, 'progress')}</span>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
          <Timer className="h-3 w-3" />
          {m(t, 'timer')}
        </span>
      </div>
      <p className="text-sm font-bold text-foreground">{m(t, 'question')}</p>
      <div className="grid grid-cols-2 gap-1.5">
        {['option1', 'option2', 'option3', 'option4'].map((k, i) => (
          <div
            key={k}
            className={`rounded-lg border px-2 py-1.5 text-xs ${
              i === 0 ? 'border-indigo-500 bg-indigo-500/10 font-bold text-indigo-700 dark:text-indigo-300' : 'text-foreground'
            }`}
          >
            {m(t, k)}
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-indigo-600 text-white text-xs font-bold text-center py-1.5">{m(t, 'submit')}</div>
    </MockFrame>
  );
}

function ReviewMock({ t }: { t: T }) {
  const week = [40, 75, 60, 90, 0, 70, 85];
  return (
    <MockFrame>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground">{m(t, 'score')}</p>
          <p className="text-2xl font-black text-emerald-600">{m(t, 'scoreValue')}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground text-right">{m(t, 'thisWeek')}</p>
          <div className="flex items-end gap-1 h-10">
            {week.map((h, i) => (
              <div
                key={i}
                className={`w-2.5 rounded-sm ${h ? 'bg-indigo-500/70' : 'bg-muted'}`}
                style={{ height: `${Math.max(h, 12)}%` }}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 px-2.5 py-1.5 text-[11px] font-semibold">
        {m(t, 'needsReview')}
      </p>
    </MockFrame>
  );
}

const STEPS: { key: string; roles: Role[]; Mock: (p: { t: T }) => JSX.Element; color: string }[] = [
  { key: 'record', roles: ['student'], Mock: RecordMock, color: 'bg-indigo-600 shadow-indigo-600/30' },
  { key: 'capture', roles: ['student', 'ai'], Mock: CaptureMock, color: 'bg-amber-500 shadow-amber-500/30' },
  { key: 'quiz', roles: ['parent', 'ai'], Mock: QuizMock, color: 'bg-emerald-600 shadow-emerald-600/30' },
  { key: 'practice', roles: ['student'], Mock: PracticeMock, color: 'bg-indigo-600 shadow-indigo-600/30' },
  { key: 'review', roles: ['parent', 'app'], Mock: ReviewMock, color: 'bg-emerald-600 shadow-emerald-600/30' },
];

export function HowItWorksSection() {
  const { t, isBn } = useI18n();
  const toLocaleDigit = (n: number) => (isBn ? '০১২৩৪৫৬৭৮৯'[n] : String(n));

  return (
    <section id="how-it-works" className="py-16 md:py-24 border-t">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        <SectionHeader
          badge={t('landing.howItWorks.badge')}
          title={t('landing.howItWorks.title')}
          subtitle={t('landing.howItWorks.subtitle')}
        />

        <ol className="relative space-y-6 md:space-y-10">
          {/* Vertical connector line */}
          <div aria-hidden="true" className="absolute left-5 md:left-1/2 top-2 bottom-2 w-px bg-border md:-translate-x-1/2" />

          {STEPS.map(({ key, roles, Mock, color }, i) => {
            const reversed = i % 2 === 1;
            return (
              <li key={key} className="relative grid md:grid-cols-2 gap-4 md:gap-12 items-center pl-14 md:pl-0">
                {/* Step number on the line */}
                <div
                  className={`absolute left-0 md:left-1/2 top-0 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 h-10 w-10 rounded-2xl text-white font-extrabold flex items-center justify-center text-sm shadow-md z-10 ${color}`}
                >
                  {toLocaleDigit(i + 1)}
                </div>

                <div className={`space-y-2.5 ${reversed ? 'md:order-2 md:pl-10' : 'md:pr-10 md:text-right'}`}>
                  <div className={`flex flex-wrap items-center gap-1.5 ${reversed ? '' : 'md:justify-end'}`}>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t('landing.howItWorks.stepLabel', { n: toLocaleDigit(i + 1) })}
                    </span>
                    {roles.map((r) => (
                      <RoleTag key={r} role={r} t={t} />
                    ))}
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-foreground">
                    {t(`landing.howItWorks.steps.${key}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(`landing.howItWorks.steps.${key}.desc`)}
                  </p>
                </div>

                <div className={`${reversed ? 'md:order-1 md:pr-10' : 'md:pl-10'}`}>
                  <div className="max-w-sm md:max-w-none">
                    <Mock t={t} />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="rounded-3xl border bg-gradient-to-r from-indigo-600 to-indigo-500 text-white p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xl shadow-indigo-600/20">
          <div className="space-y-1.5 max-w-2xl">
            <h3 className="text-xl sm:text-2xl font-extrabold">{t('landing.howItWorks.cta.title')}</h3>
            <p className="text-sm text-indigo-100 leading-relaxed">{t('landing.howItWorks.cta.desc')}</p>
          </div>
          <Link href="/register" className="shrink-0">
            <Button size="lg" className="h-11 px-6 rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold">
              <span>{t('landing.text_2')}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
