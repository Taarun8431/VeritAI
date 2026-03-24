param()

$ErrorActionPreference = "Stop"

$ports = @(8000, 5173, 4173)
$stopped = @()

function Write-Step {
    param([string]$Message)
    Write-Host "[VeritAI] $Message" -ForegroundColor Cyan
}

function Get-ListeningPids {
    param([int]$Port)

    $pids = @()
    $lines = netstat -ano | Select-String -Pattern "127\.0\.0\.1:$Port\s+.*LISTENING|0\.0\.0\.0:$Port\s+.*LISTENING|\[::\]:$Port\s+.*LISTENING"
    foreach ($line in $lines) {
        $parts = ($line.ToString() -split "\s+") | Where-Object { $_ }
        if ($parts.Length -gt 0) {
            $processId = $parts[-1]
            if ($processId -match "^\d+$") {
                $pids += [int]$processId
            }
        }
    }
    return $pids | Sort-Object -Unique
}

foreach ($port in $ports) {
    $pids = Get-ListeningPids -Port $port
    if (-not $pids.Count) {
        Write-Step "Nothing is listening on port $port"
        continue
    }

    foreach ($processId in $pids) {
        try {
            Stop-Process -Id $processId -Force -ErrorAction Stop
            $stopped += [PSCustomObject]@{
                Port = $port
                PID = $processId
            }
            Write-Step "Stopped PID $processId on port $port"
        } catch {
            Write-Step ("Failed to stop PID {0} on port {1}: {2}" -f $processId, $port, $_.Exception.Message)
        }
    }
}

Write-Host ""
if ($stopped.Count) {
    Write-Host "VeritAI services stopped." -ForegroundColor Green
    foreach ($item in $stopped) {
        Write-Host "Port $($item.Port) -> PID $($item.PID)"
    }
} else {
    Write-Host "No VeritAI services were running on ports 8000, 5173, or 4173." -ForegroundColor Yellow
}
