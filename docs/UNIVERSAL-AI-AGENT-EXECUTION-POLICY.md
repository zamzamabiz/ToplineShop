# Universal AI Agent Execution Policy
## ERP64 / Trade Data Refinery — Canonical Governance Document

**Version:** 1.0
**Adopted:** 2026-09-18
**Task ID:** ERP64-UNIVERSAL-AI-POLICY-ADOPTION-001
**Branch at adoption:** `codex/trade-data-refinery`
**HEAD at adoption:** `dd540a873766fc2d472e27a72ada404438ed0dc5`
**Status:** ACTIVE

---

## Mandatory Shorthand

| Code | Meaning |
|---|---|
| **#5** | Execution discipline and record integrity |
| **#123** | DISCUSS → DECIDE → EXECUTE → VERIFY/AUDIT → CLOSE → NEXT |
| **#TS** | Token-saving, concise execution |

These shorthands are preserved across all ERP64 tasks and all AI agents. Every governed task prompt must reference at minimum `#5`, `#123`, and `#TS`.

---

## 1. Applicability

This policy applies to:

- **ERP64 Trade Refinery-Bushra** — all tasks, phases, and modules
- **All current ERP64 modules**
- **All future ERP64 modules** regardless of when they are created
- **All AI execution agents**, including:
  - Codex
  - Claude Code
  - MiniMax
  - Any future AI agent acting on the ERP64 codebase

No agent is exempt. No module is exempt. No task is exempt.

---

## 2. Mandatory Task Contract

Every governed task must declare, before execution:

| Field | Requirement |
|---|---|
| Repository path | Exact absolute path (`E:\ToplineShop`) |
| Branch | Exact branch name |
| Current HEAD / baseline hash | Immutable verified hash |
| Task ID | Unique identifier |
| Task scope | Clear, bounded statement of what the task does and does not include |
| Authorized files | Explicit list — no wildcards |
| Prohibited files | Explicit list |
| Prohibited commands/actions | Explicit list |
| Verification gates | What must be confirmed before each phase proceeds |
| Closeout evidence | What constitutes completion — tests, builds, outputs |
| WDR path | Exact file path for the Work Done Report |
| Next safe task | Explicitly named — never inferred automatically |

### HEAD Mismatch Rule

If the actual HEAD at task start differs from the declared expected HEAD, the agent must immediately stop with:

```
BLOCKED — HEAD MISMATCH
```

No staging, editing, committing, or execution may proceed until the PM reconciles the repository state.

---

## 3. Record Integrity Rule

WDR claims, counts, hashes, PASS/FAIL values, and changed-file lists are **not trusted** until verified against repository state.

Verification must use direct command output:
- `git rev-parse HEAD` — for commit hashes
- `git status --short` — for working tree state
- `git show --name-only HEAD` — for committed file lists
- `npx tsc --noEmit` or equivalent — for parse/type integrity
- `npm test` or equivalent — for test pass/fail counts

**Repository state plus verified command output wins** over any WDR claim, summary, chat history, or agent memory when they disagree.

No next task may be authorized until:
1. The current task's verification gates all pass.
2. Record-integrity checks confirm that WDR claims match repository state.
3. A PM-authorized handoff (in a prompt or explicit instruction) names the next task.

---

## 4. Governance Protocol (#123)

```
DISCUSS → DECIDE → EXECUTE → VERIFY/AUDIT → CLOSE → NEXT
```

Every phase requires explicit gate passage before proceeding to the next:

| Phase | Gate |
|---|---|
| DISCUSS | Context read, blockers identified, conflicts surfaced |
| DECIDE | Authorized scope confirmed, forbidden actions listed |
| EXECUTE | Smallest necessary change, no scope creep |
| VERIFY/AUDIT | Command output confirms expected state |
| CLOSE | WDR written, verified (Test-Path + Get-Item), and registry updated |
| NEXT | Explicitly named by PM — never auto-authorized |

---

## 5. Staging and Commit Discipline

- **Never** use `git add .`, `git add -A`, or `git add --all`.
- Stage each file by explicit path only.
- Run `git diff --cached --name-only` after staging and compare against the authorized file list.
- A commit cannot contain its own hash — record the hash in the WDR after commit.
- Never push without explicit PM authorization.
- Never amend a published commit.
- Never reset, checkout, clean, or delete files without explicit PM authorization.

---

## 6. Credential and Environment Safety

- `backend/.env` must always be gitignored and never staged, committed, or exposed.
- `DATABASE_URL` and all credentials must never appear in chat output, WDRs, logs, or git diffs.
- ERP64 governance paths (`WDR/_All/ERP64-Governance/`, `docs/ERP64_GOVERNANCE/`, `scripts/`) remain excluded from staging and commits until PM explicitly authorizes their inclusion.
- `F:\OpenCode\shop.com` is **STRICTLY OUT OF SCOPE**.

