# TDR-MVP-FRONTEND-001-CORRECTION-003 — Prompt Archive
**Archived:** 2026-09-20  
**Convention:** Prompt received before GATE A began execution.

---

# ERP64 — TRADE DATA REFINERY-BUSHRA
# TDR-MVP-FRONTEND-001-CORRECTION-003
# SYSTEM INTEGRATION + API CONTRACT + ROLE ARCHITECTURE + SCALE-SAFETY CORRECTION
# FINAL CRITICAL-AUDIT VERSION

You are Claude Code acting as:
- principal solution architect
- NestJS backend engineer
- React/Next.js frontend engineer
- PostgreSQL/Prisma architect
- authentication/RBAC architect
- data-platform performance engineer
- application-security engineer
- integration/E2E QA engineer
- governed execution agent

for: ERP64 — Trade Data Refinery-Bushra

Apply: #5 #123 #TS #FDD

**#123:** DISCUSS → DECIDE → EXECUTE → VERIFY/AUDIT → CLOSE → NEXT

This is a bounded PRE-MEGA-6 correction. **DO NOT START MEGA 6.**

---

## §0. OBJECTIVE

Two gates:
- GATE A — RECONCILE AUDIT TRUTH
- GATE B — IMPLEMENT ONLY CONFIRMED DEFECTS

Primary outcome: real authenticated user must be able to execute the full TDR workflow:
LOGIN → OVERVIEW → UPLOAD → BATCH → INGESTION → QUALITY → QUARANTINE/CORRECTION → ANALYTICS → EXPORT → DOWNLOAD

---

## §1. PROMPT ARCHIVE
Archive this complete prompt exactly as received. Filename: `TDR-MVP-FRONTEND-001-CORRECTION-003_PROMPT_<YYYY-MM-DD_HH-MM>.md`. Verify archive exists and is non-empty. If archive fails: STOP — BLOCKED — PROMPT ARCHIVE SAVE FAILED.

## §2. REPOSITORY GUARD
Work only in `E:\ToplineShop`. Branch: `codex/trade-data-refinery`. Audit governance commit: `f3b7283`. Required ancestry: d1c8329, e203b67, 32244c4, 1ed91dd, 3c56950, 4507ad7, f3b7283. Record starting HEAD. Unexpected runtime changes: STOP — BLOCKED — INVALID CORRECTION-003 BASELINE. Never use: git reset, git clean, git stash, git rebase, git restore owner work, force checkout, history rewrite, force push.

