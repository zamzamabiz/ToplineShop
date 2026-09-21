/**
 * Centralized storage configuration for TDR.
 *
 * Resolved once at startup; injected into adapters/validators.
 * Supports STORAGE_ADAPTER=local|s3.
 */

export type StorageAdapterType = 'local' | 's3';

export interface LocalStorageConfig {
  adapter: 'local';
  rootPath: string;
}

export interface S3StorageConfig {
  adapter: 's3';
  bucket: string;
  region: string;
  endpoint?: string; // for S3-compatible non-AWS endpoints
  accessKeyId: string;
  secretAccessKey: string;
  prefix?: string; // optional key prefix inside the bucket
}

export type StorageConfig = LocalStorageConfig | S3StorageConfig;

/**
 * Validates and resolves storage configuration from environment variables.
 * Called at application startup (from main.ts or StorageService constructor).
 *
 * Local:
 *   STORAGE_ADAPTER=local  (or unset — defaults to local)
 *   TDR_STORAGE_PATH=/absolute/path  (required for production local use)
 *
 * S3:
 *   STORAGE_ADAPTER=s3
 *   S3_BUCKET, S3_REGION required
 *   S3_ENDPOINT optional (for MinIO / Cloudflare R2 / etc.)
 *   S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY — must come from env/secrets, never hardcoded
 */
export function resolveStorageConfig(): StorageConfig {
  const adapterType = (process.env['STORAGE_ADAPTER'] ?? 'local') as StorageAdapterType;

  if (adapterType === 's3') {
    const bucket = process.env['S3_BUCKET'];
    const region = process.env['S3_REGION'];
    const accessKeyId = process.env['S3_ACCESS_KEY_ID'];
    const secretAccessKey = process.env['S3_SECRET_ACCESS_KEY'];

    if (!bucket) throw new Error('FATAL: S3_BUCKET is required when STORAGE_ADAPTER=s3');
    if (!region) throw new Error('FATAL: S3_REGION is required when STORAGE_ADAPTER=s3');
    if (!accessKeyId) throw new Error('FATAL: S3_ACCESS_KEY_ID is required when STORAGE_ADAPTER=s3');
    if (!secretAccessKey) throw new Error('FATAL: S3_SECRET_ACCESS_KEY is required when STORAGE_ADAPTER=s3');

    return {
      adapter: 's3',
      bucket,
      region,
      endpoint: process.env['S3_ENDPOINT'],
      accessKeyId,
      secretAccessKey,
      prefix: process.env['S3_KEY_PREFIX'],
    };
  }

  if (adapterType === 'local') {
    const rootPath = process.env['TDR_STORAGE_PATH'] ?? '';
    // In production local mode: require an explicit path (no cwd-relative fallback)
    const isProduction = process.env['NODE_ENV'] === 'production';
    if (isProduction && !rootPath) {
      throw new Error('FATAL: TDR_STORAGE_PATH must be set in production when STORAGE_ADAPTER=local');
    }
    return {
      adapter: 'local',
      rootPath: rootPath || require('path').join(process.cwd(), 'uploads'),
    };
  }

  throw new Error(`FATAL: Unknown STORAGE_ADAPTER="${adapterType}". Valid values: local, s3`);
}
