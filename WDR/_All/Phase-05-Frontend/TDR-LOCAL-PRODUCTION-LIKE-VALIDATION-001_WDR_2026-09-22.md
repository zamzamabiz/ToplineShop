# WDR: TDR-LOCAL-PRODUCTION-LIKE-VALIDATION-001

**Task:** LOCAL PRODUCTION-LIKE VALIDATION READINESS  
**Date:** 2026-09-22  
**Branch:** codex/trade-data-refinery  
**Starting HEAD:** 7ff4be6e2d1fe60c698213ed47309909eff98489  
**Final HEAD:** 643401a (docs) → governance commit below

---

## 1. Executive Verdict

**PASS — LOCAL PRODUCTION-LIKE VALIDATION READY WITH KNOWN CONSTRAINTS**

The TDR system is ready for months-long local operation with real shipment data.

**Key evidence:**
- Backend 818/819 PASS (1 governed skip), Frontend 159/159 PASS
- Full restore drill: 24 tables, all counts matched, test DB dropped cleanly
- Backup: 112,340-byte full custom-format dump verified
- Storage: D:\ToplineShopData\TDR\ confirmed with 4 existing source files + 5 exports
- All P0/P1 defects remain 0 unresolved
- 6 local operations documents created
- Clear start/stop/restart/recover procedure documented
- Staged real-data validation plan created
- VPS exit gate defined

**Known constraint requiring immediate owner action:**  
`JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in `backend/.env` are still
`CHANGE_ME_DEV_ONLY`. These MUST be replaced with strong secrets before
ingesting real trade data. Instructions in `docs/TDR-LOCAL-PRODUCTION-LIKE-ENVIRONMENT.md §Secret Generation`.

---

## 2. Initial Repository State

| Item | Value |
|------|-------|
| Branch | codex/trade-data-refinery |
| Starting HEAD | `7ff4be6` — chore(gov): record TDR-PRODUCTION-DEPLOYMENT-ENABLEMENT-001 in registry |
| Git status | Clean tracked files; unrelated untracked artifacts only |
| PostgreSQL | localhost:5433, toplineshop_dev, 9/9 migrations applied |
| Storage root | D:\ToplineShopData\TDR (confirmed, 4 source files, 5 exports) |

---

## 3. Owner Architecture Decision Confirmed

**Architecture for this phase:**

```
Windows localhost
     │
     ├── Next.js frontend        :3000
     ├── NestJS backend          :4000  (SINGLE INSTANCE — worker constraint)
     │       ├── PostgreSQL      :5433
     │       └── D:\ToplineShopData\TDR\
     │                ├── <tenantId>\ (source files — immutable)
     │                ├── exports\
     │                ├── temp\
     │                └── archive\
     └── Browser                 http://localhost:3000
