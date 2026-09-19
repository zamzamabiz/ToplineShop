'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { listQuarantine, applyCorrection } from '@/lib/tdr-api';
import type { QuarantineRecord } from '@/types/tdr';

const SEVERITY_COLORS: Record<string, string> = {
  BLOCKING: 'text-red-400',
  ERROR: 'text-orange-400',
  WARNING: 'text-yellow-400',
};

export default function TdrQuarantinePage() {
  const { accessToken } = useAuth();
  const searchParams = useSearchParams();
  const batchId = searchParams.get('batchId') ?? '';

  const [records, setRecords] = useState<QuarantineRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const PAGE_SIZE = 20;

  useEffect(() => {
    if (!accessToken || !batchId) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    listQuarantine(accessToken, batchId, { page, pageSize: PAGE_SIZE }, ctrl.signal)
      .then((r) => { setRecords(r.records); setTotal(r.total); })
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
      ) : records.length === 0 ? (
        <div className="border border-dashed border-white/20 rounded-lg p-8 text-center text-text-muted text-sm">
          No quarantined records found.
        </div>
      ) : (
        <div className="bg-surface-secondary border border-white/10 rounded-lg overflow-hidden">
          {records.map((r) => (
            <div key={r.id} className="border-b border-white/5 last:border-0">
              <button
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-mono text-xs text-text-muted w-12 shrink-0">
                  #{r.sourceRowNumber}
                </span>
                <span className={`text-xs font-medium shrink-0 ${
                  r.rowDisposition === 'REJECTED' ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {r.rowDisposition}
                </span>
                <span className="text-xs text-text-muted flex-1">
                  {r.issues.length} issue{r.issues.length !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-text-muted">{expanded === r.id ? '▲' : '▼'}</span>
              </button>

              {expanded === r.id && (
                <div className="px-4 pb-4 space-y-2">
                  {r.issues.map((issue, i) => (
                    <div
                      key={i}
                      className="bg-surface-primary rounded p-3 text-xs"
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`font-medium ${SEVERITY_COLORS[issue.severity] ?? 'text-text-secondary'}`}>
                          {issue.severity}
                        </span>
                        <span className="text-text-muted font-mono">{issue.ruleCode}</span>
                        {issue.fieldName && (
                          <span className="text-text-secondary">field: {issue.fieldName}</span>
                        )}
                      </div>
                      <p className="text-text-secondary">{issue.message}</p>
                      {issue.rawValue !== null && (
                        <p className="text-text-muted mt-1">
                          Raw value: <code className="font-mono">{issue.rawValue}</code>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center gap-3 text-sm">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 rounded border border-white/10 text-text-secondary disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-text-muted text-xs">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </span>
          <button
            disabled={(page + 1) * PAGE_SIZE >= total}
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
