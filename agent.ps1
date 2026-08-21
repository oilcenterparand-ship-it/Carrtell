param(
  [Parameter(Position=0)]
  [ValidateSet("CRITICAL","BOOKING","SHOP","UX","CUSTOMER","CUSTOMER3","VISUAL","ADMIN","TECHNICIAN","PERSONAS","PRODUCTION","SMS","SMSLOGIN","FINAL","FULL")]
  [string]$Mode = "FULL"
)

$ErrorActionPreference = "Stop"

function Run-Step($Title, $Cmd) {
  Write-Host "`n========================================" -ForegroundColor Cyan
  Write-Host " CARRTELL AGENT v3.2 - $Title" -ForegroundColor Cyan
  Write-Host "========================================`n" -ForegroundColor Cyan
  & powershell -NoProfile -ExecutionPolicy Bypass -Command $Cmd
  if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: $Title" -ForegroundColor Red
    Write-Host "Run: npx playwright show-report" -ForegroundColor Yellow
    exit $LASTEXITCODE
  }
  Write-Host "PASSED: $Title" -ForegroundColor Green
}

function Fresh-Build {
  Run-Step "TYPECHECK" "npm run typecheck"
  Run-Step "FRESH PRODUCTION BUILD" "npm run build"
}

if ($Mode -eq "CRITICAL") {
  Fresh-Build
  Run-Step "CRITICAL USER JOURNEYS" "npx playwright test tests/e2e/critical-user-journeys-v23.spec.ts tests/e2e/auth-account-regression-v2319.spec.ts"
  exit 0
}


if ($Mode -eq "PRODUCTION") {
  Fresh-Build
  Run-Step "PRODUCTION BROWSER + SERVICE WORKER" "npx playwright test -c playwright.production.config.ts"
  Write-Host "Report: playwright-report-production" -ForegroundColor Yellow
  exit 0
}

if ($Mode -eq "VISUAL") {
  Fresh-Build
  Run-Step "VISUAL UX - CUSTOMER" "npx playwright test tests/e2e/persona-customer.spec.ts -c playwright.persona.config.ts --project=android-chrome"
  Write-Host "Report: reports\carrtell-agent\latest.md" -ForegroundColor Yellow
  Write-Host "Screenshots: playwright-report-persona" -ForegroundColor Yellow
  exit 0
}

if ($Mode -eq "CUSTOMER3") {
  Fresh-Build
  Run-Step "PERSONA QA - CUSTOMER" "npx playwright test tests/e2e/persona-customer.spec.ts -c playwright.persona.config.ts"
  exit 0
}
if ($Mode -eq "ADMIN") {
  Fresh-Build
  Run-Step "PERSONA QA - ADMIN" "npx playwright test tests/e2e/persona-admin.spec.ts -c playwright.persona.config.ts"
  exit 0
}
if ($Mode -eq "TECHNICIAN") {
  Fresh-Build
  Run-Step "PERSONA QA - TECHNICIAN" "npx playwright test tests/e2e/persona-technician.spec.ts -c playwright.persona.config.ts"
  exit 0
}
if ($Mode -eq "PERSONAS") {
  Fresh-Build
  Run-Step "PRODUCTION BROWSER + SERVICE WORKER" "npx playwright test -c playwright.production.config.ts"
  Run-Step "PERSONA QA - CUSTOMER + ADMIN + TECHNICIAN" "npx playwright test -c playwright.persona.config.ts"
  Write-Host "Report: reports\carrtell-agent\latest.md" -ForegroundColor Yellow
  exit 0
}

if ($Mode -eq "SMS") {
  $phone = Read-Host "شماره موبایل واقعی تست را وارد کن (09xxxxxxxxx)"
  if ($phone -notmatch '^09\d{9}$') {
    Write-Host "FAILED: شماره موبایل باید به شکل 09xxxxxxxxx باشد." -ForegroundColor Red
    exit 2
  }

  $env:CARRTELL_SMS_TEST_PHONE = $phone
  Fresh-Build
  Run-Step "REAL SMS OTP DIAGNOSTIC" "npx playwright test tests/e2e/sms-live-v2315.spec.ts --project=desktop-chrome --workers=1"
  Remove-Item Env:CARRTELL_SMS_TEST_PHONE -ErrorAction SilentlyContinue
  exit 0
}

