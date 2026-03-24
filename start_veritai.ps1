param(
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = Join-Path $repoRoot "Frontend"
$backendUrl = "http://127.0.0.1:8000/health"
$frontendUrl = "http://127.0.0.1:5173"
$backendOutLog = Join-Path $repoRoot "backend_uvicorn.out.log"
$backendErrLog = Join-Path $repoRoot "backend_uvicorn.err.log"
$frontendOutLog = Join-Path $repoRoot "frontend_vite.out.log"
$frontendErrLog = Join-Path $repoRoot "frontend_vite.err.log"

function Write-Step {
    param([string]$Message)
    Write-Host "[VeritAI] $Message" -ForegroundColor Cyan
}

function Get-CommandPath {
    param([string]$Name)

    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $command) {
        return $null
    }

    return $command.Source
}

function Get-PythonLauncher {
    $pythonPath = Get-CommandPath "python"
    if ($pythonPath) {
        return @{
            FilePath = $pythonPath
            Prefix = @()
        }
    }

    $pyPath = Get-CommandPath "py"
    if ($pyPath) {
        return @{
            FilePath = $pyPath
            Prefix = @("-3")
        }
    }

    throw "Python was not found in PATH."
}

function Test-HttpReady {
    param(
        [string]$Url,
        [int]$TimeoutSeconds = 2
    )

    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSeconds
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            return $statusCode -ge 200 -and $statusCode -lt 500
        }
        return $false
    }
}

function Test-PortListening {
    param([int]$Port)

    try {
        $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop | Select-Object -First 1
        return $null -ne $listener
    } catch {
        $matches = netstat -ano | Select-String -Pattern "\S+:$Port\s+.*LISTENING"
        return $null -ne $matches
    }
}

function Wait-ForUrl {
    param(
        [string]$Url,
        [int]$TimeoutSeconds
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-HttpReady -Url $Url -TimeoutSeconds 3) {
            return $true
        }
        Start-Sleep -Milliseconds 750
    }

    return $false
}

function Start-ServiceProcess {
    param(
        [string]$Name,
        [string]$FilePath,
        [string[]]$Arguments,
        [string]$WorkingDirectory,
        [string]$StdOutPath,
        [string]$StdErrPath
    )

    Set-Content -Path $StdOutPath -Value ""
    Set-Content -Path $StdErrPath -Value ""

    Write-Step "Starting $Name..."

    return Start-Process `
        -FilePath $FilePath `
        -ArgumentList $Arguments `
        -WorkingDirectory $WorkingDirectory `
        -RedirectStandardOutput $StdOutPath `
        -RedirectStandardError $StdErrPath `
        -WindowStyle Hidden `
        -PassThru
}

if (-not (Test-Path (Join-Path $repoRoot "main.py"))) {
    throw "main.py was not found in the repo root."
}

if (-not (Test-Path $frontendDir)) {
    throw "Frontend directory was not found at $frontendDir."
}

if (-not (Test-Path (Join-Path $frontendDir "package.json"))) {
    throw "Frontend package.json was not found."
}

if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
    throw "Frontend dependencies are missing. Run 'npm install' in Frontend once before using this launcher."
}

$python = Get-PythonLauncher
$npmPath = Get-CommandPath "npm.cmd"
if (-not $npmPath) {
    $npmPath = Get-CommandPath "npm"
}
if (-not $npmPath) {
    throw "npm was not found in PATH."
}

$backendStarted = $false
$frontendStarted = $false

if (Test-HttpReady -Url $backendUrl) {
    Write-Step "Backend is already running at http://127.0.0.1:8000"
} elseif (Test-PortListening -Port 8000) {
    Write-Step "Port 8000 is already listening. Waiting for the backend health check..."
    if (-not (Wait-ForUrl -Url $backendUrl -TimeoutSeconds 20)) {
        throw "Port 8000 is busy but the backend health check never became ready."
    }
    Write-Step "Backend is already running at http://127.0.0.1:8000"
} else {
    $backendArgs = @() + $python.Prefix + @(
        "-m",
        "uvicorn",
        "main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8000"
    )
    $backendProcess = Start-ServiceProcess `
        -Name "backend" `
        -FilePath $python.FilePath `
        -Arguments $backendArgs `
        -WorkingDirectory $repoRoot `
        -StdOutPath $backendOutLog `
        -StdErrPath $backendErrLog

    if (-not (Wait-ForUrl -Url $backendUrl -TimeoutSeconds 45)) {
        throw "Backend did not become ready. Check $backendErrLog"
    }

    $backendStarted = $true
    Write-Step "Backend ready. PID $($backendProcess.Id)"
}

if (Test-HttpReady -Url $frontendUrl) {
    Write-Step "Frontend is already running at $frontendUrl"
} elseif (Test-PortListening -Port 5173) {
    Write-Step "Port 5173 is already listening. Waiting for the frontend to finish booting..."
    if (-not (Wait-ForUrl -Url $frontendUrl -TimeoutSeconds 20)) {
        throw "Port 5173 is busy but the frontend never became ready."
    }
    Write-Step "Frontend is already running at $frontendUrl"
} else {
    $frontendArgs = @(
        "run",
        "dev",
        "--",
        "--host",
        "127.0.0.1",
        "--port",
        "5173"
    )
    $frontendProcess = Start-ServiceProcess `
        -Name "frontend" `
        -FilePath $npmPath `
        -Arguments $frontendArgs `
        -WorkingDirectory $frontendDir `
        -StdOutPath $frontendOutLog `
        -StdErrPath $frontendErrLog

    if (-not (Wait-ForUrl -Url $frontendUrl -TimeoutSeconds 60)) {
        throw "Frontend did not become ready. Check $frontendErrLog"
    }

    $frontendStarted = $true
    Write-Step "Frontend ready. PID $($frontendProcess.Id)"
}

Write-Host ""
Write-Host "VeritAI is live." -ForegroundColor Green
Write-Host "Frontend: $frontendUrl"
Write-Host "Backend : http://127.0.0.1:8000"
Write-Host "Logs    : $backendOutLog, $backendErrLog, $frontendOutLog, $frontendErrLog"

if (-not $NoBrowser) {
    Start-Process $frontendUrl | Out-Null
}

if (-not $backendStarted -and -not $frontendStarted) {
    Write-Step "Nothing new was started because both services were already live."
}
