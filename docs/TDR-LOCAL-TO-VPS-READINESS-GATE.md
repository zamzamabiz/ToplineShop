# TDR Local-to-VPS Readiness Gate

Trade Data Refinery-Bushra — VPS Migration Exit Criteria v1.0  
Date: 2026-09-22  
Task: TDR-LOCAL-PRODUCTION-LIKE-VALIDATION-001

---

## Purpose

This document defines the evidence required before recommending VPS/production deployment.
No calendar deadline is set. Migration happens when the evidence gate is satisfied, not before.

**Current status: LOCAL PRODUCTION-LIKE VALIDATION IN PROGRESS**

---

## Gate Criteria

All items in the following table must be satisfied before a VPS migration is recommended.

### Mandatory (P0) — BLOCKED if not met

| # | Criterion | Evidence Required | Status |
|---|-----------|------------------|--------|
| P0-1 | Unresolved P0 defects | 0 unresolved P0s | ✓ (as of final readiness gate) |
| P0-2 | Unresolved P1 defects | 0 unresolved P1s | ✓ (as of final readiness gate) |
| P0-3 | Owner functional satisfaction | Owner declares acceptance | Pending |
| P0-4 | Stable real-data use | Stages 1–3 of validation plan completed | Pending |
| P0-5 | Repeatable local backup | Documented + most recent backup < 7 days old | Partial (runbook complete, drill PASS) |
| P0-6 | Successful local restore drill | Full restore drill passed, counts verified | ✓ (2026-09-22, 112 KB dump, 24 tables, 62 records) |
| P0-7 | Restart recovery proven | System restores correctly after process restart | Pending (smoke Stage 8) |
| P0-8 | File durability proven | Original source files survive restart | Pending (smoke Stage 8) |
| P0-9 | Source integrity verified | contentHash matches actual SHA-256 for sampled files | ✓ (verified 4/4 in final readiness gate) |
| P0-10 | Authentication security | Strong JWT secrets in backend/.env | Pending (still CHANGE_ME_DEV_ONLY) |
| P0-11 | No open security regression | Security audit clean | ✓ (final readiness gate) |

### Required (P1) — deployment with documented constraint if not met

| # | Criterion | Evidence Required | Status |
|---|-----------|------------------|--------|
| P1-1 | Acceptable import/export behavior | Real-data exports verified correct | Pending Stage 1 |
| P1-2 | Performance measurements collected | Stage 3 measurements filled in | Pending |
| P1-3 | DB/storage growth rate measured | Stage 3 growth data | Pending |
| P1-4 | Expected VPS capacity estimable | Storage + CPU + memory measurements | Pending |
| P1-5 | Operational logs understandable | Owner can identify failures from logs | Pending (runbook created) |
| P1-6 | Failed job recovery tested | At least one controlled restart/recovery verified | Pending |
| P1-7 | Analytics correctness verified | Owner confirms analytics match expected trade data | Pending Stage 2 |

### Owner Decisions Required (before VPS migration begins)

| # | Decision | Options |
|---|----------|---------|
| O1 | Hosting provider / model | VPS provider, managed container platform |
| O2 | Production domain name | Chosen domain |
| O3 | Managed PostgreSQL provider | Neon, Supabase, RDS, Railway, self-hosted |
| O4 | Persistent file storage | Mounted volume on VPS, S3-compatible |
| O5 | Budget / subscription commitment | Owner approval |

### Known P2 Constraints (documented, do not block migration)

| # | Constraint | Notes |
|---|------------|-------|
| P2-1 | Upload malware scanning NOT IMPLEMENTED | Only for controlled trusted-user deployment |
| P2-2 | Live S3 ingestion NOT ENABLED | Local adapter on mounted volume for first VPS deployment |
| P2-3 | Full production restore SLA NOT PROVEN | Local drill PASS; production SLA requires production DR drill |

---

## What the Gate Produces

When all P0 items are satisfied and the owner makes the O1–O5 decisions:

```
OWNER DECISION: VPS + DOMAIN + MANAGED PG + STORAGE
      ↓
VPS PROVISIONING (external infrastructure decision)
      ↓
CONTROLLED DEPLOYMENT (deploy to VPS, run migrations)
      ↓
PRODUCTION SMOKE (TDR-PRODUCTION-SMOKE-CHECKLIST.md)
      ↓
PRODUCTION ACCEPTANCE (owner live-data sign-off)
      ↓
ONLINE GO-LIVE
```

**Do NOT start these steps until the gate above is satisfied.**

---

## How to Use This Gate

At the end of each validation stage, revisit this gate and update the Status column.
When all P0 rows show ✓ and the owner has made the O1–O5 decisions, open a
PM-authorized task for VPS deployment.

This gate should be reviewed at minimum:
- After Stage 1 completion
- After Stage 3 completion
- After 1 month of sustained use
- Any time a significant defect is found

---

## Not in Scope for This Gate

- Kubernetes / service mesh
- Multi-region
- Redis / BullMQ
- Kafka
- Warehouse / data lake
- Malware scanning vendor selection
- Phase 7 features

These are future governed decisions, not prerequisites for initial VPS deployment.
