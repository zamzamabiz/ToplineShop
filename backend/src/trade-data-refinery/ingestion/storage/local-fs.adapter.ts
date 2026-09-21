import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import type { Readable } from 'stream';
import type { IStorageAdapter, StorageObjectMetadata } from './i-storage.adapter';
import { isStorageKeySafe } from './storage-key.util';
import type { LocalStorageConfig } from './storage.config';

/**
 * LocalFsStorageAdapter — durable local-filesystem storage for TDR objects.
 *
 * Root directory is resolved from config (TDR_STORAGE_PATH).
 * Development default: {cwd}/uploads
 * Recommended local dev: D:\ToplineShopData\TDR
 *
 * NOT suitable for production without a reliable backup strategy.
 * Production: use S3StorageAdapter.
 */
export class LocalFsStorageAdapter implements IStorageAdapter {
  private readonly logger = new Logger(LocalFsStorageAdapter.name);
  private readonly root: string;

  constructor(config: LocalStorageConfig) {
    this.root = config.rootPath;
  }

  /** Resolve logical key to absolute path, guarded against traversal. */
  resolvePath(storageKey: string): string {
    if (!isStorageKeySafe(storageKey)) {
      throw new Error(`Unsafe storage key: ${storageKey}`);
    }
    return path.join(this.root, storageKey);
  }

  /**
   * Persist temp file to permanent storage.
   * Tries fs.renameSync first (atomic, same-volume).
   * On EXDEV (cross-volume rename), falls back to streaming copy + size verify + source removal.
   */
  async put(storageKey: string, tempPath: string): Promise<void> {
    const dest = this.resolvePath(storageKey);
    fs.mkdirSync(path.dirname(dest), { recursive: true });

    try {
      fs.renameSync(tempPath, dest);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'EXDEV') throw err;
      // Cross-volume: stream copy → size verify → remove source
      await this.streamCopy(tempPath, dest);
      const srcSize = fs.statSync(tempPath).size;
      const dstSize = fs.statSync(dest).size;
      if (srcSize !== dstSize) {
        await fs.promises.unlink(dest).catch(() => {});
        throw new Error(
          `Cross-volume copy verification failed for ${storageKey}: src=${srcSize} dst=${dstSize}`,
        );
      }
      await fs.promises.unlink(tempPath);
      this.logger.warn(`Cross-volume copy used for ${storageKey} (EXDEV fallback)`);
    }
  }

  getStream(storageKey: string): Readable {
    return fs.createReadStream(this.resolvePath(storageKey));
  }

  /** Returns the absolute local path for this key. Never null for local adapter. */
  getLocalPath(storageKey: string): string {
    return this.resolvePath(storageKey);
  }

  async exists(storageKey: string): Promise<boolean> {
    try {
      await fs.promises.access(this.resolvePath(storageKey), fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  async delete(storageKey: string): Promise<void> {
    try {
      const p = this.resolvePath(storageKey);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (err) {
      this.logger.warn(`delete failed for key ${storageKey}: ${String(err)}`);
    }
  }

  async copy(srcKey: string, dstKey: string): Promise<void> {
    const src = this.resolvePath(srcKey);
    const dst = this.resolvePath(dstKey);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    await this.streamCopy(src, dst);
    const srcSize = fs.statSync(src).size;
    const dstSize = fs.statSync(dst).size;
    if (srcSize !== dstSize) {
      await fs.promises.unlink(dst).catch(() => {});
      throw new Error(`copy verification failed: src=${srcSize} dst=${dstSize}`);
    }
  }

  async getMetadata(storageKey: string): Promise<StorageObjectMetadata | null> {
    try {
      const p = this.resolvePath(storageKey);
      const stat = fs.statSync(p);
      return { sizeBytes: stat.size };
    } catch {
      return null;
    }
  }

  async deleteTempSafe(tempPath: string): Promise<void> {
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch (err) {
      this.logger.warn(`deleteTempSafe failed for ${tempPath}: ${String(err)}`);
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
