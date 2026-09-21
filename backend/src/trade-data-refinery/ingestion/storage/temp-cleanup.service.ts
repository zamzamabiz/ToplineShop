import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MetricsService } from '../../../common/metrics/metrics.service';

/**
 * TempCleanupService — removes orphaned TDR temp files from os.tmpdir().
 *
 * Pattern: tdr-upload-*.csv.tmp, tdr-upload-*.xlsx.tmp, tdr-export-*.csv.tmp
 * Threshold: files older than 24 hours are eligible for cleanup.
 * Rationale: active jobs hold their temp file for seconds-to-minutes; a 24-hour
 * threshold is conservative enough to never interfere with an active job.
 *
 * Limitation: cleanup is age-based. If a job hangs for > 24 hours its temp file
 * may be removed. This is an acceptable tradeoff given the max job TTL design.
 *
 * Schedule: runs once on startup, then every CLEANUP_INTERVAL_MS (1 hour).
 */
@Injectable()
export class TempCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TempCleanupService.name);

  /** Files older than this threshold are eligible for cleanup. */
  static readonly STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

  /** Cleanup runs every hour. */
  static readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

  private readonly tmpDir = os.tmpdir();

  /** Patterns matching TDR temp files in os.tmpdir(). */
  private static readonly PATTERNS = [
    /^tdr-upload-.+\.(csv|xlsx)\.tmp$/,
    /^tdr-export-.+\.csv\.tmp$/,
  ];

  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly metrics: MetricsService) {}

  onModuleInit(): void {
    // Run once on startup with a short delay to avoid contending with startup I/O
    const initDelay = setTimeout(() => void this.runCleanup(), 5000);
    // Store as a property we can clear if needed (not strictly required for init)
    void initDelay;

    this.cleanupTimer = setInterval(
      () => void this.runCleanup(),
      TempCleanupService.CLEANUP_INTERVAL_MS,
    );
    this.logger.log('TempCleanupService started (24h stale threshold, 1h interval)');
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  async runCleanup(): Promise<{ removed: number; skipped: number; errors: number }> {
    const now = Date.now();
    let removed = 0;
    let skipped = 0;
    let errors = 0;

    let entries: string[];
    try {
      entries = await fs.promises.readdir(this.tmpDir);
    } catch (err) {
      this.logger.warn(`TempCleanupService: could not read tmpdir: ${String(err)}`);
      return { removed: 0, skipped: 0, errors: 1 };
    }

    for (const entry of entries) {
      if (!TempCleanupService.PATTERNS.some((p) => p.test(entry))) continue;

      const filePath = path.join(this.tmpDir, entry);
      try {
        const stat = await fs.promises.stat(filePath);
        const ageMs = now - stat.mtimeMs;

        if (ageMs < TempCleanupService.STALE_THRESHOLD_MS) {
          skipped++;
          continue;
        }

        await fs.promises.unlink(filePath);
        removed++;
        this.logger.log(`TempCleanupService: removed stale temp file ${entry} (age: ${Math.round(ageMs / 3600000)}h)`);
      } catch (err) {
        errors++;
        this.logger.warn(`TempCleanupService: error processing ${entry}: ${String(err)}`);
      }
    }

    this.metrics.recordTempCleanup(removed, errors);

    if (removed > 0 || errors > 0) {
      this.logger.log(`TempCleanupService: run complete. removed=${removed} skipped=${skipped} errors=${errors}`);
    }

    return { removed, skipped, errors };
  }
}
