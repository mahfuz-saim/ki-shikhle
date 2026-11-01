'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotesByChildRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/notes');
  }, [router]);
  return <div className="p-8 text-center text-xs text-muted-foreground">Redirecting to Notes Library...</div>;
}
