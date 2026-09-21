# TDR Production Smoke Checklist

Trade Data Refinery-Bushra — Post-Deployment Smoke Checklist v1.0  
Date: 2026-09-22

Run this checklist after every production deployment before declaring the deployment stable.
Use synthetic / test data — do not use real trade/customs records for smoke testing.

---

## Phase 1 — Infrastructure

- [ ] `GET /health/live` → 200 `{"status":"ok"}`
- [ ] `GET /health/ready` → 200 `{"status":"ok","checks":{"database":"available"}}`
- [ ] `GET /version` → 200 with version JSON
- [ ] `GET /metrics` with `Authorization: Bearer <METRICS_TOKEN>` → 200 Prometheus text
- [ ] `GET /metrics` without auth header → 401
- [ ] Backend logs: no unexpected ERROR or FATAL lines in first 2 minutes
- [ ] `tdr_db_readiness_total{result="ok"}` counter increments in `/metrics`

---

## Phase 2 — Authentication

- [ ] `POST /auth/login` with valid credentials → 200, access token returned
- [ ] `POST /auth/login` with wrong password → 401
- [ ] `GET /tdr/overview` with valid access token → 200 (not 401, not 403)
- [ ] Browser F5 (page reload) → session restored from refresh cookie, no login redirect
- [ ] `POST /auth/logout` → 200, refresh cookie cleared
- [ ] After logout: `GET /tdr/overview` → 401 or login redirect

---

## Phase 3 — TDR Core Flow

- [ ] TDR Overview page loads with tenant summary stats
- [ ] `POST /tdr/upload` — upload a small synthetic CSV file (< 1 MB)
  - Response → 201 with sourceFileId and batchId
  - Batch status: `PROCESSING` then transitions to `QUALITY_PENDING` or `PASS`/`FAIL`
- [ ] Batch list page shows the uploaded batch
- [ ] If batch status is `REVIEW_REQUIRED` (quality issues): quarantine tab shows flagged records
- [ ] Quality detail: review/correct a flagged record (if any)
- [ ] Analytics page loads with data (overview, direction breakdown)
- [ ] `POST /tdr/exports` — create export job for the uploaded batch
  - Response → 201 with exportJobId
  - Export job status: `PENDING` → `COMPLETED`
- [ ] `GET /tdr/exports/:id/download` → 200 with CSV body, correct `Content-Disposition`

---

## Phase 4 — Source Lifecycle

- [ ] `GET /tdr/source-files/:id/download` → 200 with original file binary
- [ ] `POST /tdr/source-files/:id/archive` → 200
- [ ] Source file list: archived file shows in archived filter
- [ ] `POST /tdr/source-files/:id/archive` (second time) → 409 Conflict
- [ ] `POST /tdr/source-files/:id/restore` → 200
- [ ] Source file no longer shows as archived

---

## Phase 5 — Versioning

- [ ] Upload a replacement for the previously uploaded source file
  - Use `replacedSourceFileId` parameter referencing the original
  - Response → 201 with new sourceFileId and batchId; `versionNumber = 2`
- [ ] `GET /tdr/source-files/:id/lineage` (or equivalent) → shows v1 and v2
- [ ] v1 metadata and file still intact and downloadable

---

## Phase 6 — Integration

- [ ] `POST /tdr/api-keys` → 201 with plaintext key (save it — returned only once)
  - Format: `tdr_XXXXXXXX.XXXXXXXX...` (verify format)
- [ ] `GET /tdr/source-files` using API key in `Authorization: Bearer tdr_...` → 200
- [ ] `POST /tdr/api-keys/:id/revoke` → 200
- [ ] Revoked key → 401 on subsequent request
- [ ] `POST /tdr/webhooks` → 201 with subscriptionId and signingSecret (save it — returned only once)
- [ ] `POST /tdr/webhooks/:id/unsubscribe` → 200

---

## Phase 7 — Observability

- [ ] `GET /metrics` shows `tdr_http_requests_total` with traffic from above tests
- [ ] `GET /metrics` shows `tdr_job_events_total` (upload + quality + export events)
- [ ] `GET /metrics` shows `tdr_storage_ops_total{result="success"}`
- [ ] `X-Request-ID` header present in all API responses
- [ ] No unbounded metric labels (no per-file or per-tenant counters observed)

---

## Phase 8 — Tenant Isolation (cross-tenant regression)

Requires two provisioned test tenants (Tenant A, Tenant B).

- [ ] Tenant A uploads a file → Tenant B cannot see it in source file list
- [ ] Tenant A creates export → Tenant B cannot download it
- [ ] Tenant B API key → returns only Tenant B records

---

## Pass Criteria

A deployment is declared smoke-stable when:

- All Phase 1–3 checks pass without errors
- Phase 4–7 checks pass (or are explicitly deferred with documented reason)
- No unexpected ERROR lines in backend logs during testing
- Metrics confirm traffic and job signals are recording

---

## Failure Protocol

If any Phase 1–3 check fails after deployment:

1. Do NOT ingest real data
2. Check backend logs immediately (`journalctl -u tdr-backend -n 100`)
3. Verify all env vars are present and correctly formatted
4. Consult `docs/TDR-OPERATIONS-RUNBOOK.md` for the relevant scenario
5. If the issue requires rollback: follow `docs/TDR-DEPLOYMENT-CHECKLIST.md §Rollback`
