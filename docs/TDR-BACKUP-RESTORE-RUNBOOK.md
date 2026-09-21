# TDR Backup & Restore Runbook

Trade Data Refinery-Bushra — Backup and Recovery v1.0  
Date: 2026-09-22

---

## Environment Requirements

- **pg_dump / pg_restore**: PostgreSQL 18.x (match server version). pg_dump 17.x rejects a 18.x server.
- **Backup location**: outside git staging area; not committed to repo.
- **Credentials**: never logged; use env vars (`PGPASSWORD` or `.pgpass`).

---

## Part 1 — PostgreSQL Backup

### 1.1 Schema-Only Backup (safe, non-destructive)

```powershell
$env:PGPASSWORD = "your-password"
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" `
    -h localhost -p 5432 -U topline_user `
    --schema-only `
    -f "C:\backups\tdr-schema-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql" `
    toplineshop_dev
$env:PGPASSWORD = ""
```

Produces DDL only (no data). Safe to run at any time.

### 1.2 Full Backup (schema + data, custom format)

```powershell
$env:PGPASSWORD = "your-password"
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" `
    -h localhost -p 5432 -U topline_user `
    -F c `
    -f "C:\backups\tdr-full-$(Get-Date -Format 'yyyyMMdd-HHmmss').dump" `
    toplineshop_dev
$env:PGPASSWORD = ""
```

Custom format (`-F c`) supports parallel restore and selective table restore.

### 1.3 Backup Verification

After taking a dump, verify it is non-empty:

```powershell
(Get-Item "C:\backups\tdr-full-YYYYMMDD.dump").Length
```

Non-zero size confirms the dump completed. For a deeper check, restore to a test DB (see Part 2).

---

## Part 2 — PostgreSQL Restore

### 2.1 Restore to a Separate Test Database

```powershell
# Create the target DB
psql -h localhost -p 5432 -U topline_user -c "CREATE DATABASE toplineshop_restore_test;"

# Restore
$env:PGPASSWORD = "your-password"
& "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" `
    -h localhost -p 5432 -U topline_user `
    -d toplineshop_restore_test `
    -F c `
    "C:\backups\tdr-full-YYYYMMDD.dump"
$env:PGPASSWORD = ""

# Verify
psql -h localhost -p 5432 -U topline_user -d toplineshop_restore_test `
    -c "SELECT COUNT(*) FROM tdr_source_files;"
```

### 2.2 Emergency Restore (production)

**Stop writes first.** Bring the backend service down to prevent concurrent writes during restore.

```powershell
# 1. Stop backend
# 2. Drop existing data (irreversible — confirm before proceeding)
psql -c "DROP DATABASE toplineshop_prod;"
psql -c "CREATE DATABASE toplineshop_prod;"

# 3. Restore
$env:PGPASSWORD = "your-password"
& "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" `
    -h prod-db-host -p 5432 -U topline_user `
    -d toplineshop_prod -F c --clean --if-exists `
    "\\backup-server\tdr-full-YYYYMMDD.dump"
$env:PGPASSWORD = ""

# 4. Run migrations to ensure schema is current
cd E:\ToplineShop\backend && npx prisma migrate deploy

# 5. Restart backend
```

---

## Part 3 — Object Storage Backup

### 3.1 Local Storage

Source files are stored under `LOCAL_STORAGE_ROOT/<tenantId>/`.  
Export artifacts are stored under the same root.

```powershell
# Backup local storage (robocopy for Windows)
robocopy "D:\tdr-storage" "C:\backups\tdr-storage-$(Get-Date -Format 'yyyyMMdd')" /E /COPYALL /LOG:"C:\backups\tdr-storage-backup.log"
```

### 3.2 S3 Object Storage

```bash
# Full sync to a backup prefix
aws s3 sync s3://your-bucket/tdr-production/ s3://your-bucket-backup/tdr-YYYYMMDD/

# Or use aws s3 cp for one-time copy
aws s3 cp s3://your-bucket/tdr-production/ s3://your-bucket-backup/tdr-YYYYMMDD/ --recursive
```

**S3 Versioning (recommended):** Enable bucket versioning to retain previous versions of all objects.

### 3.3 Storage Restore

```powershell
# Local: restore from backup
robocopy "C:\backups\tdr-storage-YYYYMMDD" "D:\tdr-storage" /E /COPYALL

# S3: restore from backup prefix
aws s3 sync s3://your-bucket-backup/tdr-YYYYMMDD/ s3://your-bucket/tdr-production/
```

---

## Part 4 — Backup Schedule (Recommended)

| Backup Type | Frequency | Retention |
|-------------|-----------|-----------|
| DB full dump | Daily | 30 days |
| DB schema-only | Weekly | 90 days |
| Storage sync (local/S3) | Daily | 90 days |
| Pre-deployment backup | Before every migration | 7 days |

---

## Part 5 — Security Notes

- Never commit backup files to git.
- Never log or print `PGPASSWORD` or `DATABASE_URL`.
- Store backup files in a location with restricted access (not world-readable).
- Encrypt backup files at rest if they contain PII or sensitive trade data.
- S3 backup bucket should have a separate IAM role from the application bucket.

---

## Part 6 — Backup Verification Result (2026-09-22)

Verified with PostgreSQL 18.x pg_dump against the development database:

- Schema-only dump: **PASS** — 46,642 bytes  
- `pg_dump --version`: 18.x (PostgreSQL 18 installation at `C:\Program Files\PostgreSQL\18\bin\`)  
- Note: pg_dump 17.x is incompatible with PostgreSQL 18 server; use 18.x binary.
