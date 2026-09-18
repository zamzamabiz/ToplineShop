export interface ParsedRow {
  row: Record<string, string>;
  rowNumber: number;
}

export interface ParseResult {
  headers: string[];
  schemaFingerprint: string;
  totalRows: number;
}
