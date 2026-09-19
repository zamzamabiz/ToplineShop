'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { listBatches } from '@/lib/tdr-api';
import type { TdrBatch, BatchStatus } from '@/types/tdr';

const STATUS_COLORS: Record<string, string> = {
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

export default function TdrBatchesPage() {
  const { accessToken } = useAuth();
  const [batches, setBatches] = useState<TdrBatch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const PAGE_SIZE = 25;

  useEffect(() => {
    if (!accessToken) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    listBatches(accessToken, { page, pageSize: PAGE_SIZE }, ctrl.signal)
      .then((r) => {
        setBatches(r.batches);
        setTotal(r.total);
      })
      .catch((e) => { if (e?.name !== 'AbortError') setError(e?.message ?? 'Failed to load'); })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [accessToken, page]);

  if (error) return (
    <div className="text-sm text-red-300 bg-red-900/20 rounded px-4 py-3">{error}</div>
  );

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Batches</h1>
        <Link
          href="/tdr/upload"
          className="text-sm px-4 py-1.5 bg-accent-primary text-white rounded hover:opacity-90"
        >
          + New Upload
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-surface-secondary rounded animate-pulse" />
          ))}
        </div>
      ) : batches.length === 0 ? (
        <div className="border border-dashed border-white/20 rounded-lg p-8 text-center text-text-muted text-sm">
          No batches found.
        </div>
      ) : (
        <div className="bg-surface-secondary border border-white/10 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr className="text-left text-xs text-text-muted uppercase tracking-wider">
                <th className="px-4 py-2">File</th>
                <th className="px-4 py-2">Direction</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Uploaded</th>
                <th className="px-4 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-2 font-mono text-xs truncate max-w-[200px] text-text-primary">
                    {b.originalFilename}
                  </td>
                  <td className="px-4 py-2 text-xs text-text-secondary">{b.tradeDirection}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[b.status] ?? 'bg-gray-800 text-gray-400'}`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-text-muted">
                    {new Date(b.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/tdr/batches/${b.id}`}
                      className="text-accent-primary text-xs hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center gap-3 text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 rounded border border-white/10 text-text-secondary disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-text-muted text-xs">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <button
            disabled={page * PAGE_SIZE >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 rounded border border-white/10 text-text-secondary disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
