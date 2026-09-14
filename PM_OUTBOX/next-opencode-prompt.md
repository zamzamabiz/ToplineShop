# Next OpenCode Execution Prompt

## PM/CTO Decision Needed

**Audit TOPLINE-P8-001-R23**

R23 execution is complete and awaits PM/owner audit. R23 was governance-only and filled the real R22 evidence-fill Commit B hash into the claimed evidence locations. No P8-002 implementation is authorized.

## R23 Evidence

- R23 WDR: WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001-R23_WDR_2026-09-15.md
- R22 implementation Commit A preserved: a13cb04b13a1c81877aa15e5d070fc2b39e9d82d
- R22 evidence-fill Commit B filled: bd398f270a781be54e40e51e2832ea46c874a84f
- R22 PM-audit Commit A: 5a91bd7a8587aff9ceda497749760ef7efbfdbc9
- R22 PM-audit evidence-fill Commit B: e0e00864e9eb2f1c20c50cc3f9395058e9517168
- Canonical registry: src/project/projectRegistry.ts
- Reports: AGENT_REPORTS/latest-status.md, AGENT_REPORTS/latest-wdr-summary.md

## Required Audit Checks

1. Confirm the R22 WDR Git Evidence section records bd398f270a781be54e40e51e2832ea46c874a84f.
2. Confirm both latest reports and this PM outbox record bd398f270a781be54e40e51e2832ea46c874a84f.
3. Confirm registry git.lastCommit records bd398f270a781be54e40e51e2832ea46c874a84f.
4. Confirm the R22 task commitHash and wdr-087.commitHash still preserve R22 Commit A a13cb04b13a1c81877aa15e5d070fc2b39e9d82d.
5. Confirm TOPLINE-P8-001-R23 and wdr-088 are PASS / PM audit PLANNED.
6. Confirm P8-002 remains proposed, unregistered, and unapproved.

## Stop Before P8-002

Do not paste, prepare, or execute any P8-002 implementation prompt until the R23 PM audit is complete and owner approval is explicit.
