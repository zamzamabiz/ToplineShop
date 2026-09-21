<#
.SYNOPSIS
    TDR-QUARANTINE-REVIEW-CORRECTION-SMOKE-001
    Submits owner-authorized correction for blank quantityNormalized on batch 0aecd7a9.

.DESCRIPTION
    Authenticates securely (password never echoed, never written to disk),
    submits the correction, verifies re-evaluation, and saves results to
    a log file for audit purposes.

    Run from the ToplineShop root directory.
    Requires: Backend running at http://localhost:4000

.USAGE
    PowerShell: .\scripts\Invoke-QuarantineCorrection.ps1
#>

$API       = "http://localhost:4000"
$EMAIL     = "admin@toplineshop.dev"
$BATCH_ID  = "0aecd7a9-3ebe-42c9-8b39-ac0e9a09f0c2"
$RECORD_ID = "c5c71391-e10f-40ca-bd51-e7db5d107a37"
$LOG_PATH  = "$PSScriptRoot\quarantine-correction-result.json"

$result = [ordered]@{
    timestamp       = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    batchId         = $BATCH_ID
    recordId        = $RECORD_ID
    authPass        = $false
    roleAuthorized  = $null
    tenantId        = $null
    correctionPass  = $false
    correctionResp  = $null
    qualityDetailAfter = $null
    batchAfter      = $null
    error           = $null
}

Write-Host "`n=== TDR-QUARANTINE-REVIEW-CORRECTION-SMOKE-001 ===" -ForegroundColor Cyan
Write-Host "Batch:  $BATCH_ID"
Write-Host "Record: $RECORD_ID"
Write-Host "Field:  quantityNormalized = 100 (owner-authorized)"

# ── §1: Health check ─────────────────────────────────────────────────────────
Write-Host "`n[health] Checking backend..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$API/health" -Method GET
    if ($health.ok -ne $true) { throw "Health check returned ok=false" }
    Write-Host "    OK: $($health.data.status)  db=$($health.data.checks.database)" -ForegroundColor Green
} catch {
    $result.error = "Health check failed: $($_.Exception.Message)"
    $result | ConvertTo-Json -Depth 10 | Set-Content -Path $LOG_PATH -Encoding UTF8
    Write-Host "    FAIL: $($result.error)" -ForegroundColor Red
    exit 1
}

