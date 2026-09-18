import { BatchStatus } from '@prisma/client';

export const CANCELLABLE_STATUSES: BatchStatus[] = ['RECEIVED', 'QUEUED', 'PROCESSING'];

export const REPLAYABLE_STATUSES: BatchStatus[] = ['READY', 'PARTIAL', 'FAILED', 'EXPORTED'];

export const BATCH_STATUS_TRANSITIONS: Record<BatchStatus, BatchStatus[]> = {
  RECEIVED: ['QUEUED', 'CANCELLED', 'FAILED'],
  QUEUED: ['PROCESSING', 'CANCELLED', 'FAILED'],
  PROCESSING: ['REVIEW_REQUIRED', 'QUALITY_PENDING', 'READY', 'PARTIAL', 'FAILED', 'CANCELLED'],
  REVIEW_REQUIRED: ['PROCESSING', 'READY', 'PARTIAL', 'FAILED'],
  QUALITY_PENDING: ['PROCESSING', 'READY', 'FAILED'],
  READY: ['EXPORTING'],
  PARTIAL: ['EXPORTING'],
  FAILED: [],
  CANCELLED: [],
  EXPORTING: ['EXPORTED', 'FAILED'],
  EXPORTED: [],
};

export function isValidTransition(from: BatchStatus, to: BatchStatus): boolean {
  return BATCH_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
