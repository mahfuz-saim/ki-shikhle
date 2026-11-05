'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppShell } from '@/components/layout/app-shell';
import { NotificationListSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/auth/auth-context';
import { useI18n, type Translator } from '@/lib/i18n-context';
import { api } from '@/lib/api';
import { demoProfileOf } from '@/lib/child-scope';
import {
  Bell,
  CheckCheck,
  Brain,
  Clock,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  User,
} from 'lucide-react';

function toBnNum(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
}

interface ParsedNotification {
  title: string;
  message: string;
  link?: string;
  actionText: string;
  childName?: string;
  scoreBadge?: {
    score: number;
    maxScore: number;
    pct: number;
  };
}

/**
 * Turn a stored notification into something renderable.
 *
 * `t` is passed in rather than read from `useI18n()`: this is a module-level
 * function, and a hook cannot be called outside a component.
 */
function parseNotification(
  n: any,
  childrenList: any[],
  isBn: boolean,
  t: Translator
): ParsedNotification {
  let payload = n.payloadJson;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      payload = {};
    }
  }
  if (!payload || typeof payload !== 'object') {
    payload = {};
  }

  // Determine child name
  const childId = payload.childId || n.childId;
  let childName = payload.childName || '';
  if (!childName && childId) {
    const found = childrenList?.find((c: any) => c.id === childId);
    if (found) {
      childName = found.name || found.nickname;
    } else {
      // The demo children's ids moved to UUIDs, so `childId === 'demo-child-1'`
      // never matched. The name is resolved from the demo profile instead.
      const demo = childrenList?.find((c: any) => demoProfileOf(c) === 'rahim');
      if (demo) childName = demo.name || demo.nickname || (t('notifications.text'));
    }
  } else if (!childName && (n.type === 'quiz_completed' || n.type === 'results_ready')) {
    const demo = childrenList?.find((c: any) => demoProfileOf(c) === 'rahim');
    childName = demo?.name || demo?.nickname || (t('notifications.text'));
  }

  // Localize Rahim Ahmed and Tasnim Islam when in Bengali
  if (isBn && childName === 'Rahim Ahmed') childName = 'রহিম আহমেদ';
  if (isBn && childName === 'Tasnim Islam') childName = 'তাসনিম ইসলাম';

  // Quiz Completed
  if (n.type === 'quiz_completed' || n.type === 'results_ready') {
    const title = t('notifications.text_2');
    const score = typeof payload.score === 'number' ? payload.score : 0;
    const maxScore = typeof payload.maxScore === 'number' ? payload.maxScore : 0;
    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const quizTitle = payload.quizTitle || (t('notifications.text_3'));
    const childDisplayName = childName || (t('notifications.text_4'));

    let message = n.message;
    // Format friendly text if message is missing or raw JSON string
    if (!message || message.trim().startsWith('{') || message.trim() === 'quiz_completed') {
      if (isBn) {
        message = `${childDisplayName} "${quizTitle}" কুইজটি সম্পন্ন করেছে। অর্জিত স্কোর: ${toBnNum(score)}/${toBnNum(maxScore)} (${toBnNum(pct)}%)। ফলাফল ও বিস্তারিত বিশ্লেষণ দেখতে পারেন।`;
      } else {
        message = `${childDisplayName} completed "${quizTitle}" with a final score of ${score}/${maxScore} (${pct}%). Click below to view analysis and explanations.`;
      }
    }

    const attemptId = payload.attemptId;
    const link = n.link || (attemptId ? `/attempts/${attemptId}/results` : '/quizzes');

    return {
      title,
      message,
      link,
      actionText: t('notifications.text_5'),
      childName: childDisplayName,
      scoreBadge: { score, maxScore, pct },
    };
  }

  // Plan / Upgrade Notification
  if (n.type === 'trial_reminder' || n.type === 'plan_update') {
    const title = t('notifications.text_6');
    let message = n.message;
    if (!message || message.trim().startsWith('{')) {
      message = t('notifications.text_7');
    }
    return {
      title,
      message,
      link: n.link || '/billing',
      actionText: t('notifications.text_8'),
    };
  }

  // Missed Session
  if (n.type === 'missed_session' || n.type === 'missed_sessions') {
    const title = t('notifications.text_9');
    let message = n.message;
    if (!message || message.trim().startsWith('{')) {
      message = t('notifications.yesterday_s_scheduled_study_session_has_no_recor');
    }
    return {
      title,
      message,
      link: n.link || '/schedule',
      actionText: t('notifications.text_10'),
    };
  }

  // Generic fallback
  const rawTitle = n.title;
  const title =
    rawTitle && rawTitle !== n.type
      ? rawTitle
      : n.type
      ? n.type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
      : t('notifications.text_11');

  let message = n.message;
  if (!message || message.trim().startsWith('{')) {
    message = payload.text || payload.message || (t('notifications.text_12'));
  }

  return {
    title,
    message,
    link: n.link,
    actionText: t('notifications.text_13'),
    childName,
  };
}

