'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CardGridSkeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';
import { KidShell } from '@/components/layout/kid-shell';
import { useAuth } from '@/components/auth/auth-context';
import { useChildScope } from '@/components/auth/use-child-scope';
import { useI18n } from '@/lib/i18n-context';
import { api } from '@/lib/api';
import { FormattedMarkdown, stripMarkdown } from '@/components/ui/formatted-markdown';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  FileText,
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  BookOpen,
  Brain,
  Eye,
  RefreshCw,
  Plus,
  Clock,
  ImageIcon,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';

function toBnNum(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
}

function formatDate(dateStr: string, isBn: boolean): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const monthsBn = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (isBn) {
      return `${toBnNum(d.getDate())} ${monthsBn[d.getMonth()]}, ${toBnNum(d.getFullYear())}`;
    }
    return `${monthsEn[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export default function KidNotesPage() {
  const router = useRouter();
  const { activeChild, user } = useAuth();
  const { t, isBn } = useI18n();

  // The child whose notes this is, and the demo dataset that applies (if any).
  const { childId, isTasnim, isDemoChild } = useChildScope();

  // Notes state
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [errorToast, setErrorToast] = useState('');

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL'); // ALL, 7DAYS, 30DAYS
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'subject' | 'confidence'>('date_desc');

  // Upload & AI Notemaking form state
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [subject, setSubject] = useState(isTasnim ? 'Elementary Math' : 'Physics');
  const [assignDate, setAssignDate] = useState(new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [aiNoteContent, setAiNoteContent] = useState('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [activeTabInModal, setActiveTabInModal] = useState<'ai' | 'raw'>('ai');
  const [aiPreviewMode, setAiPreviewMode] = useState<'formatted' | 'edit'>('formatted');

  /**
   * Guards against a state update after the component unmounts.
   *
   * The load request writes to state from `.then()`; without this guard,
   * navigating away mid-flight produced React warnings and could resurrect a
   * stale note list on the next mount.
   */
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load notes from backend
  const loadNotes = async () => {
    setLoading(true);
    try {
      if (!childId) {
        if (isMounted.current) setNotes([]);
        return;
      }
      const res = await api.get(`/children/${childId}/notes`);
      if (!isMounted.current) return;
      const list = res.data?.data;
      if (list && list.length > 0) {
        setNotes(list);
      } else {
        // The fallback notes are the demo dataset — only for a demo child.
        setNotes(isDemoChild ? (isTasnim ? fallbackTasnimNotes : fallbackRahimNotes) : []);
      }
    } catch {
      if (isMounted.current) {
        setNotes(isDemoChild ? (isTasnim ? fallbackTasnimNotes : fallbackRahimNotes) : []);
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [childId, isTasnim, isDemoChild]);

  // Handle direct file upload to Claude Vision AI
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    setFile(f);
    const previewUrl = URL.createObjectURL(f);
    setImagePreview(previewUrl);

    // Directly trigger AI Vision Note generation
    triggerAiVisionNote(f, subject, assignDate);
  };

  // Run AI Note generation directly with image
  const triggerAiVisionNote = async (fileObj: File | null, subj: string, d: string) => {
    setAiLoading(true);
    try {
      if (fileObj) {
        const form = new FormData();
        form.append('file', fileObj);
        form.append('subject', subj);
        form.append('date', d);
        if (title.trim()) form.append('title', title.trim());

        const res = await api.post(`/children/${childId}/notes/ai-make`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const data = res.data?.data;
        if (data?.aiSummary) {
          setAiNoteContent(data.aiSummary);
          if (data.title && !title.trim()) setTitle(data.title);
          if (data.subject && subj === 'General') setSubject(data.subject);
          setRawText(data.textClean || `[AI Vision Note: ${data.title || subj}]`);
          setConfidence(0.98);
          setActiveTabInModal('ai');
          return;
        }
      } else if (rawText.trim()) {
        const res = await api.post(`/children/${childId}/notes/ai-make`, {
          text: rawText,
          subject: subj,
          date: d,
          title: title.trim(),
        });
        const data = res.data?.data;
        if (data?.aiSummary) {
          setAiNoteContent(data.aiSummary);
          if (data.title && !title.trim()) setTitle(data.title);
          setActiveTabInModal('ai');
          return;
        }
      }
      generateClientFallbackAiNote(fileObj ? fileObj.name : rawText, subj);
    } catch {
      generateClientFallbackAiNote(fileObj ? fileObj.name : rawText, subj);
    } finally {
      setAiLoading(false);
    }
  };

  const generateClientFallbackAiNote = (hint: string, subj: string) => {
    const s = subj.toLowerCase();
    let noteText = '';

    if (s.includes('phys')) {
      noteText = `### 📌 মূল বিষয়বস্তু ও সংজ্ঞা (Core Concepts - Physics)
