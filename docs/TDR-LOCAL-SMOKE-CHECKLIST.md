# TDR Local Smoke Checklist

Trade Data Refinery-Bushra — Owner Smoke Checklist v1.0  
Date: 2026-09-22  
Task: TDR-LOCAL-PRODUCTION-LIKE-VALIDATION-001

Run this after every startup. Use test/synthetic data for smoke; use real data for validation sessions.

---

## Before Starting

- [ ] PostgreSQL service is running (`Get-Service postgresql-x64-18`)
- [ ] Backend started: `npm run start:prod` in `E:\ToplineShop\backend`
- [ ] Frontend started: `npm run start` in `E:\ToplineShop`
- [ ] Health ready: `Invoke-WebRequest http://localhost:4000/health/ready`

---

## Phase 1 — Infrastructure

- [ ] `GET /health/live` → 200
- [ ] `GET /health/ready` → 200 with `"database":"available"`
- [ ] Browser opens `http://localhost:3000` → page loads

---

## Phase 2 — Authentication

- [ ] Login with valid credentials → dashboard loads
- [ ] Press F5 (page reload) → still logged in (session restored from cookie)
- [ ] Log out → redirected to login page
- [ ] Try to open a TDR page after logout → 401 or login redirect

---

## Phase 3 — TDR Upload and Processing

- [ ] Navigate to Upload page
- [ ] Upload a small test CSV file (use samples in `D:\ToplineShopData\TDR\samples\`)
- [ ] Batch appears in Batches list with status `PROCESSING`
- [ ] After a few seconds: batch status changes to `QUALITY_PENDING` or `PASS` or `REVIEW_REQUIRED`

---

## Phase 4 — Quality Review (if REVIEW_REQUIRED)

- [ ] Quarantine page shows flagged records for the batch
- [ ] Click a record → Quality Detail panel opens
- [ ] Review or correct a field
- [ ] Correction saved without error

---

## Phase 5 — Analytics

- [ ] Analytics page loads → overview stats visible
- [ ] Direction breakdown shows import/export split
- [ ] No error messages in the analytics panel

---

## Phase 6 — Export

- [ ] Navigate to Exports page
- [ ] Create an export job for the uploaded batch
- [ ] Export status changes from `PENDING` to `COMPLETED`
- [ ] Download the export CSV → file downloads with trade records

---

## Phase 7 — Source Lifecycle

- [ ] Source Files page shows the uploaded file
- [ ] Download Original → original file downloads correctly
- [ ] Archive the source file → status changes to archived
- [ ] Try to archive again → 409 Conflict (expected)
- [ ] Restore the file → no longer archived

---

## Phase 8 — Restart Durability

- [ ] Stop backend (Ctrl+C)
- [ ] Start backend again (`npm run start:prod`)
- [ ] Login again → dashboard loads
- [ ] Previously uploaded source file still visible → **data survived restart**
- [ ] Download Original → still works → **file storage persists across restart**

---

## Quick Failure Indicators

| Symptom | Likely Cause |
|---------|-------------|
| Login returns 401 immediately | JWT secrets are weak/placeholder AND app was updated |
| Upload returns 500 | Storage path `D:\ToplineShopData\TDR` not accessible |
| Batch stuck in PROCESSING | Backend worker may have crashed; check backend console |
| Export stuck in PENDING | Same; check backend console for errors |
| `/health/ready` returns 503 | PostgreSQL is not running or DB is unreachable |
| Frontend blank/error | Backend not started or NEXT_PUBLIC_API_URL mismatch |

---

## Pass Criteria

Smoke is complete when:
- Phases 1–3 pass without errors
- Phase 8 confirms data durability across restart
- No unexpected ERROR lines in the backend console during the test
