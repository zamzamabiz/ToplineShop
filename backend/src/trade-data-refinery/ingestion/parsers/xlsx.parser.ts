import * as ExcelJS from 'exceljs';
import { EventEmitter } from 'events';
import { computeSchemaFingerprint } from '../utils/schema-fingerprint.util';
import { MAX_XLSX_ROWS, MAX_HEADER_COLS } from '../constants/ingestion.limits';
import { ParsedRow } from './parser.types';
import { validateHeaders } from './csv.parser';
import { INGESTION_ERROR } from '../constants/ingestion-error.codes';

// exceljs streaming WorkbookReader/WorksheetReader implement Symbol.asyncIterator
// at runtime (documented API), but TypeScript definitions do not declare it.
// Cast via unknown so for-await-of compiles without type errors.
type XlsxWorkbookIterable = AsyncIterable<AsyncIterable<ExcelJS.Row>>;

// Event-based cast retained for header-only read (single 'row' event, then resolve).
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

/**
 * Reads only the first row (headers) from the first worksheet.
 * Uses the EventEmitter API to resolve immediately on the first row event,
 * avoiding full-file accumulation while staying within the known-safe event path.
 */
export async function readXlsxHeaders(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const readerRaw = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {});
    const reader = readerRaw as unknown as XlsxReaderEmitter;
    let resolved = false;

    reader.on('worksheet', (worksheetRaw: unknown) => {
      if (resolved) return;
      const worksheet = worksheetRaw as XlsxSheetEmitter;

      worksheet.once('row', (row: unknown) => {
        const exRow = row as ExcelJS.Row;
        const values = (exRow.values as unknown[]).slice(1);
        const headers = values
          .map(xlsxCellToString)
          .map((s) => s.trim())
          .slice(0, MAX_HEADER_COLS);
        resolved = true;
        resolve(headers);
      });

      worksheet.on('error', reject);
    });

    reader.on('end', () => {
      if (!resolved) resolve([]);
    });
    reader.on('error', reject);
    reader.read().catch(reject);
  });
}

/**
 * Streams data rows from the first XLSX worksheet as an AsyncGenerator.
 *
 * Memory guarantee: uses for-await-of on exceljs's AsyncIterable API so rows
 * flow one at a time into the caller — there is no rows:string[][] array
 * proportional to workbook size. The caller's chunk buffer (CHUNK_SIZE ≈ 500)
 * is the only application-level accumulation.
 *
 * The file is read independently of readXlsxHeaders (two passes), which avoids
 * keeping a long-lived stream handle open between the header-check phase and the
 * ingestion phase.
 */
export async function* streamXlsxRows(
  filePath: string,
  headers: string[],
): AsyncGenerator<ParsedRow> {
  const reader = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {});

  for await (const worksheet of reader as unknown as XlsxWorkbookIterable) {
    let firstRow = true;
    let rowNumber = 0;

    for await (const row of worksheet) {
      if (firstRow) {
        firstRow = false;
        continue; // header row — already processed by readXlsxHeaders
      }

      rowNumber++;
      if (rowNumber > MAX_XLSX_ROWS) {
        throw Object.assign(
          new Error(`XLSX exceeds maximum of ${MAX_XLSX_ROWS} data rows`),
          { code: INGESTION_ERROR.ROW_LIMIT_EXCEEDED },
        );
      }

      const values = (row.values as unknown[]).slice(1);
      const record: Record<string, string> = {};
      headers.forEach((h, j) => {
        record[h] = xlsxCellToString(values[j]);
      });

      yield { row: record, rowNumber };
    }

    break; // first worksheet only
  }
}

/** Reads XLSX headers and computes schema fingerprint. Lightweight (one header-row read). */
export async function getXlsxSchemaFingerprint(
  filePath: string,
): Promise<{ headers: string[]; fingerprint: string }> {
  const headers = await readXlsxHeaders(filePath);
  validateHeaders(headers);
  return { headers, fingerprint: computeSchemaFingerprint(headers) };
}
