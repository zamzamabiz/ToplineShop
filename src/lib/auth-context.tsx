'use client';

/**
 * Minimal in-memory auth context.
 * PM-005 OPEN: storage strategy (sessionStorage vs cookie vs none) deferred to PM.
 * Token lives only in React state — lost on page refresh by design until PM-005 resolves.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { AuthLoginResponse } from '@/types/tdr';

interface AuthState {
  accessToken: string | null;
  user: AuthLoginResponse['user'] | null;
}

interface AuthContextValue extends AuthState {
  setAuth: (resp: AuthLoginResponse) => void;
  clearAuth: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    user: null,
  });

  const setAuth = useCallback((resp: AuthLoginResponse) => {
    setState({ accessToken: resp.accessToken, user: resp.user });
  }, []);

  const clearAuth = useCallback(() => {
    setState({ accessToken: null, user: null });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        setAuth,
        clearAuth,
        isAuthenticated: state.accessToken !== null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
