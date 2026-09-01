$ErrorActionPreference = 'Stop'

$Root = (Get-Location).Path
$PatchRoot = $PSScriptRoot

$AppPath = Join-Path $Root 'App.tsx'
$PackagePath = Join-Path $Root 'package.json'
$AppJsonPath = Join-Path $Root 'app.json'

foreach ($p in @($AppPath, $PackagePath, $AppJsonPath)) {
  if (-not (Test-Path -LiteralPath $p)) {
    throw "Required Carrtell Expo file not found: $p"
  }
}

$currentApp = [IO.File]::ReadAllText($AppPath, [Text.Encoding]::UTF8)
if (-not $currentApp.Contains('Open up App.tsx to start working on your app!') -and -not $currentApp.Contains("from './src/components/BottomNav'")) {
  throw "Current App.tsx is not the reviewed Expo starter. Patch stopped."
}

$backup = Join-Path $Root ('__backup_app_sprint1_' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item $AppPath (Join-Path $backup 'App.tsx') -Force
Copy-Item $AppJsonPath (Join-Path $backup 'app.json') -Force
Copy-Item $PackagePath (Join-Path $backup 'package.json') -Force

Copy-Item (Join-Path $PatchRoot 'files\App.tsx') $AppPath -Force

$srcTarget = Join-Path $Root 'src'
if (-not (Test-Path $srcTarget)) {
  New-Item -ItemType Directory -Path $srcTarget | Out-Null
}
Copy-Item (Join-Path $PatchRoot 'files\src\*') $srcTarget -Recurse -Force

Write-Host ''
Write-Host 'CARRTELL APP SPRINT 1 applied.' -ForegroundColor Green
Write-Host 'No package.json/app.json changes were made.' -ForegroundColor Cyan
Write-Host 'Run:' -ForegroundColor Cyan
Write-Host '  npx tsc --noEmit'
Write-Host '  npx expo start -c'
