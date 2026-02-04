<#
.SYNOPSIS
    Test connectivity to Goblin MCP Gateway.

.DESCRIPTION
    Performs connectivity tests including TCP, HTTP health, tools, and servers endpoints.

.PARAMETER Url
    Goblin URL (default: http://localhost:3000).

.PARAMETER Json
    Output results in JSON format.

.EXAMPLE
    .\goblin-test-connection.ps1
    .\goblin-test-connection.ps1 -Url http://localhost:3000
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
}

$Results = @{}

function Test-Pass { param([string]$Test) 
    if ($Json) { $Results[$Test] = @{ passed = $true } }
    else { Write-Host "  $([char]0x221A) $Test" -ForegroundColor $Colors.Pass }
}
function Test-Fail { param([string]$Test, [string]$Error) 
    if ($Json) { $Results[$Test] = @{ passed = $false; error = $Error } }
    else { Write-Host "  $([char]0x2217) $Test: $Error" -ForegroundColor $Colors.Fail }
}
function Test-Info { param([string]$Test, [string]$Value) 
    if ($Json) { $Results[$Test].info = $Value }
    else { Write-Host "  - $Test`: $Value" -ForegroundColor $Colors.Info }
}

Write-Host ""
Write-Host "Testing Goblin connectivity: $Url" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# TCP Test
try {
    $Uri = [System.Uri]::new($Url)
    $TcpClient = New-Object System.Net.Sockets.TcpClient
    $Connected = $TcpClient.ConnectAsync($Uri.Host, ($Uri.Port -or 80)).Wait(3000)
    $TcpClient.Close()
    if ($Connected) { Test-Pass "TCP connect" } 
    else { Test-Fail "TCP connect" "Connection refused" }
}
catch { Test-Fail "TCP connect" $_.Exception.Message }

# HTTP Health Test
try {
    $Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $Response = Invoke-RestMethod -Uri "$Url/health" -TimeoutSec 5
    $Stopwatch.Stop()
    Test-Pass "HTTP health"
    Test-Info "health_response" "OK ($($Stopwatch.ElapsedMilliseconds)ms)"
}
catch { Test-Fail "HTTP health" $_.Exception.Message }

# Tools Test
try {
    $Response = Invoke-RestMethod -Uri "$Url/api/v1/tools" -TimeoutSec 5
    $Count = ($Response.tools | Measure-Object).Count
    Test-Pass "HTTP tools"
    Test-Info "tools_count" $Count
}
catch { Test-Fail "HTTP tools" $_.Exception.Message }

# Servers Test
try {
    $Response = Invoke-RestMethod -Uri "$Url/api/v1/servers" -TimeoutSec 5
    $Count = ($Response.servers | Measure-Object).Count
    Test-Pass "HTTP servers"
    Test-Info "servers_count" $Count
}
catch { Test-Fail "HTTP servers" $_.Exception.Message }

# Latency
try {
    $Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    Invoke-WebRequest -Uri "$Url/health" -TimeoutSec 5 | Out-Null
    $Stopwatch.Stop()
    Test-Info "latency_ms" $Stopwatch.ElapsedMilliseconds
}
catch { Test-Info "latency_ms" "Failed" }

if ($Json) {
    $Results | ConvertTo-Json -Depth 2
}
