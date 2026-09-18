# Trade Data Refinery — Start Here

This is the mandatory restart checkpoint for ChatGPT Luna, Claude Code, and human operators.

## Current control state

- Repository: `E:\ToplineShop`
- Integration branch: `codex/trade-data-refinery`
- Stable branch: `master` — do not modify directly
- Governance: `#123` — DISCUSS → DECIDE → EXECUTE → VERIFY/AUDIT → CLOSE → NEXT
- Product status: frontend work is complete; TDR-P1-011 was the historical blocked audit — TDR-P1-012 resolved it; G1 (frontend freeze) is `PASS`
- Last completed task: `TDR-P2-004 — Verify Audit Contract and Sensitive-Data Policy for TDR`
- Current task status: `PASS`
- Latest authoritative WDR: `WDR/_All/Trade-Data-Refinery/TDR-P2-004_WDR_2026-09-19_20-39.md` — `PASS`
- Governed P8-003 commit: `dd540a873766fc2d472e27a72ada404438ed0dc5` — `feat(p8-003): auth session lifecycle and write endpoint protection` — not pushed
- Universal AI Agent Execution Policy: `docs/UNIVERSAL-AI-AGENT-EXECUTION-POLICY.md` — ACTIVE (2026-09-18)
- G1 frontend freeze: `PASS`
- **TOPLINE-P8-002: PASS** (2026-09-18) — schema, migration, and DB tests all complete
- **TOPLINE-P8-003: PASS** (2026-09-18) — auth lifecycle, global AuthGuard, write endpoint protection, 67/67 tests
- **TOPLINE-P8-004: PASS** (2026-09-18) — RBAC, RolesGuard, PermissionsGuard, @Roles/@RequiresTenantContext decorators, 109/109 tests
- **TDR-GLOBAL-5-R1-POLICY-RESOLUTION-001: PASS** (2026-09-18) — PM Option C: docs/UNIVERSAL-AI-AGENT-EXECUTION-POLICY.md confirmed as active canonical ERP64/TDR policy; P8-005 unblocked for preparation
- **TOPLINE-P8-005: PASS** (2026-09-18) — Phase 8 freeze/readiness gate complete; 109/109 tests, build PASS, registry/WDR consistent, G1 PASS, G2 BLOCKED (TDR-P2-001 through TDR-P2-005 outstanding)
- **TDR-P2-001: PASS** (2026-09-18) — TDR Phase 2 scope registered under #FDD. TDR-P2-002 through TDR-P2-005 registered as platform readiness verification tasks per roadmap stricter sequence. G2 remains BLOCKED until all five pass.
- **TDR-P2-002: PASS** (2026-09-18) — RBAC guard contract verified for TDR. All 10 Role constants, all 5 Permission constants, all 3 decorators (@Roles/@Permissions/@RequiresTenantContext), JwtAuthGuard + RolesGuard APP_GUARD chain verified. TDR role/operation matrix produced (8 operations × 10 roles). PermissionsGuard unregistered — FUTURE_TASK_REQUIRED (not G2 blocker). 109/109 tests PASS. No runtime code changed. G2 remains BLOCKED.
- **TDR-P2-003: PASS** (2026-09-19) — Module-registry enablement contract verified for TDR. Platform architecture sufficient. Module registration point: app.module.ts imports array. No per-tenant enablement field in Tenant schema — FUTURE_TASK_REQUIRED (TDR-P3-001 migration). Disabled-tenant isolation contract defined (403 policy). Route/API exclusion contract defined. Testability contract defined. No BLOCKER_FOR_G2 found. 109/109 tests PASS. No runtime code changed. G2 remains BLOCKED.
- **TDR-P2-004: PASS** (2026-09-19) — Audit contract and sensitive-data policy verified for TDR. AuditLog model (action, entityType, entityId, tenantId, actorUserId, metadata JSON, ipAddress, userAgent, createdAt) confirmed sufficient for sanitized TDR events. AuditModule @Global + AuditService.recordEvent() with sanitizeMetadata() confirmed active. 16-event TDR audit taxonomy defined. PII sanitization policy defined (no raw file/row contents, no NTN/CNIC/tax IDs). Safe metadata contract defined. 11-item testability contract defined. 6-gap analysis: all FUTURE_TASK_REQUIRED — no BLOCKER_FOR_G2. 109/109 tests PASS. No runtime code changed. G2 remains BLOCKED — TDR-P2-005 remaining.
- P8-004 commit: `df56379e83b0624260af8d07c957db961eaa63e3` — `feat(p8-004): RBAC role-based access control on auth foundation` — not pushed
- G2 platform readiness: `BLOCKED` — TDR-P2-005 remaining
- P8-003 GOV commit created: `dd540a873766fc2d472e27a72ada404438ed0dc5` (TDR-GOV-COMMIT-P8-003-001 PASS); registry git.lastCommit updated (TDR-GOV-COMMIT-HASH-CHECKPOINT-001 PASS); not pushed

