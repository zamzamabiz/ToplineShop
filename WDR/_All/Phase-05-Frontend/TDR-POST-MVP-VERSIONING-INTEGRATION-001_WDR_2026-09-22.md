# WDR: TDR-POST-MVP-VERSIONING-INTEGRATION-001

**Task:** POST-MVP MEGA TASK 5 — Versioned Source Replacement + Lineage + Generic Integration Foundation  
**Date:** 2026-09-22  
**Status:** PASS  
**Branch:** codex/trade-data-refinery  

---

## Summary

Implemented versioned source-file replacement, logical dataset lineage, deletion-request workflow,
API-key management, versioned outbound webhook contract with HMAC signing and bounded retry scheduler,
tenant-isolation regression, and minimal UI for lineage/replacement/deletion requests.

---

## Deliverables

### Schema Changes

| Change | Detail |
|--------|--------|
| New enums | `DeletionRequestStatus` (PENDING/APPROVED/REJECTED/CANCELLED), `WebhookDeliveryStatus` (PENDING/DELIVERED/FAILED/EXHAUSTED) |
| `TdrSourceFile` fields | `logicalDatasetId`, `versionNumber` (default 1), `supersedesSourceFileId`, `replacementReason` |
| `TdrSourceFile` relations | `supersedes`/`supersededBy` (SourceFileVersionChain), `deletionRequests` |
| `TdrSourceFile` index | `(tenantId, logicalDatasetId)` |
| New model | `TdrSourceDeletionRequest` — deletion workflow, indexes on (tenantId, status), (sourceFileId) |
| New model | `TdrApiKey` — SHA-256 hash, keyPrefix, scopes array, expiry, revocation |
| New model | `TdrWebhookSubscription` — url, eventTypes array, signingSecret, enabled |
| New model | `TdrWebhookDeliveryAttempt` — attempt tracking, backoff, retry index on nextRetryAt |
| Migration | `20260921210246_add_versioning_integration` — 100% additive, no DROP statements |
| Backfill | 4 existing source files: `logicalDatasetId = id`, `versionNumber = 1` |

### New Backend Files

| File | Purpose |
|------|---------|
| `backend/src/trade-data-refinery/services/tdr-versioning.service.ts` | `createReplacement()` + `getLineage()` |
| `backend/src/trade-data-refinery/services/tdr-deletion-request.service.ts` | `create/approve/reject/cancel/list` |
| `backend/src/trade-data-refinery/services/tdr-api-key.service.ts` | `create/list/revoke/authenticate`, SHA-256 key storage |
| `backend/src/trade-data-refinery/services/tdr-webhook.service.ts` | `subscribe/unsubscribe/listSubscriptions/dispatchEvent`, bounded retry scheduler |
| `backend/src/tdr-versioning-integration.spec.ts` | 37 backend tests (AK.1–11, DR.1–10, WH.1–12, VI.1–2, CS.1–2) |
| `backend/backfill-versioning.mjs` | One-time backfill script (executed; safe to keep) |

### Modified Backend Files

| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | 2 new enums, 4 versioning fields on TdrSourceFile, 4 new models, back-relations on Tenant+User |
| `backend/src/trade-data-refinery/tdr.controller.ts` | Injected 4 new services; 14 new endpoints (versioning, deletion, API keys, webhooks) |
| `backend/src/trade-data-refinery/trade-data-refinery.module.ts` | Registered 4 new services |

### New Frontend Files

| File | Purpose |
|------|---------|
| `src/components/tdr/TdrLineagePanel.tsx` | Version lineage + replacement upload UI |
| `src/components/tdr/TdrDeletionRequestPanel.tsx` | Deletion request create/approve/reject/cancel |
| `src/app/tdr/lineage/page.tsx` | /tdr/lineage page |
| `src/app/tdr/deletion-requests/page.tsx` | /tdr/deletion-requests page |
| `src/__tests__/tdr-versioning-integration.test.tsx` | 14 frontend tests (FE-V1–14) |

### Modified Frontend Files

| File | Change |
|------|--------|
| `src/lib/tdr-api.ts` | Added `getLineage`, `replaceSourceFile`, `createDeletionRequest`, `listDeletionRequests`, `approveDeletionRequest`, `rejectDeletionRequest`, `cancelDeletionRequest` |
| `src/app/tdr/layout.tsx` | Added "Lineage" and "Deletion Requests" nav items |

---

## New API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/tdr/source-files/:id/replace` | JWT, upload role | Upload replacement file |
| GET | `/tdr/lineage/:logicalDatasetId` | JWT | Get version chain |
| POST | `/tdr/source-files/:id/deletion-requests` | JWT | Create deletion request |
| GET | `/tdr/deletion-requests` | JWT | List deletion requests |
| POST | `/tdr/deletion-requests/:id/approve` | JWT, admin | Approve deletion request |
| POST | `/tdr/deletion-requests/:id/reject` | JWT, admin | Reject deletion request |
| POST | `/tdr/deletion-requests/:id/cancel` | JWT | Cancel deletion request |
| POST | `/tdr/api-keys` | JWT, admin | Create API key |
| GET | `/tdr/api-keys` | JWT | List active API keys |
| DELETE | `/tdr/api-keys/:id` | JWT, admin | Revoke API key |
| POST | `/tdr/webhooks` | JWT, admin | Subscribe webhook |
| GET | `/tdr/webhooks` | JWT | List subscriptions |
| DELETE | `/tdr/webhooks/:id` | JWT, admin | Unsubscribe |

---

## Security Properties

- API key plaintext returned only on creation; SHA-256 hash stored; never logged
- Webhook HMAC: `sha256=` signature over `${ts}.${body}`; SSRF blocked (localhost, 127.x, ::1, 169.254.x, RFC-1918)
- Identical binary replacement rejected via existing `@@unique([tenantId, contentHash])`
- Previous version NOT auto-archived — remains ACTIVE (by design)
- All new endpoints scoped to `TenantModuleGuard` + per-method RBAC
- No tenant boundary violation: all queries include `tenantId` filter
- No credentials logged

---

## Test Results

| Suite | Passing | Notes |
|-------|---------|-------|
| Backend Jest | 812/814 | +37 new tests (AK, DR, WH, VI, CS); 1 skipped pre-existing, 1 flaky (SA.15, passes in isolation) |
| Frontend Vitest | 159/159 | +14 new tests (FE-V1–V14) |
| New backend tests | 37/37 | API keys (11), deletion requests (10), webhooks (12), schema (2), cardinality (2) |
| New frontend tests | 14/14 | Lineage panel (7), deletion panel (6), lineage page (1) |

---

## Scope Constraints Honored

- No DROP COLUMN / DROP TABLE in migration (additive only)
- No push to remote
- No credentials committed
- No Phase 7 content
- No physical source deletion
- `F:\OpenCode\shop.com` untouched
- Webhook retry bounded (max 3 attempts, setInterval-based, no Redis/BullMQ)

---

## Blockers / Notes

- None. All gates clear.

---

## Next Task

MEGA TASK 6 — TDR-POST-MVP-MULTI-TENANCY-HARDENING-001 (PM authorization required)
