'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppShell } from '@/components/layout/app-shell';
import { useI18n } from '@/lib/i18n-context';
import { api } from '@/lib/api';
import {
  Brain,
  CheckCircle2,
  Play,
  ArrowLeft,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function QuizDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, isBn } = useI18n();

  const id = (params as any)?.id as string;
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [assigned, setAssigned] = useState(false);

  useEffect(() => {
    api
      .get(`/quizzes/${id}`)
      .then((r) => setQuiz(r.data.data))
      .catch(() => {
        setQuiz({
          id,
          title: isBn ? 'পদার্থবিজ্ঞান ও নিউটনের সূত্র কুইজ' : 'Physics & Mechanics Chapter Quiz',
          status: 'assigned',
          timeLimitMin: 15,
          questions: [
            {
              id: 'q1',
              type: 'mcq',
              prompt: isBn ? 'নিউটনের দ্বিতীয় গতিসূত্র কোনটি?' : 'What is Newton\'s Second Law of Motion?',
              optionsJson: ['F = ma', 'E = mc²', 'v = u + at', 'W = Fd'],
              correctAnswer: 'F = ma',
              explanation: 'Force is the product of mass and acceleration.',
            },
            {
              id: 'q2',
              type: 'true_false',
              prompt: isBn ? 'ক্রিয়া এবং প্রতিক্রিয়া বল সর্বদা পরস্পর সমান ও বিপরীতমুখী।' : 'Action and reaction forces are always equal and opposite.',
              optionsJson: ['True', 'False'],
              correctAnswer: 'True',
              explanation: 'Newton\'s Third Law states every action has an equal and opposite reaction.',
            },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, [id, isBn]);

  const handleAssign = async () => {
    try {
      await api.post(`/quizzes/${id}/assign`);
      setAssigned(true);
    } catch {
      setAssigned(true);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="p-8 text-center text-xs text-muted-foreground">{t('common.loading', 'Loading quiz...')}</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Back navigation */}
        <div className="flex items-center gap-2">
          <Link href="/quizzes">
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Quizzes</span>
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {quiz.title}
              </h1>
              <Badge variant="secondary" className="text-xs uppercase font-semibold">
                {quiz.status || 'Draft'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <span>{quiz.questions?.length || 0} Questions</span>
              {quiz.timeLimitMin && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {quiz.timeLimitMin}m time limit
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleAssign}
              disabled={assigned || quiz.status === 'assigned'}
              variant="outline"
              size="sm"
              className="text-xs h-9 gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{assigned || quiz.status === 'assigned' ? 'Assigned to Child' : 'Assign to Child'}</span>
            </Button>
            <Link href={`/kid/quiz/${id}`}>
              <Button size="sm" className="text-xs h-9 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
                <Play className="w-4 h-4" />
                <span>Take in Child Mode</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-4">
          {quiz.questions?.map((q: any, idx: number) => (
            <Card key={q.id || idx} className="rounded-2xl border bg-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-sm font-semibold text-foreground">{q.prompt}</p>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-semibold shrink-0">
                  {q.type}
                </Badge>
              </div>

              {q.optionsJson && (
                <div className="grid sm:grid-cols-2 gap-2 pl-8">
                  {q.optionsJson.map((opt: string, j: number) => {
                    const isCorrect = opt === q.correctAnswer;
                    return (
                      <div
                        key={j}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
                          isCorrect
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                            : 'bg-muted/20 text-foreground'
                        }`}
                      >
                        <span>{opt}</span>
                        {isCorrect && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            ✓ Correct Answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {q.explanation && (
                <p className="text-xs text-muted-foreground pl-8 italic border-t pt-2">
                  <strong>Explanation:</strong> {q.explanation}
                </p>
              )}
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
