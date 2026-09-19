'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getTdrStatus, getAnalyticsSummary, listBatches } from '@/lib/tdr-api';
import type { TdrStatus, AnalyticsSummary, TdrBatch } from '@/types/tdr';

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-surface-secondary border border-white/10 rounded-lg p-4">
      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </div>
  );
}

function BatchStatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    RECEIVED: 'bg-sky-900/40 text-sky-300',
    QUEUED: 'bg-yellow-900/40 text-yellow-300',
    PROCESSING: 'bg-blue-900/40 text-blue-300',
    REVIEW_REQUIRED: 'bg-amber-900/40 text-amber-300',
    READY: 'bg-green-900/40 text-green-300',
    PARTIAL: 'bg-orange-900/40 text-orange-300',
    FAILED: 'bg-red-900/40 text-red-300',
    CANCELLED: 'bg-gray-800 text-gray-400',
    EXPORTING: 'bg-indigo-900/40 text-indigo-300',
    EXPORTED: 'bg-emerald-900/40 text-emerald-300',
    QUALITY_PENDING: 'bg-purple-900/40 text-purple-300',
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-gray-800 text-gray-400'}`}
    >
      {status}
    </span>
  );
}

export default function TdrOverviewPage() {
  const { accessToken } = useAuth();
  const [status, setStatus] = useState<TdrStatus | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [recentBatches, setRecentBatches] = useState<TdrBatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);

    Promise.all([
      getTdrStatus(accessToken, ctrl.signal),
      getAnalyticsSummary(accessToken, {}, ctrl.signal),
      listBatches(accessToken, { pageSize: 5 }, ctrl.signal),
    ])
      .then(([s, sm, bl]) => {
        setStatus(s);
        setSummary(sm);
        setRecentBatches(bl.batches);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') setError(err?.message ?? 'Failed to load');
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [accessToken]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-surface-secondary rounded w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-surface-secondary rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-sm text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Data Refinery</h1>
        {status && !status.moduleEnabled && (
          <span className="text-xs bg-yellow-900/40 text-yellow-300 px-3 py-1 rounded">
            Module disabled for this tenant
          </span>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Records" value={summary.total.toLocaleString()} />
          <StatCard
            label="Quality Rate"
            value={summary.qualityRate !== null ? `${summary.qualityRate}%` : '—'}
            sub={`${summary.accepted.toLocaleString()} accepted`}
          />
          <StatCard
            label="Quarantined"
            value={summary.quarantined.toLocaleString()}
          />
          <StatCard
            label="Export Eligible"
            value={summary.exportEligibleCount.toLocaleString()}
          />
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <Link
          href="/tdr/upload"
          className="bg-accent-primary/10 border border-accent-primary/30 rounded-lg p-4 hover:bg-accent-primary/20 transition-colors"
        >
          <p className="font-medium text-accent-primary mb-1">New Import</p>
          <p className="text-xs text-text-muted">Upload CSV or XLSX trade data</p>
        </Link>
        <Link
          href="/tdr/analytics"
          className="bg-surface-secondary border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors"
        >
          <p className="font-medium text-text-primary mb-1">Analytics</p>
          <p className="text-xs text-text-muted">
            Quality trends, HS breakdowns, country analysis
          </p>
        </Link>
        <Link
          href="/tdr/exports"
          className="bg-surface-secondary border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors"
        >
          <p className="font-medium text-text-primary mb-1">Exports</p>
          <p className="text-xs text-text-muted">Download accepted trade records as CSV</p>
        </Link>
      </div>

      {recentBatches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
              Recent Batches
            </h2>
            <Link
              href="/tdr/batches"
              className="text-xs text-accent-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="bg-surface-secondary border border-white/10 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-left text-xs text-text-muted uppercase tracking-wider">
                  <th className="px-4 py-2">File</th>
                  <th className="px-4 py-2">Direction</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {recentBatches.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-2 font-mono text-xs text-text-primary truncate max-w-[180px]">
                      <Link
                        href={`/tdr/batches/${b.id}`}
                        className="hover:text-accent-primary"
                      >
                        {b.originalFilename}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-xs text-text-secondary">
                      {b.tradeDirection}
                    </td>
                    <td className="px-4 py-2">
                      <BatchStatusPill status={b.status} />
                    </td>
                    <td className="px-4 py-2 text-xs text-text-muted">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {recentBatches.length === 0 && !loading && (
        <div className="border border-dashed border-white/20 rounded-lg p-8 text-center">
          <p className="text-text-muted text-sm">No batches yet.</p>
          <Link href="/tdr/upload" className="text-accent-primary text-sm hover:underline mt-2 inline-block">
            Upload your first file
          </Link>
        </div>
      )}
    </div>
  );
}
