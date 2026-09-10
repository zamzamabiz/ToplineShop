# #MM — TOPLINE-P7-010-R1 — Phase 7 Freeze Gate Dashboard Rollup Reconciliation

You are approved to execute exactly one corrective governed task:

TOPLINE-P7-010-R1 — Phase 7 Freeze Gate Dashboard Rollup Reconciliation

Follow #123:
DISCUSS → DECIDE → EXECUTE → VERIFY/AUDIT → CLOSE → NEXT

Do not start Phase 8 or any later task.

Read only these files:
- AGENTS.md
- docs/HAIKU_EXECUTION_PROTOCOL.md
- src/project/projectRegistry.ts
- src/app/project-management/page.tsx
- src/components/dashboard/DashboardCards.tsx
- WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-010_WDR_2026-09-10.md
- WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-010-AUDIT_2026-09-10.md
- AGENT_REPORTS/latest-status.md
- AGENT_REPORTS/latest-wdr-summary.md
- PM_OUTBOX/next-opencode-prompt.md

Audit finding to correct:

P7-010 freeze-gate verification evidence passes, but PM audit is BLOCKED because the `phase-7` rollup in `src/project/projectRegistry.ts` is stale. The `/project-management` page renders the Project Phases card from this rollup, so the dashboard will not fully auto-update to show Phase 7 as frozen.

Current stale values include:
- status: IN_PROGRESS
- progress: 40
- megaPromptTarget: 4
- megaPromptsCompleted: 0
- backendGate: IN_PROGRESS
- testingGate: NOT_STARTED
- taskCount: 10
- completedTaskCount: 4

Required correction:

1. Update only the `phase-7` rollup in `src/project/projectRegistry.ts` so it accurately reflects the frozen Phase 7 state:
   - status: CLOSED
   - progress: 100
   - megaPromptTarget: 10
   - megaPromptsCompleted: 10
   - frontendGate: PASS
   - backendGate: PASS
   - testingGate: PASS
   - currentTask: null
   - taskCount: 17
   - completedTaskCount: 17

2. Restore root summary fields to the freeze-gate state:
   - currentTask: null
   - lastCompletedTask: TOPLINE-P7-010
   - nextPlannedTask: Phase 8 — DB/Auth/RBAC (PM to define first task)

3. Keep the P7-010 task entry and wdr-062 present and consistent.

4. Update:
   - AGENT_REPORTS/latest-status.md
   - AGENT_REPORTS/latest-wdr-summary.md
   - PM_OUTBOX/next-opencode-prompt.md

5. Write corrected WDR:
   WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-010-R1_WDR_2026-09-10.md

Strict out of scope:

- Do not change product code.
- Do not modify backend files.
- Do not modify frontend pages/components.
- Do not start Phase 8.
- Do not implement auth/RBAC.
- Do not add packages.
- Do not run migrations or destructive database commands.
- Do not touch F:\OpenCode\shop.com.

Verification required:

Run and report:
- npm run build from project root
- npm run lint from project root
- npm run build from backend
- npm test from backend
- git diff --check
- git status --short --untracked-files=all
- targeted search proving the `phase-7` rollup now shows CLOSED, 100 progress, and 17/17 tasks

Git rules:

- Preserve unrelated user changes.
- Never use git add .
- Never use git add -A
- Never use git add --all
- Stage exact files only.
- Commit the correction and report exact commit hash.

Final response format:

TASK:
STATUS:
WDR:
COMMIT:
FILES CHANGED:
VERIFICATION:
STOPPED BEFORE NEXT TASK: YES
