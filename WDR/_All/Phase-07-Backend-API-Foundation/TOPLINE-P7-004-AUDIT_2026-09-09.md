# TOPLINE-P7-004 Audit — Tenant Write API

## Decision

**Audit result: BLOCKED**

`TOPLINE-P7-004` is not approved or closed. The implementation commit exists, but the WDR and governance evidence are not reliable enough to pass.

## Evidence Reviewed

- WDR: `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-004_WDR_2026-09-08.md`
- Implementation commit: `1f799ff9209dac3e659ea30073596da329430a4a`
- Later governance commit: `ffb11fbf1f13724fc57ed72d4dafd245d186af8e`
- Backend files:
  - `backend/src/tenants/dto/create-tenant.dto.ts`
  - `backend/src/tenants/tenants.controller.ts`
  - `backend/src/tenants/tenants.service.ts`
  - `backend/scripts/test-tenant-create.js`
- Registry and reports:
  - `src/project/projectRegistry.ts`
  - `AGENT_REPORTS/latest-status.md`
  - `AGENT_REPORTS/latest-wdr-summary.md`
  - `PM_OUTBOX/next-opencode-prompt.md`

## Findings

1. **Test evidence is insufficient for a write API.**
   `backend/scripts/test-tenant-create.js` does not import the real `CreateTenantDto`, controller, service, or Nest validation pipe. It duplicates validation logic inline, so the 15 passing tests prove only the copied test helper, not the implementation.

2. **Duplicate slug behavior is claimed but not tested.**
   The WDR claims duplicate slug detection is verified, but the focused test script has no service-level mock or database-backed test for `TenantsService.create()`.

3. **Registry state is internally inconsistent.**
   The registry marked `lastCompletedTask: "TOPLINE-P7-004"` and `nextPlannedTask: "TOPLINE-P7-005"` while also leaving root and Phase 7 `currentTask: "TOPLINE-P7-004"`. A closed task cannot simultaneously be the active task, and P7-005 must not advance while P7-004 is blocked.

4. **Git evidence is inconsistent.**
   `git.lastCommit` remained `2d0009c`, even though the P7-004 implementation commit is `1f799ff` and a later governance commit is `ffb11fb`.

5. **Verification evidence is overstated.**
   Backend build passed during audit. The validation script passed, but it is not a meaningful implementation test. `npm run prisma:validate` failed in this audit environment because `DATABASE_URL` was not set, so database validation evidence needs to be documented with the actual environment used or rerun with the approved local configuration.

6. **Unrelated working tree change exists.**
   `WDR/_All/Governance/TOPLINE-GOV-AUTO-001_WDR_2026-09-08.md` has an unrelated uncommitted edit. It must be preserved or explicitly explained, but it is outside P7-004 scope.

## Scope Audit

No unauthorized payment, settlement, auth/RBAC, frontend API client, package, migration, vendor write, category write, product write, secret, or `shop.com` source usage was found in the P7-004 implementation commit.

## Required Correction

Corrective task: `TOPLINE-P7-004-R1` — Tenant Write API Evidence and Governance Reconciliation.

The correction must add real implementation-facing test evidence, reconcile governance state, and produce a revised WDR. Do not start P7-005.
