# Обновление приложения на Windows-ПК: git pull → сборка → перезапуск API.
# Запуск из PowerShell:  powershell -ExecutionPolicy Bypass -File deploy\windows\update.ps1
$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')

Set-Location $root
git pull

Set-Location (Join-Path $root 'server')
npm ci
npm run build

Set-Location (Join-Path $root 'frontend')
npm ci
npm run build          # использует frontend/.env.production (VITE_API_URL=/api)

pm2 restart gallery-api --update-env
Write-Host "`nГотово. Проверка: curl http://localhost/api/health  (или откройте http://localhost/)"
