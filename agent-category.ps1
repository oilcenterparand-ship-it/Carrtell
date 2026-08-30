$ErrorActionPreference = "Stop"

Write-Host "STRICT CHECK: category hover, dynamic card images, home banners, mobile rail and bottom-nav safety." -ForegroundColor Yellow

if ([string]::IsNullOrWhiteSpace($env:CARRTELL_ADMIN_USERNAME)) {
  $env:CARRTELL_ADMIN_USERNAME = (Read-Host "Carrtell admin username").Trim()
}

if ([string]::IsNullOrWhiteSpace($env:CARRTELL_ADMIN_PASSWORD)) {
  $secureAdminPassword = Read-Host "Carrtell admin password (hidden)" -AsSecureString
  $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureAdminPassword)
  try {
    $env:CARRTELL_ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
  }
}

if ([string]::IsNullOrWhiteSpace($env:CARRTELL_ADMIN_USERNAME) -or [string]::IsNullOrWhiteSpace($env:CARRTELL_ADMIN_PASSWORD)) {
  Write-Host "Admin credentials are required for the real admin persona test." -ForegroundColor Red
  exit 2
}

function Run-Step($Title, $Command) {
  Write-Host "" 
  Write-Host "CARRTELL CATEGORY AGENT - $Title" -ForegroundColor Cyan
  powershell -NoProfile -ExecutionPolicy Bypass -Command $Command
  if ($LASTEXITCODE -ne 0) {
    $stepExitCode = $LASTEXITCODE
    Write-Host "FAILED: $Title" -ForegroundColor Red
    Write-Host "Send the first FAILED output and Playwright report to ChatGPT." -ForegroundColor Yellow
    throw "Agent step failed with exit code $stepExitCode`: $Title"
  }
  Write-Host "PASSED: $Title" -ForegroundColor Green
}

$agentFailed = $false
try {
  Run-Step "TYPECHECK" "npm run typecheck"
  Run-Step "PRODUCTION BUILD" "npm run build"
  Run-Step "DYNAMIC CATEGORY CUSTOMER JOURNEY" "npx playwright test tests/e2e/dynamic-category-journey.spec.ts --workers=1"
  Run-Step "DYNAMIC CASCADING MENU + HOVER + HOME PROMO BANNERS + MOBILE SAFETY" "npx playwright test tests/e2e/dynamic-category-mega-menu.spec.ts --workers=1"
  Run-Step "DYNAMIC CATEGORY SOURCE AND CYCLE SAFETY" "npx playwright test tests/e2e/home-category-agent-source-contract.spec.ts -c playwright.source.config.ts --workers=1"
  Run-Step "INDUSTRIAL REGRESSION" "npx playwright test tests/e2e/industrial-diesel-catalog.spec.ts --workers=1"
  Run-Step "CUSTOMER AND ADMIN LOGIN FREEZE REGRESSION" "npx playwright test tests/e2e/auth-login-freeze.spec.ts --workers=1"
  Run-Step "ADMIN CATEGORY AND PRODUCT PERSONA" "npx playwright test tests/e2e/persona-admin.spec.ts -c playwright.persona.config.ts --project=desktop-chrome --workers=1"
  Write-Host "CATEGORY SPRINT PASSED" -ForegroundColor Green
}
catch {
  $agentFailed = $true
  Write-Host $_.Exception.Message -ForegroundColor Red
}
finally {
  Remove-Item Env:CARRTELL_ADMIN_USERNAME -ErrorAction SilentlyContinue
  Remove-Item Env:CARRTELL_ADMIN_PASSWORD -ErrorAction SilentlyContinue
}

if ($agentFailed) { exit 1 }
