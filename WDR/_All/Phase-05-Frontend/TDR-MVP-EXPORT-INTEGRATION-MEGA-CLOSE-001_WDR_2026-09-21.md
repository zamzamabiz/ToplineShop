# WDR — TDR-MVP-EXPORT-INTEGRATION-MEGA-CLOSE-001
**Date:** 2026-09-21
**Branch:** codex/trade-data-refinery
**Author:** Javed Ahmed Chohan
**Starting HEAD:** fa98de1
**Mode:** COMPLETION MODE (MEGA-CLOSE)
**Verdict:** TDR MVP EXPORT + INTEGRATION MEGA-CLOSE — PASS

---

## §1 Task Summary

Close the TDR MVP export and downstream handoff workflow end-to-end:
- Verify/complete export request API (RBAC, tenant scoped, async job creation)
- Verify export worker lifecycle (PENDING→LEASED→COMPLETED, retry, maxAttempts, lease reclaim)
- Verify export artifact (CSV, non-empty, correct headers/rows, HS as TEXT, corrected values honored)
- Fix identified bounded defects (ExportStatus type mismatch, missing tradeDirection filter)
- Add backend integration tests (37) and frontend tests (12)
- Document downstream CRM/ERP handoff contract
- Runtime smoke test evidence (batch READY, seeded, credentials owner-held)

---

## §2 Bounded Defects Found and Fixed

| # | Defect | File | Fix |
|---|--------|------|-----|
| D1 | `ExportStatus` type included `'PROCESSING'` but backend `JobStatus` enum uses `'LEASED'` | `src/types/tdr.ts` | Replaced `'PROCESSING'` with `'LEASED'` |
| D2 | Exports page `STATUS_COLORS` missing `'LEASED'` entry (fell through to fallback gray) | `src/app/tdr/exports/page.tsx` | Added `LEASED: 'bg-blue-900/40 text-blue-300'` |
| D3 | Exports page poll condition checked `status === 'PROCESSING'` — never matched backend's `'LEASED'` | `src/app/tdr/exports/page.tsx` | Changed to `status === 'LEASED'` |
| D4 | Exports form missing `tradeDirection` filter (DTO supports it; IMPORT/EXPORT managers need it) | `src/app/tdr/exports/page.tsx` | Added direction select with All/IMPORT/EXPORT options; included in `createExport` call |

---

## §3 Files Changed

| File | Type | Change |
|------|------|--------|
| `src/types/tdr.ts` | modified | `ExportStatus`: `'PROCESSING'` → `'LEASED'` |
| `src/app/tdr/exports/page.tsx` | modified | D2–D4 fixes: LEASED status color, poll condition, tradeDirection state+select+API call |
| `backend/src/trade-data-refinery/tdr-export-integration.spec.ts` | new | 37-test export integration spec |
| `src/__tests__/tdr-exports-page.test.tsx` | new | 12-test exports page frontend spec |

---

## §4 Export Stack Architecture (Verified)

### API Endpoints
| Method | Path | Handler | RBAC |
|--------|------|---------|------|
| `POST` | `/tdr/exports` | `TdrExportService.createExport` | All roles (direction restrictions apply) |
| `GET` | `/tdr/exports/:id` | `TdrExportService.getExportStatus` | Tenant-scoped; all roles |
| `GET` | `/tdr/exports/:id/download` | `TdrExportService.downloadExport` | COMPLETED+storageKey required |

### Job Lifecycle
```
PENDING → LEASED (SELECT FOR UPDATE SKIP LOCKED, +attemptCount)
       → COMPLETED (storageKey + rowCount + contentHash written)
       → FAILED (if attemptCount >= maxAttempts = 3)
       → PENDING (retry if attemptCount < maxAttempts)
LEASED  → PENDING (reclaimExpiredLeases if leaseExpiresAt < now)
```

### RBAC Matrix
| Role | No direction | IMPORT | EXPORT |
|------|-------------|--------|--------|
| SUPER_ADMIN | ✓ | ✓ | ✓ |
| TENANT_ADMIN | ✓ | ✓ | ✓ |
| ANALYST | ✓ | ✓ | ✓ |
| IMPORT_MANAGER | ✗ (must specify) | ✓ | ✗ |
| EXPORT_MANAGER | ✗ (must specify) | ✗ | ✓ |

### Export Eligibility Predicate (enforced in handler)
- `rowDisposition = 'ACCEPTED'`
- `exportEligible = true`
- QUARANTINED and REJECTED records are **never** included

### CSV Format
- 16 columns in deterministic order (see §5)
- CRLF line endings, RFC 4180 quoting
- Formula injection protection: `=`, `+`, `-`, `@`, `\t`, `\r` prefixed with `'`
- Dates formatted as `YYYY-MM-DD` (ISO 8601, no time, no timezone drift)
- HS codes emitted as TEXT (not parsed as float — `8471.30` stays `8471.30`)
- Null/blank fields emit empty string (blank ≠ zero)
- Corrected normalized values are used (not raw source values)

---

## §5 CSV Column Contract (16 columns)

```
1.  sourceRowNumber
2.  tradeDate
3.  tradeDirection
4.  hsCodeNormalized
5.  hsChapter
6.  productDescriptionNormalized
7.  localPartyNameNormalized
8.  localPartyTaxIdNormalized
9.  localPartyCountryCode
10. foreignPartyNameNormalized
11. foreignPartyCountryCode
12. originPortNormalized
13. quantityNormalized
14. quantityUnitCode
15. unitPriceNormalized
16. currencyCode
```

---

## §6 Downstream CRM/ERP Handoff Contract

