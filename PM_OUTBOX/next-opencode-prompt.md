# Next OpenCode Execution Prompt

## Status

**PM audit BLOCKED `TOPLINE-P7-010-R1`.**

`TOPLINE-P7-010-R1` fixed the original stale Phase 7 dashboard rollup,
but the governed corrective task itself was not added to
`src/project/projectRegistry.ts`. The registry is the source of truth,
so Phase 7 cannot be formally closed and Phase 8 must not start yet.

Audit file:
`WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-010-R1-AUDIT_2026-09-10.md`

Approved next corrective task:
`TOPLINE-P7-010-R2 — Phase 7 Corrective Registry Source-of-Truth Completion`

## Instructions for OpenCode

Paste the prompt below into Haiku/OpenCode. It authorizes exactly one
corrective governed task. Do not infer approval for Phase 8 or any later
task.

## PM Prompt

```text
#MM — TOPLINE-P7-010-R2 — Phase 7 Corrective Registry Source-of-Truth Completion

You are approved to execute exactly one corrective governed task:
TOPLINE-P7-010-R2 — Phase 7 Corrective Registry Source-of-Truth Completion.

Follow #123:
DISCUSS → DECIDE → EXECUTE → VERIFY/AUDIT → CLOSE → NEXT

Hard rules:
- Read AGENTS.md.
- Read docs/HAIKU_EXECUTION_PROTOCOL.md.
- Read docs/PROJECT_CONSTITUTION.md only if needed.
- Source of truth: src/project/projectRegistry.ts.
- F:\OpenCode\shop.com is strictly out of scope. Do not read, edit,
  copy, move, import from, or reference it except as forbidden scope.
- Preserve unrelated changes.
- Never use git add ., git add -A, or git add --all.
- Stage exact files only.
- Report exact real commit hashes.
- Do not start Phase 8.

Context:
- TOPLINE-P7-010 implementation passed, but its original PM audit was
  BLOCKED by stale Phase 7 rollup data.
- TOPLINE-P7-010-R1 fixed that visible dashboard rollup.
- PM audit of R1 is still BLOCKED because the governed corrective task
  TOPLINE-P7-010-R1 and its expected wdr-063 entry are missing from
  src/project/projectRegistry.ts.
- Audit file:
  WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-010-R1-AUDIT_2026-09-10.md
- R1 reconciliation commit:
  e5decfbf10b305b8604643943b8feae1d2e81c2f
- R1 evidence-fill commit:
  8a073419bacf7b073cedd5e5aa87d6c94bfecd17

Objective:
Reconcile the canonical registry so Phase 7 governance is complete and
auditable after the P7-010-R1 correction. This is governance/registry
work only.

Allowed scope:
- src/project/projectRegistry.ts
- AGENT_REPORTS/latest-status.md
- AGENT_REPORTS/latest-wdr-summary.md
- PM_OUTBOX/next-opencode-prompt.md
- WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-010-R2_WDR_2026-09-10.md

Required implementation:
1. Add a task entry for TOPLINE-P7-010-R1 to projectRegistry.tasks[].
   It must point to:
   WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-010-R1_WDR_2026-09-10.md
   Use status PASS, build PASS, tests PASS, dependency TOPLINE-P7-010,
   and commit hash e5decfb.
   Set pmApproval to BLOCKED to reflect the PM audit.

2. Add wdr-063 for TOPLINE-P7-010-R1 to projectRegistry.wdrs[].
   Use status PASS, date 2026-09-10, commitHash e5decfb, and
   pmAudit BLOCKED.

3. Add a task entry for TOPLINE-P7-010-R2 to projectRegistry.tasks[].
   Use status PASS after implementation, dependency TOPLINE-P7-010-R1,
   build PASS, tests PASS, pmApproval PLANNED, and the R2 WDR path.
   Fill its real commit hash after committing, using exact-file staging
   only.

4. Add wdr-064 for TOPLINE-P7-010-R2 to projectRegistry.wdrs[].
   Use status PASS, date 2026-09-10, pmAudit PLANNED, and fill its real
   commit hash after committing.

5. Update the phase-7 rollup counts to include the governed corrective
   tasks:
   - Keep status CLOSED
   - Keep progress 100
   - Keep megaPromptTarget 10
   - Keep megaPromptsCompleted 10
   - Keep frontendGate PASS
   - Keep backendGate PASS
   - Keep databaseGate NOT_STARTED
   - Keep testingGate PASS
   - Update taskCount and completedTaskCount to match the actual number
     of Phase 7 task entries after adding R1 and R2.

6. Keep TOPLINE-P7-010 and wdr-062 blocked/planned. Do not mark them
   PM-approved in this execution; PM will do that only after auditing
   R2.

7. Update AGENT_REPORTS/latest-status.md,
   AGENT_REPORTS/latest-wdr-summary.md, and
   PM_OUTBOX/next-opencode-prompt.md to say R2 is complete and awaiting
   PM audit.

8. Write the R2 WDR at:
   WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-010-R2_WDR_2026-09-10.md

Forbidden scope:
- No product code changes.
- No frontend page/component changes.
- No backend code changes.
- No package/dependency changes.
- No migrations, database writes, auth/RBAC, payment, settlement,
  infrastructure, deployment, secrets, or Phase 8 work.
- No F:\OpenCode\shop.com access.

Verification required:
- Targeted registry checks proving TOPLINE-P7-010-R1, wdr-063,
  TOPLINE-P7-010-R2, and wdr-064 exist.
- Targeted registry checks proving phase-7 rollup counts match actual
  Phase 7 task entries.
- git diff --check.
- npm run build from project root if registry edits affect TypeScript.
- npm run lint from project root if available.
- Preserve unrelated changes.

Final report format:
TASK:
STATUS:
WDR:
COMMIT:
FILES CHANGED:
VERIFICATION:
STOPPED BEFORE NEXT TASK: YES
```
