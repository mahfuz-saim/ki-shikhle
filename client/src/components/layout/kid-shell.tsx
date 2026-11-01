'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { Home, BookOpen, Camera, LogOut, Flame, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function KidShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, loading, activeChild, logout } = useAuth();
  const { isBn } = useI18n();

  const isParent = user?.role === 'parent';

  useEffect(() => {
    if (!loading) {
      if (!token && !user) {
        router.replace('/login');
      }
    }
  }, [loading, token, user, router]);

  const handleLogoutOrExit = () => {
    if (isParent) {
      router.push('/dashboard');
    } else {
      logout();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-500 flex items-center justify-center text-white font-black text-xl animate-pulse shadow-md">
            কি
          </div>
          <p className="text-xs text-muted-foreground font-medium animate-pulse">Loading student portal...</p>
        </div>
      </div>
    );
  }

  const kidNav = [
    { href: '/kid', label: isBn ? 'আজকের কাজ' : 'Today', icon: Home },
    { href: '/kid/log', label: isBn ? 'পড়ার লগ' : 'Quick Log', icon: BookOpen },
    { href: '/kid/notes', label: isBn ? 'নোট স্ক্যান' : 'Notes & Scan', icon: Camera },
  ];

  const studentName = activeChild?.name || user?.name || (isBn ? 'শিক্ষার্থী' : 'Student');
  const studentEmail = activeChild?.email || user?.email;
  const gradeLabel = activeChild?.grade || (user as any)?.grade || 'Class 8';
  const curriculumLabel = activeChild?.curriculum || (user as any)?.curriculum || 'NCTB';

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-background to-amber-50/30 dark:from-background dark:to-background flex flex-col">
      {/* Friendly Kid Mode Header */}
      <header className="sticky top-0 z-40 border-b bg-card/85 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-500/20">
            কি
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-foreground">
                {studentName}
              </span>
              <span className="text-[11px] bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>4 Days 🔥</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <span>{gradeLabel} • {curriculumLabel}</span>
              {studentEmail && (
                <span className="hidden md:inline text-[11px] text-muted-foreground/80">
                  ({studentEmail})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Center / Navigation tabs */}
        <nav className="hidden sm:flex items-center gap-1 bg-muted/60 p-1 rounded-2xl border">
          {kidNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action Button: Back to Parent (if previewing) or Log Out (if student) */}
        <div className="flex items-center gap-2">
          {isParent ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleLogoutOrExit}
              className="text-xs h-8 rounded-xl border-primary/40 text-primary hover:bg-primary/10 flex items-center gap-1.5"
              title="Return to Parent Dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isBn ? 'অভিভাবক ড্যাশবোর্ড' : 'Parent Dashboard'}</span>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleLogoutOrExit}
              className="text-xs h-8 rounded-xl border-muted-foreground/30 hover:border-destructive hover:text-destructive flex items-center gap-1.5"
              title="Sign out of student account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isBn ? 'লগআউট' : 'Log Out'}</span>
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-20 sm:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation for Kid */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-lg flex justify-around items-center py-2 px-2 shadow-xl">
        {kidNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
                isActive ? 'text-primary font-bold' : 'text-muted-foreground'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[11px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default KidShell;
