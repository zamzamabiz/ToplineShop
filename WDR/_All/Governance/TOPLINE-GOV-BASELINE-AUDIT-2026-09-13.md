# TOPLINE-GOV-BASELINE-AUDIT-2026-09-13

## Task

- Protocol: `#123`
- Sequence: DISCUSS -> DECIDE -> EXECUTE -> VERIFY/AUDIT -> CLOSE -> NEXT
- Scope: repository safety and team-onboarding readiness
- Execution boundary: no application-code movement, branch deletion, database change, or ERP64 branch merge

## Baseline Evidence

| Check | Result |
|---|---|
| Laptop project root | `E:\ToplineShop` |
| Current checkout | `master` |
| Local master | `22cedfc28326195616b1a3c150b934ccf61b1b65` |
| GitHub master | `bd398f270a781be54e40e51e2832ea46c874a84f` |
| Working tree | Clean |
| Recovery tag | `baseline/master-2026-09-13` |
| Frontend lint | PASS; 5 image-optimization warnings |
| Frontend build | PASS |
| Backend build | PASS |
| Backend tests | PASS |
| Prisma validation | BLOCKED; `DATABASE_URL` is not configured |

## Findings

1. `master` is safe locally and must remain the stable baseline.
2. New module branches are isolated placeholders based on local master.
3. ERP64 and Trade Refinery documents exist on older dedicated branches, not on the new Data Intelligence branch.
4. The ERP64 and Trade Refinery branches have substantial history differences and must not be merged wholesale.
5. The canonical registry reports Phase 8 as `BLOCKED` and requires PM reconciliation before P8-002.
6. `AGENTS.md` names `F:\OpenCode\ToplineShop`, while the active project root is `E:\ToplineShop`.
7. GitHub branch protection and team permissions have not been verified from this environment.
8. Unreachable Git objects were observed; no cleanup or garbage collection is authorized.

## Approved Correction Order

1. Protect and reconcile the stable master line through a controlled pull request.
2. Correct the documented project-root inconsistency.
3. Perform the Phase 8 PM audit and reconcile registry, WDR, reports, and outbox evidence.
4. Selectively synchronize approved ERP64 and Trade Refinery documents into the Data Intelligence branch.
5. Issue Bushra's module contract and assign only `codex/erp64-data-intelligence`.
6. Complete #FDD visual proof and obtain owner approval before deep backend or data-refinery implementation.

## Stop Conditions

- Do not work directly on `master`.
- Do not merge the existing ERP64 branches as a whole.
- Do not delete branches or unreachable objects.
- Do not start independent team implementation while Phase 8 governance remains unresolved.
- Do not begin backend/database work before the module frontend freeze.

## Status

Baseline preserved. Governance corrections are planned and await the next approved #123 task.
