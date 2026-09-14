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

export type TdrSourceConfigState = "draft" | "ready" | "needs_review" | "disabled";
export type TdrSourceType = "CSV Import" | "XLSX Import" | "JSON Feed" | "REST API" | "SFTP Drop";
export type TdrIngestionSchedule = "Hourly" | "Daily" | "Weekly" | "Manual";

export interface TdrSourceConfig {
  id: string;
  name: string;
  healthStatus: TdrSourceStatus;
  configState: TdrSourceConfigState;
  sourceType: TdrSourceType;
  dataDomain: string;
  ownerTeam: string;
  dataFormat: string;
  schedule: TdrIngestionSchedule;
  expectedColumnsCount: number;
  mappingProfile: string;
  validationProfile: string;
  quarantineRule: string;
  ingestionMode: string;
  retentionNote: string;
  lastSeen: string;
  batchCount: number;
  notes: string;
}

export type TdrQuarantineSeverity = "warning" | "error" | "fatal";
export type TdrQuarantineReviewStatus =
  | "needs_review"
  | "accepted_suggestion"
  | "rejected_suggestion"
  | "cannot_auto_fix";

export interface TdrQuarantineRecord {
  id: string;
  batchId: string;
  sourceName: string;
  issueType: string;
  severity: TdrQuarantineSeverity;
  fieldAffected: string;
  originalValue: string;
  suggestedValue: string;
  whyQuarantined: string;
  recommendedAction: string;
  reviewStatus: TdrQuarantineReviewStatus;
}
