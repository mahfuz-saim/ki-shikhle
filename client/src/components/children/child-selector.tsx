'use client';

/**
 * A selector for "which child is this page about?".
 *
 * Commit `04ee733` removed the selector UI and the only `history.replaceState` URL
 * sync, which broke two things:
 *
 *  - The `[id]` route segment became inert. `/children/<id>/quizzes/new` generated a
 *    quiz for `activeChild` instead of the child in the URL, because `activeChild` was
 *    checked first.
 *  - A parent with more than one child had no way to switch between them on the
 *    quizzes page at all.
 *
 * This component restores both: it sets the active child **and** keeps the URL in
 * sync, so the route segment and the selection never disagree.
 */

import { useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, type Child } from '@/components/auth/auth-context';
import { ChevronDown } from 'lucide-react';

export function ChildSelector({
  className = '',
  label,
}: {
  className?: string;
  label?: string;
}) {
  const { childrenList, activeChild, setActiveChild } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!childrenList || childrenList.length === 0) return null;

  const select = useCallback(
    (child: Child) => {
      setActiveChild(child);

      // Keep the route segment in sync with the selection. Without this, a page that
      // reads its child from the URL (`/children/[id]/…`) would keep pointing at the
      // previous child.
      const match = pathname.match(/^\/children\/([^/]+)/);
      if (match) {
        const next = pathname.replace(match[0], `/children/${child.id}`);
        window.history.replaceState(null, '', next);
      } else {
        router.refresh();
      }
    },
    [pathname, router, setActiveChild]
  );

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <span className="text-xs font-semibold text-muted-foreground">{label}</span>}
      <div className="relative">
        <select
          value={activeChild?.id || ''}
          onChange={(e) => {
            const child = childrenList.find((c) => c.id === e.target.value);
            if (child) select(child);
          }}
          aria-label="Select child"
          className="appearance-none h-9 pl-3 pr-8 rounded-xl border bg-card text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {childrenList.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.grade ? `(${c.grade})` : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
      </div>
    </div>
  );
}

export default ChildSelector;
