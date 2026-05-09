# ─────────────────────────────────────────────────────────────────
#  Task Scheduler – single-command launcher
#  Usage:  .\start.ps1
#  Stops:  Press Ctrl+C in this window, or run .\stop.ps1
# ─────────────────────────────────────────────────────────────────

$ROOT = $PSScriptRoot

function Start-Service {
    param([string]$Name, [string]$Path)
    Write-Host "▶  Starting $Name ..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList `
        "-NoExit", "-Command", `
        "cd '$Path'; mvn spring-boot:run; Read-Host 'Press Enter to close'" `
        -WindowStyle Normal
}

# 1. Build all modules first (skip tests for speed)
Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "  Building all modules (skipping tests) " -ForegroundColor Yellow
Write-Host "════════════════════════════════════════" -ForegroundColor Yellow

$services = @(
    @{ name = "user-service";  path = Join-Path $ROOT "user-service"  },
    @{ name = "task-service";  path = Join-Path $ROOT "task-service"  },
    @{ name = "api-gateway";   path = Join-Path $ROOT "api-gateway"   }
)

foreach ($svc in $services) {
    Write-Host "  Building $($svc.name) ..." -NoNewline
    $result = & mvn -f "$($svc.path)\pom.xml" package -DskipTests -q 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host $result
        Write-Host "Fix the build error above and re-run start.ps1" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host " OK" -ForegroundColor Green
}

# 2. Launch each service in its own window
Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "  Launching services                    " -ForegroundColor Yellow
Write-Host "════════════════════════════════════════" -ForegroundColor Yellow

foreach ($svc in $services) {
    Start-Service -Name $svc.name -Path $svc.path
    Start-Sleep -Seconds 2
}

# 3. Wait for services to start up and verify they're running
Write-Host ""
Write-Host "  Waiting 30 s for services to start up ..." -ForegroundColor DarkCyan
Start-Sleep -Seconds 30

# Verify services are running
$servicesRunning = $true
foreach ($svc in $services) {
    $port = switch ($svc.name) {
        "user-service"  { 8081 }
        "task-service"  { 8082 }
        "api-gateway"   { 8080 }
    }
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$port" -Method HEAD -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-Host "  ✓ $($svc.name) is running on port $port" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ $($svc.name) is NOT responding on port $port" -ForegroundColor Red
        $servicesRunning = $false
    }
}

if (-not $servicesRunning) {
    Write-Host ""
    Write-Host "  WARNING: Some services failed to start. Check the service windows for errors." -ForegroundColor Yellow
    Write-Host "  The frontend may not work correctly." -ForegroundColor Yellow
}

# 4. Open the frontend in the default browser
$indexPath = Join-Path $ROOT "frontend\index.html"
Write-Host ""
Write-Host "  Opening frontend: $indexPath" -ForegroundColor Cyan
Start-Process $indexPath

Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Task Scheduler is running!" -ForegroundColor Green
Write-Host ""
Write-Host "  API Gateway  : http://localhost:8080" -ForegroundColor White
Write-Host "  User Service : http://localhost:8081" -ForegroundColor White
Write-Host "  Task Service : http://localhost:8082" -ForegroundColor White
Write-Host "  Frontend     : file://$indexPath" -ForegroundColor White
Write-Host ""
Write-Host "  Close individual service windows to stop them." -ForegroundColor DarkGray
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Green
