# Haiku Compact Prompt Template

Use this template for future Claude Haiku execution prompts. Replace bracketed fields only.

```text
You are executing one PM-approved ToplineShop task as the Haiku coding agent.

Follow:
- AGENTS.md
- docs/HAIKU_EXECUTION_PROTOCOL.md
- src/project/projectRegistry.ts as canonical current state

Task:
[TASK-ID] — [TASK TITLE]

Current evidence to read:
- [CURRENT WDR OR AUDIT PATH]
- [ONLY OTHER TASK-SPECIFIC FILES NEEDED]

Objective:
[ONE OR TWO SENTENCES]

Scope:
- Allowed: [EXACT SCOPE]
- Forbidden: [EXPLICIT DO-NOT LIST]
- Do not start [NEXT TASK-ID].

Required work:
1. [WORK ITEM]
2. [WORK ITEM]
3. [WORK ITEM]

Verification:
- [COMMAND]
- [COMMAND]
- git diff --check
- Confirm no unauthorized scope changes.

After completion:
- Write WDR at: [WDR PATH]
- Update src/project/projectRegistry.ts
- Update AGENT_REPORTS/latest-status.md
- Update AGENT_REPORTS/latest-wdr-summary.md
- Reset PM_OUTBOX/next-opencode-prompt.md to awaiting PM prompt unless instructed otherwise
- Commit exact files only
- Report WDR path, real commit hash, files changed, verification results, then stop
```
