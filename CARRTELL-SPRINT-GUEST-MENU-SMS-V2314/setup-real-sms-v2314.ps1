param(
  [string]$ProjectRef = "",
  [string]$Template = "carrtelllogin"
)

$ErrorActionPreference = "Stop"

function ConvertFrom-Secure([Security.SecureString]$Value) {
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
  throw "Supabase CLI پیدا نشد. ابتدا CLI را نصب کنید."
}

if (-not $ProjectRef) {
  $ProjectRef = Read-Host "Supabase Project Ref"
}
if (-not $ProjectRef) { throw "Project Ref الزامی است." }

Write-Host ""
Write-Host "مرحله 1/3 - Link + Deploy Function" -ForegroundColor Cyan
supabase link --project-ref $ProjectRef
if ($LASTEXITCODE -ne 0) { throw "supabase link failed" }

$apiKeySecure = Read-Host "Kavenegar API Key" -AsSecureString
$apiKey = ConvertFrom-Secure $apiKeySecure

$tempEnv = Join-Path $env:TEMP ("carrtell-sms-" + [guid]::NewGuid().ToString("N") + ".env")
try {
  @"
KAVENEGAR_API_KEY=$apiKey
KAVENEGAR_TEMPLATE=$Template
"@ | Set-Content -Path $tempEnv -Encoding UTF8

  supabase secrets set --env-file $tempEnv
  if ($LASTEXITCODE -ne 0) { throw "supabase secrets set failed" }
}
finally {
  if (Test-Path $tempEnv) { Remove-Item $tempEnv -Force }
  $apiKey = $null
}

supabase functions deploy send-sms-hook --no-verify-jwt
if ($LASTEXITCODE -ne 0) { throw "send-sms-hook deploy failed" }

$hookUrl = "https://$ProjectRef.supabase.co/functions/v1/send-sms-hook"
Write-Host ""
Write-Host "Function deployed:" -ForegroundColor Green
Write-Host $hookUrl
Write-Host ""
Write-Host "مرحله 2/3 - در Supabase Dashboard:" -ForegroundColor Yellow
Write-Host "Authentication > Hooks > Send SMS > HTTPS"
Write-Host "URL = $hookUrl"
Write-Host "Generate Secret را بزن و Secret را کپی کن."
Write-Host ""
Write-Host "بعد از ساخت Hook، Enter بزن."
Read-Host | Out-Null

Write-Host "مرحله 3/3 - ذخیره Hook Secret" -ForegroundColor Cyan
$hookSecretSecure = Read-Host "SEND_SMS_HOOK_SECRET (v1,whsec_...)" -AsSecureString
$hookSecret = ConvertFrom-Secure $hookSecretSecure
$tempEnv2 = Join-Path $env:TEMP ("carrtell-hook-" + [guid]::NewGuid().ToString("N") + ".env")
try {
  @"
SEND_SMS_HOOK_SECRET=$hookSecret
"@ | Set-Content -Path $tempEnv2 -Encoding UTF8

  supabase secrets set --env-file $tempEnv2
  if ($LASTEXITCODE -ne 0) { throw "saving SEND_SMS_HOOK_SECRET failed" }
}
finally {
  if (Test-Path $tempEnv2) { Remove-Item $tempEnv2 -Force }
  $hookSecret = $null
}

Write-Host ""
Write-Host "SMS Hook configuration completed." -ForegroundColor Green
Write-Host "حالا روی سایت واقعی OTP بفرست. اگر نرسید، Edge Function Logs و جدول sms_logs را بررسی کن." -ForegroundColor Yellow
