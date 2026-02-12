# Research & Technical Decisions: TruFlow Booking Platform

**Feature**: [001-truflow-booking](../spec.md)  
**Session**: 2026-02-03  
**Status**: Complete  

---

## Research Questions & Decisions

### 1. Email Queue & Retry Architecture

**Unknown**: How should async email delivery with automatic retries be implemented? What's the best pattern for exponential backoff?

**Decision**: Background job queue with exponential backoff using `bullmq` library

**Rationale**:

- Stripe integration for payment confirmation is also webhook-based; aligning email delivery on the same async queue pattern ensures consistency
- BullMQ provides persistent job queue backed by Redis, handles retries with exponential backoff, and offers TTL for expired jobs
- Exponential backoff schedule: 1 min, 5 min, 15 min prevents overwhelming the email service
- Redis availability is low-risk given PostgreSQL requirement already adds infrastructure complexity

**Alternatives Considered**:

- AWS SQS: Would require Vercel-specific AWS integration; adds vendor lock-in
- Temporal.io: Enterprise-grade but overengineering for MVP; too much infrastructure overhead
- Simple retry loop in webhook handler: Risk of message loss on webhook handler crash; no persistence guarantee

**Implementation Details**:

- Job definition: `{ bookingId, customerEmail, type: 'CONFIRMATION' | 'REFUND_NOTIFICATION' }`
- BullMQ worker processes 10 jobs concurrently
- Max retries: 3; final failure triggers admin alert (warning in dashboard)
- Job persistence: Redis stores job state; survives application restart
- Setup cost: Redis instance ($10–50/month on Vercel/cloud provider) vs. development time saving

**Related Requirements**: FR-011, SC-003 (95% delivery within 2 minutes)

---

### 2. Stripe Refund Handling for Booking Conflicts

**Unknown**: Should refunds be automatic or manual? How to handle refund failures?

**Decision**: Automatic refund via Stripe Refund API with async retry queue; failed refunds escalated to admin

**Rationale**:

- Spec clarification (Q4) mandates graceful conflict recovery; automatic refund maintains user trust
- Stripe Refund API is idempotent by design (idempotency key-based); safe to retry
- Admin must approve edge-case scenarios (partial refunds, fee reversal) for rare fraud cases

**Alternatives Considered**:

- Manual refund: Requires admin intervention; violates UX requirement for "instant error handling"
- Stripe Refund API with fire-and-forget: Risk of silent failure; customer never refunded if API fails
- Automatic refund with zero retry: Acceptable but less resilient than queue-based retry

**Implementation Details**:

- On booking conflict detection: Trigger refund job: `{ paymentIntentId, bookingId, amountCents, reason: 'SLOT_CONFLICT' }`
- BullMQ worker calls `stripe.refunds.create({ payment_intent: paymentIntentId, reason: 'requested_by_customer' })`
- Max retries: 3 (same as email queue)
- Refund notification email queued immediately; contains refund tracking ID
- Admin dashboard shows "Pending Refunds" section; failed refunds trigger Slack alert (future enhancement)

**Related Requirements**: FR-007b (new), Edge Case: Concurrent bookings, SC-004 (0% double-bookings)

---

### 3. Database Transactions & Row-Level Locking for Concurrency

**Unknown**: How to implement atomic booking creation with row-level locking in PostgreSQL + Prisma?

**Decision**: Use Prisma raw SQL transaction with explicit row-level locking (`SELECT FOR UPDATE`) on availability check

**Rationale**:

- PostgreSQL supports serializable isolation and row-level locking; Prisma `$transaction()` provides transactional safety
- `SELECT FOR UPDATE` locks the row during the transaction, preventing concurrent updates
- Raw SQL needed because Prisma ORM doesn't expose row-level locking through high-level API
- This satisfies SC-004 (0% double-bookings) and FR-004 (atomic transactions with row-level locking)

**Alternatives Considered**:

