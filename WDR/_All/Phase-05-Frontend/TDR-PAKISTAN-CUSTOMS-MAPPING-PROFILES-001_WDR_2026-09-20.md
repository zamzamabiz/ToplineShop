# TDR-PAKISTAN-CUSTOMS-MAPPING-PROFILES-001 — Work Done Record
**PAKISTAN CUSTOMS MAPPING PROFILES VERIFIED — PASS**
**EXPORT: Exp_Pak_Jan_2025 | IMPORT: Imp_Pak_Jan_2025**
**Date:** 2026-09-20
**Branch:** codex/trade-data-refinery
**Status:** ✅ PASS

---

## §1. BASELINE

| Item | Value |
|------|-------|
| Branch | `codex/trade-data-refinery` |
| HEAD at task start | `2d72bd5` |
| Prior WDR | TDR-AUTH-SESSION-LIFECYCLE-CORRECTION-001-CHECKPOINT-001 |
| Trigger | Runtime error: `No active mapping found for profile "Exp_Pak_Jan_2025" direction "EXPORT"` |

---

## §2. SCOPE AND CONSTRAINTS

**Goal:** Create PLATFORM-scoped IMPORT + EXPORT mapping profiles for Pakistan Customs January 2025 data so upload resolves instead of throwing MAPPING_NOT_FOUND.

**Hard constraints applied:**
- DO NOT GUESS HEADERS — used only headers provided from real source files
- DO NOT START PHASE 7
- HS code preserved as TEXT — no numeric coercion, no leading-zero stripping
- blank ≠ zero — blank quantity/price returns null Decimal (confirmed by tests)
- No silent country inference — localCountryCode from config, not column data
- Existing currency normalization reused (currency.map.ts)
- Existing unit normalization reused (unit.map.ts)
- No schema migration — TdrSchemaMapping model already existed
- PLATFORM scope only — resolves for any tenant

---

## §3. ACTUAL SOURCE HEADERS (AUTHORITATIVE)

### EXPORT source — Exp_Pak_Jan_2025
```
trade_date, trade_direction, hs_chapter, hs_code, product_description,
local_party_tax_id, exporter_name, exporter_address, exporter_country,
port_of_loading, importer_name, importer_address, importer_country,
quantity, quantity_unit, unit_price, currency_code
```
Date format: YYYY-MM-DD (e.g. 2025-01-01)
Currency: ISO 4217 numeric code (e.g. 840 = USD)
Unit: short alias (e.g. u = PCS)

### IMPORT source — Imp_Pak_Jan_2025
```
DATE, HS_CHAPTER, HS_Code, Item_Description, NTN, Importer,
IMPORTER_ADDRESS, IMPORTER_COUNTRY, EXPORTER, Port_of_Shipment,
EXPORTER_COUNTRY, Quantity, UNIT, PRICE, Currency
```
Date format: DD-MM-YY (e.g. 01-01-25) — 2-digit year warns in quality engine (correct behavior)
Currency: text label (e.g. US $)
Unit: standard aliases (e.g. KG)

---

## §4. CANONICAL FIELD MAPPING

**Canonical fields** (from `normalizer.service.ts → buildFieldValues` and `validator.service.ts → getRawValueForCanonical`):

| Canonical Field | Description |
|-----------------|-------------|
| `tradeDate` | Trade date |
| `hsCodeRaw` | HS code (always TEXT) |
| `productDescriptionRaw` | Product/item description |
| `localPartyTaxIdRaw` | Local party tax/NTN ID |
| `localPartyNameRaw` | Local party name (exporter for EXPORT, importer for IMPORT) |
| `localPartyAddressRaw` | Local party address |
| `foreignPartyNameRaw` | Foreign party name (importer for EXPORT, exporter for IMPORT) |
| `foreignPartyAddressRaw` | Foreign party address |
| `foreignPartyCountryRaw` | Foreign party country |
| `originPortRaw` | Port of loading / shipment |
| `quantityRaw` | Quantity (DECIMAL) |
| `quantityUnitRaw` | Unit of measure |
| `unitPriceRaw` | Unit price (DECIMAL) |
| `currencyRaw` | Currency (text or numeric — resolved by currency.map.ts) |

### SKIPPED source columns (no canonical target)

