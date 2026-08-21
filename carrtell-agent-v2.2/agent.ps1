param(
  [Parameter(Position=0)]
  [ValidateSet("SHOP","UX","CUSTOMER","FULL")]
  [string]$Mode = "FULL"
)

$ErrorActionPreference = "Stop"
$Root = (Get-Location).Path

function Run-Step($Title, $Cmd) {
  Write-Host "`n========================================" -ForegroundColor Cyan
  Write-Host " CARRTELL AGENT v2.2 - $Title" -ForegroundColor Cyan
  Write-Host "========================================`n" -ForegroundColor Cyan
  & powershell -NoProfile -ExecutionPolicy Bypass -Command $Cmd
  if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: $Title" -ForegroundColor Red
    Write-Host "Run: npx playwright show-report" -ForegroundColor Yellow
    exit $LASTEXITCODE
  }
  Write-Host "PASSED: $Title" -ForegroundColor Green
}

if ($Mode -eq "SHOP") {
  Run-Step "SHOP + CART JOURNEY" "npx playwright test tests/e2e/shop-cart-v22.spec.ts"
  exit 0
}
if ($Mode -eq "UX") {
  Run-Step "UX SIGNALS" "npx playwright test tests/e2e/ux-v22.spec.ts"
  exit 0
}
if ($Mode -eq "CUSTOMER") {
  Run-Step "CUSTOMER BASELINE" "npx playwright test tests/e2e/customer-journey-v21.spec.ts tests/e2e/shop-cart-v22.spec.ts tests/e2e/ux-v22.spec.ts"
  exit 0
}

Run-Step "TYPECHECK" "npm run typecheck"
Run-Step "BUILD" "npm run build"
Run-Step "ROUTE AUDIT" "npx playwright test tests/e2e/route-audit-v21.spec.ts"
Run-Step "BOOKING" "npx playwright test tests/e2e/booking-flow.spec.ts tests/e2e/booking-e2e-safe.spec.ts"
Run-Step "SHOP + CART" "npx playwright test tests/e2e/shop-cart-v22.spec.ts"
Run-Step "UX SIGNALS" "npx playwright test tests/e2e/ux-v22.spec.ts"
