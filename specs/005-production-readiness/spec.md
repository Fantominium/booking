# Production Readiness: Bank-Transfer-Only Release

**Status**: Draft for review; implementation must not begin until this specification and its tests are approved.
**Branch**: `production-readiness`
**Release boundary**: Customer bookings use bank transfer only. Stripe card payment, PaymentIntent, and webhook integration are explicitly deferred to a future separately approved specification.

## Problem

The application has a working foundation but has production risks around booking integrity, authoritative availability validation, unsafe seed behavior, public endpoint abuse, unverified bank-transfer operations, incomplete end-to-end journey coverage, and deployment/operations evidence. Stripe code and required environment variables remain active even though card checkout is hidden, creating a hidden release dependency and an unintended callable payment path.

## Goal

Enable a controlled production release of the current customer booking and admin workflows with bank transfer as the sole payment option. Preserve all currently supported non-payment behavior, prevent invalid or overlapping reservations, protect public and administrative boundaries, and require reproducible test and operational evidence before promotion.

## Approved Product and Operational Decisions

- Adjacent bookings are not allowed. A minimum 1 hour buffer is required between any two bookings for the same service resource unless an administrator explicitly overrides the rule for a specific resource and only when both services occur in the same location and no travel is required.
- Buffer behavior is enforced as a booking and availability rule, not as a UI approximation; the system must reject any reservation that would reduce the gap below the configured minimum.
- Overlap is defined as half-open interval semantics: a booking from start to end occupies `[start, end)`, such that an interval ending exactly when another begins is not considered overlapping, but any actual intersecting interval is disallowed.
- Same-start, same-end, same-resource, and multi-duration collisions are treated as booking conflicts. The rule is evaluated against the full candidate interval, not only the start timestamp, and must reject any collision at the database transaction boundary.
- The approved final conflict model is option 4: resource-policy + override-aware scheduling. The server must evaluate overlap, the minimum 1 hour buffer, and any admin override for same-location/no-travel bookings together, before a booking is committed. This policy is enforced in the database transaction and in the availability calculation.
- The approved final cancellation/expiry model is option 4: explicit state-machine with safe release guard. On explicit cancellation, capacity is released immediately. On expiry, the booking may enter a short, documented grace window only for manual review or administrative reconciliation, after which capacity is released. Expiry and reconciliation must be guarded by atomic state transition checks so both cannot succeed for the same booking.
- All customer-facing public abuse surfaces must use distributed rate limiting; in-memory rate limits are not acceptable for production or staging release evidence.
- The production database topology must avoid paid managed database services. The approved default is self-hosted PostgreSQL with Redis on private infrastructure or a no-cost provider tier with network restrictions and no paid vendor lock-in; managed DB fees are out of scope for this release.
- Production bootstrap and seed commands must fail closed. Any attempt to run destructive seeding or bootstrapping against production-like or production data must exit before data mutation and emit a clear operational error.
- A route-to-scenario traceability matrix is mandatory before release. Every customer/admin route, API action, and success/error branch must map to an approved BDD scenario and a passing contract or integration test.

## Users and Actors

- Customer: browses available services, selects a valid appointment, submits contact details, receives a booking reference and bank-transfer instructions, and recovers from errors.
- Administrator: authenticates and operates bookings, services, availability, settings, email recovery, and administrator accounts.
- Operator: deploys the web app and email worker, manages secrets and migrations, monitors services, responds to failures, and restores data.
- Email worker: processes transactional messages with bounded retries and observable outcomes.

## Scope

- Bank-transfer-only booking and customer confirmation journey.
- Server-authoritative service eligibility, availability, date/time, business hours, blackout, daily-cap, and overlap checks.
- Atomic, retry-safe booking creation and cancellation/confirmation transitions.
- Production-safe bootstrap, secrets, migrations, deployment, backup/restore, health, worker/email operations, and release gates.
- Shared rate limits for exposed public/authentication flows; consistent admin authorization and sanitized failures.
- Customer data deletion and retention execution, including scheduled purge.
- Route and journey inventory, BDD acceptance coverage, contract/integration/unit/E2E/smoke/accessibility tests, and CI enforcement.
- OpenAPI and applicable Storybook, architecture, data-model, runbook, and release-checklist updates.

## Explicitly Deferred / Out Of Scope

