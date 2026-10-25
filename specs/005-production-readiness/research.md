# Research: Production Readiness

## Route Inventory and Test Baseline (2026-10-07)

- The checked-in App Router inventory contains 10 page routes and 29 API route-handler files. The complete method-by-method map, actors, outcome branches, BDD IDs, and contract/integration/E2E evidence targets are maintained in [route-scenario-matrix.md](route-scenario-matrix.md).
- Baseline command: `pnpm test`. Result before readiness test changes: 54 test files passed, 1 file skipped; 148 tests passed, 13 skipped; exit code 0. The 13 skipped cases are in `tests/integration/auth/admin-gate.test.ts` and remain an existing coverage gap, not approved evidence.
- Baseline working tree was clean. No implementation files were changed while capturing this result.
- The baseline contract tests for bookings and payment intents currently assert successful PaymentIntent behavior. This conflicts with the approved bank-transfer-only boundary and is superseded by the first red release-boundary contract checks.

## Release Blocker Decisions (2026-10-08)

Product-owner responses dated 2026-10-08 approved one shared provider/resource for all services, two-hour minimum lead time and past-time rejection, daily cap counting for all non-cancelled/non-expired bookings by resource and local service day, 24-hour pending-transfer hold plus two-hour review grace, immediate cancellation release, single-admin audited reconciliation, seven-day UUID idempotency with changed-payload conflict, staging rate-limit thresholds, UTC storage with studio timezone `America/Barbados` and the stated DST policy, one-year minimized audit retention, and RPO <=24h/RTO <=8h with encrypted daily backups. The product owner is the provisional release owner pending a named person.

Still required: booking/customer PII retention periods and legal/accounting exceptions with an approver; explicit location/travel metadata and override rules if buffer overrides remain in scope; Redis-unavailable policy confirmation and production approval of rate limits; named operations/on-call, QA/accessibility, security, and release approvers. Detailed statuses and recommendations are in [release-unblock-plan.md](release-unblock-plan.md). Staging rate-limit approval is not production approval.

The route matrix is a traceability inventory, not evidence that every listed contract, integration, or E2E test exists or passes. Its current-evidence column must be reconciled with the latest test files and run artifacts before closing T063; several test targets in the matrix were written as planned names and require implementation or replacement with existing equivalent evidence.

## Baseline Observations (2026-10-07)

This is an implementation-oriented snapshot, not a substitute for Phase 1 route discovery or business approval.

- `src/lib/services/booking.ts` checks existing rows only for an equal start time; interval overlap prevention and daily-cap enforcement must be verified at write time.
- `src/app/api/bookings/route.ts` resolves an active service by ID but does not visibly call the availability calculator before writing. Validate service state and every schedule constraint on the server.
- `prisma/schema.prisma` has a unique `(serviceId, startTime)` constraint, which does not by itself prevent unequal-start overlapping intervals.
- `src/components/booking/CheckoutForm.tsx` currently hides the card selector, but `src/app/api/bookings/route.ts` still accepts card and creates a PaymentIntent; `src/app/api/payment-intents/route.ts` remains exposed, Stripe environment variables are required in `src/lib/config/env.ts`, and a webhook route is present.
- `src/lib/middleware/rate-limit.ts` stores counters in a process-local `Map`; a source search found no application route calling `rateLimit`.
- `prisma/seed.ts` deletes booking, audit, and service rows and provisions a known local admin; it must never be used as production bootstrap.
- `src/lib/jobs/pii-purge.ts` exposes a purge function; no scheduled invocation was found in `src` during initial targeted search.
- `src/app/api/health/route.ts` checks PostgreSQL and Redis but not worker heartbeat, queue backlog, or email delivery.
- `docs/deployment.md` describes Vercel setup but does not document a full controlled production migration, backup restore, or rollback/forward-fix drill.
- `.github/workflows/ci.yml` runs validation/tests/security audit/build, but the reviewed workflow does not show required Playwright E2E, container scan/topology verification, or staging promotion checks. Verify current workflow inventory in Phase 1.
- Existing `docs/overhaul/PRODUCTION_READINESS_CHECKLIST.md` and `FIRST_PAYMENTS_READINESS_CHECKLIST.md` are unchecked templates. The latter is not a gate for this release because Stripe is deferred; update the former with explicit bank-transfer release evidence and record Stripe as deferred.

## Approved Scheduling Policy

The following decisions are now approved and must be encoded as testable requirements before implementation:

