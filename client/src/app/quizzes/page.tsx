'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/components/auth/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { api } from '@/lib/api';
import {
  Brain,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Eye,
  Award,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export default function QuizzesPage() {
  const { activeChild } = useAuth();
  const { t, isBn } = useI18n();

  const childId = activeChild?.id || 'demo-child';

  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'completed' | 'draft'>('all');

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/children/${childId}/quizzes`);
      setQuizzes(res.data.data || []);
    } catch {
      // Mock realistic quizzes for demo
      setQuizzes([
        {
          id: 'q1',
          title: isBn ? 'পদার্থবিজ্ঞান ও বলবিদ্যা অধ্যায় কুইজ' : 'Physics & Newton Laws Chapter Quiz',
          subject: 'Physics',
          questionCount: 10,
          difficulty: 'mixed',
          status: 'completed',
          score: 8,
          maxScore: 10,
          attemptId: 'att-1',
          timeLimitMin: 15,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'q2',
          title: isBn ? 'গণিত: দ্বিঘাত সমীকরণ রিভিশন' : 'Mathematics: Quadratic Equations Revision',
          subject: 'Mathematics',
          questionCount: 10,
          difficulty: 'easy',
          status: 'assigned',
          score: null,
          maxScore: 10,
          timeLimitMin: 10,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'q3',
          title: isBn ? 'রসায়ন: পর্যায় সারণি ও যৌগ' : 'Chemistry: Periodic Table & Bonding',
          subject: 'Chemistry',
          questionCount: 5,
          difficulty: 'mixed',
          status: 'draft',
          score: null,
          maxScore: 5,
          timeLimitMin: null,
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, [childId]);

  const filteredQuizzes = quizzes.filter((q) => {
    if (filter === 'all') return true;
    return q.status === filter;
  });

  const completedCount = quizzes.filter((q) => q.status === 'completed').length;
  const assignedCount = quizzes.filter((q) => q.status === 'assigned').length;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {t('quiz.title', 'AI Quizzes')}
              </h1>
              {activeChild && (
                <Badge variant="secondary" className="text-xs">
                  {activeChild.name}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isBn
                ? 'ক্লাস নোট ও পড়ার লগ থেকে স্বয়ংক্রিয় কুইজ তৈরি ও ফলাফল বিশ্লেষণ'
                : 'Custom quizzes generated from your child\'s real lesson notes with AI progress explanations.'}
            </p>
          </div>

          <Link href={`/children/${childId}/quizzes/new`}>
            <Button size="sm" className="gap-1.5 text-xs h-9 shadow-sm shadow-primary/20">
              <Plus className="w-4 h-4" />
              <span>{t('quiz.builderTitle', 'Create AI Quiz')}</span>
            </Button>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Card className="rounded-2xl border p-4 bg-card/60 backdrop-blur shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isBn ? 'মোট কুইজ' : 'Total Quizzes'}
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">{quizzes.length}</p>
          </Card>
          <Card className="rounded-2xl border p-4 bg-card/60 backdrop-blur shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isBn ? 'অ্যাসাইনকৃত' : 'Pending / Assigned'}
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {assignedCount}
            </p>
          </Card>
          <Card className="rounded-2xl border p-4 bg-card/60 backdrop-blur shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isBn ? 'সম্পন্ন' : 'Completed'}
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {completedCount}
            </p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 border-b pb-2">
          {(['all', 'assigned', 'completed', 'draft'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                filter === st
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Quizzes List */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.map((q) => {
            const isCompleted = q.status === 'completed';
            const isAssigned = q.status === 'assigned';
            return (
              <Card
                key={q.id}
                className="rounded-2xl border bg-card hover:shadow-md transition-all flex flex-col justify-between"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] font-semibold">
                      {q.subject || 'General'}
                    </Badge>

                    <Badge
                      variant={isCompleted ? 'default' : isAssigned ? 'secondary' : 'outline'}
                      className={`text-[10px] capitalize font-semibold ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isAssigned
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          : ''
                      }`}
                    >
                      {q.status}
                    </Badge>
                  </div>

                  <CardTitle className="text-base font-bold text-foreground mt-2 line-clamp-2">
                    {q.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-4">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Brain className="w-3.5 h-3.5 text-primary" />
                      {q.questionCount || 10} Questions
                    </span>
                    <span>•</span>
                    <span className="capitalize">{q.difficulty || 'mixed'}</span>
                    {q.timeLimitMin && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {q.timeLimitMin}m
                        </span>
                      </>
                    )}
                  </div>

                  {/* Score if completed */}
                  {isCompleted && q.score !== null && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <Award className="w-4 h-4" />
                        {isBn ? 'অর্জিত স্কোর' : 'Score Achieved'}
                      </span>
                      <strong className="text-emerald-700 dark:text-emerald-300 font-extrabold text-sm">
                        {q.score}/{q.maxScore || 10} ({Math.round(((q.score || 0) / (q.maxScore || 10)) * 100)}%)
                      </strong>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t flex items-center gap-2">
                    {isCompleted ? (
                      <Link href={`/attempts/${q.attemptId || 'att-1'}/results`} className="w-full">
                        <Button variant="outline" size="sm" className="w-full text-xs h-8 gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isBn ? 'ফলাফল ও এআই বিশ্লেষণ' : 'View AI Results'}</span>
                        </Button>
                      </Link>
                    ) : (
                      <>
                        <Link href={`/quizzes/${q.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full text-xs h-8 gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isBn ? 'পর্যালোচনা' : 'Review'}</span>
                          </Button>
                        </Link>
                        <Link href={`/kid/quiz/${q.id}`} className="flex-1">
                          <Button size="sm" className="w-full text-xs h-8 gap-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Play className="w-3.5 h-3.5" />
                            <span>{isBn ? 'কুইজ দিন' : 'Take Quiz'}</span>
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
