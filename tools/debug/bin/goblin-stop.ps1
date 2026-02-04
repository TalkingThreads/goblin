<#
.SYNOPSIS
    Stop all Goblin processes gracefully.

.DESCRIPTION
    Finds and terminates all Goblin processes with graceful shutdown, then force kill if needed.

.PARAMETER Force
    Force kill processes (skip graceful shutdown).

.EXAMPLE
    .\goblin-stop.ps1
    .\goblin-stop.ps1 -Force
#>
param(
    [switch]$Force,
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

Write-Info "Stopping Goblin processes..."
Write-Host ""

# Find Goblin processes
$Processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*goblin*" -or $_.CommandLine -like "*dist\index*"
}

if (-not $Processes) {
    Write-Success "No Goblin processes found"
    exit 0
}

$ProcessCount = $Processes.Count
Write-Info "Found $ProcessCount Goblin process(es)"
Write-Host ""

# Graceful shutdown first
if (-not $Force) {
    Write-Info "Sending SIGTERM to processes..."
    foreach ($Proc in $Processes) {
        Write-Info "Stopping PID $($Proc.Id)..."
        $Proc.CloseMainWindow() | Out-Null
    }
    
    # Wait for graceful exit
    Start-Sleep -Seconds 5
    
    # Check if still running
    $StillRunning = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.Id -in $Processes.Id
    }
    
    if ($StillRunning) {
        Write-Warn "Processes did not exit gracefully"
        Write-Info "Use -Force to force kill"
    }
}

# Force kill if requested or still running
if ($Force -or ($Processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*goblin*" -or $_.CommandLine -like "*dist\index*"
})) {
    foreach ($Proc in $Processes) {
        Write-Warn "Force killing PID $($Proc.Id)..."
        Stop-Process -Id $Proc.Id -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""

# Verify all stopped
$Remaining = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*goblin*" -or $_.CommandLine -like "*dist\index*"
}

if (-not $Remaining) {
    Write-Success "All Goblin processes stopped"
}
else {
    Write-Error "Some processes still running"
    exit 1
}
