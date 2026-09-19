'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getBatch, getBatchProgress, cancelBatch } from '@/lib/tdr-api';
import type { TdrBatch, TdrBatchProgress } from '@/types/tdr';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-900/40 text-yellow-300',
  PROCESSING: 'bg-blue-900/40 text-blue-300',
  READY: 'bg-green-900/40 text-green-300',
  PARTIAL: 'bg-orange-900/40 text-orange-300',
  FAILED: 'bg-red-900/40 text-red-300',
  CANCELLED: 'bg-gray-800 text-gray-400',
  QUALITY_PENDING: 'bg-purple-900/40 text-purple-300',
  REVIEW_REQUIRED: 'bg-amber-900/40 text-amber-300',
};

const ACTIVE_STATUSES = new Set(['PENDING', 'PROCESSING', 'QUALITY_PENDING']);

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-white/10 rounded-full h-2">
      <div
        className="bg-accent-primary rounded-full h-2 transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export default function TdrBatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = typeof params.id === 'string' ? params.id : params.id?.[0] ?? '';
  const { accessToken } = useAuth();

  const [batch, setBatch] = useState<TdrBatch | null>(null);
  const [progress, setProgress] = useState<TdrBatchProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = (ctrl: AbortController) => {
    if (!accessToken || !batchId) return;
    Promise.all([
      getBatch(accessToken, batchId, ctrl.signal),
      getBatchProgress(accessToken, batchId, ctrl.signal),
    ])
      .then(([b, p]) => {
        setBatch(b);
        setProgress(p);
        if (ACTIVE_STATUSES.has(b.status)) {
          pollRef.current = setTimeout(() => load(ctrl), 3000);
        }
      })
      .catch((e) => { if (e?.name !== 'AbortError') setError(e?.message ?? 'Failed to load'); });
  };

  useEffect(() => {
    if (!accessToken) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    load(ctrl);
    return () => {
      ctrl.abort();
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [accessToken, batchId]);

  const handleCancel = async () => {
    if (!accessToken || !batchId) return;
    setCancelling(true);
    try {
      const updated = await cancelBatch(accessToken, batchId);
      setBatch(updated);
    } catch (e: any) {
      setError(e?.message ?? 'Cancel failed');
    } finally {
      setCancelling(false);
    }
  };

  if (error)
    return <div className="text-sm text-red-300 bg-red-900/20 rounded px-4 py-3">{error}</div>;

  if (!batch)
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-surface-secondary rounded w-64" />
        <div className="h-24 bg-surface-secondary rounded" />
      </div>
    );

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/tdr/batches" className="text-xs text-text-muted hover:text-text-secondary">
          ← Batches
        </Link>
        <h1 className="text-lg font-semibold text-text-primary truncate">
          {batch.originalFilename}
        </h1>
        <span
          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[batch.status] ?? 'bg-gray-800 text-gray-400'}`}
        >
          {batch.status}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="bg-surface-secondary border border-white/10 rounded-lg p-3">
          <p className="text-xs text-text-muted mb-0.5">Direction</p>
          <p className="font-medium text-text-primary">{batch.tradeDirection}</p>
        </div>
        <div className="bg-surface-secondary border border-white/10 rounded-lg p-3">
          <p className="text-xs text-text-muted mb-0.5">Mapping</p>
          <p className="font-medium text-text-primary text-xs truncate">{batch.mappingProfileId}</p>
        </div>
        <div className="bg-surface-secondary border border-white/10 rounded-lg p-3">
          <p className="text-xs text-text-muted mb-0.5">Uploaded</p>
          <p className="font-medium text-text-primary text-xs">
            {new Date(batch.uploadedAt ?? batch.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="bg-surface-secondary border border-white/10 rounded-lg p-3">
          <p className="text-xs text-text-muted mb-0.5">Batch ID</p>
          <p className="font-mono text-xs text-text-muted truncate">{batch.id}</p>
        </div>
      </div>

      {progress && (
        <div className="bg-surface-secondary border border-white/10 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Progress</span>
            <span className="text-text-primary font-medium">{progress.percentComplete}%</span>
          </div>
          <ProgressBar value={progress.percentComplete} />
          <div className="grid grid-cols-3 gap-4 pt-1">
            <div>
              <p className="text-xs text-text-muted">Accepted</p>
              <p className="text-text-primary font-medium">{progress.acceptedRows.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Quarantined</p>
              <p className="text-text-primary font-medium">{progress.quarantinedRows.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Rejected</p>
              <p className="text-text-primary font-medium">{progress.rejectedRows.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        {batch.status === 'REVIEW_REQUIRED' && (
          <Link
            href={`/tdr/quarantine?batchId=${batch.id}`}
            className="px-4 py-2 text-sm bg-amber-600 text-white rounded hover:opacity-90"
          >
            Review Quarantine
          </Link>
        )}
        {(batch.status === 'READY' || batch.status === 'PARTIAL') && (
          <Link
            href={`/tdr/exports?batchId=${batch.id}`}
            className="px-4 py-2 text-sm bg-accent-primary text-white rounded hover:opacity-90"
          >
            Export Records
          </Link>
        )}
        {ACTIVE_STATUSES.has(batch.status) && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="px-4 py-2 text-sm border border-red-600 text-red-400 rounded hover:bg-red-900/20 disabled:opacity-50"
          >
            {cancelling ? 'Cancelling…' : 'Cancel Batch'}
          </button>
        )}
      </div>
    </div>
  );
}
