$ErrorActionPreference = "Stop"
$ProjectPath = "D:\carrtell\Carrtell-v0.2-current\project"

Set-Location $ProjectPath
Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install

Write-Host "Running TypeScript check..." -ForegroundColor Cyan
npm run typecheck

Write-Host "Removing old dist..." -ForegroundColor Cyan
Remove-Item -Recurse -Force .\dist -ErrorAction SilentlyContinue

Write-Host "Building Carrtell..." -ForegroundColor Cyan
npm run build

Write-Host "Build completed. Upload the CONTENTS of dist to public_html." -ForegroundColor Green
