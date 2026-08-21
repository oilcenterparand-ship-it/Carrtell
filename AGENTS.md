# Carrtell Autonomous Dev Agent v1

## Mission
Continue development of Carrtell safely, incrementally, and test-first. Treat this repository as a production e-commerce + on-site automotive service application.

## Mandatory operating loop
1. Read `CARRTELL_PROJECT_CONTEXT.md` before changing code.
2. Inspect the current branch, recent changes, relevant files, and existing tests.
3. Convert the user's request into a small, explicit task plan.
4. Never work directly on `main`; create a task branch.
5. Make the smallest coherent change that solves the task.
6. Run validation in this order:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run build`
   - `npm run qa:e2e`
7. If a validation step fails because of the change, fix it before reporting success.
8. Review the diff for regressions, especially mobile navigation, auth gates, booking flow, cart, profile, admin, and routing.
9. Update `CARRTELL_PROJECT_CONTEXT.md` with what changed, what remains, and the next recommended task.
10. Commit with a focused message and open a PR. Do not merge automatically unless the user explicitly requests it.

## Modes
- BUILD: implement a requested feature.
- FIX: reproduce and fix a reported bug.
- QA: inspect/test only, then report defects with reproduction steps.
- CONTINUE: choose the highest-priority unfinished item from `CARRTELL_PROJECT_CONTEXT.md` and work on it.

## Safety rules
- Do not delete working features to make tests pass.
- Do not bypass authentication or authorization checks that are actually required.
- Do not introduce a login requirement to public navigation or public shopping actions unless the product requirement explicitly says so.
- Do not expose Supabase service keys, SMS credentials, secrets, `.env` values, or customer data.
- Avoid database migrations unless required; when required, create a migration and document rollback.
- Do not silently change business rules.
- Preserve mobile-first behavior and iPhone safe-area support.

## Carrtell regression priorities
Always check these when touching related code:
- Bottom mobile navigation routes correctly and does not scroll the page to the bottom.
- Menu/hamburger does not incorrectly trigger login.
- Shop navigation does not redirect to Home.
- Booking is step-by-step and does not skip required stages.
- Login/OTP is only required at the intended point in the booking/profile flow.
- Search and car selection remain usable on mobile.
- Bottom nav does not cover actionable controls.
- Route changes start at a sensible scroll position.
- Build produces a valid `dist` directory.

## Completion report format
At the end of each task report:
- Task completed
- Files changed
- Validation results
- Regression checks performed
- Remaining risks/issues
- Next recommended task
