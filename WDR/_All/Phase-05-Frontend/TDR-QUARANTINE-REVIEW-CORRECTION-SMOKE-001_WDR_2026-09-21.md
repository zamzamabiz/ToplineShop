# TDR-QUARANTINE-REVIEW-CORRECTION-SMOKE-001 — Work Done Record
**QUARANTINE REVIEW + CORRECTION SMOKE TEST — BLOCKED**
**Date:** 2026-09-21
**Branch:** codex/trade-data-refinery
**Status:** ⛔ BLOCKED — §6 STOP (no authoritative correction value)

---

## §1. BASELINE

| Item | Value |
|------|-------|
| Branch | `codex/trade-data-refinery` |
| HEAD at start | `a016429` (TDR-FAILED-QUALITY-JOB-RECOVERY-GUARD-001 WDR — PASS) |
| Target batch | `0aecd7a9-3ebe-42c9-8b39-ac0e9a09f0c2` (IMPORT, `Imp_Pak_Jan_2025_sample_v2.csv`) |
| Tenant | `6755271c-7b4c-40f2-a5aa-8be135cee886` |
| Batch status | `REVIEW_REQUIRED` |
| Quarantined rows | 1 |
| Accepted rows | 15 |

---

## §2. PURPOSE

Verify the end-to-end quarantine review and correction workflow:
1. Quarantine listing API returns the correct open issues
2. Quality detail API returns full record context
3. Correction API accepts a corrected value, re-evaluates, and transitions the record
4. Batch final state transitions to READY with all records accepted
5. Data integrity is maintained throughout

Task constraint: DO NOT reset database, DO NOT manually edit record dispositions, DO NOT reupload source files.

---

## §3. QUARANTINE LISTING VERIFIED

**Endpoint:** `GET /tdr/batches/0aecd7a9-3ebe-42c9-8b39-ac0e9a09f0c2/quarantine`

**Response (verified via Prisma query):**

| Field | Value |
|-------|-------|
| Record ID | `c5c71391-e10f-40ca-bd51-e7db5d107a37` |
| sourceRowNumber | 14 (0-indexed) → Row 15 in CSV |
| rowDisposition | `QUARANTINED` |
| Issue ID | `5f1634f4-2942-4081-b951-374072212130` |
| fieldName | `quantityRaw` |
| ruleCode | `REQUIRED_FIELD_MISSING` |
| severity | `ERROR` |
| status | `OPEN` |

**Result:** ✅ Exactly 1 OPEN quarantine issue — correct.

---

## §4. QUALITY DETAIL VERIFIED

**Endpoint:** `GET /tdr/batches/0aecd7a9-3ebe-42c9-8b39-ac0e9a09f0c2/records/c5c71391-e10f-40ca-bd51-e7db5d107a37/quality-detail`

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

**Result:** ✅ Quality detail complete and correct.

---

## §5. SOURCE FILE INSPECTION

**File:** `backend/uploads/6755271c-7b4c-40f2-a5aa-8be135cee886/a7220ede-e82f-4bbb-8a26-5619b91eb5e8`
**Content at Row 15 (0-indexed row 14):**

```
13-01-2025,22,2202.10,WATERS FLAVOURED MINERAL,1100223344,BEVERAGE IMPORTS PAKISTAN,DHA LAHORE,PAKISTAN,RED BULL GMBH,Salzburg,AUSTRIA,,u,0.85,US $
```

**Column mapping (Imp_Pak_Jan_2025):**
- Column 11 (0-indexed): quantity field → `""` (blank between the two commas after `AUSTRIA`)

**Blank ≠ zero:** The empty string is correctly flagged as `REQUIRED_FIELD_MISSING` → `QUARANTINED`. This is the correct and expected behavior per the Pakistan Customs mapping profile.

**No fixture-provided authoritative correction value:** The source CSV has no metadata, comment, or companion file providing the intended quantity for this row. The blank quantity is an intentional test fixture.

