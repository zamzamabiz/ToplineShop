/**
 * Typed TDR API client.
 * All requests require a Bearer token (§55 / §56).
 * AbortController support for §58 race control.
 */

import type {
  AnalyticsFilter,
  AnalyticsSummary,
  AuthLoginRequest,
  AuthLoginResponse,
  BatchListResponse,
  BatchStatus,
  BreakdownResponse,
  CorrectionRequest,
  CreateExportRequest,
  FilterOptions,
  QuarantineIssue,
  QuarantineListResponse,
  RecordsListResponse,
  TdrBatch,
  TdrBatchProgress,
  TdrExportJob,
  TdrRecord,
  TdrStatus,
  TrendResponse,
} from '@/types/tdr';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type BreakdownDimensionValue =
  | 'tradeDirection'
  | 'hsChapter'
  | 'foreignPartyCountryCode'
  | 'currencyCode'
  | 'quantityUnitCode';

// ── Core fetch helpers ────────────────────────────────────────────────────────

function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | string[] | undefined>,
): string {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined) continue;
      if (Array.isArray(v)) {
        v.forEach((item) => url.searchParams.append(k, item));
      } else {
        url.searchParams.set(k, String(v));
      }
    }
  }
  return url.toString();
}

function throwApiError(body: Record<string, unknown>, status: number): never {
  const err = body?.error as Record<string, unknown> | undefined;
  throw Object.assign(new Error((err?.message as string) ?? `HTTP ${status}`), {
    code: (err?.code as string) ?? `HTTP_${status}`,
    status,
  });
}

async function get<T>(
  path: string,
  token: string,
  params?: Record<string, string | number | boolean | string[] | undefined>,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(buildUrl(path, params), {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  if (!res.ok) throwApiError(await res.json().catch(() => ({})), res.status);
  const body = await res.json();
  return body.data as T;
}

// Preserves meta alongside data for paginated responses
async function getPage<T, M = Record<string, unknown>>(
  path: string,
  token: string,
  params?: Record<string, string | number | boolean | string[] | undefined>,
  signal?: AbortSignal,
): Promise<{ data: T; meta: M }> {
  const res = await fetch(buildUrl(path, params), {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  if (!res.ok) throwApiError(await res.json().catch(() => ({})), res.status);
  const body = await res.json();
  return { data: body.data as T, meta: body.meta as M };
}

async function post<TReq, TRes>(
  path: string,
  token: string,
  data: TReq,
  signal?: AbortSignal,
): Promise<TRes> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    signal,
  });
  if (!res.ok) throwApiError(await res.json().catch(() => ({})), res.status);
  const body = await res.json();
  return body.data as TRes;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function authLogin(req: AuthLoginRequest): Promise<AuthLoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body?.error?.message ?? 'Login failed'), {
      code: body?.error?.code ?? `HTTP_${res.status}`,
      status: res.status,
    });
  }
  const body = await res.json();
  return body.data as AuthLoginResponse;
}

export async function authLogout(token: string): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── TDR status ────────────────────────────────────────────────────────────────

export function getTdrStatus(token: string, signal?: AbortSignal) {
  return get<TdrStatus>('/tdr/status', token, undefined, signal);
}

// ── Batches ───────────────────────────────────────────────────────────────────

export async function listBatches(
  token: string,
  opts: { page?: number; pageSize?: number; status?: BatchStatus },
  signal?: AbortSignal,
): Promise<BatchListResponse> {
  type PageMeta = { page: number; pageSize: number; total: number; totalPages: number };
  const { data, meta } = await getPage<TdrBatch[], PageMeta>(
    '/tdr/batches',
    token,
    opts as Record<string, string | number | undefined>,
    signal,
  );
  return {
    batches: data,
    page: meta.page,
    pageSize: meta.pageSize,
    total: meta.total,
    totalPages: meta.totalPages,
    hasMore: meta.page * meta.pageSize < meta.total,
  };
}

export function getBatch(token: string, id: string, signal?: AbortSignal) {
  return get<TdrBatch>(`/tdr/batches/${encodeURIComponent(id)}`, token, undefined, signal);
}

export function getBatchProgress(token: string, id: string, signal?: AbortSignal) {
  return get<TdrBatchProgress>(
    `/tdr/batches/${encodeURIComponent(id)}/progress`,
    token,
    undefined,
    signal,
  );
}

export function cancelBatch(token: string, id: string) {
  return post<Record<string, never>, { cancelled: boolean; batchId: string; status: BatchStatus }>(
    `/tdr/batches/${encodeURIComponent(id)}/cancel`,
    token,
    {},
  );
}

// ── Upload ────────────────────────────────────────────────────────────────────

