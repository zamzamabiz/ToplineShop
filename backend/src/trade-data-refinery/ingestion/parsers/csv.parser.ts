import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { computeSchemaFingerprint } from '../utils/schema-fingerprint.util';
import { MAX_CSV_ROWS, MAX_HEADER_COLS } from '../constants/ingestion.limits';
import { INGESTION_ERROR } from '../constants/ingestion-error.codes';
import { ParsedRow } from './parser.types';

/** Reads the header row from a CSV file and validates it. */
export async function readCsvHeaders(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const parser = parse({ bom: true, relax_column_count: true, to: 1 });
    const stream = createReadStream(filePath);
    let resolved = false;

    parser.on('readable', function () {
      let record: string[];
      while ((record = (this as ReturnType<typeof parse>).read() as string[]) !== null) {
        if (!resolved) {
          resolved = true;
          parser.destroy();
          stream.destroy();
          resolve(record);
        }
      }
    });

    parser.on('error', reject);
    parser.on('end', () => {
      if (!resolved) resolve([]);
    });

    stream.on('error', reject);
    stream.pipe(parser);
  });
}

/** Validates headers: non-empty list, no duplicate names, within column cap. */
export function validateHeaders(headers: string[]): void {
  if (headers.length === 0) {
    throw Object.assign(new Error('CSV file has no headers'), { code: INGESTION_ERROR.NO_HEADERS });
  }
  if (headers.length > MAX_HEADER_COLS) {
    throw Object.assign(
      new Error(`CSV exceeds maximum of ${MAX_HEADER_COLS} columns (found ${headers.length})`),
      { code: INGESTION_ERROR.MALFORMED_HEADER },
    );
  }
  const seen = new Set<string>();
  for (const h of headers) {
    const key = h.trim().toLowerCase();
    if (seen.has(key)) {
      throw Object.assign(new Error(`Duplicate header: "${h}"`), { code: INGESTION_ERROR.DUPLICATE_HEADER });
    }
    seen.add(key);
  }
}

/**
 * Streams data rows from a CSV file as an async generator.
 * Caller must consume the generator to completion to close the underlying stream.
 */
export async function* streamCsvRows(
  filePath: string,
  headers: string[],
): AsyncGenerator<ParsedRow> {
  const parser = parse({
    bom: true,
    columns: headers,
    from_line: 2, // skip header line; columns already known
    relax_column_count: true,
    cast: false,
    trim: false,
  });

  const stream = createReadStream(filePath);
  stream.pipe(parser);

  let rowNumber = 0;
  for await (const record of parser) {
    rowNumber++;
    if (rowNumber > MAX_CSV_ROWS) {
      stream.destroy();
      throw Object.assign(
        new Error(`CSV exceeds maximum of ${MAX_CSV_ROWS} data rows`),
        { code: INGESTION_ERROR.ROW_LIMIT_EXCEEDED },
      );
    }
    yield { row: record as Record<string, string>, rowNumber };
  }
}

/** Computes the schema fingerprint for a CSV file from its headers. */
export async function getCsvSchemaFingerprint(filePath: string): Promise<{ headers: string[]; fingerprint: string }> {
  const headers = await readCsvHeaders(filePath);
  validateHeaders(headers);
  return { headers, fingerprint: computeSchemaFingerprint(headers) };
}
