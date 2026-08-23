$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\package.json")) {
  Write-Host "خطا: این فایل باید از ریشه پروژه Carrtell اجرا شود." -ForegroundColor Red
  exit 1
}

Write-Host "Carrtell Industrial/Diesel V1" -ForegroundColor Cyan
Write-Host "1) فایل SQL زیر را یک‌بار در Supabase SQL Editor اجرا کن:" -ForegroundColor Yellow
Write-Host "supabase\migrations\202608230001_dynamic_product_category_tree.sql"
$answer = Read-Host "SQL اجرا شده است؟ (Y/N)"
if ($answer -notmatch '^[Yy]$') {
  Write-Host "نصب متوقف شد؛ ابتدا SQL را اجرا کن و دوباره این فایل را باز کن." -ForegroundColor Yellow
  exit 2
}

npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run typecheck
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "نصب و Build موفق بود." -ForegroundColor Green
Write-Host "حالا تست هوشمند را اجرا کن: .\agent.ps1 INDUSTRIAL" -ForegroundColor Cyan
