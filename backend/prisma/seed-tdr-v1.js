'use strict';
/**
 * Seeds PLATFORM-scoped TDR_V1 canonical mapping profiles.
 *
 * Profiles:
 *   TDR_V1  EXPORT  — for TDR_V1_EXP_* files
 *   TDR_V1  IMPORT  — for TDR_V1_IMP_* files
 *
 * Scope: PLATFORM (resolves for any tenant — no tenantId required).
 * Version: 1.
 * Idempotent: upserts via unique(scopeKey, profileId, version, tradeDirection).
 *
 * TDR_V1 canonical format uses explicit exporter_* and importer_* headers.
 * Both directions share identical column mappings — the batch-level direction
 * field (not a row column) controls which party is local vs foreign.
 *
 * Usage (from backend/):
 *   node prisma/seed-tdr-v1.js
 *
 * DO NOT RUN AGAINST PRODUCTION unless PM-approved.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Both directions share the same column mapping definition.
// TDR_V1 files use exact canonical header names — no aliasing required.
function buildTdrV1Config() {
  return {
    version: 'v1',
    columnMappings: [
      {
        sourceColumnName: 'trade_date',
        canonicalField: 'tradeDate',
        sourceDatatype: 'DATE',
        transformationRule: 'DATE_PARSE_YMD',
        requiredPolicy: 'REQUIRED',
        validationRules: [],
      },
      {
        sourceColumnName: 'hs_code',
        canonicalField: 'hsCodeRaw',
        sourceDatatype: 'TEXT',
        requiredPolicy: 'REQUIRED',
        validationRules: [],
      },
      {
        sourceColumnName: 'product_description',
        canonicalField: 'productDescriptionRaw',
        sourceDatatype: 'TEXT',
        requiredPolicy: 'REQUIRED',
        validationRules: [],
      },
      {
        sourceColumnName: 'exporter_id',
        canonicalField: 'exporterIdRaw',
        sourceDatatype: 'TEXT',
        requiredPolicy: 'OPTIONAL',
        validationRules: [],
      },
      {
        sourceColumnName: 'exporter_name',
        canonicalField: 'exporterNameRaw',
        sourceDatatype: 'TEXT',
        requiredPolicy: 'REQUIRED',
        validationRules: [],
      },
      {
        sourceColumnName: 'exporter_address',
        canonicalField: 'exporterAddressRaw',
        sourceDatatype: 'TEXT',
        requiredPolicy: 'OPTIONAL',
        validationRules: [],
      },
      {
        sourceColumnName: 'exporter_country',
        canonicalField: 'exporterCountryRaw',
        sourceDatatype: 'TEXT',
        requiredPolicy: 'REQUIRED',
        validationRules: [],
      },
      {
        sourceColumnName: 'port_of_loading',
        canonicalField: 'portOfLoadingRaw',
        sourceDatatype: 'TEXT',
        requiredPolicy: 'OPTIONAL',
        validationRules: [],
      },
      {
        sourceColumnName: 'importer_id',
        canonicalField: 'importerIdRaw',
        sourceDatatype: 'TEXT',
        requiredPolicy: 'OPTIONAL',
        validationRules: [],
      },
      {
        sourceColumnName: 'importer_name',
        canonicalField: 'importerNameRaw',
        sourceDatatype: 'TEXT',
        requiredPolicy: 'REQUIRED',
        validationRules: [],
      },
      {
        sourceColumnName: 'importer_address',
        canonicalField: 'importerAddressRaw',
        sourceDatatype: 'TEXT',
        requiredPolicy: 'OPTIONAL',
        validationRules: [],
      },
      {
        sourceColumnName: 'importer_country',
        canonicalField: 'importerCountryRaw',
        sourceDatatype: 'TEXT',
        requiredPolicy: 'REQUIRED',
        validationRules: [],
      },
      {
        sourceColumnName: 'port_of_discharge',
        canonicalField: 'portOfDischargeRaw',
        sourceDatatype: 'TEXT',
        requiredPolicy: 'OPTIONAL',
        validationRules: [],
      },
      {
        sourceColumnName: 'quantity',
        canonicalField: 'quantityRaw',
        sourceDatatype: 'DECIMAL',
        requiredPolicy: 'OPTIONAL',
        validationRules: [],
      },
      {
        sourceColumnName: 'quantity_unit',
        canonicalField: 'quantityUnitRaw',
        sourceDatatype: 'TEXT',
        requiredPolicy: 'OPTIONAL',
        validationRules: [],
      },
      {
        sourceColumnName: 'unit_price',
        canonicalField: 'unitPriceRaw',
        sourceDatatype: 'DECIMAL',
        requiredPolicy: 'OPTIONAL',
        validationRules: [],
      },
      {
        sourceColumnName: 'currency_code',
        canonicalField: 'currencyRaw',
        sourceDatatype: 'TEXT',
        requiredPolicy: 'OPTIONAL',
        validationRules: [],
      },
      {
        sourceColumnName: 'data_source',
        canonicalField: 'dataSourceRaw',
        sourceDatatype: 'TEXT',
        requiredPolicy: 'REQUIRED',
        validationRules: [],
      },
    ],
  };
}

async function main() {
  console.log('Seeding TDR_V1 canonical mapping profiles...');

  const config = buildTdrV1Config();

  const exportProfile = await prisma.tdrSchemaMapping.upsert({
    where: {
      scopeKey_profileId_version_tradeDirection: {
        scopeKey: 'PLATFORM',
        profileId: 'TDR_V1',
        version: 1,
        tradeDirection: 'EXPORT',
      },
    },
    update: {
      mappingConfig: config,
      active: true,
    },
    create: {
      scopeKey: 'PLATFORM',
      profileId: 'TDR_V1',
      version: 1,
      tradeDirection: 'EXPORT',
      mappingConfig: config,
      active: true,
    },
  });
  console.log(`EXPORT profile: ${exportProfile.id}  (${exportProfile.profileId} v${exportProfile.version} active=${exportProfile.active})`);

  const importProfile = await prisma.tdrSchemaMapping.upsert({
    where: {
      scopeKey_profileId_version_tradeDirection: {
        scopeKey: 'PLATFORM',
        profileId: 'TDR_V1',
        version: 1,
        tradeDirection: 'IMPORT',
      },
    },
    update: {
      mappingConfig: config,
      active: true,
    },
    create: {
      scopeKey: 'PLATFORM',
      profileId: 'TDR_V1',
      version: 1,
      tradeDirection: 'IMPORT',
      mappingConfig: config,
      active: true,
    },
  });
  console.log(`IMPORT profile: ${importProfile.id}  (${importProfile.profileId} v${importProfile.version} active=${importProfile.active})`);

  console.log('\n=== TDR_V1 canonical mapping profiles seeded ===');
  console.log('TDR_V1  EXPORT  PLATFORM  active=true');
  console.log('TDR_V1  IMPORT  PLATFORM  active=true');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
