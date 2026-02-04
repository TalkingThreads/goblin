<#
.SYNOPSIS
    Connect MCP Inspector to Goblin via STDIO transport.

.DESCRIPTION
    Launches the MCP Inspector connected to Goblin using STDIO transport for interactive debugging.

.PARAMETER GoblinArgs
    Arguments to pass to Goblin.

.PARAMETER InspectorArgs
    Arguments to pass to Inspector.

.EXAMPLE
    .\goblin-inspector-stdio.ps1
    .\goblin-inspector-stdio.ps1 -GoblinArgs "--config C:\goblin\config.json"
#>
param(
    [string]$GoblinArgs = "",
    [string]$InspectorArgs = "",
    [string]$GoblinPath = ".\dist\index.js",
    [int]$InspectorPort = 6274,
    [int]$InspectorProxyPort = 6277,
    [switch]$Help
)

if ($Help) {
    Get-Help $MyInvocation.MyCommand.Path -Full
    exit 0
}

# Colors for output
$Colors = @{
    Info = "Cyan"
    Success = "Green"
    Warn = "Yellow"
    Error = "Red"
    OK = "Green"
}

function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor $Colors.Info }
function Write-Success { param([string]$Message) Write-Host "[OK] $Message" -ForegroundColor $Colors.Success }
function Write-Warn { param([string]$Message) Write-Host "[WARN] $Message" -ForegroundColor $Colors.Warn }
function Write-Error { param([string]$Message) Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Error }

# Generate auth token
function Get-Token {
    if ($env:MCP_INSPECTOR_TOKEN) {
        return $env:MCP_INSPECTOR_TOKEN
    }
    try {
        return [Convert]::ToHexString((1..16 | ForEach-Object { Get-Random -Minimum 0 -Maximum 255 }))
    }
    catch {
        return [Guid]::NewGuid().ToString().Replace("-", "")
    }
}

# Check if Goblin exists
function Test-Goblin {
    if (-not (Test-Path $GoblinPath)) {
        Write-Error "Goblin not found at: $GoblinPath"
        Write-Info "Please run 'bun run build' first"
        exit 1
    }
    Write-Success "Found Goblin at: $GoblinPath"
}

# Main
Write-Host ""
Write-Host "Starting Goblin Inspector (STDIO mode)" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "  Goblin:   " -NoNewline; Write-Host $GoblinPath -ForegroundColor Green
Write-Host "  UI:       " -NoNewline; Write-Host "http://localhost:$InspectorPort" -ForegroundColor Blue
Write-Host ""

Test-Goblin

$Token = Get-Token
Write-Host "  Token:    " -NoNewline; Write-Host $Token -ForegroundColor Yellow
Write-Host ""

# Build command
$Cmd = "npx @modelcontextprotocol/inspector"
if ($GoblinArgs) {
    $Cmd = "$Cmd -- $GoblinPath $GoblinArgs"
}
else {
    $Cmd = "$Cmd $GoblinPath"
}

Write-Info "Command: $Cmd"
Write-Host ""
Write-Success "Opening browser..."
Write-Host ""
Write-Host "1. If browser doesn't open, navigate to:"
Write-Host "   http://localhost:$InspectorPort/?MCP_PROXY_AUTH_TOKEN=$Token"
Write-Host ""
Write-Host "2. Press Ctrl+C to stop"
Write-Host ""

# Set environment and run
$env:MCP_PROXY_AUTH_TOKEN = $Token
$env:CLIENT_PORT = $InspectorPort
$env:SERVER_PORT = $InspectorProxyPort

# Open browser
try {
    Start-Process "http://localhost:$InspectorPort/?MCP_PROXY_AUTH_TOKEN=$Token"
}
catch {
    Write-Warn "Could not open browser automatically"
}

# Run Inspector
Invoke-Expression $Cmd
