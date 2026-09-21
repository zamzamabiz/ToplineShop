import { Injectable } from '@nestjs/common';

/**
 * TDR in-process metrics service.
 *
 * Provides bounded, cardinality-safe counters and simple histograms.
 * All counters use bounded label sets — no job/record/user/file IDs as labels.
 *
 * Prometheus text format is produced by toPrometheus().
 *
 * JavaScript is single-threaded so counter increments are race-free.
 */

export type StatusClass = '2xx' | '3xx' | '4xx' | '5xx' | 'other';
export type JobType = 'processing' | 'quality' | 'export';
export type JobMetricLabel = 'pending' | 'leased' | 'completed' | 'failed' | 'lease_reclaim';
export type StorageOp = 'put' | 'read' | 'delete' | 'copy';
export type LifecycleOp = 'archive' | 'restore' | 'source_download';
export type CleanupResult = 'success' | 'failure';

interface CounterMap {
  [key: string]: number;
}

@Injectable()
export class MetricsService {
  // ── HTTP metrics ─────────────────────────────────────────────────────────────
  private readonly httpRequests: CounterMap = {};
  private readonly httpDurationBuckets: number[] = [];

  // ── Job metrics ───────────────────────────────────────────────────────────────
  private readonly jobEvents: CounterMap = {};

  // ── Storage metrics ───────────────────────────────────────────────────────────
  private readonly storageOps: CounterMap = {};

  // ── Lifecycle metrics ─────────────────────────────────────────────────────────
  private readonly lifecycleOps: CounterMap = {};

  // ── Export cleanup metrics ───────────────────────────────────────────────────
  private exportCleanupSuccess = 0;
  private exportCleanupFailure = 0;
  private exportCleanupBinariesDeleted = 0;

  // ── Temp cleanup metrics ─────────────────────────────────────────────────────
  private tempCleanupRuns = 0;
  private tempCleanupRemoved = 0;
  private tempCleanupErrors = 0;

  // ── DB readiness metrics ─────────────────────────────────────────────────────
  private dbReadinessOk = 0;
  private dbReadinessFail = 0;

  // ── HTTP ──────────────────────────────────────────────────────────────────────

  recordHttpRequest(method: string, statusClass: StatusClass, durationMs: number): void {
    const key = `${method}:${statusClass}`;
    this.httpRequests[key] = (this.httpRequests[key] ?? 0) + 1;
    this.httpDurationBuckets.push(durationMs);
    // Keep last 1000 samples to bound memory
    if (this.httpDurationBuckets.length > 1000) {
      this.httpDurationBuckets.shift();
    }
  }

  // ── Jobs ──────────────────────────────────────────────────────────────────────

  recordJobEvent(jobType: JobType, label: JobMetricLabel): void {
    const key = `${jobType}:${label}`;
    this.jobEvents[key] = (this.jobEvents[key] ?? 0) + 1;
  }

  // ── Storage ───────────────────────────────────────────────────────────────────

