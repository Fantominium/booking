# Implementation Plan: Production Readiness

## Delivery Approach

Implement only after `spec.md` is reviewed and approved. Follow Red/Green/Refactor per task: add failing BDD/contract test, add focused unit/integration test where relevant, make the minimum implementation change, refactor, then run the focused check before expanding scope. Keep stories independently testable and releaseable. Do not modify unrelated behavior or weaken baseline tests.

## Release Boundary

- Production supports bank transfer only.
- Card controls stay absent; public card requests fail closed; Stripe-only routes/configuration are disabled and not required for startup.
- Preserve the ability to reintroduce a provider through a later approved specification; do not perform broad payment-domain refactoring here.
- The production booking truth is the database transaction, never cached/client-provided availability.
- Approved scheduling policy: adjacent bookings are not allowed; the minimum gap is 60 minutes unless an admin override is explicitly issued for same-location, no-travel bookings. Overlap is half-open `[start, end)` semantics; same-start, same-end, same-resource and multi-duration collisions are all treated as conflicts.
- Approved operational policy: public abuse surfaces require distributed rate limits; in-memory counters are explicitly not accepted. Database topology must remain free of paid managed database services; the required default is self-hosted PostgreSQL and Redis on private infrastructure or a no-cost provider tier with strict network isolation.
- Approved bootstrap policy: destructive seed/bootstrap commands must fail closed before any write in production-like environments; no default credentials or local admin accounts may be created in a production target.
- Approved traceability policy: each route and branch must map to a BDD scenario and contract/integration assertion before release signoff.

## Stories and Sequence

### Foundation: Inventory and Contracts

Create route/persona/state matrices; record current baseline tests and known behavior; map OpenAPI operations to handlers; define booking lifecycle, payment/reconciliation policy, buffer/overlap rule, idempotency semantics, pending-reservation expiry, retention, and operational ownership. Resolve policy questions with product/operator approval before tests encode assumptions.

### US1: Safe Customer Booking

BDD first for valid and invalid public journeys. Implement server-side validation, transactional overlap/daily-cap rules, booking idempotency, consistent availability cache invalidation, and safe confirmation response. Maintain catalog, filtering, service detail, date/time selection, form validation, errors, success, and calendar/email behavior.

### US2: Bank-Transfer-Only Outcome and Reconciliation

BDD first for pending transfer, instructions/reference, retry, payment reconciliation, cancellation, expiry, and races between these states. Hide and reject card flow; disable Stripe APIs/webhooks; make Stripe environment values optional. Define and test exactly when a booking becomes confirmed and when availability is released.

### US3: Secure Administration and Abuse Controls

BDD first across public login/reset, admin page/API role boundaries, every admin read/mutation, and abuse paths. Apply guards at each handler/page; use distributed rate limits; sanitize errors; preserve admin workflows and failure recovery.

### US4: Safe Data, Email, and Privacy Operations

BDD/integration coverage for queue submission and worker delivery/retry/failure, sender configuration, duplicate side effects, deletion token expiry/replay, scheduled retention, and recovery. Test worker lifecycle with real supported topology and controlled dependencies.

### US5: Production Delivery and Operations

Secure bootstrap and container config; migration and rollback/forward-fix process; backup/restore drill; monitoring/readiness/worker alarms; CI release gates; staging deployment and smoke verification; operator runbooks and release evidence.

### US6: End-to-End Regression and Accessibility

Complete traceability for every in-scope public/admin path and all outcome branches. Run desktop/tablet/mobile Playwright journeys; keyboard, screen-reader, and WCAG checks; Storybook states; full regression, build, container, security, and smoke gates. No route is considered covered merely because its page renders.

## BDD and Coverage Model

- Author feature files under `specs/005-production-readiness/bdd/` before production changes.
- Tag scenarios by actor, journey, risk, and release-criticality; bind each to a stable automated test or tracked manual operational evidence.
- Maintain a route-to-scenario matrix in `research.md` or a dedicated coverage artifact: every user-visible page/action and actor, precondition, success state, validation branch, auth denial, dependency failure, retry/replay, and recovery branch maps to an approved BDD scenario and passing automated acceptance test. Every API method additionally maps to contract tests and applicable integration tests.
- Prefer business outcomes in Gherkin; use Playwright for browser paths, integration tests for route/database/queue contracts, and unit tests for domain rules. Avoid duplicated assertions that add no coverage.
- Use deterministic fixtures and isolated test databases/queues; never seed production data in CI/staging/prod. Include concurrency tests against PostgreSQL rather than mocks alone.
- Existing suites remain the regression baseline. Keep a reviewed baseline report; tests may only be amended to reflect approved contract changes and must retain equivalent or stronger assertions.

## Security-by-Design Review Points

- Threat model public booking, authentication/reset, customer-data requests, admin mutations, uploads, worker queues, and operational endpoints.
- Trust only validated server-derived data; client availability/price/service status is not authoritative.
- Enforce least privilege, deny-by-default admin authorization, rate-limit abuse surfaces, prevent replay/duplicate state changes, and sanitize errors/logs.
- Ensure no production default credentials, no secret values in source/build artifacts/logs, and no public access to backing services.
- Review migrations for locking/data-loss risk and define compatible deploy/rollback behavior.
- Verify PII minimization, retention execution, deletion audit integrity, sender-domain authenticity, and access to backup data.
- Security review and CI scanning are release gates; risk exceptions require named approver, rationale, scope, expiry, and follow-up task.

## Release Gates

1. Spec and business policy approvals complete.
2. Route/journey traceability has no uncovered in-scope route or branch.
3. Focused tests pass for each story before moving to adjacent work.
4. Full unit, integration, contract, BDD, Playwright E2E, smoke, lint, typecheck, Prisma validation/migration, production build, dependency and container scans pass.
5. Web and worker images build and run in a production-like container topology with health/readiness and resource/network controls.
6. Staging checks demonstrate bank-transfer booking, admin workflows, email retries/recovery, rate limiting, backup/restore, migration/rollback or forward-fix, and alerts.
7. WCAG 2.2 AA manual/automated review and Lighthouse accessibility score >=95; critical journeys verified at mobile (>=320px), tablet, desktop, keyboard-only, and screen-reader level.
8. Operator runbooks, evidence, owners, release approval, and rollback/disable procedure are recorded. Stripe checks are explicitly marked deferred and are not counted as completed launch requirements.

## Relevant Existing Surfaces

- Booking and availability: `src/app/api/bookings/route.ts`, `src/app/api/availability/[serviceId]/route.ts`, `src/lib/services/booking.ts`, `src/lib/services/availability.ts`, `prisma/schema.prisma`.
- Admin and auth: `src/app/admin/**`, `src/app/api/admin/**`, `src/app/api/auth/**`, `src/lib/auth/admin.ts`, `proxy.ts`.
- Stripe deferral boundary: `src/components/booking/CheckoutForm.tsx`, `src/components/booking/BookingFlow.tsx`, `src/app/api/payment-intents/route.ts`, `src/app/api/webhooks/stripe/[token]/route.ts`, `src/lib/config/env.ts`.
- Email/privacy/ops: `src/workers/**`, `src/lib/services/email.ts`, `src/lib/services/data-deletion.ts`, `src/lib/jobs/pii-purge.ts`, `src/app/api/health/route.ts`, `Dockerfile`, `Dockerfile.worker`, `.github/workflows/ci.yml`.
- Test baseline: `tests/contract/**`, `tests/integration/**`, `tests/security/**`, `tests/e2e/**`, `specs/005-production-readiness/bdd/**`.
