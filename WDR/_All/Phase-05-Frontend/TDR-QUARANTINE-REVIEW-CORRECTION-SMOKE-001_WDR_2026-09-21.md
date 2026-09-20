# TDR-QUARANTINE-REVIEW-CORRECTION-SMOKE-001 — Work Done Record
**QUARANTINE REVIEW + CORRECTION SMOKE TEST — BLOCKED: RULE-MODEL DEFECT**
**Date:** 2026-09-21
**Branch:** codex/trade-data-refinery
**Status:** ⛔ BLOCKED — Classification C (rule-model defect) + B (buildRevalidationRow regression)

---

## §1. BASELINE

| Item | Value |
|------|-------|
| Branch | `codex/trade-data-refinery` |
| HEAD at start | `a016429` (TDR-FAILED-QUALITY-JOB-RECOVERY-GUARD-001 WDR — PASS) |
| HEAD at diagnosis | `cdeb982` (TDR-QUARANTINE-REVIEW-CORRECTION-SMOKE-001 WDR — BLOCKED) |
| Target batch | `0aecd7a9-3ebe-42c9-8b39-ac0e9a09f0c2` (IMPORT, `Imp_Pak_Jan_2025_sample_v2.csv`) |
| Tenant | `6755271c-7b4c-40f2-a5aa-8be135cee886` |
| Batch status (before correction) | `REVIEW_REQUIRED` |
| Quarantined rows (before correction) | 1 |
| Accepted rows (before correction) | 15 |

---

## §2. PURPOSE

Verify the end-to-end quarantine review and correction workflow, including:
1. Quarantine listing API returns the correct open issues
2. Quality detail API returns full record context
3. Correction API accepts a corrected value, re-evaluates, and transitions the record
4. Batch final state transitions to READY with all records accepted
5. Data integrity is maintained throughout

Task constraint: DO NOT reset database, DO NOT manually edit record dispositions, DO NOT reupload source files.

---

## §3. QUARANTINE LISTING VERIFIED

**Endpoint:** `GET /tdr/batches/0aecd7a9-3ebe-42c9-8b39-ac0e9a09f0c2/quarantine`

| Field | Value |
|-------|-------|
| Record ID | `c5c71391-e10f-40ca-bd51-e7db5d107a37` |
| sourceRowNumber | 14 (0-indexed) → Row 15 in CSV |
| rowDisposition | `QUARANTINED` |
| Issue ID | `5f1634f4-2942-4081-b951-374072212130` |
| fieldName | `quantityRaw` |
| ruleCode | `REQUIRED_FIELD_MISSING` |
| severity | `ERROR` |
| status | `OPEN` (pre-correction) |

**Result:** ✅ Exactly 1 OPEN quarantine issue — correct.

---

## §4. QUALITY DETAIL (PRE-CORRECTION)

**Canonical endpoint:** `GET /tdr/batches/:batchId/records/:recordId/quality`

| Field | Value |
|-------|-------|
| hsCode | `2202.10` (as TEXT, preserved exactly) |
| commodityDescription | `WATERS FLAVOURED MINERAL` |
| supplierName | `RED BULL GMBH` |
| supplierCountryCode | `AT` (Austria) |
| quantityRaw | `""` (empty string) |
| quantityNormalized | `null` |
| currencyCode | `USD` |
| unitPriceNormalized | `0.85` |
| quantityUnitCode | `PCS` |
| quarantineReviews | `[]` (none yet) |

---

## §5. SOURCE FILE INSPECTION

**File:** `backend/uploads/6755271c-7b4c-40f2-a5aa-8be135cee886/a7220ede-e82f-4bbb-8a26-5619b91eb5e8`
**Row 15 content:**

```
13-01-2025,22,2202.10,WATERS FLAVOURED MINERAL,1100223344,BEVERAGE IMPORTS PAKISTAN,DHA LAHORE,PAKISTAN,RED BULL GMBH,Salzburg,AUSTRIA,,u,0.85,US $
```

Blank `Quantity` column (between the two commas after `AUSTRIA`) is intentional test fixture data. `REQUIRED_FIELD_MISSING` is the correct and expected result.

---

## §6. CORRECTION SUBMISSION — EXECUTED

**Owner-authorized value:** `quantityNormalized = 100`

**Endpoint called:** `POST /tdr/batches/0aecd7a9-.../records/c5c71391-.../correct`

**Request:**
```json
{
  "fieldName": "quantityNormalized",
  "correctedValue": "100",
  "note": "Owner-authorized bounded smoke-test correction for intentionally blank fixture quantity (Imp_Pak_Jan_2025_sample_v2.csv row 15, HS 2202.10)"
}
```

**Response:**
| Field | Value |
|-------|-------|
| reviewId | `098490cc-923a-4348-80a1-779fee5b4e8b` |
| newDisposition | `QUARANTINED` |
| exportEligible | `false` |

