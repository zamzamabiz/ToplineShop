/**
 * TDR-MVP-DATA-FOUNDATION-001 (Mega 1) — Database Integration Tests
 *
 * Validates all 9 TDR models and 7 enums applied by migration
 * `20260918215807_tdr_mvp_data_foundation` against the live local database.
 *
 * Key assertions:
 *   - TenantModule enablement + unique constraint
 *   - TdrSchemaMapping scopeKey uniqueness (platform vs tenant-specific)
 *   - TdrSourceFile content-hash uniqueness per tenant
 *   - TdrBatch replay: same processingFingerprintHash allowed (NON-UNIQUE)
 *   - TdrProcessingJob 1:1 batch binding
 *   - TdrRecord: DATE type, DECIMAL(24,6), nullable sourceRowEvidence, TEXT HS code
 *   - TdrSourceRow: unique(batchId, sourceRowNumber)
 *   - TdrValidationIssue: severity enum + FK enforcement
 *   - TdrQuarantineReview: bounded correctionPayload JSON
 *
 * Datasource guard: refuses to run unless DATABASE_URL points to
 * localhost:5433/toplineshop_dev.
 *
 * Cleanup: afterAll removes all rows created by this test run using a
 * per-run unique tag, in FK-safe dependency order.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient, Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// .env loader
// ---------------------------------------------------------------------------
if (!process.env.DATABASE_URL) {
  const envFile = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(envFile)) {
    const raw = fs.readFileSync(envFile, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\r\n]*)"?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}

// ---------------------------------------------------------------------------
// Datasource guard
// ---------------------------------------------------------------------------
function assertLocalDatasource(): void {
  const url = process.env.DATABASE_URL ?? '';
  const m = url.match(/postgresql:\/\/[^@]+@([^:/]+):(\d+)\/([^?]+)/);
  if (!m) throw new Error('TDR-Mega1 guard: DATABASE_URL not set or not parseable');
  const [, host, port, db] = m;
  const ok =
    ['localhost', '127.0.0.1'].includes(host) && port === '5433' && db === 'toplineshop_dev';
  if (!ok) {
    throw new Error(
      'TDR-Mega1 guard: refusing to run — datasource is not localhost:5433/toplineshop_dev',
    );
  }
}

jest.setTimeout(30000);

// ---------------------------------------------------------------------------
describe('TDR-MVP-DATA-FOUNDATION-001 — DB Integration (Mega 1)', () => {
  let prisma: PrismaClient;

  // IDs for FK prerequisites and test data
  let tenantId: string;
  let userId: string;
  let mappingId: string;
  let sourceFileId: string;
  let batchId: string;
  let replayBatchId: string;
  let jobId: string;
  let recordId: string;
  let sourceRowId: string;
  let issueId: string;
  let reviewId: string;
  let tenantModuleId: string;

  const TAG = `tdr-mega1-${Date.now()}`;

  // -------------------------------------------------------------------------
  beforeAll(async () => {
    assertLocalDatasource();
    prisma = new PrismaClient();
    await prisma.$connect();

    // Prerequisite tenant
    const tenant = await prisma.tenant.create({
      data: { name: `TDR Mega1 Tenant ${TAG}`, slug: TAG, type: 'VENDOR', status: 'ACTIVE' },
    });
    tenantId = tenant.id;

    // Prerequisite user
    const user = await prisma.user.create({
      data: { email: `${TAG}@tdr.local`, name: `TDR Mega1 User ${TAG}`, status: 'ACTIVE' },
    });
    userId = user.id;
  });

  // -------------------------------------------------------------------------
  afterAll(async () => {
    if (!prisma) return;
    try {
      // Delete in FK-safe order: deepest children first
      if (reviewId) await prisma.tdrQuarantineReview.deleteMany({ where: { id: reviewId } });
      if (issueId) await prisma.tdrValidationIssue.deleteMany({ where: { id: issueId } });
      if (sourceRowId) await prisma.tdrSourceRow.deleteMany({ where: { id: sourceRowId } });
      if (recordId) await prisma.tdrRecord.deleteMany({ where: { id: recordId } });
      if (jobId) await prisma.tdrProcessingJob.deleteMany({ where: { id: jobId } });
      if (replayBatchId) await prisma.tdrBatch.deleteMany({ where: { id: replayBatchId } });
      if (batchId) await prisma.tdrBatch.deleteMany({ where: { id: batchId } });
      if (sourceFileId) await prisma.tdrSourceFile.deleteMany({ where: { id: sourceFileId } });
      if (mappingId) await prisma.tdrSchemaMapping.deleteMany({ where: { id: mappingId } });
      // Clean any extra mappings created in the scoping test
      await prisma.tdrSchemaMapping.deleteMany({ where: { scopeKey: { in: ['PLATFORM', tenantId] }, profileId: `PAK_IMPORT_${TAG}` } });
      if (tenantModuleId) await prisma.tenantModule.deleteMany({ where: { id: tenantModuleId } });
      await prisma.tenantModule.deleteMany({ where: { tenantId } });
      if (userId) await prisma.user.delete({ where: { id: userId } });
      if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } });
    } finally {
      await prisma.$disconnect();
    }
  });

  // =========================================================================
  // 1–3: TenantModule
  // =========================================================================
  describe('TenantModule', () => {
    it('1. creates a TenantModule record with enabled=false default', async () => {
      const mod = await prisma.tenantModule.create({
        data: {
          tenantId,
          moduleKey: 'TRADE_DATA_REFINERY',
          enabled: false,
        },
      });
      tenantModuleId = mod.id;
      expect(mod.id).toBeTruthy();
      expect(mod.tenantId).toBe(tenantId);
      expect(mod.moduleKey).toBe('TRADE_DATA_REFINERY');
      expect(mod.enabled).toBe(false);
      expect(mod.enabledById).toBeNull();
    });

    it('2. enables module and stores enabledById', async () => {
      const updated = await prisma.tenantModule.update({
        where: { id: tenantModuleId },
        data: { enabled: true, enabledAt: new Date(), enabledById: userId },
      });
      expect(updated.enabled).toBe(true);
      expect(updated.enabledById).toBe(userId);
      expect(updated.enabledAt).not.toBeNull();
    });

    it('3. enforces unique(tenantId, moduleKey) constraint (P2002)', async () => {
      let err: unknown;
      try {
        await prisma.tenantModule.create({
          data: { tenantId, moduleKey: 'TRADE_DATA_REFINERY', enabled: false },
        });
      } catch (e) {
        err = e;
      }
      expect(err).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
      expect((err as Prisma.PrismaClientKnownRequestError).code).toBe('P2002');
    });
  });

  // =========================================================================
  // 4–7: TdrSchemaMapping (scopeKey uniqueness)
  // =========================================================================
  describe('TdrSchemaMapping (scopeKey uniqueness)', () => {
    it('4. creates a platform-level mapping (scopeKey = PLATFORM)', async () => {
      const mapping = await prisma.tdrSchemaMapping.create({
        data: {
          scopeKey: 'PLATFORM',
          profileId: `PAK_IMPORT_${TAG}`,
          version: 1,
          tradeDirection: 'IMPORT',
          mappingConfig: { columns: ['hs_code', 'quantity', 'unit_price'] },
          active: true,
        },
      });
      mappingId = mapping.id;
      expect(mapping.scopeKey).toBe('PLATFORM');
      expect(mapping.tenantId).toBeNull();
      expect(mapping.active).toBe(true);
    });

    it('5. creates a tenant-specific mapping with same profileId+version (scopeKey = tenantId)', async () => {
      // Different scopeKey — must NOT conflict with platform mapping
      const tenantMapping = await prisma.tdrSchemaMapping.create({
        data: {
          tenantId,
          scopeKey: tenantId,
          profileId: `PAK_IMPORT_${TAG}`,
          version: 1,
          tradeDirection: 'IMPORT',
          mappingConfig: { columns: ['hs_code', 'quantity'] },
          active: false,
        },
      });
      expect(tenantMapping.scopeKey).toBe(tenantId);
      expect(tenantMapping.tenantId).toBe(tenantId);
    });

    it('6. enforces unique(scopeKey, profileId, version) — duplicate platform mapping blocked (P2002)', async () => {
      let err: unknown;
      try {
        await prisma.tdrSchemaMapping.create({
          data: {
            scopeKey: 'PLATFORM',
            profileId: `PAK_IMPORT_${TAG}`,
            version: 1,
            tradeDirection: 'EXPORT',
            mappingConfig: {},
            active: false,
          },
        });
      } catch (e) {
        err = e;
      }
      expect(err).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
      expect((err as Prisma.PrismaClientKnownRequestError).code).toBe('P2002');
    });

    it('7. allows new version under same scopeKey (version increment is not blocked)', async () => {
      const v2 = await prisma.tdrSchemaMapping.create({
        data: {
          scopeKey: 'PLATFORM',
          profileId: `PAK_IMPORT_${TAG}`,
          version: 2,
          tradeDirection: 'IMPORT',
          mappingConfig: { columns: ['hs_code'] },
          active: false,
        },
      });
      expect(v2.version).toBe(2);
    });
  });

  // =========================================================================
  // 8–10: TdrSourceFile
  // =========================================================================
  describe('TdrSourceFile', () => {
    it('8. creates a source file with BIGINT fileSizeBytes', async () => {
      const file = await prisma.tdrSourceFile.create({
        data: {
          tenantId,
          originalFilename: `pak_import_jan2025_${TAG}.xlsx`,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          fileSizeBytes: BigInt('524288000'),
          storageKey: `uploads/${TAG}/pak_import.xlsx`,
          contentHash: TAG.padEnd(64, '0').substring(0, 64),
          tradeDirection: 'IMPORT',
          uploadedById: userId,
          uploadedAt: new Date(),
        },
      });
      sourceFileId = file.id;
      expect(file.id).toBeTruthy();
      expect(file.fileSizeBytes).toBe(BigInt('524288000'));
      expect(file.tradeDirection).toBe('IMPORT');
    });

    it('9. enforces unique(tenantId, contentHash) constraint (P2002)', async () => {
      let err: unknown;
      try {
        await prisma.tdrSourceFile.create({
          data: {
            tenantId,
            originalFilename: `duplicate_${TAG}.xlsx`,
            fileSizeBytes: BigInt('1024'),
            storageKey: `uploads/${TAG}/dup.xlsx`,
            contentHash: TAG.padEnd(64, '0').substring(0, 64),
            tradeDirection: 'IMPORT',
            uploadedById: userId,
            uploadedAt: new Date(),
          },
        });
      } catch (e) {
        err = e;
      }
      expect(err).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
      expect((err as Prisma.PrismaClientKnownRequestError).code).toBe('P2002');
    });

    it('10. storageKey is NOT subject to uniqueness — same key could be re-used across tenants', async () => {
      const secondTenant = await prisma.tenant.create({
        data: { name: `TDR T2 ${TAG}`, slug: `${TAG}-t2`, type: 'VENDOR', status: 'ACTIVE' },
      });
      const secondUser = await prisma.user.create({
        data: { email: `${TAG}-t2@tdr.local`, name: `TDR T2 User ${TAG}`, status: 'ACTIVE' },
      });
      const file2 = await prisma.tdrSourceFile.create({
        data: {
          tenantId: secondTenant.id,
          originalFilename: `pak_import_jan2025_${TAG}.xlsx`,
          fileSizeBytes: BigInt('524288000'),
          storageKey: `uploads/${TAG}/pak_import.xlsx`, // same storageKey, different tenant
          contentHash: `t2-${TAG}`.padEnd(64, '1').substring(0, 64),
          tradeDirection: 'IMPORT',
          uploadedById: secondUser.id,
          uploadedAt: new Date(),
        },
      });
      expect(file2.tenantId).toBe(secondTenant.id);
      // Cleanup immediately
      await prisma.tdrSourceFile.delete({ where: { id: file2.id } });
      await prisma.user.delete({ where: { id: secondUser.id } });
      await prisma.tenant.delete({ where: { id: secondTenant.id } });
    });
  });

  // =========================================================================
  // 11–15: TdrBatch + replay (processingFingerprintHash non-unique)
  // =========================================================================
  describe('TdrBatch', () => {
    const fingerprint = `a${'b'.repeat(63)}`.substring(0, 64);

    it('11. creates a batch with RECEIVED status and default counter values', async () => {
      const batch = await prisma.tdrBatch.create({
        data: {
          tenantId,
          sourceFileId,
          mappingId,
          status: 'RECEIVED',
          tradeDirection: 'IMPORT',
          mappingVersion: '1.0.0',
          parserVersion: '1.0.0',
          normalizationVersion: '1.0.0',
          validationVersion: '1.0.0',
          processingFingerprintHash: fingerprint,
          createdById: userId,
        },
      });
      batchId = batch.id;
      expect(batch.status).toBe('RECEIVED');
      expect(batch.processedRows).toBe(0);
      expect(batch.acceptedRows).toBe(0);
      expect(batch.quarantinedRows).toBe(0);
      expect(batch.rejectedRows).toBe(0);
      expect(batch.failedChunks).toBe(0);
      expect(batch.storeSourceRows).toBe(false);
      expect(batch.totalSourceRows).toBeNull();
    });

    it('12. processingFingerprintHash is NOT UNIQUE — second batch with same hash is allowed (intentional replay)', async () => {
      const replayBatch = await prisma.tdrBatch.create({
        data: {
          tenantId,
          sourceFileId,
          mappingId,
          status: 'RECEIVED',
          tradeDirection: 'IMPORT',
          mappingVersion: '1.0.0',
          parserVersion: '1.0.0',
          normalizationVersion: '1.0.0',
          validationVersion: '1.0.0',
          processingFingerprintHash: fingerprint,
          replayOfBatchId: batchId,
          replayReason: 'Intentional replay for re-normalization',
          createdById: userId,
        },
      });
      replayBatchId = replayBatch.id;
      expect(replayBatch.processingFingerprintHash).toBe(fingerprint);
      expect(replayBatch.replayOfBatchId).toBe(batchId);
    });

    it('13. replay FK: replayOfBatchId references valid batch', async () => {
      const fetched = await prisma.tdrBatch.findUniqueOrThrow({
        where: { id: replayBatchId },
        include: { replayOf: true },
      });
      expect(fetched.replayOf?.id).toBe(batchId);
    });

    it('14. batch status can be advanced to PROCESSING', async () => {
      const updated = await prisma.tdrBatch.update({
        where: { id: batchId },
        data: { status: 'PROCESSING', startedAt: new Date(), totalSourceRows: 293893 },
      });
      expect(updated.status).toBe('PROCESSING');
      expect(updated.totalSourceRows).toBe(293893);
      expect(updated.startedAt).not.toBeNull();
    });

    it('15. processingConfig stores arbitrary JSON', async () => {
      await prisma.tdrBatch.update({
        where: { id: batchId },
        data: { processingConfig: { chunkSize: 500, skipHeader: true, sheetIndex: 0 } },
      });
      const fetched = await prisma.tdrBatch.findUniqueOrThrow({ where: { id: batchId } });
      expect((fetched.processingConfig as Record<string, unknown>)['chunkSize']).toBe(500);
    });
  });

  // =========================================================================
  // 16–18: TdrProcessingJob
  // =========================================================================
  describe('TdrProcessingJob', () => {
    it('16. creates a job with PENDING status and default lease/heartbeat nulls', async () => {
      const job = await prisma.tdrProcessingJob.create({
        data: { batchId, tenantId, status: 'PENDING' },
      });
      jobId = job.id;
      expect(job.status).toBe('PENDING');
      expect(job.attemptCount).toBe(0);
      expect(job.maxAttempts).toBe(3);
      expect(job.leasedAt).toBeNull();
      expect(job.leaseExpiresAt).toBeNull();
      expect(job.lastCheckpointRow).toBe(0);
      expect(job.workerInstanceId).toBeNull();
    });

    it('17. lease acquisition: sets status LEASED + leasedAt + leaseExpiresAt', async () => {
      const now = new Date();
      const leaseExp = new Date(now.getTime() + 300_000);
      const leased = await prisma.tdrProcessingJob.update({
        where: { id: jobId },
        data: {
          status: 'LEASED',
          leasedAt: now,
          leaseExpiresAt: leaseExp,
          workerInstanceId: `worker-${TAG}`,
          attemptCount: 1,
        },
      });
      expect(leased.status).toBe('LEASED');
      expect(leased.workerInstanceId).toBe(`worker-${TAG}`);
      expect(leased.attemptCount).toBe(1);
    });

    it('18. enforces unique batch_id (one job per batch, P2002)', async () => {
      let err: unknown;
      try {
        await prisma.tdrProcessingJob.create({ data: { batchId, tenantId } });
      } catch (e) {
        err = e;
      }
      expect(err).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
      expect((err as Prisma.PrismaClientKnownRequestError).code).toBe('P2002');
    });
  });

  // =========================================================================
  // 19–24: TdrRecord (DATE, DECIMAL, nullable fields, HS as TEXT)
  // =========================================================================
  describe('TdrRecord', () => {
    it('19. creates a record — tradeDate stored as PostgreSQL DATE (not TIMESTAMP)', async () => {
      const record = await prisma.tdrRecord.create({
        data: {
          tenantId,
          sourceFileId,
          batchId,
          sourceRowNumber: 1,
          rowHash: `r${'0'.repeat(63)}`.substring(0, 64),
          tradeDirection: 'IMPORT',
          tradeDate: new Date('2025-01-15'),
          hsCodeRaw: '6105.20',
          hsCodeNormalized: '6105.20',
          hsChapter: '61',
          sourceSchemaSignature: `sig-${TAG}`,
          mappingVersion: '1.0.0',
          parserVersion: '1.0.0',
          normalizationVersion: '1.0.0',
          validationVersion: '1.0.0',
          rowDisposition: 'ACCEPTED',
          exportEligible: true,
        },
      });
      recordId = record.id;
      expect(record.tradeDate).not.toBeNull();
      // DATE stored — only date portion should be meaningful
      expect(record.tradeDate?.getFullYear()).toBe(2025);
      expect(record.tradeDate?.getMonth()).toBe(0); // January
    });

    it('20. HS code stored and returned as TEXT (not converted to float)', async () => {
      const fetched = await prisma.tdrRecord.findUniqueOrThrow({ where: { id: recordId } });
      expect(fetched.hsCodeRaw).toBe('6105.20');
      expect(fetched.hsCodeNormalized).toBe('6105.20');
      // Critical: must remain a string, never become 6105.2 (float artifact)
      expect(typeof fetched.hsCodeRaw).toBe('string');
    });

    it('21. DECIMAL(24,6) quantityNormalized stored and read back with full precision', async () => {
      await prisma.tdrRecord.update({
        where: { id: recordId },
        data: {
          quantityRaw: '1234.567891',
          quantityNormalized: new Prisma.Decimal('1234.567891'),
          quantityUnitRaw: 'KGS',
          quantityUnitCode: 'KGS',
          unitPriceRaw: '99.123456',
          unitPriceNormalized: new Prisma.Decimal('99.123456'),
          currencyRaw: 'USD',
          currencyCode: 'USD',
        },
      });
      const updated = await prisma.tdrRecord.findUniqueOrThrow({ where: { id: recordId } });
      // DECIMAL(24,6) supports 6 decimal places; trailing zeros are stripped by PostgreSQL.
      expect(updated.quantityNormalized?.toString()).toBe('1234.567891');
      expect(updated.unitPriceNormalized?.toString()).toBe('99.123456');
    });

    it('22. sourceRowEvidence is nullable — record with null evidence is valid', async () => {
      const record = await prisma.tdrRecord.findUniqueOrThrow({ where: { id: recordId } });
      // sourceRowEvidence not set on create above — must be null
      expect(record.sourceRowEvidence).toBeNull();
    });

    it('23. sourceRowEvidence can store bounded JSON when provided', async () => {
      await prisma.tdrRecord.update({
        where: { id: recordId },
        data: { sourceRowEvidence: { col_A: '6105.20', col_B: '1234.567890', col_C: 'USD' } },
      });
      const updated = await prisma.tdrRecord.findUniqueOrThrow({ where: { id: recordId } });
      expect((updated.sourceRowEvidence as Record<string, unknown>)['col_A']).toBe('6105.20');
    });

    it('24. enforces unique(batchId, sourceRowNumber) — duplicate row number in same batch (P2002)', async () => {
      let err: unknown;
      try {
        await prisma.tdrRecord.create({
          data: {
            tenantId,
            sourceFileId,
            batchId,
            sourceRowNumber: 1, // duplicate
            rowHash: `d${'1'.repeat(63)}`.substring(0, 64),
            tradeDirection: 'IMPORT',
            sourceSchemaSignature: `sig-${TAG}`,
            mappingVersion: '1.0.0',
            parserVersion: '1.0.0',
            normalizationVersion: '1.0.0',
            validationVersion: '1.0.0',
            rowDisposition: 'REJECTED',
          },
        });
      } catch (e) {
        err = e;
      }
      expect(err).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
      expect((err as Prisma.PrismaClientKnownRequestError).code).toBe('P2002');
    });
  });

  // =========================================================================
  // 25–26: TdrSourceRow
  // =========================================================================
  describe('TdrSourceRow', () => {
    it('25. creates a source row with rawContent JSON', async () => {
      const row = await prisma.tdrSourceRow.create({
        data: {
          batchId,
          tenantId,
          sourceRowNumber: 1,
          rawContent: { 'HS Code': '6105.20', 'Quantity': '1234.567890', 'Currency': 'USD' },
          rowHash: `sr${'2'.repeat(62)}`.substring(0, 64),
        },
      });
      sourceRowId = row.id;
      expect(row.id).toBeTruthy();
      expect((row.rawContent as Record<string, unknown>)['HS Code']).toBe('6105.20');
    });

    it('26. enforces unique(batchId, sourceRowNumber) for TdrSourceRow (P2002)', async () => {
      let err: unknown;
      try {
        await prisma.tdrSourceRow.create({
          data: {
            batchId,
            tenantId,
            sourceRowNumber: 1, // duplicate
            rawContent: {},
            rowHash: `sr${'3'.repeat(62)}`.substring(0, 64),
          },
        });
      } catch (e) {
        err = e;
      }
      expect(err).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
      expect((err as Prisma.PrismaClientKnownRequestError).code).toBe('P2002');
    });
  });

  // =========================================================================
  // 27–30: TdrValidationIssue
  // =========================================================================
  describe('TdrValidationIssue', () => {
    it('27. creates a BLOCKING validation issue with OPEN status default', async () => {
      const issue = await prisma.tdrValidationIssue.create({
        data: {
          recordId,
          batchId,
          tenantId,
          fieldName: 'hs_code_normalized',
          ruleCode: 'HS_INVALID_CHAPTER',
          severity: 'BLOCKING',
          message: 'HS chapter 99 is not valid for import declarations',
          rawValue: '9999.99',
        },
      });
      issueId = issue.id;
      expect(issue.severity).toBe('BLOCKING');
      expect(issue.status).toBe('OPEN');
      expect(issue.fieldName).toBe('hs_code_normalized');
    });

    it('28. query by batchId + severity returns the created issue', async () => {
      const issues = await prisma.tdrValidationIssue.findMany({
        where: { batchId, severity: 'BLOCKING' },
      });
      const ids = issues.map((i) => i.id);
      expect(ids).toContain(issueId);
    });

    it('29. status can be updated to REVIEWED', async () => {
      const updated = await prisma.tdrValidationIssue.update({
        where: { id: issueId },
        data: { status: 'REVIEWED' },
      });
      expect(updated.status).toBe('REVIEWED');
    });

    it('30. enforces record_id FK (P2003)', async () => {
      let err: unknown;
      try {
        await prisma.tdrValidationIssue.create({
          data: {
            recordId: 'non-existent-record-id-tdr',
            batchId,
            tenantId,
            ruleCode: 'TEST',
            severity: 'WARNING',
            message: 'Test FK enforcement',
          },
        });
      } catch (e) {
        err = e;
      }
      expect(err).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
      expect((err as Prisma.PrismaClientKnownRequestError).code).toBe('P2003');
    });
  });

  // =========================================================================
  // 31–33: TdrQuarantineReview (correctionPayload bounded JSON)
  // =========================================================================
  describe('TdrQuarantineReview', () => {
    it('31. creates a CORRECT review with bounded correctionPayload {fieldName, before, after}', async () => {
      const review = await prisma.tdrQuarantineReview.create({
        data: {
          recordId,
          tenantId,
          batchId,
          reviewedById: userId,
          action: 'CORRECT',
          correctionFieldName: 'hs_code_normalized',
          correctionPayload: {
            fieldName: 'hs_code_normalized',
            before: '6105.20',
            after: '61052000',
          },
          correctionValueHash: `cv${'4'.repeat(62)}`.substring(0, 64),
          correctionNote: 'Corrected HS code to 8-digit format per PKT bulletin',
        },
      });
      reviewId = review.id;
      expect(review.action).toBe('CORRECT');
      expect((review.correctionPayload as Record<string, unknown>)['before']).toBe('6105.20');
      expect((review.correctionPayload as Record<string, unknown>)['after']).toBe('61052000');
    });

    it('32. APPROVE review with null reviewedById (system-generated review)', async () => {
      const autoReview = await prisma.tdrQuarantineReview.create({
        data: {
          recordId,
          tenantId,
          batchId,
          reviewedById: null, // system review
          action: 'APPROVE',
          correctionNote: 'Auto-approved: all validation rules passed on re-check',
        },
      });
      expect(autoReview.reviewedById).toBeNull();
      expect(autoReview.action).toBe('APPROVE');
      // Cleanup extra review
      await prisma.tdrQuarantineReview.delete({ where: { id: autoReview.id } });
    });

    it('33. correctionValueHash round-trip — stored and retrieved intact', async () => {
      const fetched = await prisma.tdrQuarantineReview.findUniqueOrThrow({ where: { id: reviewId } });
      expect(fetched.correctionValueHash).toBe(`cv${'4'.repeat(62)}`.substring(0, 64));
      expect(fetched.correctionValueHash?.length).toBe(64);
    });
  });
});
