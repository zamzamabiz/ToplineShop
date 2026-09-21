# TDR Local Operations Runbook

Trade Data Refinery-Bushra — Local Operations Reference v1.0  
Date: 2026-09-22  
Task: TDR-LOCAL-PRODUCTION-LIKE-VALIDATION-001

---

## Overview

This runbook is for the owner to start, stop, verify, and recover the TDR system
on a local Windows machine. All components run locally — no cloud services required.

**Important:** Always start backend before opening the browser. Always stop cleanly
before shutting down Windows.

---

## Prerequisites

Before using TDR for the first time:

- [ ] PostgreSQL 18 is installed and running on port 5433
- [ ] Node.js v22+ is installed (`node --version`)
- [ ] The repository is at `E:\ToplineShop`
- [ ] `backend/.env` has strong JWT secrets (not `CHANGE_ME_DEV_ONLY`)
- [ ] `D:\ToplineShopData\TDR\` directory exists
- [ ] Backend dependencies installed: `cd E:\ToplineShop\backend && npm ci`
- [ ] Frontend dependencies installed: `cd E:\ToplineShop && npm ci`
- [ ] Database migrations applied: `cd E:\ToplineShop\backend && npx prisma migrate deploy`

---

## 1. Start the System

Open **two PowerShell windows** side by side.

### Window 1 — Backend

```powershell
cd E:\ToplineShop\backend
npm run start:prod
```

Wait for the line:
```
ToplineShop backend is running on: http://localhost:4000
```

Then verify:
```powershell
# In a third window or after the above is running:
Invoke-WebRequest http://localhost:4000/health/live -UseBasicParsing | Select-Object -Expand Content
# Expected: {"status":"ok",...}
```

### Window 2 — Frontend

```powershell
cd E:\ToplineShop
npm run build   # only needed first time or after code changes
npm run start
```

Wait for the line:
```
Ready - started server on http://localhost:3000
```

### Open in Browser

Navigate to: `http://localhost:3000`

---

## 2. Verify the System is Running

Run these checks after startup:

```powershell
# Backend liveness
Invoke-WebRequest http://localhost:4000/health/live -UseBasicParsing | Select-Object -Expand Content

# Backend readiness (verifies DB connection)
Invoke-WebRequest http://localhost:4000/health/ready -UseBasicParsing | Select-Object -Expand Content

# Expected for /health/ready: {"status":"ok","checks":{"database":"available",...}}
```

If `/health/ready` shows `database: "unavailable"`:
- Check PostgreSQL is running: start PostgreSQL 18 service from Windows Services
- Check `DATABASE_URL` in `backend/.env` has the correct port (5433)

---

## 3. Stop the System

### Graceful Stop (Recommended)

In each PowerShell window running a service:
- Press `Ctrl+C` once
- Wait for the process to stop
- Do NOT close the window before the process exits cleanly

### Force Stop (if process is unresponsive)

```powershell
# Find and kill the Node processes
Get-Process -Name node | Stop-Process -Force
```

---

## 4. Restart the System

1. Stop backend (Ctrl+C in backend window)
2. Stop frontend (Ctrl+C in frontend window)
3. Wait 5 seconds
4. Start backend: `npm run start:prod`
5. Start frontend: `npm run start`
6. Verify health: `Invoke-WebRequest http://localhost:4000/health/ready`

---

## 5. Recovery After Windows Reboot

After a Windows restart:

1. **Start PostgreSQL** (if set to manual start):
   - Open Windows Services (`services.msc`)
   - Find `postgresql-x64-18`
   - Click Start

2. **Wait for PostgreSQL** to be fully started (10–15 seconds)

3. **Start backend** (PowerShell Window 1):
   ```powershell
   cd E:\ToplineShop\backend
   npm run start:prod
   ```

4. **Start frontend** (PowerShell Window 2):
   ```powershell
   cd E:\ToplineShop
   npm run start
   ```

5. **Verify**:
   ```powershell
   Invoke-WebRequest http://localhost:4000/health/ready -UseBasicParsing
   ```

6. Open browser at `http://localhost:3000` and log in.

---

## 6. How to Build (After Code Changes)

If the code has been updated:

```powershell
# Backend
cd E:\ToplineShop\backend
npm run build

# Frontend
cd E:\ToplineShop
npm run build
```

