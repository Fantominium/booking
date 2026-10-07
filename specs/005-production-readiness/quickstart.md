# Production Readiness Quickstart

This is the verification outline for the bank-transfer-only production readiness feature. It does not authorize production deployment and does not include Stripe testing.

## Prerequisites

- `spec.md` and product/operational decisions in `research.md` approved.
- Isolated CI/staging PostgreSQL and Redis; no production customer data in automated tests.
- Provider test credentials for email delivery only, stored in CI/staging secret stores.
- Browser and screen-reader testing environment and staging deployment approval.
- Production secrets and live bank details managed only by authorized operators.

## Test-First Workflow

For each story: add the failing BDD scenario and contract assertion first; run the focused test to prove it fails for the intended reason; add unit/integration coverage; implement the smallest change; rerun the focused tests; then run affected existing regression tests. Keep logs/artifacts for failures and resolutions. Never skip or loosen an existing test without written approval.

## Local Validation Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm exec prisma validate
pnpm build
```

Run migration tests only against a disposable database configured for the selected workspace environment. Never run `prisma db seed` or destructive test setup against a production URL. The CI pipeline must additionally build and inspect web/worker images and execute the documented topology smoke tests.

## Acceptance Walkthrough

1. Review the route-to-scenario matrix. Every user-visible page/action and every success, validation, empty, authorization, dependency-failure, retry, and recovery branch must link to an approved BDD scenario and passing automated acceptance test. Every API method must also link to passing contract tests and applicable integration tests; operational-only paths must link to a named, recorded drill.
2. From the public home/catalog, visit each active offering filter and service detail. Verify inactive/unknown services, empty results, invalid date/duration, blocked dates, business-hour boundaries, daily cap, and stale availability outcomes.
3. Submit one valid bank-transfer booking and verify pending state, unique reference, verified instructions, confirmation/success behavior, and expected email. Retry the identical idempotency key and verify one booking and no duplicate notification.
4. Race two requests for equal and overlapping times. Verify only valid non-overlapping reservations commit, including the approved buffer boundary rule. Verify cancellation/expiry releases the slot and reconciliation cannot race an expiry into an invalid state.
5. Verify card requests fail closed, card UI is absent, PaymentIntent/webhook paths are unavailable, and production build/start/health work without Stripe variables. Do not supply live Stripe credentials or run Stripe tests for this release.
6. Exercise every admin page and API with anonymous, wrong-role, expired, and authorized sessions; test each list/filter and mutation outcome plus validation, audit, and recovery states.
7. Exceed configured limits against two app instances; verify correct 429 behavior, retry information, spoofed forwarding headers are ignored, and Redis failure follows the approved policy.
8. Exercise email/worker startup, outage, retry, duplicate delivery, recovery, verified sender, deletion confirmation expiry/replay, and the scheduled retention job in isolated staging data.
9. Test health/readiness, worker/queue alerts, database/Redis outage, backup restore, migration apply/recovery, and staging rollback or forward-fix. Attach run evidence and operator names.
10. Complete mobile/tablet/desktop Playwright runs, keyboard-only and screen-reader walkthroughs, WCAG 2.2 AA review, and Lighthouse Accessibility >=95 for customer/admin critical paths.
11. Run every existing suite and required CI/release check. Compare against the documented baseline; no unexplained test, accessibility, lint, type, build, migration, security-scan, or smoke regression is acceptable.

## Release Evidence

Attach the final route/test matrix, CI run, E2E/accessibility reports, migration review, image/security scan, container topology smoke report, backup-restore and recovery drill records, staging smoke results, monitoring/alert verification, named release owners, rollback/forward-fix plan, and approved residual-risk exceptions. Mark Stripe as deferred, not tested or ready.