## §3. READ AUTHORITATIVE SOURCES
Read: docs/UNIVERSAL-AI-AGENT-EXECUTION-POLICY.md, docs/TDR-MVP-COMPRESS-PLAN-001.md, TDR-START-HERE.md, all Mega 1–5 final WDR/checkpoints/corrections, TDR-END-TO-END-INTEGRATION-AUDIT-001 WDR, backend/prisma/schema.prisma, ALL migration SQL files, backend/src/auth/**, backend/src/trade-data-refinery/**, src/app/tdr/**, src/lib/tdr-api.ts, src/lib/auth-context.tsx, src/types/tdr.ts, frontend/backend package scripts. Git/runtime evidence is authoritative. Do not treat the audit WDR as infallible.

## §4. GATE A — ENUM/MIGRATION TRUTH
Audit claims QUALITY_PENDING and PENDING_QUALITY absent from migration history. Verify: `Get-ChildItem backend/prisma/migrations -Recurse -Filter migration.sql`, `git ls-files backend/prisma/migrations`, `git log --all --name-status -- backend/prisma/migrations`, `git show caa90fc --name-status`, inspect every migration touching BatchStatus, RowDisposition, QUALITY_PENDING, PENDING_QUALITY, run `npx prisma migrate status`. DECISION: If migration already exists → MIGRATION-GAP-001 = FALSE FINDING. If genuinely missing → STOP and propose minimal migration. Do not silently create duplicate enum values.

## §5. FREEZE ACTUAL ENUM CONTRACT
Read schema.prisma. Record exact current enum values. Do not use stale audit names. Expected: BatchStatus includes RECEIVED, QUEUED, PROCESSING, QUALITY_PENDING, REVIEW_REQUIRED, READY, PARTIAL, FAILED, CANCELLED, EXPORTING, EXPORTED. RowDisposition includes PENDING_QUALITY, ACCEPTED, QUARANTINED, REJECTED. Use repository truth. Correct audit docs containing stale DONE, CLEAN, CORRECTED, EXPORTED-as-row-disposition.

## §6. RECONCILE CANONICAL PM REGISTER
PM-001: upload-size policy (default 500 MB). PM-002: record retention. PM-003: TdrSourceRow. PM-004: correction privacy. PM-005: frontend/session token storage. PM-006: replay authorization. PM-007: export format. PM-008: record archive/delete. Do NOT redefine PM-006 as role assignment. Create ARCH-ROLE-001 for persisted tenant-role assignment. Create ARCH-SESSION-001 if needed.

## §7. VERIFY ACTUAL UPLOAD LIMIT
Inspect: ingestion limits, Multer/controller limit, frontend display, client-side validation. Canonical PM-001 default is 500 MB overall. If frontend says 50 MB while backend allows 500 MB: classify UI-CONTRACT-008 and fix frontend display/client validation. Do not silently reduce backend to 50 MB.

## §8. VERIFY SUPPORTED FILE FORMATS
Frozen MVP: CSV, XLSX. Not XLS. If frontend accepts `.xls`: remove `.xls`. Do not add XLS parser. Correct audit statements suggesting XLS processing.

## §9. CONFIRM EACH API CONTRACT DEFECT
For each finding inspect: controller, service, DTO, success()/response-envelope helper, frontend API client, frontend type, frontend page. Obtain actual HTTP JSON where practical. Classify CONFIRMED/PARTIAL/FALSE. Findings: API-CONTRACT-001 (listBatches), API-CONTRACT-002 (cancelBatch), API-CONTRACT-003 (getBatchProgress), API-CONTRACT-004 (listQuarantine), API-CONTRACT-005 (applyCorrection), API-CONTRACT-006 (createExport), API-CONTRACT-007 (export download authentication). Only CONFIRMED defects may be modified.

## §10. FREEZE ONE API ENVELOPE CONVENTION
Inspect backend/src/common/api-response.ts. Preferred: `success(data, meta?)` → `{ ok: true, data: ..., meta?: ... }`. Frontend API client must preserve BOTH data AND meta when pagination exists. Implement typed helpers: ApiSuccess<T>, ApiSuccessWithMeta<T, M> or equivalent. Do not introduce second response-envelope convention.

## §11. FIX BATCH LIST CONTRACT
Backend may continue returning `data: TdrBatch[], meta: { page, pageSize, total, totalPages }`. Frontend must adapt correctly. Create explicit client return `{ batches, page, pageSize, total, totalPages, hasMore }`. Do not cast `body.data` directly to BatchListResponse. Standardize 1-based page numbering. Frontend first page = 1, not 0. Test page 1, page 2, no duplicated first page.

## §12. BATCH LIST BUSINESS FIELDS
Frontend must not render fields backend never returns. Add necessary safe fields to backend select OR remove unsupported UI fields. Required useful fields: id, source filename, trade direction, status, totalSourceRows, processedRows, acceptedRows, quarantinedRows, rejectedRows, createdAt, updatedAt/completedAt. Do not invent: uploadedAt, mappingProfileId.

## §13. CANCEL CONTRACT
POST cancel returns: `{ cancelled: true, batchId, status: CANCELLED }`. Frontend updates status safely OR refetches. Do NOT type as returning full TdrBatch.

## §14. BATCH PROGRESS CONTRACT
Fields: batchId, status, totalSourceRows, processedRows, acceptedRows, quarantinedRows, rejectedRows, percentComplete nullable, completedAt. Percent: if totalSourceRows > 0: processedRows / totalSourceRows * 100, bounded 0–100. If unknown: percentComplete = null.

## §15. ACTIVE BATCH STATUS SET
Frontend polling/action logic must include RECEIVED, QUEUED, PROCESSING, QUALITY_PENDING at minimum. Cancel button remains backend-authoritative.

## §16. QUARANTINE CONTRACT
Choose ONE model. Preferred: record-centric OR issue-centric if backend favors it. Backend, frontend API, types, page must use exactly same contract.

## §17. CORRECTION REQUEST CONTRACT
Frontend sends: `{ fieldName, correctedValue, note? }`. No arbitrary map. Multi-field corrections must use intentional multi-correction contract or individual explicit submissions.

## §18. CORRECTION ATOMICITY — PROMOTE TO P1-DATA-INTEGRITY
All correction operations must be atomic within one Prisma transaction: validate state, mark prior OPEN issues, apply correction, revalidate, create issues, update disposition, exportEligible, create TdrQuarantineReview, update counters. Any step fails: rollback.

## §19. CORRECTION PRIVACY
Do NOT incorrectly classify TdrQuarantineReview as generic AuditLog. Keep correctionPayload bounded, allowlisted, minimal, protected domain only. Do not duplicate full raw rows. Minimize if it contains unnecessary sensitive fields. Do not destroy reconstructable correction history.

## §20. EXPORT CREATE CONTRACT
Frontend sends exact flat DTO matching CreateExportDto. No nested filter object unless backend defines it. Normal export forces ACCEPTED + exportEligible=true.

## §21. EXPORT DOWNLOAD — FREEZE SOLUTION
Do NOT use naked `<a href="/tdr/exports/.../download">` when Bearer Authorization required. Use: AUTHENTICATED FETCH → BLOB → OBJECT URL. Do not place JWT in query string. Do not implement signed download URLs in this correction.

## §22. PERSISTED ROLE ARCHITECTURE — ARCH-ROLE-001
Pre-Mega-6 functional blocker. Inspect existing auth architecture. If no persisted role source exists: implement minimum tenant-scoped role persistence. Preferred: Membership owns tenant-scoped roles. Requirements: existing Role set canonical, roles are tenant-scoped, JWT obtains from authenticated membership, no client role trust, SUPER_ADMIN handling follows platform convention, default membership must not gain powerful role automatically, dev inspection membership may explicitly receive TENANT_ADMIN, seed is dev-only, migration is additive, no destructive migration.

## §23. ROLE ENUM
Reuse canonical roles: SUPER_ADMIN, TENANT_ADMIN, IMPORT_MANAGER, EXPORT_MANAGER, SALES_MANAGER, PROCUREMENT_MANAGER, WAREHOUSE_MANAGER, FINANCE_MANAGER, ANALYST, VIEWER. If Prisma enum added: must exactly align with TypeScript role source.

## §24. ROLE MIGRATION SAFETY
ONE additive migration. No destructive SQL. Existing memberships default to empty roles. Dev seed explicitly assigns TENANT_ADMIN to admin@toplineshop.dev for local owner inspection only. Never seed production admin credentials.

## §25. JWT ROLE RESOLUTION
Login resolves user, selected tenant membership, membership status, roles from that exact membership. No `roles: []` hardcoded. Refresh must preserve/reload current roles safely.

## §26. RBAC REAL HTTP TESTS
Test with persisted roles. TENANT_ADMIN: upload/cancel/replay/correct/export allowed. IMPORT_MANAGER: IMPORT ops allowed, EXPORT ops denied. EXPORT_MANAGER: EXPORT ops allowed, IMPORT ops denied. ANALYST: read analytics. VIEWER: read only, mutations denied. roles=[]: mutations denied.

## §27. SESSION PERSISTENCE
PM-005 open. Do NOT introduce localStorage. Keep current in-memory token model. Fix token expiry awareness, refresh handling, clean 401 → login-gate transition. Document browser hard refresh requires re-login.

## §28. QUALITY WORKER MEMORY — CRITICAL SCALE FIX — P1-SCALE
Quality worker must NEVER materialize all batch records into array/Map/object before processing. Required pattern: query bounded chunk (~500), ORDER BY deterministic key (sourceRowNumber or id/cursor), process, bulk persist, commit, repeat. At any time application-owned pending-row buffer must remain approximately one chunk, not total batch size.

## §29. QUALITY RESTARTABILITY
Continue using rowDisposition=PENDING_QUALITY as durable remaining-work marker. Crash-safe: already committed rows remain final, remaining rows still PENDING_QUALITY, restart resumes safely.

## §30. QUALITY HOT-PATH DB WRITES
Preserve existing set-based/bulk persistence. Do not regress to per-row updates. Use bulk UPDATE/VALUES, createMany, bounded transaction.

## §31. JOB/BATCH COMPLETION ATOMICITY
Audit ingestion, quality, export job completion. Where job status and batch/domain status must change together: use transaction. Fix confirmed non-atomic completion.

## §32. SYSTEM AUDIT ACTOR
Do not use `actorUserId: ''` for system events if AuditLog requires user references. Use repository-approved system actor representation: nullable actor, actorType, or safe sentinel only if schema explicitly supports it. Do not invent fake UUID.

## §33. VALIDATOR REQUIRED-FIELD MAPPING
Audit `getRawValueForCanonical`. Every canonical field that mapping profiles may mark REQUIRED must resolve to correct source/raw value. Add tests for all supported required canonical fields.

## §34. RECORDS API PAGINATION
Standardize semantics. Prefer 1-based page numbering. Do not maintain batches=1-based + records=0-based. Remove redundant COUNT. Do not weaken RAW_SCOPE_BUDGET.

## §35. EXPORT PAGINATION
For deterministic export output prefer tradeDate ASC NULLS LAST then id ASC. If performance regression: retain stable id order and document.

## §36. EXPORT TEMP STORAGE
Do not rely blindly on OS temp for large exports. Reuse TDR-managed temp/storage path. No large in-memory CSV string. Preserve streaming.

## §37. REAL API CONTRACT TESTS
Add HTTP integration tests using actual controllers + DTOs + response envelope. At minimum: GET /tdr/status, GET /tdr/batches, GET /tdr/batches/:id, GET /tdr/batches/:id/progress, POST cancel, POST replay, GET quarantine, GET quality detail, POST correct, POST export, GET export status, GET authenticated export download, GET analytics summary, trend, breakdown, filter-options, GET records, POST upload.

## §38. E2E BROWSER TESTING
If Playwright/Cypress not present: authorized to add @playwright/test as DEV dependency. Do not add Cypress. Create focused TDR smoke suite. Required: login, overview, navigate all 6 pages, no dead navigation, no login loss during SPA navigation, no fatal console errors.

## §39. FULL BUSINESS E2E FIXTURE
Create SMALL synthetic non-PII CSV fixture generated during test. E2E workflow: TENANT_ADMIN login, upload valid CSV, batch processing, quality completion, open records/analytics, if quarantined perform correction, request export, wait, authenticated download, verify CSV exists with expected header/row count.

## §40–§44. NO FAKE BYPASS / DATA CLEANUP / FRONTEND UI / ERROR BEHAVIOR / SECURITY REGRESSION
Do NOT bypass authentication, RolesGuard, TenantModuleGuard. Use actual app stack. Clean only synthetic test records. Fix upload formats (CSV/XLSX only), display actual 500MB limit, correct BatchStatus/RowDisposition unions. Every page: 401→login, 403→permission, 404→not found, 409→conflict, 400→validation, 500→generic. Verify no plaintext password, no JWT in URL, tenant server-derived, role server-derived, guards intact.

## §45–§47. PERFORMANCE / INDEX / MIGRATION LIMIT
Verify CSV/XLSX streaming, quality chunk bounded, export streaming. Do not add broad dashboard indexes. At most: role migration + one index-only migration if justified. No enum migration if Mega 3 enum migration exists.

## §48. TEST COUNT IS NOT THE SUCCESS CRITERION
Success = real wire contracts match, real login, real roles, real navigation, real upload, real pipeline, real export downloads, bounded-memory worker.

## §49. REQUIRED VALIDATION
Backend: `npx prisma format`, `npx prisma validate`, `npx prisma migrate status`, `npx tsc --noEmit`, `npx jest --no-coverage`. Frontend: `npx tsc --noEmit`, `npx vitest run`, `npm run build`. E2E: Playwright smoke. Also `git diff --check`.

## §50. FRESH MIGRATION PROOF
Without touching owner DB, prove complete committed migration chain can construct fresh schema via temporary isolated DB. If no safe isolated DB: document inability.

## §51. ALLOWED FILE SCOPE
backend/prisma/schema.prisma, one role migration, one index migration if justified, backend/src/auth/**, backend/src/trade-data-refinery/**, backend focused tests, frontend TDR pages/types/API/auth integration, frontend tests, Playwright config/tests if authorized, package/lock if Playwright added, WDR/governance files, prompt archive.

## §52. FORBIDDEN
Do NOT: start Mega 6, implement warehouse/OLAP/fuzzy/AI, change CRM/ERP flows, rewrite Git history, reset DB, add duplicate enum migration, weaken auth, trust browser roles, store token in URL, use localStorage without PM-005, add fake production data, commit real customs PII, commit huge fixtures.

## §53. STOP CONDITIONS
STOP if: migration truth unresolved, schema/runtime enum contradictory, role architecture requires broader redesign, real workflow cannot be tested safely, quality worker still requires all-record map, frontend/backend contracts mismatch, tenant isolation fails, RBAC fails, migration reset requested, tests/build/TS fail, secret/PII leakage, unrelated files need broad modification.

## §54. DIFF AUDIT
Before commit: git status --short, git diff --check, inspect entire diff, migration SQL, package changes, verify no .env/logs/large generated files/real customs data.

## §55. COMMIT POLICY
Prefer one logical runtime correction commit if scope coherent. If role + frontend/API too large: split into Commit A (auth/role) + Commit B (TDR contract/integration/scale). Each commit must independently pass targeted tests. Governance WDR = later documentation commit. Exact-file staging only. Never: git add . / -A / --all. No push.

## §56. REQUIRED WDR
Create TDR-MVP-FRONTEND-001-CORRECTION-003 WDR including: starting HEAD, audit hash, correction hash(es), Gate A reconciliation, migration truth, actual enum truth, canonical PM register, role architecture, role migration, JWT role behavior, session behavior, upload-size truth, supported file formats, API contract matrix before/after, batch pagination, cancel contract, progress contract, quarantine contract, correction DTO, correction atomicity, correction privacy, export create contract, authenticated download, quality memory fix, quality chunk proof, job/batch completion atomicity, records pagination, validation required-field fix, real HTTP contract tests, browser E2E, full synthetic business E2E, fresh migration proof, backend tests, frontend tests, build, TypeScript, Prisma status, security audit, performance audit, remaining P2/P3, PM decisions still open, Mega 6 readiness.

## §57. FINAL READINESS GATE
Mega 6 may be recommended ONLY IF ALL: migration reconciled, no P0/P1, persisted roles permit real authorized mutations, unauthorized users denied, contracts match, login/navigation/upload/ingestion/quality/quarantine+correction/analytics/export/download works, quality worker memory bounded, all regression passes, browser E2E PASS, synthetic E2E PASS. Otherwise: BLOCKED — DO NOT START MEGA 6.

## §58. FINAL RESPONSE FORMAT
Return: 1. PASS/BLOCKED 2. starting HEAD 3. audit hash 4. Gate A migration verdict 5. confirmed defect register 6. defects disproven 7. role architecture result 8. schema/migration changes 9. API contract fixes 10. frontend fixes 11. quality-memory fix 12. correction atomicity result 13. export/download result 14. backend HTTP contract tests 15. browser E2E result 16. full synthetic business E2E result 17. fresh migration proof 18. backend regression 19. frontend regression 20. TypeScript 21. build 22. security audit 23. performance audit 24. exact files changed 25. full commit hash(es) 26. WDR path 27. final verdict: READY FOR TDR-MVP-FINAL-AUDIT-001 or BLOCKED — DO NOT START MEGA 6. STOP.