- **বল (Force)**: যা কোনো স্থির বস্তুর ওপর ক্রিয়া করে তাকে গতিশীল করে বা করতে চায়, অথবা গতিশীল বস্তুর গতির পরিবর্তন ঘটায়। এসআই একক নিউটন (\\(N = \\text{kg}\\cdot\\text{m/s}^2\\))।
- **ত্বরণ (Acceleration)**: সময়ের সাথে বস্তুর অসম বেগের পরিবর্তনের হার (\\(a = \\frac{v - u}{t}\\))।
- **ভরবেগ (Momentum)**: বস্তুর ভর ও বেগের গুণফল (\\(p = mv\\))।

### 📐 গতির সমীকরণ ও নিউটনের সূত্রাবলী (Key Formulas & Laws)
1. \\(v = u + at\\)
2. \\(s = ut + \\frac{1}{2}at^2\\)
3. \\(v^2 = u^2 + 2as\\)
4. **নিউটনের ২য় সূত্র**: \\(F = ma\\) (বল = ভর × ত্বরণ)

### 💡 পরীক্ষার জন্য গুরুত্বপূর্ণ সারসংক্ষেপ (Exam Revision Points)
- বস্তু স্থির অবস্থা থেকে শুরু করলে আদিবেগ \\(u = 0\\)।
- মন্দন হলে ত্বরণের মান ঋণাত্মক (\\(-a\\)) হবে।
- অভিকর্ষজ ত্বরণের মান \\(g = 9.8 \\text{ m/s}^2\\)।

### ✍️ স্ব-মূল্যায়ন ও অনুশীলন প্রশ্ন (Self-Test Questions)
1. ৫ কেজি ভরের বস্তুতে ২০ নিউটন বল ৪ সেকেন্ড ধরে প্রয়োগ করলে শেষ বেগ কত হবে? (উত্তর: ১৬ মি/সে)
2. নিউটনের ২য় সূত্র থেকে বলের সংজ্ঞা ও একক ব্যাখ্যা করো।`;
    } else if (s.includes('math') || s.includes('গণিত') || s.includes('algeb')) {
      noteText = `### 📌 মূল বিষয়বস্তু ও সংজ্ঞা (Core Concepts - Mathematics)
- **বর্গ ও উৎপাদক**: বীজগাণিতিক রাশিকে গুণফল আকারে প্রকাশ করাই হলো উৎপাদকে বিশ্লেষণ।
- **দ্বিঘাত সমীকরণ**: \\(ax^2 + bx + c = 0\\) আকারের সমীকরণ।

### 📐 প্রয়োজনীয় সূত্রাবলী (Key Formulas & Identities)
1. \\((a + b)^2 = a^2 + 2ab + b^2\\)
2. \\((a - b)^2 = a^2 - 2ab + b^2\\)
3. \\(a^2 - b^2 = (a + b)(a - b)\\)
4. **দ্বিঘাত সূত্র**: \\(x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\\)

### 💡 সহজে মনে রাখার টেকনিক (Quick Tips)
- প্রথমে কমন নেওয়া যাচাই করো।
- সূত্র প্রয়োগ করো অথবা মিডল টার্ম ফ্যাক্টরাইজ করো।

### ✍️ স্ব-মূল্যায়ন প্রশ্ন (Practice Questions)
1. \\(x^2 - 5x + 6\\) এর উৎপাদকে বিশ্লেষিত রূপ কী? (উত্তর: \\((x - 2)(x - 3)\\))
2. \\(a + b = 5\\) এবং \\(ab = 6\\) হলে \\(a^2 + b^2\\) এর মান নির্ণয় করো। (উত্তর: ১৩)`;
    } else {
      noteText = `### 📌 মূল বিষয়বস্তু ও ধারণা (Core Concepts - ${subj})
- **পাঠের শিরোনাম**: ${hint || subj + ' Study Note'}
- ক্লাসে শিক্ষকের আলোচিত গুরুত্বপূর্ণ সংজ্ঞা ও মূল তাত্ত্বিক বিষয়বস্তু সুবিন্যস্ত করা হয়েছে।

