/** Defines how a single source column is mapped to a canonical TdrRecord field. */
export interface ColumnMapping {
  sourceColumnName: string;
  canonicalField: string;
  sourceDatatype: 'TEXT' | 'DATE' | 'DECIMAL' | 'INTEGER';
  transformationRule?: string;
  requiredPolicy: 'REQUIRED' | 'OPTIONAL' | 'CONDITIONAL';
  defaultValue?: string;
  validationRules: string[];
}

/** Top-level structure stored in TdrSchemaMapping.mappingConfig JSONB. */
export interface MappingConfigV1 {
  version: 'v1';
  localCountryCode?: string;
  columnMappings: ColumnMapping[];
}

/** Per-field provenance category stored in valueTreatmentMeta JSONB. */
export type ValueTreatment = 'SOURCE' | 'NORMALIZED' | 'DERIVED' | 'DEFAULTED' | 'CORRECTED';
