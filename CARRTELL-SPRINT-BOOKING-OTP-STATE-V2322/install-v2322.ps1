$ErrorActionPreference = 'Stop'

$patchRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $patchRoot
$filesRoot = Join-Path $patchRoot 'files'
$backupRoot = Join-Path $projectRoot ("backup-v2322-" + (Get-Date -Format 'yyyyMMdd-HHmmss'))
$relativeFiles = @(
  'src\pages\BookPage.tsx',
  'tests\e2e\critical-user-journeys-v23.spec.ts'
)

foreach ($relativePath in $relativeFiles) {
  $source = Join-Path $filesRoot $relativePath
  $target = Join-Path $projectRoot $relativePath
  if (-not (Test-Path $source)) { throw "Patch file missing: $relativePath" }

  if (Test-Path $target) {
    $backup = Join-Path $backupRoot $relativePath
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $backup) | Out-Null
    Copy-Item -LiteralPath $target -Destination $backup -Force
  }

  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
  Copy-Item -LiteralPath $source -Destination $target -Force
}

Write-Host 'Carrtell v2.3.22 Booking OTP State Fix installed.' -ForegroundColor Green
Write-Host 'Run: npm run typecheck; npm run build; .\agent.ps1 CRITICAL' -ForegroundColor Yellow
