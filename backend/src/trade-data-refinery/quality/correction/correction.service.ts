import { createHash } from 'crypto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { type Prisma, type BatchStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { AuthenticatedUser } from '../../../auth/types/jwt-payload.type';
import { Role } from '../../../auth/types/role.type';
import { MappingConfigV1 } from '../types/mapping-config.types';
import { normalizeRowV1 } from '../normalization/normalizer.service';
import { validateRowV1, ValidationIssueInput } from '../validation/validator.service';
import { determineBatchStatus, determineDisposition } from '../decision/quality-decision.service';
import { isValidTransition } from '../../types/batch-transition';
import { CORRECTABLE_FIELDS, CorrectionDto } from './correction.dto';
import { RULE_CODE } from '../constants/validation-rule.catalog';
import { success } from '../../../common/api-response';

/**
 * Maps a raw canonical field that triggers REQUIRED_FIELD_MISSING
 * to its correctable normalized counterpart.
 * Used by filterCorrectedRequiredIssues to suppress the raw-required check
 * when a human correction has already supplied a valid normalized value.
 */
export const RAW_TO_NORMALIZED_COUNTERPART: Readonly<Partial<Record<string, string>>> = {
  quantityRaw: 'quantityNormalized',
  quantityUnitRaw: 'quantityUnitCode',
  unitPriceRaw: 'unitPriceNormalized',
  currencyRaw: 'currencyCode',
  hsCodeRaw: 'hsCodeNormalized',
  productDescriptionRaw: 'productDescriptionNormalized',
  localPartyTaxIdRaw: 'localPartyTaxIdNormalized',
  localPartyNameRaw: 'localPartyNameNormalized',
  foreignPartyNameRaw: 'foreignPartyNameNormalized',
  originPortRaw: 'originPortNormalized',
  foreignPartyCountryRaw: 'foreignPartyCountryCode',
};

