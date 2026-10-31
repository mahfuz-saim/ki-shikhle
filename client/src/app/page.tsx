'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, BarChart3, Brain, Calendar, Shield, Languages } from 'lucide-react';

export default function HomePage() {
  const [health, setHealth] = useState<any>(null);
  const [apiBase] = useState(() => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1');

  useEffect(() => {
    fetch(`${apiBase}/health`).then(r => r.json()).then(setHealth).catch(() => setHealth({ error: true }));
  }, [apiBase]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">কি</div>
            <span className="font-bold text-xl">Ki Shikhle?</span>
            <Badge variant="secondary" className="ml-2 hidden sm:inline">Beta</Badge>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/pricing"><Button variant="ghost">Pricing</Button></Link>
            <Link href="/login"><Button variant="ghost">Login</Button></Link>
            <Link href="/register"><Button>Start Free Trial</Button></Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-16 md:py-24 text-center">
          <Badge className="mb-4 bg-amber-500 hover:bg-amber-600">🇧🇩 Made for Bangladesh • NCTB Curriculum</Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Track what your <span className="text-primary">child actually learned</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            School, tuition, self-study — all in one place. Daily logs under 1 minute, AI quizzes from what was actually taught, and plain-language progress insights for parents.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register"><Button size="lg" className="text-base px-8">Start 15-Day Free Trial</Button></Link>
            <Link href="/pricing"><Button size="lg" variant="outline" className="text-base px-8">View Pricing — from ৳149/mo</Button></Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className={`w-2 h-2 rounded-full ${health?.data?.status === 'ok' ? 'bg-emerald-500' : health?.error ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`}></span>
            API: {health?.data?.status === 'ok' ? `online • v${health.data.version} • ${health.data.env}` : health?.error ? 'offline (dev mode)' : 'checking...'}
            <span className="opacity-50">•</span>
            <code className="text-xs bg-muted px-2 py-1 rounded">{apiBase}</code>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 grid md:grid-cols-3 gap-6">
          {[
            { icon: BookOpen, title: 'Daily Learning Log', desc: 'Child logs topic, subject & source in under 1 minute. Quick-add from today\'s schedule.' },
            { icon: Brain, title: 'AI Quizzes from Real Notes', desc: 'Parent picks subject & date range. AI generates MCQs, True/False & fill-in-the-blank from actual content.' },
            { icon: BarChart3, title: 'Clear Dashboards', desc: 'Study time, score trends, subject mastery radar, consistency heatmap — in 30 seconds.' },
          ].map(f => (
            <Card key={f.title}><CardHeader><f.icon className="w-8 h-8 text-primary mb-2" /><CardTitle>{f.title}</CardTitle><CardDescription>{f.desc}</CardDescription></CardHeader></Card>
          ))}
        </section>

        <section className="container mx-auto px-4 py-12 grid md:grid-cols-3 gap-6">
          {[
            { icon: Calendar, title: 'Smart Routine', desc: 'Weekday recurring tuition/school. Reschedule, cancel or add extra — occurrences computed on demand.' },
            { icon: Languages, title: 'Bangla + English', desc: 'Full i18n, Noto Sans Bengali, Tesseract OCR for Bangla & English notes, timezone Asia/Dhaka.' },
            { icon: Shield, title: 'Child-Safe by Design', desc: 'Parent-managed PIN, no email for kids, data scoped to parent, auto-lock child mode.' },
          ].map(f => (
            <Card key={f.title}><CardHeader><f.icon className="w-8 h-8 text-amber-500 mb-2" /><CardTitle>{f.title}</CardTitle><CardDescription>{f.desc}</CardDescription></CardHeader></Card>
          ))}
        </section>

        <section className="container mx-auto px-4 py-12">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Pricing that respects Bangladeshi families</h2>
              <p className="opacity-90 mb-6 max-w-2xl mx-auto">Trial free 15 days • Starter ৳149 • Standard ৳299 (recommended) • Premium ৳499 — per child/month. Sibling discounts. Annual: pay 10 get 12.</p>
              <Link href="/pricing"><Button variant="secondary" size="lg">See Plans & Demo Checkout</Button></Link>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          <p>Ki Shikhle? — Parent Learning Tracker • Indigo + Amber • Red only for errors • NCTB • Bangladesh-first, world-ready</p>
          <p className="mt-2"><Link href="/privacy" className="underline">Privacy</Link> • <Link href="/terms" className="underline">Terms</Link> • API via NEXT_PUBLIC_API_BASE_URL</p>
        </div>
      </footer>
    </div>
  );
}
