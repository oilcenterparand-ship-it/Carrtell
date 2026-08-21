param(
  [string]$ProjectRoot = "."
)

$ErrorActionPreference = "Stop"

function Backup-File([string]$Path) {
  if (!(Test-Path $Path)) { throw "File not found: $Path" }
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  Copy-Item $Path "$Path.bak-$stamp" -Force
}

$productsApi = Join-Path $ProjectRoot "src\admin\services\productsApi.ts"
$mobileCss   = Join-Path $ProjectRoot "src\styles\mobile-rc106a.css"

Write-Host "Carrtell mobile hotfix..." -ForegroundColor Cyan

# 1) Search fix: do not throw away the whole products list when the compatibility relation query fails.
Backup-File $productsApi
$products = Get-Content $productsApi -Raw -Encoding UTF8

$old = @'
  if (relationsError) throw relationsError;

  return mergeCompatibleCars(products, (relationsData || []) as ProductCompatibleCarRow[]);
'@

$new = @'
  if (relationsError) {
    console.warn('Product compatibility relations could not be loaded; continuing with product search data.', relationsError);
    return products.map((product) => ({ ...product, compatible_car_ids: [] }));
  }

  return mergeCompatibleCars(products, (relationsData || []) as ProductCompatibleCarRow[]);
'@

if ($products.Contains($old)) {
  $products = $products.Replace($old, $new)
  Set-Content $productsApi $products -Encoding UTF8
  Write-Host "[OK] Product search data fallback added." -ForegroundColor Green
} elseif ($products.Contains("continuing with product search data")) {
  Write-Host "[SKIP] Product search fallback already exists." -ForegroundColor Yellow
} else {
  throw "Could not locate the expected productsApi.ts block. Patch stopped to avoid a bad edit."
}

# 2) Mobile UI cleanup: bottom-nav bleed, compact account logout/menu button, search dropdown layer.
Backup-File $mobileCss
$css = Get-Content $mobileCss -Raw -Encoding UTF8
$marker = "/* HOTFIX-2026-08-15-MOBILE */"

if (!$css.Contains($marker)) {
$hotfix = @'

/* HOTFIX-2026-08-15-MOBILE */
@media (max-width: 767px) {
  /* Fully opaque bottom bar: nothing underneath can show through it. */
  .ct-mobile-bottom-nav {
    background: #07101f !important;
    border: 1px solid rgba(148, 163, 184, .28) !important;
    box-shadow: 0 16px 42px rgba(0,0,0,.58), inset 0 1px 0 rgba(255,255,255,.07) !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    overflow: visible !important;
    isolation: isolate !important;
  }

  .ct-mobile-bottom-nav::before,
  .ct-mobile-bottom-nav::after,
  body::after {
    display: none !important;
    content: none !important;
  }

  .ct-mobile-bottom-nav .ct-mobile-nav-icon {
    position: relative;
    z-index: 2;
  }

  /* Compact account-menu/logout button instead of the large ugly rectangle. */
  .ct-new-account-signout {
    width: calc(100% - 16px) !important;
    min-height: 44px !important;
    margin: 8px !important;
    padding: 9px 12px !important;
    border: 1px solid rgba(239,68,68,.34) !important;
    border-radius: 13px !important;
    background: rgba(239,68,68,.08) !important;
    color: #f87171 !important;
    font-size: 13px !important;
    line-height: 1.2 !important;
    box-shadow: none !important;
  }

  .ct-new-account-signout svg {
    width: 18px !important;
    height: 18px !important;
  }

  /* Search result layer above the fixed header/content on iPhone. */
  .ct-new-search-wrap {
    position: relative !important;
    z-index: 100210 !important;
  }

  .ct-new-search-results {
    display: block !important;
    position: fixed !important;
    top: 128px !important;
    right: 10px !important;
    left: 10px !important;
    width: auto !important;
    z-index: 100300 !important;
    max-height: min(62dvh, 520px) !important;
    overflow: hidden !important;
    border: 1px solid rgba(245,183,0,.35) !important;
    background: #0b1427 !important;
    color: #f8fafc !important;
    box-shadow: 0 24px 60px rgba(0,0,0,.58) !important;
  }

  .ct-new-search-results-body {
    max-height: min(46dvh, 390px) !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
  }

  .ct-new-search-empty,
  .ct-new-search-results-head,
  .ct-new-search-group h3,
  .ct-new-search-copy b,
  .ct-new-search-copy small,
  .ct-new-search-price {
    color: inherit !important;
  }
}
'@
  Add-Content $mobileCss $hotfix -Encoding UTF8
  Write-Host "[OK] Mobile visual hotfix appended." -ForegroundColor Green
} else {
  Write-Host "[SKIP] Mobile visual hotfix already exists." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Patch applied. Now run:" -ForegroundColor Cyan
Write-Host "  npm run build"
Write-Host "Then test on mobile with a hard refresh / cleared site cache."
