import { createHash } from 'crypto';

export interface FingerprintParams {
  tenantId: string;
  contentHash: string;
  mappingVersion: string;
  parserVersion: string;
  normalizationVersion: string;
  validationVersion: string;
}

export function computeFingerprintHash(params: FingerprintParams): string {
  const input = [
    params.tenantId,
    params.contentHash,
    params.mappingVersion,
    params.parserVersion,
    params.normalizationVersion,
    params.validationVersion,
  ].join(':');
  return createHash('sha256').update(input).digest('hex');
}
