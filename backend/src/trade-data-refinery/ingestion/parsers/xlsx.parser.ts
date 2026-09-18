import * as ExcelJS from 'exceljs';
import { EventEmitter } from 'events';
import { computeSchemaFingerprint } from '../utils/schema-fingerprint.util';
import { MAX_XLSX_ROWS, MAX_HEADER_COLS } from '../constants/ingestion.limits';
import { ParsedRow } from './parser.types';
import { validateHeaders } from './csv.parser';

// exceljs streaming WorkbookReader/WorksheetReader do not expose EventEmitter
// methods in their TypeScript definitions. We cast via a typed intermediate.
type XlsxReaderEmitter = EventEmitter & { read(): Promise<void> };
type XlsxSheetEmitter = EventEmitter;

function xlsxCellToString(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object' && v !== null) {
    const obj = v as Record<string, unknown>;
    if (Array.isArray(obj['richText'])) {
      return (obj['richText'] as Array<{ text: string }>).map((rt) => rt.text).join('');
    }
    if ('result' in obj) return xlsxCellToString(obj['result']);
    if ('hyperlink' in obj && typeof obj['text'] === 'string') return obj['text'] as string;
    if ('error' in obj) return '';
  }
  return String(v);
}

interface XlsxReadResult {
  headers: string[];
  rows: string[][];
}

/** Reads headers and all data rows (bounded) from the first worksheet via streaming events. */
async function readXlsxRows(filePath: string): Promise<XlsxReadResult> {
  return new Promise((resolve, reject) => {
    const readerRaw = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {});
    const reader = readerRaw as unknown as XlsxReaderEmitter;

    const rows: string[][] = [];
    let headers: string[] = [];
    let firstRow = true;
    let sheetDone = false;

    reader.on('worksheet', (worksheetRaw: unknown) => {
      if (sheetDone) return;
      sheetDone = true;
      const worksheet = worksheetRaw as XlsxSheetEmitter;

      worksheet.on('row', (row: unknown) => {
        const exRow = row as ExcelJS.Row;
        const values = (exRow.values as unknown[]).slice(1); // exceljs rows are 1-indexed
        const stringValues = values.map(xlsxCellToString);

        if (firstRow) {
          headers = stringValues.map((s) => s.trim()).slice(0, MAX_HEADER_COLS);
          firstRow = false;
          return;
        }

        if (rows.length >= MAX_XLSX_ROWS) return;

        // Pad to header count; trim extra columns
        const normalized = headers.map((_, i) => stringValues[i] ?? '');
        rows.push(normalized);
      });

      worksheet.on('error', reject);
    });

    reader.on('end', () => resolve({ headers, rows }));
    reader.on('error', reject);

    reader.read().catch(reject);
  });
}

/**
 * Streams data rows from an XLSX file as an async generator.
 * Reads the first worksheet only. Bounded by MAX_XLSX_ROWS.
 * NOTE: Collects all rows in memory before yielding (bounded by 100MB file limit and row cap).
 */
export async function* streamXlsxRows(filePath: string): AsyncGenerator<ParsedRow> {
  const { headers, rows } = await readXlsxRows(filePath);
  validateHeaders(headers);

  for (let i = 0; i < rows.length; i++) {
    const record: Record<string, string> = {};
    headers.forEach((h, j) => {
      record[h] = rows[i][j] ?? '';
    });
    yield { row: record, rowNumber: i + 1 };
  }
}

/** Computes schema fingerprint from XLSX headers. */
export async function getXlsxSchemaFingerprint(
  filePath: string,
): Promise<{ headers: string[]; fingerprint: string }> {
  const { headers } = await readXlsxRows(filePath);
  validateHeaders(headers);
  return { headers, fingerprint: computeSchemaFingerprint(headers) };
}