if ($Mode -eq "SMSLOGIN") {
  Fresh-Build
  Run-Step "REAL OTP VERIFY + LOGIN DIAGNOSTIC" "node tests/e2e/sms-login-live-v2317.mjs"
  exit 0
}

if ($Mode -eq "BOOKING") {
  Fresh-Build
  Run-Step "BOOKING STRUCTURE + CRITICAL FLOW" "npx playwright test tests/e2e/booking-flow.spec.ts tests/e2e/critical-user-journeys-v23.spec.ts -g 'booking|service -> vehicle'"
  exit 0
}
if ($Mode -eq "SHOP") {
  Fresh-Build
  Run-Step "SHOP + CART + HEADER CART" "npx playwright test tests/e2e/shop-cart-v22.spec.ts tests/e2e/critical-user-journeys-v23.spec.ts -g 'shop|cart|MiniCart'"
  exit 0
}
if ($Mode -eq "UX") {
  Fresh-Build
  Run-Step "UX SIGNALS" "npx playwright test tests/e2e/ux-v22.spec.ts tests/e2e/critical-user-journeys-v23.spec.ts -g 'menu|mobile|public flow'"
  exit 0
}

if ($Mode -eq "FINAL") {
  Fresh-Build
  Run-Step "PRODUCTION BROWSER + SERVICE WORKER" "npx playwright test -c playwright.production.config.ts"
  Run-Step "PRODUCTION SAFETY GATE" "node scripts/final-readiness-v2318.mjs"
  Run-Step "ROUTE + RUNTIME AUDIT" "npx playwright test tests/e2e/route-audit-v21.spec.ts --workers=2"
  Run-Step "CRITICAL CUSTOMER JOURNEYS" "npx playwright test tests/e2e/critical-user-journeys-v23.spec.ts tests/e2e/auth-account-regression-v2319.spec.ts --workers=2"
  Run-Step "SHOP + CART CUSTOMER JOURNEY" "npx playwright test tests/e2e/shop-cart-v22.spec.ts --workers=2"
  Run-Step "BOOKING STRUCTURE" "npx playwright test tests/e2e/booking-flow.spec.ts --workers=2"
  Run-Step "MOBILE NAVIGATION" "npx playwright test tests/e2e/mobile-nav.spec.ts --workers=2"
  Run-Step "UX SIGNALS" "npx playwright test tests/e2e/ux-v22.spec.ts --workers=2"
  Run-Step "SMOKE ROUTES" "npx playwright test tests/e2e/smoke.spec.ts --workers=2"
  Run-Step "FINAL CUSTOMER ACCEPTANCE" "npx playwright test tests/e2e/final-customer-acceptance-v2318.spec.ts --workers=2"
  Write-Host ""
  Write-Host "========================================" -ForegroundColor Green
  Write-Host " CARRTELL FINAL AUTOMATED QA: PASSED" -ForegroundColor Green
  Write-Host "========================================" -ForegroundColor Green
  Write-Host ""
  Write-Host "برای Production Release هنوز تست Live Auth لازم است:" -ForegroundColor Yellow
  Write-Host "  .\agent.ps1 SMSLOGIN" -ForegroundColor Yellow
  Write-Host "و درگاه پرداخت واقعی/Callback نیز پس از اتصال IPG باید جداگانه تست شود." -ForegroundColor Yellow
  exit 0
}

if ($Mode -eq "CUSTOMER") {
  Fresh-Build
  Run-Step "CUSTOMER JOURNEYS" "npx playwright test tests/e2e/customer-journey-v21.spec.ts tests/e2e/shop-cart-v22.spec.ts tests/e2e/booking-flow.spec.ts tests/e2e/critical-user-journeys-v23.spec.ts"
  exit 0
}

Fresh-Build
Run-Step "PRODUCTION BROWSER + SERVICE WORKER" "npx playwright test -c playwright.production.config.ts"
Run-Step "ROUTE AUDIT" "npx playwright test tests/e2e/route-audit-v21.spec.ts"
Run-Step "CRITICAL USER JOURNEYS" "npx playwright test tests/e2e/critical-user-journeys-v23.spec.ts"
Run-Step "BOOKING STRUCTURE" "npx playwright test tests/e2e/booking-flow.spec.ts"
Run-Step "SHOP + CART" "npx playwright test tests/e2e/shop-cart-v22.spec.ts"
Run-Step "UX SIGNALS" "npx playwright test tests/e2e/ux-v22.spec.ts"
