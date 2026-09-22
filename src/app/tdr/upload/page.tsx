'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { uploadFile } from '@/lib/tdr-api';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

function previewFilename(
  direction: 'IMPORT' | 'EXPORT',
  year: number,
  month: number | null,
  ext: string,
): string {
  const type = direction === 'IMPORT' ? 'IMP' : 'EXP';
  const monthPart = month != null ? `_${String(month).padStart(2, '0')}` : '';
  return `TDR_V1_${type}_${year}${monthPart}_###${ext || '.csv'}`;
}

interface ParsedTdrFilename {
  direction: 'IMPORT' | 'EXPORT';
  year: number;
  month: number | null;
}

function parseTdrFilename(filename: string): ParsedTdrFilename | null {
  // Matches: TDR_V1_(IMP|EXP)_YYYY[_MM]_...
  const match = /^TDR_V1_(IMP|EXP)_(\d{4})(?:_(\d{2}))?_/i.exec(filename);
  if (!match) return null;
  return {
    direction: match[1].toUpperCase() === 'EXP' ? 'EXPORT' : 'IMPORT',
    year: parseInt(match[2], 10),
    month: match[3] != null ? parseInt(match[3], 10) : null,
  };
}

function getFilenamePeriodConflict(
  filename: string,
  direction: 'IMPORT' | 'EXPORT',
  year: number,
  month: number | null,
): string | null {
  const parsed = parseTdrFilename(filename);
  if (!parsed) return null;

  const conflicts: string[] = [];
  if (parsed.direction !== direction) {
    conflicts.push(
      `filename says ${parsed.direction === 'IMPORT' ? 'IMP' : 'EXP'} but direction is set to ${direction}`,
    );
  }
  if (parsed.year !== year) {
    conflicts.push(`filename year ${parsed.year} ≠ selected year ${year}`);
  }
  if (parsed.month != null && month != null && parsed.month !== month) {
    conflicts.push(`filename month ${String(parsed.month).padStart(2, '0')} ≠ selected month ${String(month).padStart(2, '0')}`);
  }
  return conflicts.length > 0 ? `Filename conflict: ${conflicts.join('; ')}` : null;
}

export default function TdrUploadPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [direction, setDirection] = useState<'IMPORT' | 'EXPORT'>('IMPORT');
  const [dataPeriodYear, setDataPeriodYear] = useState<number>(CURRENT_YEAR);
  const [dataPeriodMonth, setDataPeriodMonth] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ext = file ? file.name.slice(file.name.lastIndexOf('.')) : '.csv';
  const filenamePreview = previewFilename(direction, dataPeriodYear, dataPeriodMonth, ext);
  const periodConflict = file
    ? getFilenamePeriodConflict(file.name, direction, dataPeriodYear, dataPeriodMonth)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !accessToken) return;
    if (periodConflict) return;

    setUploading(true);
    setError(null);

    try {
      const result = await uploadFile(
        accessToken,
        file,
        direction,
        'TDR_V1',
        dataPeriodYear,
        dataPeriodMonth ?? undefined,
      );
      if (!result.batchId) {
        throw new Error('Upload succeeded but server did not return a batch ID');
      }
      router.push(`/tdr/batches/${result.batchId}`);
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
        {periodConflict && (
          <p className="text-sm text-amber-300 bg-amber-900/20 rounded px-3 py-2">{periodConflict}</p>
        )}

        {/* File picker */}
        <div>
          <label className="block text-sm text-text-secondary mb-1">
            File (XLSX, CSV, TSV, JSON, JSONL)
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border border-dashed border-white/20 rounded-lg p-6 text-center cursor-pointer hover:border-white/40 transition-colors"
          >
            {file ? (
              <div>
                <p className="text-sm text-text-primary font-medium">{file.name}</p>
                <p className="text-xs text-text-muted mt-1">Original filename — kept as-is in the record</p>
              </div>
            ) : (
              <p className="text-sm text-text-muted">
                Click to select a file
                <span className="block text-xs mt-1">XLSX, CSV, TSV, JSON or JSONL — max 500 MB</span>
              </p>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.tsv,.json,.jsonl"
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

        {/* Data period */}
        <div>
          <label className="block text-sm text-text-secondary mb-1">Data Period</label>
          <div className="flex gap-2">
            <select
              value={dataPeriodYear}
              onChange={(e) => setDataPeriodYear(Number(e.target.value))}
              className="flex-1 px-3 py-2 text-sm bg-surface-primary border border-white/10 rounded text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={dataPeriodMonth ?? ''}
              onChange={(e) => setDataPeriodMonth(e.target.value ? Number(e.target.value) : null)}
              className="flex-1 px-3 py-2 text-sm bg-surface-primary border border-white/10 rounded text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            >
              <option value="">All months</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Generated filename preview */}
        <div className="rounded bg-surface-primary border border-white/10 px-3 py-2 space-y-1">
          <p className="text-xs text-text-muted">Generated filename</p>
          <p className="text-sm font-mono text-accent-primary">{filenamePreview}</p>
          <p className="text-xs text-text-muted">
            Sequence number assigned at upload. Schema: <span className="font-mono">TDR_V1</span>
          </p>
        </div>

        <button
          type="submit"
          disabled={uploading || !file || !!periodConflict}
          className="w-full py-2 text-sm font-medium bg-accent-primary text-white rounded hover:opacity-90 disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Upload & Process'}
        </button>
      </form>
    </div>
  );
}
