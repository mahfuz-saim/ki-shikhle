'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Calendar, FileText, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/children', label: 'Kids', icon: Users },
  { href: '/schedule', label: 'Routine', icon: Calendar },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/quizzes', label: 'Quiz', icon: Brain },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t flex justify-around py-2 md:hidden z-50">
      {nav.map(n => (
        <Link key={n.href} href={n.href} className={cn('flex flex-col items-center text-xs px-3 py-1 rounded', pathname===n.href ? 'text-primary bg-primary/10' : 'text-muted-foreground')}>
          <n.icon className="w-5 h-5" />{n.label}
        </Link>
      ))}
    </nav>
  );
}
