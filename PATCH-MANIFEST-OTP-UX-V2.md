# PATCH MANIFEST — Carrtell OTP UX V2

## Base
`project(4).zip`

## Changed source files
- `src/pages/OtpLoginPage.tsx`

## Functional changes
- 6-box OTP input
- auto-focus progression
- backspace navigation
- full-code paste support
- numeric mobile keyboard
- one-time-code autocomplete hint
- 120-second resend countdown
- resend OTP action
- reset OTP boxes on resend/error
- localized phone display
- Persian user-friendly auth errors
- preserved returnTo / checkout resume behavior

## Database
No database changes.

## SQL
None.

## Secrets
No secrets added, embedded, or changed.

## Validation
- TypeScript typecheck: PASS
- Production build in OpenAI Linux container: not completed because the uploaded ZIP contains Windows-installed `node_modules` and Rollup's Linux optional binary is absent. Run `npm run build` on the user's Windows project after replacement.
