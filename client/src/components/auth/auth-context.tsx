'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'parent' | 'child' | 'admin' | string;
  language?: string;
  trialEndsAt?: string;
  childId?: string;
  grade?: string;
  curriculum?: string;
}

export interface Child {
  id: string;
  name: string;
  nickname?: string;
  email?: string;
  grade: string;
  curriculum: string;
  medium: string;
  avatar?: string;
  /**
   * `'rahim' | 'tasnim' | 'fahim'` for the three seeded demo children, `null` for
   * everyone else.
   *
   * This is a **content selector**, not a security flag: it says which demo dataset to
   * show for this child. The server decides it, and it only ever reaches the owning
   * parent or the child themselves.
   */
  demoProfile?: string | null;
  slug?: string | null;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  childrenList: Child[];
  activeChild: Child | null;
  setActiveChild: (child: Child | null) => void;
  isChildMode: boolean;
  refreshChildren: () => Promise<Child[]>;
  subscription: any | null;
  setSubscription: (sub: any) => void;
  refreshSubscription: () => Promise<any>;
  updateUser: (fields: Partial<User>) => void;
  login: (token: string, user: User, refreshToken?: string) => void;
  logout: () => void;
  loading: boolean;
  childToken?: string | null;
  enterChildMode?: (childId: string, pin?: string) => Promise<{ success: boolean; message?: string }>;
  exitChildMode?: () => void;
}

/**
 * There is no demo fixture here, and there must not be one.
 *
 * This file used to hold `DEFAULT_DEMO_CHILDREN` — three hardcoded children injected
 * into the UI whenever `GET /children` came back empty **or errored**, and a fabricated
 * demo parent whenever `GET /auth/me` failed.
 *
 * That was not a cosmetic convenience. It made the client lie about whose data it was
 * showing: a brand-new account with no children was rendered as if it owned Rahim,
 * Tasnim and Fahim, and every id in the UI (`demo-child-1`) belonged to the demo
 * tenant's real rows. It also re-created the server-side leak from the other end — a
 * child on `/child/*` was sent the **parent's** token, so the server saw the request as
 * the parent and happily returned every sibling's data.
 *
 * The rule now: the client's state is exactly what the server said. An empty list is an
 * empty list. A failed request is an error, not a demo.
 */

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  childrenList: [],
  activeChild: null,
  setActiveChild: () => {},
  isChildMode: false,
  refreshChildren: async () => [],
  subscription: null,
  setSubscription: () => {},
  refreshSubscription: async () => null,
  updateUser: () => {},
  login: () => {},
  logout: () => {},
  loading: true,
  childToken: null,
  enterChildMode: async () => ({ success: true }),
  exitChildMode: () => {},
});

