'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getLineage, replaceSourceFile } from '@/lib/tdr-api';
import type { LineageVersion } from '@/lib/tdr-api';

interface Props {
  logicalDatasetId: string;
  onClose?: () => void;
}

export function TdrLineagePanel({ logicalDatasetId, onClose }: Props) {
  const { accessToken } = useAuth();
  const [versions, setVersions] = useState<LineageVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [replacing, setReplacing] = useState<string | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replaceReason, setReplaceReason] = useState('');
  const [replaceError, setReplaceError] = useState<string | null>(null);
  const [replaceSuccess, setReplaceSuccess] = useState<string | null>(null);
  const [replaceLoading, setReplaceLoading] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getLineage(accessToken, logicalDatasetId);
      setVersions(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load lineage');
    } finally {
      setLoading(false);
    }
  }, [accessToken, logicalDatasetId]);

  useEffect(() => { void load(); }, [load]);

  async function handleReplace(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !replacing || !replaceFile) return;
    setReplaceLoading(true);
    setReplaceError(null);
    setReplaceSuccess(null);
    try {
      const result = await replaceSourceFile(accessToken, replacing, replaceFile, replaceReason);
      setReplaceSuccess(`Replacement uploaded. New version ${result.versionNumber} — batch ${result.batchId}`);
      setReplacing(null);
      setReplaceFile(null);
      setReplaceReason('');
      await load();
    } catch (e) {
      setReplaceError(e instanceof Error ? e.message : 'Replace failed');
    } finally {
      setReplaceLoading(false);
    }
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Version Lineage</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted font-mono">{logicalDatasetId}</span>
          {onClose && (
            <button onClick={onClose} className="text-text-muted hover:text-text-primary text-sm">
              ✕
            </button>
          )}
        </div>
      </div>

      {loading && <p className="text-text-muted text-sm">Loading lineage…</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && !error && versions.length === 0 && (
        <p className="text-text-muted text-sm">No versions found.</p>
      )}

      {!loading && versions.length > 0 && (
        <div className="space-y-2">
          {versions.map((v, i) => (
            <div
              key={v.id}
              className="flex items-start justify-between rounded-lg bg-surface-muted border border-border p-3 gap-4"
            >
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-brand/20 text-brand text-xs font-bold flex items-center justify-center">
                  v{v.versionNumber}
                </span>
                <div>
                  <p className="text-sm font-medium text-text-primary">{v.originalFilename}</p>
                  <p className="text-xs text-text-muted">
                    {new Date(v.uploadedAt).toLocaleString()} ·{' '}
                    {(Number(v.fileSizeBytes) / 1024).toFixed(1)} KB
                    {v.archivedAt && (
                      <span className="ml-2 text-amber-400">archived</span>
                    )}
                  </p>
                  {v.replacementReason && (
                    <p className="text-xs text-text-muted mt-0.5 italic">
                      Reason: {v.replacementReason}
                    </p>
                  )}
                </div>
              </div>
              {i === versions.length - 1 && (
                <button
                  onClick={() => setReplacing(v.id)}
                  className="shrink-0 text-xs px-3 py-1 rounded bg-brand/10 text-brand hover:bg-brand/20 transition-colors"
                >
                  Replace
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {replaceSuccess && (
        <p className="text-green-400 text-sm">{replaceSuccess}</p>
      )}

      {replacing && (
        <form onSubmit={handleReplace} className="space-y-3 border-t border-border pt-4">
          <p className="text-sm font-medium text-text-primary">Upload replacement file</p>
          <input
            type="file"
            accept=".csv,.xlsx"
            required
            onChange={(e) => setReplaceFile(e.target.files?.[0] ?? null)}
            className="block text-sm text-text-muted"
          />
          <input
            type="text"
            placeholder="Replacement reason (required)"
            value={replaceReason}
            onChange={(e) => setReplaceReason(e.target.value)}
            required
            className="w-full rounded bg-surface-muted border border-border px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand"
          />
          {replaceError && <p className="text-red-400 text-xs">{replaceError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={replaceLoading || !replaceFile || !replaceReason.trim()}
              className="px-4 py-2 rounded bg-brand text-white text-sm font-medium disabled:opacity-50"
            >
              {replaceLoading ? 'Uploading…' : 'Upload'}
            </button>
            <button
              type="button"
              onClick={() => { setReplacing(null); setReplaceFile(null); setReplaceReason(''); setReplaceError(null); }}
              className="px-4 py-2 rounded bg-surface-muted text-text-muted text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
