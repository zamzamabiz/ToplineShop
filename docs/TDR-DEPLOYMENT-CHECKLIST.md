# TDR Deployment Checklist

Trade Data Refinery-Bushra — Deployment Checklist v1.0  
Date: 2026-09-22

---

## Pre-Deployment

- [ ] **Backup** — Take a full DB dump before any migration: `pg_dump -F c -f pre-deploy-YYYYMMDD.dump`
- [ ] **Migrate check** — Review `prisma/migrations/` for new migration files. Check for destructive operations (DROP COLUMN, DROP TABLE) before deploying.
- [ ] **Env vars** — Verify all required env vars are present:
  - `DATABASE_URL` — PostgreSQL 18 connection string
  - `JWT_ACCESS_SECRET` — non-empty, > 32 chars
  - `JWT_REFRESH_SECRET` — non-empty, > 32 chars, different from ACCESS_SECRET
  - `LOCAL_STORAGE_ROOT` or `S3_BUCKET_NAME` + `S3_REGION`
  - `CORS_ORIGINS` — set to frontend URL
- [ ] **Schema migration dry run** — `npx prisma migrate status` to confirm pending migrations
- [ ] **Test suite green** — Backend: 776+/777 passing. Frontend: 145/145 passing.
- [ ] **TypeScript check** — `npx tsc --noEmit` exits 0
- [ ] **Build check** — `npm run build` exits 0 (frontend: `next build`)
- [ ] **Merge freeze** — Confirm no other branch is being merged concurrently

---

## Deployment

- [ ] **Stop service** (if DB migration involved) — prevent concurrent schema mutations
- [ ] **Apply migrations** — `npx prisma migrate deploy` (idempotent, production-safe)
- [ ] **Start backend** — `npm run start:prod` (or PM2/Docker equivalent)
- [ ] **Start frontend** — `npm run start` (Next.js production server)
- [ ] **Health check** — `GET /health/live` → 200, `GET /health/ready` → 200

---

## Post-Deployment

- [ ] **Smoke test — auth** — Login, get token, verify refresh works
- [ ] **Smoke test — upload** — Upload a small test CSV; verify batch enters PROCESSING
- [ ] **Smoke test — quality** — Confirm quality job is created for QUALITY_PENDING batch
- [ ] **Smoke test — export** — Create export job; download CSV; verify content
- [ ] **Smoke test — metrics** — `GET /metrics` returns Prometheus text with counters
- [ ] **Smoke test — lifecycle** — Archive a source file; verify 409 on re-archive; restore
- [ ] **Correlation ID** — Verify `X-Request-ID` header appears in responses
- [ ] **Logs** — Check backend logs for unexpected ERROR lines in first 5 minutes
- [ ] **Readiness** — Confirm `tdr_db_readiness_total{result="ok"}` increments in `/metrics`
- [ ] **Alert rules** — Confirm P0/P1 alert queries return expected values (see TDR-ALERT-POLICY.md)

---

## Rollback Procedure

If a critical issue is found post-deployment:

1. Restore DB from pre-deployment backup (see TDR-BACKUP-RESTORE-RUNBOOK.md §2.2)
2. Revert backend to previous deployed version (previous Docker image tag or git SHA)
3. Run `npx prisma migrate deploy` at the reverted version to ensure schema matches
4. Restart frontend at previous version
5. Verify health probes return 200

---

## Notes

- `validateEnv()` runs at startup and will exit the process if required env vars are missing — check logs immediately on deploy.
- `TempCleanupService` and `TdrExportCleanupService` start their first run 5 seconds after startup — normal `[INFO]` log expected.
- `reconcileQualityJobs()` runs at startup and will emit `[LOG]` for any stranded batches it repairs — not an error.
- The `/metrics` endpoint is unauthenticated by design but must be blocked at the network layer in production.
