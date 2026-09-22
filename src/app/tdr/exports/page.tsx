'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  createExport,
  estimateExport,
  getExportStatus,
  downloadExport,
  listBatches,
  getBatch,
} from '@/lib/tdr-api';
import type { TdrBatch, TdrExportJob, CreateExportRequest } from '@/types/tdr';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-900/40 text-yellow-300',
  LEASED: 'bg-blue-900/40 text-blue-300',
  COMPLETED: 'bg-green-900/40 text-green-300',
  FAILED: 'bg-red-900/40 text-red-300',
};

const STATUS_DISPLAY: Record<string, string> = {
  PENDING: 'QUEUED',
  LEASED: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
};

function ExportJobRow({
  job,
  token,
  onRefresh,
}: {
  job: TdrExportJob;
  token: string;
  onRefresh: (updated: TdrExportJob) => void;
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadExport(token, job.id);
    } catch (err: any) {
      alert(err?.message ?? 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  // Continuous polling while job is active — interval fires every 3 s until terminal status.
  useEffect(() => {
    if (job.status !== 'PENDING' && job.status !== 'LEASED') return;
    const id = setInterval(async () => {
      try {
        const updated = await getExportStatus(token, job.id);
        onRefresh(updated);
      } catch {}
    }, 3000);
    return () => clearInterval(id);
  }, [job.status, job.id, token, onRefresh]);

  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
      <td className="px-4 py-2 font-mono text-xs text-text-muted">{job.id.slice(0, 8)}…</td>
      <td className="px-4 py-2">
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[job.status] ?? 'bg-gray-800 text-gray-400'}`}>
          {STATUS_DISPLAY[job.status] ?? job.status}
        </span>
      </td>
      <td className="px-4 py-2 text-xs text-text-secondary">
        {job.rowCount != null ? job.rowCount.toLocaleString() : '—'}
        {' / '}
        {job.rowLimit != null ? job.rowLimit.toLocaleString() : '—'} limit
      </td>
      <td className="px-4 py-2 text-xs text-text-muted">
        {new Date(job.createdAt).toLocaleString()}
      </td>
      <td className="px-4 py-2">
        {job.status === 'COMPLETED' && (
          job.expiresAt && new Date(job.expiresAt) < new Date() ? (
            <span className="text-xs text-gray-500" title="Export has expired">Expired / unavailable</span>
          ) : (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="text-accent-primary text-xs hover:underline disabled:opacity-50"
            >
              {downloading ? 'Downloading…' : 'Download CSV'}
            </button>
          )
        )}
        {job.status === 'FAILED' && (
          <span className="text-xs text-red-400" title={job.errorCode ?? undefined}>
            {job.errorCode ? `[${job.errorCode}] ` : ''}{job.errorMessage ?? 'Failed'}
          </span>
        )}
      </td>
    </tr>
  );
}

export default function TdrExportsPage() {
  const { accessToken } = useAuth();
  const searchParams = useSearchParams();
  const batchIdFromQuery = searchParams.get('batchId') ?? '';

  const [jobs, setJobs] = useState<TdrExportJob[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scope
  const [scope, setScope] = useState<'all' | 'batch'>(batchIdFromQuery ? 'batch' : 'all');
  const [selectedBatchId, setSelectedBatchId] = useState(batchIdFromQuery);
  const [batchSearch, setBatchSearch] = useState('');
  const [batches, setBatches] = useState<TdrBatch[]>([]);

  // Estimate for 'all' scope — auto-fetched in background, shown inline
  const [estimatedCount, setEstimatedCount] = useState<number | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);

  // Ref-based guard prevents duplicate job creation from rapid double-click.
  const submittingRef = useRef(false);

  // Load batch list on mount
  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    listBatches(accessToken, { pageSize: 100, lifecycle: 'ALL' })
      .then((res) => { if (!cancelled) setBatches(res.batches); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [accessToken]);

  // If a specific batch was preset via URL, ensure it appears in the selector
  useEffect(() => {
    if (!batchIdFromQuery || !accessToken) return;
    let cancelled = false;
    getBatch(accessToken, batchIdFromQuery)
      .then((b) => {
        if (!cancelled) {
          setBatches((prev) => (prev.find((x) => x.id === b.id) ? prev : [b, ...prev]));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [batchIdFromQuery, accessToken]);

  // Fetch estimate when scope is 'all'
  useEffect(() => {
    if (scope !== 'all' || !accessToken) return;
    let cancelled = false;
    setEstimatedCount(null);
    setEstimateLoading(true);
    estimateExport(accessToken, {})
      .then(({ count }) => { if (!cancelled) setEstimatedCount(count); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setEstimateLoading(false); });
    return () => { cancelled = true; };
  }, [scope, accessToken]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || submittingRef.current) return;

    if (scope === 'batch' && !selectedBatchId) {
      setError('Please select a batch to export');
      return;
    }

    submittingRef.current = true;
    setCreating(true);
    setError(null);
    try {
      const dto: CreateExportRequest = {};
      if (scope === 'batch' && selectedBatchId) {
        dto.batchId = selectedBatchId;
        const batch = batches.find((b) => b.id === selectedBatchId);
        if (batch?.tradeDirection) dto.tradeDirection = batch.tradeDirection;
      }
      const job = await createExport(accessToken, dto);
      setJobs((prev) => [job, ...prev]);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create export');
    } finally {
      setCreating(false);
      submittingRef.current = false;
    }
  };

  const handleRefresh = useCallback((updated: TdrExportJob) => {
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
  }, []);

  if (!accessToken) return null;

  const filteredBatches = batchSearch
    ? batches.filter((b) => {
        const name = (b.standardizedFilename ?? b.originalFilename ?? '').toLowerCase();
        return name.includes(batchSearch.toLowerCase());
      })
    : batches;

  const batchLabel = (b: TdrBatch) => {
    const name = b.standardizedFilename ?? b.originalFilename ?? b.id.slice(0, 8);
    const rows = b.acceptedRows > 0 ? ` · ${b.acceptedRows.toLocaleString()} rows` : '';
    return `${name} · ${b.tradeDirection}${rows}`;
  };

  const selectedBatch = batches.find((b) => b.id === selectedBatchId) ?? null;

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-xl font-semibold text-text-primary">Exports</h1>

      {/* Create export */}
      <form
        onSubmit={handleCreate}
        className="bg-surface-secondary border border-white/10 rounded-lg p-4 space-y-4"
      >
        <h2 className="text-sm font-semibold text-text-secondary">New Export</h2>
        {error && (
          <p className="text-xs text-red-300 bg-red-900/20 rounded px-3 py-2">{error}</p>
        )}

        {/* Scope selector */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
            <input
              type="radio"
              name="export-scope"
              value="all"
              checked={scope === 'all'}
              onChange={() => { setScope('all'); setSelectedBatchId(''); }}
              aria-label="All accepted records"
            />
            All accepted records
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
            <input
              type="radio"
              name="export-scope"
              value="batch"
              checked={scope === 'batch'}
              onChange={() => setScope('batch')}
              aria-label="Specific batch"
            />
            Specific batch
          </label>
        </div>

        {/* All-scope: inline estimate */}
        {scope === 'all' && (
          <p className="text-xs text-text-muted">
            {estimateLoading
              ? 'Counting export-eligible records…'
              : estimatedCount !== null
                ? `${estimatedCount.toLocaleString()} accepted records ready to export.`
                : 'Exports include all ACCEPTED, export-eligible records across all batches.'}
          </p>
        )}

        {/* Batch-scope: selector */}
        {scope === 'batch' && (
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-text-muted mb-1">Search batches</label>
              <input
                type="text"
                value={batchSearch}
                onChange={(e) => setBatchSearch(e.target.value)}
                placeholder="Filter by filename…"
                className="w-full px-3 py-1.5 text-sm bg-surface-primary border border-white/10 rounded text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Select batch</label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                data-testid="batch-select"
                className="w-full px-3 py-1.5 text-sm bg-surface-primary border border-white/10 rounded text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              >
                <option value="">— select a batch —</option>
                {filteredBatches.map((b) => (
                  <option key={b.id} value={b.id}>{batchLabel(b)}</option>
                ))}
              </select>
            </div>
            {selectedBatch && (
              <p className="text-xs text-text-muted">
                Trade direction:{' '}
                <span className="text-text-secondary">{selectedBatch.tradeDirection}</span>
                {' '}— set automatically from the selected batch
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-text-muted">
          Exports include only ACCEPTED, export-eligible records. Values are not aggregated.
        </p>
        <button
          type="submit"
          disabled={creating || (scope === 'batch' && !selectedBatchId)}
          className="px-4 py-2 text-sm bg-accent-primary text-white rounded hover:opacity-90 disabled:opacity-50"
        >
          {creating ? 'Creating…' : 'Create Export'}
        </button>
      </form>

      {/* Jobs table */}
      {jobs.length > 0 && (
        <div className="bg-surface-secondary border border-white/10 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr className="text-left text-xs text-text-muted uppercase tracking-wider">
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Rows</th>
                <th className="px-4 py-2">Created</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <ExportJobRow key={j.id} job={j} token={accessToken} onRefresh={handleRefresh} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
