param(
  [string]$ProjectRoot = "D:\carrtell\Carrtell-v0.2-current\project"
)

$ErrorActionPreference = "Stop"
Set-Location $ProjectRoot

$expectedBranch = "sprint/guest-checkout-search-car-picker"
$currentBranch = (git branch --show-current).Trim()

if ($currentBranch -ne $expectedBranch) {
  throw "Wrong branch. Expected $expectedBranch but current branch is $currentBranch"
}

$trackedChanges = (git status --porcelain --untracked-files=no)
if ($trackedChanges) {
  throw "Tracked working-tree changes already exist. Commit/stash them before applying this sprint."
}

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  throw "Node.js was not found in PATH."
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Applying Carrtell Sprint V2..." -ForegroundColor Cyan
node (Join-Path $scriptDir "APPLY-SPRINT-GUEST-CHECKOUT.mjs") $ProjectRoot
if ($LASTEXITCODE -ne 0) {
  throw "Node patcher failed."
}

Copy-Item (Join-Path $scriptDir "202608140001_guest_checkout_service.sql") (Join-Path $ProjectRoot "supabase\migrations\202608140001_guest_checkout_service.sql") -Force
Copy-Item (Join-Path $scriptDir "README-SPRINT-GUEST-CHECKOUT-FA.md") (Join-Path $ProjectRoot "README-SPRINT-GUEST-CHECKOUT-FA.md") -Force
Copy-Item (Join-Path $scriptDir "PATCH-MANIFEST-SPRINT-GUEST-CHECKOUT.md") (Join-Path $ProjectRoot "PATCH-MANIFEST-SPRINT-GUEST-CHECKOUT.md") -Force

Write-Host ""
Write-Host "Running typecheck..." -ForegroundColor Cyan
npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "Typecheck failed." }

Write-Host ""
Write-Host "Running build..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build failed." }

Write-Host ""
Write-Host "Running git diff --check..." -ForegroundColor Cyan
git diff --check
if ($LASTEXITCODE -ne 0) { throw "git diff --check failed." }

Write-Host ""
Write-Host "PATCH V2 APPLIED SUCCESSFULLY" -ForegroundColor Green
Write-Host "Do NOT commit or deploy yet. Send the output and git status --short first." -ForegroundColor Yellow
git status --short
