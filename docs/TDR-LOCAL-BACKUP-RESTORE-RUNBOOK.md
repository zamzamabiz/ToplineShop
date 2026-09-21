# TDR Local Backup & Restore Runbook

Trade Data Refinery-Bushra — Local Backup and Recovery Reference v1.0  
Date: 2026-09-22  
Task: TDR-LOCAL-PRODUCTION-LIKE-VALIDATION-001

---

## Overview

This runbook covers local backup and restore procedures for TDR.
It supersedes the production-oriented `TDR-BACKUP-RESTORE-RUNBOOK.md` for
the local validation phase.

A valid TDR restore requires BOTH:
1. A PostgreSQL database backup (metadata: source files, batches, records, exports)
2. A file storage backup (binary files: source uploads, export artifacts)

---

## Local PostgreSQL Configuration

| Item | Value |
|------|-------|
| Host | localhost |
| Port | 5433 |
| Database | toplineshop_dev |
| User | postgres |
| pg_dump binary | `C:\Program Files\PostgreSQL\18\bin\pg_dump.exe` |
| pg_restore binary | `C:\Program Files\PostgreSQL\18\bin\pg_restore.exe` |
| psql binary | `C:\Program Files\PostgreSQL\18\bin\psql.exe` |

**Credentials:** Read `DATABASE_URL` from `backend/.env`. Never commit passwords.

---

## Part 1 — Database Backup

### 1.1 Quick Backup (recommended daily)

```powershell
# Set password from .env (replace with your actual password)
$env:PGPASSWORD = "YOUR_DB_PASSWORD"

$backupDir = "C:\Users\$env:USERNAME\Documents\TDR-Backups"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
$backupFile = Join-Path $backupDir "tdr-full-$(Get-Date -Format 'yyyyMMdd-HHmmss').dump"

& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" `
    -h localhost -p 5433 -U postgres `
    -F c -f $backupFile `
    toplineshop_dev

$env:PGPASSWORD = ""

Write-Output "Backup: $backupFile"
Write-Output "Size:   $((Get-Item $backupFile).Length) bytes"
```

Expected output: `Size: <non-zero>` (current backup size: ~112 KB with sample data).

### 1.2 Verify Backup

```powershell
# Check size is non-zero
(Get-Item "C:\Users\$env:USERNAME\Documents\TDR-Backups\tdr-full-YYYYMMDD-HHMMSS.dump").Length

# List tables in the backup (dry run, no restore)
$env:PGPASSWORD = "YOUR_DB_PASSWORD"
& "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" -l `
    "C:\Users\$env:USERNAME\Documents\TDR-Backups\tdr-full-YYYYMMDD-HHMMSS.dump" `
    | Select-String "TABLE DATA"
$env:PGPASSWORD = ""
```

---

## Part 2 — File Storage Backup

Source files and export artifacts live outside the database.

### 2.1 Copy Storage to Backup Location

```powershell
$backupDir = "C:\Users\$env:USERNAME\Documents\TDR-Backups"
$storageBackup = Join-Path $backupDir "tdr-storage-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Robocopy preserves all metadata
robocopy "D:\ToplineShopData\TDR" $storageBackup /E /COPYALL /LOG:"$backupDir\storage-backup.log"

Write-Output "Storage backup: $storageBackup"
Write-Output "File count: $((Get-ChildItem $storageBackup -Recurse -File).Count)"
```

### 2.2 Verify Storage Backup

```powershell
# Count files in original vs backup
$original = (Get-ChildItem "D:\ToplineShopData\TDR" -Recurse -File).Count
$backup   = (Get-ChildItem $storageBackup -Recurse -File).Count
Write-Output "Original files: $original  |  Backup files: $backup"
# Expected: equal
```

---

## Part 3 — Restore Drill (Proven 2026-09-22)

**This drill MUST be performed against a separate test database.**
**NEVER restore over the working `toplineshop_dev` database.**

### 3.1 Create Test Database and Restore

```powershell
$backupFile = "C:\Users\$env:USERNAME\Documents\TDR-Backups\tdr-full-YYYYMMDD-HHMMSS.dump"
$testDb = "toplineshop_restore_test"

