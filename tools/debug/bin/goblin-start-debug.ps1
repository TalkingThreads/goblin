<#
.SYNOPSIS
    Start Goblin with debug logging enabled.

.DESCRIPTION
    Launches Goblin with maximum verbosity (DEBUG=1, LOG_LEVEL=trace) for troubleshooting.

.PARAMETER GoblinArgs
    Arguments to pass to Goblin.

.PARAMETER ConfigPath
    Path to Goblin config file.

.EXAMPLE
    .\goblin-start-debug.ps1
    .\goblin-start-debug.ps1 -ConfigPath "C:\goblin\config.json"
#>
param(
    [string]$GoblinArgs = "",
    [string]$ConfigPath = "",
    [string]$GoblinPath = ".\dist\index.js",
    [string]$LogLevel = "trace",
    [switch]$Help
)

if ($Help) {
    Get-Help $MyInvocation.MyCommand.Path -Full
    exit 0
}

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

# Check Goblin exists
if (-not (Test-Path $GoblinPath)) {
    Write-Error "Goblin not found at: $GoblinPath"
    Write-Info "Please run 'bun run build' first"
    exit 1
}

Write-Host ""
Write-Host "Starting Goblin with debug logging" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Goblin:   $GoblinPath"
Write-Host "  Level:    $LogLevel"
Write-Host "  DEBUG:    1"
Write-Host ""

# Build environment
$env:LOG_LEVEL = $LogLevel
$env:DEBUG = "1"
$env:DEBUG_LOG = ".\logs\debug.log"

# Build command
$Cmd = "bun run $GoblinPath"
if ($ConfigPath) {
    $env:GOBLIN_CONFIG = $ConfigPath
    $Cmd = "$Cmd --config $ConfigPath"
}
if ($GoblinArgs) {
    $Cmd = "$Cmd $GoblinArgs"
}

Write-Info "Command: $Cmd"
Write-Host ""
Write-Success "Starting Goblin..."
Write-Host ""

# Run Goblin
Invoke-Expression $Cmd
