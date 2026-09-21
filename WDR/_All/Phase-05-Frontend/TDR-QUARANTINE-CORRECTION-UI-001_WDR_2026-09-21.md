# WDR — TDR-QUARANTINE-CORRECTION-UI-001
**Date:** 2026-09-21
**Branch:** codex/trade-data-refinery
**Author:** Javed Ahmed Chohan
**Starting HEAD:** 14f082f
**Verdict:** QUARANTINE CORRECTION UI — PASS

---

## §1 Task Summary

Implement the governed quarantine review + correction workflow in the frontend:
Quarantine listing → quality detail panel → correction form → governed correction submission
→ governed re-evaluation → refreshed record disposition → refreshed batch counts/status.

---

## §2 Files Changed

| File | Type | Change |
|------|------|--------|
| `src/types/tdr.ts` | modified | Added `QualityDetailIssue`, `QualityDetailReview`, `QualityDetailRecord`, `CorrectionResult`, `ReEvaluateResult` |
| `src/lib/tdr-api.ts` | modified | Added `getQualityDetail`, `reEvaluateRecord` API functions; tightened `applyCorrection` return type to `CorrectionResult` |
| `src/components/tdr/TdrQualityDetailPanel.tsx` | new | Full correction panel: quality detail load, field values (SOURCE/NORMALIZED/TREATMENT), open issues, correction history, correction form, confirm step, result banner |
| `src/app/tdr/quarantine/page.tsx` | modified | Added "Review" button per issue row; `TdrQualityDetailPanel` integration; `onCorrected` reload callback |
| `src/__tests__/tdr-quarantine-correction-ui.test.tsx` | new | 18 tests across 15 categories (§1–§15) |

---

## §3 API Contracts Implemented

### `GET /tdr/batches/:batchId/records/:recordId/quality`
- Returns `QualityDetailRecord` including all raw and normalized fields, `valueTreatmentMeta`, `validationIssues` (OPEN+REVIEWED), `quarantineReviews`
- Used by `getQualityDetail()` in `tdr-api.ts`
- All roles (TenantModuleGuard only, no Roles decorator)

### `POST /tdr/batches/:batchId/records/:recordId/correct`
- Sends `CorrectionRequest { fieldName, correctedValue, note? }`
- Returns `CorrectionResult { reviewId, recordId, fieldName, newDisposition, exportEligible }`
- Roles: SUPER_ADMIN, TENANT_ADMIN, IMPORT_MANAGER, EXPORT_MANAGER (backend RBAC)

### `POST /tdr/batches/:batchId/records/:recordId/re-evaluate`
- No request body
- Returns `ReEvaluateResult { rowDisposition, exportEligible, newIssueCount }`
- Roles: SUPER_ADMIN, TENANT_ADMIN only

---

## §4 Component Architecture

### TdrQualityDetailPanel (portal modal)
- **Props:** `batchId`, `recordId`, `onClose`, `onCorrected?`
- **Loads:** `getQualityDetail` on mount via `useCallback` + `useEffect`
- **SOURCE / NORMALIZED / TREATMENT** three-column table for all 12 field pairs
- **CORRECTED badge** shown inline when `valueTreatmentMeta[field] === 'CORRECTED'`
- **Open issues** highlighted with amber border and severity badge
- **Correction history** (`quarantineReviews`) shown chronologically
- **Reviewed issues** collapsible `<details>` block

### Correction form (role-gated)
- Role check: `canCorrectRecord(roles, tradeDirection)` — SUPER_ADMIN/TENANT_ADMIN any direction; IMPORT_MANAGER IMPORT only; EXPORT_MANAGER EXPORT only
- Field selector: all 12 CORRECTABLE_FIELDS; already-corrected fields labeled "(already corrected)"
- **Duplicate warning** (amber): appears when selected field has `valueTreatmentMeta[field] === 'CORRECTED'`
- Value input: pre-populated with current normalized value
- Note input: optional, up to 1000 chars
- **Confirm step**: shows Field / Current value / New value before submit
- Submit: calls `applyCorrection` → `reEvaluateRecord` → `onCorrected()` → reload detail
- Error stays in confirm step view; `setConfirmStep(false)` only fires on success

### Quarantine page
- Added "Actions" column with "Review" button per issue row
- Button opens panel for that record: `setReviewRecordId(issue.record.id)`
- Multiple issues from same record all open the same panel
- `handleCorrected`: resets to page 1 and reloads issue list

---

## §5 Role Awareness

| Role | IMPORT | EXPORT |
|------|--------|--------|
| SUPER_ADMIN | ✓ | ✓ |
| TENANT_ADMIN | ✓ | ✓ |
| IMPORT_MANAGER | ✓ | ✗ |
| EXPORT_MANAGER | ✗ | ✓ |
| Other | ✗ | ✗ |

Read-only notice shown when `canCorrect === false`.

---

## §6 Test Coverage (18 tests)

| §  | Category | Tests |
|----|----------|-------|
| §1 | Loading state | 1 |
| §2 | Record identity | 1 |
| §3 | Source/Normalized columns | 2 |
| §4 | CORRECTED badge | 2 |
| §5 | Open issues | 2 |
| §6 | Correction history | 1 |
| §7 | Correction form field selector | 1 |
| §8 | Role: IMPORT_MANAGER on EXPORT record | 1 |
| §9 | Role: TENANT_ADMIN on EXPORT record | 1 |
| §10 | Duplicate field warning | 1 |
| §11 | Confirm step before/after values | 1 |
| §12 | Correction sequence order | 1 |
| §13 | Result banner new disposition | 1 |
| §14 | Error state on failure | 1 |
| §15 | Escape key closes panel | 1 |
| **Total** | | **18** |

---

## §7 Test Results

```
Frontend: 80/80 passed, 7 suites (including 18 new)
Backend:  587/588 passed (1 pre-existing skip), 14 suites — unchanged
TypeScript: 0 errors
git diff --check: no whitespace issues
```

---

## §8 Constraints Verified

- ✅ Did NOT start Phase 7
- ✅ Did NOT change backend correction semantics
- ✅ Did NOT change Pakistan Customs mapping profiles
- ✅ Did NOT alter raw source values
- ✅ Did NOT add localStorage or sessionStorage auth
- ✅ Did NOT push
- ✅ Exact-file staging only
- ✅ Duplicate correction: frontend warns but does not block (backend is intentionally non-idempotent)

---

## §9 Next Safe Task

TDR-QUARANTINE-CORRECTION-UI-001 is COMPLETE.
Next task requires PM authorization before execution.