### File Format
- **Encoding:** UTF-8
- **Line endings:** CRLF (Windows/RFC 4180 compatible)
- **Header row:** Present, row 1 — 16 column names as listed above
- **Quoting:** Fields containing commas, double-quotes, or newlines are RFC-quoted; formula injection chars are prefixed with `'`

### Field Semantics
| Field | Type | Notes |
|-------|------|-------|
| `sourceRowNumber` | Integer | Original row position in source file |
| `tradeDate` | ISO 8601 Date (YYYY-MM-DD) | UTC-safe; no time component |
| `tradeDirection` | Enum: IMPORT / EXPORT | |
| `hsCodeNormalized` | TEXT string | Must be stored as TEXT in CRM/ERP — coercing to number loses leading zeros and precision (e.g. `8471.30` ≠ `8471.3`) |
| `hsChapter` | TEXT string | First 2 digits of HS code |
| `productDescriptionNormalized` | String | Normalized, trimmed |
| `localPartyNameNormalized` | String | Importer/exporter name |
| `localPartyTaxIdNormalized` | String | NTN/CNIC — store as TEXT |
| `localPartyCountryCode` | ISO 3166-1 alpha-2 | |
| `foreignPartyNameNormalized` | String | Foreign buyer/seller |
| `foreignPartyCountryCode` | ISO 3166-1 alpha-2 | |
| `originPortNormalized` | String | Port or country of origin |
| `quantityNormalized` | Decimal string | Store as DECIMAL — not float |
| `quantityUnitCode` | String | e.g. KGS, MTR, NOS |
| `unitPriceNormalized` | Decimal string | Store as DECIMAL — not float |
| `currencyCode` | ISO 4217 | e.g. USD, PKR |

### Corrected Values
Corrected records are already reflected in the normalized columns. The CRM/ERP does not need to re-apply corrections. The source (raw) values are **not** included in the export — only governed normalized output.

### Idempotency
- Each export job has a unique `id` (UUID) and `contentHash` (SHA-256 of CSV bytes).
- The CRM/ERP may use `contentHash` to detect duplicate file deliveries.
- Re-importing the same export (same hash) is the CRM/ERP's responsibility to handle idempotently.

### Access Control
- Export files are signed-bearer-authenticated (`/tdr/exports/:id/download`).
- Each export is tenant-scoped — a tenant cannot access another tenant's export.
- Once downloaded, the CSV file is a plain file with no embedded auth.

---

## §7 Runtime Smoke Test Evidence

### Batch: Imp_Pak_Jan_2025 (batch ID: `0aecd7a9-...`)
- Status: `READY` (verified by TDR-PAKISTAN-CUSTOMS-MAPPING-PROFILES-001 WDR)
- ACCEPTED rows: 16 (all eligible for export)
- Record `c5c71391`: `quantityNormalized = 100` (corrected in TDR-QUARANTINE-REVIEW-CORRECTION-SMOKE-001)
- Export eligibility: all 16 rows have `rowDisposition = 'ACCEPTED'` and `exportEligible = true`

### Smoke Test Constraints
- The runtime E2E smoke test (create job → poll → download → inspect CSV) requires the dev admin password.
- Credentials are owner-held; the smoke test script is at `scripts/Invoke-TdrExportSmoke.ps1`.
- Owner must run it manually before treating this as production-ready.

### Evidence Summary
| Evidence | Source |
|----------|--------|
| 37 backend integration tests: RBAC, tenant isolation, lease, retry, maxAttempts, reclaim, CSV helpers, column order, download guard | `tdr-export-integration.spec.ts` — 37/37 PASS |
| 12 frontend tests: form render, direction select, createExport args, job table, LEASED badge, COMPLETED badge, FAILED badge, polling, no-poll on complete, error display, download | `tdr-exports-page.test.tsx` — 12/12 PASS |
| Existing READY batch with 16 ACCEPTED rows | TDR-PAKISTAN-CUSTOMS-MAPPING-PROFILES-001 WDR |
| Corrected record `c5c71391` has `quantityNormalized = 100` | TDR-QUARANTINE-REVIEW-CORRECTION-SMOKE-001 WDR |

---

## §8 Test Results

```
Backend:  624/625 (1 pre-existing skip), 15 suites — PASS
Frontend:  92/92, 8 suites — PASS
TypeScript: 0 errors (frontend + backend)
git diff --check: no whitespace errors
Prisma migrate status: Database schema is up to date (no migration required)
```

### New test counts
| Suite | Tests | Prior | Delta |
|-------|-------|-------|-------|
| `tdr-export-integration.spec.ts` | 37 | 0 | +37 |
| `tdr-exports-page.test.tsx` | 12 | 0 | +12 |
| **Total new** | **49** | — | **+49** |

Prior totals: Backend 587/588 → 624/625; Frontend 80/80 → 92/92

---

## §9 Constraints Verified

- ✅ Did NOT start Phase 7
- ✅ Did NOT mutate backend correction semantics
- ✅ Did NOT change Pakistan Customs mapping profiles
- ✅ Did NOT alter raw source evidence
- ✅ Did NOT add localStorage/sessionStorage auth
- ✅ Did NOT push
- ✅ Exact-file staging only
- ✅ No schema migration required (Prisma up to date)
- ✅ No destructive database operation
- ✅ No major architecture redesign

---

## §10 Next Safe Task

TDR-MVP-EXPORT-INTEGRATION-MEGA-CLOSE-001 is COMPLETE.
Next task: `TDR-MVP-ANALYTICS-READINESS-MEGA-CLOSE-001`
**REQUIRES PM AUTHORIZATION before execution. DO NOT START AUTOMATICALLY. DO NOT START PHASE 7.**
