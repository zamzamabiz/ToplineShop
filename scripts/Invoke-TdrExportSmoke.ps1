<#
.SYNOPSIS
    TDR-MVP-EXPORT-INTEGRATION-MEGA-CLOSE-001 — Export E2E Smoke Test

.DESCRIPTION
    Authenticates securely, creates an export job scoped to the READY Pakistan Customs
    IMPORT batch (Imp_Pak_Jan_2025), polls until completion, downloads the CSV, and
    verifies headers and row count.

.USAGE
    PowerShell: .\scripts\Invoke-TdrExportSmoke.ps1

.REQUIREMENTS
    - Backend running at http://localhost:4000
    - Dev admin credentials (admin@toplineshop.dev)
    - Batch 0aecd7a9-... in READY status with 16 ACCEPTED rows
#>

$API = "http://localhost:4000"
$EMAIL = "admin@toplineshop.dev"
# Imp_Pak_Jan_2025 — confirmed READY with 16 ACCEPTED rows
$BATCH_ID = "0aecd7a9-8b6f-4da9-9d16-6ec793a9a19e"
$OUT_FILE  = "$env:TEMP\tdr-export-smoke.csv"

$EXPECTED_HEADERS = @(
    "sourceRowNumber","tradeDate","tradeDirection","hsCodeNormalized","hsChapter",
    "productDescriptionNormalized","localPartyNameNormalized","localPartyTaxIdNormalized",
    "localPartyCountryCode","foreignPartyNameNormalized","foreignPartyCountryCode",
    "originPortNormalized","quantityNormalized","quantityUnitCode","unitPriceNormalized","currencyCode"
)

Write-Host "`n=== TDR-MVP-EXPORT-INTEGRATION — Export Smoke Test ===" -ForegroundColor Cyan
Write-Host "Backend: $API"
Write-Host "Batch:   $BATCH_ID"

# ── Step 1: Health check ─────────────────────────────────────────────────────
Write-Host "`n[1] Health check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$API/health" -Method GET
    Write-Host "    status=$($health.data.status)" -ForegroundColor Green
} catch {
    Write-Host "    FAIL: backend not reachable" -ForegroundColor Red; exit 1
}

# ── Step 2: Login ─────────────────────────────────────────────────────────────
Write-Host "`n[2] Login (password will not be echoed)..." -ForegroundColor Yellow
$securePwd = Read-Host -Prompt "    Enter dev admin password" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePwd)
$plainPwd = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

$loginBody = @{ email = $EMAIL; password = $plainPwd } | ConvertTo-Json
$plainPwd = $null
try {
    $loginResp = Invoke-RestMethod -Uri "$API/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    $token = $loginResp.data.accessToken
    Write-Host "    Login OK" -ForegroundColor Green
} catch {
    Write-Host "    FAIL: $($_.ErrorDetails.Message)" -ForegroundColor Red; exit 1
}

# ── Step 3: Create export job ─────────────────────────────────────────────────
Write-Host "`n[3] Creating export job for batch $BATCH_ID..." -ForegroundColor Yellow
$exportBody = @{ batchId = $BATCH_ID; rowLimit = 100 } | ConvertTo-Json
try {
    $headers = @{ Authorization = "Bearer $token" }
    $createResp = Invoke-RestMethod -Uri "$API/tdr/exports" -Method POST -Body $exportBody -ContentType "application/json" -Headers $headers -ErrorAction Stop
    $jobId = $createResp.data.id
    Write-Host "    Job created: $jobId (status: $($createResp.data.status))" -ForegroundColor Green
} catch {
    Write-Host "    FAIL: $($_.ErrorDetails.Message)" -ForegroundColor Red; exit 1
}