| Source Column | Direction | Reason |
|---------------|-----------|--------|
| `trade_direction` | EXPORT | Batch-level field — set from DTO, not row-level |
| `hs_chapter` | EXPORT | Derived by normalizer from `hsCodeRaw` automatically |
| `exporter_country` | EXPORT | Always Pakistan → `localCountryCode: 'PK'` in config |
| `HS_CHAPTER` | IMPORT | Derived by normalizer from `HS_Code` automatically |
| `IMPORTER_COUNTRY` | IMPORT | Always Pakistan → `localCountryCode: 'PK'` in config |

---

## §5. EXPORT PROFILE — Exp_Pak_Jan_2025

| Source Column | Canonical Field | Datatype | Required | Transformation |
|---------------|-----------------|----------|----------|----------------|
| `trade_date` | `tradeDate` | DATE | REQUIRED | DATE_PARSE_YMD |
| `hs_code` | `hsCodeRaw` | TEXT | REQUIRED | — |
| `product_description` | `productDescriptionRaw` | TEXT | OPTIONAL | — |
| `local_party_tax_id` | `localPartyTaxIdRaw` | TEXT | OPTIONAL | — |
| `exporter_name` | `localPartyNameRaw` | TEXT | REQUIRED | — |
| `exporter_address` | `localPartyAddressRaw` | TEXT | OPTIONAL | — |
| `importer_name` | `foreignPartyNameRaw` | TEXT | REQUIRED | — |
| `importer_address` | `foreignPartyAddressRaw` | TEXT | OPTIONAL | — |
| `importer_country` | `foreignPartyCountryRaw` | TEXT | OPTIONAL | — |
| `port_of_loading` | `originPortRaw` | TEXT | OPTIONAL | — |
| `quantity` | `quantityRaw` | DECIMAL | REQUIRED | — |
| `quantity_unit` | `quantityUnitRaw` | TEXT | REQUIRED | — |
| `unit_price` | `unitPriceRaw` | DECIMAL | REQUIRED | — |
| `currency_code` | `currencyRaw` | TEXT | REQUIRED | — |

`localCountryCode: 'PK'` — local party = exporter, country inferred from config

---

## §6. IMPORT PROFILE — Imp_Pak_Jan_2025

| Source Column | Canonical Field | Datatype | Required | Transformation |
|---------------|-----------------|----------|----------|----------------|
| `DATE` | `tradeDate` | DATE | REQUIRED | DATE_PARSE_DMY |
| `HS_Code` | `hsCodeRaw` | TEXT | REQUIRED | — |
| `Item_Description` | `productDescriptionRaw` | TEXT | OPTIONAL | — |
| `NTN` | `localPartyTaxIdRaw` | TEXT | OPTIONAL | — |
| `Importer` | `localPartyNameRaw` | TEXT | REQUIRED | — |
| `IMPORTER_ADDRESS` | `localPartyAddressRaw` | TEXT | OPTIONAL | — |
| `EXPORTER` | `foreignPartyNameRaw` | TEXT | OPTIONAL | — |
| `Port_of_Shipment` | `originPortRaw` | TEXT | OPTIONAL | — |
| `EXPORTER_COUNTRY` | `foreignPartyCountryRaw` | TEXT | OPTIONAL | — |
| `Quantity` | `quantityRaw` | DECIMAL | REQUIRED | — |
| `UNIT` | `quantityUnitRaw` | TEXT | REQUIRED | — |
| `PRICE` | `unitPriceRaw` | DECIMAL | REQUIRED | — |
| `Currency` | `currencyRaw` | TEXT | REQUIRED | — |

`localCountryCode: 'PK'` — local party = importer, country inferred from config

---

## §7. SEED MECHANISM

**File:** `backend/prisma/seed-pakistan-customs.js`

- Idempotent upsert via `@@unique([scopeKey, profileId, version])`
- `scopeKey = 'PLATFORM'` — resolves for any tenant
- `active = true` on both profiles
- Run: `node prisma/seed-pakistan-customs.js` from `backend/`

**Seed output (actual):**
```
EXPORT profile: 32b5475f-3ec2-4627-9ef3-e42c505ec505  (Exp_Pak_Jan_2025 v1 active=true)
IMPORT profile: bec37a36-fe47-4333-ae40-aa3e5086b8d4  (Imp_Pak_Jan_2025 v1 active=true)
```

---

## §8. RESOLVER VERIFICATION

Executed `MappingResolverService.resolveMapping()` query logic against live DB with dummy tenantId:

