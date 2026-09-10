# #MM — TOPLINE-P7-009-R1 — Frontend API Client Registry Reconciliation

You are approved to execute exactly one corrective governed task:

TOPLINE-P7-009-R1 — Frontend API Client Registry Reconciliation

Follow #123:
DISCUSS → DECIDE → EXECUTE → VERIFY/AUDIT → CLOSE → NEXT

Do not start TOPLINE-P7-010 or any later task.

Read only these files:
- AGENTS.md
- docs/HAIKU_EXECUTION_PROTOCOL.md
- src/project/projectRegistry.ts
- WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-009_WDR_2026-09-10.md
- WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-009-AUDIT_2026-09-10.md
- AGENT_REPORTS/latest-status.md
- AGENT_REPORTS/latest-wdr-summary.md
- PM_OUTBOX/next-opencode-prompt.md

Audit finding to correct:

P7-009 frontend API client implementation evidence passes, but PM audit is BLOCKED because src/project/projectRegistry.ts does not contain the required task-list entry:

id: "TOPLINE-P7-009"

The registry currently has root summary fields and wdr-060 for P7-009, but the actual TOPLINE-P7-009 task entry is missing. The WDR claimed it was added, but the repository does not contain it.

Required correction:

1. Add the missing TOPLINE-P7-009 task entry in src/project/projectRegistry.ts in the correct Phase 7 task-list position after TOPLINE-P7-008.

2. The entry must accurately describe:
   - title: Frontend API Client Write Methods
   - status: PASS
   - tests: PASS
   - build: PASS
   - ownerApproval: PLANNED
   - pmApproval: PLANNED
   - commitHash: 4646688
   - wdrPath: WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-009_WDR_2026-09-10.md
   - notes: mention Create*Request types, createTenant/createVendor/createCategory/createProduct, existing GET methods preserved, PATCH/DELETE deferred, build/lint passing, and no backend files modified.

3. Make root summary fields consistent:
   - currentTask: null
   - lastCompletedTask: TOPLINE-P7-009
   - nextPlannedTask: TOPLINE-P7-010

4. Keep wdr-060 present and consistent for TOPLINE-P7-009.

5. Update:
   - AGENT_REPORTS/latest-status.md
   - AGENT_REPORTS/latest-wdr-summary.md
   - PM_OUTBOX/next-opencode-prompt.md

6. Write corrected WDR:
   WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-009-R1_WDR_2026-09-10.md

Strict out of scope:

- Do not change frontend API client implementation unless verification exposes a real break.
- Do not modify backend files.
- Do not modify frontend pages/components.
- Do not start TOPLINE-P7-010.
- Do not implement Phase 7 Freeze Gate.
- Do not add packages.
- Do not modify migrations, auth/RBAC, payment, settlement, infrastructure, deployment, secrets, or business behavior.
- Do not touch F:\OpenCode\shop.com.

Verification required:

Run and report:
- npm run build from project root
- npm run lint from project root
- git diff --check
- git status --short --untracked-files=all
- targeted search proving id: "TOPLINE-P7-009" exists in src/project/projectRegistry.ts

Git rules:

- Preserve unrelated user changes.
- Never use git add .
- Never use git add -A
- Never use git add --all
- Stage exact files only.
- Commit the correction and report the exact commit hash.

Final response format:

TASK:
STATUS:
WDR:
COMMIT:
FILES CHANGED:
VERIFICATION:
STOPPED BEFORE NEXT TASK: YES