  recordStorageOp(op: StorageOp, result: 'success' | 'failure'): void {
    const key = `${op}:${result}`;
    this.storageOps[key] = (this.storageOps[key] ?? 0) + 1;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  recordLifecycleOp(op: LifecycleOp): void {
    this.lifecycleOps[op] = (this.lifecycleOps[op] ?? 0) + 1;
  }

  // ── Export cleanup ────────────────────────────────────────────────────────────

  recordExportCleanup(result: CleanupResult, binariesDeleted = 0): void {
    if (result === 'success') {
      this.exportCleanupSuccess++;
      this.exportCleanupBinariesDeleted += binariesDeleted;
    } else {
      this.exportCleanupFailure++;
    }
  }

  // ── Temp cleanup ──────────────────────────────────────────────────────────────

  recordTempCleanup(removed: number, errors: number): void {
    this.tempCleanupRuns++;
    this.tempCleanupRemoved += removed;
    this.tempCleanupErrors += errors;
  }

  // ── DB readiness ──────────────────────────────────────────────────────────────

  recordDbReadiness(ok: boolean): void {
    if (ok) this.dbReadinessOk++;
    else this.dbReadinessFail++;
  }

  // ── Snapshot (for tests) ──────────────────────────────────────────────────────

  getSnapshot() {
    return {
      httpRequests: { ...this.httpRequests },
      jobEvents: { ...this.jobEvents },
      storageOps: { ...this.storageOps },
      lifecycleOps: { ...this.lifecycleOps },
      exportCleanupSuccess: this.exportCleanupSuccess,
      exportCleanupFailure: this.exportCleanupFailure,
      exportCleanupBinariesDeleted: this.exportCleanupBinariesDeleted,
      tempCleanupRuns: this.tempCleanupRuns,
      tempCleanupRemoved: this.tempCleanupRemoved,
      tempCleanupErrors: this.tempCleanupErrors,
      dbReadinessOk: this.dbReadinessOk,
      dbReadinessFail: this.dbReadinessFail,
      httpSampleCount: this.httpDurationBuckets.length,
      httpDurationP50Ms: this.percentile(this.httpDurationBuckets, 50),
      httpDurationP99Ms: this.percentile(this.httpDurationBuckets, 99),
    };
  }

  /** Render current counters in Prometheus text exposition format. */
  toPrometheus(): string {
    const lines: string[] = [];
    const ts = Date.now();

    // HTTP requests
    lines.push('# HELP tdr_http_requests_total Total HTTP requests by method and status class');
    lines.push('# TYPE tdr_http_requests_total counter');
    for (const [key, val] of Object.entries(this.httpRequests)) {
      const [method, statusClass] = key.split(':');
      lines.push(`tdr_http_requests_total{method="${method}",status_class="${statusClass}"} ${val} ${ts}`);
    }

    // HTTP duration (simplified)
    lines.push('# HELP tdr_http_duration_p50_ms HTTP request duration p50 (ms, last 1000 samples)');
    lines.push('# TYPE tdr_http_duration_p50_ms gauge');
    lines.push(`tdr_http_duration_p50_ms ${this.percentile(this.httpDurationBuckets, 50).toFixed(2)} ${ts}`);
    lines.push('# HELP tdr_http_duration_p99_ms HTTP request duration p99 (ms, last 1000 samples)');
    lines.push('# TYPE tdr_http_duration_p99_ms gauge');
    lines.push(`tdr_http_duration_p99_ms ${this.percentile(this.httpDurationBuckets, 99).toFixed(2)} ${ts}`);

    // Job metrics
    lines.push('# HELP tdr_job_events_total TDR job state transitions by job_type and label');
    lines.push('# TYPE tdr_job_events_total counter');
    for (const [key, val] of Object.entries(this.jobEvents)) {
      const [jobType, label] = key.split(':');
      lines.push(`tdr_job_events_total{job_type="${jobType}",label="${label}"} ${val} ${ts}`);
    }

    // Storage operations
    lines.push('# HELP tdr_storage_ops_total Storage operations by op and result');
    lines.push('# TYPE tdr_storage_ops_total counter');
    for (const [key, val] of Object.entries(this.storageOps)) {
      const [op, result] = key.split(':');
      lines.push(`tdr_storage_ops_total{op="${op}",result="${result}"} ${val} ${ts}`);
    }

    // Lifecycle metrics
    lines.push('# HELP tdr_lifecycle_ops_total Source file lifecycle operations');
    lines.push('# TYPE tdr_lifecycle_ops_total counter');
    for (const [op, val] of Object.entries(this.lifecycleOps)) {
      lines.push(`tdr_lifecycle_ops_total{op="${op}"} ${val} ${ts}`);
    }

    // Export cleanup
    lines.push('# HELP tdr_export_cleanup_total Export binary cleanup runs by result');
    lines.push('# TYPE tdr_export_cleanup_total counter');
    lines.push(`tdr_export_cleanup_total{result="success"} ${this.exportCleanupSuccess} ${ts}`);
    lines.push(`tdr_export_cleanup_total{result="failure"} ${this.exportCleanupFailure} ${ts}`);
    lines.push('# HELP tdr_export_cleanup_binaries_deleted Total export binaries deleted');
    lines.push('# TYPE tdr_export_cleanup_binaries_deleted counter');
    lines.push(`tdr_export_cleanup_binaries_deleted ${this.exportCleanupBinariesDeleted} ${ts}`);

    // Temp cleanup
    lines.push('# HELP tdr_temp_cleanup_runs_total Temp file cleanup runs');
    lines.push('# TYPE tdr_temp_cleanup_runs_total counter');
    lines.push(`tdr_temp_cleanup_runs_total ${this.tempCleanupRuns} ${ts}`);
    lines.push('# HELP tdr_temp_cleanup_removed_total Temp files removed');
    lines.push('# TYPE tdr_temp_cleanup_removed_total counter');
    lines.push(`tdr_temp_cleanup_removed_total ${this.tempCleanupRemoved} ${ts}`);

    // DB readiness
    lines.push('# HELP tdr_db_readiness_total DB readiness check outcomes');
    lines.push('# TYPE tdr_db_readiness_total counter');
    lines.push(`tdr_db_readiness_total{result="ok"} ${this.dbReadinessOk} ${ts}`);
    lines.push(`tdr_db_readiness_total{result="fail"} ${this.dbReadinessFail} ${ts}`);

    return lines.join('\n') + '\n';
  }

  private percentile(samples: number[], p: number): number {
    if (samples.length === 0) return 0;
    const sorted = [...samples].sort((a, b) => a - b);
    const idx = Math.max(0, Math.ceil((p / 100) * sorted.length) - 1);
    return sorted[idx];
  }
}
