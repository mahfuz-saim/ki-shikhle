'use client';

import React from 'react';
import Link from 'next/link';
import { useRouteGuard } from '@/components/auth/route-guard';
import { buttonVariants } from '@/components/ui/button';
import { ShieldX, Loader2 } from 'lucide-react';

/**
 * The admin console has its own shell.
 *
 * It used to reuse the parent `AppShell`, whose guard allowed `parent` and `admin`.
 * That meant a signed-in **parent** could open `/admin` and see the page chrome —
 * headings, the "Admin Only" badge and a table of the platform's metrics — before
 * the API answered `403`. The server is the real authority (the admin router is
 * `auth('admin')`), but the page should not pretend.
 *
 * This shell renders an explicit "not permitted" state instead of the console.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { allowed, resolving } = useRouteGuard({
    allow: ['admin'],
    redirectTo: '/dashboard',
  });

  if (resolving) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
            <ShieldX className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-foreground">Access denied</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The internal admin portal is restricted to platform administrators.
          </p>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: 'outline', className: 'rounded-xl' })}
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <main className="flex-1 pb-8 pt-6 px-4 sm:px-6 md:px-8 max-w-7xl w-full mx-auto page-fade">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminShell;
