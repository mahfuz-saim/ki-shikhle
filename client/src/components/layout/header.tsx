'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import {
  Bell,
  Sun,
  Moon,
  Globe,
  Sparkles,
  ChevronDown,
  User as UserIcon,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { Button } from '@/components/ui/button';

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user, activeChild, setActiveChild, childrenList, logout } = useAuth();
  const { locale, toggleLocale, t, isBn } = useI18n();

  const [childDropdownOpen, setChildDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Calculate trial days
  const trialEnds = user?.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const trialDaysLeft = trialEnds
    ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 12;

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md px-4 md:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Mobile brand & Left section */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="md:hidden flex items-center">
            <Image
              src="/logo-light.png"
              alt="কি শিখলে?"
              width={180}
              height={77}
              className="h-9 w-auto object-contain dark:hidden"
            />
            <Image
              src="/logo-dark.png"
              alt="কি শিখলে?"
              width={180}
              height={77}
              className="h-9 w-auto object-contain hidden dark:block"
            />
          </Link>

          {/* Active Child Selector Dropdown */}
          {childrenList.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setChildDropdownOpen(!childDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-background/80 hover:bg-muted text-xs font-semibold transition-all shadow-xs"
              >
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                  {(activeChild?.name || childrenList[0]?.name || 'S').charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate text-foreground font-bold">
                  {activeChild?.name || childrenList[0]?.name}
                </span>
                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                  ({activeChild?.grade || childrenList[0]?.grade})
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5" />
              </button>

              {childDropdownOpen && (
                <div
                  className="absolute left-0 mt-1 w-56 rounded-xl border bg-card p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95"
                  onMouseLeave={() => setChildDropdownOpen(false)}
                >
                  <p className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('child.selectChild', 'Switch Student')}
                  </p>
                  <div className="space-y-0.5">
                    {childrenList.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActiveChild(c);
                          setChildDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                          activeChild?.id === c.id
                            ? 'bg-primary text-primary-foreground font-semibold'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <span className="truncate">{c.name}</span>
                        <span className="text-[10px] opacity-75 shrink-0 ml-1.5">{c.grade}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t my-1 pt-1">
                    <Link
                      href="/children"
                      onClick={() => setChildDropdownOpen(false)}
                      className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-primary hover:bg-primary/10 transition-colors font-medium"
                    >
                      + {t('child.add', 'Manage / Add Student')}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Trial countdown badge */}
          <Link href="/billing" className="hidden lg:flex items-center">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>
                {isBn ? 'ফ্রি প্ল্যান (২ AI কুইজ/মাস)' : 'Free Tier (2 Quizzes/mo)'}
              </span>
            </div>
          </Link>

          {/* Notifications */}
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg relative" aria-label="Notifications">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-background" />
            </Button>
          </Link>

          {/* Language Switcher */}
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

          {/* User profile avatar dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs hover:ring-2 hover:ring-primary/20 transition-all"
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
            </button>

            {userMenuOpen && (
              <div
                className="absolute right-0 mt-1.5 w-48 rounded-xl border bg-card p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95"
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b mb-1">
                  <p className="text-xs font-semibold truncate text-foreground">{user?.name || 'Parent Account'}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted text-foreground transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  {t('nav.settings', 'Settings')}
                </Link>
                <Link
                  href="/billing"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted text-foreground transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {t('nav.billing', 'Subscription & Billing')}
                </Link>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-colors mt-1 border-t pt-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {t('nav.logout', 'Logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

export function TrialBanner() {
  const { user } = useAuth();
  const trialEnds = user?.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const trialDays = trialEnds
    ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 12;

  return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs py-1.5 px-4 text-center font-medium shadow-sm flex items-center justify-center gap-2">
      <span>🎉 15-Day Free Trial: {trialDays} days remaining with full Standard AI features!</span>
      <Link href="/billing" className="underline font-bold hover:text-white/90">
        Upgrade now
      </Link>
    </div>
  );
}

export default Header;
