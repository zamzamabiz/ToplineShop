# TDR Operations Runbook

Trade Data Refinery-Bushra — Operations Reference v1.0  
Date: 2026-09-22

---

## Scenario Index

1. Backend service does not start
2. Database unreachable at startup
3. Frontend cannot reach backend
4. JWT auth failures / 401 everywhere
5. Upload fails immediately
6. Ingestion job stuck in LEASED state
7. Quality job not created for READY batch
8. Export job stuck / never completing
9. Export download returns 410 Gone
10. Export download returns 403 Forbidden
11. Archived source file returns 409 on re-archive
12. Restore fails for non-archived file
13. Metrics endpoint returns empty
14. Health/ready returns 503
15. Temp cleanup not running
16. Export cleanup not cleaning expired binaries
17. Orphaned uploads in storage
18. S3 adapter not writing files
19. Tenant isolation check
20. Lease reclaim spike in metrics
21. High 4xx rate in metrics
22. DB readiness check failing intermittently

---

## Scenario 1 — Backend service does not start

**Symptom:** `npm run start:dev` exits immediately or logs fatal error.

1. Check `validateEnv()` output — missing required env vars cause a fatal exit with a clear message.
2. Verify `.env` contains: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`.
3. Check `LOCAL_STORAGE_ROOT` is set and directory exists (or `S3_BUCKET_NAME` for S3 mode).
4. Check port 4000 is not already in use: `netstat -ano | findstr :4000`.

---

## Scenario 2 — Database unreachable at startup

**Symptom:** `health/ready` returns 503; `tdr_db_readiness_total{result="fail"}` increments.

1. Verify PostgreSQL is running: `pg_isready -h localhost -p 5432`.
2. Check `DATABASE_URL` format: `postgresql://user:pass@host:port/dbname`.
3. Verify the database exists: `psql $DATABASE_URL -c "SELECT 1"`.
4. Check network (firewall, VPN) between backend and DB host.
5. Run `npx prisma db push --preview-feature` if schema out of sync.

---

## Scenario 3 — Frontend cannot reach backend

**Symptom:** Browser console shows CORS errors or `net::ERR_CONNECTION_REFUSED`.

1. Verify backend is running at :4000: `curl http://localhost:4000/health`.
2. Check `NEXT_PUBLIC_API_URL` in frontend `.env.local` points to the correct backend URL.
3. Check `CORS_ORIGINS` in backend `.env` includes the frontend origin (default: `http://localhost:3000`).
4. Check browser devtools for the `Access-Control-Allow-Origin` response header.

---

## Scenario 4 — JWT auth failures / 401 everywhere

**Symptom:** All authenticated endpoints return 401; login succeeds but API calls fail.

1. Check `JWT_ACCESS_SECRET` matches between the token-issuing and token-verifying env.
2. Check system clock skew — JWT `iat`/`exp` are time-sensitive.
3. Check cookie settings: `HttpOnly`, `SameSite`, `Secure` (Secure only works over HTTPS).
4. Check `X-Request-ID` header — present in 401 responses for correlation.
5. Try `POST /auth/refresh` — if that also 401s, the refresh token is expired/invalid.

---

## Scenario 5 — Upload fails immediately

**Symptom:** `POST /tdr/upload` returns 400 or 500.

1. Check file size — default multer limit is 50MB.
2. Check file type — only `.csv` and `.xlsx` are accepted.
3. Check storage adapter availability (`LOCAL_STORAGE_ROOT` writable, or S3 reachable).
4. Check tenant module enabled: `tdrModule.isModuleEnabled(tenantId)` must return true.
5. Check mapping profile exists for the declared `tradeDirection`.

---

## Scenario 6 — Ingestion job stuck in LEASED state

**Symptom:** Batch stays in `PROCESSING` status; no `tdr_job_events_total{label="completed"}` increment.

1. Check `leaseExpiresAt` — expired leases are reclaimed automatically every minute.
2. Check backend logs for worker errors: `[TdrIngestionWorker]`.
3. Check `tdr_job_events_total{job_type="processing",label="failed"}` for failures.
4. If `attemptCount >= maxAttempts`, job is terminal FAILED — use replay API.
5. Force reclaim: `POST /tdr/admin/reclaim-leases` (SUPER_ADMIN only).

---

## Scenario 7 — Quality job not created for READY batch

**Symptom:** Batch is in `QUALITY_PENDING` but `tdrQualityJob` is missing.

1. Check `reconcileQualityJobs()` ran on startup — it auto-creates missing quality jobs.
2. Restart backend to trigger reconciliation.
3. If batch is in `FAILED`, it requires explicit replay — auto-reconciliation does not touch FAILED batches.

---

## Scenario 8 — Export job stuck / never completing

**Symptom:** `POST /tdr/exports` creates job but status stays PENDING or LEASED.

1. Check `[TdrExportWorker]` logs for errors.
2. Check lease reclaim is running (every 5 minutes).
3. Check `maxAttempts` — default is 3; after that it goes to FAILED.
4. Check storage write: `tdr_storage_ops_total{op="put",result="failure"}`.
5. Check filtering — if no rows match the export filter, the job may complete with 0 rows.

---

## Scenario 9 — Export download returns 410 Gone

**Symptom:** `GET /tdr/exports/:id/download` returns 410.

**Cause:** Export binary has expired (90-day TTL). The metadata row is preserved.

1. Create a new export job for the same criteria.
2. The old job row remains in the DB for audit — it is not deleted.

---

## Scenario 10 — Export download returns 403 Forbidden

**Symptom:** `GET /tdr/exports/:id/download` returns 403 for a valid user.

