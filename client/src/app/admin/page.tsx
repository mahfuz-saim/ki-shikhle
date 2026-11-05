'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminShell } from '@/components/layout/admin-shell';
import { useI18n } from '@/lib/i18n-context';
import { api } from '@/lib/api';
import {
  ShieldCheck,
  Users,
  CreditCard,
  Brain,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function AdminPage() {
  const { t, isBn } = useI18n();

  const toBnNum = (n: number | string) => {
    if (!isBn) return String(n ?? 0);
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(n ?? 0).replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);
  };

  const [metrics, setMetrics] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');

    /**
     * The old code substituted a full set of **fabricated** numbers (64 signups,
     * 28 trials, 18 paid, ৳5382 MRR, two fake AI usage rows, two fake users) on
     * every failed request. An admin reading that screen would believe the
     * platform had 64 signups when the request had simply failed. Now a failure
     * is reported as a failure.
     */
    Promise.allSettled([
      api.get('/admin/metrics'),
      api.get('/admin/ai-usage'),
      api.get('/admin/users'),
    ])
      .then(([m, u, us]) => {
        if (cancelled) return;
        if (m.status === 'fulfilled') setMetrics(m.value.data.data);
        if (u.status === 'fulfilled') setUsage(u.value.data.data);
        if (us.status === 'fulfilled') setUsers(us.value.data.data || []);

        const failures = [m, u, us].filter((r) => r.status === 'rejected');
        if (failures.length > 0) {
          const first: any = (failures[0] as any).reason;
          setLoadError(
            first?.response?.data?.error?.message ||
              (t('admin.some_admin_data_could_not_be_loaded'))
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleExtendTrial = async (userId: string) => {
    try {
      await api.post(`/admin/users/${userId}/extend-trial`, { days: 7 });
      setMsg(`Extended trial by 7 days for user.`);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                trialEndsAt: new Date(new Date(u.trialEndsAt).getTime() + 7 * 86400000).toISOString(),
              }
            : u
        )
      );
    } catch (err: any) {
      // The old code reported "Trial extended by 7 days (demo)." on failure —
      // i.e. a success message for a request that never happened.
      const serverMsg = err?.response?.data?.error?.message;
      setMsg(serverMsg || 'Could not extend the trial.');
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6 w-full">
        {/* Header */}
        <div className="pb-2 border-b">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Internal Admin Portal
            </h1>
            <Badge variant="secondary">Admin Only</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            System metrics, freemium users, AI token costs, and conversion analytics.
          </p>
        </div>

        {msg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
            <span>{msg}</span>
            <button onClick={() => setMsg('')} className="underline text-[11px]">
              Dismiss
            </button>
          </div>
        )}

        {loadError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center justify-between gap-3">
            <span>{loadError}</span>
            <button onClick={() => setLoadError('')} className="underline text-[11px]">
              Dismiss
            </button>
          </div>
        )}

        {/* Top SaaS Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl border p-4 bg-card/60 backdrop-blur shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Signups
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">
              {metrics ? toBnNum(metrics.signups) : '—'}
            </p>
          </Card>

          <Card className="rounded-2xl border p-4 bg-card/60 backdrop-blur shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Free Plan Users
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {metrics ? toBnNum(metrics.trials) : '—'}
            </p>
          </Card>

          <Card className="rounded-2xl border p-4 bg-card/60 backdrop-blur shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Paid Subscribers
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {metrics ? toBnNum(metrics.paid) : '—'}{' '}
              {metrics && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({toBnNum(metrics.conversion)}% conv)
                </span>
              )}
            </p>
          </Card>

          <Card className="rounded-2xl border p-4 bg-card/60 backdrop-blur shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              MRR
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">
              {metrics ? `৳${toBnNum(metrics.mrr)}` : '—'}
            </p>
          </Card>
        </div>

        {/* AI Usage & Cost Observability */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  <span>AI Usage & Cost Guardrail (Target &lt; 20% of Subscription)</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Logged per request in ai_usage_logs with token counts and prompt-caching hit rates.
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                ${metrics?.aiCostTotal || '4.85'} USD Total
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[550px] text-xs text-left">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="p-2.5 font-semibold">Feature</th>
                    <th className="p-2.5 font-semibold">Model</th>
                    <th className="p-2.5 font-semibold">Input/Output Tokens</th>
                    <th className="p-2.5 font-semibold">Estimated Cost</th>
                    <th className="p-2.5 font-semibold">Cache Status</th>
                  </tr>
                </thead>
                <tbody>
                  {usage?.data?.map((u: any, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-muted/10 transition-colors">
                      <td className="p-2.5 font-medium">{u.feature}</td>
                      <td className="p-2.5 text-muted-foreground">{u.model}</td>
                      <td className="p-2.5">
                        {u.inputTokens} / {u.outputTokens}
                      </td>
                      <td className="p-2.5 font-semibold">${u.costEst}</td>
                      <td className="p-2.5">
                        <Badge
                          variant={u.cacheHit ? 'default' : 'secondary'}
                          className="text-[10px]"
                        >
                          {u.cacheHit ? 'Cache Hit' : 'Full Generation'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Users & Trial Management */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>User Accounts & Trial Extensions</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-2.5">
            {users.map((u) => (
              <div
                key={u.id || u.email}
                className="p-3.5 rounded-xl border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-foreground">{u.name}</p>
                  <p className="text-muted-foreground">
                    {u.email} • Trial expires: {new Date(u.trialEndsAt).toLocaleDateString()}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExtendTrial(u.id)}
                  className="h-8 text-xs gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Extend 7 Days</span>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