## Authoritative reading order

1. `AGENTS.md`
2. `docs/PROJECT_CONSTITUTION.md`
3. `docs/TRADE-DATA-REFINERY-STRATEGIC-EXECUTION-ROADMAP.md`
4. `src/project/projectRegistry.ts`
5. The newest file in `WDR/_All/Trade-Data-Refinery/`
6. `AGENT_REPORTS/latest-status.md` and `AGENT_REPORTS/latest-wdr-summary.md`
7. Git branch, status, and recent history

If these sources conflict, stop and create a governance reconciliation WDR. Do not guess.

## Resume procedure

Before any change, the agent must report:

- the latest WDR filename and task status;
- the last verified commit;
- the exact files changed by the last task;
- open blockers and required gates;
- the one task authorized next;
- the exact prompt file to execute, if one exists.

If no valid prompt exists for the authorized task, the agent must prepare the prompt and stop for governance review. It must not reuse an older prompt merely because it has a similar name.

## TDR-P8-003-GOVERNED-CLOSEOUT-RECON-001 closeout (2026-09-18)

P8-003 formally verified as PASS. Auth lifecycle implemented: global JwtAuthGuard with @Public() allowlist, POST /auth/login + /auth/refresh + /auth/logout, HMAC-SHA256 refresh rotation, replay revocation, write endpoint protection on POST /tenants /vendors /categories /products. 7 approved packages at exact versions. 67/67 tests pass (46 new + 21 regression). Build PASS. No schema/migration changes. No commit created — GOV commit task required before P8-004. Registry syntax error (duplicate `{` near TOPLINE-P8-002-DB-TESTS-WRITE-001 entry) detected and fixed. ESM workaround for @nestjs/jwt + @nestjs/passport in Jest via jest.mock() factories documented in WDR. G1 PASS. G2 BLOCKED — P8-004 and TDR-P2-001 through TDR-P2-005 remaining.

## TDR-P8-002-GOVERNED-CLOSEOUT-RECON-001 closeout (2026-09-18)

P8-002 formally advanced from PARTIAL to PASS. Read-only reconciliation confirmed: all registry entries accurate, backend/.env gitignored and untracked, no forbidden files modified. G2 remains BLOCKED — P8-003, P8-004, and TDR-P2-001 through TDR-P2-005 still required. PM-authorized GOV commit task is recommended before P8-003 begins, to record all P8-002 session evidence on disk. `git.lastCommit` in registry remains stale at `29deff2` (actual HEAD: `cea1101`) — the GOV commit will update it. Untracked ERP64 files (`WDR/_All/ERP64-Governance/`, `docs/ERP64_GOVERNANCE/`, `scripts/`) remain a pending PM assessment item.

## P8-002-R1 closeout (2026-09-17)

TOPLINE-P8-002-R1 formally closed as no-op. PM-authorized via P8-002-R1 closure prompt (2026-09-17). The validation failure that triggered R1 was a false positive from global npx CLI 7.10.0 — not the project's local Prisma 6.19.3. After `npm ci`, local `backend/node_modules/.bin/prisma validate` returned exit code 0. No schema, config, or migration change was made. `lastCompletedTask` updated to `TOPLINE-P8-002-R1`; `nextPlannedTask` set to null pending PM direction. P8-002 remains PARTIAL. Migration and DB tests each require separate PM-authorized tasks. G1 PASS. G2 BLOCKED. No commit created.

## TDR-G2-AUDIT-001 closeout (2026-09-17)

TDR-G2-AUDIT-001 completed a read-only G2 Platform Readiness Prerequisite Evidence Audit. **Conclusion: G2 REMAINS BLOCKED — EVIDENCE OR APPROVALS MISSING.** Blockers: (1) P8-002 PARTIAL — migration not applied, DB tests not started; (2) ~~P8-002-R1 BLOCKED~~ **P8-002-R1 CLOSED as no-op (2026-09-17)**; (3) P8-003 and P8-004 not started or registered; (4) TDR-P2-001 through TDR-P2-005 not registered. G1 PASS preserved. No product, backend, database, auth, RBAC, ingestion, or implementation work performed. No commit created. Post-task: 25 tasks (22 PASS, 1 PARTIAL, 2 BLOCKED), 30 WDR files on disk, 29 registry entries. Note: `git.lastCommit` in registry remains stale at `29deff2` (actual HEAD: `cea1101`); evidence-fill needed.

## TDR-P0-004 closeout (2026-09-17)

