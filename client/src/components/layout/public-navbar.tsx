'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useAuth } from '@/components/auth/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sun, Moon, Globe, ArrowRight, LayoutDashboard } from 'lucide-react';

export function PublicNavbar() {
  const { theme, setTheme } = useTheme();
  const { user, token } = useAuth();
  const { locale, toggleLocale, isBn } = useI18n();

  const isLoggedIn = !!token || (user && user.id !== 'parent-demo');

  return (
    <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            কি
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-foreground">
                {isBn ? 'কি শিখলে?' : 'Ki Shikhle?'}
              </span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                Beta
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium hidden sm:block">
              {isBn ? 'অভিভাবকদের লার্নিং ট্র্যাকার' : 'Parent Learning Tracker'}
            </p>
          </div>
        </Link>

        {/* Center links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-muted-foreground">
          <Link href="/pricing" className="hover:text-foreground transition-colors">
            {isBn ? 'মূল্য ও প্ল্যান' : 'Pricing & Plans'}
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            {isBn ? 'গোপনীয়তা' : 'Privacy'}
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            {isBn ? 'শর্তাবলী' : 'Terms'}
          </Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLocale}
            className="h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-muted"
            title="Toggle Language"
          >
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{locale === 'en' ? 'বাংলা' : 'EN'}</span>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-8 w-8 rounded-lg"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Auth links or Dashboard */}
          {token ? (
            <Link href="/dashboard">
              <Button size="sm" className="h-9 text-xs font-semibold rounded-xl gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{isBn ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="h-9 text-xs font-semibold rounded-xl">
                  {isBn ? 'লগইন' : 'Login'}
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="h-9 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20">
                  <span>{isBn ? '১৫ দিনের ফ্রি ট্রায়াল' : 'Start Free Trial'}</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
