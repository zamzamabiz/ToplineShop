'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { uploadFile } from '@/lib/tdr-api';

export default function TdrUploadPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [direction, setDirection] = useState<'IMPORT' | 'EXPORT'>('IMPORT');
  const [mappingProfileId, setMappingProfileId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !accessToken || !mappingProfileId.trim()) return;

    setUploading(true);
    setError(null);

    try {
      const batch = await uploadFile(accessToken, file, direction, mappingProfileId.trim());
      router.push(`/tdr/batches/${batch.id}`);
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-semibold text-text-primary">Upload Trade Data</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="text-sm text-red-300 bg-red-900/20 rounded px-3 py-2">{error}</p>
        )}

        {/* File picker */}
        <div>
          <label className="block text-sm text-text-secondary mb-1">File (CSV or XLSX)</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border border-dashed border-white/20 rounded-lg p-6 text-center cursor-pointer hover:border-white/40 transition-colors"
          >
            {file ? (
              <p className="text-sm text-text-primary font-medium">{file.name}</p>
            ) : (
              <p className="text-sm text-text-muted">
                Click to select a file
                <span className="block text-xs mt-1">CSV or XLSX, max 50 MB</span>
              </p>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Direction */}
        <div>
          <label className="block text-sm text-text-secondary mb-1">Trade Direction</label>
          <div className="flex gap-3">
            {(['IMPORT', 'EXPORT'] as const).map((d) => (
              <label key={d} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value={d}
                  checked={direction === d}
                  onChange={() => setDirection(d)}
                  className="accent-accent-primary"
                />
                <span className="text-sm text-text-primary">{d}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Mapping profile */}
        <div>
          <label className="block text-sm text-text-secondary mb-1">Mapping Profile ID</label>
          <input
            type="text"
            value={mappingProfileId}
            onChange={(e) => setMappingProfileId(e.target.value)}
            placeholder="e.g. default-v1"
            required
            className="w-full px-3 py-2 text-sm bg-surface-primary border border-white/10 rounded text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary"
          />
        </div>

        <button
          type="submit"
          disabled={uploading || !file || !mappingProfileId.trim()}
          className="w-full py-2 text-sm font-medium bg-accent-primary text-white rounded hover:opacity-90 disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Upload & Process'}
        </button>
      </form>
    </div>
  );
}
