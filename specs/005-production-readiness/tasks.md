# Tasks: Production Readiness (Bank-Transfer-Only Release)

**Input**: `spec.md`, `plan.md`, and approved policies recorded in `research.md`.
**Status**: In progress; not release-ready. The approved bank-transfer boundary and initial readiness slices are implemented, but decision-dependent policy, route-complete evidence, operational drills, accessibility evidence, and named signoffs remain open. See `release-unblock-plan.md` for decision proposals and gate ownership.
**Rule**: For each implementation task, write the failing BDD/contract test first (Red), then focused unit/integration coverage, implementation (Green), refactor, and rerun focused plus applicable regression tests. Do not delete, skip, loosen, or replace existing assertions to obtain a pass without approved documented justification.

## Phase 1: Discovery, Decisions, and Baseline

**Purpose**: Resolve assumptions before encoding business behavior; establish route-level regression inventory.

- [x] T001 Inventory every customer/admin page and API method, actor, auth boundary, mutation, state, success/error/empty/degraded branch in `research.md`; link each route to its current tests and identify uncovered paths. See `route-scenario-matrix.md`.
- [ ] T002 Record current passing test/build/lint/typecheck/migration/CI baselines and failures without changing implementation; identify current critical customer and admin journeys and regression selectors. The pre-change `pnpm test` baseline is recorded in `research.md`; build, lint, typecheck, migration, and CI baselines remain pending.
- [ ] T003 Obtain product approval for resource conflict scope, buffer boundary semantics, booking lead-time/past-date policy, daily cap semantics, transfer reconciliation/confirmation, pending-transfer expiry/refund policy (no electronic refund in this release), notification behavior, and operational owner. Partial approval recorded 2026-10-08: one shared provider for all services, two-hour lead time, past-time rejection, daily cap excludes only cancelled/expired, `America/Barbados`, 24-hour hold plus two-hour review grace, immediate cancellation release, single-admin audited reconciliation, and product owner as provisional release owner. Still needs buffer-override scope/location/travel policy, relevant notification details, and named approver.
- [ ] T004 Obtain operator/security approval for rate-limit thresholds and trusted-proxy/IP policy, idempotency-key scope/retention, PII retention period, backup RPO/RTO, alert thresholds, migration recovery approach, and production service topology. Partial approval recorded 2026-10-08: staging thresholds, configured ingress only, seven-day UUID idempotency, GDPR applies, one-year minimized audit retention, RPO <=24h/RTO <=8h with encrypted daily backups. Still needs booking/customer PII retention schedule/exceptions, staging confirmation of Redis-loss behavior and production threshold approval, alert thresholds, named operations/security owners, and drill evidence.
- [x] T005 Document release non-goals and fail-closed Stripe boundary; confirm no card payment, PaymentIntent, webhook, Stripe secrets, or Stripe live-payment checks are required in production for this release. Add a fail-closed bootstrap and seed policy that prevents destructive writes in production-like targets. See the release docs, `production-readiness-payment-boundary.test.ts`, production env contract, and seed-safety tests.
- [ ] T006 Create route-to-scenario traceability template and risk/threat model covering public booking, auth/reset, admin, email worker, deletion, media upload, and operations endpoints. Ensure each route and branch maps to a BDD scenario and an automated contract/integration assertion before release signoff.

## Phase 2: Foundation Contracts and BDD (Tests First)

**Purpose**: Define behavior and fail on current gaps before implementation.

- [x] T007 [P] Write BDD feature for catalog and service discovery: each offering filter, active/inactive service, empty catalog, valid detail route, unknown service, navigation/back path, and responsive/keyboard access in `bdd/customer-catalog.feature`.
- [x] T008 [P] Write BDD feature for availability and booking: valid dates/durations, unavailable dates/slots, malformed inputs, past/outside-hours/override/blackout/daily-cap conditions, overlap boundaries, concurrent collision, stale availability, duplicate retry, and recoverable errors in `bdd/booking-integrity.feature`.
- [x] T009 [P] Write BDD feature for bank-transfer-only checkout: invalid form, pending booking/reference/instructions, double-submit/retry, card payload rejection, payment-intent/webhook unavailability, and success-route missing/unknown IDs in `bdd/bank-transfer-only.feature`.
- [x] T010 [P] Write BDD feature for auth/admin access: anonymous, wrong role, valid admin, expired/malformed session; admin dashboard; service, availability, booking, settings, admin-account, media, and email actions; invalid inputs; forbidden actions; and recovery in `bdd/admin-operations.feature`.
- [x] T011 [P] Write BDD feature for public abuse/security: login failures, reset request/confirm, booking spam, deletion request/confirm, rate-limit threshold, distributed instances, spoofed forwarding headers, replay, and safe error responses in `bdd/security-and-rate-limits.feature`.
- [x] T012 [P] Write BDD feature for email and privacy operations: queue success/unavailable, worker restart, retry exhaustion, duplicate delivery prevention, deletion invalid/expired/replayed token, age purge schedule, and audit outcomes in `bdd/email-and-privacy-operations.feature`.
- [x] T013 [P] Write BDD feature for operational degradation: DB/Redis/worker/email failures, health/readiness, startup config omissions, backup/restore, migration failure/recovery, staging smoke, and alert handling in `bdd/production-operations.feature`.
- [ ] T014 Create `contracts/openapi.yaml` for this feature if absent, then add contract tests for every active API method/request/response/error schema and explicitly disabled Stripe routes before implementation.
- [ ] T015 Define test fixtures, deterministic clocks, isolated database/Redis/queue setup, concurrency harness, and reusable Playwright journeys without weakening shared test configuration.

