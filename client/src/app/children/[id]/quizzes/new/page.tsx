'use client';

export const runtime = 'edge';

import { Suspense, useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth, Child } from '@/components/auth/auth-context';
import { useI18n, type Translator } from '@/lib/i18n-context';
import { api } from '@/lib/api';
import { quizLanguageMode } from '@/lib/quiz-language';
import {
  Brain,
  Sparkles,
  Check,
  RefreshCw,
  Trash2,
  Clock,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileCheck,
  AlertCircle,
} from 'lucide-react';

/**
 * No demo fixture list.
 *
 * The old `DEFAULT_DEMO_CHILDREN` was used whenever the account had no children, so
 * the quiz builder fetched and generated for `demo-child-1` — a child belonging to the
 * demo tenant. The ids were also stale (the demo children are deterministic UUIDs now).
 */

/**
 * The subjects a child of this grade can be quizzed on.
 *
 * `t` is passed in rather than read from `useI18n()`: this is a module-level
 * function, and a hook cannot be called outside a component.
 */
function getSubjectsForGrade(gradeStr: string | undefined, isBn: boolean | undefined, t: Translator) {
  const g = (gradeStr || '').toLowerCase();
  if (g.includes('5') || g.includes('primary') || g.includes('প্রাথমিক') || g.includes('class 4') || g.includes('class 3')) {
    return [
      { id: 'math', name: t('quizNew.elementary_math') },
      { id: 'science', name: t('quizNew.primary_science') },
      { id: 'eng', name: t('quizNew.english_for_today') },
      { id: 'bn', name: t('quizNew.bangla') },
      { id: 'bgs', name: t('quizNew.bgs') },
    ];
  }
  if (g.includes('11') || g.includes('12') || g.includes('hsc') || g.includes('college') || g.includes('একাদশ') || g.includes('দ্বাদশ')) {
    return [
      { id: 'hmath', name: t('quizNew.higher_math') },
      { id: 'phys', name: t('quizNew.physics') },
      { id: 'chem', name: t('quizNew.chemistry') },
      { id: 'bio', name: t('quizNew.biology') },
      { id: 'ict', name: t('quizNew.ict') },
      { id: 'eng', name: t('quizNew.english') },
      { id: 'bn', name: t('quizNew.bangla') },
    ];
  }
  return [
    { id: 'math', name: t('quizNew.mathematics') },
    { id: 'phys', name: t('quizNew.science') },
    { id: 'chem', name: t('quizNew.chemistry') },
    { id: 'eng', name: t('quizNew.english') },
    { id: 'bn', name: t('quizNew.bangla') },
    { id: 'ict', name: t('quizNew.ict') },
  ];
}

