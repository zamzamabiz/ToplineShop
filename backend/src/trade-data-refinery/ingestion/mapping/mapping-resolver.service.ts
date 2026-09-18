import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TdrSchemaMapping, TradeDirection } from '@prisma/client';
import { INGESTION_ERROR } from '../constants/ingestion-error.codes';

@Injectable()
export class MappingResolverService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves the active mapping for a given tenant + profileId + direction.
   * Checks tenant-specific mappings first, then falls back to platform mappings.
   */
  async resolveMapping(
    tenantId: string,
    profileId: string,
    tradeDirection: TradeDirection,
  ): Promise<TdrSchemaMapping> {
    const mapping = await this.prisma.tdrSchemaMapping.findFirst({
      where: {
        profileId,
        tradeDirection,
        active: true,
        OR: [{ tenantId }, { scopeKey: 'PLATFORM' }],
      },
      orderBy: [
        // Prefer tenant-specific over platform
        { tenantId: 'desc' },
        { version: 'desc' },
      ],
    });

    if (!mapping) {
      throw Object.assign(
        new NotFoundException(
          `No active mapping found for profile "${profileId}" direction "${tradeDirection}"`,
        ),
        { code: INGESTION_ERROR.MAPPING_NOT_FOUND },
      );
    }

    if (mapping.tradeDirection !== tradeDirection) {
      throw Object.assign(
        new NotFoundException(
          `Mapping "${profileId}" is for ${mapping.tradeDirection}, not ${tradeDirection}`,
        ),
        { code: INGESTION_ERROR.MAPPING_DIRECTION_MISMATCH },
      );
    }

    return mapping;
  }
}
