# Carrtell Patch — Car-based recommendations and package page theme

## Files
- `src/pages/ShopPage.tsx`
- `src/pages/PackageListPage.tsx`

## Changes
- Adds a new section on the shop page for the selected customer car.
- Shows only active, in-stock, compatible products in that section.
- Shows only admin-created packages for the selected car or all cars.
- Keeps automatic/smart package generation disabled.
- Updates PackageListPage to use Theme Builder colors instead of the light default style.

## Test
- `npm run typecheck` passed.
- `npm run build` could not run in this Linux container because the uploaded Windows `node_modules` is missing Rollup's Linux optional package. On your Windows project, run `npm install` if needed, then `npm run build`.
