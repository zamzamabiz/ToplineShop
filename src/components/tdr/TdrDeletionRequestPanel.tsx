'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  listDeletionRequests,
  createDeletionRequest,
  approveDeletionRequest,
  rejectDeletionRequest,
  cancelDeletionRequest,
} from '@/lib/tdr-api';
import type { TdrDeletionRequest } from '@/lib/tdr-api';

const STATUS_COLORS: Record<TdrDeletionRequest['status'], string> = {
  PENDING: 'bg-yellow-900/40 text-yellow-300',
  APPROVED: 'bg-green-900/40 text-green-300',
  REJECTED: 'bg-red-900/40 text-red-300',
  CANCELLED: 'bg-gray-800 text-gray-400',
};

interface Props {
  sourceFileId?: string;
}

export function TdrDeletionRequestPanel({ sourceFileId }: Props) {
  const { accessToken } = useAuth();
  const [requests, setRequests] = useState<TdrDeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createReason, setCreateReason] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewTarget, setReviewTarget] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('PENDING');

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listDeletionRequests(accessToken, statusFilter || undefined);
      setRequests(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [accessToken, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !sourceFileId) return;
    setCreateLoading(true);
    setCreateError(null);
    try {
      await createDeletionRequest(accessToken, sourceFileId, createReason);
      setShowCreate(false);
      setCreateReason('');
      await load();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleAction(id: string, action: 'approve' | 'reject' | 'cancel') {
    if (!accessToken) return;
    setActionLoading(id);
    setActionError(null);
    try {
      if (action === 'approve') await approveDeletionRequest(accessToken, id, reviewNote || undefined);
      else if (action === 'reject') await rejectDeletionRequest(accessToken, id, reviewNote || undefined);
      else await cancelDeletionRequest(accessToken, id);
      setReviewTarget(null);
      setReviewNote('');
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Deletion Requests</h2>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded bg-surface-muted border border-border px-2 py-1 text-xs text-text-primary"
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          {sourceFileId && (
            <button
              onClick={() => setShowCreate(true)}
              className="text-xs px-3 py-1 rounded bg-brand/10 text-brand hover:bg-brand/20 transition-colors"
            >
              + Request Deletion
            </button>
          )}
        </div>
      </div>

      {showCreate && sourceFileId && (
        <form onSubmit={handleCreate} className="space-y-3 border border-border rounded-lg p-4 bg-surface-muted">
          <p className="text-sm font-medium text-text-primary">New deletion request</p>
          <textarea
            placeholder="Reason for deletion (required)"
            value={createReason}
            onChange={(e) => setCreateReason(e.target.value)}
            required
            rows={3}
            className="w-full rounded bg-surface border border-border px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand resize-none"
          />
          {createError && <p className="text-red-400 text-xs">{createError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createLoading || !createReason.trim()}
              className="px-4 py-2 rounded bg-brand text-white text-sm font-medium disabled:opacity-50"
            >
              {createLoading ? 'Submitting…' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={() => { setShowCreate(false); setCreateReason(''); setCreateError(null); }}
              className="px-4 py-2 rounded bg-surface-muted text-text-muted text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && <p className="text-text-muted text-sm">Loading…</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {actionError && <p className="text-red-400 text-sm">{actionError}</p>}

      {!loading && requests.length === 0 && (
        <p className="text-text-muted text-sm">No deletion requests.</p>
      )}

      <div className="space-y-2">
        {requests.map((req) => (
          <div key={req.id} className="rounded-lg bg-surface-muted border border-border p-3 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-mono text-text-muted">File: {req.sourceFileId}</p>
                <p className="text-sm text-text-primary mt-0.5">{req.reason}</p>
                <p className="text-xs text-text-muted mt-1">
                  {new Date(req.requestedAt).toLocaleString()}
                  {req.reviewNote && <span className="ml-2 italic">Note: {req.reviewNote}</span>}
                </p>
              </div>
              <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[req.status]}`}>
                {req.status}
              </span>
            </div>
            {req.status === 'PENDING' && (
              <div className="flex gap-2">
                {reviewTarget?.id === req.id ? (
                  <div className="flex gap-2 items-center flex-wrap">
                    <input
                      type="text"
                      placeholder="Review note (optional)"
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      className="rounded bg-surface border border-border px-2 py-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                    <button
                      onClick={() => void handleAction(req.id, reviewTarget.action)}
                      disabled={actionLoading === req.id}
                      className="text-xs px-3 py-1 rounded bg-brand text-white disabled:opacity-50"
                    >
                      {reviewTarget.action === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
                    </button>
                    <button
                      onClick={() => { setReviewTarget(null); setReviewNote(''); }}
                      className="text-xs px-3 py-1 rounded bg-surface-muted text-text-muted"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setReviewTarget({ id: req.id, action: 'approve' })}
                      className="text-xs px-3 py-1 rounded bg-green-900/40 text-green-300 hover:bg-green-900/60"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setReviewTarget({ id: req.id, action: 'reject' })}
                      className="text-xs px-3 py-1 rounded bg-red-900/40 text-red-300 hover:bg-red-900/60"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => void handleAction(req.id, 'cancel')}
                      disabled={actionLoading === req.id}
                      className="text-xs px-3 py-1 rounded bg-surface-muted text-text-muted hover:text-text-primary disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
