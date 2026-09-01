$ErrorActionPreference = 'Stop'

$Root = (Get-Location).Path
$PatchRoot = $PSScriptRoot

$HomePath = Join-Path $Root 'src\screens\HomeScreen.tsx'
$NavPath = Join-Path $Root 'src\components\BottomNav.tsx'
$ColorsPath = Join-Path $Root 'src\theme\colors.ts'

foreach ($p in @($HomePath, $NavPath, $ColorsPath)) {
  if (-not (Test-Path -LiteralPath $p)) {
    throw "Required Sprint 1 file not found: $p"
  }
}

$currentHome = [IO.File]::ReadAllText($HomePath, [Text.Encoding]::UTF8)
if (-not $currentHome.Contains('دسته‌بندی‌های پرکاربرد')) {
  throw "Current HomeScreen does not match reviewed Sprint 1 base. Patch stopped."
}

$backup = Join-Path $Root ('__backup_app_ui_110_' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null

Copy-Item $HomePath (Join-Path $backup 'HomeScreen.tsx') -Force
Copy-Item $NavPath (Join-Path $backup 'BottomNav.tsx') -Force
Copy-Item $ColorsPath (Join-Path $backup 'colors.ts') -Force

Copy-Item (Join-Path $PatchRoot 'files\src\screens\HomeScreen.tsx') $HomePath -Force
Copy-Item (Join-Path $PatchRoot 'files\src\components\BottomNav.tsx') $NavPath -Force
Copy-Item (Join-Path $PatchRoot 'files\src\theme\colors.ts') $ColorsPath -Force

Write-Host ''
Write-Host 'CARRTELL APP UI REFRESH V1.1.0 applied.' -ForegroundColor Green
Write-Host 'Changed only HomeScreen, BottomNav and colors.' -ForegroundColor Cyan
Write-Host 'Run:'
Write-Host '  npx tsc --noEmit'
Write-Host '  npx expo start -c'
