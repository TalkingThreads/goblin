<#
.SYNOPSIS
    Comprehensive health check for Goblin MCP Gateway.

.DESCRIPTION
    Performs comprehensive health diagnostics including process status, HTTP endpoints, log files, and dependencies.

.PARAMETER Url
    Goblin URL (default: http://localhost:3000).

.PARAMETER Json
    Output results in JSON format.

.EXAMPLE
    .\goblin-health.ps1
    .\goblin-health.ps1 -Url http://goblin.local:3000 -Json
#>
param(
    [string]$Url = "http://localhost:3000",
    [switch]$Json,
    [switch]$Help
)

if ($Help) {
    Get-Help $MyInvocation.MyCommand.Path -Full
    exit 0
}

$Colors = @{
    Pass = "Green"
    Fail = "Red"
    Warn = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
}

$Script:PASSED = 0
$Script:FAILED = 0
$Script:WARNINGS = 0

function Write-Pass { param([string]$Message) Write-Host "  $([char]0x221A) $Message" -ForegroundColor $Colors.Pass; $Script:PASSED++ }
function Write-Fail { param([string]$Message) Write-Host "  $([char]0x2217) $Message" -ForegroundColor $Colors.Fail; $Script:FAILED++ }
function Write-Warn { param([string]$Message) Write-Host "  ! $Message" -ForegroundColor $Colors.Warn; $Script:WARNINGS++ }
function Write-Info { param([string]$Message) Write-Host "  - $Message" -ForegroundColor $Colors.Info }
function Write-Header { param([string]$Message) Write-Host ""; Write-Host $Message -ForegroundColor $Colors.Header; Write-Host "  =========================================" -ForegroundColor $Colors.Header }

# Check process
function Test-Process {
    Write-Header "Process Status"
    
    $Processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*goblin*" -or $_.CommandLine -like "*goblin*" }
    
    if ($Processes) {
        foreach ($Proc in $Processes) {
            Write-Info "PID: $($Proc.Id), CPU: $($Proc.CPU.ToString('F2'))%, MEM: $($Proc.WorkingSet64 / 1MB.ToString('F2'))MB"
        }
        Write-Pass "Goblin process found"
    }
    else {
        Write-Warn "No Goblin process found (normal if using HTTP transport)"
    }
}

# Check HTTP endpoint
function Test-Http {
    Write-Header "HTTP Endpoint Check"
    
    $Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $Response = Invoke-RestMethod -Uri "$Url/health" -TimeoutSec 5
        $Stopwatch.Stop()
        Write-Pass "Health endpoint responding ($($Stopwatch.ElapsedMilliseconds)ms)"
        
        if ($Response.servers) { Write-Info "Connected servers: $($Response.servers)" }
        if ($Response.tools) { Write-Info "Registered tools: $($Response.tools)" }
    }
    catch {
        Write-Fail "Health endpoint failed: $_"
    }
}

# Check endpoints
function Test-Endpoints {
    Write-Header "Endpoint Availability"
    
    $Endpoints = @("/health", "/api/v1/tools", "/api/v1/servers")
    
    foreach ($Endpoint in $Endpoints) {
        $Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        try {
            $StatusCode = (Invoke-WebRequest -Uri "$Url$Endpoint" -TimeoutSec 3 -UseBasicParsing).StatusCode
            $Stopwatch.Stop()
            if ($StatusCode -eq 200) {
                Write-Pass "$Endpoint ($($Stopwatch.ElapsedMilliseconds)ms)"
            }
            else {
                Write-Warn "$Endpoint (HTTP $StatusCode)"
            }
        }
        catch {
            Write-Fail "$Endpoint (connection failed)"
        }
    }
}

# Check logs
function Test-Logs {
    Write-Header "Log File Check"
    
    $LogFile = ".\logs\app.log"
    if (Test-Path $LogFile) {
        $Size = (Get-Item $LogFile).Length / 1KB
        $Lines = (Get-Content $LogFile -ErrorAction SilentlyContinue).Count
        Write-Info "Log file: $LogFile"
        Write-Info "Size: $([Math]::Round($Size, 2))KB, Lines: $Lines"
        
        $ErrorCount = (Select-String -Path $LogFile -Pattern "error" -ErrorAction SilentlyContinue).Count
        if ($ErrorCount -gt 0) {
            Write-Warn "Found $ErrorCount error entries in log"
        }
        else {
            Write-Pass "No recent errors in log"
        }
    }
    else {
        Write-Warn "Log file not found: $LogFile"
    }
}

# Check config
function Test-Config {
    Write-Header "Configuration Check"
    
    $ConfigPaths = @(".\goblin.json", ".\config.json", "$env:APPDATA\goblin\config.json")
    
    $Found = $false
    foreach ($Path in $ConfigPaths) {
        if (Test-Path $Path) {
            Write-Info "Config found: $Path"
            $Found = $true
            break
        }
    }
    
    if (-not $Found) {
        Write-Warn "No configuration file found"
    }
}

# Summary
function Show-Summary {
    Write-Header "Summary"
    
    Write-Host "  Passed:   $Script:PASSED" -ForegroundColor $Colors.Pass
    Write-Host "  Failed:   $Script:FAILED" -ForegroundColor $Colors.Fail
    Write-Host "  Warnings: $Script:WARNINGS" -ForegroundColor $Colors.Warn
    Write-Host ""
    
    if ($Script:FAILED -eq 0) {
        Write-Host "Goblin appears to be healthy!" -ForegroundColor $Colors.Pass
    }
    else {
        Write-Host "Some checks failed. Review the output above." -ForegroundColor $Colors.Fail
    }
}

# Main
Write-Host ""
Write-Host "========================================" -ForegroundColor $Colors.Header
Write-Host "       Goblin Health Check              " -ForegroundColor $Colors.Header
Write-Host "========================================" -ForegroundColor $Header
Write-Host ""
Write-Host "  Target: " -NoNewline; Write-Host $Url -ForegroundColor Green
Write-Host "  Time:   $(Get-Date)"

Test-Process
Test-Http
Test-Endpoints
Test-Logs
Test-Config
Show-Summary
