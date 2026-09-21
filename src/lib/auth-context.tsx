'use client';

/**
 * PM-005 IMPLEMENTED: HttpOnly cookie session persistence.
 *
 * Auth architecture:
 *   - Access token: in React state (memory only, never persisted to storage)
 *   - Refresh token: HttpOnly Secure SameSite=Strict cookie (JS cannot read it)
 *   - Page reload: AuthProvider mounts → calls /auth/refresh with credentials:include
 *                  → cookie sent automatically → access token restored
 *   - No localStorage, no sessionStorage for tokens
 *
 * TDR-AUTH-SESSION-LIFECYCLE-CORRECTION-001:
 *   - Registers callbacks with tdr-api refresh infrastructure on mount
 *   - Exposes sessionExpired flag so TdrLoginGate shows "Session expired"
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { AuthLoginResponse } from '@/types/tdr';
import { setAuthCallbacks, authRefresh } from '@/lib/tdr-api';

interface AuthState {
  accessToken: string | null;
  user: AuthLoginResponse['user'] | null;
  sessionExpired: boolean;
  restoring: boolean;
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
    sessionExpired: false,
    restoring: true, // true until initial restore attempt completes
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const setAuth = useCallback((resp: AuthLoginResponse) => {
    setState({
      accessToken: resp.accessToken,
      user: resp.user,
      sessionExpired: false,
      restoring: false,
    });
  }, []);

  const clearAuth = useCallback(() => {
    setState({ accessToken: null, user: null, sessionExpired: false, restoring: false });
  }, []);

  // Register refresh callbacks with tdr-api (cookie-based — no token arg needed).
  useEffect(() => {
    setAuthCallbacks({
      getRefreshToken: () => null, // cookie is the authority; no in-memory token
      onRefreshSuccess: (tokens) => {
        setState((prev) => ({
          ...prev,
          accessToken: tokens.accessToken,
          sessionExpired: false,
          restoring: false,
        }));
      },
      onAuthFailed: () => {
        setState({ accessToken: null, user: null, sessionExpired: true, restoring: false });
      },
    });
    return () => setAuthCallbacks(null);
  }, []);

  // On mount: attempt to restore session from the HttpOnly refresh cookie.
  // If the cookie is valid, the backend issues a new access token.
  // If absent or expired, silently stays unauthenticated.
  useEffect(() => {
    let cancelled = false;
    authRefresh()
      .then((tokens) => {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            accessToken: tokens.accessToken,
            sessionExpired: false,
            restoring: false,
          }));
        }
      })
      .catch(() => {
        // No valid cookie — unauthenticated state, no error shown
        if (!cancelled) {
          setState((prev) => ({ ...prev, restoring: false }));
        }
      });
    return () => { cancelled = true; };
  }, []); // intentionally empty — runs once on mount

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
