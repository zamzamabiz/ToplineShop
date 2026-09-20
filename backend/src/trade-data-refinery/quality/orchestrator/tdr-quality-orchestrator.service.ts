import { Injectable, Logger } from '@nestjs/common';
import { TdrQualityJob } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TdrQualityOrchestratorService {
  private readonly logger = new Logger(TdrQualityOrchestratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a TdrQualityJob for the given batch if one does not already exist.
   * Race-safe: the UNIQUE(batchId) constraint on tdr_quality_jobs absorbs duplicates.
   * Returns the job id (existing or new).
   */
  async ensureQualityJob(batchId: string, tenantId: string): Promise<string> {
    const existing = await this.prisma.tdrQualityJob.findUnique({
      where: { batchId },
      select: { id: true, status: true },
    });
    if (existing) {
      // Reset a permanently-failed job to PENDING so the worker can retry.
      // Covers replay and reconciliation recovery after a code-level quality failure.
      if (existing.status === 'FAILED') {
        await this.prisma.tdrQualityJob.update({
          where: { id: existing.id },
          data: {
            status: 'PENDING',
            errorMessage: null,
            errorCode: null,
            completedAt: null,
            workerInstanceId: null,
            leasedAt: null,
            leaseExpiresAt: null,
            lastHeartbeatAt: null,
            attemptCount: 0,
          },
        });
        this.logger.log(`Reset FAILED quality job ${existing.id} to PENDING for batch ${batchId}`);
      }
      return existing.id;
    }

    try {
      const job = await this.prisma.tdrQualityJob.create({
        data: { batchId, tenantId, status: 'PENDING' },
        select: { id: true },
      });
      this.logger.log(`Created TdrQualityJob ${job.id} for batch ${batchId}`);
      return job.id;
    } catch (err) {
      // Handle unique-constraint race (P2002): another worker created it first
      if ((err as { code?: string }).code === 'P2002') {
        const row = await this.prisma.tdrQualityJob.findUniqueOrThrow({
          where: { batchId },
          select: { id: true },
        });
        return row.id;
      }
      throw err;
    }
  }

  /** Atomically leases the next PENDING (or expired LEASED) quality job. */
  async leaseNextJob(workerInstanceId: string): Promise<TdrQualityJob | null> {
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const rows = await tx.$queryRaw<
        Array<{ id: string; batch_id: string; tenant_id: string; lease_duration_ms: number }>
      >`
        SELECT id, batch_id, tenant_id, lease_duration_ms
        FROM tdr_quality_jobs
        WHERE status = 'PENDING'::"JobStatus"
          AND (lease_expires_at IS NULL OR lease_expires_at < ${now})
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;

      if (rows.length === 0) return null;
      const row = rows[0];
      const leaseExpiresAt = new Date(now.getTime() + Number(row.lease_duration_ms));

      return tx.tdrQualityJob.update({
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
    });
  }

  async heartbeat(jobId: string, workerInstanceId: string): Promise<void> {
    await this.prisma.tdrQualityJob.updateMany({
      where: { id: jobId, workerInstanceId, status: 'LEASED' },
      data: { lastHeartbeatAt: new Date() },
    });
  }

  async isLeaseOwned(jobId: string, workerInstanceId: string): Promise<boolean> {
    const job = await this.prisma.tdrQualityJob.findFirst({
      where: { id: jobId, workerInstanceId, status: 'LEASED' },
      select: { id: true },
    });
    return job !== null;
  }

  async completeJob(jobId: string, batchStatus: string): Promise<void> {
    const job = await this.prisma.tdrQualityJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', completedAt: new Date() },
      select: { batchId: true },
    });
    await this.prisma.tdrBatch.update({
      where: { id: job.batchId },
      data: { status: batchStatus as never, completedAt: new Date() },
    });
  }

  async failJob(jobId: string, errorMessage: string, errorCode?: string): Promise<void> {
    const job = await this.prisma.tdrQualityJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        errorMessage,
        ...(errorCode ? { errorCode } : {}),
        leasedAt: null,
        leaseExpiresAt: null,
        workerInstanceId: null,
        completedAt: new Date(),
      },
      select: { batchId: true },
    });
    await this.prisma.tdrBatch.update({
      where: { id: job.batchId },
      data: { status: 'FAILED' },
    });
  }

  async retryJob(
    jobId: string,
    workerInstanceId: string,
    errorMessage: string,
    errorCode?: string,
  ): Promise<void> {
    await this.prisma.tdrQualityJob.updateMany({
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
  }

  async reclaimExpiredLeases(): Promise<number> {
    const result = await this.prisma.tdrQualityJob.updateMany({
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
      this.logger.warn(`Reclaimed ${result.count} expired quality job lease(s)`);
    }
    return result.count;
  }

  /**
   * Ensures quality jobs exist and are PENDING for all stranded batches:
   * 1. QUALITY_PENDING batches with no quality job (original case)
   * 2. Batches with a FAILED quality job that still have PENDING_QUALITY records
   *    (quality processing crashed before completion — e.g., after a code-level bug fix)
   */
  async reconcileQualityJobs(): Promise<number> {
    const withoutJob = await this.prisma.tdrBatch.findMany({
      where: { status: 'QUALITY_PENDING', qualityJob: null },
      select: { id: true, tenantId: true },
    });

    const withFailedJob = await this.prisma.tdrBatch.findMany({
      where: {
        qualityJob: { status: 'FAILED' },
        records: { some: { rowDisposition: 'PENDING_QUALITY' } },
      },
      select: { id: true, tenantId: true },
    });

    const allStranded = [...withoutJob, ...withFailedJob];

    let reconciled = 0;
    for (const b of allStranded) {
      await this.ensureQualityJob(b.id, b.tenantId);
      reconciled++;
    }
    if (reconciled > 0) this.logger.log(`Reconciled ${reconciled} quality job(s) for stranded batches`);
    return reconciled;
  }
}
