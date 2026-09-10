# #MM — TOPLINE-P7-010 — Phase 7 Freeze Gate

You are approved to execute exactly one governed task:

TOPLINE-P7-010 — Phase 7 Freeze Gate

Follow #123:
DISCUSS → DECIDE → EXECUTE → VERIFY/AUDIT → CLOSE → NEXT

This is an audit and freeze task. Do not implement new product features.

Read only these files first:
- AGENTS.md
- docs/HAIKU_EXECUTION_PROTOCOL.md
- docs/PROJECT_CONSTITUTION.md
- docs/PHASE-07-BACKEND-API-READINESS-PLAN.md
- src/project/projectRegistry.ts
- AGENT_REPORTS/latest-status.md
- AGENT_REPORTS/latest-wdr-summary.md
- PM_OUTBOX/next-opencode-prompt.md
- Phase 7 WDR and audit files under WDR/_All/Phase-07-Backend-API-Foundation/
- backend/package.json
- package.json

Current governance state:

P7-009 and P7-009-R1 are PASS / CLOSED by PM audit.

Objective:

Perform the Phase 7 Freeze Gate audit. Verify that all Phase 7 tasks are complete, internally consistent, safely scoped, documented, buildable, and ready to freeze before Phase 8.

Required audit scope:

1. Verify every Phase 7 task from P7-001 through P7-009, including corrective R tasks, has:
   - WDR present
   - PM audit present where required
   - exact implementation/governance commit hashes
   - registry task state consistent with reports

2. Verify the Phase 7 task sequence is complete:
   - P7-001 Readiness Plan
   - P7-002 Error Handling + Validation Foundation and corrections
   - P7-003 Observability + Logging Foundation and corrections
   - P7-004 Tenant Write API and corrections
   - P7-005 Vendor Write API
   - P7-006 Category Write API
   - P7-007 Product Write API
   - P7-008 Testing Foundation and correction
   - P7-009 Frontend API Client Write Methods and correction

3. Verify implementation scope safety:
   - no auth/RBAC implementation
   - no payment/settlement implementation
   - no migrations or destructive database operations
   - no infrastructure/deployment work
   - no secrets
   - no shop.com involvement
   - no unauthorized frontend UI/page changes beyond approved P7-009 client files

4. Verify code health:
   - npm run build from project root
   - npm run lint from project root
   - npm run build from backend
   - npm test from backend
   - relevant existing backend evidence scripts if needed for confidence
   - git diff --check
   - git status --short --untracked-files=all

5. Verify dashboard source:
   - src/project/projectRegistry.ts reflects current Phase 7 state
   - project-management page should update from registry data
   - currentTask should be null after freeze gate completion
   - lastCompletedTask should become TOPLINE-P7-010 after freeze gate
   - nextPlannedTask should point to the next governed phase/task only if clearly defined in the registry or plan; otherwise set to a safe PM-planned placeholder

6. Write WDR:
   WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-010_WDR_2026-09-10.md

Strict out of scope:

- Do not implement Phase 8.
- Do not start auth/RBAC.
- Do not add backend endpoints.
- Do not add frontend UI features.
- Do not change business behavior.
- Do not add packages.
- Do not run migrations or destructive database commands.
- Do not modify secrets or environment files.
- Do not touch F:\OpenCode\shop.com.

Allowed changes:

- Governance/report/registry updates required for freeze gate.
- Freeze-gate WDR.
- Minimal documentation needed to record the freeze decision.
- No product implementation changes unless verification exposes a blocking governance-only issue that cannot be documented otherwise.

Verification required:

Run and report:
- npm run build from project root
- npm run lint from project root
- npm run build from backend
- npm test from backend
- git diff --check
- git status --short --untracked-files=all

Git rules:

- Preserve unrelated user changes.
- Never use git add .
- Never use git add -A
- Never use git add --all
- Stage exact files only.
- Commit the freeze gate and report exact commit hash.

Final response format:

TASK:
STATUS:
WDR:
COMMIT:
FILES CHANGED:
VERIFICATION:
STOPPED BEFORE NEXT TASK: YES