**Checkpoint**: All business policies are approved; BDD and contract tests demonstrate current failures; every in-scope route maps to a test or explicitly tracked operational drill.

## Phase 3: US1 - Customer Booking Integrity

**Goal**: A customer can only reserve a valid available slot once, with a consistent outcome and recoverable failures.

### US1 Tests

- [ ] T016 [P] Add unit tests for interval overlap, buffer boundaries, date/timezone boundaries, active service, duration-price resolution, business hours, overrides, blackout, lead-time, and daily-cap calculations.
- [x] T017 Add PostgreSQL integration tests proving overlap prevention under parallel transactions, equal-start collision, adjacent legal slot behavior, cancellation release, and daily-cap enforcement at the transaction boundary. See `tests/integration/db/booking-concurrency.test.ts` (runs only when `INTEGRATION_DATABASE_URL` names a `*_test` database; wired into CI).
- [ ] T018 Add route integration tests proving the server ignores or rejects tampered client availability, price, and duration, as well as inactive services, past/outside-hours/blocked dates, invalid payloads, malformed JSON, stale slots, and duplicate idempotency keys.
- [ ] T019 Add Playwright BDD automation for every catalog-to-booking success, validation, unavailable-slot, conflict/retry, and service-not-found journey at mobile/tablet/desktop.

### US1 Implementation

- [ ] T020 Implement authoritative server-side eligibility and availability validation in the booking route/domain service; reject invalid booking requests before writes or side effects. Done: business hours, blackout ranges, date overrides, slot grid (`booking-eligibility.ts`), lead time, overlap, cap. Open: route-level tests for override/blackout/DST branches.
- [x] T021 Implement transactional interval conflict prevention with a database-enforced or equivalently race-safe PostgreSQL strategy; provide reviewed forward migration and operational migration notes. See migration `20261008150000_enforce_active_booking_overlap` (GiST exclusion constraint plus advisory lock; operator pre-check query and forward-fix are in the migration header).
- [ ] T022 Make booking creation idempotent for client retries; persist key/request fingerprint/outcome safely, reject mismatched reuse, and define retention/cleanup without disclosing customer data.
- [ ] T023 Atomically enforce daily cap and state transition constraints; ensure cache invalidation happens after committed writes and stale cache cannot authorize a booking.
- [ ] T024 Preserve public catalog, filter, detail, availability, and success behavior; provide structured, accessible recovery for rejected/stale bookings without losing entered details unnecessarily.
- [ ] T025 Update unit/integration/API-contract coverage and generated/service types for any accepted contract or migration change; document it in the feature OpenAPI contract.

**Checkpoint**: PostgreSQL concurrency tests prove no overlapping active reservation can commit; every invalid booking branch has no booking/email side effect; customer BDD journeys pass.

## Phase 4: US2 - Bank-Transfer-Only and Reservation Lifecycle

**Goal**: Production has one explicit, truthful payment path and coherent reconciliation/expiry behavior.

### US2 Tests

- [x] T026 [P] Add route/contract tests that only bank transfer is accepted, card payloads fail closed, payment-intent creation is unavailable, Stripe webhook route is unavailable, and absent Stripe variables do not break config validation. Build/start/health verification remains in T068.
- [ ] T027 Add integration/BDD tests for safe bank details/reference, pending status, staff reconciliation, confirmation email, cancellation, expiry, retry/replay, race between expiry/reconciliation/cancellation, and availability release. Partial: real-PostgreSQL tests cover expiry/cancel/reconciliation races and exactly-once notices (`tests/integration/db/transfer-lifecycle.test.ts`). Open: BDD/E2E for bank details, staff reconciliation UI, and availability release.
- [ ] T028 Add security tests proving no Stripe request, secret, client script, hidden active card control, or provider exception reaches customer/admin/worker paths in production mode.

