# Release Unblock Plan

**As of**: 2026-10-08  
**Release boundary**: bank transfer only; Stripe stays disabled.  
**Current decision**: blocked from production promotion. Passing the current unit suite and image builds is necessary, but does not demonstrate the route, database, security, privacy, accessibility, or operational acceptance criteria.

## How To Unblock

Treat release readiness as a set of evidence gates, not as a count of checked task boxes. For each gate, retain the named approver, exact artifact or CI run, environment, date, and result. Do not check a task complete based only on an implementation existing.

| Gate                             | Required outcome                                                                                                                                                                                                                                  | Owner / evidence                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| G0: Decisions                    | Product and operator decisions below are approved and dated.                                                                                                                                                                                      | Product owner and operations/security owner; this document.         |
| G1: Contract closure             | Every row and branch in `route-scenario-matrix.md` maps to a real scenario plus a passing route contract/integration test, E2E test, or named operational drill. Remove stale test descriptions only when equivalent or stronger evidence exists. | Engineering and QA; matrix links to CI artifacts.                   |
| G2: Booking integrity            | PostgreSQL-backed parallel requests prove interval, buffer, cap, retry, and state-transition invariants; invalid/stale requests have no booking or email side effects.                                                                            | Engineering; isolated PostgreSQL test run and reviewed migration.   |
| G3: Security and privacy         | Redis-shared limits run across independent app instances; trusted proxy behavior is verified; all admin APIs/pages deny invalid roles; deletion tokens and retention jobs pass route/job tests.                                                   | Security and engineering; CI evidence plus configuration review.    |
| G4: Communications and lifecycle | Transfer reconciliation, cancellation, expiry, retries, and email side effects are atomic/idempotent and demonstrated with the worker and queue.                                                                                                  | Product, engineering, operations; integration and staging evidence. |
| G5: Operations                   | Web/worker readiness, alerts, deploy/forward-fix, backup/restore, and staging smoke are demonstrated against isolated production-like services.                                                                                                   | Named operations owner; drill records and staging release ID.       |
| G6: Accessibility and regression | Customer/admin critical journeys pass responsive Playwright, keyboard and screen-reader review, WCAG 2.2 AA, and Lighthouse Accessibility >=95; baseline regressions are explained.                                                               | QA/accessibility owner; reports and review record.                  |
| G7: Promotion                    | Security scans, CI, required evidence, rollback readiness, and engineering/QA/security/product/operations signoffs are present.                                                                                                                   | Release owner; signed release record.                               |

## Decisions And Approval Status

Product-owner responses were received on 2026-10-08. The decisions below are approved at role level; the person's name and formal security/operations/QA signoffs still need to be attached to the release record. Staging-only approval is not production approval.

| ID  | Decision                       | Approved value / remaining input                                                                                                                                                                                                                          | Status                           |
| --- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| D1  | Capacity resource scope        | All services share one provider/resource. Service-to-resource mapping is therefore global for this release. Same-location/no-travel override eligibility remains unmodeled and must not be inferred from service names.                                   | Approved scope; override blocked |
| D2  | Timezone and DST               | Studio timezone is `America/Barbados`. Store instants in UTC; use studio-local business hours and cap dates; reject nonexistent DST wall times and require explicit offset for ambiguous times.                                                           | Approved                         |
| D3  | Lead time                      | Reject past starts; require a minimum two-hour lead time. No exception approved.                                                                                                                                                                          | Approved                         |
| D4  | Daily capacity                 | Count non-cancelled, non-expired bookings by capacity-bearing resource and studio-local service day, including pending, confirmed, and completed.                                                                                                         | Approved                         |
| D5  | Transfer reservation lifecycle | Hold for 24 hours, then allow a two-hour admin review grace; atomically expire/release after grace. Explicit cancellation releases immediately.                                                                                                           | Approved                         |
| D6  | Transfer reconciliation        | One authorized admin may reconcile; record actor, verified amount/reference/time, audit the transition, and allow it only once.                                                                                                                           | Approved                         |
| D7  | Idempotency                    | Browser-generated UUID per attempt; retain seven days; same key and canonical payload replays the safe result; changed payload returns `409`.                                                                                                             | Approved                         |
| D8  | Rate limits/proxy/outage       | Approved for staging: login 10/IP/15m, reset 5/IP/hour, booking 5/IP/10m, deletion 3/IP/hour; trust configured ingress only. Redis-loss behavior and production thresholds require staging confirmation and production approval.                          | Staging only                     |
| D9  | GDPR retention                 | European GDPR applies. Expired one-time tokens should be purged promptly. Minimized audit records are retained for one year. Booking/customer PII duration and accounting/legal-hold exceptions remain unspecified and require a legal/business approver. | Partial                          |
| D10 | Recovery targets/owners        | RPO <=24h and RTO <=8h with encrypted daily backups approved. Product owner is provisional release owner; named person, operations/on-call primary and backup, QA/accessibility and security approvers remain to be named.                                | Partial                          |

