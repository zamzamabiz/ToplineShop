# ERP64 Execution Roadmap

## Current Control State

- Stage A is active under the existing ToplineShop P0-P10 plan.
- The canonical registry currently reports Phase 8 and no active implementation task.
- This ERP64 package is planning-only and does not amend P8.
- Remote publication remains blocked while the registry has `pushAllowed: false`.

## Gate A - Foundation Freeze

Owner: existing ToplineShop governance.

Required result: complete P8, P9, P10, corrective chains, blockers, audits, and owner decisions; record Foundation v1 freeze.

Forbidden expansion: ERP64 renaming, mass folder movement, new module backend work, or shared-platform redesign outside an approved corrective task.

## Gate B0 - ERP64 Platform Contract

Task ID: `ERP64-PLATFORM-00`

Produce and approve:

- Brand relationship between ERP64 and ToplineShop
- Master dashboard and module launcher
- Module manifest and registry contract
- Tenant, entitlement, permission, and subscription boundaries
- Shared service and module interface rules
- Custom-domain model
- Repository root resolution
- GitHub protection and review policy
- ChatGPT task map and team ownership

Exit: owner-approved contract and an implementation roadmap that does not disturb Stage A.

## Gate B1 - Trade Intelligence Frontend

Task ID: `ERP64-DR-MP01`

Design the complete first workflow with realistic fixtures: source registration, upload, mapping, quality review, publication, paginated search, lineage, five dashboards, controlled export, and CRM opportunity review.

Exit: visual evidence, owner approval, and frontend freeze.

## Gate B2 - Trade Intelligence Pilot

Task ID: `ERP64-DR-MP02`

Implement the approved vertical workflow for one source file. Prove row reconciliation, retry safety, tenant controls, lineage, and agreed response times.

Exit: working internal pilot and WDR evidence.

## Gate B3 - Multi-File and CRM Handoff

Task ID: `ERP64-DR-MP03`

Process the available files through versioned mappings, validate representative 10-million-record performance, and hand reviewed opportunities to CRM through a stable contract.

Exit: recoverable multi-file processing, measured benchmark, and repeat-safe CRM handoff.

## Later Module Cycle

Each later module repeats: charter -> workflow map -> FDD prototype -> owner freeze -> bounded implementation -> integration -> audit -> release.

Detailed priority after the Trade pilot is an owner decision. The current provisional sequence is CRM, Order Booker, Delivery, FMCG Distribution, Commodity Operations, and broader ERP Analytics.

## Stage C Gates

Before global commercialization, approve and verify subscriptions, usage metering, custom domains, tenant isolation, support, legal/data rights, recovery, localization, and production operations. Validate advertised data capacity on declared hardware. Add standalone deployment only after a module passes its commercial eligibility gate.

## Work-In-Progress Limit

- One active shared-platform implementation stream.
- One active business-module implementation stream.
- One additional module may be in discovery/FDD design.
- All other modules remain in the portfolio backlog.