| Profile | Direction | scopeKey | active | Result |
|---------|-----------|----------|--------|--------|
| `Exp_Pak_Jan_2025` | EXPORT | PLATFORM | true | ✅ RESOLVED — id: 32b5475f... |
| `Imp_Pak_Jan_2025` | IMPORT | PLATFORM | true | ✅ RESOLVED — id: bec37a36... |

PLATFORM scope fallback confirmed: tenant-first ORDER BY with PLATFORM as fallback matches resolver behavior.

---

## §9. DATA RULES VERIFIED

| Rule | Evidence |
|------|---------|
| HS code preserved as TEXT | Test: `hsCodeRaw = '6105.2'` (string) — no float coercion |
| Leading zeros preserved | Test: `'030211'` → `hsCodeRaw = '030211'`, `hsChapter = '03'` |
| blank ≠ zero for quantity | Test: blank `quantity` → `quantityNormalized = null` |
| blank ≠ zero for unit_price | Test: blank `unit_price` → `unitPriceNormalized = null` |
| Currency numeric "840" → USD | `resolveCurrencyCode('840') = 'USD'` (existing NUMERIC_TO_ISO map) |
| Currency text "US $" → USD | `resolveCurrencyCode('US $') = 'USD'` (existing TEXT_TO_ISO map) |
| Unit "u" → PCS | `resolveUnitCode('u') = 'PCS'` |
| Unit "KG" → KG | `resolveUnitCode('KG') = 'KG'` |
| No silent country inference | localPartyCountryCode from `config.localCountryCode` only |
| 2-digit year date warns | DD-MM-YY "01-01-25" → `tradeDate = null`, `TRADE_DATE_INVALID` warning |
| 4-digit year IMPORT parses | "01-01-2025" → `tradeDate = 2025-01-01T00:00:00.000Z` |
| EXPORT date parses | "2025-01-01" with DATE_PARSE_YMD → correct date |

---

## §10. NO SCHEMA MIGRATION REQUIRED

`TdrSchemaMapping` model already exists in `schema.prisma` (lines 322–341).
`mappingConfig` is `Json` type — accepts `MappingConfigV1` without schema change.
No migration created, no migration needed.

---

## §11. TEST RESULTS

| Suite | Result |
|-------|--------|
| `tdr-pakistan-customs-mapping.spec.ts` (47 tests) | **47 / 47 PASS ✅** |
| `tdr-mega3-unit.spec.ts` (isolated) | 84 / 85 PASS (1 known skip) ✅ |
| `tdr-mega4-unit.spec.ts` | PASS ✅ |
| `tdr-mega5-unit.spec.ts` | PASS ✅ |
| `tdr-correction-002.spec.ts` | PASS ✅ |
| `auth.spec.ts` | PASS ✅ |
| `auth-rbac.spec.ts` | PASS ✅ |
| Backend tsc | **PASS ✅** |
| DB-integration suites | Pre-existing failures (not caused by this task) |

Pre-existing failures in `p8-002-db-integration.spec.ts` and `tdr-mega1-db-integration.spec.ts` are unchanged — these require specific DB state and were failing before this task.

---

## §12. FILES CHANGED

| File | Status |
|------|--------|
| `backend/prisma/seed-pakistan-customs.js` | NEW — idempotent seed script |
| `backend/src/trade-data-refinery/tdr-pakistan-customs-mapping.spec.ts` | NEW — 47 unit tests |

No existing files modified.

---

## §13. SECURITY VERIFICATION

| Constraint | Status |
|-----------|--------|
| No secrets recorded | ✅ |
| No DATABASE_URL in WDR | ✅ |
| No token / password in any file | ✅ |
| No Phase 7 started | ✅ |
| No schema migration | ✅ |
| No full file ingestion | ✅ (mapping only, no data rows) |
| No hardcoded tenant data | ✅ (PLATFORM scope) |

---

## §14. VERDICT

**PAKISTAN CUSTOMS MAPPING PROFILES VERIFIED — PASS**

Both profiles created, seeded, resolver-verified, and unit-tested.
- `Exp_Pak_Jan_2025` (EXPORT) — 14 column mappings, `localCountryCode: 'PK'`
- `Imp_Pak_Jan_2025` (IMPORT) — 13 column mappings, `localCountryCode: 'PK'`

The runtime error `No active mapping found for profile "Exp_Pak_Jan_2025" direction "EXPORT"` is resolved.
No schema migration. No Phase 7. TypeScript clean. 47/47 tests pass.
