import * as fs from 'fs';
import * as readline from 'readline';
import { computeSchemaFingerprint } from '../utils/schema-fingerprint.util';
import { MAX_JSON_ROWS } from '../constants/ingestion.limits';
import { INGESTION_ERROR } from '../constants/ingestion-error.codes';
import { ParsedRow } from './parser.types';
import { validateHeaders } from './csv.parser';

/**
 * Converts a JSON field value to string for TDR row storage.
 * Nested objects/arrays are rejected — the spec requires flat records.
 */
function jsonValueToString(v: unknown, key: string): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return String(v);
  if (typeof v === 'object') {
    throw Object.assign(
      new Error(`JSON field "${key}" contains a nested object or array — unsupported structure`),
      { code: INGESTION_ERROR.JSON_NESTED_STRUCTURE },
    );
  }
  return String(v);
}

/**
 * Reads a .json file and returns the records array.
 * Accepts: JSON array OR JSON object with a "records" array property.
 */
async function parseJsonFile(filePath: string): Promise<unknown[]> {
  let content: string;
  try {
    content = await fs.promises.readFile(filePath, 'utf8');
  } catch (err) {
    throw Object.assign(
      new Error(`Cannot read JSON file: ${err instanceof Error ? err.message : String(err)}`),
      { code: INGESTION_ERROR.STORAGE_READ_FAILED },
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    throw Object.assign(
      new Error(`Malformed JSON: ${err instanceof Error ? err.message : String(err)}`),
      { code: INGESTION_ERROR.JSON_PARSE_ERROR },
    );
  }

  if (Array.isArray(parsed)) return parsed;

  if (
    parsed !== null &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed) &&
    'records' in (parsed as Record<string, unknown>) &&
    Array.isArray((parsed as Record<string, unknown>)['records'])
  ) {
    return (parsed as Record<string, unknown>)['records'] as unknown[];
  }

  throw Object.assign(
    new Error('JSON must be an array of records or an object with a top-level "records" array property'),
    { code: INGESTION_ERROR.JSON_UNSUPPORTED_STRUCTURE },
  );
}

/** Extracts and deduplicates header keys from the first JSON record. */
export async function readJsonHeaders(filePath: string): Promise<string[]> {
  const records = await parseJsonFile(filePath);
  if (records.length === 0) return [];

  const first = records[0];
  if (first === null || typeof first !== 'object' || Array.isArray(first)) {
    throw Object.assign(
      new Error('JSON records must be objects (got a primitive or array at index 0)'),
      { code: INGESTION_ERROR.JSON_UNSUPPORTED_STRUCTURE },
    );
  }
  return Object.keys(first as Record<string, unknown>);
}

/** Streams data rows from a JSON file as a generator. rowNumber = 1-based array index. */
export async function* streamJsonRows(filePath: string): AsyncGenerator<ParsedRow> {
  const records = await parseJsonFile(filePath);

  for (let i = 0; i < records.length; i++) {
    if (i >= MAX_JSON_ROWS) {
      throw Object.assign(
        new Error(`JSON exceeds maximum of ${MAX_JSON_ROWS} data rows`),
        { code: INGESTION_ERROR.ROW_LIMIT_EXCEEDED },
      );
    }

    const record = records[i];
    if (record === null || typeof record !== 'object' || Array.isArray(record)) {
      throw Object.assign(
        new Error(`JSON record at index ${i} is not an object`),
        { code: INGESTION_ERROR.JSON_UNSUPPORTED_STRUCTURE },
      );
    }

    const row: Record<string, string> = {};
    for (const [key, val] of Object.entries(record as Record<string, unknown>)) {
      row[key] = jsonValueToString(val, key);
    }

    yield { row, rowNumber: i + 1 };
  }
}

/** Reads the first non-blank line of a NDJSON file and returns its keys as headers. */
export async function readNdjsonHeaders(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    let resolved = false;

    rl.on('line', (line) => {
      if (resolved) return;
      const trimmed = line.trim();
      if (!trimmed) return;

      try {
        const obj = JSON.parse(trimmed) as unknown;
        if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
          rl.close();
          stream.destroy();
          reject(Object.assign(
            new Error('NDJSON line 1 must be a JSON object'),
            { code: INGESTION_ERROR.NDJSON_INVALID_LINE },
          ));
          return;
        }
        resolved = true;
        rl.close();
        stream.destroy();
        resolve(Object.keys(obj as Record<string, unknown>));
      } catch (err) {
        rl.close();
        stream.destroy();
        reject(Object.assign(
          new Error(`Malformed NDJSON on line 1: ${err instanceof Error ? err.message : String(err)}`),
          { code: INGESTION_ERROR.JSON_PARSE_ERROR },
        ));
      }
    });

    rl.on('close', () => { if (!resolved) resolve([]); });
    rl.on('error', reject);
  });
}

/** Streams data rows from a NDJSON file. Blank lines are skipped. */
export async function* streamNdjsonRows(filePath: string): AsyncGenerator<ParsedRow> {
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let rowNumber = 0;
  let lineNumber = 0;

  for await (const line of rl) {
    lineNumber++;
    const trimmed = line.trim();
    if (!trimmed) continue;

    rowNumber++;
    if (rowNumber > MAX_JSON_ROWS) {
      rl.close();
      (stream as NodeJS.ReadableStream & { destroy?: () => void }).destroy?.();
      throw Object.assign(
        new Error(`NDJSON exceeds maximum of ${MAX_JSON_ROWS} data rows`),
        { code: INGESTION_ERROR.ROW_LIMIT_EXCEEDED },
      );
    }

    let obj: unknown;
    try {
      obj = JSON.parse(trimmed);
    } catch (err) {
      throw Object.assign(
        new Error(`Malformed NDJSON on line ${lineNumber}: ${err instanceof Error ? err.message : String(err)}`),
        { code: INGESTION_ERROR.NDJSON_INVALID_LINE },
      );
    }

    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      throw Object.assign(
        new Error(`NDJSON line ${lineNumber} is not a JSON object`),
        { code: INGESTION_ERROR.NDJSON_INVALID_LINE },
      );
    }

    const row: Record<string, string> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      row[key] = jsonValueToString(val, key);
    }

    yield { row, rowNumber };
  }
}

export async function getJsonSchemaFingerprint(filePath: string): Promise<{ headers: string[]; fingerprint: string }> {
  const headers = await readJsonHeaders(filePath);
  validateHeaders(headers);
  return { headers, fingerprint: computeSchemaFingerprint(headers) };
}

export async function getNdjsonSchemaFingerprint(filePath: string): Promise<{ headers: string[]; fingerprint: string }> {
  const headers = await readNdjsonHeaders(filePath);
  validateHeaders(headers);
  return { headers, fingerprint: computeSchemaFingerprint(headers) };
}
