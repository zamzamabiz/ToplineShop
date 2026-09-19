'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  getAnalyticsSummary,
  getAnalyticsTrend,
  getAnalyticsBreakdown,
  getAnalyticsFilterOptions,
} from '@/lib/tdr-api';
import type {
  AnalyticsFilter,
  AnalyticsSummary,
  BreakdownItem,
  BreakdownResponse,
  FilterOptions,
  TrendPoint,
  TrendResponse,
} from '@/types/tdr';

// ── Inline SVG charts — no external library (§77) ────────────────────────────

function BarChart({ items, maxItems = 15 }: { items: BreakdownItem[]; maxItems?: number }) {
  const shown = items.slice(0, maxItems);
  if (!shown.length) return <EmptyChart />;
  const maxVal = Math.max(...shown.map((i) => i.count), 1);
  return (
    <div className="space-y-1.5">
      {shown.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-28 shrink-0 truncate text-text-muted text-right">
            {item.value ?? '(null)'}
          </span>
          <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
            <div
              className="bg-accent-primary h-3 rounded-full transition-all"
              style={{ width: `${(item.count / maxVal) * 100}%` }}
            />
          </div>
          <span className="w-12 text-text-secondary">{item.count.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ points }: { points: TrendPoint[] }) {
  if (!points.length) return <EmptyChart />;

  const W = 480;
  const H = 120;
  const PAD = { top: 10, bottom: 20, left: 40, right: 10 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...points.map((p) => p.total), 1);

  const px = (i: number) => PAD.left + (i / Math.max(points.length - 1, 1)) * innerW;
  const py = (v: number) => PAD.top + innerH - (v / maxVal) * innerH;

  const makePath = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(v)}`).join(' ');

  const xLabels = points.length > 12
    ? points.filter((_, i) => i % Math.ceil(points.length / 6) === 0)
    : points;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="Trend chart">
      {/* Gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = PAD.top + innerH * (1 - f);
        return (
          <g key={f}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="white" strokeOpacity="0.06" />
            <text x={PAD.left - 4} y={y + 3} fontSize="8" fill="rgba(255,255,255,0.3)" textAnchor="end">
              {Math.round(maxVal * f).toLocaleString()}
            </text>
          </g>
        );
      })}

      {/* Total line */}
      <path d={makePath(points.map((p) => p.total))} fill="none" stroke="#7c6ef7" strokeWidth="1.5" />
      {/* Accepted line */}
      <path d={makePath(points.map((p) => p.accepted))} fill="none" stroke="#34d399" strokeWidth="1" strokeDasharray="3,2" />

      {/* X-axis labels */}
      {xLabels.map((p) => {
        const idx = points.indexOf(p);
        return (
          <text
            key={p.period}
            x={px(idx)}
            y={H - 4}
            fontSize="8"
            fill="rgba(255,255,255,0.3)"
            textAnchor="middle"
          >
            {p.period?.slice(0, 7) ?? ''}
          </text>
        );
      })}
    </svg>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-20 text-text-muted text-xs">
      No data for current filter
    </div>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

function FilterBar({
  filter,
  options,
  onChange,
}: {
  filter: AnalyticsFilter;
  options: FilterOptions | null;
  onChange: (f: AnalyticsFilter) => void;
}) {
  const [local, setLocal] = useState<AnalyticsFilter>(filter);

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    onChange(local);
  };

  const reset = () => {
    const cleared: AnalyticsFilter = {};
    setLocal(cleared);
    onChange(cleared);
  };

  return (
    <form onSubmit={apply} className="bg-surface-secondary border border-white/10 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Date range */}
        <div className="flex items-center gap-1 text-xs">
          <label className="text-text-muted">From</label>
          <input
            type="date"
            value={local.dateFrom ?? ''}
            onChange={(e) => setLocal({ ...local, dateFrom: e.target.value || undefined })}
            className="px-2 py-1 bg-surface-primary border border-white/10 rounded text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-accent-primary"
          />
          <label className="text-text-muted">To</label>
          <input
            type="date"
            value={local.dateTo ?? ''}
            onChange={(e) => setLocal({ ...local, dateTo: e.target.value || undefined })}
            className="px-2 py-1 bg-surface-primary border border-white/10 rounded text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-accent-primary"
          />
        </div>

        {/* Direction */}
        <select
          value={local.tradeDirection ?? ''}
          onChange={(e) =>
            setLocal({ ...local, tradeDirection: (e.target.value as any) || undefined })
          }
          className="px-2 py-1 text-xs bg-surface-primary border border-white/10 rounded text-text-primary focus:outline-none"
        >
          <option value="">All directions</option>
          {(options?.tradeDirections ?? ['IMPORT', 'EXPORT']).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* HS Chapter */}
        {options?.hsChapters.length ? (
          <select
            value={local.hsChapter ?? ''}
            onChange={(e) => setLocal({ ...local, hsChapter: e.target.value || undefined })}
            className="px-2 py-1 text-xs bg-surface-primary border border-white/10 rounded text-text-primary focus:outline-none"
          >
            <option value="">All chapters</option>
            {options.hsChapters.map((c) => (
              <option key={c} value={c!}>{c}</option>
            ))}
          </select>
        ) : null}

        {/* Country */}
        {options?.foreignCountryCodes.length ? (
          <select
            value={local.foreignCountryCode ?? ''}
            onChange={(e) =>
              setLocal({ ...local, foreignCountryCode: e.target.value || undefined })
            }
            className="px-2 py-1 text-xs bg-surface-primary border border-white/10 rounded text-text-primary focus:outline-none"
          >
            <option value="">All countries</option>
            {options.foreignCountryCodes.map((c) => (
              <option key={c} value={c!}>{c}</option>
            ))}
          </select>
        ) : null}

        <button
          type="submit"
          className="px-3 py-1 text-xs bg-accent-primary text-white rounded hover:opacity-90"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={reset}
          className="px-3 py-1 text-xs border border-white/10 text-text-secondary rounded hover:border-white/20"
        >
          Reset
        </button>
      </div>

      {/* Active filter chips */}
      <div className="flex flex-wrap gap-1">
        {Object.entries(local)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => (
            <span
              key={k}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-primary/20 text-accent-primary text-xs rounded"
            >
              {k}: {String(v)}
              <button
                type="button"
                onClick={() => {
                  const next = { ...local, [k]: undefined };
                  setLocal(next);
                }}
                className="hover:opacity-70"
              >
                ×
              </button>
            </span>
          ))}
      </div>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const DIMENSIONS = [
  { value: 'tradeDirection', label: 'Trade Direction' },
  { value: 'hsChapter', label: 'HS Chapter' },
  { value: 'foreignPartyCountryCode', label: 'Country' },
  { value: 'currencyCode', label: 'Currency' },
  { value: 'quantityUnitCode', label: 'Unit' },
] as const;

type DimensionValue = (typeof DIMENSIONS)[number]['value'];
type Granularity = 'DAY' | 'MONTH' | 'YEAR';

export default function TdrAnalyticsPage() {
  const { accessToken } = useAuth();

  const [filter, setFilter] = useState<AnalyticsFilter>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trend, setTrend] = useState<TrendResponse | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownResponse | null>(null);

  const [granularity, setGranularity] = useState<Granularity>('MONTH');
  const [dimension, setDimension] = useState<DimensionValue>('tradeDirection');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadAll = useCallback(
    (f: AnalyticsFilter, g: Granularity, dim: DimensionValue) => {
      if (!accessToken) return;
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setError(null);

      Promise.all([
        getAnalyticsSummary(accessToken, f, ctrl.signal),
        getAnalyticsTrend(accessToken, f, g, ctrl.signal),
        getAnalyticsBreakdown(accessToken, f, dim, 20, ctrl.signal),
      ])
        .then(([s, t, b]) => { setSummary(s); setTrend(t); setBreakdown(b); })
        .catch((e) => { if (e?.name !== 'AbortError') setError(e?.message ?? 'Failed to load'); })
        .finally(() => setLoading(false));
    },
    [accessToken],
  );

  // Load filter options once on mount
  useEffect(() => {
    if (!accessToken) return;
    getAnalyticsFilterOptions(accessToken).then(setFilterOptions).catch(() => null);
  }, [accessToken]);

  // Reload when filter/granularity/dimension changes
  useEffect(() => {
    loadAll(filter, granularity, dimension);
    return () => abortRef.current?.abort();
  }, [filter, granularity, dimension, loadAll]);

  const handleFilterChange = useCallback((f: AnalyticsFilter) => {
    setFilter(f);
  }, []);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold text-text-primary">Analytics</h1>
        {summary?.valueAggregationUnsafe && (
          <span className="text-xs bg-yellow-900/30 text-yellow-400 border border-yellow-800/40 px-3 py-1 rounded">
            Values not aggregated — mixed-currency safety
          </span>
        )}
      </div>

      {/* Filter bar */}
      <FilterBar filter={filter} options={filterOptions} onChange={handleFilterChange} />

      {error && (
        <div className="text-sm text-red-300 bg-red-900/20 rounded px-4 py-3">{error}</div>
      )}

      {/* KPI row */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: summary.total.toLocaleString() },
            {
              label: 'Accepted',
              value: summary.accepted.toLocaleString(),
              sub: summary.qualityRate !== null ? `${summary.qualityRate}% quality` : undefined,
            },
            { label: 'Quarantined', value: summary.quarantined.toLocaleString() },
            { label: 'Rejected', value: summary.rejected.toLocaleString() },
            { label: 'Export Eligible', value: summary.exportEligibleCount.toLocaleString() },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-surface-secondary border border-white/10 rounded-lg p-3">
              <p className="text-xs text-text-muted uppercase tracking-wider">{kpi.label}</p>
              <p className="text-xl font-bold text-text-primary mt-1">{kpi.value}</p>
              {kpi.sub && <p className="text-xs text-text-muted mt-0.5">{kpi.sub}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Trend chart */}
        <div className="bg-surface-secondary border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-secondary">Record Trend</h2>
            <div className="flex gap-1">
              {(['DAY', 'MONTH', 'YEAR'] as Granularity[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  className={`px-2 py-0.5 text-xs rounded ${
                    granularity === g
                      ? 'bg-accent-primary text-white'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="h-24 bg-surface-primary/50 rounded animate-pulse" />
          ) : (
            <>
              <TrendChart points={trend?.points ?? []} />
              {(trend?.points.length ?? 0) > 0 && (
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-px bg-[#7c6ef7] inline-block" />
                    <span className="text-text-muted">Total</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-px bg-[#34d399] inline-block border-dashed" />
                    <span className="text-text-muted">Accepted</span>
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Breakdown chart */}
        <div className="bg-surface-secondary border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-secondary">Breakdown</h2>
            <select
              value={dimension}
              onChange={(e) => setDimension(e.target.value as DimensionValue)}
              className="px-2 py-0.5 text-xs bg-surface-primary border border-white/10 rounded text-text-primary focus:outline-none"
            >
              {DIMENSIONS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          {loading ? (
            <div className="space-y-1.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 bg-surface-primary/50 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <BarChart items={breakdown?.items ?? []} />
          )}
        </div>
      </div>
    </div>
  );
}