Recommendations are not a substitute for the missing values above. Do not invent booking/customer PII retention, legal-hold exceptions, or named signoff. No buffer override may be offered until location and travel attributes are explicit, validated, and auditable.

## Implementation Order After Remaining Decisions

1. Resolve booking/customer PII retention and legal-hold exceptions, Redis outage behavior, named release/operator/QA/security owners, and whether buffer overrides are needed in this release. Update `research.md`, the scenario matrix, and OpenAPI. Add failing route/contract tests for each next slice before code.
2. Complete booking server validation and persisted idempotency; implement resource-aware interval/buffer/cap enforcement with PostgreSQL integration tests and a reviewed forward migration.
3. Implement pending-transfer expiry and admin reconciliation/cancellation as atomic transitions, with exactly-once email/outbox behavior and race tests.
4. Add Redis-backed rate limiting to actual login, reset, booking, and privacy routes; verify two independent app instances, spoofed headers, and Redis outage behavior.
5. Complete deny-by-default admin coverage across every page and API method; close password reset, deletion-token, scheduled purge, and PII/logging gaps.
6. Instrument web readiness separately from liveness and worker/queue/email health. Add CI gates for route contracts, DB/Redis integration, E2E, production build, image scanning, and container smoke.
7. Run staging, backup/restore, migration recovery, accessibility, and release drills. Attach evidence and close every row in the matrix before signoff.

## Evidence Recorded 2026-10-08 (release candidate checkpoint)

- `pnpm typecheck`, `pnpm lint`, `pnpm test` all pass (65 files passed, 1 skipped: `admin-gate`, 13 cases still skipped and unresolved).
- Real PostgreSQL suite (`INTEGRATION_DATABASE_URL=.../truflow_booking_test pnpm test`) passes 9 tests: 12-way parallel same-slot, unequal-start/spanning/in-buffer overlap, adjacent-legal, parallel daily cap, parallel idempotent replay, key reuse conflict, cancel/expire release, lead-time no-side-effect, direct-insert overlap blocked by constraint.
- Defects found only by the real-database suite and fixed: (1) `pg_advisory_xact_lock` via `$queryRaw` could not deserialize its `void` result, so every real booking would have returned 500; (2) the `(service_id, start_time)` unique index blocked re-booking a cancelled/expired slot and allowed unequal-start overlaps (replaced by exclusion constraint); (3) availability still treated cancelled/expired bookings as blocking.
- Fresh-database `prisma migrate deploy` of all migrations succeeds.
- 2026-10-09 additions: real-PostgreSQL suites now also cover the transfer lifecycle (expiry/cancel/reconcile race, exactly-once outbox notice, failed-dispatch retry) and the PII purge (24-month boundary, returning customers protected, idempotent). Real-Redis suite proves cross-instance rate limiting. Admin deny-by-default matrix covers every admin API method and page. DB suites run serialized in their own vitest project (`INTEGRATION_DATABASE_URL`, `INTEGRATION_REDIS_URL`).
- Unmocked suites were previously unable to detect these; any new booking/transfer/purge logic must add a `tests/integration/db` case.

