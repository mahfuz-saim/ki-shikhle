'use client';

export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppShell } from '@/components/layout/app-shell';
import { useI18n } from '@/lib/i18n-context';
import { api } from '@/lib/api';
import { FormattedMarkdown } from '@/components/ui/formatted-markdown';
import {
  Award,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  Brain,
  ArrowLeft,
  BookOpen,
  MessageCircle,
} from 'lucide-react';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { t, isBn } = useI18n();
  const id = (params as any)?.id as string;

  const [data, setData] = useState<any>(null);
  const [explanation, setExplanation] = useState<any>(null);
  const [explaining, setExplaining] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [explanationError, setExplanationError] = useState('');

  useEffect(() => {
    let isMounted = true;

    api
      .get(`/attempts/${id}`)
      .then((r) => {
        if (!isMounted) return;
        setData(r.data.data);
        if (r.data.data?.explanation) {
          setExplanation(r.data.data.explanation);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        // The old code fell back to a **hardcoded 8/10 with three fabricated
        // Newton questions**, so a failed request produced a confident-looking
        // result page for an attempt that never happened. Now a failure is a
        // failure: the page says so.
        setLoadError(
          err?.response?.data?.error?.message ||
          (t('results.text'))
        );
        setData(null);
      });

    return () => {
      isMounted = false;
    };
    // `isBn` is intentionally NOT a dependency — it re-fetches on every locale
    // toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleGenExplanation = async (language: 'en' | 'bn') => {
    setExplaining(true);
    setExplanationError('');
    try {
      const res = await api.post(`/attempts/${id}/explanation`, { language });
      setExplanation(res.data.data);
    } catch (err: any) {
      // The old code replaced a failed request with a pre-written "high-trust"
      // AI report about Newton's laws — which described a quiz the child never
      // took. The failure is now surfaced instead.
      const serverMsg = err?.response?.data?.error?.message;
      setExplanationError(
        serverMsg ||
          (t('results.text_2'))
      );
    } finally {
      setExplaining(false);
    }
  };

  const attempt = data?.attempt;
  // No hardcoded defaults — a missing score is a missing score, not an 8/10.
  const score = attempt?.score ?? 0;
  const maxScore = attempt?.maxScore ?? 0;
  const scorePercent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return (
    <AppShell>
      <div className="space-y-6 w-full">
        <div className="flex items-center gap-2">
          <Link href="/quizzes">
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('results.text_3')}</span>
            </Button>
          </Link>
        </div>

        {loadError && (
          <Card className="rounded-2xl border border-destructive/40 bg-destructive/5">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <XCircle className="w-8 h-8 text-destructive" />
              <p className="text-sm font-bold text-foreground">{loadError}</p>
              <Button size="sm" variant="outline" onClick={() => router.refresh()} className="text-xs h-8">
                {t('results.text_4')}
              </Button>
            </CardContent>
          </Card>
        )}

        {!loadError && attempt && (
        <>
        {/* Score Card Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-700 text-white shadow-xl shadow-indigo-600/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs font-semibold">
              {t('results.text_5')}
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {scorePercent >= 80 ? '🌟 Excellent Effort!' : '👍 Good Practice Session!'}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 max-w-md">
              {t('results.text_6')}
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto">
            <div className="text-right">
              <p className="text-xs text-indigo-200 uppercase font-semibold">Score</p>
              <p className="text-3xl sm:text-4xl font-black">
                {score}/{maxScore}
              </p>
              <p className="text-xs text-emerald-300 font-bold">{scorePercent}% Accuracy</p>
            </div>
            {attempt?.durationSec != null && (
              <div className="text-right border-l border-white/20 pl-6">
                <p className="text-xs text-indigo-200 uppercase font-semibold">Time Spent</p>
                <p className="text-2xl font-bold">
                  {Math.floor(attempt.durationSec / 60)}m {attempt.durationSec % 60}s
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Per-Topic Accuracy Breakdown (computed in code) */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">
              {t('results.text_7')}
            </CardTitle>
            <CardDescription className="text-xs">
              {t('results.text_8')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-2.5">
              {(!data?.perTopic || data.perTopic.length === 0) && (
                <p className="text-xs text-muted-foreground">
                  {t('results.text_9')}
                </p>
              )}
              {data?.perTopic?.map((p: any, idx: number) => {
                const isStrong = p.accuracy >= 80;
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-foreground">{p.topic}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">
                        {p.correct}/{p.total} correct
                      </span>
                      <Badge
                        variant={isStrong ? 'default' : 'secondary'}
                        className={`text-xs font-bold ${
                          isStrong
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {p.accuracy}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* AI Explanation for Parent Card */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>{t('results.text_10')}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {t('results.text_11')}
                </CardDescription>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenExplanation('en')}
                  disabled={explaining}
                  className="text-xs h-8"
                >
                  {explaining ? 'Analyzing...' : 'English'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenExplanation('bn')}
                  disabled={explaining}
                  className="text-xs h-8"
                >
                  {explaining ? 'বিশ্লেষণ হচ্ছে...' : 'বাংলায় দেখুন'}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {explanationError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-xs font-semibold">
                {explanationError}
              </div>
            )}
            {explanation ? (
              <div className="p-4 rounded-2xl bg-muted/30 border text-xs sm:text-sm leading-relaxed text-foreground">
                <FormattedMarkdown content={explanation.contentMd} />
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed rounded-2xl space-y-2">
                <Sparkles className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-xs font-bold text-foreground">
                  {t('results.text_12')}
                </p>
                <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                  Summarizes strengths, weak topics, and concrete questions to ask your child during study time.
                </p>
                <div className="pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleGenExplanation('en')}
                    disabled={explaining}
                    className="text-xs h-8"
                  >
                    {explaining ? 'Generating...' : 'Generate AI Explanation'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Per-Question Review List */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">
              {t('results.text_13')}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {(!attempt?.answers || attempt.answers.length === 0) && (
              <p className="text-xs text-muted-foreground">
                {t('results.text_14')}
              </p>
            )}
            {attempt?.answers?.map((a: any, idx: number) => (
              <div
                key={a.id || idx}
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  a.isCorrect
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : 'border-amber-500/20 bg-amber-500/5'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-foreground">
                    {idx + 1}. {a.question?.prompt}
                  </p>
                  <span
                    className={`font-bold flex items-center gap-1 text-[11px] shrink-0 ${
                      a.isCorrect
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {a.isCorrect ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Let&apos;s Practice
                      </>
                    )}
                  </span>
                </div>

                <div className="space-y-1 pl-4 border-l-2 border-border/60">
                  <p>
                    <span className="text-muted-foreground">Child Answer:</span>{' '}
                    <strong className={a.isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-400'}>
                      {a.answer || 'Not answered'}
                    </strong>
                  </p>
                  {!a.isCorrect && (
                    <p>
                      <span className="text-muted-foreground">Correct Answer:</span>{' '}
                      <strong className="text-emerald-700 dark:text-emerald-300">
                        {a.question?.correctAnswer}
                      </strong>
                    </p>
                  )}
                  {a.question?.explanation && (
                    <p className="text-muted-foreground italic text-[11px] pt-1">
                      {a.question.explanation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        </>
        )}

        {!loadError && !attempt && (
          <Card className="rounded-2xl border">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              {t('results.text_15')}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
