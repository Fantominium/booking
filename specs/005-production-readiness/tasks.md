# Tasks: Production Readiness (Bank-Transfer-Only Release)

**Input**: `spec.md`, `plan.md`, and approved policies recorded in `research.md`.
**Status**: Planning only. Do not implement until specification, policy decisions, and acceptance tests are approved.
**Rule**: For each implementation task, write the failing BDD/contract test first (Red), then focused unit/integration coverage, implementation (Green), refactor, and rerun focused plus applicable regression tests. Do not delete, skip, loosen, or replace existing assertions to obtain a pass without approved documented justification.

## Phase 1: Discovery, Decisions, and Baseline

**Purpose**: Resolve assumptions before encoding business behavior; establish route-level regression inventory.

- [ ] T001 Inventory every customer/admin page and API method, actor, auth boundary, mutation, state, success/error/empty/degraded branch in `research.md`; link each route to its current tests and identify uncovered paths.
- [ ] T002 Record current passing test/build/lint/typecheck/migration/CI baselines and failures without changing implementation; identify current critical customer and admin journeys and regression selectors.
- [ ] T003 Obtain product approval for resource conflict scope, buffer boundary semantics, booking lead-time/past-date policy, daily cap semantics, transfer reconciliation/confirmation, pending-transfer expiry/refund policy (no electronic refund in this release), notification behavior, and operational owner. Record the approved rule: adjacent bookings are forbidden, minimum gap is 60 minutes, admin override is allowed only for same-location/no-travel bookings, and overlap semantics use half-open `[start, end)` intervals.
- [ ] T004 Obtain operator/security approval for rate-limit thresholds and trusted-proxy/IP policy, idempotency-key scope/retention, PII retention period, backup RPO/RTO, alert thresholds, migration recovery approach, and production service topology. Require distributed rate limits for public abuse surfaces and no paid managed database services; the default topology is self-hosted PostgreSQL and Redis on private infrastructure or a no-cost provider tier with restricted networking.
- [ ] T005 Document release non-goals and fail-closed Stripe boundary; confirm no card payment, PaymentIntent, webhook, Stripe secrets, or Stripe live-payment checks are required in production for this release. Add a fail-closed bootstrap and seed policy that prevents destructive writes in production-like targets.
- [ ] T006 Create route-to-scenario traceability template and risk/threat model covering public booking, auth/reset, admin, email worker, deletion, media upload, and operations endpoints. Ensure each route and branch maps to a BDD scenario and an automated contract/integration assertion before release signoff.

## Phase 2: Foundation Contracts and BDD (Tests First)

**Purpose**: Define behavior and fail on current gaps before implementation.

- [ ] T007 [P] Write BDD feature for catalog and service discovery: each offering filter, active/inactive service, empty catalog, valid detail route, unknown service, navigation/back path, and responsive/keyboard access in `bdd/customer-catalog.feature`.
- [ ] T008 [P] Write BDD feature for availability and booking: valid dates/durations, unavailable dates/slots, malformed inputs, past/outside-hours/override/blackout/daily-cap conditions, overlap boundaries, concurrent collision, stale availability, duplicate retry, and recoverable errors in `bdd/booking-integrity.feature`.
- [ ] T009 [P] Write BDD feature for bank-transfer-only checkout: invalid form, pending booking/reference/instructions, double-submit/retry, card payload rejection, payment-intent/webhook unavailability, and success-route missing/unknown IDs in `bdd/bank-transfer-only.feature`.
- [ ] T010 [P] Write BDD feature for auth/admin access: anonymous, wrong role, valid admin, expired/malformed session; admin dashboard; service, availability, booking, settings, admin-account, media, and email actions; invalid inputs; forbidden actions; and recovery in `bdd/admin-operations.feature`.
- [ ] T011 [P] Write BDD feature for public abuse/security: login failures, reset request/confirm, booking spam, deletion request/confirm, rate-limit threshold, distributed instances, spoofed forwarding headers, replay, and safe error responses in `bdd/security-and-rate-limits.feature`.
- [ ] T012 [P] Write BDD feature for email and privacy operations: queue success/unavailable, worker restart, retry exhaustion, duplicate delivery prevention, deletion invalid/expired/replayed token, age purge schedule, and audit outcomes in `bdd/email-and-privacy-operations.feature`.
- [ ] T013 [P] Write BDD feature for operational degradation: DB/Redis/worker/email failures, health/readiness, startup config omissions, backup/restore, migration failure/recovery, staging smoke, and alert handling in `bdd/production-operations.feature`.
- [ ] T014 Create `contracts/openapi.yaml` for this feature if absent, then add contract tests for every active API method/request/response/error schema and explicitly disabled Stripe routes before implementation.
- [ ] T015 Define test fixtures, deterministic clocks, isolated database/Redis/queue setup, concurrency harness, and reusable Playwright journeys without weakening shared test configuration.