- Optimistic concurrency (version numbers): Requires retry loop on conflict; customer sees error and must retry; not aligned with UX goal
- Pessimistic locking (reserve slot during checkout): Blocks slots for up to 15 minutes; blocks other users; scales poorly with 50 concurrent users (SC-007)
- Application-level mutex (in-memory lock): Not distributed; fails on multi-server deployments (horizontally scaled)

**Implementation Details**:

```typescript
// Pseudo-code
await prisma.$transaction(async (tx) => {
  // Lock the slot for duration of transaction
  const existingBooking = await tx.$queryRaw`
    SELECT id FROM bookings 
    WHERE start_time = ${slotTime} AND status != 'CANCELLED'
    FOR UPDATE
  `
  
  if (existingBooking.length > 0) {
    throw new BookingConflictError('Slot already booked')
  }
  
  // Insert new booking in same transaction
  return await tx.booking.create({
    data: { startTime: slotTime, customerId, ... }
  })
})
```

- Row lock released when transaction commits or rolls back
- Lock held for minimal duration (milliseconds); doesn't block other slots
- Idempotency key prevents duplicate booking if payment webhook retries

**Related Requirements**: FR-004, SC-004, SC-007, Edge Case: Concurrent bookings

---

### 4. Audit Logging for PII Deletion & Financial Compliance

**Unknown**: What should audit logs contain? Where should they be stored? How long retained?

**Decision**: Dedicated `PaymentAuditLog` + `DataDeletionAuditLog` tables; 7-year retention; quarterly compliance reviews

**Rationale**:

- Financial transaction records must be retained for 7 years (tax/legal requirement)
- Separate audit tables from operational data prevents accidental data loss
- Structured audit schema enables compliance queries and dispute resolution
- Clarification (Q3) specifies: immediate deletion with audit logging, 7-year retention

**Alternatives Considered**:

- Single generic audit table: Hard to query for compliance; mixes payment and deletion contexts
- Cloud audit logs (Vercel, AWS): Convenient but vendor lock-in; harder to query and control
- In-app logs (database logs): Risk of truncation; hard to query structured data

**Implementation Details**:

**PaymentAuditLog Table**:

```
id, timestamp, booking_id, action, amount_cents, 
stripe_event_id, stripe_payment_intent_id, ip_address, user_agent, outcome
```

- Actions: INTENT_CREATED, PAYMENT_CONFIRMED, PAYMENT_FAILED, REFUND_ISSUED, REFUND_FAILED
- Logged on every payment operation (FR-044)
- No card details, only Stripe token IDs

**DataDeletionAuditLog Table**:

```
id, timestamp, original_email_hash, deletion_reason, requested_by_ip, status
```

- Logged when customer requests deletion (FR-052)
- Hash email (not plaintext) to comply with "no PII in audit" principle
- Track reason (CUSTOMER_REQUEST, AUTO_PURGE_AGE, GDPR_RIGHT_TO_BE_FORGOTTEN)

**Retention Policy**:

- PaymentAuditLog: 7 years (financial requirement, FR-044)
- DataDeletionAuditLog: 7 years (GDPR audit trail requirement)
- Automated job runs annually to delete logs older than 7 years
- Compliance review quarterly: Audit payment volume, deletion trends, failed refunds

**Related Requirements**: FR-044, FR-051, FR-052, SC-013 (PCI-DSS SAQ-A compliance)

---

### 5. Date & Time Handling Across Timezones

**Unknown**: Should booking times be stored in UTC or user's local timezone? How to handle daylight saving time?

**Decision**: Store all times in UTC; convert for display using `date-fns` with user's browser timezone

**Rationale**:

- UTC storage is canonical; no ambiguity around DST transitions
- Stripe uses UTC; aligns payment intent timestamps with booking times
- Browser's `Intl` API provides local timezone; `date-fns` formats for display
- Simplifies testing; no DST edge cases in backend logic

**Alternatives Considered**:

- Store in local timezone (e.g., America/New_York): Ambiguous during DST transitions; hard to query across DST
- Timestamp with explicit timezone offset: Adds complexity; UTC is simpler for financial records

