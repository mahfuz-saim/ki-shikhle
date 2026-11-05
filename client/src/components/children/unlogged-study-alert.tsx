'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { Child } from '@/components/auth/auth-context';
import { demoProfileOf } from '@/lib/child-scope';
import { useI18n } from '@/lib/i18n-context';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Bell, Check, CheckCircle2, Clock } from 'lucide-react';

export function UnloggedStudyAlert({ currentChild }: { currentChild: Child }) {
  const { t, isBn } = useI18n();
  const childId = currentChild.id;
  const demoProfile = demoProfileOf(currentChild);

  // Unlogged Study Alert Configuration State (Saved per student)
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [savingAlert, setSavingAlert] = useState(false);
  const [testingAlert, setTestingAlert] = useState(false);
  const [alertSuccessMsg, setAlertSuccessMsg] = useState('');
  const [alertErrorMsg, setAlertErrorMsg] = useState('');
  const [alertConfig, setAlertConfig] = useState<{
    enabled: boolean;
    time: string;
    channel: 'in_app' | 'email' | 'all';
    daysOfWeek: number[];
  }>({
    enabled: true,
    time: demoProfile === 'fahim' ? '22:00' : demoProfile === 'tasnim' ? '20:30' : '21:00',
    channel: 'all',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  });

  const [loadingAlert, setLoadingAlert] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoadingAlert(true);
    setLoadFailed(false);
    setAlertErrorMsg('');
    api.get(`/children/${childId}/unlogged-alert`)
      .then((response) => {
        if (cancelled) return;
        if (!response.data?.data) throw new Error('Could not load alert settings.');
        setAlertConfig(response.data.data);
      })
      .catch((error: any) => {
        if (cancelled) return;
        setLoadFailed(true);
        setAlertErrorMsg(error?.response?.data?.error?.message || error.message || 'Could not load alert settings.');
      })
      .finally(() => { if (!cancelled) setLoadingAlert(false); });
    return () => { cancelled = true; };
  }, [childId, reloadCount]);

  const handleSaveAlertConfig = async (e: FormEvent) => {
    e.preventDefault();
    if (loadingAlert || loadFailed || savingAlert || testingAlert) return;
    setSavingAlert(true);
    setAlertSuccessMsg('');
    setAlertErrorMsg('');
    try {
      await api.put(`/children/${childId}/unlogged-alert`, alertConfig);
      setAlertSuccessMsg(
        t('childLog.unlogged_study_alert_settings_successfully_saved', { p0: isBn ? currentChild?.name || 'শিক্ষার্থী' : currentChild?.name || 'this student' }, `Unlogged study alert settings successfully saved for ${currentChild?.name || 'this student'}!`)
      );
      setTimeout(() => {
        setAlertModalOpen(false);
        setAlertSuccessMsg('');
      }, 1500);
    } catch (err: any) {
      // The old code reported "successfully saved" on failure too, so the parent
      // believed the alert was configured when the server had rejected it.
      const serverMsg = err?.response?.data?.error?.message;
      setAlertErrorMsg(
        serverMsg ||
          (t('childLog.text_43'))
      );
    } finally {
      setSavingAlert(false);
    }
  };

  const handleTriggerTestAlert = async () => {
    if (loadingAlert || loadFailed || savingAlert || testingAlert) return;
    setTestingAlert(true);
    setAlertErrorMsg('');
    try {
      await api.post(`/children/${childId}/unlogged-alert/test`);
      setAlertSuccessMsg(
        t('childLog.text_44')
      );
      setTimeout(() => setAlertSuccessMsg(''), 4000);
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error?.message;
      setAlertErrorMsg(
        serverMsg ||
          (t('childLog.text_45'))
      );
    } finally {
      setTestingAlert(false);
    }
  };

  return (
    <>
      {/* Unlogged Study Notification Button */}
      <Button
        disabled={loadingAlert}
        variant="outline"
        size="sm"
        onClick={() => setAlertModalOpen(true)}
        className="gap-1.5 text-xs h-9 font-semibold border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400"
      >
        <Bell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        <span>{t('childLog.text_53')}</span>
        {!loadingAlert && !loadFailed && alertConfig.enabled && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold border-amber-500/30">
            {alertConfig.time}
          </Badge>
        )}
      </Button>
      {/* Unlogged Study Alert Setup Modal (Saved separately per student) */}
      <Modal
        isOpen={alertModalOpen}
        onClose={() => { if (!savingAlert && !testingAlert) setAlertModalOpen(false); }}
        title={t('childLog.text_86')}
        description={
          t('childLog.receive_an_automatic_notification_if_has_not_log', { p0: isBn ? currentChild?.name || 'শিক্ষার্থী' : currentChild?.name || 'your child' }, `Receive an automatic notification if ${currentChild?.name || 'your child'} has not logged their daily study sessions.`)
        }
        maxWidth="lg"
      >
        <form onSubmit={handleSaveAlertConfig} className="space-y-4 pt-1">
          {/* Student context pill */}
          <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                {currentChild?.name?.slice(0, 1) || 'S'}
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">{currentChild?.name || 'শিক্ষার্থী'}</p>
                <p className="text-[11px] text-muted-foreground">{currentChild?.grade || 'Class 8'} • {currentChild?.curriculum || 'NCTB'}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] text-primary border-primary/20 bg-primary/5 font-semibold">
              {t('childLog.text_87')}
            </Badge>
          </div>

          {/* Enable / Disable Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border bg-card">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">
                {t('childLog.text_88')}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t('childLog.text_89')}
              </p>
            </div>
            <input
              type="checkbox"
              checked={alertConfig.enabled}
              onChange={(e) => setAlertConfig({ ...alertConfig, enabled: e.target.checked })}
              className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer"
            />
          </div>

          {/* Time Picker & Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>{t('childLog.text_90')}</span>
              </label>
              <span className="text-[11px] text-muted-foreground font-medium">
                {t('childLog.text_91')}
              </span>
            </div>
            <Input
              type="time"
              value={alertConfig.time}
              onChange={(e) => setAlertConfig({ ...alertConfig, time: e.target.value })}
              className="h-10 text-sm font-semibold"
              disabled={!alertConfig.enabled}
              required
            />
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-muted-foreground mr-1">
                {t('childLog.text_92')}
              </span>
              {['20:00', '20:30', '21:00', '21:30', '22:00'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={!alertConfig.enabled}
                  onClick={() => setAlertConfig({ ...alertConfig, time: preset })}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                    alertConfig.time === preset
                      ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                      : 'bg-muted/40 hover:bg-muted text-muted-foreground border-border/60'
                  }`}
                >
                  {preset === '20:00' ? (t('childLog.text_93')) :
                   preset === '20:30' ? (t('childLog.text_94')) :
                   preset === '21:00' ? (t('childLog.text_95')) :
                   preset === '21:30' ? (t('childLog.text_96')) :
                   (t('childLog.text_97'))}
                </button>
              ))}
            </div>
          </div>

          {/* Encouragement / Timing Recommendation Callout */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{t('childLog.time_recommendation')}</span>
            </div>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
              {t('childLog.please_select_a_time_that_is_after_all_of_s_dail', { p0: isBn ? currentChild?.nickname || currentChild?.name || 'সন্তানের' : currentChild?.nickname || currentChild?.name || 'your child' }, `Please select a time that is after all of ${currentChild?.nickname || currentChild?.name || 'your child'}'s daily educational activities (school/college, private tuition, and evening self-study) are finished (e.g. 9:00 PM or 9:30 PM). This ensures your child has enough time to log their study, and you will only be alerted if lessons remain unlogged.`)}
            </p>
          </div>

          {/* Notification Channel Choice */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              {t('childLog.text_98')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: t('childLog.text_99'), desc: t('childLog.text_100') },
                { id: 'in_app', label: t('childLog.text_101'), desc: t('childLog.text_102') },
                { id: 'email', label: t('childLog.text_103'), desc: t('childLog.text_104') },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={!alertConfig.enabled}
                  onClick={() => setAlertConfig({ ...alertConfig, channel: c.id as any })}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    alertConfig.channel === c.id
                      ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/30'
                      : 'border-border/60 hover:bg-muted/30 text-muted-foreground'
                  }`}
                >
                  <p className="text-xs font-bold text-foreground">{c.label}</p>
                  <p className="text-[10px] text-muted-foreground">{c.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Success Message Banner */}
          {alertSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{alertSuccessMsg}</span>
            </div>
          )}

          {/* Error Message Banner */}
          {alertErrorMsg && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <span>{alertErrorMsg}</span>
              {loadFailed && <Button type="button" variant="outline" size="sm" disabled={loadingAlert} onClick={() => setReloadCount((count) => count + 1)}>{t('common.retry', 'Retry')}</Button>}
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={loadingAlert || loadFailed || savingAlert || testingAlert || !alertConfig.enabled}
              onClick={handleTriggerTestAlert}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <Bell className="w-3.5 h-3.5 text-amber-500" />
              <span>{testingAlert ? (t('childLog.text_105')) : (t('childLog.text_106'))}</span>
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={savingAlert || testingAlert}
                onClick={() => setAlertModalOpen(false)}
                className="text-xs"
              >
                {t('childLog.text_107')}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loadingAlert || loadFailed || savingAlert || testingAlert}
                className="text-xs gap-1.5 bg-primary"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{savingAlert ? (t('childLog.text_108')) : (t('childLog.text_109'))}</span>
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
