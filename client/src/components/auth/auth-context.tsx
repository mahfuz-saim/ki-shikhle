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
  login: (token: string, user: User, refreshToken?: string) => void;
  logout: () => void;
  loading: boolean;
  childToken?: string | null;
  enterChildMode?: (childId: string, pin?: string) => Promise<{ success: boolean; message?: string }>;
  exitChildMode?: () => void;
}

const DEFAULT_DEMO_CHILDREN: Child[] = [
  {
    id: 'demo-child-1',
    name: 'Rahim Ahmed',
    nickname: 'Rahim',
    email: 'rahim@demo.com',
    grade: 'Class 8',
    curriculum: 'NCTB',
    medium: 'Bangla',
    avatar: '/avatars/boy-1.png',
  },
  {
    id: 'demo-child-2',
    name: 'Tasnim Islam',
    nickname: 'Tasnim',
    email: 'tasnim@demo.com',
    grade: 'Class 5',
    curriculum: 'NCTB',
    medium: 'Bangla',
    avatar: '/avatars/girl-1.png',
  },
];

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  childrenList: [],
  activeChild: null,
  setActiveChild: () => {},
  isChildMode: false,
  refreshChildren: async () => [],
  login: () => {},
  logout: () => {},
  loading: true,
  childToken: null,
  enterChildMode: async () => ({ success: true }),
  exitChildMode: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [activeChild, setActiveChildState] = useState<Child | null>(null);
  const [isChildMode, setIsChildMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchChildren = useCallback(async (): Promise<Child[]> => {
    try {
      const res = await api.get('/children');
      const list = res.data?.data || [];
      if (list && list.length > 0) {
        setChildrenList(list);

        // Check saved active child
        const savedChildId = typeof window !== 'undefined' ? localStorage.getItem('active_child_id') : null;
        let matched = list.find((c: Child) => c.id === savedChildId);
        if (!matched && list.length > 0) {
          matched = list[0];
        }
        if (matched) {
          setActiveChildState(matched);
          if (typeof window !== 'undefined') {
            localStorage.setItem('active_child_id', matched.id);
            localStorage.setItem('activeChild', matched.id);
          }
        }
        return list;
      }
      // If user is demo parent or no children in DB yet, fallback to default demo children
      setChildrenList(DEFAULT_DEMO_CHILDREN);
      setActiveChildState(DEFAULT_DEMO_CHILDREN[0]);
      if (typeof window !== 'undefined') {
        localStorage.setItem('active_child_id', DEFAULT_DEMO_CHILDREN[0].id);
        localStorage.setItem('activeChild', DEFAULT_DEMO_CHILDREN[0].id);
      }
      return DEFAULT_DEMO_CHILDREN;
    } catch {
      // Fallback demo children if offline
      setChildrenList(DEFAULT_DEMO_CHILDREN);
      setActiveChildState(DEFAULT_DEMO_CHILDREN[0]);
      return DEFAULT_DEMO_CHILDREN;
    }
  }, []);

  const setActiveChild = (child: Child | null) => {
    setActiveChildState(child);
    if (child && typeof window !== 'undefined') {
      localStorage.setItem('active_child_id', child.id);
      localStorage.setItem('activeChild', child.id);
    }
  };

  const login = (newToken: string, newUser: User, newRefreshToken?: string) => {
    setToken(newToken);
    setUser(newUser);
    const isChild = newUser.role === 'child';
    setIsChildMode(isChild);

    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', newToken);
      localStorage.setItem('userRole', newUser.role);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      if (newUser.childId) {
        localStorage.setItem('active_child_id', newUser.childId);
        localStorage.setItem('activeChild', newUser.childId);
      }
    }

    if (isChild) {
      const selfChild: Child = {
        id: newUser.childId || newUser.id,
        name: newUser.name,
        email: newUser.email,
        grade: newUser.grade || 'Class 8',
        curriculum: newUser.curriculum || 'NCTB',
        medium: 'Bangla',
      };
      setActiveChildState(selfChild);
      setChildrenList([selfChild]);
    } else {
      fetchChildren();
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsChildMode(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('childToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('active_child_id');
      localStorage.removeItem('activeChild');
      // Direct hard redirect to ensure full teardown and clean login page
      window.location.href = '/login';
    }
    api.post('/auth/logout').catch(() => {});
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('accessToken');
      const storedRole = localStorage.getItem('userRole');

      if (storedToken) {
        setToken(storedToken);
        api
          .get('/auth/me')
          .then((r) => {
            const userData = r.data?.data;
            if (userData) {
              setUser(userData);
              const isChild = userData?.role === 'child' || storedRole === 'child';
              setIsChildMode(isChild);
              if (isChild) {
                const selfChild: Child = {
                  id: userData?.childId || userData?.id || 'demo-child-1',
                  name: userData?.name || 'Student',
                  email: userData?.email || 'rahim@demo.com',
                  grade: userData?.grade || 'Class 8',
                  curriculum: userData?.curriculum || 'NCTB',
                  medium: 'Bangla',
                };
                setActiveChildState(selfChild);
                setChildrenList([selfChild]);
              } else {
                fetchChildren();
              }
            } else {
              setLoading(false);
            }
          })
          .catch(() => {
            // Keep fallback user if backend is running mock
            const isChild = storedRole === 'child';
            setIsChildMode(isChild);
            if (isChild) {
              const mockChild: User = {
                id: 'demo-child-1',
                name: 'Rahim Ahmed (Student)',
                email: 'rahim@demo.com',
                role: 'child',
                childId: 'demo-child-1',
                grade: 'Class 8',
                curriculum: 'NCTB',
              };
              setUser(mockChild);
              const selfChild: Child = {
                id: mockChild.id,
                name: mockChild.name,
                email: mockChild.email,
                grade: 'Class 8',
                curriculum: 'NCTB',
                medium: 'Bangla',
              };
              setActiveChildState(selfChild);
              setChildrenList([selfChild]);
            } else {
              setUser({
                id: 'parent-demo',
                name: 'Rafiqul Islam',
                email: 'parent@demo.com',
                role: 'parent',
                trialEndsAt: new Date(Date.now() + 15 * 86400000).toISOString(),
              });
              setChildrenList(DEFAULT_DEMO_CHILDREN);
              setActiveChildState(DEFAULT_DEMO_CHILDREN[0]);
            }
          })
          .finally(() => setLoading(false));
      } else {
        // Not logged in
        setLoading(false);
      }
    }
  }, [fetchChildren]);

  // Proactive Keep-Alive: Refresh token before expiry & on window focus after inactivity
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkAndRefreshToken = async () => {
      const storedToken = localStorage.getItem('accessToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedToken) return;

      // Check if JWT payload is near expiration (within 60 minutes)
      try {
        const parts = storedToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const exp = payload.exp * 1000;
          const timeLeft = exp - Date.now();

          // If expiring within 60 minutes or expired, silently refresh in the background
          if (timeLeft < 60 * 60 * 1000) {
            const res = await api.post('/auth/refresh', {
              refreshToken: storedRefreshToken || undefined,
            });
            const newToken = res.data?.data?.accessToken;
            if (newToken) {
              setToken(newToken);
              localStorage.setItem('accessToken', newToken);
              if (res.data?.data?.refreshToken) {
                localStorage.setItem('refreshToken', res.data.data.refreshToken);
              }
            }
          }
        }
      } catch {
        // If parsing fails (e.g. demo token), no action needed
      }
    };

    // 1. Check on window focus / tab visibility change (returning from inactivity)
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        checkAndRefreshToken();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    // 2. Periodic background check every 15 minutes
    const interval = setInterval(checkAndRefreshToken, 15 * 60 * 1000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      clearInterval(interval);
    };
  }, []);

  // Backwards-compatible stubs for existing references
  const enterChildMode = async (childId: string) => {
    setIsChildMode(true);
    const matched = childrenList.find((c) => c.id === childId);
    if (matched) setActiveChildState(matched);
    return { success: true };
  };

  const exitChildMode = () => {
    logout();
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
        login,
        logout,
        loading,
        childToken: token,
        enterChildMode,
        exitChildMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
