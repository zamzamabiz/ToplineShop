'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, CheckCircle2, Clock, Edit3 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getQualityDetail, applyCorrection, reEvaluateRecord } from '@/lib/tdr-api';
import type {
  CorrectionResult,
  QualityDetailRecord,
  ReEvaluateResult,
  TradeDirection,
} from '@/types/tdr';

// ── Correctable field metadata ────────────────────────────────────────────────

const CORRECTABLE_FIELDS = [
  'tradeDate',
  'hsCodeNormalized',
  'productDescriptionNormalized',
  'localPartyTaxIdNormalized',
  'localPartyNameNormalized',
  'foreignPartyNameNormalized',
  'foreignPartyCountryCode',
  'originPortNormalized',
  'quantityNormalized',
  'quantityUnitCode',
  'unitPriceNormalized',
  'currencyCode',
] as const;

type CorrectableField = (typeof CORRECTABLE_FIELDS)[number];

const FIELD_LABELS: Record<CorrectableField, string> = {
  tradeDate: 'Trade Date',
  hsCodeNormalized: 'HS Code',
  productDescriptionNormalized: 'Product Description',
  localPartyTaxIdNormalized: 'Local Party Tax ID',
  localPartyNameNormalized: 'Local Party Name',
  foreignPartyNameNormalized: 'Foreign Party Name',
  foreignPartyCountryCode: 'Foreign Country Code',
  originPortNormalized: 'Origin Port',
  quantityNormalized: 'Quantity',
  quantityUnitCode: 'Unit of Measure',
  unitPriceNormalized: 'Unit Price',
  currencyCode: 'Currency Code',
};

interface FieldPair {
  label: string;
  rawField: keyof QualityDetailRecord | null;
  normField: keyof QualityDetailRecord;
  correctable: CorrectableField;
}

const FIELD_PAIRS: FieldPair[] = [
  { label: 'HS Code',             rawField: 'hsCodeRaw',             normField: 'hsCodeNormalized',             correctable: 'hsCodeNormalized' },
  { label: 'Product Description', rawField: 'productDescriptionRaw', normField: 'productDescriptionNormalized', correctable: 'productDescriptionNormalized' },
  { label: 'Quantity',            rawField: 'quantityRaw',           normField: 'quantityNormalized',           correctable: 'quantityNormalized' },
  { label: 'Unit of Measure',     rawField: 'quantityUnitRaw',       normField: 'quantityUnitCode',             correctable: 'quantityUnitCode' },
  { label: 'Unit Price',          rawField: 'unitPriceRaw',          normField: 'unitPriceNormalized',          correctable: 'unitPriceNormalized' },
  { label: 'Currency',            rawField: 'currencyRaw',           normField: 'currencyCode',                 correctable: 'currencyCode' },
  { label: 'Local Party Name',    rawField: 'localPartyNameRaw',     normField: 'localPartyNameNormalized',     correctable: 'localPartyNameNormalized' },
  { label: 'Local Party Tax ID',  rawField: 'localPartyTaxIdRaw',    normField: 'localPartyTaxIdNormalized',    correctable: 'localPartyTaxIdNormalized' },
  { label: 'Foreign Party Name',  rawField: 'foreignPartyNameRaw',   normField: 'foreignPartyNameNormalized',   correctable: 'foreignPartyNameNormalized' },
  { label: 'Foreign Country',     rawField: 'foreignPartyCountryRaw',normField: 'foreignPartyCountryCode',      correctable: 'foreignPartyCountryCode' },
  { label: 'Origin Port',         rawField: 'originPortRaw',         normField: 'originPortNormalized',         correctable: 'originPortNormalized' },
  { label: 'Trade Date',          rawField: null,                    normField: 'tradeDate',                    correctable: 'tradeDate' },
];

// ── Role check ────────────────────────────────────────────────────────────────

