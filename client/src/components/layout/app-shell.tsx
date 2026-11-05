'use client';

import React from 'react';
import { Sidebar } from './sidebar';
import { Header, TrialBanner } from './header';
import { BottomNav } from './bottom-nav';
import { useRouteGuard } from '@/components/auth/route-guard';
import { PageShellSkeleton } from '@/components/ui/skeleton';

export function AppShell({ children }: { children: React.ReactNode }) {
  // The parent portal is for parents. A child who lands here is bounced to their own
  // dashboard; a signed-out visitor is bounced to the sign-in page.
  //
  // The previous check lived here and only handled `role === 'child'`, which left
  // `/admin` (which also uses this shell) open to any signed-in parent.
  const { allowed, resolving } = useRouteGuard({ allow: ['parent', 'admin'] });

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar - Persistent and stable */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <TrialBanner />
        <Header />
        <main className="flex-1 pb-20 md:pb-8 pt-4 px-4 sm:px-6 md:px-8 max-w-7xl w-full mx-auto page-fade">
          {resolving || !allowed ? <PageShellSkeleton /> : children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

export default AppShell;