@Injectable()
export class CorrectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async applyCorrection(
    batchId: string,
    recordId: string,
    dto: CorrectionDto,
    user: AuthenticatedUser,
  ) {
    // Verify field is correctable
    if (!CORRECTABLE_FIELDS.includes(dto.fieldName as never)) {
      throw new UnprocessableEntityException(`Field "${dto.fieldName}" is not correctable`);
    }

    // Load record with tenant + batch scope guard
    const record = await this.prisma.tdrRecord.findFirst({
      where: { id: recordId, batchId, tenantId: user.tenantId },
      include: {
        batch: {
          select: {
            tradeDirection: true,
            mappingId: true,
            normalizationVersion: true,
            validationVersion: true,
            status: true,
          },
        },
      },
    });
    if (!record) throw new NotFoundException(`Record ${recordId} not found`);

    // Direction RBAC: IMPORT_MANAGER → IMPORT only; EXPORT_MANAGER → EXPORT only
    checkCorrectionAuthorization(user.roles, record.batch.tradeDirection);

    // Resolve mapping for revalidation
    const mapping = record.batch.mappingId
      ? await this.prisma.tdrSchemaMapping.findUnique({ where: { id: record.batch.mappingId } })
      : null;
    const config = (mapping?.mappingConfig ?? { version: 'v1', columnMappings: [] }) as unknown as MappingConfigV1;

    // Hash before value
    const beforeValue = getFieldValue(record, dto.fieldName);
    const beforeHash = createHash('sha256').update(beforeValue ?? '').digest('hex');
    const afterHash = createHash('sha256').update(dto.correctedValue).digest('hex');

    // Apply correction to record
    const updateData = buildUpdateData(dto.fieldName, dto.correctedValue);
    const oldDisposition = record.rowDisposition;

    // All 5 DB ops in one atomic transaction (CORRECTION-ATOMICITY-001)
    const { review, newDecision } = await this.prisma.$transaction(async (tx) => {
      // Step 1: Mark prior OPEN issues as REVIEWED
      await tx.tdrValidationIssue.updateMany({
        where: { recordId, tenantId: user.tenantId, status: 'OPEN' },
        data: { status: 'REVIEWED' },
      });

      // Step 2: Apply the canonical field update
      const updatedRecord = await tx.tdrRecord.update({
        where: { id: recordId },
        data: { ...updateData, valueTreatmentMeta: { ...(record.valueTreatmentMeta as object ?? {}), [dto.fieldName]: 'CORRECTED' } },
      });

      // Revalidate using the corrected record (in-memory, no I/O)
      const revalidationRow = buildRevalidationRow(updatedRecord, config);
      const newNormalized = normalizeRowV1(revalidationRow, config);
      const rawIssues = validateRowV1(newNormalized, config);
      const meta = (updatedRecord.valueTreatmentMeta as Record<string, string>) ?? {};
      const newIssues = filterCorrectedRequiredIssues(rawIssues, meta, updatedRecord as Record<string, unknown>);
      const txDecision = determineDisposition(newIssues);

      // Step 3: Create new OPEN issues from revalidation
      if (newIssues.length > 0) {
        await tx.tdrValidationIssue.createMany({
          data: newIssues.map((i) => ({
            recordId,
            batchId,
            tenantId: user.tenantId,
            fieldName: i.fieldName,
            ruleCode: i.ruleCode,
            severity: i.severity,
            message: i.message,
            rawValue: i.rawValue,
            status: 'OPEN' as const,
          })),
        });
      }

      // Step 4: Update disposition and export eligibility
      await tx.tdrRecord.update({
        where: { id: recordId },
        data: {
          rowDisposition: txDecision.rowDisposition,
          exportEligible: txDecision.exportEligible,
          quarantineReviewRequired: txDecision.quarantineReviewRequired,
        },
      });

      // Step 5: Create quarantine review record
      const txReview = await tx.tdrQuarantineReview.create({
        data: {
          recordId,
          tenantId: user.tenantId,
          batchId,
          reviewedById: user.userId,
          action: 'CORRECT',
          correctionFieldName: dto.fieldName,
          correctionPayload: { fieldName: dto.fieldName, correctedValue: dto.correctedValue },
          correctionValueHash: afterHash,
          correctionNote: dto.note ?? null,
          appliedAt: new Date(),
        },
        select: { id: true },
      });

      // Step 6: Update batch disposition counts and recompute status when disposition changes
      if (oldDisposition !== txDecision.rowDisposition) {
        const countDelta = buildCountDelta(oldDisposition, txDecision.rowDisposition);
        if (Object.keys(countDelta).length > 0) {
          await tx.tdrBatch.update({ where: { id: batchId }, data: countDelta });
          await recomputeBatchStatusInTx(tx, batchId, user.tenantId, record.batch.status as BatchStatus);
        }
      }

      return { review: txReview, newDecision: txDecision };
    });

    // Audit: only hashes, no plaintext sensitive values
    await this.audit.recordEvent({
      action: 'tdr.quarantine.corrected',
      actorUserId: user.userId,
      tenantId: user.tenantId,
      entityType: 'TdrRecord',
      entityId: recordId,
      metadata: {
        recordId,
        batchId,
        reviewId: review.id,
        fieldName: dto.fieldName,
        beforeHash,
        afterHash,
      },
    });

    return success({
      reviewId: review.id,
      recordId,
      fieldName: dto.fieldName,
      newDisposition: newDecision.rowDisposition,
      exportEligible: newDecision.exportEligible,
    });
  }

  /**
   * Re-evaluates an already-corrected record using the fixed revalidation code.
   * Closes artefact OPEN issues from broken prior revalidation runs and
   * recomputes disposition + batch counts.
   * Does NOT create a new TdrQuarantineReview — this is not a new correction event.
   */
  async reEvaluateRecord(
    batchId: string,
    recordId: string,
    tenantId: string,
  ): Promise<{ rowDisposition: string; exportEligible: boolean; newIssueCount: number }> {
    const record = await this.prisma.tdrRecord.findFirst({
      where: { id: recordId, batchId, tenantId },
      include: {
        batch: { select: { mappingId: true, status: true } },
      },
    });
    if (!record) throw new NotFoundException(`Record ${recordId} not found`);

    const mapping = record.batch.mappingId
      ? await this.prisma.tdrSchemaMapping.findUnique({ where: { id: record.batch.mappingId } })
      : null;
    const config = (mapping?.mappingConfig ?? { version: 'v1', columnMappings: [] }) as unknown as MappingConfigV1;

    const oldDisposition = record.rowDisposition;

    const result = await this.prisma.$transaction(async (tx) => {
      // Close OPEN issues that are artefacts of the prior broken revalidation
      await tx.tdrValidationIssue.updateMany({
        where: { recordId, tenantId, status: 'OPEN' },
        data: { status: 'REVIEWED' },
      });

      // Re-run revalidation with the fixed code
      const revalidationRow = buildRevalidationRow(record as Record<string, unknown>, config);
      const newNormalized = normalizeRowV1(revalidationRow, config);
      const rawIssues = validateRowV1(newNormalized, config);
      const meta = (record.valueTreatmentMeta as Record<string, string>) ?? {};
      const filteredIssues = filterCorrectedRequiredIssues(rawIssues, meta, record as Record<string, unknown>);
      const txDecision = determineDisposition(filteredIssues);

      // Create new issues (only those that remain after correction filtering)
      if (filteredIssues.length > 0) {
        await tx.tdrValidationIssue.createMany({
          data: filteredIssues.map((i) => ({
            recordId,
            batchId,
            tenantId,
            fieldName: i.fieldName,
            ruleCode: i.ruleCode,
            severity: i.severity,
            message: i.message,
            rawValue: i.rawValue,
            status: 'OPEN' as const,
          })),
        });
      }

      // Update record disposition
      await tx.tdrRecord.update({
        where: { id: recordId },
        data: {
          rowDisposition: txDecision.rowDisposition,
          exportEligible: txDecision.exportEligible,
          quarantineReviewRequired: txDecision.quarantineReviewRequired,
        },
      });

      // Update batch counts if disposition changed
      if (oldDisposition !== txDecision.rowDisposition) {
        const countDelta = buildCountDelta(oldDisposition, txDecision.rowDisposition);
        if (Object.keys(countDelta).length > 0) {
          await tx.tdrBatch.update({ where: { id: batchId }, data: countDelta });
        }
      }

      // Always recompute batch status — re-evaluation may clear stale REVIEW_REQUIRED
      // even when this record's own disposition did not change in this run.
      await recomputeBatchStatusInTx(tx, batchId, tenantId, record.batch.status as BatchStatus);

      return {
        rowDisposition: txDecision.rowDisposition,
        exportEligible: txDecision.exportEligible,
        newIssueCount: filteredIssues.length,
      };
    });

    return result;
  }
}