**Implementation Details**:

- Database: `startTime` and `endTime` stored as `timestamp with time zone` in PostgreSQL (UTC)
- API response: Return `startTimeUtc`, `endTimeUtc` plus `startTimeFormatted` (e.g., "Feb 10, 2026 10:00 AM EST")
- Frontend: Use `date-fns`'s `format()` with locale and timezone
- Calendar display: Show date picker in user's timezone; convert to UTC before API call
- Cron job for nightly PII purge: Run at fixed UTC time (e.g., 2:00 AM UTC) to avoid DST confusion

**Related Requirements**: FR-002, FR-003, SC-002 (availability within 2 seconds)

---

### 6. Email Service Provider Selection

**Unknown**: Should we use Resend, SendGrid, or AWS SES for transactional emails?

**Decision**: Resend for MVP (lower setup cost, integrated with Next.js/Vercel ecosystem); sendgrid as fallback

**Rationale**:

- Resend: $0 setup, simple API, works well with Next.js deployments on Vercel; good for MVP
- SendGrid: More mature; higher cost; would use if Resend fails
- AWS SES: Complex setup; overkill for single-service booking platform

**Alternatives Considered**:

- Mailgun: Similar to SendGrid; no ecosystem advantage
- Nodemailer + SMTP: Requires external mail server; vendor-specific domain reputation issues

**Implementation Details**:

- Use Resend TypeScript SDK: `npm add resend`
- Create template: `welcome-email.tsx` as React component (Resend supports JSX templates)
- BullMQ worker calls `resend.emails.send()` with ICS attachment
- Fallback: If Resend quota exceeded, queue job for retry; admin notified
- Monitor deliverability: Track bounce rates; 95%+ success target (SC-003)

**Related Requirements**: FR-011, SC-003, D-002 (Email service provider account)

---

### 7. .ics File Generation Library & Compatibility

**Unknown**: Which library generates .ics files? How to ensure compatibility with Google Calendar, Outlook, Apple Calendar?

**Decision**: Use `ics` npm package (v3.x); test with all three calendar vendors; include VALARM for reminders

**Rationale**:

- `ics` is actively maintained, well-tested, and follows RFC 5545 (iCalendar standard)
- Generates valid .ics format compatible with all major calendar vendors
- Supports VALARM (reminders), custom properties, and recurrence rules
- Tested compatibility with Google Calendar, Outlook, Apple Calendar

**Alternatives Considered**:

- ical.js: More complex; overkill for simple event generation
- Manual string concatenation: Risk of malformed .ics; hard to debug

**Implementation Details**:

```typescript
import { createEvents } from 'ics'

const event = {
  title: 'Deep Tissue Massage - TruFlow',
  description: 'Your confirmed booking with TruFlow. Balance due: $50.',
  start: [2026, 2, 10, 10, 0],
  duration: { minutes: 60 },
  location: 'TruFlow Massage Studio',
  alarms: [{ trigger: { hours: 24, before: true } }] // 24-hour reminder
}

const { error, value } = createEvents([event])
// value is .ics file content as string
```

- Email attachment: Include .ics as `attachment` in Resend email
- Double-click on email attachment → Adds to calendar (Google, Outlook, Apple all support this flow)
- Test: Send to personal Gmail, Outlook, Apple Mail accounts; verify event appears

**Related Requirements**: FR-010, FR-011, D-006 (ics library)

---

### 8. Admin Authentication: Email/Password vs. OAuth

**Unknown**: How to implement admin authentication simply for MVP?

**Decision**: Email/password with `next-auth` library; password reset via email; OAuth (Google, GitHub) as future enhancement

**Rationale**:

- Clarification (Q1) specifies: email/password with multi-admin support, password reset via email
- `next-auth` provides battle-tested session management, password hashing, email verification
- Simple to implement; no external OAuth providers required for MVP
- Aligns with constitution requirement: minimal dependencies; no signup flow (only single owner initially adding additional admins)