function canCorrectRecord(roles: string[], direction: TradeDirection): boolean {
  if (roles.includes('SUPER_ADMIN') || roles.includes('TENANT_ADMIN')) return true;
  if (direction === 'IMPORT' && roles.includes('IMPORT_MANAGER')) return true;
  if (direction === 'EXPORT' && roles.includes('EXPORT_MANAGER')) return true;
  return false;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fieldStr(record: QualityDetailRecord, key: keyof QualityDetailRecord): string {
  const v = record[key];
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return '';
  return String(v);
}

const DISPOSITION_COLORS: Record<string, string> = {
  ACCEPTED: 'bg-green-900/40 text-green-300',
  QUARANTINED: 'bg-amber-900/40 text-amber-300',
  REJECTED: 'bg-red-900/40 text-red-300',
  PENDING_QUALITY: 'bg-purple-900/40 text-purple-300',
};

const SEVERITY_COLORS: Record<string, string> = {
  BLOCKING: 'bg-red-900/40 text-red-300',
  ERROR: 'bg-orange-900/40 text-orange-300',
  WARNING: 'bg-yellow-900/40 text-yellow-300',
};

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  batchId: string;
  recordId: string;
  onClose: () => void;
  onCorrected?: () => void;
}

export function TdrQualityDetailPanel({ batchId, recordId, onClose, onCorrected }: Props) {
  const { accessToken, user } = useAuth();

  const [loading, setLoading]       = useState(true);
  const [detail, setDetail]         = useState<QualityDetailRecord | null>(null);
  const [loadError, setLoadError]   = useState<string | null>(null);

  const [corrField, setCorrField]   = useState<string>('');
  const [corrValue, setCorrValue]   = useState('');
  const [corrNote, setCorrNote]     = useState('');
  const [confirmStep, setConfirmStep] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [corrResult, setCorrResult] = useState<CorrectionResult | null>(null);
  const [reEvalResult, setReEvalResult] = useState<ReEvaluateResult | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const loadDetail = useCallback(async () => {
    if (!accessToken) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getQualityDetail(accessToken, batchId, recordId, ctrl.signal);
      setDetail(data);
      // Pre-select first field with an OPEN issue that is correctable
      const openField = data.validationIssues.find(i => i.status === 'OPEN')?.fieldName;
      const preField = (CORRECTABLE_FIELDS as readonly string[]).includes(openField ?? '')
        ? (openField as CorrectableField)
        : '';
      if (preField) {
        setCorrField(preField);
        setCorrValue(fieldStr(data, preField as keyof QualityDetailRecord));
      }
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string };
      if (err?.name !== 'AbortError') setLoadError(err?.message ?? 'Failed to load record');
    } finally {
      setLoading(false);
    }
  }, [accessToken, batchId, recordId]);

  useEffect(() => {
    loadDetail();
    return () => abortRef.current?.abort();
  }, [loadDetail]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleFieldChange(field: string) {
    setCorrField(field);
    setSubmitError(null);
    if (detail && field) {
      setCorrValue(fieldStr(detail, field as keyof QualityDetailRecord));
    } else {
      setCorrValue('');
    }
  }

  async function handleSubmitCorrection() {
    if (!accessToken || !corrField || corrValue.trim() === '' || !detail) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await applyCorrection(accessToken, batchId, recordId, {
        fieldName: corrField,
        correctedValue: corrValue.trim(),
        note: corrNote.trim() || undefined,
      });
      setCorrResult(result);
      try {
        const reEval = await reEvaluateRecord(accessToken, batchId, recordId);
        setReEvalResult(reEval);
      } catch {
        // re-evaluate failure is non-fatal for UI — correction was applied
      }
      onCorrected?.();
      setConfirmStep(false);
      await loadDetail();
    } catch (e: unknown) {
      const err = e as { message?: string };
      setSubmitError(err?.message ?? 'Correction failed');
    } finally {
      setSubmitting(false);
    }
  }

  const roles       = user?.roles ?? [];
  const meta        = detail?.valueTreatmentMeta ?? {};
  const canCorrect  = detail ? canCorrectRecord(roles, detail.tradeDirection) : false;
  const isDuplicate = corrField ? meta[corrField] === 'CORRECTED' : false;
  const openIssues  = detail?.validationIssues.filter(i => i.status === 'OPEN') ?? [];
  const reviewedIssues = detail?.validationIssues.filter(i => i.status === 'REVIEWED') ?? [];

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-4xl my-auto rounded-xl shadow-2xl"
        style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--text-primary)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tdr-qd-title"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-white/10">
          <div>
            <h2 id="tdr-qd-title" className="text-sm font-semibold text-text-primary">
              Quarantine Review
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Batch {batchId.slice(0, 8)}… · Record {recordId.slice(0, 8)}…
            </p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close quality detail panel"
            className="rounded-md p-1 text-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {loading && (
            <div className="space-y-3 animate-pulse" data-testid="quality-detail-loading">
              <div className="h-8 bg-surface-secondary rounded w-48" />
              <div className="h-32 bg-surface-secondary rounded" />
            </div>
          )}

          {loadError && (
            <div className="text-sm text-red-300 bg-red-900/20 rounded px-4 py-3" role="alert">
              {loadError}
            </div>
          )}

          {!loading && detail && (
            <>
              {/* Record identity */}
              <div className="flex items-center gap-3 flex-wrap" data-testid="record-identity">
                <span className="text-sm text-text-secondary">Row {detail.sourceRowNumber}</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${DISPOSITION_COLORS[detail.rowDisposition] ?? 'bg-gray-800 text-gray-400'}`}
                  data-testid="disposition-badge"
                >
                  {detail.rowDisposition}
                </span>
                {detail.exportEligible && (
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-900/30 text-green-400">
                    Export Eligible
                  </span>
                )}
                <span className="text-xs text-text-muted">{detail.tradeDirection}</span>
              </div>

              {/* Correction result banner */}
              {corrResult && (
                <div
                  className="rounded-lg border border-green-700/40 bg-green-900/20 px-4 py-3 text-sm"
                  data-testid="correction-result"
                >
                  <div className="flex items-center gap-2 text-green-300 font-medium mb-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Correction applied
                  </div>
                  <p className="text-xs text-green-200/80">
                    Field: <code className="font-mono">{corrResult.fieldName}</code>
                    {reEvalResult && (
                      <> · New disposition: <strong data-testid="new-disposition">{reEvalResult.rowDisposition}</strong> · Remaining issues: {reEvalResult.newIssueCount}</>
                    )}
                    {' '}· Review ID: <code className="font-mono">{corrResult.reviewId.slice(0, 8)}…</code>
                  </p>
                </div>
              )}

              {/* Open validation issues */}
              {openIssues.length > 0 && (
                <div data-testid="open-issues">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                    Open Issues ({openIssues.length})
                  </h3>
                  <div className="space-y-1.5">
                    {openIssues.map(issue => (
                      <div
                        key={issue.id}
                        className="rounded border border-amber-700/30 bg-amber-900/10 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${SEVERITY_COLORS[issue.severity] ?? 'bg-gray-800 text-gray-400'}`}>
                            {issue.severity}
                          </span>
                          <code className="font-mono text-text-muted">{issue.fieldName}</code>
                          <span className="text-text-muted">·</span>
                          <span className="text-text-muted">{issue.ruleCode}</span>
                        </div>
                        <p className="text-text-secondary pl-5">{issue.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {openIssues.length === 0 && (
                <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/10 border border-green-700/30 rounded px-3 py-2">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  No open issues
                </div>
              )}

              {/* Field values: SOURCE / NORMALIZED / TREATMENT */}
              <div data-testid="field-values-table">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                  Field Values
                </h3>
                <div className="overflow-x-auto rounded border border-white/10">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-surface-secondary">
                        <th className="text-left px-3 py-2 text-text-muted font-medium">Field</th>
                        <th className="text-left px-3 py-2 text-text-muted font-medium">Source Value</th>
                        <th className="text-left px-3 py-2 text-text-muted font-medium">Normalized Value</th>
                        <th className="text-left px-3 py-2 text-text-muted font-medium">Treatment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {FIELD_PAIRS.map(pair => {
                        const rawVal  = pair.rawField ? fieldStr(detail, pair.rawField) || '—' : '—';
                        const normVal = fieldStr(detail, pair.normField) || '—';
                        const treatment = meta[pair.correctable] ?? '';
                        const isCorrected = treatment === 'CORRECTED';
                        const hasIssue = openIssues.some(i =>
                          i.fieldName === pair.rawField ||
                          i.fieldName === pair.normField ||
                          i.fieldName === pair.correctable,
                        );
                        return (
                          <tr key={pair.correctable} className={hasIssue ? 'bg-amber-900/5' : ''}>
                            <td className="px-3 py-2 text-text-secondary font-medium">{pair.label}</td>
                            <td className="px-3 py-2 text-text-muted font-mono" data-testid={`src-${pair.correctable}`}>{rawVal}</td>
                            <td className="px-3 py-2 text-text-primary font-mono" data-testid={`norm-${pair.correctable}`}>
                              {normVal}
                              {isCorrected && (
                                <span
                                  className="ml-1.5 px-1.5 py-0.5 rounded text-xs bg-blue-900/40 text-blue-300"
                                  data-testid={`corrected-badge-${pair.correctable}`}
                                >
                                  CORRECTED
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-xs">
                              {treatment ? (
                                <span className={isCorrected ? 'text-blue-300' : 'text-text-muted'}>
                                  {treatment}
                                </span>
                              ) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Correction history */}
              {detail.quarantineReviews.length > 0 && (
                <div data-testid="correction-history">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                    Correction History ({detail.quarantineReviews.length})
                  </h3>
                  <div className="space-y-1.5">
                    {detail.quarantineReviews.map(rev => (
                      <div key={rev.id} className="rounded border border-white/10 bg-surface-secondary px-3 py-2 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Clock className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
                          <code className="font-mono text-text-muted">{rev.id.slice(0, 8)}…</code>
                          <span className="text-text-secondary">{rev.action}</span>
                          {rev.correctionFieldName && (
                            <><span className="text-text-muted">·</span><code className="font-mono text-text-secondary">{rev.correctionFieldName}</code></>
                          )}
                          <span className="text-text-muted">{new Date(rev.appliedAt).toLocaleString()}</span>
                        </div>
                        {rev.correctionNote && (
                          <p className="mt-1 pl-5 text-text-muted">{rev.correctionNote}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviewed issues (collapsed) */}
              {reviewedIssues.length > 0 && (
                <details>
                  <summary className="text-xs text-text-muted cursor-pointer select-none">
                    {reviewedIssues.length} reviewed issue{reviewedIssues.length !== 1 ? 's' : ''} (historical)
                  </summary>
                  <div className="mt-2 space-y-1.5 pl-3">
                    {reviewedIssues.map(issue => (
                      <div key={issue.id} className="text-xs text-text-muted border-l-2 border-white/10 pl-2">
                        <code className="font-mono">{issue.fieldName}</code> · {issue.ruleCode} · {issue.message}
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* No-rights notice */}
              {!canCorrect && (
                <div
                  className="rounded border border-white/10 bg-surface-secondary px-4 py-3 text-xs text-text-muted"
                  data-testid="no-rights-notice"
                >
                  Read-only — your role does not have correction rights for this {detail.tradeDirection.toLowerCase()} record.
                </div>
              )}

              {/* Correction form */}
              {canCorrect && !corrResult && (
                <div
                  className="rounded-lg border border-white/10 bg-surface-secondary p-4"
                  data-testid="correction-form"
                >
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-3 flex items-center gap-2">
                    <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                    Apply Correction
                  </h3>

                  {!confirmStep ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-text-muted mb-1" htmlFor="corr-field">
                          Field to correct
                        </label>
                        <select
                          id="corr-field"
                          value={corrField}
                          onChange={e => handleFieldChange(e.target.value)}
                          className="w-full rounded border border-white/15 bg-surface-primary text-text-primary text-xs px-3 py-2 focus:outline-none focus-visible:ring-2"
                        >
                          <option value="">Select a field…</option>
                          {CORRECTABLE_FIELDS.map(f => (
                            <option key={f} value={f}>
                              {FIELD_LABELS[f]}{meta[f] === 'CORRECTED' ? ' (already corrected)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {isDuplicate && (
                        <div
                          className="flex items-start gap-2 rounded border border-amber-600/30 bg-amber-900/10 px-3 py-2 text-xs text-amber-300"
                          data-testid="duplicate-warning"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                          This field was previously corrected. Submitting will add a new correction record to the audit history.
                        </div>
                      )}

                      <div>
                        <label className="block text-xs text-text-muted mb-1" htmlFor="corr-value">
                          Corrected value
                        </label>
                        <input
                          id="corr-value"
                          type="text"
                          value={corrValue}
                          onChange={e => setCorrValue(e.target.value)}
                          placeholder="Enter corrected value…"
                          className="w-full rounded border border-white/15 bg-surface-primary text-text-primary text-xs px-3 py-2 focus:outline-none focus-visible:ring-2"
                          maxLength={500}
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-text-muted mb-1" htmlFor="corr-note">
                          Note <span className="text-text-muted">(optional)</span>
                        </label>
                        <textarea
                          id="corr-note"
                          value={corrNote}
                          onChange={e => setCorrNote(e.target.value)}
                          placeholder="Reason for correction…"
                          rows={2}
                          className="w-full rounded border border-white/15 bg-surface-primary text-text-primary text-xs px-3 py-2 focus:outline-none focus-visible:ring-2 resize-none"
                          maxLength={1000}
                        />
                      </div>

                      <button
                        onClick={() => setConfirmStep(true)}
                        disabled={!corrField || corrValue.trim() === ''}
                        data-testid="review-changes-btn"
                        className="px-4 py-2 text-xs bg-accent-primary text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Review Changes
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3" data-testid="confirm-step">
                      <div className="rounded border border-white/10 bg-surface-primary px-3 py-2.5 text-xs space-y-2">
                        <p className="text-text-secondary font-medium">Confirm correction:</p>
                        <div className="flex flex-wrap gap-6">
                          <div>
                            <p className="text-text-muted">Field</p>
                            <code className="font-mono text-text-primary">{FIELD_LABELS[corrField as CorrectableField] ?? corrField}</code>
                          </div>
                          <div>
                            <p className="text-text-muted">Current value</p>
                            <code className="font-mono text-text-primary" data-testid="confirm-current-value">
                              {fieldStr(detail, corrField as keyof QualityDetailRecord) || '(empty)'}
                            </code>
                          </div>
                          <div>
                            <p className="text-text-muted">New value</p>
                            <code className="font-mono text-text-primary" data-testid="confirm-new-value">
                              {corrValue.trim()}
                            </code>
                          </div>
                        </div>
                        {corrNote.trim() && (
                          <p className="text-text-muted">Note: {corrNote.trim()}</p>
                        )}
                      </div>

                      {submitError && (
                        <div className="text-xs text-red-300 bg-red-900/20 rounded px-3 py-2" role="alert" data-testid="submit-error">
                          {submitError}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={handleSubmitCorrection}
                          disabled={submitting}
                          data-testid="confirm-apply-btn"
                          className="px-4 py-2 text-xs bg-accent-primary text-white rounded hover:opacity-90 disabled:opacity-50"
                        >
                          {submitting ? 'Applying…' : 'Confirm & Apply'}
                        </button>
                        <button
                          onClick={() => setConfirmStep(false)}
                          disabled={submitting}
                          className="px-4 py-2 text-xs border border-white/15 text-text-secondary rounded hover:bg-surface-primary disabled:opacity-50"
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
