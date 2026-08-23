# Carrtell Project Context

Last updated: 2026-08-19

## Product
Carrtell is an automotive products e-commerce app plus on-site service booking platform.

## Stack
- React
- Vite
- TypeScript
- Tailwind CSS
- Supabase
- React Router

## Core routes
Current known routes include `/`, `/shop`, `/book`, `/dashboard`, `/investor`, and `/admin`. Verify the actual router before changing route behavior.

## Non-negotiable product rules
- Mobile-first UX.
- Public navigation must not require login merely to open menus or browse.
- Booking should be a guided step-by-step flow.
- OTP/login must occur only at the intended point of the customer journey.
- Product recommendations must respect inventory.
- Admin-managed content should remain editable from admin where applicable.

## High-priority current regression list
1. Mobile menu/hamburger must not open login unexpectedly.
2. Mobile bottom navigation must route to the correct pages.
3. Bottom navigation clicks must not force the page to scroll to the bottom.
4. Shop tab must not redirect to Home.
5. Booking/service flow needs end-to-end verification.
6. Mobile search, car picker, and confirmation interactions need regression coverage.
7. Avoid duplicate search bars / duplicate bottom navigation.
8. Verify iPhone safe-area spacing and overlays.

## Agent state
Status: Agent v1 bootstrap.
Next recommended task: run the baseline E2E suite against the current app, record failures, then fix the highest-impact navigation/auth regression first.

## Change log
### 2026-08-16 — Agent bootstrap
- Added autonomous development operating contract.
- Added baseline Playwright smoke/regression suite.
- Added setup script for local installation.

### 2026-08-19 — Navigation, support and account clarity (v2.3.29)
- Hamburger drawer is a polished single-column menu; redundant Store, Profile and Addresses shortcuts were removed.
- Product Categories now opens a dedicated mobile-safe category sheet at `/shop?view=categories`.
- Support starts on the customer's ticket history, shows ticket statuses, has a clear exit action, and separates history from the new-ticket form.
- Prevented anonymous support-history queries from returning tickets without a user id.
- Dashboard overview was reduced to three clear groups: Orders, Vehicle & Service, and Profile & Addresses; duplicate overview blocks were removed.
- Mobile dashboard navigation now uses a readable two-column categorized layout.
- Regression coverage was updated for the trimmed drawer, mobile category sheet, and support history/exit.
- Validation: TypeScript passed; focused ESLint passed; Playwright discovered 186 tests. Full local browser/build execution remains for the Windows agent because this Linux copy lacks Rollup's optional native package.

Next recommended task: install v2.3.29 on Windows and run `.\agent.ps1 CRITICAL`; visually confirm category sheet and dashboard sections on a real iPhone viewport.

### 2026-08-19 — Booking selection cart focus and current total (v2.3.30)
- Booking selections now open in a portal-based modal above the entire app with a dark blurred backdrop.
- Background scrolling is locked while the selection modal is open; outside click and Escape close it.
- Mobile spacing keeps the modal above the fixed bottom navigation and iPhone safe area.
- After at least one service and one product/package are selected, the modal shows one concise `current selections total` line.
- Labor and travel details are still hidden in intermediate steps and remain itemized only in the final booking invoice.
- Critical booking regression now checks the backdrop and the current combined total.
- Validation: TypeScript passed and Playwright discovered all 186 configured desktop/Android/iPhone tests.

Next recommended task: install v2.3.30 on Windows, run `.\agent.ps1 CRITICAL`, and visually confirm the modal on the physical phone.

### 2026-08-19 — Compact hamburger and working vehicle picker (v2.3.31)
- Removed the old drawer branding/header block and its non-interactive selected-car pill.
- Added one compact, polished vehicle control inside the drawer with distinct selected and unselected states.
- Vehicle selection now opens a real portal modal with manufacturer filtering, live model search, selection, clearing, outside-click close, and background scroll lock.
- Reduced the mobile drawer to content height and tightened menu spacing while preserving the single-column navigation.
- Added a mobile regression check that opens the drawer vehicle control, verifies its dialog, and closes it.
- v2.3.31 includes the v2.3.30 booking selection-cart focus and concise current-total changes.

Next recommended task: install v2.3.31 on Windows, run `.\agent.ps1 CRITICAL`, and verify the drawer/vehicle picker plus booking cart on the physical phone.

### 2026-08-23 — Industrial and diesel catalog V1
- Added an independent public `/industrial` catalog while preserving the passenger `/shop` flow.
- Product categories now support parent/child hierarchy, images, ordering, active state and unlimited future branches.
- Products can be assigned to multiple dynamic categories through `product_category_assignments`; legacy `products.category` remains for backward compatibility.
- Seeded diesel engine oil, industrial hydraulic/gear oil and diesel/industrial filter branches.
- Added Carrtell Agent `INDUSTRIAL` mode covering desktop/mobile customer UX, admin persona and shop/auth regression.
- TypeScript and production build passed. Full ESLint remains blocked by 376 pre-existing repository errors; changed-file lint has no errors. Browser E2E is prepared for the Windows Agent because this Linux runner has no Chrome binary.

Next recommended task: apply the SQL migration, assign the first real industrial products, then run `.\agent.ps1 INDUSTRIAL` on Windows and return any failing report for the corrective patch.

### 2026-08-23 — Unlimited dynamic category journey V2
- Added public guided routes `/categories` and `/category/:slug` that walk customers through unlimited admin-defined branches until direct products are reached.
- Category admin now shows full ancestry and has a direct `add child` action on every node.
- Product admin lists full paths for leaf categories only and requires at least one final category assignment.
- Homepage category cards now enter the guided hierarchy instead of applying a flat shop query.
- Added standalone ASCII-safe `agent-category.ps1` plus desktop/mobile route tests.
- TypeScript, production build and changed-file ESLint passed (two pre-existing hook dependency warnings remain in Products).

Next recommended task: install V2, create one real 15W-40 path and one Serkan filter path, run `agent-category.ps1`, then visually verify the hierarchy on a physical phone.

### 2026-08-23 — Category admin usability correction V2.1
- Replaced the ambiguous unlabeled category form with explicit root/child creation modes.
- Child creation now requires selecting a clearly labeled full parent path.
- Every input has a persistent label and help text; each existing node keeps a prominent `add child` action.
- TypeScript, production build and changed-file ESLint passed.
