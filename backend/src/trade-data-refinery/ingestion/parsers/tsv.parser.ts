import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { computeSchemaFingerprint } from '../utils/schema-fingerprint.util';
import { MAX_CSV_ROWS, MAX_HEADER_COLS } from '../constants/ingestion.limits';
import { INGESTION_ERROR } from '../constants/ingestion-error.codes';
import { ParsedRow } from './parser.types';
import { validateHeaders } from './csv.parser';

export async function readTsvHeaders(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const parser = parse({ bom: true, delimiter: '\t', relax_column_count: true, to: 1 });
    const stream = createReadStream(filePath);
    let resolved = false;

    parser.on('readable', function () {
      let record: string[];
      while ((record = (this as ReturnType<typeof parse>).read() as string[]) !== null) {
        if (!resolved) {
          resolved = true;
          parser.destroy();
          stream.destroy();
          resolve(record.slice(0, MAX_HEADER_COLS));
        }
      }
    });

    parser.on('error', reject);
    parser.on('end', () => { if (!resolved) resolve([]); });
    stream.on('error', reject);
    stream.pipe(parser);
  });
}

export async function* streamTsvRows(filePath: string, headers: string[]): AsyncGenerator<ParsedRow> {
  const parser = parse({
    bom: true,
    delimiter: '\t',
    columns: headers,
    from_line: 2,
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
        new Error(`TSV exceeds maximum of ${MAX_CSV_ROWS} data rows`),
        { code: INGESTION_ERROR.ROW_LIMIT_EXCEEDED },
      );
    }
    yield { row: record as Record<string, string>, rowNumber };
  }
}

export async function getTsvSchemaFingerprint(filePath: string): Promise<{ headers: string[]; fingerprint: string }> {
  const headers = await readTsvHeaders(filePath);
  validateHeaders(headers);
  return { headers, fingerprint: computeSchemaFingerprint(headers) };
}
