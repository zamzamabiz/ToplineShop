/** Maximum upload size in bytes (500 MB). PM-001 OPEN — default pending PM decision. */
export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

/** Maximum XLSX data rows (headers excluded). Memory scales linearly. */
export const MAX_XLSX_ROWS = 2_000_000;

/** Maximum CSV data rows (headers excluded). Streaming — no memory cap from row count. */
export const MAX_CSV_ROWS = 10_000_000;

/** Number of rows persisted per DB transaction chunk. */
export const CHUNK_SIZE = 500;

/** Maximum number of header columns. Protects against pathological inputs. */
export const MAX_HEADER_COLS = 200;

/** Accepted file extensions (lowercase). */
export const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx'] as const;
export type AcceptedExtension = (typeof ACCEPTED_EXTENSIONS)[number];

/** Heartbeat interval in ms — how often the ingestion handler pings the job lease. */
export const HEARTBEAT_INTERVAL_MS = 30_000;
