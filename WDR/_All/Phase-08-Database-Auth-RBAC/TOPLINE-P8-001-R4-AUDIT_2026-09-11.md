# TOPLINE-P8-001-R4 Audit - Phase 8 Readiness Plan Canonical Contract Cleanup

## Decision

**Audit result: BLOCKED**

R4 corrected the R3 header, early package summary, and main inventory split,
but the complete plan still contains live ownership and implementation-state
contradictions. The plan is not yet safe to use as the authorization basis for
P8-002. No Phase 8 implementation is approved.

## Evidence Reviewed

- R4 WDR: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R4_WDR_2026-09-11.md`
- R3 audit: `WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R3-AUDIT_2026-09-11.md`
- Revised plan: `docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md`
- R4 implementation commit: `5e2b799249cccc5b6d4f1e0b8f2d05d165152ba1`
- R4 evidence-fill commit: `038f47a147fb61c4675646383799dccf5678de4a`
- Canonical registry, reports, PM outbox, and actual Git state

## Verification Performed

- Both R4 hashes resolve to the exact commits above.
- Commit A changed exactly the six allowed R4 files.
- Commit B changed five allowed files for evidence fill.
- Root build, root lint with five pre-existing warnings, backend build,
  backend tests 12/12, and diff checks are reported PASS in the R4 WDR.
- Actual working tree retains the modified unrelated governance WDR and
  untracked `.claude/settings.local.json`.
- Full-plan targeted inspection reproduced the findings below.

## Findings

1. **The architecture decision table still splits ownership.**
   The Phase 3 versus Phase 4 table says Session may be added in P8-002/003
   and roles may be added in P8-003/004. This contradicts the canonical task
   contract: P8-002 alone owns Session and auth persistence, P8-003 is
   schema/migration-free, and P8-004 alone owns RBAC persistence.

2. **The authority section still assigns RBAC guards to the auth task.**
   The live backend-authority text requires every write endpoint to run
   RolesGuard/PermissionsGuard and places AuthGuard, RolesGuard, and
   PermissionsGuard in one global order. P8-003 owns AuthGuard and write
   protection; P8-004 owns RBAC guards and RBAC enforcement. The sequence must
   state staged ownership without authorizing P8-003 to implement P8-004 early.

3. **Planned candidate is being confused with implemented state.**
   R4 removed planned models from the Absent section even though the actual
   repository still has no Session, passwordHash, audit-context, or RBAC
   models. Planned candidates remain absent until their future task executes.
   The inventory must say “absent today; planned candidate,” not imply R4
   created them.

4. **Live section labels and future paths remain stale.**
   The live prompt-budget table and bounded-scope heading still identify
   values and scope as R1, and future task rows retain old corrective WDR
   dates. Historical references are acceptable only when explicitly labeled
   historical; live current sections must identify R5 and must not reserve
   future task WDR dates.

5. **R4 evidence summaries overstate canonical consistency.**
   The R4 WDR says the architecture decision matrix, authority section, and
   verification sections all restate one contract, but findings 1 and 2 show
   live exceptions. It also claims the Absent section reflects the split
   while planned candidates were simply removed. R4 remains immutable; R5
   must record these overstatements.

6. **The primary R4 corrections remain valid and must be preserved.**
   The R4 header, package summary, main candidate/deferred split, exact
   Session verification, P8-003 migration stop condition, five-prompt count,
   future-WDR rule, safety controls, and preserved R1/R2/R3 decisions remain
   useful.

## Required Correction

Corrective task:
`TOPLINE-P8-001-R5 - Phase 8 Readiness Plan Ownership and State Reconciliation`

R5 is documentation/governance only. It must:

- Make every live architecture recommendation state that Session belongs only
  to P8-002, RBAC persistence/guards belong only to P8-004, and P8-003 has no
  schema, migration, or RBAC ownership.
- Rewrite the backend-authority section to describe staged enforcement:
  P8-003 AuthGuard/write protection first, then P8-004 RBAC guards and
  tenant/permission enforcement. Do not authorize either task early.
- Restore all planned-but-not-implemented models and columns to the “absent
  today” inventory, annotated with their planned owner.
- Update live section labels from R1 to R5/current contract and remove old
  future WDR dates from planned task paths unless explicitly historical.
- Preserve all valid R4 corrections and keep P8-002 unapproved.
- Keep P8-001 through R4 and wdr-065 through wdr-069 BLOCKED pending R5
  audit; complete R5 and wdr-070; stop before P8-002.

## Governance State

- P8-001 through R4 execution: PASS; PM approval BLOCKED.
- wdr-065 through wdr-069 PM audits: BLOCKED.
- Phase 8: BLOCKED.
- Next approved task: TOPLINE-P8-001-R5 only.

PM audit commit: `0f3ea0903943dd8489b8619f0aad1f2c315b936d`
