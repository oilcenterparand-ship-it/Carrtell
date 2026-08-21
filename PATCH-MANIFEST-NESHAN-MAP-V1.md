# Patch Manifest — Carrtell Neshan Map v1

## Base
`project(20260819-122809).zip`

## Added / Replaced
- `src/components/MapLocationPicker.tsx` — جایگزینی Leaflet با SDK رسمی MapLibre نشان و Reverse Geocode از Supabase Function.
- `supabase/functions/neshan-reverse-geocode/index.ts` — Proxy امن برای Neshan Reverse Geocoding.
- `.env.example` — اضافه شدن `VITE_NESHAN_WEB_API_KEY` بدون Secret واقعی.
- `README-NESHAN-MAP-INTEGRATION-FA.md` — راهنمای فارسی نصب، Deploy و تست.
- `PATCH-MANIFEST-NESHAN-MAP-V1.md` — همین Manifest.

## SQL
ندارد.

## Required Secret
- Supabase Edge Function Secret: `NESHAN_SERVICE_API_KEY`

## Required Frontend Environment Variable
- `VITE_NESHAN_WEB_API_KEY`

## Required Package
- `@neshan-maps-platform/maplibre-sdk@5.24.4`

## Deploy
```powershell
npx supabase functions deploy neshan-reverse-geocode --no-verify-jwt
```

## Validation
```powershell
npm run typecheck
npm run build
.\agent.ps1 VISUAL
.\agent.ps1 BOOKING
```
