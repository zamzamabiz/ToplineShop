import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, TradeDirection } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ListRecordsDto, SORT_COLUMNS } from './dto/list-records.dto';

// §17 — interactive raw scope budget.
const RAW_SCOPE_BUDGET = 10_000;
// §16 — page max.
const PAGE_MAX = 500;

@Injectable()
export class RecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async listRecords(tenantId: string, dto: ListRecordsDto) {
    const pageSize = Math.min(dto.pageSize ?? 50, PAGE_MAX);
    const page = dto.page ?? 0;
    const skip = page * pageSize;

    const where = buildWhere(tenantId, dto);

    // §20 — query-scope protection: require a date range or batchId when unconstrained.
    const hasScope = !!(dto.dateFrom || dto.dateTo || dto.batchId);
    if (!hasScope) {
      const total = await this.prisma.tdrRecord.count({ where });
      if (total > RAW_SCOPE_BUDGET) {
        throw new BadRequestException(
          'SCOPE_TOO_WIDE: provide dateFrom, dateTo, or batchId to narrow results',
        );
      }
    }

    const total = await this.prisma.tdrRecord.count({ where });

    // §19 — server-approved sort whitelist.
    const sortField =
      SORT_COLUMNS.includes(dto.sortBy as any) ? dto.sortBy! : 'tradeDate';
    const sortDir = dto.sortDir === 'asc' ? 'asc' : 'desc';

    const records = await this.prisma.tdrRecord.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortField]: sortDir },
      select: {
        id: true,
        batchId: true,
        sourceRowNumber: true,
        tradeDirection: true,
        tradeDate: true,
        hsCodeNormalized: true,
        hsChapter: true,
        productDescriptionNormalized: true,
        localPartyNameNormalized: true,
        localPartyTaxIdNormalized: true,
        foreignPartyNameNormalized: true,
        foreignPartyCountryCode: true,
        quantityNormalized: true,
        quantityUnitCode: true,
        unitPriceNormalized: true,
        currencyCode: true,
        rowDisposition: true,
        exportEligible: true,
        createdAt: true,
      },
    });

    return {
      records: records.map((r) => ({
        ...r,
        tradeDate: r.tradeDate?.toISOString().split('T')[0] ?? null,
        quantityNormalized: r.quantityNormalized?.toNumber() ?? null,
        unitPriceNormalized: r.unitPriceNormalized?.toNumber() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      hasMore: skip + pageSize < total,
    };
  }
}

function buildWhere(tenantId: string, dto: ListRecordsDto): Prisma.TdrRecordWhereInput {
  const where: Prisma.TdrRecordWhereInput = { tenantId };

  if (dto.dateFrom || dto.dateTo) {
    where.tradeDate = {};
    if (dto.dateFrom) where.tradeDate.gte = new Date(dto.dateFrom);
    if (dto.dateTo) where.tradeDate.lte = new Date(dto.dateTo);
  }

  if (dto.tradeDirection) where.tradeDirection = dto.tradeDirection as TradeDirection;
  if (dto.hsCodePrefix) where.hsCodeNormalized = { startsWith: dto.hsCodePrefix };
  if (dto.hsChapter) where.hsChapter = dto.hsChapter;
  if (dto.foreignCountryCode) where.foreignPartyCountryCode = dto.foreignCountryCode;
  if (dto.localPartyTaxId) where.localPartyTaxIdNormalized = dto.localPartyTaxId;
  if (dto.batchId) where.batchId = dto.batchId;
  if (dto.exportEligible !== undefined) where.exportEligible = dto.exportEligible;
  if (dto.dispositions?.length) where.rowDisposition = { in: dto.dispositions as any };

  return where;
}
