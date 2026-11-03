'use client';

import { PublicNavbar } from '@/components/layout/public-navbar';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavbar />
      <main className="flex-1 container max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div className="pb-2 border-b">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-black text-foreground">Terms of Service</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Last updated: November 2026 • Ki Shikhle? Terms of Service
          </p>
        </div>

        <Card className="rounded-2xl border p-6 space-y-6 text-sm text-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">1. Platform Purpose</h2>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Ki Shikhle? provides educational tracking, lesson routine management, note organization, and AI-assisted quiz generation for parents and students in Bangladesh and internationally.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">2. Freemium Model & Paid Subscriptions</h2>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Ki Shikhle operates on a transparent freemium model. New accounts automatically receive access to our Always Free plan (1 child, 2 AI quizzes per month) with no expiration. Parents can upgrade to Basic, Premium (including Automatic Quiz Setup System), or Pro Family anytime. Your data is never held hostage or deleted.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">3. User Responsibilities</h2>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Parents are responsible for keeping their account credentials confidential and for managing student account access for their children. Content uploaded must be educational notes and curriculum materials.
            </p>
          </section>
        </Card>
      </main>
    </div>
  );
}
