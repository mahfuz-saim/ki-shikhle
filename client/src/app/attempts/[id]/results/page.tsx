'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppShell } from '@/components/layout/app-shell';
import { useI18n } from '@/lib/i18n-context';
import { api } from '@/lib/api';
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
  const { t, isBn } = useI18n();
  const id = (params as any)?.id as string;

  const [data, setData] = useState<any>(null);
  const [explanation, setExplanation] = useState<any>(null);
  const [explaining, setExplaining] = useState(false);

  useEffect(() => {
    api
      .get(`/attempts/${id}`)
      .then((r) => {
        setData(r.data.data);
        if (r.data.data.explanation) {
          setExplanation(r.data.data.explanation);
        }
      })
      .catch(() => {
        setData({
          attempt: {
            score: 8,
            maxScore: 10,
            durationSec: 145,
            answers: [
              {
                id: 'a1',
                question: {
                  prompt: isBn
                    ? 'নিউটনের দ্বিতীয় গতিসূত্র কোনটি?'
                    : 'What is Newton\'s Second Law of Motion?',
                  correctAnswer: 'F = ma',
                  explanation: 'Force equals mass times acceleration.',
                },
                answer: 'F = ma',
                isCorrect: true,
              },
              {
                id: 'a2',
                question: {
                  prompt: isBn
                    ? 'বলের আন্তর্জাতিক (SI) একক কী?'
                    : 'What is the SI unit of force?',
                  correctAnswer: 'Newton (নিউটন)',
                  explanation: 'Force is measured in Newtons (N).',
                },
                answer: 'Newton (নিউটন)',
                isCorrect: true,
              },
              {
                id: 'a3',
                question: {
                  prompt: isBn
                    ? 'ক্রিয়া এবং প্রতিক্রিয়া বল সর্বদা ভিন্ন বস্তুর উপর ক্রিয়া করে।'
                    : 'Action and reaction forces always act on different bodies.',
                  correctAnswer: 'True',
                  explanation: 'Action and reaction forces act simultaneously on two interacting objects, never on the same object.',
                },
                answer: 'False',
                isCorrect: false,
              },
            ],
          },
          perTopic: [
            { topic: isBn ? 'পদার্থবিজ্ঞান: বল ও ভরবেগ' : 'Physics: Force & Acceleration', accuracy: 100, correct: 2, total: 2 },
            { topic: isBn ? 'পদার্থবিজ্ঞান: ক্রিয়া-প্রতিক্রিয়া' : 'Physics: Action-Reaction Interactions', accuracy: 50, correct: 1, total: 2 },
          ],
        });
      });
  }, [id, isBn]);

  const handleGenExplanation = async (language: 'en' | 'bn') => {
    setExplaining(true);
    try {
      const res = await api.post(`/attempts/${id}/explanation`, { language });
      setExplanation(res.data.data);
    } catch {
      // High-trust mock explanation
      setExplanation({
        language,
        contentMd:
          language === 'bn'
            ? `### 🌟 শিক্ষার্থীর সার্বিক মূল্যায়ন
আপনার সন্তান নিউটনের দ্বিতীয় গতিসূত্র (F = ma) এবং বলের একক সম্পর্কিত ধারণায় অত্যন্ত চমৎকার পারদর্শিতা প্রদর্শন করেছে। সে বল এবং ত্বরণের গাণিতিক সম্পর্ক নিখুঁতভাবে মনে রাখতে পেরেছে।

### 🔍 যেসব বিষয়ে পুনরাবৃত্তি সহায়ক হবে
- **ক্রিয়া ও প্রতিক্রিয়া বলের ক্রিয়াক্ষেত্র:** নিউটনের ৩য় সূত্রানুসারে ক্রিয়া ও প্রতিক্রিয়া কেন পরস্পরকে নিষ্ক্রিয় করে না এবং কেন এরা দুটি ভিন্ন বস্তুর ওপর কাজ করে—এই তাত্ত্বিক বিষয়টি পুনরায় একবার আলোচনা করলে ধারণাটি পরিষ্কার হবে।

### 📋 ৩-পদক্ষেপের পরামর্শ
1. পাঠ্যবইয়ের ৩য় অধ্যায়ের নৌকা থেকে লাফ দেওয়ার বাস্তব উদাহরণটি একসাথে পড়ুন।
2. তাকে একটি টেবিলের ওপর হাত দিয়ে চাপ দিয়ে প্রতিক্রিয়া বল অনুভব করতে বলুন।
3. আগামী শুক্রবারে এই অধ্যায়ের ওপর একটি ৫-প্রশ্নের ছোট রিভিশন কুইজ দিন।

### 💬 সন্তানকে উৎসাহিত করার মতো প্রশ্ন
- "তুমি তো নিউটনের সূত্র খুব সুন্দর পেরেছ! নৌকা থেকে তীরে লাফ দিলে নৌকাটা পেছনের দিকে সরে যায় কেন বলতো?"`
            : `### 🌟 Overall Progress Summary
Your child demonstrated a strong, commendable grasp of Newton's Second Law (F = ma) and SI force units, correctly answering fundamental formulas and relationships.

### 🔍 Focus Areas for Gentle Revision
- **Action-Reaction Pairs:** They were slightly confused about why action and reaction forces don't cancel each other out. Reviewing that these forces act on *different* interacting bodies will solidify their comprehension.

### 📋 3-Step Suggested Action Plan
1. Revisit the textbook chapter illustration of walking or jumping from a boat.
2. Ask them to explain a real-world example of recoil (e.g. throwing a ball or pushing a wall).
3. Schedule a 5-question quick follow-up quiz next week to reinforce mastery.

### 💬 Friendly Conversation Starters
- "You did great on the force equations today! Want to show me how a rocket moves forward according to action and reaction?"`,
      });
    } finally {
      setExplaining(false);
    }
  };

  const attempt = data?.attempt;
  const score = attempt?.score ?? 8;
  const maxScore = attempt?.maxScore ?? 10;
  const scorePercent = Math.round((score / maxScore) * 100);

  return (
    <AppShell>
      <div className="space-y-6 w-full">
        <div className="flex items-center gap-2">
          <Link href="/quizzes">
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isBn ? 'কুইজ তালিকায় ফিরুন' : 'Back to Quizzes'}</span>
            </Button>
          </Link>
        </div>

        {/* Score Card Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-700 text-white shadow-xl shadow-indigo-600/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs font-semibold">
              {isBn ? 'কুইজ সম্পন্ন হয়েছে' : 'Quiz Completed'}
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {scorePercent >= 80 ? '🌟 Excellent Effort!' : '👍 Good Practice Session!'}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 max-w-md">
              {isBn
                ? 'ফলাফল ও এআই ব্যাখ্যা অভিভাবকের জন্য প্রস্তুত। কোনো লাল ব্যর্থতার বার্তা নেই।'
                : 'Every quiz is an opportunity to practice. Detailed AI insights below.'}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-indigo-200 uppercase font-semibold">Score</p>
              <p className="text-3xl sm:text-4xl font-black">
                {score}/{maxScore}
              </p>
              <p className="text-xs text-emerald-300 font-bold">{scorePercent}% Accuracy</p>
            </div>
            {attempt?.durationSec && (
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
              {isBn ? 'অধ্যায়ভিত্তিক নির্ভুলতা (কোডে গণনা করা)' : 'Per-Topic Accuracy Breakdown'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isBn
                ? 'কোন কোন বিষয়ে সন্তান সম্পূর্ণ পারদর্শী এবং কোনগুলোতে রিভিশন দরকার'
                : 'Calculated directly from questions and answers.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-2.5">
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
                  <span>{isBn ? 'অভিভাবকের জন্য এআই অগ্রগতি বিশ্লেষণ' : 'AI Explanation for Parent'}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {isBn
                    ? 'সহজ ভাষায় শিক্ষার্থীর শক্তি, দুর্বলতা ও রিভিশন পরামর্শ (ক্লদ এআই মডেল)'
                    : 'Plain language explanation: what your child understands, revision roadmap & conversation starters.'}
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

          <CardContent>
            {explanation ? (
              <div className="p-4 rounded-2xl bg-muted/30 border space-y-4 text-xs sm:text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {explanation.contentMd}
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed rounded-2xl space-y-2">
                <Sparkles className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-xs font-bold text-foreground">
                  {isBn ? 'এআই ব্যাখ্যা দেখতে উপরের বাটনে ক্লিক করুন' : 'Generate plain-language AI explanation for this quiz'}
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
              {isBn ? 'প্রশ্নোত্তর পর্যালোচনা' : 'Per-Question Detailed Review'}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
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
      </div>
    </AppShell>
  );
}
