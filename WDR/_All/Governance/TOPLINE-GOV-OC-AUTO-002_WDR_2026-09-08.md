# TOPLINE-GOV-OC-AUTO-002 — OpenCode Internal Automation Capability Discovery

## TASK

**ID**: TOPLINE-GOV-OC-AUTO-002  
**Title**: OpenCode Internal Automation Capability Discovery  
**Status**: PASS  
**Date**: 2026-09-08  
**Phase**: Governance

## OBJECTIVE

Discover whether OpenCode can run an internal automation/watch workflow that automatically reads `PM_OUTBOX/next-opencode-prompt.md`, executes a real PM prompt when present, writes WDR/AGENT_REPORTS, and stops after one governed task.

## PREFLIGHT

| Check | Result |
|-------|--------|
| Working directory | `E:\ToplineShop` |
| AGENTS.md | Read |
| PROJECT_CONSTITUTION.md | Read |
| PM_OUTBOX/next-opencode-prompt.md | Read |
| AGENT_REPORTS/latest-status.md | Read — P6-003 PASS / CLOSED |
| AGENT_REPORTS/latest-wdr-summary.md | Read — P6-003 PASS / CLOSED |

## DISCOVERY REPORT

### 1. Does OpenCode have built-in automation features?

**No.** OpenCode does not have:
- File watching or change detection
- Scheduled/cron runs
- Background task execution
- Auto-run when a prompt file changes
- Persistent background daemons

OpenCode is an **interactive CLI tool** designed to be invoked manually by a user or an external agent. Each session is stateless and terminates when the task is complete.

### 2. What exact setup steps are available inside OpenCode?

**None for automation.** OpenCode's capabilities are:
- Read/write/edit files
- Run bash commands
- Search codebase (glob, grep)
- Web fetch/search
- Task delegation (subagents)
- Todo tracking

These are all **session-scoped** — they only run while OpenCode is actively invoked.

### 3. Best safe alternative (if unsupported)

**Recommended: External scheduler + OpenCode CLI**

The safest semi-automatic workflow:

1. **External watcher** (ChatGPT/Codex or cron) writes PM prompt to `PM_OUTBOX/next-opencode-prompt.md`
2. **External scheduler** invokes OpenCode CLI with a standing instruction
3. **OpenCode** reads PM_OUTBOX, executes one task, writes WDR/AGENT_REPORTS, exits
4. **External watcher** checks AGENT_REPORTS for completion

**Implementation options:**
- **ChatGPT/Codex watcher** (current approach): Poll every 3 minutes, invoke OpenCode when prompt changes
- **Windows Task Scheduler**: Run OpenCode CLI on a timer
- **PowerShell script**: Watch file for changes, invoke OpenCode

### 4. Can OpenCode have a persistent standing instruction?

**Partially.** Options:

1. **AGENTS.md** (already exists): Contains project rules, but OpenCode doesn't auto-read it on startup without invocation
2. **opencode.json** (project config): Can set default agent, model, permissions — but no auto-execution
3. **Standing prompt pattern**: The PM_OUTBOX pattern works, but requires external invocation

**Recommended standing instruction for PM_OUTBOX:**
```
Read E:\ToplineShop\PM_OUTBOX\next-opencode-prompt.md
If status is "PM prompt ready", execute the PM Prompt.
If status is "Awaiting PM prompt", stop and report "Waiting for PM prompt."
After execution, write WDR and update AGENT_REPORTS.
Stop after one governed task.
```

### 5. Can OpenCode avoid re-running the same prompt?

**Yes, with external coordination.** Options:

1. **Task ID check**: Read PM_OUTBOX, extract task ID, check if WDR already exists for that task ID
2. **Status file check**: AGENT_REPORTS/latest-status.md shows last completed task — can compare
3. **PM_OUTBOX status field**: PM changes status from "PM prompt ready" to "Awaiting PM prompt" after execution

**Recommended duplicate-run prevention:**
- Before executing, check if `WDR/_All/**/TOPLINE-{TASK_ID}_WDR_*.md` already exists
- If exists, skip execution and report "Task already completed"
- PM should update PM_OUTBOX status after receiving AGENT_REPORTS

### 6. Risks of fully automatic execution

| Risk | Severity | Mitigation |
|------|----------|------------|
| Infinite loop (re-running same task) | HIGH | Task ID check + status file |
| Executing stale/wrong prompt | MEDIUM | PM updates status after each task |
| Race condition (two OpenCode instances) | MEDIUM | Lock file or single-scheduler |
| Destructive command execution | HIGH | Governance rules in AGENTS.md |
| Unintended scope expansion | MEDIUM | Strict PM_PROMPT parsing |
| Missing WDR/AGENT_REPORTS updates | LOW | Checklist in standing instruction |

## RECOMMENDED SETUP

### For ChatGPT/Codex + OpenCode bridge:

1. **PM writes prompt** to `PM_OUTBOX/next-opencode-prompt.md` with status "PM prompt ready"
2. **PM watcher** (every 3 min) checks AGENT_REPORTS for completion
3. **PM invokes OpenCode** with standing instruction to read PM_OUTBOX
4. **OpenCode executes** one task, writes WDR, updates AGENT_REPORTS
5. **PM reads AGENT_REPORTS**, updates PM_OUTBOX status, writes next prompt

### Standing instruction for OpenCode:
```
1. Read PM_OUTBOX/next-opencode-prompt.md
2. If status is "Awaiting PM prompt", stop and report
3. If status is "PM prompt ready", extract and execute PM Prompt
4. After execution, write WDR to appropriate folder
5. Update AGENT_REPORTS/latest-status.md and latest-wdr-summary.md
6. Stop after one governed task
```

### Duplicate-run prevention rule:
```
Before executing, glob for WDR files matching the task ID.
If found, report "Task {TASK_ID} already completed" and stop.
```

## FILES CHANGED

None. This was a discovery task only.

## CONFIRMATION

- TOPLINE-P6-004 was **NOT** started
- No frontend/backend code was edited
- No packages were added
- No scripts were created

## SELF-ASSESSMENT

**PASS**

Discovery complete. OpenCode does not have built-in automation. Recommended external scheduler + standing instruction pattern. No files changed.

## PM DECISION REQUIRED

- Approve TOPLINE-GOV-OC-AUTO-002 as PASS
- Decide whether to implement external automation (PowerShell script, Task Scheduler, etc.)
- Decide on standing instruction format for OpenCode
