# Trade Data Refinery — Start Here

This is the mandatory restart checkpoint for ChatGPT Luna, Claude Code, and human operators.

## Current control state

- Repository: `E:\ToplineShop`
- Integration branch: `codex/trade-data-refinery`
- Stable branch: `master` — do not modify directly
- Governance: `#123` — DISCUSS → DECIDE → EXECUTE → VERIFY/AUDIT → CLOSE → NEXT
- Product status: frontend work is complete; TDR-P1-011 was the historical blocked audit — TDR-P1-012 resolved it; G1 (frontend freeze) is `PASS`
- Last completed task: `TDR-P0-003 — Source and Use-Case Discovery (Synthetic Examples)`
- Current task status: `PASS`
- Latest authoritative WDR: `WDR/_All/Trade-Data-Refinery/TDR-P0-003_WDR_2026-09-17_03-41.md` — `PASS`
- G1 frontend freeze: `PASS`
- Backend, database, persistence, authentication, RBAC, and external ingestion remain unauthorized until the required gates pass

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
