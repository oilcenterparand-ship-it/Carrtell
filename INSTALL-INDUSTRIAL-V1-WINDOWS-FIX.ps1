$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\package.json")) {
  Write-Host "ERROR: Run this script from the Carrtell project root." -ForegroundColor Red
  exit 1
}

Write-Host "Carrtell Industrial/Diesel V1 Installer" -ForegroundColor Cyan
Write-Host "Run this SQL file in Supabase SQL Editor first:" -ForegroundColor Yellow
Write-Host "supabase\migrations\202608230001_dynamic_product_category_tree.sql"
$answer = Read-Host "Has the SQL migration been executed? (Y/N)"

if ($answer -notmatch "^[Yy]$") {
  Write-Host "Installation stopped. Run the SQL migration and try again." -ForegroundColor Yellow
  exit 2
}

Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Running TypeScript validation..." -ForegroundColor Cyan
npm run typecheck
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Creating production build..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Installation and build completed successfully." -ForegroundColor Green
Write-Host "Next command: .\agent.ps1 INDUSTRIAL" -ForegroundColor Cyan
