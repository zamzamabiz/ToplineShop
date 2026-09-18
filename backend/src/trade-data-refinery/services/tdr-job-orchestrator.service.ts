import { Injectable, Logger } from '@nestjs/common';
import { TdrProcessingJob } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TdrJobOrchestratorService {
  private readonly logger = new Logger(TdrJobOrchestratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async leaseNextJob(workerInstanceId: string): Promise<TdrProcessingJob | null> {
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const rows = await tx.$queryRaw<
        Array<{ id: string; batch_id: string; tenant_id: string; lease_duration_ms: number }>
      >`
        SELECT id, batch_id, tenant_id, lease_duration_ms
        FROM tdr_processing_jobs
        WHERE status = 'PENDING'::"JobStatus"
          AND (lease_expires_at IS NULL OR lease_expires_at < ${now})
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;

      if (rows.length === 0) return null;
      const row = rows[0];
      const leaseExpiresAt = new Date(now.getTime() + Number(row.lease_duration_ms));

      return tx.tdrProcessingJob.update({
        where: { id: row.id },
        data: {
          status: 'LEASED',
          leasedAt: now,
          leaseExpiresAt,
          workerInstanceId,
          attemptCount: { increment: 1 },
          lastHeartbeatAt: now,
        },
      });
    });
  }

  async heartbeat(jobId: string, workerInstanceId: string): Promise<void> {
    await this.prisma.tdrProcessingJob.updateMany({
      where: { id: jobId, workerInstanceId, status: 'LEASED' },
      data: { lastHeartbeatAt: new Date() },
    });
  }

  async checkpoint(
    jobId: string,
    workerInstanceId: string,
    lastCheckpointRow: number,
  ): Promise<void> {
    await this.prisma.tdrProcessingJob.updateMany({
      where: { id: jobId, workerInstanceId, status: 'LEASED' },
      data: { lastCheckpointRow, lastHeartbeatAt: new Date() },
    });
  }

  async completeJob(jobId: string): Promise<void> {
    const job = await this.prisma.tdrProcessingJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', completedAt: new Date() },
      select: { batchId: true },
    });
    await this.prisma.tdrBatch.update({
      where: { id: job.batchId },
      data: { status: 'READY', completedAt: new Date() },
    });
  }

  async failJob(jobId: string, errorMessage: string, errorCode?: string): Promise<void> {
    const job = await this.prisma.tdrProcessingJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', errorMessage, errorCode, completedAt: new Date() },
      select: { batchId: true },
    });
    await this.prisma.tdrBatch.update({
      where: { id: job.batchId },
      data: { status: 'FAILED' },
    });
  }

  async releaseLease(jobId: string): Promise<void> {
    await this.prisma.tdrProcessingJob.updateMany({
      where: { id: jobId, status: 'LEASED' },
      data: {
        status: 'PENDING',
        leasedAt: null,
        leaseExpiresAt: null,
        workerInstanceId: null,
        lastHeartbeatAt: null,
      },
    });
  }

  async reclaimExpiredLeases(): Promise<number> {
    const result = await this.prisma.tdrProcessingJob.updateMany({
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
      this.logger.warn(`Reclaimed ${result.count} expired job lease(s)`);
    }
    return result.count;
  }

  /** Completes a job and transitions batch to the given status (e.g. QUALITY_PENDING). */
  async completeJobWithStatus(jobId: string, batchStatus: string): Promise<void> {
    const job = await this.prisma.tdrProcessingJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', completedAt: new Date() },
      select: { batchId: true },
    });
    await this.prisma.tdrBatch.update({
      where: { id: job.batchId },
      data: { status: batchStatus as never, completedAt: new Date() },
    });
  }

  /**
   * Resets a job to PENDING for retry (attemptCount < maxAttempts).
   * Preserves lastCheckpointRow so the handler can skip already-committed rows.
   */
  async retryJob(
    jobId: string,
    workerInstanceId: string,
    errorMessage: string,
    errorCode?: string,
  ): Promise<void> {
    await this.prisma.tdrProcessingJob.updateMany({
      where: { id: jobId, workerInstanceId, status: 'LEASED' },
      data: {
        status: 'PENDING',
        leasedAt: null,
        leaseExpiresAt: null,
        workerInstanceId: null,
        lastHeartbeatAt: null,
        errorMessage,
        ...(errorCode ? { errorCode } : {}),
      },
    });
    this.logger.warn(`Job ${jobId} reset to PENDING for retry. Last error: ${errorMessage}`);
  }

  /** Returns true if the job is still leased by this worker instance. */
  async isLeaseOwned(jobId: string, workerInstanceId: string): Promise<boolean> {
    const job = await this.prisma.tdrProcessingJob.findFirst({
      where: { id: jobId, workerInstanceId, status: 'LEASED' },
      select: { id: true },
    });
    return job !== null;
  }
}