- Stripe credentials, card collection, PaymentIntents, Stripe webhooks, refunds, PCI evidence, and live-payment readiness are not release requirements.
- No card option may be shown or accepted in production. Card requests must fail closed; payment-intent and Stripe webhook endpoints must not be usable in this release. Stripe configuration must not be required for build, startup, health, or bank-transfer booking.
- Stripe reintroduction requires a separate approved specification, threat/security review, test plan, provider configuration, and first-payment release gate.
- New booking types, redesigns, unrelated refactors, and infrastructure-provider migration are out of scope.

## Functional Requirements

- **FR-001**: A maintained route and journey inventory MUST enumerate every customer- and admin-reachable page, API endpoint, role boundary, success state, validation failure, empty state, and service-degradation recovery path in release scope. New routes or material path changes MUST update that inventory and coverage.
- **FR-002**: The public catalog MUST show only active services and preserve existing offering filters, detail routes, accessible navigation, and responsive behavior.
- **FR-003**: Booking requests MUST be validated server-side against the current active service, allowed duration/pricing, configured business hours, date overrides, blocked ranges, lead-time/past-time policy, daily cap, and current bookings. Client availability is advisory only. The default minimum gap between any two bookings is 60 minutes. An admin override may reduce or remove the gap only for same-location, no-travel bookings and only when explicitly recorded and enforced at the service/resource policy level.
- **FR-004**: Concurrent bookings MUST NOT overlap for the same bookable resource/service according to the product scheduling rule. Overlap is defined using half-open intervals: `[start, end)`. Any actual intersection, same-start conflict, same-end conflict, same-service multi-duration conflict, or any other resource collision is rejected. Enforcement MUST be transactional and database-backed; tests MUST include concurrent requests and boundary-touching intervals. The final conflict policy is option 4: the server evaluates overlap, minimum 1 hour buffer, and admin override policy together before the booking commit.
- **FR-005**: Retrying an identical booking request after a timeout MUST NOT create duplicate bookings or email jobs. Define and document request idempotency-key lifecycle, conflict behavior, and retention.
- **FR-006**: The production customer journey MUST offer bank transfer only, return safe booking/reference/instructions, preserve input and provide actionable recovery on failure, and never imply that a transfer is already verified when it is pending.
- **FR-007**: Booking confirmation/payment-state transitions MUST be explicit and auditable. Authorized staff MUST be able to reconcile a bank transfer, mark a booking paid/confirmed as defined by product policy, cancel it, and communicate the result without duplicate side effects.
- **FR-008**: Pending bank-transfer reservations MUST have a product-approved expiration/release policy. Expiration MUST be scheduled, idempotent, race-safe against reconciliation/cancellation, and must restore availability and notify the customer when applicable.
- **FR-009**: Stripe configuration MUST be optional for this release. Card payment payloads MUST be rejected; no customer or admin journey may invoke a Stripe API; payment-intent and webhook surfaces MUST be disabled or return a documented unavailable response. Preserve provider-agnostic extensibility without leaving an active unsupported path.
- **FR-010**: Public booking, login, password-reset, and customer-data endpoints MUST use shared, distributed rate limits with safe proxy/IP handling, bounded storage, appropriate `429` responses, and tests against actual routes. In-memory rate limits are not an acceptable production control for public abuse surfaces.
- **FR-011**: All admin pages and APIs MUST consistently require a valid admin session and role. Unauthenticated, wrong-role, expired, and malformed sessions MUST be denied before protected data/actions; mutations MUST validate inputs and authorization independently.
- **FR-012**: Production seed/bootstrap commands MUST fail safely when pointed at production. Production setup MUST be non-destructive and must not create known/default credentials. Development/test fixtures MUST remain isolated. Destructive seed or bootstrap operations MUST exit before any write if the target environment is production-like or production.
- **FR-013**: Production deployment MUST use a secret store, least-privilege credentials, restricted service networking, TLS, reviewed migrations, and a documented rollback/forward-fix procedure. Development Compose credentials/ports MUST NOT be mistaken for production configuration. The approved default topology for this release is self-hosted PostgreSQL and Redis on private infrastructure or a no-cost provider tier with strict network isolation; paid managed database services are not required for this release.
- **FR-014**: Operators MUST have tested PostgreSQL backup and restore procedures with approved recovery-point and recovery-time objectives.
- **FR-015**: Health/observability MUST expose appropriate readiness for the web app and separately monitor worker liveness, queue age/failures, email delivery, database connectivity, and Redis connectivity. Logs MUST be structured, actionable, privacy-conscious, and free of secrets or unnecessary customer PII.
- **FR-016**: Transactional email MUST use verified production sender identities, retry bounded failures, avoid duplicate messages on retries, and expose operator-visible delivery status and recovery actions.
- **FR-017**: Customer deletion and age-based retention MUST execute through verified, scheduled jobs; requests must have expiring, single-use confirmation; deletion operations must be auditable without retaining unnecessary PII.
- **FR-018**: All boundary inputs MUST use Zod or equivalent validation; errors shown to customers MUST be sanitized, actionable, and preserve recoverable form state where practical.
- **FR-019**: Every user-visible journey and outcome branch MUST have an approved BDD scenario and executable automated acceptance coverage; every active API method MUST have contract coverage, and security-/data-critical methods MUST also have integration coverage. Critical customer booking, admin authorization/mutation, email recovery, and privacy paths require unit, integration, BDD, and E2E coverage as appropriate. No in-scope path may be marked covered only because its page renders.
- **FR-020**: A route-to-scenario traceability matrix is mandatory before release. Every customer/admin route and API method must map to a BDD scenario, a contract test, and the relevant integration or E2E verification. The matrix must also record success, validation, authorization, recovery, retry, and dependency-failure branches; no route or branch may be unowned or untested.
- **FR-021**: Release MUST pass existing and new unit/integration/contract/BDD/E2E/smoke tests, lint, typecheck, Prisma validation/migration checks, production build, container runtime verification, dependency/image security checks, and staging smoke/accessibility checks. No existing test may be deleted, weakened, or skipped to obtain a pass without approved justification.
- **FR-021**: Customer/admin critical journeys MUST meet WCAG 2.2 AA, Lighthouse accessibility score of at least 95, responsive requirements, keyboard-only operation, screen-reader clarity, and minimum 44x44px touch target requirements.
- **FR-022**: OpenAPI MUST describe all active endpoints and schemas, including disabled/deferred payment responses as needed. Applicable Storybook stories, data/architecture diagrams, deployment docs, runbooks, and readiness evidence MUST remain aligned.