Correction was accepted by the API. No error. But `newDisposition = QUARANTINED` — the record did NOT transition to `ACCEPTED`.

---

## §7. DATABASE STATE AFTER CORRECTION (READ-ONLY)

**Verified via Prisma query. No DB mutations performed.**

### Record `c5c71391-e10f-40ca-bd51-e7db5d107a37`

| Field | Value | Assessment |
|-------|-------|------------|
| `quantityRaw` | `""` | ✅ Unchanged — raw source immutable |
| `quantityNormalized` | `"100"` | ✅ Correction persisted |
| `rowDisposition` | `QUARANTINED` | ⛔ Not resolved |
| `exportEligible` | `false` | ⛔ Not eligible |
| `valueTreatmentMeta.quantityNormalized` | `"CORRECTED"` | ✅ Correction flag set |

### Validation Issues (3 total after correction)

| ID | fieldName | ruleCode | severity | status | Origin |
|----|-----------|----------|----------|--------|--------|
| `5f1634f4` | `quantityRaw` | `REQUIRED_FIELD_MISSING` | ERROR | **REVIEWED** | Original — closed by Step 1 ✅ |
| `7e357cbb` | `tradeDate` | `TRADE_DATE_INVALID` | ERROR | **OPEN** | Regression — new issue created by revalidation ⛔ |
| `05a59d3f` | `quantityRaw` | `REQUIRED_FIELD_MISSING` | ERROR | **OPEN** | Re-fired — new issue created by revalidation ⛔ |

### Quarantine Review History

| ID | action | correctionFieldName | note | appliedAt |
|----|--------|---------------------|------|-----------|
| `098490cc-923a-4348-80a1-779fee5b4e8b` | `CORRECT` | `quantityNormalized` | "Owner-authorized bounded smoke-test correction…" | `2026-09-20T23:30:14Z` |

Exactly one correction review. No duplicates. Audit: `beforeHash` and `afterHash` only — no plaintext value stored.

### Batch `0aecd7a9`

| Field | Value |
|-------|-------|
| `status` | `REVIEW_REQUIRED` — unchanged |
| `totalSourceRows` | 16 |
| `processedRows` | 16 |
| `acceptedRows` | 15 |
| `quarantinedRows` | 1 |
| `rejectedRows` | 0 |

Batch counts did not change. The correction did not promote the record out of quarantine.

---

## §8. ROOT CAUSE TRACE — WHY QUARANTINED REMAINED

### CorrectionService revalidation path (source: `correction.service.ts`)

**Step 1** — prior OPEN issues marked `REVIEWED`:
- Issue `5f1634f4` (`quantityRaw` / `REQUIRED_FIELD_MISSING`) → `REVIEWED` ✓

**Step 2** — DB write: `quantityNormalized = "100"`, `valueTreatmentMeta.quantityNormalized = "CORRECTED"` ✓

**Revalidation — `buildRevalidationRow(updatedRecord, config)`** (`correction.service.ts` lines 186–197):
```typescript
for (const cm of config.columnMappings) {
  const v = record[cm.canonicalField];
  row[cm.sourceColumnName] = v !== null && v !== undefined ? String(v) : '';
}
```

Pakistan Customs `Imp_Pak_Jan_2025` mapping (`seed-pakistan-customs.js` line 220–225):
```javascript
{ sourceColumnName: 'Quantity', canonicalField: 'quantityRaw', requiredPolicy: 'REQUIRED' }
```

`record['quantityRaw'] = ""` → `row['Quantity'] = ""`

The corrected `quantityNormalized = "100"` is **not used** to reconstruct the source row. The blank raw field is used instead.

**`normalizeRowV1(revalidationRow, config)`** (`normalizer.service.ts` lines 120–122):
```typescript
const quantityRaw = fieldValues['quantityRaw'] ?? null;  // "" (from row['Quantity'] = "")
const { value: quantityNormalized, warn } = parseDecimal(quantityRaw);
// parseDecimal("") → { value: null, ... }
// In-memory quantityNormalized = null (DB has 100, but revalidation ignores it)
```

**`validateRowV1(newNormalized, config)`** (`validator.service.ts` lines 38–49):
```typescript
for (const cm of config.columnMappings) {
  if (cm.requiredPolicy !== 'REQUIRED') continue;
  const rawValue = getRawValueForCanonical(normalized, cm.canonicalField);
  // getRawValueForCanonical: map['quantityRaw'] = norm.quantityRaw = ""
  if (rawValue === null || rawValue === '') {
    issues.push({ ruleCode: 'REQUIRED_FIELD_MISSING', ... });
  }
}
```

→ New `REQUIRED_FIELD_MISSING` OPEN issue (`05a59d3f`) created on `quantityRaw`.

