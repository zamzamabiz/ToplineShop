# Parallel Team Handoff

## Assignment

- Module: TLS Trade Refinery.
- Team member: pending owner assignment.
- Branch: `codex/trade-refinery-foundation`.
- Initial authorized task: read and refine MP-00 planning documents.
- Implementation status: not started; frontend freeze pending.
- GitHub publication: pending the main governance push approval (`pushAllowed: false` at preparation).

The active workspace used to prepare this handoff is `E:\ToplineShop`. Root AGENTS.md names a different historical root. The main PM must confirm the intended implementation root before team coding. Do not access the excluded legacy shop.com project.

## First Prompt for the Team

Read STRATEGIC-CHARTER.md and the current approved TLS architecture handoff. Prepare MP-00: release scope, mapping uncertainties, module ownership, interface contracts, acceptance criteria, decision register, and next frontend prompt. Preserve #FDD and #123. Do not implement backend, modify shared files, or treat this planning branch as frontend-freeze approval. Report concise changes and unresolved decisions with evidence. Do not copy full datasets or credentials into Git or agent messages.

## Coordination

Use a separate checkout on the assigned laptop. Confirm remote branch availability before checkout; a locally prepared branch is not yet available to another laptop. Once approved and published, base module work on this branch. Do not merge into master without central review.

Keep commits scoped to approved files and stage exact paths. Preserve other teams' changes. Agree application source paths before coding; this documentation folder is not an approved runtime architecture.

Daily handoff: task ID, charter version, changed paths, real commit hash, checks and evidence, FDD gate, blockers, and next action. The canonical registry remains the main team's responsibility until explicit delegation. Suggested future WDR location: `WDR/_All/Phase-Trade-Refinery/`, subject to PM confirmation.

## Preparation Verification

This package creates documentation only. It does not install dependencies, import data, change registry status, alter the main application's source, or approve a deployment. Verify the branch contains only this documentation delta before publication.
