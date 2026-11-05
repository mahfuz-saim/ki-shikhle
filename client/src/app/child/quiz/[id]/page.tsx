'use client';

export const runtime = 'edge';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KidShell } from '@/components/layout/kid-shell';
import { useAuth } from '@/components/auth/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { api } from '@/lib/api';
import { QuizTakingSkeleton } from '@/components/ui/skeleton';
import {
  Brain,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Bookmark,
  Sparkles,
} from 'lucide-react';

export default function TakeQuiz() {
  const params = useParams();
  const router = useRouter();
  const { activeChild } = useAuth();
  const { isBn } = useI18n();

  const quizId = (params as any)?.id as string;
  // The child this attempt belongs to. It used to fall back to the literal string
  // `'demo-child'`, which is not a real id — the server answered 404 and the page
  // invented an attempt called `att-1`.
  const childId = activeChild?.id || null;

  const [quiz, setQuiz] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [idx, setIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');

  /**
   * The attempt is created **once** per quiz.
   *
   * The old effect had `isBn` in its dependency list, so switching the UI language
   * re-ran it and POSTed a brand-new attempt — orphaning the previous one and
   * resetting the student's progress. The `isBn` flag is read inside the render
   * instead of being a dependency.
   */
  const attemptStartedFor = useRef<string | null>(null);

  /**
   * The locale is read through a ref rather than as an effect dependency.
   *
   * A locale toggle used to re-run the two effects below — re-fetching the quiz
   * and, in the sibling page, POSTing a brand-new attempt. The locale only
   * affects the *copy* of an error message, so it is read at call time.
   */
  const isBnRef = useRef(isBn);
  useEffect(() => {
    isBnRef.current = isBn;
  }, [isBn]);

  useEffect(() => {
    if (!quizId) return;
    let isMounted = true;

    api
      .get(`/quizzes/${quizId}`)
      .then((r) => {
        if (!isMounted) return;
        const q = r.data.data;
        // Strip correct answers for student view. The server already strips these for a
        // child actor; this is defence in depth for a parent previewing the page.
        if (q?.questions) {
          q.questions = q.questions.map((qq: any) => ({
            ...qq,
            correctAnswer: undefined,
            correct_answer: undefined,
          }));
        }
        setQuiz(q);
        if (q?.timeLimitMin) setTimeLeft(q.timeLimitMin * 60);
      })
      .catch((err) => {
        if (!isMounted) return;
        // A quiz that cannot be loaded is an error, not a reason to invent one.
        const serverMsg = err?.response?.data?.error?.message;
        setLoadError(
          serverMsg ||
          (isBnRef.current ? 'কুইজটি লোড করা যায়নি।' : 'Could not load this quiz.')
        );
        setQuiz(null);
      });

    return () => {
      isMounted = false;
    };
    // `isBn` is intentionally NOT a dependency — it re-runs on every locale toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  useEffect(() => {
    if (!quizId || !childId) return;
    if (attemptStartedFor.current === quizId) return;
    attemptStartedFor.current = quizId;
    let isMounted = true;

    api
      .post(`/quizzes/${quizId}/attempts`, { childId })
      .then((r) => {
        if (isMounted) setAttempt(r.data.data);
      })
      .catch((err) => {
        if (!isMounted) return;
        const serverMsg = err?.response?.data?.error?.message;
        setSubmitError(
          serverMsg ||
          (isBnRef.current ? 'কুইজ শুরু করা যায়নি।' : 'Could not start the attempt.')
        );
      });

    return () => {
      isMounted = false;
    };
    // `isBn` is intentionally NOT a dependency — a locale toggle must not
    // re-create the attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, childId]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const handleSelectOption = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSaveProgress = async () => {
    if (!attempt) return;
    const payload = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer,
    }));
    try {
      await api.put(`/attempts/${attempt.id}/answers`, { answers: payload });
      setSaveMsg(isBn ? 'অগ্রগতি সংরক্ষিত হয়েছে!' : 'Progress saved! You can resume anytime.');
    } catch {
      // Do not claim a save that did not happen.
      setSaveMsg(
        isBn ? 'অগ্রগতি সংরক্ষণ করা যায়নি।' : 'Could not save your progress. Please try again.'
      );
    }
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError('');
    const payload = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer,
    }));
    const attemptId = attempt?.id;

    // Without a real attempt there is nothing to submit. The old code fell back to
    // the literal `'att-1'` and pushed a results page for an attempt that never
    // existed — which rendered a hardcoded 8/10.
    if (!attemptId) {
      setSubmitError(
        isBn ? 'কুইজ শুরু করা যায়নি। আবার চেষ্টা করুন।' : 'The attempt could not be started. Please try again.'
      );
      setSubmitting(false);
      return;
    }

    try {
      await api.put(`/attempts/${attemptId}/answers`, { answers: payload });
      await api.post(`/attempts/${attemptId}/submit`);
      router.push(`/attempts/${attemptId}/results`);
    } catch (err: any) {
      // Navigating to the results page on failure showed a score for work that was
      // never recorded.
      const serverMsg = err?.response?.data?.error?.message;
      setSubmitError(
        serverMsg ||
        (isBn ? 'উত্তর জমা দেওয়া যায়নি। আবার চেষ্টা করুন।' : 'Could not submit your answers. Please try again.')
      );
      setSubmitting(false);
    }
  };

  if (!quiz) {
    return (
      <KidShell>
        {loadError ? (
          <div className="p-4 rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive text-xs font-semibold">
            {loadError}
          </div>
        ) : (
          <QuizTakingSkeleton />
        )}
      </KidShell>
    );
  }

  const currentQ = quiz.questions?.[idx];
  const totalQ = quiz.questions?.length || 1;
  const progressPercent = Math.round(((idx + 1) / totalQ) * 100);
  const qOptions = currentQ?.optionsJson || currentQ?.options;

  return (
    <KidShell>
      <div className="space-y-6 w-full page-fade">
        {/* Top Quiz Bar */}
        <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border bg-card/80 backdrop-blur shadow-sm">
          <div>
            <h1 className="text-base font-bold text-foreground truncate">{quiz.title}</h1>
            <p className="text-xs text-muted-foreground">
              {isBn ? `প্রশ্ন ${idx + 1} / ${totalQ}` : `Question ${idx + 1} of ${totalQ}`}
            </p>
          </div>

          {timeLeft !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold border border-amber-500/20">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {saveMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold text-center">
            {saveMsg}
          </div>
        )}

        {submitError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold text-center">
            {submitError}
          </div>
        )}

        {/* Current Question Card */}
        {currentQ && (
          <Card className="rounded-3xl border shadow-lg bg-card p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  Question {idx + 1}
                </span>
                {currentQ.topic && (
                  <Badge variant="outline" className="text-[10px]">
                    {currentQ.topic}
                  </Badge>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-foreground leading-snug">
                {currentQ.prompt}
              </h2>
            </div>

            {/* MCQ Options */}
            {qOptions && (
              <div className="space-y-2.5">
                {qOptions.map((opt: string) => {
                  const isSelected = answers[currentQ.id] === opt;
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => handleSelectOption(currentQ.id, opt)}
                      className={`w-full p-4 rounded-2xl border text-left text-sm font-semibold transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-[1.01]'
                          : 'border-border bg-card hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <span>{opt}</span>
                      <span
                        className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                          isSelected ? 'border-white bg-white text-indigo-600 font-bold' : 'border-muted-foreground/40'
                        }`}
                      >
                        {isSelected ? '✓' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Fill-in-the-blank input */}
            {currentQ.type === 'fill_blank' && (
              <div>
                <input
                  type="text"
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => handleSelectOption(currentQ.id, e.target.value)}
                  placeholder={isBn ? 'এখানে তোমার উত্তর লেখো...' : 'Type your answer here...'}
                  className="w-full h-12 border rounded-2xl px-4 text-sm bg-background font-medium"
                />
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={idx === 0}
                onClick={() => setIdx(idx - 1)}
                className="text-xs rounded-xl h-9 gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveProgress}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <Bookmark className="w-3.5 h-3.5 mr-1" />
                <span>Save</span>
              </Button>

              {idx < totalQ - 1 ? (
                <Button
                  size="sm"
                  onClick={() => setIdx(idx + 1)}
                  className="text-xs rounded-xl h-9 gap-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="text-xs rounded-xl h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Submitting...' : 'Submit Quiz 🎉'}</span>
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </KidShell>
  );
}
