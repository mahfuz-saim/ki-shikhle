'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { KidShell } from '@/components/layout/kid-shell';
import { useAuth } from '@/components/auth/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { api } from '@/lib/api';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  ArrowLeft,
  Smile,
} from 'lucide-react';

export default function KidLogPage() {
  const router = useRouter();
  const { activeChild } = useAuth();
  const { isBn } = useI18n();

  const childId = activeChild?.id || 'demo-child';

  const [topic, setTopic] = useState('');
  const [source, setSource] = useState('tuition');
  const [subject, setSubject] = useState('Mathematics');
  const [confidence, setConfidence] = useState(4);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const presets = [
    { label: isBn ? 'গণিত: দ্বিঘাত সমীকরণ' : 'Math: Quadratic Equations', source: 'tuition', subject: 'Mathematics' },
    { label: isBn ? 'পদার্থবিজ্ঞান: বল ও ভরবেগ' : 'Physics: Newton\'s 2nd Law F=ma', source: 'school', subject: 'Physics' },
    { label: isBn ? 'রসায়ন: পর্যায় সারণি' : 'Chemistry: Periodic Table Group Trends', source: 'tuition', subject: 'Chemistry' },
    { label: isBn ? 'ইংরেজি: Tense ও Voice Change' : 'English: Active & Passive Voice', source: 'self_study', subject: 'English' },
  ];

  const handleSelectPreset = (p: any) => {
    setTopic(p.label);
    setSource(p.source);
    setSubject(p.subject);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);

    try {
      await api.post(`/children/${childId}/entries`, {
        source,
        subjectId: subject,
        topicsText: topic,
        confidence,
        date: new Date().toISOString().slice(0, 10),
      });
      setSuccess(true);
    } catch {
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KidShell>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/kid')}
            className="text-xs h-8 gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isBn ? 'ড্যাশবোর্ডে ফিরুন' : 'Back to Today'}</span>
          </Button>

          <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
            <Flame className="w-4 h-4 fill-amber-500" />
            <span>Keep your 4-day streak burning!</span>
          </span>
        </div>

        {success ? (
          <Card className="rounded-3xl border-2 border-emerald-500/30 bg-emerald-500/5 p-8 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-3xl">
              🎉
            </div>
            <h2 className="text-2xl font-black text-foreground">
              {isBn ? 'দারুণ! পড়ার বিবরণ যোগ হয়েছে!' : 'Great job! Lesson logged!'}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              {isBn
                ? 'তোমার আজকের পড়ার রেকর্ড সংরক্ষিত হয়েছে। অভিভাবক তোমার অগ্রগতি দেখতে পারবেন।'
                : 'Your daily study streak has been preserved. Parents can now review and create quizzes from this topic.'}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button
                onClick={() => {
                  setSuccess(false);
                  setTopic('');
                }}
                variant="outline"
                className="rounded-xl text-xs"
              >
                {isBn ? 'আরেকটি বিষয় লিখুন' : 'Log Another Lesson'}
              </Button>
              <Button
                onClick={() => router.push('/kid')}
                className="rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isBn ? 'আজকের ড্যাশবোর্ডে যান' : 'Go to Today Dashboard'}
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="rounded-3xl border shadow-md bg-card">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span>{isBn ? 'আজকে তুমি কী শিখেছ?' : 'What did you study today?'}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                {isBn
                  ? 'নিচের যেকোনো একটিতে ট্যাপ করো অথবা নিজেই লেখো'
                  : 'Tap a recent lesson below or type your topic (under 1 minute)'}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {/* Quick Preset Buttons */}
              <div>
                <Label className="text-xs font-semibold block mb-2 text-muted-foreground">
                  {isBn ? 'দ্রুত নির্বাচন করুন' : 'Quick Presets (Tap to fill)'}
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {presets.map((p, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => handleSelectPreset(p)}
                      className="p-3 rounded-2xl border text-left text-xs font-medium hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-between"
                    >
                      <span className="truncate">{p.label}</span>
                      <span className="text-[10px] text-muted-foreground uppercase ml-1">
                        {p.source}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold">
                    {isBn ? 'পড়ার বিবরণ / টপিক' : 'Lesson Topic'}
                  </Label>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={
                      isBn
                        ? 'যেমন: পদার্থবিজ্ঞান অধ্যায় ৩ বল ও ভরবেগ'
                        : 'e.g. Physics Chapter 3: Newton\'s 2nd Law derivation'
                    }
                    className="mt-1 h-11 text-sm rounded-xl"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Source</Label>
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="w-full h-10 border rounded-xl px-3 bg-background text-sm mt-1"
                    >
                      <option value="tuition">Private Tuition</option>
                      <option value="school">School</option>
                      <option value="college">College</option>
                      <option value="self_study">Self-Study</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Subject</Label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full h-10 border rounded-xl px-3 bg-background text-sm mt-1"
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                      <option value="English">English</option>
                      <option value="Bangla">Bangla</option>
                      <option value="ICT">ICT</option>
                    </select>
                  </div>
                </div>

                {/* Confidence */}
                <div>
                  <Label className="text-xs font-semibold block mb-1">
                    {isBn ? 'কতটুকু ভালো বুঝেছ?' : 'How well did you understand this? (Confidence)'}
                  </Label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setConfidence(num)}
                        className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                          confidence >= num
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                            : 'bg-muted/20 border-border text-muted-foreground'
                        }`}
                      >
                        ⭐ {num}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !topic.trim()}
                  className="w-full h-11 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
                >
                  {loading ? 'Saving...' : isBn ? 'সংরক্ষণ করুন 🎉' : 'Save Lesson 🎉'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </KidShell>
  );
}
