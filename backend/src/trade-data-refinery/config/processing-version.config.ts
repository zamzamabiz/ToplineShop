export const TDR_PROCESSING_VERSIONS = {
  parser: '1.0.0',
  normalization: '1.0.0',
  validation: '1.0.0',
  mapping: '1.0.0',
} as const;

export type TdrProcessingVersions = typeof TDR_PROCESSING_VERSIONS;