**Checkpoint**: All business policies are approved; BDD and contract tests demonstrate current failures; every in-scope route maps to a test or explicitly tracked operational drill.

## Phase 3: US1 - Customer Booking Integrity

**Goal**: A customer can only reserve a valid available slot once, with a consistent outcome and recoverable failures.

### US1 Tests

- [ ] T016 [P] Add unit tests for interval overlap, buffer boundaries, date/timezone boundaries, active service, duration-price resolution, business hours, overrides, blackout, lead-time, and daily-cap calculations.
- [ ] T017 Add PostgreSQL integration tests proving overlap prevention under parallel transactions, equal-start collision, adjacent legal slot behavior, cancellation release, and daily-cap enforcement at the transaction boundary.
- [ ] T018 Add route integration tests proving the server ignores or rejects tampered client availability, price, and duration, as well as inactive services, past/outside-hours/blocked dates, invalid payloads, malformed JSON, stale slots, and duplicate idempotency keys.
- [ ] T019 Add Playwright BDD automation for every catalog-to-booking success, validation, unavailable-slot, conflict/retry, and service-not-found journey at mobile/tablet/desktop.

### US1 Implementation

- [ ] T020 Implement authoritative server-side eligibility and availability validation in the booking route/domain service; reject invalid booking requests before writes or side effects.
- [ ] T021 Implement transactional interval conflict prevention with a database-enforced or equivalently race-safe PostgreSQL strategy; provide reviewed forward migration and operational migration notes.
- [ ] T022 Make booking creation idempotent for client retries; persist key/request fingerprint/outcome safely, reject mismatched reuse, and define retention/cleanup without disclosing customer data.
- [ ] T023 Atomically enforce daily cap and state transition constraints; ensure cache invalidation happens after committed writes and stale cache cannot authorize a booking.
- [ ] T024 Preserve public catalog, filter, detail, availability, and success behavior; provide structured, accessible recovery for rejected/stale bookings without losing entered details unnecessarily.
- [ ] T025 Update unit/integration/API-contract coverage and generated/service types for any accepted contract or migration change; document it in the feature OpenAPI contract.

**Checkpoint**: PostgreSQL concurrency tests prove no overlapping active reservation can commit; every invalid booking branch has no booking/email side effect; customer BDD journeys pass.

## Phase 4: US2 - Bank-Transfer-Only and Reservation Lifecycle

**Goal**: Production has one explicit, truthful payment path and coherent reconciliation/expiry behavior.

### US2 Tests

- [ ] T026 [P] Add route/contract tests that only bank transfer is accepted, card payloads fail closed, payment-intent creation is unavailable, Stripe webhook route is unavailable, and absent Stripe variables do not break build/start/health.
- [ ] T027 Add integration/BDD tests for safe bank details/reference, pending status, staff reconciliation, confirmation email, cancellation, expiry, retry/replay, race between expiry/reconciliation/cancellation, and availability release.
- [ ] T028 Add security tests proving no Stripe request, secret, client script, hidden active card control, or provider exception reaches customer/admin/worker paths in production mode.

### US2 Implementation

- [ ] T029 Remove the active card choice from all checkout states and reject `CARD` at the request boundary; ensure no regression to bank-transfer completion.
- [ ] T030 Disable payment-intent and Stripe webhook routes for this release with an explicit safe response; make Stripe environment variables optional and remove eager Stripe initialization from production startup/build paths while retaining only approved future extension points.
- [ ] T031 Add production bank-transfer instructions/sender configuration through validated admin/secret configuration; remove sample financial details from production seed/bootstrap.
- [ ] T032 Implement the approved pending-reservation expiry scheduler, idempotent state transition, transactional availability release, and customer/admin notification. Ensure it cannot expire a reconciled/cancelled booking.
- [ ] T033 Define admin reconciliation semantics and implement a guarded/audited action, including confirmation and duplicate-operation behavior; update admin UI, contract, Storybook, and E2E.
- [ ] T034 Verify bank-transfer confirmation/success route, ICS behavior if present, email content, and accessibility across all relevant outcomes; update API and user documentation.

