import { createHash } from 'crypto';

/**
 * Computes a deterministic 64-char hex fingerprint from sorted header names.
 * Column order in the source file does not affect the fingerprint.
 */
export function computeSchemaFingerprint(headers: string[]): string {
  const sorted = [...headers].map((h) => h.trim().toLowerCase()).sort();
  const canonical = sorted.join('\x00');
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}
