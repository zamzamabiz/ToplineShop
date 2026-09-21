import type { Readable } from 'stream';

/** Metadata returned by a storage adapter for an existing object. */
export interface StorageObjectMetadata {
  sizeBytes: number;
  contentType?: string;
  etag?: string;
}

/**
 * IStorageAdapter — storage abstraction for TDR source and export files.
 *
 * Business services must depend on this interface, not on concrete adapters.
 * Implementations:
 *   - LocalFsStorageAdapter  (STORAGE_ADAPTER=local, development)
 *   - S3StorageAdapter       (STORAGE_ADAPTER=s3, production)
 *
 * All storageKey values are logical, OS-independent, forward-slash paths.
 * They must never contain drive letters, absolute paths, or null bytes.
 */
export interface IStorageAdapter {
  /**
   * Persist a local temp file to permanent storage under the given logical key.
   * Implementations must handle cross-volume (EXDEV) scenarios safely.
   * After a successful put, the temp file may be removed by the implementation.
   */
  put(storageKey: string, tempPath: string): Promise<void>;

  /**
   * Return a readable stream for the stored object.
   * Throws if the object does not exist.
   */
  getStream(storageKey: string): Readable;

  /**
   * Return the local filesystem absolute path for the object, or null if the
   * adapter does not support direct path access (e.g., S3).
   * Callers that receive null must use getStream() for reading.
   */
  getLocalPath(storageKey: string): string | null;

  /** Return true if the object exists. */
  exists(storageKey: string): Promise<boolean>;

  /**
   * Remove the stored object.
   * Best-effort: implementations should not throw if the object is absent.
   */
  delete(storageKey: string): Promise<void>;

  /**
   * Copy an object from srcKey to dstKey within the same storage.
   * If dstKey exists it is overwritten.
   */
  copy(srcKey: string, dstKey: string): Promise<void>;

  /**
   * Return metadata for the stored object, or null if not found.
   * Used for integrity verification (size, etag).
   */
  getMetadata(storageKey: string): Promise<StorageObjectMetadata | null>;

  /**
   * Safely delete a local temp file.
   * Best-effort: never throws.
   */
  deleteTempSafe(tempPath: string): Promise<void>;
}
