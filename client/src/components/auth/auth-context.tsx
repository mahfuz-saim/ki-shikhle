'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type User = { id: string; name: string; email: string; role: string; trialEndsAt?: string };

const Ctx = createContext<{ user: User | null; token: string | null; login: (t: string, u: User) => void; logout: () => void; loading: boolean }>({
  user: null, token: null, login: () => {}, logout: () => {}, loading: true
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (t) {
      setToken(t);
      api.get('/auth/me').then(r => setUser(r.data.data)).catch(() => setUser(null)).finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = (t: string, u: User) => { localStorage.setItem('accessToken', t); setToken(t); setUser(u); };
  const logout = () => { localStorage.removeItem('accessToken'); setToken(null); setUser(null); api.post('/auth/logout').catch(()=>{}); };

  return <Ctx.Provider value={{ user, token, login, logout, loading }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
