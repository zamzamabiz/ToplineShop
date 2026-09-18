import { createHash } from 'crypto';

/**
 * Computes a deterministic 64-char hex fingerprint from header names.
 * Column order does not affect the fingerprint (sort-stable).
 * Case is PRESERVED — "Importer" and "IMPORTER" are different schemas.
 * Trim surrounding whitespace; strip UTF-8 BOM from first header if present.
 */
export function computeSchemaFingerprint(headers: string[]): string {
  const normalized = headers.map((h, i) => {
    let v = h.trim();
    if (i === 0) v = v.replace(/^﻿/, ''); // strip BOM from first column
    return v;
  });
  const sorted = [...normalized].sort();
  const canonical = JSON.stringify(sorted);
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}
