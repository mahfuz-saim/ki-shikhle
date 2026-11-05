'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { KidShell } from '@/components/layout/kid-shell';
import { useAuth } from '@/components/auth/auth-context';
import { useChildScope } from '@/components/auth/use-child-scope';
import { useI18n } from '@/lib/i18n-context';
import { getInstitutionType } from '@/lib/institution';
import { api } from '@/lib/api';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  ArrowLeft,
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  Check,
  Edit3,
  ListChecks,
  FileText,
  HelpCircle,
  Play,
  Layers,
} from 'lucide-react';

interface StructuredVoiceLog {
  subject: string;
  subjectBn: string;
  topicsText: string;
  source: 'school' | 'tuition' | 'self_study' | 'college';
  durationMin: number;
  confidence: number;
  keyConcepts: string[];
  homeworkAssigned?: string | null;
  summaryMessage: string;
  rawTranscript: string;
  aiModelUsed: string;
}

function KidLogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeChild, user } = useAuth();
  const { t, isBn } = useI18n();

  const studentGrade = user?.grade || activeChild?.grade || 'Class 8';
  const institutionType = getInstitutionType(studentGrade);

  // The child this log belongs to. The old fallback was the hardcoded
  // `'demo-child-1'` — an id the server no longer knows — so the log was posted
  // against a child that does not exist.
  const { childId, isTasnim } = useChildScope();

  // Mode: 'voice' | 'manual'
  const initialMode = searchParams?.get('mode') === 'manual' ? 'manual' : 'voice';
  const [mode, setMode] = useState<'voice' | 'manual'>(initialMode);

  // Manual Form State
  const [topic, setTopic] = useState(searchParams?.get('topics') || '');
  const [source, setSource] = useState(searchParams?.get('source') || 'school');
  const [subject, setSubject] = useState(searchParams?.get('subject') || (isTasnim ? 'Elementary Math' : 'Mathematics'));
  const [confidence, setConfidence] = useState(5);
  const [durationMin, setDurationMin] = useState(Number(searchParams?.get('durationMin')) || 45);

  // Voice Recording State
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<'bn-BD' | 'en-US'>('bn-BD');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  // Structured AI Preview State
  const [structuredPreview, setStructuredPreview] = useState<StructuredVoiceLog | null>(null);
  const [isEditingPreview, setIsEditingPreview] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedEntry, setSavedEntry] = useState<any>(null);

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setVoiceSupported(false);
      }
    }
  }, []);

  const startVoiceRecording = () => {
    setVoiceError('');
    setStructuredPreview(null);

    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      setVoiceError(
        t('childLogHome.text')
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript + ' ';
        }
        setVoiceTranscript(currentText.trim());
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceError(
            t('childLogHome.text_2')
          );
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Speech start error:', err);
      setIsListening(false);
      setVoiceError(err.message || 'ভয়েস রেকর্ডিং শুরু করা যায়নি');
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Send speech transcript to Claude AI for structuring
  const handleAnalyzeWithClaude = async (customText?: string) => {
    const textToAnalyze = (customText || voiceTranscript).trim();
    if (!textToAnalyze) {
      setVoiceError(t('childLogHome.text_3'));
      return;
    }

    stopVoiceRecording();
    setIsAnalyzingAI(true);
    setVoiceError('');

    try {
      const res = await api.post(`/children/${childId}/entries/voice-structure`, {
        speechText: textToAnalyze,
      });

      const structured = res.data?.data;
      if (structured) {
        setStructuredPreview(structured);
      } else {
        throw new Error('Could not structure voice response');
      }
    } catch (err: any) {
      console.warn('Claude AI structuring error:', err);
      // Fallback preview
      setStructuredPreview({
        subject: isTasnim ? 'Elementary Math' : 'Physics',
        subjectBn: isTasnim ? 'প্রাথমিক গণিত' : 'পদার্থবিজ্ঞান',
        topicsText: textToAnalyze,
        source: 'school',
        durationMin: 60,
        confidence: 5,
        keyConcepts: [
          t('childLogHome.text_4'),
          t('childLogHome.text_5'),
        ],
        homeworkAssigned: t('childLogHome.text_6'),
        summaryMessage: t('childLogHome.text_7'),
        rawTranscript: textToAnalyze,
        aiModelUsed: 'Claude 3.5 Haiku',
      });
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // Student approves structured preview to complete logging
  const handleApproveAndComplete = async () => {
    if (!structuredPreview) return;
    setSubmitting(true);
    setSaveError('');

    const payload = {
      source: structuredPreview.source || 'tuition',
      subjectId: structuredPreview.subject || 'General',
      topicsText: structuredPreview.topicsText || structuredPreview.rawTranscript,
      durationMin: structuredPreview.durationMin || 60,
      confidence: structuredPreview.confidence || 5,
      date: new Date().toISOString().slice(0, 10),
      notes: `${structuredPreview.keyConcepts?.join(' • ') || ''}${
        structuredPreview.homeworkAssigned ? ` | হোমওয়ার্ক: ${structuredPreview.homeworkAssigned}` : ''
      }`,
    };

    try {
      const res = await api.post(`/children/${childId}/entries`, payload);
      setSavedEntry(res.data?.data || payload);
      setSuccess(true);
    } catch (err: any) {
      // The old code caught the failure and showed the "saved" screen anyway — the
      // entry was never stored, but the child was told it was. Surface the error.
      const serverMsg = err?.response?.data?.error?.message;
      setSaveError(
        serverMsg ||
        (t('childLogHome.text_8'))
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Manual save handler
  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setSubmitting(true);
    setSaveError('');

    const payload = {
      source,
      subjectId: subject,
      topicsText: topic,
      durationMin,
      confidence,
      date: new Date().toISOString().slice(0, 10),
    };

    try {
      const res = await api.post(`/children/${childId}/entries`, payload);
      setSavedEntry(res.data?.data || payload);
      setSuccess(true);
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error?.message;
      setSaveError(
        serverMsg ||
        (t('childLogHome.text_8'))
      );
    } finally {
      setSubmitting(false);
    }
  };

  const sampleVoicePrompts = isTasnim
    ? [
        {
          label: '🔢 গণিত লসাগু ও গসাগু',
          text: 'আজকে গণিত প্রাইভেটে অধ্যায় ৫ এর গুণনীয়ক ও লসাগু-গসাগুর কথার অঙ্ক সমাধান করেছি। হোমওয়ার্ক দিছে পৃষ্ঠা ৩৭ এর ৩ ও ৪ নম্বর।',
        },
        {
          label: '🔬 বিজ্ঞান পানি বিশুদ্ধকরণ',
          text: 'আজকে স্কুলে বিজ্ঞান ক্লাসে জীবনের জন্য পানি বিশুদ্ধকরণ ও নিরাপদ পানি পানের নিয়ম শিখেছি। ২০ মিনিট পানি ফোটানোর পদ্ধতি বুঝেছি।',
        },
        {
          label: '📖 ইংরেজি Food Pyramid',
          text: 'আজকে ইংরেজি টিউটর Unit 6 Eat Healthy এর Food Pyramid প্যাসেজ পড়িয়েছেন এবং ভেজিটেবলসের ভোকাবুলারি লিখেছি।',
        },
      ]
    : [
        {
          label: '⚛️ পদার্থবিজ্ঞান বল ও ত্বরণ',
          text: 'আজকে স্কুলে পদার্থবিজ্ঞানের ৩য় অধ্যায় বল ও ত্বরণ পড়িয়েছে, নিউটনের দ্বিতীয় সূত্র F=ma এবং ত্বরণের ৩টি অঙ্ক করিয়েছে। হোমওয়ার্ক অনুশীলনী ৩ এর ১ থেকে ৫।',
        },
        {
          label: '📐 গণিত বীজগাণিতিক সূত্রাবলী',
          text: 'আজকে গণিত প্রাইভেটে বীজগণিতীয় সূত্রাবলী ও বর্গের প্রয়োগ অনুশীলনী ৪.১ এর ১ থেকে ১২ নম্বর প্রশ্ন সমাধান করেছি। বুঝতে খুব ভালো লেগেছে।',
        },
        {
          label: '💻 আইসিটি স্প্রেডশিট ফর্মুলা',
          text: 'আজকে নিজে কম্পিউটার খুলে আইসিটির অধ্যায় ৩ এ এক্সেলে যোগ, গড় এবং শতকরা বের করার সেল ফর্মুলা তৈরি অনুশীলন করেছি।',
        },
      ];

  return (
    <KidShell>
      <div className="space-y-6 w-full page-fade">
        {/* Top Navigation & Streak Bar */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/child')}
            className="text-xs h-8 gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('childLogHome.text_9')}</span>
          </Button>

          <span className="text-xs font-bold text-amber-500 flex items-center gap-1 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            <Flame className="w-4 h-4 fill-amber-500" />
            <span>{t('childLogHome.text_10')}</span>
          </span>
        </div>

        {/* Celebration Screen after Student Approval */}
        {saveError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold">
            {saveError}
          </div>
        )}

        {success ? (
          <Card className="rounded-3xl border-2 border-emerald-500/30 bg-emerald-500/5 p-8 text-center space-y-5 animate-in zoom-in-95 shadow-lg">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-3xl shadow-md">
              🎉
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                {t('childLogHome.text_11')}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                {t('childLogHome.claude_ai')}
              </p>
            </div>

            {/* Log Summary Snapshot */}
            {savedEntry && (
              <div className="p-4 rounded-2xl bg-card border text-left text-xs space-y-2 max-w-md mx-auto shadow-xs">
                <div className="flex items-center justify-between">
                  <Badge className="bg-indigo-600 text-white font-bold text-[10px]">
                    {savedEntry.subjectId || 'Lesson'}
                  </Badge>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                    {savedEntry.source}
                  </span>
                </div>
                <p className="font-bold text-foreground text-sm">{savedEntry.topicsText}</p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1 border-t">
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <Clock className="w-3 h-3 text-indigo-500" />
                    {savedEntry.durationMin || 60} {t('childLogHome.text_12')}
                  </span>
                  <span>•</span>
                  <span>⭐ {savedEntry.confidence || 5}/5 {t('childLogHome.text_13')}</span>
                </div>
              </div>
            )}

            <div className="flex justify-center gap-3 pt-2 flex-wrap">
              <Button
                onClick={() => {
                  setSuccess(false);
                  setVoiceTranscript('');
                  setStructuredPreview(null);
                  setTopic('');
                }}
                variant="outline"
                className="rounded-xl text-xs h-10 px-4"
              >
                {t('childLogHome.text_14')}
              </Button>
              <Button
                onClick={() => router.push('/child')}
                className="rounded-xl text-xs h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20"
              >
                {t('childLogHome.text_15')}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-muted/60 border gap-1">
              <button
                type="button"
                onClick={() => setMode('voice')}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  mode === 'voice'
                    ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Mic className={`w-4 h-4 ${mode === 'voice' ? 'text-rose-500' : ''}`} />
                <span>{t('childLogHome.claude_ai_2')}</span>
                <span className="text-[9px] bg-rose-500 text-white font-black px-1.5 py-0.2 rounded-full">
                  NEW
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  mode === 'manual'
                    ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>{t('childLogHome.text_16')}</span>
              </button>
            </div>

            {/* ========================================================================= */}
            {/* 1. VOICE ENTRY MODE (Powered by Speech-to-Text & Claude AI Structuring)   */}
            {/* ========================================================================= */}
            {mode === 'voice' && (
              <div className="space-y-4">
                {/* Voice Input Recorder Card */}
                {!structuredPreview && (
                  <Card className="rounded-3xl border-2 border-indigo-500/20 shadow-md bg-card overflow-hidden">
                    <CardHeader className="pb-3 border-b bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                            <Mic className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base sm:text-lg font-black text-foreground">
                              {t('childLogHome.text_17')}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {t('childLogHome.claude_ai_3')}
                            </CardDescription>
                          </div>
                        </div>

                        {/* Language Selector Pill */}
                        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl text-[11px] font-semibold">
                          <button
                            type="button"
                            onClick={() => setSpeechLang('bn-BD')}
                            className={`px-2 py-1 rounded-lg transition-all ${
                              speechLang === 'bn-BD'
                                ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            🇧🇩 বাংলা
                          </button>
                          <button
                            type="button"
                            onClick={() => setSpeechLang('en-US')}
                            className={`px-2 py-1 rounded-lg transition-all ${
                              speechLang === 'en-US'
                                ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            🇬🇧 English
                          </button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6 space-y-6">
                      {/* Big Interactive Recording Orb */}
                      <div className="flex flex-col items-center justify-center text-center py-4 space-y-4">
                        <div className="relative">
                          {isListening && (
                            <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
                          )}
                          <button
                            type="button"
                            onClick={isListening ? stopVoiceRecording : startVoiceRecording}
                            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl relative z-10 ${
                              isListening
                                ? 'bg-rose-500 text-white ring-4 ring-rose-500/30 scale-105 animate-pulse'
                                : 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white hover:scale-105 active:scale-95 shadow-indigo-600/30'
                            }`}
                          >
                            {isListening ? (
                              <MicOff className="w-10 h-10 animate-bounce" />
                            ) : (
                              <Mic className="w-10 h-10" />
                            )}
                          </button>
                        </div>

                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {isListening
                              ? (t('childLogHome.text_18'))
                              : (t('childLogHome.text_19'))}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {isListening
                              ? (t('childLogHome.text_20'))
                              : (t('childLogHome.text_21'))}
                          </p>
                        </div>

                        {/* Error Alert if permission issue */}
                        {voiceError && (
                          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold max-w-md">
                            {voiceError}
                          </div>
                        )}
                      </div>

                      {/* Live Extracted Speech Transcript Box */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{t('childLogHome.live_speech_transcript')}</span>
                          </Label>
                          {voiceTranscript && (
                            <button
                              type="button"
                              onClick={() => setVoiceTranscript('')}
                              className="text-[11px] text-muted-foreground hover:text-foreground underline"
                            >
                              {t('childLogHome.text_22')}
                            </button>
                          )}
                        </div>

                        <textarea
                          value={voiceTranscript}
                          onChange={(e) => setVoiceTranscript(e.target.value)}
                          placeholder={
                            t('childLogHome.text_23')
                          }
                          rows={3}
                          className="w-full p-3.5 rounded-2xl border bg-muted/20 text-xs sm:text-sm font-medium leading-relaxed resize-none focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Quick Sample Voice Prompts (1-Click Test Chips) */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground block">
                          {t('childLogHome.text_24')}
                        </Label>
                        <div className="grid sm:grid-cols-3 gap-2">
                          {sampleVoicePrompts.map((sp, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setVoiceTranscript(sp.text);
                                handleAnalyzeWithClaude(sp.text);
                              }}
                              className="p-2.5 rounded-xl border bg-muted/20 hover:bg-indigo-500/10 hover:border-indigo-500/40 text-left text-xs font-medium transition-all group"
                            >
                              <span className="font-bold text-foreground block group-hover:text-indigo-600 transition-colors">
                                {sp.label}
                              </span>
                              <span className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                                {sp.text}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Action Button: Send to Claude AI */}
                      <Button
                        type="button"
                        onClick={() => handleAnalyzeWithClaude()}
                        disabled={isAnalyzingAI || !voiceTranscript.trim()}
                        className="w-full h-11 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-600/20 gap-2"
                      >
                        <Sparkles className="w-4 h-4 fill-amber-300 text-amber-300" />
                        <span>
                          {isAnalyzingAI
                            ? (t('childLogHome.claude_ai_4'))
                            : (t('childLogHome.claude_ai_5'))}
                        </span>
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* ========================================================================= */}
                {/* 2. CLAUDE AI STRUCTURED RESPONSE PREVIEW & STUDENT APPROVAL                */}
                {/* ========================================================================= */}
                {structuredPreview && (
                  <Card className="rounded-3xl border-2 border-indigo-500/40 shadow-xl bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
                    <CardHeader className="p-5 sm:p-6 pb-4 border-b bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-card">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
                            <Sparkles className="w-4 h-4 fill-amber-300 text-amber-300" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-base sm:text-lg font-black text-foreground">
                                {t('childLogHome.text_25')}
                              </CardTitle>
                              <Badge className="bg-purple-600 text-white text-[10px] font-bold">
                                {structuredPreview.aiModelUsed || 'Claude 3.5 Haiku'}
                              </Badge>
                            </div>
                            <CardDescription className="text-xs">
                              {t('childLogHome.claude_ai_6')}
                            </CardDescription>
                          </div>
                        </div>

                        {/* Edit Mode Toggle */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditingPreview(!isEditingPreview)}
                          className="h-8 text-xs font-semibold rounded-xl gap-1.5 self-start sm:self-auto"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-primary" />
                          <span>{isEditingPreview ? (t('childLogHome.text_26')) : (t('childLogHome.text_27'))}</span>
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 sm:p-6 space-y-5">
                      {/* Subject, Source & Duration Pills */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1 rounded-xl">
                          {structuredPreview.subjectBn || structuredPreview.subject}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-xl">
                          {structuredPreview.source === 'school'
                            ? (t('childLogHome.text_28'))
                            : structuredPreview.source === 'tuition'
                            ? (t('childLogHome.text_29'))
                            : structuredPreview.source === 'college'
                            ? (t('childLogHome.text_30'))
                            : (t('childLogHome.text_31'))}
                        </Badge>
                        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 bg-muted px-2.5 py-1 rounded-xl">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          {structuredPreview.durationMin} {t('childLogHome.text_12')}
                        </span>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                          ⭐ {structuredPreview.confidence}/5 {t('childLogHome.text_13')}
                        </span>
                      </div>

                      {/* Editable Form in Preview if student wants to adjust */}
                      {isEditingPreview ? (
                        <div className="p-4 rounded-2xl border bg-muted/20 space-y-3 text-xs">
                          <div>
                            <Label className="text-xs font-semibold block mb-1">
                              {t('childLogHome.text_32')}
                            </Label>
                            <Input
                              value={structuredPreview.topicsText}
                              onChange={(e) =>
                                setStructuredPreview({ ...structuredPreview, topicsText: e.target.value })
                              }
                              className="h-10 text-xs rounded-xl"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs font-semibold block mb-1">Source</Label>
                              <select
                                value={structuredPreview.source}
                                onChange={(e) =>
                                  setStructuredPreview({ ...structuredPreview, source: e.target.value as any })
                                }
                                className="w-full h-9 border rounded-xl px-2.5 bg-background text-xs"
                              >
                                {institutionType === 'school' && (
                                  <option value="school">{t('childLogHome.text_33')}</option>
                                )}
                                {institutionType === 'college' && (
                                  <option value="college">{t('childLogHome.text_34')}</option>
                                )}
                                <option value="tuition">{institutionType === 'admission' ? (t('childLogHome.text_35')) : 'Private Tuition'}</option>
                                <option value="self_study">Self-Study</option>
                              </select>
                            </div>
                            <div>
                              <Label className="text-xs font-semibold block mb-1">
                                {t('childLogHome.text_36')}
                              </Label>
                              <Input
                                type="number"
                                value={structuredPreview.durationMin}
                                onChange={(e) =>
                                  setStructuredPreview({
                                    ...structuredPreview,
                                    durationMin: parseInt(e.target.value) || 60,
                                  })
                                }
                                className="h-9 text-xs rounded-xl"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Readonly Structured Card */
                        <div className="space-y-4">
                          {/* Topic Headline */}
                          <div className="p-4 rounded-2xl bg-muted/30 border space-y-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                              {t('childLogHome.lesson_topic')}
                            </span>
                            <h3 className="text-base sm:text-lg font-black text-foreground">
                              {structuredPreview.topicsText}
                            </h3>
                          </div>

                          {/* Key Concepts Learned */}
                          {structuredPreview.keyConcepts && structuredPreview.keyConcepts.length > 0 && (
                            <div className="p-4 rounded-2xl border bg-card space-y-2">
                              <span className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                                <ListChecks className="w-4 h-4 text-emerald-500" />
                                <span>{t('childLogHome.key_concepts_learned')}</span>
                              </span>
                              <ul className="space-y-1.5 pt-1">
                                {structuredPreview.keyConcepts.map((kc, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-xs text-foreground">
                                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>{kc}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Homework if detected */}
                          {structuredPreview.homeworkAssigned && (
                            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                              <span className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                                📋 {t('childLogHome.text_37')}
                              </span>
                              <p className="text-foreground font-medium pl-4">
                                {structuredPreview.homeworkAssigned}
                              </p>
                            </div>
                          )}

                          {/* Original Voice Transcript Quote */}
                          <div className="p-3.5 rounded-2xl bg-muted/20 border text-xs space-y-1">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                              <Mic className="w-3 h-3 text-indigo-500" />
                              <span>{t('childLogHome.text_38')}</span>
                            </span>
                            <p className="text-muted-foreground italic text-xs">
                              &ldquo;{structuredPreview.rawTranscript}&rdquo;
                            </p>
                          </div>

                          {/* Claude AI Warm Summary Note */}
                          {structuredPreview.summaryMessage && (
                            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                              <span className="text-purple-700 dark:text-purple-300 font-semibold">
                                {structuredPreview.summaryMessage}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Approval Actions: Student Approves to Complete Logging */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStructuredPreview(null)}
                          className="w-full sm:w-auto h-10 text-xs rounded-xl gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{t('childLogHome.text_39')}</span>
                        </Button>

                        <Button
                          type="button"
                          onClick={handleApproveAndComplete}
                          disabled={submitting}
                          className="w-full sm:w-auto h-11 text-xs sm:text-sm font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 gap-2 px-6"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {submitting
                              ? (t('childLogHome.text_40'))
                              : (t('childLogHome.text_41'))}
                          </span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* 2. MANUAL KEYBOARD TYPING MODE                                           */}
            {/* ========================================================================= */}
            {mode === 'manual' && (
              <Card className="rounded-3xl border shadow-md bg-card">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <span>{t('childLogHome.text_42')}</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t('childLogHome.text_43')}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-5">
                  <form onSubmit={handleManualSave} className="space-y-4">
                    <div>
                      <Label className="text-xs font-semibold">
                        {t('childLogHome.text_44')}
                      </Label>
                      <Input
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder={
                          t('childLogHome.text_45')
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
                          {institutionType === 'school' && (
                            <option value="school">{t('childLogHome.text_33')}</option>
                          )}
                          {institutionType === 'college' && (
                            <option value="college">{t('childLogHome.text_34')}</option>
                          )}
                          <option value="tuition">{institutionType === 'admission' ? (t('childLogHome.text_35')) : (t('childLogHome.text_46'))}</option>
                          <option value="self_study">{t('childLogHome.text_47')}</option>
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
                          <option value="General Science">General Science</option>
                          <option value="BGS">BGS</option>
                        </select>
                      </div>
                    </div>

                    {/* Confidence Rating */}
                    <div>
                      <Label className="text-xs font-semibold block mb-1">
                        {t('childLogHome.text_48')}
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
                      disabled={submitting || !topic.trim()}
                      className="w-full h-11 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
                    >
                      {submitting ? 'Saving...' : t('childLogHome.text_49')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </KidShell>
  );
}

export default function KidLogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background p-6 flex items-center justify-center text-sm text-muted-foreground">Loading...</div>}>
      <KidLogContent />
    </Suspense>
  );
}