1. Check user's role against trade direction:
   - IMPORT direction requires: `IMPORT_MANAGER`, `TENANT_ADMIN`, or `SUPER_ADMIN`.
   - EXPORT direction requires: `EXPORT_MANAGER`, `TENANT_ADMIN`, or `SUPER_ADMIN`.
2. Check `tenantId` — users can only access their own tenant's exports.

---

## Scenario 11 — Archived source file returns 409 on re-archive

**Symptom:** `POST /tdr/source-files/:id/archive` returns 409 Conflict.

**Cause:** The file is already archived. This is correct behavior.

- To restore: `POST /tdr/source-files/:id/restore` (TENANT_ADMIN or SUPER_ADMIN).
- Download of archived files still works (archive status does not block download).

---

## Scenario 12 — Restore fails for non-archived file

**Symptom:** `POST /tdr/source-files/:id/restore` returns 422 Unprocessable Entity.

**Cause:** The file is not archived. No action needed.

---

## Scenario 13 — Metrics endpoint returns empty

**Symptom:** `GET /metrics` returns only HELP/TYPE lines with no data points.

**Cause:** No traffic has flowed through the instrumented paths yet. This is normal at startup.

- Trigger `GET /health/ready` to emit `tdr_db_readiness_total` data.
- Generate an upload or export to emit job/storage metrics.

---

## Scenario 14 — Health/ready returns 503

**Symptom:** `GET /health/ready` returns HTTP 503 with `checks.database: "unavailable"`.

1. Check DB connectivity (see Scenario 2).
2. Check `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are non-empty.
3. Check `DATABASE_URL` is non-empty.
4. `GET /health/live` will still return 200 (liveness is process-only).

---

## Scenario 15 — Temp cleanup not running

**Symptom:** `tdr_temp_cleanup_runs_total` stays at 0 after > 1 hour.

1. Verify `TempCleanupService` is registered in `TradeDataRefineryModule`.
2. Check `os.tmpdir()` is accessible (Windows: `%TEMP%`, Linux: `/tmp`).
3. Check file permissions on tmpdir.
4. Restart backend — `onModuleInit` schedules a first run after 5 seconds.

---

## Scenario 16 — Export cleanup not cleaning expired binaries

**Symptom:** `tdr_export_cleanup_total{result="success"}` does not increment; expired exports still have `storageKey`.

1. Check `TdrExportCleanupService` is registered in `TradeDataRefineryModule`.
2. Check storage adapter `removeSafe` is reachable (S3 connectivity, local permissions).
3. Check `expiresAt` is being set: export jobs must have `expiresAt` set by orchestrator.
4. Restart backend to trigger the cleanup cycle.

---

## Scenario 17 — Orphaned uploads in storage

**Symptom:** Files exist in storage (local or S3) with no corresponding `tdrSourceFile` row.

**Cause:** Transaction failed after `storage.persist()` but before DB write. Rare.

1. List storage keys: `SELECT "storageKey" FROM tdr_source_files WHERE "tenantId" = '...'`.
2. Compare with files in `LOCAL_STORAGE_ROOT/<tenantId>/` (or S3 prefix).
3. Files in storage but not in DB are orphans — safe to remove manually.
4. File in DB but not in storage — download will fail; re-upload required.

---

## Scenario 18 — S3 adapter not writing files

**Symptom:** `tdr_storage_ops_total{op="put",result="failure"}` increments.

1. Check `S3_BUCKET_NAME`, `S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`.
2. Verify IAM policy allows `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on the bucket.
3. Check `S3_KEY_PREFIX` does not end with `/` — the adapter adds separators.
4. Check bucket exists and is in the correct region.
5. Verify `USE_S3_STORAGE=true` in env.

---

## Scenario 19 — Tenant isolation check

**Symptom:** User appears to access another tenant's data (unexpected 200).

1. All TDR queries filter on `tenantId` from the JWT payload — not from request params.
2. Verify JWT is signed with `JWT_ACCESS_SECRET` and not tampered.
3. Check `TenantModuleGuard` is applied to the module route.
4. Audit log: `SELECT * FROM "AuditEvent" WHERE "tenantId" = '...' ORDER BY "createdAt" DESC LIMIT 50`.

---

## Scenario 20 — Lease reclaim spike in metrics

**Symptom:** `tdr_job_events_total{label="lease_reclaim"}` > 5 in 1 minute.

**Cause:** Workers are dying before completing jobs, causing leases to expire.

1. Check backend logs for worker panics or OOM.
2. Check `leaseDurationMs` — too short a lease causes false expirations.
3. Check DB connectivity — heartbeat failures let leases expire.
4. Check `maxAttempts` — jobs after reclaim that hit maxAttempts go to FAILED.

---

## Scenario 21 — High 4xx rate in metrics

**Symptom:** `tdr_http_requests_total{status_class="4xx"}` > 20/min.

1. Check frontend is sending valid JWT tokens (not expired, not malformed).
2. Check CORS preflight — OPTIONS requests returning 4xx indicate CORS misconfiguration.
3. Check rate limiter: ThrottlerModule is set to 100 req/60s per IP.
4. Check API contract — frontend may be sending incorrect request shapes.

---

## Scenario 22 — DB readiness check failing intermittently

**Symptom:** `tdr_db_readiness_total{result="fail"}` increments occasionally but service recovers.

**Cause:** Transient DB connection drop, pool timeout, or DB restart.

1. Check PostgreSQL slow query log for long-running queries blocking connections.
2. Increase Prisma connection pool size: `DATABASE_URL` can include `?connection_limit=10`.
3. Check for connection storms — multiple backend instances sharing a small pool.
4. Consider adding a connection retry wrapper around the readiness check for flap detection.
