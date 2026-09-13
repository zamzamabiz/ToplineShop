# ERP64 Operating Model

## Authority

- Business Owner: final business, scope, brand, budget, package, and release decisions.
- Strategic PM/CTO role: maintains strategy, architecture direction, priorities, and routine audits. GPT-5.6 Sol is the preferred model, not a permanent dependency.
- Senior review role: reviews high-risk architecture, security, scale, and release decisions. GPT-6 Astra is preferred.
- Prompt coordinator: converts approved decisions into bounded prompts and handoffs. GPT Luna is preferred.
- Development teams and agents: implement approved tasks and produce evidence.
- Registry and WDR: official project status and evidence.

AI assists governance under the Business Owner's authority. It is not the legal owner, financial authority, or final commercial approver.

## Uniform Identifier

Every work item uses the same ID across ChatGPT, laptop folders, GitHub, WDR, registry, and review. Example: `ERP64-DR-MP01`.

## Laptop Structure

Use one authorized clone or worktree per developer. Keep one repository initially. Do not copy application folders between laptops. Synchronize through reviewed Git branches.

The present working path is `E:\ToplineShop`, while root governance text names `F:\OpenCode\ToplineShop`. Resolve this contradiction in `ERP64-PLATFORM-00` before onboarding another laptop.

Large datasets, credentials, private configuration, logs, and generated analytical storage must stay outside normal Git history.

## ChatGPT App Structure

Maintain one main governance task and create module tasks only when the module enters active discovery or implementation.

Recommended sections/tasks:

- ERP64 Main Governance
- Stage A Governance
- ERP64 Platform Architecture
- Active module task, initially Data Refinery when approved
- Next module discovery task, when capacity allows

Do not create empty tasks for every future module. Archive completed execution tasks after their WDR and decisions are linked from the main governance task.

## GitHub Structure

Retain the current stable branch during Stage A. Resolve `master` versus `main` after Foundation v1 freeze.

Use short-lived branches such as `codex/ERP64-DR-MP01-frontend` for AI-led work and an approved equivalent prefix for human teams. Do not commit directly to the stable branch. Require exact-file staging, scoped commits, review, checks, and real commit hashes.

Protect shared core ownership. A module team may not change identity, tenancy, billing, global design rules, integration contracts, or the canonical registry without explicit approval.

## WDR and Decision Flow

Every task records objective, approved scope, dependencies, changed paths, checks, evidence, decisions, blockers, real commit hash, FDD gate, status, and next prompt. Report deltas rather than repeating the master strategy.

The canonical registry remains authoritative. Planning documents cannot mark a task complete or permit a push independently.

## Daily Direction

1. Read the current compact context and latest WDR.
2. Select the next approved unblocked task.
3. Execute only the bounded scope.
4. Verify proportionately to risk.
5. Record evidence and decisions.
6. Prepare the next prompt or escalate a blocker.

## Token Control

Keep a compact context pack containing charter version, current task, contracts, decisions, blockers, evidence references, and next action. Routine handoffs should target about 1,500 tokens unless correctness requires more. Reference stable documents, summarize outputs, and avoid copying complete datasets or unchanged plans.