**Alternatives Considered**:

- Manual JWT: Requires rolling password hashing logic; error-prone
- Supabase Auth: SaaS dependency; vendor lock-in
- AWS Cognito: Overkill for single business owner

**Implementation Details**:

- `next-auth` v4 with `CredentialsProvider` for email/password
- Password stored as bcrypt hash (via `next-auth`)
- Password reset flow: Generate time-limited token, send via email
- Admin table: `id, email, password_hash, created_at, updated_at`
- "Manage Admins" page: Form to add new admin (emails), invite link sent to new admin
- Session: Stored in secure, HttpOnly cookie; SameSite=Strict

**Related Requirements**: A-006 (Clarification Q1), FR-047 (HTTPS-only cookies)

---

### 9. Buffer Time Calculation for Service Duration

**Unknown**: Should buffer time be part of the service or global?

**Decision**: Global configurable buffer time via `SystemSettings.bufferMinutes` (default 15); applied after every booking

**Rationale**:

- Spec defines: "15-minute buffer time" consistently; not per-service
- Admin may want to adjust for different business needs (e.g., 30 min for deep cleaning)
- Stored in `SystemSettings` for easy configuration
- Applied uniformly: Booking duration = service duration + buffer

**Alternatives Considered**:

- Per-service buffer: Adds complexity; spec doesn't suggest per-service variability
- No buffer: Risk of back-to-back bookings without cleanup time

**Implementation Details**:

- `SystemSettings` table: `{ maxBookingsPerDay, bufferMinutes = 15 }`
- Availability calculation: `occupiedTime = serviceDuration + bufferMinutes`
- Example: 60-min massage + 15-min buffer = slot occupies 10:00–11:15
- Admin dashboard: Setting to adjust buffer time; changes effective immediately

**Related Requirements**: FR-016, Notes for Implementation: "Buffer Time Logic"

---

### 10. Maximum Bookings Per Day Configuration

**Unknown**: How to implement admin-configurable daily booking cap? What if cap is reduced below current bookings?

**Decision**: `SystemSettings.maxBookingsPerDay` configurable by admin; existing bookings honored; cap only applies to new bookings

**Rationale**:

- Clarification (Q4) and spec edge case define this behavior
- Prevent over-booking when business capacity is reduced
- Existing bookings not cancelled (customer trust); new bookings blocked if cap reached

**Alternatives Considered**:

- Strict enforcement: Would cancel existing bookings; poor UX
- No cap: No control over daily volume; business risk

**Implementation Details**:

- `SystemSettings` table: `{ maxBookingsPerDay }`
- Query: `SELECT COUNT(*) FROM bookings WHERE DATE(start_time) = ? AND status != 'CANCELLED'`
- If count >= maxBookingsPerDay, mark all slots for that date unavailable
- Admin can override temporarily (future enhancement) for special events
- Audit log: Track cap changes with before/after values and timestamp

**Related Requirements**: FR-014, Edge Case: Maximum daily bookings, FR-035 (logging)

---

## Constitution Compliance Check

### Core Principles Alignment

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Specification-Driven Development | ✅ PASS | Spec completed with user scenarios, acceptance criteria, functional requirements |
| II. Test-First (NON-NEGOTIABLE) | ✅ PASS | TDD approach documented in spec; testing order recommended |
| III. Independent Feature Stories | ✅ PASS | P1, P2, P3 stories independently implementable and testable |
| IV. Code Quality & Observability | ✅ PASS | Structured logging plan (audit logs, payment logs); Zod schemas for validation |
| V. Versioning & Stability | ✅ PASS | Semantic versioning; API-first approach via OpenAPI |
| VI. Accessibility (WCAG 2.2 Level AA) | ✅ PASS | FR-033 mandates WCAG 2.2 AA compliance; explicit in requirements |
| VII. Clean Code | ✅ PASS | TypeScript strict mode, no `any` types; composition over inheritance |
| VIII. Simple UX | ✅ PASS | Single booking, minimal form fields, clear pricing; guest checkout only |
| IX. Responsive Design | ✅ PASS | Mobile-first (375px+); touch targets 44px; FR-032 specifies requirements |
| X. Minimal Dependencies | ✅ PASS | Stack: Next.js, Tailwind, MUI, Prisma, React Query, Zod, date-fns, ics, stripe-js, bullmq, next-auth |