function checkCorrectionAuthorization(roles: string[], direction: string): void {
  const isSuperAdmin = roles.includes(Role.SUPER_ADMIN);
  const isTenantAdmin = roles.includes(Role.TENANT_ADMIN);
  const isImportManager = roles.includes(Role.IMPORT_MANAGER);
  const isExportManager = roles.includes(Role.EXPORT_MANAGER);

  if (isSuperAdmin || isTenantAdmin) return;
  if (direction === 'IMPORT' && isImportManager) return;
  if (direction === 'EXPORT' && isExportManager) return;
  throw new ForbiddenException('Not authorized to correct this record');
}

function getFieldValue(record: Record<string, unknown>, fieldName: string): string | null {
  const v = record[fieldName];
  if (v === null || v === undefined) return null;
  return String(v);
}

function buildUpdateData(fieldName: string, value: string): Record<string, unknown> {
  return { [fieldName]: value || null };
}

/**
 * Formats a @db.Date field (UTC midnight) back to a source-parseable string
 * using the column's transformationRule.
 * Uses UTC accessors to avoid timezone-sensitive drift on date-only values.
 */
export function revalidationDateString(d: Date, transformationRule?: string): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  if (transformationRule === 'DATE_PARSE_DMY') return `${day}-${m}-${y}`;
  if (transformationRule === 'DATE_PARSE_MDY') return `${m}-${day}-${y}`;
  return `${y}-${m}-${day}`;
}