function QuizBuilderContent() {
  const params = useParams();
  const router = useRouter();
  const { activeChild, childrenList } = useAuth();
  const { t, isBn } = useI18n();

  // The URL is the source of truth for which child this page is about.
  //
  // The old code checked `activeChild` FIRST, so `/children/<id>/quizzes/new` was
  // inert whenever an active child was set — the quiz was generated for the wrong
  // child. Now the route segment wins, and the active child is the fallback for a
  // route without one.
  const routeChildId = (params as any)?.id as string | undefined;
  const availableChildren = childrenList || [];
  const currentChild =
    (routeChildId ? availableChildren.find((c) => c.id === routeChildId) : null) ||
    activeChild ||
    availableChildren[0] ||
    null;
  const childId = currentChild?.id || routeChildId || null;

  const searchParams = useSearchParams();
  const queryTopic = searchParams.get('topic') || '';
  const querySubject = searchParams.get('subject') || '';
  const queryTitle = searchParams.get('title') || '';

  const mapSubjectToId = (s: string) => {
    if (!s) return null;
    const lower = s.toLowerCase();
    if (lower.includes('math') || lower.includes('গণিত') || lower.includes('algebra') || lower.includes('বীজগণিত')) return 'math';
    if (lower.includes('phys') || lower.includes('পদার্থ')) return 'phys';
    if (lower.includes('chem') || lower.includes('রসায়ন')) return 'chem';
    if (lower.includes('bio') || lower.includes('জীব')) return 'bio';
    if (lower.includes('eng') || lower.includes('ইংরেজি')) return 'eng';
    if (lower.includes('bn') || lower.includes('bangla') || lower.includes('বাংলা')) return 'bn';
    if (lower.includes('ict') || lower.includes('তথ্য')) return 'ict';
    if (lower.includes('science') || lower.includes('বিজ্ঞান')) return 'science';
    return null;
  };

  const initialSubjectId = mapSubjectToId(querySubject) || mapSubjectToId(queryTopic);
  const initialSelectedSubjects = initialSubjectId ? [initialSubjectId] : ['math', 'phys'];

  const initialTitle = queryTitle
    ? queryTitle
    : queryTopic
    ? `${queryTopic} — ${t('quizNew.text')}`
    : querySubject
    ? `${querySubject} — ${t('quizNew.text')}`
    : '';

  const [form, setForm] = useState({
    scope: queryTopic ? 'today' : 'last7',
    from: '',
    to: '',
    numQuestions: 10,
    difficulty: 'mixed',
    types: ['mcq', 'true_false', 'fill_blank'],
    title: initialTitle,
    timeLimitMin: 15,
  });

  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [assigning, setAssigning] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [error, setError] = useState('');

  const subjects = getSubjectsForGrade(currentChild?.grade, isBn, t);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(initialSelectedSubjects);
  const outputLanguage = quizLanguageMode(currentChild?.medium, selectedSubjects);

  // Sync subjects when the child changes.
  //
  // The old dependency list was `[currentChild?.id, isBn]` while the body read
  // `querySubject` / `queryTopic` — so a subject pre-selected from the Notes page
  // (which arrives as a query parameter) was overwritten by the grade default.
  useEffect(() => {
    if (currentChild?.grade && !querySubject && !queryTopic) {
      const gradeSubs = getSubjectsForGrade(currentChild.grade, isBn, t);
      setSelectedSubjects(gradeSubs.slice(0, 2).map((s) => s.id));
      setPreview(null);
    }
  }, [currentChild?.id, currentChild?.grade, querySubject, queryTopic]);

  // Sync if query parameters change
  useEffect(() => {
    if (queryTitle || queryTopic || querySubject) {
      const computedTitle = queryTitle
        ? queryTitle
        : queryTopic
        ? `${queryTopic} — ${t('quizNew.text')}`
        : querySubject
        ? `${querySubject} — ${t('quizNew.text')}`
        : '';
      if (computedTitle) {
        setForm((prev) => ({ ...prev, title: computedTitle, scope: queryTopic ? 'today' : prev.scope }));
      }
      const matched = mapSubjectToId(querySubject) || mapSubjectToId(queryTopic);
      if (matched) {
        setSelectedSubjects([matched]);
      }
    }
  }, [queryTitle, queryTopic, querySubject, isBn]);

  const toggleSubject = (id: string) => {
    if (selectedSubjects.includes(id)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter((s) => s !== id));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, id]);
    }
  };

  const handleGenerate = async () => {
    if (!childId || generating) return;
    setError('');
    setMsg('');
    setPreview(null);
    setGenerating(true);
    try {
      const res = await api.post(`/children/${childId}/quizzes/generate`, {
        ...form,
        numQuestions: form.numQuestions,
        subjectIds: selectedSubjects,
        language: outputLanguage === 'mixed' ? 'bn' : outputLanguage,
        timeLimitMin: form.timeLimitMin,
      });
      setPreview(res.data.data);
      setMsg(t('quizNew.text_2'));
    } catch (error: any) {
      setPreview(null);
      setError(error?.response?.data?.error?.message || error.message || t('quizNew.generationFailed'));
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateQuestion = async (qid: string) => {
    setRegeneratingId(qid);
    try {
      const res = await api.post(`/quizzes/${preview.id}/questions/${qid}/regenerate`);
      const newQ = res.data.data;
      setPreview({
        ...preview,
        questions: preview.questions.map((q: any) => (q.id === qid ? newQ : q)),
      });
    } catch (e: any) {
      // The question was NOT regenerated. Appending "Regenerated alternative with
      // fresh parameters" to the prompt pretended it was, and the parent would
      // assign a quiz containing a nonsense question.
      setErrorMsg(e?.response?.data?.error?.message || 'The question could not be regenerated.');
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleRemoveQuestion = (qid: string) => {
    setPreview({
      ...preview,
      questions: preview.questions.filter((q: any) => q.id !== qid),
    });
  };

  const handleAssign = async () => {
    if (!preview) return;
    setAssigning(true);
    try {
      await api.post(`/quizzes/${preview.id}/assign`);
      setMsg(
        t('quizNew.quiz_successfully_assigned_to', { p0: isBn ? currentChild?.name || 'শিক্ষার্থী' : currentChild?.name || 'child' }, `Quiz successfully assigned to ${currentChild?.name || 'child'}!`)
      );
      setTimeout(() => {
        router.push('/quizzes');
      }, 1000);
    } catch (e: any) {
      // The quiz was NOT assigned. Reporting success and navigating away hid the
      // failure completely — the parent went to the quiz list and found nothing
      // there, with no explanation.
      setErrorMsg(e?.response?.data?.error?.message || 'The quiz could not be assigned.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 w-full">
        {/* Header */}
        <div className="pb-2 border-b">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {t('quiz.builderTitle', 'AI Quiz Builder')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('quizNew.text_28')}
          </p>
        </div>

        {msg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
            <span>{msg}</span>
            <button onClick={() => setMsg('')} className="underline text-[11px]">
              {t('common.dismiss')}
            </button>
          </div>
        )}

        {/* Error Alert — a failed request is never shown in the success banner. */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="underline text-[11px]">
              {t('common.dismiss')}
            </button>
          </div>
        )}

        {/* Configuration Card */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{t('quizNew.text_29')}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {t('quizNew.text_30')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Title */}
            <div>
              <Label className="text-xs font-semibold">Quiz Title (Optional)</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t('quizNew.text_31')}
                className="mt-1"
              />
            </div>

            {/* Scope & Difficulty */}
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-semibold">{t('quiz.scope', 'Lessons Scope')}</Label>
                <select
                  value={form.scope}
                  onChange={(e) => setForm({ ...form, scope: e.target.value })}
                  className="w-full h-10 border rounded-xl px-3 bg-background text-sm mt-1"
                >
                  <option value="today">{t('quizNew.text_32')}</option>
                  <option value="yesterday">{t('quizNew.text_33')}</option>
                  <option value="last7">{t('quizNew.text_34')}</option>
                  <option value="last30">{t('quizNew.text_35')}</option>
                  <option value="all">{t('quizNew.text_36')}</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold">{t('quiz.numQuestions', 'Number of Questions')}</Label>
                <select
                  value={form.numQuestions}
                  onChange={(e) => setForm({ ...form, numQuestions: parseInt(e.target.value) || 10 })}
                  className="w-full h-10 border rounded-xl px-3 bg-background text-sm mt-1"
                >
                  <option value={5}>5 Questions (Quick)</option>
                  <option value={10}>10 Questions (Standard)</option>
                  <option value={15}>15 Questions (Thorough)</option>
                  <option value={20}>20 Questions (Exam Prep)</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold">{t('quiz.difficulty', 'Difficulty')}</Label>
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                  className="w-full h-10 border rounded-xl px-3 bg-background text-sm mt-1"
                >
                  <option value="easy">Easy (Foundations)</option>
                  <option value="mixed">Mixed (Balanced)</option>
                  <option value="hard">Hard (Challenging)</option>
                </select>
              </div>
            </div>

            {/* Subjects selection */}
            <div>
              <Label className="text-xs font-semibold block mb-1.5">Include Subjects</Label>
              <div className="flex flex-wrap gap-2">
                {subjects.map((s) => {
                  const isSelected = selectedSubjects.includes(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggleSubject(s.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language & Time Limit */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">{t('quiz.language', 'Language')}</Label>
                <select
                  value={outputLanguage}
                  disabled
                  className="w-full h-10 border rounded-xl px-3 bg-background text-sm mt-1"
                >
                  <option value="en">English</option>
                  <option value="bn">বাংলা (Bangla)</option>
                  <option value="mixed">{t('quizNew.subjectBasedLanguage')}</option>
                </select>
                <p className="text-[11px] text-muted-foreground mt-1">{t('quizNew.languagePolicy')}</p>
              </div>

              <div>
                <Label className="text-xs font-semibold">Time Limit (Timer)</Label>
                <select
                  value={form.timeLimitMin}
                  onChange={(e) => setForm({ ...form, timeLimitMin: parseInt(e.target.value) || 0 })}
                  className="w-full h-10 border rounded-xl px-3 bg-background text-sm mt-1"
                >
                  <option value={0}>No time limit</option>
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={20}>20 minutes</option>
                </select>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full h-10 text-xs font-semibold gap-2 shadow-sm shadow-primary/20"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>
                {generating
                  ? t('quizNew.text_37')
                  : t('quizNew.generate_ai_quiz_for', { p0: isBn ? currentChild?.name : currentChild?.name || 'Child' }, `Generate AI Quiz for ${currentChild?.name || 'Child'}`)}
              </span>
            </Button>
          </CardContent>
        </Card>

        {/* Generated Questions Preview */}
        {preview && (
          <Card className="rounded-2xl border shadow-md animate-in fade-in duration-300">
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold text-foreground">{preview.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {preview.questions?.length} Questions
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-0.5">
                    {t('quizNew.text_38')}
                  </CardDescription>
                </div>

                <Button
                  onClick={handleAssign}
                  disabled={assigning || !preview.questions?.length}
                  className="h-9 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {assigning
                      ? t('quizNew.text_39')
                      : t('quizNew.assign_to', { p0: isBn ? currentChild?.name : currentChild?.name || 'Child' }, `Assign to ${currentChild?.name || 'Child'}`)}
                  </span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {preview.questions?.map((q: any, idx: number) => {
                const isRegenerating = regeneratingId === q.id;
                return (
                  <div key={q.id || idx} className="p-4 rounded-xl border bg-muted/20 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          {q.prompt}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0 uppercase">
                        {q.type}
                      </Badge>
                    </div>

                    {/* MCQ Options */}
                    {q.optionsJson && (
                      <div className="grid sm:grid-cols-2 gap-2 pl-8">
                        {q.optionsJson.map((opt: string, j: number) => {
                          const isCorrect = opt === q.correctAnswer;
                          return (
                            <div
                              key={j}
                              className={`p-2 rounded-lg text-xs border font-medium flex items-center justify-between ${
                                isCorrect
                                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-background text-foreground'
                              }`}
                            >
                              <span>{opt}</span>
                              {isCorrect && (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  ✓ Correct
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <p className="text-[11px] text-muted-foreground pl-8 italic">
                        <strong>Explanation:</strong> {q.explanation}
                      </p>
                    )}

                    {/* Question actions */}
                    <div className="flex justify-end items-center gap-2 pt-2 border-t text-xs">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRegenerateQuestion(q.id)}
                        disabled={isRegenerating}
                        className="h-7 text-[11px] gap-1 text-primary hover:bg-primary/10"
                      >
                        <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                        <span>{t('quiz.regenerateQuestion', 'Regenerate')}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="h-7 text-[11px] text-muted-foreground hover:text-destructive gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{t('quiz.removeQuestion', 'Remove')}</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

export default function QuizBuilder() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading quiz builder...</div>}>
      <QuizBuilderContent />
    </Suspense>
  );
}
