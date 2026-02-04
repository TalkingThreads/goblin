<#
.SYNOPSIS
    Connect MCP Inspector to Goblin via HTTP transport.

.DESCRIPTION
    Connects the MCP Inspector to a running Goblin instance using HTTP transport.

.PARAMETER Port
    Goblin HTTP port (default: 3000).

.PARAMETER Url
    Full Goblin URL.

.EXAMPLE
    .\goblin-inspector-http.ps1
    .\goblin-inspector-http.ps1 -Port 8080
#>
param(
    [int]$Port = 3000,
    [string]$Url = "",
    [int]$InspectorPort = 6274,
    [int]$InspectorProxyPort = 6277,
    [switch]$Help
)

if ($Help) {
    Get-Help $MyInvocation.MyCommand.Path -Full
    exit 0
}

# Colors
$Colors = @{
    Info = "Cyan"
    Success = "Green"
    Warn = "Yellow"
    Error = "Red"
}

function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor $Colors.Info }
function Write-Success { param([string]$Message) Write-Host "[OK] $Message" -ForegroundColor $Colors.Success }
function Write-Warn { param([string]$Message) Write-Host "[WARN] $Message" -ForegroundColor $Colors.Warn }
function Write-Error { param([string]$Message) Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Error }

if (-not $Url) {
    $Url = "http://localhost:$Port"
}

# Generate token
function Get-Token {
    if ($env:MCP_INSPECTOR_TOKEN) { return $env:MCP_INSPECTOR_TOKEN }
    return [Convert]::ToHexString((1..16 | ForEach-Object { Get-Random -Minimum 0 -Maximum 255 }))
}

# Check Goblin is responding
function Test-GoblinHttp {
    try {
        $Response = Invoke-RestMethod -Uri "$Url/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
        Write-Success "Goblin is responding at: $Url"
        return $true
    }
    catch {
        Write-Error "Goblin is not responding at: $Url"
        Write-Info "Make sure Goblin is running in HTTP mode"
        Write-Info "Example: goblin start --port $Port"
        return $false
    }
}

Write-Host ""
Write-Host "Starting Goblin Inspector (HTTP mode)" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "  Goblin:   " -NoNewline; Write-Host $Url -ForegroundColor Green
Write-Host "  UI:       " -NoNewline; Write-Host "http://localhost:$InspectorPort" -ForegroundColor Blue
Write-Host ""

if (-not (Test-GoblinHttp)) { exit 1 }

$Token = Get-Token
Write-Host "  Token:    " -NoNewline; Write-Host $Token -ForegroundColor Yellow
Write-Host ""

# Build command for HTTP transport
$Cmd = "npx @modelcontextprotocol/inspector --transport http --serverUrl $Url"

Write-Info "Command: $Cmd"
Write-Host ""
Write-Success "Opening browser..."
Write-Host ""
Write-Host "1. If browser doesn't open, navigate to:"
Write-Host "   http://localhost:$InspectorPort/?MCP_PROXY_AUTH_TOKEN=$Token"
Write-Host ""
Write-Host "2. Press Ctrl+C to stop"
Write-Host ""

$env:MCP_PROXY_AUTH_TOKEN = $Token
$env:CLIENT_PORT = $InspectorPort
$env:SERVER_PORT = $InspectorProxyPort

try { Start-Process "http://localhost:$InspectorPort/?MCP_PROXY_AUTH_TOKEN=$Token" }
catch { Write-Warn "Could not open browser automatically" }

Invoke-Expression $Cmd