**Checkpoint**: Production configuration has no Stripe dependency and no callable card path; transfer lifecycle is approved, deterministic, auditable, and tested.

## Phase 5: US3 - Admin Security and Public Abuse Resistance

**Goal**: Admin operations are deny-by-default, while abusive public requests are throttled consistently across instances.

### US3 Tests

- [ ] T035 [P] Add BDD/E2E authorization coverage for every admin page and API method: anonymous, wrong role, expired/stale session, valid admin, direct URL, mutation denial, and session recovery.
- [ ] T036 [P] Add contract/integration tests for every admin list/filter/sort/pagination, service CRUD/media, availability/settings, booking status/reconciliation/cancel/resend, dashboard, and admin-account mutation outcome.
- [ ] T037 Add route-level distributed rate-limit tests across independent app clients for login, password reset, booking, and customer-data routes; verify `429`, retry metadata, recovery window, trusted-proxy behavior, and fail policy when Redis is unavailable.
- [ ] T038 Add security tests for request validation, CSRF/origin posture where applicable, open redirect/callback validation, upload constraints, error sanitization, and secrets/PII exclusion from logs.

### US3 Implementation

- [ ] T039 Apply a shared admin authorization guard to every protected page and API mutation; ensure authorization is independently enforced in handlers and role/session failures reveal no protected data.
- [ ] T040 Add Redis-backed atomic rate limiting with bounded key lifecycle and documented trusted proxy configuration; attach it to the actual routes and avoid memory-only production fallback.
- [ ] T041 Ensure login/reset responses resist account enumeration, protect reset tokens, validate callback targets, and rate-limit credential operations without locking out legitimate users permanently.
- [ ] T042 Normalize structured API errors and logs; redact secrets, reset tokens, session credentials, unnecessary PII, request bodies, and operational internals.
- [ ] T043 Preserve admin workflow behavior and add accessible denied, expired-session, throttled, validation, and dependency-failure states; update Storybook and OpenAPI.

**Checkpoint**: Complete route matrix proves correct access for every page/API; distributed abuse tests pass; no security boundary relies only on UI/proxy.

## Phase 6: US4 - Safe Bootstrap, Email, and Privacy

**Goal**: Production data and customer communications are safe, recoverable, and operationally verified.

### US4 Tests

- [ ] T044 [P] Add tests that production seed/bootstrap exits before mutation, never creates default credentials, and that isolated development/test seeding remains repeatable.
- [ ] T045 [P] Add integration/BDD tests for worker startup/restart, verified sender, queue retries/backoff, retry exhaustion, duplicate job delivery, queue unavailable recovery, and delivery status consistency.
- [ ] T046 [P] Add privacy tests for deletion confirmation token validity, expiry, replay/single-use, concurrent confirmation, request enumeration, audit minimization, and retention boundary behavior.
- [ ] T047 Add scheduling tests proving age-based purge actually runs on the configured schedule, is idempotent/recoverable, and reports counts/errors without exposing PII.

### US4 Implementation

- [ ] T048 Guard destructive seed operations against production URLs/environment and separate local fixture admin credentials from production provisioning; add safety tests and operator documentation.
- [ ] T049 Configure verified production sender identities and secrets through the deployment secret store; add sanitized operational status, queue/worker health, retry policy, and manual recovery runbook.
- [ ] T050 Make email processing idempotent across worker retries; ensure notification creation/state is consistent with database transitions using transactional outbox or approved equivalent where required.
- [ ] T051 Schedule and monitor PII purge; use single-use deletion confirmations and transactional/anonymization behavior; ensure retained audit records follow approved minimization policy.
- [ ] T052 Replace `.local` production contact/sender values and audit all production-facing URLs and templates for local/test/example values.

**Checkpoint**: Production cannot run destructive seed; email and privacy BDD paths pass against realistic queue/database topology; scheduled retention is evidenced.

