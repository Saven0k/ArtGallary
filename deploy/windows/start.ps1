param([switch]$Foreground)

$ErrorActionPreference = 'Stop'
$env:Path = "$(Join-Path $env:APPDATA 'npm');$env:Path"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$config = Join-Path $projectRoot 'deploy\ecosystem.config.cjs'
if (-not (Test-Path (Join-Path $projectRoot 'server\.production.env'))) { throw 'Run node deploy/windows/prepare.cjs first.' }
if (-not (Test-Path (Join-Path $projectRoot 'server\dist\main.js')) -or -not (Test-Path (Join-Path $projectRoot 'frontend\dist\index.html'))) { throw 'Build server and frontend before starting.' }
if (-not $Foreground -and -not (Get-Command pm2.cmd -ErrorAction SilentlyContinue)) { throw 'Install PM2: npm install -g pm2, or use -Foreground.' }
$caddyPath = Join-Path $projectRoot 'deploy\bin\caddy.exe'
if (-not (Test-Path $caddyPath)) {
    $caddyCommand = Get-Command caddy.exe -ErrorAction SilentlyContinue
    if (-not $caddyCommand) { throw 'Place caddy.exe in deploy/bin or add it to PATH.' }
    $caddyPath = $caddyCommand.Source
}
$env:GALLERY_CADDY = $caddyPath

$webSettings = & node -e 'process.stdout.write(JSON.stringify(require(process.argv[1]).apps[1].env))' $config
if ($LASTEXITCODE -ne 0) { throw 'Production configuration is invalid.' }
($webSettings | ConvertFrom-Json).PSObject.Properties | ForEach-Object {
    [Environment]::SetEnvironmentVariable($_.Name, [string]$_.Value, 'Process')
}
& $caddyPath validate --config (Join-Path $projectRoot 'deploy\Caddyfile')
if ($LASTEXITCODE -ne 0) { throw "Caddy configuration is invalid: $LASTEXITCODE" }

if ($Foreground) {
    if (Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue) { throw 'Port 5000 is occupied. Stop the existing API before starting.' }
    $env:NODE_ENV = 'production'
    $env:PORT = '5000'
    $env:HTTP_HOST = '127.0.0.1'
    $env:TRUST_PROXY = 'true'
    $env:COOKIE_SECURE = if ($env:GALLERY_ADDRESS -eq ':80') { 'false' } else { 'true' }
    $api = Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList 'dist/main.js' -WorkingDirectory (Join-Path $projectRoot 'server') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $projectRoot 'server\logs\foreground-out.log') -RedirectStandardError (Join-Path $projectRoot 'server\logs\foreground-error.log')
    try {
        & $caddyPath run --config (Join-Path $projectRoot 'deploy\Caddyfile')
        if ($LASTEXITCODE -ne 0) { throw "Caddy stopped with exit code $LASTEXITCODE" }
    } finally {
        if (-not $api.HasExited) { Stop-Process -Id $api.Id -ErrorAction SilentlyContinue }
    }
    return
}

& pm2.cmd startOrRestart $config --update-env
if ($LASTEXITCODE -ne 0) { throw "PM2 start failed: $LASTEXITCODE" }
& pm2.cmd save
if ($LASTEXITCODE -ne 0) { throw "PM2 save failed: $LASTEXITCODE" }
Write-Host 'Check pm2 status, then open the FRONTEND_URL from server/.production.env.'
