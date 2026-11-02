'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Calendar, FileText, Brain } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const navItems = [
    { href: '/dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { href: '/children', label: t('nav.children', 'Children'), icon: Users },
    { href: '/schedule', label: t('nav.schedule', 'Schedule'), icon: Calendar },
    { href: '/notes', label: t('nav.notes', 'Notes'), icon: FileText },
    { href: '/quizzes', label: t('nav.quizzes', 'Quizzes'), icon: Brain },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-lg flex justify-around items-center py-2 px-2 shadow-lg">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              isActive
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-primary stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