# ── §2: Secure login ─────────────────────────────────────────────────────────
Write-Host "`n[auth] Login (password will not be echoed or recorded)..." -ForegroundColor Yellow
$securePwd = Read-Host -Prompt "    Enter dev admin password" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePwd)
$TOKEN = $null
try {
    $plainPwd  = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    $loginBody = @{ email = $EMAIL; password = $plainPwd } | ConvertTo-Json
    $loginResp = Invoke-RestMethod -Uri "$API/auth/login" -Method POST `
        -ContentType "application/json" -Body $loginBody
    $TOKEN    = $loginResp.data.accessToken
    $result.authPass = $true
    Write-Host "    PASS: token obtained" -ForegroundColor Green
} catch {
    $result.error = "Login failed: $($_.Exception.Message)"
    $result | ConvertTo-Json -Depth 10 | Set-Content -Path $LOG_PATH -Encoding UTF8
    Write-Host "    FAIL: $($result.error)" -ForegroundColor Red
    exit 1
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    Remove-Variable plainPwd  -ErrorAction SilentlyContinue
    Remove-Variable loginBody -ErrorAction SilentlyContinue
    Remove-Variable securePwd -ErrorAction SilentlyContinue
    $bstr = $null
}

$HEADERS = @{ Authorization = "Bearer $TOKEN" }

# ── §3: Verify role + tenant (read from login response — roles at data.user.roles) ─
Write-Host "`n[role] Verifying role authorization from login response..." -ForegroundColor Yellow
$loginRoles  = $loginResp.data.user.roles
$loginTenant = $loginResp.data.user.tenantId
$result.roleAuthorized = $loginRoles
$result.tenantId       = $loginTenant

$ALLOWED_ROLES = @('TENANT_ADMIN', 'SUPER_ADMIN', 'IMPORT_MANAGER')
$authorized = $loginRoles | Where-Object { $ALLOWED_ROLES -contains $_ }
if (-not $authorized) {
    $result.error = "Role not authorized. Got: $($loginRoles -join ', '). Need one of: $($ALLOWED_ROLES -join ', ')"
    $result | ConvertTo-Json -Depth 10 | Set-Content -Path $LOG_PATH -Encoding UTF8
    Write-Host "    FAIL: $($result.error)" -ForegroundColor Red
    exit 1
}
Write-Host "    roles: $($loginRoles -join ', ')  tenantId: $loginTenant" -ForegroundColor Green

# ── §4: Idempotency guard — check current record state before POST /correct ───
Write-Host "`n[idempotency] Checking whether correction is already applied..." -ForegroundColor Yellow
$SKIP_CORRECTION = $false
try {
    $preDetail = Invoke-RestMethod `
        -Uri "$API/tdr/batches/$BATCH_ID/records/$RECORD_ID/quality" `
        -Method GET -Headers $HEADERS
    $preNorm  = [string]$preDetail.data.quantityNormalized
    $preMeta  = $preDetail.data.valueTreatmentMeta
    $preTreat = if ($preMeta) { [string]$preMeta.quantityNormalized } else { "" }
    Write-Host "    quantityNormalized: $preNorm   valueTreatmentMeta.quantityNormalized: $preTreat" -ForegroundColor DarkGray
    if ($preNorm -eq "100" -and $preTreat -eq "CORRECTED") {
        $SKIP_CORRECTION = $true
        $result.correctionPass = $true   # Treated as already applied
        Write-Host "    SKIP: correction already applied — proceeding to re-evaluation/verification" -ForegroundColor Yellow
    }
} catch {
    Write-Host "    WARN: pre-check failed ($($_.Exception.Message)) — will attempt correction" -ForegroundColor Yellow
}

# ── §4b: Submit correction (skipped if already applied) ──────────────────────
if (-not $SKIP_CORRECTION) {
    Write-Host "`n[correction] Submitting correction quantityNormalized=100..." -ForegroundColor Yellow
    $corrBody = @{
        fieldName      = "quantityNormalized"
        correctedValue = "100"
        note           = "Owner-authorized bounded smoke-test correction for intentionally blank fixture quantity (Imp_Pak_Jan_2025_sample_v2.csv row 15, HS 2202.10)"
    } | ConvertTo-Json

    try {
        $corrResp = Invoke-RestMethod `
            -Uri "$API/tdr/batches/$BATCH_ID/records/$RECORD_ID/correct" `
            -Method POST -Headers $HEADERS `
            -ContentType "application/json" -Body $corrBody
        $result.correctionPass = $true
        $result.correctionResp = $corrResp
        Write-Host "    PASS: correction accepted" -ForegroundColor Green
        Write-Host "    response: $($corrResp | ConvertTo-Json -Compress)" -ForegroundColor DarkGray
    } catch {
        $result.error = "Correction API failed: $($_.Exception.Message)"
        try {
            $errBody = $_.Exception.Response.GetResponseStream()
            $reader  = New-Object System.IO.StreamReader($errBody)
            $result.error += " | body: " + $reader.ReadToEnd()
        } catch {}
        $result.correctionPass = $false
        $result | ConvertTo-Json -Depth 10 | Set-Content -Path $LOG_PATH -Encoding UTF8
        Write-Host "    FAIL: $($result.error)" -ForegroundColor Red
        exit 1
    }
}

# ── §5: Re-evaluate record (fix broken revalidation artefacts) ───────────────
Write-Host "`n[re-evaluate] Triggering governed re-evaluation of corrected record..." -ForegroundColor Yellow
try {
    $reEval = Invoke-RestMethod `
        -Uri "$API/tdr/batches/$BATCH_ID/records/$RECORD_ID/re-evaluate" `
        -Method POST -Headers $HEADERS
    Write-Host "    PASS: re-evaluate response: $($reEval | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    $result.error = "Re-evaluate API failed: $($_.Exception.Message)"
    try {
        $errBody = $_.Exception.Response.GetResponseStream()
        $reader  = New-Object System.IO.StreamReader($errBody)
        $result.error += " | body: " + $reader.ReadToEnd()
    } catch {}
    $result | ConvertTo-Json -Depth 10 | Set-Content -Path $LOG_PATH -Encoding UTF8
    Write-Host "    FAIL: $($result.error)" -ForegroundColor Red
    exit 1
}

# ── §5b: Verify quality detail after re-evaluation ───────────────────────────
Write-Host "`n[verify] Quality detail post-re-evaluation..." -ForegroundColor Yellow
try {
    $detail = Invoke-RestMethod `
        -Uri "$API/tdr/batches/$BATCH_ID/records/$RECORD_ID/quality" `
        -Method GET -Headers $HEADERS
    $result.qualityDetailAfter = $detail
    $disp = $detail.data.rowDisposition
    $qRaw = $detail.data.quantityRaw
    $qNorm = $detail.data.quantityNormalized
    Write-Host "    rowDisposition:      $disp" -ForegroundColor $(if ($disp -eq 'ACCEPTED') {'Green'} else {'Red'})
    Write-Host "    quantityRaw:         '$qRaw'  (must stay blank)" -ForegroundColor $(if ($qRaw -eq '') {'Green'} else {'Red'})
    Write-Host "    quantityNormalized:  $qNorm  (must be 100)" -ForegroundColor $(if ([string]$qNorm -eq '100') {'Green'} else {'Red'})
} catch {
    $result.error = "Quality detail after correction failed: $($_.Exception.Message)"
    $result | ConvertTo-Json -Depth 10 | Set-Content -Path $LOG_PATH -Encoding UTF8
    Write-Host "    FAIL: $($result.error)" -ForegroundColor Red
    exit 1
}

# ── §6: Verify batch final state ──────────────────────────────────────────────
Write-Host "`n[batch] Batch final state..." -ForegroundColor Yellow
try {
    $batch = Invoke-RestMethod `
        -Uri "$API/tdr/batches/$BATCH_ID" `
        -Method GET -Headers $HEADERS
    $result.batchAfter = $batch
    $bStatus = $batch.data.status
    Write-Host "    status:         $bStatus" -ForegroundColor $(if ($bStatus -eq 'READY') {'Green'} else {'Yellow'})

    # Fetch progress for counts
    $prog = Invoke-RestMethod `
        -Uri "$API/tdr/batches/$BATCH_ID/progress" `
        -Method GET -Headers $HEADERS
    $accepted   = $prog.data.acceptedRows
    $quarantine = $prog.data.quarantinedRows
    $rejected   = $prog.data.rejectedRows
    Write-Host "    acceptedRows:   $accepted   (expected 16)" -ForegroundColor $(if ($accepted -eq 16) {'Green'} else {'Red'})
    Write-Host "    quarantinedRows:$quarantine  (expected 0)" -ForegroundColor $(if ($quarantine -eq 0) {'Green'} else {'Red'})
    Write-Host "    rejectedRows:   $rejected   (expected 0)" -ForegroundColor $(if ($rejected -eq 0) {'Green'} else {'Red'})
    $result.batchAfter = @{ batch = $batch; progress = $prog }
} catch {
    $result.error = "Batch state check failed: $($_.Exception.Message)"
    $result | ConvertTo-Json -Depth 10 | Set-Content -Path $LOG_PATH -Encoding UTF8
    Write-Host "    FAIL: $($result.error)" -ForegroundColor Red
    exit 1
}

# ── §7: Save results ──────────────────────────────────────────────────────────
$result | ConvertTo-Json -Depth 10 | Set-Content -Path $LOG_PATH -Encoding UTF8
Write-Host "`n[done] Results saved to: $LOG_PATH" -ForegroundColor Cyan
Write-Host "       Pass this path to Claude to continue verification." -ForegroundColor DarkGray
Write-Host "`n=== CORRECTION SCRIPT COMPLETE ===" -ForegroundColor Cyan
