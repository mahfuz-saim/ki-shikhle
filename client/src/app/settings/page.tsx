'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/components/auth/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { api } from '@/lib/api';
import {
  Settings as SettingsIcon,
  KeyRound,
  Download,
  Trash2,
  Globe,
  User,
  Shield,
  CheckCircle2,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { locale, setLocale, t, isBn } = useI18n();

  const [curr, setCurr] = useState('');
  const [nw, setNw] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loadingPw, setLoadingPw] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    setLoadingPw(true);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: curr,
        newPassword: nw,
      });
      setMsg(t('settings.text'));
      setCurr('');
      setNw('');
    } catch (e: any) {
      setErr(e.response?.data?.error?.message || 'Password change failed.');
    } finally {
      setLoadingPw(false);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await api.get('/auth/export');
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', 'ki-shikhle-data-export.json');
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch {
      alert('Data export failed. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await api.delete('/auth/account');
      setDeleteSuccess(true);
      setTimeout(() => {
        logout();
      }, 2500);
    } catch (err: any) {
      // The old code set the *success* flag in the catch branch too, so the modal
      // said "Account scheduled for deletion" even when the server rejected the
      // request — and then logged the parent out of a still-live account.
      const serverMsg = err?.response?.data?.error?.message;
      setDeleteError(
        serverMsg || 'Could not schedule the account for deletion. Please try again.'
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 w-full">
        {/* Title */}
        <div className="pb-2 border-b">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {t('nav.settings', 'Settings')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your account security, notification preferences, and learning data.
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

        {/* Profile Info */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span>Parent Account Information</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <Label className="text-muted-foreground text-[11px]">Full Name</Label>
                <p className="font-semibold text-foreground mt-0.5">{user?.name || 'Parent Account'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-[11px]">Email Address</Label>
                <p className="font-semibold text-foreground mt-0.5">{user?.email || 'parent@example.com'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-[11px]">Timezone</Label>
                <p className="font-semibold text-foreground mt-0.5">Asia/Dhaka (GMT+6)</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-[11px]">Account Role</Label>
                <p className="font-semibold text-foreground mt-0.5 capitalize">{user?.role || 'Parent'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" />
              <span>Security & Password</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Ensure your account has a strong password (minimum 8 characters with numbers & symbols).
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-3.5 max-w-md">
              <div>
                <Label className="text-xs font-semibold">Current Password</Label>
                <Input
                  type="password"
                  value={curr}
                  onChange={(e) => setCurr(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">New Password</Label>
                <Input
                  type="password"
                  value={nw}
                  onChange={(e) => setNw(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  className="mt-1"
                />
              </div>

              {err && <p className="text-xs text-destructive font-medium">{err}</p>}

              <Button type="submit" size="sm" disabled={loadingPw} className="text-xs h-9">
                {loadingPw ? 'Updating...' : 'Change Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>Data Export & Privacy</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Your child’s learning logs, routine data, and quiz history belong to you.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-muted/20 gap-3">
              <div>
                <p className="text-xs font-bold text-foreground">Export All Learning Data</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Download a complete JSON export of all children, notes, routines, and quiz attempts.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                className="text-xs h-8 gap-1.5 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-destructive/20 bg-destructive/5 gap-3">
              <div>
                <p className="text-xs font-bold text-destructive">Delete Account</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Soft-delete account with a 7-day grace window before hard purge.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteModalOpen(true)}
                className="text-xs h-8 gap-1.5 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Your Account"
        description="Are you sure you want to delete your Ki Shikhle? account?"
        maxWidth="sm"
      >
        <div className="space-y-3 pt-1">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your account will be placed into a <strong>7-day grace period</strong>. If you do not restore your account within 7 days, all children profiles, notes, and study logs will be permanently deleted.
          </p>

          {deleteSuccess && (
            <p className="text-xs font-bold text-emerald-600">
              Account scheduled for deletion. Logging out...
            </p>
          )}

          {deleteError && (
            <p className="text-xs font-bold text-destructive">{deleteError}</p>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteAccount}
              disabled={deleteLoading || deleteSuccess}
            >
              {deleteLoading ? 'Processing...' : 'Confirm Delete (7-Day Grace)'}
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
