# Patch Manifest — Carrtell V5.0.1

## Base
- Latest complete ZIP: `project(20260820-162222).zip`
- Requires previously installed: `CARRTELL-DRIVER-ANDROID-SMS-RELIABILITY-V5.0`

## Changed files
1. `src/pages/DownloadsPage.tsx`

## Database / SQL
- None

## Edge Functions
- None

## Secrets
- None added or changed

## Purpose
The public `/download` page must expose only the customer/store PWA. A leftover explanatory sentence still contained the technician app label and caused the Persona test `public download page installs only the customer app` to fail on desktop and Android Chromium.

## Validation
- TypeScript `tsc --noEmit -p tsconfig.app.json`: PASS in merged V5 source.
- User must run production build and `PERSONAS` on Windows.