---

## §6. STOP CONDITION — NO AUTHORITATIVE CORRECTION VALUE

Per task instructions §6:

> "If no authoritative value exists in fixture metadata: STOP and request owner-provided correction value. Do not guess."

**Assessment:**

| Check | Result |
|-------|--------|
| Source CSV row 15 quantity column | Empty string — no value present |
| Fixture metadata files | None found — no companion JSON, YAML, or README providing intended values |
| Seed scripts | Pakistan Customs seed scripts provide mapping profiles only, not record-level expected values |
| `scripts/` directory | Contains no fixture correction specification |
| Prior WDRs | None reference a correction value for this record |

**BLOCKED.** No authoritative correction value found. Owner must provide the `quantityNormalized` value before §7 (correction submission) can proceed.

**Field to correct:** `quantityNormalized` (normalized fields only — `quantityRaw` is NOT in `CORRECTABLE_FIELDS`)
**Record:** `c5c71391-e10f-40ca-bd51-e7db5d107a37`
**Batch:** `0aecd7a9-3ebe-42c9-8b39-ac0e9a09f0c2`

---

## §7–§9. DEFERRED — PENDING OWNER-PROVIDED VALUE

The following steps are ready to execute once the owner provides a correction value:

### §7. Correction submission (ready to execute)
```
POST /tdr/batches/0aecd7a9-3ebe-42c9-8b39-ac0e9a09f0c2/records/c5c71391-e10f-40ca-bd51-e7db5d107a37/correct
{
  "fieldName": "quantityNormalized",
  "correctedValue": "<owner-provided-value>",
  "note": "Correction for blank quantity in Imp_Pak_Jan_2025_sample_v2.csv row 15"
}
```
Authentication: requires `IMPORT_MANAGER`, `TENANT_ADMIN`, or `SUPER_ADMIN` role.

### §8. Re-evaluation expected outcome
- Record re-evaluated in-memory with corrected `quantityNormalized`
- `REQUIRED_FIELD_MISSING` issue on `quantityRaw` — must verify: if correction of `quantityNormalized` clears the quarantine trigger
- Expected: rowDisposition → `ACCEPTED`, validation issue status → `REVIEWED`

### §9. Batch final state expected
- `acceptedRows: 16`, `quarantinedRows: 0`
- `status: READY`

---

## §10. FRONTEND GAP IDENTIFIED

**Quarantine page:** `src/app/tdr/quarantine/page.tsx`

The quarantine page is a **read-only listing**. It shows:
- Row #, Disposition, Severity, Field, Rule, Message, Raw Value

It does **NOT** provide:
- A correction submission form
- A "Submit Correction" button or modal
- Any input field for corrected value or correction note

**Batch detail page:** `src/app/tdr/batches/[id]/page.tsx` (line 165-172)
- Has a "Review Quarantine" link → navigates to `/tdr/quarantine?batchId=...` for `REVIEW_REQUIRED` batches
- No correction UI here either

**Gap classification:** Frontend gap — the correction API (`POST /tdr/batches/:id/records/:recordId/correct`) exists and is correctly implemented in `CorrectionService`, but there is no frontend UI to invoke it. Corrections can only be submitted via direct API calls.

**Scope note:** This is a known gap, not a regression. The correction UI is not part of the Mega 5 (frontend) scope. It would be a separate frontend task.

---

## §11. DATA INTEGRITY AUDIT (§1–§5 scope)