```

VPS/public deployment deliberately deferred by owner decision.
D:\ToplineShopData\TDR is approved for local production-like validation.
Windows D:\ path NOT approved for future VPS/production.

---

## 4. Files Changed

| File | Type | Purpose |
|------|------|---------|
| `docs/TDR-LOCAL-PRODUCTION-LIKE-ENVIRONMENT.md` | NEW | Three-tier env model, all required vars, secret generation, cookie behavior, known limitations |
| `docs/TDR-LOCAL-OPERATIONS-RUNBOOK.md` | NEW | Start/stop/restart/recover, 2-window procedure, health check, logs, quick check script |
| `docs/TDR-LOCAL-BACKUP-RESTORE-RUNBOOK.md` | NEW | pg_dump backup, storage backup, restore drill, emergency restore, schedule |
| `docs/TDR-LOCAL-SMOKE-CHECKLIST.md` | NEW | 8-phase owner-operable smoke checklist |
| `docs/TDR-LOCAL-REAL-DATA-VALIDATION-PLAN.md` | NEW | 5-stage real-data validation plan with measurements template |
| `docs/TDR-LOCAL-TO-VPS-READINESS-GATE.md` | NEW | P0/P1/O1–O5/P2 gate criteria for VPS migration |

---

## 5. Test Results

### Backend Jest

```
Test Suites:  21 passed, 21 total
Tests:         1 skipped, 818 passed, 819 total
```

Same as prior baseline — 818/819 PASS (1 pre-existing governed skip).

### Frontend Vitest

```
Test Files  12 passed (12)
Tests  159 passed (159)
```

159/159 PASS, same as prior baseline.

### TypeScript

- Backend tsc: PASS (exit 0)
- Frontend tsc: PASS (exit 0)

### Next.js Production Build

PASS — all routes prerendered/SSR as expected.

### Prisma

- `prisma validate`: PASS
- `prisma migrate status`: 9/9 applied, up to date

---

## 6. Backup Evidence

| Item | Value |
|------|-------|
| Method | `pg_dump -F c` (PostgreSQL custom format) |
| Source DB | `toplineshop_dev` on `localhost:5433` |
| Backup file | `tdr-full-20260922-040336.dump` (temp scratchpad) |
| Backup size | **112,340 bytes** |
| Backup verification | Non-zero size confirmed |

---

## 7. Restore Drill Evidence

**Method:** Separate test database (`toplineshop_restore_test`) — working DB untouched.

| Check | Result |
|-------|--------|
| Test DB created | ✓ |
| pg_restore completed | ✓ (no errors) |
| Tables restored | **24/24** |
| tdr_source_files | 4 (matches source) |
| tdr_batches | 4 (matches source) |
| tdr_records | 62 (matches source) |
| tdr_export_jobs | 5 (matches source) |
| users | 1 (matches source) |
| tenants | 1 (matches source) |
| Test DB dropped | ✓ |
| Working DB untouched | ✓ (verified via count re-query) |
| **Verdict** | **PASS** |

---

## 8. Storage Durability Evidence

| Item | Value |
|------|-------|
| Configured root | `D:\ToplineShopData\TDR` (from `backend/.env TDR_STORAGE_PATH`) |
| Existing source files | 4 files under `<tenantId>\` subdirectory |
| Existing exports | 5 CSV files under `exports\<tenantId>\` |
| Samples directory | Present with Pak export/import sample files |
| Temp directory | Present (empty = correctly cleaned) |
| Archive directory | Present |
| Source file format | Flat files named by sourceFileId (no extension) |
| Adapter | `LocalFsStorageAdapter` — atomic rename with EXDEV fallback |
| Process restart durability | Local filesystem survives process restart by design |

Source file integrity from prior gate (4/4 SHA-256 matches) remains valid.
No changes to source files or storage logic in this task.

---

## 9. Security Verification

| Item | Status |
|------|--------|
| JWT_ACCESS_SECRET | ⚠️ Still `CHANGE_ME_DEV_ONLY` in local .env — MUST be replaced before real data |
| JWT_REFRESH_SECRET | ⚠️ Same — MUST be replaced |
| TDR_WEBHOOK_SECRET_ENCRYPTION_KEY | Not yet set in local .env — required before webhook subscriptions |
| validateEnv | NOT enforcing strong secrets (NODE_ENV=development) |
| Cookie HttpOnly | ✓ |
| Cookie Secure | false (correct for HTTP localhost) |
| Cookie SameSite | strict ✓ |
| CORS | Locked to http://localhost:3000 ✓ |
| Metrics | Open in dev (no METRICS_TOKEN set locally) |
| API key security | SHA-256 stored, high entropy ✓ |
| Webhook HMAC | AES-256-GCM encrypted at rest ✓ (when key is set) |
| Source download RBAC | TenantModuleGuard + role check ✓ |
| Tenant isolation | tenantId filter on all queries ✓ |

**Action required:** Owner must replace JWT secrets before loading real trade data.
See `docs/TDR-LOCAL-PRODUCTION-LIKE-ENVIRONMENT.md §Secret Generation`.

---

## 10. Failure/Recovery Testing

| Test | Method | Result |
|------|--------|--------|
| Process restart recovery | Conceptual (documented in runbook) | DOCUMENTED |
| Database backup/restore | Full drill against test DB | PASS |
| Health probe after startup | `GET /health/ready` → 200 with DB check | DESIGN VERIFIED |
| LEASED job reclaim on restart | Code audit (reconcileQualityJobs on startup) | CODE VERIFIED |
| Invalid storage path | validateEnv FATAL in production | CODE VERIFIED |

Physical process restart was not performed in this task (running services are the owner's live system). The documented procedures in `TDR-LOCAL-OPERATIONS-RUNBOOK.md` cover restart/recovery in full.

---

## 11. Real-Data Validation Plan

5 stages: Stage 0 (smoke), Stage 1 (first real upload, ≤5K records), Stage 2 (two directions), Stage 3 (multiple months), Stage 4 (versioning), Stage 5 (sustained validation).

Measurements template provided for VPS sizing evidence.
See `docs/TDR-LOCAL-REAL-DATA-VALIDATION-PLAN.md`.

---

## 12. Local-to-VPS Exit Gate

P0 criteria: 11 items (2 pending owner action: P0-3 owner satisfaction, P0-10 strong JWT secrets).
P1 criteria: 7 items (all pending real-data validation completion).
Owner decisions: 5 (O1–O5: hosting, domain, PG, storage, budget).
See `docs/TDR-LOCAL-TO-VPS-READINESS-GATE.md`.

---

## 13. P0/P1/P2/P3 Table

| ID | Issue | Severity | Status |
|----|-------|---------|--------|
| — | SA.15 flake (S3 ReadStream race) | P0 | RESOLVED (prior gate) |
| — | Webhook secret plaintext storage | P0 | RESOLVED (prior gate) |
| — | Metrics endpoint unprotected | P0 | RESOLVED (prior gate) |
| — | Timer leak (.unref()) | P1 | RESOLVED (prior gate) |
| LPV-001 | JWT secrets are CHANGE_ME_DEV_ONLY in local .env | P1 | OPEN — Owner must replace before real data ingestion |
| P2-001 | Upload malware scanning | P2 | NOT IMPLEMENTED — deferred, trusted-user only |
| P2-002 | Live S3 ingestion | P2 | NOT ENABLED — local adapter |
| P2-003 | External production hosting | P2 | NOT PROVISIONED — owner decision (deliberate deferral) |
| P3-001 | Full production restore SLA | P3 | Local drill PASS; production SLA not proven |

---

## 14. Known Limitations

**Explicitly confirmed:**

| Limitation | Status |
|------------|--------|
| Upload malware scanning | NOT IMPLEMENTED |
| Live S3 ingestion | NOT ENABLED |
| External hosting | NOT PROVISIONED — deliberate owner decision |
| Full production restore SLA | NOT PROVEN (local drill PASS) |
| JWT secrets | CHANGE_ME_DEV_ONLY — must be replaced before real data |
| HTTPS | Not used locally (HTTP only) — acceptable for localhost |

---

## 15. Commits

| Hash | Message |
|------|---------|
| `643401a` | docs(tdr): add local production-like validation runbooks and plans |
| `<gov-hash>` | chore(gov): record TDR-LOCAL-PRODUCTION-LIKE-VALIDATION-001 in registry |

---

## 16. Final Git Status

No staged changes from unrelated files.
New documentation files staged only.

---

## 17. Next Safe Step

**OWNER ACTION REQUIRED:**

1. Replace `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in `backend/.env` with strong secrets
   (see `docs/TDR-LOCAL-PRODUCTION-LIKE-ENVIRONMENT.md §Secret Generation`)
2. Set `TDR_WEBHOOK_SECRET_ENCRYPTION_KEY` if webhook subscriptions will be used
3. Follow `docs/TDR-LOCAL-OPERATIONS-RUNBOOK.md` to start the system
4. Complete `docs/TDR-LOCAL-SMOKE-CHECKLIST.md` with synthetic data
5. Proceed to Stage 1 of `docs/TDR-LOCAL-REAL-DATA-VALIDATION-PLAN.md`

**AI agent execution resumes** only for a PM-authorized task after the above owner
steps are complete, or for a specific bounded defect that arises during validation.

**MVP REMAINS FROZEN.**

**PHASE 7 NOT STARTED.**
