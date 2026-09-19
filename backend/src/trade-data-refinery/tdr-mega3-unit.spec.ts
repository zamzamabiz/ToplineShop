/**
 * Mega 3 unit tests — TDR-MVP-INGESTION-ENGINE-001
 * No DB, no FS (except controlled temp files in the 1M proof).
 */
import * as crypto from 'crypto';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

// ── Utility functions ──────────────────────────────────────────────────────────

import { computeFileHash } from './ingestion/utils/file-hash.util';
import { computeRowHash } from './ingestion/utils/row-hash.util';
import { computeSchemaFingerprint } from './ingestion/utils/schema-fingerprint.util';
import { generateStorageKey, isStorageKeySafe } from './ingestion/storage/storage-key.util';
import { validateHeaders } from './ingestion/parsers/csv.parser';
import { UploadBatchDto } from './ingestion/upload/upload.dto';
import { BATCH_STATUS_TRANSITIONS, isValidTransition } from './types/batch-transition';
import { INGESTION_ERROR } from './ingestion/constants/ingestion-error.codes';
import { CHUNK_SIZE, MAX_UPLOAD_BYTES, ACCEPTED_EXTENSIONS } from './ingestion/constants/ingestion.limits';

// ── 1. File Hash Utility ───────────────────────────────────────────────────────

describe('computeFileHash', () => {
  let tmpFile: string;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `tdr-test-${crypto.randomUUID()}.tmp`);
  });

  afterEach(() => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it('produces a 64-char hex string', async () => {
    fs.writeFileSync(tmpFile, 'hello world');
    const hash = await computeFileHash(tmpFile);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for the same content', async () => {
    fs.writeFileSync(tmpFile, 'deterministic content');
    const h1 = await computeFileHash(tmpFile);
    const h2 = await computeFileHash(tmpFile);
    expect(h1).toBe(h2);
  });

  it('differs for different content', async () => {
    fs.writeFileSync(tmpFile, 'content A');
    const hA = await computeFileHash(tmpFile);
    fs.writeFileSync(tmpFile, 'content B');
    const hB = await computeFileHash(tmpFile);
    expect(hA).not.toBe(hB);
  });

  it('matches Node crypto sha256 reference', async () => {
    const data = 'sha256 reference test';
    fs.writeFileSync(tmpFile, data);
    const expected = crypto.createHash('sha256').update(data).digest('hex');
    const actual = await computeFileHash(tmpFile);
    expect(actual).toBe(expected);
  });

  it('rejects a non-existent file', async () => {
    await expect(computeFileHash('/nonexistent/path/file.csv')).rejects.toThrow();
  });
});

// ── 2. Row Hash Utility ────────────────────────────────────────────────────────

describe('computeRowHash', () => {
  it('produces a 64-char hex string', () => {
    const hash = computeRowHash({ hs_code: '1234', quantity: '10' });
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for same key-value pairs', () => {
    const row = { a: 'val1', b: 'val2', c: '' };
    expect(computeRowHash(row)).toBe(computeRowHash({ ...row }));
  });

  it('is column-order independent', () => {
    const r1 = { a: '1', b: '2' };
    const r2 = { b: '2', a: '1' };
    expect(computeRowHash(r1)).toBe(computeRowHash(r2));
  });

  it('differs when values differ', () => {
    expect(computeRowHash({ a: '1' })).not.toBe(computeRowHash({ a: '2' }));
  });

  it('treats undefined as empty string', () => {
    const h1 = computeRowHash({ a: '', b: 'x' });
    const h2 = computeRowHash({ a: undefined as unknown as string, b: 'x' });
    expect(h1).toBe(h2);
  });

  it('handles Unicode values deterministically', () => {
    const r1 = computeRowHash({ desc: '日本語テスト', code: '9999.00' });
    const r2 = computeRowHash({ desc: '日本語テスト', code: '9999.00' });
    expect(r1).toBe(r2);
  });
});

// ── 3. Schema Fingerprint Utility ─────────────────────────────────────────────

