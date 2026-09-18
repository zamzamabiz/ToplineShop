import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { TdrJobOrchestratorService } from './tdr-job-orchestrator.service';
import { TdrJobHandler, NOT_IMPLEMENTED } from '../types/tdr-job-handler.interface';

const POLL_INTERVAL_MS = 5000;
const RECLAIM_INTERVAL_MS = 60000;

@Injectable()
export class TdrProcessorService implements OnModuleDestroy {
  private readonly logger = new Logger(TdrProcessorService.name);
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private reclaimTimer: ReturnType<typeof setInterval> | null = null;
  private readonly workerInstanceId: string;
  private handler: TdrJobHandler | typeof NOT_IMPLEMENTED = NOT_IMPLEMENTED;

  constructor(private readonly orchestrator: TdrJobOrchestratorService) {
    this.workerInstanceId = `worker-${process.pid}-${Date.now()}`;
  }

  registerHandler(handler: TdrJobHandler): void {
    this.handler = handler;
  }

  startPolling(): void {
    if (this.pollTimer) return;
    this.logger.log(`TdrProcessorService starting poll loop (worker: ${this.workerInstanceId})`);
    this.pollTimer = setInterval(() => void this.poll(), POLL_INTERVAL_MS);
    this.reclaimTimer = setInterval(
      () => void this.orchestrator.reclaimExpiredLeases(),
      RECLAIM_INTERVAL_MS,
    );
  }

  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.reclaimTimer) {
      clearInterval(this.reclaimTimer);
      this.reclaimTimer = null;
    }
  }

  isPolling(): boolean {
    return this.pollTimer !== null;
  }

  onModuleDestroy(): void {
    this.stopPolling();
  }

  private async poll(): Promise<void> {
    try {
      const job = await this.orchestrator.leaseNextJob(this.workerInstanceId);
      if (!job) return;

      if (this.handler === NOT_IMPLEMENTED) {
        this.logger.warn(
          `No handler registered — releasing lease for job ${job.id} (batch ${job.batchId})`,
        );
        await this.orchestrator.releaseLease(job.id);
        return;
      }

      try {
        await (this.handler as TdrJobHandler).handle(job);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Job ${job.id} failed: ${message}`);
        await this.orchestrator.failJob(job.id, message);
      }
    } catch (err) {
      this.logger.error('Poll cycle error', err instanceof Error ? err.stack : String(err));
    }
  }
}
