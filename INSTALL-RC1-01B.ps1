$ErrorActionPreference = 'Stop'
Write-Host 'Carrtell RC1-01B installer' -ForegroundColor Cyan
Write-Host 'این فایل را از ریشه پروژه اجرا کنید.'
if (-not (Test-Path '.\package.json')) { throw 'package.json پیدا نشد؛ فایل را داخل ریشه پروژه قرار دهید.' }
npm install
npm run typecheck
npm run build
Write-Host 'Build آماده است. محتویات dist را در public_html آپلود کنید.' -ForegroundColor Green