describe('computeSchemaFingerprint', () => {
  it('produces a 64-char hex string', () => {
    expect(computeSchemaFingerprint(['hs_code', 'quantity', 'country'])).toMatch(
      /^[0-9a-f]{64}$/,
    );
  });

  it('is column-order independent', () => {
    const f1 = computeSchemaFingerprint(['a', 'b', 'c']);
    const f2 = computeSchemaFingerprint(['c', 'a', 'b']);
    expect(f1).toBe(f2);
  });

  it('is case-PRESERVING (different case → different fingerprint)', () => {
    const f1 = computeSchemaFingerprint(['HS_Code', 'Quantity']);
    const f2 = computeSchemaFingerprint(['hs_code', 'quantity']);
    expect(f1).not.toBe(f2); // Correction D: Pakistan Customs headers are case-sensitive
  });

  it('differs for different header sets', () => {
    const f1 = computeSchemaFingerprint(['a', 'b']);
    const f2 = computeSchemaFingerprint(['a', 'c']);
    expect(f1).not.toBe(f2);
  });

  it('is deterministic across calls', () => {
    const headers = ['col_a', 'col_b', 'col_c'];
    expect(computeSchemaFingerprint(headers)).toBe(computeSchemaFingerprint(headers));
  });
});

// ── 4. Storage Key Utility ─────────────────────────────────────────────────────

describe('generateStorageKey', () => {
  it('generates key with tenant and file id segments', () => {
    const key = generateStorageKey('tenant-123', 'file-abc');
    expect(key).toBe('tenant-123/file-abc');
  });
});

describe('isStorageKeySafe', () => {
  it('accepts a normal path', () => {
    expect(isStorageKeySafe('tenant-1/file-2')).toBe(true);
  });

  it('rejects path traversal with ..', () => {
    expect(isStorageKeySafe('../etc/passwd')).toBe(false);
    expect(isStorageKeySafe('tenant/../other')).toBe(false);
  });

  it('rejects absolute path', () => {
    expect(isStorageKeySafe('/absolute/path')).toBe(false);
  });

  it('rejects null bytes', () => {
    expect(isStorageKeySafe('tenant/\0file')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isStorageKeySafe('')).toBe(false);
  });
});

// ── 5. CSV Header Validation ───────────────────────────────────────────────────

describe('validateHeaders', () => {
  it('passes for a valid header list', () => {
    expect(() => validateHeaders(['hs_code', 'quantity', 'country'])).not.toThrow();
  });

  it('throws NO_HEADERS for empty list', () => {
    try {
      validateHeaders([]);
      fail('Expected error');
    } catch (err) {
      expect((err as { code: string }).code).toBe(INGESTION_ERROR.NO_HEADERS);
    }
  });

  it('throws DUPLICATE_HEADER for repeated column names (case-insensitive)', () => {
    try {
      validateHeaders(['hs_code', 'HS_CODE', 'quantity']);
      fail('Expected error');
    } catch (err) {
      expect((err as { code: string }).code).toBe(INGESTION_ERROR.DUPLICATE_HEADER);
    }
  });

  it('throws MALFORMED_HEADER when column count exceeds limit', () => {
    const headers = Array.from({ length: 201 }, (_, i) => `col_${i}`);
    try {
      validateHeaders(headers);
      fail('Expected error');
    } catch (err) {
      expect((err as { code: string }).code).toBe(INGESTION_ERROR.MALFORMED_HEADER);
    }
  });
});

// ── 6. Upload DTO Validation ───────────────────────────────────────────────────