Then start normally with `npm run start:prod` (backend) and `npm run start` (frontend).

---

## 7. How to Identify Failures

### Backend did not start

Look for a FATAL error in the PowerShell window. Common causes:
- `JWT_ACCESS_SECRET is missing or uses a known weak placeholder` → Update `backend/.env`
- `DATABASE_URL is required` → Check `backend/.env`
- `EADDRINUSE :4000` → Another process is using port 4000; find and stop it

```powershell
# Check if port 4000 is in use
netstat -ano | Select-String ":4000"
```

### Database unavailable

```powershell
# Check PostgreSQL service
Get-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
# If status is not 'Running': Start-Service "postgresql-x64-18"
```

### Frontend cannot reach backend

- Verify backend is running: `Invoke-WebRequest http://localhost:4000/health/live`
- Check browser console for CORS errors
- Verify `NEXT_PUBLIC_API_URL=http://localhost:4000` in `.env.local`

### Upload fails

- Check `TDR_STORAGE_PATH` in `backend/.env` points to `D:\ToplineShopData\TDR`
- Verify the directory exists: `Test-Path "D:\ToplineShopData\TDR"`
- Check disk space: `Get-PSDrive D | Select-Object Used, Free`

---

## 8. Check Disk Space

```powershell
# Check D: drive space
Get-PSDrive D | Select-Object @{N='Used_GB';E={[math]::Round($_.Used/1GB,2)}}, @{N='Free_GB';E={[math]::Round($_.Free/1GB,2)}}

# Check TDR storage size
(Get-ChildItem "D:\ToplineShopData\TDR" -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
```

---

## 9. Take a Manual Backup

```powershell
# See docs/TDR-LOCAL-BACKUP-RESTORE-RUNBOOK.md for full procedure

# Quick DB backup (run from any directory)
$backupFile = "C:\Users\$env:USERNAME\Documents\tdr-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').dump"
$env:PGPASSWORD = "YOUR_DB_PASSWORD"  # replace
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -h localhost -p 5433 -U postgres -F c -f $backupFile toplineshop_dev
$env:PGPASSWORD = ""
Write-Output "Backup saved: $backupFile"
Write-Output "Size: $((Get-Item $backupFile).Length) bytes"
```

---

## 10. View Logs

Backend logs appear in the PowerShell window where it was started.

To capture logs to a file:
```powershell
cd E:\ToplineShop\backend
npm run start:prod 2>&1 | Tee-Object -FilePath "C:\Users\$env:USERNAME\Documents\tdr-backend.log"
```

To search logs for errors:
```powershell
# If logging to file
Select-String -Path "C:\Users\$env:USERNAME\Documents\tdr-backend.log" -Pattern "ERROR|FATAL"
```

---

## 11. Quick Health Check Script

Save this as `Invoke-TdrHealthCheck.ps1` and run it any time:

```powershell
try {
    $live = Invoke-WebRequest "http://localhost:4000/health/live" -UseBasicParsing -TimeoutSec 5
    $ready = Invoke-WebRequest "http://localhost:4000/health/ready" -UseBasicParsing -TimeoutSec 5
    Write-Host "BACKEND  LIVE:  OK" -ForegroundColor Green
    if ($ready.Content -match '"database":"available"') {
        Write-Host "BACKEND  READY: OK (DB connected)" -ForegroundColor Green
    } else {
        Write-Host "BACKEND  READY: WARNING - DB may be unavailable" -ForegroundColor Yellow
        Write-Host $ready.Content
    }
} catch {
    Write-Host "BACKEND: UNREACHABLE - start it with 'npm run start:prod'" -ForegroundColor Red
}

try {
    $frontend = Invoke-WebRequest "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    Write-Host "FRONTEND LIVE:  OK" -ForegroundColor Green
} catch {
    Write-Host "FRONTEND: UNREACHABLE - start it with 'npm run start'" -ForegroundColor Red
}
```

---

## Worker Instance Warning

**Always run exactly ONE backend instance at a time.**

The TDR ingestion engine, quality engine, and export engine are in-process.
Running two backend instances simultaneously will cause job processing conflicts.

If you accidentally started two backends:
1. Stop both with Ctrl+C
2. Wait 10 seconds
3. Start one backend only
