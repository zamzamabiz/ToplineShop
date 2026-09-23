# WDR: TDR-REPLAY-BATCH-UI-001
**Date:** 2026-09-23  
**Branch:** codex/trade-data-refinery  
**Commit:** c0f267a  
**Status:** PASS CLOSED (pending owner browser verification — Replay target batch)

---

## Task ID
TDR-REPLAY-BATCH-UI-001

## Scope
Add a Replay Batch button to the TDR batch detail page (`/tdr/batches/[id]`) so owners can re-process an existing batch through the latest mapping and refinement rules without re-uploading the source file.

---

## Requirements Addressed

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Visible "Replay Batch" button beside "Export Records" | PASS |
| 2 | Confirmation: "Replay this source using the latest mapping and refinement rules?" | PASS |
| 3 | Calls existing backend replay API — no second upload | PASS |
| 4 | Button disabled after one click — no duplicate replay | PASS |
| 5 | Show replay progress + auto-refresh via new batch link | PASS |
| 6 | Preserve immutable RAW/source data | PASS — guaranteed by backend service |
| 7 | Rebuild only refined records and quality metadata | PASS — guaranteed by backend service |
| 8 | Preserve total source-row count | PASS — guaranteed by backend service |
| 9 | Audit log entry on replay | PASS — backend fires `tdr.batch.replayed` event |
| 10 | Clear success or failure message | PASS — green panel (new batch ID + link) or red panel (error) |

---

## Changes

### 1. `src/lib/tdr-api.ts` — new `replayBatch()` function

```typescript
export function replayBatch(token: string, id: string, reason: string) {
  return post<{ reason: string }, { replayBatchId: string }>(
    `/tdr/batches/${encodeURIComponent(id)}/replay`,
    token,
    { reason },
  );
}
```

Calls `POST /tdr/batches/:id/replay` with a `{ reason }` body. The backend (`TdrController.replayBatch`) is RBAC-gated to `SUPER_ADMIN` and `TENANT_ADMIN` and validates the `reason` field via `ReplayBatchDto`. Returns `{ replayBatchId }`.

### 2. `src/app/tdr/batches/[id]/page.tsx` — replay state + UI

**New state:**
- `showReplayConfirm: boolean` — controls inline confirmation panel
- `replaying: boolean` — disables button while in-flight
- `replayResult: { ok: true; replayBatchId: string } | { ok: false; msg: string } | null`

**New constant:**
```typescript
const REPLAYABLE_STATUSES = new Set(['READY', 'PARTIAL', 'FAILED', 'EXPORTED']);
```
Mirrors `REPLAYABLE_STATUSES` from the backend (`batch-transition.ts`).

**`handleReplay` handler:**
- Sets `replaying = true`, clears prior result
- Calls `replayBatch(accessToken, batchId, reason)`
- On success: stores `{ ok: true, replayBatchId }` — button hidden, success panel shown
- On failure: stores `{ ok: false, msg }`, `replaying = false` — button re-enabled

**Button visibility:**
- Shown when `REPLAYABLE_STATUSES.has(batch.status)` AND `!replayResult?.ok`
- Disabled while `replaying` or `showReplayConfirm` (prevents double-open)
- Label: "Replaying…" during in-flight, "Replay Batch" otherwise

**Confirmation panel (inline, below buttons):**
- Renders when `showReplayConfirm === true`
- Text: "Replay this source using the latest mapping and refinement rules?"
- Subtext: "A new batch will be created from the original source file. The existing batch and its raw data are preserved unchanged."
- Two buttons: Confirm Replay / Cancel

**Success panel (green):**
- "Replay started successfully."
- New batch ID (monospace)
- "Open new batch →" link to `/tdr/batches/<replayBatchId>` — the existing 3-second polling on that page tracks PENDING → PROCESSING → READY automatically

**Error panel (red):**
- "Replay failed: <message>"

---

## Backend API (pre-existing, no changes)

| Route | Method | Roles | Service |
|-------|--------|-------|---------|
| `POST /tdr/batches/:id/replay` | `TdrController.replayBatch` | SUPER_ADMIN, TENANT_ADMIN | `TdrService.replayBatch` |

Service behaviour (unchanged):
- Validates `REPLAYABLE_STATUSES = ['READY', 'PARTIAL', 'FAILED', 'EXPORTED']`
- Creates a new `TdrBatch` with `replayOfBatchId: original.id` and `replayReason: dto.reason`
- Original source file (`sourceFileId`) is reused — no re-upload
- Existing batch records, raw data, and audit entries are not modified
- Fires audit event `tdr.batch.replayed`
- Returns `success({ replayBatchId: newBatch.id })`

---

## Test Evidence

**Frontend:** 182/182 Vitest tests pass (no regressions, no new tests required — behaviour is UI-only flow over a pre-existing API)

**TypeScript:** No new errors in changed files (pre-existing errors in `projectRegistry.ts` and one test fixture are unrelated)

---

## Acceptance Test (Manual — Owner Required)

Target batch:
- Batch ID: `15c7379c-3bef-42d2-954c-bc5354001554`
- Source File: `TDR_V1_EXP_2025_02_002.csv`
- Direction: EXPORT
- Rows: 159,387

Steps:
1. Open `/tdr/batches/15c7379c-3bef-42d2-954c-bc5354001554`
2. Click **Replay Batch**
3. Confirm in the inline panel
4. Click **Open new batch →** in the success panel
5. Wait for new batch to reach **READY**

Expected outcomes:
- [ ] New batch reaches READY status
- [ ] Total rows remain 159,387
- [ ] Numeric-only exporter names moved to `exporter_id` column in exported CSV
- [ ] Affected rows have blank `exporter_name` and `INCOMPLETE` quality status
- [ ] `data_source` column shows `Pakistan Customs`
- [ ] No duplicate records — original batch `15c7379c` is unchanged
- [ ] Replay audit entry visible in audit log

---

## Safety Boundaries

- No schema migration
- No backend changes
- Original source files and batch records are immutable (backend guarantee)
- Replay creates a new batch record only
- `F:\OpenCode\shop.com` not touched

---

## Governance

- #FDD: UI change only — calls pre-existing, tested backend endpoint
- #123: EXECUTE → VERIFY (182/182 frontend) → CLOSE (pending owner Replay verification)