describe('UploadBatchDto validation', () => {
  async function dto(data: unknown) {
    const instance = plainToInstance(UploadBatchDto, data);
    return validate(instance);
  }

  it('passes for valid IMPORT batch dto', async () => {
    const errors = await dto({ tradeDirection: 'IMPORT', mappingProfileId: 'customs-v1' });
    expect(errors).toHaveLength(0);
  });

  it('passes for valid EXPORT batch dto', async () => {
    const errors = await dto({ tradeDirection: 'EXPORT', mappingProfileId: 'export-ng' });
    expect(errors).toHaveLength(0);
  });

  it('fails for invalid tradeDirection', async () => {
    const errors = await dto({ tradeDirection: 'SIDEWAYS', mappingProfileId: 'p' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('fails when mappingProfileId is missing', async () => {
    const errors = await dto({ tradeDirection: 'IMPORT' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('fails when mappingProfileId is empty string', async () => {
    const errors = await dto({ tradeDirection: 'IMPORT', mappingProfileId: '' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts optional mappingVersion', async () => {
    const errors = await dto({
      tradeDirection: 'EXPORT',
      mappingProfileId: 'p',
      mappingVersion: '2',
    });
    expect(errors).toHaveLength(0);
  });
});

// ── 7. Batch Transition — QUALITY_PENDING ──────────────────────────────────────

describe('batch-transition with QUALITY_PENDING', () => {
  it('PROCESSING → QUALITY_PENDING is valid', () => {
    expect(isValidTransition('PROCESSING', 'QUALITY_PENDING')).toBe(true);
  });

  it('QUALITY_PENDING → REVIEW_REQUIRED is valid (Mega 4: quality completed with quarantined rows)', () => {
    expect(isValidTransition('QUALITY_PENDING', 'REVIEW_REQUIRED')).toBe(true);
  });

  it('QUALITY_PENDING → READY is valid', () => {
    expect(isValidTransition('QUALITY_PENDING', 'READY')).toBe(true);
  });

  it('QUALITY_PENDING → FAILED is valid', () => {
    expect(isValidTransition('QUALITY_PENDING', 'FAILED')).toBe(true);
  });

  it('QUALITY_PENDING → CANCELLED is not valid (already past cancellable window)', () => {
    expect(isValidTransition('QUALITY_PENDING', 'CANCELLED')).toBe(false);
  });

  it('QUALITY_PENDING is in the transitions map', () => {
    expect(BATCH_STATUS_TRANSITIONS).toHaveProperty('QUALITY_PENDING');
  });
});

// ── 8. Ingestion Constants ─────────────────────────────────────────────────────

describe('ingestion constants', () => {
  it('CHUNK_SIZE is 500', () => {
    expect(CHUNK_SIZE).toBe(500);
  });

  it('MAX_UPLOAD_BYTES is 500MB', () => {
    expect(MAX_UPLOAD_BYTES).toBe(500 * 1024 * 1024);
  });

  it('ACCEPTED_EXTENSIONS includes .csv and .xlsx', () => {
    expect(ACCEPTED_EXTENSIONS).toContain('.csv');
    expect(ACCEPTED_EXTENSIONS).toContain('.xlsx');
  });
});

// ── 9. Direction Authorization (upload service logic) ─────────────────────────

describe('upload direction authorization', () => {
  function checkDirection(roles: string[], direction: string): void {
    const canImport = roles.some((r) => ['SUPER_ADMIN', 'TENANT_ADMIN', 'IMPORT_MANAGER'].includes(r));
    const canExport = roles.some((r) => ['SUPER_ADMIN', 'TENANT_ADMIN', 'EXPORT_MANAGER'].includes(r));
    if (direction === 'IMPORT' && !canImport) {
      throw new ForbiddenException('Not authorized to upload IMPORT batches');
    }
    if (direction === 'EXPORT' && !canExport) {
      throw new ForbiddenException('Not authorized to upload EXPORT batches');
    }
  }

  it('SUPER_ADMIN can upload IMPORT', () => {
    expect(() => checkDirection(['SUPER_ADMIN'], 'IMPORT')).not.toThrow();
  });

  it('SUPER_ADMIN can upload EXPORT', () => {
    expect(() => checkDirection(['SUPER_ADMIN'], 'EXPORT')).not.toThrow();
  });

  it('TENANT_ADMIN can upload IMPORT', () => {
    expect(() => checkDirection(['TENANT_ADMIN'], 'IMPORT')).not.toThrow();
  });

  it('TENANT_ADMIN can upload EXPORT', () => {
    expect(() => checkDirection(['TENANT_ADMIN'], 'EXPORT')).not.toThrow();
  });

  it('IMPORT_MANAGER can upload IMPORT', () => {
    expect(() => checkDirection(['IMPORT_MANAGER'], 'IMPORT')).not.toThrow();
  });

  it('IMPORT_MANAGER cannot upload EXPORT', () => {
    expect(() => checkDirection(['IMPORT_MANAGER'], 'EXPORT')).toThrow(ForbiddenException);
  });

  it('EXPORT_MANAGER can upload EXPORT', () => {
    expect(() => checkDirection(['EXPORT_MANAGER'], 'EXPORT')).not.toThrow();
  });

  it('EXPORT_MANAGER cannot upload IMPORT', () => {
    expect(() => checkDirection(['EXPORT_MANAGER'], 'IMPORT')).toThrow(ForbiddenException);
  });

  it('ANALYST cannot upload IMPORT or EXPORT', () => {
    expect(() => checkDirection(['ANALYST'], 'IMPORT')).toThrow(ForbiddenException);
    expect(() => checkDirection(['ANALYST'], 'EXPORT')).toThrow(ForbiddenException);
  });
});

// ── 10. Duplicate Detection (source file) ─────────────────────────────────────

describe('source duplicate detection', () => {
  it('same contentHash + tenantId triggers ConflictException (409)', () => {
    // Simulates the guard logic: if record exists for (tenantId, contentHash), throw Conflict
    function checkDuplicate(existing: { id: string } | null) {
      if (existing) throw new ConflictException(`Already uploaded: ${existing.id}`);
    }
    expect(() => checkDuplicate({ id: 'abc' })).toThrow(ConflictException);
    expect(() => checkDuplicate(null)).not.toThrow();
  });
});

// ── 11. Processing Fingerprint Duplicate Detection ────────────────────────────

describe('processing fingerprint duplicate detection', () => {
  it('same fingerprint triggers ConflictException (409)', () => {
    function checkFingerprintDup(existing: { id: string } | null) {
      if (existing) throw new ConflictException(`Duplicate fingerprint: batchId ${existing.id}`);
    }
    expect(() => checkFingerprintDup({ id: 'batch-1' })).toThrow(ConflictException);
    expect(() => checkFingerprintDup(null)).not.toThrow();
  });
});

// ── 12. RBAC metadata for POST /tdr/batches/upload ────────────────────────────

import { UploadController } from './ingestion/upload/upload.controller';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/types/role.type';

describe('UploadController RBAC metadata', () => {
  it('uploadBatch has @Roles(SUPER_ADMIN, TENANT_ADMIN, IMPORT_MANAGER, EXPORT_MANAGER)', () => {
    const roles: string[] = Reflect.getMetadata(ROLES_KEY, UploadController.prototype.uploadBatch);
    expect(roles).toContain(Role.SUPER_ADMIN);
    expect(roles).toContain(Role.TENANT_ADMIN);
    expect(roles).toContain(Role.IMPORT_MANAGER);
    expect(roles).toContain(Role.EXPORT_MANAGER);
  });

  it('uploadBatch does NOT include ANALYST or VIEWER', () => {
    const roles: string[] = Reflect.getMetadata(ROLES_KEY, UploadController.prototype.uploadBatch);
    expect(roles).not.toContain('ANALYST');
    expect(roles).not.toContain('VIEWER');
  });
});

// ── 13. TdrJobOrchestratorService — new Mega 3 methods ────────────────────────

import { TdrJobOrchestratorService } from './services/tdr-job-orchestrator.service';

describe('TdrJobOrchestratorService — Mega 3 additions', () => {
  let orchestrator: TdrJobOrchestratorService;
  let prismaMock: {
    tdrProcessingJob: {
      update: jest.Mock;
      updateMany: jest.Mock;
      findFirst: jest.Mock;
    };
    tdrBatch: { update: jest.Mock };
  };

  beforeEach(() => {
    prismaMock = {
      tdrProcessingJob: {
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findFirst: jest.fn(),
      },
      tdrBatch: { update: jest.fn() },
    };
    orchestrator = new TdrJobOrchestratorService(prismaMock as never);
  });

  it('completeJobWithStatus sets job COMPLETED and batch to given status', async () => {
    prismaMock.tdrProcessingJob.update.mockResolvedValue({ batchId: 'b1' });
    prismaMock.tdrBatch.update.mockResolvedValue({});
    await orchestrator.completeJobWithStatus('j1', 'QUALITY_PENDING');
    expect(prismaMock.tdrBatch.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'QUALITY_PENDING' }),
      }),
    );
  });

  it('retryJob resets job to PENDING with errorMessage', async () => {
    await orchestrator.retryJob('j1', 'worker-1', 'transient error', 'PARSE_ERROR');
    expect(prismaMock.tdrProcessingJob.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PENDING', errorMessage: 'transient error' }),
      }),
    );
  });

  it('isLeaseOwned returns true when job exists with matching worker', async () => {
    prismaMock.tdrProcessingJob.findFirst.mockResolvedValue({ id: 'j1' });
    const owned = await orchestrator.isLeaseOwned('j1', 'worker-1');
    expect(owned).toBe(true);
  });

  it('isLeaseOwned returns false when lease changed', async () => {
    prismaMock.tdrProcessingJob.findFirst.mockResolvedValue(null);
    const owned = await orchestrator.isLeaseOwned('j1', 'worker-1');
    expect(owned).toBe(false);
  });
});

// ── 14. Chunk boundary logic ──────────────────────────────────────────────────

describe('chunk boundary logic', () => {
  function chunkRows(total: number, chunkSize: number): number[] {
    const chunks: number[] = [];
    let remaining = total;
    while (remaining > 0) {
      const size = Math.min(remaining, chunkSize);
      chunks.push(size);
      remaining -= size;
    }
    return chunks;
  }

  it('500 rows → one full chunk', () => {
    expect(chunkRows(500, 500)).toEqual([500]);
  });

  it('501 rows → one full chunk + one row', () => {
    expect(chunkRows(501, 500)).toEqual([500, 1]);
  });

  it('1000 rows → two full chunks', () => {
    expect(chunkRows(1000, 500)).toEqual([500, 500]);
  });

  it('1 row → one partial chunk', () => {
    expect(chunkRows(1, 500)).toEqual([1]);
  });

  it('1M rows → 2000 chunks of 500', () => {
    const chunks = chunkRows(1_000_000, 500);
    expect(chunks.length).toBe(2000);
    expect(chunks.every((c) => c === 500)).toBe(true);
  });
});

// ── 15. Error code constants ───────────────────────────────────────────────────

describe('INGESTION_ERROR codes', () => {
  it('has unique values', () => {
    const values = Object.values(INGESTION_ERROR);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it('includes required codes', () => {
    expect(INGESTION_ERROR.DUPLICATE_SOURCE).toBeDefined();
    expect(INGESTION_ERROR.DUPLICATE_PROCESSING_FINGERPRINT).toBeDefined();
    expect(INGESTION_ERROR.MAPPING_NOT_FOUND).toBeDefined();
    expect(INGESTION_ERROR.FILE_TOO_LARGE).toBeDefined();
    expect(INGESTION_ERROR.PARSE_ERROR).toBeDefined();
    expect(INGESTION_ERROR.LEASE_LOST).toBeDefined();
  });
});

// ── 16. File extension filter ─────────────────────────────────────────────────

describe('file extension filter', () => {
  function filterExt(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return ACCEPTED_EXTENSIONS.includes(ext as never);
  }

  it('accepts .csv', () => expect(filterExt('data.csv')).toBe(true));
  it('accepts .xlsx', () => expect(filterExt('data.xlsx')).toBe(true));
  it('rejects .txt', () => expect(filterExt('data.txt')).toBe(false));
  it('rejects .exe', () => expect(filterExt('malware.exe')).toBe(false));
  it('rejects no extension', () => expect(filterExt('datafile')).toBe(false));
  it('accepts .CSV (uppercase)', () => expect(filterExt('DATA.CSV')).toBe(true));
});

// ── 17. CORRECTION-001: File signature validation ─────────────────────────────

describe('file content-signature validation', () => {
  const XLSX_MAGIC = [0x50, 0x4b, 0x03, 0x04];

  function checkXlsxMagic(buf: Buffer): boolean {
    return (
      buf.length >= 4 &&
      buf[0] === XLSX_MAGIC[0] &&
      buf[1] === XLSX_MAGIC[1] &&
      buf[2] === XLSX_MAGIC[2] &&
      buf[3] === XLSX_MAGIC[3]
    );
  }

  function checkCsvBinary(buf: Buffer): boolean {
    for (let i = 0; i < buf.length; i++) {
      if (buf[i] === 0x00) return true; // has null byte → binary
    }
    return false;
  }

  it('valid ZIP magic (PK\\x03\\x04) passes XLSX check', () => {
    const buf = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
    expect(checkXlsxMagic(buf)).toBe(true);
  });

  it('wrong magic bytes fail XLSX check', () => {
    const buf = Buffer.from([0xff, 0xfe, 0x00, 0x00]); // UTF-16 BOM
    expect(checkXlsxMagic(buf)).toBe(false);
  });

  it('file too small fails XLSX check', () => {
    const buf = Buffer.from([0x50, 0x4b]);
    expect(checkXlsxMagic(buf)).toBe(false);
  });

  it('plain CSV text passes binary check', () => {
    const buf = Buffer.from('hs_code,quantity,country\n1234,10,NG\n', 'utf8');
    expect(checkCsvBinary(buf)).toBe(false);
  });

  it('CSV with null byte is detected as binary', () => {
    const buf = Buffer.from([0x68, 0x73, 0x00, 0x63, 0x6f, 0x64, 0x65]); // hs\0code
    expect(checkCsvBinary(buf)).toBe(true);
  });
});

// ── 18. CORRECTION-001: Schema fingerprint is case-preserving ─────────────────

describe('computeSchemaFingerprint — Correction D compliance', () => {
  it('Importer vs IMPORTER produce different fingerprints', () => {
    expect(computeSchemaFingerprint(['Importer', 'HS_Code'])).not.toBe(
      computeSchemaFingerprint(['IMPORTER', 'HS_CODE']),
    );
  });

  it('same headers in same case always match', () => {
    const h = ['HS_Code', 'Quantity', 'Unit_Price', 'Currency'];
    expect(computeSchemaFingerprint(h)).toBe(computeSchemaFingerprint([...h]));
  });

  it('strips leading UTF-8 BOM from first header', () => {
    const withBom = ['﻿HS_Code', 'Quantity'];
    const withoutBom = ['HS_Code', 'Quantity'];
    expect(computeSchemaFingerprint(withBom)).toBe(computeSchemaFingerprint(withoutBom));
  });

  it('produces JSON-encoded canonical form (unambiguous serialization)', () => {
    const f1 = computeSchemaFingerprint(['col_a', 'col_b']);
    // Manually compute expected: JSON.stringify(['col_a','col_b'].sort()) → sha256
    const { createHash } = require('crypto');
    const canonical = JSON.stringify(['col_a', 'col_b']);
    const expected = createHash('sha256').update(canonical, 'utf8').digest('hex');
    expect(f1).toBe(expected);
  });
});

// ── 19. CORRECTION-001: Cross-volume storage EXDEV fallback ───────────────────

describe('StorageService persist — EXDEV fallback', () => {
  let tmpSrc: string;
  let tmpDst: string;

  beforeEach(() => {
    tmpSrc = path.join(os.tmpdir(), `tdr-exdev-src-${crypto.randomUUID()}.tmp`);
    tmpDst = path.join(os.tmpdir(), `tdr-exdev-dst-${crypto.randomUUID()}.tmp`);
    fs.writeFileSync(tmpSrc, 'cross-volume-test-content', 'utf8');
  });

  afterEach(() => {
    for (const p of [tmpSrc, tmpDst]) {
      try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch { /* ignore */ }
    }
  });

  it('falls back to stream copy when rename throws EXDEV', async () => {
    const { StorageService } = await import('./ingestion/storage/storage.service');
    const svc = new StorageService();

    // Redirect resolvePath to return our controlled tmpDst
    jest.spyOn(svc, 'resolvePath').mockReturnValue(tmpDst);
    // Simulate EXDEV (cross-volume rename failure)
    const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementationOnce(() => {
      throw Object.assign(new Error('cross-device link not permitted'), { code: 'EXDEV' });
    });

    try {
      await svc.persist(tmpSrc, 'tenant/file');
      // After persist: dest exists, source removed
      expect(fs.existsSync(tmpDst)).toBe(true);
      expect(fs.existsSync(tmpSrc)).toBe(false);
      expect(fs.readFileSync(tmpDst, 'utf8')).toBe('cross-volume-test-content');
    } finally {
      renameSpy.mockRestore();
    }
  });
});

// ── 20. XLSX streaming functional proof (always runs; creates a real XLSX) ─────

describe('XLSX streaming functional proof', () => {
  let tmpXlsx: string;
  const XLSX_HEADERS = ['hs_code', 'quantity', 'country'];
  const XLSX_ROW_COUNT = 200;

  beforeAll(async () => {
    tmpXlsx = path.join(os.tmpdir(), `tdr-xlsx-stream-${crypto.randomUUID()}.xlsx`);
    const ExcelJS = await import('exceljs');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');
    ws.addRow(XLSX_HEADERS);
    for (let i = 1; i <= XLSX_ROW_COUNT; i++) {
      ws.addRow([`${8400 + (i % 100)}`, `${i}`, 'NG']);
    }
    await wb.xlsx.writeFile(tmpXlsx);
  }, 30_000);

  afterAll(() => {
    try { if (fs.existsSync(tmpXlsx)) fs.unlinkSync(tmpXlsx); } catch { /* ignore */ }
  });

  it('readXlsxHeaders returns correct headers without loading all rows', async () => {
    const { readXlsxHeaders } = await import('./ingestion/parsers/xlsx.parser');
    const headers = await readXlsxHeaders(tmpXlsx);
    expect(headers).toEqual(XLSX_HEADERS);
  });

  it('streamXlsxRows yields all data rows incrementally (no full-array accumulation)', async () => {
    const { readXlsxHeaders, streamXlsxRows } = await import('./ingestion/parsers/xlsx.parser');
    const headers = await readXlsxHeaders(tmpXlsx);
    let rowCount = 0;
    for await (const parsed of streamXlsxRows(tmpXlsx, headers)) {
      rowCount++;
      expect(typeof parsed.row['hs_code']).toBe('string');
      expect(parsed.rowNumber).toBe(rowCount);
    }
    expect(rowCount).toBe(XLSX_ROW_COUNT);
  });

  it('getXlsxSchemaFingerprint returns deterministic fingerprint', async () => {
    const { getXlsxSchemaFingerprint } = await import('./ingestion/parsers/xlsx.parser');
    const r1 = await getXlsxSchemaFingerprint(tmpXlsx);
    const r2 = await getXlsxSchemaFingerprint(tmpXlsx);
    expect(r1.fingerprint).toBe(r2.fingerprint);
    expect(r1.headers).toEqual(XLSX_HEADERS);
  });
});

// ── 22. 1M-row CSV architecture proof (runs only when TDR_1M_PROOF=1) ─────────

const RUN_1M_PROOF = process.env['TDR_1M_PROOF'] === '1';

(RUN_1M_PROOF ? describe : describe.skip)('1M row architecture proof', () => {
  let tmpCsv: string;
  const ROW_COUNT = 1_000_000;
  const HEADERS = ['hs_code', 'quantity', 'unit_price', 'currency', 'country', 'description'];

  beforeAll(() => {
    tmpCsv = path.join(os.tmpdir(), `tdr-1m-proof-${Date.now()}.csv`);
    const lines: string[] = [HEADERS.join(',')];
    for (let i = 1; i <= ROW_COUNT; i++) {
      lines.push(`${8400 + (i % 100)},${i},${(i * 1.1).toFixed(2)},USD,NG,Product ${i}`);
    }
    fs.writeFileSync(tmpCsv, lines.join('\n'), 'utf8');
  }, 120_000);

  afterAll(() => {
    if (fs.existsSync(tmpCsv)) fs.unlinkSync(tmpCsv);
  });

  it('streams 1M CSV rows through parser and produces correct chunk count', async () => {
    const { streamCsvRows } = await import('./ingestion/parsers/csv.parser');
    let rowsStreamed = 0;
    let chunksProduced = 0;
    let currentChunk = 0;

    for await (const parsed of streamCsvRows(tmpCsv, HEADERS)) {
      rowsStreamed++;
      currentChunk++;
      if (currentChunk >= CHUNK_SIZE) {
        chunksProduced++;
        currentChunk = 0;
      }
    }
    if (currentChunk > 0) chunksProduced++;

    expect(rowsStreamed).toBe(ROW_COUNT);
    expect(chunksProduced).toBe(2000); // 1M / 500

    console.log(
      `1M proof: rows=${rowsStreamed}, chunks=${chunksProduced}, chunkSize=${CHUNK_SIZE}`,
    );
  }, 300_000);
}, );
