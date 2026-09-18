import { createHash } from 'crypto';

/**
 * Computes a deterministic SHA-256 hash for a row.
 * Uses sorted header names to ensure column-order independence.
 * Preserves raw string values — no coercion.
 */
export function computeRowHash(row: Record<string, string>): string {
  const sortedKeys = Object.keys(row).sort();
  const canonical = sortedKeys.map((k) => `${k}=${row[k] ?? ''}`).join('\x00');
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}
