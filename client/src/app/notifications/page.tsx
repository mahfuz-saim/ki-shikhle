'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppShell } from '@/components/layout/app-shell';
import { useI18n } from '@/lib/i18n-context';
import { api } from '@/lib/api';
import {
  Bell,
  CheckCheck,
  Brain,
  Clock,
  AlertTriangle,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

export default function NotificationsPage() {
  const { t, isBn } = useI18n();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setList(res.data.data || []);
    } catch {
      setList([
        {
          id: 'n1',
          type: 'quiz_completed',
          title: isBn ? 'কুইজ সম্পন্ন হয়েছে' : 'Quiz Completed',
          message: isBn
            ? 'রহিম "পদার্থবিজ্ঞান ও বলবিদ্যা অধ্যায় কুইজ"-এ ৮/১০ স্কোর করেছে। ফলাফল ও এআই বিশ্লেষণ প্রস্তুত।'
            : 'Rahim completed "Physics & Newton Laws Chapter Quiz" with score 8/10. AI Explanation is ready.',
          link: '/attempts/att-1/results',
          readAt: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'n2',
          type: 'trial_reminder',
          title: isBn ? 'ট্রায়াল রিমাইন্ডার' : 'Trial Ending Soon',
          message: isBn
            ? 'আপনার ১৫ দিনের ফ্রি ট্রায়ালের ১২ দিন বাকি আছে। পূর্ণ সুবিধায় রাখতে প্ল্যান নির্বাচন করুন।'
            : '12 days left in your 15-day free trial. Choose a plan to keep unlimited AI quizzes.',
          link: '/billing',
          readAt: null,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'n3',
          type: 'missed_session',
          title: isBn ? 'পড়ার লগ মিস হয়েছে' : 'Missed Routine Session',
          message: isBn
            ? 'গতকাল বিকাল ৫:৩০ মিনিটে নির্ধারিত গণিত প্রাইভেটের কোনো লগ পাওয়া যায়নি।'
            : 'Yesterday\'s 5:30 PM Math Tuition has no recorded learning log.',
          link: '/schedule',
          readAt: new Date(Date.now() - 86400000).toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [isBn]);

  const handleMark = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
    } catch {
      setList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
    }
  };

  const handleMarkAll = async () => {
    try {
      await api.post('/notifications/read-all');
      setList((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    } catch {
      setList((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    }
  };

  const unreadCount = list.filter((n) => !n.readAt).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'quiz_completed':
        return <Brain className="w-4 h-4 text-primary" />;
      case 'trial_reminder':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'missed_session':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default:
        return <BookOpen className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {t('nav.notifications', 'Notifications')}
              </h1>
              {unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground text-xs font-bold">
                  {unreadCount} New
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Stay updated on child quiz submissions, routine reminders, and trial status.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            disabled={unreadCount === 0}
            className="text-xs h-8 gap-1.5"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all as read</span>
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {list.map((n) => {
            const isUnread = !n.readAt;
            return (
              <Card
                key={n.id}
                className={`rounded-2xl border transition-all ${
                  isUnread
                    ? 'border-primary/40 bg-card shadow-sm ring-1 ring-primary/20'
                    : 'bg-card/50 opacity-80'
                }`}
              >
                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      {getIcon(n.type)}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-foreground">{n.title || n.type}</p>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {n.message || JSON.stringify(n.payloadJson)}
                      </p>
                      <p className="text-[10px] text-muted-foreground pt-0.5">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                        • {new Date(n.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {n.link && (
                      <Link href={n.link}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-primary gap-1">
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    )}
                    {isUnread && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMark(n.id)}
                        className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        Dismiss
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