/**
 * Reconstructs a source-shaped row from the stored canonical record fields.
 * Date objects (stored as @db.Date) are formatted back to their original
 * source representation using the column's transformationRule and UTC accessors.
 */
export function buildRevalidationRow(
  record: Record<string, unknown>,
  config: MappingConfigV1,
): Record<string, string> {
  const row: Record<string, string> = {};
  for (const cm of config.columnMappings) {
    let v: unknown = record[cm.canonicalField];
    if (v instanceof Date) {
      v = revalidationDateString(v, cm.transformationRule);
    }
    row[cm.sourceColumnName] = v !== null && v !== undefined ? String(v) : '';
  }
  return row;
}

/**
 * Suppresses REQUIRED_FIELD_MISSING issues for raw fields whose normalized
 * counterpart has been human-corrected with a valid non-empty value.
 * All other issue types pass through unchanged.
 */
export function filterCorrectedRequiredIssues(
  issues: ValidationIssueInput[],
  meta: Record<string, string>,
  record: Record<string, unknown>,
): ValidationIssueInput[] {
  return issues.filter((issue) => {
    if (issue.ruleCode !== RULE_CODE.REQUIRED_FIELD_MISSING) return true;
    const normalizedField = RAW_TO_NORMALIZED_COUNTERPART[issue.fieldName ?? ''];
    if (!normalizedField) return true;
    if (meta[normalizedField] !== 'CORRECTED') return true;
    const correctedValue = record[normalizedField];
    return correctedValue === null || correctedValue === undefined || String(correctedValue).trim() === '';
  });
}

/**
 * After batch count fields are atomically updated in a transaction,
 * re-reads the counts and transitions batch.status if the result
 * warrants it (e.g. REVIEW_REQUIRED → READY when quarantinedRows hits 0).
 */
async function recomputeBatchStatusInTx(
  tx: Prisma.TransactionClient,
  batchId: string,
  tenantId: string,
  currentStatus: BatchStatus,
): Promise<void> {
  const batch = await tx.tdrBatch.findUnique({
    where: { id: batchId },
    select: { acceptedRows: true, quarantinedRows: true, rejectedRows: true },
  });
  if (!batch) return;
  const pendingCount = await tx.tdrRecord.count({
    where: { batchId, tenantId, rowDisposition: 'PENDING_QUALITY' },
  });
  const newStatus = determineBatchStatus(
    batch.acceptedRows,
    batch.quarantinedRows,
    batch.rejectedRows,
    pendingCount,
  );
  if (newStatus !== currentStatus && isValidTransition(currentStatus, newStatus)) {
    await tx.tdrBatch.update({ where: { id: batchId }, data: { status: newStatus } });
  }
}

function buildCountDelta(
  oldDisp: string | null,
  newDisp: string,
): Record<string, unknown> {
  const delta: Record<string, unknown> = {};
  if (oldDisp === 'ACCEPTED') delta.acceptedRows = { decrement: 1 };
  else if (oldDisp === 'QUARANTINED') delta.quarantinedRows = { decrement: 1 };
  else if (oldDisp === 'REJECTED') delta.rejectedRows = { decrement: 1 };
  if (newDisp === 'ACCEPTED') delta.acceptedRows = { increment: 1 };
  else if (newDisp === 'QUARANTINED') delta.quarantinedRows = { increment: 1 };
  else if (newDisp === 'REJECTED') delta.rejectedRows = { increment: 1 };
  return delta;
}
