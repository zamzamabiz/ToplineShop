import { Injectable, NotFoundException } from '@nestjs/common';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PrismaService } from '../../../prisma/prisma.service';
import { success } from '../../../common/api-response';
import { MAX_QUARANTINE_PAGE_SIZE } from '../constants/quality.limits';

export class ListQuarantineDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_QUARANTINE_PAGE_SIZE)
  @Type(() => Number)
  pageSize?: number;

  @IsOptional()
  @IsString()
  ruleCode?: string;

  @IsOptional()
  @IsEnum(['WARNING', 'ERROR', 'BLOCKING'])
  severity?: string;

  @IsOptional()
  @IsString()
  fieldName?: string;
}

@Injectable()
export class QuarantineService {
  constructor(private readonly prisma: PrismaService) {}

  async listQuarantine(batchId: string, tenantId: string, dto: ListQuarantineDto) {
    const page = dto.page ?? 1;
    const pageSize = Math.min(dto.pageSize ?? 25, MAX_QUARANTINE_PAGE_SIZE);
    const skip = (page - 1) * pageSize;

    // Verify batch belongs to tenant
    const batch = await this.prisma.tdrBatch.findFirst({
      where: { id: batchId, tenantId },
      select: { id: true },
    });
    if (!batch) throw new NotFoundException(`Batch ${batchId} not found`);

    const issueWhere = {
      batchId,
      tenantId,
      status: 'OPEN' as const,
      ...(dto.ruleCode ? { ruleCode: dto.ruleCode } : {}),
      ...(dto.severity ? { severity: dto.severity as never } : {}),
      ...(dto.fieldName ? { fieldName: dto.fieldName } : {}),
    };

    const [issues, total] = await Promise.all([
      this.prisma.tdrValidationIssue.findMany({
        where: issueWhere,
        orderBy: [{ severity: 'desc' }, { createdAt: 'asc' }],
        skip,
        take: pageSize,
        select: {
          id: true,
          recordId: true,
          fieldName: true,
          ruleCode: true,
          severity: true,
          message: true,
          status: true,
          createdAt: true,
          record: {
            select: {
              id: true,
              sourceRowNumber: true,
              rowDisposition: true,
              exportEligible: true,
              quarantineReviewRequired: true,
            },
          },
        },
      }),
      this.prisma.tdrValidationIssue.count({ where: issueWhere }),
    ]);

    return success(issues, { page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  }

  async getQualityDetail(batchId: string, recordId: string, tenantId: string) {
    const record = await this.prisma.tdrRecord.findFirst({
      where: { id: recordId, batchId, tenantId },
      select: {
        id: true,
        sourceRowNumber: true,
        rowDisposition: true,
        exportEligible: true,
        quarantineReviewRequired: true,
        tradeDate: true,
        hsCodeRaw: true,
        hsCodeNormalized: true,
        hsChapter: true,
        productDescriptionRaw: true,
        productDescriptionNormalized: true,
        localPartyTaxIdRaw: true,
        localPartyTaxIdNormalized: true,
        localPartyNameRaw: true,
        localPartyNameNormalized: true,
        localPartyAddressRaw: true,
        localPartyCountryCode: true,
        foreignPartyNameRaw: true,
        foreignPartyNameNormalized: true,
        foreignPartyAddressRaw: true,
        foreignPartyCountryRaw: true,
        foreignPartyCountryCode: true,
        originPortRaw: true,
        originPortNormalized: true,
        quantityRaw: true,
        quantityNormalized: true,
        quantityUnitRaw: true,
        quantityUnitCode: true,
        unitPriceRaw: true,
        unitPriceNormalized: true,
        currencyRaw: true,
        currencyCode: true,
        valueTreatmentMeta: true,
        tradeDirection: true,
        validationIssues: {
          where: { status: { in: ['OPEN', 'REVIEWED'] } },
          select: {
            id: true,
            fieldName: true,
            ruleCode: true,
            severity: true,
            message: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        quarantineReviews: {
          select: {
            id: true,
            action: true,
            correctionFieldName: true,
            correctionNote: true,
            appliedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!record) throw new NotFoundException(`Record ${recordId} not found in batch ${batchId}`);
    return success(record);
  }
}
