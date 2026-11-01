'use client';

import { PublicNavbar } from '@/components/layout/public-navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavbar />
      <main className="flex-1 container max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div className="pb-2 border-b">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-black text-foreground">Privacy Policy</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Last updated: November 2026 • Ki Shikhle? Child Safety & Data Protection
          </p>
        </div>

        <Card className="rounded-2xl border p-6 space-y-6 text-sm text-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">1. Child Safety & Isolated Portals</h2>
            <p className="text-muted-foreground text-xs leading-relaxed">
              We take the privacy of children with utmost seriousness. Child accounts are created and supervised directly by their parent. Student portal access is strictly scoped to lessons, notes, and quizzes, with zero access to billing or parent account settings.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">2. Data Storage & Ownership</h2>
            <p className="text-muted-foreground text-xs leading-relaxed">
              All learning entries, uploaded class notes, OCR extractions, and quiz answers belong completely to the parent. Parents have the continuous right to export all their data in JSON format at any time from the Settings dashboard.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">3. Account Deletion & 7-Day Grace Window</h2>
            <p className="text-muted-foreground text-xs leading-relaxed">
              When an account deletion is initiated, data is placed into a soft-deletion grace window for 7 days. If not restored by the owner within this period, all personal data, child profiles, and uploaded images/PDFs are permanently purged from all servers and storage disks.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">4. AI Data Processing</h2>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Uploaded notes and learning topics are digested into anonymized topic summaries to build AI quizzes. Personal identifiable information (such as child last name or contact info) is never transmitted to LLM API endpoints.
            </p>
          </section>
        </Card>
      </main>
    </div>
  );
}
