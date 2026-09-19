'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { listQuarantine } from '@/lib/tdr-api';
import type { QuarantineIssue } from '@/types/tdr';

const SEVERITY_COLORS: Record<string, string> = {
  BLOCKING: 'text-red-400',
  ERROR: 'text-orange-400',
  WARNING: 'text-yellow-400',
};

export default function TdrQuarantinePage() {
  const { accessToken } = useAuth();
  const searchParams = useSearchParams();
  const batchId = searchParams.get('batchId') ?? '';

  const [issues, setIssues] = useState<QuarantineIssue[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const PAGE_SIZE = 20;

  useEffect(() => {
    if (!accessToken || !batchId) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    listQuarantine(accessToken, batchId, { page, pageSize: PAGE_SIZE }, ctrl.signal)
      .then((r) => { setIssues(r.issues); setTotal(r.total); })
      .catch((e) => { if (e?.name !== 'AbortError') setError(e?.message ?? 'Failed to load'); })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [accessToken, batchId, page]);

  if (!batchId) {
    return (
      <div className="max-w-xl text-sm text-text-muted">
        <p>Select a batch with quarantined records to review.</p>
        <p className="mt-2">Navigate from a batch detail page with status REVIEW_REQUIRED.</p>
      </div>
    );
  }

  if (error) return (
    <div className="text-sm text-red-300 bg-red-900/20 rounded px-4 py-3">{error}</div>
  );

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Quarantine Review</h1>
        <span className="text-xs text-text-muted font-mono">Batch: {batchId.slice(0, 8)}…</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-surface-secondary rounded animate-pulse" />)}
        </div>
      ) : issues.length === 0 ? (
        <div className="border border-dashed border-white/20 rounded-lg p-8 text-center text-text-muted text-sm">
          No quarantined issues found.
        </div>
      ) : (
        <div className="bg-surface-secondary border border-white/10 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr className="text-left text-xs text-text-muted uppercase tracking-wider">
                <th className="px-4 py-2">Row #</th>
                <th className="px-4 py-2">Disposition</th>
                <th className="px-4 py-2">Severity</th>
                <th className="px-4 py-2">Field</th>
                <th className="px-4 py-2">Rule</th>
                <th className="px-4 py-2">Message</th>
                <th className="px-4 py-2">Raw Value</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-2 font-mono text-xs text-text-muted">
                    #{issue.record.sourceRowNumber}
                  </td>
                  <td className="px-4 py-2 text-xs font-medium">
                    <span className={issue.record.rowDisposition === 'REJECTED' ? 'text-red-400' : 'text-amber-400'}>
                      {issue.record.rowDisposition}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs font-medium">
                    <span className={SEVERITY_COLORS[issue.severity] ?? 'text-text-secondary'}>
                      {issue.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-text-secondary font-mono">{issue.fieldName}</td>
                  <td className="px-4 py-2 text-xs text-text-muted font-mono">{issue.ruleCode}</td>
                  <td className="px-4 py-2 text-xs text-text-secondary max-w-[240px] truncate">{issue.message}</td>
                  <td className="px-4 py-2 text-xs text-text-muted font-mono max-w-[120px] truncate">
                    {issue.rawValue ?? '—'}
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
