'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  BookOpen,
  FileText,
  Brain,
  CreditCard,
  Settings,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const pathname = usePathname();
  const { user, activeChild, childrenList, logout } = useAuth();
  const { t, isBn } = useI18n();

  // No hardcoded fallback id: with no child selected there is no learning-log
  // route to link to, so the item is hidden rather than pointing at a fake id.
  const activeChildId = activeChild?.id || childrenList[0]?.id || null;

  const navItems = [
    { href: '/dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { href: '/children', label: t('nav.children', 'Children'), icon: Users },
    { href: '/schedule', label: t('nav.schedule', 'Routine & Schedule'), icon: Calendar },
    ...(activeChildId
      ? [{ href: `/children/${activeChildId}/log`, label: t('nav.logs', 'Learning Logs'), icon: BookOpen }]
      : []),
    { href: '/notes', label: t('nav.notes', 'Student Notes'), icon: FileText },
    { href: '/quizzes', label: t('nav.quizzes', 'AI Quizzes'), icon: Brain },
    { href: '/billing', label: t('nav.billing', 'Billing & Plans'), icon: CreditCard },
    { href: '/settings', label: t('nav.settings', 'Settings'), icon: Settings },
    ...(user?.role === 'admin'
      ? [{ href: '/admin', label: t('nav.admin', 'Admin Portal'), icon: ShieldCheck }]
      : []),
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-card/60 backdrop-blur-md sticky top-0 h-screen select-none z-30">
      {/* Brand Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center group py-0.5">
          <Image
            src="/logo-light.png"
            alt="কি শিখলে?"
            width={240}
            height={103}
            priority
            className="h-12 md:h-13 w-auto object-contain dark:hidden group-hover:scale-105 transition-transform"
          />
          <Image
            src="/logo-dark.png"
            alt="কি শিখলে?"
            width={240}
            height={103}
            priority
            className="h-12 md:h-13 w-auto object-contain hidden dark:block group-hover:scale-105 transition-transform"
          />
        </Link>
      </div>

      {/* Navigation items */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const isLearningLog = pathname.includes('/log');
          const isQuizPath = pathname.includes('/quizzes') || pathname.includes('/quiz') || pathname.includes('/attempts');

          let isActive = false;
          if (isLearningLog) {
            isActive = item.href.includes('/log');
          } else if (isQuizPath) {
            isActive = item.href === '/quizzes';
          } else if (item.href === '/children') {
            // `usePathname()` never includes the query string, so the old
            // `startsWith('/children?')` never matched.
            isActive = pathname === '/children' || pathname.startsWith('/children/');
          } else if (item.href === '/dashboard') {
            isActive = pathname === '/dashboard';
          } else {
            isActive = pathname === item.href || pathname.startsWith(item.href);
          }



          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25 font-semibold'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Buildathon Sticker (No background link) */}
      <div className="px-3.5 py-2.5 border-t bg-muted/20">
        <Image
          src="/built-for-aignite.png"
          alt="Built For Ostad Presents YUNet AIgnite Buildathon 2026"
          width={240}
          height={85}
          className="w-full h-auto object-contain"
        />
      </div>

      {/* User profile & footer */}
      <div className="p-3 border-t bg-card/40">
        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg">
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate text-foreground">{user?.name || 'Parent Account'}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user?.email || 'parent@example.com'}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title={t('nav.logout', 'Logout')}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