### US2 Implementation

- [x] T029 Remove the active card processing branch and Stripe client UI from checkout, reject `CARD` at the request boundary, and preserve bank-transfer completion.
- [x] T030 Disable payment-intent and Stripe webhook routes for this release with an explicit safe response; make Stripe environment variables optional and remove eager Stripe initialization from production startup/build paths while retaining only approved future extension points.
- [ ] T031 Add production bank-transfer instructions/sender configuration through validated admin/secret configuration; remove sample financial details from production seed/bootstrap.
- [x] T032 Implement the approved pending-reservation expiry scheduler, idempotent state transition, transactional availability release, and customer/admin notification. Ensure it cannot expire a reconciled/cancelled booking. Done: 5-minute scheduled expiry, atomic transition plus outbox customer notice, race-safe against reconciliation/cancellation (real-PostgreSQL race test); admins see transfers in review grace, recent expiries and failed emails on the dashboard and `/api/admin/dashboard/pending-actions`.
- [ ] T033 Define admin reconciliation semantics and implement a guarded/audited action, including confirmation and duplicate-operation behavior; update admin UI, contract, Storybook, and E2E.
- [ ] T034 Verify bank-transfer confirmation/success route, ICS behavior if present, email content, and accessibility across all relevant outcomes; update API and user documentation.

**Checkpoint**: Production configuration has no Stripe dependency and no callable card path; transfer lifecycle is approved, deterministic, auditable, and tested.

## Phase 5: US3 - Admin Security and Public Abuse Resistance

**Goal**: Admin operations are deny-by-default, while abusive public requests are throttled consistently across instances.

### US3 Tests

- [x] T035 [P] Add BDD/E2E authorization coverage for every admin page and API method: anonymous, wrong role, expired/stale session, valid admin, direct URL, mutation denial, and session recovery. Done: `admin-deny-by-default.test.ts` (every admin API method and page: anonymous, customer, role-less, id-less sessions deny; valid admin passes the gate) and `admin-proxy-session.test.ts` (expired/tampered token, wrong role, login recovery, valid admin). Browser-level Playwright journeys remain under T065.
- [ ] T036 [P] Add contract/integration tests for every admin list/filter/sort/pagination, service CRUD/media, availability/settings, booking status/reconciliation/cancel/resend, dashboard, and admin-account mutation outcome.
- [x] T037 Add route-level distributed rate-limit tests across independent app clients for login, password reset, booking, and customer-data routes; verify `429`, retry metadata, recovery window, trusted-proxy behavior, and fail policy when Redis is unavailable. Done: real Redis, independent connections, all public limited routes (booking, login helper, reset request/confirm, deletion request/confirm) prove approved limits, 429 metadata, spoof isolation and 503 outage. Staging confirmation of proxy hops remains under T074.
- [ ] T038 Add security tests for request validation, CSRF/origin posture where applicable, open redirect/callback validation, upload constraints, error sanitization, and secrets/PII exclusion from logs.

### US3 Implementation

- [x] T039 Apply a shared admin authorization guard to every protected page and API mutation; ensure authorization is independently enforced in handlers and role/session failures reveal no protected data. See T035: guard verified on every admin page and API method; `/admin/bookings` and `/admin/services` now gate server-side.
- [ ] T040 Add Redis-backed atomic rate limiting with bounded key lifecycle and documented trusted proxy configuration; attach it to the actual routes and avoid memory-only production fallback. Done: booking, password reset request/confirm, deletion request/confirm, and admin login (10/IP/15m, `login-rate-limit.test.ts`); Redis outage fails closed with a `rate_limit_unavailable` log event for alerting (`rate-limit-outage-alert.test.ts`). Open: cross-instance test against real Redis, trusted-proxy docs, alert wiring (T075).
- [ ] T041 Ensure login/reset responses resist account enumeration, protect reset tokens, validate callback targets, and rate-limit credential operations without locking out legitimate users permanently.
- [ ] T042 Normalize structured API errors and logs; redact secrets, reset tokens, session credentials, unnecessary PII, request bodies, and operational internals. Progress: password-reset request no longer logs the reset token or email address. Open: password-reset email delivery and reset page are not implemented (token is stored but never sent), and tokens are stored unhashed.
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

