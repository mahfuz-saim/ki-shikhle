'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/components/auth/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Globe, LayoutDashboard } from 'lucide-react';

export function PublicNavbar({ hideBadge }: { hideBadge?: boolean } = {}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { token } = useAuth();
  const { locale, toggleLocale, isBn } = useI18n();

  const isHomePage = pathname === '/';
  const shouldHideBadge = hideBadge || isHomePage;

  const handleScrollTo = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = `/#${id}`;
      }
    }
  };

  return (
    <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      {/* Mobile Hackathon Sticker Strip (Hidden on Home Page) */}
      {!shouldHideBadge && (
        <div className="sm:hidden border-b bg-background/95 py-1.5 px-4 flex items-center justify-center">
          <Image
            src="/built-for-aignite.png"
            alt="Built For Ostad Presents YUNet AIgnite Buildathon 2026"
            width={180}
            height={64}
            priority
            className="h-6 w-auto object-contain"
          />
        </div>
      )}

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand & Hackathon Sticker */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group py-0.5">
            <Image
              src="/logo-light.png"
              alt="কি শিখলে?"
              width={260}
              height={112}
              priority
              className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105 dark:hidden"
            />
            <Image
              src="/logo-dark.png"
              alt="কি শিখলে?"
              width={260}
              height={112}
              priority
              className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105 hidden dark:block"
            />
          </Link>

          {/* Desktop/Tablet Hackathon Sticker (No link, hidden on home page) */}
          {!shouldHideBadge && (
            <div className="hidden sm:flex items-center pl-3 border-l border-border/60">
              <Image
                src="/built-for-aignite.png"
                alt="Built For Ostad Presents YUNet AIgnite Buildathon 2026"
                width={220}
                height={78}
                priority
                className="h-8 md:h-9 w-auto object-contain"
              />
            </div>
          )}
        </div>

        {/* Center links with smooth scrolling */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-muted-foreground">
          <a
            href="#features"
            onClick={(e) => handleScrollTo(e, 'features')}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            {isBn ? 'ফিচারসমূহ' : 'Features'}
          </a>
          <a
            href="#how-it-works"
            onClick={(e) => handleScrollTo(e, 'how-it-works')}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            {isBn ? 'কীভাবে কাজ করে' : 'How It Works'}
          </a>
          <a
            href="#pricing"
            onClick={(e) => handleScrollTo(e, 'pricing')}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            {isBn ? 'মূল্য ও প্ল্যান' : 'Pricing'}
          </a>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLocale}
            className="h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
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
            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
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
                  <span>{isBn ? 'ফ্রি শুরু করুন' : 'Get Started Free'}</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default PublicNavbar;
