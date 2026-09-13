export type TdrBatchStatus = "ACCEPTED" | "PARTIAL" | "FAILED" | "PROCESSING" | "QUEUED";
export type TdrSourceStatus = "ACTIVE" | "PAUSED" | "ATTENTION";
export type TdrViewState = "healthy" | "empty" | "loading" | "warning" | "failed" | "disabled";

export interface TdrMetrics {
  batchesReceived: number;
  recordsProcessed: number;
  recordsQuarantined: number;
  recordsPublished: number;
  dataQualityScore: number;
  lastSuccessfulRun: string | null;
}

export interface TdrBatch {
  id: string;
  sourceName: string;
  receivedAt: string;
  status: TdrBatchStatus;
  acceptedCount: number;
  quarantineCount: number;
}

export interface TdrQualitySummary {
  accepted: number;
  warning: number;
  error: number;
  fatal: number;
}

export interface TdrSourceHealth {
  id: string;
  name: string;
  status: TdrSourceStatus;
  lastSeen: string;
  batchCount: number;
}

export interface TdrMockScenario {
  metrics: TdrMetrics;
  batches: TdrBatch[];
  quality: TdrQualitySummary;
  sources: TdrSourceHealth[];
}