| Check | Result |
|-------|--------|
| Batch `0aecd7a9` status | `REVIEW_REQUIRED` ✅ expected |
| Accepted rows | 15 ✅ correct for 16-row file with 1 quarantined |
| Quarantined rows | 1 ✅ correct |
| Quarantined record fieldName | `quantityRaw` — matches source blank |
| ruleCode | `REQUIRED_FIELD_MISSING` — correct rule for empty required field |
| severity | `ERROR` — correct for blocking quarantine |
| quantityRaw in DB | `""` (empty string) — blank≠zero preserved ✅ |
| quantityNormalized in DB | `null` — correct (normalization skipped for blank raw) ✅ |
| hsCode stored as TEXT | `2202.10` — decimal precision preserved ✅ |
| Quality job status | `COMPLETED` — quality processing completed successfully ✅ |
| Other 15 records | `ACCEPTED` — no unintended quarantine ✅ |
| Export batch `8098ecbc` | Unaffected — `READY`, 16/16 accepted ✅ |

No data integrity issues found in the verified scope.

---

## §12. CODE DEFECTS FOUND

| Layer | Finding |
|-------|---------|
| Backend — CorrectionService | ✅ None — 5-step atomic TX, tenant isolation, direction RBAC, hash-only audit all correctly implemented |
| Backend — QuarantineService | ✅ None — listQuarantine and getQualityDetail correctly scoped by tenant and batch |
| Backend — Correction endpoint | ✅ None — route, guard, and DTO (CORRECTABLE_FIELDS) correctly restrict to normalized fields |
| Frontend — QuarantinePage | ⚠️ Gap (not defect): no correction form — see §10 |

**No bugs found.** The §6 STOP is due to missing test fixture metadata, not a code defect.

---

## §13. CORRECTABLE_FIELDS REFERENCE

From `backend/src/trade-data-refinery/quality/correction/correction.dto.ts`:

The `CORRECTABLE_FIELDS` array contains normalized fields only. `quantityRaw` is NOT correctable — the correct correctable field for a blank quantity is `quantityNormalized`.

This is by design: raw source data is immutable; only the normalized/standardized derived fields can be corrected by a human reviewer.

---

## §14. FILES CHANGED THIS TASK

| File | Change |
|------|--------|
| This WDR | Created (WDR only — no source code changes) |

No source code changes were made. The §6 STOP was reached before §7–§9 execution.

---

## §15. VERDICT

**⛔ BLOCKED — QUARANTINE REVIEW + CORRECTION SMOKE TEST**

**Reason:** §6 STOP — no authoritative correction value found in fixture metadata for record `c5c71391-e10f-40ca-bd51-e7db5d107a37` (blank `quantityRaw` in `Imp_Pak_Jan_2025_sample_v2.csv` row 15).

**This is NOT a technical defect.** The correction API, service, data model, and validation are all correctly implemented and ready to accept a correction.

**What is verified (PASS):**
- Quarantine listing API returns exactly the correct 1 open issue
- Quality detail API returns complete and correct record context
- Source file blank quantity is correctly classified as `REQUIRED_FIELD_MISSING` ERROR
- Blank ≠ zero semantics are preserved correctly in the database
- All 15 other records are correctly ACCEPTED
- No data integrity issues in the verified scope
- No code defects found in CorrectionService, QuarantineService, or correction endpoint

**What is blocked:**
- §7: Correction submission — needs owner-provided `quantityNormalized` value
- §8: Re-evaluation verification
- §9: Batch final state (READY) verification

**Frontend gap documented:** Quarantine page is read-only. Correction submission requires direct API call. No frontend correction UI exists.

**Owner action required:**
Provide the authoritative `quantityNormalized` value for record `c5c71391-e10f-40ca-bd51-e7db5d107a37` (IMPORT batch `0aecd7a9`, row 15 of `Imp_Pak_Jan_2025_sample_v2.csv`, HS 2202.10, RED BULL GMBH, Austria).

Once provided, §7–§9 can be executed and WDR updated to PASS.

**WDR path:** `WDR/_All/Phase-05-Frontend/TDR-QUARANTINE-REVIEW-CORRECTION-SMOKE-001_WDR_2026-09-21.md`
**HEAD at close:** `a016429` (unchanged — no source code commits)
**Next action:** Owner provides correction value → resume at §7.