## Acceptance Criteria

- A traceability matrix maps every in-scope user-visible page, action, and success/error/empty/degraded/retry/recovery branch to an approved BDD scenario and passing automated acceptance test; every active API method maps to passing contract tests and applicable integration tests. Any uncovered path blocks release.
- Parallel requests for equal or overlapping slots cannot both create active reservations. Non-overlapping adjacent boundary cases behave according to the documented buffer rule.
- Requests for inactive services, invalid durations/prices, past dates, outside-hours times, blackout dates/ranges, over-cap days, and blocked or already-booked slots are rejected without creating bookings or emails.
- Repeating a request with the same idempotency key returns the original safe outcome and creates no duplicate booking or notification; reuse with a different payload is rejected.
- Bank-transfer booking completes with correct pending status/reference/instructions. Reconciliation, cancellation, expiry, email failure/retry, and concurrent state-transition outcomes are deterministic and accessible.
- Card choice/API requests fail closed; payment-intent/webhook paths are unavailable; production startup/build/health succeed without Stripe variables; tests detect any reintroduced active Stripe path.
- Production seed attempts fail before data mutation; local/test seeding remains functional.
- Actual protected API/page tests cover unauthenticated, wrong-role, expired-session, valid-admin, and unauthorized mutation paths.
- Distributed rate limiting works across separate app instances and returns correct headers/responses without trusting spoofed client IP headers.
- Backup restore, migration, rollback/forward-fix, worker recovery, queue retry, alert delivery, data-purge schedule, staging deployment, and release promotion are demonstrated and recorded.
- All pre-existing tests and checks plus the new required gates pass; no unrelated changes or unexplained baseline failures remain.
- WCAG/accessibility, mobile/tablet/desktop, keyboard and screen-reader checks pass for each critical changed journey.

## Constitution Alignment

This specification is governed by `.specify/memory/constitution.md`: approval precedes implementation; tests are written first; stories are independently verifiable; all endpoints have OpenAPI coverage; UI has Storybook coverage where applicable; WCAG 2.2 AA is mandatory; CI is authoritative; relevant topology is container-verified; documentation/release artifacts are updated. Deferred Stripe work does not amend provider-agnostic architecture; it establishes a bank-transfer-only release boundary and a separate future approval gate.