- Adjacent bookings are not allowed. Any booking must maintain a minimum 60-minute gap from adjacent bookings for the same resource unless an administrator explicitly overrides the rule for a same-location, no-travel booking.
- The default buffer is required in both the booking availability calculation and the database write check. The admin override must be stored as a resource-specific policy and must not be inferred from the frontend state.
- Overlap is defined as half-open interval semantics: a booking occupies the range `[start, end)`. If the end of one booking equals the start of another, the intervals do not overlap. If any actual intersection occurs, or if the candidate booking intersects the same resource in any way, the request is rejected.
- Same-start, same-end, same-resource, and multi-duration collisions are all conflict classes. A same-start booking with a different duration is still a conflict; a same-end booking with a different duration is still a conflict; a longer booking that spans multiple shorter bookings is also a conflict. The conflict check must consider the full candidate interval, not only the start or end timestamps.
- Final approved model: option 4, resource-policy + override-aware scheduling. The server evaluates resource, location, travel requirement, overlap, and minimum 60-minute buffer together before committing the booking. This is enforced in both the availability calculation and the database transaction.

## Buffer Override Extension Point (approved as deferred, 2026-10-09)

The 60-minute buffer is unconditional in this release. Enabling an administrator override later should require no rework of the booking contract or schema shape described here.

- **Where the buffer is applied today**: `bufferMinutes = max(settings.bufferMinutes, 60)` in `src/app/api/bookings/route.ts` is stored as part of the booking's `end_time` (`start + duration + buffer`) by `createBookingWithLock` (`src/lib/services/booking.ts`) and mirrored in `calculateAvailableSlotsForDate` (`src/lib/services/availability.ts`). The database exclusion constraint `bookings_no_active_overlap` guards `[start_time, end_time)`.
- **Why it needs more than a flag**: the override is only valid for same-location, no-travel pairs. The system has no location or travel attributes, so it must not be inferred from service names.
- **Required additions to enable it**:
  1. Schema: `Service.locationId` (or a `Location` model) and `Service.requiresTravel`; a `BookingBufferOverride` table (`bookingId`, `adminId`, `reason`, `reducedBufferMinutes`, `createdAt`) so every override is audited.
  2. Single decision function `resolveBufferMinutes({ previous, candidate, override })` used by both the availability calculator and `createBookingWithLock`; it returns 60 unless both bookings share a location, neither requires travel, and an audited override exists.
  3. Persist the effective buffer on the booking (`bufferMinutes` column) instead of re-deriving it, so `end_time` and the exclusion constraint stay correct and `getBookedServiceDurationMinutes` no longer assumes 60.
  4. Admin-only endpoint to create the override with actor and reason; deny-by-default and audited like reconciliation.
  5. Tests: extend `tests/integration/db/booking-concurrency.test.ts` with override parallel-request cases, add unit cases for `resolveBufferMinutes`, and add a contract case proving non-admin and cross-location requests cannot reduce the buffer.
- **Invariant to keep**: overlap of `[start, end)` is never overridable; only the trailing gap may be reduced, never below zero.

### Collision classification: four viable options

1. Start-time-only collision check
   - Simpler to implement: reject any booking with the same start time for the same resource.
   - Weakest option. It misses same-end and same-duration span conflicts and does not protect against partial overlap.
   - Best for extremely rigid calendars, but not suitable for a booking system that must prevent “hidden overlaps.”

2. Exact interval-overlap only
   - Reject only bookings where the ranges intersect, using half-open interval comparison.
   - Good safety model, but it still allows scheduling decisions that produce undesired adjacency if the intention is a minimum 60-minute gap.
   - Best when the business rule is “do not overlap” and buffer is handled separately as an availability rule.

3. Overlap + minimum-gap enforcement
   - Reject any intersecting intervals and any second booking whose start is within 60 minutes of the prior end.
   - This is the clearest product rule for adjacent bookings.
   - Best operational fit with the approved policy, especially when travel or room turnover matters.

4. Resource policy + override-aware scheduling
   - Combine overlap rules, buffer rule, and explicit admin override metadata for same-location/no-travel bookings.
   - Strongest model because it respects both business safety and operational exceptions.
   - Best long-term solution and the one selected for this release.

Final decision: use option 4, implemented as a single server-side rule that evaluates resource, location, travel flag, overlap, and buffer policy at the same time. It is the safest, most explicit, and most auditable model.

## Cancellation and Expiry Policy

The release decision is to explicitly decide whether cancellation or expiry frees capacity immediately or after a grace period. The following options are the most realistic design choices:

1. Immediate release on cancellation/expiry
   - Best for operational simplicity and maximum utilization.
   - It lets a new booking claim the slot as soon as the current reservation is revoked.
   - Risk: a customer could lose a booked slot during a manual reconciliation race if the system does not validate state transitions safely.

