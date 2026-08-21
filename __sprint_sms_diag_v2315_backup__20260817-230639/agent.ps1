param(
  [Parameter(Position=0)]
  [ValidateSet("CRITICAL","BOOKING","SHOP","UX","CUSTOMER","FULL")]
  [string]$Mode = "FULL"
)

$ErrorActionPreference = "Stop"

function Run-Step($Title, $Cmd) {
  Write-Host "`n========================================" -ForegroundColor Cyan
  Write-Host " CARRTELL AGENT v2.3 - $Title" -ForegroundColor Cyan
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
  Run-Step "CRITICAL USER JOURNEYS" "npx playwright test tests/e2e/critical-user-journeys-v23.spec.ts"
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
if ($Mode -eq "CUSTOMER") {
  Fresh-Build
  Run-Step "CUSTOMER JOURNEYS" "npx playwright test tests/e2e/customer-journey-v21.spec.ts tests/e2e/shop-cart-v22.spec.ts tests/e2e/booking-flow.spec.ts tests/e2e/critical-user-journeys-v23.spec.ts"
  exit 0
}

Fresh-Build
Run-Step "ROUTE AUDIT" "npx playwright test tests/e2e/route-audit-v21.spec.ts"
Run-Step "CRITICAL USER JOURNEYS" "npx playwright test tests/e2e/critical-user-journeys-v23.spec.ts"
Run-Step "BOOKING STRUCTURE" "npx playwright test tests/e2e/booking-flow.spec.ts"
Run-Step "SHOP + CART" "npx playwright test tests/e2e/shop-cart-v22.spec.ts"
Run-Step "UX SIGNALS" "npx playwright test tests/e2e/ux-v22.spec.ts"