## Remaining Input Needed, With Recommended Defaults

### Decisions Recorded 2026-10-09 (Malcolm, product owner)

| ID   | Decision                                                                                                                                                                                                                                                                                                                                                                                | Status                                                                           |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| D9a  | Anonymize customer name/email/phone 24 months after booking end; retain minimized financial record 6 years; legal hold suspends purge.                                                                                                                                                                                                                                                  | Approved by product owner; legal/accounting confirmation recommended, not a gate |
| D8a  | Redis unavailable: fail closed (503) on login, reset, booking, deletion; alert on every occurrence.                                                                                                                                                                                                                                                                                     | Approved                                                                         |
| D1a  | Buffer override approved as a documented extension point, not enabled in this release: the 60-minute buffer stays unconditional until location/travel attributes are modeled. Must be documented (resource policy shape, override audit fields, where the check lives in `createBookingWithLock` and `calculateAvailableSlotsForDate`) so it can be added without schema or API rework. | Approved as deferred extension; documentation task T077                          |
| D10a | Malcolm holds release owner, operations primary/backup, QA/accessibility, and security roles. Record explicitly that security review is self-review; attach independent review if one becomes available.                                                                                                                                                                                | Approved                                                                         |
| D8b  | Production rate limits run in staging for 4 days with no unresolved false positives, then are approved.                                                                                                                                                                                                                                                                                 | Approved with 4-day soak (T074)                                                  |

Original recommendations follow for reference.

Answering these unblocks G0. Recommendations are proposals until approved and dated.

| ID   | Question                       | Recommended default                                                                                                                                                                                                 |
| ---- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D9a  | Booking/customer PII retention | Anonymize customer name/email/phone 24 months after the booking end date; retain financial reference/amount for 6 years (accounting) in a minimized form; legal hold suspends purge. Confirm with legal/accountant. |
| D8a  | Redis outage behavior          | Fail closed with 503 for login, reset, booking, deletion (current behavior); alert on it. Preferable to unthrottled credential/booking abuse for a single-provider studio.                                          |
| D1a  | Buffer override                | Out of scope for this release: remove "administrator override" from the approved policy so the 60-minute buffer is unconditional. Defer location/travel modeling.                                                   |
| D10a | Owners                         | Name: release owner, ops primary and backup, QA/accessibility approver, security approver. A single person may hold several roles for a one-operator studio if recorded, with an independent reviewer for security. |
| D8b  | Production rate limits         | Keep staging values; promote after one staging week with no false positives.                                                                                                                                        |

## Still Blocked On Non-Code Work

Backup/restore drill, migration recovery drill, staging deployment, alert delivery, image scan, Lighthouse/WCAG audit, and named signoffs require infrastructure, accounts, or people and cannot be produced by code changes.

## Known Evidence Limits

- The recorded host checks passed at the preceding implementation checkpoint: unit/contract/integration suite, lint, typecheck, Prisma validation, production build, and web/worker image builds. Re-run them on the release candidate; they do not cover all spec requirements.
- The existing Playwright global setup deletes booking/payment-audit data. It must run only against a dedicated disposable database explicitly named `*_test`, never the configured development database.
- Running local Compose PostgreSQL/Redis containers were not recreated during the previous implementation work. Their observed published ports were still bound to all interfaces at that time. Verify and correct the live deployment/host firewall separately; changing the Compose file does not rebind already-running containers.
- No backup/restore, migration recovery, staging, alert, image scan, WCAG, Lighthouse, or named signoff evidence is attached here. Those remain release blockers until an operator/QA artifact is linked.
- The approved staging rate limits are not production approval. Validate false positives and Redis outage behavior in staging, then record production approval before promotion.
