# TDR Local Real-Data Validation Plan

Trade Data Refinery-Bushra — Staged Real-Data Validation v1.0  
Date: 2026-09-22  
Task: TDR-LOCAL-PRODUCTION-LIKE-VALIDATION-001

---

## Purpose

This plan defines how the owner should progressively validate TDR using real shipment data.
The goal is to accumulate evidence that TDR behaves correctly with actual trade data before
committing to a VPS/production deployment.

**Do not load real trade data until Phase 1 smoke checklist passes with synthetic data.**

---

## Stage 0 — System Smoke (Prerequisite)

**What:** Smoke checklist with sample/synthetic data  
**When:** Before any real data is loaded  
**Objective:** Confirm the system starts, processes, and exports data end-to-end

Evidence to record:
- [ ] All 8 smoke phases passed
- [ ] Restart durability confirmed
- [ ] DB backup taken and verified

---

## Stage 1 — First Real Upload (Small Known Dataset)

**What:** 1–2 real monthly shipment files, small batch (≤ 5,000 records each)  
**When:** After Stage 0 passes  
**Objective:** Confirm mapping profiles, normalization, HS code handling, REVIEW_REQUIRED logic

Steps:
1. Take a pre-upload DB backup
2. Upload the first file (export or import — one direction at a time)
3. Wait for batch to complete processing
4. Record:
   - Status (PASS / REVIEW_REQUIRED / FAILED)
   - Record count
   - REVIEW_REQUIRED record count (expected if any data issues)
   - Processing time
5. If REVIEW_REQUIRED:
   - Open Quarantine
   - Review flagged records
   - Verify issue descriptions make sense for the data
   - Correct if appropriate
6. Run analytics → verify direction breakdown makes sense
7. Create export → download and verify CSV contents
8. Download Original → verify file matches uploaded original
9. Take post-upload storage size measurement

Evidence to record:

| Item | Value |
|------|-------|
| File name | |
| File size | |
| Record count (DB) | |
| REVIEW_REQUIRED count | |
| Processing time | |
| Export row count | |
| DB size before | |
| DB size after | |
| Storage size before | |
| Storage size after | |
| Any errors observed | |

---

## Stage 2 — Representative Monthly Dataset

**What:** 1–2 months of real import AND export data (both directions)  
**When:** After Stage 1 passes without blocking issues  
**Objective:** Validate both directions, mapping profiles, analytics coherence

Steps:
1. Backup
2. Upload import batch
3. Upload export batch
4. Wait for both to process
5. Analytics: verify import/export split is coherent with expected trade data
6. Run exports for both
7. Verify lineage (logicalDatasetId chain)
8. Test archive/restore on one source file
9. Measure: DB row counts, storage size, query latency on analytics page

Evidence to record:
- Both direction batches completed
- Analytics shows expected breakdown
- Archive/restore successful
- Export CSV contents match expectations

---

## Stage 3 — Multiple Batches / Multiple Months

**What:** 3–6 months of data  
**When:** After Stage 2 passes  
**Objective:** Validate accumulation behavior, analytics over time, storage growth

Focus:
- Do analytics pages load within acceptable time? (< 5 seconds is a reasonable initial target)
- Does DB size grow linearly?
- Does storage size grow predictably?
- Does ingestion speed remain consistent?
- Any FAILED batches? If so: investigate root cause

Record:
- Total record count in DB
- Total storage used (D: drive)
- Analytics page load time (subjective/stopwatch)
- Number of FAILED batches (should be 0)
- Number of corrections made

---

## Stage 4 — Versioning Validation

**What:** Upload replacement versions of existing source files  
**When:** After Stage 3 passes  
**Objective:** Validate version lineage, supersedes chain, original immutability

Steps:
1. Upload a replacement for a Stage 1 or Stage 2 file
2. Verify new batch is v2 with correct `versionNumber`
3. Verify logicalDatasetId links v1 and v2
4. Download both v1 original and v2 original → both intact
5. Analytics: note whether v1 data is still visible (design intent)

---

## Stage 5 — Sustained Long-Running Validation

**What:** Continued real-data ingestion over weeks to months  
**When:** After Stages 1–4 pass  
**Objective:** Accumulate evidence for VPS sizing and stability

Weekly activities:
- [ ] Upload new data (if available)
- [ ] Check batch status — no unexpected FAILED batches
- [ ] Check analytics — values make sense
- [ ] Check disk space on D: drive
- [ ] Take weekly DB backup and verify (not necessarily drill, just backup)
- [ ] Note any performance degradation on UI

Monthly activities:
- [ ] Full smoke checklist
- [ ] Backup + restore drill
- [ ] Record DB size, storage size, record count
- [ ] Note worst-case processing time for largest batch
- [ ] Update VPS sizing estimate

---

## Measurements to Collect (for VPS Sizing)

Record these after each stage so the owner has evidence for infrastructure sizing:

| Metric | Stage 1 | Stage 2 | Stage 3 | Stage 5 |
|--------|---------|---------|---------|---------|
| Total records in DB | | | | |
| DB size (MB) | | | | |
| Storage size (MB) | | | | |
| Largest batch size (records) | | | | |
| Largest batch processing time (sec) | | | | |
| Analytics page load time (sec) | | | | |
| Export generation time (sec) | | | | |
| Failed batches (count) | | | | |
| Review-required records (count) | | | | |

---

## Data Governance Reminders

| Rule | Status |
|------|--------|
| Original source files are immutable | Enforced by application |
| EDIT ORIGINAL FILE | NOT PERMITTED |
| SAVE BUTTON | NOT NEEDED |
| DOWNLOAD ORIGINAL | YES — RBAC governed |
| DELETE NOW | NOT PERMITTED |
| PERMANENT DELETE | Future governed retention process |
| UPLOAD NEW VERSION | YES — creates new sourceFileId + batch |
| HS codes are stored as TEXT | Enforced |
| blank != zero | Enforced |
| Decimal(24,6) for quantity/price | Enforced |

---

## Failure and Recovery During Real-Data Validation

If a batch fails (`status=FAILED`):
1. Note the batchId from the UI
2. Check backend console for error messages
3. Check Quarantine — may contain flagged records
4. Contact AI agent with task ID and error details

If storage is unavailable (e.g., D: drive not mounted):
1. Stop the backend
2. Verify D:\ToplineShopData\TDR\ is accessible
3. Restart backend
4. Batches in LEASED state will be reclaimed automatically on restart

---

## Stage Gate — when is local validation sufficient for VPS?

See `docs/TDR-LOCAL-TO-VPS-READINESS-GATE.md`
