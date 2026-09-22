/** Rows processed per quality DB transaction chunk. */
export const QUALITY_CHUNK_SIZE = 500;

/** Max parameters per row in the bulk VALUES update. Must not exceed PG 65535 limit. */
export const QUALITY_UPDATE_PARAMS_PER_ROW = 32;

/** Max rows per chunk (derived safety check: 500 * 32 = 16000 < 65535). */
export const QUALITY_MAX_CHUNK_ROWS = Math.floor(65000 / QUALITY_UPDATE_PARAMS_PER_ROW);

/** Default export row limit (configurable). */
export const DEFAULT_EXPORT_ROW_LIMIT = 100_000;

/** Maximum export row limit — allows full export of large batches (e.g. 177k rows). */
export const MAX_EXPORT_ROW_LIMIT = 1_000_000;

/** Export CSV write chunk (rows fetched/written at a time). */
export const EXPORT_CHUNK_SIZE = 1_000;

/** Lease duration for quality jobs (5 minutes). */
export const QUALITY_LEASE_DURATION_MS = 300_000;

/** Lease duration for export jobs (10 minutes). */
export const EXPORT_LEASE_DURATION_MS = 600_000;

/** Heartbeat interval (30 s). */
export const QUALITY_HEARTBEAT_INTERVAL_MS = 30_000;

/** Quality worker poll interval (5 s). */
export const QUALITY_POLL_INTERVAL_MS = 5_000;

/** Lease reclaim check interval (60 s). */
export const QUALITY_RECLAIM_INTERVAL_MS = 60_000;

/** Supported normalization version. */
export const SUPPORTED_NORMALIZATION_VERSION = '1.0.0';

/** Supported validation version. */
export const SUPPORTED_VALIDATION_VERSION = '1.0.0';

/** Max quarantine page size. */
export const MAX_QUARANTINE_PAGE_SIZE = 100;

/** Max export filter dateFrom/dateTo string length. */
export const MAX_DATE_STRING_LENGTH = 20;
