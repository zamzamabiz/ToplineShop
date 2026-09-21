import * as fs from 'fs';
import { Injectable, Logger } from '@nestjs/common';
import type { IStorageAdapter } from './i-storage.adapter';
import { LocalFsStorageAdapter } from './local-fs.adapter';
import { S3StorageAdapter } from './s3.adapter';
import { resolveStorageConfig } from './storage.config';
import { generateStorageKey } from './storage-key.util';

/**
 * StorageService — DI boundary for TDR storage operations.
 *
 * Acts as a facade that delegates to the configured IStorageAdapter
 * (LocalFsStorageAdapter or S3StorageAdapter).
 *
 * Consumers (UploadService, TdrIngestionHandlerService, TdrExportHandlerService,
 * TdrExportService) inject StorageService. The adapter is selected at startup
 * via STORAGE_ADAPTER env var (default: local).
 *
 * Backward-compatible API: persist(), createReadStream(), getFilePath(),
 * removeSafe(), removeTempSafe() are preserved.
 *
 * New API (via IStorageAdapter): put(), getStream(), exists(), delete(),
 * copy(), getMetadata(), deleteTempSafe().
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly adapter: IStorageAdapter;

  constructor() {
    const config = resolveStorageConfig();
    if (config.adapter === 's3') {
      this.adapter = new S3StorageAdapter(config);
    } else {
      this.adapter = new LocalFsStorageAdapter(config);
    }
    this.logger.log(`Storage adapter: ${config.adapter}`);
  }

  /** Expose the underlying adapter for DI consumers that need IStorageAdapter directly. */
  getAdapter(): IStorageAdapter {
    return this.adapter;
  }

  // ── Key generation ─────────────────────────────────────────────────────────

  /**
   * Generate a logical storage key for a source file.
   * Format: {tenantId}/{sourceFileId}  (backward-compatible with existing DB rows)
   */
  generateKey(tenantId: string, sourceFileId: string): string {
    return generateStorageKey(tenantId, sourceFileId);
  }

  // ── Backward-compatible API ────────────────────────────────────────────────

  /**
   * Persist a temp file to permanent storage under the given logical key.
   * Delegates to adapter.put().
   */
  async persist(tempPath: string, storageKey: string): Promise<void> {
    return this.adapter.put(storageKey, tempPath);
  }

  /**
   * Return a readable stream for the stored file.
   * Delegates to adapter.getStream().
   */
  createReadStream(storageKey: string): fs.ReadStream {
    return this.adapter.getStream(storageKey) as fs.ReadStream;
  }

  /**
   * Return the absolute local path for a stored file.
   * Only valid when STORAGE_ADAPTER=local. Throws for S3 adapter.
   * Note: prefer streaming (createReadStream) where possible. The local path
   * is required by CSV/XLSX parsers that accept a file path string.
   */
  getFilePath(storageKey: string): string {
    const localPath = this.adapter.getLocalPath(storageKey);
    if (!localPath) {
      throw new Error(
        `getFilePath() is not supported for the configured storage adapter. ` +
        `Use createReadStream() instead. (storageKey: ${storageKey})`,
      );
    }
    return localPath;
  }

  /**
   * Delete the permanent object. Best-effort — never throws.
   */
  async removeSafe(storageKey: string): Promise<void> {
    return this.adapter.delete(storageKey);
  }

  /**
   * Delete a local temp file. Best-effort — never throws.
   */
  async removeTempSafe(tempPath: string): Promise<void> {
    return this.adapter.deleteTempSafe(tempPath);
  }

  // ── New adapter API ─────────────────────────────────────────────────────────

  async exists(storageKey: string): Promise<boolean> {
    return this.adapter.exists(storageKey);
  }

  async copy(srcKey: string, dstKey: string): Promise<void> {
    return this.adapter.copy(srcKey, dstKey);
  }

  async getMetadata(storageKey: string) {
    return this.adapter.getMetadata(storageKey);
  }
}