$env:PGPASSWORD = "YOUR_DB_PASSWORD"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$pgrestore = "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe"

# Drop test DB if it exists from a prior drill
& $psql -h localhost -p 5433 -U postgres -c "DROP DATABASE IF EXISTS $testDb;"

# Create clean test DB
& $psql -h localhost -p 5433 -U postgres -c "CREATE DATABASE $testDb;"

# Restore
& $pgrestore -h localhost -p 5433 -U postgres -d $testDb -F c $backupFile

# Verify schema (should show 24 tables)
& $psql -h localhost -p 5433 -U postgres -d $testDb `
    -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public';"

# Verify representative counts
& $psql -h localhost -p 5433 -U postgres -d $testDb `
    -c "SELECT 'tdr_source_files' AS tbl, COUNT(*)::int AS cnt FROM tdr_source_files
        UNION ALL SELECT 'tdr_batches', COUNT(*)::int FROM tdr_batches
        UNION ALL SELECT 'tdr_records', COUNT(*)::int FROM tdr_records;"

$env:PGPASSWORD = ""
```

### 3.2 Cleanup Test Database

```powershell
$env:PGPASSWORD = "YOUR_DB_PASSWORD"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" `
    -h localhost -p 5433 -U postgres `
    -c "DROP DATABASE toplineshop_restore_test;"
$env:PGPASSWORD = ""
Write-Output "Test DB dropped."
```

### 3.3 Restore Drill Results (2026-09-22)

Performed as part of TDR-LOCAL-PRODUCTION-LIKE-VALIDATION-001:

| Item | Result |
|------|--------|
| Backup size | 112,340 bytes (full custom format) |
| Restore target | `toplineshop_restore_test` (separate, never over working DB) |
| Schema verification | 24/24 tables restored |
| tdr_source_files | 4 (matches source) |
| tdr_batches | 4 (matches source) |
| tdr_records | 62 (matches source) |
| tdr_export_jobs | 5 (matches source) |
| users | 1 (matches source) |
| tenants | 1 (matches source) |
| Test DB cleanup | Dropped successfully |
| **Verdict** | **PASS** |

---

## Part 4 — Emergency Restore (Working Database)

Only in case of corruption or data loss. This is DESTRUCTIVE.

```
STOP the TDR backend before proceeding.
This replaces all data in toplineshop_dev.
```

```powershell
$backupFile = "C:\Users\$env:USERNAME\Documents\TDR-Backups\tdr-full-YYYYMMDD-HHMMSS.dump"

$env:PGPASSWORD = "YOUR_DB_PASSWORD"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$pgrestore = "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe"

# Drop and recreate (IRREVERSIBLE)
& $psql -h localhost -p 5433 -U postgres -c "DROP DATABASE toplineshop_dev;"
& $psql -h localhost -p 5433 -U postgres -c "CREATE DATABASE toplineshop_dev;"

# Restore
& $pgrestore -h localhost -p 5433 -U postgres -d toplineshop_dev -F c $backupFile

# Run Prisma migrations to ensure schema is current
cd E:\ToplineShop\backend
npx prisma migrate deploy

$env:PGPASSWORD = ""

Write-Output "Restore complete. Restart the backend."
```

---

## Part 5 — Backup Schedule (Recommended)

| Backup Type | Frequency | Location |
|-------------|-----------|----------|
| DB full (custom format) | Before every significant upload session | `C:\Users\...\Documents\TDR-Backups\` |
| DB full | Weekly minimum | Same |
| Storage sync | Weekly minimum | `C:\Users\...\Documents\TDR-Backups\tdr-storage-YYYYMMDD\` |
| Pre-migration backup | Before any code update + migrate | Same |

---

## Part 6 — Security Notes

- Never put the database password in a script committed to git
- Store backups in a restricted directory (your user Documents folder is reasonable locally)
- Backup files contain real trade data — treat them with the same confidentiality as the live DB
- Consider encrypting backup files if they contain sensitive PII or customs data
