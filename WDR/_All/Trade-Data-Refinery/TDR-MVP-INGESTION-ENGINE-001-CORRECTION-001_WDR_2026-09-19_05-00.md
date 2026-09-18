# WDR — TDR-MVP-INGESTION-ENGINE-001-CORRECTION-001

## Task ID
TDR-MVP-INGESTION-ENGINE-001-CORRECTION-001 — Mega 3 Ingestion Safety / Streaming Correction

## Status
**PASS — MEGA 3 CORRECTION VERIFIED — READY FOR GPT REVIEW**

## Repository
`E:\ToplineShop`

## Branch
`codex/trade-data-refinery`

## HEAD State

| | Hash |
|---|---|
| Baseline HEAD (Mega 3) | `caa90fcc2f4853e30cf8a05790e2e7ffc151c32f` |
| Correction HEAD (after commit) | `17a6a3d` |

---

## Scope

5 bounded corrections to Mega 3 (no new Prisma schema / no new migration):

| ID | Description | File |
|---|---|---|
| A | XLSX true incremental streaming (remove rows:string[][] accumulation) | `xlsx.parser.ts` |
| B | Cross-volume file persistence (EXDEV rename fallback to stream copy) | `storage.service.ts` |
| C | Remove synchronous schema fingerprint check from HTTP upload path | `upload.service.ts` |
| D | Case-preserving schema fingerprint (remove .toLowerCase()) | `schema-fingerprint.util.ts` |
| E | Delete unused tdr-ingestion.module.ts | `ingestion/tdr-ingestion.module.ts` (deleted) |
| 8 | File content-signature validation (ZIP magic for XLSX, null-byte reject for CSV) | `upload.service.ts` |

---

## Correction A — XLSX True Incremental Streaming

**Before:**
`readXlsxRows(filePath)` accumulated ALL rows into `rows: string[][]` before yielding.
Peak memory = O(rows × cols × avg_cell_size), up to 2M rows × N cols in a single array.

**After:**
- `readXlsxHeaders(filePath)`: EventEmitter event, resolves on first `worksheet.once('row')` — reads header only.
- `streamXlsxRows(filePath, headers)`: uses `for await...of` on exceljs AsyncIterable (cast via `unknown`). Rows flow one at a time into the caller. Sole application-level accumulation is the caller's 500-row chunk buffer.
- `getXlsxSchemaFingerprint(filePath)`: calls `readXlsxHeaders` — lightweight, no row data loaded.
- Handler updated: `streamXlsxRows(filePath, headers)` (headers passed from separate header-read step).

**Memory guarantee:** No `rows: string[][]` array proportional to workbook size. File read in two passes (header scan + data scan) to avoid keeping a long-lived handle between phases.

**Runtime proof:** `streamXlsxRows` functional proof (200-row XLSX) — 3 tests PASS.

---

## Correction B — Cross-Volume Persistence (EXDEV fallback)

**Before:** `fs.renameSync(tempPath, dest)` — fails with `EXDEV` when temp dir is on a different drive (e.g. Windows `C:\Windows\Temp` → `E:\ToplineShop\backend\uploads`).

**After:**
```typescript
try {
  fs.renameSync(tempPath, dest);          // atomic, same-volume (preferred)
} catch (err) {
  if ((err as NodeJS.ErrnoException).code !== 'EXDEV') throw err;
  await this.streamCopy(tempPath, dest);  // streaming, no full-file buffer
  // verify size match → throw on mismatch; unlink partial dest
  await fs.promises.unlink(tempPath);     // remove source only after verified copy
}
```

`streamCopy`: `createReadStream.pipe(createWriteStream)` — no 500MB RAM allocation.

**Test:** EXDEV fallback test (jest.spyOn renameSync to throw EXDEV) — PASS.

---

## Correction C — HTTP Upload Boundary

**Before:** `UploadService.handleUpload` called `getCsvSchemaFingerprint`/`getXlsxSchemaFingerprint` synchronously during the HTTP request, then threw `ConflictException` on schema mismatch. For XLSX this read the entire file.

**After:** HTTP upload path is bounded to:
1. Direction RBAC check (no I/O)
2. File content-signature sample (1 KB read)
3. SHA-256 streaming pass (compute hash)
4. Mapping existence + direction check (DB query)
5. Processing fingerprint duplicate check (DB query)
6. Storage persist (file move)
7. Transaction: TdrSourceFile + TdrBatch + TdrProcessingJob

Schema fingerprint validation stays entirely in the async ingestion worker (`TdrIngestionHandlerService.processFile`) where it runs alongside row parsing.

Removed imports: `getCsvSchemaFingerprint`, `getXlsxSchemaFingerprint` from `upload.service.ts`.
Removed: `schemaFingerprint` param from `createBatchPipeline`.

---

## Correction D — Case-Preserving Schema Fingerprint

**Before:**
```typescript
const sorted = [...headers].map((h) => h.trim().toLowerCase()).sort();
const canonical = sorted.join('\x00');
```
`IMPORTER` and `importer` produced the same fingerprint — silently masking schema mismatches.

**After:**
```typescript
const normalized = headers.map((h, i) => {
  let v = h.trim();
  if (i === 0) v = v.replace(/^\uFEFF/, ''); // strip BOM from first header
  return v;
});
const sorted = [...normalized].sort();
const canonical = JSON.stringify(sorted);  // unambiguous serialization
```

- Case preserved: `HS_Code` ≠ `hs_code` — different schemas, different fingerprints.
- BOM strip: first header silently has UTF-8 BOM removed (defensive; upstream parsers typically handle it, but belt-and-suspenders is correct here).
- JSON serialization: unambiguous (NUL join was acceptable but JSON handles edge cases in header values with NUL bytes, however unlikely).

