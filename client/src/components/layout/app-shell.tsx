'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header, TrialBanner } from './header';
import { BottomNav } from './bottom-nav';
import { useAuth } from '@/components/auth/auth-context';
import { PageShellSkeleton } from '@/components/ui/skeleton';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!token && !user) {
        router.replace('/login');
      } else if (user?.role === 'child') {
        router.replace('/kid');
      }
    }
  }, [loading, token, user, router]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar - Persistent and stable */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TrialBanner />
        <Header />
        <main className="flex-1 pb-20 md:pb-8 pt-4 px-4 sm:px-6 md:px-8 max-w-7xl w-full mx-auto page-fade">
          {loading ? <PageShellSkeleton /> : children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

export default AppShell;
