# Next OpenCode Execution Prompt

## Status

**Phase 7 is PM-approved and closed.**

The Phase 7 freeze-gate corrective chain has passed:

- `TOPLINE-P7-010`
- `TOPLINE-P7-010-R1`
- `TOPLINE-P7-010-R2`

Audit file:
`WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-010-R2-AUDIT_2026-09-10.md`

Approved next governed task:
`TOPLINE-P8-001 — Phase 8 Database/Auth/RBAC Readiness Plan`

## Instructions for #MM

Paste the prompt below into MiniMax-M3. It authorizes exactly one
planning-only governed task. It does not authorize implementation.

## PM Prompt

```text
#MM — TOPLINE-P8-001 — Phase 8 Database/Auth/RBAC Readiness Plan

You are approved to execute exactly one governed task:
TOPLINE-P8-001 — Phase 8 Database/Auth/RBAC Readiness Plan.

Follow #123:
DISCUSS → DECIDE → EXECUTE → VERIFY/AUDIT → CLOSE → NEXT

Hard rules:
- Read AGENTS.md.
- Read docs/HAIKU_EXECUTION_PROTOCOL.md.
- Read docs/PROJECT_CONSTITUTION.md if needed.
- Read src/project/projectRegistry.ts as the source of truth.
- F:\OpenCode\shop.com is strictly out of scope. Do not read, edit,
  copy, move, import from, or reference it except as forbidden scope.
- Preserve unrelated changes.
- Never use git add ., git add -A, or git add --all.
- Stage exact files only.
- Report exact real commit hashes.

Task objective:
Create a Phase 8 readiness plan for Database, Authentication, RBAC, and
Security. This is planning/documentation/governance only. Do not
implement auth, sessions, RBAC guards, migrations, schema changes,
database writes, secrets, or backend behavior.

Context:
- Phase 7 Backend/API Foundation is closed and PM-approved.
- Phase 8 is currently planned in src/project/projectRegistry.ts:
  Database, Authentication, RBAC & Security.
- Existing reference docs may be read as needed:
  - docs/PHASE-03-AUTH-RBAC-DESIGN.md
  - docs/PHASE-03-DATABASE-SCHEMA-DESIGN.md
  - docs/PHASE-04-CORE-SCHEMA-FOUNDATION-DESIGN-LOCK.md
  - docs/PHASE-04-DATABASE-FOUNDATION-FREEZE-GATE.md
  - docs/PHASE-07-BACKEND-API-READINESS-PLAN.md

Allowed scope:
- docs/PHASE-08-DATABASE-AUTH-RBAC-READINESS-PLAN.md
- src/project/projectRegistry.ts
- AGENT_REPORTS/latest-status.md
- AGENT_REPORTS/latest-wdr-summary.md
- PM_OUTBOX/next-opencode-prompt.md
- WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001_WDR_2026-09-10.md

Required plan contents:
1. Phase 8 objective and boundaries.
2. Current inherited state from Phases 3, 4, 5, 6, and 7.
3. Database readiness review:
   - current Prisma/PostgreSQL state
   - what is already frozen
   - what must remain untouched until explicitly approved
4. Auth readiness review:
   - authentication principles
   - user/session/token design questions
   - secret and environment safety requirements
5. RBAC readiness review:
   - tenant-aware roles
   - backend-enforced permissions
   - admin/vendor/customer/owner boundaries
6. Security readiness:
   - password/session/token safety
   - audit logging expectations
   - no-secrets policy
   - destructive DB operation stop rules
7. Proposed Phase 8 task sequence starting at TOPLINE-P8-002.
8. Explicit forbidden scope for each proposed follow-up task.
9. Verification plan for later implementation tasks.
10. Stop conditions and PM approval gates.

Registry updates:
- Add TOPLINE-P8-001 to projectRegistry.tasks[].
- Set phase-8 status to IN_PROGRESS only if the readiness-plan task is
  completed.
- Set phase-8 currentTask to null after WDR completion.
- Keep database/auth/RBAC implementation gates PLANNED or NOT_STARTED as
  appropriate; do not falsely mark implementation PASS.
- Update root currentPhase/currentTask/lastCompletedTask/nextPlannedTask
  consistently after the WDR is written.
- Add a WDR entry for TOPLINE-P8-001.

Forbidden scope:
- No backend implementation.
- No Prisma schema edits.
- No migration creation or application.
- No database writes or destructive database actions.
- No auth/login/logout/session/JWT implementation.
- No RBAC middleware, guards, decorators, or permission checks.
- No frontend page/component changes.
- No package/dependency changes.
- No infrastructure/deployment changes.
- No secrets or credentials.
- No F:\OpenCode\shop.com access.

Verification required:
- Confirm the Phase 8 readiness plan exists and contains all required
  sections.
- Confirm registry has TOPLINE-P8-001 and its WDR entry.
- Confirm no forbidden files or scopes were touched.
- Run git diff --check.
- Run npm run build from project root if registry TypeScript changed.
- Run npm run lint from project root if available.

WDR:
Write the WDR at:
WDR/_All/Phase-08-Database-Auth-RBAC/TOPLINE-P8-001_WDR_2026-09-10.md

Commit:
- Stage exact files only.
- Do not use git add ., git add -A, or git add --all.
- Commit the allowed files only.
- Report the exact real commit hash.

Final report format:
TASK:
STATUS:
WDR:
COMMIT:
FILES CHANGED:
VERIFICATION:
STOPPED BEFORE NEXT TASK: YES
```
