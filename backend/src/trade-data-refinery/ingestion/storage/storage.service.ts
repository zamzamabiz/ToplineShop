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

  /**
   * Moves a temp file to permanent storage.
   * Tries fs.renameSync first (atomic, same-volume).
   * On EXDEV (cross-volume rename), falls back to a streaming copy + verify + delete source.
   * No full-file buffer is allocated during the copy.
   */
  async persist(tempPath: string, storageKey: string): Promise<void> {
    const dest = this.resolvePath(storageKey);
    fs.mkdirSync(path.dirname(dest), { recursive: true });

    try {
      fs.renameSync(tempPath, dest);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'EXDEV') throw err;

      // Cross-volume: stream copy → verify → remove source
      await this.streamCopy(tempPath, dest);

      const srcSize = fs.statSync(tempPath).size;
      const dstSize = fs.statSync(dest).size;
      if (srcSize !== dstSize) {
        await fs.promises.unlink(dest).catch(() => {});
        throw new Error(
          `Cross-volume copy verification failed for ${storageKey}: ` +
          `src=${srcSize} dst=${dstSize}`,
        );
      }

      await fs.promises.unlink(tempPath);
      this.logger.warn(`Cross-volume copy used for ${storageKey} (EXDEV fallback)`);
    }
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

  private streamCopy(src: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const readable = fs.createReadStream(src);
      const writable = fs.createWriteStream(dest);

      writable.on('finish', resolve);
      writable.on('error', (e) => { readable.destroy(); reject(e); });
      readable.on('error', (e) => { writable.destroy(); reject(e); });

      readable.pipe(writable);
    });
  }
}
