$ErrorActionPreference = "Stop"
$Source = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = (Get-Location).Path
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = Join-Path $Root "__agent_v22_backup__$stamp"
New-Item -ItemType Directory -Force -Path $backup | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $Root "tests\e2e") | Out-Null

if(Test-Path ".\agent.ps1"){ Copy-Item ".\agent.ps1" $backup -Force }

Copy-Item (Join-Path $Source "agent.ps1") ".\agent.ps1" -Force
Copy-Item (Join-Path $Source "tests\e2e\shop-cart-v22.spec.ts") ".\tests\e2e\shop-cart-v22.spec.ts" -Force
Copy-Item (Join-Path $Source "tests\e2e\ux-v22.spec.ts") ".\tests\e2e\ux-v22.spec.ts" -Force

Write-Host "Carrtell Agent v2.2 installed." -ForegroundColor Green
Write-Host "Backup: $backup"
Write-Host "Next: .\agent.ps1 SHOP"
