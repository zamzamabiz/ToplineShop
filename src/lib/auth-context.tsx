'use client';

/**
 * Minimal in-memory auth context.
 * PM-005 OPEN: storage strategy (sessionStorage vs cookie vs none) deferred to PM.
 * Token lives only in React state — lost on page refresh by design until PM-005 resolves.
 *
 * TDR-AUTH-SESSION-LIFECYCLE-CORRECTION-001:
 * - Stores refreshToken for in-session token refresh
 * - Registers callbacks with tdr-api refresh infrastructure on mount
 * - Exposes sessionExpired flag so TdrLoginGate can show "Session expired" message
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { AuthLoginResponse } from '@/types/tdr';
import { setAuthCallbacks } from '@/lib/tdr-api';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthLoginResponse['user'] | null;
  sessionExpired: boolean;
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
    refreshToken: null,
    user: null,
    sessionExpired: false,
  });

  // Always-current ref so callbacks registered once still see latest tokens.
  const stateRef = useRef(state);
  stateRef.current = state;

  const setAuth = useCallback((resp: AuthLoginResponse) => {
    setState({
      accessToken: resp.accessToken,
      refreshToken: resp.refreshToken,
      user: resp.user,
      sessionExpired: false,
    });
  }, []);

  const clearAuth = useCallback(() => {
    setState({ accessToken: null, refreshToken: null, user: null, sessionExpired: false });
  }, []);

  // Register refresh callbacks with tdr-api. Deregister on unmount.
  useEffect(() => {
    setAuthCallbacks({
      getRefreshToken: () => stateRef.current.refreshToken,
      onRefreshSuccess: (tokens) => {
        setState((prev) => ({
          ...prev,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          sessionExpired: false,
        }));
      },
      onAuthFailed: () => {
        setState({ accessToken: null, refreshToken: null, user: null, sessionExpired: true });
      },
    });
    return () => setAuthCallbacks(null);
  }, []); // intentionally empty — uses stateRef for current values

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
