'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/components/auth/auth-context';
import { useI18n } from '@/lib/i18n-context';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Brain,
  Calendar,
  LogOut,
  Flame,
  ArrowLeft,
  Bell,
  Sun,
  Moon,
  Globe,
  ChevronDown,
  CheckCheck,
  Play,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageShellSkeleton } from '@/components/ui/skeleton';

export function KidShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, loading, activeChild, setActiveChild, childrenList, logout } = useAuth();
  const { locale, toggleLocale, isBn } = useI18n();
  const { theme, setTheme } = useTheme();

  const [notifOpen, setNotifOpen] = useState(false);
  const [childDropdownOpen, setChildDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const childDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isParent = user?.role === 'parent';
  const childId = activeChild?.id || (user as any)?.childId || user?.id || 'demo-child-1';
  const isTasnim = childId === 'demo-child-2' || user?.email?.includes('tasnim') || activeChild?.name?.includes('Tasnim');

  const [notifications, setNotifications] = useState([
    {
      id: 'kn-1',
      type: 'new_quiz',
      title: isBn ? 'নতুন এআই কুইজ প্রস্তুত!' : 'New AI Quiz Assigned!',
      message: isBn
        ? (isTasnim ? 'অভিভাবক কর্তৃক নতুন কুইজ: "প্রাথমিক বিজ্ঞান: জীবনের জন্য পানি"' : 'অভিভাবক কর্তৃক নতুন কুইজ: "পদার্থবিজ্ঞান: গতির সমীকরণ ও ত্বরণ"')
        : (isTasnim ? 'Parent assigned a new quiz: "Primary Science: Safe Water"' : 'Parent assigned a new quiz: "Physics: Equations of Motion"'),
      link: isTasnim ? '/kid/quiz/q-t2' : '/kid/quiz/q-r2',
      actionText: isBn ? 'কুইজ দাও' : 'Take Quiz',
      icon: 'quiz',
      read: false,
      time: isBn ? '১০ মিনিট আগে' : '10m ago',
    },
    {
      id: 'kn-2',
      type: 'routine_log',
      title: isBn ? 'আজকের পড়ার লগ দিন' : 'Routine Study Log Reminder',
      message: isBn
        ? (isTasnim ? 'বিকাল ৪:০০ টায় প্রাথমিক গণিত প্রাইভেট শেষ হয়েছে। কী কী শিখেছ তা ১ মিনিটে লিখে ফেলো!' : 'বিকাল ৪:০০ টায় গণিত প্রাইভেট (রহিম স্যার) শেষ হয়েছে। পড়ার লগ দিয়ে স্ট্রিক রক্ষা করো!')
        : (isTasnim ? 'Elementary Math Tuition finished at 4:00 PM. Log your topics to keep your streak!' : 'Math Tuition finished at 4:00 PM. Add your study log to protect your streak!'),
      link: '/kid/log',
      actionText: isBn ? 'লগ লিখুন' : 'Log Now',
      icon: 'log',
      read: false,
      time: isBn ? '১ ঘণ্টা আগে' : '1h ago',
    },
    {
      id: 'kn-3',
      type: 'streak',
      title: isBn ? 'স্ট্রিক রেকর্ড!' : 'Streak Record!',
      message: isBn
        ? (isTasnim ? 'টানা ৬ দিন পড়ার লগ সম্পন্ন হয়েছে! দারুণ হচ্ছে!' : 'টানা ৫ দিন পড়ার লগ সম্পন্ন হয়েছে! চালিয়ে যাও!')
        : (isTasnim ? '6 days study streak achieved! Amazing dedication!' : '5 days study streak achieved! Keep going!'),
      link: '/kid',
      actionText: isBn ? 'দেখা হয়েছে' : 'Got it',
      icon: 'streak',
      read: true,
      time: isBn ? 'গতকাল' : 'Yesterday',
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markOneRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (childDropdownRef.current && !childDropdownRef.current.contains(event.target as Node)) {
        setChildDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Loading state rendered inline via PageShellSkeleton inside main, avoiding full-screen layout unmount

  const studentName = activeChild?.name || user?.name || (isBn ? 'শিক্ষার্থী' : 'Student');
  const gradeLabel = activeChild?.grade || (user as any)?.grade || (isTasnim ? 'Class 5' : 'Class 8');

  const kidNavItems = [
    { href: '/kid', label: isBn ? 'ড্যাশবোর্ড' : 'Dashboard', icon: LayoutDashboard },
    { href: '/kid/schedule', label: isBn ? 'ক্লাস রুটিন' : 'Class Routines', icon: Calendar },
    { href: '/kid/log', label: isBn ? 'পড়ার বিবরণ দিন' : 'Quick Study Log', icon: BookOpen },
    { href: '/kid/notes', label: isBn ? 'ক্লাস নোটসমূহ' : 'Class Notes', icon: FileText },
    { href: '/kid#quizzes', label: isBn ? 'কুইজ দিন' : 'Take Quizzes', icon: Brain },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-indigo-500 selection:text-white">
      {/* ======================================================== */}
      {/* 1. Desktop Left Sidebar (Matching Parent Portal Sidebar) */}
      {/* ======================================================== */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card/60 backdrop-blur-md sticky top-0 h-screen select-none z-30">
        {/* Brand Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <Link href="/kid" className="flex items-center group py-0.5">
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

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {kidNavItems.map((item) => {
            const isExact = pathname === item.href;
            const isSubPath = item.href !== '/kid' && !item.href.includes('#') && pathname.startsWith(item.href);
            const isActive = isExact || isSubPath;
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
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          {/* Quick link back to Parent Dashboard if previewing */}
          {isParent && (
            <div className="pt-2 border-t mt-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span className="truncate">{isBn ? 'অভিভাবক ড্যাশবোর্ড' : 'Parent Dashboard'}</span>
              </Link>
            </div>
          )}
        </div>

        {/* Buildathon Sticker (Matching Parent Sidebar) */}
        <div className="px-3.5 py-2.5 border-t bg-muted/20">
          <Image
            src="/built-for-aignite.png"
            alt="Built For Ostad Presents YUNet AIgnite Buildathon 2026"
            width={240}
            height={85}
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Student Profile Card & Exit / Logout in Sidebar Footer */}
        <div className="p-3 border-t bg-card/40">
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center text-white text-xs font-black shadow-xs shrink-0">
                {studentName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate text-foreground">{studentName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{gradeLabel}</p>
              </div>
            </div>

            {isParent ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogoutOrExit}
                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 shrink-0"
                title={isBn ? 'অভিভাবক ড্যাশবোর্ডে ফিরুন' : 'Return to Parent Dashboard'}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogoutOrExit}
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                title={isBn ? 'লগআউট' : 'Logout'}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. Main Area (Top Header Navbar + Page Content + Bottom Nav) */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Navbar (Matching Parent Portal Header) */}
        <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md px-4 md:px-6 py-2.5 flex items-center justify-between gap-3">
          {/* Left Section: Mobile Brand & Student Switcher / Badge */}
          <div className="flex items-center gap-3">
            {/* Mobile Brand Logo (hidden on desktop where left sidebar is shown) */}
            <Link href="/kid" className="md:hidden flex items-center">
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

            {/* Active Student Selector / Status Indicator */}
            {isParent && childrenList.length > 0 ? (
              <div className="relative" ref={childDropdownRef}>
                <button
                  type="button"
                  onClick={() => setChildDropdownOpen(!childDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-background/80 hover:bg-muted text-xs font-semibold transition-all shadow-xs"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {studentName.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate text-foreground font-bold">
                    {studentName}
                  </span>
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">
                    ({gradeLabel})
                  </span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5" />
                </button>

                {childDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-56 rounded-xl border bg-card p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95">
                    <p className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {isBn ? 'শিক্ষার্থী পরিবর্তন করুন' : 'Switch Student'}
                    </p>
                    <div className="space-y-0.5">
                      {childrenList.map((c) => (
                        <button
                          type="button"
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
                        href="/dashboard"
                        onClick={() => setChildDropdownOpen(false)}
                        className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-primary hover:bg-primary/10 transition-colors font-medium"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>{isBn ? 'অভিভাবক ড্যাশবোর্ড' : 'Parent Dashboard'}</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-background/80 text-xs font-semibold shadow-xs">
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {studentName.charAt(0).toUpperCase()}
                </div>
                <span className="font-bold text-foreground">{studentName}</span>
                <span className="text-[10px] text-muted-foreground hidden sm:inline">({gradeLabel})</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
              </div>
            )}

            {/* Student Streak Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>
                {isBn
                  ? (isTasnim ? '৬ দিনের স্ট্রিক!' : '৫ দিনের স্ট্রিক!')
                  : (isTasnim ? '6-Day Streak!' : '5-Day Streak!')}
              </span>
            </div>
          </div>

          {/* Right Section: Actions & Controls */}
          <div className="flex items-center gap-2">
            {/* Parent return badge (if parent previewing) */}
            {isParent && (
              <Link href="/dashboard" className="hidden lg:flex items-center">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
                  <ArrowLeft className="w-3 h-3" />
                  <span>{isBn ? 'অভিভাবক ড্যাশবোর্ড' : 'Parent Dashboard'}</span>
                </div>
              </Link>
            )}

            {/* Kid Notifications Bell with Dropdown Popover */}
            <div className="relative" ref={notifRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setNotifOpen((prev) => !prev)}
                className="h-8 w-8 rounded-lg relative text-muted-foreground hover:text-foreground"
                aria-label="Student Notifications"
                title={isBn ? 'বিজ্ঞপ্তি' : 'Notifications'}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-background animate-pulse" />
                )}
              </Button>

              {/* Notification Popover Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-11 w-80 sm:w-96 rounded-2xl border bg-card/95 backdrop-blur-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-foreground">
                        {isBn ? 'বিজ্ঞপ্তি ও কাজের তাগিদ' : 'Notifications & Tasks'}
                      </span>
                      {unreadCount > 0 && (
                        <Badge className="text-[10px] bg-primary text-primary-foreground font-bold px-1.5 py-0">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-[11px] text-primary hover:underline font-medium flex items-center gap-1"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>{isBn ? 'সব পঠিত' : 'Mark all read'}</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-0.5">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-xl border text-xs transition-all ${
                          !n.read
                            ? 'border-primary/40 bg-primary/5 shadow-xs'
                            : 'border-border/60 bg-muted/20 opacity-80'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-background border">
                            {n.icon === 'quiz' ? (
                              <Brain className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            ) : n.icon === 'log' ? (
                              <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1 leading-none">
                              <span className="font-bold text-foreground text-xs">{n.title}</span>
                              <span className="text-[10px] text-muted-foreground">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                              {n.message}
                            </p>

                            <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-border/40">
                              {n.link && (
                                <Link
                                  href={n.link}
                                  onClick={() => {
                                    markOneRead(n.id);
                                    setNotifOpen(false);
                                  }}
                                >
                                  <Button
                                    size="sm"
                                    className="h-6 px-2.5 text-[10px] font-bold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground gap-1"
                                  >
                                    {n.icon === 'quiz' ? <Play className="w-2.5 h-2.5" /> : null}
                                    <span>{n.actionText}</span>
                                  </Button>
                                </Link>
                              )}

                              {!n.read && (
                                <button
                                  type="button"
                                  onClick={() => markOneRead(n.id)}
                                  className="text-[10px] text-muted-foreground hover:text-foreground"
                                >
                                  {isBn ? 'পঠিত' : 'Dismiss'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* Student User Profile Avatar Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs hover:ring-2 hover:ring-primary/20 transition-all"
                aria-label="Student Account Menu"
              >
                {studentName.charAt(0).toUpperCase()}
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-1.5 w-48 rounded-xl border bg-card p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95"
                >
                  <div className="px-3 py-2 border-b mb-1">
                    <p className="text-xs font-semibold truncate text-foreground">{studentName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{gradeLabel}</p>
                  </div>

                  <Link
                    href="/kid"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted text-foreground transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{isBn ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
                  </Link>

                  <Link
                    href="/kid/schedule"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted text-foreground transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{isBn ? 'ক্লাস রুটিন' : 'Class Routines'}</span>
                  </Link>

                  <Link
                    href="/kid/log"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted text-foreground transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{isBn ? 'পড়ার বিবরণ দিন' : 'Quick Study Log'}</span>
                  </Link>

                  <Link
                    href="/kid/notes"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted text-foreground transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{isBn ? 'ক্লাস নোটসমূহ' : 'Class Notes'}</span>
                  </Link>

                  <Link
                    href="/kid#quizzes"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted text-foreground transition-colors"
                  >
                    <Brain className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{isBn ? 'কুইজ দিন' : 'Take Quizzes'}</span>
                  </Link>

                  {isParent ? (
                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-primary hover:bg-primary/10 transition-colors mt-1 border-t pt-1.5 font-medium"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{isBn ? 'অভিভাবক ড্যাশবোর্ড' : 'Parent Dashboard'}</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-colors mt-1 border-t pt-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{isBn ? 'লগআউট' : 'Logout'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Container (matching AppShell main container layout) */}
        <main className="flex-1 pb-20 md:pb-8 pt-4 px-4 sm:px-6 md:px-8 max-w-7xl w-full mx-auto page-fade">
          {loading ? <PageShellSkeleton /> : children}
        </main>

        {/* Mobile Bottom Navigation (Visible on mobile screens < md, matching parent bottom nav) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-lg flex justify-around items-center py-2 px-2 shadow-lg">
          {kidNavItems.map((item) => {
            const isExact = pathname === item.href;
            const isSubPath = item.href !== '/kid' && !item.href.includes('#') && pathname.startsWith(item.href);
            const isActive = isExact || isSubPath;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                  isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary stroke-[2.5]' : 'stroke-[1.8]'}`} />
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default KidShell;
