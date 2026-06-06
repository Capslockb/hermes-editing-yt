#!/usr/bin/env pwsh
# ============================================================================
#  Veo Editor — Windows one-shot installer
# ============================================================================
#  Downloads the repo, runs the Python installer with --non-interactive.
#
#  Usage (PowerShell 5+):
#    iwr -useb https://raw.githubusercontent.com/Capslockb/veo-editor/main/installer/install.ps1 | iex
#
#  Or save first:
#    Invoke-WebRequest -Uri .../install.ps1 -OutFile install.ps1
#    .\install.ps1
#
#  Override defaults:
#    $env:OCEANUS_OUTPUT_DIR = "D:\renders"
#    $env:OCEANUS_WHISPER_URL = "http://127.0.0.1:51746/transcribe"
#    .\install.ps1
# ============================================================================

$ErrorActionPreference = "Stop"

$RepoUrl   = "https://github.com/Capslockb/veo-editor.git"
$RepoName  = "veo-editor"
$Branch    = "main"
$InstallDir = Join-Path $env:USERPROFILE "code\$RepoName"
# Override by setting $env:VEO_INSTALLER_ARGS before running this script.
# Example:  $env:VEO_INSTALLER_ARGS = "--non-interactive --skip-deps"
$InstallerArgs = if ($env:VEO_INSTALLER_ARGS) { $env:VEO_INSTALLER_ARGS } else { "--non-interactive" }

function Write-Status($msg, $color = "Cyan") {
    Write-Host "[$($(Get-Date).ToString('HH:mm:ss'))] " -NoNewline -Color DarkGray
    Write-Host $msg -Color $color
}

Write-Status "Veo Editor — Windows one-shot installer" "Green"
Write-Status "Target: $InstallDir"

# --- 1. pick a Python -------------------------------------------------------
$py = $null
foreach ($candidate in @("py -3", "python", "python3", "py")) {
    try {
        $ver = & $candidate.Split()[0] $candidate.Split()[1..99] -c "import sys; print(sys.version_info.major, sys.version_info.minor)" 2>$null
        if ($LASTEXITCODE -eq 0 -and $ver) {
            $parts = $ver -split "\s+"
            $maj = [int]$parts[-2]; $min = [int]$parts[-1]
            if ($maj -ge 3 -and $min -ge 10) {
                $py = $candidate
                break
            }
        }
    } catch { }
}
if (-not $py) {
    Write-Status "Python 3.10+ not found. Install from https://python.org/downloads/ first." "Red"
    exit 2
}
Write-Status "Using Python: $py"

# --- 2. git available? ------------------------------------------------------
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Status "git not on PATH. Install Git for Windows first: https://git-scm.com/download/win" "Red"
    exit 2
}

# --- 3. clone or update the repo -------------------------------------------
if (Test-Path $InstallDir) {
    Write-Status "Existing install at $InstallDir — pulling latest" "Yellow"
    Push-Location $InstallDir
    try {
        git pull --rebase --autostash | Out-Host
    } catch {
        Write-Status "git pull failed: $_" "Red"
        Pop-Location
        exit 3
    }
    Pop-Location
} else {
    Write-Status "Cloning $RepoUrl → $InstallDir"
    New-Item -ItemType Directory -Force -Path (Split-Path $InstallDir) | Out-Null
    git clone --depth 1 --branch $Branch $RepoUrl $InstallDir
    if ($LASTEXITCODE -ne 0) {
        Write-Status "git clone failed" "Red"
        exit 3
    }
}

# --- 4. ffmpeg check --------------------------------------------------------
$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
if (-not $ffmpeg) {
    Write-Status "ffmpeg not found. Install via:" "Yellow"
    Write-Status "  choco install ffmpeg   OR   scoop install ffmpeg" "Yellow"
    Write-Status "(continuing — autocut/autoedit will fail without ffmpeg)" "Yellow"
} else {
    Write-Status "ffmpeg found: $($ffmpeg.Source)" "Green"
}

# --- 5. run the Python installer -------------------------------------------
Write-Status "Launching installer/install.py" "Green"
Push-Location $InstallDir
try {
    # Split the args string on whitespace — keeps the call simple.
    $argList = $InstallerArgs -split "\s+"
    & $py installer/install.py @argList
    $rc = $LASTEXITCODE
} finally {
    Pop-Location
}

if ($rc -ne 0) {
    Write-Status "Installer exited with code $rc" "Red"
    Write-Status "Re-run without --non-interactive for the TUI:  $py installer/install.py" "Yellow"
    exit $rc
}

Write-Status "Done. Try:  hermes mcp test oceanus" "Green"
