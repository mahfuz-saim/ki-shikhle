'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Badge } from '../ui/badge';

export function TrialBanner() {
  const [trial, setTrial] = useState<any>(null);
  useEffect(() => {
    api.get('/auth/me').then(r => {
      const ends = r.data.data?.trialEndsAt;
      if (ends) {
        const days = Math.ceil((new Date(ends).getTime() - Date.now())/86400000);
        setTrial({ days, ends });
      }
    }).catch(()=> setTrial({ days: 12, mock: true }));
  }, []);
  if (!trial) return null;
  const isUrgent = trial.days <= 3;
  return (
    <div className={`text-center text-sm py-2 px-4 ${isUrgent ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
      🎉 Trial: {trial.days} days left • Upgrade to keep AI quizzes & history • <a href="/pricing" className="underline font-bold">View Plans</a>
    </div>
  );
}