**Test updated:** "is case-PRESERVING" replaces "is case-insensitive" — `expect(f1).not.toBe(f2)`.

---

## Correction E — Delete Unused Module

`backend/src/trade-data-refinery/ingestion/tdr-ingestion.module.ts` — deleted.

Was never imported by any module (circular dependency at Mega 3 was resolved by registering all ingestion providers directly in `TradeDataRefineryModule`). The comment "kept for documentation" was incorrect — it is dead code. Removed.

---

## File Signature Validation

Added `validateFileContent(tempPath, ext)` to `UploadService`:
- **XLSX**: checks first 4 bytes for ZIP magic `PK\x03\x04` (0x50 0x4B 0x03 0x04). Rejects with `BadRequestException` if mismatch.
- **CSV**: checks first 1024 bytes for null byte (0x00). Rejects binary content masquerading as CSV.
- Called before SHA-256 hash computation (fail fast).
- 1 KB read via `fs.promises.open` / `handle.read` — no full-file load.

Tests: 5 tests in `file content-signature validation` section — all PASS.

---

## Files Changed

| File | Change |
|---|---|
| `backend/src/trade-data-refinery/ingestion/parsers/xlsx.parser.ts` | Correction A: for-await-of streaming; readXlsxHeaders; streamXlsxRows(path, headers) |
| `backend/src/trade-data-refinery/ingestion/storage/storage.service.ts` | Correction B: EXDEV fallback + streamCopy private method |
| `backend/src/trade-data-refinery/ingestion/upload/upload.service.ts` | Corrections C + file signature: remove schema check; add validateFileContent |
| `backend/src/trade-data-refinery/ingestion/utils/schema-fingerprint.util.ts` | Correction D: case-preserving; JSON.stringify; BOM strip |
| `backend/src/trade-data-refinery/ingestion/handler/tdr-ingestion-handler.service.ts` | Correction A callsite: streamXlsxRows(filePath, headers) |
| `backend/src/trade-data-refinery/tdr-mega3-unit.spec.ts` | 13 new tests; case-insensitive → case-PRESERVING |
| DELETED: `backend/src/trade-data-refinery/ingestion/tdr-ingestion.module.ts` | Correction E |
| `WDR/_All/Trade-Data-Refinery/TDR-MVP-INGESTION-ENGINE-001_WDR_2026-09-19_04-45.md` | Correction note in status section |

---

## Test Results

### Full regression (after correction)
```
Test Suites: 7 passed, 7 total
Tests:       1 skipped, 278 passed, 279 total
Time:        ~14 s
```

### Mega 3 only (after correction)
```
Test Suites: 1 passed, 1 total
Tests:       1 skipped, 84 passed, 85 total
```

### New tests added (13)

| Section | Tests | Coverage |
|---|---|---|
| File signature validation (§17) | 5 | ZIP magic pass/fail/short; CSV text/binary detection |
| Schema fingerprint case-preserving (§18) | 4 | Importer≠IMPORTER; same case=same; BOM strip; JSON canonical |
| EXDEV fallback (§19) | 1 | stream copy verified; source removed; content matches |
| XLSX streaming functional (§20) | 3 | readXlsxHeaders correct; streamXlsxRows yields all rows; fingerprint deterministic |

---

## TypeScript Check

```
npx tsc --noEmit → exit code 0 (0 errors)
```

---

## XLSX Memory Proof

Created 200-row XLSX, streamed via `for await...of` with `XlsxWorkbookIterable` cast.
- `readXlsxHeaders` returns correct headers without loading all rows ✅
- `streamXlsxRows` yields 200 rows one at a time ✅
- `getXlsxSchemaFingerprint` deterministic across two calls ✅
- No full-row array (`rows: string[][]`) anywhere in xlsx.parser.ts ✅
- exceljs 4.4.0 `Symbol.asyncIterator` confirmed working at runtime ✅

---

## Safety Boundaries

| Boundary | Status |
|---|---|
| No new Prisma schema changes | ✅ |
| No new migration | ✅ |
| `git add .` / `-A` / `--all` | NOT USED |
| `prisma migrate reset` | NOT EXECUTED |
| Destructive SQL | NONE |
| DATABASE_URL in any output | NOT PRESENT |
| `backend/.env` staged | NO |
| `WDR/_All/ERP64-Governance/` staged | NO |
| `docs/ERP64_GOVERNANCE/` staged | NO |
| `scripts/` staged | NO |
| `F:\OpenCode\shop.com` accessed | NO |
| Push to remote | NOT PERFORMED |
| TDR-MVP-QUALITY-EXPORT-001 started | NO |

---

## Commit

| Field | Value |
|---|---|
| Hash | `17a6a3d` |
| Subject | `fix(tdr): harden Mega 3 streaming and storage safety` |
| Branch | `codex/trade-data-refinery` |
| Files staged | 8 exact files (7 modified + 1 deleted) |
| Push performed | NO |

---

## Final Verdict

**MEGA 3 CORRECTION VERIFIED — READY FOR GPT REVIEW**

All 5 corrections applied and verified:
- A: XLSX true incremental streaming (no rows[] array) ✅
- B: Cross-volume EXDEV fallback (streaming copy + verify) ✅
- C: HTTP upload boundary (schema fingerprint deferred fully to worker) ✅
- D: Case-preserving fingerprint (remove toLowerCase; JSON serialize; BOM strip) ✅
- E: Unused module deleted ✅
- File signature validation (ZIP magic + CSV binary reject) ✅

278/279 tests pass (1 skipped = 1M CSV proof gate).
TypeScript: 0 errors.
Safety boundaries: maintained.

**Do NOT start TDR-MVP-QUALITY-EXPORT-001 without explicit PM authorization.**
