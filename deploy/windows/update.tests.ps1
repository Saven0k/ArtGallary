$ErrorActionPreference = 'Stop'
$updatePath = Join-Path $PSScriptRoot 'update.ps1'
$initialLocation = (Get-Location).Path
$parseErrors = $null
[void][System.Management.Automation.Language.Parser]::ParseFile($updatePath, [ref]$null, [ref]$parseErrors)
if ($parseErrors.Count -gt 0) { throw $parseErrors[0].Message }

function Invoke-Stub {
    $script:callCount++
    $global:LASTEXITCODE = if ($script:callCount -eq $script:failureAt) { 17 } else { 0 }
}

function global:git { Invoke-Stub }
function global:npm.cmd { Invoke-Stub }
function global:pm2.cmd { Invoke-Stub }

try {
    foreach ($failure in 1..6) {
        $script:callCount = 0
        $script:failureAt = $failure
        $caught = $false
        try { . $updatePath } catch { $caught = $true }
        if (-not $caught -or $script:callCount -ne $failure) {
            throw "Update continued after failed command $failure"
        }
        if ((Get-Location).Path -ne $initialLocation) { throw 'Working directory was not restored' }
    }
    $script:callCount = 0
    $script:failureAt = 0
    . $updatePath
    if ($script:callCount -ne 6) { throw 'Successful update did not finish' }
    Write-Host 'Update checks passed: six failure paths and successful completion.'
} finally {
    Remove-Item -LiteralPath 'Function:\git', 'Function:\npm.cmd', 'Function:\pm2.cmd'
}