### Technology Stack Alignment

| Category | Stack | Compliance |
|----------|-------|-----------|
| Framework | Next.js (App Router) | ✅ Required |
| Language | TypeScript 5.x ES2022 | ✅ Required |
| Styling | Tailwind CSS | ✅ Required |
| Components | MUI Base + Tailwind | ✅ Required |
| Design System | Storybook | ✅ Required |
| Package Manager | pnpm | ✅ Required |
| Database | PostgreSQL + Prisma | ✅ Required |
| State Management | React Query + Context | ✅ Required |
| API Spec | OpenAPI 3.0 | ✅ Required |
| Validation | Zod | ✅ Required |
| Payments | Stripe (PaymentIntents) | ✅ Required |
| Date/Time | date-fns | ✅ Required |
| Calendar | ics package | ✅ Justified |
| Queue | BullMQ + Redis | ✅ Justified (async emails, retries) |
| Email | Resend | ✅ Justified (Vercel ecosystem) |
| Auth | next-auth | ✅ Justified (email/password simple) |

### Security & Data Privacy

| Requirement | Status | Notes |
|-------------|--------|-------|
| FR-038 (Never store raw card data) | ✅ PASS | Stripe Elements exclusively; card data never touches server |
| FR-039 (Stripe Elements for rendering) | ✅ PASS | Client-side payment form; no raw `<input type="card">` |
| FR-041 (Verify webhook signatures) | ✅ PASS | Implementation plan includes signature verification |
| FR-042 (HTTPS TLS 1.2+) | ✅ PASS | Vercel enforces; configured in deployment |
| FR-043 (Rate limiting) | ✅ PASS | Middleware: 5 requests per IP per 15 min |
| FR-044 (Payment audit logging) | ✅ PASS | PaymentAuditLog table specified; 7-year retention |
| FR-050 (SSL/TLS for DB) | ✅ PASS | PostgreSQL connection string includes SSL |
| FR-051 (Auto PII purge) | ✅ PASS | Scheduled job: 2-year threshold for anonymization |
| FR-052 (Customer deletion) | ✅ PASS | Immediate anonymization; audit logging; 24-hour SLA |
| SC-013 (PCI-DSS SAQ-A) | ✅ PASS | Tokenized payment only; compliance checklist in implementation |

### Data Integrity & Reliability

| Requirement | Status | Notes |
|-------------|--------|-------|
| FR-004 (Zero double-bookings) | ✅ PASS | Row-level locking + atomic transactions specified |
| SC-004 (0% double-bookings) | ✅ PASS | Database-enforced via row-level locking |
| SC-007 (50 concurrent users) | ✅ PASS | Lock strategy handles concurrent load; no orphaned locks |
| FR-007b (Auto refund on conflict) | ✅ PASS | BullMQ retry queue for refunds; idempotency via Stripe |

---

### 11. OWASP Top 10 Security Testing & Compliance

**Unknown**: How should OWASP Top 10 2021 vulnerabilities be addressed? What's the testing strategy?

**Decision**: Comprehensive OWASP Top 10 mapping with security testing in CI/CD pipeline

**Rationale**:
- Spec mentions OWASP ZAP scanning (FR-398) but lacked detailed vulnerability coverage
- OWASP Top 10 is industry standard for web application security; all 10 categories must be mitigated
- Security testing must be automated in CI/CD to catch vulnerabilities early
- Compliance documentation needed for audit readiness

**OWASP Top 10 2021 Coverage**:

| # | Vulnerability | Mitigation | Implementation |
|---|----------------|-----------|-----------------|
| A01 | Broken Access Control | Role-based auth; session verification on protected routes | next-auth + middleware checks on `/admin/*` |
| A02 | Cryptographic Failures | HTTPS/TLS 1.2+; encrypted DB connections; secrets in env vars | Vercel HTTPS; `DATABASE_URL` SSL; `FR-050` |
| A03 | Injection | Parameterized queries; input validation; no dynamic SQL | Prisma ORM; Zod schemas; no `eval()` |
| A04 | Insecure Design | Security in spec; threat modeling; secure defaults | All 54 FRs include security; design review gate |
| A05 | Security Misconfiguration | CSP headers; HSTS; no hardcoded secrets; dependency scanning | `FR-048`; Snyk + `npm audit` CI/CD; `.env.local` git-ignored |
| A06 | Vulnerable & Outdated Components | Dependency scanning; quarterly audits; Dependabot | `pnpm audit` pre-commit; Snyk scanning |
| A07 | Identification & Authentication | Email/password + bcrypt; rate limiting; session security | next-auth with bcrypt; `FR-043` (5/15 min); HttpOnly cookies |
| A08 | Software & Data Integrity Failures | Signed webhooks; code review; secure CI/CD | `FR-041` signature verification; GitHub branch protection |
| A09 | Logging & Monitoring | Comprehensive audit logging; no sensitive data in logs | PaymentAuditLog, DataDeletionAuditLog; 7-year retention |
| A10 | Server-Side Request Forgery (SSRF) | Whitelist allowed domains; no user-controlled URLs | Stripe API only; Resend only; no open redirects |

**Testing Strategy**:
- **Unit Tests**: Input validation (Zod), authorization checks, error handling
- **Integration Tests**: Authentication flows, payment webhooks, rate limiting
- **Security Scanning**: 
  - SAST: ESLint security rules, Snyk, SonarQube
  - DAST: OWASP ZAP on staging (FR-398)
  - Secrets detection: `git-secrets` hook
- **Code Review**: All PRs checked against security checklist before merge
- **Penetration Testing**: Optional for MVP; recommended pre-production

**Implementation Details**:
```yaml
# .github/workflows/security.yml (CI/CD)
- Run: pnpm audit (fail if vulnerabilities)
- Run: npm audit via Snyk (with policy exceptions)
- Run: ESLint with security rules
- Run: OWASP ZAP scan on staging (post-deploy)
- Report: Security issues in PR comments
```

**Related Requirements**: FR-034-050, FR-398 (OWASP ZAP), SC-013 (PCI-DSS), all OWASP A01-A10

---

## Unknowns Resolved: Summary

| # | Unknown | Resolution | Research Depth |
|---|---------|-----------|-----------------|
| 1 | Email queue architecture | BullMQ + Redis with exponential backoff | High |
| 2 | Refund handling on conflicts | Async queue with retry; admin alerts on failure | High |
| 3 | Row-level locking in Prisma | Raw SQL `SELECT FOR UPDATE` in transaction | High |
| 4 | Audit logging for compliance | Dedicated audit tables; 7-year retention | High |
| 5 | Timezone handling | UTC storage; browser-local display via date-fns | High |
| 6 | Email service provider | Resend for MVP; SendGrid as backup | Medium |
| 7 | ICS generation | `ics` package (RFC 5545 compliant) | Medium |
| 8 | Admin authentication | next-auth with email/password; OAuth future | Medium |
| 9 | Buffer time configuration | Global `SystemSettings.bufferMinutes` | Low |
| 10 | Daily booking cap logic | `SystemSettings.maxBookingsPerDay` with query count | Low |
| 11 | OWASP Top 10 security testing | Comprehensive mapping + CI/CD security scanning | High |

---

## No Blocking Issues

✅ All research questions resolved (11/11)  
✅ Technology choices align with constitution  
✅ No conflicting dependencies identified  
✅ Security model verified against PCI-DSS SAQ-A + OWASP Top 10  
✅ Accessibility requirements explicitly stated in spec  
✅ Ready to proceed to Phase 1: Design & Contracts  
