'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  BookOpen,
  Camera,
  Brain,
  CreditCard,
  Settings,
  Bell,
  Sparkles,
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

  const activeChildId = activeChild?.id || childrenList[0]?.id || 'demo-child';

  const navItems = [
    { href: '/dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { href: '/children', label: t('nav.children', 'Children'), icon: Users },
    { href: '/schedule', label: t('nav.schedule', 'Routine & Schedule'), icon: Calendar },
    { href: `/children/${activeChildId}/log`, label: t('nav.logs', 'Learning Logs'), icon: BookOpen },
    { href: '/notes', label: t('nav.notes', 'Notes & OCR'), icon: Camera },
    { href: '/quizzes', label: t('nav.quizzes', 'AI Quizzes'), icon: Brain },
    { href: '/billing', label: t('nav.billing', 'Billing & Plans'), icon: CreditCard },
    { href: '/notifications', label: t('nav.notifications', 'Notifications'), icon: Bell },
    { href: '/settings', label: t('nav.settings', 'Settings'), icon: Settings },
    ...(user?.role === 'admin'
      ? [{ href: '/admin', label: t('nav.admin', 'Admin Portal'), icon: ShieldCheck }]
      : []),
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-card/60 backdrop-blur-md sticky top-0 h-screen select-none z-30">
      {/* Brand Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-600/25">
            কি
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-foreground">
              কি শিখলে?
            </span>
            <span className="block text-[10px] font-semibold text-primary uppercase tracking-wider">
              {isBn ? 'অভিভাবক ড্যাশবোর্ড' : 'Parent Tracker'}
            </span>
          </div>
        </Link>
      </div>

      {/* Active Child Switcher Quick Card */}
      {activeChild && (
        <div className="p-3 mx-3 my-2.5 rounded-2xl bg-muted/40 border">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {t('child.selected', 'Active Student')}
              </p>
              <p className="font-bold text-xs truncate text-foreground">{activeChild.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {activeChild.grade} • {activeChild.curriculum}
              </p>
            </div>
            <Link
              href="/children"
              className="text-[11px] text-primary hover:underline font-semibold shrink-0 ml-2"
            >
              {t('common.switch', 'Manage')}
            </Link>
          </div>

          <Link
            href="/kid"
            className="w-full mt-2.5 h-8 text-xs font-semibold rounded-xl border border-primary/30 hover:border-primary text-primary hover:bg-primary/5 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{isBn ? 'শিক্ষার্থী পোর্টাল দেখুন' : 'Preview Student View'}</span>
          </Link>
        </div>
      )}

      {/* Navigation items */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
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
