'use strict';
/**
 * Seeds PLATFORM-scoped Pakistan Customs mapping profiles for January 2025.
 *
 * Profiles:
 *   Exp_Pak_Jan_2025  — EXPORT direction
 *   Imp_Pak_Jan_2025  — IMPORT direction
 *
 * Scope: PLATFORM (resolves for any tenant — no tenantId required).
 * Version: 1.
 * Idempotent: upserts via unique(scopeKey, profileId, version).
 *
 * Usage (from backend/):
 *   node prisma/seed-pakistan-customs.js
 *
 * Source headers captured: 2026-09-20 from real Pakistan Customs Jan-2025 CSV files.
 * DO NOT RUN AGAINST PRODUCTION unless PM-approved.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// EXPORT profile — Exp_Pak_Jan_2025
// Source date format: YYYY-MM-DD (e.g. 2025-01-01)
// Currency: ISO 4217 numeric codes (e.g. 840 = USD)
// Unit: short aliases (e.g. u = PCS)
// Local party = exporter (Pakistan). Foreign party = importer.
// Skipped source columns:
//   trade_direction  — batch-level, not row-level
//   hs_chapter       — derived from hs_code by normalizer
//   exporter_country — always Pakistan; localCountryCode = 'PK' covers it
// ---------------------------------------------------------------------------
const EXPORT_CONFIG = {
  version: 'v1',
  localCountryCode: 'PK',
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
      requiredPolicy: 'OPTIONAL',
      validationRules: [],
    },
    {
      sourceColumnName: 'local_party_tax_id',
      canonicalField: 'localPartyTaxIdRaw',
      sourceDatatype: 'TEXT',
      requiredPolicy: 'OPTIONAL',
      validationRules: [],
    },
    {
      sourceColumnName: 'exporter_name',
      canonicalField: 'localPartyNameRaw',
      sourceDatatype: 'TEXT',
      requiredPolicy: 'REQUIRED',
      validationRules: [],
    },
    {
      sourceColumnName: 'exporter_address',
      canonicalField: 'localPartyAddressRaw',
      sourceDatatype: 'TEXT',
      requiredPolicy: 'OPTIONAL',
      validationRules: [],
    },
    {
      sourceColumnName: 'importer_name',
      canonicalField: 'foreignPartyNameRaw',
      sourceDatatype: 'TEXT',
      requiredPolicy: 'REQUIRED',
      validationRules: [],
    },
    {
      sourceColumnName: 'importer_address',
      canonicalField: 'foreignPartyAddressRaw',
      sourceDatatype: 'TEXT',
      requiredPolicy: 'OPTIONAL',
      validationRules: [],
    },
    {
      sourceColumnName: 'importer_country',
      canonicalField: 'foreignPartyCountryRaw',
      sourceDatatype: 'TEXT',
      requiredPolicy: 'OPTIONAL',
      validationRules: [],
    },
    {
      sourceColumnName: 'port_of_loading',
      canonicalField: 'originPortRaw',
      sourceDatatype: 'TEXT',
      requiredPolicy: 'OPTIONAL',
      validationRules: [],
    },
    {
      sourceColumnName: 'quantity',
      canonicalField: 'quantityRaw',
      sourceDatatype: 'DECIMAL',
      requiredPolicy: 'REQUIRED',
      validationRules: [],
    },
    {
      sourceColumnName: 'quantity_unit',
      canonicalField: 'quantityUnitRaw',
      sourceDatatype: 'TEXT',
      requiredPolicy: 'REQUIRED',
      validationRules: [],
    },
    {
      sourceColumnName: 'unit_price',
      canonicalField: 'unitPriceRaw',
      sourceDatatype: 'DECIMAL',
      requiredPolicy: 'REQUIRED',
      validationRules: [],
    },
    {
      sourceColumnName: 'currency_code',
      canonicalField: 'currencyRaw',
      sourceDatatype: 'TEXT',
      requiredPolicy: 'REQUIRED',
      validationRules: [],
    },
    {
      sourceColumnName: 'data_source',
      canonicalField: 'dataSourceRaw',
      sourceDatatype: 'TEXT',
      requiredPolicy: 'OPTIONAL',
      defaultValue: 'Pak_Customs',
      validationRules: [],
    },
  ],
};

// ---------------------------------------------------------------------------
// IMPORT profile — Imp_Pak_Jan_2025
// Source date format: DD-MM-YY (e.g. 01-01-25)
// Currency: text labels (e.g. "US $")
// Unit: standard aliases (e.g. KG)
// Local party = importer (Pakistan). Foreign party = exporter.
// Skipped source columns:
//   HS_CHAPTER       — derived from HS_Code by normalizer
//   IMPORTER_COUNTRY — always Pakistan; localCountryCode = 'PK' covers it
// ---------------------------------------------------------------------------
const IMPORT_CONFIG = {
  version: 'v1',
  localCountryCode: 'PK',
  columnMappings: [
    {
      sourceColumnName: 'DATE',
      canonicalField: 'tradeDate',
      sourceDatatype: 'DATE',
      transformationRule: 'DATE_PARSE_DMY',
      requiredPolicy: 'REQUIRED',
      validationRules: [],
    },
    {
      sourceColumnName: 'HS_Code',
      canonicalField: 'hsCodeRaw',
      sourceDatatype: 'TEXT',
      requiredPolicy: 'REQUIRED',
      validationRules: [],
    },
    {
      sourceColumnName: 'Item_Description',
      canonicalField: 'productDescriptionRaw',
      sourceDatatype: 'TEXT',
      requiredPolicy: 'OPTIONAL',
      validationRules: [],
    },
    {
      sourceColumnName: 'NTN',
      canonicalField: 'localPartyTaxIdRaw',
      sourceDatatype: 'TEXT',
      requiredPolicy: 'OPTIONAL',
      validationRules: [],
    },
    {
      sourceColumnName: 'Importer',
      canonicalField: 'localPartyNameRaw',
      sourceDatatype: 'TEXT',
      requiredPolicy: 'REQUIRED',
      validationRules: [],
    },
    {
      sourceColumnName: 'IMPORTER_ADDRESS',
      canonicalField: 'localPartyAddressRaw',
      sourceDatatype: 'TEXT',
      requiredPolicy: 'OPTIONAL',
      validationRules: [],
    },
    {
      sourceColumnName: 'EXPORTER',
      canonicalField: 'foreignPartyNameRaw',
      sourceDatatype: 'TEXT',
      requiredPolicy: 'OPTIONAL',
      validationRules: [],
    },
    {
      sourceColumnName: 'Port_of_Shipment',
      canonicalField: 'originPortRaw',
      sourceDatatype: 'TEXT',
      requiredPolicy: 'OPTIONAL',
      validationRules: [],
    },
    {
      sourceColumnName: 'EXPORTER_COUNTRY',
      canonicalField: 'foreignPartyCountryRaw',
      sourceDatatype: 'TEXT',
      requiredPolicy: 'OPTIONAL',
      validationRules: [],
    },
    {
      sourceColumnName: 'Quantity',
      canonicalField: 'quantityRaw',
      sourceDatatype: 'DECIMAL',
      requiredPolicy: 'REQUIRED',
      validationRules: [],
    },
    {
      sourceColumnName: 'UNIT',
      canonicalField: 'quantityUnitRaw',
      sourceDatatype: 'TEXT',
      requiredPolicy: 'REQUIRED',
      validationRules: [],
    },
    {
      sourceColumnName: 'PRICE',
      canonicalField: 'unitPriceRaw',
      sourceDatatype: 'DECIMAL',
      requiredPolicy: 'REQUIRED',
      validationRules: [],
    },
    {
      sourceColumnName: 'Currency',
      canonicalField: 'currencyRaw',
      sourceDatatype: 'TEXT',
      requiredPolicy: 'REQUIRED',
      validationRules: [],
    },
    {
      sourceColumnName: 'data_source',
      canonicalField: 'dataSourceRaw',
      sourceDatatype: 'TEXT',
      requiredPolicy: 'OPTIONAL',
      defaultValue: 'Pak_Customs',
      validationRules: [],
    },
  ],
};

async function main() {
  console.log('Seeding Pakistan Customs mapping profiles...');

  const exportProfile = await prisma.tdrSchemaMapping.upsert({
    where: {
      scopeKey_profileId_version_tradeDirection: {
        scopeKey: 'PLATFORM',
        profileId: 'Exp_Pak_Jan_2025',
        version: 1,
        tradeDirection: 'EXPORT',
      },
    },
    update: {
      mappingConfig: EXPORT_CONFIG,
      active: true,
      tradeDirection: 'EXPORT',
    },
    create: {
      scopeKey: 'PLATFORM',
      profileId: 'Exp_Pak_Jan_2025',
      version: 1,
      tradeDirection: 'EXPORT',
      mappingConfig: EXPORT_CONFIG,
      active: true,
    },
  });
  console.log(`EXPORT profile: ${exportProfile.id}  (${exportProfile.profileId} v${exportProfile.version} active=${exportProfile.active})`);

  const importProfile = await prisma.tdrSchemaMapping.upsert({
    where: {
      scopeKey_profileId_version_tradeDirection: {
        scopeKey: 'PLATFORM',
        profileId: 'Imp_Pak_Jan_2025',
        version: 1,
        tradeDirection: 'IMPORT',
      },
    },
    update: {
      mappingConfig: IMPORT_CONFIG,
      active: true,
      tradeDirection: 'IMPORT',
    },
    create: {
      scopeKey: 'PLATFORM',
      profileId: 'Imp_Pak_Jan_2025',
      version: 1,
      tradeDirection: 'IMPORT',
      mappingConfig: IMPORT_CONFIG,
      active: true,
    },
  });
  console.log(`IMPORT profile: ${importProfile.id}  (${importProfile.profileId} v${importProfile.version} active=${importProfile.active})`);

  console.log('\n=== Pakistan Customs mapping profiles seeded ===');
  console.log('Exp_Pak_Jan_2025  EXPORT  PLATFORM  active=true');
  console.log('Imp_Pak_Jan_2025  IMPORT  PLATFORM  active=true');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