TDR-P0-004 recorded ADR-TDR-003 through ADR-TDR-012 in the canonical registry from roadmap Section 20. **6 CLOSED** (ADR-TDR-003 product-linked trade line; ADR-TDR-005 synchronous in-process MVP; ADR-TDR-006 exact duplicate suppressed/conflict quarantined; ADR-TDR-007 deterministic non-material normalization only; ADR-TDR-008 material corrections require distinct approver; ADR-TDR-010 marketplace/ERP contract-only disabled by default). **4 PENDING PM** (ADR-TDR-004 raw artifact storage; ADR-TDR-009 retention/deletion; ADR-TDR-011 performance/file limits; ADR-TDR-012 deployment/recovery objectives). No product, backend, database, auth, RBAC, ingestion, or implementation work performed. No commit created. G1 PASS. G2 BLOCKED. Post-task: 24 tasks (21 PASS, 1 PARTIAL, 2 BLOCKED), 28 WDR files.

## GOV-RECON-005 closeout (2026-09-17)

GOV-RECON-005 corrected the single outstanding registry discrepancy: `git.lastCommit` was stale at commit A (`4a783c528e652ec837c754b3fd71966906870b97`) while actual HEAD was commit B (`29deff2bb742bd3e101b18b307a85d6d72c96a0d`, the evidence-fill commit from the prior session). Field updated. TDR-GOV-RECON-005 task and `wdr-tdr-gov-recon-005` registered. Final verified state: **23 tasks (20 PASS, 1 PARTIAL, 2 BLOCKED)**, **27 WDR files on disk**, **27 wdrs[] entries**. G1 PASS preserved. G2 BLOCKED. No product, backend, database, auth, RBAC, ingestion, or implementation work performed. No commit created by this task.

## TDR-P0-003 closeout (2026-09-17)

TDR-P0-003 recorded the MVP user profile and first source schema in the canonical registry as governance decisions. ADR-TDR-001 CLOSED: authorized operations reviewer (tdr.view + tdr.quarantine.review) processing supplier/product trade rows via inspect→review batch→quarantine queue→lineage confirmation journey. ADR-TDR-002 CLOSED: UTF-8 CSV source profile SUPPLIER_TRADE_LINES_V1 v1.0 with 13 fixed synthetic headers; 7 sub-decisions PENDING PM (envelope limits, line endings, null policy, precision, storage). No product, backend, database, auth, RBAC, or package work performed. G1 PASS. G2 BLOCKED.

## GOV-RECON-004 closeout (2026-09-17)

GOV-RECON-004 corrected stale arithmetic in GOV-RECON-003's closeout notes: task count **(18→20 final)**, WDR inventory count **(22→24 final)**, status counts corrected to **17 PASS, 1 PARTIAL, 2 BLOCKED** (not 16 PASS). Final verified state after GOV-RECON-004: **21 tasks (18 PASS, 1 PARTIAL, 2 BLOCKED)**, **25 WDR files on disk**, **25 registry entries**. G1 remains PASS. G2 remains BLOCKED. GOV-RECON-002 and GOV-RECON-003 WDRs preserved unchanged.

## GOV-RECON-003 closeout (2026-09-17) — preserved

GOV-RECON-003 corrected factual inconsistencies in GOV-RECON-002: task count (18→20 final), WDR inventory count (22→24 final), 4 previously-MISSING WDR entries now present, GOV-RECON-002 WDR registered (not "To be added"), TDR-START-HERE.md G1 contradiction resolved (P1-011 historical blocked, P1-012 resolved it, G1 PASS), and stale `backend/node_modules/prisma` wording corrected across 3 files (`npm ci` ran 2026-09-17, deps are installed). G1 remains PASS. G2 remains BLOCKED. Original GOV-RECON-002 WDR preserved unchanged.

## GOV-RECON-002 closeout (2026-09-17) — preserved

GOV-RECON-002 reconciled the registry/roadmap/WDR/checkpoint truth after TDR-P1-012 and subsequent Phase 8 governance work. Corrections applied: git.lastCommit updated (7 commits stale), 4 missing wdrs[] entries added, TDR-GOV-RECON-002 task and WDR registered, Phase 8 P8-002 blocker #1 cleared (local Prisma 6.19.3 schema validation PASS). G1 frontend freeze remains PASS. G2 remains BLOCKED.

Untracked ERP64 files found in working tree — flagged for PM attention. No product, backend, database, Auth/RBAC, ingestion, or frontend implementation work performed. `TDR-P1-013`, `TDR-P2-001`, and all backend TDR tasks remain unauthorized.

## P1-012 closeout (preserved)

P1-012 removed or registry-bound the remaining dashboard governance claims, reconciled this checkpoint and the latest status reports, verified the live route on confirmed project-owned port 3001, and produced one WDR with fresh desktop/mobile and accessibility evidence.

Backend implementation, persistence, Auth/RBAC, ingestion, packages, Phase 8 controls, and `master` remain untouched. `TDR-P1-013` was not registered or started. G2/platform prerequisites remain blocked.

## Closeout requirement

At close, update the registry, WDR, latest status, and this checkpoint with real evidence and commit hashes. The next governed task requires separate PM approval.