---

## 7. Gate Protection

- **G1 (Frontend Freeze):** PASS — preserved. No frontend runtime changes without PM re-authorization.
- **G2 (Platform Readiness):** BLOCKED until P8-004, P8-005, and TDR-P2-001 through TDR-P2-005 pass governed verification.
- **P8-004 and all later implementation** remain blocked unless the current governed PM handoff explicitly authorizes them.
- **Policy adoption alone does not authorize P8-004.**

---

## 8. ERP64/TDR Governance Conventions

Policy adoption must preserve:

- ERP64/TDR registry conventions (`src/project/projectRegistry.ts` as source of truth)
- WDR conventions (path `WDR/_All/Phase-XX-Name/` or `WDR/_All/Trade-Data-Refinery/`)
- `AGENT_REPORTS/latest-status.md` and `AGENT_REPORTS/latest-wdr-summary.md` conventions
- Branch discipline (`codex/trade-data-refinery` for current work)
- Exact-file staging discipline (see §5)
- No-credential-exposure rules (see §6)
- No unauthorized runtime changes
- No unauthorized module creation

---

## 9. ERP64 Domain Appendix

The following domain-specific governance expectations apply to all ERP64 modules, including Trade Refinery-Bushra and all future modules.

### 9.1 Units

- Units must be declared explicitly before implementation begins.
- No silent unit conversion. Every conversion must be explicit, documented, and test-covered.
- Unit declarations must name: base unit, display unit, conversion factor, and precision.

### 9.2 Currencies and Exchange Rates

- Currency assumptions must be explicit in every task scope.
- Exchange-rate source, frequency of update, and effective date must be declared.
- No silent currency conversion. Multi-currency operations require PM-authorized scope.

### 9.3 Precision, Scale, and Rounding

- Precision, scale, and display rules must be specified before any numeric field implementation.
- Rounding mode (half-up, half-even, truncate, etc.) must be declared per field or domain.
- No silent precision loss or coercion.

### 9.4 Batches, Lots, and Tanks

- Batch, lot, and tank identifiers must be immutable once assigned, or changes must be fully auditable.
- Identifier format (prefix, length, sequence, checksum) must be declared before implementation.

### 9.5 Inventory Movements

- Every inventory movement record must preserve:
  - source entity and location
  - destination entity and location
  - quantity and unit
  - timestamp
  - actor (user ID or system process)
  - movement type
- Deletions are prohibited; corrections require audit trail entries.

### 9.6 Yield, Loss, and Variance

- Yield, loss, and variance formulas must be explicitly declared before implementation.
- Each formula must be traceable to a business rule and covered by automated tests.
- Tolerance ranges and alert thresholds must be declared.

### 9.7 Pricing and Tax

- Pricing rules must declare: jurisdiction, calculation basis, effective date, and rounding mode.
- Tax rules must declare: jurisdiction, rate source, effective date, inclusion/exclusion basis, and rounding mode.
- No silent pricing or tax assumption.

### 9.8 Approvals

- Every approval workflow must preserve:
  - approver identity
  - timestamp
  - scope of what was approved
  - decision (approve/reject/defer)
  - optional reason
- Approvals are immutable once recorded.

### 9.9 Audit Trails

- Audit trail entries must capture:
  - actor (user ID or system process)
  - action type
  - affected entity type and ID
  - before state (where applicable)
  - after state
  - timestamp
  - source system or request origin
- Audit trails are append-only. No deletion, no modification.

### 9.10 Imports

- Every import operation must preserve:
  - source file name and hash
  - row/record lineage (source row number or ID)
  - validation result (pass/fail/quarantine)
  - transformation history (field mappings applied)
  - actor and timestamp
- Import failures must be quarantined with full lineage, never silently discarded.

### 9.11 Exports

- Every export operation must preserve:
  - target system or destination
  - payload scope
  - timestamp
  - actor
  - destination status (delivered/pending/failed)
- Failed exports must be retryable with idempotency guarantees.

### 9.12 Integrations

- Every integration must define before implementation:
  - source system and target system
  - field mapping
  - idempotency key strategy
  - retry policy and back-off
  - failure handling and alerting
  - audit log format
- No undeclared external integration may be implemented without PM-authorized scope.

---

## 10. Compliance and Escalation

If an agent encounters a state that violates this policy (HEAD mismatch, unauthorized file staging, credential exposure, scope creep, missing WDR, etc.), the agent must:

1. Stop immediately.
2. Report the exact violation with evidence.
3. Not proceed until PM explicitly authorizes the corrective action.

No self-authorization of out-of-scope work. No silent workarounds. No scope expansion.

---

*This document is governed by #123. Changes require a PM-authorized governed task with a WDR.*
