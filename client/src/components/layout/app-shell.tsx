'use client';
import { Sidebar } from './sidebar';
import { BottomNav } from './bottom-nav';
import { useTheme } from 'next-themes';
import { Button } from '../ui/button';
import { Moon, Sun, Globe } from 'lucide-react';
import { useState } from 'react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const [locale, setLocale] = useState('en');
  const toggleLang = () => {
    const next = locale === 'en' ? 'bn' : 'en';
    setLocale(next);
    if (typeof window !== 'undefined') localStorage.setItem('locale', next);
  };
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="md:hidden w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold">কি</div>
            <span className="font-bold hidden sm:inline">Ki Shikhle?</span>
            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">App Shell</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleLang} aria-label="Toggle language"><Globe className="w-4 h-4" /></Button>
            <span className="text-xs border px-2 py-1 rounded">{locale === 'en' ? 'EN' : 'বাংলা'}</span>
          </div>
        </header>
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
