import * as path from 'path';

/**
 * Generates a server-side storage key from tenantId and sourceFileId.
 * Never includes user-supplied filename — prevents path traversal.
 */
export function generateStorageKey(tenantId: string, sourceFileId: string): string {
  return `${tenantId}/${sourceFileId}`;
}

/**
 * Returns true if the key is safe (no path traversal, absolute, or null bytes).
 */
export function isStorageKeySafe(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  if (key.includes('\0')) return false;
  if (key.includes('..')) return false;
  const normalized = key.replace(/\\/g, '/');
  if (normalized.startsWith('/') || path.isAbsolute(key)) return false;
  return true;
}
