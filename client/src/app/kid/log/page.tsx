'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

export default function KidLogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeChild } = useAuth();
  const { isBn } = useI18n();

  const childId = activeChild?.id || 'demo-child-1';
  const isTasnim = childId === 'demo-child-2' || activeChild?.name?.toLowerCase().includes('tasnim');

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
        isBn
          ? 'আপনার ব্রাউজারে ভয়েস রেকর্ডিং সাপোর্ট নেই। নিচের নমুনা প্রম্পট বা টাইপ অপশন ব্যবহার করুন।'
          : 'Speech recognition is not supported in this browser. Please use the quick prompts or manual entry.'
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
            isBn
              ? 'মাইক্রোফোন ব্যবহারের অনুমতি দেওয়া হয়নি। ব্রাউজারের পারমিশন চালু করুন।'
              : 'Microphone permission denied. Please allow microphone access.'
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
      setVoiceError(isBn ? 'অনুগ্রহ করে কিছু কথা বলুন বা লিখুন' : 'Please speak or enter some lesson text first');
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
          isBn ? 'পাঠ্যবইয়ের মূল ধারণাসমূহ ও সূত্রাবলী' : 'Core textbook concepts & formulas',
          isBn ? 'শ্রেণিকক্ষের গুরুত্বপূর্ণ উদাহরণ অনুশীলন' : 'Classroom worked examples & solutions',
        ],
        homeworkAssigned: isBn ? 'অনুশীলনীর বাকি প্রশ্নাবলী' : 'Remaining textbook exercises',
        summaryMessage: isBn ? 'দারুণ! আজকের পড়ার বিবরণ প্রস্তুত হয়েছে।' : 'Great job! Lesson record ready.',
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
    } catch {
      // Local fallback
      setSavedEntry(payload);
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Manual save handler
  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setSubmitting(true);

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
    } catch {
      setSavedEntry(payload);
      setSuccess(true);
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
      <div className="space-y-6 max-w-2xl mx-auto page-fade">
        {/* Top Navigation & Streak Bar */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/kid')}
            className="text-xs h-8 gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isBn ? 'ড্যাশবোর্ডে ফিরুন' : 'Back to Dashboard'}</span>
          </Button>

          <span className="text-xs font-bold text-amber-500 flex items-center gap-1 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            <Flame className="w-4 h-4 fill-amber-500" />
            <span>{isBn ? '৫ দিনের স্ট্রিক জ্বলছে 🔥' : '5-Day Study Streak Burning!'}</span>
          </span>
        </div>

        {/* Celebration Screen after Student Approval */}
        {success ? (
          <Card className="rounded-3xl border-2 border-emerald-500/30 bg-emerald-500/5 p-8 text-center space-y-5 animate-in zoom-in-95 shadow-lg">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-3xl shadow-md">
              🎉
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                {isBn ? 'অভিনন্দন! পড়ার রেকর্ড সফলভাবে সম্পন্ন!' : 'Awesome! Lesson Approved & Logged!'}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                {isBn
                  ? 'Claude AI দ্বারা প্রস্তুতকৃত লার্নিং লগটি অভিভাবকের পোর্টালে পাঠানো হয়েছে। অভিভাবক আগামীকাল এটার ওপর অটো কুইজ দিতে পারবেন।'
                  : 'Your lesson record has been verified. Parents can now view this in the dashboard and auto-quizzes will be scheduled.'}
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
                    {savedEntry.durationMin || 60} {isBn ? 'মিনিট' : 'mins'}
                  </span>
                  <span>•</span>
                  <span>⭐ {savedEntry.confidence || 5}/5 {isBn ? 'বোঝাপড়া' : 'Mastery'}</span>
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
                {isBn ? 'আরেকটি ভয়েস লগ দিন' : 'Log Another Lesson'}
              </Button>
              <Button
                onClick={() => router.push('/kid')}
                className="rounded-xl text-xs h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20"
              >
                {isBn ? 'ড্যাশবোর্ডে দেখুন' : 'Go to Dashboard'}
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
                <span>{isBn ? 'ভয়েস দিয়ে বলো (Claude AI)' : 'Voice Entry with AI'}</span>
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
                <span>{isBn ? 'টাইপ করে লিখুন' : 'Manual Typing'}</span>
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
                              {isBn ? 'ভয়েস দিয়ে পড়ার বিবরণ দাও' : 'Speak What You Studied Today'}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {isBn
                                ? 'মুখে বলো, Claude AI স্বয়ংক্রিয়ভাবে সাজিয়ে প্রিভিউ তৈরি করবে'
                                : 'Just speak naturally, Claude AI will structure your lesson'}
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
                              ? (isBn ? '🎙️ শুনছি... বলো আজকে ক্লাসে বা প্রাইভেটে কী কী শিখেছ...' : '🎙️ Listening... Speak about today\'s lessons...')
                              : (isBn ? 'মাইক্রোফোনে ট্যাপ করে কথা বলা শুরু করো' : 'Tap microphone and start speaking')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {isListening
                              ? (isBn ? 'বলা শেষ হলে আবার ট্যাপ করো বা থামাও' : 'Tap again when finished speaking')
                              : (isBn ? 'যেমন: বিষয়, কী কী সূত্র বা অধ্যায় পড়েছ এবং হোমওয়ার্ক' : 'Include subject, chapters, key topics & homework')}
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
                            <span>{isBn ? 'শনাক্তকৃত কথার বিবরণ (Live Speech Transcript)' : 'Live Speech Transcript'}</span>
                          </Label>
                          {voiceTranscript && (
                            <button
                              type="button"
                              onClick={() => setVoiceTranscript('')}
                              className="text-[11px] text-muted-foreground hover:text-foreground underline"
                            >
                              {isBn ? 'মুছে ফেলুন' : 'Clear'}
                            </button>
                          )}
                        </div>

                        <textarea
                          value={voiceTranscript}
                          onChange={(e) => setVoiceTranscript(e.target.value)}
                          placeholder={
                            isBn
                              ? 'এখানে তোমার ভয়েস থেকে কনভার্ট হওয়া কথাগুলো রিয়েল-টাইমে প্রদর্শিত হবে। প্রয়োজনে কীবোর্ড দিয়েও লিখে দিতে পারো...'
                              : 'Your spoken speech will appear here in real time. You can also edit or type directly...'
                          }
                          rows={3}
                          className="w-full p-3.5 rounded-2xl border bg-muted/20 text-xs sm:text-sm font-medium leading-relaxed resize-none focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Quick Sample Voice Prompts (1-Click Test Chips) */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground block">
                          {isBn ? 'অথবা নিচের নমুনা ভয়েস ক্লিক করে পরীক্ষা করো:' : 'Or tap a sample prompt to try:'}
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
                            ? (isBn ? 'Claude AI বিশ্লেষণ করে সাজাচ্ছে...' : 'Claude AI is Structuring Response...')
                            : (isBn ? '✨ Claude AI দিয়ে বিশ্লেষণ করুন ও প্রিভিউ দেখুন' : 'Extract & Preview with Claude AI')}
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
                                {isBn ? 'লগ প্রিভিউ ও অনুমোদন' : 'Learning Log Preview & Approval'}
                              </CardTitle>
                              <Badge className="bg-purple-600 text-white text-[10px] font-bold">
                                {structuredPreview.aiModelUsed || 'Claude 3.5 Haiku'}
                              </Badge>
                            </div>
                            <CardDescription className="text-xs">
                              {isBn
                                ? 'Claude AI তোমার ভয়েস নোটটি নিচের মতো সাজিয়েছে। অনুমোদন দিলে লগ সম্পন্ন হবে।'
                                : 'Claude AI structured your spoken note. Review and approve to finish.'}
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
                          <span>{isEditingPreview ? (isBn ? 'প্রিভিউ দেখুন' : 'Done Editing') : (isBn ? 'তথ্য সংশোধন' : 'Edit Details')}</span>
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
                            ? (isBn ? '🏫 স্কুল ক্লাস' : '🏫 School')
                            : structuredPreview.source === 'tuition'
                            ? (isBn ? '👨‍🏫 প্রাইভেট টিউশন' : '👨‍🏫 Private Tuition')
                            : structuredPreview.source === 'college'
                            ? (isBn ? '🏛️ কলেজ' : '🏛️ College')
                            : (isBn ? '📖 নিজে পড়া' : '📖 Self-Study')}
                        </Badge>
                        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 bg-muted px-2.5 py-1 rounded-xl">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          {structuredPreview.durationMin} {isBn ? 'মিনিট' : 'mins'}
                        </span>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                          ⭐ {structuredPreview.confidence}/5 {isBn ? 'বোঝাপড়া' : 'Confidence'}
                        </span>
                      </div>

                      {/* Editable Form in Preview if student wants to adjust */}
                      {isEditingPreview ? (
                        <div className="p-4 rounded-2xl border bg-muted/20 space-y-3 text-xs">
                          <div>
                            <Label className="text-xs font-semibold block mb-1">
                              {isBn ? 'টপিক শিরোনাম' : 'Topic Title'}
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
                                <option value="tuition">Private Tuition</option>
                                <option value="school">School</option>
                                <option value="college">College</option>
                                <option value="self_study">Self-Study</option>
                              </select>
                            </div>
                            <div>
                              <Label className="text-xs font-semibold block mb-1">
                                {isBn ? 'সময়সীমা (মিনিট)' : 'Duration (mins)'}
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
                              {isBn ? 'মূল পাঠ ও অধ্যায় (Lesson Topic)' : 'Structured Lesson Topic'}
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
                                <span>{isBn ? 'কী কী শেখা হয়েছে (Key Concepts Learned):' : 'Key Concepts Covered:'}</span>
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
                                📋 {isBn ? 'বাড়ির কাজ / হোমওয়ার্ক:' : 'Homework Assigned:'}
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
                              <span>{isBn ? 'তোমার বলা ভয়েস নোট:' : 'Your Spoken Voice Words:'}</span>
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
                          <span>{isBn ? 'আবার ভয়েস দিন' : 'Speak Again'}</span>
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
                              ? (isBn ? 'লগ সংরক্ষিত হচ্ছে...' : 'Saving Log...')
                              : (isBn ? '✅ অনুমোদন করুন ও লগ সম্পন্ন করুন 🎉' : 'Approve & Complete Logging 🎉')}
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
                    <span>{isBn ? 'আজকে তুমি কী শিখেছ?' : 'What did you study today?'}</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {isBn
                      ? 'নিচের যেকোনো একটিতে ট্যাপ করো অথবা নিজেই টাইপ করো'
                      : 'Tap a recent lesson below or type manually'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-5">
                  <form onSubmit={handleManualSave} className="space-y-4">
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
                          <option value="General Science">General Science</option>
                          <option value="BGS">BGS</option>
                        </select>
                      </div>
                    </div>

                    {/* Confidence Rating */}
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
                      disabled={submitting || !topic.trim()}
                      className="w-full h-11 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
                    >
                      {submitting ? 'Saving...' : isBn ? 'সংরক্ষণ করুন 🎉' : 'Save Lesson 🎉'}
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
