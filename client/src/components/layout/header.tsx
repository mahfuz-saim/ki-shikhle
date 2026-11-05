'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  KeyRound,
  LogIn,
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { Button } from '@/components/ui/button';

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user, activeChild, setActiveChild, childrenList, logout, subscription, enterChildMode, exitChildMode, isChildMode } = useAuth();
  const { locale, toggleLocale, t, isBn } = useI18n();

  const [childDropdownOpen, setChildDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  /**
   * Entering the child portal.
   *
   * `enterChildMode` calls the real `POST /children/:id/enter` and stores the
   * returned child-scoped token, which is what makes the child portal show the
   * child's own data rather than the parent's. The PIN prompt only appears for a
   * child that actually has a PIN set — otherwise the request would be rejected.
   */
  const [pinForChildId, setPinForChildId] = useState<string | null>(null);
  const [pinValue, setPinValue] = useState('');
  const [childModeError, setChildModeError] = useState('');
  const [childModeBusy, setChildModeBusy] = useState(false);

  const handleEnterChildMode = async (childId: string) => {
    setChildModeError('');
    setChildModeBusy(true);
    try {
      const res = await enterChildMode?.(childId, pinValue || undefined);
      if (res && !res.success) {
        setChildModeError(res.message || t('childMode.enter_failed', 'Could not enter child mode'));
        return;
      }
      setPinForChildId(null);
      setPinValue('');
      setChildDropdownOpen(false);
      window.location.href = '/child';
    } catch (e: any) {
      setChildModeError(e?.response?.data?.error?.message || t('childMode.enter_failed', 'Could not enter child mode'));
    } finally {
      setChildModeBusy(false);
    }
  };

  const childDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (childDropdownRef.current && !childDropdownRef.current.contains(target)) {
        setChildDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setChildDropdownOpen(false);
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Active plan resolution
  const activePlanCode =
    subscription?.plan?.code ||
    subscription?.planCode ||
    'free';

  // Calculate trial days if user has a trial expiration set
  const trialEnds = user?.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const trialDaysLeft = trialEnds
    ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md px-3 sm:px-4 md:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-3">
        {/* Mobile brand & Left section */}
        <div className="flex items-center gap-2 sm:gap-3">
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
            <div ref={childDropdownRef} className="relative">
              <button
                onClick={() => setChildDropdownOpen(!childDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-background/80 hover:bg-muted text-xs font-semibold transition-all shadow-xs"
              >
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                  {(activeChild?.name || childrenList[0]?.name || 'S').charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[75px] sm:max-w-[120px] truncate text-foreground font-bold">
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
                      <div key={c.id}>
                        <button
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

                        {/* Enter the child's own portal for this student. */}
                        <button
                          onClick={() => {
                            setPinForChildId(pinForChildId === c.id ? null : c.id);
                            setPinValue('');
                            setChildModeError('');
                          }}
                          className="w-full flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-primary hover:bg-primary/10 transition-colors font-medium"
                        >
                          <LogIn className="w-3 h-3 shrink-0" />
                          {t('childMode.enter', 'Open child portal')}
                        </button>

                        {pinForChildId === c.id && (
                          <div className="px-2.5 pb-2 pt-1 space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <KeyRound className="w-3 h-3 shrink-0 text-muted-foreground" />
                              <input
                                type="password"
                                inputMode="numeric"
                                value={pinValue}
                                onChange={(e) => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder={t('childMode.pin_placeholder', 'PIN (if set)')}
                                className="w-full h-8 border rounded-lg px-2 bg-background text-xs"
                              />
                            </div>
                            {childModeError && (
                              <p className="text-[11px] text-destructive font-medium">{childModeError}</p>
                            )}
                            <Button
                              onClick={() => handleEnterChildMode(c.id)}
                              disabled={childModeBusy}
                              size="sm"
                              className="w-full h-7 rounded-lg text-[11px] font-bold"
                            >
                              {childModeBusy
                                ? t('common.loading', 'Loading...')
                                : t('childMode.enter', 'Open child portal')}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="border-t my-1 pt-1">
                    <Link
                      href="/children"
                      onClick={() => setChildDropdownOpen(false)}
                      className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-primary hover:bg-primary/10 transition-colors font-medium"
                    >
                      + {t('child.manage_accounts', 'Manage / Add Student')}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Active Subscription Plan Badge */}
          <Link href="/billing" className="hidden lg:flex items-center">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${
                activePlanCode === 'pro'
                  ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
                  : activePlanCode === 'premium'
                  ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20'
                  : activePlanCode === 'basic'
                  ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30 hover:bg-sky-500/20'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  activePlanCode === 'pro'
                    ? 'bg-purple-500'
                    : activePlanCode === 'premium'
                    ? 'bg-indigo-500'
                    : activePlanCode === 'basic'
                    ? 'bg-sky-500'
                    : 'bg-emerald-500'
                }`}
              />
              <span>
                {activePlanCode === 'pro'
                  ? (t('header.ai'))
                  : activePlanCode === 'premium'
                  ? (t('header.ai_2'))
                  : activePlanCode === 'basic'
                  ? (t('header.ai_3'))
                  : (t('header.ai_4'))}
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

          {/* Language Switcher (Desktop) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLocale}
            className="hidden sm:flex h-8 px-2.5 rounded-lg text-xs font-semibold items-center gap-1 text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
            title="Toggle Language"
          >
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{locale === 'en' ? 'বাংলা' : 'EN'}</span>
          </Button>

          {/* Theme Toggle (Desktop) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hidden sm:flex h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* User profile avatar dropdown */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs hover:ring-2 hover:ring-primary/20 transition-all"
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
            </button>

            {userMenuOpen && (
              <div
                className="absolute right-0 mt-1.5 w-52 rounded-xl border bg-card p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95"
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
                  {t('nav.subscription_billing', 'Subscription & Billing')}
                </Link>
                {/* Leave the child portal without signing the parent out. */}
                {isChildMode && (
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      exitChildMode?.();
                      window.location.href = '/dashboard';
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-primary hover:bg-primary/10 transition-colors mt-1 border-t pt-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    {t('childMode.exit', 'Back to parent account')}
                  </button>
                )}
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

                {/* Last two options: Language and Theme */}
                <div className="border-t my-1 pt-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      toggleLocale();
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted text-foreground transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{t('header.language')}</span>
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      {locale === 'en' ? 'বাংলা' : 'EN'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTheme(theme === 'dark' ? 'light' : 'dark');
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted text-foreground transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {theme === 'dark' ? (
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <Moon className="w-3.5 h-3.5 text-indigo-500" />
                      )}
                      <span>{t('header.theme')}</span>
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">
                      {theme === 'dark' ? (t('header.text')) : (t('header.text_2'))}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

/**
 * A banner showing how many days of the free trial are left.
 *
 * This component computed `trialDays` and then returned `null` — it was dead
 * code that never rendered. It now actually renders, but only when the account
 * is genuinely on a trial (a `trialEndsAt` in the future). Accounts with an
 * active subscription, or no trial at all, see nothing.
 */
export function TrialBanner() {
  const { user, subscription } = useAuth();
  const { t, isBn } = useI18n();

  const trialEnds = user?.trialEndsAt ? new Date(user.trialEndsAt) : null;
  if (!trialEnds || Number.isNaN(trialEnds.getTime())) return null;

  const msRemaining = trialEnds.getTime() - Date.now();
  if (msRemaining <= 0) return null; // the trial is over

  // A paid subscription supersedes the trial banner.
  const subStatus = subscription?.status;
  if (subStatus && subStatus !== 'trialing' && subStatus !== 'trial') return null;

  const trialDays = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 pt-3">
      <div
        className={`rounded-2xl border px-4 py-2.5 text-xs font-semibold flex flex-wrap items-center justify-between gap-2 ${
          trialDays <= 3
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
        }`}
        role="status"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          {trialDays <= 3
            ? t('header.your_free_trial_ends_in_day', { p0: trialDays, p1: trialDays === 1 ? '' : 's' }, `Your free trial ends in ${trialDays} day${trialDays === 1 ? '' : 's'}!`)
            : t('header.days_left_in_your_free_trial', { p0: trialDays }, `${trialDays} days left in your free trial.`)}
        </span>
        <Link
          href="/billing"
          className="underline underline-offset-2 hover:no-underline font-bold shrink-0"
        >
          {t('header.text_3')}
        </Link>
      </div>
    </div>
  );
}

export default Header;