**Step 4** — `rowDisposition = QUARANTINED` written from in-memory decision ✓ (correct behavior — record IS quarantined per the revalidation rules)

---

## §9. ROOT CAUSE — SECONDARY: TRADE_DATE_INVALID REGRESSION

**New issue `7e357cbb`** — `tradeDate` / `TRADE_DATE_INVALID` / ERROR / OPEN — was NOT present before correction. It was created during revalidation.

**Cause:** `buildRevalidationRow` maps `canonicalField: 'tradeDate'` (a JavaScript `Date` object in the Prisma record) through `String()`:

```typescript
const v = record['tradeDate'];  // Date object: 2026-01-13T00:00:00.000Z
row['DATE'] = String(v);        // "Mon Jan 13 2025 05:00:00 GMT+0500 (Pakistan Standard Time)"
```

Then `normalizeRowV1` tries to parse this with `DATE_PARSE_DMY` (format `DD-MM-YYYY`) and fails → `TRADE_DATE_INVALID` warning → `warningToSeverity('TRADE_DATE_INVALID') = 'ERROR'` → promoted to OPEN validation issue.

**Root:** `buildRevalidationRow` uses `canonicalField: 'tradeDate'` which points to the typed `Date` object, not the raw string `tradeDateRaw`. Reconstructing the source row for a date field requires the raw string, not the parsed Date object.

This is a **separate defect** in `buildRevalidationRow` that did not affect the original quality run (which reads directly from the CSV) but affects the correction revalidation path.

---

## §10. CLASSIFICATION

### Question A — Why did correction remain QUARANTINED?

**Classification: C — RULE-MODEL DEFECT**

> `REQUIRED_FIELD_MISSING` is attached to `quantityRaw` (immutable raw field). Human correction is only permitted on `quantityNormalized` (normalized field). The revalidation path in `buildRevalidationRow` reconstructs the source row using `quantityRaw = ""`, not the corrected `quantityNormalized = "100"`. Re-normalization re-derives `quantityNormalized = null` from the blank raw value. `REQUIRED_FIELD_MISSING` fires again. The quarantine is **intrinsically unresolvable** through the current correction model.

**Evidence:**
- `Imp_Pak_Jan_2025` mapping: `canonicalField: 'quantityRaw'`, `requiredPolicy: 'REQUIRED'` (`seed-pakistan-customs.js:220`)
- `buildRevalidationRow` reads `record['quantityRaw']` = `""` → `row['Quantity'] = ""` (`correction.service.ts:192`)
- `normalizeRowV1` re-derives `quantityNormalized = null` from blank raw (`normalizer.service.ts:121`)
- `validateRowV1` fires `REQUIRED_FIELD_MISSING` on empty `quantityRaw` (`validator.service.ts:41`)
- `quantityNormalized` is in `CORRECTABLE_FIELDS`; `quantityRaw` is not (`correction.dto.ts:7`)
- Correcting `quantityNormalized` does NOT change `quantityRaw` — raw data is immutable by design

**Also present: Classification B component — `buildRevalidationRow` defect:**
`buildRevalidationRow` uses typed canonical fields (including `Date` objects) instead of raw string fields, which causes `TRADE_DATE_INVALID` to fire during correction revalidation even when the original trade date was valid. This is a separate defect unrelated to the quantity quarantine, but discovered during this diagnosis.

### Question B — Why did quality-detail return 404?

**LOCAL HELPER SCRIPT DEFECT**

The canonical endpoint (verified in `tdr.controller.ts` line 97) is:
```
GET /tdr/batches/:batchId/records/:recordId/quality
```

The helper script `Invoke-QuarantineCorrection.ps1` calls:
```powershell
-Uri "$API/tdr/batches/$BATCH_ID/records/$RECORD_ID/quality-detail"
```

The `-detail` suffix does not exist. No backend change is needed. The helper script must be corrected:
- **Wrong:** `.../quality-detail`
- **Correct:** `.../quality`

---

## §11. CORRECTION HISTORY AUDIT

| Check | Result |
|-------|--------|
| Exactly one correction event | ✅ One `TdrQuarantineReview` row: `098490cc` |
| No duplicate review | ✅ Only one review in DB |
| Raw value immutable (`quantityRaw`) | ✅ `""` — unchanged |
| Corrected normalized value stored | ✅ `quantityNormalized = "100"` persisted |
| Correction flag set | ✅ `valueTreatmentMeta.quantityNormalized = "CORRECTED"` |
| Tenant linkage | ✅ `tenantId = 6755271c-7b4c-40f2-a5aa-8be135cee886` |
| Reviewer ID | ✅ `reviewedById = f4418b6e-8714-43b8-b534-dd1fd36b8b9a` |
| Source row linkage | ✅ `batchId` and `recordId` preserved in review record |
| Audit log payload | ✅ `beforeHash` + `afterHash` only — no plaintext sensitive value |
| Correction note | ✅ Stored verbatim |