2. Grace window before release
   - The slot stays blocked for a short window, such as 15 to 60 minutes, before availability is reopened.
   - Useful when staff need time to reconcile a pending transfer or recover from a missed confirmation.
   - Risk: it reduces utilization and must be carefully timed to avoid customer confusion.

3. Immediate release on cancellation; delayed release on expiry
   - Works well if cancellation is an explicit user decision and expiry is a system-induced cutoff.
   - This gives staff time to reconcile pending transfer bookings while still recovering capacity promptly after user cancellation.
   - Best balanced solution when both operational and customer scenarios matter.

4. Explicit state-machine with safe release guard
   - The booking must pass through states such as `PENDING`, `CONFIRMED`, `CANCELLED`, `EXPIRED`, and the system releases the slot only when the current state is terminal and no reconciliation action is pending.
   - This is the strongest and most auditable design.
   - Best fit for production because it prevents race conditions and preserves auditability.

Final decision: use option 4 with the agreed additions:

- immediate release on explicit cancellation,
- a short, documented grace window only for expiry/review states,
- atomic state transition checks so expiry and reconciliation cannot both win.

The system must atomically validate state transitions before it frees capacity or marks a booking as reconciled, cancelled, or expired. This is required to prevent the race where both admin reconciliation and system expiry succeed for the same booking.

## Rate-Limit and Database Requirements

- Public abuse surfaces must use distributed rate limits implemented in Redis or another shared store; in-memory limits are not acceptable for production or staging evidence.
- The production topology must not require paid managed database services. The approved choice is self-hosted PostgreSQL and Redis on private infrastructure or a no-cost provider tier with strict network controls and no paid vendor lock-in.
- Redis must be used for shared counters and request quota enforcement; the proxies must trust only the correct forwarded IP chain and must reject spoofed headers.

## Bootstrap, Seed, and Fail-Closed Policy

Production bootstrap and seed commands must fail closed before any write. The operating rule is:

- If the environment is production-like or production, the script exits non-zero with a clear message.
- If the database target is not explicitly isolated for development or staging, the script refuses to run.
- Local/test admin credentials must remain isolated and must never be created automatically in production.
- A destructive seed must never be allowed to run as a default command in deployment or CI to production targets.

## Route-to-Scenario Traceability Matrix Requirement

Before release signoff, create a matrix that maps each customer/admin route and API operation to:

- the actor and preconditions,
- the user-visible outcome,
- the relevant BDD scenario,
- the contract or integration test that proves the behavior,
- the success/error/retry/recovery branch,
- the owner and evidence location.

No route, branch, or API method may be left unowned or untested. The matrix is mandatory and is the final release gate for the production-readiness work.

## Route/Path Inventory Work Required

Phase 1 must verify the actual route tree and enumerate at least:

- Customer pages: home, booking catalog and filters, service detail, booking flow, booking success, login-related links if exposed, customer-data request/confirmation, and all not-found/invalid identifier states.
- Customer APIs: services, availability, booking create, any payment-intent surface (disabled), password reset request/confirm, customer-data request/confirm, health, and Stripe webhook surface (disabled).
- Admin pages/actions: dashboard, bookings, booking detail/actions, services and media, availability/business hours/date overrides, system settings, admin accounts, login/logout/session expiry, resend email, cancellation, and bank-transfer reconciliation.
- Cross-cutting outcomes: malformed input, validation, inactive service, stale availability, conflicts, duplicate request, database/Redis/worker/email outage, rate-limit response, unauthorized/wrong-role/stale session, empty states, retries, and recovery.

## Decisions That Block Behavioral Tests

Record named approver and decision date before implementation:

- Booking resource scope: service-level exclusivity or shared provider/resource across services.
- Whether buffers apply before, after, or both; exact adjacency semantics.
- Accepted lead time, time zone, daylight-saving behavior, and date-override precedence.
- Atomic daily-cap definition and cancelled/expired booking counting.
- Bank-transfer pending reservation TTL, reconciliation authority, confirmation state, cancellation, and customer communication.
- Idempotency key generation, scope, payload fingerprint, retention, and response replay behavior.
- Rate limits, trusted proxy chain, Redis failure policy, and retry window.
- PII retention basis, scheduled purge interval, audit retention, and deletion edge cases.
- Backup RPO/RTO, restoration authority, and incident escalation.
- Production service topology/hosting, migration approval, rollback or forward-fix strategy, and named on-call owners.

## Regression Guard

No behavior should be removed solely to make new tests pass. Before implementation, record every existing automated suite and known journey. The acceptance traceability matrix must include all public/admin routes and supported customer outcomes; compare the final results to baseline and require review for any intentional contract change. Tests may be updated only for approved specification changes and must retain equivalent or stronger coverage.
