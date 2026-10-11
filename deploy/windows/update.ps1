$ErrorActionPreference = 'Stop'
$env:Path = "$(Join-Path $env:APPDATA 'npm');$env:Path"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

function Invoke-CheckedCommand {
    param([string]$Command, [string[]]$Arguments)
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Command failed with exit code $LASTEXITCODE"
    }
}

Push-Location $projectRoot
try {
    Invoke-CheckedCommand 'git' @('pull', '--ff-only')
    Set-Location (Join-Path $projectRoot 'server')
    Invoke-CheckedCommand 'npm.cmd' @('ci')
    Invoke-CheckedCommand 'npm.cmd' @('run', 'build')
    Set-Location (Join-Path $projectRoot 'frontend')
    Invoke-CheckedCommand 'npm.cmd' @('ci')
    Invoke-CheckedCommand 'npm.cmd' @('run', 'build')
    Invoke-CheckedCommand 'powershell.exe' @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $projectRoot 'deploy\windows\start.ps1'))
    Write-Host 'curl http://localhost/api/health   http://localhost/'
} finally {
    Pop-Location
}