CorrectionService transaction integrity is confirmed correct.

---

## §12. FRONTEND GAP (UNCHANGED)

**Quarantine page** `src/app/tdr/quarantine/page.tsx` — read-only listing, no correction form. See original §10. This remains a known gap.

---

## §13. WHAT IS NEEDED TO FIX THE QUARANTINE RESOLUTION

Two separate defects require bounded correction tasks:

### Defect 1 (C — primary) — `buildRevalidationRow` uses raw field for required-field check bypass

**The correction model does not have a mechanism for a human correction of a normalized field to satisfy a raw-field required-field rule.** To resolve this, one of:

1. `validateRowV1` could skip `REQUIRED_FIELD_MISSING` for a `canonicalField` whose corresponding normalized field is marked `CORRECTED` in `valueTreatmentMeta` of the updated record.
2. `buildRevalidationRow` could substitute the corrected normalized value for the raw field when `valueTreatmentMeta[normalizedField] === 'CORRECTED'`.

Either requires careful scope-limited analysis. This is a separate bounded backend correction task.

### Defect 2 (B — secondary) — `buildRevalidationRow` produces locale-string `Date` for date canonical field

`buildRevalidationRow` must use raw field values for fields backed by typed DB columns. For `canonicalField: 'tradeDate'`, it must use `record['tradeDateRaw']` (the original source string), not `record['tradeDate']` (the Prisma `Date` object). This is a separate bounded backend correction task.

---

## §14. FILES CHANGED THIS TASK

| File | Change |
|------|--------|
| This WDR | Updated from BLOCKED (§6) to BLOCKED (diagnosis complete, defects classified) |
| `scripts/Invoke-QuarantineCorrection.ps1` | Helper script created and corrected (auth/me removed; quality-detail path still wrong — needs separate helper fix) |

No source code changes. No commits in this diagnosis task.

---

## §15. VERDICT

**⛔ BLOCKED — QUARANTINE REVIEW + CORRECTION SMOKE TEST**
**Root cause: Classification C (rule-model defect) + Classification B (buildRevalidationRow regression)**

### Summary

| Item | Result |
|------|--------|
| Correction API accepted the request | ✅ HTTP 200 |
| `quantityNormalized = 100` persisted | ✅ Confirmed in DB |
| `quantityRaw` remains blank | ✅ Immutable, unchanged |
| Original issue `5f1634f4` closed (REVIEWED) | ✅ Step 1 executed correctly |
| `reviewId = 098490cc` | ✅ Exactly one review, no duplicate |
| Audit: hash-only, no plaintext | ✅ |
| `rowDisposition` after correction | ⛔ `QUARANTINED` — not resolved |
| Batch counts after correction | ⛔ `acceptedRows: 15`, `quarantinedRows: 1` — unchanged |
| New OPEN issues from revalidation | ⛔ `quantityRaw` REQUIRED_FIELD_MISSING (again) + `tradeDate` TRADE_DATE_INVALID (regression) |

### Classification

| Question | Classification |
|----------|----------------|
| Why QUARANTINED remained | **C — Rule-model defect**: `REQUIRED_FIELD_MISSING` fires on `quantityRaw` (immutable); correcting `quantityNormalized` cannot satisfy a raw-field required check in the current revalidation model |
| Why TRADE_DATE_INVALID appeared | **B — Backend defect**: `buildRevalidationRow` uses `record['tradeDate']` (typed Date object) → `String()` produces locale datetime string → `DATE_PARSE_DMY` fails |
| Why quality-detail returned 404 | **Local helper script defect**: path is `/quality`, not `/quality-detail` |

### Next Safe Tasks (two separate bounded corrections required)

1. **TDR-CORRECTION-REVALIDATION-BYPASS-001** — Fix `validateRowV1` or `buildRevalidationRow` so a correction of a normalized field (`CORRECTED` flag in `valueTreatmentMeta`) satisfies the raw-field `REQUIRED_FIELD_MISSING` rule.

2. **TDR-REVALIDATION-DATE-RAW-001** — Fix `buildRevalidationRow` to use `tradeDateRaw` (raw string) instead of `tradeDate` (typed Date object) when reconstructing the source row for the date column.

3. **TDR-HELPER-QUALITY-PATH-001** — Fix `Invoke-QuarantineCorrection.ps1` line: `.../quality-detail` → `.../quality`.

All three require PM approval before execution. No source code changes in this diagnosis task.

**WDR path:** `WDR/_All/Phase-05-Frontend/TDR-QUARANTINE-REVIEW-CORRECTION-SMOKE-001_WDR_2026-09-21.md`
**HEAD at close:** `cdeb982` (no new commits this task)
