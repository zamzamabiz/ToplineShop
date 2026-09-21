import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from '../../ingestion/storage/storage.service';
import { MetricsService } from '../../../common/metrics/metrics.service';

@Injectable()
export class TdrExportCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TdrExportCleanupService.name);

  static readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly metrics: MetricsService,
  ) {}

  onModuleInit(): void {
    this.cleanupTimer = setInterval(
      () => void this.cleanupExpiredExports(),
      TdrExportCleanupService.CLEANUP_INTERVAL_MS,
    );
    this.logger.log('TdrExportCleanupService started (1h interval)');
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  async cleanupExpiredExports(): Promise<number> {
    const now = new Date();

    const expired = await this.prisma.tdrExportJob.findMany({
      where: {
        status: 'COMPLETED',
        expiresAt: { lt: now, not: null },
        storageKey: { not: null },
      },
      select: { id: true, storageKey: true },
    });

    if (expired.length === 0) return 0;

    let cleaned = 0;
    for (const job of expired) {
      try {
        if (job.storageKey) {
          await this.storage.removeSafe(job.storageKey);
        }
        await this.prisma.tdrExportJob.update({
          where: { id: job.id },
          data: { storageKey: null },
        });
        cleaned++;
      } catch (err) {
        this.logger.error(`Failed to clean expired export ${job.id}: ${(err as Error).message}`);
      }
    }

    this.metrics.recordExportCleanup('success', cleaned);

    if (cleaned > 0) {
      this.logger.log(`Cleaned ${cleaned} expired export binary/binaries`);
    }

    return cleaned;
  }
}
