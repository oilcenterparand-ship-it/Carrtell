$ErrorActionPreference = "Stop"

Write-Host "Carrtell Mega Menu V3" -ForegroundColor Cyan
if (-not (Test-Path ".\package.json")) {
  Write-Host "Run this installer from the project root." -ForegroundColor Red
  exit 1
}

Write-Host "Run this SQL migration in Supabase first:" -ForegroundColor Yellow
Write-Host "supabase\migrations\202608230002_mega_menu_promotion.sql"
$answer = Read-Host "Has the SQL migration been executed? (Y/N)"
if ($answer -notmatch '^[Yy]$') {
  Write-Host "Installation paused. Run the migration, then start this file again." -ForegroundColor Yellow
  exit 0
}

npm run typecheck
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Build completed. Next: .\agent-category.ps1" -ForegroundColor Green
