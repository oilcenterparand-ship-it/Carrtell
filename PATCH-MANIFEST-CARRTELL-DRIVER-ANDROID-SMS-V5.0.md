# Patch Manifest — Carrtell V5.0

Baseline: `project(20260820-162222).zip`

## Runtime files changed
- `src/main.tsx`
- `src/pages/DownloadsPage.tsx`
- `src/driver/pages/DriverDashboard.tsx`
- `src/driver/components/DriverNotificationSetup.tsx`
- `supabase/functions/send-sms-hook/index.ts`

## QA files changed
- `tests/e2e/persona-customer.spec.ts`
- `tests/e2e/persona-technician.spec.ts`

## New Android project
- `android-driver/settings.gradle.kts`
- `android-driver/build.gradle.kts`
- `android-driver/gradle.properties`
- `android-driver/app/build.gradle.kts`
- `android-driver/app/proguard-rules.pro`
- `android-driver/app/src/main/AndroidManifest.xml`
- `android-driver/app/src/main/java/ir/carrtell/driver/MainActivity.java`
- Android resource files under `android-driver/app/src/main/res/`
- `android-driver/README-ANDROID-FA.md`

## Docs
- `README-CARRTELL-DRIVER-ANDROID-SMS-V5.0-FA.md`
- `PATCH-MANIFEST-CARRTELL-DRIVER-ANDROID-SMS-V5.0.md`
- `CARRTELL_CHAT_HANDOFF_20260820.md`

## SQL
None.

## Server deploy required
`supabase/functions/send-sms-hook/index.ts`

## Security
- Kavenegar/Ghasedak keys remain server-side Supabase secrets.
- No new secret is exposed to Vite/frontend.
- Android release signing key is not included.

## Verification performed in build environment
- `npm run typecheck`: PASS
- Production Vite build could not be run in the Linux sandbox because the uploaded `node_modules` contains the Windows Rollup native package. User's Windows build is the release gate.
