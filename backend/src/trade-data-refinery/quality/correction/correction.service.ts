import { createHash } from 'crypto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { AuthenticatedUser } from '../../../auth/types/jwt-payload.type';
import { Role } from '../../../auth/types/role.type';
import { MappingConfigV1 } from '../types/mapping-config.types';
import { normalizeRowV1 } from '../normalization/normalizer.service';
import { validateRowV1 } from '../validation/validator.service';
import { determineDisposition } from '../decision/quality-decision.service';
import { CORRECTABLE_FIELDS, CorrectionDto } from './correction.dto';
import { success } from '../../../common/api-response';

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
      const newIssues = validateRowV1(newNormalized, config);
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

function buildRevalidationRow(
  record: Record<string, unknown>,
  config: MappingConfigV1,
): Record<string, string> {
  // Reconstruct a source-like row using the canonical fields mapped back through config
  const row: Record<string, string> = {};
  for (const cm of config.columnMappings) {
    const v = record[cm.canonicalField];
    row[cm.sourceColumnName] = v !== null && v !== undefined ? String(v) : '';
  }
  return row;
}
