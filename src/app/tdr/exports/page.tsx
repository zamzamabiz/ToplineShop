'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createExport, getExportStatus, downloadExport } from '@/lib/tdr-api';
import type { TdrExportJob } from '@/types/tdr';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-900/40 text-yellow-300',
  PROCESSING: 'bg-blue-900/40 text-blue-300',
  COMPLETED: 'bg-green-900/40 text-green-300',
  FAILED: 'bg-red-900/40 text-red-300',
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
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  useEffect(() => {
    if (job.status === 'PENDING' || job.status === 'PROCESSING') {
      pollRef.current = setTimeout(async () => {
        try {
          const updated = await getExportStatus(token, job.id);
          onRefresh(updated);
        } catch {}
      }, 3000);
    }
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [job.status, job.id, token, onRefresh]);

  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
      <td className="px-4 py-2 font-mono text-xs text-text-muted">{job.id.slice(0, 8)}…</td>
      <td className="px-4 py-2">
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[job.status] ?? 'bg-gray-800 text-gray-400'}`}>
          {job.status}
        </span>
      </td>
      <td className="px-4 py-2 text-xs text-text-secondary">
        {job.rowCount !== null ? job.rowCount.toLocaleString() : '—'}
        {' / '}
        {job.rowLimit.toLocaleString()} limit
      </td>
      <td className="px-4 py-2 text-xs text-text-muted">
        {new Date(job.createdAt).toLocaleString()}
      </td>
      <td className="px-4 py-2">
        {job.status === 'COMPLETED' && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="text-accent-primary text-xs hover:underline disabled:opacity-50"
          >
            {downloading ? 'Downloading…' : 'Download CSV'}
          </button>
        )}
        {job.status === 'FAILED' && (
          <span className="text-xs text-red-400">{job.errorMessage ?? 'Failed'}</span>
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
  const [batchId, setBatchId] = useState(batchIdFromQuery);
  const [rowLimit, setRowLimit] = useState('100000');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setCreating(true);
    setError(null);
    try {
      const job = await createExport(accessToken, {
        ...(batchId ? { batchId } : {}),
        rowLimit: Math.min(parseInt(rowLimit, 10) || 100_000, 100_000),
      });
      setJobs((prev) => [job, ...prev]);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create export');
    } finally {
      setCreating(false);
    }
  };

  const handleRefresh = useCallback((updated: TdrExportJob) => {
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
  }, []);

  if (!accessToken) return null;

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
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs text-text-muted mb-1">Batch ID (optional)</label>
            <input
              type="text"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              placeholder="Leave blank for all accepted records"
              className="w-full px-3 py-1.5 text-sm bg-surface-primary border border-white/10 rounded text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>
          <div className="w-36">
            <label className="block text-xs text-text-muted mb-1">Row Limit (max 100k)</label>
            <input
              type="number"
              value={rowLimit}
              onChange={(e) => setRowLimit(e.target.value)}
              min={1}
              max={100_000}
              className="w-full px-3 py-1.5 text-sm bg-surface-primary border border-white/10 rounded text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>
        </div>
        <p className="text-xs text-text-muted">
          Exports include only ACCEPTED, export-eligible records. Values are not aggregated.
        </p>
        <button
          type="submit"
          disabled={creating}
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
