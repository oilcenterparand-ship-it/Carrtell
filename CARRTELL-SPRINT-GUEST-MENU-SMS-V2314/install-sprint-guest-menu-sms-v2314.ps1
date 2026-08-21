$ErrorActionPreference = "Stop"

$patchRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = (Get-Location).Path

$required = @(
  "src\components\Layout.tsx",
  "supabase\functions\send-sms-hook\index.ts",
  "tests\e2e\critical-user-journeys-v23.spec.ts"
)

foreach ($relative in $required) {
  $target = Join-Path $projectRoot $relative
  if (-not (Test-Path $target)) {
    throw "Required real project file not found: $target"
  }
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = Join-Path $projectRoot "__sprint_guest_menu_sms_v2314_backup__$stamp"

foreach ($relative in $required) {
  $source = Join-Path $patchRoot ("files\" + $relative)
  $target = Join-Path $projectRoot $relative
  $backupTarget = Join-Path $backup $relative

  New-Item -ItemType Directory -Force -Path (Split-Path $backupTarget) | Out-Null
  Copy-Item $target $backupTarget -Force
  Copy-Item $source $target -Force
  Write-Host "UPDATED: $relative" -ForegroundColor Green
}

Write-Host ""
Write-Host "Carrtell Guest Menu + SMS v2.3.14 installed." -ForegroundColor Cyan
Write-Host "Backup: $backup"
Write-Host ""
Write-Host "Local verification:" -ForegroundColor Yellow
Write-Host "  npm run typecheck"
Write-Host "  npm run build"
Write-Host "  .\agent.ps1 CRITICAL"
Write-Host ""
Write-Host "Real SMS cloud setup:" -ForegroundColor Yellow
Write-Host "  & `".\CARRTELL-SPRINT-GUEST-MENU-SMS-V2314\setup-real-sms-v2314.ps1`""