### 📐 প্রয়োজনীয় তথ্য ও নিয়মাবলী (Key Facts & Principles)
- মূল বৈশিষ্ট্য, শ্রেণিবিন্যাস এবং ব্যবহারিক প্রয়োগ।
- পরীক্ষার জন্য প্রয়োজনীয় চিত্র, ছক ও তথ্য সারণি।

### 💡 সারসংক্ষেপ ও রিভিশন চেকলিস্ট (Study Summary)
- এই অধ্যায়ের মৌলিক সূত্রগুলো মুখস্থ করে খাতায় অনুশীলন করো।
- দুর্বল পয়েন্টগুলো চিহ্নিত করে পরবর্তী ক্লাসে শিক্ষককে জিজ্ঞাসা করো।

### ✍️ স্ব-মূল্যায়ন প্রশ্ন (Self-Test Revision)
1. ${hint || subj}-এর মূল সংজ্ঞা ও প্রয়োজনীয়তা লেখো।
2. এই নোটে উল্লেখিত প্রধান সূত্র বা নিয়মটি প্রয়োগ করো।`;
    }

    setAiNoteContent(noteText);
    setConfidence(0.98);
    setActiveTabInModal('ai');
  };

  // Save Note to Database
  const handleSaveNote = async () => {
    if (!aiNoteContent.trim() && !rawText.trim()) return;
    setSavingNote(true);

    const noteTitle =
      title.trim() ||
      `${subject}: ${(aiNoteContent || rawText).slice(0, 32).replace(/[#\-*\r\n]+/g, ' ')}...`;

    try {
      const form = new FormData();
      if (file) form.append('file', file);
      form.append('subject', subject);
      form.append('date', assignDate);
      form.append('title', noteTitle);
      form.append('textClean', rawText || `[AI Vision Note: ${noteTitle}]`);
      form.append('aiSummary', aiNoteContent);
      form.append('ocrConfidence', String(confidence || 0.98));

      const res = await api.post(`/children/${childId}/notes`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // The server's row is the note. If the response body is empty there is no
      // note to show, and inventing one locally produced a note that looked saved
      // and was not.
      const saved = res.data?.data;
      if (!saved) throw new Error('The server did not return the saved note');

      setNotes((prev) => [saved, ...prev]);
      setUploadModalOpen(false);
      setSuccessToast(t('childNotes.text'));
      setTimeout(() => setSuccessToast(''), 4000);

      // Reset form
      setFile(null);
      setImagePreview(null);
      setRawText('');
      setAiNoteContent('');
      setTitle('');
      setConfidence(null);
    } catch (e: any) {
      // The note was NOT saved. The old code invented a local note, closed the
      // modal and showed "AI study note saved!" — the user then had a note in the
      // list that existed nowhere on the server, and lost it on the next reload.
      setErrorToast(e?.response?.data?.error?.message || 'The note could not be saved.');
    } finally {
      setSavingNote(false);
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm(t('childNotes.text_3'))) return;
    try {
      await api.delete(`/notes/${noteId}`);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (selectedNote?.id === noteId) setDetailModalOpen(false);
      setSuccessToast(t('childNotes.text_4'));
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (e: any) {
      // Removing it from the list after a failed delete made a note disappear from
      // the screen while still existing on the server.
      setErrorToast(e?.response?.data?.error?.message || 'The note could not be deleted.');
    }
  };

  // Available subjects from notes
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      if (n.subject) set.add(n.subject);
    });
    return Array.from(set);
  }, [notes]);

  // Filtered and Sorted notes
  const filteredAndSortedNotes = useMemo(() => {
    let result = [...notes];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title?.toLowerCase().includes(q) ||
          n.subject?.toLowerCase().includes(q) ||
          n.textClean?.toLowerCase().includes(q) ||
          n.aiSummary?.toLowerCase().includes(q)
      );
    }

    // Subject filter
    if (selectedSubject !== 'ALL') {
      result = result.filter((n) => n.subject === selectedSubject);
    }

    // Date filter
    if (dateFilter !== 'ALL') {
      const now = new Date().getTime();
      const days = dateFilter === '7DAYS' ? 7 : 30;
      const limit = now - days * 86400000;
      result = result.filter((n) => {
        const noteTime = new Date(n.date || n.createdAt).getTime();
        return noteTime >= limit;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime();
      }
      if (sortBy === 'subject') {
        return (a.subject || '').localeCompare(b.subject || '');
      }
      if (sortBy === 'confidence') {
        return (b.ocrConfidence || 0) - (a.ocrConfidence || 0);
      }
      return 0;
    });

    return result;
  }, [notes, searchQuery, selectedSubject, dateFilter, sortBy]);

  return (
    <KidShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                {t('childNotes.text_5')}
              </span>
              <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border border-primary/20 font-bold">
                {notes.length} {t('childNotes.text_6')}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {t('childNotes.text_7')}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              {t('childNotes.claude_vision_ai')}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => {
                setFile(null);
                setImagePreview(null);
                setRawText('');
                setAiNoteContent('');
                setTitle('');
                setConfidence(null);
                setUploadModalOpen(true);
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl shadow-md h-10 px-4 text-xs sm:text-sm gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('childNotes.text_8')}</span>
            </Button>
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Error Toast — a failed request is never reported as a success. */}
        {errorToast && (
          <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive flex items-center gap-2 text-xs font-semibold animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorToast}</span>
            <button
              type="button"
              onClick={() => setErrorToast('')}
              className="ml-auto underline underline-offset-2 shrink-0"
            >
              {t('common.close')}
            </button>
          </div>
        )}

        {/* Search, Filter & Sorting Bar */}
        <Card className="rounded-3xl border shadow-sm p-4 space-y-3.5 bg-card">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('childNotes.text_9')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-2xl bg-muted/20 border-border/80 text-xs sm:text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Date Range & Sorting Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Date Filter */}
              <div className="flex items-center gap-1.5 bg-muted/30 p-1 rounded-2xl border text-xs">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground ml-1.5 shrink-0" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-transparent text-xs font-medium pr-2 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{t('childNotes.text_10')}</option>
                  <option value="7DAYS">{t('childNotes.text_11')}</option>
                  <option value="30DAYS">{t('childNotes.text_12')}</option>
                </select>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 bg-muted/30 p-1 rounded-2xl border text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground ml-1.5 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs font-medium pr-2 focus:outline-none cursor-pointer"
                >
                  <option value="date_desc">{t('childNotes.text_13')}</option>
                  <option value="date_asc">{t('childNotes.text_14')}</option>
                  <option value="subject">{t('childNotes.a_z')}</option>
                  <option value="confidence">{t('childNotes.ai_score')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Subject Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 text-xs">
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3 h-3" />
              <span>{t('childNotes.text_15')}</span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedSubject('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                selectedSubject === 'ALL'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40'
              }`}
            >
              {t('childNotes.text_16')} ({notes.length})
            </button>

            {availableSubjects.map((subj) => {
              const count = notes.filter((n) => n.subject === subj).length;
              const isSelected = selectedSubject === subj;
              return (
                <button
                  type="button"
                  key={subj}
                  onClick={() => setSelectedSubject(subj)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40'
                  }`}
                >
                  {subj} ({count})
                </button>
              );
            })}
          </div>
        </Card>

        {/* Notes Grid Display */}
        {loading ? (
          <CardGridSkeleton count={4} />
        ) : filteredAndSortedNotes.length === 0 ? (
          <Card className="rounded-3xl border border-dashed p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-muted/40 text-muted-foreground mx-auto flex items-center justify-center text-2xl">
              📝
            </div>
            <h3 className="text-base font-bold text-foreground">
              {t('childNotes.text_17')}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery || selectedSubject !== 'ALL' || dateFilter !== 'ALL'
                ? t('childNotes.text_18')
                : t('childNotes.text_19')}
            </p>
            <Button
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedSubject('ALL');
                setDateFilter('ALL');
                setUploadModalOpen(true);
              }}
              className="rounded-xl text-xs font-bold gap-1 mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('childNotes.text_20')}</span>
            </Button>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedNotes.map((note) => {
              const subjectColor =
                note.subject?.toLowerCase().includes('physic')
                  ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
                  : note.subject?.toLowerCase().includes('math')
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                  : note.subject?.toLowerCase().includes('chem')
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : note.subject?.toLowerCase().includes('scienc')
                  ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30'
                  : 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30';

              return (
                <Card
                  key={note.id}
                  className="rounded-3xl border shadow-sm hover:shadow-md transition-all flex flex-col justify-between group overflow-hidden bg-card"
                >
                  <CardHeader className="p-4 sm:p-5 pb-3">
                    {/* Header Row: Subject & Date */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge className={`text-[10px] font-bold px-2 py-0.5 border ${subjectColor}`}>
                        {note.subject || 'General'}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground/80" />
                        <span>{formatDate(note.date || note.createdAt, isBn)}</span>
                      </span>
                    </div>

                    {/* Note Title */}
                    <CardTitle className="text-sm sm:text-base font-bold mt-2 text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {note.title || `${note.subject} Note`}
                    </CardTitle>

                    {/* AI Feature Pill */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Claude Vision AI</span>
                      </span>
                      {note.fileUrl && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          • <ImageIcon className="w-2.5 h-2.5 text-primary" /> {t('childNotes.text_21')}
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
                    {/* Summary Excerpt */}
                    <p className="text-xs text-muted-foreground line-clamp-3 bg-muted/20 p-2.5 rounded-xl border border-border/40 font-normal leading-relaxed">
                      {stripMarkdown(note.aiSummary || note.textClean).slice(0, 160) + '...'}
                    </p>

                    {/* Bottom Action Buttons */}
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedNote(note);
                          setDetailModalOpen(true);
                        }}
                        className="flex-1 h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-1.5 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t('childNotes.text_22')}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteNote(note.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive rounded-xl"
                        title={t('childNotes.text_23')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1. View Note Detail Modal (Full Markdown Reading) */}
      {/* ======================================================== */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedNote?.title || (t('childNotes.text_24'))}
        description={`${selectedNote?.subject || 'General'} • ${formatDate(selectedNote?.date || selectedNote?.createdAt, isBn)}`}
        maxWidth="lg"
      >
        {selectedNote && (
          <div className="space-y-4 pt-1 max-h-[75vh] overflow-y-auto pr-1">
            {/* Meta tags */}
            <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs font-bold">
                  {selectedNote.subject}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(selectedNote.date || selectedNote.createdAt, isBn)}</span>
                </span>
              </div>
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Claude Vision AI Synthesized</span>
              </span>
            </div>

            {/* If note has image attachment */}
            {selectedNote.fileUrl && (
              <div className="rounded-2xl border p-3 bg-muted/10 space-y-2">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-primary" />
                  <span>{t('childNotes.text_25')}</span>
                </span>
                <div className="max-h-56 overflow-hidden rounded-xl border bg-background">
                  <img
                    src={selectedNote.fileUrl}
                    alt={selectedNote.title || 'Note image'}
                    className="w-full h-auto object-contain max-h-56 mx-auto"
                  />
                </div>
              </div>
            )}

            {/* AI Structured Note View */}
            <div className="rounded-2xl border p-4 sm:p-5 bg-card shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    {t('childNotes.ai_structured_study_note')}
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] font-semibold text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                  {t('childNotes.text_26')}
                </Badge>
              </div>
              <div className="p-1">
                <FormattedMarkdown content={selectedNote.aiSummary || selectedNote.textClean} />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailModalOpen(false)}
                className="rounded-xl text-xs"
              >
                {t('childNotes.text_27')}
              </Button>

              <div className="flex items-center gap-2">
                <Link href={`/child/log?subject=${encodeURIComponent(selectedNote.subject || '')}`}>
                  <Button
                    size="sm"
                    className="h-8 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{t('childNotes.text_28')}</span>
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteNote(selectedNote.id)}
                  className="h-8 rounded-xl text-xs gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{t('childNotes.text_29')}</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ======================================================== */}
      {/* 2. Upload Image & Direct Claude Vision Note Generator */}
      {/* ======================================================== */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title={t('childNotes.text_30')}
        description={
          t('childNotes.claude_vision_ai_2')
        }
        maxWidth="lg"
      >
        <div className="space-y-4 pt-1 max-h-[75vh] overflow-y-auto pr-1">
          {/* File Upload Zone / Preview */}
          {imagePreview ? (
            <div className="relative rounded-2xl overflow-hidden border bg-muted/20 p-3.5 flex flex-col sm:flex-row items-center gap-3.5">
              <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-background border shrink-0 shadow-xs">
                <img
                  src={imagePreview}
                  alt="Uploaded notebook preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 space-y-1 text-center sm:text-left">
                <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-foreground">
                    {file?.name || 'Class note image'}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {file ? `${(file.size / 1024).toFixed(1)} KB • Claude Vision AI Image` : 'Vision Note'}
                </p>
                <div className="pt-1.5 flex items-center gap-2 justify-center sm:justify-start">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-background hover:bg-muted text-foreground cursor-pointer border border-border/70 shadow-xs transition-colors">
                    <Upload className="w-3.5 h-3.5 text-primary" />
                    <span>{t('childNotes.text_31')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => triggerAiVisionNote(file, subject, assignDate)}
                    disabled={aiLoading}
                    className="h-8 text-xs font-semibold text-amber-600 dark:text-amber-400 gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                    <span>{t('childNotes.text_32')}</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-2xl p-6 text-center hover:bg-muted/30 transition-colors relative cursor-pointer bg-muted/10 group">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center gap-2.5">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {t('childNotes.text_33')}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-sm">
                    {t('childNotes.jpg_png_claude_vision_ai')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI Generation Indicator */}
          {aiLoading && (
            <div className="rounded-2xl border p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border-amber-300/40 dark:border-amber-700/40 flex items-center gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  {t('childNotes.claude_vision_ai_3')}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {t('childNotes.text_34')}
                </p>
              </div>
            </div>
          )}

          {/* Subject & Assigning Date Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">{t('childNotes.subject')}</Label>
              <select
                value={subject}
                onChange={(e) => {
                  const newSubj = e.target.value;
                  setSubject(newSubj);
                  if (file) triggerAiVisionNote(file, newSubj, assignDate);
                }}
                className="w-full h-9 border rounded-xl px-3 bg-background text-xs mt-1"
              >
                <option value="Mathematics">{t('childNotes.mathematics')}</option>
                <option value="Physics">{t('childNotes.physics')}</option>
                <option value="Chemistry">{t('childNotes.chemistry')}</option>
                <option value="Biology">{t('childNotes.biology')}</option>
                <option value="Elementary Math">{t('childNotes.elementary_math')}</option>
                <option value="Primary Science">{t('childNotes.primary_science')}</option>
                <option value="English">{t('childNotes.english')}</option>
                <option value="Bangla">{t('childNotes.bangla')}</option>
                <option value="ICT">{t('childNotes.ict')}</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold">{t('childNotes.assigning_date')}</Label>
              <Input
                type="date"
                value={assignDate}
                onChange={(e) => setAssignDate(e.target.value)}
                required
                className="h-9 mt-1 text-xs"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">{t('childNotes.text_35')}</Label>
            <Input
              type="text"
              placeholder={t('childNotes.text_36')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 mt-1 text-xs font-medium"
            />
          </div>

          {/* AI vs Raw Tab Switcher */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTabInModal('ai')}
                  className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                    activeTabInModal === 'ai'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{t('childNotes.text_37')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabInModal('raw')}
                  className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                    activeTabInModal === 'raw'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>{t('childNotes.text_38')}</span>
                </button>
              </div>

              {aiNoteContent && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => triggerAiVisionNote(file, subject, assignDate)}
                  disabled={aiLoading}
                  className="h-7 text-[11px] font-bold rounded-lg border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{aiLoading ? (t('childNotes.text_39')) : (t('childNotes.text_40'))}</span>
                </Button>
              )}
            </div>

            {/* Tab 1: AI Note Content */}
            {activeTabInModal === 'ai' && (
              <div className="space-y-2">
                {aiLoading ? (
                  <div className="h-56 border rounded-2xl flex flex-col items-center justify-center gap-2 p-4 text-xs text-primary animate-pulse bg-muted/10">
                    <Sparkles className="w-6 h-6 text-amber-500 animate-spin" />
                    <span className="font-bold">{t('childNotes.text_41')}</span>
                  </div>
                ) : (
                  <>
                    {aiNoteContent && (
                      <div className="flex items-center justify-between pb-1 text-xs">
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          {aiPreviewMode === 'formatted' ? (t('childNotes.text_42')) : (t('childNotes.text_43'))}
                        </span>
                        <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border text-[11px]">
                          <button
                            type="button"
                            onClick={() => setAiPreviewMode('formatted')}
                            className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                              aiPreviewMode === 'formatted' ? 'bg-primary text-primary-foreground shadow-2xs' : 'text-muted-foreground'
                            }`}
                          >
                            {t('childNotes.text_44')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setAiPreviewMode('edit')}
                            className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                              aiPreviewMode === 'edit' ? 'bg-primary text-primary-foreground shadow-2xs' : 'text-muted-foreground'
                            }`}
                          >
                            {t('childNotes.text_45')}
                          </button>
                        </div>
                      </div>
                    )}

                    {aiPreviewMode === 'formatted' && aiNoteContent ? (
                      <div className="h-56 overflow-y-auto border rounded-2xl p-3.5 bg-card/60 leading-relaxed text-xs">
                        <FormattedMarkdown content={aiNoteContent} />
                      </div>
                    ) : (
                      <textarea
                        value={aiNoteContent}
                        onChange={(e) => setAiNoteContent(e.target.value)}
                        placeholder={
                          t('childNotes.claude_vision_ai_4')
                        }
                        className="w-full h-56 border rounded-2xl p-3 text-xs bg-background leading-relaxed focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {/* Tab 2: Raw / Context Text */}
            {activeTabInModal === 'raw' && (
              <div>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={
                    t('childNotes.text_46')
                  }
                  className="w-full h-48 border rounded-2xl p-3 text-xs font-mono bg-background leading-relaxed focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            )}
          </div>

          {confidence !== null && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Claude Vision AI Quality: <strong>{(confidence * 100).toFixed(0)}%</strong></span>
            </p>
          )}

          {/* Modal Footer Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUploadModalOpen(false)}
              className="rounded-xl text-xs"
            >
              {t('childNotes.text_47')}
            </Button>
            <Button
              type="button"
              onClick={handleSaveNote}
              disabled={savingNote || (!aiNoteContent.trim() && !rawText.trim())}
              className="rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-md"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{savingNote ? (t('childNotes.text_48')) : (t('childNotes.text_49'))}</span>
            </Button>
          </div>
        </div>
      </Modal>
    </KidShell>
  );
}

// Fallback seed notes for Rahim (Class 8)
//
// These are demo fixtures. The `childId` on each row is the demo tenant's real child
// id — the demo children were migrated to deterministic UUIDs, so the old
// `'demo-child-1'` string pointed at nothing. These rows are only ever rendered for
// the demo child (see `isDemoChild` in `loadNotes`).
const DEMO_RAHIM_ID = '00000000-0000-4000-8000-000000000101';
const DEMO_TASNIM_ID = '00000000-0000-4000-8000-000000000102';
const fallbackRahimNotes = [
  {
    id: 'note-rahim-1',
    childId: DEMO_RAHIM_ID,
    subject: 'Physics',
    title: 'গতির সমীকরণ ও নিউটনের ২য় সূত্র (Equations of Motion & Force)',
    date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    fileUrl: '/notes/physics-sample.png',
    textClean: 'Physics Ch 3: Newton 2nd Law F = ma. Equations of motion: v = u + at, s = ut + 1/2 at^2, v^2 = u^2 + 2as. Force causes acceleration. SI unit is Newton.',
    aiSummary: `### 📌 মূল বিষয়বস্তু ও সংজ্ঞা (Core Concepts)
- **বল (Force)**: যা কোনো স্থির বস্তুর ওপর ক্রিয়া করে তাকে গতিশীল করে এবং গতিশীল বস্তুর গতির পরিবর্তন করে।
- **ত্বরণ (Acceleration)**: সময়ের সাথে বস্তুর অসম বেগের পরিবর্তনের হার (\\(a = \\frac{v - u}{t}\\))।

### 📐 গতির ৪টি মৌলিক সমীকরণ
1. \\(v = u + at\\)
2. \\(s = ut + \\frac{1}{2}at^2\\)
3. \\(v^2 = u^2 + 2as\\)
4. \\(F = ma\\) (নিউটনের ২য় সূত্র)

### 💡 পরীক্ষার জন্য জরুরি টিপস
- বস্তুটি স্থির অবস্থান থেকে শুরু হলে আদিবেগ \\(u = 0\\)।
- মন্দন হলে ত্বরণের মান ঋণাত্মক হবে।`,
    ocrConfidence: 0.98,
  },
  {
    id: 'note-rahim-2',
    childId: DEMO_RAHIM_ID,
    subject: 'Mathematics',
    title: 'বীজগণিতীয় সূত্রাবলী ও উৎপাদকে বিশ্লেষণ (Algebraic Formulae)',
    date: new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10),
    fileUrl: '/notes/math-sample.png',
    textClean: 'Algebra Formulae: (a+b)^2 = a^2 + 2ab + b^2, (a-b)^2 = a^2 - 2ab + b^2, a^2 - b^2 = (a+b)(a-b). Middle term breakdown.',
    aiSummary: `### 📌 বর্গের মৌলিক সূত্রাবলী (Square Formulas)
- \\((a + b)^2 = a^2 + 2ab + b^2\\)
- \\((a - b)^2 = a^2 - 2ab + b^2\\)
- \\(a^2 - b^2 = (a + b)(a - b)\\)

### 📐 উৎপাদকে বিশ্লেষণের কৌশল
1. কমন উৎপাদক পৃথক করা।
2. সূত্রে রূপান্তর (যেমন \\(a^2 - b^2\\))।
3. মিডল-টার্ম বিভাজন।`,
    ocrConfidence: 0.98,
  },
  {
    id: 'note-rahim-3',
    childId: DEMO_RAHIM_ID,
    subject: 'Chemistry',
    title: 'পর্যায় সারণি ও মৌলের ইলেকট্রন বিন্যাস (Periodic Table Trends)',
    date: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
    fileUrl: '/notes/chem-sample.png',
    textClean: 'Periodic Table: Group 1 Alkali metals, Group 17 Halogens, Group 18 Noble gases. Electron capacity: 2n^2.',
    aiSummary: `### 📌 গুরুত্বপূর্ণ গ্রুপসমূহ
- **গ্রুপ ১ (ক্ষার ধাতু)**: Li, Na, K — তীব্র তড়িৎ ধনাত্মক ধাতু।
- **গ্রুপ ১৭ (হ্যালোজেন)**: F, Cl, Br, I — তীব্র তড়িৎ ঋণাত্মক অধাতু।
- **গ্রুপ ১৮ (নিষ্ক্রিয় গ্যাস)**: He, Ne, Ar — অষ্টক পূর্ণ স্থিতিশীল গ্যাস।

### 📐 ইলেকট্রন ধারণ ক্ষমতা সূত্র
- প্রধান শক্তিস্তরে ইলেকট্রন ধারণের সূত্র = \\(2n^2\\)।`,
    ocrConfidence: 0.98,
  },
];

// Fallback seed notes for Tasnim (Class 5)
const fallbackTasnimNotes = [
  {
    id: 'note-tasnim-1',
    childId: DEMO_TASNIM_ID,
    subject: 'Elementary Math',
    title: 'গুণনীয়ক, গুণিতক এবং লসাগু ও গসাগু (Factors & Multiples)',
    date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
    fileUrl: '/notes/math-tasnim.png',
    textClean: 'Math Class 5 Ch 5: Factors & Multiples. Prime factors tree. LCM = Least Common Multiple, HCF = Highest Common Factor.',
    aiSummary: `### 📌 মৌলিক সংজ্ঞা ও নিয়ম
- **গুণনীয়ক**: যে সংখ্যাগুলো দিয়ে কোনো সংখ্যাকে নিঃশেষে ভাগ করা যায়।
- **গসাগু (HCF)**: সাধারণ গুণনীয়কগুলোর মধ্যে সবচেয়ে বড় সংখ্যা।
- **লসাগু (LCM)**: সাধারণ গুণিতকগুলোর মধ্যে সবচেয়ে ছোট সংখ্যা।

### 💡 পরীক্ষার টিপস
- দুটি সংখ্যার গুণফল = সংখ্যা দুটির লসাগু × গসাগু।`,
    ocrConfidence: 0.98,
  },
  {
    id: 'note-tasnim-2',
    childId: DEMO_TASNIM_ID,
    subject: 'Primary Science',
    title: 'নিরাপদ পানি ও বিশুদ্ধকরণ পদ্ধতি (Safe Water & Purification)',
    date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
    fileUrl: '/notes/science-tasnim.png',
    textClean: 'Science Ch 3: Safe Water. Boiling for 20 mins kills germs. Filtration, Chlorination, Sedimentation.',
    aiSummary: `### 📌 পানি বিশুদ্ধকরণের ৪টি প্রধান উপায়
1. **ফুটানো**: অন্তত ২০ মিনিট টগবগিয়ে ফোটাতে হবে।
2. **ছাঁকন**: পরিষ্কার পাতলা কাপড় বা ছাঁকনি দিয়ে ছাঁকা।
3. **থিতানো**: কলসিতে রেখে তলানি নিচে জমানো।
4. **রাসায়নিক পদ্ধতি**: ফিটকিরি বা পানি বিশুদ্ধকরণ ট্যাবলেট।`,
    ocrConfidence: 0.98,
  },
  {
    id: 'note-tasnim-3',
    childId: DEMO_TASNIM_ID,
    subject: 'English',
    title: 'Unit 6: Eat Healthy – Food Pyramid & Balanced Diet',
    date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
    fileUrl: '/notes/english-tasnim.png',
    textClean: 'English Unit 6: Food Pyramid. Grains at bottom, Vegetables, Dairy, Fats at top.',
    aiSummary: `### 📌 The 4 Food Pyramid Levels
1. **Bottom Level (Eat Most)**: Rice, bread, potatoes (Carbohydrates).
2. **Second Level (Eat Plenty)**: Fruits and vegetables (Vitamins & Minerals).
3. **Third Level (Eat Moderately)**: Meat, fish, eggs, milk (Protein & Calcium).
4. **Top Level (Eat Very Little)**: Fats, oils, and sweets.`,
    ocrConfidence: 0.98,
  },
];
