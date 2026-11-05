'use client';

export const runtime = 'edge';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * `/children/<id>/notes` used to be a stub that redirected to `/notes` and
 * **threw the route segment away**, so the parent landed on whichever child
 * happened to be active instead of the one they clicked.
 *
 * The child id is now carried across in the query string, and the notes page
 * treats it as the source of truth.
 */
export default function NotesByChildRedirect() {
  const params = useParams();
  const router = useRouter();
  const childId = (params as any)?.id as string | undefined;

  useEffect(() => {
    router.replace(childId ? `/notes?child=${encodeURIComponent(childId)}` : '/notes');
  }, [router, childId]);

  return (
    <div className="p-8 text-center text-xs text-muted-foreground">
      Redirecting to Notes Library...
    </div>
  );
}
