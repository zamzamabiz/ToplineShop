import * as fs from 'fs';
import * as path from 'path';
import { Injectable, Logger } from '@nestjs/common';
import { generateStorageKey, isStorageKeySafe } from './storage-key.util';

const DEFAULT_STORAGE_ROOT = path.join(process.cwd(), 'uploads');

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly storageRoot: string;

  constructor() {
    this.storageRoot = process.env['TDR_STORAGE_PATH'] || DEFAULT_STORAGE_ROOT;
  }

  generateKey(tenantId: string, sourceFileId: string): string {
    return generateStorageKey(tenantId, sourceFileId);
  }

  /** Absolute path on disk for a given storage key. */
  resolvePath(storageKey: string): string {
    if (!isStorageKeySafe(storageKey)) {
      throw new Error(`Unsafe storage key: ${storageKey}`);
    }
    return path.join(this.storageRoot, storageKey);
  }

  /** Move a temp file to permanent storage. Creates parent directories. */
  async persist(tempPath: string, storageKey: string): Promise<void> {
    const dest = this.resolvePath(storageKey);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(tempPath, dest);
  }

  /** Returns a readable stream for the stored file. */
  createReadStream(storageKey: string): fs.ReadStream {
    return fs.createReadStream(this.resolvePath(storageKey));
  }

  /** Full absolute path for a stored file (for parsers that need path string). */
  getFilePath(storageKey: string): string {
    return this.resolvePath(storageKey);
  }

  /** Deletes the permanent file, ignoring errors (best-effort compensation). */
  async removeSafe(storageKey: string): Promise<void> {
    try {
      const p = this.resolvePath(storageKey);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (err) {
      this.logger.warn(`removeSafe failed for key ${storageKey}: ${String(err)}`);
    }
  }

  /** Deletes a temp file, ignoring errors. */
  async removeTempSafe(tempPath: string): Promise<void> {
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch (err) {
      this.logger.warn(`removeTempSafe failed for ${tempPath}: ${String(err)}`);
    }
  }
}