## Phase 7: US5 - Deployment, Observability, and Recovery

**Goal**: Operators can deploy, detect, recover, and promote safely.

### US5 Tests and Drills

- [ ] T053 [P] Add CI checks for schema validation, migrations, lint, typecheck, all unit/integration/contract/BDD suites, E2E, app/worker container builds, dependency/image scanning, and production build.
- [ ] T054 [P] Add container topology smoke checks for web, PostgreSQL, Redis, and worker startup/readiness, plus dependency outage and worker restart scenarios.
- [ ] T055 Conduct and record PostgreSQL backup restore drill against isolated staging data; verify approved RPO/RTO and access protections.
- [ ] T056 Conduct and record migration apply and recovery drill with reviewed non-destructive migration and explicit rollback/forward-fix path.
- [ ] T057 Verify staging deployment with customer/admin smoke paths, disabled Stripe paths, alert delivery, log redaction, health/readiness, and release/rollback procedure.

### US5 Implementation

- [ ] T058 Harden production images/runtime to least privilege, pinned/reviewed base images, non-root execution where compatible, resource limits, restricted ports/network, health/readiness probes, and vulnerability scanning; document any approved exception.
- [ ] T059 Separate liveness from readiness and report web dependencies safely; instrument worker heartbeat, queue age/depth/failures, email delivery, and database/Redis errors with actionable alerts.
- [ ] T060 Add protected migration/release automation using `prisma migrate deploy`, environment approvals, secret scopes, staging promotion, smoke checks, and branch-protection-required statuses.
- [ ] T061 Document environment matrix, secret rotation/ownership, production topology, operator escalation, deploy/rollback/forward-fix, backup restore, incident response, payment-transfer reconciliation, and Stripe deferred status.
- [ ] T062 Update production-readiness checklist with evidence links, named owners, thresholds, required approvals, and explicit exclusions; do not mark unchecked evidence complete without an artifact.

**Checkpoint**: Staging evidence and recovery drills are recorded; CI and branch protection enforce release gates; production topology is verified.

## Phase 8: US6 - Full Journey Regression, Accessibility, and Release Approval

**Goal**: Every in-scope route/outcome is covered, existing user paths remain intact, and release evidence meets the constitution.

- [ ] T063 Complete route-to-test traceability matrix; require every user-visible page/action and every identified success/error/empty/degraded/retry/recovery branch to reference an approved BDD scenario and passing automated acceptance test. Require every API method to map to passing contract tests and applicable integration tests; operational-only paths require a named, passing drill with attached evidence.
- [ ] T064 Run all pre-existing suites unchanged and compare to T002 baseline; resolve every introduced failure and investigate every unexplained baseline failure; do not waive regressions by skipping tests.
- [ ] T065 Run Playwright critical customer and admin journeys at 320px/mobile, tablet, and desktop, including keyboard-only, touch, session expiry, validation, dependency failure, retry, and recovery branches.
- [ ] T066 Complete automated and manual WCAG 2.2 AA audit for customer/admin critical paths; verify Lighthouse Accessibility >=95, contrast, focus order/return, field errors, screen-reader names, 44x44px targets, and reduced-motion behavior where applicable.
- [ ] T067 Add/update Storybook stories for changed user-facing components and states; verify every documented state renders and remains accessible.
- [ ] T068 Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm exec prisma validate`, production build, security/image scans, and container/staging smoke; record exact results and test scope.
- [ ] T069 Update OpenAPI, README, deployment docs, data/architecture diagrams, quickstart, privacy/retention docs, and release notes to match shipped behavior.
- [ ] T070 Obtain engineering, QA/accessibility, security, product, and operations signoff; attach evidence, residual-risk exceptions with expiry, rollback readiness, and Stripe deferral acknowledgment before production promotion.

## Dependencies and Release Rule

- Phase 1 and Phase 2 precede all implementation.
- US1 booking integrity precedes customer-flow finalization and transfer lifecycle.
- US2 and US3 API contracts stabilize before corresponding UI/E2E completion.
- US4 and US5 can proceed in parallel after shared contracts, with isolated test fixtures.
- Phase 8 cannot pass while any in-scope path lacks traceable passing evidence or any regression remains unexplained.
- A later Stripe release is a separate feature branch/specification and does not reopen or weaken this release's acceptance criteria.
