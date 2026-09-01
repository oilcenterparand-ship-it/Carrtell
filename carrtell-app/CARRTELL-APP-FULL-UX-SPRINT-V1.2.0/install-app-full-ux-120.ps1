$ErrorActionPreference = 'Stop'

$Root = (Get-Location).Path
$PatchRoot = $PSScriptRoot

$Required = @(
  (Join-Path $Root 'App.tsx'),
  (Join-Path $Root 'src\screens\HomeScreen.tsx'),
  (Join-Path $Root 'src\components\BottomNav.tsx'),
  (Join-Path $Root 'src\theme\colors.ts')
)

foreach ($Path in $Required) {
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Required Carrtell app file not found: $Path"
  }
}

$currentHome = [IO.File]::ReadAllText((Join-Path $Root 'src\screens\HomeScreen.tsx'), [Text.Encoding]::UTF8)
if (-not $currentHome.Contains('خودروی خودت را انتخاب کن')) {
  throw 'Current Carrtell HomeScreen marker was not found. Patch stopped.'
}

$backup = Join-Path $Root ('__backup_app_full_ux_120_' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null

Copy-Item (Join-Path $Root 'App.tsx') (Join-Path $backup 'App.tsx') -Force
Copy-Item (Join-Path $Root 'src') (Join-Path $backup 'src') -Recurse -Force

Copy-Item (Join-Path $PatchRoot 'files\App.tsx') (Join-Path $Root 'App.tsx') -Force
Copy-Item (Join-Path $PatchRoot 'files\src\*') (Join-Path $Root 'src') -Recurse -Force

Write-Host ''
Write-Host 'CARRTELL APP FULL UX SPRINT V1.2.0 applied.' -ForegroundColor Green
Write-Host 'No package.json or app.json changes were made.' -ForegroundColor Cyan
Write-Host 'Run:'
Write-Host '  npx tsc --noEmit'
Write-Host '  npx expo start -c'
