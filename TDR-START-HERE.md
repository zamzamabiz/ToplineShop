# Trade Data Refinery — Start Here

This is the mandatory restart checkpoint for ChatGPT Luna, Claude Code, and human operators.

## Current control state

- Repository: `E:\ToplineShop`
- Integration branch: `codex/trade-data-refinery`
- Stable branch: `master` — do not modify directly
- Governance: `#123` — DISCUSS → DECIDE → EXECUTE → VERIFY/AUDIT → CLOSE → NEXT
- Product status: frontend work is complete through `TDR-P1-010`; the frontend freeze gate remains blocked by the P1-011 audit findings
- Last completed task: `TDR-P1-012 — Dashboard Governance Truthfulness and Freeze Evidence Reconciliation`
- Current task status: `PASS`
- Latest authoritative WDR: `WDR/_All/Trade-Data-Refinery/TDR-P1-012_WDR_2026-09-15.md` — `PASS`
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

## P1-012 closeout

P1-012 removed or registry-bound the remaining dashboard governance claims, reconciled this checkpoint and the latest status reports, verified the live route on confirmed project-owned port 3001, and produced one WDR with fresh desktop/mobile and accessibility evidence.

Backend implementation, persistence, Auth/RBAC, ingestion, packages, Phase 8 controls, and `master` remain untouched. `TDR-P1-013` was not registered or started. G2/platform prerequisites remain blocked.

## Closeout requirement

At close, update the registry, WDR, latest status, and this checkpoint with real evidence and commit hashes. The next governed task requires separate PM approval.
