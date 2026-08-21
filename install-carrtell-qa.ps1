$ErrorActionPreference = "Stop"

Write-Host "Installing Carrtell QA Agent..." -ForegroundColor Cyan

npm install -D @playwright/test
npx playwright install chromium

npm pkg set "scripts.qa:e2e=playwright test"
npm pkg set "scripts.qa= node scripts/qa-agent.mjs"

Write-Host ""
Write-Host "QA Agent installed." -ForegroundColor Green
Write-Host "Run: npm run build" -ForegroundColor Yellow
Write-Host "Then: npm run qa:e2e" -ForegroundColor Yellow
Write-Host "Or full guard: npm run qa" -ForegroundColor Yellow