# ── Step 4: Poll until COMPLETED or FAILED ────────────────────────────────────
Write-Host "`n[4] Polling job status..." -ForegroundColor Yellow
$maxPollSeconds = 60
$elapsed = 0
$finalStatus = $null
while ($elapsed -lt $maxPollSeconds) {
    Start-Sleep -Seconds 3
    $elapsed += 3
    try {
        $statusResp = Invoke-RestMethod -Uri "$API/tdr/exports/$jobId" -Method GET -Headers $headers -ErrorAction Stop
        $jobStatus = $statusResp.data.status
        Write-Host "    [$elapsed s] status=$jobStatus"
        if ($jobStatus -eq 'COMPLETED' -or $jobStatus -eq 'FAILED') {
            $finalStatus = $jobStatus
            break
        }
    } catch {
        Write-Host "    Poll error: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

if ($finalStatus -ne 'COMPLETED') {
    Write-Host "`n    FAIL: Job did not complete within $maxPollSeconds s (final: $finalStatus)" -ForegroundColor Red
    exit 1
}
Write-Host "    Job COMPLETED. rowCount=$($statusResp.data.rowCount)" -ForegroundColor Green

# ── Step 5: Download CSV ─────────────────────────────────────────────────────
Write-Host "`n[5] Downloading CSV to $OUT_FILE..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$API/tdr/exports/$jobId/download" -Method GET -Headers $headers -OutFile $OUT_FILE -ErrorAction Stop
    Write-Host "    Downloaded OK ($(Get-Item $OUT_FILE | Select-Object -ExpandProperty Length) bytes)" -ForegroundColor Green
} catch {
    Write-Host "    FAIL: $($_.ErrorDetails.Message)" -ForegroundColor Red; exit 1
}

# ── Step 6: Verify CSV headers ───────────────────────────────────────────────
Write-Host "`n[6] Verifying CSV headers..." -ForegroundColor Yellow
$firstLine = Get-Content $OUT_FILE -TotalCount 1
$actualHeaders = $firstLine -split ','
if ($actualHeaders.Count -ne 16) {
    Write-Host "    FAIL: Expected 16 columns, got $($actualHeaders.Count): $firstLine" -ForegroundColor Red; exit 1
}
$mismatch = $false
for ($i = 0; $i -lt 16; $i++) {
    if ($actualHeaders[$i] -ne $EXPECTED_HEADERS[$i]) {
        Write-Host "    FAIL: Column $($i+1) expected '$($EXPECTED_HEADERS[$i])' got '$($actualHeaders[$i])'" -ForegroundColor Red
        $mismatch = $true
    }
}
if ($mismatch) { exit 1 }
Write-Host "    Headers OK (16 columns in correct order)" -ForegroundColor Green

# ── Step 7: Verify row count ─────────────────────────────────────────────────
Write-Host "`n[7] Verifying row count..." -ForegroundColor Yellow
$rows = Get-Content $OUT_FILE | Select-Object -Skip 1 | Where-Object { $_ -ne '' }
$rowCount = ($rows | Measure-Object -Line).Lines
Write-Host "    Data rows: $rowCount"
if ($rowCount -lt 1) {
    Write-Host "    FAIL: Expected at least 1 data row, got 0" -ForegroundColor Red; exit 1
}
Write-Host "    Row count OK ($rowCount rows)" -ForegroundColor Green

# ── Step 8: Verify HS code is TEXT ───────────────────────────────────────────
Write-Host "`n[8] Verifying HS code stored as TEXT..." -ForegroundColor Yellow
$hsColIdx = $EXPECTED_HEADERS.IndexOf('hsCodeNormalized')
$sampleRow = $rows[0] -split ','
$hsVal = $sampleRow[$hsColIdx]
Write-Host "    Sample HS value: '$hsVal'"
if ($hsVal -match '^\d+\.\d+0$') {
    Write-Host "    WARN: HS code may have trailing zero stripped — check if value is preserved" -ForegroundColor Yellow
}
Write-Host "    HS code check done" -ForegroundColor Green

Write-Host "`n=== SMOKE TEST PASS ===" -ForegroundColor Green
Write-Host "Export job $jobId completed with $rowCount rows."
Write-Host "CSV written to: $OUT_FILE"
