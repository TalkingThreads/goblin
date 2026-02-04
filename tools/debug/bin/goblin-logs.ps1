<#
.SYNOPSIS
    View and filter Goblin logs.

.DESCRIPTION
    Displays and filters log entries by level, component, and other criteria.

.PARAMETER Follow
    Follow log output in real-time.

.PARAMETER Level
    Filter by log level (trace, debug, info, warn, error, fatal).

.PARAMETER Component
    Filter by component name.

.PARAMETER Lines
    Number of lines to show (default: 100).

.PARAMETER Path
    Path to log file (default: .\logs\app.log).

.PARAMETER Count
    Show log level distribution.

.PARAMETER Json
    Output in JSON format.

.EXAMPLE
    .\goblin-logs.ps1
    .\goblin-logs.ps1 -Follow
    .\goblin-logs.ps1 -Level error
    .\goblin-logs.ps1 -Component gateway
#>
param(
    [switch]$Follow,
    [string]$Level = "",
    [string]$Component = "",
    [int]$Lines = 100,
    [string]$Path = ".\logs\app.log",
    [switch]$Count,
    [switch]$Json,
    [switch]$Help
)

if ($Help) {
    Get-Help $MyInvocation.MyCommand.Path -Full
    exit 0
}

$LevelColors = @{
    trace = "Cyan"
    debug = "Blue"
    info = "Green"
    warn = "Yellow"
    error = "Red"
    fatal = "Red"
}

function Format-LogLine {
    param([string]$Line)
    
    # Try to parse JSON log
    try {
        $Data = $Line | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($Data) {
            $Timestamp = $Data.time ?? $Data.timestamp ?? ""
            $LogLevel = $Data.level ?? ""
            $LogComponent = $Data.component ?? ""
            $Message = $Data.msg ?? $Data.message ?? ""
            
            # Apply filters
            if ($Level -and $Level -ne "") {
                $Levels = "trace,debug,info,warn,error,fatal".Split(',')
                $FilterIndex = $Levels.IndexOf($Level.ToLower())
                $LogIndex = $Levels.IndexOf($LogLevel.ToLower())
                if ($LogIndex -lt $FilterIndex -and $LogIndex -ge 0) { return }
            }
            
            if ($Component -and $Component -ne "" -and $LogComponent -ne $Component) { return }
            
            $Color = $LevelColors[$LogLevel.ToLower()] ?? "White"
            $TimestampShort = $Timestamp -replace 'T.*$' -replace 'Z$', ''
            
            if ($Json) {
                return $Data | ConvertTo-Json -Depth 2
            }
            
            return "[$TimestampShort] $LogLevel [$LogComponent] $Message"
        }
    }
    catch { }
    
    # Plain text fallback
    return $Line
}

# Show level distribution
if ($Count) {
    Write-Host "Log level distribution:" -ForegroundColor Cyan
    Write-Host ""
    if (Test-Path $Path) {
        $Distribution = Get-Content $Path -ErrorAction SilentlyContinue | 
            Select-String -Pattern '"level":"([^"]+)"' -AllMatches |
            ForEach-Object { $_.Matches } |
            ForEach-Object { $_.Groups[1].Value } |
            Group-Object |
            Sort-Object Count -Descending
            
        foreach ($Group in $Distribution) {
            $Color = $LevelColors[$Group.Name] ?? "White"
            Write-Host "  " -NoNewline; Write-Host $Group.Name -ForegroundColor $Color -NoNewline; Write-Host ": $($Group.Count)"
        }
    }
    exit 0
}

# Check log file
if (-not (Test-Path $Path)) {
    Write-Error "Log file not found: $Path"
    exit 1
}

Write-Info "Showing last $Lines lines of: $Path"

if ($Follow) {
    Get-Content $Path -Wait -ErrorAction SilentlyContinue | ForEach-Object { Format-LogLine $_ }
}
else {
    Get-Content $Path -Tail $Lines -ErrorAction SilentlyContinue | ForEach-Object { Format-LogLine $_ }
}

function Write-Error { param([string]$Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