/**
 * The demo fixture notifications. They are only ever shown to the demo tenant —
 * a real account with an empty inbox sees an honest empty state instead of the
 * demo parent's Rahim/Tasnim/Fahim activity.
 */
const getDefaultNotifications = (isBn: boolean, demoChildId: string, t: Translator) => [
  {
    id: 'n1',
    type: 'quiz_completed',
    title: t('notifications.text_2'),
    payloadJson: {
      childId: demoChildId,
      childName: t('notifications.text'),
      score: 8,
      maxScore: 10,
      quizTitle: t('notifications.text_14'),
      attemptId: 'att-1',
    },
    message: t('notifications.text_15'),
    link: '/attempts/att-1/results',
    readAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'n2',
    type: 'plan_update',
    title: t('notifications.text_16'),
    message: t('notifications.ai'),
    link: '/billing',
    readAt: null,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'n3',
    type: 'missed_session',
    title: t('notifications.text_17'),
    message: t('notifications.yesterday_s_5_30_pm_math_tuition_has_no_recorded'),
    link: '/schedule',
    readAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function NotificationsPage() {
  const { t, isBn } = useI18n();
  const { childrenList } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  // The fixture notifications belong to the demo tenant. `demoProfile` is
  // assigned by the server, so a real account can never receive them.
  const demoChild = (childrenList || []).find((c) => demoProfileOf(c) === 'rahim') || null;
  const isDemoTenant = !!demoChild;

  /**
   * The locale is read through a ref rather than as an effect dependency.
   *
   * `isBn` used to be a dependency, so switching the UI language re-fetched
   * `/notifications`. The locale only affects the *copy* of the demo fixture, so
   * it is read at call time.
   */
  const isBnRef = useRef(isBn);
  const tRef = useRef(t);
  useEffect(() => {
    isBnRef.current = isBn;
    tRef.current = t;
  }, [isBn, t]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      const data = res.data?.data;
      if (data && data.length > 0) {
        setList(data);
      } else {
        setList(isDemoTenant && demoChild ? getDefaultNotifications(isBnRef.current, demoChild.id, tRef.current) : []);
      }
    } catch {
      setList(isDemoTenant && demoChild ? getDefaultNotifications(isBnRef.current, demoChild.id, tRef.current) : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // `isBn` is deliberately NOT a dependency — it only affects the copy of the
    // demo fixture. Including it re-fetched `/notifications` on every locale
    // toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoTenant, demoChild?.id]);

  const handleMark = async (id: string) => {
    setActionError('');
    try {
      await api.post(`/notifications/${id}/read`);
      setList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
    } catch (err: any) {
      // The old code marked the notification read locally even when the server
      // rejected the call, so the unread badge cleared without the server ever
      // recording it.
      const serverMsg = err?.response?.data?.error?.message;
      setActionError(
        serverMsg ||
          (t('notifications.text_18'))
      );
    }
  };

  const handleMarkAll = async () => {
    setActionError('');
    try {
      await api.post('/notifications/read-all');
      setList((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error?.message;
      setActionError(
        serverMsg || (t('notifications.text_19'))
      );
    }
  };

  const unreadCount = list.filter((n) => !n.readAt).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'quiz_completed':
      case 'results_ready':
        return <Brain className="w-4 h-4 text-primary" />;
      case 'trial_reminder':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'missed_session':
      case 'missed_sessions':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {t('nav.notifications', 'Notifications')}
              </h1>
              {unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground text-xs font-bold">
                  {t('notifications.new', { p0: isBn ? toBnNum(unreadCount) : unreadCount }, `${unreadCount} New`)}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('notifications.text_20')}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            disabled={unreadCount === 0}
            className="text-xs h-8 gap-1.5 self-start sm:self-auto"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>{t('notifications.text_21')}</span>
          </Button>
        </div>

        {actionError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-xs font-semibold">
            {actionError}
          </div>
        )}

        {/* Notifications List */}
        {loading ? (
          <NotificationListSkeleton count={4} />
        ) : list.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground rounded-2xl border">
            {t('notifications.text_22')}
          </Card>
        ) : (
          <div className="space-y-3">
          {list.map((n) => {
            const isUnread = !n.readAt;
            const { title, message, link, actionText, childName, scoreBadge } = parseNotification(
              n,
              childrenList,
              isBn,
              t
            );

            return (
              <Card
                key={n.id}
                className={`rounded-2xl border transition-all ${
                  isUnread
                    ? 'border-primary/40 bg-card shadow-sm ring-1 ring-primary/20'
                    : 'bg-card/50 opacity-80'
                }`}
              >
                <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      {getIcon(n.type)}
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      {/* Title & Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs sm:text-sm font-bold text-foreground">{title}</p>

                        {/* Child Name Badge */}
                        {childName && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] sm:text-[11px] px-2 py-0.5 font-semibold bg-muted flex items-center gap-1"
                          >
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span>{childName}</span>
                          </Badge>
                        )}

                        {/* Dedicated Score Pill */}
                        {scoreBadge && (
                          <span
                            className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                              scoreBadge.pct >= 75
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : scoreBadge.pct >= 40
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                            }`}
                          >
                            <span>
                              {t('notifications.score', { p0: isBn ? toBnNum(scoreBadge.score) : scoreBadge.score, p1: isBn ? toBnNum(scoreBadge.maxScore) : scoreBadge.maxScore }, `Score: ${scoreBadge.score}/${scoreBadge.maxScore}`)}
                            </span>
                            <span className="opacity-70 text-[9px]">
                              ({isBn ? toBnNum(scoreBadge.pct) : scoreBadge.pct}%)
                            </span>
                          </span>
                        )}

                        {isUnread && (
                          <span
                            className="w-2 h-2 rounded-full bg-primary shrink-0"
                            title={t('notifications.text_23')}
                          />
                        )}
                      </div>

                      {/* Clean Message */}
                      <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>

                      {/* Timestamp */}
                      <p className="text-[10px] text-muted-foreground pt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 opacity-60" />
                        <span>
                          {isBn
                            ? toBnNum(
                                new Date(n.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              )
                            : new Date(n.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                          •{' '}
                          {isBn
                            ? toBnNum(new Date(n.createdAt).toLocaleDateString())
                            : new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start pt-1 sm:pt-0">
                    {link && (
                      <Link href={link}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-primary gap-1 font-semibold hover:bg-primary/10"
                        >
                          <span>{actionText}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    )}
                    {isUnread && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMark(n.id)}
                        className="h-8 text-[11px] text-muted-foreground hover:text-foreground"
                        title={t('notifications.text_24')}
                      >
                        {t('notifications.text_25')}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        )}
      </div>
    </AppShell>
  );
}