export async function uploadFile(
  token: string,
  file: File,
  direction: 'IMPORT' | 'EXPORT',
  mappingProfileId: string,
  signal?: AbortSignal,
): Promise<TdrBatch> {
  const form = new FormData();
  form.append('file', file);
  form.append('tradeDirection', direction);
  form.append('mappingProfileId', mappingProfileId);

  const res = await fetch(`${API_BASE}/tdr/batches/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    signal,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body?.error?.message ?? `HTTP ${res.status}`), {
      code: body?.error?.code ?? `HTTP_${res.status}`,
      status: res.status,
    });
  }
  const body = await res.json();
  return body.data as TdrBatch;
}

// ── Quarantine ────────────────────────────────────────────────────────────────

export async function listQuarantine(
  token: string,
  batchId: string,
  opts: { page?: number; pageSize?: number },
  signal?: AbortSignal,
): Promise<QuarantineListResponse> {
  type PageMeta = { page: number; pageSize: number; total: number; totalPages: number };
  const { data, meta } = await getPage<QuarantineIssue[], PageMeta>(
    `/tdr/batches/${encodeURIComponent(batchId)}/quarantine`,
    token,
    opts as Record<string, number | undefined>,
    signal,
  );
  return { issues: data, page: meta.page, pageSize: meta.pageSize, total: meta.total, totalPages: meta.totalPages };
}

export function applyCorrection(
  token: string,
  batchId: string,
  recordId: string,
  req: CorrectionRequest,
) {
  return post<CorrectionRequest, { reviewId: string; recordId: string; fieldName: string; newDisposition: string; exportEligible: boolean }>(
    `/tdr/batches/${encodeURIComponent(batchId)}/records/${encodeURIComponent(recordId)}/correct`,
    token,
    req,
  );
}

// ── Exports ───────────────────────────────────────────────────────────────────

export function createExport(token: string, dto: CreateExportRequest) {
  return post<CreateExportRequest, TdrExportJob>('/tdr/exports', token, dto);
}

export function getExportStatus(token: string, exportId: string, signal?: AbortSignal) {
  return get<TdrExportJob>(`/tdr/exports/${encodeURIComponent(exportId)}`, token, undefined, signal);
}

// Authenticated download: Bearer fetch → Blob → object URL → auto-click → revoke
export async function downloadExport(token: string, exportId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/tdr/exports/${encodeURIComponent(exportId)}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throwApiError(await res.json().catch(() => ({})), res.status);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = `export-${exportId}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

// ── Analytics ─────────────────────────────────────────────────────────────────

function filterToParams(
  f: AnalyticsFilter,
): Record<string, string | string[] | undefined> {
  const p: Record<string, string | string[] | undefined> = {};
  if (f.dateFrom) p.dateFrom = f.dateFrom;
  if (f.dateTo) p.dateTo = f.dateTo;
  if (f.tradeDirection) p.tradeDirection = f.tradeDirection;
  if (f.hsCodePrefix) p.hsCodePrefix = f.hsCodePrefix;
  if (f.hsChapter) p.hsChapter = f.hsChapter;
  if (f.foreignCountryCode) p.foreignCountryCode = f.foreignCountryCode;
  if (f.localPartyTaxId) p.localPartyTaxId = f.localPartyTaxId;
  if (f.batchId) p.batchId = f.batchId;
  if (f.dispositions?.length) p.dispositions = f.dispositions;
  if (f.currencyCode) p.currencyCode = f.currencyCode;
  if (f.quantityUnitCode) p.quantityUnitCode = f.quantityUnitCode;
  if (f.exportEligible !== undefined) p.exportEligible = String(f.exportEligible);
  return p;
}

export function getAnalyticsSummary(
  token: string,
  filter: AnalyticsFilter,
  signal?: AbortSignal,
) {
  return get<AnalyticsSummary>('/tdr/analytics/summary', token, filterToParams(filter), signal);
}

export function getAnalyticsTrend(
  token: string,
  filter: AnalyticsFilter,
  granularity: 'DAY' | 'MONTH' | 'YEAR' = 'MONTH',
  signal?: AbortSignal,
) {
  return get<TrendResponse>(
    '/tdr/analytics/trend',
    token,
    { ...filterToParams(filter), granularity },
    signal,
  );
}

export function getAnalyticsBreakdown(
  token: string,
  filter: AnalyticsFilter,
  dimension: BreakdownDimensionValue,
  topN = 20,
  signal?: AbortSignal,
) {
  return get<BreakdownResponse>(
    '/tdr/analytics/breakdown',
    token,
    { ...filterToParams(filter), dimension, topN },
    signal,
  );
}

export function getAnalyticsFilterOptions(token: string, signal?: AbortSignal) {
  return get<FilterOptions>('/tdr/analytics/filter-options', token, undefined, signal);
}

export async function listRecords(
  token: string,
  opts: {
    filter?: AnalyticsFilter;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  },
  signal?: AbortSignal,
): Promise<RecordsListResponse> {
  const params: Record<string, string | string[] | undefined> = opts.filter
    ? filterToParams(opts.filter)
    : {};
  if (opts.sortBy) params.sortBy = opts.sortBy;
  if (opts.sortDir) params.sortDir = opts.sortDir;
  if (opts.page !== undefined) params.page = String(opts.page);
  if (opts.pageSize !== undefined) params.pageSize = String(opts.pageSize);
  type PageMeta = { total: number; page: number; pageSize: number; hasMore: boolean };
  const { data, meta } = await getPage<TdrRecord[], PageMeta>('/tdr/records', token, params, signal);
  return { records: data, total: meta.total, page: meta.page, pageSize: meta.pageSize, hasMore: meta.hasMore };
}
