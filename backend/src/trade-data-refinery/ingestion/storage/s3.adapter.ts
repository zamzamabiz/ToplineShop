import { Logger } from '@nestjs/common';
import type { Readable } from 'stream';
import type { IStorageAdapter, StorageObjectMetadata } from './i-storage.adapter';
import type { S3StorageConfig } from './storage.config';

/**
 * S3StorageAdapter — S3-compatible object storage for TDR files.
 *
 * Supports AWS S3, MinIO, Cloudflare R2, or any S3-compatible endpoint.
 * Configuration via environment:
 *   S3_BUCKET, S3_REGION required
 *   S3_ENDPOINT optional (non-AWS endpoints)
 *   S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY — inject from secret manager
 *
 * Status: FOUNDATION — unit-tested via mocks.
 *         Live cloud deployment requires secret injection at deploy time.
 *         NOT tested against a live S3 endpoint in this task.
 *
 * Key prefix: all objects are stored under config.prefix (default: 'tdr/')
 * to namespace this application's objects within a shared bucket.
 *
 * Lifecycle / download:
 *   getStream() downloads the object and returns a readable stream.
 *   getLocalPath() returns null — S3 objects are not accessible by local path.
 *   Callers (e.g., ingestion parsers) must handle null and use getStream() instead.
 *   (Note: CSV/XLSX parsers currently require a local path; a future task will
 *    add streaming parser support for S3 adapter.)
 *
 * Signed URL download:
 *   The abstraction is designed to support signed URL generation via a future
 *   resolveDownload() method. For this task, downloads use streamed proxying.
 */
export class S3StorageAdapter implements IStorageAdapter {
  private readonly logger = new Logger(S3StorageAdapter.name);
  private readonly config: S3StorageConfig;
  private readonly keyPrefix: string;

  // Lazy-loaded AWS SDK client — imported only when adapter is used
  // so that the SDK is not required in dev/local mode.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _client: any = null;

  constructor(config: S3StorageConfig) {
    this.config = config;
    this.keyPrefix = config.prefix ?? 'tdr/';
  }

  private qualifiedKey(storageKey: string): string {
    return `${this.keyPrefix}${storageKey}`;
  }

  /** Lazy-load @aws-sdk/client-s3. Throws if not installed. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getClient(): Promise<any> {
    if (this._client) return this._client;
    try {
      // Dynamic import — SDK is an optional peer dep for S3 mode
      const { S3Client } = await import('@aws-sdk/client-s3');
      this._client = new S3Client({
        region: this.config.region,
        ...(this.config.endpoint ? { endpoint: this.config.endpoint } : {}),
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
        // Force path-style for non-AWS endpoints (MinIO, R2)
        ...(this.config.endpoint ? { forcePathStyle: true } : {}),
      });
      return this._client;
    } catch (err) {
      throw new Error(
        'S3StorageAdapter requires @aws-sdk/client-s3. Install it with: npm install @aws-sdk/client-s3\n' +
        String(err),
      );
    }
  }

  async put(storageKey: string, tempPath: string): Promise<void> {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const { createReadStream, statSync } = await import('fs');
    const client = await this.getClient();
    const stat = statSync(tempPath);
    await client.send(new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: this.qualifiedKey(storageKey),
      Body: createReadStream(tempPath),
      ContentLength: stat.size,
    }));
    // Remove temp file after successful upload
    try {
      const { unlink } = await import('fs/promises');
      await unlink(tempPath);
    } catch {
      this.logger.warn(`put: could not remove temp file ${tempPath} after S3 upload`);
    }
    this.logger.log(`S3 put: ${this.qualifiedKey(storageKey)} (${stat.size} bytes)`);
  }

  getStream(storageKey: string): Readable {
    // Synchronous return of a passthrough stream that will be filled asynchronously
    const { PassThrough } = require('stream') as typeof import('stream');
    const pt = new PassThrough();
    void (async () => {
      try {
        const { GetObjectCommand } = await import('@aws-sdk/client-s3');
        const client = await this.getClient();
        const result = await client.send(new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: this.qualifiedKey(storageKey),
        }));
        (result.Body as Readable).pipe(pt);
      } catch (err) {
        pt.destroy(err instanceof Error ? err : new Error(String(err)));
      }
    })();
    return pt;
  }

  /**
   * S3 objects have no local path. Returns null.
   * Callers (e.g., ingestion parsers) must use getStream() for S3 adapter.
   */
  getLocalPath(_storageKey: string): string | null {
    return null;
  }

  async exists(storageKey: string): Promise<boolean> {
    const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.getClient();
    try {
      await client.send(new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: this.qualifiedKey(storageKey),
      }));
      return true;
    } catch (err) {
      if ((err as Record<string, unknown>)['$metadata']?.['httpStatusCode'] === 404) return false;
      throw err;
    }
  }

  async delete(storageKey: string): Promise<void> {
    try {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const client = await this.getClient();
      await client.send(new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: this.qualifiedKey(storageKey),
      }));
    } catch (err) {
      this.logger.warn(`S3 delete failed for ${storageKey}: ${String(err)}`);
    }
  }

  async copy(srcKey: string, dstKey: string): Promise<void> {
    const { CopyObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.getClient();
    await client.send(new CopyObjectCommand({
      Bucket: this.config.bucket,
      CopySource: `${this.config.bucket}/${this.qualifiedKey(srcKey)}`,
      Key: this.qualifiedKey(dstKey),
    }));
  }

  async getMetadata(storageKey: string): Promise<StorageObjectMetadata | null> {
    const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.getClient();
    try {
      const result = await client.send(new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: this.qualifiedKey(storageKey),
      }));
      return {
        sizeBytes: result.ContentLength ?? 0,
        contentType: result.ContentType,
        etag: result.ETag,
      };
    } catch {
      return null;
    }
  }

  async deleteTempSafe(tempPath: string): Promise<void> {
    try {
      const { existsSync, unlinkSync } = await import('fs');
      if (existsSync(tempPath)) unlinkSync(tempPath);
    } catch (err) {
      this.logger.warn(`deleteTempSafe failed for ${tempPath}: ${String(err)}`);
    }
  }
}
