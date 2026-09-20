'use client';

import { AuthProvider, useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useCallback } from 'react';
import { authLogin, authLogout } from '@/lib/tdr-api';
import type { AuthLoginResponse } from '@/types/tdr';

const NAV_ITEMS = [
  { href: '/tdr', label: 'Overview', exact: true },
  { href: '/tdr/upload', label: 'Upload' },
  { href: '/tdr/batches', label: 'Batches' },
  { href: '/tdr/quarantine', label: 'Quarantine' },
  { href: '/tdr/exports', label: 'Exports' },
  { href: '/tdr/analytics', label: 'Analytics' },
];

function TdrNav() {
  const pathname = usePathname();
  const { user, clearAuth, accessToken } = useAuth();

  const handleLogout = async () => {
    if (accessToken) await authLogout(accessToken).catch(() => null);
    clearAuth();
  };

  return (
    <nav className="border-b border-white/10 bg-surface-primary px-4 py-2 flex items-center gap-1 flex-wrap">
      <span className="text-xs font-semibold text-accent-primary mr-3 uppercase tracking-wider">
        Data Refinery
      </span>
      {NAV_ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              active
                ? 'bg-accent-primary text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      <div className="ml-auto flex items-center gap-3 text-xs text-text-muted">
        {user ? (
          <>
            <span>{user.email}</span>
            <button
              onClick={handleLogout}
              className="text-text-secondary hover:text-text-primary underline"
            >
              Sign out
            </button>
          </>
        ) : null}
      </div>
    </nav>
  );
}

export function TdrLoginGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, setAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        const resp = await authLogin({ email, password });
        setAuth(resp);
      } catch (err: any) {
        setError(err?.message ?? 'Login failed');
      } finally {
        setLoading(false);
      }
    },
    [email, password, setAuth],
  );

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <form
        onSubmit={handleLogin}
        className="bg-surface-secondary border border-white/10 rounded-lg p-8 w-full max-w-sm space-y-4"
      >
        <h2 className="text-lg font-semibold text-text-primary">
          Sign in to Data Refinery
        </h2>
        <p className="text-xs text-text-muted">
          Your session is kept in memory only (PM-005 storage strategy pending).
        </p>
        {error && (
          <p className="text-xs text-red-400 bg-red-900/20 rounded px-3 py-2">{error}</p>
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full px-3 py-2 text-sm bg-surface-primary border border-white/10 rounded text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="w-full px-3 py-2 text-sm bg-surface-primary border border-white/10 rounded text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary"
        />
        <button
          type="submit"
          disabled={loading || !email.trim() || !password}
          className="w-full py-2 text-sm font-medium bg-accent-primary text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

export default function TdrLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-full">
        <TdrNav />
        <main className="flex-1 p-4 md:p-6">
          <TdrLoginGate>{children}</TdrLoginGate>
        </main>
      </div>
    </AuthProvider>
  );
}
