'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/components/auth/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { api } from '@/lib/api';
import {
  Plus,
  Edit2,
  Trash2,
  KeyRound,
  Mail,
  Lock,
  GraduationCap,
  CheckCircle2,
} from 'lucide-react';

export default function ChildrenPage() {
  const router = useRouter();
  const { childrenList, activeChild, setActiveChild, refreshChildren } = useAuth();
  const { t, isBn } = useI18n();

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetPwModalOpen, setResetPwModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [selectedChild, setSelectedChild] = useState<any>(null);

  // Add/Edit Form
  const [form, setForm] = useState({
    name: '',
    nickname: '',
    grade: 'Class 8',
    curriculum: 'NCTB',
    medium: 'Bangla',
    email: '',
    password: '',
  });

  // Password reset modal
  const [newPassword, setNewPassword] = useState('');
  const [pwSuccessMessage, setPwSuccessMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  // Open Edit
  const openEditModal = (c: any) => {
    setSelectedChild(c);
    setForm({
      name: c.name,
      nickname: c.nickname || '',
      grade: c.grade || 'Class 8',
      curriculum: c.curriculum || 'NCTB',
      medium: c.medium || 'Bangla',
      email: c.email || '',
      password: '',
    });
    setFormError('');
    setEditModalOpen(true);
  };

  // Open Reset Password
  const openResetPwModal = (c: any) => {
    setSelectedChild(c);
    setNewPassword('');
    setFormError('');
    setPwSuccessMessage('');
    setResetPwModalOpen(true);
  };

  // Open Delete
  const openDeleteModal = (c: any) => {
    setSelectedChild(c);
    setFormError('');
    setDeleteConfirmOpen(true);
  };

  // Create child
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setLoading(true);
    try {
      await api.post('/children', form);
      await refreshChildren();
      setAddModalOpen(false);
      setForm({
        name: '',
        nickname: '',
        grade: 'Class 8',
        curriculum: 'NCTB',
        medium: 'Bangla',
        email: '',
        password: '',
      });
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to add student profile.');
    } finally {
      setLoading(false);
    }
  };

  // Update child
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild) return;
    setFormError('');
    setLoading(true);
    try {
      const payload: any = {
        name: form.name,
        nickname: form.nickname,
        grade: form.grade,
        curriculum: form.curriculum,
        medium: form.medium,
        email: form.email,
      };
      if (form.password) {
        payload.password = form.password;
      }
      await api.patch(`/children/${selectedChild.id}`, payload);
      await refreshChildren();
      setEditModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  // Save new password from reset modal
  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild) return;
    setFormError('');
    setLoading(true);
    try {
      await api.patch(`/children/${selectedChild.id}`, { password: newPassword });
      setPwSuccessMessage('Password updated successfully for ' + selectedChild.name);
      setTimeout(() => {
        setResetPwModalOpen(false);
        setPwSuccessMessage('');
        setNewPassword('');
      }, 1200);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  // Delete child
  const handleDelete = async () => {
    if (!selectedChild) return;
    setLoading(true);
    try {
      await api.delete(`/children/${selectedChild.id}`);
      await refreshChildren();
      setDeleteConfirmOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to delete child profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Title & Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {t('child.title', 'Children Profiles')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isBn
                ? 'সন্তানদের পৃথক প্রোফাইল ও লগইন ক্রেডেনশিয়াল পরিচালনা করুন'
                : 'Create and manage student logins, curriculum grades, and individual portals.'}
            </p>
          </div>

          <Button
            onClick={() => {
              setForm({
                name: '',
                nickname: '',
                grade: 'Class 8',
                curriculum: 'NCTB',
                medium: 'Bangla',
                email: '',
                password: '',
              });
              setFormError('');
              setAddModalOpen(true);
            }}
            className="gap-1.5 text-xs h-9 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t('child.add', 'Add Student Account')}</span>
          </Button>
        </div>

        {/* Children Grid or Empty State */}
        {childrenList.length === 0 ? (
          <Card className="rounded-2xl border p-8 text-center space-y-3 bg-muted/20">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-foreground">No Student Accounts Added Yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Add your student with their class, curriculum, email, and password to grant them individual portal access.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setForm({
                  name: '',
                  nickname: '',
                  grade: 'Class 8',
                  curriculum: 'NCTB',
                  medium: 'Bangla',
                  email: '',
                  password: '',
                });
                setFormError('');
                setAddModalOpen(true);
              }}
              className="mt-2 text-xs h-9 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Student Account
            </Button>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {childrenList.map((c) => {
              const isCurrent = activeChild?.id === c.id;
              return (
                <Card
                  key={c.id}
                  className={`rounded-2xl border transition-all ${
                    isCurrent ? 'ring-2 ring-primary/40 bg-card shadow-md' : 'bg-card/70 hover:shadow-sm'
                  }`}
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-sm">
                          {c.name ? c.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <CardTitle className="text-base font-bold text-foreground">{c.name}</CardTitle>
                            {isCurrent && (
                              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                                Active
                              </Badge>
                            )}
                          </div>
                          {c.nickname && (
                            <p className="text-xs text-muted-foreground font-medium">({c.nickname})</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-4">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      <Badge variant="secondary" className="font-medium text-[11px]">
                        {c.grade}
                      </Badge>
                      <Badge variant="outline" className="font-medium text-[11px]">
                        {c.medium === 'English' ? (isBn ? 'ইংলিশ ভার্সন' : 'English Version') : (isBn ? 'বাংলা মাধ্যম' : 'Bangla Version')}
                      </Badge>
                    </div>

                    {/* Student Login Email Info */}
                    <div className="p-2.5 rounded-xl bg-muted/40 border text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="font-semibold text-foreground text-[11px]">Student Login:</span>
                      </div>
                      <p className="font-mono text-[11px] text-foreground truncate pl-5">
                        {c.email || 'No email assigned yet'}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-2 border-t">
                      <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveChild(c)}
                          disabled={isCurrent}
                          className="text-[11px] sm:text-xs h-8 px-1 sm:px-2"
                        >
                          {isCurrent ? 'Selected' : 'Select'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(c)}
                          className="text-[11px] sm:text-xs h-8 px-1 sm:px-2 hover:bg-muted"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openResetPwModal(c)}
                          className="text-[11px] sm:text-xs h-8 px-1 sm:px-2 hover:bg-muted"
                          title="Set Student Password"
                        >
                          <KeyRound className="w-3.5 h-3.5 mr-1 text-amber-500" />
                          Password
                        </Button>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => openDeleteModal(c)}
                          className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete Profile</span>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Subjects & Curriculum Preload Section */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">
                  {isBn ? 'বিষয় তালিকা' : 'Subjects List'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isBn
                    ? 'প্রাক-নির্ধারিত বিষয়সমূহ এবং প্রয়োজন অনুসারে নতুন বিষয় যোগ করুন'
                    : 'Preloaded subjects with bilingual names. You can add custom subjects.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SubjectsManager />
          </CardContent>
        </Card>
      </div>

      {/* Add Child Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={t('child.add', 'Create Student Account')}
        description="Set up an independent student login with email and password. Students log in via the main login page to access their dedicated portal."
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-1">
          <div>
            <Label className="text-xs font-semibold">{t('child.name', 'Student Full Name')}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Rahim Ahmed"
              required
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">{t('child.nickname', 'Nickname (Optional)')}</Label>
              <Input
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                placeholder="e.g. Rahim"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">{t('child.grade', 'Class / Grade')}</Label>
              <select
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                className="h-10 w-full border rounded-xl px-3 bg-background text-sm mt-1"
              >
                <option value="Class 1">Class 1</option>
                <option value="Class 2">Class 2</option>
                <option value="Class 3">Class 3</option>
                <option value="Class 4">Class 4</option>
                <option value="Class 5">Class 5 (PEC)</option>
                <option value="Class 6">Class 6</option>
                <option value="Class 7">Class 7</option>
                <option value="Class 8">Class 8 (JSC)</option>
                <option value="Class 9">Class 9 (SSC Prep)</option>
                <option value="Class 10">Class 10 (SSC)</option>
                <option value="Class 11">Class 11 (HSC 1st Year)</option>
                <option value="Class 12">Class 12 (HSC 2nd Year)</option>
                <option value="Admission Prep">University / Medical Admission Prep</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">{t('child.version', 'Version / Medium of Education')}</Label>
            <select
              value={form.medium}
              onChange={(e) => setForm({ ...form, medium: e.target.value, curriculum: 'NCTB' })}
              className="h-10 w-full border rounded-xl px-3 bg-background text-sm mt-1"
            >
              <option value="Bangla">Bangla Version (বাংলা মাধ্যম)</option>
              <option value="English">English Version (ইংলিশ ভার্সন)</option>
            </select>
          </div>

          {/* Student Login Credentials */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 space-y-3">
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-foreground">Student Portal Credentials</span>
            </div>

            <div>
              <Label className="text-xs font-semibold">Student Email Address</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="student@example.com"
                required
                className="mt-1 bg-background"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Student Password (min 4 characters)</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Set student login password"
                required
                minLength={4}
                className="mt-1 bg-background"
              />
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              The student will enter this email and password on the standard login page to enter their personalized portal.
            </p>
          </div>

          {formError && <p className="text-xs text-destructive font-medium">{formError}</p>}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => setAddModalOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? t('common.loading', 'Creating...') : t('child.add', 'Create Student Account')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Child Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={t('child.edit', 'Edit Student Profile')}
        description={`Update information for ${selectedChild?.name}.`}
      >
        <form onSubmit={handleUpdate} className="space-y-4 pt-1">
          <div>
            <Label className="text-xs font-semibold">{t('child.name', 'Full Name')}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">{t('child.nickname', 'Nickname')}</Label>
              <Input
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">{t('child.grade', 'Class / Grade')}</Label>
              <select
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                className="h-10 w-full border rounded-xl px-3 bg-background text-sm mt-1"
              >
                <option value="Class 1">Class 1</option>
                <option value="Class 2">Class 2</option>
                <option value="Class 3">Class 3</option>
                <option value="Class 4">Class 4</option>
                <option value="Class 5">Class 5 (PEC)</option>
                <option value="Class 6">Class 6</option>
                <option value="Class 7">Class 7</option>
                <option value="Class 8">Class 8 (JSC)</option>
                <option value="Class 9">Class 9 (SSC Prep)</option>
                <option value="Class 10">Class 10 (SSC)</option>
                <option value="Class 11">Class 11 (HSC 1st Year)</option>
                <option value="Class 12">Class 12 (HSC 2nd Year)</option>
                <option value="Admission Prep">University / Medical Admission Prep</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">{t('child.version', 'Version / Medium of Education')}</Label>
            <select
              value={form.medium}
              onChange={(e) => setForm({ ...form, medium: e.target.value, curriculum: 'NCTB' })}
              className="h-10 w-full border rounded-xl px-3 bg-background text-sm mt-1"
            >
              <option value="Bangla">Bangla Version (বাংলা মাধ্যম)</option>
              <option value="English">English Version (ইংলিশ ভার্সন)</option>
            </select>
          </div>

          <div>
            <Label className="text-xs font-semibold">Student Login Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">New Password (leave blank to keep current)</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="mt-1"
            />
          </div>

          {formError && <p className="text-xs text-destructive font-medium">{formError}</p>}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? t('common.loading', 'Saving...') : t('common.save', 'Save Changes')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Student Password Modal */}
      <Modal
        isOpen={resetPwModalOpen}
        onClose={() => setResetPwModalOpen(false)}
        title="Set Student Password"
        description={`Set a new login password for ${selectedChild?.name}.`}
        maxWidth="sm"
      >
        <form onSubmit={handleSaveNewPassword} className="space-y-4 pt-1">
          <div>
            <Label className="text-xs font-semibold">New Student Password (min 4 characters)</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              minLength={4}
              className="mt-1"
              autoFocus
            />
          </div>

          {pwSuccessMessage && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{pwSuccessMessage}</span>
            </div>
          )}

          {formError && <p className="text-xs text-destructive font-medium">{formError}</p>}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => setResetPwModalOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={loading || newPassword.length < 4}>
              {loading ? t('common.loading', 'Saving...') : 'Update Password'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete Student Profile"
        description={`Are you sure you want to remove ${selectedChild?.name}? All associated learning logs and quizzes will be archived.`}
        maxWidth="sm"
      >
        <div className="pt-2">
          {formError && <p className="text-xs text-destructive font-medium mb-3">{formError}</p>}
          <p className="text-xs text-muted-foreground">
            This action can be restored within 7 days from the Settings page.
          </p>

          <div className="flex justify-end gap-2 mt-5 pt-3 border-t">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

function SubjectsManager() {
  const [list, setList] = useState<any[]>([]);
  const [nameEn, setNameEn] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => {
    api
      .get('/subjects')
      .then((r) => setList(r.data.data))
      .catch(() =>
        setList([
          { nameEn: 'Mathematics', nameBn: 'গণিত' },
          { nameEn: 'Physics', nameBn: 'পদার্থবিজ্ঞান' },
          { nameEn: 'Chemistry', nameBn: 'রসায়ন' },
          { nameEn: 'Biology', nameBn: 'জীববিজ্ঞান' },
          { nameEn: 'English 1st Paper', nameBn: 'ইংরেজি ১ম পত্র' },
          { nameEn: 'English 2nd Paper', nameBn: 'ইংরেজি ২য় পত্র' },
          { nameEn: 'Bangla 1st Paper', nameBn: 'বাংলা ১ম পত্র' },
          { nameEn: 'Bangla 2nd Paper', nameBn: 'বাংলা ২য় পত্র' },
          { nameEn: 'ICT', nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি' },
          { nameEn: 'Bangladesh & Global Studies', nameBn: 'বাংলাদেশ ও বিশ্বপরিচয়' },
        ])
      );
  };

  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!nameEn) return;
    setLoading(true);
    try {
      await api.post('/subjects', { nameEn, nameBn, curriculum: 'NCTB', grade: 'Class 8' });
      setNameEn('');
      setNameBn('');
      load();
    } catch {
      // Mock addition
      setList((prev) => [...prev, { nameEn, nameBn, isCustom: true }]);
      setNameEn('');
      setNameBn('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="English name (e.g. Higher Math, Arabic)"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          className="text-xs h-9"
        />
        <Input
          placeholder="বাংলা নাম (ঐচ্ছিক — যেমন: উচ্চতর গণিত)"
          value={nameBn}
          onChange={(e) => setNameBn(e.target.value)}
          className="text-xs h-9"
        />
        <Button onClick={add} size="sm" disabled={!nameEn || loading} className="text-xs shrink-0 h-9">
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Subject
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
        {list.map((s: any, i: number) => (
          <div
            key={i}
            className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/20 text-xs hover:bg-muted/40 transition-colors"
          >
            <div className="min-w-0">
              <p className="font-semibold truncate text-foreground">{s.nameEn}</p>
              {s.nameBn && <p className="text-[11px] text-muted-foreground truncate">{s.nameBn}</p>}
            </div>
            {s.isCustom && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-1 shrink-0">
                Custom
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
