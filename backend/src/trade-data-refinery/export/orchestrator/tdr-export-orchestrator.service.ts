import { Injectable, Logger } from '@nestjs/common';
import { TdrExportJob } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { MetricsService } from '../../../common/metrics/metrics.service';

@Injectable()
export class TdrExportOrchestratorService {
  private readonly logger = new Logger(TdrExportOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
  ) {}

  async leaseNextJob(workerInstanceId: string): Promise<TdrExportJob | null> {
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const rows = await tx.$queryRaw<
        Array<{ id: string; tenant_id: string; lease_duration_ms: number }>
      >`
        SELECT id, tenant_id, lease_duration_ms
        FROM tdr_export_jobs
        WHERE status = 'PENDING'::"JobStatus"
          AND (lease_expires_at IS NULL OR lease_expires_at < ${now})
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;

      if (rows.length === 0) return null;
      const row = rows[0];
      const leaseExpiresAt = new Date(now.getTime() + Number(row.lease_duration_ms));

      const updated = await tx.tdrExportJob.update({
        where: { id: row.id },
        data: {
          status: 'LEASED',
          leasedAt: now,
          leaseExpiresAt,
          workerInstanceId,
          attemptCount: { increment: 1 },
          lastHeartbeatAt: now,
          startedAt: now,
        },
      });
      this.metrics.recordJobEvent('export', 'leased');
      return updated;
    });
  }

  async heartbeat(jobId: string, workerInstanceId: string): Promise<void> {
    await this.prisma.tdrExportJob.updateMany({
      where: { id: jobId, workerInstanceId, status: 'LEASED' },
      data: { lastHeartbeatAt: new Date() },
    });
  }

  async isLeaseOwned(jobId: string, workerInstanceId: string): Promise<boolean> {
    const job = await this.prisma.tdrExportJob.findFirst({
      where: { id: jobId, workerInstanceId, status: 'LEASED' },
      select: { id: true },
    });
    return job !== null;
  }

  async completeJob(
    jobId: string,
    storageKey: string,
    rowCount: number,
    contentHash: string,
  ): Promise<void> {
    const completedAt = new Date();
    const expiresAt = new Date(completedAt);
    expiresAt.setDate(expiresAt.getDate() + 90);

    await this.prisma.tdrExportJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        storageKey,
        rowCount,
        contentHash,
        completedAt,
        expiresAt,
        leasedAt: null,
        leaseExpiresAt: null,
        workerInstanceId: null,
      },
    });
    this.metrics.recordJobEvent('export', 'completed');
  }

  async failJob(
    jobId: string,
    workerInstanceId: string,
    errorMessage: string,
    errorCode?: string,
  ): Promise<void> {
    const job = await this.prisma.tdrExportJob.findUnique({
      where: { id: jobId },
      select: { attemptCount: true, maxAttempts: true },
    });
    const isFinal = !job || job.attemptCount >= job.maxAttempts;

    await this.prisma.tdrExportJob.updateMany({
      where: { id: jobId, workerInstanceId },
      data: {
        status: isFinal ? 'FAILED' : 'PENDING',
        errorMessage,
        ...(errorCode ? { errorCode } : {}),
        leasedAt: null,
        leaseExpiresAt: null,
        workerInstanceId: null,
        ...(isFinal ? { completedAt: new Date() } : {}),
      },
    });
    this.metrics.recordJobEvent('export', 'failed');
  }

  async reclaimExpiredLeases(): Promise<number> {
    const result = await this.prisma.tdrExportJob.updateMany({
      where: { status: 'LEASED', leaseExpiresAt: { lt: new Date() } },
      data: {
        status: 'PENDING',
        leasedAt: null,
        leaseExpiresAt: null,
        workerInstanceId: null,
        lastHeartbeatAt: null,
      },
    });
    if (result.count > 0) {
      this.logger.warn(`Reclaimed ${result.count} expired export job lease(s)`);
      for (let i = 0; i < result.count; i++) {
        this.metrics.recordJobEvent('export', 'lease_reclaim');
      }
    }
    return result.count;
  }
}
