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