- [x] T048 Guard destructive seed operations against production URLs/environment and separate local fixture admin credentials from production provisioning; add safety tests and operator documentation. Playwright destructive setup also requires a dedicated local `*_test` database.
- [ ] T049 Configure verified production sender identities and secrets through the deployment secret store; add sanitized operational status, queue/worker health, retry policy, and manual recovery runbook.
- [x] T050 Make email processing idempotent across worker retries; ensure notification creation/state is consistent with database transitions using transactional outbox or approved equivalent where required. Done: transactional outbox (`email_outbox`) for expiry, cancellation and reconciliation; deterministic job IDs; Resend idempotency key per job so retries cannot double-send; provider error responses now fail the job instead of being marked SUCCESS; admin resend now enqueues a fresh job (a fixed job ID previously made it a no-op).
- [ ] T051 Schedule and monitor PII purge; use single-use deletion confirmations and transactional/anonymization behavior; ensure retained audit records follow approved minimization policy. Done: hourly `privacy-maintenance` job now anonymizes customers 24 months after booking end (D9a), `PII_PURGE_LEGAL_HOLD=true` suspends it, covered by `pii-retention-policy.test.ts`. Open: per-customer transactional anonymization, job failure alerting, concurrent-confirmation tests (T046).
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

## Phase 9: Release Blockers Requiring People or Infrastructure

**Purpose**: Evidence that code changes cannot produce. Owner for every task is Malcolm unless noted. Each task is complete only when an artifact (log, report, screenshot, or run URL), environment, and date are linked in `release-unblock-plan.md`. Phase 9 must be closed before T070.

- [ ] T071 [BLOCKER] Provision an isolated staging environment (web, worker, PostgreSQL, Redis, private network, secrets from the secret store) and deploy the release candidate; record the staging release ID. Prerequisite for T057, T072-T076.
- [ ] T072 [BLOCKER] Run and record the backup/restore drill (T055): encrypted daily backup restored into isolated staging; measure achieved RPO (<=24h) and RTO (<=8h); verify access protections.
- [ ] T073 [BLOCKER] Run and record the migration recovery drill (T056) on a production-like copy: apply all migrations including `20261008150000_enforce_active_booking_overlap` after running its pre-check query; exercise the documented forward-fix path.
- [ ] T074 [BLOCKER] Run staging rate limits for 4 days (approved login 10/IP/15m, reset 5/IP/hour, booking 5/IP/10m, deletion 3/IP/hour); review false positives, verify trusted-proxy behavior and Redis-outage 503 behavior, then record production threshold approval.
- [ ] T075 [BLOCKER] Configure alert delivery to a monitored channel and prove it fires for: Redis unavailable (rate-limit 503), database unavailable, worker heartbeat lost, email retry exhaustion, queue backlog. Record a test alert for each. Code side done: alert events, `ALERT_WEBHOOK_URL` push, and `pnpm alerts:test` which sends one test alert per event. Open (needs you): set a real webhook, run `pnpm alerts:test`, and record that each alert arrived.
- [ ] T076 [BLOCKER] Run container image vulnerability scanning on web and worker images in CI and on the release candidate; fix or record time-boxed exceptions for high/critical findings.
- [x] T077 Document the buffer-override extension point (D1a): resource policy shape, override audit fields, enforcement locations, and test additions required to enable it later. Override remains disabled. See "Buffer Override Extension Point" in `research.md`.
- [ ] T078 [BLOCKER] Run Lighthouse (Accessibility >=95) and WCAG 2.2 AA review, including keyboard and screen-reader passes, on customer and admin critical journeys against staging; attach reports (T065, T066).
- [ ] T079 [BLOCKER] Record signoffs (T070): Malcolm as release owner, operations, QA/accessibility, security (stated as self-review), and product, with rollback readiness and Stripe-deferral acknowledgment.
- [ ] T080 Restrict published PostgreSQL/Redis ports to loopback or the private network in all non-local deployments; verify with a port scan from outside the host. Done in repo: production baseline publishes no DB/Redis ports on an internal network with a required Redis password; dev override binds loopback only; local containers recreated and verified (loopback reachable, LAN blocked). Open: external port scan of the real deployment.

## Dependencies and Release Rule

- Phase 1 and Phase 2 precede all implementation.
- US1 booking integrity precedes customer-flow finalization and transfer lifecycle.
- US2 and US3 API contracts stabilize before corresponding UI/E2E completion.
- US4 and US5 can proceed in parallel after shared contracts, with isolated test fixtures.
- Phase 8 cannot pass while any in-scope path lacks traceable passing evidence or any regression remains unexplained.
- A later Stripe release is a separate feature branch/specification and does not reopen or weaken this release's acceptance criteria.