/** Decode a JWT payload. Handles base64url, which `atob` alone does not. */
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [childToken, setChildToken] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [activeChild, setActiveChildState] = useState<Child | null>(null);
  const [isChildMode, setIsChildMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Load the account's subscription.
   *
   * There used to be a `defaultProSub` fallback here: if the request failed, the account
   * was shown as an active Pro plan worth ৳999. A billing failure is a billing failure —
   * the UI must show "no subscription" rather than invent one.
   */
  const fetchSubscription = useCallback(async (): Promise<any> => {
    try {
      const res = await api.get('/billing/subscription');
      const sub = res.data?.data;
      if (sub) {
        setSubscription(sub);
        return sub;
      }
      setSubscription(null);
      return null;
    } catch {
      setSubscription(null);
      return null;
    }
  }, []);

  const updateUser = useCallback((fields: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...fields } : null));
  }, []);

  const fetchChildren = useCallback(async (): Promise<Child[]> => {
    try {
      const res = await api.get('/children');
      const list: Child[] = res.data?.data || [];
      setChildrenList(list);

      // Keep the active child in sync with the account's actual children.
      const savedChildId = typeof window !== 'undefined' ? localStorage.getItem('active_child_id') : null;
      const matched = list.find((c: Child) => c.id === savedChildId) || list[0] || null;
      if (matched) {
        setActiveChildState(matched);
        if (typeof window !== 'undefined') {
          localStorage.setItem('active_child_id', matched.id);
          localStorage.setItem('activeChild', matched.id);
        }
      } else {
        // No children — that is a legitimate empty state, not an error.
        setActiveChildState(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('active_child_id');
          localStorage.removeItem('activeChild');
        }
      }
      return list;
    } catch {
      // A failed request is a failed request. Showing demo children here is what made
      // a brand-new account look like the demo tenant.
      setChildrenList([]);
      setActiveChildState(null);
      return [];
    }
  }, []);

  const setActiveChild = (child: Child | null) => {
    setActiveChildState(child);
    if (typeof window !== 'undefined') {
      if (child) {
        localStorage.setItem('active_child_id', child.id);
        localStorage.setItem('activeChild', child.id);
      } else {
        localStorage.removeItem('active_child_id');
        localStorage.removeItem('activeChild');
      }
    }
  };

  const login = (newToken: string, newUser: User, newRefreshToken?: string) => {
    setToken(newToken);
    setUser(newUser);
    const isChild = newUser.role === 'child';
    setIsChildMode(isChild);
    setChildToken(isChild ? newToken : null);

    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', newToken);
      localStorage.setItem('userRole', newUser.role);
      if (isChild) localStorage.setItem('childToken', newToken);
      else localStorage.removeItem('childToken');
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      if (newUser.childId) {
        localStorage.setItem('active_child_id', newUser.childId);
        localStorage.setItem('activeChild', newUser.childId);
      }
    }

    if (isChild) {
      // A child's own profile — the single child this session may act as.
      const selfChild: Child = {
        id: newUser.childId || newUser.id,
        name: newUser.name,
        email: newUser.email,
        grade: newUser.grade || 'Class 8',
        curriculum: newUser.curriculum || 'NCTB',
        medium: 'Bangla',
        // A child acting for themselves carries the demo profile when the server says
        // so, so the demo dataset still loads for a demo child.
        demoProfile: (newUser as any).demoProfile ?? null,
      };
      setActiveChildState(selfChild);
      setChildrenList([selfChild]);
    } else {
      fetchChildren();
      fetchSubscription();
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setChildToken(null);
    setIsChildMode(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('childToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('active_child_id');
      localStorage.removeItem('activeChild');
    }
    // Tell the server first. The old code did `window.location.href = '/login'` BEFORE
    // the request, which aborted it — so the refresh cookie survived the "logout" and
    // the next visitor to that browser got a live session.
    api
      .post('/auth/logout')
      .catch(() => {})
      .finally(() => {
        if (typeof window !== 'undefined') window.location.href = '/login';
      });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedToken = localStorage.getItem('accessToken');
    const storedChildToken = localStorage.getItem('childToken');

    if (!storedToken) {
      setLoading(false);
      return;
    }

    setToken(storedToken);
    if (storedChildToken) setChildToken(storedChildToken);

    fetchSubscription();
    api
      .get('/auth/me', { headers: { Authorization: `Bearer ${storedChildToken || storedToken}` } })
      .then((r) => {
        const userData = r.data?.data;
        if (!userData) {
          setLoading(false);
          return;
        }
        setUser(userData);
        const isChild = userData.role === 'child';
        setIsChildMode(isChild);

        if (isChild) {
          const sessionToken = localStorage.getItem('childToken') || localStorage.getItem('accessToken') || storedToken;
          setChildToken(sessionToken);
          localStorage.setItem('childToken', sessionToken);
          const selfChild: Child = {
            id: userData.childId || userData.id,
            name: userData.name || 'Student',
            email: userData.email,
            grade: userData.grade || 'Class 8',
            curriculum: userData.curriculum || 'NCTB',
            medium: 'Bangla',
            demoProfile: userData.demoProfile ?? null,
          };
          setActiveChildState(selfChild);
          setChildrenList([selfChild]);
        } else {
          fetchChildren();
        }
      })
      .catch(() => {
        // The session is not valid. Clear it and let the route guard send the user to
        // the login page. Fabricating a demo parent here is what made a broken session
        // look like a working one.
        setUser(null);
        setToken(null);
        setChildrenList([]);
        setActiveChildState(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('childToken');
          localStorage.removeItem('userRole');
          localStorage.removeItem('active_child_id');
          localStorage.removeItem('activeChild');
        }
      })
      .finally(() => setLoading(false));
  }, [fetchChildren, fetchSubscription]);

  // Proactive keep-alive: refresh the access token before it expires, and after the tab
  // has been in the background.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkAndRefreshToken = async () => {
      const storedToken = localStorage.getItem('accessToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedToken) return;

      const payload = decodeJwtPayload(storedToken);
      if (!payload?.exp) return;

      const timeLeft = payload.exp * 1000 - Date.now();
      // Within 60 minutes of expiry — refresh in the background.
      if (timeLeft >= 60 * 60 * 1000) return;

      try {
        const res = await api.post('/auth/refresh', {
          refreshToken: storedRefreshToken || undefined,
        });
        const newToken = res.data?.data?.accessToken;
        if (!newToken) return;
        setToken(newToken);
        if (localStorage.getItem('childToken') === storedToken) {
          setChildToken(newToken);
          localStorage.setItem('childToken', newToken);
        }
        localStorage.setItem('accessToken', newToken);
        if (res.data?.data?.refreshToken) {
          localStorage.setItem('refreshToken', res.data.data.refreshToken);
        }
      } catch {
        // The refresh failed — the response interceptor handles the session teardown.
      }
    };

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        checkAndRefreshToken();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    const interval = setInterval(checkAndRefreshToken, 15 * 60 * 1000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      clearInterval(interval);
    };
  }, []);

  /**
   * Enter child mode.
   *
   * This used to be a local state flip: it marked the session as "child mode" and moved
   * the active child, but the token was never replaced — so every `/child/*` request
   * went out with the **parent's** token, and the server (correctly) treated the child
   * as the parent. That is how a child could read a sibling's notes.
   *
   * It now calls the real `POST /children/:id/enter`, which verifies the PIN and
   * returns a child-scoped token, and stores that token as `childToken`.
   */
  const enterChildMode = async (childId: string, pin?: string) => {
    try {
      const res = await api.post(`/children/${childId}/enter`, pin ? { pin } : {});
      const data = res.data?.data;
      if (!data?.token) {
        return { success: false, message: 'Could not enter child mode' };
      }

      setChildToken(data.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('childToken', data.token);
        localStorage.setItem('userRole', 'child');
      }
      setIsChildMode(true);

      const matched = childrenList.find((c) => c.id === childId);
      const child: Child | undefined = data.child
        ? {
            id: data.child.id,
            name: data.child.name,
            grade: data.child.grade || 'Class 8',
            curriculum: 'NCTB',
            medium: 'Bangla',
            email: matched?.email,
            avatar: matched?.avatar,
          }
        : matched;
      if (child) {
        setActiveChildState(child);
        if (typeof window !== 'undefined') {
          localStorage.setItem('active_child_id', child.id);
          localStorage.setItem('activeChild', child.id);
        }
      }
      return { success: true };
    } catch (e: any) {
      return {
        success: false,
        message: e?.response?.data?.error?.message || 'Could not enter child mode',
      };
    }
  };

  /**
   * Leave child mode.
   *
   * This used to call `logout()` — so switching back to the parent account signed the
   * parent out entirely. It now drops only the child token and keeps the parent
   * session alive.
   */
  const exitChildMode = () => {
    setChildToken(null);
    setIsChildMode(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('childToken');
      localStorage.setItem('userRole', user?.role || 'parent');
    }
    // Restore the parent's own child list.
    fetchChildren();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        childrenList,
        activeChild,
        setActiveChild,
        isChildMode,
        refreshChildren: fetchChildren,
        subscription,
        setSubscription,
        refreshSubscription: fetchSubscription,
        updateUser,
        login,
        logout,
        loading,
        childToken,
        enterChildMode,
        exitChildMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
