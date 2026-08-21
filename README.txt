Carrtell mobile hotfix — 2026-08-15

Fixes:
1. Account/menu logout button is compact instead of a large full-width rectangle.
2. Mobile bottom navigation is opaque so UI behind it does not bleed through.
3. Header search can still receive product data if product_compatible_cars lookup fails.
4. Mobile search results are forced above the fixed header/content layer.

Run from PowerShell in the Carrtell project directory:

powershell -ExecutionPolicy Bypass -File .\apply-carrtell-mobile-hotfix.ps1

Then:

npm run build

The script creates timestamped backups before modifying files.
