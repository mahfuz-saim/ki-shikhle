'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header, TrialBanner } from './header';
import { BottomNav } from './bottom-nav';
import { useAuth } from '@/components/auth/auth-context';

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-black text-xl animate-pulse shadow-md">
            কি
          </div>
          <p className="text-xs text-muted-foreground font-medium animate-pulse">Loading portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TrialBanner />
        <Header />
        <main className="flex-1 pb-20 md:pb-8 pt-4 px-4 sm:px-6 md:px-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

export default AppShell;
