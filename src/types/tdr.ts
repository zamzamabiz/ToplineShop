// Real backend types — replaces mock-only types from Frontend Preview mode.

export type TradeDirection = 'IMPORT' | 'EXPORT';
export type RowDisposition = 'ACCEPTED' | 'QUARANTINED' | 'REJECTED' | 'PENDING_QUALITY';
export type BatchStatus =
  | 'RECEIVED'
  | 'QUEUED'
  | 'PROCESSING'
  | 'REVIEW_REQUIRED'
  | 'READY'
  | 'PARTIAL'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPORTING'
  | 'EXPORTED'
  | 'QUALITY_PENDING';

// ── Batch ─────────────────────────────────────────────────────────────────────

export interface TdrBatch {
  id: string;
  status: BatchStatus;
  tradeDirection: TradeDirection;
  originalFilename: string | null;
  processedRows: number;
  acceptedRows: number;
  quarantinedRows: number;
  rejectedRows: number;
  totalSourceRows: number | null;
  replayOfBatchId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface TdrBatchProgress {
  batchId: string;
  status: BatchStatus;
  totalSourceRows: number | null;
  processedRows: number;
  acceptedRows: number;
  quarantinedRows: number;
  rejectedRows: number;
  percentComplete: number | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface BatchListResponse {
  batches: TdrBatch[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

// ── Quarantine ────────────────────────────────────────────────────────────────

export interface ValidationIssue {
  ruleCode: string;
  severity: 'ERROR' | 'WARNING' | 'BLOCKING';
  fieldName: string;
  rawValue: string | null;
  message: string;
}

// Issue-centric shape returned by GET /tdr/batches/:id/quarantine
export interface QuarantineIssue {
  id: string;
  recordId: string;
  fieldName: string;
  ruleCode: string;
  severity: 'ERROR' | 'WARNING' | 'BLOCKING';
  message: string;
  rawValue: string | null;
  status: string;
  createdAt: string;
  record: {
    id: string;
    sourceRowNumber: number;
    rowDisposition: RowDisposition;
    exportEligible: boolean;
    quarantineReviewRequired: boolean;
  };
}

export interface QuarantineListResponse {
  issues: QuarantineIssue[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Exports ───────────────────────────────────────────────────────────────────

export type ExportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface TdrExportJob {
  id: string;
  status: ExportStatus;
  rowCount: number | null;
  rowLimit: number;
  contentHash: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  total: number;
  accepted: number;
  quarantined: number;
  rejected: number;
  qualityRate: number | null;
  exportEligibleCount: number;
  valueAggregationUnsafe: true;
}

export interface TrendPoint {
  period: string;
  total: number;
  accepted: number;
  quarantined: number;
  rejected: number;
}

export interface TrendResponse {
  granularity: 'DAY' | 'MONTH' | 'YEAR';
  points: TrendPoint[];
}

export interface BreakdownItem {
  value: string | null;
  count: number;
}

export interface BreakdownResponse {
  dimension: string;
  items: BreakdownItem[];
}

export interface FilterOptions {
  tradeDirections: TradeDirection[];
  hsChapters: string[];
  foreignCountryCodes: string[];
  currencyCodes: string[];
  quantityUnitCodes: string[];
}

// ── Records ───────────────────────────────────────────────────────────────────

export interface TdrRecord {
  id: string;
  batchId: string;
  sourceRowNumber: number;
  tradeDirection: TradeDirection;
  tradeDate: string | null;
  hsCodeNormalized: string | null;
  hsChapter: string | null;
  productDescriptionNormalized: string | null;
  localPartyNameNormalized: string | null;
  localPartyTaxIdNormalized: string | null;
  foreignPartyNameNormalized: string | null;
  foreignPartyCountryCode: string | null;
  quantityNormalized: number | null;
  quantityUnitCode: string | null;
  unitPriceNormalized: number | null;
  currencyCode: string | null;
  rowDisposition: RowDisposition;
  exportEligible: boolean;
  createdAt: string;
}

export interface RecordsListResponse {
  records: TdrRecord[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ── Shared analytics filter ───────────────────────────────────────────────────

export interface AnalyticsFilter {
  dateFrom?: string;
  dateTo?: string;
  tradeDirection?: TradeDirection;
  hsCodePrefix?: string;
  hsChapter?: string;
  foreignCountryCode?: string;
  localPartyTaxId?: string;
  batchId?: string;
  dispositions?: RowDisposition[];
  currencyCode?: string;
  quantityUnitCode?: string;
  exportEligible?: boolean;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthLoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    userId: string;
    email: string;
    tenantId: string;
    roles: string[];
  };
}

// ── Status ────────────────────────────────────────────────────────────────────

export interface TdrStatus {
  moduleEnabled: boolean;
  batchSummary: Record<string, number>;
  processingVersions: Record<string, string>;
}

export interface CorrectionRequest {
  fieldName: string;
  correctedValue: string;
  note?: string;
}

export interface CreateExportRequest {
  batchId?: string;
  tradeDirection?: TradeDirection;
  dateFrom?: string;
  dateTo?: string;
  hsChapter?: string;
  hsCode?: string;
  foreignPartyCountryCode?: string;
  rowLimit?: number;
}

// ── Legacy types (used by orphaned Frontend Preview components) ───────────────

// Legacy mock statuses — distinct from real BatchStatus intentionally.
export type TdrBatchStatus = 'ACCEPTED' | 'PARTIAL' | 'FAILED' | 'PROCESSING' | 'QUEUED';
export type TdrSourceStatus = 'ACTIVE' | 'PAUSED' | 'ATTENTION';
export type TdrViewState = 'healthy' | 'empty' | 'loading' | 'warning' | 'failed' | 'disabled';
export type TdrEvidenceState = 'available' | 'stale' | 'missing' | 'unavailable';
export type TdrLineageStatus = 'accepted' | 'warning' | 'review' | 'blocked';
export type TdrQualitySeverity = 'warning' | 'error' | 'fatal';
export type TdrQualityDisposition = 'accepted' | 'corrected' | 'quarantined' | 'rejected';
export type TdrSourceConfigState = 'draft' | 'ready' | 'needs_review' | 'disabled';
export type TdrSourceType = 'CSV Import' | 'XLSX Import' | 'JSON Feed' | 'REST API' | 'SFTP Drop';
export type TdrIngestionSchedule = 'Hourly' | 'Daily' | 'Weekly' | 'Manual';
export type TdrQuarantineSeverity = 'warning' | 'error' | 'fatal';
export type TdrQuarantineReviewStatus =
  | 'needs_review'
  | 'accepted_suggestion'
  | 'rejected_suggestion'
  | 'cannot_auto_fix';

export interface TdrMetrics {
  batchesReceived: number;
  recordsProcessed: number;
  recordsQuarantined: number;
  recordsPublished: number;
  dataQualityScore: number;
  lastSuccessfulRun: string | null;
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

export interface TdrLineageStage {
  id: string;
  label: string;
  source: string;
  status: TdrLineageStatus;
  evidenceState: TdrEvidenceState;
  note: string;
}

export interface TdrQualityFinding {
  id: string;
  rule: string;
  severity: TdrQualitySeverity;
  disposition: TdrQualityDisposition;
  affectedCount: number;
  stage: string;
  evidenceId: string;
}

export interface TdrEvidenceItem {
  id: string;
  label: string;
  state: TdrEvidenceState;
  note: string;
}

export interface TdrLineageSummary {
  accepted: number;
  rejected: number;
  quarantined: number;
  corrected: number;
  qualityScore: number;
  lastUpdated: string | null;
  sourcesSynced: number;
}

export interface TdrLineageReport {
  summary: TdrLineageSummary;
  stages: TdrLineageStage[];
  findings: TdrQualityFinding[];
  evidence: TdrEvidenceItem[];
}

export interface TdrMockBatch {
  id: string;
  sourceName: string;
  receivedAt: string;
  status: TdrBatchStatus;
  acceptedCount: number;
  quarantineCount: number;
}

export interface TdrMockScenario {
  metrics: TdrMetrics;
  batches: TdrMockBatch[];
  quality: TdrQualitySummary;
  sources: TdrSourceHealth[];
  lineage: TdrLineageReport;
}

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
